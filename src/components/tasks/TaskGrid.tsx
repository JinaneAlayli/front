"use client"

import TaskCard from "./TaskCard"
import api from "@/lib/api"
import { toast } from "react-toastify"

interface TaskGridProps {
  tasks: any[]
  onEdit: (task: any) => void
  onDelete: (id: number) => void
  onRefresh: () => void
}

export default function TaskGrid({ tasks, onEdit, onDelete, onRefresh }: TaskGridProps) {
  const handleToggleComplete = async (id: number, completed: boolean) => {
    try {
      await api.patch(`/tasks/${id}`, { completed })
      toast.success(`Task marked as ${completed ? "completed" : "pending"}`)
      onRefresh()
    } catch (error) {
      toast.error("Failed to update task status")
      console.error("Failed to update task status:", error)
    }
  }

  return (
    <div className="p-6">
      {tasks.length === 0 ? (
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
          <p className="mt-1 text-xs text-gray-500">Create a new task to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onEdit={onEdit}
              onDelete={onDelete}
              onToggleComplete={handleToggleComplete}
            />
          ))}
        </div>
      )}
    </div>
  )
}
