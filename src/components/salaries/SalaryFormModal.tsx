"use client"

import { useState, useEffect } from "react"
import api from "@/lib/api"
import { toast } from "react-toastify"
import { X, DollarSign, Calendar, User, Clock, Calculator, Briefcase, ChevronDown, Info } from "lucide-react"
import businessSettingsService from "@/lib/services/business-settings.service"
import type { BusinessSettings } from "@/lib/services/business-settings.service"
import type { AxiosError } from "axios"

interface SalaryFormModalProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  initialSalary?: any
  generateFromAttendance?: boolean
}

// Define error response interface
interface ErrorResponse {
  message?: string | string[]
  statusCode?: number
  error?: string
}

// Define attendance summary interface
interface AttendanceSummary {
  totalWorkedHours: number
  expectedHours: number
  workedDays: number
  workday_start: string
  workday_end: string
}

export default function SalaryFormModal({
  open,
  onClose,
  onSuccess,
  initialSalary,
  generateFromAttendance = false,
}: SalaryFormModalProps) {
  const [userId, setUserId] = useState<number | "">("")
  const [baseSalary, setBaseSalary] = useState("")
  const [bonus, setBonus] = useState("0")
  const [overtime, setOvertime] = useState("0")
  const [overtimeHours, setOvertimeHours] = useState("0")
  const [deductions, setDeductions] = useState("0")
  const [month, setMonth] = useState<number | "">("")
  const [year, setYear] = useState<number | "">("")
  const [effectiveFrom, setEffectiveFrom] = useState("")
  const [status, setStatus] = useState("pending")
  const [employees, setEmployees] = useState<any[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [businessSettings, setBusinessSettings] = useState<BusinessSettings | null>(null)
  const [settingsLoading, setSettingsLoading] = useState(true)
  const [isGeneratingFromAttendance, setIsGeneratingFromAttendance] = useState(false)
  const [attendanceSummary, setAttendanceSummary] = useState<AttendanceSummary | null>(null)

  // Fetch business settings
  useEffect(() => {
    if (!open) return

    const fetchSettings = async () => {
      try {
        const settings = await businessSettingsService.getSettings()
        setBusinessSettings(settings)
      } catch (error) {
        console.error("Failed to load business settings:", error)
      } finally {
        setSettingsLoading(false)
      }
    }

    fetchSettings()
  }, [open])

  useEffect(() => {
    if (!open) return

    const fetchEmployees = async () => {
      try {
        const res = await api.get("/users")
        setEmployees(res.data)
      } catch (error) {
        console.error("Failed to load employees", error)
        toast.error("Failed to load employees")
      }
    }

    fetchEmployees()
  }, [open])

  useEffect(() => {
    if (initialSalary) {
      setUserId(initialSalary.user_id || "")
      setBaseSalary(initialSalary.base_salary?.toString() || "")
      setBonus(initialSalary.bonus?.toString() || "0")
      setOvertime(initialSalary.overtime?.toString() || "0")
      setOvertimeHours(initialSalary.overtime_hours?.toString() || "0")
      setDeductions(initialSalary.deductions?.toString() || "0")
      setMonth(initialSalary.month || "")
      setYear(initialSalary.year || "")

      // Format the date properly for the input field (YYYY-MM-DD)
      if (initialSalary.effective_from) {
        try {
          // Handle different date formats
          const date = new Date(initialSalary.effective_from)
          if (!isNaN(date.getTime())) {
            // Format as YYYY-MM-DD for the input field
            const formattedDate = date.toISOString().split("T")[0]
            setEffectiveFrom(formattedDate)
          } else {
            setEffectiveFrom("")
          }
        } catch (e) {
          console.error("Invalid date format:", initialSalary.effective_from)
          setEffectiveFrom("")
        }
      } else {
        setEffectiveFrom("")
      }

      setStatus(initialSalary.status || "pending")
    } else {
      // Set default values for new salary record
      setUserId("")
      setBaseSalary("")
      setBonus("0")
      setOvertime("0")
      setOvertimeHours("0")
      setDeductions("0")
      setMonth("")
      setYear("")
      setEffectiveFrom("")
      setStatus("pending")
    }
  }, [initialSalary])

  // Calculate overtime pay based on hours and business settings
  useEffect(() => {
    if (businessSettings && overtimeHours && baseSalary) {
      const hours = Number(overtimeHours)
      const hourlyRate = Number(baseSalary) / 160 // Assuming 160 working hours per month
      const overtimePay = hours * hourlyRate * businessSettings.overtime_rate
      setOvertime(overtimePay.toFixed(2))
    }
  }, [overtimeHours, baseSalary, businessSettings])

  // Auto-trigger generate from attendance when opened with that flag
  useEffect(() => {
    if (open && generateFromAttendance && userId && month && year && baseSalary) {
      generateFromAttendanceData()
    }
  }, [open, generateFromAttendance, userId, month, year, baseSalary])

  // Generate salary adjustments from attendance data
  const generateFromAttendanceData = async () => {
    if (!userId) {
      toast.error("Please select an employee first")
      return
    }

    if (!month || !year) {
      toast.error("Please select month and year first")
      return
    }

    if (!baseSalary || Number(baseSalary) <= 0) {
      toast.error("Please enter a valid base salary first")
      return
    }

    setIsGeneratingFromAttendance(true)

    try {
      const response = await api.get(`/attendance/summary/${userId}?month=${month}&year=${year}`)
      const summary: AttendanceSummary = response.data
      setAttendanceSummary(summary)

      // Calculate hourly rate based on base salary (assuming 160 hours per month)
      const hourlyRate = Number(baseSalary) / 160

      // Calculate the difference between worked hours and expected hours
      const hoursDifference = summary.totalWorkedHours - summary.expectedHours

      if (hoursDifference > 0) {
        // Employee worked more than expected - update bonus
        const additionalPay = hoursDifference * hourlyRate
        setBonus(additionalPay.toFixed(2))
        setDeductions("0")
        toast.success(
          `Added ${formatCurrency(additionalPay.toFixed(2))} bonus for ${hoursDifference.toFixed(1)} extra hours worked`,
        )
      } else if (hoursDifference < 0) {
        // Employee worked less than expected - update deductions
        const deductionAmount = Math.abs(hoursDifference) * hourlyRate
        setDeductions(deductionAmount.toFixed(2))
        setBonus("0")
        toast.info(
          `Added ${formatCurrency(deductionAmount.toFixed(2))} deduction for ${Math.abs(hoursDifference).toFixed(1)} hours short`,
        )
      } else {
        // Employee worked exactly as expected
        toast.success("Employee worked exactly the expected hours. No adjustments needed.")
      }
    } catch (error) {
      console.error("Failed to fetch attendance summary:", error)
      toast.error("Failed to generate from attendance data")
    } finally {
      setIsGeneratingFromAttendance(false)
    }
  }

  // Update the handleSubmit function to ensure all fields are properly typed and included
  const handleSubmit = async () => {
    // Validate required fields
    if (!userId) {
      toast.error("Employee is required")
      return
    }

    if (!baseSalary) {
      toast.error("Base salary is required")
      return
    }

    if (!month || !year) {
      toast.error("Month and year are required")
      return
    }

    if (!effectiveFrom) {
      toast.error("Effective date is required")
      return
    }

    setIsSubmitting(true)

    try {
      // Format the date properly for the API (YYYY-MM-DD)
      // This ensures the date is in the format expected by the backend
      let formattedDate = effectiveFrom

      // If the date is already in YYYY-MM-DD format, use it as is
      // Otherwise, try to format it
      if (effectiveFrom && !effectiveFrom.match(/^\d{4}-\d{2}-\d{2}$/)) {
        try {
          const date = new Date(effectiveFrom)
          if (!isNaN(date.getTime())) {
            formattedDate = date.toISOString().split("T")[0]
          }
        } catch (e) {
          console.error("Invalid date format:", effectiveFrom)
          toast.error("Invalid date format")
          setIsSubmitting(false)
          return
        }
      }

      // Ensure all numeric fields are properly converted to numbers
      // Use parseFloat for decimal values to maintain precision
      const payload = {
        user_id: Number(userId),
        base_salary: Number.parseFloat(baseSalary) || 0,
        bonus: Number.parseFloat(bonus) || 0,
        overtime: Number.parseFloat(overtime) || 0,
        overtime_hours: Number.parseFloat(overtimeHours) || 0,
        deductions: Number.parseFloat(deductions) || 0,
        month: Number(month),
        year: Number(year),
        effective_from: formattedDate,
        status,
      }

      console.log("Submitting salary data:", payload)

      if (initialSalary) {
        // When editing, ensure we include all fields from the original record
        // to prevent any fields from being removed
        const editPayload = {
          ...initialSalary, // Include all original fields
          ...payload, // Override with new values
          // Ensure ID is not modified
          id: initialSalary.id,
          // Make sure these fields are explicitly included and properly typed
          user_id: Number(payload.user_id),
          base_salary: Number.parseFloat(payload.base_salary.toString()),
          bonus: Number.parseFloat(payload.bonus.toString()),
          overtime: Number.parseFloat(payload.overtime.toString()),
          overtime_hours: Number.parseFloat(payload.overtime_hours.toString()),
          deductions: Number.parseFloat(payload.deductions.toString()),
          month: Number(payload.month),
          year: Number(payload.year),
          effective_from: payload.effective_from,
          status: payload.status,
        }

        // Remove any fields that should be handled by the backend
        delete editPayload.user
        delete editPayload.file_url
        delete editPayload.payslip_requested

        await api.patch(`/salaries/${initialSalary.id}`, editPayload)
        toast.success("Salary record updated successfully")
      } else {
        await api.post("/salaries", payload)
        toast.success("Salary record created successfully")
      }

      onSuccess()
    } catch (error) {
      console.error("Failed to save salary record:", error)

      // Type guard to check if error is an AxiosError
      if (isAxiosError(error)) {
        // Handle Axios error with response
        if (error.response) {
          const data = error.response.data as ErrorResponse
          if (data && data.message) {
            const message = Array.isArray(data.message) ? data.message.join(", ") : data.message
            toast.error(`Error: ${message}`)
          } else if (error.response.status === 400) {
            toast.error("Invalid data format. Please check your inputs.")
          } else if (error.response.status === 500) {
            toast.error("Server error. Please try again later.")
          } else {
            toast.error(`Error: ${error.response.status}`)
          }
        } else if (error.request) {
          // The request was made but no response was received
          toast.error("No response from server. Please check your connection.")
        } else {
          // Something happened in setting up the request
          toast.error(`Error: ${error.message}`)
        }
      } else {
        // Handle non-Axios errors
        toast.error("Failed to save salary record")
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  // Type guard for AxiosError
  function isAxiosError(error: unknown): error is AxiosError {
    return (error as AxiosError).isAxiosError === true
  }

  // Format currency
  const formatCurrency = (amount: string) => {
    if (!businessSettings) return amount

    const value = Number(amount)
    if (isNaN(value)) return amount

    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: businessSettings.currency,
      minimumFractionDigits: 2,
    }).format(value)
  }

  // Get current year and month for default values
  const currentYear = new Date().getFullYear()
  const currentMonth = new Date().getMonth() + 1

  // Generate month options
  const months = [
    { value: 1, label: "January" },
    { value: 2, label: "February" },
    { value: 3, label: "March" },
    { value: 4, label: "April" },
    { value: 5, label: "May" },
    { value: 6, label: "June" },
    { value: 7, label: "July" },
    { value: 8, label: "August" },
    { value: 9, label: "September" },
    { value: 10, label: "October" },
    { value: 11, label: "November" },
    { value: 12, label: "December" },
  ]

  // Generate year options (current year and 5 years back)
  const years = Array.from({ length: 6 }, (_, i) => currentYear - i)

  // Get employee name by ID
  const getEmployeeName = (id: number | "") => {
    if (id === "") return ""
    const employee = employees.find((emp) => emp.id === id)
    return employee ? employee.name : ""
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-hidden rounded-xl bg-white shadow-xl animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between border-b border-gray-100 bg-[#6148F4]/5 p-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">
              {initialSalary ? "Edit Salary Record" : "Create Salary Record"}
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              {initialSalary ? "Update salary details" : "Add a new salary record"}
            </p>
            {businessSettings && (
              <p className="mt-1 text-xs text-gray-500">
                Company settings: {businessSettings.currency} currency, {businessSettings.overtime_rate}x overtime rate
              </p>
            )}
          </div>
          <button onClick={onClose} className="focus:outline-none text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        <div className="max-h-[calc(90vh-80px)] overflow-y-auto p-6">
          <div className="space-y-6">
            {/* Employee Selection */}
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
              <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                <User size={16} className="mr-2 text-gray-500" />
                Employee Information
              </h3>

              <div className="space-y-4">
                <div>
                  <label htmlFor="employee" className="mb-1 block text-sm font-medium text-gray-700">
                    Select Employee
                  </label>
                  <div className="relative rounded-md shadow-sm">
                    <select
                      id="employee"
                      className="block w-full appearance-none rounded-lg border border-gray-300 bg-white py-2.5 pl-3 pr-10 text-sm shadow-sm transition-all focus:border-[#6148F4] focus:outline-none focus:ring-2 focus:ring-[#6148F4]/20"
                      value={userId}
                      onChange={(e) => setUserId(e.target.value ? Number(e.target.value) : "")}
                      required
                    >
                      <option value="">Select Employee</option>
                      {employees.map((employee) => (
                        <option key={employee.id} value={employee.id}>
                          {employee.name} {employee.position ? `(${employee.position})` : ""}
                        </option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                      <ChevronDown size={16} className="text-gray-400" />
                    </div>
                  </div>
                </div>

                {/* Salary Period */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="month" className="mb-1 block text-sm font-medium text-gray-700">
                      Month
                    </label>
                    <div className="relative rounded-md shadow-sm">
                      <select
                        id="month"
                        className="block w-full appearance-none rounded-lg border border-gray-300 bg-white py-2.5 pl-3 pr-10 text-sm shadow-sm transition-all focus:border-[#6148F4] focus:outline-none focus:ring-2 focus:ring-[#6148F4]/20"
                        value={month}
                        onChange={(e) => setMonth(e.target.value ? Number(e.target.value) : "")}
                        required
                      >
                        <option value="">Select Month</option>
                        {months.map((m) => (
                          <option key={m.value} value={m.value}>
                            {m.label}
                          </option>
                        ))}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                        <ChevronDown size={16} className="text-gray-400" />
                      </div>
                    </div>
                  </div>
                  <div>
                    <label htmlFor="year" className="mb-1 block text-sm font-medium text-gray-700">
                      Year
                    </label>
                    <div className="relative rounded-md shadow-sm">
                      <select
                        id="year"
                        className="block w-full appearance-none rounded-lg border border-gray-300 bg-white py-2.5 pl-3 pr-10 text-sm shadow-sm transition-all focus:border-[#6148F4] focus:outline-none focus:ring-2 focus:ring-[#6148F4]/20"
                        value={year}
                        onChange={(e) => setYear(e.target.value ? Number(e.target.value) : "")}
                        required
                      >
                        <option value="">Select Year</option>
                        {years.map((y) => (
                          <option key={y} value={y}>
                            {y}
                          </option>
                        ))}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                        <ChevronDown size={16} className="text-gray-400" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Salary Components */}
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
              <div className="mb-3">
                <h3 className="text-sm font-medium text-gray-700 flex items-center mb-3">
                  <DollarSign size={16} className="mr-2 text-gray-500" />
                  Salary Components
                </h3>

                <button
                  type="button"
                  className="w-full mb-3 py-2 px-4 bg-blue-50 border border-blue-200 rounded-lg text-sm font-medium text-blue-700 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-[#6148F4]/20 transition-colors flex items-center justify-center"
                  onClick={generateFromAttendanceData}
                  disabled={isGeneratingFromAttendance || !userId || !month || !year || !baseSalary}
                  title="Calculate bonus or deductions based on attendance records"
                >
                  {isGeneratingFromAttendance ? (
                    <span className="flex items-center">
                      <svg
                        className="animate-spin -ml-1 mr-2 h-5 w-5 text-blue-600"
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
                      Processing Attendance Data...
                    </span>
                  ) : (
                    <span className="flex items-center">
                      <Calculator size={18} className="mr-2" />
                      Generate from Attendance
                    </span>
                  )}
                </button>
              </div>

              {attendanceSummary && (
                <div className="mb-4 p-3 bg-blue-50 rounded-md border border-blue-100 text-xs text-blue-800">
                  <div className="flex items-start">
                    <Info size={16} className="mr-2 mt-0.5 text-blue-500 shrink-0" />
                    <div>
                      <p className="font-medium mb-1">Attendance Summary for {getEmployeeName(userId)}</p>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                        <div>
                          Worked Hours:{" "}
                          <span className="font-medium">{attendanceSummary.totalWorkedHours.toFixed(1)}h</span>
                        </div>
                        <div>
                          Expected Hours:{" "}
                          <span className="font-medium">{attendanceSummary.expectedHours.toFixed(1)}h</span>
                        </div>
                        <div>
                          Worked Days: <span className="font-medium">{attendanceSummary.workedDays} days</span>
                        </div>
                        <div>
                          Difference:{" "}
                          <span
                            className={`font-medium ${attendanceSummary.totalWorkedHours > attendanceSummary.expectedHours ? "text-green-600" : attendanceSummary.totalWorkedHours < attendanceSummary.expectedHours ? "text-red-600" : ""}`}
                          >
                            {(attendanceSummary.totalWorkedHours - attendanceSummary.expectedHours).toFixed(1)}h
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                {/* Base Salary */}
                <div>
                  <label htmlFor="base-salary" className="mb-1 block text-sm font-medium text-gray-700">
                    Base Salary
                  </label>
                  <div className="relative rounded-md shadow-sm">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <DollarSign size={16} className="text-gray-400" />
                    </div>
                    <input
                      type="number"
                      id="base-salary"
                      placeholder="Enter base salary amount"
                      className="block w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-3 text-sm shadow-sm transition-all focus:border-[#6148F4] focus:outline-none focus:ring-2 focus:ring-[#6148F4]/20"
                      value={baseSalary}
                      onChange={(e) => setBaseSalary(e.target.value)}
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>
                  {businessSettings && baseSalary && (
                    <div className="mt-1 text-xs text-gray-500">
                      Hourly rate: {formatCurrency((Number(baseSalary) / 160).toFixed(2))} (based on 160 hours/month)
                    </div>
                  )}
                </div>

                {/* Additional Components */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="bonus" className="mb-1 block text-sm font-medium text-gray-700 flex items-center">
                      Bonus
                      <span title="Additional payment beyond base salary">
                        <Info size={14} className="ml-1.5 text-gray-400" />
                      </span>
                    </label>
                    <div className="relative rounded-md shadow-sm">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <DollarSign size={16} className="text-gray-400" />
                      </div>
                      <input
                        type="number"
                        id="bonus"
                        placeholder="0.00"
                        className="block w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-3 text-sm shadow-sm transition-all focus:border-[#6148F4] focus:outline-none focus:ring-2 focus:ring-[#6148F4]/20"
                        value={bonus}
                        onChange={(e) => setBonus(e.target.value)}
                        min="0"
                        step="0.01"
                      />
                    </div>
                  </div>
                  <div>
                    <label
                      htmlFor="deductions"
                      className="mb-1 block text-sm font-medium text-gray-700 flex items-center"
                    >
                      Deductions
                      <span title="Amounts subtracted from salary (taxes, benefits, etc.)">
                        <Info size={14} className="ml-1.5 text-gray-400" />
                      </span>
                    </label>
                    <div className="relative rounded-md shadow-sm">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <DollarSign size={16} className="text-gray-400" />
                      </div>
                      <input
                        type="number"
                        id="deductions"
                        placeholder="0.00"
                        className="block w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-3 text-sm shadow-sm transition-all focus:border-[#6148F4] focus:outline-none focus:ring-2 focus:ring-[#6148F4]/20"
                        value={deductions}
                        onChange={(e) => setDeductions(e.target.value)}
                        min="0"
                        step="0.01"
                      />
                    </div>
                  </div>
                </div>

                <hr className="my-2 border-t border-gray-200" />

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="overtime-hours"
                      className="mb-1 block text-sm font-medium text-gray-700 flex items-center"
                    >
                      Overtime Hours
                      <span title="Hours worked beyond standard working hours">
                        <Info size={14} className="ml-1.5 text-gray-400" />
                      </span>
                    </label>
                    <div className="relative rounded-md shadow-sm">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <Clock size={16} className="text-gray-400" />
                      </div>
                      <input
                        type="number"
                        id="overtime-hours"
                        placeholder="0.00"
                        className="block w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-3 text-sm shadow-sm transition-all focus:border-[#6148F4] focus:outline-none focus:ring-2 focus:ring-[#6148F4]/20"
                        value={overtimeHours}
                        onChange={(e) => setOvertimeHours(e.target.value)}
                        min="0"
                        step="0.5"
                      />
                    </div>
                    {businessSettings && (
                      <div className="mt-1 text-xs text-gray-500">Rate: {businessSettings.overtime_rate}x</div>
                    )}
                  </div>
                  <div>
                    <label
                      htmlFor="overtime"
                      className="mb-1 block text-sm font-medium text-gray-700 flex items-center"
                    >
                      Overtime Pay
                      <span title="Calculated based on overtime hours and rate">
                        <Info size={14} className="ml-1.5 text-gray-400" />
                      </span>
                    </label>
                    <div className="relative rounded-md shadow-sm">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <DollarSign size={16} className="text-gray-400" />
                      </div>
                      <input
                        type="number"
                        id="overtime"
                        placeholder="0.00"
                        className="block w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-3 text-sm shadow-sm transition-all focus:border-[#6148F4] focus:outline-none focus:ring-2 focus:ring-[#6148F4]/20"
                        value={overtime}
                        onChange={(e) => setOvertime(e.target.value)}
                        min="0"
                        step="0.01"
                        readOnly={businessSettings !== null}
                      />
                    </div>
                    {businessSettings && overtimeHours && baseSalary && (
                      <div className="mt-1 text-xs text-gray-500">Calculated from hours and rate</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Total Calculation */}
              {baseSalary && (
                <div className="mt-4 rounded-lg bg-white p-4 border border-gray-200 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Total Salary:</span>
                    <span className="text-lg font-bold text-gray-900">
                      {formatCurrency(
                        (Number(baseSalary) + Number(bonus) + Number(overtime) - Number(deductions)).toFixed(2),
                      )}
                    </span>
                  </div>
                  <div className="mt-2 grid grid-cols-4 gap-2 text-xs text-gray-500">
                    <div>Base: {formatCurrency(baseSalary)}</div>
                    <div>Bonus: {formatCurrency(bonus)}</div>
                    <div>Overtime: {formatCurrency(overtime)}</div>
                    <div>Deductions: {formatCurrency(deductions)}</div>
                  </div>
                </div>
              )}
            </div>

            {/* Additional Details */}
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
              <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                <Briefcase size={16} className="mr-2 text-gray-500" />
                Additional Details
              </h3>

              <div className="space-y-4">
                {/* Effective Date */}
                <div>
                  <label htmlFor="effective-date" className="mb-1 block text-sm font-medium text-gray-700">
                    Effective From
                  </label>
                  <div className="relative rounded-md shadow-sm">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <Calendar size={16} className="text-gray-400" />
                    </div>
                    <input
                      type="date"
                      id="effective-date"
                      className="block w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-3 text-sm shadow-sm transition-all focus:border-[#6148F4] focus:outline-none focus:ring-2 focus:ring-[#6148F4]/20"
                      value={effectiveFrom}
                      onChange={(e) => setEffectiveFrom(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* Status */}
                <div>
                  <label htmlFor="status" className="mb-1 block text-sm font-medium text-gray-700">
                    Status
                  </label>
                  <div className="relative rounded-md shadow-sm">
                    <select
                      id="status"
                      className="block w-full appearance-none rounded-lg border border-gray-300 bg-white py-2.5 px-3 text-sm shadow-sm transition-all focus:border-[#6148F4] focus:outline-none focus:ring-2 focus:ring-[#6148F4]/20"
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                    >
                      <option value="pending">Pending</option>
                      <option value="paid">Paid</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                      <ChevronDown size={16} className="text-gray-400" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-3 pt-4 sm:flex-row">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-300 px-4 py-2.5 text-gray-700 transition-colors hover:bg-gray-50 focus:outline-none"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex flex-1 items-center justify-center rounded-lg bg-[#6148F4] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#5040d3] focus:outline-none focus:ring-2 focus:ring-[#6148F4]/50 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? (
                <span className="flex items-center">
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
                </span>
              ) : initialSalary ? (
                "Update Salary"
              ) : (
                "Create Salary"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
