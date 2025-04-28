"use client"

import { useState, type FormEvent } from "react"
import api from "@/lib/api"
import { toast } from "react-toastify"
import emailjs from "@emailjs/browser"
import { Mail, Link, User, Briefcase, Users, Shield } from "lucide-react"

export default function InviteForm({ onSuccess }: { onSuccess: () => void }) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    position: "",
    role_id: 5,
    team_id: undefined as number | "" | undefined,
  })

  const [sendMode, setSendMode] = useState<"email" | "copy" | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!sendMode) return

    setIsSubmitting(true)

    try {
      const res = await api.post("/employee-invites", {
        ...form,
        team_id: form.team_id === "" ? undefined : form.team_id,
      })

      const { link } = res.data
      if (!link) throw new Error("No link returned from server")

      if (sendMode === "copy") {
        navigator.clipboard.writeText(link)
        toast.success("Link copied to clipboard!")
      } else if (sendMode === "email") {
        await emailjs.send(
          "service_4xquj6m",
          "template_l7kq4h9",
          {
            to_name: form.name,
            email: form.email,
            invite_link: link,
          },
          "li0aeRFYqDzj79DvY",
        )
        toast.success("Invite sent by email!")
      }

      setForm({ name: "", email: "", position: "", role_id: 5, team_id: undefined })
      onSuccess()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Invite failed")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100 max-w-2xl mx-auto">
      <div className="p-6 border-b border-gray-100">
        <h2 className="text-xl font-semibold text-gray-800">Invite New Employee</h2>
        <p className="text-sm text-gray-500 mt-1">Send an invitation to join your organization</p>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-5">
        <div className="space-y-5">
          {/* Name Field */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Full Name
            </label>
            <div className="relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User size={18} className="text-gray-400" />
              </div>
              <input
                type="text"
                id="name"
                placeholder="John Doe"
                className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
          </div>

          {/* Email Field */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <div className="relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail size={18} className="text-gray-400" />
              </div>
              <input
                type="email"
                id="email"
                placeholder="john@example.com"
                className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>
          </div>

          {/* Position Field */}
          <div>
            <label htmlFor="position" className="block text-sm font-medium text-gray-700 mb-1">
              Position
            </label>
            <div className="relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Briefcase size={18} className="text-gray-400" />
              </div>
              <input
                type="text"
                id="position"
                placeholder="Software Engineer"
                className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                value={form.position}
                onChange={(e) => setForm({ ...form, position: e.target.value })}
              />
            </div>
          </div>

          {/* Role Selection */}
          <div>
            <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
              Role
            </label>
            <div className="relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Shield size={18} className="text-gray-400" />
              </div>
              <select
                id="role"
                className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm appearance-none bg-none"
                value={form.role_id}
                onChange={(e) => setForm({ ...form, role_id: Number.parseInt(e.target.value) })}
              >
                <option value={5}>Employee</option>
                <option value={4}>Team Leader</option>
                <option value={3}>HR Manager</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          {/* Team Selection (Placeholder) */}
          <div>
            <label htmlFor="team" className="block text-sm font-medium text-gray-700 mb-1">
              Team (Optional)
            </label>
            <div className="relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Users size={18} className="text-gray-400" />
              </div>
              <select
                id="team"
                className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm appearance-none bg-none"
                value={form.team_id === undefined ? "" : form.team_id}
                onChange={(e) =>
                  setForm({ ...form, team_id: e.target.value === "" ? undefined : Number.parseInt(e.target.value) })
                }
              >
                <option value="">No Team</option>
                <option value="1">Engineering</option>
                <option value="2">Marketing</option>
                <option value="3">Sales</option>
                <option value="4">Design</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-4 flex flex-col sm:flex-row gap-3">
          <button
            type="submit"
            onClick={() => setSendMode("email")}
            disabled={isSubmitting}
            className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors flex items-center justify-center"
          >
            <Mail size={18} className="mr-2" />
            {isSubmitting && sendMode === "email" ? "Sending..." : "Send via Email"}
          </button>
          <button
            type="submit"
            onClick={() => setSendMode("copy")}
            disabled={isSubmitting}
            className="flex-1 bg-gray-100 text-gray-800 py-3 px-4 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors flex items-center justify-center"
          >
            <Link size={18} className="mr-2" />
            {isSubmitting && sendMode === "copy" ? "Copying..." : "Copy Invite Link"}
          </button>
        </div>
      </form>
    </div>
  )
}
