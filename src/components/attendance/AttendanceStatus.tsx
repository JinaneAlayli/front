"use client"

import { useState } from "react"
import api from "@/lib/api"
import { toast } from "react-toastify"
import { Clock, LogIn, LogOut, MapPin } from "lucide-react"

interface AttendanceStatusProps {
  todayRecord: any
  onCheckInSuccess: (record: any) => void
  onCheckOutSuccess: (record: any) => void
}

export default function AttendanceStatus({ todayRecord, onCheckInSuccess, onCheckOutSuccess }: AttendanceStatusProps) {
  const [loading, setLoading] = useState(false)
  const [locationError, setLocationError] = useState("")

  const handleCheckIn = async () => {
    setLoading(true)
    setLocationError("")

    try {
      // Get current location
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        })
      })

      const { latitude, longitude } = position.coords

      const response = await api.post("/attendance/check-in", {
        location_lat: latitude,
        location_lng: longitude,
      })

      onCheckInSuccess(response.data)
    } catch (error: any) {
      console.error("Check-in failed:", error)

      if (error.code === 1) {
        // Permission denied
        setLocationError("Location permission denied. Please enable location services to check in.")
      } else if (error.code === 2) {
        // Position unavailable
        setLocationError("Unable to determine your location. Please try again.")
      } else if (error.code === 3) {
        // Timeout
        setLocationError("Location request timed out. Please try again.")
      } else if (error.response?.data?.message) {
        toast.error(error.response.data.message)
      } else {
        toast.error("Failed to check in")
      }
    } finally {
      setLoading(false)
    }
  }

  const handleCheckOut = async () => {
    setLoading(true)
    try {
      const response = await api.post("/attendance/check-out")
      onCheckOutSuccess(response.data)
    } catch (error: any) {
      console.error("Check-out failed:", error)
      if (error.response?.data?.message) {
        toast.error(error.response.data.message)
      } else {
        toast.error("Failed to check out")
      }
    } finally {
      setLoading(false)
    }
  }

  // Format time from "HH:MM:SS" to "HH:MM AM/PM"
  const formatTime = (timeString: string) => {
    if (!timeString) return "-"
    const [hours, minutes] = timeString.split(":")
    const hour = Number.parseInt(hours, 10)
    const ampm = hour >= 12 ? "PM" : "AM"
    const hour12 = hour % 12 || 12
    return `${hour12}:${minutes} ${ampm}`
  }

  // Calculate elapsed time since check-in
  const calculateElapsedTime = () => {
    if (!todayRecord?.check_in) return null

    const now = new Date()
    const today = now.toISOString().split("T")[0]
    const checkInTime = new Date(`${today}T${todayRecord.check_in}`)

    let endTime
    if (todayRecord.check_out) {
      endTime = new Date(`${today}T${todayRecord.check_out}`)
    } else {
      endTime = now
    }

    const diffMs = endTime.getTime() - checkInTime.getTime()
    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60))
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))

    return `${diffHrs}h ${diffMins}m`
  }

  const elapsedTime = calculateElapsedTime()

  return (
    <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
      <div className="border-b border-gray-100 bg-[#6148F4]/5 px-6 py-4">
        <h2 className="text-lg font-medium text-gray-900">Today's Attendance</h2>
        <p className="text-sm text-gray-500">
          {new Date().toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      </div>

      <div className="p-6">
        <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
            <div className="mb-2 text-sm font-medium text-gray-500">Check-in Time</div>
            <div className="flex items-center">
              <LogIn size={18} className="mr-2 text-[#6148F4]" />
              <span className="text-lg font-semibold">
                {todayRecord?.check_in ? formatTime(todayRecord.check_in) : "-"}
              </span>
            </div>
          </div>

          <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
            <div className="mb-2 text-sm font-medium text-gray-500">Check-out Time</div>
            <div className="flex items-center">
              <LogOut size={18} className="mr-2 text-[#6148F4]" />
              <span className="text-lg font-semibold">
                {todayRecord?.check_out ? formatTime(todayRecord.check_out) : "-"}
              </span>
            </div>
          </div>

          <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
            <div className="mb-2 text-sm font-medium text-gray-500">Hours Worked</div>
            <div className="flex items-center">
              <Clock size={18} className="mr-2 text-[#6148F4]" />
              <span className="text-lg font-semibold">
                {todayRecord?.worked_hours ? `${todayRecord.worked_hours}h` : elapsedTime || "-"}
              </span>
            </div>
          </div>
        </div>

        {locationError && (
          <div className="mb-6 rounded-lg bg-red-50 p-4 text-sm text-red-700">
            <div className="flex items-start">
              <div className="mr-2 mt-0.5">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div>{locationError}</div>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-4 sm:flex-row">
          {!todayRecord?.check_in ? (
            <button
              onClick={handleCheckIn}
              disabled={loading}
              className="flex items-center justify-center rounded-lg bg-[#6148F4] px-6 py-3 text-white transition-colors hover:bg-[#5040d3] focus:outline-none focus:ring-2 focus:ring-[#6148F4]/50 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? (
                <span className="flex items-center">
                  <svg
                    className="mr-2 h-4 w-4 animate-spin"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Processing...
                </span>
              ) : (
                <>
                  <LogIn size={18} className="mr-2" />
                  Check In
                </>
              )}
            </button>
          ) : !todayRecord?.check_out ? (
            <button
              onClick={handleCheckOut}
              disabled={loading}
              className="flex items-center justify-center rounded-lg bg-gray-800 px-6 py-3 text-white transition-colors hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-800/50 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? (
                <span className="flex items-center">
                  <svg
                    className="mr-2 h-4 w-4 animate-spin"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Processing...
                </span>
              ) : (
                <>
                  <LogOut size={18} className="mr-2" />
                  Check Out
                </>
              )}
            </button>
          ) : (
            <div className="rounded-lg bg-green-50 px-6 py-3 text-green-700">
              <div className="flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="mr-2 h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>You've completed your workday</span>
              </div>
            </div>
          )}
        </div>

        {todayRecord?.check_in && !todayRecord?.check_out && (
          <div className="mt-4 rounded-lg bg-blue-50 p-4 text-sm text-blue-700">
            <div className="flex items-center">
              <Clock size={16} className="mr-2" />
              <span>
                You checked in at {formatTime(todayRecord.check_in)}. Don't forget to check out at the end of your
                workday.
              </span>
            </div>
          </div>
        )}

        {todayRecord?.location_lat && todayRecord?.location_lng && (
          <div className="mt-6">
            <div className="mb-2 flex items-center text-sm font-medium text-gray-500">
              <MapPin size={16} className="mr-1" />
              Check-in Location
            </div>
            <div className="h-48 overflow-hidden rounded-lg border border-gray-200">
              <iframe
                title="Check-in Location"
                width="100%"
                height="100%"
                frameBorder="0"
                src={`https://www.google.com/maps/embed/v1/place?key=YOUR_API_KEY&q=${todayRecord.location_lat},${todayRecord.location_lng}&zoom=15`}
                allowFullScreen
              ></iframe>
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Coordinates: {todayRecord.location_lat}, {todayRecord.location_lng}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
