import api from "@/lib/api"

export interface BusinessSettings {
  id: number
  company_id: number
  salary_cycle: string
  workday_start: string
  workday_end: string
  annual_leave_days: number
  sick_leave_days: number
  overtime_rate: number
  currency: string
  created_at: Date
  updated_at: Date
}

// Update the DEFAULT_SETTINGS to match the original implementation's format
const DEFAULT_SETTINGS: BusinessSettings = {
  id: 1,
  company_id: 1,
  salary_cycle: "Monthly",
  workday_start: "09:00:00",
  workday_end: "17:00:00",
  overtime_rate: 1.5,
  annual_leave_days: 15,
  sick_leave_days: 10,
  currency: "USD",
  created_at: new Date(),
  updated_at: new Date(),
}

class BusinessSettingsService {
  private settings: BusinessSettings | null = null
  private loading = false
  private listeners: Array<() => void> = []
  private fetchFailed = false
  private retryTimeout: NodeJS.Timeout | null = null

  // Add localStorage support to persist settings between sessions
  private saveToLocalStorage() {
    if (typeof window !== "undefined" && this.settings) {
      try {
        localStorage.setItem("business-settings", JSON.stringify(this.settings))
      } catch (error) {
        console.error("Failed to save settings to localStorage:", error)
      }
    }
  }

  private loadFromLocalStorage(): BusinessSettings | null {
    if (typeof window !== "undefined") {
      try {
        const savedSettings = localStorage.getItem("business-settings")
        if (savedSettings) {
          return JSON.parse(savedSettings)
        }
      } catch (error) {
        console.error("Failed to load settings from localStorage:", error)
      }
    }
    return null
  }

  // Update the constructor to load from localStorage
  constructor() {
    // Try to load settings from localStorage on initialization
    const savedSettings = this.loadFromLocalStorage()
    if (savedSettings) {
      this.settings = savedSettings
    }
  }

  // Update the fetchSettings method to try the original endpoint first
  async fetchSettings(): Promise<BusinessSettings> {
    // If we've already tried and failed, don't keep hammering the server
    if (this.fetchFailed) {
      console.log("Using default settings because previous fetch failed")
      return DEFAULT_SETTINGS
    }

    if (this.loading) {
      // Wait for the current fetch to complete
      return new Promise((resolve) => {
        const checkInterval = setInterval(() => {
          if (!this.loading) {
            clearInterval(checkInterval)
            resolve(this.settings || DEFAULT_SETTINGS)
          }
        }, 100)
      })
    }

    if (this.settings) {
      return this.settings
    }

    this.loading = true

    try {
      // First try the original endpoint format
      const response = await api.get("/business-settings")

      // Check if we have company settings in the response
      const user = (window as any)?.store?.getState()?.auth?.user
      const companySetting = response.data.find((s: any) => s.company_id === user?.company_id)

      if (companySetting) {
        this.settings = {
          ...companySetting,
          // Format time values to ensure consistency
          workday_start: companySetting.workday_start,
          workday_end: companySetting.workday_end,
          // Ensure numeric values
          overtime_rate: Number.parseFloat(companySetting.overtime_rate),
          annual_leave_days: Number(companySetting.annual_leave_days),
          sick_leave_days: Number(companySetting.sick_leave_days),
        }
      } else {
        // If no company setting found, try the /me endpoint
        const meResponse = await api.get("/business-settings/me")
        this.settings = meResponse.data
      }

      this.fetchFailed = false
      return this.settings as BusinessSettings
    } catch (error) {
      console.error("Failed to fetch business settings:", error)
      // Mark as failed to prevent continuous retries
      this.fetchFailed = true

      // Schedule a single retry after 30 seconds
      if (this.retryTimeout) {
        clearTimeout(this.retryTimeout)
      }

      this.retryTimeout = setTimeout(() => {
        this.fetchFailed = false
        this.retryTimeout = null
      }, 30000)

      // Return default settings if API call fails
      return DEFAULT_SETTINGS
    } finally {
      this.loading = false
      this.notifyListeners()
    }
  }

