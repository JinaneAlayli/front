"use client"

import { useState } from "react"
import { Calendar, Clock, User, CheckCircle, XCircle, AlertCircle, MoreVertical } from "lucide-react"

interface LeaveRequestCardProps {
  request: any
  isManager: boolean
  isOwner: boolean
  onStatusUpdate: (id: number, status: string) => void
  onCancel: (id: number) => void
}

export default function LeaveRequestCard({
  request,
  isManager,
  isOwner,
  onStatusUpdate,
  onCancel,
}: LeaveRequestCardProps) {
  const [showActions, setShowActions] = useState(false)
  const [processing, setProcessing] = useState(false)

  // Function to format date
  const formatDate = (dateString: string) => {
    if (!dateString) return "-"
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
  }

  // Calculate the number of days
  const calculateDays = () => {
    const start = new Date(request.start_date)
    const end = new Date(request.end_date)
    const diffTime = Math.abs(end.getTime() - start.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1 // Include both start and end days

    return diffDays
  }

  const days = calculateDays()

  // Function to get status badge
  const getStatusBadge = () => {
    switch (request.status) {
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
            <XCircle size={12} className="mr-1" />
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
  const getTypeBadge = () => {
    switch (request.type) {
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
            Other
          </span>
        )
    }
  }

  const handleAction = async (action: string) => {
    setProcessing(true)
    try {
      if (action === "cancel") {
        await onCancel(request.id)
      } else {
        await onStatusUpdate(request.id, action)
      }
    } finally {
      setProcessing(false)
      setShowActions(false)
    }
  }

  return (
    <div
      className={`rounded-xl border ${
        request.status === "approved"
          ? "border-green-100 bg-green-50/30"
          : request.status === "refused" || request.status === "canceled"
            ? "border-red-100 bg-red-50/10"
            : "border-gray-100 bg-white"
      } p-5 shadow-sm transition-all hover:shadow-md`}
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            {getTypeBadge()}
            {getStatusBadge()}
          </div>

          <div className="mt-3">
            <div className="flex items-center text-sm text-gray-600">
              <Calendar size={14} className="mr-1.5" />
              <span>
                {formatDate(request.start_date)} - {formatDate(request.end_date)}
              </span>
            </div>
            <div className="mt-1 flex items-center text-sm text-gray-600">
              <Clock size={14} className="mr-1.5" />
              <span>
                {days} {days === 1 ? "day" : "days"}
              </span>
            </div>
            {request.user && (
              <div className="mt-1 flex items-center text-sm text-gray-600">
                <User size={14} className="mr-1.5" />
                <span>{request.user.name}</span>
              </div>
            )}
          </div>
        </div>

        <div className="relative">
          <button
            onClick={() => setShowActions(!showActions)}
            className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <MoreVertical size={16} />
          </button>

          {showActions && (
            <div className="absolute right-0 z-10 mt-1 w-48 rounded-md border border-gray-100 bg-white py-1 shadow-lg">
              {isManager && request.status === "pending" && (
                <>
                  <button
                    onClick={() => handleAction("approved")}
                    disabled={processing}
                    className="flex w-full items-center px-4 py-2 text-left text-sm text-green-600 hover:bg-green-50"
                  >
                    <CheckCircle size={14} className="mr-2" />
                    Approve Request
                  </button>
                  <button
                    onClick={() => handleAction("refused")}
                    disabled={processing}
                    className="flex w-full items-center px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                  >
                    <XCircle size={14} className="mr-2" />
                    Refuse Request
                  </button>
                </>
              )}
              {isOwner && request.status === "pending" && (
                <button
                  onClick={() => handleAction("cancel")}
                  disabled={processing}
                  className="flex w-full items-center px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                >
                  <XCircle size={14} className="mr-2" />
                  Cancel Request
                </button>
              )}
              {!isManager && !isOwner && <div className="px-4 py-2 text-sm text-gray-500">No actions available</div>}
              {(request.status !== "pending" || processing) && (
                <div className="px-4 py-2 text-sm text-gray-500">
                  {processing ? "Processing..." : "No actions available"}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="mt-4">
        <h3 className="text-sm font-medium text-gray-700">Reason:</h3>
        <p className="mt-1 whitespace-pre-line text-sm text-gray-600">{request.reason}</p>
      </div>
    </div>
  )
}
