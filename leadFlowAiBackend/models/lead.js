import mongoose from "mongoose";

// =====================================================
// LEAD MODEL
// =====================================================
//
// Supports:
//
// ✓ Multi-tenant organizations
// ✓ Admin lead management
// ✓ Agent assignment
// ✓ Agent-specific workflows
// ✓ Lead qualification
// ✓ Lead scoring
// ✓ Lead intent
// ✓ Notes
// ✓ Viewing workflow
// ✓ Follow-up workflow
// ✓ Call history
// ✓ AI insights
//
// IMPORTANT
// -----------------------------------------------------
// assignedTo is the authoritative agent assignment.
//
// Legacy:
//
//   agent
//
// is retained only for compatibility.
//
// =====================================================

const leadSchema =
  new mongoose.Schema(
    {
      // =================================================
      // CUSTOMER INFORMATION
      // =================================================

      name: {
        type: String,
        required: true,
        trim: true,
      },

      phone: {
        type: String,
        required: true,
        trim: true,
      },

      // =================================================
      // PROPERTY PREFERENCES
      // =================================================

      location: {
        type: String,
        trim: true,
        default: "",
      },

      budget: {
        type: Number,
        min: 0,
        default: null,
      },

      bedrooms: {
        type: Number,
        min: 1,
        default: 1,
      },

      moveDate: {
        type: String,
        default: "",
        trim: true,
      },

      // =================================================
      // LEAD INTENT
      // =================================================

      intent: {
        type: String,
        default: "",
        trim: true,
        lowercase: true,
        index: true,
      },

      // =================================================
      // AI QUALIFICATION & LEAD SCORING
      // =================================================

      score: {
        type: Number,
        min: 0,
        max: 100,
        default: 0,
      },

      // =================================================
      // LEAD STATUS
      // =================================================
      //
      // SINGLE SOURCE OF TRUTH
      //
      // =================================================

      status: {
        type: String,

        enum: [
          "new",
          "contacted",
          "qualified",
          "viewing",
          "negotiation",
          "won",
          "lost",
        ],

        default: "new",

        index: true,
      },

      isComplete: {
        type: Boolean,
        default: false,
      },

      urgent: {
        type: Boolean,
        default: false,
        index: true,
      },

      // =================================================
      // MULTI-TENANT ORGANIZATION
      // =================================================

      organizationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Organization",
        required: true,
        index: true,
      },

      // =================================================
      // AGENT ASSIGNMENT
      // =================================================
      //
      // AUTHORITATIVE ASSIGNMENT FIELD
      //
      // =================================================

      assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
        index: true,
      },

      assignedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },

      assignedAt: {
        type: Date,
        default: null,
      },

      assignedSource: {
        type: String,

        enum: [
          "auto",
          "manual",
          "ai",
        ],

        default: "auto",
      },

      // =================================================
      // LEGACY ADMIN COMPATIBILITY
      // =================================================

      agent: {
        type: String,
        default: null,
        trim: true,
      },

      // =================================================
      // AGENT NOTES
      // =================================================

      notes: [
        {
          text: {
            type: String,
            required: true,
            trim: true,
          },

          createdAt: {
            type: Date,
            default: Date.now,
          },

          createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
          },
        },
      ],

      // =================================================
      // VIEWING WORKFLOW
      // =================================================

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

      currentViewing: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Viewing",
        default: null,
      },

      nextViewingDate: {
        type: Date,
        default: null,
        index: true,
      },

      viewingCompleted: {
        type: Boolean,
        default: false,
      },

      interestedAfterViewing: {
        type: String,

        enum: [
          "unknown",
          "interested",
          "not_interested",
          "thinking",
        ],

        default: "unknown",
      },

      viewingRequestCount: {
        type: Number,
        min: 0,
        default: 0,
      },

      // =================================================
      // FOLLOW-UP CONTROL
      // =================================================

      lastContact: {
        type: Date,
        default: null,
      },

      nextFollowUpDate: {
        type: Date,
        default: null,
        index: true,
      },

      nextAction: {
        type: String,
        default: "",
        trim: true,
      },

      noteText: {
        type: String,
        default: "",
        trim: true,
      },

      followUpReminder: {
        type: String,
        default: "",
        trim: true,
      },

      followUpStatus: {
        type: String,

        enum: [
          "pending",
          "scheduled",
          "completed",
          "cancelled",
        ],

        default: "pending",

        index: true,
      },

      followUpOutcome: {
        type: String,

        enum: [
          "no_answer",
          "interested",
          "viewing_scheduled",
          "not_interested",
          "callback",
        ],

        default: null,
      },

      followUpUpdatedAt: {
        type: Date,
        default: null,
      },

      // =================================================
      // CALL HISTORY
      // =================================================

      callHistory: [
        {
          calledAt: {
            type: Date,
            default: Date.now,
          },

          outcome: {
            type: String,
            default: "",
            trim: true,
          },

          notes: {
            type: String,
            default: "",
            trim: true,
          },

          nextFollowUpDate: {
            type: Date,
            default: null,
          },

          agent: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
          },
        },
      ],

      // =================================================
      // SOURCE OF LEAD
      // =================================================

      source: {
        type: String,

        enum: [
          "whatsapp",
          "sms",
          "website",
          "facebook",
          "manual",
        ],

        default: "whatsapp",

        index: true,
      },

      // =================================================
      // AI INSIGHTS
      // =================================================

      aiInsights: {
        buyingIntent: {
          type: Number,
          min: 0,
          max: 100,
          default: 0,
        },

        urgency: {
          type: String,

          enum: [
            "Low",
            "Medium",
            "High",
          ],

          default: "Low",

          trim: true,
        },

        budgetConfidence: {
          type: Number,
          min: 0,
          max: 100,
          default: 0,
        },

        locationConfidence: {
          type: Number,
          min: 0,
          max: 100,
          default: 0,
        },

        propertyTypeConfidence: {
          type: Number,
          min: 0,
          max: 100,
          default: 0,
        },

        timelineConfidence: {
          type: Number,
          min: 0,
          max: 100,
          default: 0,
        },

        missingInformation: {
          type: [String],
          default: [],
        },

        recommendedAction: {
          type: String,
          default: "",
          trim: true,
        },
      },
    },

    {
      timestamps: true,
    }
  );

// =====================================================
// COMPOUND INDEXES
// =====================================================

leadSchema.index({
  organizationId: 1,
  assignedTo: 1,
});

leadSchema.index({
  organizationId: 1,
  status: 1,
});

leadSchema.index({
  organizationId: 1,
  assignedTo: 1,
  status: 1,
});

leadSchema.index({
  organizationId: 1,
  nextFollowUpDate: 1,
});

leadSchema.index({
  organizationId: 1,
  viewingStatus: 1,
});

leadSchema.index({
  organizationId: 1,
  intent: 1,
});

// =====================================================
// MODEL
// =====================================================

const Lead =
  mongoose.models.Lead ||
  mongoose.model(
    "Lead",
    leadSchema
  );

export default Lead;