"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Check, X, Sparkles, ArrowLeft } from "lucide-react"
import Header from "@/components/Header"
import Footer from "@/components/Footer"
import api from "@/lib/api"
import { useSelector } from "react-redux"

interface PlanFeatures {
  teams_enabled: boolean
  payroll_enabled: boolean
  analytics_enabled: boolean
  custom_roles: boolean
  storage_limit_gb: number
  support_level: string
  employee_limit: number
  [key: string]: boolean | number | string
}

interface SubscriptionPlan {
  id: number
  name: string
  description: string
  price: string
  discount_percent?: string
  features_json: PlanFeatures
}

interface CompanyData {
  id: number
  name: string
  subscription_plan_id: number
  billing_cycle: string
  ends_at: string
}

interface User {
  id: number
  name: string
  email: string
  role_id: number
  company_id?: number
}

interface RootState {
  auth: {
    user: User | null
  }
}

// Main component with Suspense boundary
export default function PricingClient() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center min-h-screen p-4">
          <div className="animate-pulse space-y-4 w-full max-w-7xl">
            <div className="h-8 bg-gray-200 rounded w-1/3 mx-auto"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-96 bg-gray-200 rounded-2xl"></div>
              ))}
            </div>
          </div>
        </div>
      }
    >
      <PricingContent />
    </Suspense>
  )
}

