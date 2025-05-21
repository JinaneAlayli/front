"use client"

import { useState, useRef, useEffect } from "react"
import { MapPin, ExternalLink, Copy, Check } from "lucide-react"
import axios from "axios"

interface LocationDisplayProps {
  lat: number | string
  lng: number | string
}

// Cache for geocoded addresses to avoid repeated API calls
const addressCache: Record<string, string> = {}

export default function LocationDisplay({ lat, lng }: LocationDisplayProps) {
  const [address, setAddress] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [showPopup, setShowPopup] = useState(false)
  const [copied, setCopied] = useState(false)
  const popupRef = useRef<HTMLDivElement>(null)

  const latNum = typeof lat === "string" ? Number.parseFloat(lat) : lat
  const lngNum = typeof lng === "string" ? Number.parseFloat(lng) : lng

  // Create Google Maps link
  const googleMapsLink = `https://www.google.com/maps?q=${latNum},${lngNum}`

  // Format coordinates for display
  const formattedCoords = `${latNum.toFixed(6)}, ${lngNum.toFixed(6)}`

  // Handle click outside to close popup
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        setShowPopup(false)
      }
    }

    // Add event listener only when popup is shown
    if (showPopup) {
      document.addEventListener("mousedown", handleClickOutside)
      return () => {
        document.removeEventListener("mousedown", handleClickOutside)
      }
    }
  }, [showPopup])

  // Reset copied state after 2 seconds
  useEffect(() => {
    if (copied) {
      const timer = setTimeout(() => {
        setCopied(false)
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [copied])

  // Function to fetch address data on demand
  const fetchAddress = async () => {
    // Create a cache key
    const cacheKey = `${latNum.toFixed(6)},${lngNum.toFixed(6)}`

    // Return from cache if available
    if (addressCache[cacheKey]) {
      setAddress(addressCache[cacheKey])
      return
    }

    setLoading(true)
    try {
      // Use axios instead of fetch
      const response = await axios.get(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latNum}&lon=${lngNum}&zoom=18&addressdetails=1`,
        {
          headers: {
            // Add a user agent as required by Nominatim usage policy
            "User-Agent": "AttendanceSystem/1.0",
          },
        },
      )

      if (response.data && response.data.display_name) {
        // Format the address to be more readable
        const formattedAddress = response.data.display_name
          .replace(/,\s*\d{5,}/, "") // Remove postal codes
          .replace(/,\s*[^,]+@[^,]+/, "") // Remove emails if present

        // Cache the result
        addressCache[cacheKey] = formattedAddress
        setAddress(formattedAddress)
      }
    } catch (err) {
      console.error("Error fetching address:", err)
    } finally {
      setLoading(false)
    }
  }

  // Handle click on location button
  const handleLocationClick = () => {
    setShowPopup(true)
    if (!address && !loading) {
      fetchAddress()
    }
  }

  // Copy coordinates to clipboard
  const copyCoordinates = () => {
    navigator.clipboard.writeText(formattedCoords)
    setCopied(true)
  }

  return (
    <div className="relative flex items-center">
      <button
        onClick={handleLocationClick}
        className="inline-flex items-center rounded-md bg-gray-50 px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-[#6148F4]/20 transition-colors"
        aria-label="View location details"
      >
        <MapPin size={14} className="mr-1.5 text-gray-500" />
        <span>View location</span>
      </button>

      {/* Location popup */}
      {showPopup && (
       <div
  ref={popupRef}
  className="absolute bottom-full left-1/2 z-[999] mb-2 w-72 -translate-x-1/2 rounded-lg border border-gray-200 bg-white p-4 shadow-2xl"
>

          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-gray-900">Location Details</h4>
            <button
              onClick={() => setShowPopup(false)}
              className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-500"
            >
              <span className="sr-only">Close</span>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M12 4L4 12M4 4L12 12"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>

          <div className="space-y-3">
            <div className="flex items-start justify-between">
              <div className="text-xs text-gray-500">
                <span className="font-medium text-gray-700">Coordinates:</span>
                <div className="mt-1">{formattedCoords}</div>
              </div>
              <button
                onClick={copyCoordinates}
                className="ml-2 rounded-md p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                title="Copy coordinates"
              >
                {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
              </button>
            </div>

            {loading ? (
              <div className="flex items-center py-2 text-xs text-gray-500">
                <div className="mr-2 h-3 w-3 animate-spin rounded-full border-2 border-[#6148F4] border-t-transparent"></div>
                Loading address...
              </div>
            ) : address ? (
              <div className="text-xs">
                <span className="font-medium text-gray-700">Address:</span>
                <p className="mt-1 text-gray-600 break-words leading-relaxed">{address}</p>
              </div>
            ) : (
              <div className="py-2 text-xs text-gray-500">Address information unavailable</div>
            )}

            <a
              href={googleMapsLink}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex w-full items-center justify-center rounded-md bg-[#6148F4]/10 px-3 py-2 text-xs font-medium text-[#6148F4] transition-colors hover:bg-[#6148F4]/20"
            >
              Open in Google Maps
              <ExternalLink size={12} className="ml-1.5" />
            </a>
          </div>
        </div>
      )}
    </div>
  )
}
