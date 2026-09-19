/**
 * ==========================================================
 * PROPERTY SETTINGS MODEL
 * ==========================================================
 *
 * LeadFlow AI
 *
 * Purpose
 * -------
 * Stores organization-level configuration for the
 * Property Management module.
 *
 * This is NOT a property document.
 *
 * A property document represents an individual listing.
 * This model represents how the organization wants its
 * property workflow to operate.
 *
 * Compatible with
 * ----------------------------------------------------------
 * • Property model
 * • PropertyService
 * • PropertySettings.jsx
 * • Property routes
 * • Property controller
 * • Lead routing
 * • AI recommendations
 * • Property analytics
 *
 * Future API
 * ----------------------------------------------------------
 * GET /api/properties/settings
 * PUT /api/properties/settings
 *
 * ==========================================================
 */

import mongoose from "mongoose";


/* ==========================================================
   PROPERTY SETTINGS SCHEMA
========================================================== */

const propertySettingsSchema = new mongoose.Schema(
  {

    /* ========================================================
       ORGANIZATION
       --------------------------------------------------------
       Every settings document belongs to exactly one
       organization.
    ======================================================== */

    organizationId: {
     type: mongoose.Schema.Types.ObjectId,
     ref: "Organization",
     required: true,
    },

    /* ========================================================
       GENERAL PROPERTY SETTINGS
    ======================================================== */

    general: {

      /* ------------------------------------------------------
         Default property status
      ------------------------------------------------------ */

      defaultStatus: {
        type: String,
        enum: [
          "available",
          "reserved",
          "sold",
          "occupied",
          "inactive",
        ],
        default: "available",
      },


      /* ------------------------------------------------------
         Default availability
      ------------------------------------------------------ */

      defaultAvailability: {
        type: String,
        enum: [
          "sale",
          "rent",
          "lease",
          "short_term",
          "sale_and_rent",
        ],
        default: "sale",
      },


      /* ------------------------------------------------------
         Default currency
         LeadFlow AI is designed for the Kenyan market,
         therefore KES is the default.
      ------------------------------------------------------ */

      defaultCurrency: {
        type: String,
        default: "KES",
        trim: true,
        uppercase: true,
      },


      /* ------------------------------------------------------
         Require property location
      ------------------------------------------------------ */

      requireLocation: {
        type: Boolean,
        default: true,
      },


      /* ------------------------------------------------------
         Require property price
      ------------------------------------------------------ */

      requirePrice: {
        type: Boolean,
        default: true,
      },


      /* ------------------------------------------------------
         Require property type
      ------------------------------------------------------ */

      requirePropertyType: {
        type: Boolean,
        default: true,
      },


      /* ------------------------------------------------------
         Require assigned agent
      ------------------------------------------------------ */

      requireAssignedAgent: {
        type: Boolean,
        default: false,
      },

    },


    /* ========================================================
       LISTING SETTINGS
    ======================================================== */

    listings: {

      /* ------------------------------------------------------
         Automatically publish newly created properties
      ------------------------------------------------------ */

      autoPublish: {
        type: Boolean,
        default: true,
      },


      /* ------------------------------------------------------
         Automatically mark new properties as featured
      ------------------------------------------------------ */

      autoFeatureNewListings: {
        type: Boolean,
        default: false,
      },


      /* ------------------------------------------------------
         Require an image before publishing
      ------------------------------------------------------ */

      requireImageBeforePublishing: {
        type: Boolean,
        default: true,
      },


      /* ------------------------------------------------------
         Minimum number of images required
      ------------------------------------------------------ */

      minimumImages: {
        type: Number,
        default: 1,
        min: 0,
        max: 100,
      },


      /* ------------------------------------------------------
         Allow archived properties to be restored
      ------------------------------------------------------ */

      allowRestore: {
        type: Boolean,
        default: true,
      },


      /* ------------------------------------------------------
         Allow permanent deletion
      ------------------------------------------------------ */

      allowPermanentDelete: {
        type: Boolean,
        default: true,
      },


      /* ------------------------------------------------------
         Automatically archive sold properties
      ------------------------------------------------------ */

      autoArchiveSold: {
        type: Boolean,
        default: false,
      },

    },


    /* ========================================================
       ASSIGNMENT / AGENT WORKFLOW
    ======================================================== */

    agentWorkflow: {

      /* ------------------------------------------------------
         Automatically assign incoming property enquiries
      ------------------------------------------------------ */

      autoAssignLeads: {
        type: Boolean,
        default: true,
      },


      /* ------------------------------------------------------
         Assignment strategy
      ------------------------------------------------------ */

      assignmentStrategy: {
        type: String,
        enum: [
          "manual",
          "round_robin",
          "least_loaded",
          "property_agent",
        ],
        default: "property_agent",
      },


      /* ------------------------------------------------------
         Allow agents to manage assigned properties
      ------------------------------------------------------ */

      agentsCanManageProperties: {
        type: Boolean,
        default: true,
      },


      /* ------------------------------------------------------
         Allow agents to edit property information
      ------------------------------------------------------ */

      agentsCanEditProperties: {
        type: Boolean,
        default: false,
      },


      /* ------------------------------------------------------
         Allow agents to archive properties
      ------------------------------------------------------ */

      agentsCanArchiveProperties: {
        type: Boolean,
        default: false,
      },

    },


    /* ========================================================
       LEAD WORKFLOW
    ======================================================== */

    leadWorkflow: {

      /* ------------------------------------------------------
         Create/associate lead when property enquiry arrives
      ------------------------------------------------------ */

      autoCreateLead: {
        type: Boolean,
        default: true,
      },


      /* ------------------------------------------------------
         Automatically create follow-up task
      ------------------------------------------------------ */

      autoCreateFollowUp: {
        type: Boolean,
        default: true,
      },


      /* ------------------------------------------------------
         Default follow-up delay in minutes
      ------------------------------------------------------ */

      defaultFollowUpDelayMinutes: {
        type: Number,
        default: 30,
        min: 1,
        max: 10080,
      },


      /* ------------------------------------------------------
         Automatically create appointment opportunity
      ------------------------------------------------------ */

      autoCreateAppointment: {
        type: Boolean,
        default: false,
      },

    },


    /* ========================================================
       AI RECOMMENDATION SETTINGS
    ======================================================== */

    aiRecommendations: {

      /* ------------------------------------------------------
         Enable AI property recommendations
      ------------------------------------------------------ */

      enabled: {
        type: Boolean,
        default: true,
      },


      /* ------------------------------------------------------
         Automatically recommend properties to qualified leads
      ------------------------------------------------------ */

      autoRecommend: {
        type: Boolean,
        default: true,
      },


      /* ------------------------------------------------------
         Maximum recommendations returned
      ------------------------------------------------------ */

      maximumRecommendations: {
        type: Number,
        default: 10,
        min: 1,
        max: 100,
      },


      /* ------------------------------------------------------
         Minimum recommendation score
      ------------------------------------------------------ */

      minimumScore: {
        type: Number,
        default: 50,
        min: 0,
        max: 100,
      },


      /* ------------------------------------------------------
         Match using budget
      ------------------------------------------------------ */

      matchBudget: {
        type: Boolean,
        default: true,
      },


      /* ------------------------------------------------------
         Match using location
      ------------------------------------------------------ */

      matchLocation: {
        type: Boolean,
        default: true,
      },


      /* ------------------------------------------------------
         Match using bedrooms
      ------------------------------------------------------ */

      matchBedrooms: {
        type: Boolean,
        default: true,
      },


      /* ------------------------------------------------------
         Match using property type
      ------------------------------------------------------ */

      matchPropertyType: {
        type: Boolean,
        default: true,
      },


      /* ------------------------------------------------------
         Match only available properties
      ------------------------------------------------------ */

      onlyRecommendAvailable: {
        type: Boolean,
        default: true,
      },

    },


    /* ========================================================
       PRICING SETTINGS
    ======================================================== */

    pricing: {

      /* ------------------------------------------------------
         Allow price history tracking
      ------------------------------------------------------ */

      trackPriceHistory: {
        type: Boolean,
        default: true,
      },


      /* ------------------------------------------------------
         Show price changes to agents
      ------------------------------------------------------ */

      showPriceHistoryToAgents: {
        type: Boolean,
        default: true,
      },


      /* ------------------------------------------------------
         Automatically record initial property price
      ------------------------------------------------------ */

      recordInitialPrice: {
        type: Boolean,
        default: true,
      },


      /* ------------------------------------------------------
         Allow properties without a price
      ------------------------------------------------------ */

      allowNegotiablePrice: {
        type: Boolean,
        default: true,
      },

    },


    /* ========================================================
       IMAGE SETTINGS
    ======================================================== */

    images: {

      /* ------------------------------------------------------
         Allow multiple property images
      ------------------------------------------------------ */

      allowMultipleImages: {
        type: Boolean,
        default: true,
      },


      /* ------------------------------------------------------
         Maximum images per property
      ------------------------------------------------------ */

      maximumImages: {
        type: Number,
        default: 20,
        min: 1,
        max: 100,
      },


      /* ------------------------------------------------------
         Automatically select first image as cover
      ------------------------------------------------------ */

      autoSelectCoverImage: {
        type: Boolean,
        default: true,
      },


      /* ------------------------------------------------------
         Require alt text
      ------------------------------------------------------ */

      requireAltText: {
        type: Boolean,
        default: false,
      },

    },


    /* ========================================================
       NOTIFICATION SETTINGS
    ======================================================== */

    notifications: {

      /* ------------------------------------------------------
         Notify assigned agent about new enquiry
      ------------------------------------------------------ */

      notifyAssignedAgent: {
        type: Boolean,
        default: true,
      },


      /* ------------------------------------------------------
         Notify agents when a property changes
      ------------------------------------------------------ */

      notifyPropertyUpdates: {
        type: Boolean,
        default: true,
      },


      /* ------------------------------------------------------
         Notify when property becomes sold
      ------------------------------------------------------ */

      notifyWhenSold: {
        type: Boolean,
        default: true,
      },


      /* ------------------------------------------------------
         Notify when property is reserved
      ------------------------------------------------------ */

      notifyWhenReserved: {
        type: Boolean,
        default: true,
      },

    },


    /* ========================================================
       SEARCH SETTINGS
    ======================================================== */

    search: {

      /* ------------------------------------------------------
         Enable property search
      ------------------------------------------------------ */

      enabled: {
        type: Boolean,
        default: true,
      },


      /* ------------------------------------------------------
         Enable text search
      ------------------------------------------------------ */

      textSearchEnabled: {
        type: Boolean,
        default: true,
      },


      /* ------------------------------------------------------
         Search archived properties
      ------------------------------------------------------ */

      includeArchived: {
        type: Boolean,
        default: false,
      },

    },


    /* ========================================================
       ANALYTICS SETTINGS
    ======================================================== */

    analytics: {

      /* ------------------------------------------------------
         Track property views
      ------------------------------------------------------ */

      trackViews: {
        type: Boolean,
        default: true,
      },


      /* ------------------------------------------------------
         Track recommendations
      ------------------------------------------------------ */

      trackRecommendations: {
        type: Boolean,
        default: true,
      },


      /* ------------------------------------------------------
         Track property performance
      ------------------------------------------------------ */

      trackPerformance: {
        type: Boolean,
        default: true,
      },

    },


    /* ========================================================
       AUDIT INFORMATION
    ======================================================== */

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },


    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

  },

  {
    timestamps: true,
  }
);


