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
 *
 * CANONICAL VIEWING WORKFLOW
 * ==========================================================
 *
 * Viewing.status is the authoritative viewing workflow.
 *
 * Canonical values:
 *
 *   Requested
 *   Pending Approval
 *   Approved
 *   Rescheduled
 *   Rejected
 *   Cancelled
 *   Completed
 *
 * IMPORTANT
 * ----------------------------------------------------------
 * These are Viewing.status values.
 *
 * They are NOT Lead.status values.
 *
 * Lead.status remains:
 *
 *   new
 *   contacted
 *   qualified
 *   viewing
 *   negotiation
 *   won
 *   lost
 *
 * ==========================================================
 */

import mongoose from "mongoose";


// ==========================================================
// CANONICAL VIEWING STATUS
// ==========================================================

export const VIEWING_STATUS =
  Object.freeze({

    REQUESTED:
      "Requested",

    PENDING_APPROVAL:
      "Pending Approval",

    APPROVED:
      "Approved",

    RESCHEDULED:
      "Rescheduled",

    REJECTED:
      "Rejected",

    CANCELLED:
      "Cancelled",

    COMPLETED:
      "Completed",

  });


// ==========================================================
// VIEWING STATUS GROUPS
// ==========================================================

/**
 * A viewing is considered requested/pending when it has
 * not yet reached an approved schedule.
 */
export const VIEWING_REQUEST_STATUSES =
  Object.freeze([

    VIEWING_STATUS.REQUESTED,

    VIEWING_STATUS.PENDING_APPROVAL,

  ]);


/**
 * A viewing is considered scheduled when it has been
 * approved or rescheduled.
 */
export const VIEWING_SCHEDULED_STATUSES =
  Object.freeze([

    VIEWING_STATUS.APPROVED,

    VIEWING_STATUS.RESCHEDULED,

  ]);


// ==========================================================
// VIEWING STATUS VALUES
// ==========================================================

export const VIEWING_STATUS_VALUES =
  Object.freeze([

    VIEWING_STATUS.REQUESTED,

    VIEWING_STATUS.PENDING_APPROVAL,

    VIEWING_STATUS.APPROVED,

    VIEWING_STATUS.RESCHEDULED,

    VIEWING_STATUS.REJECTED,

    VIEWING_STATUS.CANCELLED,

    VIEWING_STATUS.COMPLETED,

  ]);


// ==========================================================
// VIEWING HISTORY ACTIONS
// ==========================================================

const VIEWING_HISTORY_ACTIONS =
  Object.freeze([

    "created",

    "requested",

    "pending_approval",

    "approved",

    "rejected",

    "rescheduled",

    "cancelled",

    "completed",

  ]);


// ==========================================================
// VIEWING SCHEMA
// ==========================================================

