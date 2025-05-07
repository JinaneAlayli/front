"use client"

import { useState, useEffect } from "react"
import api from "@/lib/api"
import { toast } from "react-toastify"
import { CheckCircle, Clock, AlertCircle, Calendar, ArrowRight } from "lucide-react"
import Link from "next/link"

interface DashboardTasksProps {
  userId: number | undefined
}

export default function DashboardTasks({ userId }: DashboardTasksProps) {
  const [tasks, setTasks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchTasks = async () => {
      if (!userId) return

      setLoading(true)
      try {
        const res = await api.get("/tasks/my-tasks")
        // Only show the 5 most recent tasks
        setTasks(res.data.slice(0, 5))
      } catch (error) {
        console.error("Failed to fetch tasks:", error)
        toast.error("Failed to load tasks")
      } finally {
        setLoading(false)
      }
    }

    fetchTasks()
  }, [userId])

  // Function to format date
  const formatDate = (dateString: string) => {
    if (!dateString) return null
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
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
    <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-gray-100 bg-[#6148F4]/5 px-6 py-4">
        <h2 className="text-lg font-medium text-gray-900">Recent Tasks</h2>
        <Link href="/tasks" className="text-sm font-medium text-[#6148F4] hover:underline">
          View All
        </Link>
      </div>

      <div className="p-6">
        {loading ? (
          <div className="flex h-40 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#6148F4] border-t-transparent"></div>
          </div>
        ) : tasks.length === 0 ? (
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
            <h3 className="text-sm font-medium text-gray-900">No tasks found</h3>
            <p className="mt-1 text-xs text-gray-500">You don't have any tasks assigned to you</p>
          </div>
        ) : (
          <div className="space-y-4">
            {tasks.map((task) => (
              <div
                key={task.id}
                className="flex items-start justify-between rounded-lg border border-gray-100 p-4 transition-colors hover:bg-gray-50"
              >
                <div className="flex items-start space-x-3">
                  <div
                    className={`mt-1 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border ${
                      task.completed ? "border-green-500 bg-green-500 text-white" : "border-gray-300 bg-white"
                    }`}
                  >
                    {task.completed && (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    )}
                  </div>
                  <div>
                    <h3
                      className={`text-sm font-medium ${
                        task.completed ? "text-gray-500 line-through" : "text-gray-900"
                      }`}
                    >
                      {task.task}
                    </h3>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      {getStatusBadge(task)}
                      {task.due_date && (
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                            isOverdue(task.due_date, task.completed)
                              ? "bg-red-50 text-red-700"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          <Calendar size={12} className="mr-1" />
                          {formatDate(task.due_date)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            <Link
              href="/tasks"
              className="flex items-center justify-center rounded-lg border border-dashed border-gray-300 p-4 text-sm text-gray-500 transition-colors hover:bg-gray-50"
            >
              <ArrowRight size={16} className="mr-2" />
              View all tasks
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
