/**
 * ==========================================================
 *
 * Central Conversation Manager
 *
 * Responsibilities
 * ----------------------------------------------------------
 * ✓ Conversation List
 * ✓ Current Conversation
 * ✓ Messages
 * ✓ Pagination
 * ✓ Search
 * ✓ Filters
 * ✓ Typing
 * ✓ Read Receipts
 * ✓ Attachments
 * ✓ Voice Notes
 * ✓ Offline Queue
 * ✓ Socket Synchronization
 * ✓ AI Reply Suggestions
 *
 * Used By
 * ----------------------------------------------------------
 * Admin Conversation Center
 * Agent Conversation Center
 * Viewer Conversation Center
 * Dashboard Widgets
 *
 * ==========================================================
 */

import { useState } from "react";
import { useEffect } from "react";
import { useRef } from "react";
import { useCallback } from "react";

import useAuth from "./useAuth";

import socket from "../services/socketClient";

import conversationService from "../services/conversation/conversationService";

/* ==========================================================
   DEFAULT FILTERS
========================================================== */

const DEFAULT_FILTERS = {
  unread: false,
  archived: false,
  pinned: false,
  assigned: false,
  status: "all",
};

/* ==========================================================
   CONFIGURATION
========================================================== */

const DEFAULT_PAGE_SIZE = 20;

const MESSAGE_PAGE_SIZE = 30;

const TYPING_TIMEOUT = 3000;

/* ==========================================================
   HOOK
========================================================== */

