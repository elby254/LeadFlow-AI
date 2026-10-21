// routes/whatsappRoutes.js
import express from "express";

import { verifyWhatsAppWebhook } from "../webhooks/whatsappWebhook.js";
import verifyMetaWebhookSignature from "../middleware/verifyMetaWebhookSignature.js";
import handleWhatsAppStatusWebhook from "../middleware/handleWhatsAppStatusWebhook.js";
import whatsappAdapter from "../adapters/channels/whatsappAdapter.js";
import { ingestMessage } from "../controllers/aiIngestionController.js";

const router = express.Router();

/* ==========================================================
   GET /api/webhooks/whatsapp
   Meta webhook verification handshake
========================================================== */
router.get("/", verifyWhatsAppWebhook);

/* ==========================================================
   POST /api/webhooks/whatsapp
   Pipeline:
   1. Verify X-Hub-Signature-256
   2. Process delivery status callbacks (acknowledge & stop)
   3. Parse inbound message → req.normalizedMessage
   4. AI ingestion (org resolution happens inside via
      resolveFromRequest using phoneNumberId)
========================================================== */
router.post(
  "/",
  verifyMetaWebhookSignature,
  handleWhatsAppStatusWebhook,
  whatsappAdapter,
  ingestMessage
);

export default router;