"use client"

import { useState, useEffect } from "react"
import { BellRing, ArrowRight } from "lucide-react"
import Link from "next/link"

export default function DashboardAnnouncements() {
  const [announcements, setAnnouncements] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAnnouncements = async () => {
      setLoading(true)
      try {
        // In a real implementation, you would fetch announcements from your API
        // For now, we'll just set an empty array since there's no endpoint
        setAnnouncements([])
      } catch (error) {
        console.error("Failed to fetch announcements:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchAnnouncements()
  }, [])

  return (
    <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-gray-100 bg-[#6148F4]/5 px-6 py-4">
        <h2 className="text-lg font-medium text-gray-900">Announcements</h2>
        <Link href="/announcements" className="text-sm font-medium text-[#6148F4] hover:underline">
          View All
        </Link>
      </div>

      <div className="p-6">
        {loading ? (
          <div className="flex h-40 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#6148F4] border-t-transparent"></div>
          </div>
        ) : announcements.length === 0 ? (
          <div className="flex h-40 flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50 p-6 text-center">
            <div className="mb-2 rounded-full bg-gray-100 p-3">
              <BellRing className="h-6 w-6 text-gray-400" />
            </div>
            <h3 className="text-sm font-medium text-gray-900">No announcements</h3>
            <p className="mt-1 text-xs text-gray-500">New announcements will appear here</p>
          </div>
        ) : (
          <div className="space-y-4">
            {announcements.map((announcement) => (
              <div
                key={announcement.id}
                className="rounded-lg border border-gray-100 p-4 transition-colors hover:bg-gray-50"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center">
                      <h3 className="text-sm font-medium text-gray-900">{announcement.title}</h3>
                      <span
                        className={`ml-2 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                          announcement.priority === "high"
                            ? "bg-red-50 text-red-700"
                            : announcement.priority === "medium"
                              ? "bg-yellow-50 text-yellow-700"
                              : "bg-blue-50 text-blue-700"
                        }`}
                      >
                        {announcement.priority.charAt(0).toUpperCase() + announcement.priority.slice(1)}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-gray-600">{announcement.content}</p>
                  </div>
                </div>
                <div className="mt-2 text-xs text-gray-500">
                  {new Date(announcement.date).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </div>
              </div>
            ))}

            <Link
              href="/announcements"
              className="flex items-center justify-center rounded-lg border border-dashed border-gray-300 p-4 text-sm text-gray-500 transition-colors hover:bg-gray-50"
            >
              <ArrowRight size={16} className="mr-2" />
              View all announcements
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
