"use client"

import Link from "next/link"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSelector, useDispatch } from "react-redux"
import { logout } from "@/lib/redux/slices/authSlice"
import type { RootState } from "@/lib/redux/store"
import api from "@/lib/api"
import { Mail, Phone, MapPin, ArrowUp } from "lucide-react"
import Image from "next/image"
import Cookies from "js-cookie"

export default function Footer() {
  const [isClient, setIsClient] = useState(false)
  const router = useRouter()
  const dispatch = useDispatch()
  const { isAuthenticated } = useSelector((state: RootState) => state.auth)
  const currentYear = new Date().getFullYear()

  // Set isClient to true when component mounts (client-side only)
  useEffect(() => {
    setIsClient(true)
  }, [])

  async function handleLogout() {
    try {
      // 1. First attempt to logout via the API
      await api.post("/auth/logout")

      // 2. Clear the JWT cookie using multiple approaches
      // Standard approach
      Cookies.remove("jwt")

      // Try with explicit path
      Cookies.remove("jwt", { path: "/" })

      // Try with domain for Vercel
      if (window.location.hostname.includes("vercel.app")) {
        Cookies.remove("jwt", {
          path: "/",
          domain: window.location.hostname,
        })
      }

      // 3. Clear auth header
      delete api.defaults.headers.common["Authorization"]

      // 4. Set a logout flag in localStorage to prevent auto-login
      localStorage.setItem("force_logout", "true")

      // 5. Update Redux state
      dispatch(logout())

      // 6. Force a hard reload to clear any in-memory state
      window.location.href = "/login"
    } catch (error) {
      console.error("Logout failed:", error)

      // Still perform all the cleanup steps
      Cookies.remove("jwt")
      Cookies.remove("jwt", { path: "/" })

      if (window.location.hostname.includes("vercel.app")) {
        Cookies.remove("jwt", {
          path: "/",
          domain: window.location.hostname,
        })
      }

      delete api.defaults.headers.common["Authorization"]
      localStorage.setItem("force_logout", "true")
      dispatch(logout())
      window.location.href = "/login"
    }
  }

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    })
  }

  return (
    <footer className="bg-gray-900 text-gray-300 w-full py-12 relative">
      <div className="max-w-7xl mx-auto px-6 md:px-32">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {/* Brand Section */}
          <div className="space-y-4">
            <Link href="/" className="inline-block">
              <Image src="/homelogo.png" alt="Beteamly Logo" width={110} height={80} className="mb-3" />
            </Link>
            <p className="text-gray-400 max-w-md">
              Simplifying HR management for businesses of all sizes with our comprehensive suite of tools.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-white">Quick Links</h3>
            <div className="flex flex-col space-y-3">
              <Link href="/about" className="text-gray-400 hover:text-[#6148F4] transition-colors">
                About
              </Link>
              <Link href="/pricing" className="text-gray-400 hover:text-[#6148F4] transition-colors">
                Pricing
              </Link>
              {isAuthenticated ? (
                <button
                  onClick={handleLogout}
                  className="text-gray-400 hover:text-[#6148F4] transition-colors text-left"
                >
                  Logout
                </button>
              ) : (
                <Link href="/login" className="text-gray-400 hover:text-[#6148F4] transition-colors">
                  Login
                </Link>
              )}
            </div>
          </div>

          {/* Contact Information */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-white">Contact Us</h3>
            <div className="flex flex-col space-y-3">
              <a
                href="mailto:jinanealayli@gmail.com"
                className="text-gray-400 hover:text-[#6148F4] transition-colors flex items-center gap-2"
              >
                <Mail className="h-5 w-5 text-[#6148F4]" />
                <span>jinanealayli@gmail.com</span>
              </a>
              <a
                href="tel:+96170298529"
                className="text-gray-400 hover:text-[#6148F4] transition-colors flex items-center gap-2"
              >
                <Phone className="h-5 w-5 text-[#6148F4]" />
                <span>+96170298529</span>
              </a>
              <div className="text-gray-400 flex items-center gap-2">
                <MapPin className="h-5 w-5 text-[#6148F4]" />
                <span>Lebanon</span>
              </div>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-800 my-8"></div>

        {/* Copyright and Back to Top */}
        <div className="flex flex-col md:flex-row justify-between items-center pt-4">
          <p className="text-gray-500 text-sm mb-4 md:mb-0">© {currentYear} Beteamly. All rights reserved.</p>

          <button
            onClick={scrollToTop}
            className="flex items-center gap-2 text-gray-400 hover:text-[#6148F4] transition-colors group"
            aria-label="Back to top"
          >
            <span className="text-sm font-medium">Back to top</span>
            <div className="bg-gray-800 p-2 rounded-full group-hover:bg-[#6148F4]/10 transition-colors">
              <ArrowUp className="h-4 w-4 group-hover:text-[#6148F4]" />
            </div>
          </button>
        </div>
      </div>
    </footer>
  )
}
