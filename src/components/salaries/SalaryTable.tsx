"use client"

import React, { useState, useEffect } from "react"
import { Calendar, DollarSign, FileText, Edit, Trash2, Upload, Download, AlertCircle } from "lucide-react"
import businessSettingsService from "@/lib/services/business-settings.service"
import type { BusinessSettings } from "@/lib/services/business-settings.service"

interface SalaryTableProps {
  salaries: any[]
  loading: boolean
  isManager: boolean
  onEdit: (salary: any) => void
  onDelete: (id: number) => void
  onUploadPayslip: (salary: any) => void
  onRequestPayslip: (userId: number) => void
  onDownloadPayslip: (fileUrl: string) => void
}

export default function SalaryTable({
  salaries,
  loading,
  isManager,
  onEdit,
  onDelete,
  onUploadPayslip,
  onRequestPayslip,
  onDownloadPayslip,
}: SalaryTableProps) {
  const [expandedRow, setExpandedRow] = useState<number | null>(null)
  const [businessSettings, setBusinessSettings] = useState<BusinessSettings | null>(null)
  const [settingsLoading, setSettingsLoading] = useState(true)

  // Fetch business settings
  useEffect(() => {
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

    // Subscribe to settings changes
    const unsubscribe = businessSettingsService.subscribe(() => {
      businessSettingsService.getSettings().then(setBusinessSettings)
    })

    return () => unsubscribe()
  }, [])

  // Function to format currency using business settings
  const formatCurrency = (amount: number) => {
    if (!businessSettings) {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 2,
      }).format(amount)
    }

    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: businessSettings.currency,
      minimumFractionDigits: 2,
    }).format(amount)
  }

  // Function to get month name
  const getMonthName = (month: number) => {
    const months = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ]
    return months[month - 1]
  }

  // Calculate total salary with overtime rate from business settings
  const calculateTotal = (salary: any) => {
    const baseSalary = Number(salary.base_salary)
    const bonus = Number(salary.bonus)
    const deductions = Number(salary.deductions)

    // Calculate overtime with business settings rate
    let overtime = Number(salary.overtime)
    if (businessSettings && salary.overtime_hours) {
      const hourlyRate = baseSalary / 160 // Assuming 160 working hours per month
      overtime = salary.overtime_hours * hourlyRate * businessSettings.overtime_rate
    }

    return baseSalary + bonus + overtime - deductions
  }

  // Toggle row expansion
  const toggleRowExpansion = (id: number) => {
    if (expandedRow === id) {
      setExpandedRow(null)
    } else {
      setExpandedRow(id)
    }
  }

  return (
    <div className="overflow-x-auto">
      {loading || settingsLoading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#6148F4] border-t-transparent"></div>
        </div>
      ) : salaries.length === 0 ? (
        <div className="flex h-64 flex-col items-center justify-center p-6 text-center">
          <div className="mb-2 rounded-full bg-gray-100 p-3">
            <DollarSign className="h-6 w-6 text-gray-400" />
          </div>
          <h3 className="text-sm font-medium text-gray-900">No salary records found</h3>
          <p className="mt-1 text-xs text-gray-500">
            {isManager
              ? "Create a new salary record to get started"
              : "Your salary records will appear here once available"}
          </p>
        </div>
      ) : (
        <table className="w-full table-auto">
          <thead>
            <tr className="bg-gray-50 text-left">
              {isManager && (
                <th className="whitespace-nowrap px-6 py-4 text-sm font-medium uppercase tracking-wider text-gray-500">
                  Employee
                </th>
              )}
              <th className="whitespace-nowrap px-6 py-4 text-sm font-medium uppercase tracking-wider text-gray-500">
                Period
              </th>
              <th className="whitespace-nowrap px-6 py-4 text-sm font-medium uppercase tracking-wider text-gray-500">
                Base Salary
              </th>
              <th className="whitespace-nowrap px-6 py-4 text-sm font-medium uppercase tracking-wider text-gray-500">
                Total
              </th>
              <th className="whitespace-nowrap px-6 py-4 text-sm font-medium uppercase tracking-wider text-gray-500">
                Status
              </th>
              <th className="whitespace-nowrap px-6 py-4 text-sm font-medium uppercase tracking-wider text-gray-500">
                Payslip
              </th>
              <th className="whitespace-nowrap px-6 py-4 text-sm font-medium uppercase tracking-wider text-gray-500">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {salaries.map((salary) => (
              <React.Fragment key={salary.id}>
                <tr className={`transition-colors hover:bg-gray-50 ${expandedRow === salary.id ? "bg-gray-50" : ""}`}>
                  {isManager && (
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="flex items-center">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#6148F4]/10 text-sm font-medium text-[#6148F4]">
                          {salary.user?.name ? salary.user.name.charAt(0) : "U"}
                        </div>
                        <div className="ml-3">
                          <div className="font-medium text-gray-900">{salary.user?.name || "Unknown"}</div>
                          <div className="text-xs text-gray-500">{salary.user?.position || ""}</div>
                        </div>
                      </div>
                    </td>
                  )}
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="flex items-center">
                      <Calendar size={16} className="mr-2 text-gray-400" />
                      <span className="text-gray-900">
                        {getMonthName(salary.month)} {salary.year}
                      </span>
                    </div>
                    {businessSettings && (
                      <div className="mt-1 text-xs text-gray-500">Cycle: {businessSettings.salary_cycle}</div>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="text-gray-900">{formatCurrency(salary.base_salary)}</div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="font-medium text-gray-900">{formatCurrency(calculateTotal(salary))}</div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                        salary.status === "paid"
                          ? "bg-green-50 text-green-700"
                          : salary.status === "pending"
                            ? "bg-yellow-50 text-yellow-700"
                            : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {salary.status.charAt(0).toUpperCase() + salary.status.slice(1)}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    {salary.file_url ? (
                      <button
                        onClick={() => onDownloadPayslip(salary.file_url)}
                        className="inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 hover:bg-green-100"
                      >
                        <Download size={12} className="mr-1" />
                        Download
                      </button>
                    ) : salary.payslip_requested ? (
                      isManager ? (
                        <button
                          onClick={() => onUploadPayslip(salary)}
                          className="inline-flex items-center rounded-md bg-yellow-50 px-2 py-1 text-xs font-medium text-yellow-700 hover:bg-yellow-100"
                        >
                          <Upload size={12} className="mr-1" />
                          Upload
                        </button>
                      ) : (
                        <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">
                          <AlertCircle size={12} className="mr-1" />
                          Requested
                        </span>
                      )
                    ) : !isManager ? (
                      <button
                        onClick={() => onRequestPayslip(salary.user_id)}
                        className="inline-flex items-center rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-200"
                      >
                        <FileText size={12} className="mr-1" />
                        Request
                      </button>
                    ) : (
                      <span className="text-xs text-gray-500">Not requested</span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => toggleRowExpansion(salary.id)}
                        className="rounded bg-gray-100 p-1.5 text-gray-600 transition-colors hover:bg-gray-200"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="m9 18 6-6-6-6" />
                        </svg>
                      </button>

                      {isManager && (
                        <>
                          <button
                            onClick={() => onEdit(salary)}
                            className="rounded bg-gray-100 p-1.5 text-gray-600 transition-colors hover:bg-gray-200"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => onDelete(salary.id)}
                            className="rounded bg-red-100 p-1.5 text-red-600 transition-colors hover:bg-red-200"
                          >
                            <Trash2 size={16} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>

                {/* Expanded row with details */}
                {expandedRow === salary.id && (
                  <tr className="bg-gray-50">
                    <td colSpan={isManager ? 7 : 6} className="px-6 py-4">
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
                        <div>
                          <div className="text-xs font-medium text-gray-500">Base Salary</div>
                          <div className="mt-1 text-sm font-medium text-gray-900">
                            {formatCurrency(salary.base_salary)}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs font-medium text-gray-500">Bonus</div>
                          <div className="mt-1 text-sm font-medium text-gray-900">{formatCurrency(salary.bonus)}</div>
                        </div>
                        <div>
                          <div className="text-xs font-medium text-gray-500">
                            Overtime {businessSettings && `(${businessSettings.overtime_rate}x)`}
                          </div>
                          <div className="mt-1 text-sm font-medium text-gray-900">
                            {formatCurrency(salary.overtime)}
                          </div>
                          {salary.overtime_hours && (
                            <div className="mt-1 text-xs text-gray-500">{salary.overtime_hours} hours</div>
                          )}
                        </div>
                        <div>
                          <div className="text-xs font-medium text-gray-500">Deductions</div>
                          <div className="mt-1 text-sm font-medium text-gray-900">
                            {formatCurrency(salary.deductions)}
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 flex items-center justify-between border-t border-gray-200 pt-4">
                        <div>
                          <div className="text-xs font-medium text-gray-500">Effective From</div>
                          <div className="mt-1 text-sm text-gray-900">
                            {new Date(salary.effective_from).toLocaleDateString()}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs font-medium text-gray-500">Total</div>
                          <div className="mt-1 text-lg font-bold text-gray-900">
                            {formatCurrency(calculateTotal(salary))}
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
