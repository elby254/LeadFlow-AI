/**
 * ============================================================
 *
 * AI INGESTION ROUTES
 *
 * LeadFlow AI
 *
 * ============================================================
 *
 * PURPOSE
 * ------------------------------------------------------------
 *
 * Central HTTP entry point for normalized incoming messages.
 *
 *
 * CHANNEL ARCHITECTURE
 * ------------------------------------------------------------
 *
 * WhatsApp
 *    ↓
 * WhatsApp webhook / adapter
 *    ↓
 * normalized payload
 *    ↓
 * aiIngestionRoutes
 *    ↓
 * aiIngestionController
 *    ↓
 * deterministic extraction
 *    ↓
 * Lead / Conversation
 *    ↓
 * AI Auto Reply
 *    ↓
 * source-based transport
 *    ↓
 * WhatsApp / SMS
 *
 *
 * IMPORTANT
 * ------------------------------------------------------------
 *
 * This route does NOT:
 *
 * - extract intent
 * - call OpenAI directly
 * - persist Lead.intent directly
 * - send SMS
 * - send WhatsApp
 * - determine the customer's intent
 *
 *
 * Those responsibilities belong to the appropriate layers.
 *
 *
 * RESPONSIBILITIES
 * ------------------------------------------------------------
 *
 * 1. Receive normalized ingestion requests.
 * 2. Pass the request to aiIngestionController.
 * 3. Keep channel-specific transport logic outside the
 *    ingestion controller.
 *
 *
 * ============================================================
 */

import express from "express";

import {
  ingestMessage,
} from "../controllers/aiIngestionController.js";


// ============================================================
// ROUTER
// ============================================================

const router =
  express.Router();


// ============================================================
// POST /
// ============================================================
//
// Receives a normalized incoming customer message.
//
// Expected structure:
//
// {
//   organizationId: "...",
//
//   source: "whatsapp",
//
//   customer: {
//
//     name: "...",
//
//     phone: "...",
//
//   },
//
//   message: "I want to rent a house.",
//
//   whatsapp: {
//
//     messageId: "...",
//
//     phoneNumberId: "...",
//
//     businessNumber: "...",
//
//   },
//
// }
//
// The exact channel-specific metadata may differ.
//
// The important fields are:
//
// organizationId
// source
// customer
// message
//
// ============================================================

router.post(
  "/",
  async (
    req,
    res,
    next
  ) => {

    try {

      console.log(
        "=================================================="
      );

      console.log(
        "📩 AI INGESTION ROUTE"
      );

      console.log(
        "=================================================="
      );


      // ======================================================
      // DEBUG REQUEST
      // ======================================================

      console.log(
        "📦 AI INGESTION REQUEST BODY:"
      );

      console.dir(
        req.body,
        {
          depth: null,
        }
      );


      // ======================================================
      // BASIC VALIDATION
      // ======================================================

      const body =
        req.body || {};


      if (
        !body.source
      ) {

        console.warn(
          "⚠️ AI ingestion request has no source."
        );

        return res
          .status(400)
          .json({

            success:
              false,

            message:
              "Message source is required.",

          });
      }


      if (
        !body.message ||
        !String(body.message).trim()
      ) {

        console.warn(
          "⚠️ AI ingestion request has no message."
        );

        return res
          .status(400)
          .json({

            success:
              false,

            message:
              "Message is required.",

          });
      }


      // ======================================================
      // SUPPORTED SOURCES
      // ======================================================
      //
      // The source should have already been established by
      // the trusted channel adapter/webhook.
      //
      // The customer must NEVER be allowed to arbitrarily
      // choose an organization.
      //
      // ======================================================

      const supportedSources = [

        "whatsapp",

        "sms",

        "facebook",

      ];


      const source =
        String(
          body.source
        )
          .trim()
          .toLowerCase();


      if (
        !supportedSources.includes(
          source
        )
      ) {

        console.warn(
          "⚠️ Unsupported ingestion source:",
          body.source
        );

        return res
          .status(400)
          .json({

            success:
              false,

            message:
              "Unsupported message source.",

          });
      }


      // ======================================================
      // NORMALIZED SOURCE
      // ======================================================
      //
      // Make sure downstream services receive the canonical
      // source value.
      //
      // ======================================================

      const normalizedBody = {

        ...body,

        source,

      };


      console.log(
        "📡 AI INGESTION SOURCE:",
        source
      );


      // ======================================================
      // ORGANIZATION
      // ======================================================
      //
      // Organization resolution should happen BEFORE this
      // layer for external channels.
      //
      // Examples:
      //
      // WhatsApp:
      //
      // Meta phone_number_id
      //        ↓
      // WhatsApp organization resolver
      //        ↓
      // organizationId
      //
      //
      // SMS:
      //
      // configured business number / provider metadata
      //        ↓
      // organization resolver
      //        ↓
      // organizationId
      //
      //
      // Facebook:
      //
      // page ID
      //        ↓
      // Facebook organization resolver
      //        ↓
      // organizationId
      //
      // ======================================================

      if (
        !normalizedBody.organizationId
      ) {

        console.warn(
          "⚠️ AI ingestion request has no resolved organizationId."
        );

        return res
          .status(400)
          .json({

            success:
              false,

            message:
              "Organization could not be resolved.",

          });
      }


      // ======================================================
      // NORMALIZED PAYLOAD
      // ======================================================

      const normalizedPayload = {

        ...normalizedBody,

        customer:
          normalizedBody.customer ||
          {},

      };


      console.log(
        "🧠 NORMALIZED AI INGESTION PAYLOAD:"
      );

      console.dir(
        normalizedPayload,
        {
          depth: null,
        }
      );


      // ======================================================
      // PASS TO CONTROLLER
      // ======================================================
      //
      // The controller owns the actual AI ingestion workflow.
      //
      // Route
      //   ↓
      // Controller
      //   ↓
      // Lead resolution
      //   ↓
      // deterministic extraction
      //   ↓
      // intent persistence
      //   ↓
      // conversation state
      //   ↓
      // AI response
      //   ↓
      // auto reply
      //
      // ======================================================

      const result =
        await ingestMessage({

          body:
            normalizedPayload,

        });


      // ======================================================
      // CONTROLLER RESULT
      // ======================================================

      console.log(
        "🧠 AI INGESTION CONTROLLER RESULT:"
      );

      console.dir(
        result,
        {
          depth: null,
        }
      );


      // ======================================================
      // SUCCESS
      // ======================================================

      return res
        .status(200)
        .json({

          success:
            true,

          ...(result || {}),

        });

    } catch (error) {

      // ======================================================
      // ERROR
      // ======================================================

      console.error(
        "=================================================="
      );

      console.error(
        "❌ AI INGESTION ROUTE ERROR"
      );

      console.error(
        error
      );

      console.error(
        error?.stack
      );

      console.error(
        "=================================================="
      );


      return next(
        error
      );
    }
  }
);


// ============================================================
// DEFAULT EXPORT
// ============================================================

export default router;