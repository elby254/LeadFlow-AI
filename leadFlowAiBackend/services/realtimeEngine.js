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
 * ✓ Broadcast lead events
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
 * This file ONLY broadcasts state changes.
 *
 * ==========================================================
 *
 * LEAD STATUS SOURCE OF TRUTH
 * ----------------------------------------------------------
 *
 * Lead.status MUST use the existing Lead schema enum:
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
 * ----------------------------------------------------------
 *
 * The following are NOT Lead.status values:
 *
 *   hot
 *   viewing_requested
 *   viewing_scheduled
 *   follow_up
 *   closed
 *   closed_lost
 *
 * They are represented through other Lead fields:
 *
 * HOT:
 *   score >= 70
 *
 * VIEWING:
 *   viewingStatus
 *
 * FOLLOW-UP:
 *   followUpStatus
 *
 * SUCCESSFUL CONVERSION:
 *   status === "won"
 *
 * LOST CONVERSION:
 *   status === "lost"
 *
 * ==========================================================
 */

import leadEventBus, {
  LEAD_EVENTS,
} from "../events/leadEvents.js";


// ==========================================================
// SOCKET.IO INSTANCE
// ==========================================================

let ioInstance = null;


// ==========================================================
// EVENT LISTENER REGISTRATION STATE
// ==========================================================

let listenersRegistered = false;


// ==========================================================
// EXISTING LEAD STATUS ENUM
// ==========================================================
//
// Keep this synchronized with the existing Lead model.
//
// ==========================================================

const LEAD_STATUSES = [
  "new",
  "contacted",
  "qualified",
  "viewing",
  "negotiation",
  "won",
  "lost",
];


// ==========================================================
// VIEWING STATUS VALUES
// ==========================================================
//
// These belong to Lead.viewingStatus.
//
// They are NOT Lead.status values.
//
// ==========================================================

const VIEWING_STATUSES = [
  "none",
  "requested",
  "approved",
  "scheduled",
  "rescheduled",
  "cancelled",
  "completed",
];


// ==========================================================
// VALIDATE LEAD STATUS
// ==========================================================
//
// Realtime events must never broadcast an invented Lead.status.
//
// If a malformed value somehow reaches this service, safely
// fall back to "new".
//
// ==========================================================

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

  return "new";
};


// ==========================================================
// VALIDATE VIEWING STATUS
// ==========================================================
//
// viewingStatus is separate from Lead.status.
//
// ==========================================================

const getValidViewingStatus = (
  status
) => {

  if (
    VIEWING_STATUSES.includes(
      status
    )
  ) {

    return status;
  }

  return "none";
};


// ==========================================================
// GET HOT STATE
// ==========================================================
//
// HOT is derived from score.
//
// It is NOT a Lead.status value.
//
// ==========================================================

const getIsHotLead = (
  lead
) => {

  return (
    Number(
      lead?.score || 0
    ) >= 70
  );
};


// ==========================================================
// INITIALIZE REALTIME ENGINE
// ==========================================================

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


// ==========================================================
// CHECK SOCKET STATUS
// ==========================================================

export const isRealtimeReady = () => {

  return Boolean(
    ioInstance
  );
};


