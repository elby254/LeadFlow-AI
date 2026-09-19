/**
 * =========================================================
 * VIEWER CONVERSATION CENTER
 * =========================================================
 *
 * Path
 * ----
 * src/pages/conversations/viewerConversationCenter.jsx
 *
 * Purpose
 * -------
 * Main page-level controller for the viewer/customer
 * conversation module.
 *
 * Responsibilities
 * ---------------------------------------------------------
 * ✓ Load the viewer's conversations
 * ✓ Display the viewer's conversation list
 * ✓ Select an active conversation
 * ✓ Load messages for the active conversation
 * ✓ Send messages
 * ✓ Update the conversation preview after sending
 * ✓ Display conversation header
 * ✓ Display message history
 * ✓ Display message composer
 * ✓ Display property context
 * ✓ Handle loading states
 * ✓ Handle errors
 * ✓ Handle empty conversation state
 *
 * Component Workflow
 * ---------------------------------------------------------
 *
 * Viewer
 *   ↓
 * Viewer Conversation Center
 *   ↓
 * Conversation List
 *   ↓
 * Select Conversation
 *   ↓
 * Conversation Header
 *   ↓
 * Message List
 *   ↓
 * Message Composer
 *   ↓
 * Send Message
 *   ↓
 * Conversation Service
 *
 * Property context is displayed through:
 *
 * ConversationPropertyCard
 *
 * =========================================================
 *
 * IMPORTANT
 * ---------------------------------------------------------
 * MongoDB conversation identifiers use `_id`.
 *
 * Example:
 *
 * _id: ObjectId("6a426c07b8e66972b176c0af")
 *
 * Therefore `_id` is always preferred over `id`.
 *
 * =========================================================
 */

import { useCallback, useEffect, useState } from "react";

import { AlertCircle, MessageSquare, RefreshCw } from "lucide-react";

import conversationService from "../../services/conversationService";

import ConversationList from "../../components/dashboard/conversation/conversationList";

import ConversationHeader from "../../components/dashboard/conversation/conversationHeader";

import MessageList from "../../components/dashboard/conversation/messageList";

import MessageComposer from "../../components/dashboard/conversation/messageComposer";

import ConversationPropertyCard from "../../components/dashboard/conversation/conversationPropertyCard";

/**
 * =========================================================
 * HELPERS
 * =========================================================
 */

/**
 * Safely extract an array from common API response
 * structures.
 */
const extractArray = (response) => {
  if (Array.isArray(response)) {
    return response;
  }

  if (Array.isArray(response?.data)) {
    return response.data;
  }

  if (Array.isArray(response?.data?.data)) {
    return response.data.data;
  }

  if (Array.isArray(response?.data?.conversations)) {
    return response.data.conversations;
  }

  if (Array.isArray(response?.conversations)) {
    return response.conversations;
  }

  if (Array.isArray(response?.messages)) {
    return response.messages;
  }

  if (Array.isArray(response?.data?.messages)) {
    return response.data.messages;
  }

  return [];
};

/**
 * Safely extract messages from a conversation response.
 */
const extractMessages = (response) => {
  if (Array.isArray(response)) {
    return response;
  }

  if (Array.isArray(response?.data)) {
    return response.data;
  }

  if (Array.isArray(response?.data?.messages)) {
    return response.data.messages;
  }

  if (Array.isArray(response?.messages)) {
    return response.messages;
  }

  return [];
};

/**
 * Resolve MongoDB conversation ID.
 *
 * `_id` is the canonical MongoDB identifier.
 *
 * Example:
 *
 * 6a426c07b8e66972b176c0af
 */
const getConversationId = (conversation) => {
  if (!conversation) {
    return null;
  }

  return (
    conversation?._id ||
    conversation?.id ||
    null
  );
};

/**
 * =========================================================
 * COMPONENT
 * =========================================================
 */

