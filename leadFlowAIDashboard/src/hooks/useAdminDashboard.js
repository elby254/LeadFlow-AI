import { useCallback, useEffect, useState } from "react";

import axiosClient from "../api/axiosClient";

/**
 *
 * Loads every metric required by the Admin Dashboard.
 *
 * Backend:
 * GET /api/admin/dashboard
 *
 * Returns:
 * --------
 * • kpis
 * • pipelineData
 * • sourceData
 * • qualificationData
 * • monthlyTrend
 * • aiAnalytics
 * • agentLeaderboard
 * • recentConversations
 *
 * Also exposes:
 * • loading
 * • error
 * • refreshDashboard()
 *
 * ==========================================================
 */

const emptyDashboard = {
  kpis: {
    totalLeads: 0,
    qualifiedLeads: 0,
    hotLeads: 0,
    closedLeads: 0,
    conversionRate: 0,
  },

  pipelineData: [],

  sourceData: [],

  qualificationData: [],

  monthlyTrend: [],

  aiAnalytics: {
    averageScore: 0,

    /**
     * Aggregate buying-intent score.
     *
     * IMPORTANT:
     * This is NOT the same as lead.intent.
     *
     * lead.intent:
     * • rent
     * • buy
     * • property_search
     *
     * averageBuyingIntent:
     * Aggregate analytics metric.
     */
    averageBuyingIntent: 0,

    urgentLeads: 0,

    averageBudgetConfidence: 0,

    averageLocationConfidence: 0,

    /**
     * Aggregate categorical transaction intent.
     *
     * Expected structure:
     *
     * {
     *   rent: 0,
     *   buy: 0,
     *   property_search: 0
     * }
     */
    intentDistribution: {
      rent: 0,
      buy: 0,
      property_search: 0,
    },
  },

  agentLeaderboard: [],

  recentConversations: [],
};

const useAdminDashboard = () => {
  const [dashboard, setDashboard] =
    useState(emptyDashboard);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  /**
   * ---------------------------------------
   * LOAD DASHBOARD
   * ---------------------------------------
   */

  const refreshDashboard = useCallback(async () => {
    try {
      setLoading(true);

      setError("");

      const response =
        await axiosClient.get(
          "/admin/dashboard"
        );

      const dashboardData =
        response.data?.data;

      /**
       * Preserve the complete dashboard structure
       * while ensuring the new intentDistribution
       * object always exists.
       */
      setDashboard({
        ...emptyDashboard,

        ...(dashboardData || {}),

        kpis: {
          ...emptyDashboard.kpis,
          ...(dashboardData?.kpis || {}),
        },

        aiAnalytics: {
          ...emptyDashboard.aiAnalytics,
          ...(dashboardData?.aiAnalytics || {}),

          intentDistribution: {
            ...emptyDashboard.aiAnalytics
              .intentDistribution,

            ...(dashboardData?.aiAnalytics
              ?.intentDistribution || {}),
          },
        },

        pipelineData:
          dashboardData?.pipelineData || [],

        sourceData:
          dashboardData?.sourceData || [],

        qualificationData:
          dashboardData?.qualificationData || [],

        monthlyTrend:
          dashboardData?.monthlyTrend || [],

        agentLeaderboard:
          dashboardData?.agentLeaderboard || [],

        recentConversations:
          dashboardData?.recentConversations || [],
      });
    } catch (err) {
      console.error(
        "Dashboard load failed:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Failed to load dashboard."
      );

      setDashboard(emptyDashboard);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * ---------------------------------------
   * INITIAL LOAD
   * ---------------------------------------
   */

  useEffect(() => {
    refreshDashboard();
  }, [refreshDashboard]);

  return {
    dashboard,

    loading,

    error,

    refreshDashboard,
  };
};

export default useAdminDashboard;