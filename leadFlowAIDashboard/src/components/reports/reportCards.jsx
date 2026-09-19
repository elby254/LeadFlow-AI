/**
 * ==========================================================
 * Executive KPI cards displayed at the top of the
 * Reports Dashboard.
 *
 * Unlike dashboard KPIs, these summarize business
 * performance over the selected reporting period.
 *
 * Displays
 * --------
 * • Total Leads
 * • Qualified Leads
 * • Closed Deals
 * • Revenue
 *
 * Data Source
 * -----------
 * GET /reports/summary
 *
 * Used In
 * -------
 * ReportsDashboard.jsx
 *
 * ==========================================================
 */

import {
  Users,
  UserCheck,
  BadgeDollarSign,
  CircleDollarSign,
} from "lucide-react";

import StatCard from "../common/statCard";

const ReportCards = ({
  summary = {},
  loading = false,
}) => {

  const {

    totalLeads = 0,

    qualifiedLeads = 0,

    closedDeals = 0,

    revenue = 0,

    leadGrowth = "+0%",

    qualificationGrowth = "+0%",

    dealGrowth = "+0%",

    revenueGrowth = "+0%",

  } = summary;

  return (

    <section
      className="
        grid
        gap-6
        md:grid-cols-2
        xl:grid-cols-4
      "
    >

      {/* =========================================
          TOTAL LEADS
      ========================================= */}

      <StatCard

        title="Total Leads"

        value={totalLeads}

        icon={<Users size={24} />}

        trend={leadGrowth}

        trendDirection="up"

        description="Leads captured during this reporting period."

        loading={loading}

      />

      {/* =========================================
          QUALIFIED LEADS
      ========================================= */}

      <StatCard

        title="Qualified Leads"

        value={qualifiedLeads}

        icon={<UserCheck size={24} />}

        trend={qualificationGrowth}

        trendDirection="up"

        description="AI-qualified customers ready for agent engagement."

        loading={loading}

      />

      {/* =========================================
          CLOSED DEALS
      ========================================= */}

      <StatCard

        title="Closed Deals"

        value={closedDeals}

        icon={<BadgeDollarSign size={24} />}

        trend={dealGrowth}

        trendDirection="up"

        description="Successfully converted property transactions."

        loading={loading}

      />

      {/* =========================================
          REVENUE
      ========================================= */}

      <StatCard

        title="Revenue"

        value={`KES ${Number(revenue).toLocaleString()}`}

        icon={<CircleDollarSign size={24} />}

        trend={revenueGrowth}

        trendDirection="up"

        description="Estimated commission revenue generated."

        loading={loading}

      />

    </section>

  );

};

export default ReportCards;

