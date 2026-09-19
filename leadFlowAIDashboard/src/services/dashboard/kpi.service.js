/**
 * ============================================================
 *
 * PURPOSE
 * ------------------------------------------------------------
 * Calculates dashboard KPI cards for the Admin Dashboard.
 *
 * USED BY
 * ------------------------------------------------------------
 * - AdminDashboardController
 * - Admin Dashboard
 * - Dashboard KPI components
 *
 * ORGANIZATION SAFETY
 * ------------------------------------------------------------
 * All calculations are restricted to the supplied
 * organizationId.
 *
 * CURRENT LEAD LIFECYCLE
 * ------------------------------------------------------------
 * new
 * qualified
 * hot
 * follow_up
 * viewing_scheduled
 * closed
 *
 * CURRENT AI QUALIFICATION RULES
 * ------------------------------------------------------------
 * Hot        : score >= 70
 * Qualified  : score >= 50 && score < 70
 * New/Cold   : score < 50
 *
 * ============================================================
 */

import Lead from "../../models/lead.js";

// ============================================================
// DASHBOARD KPI CALCULATION
// ============================================================

/**
 * Calculate Admin Dashboard KPIs.
 *
 * @param {String|ObjectId} organizationId
 * @returns {Object} Dashboard KPI metrics
 */
export const getDashboardKPIs = async (
  organizationId
) => {
  try {
    // ========================================================
    // VALIDATE ORGANIZATION
    // ========================================================

    if (!organizationId) {
      console.warn(
        "⚠️ Dashboard KPI calculation skipped: organizationId is missing."
      );

      return {
        totalLeads: 0,
        newLeads: 0,
        qualifiedLeads: 0,
        hotLeads: 0,
        followUps: 0,
        scheduledViewings: 0,
        closedLeads: 0,
        activeLeads: 0,
        averageLeadScore: 0,
        conversionRate: 0,
      };
    }

    // ========================================================
    // FETCH ORGANIZATION LEADS
    // ========================================================
    //
    // Only fields required by the KPI engine are selected.
    //
    // This keeps the dashboard query lightweight.
    //
    // ========================================================

    const leads = await Lead.find({
      organizationId,
    }).select("status score");

    // ========================================================
    // TOTAL LEADS
    // ========================================================

    const totalLeads = leads.length;

    // ========================================================
    // LEAD LIFECYCLE COUNTS
    // ========================================================

    const newLeads = leads.filter(
      (lead) =>
        lead.status === "new"
    ).length;

    const qualifiedLeads = leads.filter(
      (lead) =>
        lead.status === "qualified"
    ).length;

    const hotLeads = leads.filter(
      (lead) =>
        lead.status === "hot"
    ).length;

    const followUps = leads.filter(
      (lead) =>
        lead.status === "follow_up"
    ).length;

    const scheduledViewings =
      leads.filter(
        (lead) =>
          lead.status ===
          "viewing_scheduled"
      ).length;

    const closedLeads = leads.filter(
      (lead) =>
        lead.status === "closed"
    ).length;

    // ========================================================
    // ACTIVE LEADS
    // ========================================================
    //
    // Any lead that has not reached the closed stage is
    // considered active.
    //
    // ========================================================

    const activeLeads = leads.filter(
      (lead) =>
        lead.status !== "closed"
    ).length;

    // ========================================================
    // AVERAGE LEAD SCORE
    // ========================================================

    const totalScore = leads.reduce(
      (sum, lead) => {
        const score =
          Number(lead.score) || 0;

        return sum + score;
      },
      0
    );

    const averageLeadScore =
      totalLeads === 0
        ? 0
        : Number(
            (
              totalScore /
              totalLeads
            ).toFixed(1)
          );

    // ========================================================
    // CONVERSION RATE
    // ========================================================
    //
    // Conversion =
    //
    // Closed Leads / Total Leads × 100
    //
    // ========================================================

    const conversionRate =
      totalLeads === 0
        ? 0
        : Number(
            (
              (closedLeads /
                totalLeads) *
              100
            ).toFixed(1)
          );

    // ========================================================
    // RETURN KPI OBJECT
    // ========================================================

    return {
      totalLeads,

      newLeads,

      qualifiedLeads,

      hotLeads,

      followUps,

      scheduledViewings,

      closedLeads,

      activeLeads,

      averageLeadScore,

      conversionRate,
    };
  } catch (error) {
    // ========================================================
    // ERROR HANDLING
    // ========================================================

    console.error(
      "❌ Dashboard KPI service error:",
      error
    );

    return {
      totalLeads: 0,
      newLeads: 0,
      qualifiedLeads: 0,
      hotLeads: 0,
      followUps: 0,
      scheduledViewings: 0,
      closedLeads: 0,
      activeLeads: 0,
      averageLeadScore: 0,
      conversionRate: 0,
    };
  }
};

// ============================================================
// DEFAULT EXPORT
// ============================================================

export default {
  getDashboardKPIs,
};