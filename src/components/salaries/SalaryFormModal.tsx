"use client"

import { useState, useEffect } from "react"
import api from "@/lib/api"
import { toast } from "react-toastify"
import { X, DollarSign, Calendar, User, Clock } from "lucide-react"
import businessSettingsService from "@/lib/services/business-settings.service"
import type { BusinessSettings } from "@/lib/services/business-settings.service"

interface SalaryFormModalProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  initialSalary?: any
}

export default function SalaryFormModal({ open, onClose, onSuccess, initialSalary }: SalaryFormModalProps) {
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
      setEffectiveFrom(initialSalary.effective_from || "")
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

  const handleSubmit = async () => {
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
      const payload = {
        user_id: userId,
        base_salary: Number(baseSalary),
        bonus: Number(bonus),
        overtime: Number(overtime),
        overtime_hours: Number(overtimeHours),
        deductions: Number(deductions),
        month: Number(month),
        year: Number(year),
        effective_from: effectiveFrom,
        status,
      }

      if (initialSalary) {
        await api.patch(`/salaries/${initialSalary.id}`, payload)
        toast.success("Salary record updated successfully")
      } else {
        await api.post("/salaries", payload)
        toast.success("Salary record created successfully")
      }

      onSuccess()
    } catch (error) {
      console.error("Failed to save salary record:", error)
      toast.error("Failed to save salary record")
    } finally {
      setIsSubmitting(false)
    }
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

        <div className="max-h-[calc(90vh-80px)] overflow-y-auto space-y-5 p-6">
          <div className="space-y-5">
            {/* Employee Selection */}
            <div>
              <label htmlFor="employee" className="mb-1 block text-sm font-medium text-gray-700">
                Employee
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <User size={18} className="text-gray-400" />
                </div>
                <select
                  id="employee"
                  className="block w-full appearance-none rounded-lg border border-gray-300 bg-none py-3 pl-10 pr-10 text-sm shadow-sm transition-all focus:border-[#6148F4] focus:outline-none focus:ring-2 focus:ring-[#6148F4]/20"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value ? Number(e.target.value) : "")}
                  required
                >
                  <option value="">Select Employee</option>
                  {employees.map((employee) => (
                    <option key={employee.id} value={employee.id}>
                      {employee.name}
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

            {/* Salary Period */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="month" className="mb-1 block text-sm font-medium text-gray-700">
                  Month
                </label>
                <div className="relative rounded-md shadow-sm">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Calendar size={18} className="text-gray-400" />
                  </div>
                  <select
                    id="month"
                    className="block w-full appearance-none rounded-lg border border-gray-300 bg-none py-3 pl-10 pr-10 text-sm shadow-sm transition-all focus:border-[#6148F4] focus:outline-none focus:ring-2 focus:ring-[#6148F4]/20"
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
                    <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>
              <div>
                <label htmlFor="year" className="mb-1 block text-sm font-medium text-gray-700">
                  Year
                </label>
                <div className="relative rounded-md shadow-sm">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Calendar size={18} className="text-gray-400" />
                  </div>
                  <select
                    id="year"
                    className="block w-full appearance-none rounded-lg border border-gray-300 bg-none py-3 pl-10 pr-10 text-sm shadow-sm transition-all focus:border-[#6148F4] focus:outline-none focus:ring-2 focus:ring-[#6148F4]/20"
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
                    <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Base Salary */}
            <div>
              <label htmlFor="base-salary" className="mb-1 block text-sm font-medium text-gray-700">
                Base Salary
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <DollarSign size={18} className="text-gray-400" />
                </div>
                <input
                  type="number"
                  id="base-salary"
                  placeholder="Enter base salary amount"
                  className="block w-full rounded-lg border border-gray-300 py-3 pl-10 pr-3 text-sm shadow-sm transition-all focus:border-[#6148F4] focus:outline-none focus:ring-2 focus:ring-[#6148F4]/20"
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
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label htmlFor="bonus" className="mb-1 block text-sm font-medium text-gray-700">
                  Bonus
                </label>
                <div className="relative rounded-md shadow-sm">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <DollarSign size={18} className="text-gray-400" />
                  </div>
                  <input
                    type="number"
                    id="bonus"
                    placeholder="0.00"
                    className="block w-full rounded-lg border border-gray-300 py-3 pl-10 pr-3 text-sm shadow-sm transition-all focus:border-[#6148F4] focus:outline-none focus:ring-2 focus:ring-[#6148F4]/20"
                    value={bonus}
                    onChange={(e) => setBonus(e.target.value)}
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="overtime-hours" className="mb-1 block text-sm font-medium text-gray-700">
                  Overtime Hours
                </label>
                <div className="relative rounded-md shadow-sm">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Clock size={18} className="text-gray-400" />
                  </div>
                  <input
                    type="number"
                    id="overtime-hours"
                    placeholder="0.00"
                    className="block w-full rounded-lg border border-gray-300 py-3 pl-10 pr-3 text-sm shadow-sm transition-all focus:border-[#6148F4] focus:outline-none focus:ring-2 focus:ring-[#6148F4]/20"
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
                <label htmlFor="overtime" className="mb-1 block text-sm font-medium text-gray-700">
                  Overtime Pay
                </label>
                <div className="relative rounded-md shadow-sm">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <DollarSign size={18} className="text-gray-400" />
                  </div>
                  <input
                    type="number"
                    id="overtime"
                    placeholder="0.00"
                    className="block w-full rounded-lg border border-gray-300 py-3 pl-10 pr-3 text-sm shadow-sm transition-all focus:border-[#6148F4] focus:outline-none focus:ring-2 focus:ring-[#6148F4]/20"
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
              <div>
                <label htmlFor="deductions" className="mb-1 block text-sm font-medium text-gray-700">
                  Deductions
                </label>
                <div className="relative rounded-md shadow-sm">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <DollarSign size={18} className="text-gray-400" />
                  </div>
                  <input
                    type="number"
                    id="deductions"
                    placeholder="0.00"
                    className="block w-full rounded-lg border border-gray-300 py-3 pl-10 pr-3 text-sm shadow-sm transition-all focus:border-[#6148F4] focus:outline-none focus:ring-2 focus:ring-[#6148F4]/20"
                    value={deductions}
                    onChange={(e) => setDeductions(e.target.value)}
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>
            </div>

            {/* Effective Date */}
            <div>
              <label htmlFor="effective-date" className="mb-1 block text-sm font-medium text-gray-700">
                Effective From
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Calendar size={18} className="text-gray-400" />
                </div>
                <input
                  type="date"
                  id="effective-date"
                  className="block w-full rounded-lg border border-gray-300 py-3 pl-10 pr-3 text-sm shadow-sm transition-all focus:border-[#6148F4] focus:outline-none focus:ring-2 focus:ring-[#6148F4]/20"
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
                  className="block w-full appearance-none rounded-lg border border-gray-300 bg-none py-3 px-3 text-sm shadow-sm transition-all focus:border-[#6148F4] focus:outline-none focus:ring-2 focus:ring-[#6148F4]/20"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                  <option value="cancelled">Cancelled</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                  <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Total Calculation */}
            {baseSalary && (
              <div className="rounded-lg bg-gray-50 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Total Salary:</span>
                  <span className="text-lg font-bold text-gray-900">
                    {formatCurrency(
                      (Number(baseSalary) + Number(bonus) + Number(overtime) - Number(deductions)).toFixed(2),
                    )}
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="mt-8 flex flex-col gap-3 pt-4 sm:flex-row">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-300 px-4 py-2.5 text-gray-700 transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex flex-1 items-center justify-center rounded-lg bg-[#6148F4] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#5040d3] focus:outline-none focus:ring-2 focus:ring-[#6148F4]/50 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? "Saving..." : initialSalary ? "Update Salary" : "Create Salary"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
