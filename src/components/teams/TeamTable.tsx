"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Users, User, FileText, Edit, Trash2, Filter, ChevronDown, X, Search } from "lucide-react"
import { useSelector } from "react-redux"
import type { RootState } from "@/lib/redux/store"

interface TeamMember {
  id: number
  name: string
  position?: string
  email?: string
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
  const [filteredTeams, setFilteredTeams] = useState<Team[]>(teams)
  const [showFilters, setShowFilters] = useState(false)
  const [expandedTeam, setExpandedTeam] = useState<number | null>(null)
  const [memberSearchTerm, setMemberSearchTerm] = useState("")
  const [popoverPosition, setPopoverPosition] = useState({ top: 0, left: 0 })
  const [filters, setFilters] = useState({
    leader: "",
    memberCount: "",
  })
  const user = useSelector((state: RootState) => state.auth.user)
  const memberPopoverRef = useRef<HTMLDivElement>(null)
  const buttonRefs = useRef<{ [key: number]: HTMLButtonElement | null }>({})

  // Close member popover when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (memberPopoverRef.current && !memberPopoverRef.current.contains(event.target as Node)) {
        setExpandedTeam(null)
        setMemberSearchTerm("")
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  // Get unique leaders for filter dropdown
  const leaders = Array.from(new Set(teams.filter((team) => team.leader).map((team) => team.leader?.id)))
    .map((leaderId) => {
      const team = teams.find((t) => t.leader?.id === leaderId)
      return team?.leader
    })
    .filter(Boolean) as TeamMember[]

  // Apply filters when they change or when teams change
  useEffect(() => {
    let result = [...teams]

    // Filter by leader
    if (filters.leader) {
      result = result.filter((team) =>
        filters.leader === "none" ? !team.leader : team.leader?.id.toString() === filters.leader,
      )
    }

    // Filter by member count
    if (filters.memberCount) {
      switch (filters.memberCount) {
        case "0":
          result = result.filter((team) => !team.members || team.members.length === 0)
          break
        case "1-5":
          result = result.filter((team) => team.members && team.members.length >= 1 && team.members.length <= 5)
          break
        case "6-10":
          result = result.filter((team) => team.members && team.members.length >= 6 && team.members.length <= 10)
          break
        case "10+":
          result = result.filter((team) => team.members && team.members.length > 10)
          break
      }
    }

    setFilteredTeams(result)
  }, [teams, filters])

  // Function to set button ref
  const setButtonRef = (teamId: number, element: HTMLButtonElement | null) => {
    buttonRefs.current[teamId] = element
  }

  // Function to toggle member popover
  const toggleMemberPopover = (teamId: number, e: React.MouseEvent) => {
    e.stopPropagation()

    if (expandedTeam === teamId) {
      setExpandedTeam(null)
      setMemberSearchTerm("")
      return
    }

    // Get button position for popover placement
    const button = buttonRefs.current[teamId]
    if (button) {
      const rect = button.getBoundingClientRect()
      const scrollTop = window.scrollY || document.documentElement.scrollTop

      // Position the popover below the button
      setPopoverPosition({
        top: rect.bottom + scrollTop,
        left: Math.max(10, rect.left - 150), // Ensure it's not off-screen to the left
      })
    }

    setExpandedTeam(teamId)
    setMemberSearchTerm("")
  }

  // Function to filter members based on search term
  const getFilteredMembers = (members: TeamMember[] = []) => {
    if (!memberSearchTerm) return members
    return members.filter(
      (member) =>
        member.name.toLowerCase().includes(memberSearchTerm.toLowerCase()) ||
        member.position?.toLowerCase().includes(memberSearchTerm.toLowerCase()) ||
        member.email?.toLowerCase().includes(memberSearchTerm.toLowerCase()),
    )
  }