/* ==========================================================
   INDEXES
========================================================== */

/*
 * There should only be one property-settings document
 * per organization.
 *
 * `unique: true` above already creates the main unique
 * index, but keeping this explicit makes the intention
 * clear at the schema level.
 */

propertySettingsSchema.index(
  {
    organizationId: 1,
  },
  {
    unique: true,
  }
);

/* ==========================================================
   SCHEMA VALIDATION
========================================================== */

/*
 * Keep settings values within sensible operational limits.
 *
 * These validations protect the backend even when settings
 * are updated directly through the API.
 */


/* ==========================================================
   FOLLOW-UP DELAY VALIDATION
========================================================== */

propertySettingsSchema.path(
  "leadWorkflow.defaultFollowUpDelayMinutes"
).validate(
  function (value) {

    return (
      Number.isFinite(value) &&
      value >= 1 &&
      value <= 10080
    );

  },
  "Follow-up delay must be between 1 and 10080 minutes."
);


/* ==========================================================
   MAXIMUM RECOMMENDATIONS VALIDATION
========================================================== */

propertySettingsSchema.path(
  "aiRecommendations.maximumRecommendations"
).validate(
  function (value) {

    return (
      Number.isInteger(value) &&
      value >= 1 &&
      value <= 100
    );

  },
  "Maximum recommendations must be between 1 and 100."
);


