"use client"

import { useState } from "react"
import api from "@/lib/api"
import { toast } from "react-toastify"
import { CheckCircle, Clock, AlertCircle, Calendar, Bold, List, Save, Check } from "lucide-react"

interface Task {
  id: number
  task: string
  note: string
  completed: boolean
  due_date?: string
}

interface Props {
  tasks: Task[]
  onRefresh: () => void
}

export default function EmployeeTasksView({ tasks, onRefresh }: Props) {
  const [notes, setNotes] = useState<{ [taskId: number]: string }>(
    tasks.reduce(
      (acc, task) => {
        acc[task.id] = task.note || ""
        return acc
      },
      {} as { [key: number]: string },
    ),
  )

  const [editingNotes, setEditingNotes] = useState<number[]>([])
  const [savingNotes, setSavingNotes] = useState<number[]>([])
  const [updatingStatus, setUpdatingStatus] = useState<number[]>([])

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

  const handleNoteChange = (id: number, newNote: string) => {
    setNotes((prev) => ({ ...prev, [id]: newNote }))
    if (!editingNotes.includes(id)) {
      setEditingNotes([...editingNotes, id])
    }
  }

  const handleSaveNote = async (id: number) => {
    try {
      setSavingNotes([...savingNotes, id])
      await api.patch(`/tasks/${id}`, { note: notes[id] })
      toast.success("Note updated successfully")
      setEditingNotes(editingNotes.filter((noteId) => noteId !== id))
      onRefresh()
    } catch (err) {
      toast.error("Failed to update note")
      console.error("Failed to update note:", err)
    } finally {
      setSavingNotes(savingNotes.filter((noteId) => noteId !== id))
    }
  }

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

  // Function to insert bold formatting
  const insertBold = (id: number) => {
    const currentNote = notes[id]
    const textarea = document.getElementById(`note-${id}`) as HTMLTextAreaElement

    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = currentNote.substring(start, end)

    if (selectedText) {
      const newText = currentNote.substring(0, start) + `**${selectedText}**` + currentNote.substring(end)
      handleNoteChange(id, newText)
    } else {
      const newText = currentNote.substring(0, start) + `**bold text**` + currentNote.substring(end)
      handleNoteChange(id, newText)

      // Set selection to the inserted text
      setTimeout(() => {
        textarea.selectionStart = start + 2
        textarea.selectionEnd = start + 11
        textarea.focus()
      }, 0)
    }
  }

  // Function to insert list item
  const insertList = (id: number) => {
    const currentNote = notes[id]
    const textarea = document.getElementById(`note-${id}`) as HTMLTextAreaElement

    if (!textarea) return

    const start = textarea.selectionStart
    const newText = currentNote.substring(0, start) + "\n- " + currentNote.substring(start)
    handleNoteChange(id, newText)

    // Position cursor after the bullet point
    setTimeout(() => {
      textarea.selectionStart = start + 3
      textarea.selectionEnd = start + 3
      textarea.focus()
    }, 0)
  }

  // Function to get status badge
  const getStatusBadge = (task: Task) => {
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
          <h3 className="text-sm font-medium text-gray-900">No tasks assigned to you</h3>
          <p className="mt-1 text-xs text-gray-500">Check back later for new assignments</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tasks.map((task) => (
            <div
              key={task.id}
              className={`rounded-xl border ${
                task.completed ? "border-green-100 bg-green-50/30" : "border-gray-100 bg-white"
              } p-5 shadow-sm transition-all hover:shadow-md`}
            >
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
                <div className="w-full">
                  <h3
                    className={`text-lg font-medium ${task.completed ? "text-gray-500 line-through" : "text-gray-900"}`}
                    dangerouslySetInnerHTML={{
                      __html: task.task.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>"),
                    }}
                  />

                  <div className="mt-2 flex flex-wrap items-center gap-2">
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

                  <div className="mt-4 space-y-2">
                    <div className="flex items-center gap-2 rounded-t-lg border border-b-0 border-gray-300 bg-gray-50 px-3 py-2">
                      <button
                        type="button"
                        onClick={() => insertBold(task.id)}
                        className="rounded p-1 hover:bg-gray-200"
                        title="Bold"
                      >
                        <Bold size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => insertList(task.id)}
                        className="rounded p-1 hover:bg-gray-200"
                        title="List"
                      >
                        <List size={16} />
                      </button>
                      <div className="text-xs text-gray-500">Use **text** for bold, - for lists</div>
                    </div>

                    <textarea
                      id={`note-${task.id}`}
                      value={notes[task.id]}
                      onChange={(e) => handleNoteChange(task.id, e.target.value)}
                      placeholder="Add your notes here..."
                      className="block w-full rounded-b-lg border border-gray-300 py-3 px-3 text-sm shadow-sm transition-all focus:border-[#6148F4] focus:outline-none focus:ring-2 focus:ring-[#6148F4]/20"
                      rows={4}
                    />

                    {editingNotes.includes(task.id) && (
                      <button
                        onClick={() => handleSaveNote(task.id)}
                        disabled={savingNotes.includes(task.id)}
                        className="flex w-full items-center justify-center rounded-lg bg-[#6148F4] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#5040d3] focus:outline-none focus:ring-2 focus:ring-[#6148F4]/50 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
                      >
                        {savingNotes.includes(task.id) ? (
                          "Saving..."
                        ) : (
                          <>
                            <Save size={16} className="mr-2" />
                            Save Note
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
