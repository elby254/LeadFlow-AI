import express from "express";

import {
  verifyWhatsAppWebhook,
} from "../webhooks/whatsappWebhook.js";

const router =
  express.Router();

/* ==========================================================
   META WEBHOOK VERIFICATION
========================================================== */

/**
 * ==========================================================
 * GET /api/webhooks/whatsapp
 * ==========================================================
 *
 * Used exclusively by Meta to verify the WhatsApp webhook.
 *
 * IMPORTANT
 * ----------------------------------------------------------
 * This route is intentionally kept separate from the
 * standardized POST channel-ingestion pipeline.
 *
 * GET
 *   ↓
 * Meta verification
 *
 * POST
 *   ↓
 * webhookRoutes.js
 *   ↓
 * whatsappAdapter
 *   ↓
 * AI ingestion
 *
 * ==========================================================
 */

router.get(
  "/",
  verifyWhatsAppWebhook
);


/* ==========================================================
   EXPORT
========================================================== */

export default router;