/**
 * ==========================================================
 *
 * VIEWER CONVERSATION CONTROLLER
 * LeadFlow AI
 *
 * ==========================================================
 *
 * Viewer/customer-facing conversation operations.
 *
 * Endpoints:
 *
 * GET
 * /api/conversations/viewer
 *
 * GET
 * /api/conversations/:id/messages
 *
 * POST
 * /api/conversations/:id/messages
 *
 * ==========================================================
 */

import Conversation from "../models/conversation.js";
import Message from "../models/message.js";

/* ==========================================================
   GET USER ID
========================================================== */

const getUserId = (
  req
) => {
  return (
    req.user?._id ||
    req.user?.id ||
    null
  );
};

/* ==========================================================
   GET VIEWER CONVERSATIONS
========================================================== */

export const getViewerConversations =
  async (
    req,
    res
  ) => {
    try {
      const organizationId =
        req.user?.organizationId;

      const userId =
        getUserId(
          req
        );

      if (
        !organizationId
      ) {
        return res
          .status(403)
          .json({
            success: false,

            message:
              "Organization not assigned.",
          });
      }

      if (
        !userId
      ) {
        return res
          .status(401)
          .json({
            success: false,

            message:
              "Authenticated user could not be identified.",
          });
      }

      const {
        page = 1,
        limit = 20,
      } = req.query;

      const safePage =
        Math.max(
          Number(
            page
          ) || 1,
          1
        );

      const safeLimit =
        Math.min(
          Math.max(
            Number(
              limit
            ) || 20,
            1
          ),
          100
        );

      const userEmail =
        String(
          req.user?.email ||
            ""
        )
          .trim()
          .toLowerCase();

      const userPhone =
        String(
          req.user?.phone ||
            ""
        ).trim();

      const ownershipConditions =
        [
          {
            "participants.userId":
              userId,
          },
        ];

      if (
        userEmail
      ) {
        ownershipConditions.push(
          {
            email:
              userEmail,
          }
        );
      }

      if (
        userPhone
      ) {
        ownershipConditions.push(
          {
            phone:
              userPhone,
          }
        );
      }

      const query = {
        organizationId,

        $or:
          ownershipConditions,
      };

      const skip =
        (
          safePage -
          1
        ) *
        safeLimit;

      const [
        conversations,
        total,
      ] =
        await Promise.all([
          Conversation.find(
            query
          )
            .sort({
              pinned: -1,

              lastUpdated:
                -1,

              updatedAt:
                -1,

              createdAt:
                -1,
            })
            .skip(
              skip
            )
            .limit(
              safeLimit
            )
            .lean(),

          Conversation.countDocuments(
            query
          ),
        ]);

      console.log(
        "👤 VIEWER CONVERSATIONS:",
        {
          userId:
            String(
              userId
            ),

          organizationId:
            String(
              organizationId
            ),

          total,
        }
      );

      return res
        .status(200)
        .json({
          success: true,

          data:
            conversations,

          conversations,

          page:
            safePage,

          limit:
            safeLimit,

          total,

          hasMore:
            safePage *
              safeLimit <
            total,
        });
    } catch (error) {
      console.error(
        "GET VIEWER CONVERSATIONS ERROR:",
        error
      );

      return res
        .status(500)
        .json({
          success: false,

          message:
            "Failed to fetch viewer conversations.",

          error:
            error.message,
        });
    }
  };

/* ==========================================================
   SEND VIEWER MESSAGE
========================================================== */

export const sendViewerMessage =
  async (
    req,
    res
  ) => {
    try {
      const conversation =
        req.conversation;

      const userId =
        getUserId(
          req
        );

      if (
        !conversation
      ) {
        return res
          .status(404)
          .json({
            success: false,

            message:
              "Conversation not found.",
          });
      }

      if (
        !userId
      ) {
        return res
          .status(401)
          .json({
            success: false,

            message:
              "Authenticated user could not be identified.",
          });
      }

      const text =
        String(
          req.body?.message ??
            req.body?.text ??
            req.body?.content ??
            ""
        ).trim();

      if (
        !text
      ) {
        return res
          .status(400)
          .json({
            success: false,

            message:
              "Message text is required.",
          });
      }

      /* ------------------------------------------------------
         CREATE MESSAGE
      ------------------------------------------------------ */

      const message =
        await Message.create({
          organizationId:
            conversation.organizationId,

          conversationId:
            conversation._id,

          leadId:
            conversation.leadId ||
            null,

          senderId:
            userId,

          /*
           * Message schema uses customer,
           * not viewer.
           */
          senderRole:
            "customer",

          senderName:
            req.user?.name ||
            conversation.customerName ||
            "Customer",

          text,

          status:
            "sent",

          aiGenerated:
            false,
        });

      /* ------------------------------------------------------
         UPDATE CONVERSATION
      ------------------------------------------------------ */

      conversation.messageCount =
        Number(
          conversation.messageCount ||
            0
        ) + 1;

      conversation.unreadCount =
        Number(
          conversation.unreadCount ||
            0
        ) + 1;

      conversation.lastMessage =
        {
          text,

          senderId:
            userId,

          senderRole:
            "customer",

          createdAt:
            message.createdAt,
        };

      conversation.lastUpdated =
        new Date();

      conversation.updatedAt =
        new Date();

      await conversation.save();

      /* ------------------------------------------------------
         SOCKET EVENT
      ------------------------------------------------------ */

      req.io
        ?.to(
          String(
            conversation._id
          )
        )
        .emit(
          "message_created",
          message
        );

      console.log(
        "💬 VIEWER MESSAGE CREATED:",
        String(
          message._id
        )
      );

      return res
        .status(201)
        .json({
          success: true,

          message:
            "Message sent successfully.",

          data:
            message,
        });
    } catch (error) {
      console.error(
        "SEND VIEWER MESSAGE ERROR:",
        error
      );

      return res
        .status(500)
        .json({
          success: false,

          message:
            "Failed to send message.",

          error:
            error.message,
        });
    }
  };

export default {
  getViewerConversations,

  sendViewerMessage,
};