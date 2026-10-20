// =====================================================
//
// PURPOSE
// -----------------------------------------------------
// Central internal event contract for LeadFlow AI.
//
// This file defines the canonical business events used
// across the backend.
//
// Used by:
// ✓ Lead controllers
// ✓ Agent workflows
// ✓ Admin workflows
// ✓ Lead lifecycle workflow
// ✓ Lead scoring workflow
// ✓ Assignment workflow
// ✓ Viewing workflow
// ✓ Follow-up workflow
// ✓ Dashboard listeners
// ✓ Notification systems
// ✓ Realtime pipeline updates
// ✓ Outbox / worker infrastructure
//
// IMPORTANT
// -----------------------------------------------------
// This file does NOT perform:
//
// ✗ Authentication
// ✗ Authorization
// ✗ Role checks
// ✗ Organization checks
// ✗ Database operations
// ✗ Lifecycle decisions
// ✗ Score calculations
//
// Those responsibilities belong to the appropriate
// middleware, controllers and services.
//
// =====================================================

import EventEmitter from "events";

// =====================================================
// LEAD EVENT BUS
// =====================================================
//
// A single application-level EventEmitter instance.
//
// Business services/controllers emit canonical events:
//
// leadEventBus.emit(
//   LEAD_EVENTS.LEAD_CREATED,
//   payload
// );
//
// Other backend services can subscribe:
//
// leadEventBus.on(
//   LEAD_EVENTS.LEAD_CREATED,
//   (payload) => {
//     ...
//   }
// );
//
// =====================================================

class LeadEventBus extends EventEmitter {}

// Single shared event bus for the application.

const leadEventBus = new LeadEventBus();


// =====================================================
// CANONICAL EVENT TYPES
// =====================================================
//
// IMPORTANT
// -----------------------------------------------------
//
// Event names describe BUSINESS FACTS.
//
// They do NOT represent:
//
// ✗ arbitrary UI labels
// ✗ score categories as lifecycle states
// ✗ database implementation details
//
// =====================================================

