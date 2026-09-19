/**
 * ==========================================================
 *
 * PURPOSE
 * ----------------------------------------------------------
 * Handles Property Feature Management.
 *
 * Used By
 * ----------------------------------------------------------
 * • Admin Property Management
 * • Agent Property Management
 * • Viewer Property Details
 *
 * ==========================================================
 */

import express from "express";

import {
  getPropertyFeatures,
  createPropertyFeature,
  updatePropertyFeature,
  deletePropertyFeature,
  restorePropertyFeature,
} from "../controllers/propertyFeatureController.js";

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
GET PROPERTY FEATURES

GET /api/properties/:propertyId/features
==========================================================
*/

router.get(
  "/properties/:propertyId/features",
  allowRoles([
    "admin",
    "agent",
    "viewer",
  ]),
  getPropertyFeatures
);

/*
==========================================================
CREATE PROPERTY FEATURE

POST /api/properties/:propertyId/features
==========================================================
*/

router.post(
  "/properties/:propertyId/features",
  allowRoles([
    "admin",
    "agent",
  ]),
  createPropertyFeature
);

/*
==========================================================
UPDATE PROPERTY FEATURE

PATCH /api/property-features/:featureId
==========================================================
*/

router.patch(
  "/property-features/:featureId",
  allowRoles([
    "admin",
    "agent",
  ]),
  updatePropertyFeature
);

/*
==========================================================
DELETE PROPERTY FEATURE

DELETE /api/property-features/:featureId

Soft Delete
==========================================================
*/

router.delete(
  "/property-features/:featureId",
  allowRoles([
    "admin",
    "agent",
  ]),
  deletePropertyFeature
);

/*
==========================================================
RESTORE PROPERTY FEATURE

PATCH /api/property-features/:featureId/restore
==========================================================
*/

router.patch(
  "/property-features/:featureId/restore",
  allowRoles([
    "admin",
    "agent",
  ]),
  restorePropertyFeature
);

/*
==========================================================
ENDPOINT SUMMARY
==========================================================

GET    /api/properties/:propertyId/features
       • Retrieve all active property features

POST   /api/properties/:propertyId/features
       • Create a new property feature

PATCH  /api/property-features/:featureId
       • Update property feature

DELETE /api/property-features/:featureId
       • Soft delete property feature

PATCH  /api/property-features/:featureId/restore
       • Restore previously deleted property feature

==========================================================
*/

export default router;