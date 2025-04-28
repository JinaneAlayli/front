"use client"

import { useState, useEffect, type FormEvent } from "react"
import api from "@/lib/api"
import { toast } from "react-toastify"
import { Users, FileText, User, X, Check, Search } from "lucide-react"

export default function CreateTeamForm({ onSuccess }: { onSuccess: () => void }) {
  const [form, setForm] = useState({
    name: "",
    description: "",
    leader_id: undefined as number | undefined,
    member_ids: [] as number[],
  })
  const [users, setUsers] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [isExpanded, setIsExpanded] = useState(false)

  useEffect(() => {
    api.get("/users").then((res) => setUsers(res.data))
  }, [])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    if (!form.name.trim()) {
      toast.error("Team name is required")
      return
    }

    setIsLoading(true)

    try {
      await api.post("/teams", form)
      toast.success("Team created successfully!")
      setForm({ name: "", description: "", leader_id: undefined, member_ids: [] })
      onSuccess()
      setIsExpanded(false)
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Team creation failed")
    } finally {
      setIsLoading(false)
    }
  }

  const filteredUsers = users.filter((user) => user.name.toLowerCase().includes(searchTerm.toLowerCase()))

  const getSelectedLeader = () => {
    if (!form.leader_id) return null
    return users.find((u) => u.id === form.leader_id)
  }

  const getSelectedMembers = () => {
    return users.filter((u) => form.member_ids.includes(u.id))
  }

  const toggleMember = (userId: number) => {
    const isSelected = form.member_ids.includes(userId)
    const updated = isSelected ? form.member_ids.filter((id) => id !== userId) : [...form.member_ids, userId]
    setForm({ ...form, member_ids: updated })
  }

  if (!isExpanded) {
    return (
      <button
        onClick={() => setIsExpanded(true)}
        className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      >
        <Users size={18} className="mr-2" />
        Create New Team
      </button>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden animate-fade-in-scale">
        <div className="flex justify-between items-center p-6 border-b border-gray-100">
          <h2 className="text-xl font-semibold text-gray-800 flex items-center">
            <Users size={20} className="mr-2 text-blue-600" />
            Create New Team
          </h2>
          <button onClick={() => setIsExpanded(false)} className="text-gray-400 hover:text-gray-600 focus:outline-none">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
          <div className="space-y-6">
            {/* Team Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Team Name *
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Users size={18} className="text-gray-400" />
                </div>
                <input
                  type="text"
                  id="name"
                  placeholder="Engineering Team"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  required
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 pt-3 pointer-events-none">
                  <FileText size={18} className="text-gray-400" />
                </div>
                <textarea
                  id="description"
                  placeholder="Team responsibilities and goals"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm min-h-[100px]"
                />
              </div>
            </div>

            {/* Team Leader */}
            <div>
              <label htmlFor="leader" className="block text-sm font-medium text-gray-700 mb-1">
                Team Leader
              </label>
              <div className="relative">
                <select
                  id="leader"
                  value={form.leader_id ?? ""}
                  onChange={(e) =>
                    setForm({ ...form, leader_id: e.target.value ? Number.parseInt(e.target.value) : undefined })
                  }
                  className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm appearance-none"
                >
                  <option value="">Select Team Leader</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User size={18} className="text-gray-400" />
                </div>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
              {getSelectedLeader() && (
                <div className="mt-2 flex items-center bg-blue-50 p-2 rounded-md">
                  <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center mr-2">
                    <User size={16} className="text-blue-600" />
                  </div>
                  <span className="text-sm font-medium">{getSelectedLeader()?.name}</span>
                </div>
              )}
            </div>

            {/* Team Members */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Team Members</label>

              {/* Search */}
              <div className="relative mb-3">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search size={18} className="text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search members..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>

              {/* Selected Members */}
              {form.member_ids.length > 0 && (
                <div className="mb-3">
                  <div className="text-xs font-medium text-gray-500 mb-2">Selected ({form.member_ids.length})</div>
                  <div className="flex flex-wrap gap-2">
                    {getSelectedMembers().map((user) => (
                      <div key={user.id} className="flex items-center bg-blue-50 px-2 py-1 rounded-md">
                        <span className="text-sm">{user.name}</span>
                        <button
                          type="button"
                          onClick={() => toggleMember(user.id)}
                          className="ml-1 text-gray-400 hover:text-gray-600"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Member Selection */}
              <div className="border border-gray-200 rounded-lg max-h-48 overflow-y-auto">
                {filteredUsers.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">No users found</div>
                ) : (
                  filteredUsers.map((user) => (
                    <div
                      key={user.id}
                      className={`flex items-center justify-between p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0 ${
                        form.member_ids.includes(user.id) ? "bg-blue-50" : ""
                      }`}
                      onClick={() => toggleMember(user.id)}
                    >
                      <div className="flex items-center">
                        <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center mr-3">
                          <User size={16} className="text-gray-600" />
                        </div>
                        <div>
                          <div className="text-sm font-medium">{user.name}</div>
                          <div className="text-xs text-gray-500">{user.position || "No position"}</div>
                        </div>
                      </div>
                      <div
                        className={`h-5 w-5 rounded-full border ${form.member_ids.includes(user.id) ? "bg-blue-600 border-blue-600" : "border-gray-300"} flex items-center justify-center`}
                      >
                        {form.member_ids.includes(user.id) && <Check size={12} className="text-white" />}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="mt-8 flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => setIsExpanded(false)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors flex items-center"
            >
              {isLoading ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Creating...
                </>
              ) : (
                "Create Team"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