export const LEAD_EVENTS = Object.freeze({

  // ===================================================
  // LEAD CREATION
  // ===================================================

  /**
   * A new Lead document has been created.
   *
   * Meaning:
   *   A previously unknown lead now exists.
   */
  LEAD_CREATED: "lead.created",


  // ===================================================
  // GENERIC LEAD UPDATE
  // ===================================================

  /**
   * A lead has been updated.
   *
   * Meaning:
   *   One or more non-specific lead fields changed.
   *
   * This is a broad synchronization event.
   */
  LEAD_UPDATED: "lead.updated",


  // ===================================================
  // LIFECYCLE
  // ===================================================

  /**
   * Lead.status changed.
   *
   * Payload should contain:
   *
   * {
   *   leadId,
   *   organizationId,
   *   previousStatus,
   *   status,
   *   ...
   * }
   *
   * IMPORTANT:
   *
   * The canonical property is `status`.
   *
   * Do NOT introduce:
   *
   *   newStatus
   *
   * as an alternative lifecycle field.
   */
  LEAD_STATUS_CHANGED: "lead.status.changed",


  // ===================================================
  // SCORING
  // ===================================================

  /**
   * Lead.score changed.
   *
   * IMPORTANT:
   *
   * This does NOT mean:
   *
   *   status = "hot"
   *
   * Score and lifecycle are separate dimensions.
   *
   * Payload should contain:
   *
   * {
   *   leadId,
   *   organizationId,
   *   previousScore,
   *   score,
   *   previousCategory,
   *   category,
   *   ...
   * }
   */
  LEAD_SCORED: "lead.scored",


  // ===================================================
  // ASSIGNMENT
  // ===================================================

  /**
   * Lead assignment changed.
   *
   * Payload should contain:
   *
   * {
   *   leadId,
   *   organizationId,
   *   previousAgentId,
   *   agentId,
   *   source,
   *   ...
   * }
   *
   * IMPORTANT:
   *
   * Reassignment is represented by this event as well.
   *
   * Example:
   *
   * previousAgentId = "agent-A"
   * agentId         = "agent-B"
   *
   * There is no requirement to emit an artificial
   * LEAD_UNASSIGNED event during reassignment.
   */
  LEAD_ASSIGNED: "lead.assigned",


  /**
   * Lead assignment was removed without assigning
   * a replacement agent.
   */
  LEAD_UNASSIGNED: "lead.unassigned",


  // ===================================================
  // FOLLOW-UP
  // ===================================================

  /**
   * A follow-up action became due.
   *
   * This is an actionable workflow event.
   */
  LEAD_FOLLOWUP_DUE: "lead.followup.due",


  /**
   * Follow-up state changed.
   *
   * Examples:
   *
   * pending
   * scheduled
   * completed
   * cancelled
   */
  LEAD_FOLLOWUP_UPDATED: "lead.followup.updated",


  /**
   * Follow-up was completed with an outcome.
   */
  LEAD_FOLLOWUP_COMPLETED: "lead.followup.completed",


  // ===================================================
  // VIEWING WORKFLOW
  // ===================================================

  /**
   * Customer requested a property viewing.
   *
   * This does NOT independently define Lead.status.
   *
   * The lifecycle service determines whether and how
   * Lead.status transitions.
   *
   * The viewing workflow owns the actual viewing state.
   */
  LEAD_VIEWING_REQUESTED: "lead.viewing.requested",


  /**
   * A viewing became confirmed/scheduled.
   */
  LEAD_VIEWING_CONFIRMED: "lead.viewing.confirmed",


  /**
   * A viewing was completed.
   */
  LEAD_VIEWING_COMPLETED: "lead.viewing.completed",


  /**
   * A viewing was cancelled.
   */
  LEAD_VIEWING_CANCELLED: "lead.viewing.cancelled",


  // ===================================================
  // CONVERSION
  // ===================================================

  /**
   * Lead reached successful conversion.
   *
   * Canonical Lead.status:
   *
   *   won
   */
  LEAD_WON: "lead.won",


  /**
   * Lead reached unsuccessful terminal outcome.
   *
   * Canonical Lead.status:
   *
   *   lost
   */
  LEAD_LOST: "lead.lost",


  // ===================================================
  // CONVERSATION
  // ===================================================

  /**
   * Conversation changed.
   *
   * Conversation state is separate from Lead.status.
   */
  CONVERSATION_UPDATED: "conversation.updated",


  // ===================================================
  // PIPELINE / READ MODEL SYNCHRONIZATION
  // ===================================================

  /**
   * Lead pipeline data changed.
   *
   * This is a synchronization event for:
   *
   * ✓ dashboard
   * ✓ realtime consumers
   * ✓ read models
   *
   * It is NOT a replacement for the more specific
   * business events above.
   */
  PIPELINE_UPDATED: "lead.pipeline.updated",
});


// =====================================================
// CANONICAL EVENT GROUPS
// =====================================================
//
// These groups make it easier for consumers to subscribe
// to related event families without inventing their own
// event terminology.
//
// =====================================================

export const LEAD_LIFECYCLE_EVENTS = Object.freeze([
  LEAD_EVENTS.LEAD_CREATED,
  LEAD_EVENTS.LEAD_STATUS_CHANGED,
  LEAD_EVENTS.LEAD_WON,
  LEAD_EVENTS.LEAD_LOST,
]);


export const LEAD_SCORING_EVENTS = Object.freeze([
  LEAD_EVENTS.LEAD_SCORED,
]);


export const LEAD_ASSIGNMENT_EVENTS = Object.freeze([
  LEAD_EVENTS.LEAD_ASSIGNED,
  LEAD_EVENTS.LEAD_UNASSIGNED,
]);


export const LEAD_FOLLOWUP_EVENTS = Object.freeze([
  LEAD_EVENTS.LEAD_FOLLOWUP_DUE,
  LEAD_EVENTS.LEAD_FOLLOWUP_UPDATED,
  LEAD_EVENTS.LEAD_FOLLOWUP_COMPLETED,
]);


