/**
 * ==========================================================
 * LEADFLOW AI
 * VIEWING MODEL
 * ==========================================================
 *
 * Purpose
 * -------
 * Represents a property viewing appointment between:
 *
 *   • Lead / Customer
 *   • Property
 *   • Assigned Agent
 *
 * Organization isolation is enforced through:
 *
 *   organizationId
 *
 * ==========================================================
 */

import mongoose from "mongoose";


/* ==========================================================
   VIEWING SCHEMA
   ========================================================== */

const viewingSchema =
  new mongoose.Schema(
    {

      /* ======================================================
         RELATIONSHIPS
      ====================================================== */

      /**
       * Lead / customer requesting the viewing.
       */
      lead: {
        type:
          mongoose.Schema.Types.ObjectId,

        ref: "Lead",

        required: true,
      },


      /**
       * Property being viewed.
       */
      property: {
        type:
          mongoose.Schema.Types.ObjectId,

        ref: "Property",

        required: true,
      },


      /**
       * Agent responsible for the viewing.
       */
      agent: {
        type:
          mongoose.Schema.Types.ObjectId,

        ref: "User",

        required: true,
      },


      /**
       * User who originally requested
       * the viewing.
       */
      requestedBy: {
        type:
          mongoose.Schema.Types.ObjectId,

        ref: "User",

        required: true,
      },


      /**
       * Organization that owns the viewing.
       *
       * IMPORTANT:
       * This is the SINGLE organizationId declaration.
       *
       * The duplicate declaration has been removed.
       */
      organizationId: {
        type:
          mongoose.Schema.Types.ObjectId,

        ref: "Organization",

        required: true,

        index: true,
      },


      /**
       * Optional conversation associated
       * with the viewing.
       */
      conversation: {
        type:
          mongoose.Schema.Types.ObjectId,

        ref: "Conversation",
      },


      /* ======================================================
         VIEWING DATE / TIME
      ====================================================== */

      /**
       * Date of the viewing.
       */
      viewingDate: {
        type: Date,

        required: true,

        index: true,
      },


      /**
       * Viewing start time.
       *
       * Stored as a string because the existing
       * viewing workflow uses values such as:
       *
       *   "10:00"
       *   "14:30"
       */
      startTime: {
        type: String,

        required: true,
      },


      /**
       * Viewing end time.
       */
      endTime: {
        type: String,

        required: true,
      },


      /**
       * Timezone used for the viewing.
       */
      timezone: {
        type: String,

        default:
          "Africa/Nairobi",
      },


      /* ======================================================
         CALENDAR INTEGRATION
      ====================================================== */

      calendarProvider: {
        type: String,

        enum: [
          "google",
          "outlook",
          "internal",
          "none",
        ],

        default: "none",
      },


      /**
       * External calendar event ID.
       */
      calendarEventId: {
        type: String,
      },


      /**
       * Online meeting link.
       */
      meetingLink: {
        type: String,
      },


      /**
       * Duration in minutes.
       */
      durationMinutes: {
        type: Number,

        default: 60,

        min: 1,
      },


      /**
       * Whether customer has confirmed
       * the viewing.
       */
      customerConfirmed: {
        type: Boolean,

        default: false,
      },


      /**
       * When customer confirmation occurred.
       */
      customerConfirmedAt: {
        type: Date,
      },


      /* ======================================================
         LOCATION
      ====================================================== */

      location: {

        address: {
          type: String,
        },

        city: {
          type: String,
        },

        county: {
          type: String,
        },

        latitude: {
          type: Number,
        },

        longitude: {
          type: Number,
        },

      },


      /* ======================================================
         VIEWING STATUS
      ====================================================== */

      status: {
        type: String,

        enum: [
          "Requested",
          "Pending Approval",
          "Approved",
          "Rejected",
          "Rescheduled",
          "Cancelled",
          "Completed",
          "No Show",
        ],

        default:
          "Requested",

        index: true,
      },


      /* ======================================================
         PRIORITY
      ====================================================== */

      priority: {
        type: String,

        enum: [
          "Low",
          "Medium",
          "High",
          "Urgent",
        ],

        default: "Medium",
      },


      /* ======================================================
         NOTES
      ====================================================== */

      notes: {
        type: String,
      },


      /* ======================================================
         APPROVAL
      ====================================================== */

      approvedBy: {
        type:
          mongoose.Schema.Types.ObjectId,

        ref: "User",
      },


      approvedAt: {
        type: Date,
      },


      /* ======================================================
         REJECTION
      ====================================================== */

      rejectionReason: {
        type: String,
      },


      /* ======================================================
         CANCELLATION
      ====================================================== */

      cancellationReason: {
        type: String,
      },


      cancelledBy: {
        type:
          mongoose.Schema.Types.ObjectId,

        ref: "User",
      },


      cancelledAt: {
        type: Date,
      },


      /* ======================================================
         RESCHEDULING
      ====================================================== */

      rescheduleCount: {
        type: Number,

        default: 0,

        min: 0,
      },


      previousSchedules: [
        {
          viewingDate: {
            type: Date,
          },

          startTime: {
            type: String,
          },

          endTime: {
            type: String,
          },

          changedAt: {
            type: Date,

            default: Date.now,
          },
        },
      ],


      /* ======================================================
         VIEWING HISTORY
      ====================================================== */

      history: [
        {
          action: {
            type: String,

            enum: [
              "created",
              "approved",
              "rejected",
              "rescheduled",
              "cancelled",
              "completed",
            ],
          },

          performedBy: {
            type:
              mongoose.Schema.Types.ObjectId,

            ref: "User",
          },

          performedAt: {
            type: Date,

            default: Date.now,
          },

          notes: {
            type: String,
          },
        },
      ],


      /* ======================================================
         REMINDERS
      ====================================================== */

      reminders: [
        {
          type: {
            type: String,
          },

          scheduledFor: {
            type: Date,
          },

          sentAt: {
            type: Date,
          },

          sent: {
            type: Boolean,

            default: false,
          },
        },
      ],


      /* ======================================================
         ATTACHMENTS
      ====================================================== */

      attachments: [
        {
          url: {
            type: String,
          },

          publicId: {
            type: String,
          },

          filename: {
            type: String,
          },

          mimeType: {
            type: String,
          },

          uploadedAt: {
            type: Date,

            default: Date.now,
          },
        },
      ],


      /* ======================================================
         AI RECOMMENDATION
      ====================================================== */

      aiRecommendation: {
        type: String,
      },


      /* ======================================================
         FOLLOW-UP TASK
      ====================================================== */

      followUpTask: {
        type: String,
      },


      /* ======================================================
         COMPLETION / CHECK-IN
      ====================================================== */

      completedAt: {
        type: Date,
      },


      checkedInAt: {
        type: Date,
      },


      checkedOutAt: {
        type: Date,
      },


      /* ======================================================
         NO-SHOW INFORMATION
      ====================================================== */

      noShowReason: {
        type: String,
      },


      /* ======================================================
         FEEDBACK
      ====================================================== */

      feedback: {

        /**
         * Customer rating of the viewing.
         */
        viewerRating: {
          type: Number,

          min: 1,

          max: 5,
        },


        /**
         * Customer comment.
         */
        viewerComment: {
          type: String,
        },


        /**
         * Agent's outcome after viewing.
         */
        agentOutcome: {
          type: String,

          enum: [
            "Interested",
            "Needs Follow Up",
            "Not Interested",
            "Offer Expected",
          ],
        },


        /**
         * Whether another follow-up
         * is required.
         */
        followUpRequired: {
          type: Boolean,

          default: false,
        },

      },


      /* ======================================================
         SOURCE
      ====================================================== */

      source: {
        type: String,
      },


      /* ======================================================
         SOFT DELETE / ARCHIVE
      ====================================================== */

      deleted: {
        type: Boolean,

        default: false,
      },


      isArchived: {
        type: Boolean,

        default: false,
      },

    },

    {
      timestamps: true,
    }
  );


