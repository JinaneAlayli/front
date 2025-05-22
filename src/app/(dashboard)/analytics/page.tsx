"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "react-toastify"
import { useSelector } from "react-redux"
import type { RootState } from "@/lib/redux/store"
import api from "@/lib/api"
import { BarChart3, Clock, Users, TrendingUp, Download } from "lucide-react"

// Import components
import PerformanceTab from "@/components/analytics/performance-tab"
import AttendanceTab from "@/components/analytics/attendance-tab"
import TeamsTab from "@/components/analytics/teams-tab"
import SalariesTab from "@/components/analytics/salaries-tab"

// Import types
import type {
  AnalyticsData,
  Task,
  ApiUser,
  AttendanceRecord,
  Team,
  Salary,
  UserTaskData,
  UserAttendanceData,
  EmployeePerformance,
} from "@/types/analytics"

export default function AnalyticsPage() {
  const router = useRouter()
  const { user } = useSelector((state: RootState) => state.auth)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("performance")
  const [timeRange, setTimeRange] = useState("month")
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    summary: {},
  })
  const [allTasks, setAllTasks] = useState<Task[]>([])
  const [allUsers, setAllUsers] = useState<ApiUser[]>([])

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
      const summary: Partial<AnalyticsData["summary"]> = {}
      const analyticsData: AnalyticsData = { summary }

      // Fetch users data to get employees from the same company
      const usersResponse = await api.get("/users")
      const allUsers: ApiUser[] = usersResponse.data
      setAllUsers(allUsers)

      // Filter users by company_id to get only employees from the same company
      const companyUsers = allUsers.filter((u) => u.company_id === user?.company_id)
      summary.totalEmployees = companyUsers.length

      // Fetch tasks data for the company
      const tasksResponse = await api.get("/tasks")
      const allTasks: Task[] = tasksResponse.data
      setAllTasks(allTasks)

      // Filter tasks by assigned_to users in the company
      const companyUserIds = companyUsers.map((u) => u.id)
      const companyTasks = allTasks.filter(
        (task) => companyUserIds.includes(task.user_id) || companyUserIds.includes(task.created_by),
      )

      summary.totalTasks = companyTasks.length
      summary.completedTasks = companyTasks.filter((task) => task.completed).length
      summary.pendingTasks = companyTasks.filter((task) => !task.completed).length

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
            tasksCreated: 0,
            tasksCompleted: 0,
            completedBy: [],
          })
        }
      })

      // Calculate task metrics for each user
      companyTasks.forEach((task) => {
        // Track tasks assigned to users
        if (task.user_id && userTaskMap.has(task.user_id)) {
          const userData = userTaskMap.get(task.user_id)!
          userData.total++

          if (task.completed) {
            userData.completed++

            // Check if task was completed on time or late
            const dueDate = task.due_date ? new Date(task.due_date) : null
            const completedDate = new Date(task.created_at)

            if (dueDate && completedDate > dueDate) {
              userData.late++
            } else {
              userData.onTime++
            }
          } else {
            userData.pending++
          }
        }

        // Track tasks created by users
        if (task.created_by && userTaskMap.has(task.created_by)) {
          const userData = userTaskMap.get(task.created_by)!
          userData.tasksCreated++

          // If the task is completed and was created by this user, count it as completed by them
          if (task.completed) {
            userData.tasksCompleted++
          }
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

        const userData = userAttendanceMap.get(record.user_id)!
        userData.presentCount++

        // Check if check-in was late
        const checkInTime = new Date(`2023-01-01T${record.check_in}`)
        const workStartHour = 9

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
        const checkInTime = new Date(`2023-01-01T${record.check_in}`)
        const workStartHour = 9 // Assuming work starts at 9 AM
        return (
          checkInTime.getHours() > workStartHour ||
          (checkInTime.getHours() === workStartHour && checkInTime.getMinutes() > 0)
        )
      }).length

      // Create employee performance array
      const employeePerformance = companyUsers
        .filter((user) => user.id)
        .map((user) => {
          const taskData = userTaskMap.get(user.id!)
          const attendanceData = userAttendanceMap.get(user.id!)

          if (!taskData || !attendanceData) {
            return null
          }

          // Calculate completion rate
          const completionRate = taskData.total > 0 ? Math.round((taskData.completed / taskData.total) * 100) : 0

          // Calculate on-time completion rate
          const onTimeRate = taskData.completed > 0 ? Math.round((taskData.onTime / taskData.completed) * 100) : 0

          // Calculate attendance rate
          const attendanceRate =
            attendanceData.totalDays > 0
              ? Math.round((attendanceData.presentCount / attendanceData.totalDays) * 100)
              : 0

          // Calculate overall performance score (weighted average)
          const taskWeight = 0.5
          const attendanceWeight = 0.3
          const onTimeWeight = 0.2

          const overallScore = Math.round(
            completionRate * taskWeight + attendanceRate * attendanceWeight + onTimeRate * onTimeWeight,
          )

          return {
            id: user.id!,
            name: user.name || "Unknown User",
            position: user.position || "Employee",
            avatar: user.profile_img || undefined,
            tasksCompleted: taskData.completed,
            tasksTotal: taskData.total,
            completionRate,
            onTimeCompletion: onTimeRate,
            lateCompletion: taskData.late,
            attendanceRate,
            lateArrivals: attendanceData.lateCount,
            overallScore,
          }
        })
        .filter(Boolean) as EmployeePerformance[]

      // Sort employee performance by overall score (descending)
      analyticsData.employeePerformance = employeePerformance.sort((a, b) => b.overallScore - a.overallScore)

      // Create attendance issues array
      const attendanceIssues = companyUsers
        .filter((user) => user.id && userAttendanceMap.has(user.id))
        .map((user) => {
          const data = userAttendanceMap.get(user.id!)!

          return {
            id: user.id!,
            name: user.name || "Unknown User", // Use name directly
            position: user.position || "Employee",
            avatar: user.profile_img || undefined, // Use profile_img instead of avatar_url
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
        const teamMembers = companyUsers.filter((user) => user.team_id === team.id).map((user) => user.id!)
        const teamTasks = companyTasks.filter((task) => task.user_id && teamMembers.includes(task.user_id))
        const assigned = teamTasks.length
        const completed = teamTasks.filter((task) => task.completed).length

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
        const totalSalary = companySalaries.reduce((sum, salary) => {
          // Calculate total salary (base + bonus + overtime - deductions)
          const total =
            Number(salary.base_salary || 0) +
            Number(salary.bonus || 0) +
            Number(salary.overtime || 0) -
            Number(salary.deductions || 0)
          return sum + total
        }, 0)

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
          // Count employees with base_salary in this range
          const count = companySalaries.filter((salary) => {
            const baseSalary = Number(salary.base_salary || 0)
            return baseSalary >= range.min && baseSalary < range.max
          }).length

          return {
            range: range.label,
            count,
          }
        })

        analyticsData.salaryDistribution = salaryDistribution

        // Process salary data for the new visualizations
        const salaryData = {
          allSalaries: companySalaries,
          departmentSalaries: [] as { department: string; avgSalary: number; count: number }[],
          topEarners: [] as Salary[],
          compensationBreakdown: {
            baseSalary: 0,
            bonus: 0,
            overtime: 0,
            deductions: 0,
            total: 0,
          },
          monthlySalaries: [] as { month: number; year: number; avgSalary: number }[],
        }

        // Calculate compensation breakdown
        let totalBaseSalary = 0
        let totalBonus = 0
        let totalOvertime = 0
        let totalDeductions = 0

        companySalaries.forEach((salary) => {
          totalBaseSalary += Number(salary.base_salary || 0)
          totalBonus += Number(salary.bonus || 0)
          totalOvertime += Number(salary.overtime || 0)
          totalDeductions += Number(salary.deductions || 0)
        })

        salaryData.compensationBreakdown = {
          baseSalary: totalBaseSalary,
          bonus: totalBonus,
          overtime: totalOvertime,
          deductions: totalDeductions,
          total: totalBaseSalary + totalBonus + totalOvertime - totalDeductions,
        }

        // Get top earners
        salaryData.topEarners = [...companySalaries]
          .sort((a, b) => {
            const totalA =
              Number(a.base_salary || 0) + Number(a.bonus || 0) + Number(a.overtime || 0) - Number(a.deductions || 0)
            const totalB =
              Number(b.base_salary || 0) + Number(b.bonus || 0) + Number(b.overtime || 0) - Number(b.deductions || 0)
            return totalB - totalA
          })
          .slice(0, 5)

        // Group salaries by department/team
        const departmentMap = new Map<number, { totalSalary: number; count: number; name: string }>()

        companySalaries.forEach((salary) => {
          const employee = companyUsers.find((u) => u.id === salary.user_id)
          if (!employee || !employee.team_id) return

          const totalSalary =
            Number(salary.base_salary || 0) +
            Number(salary.bonus || 0) +
            Number(salary.overtime || 0) -
            Number(salary.deductions || 0)

          if (!departmentMap.has(employee.team_id)) {
            const team = companyTeams.find((t) => t.id === employee.team_id)
            departmentMap.set(employee.team_id, {
              totalSalary,
              count: 1,
              name: team ? team.name : `Team ${employee.team_id}`,
            })
          } else {
            const dept = departmentMap.get(employee.team_id)!
            dept.totalSalary += totalSalary
            dept.count += 1
          }
        })

        departmentMap.forEach((value, key) => {
          salaryData.departmentSalaries.push({
            department: value.name,
            avgSalary: Math.round(value.totalSalary / value.count),
            count: value.count,
          })
        })

        // Sort departments by average salary
        salaryData.departmentSalaries.sort((a, b) => b.avgSalary - a.avgSalary)

        // Group salaries by month to show trends
        const monthlyMap = new Map<string, { totalSalary: number; count: number; month: number; year: number }>()

        companySalaries.forEach((salary) => {
          if (!salary.month || !salary.year) return

          const key = `${salary.year}-${salary.month}`
          const totalSalary =
            Number(salary.base_salary || 0) +
            Number(salary.bonus || 0) +
            Number(salary.overtime || 0) -
            Number(salary.deductions || 0)

          if (!monthlyMap.has(key)) {
            monthlyMap.set(key, {
              totalSalary,
              count: 1,
              month: salary.month,
              year: salary.year,
            })
          } else {
            const monthData = monthlyMap.get(key)!
            monthData.totalSalary += totalSalary
            monthData.count += 1
          }
        })

        monthlyMap.forEach((value, key) => {
          salaryData.monthlySalaries!.push({
            month: value.month,
            year: value.year,
            avgSalary: Math.round(value.totalSalary / value.count),
          })
        })

        // Sort monthly salaries by date
        salaryData.monthlySalaries!.sort((a, b) => {
          if (a.year !== b.year) return a.year - b.year
          return a.month - b.month
        })

        analyticsData.salaryData = salaryData
      } catch (error) {
        console.error("Failed to fetch salary data:", error)
        // Continue with other data if salary data fails
      }

      // Fetch business settings
      try {
        const businessSettingsResponse = await api.get("/business-settings/me")
        analyticsData.businessSettings = businessSettingsResponse.data
      } catch (error) {
        console.error("Failed to fetch business settings:", error)
        // Continue with other data if business settings fetch fails
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

  // Simple currency formatter
  const formatCurrency = (amount: number) => {
    const currency = analyticsData.businessSettings?.currency || "USD"
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  // Calculate percentage for compensation breakdown
  const getCompensationPercentage = (value: number, total: number) => {
    if (!total) return 0
    return Math.round((value / total) * 100)
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

      {/* Render the appropriate tab component based on activeTab */}
      {activeTab === "performance" && (
        <PerformanceTab analyticsData={analyticsData} tasks={allTasks} users={allUsers} />
      )}

      {activeTab === "attendance" && <AttendanceTab analyticsData={analyticsData} />}

      {activeTab === "teams" && <TeamsTab analyticsData={analyticsData} />}

      {activeTab === "salaries" && (
        <SalariesTab
          analyticsData={analyticsData}
          formatCurrency={formatCurrency}
          getCompensationPercentage={getCompensationPercentage}
        />
      )}
    </div>
  )
}
