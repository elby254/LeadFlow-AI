/**
 * ==========================================================
 *
 * Stores uploaded files belonging to chat messages.
 *
 * Supports
 * ----------------------------------------------------------
 * ✓ Images
 * ✓ PDFs
 * ✓ Word Documents
 * ✓ Excel Files
 * ✓ Videos
 * ✓ Audio
 * ✓ Voice Notes
 *
 * Used By
 * ----------------------------------------------------------
 * ChatWindow
 * Attachments.jsx
 * MessageBubble
 * MessageComposer
 * AttachmentController
 *
 * ==========================================================
 */

import mongoose from "mongoose";

/* ==========================================================
   ATTACHMENT
========================================================== */

const attachmentSchema = new mongoose.Schema(

  {

    /* ======================================================
       MULTI TENANCY
    ====================================================== */

    organizationId: {

      type: mongoose.Schema.Types.ObjectId,

      ref: "Organization",

      required: true,

      index: true,

    },

    /* ======================================================
       RELATIONSHIPS
    ====================================================== */

    conversationId: {

      type: mongoose.Schema.Types.ObjectId,

      ref: "Conversation",

      required: true,

      index: true,

    },

    messageId: {

      type: mongoose.Schema.Types.ObjectId,

      ref: "Message",

      required: true,

      index: true,

    },

    uploadedBy: {

      type: mongoose.Schema.Types.ObjectId,

      ref: "User",

      default: null,

    },

    /* ======================================================
       FILE INFORMATION
    ====================================================== */

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

    },

    extension: {

      type: String,

      default: "",

    },

    size: {

      type: Number,

      required: true,

    },

    /* ======================================================
       STORAGE
    ====================================================== */

    url: {

      type: String,

      required: true,

    },

    storageProvider: {

      type: String,

      enum: [

        "local",

        "s3",

        "cloudinary",

        "azure",

      ],

      default: "local",

    },

    storageKey: {

      type: String,

      default: "",

    },

    /* ======================================================
       FILE TYPE
    ====================================================== */

    category: {

      type: String,

      enum: [

        "image",

        "document",

        "spreadsheet",

        "video",

        "audio",

        "voice",

        "other",

      ],

      default: "other",

      index: true,

    },

    /* ======================================================
       IMAGE METADATA
    ====================================================== */

    image: {

      width: Number,

      height: Number,

      thumbnail: String,

    },

    /* ======================================================
       AUDIO / VIDEO
    ====================================================== */

    duration: {

      type: Number,

      default: 0,

    },

    /* ======================================================
       DOWNLOADS
    ====================================================== */

    downloads: {

      type: Number,

      default: 0,

    },

    lastDownloadedAt: {

      type: Date,

      default: null,

    },

    /* ======================================================
       SECURITY
    ====================================================== */

    scanned: {

      type: Boolean,

      default: false,

    },

    infected: {

      type: Boolean,

      default: false,

    },

    /* ======================================================
       SOFT DELETE
    ====================================================== */

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

/* ==========================================================
   INDEXES
========================================================== */

attachmentSchema.index({

  organizationId: 1,

  conversationId: 1,

});

attachmentSchema.index({

  messageId: 1,

});

attachmentSchema.index({

  category: 1,

});

attachmentSchema.index({

  uploadedBy: 1,

});

/* ==========================================================
   MODEL
========================================================== */

const Attachment =

  mongoose.models.Attachment ||

  mongoose.model(

    "Attachment",

    attachmentSchema

  );

export default Attachment;