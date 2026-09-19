// handles endpoints POST /api/auth/register, POST /api/auth/login, GET  /api/auth/me
// connects the controller + middleware into complete auth system
import express from "express";

import {
  registerAdmin,
  login,
  createAgent,
  createViewer,
} from "../controllers/authController.js";

import {
  protect,
} from "../middleware/authMiddleware.js";

import {
    allowRoles,
} from "../middleware/roleMiddleware.js";

const router = express.Router();

// =====================================================
// PUBLIC ROUTES
// =====================================================

// Register a new organization + admin
router.post(
  "/register",
  registerAdmin
);

// Login
router.post(
  "/login",
  login
);

// =====================================================
// ADMIN ROUTES
// =====================================================

// Create Agent
router.post(
  "/create-agent",
  protect,
  allowRoles(["admin"]),
  createAgent
);

// Create Viewer
router.post(
  "/create-viewer",
  protect,
  allowRoles(["admin"]),
  createViewer
);

// =====================================================
// CURRENT USER
// =====================================================

router.get(
  "/me",
  protect,
  async (req, res) => {
    return res.status(200).json({
      success: true,
      user: req.user,
    });
  }
);

export default router;