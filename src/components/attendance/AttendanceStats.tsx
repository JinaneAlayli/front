"use client"

import { useMemo } from "react"
import { Clock, Calendar, Users, TrendingUp } from "lucide-react"

interface AttendanceStatsProps {
  records: any[]
  loading: boolean
  isManager: boolean
  isLeader: boolean
  userId: number | undefined
}

export default function AttendanceStats({ records, loading, isManager, isLeader, userId }: AttendanceStatsProps) {
  // Filter records based on user role
  const filteredRecords = useMemo(() => {
    return records.filter((record) => {
      if (!isManager && !isLeader) {
        return record.user_id === userId
      }
      return true
    })
  }, [records, isManager, isLeader, userId])

  // Calculate statistics
  const stats = useMemo(() => {
    if (filteredRecords.length === 0) {
      return {
        totalHours: 0,
        averageHours: 0,
        presentDays: 0,
        totalDays: 0,
        attendanceRate: 0,
        onTimeRate: 0,
      }
    }

    // Ensure we're working with numbers by converting worked_hours to numbers
    const totalHours = filteredRecords.reduce((sum, record) => {
      // Convert worked_hours to a number or use 0 if it's not a valid number
      const hours =
        typeof record.worked_hours === "number" ? record.worked_hours : Number.parseFloat(record.worked_hours) || 0
      return sum + hours
    }, 0)

    const presentDays = filteredRecords.filter((record) => record.status === "present").length
    const totalDays = filteredRecords.length
    const attendanceRate = (presentDays / totalDays) * 100
    const averageHours = totalDays > 0 ? totalHours / presentDays : 0

    // Assuming check-in before 9:30 AM is considered on time
    const onTimeDays = filteredRecords.filter((record) => {
      if (!record.check_in) return false
      const [hours, minutes] = record.check_in.split(":").map(Number)
      return hours < 9 || (hours === 9 && minutes <= 30)
    }).length

    const onTimeRate = presentDays > 0 ? (onTimeDays / presentDays) * 100 : 0

    return {
      totalHours: Number.parseFloat(totalHours.toFixed(2)),
      averageHours: Number.parseFloat(averageHours.toFixed(2)),
      presentDays,
      totalDays,
      attendanceRate: Number.parseFloat(attendanceRate.toFixed(2)),
      onTimeRate: Number.parseFloat(onTimeRate.toFixed(2)),
    }
  }, [filteredRecords])

  // Get current month name
  const currentMonth = new Date().toLocaleString("default", { month: "long" })

  // Group records by date to get unique employees per day (for managers/leaders)
  const employeesByDate = useMemo(() => {
    if (!isManager && !isLeader) return {}

    return filteredRecords.reduce((acc: Record<string, Set<number>>, record) => {
      if (!acc[record.date]) {
        acc[record.date] = new Set()
      }
      acc[record.date].add(record.user_id)
      return acc
    }, {})
  }, [filteredRecords, isManager, isLeader])

  // Calculate average attendance (for managers/leaders)
  const averageAttendance = useMemo(() => {
    if ((!isManager && !isLeader) || Object.keys(employeesByDate).length === 0) return 0

    const totalEmployeesPerDay = Object.values(employeesByDate).reduce((sum, employees) => sum + employees.size, 0)
    return Number.parseFloat((totalEmployeesPerDay / Object.keys(employeesByDate).length).toFixed(2))
  }, [employeesByDate, isManager, isLeader])

  return (
    <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
      <div className="border-b border-gray-100 bg-[#6148F4]/5 px-6 py-4">
        <h2 className="text-lg font-medium text-gray-900">Attendance Statistics</h2>
        <p className="text-sm text-gray-500">
          {isManager || isLeader ? "Team attendance overview" : "Your attendance overview"}
        </p>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#6148F4] border-t-transparent"></div>
        </div>
      ) : (
        <div className="p-6">
          <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
              <div className="mb-2 text-sm font-medium text-gray-500">Total Hours</div>
              <div className="flex items-center">
                <Clock size={18} className="mr-2 text-[#6148F4]" />
                <span className="text-2xl font-semibold">{stats.totalHours}h</span>
              </div>
              <div className="mt-2 text-xs text-gray-500">This month</div>
            </div>

            <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
              <div className="mb-2 text-sm font-medium text-gray-500">Attendance Rate</div>
              <div className="flex items-center">
                <Calendar size={18} className="mr-2 text-[#6148F4]" />
                <span className="text-2xl font-semibold">{stats.attendanceRate}%</span>
              </div>
              <div className="mt-2 text-xs text-gray-500">
                {stats.presentDays} out of {stats.totalDays} days
              </div>
            </div>

            <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
              <div className="mb-2 text-sm font-medium text-gray-500">Average Hours</div>
              <div className="flex items-center">
                <TrendingUp size={18} className="mr-2 text-[#6148F4]" />
                <span className="text-2xl font-semibold">{stats.averageHours}h</span>
              </div>
              <div className="mt-2 text-xs text-gray-500">Per working day</div>
            </div>

            {isManager || isLeader ? (
              <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
                <div className="mb-2 text-sm font-medium text-gray-500">Avg. Team Attendance</div>
                <div className="flex items-center">
                  <Users size={18} className="mr-2 text-[#6148F4]" />
                  <span className="text-2xl font-semibold">{averageAttendance}</span>
                </div>
                <div className="mt-2 text-xs text-gray-500">Employees per day</div>
              </div>
            ) : (
              <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
                <div className="mb-2 text-sm font-medium text-gray-500">On-Time Rate</div>
                <div className="flex items-center">
                  <Clock size={18} className="mr-2 text-[#6148F4]" />
                  <span className="text-2xl font-semibold">{stats.onTimeRate}%</span>
                </div>
                <div className="mt-2 text-xs text-gray-500">Arrived before 9:30 AM</div>
              </div>
            )}
          </div>

          <div className="rounded-lg border border-gray-100">
            <div className="border-b border-gray-100 bg-gray-50 px-4 py-3">
              <h3 className="text-sm font-medium text-gray-700">
                {isManager || isLeader ? "Team Attendance Summary" : "Your Attendance Summary"}
              </h3>
            </div>
            <div className="p-4">
              <div className="h-64 w-full">
                {/* This would be a chart component in a real implementation */}
                <div className="flex h-full flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50 p-6 text-center">
                  <div className="mb-2 rounded-full bg-gray-100 p-3">
                    <TrendingUp className="h-6 w-6 text-gray-400" />
                  </div>
                  <h3 className="text-sm font-medium text-gray-900">Attendance Chart</h3>
                  <p className="mt-1 text-xs text-gray-500">Attendance data visualization would appear here</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 text-center text-sm text-gray-500">Statistics are based on data from {currentMonth}</div>
        </div>
      )}
    </div>
  )
}
