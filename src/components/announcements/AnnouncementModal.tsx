"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { toast } from "react-toastify"
import api from "@/lib/api"
import { useSelector } from "react-redux"
import type { RootState } from "@/lib/redux/store"
import { X, Save, Megaphone, Users } from "lucide-react"

interface AnnouncementModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  announcement?: {
    id: number
    title: string
    content: string
    team_id: number | null
  } | null
}

export default function AnnouncementModal({ isOpen, onClose, onSuccess, announcement }: AnnouncementModalProps) {
  const user = useSelector((state: RootState) => state.auth.user)
  const [teams, setTeams] = useState<{ id: number; name: string }[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [form, setForm] = useState({
    title: "",
    content: "",
    team_id: null as number | null,
  })

  useEffect(() => {
    if (isOpen) {
      // Reset form when modal opens
      setForm({
        title: announcement?.title || "",
        content: announcement?.content || "",
        team_id: announcement?.team_id || null,
      })

      // Fetch teams if user is owner or HR
      if (user && [2, 3].includes(user.role_id)) {
        setIsLoading(true)
        api
          .get("/teams")
          .then((res) => {
            setTeams(res.data)
          })
          .catch(() => {
            toast.error("Failed to load teams")
          })
          .finally(() => {
            setIsLoading(false)
          })
      }
    }
  }, [isOpen, announcement, user])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!form.title.trim()) {
      toast.error("Title is required")
      return
    }

    if (!form.content.trim()) {
      toast.error("Content is required")
      return
    }

    setIsSubmitting(true)

    try {
      if (announcement) {
        // Update existing announcement
        await api.patch(`/announcements/${announcement.id}`, form)
        toast.success("Announcement updated successfully")
      } else {
        // Create new announcement
        await api.post("/announcements", form)
        toast.success("Announcement created successfully")
      }
      onSuccess()
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to save announcement")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setForm({
      ...form,
      [name]: name === "team_id" ? (value === "" ? null : Number(value)) : value,
    })
  }

  if (!isOpen) return null

  const isTeamLeader = user?.role_id === 4
  const isOwnerOrHR = user && [2, 3].includes(user.role_id)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-xl bg-white shadow-xl animate-in fade-in zoom-in duration-200">
        <div className="relative bg-[#6148F4] px-6 py-4 text-white">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/20"
            aria-label="Close"
          >
            <X size={18} />
          </button>
          <h2 className="text-xl font-semibold">{announcement ? "Edit Announcement" : "Create New Announcement"}</h2>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-64px)]">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="title" className="mb-1.5 block text-sm font-medium text-gray-700">
                Title *
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Megaphone size={18} className="text-gray-400" />
                </div>
                <input
                  type="text"
                  id="title"
                  name="title"
                  placeholder="Announcement title"
                  value={form.title}
                  onChange={handleChange}
                  className="block w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-3 shadow-sm transition-all focus:border-[#6148F4] focus:outline-none focus:ring-2 focus:ring-[#6148F4]/20"
                  required
                />
              </div>
            </div>

            {/* Team Selection - Only for Owner/HR */}
            {isOwnerOrHR && (
              <div>
                <label htmlFor="team_id" className="mb-1.5 block text-sm font-medium text-gray-700">
                  Audience
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Users size={18} className="text-gray-400" />
                  </div>
                  <select
                    id="team_id"
                    name="team_id"
                    value={form.team_id === null ? "" : form.team_id}
                    onChange={handleChange}
                    className="block w-full appearance-none rounded-lg border border-gray-300 bg-white py-2.5 pl-10 pr-10 shadow-sm transition-all focus:border-[#6148F4] focus:outline-none focus:ring-2 focus:ring-[#6148F4]/20"
                  >
                    <option value="">Company-wide</option>
                    {teams.map((team) => (
                      <option key={team.id} value={team.id}>
                        {team.name} Team
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                    <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  {form.team_id === null
                    ? "This announcement will be visible to all employees"
                    : "This announcement will only be visible to the selected team"}
                </p>
              </div>
            )}

            {/* Team Leaders can only post to their team */}
            {isTeamLeader && (
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Audience</label>
                <div className="flex items-center space-x-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#6148F4]/10">
                    <Users size={18} className="text-[#6148F4]" />
                  </div>
                  <span className="text-sm text-gray-700">{user?.team?.name || "Your Team"} (Team announcement)</span>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  As a team leader, you can only create announcements for your team
                </p>
              </div>
            )}

            <div>
              <label htmlFor="content" className="mb-1.5 block text-sm font-medium text-gray-700">
                Content *
              </label>
              <textarea
                id="content"
                name="content"
                placeholder="Write your announcement here..."
                value={form.content}
                onChange={handleChange}
                rows={6}
                className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 shadow-sm transition-all focus:border-[#6148F4] focus:outline-none focus:ring-2 focus:ring-[#6148F4]/20"
                required
              />
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex w-full items-center justify-center rounded-lg bg-[#6148F4] px-4 py-2.5 text-white transition-colors hover:bg-[#5040d3] focus:outline-none focus:ring-2 focus:ring-[#6148F4]/50 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSubmitting ? (
                  <>
                    <svg
                      className="-ml-1 mr-2 h-4 w-4 animate-spin text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    {announcement ? "Updating..." : "Creating..."}
                  </>
                ) : (
                  <>
                    <Save size={18} className="mr-2" />
                    {announcement ? "Update Announcement" : "Create Announcement"}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