export const LEAD_VIEWING_EVENTS = Object.freeze([
  LEAD_EVENTS.LEAD_VIEWING_REQUESTED,
  LEAD_EVENTS.LEAD_VIEWING_CONFIRMED,
  LEAD_EVENTS.LEAD_VIEWING_COMPLETED,
  LEAD_EVENTS.LEAD_VIEWING_CANCELLED,
]);


// =====================================================
// EVENT VALIDATION
// =====================================================
//
// Useful for:
// ✓ controllers
// ✓ services
// ✓ workers
// ✓ outbox infrastructure
// ✓ tests
//
// =====================================================

const CANONICAL_EVENT_VALUES = new Set(
  Object.values(LEAD_EVENTS)
);


export const isValidLeadEvent = (eventName) => {
  return CANONICAL_EVENT_VALUES.has(eventName);
};


// =====================================================
// EVENT PAYLOAD HELPERS
// =====================================================
//
// These helpers do not perform database work.
//
// They simply standardize the basic structure used by
// different producers of canonical events.
//
// =====================================================

export const createLeadEventPayload = ({
  leadId,
  organizationId,
  lead = null,
  metadata = {},
}) => {

  return {
    leadId:
      leadId ??
      lead?._id ??
      null,

    organizationId:
      organizationId ??
      lead?.organizationId ??
      null,

    lead,

    metadata,

    occurredAt: new Date(),
  };
};


// =====================================================
// LEAD STATUS CHANGED PAYLOAD
// =====================================================

export const createLeadStatusChangedPayload = ({
  lead,
  previousStatus,
  metadata = {},
}) => {

  return {
    leadId:
      lead?._id ??
      null,

    organizationId:
      lead?.organizationId ??
      null,

    previousStatus:
      previousStatus ??
      null,

    status:
      lead?.status ??
      null,

    lead,

    metadata,

    occurredAt: new Date(),
  };
};


// =====================================================
// LEAD SCORED PAYLOAD
// =====================================================

export const createLeadScoredPayload = ({
  lead,
  previousScore = null,
  previousCategory = null,
  score,
  category,
  metadata = {},
}) => {

  return {
    leadId:
      lead?._id ??
      null,

    organizationId:
      lead?.organizationId ??
      null,

    previousScore,

    score: Number(
      score ??
      lead?.score ??
      0
    ),

    previousCategory,

    category:
      category ??
      null,

    lead,

    metadata,

    occurredAt: new Date(),
  };
};


// =====================================================
// OPTIONAL EVENT DEBUGGING
// =====================================================
//
// Disabled by default.
//
// Enable temporarily during development when tracing:
//
//     event emission
//          ↓
//     event listener
//          ↓
//     realtime
//          ↓
//     notification
//
// =====================================================

// leadEventBus.on(
//   LEAD_EVENTS.LEAD_CREATED,
//   (payload) => {
//     console.log(
//       "📡 LEAD_CREATED:",
//       payload?.leadId
//     );
//   }
// );


// leadEventBus.on(
//   LEAD_EVENTS.LEAD_STATUS_CHANGED,
//   (payload) => {
//     console.log(
//       "🔄 LEAD_STATUS_CHANGED:",
//       {
//         leadId:
//           payload?.leadId,
//
//         previousStatus:
//           payload?.previousStatus,
//
//         status:
//           payload?.status,
//       }
//     );
//   }
// );


// leadEventBus.on(
//   LEAD_EVENTS.LEAD_SCORED,
//   (payload) => {
//     console.log(
//       "📊 LEAD_SCORED:",
//       {
//         leadId:
//           payload?.leadId,
//
//         score:
//           payload?.score,
//
//         category:
//           payload?.category,
//       }
//     );
//   }
// );


// leadEventBus.on(
//   LEAD_EVENTS.LEAD_ASSIGNED,
//   (payload) => {
//     console.log(
//       "👤 LEAD_ASSIGNED:",
//       payload?.leadId
//     );
//   }
// );


// =====================================================
// EXPORT
// =====================================================

export default leadEventBus;