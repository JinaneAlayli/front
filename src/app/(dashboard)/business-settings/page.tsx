"use client"

import { useEffect, useState } from "react"
import { useSelector } from "react-redux"
import type { RootState } from "@/lib/redux/store"
import api from "@/lib/api"
import { toast } from "react-toastify"

export default function BusinessSettingsPage() {
  const user = useSelector((state: RootState) => state.auth.user)
  const [form, setForm] = useState({
    salary_cycle: "Monthly",
    workday_start: "09:00",
    workday_end: "17:00",
    annual_leave_days: 15,
    sick_leave_days: 10,
    overtime_rate: 1.5,
    currency: "USD",
  })
  const [settingId, setSettingId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    let newValue: string | number = value
    if (name === "overtime_rate") {
      newValue = parseFloat(value)
    } else if (name === "annual_leave_days" || name === "sick_leave_days") {
      newValue = parseInt(value)
    }
    setForm({ ...form, [name]: newValue })
  }

  const fetchSettings = async () => {
    try {
      const res = await api.get("/business-settings")
      const companySetting = res.data.find((s: any) => s.company_id === user?.company_id)
      if (companySetting) {
        setSettingId(companySetting.id)
        setForm({
          salary_cycle: companySetting.salary_cycle,
          workday_start: companySetting.workday_start.slice(0, 5),
          workday_end: companySetting.workday_end.slice(0, 5),
          annual_leave_days: companySetting.annual_leave_days,
          sick_leave_days: companySetting.sick_leave_days,
          overtime_rate: parseFloat(companySetting.overtime_rate),
          currency: companySetting.currency,
        })
      }
    } catch (err) {
      console.error("Failed to fetch settings", err)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await api.put("/business-settings/me", form)
      toast.success("Business settings saved successfully!")
    } catch (err) {
      console.error("Save failed", err)
      toast.error("Failed to save settings")
    }
  }

  useEffect(() => {
    if (user && user.company_id) {
      fetchSettings()
    } else {
      setLoading(false)
    }
  }, [user])

  return (
    <main className="p-8 max-w-2xl mx-auto">
      <form
        onSubmit={handleSubmit}
        className="space-y-6 bg-white border border-gray-200 rounded-lg shadow-xl p-6"
      >
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-800">Business Settings</h2>
          <p className="text-sm text-gray-500">Configure your company’s HR preferences</p>
        </div>

        {loading ? (
          <p className="text-center text-gray-400">Loading...</p>
        ) : (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700">Salary Cycle</label>
              <select
                name="salary_cycle"
                value={form.salary_cycle}
                onChange={handleChange}
                className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-400 outline-none"
              >
                <option value="Monthly">Monthly</option>
                <option value="Bi-Weekly">Bi-Weekly</option>
                <option value="Weekly">Weekly</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Workday Start</label>
                <input
                  type="time"
                  name="workday_start"
                  value={form.workday_start}
                  onChange={handleChange}
                  className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-400 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Workday End</label>
                <input
                  type="time"
                  name="workday_end"
                  value={form.workday_end}
                  onChange={handleChange}
                  className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-400 outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Annual Leave Days</label>
                <input
                  type="number"
                  name="annual_leave_days"
                  value={form.annual_leave_days}
                  onChange={handleChange}
                  className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-400 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Sick Leave Days</label>
                <input
                  type="number"
                  name="sick_leave_days"
                  value={form.sick_leave_days}
                  onChange={handleChange}
                  className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-400 outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Overtime Rate</label>
                <input
                  type="number"
                  name="overtime_rate"
                  step="0.1"
                  value={form.overtime_rate}
                  onChange={handleChange}
                  className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-400 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Currency</label>
                <select
                  name="currency"
                  value={form.currency}
                  onChange={handleChange}
                  className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-400 outline-none"
                >
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                  <option value="LBP">LBP</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-[#4F46E5] text-white font-medium py-2 rounded-md hover:bg-[#4338CA] transition disabled:opacity-70"
            >
              Save
            </button>
          </>
        )}
      </form>
    </main>
  )
}
