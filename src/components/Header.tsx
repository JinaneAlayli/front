"use client"

import Link from "next/link"
import Image from "next/image"
import { useEffect, useState } from "react"
import { useSelector, useDispatch } from "react-redux"
import type { RootState } from "@/lib/redux/store"
import Cookies from "js-cookie"
import { FaBars } from "react-icons/fa"
import { logout, loginSuccess, setAuthChecked } from "@/lib/redux/slices/authSlice"
import api from "@/lib/api"
import { usePathname, useRouter } from "next/navigation"
import { X, LogOut, ChevronDown, User } from "lucide-react"

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const dispatch = useDispatch()
  const router = useRouter()
  const { user, isAuthenticated, isAuthChecked } = useSelector((state: RootState) => state.auth)
  const pathname = usePathname()
  const [isLoading, setIsLoading] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setScrolled(true)
      } else {
        setScrolled(false)
      }
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  useEffect(() => {
    if (!isAuthChecked && !isLoading) {
      const token = Cookies.get("jwt")

      // If no token exists, just mark auth as checked and return
      if (!token) {
        dispatch(setAuthChecked())
        return
      }

      const fetchUser = async () => {
        setIsLoading(true)
        try {
          // Set the token in the API headers
          api.defaults.headers.common["Authorization"] = `Bearer ${token}`

          // Add a timeout to prevent hanging requests
          const controller = new AbortController()
          const timeoutId = setTimeout(() => controller.abort(), 5000)

          const res = await api.get("/auth/me", {
            signal: controller.signal,
            // Prevent throwing on non-2xx responses
            validateStatus: (status) => status < 500,
          })

          clearTimeout(timeoutId)

          // Only dispatch success if we got a valid response
          if (res.status === 200 && res.data) {
            dispatch(loginSuccess(res.data))
          } else {
            // Invalid response, clear token
            Cookies.remove("jwt")
            delete api.defaults.headers.common["Authorization"]
          }
        } catch (err) {
          // Handle network errors silently - just clean up the token
          console.log("Auth check failed silently - user not logged in")
          Cookies.remove("jwt")
          delete api.defaults.headers.common["Authorization"]
        } finally {
          dispatch(setAuthChecked())
          setIsLoading(false)
        }
      }

      fetchUser()
    }
  }, [isAuthChecked, dispatch, isLoading])

  // Check if a link is active
  const isActive = (path: string) => {
    if (path === "/" && pathname === "/") return true
    if (path !== "/" && pathname.startsWith(path)) return true
    return false
  }

  // Get link class based on active state
  const getLinkClass = (path: string) => {
    return isActive(path)
      ? "text-[#6148F4] font-medium border-b-2 border-[#6148F4] pb-1"
      : "text-gray-300 hover:text-white transition-colors border-b-2 border-transparent pb-1 hover:border-gray-300"
  }

  const handleLogout = async () => {
    try {
      await api.post("/auth/logout")
      dispatch(logout())
      router.push("/login")
    } catch (error) {
      console.error("Logout failed:", error)
      // Still logout on the client side even if the server request fails
      dispatch(logout())
      router.push("/login")
    }
  }

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const userMenu = document.getElementById("user-menu")
      if (userMenu && !userMenu.contains(event.target as Node) && userMenuOpen) {
        setUserMenuOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [userMenuOpen])

  // Instead of returning null during auth check, render a skeleton/loading state
  const renderAuthSection = () => {
    if (!isAuthChecked) {
      return (
        <div className="hidden md:flex items-center space-x-3">
          <div className="bg-gray-700 h-10 w-24 rounded-md animate-pulse"></div>
        </div>
      )
    }

    if (isAuthenticated && user) {
      return (
        <div className="hidden md:flex items-center space-x-4">
          <div className="relative" id="user-menu">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors"
            >
              <span className="text-sm">{user.name || "User"}</span>
              <ChevronDown className={`h-4 w-4 transition-transform ${userMenuOpen ? "rotate-180" : ""}`} />
            </button>

            {userMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-md shadow-lg py-1 z-50">
                <Link
                  href="/dashboard"
                  className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white"
                >
                  <div className="flex items-center">
                    <User className="h-4 w-4 mr-2" />
                    Dashboard
                  </div>
                </Link>

                <div className="border-t border-gray-700 my-1"></div>
                <button
                  onClick={handleLogout}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white"
                >
                  <div className="flex items-center text-red-400 hover:text-red-300">
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>
      )
    }

    return (
      <div className="hidden md:flex items-center space-x-3">
        <Link href="/login">
          <button className="text-gray-300 hover:text-white font-medium transition-colors px-4 py-2.5">Log in</button>
        </Link>
        {!isAuthenticated && (
          <Link href="/pricing">
            <button className="bg-[#6148F4] text-white px-5 py-2.5 rounded-lg hover:bg-[#5040D9] transition-all shadow-sm">
              Get Started
            </button>
          </Link>
        )}
      </div>
    )
  }

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-all duration-300 ${
        scrolled ? "bg-gray-900 shadow-lg py-3" : "bg-gray-900 py-4"
      }`}
    >
      <div className="md:px-32 px-6 max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center">
          <Link href="/" className="flex items-center">
            <Image src="/homelogo.png" alt="Beteamly Logo" width={110} height={60} />
          </Link>
        </div>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center space-x-8">
          <Link href="/" className={getLinkClass("/")}>
            Home
          </Link>
          <Link href="/about" className={getLinkClass("/about")}>
            About
          </Link>
          <Link href="/services" className={getLinkClass("/services")}>
            Services
          </Link>
          <Link href="/pricing" className={getLinkClass("/pricing")}>
            Pricing
          </Link>
        </nav>

        {/* Auth Buttons - Desktop */}
        {renderAuthSection()}

        {/* Burger Icon - Mobile Only */}
        <div className="md:hidden">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className={`p-2 rounded-md transition-colors ${menuOpen ? "bg-gray-800" : "hover:bg-gray-800"}`}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
          >
            {menuOpen ? <X className="h-5 w-5 text-gray-300" /> : <FaBars className="h-5 w-5 text-gray-300" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Panel */}
      <div
        className={`fixed inset-x-0 top-[80px] bg-gray-800 shadow-md md:hidden z-40 transition-all duration-300 ${
          menuOpen ? "opacity-100 translate-y-0 h-auto" : "opacity-0 -translate-y-10 pointer-events-none h-0"
        }`}
      >
        <div className="px-6 py-6 flex flex-col space-y-2">
          <Link
            href="/"
            onClick={() => setMenuOpen(false)}
            className={`py-3 px-4 rounded-lg ${
              isActive("/") ? "bg-gray-700 text-[#6148F4] font-medium" : "text-gray-300 hover:bg-gray-700"
            }`}
          >
            Home
          </Link>
          <Link
            href="/about"
            onClick={() => setMenuOpen(false)}
            className={`py-3 px-4 rounded-lg ${
              isActive("/about") ? "bg-gray-700 text-[#6148F4] font-medium" : "text-gray-300 hover:bg-gray-700"
            }`}
          >
            About
          </Link>
          <Link
            href="/services"
            onClick={() => setMenuOpen(false)}
            className={`py-3 px-4 rounded-lg ${
              isActive("/services") ? "bg-gray-700 text-[#6148F4] font-medium" : "text-gray-300 hover:bg-gray-700"
            }`}
          >
            Services
          </Link>
          <Link
            href="/pricing"
            onClick={() => setMenuOpen(false)}
            className={`py-3 px-4 rounded-lg ${
              isActive("/pricing") ? "bg-gray-700 text-[#6148F4] font-medium" : "text-gray-300 hover:bg-gray-700"
            }`}
          >
            Pricing
          </Link>

          <div className="border-t border-gray-700 pt-4 mt-2">
            {!isAuthChecked ? (
              <div className="flex flex-col space-y-3">
                <div className="bg-gray-700 h-10 rounded-lg animate-pulse"></div>
                <div className="bg-gray-700 h-10 rounded-lg animate-pulse"></div>
              </div>
            ) : isAuthenticated && user ? (
              <div className="flex flex-col space-y-3">
                <div className="flex items-center gap-2 p-3 rounded-lg bg-gray-700">
                  <span className="text-sm text-gray-300">Logged in as {user.name || "User"}</span>
                </div>
                <Link href="/dashboard" onClick={() => setMenuOpen(false)}>
                  <button className="w-full bg-[#6148F4] text-white py-3 rounded-lg hover:bg-[#5040D9] transition-colors">
                    Dashboard
                  </button>
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 border border-red-500 text-red-400 py-3 rounded-lg hover:bg-red-500/10 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex flex-col space-y-3">
                <Link href="/login" onClick={() => setMenuOpen(false)}>
                  <button className="w-full border border-gray-600 text-gray-300 py-3 rounded-lg hover:bg-gray-700 transition-colors">
                    Log in
                  </button>
                </Link>
                {!isAuthenticated && (
                  <Link href="/register" onClick={() => setMenuOpen(false)}>
                    <button className="w-full bg-[#6148F4] text-white py-3 rounded-lg hover:bg-[#5040D9] transition-colors">
                      Get Started
                    </button>
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
