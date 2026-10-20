/**
 * ==========================================================
 *
 * REALTIME ENGINE
 *
 * ==========================================================
 *
 * PURPOSE
 * ----------------------------------------------------------
 * Central Socket.io communication layer for LeadFlow AI.
 *
 * ==========================================================
 *
 * RESPONSIBILITIES
 * ----------------------------------------------------------
 *
 * ✓ Broadcast canonical lead events
 * ✓ Notify assigned agents
 * ✓ Synchronize organization pipelines
 * ✓ Maintain organization isolation
 * ✓ Safely emit Socket.io events
 *
 * ==========================================================
 *
 * IMPORTANT
 * ----------------------------------------------------------
 *
 * This service does NOT decide:
 *
 * ✗ Which agent receives a lead
 * ✗ Lead score
 * ✗ Lead status
 * ✗ Assignment conflicts
 *
 * Those responsibilities belong to:
 *
 * leadScoringRulesEngine.js
 * leadLifeCycleService.js
 * leadAutoAssignmentService.js
 * assignmentConflictResolver.js
 *
 * This file ONLY translates business events into realtime
 * Socket.io broadcasts.
 *
 * ==========================================================
 *
 * CANONICAL LEAD LIFECYCLE
 * ----------------------------------------------------------
 *
 * Lead.status:
 *
 *   new
 *   contacted
 *   qualified
 *   viewing
 *   negotiation
 *   won
 *   lost
 *
 * ==========================================================
 *
 * CANONICAL SCORE CATEGORIES
 * ----------------------------------------------------------
 *
 *   0–49   → new
 *   50–79  → qualified
 *   80–100 → hot
 *
 * HOT IS NOT A LEAD STATUS.
 *
 * ==========================================================
 *
 * VIEWING STATE
 * ----------------------------------------------------------
 *
 * Source of truth:
 *
 *   Viewing.status
 *
 * Canonical Viewing.status values:
 *
 *   Requested
 *   Pending Approval
 *   Approved
 *   Rescheduled
 *   Rejected
 *   Cancelled
 *   Completed
 *
 * The socket payload may continue exposing the existing
 * "viewingStatus" field for frontend compatibility.
 *
 * IMPORTANT:
 *
 * That field is a transport snapshot only.
 *
 * It does NOT represent Lead.viewingStatus as a lifecycle
 * authority.
 *
 * ==========================================================
 *
 * FOLLOW-UP STATE
 * ----------------------------------------------------------
 *
 * Lead.followUpStatus:
 *
 *   pending
 *   scheduled
 *   completed
 *   cancelled
 *
 * ==========================================================
 *
 * CANONICAL INTERNAL EVENTS
 * ----------------------------------------------------------
 *
 * lead.created
 * lead.updated
 * lead.status.changed
 * lead.scored
 * lead.assigned
 * lead.unassigned
 *
 * lead.followup.due
 * lead.followup.updated
 * lead.followup.completed
 *
 * lead.viewing.requested
 * lead.viewing.confirmed
 * lead.viewing.completed
 * lead.viewing.cancelled
 *
 * lead.won
 * lead.lost
 *
 * conversation.updated
 * lead.pipeline.updated
 *
 * ==========================================================
 */

import leadEventBus, {
  LEAD_EVENTS,
} from "../events/leadEvents.js";

import {
  LEAD_STATUS,
} from "../services/leadLifeCycleService.js";

import {
  HOT_SCORE_THRESHOLD,
  getLeadCategory,
} from "../services/leadScoringRulesEngine.js";

/* ==========================================================
   SOCKET.IO INSTANCE
========================================================== */

let ioInstance =
  null;

/* ==========================================================
   EVENT LISTENER REGISTRATION STATE
========================================================== */

let listenersRegistered =
  false;

/* ==========================================================
   CANONICAL LEAD STATUSES
========================================================== */

const LEAD_STATUSES =
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
   CANONICAL VIEWING STATUS VALUES
========================================================== */

/**
 * Viewing.status is authoritative.
 *
 * These values mirror the canonical viewing workflow.
 */
