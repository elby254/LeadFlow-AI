import MainLayout from "../../components/layout/mainlayout";

import DashboardHeader from "../../components/dashboard/admin/dashboardHeader";
import KPICards from "../../components/dashboard/admin/KPICards";
import DashboardCharts from "../../components/dashboard/admin/dashboardCharts";
import AIAnalytics from "../../components/dashboard/admin/aiAnalytics";
import AgentLeaderboard from "../../components/dashboard/admin/agentLeaderboard";

import RecentConversations from "../../components/dashboard/admin/conversationOversight.jsx/recentConversationsWidget";
import aiFlaggedConversations from "../../components/dashboard/admin/conversationOversight.jsx/aiFlaggedConversations";

import LeadPipelineOverview from "../../components/dashboard/admin/leadPipelineOverview";
import PropertyInventoryOverview from "../../components/dashboard/admin/propertyInventoryOverview";
import FollowUpOversight from "../../components/dashboard/admin/followUpOversight";
import QuickActions from "../../components/dashboard/admin/quickActions";
import BusinessSnapshot from "../../components/dashboard/admin/businessSnapshots";
import CompliancePanel from "../../components/dashboard/admin/compliancePanel";
import ConversationAnalytics from "../../components/dashboard/admin/conversationAnalytics";
import EscalationPanel from "../../components/dashboard/admin/escalationPanel";
import PropertyAnalytics from "../../components/dashboard/admin/propertyAnalytics";
import PropertyManagementPanel from "../../components/dashboard/admin/propertyManagementPanel";
import PropertyPerformanceTable from "../../components/dashboard/admin/propertyPerfomanceTable";
import ViewingAnalytics from "../../components/dashboard/admin/viewingAnalytics";
import ViewingManagementPanel from "../../components/dashboard/admin/viewingManagementPanel";
import ViewingPerformanceTable from "../../components/dashboard/admin/viewingPerformanceTable";
import AgencyAlerts from "../../components/dashboard/admin/AgencyAlerts";

import useAdminDashboard from "../../hooks/useAdminDashboard";

export default function AdminDashboard() {
  const { loading, error, refreshDashboard } = useAdminDashboard();

  return (
    <MainLayout>
      <div className="space-y-10">
        {/* =========================================
            HEADER
        ========================================= */}
        <DashboardHeader
          title="Admin Workspace"
          subtitle="Monitor agency performance, AI operations and team productivity."
          onRefresh={refreshDashboard}
        />

        {/* =========================================
            TODAY AT A GLANCE
        ========================================= */}
        <section className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-white">Today at a Glance</h2>
            <p className="mt-2 text-slate-400">Agency performance today.</p>
          </div>
          <KPICards />
        </section>

        {/* =========================================
            AI BUSINESS INTELLIGENCE
        ========================================= */}
        <section className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-white">
              AI Business Intelligence
            </h2>
            <p className="mt-2 text-slate-400">
              AI qualification trends and market insights.
            </p>
          </div>
          <DashboardCharts />
          <AIAnalytics />
        </section>

        {/* =========================================
            LEAD PIPELINE OVERVIEW
        ========================================= */}
        <section className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-white">
              Lead Pipeline Overview
            </h2>
            <p className="mt-2 text-slate-400">VIEW LEADS.</p>
          </div>
          <LeadPipelineOverview />
        </section>

        {/* =========================================
            PROPERTY INVENTORY OVERVIEW
        ========================================= */}
        <section className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-white">
              Property Inventory Overview
            </h2>
            <p className="mt-2 text-slate-400">VIEW PROPERTIES.</p>
          </div>
          <PropertyInventoryOverview />
        </section>

        {/* =========================================
            CONVERSATION OVERSIGHT
        ========================================= */}
        <section className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-white">
              Recent Conversations
            </h2>
            <p className="mt-2 text-slate-400">VIEW CONVERSATIONS WIDGET.</p>
          </div>
          <RecentConversations />
        </section>

        {/* =========================================
            FOLLOW-UP OVERSIGHT
        ========================================= */}
        <section className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-white">
              Follow-Up Oversight
            </h2>
            <p className="mt-2 text-slate-400">VIEW FOLLOW-UPS.</p>
          </div>
          <FollowUpOversight />
        </section>

        {/* =========================================
            AGENT PERFORMANCE
        ========================================= */}
        <section className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-white">Agent Performance</h2>
            <p className="mt-2 text-slate-400">
              Track agent productivity and conversions.
            </p>
          </div>
          <AgentLeaderboard />
        </section>
      </div>
    </MainLayout>
  );
}
