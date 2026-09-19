import mongoose from "mongoose";
import { customAlphabet } from "nanoid";

const nanoid = customAlphabet(
  "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
  6
);


const propertySchema = new mongoose.Schema(
  {
    /*
    ============================================================
    BASIC DETAILS
    ============================================================
    */

    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      default: "",
      trim: true,
    },

    propertyCode: {
      type: String,
      unique: true,
      uppercase: true,
      trim: true,
    },

    propertyType: {
      type: String,
      enum: [
        "Apartment",
        "Bedsitter",
        "Studio",
        "Maisonette",
        "House",
        "Villa",
        "Commercial",
        "Office",
        "Land",
      ],
      default: "Apartment",
    },

    /*
    ============================================================
    LOCATION
    ============================================================
    */

    location: {
      type: String,
      required: true,
      trim: true,
    },

    county: {
      type: String,
      default: "",
      trim: true,
    },

    city: {
      type: String,
      default: "",
      trim: true,
    },

    estate: {
      type: String,
      default: "",
      trim: true,
    },

    coordinates: {
      latitude: {
        type: Number,
      },

      longitude: {
        type: Number,
      },
    },

    /*
    ============================================================
    PRICING
    ============================================================
    */

    price: {
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

    paymentType: {
      type: String,
      enum: [
        "sale",
        "rent",
      ],
      default: "sale",
    },

    negotiable: {
      type: Boolean,
      default: true,
    },

    /*
    ============================================================
    PROPERTY FEATURES
    ============================================================
    */

    bedrooms: {
      type: Number,
      required: true,
      min: 0,
    },

    bathrooms: {
      type: Number,
      default: 1,
      min: 0,
    },

    parking: {
      type: Number,
      default: 0,
      min: 0,
    },

    squareFeet: {
      type: Number,
      default: 0,
      min: 0,
    },

    furnished: {
      type: Boolean,
      default: false,
    },

    petsAllowed: {
      type: Boolean,
      default: false,
    },

    features: [
      {
        name: {
          type: String,
          trim: true,
        },

        value: {
          type: String,
          trim: true,
        },
      },
    ],

    /*
    ============================================================
    PROPERTY STATUS
    ============================================================

    THIS IS THE SINGLE SOURCE OF TRUTH FOR PROPERTY LIFECYCLE.

    available
        Property can currently be offered.

    reserved
        Property has been reserved.

    sold
        Property has been sold.

    occupied
        Property is currently occupied.

    inactive
        Property is temporarily inactive/unavailable.

    ============================================================
    */

    status: {
      type: String,

      enum: [
        "available",
        "reserved",
        "sold",
        "occupied",
        "inactive",
      ],

      default: "available",

      lowercase: true,

      trim: true,

      index: true,
    },

    /*
    ============================================================
    FEATURED
    ============================================================
    */

    featured: {
      type: Boolean,
      default: false,
      index: true,
    },

    /*
    ============================================================
    IMAGES
    ============================================================

    Property.coverImage is a reference to the canonical
    PropertyImage document.

    Image creation/update is handled by:

        propertyImageController.js

    This model does NOT create images.

    ============================================================
    */

    coverImage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PropertyImage",
      default: null,
    },

    /*
    ============================================================
    ASSIGNED AGENT
    ============================================================

    The authenticated agent workflow uses this field:

        assignedAgent

    Agent My Properties query:

        organizationId
        +
        assignedAgent
        +
        isArchived: false

    ============================================================
    */

    assignedAgent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },

    /*
    ============================================================
    PROPERTY OWNER
    ============================================================
    */

    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    /*
    ============================================================
    AI MATCHING
    ============================================================
    */

    aiScore: {
      type: Number,
      default: 0,
    },

    recommendedCount: {
      type: Number,
      default: 0,
    },

    totalViews: {
      type: Number,
      default: 0,
    },

    aiMetadata: {
      matchTags: {
        type: [String],
        default: [],
      },

      recommendedTo: {
        type: Number,
        default: 0,
      },

      averageInterestScore: {
        type: Number,
        default: 0,
      },
    },

    /*
    ============================================================
    VIEWING INSIGHTS
    ============================================================
    */

    viewingInsights: {
      bestViewingTime: {
        type: String,
        default: "",
      },

      averageDecisionTime: {
        type: Number,
        default: 0,
      },

      viewingConversionRate: {
        type: Number,
        default: 0,
      },
    },

    /*
    ============================================================
    VIEWING STATISTICS
    ============================================================
    */

    viewingStats: {
      totalRequests: {
        type: Number,
        default: 0,
      },

      approvedRequests: {
        type: Number,
        default: 0,
      },

      scheduledViewings: {
        type: Number,
        default: 0,
      },

      completedViewings: {
        type: Number,
        default: 0,
      },

      cancelledViewings: {
        type: Number,
        default: 0,
      },

      rescheduledViewings: {
        type: Number,
        default: 0,
      },

      noShows: {
        type: Number,
        default: 0,
      },

      averageRating: {
        type: Number,
        default: 0,
      },
    },

    /*
    ============================================================
    VIEWING CALENDAR
    ============================================================
    */

    availableViewingSlots: [
      {
        start: {
          type: Date,
          required: true,
        },

        end: {
          type: Date,
          required: true,
        },

        booked: {
          type: Boolean,
          default: false,
        },
      },
    ],

    viewingInstructions: {
      type: String,
      default: "",
    },

    defaultViewingDuration: {
      type: Number,
      default: 60,
      min: 1,
    },

    allowWeekendViewings: {
      type: Boolean,
      default: true,
    },

    allowEveningViewings: {
      type: Boolean,
      default: true,
    },

    /*
    ============================================================
    CURRENT VIEWING
    ============================================================
    */

    currentViewing: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Viewing",
      default: null,
    },

    nextViewingDate: {
      type: Date,
      default: null,
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
    SOFT DELETE / ARCHIVING
    ============================================================
    */

    isArchived: {
      type: Boolean,
      default: false,
      index: true,
    },

    archivedAt: {
      type: Date,
      default: null,
    },

    archivedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    /*
    ============================================================
    LAST PRICE CHANGE
    ============================================================
    */

    lastPriceUpdatedAt: {
      type: Date,
      default: null,
    },
  },

  {
    timestamps: true,
  }
);

