"use client"

import api from "@/lib/api"
import { useState, useEffect, type FormEvent, type ChangeEvent } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Check, Lock, ArrowLeft, AlertCircle } from "lucide-react"
import { useSelector } from "react-redux"

interface FormData {
  firstName: string
  lastName: string
  email: string
  password: string
  companyName: string
  phoneNumber: string
  cardNumber: string
  expiration: string
  cvc: string
}

interface FormErrors {
  firstName?: string
  lastName?: string
  email?: string
  password?: string
  companyName?: string
  phoneNumber?: string
  cardNumber?: string
  expiration?: string
  cvc?: string
  general?: string
}

interface ValidationState {
  cardNumber: boolean
  expiration: boolean
  cvc: boolean
}

interface PlanFeatures {
  teams_enabled: boolean
  payroll_enabled: boolean
  analytics_enabled: boolean
  custom_roles: boolean
  storage_limit_gb: number
  support_level: string
  employee_limit: number
}

interface SubscriptionPlan {
  id: number
  name: string
  description: string
  price: string
  discount_percent?: string
  features_json: PlanFeatures
  billing?: string
  discountedPrice?: string
}

interface CompanyData {
  id: number
  name: string
  billing_cycle: string
  subscription_plan_id: number
  ends_at: string
  started_at: string
}

interface User {
  id: number
  name: string
  email: string
  role_id: number
  company_id?: number
  phone?: string
}

interface RootState {
  auth: {
    user: User | null
  }
}

