"use client"

import { useState, useEffect,useRef } from "react"
import { useSelector } from "react-redux"
import type { RootState } from "@/lib/redux/store"
import api from "@/lib/api"
import { toast } from "react-toastify"
import LeaveRequestForm from "@/components/leave-requests/LeaveRequestForm"
import LeaveRequestList from "@/components/leave-requests/LeaveRequestList"
import { PlusCircle, Calendar, Filter } from "lucide-react"
import { useRouter } from "next/navigation"

export default function LeaveRequestsPage() {
  const router = useRouter()
  const user = useSelector((state: RootState) => state.auth.user)
  const [leaveRequests, setLeaveRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [openModal, setOpenModal] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState({
    status: "",
    type: "",
  })

  // Check if user is HR or owner (can manage all requests)
  const isManager = user?.role_id === 2 || user?.role_id === 3

  const fetchLeaveRequests = async () => {
    setLoading(true)
    try {
      const res = await api.get("/leave-requests")
      setLeaveRequests(res.data)
    } catch (error) {
      toast.error("Failed to fetch leave requests")
      console.error("Failed to fetch leave requests:", error)
    } finally {
      setLoading(false)
    }
  }
const hasRedirected = useRef(false)
  useEffect(() => {
    if (user?.role_id === 1 && !hasRedirected.current) {
      hasRedirected.current = true
      toast.error("Superadmin is not allowed to access leave requests.")
      router.push("/dashboard")
    }
  }, [user])

  const handleCreateSuccess = () => {
    setOpenModal(false)
    fetchLeaveRequests()
    toast.success("Leave request submitted successfully")
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

  const filteredRequests = leaveRequests.filter((request: any) => {
    return (
      (filters.status === "" || request.status === filters.status) &&
      (filters.type === "" || request.type === filters.type)
    )
  })

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

          <button
            onClick={() => setOpenModal(true)}
            className="inline-flex items-center rounded-lg bg-[#6148F4] px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#5040d3] focus:outline-none focus:ring-2 focus:ring-[#6148F4]/50 focus:ring-offset-2"
          >
            <PlusCircle size={18} className="mr-2" />
            New Leave Request
          </button>
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

              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center rounded-lg bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
              >
                <Filter size={16} className="mr-1.5 text-gray-500" />
                Filters
              </button>
            </div>

            {showFilters && (
              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label htmlFor="status-filter" className="mb-1 block text-xs font-medium text-gray-700">
                    Filter by Status
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

                <div>
                  <label htmlFor="type-filter" className="mb-1 block text-xs font-medium text-gray-700">
                    Filter by Type
                  </label>
                  <select
                    id="type-filter"
                    value={filters.type}
                    onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-[#6148F4] focus:outline-none focus:ring-1 focus:ring-[#6148F4]/50"
                  >
                    <option value="">All Types</option>
                    <option value="vacation">Vacation</option>
                    <option value="sick">Sick Leave</option>
                    <option value="personal">Personal Leave</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div className="flex items-end sm:col-span-2">
                  <button
                    onClick={() => setFilters({ status: "", type: "" })}
                    className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
                  >
                    Clear Filters
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Leave Request List */}
          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#6148F4] border-t-transparent"></div>
            </div>
          ) : (
            <LeaveRequestList
              requests={filteredRequests}
              isManager={isManager}
              userId={user?.id}
              onStatusUpdate={handleStatusUpdate}
              onCancel={handleCancel}
            />
          )}
        </div>
      </div>

      {/* Leave Request Form Modal */}
      <LeaveRequestForm
        open={openModal}
        onClose={() => setOpenModal(false)}
        onSuccess={handleCreateSuccess}
        isManager={isManager}
        userId={user?.id}
      />
    </main>
  )
}
