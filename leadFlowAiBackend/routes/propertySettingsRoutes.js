/**
 *
 * LeadFlow AI
 *
 * GET /api/properties/settings
 * PUT /api/properties/settings
 *
 * ==========================================================
 */

import express from "express";

import {
  getPropertySettings,
  updatePropertySettings,
} from "../controllers/propertySettingsController.js";

/* ==========================================================
   ROLE MIDDLEWARE
========================================================== */

import {
  allowRoles,
} from "../middleware/roleMiddleware.js";


/* ==========================================================
   ROUTER
========================================================== */

const router = express.Router();

/* ==========================================================
   GET PROPERTY SETTINGS
========================================================== */

router.get(
  "/settings",
allowRoles(["admin"]),
  getPropertySettings
);


/* ==========================================================
   UPDATE PROPERTY SETTINGS
========================================================== */

router.put(

  "/settings",
 allowRoles(["admin"]),
  updatePropertySettings
);


/* ==========================================================
   EXPORT
========================================================== */

export default router;