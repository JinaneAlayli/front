"use client"

import React, { useState, useEffect } from "react"
import {
  Calendar,
  DollarSign,
  FileText,
  Edit,
  Trash2,
  Upload,
  Download,
  Calculator,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
} from "lucide-react"
import businessSettingsService from "@/lib/services/business-settings.service"
import type { BusinessSettings } from "@/lib/services/business-settings.service"
import SalaryFormModal from "./SalaryFormModal"

interface SalaryTableProps {
  salaries: any[]
  loading: boolean
  isManager: boolean
  onEdit: (salary: any) => void
  onDelete: (id: number) => void
  onUploadPayslip: (salary: any) => void
  onRequestPayslip: (salaryId: number) => void
  onDownloadPayslip: (salaryId: number) => void
  onSalaryCreated?: () => void
  onSalaryUpdated?: () => void
  userRoleId?: number
  currentUserId?: number
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
  onSalaryCreated,
  onSalaryUpdated,
  userRoleId,
  currentUserId,
}: SalaryTableProps) {
  const [expandedRow, setExpandedRow] = useState<number | null>(null)
  const [businessSettings, setBusinessSettings] = useState<BusinessSettings | null>(null)
  const [settingsLoading, setSettingsLoading] = useState(true)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [selectedSalary, setSelectedSalary] = useState<any>(null)
  const [generateFromAttendance, setGenerateFromAttendance] = useState(false)

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

  // Check if current user can perform actions on this salary record
  const canManageSalary = (salary: any) => {
    // Owners (role_id 2) and HR (role_id 3) can manage all salaries
    return userRoleId === 2 || userRoleId === 3
  }

  // Check if current user is the owner of this salary record
  const isSalaryOwner = (salary: any) => {
    return currentUserId === salary.user_id
  }

  // Check if user can request payslip for this salary
  const canRequestPayslip = (salary: any) => {
    // Only the salary owner can request their own payslip
    // And only if no payslip is uploaded and not already requested
    return isSalaryOwner(salary) && !salary.file_url && !salary.payslip_requested
  }

  // Check if user can download payslip
  const canDownloadPayslip = (salary: any) => {
    // Managers can download any payslip, employees can only download their own
    return salary.file_url && (canManageSalary(salary) || isSalaryOwner(salary))
  }

  // Get payslip status with proper logic
  const getPayslipStatus = (salary: any) => {
    if (salary.file_url) {
      return {
        status: "uploaded",
        label: "Available",
        icon: CheckCircle,
        color: "text-green-700 bg-green-50",
        action: canDownloadPayslip(salary) ? "download" : null,
        managerAction: canManageSalary(salary) ? "manage" : null,
      }
    }

    if (salary.payslip_requested) {
      return {
        status: "requested",
        label: "Requested",
        icon: Clock,
        color: "text-blue-700 bg-blue-50",
        action: canManageSalary(salary) ? "upload" : null,
        managerAction: null,
      }
    }

    // Check if payslip was cancelled (file_url === '')
    if (salary.file_url === "") {
      return {
        status: "cancelled",
        label: "Cancelled",
        icon: XCircle,
        color: "text-red-700 bg-red-50",
        action: canRequestPayslip(salary) ? "request" : null,
        managerAction: null,
      }
    }

    return {
      status: "not_requested",
      label: "Not Requested",
      icon: FileText,
      color: "text-gray-700 bg-gray-50",
      action: canRequestPayslip(salary) ? "request" : null,
      managerAction: null,
    }
  }

  // Handle payslip actions
  const handlePayslipAction = (salary: any, action: string | null) => {
    if (!action) return

    switch (action) {
      case "download":
        onDownloadPayslip(salary.id)
        break
      case "upload":
      case "manage":
        onUploadPayslip(salary)
        break
      case "request":
        onRequestPayslip(salary.id)
        break
    }
  }

  // Toggle row expansion
  const toggleRowExpansion = (id: number) => {
    setExpandedRow(expandedRow === id ? null : id)
  }

  const handleFormSuccess = () => {
    setIsFormOpen(false)
    setSelectedSalary(null)
    setGenerateFromAttendance(false)
    if (onSalaryCreated) onSalaryCreated()
    if (onSalaryUpdated) onSalaryUpdated()
  }

  const handleGenerateFromAttendance = (salary: any) => {
    setSelectedSalary(salary)
    setGenerateFromAttendance(true)
    setIsFormOpen(true)
  }

  if (loading || settingsLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#6148F4] border-t-transparent"></div>
      </div>
    )
  }

  if (salaries.length === 0) {
    return (
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
    )
  }

  return (
    <div className="overflow-x-auto">
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
          {salaries.map((salary) => {
            const payslipStatus = getPayslipStatus(salary)
            const StatusIcon = payslipStatus.icon

            return (
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
                    <div className="flex items-center space-x-2">
                      <span
                        className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${payslipStatus.color}`}
                      >
                        <StatusIcon size={12} className="mr-1" />
                        {payslipStatus.label}
                      </span>

                      {/* Primary action button */}
                      {payslipStatus.action && (
                        <button
                          onClick={() => payslipStatus.action && handlePayslipAction(salary, payslipStatus.action)}
                          className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium transition-colors ${
                            payslipStatus.action === "download"
                              ? "bg-green-100 text-green-700 hover:bg-green-200"
                              : payslipStatus.action === "upload"
                                ? "bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
                                : "bg-blue-100 text-blue-700 hover:bg-blue-200"
                          }`}
                        >
                          {payslipStatus.action === "download" && <Download size={12} className="mr-1" />}
                          {payslipStatus.action === "upload" && <Upload size={12} className="mr-1" />}
                          {payslipStatus.action === "request" && <FileText size={12} className="mr-1" />}
                          {payslipStatus.action === "download"
                            ? "Download"
                            : payslipStatus.action === "upload"
                              ? "Upload"
                              : "Request"}
                        </button>
                      )}

                      {/* Manager action button for uploaded payslips */}
                      {payslipStatus.managerAction && (
                        <button
                          onClick={() =>
                            payslipStatus.managerAction && handlePayslipAction(salary, payslipStatus.managerAction)
                          }
                          className="inline-flex items-center rounded-md px-2 py-1 text-xs font-medium transition-colors bg-gray-100 text-gray-700 hover:bg-gray-200"
                          title="Manage payslip (replace/remove)"
                        >
                          <RefreshCw size={12} className="mr-1" />
                          Manage
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => toggleRowExpansion(salary.id)}
                        className="rounded bg-gray-100 p-1.5 text-gray-600 transition-colors hover:bg-gray-200"
                        title="View details"
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
                          className={`transition-transform ${expandedRow === salary.id ? "rotate-90" : ""}`}
                        >
                          <path d="m9 18 6-6-6-6" />
                        </svg>
                      </button>

                      {canManageSalary(salary) && (
                        <>
                          <button
                            onClick={() => handleGenerateFromAttendance(salary)}
                            className="rounded bg-blue-100 p-1.5 text-blue-600 transition-colors hover:bg-blue-200"
                            title="Generate salary adjustments from attendance records"
                          >
                            <Calculator size={16} />
                          </button>
                          <button
                            onClick={() => onEdit(salary)}
                            className="rounded bg-gray-100 p-1.5 text-gray-600 transition-colors hover:bg-gray-200"
                            title="Edit salary record"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => onDelete(salary.id)}
                            className="rounded bg-red-100 p-1.5 text-red-600 transition-colors hover:bg-red-200"
                            title="Delete salary record"
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
                        <div className="text-right">
                          <div className="text-xs font-medium text-gray-500">Net Salary</div>
                          <div className="mt-1 text-lg font-bold text-gray-900">
                            {formatCurrency(calculateTotal(salary))}
                          </div>
                        </div>
                      </div>

                      {/* Payslip Information */}
                      <div className="mt-4 rounded-lg bg-white p-3 border border-gray-200">
                        <div className="text-xs font-medium text-gray-500 mb-2">Payslip Information</div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <StatusIcon size={16} className={payslipStatus.color.split(" ")[0]} />
                            <span className="text-sm text-gray-900">{payslipStatus.label}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            {payslipStatus.action && (
                              <button
                                onClick={() =>
                                  payslipStatus.action && handlePayslipAction(salary, payslipStatus.action)
                                }
                                className={`inline-flex items-center rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                                  payslipStatus.action === "download"
                                    ? "bg-green-100 text-green-700 hover:bg-green-200"
                                    : payslipStatus.action === "upload"
                                      ? "bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
                                      : "bg-blue-100 text-blue-700 hover:bg-blue-200"
                                }`}
                              >
                                {payslipStatus.action === "download" && <Download size={14} className="mr-1" />}
                                {payslipStatus.action === "upload" && <Upload size={14} className="mr-1" />}
                                {payslipStatus.action === "request" && <FileText size={14} className="mr-1" />}
                                {payslipStatus.action === "download"
                                  ? "Download Payslip"
                                  : payslipStatus.action === "upload"
                                    ? "Upload Payslip"
                                    : "Request Payslip"}
                              </button>
                            )}
                            {payslipStatus.managerAction && (
                              <button
                                onClick={() =>
                                  payslipStatus.managerAction &&
                                  handlePayslipAction(salary, payslipStatus.managerAction)
                                }
                                className="inline-flex items-center rounded-md px-3 py-1.5 text-xs font-medium transition-colors bg-gray-100 text-gray-700 hover:bg-gray-200"
                              >
                                <RefreshCw size={14} className="mr-1" />
                                Manage Payslip
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            )
          })}
        </tbody>
      </table>

      {isFormOpen && (
        <SalaryFormModal
          open={isFormOpen}
          onClose={() => {
            setIsFormOpen(false)
            setSelectedSalary(null)
            setGenerateFromAttendance(false)
          }}
          onSuccess={handleFormSuccess}
          initialSalary={selectedSalary}
          generateFromAttendance={generateFromAttendance}
        />
      )}
    </div>
  )
}
