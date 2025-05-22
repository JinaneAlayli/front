"use client"

import { useEffect, useState, useRef } from "react"
import api from "@/lib/api"
import { useSelector } from "react-redux"
import type { RootState } from "@/lib/redux/store"
import TaskBoard from "@/components/tasks/TaskBoard"
import TaskMetrics from "@/components/tasks/TaskMetrics"
import EmployeeTasksView from "@/components/tasks/EmployeeTasksView"
import TeamTasksView from "@/components/tasks/TeamTasksView"
import TaskFormModal from "@/components/tasks/TaskFormModal"
import { PlusCircle, ClipboardList, Search, Filter } from "lucide-react"
import { toast } from "react-toastify"
import { useRouter } from "next/navigation"

export default function TasksPage() {
  const user = useSelector((state: RootState) => state.auth.user)
  const [tasks, setTasks] = useState([])

  const router = useRouter()
  const hasBlocked = useRef(false)

  const [openModal, setOpenModal] = useState(false)
  const [editingTask, setEditingTask] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState({
    completed: "",
    dueDate: "",
  })

  const [employees, setEmployees] = useState([])
  const [selectedEmployee, setSelectedEmployee] = useState("")

  // Check if user is an employee with role_id === 5
  const isEmployee = user?.role_id === 5
  // Check if user is a team leader with role_id === 4
  const isTeamLeader = user?.role_id === 4

  // Update the fetchTasks function to handle role-based permissions
  const fetchTasks = async () => {
    setLoading(true)
    try {
      let endpoint = "/tasks"

      // Role ID 5 = Employee - Can only view own tasks
      if (user?.role_id === 5) {
        endpoint = "/tasks/my-tasks"
      }
      // Role ID 4 = Leader - Can view team tasks
      else if (user?.role_id === 4) {
        endpoint = "/tasks/team-tasks"
      }
      // Role ID 2 = Owner, 3 = HR - Can view all tasks (default endpoint)

      const res = await api.get(endpoint)
      setTasks(res.data)
    } catch (error) {
      toast.error("Failed to fetch tasks")
      console.error("Failed to fetch tasks:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchEmployees = async () => {
    try {
      const res = await api.get("/users")
      setEmployees(res.data)
    } catch (error) {
      console.error("Failed to fetch employees:", error)
    }
  }

  useEffect(() => {
    if (!user || hasBlocked.current) return

    if (user.role_id === 1) {
      hasBlocked.current = true
      toast.error("Superadmin is not allowed to view tasks.")
      router.push("/dashboard")
      return
    }

    fetchTasks()
  }, [user, router])

  useEffect(() => {
    if (user && (user.role_id === 2 || user.role_id === 3)) {
      fetchEmployees()
    }
  }, [user])

  // Refetch tasks when role changes
  useEffect(() => {
    if (user) {
      fetchTasks()
    }
  }, [isEmployee, isTeamLeader])

  // Update the handleCreate function to ensure only authorized roles can create tasks
  const handleCreate = () => {
    // Only Owner (2), HR (3), and Leader (4) can create tasks
    if (user?.role_id === 2 || user?.role_id === 3 || user?.role_id === 4) {
      setEditingTask(null)
      setOpenModal(true)
    } else {
      toast.error("You don't have permission to create tasks")
    }
  }

  // Update the handleEdit function to ensure only authorized roles can edit tasks
  const handleEdit = (task: any) => {
    // Owner (2) and HR (3) can edit any task
    if (user?.role_id === 2 || user?.role_id === 3) {
      setEditingTask(task)
      setOpenModal(true)
    }
    // Leader (4) can only edit team tasks
    else if (user?.role_id === 4 && task.user?.team_id === user.team_id) {
      setEditingTask(task)
      setOpenModal(true)
    } else {
      toast.error("You don't have permission to edit this task")
    }
  }

  // Update the handleDelete function to ensure only authorized roles can delete tasks
  const handleDelete = async (id: number) => {
    // Only Owner (2), HR (3), and Leader (4) can delete tasks
    if (user?.role_id === 2 || user?.role_id === 3 || user?.role_id === 4) {
      if (confirm("Are you sure you want to delete this task?")) {
        try {
          await api.delete(`/tasks/${id}`)
          toast.success("Task deleted successfully")
          fetchTasks()
        } catch (error) {
          toast.error("Failed to delete task")
        }
      }
    } else {
      toast.error("You don't have permission to delete tasks")
    }
  }

  const handleSuccess = () => {
    fetchTasks()
    setOpenModal(false)
  }

  const filteredTasks = tasks.filter((task: any) => {
    // Search filter
    const matchesSearch =
      searchTerm === "" ||
      task.task.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (task.note && task.note.toLowerCase().includes(searchTerm.toLowerCase()))

    // Completed filter
    const matchesCompleted =
      filters.completed === "" ||
      (filters.completed === "completed" && task.completed) ||
      (filters.completed === "pending" && !task.completed)

    // Due date filter
    const matchesDueDate =
      filters.dueDate === "" ||
      (filters.dueDate === "overdue" && task.due_date && new Date(task.due_date) < new Date() && !task.completed) ||
      (filters.dueDate === "today" &&
        task.due_date &&
        new Date(task.due_date).toDateString() === new Date().toDateString()) ||
      (filters.dueDate === "upcoming" && task.due_date && new Date(task.due_date) > new Date()) ||
      (filters.dueDate === "no-date" && !task.due_date)

    // Employee filter - only for Owner and HR roles
    const matchesEmployee = selectedEmployee === "" || (task.user && task.user.id.toString() === selectedEmployee)

    return matchesSearch && matchesCompleted && matchesDueDate && matchesEmployee
  })

  return (
    <main className="min-h-screen bg-[#FAF9F7] text-gray-900">
      <div className="mx-auto max-w-7xl p-4 md:p-6 lg:p-8">
        <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">
              {isEmployee ? "My Tasks" : isTeamLeader ? "Team Tasks" : "Manage Tasks"}
            </h1>
            <p className="mt-1 text-gray-500">
              {isEmployee
                ? "View and complete your assigned tasks"
                : isTeamLeader
                  ? "Manage tasks for your team members"
                  : "Create, assign and track tasks across your organization"}
            </p>
          </div>

          {!isEmployee && !isTeamLeader && (
            <button
              onClick={handleCreate}
              className="inline-flex items-center rounded-lg bg-[#6148F4] px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#5040d3] focus:outline-none focus:ring-2 focus:ring-[#6148F4]/50 focus:ring-offset-2"
            >
              <PlusCircle size={18} className="mr-2" />
              Create Task
            </button>
          )}
        </div>

        {/* Tab Navigation */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="-mb-px flex space-x-6" aria-label="Tabs">
            <button className="flex items-center border-b-2 border-[#6148F4] px-1 py-4 text-sm font-medium text-[#6148F4] transition-colors">
              <ClipboardList size={18} className="mr-2" />
              {isEmployee ? "My Tasks" : isTeamLeader ? "Team Tasks" : "All Tasks"}
            </button>
          </nav>
        </div>

        {/* Metrics Dashboard - Only for admin users */}
        {!isEmployee && !isTeamLeader && <TaskMetrics tasks={tasks} />}

        {/* Search Bar - Only show for admin users */}
        {!isEmployee && !isTeamLeader && (
          <div className="mb-6">
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search tasks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white py-3 pl-10 pr-4 text-sm text-gray-900 shadow-sm transition-all focus:border-[#6148F4] focus:outline-none focus:ring-2 focus:ring-[#6148F4]/20"
              />
            </div>
          </div>
        )}

        {/* Filters and Content */}
        <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
          {/* Filters - Only show for admin users */}
          {!isEmployee && !isTeamLeader && (
            <div className="border-b border-gray-100 bg-gray-50 px-6 py-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="text-sm font-medium text-gray-700">
                  {filteredTasks.length} {filteredTasks.length === 1 ? "task" : "tasks"} found
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="flex items-center rounded-lg bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
                  >
                    <Filter size={16} className="mr-1.5 text-gray-500" />
                    Filters
                  </button>
                </div>
              </div>

              {showFilters && (
                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label htmlFor="status-filter" className="mb-1 block text-xs font-medium text-gray-700">
                      Filter by Status
                    </label>
                    <select
                      id="status-filter"
                      value={filters.completed}
                      onChange={(e) => setFilters({ ...filters, completed: e.target.value })}
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-[#6148F4] focus:outline-none focus:ring-1 focus:ring-[#6148F4]/50"
                    >
                      <option value="">All Statuses</option>
                      <option value="completed">Completed</option>
                      <option value="pending">Pending</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="due-date-filter" className="mb-1 block text-xs font-medium text-gray-700">
                      Filter by Due Date
                    </label>
                    <select
                      id="due-date-filter"
                      value={filters.dueDate}
                      onChange={(e) => setFilters({ ...filters, dueDate: e.target.value })}
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-[#6148F4] focus:outline-none focus:ring-1 focus:ring-[#6148F4]/50"
                    >
                      <option value="">All Due Dates</option>
                      <option value="overdue">Overdue</option>
                      <option value="today">Due Today</option>
                      <option value="upcoming">Upcoming</option>
                      <option value="no-date">No Due Date</option>
                    </select>
                  </div>

                  {(user?.role_id === 2 || user?.role_id === 3) && (
                    <div>
                      <label htmlFor="employee-filter" className="mb-1 block text-xs font-medium text-gray-700">
                        Filter by Employee
                      </label>
                      <select
                        id="employee-filter"
                        value={selectedEmployee}
                        onChange={(e) => setSelectedEmployee(e.target.value)}
                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-[#6148F4] focus:outline-none focus:ring-1 focus:ring-[#6148F4]/50"
                      >
                        <option value="">All Employees</option>
                        {employees.map((employee: any) => (
                          <option key={employee.id} value={employee.id.toString()}>
                            {employee.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="flex items-end sm:col-span-2">
                    <button
                      onClick={() => {
                        setFilters({ completed: "", dueDate: "" })
                        setSelectedEmployee("")
                      }}
                      className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
                    >
                      Clear Filters
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Task Views */}
          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#6148F4] border-t-transparent"></div>
            </div>
          ) : isEmployee ? (
            // Employee view for role_id === 5
            <EmployeeTasksView tasks={tasks} onRefresh={fetchTasks} />
          ) : isTeamLeader ? (
            // Team leader view for role_id === 4
            <TeamTasksView tasks={tasks} onRefresh={fetchTasks} userId={user?.id} teamId={user?.team_id} />
          ) : (
            // Admin/manager board view (Kanban)
            <TaskBoard tasks={filteredTasks} onEdit={handleEdit} onDelete={handleDelete} onRefresh={fetchTasks} />
          )}
        </div>
      </div>

      {/* Task Form Modal - Only for admin users */}
      {!isEmployee && !isTeamLeader && (
        <TaskFormModal
          open={openModal}
          onClose={() => setOpenModal(false)}
          onSuccess={handleSuccess}
          initialTask={editingTask}
          userId={user?.id}
          roleId={user?.role_id}
          teamId={user?.team_id}
        />
      )}
    </main>
  )
}
