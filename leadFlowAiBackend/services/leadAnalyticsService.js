/**
 * ==========================================================
 *
 * PURPOSE
 * ----------------------------------------------------------
 * Central analytics service for the LeadFlow AI agent workflow.
 *
 * RESPONSIBILITIES
 * ----------------------------------------------------------
 * - Compute organization-level CRM KPIs
 * - Track agent workload and performance
 * - Track lead pipeline stages
 * - Measure hot-lead activity
 * - Measure assignment performance
 * - Measure AI scoring effectiveness
 * - Support multi-tenant organization isolation
 *
 * ==========================================================
 *
 * LEAD STATUS SOURCE OF TRUTH
 * ----------------------------------------------------------
 *
 * This service uses the existing Lead.status enum:
 *
 *   new
 *   contacted
 *   qualified
 *   viewing
 *   negotiation
 *   won
 *   lost
 *
 * IMPORTANT
 *
 * Those concepts are derived from the appropriate Lead
 * fields instead.
 *
 * HOT:
 *   score >= 70
 *
 * VIEWING REQUESTED:
 *   viewingStatus === "requested"
 *
 * VIEWING SCHEDULED:
 *   viewingStatus === "approved"
 *   viewingStatus === "scheduled"
 *   viewingStatus === "rescheduled"
 *
 * FOLLOW-UP:
 *   followUpStatus indicates follow-up is required/pending
 *
 * SUCCESSFUL CONVERSION:
 *   status === "won"
 *
 * LOST CONVERSION:
 *   status === "lost"
 *
 * ==========================================================
 */

import Lead from "../models/lead.js";

// ==========================================================
// STATUS DEFINITIONS
// ==========================================================
//
// These values MUST match the existing Lead.status enum.
//
// ==========================================================

const LEAD_STATUSES = {
  NEW: "new",
  CONTACTED: "contacted",
  QUALIFIED: "qualified",
  VIEWING: "viewing",
  NEGOTIATION: "negotiation",
  WON: "won",
  LOST: "lost",
};

// ==========================================================
// VIEWING STATUS DEFINITIONS
// ==========================================================
//
// These are Lead.viewingStatus values, NOT Lead.status values.
//
// ==========================================================

const VIEWING_STATUSES = {
  NONE: "none",
  REQUESTED: "requested",
  APPROVED: "approved",
  SCHEDULED: "scheduled",
  RESCHEDULED: "rescheduled",
  CANCELLED: "cancelled",
  COMPLETED: "completed",
};

// ==========================================================
// HELPER: SAFE PERCENTAGE
// ==========================================================
//
// Prevents division-by-zero and keeps all percentages
// consistently formatted.
//
// ==========================================================

const percentage = (
  numerator,
  denominator
) => {
  if (!denominator) {
    return 0;
  }

  return Number(
    ((numerator / denominator) * 100).toFixed(2)
  );
};

// ==========================================================
// HELPER: GET HOT LEADS
// ==========================================================
//
// A lead is considered hot when:
//
// - score >= 70
//
// HOT IS NOT A Lead.status VALUE.
//
// ==========================================================

const isHotLead = (lead) => {
  return (
    Number(
      lead?.score || 0
    ) >= 70
  );
};

// ==========================================================
// HELPER: VIEWING REQUESTED
// ==========================================================
//
// Viewing lifecycle belongs to Lead.viewingStatus.
//
// Lead.status remains "viewing".
//
// ==========================================================

const isViewingRequested = (lead) => {
  return (
    lead?.viewingStatus ===
    VIEWING_STATUSES.REQUESTED
  );
};

// ==========================================================
// HELPER: VIEWING SCHEDULED
// ==========================================================
//
// A scheduled viewing may be represented by:
//
// - approved
// - scheduled
// - rescheduled
//
// ==========================================================

const isViewingScheduled = (lead) => {
  return [
    VIEWING_STATUSES.APPROVED,
    VIEWING_STATUSES.SCHEDULED,
    VIEWING_STATUSES.RESCHEDULED,
  ].includes(
    lead?.viewingStatus
  );
};

// ==========================================================
// HELPER: VIEWING COMPLETED
// ==========================================================

const isViewingCompleted = (lead) => {
  return (
    lead?.viewingStatus ===
    VIEWING_STATUSES.COMPLETED
  );
};

// ==========================================================
// HELPER: FOLLOW-UP
// ==========================================================
//
// Follow-up is represented by the Lead follow-up fields,
// NOT Lead.status.
//
// ==========================================================

