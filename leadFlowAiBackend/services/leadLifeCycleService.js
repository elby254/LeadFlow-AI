/**
 * ==========================================================
 *
 * PATH:
 * backend/services/leadLifeCycleService.js
 *
 * PURPOSE
 * ----------------------------------------------------------
 * Centralizes ALL Lead.status lifecycle decisions.
 *
 * This is the single source of truth for:
 *
 * ✓ Valid Lead.status values
 * ✓ Allowed lifecycle transitions
 * ✓ Lifecycle transition validation
 * ✓ Qualification-stage decisions
 * ✓ Terminal lead detection
 * ✓ Active lead detection
 * ✓ Lifecycle-safe status progression
 *
 * ==========================================================
 *
 * CANONICAL LEAD LIFECYCLE
 * ==========================================================
 *
 * new
 *   ↓
 * contacted
 *   ↓
 * qualified
 *   ↓
 * viewing
 *   ↓
 * negotiation
 *   ↓
 * won
 *
 * lost is the terminal unsuccessful outcome.
 *
 * ==========================================================
 *
 * IMPORTANT
 * ==========================================================
 *
 * The following are NOT Lead.status values:
 *
 * ✗ hot
 * ✗ follow_up
 * ✗ viewing_requested
 * ✗ viewing_scheduled
 * ✗ closed
 * ✗ closed_lost
 *
 * They are represented elsewhere:
 *
 * HOT
 *   → Lead.score >= HOT_SCORE_THRESHOLD
 *
 * FOLLOW-UP
 *   → Lead.followUpStatus
 *   → Lead.followUpOutcome
 *
 * VIEWING WORKFLOW
 *   → Viewing.status
 *
 * SUCCESSFUL CONVERSION
 *   → Lead.status = "won"
 *
 * LOST CONVERSION
 *   → Lead.status = "lost"
 *
 * ==========================================================
 *
 * IMPORTANT BEHAVIOR
 * ==========================================================
 *
 * This service MUST NOT blindly overwrite an existing active
 * workflow state every time a customer sends a message.
 *
 * Example:
 *
 * Lead.status = "viewing"
 *
 * Customer sends:
 *
 * "Okay, I will come tomorrow."
 *
 * The lead remains:
 *
 * Lead.status = "viewing"
 *
 * Viewing.schedule remains controlled by the Viewing workflow.
 *
 * ==========================================================
 */

import {
  HOT_SCORE_THRESHOLD,
} from "./leadScoringRulesEngine.js";

/* ==========================================================
   LIFECYCLE STATUS CONSTANTS
========================================================== */

/**
 * These values MUST match the Lead.status enum.
 */
export const LEAD_STATUS = Object.freeze({
  NEW: "new",

  CONTACTED:
    "contacted",

  QUALIFIED:
    "qualified",

  VIEWING:
    "viewing",

  NEGOTIATION:
    "negotiation",

  WON:
    "won",

  LOST:
    "lost",
});

/* ==========================================================
   VALID LEAD STATUSES
========================================================== */

export const VALID_LEAD_STATUSES =
  Object.freeze([
    LEAD_STATUS.NEW,

    LEAD_STATUS.CONTACTED,

    LEAD_STATUS.QUALIFIED,

    LEAD_STATUS.VIEWING,

    LEAD_STATUS.NEGOTIATION,

    LEAD_STATUS.WON,

    LEAD_STATUS.LOST,
  ]);

/* ==========================================================
   TERMINAL STATUSES
========================================================== */

/**
 * Terminal lifecycle states.
 *
 * A terminal lead must not be automatically reopened by
 * qualification or AI ingestion.
 */
const TERMINAL_STATUS_SET =
  new Set([
    LEAD_STATUS.WON,

    LEAD_STATUS.LOST,
  ]);

export const TERMINAL_STATUSES =
  TERMINAL_STATUS_SET;

/* ==========================================================
   ACTIVE WORKFLOW STATUSES
========================================================== */

/**
 * These represent leads that are already inside the CRM
 * workflow and should not be blindly downgraded by AI
 * ingestion.
 *
 * "hot" is intentionally NOT included because hot is a
 * score category, not a lifecycle state.
 */
const ACTIVE_WORKFLOW_STATUS_SET =
  new Set([
    LEAD_STATUS.CONTACTED,

    LEAD_STATUS.QUALIFIED,

    LEAD_STATUS.VIEWING,

    LEAD_STATUS.NEGOTIATION,
  ]);

export const ACTIVE_WORKFLOW_STATUSES =
  ACTIVE_WORKFLOW_STATUS_SET;

