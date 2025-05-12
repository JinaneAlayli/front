"use client"

import { useState } from "react"
import { Calendar, Clock, User, CheckCircle, XCircle, AlertCircle, MoreVertical, Edit } from "lucide-react"

interface LeaveRequestCardProps {
  request: any
  isManager: boolean
  isOwner: boolean
  onStatusUpdate: (id: number, status: string) => void
  onCancel: (id: number) => void
  onDelete?: (id: number) => void
  onEdit?: (request: any) => void
}

export default function LeaveRequestCard({
  request,
  isManager,
  isOwner,
  onStatusUpdate,
  onCancel,
  onDelete,
  onEdit,
}: LeaveRequestCardProps) {
  const [showActions, setShowActions] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [expanded, setExpanded] = useState(false)

  // Function to format date
  const formatDate = (dateString: string) => {
    if (!dateString) return "-"
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
  }

  // Calculate the number of days
  const calculateDays = () => {
    if (!request.start_date || !request.end_date) return 0

    const start = new Date(request.start_date)
    const end = new Date(request.end_date)

    // Check if dates are valid
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return 0

    const diffTime = Math.abs(end.getTime() - start.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1 // Include both start and end days

    return diffDays
  }

  const days = calculateDays()
  const canEdit = isOwner && request.status === "pending"

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
            {request.type}
          </span>
        )
    }
  }

  const handleAction = async (action: string) => {
    setProcessing(true)
    try {
      if (action === "cancel") {
        await onCancel(request.id)
      } else if (action === "delete") {
        await onDelete?.(request.id)
      } else if (action === "edit") {
        onEdit?.(request)
      } else {
        await onStatusUpdate(request.id, action)
      }
    } finally {
      setProcessing(false)
      setShowActions(false)
    }
  }

  // Close dropdown when clicking outside
  const handleClickOutside = (e: MouseEvent) => {
    if (showActions) {
      setShowActions(false)
    }
  }

  // Add event listener when dropdown is open
  if (showActions) {
    document.addEventListener("click", handleClickOutside, { once: true })
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
            onClick={(e) => {
              e.stopPropagation()
              setShowActions(!showActions)
            }}
            className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            aria-label="Actions"
          >
            <MoreVertical size={16} />
          </button>

          {showActions && (
            <div className="absolute right-0 z-10 mt-1 w-48 rounded-md border border-gray-100 bg-white py-1 shadow-lg">
              {isManager && request.status === "pending" && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleAction("approved")
                    }}
                    disabled={processing}
                    className="flex w-full items-center px-4 py-2 text-left text-sm text-green-600 hover:bg-green-50"
                  >
                    <CheckCircle size={14} className="mr-2" />
                    Approve Request
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleAction("refused")
                    }}
                    disabled={processing}
                    className="flex w-full items-center px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                  >
                    <XCircle size={14} className="mr-2" />
                    Refuse Request
                  </button>
                </>
              )}
              {canEdit && onEdit && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleAction("edit")
                  }}
                  disabled={processing}
                  className="flex w-full items-center px-4 py-2 text-left text-sm text-blue-600 hover:bg-blue-50"
                >
                  <Edit size={14} className="mr-2" />
                  Edit Request
                </button>
              )}
              {isOwner && request.status === "pending" && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleAction("cancel")
                  }}
                  disabled={processing}
                  className="flex w-full items-center px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                >
                  <XCircle size={14} className="mr-2" />
                  Cancel Request
                </button>
              )}
              {isManager && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleAction("delete")
                  }}
                  disabled={processing}
                  className="flex w-full items-center px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                >
                  <XCircle size={14} className="mr-2" />
                  Delete Request
                </button>
              )}
              {(!isManager && !isOwner) || (request.status !== "pending" && !isManager && !canEdit) || processing ? (
                <div className="px-4 py-2 text-sm text-gray-500">
                  {processing ? "Processing..." : "No actions available"}
                </div>
              ) : null}
            </div>
          )}
        </div>
      </div>

      <div className="mt-4">
        <h3 className="text-sm font-medium text-gray-700">Reason:</h3>
        <div className="mt-1">
          <p className={`whitespace-pre-line text-sm text-gray-600 ${expanded ? "" : "line-clamp-3"}`}>
            {request.reason}
          </p>
          {request.reason.length > 150 && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="mt-1 text-xs font-medium text-[#6148F4] hover:underline"
            >
              {expanded ? "Show less" : "Show more"}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
