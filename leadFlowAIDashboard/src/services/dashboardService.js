/**
 * ==========================================================
 *
 * PURPOSE
 * ----------------------------------------------------------
 * Acts as the API bridge between frontend dashboard
 * components and the LeadFlow AI backend.
 *
 * WORKFLOW
 * ----------------------------------------------------------
 * 1. Fetch dashboard KPI summary
 * 2. Fetch lead pipeline distribution
 * 3. Fetch recent activity
 *
 * IMPORTANT
 * ----------------------------------------------------------
 * - Uses the centralized axiosClient.
 * - Keeps frontend response handling defensive.
 * - Never allows a failed dashboard request to crash
 *   the dashboard UI.
 * - Backend organization isolation is handled by the
 *   authenticated API request / backend.
 *
 * ==========================================================
 */

import axios from "../api/axiosClient";

// ==========================================================
// GET DASHBOARD SUMMARY
// ==========================================================
//
// Returns high-level dashboard KPIs:
//
// - Total leads
// - New leads
// - Qualified leads
// - Hot leads
// - Closed leads
// - Conversion rate
// - Hot lead ratio
//
// ==========================================================

export const getDashboardSummary = async () => {
  try {
    const response = await axios.get(
      "/dashboard/summary"
    );

    const data = response?.data?.data;

    if (!data || typeof data !== "object") {
      return {
        totalLeads: 0,
        newLeads: 0,
        qualifiedLeads: 0,
        hotLeads: 0,
        closedLeads: 0,
        conversionRate: 0,
        hotLeadRatio: 0,
      };
    }

    return {
      totalLeads: Number(data.totalLeads || 0),

      newLeads: Number(data.newLeads || 0),

      qualifiedLeads: Number(
        data.qualifiedLeads || 0
      ),

      hotLeads: Number(
        data.hotLeads || 0
      ),

      closedLeads: Number(
        data.closedLeads || 0
      ),

      conversionRate: Number(
        data.conversionRate || 0
      ),

      hotLeadRatio: Number(
        data.hotLeadRatio || 0
      ),
    };
  } catch (error) {
    console.error(
      "❌ Dashboard summary fetch error:",
      error
    );

    return {
      totalLeads: 0,
      newLeads: 0,
      qualifiedLeads: 0,
      hotLeads: 0,
      closedLeads: 0,
      conversionRate: 0,
      hotLeadRatio: 0,
    };
  }
};

// ==========================================================
// GET LEAD PIPELINE
// ==========================================================
//
// Converts the current lead lifecycle into dashboard
// pipeline stages.
//
// Expected backend stages:
//
// new
// qualified
// hot
// closed
//
// ==========================================================

export const getLeadPipeline = async () => {
  try {
    const response = await axios.get(
      "/dashboard/pipeline"
    );

    const data = response?.data?.data;

    if (!Array.isArray(data)) {
      return [];
    }

    return data;
  } catch (error) {
    console.error(
      "❌ Lead pipeline fetch error:",
      error
    );

    return [];
  }
};

// ==========================================================
// GET RECENT ACTIVITY
// ==========================================================
//
// Returns recent CRM activity.
//
// The service normalizes the response to:
//
// {
//   data: []
// }
//
// This prevents dashboard components from attempting to
// iterate over undefined values.
//
// ==========================================================

export const getRecentActivity = async () => {
  try {
    const response = await axios.get(
      "/dashboard/recent-activity"
    );

    const data = response?.data?.data;

    return {
      data: Array.isArray(data)
        ? data
        : [],
    };
  } catch (error) {
    console.error(
      "❌ Recent activity fetch error:",
      error
    );

    return {
      data: [],
    };
  }
};

// ==========================================================
// SERVICE EXPORT
// ==========================================================

const dashboardService = {
  getDashboardSummary,
  getLeadPipeline,
  getRecentActivity,
};

export default dashboardService;