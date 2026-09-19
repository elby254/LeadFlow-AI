/**
 * ==========================================================
 *
 * Handles all attachment-related endpoints.
 *
 * Supports
 * ----------------------------------------------------------
 * ✓ Upload Attachments
 * ✓ Retrieve Attachments
 * ✓ Download Attachments
 * ✓ Delete Attachments
 * ✓ Voice Notes
 *
 * Used By
 * ----------------------------------------------------------
 * Attachments.jsx
 * MessageComposer.jsx
 * MessageBubble.jsx
 * VoiceRecorder.jsx
 *
 * ==========================================================
 */

import express from "express";

import attachmentController from "../controllers/attachmentController.js";

const router = express.Router();

/* ==========================================================
   UPLOAD ATTACHMENT
========================================================== */

/**
 * POST
 * /api/attachments/upload
 */

router.post(

  "/upload",

  attachmentController.uploadAttachment

);

/* ==========================================================
   GET MESSAGE ATTACHMENTS
========================================================== */

/**
 * GET
 * /api/attachments/message/:messageId
 */

router.get(

  "/message/:messageId",

  attachmentController.getMessageAttachments

);

/* ==========================================================
   GET CONVERSATION ATTACHMENTS
========================================================== */

/**
 * GET
 * /api/attachments/conversation/:conversationId
 */

router.get(

  "/conversation/:conversationId",

  attachmentController.getConversationAttachments

);

/* ==========================================================
   DOWNLOAD ATTACHMENT
========================================================== */

/**
 * GET
 * /api/attachments/:attachmentId/download
 */

router.get(

  "/:attachmentId/download",

  attachmentController.downloadAttachment

);

/* ==========================================================
   DELETE ATTACHMENT
========================================================== */

/**
 * DELETE
 * /api/attachments/:attachmentId
 */

router.delete(

  "/:attachmentId",

  attachmentController.deleteAttachment

);

/* ==========================================================
   EXPORT
========================================================== */

export default router;