  // Function to get member distribution by department/position
  const getMemberDistribution = (members: TeamMember[] = []) => {
    const positions = members.reduce(
      (acc, member) => {
        const position = member.position || "Unassigned"
        acc[position] = (acc[position] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    return Object.entries(positions)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
  }

  if (!teams || teams.length === 0) {
    return (
      <div className="overflow-hidden rounded-xl border border-gray-100 bg-white p-8 text-center shadow-sm">
        <div className="mb-4 flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#6148F4]/10">
            <Users size={32} className="text-[#6148F4]" />
          </div>
        </div>
        <h3 className="mb-1 text-lg font-medium text-gray-900">No teams found</h3>
        <p className="text-gray-500">Create your first team to get started</p>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
      {/* Filters */}
      <div className="border-b border-gray-100 bg-gray-50 px-6 py-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm font-medium text-gray-700">
            {filteredTeams.length} {filteredTeams.length === 1 ? "team" : "teams"} found
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
              <label htmlFor="leader-filter" className="mb-1 block text-xs font-medium text-gray-700">
                Filter by Leader
              </label>
              <select
                id="leader-filter"
                value={filters.leader}
                onChange={(e) => setFilters({ ...filters, leader: e.target.value })}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-[#6148F4] focus:outline-none focus:ring-1 focus:ring-[#6148F4]/50"
              >
                <option value="">All Leaders</option>
                <option value="none">No Leader</option>
                {leaders.map((leader) => (
                  <option key={leader.id} value={leader.id}>
                    {leader.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="member-count-filter" className="mb-1 block text-xs font-medium text-gray-700">
                Filter by Member Count
              </label>
              <select
                id="member-count-filter"
                value={filters.memberCount}
                onChange={(e) => setFilters({ ...filters, memberCount: e.target.value })}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-[#6148F4] focus:outline-none focus:ring-1 focus:ring-[#6148F4]/50"
              >
                <option value="">All Teams</option>
                <option value="0">No Members</option>
                <option value="1-5">1-5 Members</option>
                <option value="6-10">6-10 Members</option>
                <option value="10+">10+ Members</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={() => setFilters({ leader: "", memberCount: "" })}
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
                Team
              </th>
              <th className="whitespace-nowrap px-6 py-4 text-sm font-medium uppercase tracking-wider text-gray-500">
                Leader
              </th>
              <th className="whitespace-nowrap px-6 py-4 text-sm font-medium uppercase tracking-wider text-gray-500">
                Members
              </th>
              <th className="whitespace-nowrap px-6 py-4 text-sm font-medium uppercase tracking-wider text-gray-500">
                Description
              </th>
              <th className="whitespace-nowrap px-6 py-4 text-sm font-medium uppercase tracking-wider text-gray-500">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredTeams.map((team) => (
              <tr key={team.id} className="transition-colors hover:bg-gray-50">
                <td className="whitespace-nowrap px-6 py-4">
                  <div className="flex items-center">
                    <div className="ml-4">
                      <div className="font-medium text-gray-900">{team.name}</div>
                    </div>
                  </div>
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  {team.leader ? (
                    <div className="flex items-center">
                      <div className="mr-2 flex h-8 w-8 items-center justify-center rounded-full bg-[#6148F4]/10">
                        <User size={16} className="text-[#6148F4]" />
                      </div>
                      <span className="text-sm font-medium">{team.leader.name}</span>
                    </div>
                  ) : (
                    <span className="text-sm text-gray-400">—</span>
                  )}
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  {team.members && team.members.length > 0 ? (
                    <div className="relative flex items-center">
                      {/* Member stats */}
                      <div className="flex items-center">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#6148F4]/10">
                          <Users size={16} className="text-[#6148F4]" />
                        </div>
                        <div className="ml-3">
                          <div className="flex items-center">
                            <span className="text-sm font-medium text-gray-900">{team.members.length}</span>
                            <span className="ml-1 text-xs text-gray-500">
                              {team.members.length === 1 ? "member" : "members"}
                            </span>
                          </div>

                          {/* Distribution by position (if available) */}
                          {team.members.some((m) => m.position) && (
                            <div className="flex flex-wrap gap-1 text-xs text-gray-500">
                              {getMemberDistribution(team.members).map(([position, count], index) => (
                                <span key={position} className="whitespace-nowrap">
                                  {index > 0 && "• "}
                                  {count} {position}
                                </span>
                              ))}
                              {Object.keys(
                                team.members.reduce(
                                  (acc, m) => {
                                    const pos = m.position || "Unassigned"
                                    acc[pos] = true
                                    return acc
                                  },
                                  {} as Record<string, boolean>,
                                ),
                              ).length > 3 && "..."}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* View members button */}
                      <button
                        ref={(el) => setButtonRef(team.id, el)}
                        className="ml-2 rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                        title="View all members"
                        onClick={(e) => toggleMemberPopover(team.id, e)}
                      >
                        <ChevronDown size={16} className={expandedTeam === team.id ? "rotate-180 transform" : ""} />
                      </button>
                    </div>
                  ) : (
                    <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700">
                      No members
                    </span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    <FileText size={16} className="mr-2 text-gray-400" />
                    <span className="line-clamp-2 text-sm text-gray-500">
                      {team.description || "No description provided"}
                    </span>
                  </div>
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                  <div className="flex items-center justify-end space-x-2">
                    {user?.role_id === 2 && ( // Only HR role can edit and delete
                      <>
                        <button
                          className="flex items-center rounded-md bg-gray-100 px-2.5 py-1.5 text-sm text-gray-700 transition-colors hover:bg-gray-200"
                          onClick={() => onEditTeam(team)}
                        >
                          <Edit size={14} className="mr-1" />
                          Edit
                        </button>
                        <button
                          className="flex items-center rounded-md bg-red-50 px-2.5 py-1.5 text-sm text-red-600 transition-colors hover:bg-red-100"
                          onClick={() => onDeleteTeam(team.id)}
                        >
                          <Trash2 size={14} className="mr-1" />
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Fixed position member popover */}
      {expandedTeam !== null && (
        <div
          ref={memberPopoverRef}
          className="fixed z-50 w-80 rounded-lg border border-gray-200 bg-white p-4 shadow-lg"
          style={{
            top: `${popoverPosition.top}px`,
            left: `${popoverPosition.left}px`,
            maxHeight: "80vh",
            overflowY: "auto",
          }}
        >
          <div className="mb-3 flex items-center justify-between">
            <h4 className="text-sm font-medium text-gray-900">
              Team Members ({filteredTeams.find((t) => t.id === expandedTeam)?.members?.length || 0})
            </h4>
            <button
              className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              onClick={() => setExpandedTeam(null)}
            >
              <X size={16} />
            </button>
          </div>

          {/* Search members */}
          <div className="mb-3 flex items-center rounded-md border border-gray-200 bg-gray-50 px-2">
            <Search size={16} className="text-gray-400" />
            <input
              type="text"
              placeholder="Search members..."
              value={memberSearchTerm}
              onChange={(e) => setMemberSearchTerm(e.target.value)}
              className="w-full bg-transparent py-2 pl-2 text-sm focus:outline-none"
            />
          </div>

          {/* Member list */}
          <div className="max-h-60 overflow-y-auto">
            {expandedTeam !== null &&
            filteredTeams.find((t) => t.id === expandedTeam)?.members &&
            getFilteredMembers(filteredTeams.find((t) => t.id === expandedTeam)?.members).length > 0 ? (
              <div className="space-y-2">
                {getFilteredMembers(filteredTeams.find((t) => t.id === expandedTeam)?.members).map((member) => (
                  <div key={member.id} className="flex items-center justify-between rounded-md p-2 hover:bg-gray-50">
                    <div className="flex items-center">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#6148F4]/10 text-xs font-medium text-[#6148F4]">
                        {member.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="ml-2">
                        <div className="text-sm font-medium text-gray-900">{member.name}</div>
                        <div className="text-xs text-gray-500">{member.position || "No position"}</div>
                      </div>
                    </div>
                    {member.email && (
                      <a
                        href={`mailto:${member.email}`}
                        className="text-xs text-[#6148F4] hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Contact
                      </a>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-4 text-center text-sm text-gray-500">No members match your search</div>
            )}
          </div>

          {/* View all button */}
          <div className="mt-3 text-center">
            <button
              className="text-sm font-medium text-[#6148F4] hover:underline"
              onClick={(e) => {
                e.stopPropagation()
                const team = filteredTeams.find((t) => t.id === expandedTeam)
                if (team) {
                  setExpandedTeam(null)
                  onEditTeam(team)
                }
              }}
            >
              Manage Team Members
            </button>
          </div>
        </div>
      )}

      {filteredTeams.length === 0 && (
        <div className="py-12 text-center">
          <p className="text-gray-500">No teams match your filters</p>
        </div>
      )}
    </div>
  )
}
  