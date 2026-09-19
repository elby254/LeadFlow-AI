/**
 * ==========================================================
 *
 * Manages a single conversation thread.
 *
 * Responsibilities
 * ----------------------------------------------------------
 * ✓ Load conversation history
 * ✓ Send messages
 * ✓ Receive live Socket.io messages
 * ✓ Read receipts
 * ✓ Typing indicators
 * ✓ Attachments
 * ✓ Voice notes
 * ✓ Offline queue
 * ✓ Delivery status
 *
 * ==========================================================
 */

import {
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";

import useAuth from "./useAuth";

import socket from "../services/socketClient";

import messageService from "../services/conversation/messageService";

/* ==========================================================
   CONSTANTS
========================================================== */

const MESSAGE_LIMIT = 50;

/* ==========================================================
   HOOK
========================================================== */

const useMessages = (conversationId) => {

  /* ========================================================
     AUTHENTICATION
  ======================================================== */

  const {
    user,
  } = useAuth();

  /* ========================================================
     CONNECTION
  ======================================================== */

  const [
    isConnected,
    setIsConnected,
  ] = useState(socket?.connected || false);

  /* ========================================================
     MESSAGE COLLECTION
  ======================================================== */

  const [
    messages,
    setMessages,
  ] = useState([]);

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  /* ========================================================
     MESSAGE COMPOSER
  ======================================================== */

  const [
    message,
    setMessage,
  ] = useState("");

  const [
    sending,
    setSending,
  ] = useState(false);

  /* ========================================================
     TYPING
  ======================================================== */

  const [
    typing,
    setTyping,
  ] = useState(false);

  const [
    otherUserTyping,
    setOtherUserTyping,
  ] = useState(false);

  /* ========================================================
     ATTACHMENTS
  ======================================================== */

  const [
    attachments,
    setAttachments,
  ] = useState([]);

  /* ========================================================
     VOICE NOTES
  ======================================================== */

  const [
    voiceNotes,
    setVoiceNotes,
  ] = useState([]);

  /* ========================================================
     OFFLINE QUEUE
  ======================================================== */

  const [
    pendingMessages,
    setPendingMessages,
  ] = useState([]);

  /* ========================================================
     DELIVERY STATUS
  ======================================================== */

  const [
    lastDelivered,
    setLastDelivered,
  ] = useState(null);

  /* ========================================================
     PAGINATION
  ======================================================== */

  const [
    hasMore,
    setHasMore,
  ] = useState(true);

  const [
    page,
    setPage,
  ] = useState(1);

  /* ========================================================
     REFS
  ======================================================== */

  const messagesEndRef = useRef(null);

  const typingTimeoutRef = useRef(null);

  /* ========================================================
     LOAD MESSAGES
  ======================================================== */

  const loadMessages = useCallback(

    async (pageNumber = 1) => {

      if (!conversationId) return;

      try {

        setLoading(true);

        setError("");

        const response = await messageService.getMessages(

          conversationId,

          {

            page: pageNumber,

            limit: MESSAGE_LIMIT,

          }

        );

        const rows =

          response?.messages ||

          response?.data ||

          response ||

          [];

        if (pageNumber === 1) {

          setMessages(

            Array.isArray(rows)

              ? rows

              : []

          );

        } else {

          setMessages((previous) => [

            ...rows,

            ...previous,

          ]);

        }

        setHasMore(

          rows.length === MESSAGE_LIMIT

        );

        setPage(pageNumber);

      }

      catch (err) {

        console.error(

          "Failed to load messages",

          err

        );

        setError(

          err?.message ||

          "Unable to load conversation."

        );

      }

      finally {

        setLoading(false);

      }

    },

    [

      conversationId,

    ]

  );

  /* ========================================================
     LOAD OLDER MESSAGES
  ======================================================== */

  const loadOlderMessages = useCallback(

    async () => {

      if (!hasMore) return;

      await loadMessages(page + 1);

    },

    [

      page,

      hasMore,

      loadMessages,

    ]

  );

  /* ========================================================
     SCROLL TO LATEST MESSAGE
  ======================================================== */

  const scrollToBottom = useCallback(() => {

    messagesEndRef.current?.scrollIntoView({

      behavior: "smooth",

    });

  }, []);

  /* ========================================================
     AUTO SCROLL
  ======================================================== */

  useEffect(() => {

    scrollToBottom();

  }, [

    messages,

    scrollToBottom,

  ]);

  /* ========================================================
     INITIAL LOAD
  ======================================================== */

  useEffect(() => {

    loadMessages(1);

  }, [

    loadMessages,

  ]);

  /* ========================================================
     SOCKET EVENTS
  ======================================================== */

  useEffect(() => {

    if (!socket || !conversationId) return;

    /* --------------------------------------------
       Incoming Message
    -------------------------------------------- */

    const handleIncomingMessage = (incomingMessage) => {

      if (incomingMessage.conversationId !== conversationId)
        return;

      setMessages((previous) => {

        const exists = previous.some(
          (message) => message._id === incomingMessage._id
        );

        if (exists) return previous;

        return [...previous, incomingMessage];

      });

    };

    /* --------------------------------------------
       Message Delivered
    -------------------------------------------- */

    const handleDelivered = ({ messageId }) => {

      setMessages((previous) =>

        previous.map((message) =>

          message._id === messageId
            ? {
                ...message,
                status: "delivered",
              }
            : message

        )

      );

    };

    /* --------------------------------------------
       Message Read
    -------------------------------------------- */

    const handleRead = ({ messageId }) => {

      setMessages((previous) =>

        previous.map((message) =>

          message._id === messageId
            ? {
                ...message,
                status: "read",
                readAt: new Date().toISOString(),
              }
            : message

        )

      );

    };

    /* --------------------------------------------
       Typing Started
    -------------------------------------------- */

    const handleTypingStart = ({ conversationId: activeConversation, userId }) => {

      if (activeConversation !== conversationId)
        return;

      if (userId === user?._id)
        return;

      setOtherUserTyping(true);

    };

    /* --------------------------------------------
       Typing Stopped
    -------------------------------------------- */

    const handleTypingStop = ({ conversationId: activeConversation, userId }) => {

      if (activeConversation !== conversationId)
        return;

      if (userId === user?._id)
        return;

      setOtherUserTyping(false);

    };

    socket.on("message_received", handleIncomingMessage);
    socket.on("message_delivered", handleDelivered);
    socket.on("message_read", handleRead);
    socket.on("typing_start", handleTypingStart);
    socket.on("typing_stop", handleTypingStop);

    return () => {

      socket.off("message_received", handleIncomingMessage);
      socket.off("message_delivered", handleDelivered);
      socket.off("message_read", handleRead);
      socket.off("typing_start", handleTypingStart);
      socket.off("typing_stop", handleTypingStop);

    };

  }, [

    socket,
    conversationId,
    user,

  ]);

  /* ========================================================
     RETRY OFFLINE QUEUE
  ======================================================== */

  const retryPendingMessages = useCallback(async () => {

    if (!pendingMessages.length)
      return;

    const queue = [...pendingMessages];

    setPendingMessages([]);

    for (const pending of queue) {

      try {

        await sendMessage(
          pending.text,
          {
            attachments: pending.attachments,
            voiceNote: pending.voiceNote,
          }
        );

      }

      catch {

        setPendingMessages(previous => [
          ...previous,
          pending,
        ]);

      }

    }

  }, [

    pendingMessages,
    sendMessage,

  ]);

  /* ========================================================
     SEND MESSAGE
  ======================================================== */

  const sendMessage = useCallback(

    async (text, extra = {}) => {

      if (!conversationId) return;

      if (!text?.trim() && !extra.attachments?.length)
        return;

      const optimisticId = `temp-${Date.now()}`;

      const optimisticMessage = {

        _id: optimisticId,

        conversationId,

        senderId: user?._id,

        senderRole: user?.role,

        text,

        attachments: extra.attachments || [],

        voiceNote: extra.voiceNote || null,

        createdAt: new Date().toISOString(),

        status: "sending",

      };

      setMessages(previous => [

        ...previous,

        optimisticMessage,

      ]);

      setSending(true);

      try {

        const savedMessage = await messageService.sendMessage(

          conversationId,

          {

            text,

            ...extra,

          }

        );

        setMessages(previous =>

          previous.map(message =>

            message._id === optimisticId

              ? savedMessage

              : message

          )

        );

        setLastDelivered(savedMessage._id);

        setMessage("");

        setAttachments([]);

        setVoiceNotes([]);

      }

      catch (error) {

        console.error(error);

        setPendingMessages(previous => [

          ...previous,

          optimisticMessage,

        ]);

        setMessages(previous =>

          previous.map(message =>

            message._id === optimisticId

              ? {

                  ...message,

                  status: "failed",

                }

              : message

          )

        );

      }

      finally {

        setSending(false);

      }

    },

    [

      conversationId,

      user,

    ]

  );

  /* ========================================================
     MARK MESSAGE READ
  ======================================================== */

  const markMessageRead = useCallback(

    async (messageId) => {

      try {

        await messageService.markAsRead(messageId);

        socket.emit("message_read", {

          conversationId,

          messageId,

        });

      }

      catch (error) {

        console.error(error);

      }

    },

    [

      conversationId,

    ]

  );

  /* ========================================================
     CLEANUP
  ======================================================== */

  useEffect(() => {

    return () => {

      if (typingTimeoutRef.current) {

        clearTimeout(typingTimeoutRef.current);

      }

    };

  }, []);

  /* ========================================================
     PUBLIC API
  ======================================================== */

  return {

    /* Authentication */

    user,

    isConnected,

    /* Messages */

    messages,

    loading,

    error,

    hasMore,

    page,

    /* Composer */

    message,

    setMessage,

    sending,

    /* Typing */

    typing,

    otherUserTyping,

    /* Attachments */

    attachments,

    addAttachment,

    removeAttachment,

    /* Voice Notes */

    voiceNotes,

    addVoiceNote,

    /* Delivery */

    lastDelivered,

    pendingMessages,

    /* Actions */

    loadMessages,

    loadOlderMessages,

    sendMessage,

    retryPendingMessages,

    markMessageRead,

    startTyping,

    stopTyping,

    scrollToBottom,

    messagesEndRef,

  };

};

export default useMessages;