/* ==========================================================
   MINIMUM AI SCORE VALIDATION
========================================================== */

propertySettingsSchema.path(
  "aiRecommendations.minimumScore"
).validate(
  function (value) {

    return (
      Number.isFinite(value) &&
      value >= 0 &&
      value <= 100
    );

  },
  "Minimum recommendation score must be between 0 and 100."
);


/* ==========================================================
   MINIMUM PROPERTY IMAGES VALIDATION
========================================================== */

propertySettingsSchema.path(
  "listings.minimumImages"
).validate(
  function (value) {

    return (
      Number.isInteger(value) &&
      value >= 0 &&
      value <= 100
    );

  },
  "Minimum property images must be between 0 and 100."
);


/* ==========================================================
   MAXIMUM PROPERTY IMAGES VALIDATION
========================================================== */

propertySettingsSchema.path(
  "images.maximumImages"
).validate(
  function (value) {

    return (
      Number.isInteger(value) &&
      value >= 1 &&
      value <= 100
    );

  },
  "Maximum property images must be between 1 and 100."
);


/* ==========================================================
   IMAGE LIMIT CONSISTENCY
   ----------------------------------------------------------
   The minimum number of images required for publishing
   should never exceed the maximum number of images allowed.
========================================================== */

propertySettingsSchema.pre(
  "validate",
  function (next) {

    const minimumImages =
      this.listings?.minimumImages ?? 0;

    const maximumImages =
      this.images?.maximumImages ?? 1;

    if (
      minimumImages >
      maximumImages
    ) {

      return next(
        new Error(
          "Minimum required images cannot exceed maximum allowed images."
        )
      );

    }

    next();

  }
);


