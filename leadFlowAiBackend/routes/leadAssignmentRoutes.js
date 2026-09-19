// =====================================================
//
// LEAD ASSIGNMENT ROUTES
//
// Purpose
// -----------------------------------------------------
// Defines authentication and role authorization for
// lead assignment operations.
//
// SECURITY FLOW
// -----------------------------------------------------
//
// protect()
//   ↓
// authenticate user
//   ↓
// allowRoles()
//   ↓
// authorize role
//   ↓
// controller
//
// ADMIN
// -----------------------------------------------------
// ✓ Assign lead
// ✓ Reassign lead
// ✓ View unassigned leads
//
// AGENT
// -----------------------------------------------------
// ✓ View own assigned leads
// ✓ View one own assigned lead
//
// VIEWER
// -----------------------------------------------------
// ✗ No assignment access
//
// =====================================================

import express from "express";

import {
  assignLead,
  reassignLead,
  getUnassignedLeads,
  getMyLeads,
  getMyLeadById,
} from "../controllers/leadAssignmentController.js";

import {
  protect,
} from "../middleware/authMiddleware.js";

import {
  allowRoles,
} from "../middleware/roleMiddleware.js";

const router =
  express.Router();

// =====================================================
// ADMIN ROUTES
// =====================================================
//
// ADMIN ONLY
//
// =====================================================

// -----------------------------------------------------
// Assign an unassigned lead
//
// POST
// /api/lead/:id/assign
// -----------------------------------------------------

router.post(
  "/:id/assign",
  protect,
  allowRoles(["admin"]),
  assignLead
);

// -----------------------------------------------------
// Reassign an existing lead
//
// PATCH
// /api/lead/:id/reassign
// -----------------------------------------------------

router.patch(
  "/:id/reassign",
  protect,
  allowRoles(["admin"]),
  reassignLead
);

// -----------------------------------------------------
// Get unassigned leads
//
// IMPORTANT
// -----------------------------------------------------
// This route is declared before any generic :id routes
// that may be added later.
//
// GET
// /api/lead/unassigned
// -----------------------------------------------------

router.get(
  "/unassigned",
  protect,
  allowRoles(["admin"]),
  getUnassignedLeads
);

// =====================================================
// AGENT ROUTES
// =====================================================

// -----------------------------------------------------
// Get all leads assigned to authenticated agent
//
// GET
// /api/lead/my-leads
// -----------------------------------------------------

router.get(
  "/my-leads",
  protect,
  allowRoles(["agent"]),
  getMyLeads
);

// -----------------------------------------------------
// Get one lead assigned to authenticated agent
//
// GET
// /api/lead/my-leads/:id
// -----------------------------------------------------

router.get(
  "/my-leads/:id",
  protect,
  allowRoles(["agent"]),
  getMyLeadById
);

// =====================================================
// EXPORT
// =====================================================

export default router;