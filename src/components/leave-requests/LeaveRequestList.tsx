"use client"

import { useState } from "react"
import LeaveRequestCard from "./LeaveRequestCard"

interface LeaveRequestListProps {
  requests: any[]
  isManager: boolean
  userId: number
  onStatusUpdate: (id: number, status: string) => void
  onCancel: (id: number) => void
}

export default function LeaveRequestList({
  requests,
  isManager,
  userId,
  onStatusUpdate,
  onCancel,
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
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {requests.map((request) => (
            <LeaveRequestCard
              key={request.id}
              request={request}
              isManager={isManager}
              isOwner={request.user_id === userId}
              onStatusUpdate={onStatusUpdate}
              onCancel={onCancel}
            />
          ))}
        </div>
      )}
    </div>
  )
}
