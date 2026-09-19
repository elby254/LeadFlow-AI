/**
 * ============================================================
 *
 * LEAD ROUTES
 *
 * Purpose
 * ------------------------------------------------------------
 * Lead management
 * CRM follow-up
 * Viewing workflow
 * Lead assignment workflow
 *
 * Security
 * ------------------------------------------------------------
 * protect
 *     ↓
 * authenticatedUser
 *     ↓
 * adminOnly / agentOnly
 *
 * Assignment authority
 * ------------------------------------------------------------
 * ADMIN
 *   → assign
 *   → reassign
 *   → view unassigned
 *
 * AGENT
 *   → view own assigned leads
 *   → view own assigned lead by ID
 *
 * VIEWER
 *   → no assignment access
 *
 * ============================================================
 */

import express from "express";

// ============================================================
// LEAD CONTROLLER
// ============================================================

import {
  getAllLeads,
  getHotLeads,
  getFollowUpLeads,
  getNewLeads,
  getLeadById,
  updateFollowUp,
  addCallHistory,
  addAgentNote,

  // ===== Viewing Workflow =====
  requestViewing,
  approveViewing,
  rescheduleViewing,
  cancelViewing,
  completeViewing,
  submitViewingFeedback,
} from "../controllers/leadController.js";

// ============================================================
// ASSIGNMENT CONTROLLER
// ============================================================

import {
  assignLead,
  reassignLead,
  getUnassignedLeads,
  getMyLeads,
  getMyLeadById,
} from "../controllers/assignmentController.js";

// ============================================================
// AUTHENTICATION
// ============================================================

import {
  protect,
} from "../middleware/authMiddleware.js";

// ============================================================
// ROLE MIDDLEWARE
// ============================================================

import {
  authenticatedUser,
  adminOnly,
  agentOnly,
} from "../middleware/roleMiddleware.js";

const router = express.Router();

// ============================================================
// AUTHENTICATION
// ============================================================
//
// Every lead route requires authentication.
//
// ============================================================

router.use(protect);
router.use(authenticatedUser);

// ============================================================
// LEAD RETRIEVAL
// ============================================================
//
// GET /api/lead
//
// ============================================================

router.get(
  "/",
  getAllLeads
);

// ============================================================
// AGENT ASSIGNED-LEAD WORKFLOW
// ============================================================
//
// Agent identity comes from:
//
//     req.user._id
//
// NEVER from:
//
//     req.body.agentId
//
// ============================================================

// ------------------------------------------------------------
// GET MY ASSIGNED LEADS
//
// GET /api/lead/my
//
// IMPORTANT:
// This route MUST appear before:
//
//     /:id
//
// Otherwise "my" becomes the lead ID.
//
// ------------------------------------------------------------

router.get(
  "/my",
  agentOnly,
  getMyLeads
);

// ------------------------------------------------------------
// BACKWARD-COMPATIBILITY ALIAS
//
// GET /api/lead/my-leads
//
// This allows older frontend code to continue working.
//
// ------------------------------------------------------------

router.get(
  "/my-leads",
  agentOnly,
  getMyLeads
);

// ------------------------------------------------------------
// GET ONE OF MY ASSIGNED LEADS
//
// GET /api/lead/my/:id
//
// IMPORTANT:
// This is also placed before /:id.
//
// ------------------------------------------------------------

router.get(
  "/my/:id",
  agentOnly,
  getMyLeadById
);

// ------------------------------------------------------------
// BACKWARD-COMPATIBILITY ALIAS
//
// GET /api/lead/my-leads/:id
//
// ------------------------------------------------------------

router.get(
  "/my-leads/:id",
  agentOnly,
  getMyLeadById
);

// ============================================================
// SPECIAL LEAD COLLECTIONS
// ============================================================

// ------------------------------------------------------------
// NEW LEADS
//
// GET /api/lead/new
//
// ------------------------------------------------------------

router.get(
  "/new",
  getNewLeads
);

