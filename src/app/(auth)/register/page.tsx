"use client"
 export const dynamic = 'force-dynamic'
import type React from "react"
import { Suspense } from "react"
import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { toast } from "react-toastify"
import api from "@/lib/api"

type InviteData = {
  email: string
  role_id: number
  team_id: number
  company_id: number
}

type FormData = {
  name: string
  email: string
  password: string
}

export default function RegisterPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token")

  const [invite, setInvite] = useState<InviteData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [form, setForm] = useState<FormData>({
    name: "",
    email: "",
    password: "",
  })

  useEffect(() => {
    if (!token) {
      setIsLoading(false)
      setError("No invite token provided")
      return
    }

    api
      .get(`/employee-invites/${token}`)
      .then((res) => {
        setInvite(res.data)
        setForm((prev) => ({ ...prev, email: res.data.email || "" }))
      })
      .catch(() => {
        toast.error("Invalid or expired invite token")
        router.push("/")
      })
      .finally(() => {
        setIsLoading(false)
      })
  }, [token, router])

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!invite) return toast.error("Invite not found")

    setIsSubmitting(true)
    setError("")

    try {
      const payload = {
        ...form,
        token,
        role_id: invite.role_id,
        team_id: invite.team_id,
        company_id: invite.company_id,
      }

      await api.post("/users/register", payload)
      toast.success("Registered successfully!")
      router.push("/auth/login")
    } catch (err: any) {
      setError(err.response?.data?.message || "Registration failed")
      toast.error(err.response?.data?.message || "Registration failed")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const getRoleName = () => {
    if (!invite) return "Employee"
    return invite.role_id === 3 ? "HR" : invite.role_id === 4 ? "Team Leader" : "Employee"
  }

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#6148F4] border-t-transparent"></div>
      </div>
    )
  }

  if (error && !invite) {
    return (
      <div className="flex h-screen items-center justify-center p-4">
        <div className="w-full max-w-md rounded-lg bg-red-50 p-4 text-red-800">
          <p>{error}</p>
        </div>
      </div>
    )
  }

  return (
    <Suspense fallback={<div>Loading...</div>}>
    <main className="flex min-h-screen items-center justify-center bg-[#FAF9F7] p-4 md:p-6">
      <div className="w-full max-w-md">
        <div className="overflow-hidden rounded-xl bg-white shadow-lg">
          <div className="space-y-1 p-6">
            <h1 className="text-2xl font-bold text-gray-900">Create your account</h1>
            <p className="text-sm text-gray-500">
              You're joining as{" "}
              <span className="ml-1 inline-flex rounded-full bg-[#6148F4]/10 px-2.5 py-0.5 text-xs font-medium text-[#6148F4]">
                {getRoleName()}
              </span>
            </p>
          </div>
          <div className="p-6 pt-0">
            {error && (
              <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-800">
                <p>{error}</p>
              </div>
            )}

            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium text-gray-700">
                  Full Name
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={form.name}
                  onChange={handleInputChange}
                  placeholder="John"
                  required
                  className="w-full rounded-md border border-gray-300 px-4 py-2 focus:border-[#6148F4] focus:outline-none focus:ring-2 focus:ring-[#6148F4]/50"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-gray-700">
                  Email Address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={form.email}
                  readOnly
                  required
                  className="w-full rounded-md border border-gray-300 bg-gray-50 px-4 py-2 text-gray-500"
                />
                <p className="text-xs text-gray-500">This email is associated with your invite</p>
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium text-gray-700">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  value={form.password}
                  onChange={handleInputChange}
                  placeholder="Create a secure password"
                  required
                  className="w-full rounded-md border border-gray-300 px-4 py-2 focus:border-[#6148F4] focus:outline-none focus:ring-2 focus:ring-[#6148F4]/50"
                />
                <p className="text-xs text-gray-500">Password should be at least 8 characters long</p>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-md bg-[#6148F4] py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#5040d3] focus:outline-none focus:ring-2 focus:ring-[#6148F4]/50 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center">
                    <svg
                      className="mr-2 h-4 w-4 animate-spin"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Creating account...
                  </span>
                ) : (
                  "Complete Registration"
                )}
              </button>

              <div className="text-center text-sm">
                <button
                  type="button"
                  className="text-[#6148F4] hover:text-[#5040d3] hover:underline"
                  onClick={() => router.push("/auth/login")}
                >
                  Already have an account? Sign in
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </main>
    </Suspense>
  )
}
