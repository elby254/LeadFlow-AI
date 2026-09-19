/**
 * ==========================================================
 *
 * PURPOSE
 * ----------------------------------------------------------
 * Handles Property Amenities.
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
  getPropertyAmenities,
  createPropertyAmenity,
  updatePropertyAmenity,
  deletePropertyAmenity,
  restorePropertyAmenity,
} from "../controllers/propertyAmenityController.js";

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
GET PROPERTY AMENITIES

GET /api/properties/:propertyId/amenities
==========================================================
*/

router.get(
  "/properties/:propertyId/amenities",
  allowRoles([
    "admin",
    "agent",
    "viewer",
  ]),
  getPropertyAmenities
);

/*
==========================================================
CREATE PROPERTY AMENITY

POST /api/properties/:propertyId/amenities
==========================================================
*/

router.post(
  "/properties/:propertyId/amenities",
  allowRoles([
    "admin",
    "agent",
  ]),
  createPropertyAmenity
);

/*
==========================================================
UPDATE PROPERTY AMENITY

PATCH /api/property-amenities/:amenityId
==========================================================
*/

router.patch(
  "/property-amenities/:amenityId",
  allowRoles([
    "admin",
    "agent",
  ]),
  updatePropertyAmenity
);

/*
==========================================================
DELETE PROPERTY AMENITY

DELETE /api/property-amenities/:amenityId

Soft Delete
==========================================================
*/

router.delete(
  "/property-amenities/:amenityId",
  allowRoles([
    "admin",
    "agent",
  ]),
  deletePropertyAmenity
);

/*
==========================================================
RESTORE PROPERTY AMENITY

PATCH /api/property-amenities/:amenityId/restore
==========================================================
*/

router.patch(
  "/property-amenities/:amenityId/restore",
  allowRoles([
    "admin",
    "agent",
  ]),
  restorePropertyAmenity
);

/*
==========================================================
ENDPOINT SUMMARY
==========================================================

GET    /api/properties/:propertyId/amenities
       • Retrieve all active property amenities

POST   /api/properties/:propertyId/amenities
       • Create a new property amenity

PATCH  /api/property-amenities/:amenityId
       • Update property amenity

DELETE /api/property-amenities/:amenityId
       • Soft delete property amenity

PATCH  /api/property-amenities/:amenityId/restore
       • Restore previously deleted property amenity

==========================================================
*/

export default router;