"use client"

import { useSelector } from "react-redux"
import type { RootState } from "@/lib/redux/store"
import ProtectedRoute from "@/components/ProtectedRoute"

export default function DashboardPage() {
  const { user } = useSelector((state: RootState) => state.auth)

  return (
    <ProtectedRoute>
      <div className="p-8">
        <h1 className="text-2xl font-bold">Welcome {user?.email}</h1>
        <p>Your Role ID is: {user?.role_id}</p>
      </div>
    </ProtectedRoute>
  )
}