export default function CheckoutPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [formData, setFormData] = useState<FormData>({
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
  const [formErrors, setFormErrors] = useState<FormErrors>({})
  const user = useSelector((state: RootState) => state.auth.user)
  const [validation, setValidation] = useState<ValidationState>({ cardNumber: true, expiration: true, cvc: true })
  const [paymentMethod, setPaymentMethod] = useState<"card" | "invoice">("card")
  const [planDetails, setPlanDetails] = useState<SubscriptionPlan | null>(null)
  const [cardType, setCardType] = useState<string>("unknown")
  const [isRenewing, setIsRenewing] = useState<boolean>(false)
  const [companyData, setCompanyData] = useState<CompanyData | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Check if this is a renewal flow
    const renew = searchParams?.get("renew")
    if (renew === "true" && user?.role_id === 2) {
      setIsRenewing(true)

      // Fetch company data for renewal
      api
        .get("/companies/my-company")
        .then((res) => {
          if (res.data) {
            setCompanyData(res.data)
            // Pre-fill form data for existing company
            setFormData((prev) => ({
              ...prev,
              firstName: user.name || "",
              email: user.email || "",
              companyName: res.data.name || "",
              phoneNumber: user.phone || "",
            }))
          }
        })
        .catch((err) => {
          console.error("Failed to fetch company data:", err)
          setError("Failed to fetch company data. Please try again.")
        })
    } else if (user?.company_id && user?.role_id !== 2) {
      // Redirect non-owners with company
      router.replace("/dashboard")
    }
  }, [searchParams, user, router])

  useEffect(() => {
    const planId = searchParams?.get("plan_id")
    const billing = searchParams?.get("billing") || "monthly"

    if (!planId) {
      setError("No plan selected. Please go back to the pricing page.")
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    api
      .get(`/subscription-plans/${planId}`)
      .then((res) => {
        if (res.data) {
          const plan: SubscriptionPlan = res.data
          let discountedPrice = plan.price

          try {
            if (billing === "yearly" && plan.discount_percent) {
              const price = Number.parseFloat(plan.price)
              const discount = Number.parseFloat(plan.discount_percent)
              if (!isNaN(price) && !isNaN(discount)) {
                discountedPrice = (price * 12 * (1 - discount / 100)).toFixed(2)
              }
            }
          } catch (err) {
            console.error("Error calculating discounted price:", err)
          }

          setPlanDetails({
            ...plan,
            billing,
            discountedPrice,
          })
        }
        setIsLoading(false)
      })
      .catch((err) => {
        console.error("Failed to fetch plan details:", err)
        setError("Failed to fetch plan details. Please try again.")
        setIsLoading(false)
      })
  }, [searchParams])

  const validateForm = (): boolean => {
    const errors: FormErrors = {}
    let isValid = true

    if (!isRenewing) {
      if (!formData.firstName.trim()) {
        errors.firstName = "Name is required"
        isValid = false
      }

      if (!formData.email.trim()) {
        errors.email = "Email is required"
        isValid = false
      } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
        errors.email = "Email is invalid"
        isValid = false
      }

      if (!formData.password.trim()) {
        errors.password = "Password is required"
        isValid = false
      } else if (formData.password.length < 8) {
        errors.password = "Password must be at least 8 characters"
        isValid = false
      }

      if (!formData.companyName.trim()) {
        errors.companyName = "Company name is required"
        isValid = false
      }

      if (!formData.phoneNumber.trim()) {
        errors.phoneNumber = "Phone number is required"
        isValid = false
      } else if (!validatePhoneNumber(formData.phoneNumber)) {
        errors.phoneNumber = "Please enter a valid phone number with at least 10 digits"
        isValid = false
      }
    }

    if (planDetails && planDetails.price !== "0" && paymentMethod === "card") {
      if (!validateCardNumber(formData.cardNumber)) {
        errors.cardNumber = "Invalid card number"
        isValid = false
      }

      if (!validateExpiry(formData.expiration)) {
        errors.expiration = "Invalid expiration date"
        isValid = false
      }

      if (!validateCVC(formData.cvc)) {
        errors.cvc = "Invalid CVC"
        isValid = false
      }
    }

    setFormErrors(errors)
    return isValid
  }

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target

    // Clear the specific error when user starts typing
    if (formErrors[name as keyof FormErrors]) {
      setFormErrors((prev) => ({ ...prev, [name]: undefined }))
    }

    if (name === "expiration") {
      const digits = value.replace(/\D/g, "")
      const formattedValue = digits.length <= 2 ? digits : `${digits.slice(0, 2)}/${digits.slice(2, 4)}`
      setFormData((prev) => ({ ...prev, [name]: formattedValue }))
      setValidation((prev) => ({ ...prev, expiration: validateExpiry(formattedValue) || formattedValue.length === 0 }))
      return
    }

    if (name === "cardNumber") {
      // Only allow digits and format with spaces
      const digits = value.replace(/\D/g, "")
      let formattedValue = ""
      for (let i = 0; i < digits.length; i += 4) {
        formattedValue += digits.slice(i, i + 4) + " "
      }
      setFormData((prev) => ({ ...prev, [name]: formattedValue.trim() }))
      setValidation((prev) => ({ ...prev, cardNumber: validateCardNumber(digits) || digits.length === 0 }))
      setCardType(getCardType(digits))
      return
    }

    if (name === "cvc") {
      // Only allow digits
      const digits = value.replace(/\D/g, "").slice(0, 4)
      setFormData((prev) => ({ ...prev, [name]: digits }))
      setValidation((prev) => ({ ...prev, cvc: validateCVC(digits) || digits.length === 0 }))
      return
    }

    if (name === "phoneNumber") {
      // Allow only digits, spaces, parentheses, dashes, and plus signs
      const sanitized = value.replace(/[^\d\s()+-]/g, "")

      // Limit to a reasonable length (international numbers can be longer)
      const trimmed = sanitized.slice(0, 20)

      setFormData((prev) => ({ ...prev, [name]: trimmed }))

      // Validate that phone starts with +9 and has at least 10 digits
      if (trimmed && (!trimmed.startsWith("+9") || trimmed.replace(/\D/g, "").length < 10)) {
        setFormErrors((prev) => ({
          ...prev,
          phoneNumber: "Phone number must start with +9 and have at least 10 digits",
        }))
      } else {
        setFormErrors((prev) => ({ ...prev, phoneNumber: undefined }))
      }
      return
    }

    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!planDetails) return

    // Reset general error
    setFormErrors((prev) => ({ ...prev, general: undefined }))

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)

    try {
      if (isRenewing) {
        // For renewal, use a different endpoint
        await api.post("/companies/renew", {
          subscription_plan_id: planDetails.id,
          billing_cycle: planDetails.billing,
        })
        router.push("/subscription?renewed=true")
      } else {
        // For new registration
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
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message
      const errorMessage = typeof msg === "string" ? msg : msg?.[0] || "Something went wrong."
      setFormErrors((prev) => ({ ...prev, general: errorMessage }))
      setIsSubmitting(false)
    }
  }

  const handleBackToPricing = () => {
    if (isRenewing) {
      router.push("/pricing?renew=true")
    } else {
      router.push("/pricing")
    }
  }

  // Helper function to conditionally join class names
  const cn = (...classes: string[]) => classes.filter(Boolean).join(" ")

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="animate-pulse space-y-4 w-full max-w-7xl">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="space-y-4">
              <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              <div className="h-12 bg-gray-200 rounded"></div>
              <div className="h-12 bg-gray-200 rounded"></div>
              <div className="h-12 bg-gray-200 rounded"></div>
            </div>
            <div className="h-96 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-4">
          <p>{error}</p>
        </div>
        <button onClick={handleBackToPricing} className="px-4 py-2 bg-[#6148F4] text-white rounded-md">
          Back to Pricing
        </button>
      </div>
    )
  }

  if (!planDetails) return null

  const isFreeplan = planDetails.price === "0"

  return (
    <main className="bg-[#FAF9F7] text-[#1E293B] min-h-screen">
      <div className="py-12 px-8 md:px-32 max-w-7xl mx-auto">
        <button
          onClick={handleBackToPricing}
          className="flex items-center text-[#6148F4] hover:text-[#5040D9] transition-colors mb-8"
          aria-label="Back to Plans"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Plans
        </button>

        {formErrors.general && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6 flex items-center">
            <AlertCircle className="h-5 w-5 mr-2" />
            <p>{formErrors.general}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <div>
            <h1 className="text-2xl font-bold mb-8">
              {isRenewing ? "Renew Your Subscription" : "Create a new account"}
            </h1>
            <form onSubmit={handleSubmit} noValidate>
              {!isRenewing && (
                <>
                  <div className="space-y-4 mb-6">
                    <div>
                      <input
                        type="text"
                        name="firstName"
                        placeholder="Full Name*"
                        required
                        value={formData.firstName}
                        onChange={handleInputChange}
                        className={`w-full p-3 border ${formErrors.firstName ? "border-red-500" : "border-gray-300"} rounded-md`}
                        aria-invalid={!!formErrors.firstName}
                        aria-describedby={formErrors.firstName ? "firstName-error" : undefined}
                      />
                      {formErrors.firstName && (
                        <p id="firstName-error" className="mt-1 text-sm text-red-600">
                          {formErrors.firstName}
                        </p>
                      )}
                    </div>

                    <div>
                      <input
                        type="email"
                        name="email"
                        placeholder="Work Email*"
                        required
                        value={formData.email}
                        onChange={handleInputChange}
                        className={`w-full p-3 border ${formErrors.email ? "border-red-500" : "border-gray-300"} rounded-md`}
                        aria-invalid={!!formErrors.email}
                        aria-describedby={formErrors.email ? "email-error" : undefined}
                      />
                      {formErrors.email && (
                        <p id="email-error" className="mt-1 text-sm text-red-600">
                          {formErrors.email}
                        </p>
                      )}
                    </div>

                    <div>
                      <input
                        type="password"
                        name="password"
                        placeholder="Create Password*"
                        required
                        value={formData.password}
                        onChange={handleInputChange}
                        className={`w-full p-3 border ${formErrors.password ? "border-red-500" : "border-gray-300"} rounded-md`}
                        aria-invalid={!!formErrors.password}
                        aria-describedby={formErrors.password ? "password-error" : undefined}
                      />
                      {formErrors.password && (
                        <p id="password-error" className="mt-1 text-sm text-red-600">
                          {formErrors.password}
                        </p>
                      )}
                    </div>

                    <div>
                      <input
                        type="text"
                        name="companyName"
                        placeholder="Company Name*"
                        required
                        value={formData.companyName}
                        onChange={handleInputChange}
                        className={`w-full p-3 border ${formErrors.companyName ? "border-red-500" : "border-gray-300"} rounded-md`}
                        aria-invalid={!!formErrors.companyName}
                        aria-describedby={formErrors.companyName ? "companyName-error" : undefined}
                      />
                      {formErrors.companyName && (
                        <p id="companyName-error" className="mt-1 text-sm text-red-600">
                          {formErrors.companyName}
                        </p>
                      )}
                    </div>

                    <div>
                      <input
                        type="tel"
                        name="phoneNumber"
                        placeholder="Phone Number*"
                        required
                        value={formData.phoneNumber}
                        onChange={handleInputChange}
                        className={`w-full p-3 border ${formErrors.phoneNumber ? "border-red-500" : "border-gray-300"} rounded-md`}
                        aria-invalid={!!formErrors.phoneNumber}
                        aria-describedby={formErrors.phoneNumber ? "phoneNumber-error" : undefined}
                      />
                      {formErrors.phoneNumber && (
                        <p id="phoneNumber-error" className="mt-1 text-sm text-red-600">
                          {formErrors.phoneNumber}
                        </p>
                      )}
                    </div>
                  </div>
                </>
              )}

              {planDetails.price !== "0" && (
                <>
                  <h2 className="text-xl font-bold mb-4">Enter payment details</h2>
                  <div className="space-y-4 mb-6">
                    <div>
                      <input
                        type="text"
                        name="cardNumber"
                        placeholder="1234 1234 1234 1234"
                        required={!isFreeplan}
                        value={formData.cardNumber}
                        onChange={handleInputChange}
                        className={`w-full p-3 border ${formErrors.cardNumber ? "border-red-500" : validation.cardNumber ? "border-gray-300" : "border-red-500"} rounded-md`}
                        aria-invalid={!!formErrors.cardNumber || !validation.cardNumber}
                        aria-describedby={formErrors.cardNumber ? "cardNumber-error" : undefined}
                      />
                      {formErrors.cardNumber && (
                        <p id="cardNumber-error" className="mt-1 text-sm text-red-600">
                          {formErrors.cardNumber}
                        </p>
                      )}
                      {!formErrors.cardNumber && !validation.cardNumber && formData.cardNumber && (
                        <p className="mt-1 text-sm text-red-600">Invalid card number</p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <input
                          type="text"
                          name="expiration"
                          placeholder="MM/YY"
                          required={!isFreeplan}
                          value={formData.expiration}
                          onChange={handleInputChange}
                          className={`w-full p-3 border ${formErrors.expiration ? "border-red-500" : validation.expiration ? "border-gray-300" : "border-red-500"} rounded-md`}
                          aria-invalid={!!formErrors.expiration || !validation.expiration}
                          aria-describedby={formErrors.expiration ? "expiration-error" : undefined}
                        />
                        {formErrors.expiration && (
                          <p id="expiration-error" className="mt-1 text-sm text-red-600">
                            {formErrors.expiration}
                          </p>
                        )}
                        {!formErrors.expiration && !validation.expiration && formData.expiration && (
                          <p className="mt-1 text-sm text-red-600">Invalid expiration date</p>
                        )}
                      </div>

                      <div>
                        <input
                          type="text"
                          name="cvc"
                          placeholder="CVC"
                          required={!isFreeplan}
                          value={formData.cvc}
                          onChange={handleInputChange}
                          className={`w-full p-3 border ${formErrors.cvc ? "border-red-500" : validation.cvc ? "border-gray-300" : "border-red-500"} rounded-md`}
                          aria-invalid={!!formErrors.cvc || !validation.cvc}
                          aria-describedby={formErrors.cvc ? "cvc-error" : undefined}
                        />
                        {formErrors.cvc && (
                          <p id="cvc-error" className="mt-1 text-sm text-red-600">
                            {formErrors.cvc}
                          </p>
                        )}
                        {!formErrors.cvc && !validation.cvc && formData.cvc && (
                          <p className="mt-1 text-sm text-red-600">Invalid CVC</p>
                        )}
                      </div>
                    </div>
                  </div>
                </>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full py-3 bg-[#6148F4] hover:bg-[#5040D9] text-white rounded-md font-medium transition-colors flex items-center justify-center ${isSubmitting ? "opacity-70 cursor-not-allowed" : ""}`}
              >
                <Lock className="h-4 w-4 mr-2" />
                {isSubmitting
                  ? "Processing..."
                  : isRenewing
                    ? isFreeplan
                      ? "Confirm Free Plan"
                      : "Complete Renewal"
                    : isFreeplan
                      ? "Create Free Account"
                      : "Purchase"}
              </button>
            </form>
          </div>

          <div>
            <div className="bg-white p-8 rounded-lg shadow-sm">
              <h2 className="text-xl font-bold mb-6">Order summary</h2>
              <div className="space-y-4 mb-8">
                <div className="flex items-start">
                  <Check className="h-5 w-5 text-[#6148F4] mr-3 mt-0.5" />
                  <span>Up to {planDetails.features_json?.employee_limit || 0} employees</span>
                </div>
                <div className="flex items-start">
                  <Check className="h-5 w-5 text-[#6148F4] mr-3 mt-0.5" />
                  <span>Team structure: {planDetails.features_json?.teams_enabled ? "Yes" : "No"}</span>
                </div>
                <div className="flex items-start">
                  <Check className="h-5 w-5 text-[#6148F4] mr-3 mt-0.5" />
                  <span>Payroll access: {planDetails.features_json?.payroll_enabled ? "Yes" : "No"}</span>
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
                  <span>${Number.parseFloat(planDetails.price || "0").toFixed(2)}</span>
                </div>
                {planDetails.billing === "yearly" && planDetails.discount_percent && (
                  <div className="flex justify-between py-2 text-green-600">
                    <span>Discount</span>
                    <span>{planDetails.discount_percent}%</span>
                  </div>
                )}
              </div>

              <div className="border-t border-gray-200 pt-4 mt-4">
                <div className="flex justify-between items-center">
                  <span className="font-bold">Billed now</span>
                  <span className="text-xl font-bold">${planDetails.discountedPrice || "0.00"}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

function validateCardNumber(number: string): boolean {
  const digits = number.replace(/\D/g, "")
  if (digits.length < 13 || digits.length > 19) return false

  return true
}

function validateExpiry(expiry: string): boolean {
  const cleaned = expiry.replace(/\s/g, "")
  const parts = cleaned.split("/")
  if (parts.length !== 2) return false

  const month = parts[0]
  const yearSuffix = parts[1]

  if (!month || !yearSuffix) return false

  const monthNum = Number(month)
  if (isNaN(monthNum) || monthNum < 1 || monthNum > 12) return false

  const year = Number("20" + yearSuffix)
  if (isNaN(year)) return false

  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() + 1

  return !(year < currentYear || (year === currentYear && monthNum < currentMonth))
}

function validateCVC(cvc: string): boolean {
  const digits = cvc.replace(/\D/g, "")
  return digits.length >= 3 && digits.length <= 4
}

function getCardType(number: string): string {
  const cleaned = number.replace(/\D/g, "")
  if (cleaned.startsWith("4")) return "visa"
  if (/^5[1-5]/.test(cleaned)) return "mastercard"
  if (/^3[47]/.test(cleaned)) return "amex"
  if (/^6(?:011|5)/.test(cleaned)) return "discover"
  return "unknown"
}

function validatePhoneNumber(phone: string): boolean {
  // Check if phone starts with +9 and has at least 10 digits
  return phone.startsWith("+9") && phone.replace(/\D/g, "").length >= 10
}