/* ==========================================================
   LIFECYCLE ORDER
========================================================== */

/**
 * Used for reporting, tests and deterministic comparison.
 */
export const LEAD_LIFECYCLE_ORDER =
  Object.freeze([
    LEAD_STATUS.NEW,

    LEAD_STATUS.CONTACTED,

    LEAD_STATUS.QUALIFIED,

    LEAD_STATUS.VIEWING,

    LEAD_STATUS.NEGOTIATION,

    LEAD_STATUS.WON,
  ]);

/* ==========================================================
   ALLOWED TRANSITIONS
========================================================== */

/**
 * Canonical lifecycle transition matrix.
 *
 * Every status includes itself so that explicit no-op
 * transitions can be safely validated.
 *
 * ----------------------------------------------------------
 *
 * new
 *   → new
 *   → contacted
 *   → qualified
 *   → lost
 *
 * contacted
 *   → contacted
 *   → qualified
 *   → lost
 *
 * qualified
 *   → qualified
 *   → viewing
 *   → lost
 *
 * viewing
 *   → viewing
 *   → qualified
 *   → negotiation
 *   → lost
 *
 * negotiation
 *   → negotiation
 *   → won
 *   → lost
 *
 * won
 *   → won
 *
 * lost
 *   → lost
 */
export const LEAD_STATUS_TRANSITIONS =
  Object.freeze({
    [LEAD_STATUS.NEW]: Object.freeze([
      LEAD_STATUS.NEW,

      LEAD_STATUS.CONTACTED,

      LEAD_STATUS.QUALIFIED,

      LEAD_STATUS.LOST,
    ]),

    [LEAD_STATUS.CONTACTED]:
      Object.freeze([
        LEAD_STATUS.CONTACTED,

        LEAD_STATUS.QUALIFIED,

        LEAD_STATUS.LOST,
      ]),

    [LEAD_STATUS.QUALIFIED]:
      Object.freeze([
        LEAD_STATUS.QUALIFIED,

        LEAD_STATUS.VIEWING,

        LEAD_STATUS.LOST,
      ]),

    [LEAD_STATUS.VIEWING]:
      Object.freeze([
        LEAD_STATUS.VIEWING,

        LEAD_STATUS.QUALIFIED,

        LEAD_STATUS.NEGOTIATION,

        LEAD_STATUS.LOST,
      ]),

    [LEAD_STATUS.NEGOTIATION]:
      Object.freeze([
        LEAD_STATUS.NEGOTIATION,

        LEAD_STATUS.WON,

        LEAD_STATUS.LOST,
      ]),

    [LEAD_STATUS.WON]:
      Object.freeze([
        LEAD_STATUS.WON,
      ]),

    [LEAD_STATUS.LOST]:
      Object.freeze([
        LEAD_STATUS.LOST,
      ]),
  });

/* ==========================================================
   VALIDATE LEAD STATUS
========================================================== */

/**
 * Check whether a value is a canonical Lead.status.
 */
export const isValidLeadStatus = (
  status
) => {
  return VALID_LEAD_STATUSES.includes(
    status
  );
};

/* ==========================================================
   GET ALLOWED NEXT STATUSES
========================================================== */

/**
 * Returns the lifecycle states that can follow the current
 * status.
 *
 * Unknown statuses return [].
 */
export const getAllowedNextStatuses = (
  currentStatus
) => {
  if (
    !isValidLeadStatus(
      currentStatus
    )
  ) {
    return [];
  }

  return [
    ...(
      LEAD_STATUS_TRANSITIONS[
        currentStatus
      ] || []
    ),
  ];
};

/* ==========================================================
   CHECK TRANSITION
========================================================== */

/**
 * Determines whether a lead can move from:
 *
 * currentStatus → nextStatus
 */
export const canTransitionLeadStatus = (
  currentStatus,
  nextStatus
) => {
  if (
    !isValidLeadStatus(
      currentStatus
    )
  ) {
    return false;
  }

  if (
    !isValidLeadStatus(
      nextStatus
    )
  ) {
    return false;
  }

  const allowed =
    LEAD_STATUS_TRANSITIONS[
      currentStatus
    ];

  return Boolean(
    allowed?.includes(
      nextStatus
    )
  );
};

/* ==========================================================
   APPLY LEAD STATUS TRANSITION
========================================================== */

/**
 * Applies a validated lifecycle transition to the Lead object.
 *
 * IMPORTANT:
 * ----------------------------------------------------------
 *
 * This function changes the in-memory document only.
 *
 * The caller is responsible for calling:
 *
 *   await lead.save()
 *
 * when appropriate.
 *
 * This makes the lifecycle service reusable from:
 *
 * ✓ controllers
 * ✓ services
 * ✓ transactions
 * ✓ tests
 */
