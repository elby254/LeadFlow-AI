/**
 * ==========================================================
 *
 * PURPOSE
 * ----------------------------------------------------------
 * Handles Property Analytics.
 *
 * Used By
 * ----------------------------------------------------------
 * • Admin Dashboard
 * • Agent Dashboard
 * • Reports
 * • Executive Dashboard
 *
 * ==========================================================
 */

import express from "express";

import {
  getPropertyAnalytics,
  getPropertyPerformance,
  getPropertyOccupancy,
  getPropertyViewingAnalytics,
  getPropertyRevenueAnalytics,
} from "../controllers/propertyAnalyticsController.js";

import {
  protect,
} from "../middleware/authMiddleware.js";

import {
  authenticatedUser,
  allowRoles,
} from "../middleware/roleMiddleware.js";

const router = express.Router();

/*
==========================================================
AUTHENTICATION
==========================================================
*/

router.use(protect);
router.use(authenticatedUser);

/*
==========================================================
PROPERTY ANALYTICS OVERVIEW

GET /api/property-analytics
==========================================================
*/

router.get(
  "/",
  allowRoles([
    "admin",
    "agent",
  ]),
  getPropertyAnalytics
);

/*
==========================================================
PROPERTY PERFORMANCE

GET /api/property-analytics/performance
==========================================================
*/

router.get(
  "/performance",
  allowRoles([
    "admin",
    "agent",
  ]),
  getPropertyPerformance
);

/*
==========================================================
PROPERTY OCCUPANCY

GET /api/property-analytics/occupancy
==========================================================
*/

router.get(
  "/occupancy",
  allowRoles([
    "admin",
    "agent",
  ]),
  getPropertyOccupancy
);

/*
==========================================================
PROPERTY VIEWING ANALYTICS

GET /api/property-analytics/viewings
==========================================================
*/

router.get(
  "/viewings",
  allowRoles([
    "admin",
    "agent",
  ]),
  getPropertyViewingAnalytics
);

/*
==========================================================
PROPERTY REVENUE ANALYTICS

GET /api/property-analytics/revenue
==========================================================
*/

router.get(
  "/revenue",
  allowRoles([
    "admin",
    "agent",
  ]),
  getPropertyRevenueAnalytics
);

/*
==========================================================
ENDPOINT SUMMARY
==========================================================

GET    /api/property-analytics
       • Overall property analytics
       • Total properties
       • Active properties
       • Sold properties
       • Available properties

GET    /api/property-analytics/performance
       • Best performing properties
       • Most viewed
       • Most recommended
       • Most requested

GET    /api/property-analytics/occupancy
       • Occupancy statistics
       • Available vs Sold vs Reserved
       • Status distribution

GET    /api/property-analytics/viewings
       • Viewing requests
       • Completed viewings
       • Cancelled viewings
       • No-shows
       • Viewing conversion rate

GET    /api/property-analytics/revenue
       • Property sales revenue
       • Rental income
       • Average selling price
       • Revenue trends

==========================================================
*/

export default router;