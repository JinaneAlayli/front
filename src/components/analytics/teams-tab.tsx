import { Users } from "lucide-react"
import type { AnalyticsData } from "@/types/analytics"

interface TeamsTabProps {
  analyticsData: AnalyticsData
}

export default function TeamsTab({ analyticsData }: TeamsTabProps) {
  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="mb-1 text-sm font-medium text-gray-500">Total Teams</h3>
          {analyticsData?.summary?.totalTeams !== undefined ? (
            <p className="text-2xl font-bold">{analyticsData.summary.totalTeams}</p>
          ) : (
            <p className="text-lg text-gray-400">No data available</p>
          )}
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="mb-1 text-sm font-medium text-gray-500">Avg. Team Size</h3>
          {analyticsData?.summary?.avgTeamSize !== undefined ? (
            <p className="text-2xl font-bold">{analyticsData.summary.avgTeamSize}</p>
          ) : (
            <p className="text-lg text-gray-400">No data available</p>
          )}
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="mb-1 text-sm font-medium text-gray-500">Best Performing Team</h3>
          {analyticsData?.teamPerformance && analyticsData.teamPerformance.length > 0 ? (
            <p className="text-2xl font-bold">{analyticsData.teamPerformance[0].name}</p>
          ) : (
            <p className="text-lg text-gray-400">No data available</p>
          )}
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="mb-1 text-sm font-medium text-gray-500">Needs Improvement</h3>
          {analyticsData?.teamPerformance && analyticsData.teamPerformance.length > 1 ? (
            <p className="text-2xl font-bold">
              {analyticsData.teamPerformance[analyticsData.teamPerformance.length - 1].name}
            </p>
          ) : (
            <p className="text-lg text-gray-400">No data available</p>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-medium">Team Performance</h3>
        {analyticsData?.teamPerformance && analyticsData.teamPerformance.length > 0 ? (
          <div className="space-y-6">
            {analyticsData.teamPerformance.map((team) => (
              <div key={team.id} className="rounded-xl border p-4 hover:bg-gray-50">
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
                      <Users size={18} />
                    </div>
                    <h4 className="font-medium">{team.name}</h4>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        team.score >= 80
                          ? "bg-green-100 text-green-800"
                          : team.score >= 60
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                      }`}
                    >
                      {team.score}/100
                    </span>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Task Completion</p>
                    <div className="mt-1 flex items-center gap-2">
                      <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
                        <div
                          className={`h-full rounded-full ${
                            team.taskCompletion.assigned > 0 &&
                            team.taskCompletion.completed / team.taskCompletion.assigned > 0.8
                              ? "bg-green-500"
                              : team.taskCompletion.assigned > 0 &&
                                  team.taskCompletion.completed / team.taskCompletion.assigned > 0.6
                                ? "bg-yellow-500"
                                : "bg-red-500"
                          }`}
                          style={{
                            width:
                              team.taskCompletion.assigned > 0
                                ? `${(team.taskCompletion.completed / team.taskCompletion.assigned) * 100}%`
                                : "0%",
                          }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium">
                        {team.taskCompletion.assigned > 0
                          ? Math.round((team.taskCompletion.completed / team.taskCompletion.assigned) * 100)
                          : 0}
                        %
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      {team.taskCompletion.completed}/{team.taskCompletion.assigned} tasks completed
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Performance Score</p>
                    <div className="mt-1 flex items-center gap-2">
                      <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
                        <div
                          className={`h-full rounded-full ${
                            team.score >= 80 ? "bg-green-500" : team.score >= 60 ? "bg-yellow-500" : "bg-red-500"
                          }`}
                          style={{ width: `${team.score}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium">{team.score}/100</span>
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      {team.score >= 80 ? "Excellent" : team.score >= 60 ? "Good" : "Needs Improvement"}
                    </p>
                  </div>
                </div>
              </div>
            ))}
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
