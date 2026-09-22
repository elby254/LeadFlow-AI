/**
 * ==========================================================
 *
 * MESSAGE MODEL
 * LeadFlow AI
 *
 * ==========================================================
 *
 * Stores every message belonging to a conversation.
 *
 * ==========================================================
 *
 * Supports:
 *
 * ✓ Text Messages
 * ✓ Attachments
 * ✓ Voice Notes
 * ✓ Read Receipts
 * ✓ Delivery Status
 * ✓ Replies
 * ✓ Message Editing
 * ✓ Reactions
 * ✓ AI Generated Replies
 * ✓ Search
 * ✓ Multi-tenancy
 * ✓ Lead Association
 * ✓ Conversation Association
 * ✓ External Provider Message IDs
 * ✓ Channel / Source Tracking
 * ✓ Webhook Idempotency
 *
 * ==========================================================
 */

import mongoose from "mongoose";



// ==========================================================
// ATTACHMENT
// ==========================================================

const attachmentSchema =
  new mongoose.Schema(
    {

      filename: {

        type: String,

        required: true,

        trim: true,

      },

      originalName: {

        type: String,

        required: true,

        trim: true,

      },

      mimeType: {

        type: String,

        required: true,

        trim: true,

      },

      size: {

        type: Number,

        default: 0,

      },

      url: {

        type: String,

        required: true,

        trim: true,

      },

      uploadedAt: {

        type: Date,

        default: Date.now,

      },

    },

    {

      _id: true,

    }

  );



// ==========================================================
// VOICE NOTE
// ==========================================================

const voiceNoteSchema =
  new mongoose.Schema(
    {

      url: {

        type: String,

        default: "",

      },

      duration: {

        type: Number,

        default: 0,

      },

      size: {

        type: Number,

        default: 0,

      },

      mimeType: {

        type: String,

        default: "",

      },

    },

    {

      _id: false,

    }

  );



// ==========================================================
// READ RECEIPTS
// ==========================================================

const readReceiptSchema =
  new mongoose.Schema(
    {

      userId: {

        type: mongoose.Schema.Types.ObjectId,

        ref: "User",

        default: null,

      },

      readAt: {

        type: Date,

        default: Date.now,

      },

    },

    {

      _id: false,

    }

  );



// ==========================================================
// REACTIONS
// ==========================================================

const reactionSchema =
  new mongoose.Schema(
    {

      emoji: {

        type: String,

        required: true,

        trim: true,

      },

      userId: {

        type: mongoose.Schema.Types.ObjectId,

        ref: "User",

        required: true,

      },

      reactedAt: {

        type: Date,

        default: Date.now,

      },

    },

    {

      _id: true,

    }

  );



// ==========================================================
// MAIN MESSAGE SCHEMA
// ==========================================================

