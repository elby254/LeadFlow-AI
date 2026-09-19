// ============================================================
// Property Amenity schema
// ============================================================

import mongoose from "mongoose";

const propertyAmenitySchema = new mongoose.Schema(
  {
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
    AMENITY
    ============================================================
    */

    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    slug: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },

    /*
    ============================================================
    DISPLAY
    ============================================================
    */

    icon: {
      type: String,
      default: "",
    },

    category: {
      type: String,
      enum: [
        "security",
        "utilities",
        "connectivity",
        "parking",
        "recreation",
        "kitchen",
        "bathroom",
        "accessibility",
        "outdoor",
        "other",
      ],
      default: "other",
      index: true,
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
    USAGE
    ============================================================
    */

    usageCount: {
      type: Number,
      default: 0,
      min: 0,
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

propertyAmenitySchema.index(
  {
    organizationId: 1,
    slug: 1,
  },
  {
    unique: true,
  }
);

propertyAmenitySchema.index({
  category: 1,
  active: 1,
});

const PropertyAmenity = 
mongoose.models.PropertyAmenity || 
mongoose.model("PropertyAmenity", propertyAmenitySchema);


export default PropertyAmenity;