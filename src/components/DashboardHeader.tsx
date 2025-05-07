"use client"

import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import { Menu, Search } from "lucide-react"
import NotificationSystem from "./NotificationSystem"

interface DashboardHeaderProps {
  toggleSidebar?: () => void
}

export default function DashboardHeader({ toggleSidebar }: DashboardHeaderProps) {
  const pathname = usePathname()
  const [pageTitle, setPageTitle] = useState("")
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    // Set page title based on pathname
    const path = pathname.split("/")[1]
    if (!path) {
      setPageTitle("Dashboard")
    } else {
      setPageTitle(path.charAt(0).toUpperCase() + path.slice(1).replace(/-/g, " "))
    }

    // Add scroll event listener
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }

    window.addEventListener("scroll", handleScroll)
    return () => {
      window.removeEventListener("scroll", handleScroll)
    }
  }, [pathname])

  return (
    <header
      className={`sticky top-0 z-10 flex h-16 items-center justify-between border-b border-gray-100 bg-white px-4 transition-shadow md:px-6 ${
        isScrolled ? "shadow-sm" : ""
      }`}
    >
      <div className="flex items-center">
        {toggleSidebar && (
          <button
            onClick={toggleSidebar}
            className="mr-4 flex h-10 w-10 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-700 md:hidden"
            aria-label="Toggle sidebar"
          >
            <Menu size={20} />
          </button>
        )}
        <h1 className="text-xl font-semibold text-gray-800">{pageTitle}</h1>
      </div>

      <div className="flex items-center space-x-3">
        <div className="relative hidden md:block">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search..."
            className="w-64 rounded-lg border border-gray-200 bg-gray-50 py-2 pl-10 pr-4 text-sm text-gray-700 focus:border-[#6148F4] focus:outline-none focus:ring-1 focus:ring-[#6148F4]/50"
          />
        </div>

        <NotificationSystem />
      </div>
    </header>
  )
}
