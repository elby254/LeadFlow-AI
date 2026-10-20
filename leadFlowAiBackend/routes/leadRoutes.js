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
 * role-specific middleware
 *
 * ADMIN
 *   → assign
 *   → reassign
 *   → view unassigned
 *   → perform administrative lead/viewing actions
 *
 * AGENT
 *   → view own assigned leads
 *   → view own assigned lead by ID
 *   → perform CRM/viewing actions
 *
 * VIEWER
 *   → read-only
 *   → no assignment
 *   → no lead mutation
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
  allowRoles,
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
// These are read operations.
//
// Authenticated users may retrieve lead collections,
// subject to the tenant and role filtering performed
// by the controllers.
//
// ============================================================

// GET /api/lead

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
//     req.query.agentId
//     req.params.agentId
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
// Read-only.
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
// Read-only.
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
// Read-only.
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
// CRM MUTATIONS
// ============================================================
//
// Viewer is read-only.
//
// Only admin and agent may modify CRM lead data.
//
// ============================================================

// ------------------------------------------------------------
// FOLLOW-UP
//
// PATCH /api/lead/:id/followup
//
// ------------------------------------------------------------

router.patch(
  "/:id/followup",
  allowRoles(["admin", "agent"]),
  updateFollowUp
);

// ------------------------------------------------------------
// CALL HISTORY
//
// POST /api/lead/:id/call-history
//
// ------------------------------------------------------------

router.post(
  "/:id/call-history",
  allowRoles(["admin", "agent"]),
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
  allowRoles(["admin", "agent"]),
  addAgentNote
);

// ============================================================
// VIEWING WORKFLOW
// ============================================================
//
// Viewer is read-only.
//
// Admin and agent may perform viewing workflow mutations.
//
// Tenant authorization is still enforced inside the
// controllers/services.
//
// ============================================================

// ------------------------------------------------------------
// REQUEST VIEWING
//
// POST /api/lead/:id/viewing/request
//
// ------------------------------------------------------------

router.post(
  "/:id/viewing/request",
  allowRoles(["admin", "agent"]),
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
  allowRoles(["admin", "agent"]),
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
  allowRoles(["admin", "agent"]),
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
  allowRoles(["admin", "agent"]),
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
  allowRoles(["admin", "agent"]),
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
  allowRoles(["admin", "agent"]),
  submitViewingFeedback
);

// ============================================================
// GENERIC SINGLE LEAD
// ============================================================
//
// GET /api/lead/:id
//
// Read-only.
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