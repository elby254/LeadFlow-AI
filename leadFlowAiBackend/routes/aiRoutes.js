import express from "express";

import {
  protect,
} from "../middleware/authMiddleware.js";

import {
  ingestMessage,
} from "../controllers/aiIngestionController.js";

const router = express.Router();

// AI entry point (authenticated dashboard/API ingestion)
//
// Organization is resolved from:
//   JWT
//    ↓
//   req.user.organizationId
//    ↓
//   resolveFromRequest()
//    ↓
//   Organization
//
// Client-supplied organizationId is NOT trusted.

router.post(
  "/ingest-message",
  protect,
  ingestMessage
);

export default router;