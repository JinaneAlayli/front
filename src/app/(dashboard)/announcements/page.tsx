"use client"

import { useEffect, useState } from "react"
import { toast } from "react-toastify"
import api from "@/lib/api"
import { useSelector } from "react-redux"
import type { RootState } from "@/lib/redux/store"
import { Megaphone, Search, Plus, Filter, Edit, Trash2, Calendar, Users } from "lucide-react"
import AnnouncementModal from "@/components/announcements/AnnouncementModal"
import DeleteConfirmationModal from "@/components/DeleteConfirmationModal"

interface Announcement {
  id: number
  title: string
  content: string
  team_id: number | null
  created_at: string
  creator: {
    id: number
    name: string
    profile_img?: string
  }
}

// Helper function to format date
function formatDistanceToNow(date: Date, options?: { addSuffix: boolean }): string {
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  // Less than a minute
  if (diffInSeconds < 60) {
    return options?.addSuffix ? "just now" : "less than a minute"
  }

  // Less than an hour
  if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60)
    return options?.addSuffix
      ? `${minutes} ${minutes === 1 ? "minute" : "minutes"} ago`
      : `${minutes} ${minutes === 1 ? "minute" : "minutes"}`
  }

  // Less than a day
  if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600)
    return options?.addSuffix
      ? `${hours} ${hours === 1 ? "hour" : "hours"} ago`
      : `${hours} ${hours === 1 ? "hour" : "hours"}`
  }

  // Less than a week
  if (diffInSeconds < 604800) {
    const days = Math.floor(diffInSeconds / 86400)
    return options?.addSuffix ? `${days} ${days === 1 ? "day" : "days"} ago` : `${days} ${days === 1 ? "day" : "days"}`
  }

  // Format date as MM/DD/YYYY
  return options?.addSuffix ? `on ${date.toLocaleDateString()}` : date.toLocaleDateString()
}