/* ==========================================================
   INDEXES
   ========================================================== */

/**
 * Property + viewing date
 *
 * Helps detect and query property viewing schedules.
 */
viewingSchema.index({
  property: 1,
  viewingDate: 1,
});


/**
 * Agent + viewing date
 *
 * Helps detect agent schedule conflicts.
 */
viewingSchema.index({
  agent: 1,
  viewingDate: 1,
});


/**
 * Lead + status
 */
viewingSchema.index({
  lead: 1,
  status: 1,
});


/**
 * Status + viewing date
 */
viewingSchema.index({
  status: 1,
  viewingDate: 1,
});


/**
 * Organization + viewing date
 *
 * Important for organization-scoped
 * calendar and analytics queries.
 */
viewingSchema.index({
  organizationId: 1,
  viewingDate: 1,
});


/**
 * Conversation lookup.
 */
viewingSchema.index({
  conversation: 1,
});


/**
 * Organization + status
 *
 * Important for analytics and dashboards.
 */
viewingSchema.index({
  status: 1,
  organizationId: 1,
});


/**
 * Calendar event lookup.
 */
viewingSchema.index({
  calendarEventId: 1,
});


/* ==========================================================
   MODEL
   ========================================================== */

const Viewing =
  mongoose.models.Viewing ||
  mongoose.model(
    "Viewing",
    viewingSchema
  );


export default Viewing;