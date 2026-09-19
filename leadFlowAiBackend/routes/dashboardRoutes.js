/**
 * ============================================================
 *
 * Provides:
 * ------------------------------------------------------------
 * • KPI Summary
 * • Lead Pipeline
 * • Agent Performance
 * • AI Insights
 * • Viewing Analytics
 * • Notification Center
 * • Recent Activity
 *
 * ============================================================
 */

import express from "express";

import {
  getDashboardSummary,
  getLeadPipeline,
  getAgentPerformance,
  getAIInsights,
  getViewingAnalytics,
  getDashboardNotifications,
  getRecentActivity,
} from "../controllers/dashboardController.js";

import {
  protect,
} from "../middleware/authMiddleware.js";

import {
  authenticatedUser,
  allowRoles,
} from "../middleware/roleMiddleware.js";

const router = express.Router();

/* ============================================================
   AUTHENTICATION
============================================================ */

router.use(protect);
router.use(authenticatedUser);

/* ============================================================
   KPI SUMMARY
============================================================ */

router.get(
  "/summary",
  getDashboardSummary
);

/* ============================================================
   LEAD PIPELINE
============================================================ */

router.get(
  "/pipeline",
  getLeadPipeline
);

/* ============================================================
   AGENT PERFORMANCE
============================================================ */

router.get(
  "/agent/:id",
  getAgentPerformance
);

/* ============================================================
   AI INSIGHTS
   ------------------------------------------------------------
   Admin only
============================================================ */

router.get(
  "/ai-insights",
  allowRoles(["admin"]),
  getAIInsights
);

/* ============================================================
   VIEWING ANALYTICS
============================================================ */

router.get(
  "/viewings",
  getViewingAnalytics
);

/* ============================================================
   DASHBOARD NOTIFICATIONS
============================================================ */

router.get(
  "/notifications",
  getDashboardNotifications
);

/* ============================================================
   RECENT ACTIVITY
============================================================ */

router.get(
  "/recent-activity",
  getRecentActivity
);

export default router;