// ======================================================
// Viewing Reminder Schema
// ======================================================

import mongoose from "mongoose";

const viewingReminderSchema = new mongoose.Schema(
  {
    // ==================================================
    // RELATIONSHIPS
    // ==================================================

    viewing: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Viewing",
      required: true,
      index: true,
    },

    lead: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lead",
      required: true,
      index: true,
    },

    property: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Property",
      required: true,
    },

    agent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    viewer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // ==================================================
    // REMINDER TYPE
    // ==================================================

    reminderType: {
      type: String,
      enum: [
        "24 Hours Before",
        "12 Hours Before",
        "6 Hours Before",
        "1 Hour Before",
        "30 Minutes Before",
        "Custom",
      ],
      required: true,
    },

    // ==================================================
    // DELIVERY CHANNEL
    // ==================================================

    channel: {
      type: String,
      enum: [
        "SMS",
        "Email",
        "WhatsApp",
        "Push Notification",
        "In App",
      ],
      required: true,
    },

    // ==================================================
    // MESSAGE
    // ==================================================

    subject: {
      type: String,
      trim: true,
      maxlength: 200,
      default: "",
    },

    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 5000,
    },

    // ==================================================
    // SCHEDULE
    // ==================================================

    scheduledFor: {
      type: Date,
      required: true,
      index: true,
    },

    sentAt: {
      type: Date,
    },

    // ==================================================
    // DELIVERY STATUS
    // ==================================================

    status: {
      type: String,
      enum: [
        "Pending",
        "Queued",
        "Sent",
        "Delivered",
        "Read",
        "Failed",
        "Cancelled",
      ],
      default: "Pending",
      index: true,
    },

    // ==================================================
    // RETRIES
    // ==================================================

    retryCount: {
      type: Number,
      default: 0,
    },

    maxRetries: {
      type: Number,
      default: 3,
    },

    lastRetryAt: {
      type: Date,
    },

    failureReason: {
      type: String,
      trim: true,
      default: "",
    },

    // ==================================================
    // RECEIVER
    // ==================================================

    recipient: {
      name: {
        type: String,
        trim: true,
      },

      email: {
        type: String,
        trim: true,
      },

      phone: {
        type: String,
        trim: true,
      },
    },

    // ==================================================
    // SYSTEM FLAGS
    // ==================================================

    isAutomated: {
      type: Boolean,
      default: true,
    },

    isArchived: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// ======================================================
// INDEXES
// ======================================================

viewingReminderSchema.index({
  scheduledFor: 1,
  status: 1,
});

viewingReminderSchema.index({
  viewer: 1,
  scheduledFor: -1,
});

viewingReminderSchema.index({
  agent: 1,
  scheduledFor: -1,
});

const ViewingReminder = mongoose.model(
  "ViewingReminder",
  viewingReminderSchema
);

export default ViewingReminder;