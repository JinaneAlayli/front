"use client"

import { useState } from "react"
import LeaveRequestCard from "./LeaveRequestCard"
import { Grid, List } from "lucide-react"

interface LeaveRequestListProps {
  requests: any[]
  isManager: boolean
  userId: number
  onStatusUpdate: (id: number, status: string) => void
  onCancel: (id: number) => void
  onDelete?: (id: number) => void
  onEdit?: (request: any) => void
}

export default function LeaveRequestList({
  requests,
  isManager,
  userId,
  onStatusUpdate,
  onCancel,
  onDelete,
  onEdit,
}: LeaveRequestListProps) {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")

  return (
    <div className="p-6">
      {requests.length === 0 ? (
        <div className="flex h-40 flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50 p-6 text-center">
          <div className="mb-2 rounded-full bg-gray-100 p-3">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-6 w-6 text-gray-400"
            >
              <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
              <line x1="16" x2="16" y1="2" y2="6" />
              <line x1="8" x2="8" y1="2" y2="6" />
              <line x1="3" x2="21" y1="10" y2="10" />
              <path d="M8 14h.01" />
              <path d="M12 14h.01" />
              <path d="M16 14h.01" />
              <path d="M8 18h.01" />
              <path d="M12 18h.01" />
              <path d="M16 18h.01" />
            </svg>
          </div>
          <h3 className="text-sm font-medium text-gray-900">No leave requests found</h3>
          <p className="mt-1 text-xs text-gray-500">Create a new leave request to get started</p>
        </div>
      ) : (
        <>
          <div className="mb-4 flex justify-end">
            <div className="inline-flex rounded-md shadow-sm">
              <button
                onClick={() => setViewMode("grid")}
                className={`inline-flex items-center rounded-l-lg border border-gray-200 px-3 py-2 text-sm ${
                  viewMode === "grid" ? "bg-[#6148F4] text-white" : "bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                <Grid size={16} className="mr-1" />
                Grid
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`inline-flex items-center rounded-r-lg border border-gray-200 px-3 py-2 text-sm ${
                  viewMode === "list" ? "bg-[#6148F4] text-white" : "bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                <List size={16} className="mr-1" />
                List
              </button>
            </div>
          </div>

          {viewMode === "grid" ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {requests.map((request) => (
                <LeaveRequestCard
                  key={request.id}
                  request={request}
                  isManager={isManager}
                  isOwner={request.user_id === userId}
                  onStatusUpdate={onStatusUpdate}
                  onCancel={onCancel}
                  onDelete={onDelete}
                  onEdit={onEdit}
                />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {requests.map((request) => (
                <div
                  key={request.id}
                  className={`rounded-lg border p-4 shadow-sm ${
                    request.status === "approved"
                      ? "border-green-100 bg-green-50/30"
                      : request.status === "refused" || request.status === "canceled"
                        ? "border-red-100 bg-red-50/10"
                        : "border-gray-100 bg-white"
                  }`}
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        {request.user && (
                          <div className="flex items-center">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#6148F4]/10 text-sm font-medium text-[#6148F4]">
                              {request.user.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="ml-2 font-medium">{request.user.name}</div>
                          </div>
                        )}
                        <div className="flex items-center text-sm text-gray-600">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="mr-1.5"
                          >
                            <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
                            <line x1="16" x2="16" y1="2" y2="6" />
                            <line x1="8" x2="8" y1="2" y2="6" />
                            <line x1="3" x2="21" y1="10" y2="10" />
                          </svg>
                          <span>
                            {new Date(request.start_date).toLocaleDateString()} -{" "}
                            {new Date(request.end_date).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
                          {request.type}
                        </span>
                        {request.status === "pending" ? (
                          <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                            Pending
                          </span>
                        ) : request.status === "approved" ? (
                          <span className="inline-flex items-center rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-800">
                            Approved
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-800">
                            {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                          </span>
                        )}
                      </div>
                      <p className="mt-2 line-clamp-1 text-sm text-gray-600">{request.reason}</p>
                    </div>
                    <div className="flex shrink-0 gap-2">
                      {isManager && request.status === "pending" && (
                        <>
                          <button
                            onClick={() => onStatusUpdate(request.id, "approved")}
                            className="rounded-md bg-green-50 px-2.5 py-1.5 text-xs font-medium text-green-700 hover:bg-green-100"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => onStatusUpdate(request.id, "refused")}
                            className="rounded-md bg-red-50 px-2.5 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100"
                          >
                            Refuse
                          </button>
                        </>
                      )}
                      {request.user_id === userId && request.status === "pending" && (
                        <>
                          {onEdit && (
                            <button
                              onClick={() => onEdit(request)}
                              className="rounded-md bg-blue-50 px-2.5 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100"
                            >
                              Edit
                            </button>
                          )}
                          <button
                            onClick={() => onCancel(request.id)}
                            className="rounded-md bg-gray-100 px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-200"
                          >
                            Cancel
                          </button>
                        </>
                      )}
                      {isManager && (
                        <button
                          onClick={() => onDelete?.(request.id)}
                          className="rounded-md bg-red-50 px-2.5 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
