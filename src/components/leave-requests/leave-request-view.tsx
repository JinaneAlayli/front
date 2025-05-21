"use client"

import { useState } from "react"
import { Calendar, Clock, CheckCircle, XCircle, AlertCircle, FileText, Edit, Slash } from "lucide-react"

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

interface LeaveRequestViewProps {
  requests: LeaveRequest[]
  isManager: boolean
  userId: number
  onStatusUpdate: (id: number, status: string) => void
  onCancel: (id: number) => void
  onDelete: (id: number) => void
  onEdit: (request: LeaveRequest) => void
}

export default function LeaveRequestView({
  requests,
  isManager,
  userId,
  onStatusUpdate,
  onCancel,
  onDelete,
  onEdit,
}: LeaveRequestViewProps) {
  const [expandedReasons, setExpandedReasons] = useState<number[]>([])

  // Function to format date
  const formatDate = (dateString: string) => {
    if (!dateString) return "-"
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
  }

  // Calculate the number of days
  const calculateDays = (startDate: string, endDate: string) => {
    if (!startDate || !endDate) return 0

    const start = new Date(startDate)
    const end = new Date(endDate)

    // Check if dates are valid
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return 0

    const diffTime = Math.abs(end.getTime() - start.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1 // Include both start and end days

    return diffDays
  }

  // Function to get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return (
          <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700">
            <CheckCircle size={12} className="mr-1" />
            Approved
          </span>
        )
      case "refused":
        return (
          <span className="inline-flex items-center rounded-full bg-red-50 px-2 py-1 text-xs font-medium text-red-700">
            <Slash size={12} className="mr-1" />
            Refused
          </span>
        )
      case "canceled":
        return (
          <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700">
            <XCircle size={12} className="mr-1" />
            Canceled
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">
            <AlertCircle size={12} className="mr-1" />
            Pending
          </span>
        )
    }
  }

  // Function to get leave type badge
  const getTypeBadge = (type: string) => {
    switch (type) {
      case "vacation":
        return (
          <span className="inline-flex items-center rounded-full bg-purple-50 px-2 py-1 text-xs font-medium text-purple-700">
            Vacation
          </span>
        )
      case "sick":
        return (
          <span className="inline-flex items-center rounded-full bg-yellow-50 px-2 py-1 text-xs font-medium text-yellow-700">
            Sick Leave
          </span>
        )
      case "personal":
        return (
          <span className="inline-flex items-center rounded-full bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-700">
            Personal Leave
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700">
            {type}
          </span>
        )
    }
  }

  const handleAction = async (requestId: number, action: string) => {
    try {
      if (action === "cancel") {
        await onCancel(requestId)
      } else if (action === "delete") {
        await onDelete(requestId)
      } else if (action === "edit") {
        const request = requests.find((r) => r.id === requestId)
        if (request) {
          onEdit(request)
        }
      } else {
        await onStatusUpdate(requestId, action)
      }
    } catch (error) {
      console.error("Action failed:", error)
    }
  }

  // Toggle reason expansion
  const toggleReasonExpansion = (id: number) => {
    setExpandedReasons((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]))
  }

  // Get user's name and initial for avatar
  const getUserInfo = (request: LeaveRequest) => {
    // If user object exists with name, use it
    if (request.user && request.user.name) {
      return {
        name: request.user.name,
        email: request.user.email || "",
        initial: request.user.name.charAt(0).toUpperCase(),
      }
    }

    // Fallback to user_id
    return {
      name: `User #${request.user_id}`,
      email: "",
      initial: "#",
    }
  }

  if (requests.length === 0) {
    return (
      <div className="flex h-40 flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50 p-6 text-center">
        <div className="mb-2 rounded-full bg-gray-100 p-3">
          <Calendar className="h-6 w-6 text-gray-400" />
        </div>
        <h3 className="text-sm font-medium text-gray-900">No leave requests found</h3>
        <p className="mt-1 text-xs text-gray-500">Create a new leave request to get started</p>
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
              Type
            </th>
            <th className="whitespace-nowrap px-6 py-4 text-sm font-medium uppercase tracking-wider text-gray-500">
              Status
            </th>
            <th className="whitespace-nowrap px-6 py-4 text-sm font-medium uppercase tracking-wider text-gray-500">
              Date Range
            </th>
            <th className="whitespace-nowrap px-6 py-4 text-sm font-medium uppercase tracking-wider text-gray-500">
              Days
            </th>
            <th className="whitespace-nowrap px-6 py-4 text-sm font-medium uppercase tracking-wider text-gray-500">
              Reason
            </th>
            <th className="whitespace-nowrap px-6 py-4 text-sm font-medium uppercase tracking-wider text-gray-500">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {requests.map((request) => {
            const days = calculateDays(request.start_date, request.end_date)
            const isOwner = request.user_id === userId
            const userInfo = getUserInfo(request)
            const isReasonExpanded = expandedReasons.includes(request.id)
            const canEdit = isOwner && request.status === "pending"

            return (
              <tr
                key={request.id}
                className={`transition-colors hover:bg-gray-50 ${
                  request.status === "approved"
                    ? "bg-green-50/30"
                    : request.status === "refused" || request.status === "canceled"
                      ? "bg-red-50/10"
                      : ""
                }`}
              >
                {isManager && (
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="flex items-center">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#6148F4]/10 text-sm font-medium text-[#6148F4]">
                        {userInfo.initial}
                      </div>
                      <div className="ml-3">
                        <div className="font-medium text-gray-900">{userInfo.name}</div>
                        <div className="text-xs text-gray-500">{userInfo.email}</div>
                      </div>
                    </div>
                  </td>
                )}
                <td className="whitespace-nowrap px-6 py-4">{getTypeBadge(request.type)}</td>
                <td className="whitespace-nowrap px-6 py-4">{getStatusBadge(request.status)}</td>
                <td className="whitespace-nowrap px-6 py-4">
                  <div className="flex items-center">
                    <Calendar size={16} className="mr-2 text-gray-400" />
                    <span className="text-gray-900">
                      {formatDate(request.start_date)} - {formatDate(request.end_date)}
                    </span>
                  </div>
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  <div className="flex items-center">
                    <Clock size={16} className="mr-2 text-gray-400" />
                    <span className="text-gray-900">
                      {days} {days === 1 ? "day" : "days"}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-start">
                    <FileText size={16} className="mr-2 mt-0.5 flex-shrink-0 text-gray-400" />
                    <div>
                      <span className={`${isReasonExpanded ? "" : "line-clamp-2"} text-gray-900`}>
                        {request.reason}
                      </span>
                      {request.reason.length > 100 && (
                        <button
                          onClick={() => toggleReasonExpansion(request.id)}
                          className="mt-1 text-xs font-medium text-[#6148F4] hover:underline"
                        >
                          {isReasonExpanded ? "Show less" : "Show more"}
                        </button>
                      )}
                    </div>
                  </div>
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  <div className="flex items-center space-x-2">
                    {isManager && request.status === "pending" && (
                      <>
                        <button
                          onClick={() => handleAction(request.id, "approved")}
                          className="rounded-full p-1.5 text-green-600 hover:bg-green-50"
                          title="Approve Request"
                        >
                          <CheckCircle size={16} />
                        </button>
                        <button
                          onClick={() => handleAction(request.id, "refused")}
                          className="rounded-full p-1.5 text-red-600 hover:bg-red-50"
                          title="Refuse Request"
                        >
                          <Slash size={16} />
                        </button>
                      </>
                    )}
                    {canEdit && (
                      <button
                        onClick={() => handleAction(request.id, "edit")}
                        className="rounded-full p-1.5 text-blue-600 hover:bg-blue-50"
                        title="Edit Request"
                      >
                        <Edit size={16} />
                      </button>
                    )}
                    {isOwner && request.status === "pending" && (
                      <button
                        onClick={() => handleAction(request.id, "cancel")}
                        className="rounded-full p-1.5 text-gray-600 hover:bg-gray-50"
                        title="Cancel Request"
                      >
                        <XCircle size={16} />
                      </button>
                    )}
                    {isManager && (
                      <button
                        onClick={() => handleAction(request.id, "delete")}
                        className="rounded-full p-1.5 text-red-600 hover:bg-red-50"
                        title="Delete Request"
                      >
                        <XCircle size={16} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
