"use client"

import { CheckCircle, Clock, AlertCircle } from "lucide-react"

interface TaskTableProps {
  tasks: any[]
  onEdit: (task: any) => void
  onDelete: (id: number) => void
}

export default function TaskTable({ tasks, onEdit, onDelete }: TaskTableProps) {
  // Function to format date
  const formatDate = (dateString: string) => {
    if (!dateString) return "-"
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
  const getStatusBadge = (task: any) => {
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
    <div className="overflow-x-auto">
      <table className="w-full table-auto">
        <thead>
          <tr className="bg-gray-50 text-left">
            <th className="whitespace-nowrap px-6 py-4 text-sm font-medium uppercase tracking-wider text-gray-500">
              Task
            </th>
            <th className="whitespace-nowrap px-6 py-4 text-sm font-medium uppercase tracking-wider text-gray-500">
              Note
            </th>
            <th className="whitespace-nowrap px-6 py-4 text-sm font-medium uppercase tracking-wider text-gray-500">
              Status
            </th>
            <th className="whitespace-nowrap px-6 py-4 text-sm font-medium uppercase tracking-wider text-gray-500">
              Due Date
            </th>
            <th className="whitespace-nowrap px-6 py-4 text-sm font-medium uppercase tracking-wider text-gray-500">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {tasks.map((task) => (
            <tr key={task.id} className="transition-colors hover:bg-gray-50">
              <td className="whitespace-nowrap px-6 py-4">
                <div className="font-medium text-gray-900">{task.task}</div>
              </td>
              <td className="whitespace-nowrap px-6 py-4">
                <div className="text-sm text-gray-500">{task.note || "-"}</div>
              </td>
              <td className="whitespace-nowrap px-6 py-4">{getStatusBadge(task)}</td>
              <td className="whitespace-nowrap px-6 py-4">
                <div
                  className={`text-sm ${isOverdue(task.due_date, task.completed) ? "text-red-600 font-medium" : "text-gray-500"}`}
                >
                  {formatDate(task.due_date)}
                </div>
              </td>
              <td className="whitespace-nowrap px-6 py-4">
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => onEdit(task)}
                    className="rounded bg-gray-100 p-1.5 text-gray-600 transition-colors hover:bg-gray-200"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"></path>
                      <path d="m15 5 4 4"></path>
                    </svg>
                  </button>
                  <button
                    onClick={() => onDelete(task.id)}
                    className="rounded bg-red-100 p-1.5 text-red-600 transition-colors hover:bg-red-200"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M3 6h18"></path>
                      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                    </svg>
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {tasks.length === 0 && (
        <div className="py-12 text-center">
          <p className="text-gray-500">No tasks found</p>
        </div>
      )}
    </div>
  )
}