// Component that contains the actual pricing content and uses useSearchParams
function PricingContent() {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly")
  const [allPlans, setAllPlans] = useState<SubscriptionPlan[]>([])
  const [mounted, setMounted] = useState(false)
  const [isRenewing, setIsRenewing] = useState(false)
  const [companyData, setCompanyData] = useState<CompanyData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const user = useSelector((state: RootState) => state.auth.user)
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    // Check if this is a renewal flow
    const renew = searchParams?.get("renew")
    if (renew === "true") {
      setIsRenewing(true)
    }
  }, [searchParams])

  useEffect(() => {
    // Only redirect non-logged in users or users who aren't owners
    if (user) {
      if (user.role_id !== 2 && user.company_id) {
        router.replace("/dashboard")
      } else if (user.role_id === 2) {
        // Fetch company data for owners
        setIsLoading(true)
        api
          .get("/companies/my-company")
          .then((res) => {
            setCompanyData(res.data)
            setIsLoading(false)
          })
          .catch((err) => {
            console.error("Failed to fetch company data:", err)
            setError("Failed to fetch company data. Please try again.")
            setIsLoading(false)
          })
      }
    }
  }, [user, router])

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    setIsLoading(true)
    api
      .get("/subscription-plans")
      .then((res) => {
        setAllPlans(res.data || [])
        setIsLoading(false)
      })
      .catch((err) => {
        console.error("Failed to fetch subscription plans:", err)
        setError("Failed to fetch subscription plans. Please try again.")
        setIsLoading(false)
      })
  }, [])

  if (!mounted) return null

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-4">
          <p>{error}</p>
        </div>
        <button onClick={() => window.location.reload()} className="px-4 py-2 bg-[#6148F4] text-white rounded-md">
          Try Again
        </button>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="animate-pulse space-y-4 w-full max-w-7xl">
          <div className="h-8 bg-gray-200 rounded w-1/3 mx-auto"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-96 bg-gray-200 rounded-2xl"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const calculateFinalPrice = (price: string, discount?: string): string => {
    try {
      const original = Number.parseFloat(price || "0")
      if (isNaN(original)) return "0.00"

      const discountValue = billingCycle === "yearly" ? Number.parseFloat(discount || "0") : 0
      if (isNaN(discountValue)) return original.toFixed(2)

      const yearlyPrice = original * 12
      const discounted = yearlyPrice * (1 - discountValue / 100)

      return billingCycle === "monthly" ? original.toFixed(2) : discounted.toFixed(2)
    } catch (err) {
      console.error("Error calculating price:", err)
      return "0.00"
    }
  }

  const featureLabels: Record<string, string> = {
    teams_enabled: "Team structure",
    payroll_enabled: "Payroll access",
    analytics_enabled: "Advanced Analytics",
    custom_roles: "Custom Roles",
    storage_limit_gb: "Storage",
    support_level: "Support level",
    employee_limit: "Employee limit",
  }

  const handlePlanSelection = (planId: number) => {
    if (!planId) {
      console.error("Invalid plan ID")
      return
    }

    try {
      if (isRenewing && user?.role_id === 2) {
        // For renewal, go directly to checkout with the renew=true parameter
        router.push(`/checkout?plan_id=${planId}&billing=${billingCycle}&renew=true`)
      } else {
        // For new users, go to regular checkout
        router.push(`/checkout?plan_id=${planId}&billing=${billingCycle}`)
      }
    } catch (err) {
      console.error("Navigation error:", err)
    }
  }

  const handleBackToSubscription = () => {
    router.push("/subscription")
  }

  // Helper function to conditionally join class names
  const cn = (...classes: string[]) => classes.filter(Boolean).join(" ")

  return (
    <>
      {!user?.company_id && <Header />}
      <main className="bg-[#FAF9F7] text-[#1E293B] min-h-screen">
        <section className="py-20 px-8 md:px-32 max-w-7xl mx-auto">
          {isRenewing && (
            <div className="mb-8">
              <button
                onClick={handleBackToSubscription}
                className="flex items-center text-[#6148F4] hover:text-[#5040D9] transition-colors mb-4"
                aria-label="Back to Subscription"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back to Subscription
              </button>
              <h1 className="text-4xl md:text-5xl font-bold mb-4">Renew Your Subscription</h1>
              <p className="text-lg text-gray-600 max-w-2xl">
                Choose a plan to renew your subscription. Your new subscription period will start when your current one
                ends.
              </p>
            </div>
          )}

          {!isRenewing && (
            <div className="text-center mb-16">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">Simple, transparent pricing</h1>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Whether your time-saving automation needs are large or small, we're here to help you scale.
              </p>
            </div>
          )}

          <div className="flex justify-center items-center mb-16">
            <div className="bg-white p-1.5 rounded-lg shadow-sm inline-flex relative">
              <div
                className={`absolute top-1.5 bottom-1.5 w-[calc(50%-3px)] rounded-md bg-[#F0EEFF] transition-all duration-300 ease-in-out ${
                  billingCycle === "yearly" ? "left-[calc(50%+1.5px)]" : "left-1.5px"
                }`}
              ></div>
              <button
                onClick={() => setBillingCycle("monthly")}
                className={`relative z-10 px-6 py-2 rounded-md font-medium transition-all ${
                  billingCycle === "monthly" ? "text-[#6148F4]" : "text-gray-500 hover:text-gray-700"
                }`}
                aria-label="Monthly billing"
                aria-pressed={billingCycle === "monthly"}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle("yearly")}
                className={`relative z-10 px-6 py-2 rounded-md font-medium transition-all ${
                  billingCycle === "yearly" ? "text-[#6148F4]" : "text-gray-500 hover:text-gray-700"
                }`}
                aria-label="Yearly billing"
                aria-pressed={billingCycle === "yearly"}
              >
                Yearly
                {billingCycle === "yearly" && (
                  <span className="absolute -top-3 -right-2 bg-[#4ADE80] text-xs text-black font-bold py-0.5 px-2 rounded-full">
                    Save 20%
                  </span>
                )}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {allPlans.map((plan) => {
              if (!plan || !plan.id) return null

              const isPopular = plan.name === "Company"
              const isFree = plan.name === "Free"
              const finalPrice = calculateFinalPrice(plan.price, plan.discount_percent)
              const isCurrentPlan = companyData?.subscription_plan_id === plan.id

              return (
                <div
                  key={plan.id}
                  className={`rounded-2xl shadow-sm ${isPopular ? "bg-gradient-to-br from-[#6148F4] to-[#5040D9] text-white border-transparent" : "bg-white text-gray-900 border border-gray-200"} hover:border-gray-300 transition-all duration-300 overflow-hidden transform hover:-translate-y-1 ${isCurrentPlan ? "ring-2 ring-[#4ADE80]" : ""}`}
                >
                  {isPopular && (
                    <div className="bg-[#4ADE80] text-black py-2 px-4 text-center text-sm font-bold flex items-center justify-center">
                      <Sparkles className="h-4 w-4 mr-1" /> MOST POPULAR
                    </div>
                  )}

                  {isCurrentPlan && !isPopular && (
                    <div className="bg-[#4ADE80] text-black py-2 px-4 text-center text-sm font-bold flex items-center justify-center">
                      <Check className="h-4 w-4 mr-1" /> CURRENT PLAN
                    </div>
                  )}

                  <div className="p-8">
                    <h3 className="text-2xl font-bold mb-1">{plan.name}</h3>
                    <p className="text-sm opacity-80 mb-4">{plan.description || ""}</p>
                    <div className="flex items-baseline">
                      <span className="text-4xl font-bold">${finalPrice}</span>
                      <span className="ml-2 text-sm opacity-80">/{billingCycle}</span>
                    </div>

                    <div className="space-y-4 my-6">
                      {plan.features_json &&
                        Object.entries(plan.features_json).map(([key, value]) => {
                          const label = featureLabels[key] || key
                          let displayValue = ""
                          let showCheck = false

                          if (typeof value === "boolean") {
                            showCheck = value
                          } else if (key === "storage_limit_gb") {
                            displayValue = `${value} GB Storage`
                            showCheck = true
                          } else if (key === "employee_limit") {
                            displayValue = `Up to ${value} employees`
                            showCheck = true
                          } else if (key === "support_level") {
                            displayValue = `Support: ${value}`
                            showCheck = true
                          }

                          return (
                            <div key={key} className="flex items-start">
                              <div
                                className={`p-0.5 rounded-full mr-3 ${isPopular ? "bg-white/20" : "bg-[#6148F4]/10"}`}
                              >
                                {showCheck ? (
                                  <Check className={`h-4 w-4 ${isPopular ? "text-white" : "text-[#6148F4]"}`} />
                                ) : (
                                  <X className="h-4 w-4 text-gray-400" />
                                )}
                              </div>
                              <span className="text-sm">{displayValue || label}</span>
                            </div>
                          )
                        })}
                    </div>

                    <button
                      onClick={() => handlePlanSelection(plan.id)}
                      className={`w-full py-3 rounded-lg font-semibold text-center transition ${
                        isFree
                          ? "bg-gray-200 hover:bg-gray-300 text-gray-800"
                          : isPopular
                            ? "bg-[#4ADE80] hover:bg-[#3AC070] text-black"
                            : "bg-[#6148F4] hover:bg-[#5040D9] text-white"
                      }`}
                      aria-label={`Select ${plan.name} plan`}
                    >
                      {isFree
                        ? "Start for free"
                        : isCurrentPlan && isRenewing
                          ? "Renew Current Plan"
                          : isRenewing
                            ? `Switch to ${plan.name}`
                            : `Choose ${plan.name}`}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      </main>
      {!user?.company_id && <Footer />}
    </>
  )
}
