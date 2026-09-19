/**
 * ==========================================================
 *
 * Handles
 * ----------------------------------------------------------
 * ✓ Upload attachments
 * ✓ Download attachments
 * ✓ Delete attachments
 * ✓ Retrieve conversation attachments
 * ✓ Validate file uploads
 * ✓ Prepare Socket.io notifications
 *
 * Backend Routes
 * ----------------------------------------------------------
 * GET    /api/conversations/:id/attachments
 * POST   /api/conversations/:id/attachments
 * DELETE /api/attachments/:id
 *
 * ==========================================================
 */

import fs from "fs";
import path from "path";

import Message from "../models/message.js";
import Conversation from "../models/conversation.js";

/* ==========================================================
   ALLOWED FILE TYPES
========================================================== */

const ALLOWED_FILE_TYPES = [

  "image/jpeg",
  "image/png",
  "image/webp",

  "application/pdf",

  "application/msword",

  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",

  "application/vnd.ms-excel",

  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",

];

/* ==========================================================
   MAX FILE SIZE
========================================================== */

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

/* ==========================================================
   GET CONVERSATION ATTACHMENTS
========================================================== */

export const getConversationAttachments = async (req, res) => {

  try {

    const conversationId = req.params.id;

    const conversation =
      await Conversation.findById(conversationId);

    if (!conversation) {

      return res.status(404).json({

        success: false,

        message: "Conversation not found.",

      });

    }

    const messages =
      await Message.find({

        conversationId,

        deleted: {

          $ne: true,

        },

        "attachments.0": {

          $exists: true,

        },

      })

      .select(

        "attachments senderId senderRole createdAt"

      )

      .sort({

        createdAt: -1,

      })

      .lean();

    return res.status(200).json({

      success: true,

      attachments: messages,

      total: messages.length,

    });

  }

  catch (error) {

    console.error(

      "Error loading attachments:",

      error

    );

    return res.status(500).json({

      success: false,

      message: "Failed to load attachments.",

      error: error.message,

    });

  }

};

/* ==========================================================
   UPLOAD ATTACHMENT
========================================================== */

