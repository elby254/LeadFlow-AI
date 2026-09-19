// ============================================================
// ------------------------------------------------------------
// Stores images belonging to properties.
//
// Compatible with:
// • Property model
// • Property controller
// • Property service
// • Property.coverImage -> PropertyImage reference
//
// ============================================================

import mongoose from "mongoose";

const propertyImageSchema = new mongoose.Schema(
  {
    /* ==========================================================
       PROPERTY
    ========================================================== */

    property: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Property",
      required: true,
      index: true,
    },

    /* ==========================================================
       ORGANIZATION
       ----------------------------------------------------------
       Keeps images isolated between organizations.
    ========================================================== */

    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },

    /* ==========================================================
       IMAGE INFORMATION
    ========================================================== */

    url: {
      type: String,
      required: true,
      trim: true,
    },

    publicId: {
      type: String,
      default: "",
      trim: true,
    },

    caption: {
      type: String,
      default: "",
      trim: true,
      maxlength: 300,
    },

    altText: {
      type: String,
      default: "",
      trim: true,
      maxlength: 200,
    },

    /* ==========================================================
       COVER IMAGE
       ----------------------------------------------------------
       One PropertyImage can be designated as the property's
       cover image.

       Property.coverImage stores the ObjectId of this document.
    ========================================================== */

    isCover: {
      type: Boolean,
      default: false,
      index: true,
    },

    /* ==========================================================
       DISPLAY
    ========================================================== */

    displayOrder: {
      type: Number,
      default: 1,
      min: 1,
    },

    /* ==========================================================
       IMAGE METADATA
    ========================================================== */

    width: {
      type: Number,
      default: 0,
      min: 0,
    },

    height: {
      type: Number,
      default: 0,
      min: 0,
    },

    size: {
      type: Number,
      default: 0,
      min: 0,
    },

    mimeType: {
      type: String,
      default: "",
      trim: true,
    },

    /* ==========================================================
       AI IMAGE DATA
    ========================================================== */

    aiTags: [
      {
        type: String,
        trim: true,
      },
    ],

    aiScore: {
      type: Number,
      default: 0,
      min: 0,
    },

    /* ==========================================================
       STATUS
       ----------------------------------------------------------
       Uses "active" instead of "isDeleted".

       This matches the PropertyService image methods.
    ========================================================== */

    active: {
      type: Boolean,
      default: true,
      index: true,
    },

    /* ==========================================================
       AUDIT
    ========================================================== */

    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

/* ==============================================================
   INDEXES
============================================================== */

/*
 * Quickly retrieve all images for a property
 * in display order.
 */
propertyImageSchema.index({
  property: 1,
  displayOrder: 1,
});

/*
 * Organization-isolated image lookup.
 */
propertyImageSchema.index({
  organizationId: 1,
  property: 1,
  active: 1,
});

/*
 * Quickly locate the cover image.
 */
propertyImageSchema.index({
  property: 1,
  isCover: 1,
});

/*
 * Useful for retrieving active cover images.
 */
propertyImageSchema.index({
  property: 1,
  isCover: 1,
  active: 1,
});

/* ==============================================================
   PRE-SAVE COVER IMAGE PROTECTION
   --------------------------------------------------------------
   If this image is marked as the cover image, the service
   should ensure that other images for the same property are
   unmarked.

   This is intentionally NOT handled automatically here because
   updating other documents inside a pre-save hook can create
   unexpected side effects.

   The PropertyService should handle cover-image selection.
============================================================== */

/* ==============================================================
   MODEL
============================================================== */

const PropertyImage =
  mongoose.models.PropertyImage ||
  mongoose.model(
    "PropertyImage",
    propertyImageSchema
  );

/* ==============================================================
   EXPORT
============================================================== */

export default PropertyImage;