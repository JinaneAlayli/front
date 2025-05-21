"use client"

import { useState, useEffect } from "react"
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DroppableProvided,
  type DraggableProvided,
  type DropResult,
} from "@hello-pangea/dnd"
import { Calendar, MoreHorizontal, Edit, Trash2, Check } from "lucide-react"
import { toast } from "react-toastify"
import api from "@/lib/api"

interface Task {
  id: number
  task: string
  note: string
  completed: boolean
  due_date?: string
  user?: {
    id: number
    name: string
  }
}

interface Column {
  id: string
  title: string
  tasks: Task[]
}

interface TaskBoardProps {
  tasks: Task[]
  onEdit: (task: Task) => void
  onDelete: (id: number) => void
  onRefresh: () => void
}

export default function TaskBoard({ tasks, onEdit, onDelete, onRefresh }: TaskBoardProps) {
  const [columns, setColumns] = useState<Column[]>([])
  const [actionTask, setActionTask] = useState<number | null>(null)

  useEffect(() => {
    // Group tasks into columns
    const pending = tasks.filter((task) => !task.completed && !isOverdue(task.due_date, task.completed))
    const overdue = tasks.filter((task) => !task.completed && isOverdue(task.due_date, task.completed))
    const completed = tasks.filter((task) => task.completed)

    setColumns([
      { id: "pending", title: "Pending", tasks: pending },
      { id: "overdue", title: "Overdue", tasks: overdue },
      { id: "completed", title: "Completed", tasks: completed },
    ])
  }, [tasks])

  // Function to format date
  const formatDate = (dateString?: string) => {
    if (!dateString) return null
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
  }

  // Function to determine if a task is overdue
  const isOverdue = (dateString?: string, completed = false) => {
    if (!dateString || completed) return false
    const dueDate = new Date(dateString)
    const today = new Date()
    return dueDate < today
  }

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

  const toggleActionMenu = (taskId: number | null) => {
    setActionTask(taskId)
  }

  // Function to render formatted note content
  const renderNoteContent = (note: string) => {
    if (!note) return null

    return (
      <div className="mt-2 whitespace-pre-line text-sm text-gray-600">
        {note.split("\n").map((line, i) => {
          // Handle bullet points
          if (line.startsWith("- ")) {
            return (
              <div key={i} className="flex items-start">
                <span className="mr-1">•</span>
                <span
                  dangerouslySetInnerHTML={{
                    __html: line.substring(2).replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>"),
                  }}
                />
              </div>
            )
          }
          // Handle bold text
          return (
            <div
              key={i}
              dangerouslySetInnerHTML={{
                __html: line.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>"),
              }}
            />
          )
        })}
      </div>
    )
  }

  const onDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result

    // If dropped outside a droppable area
    if (!destination) return

    // If dropped in the same position
    if (destination.droppableId === source.droppableId && destination.index === source.index) return

    // Find the task that was dragged
    const taskId = Number.parseInt(draggableId.split("-")[1])
    const task = tasks.find((t) => t.id === taskId)

    if (!task) return

    // Handle moving between columns (changing status)
    if (destination.droppableId !== source.droppableId) {
      // If moved to completed column
      if (destination.droppableId === "completed" && !task.completed) {
        await handleToggleComplete(taskId, true)
      }
      // If moved from completed column
      else if (source.droppableId === "completed" && task.completed) {
        await handleToggleComplete(taskId, false)
      }
    }

    // Update the UI optimistically
    const newColumns = [...columns]

    // Remove from source column
    const sourceColumn = newColumns.find((col) => col.id === source.droppableId)
    if (!sourceColumn) return
    const [removed] = sourceColumn.tasks.splice(source.index, 1)

    // Add to destination column
    const destColumn = newColumns.find((col) => col.id === destination.droppableId)
    if (!destColumn) return
    destColumn.tasks.splice(destination.index, 0, removed)

    setColumns(newColumns)
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
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {columns.map((column) => (
              <div key={column.id} className="flex flex-col rounded-xl border border-gray-200 bg-gray-50">
                <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
                  <h3 className="font-medium text-gray-800">{column.title}</h3>
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-200 text-xs font-medium">
                    {column.tasks.length}
                  </div>
                </div>

                <Droppable droppableId={column.id}>
                  {(provided: DroppableProvided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className="flex-1 overflow-y-auto p-3"
                      style={{ minHeight: "calc(100vh - 300px)", maxHeight: "calc(100vh - 300px)" }}
                    >
                      {column.tasks.map((task, index) => (
                        <Draggable key={`task-${task.id}`} draggableId={`task-${task.id}`} index={index}>
                          {(provided: DraggableProvided) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`mb-3 rounded-lg border ${
                                task.completed
                                  ? "border-green-100 bg-green-50/30"
                                  : isOverdue(task.due_date, task.completed)
                                    ? "border-red-100 bg-red-50/30"
                                    : "border-white bg-white"
                              } p-4 shadow-sm transition-all hover:shadow-md`}
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex items-start space-x-3">
                                  <button
                                    onClick={() => handleToggleComplete(task.id, !task.completed)}
                                    className={`mt-1 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border ${
                                      task.completed
                                        ? "border-green-500 bg-green-500 text-white"
                                        : "border-gray-300 bg-white hover:border-[#6148F4]"
                                    }`}
                                  >
                                    {task.completed && <Check size={12} />}
                                  </button>
                                  <div>
                                    <h3
                                      className={`font-medium ${task.completed ? "text-gray-500 line-through" : "text-gray-900"}`}
                                    >
                                      {task.task}
                                    </h3>
                                    {task.note && renderNoteContent(task.note)}
                                  </div>
                                </div>

                                <div className="relative">
                                  <button
                                    onClick={() => toggleActionMenu(actionTask === task.id ? null : task.id)}
                                    className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                                  >
                                    <MoreHorizontal size={16} />
                                  </button>

                                  {actionTask === task.id && (
                                    <div className="absolute right-0 z-10 mt-1 w-48 rounded-md border border-gray-100 bg-white py-1 shadow-lg">
                                      <button
                                        onClick={() => {
                                          onEdit(task)
                                          setActionTask(null)
                                        }}
                                        className="flex w-full items-center px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                                      >
                                        <Edit size={14} className="mr-2" />
                                        Edit Task
                                      </button>
                                      <button
                                        onClick={() => {
                                          onDelete(task.id)
                                          setActionTask(null)
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

                              <div className="mt-3 flex flex-wrap items-center gap-2">
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

                                {task.user && (
                                  <div className="ml-auto flex items-center">
                                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#6148F4]/10 text-xs font-medium text-[#6148F4]">
                                      {task.user.name.charAt(0)}
                                    </div>
                                    <span className="ml-1.5 text-xs text-gray-500">{task.user.name}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            ))}
          </div>
        </DragDropContext>
      )}
    </div>
  )
}