export const uploadAttachment = async (req, res) => {

  try {

    const conversationId = req.params.id;

    /* ------------------------------------------------------
       Validate Conversation
    ------------------------------------------------------ */

    const conversation =
      await Conversation.findById(conversationId);

    if (!conversation) {

      return res.status(404).json({

        success: false,

        message: "Conversation not found.",

      });

    }

    /* ------------------------------------------------------
       Validate Uploaded File
    ------------------------------------------------------ */

    if (!req.file) {

      return res.status(400).json({

        success: false,

        message: "No attachment uploaded.",

      });

    }

    /* ------------------------------------------------------
       Validate File Type
    ------------------------------------------------------ */

    if (

      !ALLOWED_FILE_TYPES.includes(

        req.file.mimetype

      )

    ) {

      return res.status(400).json({

        success: false,

        message: "Unsupported file type.",

      });

    }

    /* ------------------------------------------------------
       Validate File Size
    ------------------------------------------------------ */

    if (

      req.file.size >

      MAX_FILE_SIZE

    ) {

      return res.status(400).json({

        success: false,

        message: "File exceeds 10MB limit.",

      });

    }

    /* ------------------------------------------------------
       Attachment Metadata
    ------------------------------------------------------ */

    const attachment = {

      filename: req.file.originalname,

      storedFilename: req.file.filename,

      url: req.file.path,

      mimeType: req.file.mimetype,

      size: req.file.size,

      extension: path.extname(

        req.file.originalname

      ),

    };

    /* ------------------------------------------------------
       Create Message
    ------------------------------------------------------ */

    const message = await Message.create({

      conversationId,

      senderId: req.user.id,

      senderRole: req.user.role,

      text: "",

      attachments: [attachment],

      voiceNote: null,

      delivered: true,

      read: false,

      status: "sent",

      deliveredAt: new Date(),

    });

    /* ------------------------------------------------------
       Update Parent Conversation
    ------------------------------------------------------ */

    conversation.lastMessage = {

      text: "📎 Attachment",

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
       Socket Event
    ------------------------------------------------------ */

    /*
    req.io
      ?.to(conversationId)
      .emit(
        "attachment_uploaded",
        message
      );
    */

    /* ------------------------------------------------------
       Response
    ------------------------------------------------------ */

    return res.status(201).json({

      success: true,

      attachment,

      message,

    });

  }

  catch (error) {

    console.error(

      "Attachment upload failed:",

      error

    );

    return res.status(500).json({

      success: false,

      message:

        "Failed to upload attachment.",

      error: error.message,

    });

  }

};

/* ==========================================================
   DOWNLOAD ATTACHMENT
========================================================== */

export const downloadAttachment = async (req, res) => {

  try {

    const { id: attachmentId } = req.params;

    /* ------------------------------------------------------
       Find Message containing attachment
    ------------------------------------------------------ */

    const message = await Message.findOne({

      "attachments._id": attachmentId,

      deleted: {

        $ne: true,

      },

    });

    if (!message) {

      return res.status(404).json({

        success: false,

        message: "Attachment not found.",

      });

    }

    /* ------------------------------------------------------
       Locate Attachment
    ------------------------------------------------------ */

    const attachment = message.attachments.find(

      item =>

        item._id.toString() === attachmentId

    );

    if (!attachment) {

      return res.status(404).json({

        success: false,

        message: "Attachment not found.",

      });

    }

    /* ------------------------------------------------------
       Resolve Physical File
    ------------------------------------------------------ */

    const filePath = path.resolve(

      attachment.url

    );

    if (!fs.existsSync(filePath)) {

      return res.status(404).json({

        success: false,

        message: "Stored file no longer exists.",

      });

    }

    /* ------------------------------------------------------
       Download Headers
    ------------------------------------------------------ */

    res.setHeader(

      "Content-Type",

      attachment.mimeType

    );

    res.setHeader(

      "Content-Disposition",

      `attachment; filename="${attachment.filename}"`

    );

    /* ------------------------------------------------------
       Stream File
    ------------------------------------------------------ */

    const stream = fs.createReadStream(

      filePath

    );

    stream.on(

      "error",

      (error) => {

        console.error(

          "File stream error:",

          error

        );

        if (!res.headersSent) {

          return res.status(500).json({

            success: false,

            message:

              "Unable to download attachment.",

          });

        }

      }

    );

    stream.pipe(res);

  }

  catch (error) {

    console.error(

      "Attachment download failed:",

      error

    );

    return res.status(500).json({

      success: false,

      message:

        "Failed to download attachment.",

      error: error.message,

    });

  }

};

/* ==========================================================
   DELETE ATTACHMENT
========================================================== */

export const deleteAttachment = async (req, res) => {

  try {

    const { id: attachmentId } = req.params;

    /* ------------------------------------------------------
       Find Message
    ------------------------------------------------------ */

    const message = await Message.findOne({

      "attachments._id": attachmentId,

      deleted: {

        $ne: true,

      },

    });

    if (!message) {

      return res.status(404).json({

        success: false,

        message: "Attachment not found.",

      });

    }

    /* ------------------------------------------------------
       Locate Attachment
    ------------------------------------------------------ */

    const attachment = message.attachments.find(

      item =>

        item._id.toString() === attachmentId

    );

    if (!attachment) {

      return res.status(404).json({

        success: false,

        message: "Attachment not found.",

      });

    }

    /* ------------------------------------------------------
       Delete Physical File
    ------------------------------------------------------ */

    try {

      const filePath = path.resolve(

        attachment.url

      );

      if (

        fs.existsSync(filePath)

      ) {

        fs.unlinkSync(filePath);

      }

    }

    catch (fileError) {

      console.warn(

        "Unable to remove physical attachment:",

        fileError.message

      );

    }

    /* ------------------------------------------------------
       Remove Attachment Metadata
    ------------------------------------------------------ */

    message.attachments =

      message.attachments.filter(

        item =>

          item._id.toString() !== attachmentId

      );

    await message.save();

    /* ------------------------------------------------------
       Update Conversation Preview
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

        })

        .sort({

          createdAt: -1,

        });

      if (latestMessage) {

        conversation.lastMessage = {

          text:

            latestMessage.text ||

            (

              latestMessage.voiceNote

                ? "🎤 Voice Note"

                : latestMessage.attachments.length

                ? "📎 Attachment"

                : ""

            ),

          senderId:

            latestMessage.senderId,

          senderRole:

            latestMessage.senderRole,

          createdAt:

            latestMessage.createdAt,

        };

      }

      else {

        conversation.lastMessage = null;

      }

      conversation.updatedAt =

        new Date();

      conversation.lastUpdated =

        new Date();

      await conversation.save();

    }

    /* ------------------------------------------------------
       Socket.io
    ------------------------------------------------------ */

    /*
    req.io
      ?.to(message.conversationId.toString())
      .emit(
        "attachment_deleted",
        {

          conversationId:

            message.conversationId,

          attachmentId,

          messageId:

            message._id,

        }
      );
    */

    /* ------------------------------------------------------
       Response
    ------------------------------------------------------ */

    return res.status(200).json({

      success: true,

      message:

        "Attachment deleted successfully.",

    });

  }

  catch (error) {

    console.error(

      "Attachment deletion failed:",

      error

    );

    return res.status(500).json({

      success: false,

      message:

        "Failed to delete attachment.",

      error:

        error.message,

    });

  }

};

/* ==========================================================
   GET SINGLE ATTACHMENT METADATA
========================================================== */

export const getAttachmentMetadata = async (req, res) => {

  try {

    const { id: attachmentId } = req.params;

    const message = await Message.findOne({

      "attachments._id": attachmentId,

      deleted: {

        $ne: true,

      },

    }).lean();

    if (!message) {

      return res.status(404).json({

        success: false,

        message: "Attachment not found.",

      });

    }

    const attachment = message.attachments.find(

      item =>

        item._id.toString() === attachmentId

    );

    if (!attachment) {

      return res.status(404).json({

        success: false,

        message: "Attachment not found.",

      });

    }

    return res.status(200).json({

      success: true,

      attachment,

      messageId: message._id,

      conversationId: message.conversationId,

    });

  }

  catch (error) {

    console.error(

      "Attachment lookup failed:",

      error

    );

    return res.status(500).json({

      success: false,

      message:

        "Failed to retrieve attachment.",

      error: error.message,

    });

  }

};

/* ==========================================================
   DEFAULT EXPORT
========================================================== */

export default {

  getConversationAttachments,

  getAttachmentMetadata,

  uploadAttachment,

  downloadAttachment,

  deleteAttachment,

};