export const transitionLeadStatus = (
  lead,
  nextStatus
) => {
  if (!lead) {
    throw new Error(
      "Lead is required for lifecycle transition."
    );
  }

  if (
    !isValidLeadStatus(
      nextStatus
    )
  ) {
    throw new Error(
      `Invalid lead status: ${nextStatus}`
    );
  }

  const currentStatus =
    lead.status ||
    LEAD_STATUS.NEW;

  if (
    !isValidLeadStatus(
      currentStatus
    )
  ) {
    throw new Error(
      `Lead contains invalid current status: ${currentStatus}`
    );
  }

  /* --------------------------------------------------------
     No-op transition
  -------------------------------------------------------- */

  if (
    currentStatus ===
    nextStatus
  ) {
    return lead;
  }

  /* --------------------------------------------------------
     Validate transition
  -------------------------------------------------------- */

  if (
    !canTransitionLeadStatus(
      currentStatus,
      nextStatus
    )
  ) {
    throw new Error(
      `Invalid lead lifecycle transition: ${currentStatus} -> ${nextStatus}`
    );
  }

  /* --------------------------------------------------------
     Apply transition
  -------------------------------------------------------- */

  lead.status =
    nextStatus;

  return lead;
};

/* ==========================================================
   CHECK CORE QUALIFICATION
========================================================== */

/**
 * A lead is considered qualification-ready when the core
 * property requirements are known.
 *
 * Core qualification:
 *
 * ✓ budget
 * ✓ location
 * ✓ bedrooms
 *
 * This does NOT mean:
 *
 *   Lead.status = qualified
 *
 * It only determines whether the qualification criteria are
 * present.
 */
export const isQualifiedLead = (
  lead
) => {
  if (!lead) {
    return false;
  }

  const hasBudget =
    lead.budget !==
      null &&
    lead.budget !==
      undefined &&
    String(
      lead.budget
    ).trim() !==
      "" &&
    Number(
      lead.budget
    ) > 0;

  const hasLocation =
    typeof lead.location ===
      "string"
      ? lead.location.trim()
          .length > 0
      : Boolean(
          lead.location
        );

  const hasBedrooms =
    lead.bedrooms !==
      null &&
    lead.bedrooms !==
      undefined &&
    String(
      lead.bedrooms
    ).trim() !==
      "" &&
    Number(
      lead.bedrooms
    ) > 0;

  return (
    hasBudget &&
    hasLocation &&
    hasBedrooms
  );
};

/* ==========================================================
   CHECK HOT SCORE CATEGORY
========================================================== */

/**
 * HOT IS A SCORE CATEGORY.
 *
 * It is NOT a Lead.status.
 *
 * The canonical threshold comes from:
 *
 *   leadScoringRulesEngine.js
 *
 * Canonical:
 *
 *   score >= 80 → hot
 */
export const isHotLead = (
  lead
) => {
  if (!lead) {
    return false;
  }

  const score =
    Number(
      lead.score || 0
    );

  if (
    !Number.isFinite(
      score
    )
  ) {
    return false;
  }

  return (
    score >=
    HOT_SCORE_THRESHOLD
  );
};

/* ==========================================================
   DETERMINE LEAD STATUS
========================================================== */

/**
 * Main lifecycle decision function.
 *
 * IMPORTANT:
 * ----------------------------------------------------------
 *
 * This function is conservative.
 *
 * It does NOT treat:
 *
 *   hot
 *
 * as a Lead.status.
 *
 * It does NOT use AI's isHot flag as an independent lifecycle
 * authority.
 *
 * It does NOT automatically reopen terminal leads.
 *
 * It does NOT move active workflow states backwards merely
 * because the newest message lacks qualification fields.
 *
 * ==========================================================
 */
