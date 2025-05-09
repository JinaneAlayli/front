"use client"

import { useState, useEffect,useRef  } from "react"
import { useSelector } from "react-redux"
import type { RootState } from "@/lib/redux/store"
import ProtectedRoute from "@/components/ProtectedRoute"
import AttendanceRecords from "@/components/attendance/AttendanceRecords"
import AttendanceStats from "@/components/attendance/AttendanceStats"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/custom-tabs"
import api from "@/lib/api"
import { toast } from "react-toastify"
import { Users, BarChart3, ArrowLeft } from "lucide-react"
import Link from "next/link"
 import { useRouter } from "next/navigation"


export default function AttendancePage() {
  const { user } = useSelector((state: RootState) => state.auth)
  const [attendanceRecords, setAttendanceRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [activeTab, setActiveTab] = useState("records")

const router = useRouter()
  const isManager = user?.role_id === 2 || user?.role_id === 3
  const hasShownToast = useRef(false)
  const isLeader = user?.role_id === 4 

  const fetchAttendanceRecords = async () => {
    setLoading(true)
    setError("")
    try {
      // Use the only available endpoint for attendance records
      const res = await api.get("/attendance")
 
      const filteredRecords = isManager
  ? res.data
  : res.data.filter((record: any) => record.user_id === user?.id)


      setAttendanceRecords(filteredRecords)
    } catch (error: any) {
      console.error("Failed to fetch attendance records:", error)

      if (error.response?.status === 403) {
        setError(
          "You don't have permission to access attendance records. This feature may not be available for your role.",
        )
      } else if (error.response?.status === 404) {
        setError("The attendance records endpoint was not found. Please check your API configuration.")
      } else {
        setError("Failed to load attendance records. Please try again later.")
        toast.error("Failed to fetch attendance records")
      }

      // Set empty array to avoid errors in child components
      setAttendanceRecords([])
    } finally {
      setLoading(false)
    }
  }

useEffect(() => {
  if (user?.role_id === 1 && !hasShownToast.current) {
    hasShownToast.current = true
    toast.error("Superadmin is not allowed to view attendance.")
    router.push("/dashboard")
    return
  }

  if (user?.role_id !== 1) {
    fetchAttendanceRecords()
  }
}, [user])
  return (
    <ProtectedRoute>
      <main className="min-h-screen bg-[#FAF9F7] text-gray-900">
        <div className="mx-auto max-w-7xl p-4 md:p-6 lg:p-8">
          <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <div className="flex items-center">
               
                <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">Attendance Records</h1>
              </div>
              <p className="mt-1 text-gray-500">
                {isManager
                  ? "View and manage attendance records for all employees"
                  : isLeader
                    ? "View attendance records for your team"
                    : "View your attendance history"}
              </p>
            </div>
          </div>

          {error ? (
            <div className="rounded-xl border border-red-100 bg-red-50 p-6 text-center">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 text-red-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="mb-2 text-lg font-medium text-red-800">Access Error</h3>
              <p className="text-red-700">{error}</p>
              <div className="mt-6">
                <Link
                  href="/"
                  className="inline-flex items-center rounded-lg bg-red-600 px-4 py-2 text-white transition-colors hover:bg-red-700"
                >
                  <ArrowLeft size={16} className="mr-2" />
                  Return to Dashboard
                </Link>
              </div>
            </div>
          ) : (
            <Tabs defaultValue="records" onChange={setActiveTab} className="space-y-6">
              <TabsList className="w-full max-w-md">
                <TabsTrigger value="records" className="flex items-center gap-2">
                  <Users size={16} />
                  <span className="hidden sm:inline">Records</span>
                </TabsTrigger>
                <TabsTrigger value="stats" className="flex items-center gap-2">
                  <BarChart3 size={16} />
                  <span className="hidden sm:inline">Statistics</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="records" className="space-y-6">
                <AttendanceRecords
                  records={attendanceRecords}
                  loading={loading}
                  isManager={isManager}
                  isLeader={isLeader}
                  userId={user?.id}
                />
              </TabsContent>

              <TabsContent value="stats" className="space-y-6">
                <AttendanceStats
                  records={attendanceRecords}
                  loading={loading}
                  isManager={isManager}
                  isLeader={isLeader}
                  userId={user?.id}
                />
              </TabsContent>
            </Tabs>
          )}
        </div>
      </main>
    </ProtectedRoute>
  )
}
