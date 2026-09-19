/**
 * ==========================================================
 *
 * Base URL
 * ----------------------------------------------------------
 * /api/properties
 *
 * ==========================================================
 *
 * RESPONSIBILITIES
 * ----------------------------------------------------------
 * Property-level operations only.
 *
 * Image operations belong to:
 *
 * /api/properties/:propertyId/images
 *
 * and are handled by:
 *
 * propertyImageRoutes.js
 *
 * ==========================================================
 *
 * LEADFLOW AI AGENT WORKFLOW
 * ----------------------------------------------------------
 *
 * Agent
 *   ↓
 * My Properties
 *   ↓
 * Search / Filter
 *   ↓
 * Property Details
 *   ↓
 * AI Matching
 *   ↓
 * Lead Recommendations
 *   ↓
 * Viewing
 *   ↓
 * Follow-up
 *
 * ==========================================================
 */

import express from "express";

import propertyController from "../controllers/propertyController.js";

import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();


/* ==========================================================
   AUTHENTICATION
========================================================== */

/**
 * Every property operation requires authentication.
 *
 * req.user is populated by protect().
 *
 * Agent workflow relies on:
 *
 * req.user._id / req.user.id
 * req.user.organizationId
 * req.user.role
 *
 * The frontend must NOT be trusted to provide:
 *
 * agentId
 * organizationId
 *
 * for agent-specific property retrieval.
 */

router.use(protect);


/* ==========================================================
   PROPERTY DASHBOARD / ANALYTICS
   ----------------------------------------------------------
   Primarily administrative.
========================================================== */


/**
 * GET PROPERTY DASHBOARD
 *
 * GET /api/properties/dashboard
 *
 * Organization-wide property dashboard.
 */

router.get(
  "/dashboard",
  propertyController.getPropertyDashboard
);


/**
 * GET INVENTORY STATUS
 *
 * GET /api/properties/inventory
 *
 * Organization-wide inventory.
 */

router.get(
  "/inventory",
  propertyController.getInventoryStatus
);


/**
 * GET PROPERTY STATISTICS
 *
 * GET /api/properties/statistics
 *
 * Organization-wide property statistics.
 *
 * IMPORTANT
 * ----------------------------------------------------------
 * This endpoint is shared by the property statistics pages.
 *
 * Frontend examples:
 *
 * /admin/properties/statistics
 * /agent/properties/statistics
 *
 * Both can consume:
 *
 * GET /api/properties/statistics
 *
 * Authorization/business rules should be handled by the
 * controller/service layer.
 */

router.get(
  "/statistics",
  propertyController.getPropertyStatistics
);


/**
 * GET ARCHIVED PROPERTY COUNT
 *
 * GET /api/properties/count/archived
 */

router.get(
  "/count/archived",
  propertyController.getArchivedPropertyCount
);


/* ==========================================================
   PROPERTY DISCOVERY
   ----------------------------------------------------------
   Shared discovery routes.
========================================================== */


/**
 * GET AVAILABLE PROPERTIES
 *
 * GET /api/properties/available
 *
 * Used by:
 *
 * • Admin
 * • Agent
 * • Viewer
 *
 * Organization isolation is handled by the controller/service.
 */

router.get(
  "/available",
  propertyController.getAvailableProperties
);


/**
 * GET SOLD PROPERTIES
 *
 * GET /api/properties/sold
 *
 * Used by:
 *
 * • Admin
 * • Agent
 *
 * Useful for historical/reference workflow.
 */

router.get(
  "/sold",
  propertyController.getSoldProperties
);


/**
 * GET RESERVED PROPERTIES
 *
 * GET /api/properties/reserved
 *
 * Used by:
 *
 * • Admin
 * • Agent
 *
 * Useful for property lifecycle workflow.
 */

router.get(
  "/reserved",
  propertyController.getReservedProperties
);


/**
 * GET OCCUPIED PROPERTIES
 *
 * GET /api/properties/occupied
 *
 * Used by:
 *
 * • Admin
 * • Agent
 *
 * Useful for property lifecycle reference.
 */

router.get(
  "/occupied",
  propertyController.getOccupiedProperties
);


