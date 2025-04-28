"use client"

import { Mail, UserPlus, Users, Shield } from "lucide-react"

export default function InvitedTable({ invites }: { invites: any[] }) {
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

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 text-left">
              <th className="px-6 py-4 text-sm font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-4 text-sm font-medium text-gray-500 uppercase tracking-wider">Email</th>
              <th className="px-6 py-4 text-sm font-medium text-gray-500 uppercase tracking-wider">Role</th>
              <th className="px-6 py-4 text-sm font-medium text-gray-500 uppercase tracking-wider">Team</th>
              <th className="px-6 py-4 text-sm font-medium text-gray-500 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {invites.map((invite) => (
              <tr key={invite.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center">
                      <UserPlus size={16} className="text-purple-600" />
                    </div>
                    <div className="ml-3 font-medium text-gray-900">{invite.name}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center text-sm text-gray-500">
                    <Mail size={14} className="mr-1.5 text-gray-400" />
                    {invite.email}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <Shield size={14} className="mr-1.5 text-blue-500" />
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                      {getRoleName(invite.role_id)}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {invite.team_id ? (
                    <div className="flex items-center">
                      <Users size={14} className="mr-1.5 text-green-500" />
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        {getTeamName(invite.team_id)}
                      </span>
                    </div>
                  ) : (
                    <span className="text-gray-400 text-sm">—</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                    Pending
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {invites.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No pending invitations</p>
        </div>
      )}
    </div>
  )
}
