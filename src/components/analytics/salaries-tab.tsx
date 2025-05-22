import { PieChart } from "lucide-react"
import type { AnalyticsData } from "@/app/types/analytics"

interface SalariesTabProps {
  analyticsData: AnalyticsData
  formatCurrency: (amount: number) => string
  getCompensationPercentage: (value: number, total: number) => number
}

export default function SalariesTab({ analyticsData, formatCurrency, getCompensationPercentage }: SalariesTabProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="mb-1 text-sm font-medium text-gray-500">Total Salary Budget</h3>
            {analyticsData?.summary?.totalSalaryBudget !== undefined ? (
              <p className="text-2xl font-bold">{formatCurrency(analyticsData.summary.totalSalaryBudget)}</p>
            ) : (
              <p className="text-lg text-gray-400">No data available</p>
            )}
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="mb-1 text-sm font-medium text-gray-500">Avg. Salary</h3>
            {analyticsData?.summary?.avgSalary !== undefined ? (
              <p className="text-2xl font-bold">{formatCurrency(analyticsData.summary.avgSalary)}</p>
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
            <h3 className="mb-1 text-sm font-medium text-gray-500">Salary Ranges</h3>
            {analyticsData?.salaryDistribution && analyticsData.salaryDistribution.length > 0 ? (
              <p className="text-2xl font-bold">{analyticsData.salaryDistribution.length}</p>
            ) : (
              <p className="text-lg text-gray-400">No data available</p>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-medium">Compensation Insights</h3>
          {analyticsData?.salaryData ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {/* Compensation Components Chart */}
              <div className="h-auto rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <h4 className="mb-4 text-base font-medium text-gray-700">Compensation Components</h4>
                <div className="flex flex-col items-center justify-center">
                  <div className="relative h-64 w-64">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <p className="text-sm text-gray-500">Total Budget</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {analyticsData?.summary?.totalSalaryBudget !== undefined
                            ? formatCurrency(analyticsData.summary.totalSalaryBudget)
                            : "$0"}
                        </p>
                      </div>
                    </div>
                    {analyticsData.salaryData?.compensationBreakdown.total > 0 ? (
                      <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
                        {/* Base Salary Segment */}
                        <circle
                          cx="50"
                          cy="50"
                          r="40"
                          fill="none"
                          stroke="#6148F4"
                          strokeWidth="12"
                          strokeDasharray="251.2"
                          strokeDashoffset="0"
                          className="opacity-90"
                        />
                        {/* Bonus Segment */}
                        <circle
                          cx="50"
                          cy="50"
                          r="40"
                          fill="none"
                          stroke="#38BDF8"
                          strokeWidth="12"
                          strokeDasharray="251.2"
                          strokeDashoffset={
                            251.2 *
                            (1 -
                              getCompensationPercentage(
                                analyticsData.salaryData.compensationBreakdown.baseSalary,
                                analyticsData.salaryData.compensationBreakdown.total,
                              ) /
                                100)
                          }
                          className="opacity-90"
                        />
                        {/* Overtime Segment */}
                        <circle
                          cx="50"
                          cy="50"
                          r="40"
                          fill="none"
                          stroke="#4ADE80"
                          strokeWidth="12"
                          strokeDasharray="251.2"
                          strokeDashoffset={
                            251.2 *
                            (1 -
                              (getCompensationPercentage(
                                analyticsData.salaryData.compensationBreakdown.baseSalary,
                                analyticsData.salaryData.compensationBreakdown.total,
                              ) +
                                getCompensationPercentage(
                                  analyticsData.salaryData.compensationBreakdown.bonus,
                                  analyticsData.salaryData.compensationBreakdown.total,
                                )) /
                                100)
                          }
                          className="opacity-90"
                        />
                        {/* Deductions Segment */}
                        <circle
                          cx="50"
                          cy="50"
                          r="40"
                          fill="none"
                          stroke="#F87171"
                          strokeWidth="12"
                          strokeDasharray="251.2"
                          strokeDashoffset={
                            251.2 *
                            (1 -
                              (getCompensationPercentage(
                                analyticsData.salaryData.compensationBreakdown.baseSalary,
                                analyticsData.salaryData.compensationBreakdown.total,
                              ) +
                                getCompensationPercentage(
                                  analyticsData.salaryData.compensationBreakdown.bonus,
                                  analyticsData.salaryData.compensationBreakdown.total,
                                ) +
                                getCompensationPercentage(
                                  analyticsData.salaryData.compensationBreakdown.overtime,
                                  analyticsData.salaryData.compensationBreakdown.total,
                                )) /
                                100)
                          }
                          className="opacity-90"
                        />
                      </svg>
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <PieChart className="h-16 w-16 text-gray-200" />
                      </div>
                    )}
                  </div>
                  <div className="mt-6 flex flex-wrap items-center justify-center gap-6">
                    <div className="flex items-center">
                      <div className="mr-2 h-3 w-3 rounded-full bg-[#6148F4]"></div>
                      <span className="text-sm text-gray-600">
                        Base Salary (
                        {getCompensationPercentage(
                          analyticsData.salaryData?.compensationBreakdown.baseSalary || 0,
                          analyticsData.salaryData?.compensationBreakdown.total || 1,
                        )}
                        %)
                      </span>
                    </div>
                    <div className="flex items-center">
                      <div className="mr-2 h-3 w-3 rounded-full bg-[#38BDF8]"></div>
                      <span className="text-sm text-gray-600">
                        Bonuses (
                        {getCompensationPercentage(
                          analyticsData.salaryData?.compensationBreakdown.bonus || 0,
                          analyticsData.salaryData?.compensationBreakdown.total || 1,
                        )}
                        %)
                      </span>
                    </div>
                    <div className="flex items-center">
                      <div className="mr-2 h-3 w-3 rounded-full bg-[#4ADE80]"></div>
                      <span className="text-sm text-gray-600">
                        Overtime (
                        {getCompensationPercentage(
                          analyticsData.salaryData?.compensationBreakdown.overtime || 0,
                          analyticsData.salaryData?.compensationBreakdown.total || 1,
                        )}
                        %)
                      </span>
                    </div>
                    <div className="flex items-center">
                      <div className="mr-2 h-3 w-3 rounded-full bg-[#F87171]"></div>
                      <span className="text-sm text-gray-600">
                        Deductions (
                        {getCompensationPercentage(
                          analyticsData.salaryData?.compensationBreakdown.deductions || 0,
                          analyticsData.salaryData?.compensationBreakdown.total || 1,
                        )}
                        %)
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Top Earners List */}
              <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <h4 className="mb-2 text-sm font-medium text-gray-700">Top Earners</h4>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b text-left text-xs font-medium uppercase text-gray-500">
                        <th className="pb-3 pl-4">Employee</th>
                        <th className="pb-3">Salary</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analyticsData.salaryData.topEarners.map((salary) => (
                        <tr key={salary.id} className="border-b last:border-0 hover:bg-gray-50">
                          <td className="py-3 pl-4">{salary.user?.name || "Unknown"}</td>
                          <td className="py-3">
                            {formatCurrency(
                              Number(salary.base_salary) +
                                Number(salary.bonus || 0) +
                                Number(salary.overtime || 0) -
                                Number(salary.deductions || 0),
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Salary by Department Breakdown */}
              <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <h4 className="mb-2 text-sm font-medium text-gray-700">Salary by Department</h4>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b text-left text-xs font-medium uppercase text-gray-500">
                        <th className="pb-3 pl-4">Department</th>
                        <th className="pb-3">Avg. Salary</th>
                        <th className="pb-3">Employee Count</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analyticsData.salaryData.departmentSalaries.map((dept) => (
                        <tr key={dept.department} className="border-b last:border-0 hover:bg-gray-50">
                          <td className="py-3 pl-4">{dept.department}</td>
                          <td className="py-3">{formatCurrency(dept.avgSalary)}</td>
                          <td className="py-3">{dept.count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Salary Growth Chart */}
              <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <h4 className="mb-2 text-sm font-medium text-gray-700">Salary Growth</h4>
                {analyticsData.salaryData.monthlySalaries && analyticsData.salaryData.monthlySalaries.length > 0 ? (
                  <div className="h-48">
                    {/* Placeholder for chart */}
                    <p className="text-center text-gray-500">Chart will be displayed here</p>
                  </div>
                ) : (
                  <p className="text-center text-gray-500">No monthly salary data available</p>
                )}
              </div>
            </div>
          ) : (
            <div className="flex h-40 items-center justify-center text-gray-400">
              <p>No data available</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
