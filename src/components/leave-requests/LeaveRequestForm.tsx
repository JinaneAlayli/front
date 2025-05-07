"use client"

import { useState, useEffect } from "react"
import api from "@/lib/api"
import { toast } from "react-toastify"
import { X, Calendar, FileText, User, Clock } from "lucide-react"

interface LeaveRequestFormProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  isManager: boolean
  userId: number
}

export default function LeaveRequestForm({ open, onClose, onSuccess, isManager, userId }: LeaveRequestFormProps) {
  const [type, setType] = useState("vacation")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [reason, setReason] = useState("")
  const [selectedEmployee, setSelectedEmployee] = useState<number | null>(null)
  const [employees, setEmployees] = useState<any[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!open || !isManager) return

    const fetchEmployees = async () => {
      try {
        const res = await api.get("/users")
        setEmployees(res.data)
      } catch (error) {
        console.error("Failed to load employees", error)
        toast.error("Failed to load employees")
      }
    }

    fetchEmployees()
  }, [open, isManager])

  const resetForm = () => {
    setType("vacation")
    setStartDate("")
    setEndDate("")
    setReason("")
    setSelectedEmployee(null)
  }

  const handleSubmit = async () => {
    if (!startDate) {
      toast.error("Start date is required")
      return
    }

    if (!endDate) {
      toast.error("End date is required")
      return
    }

    if (!reason.trim()) {
      toast.error("Reason is required")
      return
    }

    setIsSubmitting(true)

    try {
      const payload = {
        type,
        start_date: startDate,
        end_date: endDate,
        reason,
        user_id: isManager ? selectedEmployee || userId : userId,
      }

      await api.post("/leave-requests", payload)
      resetForm()
      onSuccess()
    } catch (error) {
      console.error("Failed to submit leave request:", error)
      toast.error("Failed to submit leave request")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Calculate the number of days between start and end dates
  const calculateDays = () => {
    if (!startDate || !endDate) return null

    const start = new Date(startDate)
    const end = new Date(endDate)
    const diffTime = Math.abs(end.getTime() - start.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1 // Include both start and end days

    return diffDays
  }

  const daysCount = calculateDays()

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-md overflow-hidden rounded-xl bg-white shadow-xl animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between border-b border-gray-100 bg-[#6148F4]/5 p-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">New Leave Request</h2>
            <p className="mt-1 text-sm text-gray-500">Submit a request for time off</p>
          </div>
          <button onClick={onClose} className="focus:outline-none text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        <div className="max-h-[calc(90vh-80px)] overflow-y-auto space-y-5 p-6">
          <div className="space-y-5">
            {/* Leave Type */}
            <div>
              <label htmlFor="leave-type" className="mb-1 block text-sm font-medium text-gray-700">
                Leave Type
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Calendar size={18} className="text-gray-400" />
                </div>
                <select
                  id="leave-type"
                  className="block w-full appearance-none rounded-lg border border-gray-300 bg-none py-3 pl-10 pr-10 text-sm shadow-sm transition-all focus:border-[#6148F4] focus:outline-none focus:ring-2 focus:ring-[#6148F4]/20"
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                >
                  <option value="vacation">Vacation</option>
                  <option value="sick">Sick Leave</option>
                  <option value="personal">Personal Leave</option>
                  <option value="other">Other</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                  <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="start-date" className="mb-1 block text-sm font-medium text-gray-700">
                  Start Date
                </label>
                <div className="relative rounded-md shadow-sm">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Calendar size={18} className="text-gray-400" />
                  </div>
                  <input
                    type="date"
                    id="start-date"
                    className="block w-full rounded-lg border border-gray-300 py-3 pl-10 pr-3 text-sm shadow-sm transition-all focus:border-[#6148F4] focus:outline-none focus:ring-2 focus:ring-[#6148F4]/20"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    min={new Date().toISOString().split("T")[0]}
                    required
                  />
                </div>
              </div>
              <div>
                <label htmlFor="end-date" className="mb-1 block text-sm font-medium text-gray-700">
                  End Date
                </label>
                <div className="relative rounded-md shadow-sm">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Calendar size={18} className="text-gray-400" />
                  </div>
                  <input
                    type="date"
                    id="end-date"
                    className="block w-full rounded-lg border border-gray-300 py-3 pl-10 pr-3 text-sm shadow-sm transition-all focus:border-[#6148F4] focus:outline-none focus:ring-2 focus:ring-[#6148F4]/20"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    min={startDate || new Date().toISOString().split("T")[0]}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Days Count */}
            {daysCount && (
              <div className="rounded-lg bg-[#6148F4]/5 p-3 text-center">
                <div className="flex items-center justify-center">
                  <Clock size={16} className="mr-2 text-[#6148F4]" />
                  <span className="text-sm font-medium text-gray-700">
                    {daysCount} {daysCount === 1 ? "day" : "days"} requested
                  </span>
                </div>
              </div>
            )}

            {/* Reason */}
            <div>
              <label htmlFor="reason" className="mb-1 block text-sm font-medium text-gray-700">
                Reason
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <FileText size={18} className="text-gray-400" />
                </div>
                <textarea
                  id="reason"
                  placeholder="Please provide a reason for your leave request"
                  className="block w-full rounded-lg border border-gray-300 py-3 pl-10 pr-3 text-sm shadow-sm transition-all focus:border-[#6148F4] focus:outline-none focus:ring-2 focus:ring-[#6148F4]/20"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={4}
                  required
                />
              </div>
            </div>

            {/* Employee Selection (Only for HR/Owner) */}
            {isManager && (
              <div>
                <label htmlFor="employee" className="mb-1 block text-sm font-medium text-gray-700">
                  Create request for:
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
                  >
                    <option value="">Create for myself</option>
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
            )}
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
              {isSubmitting ? "Submitting..." : "Submit Request"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