const ViewerConversationCenter = () => {
  /**
   * =======================================================
   * CONVERSATIONS
   * =======================================================
   */

  const [conversations, setConversations] = useState([]);

  /**
   * =======================================================
   * ACTIVE CONVERSATION
   * =======================================================
   */

  const [activeConversation, setActiveConversation] =
    useState(null);

  /**
   * =======================================================
   * MESSAGES
   * =======================================================
   */

  const [messages, setMessages] = useState([]);

  /**
   * =======================================================
   * LOADING STATES
   * =======================================================
   */

  const [loading, setLoading] = useState(true);

  const [messagesLoading, setMessagesLoading] =
    useState(false);

  /**
   * =======================================================
   * SENDING STATE
   * =======================================================
   */

  const [sending, setSending] = useState(false);

  /**
   * =======================================================
   * ERROR
   * =======================================================
   */

  const [error, setError] = useState("");

  const [messageError, setMessageError] = useState("");

  /**
   * =======================================================
   * LOAD CONVERSATIONS
   * =======================================================
   */

  const loadConversations = useCallback(
    async (openFirst = true) => {
      try {
        console.log(
          "ViewerConversationCenter: Loading viewer conversations..."
        );

        setLoading(true);

        setError("");

        const response =
          await conversationService.getViewerConversations();

        console.log(
          "ViewerConversationCenter: Conversations response:",
          response
        );

        const conversationData =
          extractArray(response);

        console.log(
          "ViewerConversationCenter: Normalized conversations:",
          conversationData
        );

        setConversations(conversationData);

        /**
         * Automatically open the first conversation
         * when no conversation is currently active.
         */
        if (
          openFirst &&
          conversationData.length > 0
        ) {
          const currentId =
            getConversationId(
              activeConversation
            );

          const firstConversation =
            conversationData[0];

          const firstId =
            getConversationId(
              firstConversation
            );

          /**
           * Only automatically select the first
           * conversation if there isn't already
           * an active conversation.
           */
          if (!currentId) {
            console.log(
              "ViewerConversationCenter: Opening first conversation:",
              firstId
            );

            setActiveConversation(
              firstConversation
            );

            return firstConversation;
          }

          /**
           * Refresh the active conversation object
           * from the latest conversation list.
           */
          const refreshedActive =
            conversationData.find(
              (conversation) =>
                getConversationId(
                  conversation
                ) === currentId
            );

          if (refreshedActive) {
            setActiveConversation(
              refreshedActive
            );

            return refreshedActive;
          }
        }

        /**
         * No conversations available.
         */
        if (conversationData.length === 0) {
          setActiveConversation(null);

          setMessages([]);
        }

        return null;
      } catch (requestError) {
        console.error(
          "ViewerConversationCenter: Unable to load conversations:",
          requestError
        );

        setError(
          requestError?.response?.data?.message ||
            requestError?.message ||
            "Unable to load your conversations."
        );

        return null;
      } finally {
        setLoading(false);
      }
    },
    [activeConversation]
  );

  /**
   * =======================================================
   * LOAD MESSAGES
   * =======================================================
   */

  const loadMessages = useCallback(
    async (conversation) => {
      const conversationId =
        getConversationId(conversation);

      if (!conversationId) {
        console.error(
          "ViewerConversationCenter: Conversation ID is missing."
        );

        setMessages([]);

        setMessageError(
          "Unable to load this conversation because its ID is missing."
        );

        return;
      }

      try {
        console.log(
          "ViewerConversationCenter: Loading messages for conversation:",
          conversationId
        );

        setMessagesLoading(true);

        setMessageError("");

        const response =
          await conversationService.getConversationMessages(
            conversationId
          );

        console.log(
          "ViewerConversationCenter: Messages response:",
          response
        );

        const messageData =
          extractMessages(response);

        console.log(
          "ViewerConversationCenter: Normalized messages:",
          messageData
        );

        setMessages(messageData);
      } catch (requestError) {
        console.error(
          "ViewerConversationCenter: Unable to load messages:",
          requestError
        );

        setMessages([]);

        setMessageError(
          requestError?.response?.data?.message ||
            requestError?.message ||
            "Unable to load conversation messages."
        );
      } finally {
        setMessagesLoading(false);
      }
    },
    []
  );

  /**
   * =======================================================
   * SELECT CONVERSATION
   * =======================================================
   */

  const handleConversationSelect = async (
    conversation
  ) => {
    const conversationId =
      getConversationId(conversation);

    console.log(
      "ViewerConversationCenter: Selected conversation:",
      conversationId
    );

    if (!conversationId) {
      console.error(
        "ViewerConversationCenter: Selected conversation has no ID:",
        conversation
      );

      setMessageError(
        "Unable to open this conversation because its ID is missing."
      );

      return;
    }

    /**
     * Set active conversation immediately so the
     * interface responds without waiting for the API.
     */
    setActiveConversation(conversation);

    setMessages([]);

    await loadMessages(conversation);
  };

  /**
   * =======================================================
   * SEND MESSAGE
   * =======================================================
   */

  const handleSendMessage = async (
    messageValue
  ) => {
    const trimmedMessage =
      typeof messageValue === "string"
        ? messageValue.trim()
        : "";

    const conversationId =
      getConversationId(
        activeConversation
      );

    /**
     * Prevent empty messages.
     */
    if (!trimmedMessage) {
      return;
    }

    /**
     * Prevent sending without an active conversation.
     */
    if (!conversationId) {
      console.error(
        "ViewerConversationCenter: Cannot send message without conversation ID."
      );

      setMessageError(
        "Please select a conversation before sending a message."
      );

      return;
    }

    try {
      console.log(
        "ViewerConversationCenter: Sending message:",
        {
          conversationId,
          message: trimmedMessage,
        }
      );

      setSending(true);

      setMessageError("");

      const response =
        await conversationService.sendMessage({
          conversationId,
          message: trimmedMessage,
        });

      console.log(
        "ViewerConversationCenter: Send message response:",
        response
      );

      /**
       * Some backends return:
       *
       * { data: message }
       *
       * while others may return:
       *
       * { message: ... }
       */
      const sentMessage =
        response?.data?.message ||
        response?.data ||
        response?.message ||
        null;

      /**
       * Add the newly created message locally.
       *
       * If the backend returns no message object,
       * reload the conversation messages instead.
       */
      if (sentMessage) {
        setMessages((previousMessages) => [
          ...previousMessages,
          sentMessage,
        ]);
      } else {
        await loadMessages(
          activeConversation
        );
      }

      /**
       * Update the last message preview in the
       * conversation list.
       */
      setConversations(
        (previousConversations) =>
          previousConversations.map(
            (conversation) => {
              const currentId =
                getConversationId(
                  conversation
                );

              if (
                currentId !==
                conversationId
              ) {
                return conversation;
              }

              return {
                ...conversation,

                lastMessage:
                  trimmedMessage,

                lastMessageAt:
                  new Date().toISOString(),

                updatedAt:
                  new Date().toISOString(),
              };
            }
          )
      );

      /**
       * Update active conversation preview too.
       */
      setActiveConversation(
        (previousConversation) => {
          if (!previousConversation) {
            return previousConversation;
          }

          return {
            ...previousConversation,

            lastMessage:
              trimmedMessage,

            lastMessageAt:
              new Date().toISOString(),

            updatedAt:
              new Date().toISOString(),
          };
        }
      );
    } catch (requestError) {
      console.error(
        "ViewerConversationCenter: Unable to send message:",
        requestError
      );

      setMessageError(
        requestError?.response?.data?.message ||
          requestError?.message ||
          "Unable to send your message."
      );
    } finally {
      setSending(false);
    }
  };

  /**
   * =======================================================
   * INITIAL LOAD
   * =======================================================
   */

  useEffect(() => {
    let mounted = true;

    const initialise = async () => {
      if (!mounted) {
        return;
      }

      const firstConversation =
        await loadConversations(true);

      /**
       * Open the first conversation's messages.
       *
       * This is separate from loading the conversation
       * list so that the MongoDB `_id` is correctly
       * resolved before requesting messages.
       */
      if (
        mounted &&
        firstConversation
      ) {
        await loadMessages(
          firstConversation
        );
      }
    };

    initialise();

    return () => {
      mounted = false;
    };
  }, [loadConversations, loadMessages]);

  /**
   * =======================================================
   * ACTIVE CONVERSATION CHANGE
   * =======================================================
   *
   * This handles conversations selected from the list.
   *
   * The initial first conversation is already loaded by
   * initialise(), so we avoid duplicating that request.
   */

  /**
   * =======================================================
   * RETRY
   * =======================================================
   */

  const handleRetry = async () => {
    console.log(
      "ViewerConversationCenter: Retrying conversation load..."
    );

    setMessageError("");

    const refreshedConversation =
      await loadConversations(false);

    const conversationToLoad =
      refreshedConversation ||
      activeConversation;

    if (conversationToLoad) {
      await loadMessages(
        conversationToLoad
      );
    }
  };

  /**
   * =======================================================
   * LOADING VIEW
   * =======================================================
   */

  if (loading) {
    return (
      <section className="h-[calc(100vh-170px)]">
        <div className="flex h-full items-center justify-center rounded-2xl border border-slate-800 bg-slate-950">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-cyan-500/10">
              <MessageSquare
                size={24}
                className="text-cyan-400"
              />
            </div>

            <h2 className="text-lg font-semibold text-white">
              Loading conversations...
            </h2>

            <p className="mt-2 text-sm text-slate-400">
              Loading your conversations and
              messages.
            </p>
          </div>
        </div>
      </section>
    );
  }

  /**
   * =======================================================
   * ERROR VIEW
   * =======================================================
   */

  if (
    error &&
    conversations.length === 0
  ) {
    return (
      <section className="h-[calc(100vh-170px)]">
        <div className="flex h-full items-center justify-center rounded-2xl border border-slate-800 bg-slate-950 p-8">
          <div className="max-w-md text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-500/10">
              <AlertCircle
                size={28}
                className="text-red-400"
              />
            </div>

            <h2 className="text-xl font-semibold text-white">
              Unable to load conversations
            </h2>

            <p className="mt-3 text-sm leading-6 text-slate-400">
              {error}
            </p>

            <button
              type="button"
              onClick={handleRetry}
              className="
                mt-6
                inline-flex
                items-center
                gap-2
                rounded-xl
                bg-cyan-500
                px-5
                py-3
                font-semibold
                text-slate-950
                transition
                hover:bg-cyan-400
              "
            >
              <RefreshCw size={17} />

              Try Again
            </button>
          </div>
        </div>
      </section>
    );
  }

  /**
   * =======================================================
   * PAGE
   * =======================================================
   */

  return (
    <section className="h-[calc(100vh-170px)] min-h-[600px]">
      <div
        className="
          grid
          h-full
          min-h-0
          overflow-hidden
          rounded-2xl
          border
          border-slate-800
          bg-slate-950

          lg:grid-cols-[300px_minmax(0,1fr)_280px]
        "
      >
        {/* ==================================================
            LEFT
            CONVERSATION LIST
        ================================================== */}

        <aside className="min-h-0 border-r border-slate-800">
          <ConversationList
            conversations={conversations}
            activeConversation={
              activeConversation
            }
            onConversationSelect={
              handleConversationSelect
            }
          />
        </aside>

        {/* ==================================================
            CENTER
            ACTIVE CONVERSATION
        ================================================== */}

        <main className="flex min-h-0 min-w-0 flex-col">
          {activeConversation ? (
            <>
              {/* ==========================================
                  CONVERSATION HEADER
              ========================================== */}

              <div className="shrink-0">
                <ConversationHeader
                  conversation={
                    activeConversation
                  }
                />
              </div>

              {/* ==========================================
                  MESSAGE ERROR
              ========================================== */}

              {messageError && (
                <div
                  className="
                    flex
                    shrink-0
                    items-center
                    gap-3
                    border-b
                    border-red-500/20
                    bg-red-500/10
                    px-5
                    py-3
                    text-sm
                    text-red-300
                  "
                >
                  <AlertCircle
                    size={17}
                    className="shrink-0"
                  />

                  <span>
                    {messageError}
                  </span>
                </div>
              )}

              {/* ==========================================
                  MESSAGE LIST
              ========================================== */}

              <div className="min-h-0 flex-1">
                <MessageList
                  messages={messages}
                  loading={messagesLoading}
                  conversation={
                    activeConversation
                  }
                />
              </div>

              {/* ==========================================
                  MESSAGE COMPOSER
              ========================================== */}

              <div className="shrink-0">
                <MessageComposer
                  onSend={
                    handleSendMessage
                  }
                  sending={sending}
                  disabled={
                    !activeConversation
                  }
                />
              </div>
            </>
          ) : (
            /* ==========================================
               NO ACTIVE CONVERSATION
            ========================================== */

            <div className="flex h-full items-center justify-center p-8 text-center">
              <div className="max-w-sm">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-cyan-500/10">
                  <MessageSquare
                    size={30}
                    className="text-cyan-400"
                  />
                </div>

                <h2 className="text-xl font-semibold text-white">
                  Select a conversation
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-400">
                  Select a conversation from the
                  list to view your messages and
                  continue chatting with your
                  agent.
                </p>
              </div>
            </div>
          )}
        </main>

        {/* ==================================================
            RIGHT
            PROPERTY CONTEXT
        ================================================== */}

        <aside className="min-h-0 overflow-y-auto border-l border-slate-800">
          <ConversationPropertyCard
            conversation={
              activeConversation
            }
          />
        </aside>
      </div>
    </section>
  );
};

export default ViewerConversationCenter;