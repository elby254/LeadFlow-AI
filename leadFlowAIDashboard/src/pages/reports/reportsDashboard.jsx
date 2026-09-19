/**
 *
 * Reports Dashboard
 *
 * Read-only business intelligence workspace.
 *
 * Used by:
 * • Managers
 * • Investors
 * • Executives
 * • Auditors
 *
 * Displays:
 * • Lead Sources
 * • Monthly Growth
 * • Hot Areas
 *
 * Future Reports
 * • Agent Performance
 * • Conversion Rates
 * • Revenue Trends
 * • Marketing ROI
 * • Customer Segments
 *
 * ==========================================================
 */

import MainLayout from "../../components/layout/mainLayout";

import PageHeader from "../../components/common/pageHeader";

import LeadSources from "../reports/leadSources";
import MonthlyGrowth from "../reports/monthlyGrowth";
import HotAreas from "../../components/dashboard/viewer/hotAreas";

const ReportsDashboard = () => {

  return (

    <MainLayout>

      <div className="space-y-8">

        {/* =============================================
            PAGE HEADER
        ============================================= */}

        <PageHeader

          title="Reports Dashboard"

          subtitle="Business intelligence, marketing performance and growth analytics."

        />

        {/* =============================================
            LEAD SOURCES
        ============================================= */}

        <LeadSources />

        {/* =============================================
            MONTHLY GROWTH
        ============================================= */}

        <MonthlyGrowth />

        {/* =============================================
            HOT AREAS
        ============================================= */}

        <HotAreas />

      </div>

    </MainLayout>

  );

};

export default ReportsDashboard;

