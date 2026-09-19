/**
 * ==========================================================
 *
 * LEADFLOW AI
 * CONVERSATION MODEL
 *
 * ==========================================================
 *
 * Conversation stores:
 *
 * ✓ Conversation metadata
 * ✓ Qualification memory
 * ✓ AI state
 * ✓ Assignment
 * ✓ Viewing workflow
 * ✓ Counters
 * ✓ Last message preview
 *
 * Message.js stores:
 *
 * ✓ Actual messages
 * ✓ Attachments
 * ✓ Voice notes
 * ✓ Delivery state
 * ✓ Read receipts
 * ✓ Reactions
 *
 * ==========================================================
 */

import mongoose from "mongoose";

/* ==========================================================
   CONVERSATION SCHEMA
========================================================== */

const conversationSchema =
  new mongoose.Schema(
    {
      /* ======================================================
         MULTI-TENANCY
      ====================================================== */

      organizationId: {
        type:
          mongoose.Schema.Types.ObjectId,

        ref: "Organization",

        required: true,

        index: true,
      },

      /* ======================================================
         CUSTOMER
      ====================================================== */

      customerName: {
        type: String,

        required: true,

        trim: true,

        index: true,
      },

      phone: {
        type: String,

        default: "",

        trim: true,

        index: true,
      },

      email: {
        type: String,

        default: null,

        trim: true,

        lowercase: true,
      },

      /* ======================================================
         LEAD
      ====================================================== */

      leadId: {
        type:
          mongoose.Schema.Types.ObjectId,

        ref: "Lead",

        default: null,

        index: true,
      },

      /* ======================================================
         ASSIGNED AGENT
      ====================================================== */

      assignedAgent: {
        type:
          mongoose.Schema.Types.ObjectId,

        ref: "User",

        default: null,

        index: true,
      },

      /* ======================================================
         CONVERSATION STATUS
      ====================================================== */

      status: {
        type: String,

        enum: [
          "new",
          "pending",
          "qualified",
          "hot",
          "awaiting_agent",
          "viewing_requested",
          "viewing_scheduled",
          "negotiation",
          "won",
          "lost",
          "closed",
          "archived",
        ],

        default: "new",

        index: true,
      },

      /* ======================================================
         QUALIFICATION STAGE
      ====================================================== */

      stage: {
        type: String,

        enum: [
          "collect_location",
          "collect_budget",
          "collect_bedrooms",
          "collect_moveDate",
          "collect_phone",
          "qualified",
        ],

        default: "collect_location",

        index: true,
      },

      /* ======================================================
         QUALIFICATION COMPLETE
      ====================================================== */

      complete: {
        type: Boolean,

        default: false,

        index: true,
      },

      /* ======================================================
         LAST QUESTION
      ====================================================== */

      lastQuestionAsked: {
        type: String,

        enum: [
          "location",
          "budget",
          "bedrooms",
          "moveDate",
          "phone",
          null,
        ],

        default: null,
      },

      /* ======================================================
         QUESTIONS ALREADY ASKED
      ====================================================== */

      askedQuestions: [
        {
          type: String,

          enum: [
            "location",
            "budget",
            "bedrooms",
            "moveDate",
            "phone",
          ],
        },
      ],

      /* ======================================================
         MISSING FIELDS
      ====================================================== */

      missingFields: {
        location: {
          type: Boolean,

          default: true,
        },

        budget: {
          type: Boolean,

          default: true,
        },

        bedrooms: {
          type: Boolean,

          default: true,
        },

        moveDate: {
          type: Boolean,

          default: true,
        },

        phone: {
          type: Boolean,

          default: true,
        },
      },

      /* ======================================================
         QUALIFICATION SUMMARY
      ====================================================== */

      summary: {
        budget: {
          type: String,

          default: "",
        },

        location: {
          type: String,

          default: "",
        },

        bedrooms: {
          type: String,

          default: "",
        },

        moveDate: {
          type: String,

          default: "",
        },

        phone: {
          type: String,

          default: "",
        },

        intent: {
          type: String,

          default: "",
        },
      },

      /* ======================================================
         LEAD SCORE
      ====================================================== */

      score: {
        type: Number,

        min: 0,

        max: 100,

        default: 0,

        index: true,
      },

      /* ======================================================
         VIEWING WORKFLOW
      ====================================================== */

      currentViewing: {
        type:
          mongoose.Schema.Types.ObjectId,

        ref: "Viewing",

        default: null,
      },

      viewingStatus: {
        type: String,

        enum: [
          "none",
          "requested",
          "approved",
          "scheduled",
          "rescheduled",
          "cancelled",
          "completed",
        ],

        default: "none",

        index: true,
      },

      nextViewingDate: {
        type: Date,

        default: null,
      },

      lastViewingRequested: {
        type: Date,

        default: null,
      },

      viewingRequestCount: {
        type: Number,

        default: 0,
      },

      lastViewingFeedback: {
        rating: {
          type: Number,

          min: 1,

          max: 5,

          default: null,
        },

        interested: {
          type: Boolean,

          default: null,
        },

        comments: {
          type: String,

          default: "",
        },
      },

      /* ======================================================
         LAST MESSAGE PREVIEW
      ====================================================== */

      lastMessage: {
        text: {
          type: String,

          default: "",
        },

        senderId: {
          type:
            mongoose.Schema.Types.ObjectId,

          ref: "User",

          default: null,
        },

        senderRole: {
          type: String,

          enum: [
            "customer",
            "ai",
            "agent",
            "admin",
            null,
          ],

          default: null,
        },

        createdAt: {
          type: Date,

          default: null,
        },
      },

      /* ======================================================
         COUNTERS
      ====================================================== */

      messageCount: {
        type: Number,

        default: 0,
      },

      unreadCount: {
        type: Number,

        default: 0,
      },

      /* ======================================================
         SETTINGS
      ====================================================== */

      pinned: {
        type: Boolean,

        default: false,
      },

      archived: {
        type: Boolean,

        default: false,
      },

      muted: {
        type: Boolean,

        default: false,
      },

      /* ======================================================
         PARTICIPANTS
      ====================================================== */

      participants: [
        {
          userId: {
            type:
              mongoose.Schema.Types.ObjectId,

            ref: "User",

            default: null,
          },

          role: {
            type: String,

            enum: [
              "customer",
              "ai",
              "agent",
              "admin",
            ],
          },

          joinedAt: {
            type: Date,

            default: Date.now,
          },
        },
      ],

      /* ======================================================
         AI CONTEXT
      ====================================================== */

      aiContext: {
        lastSuggestion: {
          type: String,

          default: "",
        },

        confidence: {
          type: Number,

          default: 0,

          min: 0,

          max: 1,
        },

        suggestedReplies: [
          {
            type: String,
          },
        ],

        viewingRecommended: {
          type: Boolean,

          default: false,
        },

        followUpRecommended: {
          type: Boolean,

          default: false,
        },

        nextBestAction: {
          type: String,

          default: "",
        },

        extracted: {
          type: mongoose.Schema.Types.Mixed,

          default: {},
        },
      },

      /* ======================================================
         TYPING
      ====================================================== */

      typing: {
        userId: {
          type:
            mongoose.Schema.Types.ObjectId,

          ref: "User",

          default: null,
        },

        userName: {
          type: String,

          default: "",
        },

        startedAt: {
          type: Date,

          default: null,
        },
      },

      /* ======================================================
         LAST ACTIVITY
      ====================================================== */

      lastUpdated: {
        type: Date,

        default: Date.now,

        index: true,
      },
    },

    {
      timestamps: true,
    }
  );

/* ==========================================================
   INDEXES
========================================================== */

conversationSchema.index({
  organizationId: 1,
  phone: 1,
});

conversationSchema.index({
  organizationId: 1,
  customerName: 1,
});

conversationSchema.index({
  organizationId: 1,
  status: 1,
});

conversationSchema.index({
  organizationId: 1,
  assignedAgent: 1,
});

conversationSchema.index({
  organizationId: 1,
  archived: 1,
  pinned: 1,
});

conversationSchema.index({
  organizationId: 1,
  leadId: 1,
});

conversationSchema.index({
  organizationId: 1,
  complete: 1,
});

conversationSchema.index({
  organizationId: 1,
  viewingStatus: 1,
});

conversationSchema.index({
  lastUpdated: -1,
});

/* ==========================================================
   MODEL
========================================================== */

const Conversation =
  mongoose.models.Conversation ||
  mongoose.model(
    "Conversation",
    conversationSchema
  );

/* ==========================================================
   EXPORT
========================================================== */

export default Conversation;