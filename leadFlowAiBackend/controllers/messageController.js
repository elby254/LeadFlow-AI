/**
 * ==========================================================
 *
 * Handles
 * ----------------------------------------------------------
 * ✓ Load conversation messages
 * ✓ Send messages
 * ✓ Edit messages
 * ✓ Read receipts
 * ✓ Delete messages
 * ✓ Typing status
 * ✓ Voice notes
 * ✓ Socket.io events
 *
 * Matches conversationRoutes.js
 *
 * Routes
 * ----------------------------------------------------------
 * GET    /api/conversations/:id/messages
 * POST   /api/conversations/:id/messages
 *
 * PATCH  /api/conversations/messages/:messageId
 * DELETE /api/conversations/messages/:messageId
 * PATCH  /api/conversations/messages/:messageId/read
 *
 * GET    /api/conversations/:id/typing
 * POST   /api/conversations/:id/typing
 *
 * POST   /api/conversations/:id/voice
 *
 * ==========================================================
 */

import Message from "../models/message.js";
import Conversation from "../models/conversation.js";

/* ==========================================================
   CONSTANTS
========================================================== */

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 30;
const MAX_LIMIT = 100;

/* ==========================================================
   GET CONVERSATION MESSAGES
   GET /api/conversations/:id/messages
========================================================== */

export const getConversationMessages = async (req, res) => {
  try {
    const conversationId = req.params.id;

    const page = Math.max(
      Number(req.query.page) || DEFAULT_PAGE,
      1
    );

    const limit = Math.min(
      Math.max(
        Number(req.query.limit) || DEFAULT_LIMIT,
        1
      ),
      MAX_LIMIT
    );

    /* ------------------------------------------------------
       Verify conversation
    ------------------------------------------------------ */

    const conversation = await Conversation.findById(
      conversationId
    );

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found.",
      });
    }

    /* ------------------------------------------------------
       Fetch messages
    ------------------------------------------------------ */

    const messages = await Message.find({
      conversationId,
      deleted: {
        $ne: true,
      },
    })
      .sort({
        createdAt: -1,
      })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    const total = await Message.countDocuments({
      conversationId,
      deleted: {
        $ne: true,
      },
    });

    return res.status(200).json({
      success: true,

      data: messages.reverse(),

      messages: messages.reverse(),

      page,

      limit,

      total,

      hasMore: page * limit < total,
    });
  } catch (error) {
    console.error(
      "GET CONVERSATION MESSAGES ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to load conversation messages.",
      error: error.message,
    });
  }
};

/* ==========================================================
   SEND MESSAGE
   POST /api/conversations/:id/messages
========================================================== */

export const sendMessage = async (req, res) => {
  try {
    const conversationId = req.params.id;

    const {
      text = "",
      attachments = [],
      voiceNote = null,
      senderRole,
    } = req.body;

    const cleanText =
      typeof text === "string"
        ? text.trim()
        : "";

    /* ------------------------------------------------------
       Verify conversation
    ------------------------------------------------------ */

    const conversation = await Conversation.findById(
      conversationId
    );

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found.",
      });
    }

    /* ------------------------------------------------------
       Validate content
    ------------------------------------------------------ */

    if (
      !cleanText &&
      (!Array.isArray(attachments) ||
        attachments.length === 0) &&
      !voiceNote
    ) {
      return res.status(400).json({
        success: false,
        message: "Cannot send an empty message.",
      });
    }

    /* ------------------------------------------------------
       Create message
    ------------------------------------------------------ */

    const message = await Message.create({
      conversationId,

      senderId: req.user.id,

      senderRole:
        senderRole ||
        req.user.role,

      text: cleanText,

      attachments:
        Array.isArray(attachments)
          ? attachments
          : [],

      voiceNote,

      status: "sent",

      delivered: true,

      read: false,

      deliveredAt: new Date(),
    });

    /* ------------------------------------------------------
       Last message preview
    ------------------------------------------------------ */

    const previewText =
      cleanText ||
      (voiceNote
        ? "🎤 Voice Note"
        : Array.isArray(attachments) &&
          attachments.length
        ? "📎 Attachment"
        : "");

    conversation.lastMessage = {
      text: previewText,

      senderId: req.user.id,

      senderRole: req.user.role,

      createdAt: message.createdAt,
    };

    conversation.updatedAt = new Date();

    conversation.lastUpdated = new Date();

    conversation.unreadCount =
      (conversation.unreadCount || 0) + 1;

    await conversation.save();

    /* ------------------------------------------------------
       Socket.io
    ------------------------------------------------------ */

    req.io
      ?.to(conversationId.toString())
      .emit("message_received", message);

    return res.status(201).json({
      success: true,

      message,

      data: message,
    });
  } catch (error) {
    console.error(
      "SEND MESSAGE ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to send message.",
      error: error.message,
    });
  }
};

