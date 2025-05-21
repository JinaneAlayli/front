"use client"

import { useState, useEffect } from "react"
import api from "@/lib/api"
import { toast } from "react-toastify"
import { X, Calendar, FileText, Clock, Plus, Edit, User } from "lucide-react"

interface ILeaveRequestUser {
  id: number
  name: string
  email?: string
  role_id?: number
}

interface LeaveRequest {
  id?: number
  user_id: number
  type: string
  start_date: string
  end_date: string
  status: string
  reason: string
  user?: ILeaveRequestUser
  created_at?: string
  manager_id?: number
  manager?: ILeaveRequestUser
}

interface LeaveRequestFormProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  isManager: boolean
  userId: number
  userRole: number
  editRequest?: LeaveRequest | null
}

export default function LeaveRequestForm({
  open,
  onClose,
  onSuccess,
  isManager,
  userId,
  userRole,
  editRequest = null,
}: LeaveRequestFormProps) {
  const [type, setType] = useState("vacation")
  const [customType, setCustomType] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [reason, setReason] = useState("")
  const [selectedEmployee, setSelectedEmployee] = useState<number | null>(null)
  const [employees, setEmployees] = useState<ILeaveRequestUser[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showCustomType, setShowCustomType] = useState(false)

  // Only role IDs 2 and 3 can create requests for other employees
  const canCreateForOthers = userRole === 2 || userRole === 3
  const isEditMode = !!editRequest?.id

  // Set form values when editing
  useEffect(() => {
    if (editRequest) {
      // Handle custom type
      if (["vacation", "sick", "personal"].includes(editRequest.type)) {
        setType(editRequest.type)
        setShowCustomType(false)
      } else {
        setType("custom")
        setCustomType(editRequest.type)
        setShowCustomType(true)
      }

      setStartDate(editRequest.start_date)
      setEndDate(editRequest.end_date)
      setReason(editRequest.reason)
      setSelectedEmployee(editRequest.user_id !== userId ? editRequest.user_id : null)
    }
  }, [editRequest, userId])

  useEffect(() => {
    if (!open || !canCreateForOthers) return

    const fetchEmployees = async () => {
      try {
        // Only fetch employees with role_id 4 or 5 as per requirements
        const res = await api.get("/users?role_ids=4,5")
        // Filter out the current user from the employees list
        setEmployees(res.data.filter((employee: ILeaveRequestUser) => employee.id !== userId))
      } catch (error) {
        console.error("Failed to load employees", error)
        toast.error("Failed to load employees")
      }
    }

    fetchEmployees()
  }, [open, canCreateForOthers, userId])

  const resetForm = () => {
    setType("vacation")
    setCustomType("")
    setShowCustomType(false)
    setStartDate("")
    setEndDate("")
    setReason("")
    setSelectedEmployee(null)
  }

  const handleSubmit = async () => {
    if (!startDate) {
      toast.error("Start date is required")
      return
    }

    if (!endDate) {
      toast.error("End date is required")
      return
    }

    if (!reason.trim()) {
      toast.error("Reason is required")
      return
    }

    // Validate date range
    const start = new Date(startDate)
    const end = new Date(endDate)

    if (end < start) {
      toast.error("End date cannot be before start date")
      return
    }

    setIsSubmitting(true)

    try {
      const finalType = type === "custom" ? customType : type

      const payload = {
        type: finalType,
        start_date: startDate,
        end_date: endDate,
        reason,
        user_id: canCreateForOthers && selectedEmployee ? selectedEmployee : userId,
      }

      if (isEditMode && editRequest?.id) {
        // Update existing request
        await api.patch(`/leave-requests/${editRequest.id}`, payload)
        toast.success("Leave request updated successfully")
      } else {
        // Create new request
        await api.post("/leave-requests", payload)
        toast.success("Leave request submitted successfully")
      }

      resetForm()
      onSuccess()
    } catch (error: any) {
      const status = error?.response?.status
      const backendMessage = error?.response?.data?.message

      if (status === 403) {
        if (typeof backendMessage === "string") {
          toast.error(backendMessage)
        } else if (Array.isArray(backendMessage)) {
          toast.error(backendMessage[0])
        } else {
          toast.error("You already have a pending request.")
        }
        return
      }

      console.error(`Failed to ${isEditMode ? "update" : "submit"} leave request:`, error)
      toast.error("An unexpected error occurred.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const calculateDays = () => {
    if (!startDate || !endDate) return null

    const start = new Date(startDate)
    const end = new Date(endDate)

    if (isNaN(start.getTime()) || isNaN(end.getTime())) return null

    const diffTime = Math.abs(end.getTime() - start.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1 // Include both start and end days

    return diffDays
  }

  const daysCount = calculateDays()

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-md overflow-hidden rounded-xl bg-white shadow-xl animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between border-b border-gray-100 bg-[#6148F4]/5 p-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">
              {isEditMode ? "Edit Leave Request" : "New Leave Request"}
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              {isEditMode ? "Update your request details" : "Submit a request for time off"}
            </p>
          </div>
          <button onClick={onClose} className="focus:outline-none text-gray-400 hover:text-gray-600" aria-label="Close">
            <X size={24} />
          </button>
        </div>

        <div className="max-h-[calc(90vh-80px)] overflow-y-auto space-y-5 p-6">
          <div className="space-y-5">
            {/* Leave Type */}
            <div>
              <label htmlFor="leave-type" className="mb-1 block text-sm font-medium text-gray-700">
                Leave Type
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Calendar size={18} className="text-gray-400" />
                </div>
                <select
                  id="leave-type"
                  className="block w-full appearance-none rounded-lg border border-gray-300 bg-none py-3 pl-10 pr-10 text-sm shadow-sm transition-all focus:border-[#6148F4] focus:outline-none focus:ring-2 focus:ring-[#6148F4]/20"
                  value={type}
                  onChange={(e) => {
                    setType(e.target.value)
                    setShowCustomType(e.target.value === "custom")
                  }}
                >
                  <option value="vacation">Vacation</option>
                  <option value="sick">Sick Leave</option>
                  <option value="personal">Personal Leave</option>
                  <option value="custom">Custom Type</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                  <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Custom Leave Type */}
            {showCustomType && (
              <div>
                <label htmlFor="custom-type" className="mb-1 block text-sm font-medium text-gray-700">
                  Specify Leave Type
                </label>
                <div className="relative rounded-md shadow-sm">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Plus size={18} className="text-gray-400" />
                  </div>
                  <input
                    type="text"
                    id="custom-type"
                    placeholder="Enter custom leave type"
                    className="block w-full rounded-lg border border-gray-300 py-3 pl-10 pr-3 text-sm shadow-sm transition-all focus:border-[#6148F4] focus:outline-none focus:ring-2 focus:ring-[#6148F4]/20"
                    value={customType}
                    onChange={(e) => setCustomType(e.target.value)}
                    required={type === "custom"}
                  />
                </div>
              </div>
            )}

            {/* Date Range */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="start-date" className="mb-1 block text-sm font-medium text-gray-700">
                  Start Date
                </label>
                <div className="relative rounded-md shadow-sm">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Calendar size={18} className="text-gray-400" />
                  </div>
                  <input
                    type="date"
                    id="start-date"
                    className="block w-full rounded-lg border border-gray-300 py-3 pl-10 pr-3 text-sm shadow-sm transition-all focus:border-[#6148F4] focus:outline-none focus:ring-2 focus:ring-[#6148F4]/20"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    min={!isEditMode ? new Date().toISOString().split("T")[0] : undefined}
                    required
                  />
                </div>
              </div>
              <div>
                <label htmlFor="end-date" className="mb-1 block text-sm font-medium text-gray-700">
                  End Date
                </label>
                <div className="relative rounded-md shadow-sm">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Calendar size={18} className="text-gray-400" />
                  </div>
                  <input
                    type="date"
                    id="end-date"
                    className="block w-full rounded-lg border border-gray-300 py-3 pl-10 pr-3 text-sm shadow-sm transition-all focus:border-[#6148F4] focus:outline-none focus:ring-2 focus:ring-[#6148F4]/20"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    min={startDate || (!isEditMode ? new Date().toISOString().split("T")[0] : undefined)}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Days Count */}
            {daysCount && (
              <div className="rounded-lg bg-[#6148F4]/5 p-3 text-center">
                <div className="flex items-center justify-center">
                  <Clock size={16} className="mr-2 text-[#6148F4]" />
                  <span className="text-sm font-medium text-gray-700">
                    {daysCount} {daysCount === 1 ? "day" : "days"} requested
                  </span>
                </div>
              </div>
            )}

            {/* Reason */}
            <div>
              <label htmlFor="reason" className="mb-1 block text-sm font-medium text-gray-700">
                Reason
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <FileText size={18} className="text-gray-400" />
                </div>
                <textarea
                  id="reason"
                  placeholder="Please provide a reason for your leave request"
                  className="block w-full rounded-lg border border-gray-300 py-3 pl-10 pr-3 text-sm shadow-sm transition-all focus:border-[#6148F4] focus:outline-none focus:ring-2 focus:ring-[#6148F4]/20"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={4}
                  required
                />
              </div>
            </div>

            {/* Employee Selection (Only for role IDs 2 and 3) */}
            {canCreateForOthers && (
              <div>
                <label htmlFor="employee" className="mb-1 block text-sm font-medium text-gray-700">
                  Create request for:
                </label>
                <div className="relative rounded-md shadow-sm">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <User size={18} className="text-gray-400" />
                  </div>
                  <select
                    id="employee"
                    className="block w-full appearance-none rounded-lg border border-gray-300 bg-none py-3 pl-10 pr-10 text-sm shadow-sm transition-all focus:border-[#6148F4] focus:outline-none focus:ring-2 focus:ring-[#6148F4]/20"
                    value={selectedEmployee || ""}
                    onChange={(e) => setSelectedEmployee(e.target.value ? Number(e.target.value) : null)}
                  >
                    <option value="">Myself</option>
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
              disabled={isSubmitting || (type === "custom" && !customType.trim())}
              className="flex flex-1 items-center justify-center rounded-lg bg-[#6148F4] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#5040d3] focus:outline-none focus:ring-2 focus:ring-[#6148F4]/50 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? (
                "Submitting..."
              ) : isEditMode ? (
                <>
                  <Edit size={16} className="mr-2" />
                  Update Request
                </>
              ) : (
                "Submit Request"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
