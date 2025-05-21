"use client"

import { useState, useEffect } from "react"
import api from "@/lib/api"
import { toast } from "react-toastify"
import { Calendar, Filter, MoreHorizontal, Edit, Trash2, Check, Users, PlusCircle } from "lucide-react"
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DroppableProvided,
  type DraggableProvided,
  type DropResult,
} from "@hello-pangea/dnd"
import TaskFormModal from "./TaskFormModal"

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

interface TeamMember {
  id: number
  name: string
}

interface Props {
  tasks: Task[]
  onRefresh: () => void
  userId: number
  teamId: number
}

export default function TeamTasksView({ tasks, onRefresh, userId, teamId }: Props) {
  const [columns, setColumns] = useState<Column[]>([])
  const [actionTask, setActionTask] = useState<number | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [openModal, setOpenModal] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState<number[]>([])
  const [filters, setFilters] = useState({
    status: "",
    member: "",
    month: "",
    year: "",
  })

  // Fetch team members
  useEffect(() => {
    const fetchTeamMembers = async () => {
      try {
        const res = await api.get("/users")
        // Filter users by team_id to ensure leaders only see their team members
        const members = res.data.filter((user: any) => user.team_id === teamId)
        setTeamMembers(members)
      } catch (error) {
        console.error("Failed to fetch team members:", error)
        toast.error("Failed to load team members")
      }
    }

    fetchTeamMembers()
  }, [teamId])

  // Group tasks into columns
  useEffect(() => {
    updateColumns(tasks)
  }, [tasks])

  // Function to update columns based on filtered tasks
  const updateColumns = (tasksToGroup: Task[]) => {
    const pending = tasksToGroup.filter((task) => !task.completed && !isOverdue(task.due_date, task.completed))
    const overdue = tasksToGroup.filter((task) => !task.completed && isOverdue(task.due_date, task.completed))
    const completed = tasksToGroup.filter((task) => task.completed)

    setColumns([
      { id: "pending", title: "Pending", tasks: pending },
      { id: "overdue", title: "Overdue", tasks: overdue },
      { id: "completed", title: "Completed", tasks: completed },
    ])
  }

  // Function to format date
  const formatDate = (dateString?: string) => {
    if (!dateString) return "No due date"
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

  // Update the handleToggleComplete method to ensure leaders can update task status
  const handleToggleComplete = async (id: number, completed: boolean) => {
    try {
      setUpdatingStatus([...updatingStatus, id])
      await api.patch(`/tasks/${id}`, { completed })
      toast.success(`Task marked as ${completed ? "completed" : "pending"}`)
      onRefresh()
    } catch (error) {
      toast.error("Failed to update task status")
      console.error("Failed to update task status:", error)
    } finally {
      setUpdatingStatus(updatingStatus.filter((taskId) => taskId !== id))
    }
  }

  const handleEdit = (task: Task) => {
    setEditingTask(task)
    setOpenModal(true)
  }

  const handleDelete = async (id: number) => {
    if (confirm("Are you sure you want to delete this task?")) {
      try {
        await api.delete(`/tasks/${id}`)
        toast.success("Task deleted successfully")
        onRefresh()
      } catch (error) {
        toast.error("Failed to delete task")
        console.error("Failed to delete task:", error)
      }
    }
  }

  // Update the handleCreate method to ensure leaders can create tasks for team members
  const handleCreate = () => {
    setEditingTask(null)
    setOpenModal(true)
  }

  const handleModalSuccess = () => {
    onRefresh()
    setOpenModal(false)
  }

  const toggleActionMenu = (taskId: number | null) => {
    setActionTask(taskId)
  }

  // Function to handle drag and drop
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

  // Filter tasks based on selected filters
  const applyFilters = () => {
    let filteredTasks = [...tasks]

    // Filter by team member
    if (filters.member) {
      filteredTasks = filteredTasks.filter((task) => task.user?.id === Number.parseInt(filters.member))
    }

    // Filter by status
    if (filters.status) {
      if (filters.status === "completed") {
        filteredTasks = filteredTasks.filter((task) => task.completed)
      } else if (filters.status === "pending") {
        filteredTasks = filteredTasks.filter((task) => !task.completed && !isOverdue(task.due_date, task.completed))
      } else if (filters.status === "overdue") {
        filteredTasks = filteredTasks.filter((task) => !task.completed && isOverdue(task.due_date, task.completed))
      }
    }

    // Filter by month and year
    if (filters.month || filters.year) {
      filteredTasks = filteredTasks.filter((task) => {
        if (!task.due_date) return false

        const dueDate = new Date(task.due_date)
        const monthMatch = !filters.month || dueDate.getMonth() + 1 === Number.parseInt(filters.month)
        const yearMatch = !filters.year || dueDate.getFullYear() === Number.parseInt(filters.year)

        return monthMatch && yearMatch
      })
    }

    updateColumns(filteredTasks)
  }

  // Apply filters when they change
  useEffect(() => {
    applyFilters()
  }, [filters])

  // Generate month options
  const monthOptions = [
    { value: "1", label: "January" },
    { value: "2", label: "February" },
    { value: "3", label: "March" },
    { value: "4", label: "April" },
    { value: "5", label: "May" },
    { value: "6", label: "June" },
    { value: "7", label: "July" },
    { value: "8", label: "August" },
    { value: "9", label: "September" },
    { value: "10", label: "October" },
    { value: "11", label: "November" },
    { value: "12", label: "December" },
  ]

  // Generate year options (current year and 2 years before/after)
  const currentYear = new Date().getFullYear()
  const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i).map((year) => ({
    value: year.toString(),
    label: year.toString(),
  }))

  return (
    <div className="p-6">
      {tasks.length === 0 ? (
        <div className="flex h-40 flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50 p-6 text-center">
          <div className="mb-2 rounded-full bg-gray-100 p-3">
            <Users className="h-6 w-6 text-gray-400" />
          </div>
          <h3 className="text-sm font-medium text-gray-900">No tasks found for your team</h3>
          <p className="mt-1 text-xs text-gray-500">Create a new task to get started</p>
          <button
            onClick={handleCreate}
            className="mt-4 inline-flex items-center rounded-lg bg-[#6148F4] px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#5040d3] focus:outline-none focus:ring-2 focus:ring-[#6148F4]/50 focus:ring-offset-2"
          >
            <PlusCircle size={16} className="mr-2" />
            Create Task
          </button>
        </div>
      ) : (
        <>
          {/* Header with Create Button and Filters */}
          <div className="mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <h2 className="text-lg font-medium text-gray-900 flex items-center">
                <Users size={20} className="mr-2 text-[#6148F4]" />
                Team Tasks
              </h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCreate}
                  className="inline-flex items-center rounded-lg bg-[#6148F4] px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#5040d3] focus:outline-none focus:ring-2 focus:ring-[#6148F4]/50 focus:ring-offset-2"
                >
                  <PlusCircle size={16} className="mr-2" />
                  Create Task
                </button>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center rounded-lg bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 border border-gray-200"
                >
                  <Filter size={16} className="mr-1.5 text-gray-500" />
                  Filters
                </button>
              </div>
            </div>

            {showFilters && (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 bg-gray-50 p-4 rounded-lg mb-4 border border-gray-200">
                <div>
                  <label htmlFor="member-filter" className="mb-1 block text-xs font-medium text-gray-700">
                    Filter by Team Member
                  </label>
                  <select
                    id="member-filter"
                    value={filters.member}
                    onChange={(e) => setFilters({ ...filters, member: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-[#6148F4] focus:outline-none focus:ring-1 focus:ring-[#6148F4]/50"
                  >
                    <option value="">All Team Members</option>
                    {teamMembers.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="status-filter" className="mb-1 block text-xs font-medium text-gray-700">
                    Filter by Status
                  </label>
                  <select
                    id="status-filter"
                    value={filters.status}
                    onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-[#6148F4] focus:outline-none focus:ring-1 focus:ring-[#6148F4]/50"
                  >
                    <option value="">All Statuses</option>
                    <option value="completed">Completed</option>
                    <option value="pending">Pending</option>
                    <option value="overdue">Overdue</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="month-filter" className="mb-1 block text-xs font-medium text-gray-700">
                    Filter by Month
                  </label>
                  <select
                    id="month-filter"
                    value={filters.month}
                    onChange={(e) => setFilters({ ...filters, month: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-[#6148F4] focus:outline-none focus:ring-1 focus:ring-[#6148F4]/50"
                  >
                    <option value="">All Months</option>
                    {monthOptions.map((month) => (
                      <option key={month.value} value={month.value}>
                        {month.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="year-filter" className="mb-1 block text-xs font-medium text-gray-700">
                    Filter by Year
                  </label>
                  <select
                    id="year-filter"
                    value={filters.year}
                    onChange={(e) => setFilters({ ...filters, year: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-[#6148F4] focus:outline-none focus:ring-1 focus:ring-[#6148F4]/50"
                  >
                    <option value="">All Years</option>
                    {yearOptions.map((year) => (
                      <option key={year.value} value={year.value}>
                        {year.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="lg:col-span-4">
                  <button
                    onClick={() => setFilters({ status: "", member: "", month: "", year: "" })}
                    className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
                  >
                    Clear Filters
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Board View */}
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
                        style={{ minHeight: "calc(100vh - 400px)", maxHeight: "calc(100vh - 400px)" }}
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
                                      disabled={updatingStatus.includes(task.id)}
                                      className={`mt-1 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border ${
                                        task.completed
                                          ? "border-green-500 bg-green-500 text-white"
                                          : "border-gray-300 bg-white hover:border-[#6148F4]"
                                      } ${updatingStatus.includes(task.id) ? "opacity-50" : ""}`}
                                    >
                                      {task.completed && <Check size={12} />}
                                    </button>
                                    <div>
                                      <h3
                                        className={`font-medium ${task.completed ? "text-gray-500 line-through" : "text-gray-900"}`}
                                      >
                                        {task.task}
                                      </h3>
                                      {task.note && (
                                        <div className="mt-1 text-sm text-gray-600 bg-gray-50 p-2 rounded-md">
                                          {task.note}
                                        </div>
                                      )}
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
                                            handleEdit(task)
                                            setActionTask(null)
                                          }}
                                          className="flex w-full items-center px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                                        >
                                          <Edit size={14} className="mr-2" />
                                          Edit Task
                                        </button>
                                        <button
                                          onClick={() => {
                                            handleDelete(task.id)
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

                                <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                                  <div className="flex flex-wrap items-center gap-2">
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
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                        {column.tasks.length === 0 && (
                          <div className="flex h-20 items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50">
                            <p className="text-sm text-gray-500">No tasks in this column</p>
                          </div>
                        )}
                      </div>
                    )}
                  </Droppable>
                </div>
              ))}
            </div>
          </DragDropContext>
        </>
      )}

      {/* Task Form Modal */}
      <TaskFormModal
        open={openModal}
        onClose={() => setOpenModal(false)}
        onSuccess={handleModalSuccess}
        initialTask={editingTask}
        userId={userId}
        roleId={4}
        teamId={teamId}
      />
    </div>
  )
}
