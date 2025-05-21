"use client"

import { useEffect, useState,useRef } from "react"
import api from "@/lib/api"
import { toast } from "react-toastify"
import InviteForm from "@/components/employees/InviteForm"
import EmployeeTable from "@/components/employees/EmployeeTable"
import InvitedTable from "@/components/employees/InvitedTable"
import { Users, UserPlus, Mail, Search } from "lucide-react"
import { useRouter } from "next/navigation"
import { useSelector } from "react-redux"
import type { RootState } from "@/lib/redux/store"

export default function EmployeesPage() {

const user = useSelector((state: RootState) => state.auth.user)
const router = useRouter()


  const [users, setUsers] = useState([])
  const [invites, setInvites] = useState([])
  const [reload, setReload] = useState(false)
  const [activeTab, setActiveTab] = useState<"employees" | "invited" | "inviteForm">("employees")
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
const hasRedirected = useRef(false)
  const fetchData = () => {
    setLoading(true)

    Promise.all([
      api.get("/users").then((res) => setUsers(res.data)),
      api.get("/employee-invites").then((res) => setInvites(res.data)),
    ])
      .catch(() => toast.error("Failed to load data"))
      .finally(() => setLoading(false))
  }

useEffect(() => {
  if (user && ![2, 3].includes(user.role_id) && !hasRedirected.current) {
    hasRedirected.current = true
    toast.error("Only company owners and HR can manage employees.")
    router.push("/dashboard")
    return
  }

  if (user && [2, 3].includes(user.role_id)) {
    fetchData()
  }
}, [user])


  const handleRefresh = () => {
    setReload(!reload)
    // Go back to invited tab after successful invite
    setActiveTab("invited")
  }

  const filteredInvites = invites.filter(
    (invite: any) =>
      invite.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invite.email?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <main className="min-h-screen bg-[#FAF9F7] text-gray-900">
      <div className="mx-auto max-w-7xl p-4 md:p-6 lg:p-8">
        <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">Manage Employees</h1>
            <p className="mt-1 text-gray-500">Add, edit and manage your organization's employees</p>
          </div>

          <button
            onClick={() => setActiveTab("inviteForm")}
            className="inline-flex items-center rounded-lg bg-[#6148F4] px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#5040d3] focus:outline-none focus:ring-2 focus:ring-[#6148F4]/50 focus:ring-offset-2"
          >
            <UserPlus size={18} className="mr-2" />
            Invite Employee
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="-mb-px flex space-x-6" aria-label="Tabs">
            <button
              onClick={() => setActiveTab("employees")}
              className={`flex items-center border-b-2 px-1 py-4 text-sm font-medium transition-colors ${
                activeTab === "employees"
                  ? "border-[#6148F4] text-[#6148F4]"
                  : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
              }`}
            >
              <Users size={18} className="mr-2" />
              All Employees
            </button>
            <button
              onClick={() => setActiveTab("invited")}
              className={`flex items-center border-b-2 px-1 py-4 text-sm font-medium transition-colors ${
                activeTab === "invited"
                  ? "border-[#6148F4] text-[#6148F4]"
                  : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
              }`}
            >
              <Mail size={18} className="mr-2" />
              Invited Employees
            </button>
          </nav>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white py-3 pl-10 pr-4 text-sm text-gray-900 shadow-sm transition-all focus:border-[#6148F4] focus:outline-none focus:ring-2 focus:ring-[#6148F4]/20"
            />
          </div>
        </div>

        {/* Tab Content */}
        <div className="mt-6">
          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#6148F4] border-t-transparent"></div>
            </div>
          ) : (
            <>
              {activeTab === "employees" && <EmployeeTable searchTerm={searchTerm} />}
              {activeTab === "invited" && <InvitedTable initialInvites={filteredInvites}  />
}
              {activeTab === "inviteForm" && <InviteForm onSuccess={handleRefresh} />}
            </>
          )}
        </div>
      </div>
    </main>
  )
}
