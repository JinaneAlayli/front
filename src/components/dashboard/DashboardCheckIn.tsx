"use client"

import { useState, useEffect } from "react"
import api from "@/lib/api"
import { Clock, LogIn, LogOut, MapPin } from "lucide-react"
import businessSettingsService from "@/lib/services/business-settings.service"
import type { BusinessSettings } from "@/lib/services/business-settings.service"

interface DashboardCheckInProps {
  todayRecord: any
  onCheckInSuccess: (record: any) => void
  onCheckOutSuccess: (record: any) => void
}

export default function DashboardCheckIn({ todayRecord, onCheckInSuccess, onCheckOutSuccess }: DashboardCheckInProps) {
  const [loading, setLoading] = useState(false)
  const [locationError, setLocationError] = useState("")
  const [apiError, setApiError] = useState("")
  const [permissionError, setPermissionError] = useState(false)
  const [locationAddress, setLocationAddress] = useState<string | null>(null)
  const [fetchingAddress, setFetchingAddress] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [businessSettings, setBusinessSettings] = useState<BusinessSettings | null>(null)
  const [settingsLoading, setSettingsLoading] = useState(true)

  // Fix the useEffect hook to prevent infinite updates
  // Replace the existing useEffect for fetching settings with this:

  useEffect(() => {
    let isMounted = true

    const fetchSettings = async () => {
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

  // Function to create a Google Maps link from coordinates
  const createGoogleMapsLink = (lat: number, lng: number): string => {
    return `https://www.google.com/maps?q=${lat},${lng}`
  }

  // Modify the getAddressFromCoordinates function to be more reliable
  const getAddressFromCoordinates = async (lat: number, lng: number): Promise<string> => {
    try {
      // Try multiple geocoding services for better reliability
      // First try OpenStreetMap Nominatim
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        {
          headers: {
            "User-Agent": "AttendanceSystem/1.0",
          },
        },
      )

      if (!response.ok) {
        throw new Error(`Geocoding failed with status: ${response.status}`)
      }

      const data = await response.json()

      if (data && data.display_name) {
        // Format the address to be more readable
        return data.display_name
          .replace(/,\s*\d{5,}/, "") // Remove postal codes
          .replace(/,\s*[^,]+@[^,]+/, "") // Remove emails if present
      }

      return `Coordinates: ${lat.toFixed(6)}, ${lng.toFixed(6)}`
    } catch (error) {
      console.error("Error getting address:", error)
      return `Coordinates: ${lat.toFixed(6)}, ${lng.toFixed(6)}`
    }
  }

  // Fetch address for today's record if it exists
  useEffect(() => {
    const fetchAddress = async () => {
      if (todayRecord?.location_lat && todayRecord?.location_lng && !locationAddress) {
        setFetchingAddress(true)
        try {
          const address = await getAddressFromCoordinates(
            Number(todayRecord.location_lat),
            Number(todayRecord.location_lng),
          )
          setLocationAddress(address)
        } catch (error) {
          console.error("Failed to fetch address:", error)
        } finally {
          setFetchingAddress(false)
        }
      }
    }

    fetchAddress()
  }, [todayRecord])

  // Check if check-in is late based on business settings
  const isLate = (checkInTime: string) => {
    if (!businessSettings || !checkInTime) return false

    const [workHours, workMinutes] = businessSettings.workday_start.split(":").map(Number)
    const [checkHours, checkMinutes] = checkInTime.split(":").map(Number)

    if (checkHours > workHours) return true
    if (checkHours === workHours && checkMinutes > workMinutes + 15) return true // 15 min grace period

    return false
  }

  // Modify the handleCheckIn function to add better error handling and a timeout
  const handleCheckIn = async () => {
    // Show confirmation dialog first
    setShowConfirmation(true)
  }

  // Add a new function to handle the actual check-in after confirmation:
  const confirmCheckIn = async () => {
    setShowConfirmation(false)
    setLoading(true)
    setLocationError("")
    setApiError("")
    setPermissionError(false)
    setLocationAddress(null)

    // Add a timeout to prevent the button from being stuck in processing mode
    const timeoutId = setTimeout(() => {
      if (loading) {
        setLoading(false)
        setApiError("Request timed out. Please try again.")
      }
    }, 15000) // 15 seconds timeout

    try {
      // Get current location with higher accuracy settings
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        })
      })

      const { latitude, longitude, accuracy } = position.coords

      // Send check-in request with coordinates
      const response = await api.post("/attendance/check-in", {
        location_lat: latitude,
        location_lng: longitude,
        accuracy: accuracy, // Send accuracy to the server for logging
      })

      clearTimeout(timeoutId) // Clear the timeout since request completed
      setLoading(false) // Reset loading state after successful check-in
      onCheckInSuccess(response.data)
      // toast.success("Successfully checked in")

      // After successful check-in, fetch the address from coordinates
      try {
        const address = await getAddressFromCoordinates(latitude, longitude)
        setLocationAddress(address)
      } catch (addressError) {
        console.error("Failed to fetch address:", addressError)
        // Don't show an error to the user, just use coordinates instead
      }
    } catch (error: any) {
      clearTimeout(timeoutId) // Clear the timeout since we caught an error
      console.error("Check-in failed:", error)
      setLoading(false)

      if (error.code === 1) {
        // Permission denied
        setLocationError("Location permission denied. Please enable location services to check in.")
      } else if (error.code === 2) {
        // Position unavailable
        setLocationError("Unable to determine your location. Please try again or check your device's GPS settings.")
      } else if (error.code === 3) {
        // Timeout
        setLocationError("Location request timed out. Please try again in an area with better GPS signal.")
      } else if (error.response?.status === 403) {
        setPermissionError(true)
        setApiError("You don't have permission to check in. Please contact your administrator.")
      } else if (error.response?.data?.message) {
        setApiError(error.response.data.message)
      } else {
        setApiError("Failed to check in. Please try again later.")
      }
    }
  }

  const handleCheckOut = async () => {
    setLoading(true)
    setApiError("")
    setPermissionError(false)

    try {
      const response = await api.post("/attendance/check-out")
      setLoading(false) // Reset loading state after successful check-out
      onCheckOutSuccess(response.data)
      // toast.success("Successfully checked out")
    } catch (error: any) {
      console.error("Check-out failed:", error)
      if (error.response?.status === 403) {
        setPermissionError(true)
        setApiError("You don't have permission to check out. Please contact your administrator.")
      } else if (error.response?.data?.message) {
        setApiError(error.response.data.message)
      } else {
        setApiError("Failed to check out. Please try again later.")
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

  // Add a function to cancel check-in process
  const cancelCheckIn = () => {
    setLoading(false)
    setApiError("")
    setLocationError("")
  }

  // Add a useEffect to reset loading state on component mount
  useEffect(() => {
    // Reset loading state when component mounts
    setLoading(false)

    // Also reset when component unmounts
    return () => {
      setLoading(false)
    }
  }, [])

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
        {businessSettings && (
          <p className="mt-1 text-xs text-gray-500">
            Work hours: {formatTime(businessSettings.workday_start)} - {formatTime(businessSettings.workday_end)}
          </p>
        )}
      </div>

      <div className="p-6">
        <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
            <div className="mb-2 text-sm font-medium text-gray-500">Check-in Time</div>
            <div className="flex items-center">
              <LogIn size={18} className="mr-2 text-[#6148F4]" />
              <span
                className={`text-lg font-semibold ${todayRecord?.check_in && isLate(todayRecord.check_in) ? "text-yellow-600" : ""}`}
              >
                {todayRecord?.check_in ? formatTime(todayRecord.check_in) : "-"}
              </span>
            </div>
            {todayRecord?.check_in && businessSettings && isLate(todayRecord.check_in) && (
              <div className="mt-1 text-xs text-yellow-600">Expected: {formatTime(businessSettings.workday_start)}</div>
            )}
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
            {businessSettings && (
              <div className="mt-1 text-xs text-gray-500">
                Expected:{" "}
                {businessSettings
                  ? Number(businessSettings.workday_end.split(":")[0]) -
                    Number(businessSettings.workday_start.split(":")[0])
                  : 8}
                h
              </div>
            )}
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

        {apiError && (
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
              <div>{apiError}</div>
            </div>
          </div>
        )}

        {permissionError && (
          <div className="mb-6 rounded-lg bg-yellow-50 p-4 text-sm text-yellow-700">
            <div className="flex items-start">
              <div className="mr-2 mt-0.5">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div>
                The attendance system may not be available for your role. Please contact your administrator if you
                believe this is an error.
              </div>
            </div>
          </div>
        )}

        {/* Modify the button section to include a cancel button when processing */}
        <div className="flex flex-col gap-4 sm:flex-row">
          {!todayRecord?.check_in ? (
            <>
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
              {loading && (
                <button
                  onClick={cancelCheckIn}
                  className="flex items-center justify-center rounded-lg border border-gray-300 bg-white px-6 py-3 text-gray-700 transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                >
                  Cancel
                </button>
              )}
            </>
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

        {/* Add a location accuracy indicator when showing location data */}
        {todayRecord?.location_lat && todayRecord?.location_lng && (
          <div className="mt-4 rounded-lg bg-gray-50 p-4">
            <div className="mb-2 flex items-center text-sm font-medium text-gray-700">
              <MapPin className="mr-2 h-5 w-5 text-[#6148F4]" />
              Check-in Location:
            </div>

            {fetchingAddress ? (
              <div className="flex items-center text-gray-500">
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-[#6148F4] border-t-transparent"></div>
                Loading address...
              </div>
            ) : locationAddress ? (
              <div className="mb-2 text-gray-700">{locationAddress}</div>
            ) : (
              <div className="mb-2 text-gray-500">
                {Number(todayRecord.location_lat).toFixed(6)}, {Number(todayRecord.location_lng).toFixed(6)}
              </div>
            )}

            {todayRecord.accuracy && (
              <div className="mb-2 text-xs text-gray-500">
                Location accuracy: ±{Math.round(todayRecord.accuracy)} meters
              </div>
            )}

            <a
              href={createGoogleMapsLink(Number(todayRecord.location_lat), Number(todayRecord.location_lng))}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-[#6148F4] hover:underline"
            >
              View on Google Maps
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="ml-1 h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                />
              </svg>
            </a>
          </div>
        )}
      </div>
      {showConfirmation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h3 className="mb-4 text-lg font-medium">Location Permission</h3>
            <p className="mb-6 text-gray-600">
              To check in, we need to access your current location. This helps verify your attendance at the workplace.
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setShowConfirmation(false)}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmCheckIn}
                className="rounded-lg bg-[#6148F4] px-4 py-2 text-white hover:bg-[#5040d3]"
              >
                Allow Location Access
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
