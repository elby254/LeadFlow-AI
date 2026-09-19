/**
 * ==========================================================
 *
 * PATH:
 * backend/services/leadLifeCycleService.js
 *
 * PURPOSE
 * ----------------------------------------------------------
 * Centralizes lead lifecycle/status decisions.
 *
 * WORKFLOW
 * ----------------------------------------------------------
 *
 * new
 *   ↓
 * qualified
 *   ↓
 * hot
 *   ↓
 * viewing_requested
 *   ↓
 * viewing_scheduled
 *   ↓
 * negotiation
 *   ↓
 * follow_up
 *   ↓
 * closed
 *
 * Possible terminal/lost state:
 *
 * closed_lost
 *
 * IMPORTANT
 * ----------------------------------------------------------
 * This service should not blindly overwrite an existing
 * workflow state every time a customer sends a message.
 *
 * Existing active workflow states are preserved unless
 * there is a clear reason to advance the lead.
 *
 * ==========================================================
 */

/**
 * ==========================================================
 * LIFECYCLE STATUS CONSTANTS
 * ==========================================================
 *
 * Keeping statuses centralized prevents different parts of
 * the application from accidentally using different strings.
 *
 * ==========================================================
 */

export const LEAD_STATUS = {
  NEW: "new",

  QUALIFIED: "qualified",

  HOT: "hot",

  FOLLOW_UP: "follow_up",

  VIEWING_REQUESTED: "viewing_requested",

  VIEWING_SCHEDULED: "viewing_scheduled",

  NEGOTIATION: "negotiation",

  CLOSED: "closed",

  CLOSED_LOST: "closed_lost",
};

/**
 * ==========================================================
 * ACTIVE WORKFLOW STATUSES
 * ==========================================================
 *
 * These statuses represent leads already being handled by
 * the agent workflow.
 *
 * AI ingestion should not downgrade these leads back to
 * "new" simply because the latest message does not contain
 * enough qualification data.
 *
 * ==========================================================
 */

const ACTIVE_WORKFLOW_STATUSES = new Set([
  LEAD_STATUS.HOT,
  LEAD_STATUS.FOLLOW_UP,
  LEAD_STATUS.VIEWING_REQUESTED,
  LEAD_STATUS.VIEWING_SCHEDULED,
  LEAD_STATUS.NEGOTIATION,
]);

/**
 * ==========================================================
 * TERMINAL STATUSES
 * ==========================================================
 */

const TERMINAL_STATUSES = new Set([
  LEAD_STATUS.CLOSED,
  LEAD_STATUS.CLOSED_LOST,
]);

/**
 * ==========================================================
 * CHECK COMPLETE QUALIFICATION
 * ==========================================================
 *
 * A lead is considered qualified when the core property
 * requirements are available.
 *
 * Core qualification:
 * - Budget
 * - Location
 * - Bedrooms
 *
 * ==========================================================
 */

const isQualifiedLead = (lead) => {
  if (!lead) {
    return false;
  }

  return Boolean(
    lead.budget &&
    lead.location &&
    lead.bedrooms
  );
};

/**
 * ==========================================================
 * CHECK HOT LEAD
 * ==========================================================
 *
 * AI may explicitly identify a lead as hot.
 *
 * The score is also considered so lifecycle logic remains
 * consistent with the lead scoring / assignment workflow.
 *
 * Hot threshold:
 * 70+
 *
 * ==========================================================
 */

const isHotLead = (lead, aiResult = {}) => {
  if (!lead) {
    return false;
  }

  if (aiResult?.isHot === true) {
    return true;
  }

  return Number(lead.score || 0) >= 70;
};

/**
 * ==========================================================
 * DETERMINE LEAD STATUS
 * ==========================================================
 *
 * This is the main lifecycle decision function.
 *
 * IMPORTANT:
 *
 * It preserves existing workflow states.
 *
 * Example:
 *
 * A lead is already:
 *
 * viewing_scheduled
 *
 * Customer sends:
 *
 * "Okay, I will come tomorrow."
 *
 * The lifecycle service must NOT change that lead back to
 * "qualified" or "new".
 *
 * ==========================================================
 */

export function determineLeadStatus(
  lead,
  aiResult = {}
) {
  /**
   * --------------------------------------------------------
   * SAFETY
   * --------------------------------------------------------
   */

  if (!lead) {
    return LEAD_STATUS.NEW;
  }

  const currentStatus =
    lead.status || LEAD_STATUS.NEW;

  /**
   * --------------------------------------------------------
   * TERMINAL STATES
   * --------------------------------------------------------
   *
   * Once a lead has been explicitly closed/lost, AI
   * qualification should not automatically reopen it.
   *
   * --------------------------------------------------------
   */

  if (
    TERMINAL_STATUSES.has(
      currentStatus
    )
  ) {
    return currentStatus;
  }

  /**
   * --------------------------------------------------------
   * PRESERVE ACTIVE WORKFLOW
   * --------------------------------------------------------
   *
   * These statuses are controlled by the CRM/viewing
   * workflow rather than basic AI qualification.
   *
   * --------------------------------------------------------
   */

  if (
    ACTIVE_WORKFLOW_STATUSES.has(
      currentStatus
    )
  ) {
    return currentStatus;
  }

  /**
   * --------------------------------------------------------
   * HOT LEAD
   * --------------------------------------------------------
   *
   * Hot leads receive the highest qualification priority.
   *
   * This also aligns with:
   *
   * - Lead scoring
   * - Auto assignment
   * - Hot lead dashboard
   * - Real-time HOT_LEAD events
   *
   * --------------------------------------------------------
   */

  if (
    isHotLead(
      lead,
      aiResult
    )
  ) {
    return LEAD_STATUS.HOT;
  }

  /**
   * --------------------------------------------------------
   * QUALIFIED LEAD
   * --------------------------------------------------------
   */

  if (
    isQualifiedLead(
      lead
    )
  ) {
    return LEAD_STATUS.QUALIFIED;
  }

  /**
   * --------------------------------------------------------
   * DEFAULT
   * --------------------------------------------------------
   */

  return LEAD_STATUS.NEW;
}

/**
 * ==========================================================
 * CHECK WHETHER A LEAD CAN BE AUTO-ASSIGNED
 * ==========================================================
 *
 * Used by the agent workflow to prevent reassignment of
 * leads that are already owned by an agent.
 *
 * ==========================================================
 */

export function canAutoAssignLead(
  lead
) {
  if (!lead) {
    return false;
  }

  return !lead.assignedTo;
}

/**
 * ==========================================================
 * CHECK WHETHER A LEAD IS ACTIVE
 * ==========================================================
 */

export function isActiveLead(
  lead
) {
  if (!lead) {
    return false;
  }

  return !TERMINAL_STATUSES.has(
    lead.status
  );
}

/**
 * ==========================================================
 * CHECK WHETHER A LEAD IS CLOSED
 * ==========================================================
 */

export function isClosedLead(
  lead
) {
  if (!lead) {
    return false;
  }

  return TERMINAL_STATUSES.has(
    lead.status
  );
}

/**
 * ==========================================================
 * EXPORT STATUS GROUPS
 * ==========================================================
 *
 * These exports are useful for controllers, analytics,
 * dashboards and tests.
 *
 * ==========================================================
 */

export {
  ACTIVE_WORKFLOW_STATUSES,
  TERMINAL_STATUSES,
  isQualifiedLead,
  isHotLead,
};