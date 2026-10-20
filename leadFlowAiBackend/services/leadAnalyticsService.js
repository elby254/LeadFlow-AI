/**
 * ==========================================================
 *
 * PURPOSE
 * ----------------------------------------------------------
 * Central analytics service for the LeadFlow AI CRM workflow.
 *
 * RESPONSIBILITIES
 * ----------------------------------------------------------
 * - Compute organization-level CRM KPIs
 * - Track agent workload and performance
 * - Track canonical lead pipeline stages
 * - Measure hot-lead activity
 * - Measure assignment performance
 * - Measure scoring effectiveness
 * - Measure viewing activity
 * - Measure follow-up activity
 * - Preserve multi-tenant organization isolation
 *
 * ==========================================================
 *
 * CANONICAL SOURCES OF TRUTH
 * ==========================================================
 *
 * Lead lifecycle:
 *
 *   services/leadLifeCycleService.js
 *
 * Lead score:
 *
 *   services/leadScoringRulesEngine.js
 *
 * Assignment:
 *
 *   Lead.assignedTo
 *   Lead.assignedSource
 *
 * Viewing workflow:
 *
 *   Viewing.status
 *
 * Follow-up workflow:
 *
 *   Lead.followUpStatus
 *
 * IMPORTANT
 * ----------------------------------------------------------
 *
 * "hot" is a SCORE CATEGORY.
 *
 * It is NOT a Lead.status.
 *
 * Canonical score categories:
 *
 *   0–49   -> new
 *   50–79  -> qualified
 *   80–100 -> hot
 *
 * ==========================================================
 */

import Lead from "../models/lead.js";
import Viewing from "../models/viewing.js";

import {
  LEAD_STATUS,
} from "./leadLifeCycleService.js";

import {
  HOT_SCORE_THRESHOLD,
  LEAD_SCORE_CATEGORIES,
  getLeadCategory,
} from "./leadScoringRulesEngine.js";

/* ==========================================================
   VIEWING STATUS DEFINITIONS
   SOURCE OF TRUTH: Viewing.status
========================================================== */

const VIEWING_STATUS = Object.freeze({
  REQUESTED:
    "Requested",

  PENDING_APPROVAL:
    "Pending Approval",

  APPROVED:
    "Approved",

  RESCHEDULED:
    "Rescheduled",

  REJECTED:
    "Rejected",

  CANCELLED:
    "Cancelled",

  COMPLETED:
    "Completed",
});

/* ==========================================================
   ACTIVE / SCHEDULED VIEWING STATUSES
========================================================== */

const ACTIVE_VIEWING_STATUSES = Object.freeze([
  VIEWING_STATUS.REQUESTED,

  VIEWING_STATUS.PENDING_APPROVAL,

  VIEWING_STATUS.APPROVED,

  VIEWING_STATUS.RESCHEDULED,
]);

const SCHEDULED_VIEWING_STATUSES = Object.freeze([
  VIEWING_STATUS.APPROVED,

  VIEWING_STATUS.RESCHEDULED,
]);

/* ==========================================================
   FOLLOW-UP STATUS DEFINITIONS
   SOURCE OF TRUTH: Lead.followUpStatus
========================================================== */

const FOLLOW_UP_STATUS = Object.freeze({
  PENDING:
    "pending",

  SCHEDULED:
    "scheduled",

  COMPLETED:
    "completed",

  CANCELLED:
    "cancelled",
});

/* ==========================================================
   HELPER: SAFE PERCENTAGE
========================================================== */

const percentage = (
  numerator,
  denominator
) => {
  if (!denominator) {
    return 0;
  }

  return Number(
    (
      (numerator /
        denominator) *
      100
    ).toFixed(2)
  );
};

/* ==========================================================
   HELPER: SAFE NUMBER
========================================================== */

const safeNumber = (
  value
) => {
  const number =
    Number(value);

  return Number.isFinite(
    number
  )
    ? number
    : 0;
};

/* ==========================================================
   HELPER: HOT LEAD
========================================================== */

/**
 * Hot is a score category.
 *
 * It is NOT a lifecycle state.
 *
 * The scoring threshold comes from the canonical
 * lead scoring rules engine.
 */
const isHotLead = (
  lead
) => {
  const score =
    safeNumber(
      lead?.score
    );

  return (
    score >=
    HOT_SCORE_THRESHOLD
  );
};

/* ==========================================================
   HELPER: FOLLOW-UP LEAD
========================================================== */