// ==========================================================
// SAFE SOCKET EMITTER
// ==========================================================

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

    if (room) {

      ioInstance
        .to(room)
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


// ==========================================================
// ORGANIZATION ROOM
// ==========================================================

const getOrganizationRoom = (
  organizationId
) => {

  if (!organizationId) {

    return null;
  }

  return `organization:${String(
    organizationId
  )}`;
};


// ==========================================================
// AGENT ROOM
// ==========================================================

const getAgentRoom = (
  agentId
) => {

  if (!agentId) {

    return null;
  }

  return `agent:${String(
    agentId
  )}`;
};


// ==========================================================
// EXTRACT LEAD ID
// ==========================================================

const getLeadId = (
  lead
) => {

  if (!lead) {

    return null;
  }

  return (
    lead._id ||
    lead.id ||
    null
  );
};


// ==========================================================
// EXTRACT ORGANIZATION ID
// ==========================================================

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


// ==========================================================
// LEAD ASSIGNED
// ==========================================================
//
// Called after the assignment service has successfully
// persisted the final assignment.
//
// ==========================================================

export const emitLeadAssigned = (
  lead,
  agent
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
    agent?._id ||
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


  const assignmentPayload = {

    leadId:
      String(
        leadId
      ),

    agentId:
      String(
        agentId
      ),

    agentName:
      agent?.name ||
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

    score:
      Number(
        lead.score || 0
      ),

    // ======================================================
    // IMPORTANT
    // ======================================================
    //
    // Always use a valid Lead.status.
    //
    status:
      getValidLeadStatus(
        lead.status
      ),

    // ======================================================
    // DERIVED HOT STATE
    // ======================================================

    isHot:
      getIsHotLead(
        lead
      ),

    // ======================================================
    // VIEWING STATE
    // ======================================================

    viewingStatus:
      getValidViewingStatus(
        lead.viewingStatus
      ),

    // ======================================================
    // FOLLOW-UP STATE
    // ======================================================

    followUpStatus:
      lead.followUpStatus ||
      null,

    organizationId:
      organizationId
        ? String(
            organizationId
          )
        : null,
  };


  // ========================================================
  // AGENT ROOM
  // ========================================================

  const agentRoom =
    getAgentRoom(
      agentId
    );


  if (agentRoom) {

    emit(
      "LEAD_ASSIGNED",
      assignmentPayload,
      agentRoom
    );
  }


  // ========================================================
  // ORGANIZATION ROOM
  // ========================================================

  const organizationRoom =
    getOrganizationRoom(
      organizationId
    );


  if (organizationRoom) {

    emit(
      "PIPELINE_UPDATE",

      {
        id:
          String(
            leadId
          ),

        leadId:
          String(
            leadId
          ),

        // ==================================================
        // EXISTING LEAD STATUS ENUM ONLY
        // ==================================================

        status:
          getValidLeadStatus(
            lead.status
          ),

        // ==================================================
        // DERIVED HOT STATE
        // ==================================================

        isHot:
          getIsHotLead(
            lead
          ),

        score:
          Number(
            lead.score || 0
          ),

        assignedTo:
          String(
            agentId
          ),

        assignedAt:
          lead.assignedAt ||
          null,

        assignedSource:
          lead.assignedSource ||
          "ai",

        viewingStatus:
          getValidViewingStatus(
            lead.viewingStatus
          ),

        followUpStatus:
          lead.followUpStatus ||
          null,

        organizationId:
          String(
            organizationId
          ),
      },

      organizationRoom
    );
  }


  console.log(
    `📦 Lead assigned → ${agent?.name || agentId}`
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

  console.log(
    "📌 Lead status:",
    getValidLeadStatus(
      lead.status
    )
  );

  console.log(
    "📌 Organization:",
    organizationId
  );


  return true;
};


// ==========================================================
// NEW LEAD EVENT
// ==========================================================

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


  const organizationId =
    getOrganizationId(
      lead
    );


  if (!leadId) {

    return false;
  }


  const payload = {

    leadId:
      String(
        leadId
      ),

    name:
      lead.name ||
      "Unknown",

    phone:
      lead.phone ||
      null,

    // ======================================================
    // EXISTING LEAD STATUS ENUM ONLY
    // ======================================================

    status:
      getValidLeadStatus(
        lead.status
      ),

    score:
      Number(
        lead.score || 0
      ),

    // ======================================================
    // DERIVED HOT STATE
    // ======================================================

    isHot:
      getIsHotLead(
        lead
      ),

    assignedTo:
      lead.assignedTo
        ? String(
            lead.assignedTo
          )
        : null,

    // ======================================================
    // VIEWING
    // ======================================================

    viewingStatus:
      getValidViewingStatus(
        lead.viewingStatus
      ),

    // ======================================================
    // FOLLOW-UP
    // ======================================================

    followUpStatus:
      lead.followUpStatus ||
      null,

    organizationId:
      organizationId
        ? String(
            organizationId
          )
        : null,

    createdAt:
      lead.createdAt ||
      new Date(),
  };


  const organizationRoom =
    getOrganizationRoom(
      organizationId
    );


  if (organizationRoom) {

    emit(
      "NEW_LEAD",
      payload,
      organizationRoom
    );
  }


  console.log(
    `🆕 New lead broadcasted: ${leadId}`
  );


  return true;
};


// ==========================================================
// HOT LEAD EVENT
// ==========================================================
//
// IMPORTANT
// ----------------------------------------------------------
//
// "HOT" is an event name, not a Lead.status value.
//
// The payload therefore keeps:
//
// status = actual Lead.status
//
// and:
//
// isHot = true
//
// ==========================================================

export const emitHotLead = (
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


  const payload = {

    leadId:
      String(
        leadId
      ),

    name:
      lead.name ||
      "Unknown",

    score:
      Number(
        lead.score || 0
      ),

    // ======================================================
    // EXISTING LEAD STATUS ENUM ONLY
    // ======================================================

    status:
      getValidLeadStatus(
        lead.status
      ),

    // ======================================================
    // EXPLICIT HOT FLAG
    // ======================================================

    isHot:
      true,

    assignedTo:
      lead.assignedTo
        ? String(
            lead.assignedTo
          )
        : null,

    // ======================================================
    // VIEWING STATE
    // ======================================================

    viewingStatus:
      getValidViewingStatus(
        lead.viewingStatus
      ),

    // ======================================================
    // FOLLOW-UP STATE
    // ======================================================

    followUpStatus:
      lead.followUpStatus ||
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
  };


  // ========================================================
  // ORGANIZATION
  // ========================================================

  const organizationRoom =
    getOrganizationRoom(
      organizationId
    );


  if (organizationRoom) {

    emit(
      "HOT_LEAD",
      payload,
      organizationRoom
    );
  }


  // ========================================================
  // ASSIGNED AGENT
  // ========================================================

  if (
    lead.assignedTo
  ) {

    const agentRoom =
      getAgentRoom(
        lead.assignedTo
      );


    if (agentRoom) {

      emit(
        "HOT_LEAD",
        payload,
        agentRoom
      );
    }
  }


  console.log(
    `🔥 Hot lead broadcasted: ${leadId}`
  );


  console.log(
    "📌 Lead status:",
    getValidLeadStatus(
      lead.status
    )
  );


  console.log(
    "📌 Lead score:",
    Number(
      lead.score || 0
    )
  );


  return true;
};


// ==========================================================
// PIPELINE UPDATE
// ==========================================================

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


  const organizationId =
    getOrganizationId(
      lead
    );


  if (!leadId) {

    return false;
  }


  const payload = {

    id:
      String(
        leadId
      ),

    leadId:
      String(
        leadId
      ),

    // ======================================================
    // EXISTING LEAD STATUS ENUM ONLY
    // ======================================================

    status:
      getValidLeadStatus(
        lead.status
      ),

    // ======================================================
    // DERIVED HOT STATE
    // ======================================================

    isHot:
      getIsHotLead(
        lead
      ),

    score:
      Number(
        lead.score || 0
      ),

    assignedTo:
      lead.assignedTo
        ? String(
            lead.assignedTo
          )
        : null,

    assignedSource:
      lead.assignedSource ||
      null,

    assignedAt:
      lead.assignedAt ||
      null,

    // ======================================================
    // VIEWING STATE
    // ======================================================

    viewingStatus:
      getValidViewingStatus(
        lead.viewingStatus
      ),

    // ======================================================
    // FOLLOW-UP STATE
    // ======================================================

    nextFollowUpDate:
      lead.nextFollowUpDate ||
      null,

    followUpStatus:
      lead.followUpStatus ||
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

    updatedAt:
      lead.updatedAt ||
      new Date(),
  };


  // ========================================================
  // ORGANIZATION
  // ========================================================

  const organizationRoom =
    getOrganizationRoom(
      organizationId
    );


  if (organizationRoom) {

    emit(
      "PIPELINE_UPDATE",
      payload,
      organizationRoom
    );
  }


  // ========================================================
  // ASSIGNED AGENT
  // ========================================================

  if (
    lead.assignedTo
  ) {

    const agentRoom =
      getAgentRoom(
        lead.assignedTo
      );


    if (agentRoom) {

      emit(
        "PIPELINE_UPDATE",
        payload,
        agentRoom
      );
    }
  }


  return true;
};


