/**
 * ==========================================================
 * Handles message read receipts and delivery status.
 *
 * Responsibilities
 * ----------------------------------------------------------
 * ✓ Mark individual messages as read
 * ✓ Mark entire conversations as read
 * ✓ Track delivered status
 * ✓ Track seen status
 * ✓ Synchronize read receipts through Socket.io
 * ✓ Maintain offline read queue
 * ✓ Optimistic UI updates
 *
 * Used By
 * ----------------------------------------------------------
 * Agent Conversation Center
 * Viewer Conversation Center
 * Recent Conversations Widget
 * Conversation List
 * Message Bubble Component
 *
 * Backend
 * ----------------------------------------------------------
 * PATCH /api/messages/:messageId/read
 * PATCH /api/conversations/:conversationId/read
 *
 * Socket Events
 * ----------------------------------------------------------
 * message_read
 * conversation_read
 *
 * ==========================================================
 */

import { useState } from "react";
import { useCallback } from "react";

import { useAuth } from "./useAuth";

import readReceiptService from "../services/conversation/readReceiptService";

/* ==========================================================
   HOOK
========================================================== */

const useReadReceipts = () => {

  /* ========================================================
     AUTHENTICATION
  ======================================================== */

  const {

    user,

    hasRole,

  } = useAuth();

  /* ========================================================
     READ RECEIPTS
  ======================================================== */

  const [

    readReceipts,

    setReadReceipts,

  ] = useState({});

  /* ========================================================
     DELIVERY STATUS
  ======================================================== */

  const [

    deliveredMessages,

    setDeliveredMessages,

  ] = useState({});

  /* ========================================================
     SEEN STATUS
  ======================================================== */

  const [

    seenMessages,

    setSeenMessages,

  ] = useState({});

  /* ========================================================
     LOADING
  ======================================================== */

  const [

    loading,

    setLoading,

  ] = useState(false);

  /* ========================================================
     ERROR
  ======================================================== */

  const [

    error,

    setError,

  ] = useState("");

  /* ========================================================
     OFFLINE QUEUE
  ======================================================== */

  const [

    pendingReadQueue,

    setPendingReadQueue,

  ] = useState([]);

  /* ========================================================
     MARK SINGLE MESSAGE AS READ
     (Foundation only — implementation continues in Part 2)
  ======================================================== */

  const markMessageRead = useCallback(

    async (

      messageId,

      conversationId

    ) => {

      if (!messageId) return;

      try {

        setLoading(true);

        setError("");

        /**
         * Optimistic UI update.
         */
        setSeenMessages((previous) => ({
          ...previous,
          [messageId]: true,
        }));

        setReadReceipts((previous) => ({
          ...previous,
          [messageId]: {
            read: true,
            readBy: user?.id,
            readAt: new Date().toISOString(),
          },
        }));

        await readReceiptService.markMessageRead(messageId);
      }

      catch (err) {

        console.error(

          "Unable to mark message as read",

          err

        );

        setError(

          err?.message ||

          "Unable to update read receipt."

        );

        setPendingReadQueue((previous) => [
          ...previous,
          {
            type: "message",
            messageId,
            conversationId,
          },
        ]);

      }

      finally {

        setLoading(false);

      }

    },

    [

      user,

    ]

  );

  /* ========================================================
     MARK ENTIRE CONVERSATION AS READ
  ======================================================== */

  const markConversationRead = useCallback(

    async (

      conversationId

    ) => {

      if (!conversationId) return;

      try {

        setLoading(true);

        setError("");

        await readReceiptService.markConversationRead(

          conversationId

        );

      }

      catch (err) {

        console.error(

          "Unable to mark conversation as read",

          err

        );

        /**
         * Store request for retry
         */

        setPendingReadQueue((previous) => [

          ...previous,

          {

            type: "conversation",

            conversationId,

          },

        ]);

      }

      finally {

        setLoading(false);

      }

    },

    []

  );

  /* ========================================================
     DELIVERY STATUS
  ======================================================== */

  const markDelivered = useCallback(

    (

      messageId

    ) => {

      setDeliveredMessages((previous) => ({

        ...previous,

        [messageId]: true,

      }));

    },

    []

  );

  /* ========================================================
     SEEN STATUS
  ======================================================== */

  const markSeen = useCallback(

    (

      messageId

    ) => {

      setSeenMessages((previous) => ({

        ...previous,

        [messageId]: true,

      }));

    },

    []

  );

  /* ========================================================
     BULK READ RECEIPTS
  ======================================================== */

  const markMessagesRead = useCallback(

    (

      messageIds = []

    ) => {

      if (!messageIds.length) return;

      setSeenMessages((previous) => {

        const updated = {

          ...previous,

        };

        messageIds.forEach((id) => {

          updated[id] = true;

        });

        return updated;

      });

    },

    []

  );

  /* ========================================================
     SOCKET.IO SYNCHRONIZATION
  ======================================================== */

  useEffect(() => {

    const handleMessageRead = (payload) => {

      if (!payload?.messageId) return;

      setSeenMessages((previous) => ({

        ...previous,

        [payload.messageId]: true,

      }));

      setReadReceipts((previous) => ({

        ...previous,

        [payload.messageId]: {

          read: true,

          readBy: payload.userId,

          readAt:
            payload.readAt ||
            new Date().toISOString(),

        },

      }));

    };

    const handleConversationRead = (payload) => {

      if (!payload?.messageIds) return;

      setSeenMessages((previous) => {

        const updated = {

          ...previous,

        };

        payload.messageIds.forEach((id) => {

          updated[id] = true;

        });

        return updated;

      });

    };

    socket.on(

      "message_read",

      handleMessageRead

    );

    socket.on(

      "conversation_read",

      handleConversationRead

    );

    return () => {

      socket.off(

        "message_read",

        handleMessageRead

      );

      socket.off(

        "conversation_read",

        handleConversationRead

      );

    };

  }, []);

  /* ========================================================
     RETRY OFFLINE QUEUE
  ======================================================== */

  const retryPendingReads = useCallback(

    async () => {

      if (!pendingReadQueue.length) return;

      const queue = [

        ...pendingReadQueue,

      ];

      setPendingReadQueue([]);

      for (const item of queue) {

        try {

          if (item.type === "conversation") {

            await readReceiptService.markConversationRead(

              item.conversationId

            );

          }

          else {

            await readReceiptService.markMessageRead(

              item.messageId

            );

          }

        }

        catch {

          setPendingReadQueue(

            (previous) => [

              ...previous,

              item,

            ]

          );

        }

      }

    },

    [

      pendingReadQueue,

    ]

  );

  /* ========================================================
     CLEAR RECEIPTS
  ======================================================== */

  const clearReceipts = useCallback(

    () => {

      setReadReceipts({});

      setDeliveredMessages({});

      setSeenMessages({});

      setPendingReadQueue([]);

      setError("");

    },

    []

  );

  /* ========================================================
     PUBLIC API
  ======================================================== */

  return {

    /* Authentication */

    user,

    hasRole,

    /* State */

    readReceipts,

    deliveredMessages,

    seenMessages,

    pendingReadQueue,

    loading,

    error,

    /* Actions */

    markMessageRead,

    markConversationRead,

    markDelivered,

    markSeen,

    markMessagesRead,

    retryPendingReads,

    clearReceipts,

  };

};

export default useReadReceipts;