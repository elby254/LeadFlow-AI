/**
 * ==========================================================
 *
 * DELIVERY JOB MODEL
 * LeadFlow AI
 *
 * ==========================================================
 *
 * Purpose
 * ----------------------------------------------------------
 * Durable operational state for outbound message delivery.
 *
 * IMPORTANT
 * ----------------------------------------------------------
 * Message is the canonical conversation record.
 *
 * DeliveryJob is the operational delivery record responsible
 * for:
 *
 * ✓ Queuing
 * ✓ Attempts
 * ✓ Retry scheduling
 * ✓ Worker locking
 * ✓ Provider tracking
 * ✓ Delivery failure tracking
 * ✓ Idempotent outbound processing
 *
 * Message
 *    │
 *    └── DeliveryJob
 *
 * ==========================================================
 */

import mongoose from "mongoose";


// ==========================================================
// CONSTANTS
// ==========================================================

export const DELIVERY_JOB_STATUS = Object.freeze({
  PENDING: "pending",
  PROCESSING: "processing",
  SENT: "sent",
  FAILED: "failed",
  DEAD: "dead",
});


// ----------------------------------------------------------
// Supported outbound channels
// ----------------------------------------------------------

export const DELIVERY_CHANNELS = Object.freeze([
  "sms",
  "whatsapp",
  "website",
  "facebook",
]);


// ----------------------------------------------------------
// Supported providers
// ----------------------------------------------------------
//
// These represent the transport provider expected to handle
// the job.
//
// They are deliberately explicit rather than inferred from
// the customer's phone number.
//

export const DELIVERY_PROVIDERS = Object.freeze([
  "africastalking",
  "meta_whatsapp_cloud_api",
  "realtime",
  "facebook",
  null,
]);


// ==========================================================
// MAIN DELIVERY JOB SCHEMA
// ==========================================================

