/**
 * ==========================================================
 *
 * Personal performance summary for the logged-in sales agent.
 *
 * Unlike the Admin dashboard, this widget focuses ONLY on
 * the current agent's achievements and assigned workload.
 *
 * Displays:
 * ----------------------------------------------------------
 * • Assigned Leads
 * • Closed Deals
 * • Conversion Rate
 * • Average Response Time
 * • Viewings Scheduled
 * • Monthly Commission
 *
 * Data Source:
 * ----------------------------------------------------------
 * useAgentDashboard()
 *
 * Expected Backend:
 * ----------------------------------------------------------
 * GET /api/agent/dashboard/performance
 *
 * ==========================================================
 */

import {
  Target,
  BadgeCheck,
  TrendingUp,
  Clock3,
  CalendarCheck,
  Wallet,
} from "lucide-react";

import useAgentDashboard from "../../../hooks/useAgentDashboard";

/* ==========================================================
   COMPONENT
========================================================== */

const MyPerformance = () => {
  const {
    performance,
    loading,
    error,
    refreshDashboard,
  } = useAgentDashboard();

  /* ========================================================
     LOADING
  ======================================================== */

  if (loading) {
    return (
      <section className="rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent" />

          <p className="text-sm text-slate-400">
            Loading your performance...
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
      <section className="rounded-3xl border border-red-500/20 bg-slate-900 p-6 shadow-xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-semibold text-red-400">
              Unable to load performance
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {error}
            </p>
          </div>

          <button
            onClick={refreshDashboard}
            className="
              rounded-xl
              bg-cyan-500
              px-4
              py-2
              text-sm
              font-semibold
              text-slate-950
              transition
              hover:bg-cyan-400
            "
          >
            Try Again
          </button>
        </div>
      </section>
    );
  }

  /* ========================================================
     PERFORMANCE DATA
  ======================================================== */

  const agentPerformance = performance || {};

  /* ========================================================
     METRICS
  ======================================================== */

  const metrics = [
    {
      title: "Assigned Leads",
      value: agentPerformance.assignedLeads ?? 0,
      icon: Target,
      color: "bg-cyan-500",
      description:
        "Customers currently assigned to you.",
    },

    {
      title: "Closed Deals",
      value: agentPerformance.closedDeals ?? 0,
      icon: BadgeCheck,
      color: "bg-emerald-500",
      description:
        "Successful property transactions completed.",
    },

    {
      title: "Conversion Rate",
      value: `${agentPerformance.conversionRate ?? 0}%`,
      icon: TrendingUp,
      color: "bg-violet-500",
      description:
        "Percentage of assigned leads converted into closed deals.",
    },

    {
      title: "Response Time",
      value:
        agentPerformance.responseTime ??
        "0 min",
      icon: Clock3,
      color: "bg-orange-500",
      description:
        "Average time taken to respond to new customer inquiries.",
    },

    {
      title: "Viewings Scheduled",
      value:
        agentPerformance.scheduledViewings ??
        agentPerformance.viewings ??
        0,
      icon: CalendarCheck,
      color: "bg-blue-500",
      description:
        "Property viewings arranged for your assigned customers.",
    },

    {
      title: "Monthly Commission",
      value: formatCurrency(
        agentPerformance.commission
      ),
      icon: Wallet,
      color: "bg-amber-500",
      description:
        "Commission earned from successful property transactions this month.",
    },
  ];

  /* ========================================================
     RENDER
  ======================================================== */

  return (
    <section
      className="
        rounded-3xl
        border
        border-slate-800
        bg-slate-900
        shadow-xl
      "
    >

      {/* ====================================================
          HEADER
      ==================================================== */}

      <div className="border-b border-slate-800 p-6">

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

          <div>
            <h2 className="text-2xl font-bold text-white">
              📊 My Performance
            </h2>

            <p className="mt-2 text-sm text-slate-400">
              Your personal sales performance, customer response
              speed and viewing activity.
            </p>
          </div>

          {/* Refresh */}

          <button
            onClick={refreshDashboard}
            className="
              w-fit
              rounded-xl
              border
              border-slate-700
              bg-slate-800
              px-4
              py-2
              text-sm
              font-medium
              text-slate-300
              transition
              hover:bg-slate-700
            "
          >
            Refresh
          </button>

        </div>

      </div>

      {/* ====================================================
          METRICS
      ==================================================== */}

      <div
        className="
          grid
          gap-6
          p-6
          sm:grid-cols-2
          xl:grid-cols-3
        "
      >

        {metrics.map((metric) => {

          const Icon = metric.icon;

          return (
            <article
              key={metric.title}
              className="
                rounded-2xl
                border
                border-slate-800
                bg-slate-950
                p-6
                transition-all
                duration-300
                hover:-translate-y-1
                hover:border-cyan-500/30
                hover:shadow-lg
              "
            >

              {/* ==================================================
                  METRIC HEADER
              =================================================== */}

              <div className="flex items-center justify-between">

                <div>

                  <p className="text-sm text-slate-400">
                    {metric.title}
                  </p>

                  <h3 className="mt-3 text-3xl font-bold text-white">
                    {metric.value}
                  </h3>

                </div>

                {/* ICON */}

                <div
                  className={`
                    ${metric.color}
                    flex
                    h-14
                    w-14
                    items-center
                    justify-center
                    rounded-2xl
                  `}
                >
                  <Icon
                    size={26}
                    className="text-white"
                  />
                </div>

              </div>

              {/* ==================================================
                  DESCRIPTION
              =================================================== */}

              <p className="mt-5 text-sm leading-relaxed text-slate-500">
                {metric.description}
              </p>

            </article>
          );

        })}

      </div>

      {/* ====================================================
          VIEWING PERFORMANCE
      ==================================================== */}

      <div className="mx-6 mb-6 rounded-2xl border border-blue-500/20 bg-blue-500/5 p-5">

        <div className="flex items-start gap-4">

          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-blue-500/10">
            <CalendarCheck
              size={20}
              className="text-blue-400"
            />
          </div>

          <div>

            <h3 className="font-semibold text-white">
              Property Viewing Activity
            </h3>

            <p className="mt-1 text-sm leading-relaxed text-slate-400">
              Your scheduled viewings are now part of the LeadFlow AI
              conversion workflow. Qualified customers can move from
              viewing to negotiation and eventually to a closed deal.
            </p>

          </div>

        </div>

      </div>

      {/* ====================================================
          FOOTER INSIGHT
      ==================================================== */}

      <div
        className="
          border-t
          border-slate-800
          bg-cyan-500/5
          p-6
        "
      >

        <p className="text-sm leading-relaxed text-cyan-300">

          <strong>LeadFlow AI Insight:</strong>{" "}
          Fast responses, consistent follow-ups and well-managed
          property viewings are key contributors to stronger conversion
          rates. Continue engaging qualified and hot leads promptly
          while keeping scheduled viewings up to date.

        </p>

      </div>

    </section>
  );
};

/* ==========================================================
   CURRENCY FORMATTER
========================================================== */

const formatCurrency = (value) => {

  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "KES 0";
  }

  if (typeof value === "string") {

    if (value.startsWith("KES")) {
      return value;
    }

    const numericValue =
      Number(
        value.replace(/[^0-9.-]+/g, "")
      );

    if (!Number.isNaN(numericValue)) {
      return `KES ${numericValue.toLocaleString()}`;
    }

    return value;
  }

  if (typeof value === "number") {
    return `KES ${value.toLocaleString()}`;
  }

  return "KES 0";
};

export default MyPerformance;