import mongoose from "mongoose";

const { Schema } = mongoose;

/**
 * ==========================================================
 *
 * HTTP IDEMPOTENCY RECORD
 *
 * ==========================================================
 *
 * Persists the outcome of a completed HTTP mutation.
 *
 * The idempotency record is designed to be written in the
 * same MongoDB transaction as:
 *
 * - Business mutations
 * - Outbox events
 * - The HTTP response
 *
 * ==========================================================
 */

const idempotencyRecordSchema = new Schema(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      immutable: true,
    },

    actorId: {
      type: String,
      required: true,
      trim: true,
      immutable: true,
    },

    method: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      immutable: true,
    },

    routeKey: {
      type: String,
      required: true,
      trim: true,
      immutable: true,
    },

    key: {
      type: String,
      required: true,
      trim: true,
      maxlength: 255,
      immutable: true,
    },

    requestHash: {
      type: String,
      required: true,
      match: /^[a-f0-9]{64}$/i,
      immutable: true,
    },

    responseStatus: {
      type: Number,
      min: 100,
      max: 599,
    },

    responseBody: {
      type: Schema.Types.Mixed,
    },

    completedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    versionKey: false,
    collection: "idempotencyrecords",
  }
);

/**
 * ==========================================================
 * UNIQUE IDEMPOTENCY IDENTITY
 * ==========================================================
 *
 * A key is unique within its organization, actor, method,
 * and route.
 *
 * ==========================================================
 */

idempotencyRecordSchema.index(
  {
    organizationId: 1,
    actorId: 1,
    method: 1,
    routeKey: 1,
    key: 1,
  },
  {
    unique: true,
    name: "uniq_http_idempotency_identity",
  }
);

/**
 * ==========================================================
 * COMPLETED RECORD LOOKUP
 * ==========================================================
 */

idempotencyRecordSchema.index(
  {
    organizationId: 1,
    completedAt: -1,
  },
  {
    name: "idempotency_completed_lookup",
  }
);

const IdempotencyRecord =
  mongoose.models.IdempotencyRecord ||
  mongoose.model(
    "IdempotencyRecord",
    idempotencyRecordSchema
  );

export default IdempotencyRecord;