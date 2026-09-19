/**
 * ==========================================================
 *
 * Handles all message-related endpoints.
 *
 * Supports
 * ----------------------------------------------------------
 * ✓ Load Messages
 * ✓ Send Message
 * ✓ Read Receipts
 * ✓ Typing Indicator
 * ✓ Retry Failed Messages
 * ✓ Message Search
 *
 * Used By
 * ----------------------------------------------------------
 * ChatWindow
 * MessageComposer
 * MessageBubble
 * TypingIndicator
 * ReadReceipt
 *
 * ==========================================================
 */

import express from "express";

import messageController from "../controllers/messageController.js";

const router = express.Router();

/* ==========================================================
   MESSAGE HISTORY
========================================================== */

/**
 * GET
 * /api/messages/conversation/:conversationId
 *
 * Returns paginated conversation messages.
 */

router.get(

  "/conversation/:conversationId",

  messageController.getConversationMessages

);

/* ==========================================================
   SEND MESSAGE
========================================================== */

/**
 * POST
 * /api/messages/conversation/:conversationId
 *
 * Send new message.
 */

router.post(

  "/conversation/:conversationId",

  messageController.sendMessage

);

/* ==========================================================
   READ RECEIPT
========================================================== */

/**
 * PATCH
 * /api/messages/:messageId/read
 */

router.patch(

  "/:messageId/read",

  messageController.markMessageRead

);

/* ==========================================================
   SEARCH MESSAGES
========================================================== */

/**
 * GET
 * /api/messages/search
 */

router.get(

  "/search",

  messageController.searchMessages

);

/* ==========================================================
   RETRY FAILED MESSAGE
========================================================== */

/**
 * POST
 * /api/messages/:messageId/retry
 */

router.post(

  "/:messageId/retry",

  messageController.retryMessage

);

/* ==========================================================
   TYPING STATUS
========================================================== */

/**
 * GET
 * /api/messages/conversation/:conversationId/typing
 */

router.get(

  "/conversation/:conversationId/typing",

  messageController.getTypingStatus

);

/**
 * POST
 * /api/messages/conversation/:conversationId/typing
 */

router.post(

  "/conversation/:conversationId/typing",

  messageController.sendTypingStatus

);

/* ==========================================================
   EXPORT
========================================================== */

export default router;