/* ==========================================================
   AI SCORE NORMALIZATION
   ----------------------------------------------------------
   Ensures AI recommendation thresholds remain inside the
   expected 0-100 range.
========================================================== */

propertySettingsSchema.pre(
  "save",
  function (next) {

    if (
      this.aiRecommendations &&
      this.aiRecommendations.minimumScore !== undefined
    ) {

      this.aiRecommendations.minimumScore =
        Math.min(
          100,
          Math.max(
            0,
            Number(
              this.aiRecommendations.minimumScore
            )
          )
        );

    }

    next();

  }
);


/* ==========================================================
   DEFAULT SETTINGS HELPER
   ----------------------------------------------------------
   Used by the property service when an organization does
   not yet have a PropertySettings document.
========================================================== */

propertySettingsSchema.statics.createDefaultSettings =
  async function (
    organizationId,
    createdBy = null
  ) {

    if (!organizationId) {

      throw new Error(
        "organizationId is required to create property settings."
      );

    }


    /*
     * Prevent duplicate settings documents.
     */

    const existing =
      await this.findOne({
        organizationId,
      });

    if (existing) {

      return existing;

    }


    return await this.create({

      organizationId,

      createdBy,

      updatedBy:
        createdBy,

    });

  };


/* ==========================================================
   GET OR CREATE SETTINGS
   ----------------------------------------------------------
   This helper allows the controller/service to safely obtain
   settings without requiring the frontend to know whether
   the organization already has a settings document.
========================================================== */

propertySettingsSchema.statics.getOrCreate =
  async function (
    organizationId,
    userId = null
  ) {

    if (!organizationId) {

      throw new Error(
        "organizationId is required."
      );

    }


    let settings =
      await this.findOne({
        organizationId,
      });


    if (!settings) {

      settings =
        await this.createDefaultSettings(
          organizationId,
          userId
        );

    }


    return settings;

  };


/* ==========================================================
   ORGANIZATION SETTINGS QUERY
========================================================== */

/*
 * Convenience method for retrieving settings belonging to
 * one organization only.
 *
 * This keeps organization isolation explicit.
 */

propertySettingsSchema.statics.findByOrganization =
  function (
    organizationId
  ) {

    if (!organizationId) {

      throw new Error(
        "organizationId is required."
      );

    }


    return this.findOne({
      organizationId,
    });

  };


/* ==========================================================
   SAFE SETTINGS UPDATE
   ----------------------------------------------------------
   Only fields defined by this schema can be persisted.
   Mongoose strict mode remains enabled by default.
========================================================== */

propertySettingsSchema.methods.updateSettings =
  async function (
    updates = {},
    userId = null
  ) {

    if (
      !updates ||
      typeof updates !== "object"
    ) {

      throw new Error(
        "Settings updates must be an object."
      );

    }


    /*
     * Merge nested settings rather than replacing the entire
     * settings category.
     *
     * Example:
     *
     * {
     *   aiRecommendations: {
     *     enabled: false
     *   }
     * }
     *
     * will preserve all other AI recommendation settings.
     */

    const mergeNested = (
      target,
      source
    ) => {

      if (
        !source ||
        typeof source !== "object"
      ) {

        return;

      }


      Object.entries(source).forEach(
        ([key, value]) => {

          if (
            value &&
            typeof value === "object" &&
            !Array.isArray(value)
          ) {

            if (
              !target[key] ||
              typeof target[key] !== "object"
            ) {

              target[key] = {};

            }


            mergeNested(
              target[key],
              value
            );

          } else {

            target[key] =
              value;

          }

        }
      );

    };


    /*
     * Never allow the organization identity to be changed
     * through the settings update payload.
     */

    const safeUpdates = {
      ...updates,
    };


    delete safeUpdates.organizationId;
    delete safeUpdates._id;
    delete safeUpdates.createdAt;
    delete safeUpdates.updatedAt;
    delete safeUpdates.createdBy;
    delete safeUpdates.updatedBy;


    mergeNested(
      this,
      safeUpdates
    );


    if (userId) {

      this.updatedBy =
        userId;

    }


    await this.save();


    return this;

  };


/* ==========================================================
   MODEL
========================================================== */

const PropertySettings =
  mongoose.models.PropertySettings ||
  mongoose.model(
    "PropertySettings",
    propertySettingsSchema
  );

export default PropertySettings;
