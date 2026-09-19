/**
 * ==========================================================
 *
 * AGENT ROUTES
 *
 * Purpose
 * ----------------------------------------------------------
 * Handles AGENT-SIDE API workflows in LeadFlow AI.
 *
 * Agent Workflow
 * ----------------------------------------------------------
 *
 * Dashboard
 *     ↓
 * Leads
 *     ↓
 * Qualification
 *     ↓
 * Property Matching
 *     ↓
 * Conversations
 *     ↓
 * Viewings
 *     ↓
 * Follow-ups
 *     ↓
 * Negotiation
 *     ↓
 * Conversion
 *     ↓
 * Performance
 *
 * IMPORTANT
 * ----------------------------------------------------------
 * These routes are AGENT-SIDE only.
 *
 * Lead assignment is NOT handled here.
 *
 * Admin assignment workflow:
 *
 *   Admin
 *      ↓
 *   leadAssignmentController
 *      ↓
 *   resolveAssignmentConflict()
 *      ↓
 *   lead.assignedTo = agent._id
 *
 * Authentication:
 *
 *   protect
 *      ↓
 *   agentOnly
 *      ↓
 *   controller
 *
 * The authenticated agent is taken from:
 *
 *   req.user
 *   req.agentId
 *   req.organizationId
 *
 * Client-supplied agentId / organizationId are NOT trusted.
 *
 * ==========================================================
 */

import express from "express";

// ==========================================================
// CONTROLLERS
// ==========================================================

import {
  updateLeadStatus,
  addLeadNote,
  scheduleViewing,
  getAgentPerformance,
} from "../controllers/agentController.js";

// ==========================================================
// AUTHENTICATION
// ==========================================================

import {
  protect,
  agentOnly,
} from "../middleware/authMiddleware.js";

// ==========================================================
// ROUTER
// ==========================================================

const router =
  express.Router();

// ==========================================================
// AGENT SECURITY
// ==========================================================
//
// Every route in this router is:
//
//   protect()
//       ↓
//   agentOnly()
//       ↓
//   controller
//
// ==========================================================

router.use(
  protect,
  agentOnly
);

// ==========================================================
// UPDATE LEAD STATUS
// ==========================================================
//
// POST
// /api/agent/status
//
// Body:
//
// {
//   "leadId": "LEAD_ID",
//   "status": "qualified"
// }
//
// Allowed status values:
//
//   new
//   contacted
//   qualified
//   viewing
//   negotiation
//   won
//   lost
//
// ==========================================================

router.post(
  "/status",
  updateLeadStatus
);

// ==========================================================
// ADD LEAD NOTE
// ==========================================================
//
// POST
// /api/agent/note
//
// Body:
//
// {
//   "leadId": "LEAD_ID",
//   "text": "Customer confirmed Saturday viewing."
// }
//
// ==========================================================

router.post(
  "/note",
  addLeadNote
);

// ==========================================================
// SCHEDULE VIEWING
// ==========================================================
//
// POST
// /api/agent/schedule-viewing
//
// Body:
//
// {
//   "leadId": "LEAD_ID",
//   "date": "2026-09-05T10:00:00.000Z"
// }
//
// Optional:
//
// {
//   "viewingStatus": "scheduled"
// }
//
// ==========================================================

router.post(
  "/schedule-viewing",
  scheduleViewing
);

// ==========================================================
// AGENT PERFORMANCE
// ==========================================================
//
// GET
// /api/agent/performance
//
// Authentication:
//
//   protect
//      ↓
//   agentOnly
//      ↓
//   getAgentPerformance
//
// The controller gets:
//
//   req.user
//   req.agentId
//   req.organizationId
//
// The client DOES NOT provide:
//
//   agentId
//   organizationId
//
// ==========================================================

router.get(
  "/performance",
  getAgentPerformance
);

// ==========================================================
// EXPORT
// ==========================================================

export default router;