/*
============================================================
TEXT SEARCH INDEX
============================================================

Used by:

    /api/properties/search

Fields searchable by agents include:

    title
    description
    location
    estate
    city
    county

============================================================
*/

propertySchema.index({
  title: "text",
  description: "text",
  location: "text",
  estate: "text",
  city: "text",
  county: "text",
});

/*
============================================================
PROPERTY FILTER INDEX
============================================================

Status is now the ONLY property lifecycle filter.

There is deliberately NO availability index.

============================================================
*/

propertySchema.index({
  status: 1,
  propertyType: 1,
  price: 1,
});

/*
============================================================
ORGANIZATION + STATUS INDEX
============================================================

Very important for:

    Admin property filtering
    Agent property filtering
    My Properties
    Available
    Reserved
    Sold
    Occupied
    Inactive

============================================================
*/

propertySchema.index({
  organizationId: 1,
  status: 1,
});

/*
============================================================
ORGANIZATION + AGENT INDEX
============================================================

Critical for the LeadFlow AI agent workflow.

Agent query:

    organizationId
    +
    assignedAgent
    +
    isArchived

============================================================
*/

propertySchema.index({
  organizationId: 1,
  assignedAgent: 1,
  isArchived: 1,
});

/*
============================================================
ORGANIZATION + ARCHIVED INDEX
============================================================
*/

propertySchema.index({
  organizationId: 1,
  isArchived: 1,
});

/*
============================================================
ORGANIZATION + PROPERTY TYPE INDEX
============================================================
*/

propertySchema.index({
  organizationId: 1,
  propertyType: 1,
});

/*
============================================================
ORGANIZATION + PRICE INDEX
============================================================
*/

propertySchema.index({
  organizationId: 1,
  price: 1,
});

/*
============================================================
PRE-SAVE HOOK
============================================================

Automatically generates a property code when one does not
already exist.

Example:

    PC-A8F2K9

============================================================
*/

propertySchema.pre(
  "save",
  function () {
    if (!this.propertyCode) {
      this.propertyCode = `PC-${nanoid()}`;
    }
  }
);

/*
============================================================
MODEL
============================================================
*/

const Property =
  mongoose.models.Property ||
  mongoose.model(
    "Property",
    propertySchema
  );

export default Property;