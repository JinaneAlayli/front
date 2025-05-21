"use client"

import { useState, useEffect, useRef } from "react"
import api from "@/lib/api"
import { toast } from "react-toastify"
import { X, ClipboardList, Calendar, User, Bold, List } from "lucide-react"

interface TaskFormModalProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  initialTask?: any
  userId: number
  roleId: number
  teamId: number
}

export default function TaskFormModal({
  open,
  onClose,
  onSuccess,
  initialTask,
  userId,
  roleId,
  teamId,
}: TaskFormModalProps) {
  const [task, setTask] = useState("")
  const [note, setNote] = useState("")
  const [dueDate, setDueDate] = useState("")
  const [selectedEmployee, setSelectedEmployee] = useState<number | null>(null)
  const [employees, setEmployees] = useState<any[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Rich text editing states
  const [isBold, setIsBold] = useState(false)
  const [isList, setIsList] = useState(false)
  const noteRef = useRef<HTMLTextAreaElement>(null)

  // Update the useEffect for fetching employees to respect role permissions
  useEffect(() => {
    if (!open) return

    const fetchEmployees = async () => {
      try {
        const res = await api.get("/users")

        // Filter employees based on roleId
        if (roleId === 4) {
          // If roleId is 4 (Leader), only show employees from the same team
          setEmployees(res.data.filter((employee: any) => employee.team_id === teamId))
        } else if (roleId === 2 || roleId === 3) {
          // If roleId is 2 (Owner) or 3 (HR), show all employees
          setEmployees(res.data)
        } else {
          // For other roles, show no employees (shouldn't happen with proper UI restrictions)
          setEmployees([])
        }
      } catch (error) {
        console.error("Failed to load employees", error)
        toast.error("Failed to load employees")
      }
    }

    fetchEmployees()
  }, [open, roleId, teamId])

  useEffect(() => {
    if (initialTask) {
      setTask(initialTask.task || "")
      setNote(initialTask.note || "")
      setDueDate(initialTask.due_date || "")
      setSelectedEmployee(initialTask.user_id || null)
    } else {
      setTask("")
      setNote("")
      setDueDate("")
      setSelectedEmployee(null)
    }
  }, [initialTask])

  // Update the handleSubmit function to ensure role-based permissions for task creation
  const handleSubmit = async () => {
    // Validate required fields
    if (!task.trim()) {
      toast.error("Task description is required")
      return
    }

    if (!dueDate) {
      toast.error("Due date is required")
      return
    }

    if (!selectedEmployee) {
      toast.error("Please select an employee to assign the task")
      return
    }

    // For Leader (role_id = 4), ensure they can only assign to their team members
    if (roleId === 4) {
      const isTeamMember = employees.some((emp) => emp.id === selectedEmployee && emp.team_id === teamId)
      if (!isTeamMember) {
        toast.error("You can only assign tasks to your team members")
        return
      }
    }

    setIsSubmitting(true)

    try {
      const payload = {
        task,
        note,
        due_date: dueDate,
        user_id: selectedEmployee,
      }

      if (initialTask) {
        await api.patch(`/tasks/${initialTask.id}`, payload)
        toast.success("Task updated successfully")
      } else {
        await api.post("/tasks", payload)
        toast.success("Task created successfully")
      }

      onSuccess()
    } catch (error) {
      console.error("Failed to save task:", error)
      toast.error("Failed to save task")
    } finally {
      setIsSubmitting(false)
    }
  }

  const insertBold = () => {
    if (!noteRef.current) return

    const start = noteRef.current.selectionStart
    const end = noteRef.current.selectionEnd
    const selectedText = note.substring(start, end)

    if (selectedText) {
      const newText = note.substring(0, start) + `**${selectedText}**` + note.substring(end)
      setNote(newText)
    } else {
      const newText = note.substring(0, start) + `**bold text**` + note.substring(end)
      setNote(newText)

      // Set selection to the inserted text
      setTimeout(() => {
        if (noteRef.current) {
          noteRef.current.selectionStart = start + 2
          noteRef.current.selectionEnd = start + 11
          noteRef.current.focus()
        }
      }, 0)
    }
  }

  const insertList = () => {
    if (!noteRef.current) return

    const start = noteRef.current.selectionStart
    const newText = note.substring(0, start) + "\n- " + note.substring(start)
    setNote(newText)

    // Position cursor after the bullet point
    setTimeout(() => {
      if (noteRef.current) {
        noteRef.current.selectionStart = start + 3
        noteRef.current.selectionEnd = start + 3
        noteRef.current.focus()
      }
    }, 0)
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-hidden rounded-xl bg-white shadow-xl animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between border-b border-gray-100 bg-[#6148F4]/5 p-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">{initialTask ? "Edit Task" : "Create Task"}</h2>
            <p className="mt-1 text-sm text-gray-500">
              {initialTask ? "Update task details" : "Add a new task to your list"}
            </p>
          </div>
          <button onClick={onClose} className="focus:outline-none text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        <div className="max-h-[calc(90vh-80px)] overflow-y-auto space-y-5 p-6">
          <div className="space-y-5">
            {/* Task Description */}
            <div>
              <label htmlFor="task" className="mb-1 block text-sm font-medium text-gray-700">
                Task Description <span className="text-red-500">*</span>
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <ClipboardList size={18} className="text-gray-400" />
                </div>
                <textarea
                  id="task"
                  placeholder="What needs to be done?"
                  className="block w-full rounded-lg border border-gray-300 py-3 pl-10 pr-3 text-sm shadow-sm transition-all focus:border-[#6148F4] focus:outline-none focus:ring-2 focus:ring-[#6148F4]/20"
                  value={task}
                  onChange={(e) => setTask(e.target.value)}
                  rows={3}
                  required
                />
              </div>
            </div>

            {/* Note */}
            <div>
              <label htmlFor="note" className="mb-1 block text-sm font-medium text-gray-700">
                Note (Optional)
              </label>
              <div className="space-y-2">
                <div className="flex items-center gap-2 rounded-t-lg border border-b-0 border-gray-300 bg-gray-50 px-3 py-2">
                  <button
                    type="button"
                    onClick={insertBold}
                    className={`rounded p-1 ${isBold ? "bg-gray-200" : "hover:bg-gray-200"}`}
                    title="Bold"
                  >
                    <Bold size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={insertList}
                    className={`rounded p-1 ${isList ? "bg-gray-200" : "hover:bg-gray-200"}`}
                    title="List"
                  >
                    <List size={16} />
                  </button>
                  <div className="text-xs text-gray-500">Use **text** for bold, - for lists</div>
                </div>
                <div className="relative rounded-b-md shadow-sm">
                  <textarea
                    ref={noteRef}
                    id="note"
                    placeholder="Add additional details"
                    className="block w-full rounded-b-lg border border-gray-300 py-3 px-3 text-sm shadow-sm transition-all focus:border-[#6148F4] focus:outline-none focus:ring-2 focus:ring-[#6148F4]/20"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    rows={5}
                  />
                </div>
              </div>
            </div>

            {/* Due Date */}
            <div>
              <label htmlFor="due-date" className="mb-1 block text-sm font-medium text-gray-700">
                Due Date <span className="text-red-500">*</span>
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Calendar size={18} className="text-gray-400" />
                </div>
                <input
                  type="date"
                  id="due-date"
                  className="block w-full rounded-lg border border-gray-300 py-3 pl-10 pr-3 text-sm shadow-sm transition-all focus:border-[#6148F4] focus:outline-none focus:ring-2 focus:ring-[#6148F4]/20"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Assign To */}
            <div>
              <label htmlFor="employee" className="mb-1 block text-sm font-medium text-gray-700">
                Assign To <span className="text-red-500">*</span>
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <User size={18} className="text-gray-400" />
                </div>
                <select
                  id="employee"
                  className="block w-full appearance-none rounded-lg border border-gray-300 bg-none py-3 pl-10 pr-10 text-sm shadow-sm transition-all focus:border-[#6148F4] focus:outline-none focus:ring-2 focus:ring-[#6148F4]/20"
                  value={selectedEmployee || ""}
                  onChange={(e) => setSelectedEmployee(e.target.value ? Number(e.target.value) : null)}
                  required
                >
                  <option value="">Select an employee</option>
                  {employees.map((employee) => (
                    <option key={employee.id} value={employee.id}>
                      {employee.name}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                  <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-3 pt-4 sm:flex-row">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-300 px-4 py-2.5 text-gray-700 transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex flex-1 items-center justify-center rounded-lg bg-[#6148F4] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#5040d3] focus:outline-none focus:ring-2 focus:ring-[#6148F4]/50 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? "Saving..." : initialTask ? "Update Task" : "Create Task"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
