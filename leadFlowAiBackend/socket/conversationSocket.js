/**
 * ============================================================
 * socket/conversationSocket.js
 * ============================================================
 *
 * PURPOSE
 * ------------------------------------------------------------
 * Real-time communication hub for LeadFlow AI.
 *
 * Handles:
 *
 * ✓ Multi-tenancy
 * ✓ Conversation rooms
 * ✓ Organization rooms
 * ✓ Presence
 * ✓ Messaging
 * ✓ AI updates
 * ✓ Viewings
 * ✓ Notifications
 * ✓ Dashboard updates
 *
 * TENANT ISOLATION
 * ------------------------------------------------------------
 * Socket.IO has its own tenant boundary.
 *
 * REST authorization does NOT automatically protect socket rooms.
 *
 * Therefore:
 *
 * ✓ Users are verified against their organization
 * ✓ Conversation rooms are verified against organizationId
 * ✓ Organization broadcasts use the authenticated socket org
 * ✓ User/agent broadcasts cannot cross organizations
 * ✓ Conversation events require tenant ownership
 *
 * ============================================================
 */

import Conversation from "../models/conversation.js";
import User from "../models/user.js";

const onlineUsers = new Map();

/* ============================================================
   ROOM HELPERS
============================================================ */

const organizationRoom = (organizationId) =>
  `organization:${organizationId}`;

const conversationRoom = (conversationId) =>
  `conversation:${conversationId}`;

const userRoom = (userId) =>
  `user:${userId}`;

/* ============================================================
   TENANT HELPERS
============================================================ */

/**
 * ------------------------------------------------------------
 * GET SOCKET ORGANIZATION
 * ------------------------------------------------------------
 *
 * socket.data.organizationId becomes the trusted organization
 * context after register_user has successfully verified the user.
 *
 * Never trust organizationId supplied inside arbitrary event
 * payloads as the source of tenant authorization.
 */
const getSocketOrganizationId = (socket) =>
  socket.data?.organizationId || null;

/**
 * ------------------------------------------------------------
 * VERIFY CONVERSATION TENANT
 * ------------------------------------------------------------
 *
 * Ensures the conversation belongs to the organization attached
 * to the current socket.
 *
 * This is the critical protection preventing:
 *
 * Organization A
 *     ↓
 * conversationId belonging to Organization B
 *     ↓
 * joining / reading / broadcasting into B's room
 */
const getAuthorizedConversation = async (
  socket,
  conversationId
) => {
  if (!conversationId) {
    return null;
  }

  const organizationId =
    getSocketOrganizationId(socket);

  if (!organizationId) {
    console.warn(
      "🛑 Socket conversation access rejected: organization missing.",
      {
        socketId: socket.id,
        conversationId,
      }
    );

    return null;
  }

  try {
    const conversation =
      await Conversation.findOne({
        _id: conversationId,
        organizationId,
      });

    if (!conversation) {
      console.warn(
        "🛑 Socket conversation access rejected: tenant mismatch or conversation not found.",
        {
          socketId: socket.id,
          conversationId,
          organizationId,
        }
      );

      return null;
    }

    return conversation;
  } catch (error) {
    console.error(
      "❌ Socket conversation authorization error:",
      error
    );

    return null;
  }
};

/**
 * ------------------------------------------------------------
 * VERIFY ORGANIZATION PAYLOAD
 * ------------------------------------------------------------
 *
 * Payload organizationId values are NOT trusted.
 *
 * An event may only target the organization represented by the
 * authenticated socket.
 */
const isAuthorizedOrganization = (
  socket,
  organizationId
) => {
  const socketOrganizationId =
    getSocketOrganizationId(socket);

  if (
    !socketOrganizationId ||
    !organizationId
  ) {
    return false;
  }

  return (
    String(socketOrganizationId) ===
    String(organizationId)
  );
};

/**
 * ------------------------------------------------------------
 * VERIFY TARGET USER TENANT
 * ------------------------------------------------------------
 *
 * Prevents a socket from sending notification/assignment events
 * into another organization's user room.
 *
 * Only online users are relevant because user rooms are only
 * populated while their sockets are connected.
 */
