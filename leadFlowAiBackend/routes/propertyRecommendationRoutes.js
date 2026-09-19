/**
 * ==========================================================
 *
 * PURPOSE
 * ----------------------------------------------------------
 * Handles AI-powered property recommendations.
 *
 * Used By
 * ----------------------------------------------------------
 * • AI Qualification Engine
 * • Viewer Dashboard
 * • Agent Dashboard
 * • Lead Details
 * • WhatsApp AI Assistant
 *
 * ==========================================================
 */

import express from "express";

import {
  getRecommendedProperties,
  getLeadRecommendations,
  getSimilarProperties,
  getFeaturedRecommendations,
} from "../controllers/propertyRecommendationController.js";

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
GENERAL AI RECOMMENDATIONS

GET /api/property-recommendations
==========================================================
*/

router.get(
  "/",
  allowRoles([
    "admin",
    "agent",
    "viewer",
  ]),
  getRecommendedProperties
);

/*
==========================================================
LEAD-SPECIFIC RECOMMENDATIONS

GET /api/property-recommendations/lead/:leadId
==========================================================
*/

router.get(
  "/lead/:leadId",
  allowRoles([
    "admin",
    "agent",
  ]),
  getLeadRecommendations
);

/*
==========================================================
SIMILAR PROPERTIES

GET /api/property-recommendations/similar/:propertyId
==========================================================
*/

router.get(
  "/similar/:propertyId",
  allowRoles([
    "admin",
    "agent",
    "viewer",
  ]),
  getSimilarProperties
);

/*
==========================================================
FEATURED RECOMMENDATIONS

GET /api/property-recommendations/featured
==========================================================
*/

router.get(
  "/featured",
  allowRoles([
    "admin",
    "agent",
    "viewer",
  ]),
  getFeaturedRecommendations
);

/*
==========================================================
ENDPOINT SUMMARY
==========================================================

GET    /api/property-recommendations
       • General AI property recommendations

GET    /api/property-recommendations/lead/:leadId
       • Personalized recommendations for a specific lead

GET    /api/property-recommendations/similar/:propertyId
       • Find properties similar to an existing property

GET    /api/property-recommendations/featured
       • Featured AI recommendations for dashboards
       • Viewer home page
       • Agent quick suggestions

==========================================================
*/

export default router;