const isFollowUpLead = (lead) => {
  const followUpStatus =
    String(
      lead?.followUpStatus || ""
    ).toLowerCase();

  return [
    "pending",
    "required",
    "due",
    "scheduled",
  ].includes(
    followUpStatus
  );
};

// ==========================================================
// HELPER: SUCCESSFULLY CLOSED LEADS
// ==========================================================
//
// Successful conversion = status "won".
//
// ==========================================================

const isClosedLead = (lead) => {
  return (
    lead?.status ===
    LEAD_STATUSES.WON
  );
};

// ==========================================================
// HELPER: LOST LEADS
// ==========================================================
//
// Unsuccessful conversion = status "lost".
//
// ==========================================================

const isClosedLostLead = (lead) => {
  return (
    lead?.status ===
    LEAD_STATUSES.LOST
  );
};

// ==========================================================
// HELPER: ACTIVE LEADS
// ==========================================================
//
// Only "won" and "lost" are terminal Lead.status values.
//
// Everything else remains active in the CRM pipeline.
//
// ==========================================================

const isActiveLead = (lead) => {
  return (
    !isClosedLead(lead) &&
    !isClosedLostLead(lead)
  );
};

// ==========================================================
// ORGANIZATION DASHBOARD METRICS
// ==========================================================

/**
 * Get organization-wide CRM metrics.
 *
 * IMPORTANT
 * ----------------------------------------------------------
 * organizationId is mandatory to preserve multi-tenant
 * isolation.
 *
 * @param {ObjectId|string} organizationId
 *
 * @returns {Object|null}
 */

export const getOrganizationMetrics = async (
  organizationId
) => {
  try {
    if (!organizationId) {
      console.log(
        "⚠️ Analytics skipped: organizationId is missing."
      );

      return null;
    }

    // ======================================================
    // FETCH ORGANIZATION LEADS
    // ======================================================

    const leads = await Lead.find({
      organizationId,
    });

    const totalLeads =
      leads.length;

    // ======================================================
    // PIPELINE COUNTS
    // ======================================================

    const newLeads =
      leads.filter(
        (lead) =>
          lead.status ===
          LEAD_STATUSES.NEW
      ).length;

    const contactedLeads =
      leads.filter(
        (lead) =>
          lead.status ===
          LEAD_STATUSES.CONTACTED
      ).length;

    const qualifiedLeads =
      leads.filter(
        (lead) =>
          lead.status ===
          LEAD_STATUSES.QUALIFIED
      ).length;

    const viewingLeads =
      leads.filter(
        (lead) =>
          lead.status ===
          LEAD_STATUSES.VIEWING
      ).length;

    const negotiationLeads =
      leads.filter(
        (lead) =>
          lead.status ===
          LEAD_STATUSES.NEGOTIATION
      ).length;

    const wonLeads =
      leads.filter(
        isClosedLead
      ).length;

    const lostLeads =
      leads.filter(
        isClosedLostLead
      ).length;

    // ======================================================
    // HOT LEADS
    // ======================================================

    const hotLeads =
      leads.filter(
        isHotLead
      ).length;

    // ======================================================
    // VIEWING METRICS
    // ======================================================

    const viewingRequested =
      leads.filter(
        isViewingRequested
      ).length;

    const viewingScheduled =
      leads.filter(
        isViewingScheduled
      ).length;

    const viewingCompleted =
      leads.filter(
        isViewingCompleted
      ).length;

    // ======================================================
    // FOLLOW-UP METRICS
    // ======================================================

    const followUpLeads =
      leads.filter(
        isFollowUpLead
      ).length;

    // ======================================================
    // ASSIGNMENT METRICS
    // ======================================================

    const assignedLeads =
      leads.filter(
        (lead) =>
          Boolean(
            lead.assignedTo
          )
      ).length;

    const unassignedLeads =
      leads.filter(
        (lead) =>
          !lead.assignedTo
      ).length;

    // ======================================================
    // ASSIGNMENT SOURCES
    // ======================================================

    const aiAssignedLeads =
      leads.filter(
        (lead) =>
          lead.assignedSource ===
          "ai"
      ).length;

    const manualAssignedLeads =
      leads.filter(
        (lead) =>
          lead.assignedSource ===
          "manual"
      ).length;

    const autoAssignedLeads =
      leads.filter(
        (lead) =>
          lead.assignedSource ===
          "auto"
      ).length;

    // ======================================================
    // ACTIVE PIPELINE
    // ======================================================

    const activeLeads =
      leads.filter(
        isActiveLead
      ).length;

    // ======================================================
    // CONVERSION METRICS
    // ======================================================

    const conversionRate =
      percentage(
        wonLeads,
        totalLeads
      );

    const activeToClosedRate =
      percentage(
        wonLeads,
        activeLeads + wonLeads
      );

    const lossRate =
      percentage(
        lostLeads,
        totalLeads
      );

    // ======================================================
    // HOT LEAD RATIO
    // ======================================================

    const hotLeadRatio =
      percentage(
        hotLeads,
        totalLeads
      );

    // ======================================================
    // ASSIGNMENT RATE
    // ======================================================

    const assignmentRate =
      percentage(
        assignedLeads,
        totalLeads
      );

    // ======================================================
    // RESPONSE OBJECT
    // ======================================================

    return {
      // ----------------------------------------------------
      // TOTAL
      // ----------------------------------------------------

      totalLeads,

      activeLeads,

      // ----------------------------------------------------
      // PIPELINE
      // ----------------------------------------------------

      newLeads,

      contactedLeads,

      qualifiedLeads,

      viewingLeads,

      negotiationLeads,

      wonLeads,

      lostLeads,

      // ----------------------------------------------------
      // HOT LEADS
      // ----------------------------------------------------

      hotLeads,

      // ----------------------------------------------------
      // VIEWINGS
      // ----------------------------------------------------

      viewingRequested,

      viewingScheduled,

      viewingCompleted,

      // ----------------------------------------------------
      // FOLLOW-UP
      // ----------------------------------------------------

      followUpLeads,

      // ----------------------------------------------------
      // ASSIGNMENT
      // ----------------------------------------------------

      assignedLeads,

      unassignedLeads,

      assignmentRate,

      aiAssignedLeads,

      manualAssignedLeads,

      autoAssignedLeads,

      // ----------------------------------------------------
      // CONVERSION
      // ----------------------------------------------------

      conversionRate,

      activeToClosedRate,

      lossRate,

      hotLeadRatio,
    };

  } catch (error) {
    console.error(
      "❌ Organization analytics error:",
      error
    );

    return null;
  }
};

