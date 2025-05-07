"use client"

import { useState, useEffect, type FormEvent } from "react"
import api from "@/lib/api"
import { toast } from "react-toastify"
import { Users, FileText, User, X, Check, Search, Plus } from "lucide-react"

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
        className="inline-flex items-center rounded-lg bg-[#6148F4] px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#5040d3] focus:outline-none focus:ring-2 focus:ring-[#6148F4]/50 focus:ring-offset-2"
      >
        <Plus size={18} className="mr-2" />
        Create New Team
      </button>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-hidden rounded-xl bg-white shadow-xl animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between border-b border-gray-100 p-6">
          <h2 className="flex items-center text-xl font-semibold text-gray-800">
            <Users size={20} className="mr-2 text-[#6148F4]" />
            Create New Team
          </h2>
          <button onClick={() => setIsExpanded(false)} className="focus:outline-none text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="max-h-[calc(90vh-80px)] overflow-y-auto p-6">
          <div className="space-y-6">
            {/* Team Name */}
            <div>
              <label htmlFor="name" className="mb-1 block text-sm font-medium text-gray-700">
                Team Name *
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Users size={18} className="text-gray-400" />
                </div>
                <input
                  type="text"
                  id="name"
                  placeholder="Engineering Team"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="block w-full rounded-lg border border-gray-300 py-3 pl-10 pr-3 text-sm shadow-sm transition-all focus:border-[#6148F4] focus:outline-none focus:ring-2 focus:ring-[#6148F4]/20"
                  required
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="mb-1 block text-sm font-medium text-gray-700">
                Description
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="pointer-events-none absolute inset-y-0 left-0 pl-3 pt-3">
                  <FileText size={18} className="text-gray-400" />
                </div>
                <textarea
                  id="description"
                  placeholder="Team responsibilities and goals"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="min-h-[100px] block w-full rounded-lg border border-gray-300 py-3 pl-10 pr-3 text-sm shadow-sm transition-all focus:border-[#6148F4] focus:outline-none focus:ring-2 focus:ring-[#6148F4]/20"
                />
              </div>
            </div>

            {/* Team Leader */}
            <div>
              <label htmlFor="leader" className="mb-1 block text-sm font-medium text-gray-700">
                Team Leader
              </label>
              <div className="relative">
                <select
                  id="leader"
                  value={form.leader_id ?? ""}
                  onChange={(e) =>
                    setForm({ ...form, leader_id: e.target.value ? Number.parseInt(e.target.value) : undefined })
                  }
                  className="block w-full appearance-none rounded-lg border border-gray-300 py-3 pl-10 pr-10 text-sm shadow-sm transition-all focus:border-[#6148F4] focus:outline-none focus:ring-2 focus:ring-[#6148F4]/20"
                >
                  <option value="">Select Team Leader</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <User size={18} className="text-gray-400" />
                </div>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                  <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
              {getSelectedLeader() && (
                <div className="mt-2 flex items-center rounded-md bg-[#6148F4]/5 p-2">
                  <div className="mr-2 flex h-8 w-8 items-center justify-center rounded-full bg-[#6148F4]/10">
                    <User size={16} className="text-[#6148F4]" />
                  </div>
                  <span className="text-sm font-medium">{getSelectedLeader()?.name}</span>
                </div>
              )}
            </div>

            {/* Team Members */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Team Members</label>

              {/* Search */}
              <div className="relative mb-3">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Search size={18} className="text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search members..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-3 text-sm shadow-sm transition-all focus:border-[#6148F4] focus:outline-none focus:ring-2 focus:ring-[#6148F4]/20"
                />
              </div>

              {/* Selected Members */}
              {form.member_ids.length > 0 && (
                <div className="mb-3">
                  <div className="mb-2 text-xs font-medium text-gray-500">Selected ({form.member_ids.length})</div>
                  <div className="flex flex-wrap gap-2">
                    {getSelectedMembers().map((user) => (
                      <div key={user.id} className="flex items-center rounded-md bg-[#6148F4]/5 px-2 py-1">
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
              <div className="max-h-48 overflow-y-auto rounded-lg border border-gray-200">
                {filteredUsers.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">No users found</div>
                ) : (
                  filteredUsers.map((user) => (
                    <div
                      key={user.id}
                      className={`flex cursor-pointer items-center justify-between border-b border-gray-100 p-3 last:border-b-0 hover:bg-gray-50 ${
                        form.member_ids.includes(user.id) ? "bg-[#6148F4]/5" : ""
                      }`}
                      onClick={() => toggleMember(user.id)}
                    >
                      <div className="flex items-center">
                        <div className="mr-3 flex h-8 w-8 items-center justify-center rounded-full bg-gray-100">
                          <User size={16} className="text-gray-600" />
                        </div>
                        <div>
                          <div className="text-sm font-medium">{user.name}</div>
                          <div className="text-xs text-gray-500">{user.position || "No position"}</div>
                        </div>
                      </div>
                      <div
                        className={`flex h-5 w-5 items-center justify-center rounded-full border ${
                          form.member_ids.includes(user.id) ? "border-[#6148F4] bg-[#6148F4]" : "border-gray-300"
                        }`}
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
              className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center rounded-lg bg-[#6148F4] px-4 py-2 text-white transition-colors hover:bg-[#5040d3] focus:outline-none focus:ring-2 focus:ring-[#6148F4]/50 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isLoading ? (
                <>
                  <svg
                    className="-ml-1 mr-2 h-4 w-4 animate-spin text-white"
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