/**
 * Canonical follow-up statuses:
 *
 *   pending
 *   scheduled
 *   completed
 *   cancelled
 *
 * Only pending/scheduled represent active follow-up work.
 */
const isFollowUpLead = (
  lead
) => {
  return [
    FOLLOW_UP_STATUS.PENDING,

    FOLLOW_UP_STATUS.SCHEDULED,
  ].includes(
    String(
      lead?.followUpStatus ||
        ""
    ).toLowerCase()
  );
};

/* ==========================================================
   HELPER: WON LEAD
========================================================== */

const isWonLead = (
  lead
) => {
  return (
    lead?.status ===
    LEAD_STATUS.WON
  );
};

/* ==========================================================
   HELPER: LOST LEAD
========================================================== */

const isLostLead = (
  lead
) => {
  return (
    lead?.status ===
    LEAD_STATUS.LOST
  );
};

/* ==========================================================
   HELPER: ACTIVE LEAD
========================================================== */

/**
 * Only won and lost are terminal.
 *
 * Therefore:
 *
 *   new
 *   contacted
 *   qualified
 *   viewing
 *   negotiation
 *
 * are active CRM lifecycle states.
 */
const isActiveLead = (
  lead
) => {
  return (
    !isWonLead(lead) &&
    !isLostLead(lead)
  );
};

/* ==========================================================
   HELPER: VALID ORGANIZATION CONTEXT
========================================================== */

const hasOrganization =
  (
    organizationId
  ) =>
    Boolean(
      organizationId
    );

/* ==========================================================
   HELPER:
   GET VIEWING METRICS
========================================================== */

/**
 * Viewing workflow is stored in Viewing.status.
 *
 * These metrics therefore count actual Viewing documents,
 * not Lead.viewingStatus.
 */
const getViewingMetrics = (
  viewings
) => {
  const viewingRequested =
    viewings.filter(
      (viewing) =>
        [
          VIEWING_STATUS.REQUESTED,

          VIEWING_STATUS.PENDING_APPROVAL,
        ].includes(
          viewing.status
        )
    ).length;

  const viewingScheduled =
    viewings.filter(
      (viewing) =>
        SCHEDULED_VIEWING_STATUSES.includes(
          viewing.status
        )
    ).length;

  const viewingCompleted =
    viewings.filter(
      (viewing) =>
        viewing.status ===
        VIEWING_STATUS.COMPLETED
    ).length;

  return {
    viewingRequested,

    viewingScheduled,

    viewingCompleted,
  };
};

/* ==========================================================
   ORGANIZATION DASHBOARD METRICS
========================================================== */

/**
 * Get organization-wide CRM metrics.
 *
 * organizationId is mandatory.
 *
 * @param {ObjectId|string} organizationId
 *
 * @returns {Object|null}
 */
