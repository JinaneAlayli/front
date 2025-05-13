"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useDispatch, useSelector } from "react-redux"
import type { RootState } from "@/lib/redux/store"
import { logout, updateUser } from "@/lib/redux/slices/authSlice"
import api from "@/lib/api"
import {
  Home,
  Users,
  Clock,
  ClipboardCheck,
  Megaphone,
  Settings,
  LogOut,
  UserCircle,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  UserPlus,
  DollarSign,
  BarChart4,
  Menu,
  CreditCard,
  Badge,
  Briefcase,
  CalendarIcon as CalendarArrowUp,
} from "lucide-react"

import Image from "next/image"
import { useState, useEffect } from "react"
import ProfileModal from "./ProfileModal"
import Cookies from "js-cookie"

// Utility function for conditionally joining classNames
function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(" ")
}

interface SidebarProps {
  onToggle?: (collapsed: boolean) => void
}

export default function Sidebar({ onToggle }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const dispatch = useDispatch()
  const user = useSelector((state: RootState) => state.auth.user)

  const [openProfileModal, setOpenProfileModal] = useState(false)
  const [imageError, setImageError] = useState(false)
  const [profileImageUrl, setProfileImageUrl] = useState("/profile.png")
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [logoError, setLogoError] = useState(false)
  const [logoIconError, setLogoIconError] = useState(false)
  const [imageTimestamp, setImageTimestamp] = useState<string>("")
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [hoveredLink, setHoveredLink] = useState<string | null>(null)

  // Effect to load collapsed state from localStorage
  useEffect(() => {
    const savedState = localStorage.getItem("sidebarCollapsed")
    if (savedState !== null) {
      setIsCollapsed(savedState === "true")
    }

    // Get the image timestamp if it exists
    const timestamp = localStorage.getItem("profileImageTimestamp")
    if (timestamp) {
      setImageTimestamp(timestamp)
    }
  }, [])

  // Effect to save collapsed state to localStorage
  useEffect(() => {
    localStorage.setItem("sidebarCollapsed", isCollapsed.toString())
    // Notify parent component about the change
    if (onToggle) {
      onToggle(isCollapsed)
    }
  }, [isCollapsed, onToggle])

  // Listen for changes to the profileImageTimestamp in localStorage
  useEffect(() => {
    const handleStorageChange = () => {
      const newTimestamp = localStorage.getItem("profileImageTimestamp")
      if (newTimestamp && newTimestamp !== imageTimestamp) {
        setImageTimestamp(newTimestamp)
      }
    }

    // Check for changes every second
    const interval = setInterval(handleStorageChange, 1000)

    // Add event listener for storage changes from other tabs
    window.addEventListener("storage", handleStorageChange)

    return () => {
      clearInterval(interval)
      window.removeEventListener("storage", handleStorageChange)
    }
  }, [imageTimestamp])

  // Effect to update profile image when user data or timestamp changes
  useEffect(() => {
    if (user?.profile_img) {
      setImageError(false)

      // Add timestamp to force refresh if available
      const timestamp = imageTimestamp || Date.now().toString()

      // Check if the URL is already absolute (starts with http or https)
      if (user.profile_img.startsWith("http")) {
        // For absolute URLs, add a query parameter to force refresh
        const separator = user.profile_img.includes("?") ? "&" : "?"
        setProfileImageUrl(`${user.profile_img}${separator}t=${timestamp}`)
      } else {
        // If it's a relative URL, make sure it's properly formatted
        const formattedUrl = user.profile_img.startsWith("/") ? user.profile_img : `/${user.profile_img}`
        setProfileImageUrl(`${formattedUrl}?t=${timestamp}`)
      }
    } else {
      setProfileImageUrl("/profile.png")
    }
  }, [user, imageTimestamp])

  // Refresh user data when component mounts to ensure we have the latest profile image
  useEffect(() => {
    const refreshUserData = async () => {
      try {
        const res = await api.get("/users/me")
        dispatch(updateUser(res.data))
      } catch (error) {
        console.error("Failed to refresh user data:", error)
      }
    }

    refreshUserData()
  }, [dispatch])

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [pathname])

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

  const handleImageError = () => {
    setImageError(true)
    setProfileImageUrl("/profile.png")
  }

  const handleLogoError = () => {
    setLogoError(true)
  }

  const handleLogoIconError = () => {
    setLogoIconError(true)
  }

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed)
  }

  const commonLinks = [{ href: "/dashboard", label: "Home", icon: <Home size={20} /> }]

  const PlatformownerLinks = [
    { href: "/admin/companies", label: "companies", icon: <Briefcase size={20} /> },
    { href: "/admin/subscription-plans", label: "subscription-plans", icon: <Badge size={20} /> },
    { href: "/admin/users", label: "users", icon: <Users size={20} /> },
  ]

  const ownerLinks = [
    ...commonLinks,
    { href: "/employees", label: "Employees", icon: <Users size={20} /> },
    { href: "/teams", label: "Teams", icon: <UserPlus size={20} /> },
    { href: "/attendance", label: "Attendance", icon: <Clock size={20} /> },
    { href: "/tasks", label: "Tasks", icon: <ClipboardCheck size={20} /> },
    { href: "/announcements", label: "Announcement", icon: <Megaphone size={20} /> },
    { href: "/analytics", label: "Analytics", icon: <BarChart4 size={20} /> },
    { href: "/salaries", label: "Salary Management", icon: <DollarSign size={20} /> },
    { href: "/business-settings", label: "Business Settings", icon: <Settings size={20} /> },
    { href: "/subscription", label: "subscription plan", icon: <CreditCard size={20} /> },
    { href: "/leave-requests", label: "leave requests", icon: <CalendarArrowUp size={20} /> },
  ]

  const hrLinks = [
    ...commonLinks,
    { href: "/employees", label: "Employees", icon: <Users size={20} /> },
    { href: "/teams", label: "Teams", icon: <UserPlus size={20} /> },
    { href: "/attendance", label: "Attendance", icon: <Clock size={20} /> },
    { href: "/tasks", label: "Tasks", icon: <ClipboardCheck size={20} /> },
    { href: "/announcements", label: "Announcement", icon: <Megaphone size={20} /> },
    { href: "/salaries", label: "Salary Management", icon: <DollarSign size={20} /> },
    { href: "/leave-requests", label: "leave requests", icon: <CalendarArrowUp size={20} /> },
  ]

  const employeeLinks = [
    ...commonLinks,
    { href: "/attendance", label: "Attendance", icon: <Clock size={20} /> },
    { href: "/tasks", label: "Tasks", icon: <ClipboardCheck size={20} /> },
    { href: "/salaries", label: "Salary Management", icon: <DollarSign size={20} /> },
    { href: "/leave-requests", label: "leave requests", icon: <CalendarArrowUp size={20} /> },
    { href: "/announcements", label: "Announcement", icon: <Megaphone size={20} /> },
  ]

  let linksToRender = employeeLinks
  if (user?.role_id === 2) linksToRender = ownerLinks
  else if (user?.role_id === 3) linksToRender = hrLinks
  else if (user?.role_id === 1) linksToRender = PlatformownerLinks

  const getRoleName = () => {
    if (user?.role_id === 2) return "Owner"
    if (user?.role_id === 3) return "HR Manager"
    if (user?.role_id === 4) return "Team Leader"
    if (user?.role_id === 1) return "Platform owner"
    return "Employee"
  }

  const getRoleColor = () => {
    if (user?.role_id === 2) return "bg-purple-100 text-purple-700"
    if (user?.role_id === 3) return "bg-blue-100 text-blue-700"
    return "bg-green-100 text-green-700"
  }

  return (
    <>
      {/* Mobile menu button - visible on small screens */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-full bg-white/90 backdrop-blur-sm shadow-lg text-gray-700 hover:text-indigo-600 transition-colors"
        aria-label="Toggle menu"
      >
        <Menu size={20} />
      </button>

      {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "h-screen fixed top-0 left-0 z-40 bg-white/95 backdrop-blur-sm flex flex-col transition-all duration-300 ease-in-out border-r border-gray-100/50 shadow-[0_0_15px_rgba(0,0,0,0.02)]",
          isCollapsed ? "w-20" : "w-72",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
        {/* Toggle button */}
        <button
          onClick={toggleSidebar}
          className="hidden lg:flex absolute -right-3 top-20 bg-white rounded-full p-1.5 shadow-md z-10 text-gray-500 hover:text-indigo-600 transition-colors"
        >
          {isCollapsed ? <ChevronsRight size={16} /> : <ChevronsLeft size={16} />}
        </button>

        {/* Empty space before profile section */}
        <div className="h-8"></div>

        {/* Profile Block */}
        <div
          className={cn(
            "mx-3 rounded-xl transition-all duration-300 cursor-pointer group hover:bg-gray-50/80",
            isCollapsed ? "p-2" : "p-3",
          )}
          onClick={() => setOpenProfileModal(true)}
        >
          <div className={cn("flex items-center", isCollapsed ? "justify-center" : "gap-3")}>
            <div className="h-10 w-10 rounded-full overflow-hidden flex-shrink-0 ring-2 ring-white shadow-sm">
              {imageError ? (
                <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-500">
                  <UserCircle size={20} />
                </div>
              ) : (
                <Image
                  src={profileImageUrl || "/placeholder.svg"}
                  alt={user?.name || "User"}
                  width={40}
                  height={40}
                  className="h-full w-full object-cover"
                  onError={handleImageError}
                  unoptimized
                />
              )}
            </div>
            {!isCollapsed && (
              <>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{user?.name || "Username"}</p>
                  <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                  <span
                    className={cn("text-xs font-medium px-2 py-0.5 rounded-full mt-1 inline-block", getRoleColor())}
                  >
                    {getRoleName()}
                  </span>
                </div>
                <ChevronRight
                  size={16}
                  className="text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity"
                />
              </>
            )}
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent mx-3 my-2"></div>

        {/* Nav Links */}
        <div className={cn("py-2 flex-1", isCollapsed ? "px-2" : "px-3")}>
          {!isCollapsed && <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3 px-3">Menu</p>}
          <nav className="space-y-1">
            {linksToRender.map((link) => {
              const isActive = pathname === link.href
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "flex items-center gap-3 py-2.5 rounded-xl text-sm font-medium transition-all relative group",
                    isCollapsed ? "justify-center mx-auto w-12 h-12" : "px-3",
                    isActive
                      ? "bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700 shadow-sm"
                      : "text-gray-600 hover:bg-gray-50/80",
                  )}
                  title={isCollapsed ? link.label : undefined}
                  onMouseEnter={() => setHoveredLink(link.href)}
                  onMouseLeave={() => setHoveredLink(null)}
                >
                  <span
                    className={cn(
                      "flex items-center justify-center transition-all",
                      isActive
                        ? "text-indigo-600"
                        : hoveredLink === link.href
                          ? "text-indigo-500"
                          : "text-gray-400 group-hover:text-indigo-500",
                    )}
                  >
                    {link.icon}
                  </span>

                  {!isCollapsed && <span className="truncate">{link.label}</span>}

                  {isActive && !isCollapsed && (
                    <span className="absolute right-3 w-1 h-5 rounded-full bg-gradient-to-b from-indigo-600 to-purple-600" />
                  )}

                  {isActive && isCollapsed && (
                    <span className="absolute -right-1 w-1 h-5 rounded-full bg-gradient-to-b from-indigo-600 to-purple-600" />
                  )}
                </Link>
              )
            })}
          </nav>
        </div>

        {/* Logout - no space above */}
        <div className="px-3">
          <button
            onClick={handleLogout}
            className={cn(
              "flex items-center gap-3 py-2.5 rounded-xl text-sm font-medium transition-colors w-full",
              isCollapsed ? "justify-center px-0" : "px-3",
              "text-gray-600 hover:bg-red-50 hover:text-red-600",
            )}
            title={isCollapsed ? "Logout" : undefined}
          >
            <span className={cn("text-gray-400 group-hover:text-red-500")}>
              <LogOut size={20} />
            </span>
            {!isCollapsed && <span>Logout</span>}
          </button>
        </div>

        {/* Big space between logout and logo */}
        <div className="flex-grow min-h-[60px]"></div>

        {/* Logo area at the bottom */}
        <div
          className={cn(
            "flex items-center justify-center transition-all duration-300 pb-4",
            isCollapsed ? "px-2" : "px-6",
          )}
        >
          {isCollapsed ? (
            logoIconError ? (
              <div className="w-10 h-10 rounded-md bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold">
                B
              </div>
            ) : (
              <div className="w-10 h-10 relative flex items-center justify-center">
                <Image
                  src="/logopart.png"
                  alt="Beteamly Logo Icon"
                  width={40}
                  height={40}
                  className="object-contain hover:scale-105 transition-transform"
                  onError={handleLogoIconError}
                  unoptimized
                />
              </div>
            )
          ) : logoError ? (
            <h2 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Beteamly
            </h2>
          ) : (
            <div className="h-12 relative flex items-center justify-center">
              <Image
                src="/logo.png"
                alt="Beteamly Logo"
                width={150}
                height={48}
                className="object-contain max-h-12 hover:scale-105 transition-transform"
                onError={handleLogoError}
                priority
                unoptimized
              />
            </div>
          )}
        </div>
      </aside>

      <ProfileModal isOpen={openProfileModal} onClose={() => setOpenProfileModal(false)} user={user} />
    </>
  )
}
