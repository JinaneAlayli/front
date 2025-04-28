"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useDispatch, useSelector } from "react-redux"
import type { RootState } from "@/lib/redux/store"
import { logout } from "@/lib/redux/slices/authSlice"
import api from "@/lib/api"

import {
  Home,
  Users,
  Clock,
  ClipboardCheck,
  Megaphone,
  TrendingUp,
  Settings,
  LogOut,
  UserCircle,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  UserPlus ,
} from "lucide-react"

import Image from "next/image"
import { useState, useEffect } from "react"
import ProfileModal from "./ProfileModal"

// Utility function for conditionally joining classNames
function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(" ")
}

export default function Sidebar() {
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

  // Effect to load collapsed state from localStorage
  useEffect(() => {
    const savedState = localStorage.getItem("sidebarCollapsed")
    if (savedState !== null) {
      setIsCollapsed(savedState === "true")
    }
  }, [])

  // Effect to save collapsed state to localStorage
  useEffect(() => {
    localStorage.setItem("sidebarCollapsed", isCollapsed.toString())
  }, [isCollapsed])

  // Effect to update profile image when user data changes
  useEffect(() => {
    if (user?.profile_img) {
      setImageError(false)

      // Check if the URL is already absolute (starts with http or https)
      if (user.profile_img.startsWith("http")) {
        setProfileImageUrl(user.profile_img)
      } else {
        // If it's a relative URL, make sure it's properly formatted
        setProfileImageUrl(user.profile_img.startsWith("/") ? user.profile_img : `/${user.profile_img}`)
      }
    } else {
      setProfileImageUrl("/profile.png")
    }
  }, [user])

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

  const commonLinks = [{ href: "/dashboard", label: "Home", icon: <Home size={18} /> }]

  const ownerLinks = [
    ...commonLinks,
    { href: "/employees", label: "Employees", icon: <Users size={18} /> },
    { href: "/teams", label: "Teams", icon: <UserPlus size={18} /> },
    { href: "/attendance", label: "Attendance", icon: <Clock size={18} /> },
    { href: "/tasks", label: "Tasks", icon: <ClipboardCheck size={18} /> },
    { href: "/announcements", label: "Announcement", icon: <Megaphone size={18} /> },
    { href: "/analytics", label: "Analytics", icon: <TrendingUp size={18} /> },
    { href: "/business-settings", label: "Business Settings", icon: <Settings size={18} /> },
    { href: "/SalaryManagement", label: "Salary Management", icon: <Settings size={18} /> },
  ]
  
  const hrLinks = [
    ...commonLinks,
    { href: "/employees", label: "Employees", icon: <Users size={18} /> },
    { href: "/teams", label: "Teams", icon: <UserPlus size={18} /> },
    { href: "/attendance", label: "Attendance", icon: <Clock size={18} /> },
    { href: "/tasks", label: "Tasks", icon: <ClipboardCheck size={18} /> },
    { href: "/announcements", label: "Announcement", icon: <Megaphone size={18} /> },
  ]

  const employeeLinks = [
    ...commonLinks,
    { href: "/attendance", label: "Attendance", icon: <Clock size={18} /> },
    { href: "/tasks", label: "Tasks", icon: <ClipboardCheck size={18} /> },
    { href: "/profile", label: "My Profile", icon: <UserCircle size={18} /> },
  ]

  let linksToRender = employeeLinks
  if (user?.role_id === 2) linksToRender = ownerLinks
  else if (user?.role_id === 3) linksToRender = hrLinks

  const getRoleName = () => {
    if (user?.role_id === 2) return "Owner"
    if (user?.role_id === 3) return "HR Manager"
    return "Employee"
  }

  const getRoleColor = () => {
    if (user?.role_id === 2) return "text-purple-600"
    if (user?.role_id === 3) return "text-blue-600"
    return "text-green-600"
  }

  return (
    <>
      <aside
        className={cn(
          "h-screen bg-white flex flex-col transition-all duration-300 ease-in-out relative",
          isCollapsed ? "w-16" : "w-64",
        )}
      >
        {/* Toggle button */}
        <button
          onClick={toggleSidebar}
          className="absolute -right-3 top-16 bg-white rounded-full p-1 shadow-md z-10 text-gray-500 hover:text-indigo-600 transition-colors"
        >
          {isCollapsed ? <ChevronsRight size={16} /> : <ChevronsLeft size={16} />}
        </button>

        {/* Logo area */}
        <div
          className={cn(
            "flex items-center justify-center transition-all duration-300",
            isCollapsed ? "py-4 px-0" : "py-6 px-4",
          )}
        >
          {isCollapsed ? (
            logoIconError ? (
              <div className="w-10 h-10 rounded-md bg-indigo-600 flex items-center justify-center text-white font-bold">
                B
              </div>
            ) : (
              <div className="w-12 h-12 relative flex items-center justify-center">
                <Image
                  src="/logopart.png"
                  alt="Beteamly Logo Icon"
                  width={48}
                  height={48}
                  className="object-contain"
                  onError={handleLogoIconError}
                  unoptimized
                />
              </div>
            )
          ) : logoError ? (
            <h2 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
              Beteamly
            </h2>
          ) : (
            <div className="h-12 w-full flex items-center justify-center">
              <Image
                src="/logo.png"
                alt="Beteamly Logo"
                width={200}
                height={48}
                className="object-contain"
                onError={handleLogoError}
                priority
                unoptimized
              />
            </div>
          )}
        </div>

        <div className="flex-1 flex flex-col overflow-auto px-3">
          {/* Profile Block */}
          <div
            className={cn("py-4 cursor-pointer group", isCollapsed ? "px-0" : "px-2")}
            onClick={() => setOpenProfileModal(true)}
          >
            <div className={cn("flex items-center", isCollapsed ? "justify-center" : "gap-3")}>
              <div className="h-10 w-10 rounded-full overflow-hidden flex-shrink-0 bg-gray-50">
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
                    <p className={cn("text-xs font-medium", getRoleColor())}>{getRoleName()}</p>
                  </div>
                  <ChevronRight
                    size={16}
                    className="text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity"
                  />
                </>
              )}
            </div>
          </div>

          {/* Nav Links */}
          <div className="py-6">
            {!isCollapsed && (
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-4 px-2">Navigation</p>
            )}
            <nav className="space-y-1">
              {linksToRender.map((link) => {
                const isActive = pathname === link.href
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      "flex items-center gap-3 py-2.5 rounded-md text-sm font-medium transition-all",
                      isCollapsed ? "justify-center px-0" : "px-3",
                      isActive ? "bg-indigo-50 text-indigo-700" : "text-gray-600 hover:text-gray-900 hover:bg-gray-50",
                    )}
                    title={isCollapsed ? link.label : undefined}
                  >
                    <span
                      className={cn("flex items-center justify-center", isActive ? "text-indigo-600" : "text-gray-400")}
                    >
                      {link.icon}
                    </span>
                    {!isCollapsed && (
                      <>
                        <span>{link.label}</span>
                        {isActive && <span className="ml-auto w-1 h-1 rounded-full bg-indigo-600" />}
                      </>
                    )}
                  </Link>
                )
              })}
            </nav>
          </div>
        </div>

        {/* Logout */}
        <div className={cn("p-3", isCollapsed ? "flex justify-center" : "px-5")}>
          <button
            onClick={handleLogout}
            className={cn(
              "flex items-center gap-3 py-2.5 text-sm font-medium text-gray-600 hover:text-red-600 transition-colors",
              isCollapsed ? "justify-center px-0 w-10" : "px-3 w-full",
            )}
            title={isCollapsed ? "Logout" : undefined}
          >
            <span className="text-gray-400">
              <LogOut size={18} />
            </span>
            {!isCollapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      <ProfileModal isOpen={openProfileModal} onClose={() => setOpenProfileModal(false)} user={user} />
    </>
  )
}
