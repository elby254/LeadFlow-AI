// ============================================================
// Property Price History Model
// ============================================================

import mongoose from "mongoose";


// ============================================================
// SCHEMA
// ============================================================

const propertyPriceHistorySchema = new mongoose.Schema(
  {
    /* ========================================================
       PROPERTY
    ======================================================== */

    property: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Property",
      required: true,
      index: true,
    },


    /* ========================================================
       ORGANIZATION
    ======================================================== */

    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },


    /* ========================================================
       PRICE CHANGE
    ======================================================== */

    previousPrice: {
      type: Number,
      required: true,
      min: 0,
    },

    newPrice: {
      type: Number,
      required: true,
      min: 0,
    },

    currency: {
      type: String,
      default: "KES",
      uppercase: true,
      trim: true,
    },


    /* ========================================================
       CHANGE DETAILS
    ======================================================== */

    changeType: {
      type: String,
      enum: [
        "increase",
        "decrease",
        "initial",
        "correction",
      ],
      required: true,
    },

    changeAmount: {
      type: Number,
      default: 0,
    },

    changePercentage: {
      type: Number,
      default: 0,
    },

    reason: {
      type: String,
      default: "",
      trim: true,
      maxlength: 500,
    },


    /* ========================================================
       AUDIT
    ======================================================== */

    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    effectiveDate: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },

  {
    timestamps: true,
  }
);


// ============================================================
// INDEXES
// ============================================================

propertyPriceHistorySchema.index({
  property: 1,
  effectiveDate: -1,
});

propertyPriceHistorySchema.index({
  organizationId: 1,
  property: 1,
});

propertyPriceHistorySchema.index({
  changeType: 1,
});


// ============================================================
// PRE-SAVE HOOK
//
// Automatically calculates:
//
// changeAmount
// changePercentage
//
// IMPORTANT:
// Do NOT use next() here.
//
// The hook is synchronous and performs no asynchronous work.
// ============================================================

propertyPriceHistorySchema.pre(
  "save",
  function () {

    /* --------------------------------------------------------
       CALCULATE PRICE CHANGE AMOUNT
    -------------------------------------------------------- */

    this.changeAmount =
      Number(this.newPrice) -
      Number(this.previousPrice);


    /* --------------------------------------------------------
       CALCULATE PRICE CHANGE PERCENTAGE
    -------------------------------------------------------- */

    if (
      Number(this.previousPrice) > 0
    ) {

      this.changePercentage =
        Number(
          (
            (
              this.changeAmount /
              Number(this.previousPrice)
            ) *
            100
          ).toFixed(2)
        );

    } else {

      this.changePercentage = 0;

    }

  }
);


// ============================================================
// MODEL
// ============================================================

const PropertyPriceHistory =
  mongoose.models.PropertyPriceHistory ||
  mongoose.model(
    "PropertyPriceHistory",
    propertyPriceHistorySchema
  );


// ============================================================
// EXPORT
// ============================================================

export default PropertyPriceHistory;