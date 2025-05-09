"use client"

import { useState, useEffect,useRef } from "react"
import { useRouter } from "next/navigation"
 import { useSelector } from "react-redux"
import type { RootState } from "@/lib/redux/store"
import ProtectedRoute from "@/components/ProtectedRoute"
import SalaryTable from "@/components/salaries/SalaryTable"
import SalaryFormModal from "@/components/salaries/SalaryFormModal"
import PayslipUploadModal from "@/components/salaries/PayslipUploadModal"
import DeleteConfirmationModal from "@/components/DeleteConfirmationModal"
import api from "@/lib/api"
import { toast } from "react-toastify"
import { PlusCircle, FileText, Filter, DollarSign, Calendar, Users, ChevronDown } from "lucide-react"

export default function SalariesPage() {

  const router = useRouter()
const hasBlocked  = useRef(false)
  const { user } = useSelector((state: RootState) => state.auth)
  const [salaries, setSalaries] = useState<
    Array<{
      id: number
      user_id: number
      user?: {
        id: number
        name: string
        position?: string
      }
      month: number
      year: number
      base_salary: number
      bonus: number
      overtime: number
      deductions: number
      effective_from: string
      status: string
      payslip_requested?: boolean
      file_url?: string
    }>
  >([])
  const [loading, setLoading] = useState(true)
  const [openModal, setOpenModal] = useState(false)
  const [openUploadModal, setOpenUploadModal] = useState(false)
  const [editingSalary, setEditingSalary] = useState<any>(null)
  const [uploadingSalary, setUploadingSalary] = useState<any>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState({
    month: "",
    year: "",
    employee: "",
    status: "", // Add status filter
  })
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [deletingSalaryId, setDeletingSalaryId] = useState<number | null>(null)
  const [deletingSalaryInfo, setDeletingSalaryInfo] = useState<string>("")
  const [summaryStats, setSummaryStats] = useState({
    totalSalaries: 0,
    pendingPayments: 0,
    completedPayments: 0,
  })

  // Check if user is HR or owner (can manage all salaries)
  const isManager = user?.role_id === 2 || user?.role_id === 3

  const fetchSalaries = async () => {
    setLoading(true)
    try {
      // Use different endpoints based on user role
      const endpoint = isManager ? "/salaries/active/company" : "/salaries/me"
      const res = await api.get(endpoint)
      setSalaries(res.data)

      // Calculate summary statistics
      if (res.data && res.data.length > 0) {
        const total = res.data.reduce(
          (sum: number, salary: any) =>
            sum +
            Number(salary.base_salary) +
            Number(salary.bonus) +
            Number(salary.overtime) -
            Number(salary.deductions),
          0,
        )
        const pending = res.data.filter((s: any) => s.status === "pending").length
        const completed = res.data.filter((s: any) => s.status === "paid").length

        setSummaryStats({
          totalSalaries: total,
          pendingPayments: pending,
          completedPayments: completed,
        })
      }
    } catch (error) {
      console.error("Failed to fetch salaries:", error)
      toast.error("Failed to load salary data")
    } finally {
      setLoading(false)
    }
  }
useEffect(() => {
  if (!user || hasBlocked.current) return

  if (user.role_id === 1) {
    hasBlocked.current = true
    toast.error("Superadmin is not allowed to view salaries.")
    router.push("/dashboard")
    return
  }

  fetchSalaries()
}, [user])


  const handleCreate = () => {
    setEditingSalary(null)
    setOpenModal(true)
  }

  const handleEdit = (salary: any) => {
    setEditingSalary(salary)
    setOpenModal(true)
  }

  const handleDeleteClick = (id: number) => {
    const salary = salaries.find((s) => s.id === id)
    let salaryInfo = ""

    if (salary) {
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

      const employeeName = salary.user?.name || "Unknown"
      const month = months[salary.month - 1]
      const year = salary.year

      salaryInfo = `${employeeName}'s salary for ${month} ${year}`
    }

    setDeletingSalaryId(id)
    setDeletingSalaryInfo(salaryInfo)
    setDeleteModalOpen(true)
  }

  const handleUploadPayslip = (salary: any) => {
    setUploadingSalary(salary)
    setOpenUploadModal(true)
  }

  const handleRequestPayslip = async (userId: number) => {
    try {
      await api.post(`/salaries/request-payslip/${userId}`)
      toast.success("Payslip requested successfully")
      fetchSalaries()
    } catch (error) {
      console.error("Failed to request payslip:", error)
      toast.error("Failed to request payslip")
    }
  }

  const handleDownloadPayslip = (fileUrl: string) => {
    window.open(fileUrl, "_blank")
  }

  const handleFormSuccess = () => {
    setOpenModal(false)
    fetchSalaries()
  }

  const handleUploadSuccess = () => {
    setOpenUploadModal(false)
    fetchSalaries()
  }

  // Get unique years and months from salaries for filters
  const years = [...new Set(salaries.map((salary: any) => salary.year))].sort((a, b) => b - a)
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

  // Get unique employees from salaries for filters (only for managers)
  const employees = isManager
    ? Array.from(
        new Map(
          salaries
            .filter((salary) => salary.user != null)
            .map((salary) => [salary.user!.id, { id: salary.user!.id, name: salary.user!.name }]),
        ).values(),
      )
    : []

  // Filter salaries based on selected filters
  const filteredSalaries = salaries.filter((salary: any) => {
    return (
      (filters.month === "" || salary.month === Number(filters.month)) &&
      (filters.year === "" || salary.year === Number(filters.year)) &&
      (filters.employee === "" || salary.user_id === Number(filters.employee)) &&
      (filters.status === "" || salary.status === filters.status) // Add status filter condition
    )
  })

  // Count payslip requests for notification badge
  const payslipRequestsCount = isManager
    ? salaries.filter((salary: any) => salary.payslip_requested && !salary.file_url).length
    : 0

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(amount)
  }

  return (
    <ProtectedRoute>
      <main className="min-h-screen bg-gradient-to-b from-[#F9F8FF] to-[#FAF9F7] text-gray-900">
        <div className="mx-auto max-w-7xl p-4 md:p-6 lg:p-8">
          {/* Header Section */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 md:text-4xl">Salary Management</h1>
            <p className="mt-2 text-gray-600">
              {isManager
                ? "Manage and process salary records for all employees in your organization"
                : "View your salary history and download payslips"}
            </p>
          </div>

          {/* Stats Cards */}
          {isManager && (
            <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-xl border border-indigo-100 bg-white p-6 shadow-sm transition-all hover:shadow-md">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-gray-500">Total Salary Budget</h3>
                  <div className="rounded-full bg-indigo-50 p-2">
                    <DollarSign className="h-5 w-5 text-indigo-500" />
                  </div>
                </div>
                <p className="mt-2 text-2xl font-bold text-gray-900">{formatCurrency(summaryStats.totalSalaries)}</p>
                <p className="mt-1 text-xs text-gray-500">For {filteredSalaries.length} employees</p>
              </div>

              <div className="rounded-xl border border-amber-100 bg-white p-6 shadow-sm transition-all hover:shadow-md">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-gray-500">Pending Payments</h3>
                  <div className="rounded-full bg-amber-50 p-2">
                    <Calendar className="h-5 w-5 text-amber-500" />
                  </div>
                </div>
                <p className="mt-2 text-2xl font-bold text-gray-900">{summaryStats.pendingPayments}</p>
                <p className="mt-1 text-xs text-gray-500">Awaiting processing</p>
              </div>

              <div className="rounded-xl border border-emerald-100 bg-white p-6 shadow-sm transition-all hover:shadow-md">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-gray-500">Completed Payments</h3>
                  <div className="rounded-full bg-emerald-50 p-2">
                    <Users className="h-5 w-5 text-emerald-500" />
                  </div>
                </div>
                <p className="mt-2 text-2xl font-bold text-gray-900">{summaryStats.completedPayments}</p>
                <p className="mt-1 text-xs text-gray-500">Successfully processed</p>
              </div>
            </div>
          )}

          {/* Action Bar */}
          <div className="mb-6 flex flex-col justify-between gap-4 rounded-xl bg-white p-4 shadow-sm md:flex-row md:items-center">
            <div className="flex items-center">
              <h2 className="text-lg font-semibold text-gray-900">Salary Records</h2>
              <div className="ml-3 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">
                {filteredSalaries.length} {filteredSalaries.length === 1 ? "record" : "records"}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="inline-flex items-center rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#6148F4]/30 focus:ring-offset-2"
              >
                <Filter size={16} className="mr-1.5 text-gray-500" />
                Filters
                <ChevronDown
                  size={16}
                  className={`ml-1 text-gray-500 transition-transform ${showFilters ? "rotate-180" : ""}`}
                />
              </button>

              {isManager && payslipRequestsCount > 0 && (
                <button
                  onClick={() => {
                    // Filter to show only records with payslip requests
                    setFilters({ ...filters, employee: "" })
                    setShowFilters(true)
                  }}
                  className="inline-flex items-center rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-700 shadow-sm transition-colors hover:bg-amber-100 focus:outline-none focus:ring-2 focus:ring-amber-300 focus:ring-offset-2"
                >
                  <FileText size={16} className="mr-1.5 text-amber-500" />
                  <span>Payslip Requests</span>
                  <span className="ml-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-xs font-bold text-white">
                    {payslipRequestsCount}
                  </span>
                </button>
              )}

              {isManager && (
                <button
                  onClick={handleCreate}
                  className="inline-flex items-center rounded-lg bg-[#6148F4] px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#5040d3] focus:outline-none focus:ring-2 focus:ring-[#6148F4]/50 focus:ring-offset-2"
                >
                  <PlusCircle size={16} className="mr-1.5" />
                  Create Salary Record
                </button>
              )}
            </div>
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="mb-6 rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label htmlFor="month-filter" className="mb-1.5 block text-sm font-medium text-gray-700">
                    Month
                  </label>
                  <select
                    id="month-filter"
                    value={filters.month}
                    onChange={(e) => setFilters({ ...filters, month: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm shadow-sm transition-all focus:border-[#6148F4] focus:outline-none focus:ring-1 focus:ring-[#6148F4]/50"
                  >
                    <option value="">All Months</option>
                    {months.map((month) => (
                      <option key={month.value} value={month.value}>
                        {month.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="year-filter" className="mb-1.5 block text-sm font-medium text-gray-700">
                    Year
                  </label>
                  <select
                    id="year-filter"
                    value={filters.year}
                    onChange={(e) => setFilters({ ...filters, year: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm shadow-sm transition-all focus:border-[#6148F4] focus:outline-none focus:ring-1 focus:ring-[#6148F4]/50"
                  >
                    <option value="">All Years</option>
                    {years.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </div>

                {isManager && (
                  <div>
                    <label htmlFor="employee-filter" className="mb-1.5 block text-sm font-medium text-gray-700">
                      Employee
                    </label>
                    <select
                      id="employee-filter"
                      value={filters.employee}
                      onChange={(e) => setFilters({ ...filters, employee: e.target.value })}
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm shadow-sm transition-all focus:border-[#6148F4] focus:outline-none focus:ring-1 focus:ring-[#6148F4]/50"
                    >
                      <option value="">All Employees</option>
                      {employees.map((employee: any) => (
                        <option key={employee.id} value={employee.id}>
                          {employee.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                {/* Status Filter */}
                <div>
                  <label htmlFor="status-filter" className="mb-1.5 block text-sm font-medium text-gray-700">
                    Status
                  </label>
                  <select
                    id="status-filter"
                    value={filters.status}
                    onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm shadow-sm transition-all focus:border-[#6148F4] focus:outline-none focus:ring-1 focus:ring-[#6148F4]/50"
                  >
                    <option value="">All Statuses</option>
                    <option value="pending">Pending</option>
                    <option value="paid">Paid</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => setFilters({ month: "", year: "", employee: "", status: "" })}
                  className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-200 focus:ring-offset-2"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          )}

          {/* Salary Table */}
          <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
            <SalaryTable
              salaries={filteredSalaries}
              loading={loading}
              isManager={isManager}
              onEdit={handleEdit}
              onDelete={handleDeleteClick}
              onUploadPayslip={handleUploadPayslip}
              onRequestPayslip={handleRequestPayslip}
              onDownloadPayslip={handleDownloadPayslip}
              userRoleId={user?.role_id}
              onSalaryCreated={fetchSalaries}
              onSalaryUpdated={fetchSalaries}
            />
          </div>
        </div>

        {isManager && (
          <>
            <SalaryFormModal
              open={openModal}
              onClose={() => setOpenModal(false)}
              onSuccess={handleFormSuccess}
              initialSalary={editingSalary}
            />

            <PayslipUploadModal
              open={openUploadModal}
              onClose={() => setOpenUploadModal(false)}
              onSuccess={handleUploadSuccess}
              salary={uploadingSalary}
            />

            <DeleteConfirmationModal
              isOpen={deleteModalOpen}
              onClose={() => {
                setDeleteModalOpen(false)
                setDeletingSalaryId(null)
                setDeletingSalaryInfo("")
              }}
              onConfirm={() => {
                setDeleteModalOpen(false)
                fetchSalaries()
              }}
              title="Delete Salary Record"
              message={`Are you sure you want to delete ${deletingSalaryInfo}? This action cannot be undone.`}
              itemId={deletingSalaryId || 0}
              endpoint="/salaries"
            />
          </>
        )}
      </main>
    </ProtectedRoute>
  )
}
