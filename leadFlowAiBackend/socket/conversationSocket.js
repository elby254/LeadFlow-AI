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
 * ============================================================
 */

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
    ({
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

      socket.data.userId =
        userId;

      socket.data.organizationId =
        organizationId;

      socket.data.name =
        name;

      socket.data.role =
        role;

      socket.join(
        organizationRoom(
          organizationId
        )
      );

      socket.join(
        userRoom(userId)
      );

      onlineUsers.set(
        userId,
        {
          socketId:
            socket.id,
          organizationId,
          name,
          role,
          lastSeen:
            new Date(),
        }
      );

      emitToOrganization(
        io,
        organizationId,
        "presence_update",
        {
          userId,
          name,
          role,
          status:
            "online",
        }
      );

      console.log(
        `${name} registered`
      );
    }
  );

  /* ========================================================
     JOIN CONVERSATION
  ======================================================== */

  socket.on(
    "join_conversation",
    ({
      conversationId,
    }) => {
      if (
        !conversationId
      )
        return;

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
    ({
      conversationId,
    }) => {
      if (
        !conversationId
      )
        return;

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
    (message) => {
      if (
        !message?.conversationId
      )
        return;

      emitToConversation(
        io,
        message.conversationId,
        "message_received",
        {
          ...message,
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
    ({
      conversationId,
      messageId,
    }) => {
      if (
        !conversationId ||
        !messageId
      )
        return;

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
    ({
      conversationId,
      messageId,
      userId,
    }) => {
      if (
        !conversationId ||
        !messageId
      )
        return;

      emitToConversation(
        io,
        conversationId,
        "message_read",
        {
          conversationId,
          messageId,
          userId,
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
    ({
      conversationId,
      userId,
    }) => {
      if (
        !conversationId
      )
        return;

      emitToConversation(
        io,
        conversationId,
        "conversation_read",
        {
          conversationId,
          userId,
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
    (payload) => {
      if (
        !payload
          ?.conversationId
      )
        return;

      emitToConversation(
        io,
        payload
          .conversationId,
        "message_edited",
        {
          ...payload,
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
    ({
      conversationId,
      messageId,
    }) => {
      if (
        !conversationId
      )
        return;

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
    (conversation) => {
      if (
        !conversation
          ?.conversationId
      )
        return;

      emitToConversation(
        io,
        conversation
          .conversationId,
        "conversation_updated",
        conversation
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
          conversation
        );
      }
    }
  );

/* ========================================================
   TYPING START
======================================================== */

  socket.on(
    "typing_start",
    (payload) => {
      if (
        !payload?.conversationId
      )
        return;

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
    (payload) => {
      if (
        !payload?.conversationId
      )
        return;

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
    (payload) => {
      if (
        !payload?.conversationId
      )
        return;

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
    (payload) => {
      if (
        !payload?.conversationId
      )
        return;

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
    ({
      conversationId,
      attachmentId,
    }) => {
      if (
        !conversationId
      )
        return;

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
    (payload) => {
      if (
        !payload?.conversationId
      )
        return;

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
    (payload) => {
      if (
        !payload?.conversationId
      )
        return;

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
    (payload) => {
      if (
        !payload?.conversationId
      )
        return;

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
      if (!payload?.organizationId)
        return;

      emitToOrganization(
        io,
        payload.organizationId,
        "viewing_requested",
        payload
      );

      if (payload.agentId) {
        io.to(
          `user:${payload.agentId}`
        ).emit(
          "agent_new_viewing_request",
          payload
        );
      }
    }
  );

/* ========================================================
   VIEWING APPROVED
======================================================== */

  socket.on(
    "viewing_approved",
    (payload) => {
      if (!payload?.conversationId)
        return;

      emitToConversation(
        io,
        payload.conversationId,
        "viewing_approved",
        payload
      );

      if (payload.organizationId) {
        emitToOrganization(
          io,
          payload.organizationId,
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
    (payload) => {
      if (!payload?.conversationId)
        return;

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
    (payload) => {
      if (!payload?.conversationId)
        return;

      emitToConversation(
        io,
        payload.conversationId,
        "viewing_rescheduled",
        payload
      );

      if (payload.organizationId) {
        emitToOrganization(
          io,
          payload.organizationId,
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
    (payload) => {
      if (!payload?.conversationId)
        return;

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
    (payload) => {
      if (!payload?.conversationId)
        return;

      emitToConversation(
        io,
        payload.conversationId,
        "viewing_completed",
        payload
      );

      if (payload.organizationId) {
        emitToOrganization(
          io,
          payload.organizationId,
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
    (payload) => {
      if (!payload?.conversationId)
        return;

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
      if (!payload?.organizationId)
        return;

      emitToOrganization(
        io,
        payload.organizationId,
        "calendar_updated",
        payload
      );
    }
  );

/* ========================================================
   NOTIFICATION CREATED
======================================================== */

  socket.on(
    "notification_created",
    (payload) => {
      if (!payload?.userId) return;

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
      if (!payload?.userId) return;

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
      if (!payload?.organizationId) return;

      emitToOrganization(
        io,
        payload.organizationId,
        "quick_action",
        payload
      );
    }
  );

/* ========================================================
   LEAD UPDATED
======================================================== */

  socket.on(
    "lead_updated",
    (payload) => {
      if (!payload?.organizationId) return;

      emitToOrganization(
        io,
        payload.organizationId,
        "lead_updated",
        payload
      );
    }
  );

/* ========================================================
   LEAD ASSIGNED
======================================================== */

  socket.on(
    "lead_assigned",
    (payload) => {
      if (!payload?.agentId) return;

      emitToUser(
        io,
        payload.agentId,
        "lead_assigned",
        payload
      );

      if (payload.organizationId) {
        emitToOrganization(
          io,
          payload.organizationId,
          "dashboard_refresh",
          {
            reason: "lead_assigned",
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
    (payload) => {
      if (!payload?.conversationId) return;

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
    (payload) => {
      if (!payload?.conversationId) return;

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
      if (!payload?.organizationId) return;

      emitToOrganization(
        io,
        payload.organizationId,
        "property_updated",
        payload
      );
    }
  );

/* ========================================================
   DASHBOARD SUMMARY REFRESH
======================================================== */

  socket.on(
    "dashboard_summary_updated",
    (payload) => {
      if (!payload?.organizationId) return;

      emitToOrganization(
        io,
        payload.organizationId,
        "dashboard_summary_updated",
        payload
      );
    }
  );

/* ========================================================
   PIPELINE UPDATED
======================================================== */

  socket.on(
    "pipeline_updated",
    (payload) => {
      if (!payload?.organizationId) return;

      emitToOrganization(
        io,
        payload.organizationId,
        "pipeline_updated",
        payload
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