export const getOrganizationMetrics =
  async (
    organizationId
  ) => {
    try {
      if (
        !hasOrganization(
          organizationId
        )
      ) {
        console.log(
          "⚠️ Analytics skipped: organizationId is missing."
        );

        return null;
      }

      /* ====================================================
         FETCH ORGANIZATION LEADS
      ==================================================== */

      const leads =
        await Lead.find({
          organizationId,
        }).lean();

      const totalLeads =
        leads.length;

      /* ====================================================
         FETCH ORGANIZATION VIEWINGS
      ==================================================== */

      const viewings =
        await Viewing.find({
          organizationId,
        }).lean();

      /* ====================================================
         PIPELINE COUNTS
      ==================================================== */

      const newLeads =
        leads.filter(
          (lead) =>
            lead.status ===
            LEAD_STATUS.NEW
        ).length;

      const contactedLeads =
        leads.filter(
          (lead) =>
            lead.status ===
            LEAD_STATUS.CONTACTED
        ).length;

      const qualifiedLeads =
        leads.filter(
          (lead) =>
            lead.status ===
            LEAD_STATUS.QUALIFIED
        ).length;

      const viewingLeads =
        leads.filter(
          (lead) =>
            lead.status ===
            LEAD_STATUS.VIEWING
        ).length;

      const negotiationLeads =
        leads.filter(
          (lead) =>
            lead.status ===
            LEAD_STATUS.NEGOTIATION
        ).length;

      const wonLeads =
        leads.filter(
          isWonLead
        ).length;

      const lostLeads =
        leads.filter(
          isLostLead
        ).length;

      /* ====================================================
         HOT LEADS
      ==================================================== */

      const hotLeads =
        leads.filter(
          isHotLead
        ).length;

      /* ====================================================
         VIEWING METRICS
      ==================================================== */

      const {
        viewingRequested,

        viewingScheduled,

        viewingCompleted,
      } =
        getViewingMetrics(
          viewings
        );

      /* ====================================================
         FOLLOW-UP METRICS
      ==================================================== */

      const followUpLeads =
        leads.filter(
          isFollowUpLead
        ).length;

      /* ====================================================
         ASSIGNMENT METRICS
      ==================================================== */

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

      /* ====================================================
         ASSIGNMENT SOURCES
      ==================================================== */

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

      /* ====================================================
         ACTIVE PIPELINE
      ==================================================== */

      const activeLeads =
        leads.filter(
          isActiveLead
        ).length;

      /* ====================================================
         CONVERSION METRICS
      ==================================================== */

      const conversionRate =
        percentage(
          wonLeads,

          totalLeads
        );

      /**
       * This measures won leads among leads that are not
       * already lost.
       *
       * It is retained for dashboard compatibility.
       */
      const activeToClosedRate =
        percentage(
          wonLeads,

          activeLeads +
            wonLeads
        );

      const lossRate =
        percentage(
          lostLeads,

          totalLeads
        );

      /* ====================================================
         HOT LEAD RATIO
      ==================================================== */

      const hotLeadRatio =
        percentage(
          hotLeads,

          totalLeads
        );

      /* ====================================================
         ASSIGNMENT RATE
      ==================================================== */

      const assignmentRate =
        percentage(
          assignedLeads,

          totalLeads
        );

      /* ====================================================
         RETURN
      ==================================================== */

      return {
        /* --------------------------------------------------
           TOTAL
        -------------------------------------------------- */

        totalLeads,

        activeLeads,

        /* --------------------------------------------------
           PIPELINE
        -------------------------------------------------- */

        newLeads,

        contactedLeads,

        qualifiedLeads,

        viewingLeads,

        negotiationLeads,

        wonLeads,

        lostLeads,

        /* --------------------------------------------------
           HOT
        -------------------------------------------------- */

        hotLeads,

        /* --------------------------------------------------
           VIEWINGS
        -------------------------------------------------- */

        viewingRequested,

        viewingScheduled,

        viewingCompleted,

        /* --------------------------------------------------
           FOLLOW-UP
        -------------------------------------------------- */

        followUpLeads,

        /* --------------------------------------------------
           ASSIGNMENT
        -------------------------------------------------- */

        assignedLeads,

        unassignedLeads,

        assignmentRate,

        aiAssignedLeads,

        manualAssignedLeads,

        autoAssignedLeads,

        /* --------------------------------------------------
           CONVERSION
        -------------------------------------------------- */

        conversionRate,

        activeToClosedRate,

        lossRate,

        /* --------------------------------------------------
           SCORE CATEGORY
        -------------------------------------------------- */

        hotLeadRatio,

        hotScoreThreshold:
          HOT_SCORE_THRESHOLD,
      };
    } catch (error) {
      console.error(
        "❌ Organization analytics error:",
        error
      );

      return null;
    }
  };

/* ==========================================================
   AGENT PERFORMANCE ANALYTICS
========================================================== */

/**
 * Get CRM performance for one agent.
 *
 * organizationId is intentionally required.
 *
 * This prevents:
 *
 *   Lead.find({ assignedTo: agentId })
 *
 * from becoming a cross-tenant analytics query.
 *
 * @param {ObjectId|string} agentId
 * @param {ObjectId|string} organizationId
 *
 * @returns {Object|null}
 */