const isAuthorizedTargetUser = (
  socket,
  userId
) => {
  if (!userId) {
    return false;
  }

  const organizationId =
    getSocketOrganizationId(socket);

  if (!organizationId) {
    return false;
  }

  const targetUser =
    onlineUsers.get(
      String(userId)
    );

  if (!targetUser) {
    return false;
  }

  return (
    String(targetUser.organizationId) ===
    String(organizationId)
  );
};

/* ============================================================
   BROADCAST HELPERS
============================================================ */

const emitToOrganization = (
  io,
  organizationId,
  event,
  payload
) => {
  io.to(
    organizationRoom(organizationId)
  ).emit(event, payload);
};

const emitToConversation = (
  io,
  conversationId,
  event,
  payload
) => {
  io.to(
    conversationRoom(conversationId)
  ).emit(event, payload);
};

const emitToUser = (
  io,
  userId,
  event,
  payload
) => {
  io.to(
    userRoom(userId)
  ).emit(event, payload);
};

/* ============================================================
   SOCKET REGISTRATION
============================================================ */

const registerConversationSocket = (
  io,
  socket
) => {
  console.log(
    `Conversation socket connected: ${socket.id}`
  );

  /* ========================================================
     REGISTER USER
  ======================================================== */

  socket.on(
    "register_user",
    async ({
      userId,
      organizationId,
      name,
      role,
    }) => {
      if (
        !userId ||
        !organizationId
      )
        return;

      try {
        /**
         * ----------------------------------------------------
         * VERIFY USER TENANT
         * ----------------------------------------------------
         *
         * Do NOT trust the organizationId supplied by the
         * client.
         *
         * Resolve the user from the database and verify that
         * the user actually belongs to that organization.
         */
        const user =
          await User.findOne({
            _id: userId,
            organizationId,
          }).select(
            "_id organizationId name role isActive"
          );

        if (!user) {
          console.warn(
            "🛑 Socket registration rejected: user does not belong to organization.",
            {
              socketId: socket.id,
              userId,
              organizationId,
            }
          );

          socket.emit(
            "socket_registration_rejected",
            {
              reason:
                "organization_mismatch",
            }
          );

          return;
        }

        if (
          user.isActive === false
        ) {
          console.warn(
            "🛑 Socket registration rejected: inactive user.",
            {
              socketId: socket.id,
              userId,
            }
          );

          socket.emit(
            "socket_registration_rejected",
            {
              reason:
                "inactive_user",
            }
          );

          return;
        }

        /**
         * ----------------------------------------------------
         * STORE VERIFIED TENANT CONTEXT
         * ----------------------------------------------------
         */
        socket.data.userId =
          String(user._id);

        socket.data.organizationId =
          String(user.organizationId);

        socket.data.name =
          user.name || name;

        socket.data.role =
          user.role || role;

        /**
         * ----------------------------------------------------
         * JOIN VERIFIED ORGANIZATION + USER ROOMS
         * ----------------------------------------------------
         */
        socket.join(
          organizationRoom(
            socket.data.organizationId
          )
        );

        socket.join(
          userRoom(
            socket.data.userId
          )
        );

        onlineUsers.set(
          socket.data.userId,
          {
            socketId:
              socket.id,
            organizationId:
              socket.data.organizationId,
            name:
              socket.data.name,
            role:
              socket.data.role,
            lastSeen:
              new Date(),
          }
        );

        emitToOrganization(
          io,
          socket.data.organizationId,
          "presence_update",
          {
            userId:
              socket.data.userId,
            name:
              socket.data.name,
            role:
              socket.data.role,
            status:
              "online",
          }
        );

        console.log(
          `${socket.data.name} registered`
        );
      } catch (error) {
        console.error(
          "❌ Socket registration error:",
          error
        );

        socket.emit(
          "socket_registration_rejected",
          {
            reason:
              "registration_failed",
          }
        );
      }
    }
  );

  /* ========================================================
     JOIN CONVERSATION
  ======================================================== */

  socket.on(
    "join_conversation",
    async ({
      conversationId,
    }) => {
      if (
        !conversationId
      )
        return;

      /**
       * ------------------------------------------------------
       * CRITICAL TENANT CHECK
       * ------------------------------------------------------
       *
       * A socket cannot join a conversation room simply by
       * knowing the conversationId.
       */
      const conversation =
        await getAuthorizedConversation(
          socket,
          conversationId
        );

      if (!conversation) {
        socket.emit(
          "conversation_access_denied",
          {
            conversationId,
          }
        );

        return;
      }

      socket.join(
        conversationRoom(
          conversationId
        )
      );

      console.log(
        `${socket.id} joined ${conversationId}`
      );
    }
  );

  /* ========================================================
     LEAVE CONVERSATION
  ======================================================== */

  socket.on(
    "leave_conversation",
    async ({
      conversationId,
    }) => {
      if (
        !conversationId
      )
        return;

      const conversation =
        await getAuthorizedConversation(
          socket,
          conversationId
        );

      if (!conversation) {
        return;
      }

      socket.leave(
        conversationRoom(
          conversationId
        )
      );

      console.log(
        `${socket.id} left ${conversationId}`
      );
    }
  );

  /* ========================================================
     SEND MESSAGE
  ======================================================== */

  socket.on(
    "message_send",
    async (message) => {
      if (
        !message?.conversationId
      )
        return;

      const conversation =
        await getAuthorizedConversation(
          socket,
          message.conversationId
        );

      if (!conversation) {
        return;
      }

      emitToConversation(
        io,
        message.conversationId,
        "message_received",
        {
          ...message,
          organizationId:
            socket.data.organizationId,
          deliveredAt:
            new Date().toISOString(),
        }
      );

      if (
        socket.data
          ?.organizationId
      ) {
        emitToOrganization(
          io,
          socket.data
            .organizationId,
          "conversation_updated",
          {
            conversationId:
              message.conversationId,
            lastMessage:
              message.text,
            updatedAt:
              new Date(),
          }
        );
      }
    }
  );

  /* ========================================================
     MESSAGE DELIVERED
  ======================================================== */

  socket.on(
    "message_delivered",
    async ({
      conversationId,
      messageId,
    }) => {
      if (
        !conversationId ||
        !messageId
      )
        return;

      const conversation =
        await getAuthorizedConversation(
          socket,
          conversationId
        );

      if (!conversation) {
        return;
      }

      emitToConversation(
        io,
        conversationId,
        "message_delivered",
        {
          messageId,
          deliveredAt:
            new Date().toISOString(),
        }
      );
    }
  );

  /* ========================================================
     MESSAGE READ
  ======================================================== */

  socket.on(
    "message_read",
    async ({
      conversationId,
      messageId,
      userId,
    }) => {
      if (
        !conversationId ||
        !messageId
      )
        return;

      const conversation =
        await getAuthorizedConversation(
          socket,
          conversationId
        );

      if (!conversation) {
        return;
      }

      emitToConversation(
        io,
        conversationId,
        "message_read",
        {
          conversationId,
          messageId,
          userId:
            socket.data.userId,
          readAt:
            new Date().toISOString(),
        }
      );
    }
  );

  /* ========================================================
     ENTIRE CONVERSATION READ
  ======================================================== */

  socket.on(
    "conversation_read",
    async ({
      conversationId,
      userId,
    }) => {
      if (
        !conversationId
      )
        return;

      const conversation =
        await getAuthorizedConversation(
          socket,
          conversationId
        );

      if (!conversation) {
        return;
      }

      emitToConversation(
        io,
        conversationId,
        "conversation_read",
        {
          conversationId,
          userId:
            socket.data.userId,
          readAt:
            new Date().toISOString(),
        }
      );
    }
  );

  /* ========================================================
     MESSAGE EDITED
  ======================================================== */

  socket.on(
    "message_edited",
    async (payload) => {
      if (
        !payload
          ?.conversationId
      )
        return;

      const conversation =
        await getAuthorizedConversation(
          socket,
          payload.conversationId
        );

      if (!conversation) {
        return;
      }

      emitToConversation(
        io,
        payload
          .conversationId,
        "message_edited",
        {
          ...payload,
          organizationId:
            socket.data.organizationId,
          editedAt:
            new Date().toISOString(),
        }
      );
    }
  );

  /* ========================================================
     MESSAGE DELETED
  ======================================================== */

  socket.on(
    "message_deleted",
    async ({
      conversationId,
      messageId,
    }) => {
      if (
        !conversationId
      )
        return;

      const conversation =
        await getAuthorizedConversation(
          socket,
          conversationId
        );

      if (!conversation) {
        return;
      }

      emitToConversation(
        io,
        conversationId,
        "message_deleted",
        {
          conversationId,
          messageId,
        }
      );
    }
  );

  /* ========================================================
     CONVERSATION UPDATED
  ======================================================== */

  socket.on(
    "conversation_updated",
    async (conversation) => {
      if (
        !conversation
          ?.conversationId
      )
        return;

      const authorizedConversation =
        await getAuthorizedConversation(
          socket,
          conversation.conversationId
        );

      if (!authorizedConversation) {
        return;
      }

      emitToConversation(
        io,
        conversation
          .conversationId,
        "conversation_updated",
        {
          ...conversation,
          organizationId:
            socket.data.organizationId,
        }
      );

      if (
        socket.data
          ?.organizationId
      ) {
        emitToOrganization(
          io,
          socket.data
            .organizationId,
          "conversation_list_refresh",
          {
            ...conversation,
            organizationId:
              socket.data.organizationId,
          }
        );
      }
    }
  );

  /* ========================================================
     TYPING START
  ======================================================== */

  socket.on(
    "typing_start",
    async (payload) => {
      if (
        !payload?.conversationId
      )
        return;

      const conversation =
        await getAuthorizedConversation(
          socket,
          payload.conversationId
        );

      if (!conversation) {
        return;
      }

      socket.to(
        conversationRoom(
          payload.conversationId
        )
      ).emit(
        "typing_start",
        {
          userId:
            socket.data.userId,
          userName:
            socket.data.name,
          conversationId:
            payload.conversationId,
          startedAt:
            new Date().toISOString(),
        }
      );
    }
  );

  /* ========================================================
     TYPING STOP
  ======================================================== */

  socket.on(
    "typing_stop",
    async (payload) => {
      if (
        !payload?.conversationId
      )
        return;

      const conversation =
        await getAuthorizedConversation(
          socket,
          payload.conversationId
        );

      if (!conversation) {
        return;
      }

      socket.to(
        conversationRoom(
          payload.conversationId
        )
      ).emit(
        "typing_stop",
        {
          userId:
            socket.data.userId,
          conversationId:
            payload.conversationId,
        }
      );
    }
  );

  /* ========================================================
     USER PRESENCE UPDATE
  ======================================================== */

  socket.on(
    "presence_ping",
    () => {
      if (
        !socket.data?.userId
      )
        return;

      const user =
        onlineUsers.get(
          socket.data.userId
        );

      if (user) {
        user.lastSeen =
          new Date();

        onlineUsers.set(
          socket.data.userId,
          user
        );
      }
    }
  );

  /* ========================================================
     VOICE MESSAGE READY
  ======================================================== */

  socket.on(
    "voice_message_uploaded",
    async (payload) => {
      if (
        !payload?.conversationId
      )
        return;

      const conversation =
        await getAuthorizedConversation(
          socket,
          payload.conversationId
        );

      if (!conversation) {
        return;
      }

      emitToConversation(
        io,
        payload.conversationId,
        "voice_message_uploaded",
        payload
      );
    }
  );

  /* ========================================================
     ATTACHMENT UPLOADED
  ======================================================== */

  socket.on(
    "attachment_uploaded",
    async (payload) => {
      if (
        !payload?.conversationId
      )
        return;

      const conversation =
        await getAuthorizedConversation(
          socket,
          payload.conversationId
        );

      if (!conversation) {
        return;
      }

      emitToConversation(
        io,
        payload.conversationId,
        "attachment_uploaded",
        payload
      );
    }
  );

  /* ========================================================
     ATTACHMENT REMOVED
  ======================================================== */

  socket.on(
    "attachment_removed",
    async ({
      conversationId,
      attachmentId,
    }) => {
      if (
        !conversationId
      )
        return;

      const conversation =
        await getAuthorizedConversation(
          socket,
          conversationId
        );

      if (!conversation) {
        return;
      }

      emitToConversation(
        io,
        conversationId,
        "attachment_removed",
        {
          conversationId,
          attachmentId,
        }
      );
    }
  );

  /* ========================================================
     AI REPLY GENERATED
  ======================================================== */

  socket.on(
    "ai_reply_generated",
    async (payload) => {
      if (
        !payload?.conversationId
      )
        return;

      const conversation =
        await getAuthorizedConversation(
          socket,
          payload.conversationId
        );

      if (!conversation) {
        return;
      }

      emitToConversation(
        io,
        payload.conversationId,
        "ai_reply_generated",
        payload
      );
    }
  );

  /* ========================================================
     AI SUGGESTIONS UPDATED
  ======================================================== */

  socket.on(
    "ai_suggestions_updated",
    async (payload) => {
      if (
        !payload?.conversationId
      )
        return;

      const conversation =
        await getAuthorizedConversation(
          socket,
          payload.conversationId
        );

      if (!conversation) {
        return;
      }

      emitToConversation(
        io,
        payload.conversationId,
        "ai_suggestions_updated",
        payload
      );
    }
  );

  /* ========================================================
     AI CONVERSATION SUMMARY UPDATED
  ======================================================== */

  socket.on(
    "conversation_summary_updated",
    async (payload) => {
      if (
        !payload?.conversationId
      )
        return;

      const conversation =
        await getAuthorizedConversation(
          socket,
          payload.conversationId
        );

      if (!conversation) {
        return;
      }

      emitToConversation(
        io,
        payload.conversationId,
        "conversation_summary_updated",
        payload
      );
    }
  );

  /* ========================================================
     VIEWING REQUESTED
  ======================================================== */

  socket.on(
    "viewing_requested",
    (payload) => {
      if (
        !payload?.organizationId
      )
        return;

      if (
        !isAuthorizedOrganization(
          socket,
          payload.organizationId
        )
      ) {
        return;
      }

      emitToOrganization(
        io,
        socket.data.organizationId,
        "viewing_requested",
        {
          ...payload,
          organizationId:
            socket.data.organizationId,
        }
      );

      if (
        payload.agentId &&
        isAuthorizedTargetUser(
          socket,
          payload.agentId
        )
      ) {
        io.to(
          `user:${payload.agentId}`
        ).emit(
          "agent_new_viewing_request",
          {
            ...payload,
            organizationId:
              socket.data.organizationId,
          }
        );
      }
    }
  );

  /* ========================================================
     VIEWING APPROVED
  ======================================================== */

  socket.on(
    "viewing_approved",
    async (payload) => {
      if (
        !payload?.conversationId
      )
        return;

      const conversation =
        await getAuthorizedConversation(
          socket,
          payload.conversationId
        );

      if (!conversation) {
        return;
      }

      emitToConversation(
        io,
        payload.conversationId,
        "viewing_approved",
        payload
      );

      if (
        payload.organizationId &&
        isAuthorizedOrganization(
          socket,
          payload.organizationId
        )
      ) {
        emitToOrganization(
          io,
          socket.data.organizationId,
          "dashboard_refresh",
          {
            reason:
              "viewing_approved",
          }
        );
      }
    }
  );

  /* ========================================================
     VIEWING REJECTED
  ======================================================== */

  socket.on(
    "viewing_rejected",
    async (payload) => {
      if (
        !payload?.conversationId
      )
        return;

      const conversation =
        await getAuthorizedConversation(
          socket,
          payload.conversationId
        );

      if (!conversation) {
        return;
      }

      emitToConversation(
        io,
        payload.conversationId,
        "viewing_rejected",
        payload
      );
    }
  );

  /* ========================================================
     VIEWING RESCHEDULED
  ======================================================== */

  socket.on(
    "viewing_rescheduled",
    async (payload) => {
      if (
        !payload?.conversationId
      )
        return;

      const conversation =
        await getAuthorizedConversation(
          socket,
          payload.conversationId
        );

      if (!conversation) {
        return;
      }

      emitToConversation(
        io,
        payload.conversationId,
        "viewing_rescheduled",
        payload
      );

      if (
        payload.organizationId &&
        isAuthorizedOrganization(
          socket,
          payload.organizationId
        )
      ) {
        emitToOrganization(
          io,
          socket.data.organizationId,
          "calendar_refresh",
          payload
        );
      }
    }
  );

  /* ========================================================
     VIEWING CANCELLED
  ======================================================== */

  socket.on(
    "viewing_cancelled",
    async (payload) => {
      if (
        !payload?.conversationId
      )
        return;

      const conversation =
        await getAuthorizedConversation(
          socket,
          payload.conversationId
        );

      if (!conversation) {
        return;
      }

      emitToConversation(
        io,
        payload.conversationId,
        "viewing_cancelled",
        payload
      );
    }
  );

  /* ========================================================
     VIEWING COMPLETED
  ======================================================== */

  socket.on(
    "viewing_completed",
    async (payload) => {
      if (
        !payload?.conversationId
      )
        return;

      const conversation =
        await getAuthorizedConversation(
          socket,
          payload.conversationId
        );

      if (!conversation) {
        return;
      }

      emitToConversation(
        io,
        payload.conversationId,
        "viewing_completed",
        payload
      );

      if (
        payload.organizationId &&
        isAuthorizedOrganization(
          socket,
          payload.organizationId
        )
      ) {
        emitToOrganization(
          io,
          socket.data.organizationId,
          "dashboard_refresh",
          {
            reason:
              "viewing_completed",
          }
        );
      }
    }
  );

  /* ========================================================
     VIEWING FEEDBACK SUBMITTED
  ======================================================== */

  socket.on(
    "viewing_feedback_submitted",
    async (payload) => {
      if (
        !payload?.conversationId
      )
        return;

      const conversation =
        await getAuthorizedConversation(
          socket,
          payload.conversationId
        );

      if (!conversation) {
        return;
      }

      emitToConversation(
        io,
        payload.conversationId,
        "viewing_feedback_submitted",
        payload
      );
    }
  );

  /* ========================================================
     CALENDAR UPDATED
  ======================================================== */

  socket.on(
    "calendar_updated",
    (payload) => {
      if (
        !payload?.organizationId
      )
        return;

      if (
        !isAuthorizedOrganization(
          socket,
          payload.organizationId
        )
      ) {
        return;
      }

      emitToOrganization(
        io,
        socket.data.organizationId,
        "calendar_updated",
        {
          ...payload,
          organizationId:
            socket.data.organizationId,
        }
      );
    }
  );

  /* ========================================================
     NOTIFICATION CREATED
  ======================================================== */

  socket.on(
    "notification_created",
    (payload) => {
      if (
        !payload?.userId
      )
        return;

      if (
        !isAuthorizedTargetUser(
          socket,
          payload.userId
        )
      ) {
        return;
      }

      emitToUser(
        io,
        payload.userId,
        "notification_created",
        payload
      );
    }
  );

  /* ========================================================
     NOTIFICATION READ
  ======================================================== */

  socket.on(
    "notification_read",
    (payload) => {
      if (
        !payload?.userId
      )
        return;

      if (
        !isAuthorizedTargetUser(
          socket,
          payload.userId
        )
      ) {
        return;
      }

      emitToUser(
        io,
        payload.userId,
        "notification_read",
        payload
      );
    }
  );

  /* ========================================================
     QUICK ACTION EXECUTED
  ======================================================== */

  socket.on(
    "quick_action",
    (payload) => {
      if (
        !payload?.organizationId
      )
        return;

      if (
        !isAuthorizedOrganization(
          socket,
          payload.organizationId
        )
      ) {
        return;
      }

      emitToOrganization(
        io,
        socket.data.organizationId,
        "quick_action",
        {
          ...payload,
          organizationId:
            socket.data.organizationId,
        }
      );
    }
  );

  /* ========================================================
     LEAD UPDATED
  ======================================================== */

  socket.on(
    "lead_updated",
    (payload) => {
      if (
        !payload?.organizationId
      )
        return;

      if (
        !isAuthorizedOrganization(
          socket,
          payload.organizationId
        )
      ) {
        return;
      }

      emitToOrganization(
        io,
        socket.data.organizationId,
        "lead_updated",
        {
          ...payload,
          organizationId:
            socket.data.organizationId,
        }
      );
    }
  );

  /* ========================================================
     LEAD ASSIGNED
  ======================================================== */

  socket.on(
    "lead_assigned",
    (payload) => {
      if (
        !payload?.agentId
      )
        return;

      if (
        !isAuthorizedTargetUser(
          socket,
          payload.agentId
        )
      ) {
        return;
      }

      emitToUser(
        io,
        payload.agentId,
        "lead_assigned",
        payload
      );

      if (
        payload.organizationId &&
        isAuthorizedOrganization(
          socket,
          payload.organizationId
        )
      ) {
        emitToOrganization(
          io,
          socket.data.organizationId,
          "dashboard_refresh",
          {
            reason:
              "lead_assigned",
          }
        );
      }
    }
  );

  /* ========================================================
     AI QUALIFICATION UPDATED
  ======================================================== */

  socket.on(
    "qualification_updated",
    async (payload) => {
      if (
        !payload?.conversationId
      )
        return;

      const conversation =
        await getAuthorizedConversation(
          socket,
          payload.conversationId
        );

      if (!conversation) {
        return;
      }

      emitToConversation(
        io,
        payload.conversationId,
        "qualification_updated",
        payload
      );
    }
  );

  /* ========================================================
     PROPERTY MATCH FOUND
  ======================================================== */

  socket.on(
    "property_match_found",
    async (payload) => {
      if (
        !payload?.conversationId
      )
        return;

      const conversation =
        await getAuthorizedConversation(
          socket,
          payload.conversationId
        );

      if (!conversation) {
        return;
      }

      emitToConversation(
        io,
        payload.conversationId,
        "property_match_found",
        payload
      );
    }
  );

  /* ========================================================
     PROPERTY UPDATED
  ======================================================== */

  socket.on(
    "property_updated",
    (payload) => {
      if (
        !payload?.organizationId
      )
        return;

      if (
        !isAuthorizedOrganization(
          socket,
          payload.organizationId
        )
      ) {
        return;
      }

      emitToOrganization(
        io,
        socket.data.organizationId,
        "property_updated",
        {
          ...payload,
          organizationId:
            socket.data.organizationId,
        }
      );
    }
  );

  /* ========================================================
     DASHBOARD SUMMARY REFRESH
  ======================================================== */

  socket.on(
    "dashboard_summary_updated",
    (payload) => {
      if (
        !payload?.organizationId
      )
        return;

      if (
        !isAuthorizedOrganization(
          socket,
          payload.organizationId
        )
      ) {
        return;
      }

      emitToOrganization(
        io,
        socket.data.organizationId,
        "dashboard_summary_updated",
        {
          ...payload,
          organizationId:
            socket.data.organizationId,
        }
      );
    }
  );

  /* ========================================================
     PIPELINE UPDATED
  ======================================================== */

  socket.on(
    "pipeline_updated",
    (payload) => {
      if (
        !payload?.organizationId
      )
        return;

      if (
        !isAuthorizedOrganization(
          socket,
          payload.organizationId
        )
      ) {
        return;
      }

      emitToOrganization(
        io,
        socket.data.organizationId,
        "pipeline_updated",
        {
          ...payload,
          organizationId:
            socket.data.organizationId,
        }
      );
    }
  );

  /* ========================================================
     DISCONNECT
  ======================================================== */

  socket.on(
    "disconnect",
    () => {
      if (socket.data?.userId) {
        onlineUsers.delete(
          socket.data.userId
        );

        if (
          socket.data.organizationId
        ) {
          emitToOrganization(
            io,
            socket.data.organizationId,
            "presence_update",
            {
              userId:
                socket.data.userId,
              name:
                socket.data.name,
              role:
                socket.data.role,
              status:
                "offline",
              lastSeen:
                new Date().toISOString(),
            }
          );
        }
      }

      console.log(
        `Conversation socket disconnected: ${socket.id}`
      );
    }
  );
};

/* ============================================================
   EXPORT
============================================================ */

export default registerConversationSocket;