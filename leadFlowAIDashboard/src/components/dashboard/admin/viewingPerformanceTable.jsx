// ======================================================
// Admin Dashboard
// Viewing Performance Table
// ======================================================

import {

  Award,
  Clock3,
  TrendingUp,

} from "lucide-react";

const ViewingPerformanceTable = ({

  performance = [],

  loading = false,

}) => {

  if (loading) {

    return (

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">

        <div className="border-b px-6 py-5">

          <h2 className="text-lg font-semibold text-gray-900">

            Agent Viewing Performance

          </h2>

        </div>

        <div className="p-6">

          {[1, 2, 3, 4, 5].map((row) => (

            <div

              key={row}

              className="mb-4 h-14 animate-pulse rounded-lg bg-gray-200"

            />

          ))}

        </div>

      </div>

    );

  }

  return (

    <div className="rounded-xl border border-gray-200 bg-white shadow-sm">

      {/* ============================================== */}
      {/* HEADER */}
      {/* ============================================== */}

      <div className="flex items-center justify-between border-b px-6 py-5">

        <div>

          <h2 className="text-lg font-semibold text-gray-900">

            Agent Viewing Performance

          </h2>

          <p className="mt-1 text-sm text-gray-500">

            Compare agent performance across viewing activities.

          </p>

        </div>

        <TrendingUp

          size={24}

          className="text-blue-600"

        />

      </div>

      {/* ============================================== */}
      {/* TABLE */}
      {/* ============================================== */}

      <div className="overflow-x-auto">

        <table className="min-w-full">

          <thead className="bg-gray-50">

            <tr>

              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">

                Agent

              </th>

              <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wide text-gray-500">

                Assigned

              </th>

              <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wide text-gray-500">

                Completed

              </th>

              <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wide text-gray-500">

                Avg Delay

              </th>

              <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wide text-gray-500">

                Cancellation %

              </th>

              <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wide text-gray-500">

                Completion %

              </th>

              <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wide text-gray-500">

                Performance

              </th>

            </tr>

          </thead>

          <tbody className="divide-y divide-gray-200">

            {performance.length === 0 ? (

              <tr>

                <td

                  colSpan={7}

                  className="px-6 py-12 text-center text-gray-500"

                >

                  No performance data available.

                </td>

              </tr>

            ) : (

              performance.map((agent, index) => {

                const completionRate =

                  agent.completionRate ??

                  (

                    agent.assignedViewings > 0

                      ? Math.round(

                          (agent.completedViewings /

                            agent.assignedViewings) *

                            100

                        )

                      : 0

                  );

                let performanceLabel = "Needs Attention";

                let performanceClass =

                  "bg-red-100 text-red-700";

                if (completionRate >= 90) {

                  performanceLabel = "Excellent";

                  performanceClass =

                    "bg-emerald-100 text-emerald-700";

                } else if (completionRate >= 75) {

                  performanceLabel = "Good";

                  performanceClass =

                    "bg-blue-100 text-blue-700";

                } else if (completionRate >= 60) {

                  performanceLabel = "Average";

                  performanceClass =

                    "bg-amber-100 text-amber-700";

                }

                return (

                  <tr

                    key={agent._id || agent.id || index}

                    className="transition hover:bg-gray-50"

                  >

                    {/* ====================================== */}
                    {/* AGENT */}
                    {/* ====================================== */}

                    <td className="px-6 py-4">

                      <div className="flex items-center gap-3">

                        {index === 0 && (

                          <Award

                            size={18}

                            className="text-yellow-500"

                          />

                        )}

                        <div>

                          <p className="font-semibold text-gray-900">

                            {agent.name}

                          </p>

                          <p className="text-sm text-gray-500">

                            {agent.email}

                          </p>

                        </div>

                      </div>

                    </td>

                    {/* Assigned */}

                    <td className="px-6 py-4 text-center font-medium">

                      {agent.assignedViewings}

                    </td>

                    {/* Completed */}

                    <td className="px-6 py-4 text-center font-medium">

                      {agent.completedViewings}

                    </td>

                    {/* Average Delay */}

                    <td className="px-6 py-4">

                      <div className="flex items-center justify-center gap-2">

                        <Clock3

                          size={16}

                          className="text-amber-600"

                        />

                        <span>

                          {agent.averageDelay || 0} mins

                        </span>

                      </div>

                    </td>

                    {/* Cancellation */}

                    <td className="px-6 py-4 text-center">

                      {agent.cancellationRate || 0}%

                    </td>

                    {/* Completion */}

                    <td className="px-6 py-4 text-center font-semibold text-emerald-600">

                      {completionRate}%

                    </td>

                    {/* Performance */}

                    <td className="px-6 py-4 text-center">

                      <span

                        className={`rounded-full px-3 py-1 text-xs font-semibold ${performanceClass}`}

                      >

                        {performanceLabel}

                      </span>

                    </td>

                  </tr>

                );

              })

            )}

          </tbody>

        </table>

      </div>

      {/* ============================================== */}
      {/* FOOTER */}
      {/* ============================================== */}

      <div className="flex items-center justify-between border-t bg-gray-50 px-6 py-4">

        <p className="text-sm text-gray-500">

          Total Agents Evaluated:

          <span className="ml-2 font-semibold text-gray-900">

            {performance.length}

          </span>

        </p>

        <p className="text-sm text-gray-500">

          Rankings update automatically after every completed viewing.

        </p>

      </div>

    </div>

  );

};

export default ViewingPerformanceTable;