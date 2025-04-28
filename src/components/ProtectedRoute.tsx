"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useSelector } from "react-redux"
import type { RootState } from "@/lib/redux/store"

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { isAuthenticated, isAuthChecked } = useSelector((state: RootState) => state.auth)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    // Mark that we're now on the client
    setIsClient(true)

    if (isAuthChecked && !isAuthenticated) {
      router.replace("/login")
    }
  }, [isAuthChecked, isAuthenticated, router])

  // Only show loading on client-side to avoid hydration mismatch
  if (!isClient || !isAuthChecked) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="p-6 text-center">Loading...</div>
      </div>
    )
  }

  return isAuthenticated ? <>{children}</> : null
}
