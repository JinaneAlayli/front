"use client"

import { useState, type FormEvent } from "react"
import api from "@/lib/api"
import { toast } from "react-toastify"
import emailjs from "@emailjs/browser"
import { Mail, LinkIcon, User, Briefcase, Users, Shield, X } from "lucide-react"

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-hidden rounded-xl bg-white shadow-xl animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between border-b border-gray-100 bg-[#6148F4]/5 p-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">Invite New Employee</h2>
            <p className="mt-1 text-sm text-gray-500">Send an invitation to join your organization</p>
          </div>
          <button onClick={onSuccess} className="focus:outline-none text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="max-h-[calc(90vh-80px)] overflow-y-auto space-y-5 p-6">
          <div className="space-y-5">
            {/* Name Field */}
            <div>
              <label htmlFor="name" className="mb-1 block text-sm font-medium text-gray-700">
                Full Name
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <User size={18} className="text-gray-400" />
                </div>
                <input
                  type="text"
                  id="name"
                  placeholder="John Doe"
                  className="block w-full rounded-lg border border-gray-300 py-3 pl-10 pr-3 text-sm shadow-sm transition-all focus:border-[#6148F4] focus:outline-none focus:ring-2 focus:ring-[#6148F4]/20"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>
            </div>

            {/* Email Field */}
            <div>
              <label htmlFor="email" className="mb-1 block text-sm font-medium text-gray-700">
                Email Address
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Mail size={18} className="text-gray-400" />
                </div>
                <input
                  type="email"
                  id="email"
                  placeholder="john@example.com"
                  className="block w-full rounded-lg border border-gray-300 py-3 pl-10 pr-3 text-sm shadow-sm transition-all focus:border-[#6148F4] focus:outline-none focus:ring-2 focus:ring-[#6148F4]/20"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                />
              </div>
            </div>

            {/* Position Field */}
            <div>
              <label htmlFor="position" className="mb-1 block text-sm font-medium text-gray-700">
                Position
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Briefcase size={18} className="text-gray-400" />
                </div>
                <input
                  type="text"
                  id="position"
                  placeholder="Software Engineer"
                  className="block w-full rounded-lg border border-gray-300 py-3 pl-10 pr-3 text-sm shadow-sm transition-all focus:border-[#6148F4] focus:outline-none focus:ring-2 focus:ring-[#6148F4]/20"
                  value={form.position}
                  onChange={(e) => setForm({ ...form, position: e.target.value })}
                />
              </div>
            </div>

            {/* Role Selection */}
            <div>
              <label htmlFor="role" className="mb-1 block text-sm font-medium text-gray-700">
                Role
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Shield size={18} className="text-gray-400" />
                </div>
                <select
                  id="role"
                  className="block w-full appearance-none rounded-lg border border-gray-300 bg-none py-3 pl-10 pr-10 text-sm shadow-sm transition-all focus:border-[#6148F4] focus:outline-none focus:ring-2 focus:ring-[#6148F4]/20"
                  value={form.role_id}
                  onChange={(e) => setForm({ ...form, role_id: Number.parseInt(e.target.value) })}
                >
                  <option value={5}>Employee</option>
                  <option value={4}>Team Leader</option>
                  <option value={3}>HR Manager</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                  <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Team Selection */}
            <div>
              <label htmlFor="team" className="mb-1 block text-sm font-medium text-gray-700">
                Team (Optional)
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Users size={18} className="text-gray-400" />
                </div>
                <select
                  id="team"
                  className="block w-full appearance-none rounded-lg border border-gray-300 bg-none py-3 pl-10 pr-10 text-sm shadow-sm transition-all focus:border-[#6148F4] focus:outline-none focus:ring-2 focus:ring-[#6148F4]/20"
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
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                  <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-3 pt-4 sm:flex-row">
            <button
              type="button"
              onClick={onSuccess}
              className="rounded-lg border border-gray-300 px-4 py-2.5 text-gray-700 transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              Cancel
            </button>
            <button
              type="submit"
              onClick={() => setSendMode("email")}
              disabled={isSubmitting}
              className="flex flex-1 items-center justify-center rounded-lg bg-[#6148F4] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#5040d3] focus:outline-none focus:ring-2 focus:ring-[#6148F4]/50 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
            >
              <Mail size={18} className="mr-2" />
              {isSubmitting && sendMode === "email" ? "Sending..." : "Send via Email"}
            </button>
            <button
              type="submit"
              onClick={() => setSendMode("copy")}
              disabled={isSubmitting}
              className="flex flex-1 items-center justify-center rounded-lg bg-gray-100 px-4 py-2.5 text-sm font-medium text-gray-800 transition-colors hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
            >
              <LinkIcon size={18} className="mr-2" />
              {isSubmitting && sendMode === "copy" ? "Copying..." : "Copy Invite Link"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
