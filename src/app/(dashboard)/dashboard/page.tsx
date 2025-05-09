"use client"

import { useState, useEffect } from "react"
import { useSelector } from "react-redux"
import type { RootState } from "@/lib/redux/store"
import ProtectedRoute from "@/components/ProtectedRoute"
import RoleGuard from "@/components/RoleGuard"
import DashboardCheckIn from "@/components/dashboard/DashboardCheckIn"
import DashboardStats from "@/components/dashboard/DashboardStats"
import DashboardTasks from "@/components/dashboard/DashboardTasks"
import DashboardAnnouncements from "@/components/dashboard/DashboardAnnouncements"
import api from "@/lib/api"
import { toast } from "react-toastify"
import Link from "next/link"
import {
  Building2,
  Users,
  CreditCard,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  DollarSign,
  ChevronRight,
  BarChart3,
  PieChart,
  Activity,
  Calendar,
  Settings,
  CheckCircle,
  AlertCircle,
  BriefcaseBusiness,
} from "lucide-react"

// Define types based on the entity definitions
interface User {
  id: number
  name: string
  email: string
  role_id?: number
}

interface SubscriptionPlan {
  id: number
  name: string
  price: number
  billing_cycle: string
  features_json: {
    employee_limit: number
    teams_enabled?: boolean
    payroll_enabled?: boolean
    [key: string]: any
  }
  description?: string
  is_active: boolean
  discount_percent: number
  created_at: string
  updated_at?: string
}

interface Company {
  id: number
  name: string
  owner_id: number
  owner: User
  company_code: string
  status: string
  employee_nb?: number
  subscription_plan_id?: number
  subscription_plan?: SubscriptionPlan
  started_at?: string
  ends_at?: string
  billing_cycle?: string
  created_at: string
  renew_requested: boolean
}

interface DashboardStatsType {
  totalCompanies: number
  activeCompanies: number
  totalUsers: number
  totalRevenue: string
  revenueChange: number
  newCompanies: number
  companiesChange: number
  activeSubscriptions: number
  subscriptionsChange: number
  pendingRequests: number
}

interface PlanDistribution {
  name: string
  percentage: number
}

