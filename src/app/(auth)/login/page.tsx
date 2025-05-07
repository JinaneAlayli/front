"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useDispatch, useSelector } from "react-redux"
import Cookies from "js-cookie"

import { loginSuccess } from "@/lib/redux/slices/authSlice"
import api from "@/lib/api"
import type { RootState } from "@/lib/redux/store"

type FormData = {
  email: string
  password: string
}

export default function LoginPage() {
  const router = useRouter()
  const dispatch = useDispatch()
  const [form, setForm] = useState<FormData>({
    email: "",
    password: "",
  })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { isAuthenticated, isAuthChecked } = useSelector((state: RootState) => state.auth)

  useEffect(() => {
    if (isAuthChecked && isAuthenticated) {
      router.replace("/dashboard")
    }
  }, [isAuthenticated, isAuthChecked, router])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      const res = await api.post("/auth/login", { email: form.email, password: form.password })

      if (res.data.token) {
        Cookies.set("jwt", res.data.token, {
          expires: 1,
          path: "/",
          sameSite: "Lax",
          secure: process.env.NODE_ENV === "production",
        })

        api.defaults.headers.common["Authorization"] = `Bearer ${res.data.token}`
      }

      dispatch(loginSuccess(res.data.user))
      router.push("/dashboard")
    } catch (err: any) {
      setError(err.response?.data?.message || "Login failed. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  if (!isAuthChecked) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-[#F9FAFB] to-[#F3F4F6]">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#6148F4] border-t-transparent"></div>
      </div>
    )
  }

  return (
    <main className="flex min-h-screen bg-gradient-to-br from-[#F9FAFB] to-[#F3F4F6]">
      {/* Left side - Illustration */}
      <div className="hidden w-1/2 items-center justify-center bg-[#6148F4]/5 p-12 lg:flex">
        <div className="relative h-full w-full max-w-lg">
          <div className="absolute -left-6 -top-6 h-24 w-24 rounded-full bg-[#6148F4]/10"></div>
          <div className="absolute -bottom-10 -right-10 h-32 w-32 rounded-full bg-[#6148F4]/10"></div>
          <div className="relative h-full w-full">
            <Image src="/login-illustration.png" alt="Login Illustration" fill priority className="object-contain" />
          </div>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="flex w-full flex-col items-center justify-center p-4 md:p-8 lg:w-1/2">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Welcome back</h1>
            <p className="mt-2 text-sm text-gray-600">Please enter your credentials to access your account</p>
          </div>

          {error && (
            <div className="mb-6 rounded-lg bg-red-50 p-4 text-sm text-red-800 shadow-sm">
              <p>{error}</p>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-gray-700">
                Email Address
              </label>
              <div className="group relative">
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleInputChange}
                  required
                  placeholder="name@example.com"
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 shadow-sm transition-all focus:border-[#6148F4] focus:outline-none focus:ring-2 focus:ring-[#6148F4]/20 group-hover:border-gray-400"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="text-sm font-medium text-gray-700">
                  Password
                </label>
                <Link
                  href="/auth/forgot-password"
                  className="text-xs font-medium text-[#6148F4] transition-colors hover:text-[#5040d3]"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="group relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={handleInputChange}
                  required
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 pr-10 text-gray-900 shadow-sm transition-all focus:border-[#6148F4] focus:outline-none focus:ring-2 focus:ring-[#6148F4]/20 group-hover:border-gray-400"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 transition-colors hover:text-gray-700"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                      <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                      <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                      <line x1="2" x2="22" y1="2" y2="22" />
                    </svg>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                  <span className="sr-only">{showPassword ? "Hide password" : "Show password"}</span>
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="relative w-full overflow-hidden rounded-lg bg-[#6148F4] px-4 py-3 text-sm font-medium text-white shadow-md transition-all hover:bg-[#5040d3] focus:outline-none focus:ring-2 focus:ring-[#6148F4]/50 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
            >
              <span
                className={`flex items-center justify-center transition-all ${isLoading ? "opacity-0" : "opacity-100"}`}
              >
                Sign in
              </span>
              {isLoading && (
                <span className="absolute inset-0 flex items-center justify-center">
                  <svg
                    className="h-5 w-5 animate-spin text-white"
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
                </span>
              )}
            </button>
          </form>

          <div className="mt-8 text-center text-sm">
            Don't have an account?{" "}
            <Link href="/auth/register" className="font-medium text-[#6148F4] transition-colors hover:text-[#5040d3]">
              Create an account
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}
