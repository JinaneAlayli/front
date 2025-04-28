"use client"

import { useEffect, useState, FormEvent, ChangeEvent } from "react"
import api from "@/lib/api"
import { toast } from "react-toastify"
import emailjs from "@emailjs/browser"

type Invite = {
  id: number
  name: string
  email: string
  role_id: number
  team_id?: number
  token: string
}

type Team = {
  id: number
  name: string
  description?: string
}

type User = {
  id: number
  name: string
  profile_img?: string
}

export default function InviteAndTeamPage() {
  const [invites, setInvites] = useState<Invite[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [reload, setReload] = useState(false)
  const [copiedToken, setCopiedToken] = useState<string | null>(null)
  const [sendMode, setSendMode] = useState<"email" | "copy" | null>(null)

  const [inviteForm, setInviteForm] = useState({
    name: "",
    email: "",
    role_id: 4,
    team_id: undefined as number | "" | undefined,
  })

  const [teamForm, setTeamForm] = useState({
    name: "",
    description: "",
    leader_id: undefined as number | undefined,
    member_ids: [] as number[],
  })

  useEffect(() => {
    api.get("/employee-invites").then((res) => setInvites(res.data))
    api.get("/teams").then((res) => setTeams(res.data))
    api.get("/users").then((res) => setUsers(res.data))
  }, [reload])

  const handleInvite = async (e: FormEvent) => {
    e.preventDefault()
    try {
      const res = await api.post("/employee-invites", {
        ...inviteForm,
        team_id: inviteForm.team_id === "" ? undefined : inviteForm.team_id,
      })

      const { invite, link } = res.data
      if (!link) throw new Error("No link returned from server")

      if (sendMode === "copy") {
        navigator.clipboard.writeText(link)
        toast.success("Link copied to clipboard!")
      } else if (sendMode === "email") {
        const templateParams = {
          to_name: inviteForm.name,
          invite_link: link,
          to_email: inviteForm.email,
        }

        await emailjs.send(
          "service_4xquj6m",
          "template_l7kq4h9",
          templateParams,
          "li0aeRFYqDzj79DvY"
        )

        toast.success("Invite sent by email!")
      }

      setInviteForm({ name: "", email: "", role_id: 4, team_id: undefined })
      setReload((prev) => !prev)
      setSendMode(null)
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Invite failed")
    }
  }

  const handleCreateTeam = async (e: FormEvent) => {
    e.preventDefault()
    try {
      await api.post("/teams", teamForm)
      toast.success("Team created successfully!")
      setTeamForm({ name: "", description: "", leader_id: undefined, member_ids: [] })
      setReload((prev) => !prev)
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Team creation failed")
    }
  }

  return (
    <main className="bg-[#FAF9F7] min-h-screen p-10 text-[#1E293B]">
      <h1 className="text-3xl font-bold mb-6">Manage Invitations & Teams</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* Invite Form */}
        <form onSubmit={handleInvite} className="bg-white p-6 rounded-xl shadow space-y-4">
          <h2 className="text-xl font-semibold mb-2">Invite Employee</h2>
          <input
            type="text"
            placeholder="Full Name"
            className="w-full p-3 border rounded-md"
            value={inviteForm.name}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              setInviteForm({ ...inviteForm, name: e.target.value })
            }
            required
          />
          <input
            type="email"
            placeholder="Email"
            className="w-full p-3 border rounded-md"
            value={inviteForm.email}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              setInviteForm({ ...inviteForm, email: e.target.value })
            }
            required
          />
          <select
            className="w-full p-3 border rounded-md"
            value={inviteForm.role_id}
            onChange={(e: ChangeEvent<HTMLSelectElement>) =>
              setInviteForm({ ...inviteForm, role_id: parseInt(e.target.value) })
            }
          >
            <option value={4}>Employee</option>
            <option value={3}>Team Leader</option>
            <option value={2}>HR</option>
          </select>

          <select
            className="w-full p-3 border rounded-md"
            value={inviteForm.team_id ?? ""}
            onChange={(e: ChangeEvent<HTMLSelectElement>) =>
              setInviteForm({
                ...inviteForm,
                team_id: e.target.value ? parseInt(e.target.value) : undefined,
              })
            }
          >
            <option value="">Select Team (optional)</option>
            {teams.map((team) => (
              <option key={team.id} value={team.id}>
                {team.name}
              </option>
            ))}
          </select>

          <div className="flex gap-2">
            <button
              type="submit"
              onClick={() => setSendMode("email")}
              className="flex-1 bg-[#6148F4] text-white py-3 rounded-md"
            >
              Send via Email
            </button>
            <button
              type="submit"
              onClick={() => setSendMode("copy")}
              className="flex-1 bg-gray-200 text-black py-3 rounded-md"
            >
              Copy Link Only
            </button>
          </div>
        </form>

        {/* Modern Team Form */}
        <form onSubmit={handleCreateTeam} className="bg-white p-6 rounded-xl shadow space-y-5">
          <h2 className="text-xl font-semibold">Create Team</h2>

          <input
            type="text"
            placeholder="Team Name"
            className="w-full p-3 border rounded-md"
            value={teamForm.name}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              setTeamForm({ ...teamForm, name: e.target.value })
            }
            required
          />

          <textarea
            placeholder="Description (optional)"
            className="w-full p-3 border rounded-md"
            rows={2}
            value={teamForm.description}
            onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
              setTeamForm({ ...teamForm, description: e.target.value })
            }
          />

          {/* Leader dropdown */}
          <div>
            <label className="block text-sm font-medium mb-1">Team Leader</label>
            <select
              className="w-full p-3 border rounded-md"
              value={teamForm.leader_id ?? ""}
              onChange={(e) =>
                setTeamForm({ ...teamForm, leader_id: parseInt(e.target.value) })
              }
            >
              <option value="">Select a leader</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name}
                </option>
              ))}
            </select>
          </div>

          {/* Member selector */}
          <div>
            <label className="block text-sm font-medium mb-1">Team Members</label>
            <div className="max-h-60 overflow-y-auto border p-3 rounded-md space-y-2">
              {users.map((user) => (
                <label key={user.id} className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={teamForm.member_ids.includes(user.id)}
                    onChange={(e) => {
                      const selected = e.target.checked
                        ? [...teamForm.member_ids, user.id]
                        : teamForm.member_ids.filter((id) => id !== user.id)
                      setTeamForm({ ...teamForm, member_ids: selected })
                    }}
                  />
                  <img
                    src={user.profile_img || "/profile.png"}
                    alt={user.name}
                    className="w-6 h-6 rounded-full object-cover"
                  />
                  <span>{user.name}</span>
                </label>
              ))}
            </div>
          </div>

          <button type="submit" className="w-full bg-[#4ADE80] text-black py-3 rounded-md font-semibold">
            Create Team
          </button>
        </form>
      </div>

      {/* Invite & Team lists */}
      <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-10">
        <div>
          <h3 className="text-lg font-semibold mb-4">Pending Invites</h3>
          {invites.map((inv) => (
            <div key={inv.id} className="bg-white p-4 rounded shadow mb-2">
              <p>{inv.name} ({inv.email})</p>
              <p className="text-sm text-gray-500">Role ID: {inv.role_id}</p>
              {inv.team_id && <p className="text-sm text-gray-500">Team ID: {inv.team_id}</p>}
              {inv.token && (
                <div className="mt-2">
                  <input
                    type="text"
                    readOnly
                    value={`${process.env.NEXT_PUBLIC_FRONTEND_URL}/register?token=${inv.token}`}
                    className="w-full p-2 border text-sm rounded-md"
                    onClick={(e) => {
                      navigator.clipboard.writeText(e.currentTarget.value)
                      setCopiedToken(inv.token!)
                      toast.info("Copied invite link!")
                    }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-4">Existing Teams</h3>
          {teams.map((team) => (
            <div key={team.id} className="bg-white p-4 rounded shadow mb-2">
              <p className="font-medium">{team.name}</p>
              <p className="text-sm text-gray-500">{team.description || "No description"}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
