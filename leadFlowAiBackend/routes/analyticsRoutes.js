/**
 * ==========================================================
 * LEADFLOW AI
 * ANALYTICS ROUTES
 * ==========================================================
 *
 * Purpose
 * -------
 * Executive/platform analytics endpoints.
 *
 * IMPORTANT
 * ---------
 * This router is intentionally separate from:
 *
 *   /api/property-analytics
 *
 * The property analytics router handles detailed
 * property-specific analytics.
 *
 * This router handles the Admin Analytics dashboard:
 *
 *   GET /api/analytics/dashboard
 *
 * ==========================================================
 */

import express from "express";

import {
  getDashboardAnalytics,
} from "../controllers/analyticsController.js";

import { protect } from "../middleware/authMiddleware.js";

import {
  authenticatedUser,
  allowRoles,
} from "../middleware/roleMiddleware.js";

const router = express.Router();

/*
 * ==========================================================
 * AUTHENTICATION
 * ==========================================================
 *
 * protect()
 *    ↓
 * verifies the JWT
 *
 * authenticatedUser()
 *    ↓
 * resolves the authenticated User
 *
 * ==========================================================
 */

router.use(protect);
router.use(authenticatedUser);

/*
 * ==========================================================
 * DASHBOARD ANALYTICS
 * ==========================================================
 *
 * GET
 * /api/analytics/dashboard
 *
 * Used by:
 *
 *   AdminAnalytics.jsx
 *
 * Returns:
 *
 * {
 *   summary: {},
 *   monthlyData: [],
 *   topAgents: []
 * }
 *
 * Admin only.
 *
 * ==========================================================
 */

router.get(
  "/dashboard",
  allowRoles(["admin"]),
  getDashboardAnalytics
);

/*
 * ==========================================================
 * EXPORT
 * ==========================================================
 */

export default router;