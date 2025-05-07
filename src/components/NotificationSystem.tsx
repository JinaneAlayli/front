"use client"

import { useState, useEffect, useRef } from "react"
import { useSelector } from "react-redux"
import type { RootState } from "@/lib/redux/store"
import api from "@/lib/api"
import { Bell, X, Megaphone } from "lucide-react"
import Link from "next/link"

interface Notification {
  id: number
  title: string
  content: string
  team_id: number | null
  created_at: string
  is_read: boolean
  creator: {
    id: number
    name: string
  }
}

// Mock data for development when API is not available
const MOCK_NOTIFICATIONS = [
  {
    id: 1,
    title: "Welcome to the platform",
    content: "Thank you for joining our platform. We're excited to have you on board!",
    team_id: null,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
    creator: {
      id: 1,
      name: "System Admin",
    },
  },
  {
    id: 2,
    title: "New team features available",
    content: "We've added new collaboration features to teams. Check them out!",
    team_id: null,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
    creator: {
      id: 1,
      name: "System Admin",
    },
  },
  {
    id: 3,
    title: "Scheduled maintenance",
    content: "We'll be performing scheduled maintenance this weekend. The system may be temporarily unavailable.",
    team_id: null,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(), // 3 days ago
    creator: {
      id: 1,
      name: "System Admin",
    },
  },
]

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

export default function NotificationSystem() {
  const user = useSelector((state: RootState) => state.auth.user)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [useMockData, setUseMockData] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const apiErrorCountRef = useRef(0)

  const fetchNotifications = async () => {
    if (!user) return

    // If we've already determined we need to use mock data, don't try the API again
    if (useMockData) {
      loadMockNotifications()
      return
    }

    setIsLoading(true)
    try {
      const response = await api.get("/announcements")

      // Reset error count on successful request
      apiErrorCountRef.current = 0

      // Sort by date (newest first) and limit to 10
      const sortedNotifications = response.data
        .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 10)

      // Add is_read property (this would normally come from the backend)
      // For demo purposes, we'll use localStorage to track read status
      const readIds = JSON.parse(localStorage.getItem("readAnnouncements") || "[]")

      const notificationsWithReadStatus = sortedNotifications.map((notification: any) => ({
        ...notification,
        is_read: readIds.includes(notification.id),
      }))

      setNotifications(notificationsWithReadStatus)
    } catch (error: any) {
      console.error("Failed to fetch notifications", error)

      // Increment error count
      apiErrorCountRef.current += 1

      // After 3 failed attempts, switch to mock data
      if (apiErrorCountRef.current >= 3) {
        console.log("Switching to mock notification data after repeated API failures")
        setUseMockData(true)
        loadMockNotifications()
      } else if (notifications.length === 0) {
        // Only load mock data if we don't already have notifications
        loadMockNotifications()
      }
    } finally {
      setIsLoading(false)
    }
  }

  const loadMockNotifications = () => {
    // Add is_read property to mock data
    const readIds = JSON.parse(localStorage.getItem("readAnnouncements") || "[]")
    const mockWithReadStatus = MOCK_NOTIFICATIONS.map((notification) => ({
      ...notification,
      is_read: readIds.includes(notification.id),
    }))

    setNotifications(mockWithReadStatus)
    setIsLoading(false)
  }

  useEffect(() => {
    fetchNotifications()

    // Poll for new notifications every 2 minutes (reduced from 1 minute to reduce API load)
    const interval = setInterval(fetchNotifications, 120000)

    return () => clearInterval(interval)
  }, [user])

  useEffect(() => {
    // Handle clicks outside the dropdown to close it
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  const toggleDropdown = () => {
    setIsOpen(!isOpen)
  }

  const markAsRead = (id: number) => {
    // Update local state
    setNotifications(
      notifications.map((notification) => (notification.id === id ? { ...notification, is_read: true } : notification)),
    )

    // Update localStorage
    const readIds = JSON.parse(localStorage.getItem("readAnnouncements") || "[]")
    if (!readIds.includes(id)) {
      localStorage.setItem("readAnnouncements", JSON.stringify([...readIds, id]))
    }
  }

  const markAllAsRead = () => {
    // Update all notifications to read
    setNotifications(notifications.map((notification) => ({ ...notification, is_read: true })))

    // Update localStorage with all IDs
    const allIds = notifications.map((notification) => notification.id)
    const readIds = JSON.parse(localStorage.getItem("readAnnouncements") || "[]")
    const uniqueIds = [...new Set([...readIds, ...allIds])]
    localStorage.setItem("readAnnouncements", JSON.stringify(uniqueIds))
  }

  const unreadCount = notifications.filter((notification) => !notification.is_read).length

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={toggleDropdown}
        className="relative flex h-10 w-10 items-center justify-center rounded-full bg-white text-gray-600 shadow-sm transition-colors hover:bg-gray-50 hover:text-[#6148F4]"
        aria-label="Notifications"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute right-0 top-0 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#6148F4] px-1 text-xs font-medium text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 origin-top-right overflow-hidden rounded-lg border border-gray-100 bg-white shadow-lg animate-in fade-in slide-in-from-top-5 duration-200 sm:w-96">
          <div className="border-b border-gray-100 bg-gray-50 p-3">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-gray-900">Notifications</h3>
              {unreadCount > 0 && (
                <button onClick={markAllAsRead} className="text-xs font-medium text-[#6148F4] hover:underline">
                  Mark all as read
                </button>
              )}
            </div>
          </div>

          <div className="max-h-[60vh] overflow-y-auto">
            {isLoading ? (
              <div className="flex h-32 items-center justify-center">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#6148F4] border-t-transparent"></div>
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
                  <Bell size={24} className="text-gray-400" />
                </div>
                <p className="mt-2 text-sm text-gray-500">No notifications yet</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`relative p-4 transition-colors hover:bg-gray-50 ${
                      !notification.is_read ? "bg-[#6148F4]/5" : ""
                    }`}
                  >
                    <Link href="/announcements" onClick={() => markAsRead(notification.id)} className="block">
                      <div className="flex">
                        <div className="mr-3 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[#6148F4]/10">
                          <Megaphone size={18} className="text-[#6148F4]" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-900">{notification.title}</p>
                          <p className="mt-1 truncate text-sm text-gray-500">
                            {notification.content.length > 60
                              ? `${notification.content.substring(0, 60)}...`
                              : notification.content}
                          </p>
                          <p className="mt-1 text-xs text-gray-400">
                            {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                            {notification.team_id ? " • Team" : " • Company"}
                          </p>
                        </div>
                      </div>
                    </Link>
                    {!notification.is_read && (
                      <button
                        onClick={() => markAsRead(notification.id)}
                        className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
                        aria-label="Mark as read"
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="border-t border-gray-100 bg-gray-50 p-2 text-center">
            <Link
              href="/announcements"
              onClick={() => setIsOpen(false)}
              className="block rounded-md px-2 py-1.5 text-sm font-medium text-[#6148F4] hover:bg-[#6148F4]/5"
            >
              View all announcements
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
