"use client"

import { useEffect, useState } from "react"
import api from "@/lib/api"
import { toast } from "react-toastify"
import CreateTeamForm from "@/components/teams/CreateTeamForm"
import TeamTable from "@/components/teams/TeamTable"
import { Search } from "lucide-react"
import EditTeamForm from "@/components/teams/EditTeamForm"
import DeleteTeamConfirmation from "@/components/DeleteTeamConfirmation"

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
  leader_id?: number
  members?: TeamMember[]
}

export default function TeamsPage() {
  const [teams, setTeams] = useState<Team[]>([])
  const [reload, setReload] = useState(false)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null)
  const [teamToDelete, setTeamToDelete] = useState<Team | null>(null)

  // Function to load team members for a specific team
  const loadTeamMembers = async (teamId: number): Promise<TeamMember[]> => {
    try {
      const response = await api.get(`/teams/${teamId}/members`)
      return response.data || []
    } catch (error) {
      console.error(`Failed to load members for team ${teamId}:`, error)
      return []
    }
  }

  useEffect(() => {
    const fetchTeamsAndMembers = async () => {
      setLoading(true)
      try {
        // First, fetch all teams
        const teamsResponse = await api.get("/teams")
        const fetchedTeams = teamsResponse.data || []

        // Then, fetch members for each team in parallel
        const teamsWithMembers = await Promise.all(
          fetchedTeams.map(async (team: Team) => {
            // If team already has members, use them
            if (team.members && team.members.length > 0) {
              return team
            }

            // Otherwise, fetch members
            const members = await loadTeamMembers(team.id)
            return {
              ...team,
              members,
            }
          }),
        )

        setTeams(teamsWithMembers)
      } catch (error) {
        console.error("Failed to load teams:", error)
        toast.error("Failed to load teams")
        setTeams([])
      } finally {
        setLoading(false)
      }
    }

    fetchTeamsAndMembers()
  }, [reload])

  const handleRefresh = () => {
    setReload(!reload)
  }

  const handleEditTeam = async (team: Team) => {
    try {
      // Fetch team members if they're not already loaded
      if (!team.members || team.members.length === 0) {
        const members = await loadTeamMembers(team.id)
        team = {
          ...team,
          members,
        }
      }
      setSelectedTeam(team)
    } catch (error) {
      console.error("Failed to fetch team members:", error)
      toast.error("Failed to load team members")
      setSelectedTeam(team) // Still open the edit form even if members fetch fails
    }
  }

  const handleDeleteTeam = (teamId: number) => {
    const team = teams.find((t) => t.id === teamId)
    if (team) {
      setTeamToDelete(team)
    }
  }

  const filteredTeams = teams.filter(
    (team) =>
      team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      team.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      team.leader?.name.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <main className="min-h-screen bg-[#FAF9F7] p-4 text-gray-900 md:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">Team Management</h1>
            <p className="mt-1 text-gray-500">Create and manage teams in your organization</p>
          </div>

          <CreateTeamForm onSuccess={handleRefresh} />
        </div>

        {/* Search Bar - Matching the employee page design */}
        <div className="mb-6">
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search by name, description or leader..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white py-3 pl-10 pr-4 text-sm text-gray-900 shadow-sm transition-all focus:border-[#6148F4] focus:outline-none focus:ring-2 focus:ring-[#6148F4]/20"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#6148F4] border-t-transparent"></div>
          </div>
        ) : (
          <TeamTable teams={filteredTeams} onEditTeam={handleEditTeam} onDeleteTeam={handleDeleteTeam} />
        )}

        {selectedTeam && (
          <EditTeamForm team={selectedTeam} onSuccess={handleRefresh} onClose={() => setSelectedTeam(null)} />
        )}

        {teamToDelete && (
          <DeleteTeamConfirmation team={teamToDelete} onSuccess={handleRefresh} onClose={() => setTeamToDelete(null)} />
        )}
      </div>
    </main>
  )
}
