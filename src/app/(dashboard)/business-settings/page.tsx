"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useSelector } from "react-redux"
import type { RootState } from "@/lib/redux/store"
import ProtectedRoute from "@/components/ProtectedRoute"
import { toast } from "react-toastify"
import { ArrowLeft, Clock, DollarSign, Calendar, Save, Percent } from "lucide-react"
import Link from "next/link"
import businessSettingsService from "@/lib/services/business-settings.service"
import type { BusinessSettings } from "@/lib/services/business-settings.service"

export default function BusinessSettingsPage() {
  const { user } = useSelector((state: RootState) => state.auth)
  const [settings, setSettings] = useState<Partial<BusinessSettings>>({
    workday_start: "09:00:00",
    workday_end: "17:00:00",
    overtime_rate: 1.5,
    annual_leave_days: 15,
    sick_leave_days: 10,
    currency: "USD",
    salary_cycle: "Monthly",
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [usingDefaults, setUsingDefaults] = useState(false)

  // Check if user is HR or owner (can manage settings)
  const isManager = user?.role_id === 2 || user?.role_id === 3

  // Fetch business settings
  useEffect(() => {
    if (!user) return

    let isMounted = true

    const fetchSettings = async () => {
      setLoading(true)
      try {
        const fetchedSettings = await businessSettingsService.getSettings()
        if (isMounted) {
          setSettings({
            ...fetchedSettings,
            workday_start: fetchedSettings.workday_start.slice(0, 5),
            workday_end: fetchedSettings.workday_end.slice(0, 5),
          })

          // Check if we're using default settings
          setUsingDefaults(businessSettingsService.isUsingDefaults())
          if (businessSettingsService.isUsingDefaults() && isMounted) {
            toast.info("Using default settings. Changes will be saved when the server is available.", {
              autoClose: 5000,
            })
          }
        }
      } catch (error) {
        console.error("Failed to fetch business settings:", error)
        if (isMounted) {
          toast.error("Failed to load business settings")
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    fetchSettings()

    return () => {
      isMounted = false
    }
  }, [user])

  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target

    // Convert numeric values
    let parsedValue: string | number = value
    if (name === "overtime_rate") {
      parsedValue = value === "" ? 1.5 : Number.parseFloat(value)
    } else if (name === "annual_leave_days" || name === "sick_leave_days") {
      parsedValue = value === "" ? 0 : Number.parseInt(value)
    }

    setSettings((prev) => ({
      ...prev,
      [name]: parsedValue,
    }))

    setHasChanges(true)
  }

  // Save settings
  const handleSave = async () => {
    if (!isManager) {
      toast.error("You don't have permission to update business settings")
      return
    }

    setSaving(true)
    try {
      // Format time values to include seconds for API
      const formattedSettings = {
        ...settings,
        workday_start: `${settings.workday_start}:00`,
        workday_end: `${settings.workday_end}:00`,
      }

      await businessSettingsService.updateSettings(formattedSettings)

      if (businessSettingsService.isUsingDefaults()) {
        toast.success("Settings saved locally. They will be synced when the server is available.")
      } else {
        toast.success("Business settings updated successfully")
      }

      setHasChanges(false)
    } catch (error) {
      console.error("Failed to update business settings:", error)
      toast.error("Failed to update business settings")
    } finally {
      setSaving(false)
    }
  }

  // Available currencies
  const currencies = [
    { code: "USD", name: "US Dollar" },
    { code: "EUR", name: "Euro" },
    { code: "GBP", name: "British Pound" },
    { code: "LBP", name: "Lebanese Pound" },
    { code: "JPY", name: "Japanese Yen" },
    { code: "CAD", name: "Canadian Dollar" },
    { code: "AUD", name: "Australian Dollar" },
    { code: "CHF", name: "Swiss Franc" },
    { code: "CNY", name: "Chinese Yuan" },
    { code: "INR", name: "Indian Rupee" },
  ]

  // Salary cycles
  const salaryCycles = [
    { value: "Monthly", label: "Monthly" },
    { value: "Bi-Weekly", label: "Bi-Weekly" },
    { value: "Weekly", label: "Weekly" },
  ]

  return (
    <ProtectedRoute>
      <main className="min-h-screen bg-[#FAF9F7] text-gray-900">
        <div className="mx-auto max-w-4xl p-4 md:p-6 lg:p-8">
          <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <div className="flex items-center">
               
                <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">Business Settings</h1>
              </div>
              <p className="mt-1 text-gray-500">
                Configure company-wide settings for attendance, salaries, and leave management
              </p>
            </div>
          </div>

          {!isManager ? (
            <div className="rounded-xl border border-yellow-100 bg-yellow-50 p-6 text-center">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 text-yellow-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <h3 className="mb-2 text-lg font-medium text-yellow-800">Access Restricted</h3>
              <p className="text-yellow-700">
                You don't have permission to view or modify business settings. Please contact an administrator.
              </p>
              <div className="mt-6">
                <Link
                  href="/"
                  className="inline-flex items-center rounded-lg bg-yellow-600 px-4 py-2 text-white transition-colors hover:bg-yellow-700"
                >
                  <ArrowLeft size={16} className="mr-2" />
                  Return to Dashboard
                </Link>
              </div>
            </div>
          ) : loading ? (
            <div className="flex h-64 items-center justify-center">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#6148F4] border-t-transparent"></div>
            </div>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault()
                handleSave()
              }}
              className="space-y-6 rounded-xl border border-gray-200 bg-white p-6 shadow-xl"
            >
              {usingDefaults && (
                <div className="rounded-lg bg-blue-50 p-4 text-sm text-blue-800">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p>
                        <span className="font-medium">Note:</span> Using default settings. Changes will be saved locally
                        and synced when the server is available.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label htmlFor="salary_cycle" className="mb-1.5 block text-sm font-medium text-gray-700">
                  Salary Cycle
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Calendar size={18} className="text-gray-400" />
                  </div>
                  <select
                    id="salary_cycle"
                    name="salary_cycle"
                    value={settings.salary_cycle || "Monthly"}
                    onChange={handleChange}
                    className="block w-full appearance-none rounded-lg border border-gray-300 bg-white py-2.5 pl-10 pr-10 shadow-sm transition-all focus:border-[#6148F4] focus:outline-none focus:ring-2 focus:ring-[#6148F4]/20"
                  >
                    {salaryCycles.map((cycle) => (
                      <option key={cycle.value} value={cycle.value}>
                        {cycle.label}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                    <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="workday_start" className="mb-1.5 block text-sm font-medium text-gray-700">
                    Workday Start Time
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <Clock size={18} className="text-gray-400" />
                    </div>
                    <input
                      type="time"
                      id="workday_start"
                      name="workday_start"
                      value={settings.workday_start || "09:00"}
                      onChange={handleChange}
                      className="block w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-3 shadow-sm transition-all focus:border-[#6148F4] focus:outline-none focus:ring-2 focus:ring-[#6148F4]/20"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="workday_end" className="mb-1.5 block text-sm font-medium text-gray-700">
                    Workday End Time
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <Clock size={18} className="text-gray-400" />
                    </div>
                    <input
                      type="time"
                      id="workday_end"
                      name="workday_end"
                      value={settings.workday_end || "17:00"}
                      onChange={handleChange}
                      className="block w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-3 shadow-sm transition-all focus:border-[#6148F4] focus:outline-none focus:ring-2 focus:ring-[#6148F4]/20"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="annual_leave_days" className="mb-1.5 block text-sm font-medium text-gray-700">
                    Annual Leave Days
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <Calendar size={18} className="text-gray-400" />
                    </div>
                    <input
                      type="number"
                      id="annual_leave_days"
                      name="annual_leave_days"
                      value={settings.annual_leave_days || 15}
                      onChange={handleChange}
                      min="0"
                      className="block w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-3 shadow-sm transition-all focus:border-[#6148F4] focus:outline-none focus:ring-2 focus:ring-[#6148F4]/20"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="sick_leave_days" className="mb-1.5 block text-sm font-medium text-gray-700">
                    Sick Leave Days
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <Calendar size={18} className="text-gray-400" />
                    </div>
                    <input
                      type="number"
                      id="sick_leave_days"
                      name="sick_leave_days"
                      value={settings.sick_leave_days || 10}
                      onChange={handleChange}
                      min="0"
                      className="block w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-3 shadow-sm transition-all focus:border-[#6148F4] focus:outline-none focus:ring-2 focus:ring-[#6148F4]/20"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="overtime_rate" className="mb-1.5 block text-sm font-medium text-gray-700">
                    Overtime Rate Multiplier
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <Percent size={18} className="text-gray-400" />
                    </div>
                    <input
                      type="number"
                      id="overtime_rate"
                      name="overtime_rate"
                      value={settings.overtime_rate || 1.5}
                      onChange={handleChange}
                      min="1"
                      step="0.1"
                      className="block w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-3 shadow-sm transition-all focus:border-[#6148F4] focus:outline-none focus:ring-2 focus:ring-[#6148F4]/20"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="currency" className="mb-1.5 block text-sm font-medium text-gray-700">
                    Currency
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <DollarSign size={18} className="text-gray-400" />
                    </div>
                    <select
                      id="currency"
                      name="currency"
                      value={settings.currency || "USD"}
                      onChange={handleChange}
                      className="block w-full appearance-none rounded-lg border border-gray-300 bg-white py-2.5 pl-10 pr-10 shadow-sm transition-all focus:border-[#6148F4] focus:outline-none focus:ring-2 focus:ring-[#6148F4]/20"
                    >
                      {currencies.map((currency) => (
                        <option key={currency.code} value={currency.code}>
                          {currency.code} - {currency.name}
                        </option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                      <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={saving || !hasChanges}
                className="flex w-full items-center justify-center rounded-lg bg-[#6148F4] py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#5040d3] focus:outline-none focus:ring-2 focus:ring-[#6148F4]/50 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {saving ? (
                  <>
                    <svg
                      className="-ml-1 mr-2 h-4 w-4 animate-spin text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={16} className="mr-2" />
                    Save Settings
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </main>
    </ProtectedRoute>
  )
}