// ==========================================================
// AGENT PERFORMANCE ANALYTICS
// ==========================================================

/**
 * Get CRM performance for one agent.
 *
 * The query intentionally uses assignedTo so agents are
 * measured only against leads actually assigned to them.
 *
 * @param {ObjectId|string} agentId
 *
 * @returns {Object|null}
 */

export const getAgentPerformance = async (
  agentId
) => {
  try {
    if (!agentId) {
      console.log(
        "⚠️ Agent analytics skipped: agentId is missing."
      );

      return null;
    }

    // ======================================================
    // GET ASSIGNED LEADS
    // ======================================================

    const leads = await Lead.find({
      assignedTo: agentId,
    });

    const totalAssigned =
      leads.length;

    // ======================================================
    // PIPELINE COUNTS
    // ======================================================

    const activeLeads =
      leads.filter(
        isActiveLead
      ).length;

    const newLeads =
      leads.filter(
        (lead) =>
          lead.status ===
          LEAD_STATUSES.NEW
      ).length;

    const contactedLeads =
      leads.filter(
        (lead) =>
          lead.status ===
          LEAD_STATUSES.CONTACTED
      ).length;

    const qualifiedLeads =
      leads.filter(
        (lead) =>
          lead.status ===
          LEAD_STATUSES.QUALIFIED
      ).length;

    const viewingLeads =
      leads.filter(
        (lead) =>
          lead.status ===
          LEAD_STATUSES.VIEWING
      ).length;

    const negotiationLeads =
      leads.filter(
        (lead) =>
          lead.status ===
          LEAD_STATUSES.NEGOTIATION
      ).length;

    const wonLeads =
      leads.filter(
        isClosedLead
      ).length;

    const lostLeads =
      leads.filter(
        isClosedLostLead
      ).length;

    // ======================================================
    // HOT LEADS
    // ======================================================

    const hotLeads =
      leads.filter(
        isHotLead
      ).length;

    // ======================================================
    // VIEWING METRICS
    // ======================================================

    const viewingRequested =
      leads.filter(
        isViewingRequested
      ).length;

    const viewingScheduled =
      leads.filter(
        isViewingScheduled
      ).length;

    const viewingCompleted =
      leads.filter(
        isViewingCompleted
      ).length;

    // ======================================================
    // FOLLOW-UP
    // ======================================================

    const followUpLeads =
      leads.filter(
        isFollowUpLead
      ).length;

    // ======================================================
    // PERFORMANCE
    // ======================================================

    const successRate =
      percentage(
        wonLeads,
        totalAssigned
      );

    const activeConversionRate =
      percentage(
        wonLeads,
        activeLeads + wonLeads
      );

    const hotLeadRatio =
      percentage(
        hotLeads,
        totalAssigned
      );

    // ======================================================
    // ASSIGNMENT SOURCE BREAKDOWN
    // ======================================================

    const aiAssigned =
      leads.filter(
        (lead) =>
          lead.assignedSource ===
          "ai"
      ).length;

    const manualAssigned =
      leads.filter(
        (lead) =>
          lead.assignedSource ===
          "manual"
      ).length;

    const autoAssigned =
      leads.filter(
        (lead) =>
          lead.assignedSource ===
          "auto"
      ).length;

    // ======================================================
    // RETURN
    // ======================================================

    return {
      agentId,

      totalAssigned,

      activeLeads,

      // ----------------------------------------------------
      // PIPELINE
      // ----------------------------------------------------

      newLeads,

      contactedLeads,

      qualifiedLeads,

      viewingLeads,

      negotiationLeads,

      wonLeads,

      lostLeads,

      // ----------------------------------------------------
      // HOT
      // ----------------------------------------------------

      hotLeads,

      // ----------------------------------------------------
      // VIEWINGS
      // ----------------------------------------------------

      viewingRequested,

      viewingScheduled,

      viewingCompleted,

      // ----------------------------------------------------
      // FOLLOW-UP
      // ----------------------------------------------------

      followUpLeads,

      // ----------------------------------------------------
      // PERFORMANCE
      // ----------------------------------------------------

      successRate,

      activeConversionRate,

      hotLeadRatio,

      // ----------------------------------------------------
      // ASSIGNMENT SOURCE
      // ----------------------------------------------------

      aiAssigned,

      manualAssigned,

      autoAssigned,
    };

  } catch (error) {
    console.error(
      "❌ Agent analytics error:",
      error
    );

    return null;
  }
};

