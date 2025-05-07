"use client"

import { useEffect, useState } from "react"
import api from "@/lib/api"
import { toast } from "react-toastify"
import { Pencil, Trash2, Check, X, User, Filter } from 'lucide-react'
import Image from "next/image"

interface Employee {
  id: number
  name: string
  email: string
  phone: string
  role: { id: number; name: string }
  position: string
  team: { id: number; name: string }
  profile_img: string
}

interface EmployeeTableProps {
  searchTerm: string
}

export default function EmployeeTable({ searchTerm }: EmployeeTableProps) {
  const [users, setUsers] = useState<Employee[]>([])
  const [roles, setRoles] = useState<{ id: number; name: string }[]>([])
  const [teams, setTeams] = useState<{ id: number; name: string }[]>([])
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState<Partial<Employee>>({})
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    role: "",
    team: "",
  })
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const [usersRes, rolesRes, teamsRes] = await Promise.all([
          api.get("/users"),
          api.get("/roles"),
          api.get("/teams"),
        ])
        setUsers(usersRes.data)
        setRoles(rolesRes.data)
        setTeams(teamsRes.data)
      } catch {
        toast.error("Failed to load data")
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const startEdit = (user: Employee) => {
    setEditingId(user.id)
    setForm({
      name: user.name,
      email: user.email,
      phone: user.phone,
      position: user.position,
      role: user.role,
      team: user.team,
    })
  }

  const cancelEdit = () => {
    setEditingId(null)
    setForm({})
  }

  const handleUpdate = async (userId: number) => {
    try {
      await api.patch(`/users/${userId}`, {
        name: form.name,
        email: form.email,
        phone: form.phone,
        position: form.position,
        role_id: (form.role as any)?.id,
        team_id: (form.team as any)?.id || null,
      })
      toast.success("User updated")
      setEditingId(null)
      const updated = await api.get("/users")
      setUsers(updated.data)
    } catch {
      toast.error("Update failed")
    }
  }

  const handleDelete = async (userId: number) => {
    if (!confirm("Are you sure you want to delete this employee?")) return
    try {
      await api.delete(`/users/${userId}`)
      toast.success("User deleted")
      setUsers((prev) => prev.filter((u) => u.id !== userId))
    } catch {
      toast.error("Delete failed")
    }
  }

  const filteredUsers = users.filter((user) => {
    // Search filter
    const matchesSearch =
      searchTerm === "" ||
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.position.toLowerCase().includes(searchTerm.toLowerCase())

    // Role filter
    const matchesRole = filters.role === "" || user.role?.id.toString() === filters.role

    // Team filter
    const matchesTeam =
      filters.team === "" || (filters.team === "none" && !user.team?.id) || user.team?.id?.toString() === filters.team

    return matchesSearch && matchesRole && matchesTeam
  })

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#6148F4] border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
      {/* Filters */}
      <div className="border-b border-gray-100 bg-gray-50 px-6 py-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm font-medium text-gray-700">
            {filteredUsers.length} {filteredUsers.length === 1 ? "employee" : "employees"} found
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center rounded-lg bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
          >
            <Filter size={16} className="mr-1.5 text-gray-500" />
            Filters
          </button>
        </div>

        {showFilters && (
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
            <div>
              <label htmlFor="role-filter" className="mb-1 block text-xs font-medium text-gray-700">
                Filter by Role
              </label>
              <select
                id="role-filter"
                value={filters.role}
                onChange={(e) => setFilters({ ...filters, role: e.target.value })}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-[#6148F4] focus:outline-none focus:ring-1 focus:ring-[#6148F4]/50"
              >
                <option value="">All Roles</option>
                {roles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="team-filter" className="mb-1 block text-xs font-medium text-gray-700">
                Filter by Team
              </label>
              <select
                id="team-filter"
                value={filters.team}
                onChange={(e) => setFilters({ ...filters, team: e.target.value })}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-[#6148F4] focus:outline-none focus:ring-1 focus:ring-[#6148F4]/50"
              >
                <option value="">All Teams</option>
                <option value="none">No Team</option>
                {teams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={() => setFilters({ role: "", team: "" })}
                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
              >
                Clear Filters
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 text-left">
              <th className="whitespace-nowrap px-6 py-4 text-sm font-medium uppercase tracking-wider text-gray-500">
                Employee
              </th>
              <th className="whitespace-nowrap px-6 py-4 text-sm font-medium uppercase tracking-wider text-gray-500">
                Email
              </th>
              <th className="whitespace-nowrap px-6 py-4 text-sm font-medium uppercase tracking-wider text-gray-500">
                Phone
              </th>
              <th className="whitespace-nowrap px-6 py-4 text-sm font-medium uppercase tracking-wider text-gray-500">
                Position
              </th>
              <th className="whitespace-nowrap px-6 py-4 text-sm font-medium uppercase tracking-wider text-gray-500">
                Role
              </th>
              <th className="whitespace-nowrap px-6 py-4 text-sm font-medium uppercase tracking-wider text-gray-500">
                Team
              </th>
              <th className="whitespace-nowrap px-6 py-4 text-sm font-medium uppercase tracking-wider text-gray-500">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredUsers.map((user) => (
              <tr
                key={user.id}
                className={`transition-colors ${editingId === user.id ? "bg-gray-50" : "hover:bg-gray-50"}`}
              >
                {/* Employee */}
                <td className="whitespace-nowrap px-6 py-4">
                  <div className="flex items-center">
                    <div className="h-10 w-10 flex-shrink-0">
                      {user.profile_img ? (
                        <Image
                          src={user.profile_img || "/placeholder.svg"}
                          width={40}
                          height={40}
                          alt="Profile"
                          className="h-10 w-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100">
                          <User size={20} className="text-[#6148F4]" />
                        </div>
                      )}
                    </div>
                    <div className="ml-4">
                      {editingId === user.id ? (
                        <input
                          className="w-full rounded border px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-[#6148F4]"
                          value={form.name || ""}
                          onChange={(e) => setForm({ ...form, name: e.target.value })}
                        />
                      ) : (
                        <div className="font-medium text-gray-900">{user.name}</div>
                      )}
                    </div>
                  </div>
                </td>

                {/* Email */}
                <td className="whitespace-nowrap px-6 py-4">
                  {editingId === user.id ? (
                    <input
                      className="w-full rounded border px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-[#6148F4]"
                      value={form.email || ""}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                    />
                  ) : (
                    <a href={`mailto:${user.email}`} className="text-[#6148F4] hover:underline">
                      {user.email}
                    </a>
                  )}
                </td>

                {/* Phone */}
                <td className="whitespace-nowrap px-6 py-4">
                  {editingId === user.id ? (
                    <input
                      className="w-full rounded border px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-[#6148F4]"
                      value={form.phone || ""}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    />
                  ) : (
                    <div className="text-sm text-gray-500">{user.phone || "-"}</div>
                  )}
                </td>

                {/* Position */}
                <td className="whitespace-nowrap px-6 py-4">
                  {editingId === user.id ? (
                    <input
                      className="w-full rounded border px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-[#6148F4]"
                      value={form.position || ""}
                      onChange={(e) => setForm({ ...form, position: e.target.value })}
                    />
                  ) : (
                    <div className="text-sm text-gray-900">{user.position}</div>
                  )}
                </td>

                {/* Role */}
                <td className="whitespace-nowrap px-6 py-4">
                  {editingId === user.id ? (
                    user.id === 2 ? (
                      <span className="inline-flex rounded-full bg-[#6148F4]/10 px-2 text-xs font-semibold leading-5 text-[#6148F4]">
                        {user.role?.name || "-"}
                      </span>
                    ) : (
                      <select
                        className="w-full rounded border px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-[#6148F4]"
                        value={(form.role as any)?.id || ""}
                        onChange={(e) => {
                          const selectedRole = roles.find((r) => r.id === Number(e.target.value))
                          if (selectedRole) {
                            setForm({ ...form, role: selectedRole })
                          }
                        }}
                      >
                        {roles
                          .filter((role) => [3, 4, 5].includes(role.id))
                          .map((role) => (
                            <option key={role.id} value={role.id}>
                              {role.name}
                            </option>
                          ))}
                      </select>
                    )
                  ) : (
                    <span className="inline-flex rounded-full bg-gray-100 px-2 text-xs font-semibold leading-5 text-gray-700">
                      {user.role?.name || "-"}
                    </span>
                  )}
                </td>

                {/* Team */}
                <td className="whitespace-nowrap px-6 py-4">
                  {editingId === user.id ? (
                    <div>
                      <select
                        className="w-full rounded border px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-[#6148F4]"
                        value={(form.team as any)?.id || ""}
                        onChange={(e) => {
                          const selectedTeam = teams.find((t) => t.id === Number(e.target.value))
                          setForm({ ...form, team: selectedTeam || undefined })
                        }}
                      >
                        <option value="">No Team</option>
                        {teams.map((team) => (
                          <option key={team.id} value={team.id}>
                            {team.name}
                          </option>
                        ))}
                      </select>
                      {teams.length === 0 && (
                        <div className="mt-1">
                          <a href="/teams" className="text-xs text-[#6148F4] hover:underline">
                            ➕ Create New Team
                          </a>
                        </div>
                      )}
                    </div>
                  ) : (
                    <span className="inline-flex rounded-full bg-green-50 px-2 text-xs font-semibold leading-5 text-green-700">
                      {user.team?.name || "-"}
                    </span>
                  )}
                </td>

                {/* Actions */}
                <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                  {editingId === user.id ? (
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        className="rounded bg-[#6148F4] p-1.5 text-white transition-colors hover:bg-[#5040d3]"
                        onClick={() => handleUpdate(user.id)}
                      >
                        <Check size={16} />
                      </button>
                      <button
                        className="rounded bg-gray-400 p-1.5 text-white transition-colors hover:bg-gray-500"
                        onClick={cancelEdit}
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        className="rounded bg-gray-100 p-1.5 text-gray-600 transition-colors hover:bg-gray-200"
                        onClick={() => startEdit(user)}
                      >
                        <Pencil size={16} />
                      </button>

                      {user.id !== 2 && (
                        <button
                          className="rounded bg-red-100 p-1.5 text-red-600 transition-colors hover:bg-red-200"
                          onClick={() => handleDelete(user.id)}
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredUsers.length === 0 && (
        <div className="py-12 text-center">
          <p className="text-gray-500">No employees found</p>
        </div>
      )}
    </div>
  )
}