const viewingSchema =
  new mongoose.Schema(

    {

      // ======================================================
      // RELATIONSHIPS
      // ======================================================

      /**
       * Lead / customer requesting the viewing.
       */
      lead: {

        type:
          mongoose.Schema.Types.ObjectId,

        ref:
          "Lead",

        required:
          true,

        index:
          true,

      },


      /**
       * Property being viewed.
       */
      property: {

        type:
          mongoose.Schema.Types.ObjectId,

        ref:
          "Property",

        required:
          true,

        index:
          true,

      },


      /**
       * Agent responsible for the viewing.
       */
      agent: {

        type:
          mongoose.Schema.Types.ObjectId,

        ref:
          "User",

        required:
          true,

        index:
          true,

      },


      /**
       * User who originally requested the viewing.
       */
      requestedBy: {

        type:
          mongoose.Schema.Types.ObjectId,

        ref:
          "User",

        required:
          true,

      },


      /**
       * Organization that owns the viewing.
       *
       * This is the authoritative tenant boundary.
       */
      organizationId: {

        type:
          mongoose.Schema.Types.ObjectId,

        ref:
          "Organization",

        required:
          true,

        index:
          true,

      },


      /**
       * Optional conversation associated with the viewing.
       */
      conversation: {

        type:
          mongoose.Schema.Types.ObjectId,

        ref:
          "Conversation",

        default:
          null,

        index:
          true,

      },


      // ======================================================
      // VIEWING DATE / TIME
      // ======================================================

      /**
       * Date of the viewing.
       *
       * The actual clock time is represented by startTime
       * and endTime.
       */
      viewingDate: {

        type:
          Date,

        required:
          true,

        index:
          true,

      },


      /**
       * Viewing start time.
       *
       * Existing workflow stores values such as:
       *
       *   "10:00"
       *   "14:30"
       */
      startTime: {

        type:
          String,

        required:
          true,

        trim:
          true,

      },


      /**
       * Viewing end time.
       */
      endTime: {

        type:
          String,

        required:
          true,

        trim:
          true,

      },


      /**
       * Timezone used for the viewing.
       */
      timezone: {

        type:
          String,

        default:
          "Africa/Nairobi",

        trim:
          true,

      },


      // ======================================================
      // CALENDAR INTEGRATION
      // ======================================================

      calendarProvider: {

        type:
          String,

        enum: [

          "google",

          "outlook",

          "internal",

          "none",

        ],

        default:
          "none",

      },


      /**
       * External calendar event ID.
       */
      calendarEventId: {

        type:
          String,

        default:
          null,

        trim:
          true,

      },


      /**
       * Online meeting link.
       */
      meetingLink: {

        type:
          String,

        default:
          null,

        trim:
          true,

      },


      /**
       * Duration in minutes.
       */
      durationMinutes: {

        type:
          Number,

        default:
          60,

        min:
          1,

      },


      /**
       * Whether customer has confirmed the viewing.
       */
      customerConfirmed: {

        type:
          Boolean,

        default:
          false,

      },


      /**
       * When customer confirmation occurred.
       */
      customerConfirmedAt: {

        type:
          Date,

        default:
          null,

      },


      // ======================================================
      // LOCATION
      // ======================================================

      location: {

        address: {
          type:
            String,

          trim:
            true,
        },

        city: {
          type:
            String,

          trim:
            true,
        },

        county: {
          type:
            String,

          trim:
            true,
        },

        latitude: {
          type:
            Number,
        },

        longitude: {
          type:
            Number,
        },

      },


      // ======================================================
      // VIEWING STATUS
      // ======================================================
      //
      // THIS IS THE VIEWING WORKFLOW SOURCE OF TRUTH.
      //
      // It is deliberately independent from Lead.status.
      //
      // ======================================================

      status: {

        type:
          String,

        enum:
          VIEWING_STATUS_VALUES,

        default:
          VIEWING_STATUS.REQUESTED,

        index:
          true,

      },


      // ======================================================
      // PRIORITY
      // ======================================================

      priority: {

        type:
          String,

        enum: [

          "Low",

          "Medium",

          "High",

          "Urgent",

        ],

        default:
          "Medium",

      },


      // ======================================================
      // NOTES
      // ======================================================

      notes: {

        type:
          String,

        default:
          "",

        trim:
          true,

      },


      // ======================================================
      // APPROVAL
      // ======================================================

      approvedBy: {

        type:
          mongoose.Schema.Types.ObjectId,

        ref:
          "User",

        default:
          null,

      },


      approvedAt: {

        type:
          Date,

        default:
          null,

      },


      // ======================================================
      // REJECTION
      // ======================================================

      rejectionReason: {

        type:
          String,

        default:
          "",

        trim:
          true,

      },


      // ======================================================
      // CANCELLATION
      // ======================================================

      cancellationReason: {

        type:
          String,

        default:
          "",

        trim:
          true,

      },


      cancelledBy: {

        type:
          mongoose.Schema.Types.ObjectId,

        ref:
          "User",

        default:
          null,

      },


      cancelledAt: {

        type:
          Date,

        default:
          null,

      },


      // ======================================================
      // RESCHEDULING
      // ======================================================

      rescheduleCount: {

        type:
          Number,

        default:
          0,

        min:
          0,

      },


      previousSchedules: [

        {

          viewingDate: {

            type:
              Date,

          },


          startTime: {

            type:
              String,

            trim:
              true,

          },


          endTime: {

            type:
              String,

            trim:
              true,

          },


          changedAt: {

            type:
              Date,

            default:
              Date.now,

          },

        },

      ],


      // ======================================================
      // VIEWING HISTORY
      // ======================================================
      //
      // Historical actions are not Lead.status values.
      //
      // They describe changes inside the Viewing workflow.
      //
      // ======================================================

      history: [

        {

          action: {

            type:
              String,

            enum:
              VIEWING_HISTORY_ACTIONS,

          },


          performedBy: {

            type:
              mongoose.Schema.Types.ObjectId,

            ref:
              "User",

            default:
              null,

          },


          performedAt: {

            type:
              Date,

            default:
              Date.now,

          },


          notes: {

            type:
              String,

            default:
              "",

            trim:
              true,

          },

        },

      ],


      // ======================================================
      // REMINDERS
      // ======================================================

      reminders: [

        {

          type: {

            type:
              String,

            trim:
              true,

          },


          scheduledFor: {

            type:
              Date,

          },


          sentAt: {

            type:
              Date,

            default:
              null,

          },


          sent: {

            type:
              Boolean,

            default:
              false,

          },

        },

      ],


      // ======================================================
      // ATTACHMENTS
      // ======================================================

      attachments: [

        {

          url: {

            type:
              String,

            trim:
              true,

          },


          publicId: {

            type:
              String,

            trim:
              true,

          },


          filename: {

            type:
              String,

            trim:
              true,

          },


          mimeType: {

            type:
              String,

            trim:
              true,

          },


          uploadedAt: {

            type:
              Date,

            default:
              Date.now,

          },

        },

      ],


      // ======================================================
      // AI RECOMMENDATION
      // ======================================================

      aiRecommendation: {

        type:
          String,

        default:
          "",

        trim:
          true,

      },


      // ======================================================
      // FOLLOW-UP TASK
      // ======================================================

      followUpTask: {

        type:
          String,

        default:
          "",

        trim:
          true,

      },


      // ======================================================
      // COMPLETION / CHECK-IN
      // ======================================================

      completedAt: {

        type:
          Date,

        default:
          null,

      },


      checkedInAt: {

        type:
          Date,

        default:
          null,

      },


      checkedOutAt: {

        type:
          Date,

        default:
          null,

      },


      // ======================================================
      // LEGACY NO-SHOW INFORMATION
      // ======================================================
      //
      // "No Show" is NOT a canonical status.
      //
      // This field is retained only for compatibility with
      // historical data and future disposition handling.
      //
      // Do NOT write:
      //
      //   status = "No Show"
      //
      // ======================================================

      noShowReason: {

        type:
          String,

        default:
          "",

        trim:
          true,

      },


      // ======================================================
      // FEEDBACK
      // ======================================================

      feedback: {

        /**
         * Customer rating of the viewing.
         */
        viewerRating: {

          type:
            Number,

          min:
            1,

          max:
            5,

        },


        /**
         * Customer comment.
         */
        viewerComment: {

          type:
            String,

          default:
            "",

          trim:
            true,

        },


        /**
         * Agent's outcome after viewing.
         */
        agentOutcome: {

          type:
            String,

          enum: [

            "Interested",

            "Needs Follow Up",

            "Not Interested",

            "Offer Expected",

          ],

          default:
            null,

        },


        /**
         * Whether another follow-up is required.
         */
        followUpRequired: {

          type:
            Boolean,

          default:
            false,

        },


        /**
         * Canonical numeric rating compatibility.
         *
         * This allows viewingService to use:
         *
         *   feedback.rating
         *
         * without losing the existing viewerRating field.
         */
        rating: {

          type:
            Number,

          min:
            1,

          max:
            5,

        },


        /**
         * Canonical feedback comment compatibility.
         */
        comment: {

          type:
            String,

          default:
            "",

          trim:
            true,

        },


        /**
         * User who submitted the feedback.
         */
        submittedBy: {

          type:
            mongoose.Schema.Types.ObjectId,

          ref:
            "User",

          default:
            null,

        },


        /**
         * Duplicate-submission guard.
         *
         * Viewing service can use this field to prevent
         * multiple feedback submissions.
         */
        submittedAt: {

          type:
            Date,

          default:
            null,

        },

      },


      // ======================================================
      // SOURCE
      // ======================================================

      source: {

        type:
          String,

        default:
          "",

        trim:
          true,

      },


      // ======================================================
      // SOFT DELETE / ARCHIVE
      // ======================================================

      deleted: {

        type:
          Boolean,

        default:
          false,

        index:
          true,

      },


      isArchived: {

        type:
          Boolean,

        default:
          false,

        index:
          true,

      },

    },

    {

      timestamps:
        true,

    }

  );