// ==========================================================
// AI EFFECTIVENESS SCORE
// ==========================================================

/**
 * Measure how effectively AI is contributing to lead
 * qualification and routing.
 *
 * Metrics:
 * ----------------------------------------------------------
 * - leads with an AI score
 * - leads without an AI score
 * - scoring coverage
 * - hot leads generated from scored leads
 * - AI assignment count
 *
 * @param {ObjectId|string} organizationId
 *
 * @returns {Object|null}
 */

export const getAIEffectiveness = async (
  organizationId
) => {
  try {
    if (!organizationId) {
      console.log(
        "⚠️ AI analytics skipped: organizationId is missing."
      );

      return null;
    }

    // ======================================================
    // GET ORGANIZATION LEADS
    // ======================================================

    const leads = await Lead.find({
      organizationId,
    });

    const totalLeads =
      leads.length;

    // ======================================================
    // SCORED LEADS
    // ======================================================

    const scoredLeads =
      leads.filter(
        (lead) =>
          Number(
            lead.score || 0
          ) > 0
      ).length;

    const unscoredLeads =
      totalLeads -
      scoredLeads;

    // ======================================================
    // SCORE COVERAGE
    // ======================================================

    const scoringCoverage =
      percentage(
        scoredLeads,
        totalLeads
      );

    // ======================================================
    // AI-ASSIGNED LEADS
    // ======================================================

    const aiAssignedLeads =
      leads.filter(
        (lead) =>
          lead.assignedSource ===
          "ai"
      ).length;

    // ======================================================
    // AI HOT LEADS
    // ======================================================

    const aiHotLeads =
      leads.filter(
        (lead) =>
          Number(
            lead.score || 0
          ) >= 70
      ).length;

    // ======================================================
    // HIGH-VALUE LEADS
    // ======================================================

    const highValueLeads =
      leads.filter(
        (lead) =>
          Number(
            lead.score || 0
          ) >= 80
      ).length;

    // ======================================================
    // AVERAGE AI SCORE
    // ======================================================

    const totalScore =
      leads.reduce(
        (sum, lead) =>
          sum +
          Number(
            lead.score || 0
          ),
        0
      );

    const averageScore =
      scoredLeads
        ? Number(
            (
              totalScore /
              scoredLeads
            ).toFixed(2)
          )
        : 0;

    // ======================================================
    // AI CONVERSION
    // ======================================================

    const scoredLeadDocuments =
      leads.filter(
        (lead) =>
          Number(
            lead.score || 0
          ) > 0
      );

    const scoredAndClosed =
      scoredLeadDocuments.filter(
        isClosedLead
      ).length;

    const aiScoredConversionRate =
      percentage(
        scoredAndClosed,
        scoredLeads
      );

    // ======================================================
    // RETURN
    // ======================================================

    return {
      totalLeads,

      scoredLeads,

      unscoredLeads,

      scoringCoverage,

      aiAssignedLeads,

      aiHotLeads,

      highValueLeads,

      averageScore,

      scoredAndClosed,

      aiScoredConversionRate,
    };

  } catch (error) {
    console.error(
      "❌ AI analytics error:",
      error
    );

    return null;
  }
};

