"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { CreditCard, Calendar, AlertCircle, CheckCircle2, ArrowRight } from "lucide-react"
import api from "@/lib/api"
import { useSelector } from "react-redux"

interface SubscriptionPlan {
  id: number
  name: string
  description: string
  price: string
}

interface Company {
  id: number
  name: string
  subscription_plan: SubscriptionPlan
  billing_cycle: string
  started_at: string | null
  ends_at: string | null
}

interface User {
  id: number
  name: string
  email: string
  role_id: number
}

interface RootState {
  auth: {
    user: User | null
  }
}

type RenewalStatus = "idle" | "loading" | "success" | "error"

// Main component with Suspense boundary
export default function SubscriptionClient() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FAF9F7] p-8">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-xl shadow-sm p-8 animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="h-40 bg-gray-200 rounded"></div>
                <div className="h-40 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      }
    >
      <SubscriptionContent />
    </Suspense>
  )
}

// Component that contains the actual subscription content and uses useSearchParams
function SubscriptionContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const user = useSelector((state: RootState) => state.auth.user)
  const [company, setCompany] = useState<Company | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [renewalStatus, setRenewalStatus] = useState<RenewalStatus>("idle")
  const [renewalMessage, setRenewalMessage] = useState<string | null>(null)
  const [renewed, setRenewed] = useState(false)

  useEffect(() => {
    // Check if coming back from successful renewal
    const renewedParam = searchParams.get("renewed")
    if (renewedParam === "true") {
      setRenewed(true)
      setTimeout(() => setRenewed(false), 5000)
    }
  }, [searchParams])

  useEffect(() => {
    // Redirect if not an owner
    if (user && user.role_id !== 2) {
      router.replace("/dashboard")
      return
    }

    const fetchCompanyData = async () => {
      try {
        setLoading(true)
        const response = await api.get("/companies/my-company")
        setCompany(response.data)
        setError(null)
      } catch (err) {
        console.error("Failed to fetch company data:", err)
        setError("Failed to load subscription information. Please try again later.")
      } finally {
        setLoading(false)
      }
    }

    if (user) {
      fetchCompanyData()
    }
  }, [user, router])

  const handleRenewSubscription = async () => {
    try {
      setRenewalStatus("loading")
      const response = await api.post("/companies/renew")
      setRenewalStatus("success")
      setRenewalMessage(response.data.message)

      // Update the company data with the new end date
      setCompany((prev) => {
        if (!prev) return null
        return {
          ...prev,
          ends_at: response.data.new_ends_at,
        }
      })

      // Reset the status after 3 seconds
      setTimeout(() => {
        setRenewalStatus("idle")
        setRenewalMessage(null)
      }, 3000)
    } catch (err: any) {
      setRenewalStatus("error")
      setRenewalMessage(err?.response?.data?.message || "Failed to renew subscription. Please try again.")

      // Reset the status after 3 seconds
      setTimeout(() => {
        setRenewalStatus("idle")
        setRenewalMessage(null)
      }, 3000)
    }
  }

  const handleViewPlans = () => {
    router.push("/pricing?renew=true")
  }

  // Calculate days until expiration
  const getDaysUntilExpiration = (): number | null => {
    if (!company?.ends_at) return null

    const now = new Date()
    const endDate = new Date(company.ends_at)
    const diffTime = endDate.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    return diffDays
  }

  const daysUntilExpiration = getDaysUntilExpiration()
  const isNearExpiration = daysUntilExpiration !== null && daysUntilExpiration <= 7
  const isExpired = daysUntilExpiration !== null && daysUntilExpiration <= 0
  const canRenew = daysUntilExpiration !== null && daysUntilExpiration <= 30

  // Helper function for conditional class names
  const cn = (...classes: string[]) => classes.filter(Boolean).join(" ")

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF9F7] p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-xl shadow-sm p-8 animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="h-40 bg-gray-200 rounded"></div>
              <div className="h-40 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#FAF9F7] p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-xl shadow-sm p-8">
            <div className="flex items-center justify-center flex-col text-center py-12">
              <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
              <h1 className="text-2xl font-bold mb-2">Error Loading Subscription</h1>
              <p className="text-gray-600 mb-6">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-[#6148F4] text-white rounded-md hover:bg-[#5040D9] transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!company || !company.subscription_plan) {
    return (
      <div className="min-h-screen bg-[#FAF9F7] p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-xl shadow-sm p-8">
            <div className="flex items-center justify-center flex-col text-center py-12">
              <AlertCircle className="h-12 w-12 text-amber-500 mb-4" />
              <h1 className="text-2xl font-bold mb-2">No Active Subscription</h1>
              <p className="text-gray-600 mb-6">
                You don't have an active subscription plan. Choose a plan to get started.
              </p>
              <button
                onClick={() => router.push("/pricing")}
                className="px-4 py-2 bg-[#6148F4] text-white rounded-md hover:bg-[#5040D9] transition-colors"
              >
                View Plans
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FAF9F7] p-8">
      <div className="max-w-4xl mx-auto">
        {renewed && (
          <div className="mb-6 px-4 py-3 rounded-md text-sm flex items-center bg-green-50 text-green-700">
            <CheckCircle2 className="h-4 w-4 mr-2 flex-shrink-0" />
            <span>Your subscription has been successfully renewed!</span>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm p-8">
          <h1 className="text-2xl font-bold mb-2">Your Subscription</h1>
          <p className="text-gray-600 mb-8">Manage your subscription plan and billing details</p>

          {/* Current Plan */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-gradient-to-br from-[#6148F4]/5 to-[#5040D9]/10 rounded-xl p-6 border border-[#6148F4]/10">
              <div className="flex items-center mb-4">
                <CreditCard className="h-5 w-5 text-[#6148F4] mr-2" />
                <h2 className="text-lg font-semibold">Current Plan</h2>
              </div>
              <h3 className="text-2xl font-bold mb-1">{company.subscription_plan.name}</h3>
              <p className="text-gray-600 mb-3">{company.subscription_plan.description}</p>
              <div className="flex items-center text-sm text-gray-500 mb-1">
                <span className="font-medium mr-2">Price:</span>
                <span>
                  ${company.subscription_plan.price}/{company.billing_cycle === "yearly" ? "year" : "month"}
                </span>
              </div>
              <div className="flex items-center text-sm text-gray-500">
                <span className="font-medium mr-2">Billing Cycle:</span>
                <span className="capitalize">{company.billing_cycle}</span>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <div className="flex items-center mb-4">
                <Calendar className="h-5 w-5 text-[#6148F4] mr-2" />
                <h2 className="text-lg font-semibold">Subscription Status</h2>
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500">Started on</p>
                  <p className="font-medium">{company.started_at ? formatDate(new Date(company.started_at)) : "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Expires on</p>
                  <p className="font-medium">{company.ends_at ? formatDate(new Date(company.ends_at)) : "N/A"}</p>
                </div>

                {isExpired ? (
                  <div className="bg-red-50 text-red-700 px-3 py-2 rounded-md text-sm flex items-center mt-2">
                    <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0" />
                    <span>Your subscription has expired</span>
                  </div>
                ) : isNearExpiration ? (
                  <div className="bg-amber-50 text-amber-700 px-3 py-2 rounded-md text-sm flex items-center mt-2">
                    <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0" />
                    <span>Your subscription expires in {daysUntilExpiration} days</span>
                  </div>
                ) : (
                  <div className="bg-green-50 text-green-700 px-3 py-2 rounded-md text-sm flex items-center mt-2">
                    <CheckCircle2 className="h-4 w-4 mr-2 flex-shrink-0" />
                    <span>Your subscription is active</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Renewal Status Message */}
          {renewalStatus !== "idle" && renewalMessage && (
            <div
              className={`mb-6 px-4 py-3 rounded-md text-sm flex items-center ${
                renewalStatus === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
              }`}
            >
              {renewalStatus === "success" ? (
                <CheckCircle2 className="h-4 w-4 mr-2 flex-shrink-0" />
              ) : (
                <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0" />
              )}
              <span>{renewalMessage}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={handleViewPlans}
              className="px-6 py-3 bg-[#6148F4] text-white rounded-md hover:bg-[#5040D9] transition-colors flex items-center justify-center"
            >
              View All Plans
              <ArrowRight className="h-4 w-4 ml-2" />
            </button>

            <button
              onClick={handleRenewSubscription}
              disabled={!canRenew || renewalStatus === "loading"}
              className={`px-6 py-3 rounded-md flex items-center justify-center transition-colors ${
                canRenew && renewalStatus !== "loading"
                  ? "bg-[#4ADE80] hover:bg-[#3AC070] text-black"
                  : "bg-gray-200 text-gray-500 cursor-not-allowed"
              }`}
            >
              {renewalStatus === "loading" ? "Processing..." : "Renew Subscription"}
            </button>
          </div>

          {!canRenew && daysUntilExpiration && daysUntilExpiration > 30 && (
            <p className="text-sm text-gray-500 mt-3">You can renew your subscription 30 days before it expires.</p>
          )}
        </div>
      </div>
    </div>
  )
}

const formatDate = (date: Date): string => {
  const options: Intl.DateTimeFormatOptions = { year: "numeric", month: "long", day: "numeric" }
  return date.toLocaleDateString("en-US", options)
}
