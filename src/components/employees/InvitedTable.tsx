"use client"

import { useState, useEffect } from "react"
import {
  Mail,
  Trash2,
  LinkIcon,
  Copy,
  ExternalLink,
  CheckCircle,
  Clock,
  AlertTriangle,
  Calendar,
  Filter,
} from "lucide-react"
import api from "@/lib/api"
import { toast } from "react-toastify"

type InviteStatus = "all" | "pending" | "done" | "expired"

export default function InvitedTable({ invites, onInviteDeleted }: { invites: any[]; onInviteDeleted?: () => void }) {
  const [loading, setLoading] = useState<number | null>(null)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [showLinkFor, setShowLinkFor] = useState<number | null>(null)
  const [statusFilter, setStatusFilter] = useState<InviteStatus>("all")
  const [showFilters, setShowFilters] = useState(false)

  // Fetch current user on component mount
  useEffect(() => {
    api
      .get("/auth/me")
      .then((res) => setCurrentUser(res.data))
      .catch((err) => console.error("Failed to fetch current user", err))
  }, [])

  // Function to get role name from ID
  const getRoleName = (roleId: number) => {
    switch (roleId) {
      case 3:
        return "HR Manager"
      case 4:
        return "Team Leader"
      case 5:
        return "Employee"
      default:
        return `Role ${roleId}`
    }
  }

  // Function to get team name from ID (placeholder)
  const getTeamName = (teamId: number | null) => {
    if (!teamId) return null
    return `Team ${teamId}`
  }

  // Check if current user can delete invitations
  const canDelete = () => {
    return currentUser && [1, 2, 3].includes(currentUser.id)
  }

  // Check if invitation is expired
  const isExpired = (invite: any) => {
    return new Date(invite.expires_at) < new Date()
  }

  // Format date to readable format
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  // Filter invites based on status
  const filteredInvites = invites.filter((invite) => {
    if (statusFilter === "all") return true
    if (statusFilter === "pending") return !invite.accepted && !isExpired(invite)
    if (statusFilter === "done") return invite.accepted
    // Fixed: Only show expired invitations that haven't been accepted yet
    if (statusFilter === "expired") return isExpired(invite) && !invite.accepted
    return true
  })

  // Count invites by status - also update the counts to match the new filter logic
  const pendingCount = invites.filter((invite) => !invite.accepted && !isExpired(invite)).length
  const doneCount = invites.filter((invite) => invite.accepted).length
  // Update expired count to only count those that are expired but not accepted
  const expiredCount = invites.filter((invite) => isExpired(invite) && !invite.accepted).length

  // Handle invitation deletion
  const handleDelete = async (id: number) => {
    if (!canDelete()) {
      toast.error("You don't have permission to delete invitations")
      return
    }

    setLoading(id)
    try {
      // Call the backend API directly
      await api.delete(`/employee-invites/${id}`)
      toast.success("Invitation cancelled successfully")

      // Call the callback function if provided
      if (onInviteDeleted) {
        onInviteDeleted()
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to cancel invitation")
    } finally {
      setLoading(null)
    }
  }

  // Copy registration link to clipboard
  const copyLink = (link: string) => {
    navigator.clipboard.writeText(link)
    toast.success("Registration link copied to clipboard")
  }

  // Generate registration link from token
  const getRegistrationLink = (token: string) => {
    return `${process.env.NEXT_PUBLIC_FRONTEND_URL || window.location.origin}/register?token=${token}`
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
      {/* Filters Header */}
      <div className="border-b border-gray-100 bg-gray-50 px-6 py-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm font-medium text-gray-700">
            {filteredInvites.length} {filteredInvites.length === 1 ? "invitation" : "invitations"} found
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
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              onClick={() => setStatusFilter("all")}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                statusFilter === "all" ? "bg-[#6148F4] text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              All Invitations ({invites.length})
            </button>
            <button
              onClick={() => setStatusFilter("pending")}
              className={`flex items-center rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                statusFilter === "pending"
                  ? "bg-amber-500 text-white"
                  : "bg-amber-100 text-amber-800 hover:bg-amber-200"
              }`}
            >
              <Clock size={14} className="mr-1.5" />
              Pending ({pendingCount})
            </button>
            <button
              onClick={() => setStatusFilter("done")}
              className={`flex items-center rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                statusFilter === "done" ? "bg-green-500 text-white" : "bg-green-100 text-green-800 hover:bg-green-200"
              }`}
            >
              <CheckCircle size={14} className="mr-1.5" />
              Done ({doneCount})
            </button>
            <button
              onClick={() => setStatusFilter("expired")}
              className={`flex items-center rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                statusFilter === "expired" ? "bg-red-500 text-white" : "bg-red-100 text-red-800 hover:bg-red-200"
              }`}
            >
              <AlertTriangle size={14} className="mr-1.5" />
              Expired ({expiredCount})
            </button>
          </div>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 text-left">
              <th className="whitespace-nowrap px-6 py-4 text-sm font-medium uppercase tracking-wider text-gray-500">
                Email
              </th>
              <th className="whitespace-nowrap px-6 py-4 text-sm font-medium uppercase tracking-wider text-gray-500">
                Role
              </th>
              <th className="whitespace-nowrap px-6 py-4 text-sm font-medium uppercase tracking-wider text-gray-500">
                Team
              </th>
              <th className="whitespace-nowrap px-6 py-4 text-sm font-medium uppercase tracking-wider text-gray-500">
                Status
              </th>
              <th className="whitespace-nowrap px-6 py-4 text-sm font-medium uppercase tracking-wider text-gray-500">
                Expires At
              </th>
              <th className="whitespace-nowrap px-6 py-4 text-sm font-medium uppercase tracking-wider text-gray-500">
                Registration Link
              </th>
              {canDelete() && (
                <th className="whitespace-nowrap px-6 py-4 text-sm font-medium uppercase tracking-wider text-gray-500">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredInvites.map((invite) => (
              <tr key={invite.id} className="transition-colors hover:bg-gray-50">
                <td className="whitespace-nowrap px-6 py-4">
                  <div className="flex items-center text-sm">
                    <Mail size={14} className="mr-1.5 text-gray-400" />
                    <a href={`mailto:${invite.email}`} className="text-[#6148F4] hover:underline">
                      {invite.email}
                    </a>
                  </div>
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  <span className="inline-flex rounded-full bg-gray-100 px-2 text-xs font-semibold leading-5 text-gray-700">
                    {getRoleName(invite.role_id)}
                  </span>
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  {invite.team_id ? (
                    <span className="inline-flex rounded-full bg-green-50 px-2 text-xs font-semibold leading-5 text-green-700">
                      {getTeamName(invite.team_id)}
                    </span>
                  ) : (
                    <span className="text-sm text-gray-400">—</span>
                  )}
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  {invite.accepted ? (
                    <div className="flex items-center">
                      <CheckCircle size={14} className="mr-1.5 text-green-500" />
                      <span className="inline-flex rounded-full bg-green-100 px-2 text-xs font-semibold leading-5 text-green-800">
                        Done
                      </span>
                    </div>
                  ) : isExpired(invite) ? (
                    <div className="flex items-center">
                      <AlertTriangle size={14} className="mr-1.5 text-red-500" />
                      <span className="inline-flex rounded-full bg-red-100 px-2 text-xs font-semibold leading-5 text-red-800">
                        Expired
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <Clock size={14} className="mr-1.5 text-amber-500" />
                      <span className="inline-flex rounded-full bg-amber-100 px-2 text-xs font-semibold leading-5 text-amber-800">
                        Pending
                      </span>
                    </div>
                  )}
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  <div className="flex items-center text-sm text-gray-500">
                    <Calendar size={14} className="mr-1.5 text-gray-400" />
                    {formatDate(invite.expires_at)}
                  </div>
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  {!isExpired(invite) ? (
                    <div className="flex items-center">
                      {showLinkFor === invite.id ? (
                        <div className="flex items-center space-x-2">
                          <input
                            type="text"
                            value={getRegistrationLink(invite.token)}
                            readOnly
                            className="w-48 rounded-md border border-gray-300 px-2 py-1 text-xs"
                          />
                          <button
                            onClick={() => copyLink(getRegistrationLink(invite.token))}
                            className="rounded-full p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                            aria-label="Copy link"
                          >
                            <Copy size={14} />
                          </button>
                          <button
                            onClick={() => setShowLinkFor(null)}
                            className="rounded-full p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                            aria-label="Hide link"
                          >
                            <ExternalLink size={14} />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setShowLinkFor(invite.id)}
                          className="flex items-center text-[#6148F4] hover:underline"
                        >
                          <LinkIcon size={14} className="mr-1" />
                          <span className="text-xs">View Link</span>
                        </button>
                      )}
                    </div>
                  ) : (
                    <span className="text-sm text-gray-400">—</span>
                  )}
                </td>
                {canDelete() && (
                  <td className="whitespace-nowrap px-6 py-4 text-right">
                    <button
                      onClick={() => handleDelete(invite.id)}
                      disabled={loading === invite.id}
                      className="rounded bg-red-100 p-1.5 text-red-600 transition-colors hover:bg-red-200 disabled:opacity-50"
                      aria-label="Cancel invitation"
                    >
                      {loading === invite.id ? (
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-red-500 border-t-transparent"></div>
                      ) : (
                        <Trash2 size={16} />
                      )}
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredInvites.length === 0 && (
        <div className="py-12 text-center">
          {statusFilter === "expired" ? (
            <p className="text-gray-500">No expired invitations yet</p>
          ) : statusFilter === "pending" ? (
            <p className="text-gray-500">No pending invitations</p>
          ) : statusFilter === "done" ? (
            <p className="text-gray-500">No completed invitations</p>
          ) : (
            <p className="text-gray-500">No invitations found</p>
          )}
        </div>
      )}
    </div>
  )
}
