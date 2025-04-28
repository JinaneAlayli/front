'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import api from '@/lib/api'
import { toast } from 'react-toastify'

export default function RegisterPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [invite, setInvite] = useState<any>(null)
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
  })

  useEffect(() => {
    if (!token) return

    api
      .get(`/employee-invites/${token}`)
      .then((res) => {
        setInvite(res.data)
        setForm((prev) => ({ ...prev, email: res.data.email || '' }))
      })
      .catch(() => {
        toast.error('Invalid or expired invite token')
        router.push('/')
      })
  }, [token])

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!invite) return toast.error('Invite not found')
  
    try {
      const payload = {
        ...form,
        token, // 👈 👈 👈 ✅ This is the only new line!
        role_id: invite.role_id,
        team_id: invite.team_id,
        company_id: invite.company_id,
      }
  
      await api.post('/users/register', payload)
      toast.success('Registered successfully!')
      router.push('/login')
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Registration failed')
    }
  }
  

  if (!invite) {
    return <div className="text-center mt-10 text-gray-600">Loading invite details...</div>
  }

  const roleName =
    invite.role_id === 2 ? 'HR' : invite.role_id === 3 ? 'Team Leader' : 'Employee'

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#F9FAFB] p-4">
      <form onSubmit={handleRegister} className="bg-white p-8 rounded-xl shadow-md w-full max-w-md space-y-5">
        <h1 className="text-2xl font-bold text-center">Register to Company</h1>

        <p className="text-sm text-center text-gray-600">
          You're joining as <span className="font-semibold">{roleName}</span>
        </p>

        <input
          type="text"
          placeholder="Full Name"
          className="w-full p-3 border rounded-md"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
        />

        <input
          type="email"
          placeholder="Email"
          className="w-full p-3 border rounded-md bg-gray-100 text-gray-700"
          value={form.email}
          readOnly
          required
        />

        <input
          type="password"
          placeholder="Password"
          className="w-full p-3 border rounded-md"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          required
        />

        <button type="submit" className="w-full bg-[#4ADE80] text-black py-3 rounded-md font-semibold hover:opacity-90 transition">
          Register
        </button>
      </form>
    </main>
  )
}
