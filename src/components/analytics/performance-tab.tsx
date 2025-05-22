"use client"

import { useState } from "react"
import { CheckCircle, AlertTriangle, User, Award } from "lucide-react"
import type { AnalyticsData, Task, ApiUser } from "@/app/types/analytics"

interface PerformanceTabProps {
  analyticsData: AnalyticsData
  tasks: Task[]
  users: ApiUser[]
}

export default function PerformanceTab({ analyticsData, tasks, users }: PerformanceTabProps) {
  const [showTaskDetails, setShowTaskDetails] = useState<number | null>(null)

  // Helper function to get user name by ID
  const getUserNameById = (userId: number): string => {
    const user = users.find((u) => u.id === userId)
    return user ? user.name : "Unknown"
  }

  // Get tasks assigned to a specific user
  const getTasksAssignedToUser = (userId: number) => {
    return tasks.filter((task) => task.user_id === userId)
  }

  // Get tasks created by a specific user
  const getTasksCreatedByUser = (userId: number) => {
    return tasks.filter((task) => task.created_by === userId)
  }

  // Get tasks completed by a specific user (tasks they created that are marked as completed)
  const getTasksCompletedByUser = (userId: number) => {
    return tasks.filter((task) => task.created_by === userId && task.completed)
  }

  // Get tasks that were assigned to a user and are completed
  const getCompletedTasksForUser = (userId: number) => {
    return tasks.filter((task) => task.user_id === userId && task.completed)
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="mb-1 text-sm font-medium text-gray-500">Total Employees</h3>
          {analyticsData?.summary?.totalEmployees !== undefined ? (
            <p className="text-2xl font-bold">{analyticsData.summary.totalEmployees}</p>
          ) : (
            <p className="text-lg text-gray-400">No data available</p>
          )}
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="mb-1 text-sm font-medium text-gray-500">Total Tasks</h3>
          {analyticsData?.summary?.totalTasks !== undefined ? (
            <p className="text-2xl font-bold">{analyticsData.summary.totalTasks}</p>
          ) : (
            <p className="text-lg text-gray-400">No data available</p>
          )}
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="mb-1 text-sm font-medium text-gray-500">Completed Tasks</h3>
          {analyticsData?.summary?.completedTasks !== undefined ? (
            <p className="text-2xl font-bold">{analyticsData.summary.completedTasks}</p>
          ) : (
            <p className="text-lg text-gray-400">No data available</p>
          )}
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="mb-1 text-sm font-medium text-gray-500">Pending Tasks</h3>
          {analyticsData?.summary?.pendingTasks !== undefined ? (
            <p className="text-2xl font-bold">{analyticsData.summary.pendingTasks}</p>
          ) : (
            <p className="text-lg text-gray-400">No data available</p>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-medium">Employee Performance</h3>
        {analyticsData?.employeePerformance && analyticsData.employeePerformance.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b text-left text-xs font-medium uppercase text-gray-500">
                  <th className="pb-3 pl-4">Employee</th>
                  <th className="pb-3">Tasks</th>
                  <th className="pb-3">Completion</th>
                  <th className="pb-3">On-Time</th>
                  <th className="pb-3">Attendance</th>
                  <th className="pb-3 pr-4">Overall Score</th>
                </tr>
              </thead>
              <tbody>
                {analyticsData.employeePerformance.map((employee) => (
                  <tr
                    key={employee.id}
                    className="border-b last:border-0 hover:bg-gray-50 cursor-pointer"
                    onClick={() => setShowTaskDetails(employee.id === showTaskDetails ? null : employee.id)}
                  >
                    <td className="py-3 pl-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 flex-shrink-0">
                          {employee.avatar ? (
                            <img
                              src={employee.avatar || "/placeholder.svg"}
                              alt={employee.name}
                              className="h-10 w-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#6148F4]/10">
                              <User size={20} className="text-[#6148F4]" />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{employee.name || "Unknown User"}</p>
                          <p className="text-xs text-gray-500">{employee.position || "Employee"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3">
                      <div className="flex flex-col">
                        <span className="font-medium">
                          {employee.tasksCompleted}/{employee.tasksTotal}
                        </span>
                        <div className="mt-1 h-1.5 w-24 overflow-hidden rounded-full bg-gray-200">
                          <div
                            className="h-full bg-green-500"
                            style={{
                              width:
                                employee.tasksTotal > 0
                                  ? `${(employee.tasksCompleted / employee.tasksTotal) * 100}%`
                                  : "0%",
                            }}
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`flex h-6 w-6 items-center justify-center rounded-full ${
                            employee.completionRate >= 75
                              ? "bg-green-100 text-green-700"
                              : employee.completionRate >= 50
                                ? "bg-yellow-100 text-yellow-700"
                                : "bg-red-100 text-red-700"
                          }`}
                        >
                          {employee.completionRate >= 75 ? (
                            <CheckCircle size={14} />
                          ) : employee.completionRate >= 50 ? (
                            <AlertTriangle size={14} />
                          ) : (
                            <AlertTriangle size={14} />
                          )}
                        </span>
                        <span>{employee.completionRate}%</span>
                      </div>
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`flex h-6 w-6 items-center justify-center rounded-full ${
                            employee.onTimeCompletion >= 75
                              ? "bg-green-100 text-green-700"
                              : employee.onTimeCompletion >= 50
                                ? "bg-yellow-100 text-yellow-700"
                                : "bg-red-100 text-red-700"
                          }`}
                        >
                          {employee.onTimeCompletion >= 75 ? (
                            <CheckCircle size={14} />
                          ) : employee.onTimeCompletion >= 50 ? (
                            <AlertTriangle size={14} />
                          ) : (
                            <AlertTriangle size={14} />
                          )}
                        </span>
                        <span>{employee.onTimeCompletion}%</span>
                      </div>
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`flex h-6 w-6 items-center justify-center rounded-full ${
                            employee.attendanceRate >= 90
                              ? "bg-green-100 text-green-700"
                              : employee.attendanceRate >= 75
                                ? "bg-yellow-100 text-yellow-700"
                                : "bg-red-100 text-red-700"
                          }`}
                        >
                          {employee.attendanceRate >= 90 ? (
                            <CheckCircle size={14} />
                          ) : employee.attendanceRate >= 75 ? (
                            <AlertTriangle size={14} />
                          ) : (
                            <AlertTriangle size={14} />
                          )}
                        </span>
                        <span>{employee.attendanceRate}%</span>
                      </div>
                    </td>
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
                          <Award
                            size={16}
                            className={
                              employee.overallScore >= 80
                                ? "text-green-500"
                                : employee.overallScore >= 60
                                  ? "text-yellow-500"
                                  : "text-red-500"
                            }
                          />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-medium">{employee.overallScore}/100</span>
                          <div className="mt-1 h-1.5 w-16 overflow-hidden rounded-full bg-gray-200">
                            <div
                              className={`h-full ${
                                employee.overallScore >= 80
                                  ? "bg-green-500"
                                  : employee.overallScore >= 60
                                    ? "bg-yellow-500"
                                    : "bg-red-500"
                              }`}
                              style={{ width: `${employee.overallScore}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex h-40 items-center justify-center text-gray-400">
            <p>No data available</p>
          </div>
        )}
      </div>

      {/* Task Details Section */}
      {showTaskDetails && (
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-medium">Task Details for {getUserNameById(showTaskDetails)}</h3>

          <div className="mb-6">
            <h4 className="mb-2 text-md font-medium">Tasks Completed by This Employee</h4>
            {getTasksCompletedByUser(showTaskDetails).length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b text-left text-xs font-medium uppercase text-gray-500">
                      <th className="pb-3 pl-4">Task Title</th>
                      <th className="pb-3">Assigned To</th>
                      <th className="pb-3">Due Date</th>
                      <th className="pb-3">Completion Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getTasksCompletedByUser(showTaskDetails).map((task) => (
                      <tr key={task.id} className="border-b last:border-0 hover:bg-gray-50">
                        <td className="py-3 pl-4">{task.task}</td>
                        <td className="py-3">{getUserNameById(task.user_id)}</td>
                        <td className="py-3">{task.due_date ? new Date(task.due_date).toLocaleDateString() : "N/A"}</td>
                        <td className="py-3">{new Date(task.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500">No tasks completed by this employee</p>
            )}
          </div>

          <div className="mb-6">
            <h4 className="mb-2 text-md font-medium">Tasks Assigned to This Employee (Completed)</h4>
            {getCompletedTasksForUser(showTaskDetails).length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b text-left text-xs font-medium uppercase text-gray-500">
                      <th className="pb-3 pl-4">Task Title</th>
                      <th className="pb-3">Created By</th>
                      <th className="pb-3">Due Date</th>
                      <th className="pb-3">Completion Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getCompletedTasksForUser(showTaskDetails).map((task) => (
                      <tr key={task.id} className="border-b last:border-0 hover:bg-gray-50">
                        <td className="py-3 pl-4">{task.task}</td>
                        <td className="py-3">{getUserNameById(task.created_by)}</td>
                        <td className="py-3">{task.due_date ? new Date(task.due_date).toLocaleDateString() : "N/A"}</td>
                        <td className="py-3">{new Date(task.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500">No completed tasks assigned to this employee</p>
            )}
          </div>

          <div>
            <h4 className="mb-2 text-md font-medium">All Tasks Assigned to This Employee</h4>
            {getTasksAssignedToUser(showTaskDetails).length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b text-left text-xs font-medium uppercase text-gray-500">
                      <th className="pb-3 pl-4">Task Title</th>
                      <th className="pb-3">Status</th>
                      <th className="pb-3">Created By</th>
                      <th className="pb-3">Due Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getTasksAssignedToUser(showTaskDetails).map((task) => (
                      <tr key={task.id} className="border-b last:border-0 hover:bg-gray-50">
                        <td className="py-3 pl-4">{task.task}</td>
                        <td className="py-3">
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                              task.completed ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                            }`}
                          >
                            {task.completed ? "Completed" : "Pending"}
                          </span>
                        </td>
                        <td className="py-3">{getUserNameById(task.created_by)}</td>
                        <td className="py-3">{task.due_date ? new Date(task.due_date).toLocaleDateString() : "N/A"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500">No tasks assigned to this employee</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
