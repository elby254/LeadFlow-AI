/**
 * ==========================================================
 *
 * ORGANIZATION MODEL
 *
 * LeadFlow AI
 *
 * ==========================================================
 *
 * Represents a real estate agency or company using the
 * LeadFlow AI platform.
 *
 * Organizations provide tenant isolation for:
 *
 * ✓ Users
 * ✓ Leads
 * ✓ Conversations
 * ✓ Messages
 * ✓ Properties
 * ✓ WhatsApp integrations
 * ✓ Website integrations
 * ✓ Future communication channels
 *
 * ==========================================================
 */

import mongoose from "mongoose";

import {
  randomBytes,
} from "crypto";


// ==========================================================
// WEBSITE KEY GENERATOR
// ==========================================================
//
// IMPORTANT:
//
// This is a PUBLIC TENANT ROUTING IDENTIFIER.
//
// It is NOT a dashboard authentication secret.
//
// It identifies which organization's website/widget is sending
// the customer message.
//
// ==========================================================

const generateWebsiteKey = () => {

  return (
    "lfw_" +
    randomBytes(
      24
    ).toString(
      "hex"
    )
  );

};


// ==========================================================
// ORGANIZATION SCHEMA
// ==========================================================

const organizationSchema =
  new mongoose.Schema(
    {

      // ======================================================
      // ORGANIZATION PROFILE
      // ======================================================

      name: {

        type:
          String,

        required:
          true,

        trim:
          true,

        unique:
          true,

      },


      // ======================================================
      // COMPANY DETAILS
      // ======================================================

      email: {

        type:
          String,

        required:
          true,

        trim:
          true,

        lowercase:
          true,

      },


      phone: {

        type:
          String,

        default:
          "",

        trim:
          true,

      },


      website: {

        type:
          String,

        default:
          "",

        trim:
          true,

      },


      address: {

        type:
          String,

        default:
          "",

        trim:
          true,

      },


      // ======================================================
      // OWNERSHIP
      // ======================================================

      owner: {

        type:
          mongoose.Schema.Types.ObjectId,

        ref:
          "User",

        required:
          false,

      },


      // ======================================================
      // SUBSCRIPTION MANAGEMENT
      // ======================================================

      plan: {

        type:
          String,

        enum: [

          "starter",

          "professional",

          "enterprise",

        ],

        default:
          "starter",

      },


      planStatus: {

        type:
          String,

        enum: [

          "active",

          "trial",

          "expired",

          "cancelled",

        ],

        default:
          "trial",

      },


      // ======================================================
      // TEAM LIMITS
      // ======================================================

      maxAgents: {

        type:
          Number,

        default:
          5,

      },


      maxViewers: {

        type:
          Number,

        default:
          2,

      },


      // ======================================================
      // BUSINESS METRICS
      // ======================================================

      totalLeads: {

        type:
          Number,

        default:
          0,

      },


      totalConversions: {

        type:
          Number,

        default:
          0,

      },


      // ======================================================
      // WEBSITE / WIDGET INTEGRATION
      // ======================================================
      //
      // IMPORTANT:
      //
      // Each organization gets its own public website key.
      //
      // Example:
      //
      // lfw_91b2...
      //
      // The website key identifies the tenant but does NOT
      // grant dashboard access.
      //
      // The client must NEVER send organizationId directly.
      //
      // ======================================================

      websiteKey: {

        type:
          String,

        trim:
          true,

        unique:
          true,

        sparse:
          true,

        default:
          generateWebsiteKey,

      },


      // ======================================================
      // WEBSITE ALLOWED ORIGINS
      // ======================================================
      //
      // Optional production hardening.
      //
      // Example:
      //
      // [
      //   "https://www.example.co.ke",
      //   "https://example.co.ke"
      // ]
      //
      // If this list is populated, the website resolver can
      // verify the incoming Origin against it.
      //
      // An empty array means no origin allowlist has been
      // configured yet.
      //
      // ======================================================

      websiteAllowedOrigins: {

        type: [

          String,

        ],

        default:
          [],

      },


      // ======================================================
      // WHATSAPP BUSINESS INTEGRATION
      // ======================================================
      //
      // IMPORTANT:
      //
      // These are dedicated WhatsApp fields.
      //
      // DO NOT use the generic organization `phone` field
      // to resolve incoming WhatsApp webhooks.
      //
      // Meta sends:
      //
      // phone_number_id
      //
      // We use that value to identify the organization.
      //
      // ======================================================

      whatsappPhoneNumberId: {

        type:
          String,

        trim:
          true,

        unique:
          true,

        sparse:
          true,

        index:
          true,

      },


      whatsappBusinessNumber: {

        type:
          String,

        trim:
          true,

        default:
          "",

      },


      whatsappBusinessAccountId: {

        type:
          String,

        trim:
          true,

        default:
          "",

      },


      whatsappDisplayName: {

        type:
          String,

        trim:
          true,

        default:
          "",

      },


      whatsappEnabled: {

        type:
          Boolean,

        default:
          false,

      },


      // ======================================================
      // ORGANIZATION STATUS
      // ======================================================

      isActive: {

        type:
          Boolean,

        default:
          true,

        index:
          true,

      },

    },

    {

      timestamps:
        true,

    }

  );


// ==========================================================
// BACKFILL WEBSITE KEY WHEN AN EXISTING ORGANIZATION IS SAVED
// ==========================================================
//
// Existing organizations created before websiteKey existed may
// not have a websiteKey.
//
// This hook makes sure any organization that is subsequently
// created or saved receives one.
//
// ==========================================================

organizationSchema.pre(
  "validate",
  function (
    next
  ) {

    if (
      !this.websiteKey
    ) {

      this.websiteKey =
        generateWebsiteKey();

    }

    next();

  }
);


// ==========================================================
// MODEL
// ==========================================================

const Organization =

  mongoose.models.Organization ||

  mongoose.model(
    "Organization",
    organizationSchema
  );


export default Organization;