export const getAgentPerformance =
  async (
    agentId,

    organizationId
  ) => {
    try {
      if (!agentId) {
        console.log(
          "⚠️ Agent analytics skipped: agentId is missing."
        );

        return null;
      }

      if (
        !hasOrganization(
          organizationId
        )
      ) {
        console.log(
          "⚠️ Agent analytics skipped: organizationId is missing."
        );

        return null;
      }

      /* ====================================================
         GET ASSIGNED LEADS
      ==================================================== */

      const leads =
        await Lead.find({
          organizationId,

          assignedTo:
            agentId,
        }).lean();

      const totalAssigned =
        leads.length;

      /* ====================================================
         GET AGENT VIEWINGS
      ==================================================== */

      const viewings =
        await Viewing.find({
          organizationId,

          agent:
            agentId,
        }).lean();

      /* ====================================================
         PIPELINE COUNTS
      ==================================================== */

      const activeLeads =
        leads.filter(
          isActiveLead
        ).length;

      const newLeads =
        leads.filter(
          (lead) =>
            lead.status ===
            LEAD_STATUS.NEW
        ).length;

      const contactedLeads =
        leads.filter(
          (lead) =>
            lead.status ===
            LEAD_STATUS.CONTACTED
        ).length;

      const qualifiedLeads =
        leads.filter(
          (lead) =>
            lead.status ===
            LEAD_STATUS.QUALIFIED
        ).length;

      const viewingLeads =
        leads.filter(
          (lead) =>
            lead.status ===
            LEAD_STATUS.VIEWING
        ).length;

      const negotiationLeads =
        leads.filter(
          (lead) =>
            lead.status ===
            LEAD_STATUS.NEGOTIATION
        ).length;

      const wonLeads =
        leads.filter(
          isWonLead
        ).length;

      const lostLeads =
        leads.filter(
          isLostLead
        ).length;

      /* ====================================================
         HOT LEADS
      ==================================================== */

      const hotLeads =
        leads.filter(
          isHotLead
        ).length;

      /* ====================================================
         VIEWING METRICS
      ==================================================== */

      const {
        viewingRequested,

        viewingScheduled,

        viewingCompleted,
      } =
        getViewingMetrics(
          viewings
        );

      /* ====================================================
         FOLLOW-UP
      ==================================================== */

      const followUpLeads =
        leads.filter(
          isFollowUpLead
        ).length;

      /* ====================================================
         PERFORMANCE
      ==================================================== */

      const successRate =
        percentage(
          wonLeads,

          totalAssigned
        );

      const activeConversionRate =
        percentage(
          wonLeads,

          activeLeads +
            wonLeads
        );

      const hotLeadRatio =
        percentage(
          hotLeads,

          totalAssigned
        );

      /* ====================================================
         ASSIGNMENT SOURCE BREAKDOWN
      ==================================================== */

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

      /* ====================================================
         RETURN
      ==================================================== */

      return {
        agentId,

        organizationId,

        totalAssigned,

        activeLeads,

        /* --------------------------------------------------
           PIPELINE
        -------------------------------------------------- */

        newLeads,

        contactedLeads,

        qualifiedLeads,

        viewingLeads,

        negotiationLeads,

        wonLeads,

        lostLeads,

        /* --------------------------------------------------
           HOT
        -------------------------------------------------- */

        hotLeads,

        /* --------------------------------------------------
           VIEWINGS
        -------------------------------------------------- */

        viewingRequested,

        viewingScheduled,

        viewingCompleted,

        /* --------------------------------------------------
           FOLLOW-UP
        -------------------------------------------------- */

        followUpLeads,

        /* --------------------------------------------------
           PERFORMANCE
        -------------------------------------------------- */

        successRate,

        activeConversionRate,

        hotLeadRatio,

        /* --------------------------------------------------
           ASSIGNMENT SOURCE
        -------------------------------------------------- */

        aiAssigned,

        manualAssigned,

        autoAssigned,

        /* --------------------------------------------------
           SCORE CONFIGURATION
        -------------------------------------------------- */

        hotScoreThreshold:
          HOT_SCORE_THRESHOLD,
      };
    } catch (error) {
      console.error(
        "❌ Agent analytics error:",
        error
      );

      return null;
    }
  };

/* ==========================================================
   AI / SCORING EFFECTIVENESS
========================================================== */

/**
 * Measure scoring-system coverage and outcome.
 *
 * NOTE:
 * ----------------------------------------------------------
 * Lead.score is the canonical persisted score.
 *
 * This service does not claim that every score was generated
 * by an external AI model. The scoring engine is the authority
 * for score calculation.
 *
 * @param {ObjectId|string} organizationId
 *
 * @returns {Object|null}
 */
