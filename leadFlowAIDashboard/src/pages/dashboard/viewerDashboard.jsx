/**
 *
 * Read-only business monitoring dashboard.
 *
 * Intended Users
 * --------------
 * • Managers
 * • Investors
 * • Marketing
 * • Auditors
 *
 * Viewers can:
 * • Monitor business performance
 * • View CRM activity
 * • Monitor inventory
 * • Read reports
 *
 * Viewers cannot:
 * • Contact leads
 * • Edit leads
 * • Assign agents
 * • Perform follow-ups
 *
 * ==========================================================
 */

import MainLayout from "../../components/layout/mainLayout";

import DashboardHeader from "../../components/dashboard/viewer/dashboardHeader";

import PipelineOverview from "../../components/reports/pipelineOverview";
import LatestLeads from "../../components/lead/latestLeads";
import LatestConversations from "../../components/lead/latestConversations";
import RecentFollowUps from "../../components/followups/recentFollowUps";
import FeaturedProperties from "../../components/dashboard/viewer/featuredProperties";
import PropertyOverview from "../../components/dashboard/viewer/propertyOverview";
import RecommendedProperties from "../../components/dashboard/viewer/recommendedProperties";
import SavedProperties from "../../components/dashboard/viewer/savedProperties";
import ViewingAppointments from "../../components/dashboard/viewer/viewingAppointments";
import RecentConversations from "../../components/dashboard/viewer/conversationWorkspace/recentConversations";
import AgentMessages from "../../components/dashboard/viewer/conversationWorkspace/agentMessages";

import AvailableProperties from "../../components/properties/availableProperties";
import NewListings from "../../components/properties/newListings";
import AgentProfileCard from "../../components/dashboard/viewer/agentProfileCard";
import AppointmentActions from "../../components/dashboard/viewer/appointmentActions";
import PropertyCardMini from "../../components/dashboard/viewer/propertyCardMini";
import UpcomingViewingCard from "../../components/dashboard/viewer/upcomingViewingCard";
import ViewingDetailsCard from "../../components/dashboard/viewer/viewingDetailsCard";
import ViewingRequestCard from "../../components/dashboard/viewer/viewingRequestCard";
import ViewingTimeline from "../../components/dashboard/viewer/viewingTimeline";

import HotAreas from "../../components/dashboard/viewer/hotAreas";

import useDashboard from "../../hooks/useDashboard";

const ViewerDashboard = () => {
  const { loading, error, refreshDashboard } = useDashboard();

  if (loading) {
    return (
      <MainLayout>
        <div className="flex h-full items-center justify-center py-32">
          <p className="text-lg text-slate-400">
            Loading Viewer Dashboard...
          </p>
        </div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout>
        <div
          className="
            rounded-3xl
            border
            border-red-900
            bg-red-950/30
            p-8
          "
        >
          <h2 className="text-2xl font-bold text-red-400">
            Dashboard Error
          </h2>
          <p className="mt-3 text-slate-300">{error}</p>
          <button
            onClick={refreshDashboard}
            className="
              mt-6
              rounded-xl
              bg-red-500
              px-5
              py-3
              font-semibold
              text-white
              hover:bg-red-400
            "
          >
            Retry
          </button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-10">
        {/* ============================================
            HEADER
        ============================================ */}
        <DashboardHeader
          title="Viewer Dashboard"
          subtitle="Business monitoring and CRM insights."
          onRefresh={refreshDashboard}
        />

        {/* ============================================
            PROPERTY OVERVIEW
        ============================================ */}
        <PropertyOverview />

        {/* ============================================
            FEATURED & RECOMMENDED PROPERTIES
        ============================================ */}
        <div className="grid gap-8 xl:grid-cols-2">
          <FeaturedProperties />
          <RecommendedProperties />
        </div>

        {/* ============================================
            SAVED PROPERTIES & VIEWINGS
        ============================================ */}
        <div className="grid gap-8 xl:grid-cols-2">
          <SavedProperties />
          <ViewingAppointments />
        </div>

        {/* ============================================
            CONVERSATION WORKSPACE
        ============================================ */}
        <div className="grid gap-8 xl:grid-cols-2">
          <RecentConversations />
          <AgentMessages />
        </div>

        {/* ============================================
            MARKET OVERVIEW
        ============================================ */}
        <div className="grid gap-8 xl:grid-cols-2">
          <AvailableProperties />
          <NewListings />
        </div>

        {/* ============================================
            HOT AREAS
        ============================================ */}
        <HotAreas />

        {/* ============================================
            READ-ONLY REPORTING
        ============================================ */}
        <PipelineOverview />

        <div className="grid gap-8 xl:grid-cols-2">
          <LatestLeads />
          <LatestConversations />
        </div>

        <RecentFollowUps />
      </div>
    </MainLayout>
  );
};

export default ViewerDashboard;
