import { User } from "lucide-react"
import type { AnalyticsData } from "@/app/types/analytics"

interface AttendanceTabProps {
  analyticsData: AnalyticsData
}

export default function AttendanceTab({ analyticsData }: AttendanceTabProps) {
  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="mb-1 text-sm font-medium text-gray-500">Avg. Attendance Rate</h3>
          {analyticsData?.summary?.attendanceRate !== undefined ? (
            <p className="text-2xl font-bold">{analyticsData.summary.attendanceRate}%</p>
          ) : (
            <p className="text-lg text-gray-400">No data available</p>
          )}
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="mb-1 text-sm font-medium text-gray-500">Late Check-ins</h3>
          {analyticsData?.summary?.lateArrivals !== undefined ? (
            <p className="text-2xl font-bold">{analyticsData.summary.lateArrivals}</p>
          ) : (
            <p className="text-lg text-gray-400">No data available</p>
          )}
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="mb-1 text-sm font-medium text-gray-500">Total Employees</h3>
          {analyticsData?.summary?.totalEmployees !== undefined ? (
            <p className="text-2xl font-bold">{analyticsData.summary.totalEmployees}</p>
          ) : (
            <p className="text-lg text-gray-400">No data available</p>
          )}
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="mb-1 text-sm font-medium text-gray-500">Working Days</h3>
          <p className="text-2xl font-bold">20</p>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-medium">Attendance Issues</h3>
        {analyticsData?.attendanceIssues && analyticsData.attendanceIssues.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b text-left text-xs font-medium uppercase text-gray-500">
                  <th className="pb-3 pl-4">Employee</th>
                  <th className="pb-3">Late Check-ins</th>
                  <th className="pb-3">Absences</th>
                  <th className="pb-3 pr-4">Avg. Late (min)</th>
                </tr>
              </thead>
              <tbody>
                {analyticsData.attendanceIssues.map((employee) => (
                  <tr key={employee.id} className="border-b last:border-0 hover:bg-gray-50">
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
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          employee.lateCount > 5
                            ? "bg-red-100 text-red-800"
                            : employee.lateCount > 3
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-green-100 text-green-800"
                        }`}
                      >
                        {employee.lateCount}
                      </span>
                    </td>
                    <td className="py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          employee.absenceCount > 3
                            ? "bg-red-100 text-red-800"
                            : employee.absenceCount > 1
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-green-100 text-green-800"
                        }`}
                      >
                        {employee.absenceCount}
                      </span>
                    </td>
                    <td className="py-3 pr-4">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          employee.avgLateMinutes > 30
                            ? "bg-red-100 text-red-800"
                            : employee.avgLateMinutes > 15
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-green-100 text-green-800"
                        }`}
                      >
                        {employee.avgLateMinutes} min
                      </span>
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
    </div>
  )
}
