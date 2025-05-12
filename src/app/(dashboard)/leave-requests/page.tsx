"use client"

import { useState, useEffect, useRef } from "react"
import { useSelector } from "react-redux"
import type { RootState } from "@/lib/redux/store"
import api from "@/lib/api"
import { toast } from "react-toastify"
import LeaveRequestForm from "@/components/leave-requests/LeaveRequestForm"
import LeaveRequestTable from "@/components/leave-requests/LeaveRequestTable"
import LeaveRequestList from "@/components/leave-requests/LeaveRequestList"
import { PlusCircle, Calendar, Filter, Search, LayoutGrid, LayoutList } from "lucide-react"
import { useRouter } from "next/navigation"

// Define interfaces for our data types
interface User {
  id: number
  name: string
  email?: string
  role_id?: number
}

interface LeaveRequest {
  id: number
  user_id: number
  type: string
  start_date: string
  end_date: string
  status: string
  reason: string
  user?: User
  created_at?: string
  manager_id?: number
  manager?: User
}

export default function LeaveRequestsPage() {
  const router = useRouter()
  const user = useSelector((state: RootState) => state.auth.user)
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [openModal, setOpenModal] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [filters, setFilters] = useState({
    status: "",
    type: "",
    month: "",
    year: "",
  })
  const [viewMode, setViewMode] = useState<"table" | "cards">("table")
  const [editRequest, setEditRequest] = useState<LeaveRequest | null>(null)

  // Check if user is HR or owner (can manage all requests)
  const isManager = user?.role_id === 2 || user?.role_id === 3
  const hasRedirected = useRef(false)

  // Function to fetch user information by ID
  const fetchUserInfo = async (userId: number): Promise<User | null> => {
    try {
      const response = await api.get(`/users/${userId}`)
      return response.data
    } catch (error) {
      console.error(`Failed to fetch user info for ID ${userId}:`, error)
      return null
    }
  }

  // Function to fetch leave requests
  const fetchLeaveRequests = async () => {
  setLoading(true)
  try {
    const endpoint = isManager ? "/leave-requests/all" : "/leave-requests/me"

    const res = await api.get(endpoint)

    const requestsWithUsers = await Promise.all(
      res.data.map(async (request: LeaveRequest) => {
        // If user is already included in the response, no need to fetch
        if (request.user && request.user.name) {
          return request
        }

        // Only managers (roles 2 or 3) are allowed to fetch extra user info
        if (isManager) {
          try {
            const userInfo = await api.get(`/users/${request.user_id}`)
            return {
              ...request,
              user: userInfo.data,
            }
          } catch (err) {
            console.warn(`User fetch failed for ID ${request.user_id}`, err)
          }
        }

        return request
      })
    )

    setLeaveRequests(requestsWithUsers)
  } catch (error) {
    toast.error("Failed to fetch leave requests")
    console.error("Failed to fetch leave requests:", error)
  } finally {
    setLoading(false)
  }
}






  useEffect(() => {
    // Block superadmin (role_id 1) from accessing leave requests
    if (user?.role_id === 1 && !hasRedirected.current) {
      hasRedirected.current = true
      toast.error("Superadmin is not allowed to access leave requests.")
      router.push("/dashboard")
      return
    }

    // Only fetch if user is allowed to access
    if (user && user.role_id !== 1) {
      fetchLeaveRequests()
    }
  }, [user, router])

  const handleCreateSuccess = () => {
    setOpenModal(false)
    setEditRequest(null)
    fetchLeaveRequests()
   }

  const handleStatusUpdate = async (id: number, status: string) => {
    try {
      await api.patch(`/leave-requests/${id}/status`, { status })
      toast.success(`Leave request ${status}`)
      fetchLeaveRequests()
    } catch (error) {
      toast.error("Failed to update leave request status")
      console.error("Failed to update leave request status:", error)
    }
  }

  const handleCancel = async (id: number) => {
    try {
      await api.patch(`/leave-requests/${id}/cancel`)
      toast.success("Leave request canceled")
      fetchLeaveRequests()
    } catch (error) {
      toast.error("Failed to cancel leave request")
      console.error("Failed to cancel leave request:", error)
    }
  }

  const handleDelete = async (id: number) => {
    if (!isManager) return

    try {
      await api.delete(`/leave-requests/${id}`)
      toast.success("Leave request deleted")
      fetchLeaveRequests()
    } catch (error) {
      toast.error("Failed to delete leave request")
      console.error("Failed to delete leave request:", error)
    }
  }

  const handleEdit = (request: LeaveRequest) => {
    setEditRequest(request)
    setOpenModal(true)
  }

  // Apply filters to the leave requests
  const filteredRequests = leaveRequests.filter((request) => {
    // Filter by search term
    const searchLower = searchTerm.toLowerCase()
    const matchesSearch =
      searchTerm === "" ||
      (request.user?.name && request.user.name.toLowerCase().includes(searchLower)) ||
      (request.user?.email && request.user.email.toLowerCase().includes(searchLower)) ||
      request.type.toLowerCase().includes(searchLower) ||
      request.reason.toLowerCase().includes(searchLower)

    // Filter by status
    const matchesStatus = filters.status === "" || request.status === filters.status

    // Filter by type
    const matchesType = filters.type === "" || request.type === filters.type

    // Filter by month
    const matchesMonth = filters.month === "" || request.start_date.includes(`-${filters.month}-`)

    // Filter by year
    const matchesYear = filters.year === "" || request.start_date.startsWith(filters.year)

    return matchesSearch && matchesStatus && matchesType && matchesMonth && matchesYear
  })

  // Get unique types for the type filter
  const uniqueTypes = [...new Set(leaveRequests.map((request) => request.type))]

  // Get unique years for the year filter
  const uniqueYears = [...new Set(leaveRequests.map((request) => request.start_date.substring(0, 4)))].sort((a, b) =>
    b.localeCompare(a),
  ) // Sort years in descending order

  // If user is not authenticated or is superadmin, don't render the page
  if (!user || user.role_id === 1) {
    return null
  }

  return (
    <main className="min-h-screen bg-[#FAF9F7] text-gray-900">
      <div className="mx-auto max-w-7xl p-4 md:p-6 lg:p-8">
        <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">Leave Requests</h1>
            <p className="mt-1 text-gray-500">
              {isManager
                ? "Manage and approve leave requests across your organization"
                : "Request and manage your time off"}
            </p>
          </div>

          {/* Only show the button if user has role_id 2, 3, 4, or 5 */}
          {[2, 3, 4, 5].includes(user.role_id) && (
            <button
              onClick={() => {
                setEditRequest(null)
                setOpenModal(true)
              }}
              className="inline-flex items-center rounded-lg bg-[#6148F4] px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#5040d3] focus:outline-none focus:ring-2 focus:ring-[#6148F4]/50 focus:ring-offset-2"
            >
              <PlusCircle size={18} className="mr-2" />
              New Leave Request
            </button>
          )}
        </div>

        {/* Tab Navigation */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="-mb-px flex space-x-6" aria-label="Tabs">
            <button className="flex items-center border-b-2 border-[#6148F4] px-1 py-4 text-sm font-medium text-[#6148F4] transition-colors">
              <Calendar size={18} className="mr-2" />
              {isManager ? "All Leave Requests" : "My Leave Requests"}
            </button>
          </nav>
        </div>


        {/* Filters */}
        <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
          <div className="border-b border-gray-100 bg-gray-50 px-6 py-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="text-sm font-medium text-gray-700">
                {filteredRequests.length} {filteredRequests.length === 1 ? "request" : "requests"} found
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center rounded-lg bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
                >
                  <Filter size={16} className="mr-1.5 text-gray-500" />
                  Filters
                </button>
              </div>
            </div>

            {showFilters && (
              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
               

                {/* Status filter */}
                <div>
                  <label htmlFor="status-filter" className="mb-1 block text-xs font-medium text-gray-700">
                    Status
                  </label>
                  <select
                    id="status-filter"
                    value={filters.status}
                    onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-[#6148F4] focus:outline-none focus:ring-1 focus:ring-[#6148F4]/50"
                  >
                    <option value="">All Statuses</option>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="refused">Refused</option>
                    <option value="canceled">Canceled</option>
                  </select>
                </div>

                {/* Type filter */}
                <div>
                  <label htmlFor="type-filter" className="mb-1 block text-xs font-medium text-gray-700">
                    Leave Type
                  </label>
                  <select
                    id="type-filter"
                    value={filters.type}
                    onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-[#6148F4] focus:outline-none focus:ring-1 focus:ring-[#6148F4]/50"
                  >
                    <option value="">All Types</option>
                    {uniqueTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Month filter */}
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
                    <option value="01">January</option>
                    <option value="02">February</option>
                    <option value="03">March</option>
                    <option value="04">April</option>
                    <option value="05">May</option>
                    <option value="06">June</option>
                    <option value="07">July</option>
                    <option value="08">August</option>
                    <option value="09">September</option>
                    <option value="10">October</option>
                    <option value="11">November</option>
                    <option value="12">December</option>
                  </select>
                </div>

                {/* Year filter */}
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
                    {uniqueYears.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Clear filters button */}
                <div className="flex items-end sm:col-span-2 lg:col-span-3">
                  <button
                    onClick={() => {
                      setFilters({ status: "", type: "", month: "", year: "" })
                      setSearchTerm("")
                    }}
                    className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
                  >
                    Clear Filters
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Leave Request Display */}
          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#6148F4] border-t-transparent"></div>
            </div>
          ) : viewMode === "table" ? (
            <LeaveRequestTable
              requests={filteredRequests}
              isManager={isManager}
              userId={user?.id}
              onStatusUpdate={handleStatusUpdate}
              onCancel={handleCancel}
              onDelete={handleDelete}
              onEdit={handleEdit}
            />
          ) : (
            <LeaveRequestList
              requests={filteredRequests}
              isManager={isManager}
              userId={user?.id}
              onStatusUpdate={handleStatusUpdate}
              onCancel={handleCancel}
              onDelete={handleDelete}
              onEdit={handleEdit}
            />
          )}
        </div>
      </div>

      {/* Leave Request Form Modal */}
      <LeaveRequestForm
        open={openModal}
        onClose={() => {
          setOpenModal(false)
          setEditRequest(null)
        }}
        onSuccess={handleCreateSuccess}
        isManager={isManager}
        userId={user?.id}
        userRole={user?.role_id}
        editRequest={editRequest}
      />
    </main>
  )
}
