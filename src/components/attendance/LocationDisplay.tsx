"use client"

import { useState, useEffect } from "react"
import { MapPin, ExternalLink } from "lucide-react"

interface LocationDisplayProps {
  lat: number | string
  lng: number | string
}

// Cache for geocoded addresses to avoid repeated API calls
const addressCache: Record<string, string> = {}

export default function LocationDisplay({ lat, lng }: LocationDisplayProps) {
  const [address, setAddress] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)

  const latNum = typeof lat === "string" ? Number.parseFloat(lat) : lat
  const lngNum = typeof lng === "string" ? Number.parseFloat(lng) : lng

  // Create Google Maps link
  const googleMapsLink = `https://www.google.com/maps?q=${latNum},${lngNum}`

  useEffect(() => {
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
        // Use OpenStreetMap Nominatim API (free, no API key required)
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latNum}&lon=${lngNum}&zoom=18&addressdetails=1`,
          {
            headers: {
              // Add a user agent as required by Nominatim usage policy
              "User-Agent": "AttendanceSystem/1.0",
            },
          },
        )

        const data = await response.json()

        if (data && data.display_name) {
          // Format the address to be more readable
          const formattedAddress = data.display_name
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

    if (lat && lng) {
      fetchAddress()
    }
  }, [lat, lng])

  // Function to truncate text
  const truncateText = (text: string, maxLength: number) => {
    if (!text) return ""
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength) + "..."
  }

  return (
    <div className="flex items-center space-x-2">
      <MapPin size={14} className="flex-shrink-0 text-gray-400" />
      <div className="min-w-0">
        {loading ? (
          <div className="flex items-center text-xs text-gray-500">
            <div className="mr-1 h-2 w-2 animate-spin rounded-full border-2 border-[#6148F4] border-t-transparent"></div>
            Loading...
          </div>
        ) : address ? (
          <div className="text-xs text-gray-700">
            <button
              onClick={() => setShowModal(true)}
              className="hover:underline truncate block max-w-[150px]"
              title="Click to view full address"
            >
              {truncateText(address, 30)}
            </button>
          </div>
        ) : (
          <div className="text-xs text-gray-500">
            {latNum.toFixed(6)}, {lngNum.toFixed(6)}
          </div>
        )}
        <a
          href={googleMapsLink}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center text-xs text-[#6148F4] hover:underline"
        >
          View on map
          <ExternalLink size={10} className="ml-0.5" />
        </a>
      </div>

      {/* Modal for full address */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => setShowModal(false)}
        >
          <div className="max-w-md rounded-lg bg-white p-4 shadow-lg" onClick={(e) => e.stopPropagation()}>
            <h3 className="mb-2 text-lg font-medium">Location Address</h3>
            <p className="mb-4 text-gray-700">{address}</p>
            <div className="flex justify-between">
              <a
                href={googleMapsLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center text-sm text-[#6148F4] hover:underline"
              >
                Open in Google Maps
                <ExternalLink size={14} className="ml-1" />
              </a>
              <button
                onClick={() => setShowModal(false)}
                className="rounded-md bg-gray-100 px-3 py-1 text-sm text-gray-700 hover:bg-gray-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