// ==========================================================
// ORGANIZATION PIPELINE BREAKDOWN
// ==========================================================

/**
 * Returns a clean pipeline object for dashboard charts.
 *
 * IMPORTANT
 * ----------------------------------------------------------
 * Keys such as "viewing_requested", "viewing_scheduled",
 * and "follow_up" are ANALYTICS CATEGORIES.
 *
 * They are NOT written into Lead.status.
 *
 * This allows the dashboard to preserve a useful sales
 * workflow without violating the Lead schema enum.
 */

export const getOrganizationPipeline = async (
  organizationId
) => {
  try {
    if (!organizationId) {
      return null;
    }

    const leads = await Lead.find({
      organizationId,
    });

    return {
      // ----------------------------------------------------
      // REAL Lead.status VALUES
      // ----------------------------------------------------

      new:
        leads.filter(
          (lead) =>
            lead.status ===
            LEAD_STATUSES.NEW
        ).length,

      contacted:
        leads.filter(
          (lead) =>
            lead.status ===
            LEAD_STATUSES.CONTACTED
        ).length,

      qualified:
        leads.filter(
          (lead) =>
            lead.status ===
            LEAD_STATUSES.QUALIFIED
        ).length,

      viewing:
        leads.filter(
          (lead) =>
            lead.status ===
            LEAD_STATUSES.VIEWING
        ).length,

      negotiation:
        leads.filter(
          (lead) =>
            lead.status ===
            LEAD_STATUSES.NEGOTIATION
        ).length,

      won:
        leads.filter(
          isClosedLead
        ).length,

      lost:
        leads.filter(
          isClosedLostLead
        ).length,

      // ----------------------------------------------------
      // DERIVED WORKFLOW CATEGORIES
      // ----------------------------------------------------

      hot:
        leads.filter(
          isHotLead
        ).length,

      viewing_requested:
        leads.filter(
          isViewingRequested
        ).length,

      viewing_scheduled:
        leads.filter(
          isViewingScheduled
        ).length,

      viewing_completed:
        leads.filter(
          isViewingCompleted
        ).length,

      follow_up:
        leads.filter(
          isFollowUpLead
        ).length,
    };

  } catch (error) {
    console.error(
      "❌ Pipeline analytics error:",
      error
    );

    return null;
  }
};

// ==========================================================
// AGENT WORKLOAD ANALYTICS
// ==========================================================

/**
 * Returns the current workload of an agent.
 *
 * This works from actual Lead documents rather than trusting
 * only User.assignedLeadCount, making it useful for validating
 * the assignment engine.
 */

export const getAgentWorkload = async (
  agentId
) => {
  try {
    if (!agentId) {
      return null;
    }

    const leads = await Lead.find({
      assignedTo: agentId,
    });

    const activeLeads =
      leads.filter(
        isActiveLead
      ).length;

    const wonLeads =
      leads.filter(
        isClosedLead
      ).length;

    const lostLeads =
      leads.filter(
        isClosedLostLead
      ).length;

    const hotLeads =
      leads.filter(
        isHotLead
      ).length;

    const viewingLeads =
      leads.filter(
        (lead) =>
          lead.status ===
          LEAD_STATUSES.VIEWING
      ).length;

    const negotiationLeads =
      leads.filter(
        (lead) =>
          lead.status ===
          LEAD_STATUSES.NEGOTIATION
      ).length;

    const followUpLeads =
      leads.filter(
        isFollowUpLead
      ).length;

    return {
      agentId,

      totalAssigned:
        leads.length,

      activeLeads,

      hotLeads,

      viewingLeads,

      negotiationLeads,

      followUpLeads,

      wonLeads,

      lostLeads,
    };

  } catch (error) {
    console.error(
      "❌ Agent workload analytics error:",
      error
    );

    return null;
  }
};

// ==========================================================
// DEFAULT EXPORT
// ==========================================================

export default {
  getOrganizationMetrics,

  getAgentPerformance,

  getAIEffectiveness,

  getOrganizationPipeline,

  getAgentWorkload,
};