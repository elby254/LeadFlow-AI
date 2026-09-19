/**
 * ==========================================================
 *
 * LeadFlow AI Conversation Center API
 *
 * ==========================================================
 */

import express from "express";

import conversationController from "../controllers/conversationController.js";

import messageController from "../controllers/messageController.js";

import attachmentController from "../controllers/attachmentController.js";

import viewerConversationController from "../controllers/viewerConversationController.js";

import {
  protect,
  requireRole,
} from "../middleware/authMiddleware.js";

import {
  conversationAccess,
} from "../middleware/conversationAccessMiddleware.js";

const router =
  express.Router();

/* ==========================================================
   AUTHENTICATION
========================================================== */

/*
 * EVERY conversation API is authenticated.
 */
router.use(
  protect
);

/* ==========================================================
   VIEWER CONVERSATIONS
========================================================== */

/*
 * IMPORTANT:
 *
 * This MUST be before:
 *
 * /:id
 *
 * Otherwise "viewer" may be interpreted as
 * a conversation ID.
 */

router.get(
  "/viewer",
  requireRole(
    "viewer"
  ),
  viewerConversationController.getViewerConversations
);

/* ==========================================================
   ADMIN / AGENT CONVERSATIONS
========================================================== */

router.get(
  "/",
  requireRole(
    "admin",
    "agent"
  ),
  conversationController.getConversations
);

router.get(
  "/recent",
  requireRole(
    "admin",
    "agent"
  ),
  conversationController.getRecentConversations
);

router.get(
  "/search",
  requireRole(
    "admin",
    "agent"
  ),
  conversationController.searchConversations
);

/* ==========================================================
   TYPING
========================================================== */

router.get(
  "/:id/typing",
  conversationAccess,
  messageController.getTypingStatus
);

router.post(
  "/:id/typing",
  conversationAccess,
  requireRole(
    "admin",
    "agent"
  ),
  messageController.sendTypingStatus
);

/* ==========================================================
   AI
========================================================== */

router.post(
  "/:id/ai/reply",
  conversationAccess,
  requireRole(
    "admin",
    "agent"
  ),
  conversationController.generateAIReply
);

router.post(
  "/:id/ai/suggestions",
  conversationAccess,
  requireRole(
    "admin",
    "agent"
  ),
  conversationController.generateReplySuggestions
);

router.get(
  "/:id/summary",
  conversationAccess,
  requireRole(
    "admin",
    "agent"
  ),
  conversationController.getConversationSummary
);

router.get(
  "/:id/insights",
  conversationAccess,
  requireRole(
    "admin",
    "agent"
  ),
  conversationController.getConversationInsights
);

/* ==========================================================
   VIEWING WORKFLOW
========================================================== */

router.post(
  "/:id/request-viewing",
  conversationAccess,
  requireRole(
    "admin",
    "agent",
    "viewer"
  ),
  conversationController.requestViewing
);

/* ==========================================================
   MESSAGES - GET
========================================================== */

/*
 * Both admin/agent and viewer can read messages,
 * but conversationAccess ensures they can only
 * read an authorized conversation.
 */

router.get(
  "/:id/messages",
  conversationAccess,
  requireRole(
    "admin",
    "agent",
    "viewer"
  ),
  messageController.getConversationMessages
);

/* ==========================================================
   MESSAGES - POST
========================================================== */

/*
 * VIEWER
 *
 * Use dedicated viewer controller so the
 * authenticated viewer becomes sender.
 */

router.post(
  "/:id/messages",
  conversationAccess,
  requireRole(
    "viewer"
  ),
  viewerConversationController.sendViewerMessage
);

/*
 * ADMIN / AGENT
 *
 * Existing message controller is preserved.
 */

router.post(
  "/:id/messages",
  conversationAccess,
  requireRole(
    "admin",
    "agent"
  ),
  messageController.sendMessage
);

/* ==========================================================
   MESSAGE EDIT
========================================================== */

router.patch(
  "/messages/:messageId",
  requireRole(
    "admin",
    "agent"
  ),
  messageController.editMessage
);

/* ==========================================================
   MESSAGE DELETE
========================================================== */

router.delete(
  "/messages/:messageId",
  requireRole(
    "admin",
    "agent"
  ),
  messageController.deleteMessage
);

/* ==========================================================
   MESSAGE READ
========================================================== */

router.patch(
  "/messages/:messageId/read",
  requireRole(
    "admin",
    "agent",
    "viewer"
  ),
  messageController.markMessageRead
);

/* ==========================================================
   VOICE
========================================================== */

router.post(
  "/:id/voice",
  conversationAccess,
  requireRole(
    "admin",
    "agent"
  ),
  messageController.uploadVoiceMessage
);

/* ==========================================================
   ATTACHMENTS
========================================================== */

router.post(
  "/:id/attachments",
  conversationAccess,
  requireRole(
    "admin",
    "agent"
  ),
  attachmentController.uploadAttachment
);

router.get(
  "/:id/attachments",
  conversationAccess,
  requireRole(
    "admin",
    "agent"
  ),
  attachmentController.getConversationAttachments
);

router.delete(
  "/attachments/:attachmentId",
  requireRole(
    "admin",
    "agent"
  ),
  attachmentController.deleteAttachment
);

/* ==========================================================
   CONVERSATION READ
========================================================== */

router.patch(
  "/:id/read",
  conversationAccess,
  requireRole(
    "admin",
    "agent",
    "viewer"
  ),
  conversationController.markConversationRead
);

/* ==========================================================
   ARCHIVE
========================================================== */

router.patch(
  "/:id/archive",
  conversationAccess,
  requireRole(
    "admin",
    "agent"
  ),
  conversationController.archiveConversation
);

/* ==========================================================
   PIN
========================================================== */

router.patch(
  "/:id/pin",
  conversationAccess,
  requireRole(
    "admin",
    "agent"
  ),
  conversationController.pinConversation
);

/* ==========================================================
   SINGLE CONVERSATION
========================================================== */

/*
 * GENERIC ROUTE MUST REMAIN LAST.
 */

router.get(
  "/:id",
  conversationAccess,
  requireRole(
    "admin",
    "agent",
    "viewer"
  ),
  conversationController.getConversationById
);

/* ==========================================================
   EXPORT
========================================================== */

export default router;