"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "react-toastify"
import { useSelector } from "react-redux"
import type { RootState } from "@/lib/redux/store"
import api from "@/lib/api"
import { BarChart3, Clock, Users, TrendingUp, Download, Award, CheckCircle, AlertTriangle } from "lucide-react"

// Define types for API responses
interface User {
  id: number
  first_name: string
  last_name: string
  position?: string
  team_id?: number
  company_id?: number
  role_id?: number
  email?: string
  avatar_url?: string
}

interface Task {
  id: number
  title: string
  description?: string
  status: string
  assigned_to: number
  created_by: number
  created_at: string
  updated_at: string
  due_date?: string
  priority?: string
}

interface AttendanceRecord {
  id: number
  user_id: number
  check_in_time: string
  check_out_time?: string
  date: string
}

interface Team {
  id: number
  name: string
  company_id: number
  created_at: string
  updated_at: string
}

interface Salary {
  id: number
  user_id: number
  amount: number
  currency: string
  effective_date: string
  end_date?: string
  is_active: boolean
}

// Define types for employee performance metrics
interface EmployeePerformance {
  id: number
  name: string
  position: string
  avatar?: string
  tasksCompleted: number
  tasksTotal: number
  completionRate: number
  onTimeCompletion: number
  lateCompletion: number
  attendanceRate: number
  lateArrivals: number
  overallScore: number
}

// Define types for our analytics data
interface AnalyticsSummary {
  totalEmployees?: number
  totalTasks?: number
  completedTasks?: number
  pendingTasks?: number
  attendanceRate?: number
  lateArrivals?: number
  totalTeams?: number
  avgTeamSize?: number
  totalSalaryBudget?: number
  avgSalary?: number
}

interface AnalyticsData {
  summary: Partial<AnalyticsSummary>
  employeePerformance?: EmployeePerformance[]
  attendanceIssues?: {
    id: number
    name: string
    position: string
    lateCount: number
    absenceCount: number
    avgLateMinutes: number
  }[]
  teamPerformance?: {
    id: number
    name: string
    score: number
    taskCompletion: {
      assigned: number
      completed: number
    }
  }[]
  salaryDistribution?: {
    range: string
    count: number
  }[]
}

// Define type for task data map
interface UserTaskData {
  completed: number
  pending: number
  late: number
  onTime: number
  total: number
}

// Define type for attendance data map
interface UserAttendanceData {
  lateCount: number
  absenceCount: number
  totalLateMinutes: number
  presentCount: number
  totalDays: number
}

