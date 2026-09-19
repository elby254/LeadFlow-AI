/**
 * ==========================================================
 *
 *
 * Supports
 * ----------------------------------------------------------
 * ✓ Request Viewing
 * ✓ List Viewings
 * ✓ Today's Viewings
 * ✓ Upcoming Viewings
 * ✓ Viewing Details
 * ✓ Approve
 * ✓ Reject
 * ✓ Cancel
 * ✓ Reschedule
 * ✓ Complete
 * ✓ Submit Feedback
 * ✓ Viewing Availability
 * ✓ Conflict Checking
 * ✓ Calendar Viewings
 * ✓ Agent Viewings
 * ✓ Lead Viewing History
 * ✓ Property Viewing History
 *
 * ==========================================================
 */

import express from "express";

import viewingController from "../controllers/viewingController.js";

import {
  protect,
} from "../middleware/authMiddleware.js";

import {
  authenticatedUser,
  allowRoles,
} from "../middleware/roleMiddleware.js";

const router = express.Router();

/* ==========================================================
   PROTECT ALL ROUTES
========================================================== */

router.use(protect);
router.use(authenticatedUser);


/* ==========================================================
   CREATE / REQUEST VIEWING
========================================================== */

/**
 * POST
 * /api/viewings
 *
 * Customer/agent creates a viewing request.
 */

router.post(
  "/",
  viewingController.requestViewing
);


/* ==========================================================
   LIST VIEWINGS
========================================================== */

/**
 * GET
 * /api/viewings
 *
 * Returns viewings visible to the authenticated user.
 */

router.get(
  "/",
  viewingController.getAllViewings
);


/* ==========================================================
   UPCOMING VIEWINGS
========================================================== */

/**
 * GET
 * /api/viewings/upcoming
 */

router.get(
  "/upcoming",
  viewingController.getUpcomingViewings
);


/* ==========================================================
   TODAY'S VIEWINGS
========================================================== */

/**
 * GET
 * /api/viewings/today
 */

router.get(
  "/today",
  viewingController.getTodayViewings
);


/* ==========================================================
   SCHEDULING / AVAILABILITY
========================================================== */

/**
 * GET
 * /api/viewings/availability
 *
 * Returns available viewing slots for an agent.
 *
 * Query:
 *
 * ?agentId=...
 * &date=...
 */

router.get(
  "/availability",
  viewingController.getAvailableSlots
);


/**
 * POST
 * /api/viewings/check-conflict
 *
 * Checks whether a proposed viewing conflicts
 * with an existing booking.
 */

router.post(
  "/check-conflict",
  viewingController.checkViewingConflict
);


/* ==========================================================
   CALENDAR VIEW
========================================================== */

/**
 * GET
 * /api/viewings/calendar
 *
 * Returns viewings for a selected calendar date.
 */

router.get(
  "/calendar",
  viewingController.getCalendarViewings
);


/* ==========================================================
   AGENT VIEWINGS
========================================================== */

/**
 * GET
 * /api/viewings/agent/:agentId
 *
 * Returns viewings assigned to a specific agent.
 */

router.get(
  "/agent/:agentId",
  viewingController.getAgentViewings
);


/* ==========================================================
   LEAD VIEWING HISTORY
========================================================== */

/**
 * GET
 * /api/viewings/lead/:leadId
 *
 * Returns all viewings associated with a lead.
 */

router.get(
  "/lead/:leadId",
  viewingController.getLeadViewings
);


/* ==========================================================
   PROPERTY VIEWING HISTORY
========================================================== */

/**
 * GET
 * /api/viewings/property/:propertyId
 *
 * Returns viewing history for a property.
 */

router.get(
  "/property/:propertyId",
  viewingController.getPropertyViewings
);


/* ==========================================================
   VIEWING DETAILS
========================================================== */

/**
 * GET
 * /api/viewings/:id
 *
 * IMPORTANT:
 * This generic route comes AFTER all specific routes.
 */

router.get(
  "/:id",
  viewingController.getViewingById
);


/* ==========================================================
   APPROVAL WORKFLOW
========================================================== */

/**
 * PATCH
 * /api/viewings/:id/approve
 */

router.patch(
  "/:id/approve",
  allowRoles([
    "admin",
    "agent",
  ]),
  viewingController.approveViewing
);


/**
 * PATCH
 * /api/viewings/:id/reject
 */

router.patch(
  "/:id/reject",
  allowRoles([
    "admin",
    "agent",
  ]),
  viewingController.rejectViewing
);


/**
 * PATCH
 * /api/viewings/:id/cancel
 */

router.patch(
  "/:id/cancel",
  allowRoles([
    "admin",
    "agent",
  ]),
  viewingController.cancelViewing
);


/**
 * PATCH
 * /api/viewings/:id/reschedule
 */

router.patch(
  "/:id/reschedule",
  allowRoles([
    "admin",
    "agent",
  ]),
  viewingController.rescheduleViewing
);


/**
 * PATCH
 * /api/viewings/:id/complete
 */

router.patch(
  "/:id/complete",
  allowRoles([
    "admin",
    "agent",
  ]),
  viewingController.completeViewing
);


/* ==========================================================
   FEEDBACK
========================================================== */

/**
 * POST
 * /api/viewings/:id/feedback
 */

router.post(
  "/:id/feedback",
  viewingController.submitFeedback
);


/* ==========================================================
   EXPORT
========================================================== */

export default router;