/* ==========================================================
   EDIT MESSAGE
   PATCH /api/conversations/messages/:messageId
========================================================== */

export const editMessage = async (req, res) => {
  try {
    const { messageId } = req.params;

    const { text } = req.body;

    /* ------------------------------------------------------
       Validate
    ------------------------------------------------------ */

    if (
      typeof text !== "string" ||
      !text.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Message text is required.",
      });
    }

    /* ------------------------------------------------------
       Find message
    ------------------------------------------------------ */

    const message = await Message.findById(
      messageId
    );

    if (!message) {
      return res.status(404).json({
        success: false,
        message: "Message not found.",
      });
    }

    /* ------------------------------------------------------
       Prevent editing deleted messages
    ------------------------------------------------------ */

    if (message.deleted) {
      return res.status(400).json({
        success: false,
        message: "Deleted messages cannot be edited.",
      });
    }

    /* ------------------------------------------------------
       Authorization
    ------------------------------------------------------ */

    if (
      message.senderId &&
      message.senderId.toString() !==
        req.user.id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message:
          "You can only edit your own messages.",
      });
    }

    /* ------------------------------------------------------
       Update message
    ------------------------------------------------------ */

    message.text = text.trim();

    message.edited = true;

    message.editedAt = new Date();

    await message.save();

    /* ------------------------------------------------------
       Update conversation preview if this
       is the latest message
    ------------------------------------------------------ */

    const conversation =
      await Conversation.findById(
        message.conversationId
      );

    if (conversation) {
      const latestMessage =
        await Message.findOne({
          conversationId:
            message.conversationId,

          deleted: {
            $ne: true,
          },
        }).sort({
          createdAt: -1,
        });

      if (
        latestMessage &&
        latestMessage._id.toString() ===
          message._id.toString()
      ) {
        conversation.lastMessage = {
          text: message.text,

          senderId:
            message.senderId,

          senderRole:
            message.senderRole,

          createdAt:
            message.createdAt,
        };

        conversation.updatedAt =
          new Date();

        await conversation.save();
      }
    }

    /* ------------------------------------------------------
       Socket.io
    ------------------------------------------------------ */

    req.io
      ?.to(
        message.conversationId.toString()
      )
      .emit("message_edited", message);

    return res.status(200).json({
      success: true,

      message: "Message updated successfully.",

      data: message,
    });
  } catch (error) {
    console.error(
      "EDIT MESSAGE ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to edit message.",
      error: error.message,
    });
  }
};

/* ==========================================================
   GET TYPING STATUS
   GET /api/conversations/:id/typing
========================================================== */

export const getTypingStatus = async (req, res) => {
  try {
    const { id } = req.params;

    /*
     * Typing state is normally maintained by Socket.io.
     *
     * This HTTP endpoint provides a safe fallback until
     * real-time typing state is connected.
     */

    return res.status(200).json({
      success: true,

      data: {
        conversationId: id,

        typing: false,
      },
    });
  } catch (error) {
    console.error(
      "GET TYPING STATUS ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to get typing status.",
      error: error.message,
    });
  }
};