const useConversations = (options = {}) => {
  const {
    autoLoad = true,
    pageSize = DEFAULT_PAGE_SIZE,
    initialSearch = "",
    initialFilters = DEFAULT_FILTERS,
  } = options;

  /* ========================================================
     AUTHENTICATION
  ======================================================== */

  const { user, hasRole } = useAuth();

  /* ========================================================
     CONNECTION STATE
  ======================================================== */

  const [connected, setConnected] = useState(false);

  const [isOnline, setIsOnline] = useState(
    typeof navigator !== "undefined"
      ? navigator.onLine
      : true
  );

  /* ========================================================
     CONVERSATION LIST
  ======================================================== */

  const [conversations, setConversations] = useState([]);

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  const [page, setPage] = useState(1);

  const [hasMore, setHasMore] = useState(true);

  const [total, setTotal] = useState(0);

  const [unreadCount, setUnreadCount] = useState(0);

  /* ========================================================
     SEARCH
  ======================================================== */

  const [search, setSearch] =
    useState(initialSearch);

  /* ========================================================
     FILTERS
  ======================================================== */

  const [filters, setFilters] =
    useState(initialFilters);

  /* ========================================================
     CURRENT CONVERSATION
  ======================================================== */

  const [
    currentConversation,
    setCurrentConversation,
  ] = useState(null);

  /* ========================================================
     MESSAGE HISTORY
  ======================================================== */

  const [messages, setMessages] = useState([]);

  const [messagesLoading, setMessagesLoading] =
    useState(false);

  const [messagesError, setMessagesError] =
    useState("");

  const [messagesPage, setMessagesPage] =
    useState(1);

  const [
    hasOlderMessages,
    setHasOlderMessages,
  ] = useState(true);

  /* ========================================================
     MESSAGE COMPOSER
  ======================================================== */

  const [message, setMessage] = useState("");

  const [sending, setSending] = useState(false);

  /* ========================================================
     ATTACHMENTS
  ======================================================== */

  const [attachments, setAttachments] =
    useState([]);

  const [uploadProgress, setUploadProgress] =
    useState(0);

  /* ========================================================
     VOICE NOTES
  ======================================================== */

  const [voiceNotes, setVoiceNotes] =
    useState([]);

  /* ========================================================
     OFFLINE QUEUE
  ======================================================== */

  const [pendingMessages, setPendingMessages] =
    useState([]);

  /* ========================================================
     DELIVERY
  ======================================================== */

  const [lastDelivered, setLastDelivered] =
    useState(null);

  const [lastReadMessageId, setLastReadMessageId] =
    useState(null);

  /* ========================================================
     TYPING
  ======================================================== */

  const [typing, setTyping] = useState(false);

  const [otherUserTyping, setOtherUserTyping] =
    useState(false);

  /* ========================================================
     AI REPLY SUGGESTIONS
  ======================================================== */

  const [aiSuggestions, setAiSuggestions] =
    useState([]);

  /* ========================================================
     SOCKET HELPERS
  ======================================================== */

  const typingTimeout = useRef(null);

  const isBroadcasting = useRef(false);

  /* ========================================================
     REQUEST BUILDER
  ======================================================== */

  const buildRequest = useCallback(() => {
    return {
      page,
      limit: pageSize,
      search,
      filters,
    };
  }, [
    page,
    pageSize,
    search,
    filters,
  ]);

  /* ========================================================
     MESSAGE REQUEST BUILDER
  ======================================================== */

  const buildMessageRequest = useCallback(
    (pageNumber = 1) => {
      return {
        page: pageNumber,
        limit: MESSAGE_PAGE_SIZE,
      };
    },
    []
  );

  /* ========================================================
     CONNECTION LISTENERS
  ======================================================== */

  useEffect(() => {
    const handleConnect = () => {
      console.log(
        "Conversation socket connected"
      );

      setConnected(true);
    };

    const handleDisconnect = () => {
      console.log(
        "Conversation socket disconnected"
      );

      setConnected(false);
    };

    socket.on("connect", handleConnect);

    socket.on("disconnect", handleDisconnect);

    setConnected(socket.connected);

    return () => {
      socket.off("connect", handleConnect);

      socket.off("disconnect", handleDisconnect);
    };
  }, []);

  /* ========================================================
     BROWSER ONLINE / OFFLINE
  ======================================================== */

  useEffect(() => {
    const handleOnline = () => {
      console.log(
        "Browser connection restored"
      );

      setIsOnline(true);
    };

    const handleOffline = () => {
      console.log(
        "Browser is offline"
      );

      setIsOnline(false);
    };

    window.addEventListener(
      "online",
      handleOnline
    );

    window.addEventListener(
      "offline",
      handleOffline
    );

    return () => {
      window.removeEventListener(
        "online",
        handleOnline
      );

      window.removeEventListener(
        "offline",
        handleOffline
      );
    };
  }, []);

  /* ========================================================
     LOAD CONVERSATIONS
  ======================================================== */

  const loadConversations = useCallback(
    async (reset = false) => {
      try {
        setLoading(true);

        setError("");

        const request = {
          ...buildRequest(),
          page: reset ? 1 : page,
        };

        console.log(
          "Loading conversations",
          request
        );

        /**
         * Backend automatically filters
         * conversations according to role.
         */

        /*
         * Use the agent/admin/viewer service
         * according to the authenticated role.
         */

        let response;

        if (hasRole?.("admin")) {
          response =
            await conversationService.getAdminConversations(
              request
            );
        } else if (hasRole?.("agent")) {
          response =
            await conversationService.getAgentConversations(
              request
            );
        } else {
          response =
            await conversationService.getViewerConversations(
              request
            );
        }

        console.log(
          "Conversations response",
          response
        );

        /*
         * Backend may return:
         *
         * {
         *   data: [...]
         * }
         *
         * OR:
         *
         * {
         *   conversations: [...]
         * }
         */

        const rows =
          response?.conversations ||
          response?.data ||
          [];

        const safeRows =
          Array.isArray(rows)
            ? rows
            : [];

        const responseTotal =
          response?.total ??
          safeRows.length;

        const responseUnread =
          response?.unreadCount ??
          0;

        const responseHasMore =
          response?.hasMore ??
          safeRows.length === pageSize;

        if (reset) {
          setConversations(
            safeRows
          );

          setPage(1);
        } else {
          setConversations((previous) => {
            const existingIds =
              new Set(
                previous.map(
                  (item) =>
                    item._id ||
                    item.id
                )
              );

            const newRows =
              safeRows.filter(
                (item) =>
                  !existingIds.has(
                    item._id ||
                    item.id
                  )
              );

            return [
              ...previous,
              ...newRows,
            ];
          });
        }

        setTotal(responseTotal);

        setUnreadCount(responseUnread);

        setHasMore(responseHasMore);
      } catch (err) {
        console.error(
          "Conversation loading failed",
          err
        );

        setError(
          err?.response?.data?.message ||
            err?.message ||
            "Unable to load conversations."
        );
      } finally {
        setLoading(false);
      }
    },
    [
      buildRequest,
      page,
      pageSize,
      hasRole,
    ]
  );

  /* ========================================================
     REFRESH CONVERSATIONS
  ======================================================== */

  const refreshConversations =
    useCallback(async () => {
      console.log(
        "Refreshing conversations"
      );

      await loadConversations(true);
    }, [loadConversations]);

  /* ========================================================
     LOAD NEXT PAGE
  ======================================================== */

  const loadMore = useCallback(() => {
    if (loading) return;

    if (!hasMore) return;

    console.log(
      "Loading next conversation page"
    );

    setPage(
      (previous) =>
        previous + 1
    );
  }, [
    loading,
    hasMore,
  ]);

  /* ========================================================
     SEARCH CONVERSATIONS
  ======================================================== */

  const searchConversations =
    useCallback((value) => {
      console.log(
        "Conversation search:",
        value
      );

      setSearch(value);

      setPage(1);

      setHasMore(true);
    }, []);

  /* ========================================================
     UPDATE FILTERS
  ======================================================== */

  const updateFilters =
    useCallback((newFilters) => {
      console.log(
        "Updating conversation filters:",
        newFilters
      );

      setFilters((previous) => ({
        ...previous,
        ...newFilters,
      }));

      setPage(1);

      setHasMore(true);
    }, []);

  /* ========================================================
     CLEAR SEARCH
  ======================================================== */

  const clearSearch = useCallback(() => {
    console.log(
      "Clearing conversation search"
    );

    setSearch("");

    setFilters(
      DEFAULT_FILTERS
    );

    setPage(1);

    setHasMore(true);
  }, []);

  /* ========================================================
     LOAD CONVERSATION MESSAGES
  ======================================================== */

  const loadMessages = useCallback(
    async (
      conversationId,
      pageNumber = 1,
      replace = false
    ) => {
      if (!conversationId) {
        console.warn(
          "Cannot load messages without conversation ID"
        );

        return;
      }

      try {
        setMessagesLoading(true);

        setMessagesError("");

        console.log(
          "Loading conversation messages:",
          conversationId
        );

        const response =
          await conversationService.getConversationMessages(
            conversationId,
            buildMessageRequest(
              pageNumber
            )
          );

        console.log(
          "Conversation messages response:",
          response
        );

        const rows =
          response?.messages ||
          response?.data ||
          [];

        const safeRows =
          Array.isArray(rows)
            ? rows
            : [];

        if (replace) {
          setMessages(
            safeRows
          );
        } else {
          setMessages((previous) => [
            ...safeRows,
            ...previous,
          ]);
        }

        setMessagesPage(
          pageNumber
        );

        setHasOlderMessages(
          safeRows.length ===
            MESSAGE_PAGE_SIZE
        );
      } catch (err) {
        console.error(
          "Unable to load messages",
          err
        );

        setMessagesError(
          err?.response?.data?.message ||
            err?.message ||
            "Unable to load messages."
        );
      } finally {
        setMessagesLoading(false);
      }
    },
    [buildMessageRequest]
  );

  /* ========================================================
     OPEN CONVERSATION
  ======================================================== */

  const openConversation =
    useCallback(
      async (conversation) => {
        if (!conversation) {
          console.warn(
            "Cannot open empty conversation"
          );

          return;
        }

        const conversationId =
          conversation._id ||
          conversation.id;

        if (!conversationId) {
          console.error(
            "Conversation has no ID:",
            conversation
          );

          return;
        }

        console.log(
          "Opening conversation:",
          conversationId
        );

        /**
         * Reset previous state
         */

        setCurrentConversation(
          conversation
        );

        setMessages([]);

        setMessagesPage(1);

        setHasOlderMessages(
          true
        );

        setMessage("");

        setAttachments([]);

        setVoiceNotes([]);

        setAiSuggestions([]);

        setOtherUserTyping(
          false
        );

        setTyping(false);

        setMessagesError("");

        await loadMessages(
          conversationId,
          1,
          true
        );

        /*
         * Mark conversation as read.
         */

        try {
          await conversationService.markConversationRead(
            conversationId
          );

          setConversations(
            (previous) =>
              previous.map(
                (item) =>
                  (
                    item._id ||
                    item.id
                  ) ===
                  conversationId
                    ? {
                        ...item,
                        unreadCount: 0,
                      }
                    : item
              )
          );
        } catch (error) {
          console.error(
            "Unable to mark conversation read",
            error
          );
        }
      },
      [loadMessages]
    );

  /* ========================================================
     CLOSE CONVERSATION
  ======================================================== */

  const closeConversation =
    useCallback(() => {
      console.log(
        "Closing current conversation"
      );

      if (
        typingTimeout.current
      ) {
        clearTimeout(
          typingTimeout.current
        );
      }

      setCurrentConversation(
        null
      );

      setMessages([]);

      setMessage("");

      setAttachments([]);

      setVoiceNotes([]);

      setAiSuggestions([]);

      setTyping(false);

      setOtherUserTyping(
        false
      );

      setMessagesPage(1);

      setHasOlderMessages(
        true
      );
    }, []);

  /* ========================================================
     LOAD OLDER MESSAGES
  ======================================================== */

  const loadOlderMessages =
    useCallback(
      async () => {
        if (!currentConversation)
          return;

        if (!hasOlderMessages)
          return;

        const conversationId =
          currentConversation._id ||
          currentConversation.id;

        await loadMessages(
          conversationId,
          messagesPage + 1,
          false
        );
      },
      [
        currentConversation,
        hasOlderMessages,
        messagesPage,
        loadMessages,
      ]
    );

  /* ========================================================
     SEND MESSAGE
     Optimistic Update
  ======================================================== */

  const sendMessage =
    useCallback(
      async (
        text,
        extra = {}
      ) => {
        if (!currentConversation)
          return;

        if (
          !text?.trim() &&
          !extra.attachments?.length &&
          !extra.voiceNote
        ) {
          return;
        }

        const conversationId =
          currentConversation._id ||
          currentConversation.id;

        const tempId =
          `temp-${Date.now()}`;

        const optimisticMessage = {
          _id: tempId,
          id: tempId,
          conversationId,
          senderId: user?.id,
          senderRole: user?.role,
          sender:
            user?.role === "agent"
              ? "agent"
              : user?.role,
          text,
          message: text,
          attachments:
            extra.attachments || [],
          voiceNote:
            extra.voiceNote || null,
          status: "sending",
          createdAt:
            new Date().toISOString(),
        };

        setMessages(
          (previous) => [
            ...previous,
            optimisticMessage,
          ]
        );

        setSending(true);

        try {
          console.log(
            "Sending conversation message:",
            {
              conversationId,
              text,
            }
          );

          const saved =
            await conversationService.sendMessage(
              conversationId,
              {
                text,
                ...extra,
              }
            );

          console.log(
            "Message sent successfully:",
            saved
          );

          const savedMessage =
            saved?.data ||
            saved;

          setMessages(
            (previous) =>
              previous.map(
                (item) =>
                  item.id ===
                    tempId ||
                  item._id === tempId
                    ? {
                        ...savedMessage,
                        status:
                          "delivered",
                      }
                    : item
              )
          );

          setLastDelivered(
            savedMessage?._id ||
              savedMessage?.id ||
              null
          );

          setMessage("");

          setAttachments([]);

          setVoiceNotes([]);
        } catch (err) {
          console.error(
            "Unable to send message",
            err
          );

          /*
           * Add failed message
           * to offline queue.
           */

          setPendingMessages(
            (previous) => [
              ...previous,
              optimisticMessage,
            ]
          );

          setMessages(
            (previous) =>
              previous.map(
                (item) =>
                  item.id === tempId ||
                  item._id === tempId
                    ? {
                        ...item,
                        status:
                          "failed",
                      }
                    : item
              )
          );
        } finally {
          setSending(false);
        }
      },
      [
        currentConversation,
        user,
      ]
    );

  /* ========================================================
     RETRY FAILED MESSAGE
  ======================================================== */

  const retryMessage =
    useCallback(
      async (failedMessage) => {
        if (!failedMessage)
          return;

        await sendMessage(
          failedMessage.text ||
            failedMessage.message ||
            "",
          {
            attachments:
              failedMessage.attachments ||
              [],
            voiceNote:
              failedMessage.voiceNote ||
              null,
          }
        );

        setPendingMessages(
          (previous) =>
            previous.filter(
              (item) =>
                item.id !==
                  failedMessage.id &&
                item._id !==
                  failedMessage._id
            )
        );
      },
      [sendMessage]
    );

  /* ========================================================
     RETRY OFFLINE QUEUE
  ======================================================== */

  const retryPendingMessages =
    useCallback(
      async () => {
        if (
          !pendingMessages.length
        ) {
          return;
        }

        const queue = [
          ...pendingMessages,
        ];

        setPendingMessages([]);

        for (
          const pending of queue
        ) {
          await retryMessage(
            pending
          );
        }
      },
      [
        pendingMessages,
        retryMessage,
      ]
    );

  /* ========================================================
     ATTACHMENTS
  ======================================================== */

  const addAttachment =
    useCallback((file) => {
      if (!file) return;

      setAttachments(
        (previous) => [
          ...previous,
          file,
        ]
      );
    }, []);

  const removeAttachment =
    useCallback((index) => {
      setAttachments(
        (previous) =>
          previous.filter(
            (_, i) =>
              i !== index
          )
      );
    }, []);

  /* ========================================================
     UPLOAD ATTACHMENT
  ======================================================== */

  const uploadAttachment =
    useCallback(
      async (file) => {
        if (
          !currentConversation ||
          !file
        ) {
          return null;
        }

        const conversationId =
          currentConversation._id ||
          currentConversation.id;

        try {
          setUploadProgress(0);

          console.log(
            "Uploading conversation attachment:",
            file.name
          );

          const uploaded =
            await conversationService.uploadAttachment(
              conversationId,
              file
            );

          setUploadProgress(100);

          return (
            uploaded?.data ||
            uploaded
          );
        } catch (error) {
          console.error(
            "Attachment upload failed:",
            error
          );

          setUploadProgress(0);

          throw error;
        }
      },
      [currentConversation]
    );

  /* ========================================================
     VOICE NOTES
  ======================================================== */

  const addVoiceNote =
    useCallback(
      (audioBlob) => {
        if (!audioBlob) return;

        setVoiceNotes(
          (previous) => [
            ...previous,
            audioBlob,
          ]
        );
      },
      []
    );

  const sendVoiceNote =
    useCallback(
      async (audioBlob) => {
        if (
          !audioBlob ||
          !currentConversation
        ) {
          return;
        }

        await sendMessage(
          "",
          {
            voiceNote:
              audioBlob,
          }
        );
      },
      [
        currentConversation,
        sendMessage,
      ]
    );

  /* ========================================================
     AI REPLY SUGGESTIONS
  ======================================================== */

  const loadAISuggestions =
    useCallback(
      async () => {
        if (
          !currentConversation
        ) {
          return;
        }

        /*
         * The current conversation service
         * does not expose an AI suggestion
         * endpoint yet.
         *
         * Keep this safe for future integration.
         */

        try {
          console.log(
            "AI suggestions requested for:",
            currentConversation._id ||
              currentConversation.id
          );

          if (
            typeof conversationService.getAISuggestions !==
            "function"
          ) {
            setAiSuggestions(
              []
            );

            return;
          }

          const response =
            await conversationService.getAISuggestions(
              currentConversation._id ||
                currentConversation.id
            );

          setAiSuggestions(
            response?.suggestions ||
              response?.data ||
              []
          );
        } catch (err) {
          console.error(
            "Unable to load AI suggestions",
            err
          );

          setAiSuggestions(
            []
          );
        }
      },
      [currentConversation]
    );

  /* ========================================================
     START TYPING
  ======================================================== */

  const startTyping =
    useCallback(() => {
      if (
        !currentConversation
      ) {
        return;
      }

      if (typing) return;

      const conversationId =
        currentConversation._id ||
        currentConversation.id;

      setTyping(true);

      socket.emit(
        "typing_start",
        {
          conversationId,
          userId: user?.id,
          userName:
            user?.fullName ||
            user?.name,
        }
      );

      if (
        typingTimeout.current
      ) {
        clearTimeout(
          typingTimeout.current
        );
      }

      typingTimeout.current =
        setTimeout(() => {
          setTyping(false);

          socket.emit(
            "typing_stop",
            {
              conversationId,
              userId: user?.id,
            }
          );
        }, TYPING_TIMEOUT);
    }, [
      currentConversation,
      typing,
      user,
    ]);

  /* ========================================================
     STOP TYPING
  ======================================================== */

  const stopTyping =
    useCallback(() => {
      if (
        !currentConversation
      ) {
        return;
      }

      if (!typing) return;

      if (
        typingTimeout.current
      ) {
        clearTimeout(
          typingTimeout.current
        );
      }

      const conversationId =
        currentConversation._id ||
        currentConversation.id;

      setTyping(false);

      socket.emit(
        "typing_stop",
        {
          conversationId,
          userId: user?.id,
        }
      );
    }, [
      currentConversation,
      typing,
      user,
    ]);

  /* ========================================================
     MARK MESSAGE READ
  ======================================================== */

  const markMessageRead =
    useCallback(
      async (messageId) => {
        if (!messageId)
          return;

        try {
          await conversationService.markMessageRead?.(
            messageId
          );

          setLastReadMessageId(
            messageId
          );

          setMessages(
            (previous) =>
              previous.map(
                (item) =>
                  (
                    item._id ||
                    item.id
                  ) === messageId
                    ? {
                        ...item,
                        status:
                          "read",
                        readAt:
                          new Date().toISOString(),
                      }
                    : item
              )
          );

          socket.emit(
            "message_read",
            {
              conversationId:
                currentConversation?._id ||
                currentConversation?.id,
              messageId,
            }
          );
        } catch (error) {
          console.error(
            "Failed to mark message as read",
            error
          );
        }
      },
      [
        currentConversation,
      ]
    );

  /* ========================================================
     REFRESH CURRENT CONVERSATION
  ======================================================== */

  const refreshCurrentConversation =
    useCallback(
      async () => {
        if (
          !currentConversation
        ) {
          return;
        }

        const conversationId =
          currentConversation._id ||
          currentConversation.id;

        await loadMessages(
          conversationId,
          1,
          true
        );
      },
      [
        currentConversation,
        loadMessages,
      ]
    );

  /* ========================================================
     ARCHIVE CONVERSATION
  ======================================================== */

  const archiveConversation =
    useCallback(
      async (conversationId) => {
        if (!conversationId)
          return;

        try {
          if (
            typeof conversationService.archiveConversation !==
            "function"
          ) {
            console.warn(
              "archiveConversation is not available in conversationService"
            );

            return;
          }

          await conversationService.archiveConversation(
            conversationId
          );

          setConversations(
            (previous) =>
              previous.filter(
                (item) =>
                  (
                    item._id ||
                    item.id
                  ) !==
                  conversationId
              )
          );

          if (
            (
              currentConversation?._id ||
              currentConversation?.id
            ) === conversationId
          ) {
            closeConversation();
          }
        } catch (error) {
          console.error(
            "Unable to archive conversation",
            error
          );
        }
      },
      [
        currentConversation,
        closeConversation,
      ]
    );

  /* ========================================================
     PIN CONVERSATION
  ======================================================== */

  const pinConversation =
    useCallback(
      async (conversationId) => {
        if (!conversationId)
          return;

        try {
          if (
            typeof conversationService.pinConversation !==
            "function"
          ) {
            console.warn(
              "pinConversation is not available in conversationService"
            );

            return;
          }

          const response =
            await conversationService.pinConversation(
              conversationId
            );

          const updated =
            response?.data ||
            response;

          if (updated) {
            setConversations(
              (previous) =>
                previous.map(
                  (item) =>
                    (
                      item._id ||
                      item.id
                    ) ===
                    conversationId
                      ? {
                          ...item,
                          ...updated,
                        }
                      : item
                )
            );
          }
        } catch (error) {
          console.error(
            "Unable to pin conversation",
            error
          );
        }
      },
      []
    );

  /* ========================================================
     SOCKET.IO LISTENERS
  ======================================================== */

  useEffect(() => {
    /* ---------------------------------------
       Conversation Created
    --------------------------------------- */

    const handleConversationCreated = (
      conversation
    ) => {
      console.log(
        "Socket conversation created:",
        conversation
      );

      setConversations(
        (previous) => [
          conversation,
          ...previous,
        ]
      );
    };

    /* ---------------------------------------
       Conversation Updated
    --------------------------------------- */

    const handleConversationUpdated = (
      updatedConversation
    ) => {
      console.log(
        "Socket conversation updated:",
        updatedConversation
      );

      const updatedId =
        updatedConversation?._id ||
        updatedConversation?.id;

      setConversations(
        (previous) =>
          previous.map(
            (conversation) =>
              (
                conversation._id ||
                conversation.id
              ) === updatedId
                ? {
                    ...conversation,
                    ...updatedConversation,
                  }
                : conversation
          )
      );

      if (
        currentConversation &&
        (
          currentConversation._id ||
          currentConversation.id
        ) === updatedId
      ) {
        setCurrentConversation(
          (previous) => ({
            ...previous,
            ...updatedConversation,
          })
        );
      }
    };

    /* ---------------------------------------
       Conversation Deleted
    --------------------------------------- */

    const handleConversationDeleted = ({
      conversationId,
    }) => {
      console.log(
        "Socket conversation deleted:",
        conversationId
      );

      setConversations(
        (previous) =>
          previous.filter(
            (conversation) =>
              (
                conversation._id ||
                conversation.id
              ) !==
              conversationId
          )
      );
    };

    /* ---------------------------------------
       Incoming Message
    --------------------------------------- */

    const handleIncomingMessage = (
      incomingMessage
    ) => {
      console.log(
        "Socket incoming message:",
        incomingMessage
      );

      const incomingConversationId =
        incomingMessage?.conversationId;

      const currentId =
        currentConversation?._id ||
        currentConversation?.id;

      /**
       * Update open conversation
       */

      if (
        currentConversation &&
        incomingConversationId ===
          currentId
      ) {
        setMessages(
          (previous) => {
            const incomingId =
              incomingMessage?._id ||
              incomingMessage?.id;

            const exists =
              previous.some(
                (item) =>
                  (
                    item._id ||
                    item.id
                  ) ===
                  incomingId
              );

            if (exists)
              return previous;

            return [
              ...previous,
              incomingMessage,
            ];
          }
        );
      }

      /**
       * Update conversation preview
       */

      setConversations(
        (previous) =>
          previous
            .map(
              (conversation) =>
                (
                  conversation._id ||
                  conversation.id
                ) ===
                incomingConversationId
                  ? {
                      ...conversation,
                      lastMessage:
                        incomingMessage,
                      unreadCount:
                        (
                          conversation.unreadCount ||
                          0
                        ) + 1,
                      updatedAt:
                        incomingMessage.createdAt ||
                        new Date().toISOString(),
                    }
                  : conversation
            )
            .sort(
              (a, b) =>
                new Date(
                  b.updatedAt
                ) -
                new Date(
                  a.updatedAt
                )
            )
      );
    };

    /* ---------------------------------------
       Read Receipt
    --------------------------------------- */

    const handleReadReceipt = ({
      messageId,
      conversationId,
    }) => {
      if (
        currentConversation &&
        conversationId ===
          (
            currentConversation._id ||
            currentConversation.id
          )
      ) {
        setMessages(
          (previous) =>
            previous.map(
              (message) =>
                (
                  message._id ||
                  message.id
                ) === messageId
                  ? {
                      ...message,
                      status:
                        "read",
                      readAt:
                        new Date().toISOString(),
                    }
                  : message
            )
        );
      }
    };

    /* ---------------------------------------
       Typing Start
    --------------------------------------- */

    const handleTypingStart = ({
      conversationId,
      userId,
    }) => {
      if (
        !currentConversation ||
        conversationId !==
          (
            currentConversation._id ||
            currentConversation.id
          )
      ) {
        return;
      }

      if (
        userId === user?.id
      ) {
        return;
      }

      setOtherUserTyping(
        true
      );
    };

    /* ---------------------------------------
       Typing Stop
    --------------------------------------- */

    const handleTypingStop = ({
      conversationId,
      userId,
    }) => {
      if (
        !currentConversation ||
        conversationId !==
          (
            currentConversation._id ||
            currentConversation.id
          )
      ) {
        return;
      }

      if (
        userId === user?.id
      ) {
        return;
      }

      setOtherUserTyping(
        false
      );
    };

    socket.on(
      "conversation_created",
      handleConversationCreated
    );

    socket.on(
      "conversation_updated",
      handleConversationUpdated
    );

    socket.on(
      "conversation_deleted",
      handleConversationDeleted
    );

    socket.on(
      "message_received",
      handleIncomingMessage
    );

    socket.on(
      "message_read",
      handleReadReceipt
    );

    socket.on(
      "typing_start",
      handleTypingStart
    );

    socket.on(
      "typing_stop",
      handleTypingStop
    );

    return () => {
      socket.off(
        "conversation_created",
        handleConversationCreated
      );

      socket.off(
        "conversation_updated",
        handleConversationUpdated
      );

      socket.off(
        "conversation_deleted",
        handleConversationDeleted
      );

      socket.off(
        "message_received",
        handleIncomingMessage
      );

      socket.off(
        "message_read",
        handleReadReceipt
      );

      socket.off(
        "typing_start",
        handleTypingStart
      );

      socket.off(
        "typing_stop",
        handleTypingStop
      );
    };
  }, [
    currentConversation,
    user,
  ]);

  /* ========================================================
     INITIAL DATA LOAD
  ======================================================== */

  useEffect(() => {
    if (!autoLoad) return;

    refreshConversations();
  }, [
    autoLoad,
    refreshConversations,
  ]);

  /* ========================================================
     SEARCH / FILTER REFRESH
  ======================================================== */

  useEffect(() => {
    if (!autoLoad) return;

    refreshConversations();
  }, [
    search,
    filters,
  ]);

  /* ========================================================
     PAGINATION
  ======================================================== */

  useEffect(() => {
    if (!autoLoad) return;

    if (page === 1) return;

    loadConversations(false);
  }, [
    page,
  ]);

  /* ========================================================
     RETRY OFFLINE QUEUE
  ======================================================== */

  useEffect(() => {
    if (!isOnline) return;

    if (!pendingMessages.length)
      return;

    retryPendingMessages();
  }, [
    isOnline,
    pendingMessages,
    retryPendingMessages,
  ]);

  /* ========================================================
     CLEANUP TYPING TIMER
  ======================================================== */

  useEffect(() => {
    return () => {
      if (
        typingTimeout.current
      ) {
        clearTimeout(
          typingTimeout.current
        );
      }
    };
  }, []);

  /* ========================================================
     PUBLIC API
  ======================================================== */

  return {

    /* Auth */

    user,

    hasRole,

    connected,

    isOnline,

    /* Conversation List */

    conversations,

    loading,

    error,

    total,

    unreadCount,

    page,

    hasMore,

    search,

    filters,

    /* Current Conversation */

    currentConversation,

    openConversation,

    closeConversation,

    /* Messages */

    messages,

    messagesLoading,

    messagesError,

    messagesPage,

    hasOlderMessages,

    message,

    setMessage,

    sending,

    lastDelivered,

    lastReadMessageId,

    /* Attachments */

    attachments,

    addAttachment,

    removeAttachment,

    uploadAttachment,

    uploadProgress,

    /* Voice Notes */

    voiceNotes,

    addVoiceNote,

    sendVoiceNote,

    /* Typing */

    typing,

    otherUserTyping,

    startTyping,

    stopTyping,

    /* Offline */

    pendingMessages,

    retryPendingMessages,

    retryMessage,

    /* AI */

    aiSuggestions,

    loadAISuggestions,

    /* Conversation Actions */

    refreshConversations,

    loadConversations,

    loadMore,

    searchConversations,

    updateFilters,

    clearSearch,

    archiveConversation,

    pinConversation,

    /* Message Actions */

    loadMessages,

    loadOlderMessages,

    refreshCurrentConversation,

    sendMessage,

    markMessageRead,

  };

};

export default useConversations;