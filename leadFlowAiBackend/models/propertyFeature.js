// ============================================================
// Property Feature Model
// ============================================================

import mongoose from "mongoose";

const propertyFeatureSchema = new mongoose.Schema(
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
    FEATURE
    ============================================================
    */

    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    value: {
      type: String,
      required: true,
      trim: true,
      maxlength: 300,
    },

    /*
    ============================================================
    FEATURE TYPE
    ============================================================
    */

    type: {
      type: String,
      enum: [
        "text",
        "number",
        "boolean",
        "date",
      ],
      default: "text",
    },

    /*
    ============================================================
    DISPLAY
    ============================================================
    */

    category: {
      type: String,
      enum: [
        "general",
        "building",
        "interior",
        "exterior",
        "utilities",
        "security",
        "financial",
        "other",
      ],
      default: "general",
      index: true,
    },

    displayOrder: {
      type: Number,
      default: 1,
    },

    /*
    ============================================================
    STATUS
    ============================================================
    */

    active: {
      type: Boolean,
      default: true,
      index: true,
    },

    /*
    ============================================================
    AUDIT
    ============================================================
    */

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
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

propertyFeatureSchema.index({

  property: 1,

  category: 1,

});

propertyFeatureSchema.index({

  organizationId: 1,

  property: 1,

  active: 1,

});

const PropertyFeature = 
mongoose.models.PropertyFeature || 
mongoose.model("PropertyFeature", propertyFeatureSchema);


export default PropertyFeature;