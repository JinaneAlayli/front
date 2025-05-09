"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "react-toastify"
import { Search, Edit, Trash2, Filter, X, Mail, Phone, Shield, Key } from "lucide-react"
import api from "@/lib/api"
import { useSelector } from "react-redux"
import type { RootState } from "@/lib/redux/store"
import RoleGuard from "@/components/RoleGuard"
interface UserData {
  id: number
  name: string
  email: string
  role_id: number
  company_id?: number
  team_id?: number
  phone?: string
  profile_img?: string
  role?: {
    id: number
    name: string
  }
  team?: {
    id: number
    name: string
  }
  company?: {
    id: number
    name: string
  }
}

// Role mapping
const ROLE_NAMES: Record<number, string> = {
  1: "Platform Owner (Superadmin)",
  2: "Companies Owner",
  3: "HR",
  4: "Team Leader",
  5: "Employee",
}

export default function UsersPage() {
  const [users, setUsers] = useState<UserData[]>([])
  const [filteredUsers, setFilteredUsers] = useState<UserData[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [showFilters, setShowFilters] = useState(false)
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null)
  const [userToDelete, setUserToDelete] = useState<UserData | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showPasswordResetModal, setShowPasswordResetModal] = useState(false)
  const [filters, setFilters] = useState({
    role: "",
    team: "",
  })
  const router = useRouter()
  const currentUser = useSelector((state: RootState) => state.auth.user)

    
  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true)
      try {
        const response = await api.get("/users")
        setUsers(response.data || [])
      } catch (error) {
        console.error("Failed to load users:", error)
        toast.error("Failed to load users")
        setUsers([])
      } finally {
        setLoading(false)
      }
    }

    if (currentUser?.role_id === 1) {
      fetchUsers()
    }
  }, [currentUser])
 
  useEffect(() => {
    let result = [...users]
 
    if (searchTerm) {
      result = result.filter(
        (user) =>
          user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          ROLE_NAMES[user.role_id]?.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }
 
    if (filters.role) {
      result = result.filter((user) => user.role_id.toString() === filters.role)
    }
 
    if (filters.team) {
      result = result.filter((user) =>
        filters.team === "none" ? !user.team_id : user.team_id?.toString() === filters.team,
      )
    }

    setFilteredUsers(result)
  }, [users, searchTerm, filters])
 
  const roles = Object.entries(ROLE_NAMES).map(([id, name]) => ({
    id: Number.parseInt(id),
    name,
  }))

  const teams = Array.from(new Set(users.filter((user) => user.team_id).map((user) => user.team_id)))
    .filter((teamId): teamId is number => teamId !== undefined)
    .map((teamId) => {
      const user = users.find((u) => u.team_id === teamId)
      return {
        id: teamId,
        name: user?.team?.name || `Team ${teamId}`,
      }
    })

  const handleEditUser = (user: UserData) => {
    setSelectedUser(user)
    setShowEditModal(true)
  }

  const handleDeleteUser = (user: UserData) => {
    setUserToDelete(user)
    setShowDeleteModal(true)
  }

  const handleResetPassword = (user: UserData) => {
    setSelectedUser(user)
    setShowPasswordResetModal(true)
  }

  const confirmDeleteUser = async () => {
    if (!userToDelete) return

    try {
      await api.delete(`/users/${userToDelete.id}`)
      toast.success("User deleted successfully")
      setUsers(users.filter((user) => user.id !== userToDelete.id))
      setShowDeleteModal(false)
      setUserToDelete(null)
    } catch (error) {
      console.error("Failed to delete user:", error)
      toast.error("Failed to delete user")
    }
  }

  const handleUpdateUser = async (updatedData: Partial<UserData>) => {
    if (!selectedUser) return

    try {
      const response = await api.patch(`/users/${selectedUser.id}`, updatedData)
      toast.success("User updated successfully")

      // Update the user in the local state
      setUsers(users.map((user) => (user.id === selectedUser.id ? { ...user, ...response.data } : user)))

      setShowEditModal(false)
      setSelectedUser(null)
    } catch (error) {
      console.error("Failed to update user:", error)
      toast.error("Failed to update user")
    }
  }

  const handlePasswordReset = async (password: string) => {
    if (!selectedUser) return

    try {
      await api.patch(`/users/${selectedUser.id}`, { password })
      toast.success("Password reset successfully")
      setShowPasswordResetModal(false)
      setSelectedUser(null)
    } catch (error) {
      console.error("Failed to reset password:", error)
      toast.error("Failed to reset password")
    }
  }

  

  return (
    <RoleGuard allowedRoles={[1]}>
    <main className="min-h-screen bg-[#FAF9F7] p-4 text-gray-900 md:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">User Management</h1>
            <p className="mt-1 text-gray-500">Manage all users in your organization</p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search by name, email, phone or role..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white py-3 pl-10 pr-4 text-sm text-gray-900 shadow-sm transition-all focus:border-[#6148F4] focus:outline-none focus:ring-2 focus:ring-[#6148F4]/20"
            />
          </div>
        </div>

        {/* Users Table */}
        <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
          {/* Filters */}
          <div className="border-b border-gray-100 bg-gray-50 px-6 py-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="text-sm font-medium text-gray-700">
                {filteredUsers.length} {filteredUsers.length === 1 ? "user" : "users"} found
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

          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#6148F4] border-t-transparent"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 text-left">
                    <th className="whitespace-nowrap px-6 py-4 text-sm font-medium uppercase tracking-wider text-gray-500">
                      User
                    </th>
                    <th className="whitespace-nowrap px-6 py-4 text-sm font-medium uppercase tracking-wider text-gray-500">
                      Contact
                    </th>
                    <th className="whitespace-nowrap px-6 py-4 text-sm font-medium uppercase tracking-wider text-gray-500">
                      Role
                    </th>
                    <th className="whitespace-nowrap px-6 py-4 text-sm font-medium uppercase tracking-wider text-gray-500">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredUsers.length > 0 ? (
                    filteredUsers.map((user) => (
                      <tr key={user.id} className="transition-colors hover:bg-gray-50">
                        <td className="whitespace-nowrap px-6 py-4">
                          <div className="flex items-center">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#6148F4]/10 text-sm font-medium text-[#6148F4]">
                              {user.profile_img ? (
                                <img
                                  src={user.profile_img || "/placeholder.svg"}
                                  alt={user.name}
                                  className="h-10 w-10 rounded-full object-cover"
                                />
                              ) : (
                                user.name.charAt(0).toUpperCase()
                              )}
                            </div>
                            <div className="ml-4">
                              <div className="font-medium text-gray-900">{user.name}</div>
                            </div>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          <div className="space-y-1">
                            <div className="flex items-center text-sm">
                              <Mail size={14} className="mr-2 text-gray-400" />
                              <span>{user.email}</span>
                            </div>
                            {user.phone && (
                              <div className="flex items-center text-sm">
                                <Phone size={14} className="mr-2 text-gray-400" />
                                <span>{user.phone}</span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          <div className="flex items-center">
                            <div className="mr-2 flex h-8 w-8 items-center justify-center rounded-full bg-[#6148F4]/10">
                              <Shield size={16} className="text-[#6148F4]" />
                            </div>
                            <span className="text-sm font-medium">
                              {ROLE_NAMES[user.role_id] || `Role ${user.role_id}`}
                            </span>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              className="flex items-center rounded-md bg-gray-100 px-2.5 py-1.5 text-sm text-gray-700 transition-colors hover:bg-gray-200"
                              onClick={() => handleEditUser(user)}
                            >
                              <Edit size={14} className="mr-1" />
                              Edit
                            </button>
                            <button
                              className="flex items-center rounded-md bg-amber-50 px-2.5 py-1.5 text-sm text-amber-600 transition-colors hover:bg-amber-100"
                              onClick={() => handleResetPassword(user)}
                            >
                              <Key size={14} className="mr-1" />
                              Reset Password
                            </button>
                            <button
                              className="flex items-center rounded-md bg-red-50 px-2.5 py-1.5 text-sm text-red-600 transition-colors hover:bg-red-100"
                              onClick={() => handleDeleteUser(user)}
                            >
                              <Trash2 size={14} className="mr-1" />
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                        No users found matching your criteria
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Edit User Modal */}
        {showEditModal && selectedUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
            <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-medium">Edit User</h3>
                <button
                  className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                  onClick={() => setShowEditModal(false)}
                >
                  <X size={20} />
                </button>
              </div>

              <EditUserForm
                user={selectedUser}
                onSubmit={handleUpdateUser}
                onCancel={() => setShowEditModal(false)}
                roles={roles}
                teams={teams}
              />
            </div>
          </div>
        )}

        {/* Password Reset Modal */}
        {showPasswordResetModal && selectedUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
            <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-medium">Reset Password</h3>
                <button
                  className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                  onClick={() => setShowPasswordResetModal(false)}
                >
                  <X size={20} />
                </button>
              </div>

              <PasswordResetForm
                user={selectedUser}
                onSubmit={handlePasswordReset}
                onCancel={() => setShowPasswordResetModal(false)}
              />
            </div>
          </div>
        )}

        {/* Delete User Modal */}
        {showDeleteModal && userToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
            <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-medium">Delete User</h3>
                <button
                  className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                  onClick={() => setShowDeleteModal(false)}
                >
                  <X size={20} />
                </button>
              </div>

              <div className="mb-6">
                <p className="text-gray-700">
                  Are you sure you want to delete the user <span className="font-medium">{userToDelete.name}</span>?
                  This action cannot be undone.
                </p>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
                  onClick={() => setShowDeleteModal(false)}
                >
                  Cancel
                </button>
                <button
                  className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700"
                  onClick={confirmDeleteUser}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
    </RoleGuard>
  )
}

interface EditUserFormProps {
  user: UserData
  onSubmit: (data: Partial<UserData>) => void
  onCancel: () => void
  roles: { id: number; name: string }[]
  teams: { id: number; name: string }[]
}

function EditUserForm({ user, onSubmit, onCancel, roles, teams }: EditUserFormProps) {
  const [formData, setFormData] = useState({
    name: user.name,
    email: user.email,
    phone: user.phone || "",
    role_id: user.role_id,
    team_id: user.team_id || "",
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Convert team_id to number or undefined
    const processedData = {
      ...formData,
      team_id: formData.team_id ? Number(formData.team_id) : undefined,
      role_id: Number(formData.role_id),
    }

    onSubmit(processedData)
  }

  return (
    
    <form onSubmit={handleSubmit}>
      
      <div className="space-y-4">
        <div>
          <label htmlFor="name" className="mb-1 block text-sm font-medium text-gray-700">
            Name
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-[#6148F4] focus:outline-none focus:ring-1 focus:ring-[#6148F4]/50"
          />
        </div>

        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-medium text-gray-700">
            Email
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-[#6148F4] focus:outline-none focus:ring-1 focus:ring-[#6148F4]/50"
          />
        </div>

        <div>
          <label htmlFor="phone" className="mb-1 block text-sm font-medium text-gray-700">
            Phone
          </label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-[#6148F4] focus:outline-none focus:ring-1 focus:ring-[#6148F4]/50"
          />
        </div>

        <div>
          <label htmlFor="role_id" className="mb-1 block text-sm font-medium text-gray-700">
            Role
          </label>
          <select
            id="role_id"
            name="role_id"
            value={formData.role_id}
            onChange={handleChange}
            required
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-[#6148F4] focus:outline-none focus:ring-1 focus:ring-[#6148F4]/50"
          >
            {roles.map((role) => (
              <option key={role.id} value={role.id}>
                {role.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="team_id" className="mb-1 block text-sm font-medium text-gray-700">
            Team
          </label>
          <select
            id="team_id"
            name="team_id"
            value={formData.team_id}
            onChange={handleChange}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-[#6148F4] focus:outline-none focus:ring-1 focus:ring-[#6148F4]/50"
          >
            <option value="">No Team</option>
            {teams.map((team) => (
              <option key={team.id} value={team.id}>
                {team.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-6 flex justify-end space-x-3">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="rounded-md bg-[#6148F4] px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-[#6148F4]/90"
        >
          Save Changes
        </button>
      </div>
    </form>
  )
}

interface PasswordResetFormProps {
  user: UserData
  onSubmit: (password: string) => void
  onCancel: () => void
}

function PasswordResetForm({ user, onSubmit, onCancel }: PasswordResetFormProps) {
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Validate passwords
    if (password.length < 6) {
      setError("Password must be at least 6 characters long")
      return
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    onSubmit(password)
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-4">
        <p className="text-gray-700">
          Reset password for user: <span className="font-medium">{user.name}</span>
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label htmlFor="password" className="mb-1 block text-sm font-medium text-gray-700">
            New Password
          </label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-[#6148F4] focus:outline-none focus:ring-1 focus:ring-[#6148F4]/50"
          />
        </div>

        <div>
          <label htmlFor="confirmPassword" className="mb-1 block text-sm font-medium text-gray-700">
            Confirm Password
          </label>
          <input
            type="password"
            id="confirmPassword"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-[#6148F4] focus:outline-none focus:ring-1 focus:ring-[#6148F4]/50"
          />
        </div>

        {error && <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</div>}
      </div>

      <div className="mt-6 flex justify-end space-x-3">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="rounded-md bg-[#6148F4] px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-[#6148F4]/90"
        >
          Reset Password
        </button>
      </div>
    </form>
  
  )
}