export const getAIEffectiveness =
  async (
    organizationId
  ) => {
    try {
      if (
        !hasOrganization(
          organizationId
        )
      ) {
        console.log(
          "⚠️ AI analytics skipped: organizationId is missing."
        );

        return null;
      }

      /* ====================================================
         GET ORGANIZATION LEADS
      ==================================================== */

      const leads =
        await Lead.find({
          organizationId,
        }).lean();

      const totalLeads =
        leads.length;

      /* ====================================================
         SCORED LEADS
      ==================================================== */

      const scoredLeadDocuments =
        leads.filter(
          (lead) =>
            safeNumber(
              lead.score
            ) > 0
        );

      const scoredLeads =
        scoredLeadDocuments.length;

      const unscoredLeads =
        totalLeads -
        scoredLeads;

      /* ====================================================
         SCORE COVERAGE
      ==================================================== */

      const scoringCoverage =
        percentage(
          scoredLeads,

          totalLeads
        );

      /* ====================================================
         AI-ASSIGNED LEADS
      ==================================================== */

      const aiAssignedLeads =
        leads.filter(
          (lead) =>
            lead.assignedSource ===
            "ai"
        ).length;

      /* ====================================================
         SCORE CATEGORY BREAKDOWN
      ==================================================== */

      const hotScoredLeads =
        scoredLeadDocuments.filter(
          (lead) =>
            getLeadCategory(
              safeNumber(
                lead.score
              )
            ) ===
            LEAD_SCORE_CATEGORIES.HOT
        ).length;

      const qualifiedScoredLeads =
        scoredLeadDocuments.filter(
          (lead) =>
            getLeadCategory(
              safeNumber(
                lead.score
              )
            ) ===
            LEAD_SCORE_CATEGORIES.QUALIFIED
        ).length;

      const newScoredLeads =
        scoredLeadDocuments.filter(
          (lead) =>
            getLeadCategory(
              safeNumber(
                lead.score
              )
            ) ===
            LEAD_SCORE_CATEGORIES.NEW
        ).length;

      /* ====================================================
         AVERAGE SCORE
      ==================================================== */

      const totalScore =
        scoredLeadDocuments.reduce(
          (
            sum,
            lead
          ) =>
            sum +
            safeNumber(
              lead.score
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

      /* ====================================================
         SCORED CONVERSIONS
      ==================================================== */

      const scoredAndWon =
        scoredLeadDocuments.filter(
          isWonLead
        ).length;

      const scoredAndLost =
        scoredLeadDocuments.filter(
          isLostLead
        ).length;

      const aiScoredConversionRate =
        percentage(
          scoredAndWon,

          scoredLeads
        );

      /* ====================================================
         RETURN
      ==================================================== */

      return {
        totalLeads,

        scoredLeads,

        unscoredLeads,

        scoringCoverage,

        aiAssignedLeads,

        /* --------------------------------------------------
           SCORE CATEGORIES
        -------------------------------------------------- */

        hotScoredLeads,

        qualifiedScoredLeads,

        newScoredLeads,

        /* --------------------------------------------------
           SCORE
        -------------------------------------------------- */

        averageScore,

        hotScoreThreshold:
          HOT_SCORE_THRESHOLD,

        /* --------------------------------------------------
           OUTCOMES
        -------------------------------------------------- */

        scoredAndWon,

        scoredAndLost,

        aiScoredConversionRate,

        /* --------------------------------------------------
           Canonical category labels
        -------------------------------------------------- */

        scoreCategories:
          LEAD_SCORE_CATEGORIES,
      };
    } catch (error) {
      console.error(
        "❌ AI analytics error:",
        error
      );

      return null;
    }
  };

/* ==========================================================
   ORGANIZATION PIPELINE BREAKDOWN
========================================================== */

/**
 * Returns a clean pipeline object for dashboard charts.
 *
 * IMPORTANT
 * ----------------------------------------------------------
 *
 * Only these keys represent actual Lead.status values:
 *
 *   new
 *   contacted
 *   qualified
 *   viewing
 *   negotiation
 *   won
 *   lost
 *
 * The following are DERIVED dashboard categories:
 *
 *   hot
 *   viewing_requested
 *   viewing_scheduled
 *   viewing_completed
 *   follow_up
 *
 * They MUST NOT be persisted into Lead.status.
 */
export const getOrganizationPipeline =
  async (
    organizationId
  ) => {
    try {
      if (
        !hasOrganization(
          organizationId
        )
      ) {
        return null;
      }

      /* ====================================================
         LEADS
      ==================================================== */

      const leads =
        await Lead.find({
          organizationId,
        }).lean();

      /* ====================================================
         VIEWINGS
      ==================================================== */

      const viewings =
        await Viewing.find({
          organizationId,
        }).lean();

      /* ====================================================
         VIEWING DERIVED METRICS
      ==================================================== */

      const {
        viewingRequested,

        viewingScheduled,

        viewingCompleted,
      } =
        getViewingMetrics(
          viewings
        );

      /* ====================================================
         PIPELINE
      ==================================================== */

      return {
        /* --------------------------------------------------
           REAL Lead.status VALUES
        -------------------------------------------------- */

        new:
          leads.filter(
            (lead) =>
              lead.status ===
              LEAD_STATUS.NEW
          ).length,

        contacted:
          leads.filter(
            (lead) =>
              lead.status ===
              LEAD_STATUS.CONTACTED
          ).length,

        qualified:
          leads.filter(
            (lead) =>
              lead.status ===
              LEAD_STATUS.QUALIFIED
          ).length,

        viewing:
          leads.filter(
            (lead) =>
              lead.status ===
              LEAD_STATUS.VIEWING
          ).length,

        negotiation:
          leads.filter(
            (lead) =>
              lead.status ===
              LEAD_STATUS.NEGOTIATION
          ).length,

        won:
          leads.filter(
            isWonLead
          ).length,

        lost:
          leads.filter(
            isLostLead
          ).length,

        /* --------------------------------------------------
           DERIVED SCORE CATEGORY
        -------------------------------------------------- */

        hot:
          leads.filter(
            isHotLead
          ).length,

        /* --------------------------------------------------
           DERIVED VIEWING WORKFLOW
        -------------------------------------------------- */

        viewing_requested:
          viewingRequested,

        viewing_scheduled:
          viewingScheduled,

        viewing_completed:
          viewingCompleted,

        /* --------------------------------------------------
           DERIVED FOLLOW-UP WORKFLOW
        -------------------------------------------------- */

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

/* ==========================================================
   AGENT WORKLOAD ANALYTICS
========================================================== */

/**
 * Returns current workload for an agent.
 *
 * organizationId is mandatory for tenant isolation.
 *
 * @param {ObjectId|string} agentId
 * @param {ObjectId|string} organizationId
 *
 * @returns {Object|null}
 */
export const getAgentWorkload =
  async (
    agentId,

    organizationId
  ) => {
    try {
      if (!agentId) {
        return null;
      }

      if (
        !hasOrganization(
          organizationId
        )
      ) {
        console.log(
          "⚠️ Agent workload skipped: organizationId is missing."
        );

        return null;
      }

      /* ====================================================
         LEADS
      ==================================================== */

      const leads =
        await Lead.find({
          organizationId,

          assignedTo:
            agentId,
        }).lean();

      /* ====================================================
         VIEWINGS
      ==================================================== */

      const viewings =
        await Viewing.find({
          organizationId,

          agent:
            agentId,

          status: {
            $in:
              ACTIVE_VIEWING_STATUSES,
          },
        }).lean();

      /* ====================================================
         LEAD COUNTS
      ==================================================== */

      const activeLeads =
        leads.filter(
          isActiveLead
        ).length;

      const wonLeads =
        leads.filter(
          isWonLead
        ).length;

      const lostLeads =
        leads.filter(
          isLostLead
        ).length;

      const hotLeads =
        leads.filter(
          isHotLead
        ).length;

      const viewingLeads =
        leads.filter(
          (lead) =>
            lead.status ===
            LEAD_STATUS.VIEWING
        ).length;

      const negotiationLeads =
        leads.filter(
          (lead) =>
            lead.status ===
            LEAD_STATUS.NEGOTIATION
        ).length;

      const followUpLeads =
        leads.filter(
          isFollowUpLead
        ).length;

      /* ====================================================
         VIEWING WORKLOAD
      ==================================================== */

      const scheduledViewings =
        viewings.filter(
          (viewing) =>
            SCHEDULED_VIEWING_STATUSES.includes(
              viewing.status
            )
        ).length;

      const requestedViewings =
        viewings.filter(
          (viewing) =>
            [
              VIEWING_STATUS.REQUESTED,

              VIEWING_STATUS.PENDING_APPROVAL,
            ].includes(
              viewing.status
            )
        ).length;

      /* ====================================================
         RETURN
      ==================================================== */

      return {
        agentId,

        organizationId,

        totalAssigned:
          leads.length,

        activeLeads,

        hotLeads,

        viewingLeads,

        negotiationLeads,

        followUpLeads,

        wonLeads,

        lostLeads,

        requestedViewings,

        scheduledViewings,
      };
    } catch (error) {
      console.error(
        "❌ Agent workload analytics error:",
        error
      );

      return null;
    }
  };

/* ==========================================================
   DEFAULT EXPORT
========================================================== */

export default {
  getOrganizationMetrics,

  getAgentPerformance,

  getAIEffectiveness,

  getOrganizationPipeline,

  getAgentWorkload,
};