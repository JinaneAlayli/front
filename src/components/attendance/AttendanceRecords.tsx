"use client"

import { useState, useEffect } from "react"
import { Calendar, Clock, LogIn, LogOut, Search, Filter, MapPin, AlertCircle } from "lucide-react"
import LocationDisplay from "./LocationDisplay"
import businessSettingsService from "@/lib/services/business-settings.service"
import type { BusinessSettings } from "@/lib/services/business-settings.service"

interface AttendanceRecordsProps {
  records: any[]
  loading: boolean
  isManager: boolean
  isLeader: boolean
  userId: number | undefined
}

export default function AttendanceRecords({ records, loading, isManager, isLeader, userId }: AttendanceRecordsProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState({
    status: "",
    date: "",
    employee: "",
    month: "",
    year: "",
  })
  const [businessSettings, setBusinessSettings] = useState<BusinessSettings | null>(null)
  const [settingsLoading, setSettingsLoading] = useState(true)

  // Fix the useEffect hook to prevent infinite updates
  // Replace the existing useEffect for fetching settings with this:

  useEffect(() => {
    let isMounted = true

    const fetchSettings = async () => {
      setSettingsLoading(true)
      try {
        const settings = await businessSettingsService.getSettings()
        if (isMounted) {
          setBusinessSettings(settings)
        }
      } catch (error) {
        console.error("Failed to load business settings:", error)
      } finally {
        if (isMounted) {
          setSettingsLoading(false)
        }
      }
    }

    fetchSettings()

    // Subscribe to settings changes
    const unsubscribe = businessSettingsService.subscribe(() => {
      if (isMounted) {
        businessSettingsService.getSettings().then((settings) => {
          if (isMounted) {
            setBusinessSettings(settings)
          }
        })
      }
    })

    return () => {
      isMounted = false
      unsubscribe()
    }
  }, [])

  // Format time from "HH:MM:SS" to "HH:MM AM/PM"
  const formatTime = (timeString: string) => {
    if (!timeString) return "-"
    const [hours, minutes] = timeString.split(":")
    const hour = Number.parseInt(hours, 10)
    const ampm = hour >= 12 ? "PM" : "AM"
    const hour12 = hour % 12 || 12
    return `${hour12}:${minutes} ${ampm}`
  }

  // Format date from "YYYY-MM-DD" to "Month DD, YYYY"
  const formatDate = (dateString: string) => {
    if (!dateString) return "-"
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  // Determine if check-in is late based on business settings
  const isLate = (checkInTime: string) => {
    if (!businessSettings || !checkInTime) return false

    const [workHours, workMinutes] = businessSettings.workday_start.split(":").map(Number)
    const [checkHours, checkMinutes] = checkInTime.split(":").map(Number)

    if (checkHours > workHours) return true
    if (checkHours === workHours && checkMinutes > workMinutes + 15) return true // 15 min grace period

    return false
  }

  // Determine if day is incomplete (early checkout)
  const isIncompleteDay = (checkInTime: string, checkOutTime: string) => {
    if (!businessSettings || !checkInTime || !checkOutTime) return false

    const [workEndHours, workEndMinutes] = businessSettings.workday_end.split(":").map(Number)
    const [checkOutHours, checkOutMinutes] = checkOutTime.split(":").map(Number)

    // Check if checkout is before workday end
    if (checkOutHours < workEndHours) return true
    if (checkOutHours === workEndHours && checkOutMinutes < workEndMinutes) return true

    return false
  }

  // Get attendance status with business rules
  const getAttendanceStatus = (record: any) => {
    if (record.status === "absent") return "absent"

    if (!record.check_in) return "absent"

    if (isLate(record.check_in)) {
      return "late"
    }

    if (isIncompleteDay(record.check_in, record.check_out)) {
      return "incomplete"
    }

    return "present"
  }

  // Filter records based on search term and filters
  const filteredRecords = records.filter((record) => {
    // Filter by user role
    if (!isManager && !isLeader && record.user_id !== userId) {
      return false
    }

    // Filter by employee (for managers/leaders)
    if (filters.employee && record.user_id !== Number(filters.employee)) {
      return false
    }

    // Filter by month
    if (filters.month && !record.date.includes(`-${filters.month}-`)) {
      return false
    }

    // Filter by year
    if (filters.year && !record.date.startsWith(filters.year)) {
      return false
    }

    // Filter by search term
    const searchLower = searchTerm.toLowerCase()
    const matchesSearch =
      searchTerm === "" ||
      (record.user?.name && record.user.name.toLowerCase().includes(searchLower)) ||
      (record.user?.email && record.user.email.toLowerCase().includes(searchLower)) ||
      record.date.includes(searchLower) ||
      record.status.toLowerCase().includes(searchLower)

    // Filter by status
    const matchesStatus = filters.status === "" || record.status === filters.status

    // Filter by date
    const matchesDate = filters.date === "" || record.date === filters.date

    return matchesSearch && matchesStatus && matchesDate
  })

  // Get unique dates for the date filter
  const uniqueDates = [...new Set(records.map((record) => record.date))].sort().reverse()

  return (
    <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
      <div className="border-b border-gray-100 bg-gray-50 px-6 py-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm font-medium text-gray-700">
            {filteredRecords.length} {filteredRecords.length === 1 ? "record" : "records"} found
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center rounded-lg bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
            >
              <Filter size={16} className="mr-1.5 text-gray-500" />
              Filters
            </button>
          </div>
        </div>

        {showFilters && (
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {/* Search input */}
            <div className="relative sm:col-span-2 lg:col-span-1">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search records..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-4 text-sm text-gray-900 shadow-sm transition-all focus:border-[#6148F4] focus:outline-none focus:ring-2 focus:ring-[#6148F4]/20"
              />
            </div>

            {/* Employee filter - only for managers/leaders */}
            {(isManager || isLeader) && (
              <div>
                <label htmlFor="employee-filter" className="mb-1 block text-xs font-medium text-gray-700">
                  Employee
                </label>
                <select
                  id="employee-filter"
                  value={filters.employee || ""}
                  onChange={(e) => setFilters({ ...filters, employee: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-[#6148F4] focus:outline-none focus:ring-1 focus:ring-[#6148F4]/50"
                >
                  <option value="">All Employees</option>
                  {/* Get unique employees from records */}
                  {Array.from(new Set(records.map((record) => record.user_id)))
                    .map((userId) => {
                      const user = records.find((r) => r.user_id === userId)?.user
                      return user ? (
                        <option key={userId} value={userId}>
                          {user.name || user.email || `User #${userId}`}
                        </option>
                      ) : null
                    })
                    .filter(Boolean)}
                </select>
              </div>
            )}

            {/* Status filter */}
            <div>
              <label htmlFor="status-filter" className="mb-1 block text-xs font-medium text-gray-700">
                Status
              </label>
              <select
                id="status-filter"
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-[#6148F4] focus:outline-none focus:ring-1 focus:ring-[#6148F4]/50"
              >
                <option value="">All Statuses</option>
                <option value="present">Present</option>
                <option value="late">Late</option>
                <option value="incomplete">Incomplete</option>
                <option value="absent">Absent</option>
              </select>
            </div>

            {/* Month filter */}
            <div>
              <label htmlFor="month-filter" className="mb-1 block text-xs font-medium text-gray-700">
                Month
              </label>
              <select
                id="month-filter"
                value={filters.month || ""}
                onChange={(e) => setFilters({ ...filters, month: e.target.value })}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-[#6148F4] focus:outline-none focus:ring-1 focus:ring-[#6148F4]/50"
              >
                <option value="">All Months</option>
                <option value="01">January</option>
                <option value="02">February</option>
                <option value="03">March</option>
                <option value="04">April</option>
                <option value="05">May</option>
                <option value="06">June</option>
                <option value="07">July</option>
                <option value="08">August</option>
                <option value="09">September</option>
                <option value="10">October</option>
                <option value="11">November</option>
                <option value="12">December</option>
              </select>
            </div>

            {/* Year filter */}
            <div>
              <label htmlFor="year-filter" className="mb-1 block text-xs font-medium text-gray-700">
                Year
              </label>
              <select
                id="year-filter"
                value={filters.year || ""}
                onChange={(e) => setFilters({ ...filters, year: e.target.value })}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-[#6148F4] focus:outline-none focus:ring-1 focus:ring-[#6148F4]/50"
              >
                <option value="">All Years</option>
                {/* Get unique years from records */}
                {Array.from(new Set(records.map((record) => record.date.substring(0, 4))))
                  .sort((a, b) => b.localeCompare(a)) // Sort years in descending order
                  .map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
              </select>
            </div>

            {/* Clear filters button */}
            <div className="flex items-end sm:col-span-2 lg:col-span-3">
              <button
                onClick={() => {
                  setFilters({ status: "", date: "", employee: "", month: "", year: "" })
                  setSearchTerm("")
                }}
                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
              >
                Clear Filters
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="overflow-x-auto">
        {loading || settingsLoading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#6148F4] border-t-transparent"></div>
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center p-6 text-center">
            <div className="mb-2 rounded-full bg-gray-100 p-3">
              <Calendar className="h-6 w-6 text-gray-400" />
            </div>
            <h3 className="text-sm font-medium text-gray-900">No attendance records found</h3>
            <p className="mt-1 text-xs text-gray-500">
              {searchTerm || filters.status || filters.date
                ? "Try adjusting your filters"
                : "Records will appear here once available"}
            </p>
          </div>
        ) : (
          <table className="w-full table-auto">
            <thead>
              <tr className="bg-gray-50 text-left">
                {(isManager || isLeader) && (
                  <th className="whitespace-nowrap px-6 py-4 text-sm font-medium uppercase tracking-wider text-gray-500">
                    Employee
                  </th>
                )}
                <th className="whitespace-nowrap px-6 py-4 text-sm font-medium uppercase tracking-wider text-gray-500">
                  Date
                </th>
                <th className="whitespace-nowrap px-6 py-4 text-sm font-medium uppercase tracking-wider text-gray-500">
                  Status
                </th>
                <th className="whitespace-nowrap px-6 py-4 text-sm font-medium uppercase tracking-wider text-gray-500">
                  Check In
                </th>
                <th className="whitespace-nowrap px-6 py-4 text-sm font-medium uppercase tracking-wider text-gray-500">
                  Check Out
                </th>
                <th className="whitespace-nowrap px-6 py-4 text-sm font-medium uppercase tracking-wider text-gray-500">
                  Hours
                </th>
                <th className="whitespace-nowrap px-6 py-4 text-sm font-medium uppercase tracking-wider text-gray-500">
                  Expected
                </th>
                <th className="whitespace-nowrap px-6 py-4 text-sm font-medium uppercase tracking-wider text-gray-500">
                  Location
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredRecords.map((record) => {
                const status = getAttendanceStatus(record)
                const expectedHours = businessSettings
                  ? Number(businessSettings.workday_end.split(":")[0]) -
                    Number(businessSettings.workday_start.split(":")[0])
                  : 8

                return (
                  <tr key={`${record.user_id}-${record.date}`} className="transition-colors hover:bg-gray-50">
                    {(isManager || isLeader) && (
                      <td className="whitespace-nowrap px-6 py-4">
                        <div className="flex items-center">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#6148F4]/10 text-sm font-medium text-[#6148F4]">
                            {record.user?.name ? record.user.name.charAt(0) : "U"}
                          </div>
                          <div className="ml-3">
                            <div className="font-medium text-gray-900">{record.user?.name || "Unknown"}</div>
                            <div className="text-xs text-gray-500">{record.user?.email || ""}</div>
                          </div>
                        </div>
                      </td>
                    )}
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="flex items-center">
                        <Calendar size={16} className="mr-2 text-gray-400" />
                        <span className="text-gray-900">{formatDate(record.date)}</span>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                          status === "present"
                            ? "bg-green-50 text-green-700"
                            : status === "absent"
                              ? "bg-red-50 text-red-700"
                              : status === "late"
                                ? "bg-yellow-50 text-yellow-700"
                                : "bg-orange-50 text-orange-700"
                        }`}
                      >
                        {status === "late" && <AlertCircle size={12} className="mr-1" />}
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="flex items-center">
                        <LogIn size={16} className="mr-2 text-gray-400" />
                        <span
                          className={`${isLate(record.check_in) ? "text-yellow-600 font-medium" : "text-gray-900"}`}
                        >
                          {formatTime(record.check_in) || "-"}
                        </span>
                      </div>
                      {isLate(record.check_in) && businessSettings && (
                        <div className="mt-1 text-xs text-yellow-600">
                          Expected: {formatTime(businessSettings.workday_start)}
                        </div>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="flex items-center">
                        <LogOut size={16} className="mr-2 text-gray-400" />
                        <span
                          className={`${isIncompleteDay(record.check_in, record.check_out) ? "text-orange-600 font-medium" : "text-gray-900"}`}
                        >
                          {formatTime(record.check_out) || "-"}
                        </span>
                      </div>
                      {isIncompleteDay(record.check_in, record.check_out) && businessSettings && (
                        <div className="mt-1 text-xs text-orange-600">
                          Expected: {formatTime(businessSettings.workday_end)}
                        </div>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="flex items-center">
                        <Clock size={16} className="mr-2 text-gray-400" />
                        <span className="text-gray-900">{record.worked_hours ? `${record.worked_hours}h` : "-"}</span>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="flex items-center">
                        <Clock size={16} className="mr-2 text-gray-400" />
                        <span className="text-gray-900">{expectedHours}h</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 max-w-xs">
                      {record.location_lat && record.location_lng ? (
                        <LocationDisplay lat={record.location_lat} lng={record.location_lng} />
                      ) : (
                        <div className="flex items-center">
                          <MapPin size={16} className="mr-2 text-gray-400" />
                          <span className="text-gray-500">No location data</span>
                        </div>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
