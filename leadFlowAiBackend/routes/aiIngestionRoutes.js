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
 * Central HTTP entry point for website/direct message
 * ingestion.
 *
 *
 * PUBLIC REQUEST CONTRACT
 * ------------------------------------------------------------
 *
 * Body:
 *
 * {
 *   "phone": "+254712345678",
 *   "message": "I want a 3 bedroom house in Kilimani."
 * }
 *
 *
 * Tenant routing:
 *
 * X-LeadFlow-Website-Key: <websiteKey>
 *
 *
 * IMPORTANT
 * ------------------------------------------------------------
 *
 * The client does NOT send organizationId in the body.
 *
 * The route establishes:
 *
 *     source = "website"
 *
 * The centralized organization resolver establishes:
 *
 *     websiteKey
 *          ↓
 *     Organization
 *          ↓
 *     organizationId
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
// POST /api/ai-ingestion
//
// Body:
//
// {
//   "phone": "+254712345678",
//   "message": "I want a house in Kilimani."
// }
//
// Header:
//
// X-LeadFlow-Website-Key: lfw_...
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
        "==================================================");


      // ======================================================
      // DEBUG REQUEST BODY
      // ======================================================

      console.log(
        "📦 RAW AI INGESTION REQUEST BODY:"
      );

      console.dir(
        req.body,
        {
          depth: null,
        }
      );


      // ======================================================
      // BASIC BODY VALIDATION
      // ======================================================

      const body =
        req.body || {};


      if (
        typeof body !== "object" ||
        Array.isArray(body)
      ) {

        console.warn(
          "⚠️ AI ingestion request body must be an object."
        );


        return res
          .status(400)
          .json({

            success:
              false,

            message:
              "Request body must be a JSON object.",

          });

      }


      // ======================================================
      // PHONE VALIDATION
      // ======================================================

      if (
        !body.phone ||
        !String(
          body.phone
        ).trim()
      ) {

        console.warn(
          "⚠️ AI ingestion request has no phone."
        );


        return res
          .status(400)
          .json({

            success:
              false,

            message:
              "Phone is required.",

          });

      }


      // ======================================================
      // MESSAGE VALIDATION
      // ======================================================

      if (
        !body.message ||
        !String(
          body.message
        ).trim()
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
      // WEBSITE SOURCE
      // ======================================================
      //
      // This route represents direct website ingestion.
      //
      // source is trusted infrastructure metadata.
      //
      // It is NOT accepted from req.body.
      //
      // ======================================================

      req.source =
        "website";

      req.channel =
        "website";


      console.log(
        "📡 AI INGESTION SOURCE:",
        req.source
      );


      // ======================================================
      // WEBSITE TENANT ROUTING KEY
      // ======================================================
      //
      // Canonical header:
      //
      // X-LeadFlow-Website-Key
      //
      // The header identifies the organization's website.
      //
      // It does NOT grant dashboard permissions.
      //
      // ======================================================

      const websiteKey =
        typeof req.get ===
          "function"

          ? (
              req.get(
                "X-LeadFlow-Website-Key"
              ) || ""
            ).trim()

          : (
              req.headers?.[
                "x-leadflow-website-key"
              ] ||
              ""
            ).trim();


      const authenticatedOrganizationId =
        req?.user?.organizationId ||
        req?.organization?._id ||
        req?.organization?.id ||
        null;


      // ======================================================
      // WEBSITE ROUTING KEY VALIDATION
      // ======================================================
      //
      // Public website/Postman requests need the website key.
      //
      // Trusted authenticated internal requests may resolve
      // their organization through req.user / req.organization.
      //
      // ======================================================

      if (
        !websiteKey &&
        !authenticatedOrganizationId
      ) {

        console.warn(
          "⚠️ AI ingestion request has no website routing key."
        );


        return res
          .status(400)
          .json({

            success:
              false,

            message:
              "Website routing key is required.",

          });

      }


      if (
        websiteKey
      ) {

        req.websiteKey =
          websiteKey;

      }


      console.log(
        "🌐 WEBSITE TENANT KEY PRESENT:",
        Boolean(
          websiteKey
        )
      );


      // ======================================================
      // ORGANIZATION DEBUG CONTEXT
      // ======================================================

      console.log(
        "🏢 AI INGESTION ORGANIZATION CONTEXT:"
      );

      console.log({

        authenticatedOrganizationId:
          authenticatedOrganizationId,

        websiteKeyPresent:
          Boolean(
            websiteKey
          ),

      });


      // ======================================================
      // FORWARD ORIGINAL EXPRESS REQUEST
      // ======================================================
      //
      // ingestMessage expects:
      //
      // ingestMessage(req, res)
      //
      // Passing the original request preserves:
      //
      // req.body
      // req.source
      // req.channel
      // req.websiteKey
      // req.user
      // req.organization
      //
      // ======================================================

      console.log(
        "🚀 FORWARDING REQUEST TO AI INGESTION CONTROLLER..."
      );


      return await ingestMessage(
        req,
        res
      );


    } catch (
      error
    ) {

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