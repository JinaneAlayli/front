"use client"

import React, { useState } from "react"
import { Users, User, ChevronDown, ChevronUp, FileText, Edit, Trash2 } from "lucide-react"

interface TeamMember {
  id: number
  name: string
  position?: string
}

interface Team {
  id: number
  name: string
  description?: string
  leader?: TeamMember
  members?: TeamMember[]
}

export default function TeamTable({
  teams,
  onEditTeam,
  onDeleteTeam,
}: {
  teams: Team[]
  onEditTeam: (team: Team) => void
  onDeleteTeam: (teamId: number) => void
}) {
  const [expandedTeams, setExpandedTeams] = useState<Record<number, boolean>>({})

  const toggleTeam = (teamId: number) => {
    setExpandedTeams((prev) => ({
      ...prev,
      [teamId]: !prev[teamId],
    }))
  }

  if (!teams || teams.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100 p-8 text-center">
        <div className="flex justify-center mb-4">
          <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center">
            <Users size={32} className="text-gray-400" />
          </div>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-1">No teams found</h3>
        <p className="text-gray-500">Create your first team to get started</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 text-left">
              <th className="px-6 py-4 text-sm font-medium text-gray-500 uppercase tracking-wider">Team</th>
              <th className="px-6 py-4 text-sm font-medium text-gray-500 uppercase tracking-wider">Leader</th>
              <th className="px-6 py-4 text-sm font-medium text-gray-500 uppercase tracking-wider">Members</th>
              <th className="px-6 py-4 text-sm font-medium text-gray-500 uppercase tracking-wider">Description</th>
              <th className="px-6 py-4 text-sm font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {teams.map((team) => (
              <React.Fragment key={team.id}>
                <tr className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 flex-shrink-0 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Users size={20} className="text-blue-600" />
                      </div>
                      <div className="ml-4">
                        <div className="font-medium text-gray-900">{team.name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {team.leader ? (
                      <div className="flex items-center">
                        <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center mr-2">
                          <User size={16} className="text-gray-600" />
                        </div>
                        <span className="text-sm font-medium">{team.leader.name}</span>
                      </div>
                    ) : (
                      <span className="text-gray-400 text-sm">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {team.members && team.members.length > 0 ? (
                      <div className="flex items-center">
                        <div className="flex -space-x-2">
                          {team.members.slice(0, 3).map((member, index) => (
                            <div
                              key={member.id}
                              className="h-8 w-8 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center"
                              style={{ zIndex: 3 - index }}
                            >
                              <User size={14} className="text-gray-600" />
                            </div>
                          ))}
                        </div>
                        {team.members.length > 3 && (
                          <div className="ml-1 text-sm text-gray-500">+{team.members.length - 3}</div>
                        )}
                        <button
                          onClick={() => toggleTeam(team.id)}
                          className="ml-2 text-blue-600 hover:text-blue-800 text-sm flex items-center"
                        >
                          {expandedTeams[team.id] ? (
                            <>
                              <ChevronUp size={16} className="mr-1" />
                              Hide
                            </>
                          ) : (
                            <>
                              <ChevronDown size={16} className="mr-1" />
                              View all
                            </>
                          )}
                        </button>
                      </div>
                    ) : (
                      <span className="text-gray-400 text-sm">No members</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <FileText size={16} className="text-gray-400 mr-2" />
                      <span className="text-sm text-gray-500 line-clamp-2">
                        {team.description || "No description provided"}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button className="text-blue-600 hover:text-blue-900 mr-3" onClick={() => onEditTeam(team)}>
                      <span className="flex items-center">
                        <Edit size={16} className="mr-1" />
                        Edit
                      </span>
                    </button>
                    <button className="text-red-600 hover:text-red-900" onClick={() => onDeleteTeam(team.id)}>
                      <span className="flex items-center">
                        <Trash2 size={16} className="mr-1" />
                        Delete
                      </span>
                    </button>
                  </td>
                </tr>
                {expandedTeams[team.id] && team.members && team.members.length > 0 && (
                  <tr className="bg-gray-50">
                    <td colSpan={5} className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-500 mb-2">Team Members</div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {team.members.map((member) => (
                          <div key={member.id} className="flex items-center bg-white p-2 rounded-md">
                            <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center mr-2">
                              <User size={16} className="text-gray-600" />
                            </div>
                            <div>
                              <div className="text-sm font-medium">{member.name}</div>
                              {member.position && <div className="text-xs text-gray-500">{member.position}</div>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
