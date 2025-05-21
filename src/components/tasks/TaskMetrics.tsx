"use client"

import { useState, useEffect } from "react"
import { AlertCircle, Calendar, BarChart3, TrendingUp } from "lucide-react"

interface Task {
  id: number
  task: string
  note: string
  completed: boolean
  due_date?: string
}

interface TaskMetricsProps {
  tasks: Task[]
}

export default function TaskMetrics({ tasks }: TaskMetricsProps) {
  const [metrics, setMetrics] = useState({
    total: 0,
    completed: 0,
    pending: 0,
    overdue: 0,
    completionRate: 0,
    dueToday: 0,
  })

  useEffect(() => {
    if (!tasks.length) return

    const completed = tasks.filter((task) => task.completed).length
    const overdue = tasks.filter(
      (task) => !task.completed && task.due_date && new Date(task.due_date) < new Date(),
    ).length
    const dueToday = tasks.filter(
      (task) =>
        !task.completed && task.due_date && new Date(task.due_date).toDateString() === new Date().toDateString(),
    ).length

    setMetrics({
      total: tasks.length,
      completed,
      pending: tasks.length - completed,
      overdue,
      completionRate: Math.round((completed / tasks.length) * 100),
      dueToday,
    })
  }, [tasks])

  return (
    <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Total Tasks</p>
            <h3 className="mt-1 text-2xl font-bold text-gray-900">{metrics.total}</h3>
          </div>
          <div className="rounded-full bg-[#6148F4]/10 p-3 text-[#6148F4]">
            <BarChart3 size={20} />
          </div>
        </div>
        <div className="mt-4 flex items-center text-xs text-gray-500">
          <div className="flex items-center">
            <div className="mr-1 h-2 w-2 rounded-full bg-[#6148F4]"></div>
            <span>All tasks</span>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Completion Rate</p>
            <h3 className="mt-1 text-2xl font-bold text-gray-900">{metrics.completionRate}%</h3>
          </div>
          <div className="rounded-full bg-green-100 p-3 text-green-600">
            <TrendingUp size={20} />
          </div>
        </div>
        <div className="mt-4 h-2 w-full rounded-full bg-gray-100">
          <div className="h-2 rounded-full bg-green-500" style={{ width: `${metrics.completionRate}%` }}></div>
        </div>
      </div>

      <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Overdue</p>
            <h3 className="mt-1 text-2xl font-bold text-gray-900">{metrics.overdue}</h3>
          </div>
          <div className="rounded-full bg-red-100 p-3 text-red-600">
            <AlertCircle size={20} />
          </div>
        </div>
        <div className="mt-4 flex items-center text-xs text-gray-500">
          <div className="flex items-center">
            <div className="mr-1 h-2 w-2 rounded-full bg-red-500"></div>
            <span>Needs attention</span>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Due Today</p>
            <h3 className="mt-1 text-2xl font-bold text-gray-900">{metrics.dueToday}</h3>
          </div>
          <div className="rounded-full bg-blue-100 p-3 text-blue-600">
            <Calendar size={20} />
          </div>
        </div>
        <div className="mt-4 flex items-center text-xs text-gray-500">
          <div className="flex items-center">
            <div className="mr-1 h-2 w-2 rounded-full bg-blue-500"></div>
            <span>Today's focus</span>
          </div>
        </div>
      </div>
    </div>
  )
}
