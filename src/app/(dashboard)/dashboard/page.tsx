"use client"

import { useState, useEffect } from "react"
import { useSelector } from "react-redux"
import type { RootState } from "@/lib/redux/store"
import ProtectedRoute from "@/components/ProtectedRoute"
import DashboardCheckIn from "@/components/dashboard/DashboardCheckIn"
import DashboardStats from "@/components/dashboard/DashboardStats"
import DashboardTasks from "@/components/dashboard/DashboardTasks"
import DashboardAnnouncements from "@/components/dashboard/DashboardAnnouncements"
import api from "@/lib/api"
import { toast } from "react-toastify"
import { Clock, Calendar, Users, BriefcaseBusiness } from "lucide-react"
import Link from "next/link"

export default function DashboardPage() {
  const { user } = useSelector((state: RootState) => state.auth)
  const [todayRecord, setTodayRecord] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    attendanceRate: "-",
    tasksCompleted: "-",
    leaveRequests: "-",
    teamMembers: "-",
  })

  // Check if user is HR or owner (can view all records)
  const isManager = user?.role_id === 2 || user?.role_id === 3
  // Check if user is a team leader
  const isLeader = user?.role_id === 4

  const fetchDashboardData = async () => {
    setLoading(true)
    try {
      // Try to fetch attendance records
      try {
        const attendanceRes = await api.get("/attendance")
        const today = new Date().toISOString().split("T")[0]
        // Find the current user's record for today
        const userRecord = attendanceRes.data.find(
          (record: any) => record.user_id === user?.id && record.date === today,
        )
        setTodayRecord(userRecord || null)
      } catch (error: any) {
        console.error("Failed to fetch attendance data:", error)
        // If it's a permission error, don't show a toast
        if (error.response?.status !== 403) {
          toast.error("Failed to load attendance data")
        }
        // Set todayRecord to null to indicate no data
        setTodayRecord(null)
      }

      // Fetch tasks count (if available)
      let tasksCompleted = "-"
      try {
        const tasksRes = await api.get("/tasks/my-tasks")
        tasksCompleted = tasksRes.data.filter((task: any) => task.completed).length.toString()
      } catch (error) {
        console.error("Failed to fetch tasks data:", error)
        // Continue with default value
      }

      // Fetch leave requests count (if available)
      let leaveRequests = "-"
      try {
        const leaveRes = await api.get("/leave-requests")
        leaveRequests = leaveRes.data.filter((request: any) => request.status === "pending").length.toString()
      } catch (error) {
        console.error("Failed to fetch leave requests data:", error)
        // Continue with default value
      }

      // Set stats with whatever data we were able to fetch
      setStats({
        attendanceRate: "-", // This would come from an API endpoint in a real implementation
        tasksCompleted,
        leaveRequests,
        teamMembers: "-", // This would come from an API endpoint in a real implementation
      })
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error)
      toast.error("Some dashboard data could not be loaded")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user) {
      fetchDashboardData()
    }
  }, [user])

  const handleCheckInSuccess = (record: any) => {
    setTodayRecord(record)
    toast.success("Successfully checked in")
  }

  const handleCheckOutSuccess = (record: any) => {
    setTodayRecord(record)
    toast.success("Successfully checked out")
  }

  return (
    <ProtectedRoute>
      <main className="min-h-screen bg-[#FAF9F7] text-gray-900">
        <div className="mx-auto max-w-7xl p-4 md:p-6 lg:p-8">
          <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">Dashboard</h1>
              <p className="mt-1 text-gray-500">Welcome back, {user?.name || user?.email}</p>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/attendance"
                className="inline-flex items-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#6148F4]/50 focus:ring-offset-2"
              >
                <Clock size={16} className="mr-2 text-[#6148F4]" />
                View Attendance
              </Link>

              {isManager && (
                <Link
                  href="/employees"
                  className="inline-flex items-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#6148F4]/50 focus:ring-offset-2"
                >
                  <Users size={16} className="mr-2 text-[#6148F4]" />
                  Manage Employees
                </Link>
              )}
            </div>
          </div>

          {/* Check-in/out Component */}
          <div className="mb-8">
            <DashboardCheckIn
              todayRecord={todayRecord}
              onCheckInSuccess={handleCheckInSuccess}
              onCheckOutSuccess={handleCheckOutSuccess}
            />
          </div>

          {/* Stats Overview */}
          <div className="mb-8">
            <h2 className="mb-4 text-xl font-semibold text-gray-900">Overview</h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <DashboardStats
                title="Attendance Rate"
                value={stats.attendanceRate === "-" ? "-" : `${stats.attendanceRate}%`}
                icon={<Clock className="h-5 w-5 text-[#6148F4]" />}
                description="This month"
                link="/attendance"
              />

              <DashboardStats
                title="Tasks Completed"
                value={stats.tasksCompleted}
                icon={<Calendar className="h-5 w-5 text-[#6148F4]" />}
                description="This week"
                link="/tasks"
              />

              <DashboardStats
                title="Leave Requests"
                value={stats.leaveRequests}
                icon={<BriefcaseBusiness className="h-5 w-5 text-[#6148F4]" />}
                description="Pending approval"
                link="/leave-requests"
              />

              {(isManager || isLeader) && (
                <DashboardStats
                  title="Team Members"
                  value={stats.teamMembers}
                  icon={<Users className="h-5 w-5 text-[#6148F4]" />}
                  description="Active employees"
                  link="/employees"
                />
              )}
            </div>
          </div>

          {/* Tasks and Announcements */}
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            <DashboardTasks userId={user?.id} />
            <DashboardAnnouncements />
          </div>
        </div>
      </main>
    </ProtectedRoute>
  )
}
