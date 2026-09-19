/**
 * ==========================================================
 *
 * PURPOSE
 * ----------------------------------------------------------
 * Displays property performance analytics for LeadFlow AI.
 *
 * Used By
 * ----------------------------------------------------------
 * • AdminDashboard
 * • ReportsDashboard
 * • Property Dashboard
 *
 * Data Source
 * ----------------------------------------------------------
 * useDashboard()
 * dashboardService.getPropertyAnalytics()
 *
 * Backend
 * ----------------------------------------------------------
 * GET /api/dashboard/property-analytics
 *
 * ==========================================================
 */

import {
  Building2,
  Home,
  BadgeDollarSign,
  TrendingUp,
  Activity,
} from "lucide-react";

import useDashboard from "../../../hooks/useDashboard";

const PropertyAnalytics = () => {
  /* ========================================================
     DASHBOARD DATA
  ======================================================== */

  const {
    propertyAnalytics,
    loading,
    error,
    refreshDashboard,
  } = useDashboard();

  /* ========================================================
     LOADING
  ======================================================== */

  if (loading) {
    return (
      <section className="rounded-2xl border border-slate-800 bg-slate-900 p-8">
        <div className="flex h-72 items-center justify-center">
          <p className="text-slate-400">
            Loading property analytics...
          </p>
        </div>
      </section>
    );
  }

  /* ========================================================
     ERROR
  ======================================================== */

  if (error) {
    return (
      <section className="rounded-2xl border border-red-500/30 bg-red-500/10 p-8">
        <div className="space-y-5 text-center">

          <h2 className="text-xl font-bold text-red-400">
            Unable to load Property Analytics
          </h2>

          <p className="text-slate-300">
            {error}
          </p>

          <button
            onClick={refreshDashboard}
            className="
              rounded-xl
              bg-cyan-500
              px-5
              py-3
              font-semibold
              text-slate-950
              transition
              hover:bg-cyan-400
            "
          >
            Retry
          </button>

        </div>
      </section>
    );
  }

  /* ========================================================
     SAFE DEFAULTS
  ======================================================== */

  const analytics =
    propertyAnalytics || {};

  const {
    totalProperties = 0,
    availableProperties = 0,
    soldProperties = 0,
    monthlyRevenue = 0,
    occupancyRate = 0,
    propertyGrowth = 0,
    monthlyTrend = [],
    recentActivity = [],
  } = analytics;

  /* ========================================================
     PAGE
  ======================================================== */

  return (
    <section className="space-y-8">

      {/* ====================================================
          HEADER
      ==================================================== */}

      <div className="flex items-center justify-between">

        <div>

          <h2 className="text-2xl font-bold text-white">
            Property Analytics
          </h2>

          <p className="mt-1 text-slate-400">
            Monitor portfolio performance,
            occupancy and revenue.
          </p>

        </div>

      </div>

      {/* ====================================================
          KPI CARDS
      ==================================================== */}

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">

        {/* Total Properties */}

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">

          <div className="flex items-center justify-between">

            <div>

              <p className="text-sm text-slate-400">
                Total Properties
              </p>

              <h3 className="mt-2 text-3xl font-bold text-white">
                {totalProperties}
              </h3>

            </div>

            <div className="rounded-xl bg-cyan-500/20 p-3">

              <Building2
                className="text-cyan-400"
                size={24}
              />

            </div>

          </div>

        </div>

        {/* Available */}

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">

          <div className="flex items-center justify-between">

            <div>

              <p className="text-sm text-slate-400">
                Available
              </p>

              <h3 className="mt-2 text-3xl font-bold text-white">
                {availableProperties}
              </h3>

            </div>

            <div className="rounded-xl bg-emerald-500/20 p-3">

              <Home
                className="text-emerald-400"
                size={24}
              />

            </div>

          </div>

        </div>

        {/* Sold */}

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">

          <div className="flex items-center justify-between">

            <div>

              <p className="text-sm text-slate-400">
                Sold
              </p>

              <h3 className="mt-2 text-3xl font-bold text-white">
                {soldProperties}
              </h3>

            </div>

            <div className="rounded-xl bg-orange-500/20 p-3">

              <Activity
                className="text-orange-400"
                size={24}
              />

            </div>

          </div>

        </div>

        {/* Revenue */}

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">

          <div className="flex items-center justify-between">

            <div>

              <p className="text-sm text-slate-400">
                Monthly Revenue
              </p>

              <h3 className="mt-2 text-3xl font-bold text-white">
                KES {monthlyRevenue.toLocaleString()}
              </h3>

            </div>

            <div className="rounded-xl bg-yellow-500/20 p-3">

              <BadgeDollarSign
                className="text-yellow-400"
                size={24}
              />

            </div>

          </div>

        </div>

      </div>

      {/* ====================================================
          MAIN GRID
          (Continues in Part 2)
      ==================================================== */}

      <div className="grid gap-8 xl:grid-cols-3">

        {/* ====================================================
            OCCUPANCY
        ==================================================== */}

        <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">

          <div className="mb-6 flex items-center justify-between">

            <h3 className="text-lg font-semibold text-white">
              Occupancy Rate
            </h3>

            <TrendingUp
              className="text-cyan-400"
              size={22}
            />

          </div>

          <div className="flex items-end gap-3">

            <span className="text-5xl font-black text-cyan-400">
              {occupancyRate}%
            </span>

            <span className="pb-2 text-sm text-slate-400">
              Occupied Properties
            </span>

          </div>

          <div className="mt-6 h-4 overflow-hidden rounded-full bg-slate-800">

            <div
              className="h-full rounded-full bg-cyan-500 transition-all duration-700"
              style={{
                width: `${occupancyRate}%`,
              }}
            />

          </div>

          <p className="mt-4 text-sm leading-relaxed text-slate-400">

            Percentage of properties currently
            occupied or sold relative to the
            total portfolio.

          </p>

        </section>

        {/* ====================================================
            PROPERTY GROWTH
        ==================================================== */}

        <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">

          <div className="mb-6 flex items-center justify-between">

            <h3 className="text-lg font-semibold text-white">
              Portfolio Growth
            </h3>

            <TrendingUp
              className="text-emerald-400"
              size={22}
            />

          </div>

          <div className="flex items-end gap-3">

            <span className="text-5xl font-black text-emerald-400">

              +{propertyGrowth}%

            </span>

            <span className="pb-2 text-sm text-slate-400">
              This Month
            </span>

          </div>

          <p className="mt-6 text-sm leading-relaxed text-slate-400">

            Growth compares newly added
            properties against the previous
            reporting period.

          </p>

        </section>

        {/* ====================================================
            MONTHLY TREND
        ==================================================== */}

        <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">

          <div className="mb-6">

            <h3 className="text-lg font-semibold text-white">
              Monthly Trend
            </h3>

            <p className="mt-1 text-sm text-slate-400">
              Properties added during the last
              reporting periods.
            </p>

          </div>

          <div className="space-y-4">

            {monthlyTrend.length > 0 ? (

              monthlyTrend.map((item, index) => (

                <div
                  key={`${item.month}-${index}`}
                >

                  <div className="mb-2 flex items-center justify-between">

                    <span className="text-sm font-medium text-slate-300">
                      {item.month}
                    </span>

                    <span className="text-sm font-semibold text-white">
                      {item.value}
                    </span>

                  </div>

                  <div className="h-3 overflow-hidden rounded-full bg-slate-800">

                    <div
                      className="h-full rounded-full bg-cyan-500 transition-all duration-700"
                      style={{
                        width: `${Math.min(
                          item.value,
                          100
                        )}%`,
                      }}
                    />

                  </div>

                </div>

              ))

            ) : (

              <div className="py-10 text-center text-slate-500">

                No monthly trend available.

              </div>

            )}

          </div>

        </section>

      </div>

      {/* ====================================================
          PROPERTY PERFORMANCE
      ==================================================== */}

      <section className="rounded-2xl border border-slate-800 bg-slate-900 p-8">

        <div className="mb-8 flex items-center justify-between">

          <div>

            <h3 className="text-xl font-bold text-white">
              Property Performance Summary
            </h3>

            <p className="mt-1 text-sm text-slate-400">
              Overview of current portfolio health.
            </p>

          </div>

        </div>

        <div className="grid gap-6 md:grid-cols-3">

          {/* Occupancy */}

          <div className="rounded-xl bg-slate-950 p-6">

            <p className="text-sm text-slate-400">
              Occupancy
            </p>

            <h4 className="mt-3 text-4xl font-black text-cyan-400">
              {occupancyRate}%
            </h4>

          </div>

          {/* Growth */}

          <div className="rounded-xl bg-slate-950 p-6">

            <p className="text-sm text-slate-400">
              Monthly Growth
            </p>

            <h4 className="mt-3 text-4xl font-black text-emerald-400">
              +{propertyGrowth}%
            </h4>

          </div>

          {/* Revenue */}

          <div className="rounded-xl bg-slate-950 p-6">

            <p className="text-sm text-slate-400">
              Monthly Revenue
            </p>

            <h4 className="mt-3 text-3xl font-black text-yellow-400">
              KES {monthlyRevenue.toLocaleString()}
            </h4>

          </div>

        </div>

      </section>

      {/* ====================================================
          RECENT PROPERTY ACTIVITY
      ==================================================== */}

      <section className="rounded-2xl border border-slate-800 bg-slate-900 p-8">

        <div className="mb-8">

          <h3 className="text-xl font-bold text-white">
            Recent Property Activity
          </h3>

          <p className="mt-1 text-sm text-slate-400">
            Latest property updates across the platform.
          </p>

        </div>

        <div className="space-y-5">

          {recentActivity.length > 0 ? (

            recentActivity.map((activity, index) => (

              <div
                key={`${activity.id || index}`}
                className="
                  flex
                  items-center
                  justify-between
                  rounded-xl
                  border
                  border-slate-800
                  bg-slate-950
                  p-5
                "
              >

                <div>

                  <h4 className="font-semibold text-white">
                    {activity.propertyName}
                  </h4>

                  <p className="mt-1 text-sm text-slate-400">
                    {activity.location}
                  </p>

                </div>

                <div className="text-right">

                  <span
                    className="
                      inline-flex
                      rounded-full
                      bg-cyan-500/20
                      px-3
                      py-1
                      text-sm
                      font-semibold
                      text-cyan-400
                    "
                  >
                    {activity.status}
                  </span>

                  <p className="mt-2 text-sm text-slate-500">
                    {activity.updatedAt}
                  </p>

                </div>

              </div>

            ))

          ) : (

            <div className="py-12 text-center text-slate-500">

              No recent property activity found.

            </div>

          )}

        </div>

      </section>

    </section>

  );
};

export default PropertyAnalytics;