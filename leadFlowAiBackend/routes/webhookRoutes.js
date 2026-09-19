import express from "express";

/* ==========================================================
   CHANNEL ADAPTERS
========================================================== */

/*
 * Channel adapters are responsible for:
 *
 * ----------------------------------------------------------
 * External provider payload
 *        ↓
 * Provider-specific parsing
 *        ↓
 * Trusted channel identity
 *        ↓
 * normalizedMessage
 *
 * They do NOT perform:
 *
 * • AI qualification
 * • lead creation
 * • lead scoring
 * • assignment
 * • conversation persistence
 * • auto-reply
 *
 * Those responsibilities remain centralized inside the
 * AI ingestion pipeline.
 */

import whatsappAdapter
  from "../adapters/channels/whatsappAdapter.js";

import smsAdapter
  from "../adapters/channels/smsAdapter.js";

import facebookAdapter
  from "../adapters/channels/facebookAdapter.js";

import websiteAdapter
  from "../adapters/channels/websiteAdapter.js";


/* ==========================================================
   CHANNEL SOURCE VALIDATION
========================================================== */

import {
  requireChannelSource,
} from "../middleware/channelSourceMiddleware.js";


/* ==========================================================
   ORGANIZATION RESOLUTION
========================================================== */

import resolveChannelOrganization
  from "../middleware/channelOrganisationResolver.js";


/* ==========================================================
   AI INGESTION
========================================================== */

import {
  ingestMessage,
} from "../controllers/aiIngestionController.js";


/* ==========================================================
   ROUTER
========================================================== */

const router =
  express.Router();


/* ==========================================================
   WHATSAPP
========================================================== */

/**
 * ==========================================================
 * POST /api/webhooks/whatsapp
 * ==========================================================
 *
 * COMPLETE STANDARDIZED CHANNEL FLOW
 *
 * Meta
 *   ↓
 * WhatsApp webhook
 *   ↓
 * whatsappAdapter
 *   ↓
 * normalizedMessage
 *   ↓
 * requireChannelSource
 *   ↓
 * resolveChannelOrganization
 *   ↓
 * ingestMessage
 *   ↓
 * AI ingestion pipeline
 *
 * ==========================================================
 *
 * IMPORTANT
 * ----------------------------------------------------------
 * The old WhatsApp controller previously performed:
 *
 * • Meta payload extraction
 * • customer extraction
 * • organization resolution
 * • normalized payload creation
 * • ingestMessage()
 *
 * That logic must NOT be executed again here.
 *
 * The adapter is now responsible for channel-specific
 * normalization.
 *
 * ==========================================================
 */

router.post(
  "/whatsapp",

  /* --------------------------------------------------------
     1. WHATSAPP CHANNEL ADAPTER
  -------------------------------------------------------- */

  whatsappAdapter,


  /* --------------------------------------------------------
     2. TRUSTED SOURCE VALIDATION
  -------------------------------------------------------- */

  requireChannelSource,


  /* --------------------------------------------------------
     3. ORGANIZATION RESOLUTION
  -------------------------------------------------------- */

  resolveChannelOrganization,


  /* --------------------------------------------------------
     4. SHARED AI INGESTION ENGINE
  -------------------------------------------------------- */

  ingestMessage
);


/* ==========================================================
   SMS
========================================================== */

/**
 * ==========================================================
 * POST /api/webhooks/sms
 * ==========================================================
 *
 * SMS
 *   ↓
 * smsAdapter
 *   ↓
 * requireChannelSource
 *   ↓
 * resolveChannelOrganization
 *   ↓
 * ingestMessage
 *
 * NOTE
 * ----------------------------------------------------------
 * This route is standardized but is NOT being changed as
 * part of the current WhatsApp wiring task.
 *
 * ==========================================================
 */

router.post(
  "/sms",

  smsAdapter,

  requireChannelSource,

  resolveChannelOrganization,

  ingestMessage
);


/* ==========================================================
   FACEBOOK
========================================================== */

/**
 * ==========================================================
 * POST /api/webhooks/facebook
 * ==========================================================
 *
 * Facebook
 *   ↓
 * facebookAdapter
 *   ↓
 * requireChannelSource
 *   ↓
 * resolveChannelOrganization
 *   ↓
 * ingestMessage
 *
 * NOTE
 * ----------------------------------------------------------
 * This route is standardized but is NOT being changed as
 * part of the current WhatsApp wiring task.
 *
 * ==========================================================
 */

router.post(
  "/facebook",

  facebookAdapter,

  requireChannelSource,

  resolveChannelOrganization,

  ingestMessage
);


/* ==========================================================
   WEBSITE
========================================================== */

/**
 * ==========================================================
 * POST /api/webhooks/website
 * ==========================================================
 *
 * Website
 *   ↓
 * websiteAdapter
 *   ↓
 * requireChannelSource
 *   ↓
 * resolveChannelOrganization
 *   ↓
 * ingestMessage
 *
 * NOTE
 * ----------------------------------------------------------
 * This route is standardized but is NOT being changed as
 * part of the current WhatsApp wiring task.
 *
 * ==========================================================
 */

router.post(
  "/website",

  websiteAdapter,

  requireChannelSource,

  resolveChannelOrganization,

  ingestMessage
);


/* ==========================================================
   EXPORT
========================================================== */

export default router;