/**
 * GET INACTIVE PROPERTIES
 *
 * GET /api/properties/inactive
 *
 * Used by:
 *
 * • Admin
 * • Agent
 *
 * Represents inactive/archived property inventory.
 */

router.get(
  "/inactive",
  propertyController.getInactiveProperties
);


/**
 * GET NEW LISTINGS
 *
 * GET /api/properties/new
 *
 * Useful for agents discovering newly listed properties.
 */

router.get(
  "/new",
  propertyController.getNewListings
);


/**
 * GET FEATURED PROPERTIES
 *
 * GET /api/properties/featured
 */

router.get(
  "/featured",
  propertyController.getFeaturedProperties
);


/* ==========================================================
   AGENT PROPERTY WORKFLOW
========================================================== */


/**
 * ==========================================================
 *
 * GET MY ASSIGNED PROPERTIES
 *
 * GET /api/properties/my
 *
 * ==========================================================
 *
 * LEADFLOW AI AGENT WORKFLOW
 *
 * Agent
 *   ↓
 * My Properties
 *   ↓
 * Leads
 *   ↓
 * Property Matching
 *   ↓
 * Viewing
 *   ↓
 * Follow-up
 *
 * ==========================================================
 *
 * SECURITY
 * ----------------------------------------------------------
 *
 * The authenticated agent is determined from req.user.
 *
 * The frontend must NOT send an arbitrary agentId.
 *
 * The controller should derive the agent ID from:
 *
 *     req.user._id
 *
 * or:
 *
 *     req.user.id
 *
 * depending on the auth middleware's user structure.
 *
 * The organization must also come from:
 *
 *     req.user.organizationId
 *
 * The service then performs:
 *
 *     organizationId = authenticated organization
 *
 * AND
 *
 *     assignedAgent = authenticated agent
 *
 * This prevents an agent from viewing another agent's
 * assigned properties.
 *
 * ==========================================================
 *
 * IMAGE WORKFLOW
 * ----------------------------------------------------------
 *
 * Returned properties continue using the canonical:
 *
 *     Property.coverImage
 *
 * reference.
 *
 * The property service populates:
 *
 *     coverImage → PropertyImage
 *
 * No image is created here.
 *
 * No image is regenerated here.
 *
 * No duplicate image is created here.
 *
 * ==========================================================
 */

router.get(
  "/my",
  propertyController.getMyProperties
);


/* ==========================================================
   PROPERTY SEARCH
========================================================== */


/**
 * GET PROPERTY SEARCH
 *
 * GET /api/properties/search
 *
 * AGENT WORKFLOW
 *
 * Lead requirement
 *      ↓
 * Search
 *      ↓
 * Property options
 *
 * The controller/service must preserve organization
 * isolation using the authenticated user's organization.
 */

router.get(
  "/search",
  propertyController.searchProperties
);


/* ==========================================================
   AI PROPERTY RECOMMENDATIONS
========================================================== */


/**
 * GENERAL AI RECOMMENDATIONS
 *
 * GET /api/properties/recommendations
 *
 * Used for general property discovery.
 */

router.get(
  "/recommendations",
  propertyController.getRecommendations
);


/**
 * PROPERTY MATCHING
 *
 * GET /api/properties/matches
 *
 * Agent workflow:
 *
 * Lead requirements
 *      ↓
 * Property matching
 *      ↓
 * Matching properties
 */

router.get(
  "/matches",
  propertyController.getPropertyMatches
);


/**
 * LEAD-SPECIFIC AI RECOMMENDATIONS
 *
 * POST /api/properties/recommendations/lead
 *
 * Workflow:
 *
 * Lead
 *   ↓
 * Requirements
 *   ↓
 * AI matching
 *   ↓
 * Recommended properties
 */

router.post(
  "/recommendations/lead",
  propertyController.getLeadRecommendations
);


/* ==========================================================
   PRICE HISTORY
========================================================== */


/**
 * GET LATEST PROPERTY PRICE
 *
 * GET /api/properties/:propertyId/price-history/latest
 *
 * IMPORTANT
 * ----------------------------------------------------------
 * This MUST appear BEFORE:
 *
 * /:propertyId/price-history
 *
 * so the more specific route is matched correctly.
 */

router.get(
  "/:propertyId/price-history/latest",
  propertyController.getLatestPrice
);