export default function AnalyticsPage() {
  const router = useRouter()
  const { user } = useSelector((state: RootState) => state.auth)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("performance")
  const [timeRange, setTimeRange] = useState("month")
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    summary: {},
  })

  // Check if user has permission to access this page
  useEffect(() => {
    if (user && user.role_id !== 2) {
      toast.error("You don't have permission to access this page")
      router.push("/dashboard")
    }
  }, [user, router])

  // Fetch analytics data from backend
  useEffect(() => {
    if (user && user.role_id === 2) {
      fetchAnalyticsData()
    }
  }, [user, timeRange])

  // Update the fetchAnalyticsData function to remove any static data generation
  const fetchAnalyticsData = async () => {
    setLoading(true)
    try {
      // Create a summary object to store all analytics data
      const summary: Partial<AnalyticsSummary> = {}
      const analyticsData: AnalyticsData = { summary }

      // Fetch users data to get employees from the same company
      const usersResponse = await api.get("/users")
      const allUsers: User[] = usersResponse.data

      // Filter users by company_id to get only employees from the same company
      const companyUsers = allUsers.filter((u) => u.company_id === user?.company_id)
      summary.totalEmployees = companyUsers.length

      // Fetch tasks data for the company
      const tasksResponse = await api.get("/tasks")
      const allTasks: Task[] = tasksResponse.data

      // Filter tasks by assigned_to users in the company
      const companyUserIds = companyUsers.map((u) => u.id)
      const companyTasks = allTasks.filter(
        (task) => companyUserIds.includes(task.assigned_to) || companyUserIds.includes(task.created_by),
      )

      summary.totalTasks = companyTasks.length
      summary.completedTasks = companyTasks.filter((task) => task.status === "completed").length
      summary.pendingTasks = companyTasks.filter(
        (task) => task.status === "pending" || task.status === "in_progress",
      ).length

      // Fetch attendance data
      const attendanceResponse = await api.get("/attendance")
      const allAttendance: AttendanceRecord[] = attendanceResponse.data

      // Filter attendance records for company employees
      const companyAttendance = allAttendance.filter((record) => companyUserIds.includes(record.user_id))

      // Calculate employee performance metrics
      const userTaskMap = new Map<number, UserTaskData>()
      const userAttendanceMap = new Map<number, UserAttendanceData>()

      // Initialize task data for all users
      companyUsers.forEach((user) => {
        if (user.id) {
          userTaskMap.set(user.id, {
            completed: 0,
            pending: 0,
            late: 0,
            onTime: 0,
            total: 0,
          })
        }
      })

      // Calculate task metrics for each user
      companyTasks.forEach((task) => {
        if (!userTaskMap.has(task.assigned_to)) {
          return
        }

        const userData = userTaskMap.get(task.assigned_to)
        if (!userData) return

        userData.total++

        if (task.status === "completed") {
          userData.completed++

          // Check if task was completed on time or late
          const dueDate = task.due_date ? new Date(task.due_date) : null
          const completedDate = new Date(task.updated_at)

          if (dueDate && completedDate > dueDate) {
            userData.late++
          } else {
            userData.onTime++
          }
        } else if (task.status === "pending" || task.status === "in_progress") {
          userData.pending++
        }
      })

      // Calculate attendance metrics
      const totalWorkDays = 20 // Assuming 20 working days in a month

      companyUsers.forEach((user) => {
        if (user.id) {
          userAttendanceMap.set(user.id, {
            lateCount: 0,
            absenceCount: 0,
            totalLateMinutes: 0,
            presentCount: 0,
            totalDays: totalWorkDays,
          })
        }
      })

      companyAttendance.forEach((record) => {
        if (!userAttendanceMap.has(record.user_id)) {
          return
        }

        const userData = userAttendanceMap.get(record.user_id)
        if (!userData) return

        userData.presentCount++

        // Check if check-in was late
        const checkInTime = new Date(record.check_in_time)
        const workStartHour = 9 // Assuming work starts at 9 AM

        if (
          checkInTime.getHours() > workStartHour ||
          (checkInTime.getHours() === workStartHour && checkInTime.getMinutes() > 0)
        ) {
          userData.lateCount++

          // Calculate minutes late
          const minutesLate = (checkInTime.getHours() - workStartHour) * 60 + checkInTime.getMinutes()
          userData.totalLateMinutes += minutesLate
        }
      })

      // Calculate absence count
      userAttendanceMap.forEach((data, userId) => {
        data.absenceCount = totalWorkDays - data.presentCount
      })

      // Calculate overall attendance rate
      const totalExpectedAttendance = summary.totalEmployees ? summary.totalEmployees * totalWorkDays : 0
      const actualAttendance = companyAttendance.length
      summary.attendanceRate =
        totalExpectedAttendance > 0 ? Math.round((actualAttendance / totalExpectedAttendance) * 100) : 0

      // Calculate late arrivals
      summary.lateArrivals = companyAttendance.filter((record) => {
        const checkInTime = new Date(record.check_in_time)
        const workStartHour = 9 // Assuming work starts at 9 AM
        return (
          checkInTime.getHours() > workStartHour ||
          (checkInTime.getHours() === workStartHour && checkInTime.getMinutes() > 0)
        )
      }).length

      // Create employee performance array
      const employeePerformance: EmployeePerformance[] = []

      companyUsers.forEach((user) => {
        if (!user.id) return

        const taskData = userTaskMap.get(user.id)
        const attendanceData = userAttendanceMap.get(user.id)

        if (!taskData || !attendanceData) return

        // Calculate completion rate
        const completionRate = taskData.total > 0 ? Math.round((taskData.completed / taskData.total) * 100) : 0

        // Calculate on-time completion rate
        const onTimeRate = taskData.completed > 0 ? Math.round((taskData.onTime / taskData.completed) * 100) : 0

        // Calculate attendance rate
        const attendanceRate =
          attendanceData.totalDays > 0 ? Math.round((attendanceData.presentCount / attendanceData.totalDays) * 100) : 0

        // Calculate overall performance score (weighted average)
        const taskWeight = 0.5
        const attendanceWeight = 0.3
        const onTimeWeight = 0.2

        const overallScore = Math.round(
          completionRate * taskWeight + attendanceRate * attendanceWeight + onTimeRate * onTimeWeight,
        )

        employeePerformance.push({
          id: user.id,
          name: `${user.first_name || ""} ${user.last_name || ""}`.trim(),
          position: user.position || "Employee",
          avatar: user.avatar_url,
          tasksCompleted: taskData.completed,
          tasksTotal: taskData.total,
          completionRate,
          onTimeCompletion: onTimeRate,
          lateCompletion: taskData.late,
          attendanceRate,
          lateArrivals: attendanceData.lateCount,
          overallScore,
        })
      })

      // Sort employee performance by overall score (descending)
      analyticsData.employeePerformance = employeePerformance.sort((a, b) => b.overallScore - a.overallScore)

      // Create attendance issues array
      const attendanceIssues = companyUsers
        .filter((user) => user.id && userAttendanceMap.has(user.id))
        .map((user) => {
          const data = userAttendanceMap.get(user.id!)!
          return {
            id: user.id!,
            name: `${user.first_name || ""} ${user.last_name || ""}`.trim(),
            position: user.position || "Employee",
            lateCount: data.lateCount,
            absenceCount: data.absenceCount,
            avgLateMinutes: data.lateCount > 0 ? Math.round(data.totalLateMinutes / data.lateCount) : 0,
          }
        })
        .filter((issue) => issue.lateCount > 0 || issue.absenceCount > 0)
        .sort((a, b) => b.lateCount + b.absenceCount - (a.lateCount + a.absenceCount))

      analyticsData.attendanceIssues = attendanceIssues.slice(0, 5) // Top 5 attendance issues

      // Fetch teams data
      const teamsResponse = await api.get("/teams")
      const allTeams: Team[] = teamsResponse.data

      // Filter teams by company_id
      const companyTeams = allTeams.filter((team) => team.company_id === user?.company_id)
      summary.totalTeams = companyTeams.length

      // Calculate average team size
      const teamSizes = companyTeams.map((team) => {
        return companyUsers.filter((user) => user.team_id === team.id).length
      })

      summary.avgTeamSize =
        teamSizes.length > 0 ? Math.round(teamSizes.reduce((sum, size) => sum + size, 0) / teamSizes.length) : 0

      // Calculate team performance
      const teamPerformance = companyTeams.map((team) => {
        const teamMembers = companyUsers.filter((user) => user.team_id === team.id).map((user) => user.id)
        const teamTasks = companyTasks.filter((task) => task.assigned_to && teamMembers.includes(task.assigned_to))
        const assigned = teamTasks.length
        const completed = teamTasks.filter((task) => task.status === "completed").length

        // Calculate team score based on task completion and other metrics
        const completionRate = assigned > 0 ? (completed / assigned) * 100 : 0
        const teamMemberPerformance =
          employeePerformance
            .filter((emp) => teamMembers.includes(emp.id))
            .reduce((sum, emp) => sum + emp.overallScore, 0) / teamMembers.length || 0

        // Weight completion rate and team member performance
        const score = Math.round(completionRate * 0.6 + teamMemberPerformance * 0.4)

        return {
          id: team.id,
          name: team.name,
          score: Math.min(100, score), // Cap at 100
          taskCompletion: {
            assigned,
            completed,
          },
        }
      })

      // Sort team performance by score
      analyticsData.teamPerformance = teamPerformance.sort((a, b) => b.score - a.score)

      // Fetch salaries data
      try {
        const salariesResponse = await api.get("/salaries/active/company")
        const salaries: Salary[] = salariesResponse.data

        // Filter salaries for company employees
        const companySalaries = salaries.filter((salary) => companyUserIds.includes(salary.user_id))

        // Calculate salary metrics
        const totalSalary = companySalaries.reduce((sum, salary) => sum + salary.amount, 0)
        summary.totalSalaryBudget = totalSalary
        summary.avgSalary = companySalaries.length > 0 ? Math.round(totalSalary / companySalaries.length) : 0

        // Calculate salary distribution
        const salaryRanges = [
          { min: 0, max: 30000, label: "<30K" },
          { min: 30000, max: 50000, label: "30K-50K" },
          { min: 50000, max: 70000, label: "50K-70K" },
          { min: 70000, max: 100000, label: "70K-100K" },
          { min: 100000, max: Number.POSITIVE_INFINITY, label: ">100K" },
        ]

        const salaryDistribution = salaryRanges.map((range) => {
          const count = companySalaries.filter(
            (salary) => salary.amount >= range.min && salary.amount < range.max,
          ).length

          return {
            range: range.label,
            count,
          }
        })

        analyticsData.salaryDistribution = salaryDistribution
      } catch (error) {
        console.error("Failed to fetch salary data:", error)
        // Continue with other data if salary data fails
      }

      setAnalyticsData(analyticsData)
    } catch (error) {
      console.error("Failed to fetch analytics data:", error)
      toast.error("Failed to load analytics data")
      // Initialize with empty data structure
      setAnalyticsData({
        summary: {},
      })
    } finally {
      setLoading(false)
    }
  }

  const exportReport = async () => {
    try {
      toast.info("Generating report...")

      // Prepare the data for export
      const reportData = {
        timeRange,
        summary: analyticsData.summary,
        employeePerformance: analyticsData.employeePerformance,
        attendanceIssues: analyticsData.attendanceIssues,
        teamPerformance: analyticsData.teamPerformance,
        salaryDistribution: analyticsData.salaryDistribution,
      }

      // Create a Blob with the JSON data
      const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: "application/json" })
      const url = window.URL.createObjectURL(blob)

      // Create a download link
      const link = document.createElement("a")
      link.href = url
      link.setAttribute("download", `analytics-report-${timeRange}.json`)
      document.body.appendChild(link)
      link.click()
      link.remove()

      toast.success("Report exported successfully")
    } catch (error) {
      console.error("Failed to export report:", error)
      toast.error("Failed to export report")
    }
  }

  // Update the loading state to be simpler
  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex flex-col items-center justify-center h-64">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-300 border-t-indigo-600"></div>
          <p className="mt-4 text-lg text-gray-500">Loading analytics data...</p>
        </div>
      </div>
    )
  }

  // If user doesn't have permission, don't render the page
  if (user && user.role_id !== 2) {
    return null
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <h1 className="text-2xl font-bold">Analytics Dashboard</h1>
        <div className="flex items-center gap-4">
          <div className="flex items-center">
            <label htmlFor="time-range" className="mr-2 text-sm font-medium">
              Time Range:
            </label>
            <select
              id="time-range"
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="rounded-md border border-gray-300 bg-white px-3 py-1 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="quarter">This Quarter</option>
              <option value="year">This Year</option>
            </select>
          </div>
          <button
            className="flex items-center gap-2 rounded-md bg-gray-100 px-3 py-1 text-sm font-medium text-gray-700 hover:bg-gray-200"
            onClick={exportReport}
          >
            <Download size={16} />
            Export Report
          </button>
        </div>
      </div>
      <div className="mb-6">
        <div className="border-b">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: "performance", name: "Performance", icon: <BarChart3 size={16} /> },
              { id: "attendance", name: "Attendance", icon: <Clock size={16} /> },
              { id: "teams", name: "Teams", icon: <Users size={16} /> },
              { id: "salaries", name: "Salaries", icon: <TrendingUp size={16} /> },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium ${
                  activeTab === tab.id
                    ? "border-indigo-500 text-indigo-600"
                    : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                }`}
              >
                {tab.icon}
                {tab.name}
              </button>
            ))}
          </nav>
        </div>
      </div>
      // Update the employee performance section to handle no data consistently
      {activeTab === "performance" && (
        <div className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg border bg-white p-6 shadow-sm">
              <h3 className="mb-1 text-sm font-medium text-gray-500">Total Employees</h3>
              {analyticsData?.summary?.totalEmployees !== undefined ? (
                <p className="text-2xl font-bold">{analyticsData.summary.totalEmployees}</p>
              ) : (
                <p className="text-lg text-gray-400">No data available</p>
              )}
            </div>
            <div className="rounded-lg border bg-white p-6 shadow-sm">
              <h3 className="mb-1 text-sm font-medium text-gray-500">Total Tasks</h3>
              {analyticsData?.summary?.totalTasks !== undefined ? (
                <p className="text-2xl font-bold">{analyticsData.summary.totalTasks}</p>
              ) : (
                <p className="text-lg text-gray-400">No data available</p>
              )}
            </div>
            <div className="rounded-lg border bg-white p-6 shadow-sm">
              <h3 className="mb-1 text-sm font-medium text-gray-500">Completed Tasks</h3>
              {analyticsData?.summary?.completedTasks !== undefined ? (
                <p className="text-2xl font-bold">{analyticsData.summary.completedTasks}</p>
              ) : (
                <p className="text-lg text-gray-400">No data available</p>
              )}
            </div>
            <div className="rounded-lg border bg-white p-6 shadow-sm">
              <h3 className="mb-1 text-sm font-medium text-gray-500">Pending Tasks</h3>
              {analyticsData?.summary?.pendingTasks !== undefined ? (
                <p className="text-2xl font-bold">{analyticsData.summary.pendingTasks}</p>
              ) : (
                <p className="text-lg text-gray-400">No data available</p>
              )}
            </div>
          </div>

          <div className="rounded-lg border bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-lg font-medium">Employee Performance</h3>
            {analyticsData?.employeePerformance && analyticsData.employeePerformance.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b text-left text-xs font-medium uppercase text-gray-500">
                      <th className="pb-3 pl-4">Employee</th>
                      <th className="pb-3">Tasks</th>
                      <th className="pb-3">Completion</th>
                      <th className="pb-3">On-Time</th>
                      <th className="pb-3">Attendance</th>
                      <th className="pb-3 pr-4">Overall Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analyticsData.employeePerformance.map((employee) => (
                      <tr key={employee.id} className="border-b last:border-0 hover:bg-gray-50">
                        <td className="py-3 pl-4">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 overflow-hidden rounded-full bg-gray-100">
                              {employee.avatar ? (
                                <img
                                  src={employee.avatar || "/placeholder.svg"}
                                  alt={employee.name}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center bg-gray-200 text-gray-500">
                                  {employee.name.charAt(0)}
                                </div>
                              )}
                            </div>
                            <div>
                              <p className="font-medium">{employee.name}</p>
                              <p className="text-xs text-gray-500">{employee.position}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3">
                          <div className="flex flex-col">
                            <span className="font-medium">
                              {employee.tasksCompleted}/{employee.tasksTotal}
                            </span>
                            <div className="mt-1 h-1.5 w-24 overflow-hidden rounded-full bg-gray-200">
                              <div
                                className="h-full bg-green-500"
                                style={{
                                  width:
                                    employee.tasksTotal > 0
                                      ? `${(employee.tasksCompleted / employee.tasksTotal) * 100}%`
                                      : "0%",
                                }}
                              ></div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`flex h-6 w-6 items-center justify-center rounded-full ${
                                employee.completionRate >= 75
                                  ? "bg-green-100 text-green-700"
                                  : employee.completionRate >= 50
                                    ? "bg-yellow-100 text-yellow-700"
                                    : "bg-red-100 text-red-700"
                              }`}
                            >
                              {employee.completionRate >= 75 ? (
                                <CheckCircle size={14} />
                              ) : employee.completionRate >= 50 ? (
                                <AlertTriangle size={14} />
                              ) : (
                                <AlertTriangle size={14} />
                              )}
                            </span>
                            <span>{employee.completionRate}%</span>
                          </div>
                        </td>
                        <td className="py-3">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`flex h-6 w-6 items-center justify-center rounded-full ${
                                employee.onTimeCompletion >= 75
                                  ? "bg-green-100 text-green-700"
                                  : employee.onTimeCompletion >= 50
                                    ? "bg-yellow-100 text-yellow-700"
                                    : "bg-red-100 text-red-700"
                              }`}
                            >
                              {employee.onTimeCompletion >= 75 ? (
                                <CheckCircle size={14} />
                              ) : employee.onTimeCompletion >= 50 ? (
                                <AlertTriangle size={14} />
                              ) : (
                                <AlertTriangle size={14} />
                              )}
                            </span>
                            <span>{employee.onTimeCompletion}%</span>
                          </div>
                        </td>
                        <td className="py-3">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`flex h-6 w-6 items-center justify-center rounded-full ${
                                employee.attendanceRate >= 90
                                  ? "bg-green-100 text-green-700"
                                  : employee.attendanceRate >= 75
                                    ? "bg-yellow-100 text-yellow-700"
                                    : "bg-red-100 text-red-700"
                              }`}
                            >
                              {employee.attendanceRate >= 90 ? (
                                <CheckCircle size={14} />
                              ) : employee.attendanceRate >= 75 ? (
                                <AlertTriangle size={14} />
                              ) : (
                                <AlertTriangle size={14} />
                              )}
                            </span>
                            <span>{employee.attendanceRate}%</span>
                          </div>
                        </td>
                        <td className="py-3 pr-4">
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
                              <Award
                                size={16}
                                className={
                                  employee.overallScore >= 80
                                    ? "text-green-500"
                                    : employee.overallScore >= 60
                                      ? "text-yellow-500"
                                      : "text-red-500"
                                }
                              />
                            </div>
                            <div className="flex flex-col">
                              <span className="font-medium">{employee.overallScore}/100</span>
                              <div className="mt-1 h-1.5 w-16 overflow-hidden rounded-full bg-gray-200">
                                <div
                                  className={`h-full ${
                                    employee.overallScore >= 80
                                      ? "bg-green-500"
                                      : employee.overallScore >= 60
                                        ? "bg-yellow-500"
                                        : "bg-red-500"
                                  }`}
                                  style={{ width: `${employee.overallScore}%` }}
                                ></div>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex h-40 items-center justify-center text-gray-400">
                <p>No data available</p>
              </div>
            )}
          </div>
        </div>
      )}
      // Update the attendance issues section to handle no data consistently
      {activeTab === "attendance" && (
        <div className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg border bg-white p-6 shadow-sm">
              <h3 className="mb-1 text-sm font-medium text-gray-500">Avg. Attendance Rate</h3>
              {analyticsData?.summary?.attendanceRate !== undefined ? (
                <p className="text-2xl font-bold">{analyticsData.summary.attendanceRate}%</p>
              ) : (
                <p className="text-lg text-gray-400">No data available</p>
              )}
            </div>
            <div className="rounded-lg border bg-white p-6 shadow-sm">
              <h3 className="mb-1 text-sm font-medium text-gray-500">Late Check-ins</h3>
              {analyticsData?.summary?.lateArrivals !== undefined ? (
                <p className="text-2xl font-bold">{analyticsData.summary.lateArrivals}</p>
              ) : (
                <p className="text-lg text-gray-400">No data available</p>
              )}
            </div>
            <div className="rounded-lg border bg-white p-6 shadow-sm">
              <h3 className="mb-1 text-sm font-medium text-gray-500">Total Employees</h3>
              {analyticsData?.summary?.totalEmployees !== undefined ? (
                <p className="text-2xl font-bold">{analyticsData.summary.totalEmployees}</p>
              ) : (
                <p className="text-lg text-gray-400">No data available</p>
              )}
            </div>
            <div className="rounded-lg border bg-white p-6 shadow-sm">
              <h3 className="mb-1 text-sm font-medium text-gray-500">Working Days</h3>
              <p className="text-2xl font-bold">20</p>
            </div>
          </div>

          <div className="rounded-lg border bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-lg font-medium">Attendance Issues</h3>
            {analyticsData?.attendanceIssues && analyticsData.attendanceIssues.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b text-left text-xs font-medium uppercase text-gray-500">
                      <th className="pb-3 pl-4">Employee</th>
                      <th className="pb-3">Late Check-ins</th>
                      <th className="pb-3">Absences</th>
                      <th className="pb-3 pr-4">Avg. Late (min)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analyticsData.attendanceIssues.map((employee) => (
                      <tr key={employee.id} className="border-b last:border-0 hover:bg-gray-50">
                        <td className="py-3 pl-4">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 overflow-hidden rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
                              {employee.name.charAt(0)}
                            </div>
                            <div>
                              <p className="font-medium">{employee.name}</p>
                              <p className="text-xs text-gray-500">{employee.position}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3">
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                              employee.lateCount > 5
                                ? "bg-red-100 text-red-800"
                                : employee.lateCount > 3
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-green-100 text-green-800"
                            }`}
                          >
                            {employee.lateCount}
                          </span>
                        </td>
                        <td className="py-3">
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                              employee.absenceCount > 3
                                ? "bg-red-100 text-red-800"
                                : employee.absenceCount > 1
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-green-100 text-green-800"
                            }`}
                          >
                            {employee.absenceCount}
                          </span>
                        </td>
                        <td className="py-3 pr-4">
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                              employee.avgLateMinutes > 30
                                ? "bg-red-100 text-red-800"
                                : employee.avgLateMinutes > 15
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-green-100 text-green-800"
                            }`}
                          >
                            {employee.avgLateMinutes} min
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex h-40 items-center justify-center text-gray-400">
                <p>No data available</p>
              </div>
            )}
          </div>
        </div>
      )}
      // Update the teams section to handle no data consistently
      {activeTab === "teams" && (
        <div className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg border bg-white p-6 shadow-sm">
              <h3 className="mb-1 text-sm font-medium text-gray-500">Total Teams</h3>
              {analyticsData?.summary?.totalTeams !== undefined ? (
                <p className="text-2xl font-bold">{analyticsData.summary.totalTeams}</p>
              ) : (
                <p className="text-lg text-gray-400">No data available</p>
              )}
            </div>
            <div className="rounded-lg border bg-white p-6 shadow-sm">
              <h3 className="mb-1 text-sm font-medium text-gray-500">Avg. Team Size</h3>
              {analyticsData?.summary?.avgTeamSize !== undefined ? (
                <p className="text-2xl font-bold">{analyticsData.summary.avgTeamSize}</p>
              ) : (
                <p className="text-lg text-gray-400">No data available</p>
              )}
            </div>
            <div className="rounded-lg border bg-white p-6 shadow-sm">
              <h3 className="mb-1 text-sm font-medium text-gray-500">Best Performing Team</h3>
              {analyticsData?.teamPerformance && analyticsData.teamPerformance.length > 0 ? (
                <p className="text-2xl font-bold">{analyticsData.teamPerformance[0].name}</p>
              ) : (
                <p className="text-lg text-gray-400">No data available</p>
              )}
            </div>
            <div className="rounded-lg border bg-white p-6 shadow-sm">
              <h3 className="mb-1 text-sm font-medium text-gray-500">Needs Improvement</h3>
              {analyticsData?.teamPerformance && analyticsData.teamPerformance.length > 1 ? (
                <p className="text-2xl font-bold">
                  {analyticsData.teamPerformance[analyticsData.teamPerformance.length - 1].name}
                </p>
              ) : (
                <p className="text-lg text-gray-400">No data available</p>
              )}
            </div>
          </div>

          <div className="rounded-lg border bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-lg font-medium">Team Performance</h3>
            {analyticsData?.teamPerformance && analyticsData.teamPerformance.length > 0 ? (
              <div className="space-y-6">
                {analyticsData.teamPerformance.map((team) => (
                  <div key={team.id} className="rounded-lg border p-4 hover:bg-gray-50">
                    <div className="mb-2 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
                          <Users size={18} />
                        </div>
                        <h4 className="font-medium">{team.name}</h4>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            team.score >= 80
                              ? "bg-green-100 text-green-800"
                              : team.score >= 60
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-red-100 text-red-800"
                          }`}
                        >
                          {team.score}/100
                        </span>
                      </div>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Task Completion</p>
                        <div className="mt-1 flex items-center gap-2">
                          <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
                            <div
                              className={`h-full rounded-full ${
                                team.taskCompletion.assigned > 0 &&
                                team.taskCompletion.completed / team.taskCompletion.assigned > 0.8
                                  ? "bg-green-500"
                                  : team.taskCompletion.assigned > 0 &&
                                      team.taskCompletion.completed / team.taskCompletion.assigned > 0.6
                                    ? "bg-yellow-500"
                                    : "bg-red-500"
                              }`}
                              style={{
                                width:
                                  team.taskCompletion.assigned > 0
                                    ? `${(team.taskCompletion.completed / team.taskCompletion.assigned) * 100}%`
                                    : "0%",
                              }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium">
                            {team.taskCompletion.assigned > 0
                              ? Math.round((team.taskCompletion.completed / team.taskCompletion.assigned) * 100)
                              : 0}
                            %
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-gray-500">
                          {team.taskCompletion.completed}/{team.taskCompletion.assigned} tasks completed
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Performance Score</p>
                        <div className="mt-1 flex items-center gap-2">
                          <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
                            <div
                              className={`h-full rounded-full ${
                                team.score >= 80 ? "bg-green-500" : team.score >= 60 ? "bg-yellow-500" : "bg-red-500"
                              }`}
                              style={{ width: `${team.score}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium">{team.score}/100</span>
                        </div>
                        <p className="mt-1 text-xs text-gray-500">
                          {team.score >= 80 ? "Excellent" : team.score >= 60 ? "Good" : "Needs Improvement"}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex h-40 items-center justify-center text-gray-400">
                <p>No data available</p>
              </div>
            )}
          </div>
        </div>
      )}
      // Update the salaries section to handle no data consistently
      {activeTab === "salaries" && (
        <div className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg border bg-white p-6 shadow-sm">
              <h3 className="mb-1 text-sm font-medium text-gray-500">Total Salary Budget</h3>
              {analyticsData?.summary?.totalSalaryBudget !== undefined ? (
                <p className="text-2xl font-bold">${analyticsData.summary.totalSalaryBudget.toLocaleString()}</p>
              ) : (
                <p className="text-lg text-gray-400">No data available</p>
              )}
            </div>
            <div className="rounded-lg border bg-white p-6 shadow-sm">
              <h3 className="mb-1 text-sm font-medium text-gray-500">Avg. Salary</h3>
              {analyticsData?.summary?.avgSalary !== undefined ? (
                <p className="text-2xl font-bold">${analyticsData.summary.avgSalary.toLocaleString()}</p>
              ) : (
                <p className="text-lg text-gray-400">No data available</p>
              )}
            </div>
            <div className="rounded-lg border bg-white p-6 shadow-sm">
              <h3 className="mb-1 text-sm font-medium text-gray-500">Total Employees</h3>
              {analyticsData?.summary?.totalEmployees !== undefined ? (
                <p className="text-2xl font-bold">{analyticsData.summary.totalEmployees}</p>
              ) : (
                <p className="text-lg text-gray-400">No data available</p>
              )}
            </div>
            <div className="rounded-lg border bg-white p-6 shadow-sm">
              <h3 className="mb-1 text-sm font-medium text-gray-500">Salary Ranges</h3>
              {analyticsData?.salaryDistribution && analyticsData.salaryDistribution.length > 0 ? (
                <p className="text-2xl font-bold">{analyticsData.salaryDistribution.length}</p>
              ) : (
                <p className="text-lg text-gray-400">No data available</p>
              )}
            </div>
          </div>

          <div className="rounded-lg border bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-lg font-medium">Salary Distribution</h3>
            {analyticsData?.salaryDistribution && analyticsData.salaryDistribution.length > 0 ? (
              <div className="h-64 w-full">
                <div className="flex h-full flex-col justify-center">
                  <div className="grid grid-cols-5 gap-4">
                    {(() => {
                      // Using an IIFE to calculate maxCount inside the JSX
                      const maxCount = Math.max(...analyticsData.salaryDistribution.map((d) => d.count))
                      const colors = ["bg-indigo-500", "bg-blue-500", "bg-cyan-500", "bg-teal-500", "bg-green-500"]

                      return analyticsData.salaryDistribution.map((data, i) => (
                        <div key={i} className="flex flex-col items-center">
                          <div className="flex h-40 w-full flex-col-reverse">
                            <div
                              className={`w-full rounded-t ${colors[i % colors.length]}`}
                              style={{ height: maxCount > 0 ? `${(data.count / maxCount) * 100}%` : "0%" }}
                            ></div>
                          </div>
                          <p className="mt-2 text-sm font-medium">{data.range}</p>
                          <p className="text-xs text-gray-500">{data.count} employees</p>
                        </div>
                      ))
                    })()}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex h-40 items-center justify-center text-gray-400">
                <p>No data available</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
