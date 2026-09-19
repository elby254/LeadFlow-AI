/**
 *
 * Daily CRM workspace for sales agents.
 *
 * Focus:
 * • Today's work
 * • Assigned leads
 * • Conversations
 * • Property recommendations
 * • Quick actions
 *
 * ==========================================================
 */

import MainLayout from "../../components/layout/mainLayout";

import DashboardHeader from "../../components/dashboard/agent/dashboardHeader";
import TodayWork from "../../components/dashboard/agent/todaysWork";
import MyPipeline from "../../components/lead/myPipeline";
import NewAssignedLeads from "../../components/lead/newAssignedLeads";
import RecentConversationsWidget from "../../components/dashboard/agent/conversationWorkspace/recentConversationsWidget";
import ActiveConversations from "../../components/dashboard/agent/conversationWorkspace/activeConversations";
import UnreadMessages from "../../components/dashboard/agent/conversationWorkspace/unreadMessages";
import FollowUpQueue from "../../components/dashboard/agent/followUpQueue";
import KPICards from "../../components/dashboard/agent/KPICards";
import MyLeadPipeline from "../../components/dashboard/agent/myLeadPipeline";
import MyPerformance from "../../components/dashboard/agent/myPerfomance";
import OfflineSyncStatus from "../../components/dashboard/agent/offlineSyncStatus";
import RecommendedProperties from "../../components/dashboard/agent/propertyRecommendations";

import PropertyMatches from "../../components/properties/propertyMatches";
import QuickActions from "../../components/dashboard/agent/quickActions";
import ScheduleOverview from "../../components/dashboard/agent/scheduleOverview";
import TodaysFollowUps from "../../components/dashboard/agent/todayFollowUps";
import LeadSummaryCard from "../../components/dashboard/agent/leadSummaryCard";
import PropertyAvailabiltyPanel from "../../components/dashboard/agent/propertyAvailabilityPanel";
import PropertyRecommendationPanel from "../../components/dashboard/agent/propertyRecommendationPanel";
import QualificationPanel from "../../components/dashboard/agent/qualificationPanel";
import QuickReplyTemplates from "../../components/dashboard/agent/quickReplyTemplates";
import ViewingApprovalModal from "../../components/dashboard/agent/viewingApprovalModal";
import ViewingCalendar from "../../components/dashboard/agent/viewingCalendar";
import ViewingFeedbackPanel from "../../components/dashboard/agent/viewingFeedbackPanel";
import ViewingRequestsPanel from "../../components/dashboard/agent/viewingRequestsPanel";

import useDashboard from "../../hooks/useDashboard";

const AgentDashboard = () => {
  const { loading, error, summary, refreshDashboard } = useDashboard();

  if (error) {
    return (
      <MainLayout>
        <div className="flex h-full items-center justify-center">
          <p className="text-red-400">{error}</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-8">
        {/* ================= HEADER ================= */}
        <DashboardHeader
          title="Agent Dashboard"
          subtitle="Everything you need to move today's customers closer to a sale."
          onRefresh={refreshDashboard}
        />

        {/* ================= TODAY'S WORK ================= */}
        <TodayWork />

        {/* ================= MY PIPELINE ================= */}
        <MyPipeline summary={summary} />

        {/* ================= NEW ASSIGNED LEADS ================= */}
        <NewAssignedLeads />

        {/* ================= RECENT CONVERSATIONS ================= */}
        <RecentConversationsWidget />

        {/* ================= PROPERTY MATCHES ================= */}
        <PropertyMatches />

        {/* ================= QUICK ACTIONS ================= */}
        <QuickActions />
      </div>
    </MainLayout>
  );
};

export default AgentDashboard;
