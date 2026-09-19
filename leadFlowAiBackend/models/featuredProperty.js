// ============================================================
// Featured Properties schema
// ============================================================

import mongoose from "mongoose";

const featuredPropertySchema = new mongoose.Schema(
  {
    /*
    ============================================================
    PROPERTY
    ============================================================
    */

    property: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Property",
      required: true,
      unique: true,
      index: true,
    },

    /*
    ============================================================
    ORGANIZATION
    ============================================================
    */

    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },

    /*
    ============================================================
    FEATURE SETTINGS
    ============================================================
    */

    priority: {
      type: Number,
      default: 1,
      min: 1,
    },

    active: {
      type: Boolean,
      default: true,
      index: true,
    },

    startDate: {
      type: Date,
      default: Date.now,
    },

    endDate: {
      type: Date,
      default: null,
    },

    /*
    ============================================================
    ADMIN INFORMATION
    ============================================================
    */

    featuredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    reason: {
      type: String,
      default: "",
      trim: true,
      maxlength: 500,
    },
  },
  {
    timestamps: true,
  }
);

/*
============================================================
INDEXES
============================================================
*/

featuredPropertySchema.index({
  organizationId: 1,
  active: 1,
  priority: 1,
});

featuredPropertySchema.index({
  startDate: 1,
  endDate: 1,
});

export default mongoose.model(
  "FeaturedProperty",
  featuredPropertySchema
);