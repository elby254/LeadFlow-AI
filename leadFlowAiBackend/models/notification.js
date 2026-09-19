/**
 * ============================================================
 *
 * LeadFlow AI Notification Center
 *
 * Used For
 * ------------------------------------------------------------
 * ✓ Viewing Approved
 * ✓ Viewing Rejected
 * ✓ Viewing Cancelled
 * ✓ Viewing Reminder
 * ✓ Viewing Rescheduled
 *
 * ✓ New Lead Assigned
 * ✓ Follow-up Reminder
 * ✓ Conversation Updates
 * ✓ AI Qualification Complete
 * ✓ Agent Alerts
 * ✓ Dashboard Notifications
 *
 * Future Channels
 * ------------------------------------------------------------
 * SMS
 * WhatsApp
 * Email
 * Push Notification
 * Socket.io
 * ============================================================
 */

import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    /* ==========================================================
       MULTI TENANCY
    ========================================================== */

    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },

    /* ==========================================================
       RECIPIENT
    ========================================================== */

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    /* ==========================================================
       TYPE
    ========================================================== */

    type: {
      type: String,

      enum: [
        // Viewing workflow
        "VIEWING_APPROVED",
        "VIEWING_REJECTED",
        "VIEWING_CANCELLED",
        "VIEWING_RESCHEDULED",
        "VIEWING_REMINDER",

        // Leads
        "NEW_LEAD",
        "HOT_LEAD",
        "LEAD_ASSIGNED",
        "FOLLOW_UP",

        // Conversation
        "NEW_MESSAGE",
        "MESSAGE_READ",
        "AI_REPLY",

        // System
        "SYSTEM",
        "SUCCESS",
        "WARNING",
        "ERROR",
      ],

      required: true,

      index: true,
    },

    /* ==========================================================
       CONTENT
    ========================================================== */

    title: {
      type: String,
      required: true,
      trim: true,
    },

    message: {
      type: String,
      required: true,
      trim: true,
    },

    /* ==========================================================
       LINKED RESOURCES
    ========================================================== */

    lead: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lead",
      default: null,
    },

    property: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Property",
      default: null,
    },

    viewing: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Viewing",
      default: null,
    },

    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      default: null,
    },

    /* ==========================================================
       DELIVERY
    ========================================================== */

    channel: {
      type: String,

      enum: [
        "dashboard",
        "socket",
        "sms",
        "whatsapp",
        "email",
        "push",
      ],

      default: "dashboard",
    },

    /* ==========================================================
       STATUS
    ========================================================== */

    status: {
      type: String,

      enum: [
        "unread",
        "read",
        "archived",
      ],

      default: "unread",

      index: true,
    },

    readAt: {
      type: Date,
      default: null,
    },

    archivedAt: {
      type: Date,
      default: null,
    },

    /* ==========================================================
       PRIORITY
    ========================================================== */

    priority: {
      type: String,

      enum: [
        "low",
        "normal",
        "high",
        "urgent",
      ],

      default: "normal",
    },

    /* ==========================================================
       ACTION BUTTON
    ========================================================== */

    action: {
      label: {
        type: String,
        default: "",
      },

      url: {
        type: String,
        default: "",
      },
    },

    /* ==========================================================
       DELIVERY METADATA
    ========================================================== */

    delivery: {
      delivered: {
        type: Boolean,
        default: false,
      },

      deliveredAt: Date,

      failed: {
        type: Boolean,
        default: false,
      },

      failureReason: String,
    },

    /* ==========================================================
       SOFT DELETE
    ========================================================== */

    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

/* ============================================================
   INDEXES
============================================================ */

notificationSchema.index({
  organizationId: 1,
  user: 1,
  status: 1,
});

notificationSchema.index({
  organizationId: 1,
  createdAt: -1,
});

notificationSchema.index({
  user: 1,
  createdAt: -1,
});

notificationSchema.index({
  viewing: 1,
});

notificationSchema.index({
  lead: 1,
});

notificationSchema.index({
  conversation: 1,
});

/* ============================================================
   MODEL
============================================================ */

const Notification =
  mongoose.models.Notification ||
  mongoose.model(
    "Notification",
    notificationSchema
  );

export default Notification;