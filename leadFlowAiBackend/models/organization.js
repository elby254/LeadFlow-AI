/**
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
 * ✓ Future communication channels
 *
 * ==========================================================
 */

import mongoose from "mongoose";


// ==========================================================
// ORGANIZATION SCHEMA
// ==========================================================

const organizationSchema = new mongoose.Schema(
  {

    // ========================================================
    // ORGANIZATION PROFILE
    // ========================================================

    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },


    // ========================================================
    // COMPANY DETAILS
    // ========================================================

    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },

    phone: {
      type: String,
      default: "",
      trim: true,
    },

    website: {
      type: String,
      default: "",
      trim: true,
    },

    address: {
      type: String,
      default: "",
      trim: true,
    },


    // ========================================================
    // OWNERSHIP
    // ========================================================

    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },


    // ========================================================
    // SUBSCRIPTION MANAGEMENT
    // ========================================================

    plan: {
      type: String,
      enum: [
        "starter",
        "professional",
        "enterprise",
      ],
      default: "starter",
    },

    planStatus: {
      type: String,
      enum: [
        "active",
        "trial",
        "expired",
        "cancelled",
      ],
      default: "trial",
    },


    // ========================================================
    // TEAM LIMITS
    // ========================================================

    maxAgents: {
      type: Number,
      default: 5,
    },

    maxViewers: {
      type: Number,
      default: 2,
    },


    // ========================================================
    // BUSINESS METRICS
    // ========================================================

    totalLeads: {
      type: Number,
      default: 0,
    },

    totalConversions: {
      type: Number,
      default: 0,
    },


    // ========================================================
    // WHATSAPP BUSINESS INTEGRATION
    // ========================================================
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
    // ========================================================

    whatsappPhoneNumberId: {
      type: String,
      trim: true,
      unique: true,
      sparse: true,
      index: true,
    },

    whatsappBusinessNumber: {
      type: String,
      trim: true,
      default: "",
    },

    whatsappBusinessAccountId: {
      type: String,
      trim: true,
      default: "",
    },

    whatsappDisplayName: {
      type: String,
      trim: true,
      default: "",
    },

    whatsappEnabled: {
      type: Boolean,
      default: false,
    },


    // ========================================================
    // ORGANIZATION STATUS
    // ========================================================

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

  },
  {
    timestamps: true,
  }
);


// ==========================================================
// INDEXES
// ==========================================================
//
// IMPORTANT:
//
// `whatsappPhoneNumberId` already has:
//
//     index: true
//
// and `isActive` already has:
//
//     index: true
//
// Therefore we DO NOT declare those indexes again with:
//
//     organizationSchema.index(...)
//
// This prevents Mongoose duplicate schema index warnings.
//
// The architecture remains unchanged:
// WhatsApp organization resolution still uses:
//
//     whatsappPhoneNumberId
//     whatsappEnabled
//     isActive
//
// ==========================================================


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