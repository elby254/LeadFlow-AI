/**
 * ==========================================================
 *
 * PURPOSE
 * ----------------------------------------------------------
 * Handles Featured Property Management.
 *
 * Used By
 * ----------------------------------------------------------
 * • Admin Dashboard
 * • Viewer Home Page
 * • AI Recommendations
 * • Featured Listings
 *
 * ==========================================================
 */

import express from "express";

import {
  getFeaturedProperties,
  getFeaturedPropertyById,
  featureProperty,
  unfeatureProperty,
  reorderFeaturedProperties,
} from "../controllers/featuredPropertyController.js";

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
GET FEATURED PROPERTIES

GET /api/featured-properties
==========================================================
*/

router.get(
  "/",
  allowRoles([
    "admin",
    "agent",
    "viewer",
  ]),
  getFeaturedProperties
);

/*
==========================================================
GET FEATURED PROPERTY

GET /api/featured-properties/:propertyId
==========================================================
*/

router.get(
  "/:propertyId",
  allowRoles([
    "admin",
    "agent",
    "viewer",
  ]),
  getFeaturedPropertyById
);

/*
==========================================================
FEATURE PROPERTY

POST /api/featured-properties/:propertyId
==========================================================
*/

router.post(
  "/:propertyId",
  allowRoles([
    "admin",
  ]),
  featureProperty
);

/*
==========================================================
UNFEATURE PROPERTY

PATCH /api/featured-properties/:propertyId/remove
==========================================================
*/

router.patch(
  "/:propertyId/remove",
  allowRoles([
    "admin",
  ]),
  unfeatureProperty
);

/*
==========================================================
REORDER FEATURED PROPERTIES

PATCH /api/featured-properties/reorder
==========================================================
*/

router.patch(
  "/reorder",
  allowRoles([
    "admin",
  ]),
  reorderFeaturedProperties
);

/*
==========================================================
ENDPOINT SUMMARY
==========================================================

GET    /api/featured-properties
       • Retrieve all featured properties

GET    /api/featured-properties/:propertyId
       • Retrieve a specific featured property

POST   /api/featured-properties/:propertyId
       • Mark a property as featured

PATCH  /api/featured-properties/:propertyId/remove
       • Remove featured status

PATCH  /api/featured-properties/reorder
       • Update display order of featured properties

==========================================================
*/

export default router;