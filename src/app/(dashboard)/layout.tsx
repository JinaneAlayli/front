"use client"

import type { ReactNode } from "react"
import ProtectedRoute from "@/components/ProtectedRoute"
import Sidebar from "@/components/Sidebar"
import DashboardHeader from "@/components/DashboardHeader"
import { useState, useEffect } from "react"

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(false)

  // Effect to load collapsed state from localStorage
  useEffect(() => {
    const savedState = localStorage.getItem("sidebarCollapsed")
    if (savedState !== null) {
      setIsCollapsed(savedState === "true")
    }

    // Listen for changes to the sidebar state
    const handleStorageChange = () => {
      const newState = localStorage.getItem("sidebarCollapsed")
      if (newState !== null) {
        setIsCollapsed(newState === "true")
      }
    }

    window.addEventListener("storage", handleStorageChange)

    // Also check periodically for changes
    const interval = setInterval(handleStorageChange, 500)

    return () => {
      window.removeEventListener("storage", handleStorageChange)
      clearInterval(interval)
    }
  }, [])

  return (
    <ProtectedRoute>
      <div className="flex min-h-screen bg-[#FAF9F7]">
        {/* Sidebar - fixed position */}
        <Sidebar onToggle={setIsCollapsed} />

        {/* Main content area - dynamically adjusts based on sidebar state */}
        <div
          className={`flex flex-col flex-1 transition-all duration-300 min-h-screen ${
            isCollapsed ? "lg:ml-20" : "lg:ml-72"
          }`}
        >
          {/* Fixed header */}
          <DashboardHeader />

          {/* Scrollable content area */}
          <main className="flex-1 p-6 overflow-y-auto">{children}</main>
        </div>
      </div>
    </ProtectedRoute>
  )
}
