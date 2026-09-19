/**
 * ==========================================================
 * ADMIN BUSINESS ANALYTICS DASHBOARD
 * ----------------------------------------------------------
 * Executive-level visualizations for agency performance.
 *
 * Displays:
 * • Lead Pipeline Trend
 * • Lead Source Performance
 * • AI Qualification Distribution
 * • Monthly Agency Performance
 *
 * This component is presentation-only.
 * Data is supplied from the Admin Dashboard hook/service.
 *
 * ==========================================================
 */

import {
  ResponsiveContainer,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from "recharts";

const DashboardCharts = ({
  pipelineTrend = [],
  leadSources = [],
  aiQualification = [],
  monthlyTrend = [], // ← corrected
}) => {

  //----------------------------------------------------------
  // Shared chart colors
  //----------------------------------------------------------

  const COLORS = [
    "#06b6d4",
    "#3b82f6",
    "#8b5cf6",
    "#10b981",
    "#f59e0b",
    "#ef4444",
  ];

  return (

    <section className="grid gap-6 xl:grid-cols-2">

      {/* =====================================================
          LEAD PIPELINE TREND
      ====================================================== */}

      <article
        className="
          rounded-2xl
          border
          border-slate-800
          bg-slate-900
          p-6
          shadow-xl
        "
      >

        <div className="mb-6">

          <h2 className="text-xl font-bold text-white">
            Lead Pipeline Trend
          </h2>

          <p className="mt-2 text-sm text-slate-400">
            Track how leads progress through the sales pipeline
            over time.
          </p>

        </div>

        <div className="h-80">

          <ResponsiveContainer width="100%" height="100%">

            <LineChart data={pipelineTrend}>

              <CartesianGrid
                stroke="#334155"
                strokeDasharray="3 3"
              />

              <XAxis
                dataKey="month"
                stroke="#94a3b8"
              />

              <YAxis stroke="#94a3b8" />

              <Tooltip />

              <Legend />

              <Line
                type="monotone"
                dataKey="newLeads"
                stroke="#06b6d4"
                strokeWidth={3}
                name="New Leads"
              />

              <Line
                type="monotone"
                dataKey="qualified"
                stroke="#10b981"
                strokeWidth={3}
                name="Qualified"
              />

              <Line
                type="monotone"
                dataKey="viewings"
                stroke="#f59e0b"
                strokeWidth={3}
                name="Viewings"
              />

              <Line
                type="monotone"
                dataKey="closed"
                stroke="#8b5cf6"
                strokeWidth={3}
                name="Closed Deals"
              />

            </LineChart>

          </ResponsiveContainer>

        </div>

      </article>

      {/* =====================================================
          AI QUALIFICATION OVERVIEW
      ====================================================== */}

      <article
        className="
          rounded-2xl
          border
          border-slate-800
          bg-slate-900
          p-6
          shadow-xl
        "
      >

        <div className="mb-6">

          <h2 className="text-xl font-bold text-white">
            AI Qualification Overview
          </h2>

          <p className="mt-2 text-sm text-slate-400">
            Distribution of AI qualification decisions across
            all incoming leads.
          </p>

        </div>

        <div className="h-80">

          <ResponsiveContainer width="100%" height="100%">

            <BarChart data={aiQualification}>

              <CartesianGrid
                stroke="#334155"
                strokeDasharray="3 3"
              />

              <XAxis
                dataKey="label"
                stroke="#94a3b8"
              />

              <YAxis stroke="#94a3b8" />

              <Tooltip />

              <Legend />

              <Bar
                dataKey="count"
                radius={[8, 8, 0, 0]}
              >

                {aiQualification.map((entry, index) => (

                  <Cell
                    key={`cell-${index}`}
                    fill={
                      COLORS[index % COLORS.length]
                    }
                  />

                ))}

              </Bar>

            </BarChart>

          </ResponsiveContainer>

        </div>

      </article>

      {/* =====================================================
          LEAD SOURCE PERFORMANCE
      ====================================================== */}

      <article
        className="
          rounded-2xl
          border
          border-slate-800
          bg-slate-900
          p-6
          shadow-xl
        "
      >

        <div className="mb-6">

          <h2 className="text-xl font-bold text-white">
            Lead Source Performance
          </h2>

          <p className="mt-2 text-sm text-slate-400">
            Compare which acquisition channels generate the
            highest volume of qualified leads.
          </p>

        </div>

        <div className="h-80">

          <ResponsiveContainer width="100%" height="100%">

            <PieChart>

              <Pie
                data={leadSources}
                dataKey="value"
                nameKey="source"
                cx="50%"
                cy="50%"
                outerRadius={110}
                label
              >

                {leadSources.map((entry, index) => (

                  <Cell
                    key={`cell-${index}`}
                    fill={
                      COLORS[index % COLORS.length]
                    }
                  />

                ))}

              </Pie>

              <Tooltip />

              <Legend />

            </PieChart>

          </ResponsiveContainer>

        </div>

      </article>

      {/* =====================================================
          MONTHLY AGENCY PERFORMANCE
      ====================================================== */}

      <article
        className="
          rounded-2xl
          border
          border-slate-800
          bg-slate-900
          p-6
          shadow-xl
        "
      >

        <div className="mb-6">

          <h2 className="text-xl font-bold text-white">
            Monthly Agency Performance
          </h2>

          <p className="mt-2 text-sm text-slate-400">
            Overall agency growth across lead acquisition and
            successful property transactions.
          </p>

        </div>

        <div className="h-80">

          <ResponsiveContainer width="100%" height="100%">

            <AreaChart data={monthlyTrend}>

              <defs>

                <linearGradient
                  id="leadGradient"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >

                  <stop
                    offset="5%"
                    stopColor="#06b6d4"
                    stopOpacity={0.8}
                  />

                  <stop
                    offset="95%"
                    stopColor="#06b6d4"
                    stopOpacity={0}
                  />

                </linearGradient>

                <linearGradient
                  id="dealGradient"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >

                  <stop
                    offset="5%"
                    stopColor="#10b981"
                    stopOpacity={0.8}
                  />

                  <stop
                    offset="95%"
                    stopColor="#10b981"
                    stopOpacity={0}
                  />

                </linearGradient>

              </defs>

              <CartesianGrid
                stroke="#334155"
                strokeDasharray="3 3"
              />

              <XAxis
                dataKey="month"
                stroke="#94a3b8"
              />

              <YAxis stroke="#94a3b8" />

              <Tooltip />

              <Legend />

              <Area
                type="monotone"
                dataKey="leads"
                stroke="#06b6d4"
                fill="url(#leadGradient)"
                strokeWidth={3}
                name="Leads"
              />

              <Area
                type="monotone"
                dataKey="closed"
                stroke="#10b981"
                fill="url(#dealGradient)"
                strokeWidth={3}
                name="Closed Deals"
              />

            </AreaChart>

          </ResponsiveContainer>

        </div>

      </article>

    </section>

  );

};

export default DashboardCharts;