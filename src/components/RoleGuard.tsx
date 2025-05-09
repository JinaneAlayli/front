"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSelector } from "react-redux"
import type { RootState } from "@/lib/redux/store"

export default function RoleGuard({
  allowedRoles,
  children,
}: {
  allowedRoles: number[]
  children: React.ReactNode
}) {
  const user = useSelector((state: RootState) => state.auth.user)
  const router = useRouter()

  useEffect(() => {
    if (user && !allowedRoles.includes(user.role_id)) {
      router.replace("/dashboard")
    }
  }, [user, allowedRoles, router])

  if (!user || !allowedRoles.includes(user.role_id)) {
    return null 
  }

  return <>{children}</>
}
