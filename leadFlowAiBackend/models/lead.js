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
// ✓ Lead qualification
// ✓ Lead scoring
// ✓ Canonical lead intent
// ✓ Notes
// ✓ Viewing workflow references
// ✓ Follow-up workflow
// ✓ Call history
// ✓ AI insights
//
// CANONICAL AUTHORITIES
// -----------------------------------------------------
// Lead lifecycle:
//   services/leadLifeCycleService.js
//
// Lead scoring:
//   services/leadScoringRulesEngine.js
//
// Assignment:
//   services/leadAutoAssignmentService.js
//   services/assignmentConflictResolver.js
//
// Viewing workflow:
//   models/viewing.js
//   services/viewingService.js
//
// IMPORTANT
// -----------------------------------------------------
// assignedTo is the authoritative agent assignment.
//
// Legacy:
//   agent
//
// is retained only for compatibility.
//
// =====================================================


const leadSchema = new mongoose.Schema(
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
      trim: true,
      default: "",
    },

    // =================================================
    // LEAD INTENT
    // =================================================
    //
    // CANONICAL VALUES
    // -------------------------------------------------
    //
    // property_search
    // rent
    // buy
    //
    // IMPORTANT
    // -------------------------------------------------
    // Intent is NOT the lifecycle status.
    //
    // Lifecycle:
    //   Lead.status
    //
    // Transaction intent:
    //   Lead.intent
    //
    // Score:
    //   Lead.score
    //
    // =================================================

    intent: {
      type: String,

      enum: [
        "",
        "property_search",
        "rent",
        "buy",
      ],

      default: "",

      trim: true,

      lowercase: true,

      index: true,
    },

    // =================================================
    // LEAD SCORING
    // =================================================
    //
    // Canonical score:
    //
    // 0–100
    //
    // Score categories:
    //
    // 0–49   → new
    // 50–79  → qualified
    // 80–100 → hot
    //
    // IMPORTANT
    // -------------------------------------------------
    // "hot" is a score category.
    // It is NOT a Lead.status.
    //
    // Authoritative scoring logic:
    //
    // services/leadScoringRulesEngine.js
    //
    // =================================================

    score: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },

    // =================================================
    // LEAD LIFECYCLE
    // =================================================
    //
    // SINGLE SOURCE OF TRUTH FOR LEAD LIFECYCLE
    //
    // Canonical states:
    //
    // new
    // contacted
    // qualified
    // viewing
    // negotiation
    // won
    // lost
    //
    // IMPORTANT
    // -------------------------------------------------
    // These MUST NOT be stored as status:
    //
    // hot
    // follow_up
    // viewing_requested
    // viewing_scheduled
    // closed
    // closed_lost
    //
    // Those concepts belong to score, follow-up,
    // Viewing.status, or terminal lifecycle states.
    //
    // Lifecycle transitions MUST be controlled through:
    //
    // services/leadLifeCycleService.js
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

    // =================================================
    // LEGACY COMPLETION FLAG
    // =================================================
    //
    // Retained for compatibility with older code.
    //
    // This is NOT the lifecycle authority.
    //
    // The canonical successful lifecycle state is:
    //
    //   status = "won"
    //
    // =================================================

    isComplete: {
      type: Boolean,
      default: false,
    },

    // =================================================
    // URGENCY
    // =================================================
    //
    // This is an attribute/flag and NOT a lifecycle state.
    //
    // Do not use this as a substitute for:
    //
    //   score
    //   status
    //
    // =================================================

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
    // AUTHORITATIVE ASSIGNMENT
    //
    // assignedTo
    //
    // is the source of truth.
    //
    // assignment mutation authority:
    //
    // services/assignmentConflictResolver.js
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

      // IMPORTANT:
      // An unassigned lead has no assignment source.
      default: null,
    },

    // =================================================
    // LEGACY AGENT FIELD
    // =================================================
    //
    // Retained only for compatibility with older code.
    //
    // Do NOT use this as the authoritative assignment.
    //
    // Authoritative:
    //
    //   assignedTo
    //
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
    //
    // IMPORTANT
    // -------------------------------------------------
    // Viewing workflow is NOT represented by Lead.status
    // alone.
    //
    // Lead.status may become:
    //
    //   viewing
    //
    // But the actual viewing workflow belongs to the
    // separate Viewing model.
    //
    // Canonical Viewing.status values:
    //
    //   Requested
    //   Pending Approval
    //   Approved
    //   Rescheduled
    //   Rejected
    //   Cancelled
    //   Completed
    //
    // Therefore:
    //
    // Viewing.status = viewing workflow authority
    //
    // Lead.status = lifecycle authority
    //
    // =================================================

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

    viewingRequestCount: {
      type: Number,
      min: 0,
      default: 0,
    },

    // =================================================
    // LEGACY VIEWING COMPATIBILITY
    // =================================================
    //
    // These fields are retained only so older application
    // code does not immediately break.
    //
    // They MUST NOT be used as the authoritative viewing
    // workflow state.
    //
    // The Viewing document is authoritative.
    //
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

      // Legacy compatibility only.
      // Do not use for current workflow decisions.
      index: false,
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

    // =================================================
    // FOLLOW-UP CONTROL
    // =================================================
    //
    // Follow-up is independent from Lead.status.
    //
    // Canonical fields:
    //
    // followUpStatus
    // followUpOutcome
    // nextFollowUpDate
    //
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

    // =================================================
    // LEGACY FOLLOW-UP NOTE
    // =================================================
    //
    // Retained for compatibility.
    //
    // Structured follow-up state belongs to:
    //
    // followUpStatus
    // followUpOutcome
    // nextFollowUpDate
    //
    // =================================================

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
    // LEAD SOURCE
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
    //
    // AI insights are supporting information.
    //
    // They do NOT directly own:
    //
    // Lead.status
    // Lead.score
    // Lead.assignment
    //
    // Those remain controlled by their respective
    // domain services.
    //
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

// Tenant + assignment
leadSchema.index({
  organizationId: 1,
  assignedTo: 1,
});

// Tenant + lifecycle
leadSchema.index({
  organizationId: 1,
  status: 1,
});

// Tenant + assignment + lifecycle
leadSchema.index({
  organizationId: 1,
  assignedTo: 1,
  status: 1,
});

// Tenant + follow-up
leadSchema.index({
  organizationId: 1,
  nextFollowUpDate: 1,
});

// Tenant + intent
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