// ==========================================================
// LEAD STATUS UPDATE
// ==========================================================
//
// This event is specifically for changes to Lead.status.
//
// Only values from the existing Lead schema enum are allowed.
//
// ==========================================================

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


  const organizationId =
    getOrganizationId(
      lead
    );


  if (!leadId) {

    return false;
  }


  const payload = {

    leadId:
      String(
        leadId
      ),

    // ======================================================
    // PREVIOUS STATUS
    // ======================================================

    previousStatus:
      LEAD_STATUSES.includes(
        previousStatus
      )
        ? previousStatus
        : null,

    // ======================================================
    // CURRENT STATUS
    // ======================================================

    status:
      getValidLeadStatus(
        lead.status
      ),

    // ======================================================
    // DERIVED HOT STATE
    // ======================================================

    isHot:
      getIsHotLead(
        lead
      ),

    score:
      Number(
        lead.score || 0
      ),

    assignedTo:
      lead.assignedTo
        ? String(
            lead.assignedTo
          )
        : null,

    // ======================================================
    // VIEWING STATE
    // ======================================================

    viewingStatus:
      getValidViewingStatus(
        lead.viewingStatus
      ),

    // ======================================================
    // FOLLOW-UP STATE
    // ======================================================

    followUpStatus:
      lead.followUpStatus ||
      null,

    organizationId:
      organizationId
        ? String(
            organizationId
          )
        : null,

    updatedAt:
      lead.updatedAt ||
      new Date(),
  };


  const organizationRoom =
    getOrganizationRoom(
      organizationId
    );


  if (organizationRoom) {

    emit(
      "LEAD_STATUS_UPDATED",
      payload,
      organizationRoom
    );
  }


  if (
    lead.assignedTo
  ) {

    const agentRoom =
      getAgentRoom(
        lead.assignedTo
      );


    if (agentRoom) {

      emit(
        "LEAD_STATUS_UPDATED",
        payload,
        agentRoom
      );
    }
  }


  console.log(
    `🔄 Lead status updated: ${leadId}`
  );


  console.log(
    "📌 Previous status:",
    previousStatus
  );


  console.log(
    "📌 Current status:",
    getValidLeadStatus(
      lead.status
    )
  );


  return true;
};


