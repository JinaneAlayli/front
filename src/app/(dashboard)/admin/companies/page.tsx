"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import api from "@/lib/api"
import RoleGuard from "@/components/RoleGuard"
import { useSelector } from "react-redux"
import type { RootState } from "@/lib/redux/store"
import {
  Search,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  XCircle,
  AlertCircle,
  Check,
  X,
} from "lucide-react"
import DeleteConfirmationModal from "@/components/DeleteConfirmationModal"
import { toast } from "react-toastify"

interface Company {
  id: number
  name: string
  company_code: string
  status: string
  billing_cycle: string
  ends_at: string
  started_at: string
  owner: {
    id: number
    name: string
    email: string
    role_id?: number
  }
  subscription_plan: {
    id: number
    name: string
    price: string
  }
}

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  const [totalPages, setTotalPages] = useState(1)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [companyToDelete, setCompanyToDelete] = useState<number | null>(null)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState<Partial<Company>>({})
  const [subscriptionPlans, setSubscriptionPlans] = useState<{ id: number; name: string; price: string }[]>([])
  
  const router = useRouter()

const currentUser = useSelector((state: RootState) => state.auth.user)
 useEffect(() => {
  if (currentUser?.role_id === 1) {
    fetchCompanies()
    fetchSubscriptionPlans()
  }
}, [currentUser])

  const fetchCompanies = async () => {
    try {
      setLoading(true)
      const response = await api.get("/companies/all")

      // Filter out companies where owner has role_id === 1 (platform owners)
      const filteredCompanies = response.data.filter((company: Company) => company.owner?.role_id !== 1)

      setCompanies(filteredCompanies)
      setTotalPages(Math.ceil(filteredCompanies.length / itemsPerPage))
    } catch (error) {
      console.error("Failed to fetch companies:", error)
      toast.error("Failed to load companies")
    } finally {
      setLoading(false)
    }
  }

  const fetchSubscriptionPlans = async () => {
    try {
      const response = await api.get("/subscription-plans")
      setSubscriptionPlans(response.data)
    } catch (error) {
      console.error("Failed to fetch subscription plans:", error)
    }
  }

  const handleEdit = (id: number) => {
    const company = companies.find((c) => c.id === id)
    if (company) {
      setEditingId(id)
      setForm({
        status: company.status,
        billing_cycle: company.billing_cycle,
        subscription_plan: company.subscription_plan,
        ends_at: company.ends_at,
      })
    }
  }

  const cancelEdit = () => {
    setEditingId(null)
    setForm({})
  }

  const handleUpdate = async (companyId: number) => {
    try {
      await api.patch(`/companies/${companyId}`, {
        status: form.status,
        billing_cycle: form.billing_cycle,
        subscription_plan_id: (form.subscription_plan as any)?.id,
        ends_at: form.ends_at,
      })
      toast.success("Company updated successfully")
      setEditingId(null)
      fetchCompanies() // Refresh the list after update
    } catch (error) {
      console.error("Failed to update company:", error)
      toast.error("Failed to update company")
    }
  }

  const handleDelete = (id: number) => {
    setCompanyToDelete(id)
    setDeleteModalOpen(true)
  }

  const confirmDelete = () => {
    setDeleteModalOpen(false)
    fetchCompanies() // Refresh the list after deletion
  }

  const filteredCompanies = companies.filter(
    (company) =>
      company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      company.owner.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      company.owner.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      company.company_code.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentItems = filteredCompanies.slice(indexOfFirstItem, indexOfLastItem)

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber)

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Active
          </span>
        )
      case "expired":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <XCircle className="w-3 h-3 mr-1" />
            Expired
          </span>
        )
      case "pending":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <AlertCircle className="w-3 h-3 mr-1" />
            Pending
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            {status}
          </span>
        )
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  return (
    <RoleGuard allowedRoles={[1]}>
    <div className="p-6">
      <div className="mb-6">
        
        <h1 className="text-2xl font-bold text-gray-900">Companies Management</h1>
        <p className="text-gray-500">Manage all companies on the platform</p>
      </div>

      <div className="mb-6 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="relative w-full sm:w-64">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-[#6148F4] focus:border-[#6148F4] sm:text-sm"
            placeholder="Search companies..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#6148F4] border-t-transparent"></div>
        </div>
      ) : (
        <>
          <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Company
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Owner
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Plan
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Billing
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Status
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Expires
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentItems.length > 0 ? (
                  currentItems.map((company) => (
                    <tr
                      key={company.id}
                      className={`transition-colors ${editingId === company.id ? "bg-gray-50" : "hover:bg-gray-50"}`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{company.name}</div>
                            <div className="text-xs text-gray-500">{company.company_code}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{company.owner.name}</div>
                        <div className="text-xs text-gray-500">{company.owner.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {editingId === company.id ? (
                          <select
                            className="w-full rounded border px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-[#6148F4]"
                            value={(form.subscription_plan as any)?.id || ""}
                            onChange={(e) => {
                              const selectedPlan = subscriptionPlans.find((p) => p.id === Number(e.target.value))
                              if (selectedPlan) {
                                setForm({ ...form, subscription_plan: selectedPlan })
                              }
                            }}
                          >
                            {subscriptionPlans.map((plan) => (
                              <option key={plan.id} value={plan.id}>
                                {plan.name} (${plan.price}/mo)
                              </option>
                            ))}
                          </select>
                        ) : (
                          <>
                            <div className="text-sm text-gray-900">{company.subscription_plan.name}</div>
                            <div className="text-xs text-gray-500">${company.subscription_plan.price}/mo</div>
                          </>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {editingId === company.id ? (
                          <select
                            className="w-full rounded border px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-[#6148F4]"
                            value={form.billing_cycle || ""}
                            onChange={(e) => setForm({ ...form, billing_cycle: e.target.value })}
                          >
                            <option value="monthly">Monthly</option>
                            <option value="yearly">Yearly</option>
                          </select>
                        ) : (
                          <div className="text-sm text-gray-900 capitalize">{company.billing_cycle}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {editingId === company.id ? (
                          <select
                            className="w-full rounded border px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-[#6148F4]"
                            value={form.status || ""}
                            onChange={(e) => setForm({ ...form, status: e.target.value })}
                          >
                            <option value="active">Active</option>
                            <option value="expired">Expired</option>
                            <option value="pending">Pending</option>
                          </select>
                        ) : (
                          getStatusBadge(company.status)
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {editingId === company.id ? (
                          <input
                            type="date"
                            className="w-full rounded border px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-[#6148F4]"
                            value={form.ends_at ? new Date(form.ends_at).toISOString().split("T")[0] : ""}
                            onChange={(e) => setForm({ ...form, ends_at: e.target.value })}
                          />
                        ) : (
                          <div className="text-sm text-gray-900">{formatDate(company.ends_at)}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {editingId === company.id ? (
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => handleUpdate(company.id)}
                              className="rounded bg-[#6148F4] p-1.5 text-white transition-colors hover:bg-[#5040d3]"
                            >
                              <Check className="h-4 w-4" />
                            </button>
                            <button
                              onClick={cancelEdit}
                              className="rounded bg-gray-400 p-1.5 text-white transition-colors hover:bg-gray-500"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => handleEdit(company.id)}
                              className="rounded bg-gray-100 p-1.5 text-gray-600 transition-colors hover:bg-gray-200"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(company.id)}
                              className="rounded bg-red-100 p-1.5 text-red-600 transition-colors hover:bg-red-200"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">
                      No companies found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {filteredCompanies.length > itemsPerPage && (
            <div className="flex justify-between items-center mt-6">
              <div className="text-sm text-gray-700">
                Showing <span className="font-medium">{indexOfFirstItem + 1}</span> to{" "}
                <span className="font-medium">{Math.min(indexOfLastItem, filteredCompanies.length)}</span> of{" "}
                <span className="font-medium">{filteredCompanies.length}</span> results
              </div>
              <nav className="flex items-center">
                <button
                  onClick={() => paginate(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${
                    currentPage === 1 ? "text-gray-300 cursor-not-allowed" : "text-gray-500 hover:bg-gray-50"
                  }`}
                >
                  <span className="sr-only">Previous</span>
                  <ChevronLeft className="h-5 w-5" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => (
                  <button
                    key={i}
                    onClick={() => paginate(i + 1)}
                    className={`relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium ${
                      currentPage === i + 1 ? "text-[#6148F4] bg-[#6148F4]/10" : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  onClick={() => paginate(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
                    currentPage === totalPages ? "text-gray-300 cursor-not-allowed" : "text-gray-500 hover:bg-gray-50"
                  }`}
                >
                  <span className="sr-only">Next</span>
                  <ChevronRight className="h-5 w-5" />
                </button>
              </nav>
            </div>
          )}
        </>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Company"
        message="This will permanently delete the company and all associated data. This action cannot be undone."
        itemId={companyToDelete || undefined}
        endpoint="/companies"
        successMessage="Company deleted successfully"
      />
    </div>
    </RoleGuard>
  )
}
