import express from "express";
import { ingestMessage } from "../controllers/aiIngestionController.js";

const router = express.Router();

// AI entry point (WhatsApp/SMS/Web)
router.post("/ingest-message", ingestMessage);

export default router;