// ======================================================
// Viewing Feedback Schema
// ======================================================

import mongoose from "mongoose";

const viewingFeedbackSchema = new mongoose.Schema(
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
      index: true,
    },

    agent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    viewer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // ==================================================
    // VIEWER FEEDBACK
    // ==================================================

    viewerRating: {
      type: Number,
      min: 1,
      max: 5,
      required: true,
    },

    viewerComment: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: "",
    },

    // ==================================================
    // AGENT ASSESSMENT
    // ==================================================

    agentOutcome: {
      type: String,
      enum: [
        "Interested",
        "Very Interested",
        "Needs Follow Up",
        "Negotiating",
        "Offer Expected",
        "Not Interested",
        "No Show",
      ],
      default: "Interested",
    },

    interestLevel: {
      type: String,
      enum: [
        "Low",
        "Medium",
        "High",
      ],
      default: "Medium",
    },

    followUpRequired: {
      type: Boolean,
      default: true,
    },

    followUpDate: {
      type: Date,
    },

    agentNotes: {
      type: String,
      trim: true,
      maxlength: 3000,
      default: "",
    },

    // ==================================================
    // PROPERTY EVALUATION
    // ==================================================

    propertyLiked: {
      type: Boolean,
      default: true,
    },

    likedFeatures: [
      {
        type: String,
        trim: true,
      },
    ],

    dislikedFeatures: [
      {
        type: String,
        trim: true,
      },
    ],

    // ==================================================
    // CUSTOMER DECISION
    // ==================================================

    nextAction: {
      type: String,
      enum: [
        "Schedule Second Viewing",
        "Send More Information",
        "Prepare Offer",
        "Recommend Another Property",
        "Close Lead",
        "Waiting For Customer",
      ],
      default: "Waiting For Customer",
    },

    // ==================================================
    // AI INSIGHTS
    // ==================================================

    aiSentiment: {
      type: String,
      enum: [
        "Positive",
        "Neutral",
        "Negative",
      ],
      default: "Neutral",
    },

    aiConfidence: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },

    aiSummary: {
      type: String,
      trim: true,
      maxlength: 3000,
      default: "",
    },

    // ==================================================
    // ADMIN REVIEW
    // ==================================================

    reviewed: {
      type: Boolean,
      default: false,
    },

    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    reviewedAt: {
      type: Date,
    },

    adminRemarks: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: "",
    },

    // ==================================================
    // STATUS
    // ==================================================

    status: {
      type: String,
      enum: [
        "Draft",
        "Submitted",
        "Reviewed",
      ],
      default: "Submitted",
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// ======================================================
// INDEXES
// ======================================================

viewingFeedbackSchema.index({
  viewing: 1,
  status: 1,
});

viewingFeedbackSchema.index({
  property: 1,
  createdAt: -1,
});

viewingFeedbackSchema.index({
  agent: 1,
  createdAt: -1,
});

viewingFeedbackSchema.index({
  viewerRating: 1,
});

const ViewingFeedback = mongoose.model(
  "ViewingFeedback",
  viewingFeedbackSchema
);

const ViewingFeedback = 
mongoose.models.ViewingFeedback || 
mongoose.model("ViewingFeedback", viewingFeedbackSchema);


export default ViewingFeedback;