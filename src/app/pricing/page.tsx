"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Check, X, Sparkles } from "lucide-react"
import Header from "@/components/Header"
import Footer from "@/components/Footer"
import api from "@/lib/api"
import { useSelector } from "react-redux"

export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly")
  const [allPlans, setAllPlans] = useState<any[]>([])
  const [mounted, setMounted] = useState(false)
  const user = useSelector((state: any) => state.auth.user)
  const router = useRouter()

  useEffect(() => {
    if (user?.company_id) {
      router.replace("/dashboard")
    }
  }, [user, router])

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    api.get("/subscription-plans").then((res) => setAllPlans(res.data))
  }, [])

  if (!mounted) return null

  const calculateFinalPrice = (price: string, discount: string) => {
    const original = parseFloat(price)
    const discountValue = billingCycle === "yearly" ? parseFloat(discount || "0") : 0
    const yearlyPrice = original * 12
    const discounted = yearlyPrice * (1 - discountValue / 100)
    return billingCycle === "monthly" ? original.toFixed(2) : discounted.toFixed(2)
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

  return (
    <>
      <Header />
      <main className="bg-[#FAF9F7] text-[#1E293B] min-h-screen">
        <section className="py-20 px-8 md:px-32 max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Simple, transparent pricing</h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Whether your time-saving automation needs are large or small, we're here to help you scale.
            </p>
          </div>

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
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle("yearly")}
                className={`relative z-10 px-6 py-2 rounded-md font-medium transition-all ${
                  billingCycle === "yearly" ? "text-[#6148F4]" : "text-gray-500 hover:text-gray-700"
                }`}
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
              const isPopular = plan.name === "Company"
              const isFree = plan.name === "Free"
              const finalPrice = calculateFinalPrice(plan.price, plan.discount_percent)

              return (
                <div
                  key={plan.id}
                  className={`rounded-2xl shadow-sm ${isPopular ? "bg-gradient-to-br from-[#6148F4] to-[#5040D9] text-white border-transparent" : "bg-white text-gray-900 border border-gray-200"} hover:border-gray-300 transition-all duration-300 overflow-hidden transform hover:-translate-y-1`}
                >
                  {isPopular && (
                    <div className="bg-[#4ADE80] text-black py-2 px-4 text-center text-sm font-bold flex items-center justify-center">
                      <Sparkles className="h-4 w-4 mr-1" /> MOST POPULAR
                    </div>
                  )}

                  <div className="p-8">
                    <h3 className="text-2xl font-bold mb-1">{plan.name}</h3>
                    <p className="text-sm opacity-80 mb-4">{plan.description}</p>
                    <div className="flex items-baseline">
                      <span className="text-4xl font-bold">${finalPrice}</span>
                      <span className="ml-2 text-sm opacity-80">/{billingCycle}</span>
                    </div>

                    <div className="space-y-4 my-6">
                      {Object.entries(plan.features_json).map(([key, value]) => {
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
                            <div className={`p-0.5 rounded-full mr-3 ${isPopular ? "bg-white/20" : "bg-[#6148F4]/10"}`}>
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
                      onClick={() => router.push(`/checkout?plan_id=${plan.id}&billing=${billingCycle}`)}
                      className={`w-full py-3 rounded-lg font-semibold text-center transition ${
                        isFree
                          ? "bg-gray-200 hover:bg-gray-300 text-gray-800"
                          : isPopular
                          ? "bg-[#4ADE80] hover:bg-[#3AC070] text-black"
                          : "bg-[#6148F4] hover:bg-[#5040D9] text-white"
                      }`}
                    >
                      {isFree ? "Start for free" : `Choose ${plan.name}`}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
