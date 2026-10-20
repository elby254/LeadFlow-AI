/**
 * ==========================================================
 *
 * LEADFLOW AI
 * OUTBOX EVENT MODEL
 *
 * ==========================================================
 *
 * PURPOSE
 * ----------------------------------------------------------
 *
 * Provides durable persistence for business events before
 * they are delivered to the in-memory event bus.
 *
 * ==========================================================
 *
 * DELIVERY SEMANTICS
 * ==========================================================
 *
 * Delivery is intentionally AT-LEAST-ONCE.
 *
 * Consumers must therefore tolerate duplicate delivery.
 *
 * ==========================================================
 */

import mongoose from "mongoose";

import {
  LEAD_EVENTS,
} from "../events/leadEvents.js";

/* ==========================================================
   EVENT STATUS
========================================================== */

const OUTBOX_STATUS = Object.freeze({
  PENDING:
    "pending",

  PROCESSING:
    "processing",

  PUBLISHED:
    "published",

  FAILED:
    "failed",

  DEAD:
    "dead",
});

/* ==========================================================
   AGGREGATE TYPES
========================================================== */

const AGGREGATE_TYPES = Object.freeze([
  "lead",

  "conversation",

  "viewing",

  "property",

  "assignment",

  "organization",

  "system",
]);

/* ==========================================================
   EVENT SCHEMA
========================================================== */

const outboxEventSchema =
  new mongoose.Schema(
    {
      /* ======================================================
         EVENT ID
      ====================================================== */

      eventId: {
        type:
          String,

        required:
          true,

        unique:
          true,

        index:
          true,

        trim:
          true,
      },

      /* ======================================================
         EVENT TYPE
      ====================================================== */

      eventType: {
        type:
          String,

        required:
          true,

        enum:
          Object.values(
            LEAD_EVENTS
          ),

        index:
          true,

        trim:
          true,
      },

      /* ======================================================
         AGGREGATE TYPE
      ====================================================== */

      aggregateType: {
        type:
          String,

        required:
          true,

        enum:
          AGGREGATE_TYPES,

        index:
          true,
      },

      /* ======================================================
         AGGREGATE ID
      ====================================================== */

      aggregateId: {
        type:
          String,

        required:
          true,

        trim:
          true,

        index:
          true,
      },

      /* ======================================================
         ORGANIZATION
      ====================================================== */

      organizationId: {
        type:
          mongoose.Schema.Types.ObjectId,

        ref:
          "Organization",

        required:
          true,

        index:
          true,
      },

      /* ======================================================
         PAYLOAD
      ====================================================== */

      payload: {
        type:
          mongoose.Schema.Types.Mixed,

        required:
          true,
      },

      /* ======================================================
         IDEMPOTENCY KEY
      ====================================================== */

      /**
       * IMPORTANT
       * ------------------------------------------------------
       *
       * Do NOT use:
       *
       *   default: null
       *
       * with a sparse unique index.
       *
       * A field explicitly stored as:
       *
       *   deduplicationKey: null
       *
       * still exists in the document and can therefore be
       * indexed by MongoDB.
       *
       * That causes:
       *
       *   E11000 duplicate key
       *
       * when a second event without a deduplication key is
       * inserted.
       *
       * Undefined means the field is omitted when no key exists.
       */
      deduplicationKey: {
        type:
          String,

        trim:
          true,

        default:
          undefined,
      },

      /* ======================================================
         STATUS
      ====================================================== */

      status: {
        type:
          String,

        enum:
          Object.values(
            OUTBOX_STATUS
          ),

        default:
          OUTBOX_STATUS.PENDING,

        index:
          true,
      },

      /* ======================================================
         ATTEMPTS
      ====================================================== */

      attempts: {
        type:
          Number,

        default:
          0,

        min:
          0,
      },

      /* ======================================================
         MAX ATTEMPTS
      ====================================================== */

      maxAttempts: {
        type:
          Number,

        default:
          10,

        min:
          1,
      },

      /* ======================================================
         NEXT ATTEMPT
      ====================================================== */

      nextAttemptAt: {
        type:
          Date,

        default:
          Date.now,

        index:
          true,
      },

      /* ======================================================
         PROCESSING LOCK
      ====================================================== */

      lockedAt: {
        type:
          Date,

        default:
          null,
      },

      lockExpiresAt: {
        type:
          Date,

        default:
          null,

        index:
          true,
      },

      lockToken: {
        type:
          String,

        default:
          null,

        index:
          true,
      },

      /* ======================================================
         PUBLISHED
      ====================================================== */

      publishedAt: {
        type:
          Date,

        default:
          null,

        index:
          true,
      },

      /* ======================================================
         LAST ERROR
      ====================================================== */

      lastError: {
        type:
          String,

        default:
          null,
      },

      lastErrorAt: {
        type:
          Date,

        default:
          null,
      },

      /* ======================================================
         DEAD LETTER
      ====================================================== */

      deadAt: {
        type:
          Date,

        default:
          null,
      },

      deadReason: {
        type:
          String,

        default:
          null,
      },

      /* ======================================================
         WORKER METADATA
      ====================================================== */

      workerName: {
        type:
          String,

        default:
          null,
      },

      /* ======================================================
         EVENT TIMESTAMP
      ====================================================== */

      occurredAt: {
        type:
          Date,

        default:
          Date.now,

        index:
          true,
      },
    },

    {
      timestamps:
        true,
    }
  );

/* ==========================================================
   INDEXES
========================================================== */

/**
 * Worker polling index.
 */
outboxEventSchema.index({
  status:
    1,

  nextAttemptAt:
    1,

  createdAt:
    1,
});

/**
 * Recovery index.
 */
outboxEventSchema.index({
  status:
    1,

  lockExpiresAt:
    1,
});

/**
 * Organization event lookup.
 */
outboxEventSchema.index({
  organizationId:
    1,

  createdAt:
    -1,
});

/**
 * Aggregate event lookup.
 */
outboxEventSchema.index({
  aggregateType:
    1,

  aggregateId:
    1,

  createdAt:
    -1,
});

/**
 * Event type + creation time.
 */
outboxEventSchema.index({
  eventType:
    1,

  createdAt:
    -1,
});

/**
 * Producer deduplication.
 *
 * Because deduplicationKey is now omitted entirely when
 * there is no key, sparse + unique correctly permits any
 * number of events without a deduplication key.
 */
outboxEventSchema.index(
  {
    deduplicationKey:
      1,
  },
  {
    unique:
      true,

    sparse:
      true,
  }
);

/* ==========================================================
   ENUM EXPORTS
========================================================== */

export {
  OUTBOX_STATUS,

  AGGREGATE_TYPES,
};

/* ==========================================================
   MODEL
========================================================== */

const OutboxEvent =
  mongoose.models.OutboxEvent ||
  mongoose.model(
    "OutboxEvent",
    outboxEventSchema
  );

export default OutboxEvent;