/* ==========================================================
   SEND TYPING STATUS
   POST /api/conversations/:id/typing
========================================================== */

export const sendTypingStatus = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    const {
      typing = false,
    } = req.body;

    const conversation =
      await Conversation.findById(id);

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found.",
      });
    }

    const typingState =
      Boolean(typing);

    /* ------------------------------------------------------
       Socket.io
    ------------------------------------------------------ */

    req.io
      ?.to(id.toString())
      .emit("typing_status", {
        conversationId: id,

        userId: req.user.id,

        typing: typingState,
      });

    return res.status(200).json({
      success: true,

      data: {
        conversationId: id,

        userId: req.user.id,

        typing: typingState,
      },
    });
  } catch (error) {
    console.error(
      "SEND TYPING STATUS ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to update typing status.",
      error: error.message,
    });
  }
};

/* ==========================================================
   MARK MESSAGE AS READ
   PATCH /api/conversations/messages/:messageId/read
========================================================== */

export const markMessageRead = async (
  req,
  res
) => {
  try {
    const { messageId } =
      req.params;

    /* ------------------------------------------------------
       Find message
    ------------------------------------------------------ */

    const message =
      await Message.findById(
        messageId
      );

    if (!message) {
      return res.status(404).json({
        success: false,
        message: "Message not found.",
      });
    }

    /* ------------------------------------------------------
       Already read
    ------------------------------------------------------ */

    if (message.read) {
      return res.status(200).json({
        success: true,

        message,

        data: message,
      });
    }

    /* ------------------------------------------------------
       Update message
    ------------------------------------------------------ */

    message.read = true;

    message.status = "read";

    message.readAt = new Date();

    await message.save();

    /* ------------------------------------------------------
       Update conversation unread count
    ------------------------------------------------------ */

    const conversation =
      await Conversation.findById(
        message.conversationId
      );

    if (conversation) {
      const unreadCount =
        await Message.countDocuments({
          conversationId:
            message.conversationId,

          read: false,

          deleted: {
            $ne: true,
          },
        });

      conversation.unreadCount =
        unreadCount;

      conversation.lastReadAt =
        new Date();

      await conversation.save();
    }

    /* ------------------------------------------------------
       Socket.io
    ------------------------------------------------------ */

    req.io
      ?.to(
        message.conversationId.toString()
      )
      .emit("message_read", {
        conversationId:
          message.conversationId,

        messageId:
          message._id,

        readAt:
          message.readAt,
      });

    return res.status(200).json({
      success: true,

      message,

      data: message,
    });
  } catch (error) {
    console.error(
      "MARK MESSAGE READ ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to mark message as read.",
      error: error.message,
    });
  }
};

/* ==========================================================
   DELETE MESSAGE
   DELETE /api/conversations/messages/:messageId
========================================================== */