/**
 * GET PROPERTY PRICE HISTORY
 *
 * GET /api/properties/:propertyId/price-history
 *
 * IMPORTANT
 * ----------------------------------------------------------
 * This appears before:
 *
 * /:propertyId
 *
 * so "price-history" is not interpreted as a property ID.
 */

router.get(
  "/:propertyId/price-history",
  propertyController.getPriceHistory
);


/* ==========================================================
   CREATE PROPERTY
   ----------------------------------------------------------
   ADMIN OPERATION
========================================================== */


/**
 * CREATE PROPERTY
 *
 * POST /api/properties
 *
 * Agent does NOT create properties through this route.
 *
 * Property creation creates the Property document only.
 *
 * Image creation belongs to:
 *
 * propertyImageRoutes.js
 *
 * Therefore:
 *
 * Property
 *   ↓
 * coverImage
 *   ↓
 * PropertyImage workflow
 */

router.post(
  "/",
  propertyController.createProperty
);


/* ==========================================================
   GET ALL PROPERTIES
========================================================== */


/**
 * GET ALL PROPERTIES
 *
 * GET /api/properties
 *
 * Used by:
 *
 * • Admin
 * • Agent
 *
 * IMPORTANT AGENT WORKFLOW
 * ----------------------------------------------------------
 *
 * If the authenticated user is an agent, the controller
 * should determine whether this endpoint should return:
 *
 *     organization-wide properties
 *
 * or:
 *
 *     agent-assigned properties
 *
 * The dedicated agent workflow endpoint remains:
 *
 *     GET /api/properties/my
 *
 * Therefore the frontend Agent Properties page should use:
 *
 *     /api/properties/my
 *
 * rather than relying on arbitrary query parameters such as:
 *
 *     ?agentId=...
 *
 * Organization isolation must always come from req.user.
 */

router.get(
  "/",
  propertyController.getAllProperties
);


/* ==========================================================
   GET SINGLE PROPERTY
========================================================== */


/**
 * GET PROPERTY
 *
 * GET /api/properties/:propertyId
 *
 * Used by:
 *
 * • Admin
 * • Agent
 * • Viewer
 *
 * Returns:
 *
 * • Property
 * • Assigned Agent
 * • Canonical coverImage
 *
 * Agent workflow:
 *
 * My Properties
 *      ↓
 * Click Property Card
 *      ↓
 * Property Details
 *
 * The controller/service must enforce organization
 * isolation.
 */

router.get(
  "/:propertyId",
  propertyController.getPropertyById
);


/* ==========================================================
   UPDATE PROPERTY
   ----------------------------------------------------------
   ADMIN OPERATION
========================================================== */


/**
 * PATCH PROPERTY
 *
 * PATCH /api/properties/:propertyId
 *
 * ADMIN OPERATION
 *
 * Property image changes MUST NOT happen here.
 *
 * Image operations belong to:
 *
 * propertyImageRoutes.js
 *
 * coverImage is therefore protected by the service layer.
 */

router.patch(
  "/:propertyId",
  propertyController.updateProperty
);


/**
 * PUT PROPERTY
 *
 * PUT /api/properties/:propertyId
 *
 * Backwards-compatible support.
 */

router.put(
  "/:propertyId",
  propertyController.updateProperty
);


/* ==========================================================
   ARCHIVE / RESTORE
   ----------------------------------------------------------
   ADMIN OPERATIONS
========================================================== */


/**
 * ARCHIVE PROPERTY
 *
 * PATCH /api/properties/:propertyId/archive
 */

router.patch(
  "/:propertyId/archive",
  propertyController.archiveProperty
);


/**
 * RESTORE PROPERTY
 *
 * PATCH /api/properties/:propertyId/restore
 */

router.patch(
  "/:propertyId/restore",
  propertyController.restoreProperty
);


/* ==========================================================
   PERMANENT DELETE
   ----------------------------------------------------------
   ADMIN OPERATION
========================================================== */


/**
 * DELETE PROPERTY
 *
 * DELETE /api/properties/:propertyId
 *
 * Associated PropertyImage records are handled by the
 * property deletion service.
 */

router.delete(
  "/:propertyId",
  propertyController.deleteProperty
);


/* ==========================================================
   EXPORT
========================================================== */

export default router;