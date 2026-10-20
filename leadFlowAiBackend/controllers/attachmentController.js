/**
 * ==========================================================
 *
 * ATTACHMENT CONTROLLER
 * LeadFlow AI
 *
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
 * ORGANIZATION ISOLATION
 * ----------------------------------------------------------
 * Every conversation and attachment operation is scoped to
 * the authenticated user's organization.
 *
 * Organization resolution is centralized through:
 *
 * services/organizationResolverService.js
 *
 * The controller does NOT accept organizationId from:
 *
 * req.body
 * req.params
 * req.query
 *
 * ==========================================================
 */

import fs from "fs";
import path from "path";

import Message from "../models/message.js";
import Conversation from "../models/conversation.js";

import {
  resolveFromRequest,
} from "../services/organizationResolverService.js";

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

const MAX_FILE_SIZE =
  10 * 1024 * 1024; // 10MB


/* ==========================================================
   ORGANIZATION HELPER
========================================================== */

/**
 * Resolve the authenticated organization through the
 * centralized organization resolver.
 *
 * IMPORTANT
 * ----------------------------------------------------------
 * We do NOT use:
 *
 * req.body.organizationId
 * req.params.organizationId
 * req.query.organizationId
 *
 * The resolver uses trusted authenticated context.
 */

const getAuthenticatedOrganization =
  async (
    req
  ) => {

    return await resolveFromRequest(
      req
    );
  };


/* ==========================================================
   GET CONVERSATION ATTACHMENTS
========================================================== */

/**
 * GET
 * /api/conversations/:id/attachments
 *
 * Returns attachments belonging to a conversation that
 * belongs to the authenticated organization.
 */

export const getConversationAttachments =
  async (
    req,
    res
  ) => {

    try {

      const conversationId =
        req.params.id;


      /* ------------------------------------------------------
         RESOLVE ORGANIZATION
      ------------------------------------------------------ */

      const organization =
        await getAuthenticatedOrganization(
          req
        );


      if (
        !organization
      ) {

        return res.status(403).json({

          success: false,

          message:
            "Unauthorized organization access.",

        });

      }


      const organizationId =
        organization._id;


      /* ------------------------------------------------------
         VALIDATE CONVERSATION
      ------------------------------------------------------ */

      const conversation =
        await Conversation.findOne({

          _id:
            conversationId,

          organizationId,

        });


      if (
        !conversation
      ) {

        return res.status(404).json({

          success: false,

          message:
            "Conversation not found.",

        });

      }


      /* ------------------------------------------------------
         LOAD ATTACHMENT MESSAGES
      ------------------------------------------------------ */

      const messages =
        await Message.find({

          conversationId,

          organizationId,

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

        attachments:
          messages,

        total:
          messages.length,

      });

    }

    catch (
      error
    ) {

      console.error(

        "Error loading attachments:",

        error

      );

      return res.status(500).json({

        success: false,

        message:
          "Failed to load attachments.",

        error:
          error.message,

      });

    }

  };


/* ==========================================================
   UPLOAD ATTACHMENT
========================================================== */

/**
 * POST
 * /api/conversations/:id/attachments
 *
 * Uploads an attachment to an organization-owned
 * conversation.
 */