// ==========================================================
// INDEXES
// ==========================================================


// Property + viewing date
viewingSchema.index({

  property:
    1,

  viewingDate:
    1,

});


// Agent + viewing date
viewingSchema.index({

  agent:
    1,

  viewingDate:
    1,

});


// Lead + status
viewingSchema.index({

  lead:
    1,

  status:
    1,

});


// Status + viewing date
viewingSchema.index({

  status:
    1,

  viewingDate:
    1,

});


// Organization + viewing date
viewingSchema.index({

  organizationId:
    1,

  viewingDate:
    1,

});


// Organization + agent + viewing date
viewingSchema.index({

  organizationId:
    1,

  agent:
    1,

  viewingDate:
    1,

});


// Organization + property + viewing date
viewingSchema.index({

  organizationId:
    1,

  property:
    1,

  viewingDate:
    1,

});


// Organization + lead + viewing date
viewingSchema.index({

  organizationId:
    1,

  lead:
    1,

  viewingDate:
    1,

});


// Organization + status + viewing date
viewingSchema.index({

  organizationId:
    1,

  status:
    1,

  viewingDate:
    1,

});


// Calendar event lookup
viewingSchema.index({

  calendarEventId:
    1,

});


// ==========================================================
// MODEL
// ==========================================================

const Viewing =
  mongoose.models.Viewing ||
  mongoose.model(
    "Viewing",
    viewingSchema
  );


export default Viewing;