const VIEWING_STATUS =
  Object.freeze({
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

const VIEWING_STATUSES =
  Object.freeze([
    VIEWING_STATUS.REQUESTED,

    VIEWING_STATUS.PENDING_APPROVAL,

    VIEWING_STATUS.APPROVED,

    VIEWING_STATUS.RESCHEDULED,

    VIEWING_STATUS.REJECTED,

    VIEWING_STATUS.CANCELLED,

    VIEWING_STATUS.COMPLETED,
  ]);

/* ==========================================================
   VIEWING TRANSPORT COMPATIBILITY
========================================================== */

/**
 * Existing frontend consumers may already expect lowercase
 * viewing values.
 *
 * Therefore the realtime transport keeps the existing
 * "viewingStatus" field while translating canonical
 * Viewing.status values into the established transport
 * vocabulary.
 *
 * This does NOT change the source of truth.
 */
const VIEWING_STATUS_TRANSPORT_MAP =
  Object.freeze({
    [VIEWING_STATUS.REQUESTED]:
      "requested",

    [VIEWING_STATUS.PENDING_APPROVAL]:
      "pending_approval",

    [VIEWING_STATUS.APPROVED]:
      "approved",

    [VIEWING_STATUS.RESCHEDULED]:
      "rescheduled",

    [VIEWING_STATUS.REJECTED]:
      "rejected",

    [VIEWING_STATUS.CANCELLED]:
      "cancelled",

    [VIEWING_STATUS.COMPLETED]:
      "completed",
  });

/* ==========================================================
   FOLLOW-UP STATUS VALUES
========================================================== */

const FOLLOW_UP_STATUSES =
  Object.freeze([
    "pending",

    "scheduled",

    "completed",

    "cancelled",
  ]);

/* ==========================================================
   SOCKET EVENT NAMES
========================================================== */

/*
 * These are transport-level events.
 *
 * IMPORTANT:
 * They are NOT the canonical business-event names.
 *
 * The business event contract remains in:
 *
 *   events/leadEvents.js
 *
 * These Socket.io names are kept stable where the existing
 * frontend may already depend on them.
 */

const SOCKET_EVENTS =
  Object.freeze({
    LEAD_CREATED:
      "NEW_LEAD",

    LEAD_UPDATED:
      "LEAD_UPDATED",

    LEAD_SCORED:
      "LEAD_SCORED",

    LEAD_STATUS_CHANGED:
      "LEAD_STATUS_UPDATED",

    LEAD_ASSIGNED:
      "LEAD_ASSIGNED",

    LEAD_UNASSIGNED:
      "LEAD_UNASSIGNED",

    LEAD_PIPELINE_UPDATED:
      "PIPELINE_UPDATE",

    LEAD_FOLLOWUP_UPDATED:
      "FOLLOW_UP_UPDATED",

    LEAD_FOLLOWUP_DUE:
      "FOLLOW_UP_DUE",

    LEAD_FOLLOWUP_COMPLETED:
      "FOLLOW_UP_COMPLETED",

    LEAD_VIEWING_REQUESTED:
      "VIEWING_REQUESTED",

    LEAD_VIEWING_CONFIRMED:
      "VIEWING_CONFIRMED",

    LEAD_VIEWING_COMPLETED:
      "VIEWING_COMPLETED",

    LEAD_VIEWING_CANCELLED:
      "VIEWING_CANCELLED",

    LEAD_WON:
      "LEAD_WON",

    LEAD_LOST:
      "LEAD_LOST",

    CONVERSATION_UPDATED:
      "conversation_updated",
  });

/* ==========================================================
   VALIDATE LEAD STATUS
========================================================== */

const getValidLeadStatus = (
  status
) => {
  if (
    LEAD_STATUSES.includes(
      status
    )
  ) {
    return status;
  }

  return LEAD_STATUS.NEW;
};

/* ==========================================================
   VALIDATE / NORMALIZE VIEWING STATUS
========================================================== */

/**
 * Converts canonical Viewing.status into the existing
 * lowercase Socket.io transport representation.
 *
 * Examples:
 *
 * Requested
 *   → requested
 *
 * Pending Approval
 *   → pending_approval
 *
 * Approved
 *   → approved
 *
 * Rescheduled
 *   → rescheduled
 *
 * Rejected
 *   → rejected
 *
 * Cancelled
 *   → cancelled
 *
 * Completed
 *   → completed
 */
const getValidViewingStatus = (
  status
) => {
  if (
    status ===
      undefined ||
    status ===
      null ||
    String(status).trim() ===
      ""
  ) {
    return "none";
  }

  const raw =
    String(
      status
    ).trim();

  /* --------------------------------------------------------
     Canonical Viewing.status
  -------------------------------------------------------- */

  if (
    VIEWING_STATUSES.includes(
      raw
    )
  ) {
    return (
      VIEWING_STATUS_TRANSPORT_MAP[
        raw
      ]
    );
  }

  /* --------------------------------------------------------
     Existing lowercase transport values
  -------------------------------------------------------- */

  const normalized =
    raw
      .toLowerCase()
      .replace(
        /\s+/g,
        "_"
      );

  if (
    [
      "none",
      "requested",
      "pending_approval",
      "approved",
      "scheduled",
      "rescheduled",
      "rejected",
      "cancelled",
      "completed",
    ].includes(
      normalized
    )
  ) {
    return normalized;
  }

  return "none";
};

/* ==========================================================
   VALIDATE FOLLOW-UP STATUS
========================================================== */

const getValidFollowUpStatus = (
  status
) => {
  if (
    FOLLOW_UP_STATUSES.includes(
      status
    )
  ) {
    return status;
  }

  return null;
};

/* ==========================================================
   GET SCORE
========================================================== */

const getScore = (
  lead
) => {
  const score =
    Number(
      lead?.score || 0
    );

  if (
    !Number.isFinite(
      score
    )
  ) {
    return 0;
  }

  return Math.min(
    100,

    Math.max(
      0,

      score
    )
  );
};

/* ==========================================================
   GET SCORE CATEGORY
========================================================== */

/**
 * Uses the canonical scoring service rather than recreating
 * score bands locally.
 */
const getScoreCategory = (
  score
) => {
  return getLeadCategory(
    score
  );
};

/* ==========================================================
   GET HOT STATE
========================================================== */

/*
 * HOT is derived exclusively from score.
 */

const getIsHotLead = (
  lead
) => {
  return (
    getScore(
      lead
    ) >=
    HOT_SCORE_THRESHOLD
  );
};

/* ==========================================================
   INITIALIZE REALTIME ENGINE
========================================================== */

export const initRealtimeEngine = (
  io
) => {
  if (!io) {
    console.error(
      "❌ Realtime engine initialization failed: Socket.io instance missing."
    );

    return false;
  }

  ioInstance =
    io;

  console.log(
    "⚡ Real-time engine initialized (Socket.io ready)"
  );

  return true;
};

/* ==========================================================
   CHECK SOCKET STATUS
========================================================== */

export const isRealtimeReady =
  () => {
    return Boolean(
      ioInstance
    );
  };

/* ==========================================================
   SAFE SOCKET EMITTER
========================================================== */

const emit = (
  event,

  data,

  room = null
) => {
  if (!ioInstance) {
    console.log(
      "⚠️ Socket.io not initialized - event skipped:",
      event
    );

    return false;
  }

  try {
    if (
      room
    ) {
      ioInstance
        .to(
          room
        )
        .emit(
          event,

          data
        );
    } else {
      ioInstance.emit(
        event,

        data
      );
    }

    return true;
  } catch (
    error
  ) {
    console.error(
      `❌ Socket emission failed for ${event}:`,
      error
    );

    return false;
  }
};

/* ==========================================================
   ORGANIZATION ROOM
========================================================== */

const getOrganizationRoom = (
  organizationId
) => {
  if (
    !organizationId
  ) {
    return null;
  }

  return `organization:${String(
    organizationId
  )}`;
};

/* ==========================================================
   AGENT ROOM
========================================================== */

const getAgentRoom = (
  agentId
) => {
  if (
    !agentId
  ) {
    return null;
  }

  return `agent:${String(
    agentId
  )}`;
};

/* ==========================================================
   EXTRACT LEAD ID
========================================================== */

const getLeadId = (
  lead
) => {
  if (!lead) {
    return null;
  }

  return (
    lead._id ||
    lead.id ||
    lead.leadId ||
    null
  );
};

/* ==========================================================
   EXTRACT ORGANIZATION ID
========================================================== */

const getOrganizationId = (
  lead
) => {
  if (!lead) {
    return null;
  }

  return (
    lead.organizationId ||
    null
  );
};

/* ==========================================================
   EXTRACT ASSIGNED AGENT
========================================================== */

const getAssignedAgentId = (
  lead
) => {
  if (!lead) {
    return null;
  }

  return (
    lead.assignedTo ||
    lead.agentId ||
    null
  );
};

/* ==========================================================
   BUILD STANDARD LEAD PAYLOAD
========================================================== */

/**
 * This creates the Socket.io transport DTO.
 *
 * IMPORTANT:
 *
 * This does not mutate CRM state.
 *
 * viewingStatus is a transport snapshot only.
 *
 * Its authoritative source is expected to be the Viewing
 * workflow event payload.
 */
const buildLeadPayload = (
  lead,

  extra = {}
) => {
  if (!lead) {
    return null;
  }

  const leadId =
    getLeadId(
      lead
    );

  const organizationId =
    getOrganizationId(
      lead
    );

  const score =
    getScore(
      lead
    );

  const assignedTo =
    getAssignedAgentId(
      lead
    );

  const transportViewingStatus =
    getValidViewingStatus(
      lead.viewingStatus
    );

  return {
    leadId:
      leadId
        ? String(
            leadId
          )
        : null,

    id:
      leadId
        ? String(
            leadId
          )
        : null,

    name:
      lead.name ||
      "Unknown",

    phone:
      lead.phone ||
      null,

    /*
     * Canonical lifecycle field.
     *
     * NEVER use newStatus here.
     */
    status:
      getValidLeadStatus(
        lead.status
      ),

    score,

    scoreCategory:
      lead.scoreCategory ||
      lead.category ||
      getScoreCategory(
        score
      ),

    isHot:
      getIsHotLead({
        score,
      }),

    assignedTo:
      assignedTo
        ? String(
            assignedTo
          )
        : null,

    assignedAt:
      lead.assignedAt ||
      null,

    assignedSource:
      lead.assignedSource ||
      null,

    /*
     * Transport compatibility field.
     *
     * This does NOT make Lead.viewingStatus authoritative.
     */
    viewingStatus:
      transportViewingStatus,

    followUpStatus:
      getValidFollowUpStatus(
        lead.followUpStatus
      ),

    followUpOutcome:
      lead.followUpOutcome ||
      null,

    nextFollowUpDate:
      lead.nextFollowUpDate ||
      null,

    nextAction:
      lead.nextAction ||
      null,

    lastContact:
      lead.lastContact ||
      null,

    organizationId:
      organizationId
        ? String(
            organizationId
          )
        : null,

    createdAt:
      lead.createdAt ||
      null,

    updatedAt:
      lead.updatedAt ||
      new Date(),

    ...extra,
  };
};

/* ==========================================================
   EMIT TO ORGANIZATION
========================================================== */

const emitToOrganization = (
  event,

  payload,

  organizationId
) => {
  const room =
    getOrganizationRoom(
      organizationId
    );

  if (!room) {
    return false;
  }

  return emit(
    event,

    payload,

    room
  );
};

/* ==========================================================
   EMIT TO ASSIGNED AGENT
========================================================== */

const emitToAssignedAgent = (
  event,

  payload,

  agentId
) => {
  const room =
    getAgentRoom(
      agentId
    );

  if (!room) {
    return false;
  }

  return emit(
    event,

    payload,

    room
  );
};

/* ==========================================================
   LEAD CREATED
========================================================== */

export const emitNewLead = (
  lead
) => {
  if (!lead) {
    return false;
  }

  const leadId =
    getLeadId(
      lead
    );

  if (!leadId) {
    return false;
  }

  const organizationId =
    getOrganizationId(
      lead
    );

  const payload =
    buildLeadPayload(
      lead,

      {
        event:
          LEAD_EVENTS.LEAD_CREATED,

        isNewLead:
          true,
      }
    );

  emitToOrganization(
    SOCKET_EVENTS.LEAD_CREATED,

    payload,

    organizationId
  );

  if (
    getAssignedAgentId(
      lead
    )
  ) {
    emitToAssignedAgent(
      SOCKET_EVENTS.LEAD_CREATED,

      payload,

      getAssignedAgentId(
        lead
      )
    );
  }

  console.log(
    `🆕 New lead broadcasted: ${leadId}`
  );

  return true;
};

/* ==========================================================
   LEAD UPDATED
========================================================== */

export const emitLeadUpdated = (
  lead
) => {
  if (!lead) {
    return false;
  }

  const leadId =
    getLeadId(
      lead
    );

  if (!leadId) {
    return false;
  }

  const organizationId =
    getOrganizationId(
      lead
    );

  const payload =
    buildLeadPayload(
      lead,

      {
        event:
          LEAD_EVENTS.LEAD_UPDATED,
      }
    );

  emitToOrganization(
    SOCKET_EVENTS.LEAD_UPDATED,

    payload,

    organizationId
  );

  if (
    getAssignedAgentId(
      lead
    )
  ) {
    emitToAssignedAgent(
      SOCKET_EVENTS.LEAD_UPDATED,

      payload,

      getAssignedAgentId(
        lead
      )
    );
  }

  return true;
};

/* ==========================================================
   LEAD SCORED
========================================================== */

export const emitLeadScored = (
  payload
) => {
  if (!payload) {
    return false;
  }

  const leadId =
    getLeadId(
      payload
    );

  const organizationId =
    getOrganizationId(
      payload
    );

  if (!leadId) {
    return false;
  }

  const score =
    getScore(
      payload
    );

  const scoreCategory =
    payload.scoreCategory ||
    payload.category ||
    getScoreCategory(
      score
    );

  const normalizedPayload =
    buildLeadPayload(
      payload,

      {
        event:
          LEAD_EVENTS.LEAD_SCORED,

        previousScore:
          Number(
            payload.previousScore ??
              0
          ),

        previousCategory:
          payload.previousCategory ??
          null,

        score,

        category:
          scoreCategory,

        scoreCategory,

        isHot:
          score >=
          HOT_SCORE_THRESHOLD,
      }
    );

  emitToOrganization(
    SOCKET_EVENTS.LEAD_SCORED,

    normalizedPayload,

    organizationId
  );

  if (
    getAssignedAgentId(
      payload
    )
  ) {
    emitToAssignedAgent(
      SOCKET_EVENTS.LEAD_SCORED,

      normalizedPayload,

      getAssignedAgentId(
        payload
      )
    );
  }

  /**
   * Preserve the legacy frontend hot-lead socket event
   * as a transport notification only.
   *
   * It is NOT a business event and is NOT used internally.
   */
  if (
    score >=
    HOT_SCORE_THRESHOLD
  ) {
    emitToOrganization(
      "HOT_LEAD",

      normalizedPayload,

      organizationId
    );

    if (
      getAssignedAgentId(
        payload
      )
    ) {
      emitToAssignedAgent(
        "HOT_LEAD",

        normalizedPayload,

        getAssignedAgentId(
          payload
        )
      );
    }
  }

  console.log(
    "🎯 Lead score broadcast:",
    {
      leadId:
        String(
          leadId
        ),

      score,

      scoreCategory,

      isHot:
        score >=
        HOT_SCORE_THRESHOLD,
    }
  );

  return true;
};

/* ==========================================================
   LEAD STATUS CHANGED
========================================================== */

/**
 * IMPORTANT:
 *
 * This function translates ONLY the canonical
 * lead.status.changed business event.
 *
 * Terminal lead.won / lead.lost business events are emitted
 * by their own canonical event listeners below.
 *
 * This prevents duplicate realtime terminal notifications.
 */
export const emitLeadStatusUpdate = (
  lead,

  previousStatus = null
) => {
  if (!lead) {
    return false;
  }

  const leadId =
    getLeadId(
      lead
    );

  if (!leadId) {
    return false;
  }

  const organizationId =
    getOrganizationId(
      lead
    );

  const status =
    getValidLeadStatus(
      lead.status
    );

  const safePreviousStatus =
    LEAD_STATUSES.includes(
      previousStatus
    )
      ? previousStatus
      : LEAD_STATUSES.includes(
          lead.previousStatus
        )
      ? lead.previousStatus
      : null;

  const payload =
    buildLeadPayload(
      lead,

      {
        event:
          LEAD_EVENTS.LEAD_STATUS_CHANGED,

        previousStatus:
          safePreviousStatus,

        /*
         * Canonical field.
         */
        status,
      }
    );

  emitToOrganization(
    SOCKET_EVENTS.LEAD_STATUS_CHANGED,

    payload,

    organizationId
  );

  if (
    getAssignedAgentId(
      lead
    )
  ) {
    emitToAssignedAgent(
      SOCKET_EVENTS.LEAD_STATUS_CHANGED,

      payload,

      getAssignedAgentId(
        lead
      )
    );
  }

  console.log(
    `🔄 Lead status updated: ${leadId}`
  );

  console.log(
    "📌 Previous status:",
    safePreviousStatus
  );

  console.log(
    "📌 Current status:",
    status
  );

  return true;
};

/* ==========================================================
   LEAD ASSIGNED
========================================================== */

export const emitLeadAssigned = (
  lead,

  agent = null
) => {
  if (!lead) {
    console.log(
      "⚠️ Cannot broadcast assignment: lead missing."
    );

    return false;
  }

  const leadId =
    getLeadId(
      lead
    );

  if (!leadId) {
    console.log(
      "⚠️ Cannot broadcast assignment: lead ID missing."
    );

    return false;
  }

 const agentId =
  lead.assignedTo ||
  null;

  if (!agentId) {
    console.log(
      `⚠️ Lead ${leadId} has no assigned agent. Assignment event skipped.`
    );

    return false;
  }

  const organizationId =
    getOrganizationId(
      lead
    );

  const payload =
    buildLeadPayload(
      lead,

      {
        event:
          LEAD_EVENTS.LEAD_ASSIGNED,

        agentId:
          String(
            agentId
          ),

        agentName:
          agent?.name ||
          lead.agentName ||
          null,

        assignedAt:
          lead.assignedAt ||
          new Date(),

        assignedBy:
          lead.assignedBy ||
          null,

        assignedSource:
          lead.assignedSource ||
          "ai",
      }
    );

  emitToAssignedAgent(
    SOCKET_EVENTS.LEAD_ASSIGNED,

    payload,

    agentId
  );

  emitToOrganization(
    SOCKET_EVENTS.LEAD_ASSIGNED,

    payload,

    organizationId
  );

  /**
   * Assignment also means the organization's pipeline
   * should refresh.
   */
  emitToOrganization(
    SOCKET_EVENTS.LEAD_PIPELINE_UPDATED,

    payload,

    organizationId
  );

  console.log(
    `📦 Lead assigned → ${
      agent?.name ||
      agentId
    }`
  );

  console.log(
    "📌 Lead ID:",
    String(
      leadId
    )
  );

  console.log(
    "📌 Assignment source:",
    lead.assignedSource ||
      "ai"
  );

  return true;
};

/* ==========================================================
   LEAD UNASSIGNED
========================================================== */

export const emitLeadUnassigned = (
  lead
) => {
  if (!lead) {
    return false;
  }

  const leadId =
    getLeadId(
      lead
    );

  const organizationId =
    getOrganizationId(
      lead
    );

  if (!leadId) {
    return false;
  }

  const payload =
    buildLeadPayload(
      lead,

      {
        event:
          LEAD_EVENTS.LEAD_UNASSIGNED,
      }
    );

  emitToOrganization(
    SOCKET_EVENTS.LEAD_UNASSIGNED,

    payload,

    organizationId
  );

  return true;
};

/* ==========================================================
   PIPELINE UPDATED
========================================================== */

export const emitPipelineUpdate = (
  lead
) => {
  if (!lead) {
    return false;
  }

  const leadId =
    getLeadId(
      lead
    );

  if (!leadId) {
    return false;
  }

  const organizationId =
    getOrganizationId(
      lead
    );

  const payload =
    buildLeadPayload(
      lead,

      {
        event:
          LEAD_EVENTS.PIPELINE_UPDATED,
      }
    );

  emitToOrganization(
    SOCKET_EVENTS.LEAD_PIPELINE_UPDATED,

    payload,

    organizationId
  );

  if (
    getAssignedAgentId(
      lead
    )
  ) {
    emitToAssignedAgent(
      SOCKET_EVENTS.LEAD_PIPELINE_UPDATED,

      payload,

      getAssignedAgentId(
        lead
      )
    );
  }

  return true;
};

/* ==========================================================
   FOLLOW-UP UPDATED
========================================================== */

export const emitFollowUpUpdate = (
  lead
) => {
  if (!lead) {
    return false;
  }

  const leadId =
    getLeadId(
      lead
    );

  if (!leadId) {
    return false;
  }

  const organizationId =
    getOrganizationId(
      lead
    );

  const payload =
    buildLeadPayload(
      lead,

      {
        event:
          LEAD_EVENTS.LEAD_FOLLOWUP_UPDATED,
      }
    );

  emitToOrganization(
    SOCKET_EVENTS.LEAD_FOLLOWUP_UPDATED,

    payload,

    organizationId
  );

  if (
    getAssignedAgentId(
      lead
    )
  ) {
    emitToAssignedAgent(
      SOCKET_EVENTS.LEAD_FOLLOWUP_UPDATED,

      payload,

      getAssignedAgentId(
        lead
      )
    );
  }

  return true;
};

/* ==========================================================
   FOLLOW-UP DUE
========================================================== */

export const emitFollowUpDue = (
  lead
) => {
  if (!lead) {
    return false;
  }

  const leadId =
    getLeadId(
      lead
    );

  const organizationId =
    getOrganizationId(
      lead
    );

  if (!leadId) {
    return false;
  }

  const payload =
    buildLeadPayload(
      lead,

      {
        event:
          LEAD_EVENTS.LEAD_FOLLOWUP_DUE,
      }
    );

  emitToOrganization(
    SOCKET_EVENTS.LEAD_FOLLOWUP_DUE,

    payload,

    organizationId
  );

  if (
    getAssignedAgentId(
      lead
    )
  ) {
    emitToAssignedAgent(
      SOCKET_EVENTS.LEAD_FOLLOWUP_DUE,

      payload,

      getAssignedAgentId(
        lead
      )
    );
  }

  return true;
};

/* ==========================================================
   FOLLOW-UP COMPLETED
========================================================== */

export const emitFollowUpCompleted = (
  lead
) => {
  if (!lead) {
    return false;
  }

  const leadId =
    getLeadId(
      lead
    );

  const organizationId =
    getOrganizationId(
      lead
    );

  if (!leadId) {
    return false;
  }

  const payload =
    buildLeadPayload(
      lead,

      {
        event:
          LEAD_EVENTS.LEAD_FOLLOWUP_COMPLETED,
      }
    );

  emitToOrganization(
    SOCKET_EVENTS.LEAD_FOLLOWUP_COMPLETED,

    payload,

    organizationId
  );

  if (
    getAssignedAgentId(
      lead
    )
  ) {
    emitToAssignedAgent(
      SOCKET_EVENTS.LEAD_FOLLOWUP_COMPLETED,

      payload,

      getAssignedAgentId(
        lead
      )
    );
  }

  return true;
};

/* ==========================================================
   VIEWING REQUESTED
========================================================== */

export const emitViewingRequested = (
  lead
) => {
  if (!lead) {
    return false;
  }

  const leadId =
    getLeadId(
      lead
    );

  const organizationId =
    getOrganizationId(
      lead
    );

  if (!leadId) {
    return false;
  }

  const payload =
    buildLeadPayload(
      lead,

      {
        event:
          LEAD_EVENTS.LEAD_VIEWING_REQUESTED,
      }
    );

  emitToOrganization(
    SOCKET_EVENTS.LEAD_VIEWING_REQUESTED,

    payload,

    organizationId
  );

  if (
    getAssignedAgentId(
      lead
    )
  ) {
    emitToAssignedAgent(
      SOCKET_EVENTS.LEAD_VIEWING_REQUESTED,

      payload,

      getAssignedAgentId(
        lead
      )
    );
  }

  return true;
};

/* ==========================================================
   VIEWING CONFIRMED
========================================================== */

export const emitViewingConfirmed = (
  lead
) => {
  if (!lead) {
    return false;
  }

  const leadId =
    getLeadId(
      lead
    );

  const organizationId =
    getOrganizationId(
      lead
    );

  if (!leadId) {
    return false;
  }

  const payload =
    buildLeadPayload(
      lead,

      {
        event:
          LEAD_EVENTS.LEAD_VIEWING_CONFIRMED,
      }
    );

  emitToOrganization(
    SOCKET_EVENTS.LEAD_VIEWING_CONFIRMED,

    payload,

    organizationId
  );

  if (
    getAssignedAgentId(
      lead
    )
  ) {
    emitToAssignedAgent(
      SOCKET_EVENTS.LEAD_VIEWING_CONFIRMED,

      payload,

      getAssignedAgentId(
        lead
      )
    );
  }

  return true;
};

/* ==========================================================
   VIEWING COMPLETED
========================================================== */

export const emitViewingCompleted = (
  lead
) => {
  if (!lead) {
    return false;
  }

  const leadId =
    getLeadId(
      lead
    );

  const organizationId =
    getOrganizationId(
      lead
    );

  if (!leadId) {
    return false;
  }

  const payload =
    buildLeadPayload(
      lead,

      {
        event:
          LEAD_EVENTS.LEAD_VIEWING_COMPLETED,
      }
    );

  emitToOrganization(
    SOCKET_EVENTS.LEAD_VIEWING_COMPLETED,

    payload,

    organizationId
  );

  if (
    getAssignedAgentId(
      lead
    )
  ) {
    emitToAssignedAgent(
      SOCKET_EVENTS.LEAD_VIEWING_COMPLETED,

      payload,

      getAssignedAgentId(
        lead
      )
    );
  }

  return true;
};

/* ==========================================================
   VIEWING CANCELLED
========================================================== */

export const emitViewingCancelled = (
  lead
) => {
  if (!lead) {
    return false;
  }

  const leadId =
    getLeadId(
      lead
    );

  const organizationId =
    getOrganizationId(
      lead
    );

  if (!leadId) {
    return false;
  }

  const payload =
    buildLeadPayload(
      lead,

      {
        event:
          LEAD_EVENTS.LEAD_VIEWING_CANCELLED,
      }
    );

  emitToOrganization(
    SOCKET_EVENTS.LEAD_VIEWING_CANCELLED,

    payload,

    organizationId
  );

  if (
    getAssignedAgentId(
      lead
    )
  ) {
    emitToAssignedAgent(
      SOCKET_EVENTS.LEAD_VIEWING_CANCELLED,

      payload,

      getAssignedAgentId(
        lead
      )
    );
  }

  return true;
};

/* ==========================================================
   CONVERSATION UPDATED
========================================================== */

export const emitConversationUpdated = (
  payload
) => {
  if (!payload) {
    return false;
  }

  const organizationId =
    getOrganizationId(
      payload
    );

  const conversationId =
    payload.conversationId ||
    payload.conversation?._id ||
    payload.conversation?.id ||
    null;

  if (!conversationId) {
    return false;
  }

  const normalizedPayload = {
    ...payload,

    conversationId:
      String(
        conversationId
      ),

    organizationId:
      organizationId
        ? String(
            organizationId
          )
        : null,
  };

  if (
    organizationId
  ) {
    emitToOrganization(
      SOCKET_EVENTS.CONVERSATION_UPDATED,

      normalizedPayload,

      organizationId
    );
  }

  return true;
};

/* ==========================================================
   INTERNAL EVENT BUS LISTENERS
========================================================== */

/*
 * IMPORTANT
 *
 * This service listens ONLY to canonical business events.
 *
 * It does NOT listen to:
 *
 *   legacy UI labels
 *   HOT_LEAD business events
 *   legacy pipeline event names
 *   legacy conversation event names
 *
 * HOT_LEAD remains a transport notification only and is
 * generated from the canonical lead.scored event.
 */

const registerLeadEventListeners =
  () => {
    if (
      listenersRegistered
    ) {
      return;
    }

    /* ======================================================
       LEAD CREATED
    ====================================================== */

    if (
      LEAD_EVENTS?.LEAD_CREATED
    ) {
      leadEventBus.on(
        LEAD_EVENTS.LEAD_CREATED,

        emitNewLead
      );
    }

    /* ======================================================
       LEAD UPDATED
    ====================================================== */

    if (
      LEAD_EVENTS?.LEAD_UPDATED
    ) {
      leadEventBus.on(
        LEAD_EVENTS.LEAD_UPDATED,

        emitLeadUpdated
      );
    }

    /* ======================================================
       LEAD SCORED
    ====================================================== */

    if (
      LEAD_EVENTS?.LEAD_SCORED
    ) {
      leadEventBus.on(
        LEAD_EVENTS.LEAD_SCORED,

        emitLeadScored
      );
    }

    /* ======================================================
       LEAD STATUS CHANGED
    ====================================================== */

    if (
      LEAD_EVENTS?.LEAD_STATUS_CHANGED
    ) {
      leadEventBus.on(
        LEAD_EVENTS.LEAD_STATUS_CHANGED,

        (payload) =>
          emitLeadStatusUpdate(
            payload,

            payload?.previousStatus ||
              null
          )
      );
    }

    /* ======================================================
       LEAD ASSIGNED
    ====================================================== */

    if (
      LEAD_EVENTS?.LEAD_ASSIGNED
    ) {
      leadEventBus.on(
        LEAD_EVENTS.LEAD_ASSIGNED,

        (eventPayload) => {
          const lead = eventPayload?.lead;

          if (!lead) {
      console.error(
        "[REALTIME] Invalid lead.assigned event: nested lead is missing.",
        {
          eventId: eventPayload?.eventId || null,
          leadId: eventPayload?.leadId || null,
        }
      );

            return false;
          }

    const eventOrganizationId =
      eventPayload.organizationId == null
        ? null
        : String(eventPayload.organizationId);

    const leadOrganizationId =
      lead.organizationId == null
        ? null
        : String(lead.organizationId);

    if (
      !eventOrganizationId ||
      !leadOrganizationId ||
      eventOrganizationId !== leadOrganizationId
    ) {
      console.error(
        "[REALTIME] Rejected lead.assigned event: organization mismatch.",
        {
          eventId: eventPayload.eventId || null,
          eventOrganizationId,
          leadOrganizationId,
        }
      );

      return false;
    }

    const eventAgentId =
      eventPayload.agentId == null
        ? null
        : String(eventPayload.agentId);

    const eventAssignedTo =
      eventPayload.assignedTo == null
        ? null
        : String(eventPayload.assignedTo);

    const leadAssignedTo =
      lead.assignedTo == null
        ? null
        : String(lead.assignedTo);

    if (
      !eventAgentId ||
      !eventAssignedTo ||
      !leadAssignedTo ||
      eventAgentId !== eventAssignedTo ||
      eventAgentId !== leadAssignedTo
    ) {
      console.error(
        "[REALTIME] Rejected lead.assigned event: assignment mismatch.",
        {
          eventId: eventPayload.eventId || null,
          leadId: eventPayload.leadId || null,
          eventAgentId,
          eventAssignedTo,
          leadAssignedTo,
        }
      );

      return false;
    }

    return emitLeadAssigned(lead);
  }
);
    }

    /* ======================================================
       LEAD UNASSIGNED
    ====================================================== */

    if (
      LEAD_EVENTS?.LEAD_UNASSIGNED
    ) {
      leadEventBus.on(
        LEAD_EVENTS.LEAD_UNASSIGNED,

        emitLeadUnassigned
      );
    }

    /* ======================================================
       PIPELINE UPDATED
    ====================================================== */

    if (
      LEAD_EVENTS?.PIPELINE_UPDATED
    ) {
      leadEventBus.on(
        LEAD_EVENTS.PIPELINE_UPDATED,

        emitPipelineUpdate
      );
    }

    /* ======================================================
       FOLLOW-UP DUE
    ====================================================== */

    if (
      LEAD_EVENTS?.LEAD_FOLLOWUP_DUE
    ) {
      leadEventBus.on(
        LEAD_EVENTS.LEAD_FOLLOWUP_DUE,

        emitFollowUpDue
      );
    }

    /* ======================================================
       FOLLOW-UP UPDATED
    ====================================================== */

    if (
      LEAD_EVENTS?.LEAD_FOLLOWUP_UPDATED
    ) {
      leadEventBus.on(
        LEAD_EVENTS.LEAD_FOLLOWUP_UPDATED,

        emitFollowUpUpdate
      );
    }

    /* ======================================================
       FOLLOW-UP COMPLETED
    ====================================================== */

    if (
      LEAD_EVENTS?.LEAD_FOLLOWUP_COMPLETED
    ) {
      leadEventBus.on(
        LEAD_EVENTS.LEAD_FOLLOWUP_COMPLETED,

        emitFollowUpCompleted
      );
    }

    /* ======================================================
       VIEWING REQUESTED
    ====================================================== */

    if (
      LEAD_EVENTS?.LEAD_VIEWING_REQUESTED
    ) {
      leadEventBus.on(
        LEAD_EVENTS.LEAD_VIEWING_REQUESTED,

        emitViewingRequested
      );
    }

    /* ======================================================
       VIEWING CONFIRMED
    ====================================================== */

    if (
      LEAD_EVENTS?.LEAD_VIEWING_CONFIRMED
    ) {
      leadEventBus.on(
        LEAD_EVENTS.LEAD_VIEWING_CONFIRMED,

        emitViewingConfirmed
      );
    }

    /* ======================================================
       VIEWING COMPLETED
    ====================================================== */

    if (
      LEAD_EVENTS?.LEAD_VIEWING_COMPLETED
    ) {
      leadEventBus.on(
        LEAD_EVENTS.LEAD_VIEWING_COMPLETED,

        emitViewingCompleted
      );
    }

    /* ======================================================
       VIEWING CANCELLED
    ====================================================== */

    if (
      LEAD_EVENTS?.LEAD_VIEWING_CANCELLED
    ) {
      leadEventBus.on(
        LEAD_EVENTS.LEAD_VIEWING_CANCELLED,

        emitViewingCancelled
      );
    }

    /* ======================================================
       WON
    ====================================================== */

    if (
      LEAD_EVENTS?.LEAD_WON
    ) {
      leadEventBus.on(
        LEAD_EVENTS.LEAD_WON,

        (payload) => {
          const organizationId =
            getOrganizationId(
              payload
            );

          const normalizedPayload =
            buildLeadPayload(
              payload,

              {
                event:
                  LEAD_EVENTS.LEAD_WON,

                status:
                  LEAD_STATUS.WON,
              }
            );

          emitToOrganization(
            SOCKET_EVENTS.LEAD_WON,

            normalizedPayload,

            organizationId
          );

          if (
            getAssignedAgentId(
              payload
            )
          ) {
            emitToAssignedAgent(
              SOCKET_EVENTS.LEAD_WON,

              normalizedPayload,

              getAssignedAgentId(
                payload
              )
            );
          }
        }
      );
    }

    /* ======================================================
       LOST
    ====================================================== */

    if (
      LEAD_EVENTS?.LEAD_LOST
    ) {
      leadEventBus.on(
        LEAD_EVENTS.LEAD_LOST,

        (payload) => {
          const organizationId =
            getOrganizationId(
              payload
            );

          const normalizedPayload =
            buildLeadPayload(
              payload,

              {
                event:
                  LEAD_EVENTS.LEAD_LOST,

                status:
                  LEAD_STATUS.LOST,
              }
            );

          emitToOrganization(
            SOCKET_EVENTS.LEAD_LOST,

            normalizedPayload,

            organizationId
          );

          if (
            getAssignedAgentId(
              payload
            )
          ) {
            emitToAssignedAgent(
              SOCKET_EVENTS.LEAD_LOST,

              normalizedPayload,

              getAssignedAgentId(
                payload
              )
            );
          }
        }
      );
    }

    /* ======================================================
       CONVERSATION UPDATED
    ====================================================== */

    if (
      LEAD_EVENTS?.CONVERSATION_UPDATED
    ) {
      leadEventBus.on(
        LEAD_EVENTS.CONVERSATION_UPDATED,

        emitConversationUpdated
      );
    }

    listenersRegistered =
      true;

    console.log(
      "🔌 LeadFlow AI canonical realtime event listeners registered."
    );
  };

/* ==========================================================
   REGISTER LISTENERS
========================================================== */

registerLeadEventListeners();

/* ==========================================================
   DEFAULT EXPORT
========================================================== */

export default {
  initRealtimeEngine,

  isRealtimeReady,

  emitLeadAssigned,

  emitLeadUnassigned,

  emitNewLead,

  emitLeadUpdated,

  emitLeadScored,

  emitPipelineUpdate,

  emitLeadStatusUpdate,

  emitFollowUpUpdate,

  emitFollowUpDue,

  emitFollowUpCompleted,

  emitViewingRequested,

  emitViewingConfirmed,

  emitViewingCompleted,

  emitViewingCancelled,

  emitConversationUpdated,
};