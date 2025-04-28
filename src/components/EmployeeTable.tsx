"use client"

import { useEffect, useState } from "react"
import api from "@/lib/api"
import { toast } from "react-toastify"
import { Pencil, Trash2, Check, X, User } from "lucide-react"
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

export default function EmployeeTable() {
  const [users, setUsers] = useState<Employee[]>([])
  const [roles, setRoles] = useState<{ id: number; name: string }[]>([])
  const [teams, setTeams] = useState<{ id: number; name: string }[]>([])
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState<Partial<Employee>>({})
  const [loading, setLoading] = useState(true)

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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-slate-700"></div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 text-left">
              <th className="px-6 py-4 text-sm font-medium text-gray-500 uppercase tracking-wider">Employee</th>
              <th className="px-6 py-4 text-sm font-medium text-gray-500 uppercase tracking-wider">Email</th>
              <th className="px-6 py-4 text-sm font-medium text-gray-500 uppercase tracking-wider">Phone</th>
              <th className="px-6 py-4 text-sm font-medium text-gray-500 uppercase tracking-wider">Position</th>
              <th className="px-6 py-4 text-sm font-medium text-gray-500 uppercase tracking-wider">Role</th>
              <th className="px-6 py-4 text-sm font-medium text-gray-500 uppercase tracking-wider">Team</th>
              <th className="px-6 py-4 text-sm font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user.id} className={`${editingId === user.id ? "bg-blue-50" : "hover:bg-gray-50"}`}>
                {/* Employee */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="h-10 w-10 flex-shrink-0">
                      {user.profile_img ? (
                        <Image
                          src={user.profile_img}
                          width={40}
                          height={40}
                          alt="Profile"
                          className="h-10 w-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                          <User size={20} className="text-gray-500" />
                        </div>
                      )}
                    </div>
                    <div className="ml-4">
                      {editingId === user.id ? (
                        <input
                          className="border rounded px-2 py-1 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                <td className="px-6 py-4 whitespace-nowrap">
                  {editingId === user.id ? (
                    <input
                      className="border rounded px-2 py-1 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={form.email || ""}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                    />
                  ) : (
                    <a href={`mailto:${user.email}`} className="text-blue-600 hover:underline">
                      {user.email}
                    </a>
                  )}
                </td>

                {/* Phone */}
                <td className="px-6 py-4 whitespace-nowrap">
                  {editingId === user.id ? (
                    <input
                      className="border rounded px-2 py-1 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={form.phone || ""}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    />
                  ) : (
                    <div className="text-sm text-gray-500">{user.phone || "-"}</div>
                  )}
                </td>

                {/* Position */}
                <td className="px-6 py-4 whitespace-nowrap">
                  {editingId === user.id ? (
                    <input
                      className="border rounded px-2 py-1 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={form.position || ""}
                      onChange={(e) => setForm({ ...form, position: e.target.value })}
                    />
                  ) : (
                    <div className="text-sm text-gray-900">{user.position}</div>
                  )}
                </td>

                {/* Role */}
                <td className="px-6 py-4 whitespace-nowrap">
                  {editingId === user.id ? (
                    user.id === 2 ? (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                        {user.role?.name || "-"}
                      </span>
                    ) : (
                      <select
                        className="border rounded px-2 py-1 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={(form.role as any)?.id || ""}
                        onChange={(e) => {
                          const selectedRole = roles.find(r => r.id === Number(e.target.value))
                          if (selectedRole) {
                            setForm({ ...form, role: selectedRole })
                          }
                        }}
                      >
                        {roles
                          .filter(role => [3, 4, 5].includes(role.id))
                          .map(role => (
                            <option key={role.id} value={role.id}>
                              {role.name}
                            </option>
                          ))}
                      </select>
                    )
                  ) : (
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                      {user.role?.name || "-"}
                    </span>
                  )}
                </td>

                {/* Team */}
                <td className="px-6 py-4 whitespace-nowrap">
                  {editingId === user.id ? (
                    <div>
                      <select
                        className="border rounded px-2 py-1 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={(form.team as any)?.id || ""}
                        onChange={(e) => {
                          const selectedTeam = teams.find(t => t.id === Number(e.target.value))
                          setForm({ ...form, team: selectedTeam || undefined })
                        }}
                      >
                        <option value="">No Team</option>
                        {teams.map(team => (
                          <option key={team.id} value={team.id}>
                            {team.name}
                          </option>
                        ))}
                      </select>
                      {teams.length === 0 && (
                    <>
                      <option value="">No Team</option>
                      <div className="mt-1">
                        <a href="/teams" className="text-xs text-blue-500 hover:underline">
                          ➕ Create New Team
                        </a>
                      </div>
                    </>
                  )}

                    </div>
                  ) : (
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                      {user.team?.name || "-"}
                    </span>
                  )}
                </td>

                {/* Actions */}
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  {editingId === user.id ? (
                    <>
                      <button
                        className="p-1.5 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
                        onClick={() => handleUpdate(user.id)}
                      >
                        <Check size={16} />
                      </button>
                      <button
                        className="p-1.5 bg-gray-400 text-white rounded hover:bg-gray-500 transition-colors"
                        onClick={cancelEdit}
                      >
                        <X size={16} />
                      </button>
                    </>
                  ) : (
                    <div className="flex items-center space-x-2 justify-end">
                      <button
                        className="p-1.5 bg-gray-100 text-gray-600 rounded hover:bg-gray-200 transition-colors"
                        onClick={() => startEdit(user)}
                      >
                        <Pencil size={16} />
                      </button>

                      {user.id !== 2 && (
                        <button
                          className="p-1.5 bg-red-100 text-red-600 rounded hover:bg-red-200 transition-colors"
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

      {users.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No employees found</p>
        </div>
      )}
    </div>
  )
}
