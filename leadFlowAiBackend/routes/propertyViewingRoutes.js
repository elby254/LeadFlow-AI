/**
 * ==========================================================
 *
 * PURPOSE
 * ----------------------------------------------------------
 * Handles Property Viewing workflow.
 *
 * Used By
 * ----------------------------------------------------------
 * • Viewer Dashboard
 * • Agent Dashboard
 * • Admin Dashboard
 * • Calendar
 * • Viewing Management
 *
 * ==========================================================
 */

import express from "express";

import {
  createViewingRequest,
  getPropertyViewings,
  getViewerViewings,
  getAgentViewings,
  getViewingById,
  approveViewing,
  rejectViewing,
  rescheduleViewing,
  cancelViewing,
  completeViewing,
} from "../controllers/propertyViewingController.js";

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
CREATE VIEWING REQUEST

POST /api/property-viewings
==========================================================
*/

router.post(
  "/",
  allowRoles([
    "viewer",
  ]),
  createViewingRequest
);

/*
==========================================================
GET VIEWING DETAILS

GET /api/property-viewings/:viewingId
==========================================================
*/

router.get(
  "/:viewingId",
  allowRoles([
    "admin",
    "agent",
    "viewer",
  ]),
  getViewingById
);

/*
==========================================================
GET PROPERTY VIEWINGS

GET /api/property-viewings/property/:propertyId
==========================================================
*/

router.get(
  "/property/:propertyId",
  allowRoles([
    "admin",
    "agent",
  ]),
  getPropertyViewings
);

/*
==========================================================
GET VIEWER VIEWINGS

GET /api/property-viewings/my-viewings
==========================================================
*/

router.get(
  "/my-viewings",
  allowRoles([
    "viewer",
  ]),
  getViewerViewings
);

/*
==========================================================
GET AGENT VIEWINGS

GET /api/property-viewings/agent/my-viewings
==========================================================
*/

router.get(
  "/agent/my-viewings",
  allowRoles([
    "agent",
  ]),
  getAgentViewings
);

/*
==========================================================
APPROVE VIEWING

PATCH /api/property-viewings/:viewingId/approve
==========================================================
*/

router.patch(
  "/:viewingId/approve",
  allowRoles([
    "admin",
    "agent",
  ]),
  approveViewing
);

/*
==========================================================
REJECT VIEWING

PATCH /api/property-viewings/:viewingId/reject
==========================================================
*/

router.patch(
  "/:viewingId/reject",
  allowRoles([
    "admin",
    "agent",
  ]),
  rejectViewing
);

/*
==========================================================
RESCHEDULE VIEWING

PATCH /api/property-viewings/:viewingId/reschedule
==========================================================
*/

router.patch(
  "/:viewingId/reschedule",
  allowRoles([
    "admin",
    "agent",
  ]),
  rescheduleViewing
);

/*
==========================================================
CANCEL VIEWING

PATCH /api/property-viewings/:viewingId/cancel
==========================================================
*/

router.patch(
  "/:viewingId/cancel",
  allowRoles([
    "admin",
    "agent",
    "viewer",
  ]),
  cancelViewing
);

/*
==========================================================
COMPLETE VIEWING

PATCH /api/property-viewings/:viewingId/complete
==========================================================
*/

router.patch(
  "/:viewingId/complete",
  allowRoles([
    "admin",
    "agent",
  ]),
  completeViewing
);

/*
==========================================================
ENDPOINT SUMMARY
==========================================================

POST   /api/property-viewings
       • Request a property viewing

GET    /api/property-viewings/:viewingId
       • Retrieve viewing details

GET    /api/property-viewings/property/:propertyId
       • Retrieve all viewings for a property

GET    /api/property-viewings/my-viewings
       • Viewer viewing history

GET    /api/property-viewings/agent/my-viewings
       • Agent assigned viewings

PATCH  /api/property-viewings/:viewingId/approve
       • Approve viewing request

PATCH  /api/property-viewings/:viewingId/reject
       • Reject viewing request

PATCH  /api/property-viewings/:viewingId/reschedule
       • Reschedule viewing

PATCH  /api/property-viewings/:viewingId/cancel
       • Cancel viewing

PATCH  /api/property-viewings/:viewingId/complete
       • Mark viewing as completed

==========================================================
*/

export default router;