export const uploadAttachment =
  async (
    req,
    res
  ) => {

    try {

      const conversationId =
        req.params.id;


      /* ------------------------------------------------------
         RESOLVE ORGANIZATION
      ------------------------------------------------------ */

      const organization =
        await getAuthenticatedOrganization(
          req
        );


      if (
        !organization
      ) {

        return res.status(403).json({

          success: false,

          message:
            "Unauthorized organization access.",

        });

      }


      const organizationId =
        organization._id;


      /* ------------------------------------------------------
         VALIDATE CONVERSATION
      ------------------------------------------------------ */

      const conversation =
        await Conversation.findOne({

          _id:
            conversationId,

          organizationId,

        });


      if (
        !conversation
      ) {

        return res.status(404).json({

          success: false,

          message:
            "Conversation not found.",

        });

      }


      /* ------------------------------------------------------
         VALIDATE UPLOADED FILE
      ------------------------------------------------------ */

      if (
        !req.file
      ) {

        return res.status(400).json({

          success: false,

          message:
            "No attachment uploaded.",

        });

      }


      /* ------------------------------------------------------
         VALIDATE FILE TYPE
      ------------------------------------------------------ */

      if (

        !ALLOWED_FILE_TYPES.includes(

          req.file.mimetype

        )

      ) {

        return res.status(400).json({

          success: false,

          message:
            "Unsupported file type.",

        });

      }


      /* ------------------------------------------------------
         VALIDATE FILE SIZE
      ------------------------------------------------------ */

      if (

        req.file.size >

        MAX_FILE_SIZE

      ) {

        return res.status(400).json({

          success: false,

          message:
            "File exceeds 10MB limit.",

        });

      }


      /* ------------------------------------------------------
         ATTACHMENT METADATA
      ------------------------------------------------------ */

      const attachment = {

        filename:
          req.file.originalname,

        storedFilename:
          req.file.filename,

        url:
          req.file.path,

        mimeType:
          req.file.mimetype,

        size:
          req.file.size,

        extension:
          path.extname(

            req.file.originalname

          ),

      };


      /* ------------------------------------------------------
         CREATE MESSAGE
      ------------------------------------------------------ */

      const message =
        await Message.create({

          organizationId,

          conversationId,

          senderId:
            req.user.id,

          senderRole:
            req.user.role,

          text:
            "",

          attachments: [
            attachment,
          ],

          voiceNote:
            null,

          delivered:
            true,

          read:
            false,

          status:
            "sent",

          deliveredAt:
            new Date(),

        });


      /* ------------------------------------------------------
         UPDATE PARENT CONVERSATION
      ------------------------------------------------------ */

      conversation.lastMessage = {

        text:
          "📎 Attachment",

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
        (conversation.unreadCount || 0) +
        1;


      await conversation.save();


      /* ------------------------------------------------------
         SOCKET EVENT
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
         RESPONSE
      ------------------------------------------------------ */

      return res.status(201).json({

        success: true,

        attachment,

        message,

      });

    }

    catch (
      error
    ) {

      console.error(

        "Attachment upload failed:",

        error

      );

      return res.status(500).json({

        success: false,

        message:

          "Failed to upload attachment.",

        error:
          error.message,

      });

    }

  };


/* ==========================================================
   DOWNLOAD ATTACHMENT
========================================================== */

/**
 * GET
 * Download attachment by attachment ID.
 *
 * The attachment's parent Message must belong to the
 * authenticated organization.
 */

export const downloadAttachment =
  async (
    req,
    res
  ) => {

    try {

      const {
        id: attachmentId
      } = req.params;


      /* ------------------------------------------------------
         RESOLVE ORGANIZATION
      ------------------------------------------------------ */

      const organization =
        await getAuthenticatedOrganization(
          req
        );


      if (
        !organization
      ) {

        return res.status(403).json({

          success: false,

          message:
            "Unauthorized organization access.",

        });

      }


      const organizationId =
        organization._id;


      /* ------------------------------------------------------
         FIND MESSAGE CONTAINING ATTACHMENT
      ------------------------------------------------------ */

      const message =
        await Message.findOne({

          organizationId,

          "attachments._id":
            attachmentId,

          deleted: {

            $ne: true,

          },

        });


      if (
        !message
      ) {

        return res.status(404).json({

          success: false,

          message:
            "Attachment not found.",

        });

      }


      /* ------------------------------------------------------
         LOCATE ATTACHMENT
      ------------------------------------------------------ */

      const attachment =
        message.attachments.find(

          (
            item
          ) =>

            item._id.toString() ===
            attachmentId

        );


      if (
        !attachment
      ) {

        return res.status(404).json({

          success: false,

          message:
            "Attachment not found.",

        });

      }


      /* ------------------------------------------------------
         RESOLVE PHYSICAL FILE
      ------------------------------------------------------ */

      const filePath =
        path.resolve(

          attachment.url

        );


      if (
        !fs.existsSync(
          filePath
        )
      ) {

        return res.status(404).json({

          success: false,

          message:
            "Stored file no longer exists.",

        });

      }


      /* ------------------------------------------------------
         DOWNLOAD HEADERS
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
         STREAM FILE
      ------------------------------------------------------ */

      const stream =
        fs.createReadStream(

          filePath

        );


      stream.on(

        "error",

        (
          error
        ) => {

          console.error(

            "File stream error:",

            error

          );

          if (
            !res.headersSent
          ) {

            return res.status(500).json({

              success: false,

              message:

                "Unable to download attachment.",

            });

          }

        }

      );


      stream.pipe(
        res
      );

    }

    catch (
      error
    ) {

      console.error(

        "Attachment download failed:",

        error

      );

      return res.status(500).json({

        success: false,

        message:

          "Failed to download attachment.",

        error:
          error.message,

      });

    }

  };


/* ==========================================================
   DELETE ATTACHMENT
========================================================== */

/**
 * DELETE
 * /api/attachments/:id
 *
 * Deletes an attachment belonging to the authenticated
 * organization.
 */

export const deleteAttachment =
  async (
    req,
    res
  ) => {

    try {

      const {
        id: attachmentId
      } = req.params;


      /* ------------------------------------------------------
         RESOLVE ORGANIZATION
      ------------------------------------------------------ */

      const organization =
        await getAuthenticatedOrganization(
          req
        );


      if (
        !organization
      ) {

        return res.status(403).json({

          success: false,

          message:
            "Unauthorized organization access.",

        });

      }


      const organizationId =
        organization._id;


      /* ------------------------------------------------------
         FIND MESSAGE
      ------------------------------------------------------ */

      const message =
        await Message.findOne({

          organizationId,

          "attachments._id":
            attachmentId,

          deleted: {

            $ne: true,

          },

        });


      if (
        !message
      ) {

        return res.status(404).json({

          success: false,

          message:
            "Attachment not found.",

        });

      }


      /* ------------------------------------------------------
         LOCATE ATTACHMENT
      ------------------------------------------------------ */

      const attachment =
        message.attachments.find(

          (
            item
          ) =>

            item._id.toString() ===
            attachmentId

        );


      if (
        !attachment
      ) {

        return res.status(404).json({

          success: false,

          message:
            "Attachment not found.",

        });

      }


      /* ------------------------------------------------------
         DELETE PHYSICAL FILE
      ------------------------------------------------------ */

      try {

        const filePath =
          path.resolve(

            attachment.url

          );


        if (

          fs.existsSync(
            filePath
          )

        ) {

          fs.unlinkSync(
            filePath
          );

        }

      }

      catch (
        fileError
      ) {

        console.warn(

          "Unable to remove physical attachment:",

          fileError.message

        );

      }


      /* ------------------------------------------------------
         REMOVE ATTACHMENT METADATA
      ------------------------------------------------------ */

      message.attachments =

        message.attachments.filter(

          (
            item
          ) =>

            item._id.toString() !==
            attachmentId

        );


      await message.save();


      /* ------------------------------------------------------
         UPDATE CONVERSATION PREVIEW
      ------------------------------------------------------ */

      const conversation =
        await Conversation.findOne({

          _id:
            message.conversationId,

          organizationId,

        });


      if (
        conversation
      ) {

        const latestMessage =
          await Message.findOne({

            conversationId:
              message.conversationId,

            organizationId,

            deleted: {

              $ne: true,

            },

          })

            .sort({

              createdAt: -1,

            });


        if (
          latestMessage
        ) {

          conversation.lastMessage = {

            text:

              latestMessage.text ||

              (

                latestMessage.voiceNote

                  ? "🎤 Voice Note"

                  : latestMessage.attachments?.length

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

          conversation.lastMessage =
            null;

        }


        conversation.updatedAt =
          new Date();

        conversation.lastUpdated =
          new Date();


        await conversation.save();

      }


      /* ------------------------------------------------------
         SOCKET.IO
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
         RESPONSE
      ------------------------------------------------------ */

      return res.status(200).json({

        success: true,

        message:

          "Attachment deleted successfully.",

      });

    }

    catch (
      error
    ) {

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

/**
 * GET attachment metadata by attachment ID.
 *
 * The parent message must belong to the authenticated
 * organization.
 */

export const getAttachmentMetadata =
  async (
    req,
    res
  ) => {

    try {

      const {
        id: attachmentId
      } = req.params;


      /* ------------------------------------------------------
         RESOLVE ORGANIZATION
      ------------------------------------------------------ */

      const organization =
        await getAuthenticatedOrganization(
          req
        );


      if (
        !organization
      ) {

        return res.status(403).json({

          success: false,

          message:
            "Unauthorized organization access.",

        });

      }


      const organizationId =
        organization._id;


      /* ------------------------------------------------------
         FIND MESSAGE
      ------------------------------------------------------ */

      const message =
        await Message.findOne({

          organizationId,

          "attachments._id":
            attachmentId,

          deleted: {

            $ne: true,

          },

        })
          .lean();


      if (
        !message
      ) {

        return res.status(404).json({

          success: false,

          message:
            "Attachment not found.",

        });

      }


      /* ------------------------------------------------------
         LOCATE ATTACHMENT
      ------------------------------------------------------ */

      const attachment =
        message.attachments.find(

          (
            item
          ) =>

            item._id.toString() ===
            attachmentId

        );


      if (
        !attachment
      ) {

        return res.status(404).json({

          success: false,

          message:
            "Attachment not found.",

        });

      }


      return res.status(200).json({

        success: true,

        attachment,

        messageId:
          message._id,

        conversationId:
          message.conversationId,

      });

    }

    catch (
      error
    ) {

      console.error(

        "Attachment lookup failed:",

        error

      );

      return res.status(500).json({

        success: false,

        message:

          "Failed to retrieve attachment.",

        error:
          error.message,

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