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
//
// and:
//
// leadId
//
// are NOT declared again below.
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