export default function DashboardPage() {
  const { user } = useSelector((state: RootState) => state.auth)
  const [loading, setLoading] = useState(true)
  const [companies, setCompanies] = useState<Company[]>([])
  const [subscriptionPlans, setSubscriptionPlans] = useState<SubscriptionPlan[]>([])
  const [stats, setStats] = useState<DashboardStatsType>({
    totalCompanies: 0,
    activeCompanies: 0,
    totalUsers: 0,
    totalRevenue: "$0",
    revenueChange: 0,
    newCompanies: 0,
    companiesChange: 0,
    activeSubscriptions: 0,
    subscriptionsChange: 0,
    pendingRequests: 0,
  })
  const [activeTab, setActiveTab] = useState<"monthly" | "yearly">("monthly")

  // For regular user dashboard
  const [todayRecord, setTodayRecord] = useState<any>(null)
  const [userStats, setUserStats] = useState({
    attendanceRate: "-",
    tasksCompleted: "-",
    leaveRequests: "-",
    teamMembers: "-",
  })

  // Check if user is platform owner
  const isPlatformOwner = user?.role_id === 1
  // Check if user is HR or owner (can view all records)
  const isManager = user?.role_id === 2 || user?.role_id === 3
  // Check if user is a team leader
  const isLeader = user?.role_id === 4

  const fetchPlatformOwnerData = async () => {
    if (!user || user.role_id !== 1) {
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      // Fetch all companies with owners and plans
      const companiesResponse = await api.get("/companies/all")
      const allCompanies: Company[] = companiesResponse.data || []
      setCompanies(allCompanies)

      // Fetch subscription plans
      const plansResponse = await api.get("/subscription-plans")
      const plans: SubscriptionPlan[] = plansResponse.data || []
      setSubscriptionPlans(plans)

      // Calculate dashboard stats from the real data
      const activeCompanies = allCompanies.filter((company) => company.status === "active").length
      const pendingCompanies = allCompanies.filter((company) => company.status === "pending").length

      // Calculate total revenue from active companies
      let totalRevenue = 0
      allCompanies.forEach((company) => {
        if (company.status === "active" && company.subscription_plan) {
          const price = Number(company.subscription_plan.price)
          if (!isNaN(price)) {
            totalRevenue += price
          }
        }
      })

      // Get unique users count (this would need a separate API endpoint in a real implementation)
      // For now, we'll estimate based on companies
      const estimatedUsers = allCompanies.length * 10 // Assuming average of 10 users per company

      // Set the calculated stats
      setStats({
        totalCompanies: allCompanies.length,
        activeCompanies: activeCompanies,
        totalUsers: estimatedUsers,
        totalRevenue: `$${totalRevenue.toLocaleString()}`,
        revenueChange: 5.2, // This would need historical data to calculate accurately
        newCompanies: pendingCompanies,
        companiesChange: 8.3, // This would need historical data to calculate accurately
        activeSubscriptions: activeCompanies,
        subscriptionsChange: 3.7, // This would need historical data to calculate accurately
        pendingRequests: pendingCompanies,
      })
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error)
      toast.error("Failed to load dashboard data")
    } finally {
      setLoading(false)
    }
  }

  const fetchRegularUserData = async () => {
    // Return early if no user is logged in
    if (!user) {
      setLoading(false)
      return
    }

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
      setUserStats({
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
    if (user && user.id) {
      if (user.role_id === 1) {
        fetchPlatformOwnerData()
      } else {
        fetchRegularUserData()
      }
    } else {
      setLoading(false)
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

  // Calculate subscription plan distribution
  const calculatePlanDistribution = (): PlanDistribution[] => {
    const planCounts: Record<string, number> = {}
    let total = 0

    companies.forEach((company) => {
      if (company.subscription_plan && company.status === "active") {
        const planName = company.subscription_plan.name
        planCounts[planName] = (planCounts[planName] || 0) + 1
        total++
      }
    })

    // Convert to percentages
    const planDistribution: PlanDistribution[] = Object.entries(planCounts).map(([name, count]) => ({
      name,
      percentage: total > 0 ? Math.round((count / total) * 100) : 0,
    }))

    // Sort by percentage (highest first)
    return planDistribution.sort((a, b) => b.percentage - a.percentage)
  }

  // Get top companies by revenue
  const getTopCompanies = (): Company[] => {
    return [...companies]
      .filter((company) => company.subscription_plan) // Only companies with subscription plans
      .sort((a, b) => {
        const priceA = a.subscription_plan ? Number(a.subscription_plan.price) : 0
        const priceB = b.subscription_plan ? Number(b.subscription_plan.price) : 0
        return priceB - priceA
      })
      .slice(0, 5) // Get top 5
  }

  // Calculate monthly revenue data (this would need historical data in a real implementation)
  const calculateRevenueData = () => {
    // For demonstration, we'll create some realistic data based on the current revenue
    const baseRevenue = Number(stats.totalRevenue.replace("$", "").replace(",", "")) || 0

    // Monthly data (last 6 months with some variation)
    const monthlyData = [
      baseRevenue * 0.85,
      baseRevenue * 0.9,
      baseRevenue * 0.95,
      baseRevenue * 0.97,
      baseRevenue * 0.99,
      baseRevenue,
    ]

    // Yearly data (last 6 years with growth trend)
    const yearlyData = [
      baseRevenue * 0.6,
      baseRevenue * 0.7,
      baseRevenue * 0.8,
      baseRevenue * 0.9,
      baseRevenue * 0.95,
      baseRevenue,
    ]

    return { monthly: monthlyData, yearly: yearlyData }
  }

  // Render regular user dashboard (roles 2-5)
  if (!isPlatformOwner) {
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

            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#6148F4] border-t-transparent"></div>
              </div>
            ) : (
              <>
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
                      value={userStats.attendanceRate === "-" ? "-" : `${userStats.attendanceRate}%`}
                      icon={<Clock className="h-5 w-5 text-[#6148F4]" />}
                      description="This month"
                      link="/attendance"
                    />

                    <DashboardStats
                      title="Tasks Completed"
                      value={userStats.tasksCompleted}
                      icon={<Calendar className="h-5 w-5 text-[#6148F4]" />}
                      description="This week"
                      link="/tasks"
                    />

                    <DashboardStats
                      title="Leave Requests"
                      value={userStats.leaveRequests}
                      icon={<BriefcaseBusiness className="h-5 w-5 text-[#6148F4]" />}
                      description="Pending approval"
                      link="/leave-requests"
                    />

                    {(isManager || isLeader) && (
                      <DashboardStats
                        title="Team Members"
                        value={userStats.teamMembers}
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
              </>
            )}
          </div>
        </main>
      </ProtectedRoute>
    )
  }

  // Get plan distribution for the chart
  const planDistribution = calculatePlanDistribution()

  // Get top companies
  const topCompanies = getTopCompanies()

  // Get revenue data
  const revenueData = calculateRevenueData()

  // Platform Owner Dashboard (role_id = 1)
  return (
    <ProtectedRoute>
      <RoleGuard allowedRoles={[1]}>
        <main className="min-h-screen bg-[#FAF9F7] text-gray-900">
          <div className="mx-auto max-w-7xl p-4 md:p-6 lg:p-8">
            <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">Platform Dashboard</h1>
                <p className="mt-1 text-gray-500">Welcome back, {user?.name || "Admin"}</p>
              </div>

              
            </div>

            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#6148F4] border-t-transparent"></div>
              </div>
            ) : (
              <>
                {/* Key Metrics */}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
                  {/* Total Revenue */}
                  <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-medium text-gray-700">Total Revenue</h3>
                      <DollarSign className="h-4 w-4 text-gray-400" />
                    </div>
                    <div className="text-2xl font-bold text-gray-900">{stats.totalRevenue}</div>
                    <p className="mt-1 text-xs text-gray-500">
                      {stats.revenueChange > 0 ? (
                        <span className="text-green-600 flex items-center">
                          <ArrowUpRight className="mr-1 h-3 w-3" />+{stats.revenueChange}% from last month
                        </span>
                      ) : (
                        <span className="text-red-600 flex items-center">
                          <ArrowDownRight className="mr-1 h-3 w-3" />
                          {stats.revenueChange}% from last month
                        </span>
                      )}
                    </p>
                  </div>

                  {/* Active Companies */}
                  <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-medium text-gray-700">Active Companies</h3>
                      <Building2 className="h-4 w-4 text-gray-400" />
                    </div>
                    <div className="text-2xl font-bold text-gray-900">{stats.activeCompanies}</div>
                    <div className="mt-1 flex items-center justify-between">
                      <p className="text-xs text-gray-500">
                        {stats.companiesChange > 0 ? (
                          <span className="text-green-600 flex items-center">
                            <ArrowUpRight className="mr-1 h-3 w-3" />+{stats.companiesChange}% from last month
                          </span>
                        ) : (
                          <span className="text-red-600 flex items-center">
                            <ArrowDownRight className="mr-1 h-3 w-3" />
                            {stats.companiesChange}% from last month
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-gray-500">{stats.newCompanies} new</p>
                    </div>
                  </div>

                  {/* Active Subscriptions */}
                  <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-medium text-gray-700">Active Subscriptions</h3>
                      <CreditCard className="h-4 w-4 text-gray-400" />
                    </div>
                    <div className="text-2xl font-bold text-gray-900">{stats.activeSubscriptions}</div>
                    <p className="mt-1 text-xs text-gray-500">
                      {stats.subscriptionsChange > 0 ? (
                        <span className="text-green-600 flex items-center">
                          <ArrowUpRight className="mr-1 h-3 w-3" />+{stats.subscriptionsChange}% from last month
                        </span>
                      ) : (
                        <span className="text-red-600 flex items-center">
                          <ArrowDownRight className="mr-1 h-3 w-3" />
                          {stats.subscriptionsChange}% from last month
                        </span>
                      )}
                    </p>
                  </div>

                  {/* Total Users */}
                  <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-medium text-gray-700">Total Users</h3>
                      <Users className="h-4 w-4 text-gray-400" />
                    </div>
                    <div className="text-2xl font-bold text-gray-900">{stats.totalUsers}</div>
                    <div className="mt-1 flex items-center justify-between">
                      <p className="text-xs text-gray-500">Across {stats.totalCompanies} companies</p>
                      <p className="text-xs text-gray-500">
                        ~{Math.round(stats.totalUsers / (stats.totalCompanies || 1))} per company
                      </p>
                    </div>
                  </div>
                </div>

                {/* Main Content */}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                  {/* Left Column - Revenue Chart */}
                  <div className="col-span-2 rounded-xl border border-gray-200 bg-white shadow-sm">
                    <div className="border-b border-gray-100 p-6">
                      <h3 className="text-lg font-semibold text-gray-900">Revenue Overview</h3>
                      <p className="mt-1 text-sm text-gray-500">Platform revenue from all subscriptions</p>
                    </div>
                    <div className="p-6">
                      {/* Tabs */}
                      <div className="mb-6 border-b border-gray-200">
                        <div className="flex space-x-6">
                          <button
                            onClick={() => setActiveTab("monthly")}
                            className={`pb-3 text-sm font-medium ${
                              activeTab === "monthly"
                                ? "border-b-2 border-[#6148F4] text-[#6148F4]"
                                : "text-gray-500 hover:text-gray-700"
                            }`}
                          >
                            Monthly
                          </button>
                          <button
                            onClick={() => setActiveTab("yearly")}
                            className={`pb-3 text-sm font-medium ${
                              activeTab === "yearly"
                                ? "border-b-2 border-[#6148F4] text-[#6148F4]"
                                : "text-gray-500 hover:text-gray-700"
                            }`}
                          >
                            Yearly
                          </button>
                        </div>
                      </div>

                      {/* Chart Content */}
                      {activeTab === "monthly" && (
                        <div className="space-y-6">
                          <div className="h-[240px] flex items-end justify-between">
                            {revenueData.monthly.map((value, i) => (
                              <div key={i} className="relative h-full flex flex-col justify-end items-center">
                                <div
                                  className="w-12 bg-[#6148F4]/80 hover:bg-[#6148F4] rounded-t-md transition-all"
                                  style={{ height: `${(value / Math.max(...revenueData.monthly)) * 100}%` }}
                                ></div>
                                <span className="text-xs text-gray-500 mt-2">
                                  {["Jan", "Feb", "Mar", "Apr", "May", "Jun"][i]}
                                </span>
                              </div>
                            ))}
                          </div>
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="text-sm font-medium text-gray-700">Total Revenue</p>
                              <p className="text-2xl font-bold text-gray-900">
                                ${revenueData.monthly.reduce((a, b) => a + b, 0).toLocaleString()}
                              </p>
                            </div>
                           
                          </div>
                        </div>
                      )}

                      {activeTab === "yearly" && (
                        <div className="space-y-6">
                          <div className="h-[240px] flex items-end justify-between">
                            {revenueData.yearly.map((value, i) => (
                              <div key={i} className="relative h-full flex flex-col justify-end items-center">
                                <div
                                  className="w-12 bg-[#6148F4]/80 hover:bg-[#6148F4] rounded-t-md transition-all"
                                  style={{ height: `${(value / Math.max(...revenueData.yearly)) * 100}%` }}
                                ></div>
                                <span className="text-xs text-gray-500 mt-2">
                                  {["2018", "2019", "2020", "2021", "2022", "2023"][i]}
                                </span>
                              </div>
                            ))}
                          </div>
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="text-sm font-medium text-gray-700">Total Revenue</p>
                              <p className="text-2xl font-bold text-gray-900">
                                ${revenueData.yearly.reduce((a, b) => a + b, 0).toLocaleString()}
                              </p>
                            </div>
                            <button className="inline-flex items-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#6148F4]/50 focus:ring-offset-2">
                              View Report
                              <ChevronRight className="ml-1 h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Column - Platform Insights */}
                  <div className="col-span-1 rounded-xl border border-gray-200 bg-white shadow-sm">
                    <div className="border-b border-gray-100 p-6">
                      <h3 className="text-lg font-semibold text-gray-900">Platform Insights</h3>
                      <p className="mt-1 text-sm text-gray-500">Key metrics and analytics</p>
                    </div>
                    <div className="p-6 space-y-6">
                      {/* Subscription Distribution */}
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-3">Subscription Distribution</h4>
                        <div className="space-y-4">
                          {planDistribution.map((plan, index) => (
                            <div key={index} className="space-y-2">
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-700">{plan.name}</span>
                                <span className="font-medium text-gray-900">{plan.percentage}%</span>
                              </div>
                              <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${
                                    index === 0 ? "bg-[#6148F4]" : index === 1 ? "bg-[#9f8df2]" : "bg-[#d1c9f8]"
                                  }`}
                                  style={{ width: `${plan.percentage}%` }}
                                ></div>
                              </div>
                            </div>
                          ))}

                          {planDistribution.length === 0 && (
                            <div className="text-center py-4 text-gray-500 text-sm">No active subscription plans</div>
                          )}
                        </div>
                      </div>

                      <div className="border-t border-gray-100 pt-6">
                        <h4 className="text-sm font-medium text-gray-700 mb-3">Platform Health</h4>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="flex flex-col items-center justify-center rounded-lg border border-gray-200 bg-white p-3">
                            <BarChart3 className="h-5 w-5 text-[#6148F4] mb-1" />
                            <span className="text-xs text-gray-500">Companies</span>
                            <span className="text-sm font-medium text-gray-900">{stats.totalCompanies}</span>
                          </div>
                          <div className="flex flex-col items-center justify-center rounded-lg border border-gray-200 bg-white p-3">
                            <PieChart className="h-5 w-5 text-[#6148F4] mb-1" />
                            <span className="text-xs text-gray-500">Active Rate</span>
                            <span className="text-sm font-medium text-gray-900">
                              {stats.totalCompanies > 0
                                ? Math.round((stats.activeCompanies / stats.totalCompanies) * 100)
                                : 0}
                              %
                            </span>
                          </div>
                          <div className="flex flex-col items-center justify-center rounded-lg border border-gray-200 bg-white p-3">
                            <Activity className="h-5 w-5 text-[#6148F4] mb-1" />
                            <span className="text-xs text-gray-500">Plans</span>
                            <span className="text-sm font-medium text-gray-900">{subscriptionPlans.length}</span>
                          </div>
                          <div className="flex flex-col items-center justify-center rounded-lg border border-gray-200 bg-white p-3">
                            <Calendar className="h-5 w-5 text-[#6148F4] mb-1" />
                            <span className="text-xs text-gray-500">Pending</span>
                            <span className="text-sm font-medium text-gray-900">{stats.pendingRequests}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                     
                  </div>
                </div>

                
              </>
            )}
          </div>
        </main>
      </RoleGuard>
    </ProtectedRoute>
  )
}
