"use client"

import { useState, useEffect } from "react"
import { useSelector } from "react-redux"
import type { RootState } from "@/lib/redux/store"
import ProtectedRoute from "@/components/ProtectedRoute"
import SalaryTable from "@/components/salaries/SalaryTable"
import SalaryFormModal from "@/components/salaries/SalaryFormModal"
import PayslipUploadModal from "@/components/salaries/PayslipUploadModal"
import api from "@/lib/api"
import { toast } from "react-toastify"
import { PlusCircle, FileText, Filter, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function SalariesPage() {
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
    } catch (error) {
      console.error("Failed to fetch salaries:", error)
      toast.error("Failed to load salary data")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user) {
      fetchSalaries()
    }
  }, [user, isManager])

  const handleCreate = () => {
    setEditingSalary(null)
    setOpenModal(true)
  }

  const handleEdit = (salary: any) => {
    setEditingSalary(salary)
    setOpenModal(true)
  }

  const handleDelete = async (id: number) => {
    if (confirm("Are you sure you want to delete this salary record?")) {
      try {
        await api.delete(`/salaries/${id}`)
        toast.success("Salary record deleted successfully")
        fetchSalaries()
      } catch (error) {
        console.error("Failed to delete salary record:", error)
        toast.error("Failed to delete salary record")
      }
    }
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
      (filters.employee === "" || salary.user_id === Number(filters.employee))
    )
  })

  // Count payslip requests for notification badge
  const payslipRequestsCount = isManager
    ? salaries.filter((salary: any) => salary.payslip_requested && !salary.file_url).length
    : 0

  return (
    <ProtectedRoute>
      <main className="min-h-screen bg-[#FAF9F7] text-gray-900">
        <div className="mx-auto max-w-7xl p-4 md:p-6 lg:p-8">
          <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <div className="flex items-center">
                <Link
                  href="/"
                  className="mr-3 rounded-full p-1.5 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
                >
                  <ArrowLeft size={18} />
                </Link>
                <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">Salary Management</h1>
              </div>
              <p className="mt-1 text-gray-500">
                {isManager
                  ? "Manage and view salary records for all employees"
                  : "View your salary history and payslips"}
              </p>
            </div>

            {isManager && (
              <div className="flex items-center gap-3">
                <button
                  onClick={handleCreate}
                  className="inline-flex items-center rounded-lg bg-[#6148F4] px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#5040d3] focus:outline-none focus:ring-2 focus:ring-[#6148F4]/50 focus:ring-offset-2"
                >
                  <PlusCircle size={18} className="mr-2" />
                  Create Salary Record
                </button>

                {payslipRequestsCount > 0 && (
                  <div className="relative">
                    <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
                      {payslipRequestsCount}
                    </span>
                    <button
                      onClick={() => {
                        // Filter to show only records with payslip requests
                        setFilters({ ...filters, employee: "" })
                        setShowFilters(true)
                      }}
                      className="inline-flex items-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#6148F4]/50 focus:ring-offset-2"
                    >
                      <FileText size={18} className="mr-2 text-[#6148F4]" />
                      Payslip Requests
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
            <div className="border-b border-gray-100 bg-gray-50 px-6 py-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="text-sm font-medium text-gray-700">
                  {filteredSalaries.length} {filteredSalaries.length === 1 ? "record" : "records"} found
                </div>

                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center rounded-lg bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
                >
                  <Filter size={16} className="mr-1.5 text-gray-500" />
                  Filters
                </button>
              </div>

              {showFilters && (
                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div>
                    <label htmlFor="month-filter" className="mb-1 block text-xs font-medium text-gray-700">
                      Month
                    </label>
                    <select
                      id="month-filter"
                      value={filters.month}
                      onChange={(e) => setFilters({ ...filters, month: e.target.value })}
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-[#6148F4] focus:outline-none focus:ring-1 focus:ring-[#6148F4]/50"
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
                    <label htmlFor="year-filter" className="mb-1 block text-xs font-medium text-gray-700">
                      Year
                    </label>
                    <select
                      id="year-filter"
                      value={filters.year}
                      onChange={(e) => setFilters({ ...filters, year: e.target.value })}
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-[#6148F4] focus:outline-none focus:ring-1 focus:ring-[#6148F4]/50"
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
                      <label htmlFor="employee-filter" className="mb-1 block text-xs font-medium text-gray-700">
                        Employee
                      </label>
                      <select
                        id="employee-filter"
                        value={filters.employee}
                        onChange={(e) => setFilters({ ...filters, employee: e.target.value })}
                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-[#6148F4] focus:outline-none focus:ring-1 focus:ring-[#6148F4]/50"
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

                  <div className="flex items-end sm:col-span-3">
                    <button
                      onClick={() => setFilters({ month: "", year: "", employee: "" })}
                      className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
                    >
                      Clear Filters
                    </button>
                  </div>
                </div>
              )}
            </div>

            <SalaryTable
              salaries={filteredSalaries}
              loading={loading}
              isManager={isManager}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onUploadPayslip={handleUploadPayslip}
              onRequestPayslip={handleRequestPayslip}
              onDownloadPayslip={handleDownloadPayslip}
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
          </>
        )}
      </main>
    </ProtectedRoute>
  )
}
