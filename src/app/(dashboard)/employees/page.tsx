'use client'

import { useEffect, useState } from 'react'
import api from '@/lib/api'
import { toast } from 'react-toastify'
import InviteForm from '@/components/InviteForm'
import EmployeeTable from '@/components/EmployeeTable'
import InvitedTable from '@/components/InvitedTable'
import { Users, UserPlus, Mail } from 'lucide-react'

export default function EmployeesPage() {
  const [users, setUsers] = useState([])
  const [invites, setInvites] = useState([])
  const [reload, setReload] = useState(false)
  const [activeTab, setActiveTab] = useState<'employees' | 'invited' | 'inviteForm'>('employees')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    
    Promise.all([
      api.get('/users').then((res) => setUsers(res.data)),
      api.get('/employee-invites').then((res) => setInvites(res.data))
    ])
      .catch(() => toast.error('Failed to load data'))
      .finally(() => setLoading(false))
  }, [reload])

  const handleRefresh = () => {
    setReload(!reload)
  }

  return (
    <main className="p-6 md:p-8 min-h-screen bg-gray-50 text-gray-900">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Manage Employees</h1>
            <p className="text-gray-500 mt-1">Add, edit and manage your organization's employees</p>
          </div>
          
          <button
            onClick={() => setActiveTab('inviteForm')}
            className="mt-4 md:mt-0 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <UserPlus size={18} className="mr-2" />
            Invite Employee
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="-mb-px flex space-x-6" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('employees')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'employees'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center">
                <Users size={18} className="mr-2" />
                All Employees
              </div>
            </button>
            <button
              onClick={() => setActiveTab('invited')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'invited'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center">
                <Mail size={18} className="mr-2" />
                Invited Employees
              </div>
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="mt-6">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <>
              {activeTab === 'employees' && <EmployeeTable />}
              {activeTab === 'invited' && <InvitedTable invites={invites} />}
              {activeTab === 'inviteForm' && <InviteForm onSuccess={handleRefresh} />}
            </>
          )}
        </div>
      </div>
    </main>
  )
}
