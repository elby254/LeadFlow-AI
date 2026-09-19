// This route layer exposes team management APIs for LeadFlow AI.
// this will expose GET    /api/users
// GET    /api/users/agents
// GET    /api/users/viewers
// GET    /api/users/:id
// PATCH  /api/users/:id/activate
// PATCH  /api/users/:id/deactivate

import express from "express";

import {
  getOrganizationUsers,
  getAgents,
  getViewers,
  getUserById,
  activateUser,
  deactivateUser,
} from "../controllers/userController.js";

import {
  protect,
} from "../middleware/authMiddleware.js";

import {
    allowRoles,
    authenticatedUser,
} from "../middleware/roleMiddleware.js";

const router = express.Router();

// =====================================================
// ALL USERS
// Admin Only
// =====================================================

router.get(
  "/",
  protect,
  allowRoles(["admin"]),
  getOrganizationUsers
);

// =====================================================
// AGENTS
// =====================================================

router.get(
  "/agents",
  protect,
  allowRoles(["admin"]),
  getAgents
);

// =====================================================
// VIEWERS
// =====================================================

router.get(
  "/viewers",
  protect,
  allowRoles(["admin"]),
  getViewers
);

// =====================================================
// SINGLE USER
// =====================================================

router.get(
  "/:id",
  protect,
  allowRoles(["admin"]),
  getUserById
);

// =====================================================
// ACTIVATE USER
// =====================================================

router.patch(
  "/:id/activate",
  protect,
  allowRoles(["admin"]),
  activateUser
);

// =====================================================
// DEACTIVATE USER
// =====================================================

router.patch(
  "/:id/deactivate",
  protect,
  allowRoles(["admin"]),
  deactivateUser
);

export default router;
