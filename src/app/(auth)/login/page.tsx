"use client"

import type React from "react"

import Image from "next/image"
import Link from "next/link"
import { useSelector } from "react-redux"
import type { RootState } from "@/lib/redux/store"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useDispatch } from "react-redux"
import { loginSuccess } from "@/lib/redux/slices/authSlice"
import api from "@/lib/api"
import Cookies from "js-cookie"
import { FaEye, FaEyeSlash } from "react-icons/fa"

export default function LoginPage() {
  const router = useRouter()
  const dispatch = useDispatch()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { isAuthenticated, isAuthChecked } = useSelector((state: RootState) => state.auth)

  useEffect(() => {
    if (isAuthChecked && isAuthenticated) {
      router.replace("/dashboard")
    }
  }, [isAuthenticated, isAuthChecked, router])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      const res = await api.post("/auth/login", { email, password })
 
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
    return <div className="p-6 text-center">Loading...</div>
  }

  return (
    <main className="min-h-screen bg-[#FAF9F7] flex items-center justify-center px-4 overflow-hidden">
      <div className="max-w-5xl w-full grid grid-cols-1 md:grid-cols-2 bg-transparent items-center min-h-full">
        {/* Left Illustration */}
        <div className="hidden md:flex items-center justify-center">
          <Image
            src="/login-illustration.png"
            alt="Login Illustration"
            width={450}
            height={450}
            className="object-contain"
          />
        </div>

        {/* Right Form */}
        <div className="bg-white rounded-xl shadow-md p-8 w-full max-w-md mx-auto">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Welcome back!</h2>
          <p className="text-sm text-gray-500 mb-6">Please login to your Beteamly account.</p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#6148F4]"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Password</label>
              <div className="relative mt-1">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#6148F4] pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-3 flex items-center text-gray-500"
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#6148F4] text-white font-semibold py-2 rounded-md hover:bg-[#5743d4] transition disabled:opacity-70"
            >
              {isLoading ? "Logging in..." : "Continue"}
            </button>
          </form>

          <p className="text-sm text-gray-600 mt-4">
            Don't have an account?{" "}
            <Link href="/auth/register" className="text-[#6148F4] font-medium hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </main>
  )
}