export const deleteMessage = async (
  req,
  res
) => {
  try {
    const { messageId } =
      req.params;

    /* ------------------------------------------------------
       Find message
    ------------------------------------------------------ */

    const message =
      await Message.findById(
        messageId
      );

    if (!message) {
      return res.status(404).json({
        success: false,
        message: "Message not found.",
      });
    }

    /* ------------------------------------------------------
       Authorization
    ------------------------------------------------------ */

    if (
      message.senderId &&
      message.senderId.toString() !==
        req.user.id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message:
          "You can only delete your own messages.",
      });
    }

    /* ------------------------------------------------------
       Soft delete
    ------------------------------------------------------ */

    message.deleted = true;

    message.deletedAt = new Date();

    message.deletedBy =
      req.user.id;

    message.text = "";

    message.attachments = [];

    message.voiceNote = null;

    await message.save();

    /* ------------------------------------------------------
       Update conversation preview
    ------------------------------------------------------ */

    const conversation =
      await Conversation.findById(
        message.conversationId
      );

    if (conversation) {
      const latestMessage =
        await Message.findOne({
          conversationId:
            message.conversationId,

          deleted: {
            $ne: true,
          },
        }).sort({
          createdAt: -1,
        });

      if (latestMessage) {
        conversation.lastMessage = {
          text:
            latestMessage.text ||
            (latestMessage.voiceNote
              ? "🎤 Voice Note"
              : latestMessage.attachments?.length
              ? "📎 Attachment"
              : ""),

          senderId:
            latestMessage.senderId,

          senderRole:
            latestMessage.senderRole,

          createdAt:
            latestMessage.createdAt,
        };
      } else {
        conversation.lastMessage =
          null;
      }

      conversation.updatedAt =
        new Date();

      await conversation.save();
    }

    /* ------------------------------------------------------
       Socket.io
    ------------------------------------------------------ */

    req.io
      ?.to(
        message.conversationId.toString()
      )
      .emit("message_deleted", {
        conversationId:
          message.conversationId,

        messageId:
          message._id,
      });

    return res.status(200).json({
      success: true,

      message:
        "Message deleted successfully.",

      deletedMessage: message,
    });
  } catch (error) {
    console.error(
      "DELETE MESSAGE ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to delete message.",
      error: error.message,
    });
  }
};

/* ==========================================================
   UPLOAD VOICE MESSAGE
   POST /api/conversations/:id/voice
========================================================== */

export const uploadVoiceMessage = async (
  req,
  res
) => {
  try {
    const {
      id: conversationId,
    } = req.params;

    /* ------------------------------------------------------
       Verify conversation
    ------------------------------------------------------ */

    const conversation =
      await Conversation.findById(
        conversationId
      );

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found.",
      });
    }

    /* ------------------------------------------------------
       Verify uploaded file
    ------------------------------------------------------ */

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Voice note file is required.",
      });
    }

    /* ------------------------------------------------------
       Voice note data
    ------------------------------------------------------ */

    const voiceNote = {
      filename:
        req.file.originalname,

      url:
        req.file.path,

      duration:
        Number(req.body.duration) || 0,

      size:
        req.file.size,

      mimeType:
        req.file.mimetype,
    };

    /* ------------------------------------------------------
       Create message
    ------------------------------------------------------ */

    const message =
      await Message.create({
        conversationId,

        senderId:
          req.user.id,

        senderRole:
          req.user.role,

        text: "",

        attachments: [],

        voiceNote,

        delivered: true,

        read: false,

        status: "sent",

        deliveredAt:
          new Date(),
      });

    /* ------------------------------------------------------
       Update conversation
    ------------------------------------------------------ */

    conversation.lastMessage = {
      text: "🎤 Voice Note",

      senderId:
        req.user.id,

      senderRole:
        req.user.role,

      createdAt:
        message.createdAt,
    };

    conversation.updatedAt =
      new Date();

    conversation.lastUpdated =
      new Date();

    conversation.unreadCount =
      (conversation.unreadCount || 0) + 1;

    await conversation.save();

    /* ------------------------------------------------------
       Socket.io
    ------------------------------------------------------ */

    req.io
      ?.to(
        conversationId.toString()
      )
      .emit(
        "voice_message_received",
        message
      );

    return res.status(201).json({
      success: true,

      message,

      data: message,
    });
  } catch (error) {
    console.error(
      "UPLOAD VOICE MESSAGE ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Voice note upload failed.",
      error: error.message,
    });
  }
};

/* ==========================================================
   DEFAULT EXPORT
========================================================== */

export default {
  getConversationMessages,

  sendMessage,

  editMessage,

  deleteMessage,

  markMessageRead,

  getTypingStatus,

  sendTypingStatus,

  uploadVoiceMessage,
};