const deliveryJobSchema =
  new mongoose.Schema(
    {

      // ======================================================
      // MULTI-TENANCY
      // ======================================================
      //
      // Every delivery job belongs to exactly one
      // organization.
      //
      // ======================================================

      organizationId: {

        type:
          mongoose.Schema.Types.ObjectId,

        ref: "Organization",

        required: true,

        index: true,

      },


      // ======================================================
      // MESSAGE
      // ======================================================
      //
      // The Message is the canonical conversation record.
      //
      // This reference allows the delivery worker to update
      // the corresponding Message after delivery succeeds or
      // fails.
      //
      // ======================================================

      messageId: {

        type:
          mongoose.Schema.Types.ObjectId,

        ref: "Message",

        required: true,

        index: true,

      },


      // ======================================================
      // CONVERSATION
      // ======================================================

      conversationId: {

        type:
          mongoose.Schema.Types.ObjectId,

        ref: "Conversation",

        required: true,

        index: true,

      },


      // ======================================================
      // LEAD
      // ======================================================

      leadId: {

        type:
          mongoose.Schema.Types.ObjectId,

        ref: "Lead",

        default: null,

        index: true,

      },


      // ======================================================
      // CHANNEL / SOURCE
      // ======================================================
      //
      // This is the trusted channel selected upstream.
      //
      // The delivery worker must NOT infer the channel from
      // the recipient phone number.
      //
      // ======================================================

      source: {

        type: String,

        enum: DELIVERY_CHANNELS,

        required: true,

        index: true,

      },


      // ======================================================
      // RECIPIENT
      // ======================================================
      //
      // Stored on the job so a delivery attempt remains
      // self-contained even if Lead data subsequently changes.
      //
      // ======================================================

      recipient: {

        type: String,

        required: true,

        trim: true,

      },


      // ======================================================
      // PROVIDER
      // ======================================================
      //
      // Provider selected for this delivery.
      //
      // Examples:
      //
      // sms      → africastalking
      // whatsapp → meta_whatsapp_cloud_api
      // website  → realtime
      //
      // ======================================================

      provider: {

        type: String,

        enum: DELIVERY_PROVIDERS,

        default: null,

        index: true,

      },


      // ======================================================
      // STATUS
      // ======================================================
      //
      // Delivery lifecycle:
      //
      // pending
      //    ↓
      // processing
      //    ↓
      // sent
      //
      // or:
      //
      // processing
      //    ↓
      // failed
      //    ↓
      // pending
      //    ↓
      // processing
      //
      // Eventually:
      //
      // failed → dead
      //
      // ======================================================

      status: {

        type: String,

        enum:
          Object.values(
            DELIVERY_JOB_STATUS
          ),

        default:
          DELIVERY_JOB_STATUS.PENDING,

        index: true,

      },


      // ======================================================
      // ATTEMPTS
      // ======================================================
      //
      // Number of actual delivery attempts made by workers.
      //
      // ======================================================

      attempts: {

        type: Number,

        default: 0,

        min: 0,

      },


      // ======================================================
      // MAX ATTEMPTS
      // ======================================================
      //
      // Maximum number of delivery attempts before the job
      // becomes DEAD.
      //
      // ======================================================

      maxAttempts: {

        type: Number,

        default: 10,

        min: 1,

      },


      // ======================================================
      // NEXT ATTEMPT
      // ======================================================
      //
      // Worker should only claim jobs whose nextAttemptAt
      // has arrived.
      //
      // ======================================================

      nextAttemptAt: {

        type: Date,

        default: Date.now,

        index: true,

      },


      // ======================================================
      // LOCK
      // ======================================================
      //
      // Prevents multiple workers from processing the same
      // delivery job simultaneously.
      //
      // ======================================================

      lockToken: {

        type: String,

        default: null,

        index: true,

      },


      lockExpiresAt: {

        type: Date,

        default: null,

        index: true,

      },


      lockedAt: {

        type: Date,

        default: null,

      },


      workerName: {

        type: String,

        default: null,

        trim: true,

      },


      // ======================================================
      // TRANSPORT ATTEMPT / RECONCILIATION
      // ======================================================
      //
      // A persisted transport attempt means the provider
      // outcome may be uncertain after a crash or timeout.
      //
      // Never interpret this timestamp as proof that the
      // provider received or accepted the request.
      //
      // ======================================================

      transportAttemptedAt: {
        type: Date,
        default: null,
        index: true,
      },

      reconciliationRequired: {
        type: Boolean,
        default: false,
        index: true,
      },


      // ======================================================
      // PROVIDER MESSAGE ID
      // ======================================================
      //
      // Stores the provider's identifier after successful
      // submission where the provider exposes one.
      //
      // Examples:
      //
      // WhatsApp message ID
      // SMS provider message ID
      //
      // ======================================================

      providerMessageId: {

        type: String,

        default: null,

        trim: true,

        index: true,

      },


      // ======================================================
      // LAST ERROR
      // ======================================================

      lastError: {

        type: String,

        default: "",

        trim: true,

      },


      lastErrorAt: {

        type: Date,

        default: null,

      },


      // ======================================================
      // SENT
      // ======================================================

      sentAt: {

        type: Date,

        default: null,

      },


      // ======================================================
      // FAILED
      // ======================================================

      failedAt: {

        type: Date,

        default: null,

      },


      // ======================================================
      // DEAD
      // ======================================================
      //
      // A dead job has exhausted its retry policy or has been
      // permanently rejected.
      //
      // ======================================================

      deadAt: {

        type: Date,

        default: null,

      },


      deadReason: {

        type: String,

        default: "",

        trim: true,

      },


      // ======================================================
      // IDEMPOTENCY KEY
      // ======================================================
      //
      // Prevents duplicate DeliveryJobs from being created
      // for the same logical outbound message.
      //
      // Example:
      //
      // ai-reply:<messageId>
      //
      // ======================================================

      idempotencyKey: {

        type: String,

        required: true,

        trim: true,

        unique: true,

      },


      // ======================================================
      // CHANNEL METADATA
      // ======================================================
      //
      // Provider/channel-specific information that should
      // travel with the delivery attempt.
      //
      // Examples:
      //
      // WhatsApp phone number ID
      // Website socket/channel information
      //
      // ======================================================

      channelMetadata: {

        type: mongoose.Schema.Types.Mixed,

        default: {},

      },


      // ======================================================
      // DELIVERY CONTEXT
      // ======================================================
      //
      // Additional operational context.
      //
      // This is NOT the authoritative Lead state.
      //
      // ======================================================

      metadata: {

        type: mongoose.Schema.Types.Mixed,

        default: {},

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
// Worker lookup:
// pending/failed jobs whose retry time has arrived.
//
// ==========================================================

deliveryJobSchema.index({

  status: 1,

  nextAttemptAt: 1,

  createdAt: 1,

});


// ==========================================================
// LOCK RECOVERY
// ==========================================================
//
// Allows workers to find processing jobs whose leases have
// expired.
//
// ==========================================================

deliveryJobSchema.index({

  status: 1,

  lockExpiresAt: 1,

});


// ==========================================================
// TENANT + STATUS
// ==========================================================

deliveryJobSchema.index({

  organizationId: 1,

  status: 1,

  createdAt: -1,

});


// ==========================================================
// MESSAGE LOOKUP
// ==========================================================

deliveryJobSchema.index({

  organizationId: 1,

  messageId: 1,

});


// ==========================================================
// CONVERSATION LOOKUP
// ==========================================================

deliveryJobSchema.index({

  organizationId: 1,

  conversationId: 1,

  createdAt: -1,

});


// ==========================================================
// MODEL
// ==========================================================
//
// Prevents OverwriteModelError during development / hot
// reloads.
//
// ==========================================================

const DeliveryJob =

  mongoose.models.DeliveryJob ||

  mongoose.model(

    "DeliveryJob",

    deliveryJobSchema

  );


export default DeliveryJob;