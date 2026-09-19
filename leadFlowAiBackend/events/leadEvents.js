// =====================================================
//
// Purpose
// -----------------------------------------------------
// Lightweight internal event system used to broadcast
// lead-related changes across LeadFlow AI.
//
// Used by:
// ✓ Lead controllers
// ✓ Agent workflows
// ✓ Admin workflows
// ✓ Dashboard listeners
// ✓ Notification systems
// ✓ Real-time pipeline updates
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
//
// Those responsibilities belong to middleware/controllers.
//
// =====================================================

import EventEmitter from "events";

// =====================================================
// LEAD EVENT BUS
// =====================================================
//
// A single application-level EventEmitter instance.
//
// Controllers can emit events:
//
// leadEventBus.emit(
//   LEAD_EVENTS.PIPELINE_UPDATE,
//   lead
// );
//
// Other parts of the backend can listen:
//
// leadEventBus.on(
//   LEAD_EVENTS.PIPELINE_UPDATE,
//   (lead) => {
//     ...
//   }
// );
//
// =====================================================

class LeadEventBus extends EventEmitter {}

// Create one shared event bus for the application.
const leadEventBus = new LeadEventBus();

// =====================================================
// EVENT TYPES
// =====================================================
//
// Keep event names centralized so controllers and
// listeners always use the same values.
//
// =====================================================

export const LEAD_EVENTS = {
  // ---------------------------------------------------
  // New lead created
  // ---------------------------------------------------

  NEW_LEAD: "new_lead",

  // ---------------------------------------------------
  // Existing lead changed
  // ---------------------------------------------------

  LEAD_UPDATED: "lead_updated",

  // ---------------------------------------------------
  // Lead becomes hot / high priority
  // ---------------------------------------------------

  HOT_LEAD: "hot_lead",

  // ---------------------------------------------------
  // Lead pipeline changed
  // ---------------------------------------------------
  //
  // Used by:
  // ✓ Agent assignment
  // ✓ Status changes
  // ✓ Viewing workflow changes
  // ✓ Other pipeline changes
  //
  // ---------------------------------------------------

  PIPELINE_UPDATE: "pipeline_update",

  // ---------------------------------------------------
  // Conversation changed
  // ---------------------------------------------------
  //
  // Allows conversation-related services to notify
  // dashboard / realtime listeners without coupling
  // those services directly together.
  //
  // ---------------------------------------------------

  CONVERSATION_UPDATE: "conversation_update",
};

// =====================================================
// OPTIONAL EVENT DEBUGGING
// =====================================================
//
// Keep event logging here rather than logging when this
// module is imported.
//
// These listeners are intentionally disabled by default.
// Enable them temporarily when debugging event flow.
//
// Example:
//
// leadEventBus.on(LEAD_EVENTS.NEW_LEAD, (lead) => {
//   console.log("📡 NEW_LEAD emitted:", lead?._id);
// });
//
// leadEventBus.on(LEAD_EVENTS.HOT_LEAD, (lead) => {
//   console.log("🔥 HOT_LEAD emitted:", lead?._id);
// });
//
// leadEventBus.on(LEAD_EVENTS.PIPELINE_UPDATE, (lead) => {
//   console.log("📊 PIPELINE_UPDATE emitted:", lead?._id);
// });
//
// =====================================================

// =====================================================
// EXPORT
// =====================================================

export default leadEventBus;