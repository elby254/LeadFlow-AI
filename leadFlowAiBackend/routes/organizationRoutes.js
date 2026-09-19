/**
 * ==========================================================
 * ORGANIZATION ROUTES
 * LeadFlow AI
 * ==========================================================
 *
 * Organization-level configuration endpoints.
 *
 * Current responsibility:
 *
 * ✓ WhatsApp configuration
 *
 * Access:
 *
 * ✓ Authenticated administrators only
 *
 * ==========================================================
 */

import express from "express";

import {
  getWhatsAppConfiguration,
  updateWhatsAppConfiguration,
} from "../controllers/organizationController.js";

import { protect } from "../middleware/authMiddleware.js";
import { allowRoles } from "../middleware/roleMiddleware.js";

const router = express.Router();

/* ==========================================================
   ADMIN ORGANIZATION ACCESS
========================================================== */

router.use(protect);

router.use(
  allowRoles(["admin"])
);

/* ==========================================================
   WHATSAPP CONFIGURATION
========================================================== */

/**
 * GET
 * /api/organizations/whatsapp
 */
router.get(
  "/whatsapp",
  getWhatsAppConfiguration
);

/**
 * PUT
 * /api/organizations/whatsapp
 */
router.put(
  "/whatsapp",
  updateWhatsAppConfiguration
);

export default router;