// ------------------------------------------------------------
// HOT LEADS
//
// GET /api/lead/hot
//
// ------------------------------------------------------------

router.get(
  "/hot",
  getHotLeads
);

// ------------------------------------------------------------
// FOLLOW-UP LEADS
//
// GET /api/lead/follow-up
//
// ------------------------------------------------------------

router.get(
  "/follow-up",
  getFollowUpLeads
);

// ============================================================
// ADMIN ASSIGNMENT WORKFLOW
// ============================================================
//
// These routes MUST be protected by adminOnly.
//
// Agents cannot assign.
// Agents cannot reassign.
// Viewers cannot access.
//
// ============================================================

// ------------------------------------------------------------
// VIEW UNASSIGNED LEADS
//
// GET /api/lead/unassigned
//
// ------------------------------------------------------------

router.get(
  "/unassigned",
  adminOnly,
  getUnassignedLeads
);

// ------------------------------------------------------------
// ASSIGN LEAD
//
// POST /api/lead/:id/assign
//
// ------------------------------------------------------------

router.post(
  "/:id/assign",
  adminOnly,
  assignLead
);

// ------------------------------------------------------------
// REASSIGN LEAD
//
// PATCH /api/lead/:id/reassign
//
// ------------------------------------------------------------

router.patch(
  "/:id/reassign",
  adminOnly,
  reassignLead
);

// ============================================================
// FOLLOW-UP
// ============================================================
//
// PATCH /api/lead/:id/followup
//
// ============================================================

router.patch(
  "/:id/followup",
  updateFollowUp
);

// ============================================================
// VIEWING WORKFLOW
// ============================================================

// ------------------------------------------------------------
// REQUEST VIEWING
//
// POST /api/lead/:id/viewing/request
//
// ------------------------------------------------------------

router.post(
  "/:id/viewing/request",
  requestViewing
);

// ------------------------------------------------------------
// APPROVE VIEWING
//
// PATCH /api/lead/:id/viewing/approve
//
// ------------------------------------------------------------

router.patch(
  "/:id/viewing/approve",
  approveViewing
);

// ------------------------------------------------------------
// RESCHEDULE VIEWING
//
// PATCH /api/lead/:id/viewing/reschedule
//
// ------------------------------------------------------------

router.patch(
  "/:id/viewing/reschedule",
  rescheduleViewing
);

// ------------------------------------------------------------
// CANCEL VIEWING
//
// PATCH /api/lead/:id/viewing/cancel
//
// ------------------------------------------------------------

router.patch(
  "/:id/viewing/cancel",
  cancelViewing
);

// ------------------------------------------------------------
// COMPLETE VIEWING
//
// PATCH /api/lead/:id/viewing/complete
//
// ------------------------------------------------------------

router.patch(
  "/:id/viewing/complete",
  completeViewing
);

// ------------------------------------------------------------
// VIEWING FEEDBACK
//
// POST /api/lead/:id/viewing/feedback
//
// ------------------------------------------------------------

router.post(
  "/:id/viewing/feedback",
  submitViewingFeedback
);

// ============================================================
// CRM
// ============================================================

// ------------------------------------------------------------
// CALL HISTORY
//
// POST /api/lead/:id/call-history
//
// ------------------------------------------------------------

router.post(
  "/:id/call-history",
  addCallHistory
);

// ------------------------------------------------------------
// AGENT NOTES
//
// POST /api/lead/:id/notes
//
// ------------------------------------------------------------

router.post(
  "/:id/notes",
  addAgentNote
);

// ============================================================
// GENERIC SINGLE LEAD
// ============================================================
//
// GET /api/lead/:id
//
// MUST ALWAYS REMAIN LAST.
//
// This prevents:
//
//     /my
//     /my-leads
//     /new
//     /hot
//     /follow-up
//     /unassigned
//
// from being interpreted as:
//
//     /:id
//
// ============================================================

router.get(
  "/:id",
  getLeadById
);

// ============================================================
// EXPORT
// ============================================================

export default router;