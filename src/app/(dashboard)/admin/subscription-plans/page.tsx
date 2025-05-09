"use client"

import { useState, useEffect, type FormEvent } from "react"
import api from "@/lib/api"
import RoleGuard from "@/components/RoleGuard"
import {
  Plus,
  Edit,
  Trash2,
  Check,
  X,
  Save,
  Users,
  HardDrive,
  HeadphonesIcon,
  ToggleLeft,
  ToggleRight,
  DollarSign,
  Percent,
  Calendar,
  FileText,
  Settings,
} from "lucide-react"
import DeleteConfirmationModal from "@/components/DeleteConfirmationModal"
import { toast } from "react-toastify"

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
  billing_cycle: string
  features_json: PlanFeatures
  is_active: boolean
}

export default function SubscriptionPlansPage() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [planToDelete, setPlanToDelete] = useState<number | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [newPlan, setNewPlan] = useState<boolean>(false)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [newFeatureKey, setNewFeatureKey] = useState("")
  const [newFeatureValue, setNewFeatureValue] = useState<boolean>(true)

  useEffect(() => {
    fetchPlans()
  }, [])

  const fetchPlans = async () => {
    try {
      setLoading(true)
      const response = await api.get("/subscription-plans")
      setPlans(response.data)
    } catch (error) {
      console.error("Failed to fetch plans:", error)
      toast.error("Failed to load subscription plans")
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (plan: SubscriptionPlan) => {
    setEditingPlan({
      ...plan,
      // Ensure all required fields are present
      billing_cycle: plan.billing_cycle || "monthly",
    })
    setNewPlan(false)
    setFormErrors({})
  }

  const handleDelete = (id: number) => {
    setPlanToDelete(id)
    setDeleteModalOpen(true)
  }

  const confirmDelete = () => {
    setDeleteModalOpen(false)
    fetchPlans() // Refresh the list after deletion
  }

  const handleAddNew = () => {
    const emptyPlan: SubscriptionPlan = {
      id: 0,
      name: "",
      description: "",
      price: "0",
      discount_percent: "0",
      billing_cycle: "monthly",
      is_active: true,
      features_json: {
        teams_enabled: false,
        payroll_enabled: false,
        analytics_enabled: false,
        custom_roles: false,
        storage_limit_gb: 5,
        support_level: "basic",
        employee_limit: 10,
      },
    }
    setEditingPlan(emptyPlan)
    setNewPlan(true)
    setFormErrors({})
  }

  const validateForm = () => {
    const errors: Record<string, string> = {}

    if (!editingPlan?.name.trim()) {
      errors.name = "Plan name is required"
    }

    if (isNaN(Number(editingPlan?.price)) || Number(editingPlan?.price) < 0) {
      errors.price = "Price must be a valid number"
    }

    if (
      isNaN(Number(editingPlan?.discount_percent)) ||
      Number(editingPlan?.discount_percent) < 0 ||
      Number(editingPlan?.discount_percent) > 100
    ) {
      errors.discount_percent = "Discount must be between 0 and 100"
    }

    if (
      isNaN(Number(editingPlan?.features_json.employee_limit)) ||
      Number(editingPlan?.features_json.employee_limit) <= 0
    ) {
      errors.employee_limit = "Employee limit must be a positive number"
    }

    if (
      isNaN(Number(editingPlan?.features_json.storage_limit_gb)) ||
      Number(editingPlan?.features_json.storage_limit_gb) <= 0
    ) {
      errors.storage_limit_gb = "Storage limit must be a positive number"
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    if (!editingPlan) return

    if (!validateForm()) {
      toast.error("Please fix the errors in the form")
      return
    }

    try {
      setIsSubmitting(true)

      if (newPlan) {
        await api.post("/subscription-plans", editingPlan)
        toast.success("Plan created successfully")
      } else {
        await api.patch(`/subscription-plans/${editingPlan.id}`, editingPlan)
        toast.success("Plan updated successfully")
      }

      setEditingPlan(null)
      setNewPlan(false)
      fetchPlans()
    } catch (error) {
      console.error("Failed to save plan:", error)
      toast.error("Failed to save subscription plan")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    setEditingPlan(null)
    setNewPlan(false)
    setFormErrors({})
  }

  const handleChange = (field: string, value: string | boolean | number) => {
    if (!editingPlan) return

    if (field.includes(".")) {
      const [parent, child] = field.split(".")

      if (parent === "features_json") {
        setEditingPlan({
          ...editingPlan,
          features_json: {
            ...editingPlan.features_json,
            [child]: value,
          },
        })
      } else {
        // Handle other nested objects if needed in the future
        setEditingPlan({
          ...editingPlan,
          [parent]: {
            ...(editingPlan[parent as keyof SubscriptionPlan] as any),
            [child]: value,
          },
        })
      }
    } else {
      setEditingPlan({
        ...editingPlan,
        [field]: value,
      })
    }
  }

  const addCustomFeature = () => {
    if (!editingPlan) return

    if (!newFeatureKey.trim()) {
      toast.error("Feature name is required")
      return
    }

    if (editingPlan.features_json.hasOwnProperty(newFeatureKey)) {
      toast.error("Feature already exists")
      return
    }

    const parsedValue: boolean = newFeatureValue

    setEditingPlan({
      ...editingPlan,
      features_json: {
        ...editingPlan.features_json,
        [newFeatureKey]: parsedValue,
      },
    })

    setNewFeatureKey("")
    setNewFeatureValue(true)

    toast.success("Feature added successfully")
  }

  const removeFeature = (key: string) => {
    if (!editingPlan) return

    // Don't allow removing core features
    const coreFeatures = [
      "teams_enabled",
      "payroll_enabled",
      "analytics_enabled",
      "custom_roles",
      "storage_limit_gb",
      "support_level",
      "employee_limit",
    ]

    if (coreFeatures.includes(key)) {
      toast.error("Cannot remove core features")
      return
    }

    const updatedFeatures = { ...editingPlan.features_json }
    delete updatedFeatures[key]

    setEditingPlan({
      ...editingPlan,
      features_json: updatedFeatures,
    })

    toast.success("Feature removed successfully")
  }

  const getSupportLevelBadge = (level: string) => {
    switch (level.toLowerCase()) {
      case "premium":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
            Premium
          </span>
        )
      case "standard":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            Standard
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            Basic
          </span>
        )
    }
  }

  const getStatusBadge = (isActive: boolean) => {
    return isActive ? (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
        <Check className="w-3 h-3 mr-1" />
        Active
      </span>
    ) : (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
        <X className="w-3 h-3 mr-1" />
        Inactive
      </span>
    )
  }

  const renderFeatureValue = (key: string, value: any) => {
    // Handle core features differently
    const coreFeatures = ["teams_enabled", "payroll_enabled", "analytics_enabled", "custom_roles"]

    if (coreFeatures.includes(key)) {
      return typeof value === "boolean" && value ? (
        <Check className="h-4 w-4 text-green-500" />
      ) : (
        <X className="h-4 w-4 text-red-500" />
      )
    }

    // Handle special core features
    if (key === "storage_limit_gb") {
      return `${value} GB`
    }

    if (key === "employee_limit") {
      return `${value} employees`
    }

    if (key === "support_level") {
      return getSupportLevelBadge(value)
    }

    // Handle custom features based on type
    if (typeof value === "boolean") {
      return value ? <Check className="h-4 w-4 text-green-500" /> : <X className="h-4 w-4 text-red-500" />
    }

    return value.toString()
  }

  return (
     <RoleGuard allowedRoles={[1]}>
    <div className="p-6">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Subscription Plans</h1>
          <p className="text-gray-500">Manage subscription plans for the platform</p>
        </div>
        <button
          onClick={handleAddNew}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#6148F4] hover:bg-[#5040d3] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#6148F4]"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add New Plan
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#6148F4] border-t-transparent"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`bg-white rounded-xl border ${plan.is_active ? "border-gray-200" : "border-gray-200 opacity-75"} shadow-sm overflow-hidden`}
            >
              <div className="p-6 border-b border-gray-100">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{plan.name}</h3>
                    <p className="text-sm text-gray-500 mt-1">{plan.description}</p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEdit(plan)}
                      className="rounded bg-gray-100 p-1.5 text-gray-600 transition-colors hover:bg-gray-200"
                    >
                      <Edit className="h-4 w-4" />
                      <span className="sr-only">Edit</span>
                    </button>
                    <button
                      onClick={() => handleDelete(plan.id)}
                      className="rounded bg-red-100 p-1.5 text-red-600 transition-colors hover:bg-red-200"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Delete</span>
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-baseline">
                    <span className="text-2xl font-bold text-gray-900">${plan.price}</span>
                    <span className="text-sm text-gray-500 ml-1">
                      /{plan.billing_cycle === "yearly" ? "year" : "month"}
                    </span>
                  </div>
                  {getStatusBadge(plan.is_active)}
                </div>

                {plan.discount_percent && Number(plan.discount_percent) > 0 && (
                  <div className="mb-4 inline-flex items-center px-2.5 py-1 rounded-md bg-green-50 text-green-700 text-sm">
                    <Percent className="h-4 w-4 mr-1" />
                    {plan.discount_percent}% yearly discount
                  </div>
                )}
              </div>

              <div className="p-6 bg-gray-50">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Features</h4>
                <ul className="space-y-3">
                  <li className="flex items-center text-sm">
                    <Users className="h-4 w-4 text-[#6148F4] mr-3" />
                    <span className="text-gray-700">Up to {plan.features_json.employee_limit} employees</span>
                  </li>
                  <li className="flex items-center text-sm">
                    <HardDrive className="h-4 w-4 text-[#6148F4] mr-3" />
                    <span className="text-gray-700">{plan.features_json.storage_limit_gb}GB storage</span>
                  </li>
                  <li className="flex items-center text-sm">
                    <HeadphonesIcon className="h-4 w-4 text-[#6148F4] mr-3" />
                    <span className="text-gray-700">
                      {getSupportLevelBadge(plan.features_json.support_level)} support
                    </span>
                  </li>
                </ul>

                <div className="mt-4 grid grid-cols-2 gap-2">
                  <div className="flex items-center">
                    {plan.features_json.teams_enabled ? (
                      <Check className="h-4 w-4 text-green-500 mr-2" />
                    ) : (
                      <X className="h-4 w-4 text-red-500 mr-2" />
                    )}
                    <span className="text-sm text-gray-700">Teams</span>
                  </div>
                  <div className="flex items-center">
                    {plan.features_json.payroll_enabled ? (
                      <Check className="h-4 w-4 text-green-500 mr-2" />
                    ) : (
                      <X className="h-4 w-4 text-red-500 mr-2" />
                    )}
                    <span className="text-sm text-gray-700">Payroll</span>
                  </div>
                  <div className="flex items-center">
                    {plan.features_json.analytics_enabled ? (
                      <Check className="h-4 w-4 text-green-500 mr-2" />
                    ) : (
                      <X className="h-4 w-4 text-red-500 mr-2" />
                    )}
                    <span className="text-sm text-gray-700">Analytics</span>
                  </div>
                  <div className="flex items-center">
                    {plan.features_json.custom_roles ? (
                      <Check className="h-4 w-4 text-green-500 mr-2" />
                    ) : (
                      <X className="h-4 w-4 text-red-500 mr-2" />
                    )}
                    <span className="text-sm text-gray-700">Custom Roles</span>
                  </div>
                </div>

                {/* Custom Features */}
                {Object.entries(plan.features_json).filter(
                  ([key]) =>
                    ![
                      "teams_enabled",
                      "payroll_enabled",
                      "analytics_enabled",
                      "custom_roles",
                      "storage_limit_gb",
                      "support_level",
                      "employee_limit",
                    ].includes(key),
                ).length > 0 && (
                  <>
                    <div className="mt-4 border-t border-gray-200 pt-4">
                      <h4 className="text-xs font-medium text-gray-500 mb-2">Additional Features</h4>
                      <div className="grid grid-cols-2 gap-2">
                        {Object.entries(plan.features_json)
                          .filter(
                            ([key]) =>
                              ![
                                "teams_enabled",
                                "payroll_enabled",
                                "analytics_enabled",
                                "custom_roles",
                                "storage_limit_gb",
                                "support_level",
                                "employee_limit",
                              ].includes(key),
                          )
                          .map(([key, value]) => (
                            <div key={key} className="flex items-center">
                              <div className="mr-2 flex-shrink-0">
                                {typeof value === "boolean" ? (
                                  value ? (
                                    <Check className="h-4 w-4 text-green-500" />
                                  ) : (
                                    <X className="h-4 w-4 text-red-500" />
                                  )
                                ) : (
                                  <Settings className="h-4 w-4 text-[#6148F4]" />
                                )}
                              </div>
                              <div className="flex flex-col">
                                <span className="text-xs font-medium text-gray-700">
                                  {key.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                                </span>
                                {typeof value !== "boolean" && (
                                  <span className="text-xs text-gray-500">{value.toString()}</span>
                                )}
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          ))}

          {plans.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center bg-white rounded-xl border border-gray-200 shadow-sm p-12">
              <div className="h-16 w-16 rounded-full bg-[#6148F4]/10 flex items-center justify-center mb-4">
                <DollarSign className="h-8 w-8 text-[#6148F4]" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No subscription plans</h3>
              <p className="text-gray-500 text-center mb-6">You haven't created any subscription plans yet.</p>
              <button
                onClick={handleAddNew}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#6148F4] hover:bg-[#5040d3] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#6148F4]"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create your first plan
              </button>
            </div>
          )}
        </div>
      )}

      {/* Edit/Create Plan Modal */}
      {editingPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl overflow-hidden rounded-xl bg-white shadow-xl animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-gray-100 p-6">
              <h2 className="flex items-center text-xl font-semibold text-gray-800">
                <DollarSign size={20} className="mr-2 text-[#6148F4]" />
                {newPlan ? "Create New Plan" : "Edit Plan"}
              </h2>
              <button onClick={handleCancel} className="focus:outline-none text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="max-h-[calc(90vh-80px)] overflow-y-auto p-6">
              <div className="space-y-6">
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <label htmlFor="name" className="mb-1 block text-sm font-medium text-gray-700">
                      Plan Name <span className="text-red-500">*</span>
                    </label>
                    <div className="relative rounded-md shadow-sm">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <DollarSign size={18} className="text-gray-400" />
                      </div>
                      <input
                        type="text"
                        id="name"
                        placeholder="Enterprise Plan"
                        value={editingPlan.name}
                        onChange={(e) => handleChange("name", e.target.value)}
                        className={`block w-full rounded-lg border ${
                          formErrors.name ? "border-red-300" : "border-gray-300"
                        } py-3 pl-10 pr-3 text-sm shadow-sm transition-all focus:border-[#6148F4] focus:outline-none focus:ring-2 focus:ring-[#6148F4]/20`}
                        required
                      />
                    </div>
                    {formErrors.name && <p className="mt-1 text-sm text-red-600">{formErrors.name}</p>}
                  </div>

                  <div>
                    <label htmlFor="status" className="mb-1 block text-sm font-medium text-gray-700">
                      Status
                    </label>
                    <div className="mt-1 flex items-center">
                      <div
                        className={`flex h-8 items-center rounded-md ${
                          editingPlan.is_active ? "bg-green-100" : "bg-red-100"
                        } px-3`}
                      >
                        {editingPlan.is_active ? (
                          <>
                            <Check size={16} className="mr-2 text-green-600" />
                            <span className="text-sm font-medium text-green-700">Active</span>
                          </>
                        ) : (
                          <>
                            <X size={16} className="mr-2 text-red-600" />
                            <span className="text-sm font-medium text-red-700">Inactive</span>
                          </>
                        )}
                      </div>
                      {newPlan && (
                        <button
                          type="button"
                          onClick={() => handleChange("is_active", !editingPlan.is_active)}
                          className="ml-3 text-sm text-[#6148F4] hover:underline"
                        >
                          {editingPlan.is_active ? "Set as inactive" : "Set as active"}
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <label htmlFor="description" className="mb-1 block text-sm font-medium text-gray-700">
                    Description
                  </label>
                  <div className="relative rounded-md shadow-sm">
                    <div className="pointer-events-none absolute inset-y-0 left-0 pl-3 pt-3">
                      <FileText size={18} className="text-gray-400" />
                    </div>
                    <textarea
                      id="description"
                      placeholder="Plan features and benefits"
                      value={editingPlan.description}
                      onChange={(e) => handleChange("description", e.target.value)}
                      className="min-h-[100px] block w-full rounded-lg border border-gray-300 py-3 pl-10 pr-3 text-sm shadow-sm transition-all focus:border-[#6148F4] focus:outline-none focus:ring-2 focus:ring-[#6148F4]/20"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                  <div>
                    <label htmlFor="price" className="mb-1 block text-sm font-medium text-gray-700">
                      Price ($) <span className="text-red-500">*</span>
                    </label>
                    <div className="relative rounded-md shadow-sm">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <span className="text-gray-500 sm:text-sm">$</span>
                      </div>
                      <input
                        type="number"
                        id="price"
                        placeholder="0.00"
                        value={editingPlan.price}
                        onChange={(e) => handleChange("price", e.target.value)}
                        className={`block w-full rounded-lg border ${
                          formErrors.price ? "border-red-300" : "border-gray-300"
                        } py-3 pl-10 pr-3 text-sm shadow-sm transition-all focus:border-[#6148F4] focus:outline-none focus:ring-2 focus:ring-[#6148F4]/20`}
                      />
                    </div>
                    {formErrors.price && <p className="mt-1 text-sm text-red-600">{formErrors.price}</p>}
                  </div>

                  <div>
                    <label htmlFor="billing_cycle" className="mb-1 block text-sm font-medium text-gray-700">
                      Billing Cycle
                    </label>
                    <div className="relative rounded-md shadow-sm">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <Calendar size={18} className="text-gray-400" />
                      </div>
                      <select
                        id="billing_cycle"
                        value={editingPlan.billing_cycle}
                        onChange={(e) => handleChange("billing_cycle", e.target.value)}
                        className="block w-full rounded-lg border border-gray-300 py-3 pl-10 pr-3 text-sm shadow-sm transition-all focus:border-[#6148F4] focus:outline-none focus:ring-2 focus:ring-[#6148F4]/20"
                      >
                        <option value="monthly">Monthly</option>
                        <option value="yearly">Yearly</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="discount" className="mb-1 block text-sm font-medium text-gray-700">
                      Yearly Discount (%)
                    </label>
                    <div className="relative rounded-md shadow-sm">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <Percent size={18} className="text-gray-400" />
                      </div>
                      <input
                        type="number"
                        id="discount"
                        placeholder="0"
                        value={editingPlan.discount_percent || "0"}
                        onChange={(e) => handleChange("discount_percent", e.target.value)}
                        className={`block w-full rounded-lg border ${
                          formErrors.discount_percent ? "border-red-300" : "border-gray-300"
                        } py-3 pl-10 pr-3 text-sm shadow-sm transition-all focus:border-[#6148F4] focus:outline-none focus:ring-2 focus:ring-[#6148F4]/20`}
                      />
                    </div>
                    {formErrors.discount_percent && (
                      <p className="mt-1 text-sm text-red-600">{formErrors.discount_percent}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                  <div>
                    <label htmlFor="employee_limit" className="mb-1 block text-sm font-medium text-gray-700">
                      Employee Limit <span className="text-red-500">*</span>
                    </label>
                    <div className="relative rounded-md shadow-sm">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <Users size={18} className="text-gray-400" />
                      </div>
                      <input
                        type="number"
                        id="employee_limit"
                        placeholder="10"
                        value={editingPlan.features_json.employee_limit}
                        onChange={(e) => handleChange("features_json.employee_limit", Number.parseInt(e.target.value))}
                        className={`block w-full rounded-lg border ${
                          formErrors.employee_limit ? "border-red-300" : "border-gray-300"
                        } py-3 pl-10 pr-3 text-sm shadow-sm transition-all focus:border-[#6148F4] focus:outline-none focus:ring-2 focus:ring-[#6148F4]/20`}
                      />
                    </div>
                    {formErrors.employee_limit && (
                      <p className="mt-1 text-sm text-red-600">{formErrors.employee_limit}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="storage" className="mb-1 block text-sm font-medium text-gray-700">
                      Storage Limit (GB) <span className="text-red-500">*</span>
                    </label>
                    <div className="relative rounded-md shadow-sm">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <HardDrive size={18} className="text-gray-400" />
                      </div>
                      <input
                        type="number"
                        id="storage"
                        placeholder="5"
                        value={editingPlan.features_json.storage_limit_gb}
                        onChange={(e) =>
                          handleChange("features_json.storage_limit_gb", Number.parseInt(e.target.value))
                        }
                        className={`block w-full rounded-lg border ${
                          formErrors.storage_limit_gb ? "border-red-300" : "border-gray-300"
                        } py-3 pl-10 pr-3 text-sm shadow-sm transition-all focus:border-[#6148F4] focus:outline-none focus:ring-2 focus:ring-[#6148F4]/20`}
                      />
                    </div>
                    {formErrors.storage_limit_gb && (
                      <p className="mt-1 text-sm text-red-600">{formErrors.storage_limit_gb}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="support" className="mb-1 block text-sm font-medium text-gray-700">
                      Support Level
                    </label>
                    <div className="relative rounded-md shadow-sm">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <HeadphonesIcon size={18} className="text-gray-400" />
                      </div>
                      <select
                        id="support"
                        value={editingPlan.features_json.support_level}
                        onChange={(e) => handleChange("features_json.support_level", e.target.value)}
                        className="block w-full rounded-lg border border-gray-300 py-3 pl-10 pr-3 text-sm shadow-sm transition-all focus:border-[#6148F4] focus:outline-none focus:ring-2 focus:ring-[#6148F4]/20"
                      >
                        <option value="basic">Basic</option>
                        <option value="standard">Standard</option>
                        <option value="premium">Premium</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900">Core Features</h3>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="flex items-center justify-between p-3 rounded-lg border border-gray-200 bg-gray-50">
                      <div className="flex items-center">
                        <div className="h-8 w-8 rounded-full bg-[#6148F4]/10 flex items-center justify-center mr-3">
                          <Users className="h-4 w-4 text-[#6148F4]" />
                        </div>
                        <label htmlFor="teams_enabled" className="text-sm font-medium text-gray-700">
                          Teams
                        </label>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          handleChange("features_json.teams_enabled", !editingPlan.features_json.teams_enabled)
                        }
                        className="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#6148F4] focus:ring-offset-2"
                        style={{ backgroundColor: editingPlan.features_json.teams_enabled ? "#6148F4" : "#d1d5db" }}
                      >
                        <span className="sr-only">Toggle teams</span>
                        <span
                          aria-hidden="true"
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            editingPlan.features_json.teams_enabled ? "translate-x-5" : "translate-x-0"
                          }`}
                        />
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-lg border border-gray-200 bg-gray-50">
                      <div className="flex items-center">
                        <div className="h-8 w-8 rounded-full bg-[#6148F4]/10 flex items-center justify-center mr-3">
                          <DollarSign className="h-4 w-4 text-[#6148F4]" />
                        </div>
                        <label htmlFor="payroll_enabled" className="text-sm font-medium text-gray-700">
                          Payroll
                        </label>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          handleChange("features_json.payroll_enabled", !editingPlan.features_json.payroll_enabled)
                        }
                        className="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#6148F4] focus:ring-offset-2"
                        style={{ backgroundColor: editingPlan.features_json.payroll_enabled ? "#6148F4" : "#d1d5db" }}
                      >
                        <span className="sr-only">Toggle payroll</span>
                        <span
                          aria-hidden="true"
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            editingPlan.features_json.payroll_enabled ? "translate-x-5" : "translate-x-0"
                          }`}
                        />
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-lg border border-gray-200 bg-gray-50">
                      <div className="flex items-center">
                        <div className="h-8 w-8 rounded-full bg-[#6148F4]/10 flex items-center justify-center mr-3">
                          <ToggleRight className="h-4 w-4 text-[#6148F4]" />
                        </div>
                        <label htmlFor="analytics_enabled" className="text-sm font-medium text-gray-700">
                          Analytics
                        </label>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          handleChange("features_json.analytics_enabled", !editingPlan.features_json.analytics_enabled)
                        }
                        className="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#6148F4] focus:ring-offset-2"
                        style={{ backgroundColor: editingPlan.features_json.analytics_enabled ? "#6148F4" : "#d1d5db" }}
                      >
                        <span className="sr-only">Toggle analytics</span>
                        <span
                          aria-hidden="true"
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            editingPlan.features_json.analytics_enabled ? "translate-x-5" : "translate-x-0"
                          }`}
                        />
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-lg border border-gray-200 bg-gray-50">
                      <div className="flex items-center">
                        <div className="h-8 w-8 rounded-full bg-[#6148F4]/10 flex items-center justify-center mr-3">
                          <ToggleLeft className="h-4 w-4 text-[#6148F4]" />
                        </div>
                        <label htmlFor="custom_roles" className="text-sm font-medium text-gray-700">
                          Custom Roles
                        </label>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          handleChange("features_json.custom_roles", !editingPlan.features_json.custom_roles)
                        }
                        className="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#6148F4] focus:ring-offset-2"
                        style={{ backgroundColor: editingPlan.features_json.custom_roles ? "#6148F4" : "#d1d5db" }}
                      >
                        <span className="sr-only">Toggle custom roles</span>
                        <span
                          aria-hidden="true"
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            editingPlan.features_json.custom_roles ? "translate-x-5" : "translate-x-0"
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Custom Features Section */}
                <div className="space-y-4 border-t border-gray-200 pt-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-gray-900">Additional Features</h3>
                    <span className="text-xs text-gray-500">
                      {
                        Object.keys(editingPlan.features_json).filter(
                          (key) =>
                            ![
                              "teams_enabled",
                              "payroll_enabled",
                              "analytics_enabled",
                              "custom_roles",
                              "storage_limit_gb",
                              "support_level",
                              "employee_limit",
                            ].includes(key),
                        ).length
                      }{" "}
                      custom features
                    </span>
                  </div>

                  {/* List of existing custom features */}
                  {Object.entries(editingPlan.features_json).filter(
                    ([key]) =>
                      ![
                        "teams_enabled",
                        "payroll_enabled",
                        "analytics_enabled",
                        "custom_roles",
                        "storage_limit_gb",
                        "support_level",
                        "employee_limit",
                      ].includes(key),
                  ).length > 0 && (
                    <div className="rounded-lg border border-gray-200 overflow-hidden">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th
                              scope="col"
                              className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                              Feature Name
                            </th>
                            <th
                              scope="col"
                              className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                              Value
                            </th>
                            <th
                              scope="col"
                              className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                              Action
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {Object.entries(editingPlan.features_json)
                            .filter(
                              ([key]) =>
                                ![
                                  "teams_enabled",
                                  "payroll_enabled",
                                  "analytics_enabled",
                                  "custom_roles",
                                  "storage_limit_gb",
                                  "support_level",
                                  "employee_limit",
                                ].includes(key),
                            )
                            .map(([key, value]) => (
                              <tr key={key} className="hover:bg-gray-50">
                                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                                  {key.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                  {value ? (
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                      Enabled
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                      Disabled
                                    </span>
                                  )}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                                  <button
                                    type="button"
                                    onClick={() => removeFeature(key)}
                                    className="text-red-600 hover:text-red-900"
                                  >
                                    Remove
                                  </button>
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Add new custom feature */}
                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Add New Feature</h4>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <label htmlFor="feature_key" className="block text-xs font-medium text-gray-500 mb-1">
                          Feature Name
                        </label>
                        <input
                          type="text"
                          id="feature_key"
                          placeholder="e.g., api_access"
                          value={newFeatureKey}
                          onChange={(e) => setNewFeatureKey(e.target.value)}
                          className="block w-full rounded-md border border-gray-300 py-2 px-3 text-sm shadow-sm focus:border-[#6148F4] focus:outline-none focus:ring-2 focus:ring-[#6148F4]/20"
                        />
                      </div>

                      <div>
                        <label htmlFor="feature_value" className="block text-xs font-medium text-gray-500 mb-1">
                          Value
                        </label>
                        <div className="flex items-center">
                          <button
                            type="button"
                            onClick={() => setNewFeatureValue(!newFeatureValue)}
                            className="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#6148F4] focus:ring-offset-2"
                            style={{ backgroundColor: newFeatureValue ? "#6148F4" : "#d1d5db" }}
                          >
                            <span className="sr-only">Toggle feature</span>
                            <span
                              aria-hidden="true"
                              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                newFeatureValue ? "translate-x-5" : "translate-x-0"
                              }`}
                            />
                          </button>
                          <span className="ml-2 text-sm text-gray-700">{newFeatureValue ? "Enabled" : "Disabled"}</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 flex justify-end">
                      <button
                        type="button"
                        onClick={addCustomFeature}
                        className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-[#6148F4] hover:bg-[#5040d3] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#6148F4]"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add Feature
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center rounded-lg bg-[#6148F4] px-4 py-2 text-white transition-colors hover:bg-[#5040d3] focus:outline-none focus:ring-2 focus:ring-[#6148F4]/50 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isSubmitting ? (
                    <>
                      <svg
                        className="-ml-1 mr-2 h-4 w-4 animate-spin text-white"
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
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      {newPlan ? "Create Plan" : "Save Changes"}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Subscription Plan"
        message="This will permanently delete this subscription plan. This action cannot be undone."
        itemId={planToDelete || undefined}
        endpoint="/subscription-plans"
        successMessage="Subscription plan deleted successfully"
      />
    </div>
    </RoleGuard>
  )
}
