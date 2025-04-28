"use client"

import { useEffect, useState } from "react"
import { toast } from "react-toastify"
import api from "@/lib/api"

interface Salary {
  id: number
  user_id: number
  base_salary: number
  bonus: number
  overtime: number
  deductions: number
  month: number
  year: number
  status: string
  effective_from: string
  user: {
    id: number
    name: string
    position: string
    team: { name: string }
  }
}

interface UserOption {
  id: number
  name: string
}

const monthNames = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
]

export default function SalaryManagementTable() {
  const [salaries, setSalaries] = useState<Salary[]>([])
  const [users, setUsers] = useState<UserOption[]>([])
  const [newSalary, setNewSalary] = useState({
    user_id: 0,
    base_salary: 0,
    bonus: 0,
    overtime: 0,
    deductions: 0,
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    status: "pending",
  })
  const [edited, setEdited] = useState<{ [key: number]: Partial<Salary> }>({})
  const [editMode, setEditMode] = useState<{ [key: number]: boolean }>({})
  const [isLoading, setIsLoading] = useState(true)
  const [showAddPanel, setShowAddPanel] = useState(false)

  useEffect(() => {
    setIsLoading(true)
    api
      .get("/salaries/active/company")
      .then((res) => setSalaries(res.data))
      .catch(() => toast.error("Failed to load salaries"))
      .finally(() => setIsLoading(false))

    api
      .get("/users")
      .then((res) => {
        const filtered = res.data.filter((u: any) => !u.is_deleted)
        setUsers(filtered)
      })
      .catch(() => toast.error("Failed to load users"))
  }, [])

  const handleEdit = (id: number, field: keyof Salary, value: any) => {
    setEdited((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: value,
      },
    }))
  }

  const startEditing = (salary: Salary) => {
    // Initialize the edited state with current values
    setEdited((prev) => ({
      ...prev,
      [salary.id]: {
        base_salary: salary.base_salary,
        bonus: salary.bonus,
        overtime: salary.overtime,
        deductions: salary.deductions,
        status: salary.status,
      },
    }))

    // Set this row to edit mode
    setEditMode((prev) => ({
      ...prev,
      [salary.id]: true,
    }))
  }

  const cancelEditing = (id: number) => {
    // Clear edited values and exit edit mode
    setEdited((prev) => ({
      ...prev,
      [id]: {},
    }))

    setEditMode((prev) => ({
      ...prev,
      [id]: false,
    }))
  }

  const handleSave = async (id: number) => {
    try {
      await api.patch(`/salaries/${id}`, edited[id])
      toast.success("Salary updated successfully")
      const res = await api.get("/salaries/active/company")
      setSalaries(res.data)

      // Exit edit mode
      setEditMode((prev) => ({
        ...prev,
        [id]: false,
      }))

      setEdited((prev) => ({ ...prev, [id]: {} }))
    } catch {
      toast.error("Update failed")
    }
  }

  const handleAdd = async () => {
    if (newSalary.user_id === 0) {
      toast.error("Please select an employee")
      return
    }

    try {
      await api.post("/salaries", {
        ...newSalary,
        effective_from: new Date().toISOString().slice(0, 10),
      })
      toast.success("Salary created successfully")
      const res = await api.get("/salaries/active/company")
      setSalaries(res.data)
      setNewSalary({
        user_id: 0,
        base_salary: 0,
        bonus: 0,
        overtime: 0,
        deductions: 0,
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
        status: "pending",
      })
      setShowAddPanel(false)
    } catch {
      toast.error("Creation failed")
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "approved":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "paid":
        return "bg-green-100 text-green-800 border-green-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getTotalSalary = (salary: Salary) => {
    const base = edited[salary.id]?.base_salary ?? salary.base_salary
    const bonus = edited[salary.id]?.bonus ?? salary.bonus
    const overtime = edited[salary.id]?.overtime ?? salary.overtime
    const deductions = edited[salary.id]?.deductions ?? salary.deductions
    return base + bonus + overtime - deductions
  }

  return (
    <div className="relative">
      {/* Blurred Backdrop and Centered Modal */}
      {showAddPanel && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 backdrop-blur-sm bg-white/30 z-40 transition-opacity duration-300"
            onClick={() => setShowAddPanel(false)}
          ></div>

          {/* Centered Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="bg-white rounded-lg shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto animate-fade-in-scale"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-gray-800">Add New Salary Record</h2>
                  <button
                    onClick={() => setShowAddPanel(false)}
                    className="text-gray-500 hover:text-gray-700 focus:outline-none"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Employee *</label>
                    <select
                      value={newSalary.user_id}
                      onChange={(e) => setNewSalary({ ...newSalary, user_id: +e.target.value })}
                      className="w-full rounded-md border border-gray-300 shadow-sm px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent"
                    >
                      <option value={0}>Select employee</option>
                      {users.map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Base Salary *</label>
                      <input
                        type="number"
                        value={newSalary.base_salary}
                        onChange={(e) => setNewSalary({ ...newSalary, base_salary: +e.target.value })}
                        className="w-full rounded-md border border-gray-300 shadow-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Bonus</label>
                      <input
                        type="number"
                        value={newSalary.bonus}
                        onChange={(e) => setNewSalary({ ...newSalary, bonus: +e.target.value })}
                        className="w-full rounded-md border border-gray-300 shadow-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Overtime</label>
                      <input
                        type="number"
                        value={newSalary.overtime}
                        onChange={(e) => setNewSalary({ ...newSalary, overtime: +e.target.value })}
                        className="w-full rounded-md border border-gray-300 shadow-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Deductions</label>
                      <input
                        type="number"
                        value={newSalary.deductions}
                        onChange={(e) => setNewSalary({ ...newSalary, deductions: +e.target.value })}
                        className="w-full rounded-md border border-gray-300 shadow-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Month</label>
                      <select
                        value={newSalary.month}
                        onChange={(e) => setNewSalary({ ...newSalary, month: +e.target.value })}
                        className="w-full rounded-md border border-gray-300 shadow-sm px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent"
                      >
                        {monthNames.map((month, i) => (
                          <option key={i} value={i + 1}>
                            {month}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                      <input
                        type="number"
                        value={newSalary.year}
                        onChange={(e) => setNewSalary({ ...newSalary, year: +e.target.value })}
                        className="w-full rounded-md border border-gray-300 shadow-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select
                      value={newSalary.status}
                      onChange={(e) => setNewSalary({ ...newSalary, status: e.target.value })}
                      className="w-full rounded-md border border-gray-300 shadow-sm px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent"
                    >
                      <option value="pending">Pending</option>
                      <option value="approved">Approved</option>
                      <option value="paid">Paid</option>
                    </select>
                  </div>

                  <div className="pt-4">
                    <button
                      onClick={handleAdd}
                      className="w-full px-4 py-2 bg-slate-800 text-white rounded-md hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 transition-colors"
                    >
                      Add Salary Record
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Main Table */}
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800">Salary Management</h2>
          <button
            onClick={() => setShowAddPanel(true)}
            className="px-4 py-2 bg-slate-800 text-white rounded-md hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 transition-colors flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
                clipRule="evenodd"
              />
            </svg>
            Add New Salary
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-100 text-left">
                <th className="px-4 py-3 text-sm font-semibold text-gray-700">Employee</th>
                <th className="px-4 py-3 text-sm font-semibold text-gray-700">Position</th>
                <th className="px-4 py-3 text-sm font-semibold text-gray-700">Team</th>
                <th className="px-4 py-3 text-sm font-semibold text-gray-700">Base</th>
                <th className="px-4 py-3 text-sm font-semibold text-gray-700">Bonus</th>
                <th className="px-4 py-3 text-sm font-semibold text-gray-700">Overtime</th>
                <th className="px-4 py-3 text-sm font-semibold text-gray-700">Deductions</th>
                <th className="px-4 py-3 text-sm font-semibold text-gray-700">Total</th>
                <th className="px-4 py-3 text-sm font-semibold text-gray-700">Period</th>
                <th className="px-4 py-3 text-sm font-semibold text-gray-700">Status</th>
                <th className="px-4 py-3 text-sm font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={11} className="px-4 py-8 text-center text-gray-500">
                    Loading salary records...
                  </td>
                </tr>
              ) : salaries.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-4 py-8 text-center text-gray-500">
                    No salary records found
                  </td>
                </tr>
              ) : (
                salaries.map((salary) => (
                  <tr
                    key={salary.id}
                    className={`border-t border-gray-200 ${editMode[salary.id] ? "bg-blue-50" : "hover:bg-gray-50"}`}
                  >
                    <td className="px-4 py-3 font-medium text-gray-900">{salary.user.name}</td>
                    <td className="px-4 py-3 text-gray-700">{salary.user.position}</td>
                    <td className="px-4 py-3 text-gray-700">{salary.user.team?.name || "-"}</td>

                    {/* Base Salary */}
                    <td className="px-4 py-3">
                      {editMode[salary.id] ? (
                        <input
                          type="number"
                          value={edited[salary.id]?.base_salary ?? salary.base_salary}
                          onChange={(e) => handleEdit(salary.id, "base_salary", +e.target.value)}
                          className="w-24 rounded border border-gray-300 px-2 py-1 focus:outline-none focus:ring-1 focus:ring-slate-400 focus:border-transparent"
                        />
                      ) : (
                        <span>{salary.base_salary.toLocaleString()}</span>
                      )}
                    </td>

                    {/* Bonus */}
                    <td className="px-4 py-3">
                      {editMode[salary.id] ? (
                        <input
                          type="number"
                          value={edited[salary.id]?.bonus ?? salary.bonus}
                          onChange={(e) => handleEdit(salary.id, "bonus", +e.target.value)}
                          className="w-24 rounded border border-gray-300 px-2 py-1 focus:outline-none focus:ring-1 focus:ring-slate-400 focus:border-transparent"
                        />
                      ) : (
                        <span>{salary.bonus.toLocaleString()}</span>
                      )}
                    </td>

                    {/* Overtime */}
                    <td className="px-4 py-3">
                      {editMode[salary.id] ? (
                        <input
                          type="number"
                          value={edited[salary.id]?.overtime ?? salary.overtime}
                          onChange={(e) => handleEdit(salary.id, "overtime", +e.target.value)}
                          className="w-24 rounded border border-gray-300 px-2 py-1 focus:outline-none focus:ring-1 focus:ring-slate-400 focus:border-transparent"
                        />
                      ) : (
                        <span>{salary.overtime.toLocaleString()}</span>
                      )}
                    </td>

                    {/* Deductions */}
                    <td className="px-4 py-3">
                      {editMode[salary.id] ? (
                        <input
                          type="number"
                          value={edited[salary.id]?.deductions ?? salary.deductions}
                          onChange={(e) => handleEdit(salary.id, "deductions", +e.target.value)}
                          className="w-24 rounded border border-gray-300 px-2 py-1 focus:outline-none focus:ring-1 focus:ring-slate-400 focus:border-transparent"
                        />
                      ) : (
                        <span>{salary.deductions.toLocaleString()}</span>
                      )}
                    </td>

                    {/* Total */}
                    <td className="px-4 py-3 font-semibold text-gray-900">{getTotalSalary(salary).toLocaleString()}</td>

                    {/* Period */}
                    <td className="px-4 py-3 text-gray-700">
                      {monthNames[salary.month - 1]} {salary.year}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      {editMode[salary.id] ? (
                        <select
                          value={edited[salary.id]?.status ?? salary.status}
                          onChange={(e) => handleEdit(salary.id, "status", e.target.value)}
                          className="rounded border px-2 py-1 text-sm font-medium w-28"
                        >
                          <option value="pending">Pending</option>
                          <option value="approved">Approved</option>
                          <option value="paid">Paid</option>
                        </select>
                      ) : (
                        <div
                          className={`text-xs px-2 py-0.5 rounded-full inline-block ${getStatusColor(salary.status)}`}
                        >
                          {salary.status}
                        </div>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      {editMode[salary.id] ? (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleSave(salary.id)}
                            className="p-1.5 bg-green-600 text-white rounded hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1 transition-colors"
                            title="Save changes"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-4 w-4"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </button>
                          <button
                            onClick={() => cancelEditing(salary.id)}
                            className="p-1.5 bg-gray-500 text-white rounded hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-1 transition-colors"
                            title="Cancel editing"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-4 w-4"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                              />
                            </svg>
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => startEditing(salary)}
                          className="p-1.5 bg-slate-700 text-white rounded hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-1 transition-colors"
                          title="Edit salary"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                            />
                          </svg>
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
