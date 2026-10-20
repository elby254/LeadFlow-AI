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
 * ✓ Voice Notes
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

import {
  protect,
} from "../middleware/authMiddleware.js";

import {
  authenticatedUser,
} from "../middleware/roleMiddleware.js";

const router =
  express.Router();

/* ==========================================================
   PROTECT ALL MESSAGE ROUTES
========================================================== */

router.use(protect);
router.use(authenticatedUser);

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
   VOICE MESSAGE
========================================================== */

/**
 * POST
 * /api/messages/conversation/:conversationId/voice
 */

router.post(
  "/conversation/:conversationId/voice",

  messageController.uploadVoiceMessage
);

/* ==========================================================
   EXPORT
========================================================== */

export default router;