export default function AnnouncementsPage() {
  const user = useSelector((state: RootState) => state.auth.user)
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [filteredAnnouncements, setFilteredAnnouncements] = useState<Announcement[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState({
    teamOnly: false,
    companyOnly: false,
    dateRange: "",
  })

  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null)
  const [deletingAnnouncement, setDeletingAnnouncement] = useState<Announcement | null>(null)
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  const fetchAnnouncements = async () => {
    setIsLoading(true)
    try {
      const response = await api.get("/announcements")
      setAnnouncements(response.data)
      setFilteredAnnouncements(response.data)
    } catch (error: any) {
      console.error("Failed to load announcements", error)

      // Handle 403 errors specifically
      if (error.response?.status === 403) {
        toast.error("You don't have permission to access announcements")
      } else {
        toast.error("Failed to load announcements")
      }

      // Set empty arrays on error
      setAnnouncements([])
      setFilteredAnnouncements([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchAnnouncements()
  }, [])

  useEffect(() => {
    let filtered = [...announcements]

    // Apply search
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (announcement) =>
          announcement.title.toLowerCase().includes(lowerSearch) ||
          announcement.content.toLowerCase().includes(lowerSearch) ||
          announcement.creator.name.toLowerCase().includes(lowerSearch),
      )
    }

    // Apply filters
    if (filters.teamOnly) {
      filtered = filtered.filter((announcement) => announcement.team_id !== null)
    }

    if (filters.companyOnly) {
      filtered = filtered.filter((announcement) => announcement.team_id === null)
    }

    if (filters.dateRange) {
      const now = new Date()
      const cutoff = new Date()

      switch (filters.dateRange) {
        case "today":
          cutoff.setDate(now.getDate() - 1)
          break
        case "week":
          cutoff.setDate(now.getDate() - 7)
          break
        case "month":
          cutoff.setMonth(now.getMonth() - 1)
          break
      }

      filtered = filtered.filter((announcement) => new Date(announcement.created_at) >= cutoff)
    }

    setFilteredAnnouncements(filtered)
  }, [announcements, searchTerm, filters])

  const handleCreateAnnouncement = () => {
    setShowCreateModal(true)
  }

  const handleEditAnnouncement = (announcement: Announcement) => {
    setEditingAnnouncement(announcement)
  }

  const handleDeleteAnnouncement = (announcement: Announcement) => {
    setDeletingAnnouncement(announcement)
  }

  const handleModalClose = () => {
    setShowCreateModal(false)
    setEditingAnnouncement(null)
  }

  const handleDeleteModalClose = () => {
    setDeletingAnnouncement(null)
  }

  const handleAnnouncementSaved = () => {
    fetchAnnouncements()
    handleModalClose()
  }

  const handleAnnouncementDeleted = () => {
    fetchAnnouncements()
    handleDeleteModalClose()
  }

  const clearFilters = () => {
    setFilters({
      teamOnly: false,
      companyOnly: false,
      dateRange: "",
    })
  }

  const canManageAnnouncements = () => {
    // Owner, HR, or Team Leader can manage announcements
    return user && [2, 3, 4].includes(user.role_id)
  }

  const isCreator = (announcement: Announcement) => {
    return user && announcement.creator.id === user.id
  }

  const canEdit = (announcement: Announcement) => {
    // Owner, HR can edit any announcement
    // Team leaders and employees can only edit their own
    return user && ([2, 3].includes(user.role_id) || isCreator(announcement))
  }

  const canDelete = (announcement: Announcement) => {
    // Same as edit permissions
    return canEdit(announcement)
  }


  return (
    <div className="flex flex-col min-h-screen">

      <main className="flex-1 bg-[#FAF9F7] p-4 md:p-6 lg:p-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">Announcements</h1>
              <p className="mt-1 text-gray-500">View and manage company and team announcements</p>
            </div>

            {canManageAnnouncements() && (
              <button
                onClick={handleCreateAnnouncement}
                className="inline-flex items-center rounded-lg bg-[#6148F4] px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#5040d3] focus:outline-none focus:ring-2 focus:ring-[#6148F4]/50 focus:ring-offset-2"
              >
                <Plus size={18} className="mr-2" />
                New Announcement
              </button>
            )}
          </div>

          {/* Search and Filters */}
          <div className="mb-6 space-y-4">
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search announcements..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white py-3 pl-10 pr-4 text-sm text-gray-900 shadow-sm transition-all focus:border-[#6148F4] focus:outline-none focus:ring-2 focus:ring-[#6148F4]/20"
              />
            </div>

            <div>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="text-sm font-medium text-gray-700">
                  {filteredAnnouncements.length} {filteredAnnouncements.length === 1 ? "announcement" : "announcements"}{" "}
                  found
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
                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-700">Scope</label>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => setFilters({ ...filters, companyOnly: !filters.companyOnly, teamOnly: false })}
                        className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
                          filters.companyOnly
                            ? "bg-[#6148F4] text-white"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        Company-wide
                      </button>
                      <button
                        onClick={() => setFilters({ ...filters, teamOnly: !filters.teamOnly, companyOnly: false })}
                        className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
                          filters.teamOnly ? "bg-[#6148F4] text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        Team only
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-700">Time Period</label>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() =>
                          setFilters({ ...filters, dateRange: filters.dateRange === "today" ? "" : "today" })
                        }
                        className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
                          filters.dateRange === "today"
                            ? "bg-[#6148F4] text-white"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        Today
                      </button>
                      <button
                        onClick={() =>
                          setFilters({ ...filters, dateRange: filters.dateRange === "week" ? "" : "week" })
                        }
                        className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
                          filters.dateRange === "week"
                            ? "bg-[#6148F4] text-white"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        Last 7 days
                      </button>
                      <button
                        onClick={() =>
                          setFilters({ ...filters, dateRange: filters.dateRange === "month" ? "" : "month" })
                        }
                        className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
                          filters.dateRange === "month"
                            ? "bg-[#6148F4] text-white"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        Last 30 days
                      </button>
                    </div>
                  </div>

                  <div className="flex items-end">
                    <button
                      onClick={clearFilters}
                      className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
                    >
                      Clear Filters
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Announcements List */}
          {isLoading ? (
            <div className="flex h-64 items-center justify-center">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#6148F4] border-t-transparent"></div>
            </div>
          ) : filteredAnnouncements.length === 0 ? (
            <div className="rounded-xl border border-gray-100 bg-white p-8 text-center shadow-sm">
              <div className="mb-4 flex justify-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#6148F4]/10">
                  <Megaphone size={32} className="text-[#6148F4]" />
                </div>
              </div>
              <h3 className="mb-1 text-lg font-medium text-gray-900">No announcements found</h3>
              <p className="text-gray-500">
                {canManageAnnouncements()
                  ? "Create your first announcement to get started"
                  : "Check back later for updates"}
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {filteredAnnouncements.map((announcement) => (
                <div
                  key={announcement.id}
                  className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm transition-all hover:shadow-md"
                >
                  <div className="border-b border-gray-100 bg-gray-50 px-6 py-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-gray-900">{announcement.title}</h3>
                      {(canEdit(announcement) || canDelete(announcement)) && (
                        <div className="flex space-x-2">
                          {canEdit(announcement) && (
                            <button
                              onClick={() => handleEditAnnouncement(announcement)}
                              className="rounded-md bg-gray-100 p-1.5 text-gray-600 transition-colors hover:bg-gray-200"
                              title="Edit announcement"
                            >
                              <Edit size={16} />
                            </button>
                          )}
                          {canDelete(announcement) && (
                            <button
                              onClick={() => handleDeleteAnnouncement(announcement)}
                              className="rounded-md bg-red-50 p-1.5 text-red-600 transition-colors hover:bg-red-100"
                              title="Delete announcement"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="mt-2 flex items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center">
                        <Calendar size={14} className="mr-1" />
                        {formatDistanceToNow(new Date(announcement.created_at), { addSuffix: true })}
                      </div>
                      <div className="flex items-center">
                        <Users size={14} className="mr-1" />
                        {announcement.team_id ? "Team Announcement" : "Company-wide"}
                      </div>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="prose prose-sm max-w-none text-gray-700">
                      {announcement.content.split("\n").map((paragraph, i) => (
                        <p key={i}>{paragraph}</p>
                      ))}
                    </div>
                    <div className="mt-4 flex items-center">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100">
                        {announcement.creator.profile_img ? (
                          <img
                            src={announcement.creator.profile_img || "/placeholder.svg"}
                            alt={announcement.creator.name}
                            className="h-8 w-8 rounded-full object-cover"
                          />
                        ) : (
                          <span className="text-xs font-medium text-gray-600">
                            {announcement.creator.name.charAt(0)}
                          </span>
                        )}
                      </div>
                      <span className="ml-2 text-sm font-medium text-gray-700">{announcement.creator.name}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Create/Edit Modal */}
      <AnnouncementModal
        isOpen={showCreateModal || !!editingAnnouncement}
        onClose={handleModalClose}
        onSuccess={handleAnnouncementSaved}
        announcement={editingAnnouncement}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={!!deletingAnnouncement}
        onClose={handleDeleteModalClose}
        onConfirm={handleAnnouncementDeleted}
        title="Delete Announcement"
        message={`Are you sure you want to delete the announcement "${deletingAnnouncement?.title}"? This action cannot be undone.`}
        itemId={deletingAnnouncement?.id}
        endpoint="/announcements"
      />
    </div>
  )
}
