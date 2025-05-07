import type { ReactNode } from "react"
import ProtectedRoute from "@/components/ProtectedRoute"
import Sidebar from "@/components/Sidebar"
import DashboardHeader from "@/components/DashboardHeader"

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute>
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex flex-col flex-1">
          <DashboardHeader />
          <main className="flex-1 bg-[#FAF9F7] p-6">{children}</main>
        </div>
      </div>
    </ProtectedRoute>
  )
}