  // Get settings (from cache or fetch if not available)
  async getSettings(): Promise<BusinessSettings> {
    if (this.settings) {
      return this.settings as BusinessSettings
    }
    return this.fetchSettings()
  }

  // Update business settings
  async updateSettings(data: Partial<BusinessSettings>): Promise<BusinessSettings> {
    try {
      // If the endpoint doesn't exist yet, simulate success with local data
      if (this.fetchFailed) {
        this.settings = {
          ...DEFAULT_SETTINGS,
          ...this.settings,
          ...data,
          updated_at: new Date(),
        }

        // Save to localStorage
        this.saveToLocalStorage()

        setTimeout(() => {
          this.notifyListeners()
        }, 0)

        return this.settings
      }

      const response = await api.put("/business-settings/me", data)
      this.settings = response.data

      // Save to localStorage
      this.saveToLocalStorage()

      setTimeout(() => {
        this.notifyListeners()
      }, 0)

      return this.settings as BusinessSettings
    } catch (error) {
      console.error("Failed to update business settings:", error)

      // If the endpoint doesn't exist, update local settings anyway
      if ((error as any).response?.status === 404) {
        this.fetchFailed = true
        this.settings = {
          ...DEFAULT_SETTINGS,
          ...this.settings,
          ...data,
          updated_at: new Date(),
        }

        // Save to localStorage
        this.saveToLocalStorage()

        setTimeout(() => {
          this.notifyListeners()
        }, 0)

        return this.settings
      }

      throw error
    }
  }

  // Subscribe to settings changes
  subscribe(callback: () => void): () => void {
    this.listeners.push(callback)
    return () => {
      this.listeners = this.listeners.filter((listener) => listener !== callback)
    }
  }

  // Notify all listeners of settings changes
  private notifyListeners() {
    // Use setTimeout to break potential circular dependencies
    setTimeout(() => {
      this.listeners.forEach((listener) => listener())
    }, 0)
  }

  // Helper methods for attendance calculations
  isLate(checkInTime: string): boolean {
    if (!checkInTime) return false
    const settings = this.settings || DEFAULT_SETTINGS

    const [workHours, workMinutes] = settings.workday_start.split(":").map(Number)
    const [checkHours, checkMinutes] = checkInTime.split(":").map(Number)

    if (checkHours > workHours) return true
    if (checkHours === workHours && checkMinutes > workMinutes) return true

    return false
  }

  isIncompleteDay(checkInTime: string, checkOutTime: string): boolean {
    if (!checkInTime || !checkOutTime) return true
    const settings = this.settings || DEFAULT_SETTINGS

    const [workEndHours, workEndMinutes] = settings.workday_end.split(":").map(Number)
    const [checkOutHours, checkOutMinutes] = checkOutTime.split(":").map(Number)

    // Check if checkout is before workday end
    if (checkOutHours < workEndHours) return true
    if (checkOutHours === workEndHours && checkOutMinutes < workEndMinutes) return true

    return false
  }

  calculateExpectedHours(): number {
    const settings = this.settings || DEFAULT_SETTINGS

    const [startHours, startMinutes] = settings.workday_start.split(":").map(Number)
    const [endHours, endMinutes] = settings.workday_end.split(":").map(Number)

    let hours = endHours - startHours
    let minutes = endMinutes - startMinutes

    if (minutes < 0) {
      hours -= 1
      minutes += 60
    }

    return hours + minutes / 60
  }

  calculateOvertimePay(regularHours: number, overtimeHours: number, hourlyRate: number): number {
    const settings = this.settings || DEFAULT_SETTINGS
    return overtimeHours * hourlyRate * settings.overtime_rate
  }

  formatCurrency(amount: number): string {
    const settings = this.settings || DEFAULT_SETTINGS
    return new Intl.NumberFormat("en-US", { style: "currency", currency: settings.currency }).format(amount)
  }

  // Add a method to check if we're using default settings
  isUsingDefaults(): boolean {
    return this.fetchFailed
  }
}

// Create a singleton instance
const businessSettingsService = new BusinessSettingsService()
export default businessSettingsService
