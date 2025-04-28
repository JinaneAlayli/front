"use client"

import type React from "react"
import api from "@/lib/api"

import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Check, Lock, AlertCircle } from "lucide-react"
import { useSelector } from "react-redux"

export default function CheckoutPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    companyName: "",
    phoneNumber: "",
    cardNumber: "",
    expiration: "",
    cvc: "",
  })
  const user = useSelector((state: any) => state.auth.user)
  const [validation, setValidation] = useState({ cardNumber: true, expiration: true, cvc: true })
  const [paymentMethod, setPaymentMethod] = useState("card")
  const [planDetails, setPlanDetails] = useState<any>(null)
  const [cardType, setCardType] = useState<string>("unknown")

  useEffect(() => {
    if (user?.company_id) router.replace("/dashboard")
  }, [user, router])

  useEffect(() => {
    const planId = searchParams.get("plan_id")
    const billing = searchParams.get("billing") || "monthly"
    if (planId) {
      api.get(`/subscription-plans/${planId}`).then((res) => {
        setPlanDetails({
          ...res.data,
          billing,
          discountedPrice: billing === "yearly"
            ? (parseFloat(String(res.data.price)) * 12 * (1 - parseFloat(String(res.data.discount_percent || "0")) / 100)).toFixed(2)
            : res.data.price,
        })
      })
    }
  }, [searchParams])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    if (name === "expiration") {
      const digits = value.replace(/\D/g, "")
      const formattedValue = digits.length <= 2 ? digits : `${digits.slice(0, 2)}/${digits.slice(2, 4)}`
      setFormData((prev) => ({ ...prev, [name]: formattedValue }))
      setValidation((prev) => ({ ...prev, expiration: validateExpiry(formattedValue) || formattedValue.length === 0 }))
      return
    }
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (name === "cardNumber") {
      setValidation((prev) => ({ ...prev, cardNumber: validateCardNumber(value) || value.length === 0 }))
      setCardType(getCardType(value))
    } else if (name === "cvc") {
      setValidation((prev) => ({ ...prev, cvc: validateCVC(value) || value.length === 0 }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!planDetails) return

    if (paymentMethod === "card" && parseFloat(planDetails.price) > 0) {
      const cardValid = validateCardNumber(formData.cardNumber)
      const expiryValid = validateExpiry(formData.expiration)
      const cvcValid = validateCVC(formData.cvc)
      setValidation({ cardNumber: cardValid, expiration: expiryValid, cvc: cvcValid })
      if (!cardValid || !expiryValid || !cvcValid) return
    }

    try {
      await api.post("/companies/register", {
        company_name: formData.companyName,
        employee_nb: planDetails.features_json.employee_limit,
        subscription_plan_id: planDetails.id,
        billing_cycle: planDetails.billing,
        owner: {
          name: formData.firstName,
          email: formData.email,
          password: formData.password,
          phone: formData.phoneNumber,
        },
      })
      router.push("/business-settings")
    } catch (err: any) {
      const msg = err?.response?.data?.message
      alert(typeof msg === "string" ? msg : msg?.[0] || "Something went wrong.")
    }
  }

  if (!planDetails) return null

  const isFreeplan = planDetails.price === "0"

  return (
    <main className="bg-[#FAF9F7] text-[#1E293B] min-h-screen">
      <div className="py-12 px-8 md:px-32 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <div>
            <h1 className="text-2xl font-bold mb-8">Create a new account</h1>
            <form onSubmit={handleSubmit}>
              <input type="text" name="firstName" placeholder="Full Name*" required value={formData.firstName} onChange={handleInputChange} className="w-full p-3 mb-4 border border-gray-300 rounded-md" />
              <input type="email" name="email" placeholder="Work Email*" required value={formData.email} onChange={handleInputChange} className="w-full p-3 mb-4 border border-gray-300 rounded-md" />
              <input type="password" name="password" placeholder="Create Password*" required value={formData.password} onChange={handleInputChange} className="w-full p-3 mb-4 border border-gray-300 rounded-md" />
              <input type="text" name="companyName" placeholder="Company Name*" required value={formData.companyName} onChange={handleInputChange} className="w-full p-3 mb-4 border border-gray-300 rounded-md" />
              <input type="tel" name="phoneNumber" placeholder="Phone Number*" required value={formData.phoneNumber} onChange={handleInputChange} className="w-full p-3 mb-4 border border-gray-300 rounded-md" />

              {planDetails.price !== "0" && (
                <>
                  <h2 className="text-xl font-bold mb-4">Enter payment details</h2>
                  <input type="text" name="cardNumber" placeholder="1234 1234 1234 1234" required value={formData.cardNumber} onChange={handleInputChange} className={`w-full p-3 mb-4 border ${validation.cardNumber ? "border-gray-300" : "border-red-500"} rounded-md`} />
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <input type="text" name="expiration" placeholder="MM/YY" required value={formData.expiration} onChange={handleInputChange} className={`w-full p-3 border ${validation.expiration ? "border-gray-300" : "border-red-500"} rounded-md`} />
                    <input type="text" name="cvc" placeholder="CVC" required value={formData.cvc} onChange={handleInputChange} className={`w-full p-3 border ${validation.cvc ? "border-gray-300" : "border-red-500"} rounded-md`} />
                  </div>
                </>
              )}

              <button type="submit" className="w-full py-3 bg-[#6148F4] hover:bg-[#5040D9] text-white rounded-md font-medium transition-colors flex items-center justify-center">
                <Lock className="h-4 w-4 mr-2" /> {isFreeplan ? "Create Free Account" : "Purchase"}
              </button>
            </form>
          </div>

          <div>
            <div className="bg-white p-8 rounded-lg shadow-sm">
              <h2 className="text-xl font-bold mb-6">Order summary</h2>
              <div className="space-y-4 mb-8">
                <div className="flex items-start">
                  <Check className="h-5 w-5 text-[#6148F4] mr-3 mt-0.5" />
                  <span>Up to {planDetails.features_json.employee_limit} employees</span>
                </div>
                <div className="flex items-start">
                  <Check className="h-5 w-5 text-[#6148F4] mr-3 mt-0.5" />
                  <span>Team structure: {planDetails.features_json.teams_enabled ? 'Yes' : 'No'}</span>
                </div>
                <div className="flex items-start">
                  <Check className="h-5 w-5 text-[#6148F4] mr-3 mt-0.5" />
                  <span>Payroll access: {planDetails.features_json.payroll_enabled ? 'Yes' : 'No'}</span>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <div className="flex justify-between py-2">
                  <span>Plan</span>
                  <span>{planDetails.name}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span>Billing Cycle</span>
                  <span className="capitalize">{planDetails.billing}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span>Subtotal</span>
                  <span>${parseFloat(planDetails.price).toFixed(2)}</span>
                </div>
                {planDetails.billing === "yearly" && (
                  <div className="flex justify-between py-2 text-green-600">
                    <span>Discount</span>
                    <span>{planDetails.discount_percent}%</span>
                  </div>
                )}
              </div>

              <div className="border-t border-gray-200 pt-4 mt-4">
                <div className="flex justify-between items-center">
                  <span className="font-bold">Billed now</span>
                  <span className="text-xl font-bold">${planDetails.discountedPrice}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

function validateCardNumber(number: string) {
  const digits = number.replace(/\D/g, "")
  if (digits.length < 13 || digits.length > 19) return false
  let sum = 0, shouldDouble = false
  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = parseInt(digits[i])
    if (shouldDouble) {
      digit *= 2
      if (digit > 9) digit -= 9
    }
    sum += digit
    shouldDouble = !shouldDouble
  }
  return sum % 10 === 0
}

function validateExpiry(expiry: string) {
  const cleaned = expiry.replace(/\s/g, "")
  const [month, yearSuffix] = cleaned.split("/")
  const year = Number("20" + yearSuffix), monthNum = Number(month)
  const now = new Date()
  return !(isNaN(monthNum) || isNaN(year) || monthNum < 1 || monthNum > 12 || year < now.getFullYear() || (year === now.getFullYear() && monthNum < now.getMonth() + 1))
}

function validateCVC(cvc: string) {
  const digits = cvc.replace(/\D/g, "")
  return digits.length >= 3 && digits.length <= 4
}

function getCardType(number: string) {
  const cleaned = number.replace(/\D/g, "")
  if (cleaned.startsWith("4")) return "visa"
  if (/^5[1-5]/.test(cleaned)) return "mastercard"
  if (/^3[47]/.test(cleaned)) return "amex"
  if (/^6(?:011|5)/.test(cleaned)) return "discover"
  return "unknown"
}