// ==========================================================
// FOLLOW-UP UPDATE
// ==========================================================
//
// Follow-up information belongs to Lead follow-up fields.
//
// It does NOT modify Lead.status.
//
// ==========================================================

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


  const organizationId =
    getOrganizationId(
      lead
    );


  if (!leadId) {

    return false;
  }


  const payload = {

    leadId:
      String(
        leadId
      ),

    nextFollowUpDate:
      lead.nextFollowUpDate ||
      null,

    nextAction:
      lead.nextAction ||
      null,

    followUpStatus:
      lead.followUpStatus ||
      null,

    lastContact:
      lead.lastContact ||
      null,

    // ======================================================
    // CURRENT LEAD STATUS
    // ======================================================

    status:
      getValidLeadStatus(
        lead.status
      ),

    // ======================================================
    // HOT STATE
    // ======================================================

    isHot:
      getIsHotLead(
        lead
      ),

    // ======================================================
    // VIEWING STATE
    // ======================================================

    viewingStatus:
      getValidViewingStatus(
        lead.viewingStatus
      ),

    organizationId:
      organizationId
        ? String(
            organizationId
          )
        : null,
  };


  const organizationRoom =
    getOrganizationRoom(
      organizationId
    );


  if (organizationRoom) {

    emit(
      "FOLLOW_UP_UPDATED",
      payload,
      organizationRoom
    );
  }


  if (
    lead.assignedTo
  ) {

    const agentRoom =
      getAgentRoom(
        lead.assignedTo
      );


    if (agentRoom) {

      emit(
        "FOLLOW_UP_UPDATED",
        payload,
        agentRoom
      );
    }
  }


  return true;
};


// ==========================================================
// INTERNAL EVENT BUS LISTENERS
// ==========================================================
//
// Register ONLY ONCE.
//
// ==========================================================

const registerLeadEventListeners = () => {

  if (
    listenersRegistered
  ) {

    return;
  }


  // ========================================================
  // NEW LEAD
  // ========================================================

  if (
    LEAD_EVENTS?.NEW_LEAD
  ) {

    leadEventBus.on(
      LEAD_EVENTS.NEW_LEAD,
      emitNewLead
    );
  }


  // ========================================================
  // HOT LEAD
  // ========================================================

  if (
    LEAD_EVENTS?.HOT_LEAD
  ) {

    leadEventBus.on(
      LEAD_EVENTS.HOT_LEAD,
      emitHotLead
    );
  }


  // ========================================================
  // PIPELINE UPDATE
  // ========================================================

  if (
    LEAD_EVENTS?.PIPELINE_UPDATE
  ) {

    leadEventBus.on(
      LEAD_EVENTS.PIPELINE_UPDATE,
      emitPipelineUpdate
    );
  }


  listenersRegistered =
    true;


  console.log(
    "🔌 Lead realtime event listeners registered."
  );
};


// ==========================================================
// REGISTER LISTENERS
// ==========================================================

registerLeadEventListeners();


// ==========================================================
// DEFAULT EXPORT
// ==========================================================

export default {

  initRealtimeEngine,

  isRealtimeReady,

  emitLeadAssigned,

  emitNewLead,

  emitHotLead,

  emitPipelineUpdate,

  emitLeadStatusUpdate,

  emitFollowUpUpdate,
};