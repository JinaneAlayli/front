"use client"

import { useState } from "react"
import { CheckCircle, Clock, AlertCircle, MoreVertical, Edit, Trash2, Check } from "lucide-react"

interface TaskCardProps {
  task: any
  onEdit: (task: any) => void
  onDelete: (id: number) => void
  onToggleComplete: (id: number, completed: boolean) => void
}

export default function TaskCard({ task, onEdit, onDelete, onToggleComplete }: TaskCardProps) {
  const [showActions, setShowActions] = useState(false)

  // Function to format date
  const formatDate = (dateString: string) => {
    if (!dateString) return null
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
  }

  // Function to determine if a task is overdue
  const isOverdue = (dateString: string, completed: boolean) => {
    if (!dateString || completed) return false
    const dueDate = new Date(dateString)
    const today = new Date()
    return dueDate < today
  }

  // Function to get status badge
  const getStatusBadge = () => {
    if (task.completed) {
      return (
        <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700">
          <CheckCircle size={12} className="mr-1" />
          Completed
        </span>
      )
    } else if (isOverdue(task.due_date, task.completed)) {
      return (
        <span className="inline-flex items-center rounded-full bg-red-50 px-2 py-1 text-xs font-medium text-red-700">
          <AlertCircle size={12} className="mr-1" />
          Overdue
        </span>
      )
    } else if (task.due_date) {
      return (
        <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">
          <Clock size={12} className="mr-1" />
          Pending
        </span>
      )
    } else {
      return (
        <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700">
          Pending
        </span>
      )
    }
  }

  return (
    <div
      className={`rounded-xl border ${task.completed ? "border-green-100 bg-green-50/30" : "border-gray-100 bg-white"} p-5 shadow-sm transition-all hover:shadow-md`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3">
          <button
            onClick={() => onToggleComplete(task.id, !task.completed)}
            className={`mt-1 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border ${
              task.completed
                ? "border-green-500 bg-green-500 text-white"
                : "border-gray-300 bg-white hover:border-[#6148F4]"
            }`}
          >
            {task.completed && <Check size={12} />}
          </button>
          <div>
            <h3 className={`text-lg font-medium ${task.completed ? "text-gray-500 line-through" : "text-gray-900"}`}>
              {task.task}
            </h3>
            {task.note && (
              <div className={`mt-1 whitespace-pre-line text-sm ${task.completed ? "text-gray-400" : "text-gray-600"}`}>
                {task.note}
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
              <button
                onClick={() => {
                  onEdit(task)
                  setShowActions(false)
                }}
                className="flex w-full items-center px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
              >
                <Edit size={14} className="mr-2" />
                Edit Task
              </button>
              <button
                onClick={() => {
                  onDelete(task.id)
                  setShowActions(false)
                }}
                className="flex w-full items-center px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
              >
                <Trash2 size={14} className="mr-2" />
                Delete Task
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {getStatusBadge()}

          {task.due_date && (
            <span
              className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                isOverdue(task.due_date, task.completed) ? "bg-red-50 text-red-700" : "bg-gray-100 text-gray-700"
              }`}
            >
              <Calendar size={12} className="mr-1" />
              {formatDate(task.due_date)}
            </span>
          )}
        </div>

        {task.user && (
          <div className="flex items-center">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#6148F4]/10 text-xs font-medium text-[#6148F4]">
              {task.user.name.charAt(0)}
            </div>
            <span className="ml-1.5 text-xs text-gray-500">{task.user.name}</span>
          </div>
        )}
      </div>
    </div>
  )
}

function Calendar(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
      <line x1="16" x2="16" y1="2" y2="6" />
      <line x1="8" x2="8" y1="2" y2="6" />
      <line x1="3" x2="21" y1="10" y2="10" />
    </svg>
  )
}
