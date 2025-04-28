"use client"

import { useEffect, useState } from "react"
import api from "@/lib/api"
import { toast } from "react-toastify"
import CreateTeamForm from "@/components/CreateTeamForm"
import TeamTable from "@/components/TeamTable"
import { Search } from "lucide-react"
import EditTeamForm from "@/components/EditTeamForm"
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

  useEffect(() => {
    setLoading(true)
    api
      .get("/teams")
      .then((res) => {
        setTeams(res.data)
      })
      .catch(() => {
        toast.error("Failed to load teams")
      })
      .finally(() => {
        setLoading(false)
      })
  }, [reload])

  const handleRefresh = () => {
    setReload(!reload)
  }

  const handleEditTeam = (team: Team) => {
    setSelectedTeam(team)
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
      team.description?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <main className="p-6 md:p-8 min-h-screen bg-gray-50 text-gray-900">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Team Management</h1>
            <p className="text-gray-500 mt-1">Create and manage teams in your organization</p>
          </div>

          <CreateTeamForm onSuccess={handleRefresh} />
        </div>

        <div className="mb-6">
          <div className="relative max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={18} className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search teams..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
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