const messageSchema =
  new mongoose.Schema(
    {

      // ======================================================
      // MULTI-TENANCY
      // ======================================================
      //
      // Every message belongs to exactly one organization.
      //
      // This prevents cross-organization message access.
      //
      // ======================================================

      organizationId: {

        type: mongoose.Schema.Types.ObjectId,

        ref: "Organization",

        required: true,

        index: true,

      },



      // ======================================================
      // CONVERSATION
      // ======================================================
      //
      // Every message belongs to a Conversation.
      //
      // ======================================================

      conversationId: {

        type: mongoose.Schema.Types.ObjectId,

        ref: "Conversation",

        required: true,

        index: true,

      },



      // ======================================================
      // LEAD
      // ======================================================
      //
      // A message may optionally be associated with a Lead.
      //
      // IMPORTANT:
      //
      // Not every message necessarily has a lead immediately.
      //
      // ======================================================

      leadId: {

        type: mongoose.Schema.Types.ObjectId,

        ref: "Lead",

        default: null,

        index: true,

      },



      // ======================================================
      // MESSAGE SOURCE / CHANNEL
      // ======================================================
      //
      // Identifies the communication channel that produced
      // this message.
      //
      // Examples:
      //
      // whatsapp
      // sms
      // website
      // facebook
      //
      // This is important for webhook idempotency because the
      // same external message ID should be scoped to its
      // organization and communication channel.
      //
      // ======================================================

      source: {

        type: String,

        enum: [

          "sms",

          "whatsapp",

          "website",

          "facebook",

        ],

        default: null,

        index: true,

      },



      // ======================================================
      // EXTERNAL PROVIDER MESSAGE ID
      // ======================================================
      //
      // Stores the original message identifier supplied by
      // the communication provider.
      //
      // WhatsApp example:
      //
      //   wamid.HBgMMjU0NzI3NDI3MDc4FQIAERg...
      //
      // Africa's Talking / other providers may supply their
      // own external message identifiers.
      //
      // This field is intentionally separate from MongoDB's
      // internal _id.
      //
      // IMPORTANT:
      //
      // This value is used for webhook idempotency.
      //
      // ======================================================

      externalMessageId: {

        type: String,

        default: null,

        trim: true,

        index: true,

      },



      // ======================================================
      // SENDER
      // ======================================================

      senderId: {

        type: mongoose.Schema.Types.ObjectId,

        ref: "User",

        default: null,

      },



      // ======================================================
      // SENDER ROLE
      // ======================================================

      senderRole: {

        type: String,

        enum: [

          "customer",

          "ai",

          "agent",

          "admin",

        ],

        required: true,

        index: true,

      },



      // ======================================================
      // SENDER NAME
      // ======================================================

      senderName: {

        type: String,

        default: "",

        trim: true,

      },



      // ======================================================
      // CONTENT
      // ======================================================

      text: {

        type: String,

        default: "",

        trim: true,

      },



      // ======================================================
      // ATTACHMENTS
      // ======================================================

      attachments: [

        attachmentSchema,

      ],



      // ======================================================
      // VOICE NOTE
      // ======================================================

      voiceNote: {

        type: voiceNoteSchema,

        default: null,

      },



      // ======================================================
      // REPLY
      // ======================================================

      replyTo: {

        type: mongoose.Schema.Types.ObjectId,

        ref: "Message",

        default: null,

      },



      // ======================================================
      // DELIVERY STATUS
      // ======================================================

      status: {

        type: String,

        enum: [

          "sending",

          "sent",

          "delivered",

          "read",

          "failed",

        ],

        default: "sent",

        index: true,

      },



      // ======================================================
      // DELIVERY TIMESTAMP
      // ======================================================

      deliveredAt: {

        type: Date,

        default: null,

      },



      // ======================================================
      // READ RECEIPTS
      // ======================================================

      readReceipts: [

        readReceiptSchema,

      ],



      // ======================================================
      // EDITING
      // ======================================================

      edited: {

        type: Boolean,

        default: false,

      },



      editedAt: {

        type: Date,

        default: null,

      },



      // ======================================================
      // REACTIONS
      // ======================================================

      reactions: [

        reactionSchema,

      ],



      // ======================================================
      // AI MESSAGE
      // ======================================================

      aiGenerated: {

        type: Boolean,

        default: false,

      },



      // ======================================================
      // AI CONFIDENCE
      // ======================================================

      aiConfidence: {

        type: Number,

        default: 0,

        min: 0,

        max: 1,

      },



      // ======================================================
      // AI SUGGESTED REPLIES
      // ======================================================

      suggestedReplies: [

        {

          type: String,

        },

      ],



      // ======================================================
      // SOFT DELETE
      // ======================================================

      deleted: {

        type: Boolean,

        default: false,

      },



      deletedAt: {

        type: Date,

        default: null,

      },

    },

    {

      timestamps: true,

    }

  );



// ==========================================================
// INDEXES
// ==========================================================
//
// IMPORTANT
// ----------------------------------------------------------
//
// Do NOT duplicate indexes that are already declared using:
//
//     index: true
//
// Therefore:
//
// senderRole
// leadId
// source
// externalMessageId
//
// already have their individual indexes.
//
// ==========================================================



// ----------------------------------------------------------
// Conversation chronological lookup
// ----------------------------------------------------------

messageSchema.index({

  conversationId: 1,

  createdAt: -1,

});



// ----------------------------------------------------------
// Tenant + conversation isolation
// ----------------------------------------------------------

messageSchema.index({

  organizationId: 1,

  conversationId: 1,

});



// ----------------------------------------------------------
// Tenant + chronological message lookup
// ----------------------------------------------------------

messageSchema.index({

  organizationId: 1,

  createdAt: -1,

});



// ----------------------------------------------------------
// Full-text message search
// ----------------------------------------------------------

messageSchema.index({

  text: "text",

});



// ==========================================================
// WEBHOOK IDEMPOTENCY INDEX
// ==========================================================
//
// Prevents the same external provider message from being
// stored more than once for the same organization/channel.
//
// Example:
//
// organizationId
//       +
// source = "whatsapp"
//       +
// externalMessageId = "wamid...."
//
// must identify exactly one inbound provider message.
//
// The partial filter is important because many internal
// messages will not have an externalMessageId.
//
// ==========================================================

messageSchema.index(

  {

    organizationId: 1,

    source: 1,

    externalMessageId: 1,

  },

  {

    unique: true,

    partialFilterExpression: {

      externalMessageId: {

        $type: "string",

      },

    },

  }

);



// ==========================================================
// MODEL
// ==========================================================
//
// Prevents OverwriteModelError during development / hot
// reloads.
//
// ==========================================================

const Message =

  mongoose.models.Message ||

  mongoose.model(

    "Message",

    messageSchema

  );



export default Message;