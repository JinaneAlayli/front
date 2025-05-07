"use client"

import { useState } from "react"
import { Calendar, Clock, LogIn, LogOut, Search, Filter, Globe, MapPin } from "lucide-react"
import LocationDisplay from "./LocationDisplay"

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
  })

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

  // Filter records based on search term and filters
  const filteredRecords = records.filter((record) => {
    // Filter by user role
    if (!isManager && !isLeader && record.user_id !== userId) {
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
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="relative">
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

            <div>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-[#6148F4] focus:outline-none focus:ring-1 focus:ring-[#6148F4]/50"
              >
                <option value="">All Statuses</option>
                <option value="present">Present</option>
                <option value="absent">Absent</option>
                <option value="late">Late</option>
              </select>
            </div>

            <div>
              <select
                value={filters.date}
                onChange={(e) => setFilters({ ...filters, date: e.target.value })}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-[#6148F4] focus:outline-none focus:ring-1 focus:ring-[#6148F4]/50"
              >
                <option value="">All Dates</option>
                {uniqueDates.map((date) => (
                  <option key={date} value={date}>
                    {formatDate(date)}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end sm:col-span-3">
              <button
                onClick={() => {
                  setFilters({ status: "", date: "" })
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
        {loading ? (
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
                  Location
                </th>
                <th className="whitespace-nowrap px-6 py-4 text-sm font-medium uppercase tracking-wider text-gray-500">
                  IP Address
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredRecords.map((record) => (
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
                        record.status === "present"
                          ? "bg-green-50 text-green-700"
                          : record.status === "absent"
                            ? "bg-red-50 text-red-700"
                            : "bg-yellow-50 text-yellow-700"
                      }`}
                    >
                      {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="flex items-center">
                      <LogIn size={16} className="mr-2 text-gray-400" />
                      <span className="text-gray-900">{formatTime(record.check_in) || "-"}</span>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="flex items-center">
                      <LogOut size={16} className="mr-2 text-gray-400" />
                      <span className="text-gray-900">{formatTime(record.check_out) || "-"}</span>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="flex items-center">
                      <Clock size={16} className="mr-2 text-gray-400" />
                      <span className="text-gray-900">{record.worked_hours ? `${record.worked_hours}h` : "-"}</span>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    {record.location_lat && record.location_lng ? (
                      <LocationDisplay lat={record.location_lat} lng={record.location_lng} />
                    ) : (
                      <div className="flex items-center">
                        <MapPin size={16} className="mr-2 text-gray-400" />
                        <span className="text-gray-500">-</span>
                      </div>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="flex items-center">
                      <Globe size={16} className="mr-2 text-gray-400" />
                      <span className="text-gray-900">{record.ip_address || "-"}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