export function determineLeadStatus(
  lead,
  aiResult = {}
) {
  /* --------------------------------------------------------
     SAFETY
  -------------------------------------------------------- */

  if (!lead) {
    return LEAD_STATUS.NEW;
  }

  const currentStatus =
    lead.status ||
    LEAD_STATUS.NEW;

  /* --------------------------------------------------------
     INVALID CURRENT STATUS
  -------------------------------------------------------- */

  if (
    !isValidLeadStatus(
      currentStatus
    )
  ) {
    /**
     * Fail closed rather than allowing a legacy status to
     * propagate through the canonical lifecycle.
     */
    return LEAD_STATUS.NEW;
  }

  /* --------------------------------------------------------
     TERMINAL STATES
  -------------------------------------------------------- */

  /**
   * Once a lead is won or lost, ordinary AI ingestion does
   * not automatically reopen it.
   */
  if (
    TERMINAL_STATUS_SET.has(
      currentStatus
    )
  ) {
    return currentStatus;
  }

  /* --------------------------------------------------------
     PRESERVE ACTIVE WORKFLOW
  -------------------------------------------------------- */

  /**
   * These lifecycle states are controlled by explicit CRM
   * workflow actions.
   *
   * Do not downgrade them just because an AI extraction pass
   * happens not to contain every qualification field.
   */
  if (
    ACTIVE_WORKFLOW_STATUS_SET.has(
      currentStatus
    )
  ) {
    /*
     * CONTACTED may advance to QUALIFIED when the required
     * qualification data becomes available.
     *
     * QUALIFIED stays QUALIFIED until a viewing is explicitly
     * requested through the viewing workflow.
     *
     * VIEWING stays VIEWING until the explicit sales/viewing
     * workflow advances or returns it.
     *
     * NEGOTIATION stays NEGOTIATION until won/lost.
     */
    if (
      currentStatus ===
        LEAD_STATUS.CONTACTED &&
      isQualifiedLead(
        lead
      )
    ) {
      return LEAD_STATUS.QUALIFIED;
    }

    return currentStatus;
  }

  /* --------------------------------------------------------
     NEW → QUALIFIED
  -------------------------------------------------------- */

  /**
   * A brand-new lead can automatically become QUALIFIED when
   * the core qualification fields are available.
   */
  if (
    currentStatus ===
      LEAD_STATUS.NEW &&
    isQualifiedLead(
      lead
    )
  ) {
    return LEAD_STATUS.QUALIFIED;
  }

  /* --------------------------------------------------------
     NEW → CONTACTED
  -------------------------------------------------------- */

  /**
   * AI itself does not invent a contact event.
   *
   * Therefore NEW remains NEW unless another explicit
   * workflow action changes it to CONTACTED or qualification
   * criteria move it to QUALIFIED.
   */
  return currentStatus;
}

/* ==========================================================
   CHECK WHETHER LEAD CAN BE AUTO-ASSIGNED
========================================================== */

/**
 * Auto-assignment is allowed only when the lead is currently
 * unassigned.
 *
 * Assignment priority and conflict resolution are handled by:
 *
 *   leadAutoAssignmentService.js
 *   assignmentConflictResolver.js
 */
export const canAutoAssignLead = (
  lead
) => {
  if (!lead) {
    return false;
  }

  return !lead.assignedTo;
};

/* ==========================================================
   CHECK WHETHER LEAD IS ACTIVE
========================================================== */

/**
 * Won and lost are terminal.
 *
 * Every other canonical lifecycle state remains active.
 */
export const isActiveLead = (
  lead
) => {
  if (!lead) {
    return false;
  }

  return !TERMINAL_STATUS_SET.has(
    lead.status
  );
};

/* ==========================================================
   CHECK WHETHER LEAD IS CLOSED
========================================================== */

/**
 * Backward-compatible helper.
 *
 * "closed" here means TERMINAL, not a Lead.status called
 * "closed".
 *
 * Canonical terminal values:
 *
 *   won
 *   lost
 */
export const isClosedLead = (
  lead
) => {
  if (!lead) {
    return false;
  }

  return TERMINAL_STATUS_SET.has(
    lead.status
  );
};

/* ==========================================================
   CHECK WON LEAD
========================================================== */

export const isWonLead = (
  lead
) => {
  if (!lead) {
    return false;
  }

  return (
    lead.status ===
    LEAD_STATUS.WON
  );
};

/* ==========================================================
   CHECK LOST LEAD
========================================================== */

export const isLostLead = (
  lead
) => {
  if (!lead) {
    return false;
  }

  return (
    lead.status ===
    LEAD_STATUS.LOST
  );
};

/* ==========================================================
   DEFAULT EXPORT
========================================================== */

export default {
  LEAD_STATUS,

  VALID_LEAD_STATUSES,

  LEAD_STATUS_TRANSITIONS,

  LEAD_LIFECYCLE_ORDER,

  ACTIVE_WORKFLOW_STATUSES,

  TERMINAL_STATUSES,

  isValidLeadStatus,

  getAllowedNextStatuses,

  canTransitionLeadStatus,

  transitionLeadStatus,

  determineLeadStatus,

  isQualifiedLead,

  isHotLead,

  canAutoAssignLead,

  isActiveLead,

  isClosedLead,

  isWonLead,

  isLostLead,
};