/**
 * =========================================================
 * CONVERSATION CENTER
 * =========================================================
 *
 * Path
 * ----
 * src/components/dashboard/conversations/conversationCenter.jsx
 *
 * Purpose
 * -------
 * Main conversation workspace for the viewer/customer.
 *
 * Responsibilities
 * ---------------------------------------------------------
 * ✓ Load and display the viewer's conversations
 * ✓ Select the active conversation
 * ✓ Display conversation header
 * ✓ Display message history
 * ✓ Display message composer
 * ✓ Display property context
 * ✓ Handle sending messages
 * ✓ Show loading state
 * ✓ Show conversation errors
 * ✓ Keep the viewer scoped to their own conversations
 *
 * Components Used
 * ---------------------------------------------------------
 * • ConversationList
 * • ConversationHeader
 * • MessageList
 * • MessageComposer
 * • ConversationPropertyCard
 *
 * Service
 * ---------------------------------------------------------
 * conversationService
 *
 * IMPORTANT
 * ---------------------------------------------------------
 * This component does NOT directly render the viewer sidebar.
 *
 * MainLayout / ViewerSidebar handles application navigation.
 *
 * This component is only responsible for the conversation
 * workspace itself.
 *
 * =========================================================
 */

import { useEffect, useState } from "react";

import {
  MessageSquare,
  AlertCircle,
} from "lucide-react";

import ConversationList from "./conversationList";
import ConversationHeader from "./conversationHeader";
import MessageList from "./messageList";
import MessageComposer from "./messageComposer";
import ConversationPropertyCard from "./conversationPropertyCard";

import conversationService from "../../../services/conversationService";

/**
 * =========================================================
 * HELPERS
 * =========================================================
 */

/**
 * Safely extract an array from common API response shapes.
 *
 * Supports:
 *
 * [
 *   ...
 * ]
 *
 * {
 *   data: [...]
 * }
 *
 * {
 *   conversations: [...]
 * }
 *
 * {
 *   data: {
 *     conversations: [...]
 *   }
 * }
 */
const extractArray = (response) => {
  if (Array.isArray(response)) {
    return response;
  }

  if (Array.isArray(response?.data)) {
    return response.data;
  }

  if (Array.isArray(response?.conversations)) {
    return response.conversations;
  }

  if (
    Array.isArray(
      response?.data?.conversations
    )
  ) {
    return response.data.conversations;
  }

  return [];
};

/**
 * Safely extract messages.
 */
const extractMessages = (response) => {
  if (Array.isArray(response)) {
    return response;
  }

  if (Array.isArray(response?.data)) {
    return response.data;
  }

  if (Array.isArray(response?.messages)) {
    return response.messages;
  }

  if (
    Array.isArray(
      response?.data?.messages
    )
  ) {
    return response.data.messages;
  }

  return [];
};

/**
 * Safely extract a newly created message.
 */
const extractMessage = (response) => {
  if (!response) {
    return null;
  }

  if (response?.data?.message) {
    return response.data.message;
  }

  if (
    response?.data &&
    !Array.isArray(response.data)
  ) {
    return response.data;
  }

  if (response?.message) {
    return response.message;
  }

  return response;
};

/**
 * Get the canonical conversation ID.
 *
 * MongoDB uses:
 *
 * _id
 *
 * The UI may also receive:
 *
 * id
 */
const getConversationId = (
  conversation
) => {
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

const ConversationCenter = () => {
  /*
  ==========================================================
  CONVERSATIONS
  ==========================================================
  */

  const [
    conversations,
    setConversations,
  ] = useState([]);

  /*
  ==========================================================
  ACTIVE CONVERSATION
  ==========================================================
  */

  const [
    activeConversation,
    setActiveConversation,
  ] = useState(null);

  /*
  ==========================================================
  MESSAGES
  ==========================================================
  */

  const [
    messages,
    setMessages,
  ] = useState([]);

  /*
  ==========================================================
  LOADING STATES
  ==========================================================
  */

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    messagesLoading,
    setMessagesLoading,
  ] = useState(false);

  const [
    sending,
    setSending,
  ] = useState(false);

  /*
  ==========================================================
  ERROR STATES
  ==========================================================
  */

  const [
    error,
    setError,
  ] = useState("");

  const [
    messageError,
    setMessageError,
  ] = useState("");

  /*
  ==========================================================
  MESSAGE INPUT
  ==========================================================
  */

  const [
    message,
    setMessage,
  ] = useState("");

  /*
  ==========================================================
  LOAD VIEWER CONVERSATIONS
  ==========================================================
  */

  const loadConversations =
    async () => {
      try {
        console.log(
          "ConversationCenter: Loading viewer conversations..."
        );

        setLoading(true);
        setError("");

        const response =
          await conversationService.getViewerConversations();

        console.log(
          "ConversationCenter: Conversations response:",
          response
        );

        const conversationData =
          extractArray(response);

        console.log(
          "ConversationCenter: Normalized conversations:",
          conversationData
        );

        setConversations(
          conversationData
        );

        /*
        ------------------------------------------------------
        Automatically open the first conversation.
        ------------------------------------------------------
        */

        if (
          conversationData.length > 0
        ) {
          await openConversation(
            conversationData[0]
          );
        } else {
          setActiveConversation(
            null
          );

          setMessages([]);
        }
      } catch (err) {
        console.error(
          "ConversationCenter: Failed to load conversations:",
          err
        );

        setError(
          err?.response?.data?.message ||
            "Unable to load your conversations."
        );
      } finally {
        setLoading(false);
      }
    };

  /*
  ==========================================================
  OPEN CONVERSATION
  ==========================================================
  */

  const openConversation =
    async (conversation) => {
      const conversationId =
        getConversationId(
          conversation
        );

      if (!conversationId) {
        console.error(
          "ConversationCenter: Conversation ID is missing:",
          conversation
        );

        setMessageError(
          "Unable to open this conversation because its ID is missing."
        );

        return;
      }

      try {
        console.log(
          "ConversationCenter: Opening conversation:",
          conversationId
        );

        setActiveConversation(
          conversation
        );

        setMessages([]);
        setMessagesLoading(true);
        setMessageError("");

        /*
        ------------------------------------------------------
        Load messages using MongoDB conversation _id.
        ------------------------------------------------------
        */

        const response =
          await conversationService.getConversationMessages(
            conversationId
          );

        console.log(
          "ConversationCenter: Messages response:",
          response
        );

        const messageData =
          extractMessages(response);

        console.log(
          "ConversationCenter: Normalized messages:",
          messageData
        );

        setMessages(
          messageData
        );
      } catch (err) {
        console.error(
          "ConversationCenter: Failed to load messages:",
          err
        );

        setMessages([]);

        setMessageError(
          err?.response?.data?.message ||
            "Unable to load conversation messages."
        );
      } finally {
        setMessagesLoading(false);
      }
    };

  /*
  ==========================================================
  SEND MESSAGE
  ==========================================================
  */

  const handleSendMessage =
    async () => {
      const trimmedMessage =
        message.trim();

      const conversationId =
        getConversationId(
          activeConversation
        );

      /*
      --------------------------------------------------------
      Validation
      --------------------------------------------------------
      */

      if (!trimmedMessage) {
        return;
      }

      if (!conversationId) {
        console.error(
          "ConversationCenter: Cannot send message without conversation ID."
        );

        setMessageError(
          "Unable to send message because the conversation ID is missing."
        );

        return;
      }

      try {
        console.log(
          "ConversationCenter: Sending message to conversation:",
          conversationId
        );

        setSending(true);
        setMessageError("");

        /*
        ------------------------------------------------------
        Send message.
        ------------------------------------------------------
        */

        const response =
          await conversationService.sendMessage(
            {
              conversationId,
              message:
                trimmedMessage,
            }
          );

        console.log(
          "ConversationCenter: Send message response:",
          response
        );

        const newMessage =
          extractMessage(response);

        /*
        ------------------------------------------------------
        Add newly created message to the current chat.
        ------------------------------------------------------
        */

        if (newMessage) {
          setMessages(
            (previous) => [
              ...previous,
              newMessage,
            ]
          );
        }

        /*
        ------------------------------------------------------
        Clear composer.
        ------------------------------------------------------
        */

        setMessage("");

        /*
        ------------------------------------------------------
        Update conversation preview locally.
        ------------------------------------------------------
        */

        setConversations(
          (previous) =>
            previous.map(
              (conversation) => {
                const currentId =
                  getConversationId(
                    conversation
                  );

                if (
                  String(
                    currentId
                  ) !==
                  String(
                    conversationId
                  )
                ) {
                  return conversation;
                }

                return {
                  ...conversation,
                  lastMessage:
                    trimmedMessage,
                  updatedAt:
                    new Date().toISOString(),
                };
              }
            )
        );

        /*
        ------------------------------------------------------
        Keep active conversation preview synchronized.
        ------------------------------------------------------
        */

        setActiveConversation(
          (previous) => {
            if (!previous) {
              return previous;
            }

            return {
              ...previous,
              lastMessage:
                trimmedMessage,
              updatedAt:
                new Date().toISOString(),
            };
          }
        );
      } catch (err) {
        console.error(
          "ConversationCenter: Failed to send message:",
          err
        );

        setMessageError(
          err?.response?.data?.message ||
            "Unable to send your message. Please try again."
        );
      } finally {
        setSending(false);
      }
    };

  /*
  ==========================================================
  MESSAGE INPUT
  ==========================================================
  */

  const handleMessageChange =
    (event) => {
      setMessage(
        event.target.value
      );

      /*
      Clear an old send error as soon
      as the viewer starts typing again.
      */

      if (messageError) {
        setMessageError("");
      }
    };

  /*
  ==========================================================
  KEYBOARD SEND
  ==========================================================
  */

  const handleMessageKeyDown =
    (event) => {
      /*
      Enter sends.
      Shift + Enter creates a new line.
      */

      if (
        event.key === "Enter" &&
        !event.shiftKey
      ) {
        event.preventDefault();

        handleSendMessage();
      }
    };

  /*
  ==========================================================
  INITIAL LOAD
  ==========================================================
  */

  useEffect(() => {
    loadConversations();
  }, []);

  /*
  ==========================================================
  LOADING VIEW
  ==========================================================
  */

  if (loading) {
    return (
      <section className="flex h-full min-h-[600px] items-center justify-center rounded-2xl border border-slate-800 bg-slate-950">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-slate-700 border-t-cyan-500" />

          <p className="text-sm text-slate-400">
            Loading your conversations...
          </p>
        </div>
      </section>
    );
  }

  /*
  ==========================================================
  ERROR VIEW
  ==========================================================
  */

  if (
    error &&
    conversations.length === 0
  ) {
    return (
      <section className="flex min-h-[500px] items-center justify-center rounded-2xl border border-red-500/20 bg-slate-950 p-8">
        <div className="max-w-md text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10">
            <AlertCircle
              size={24}
              className="text-red-400"
            />
          </div>

          <h2 className="text-lg font-semibold text-white">
            Unable to load conversations
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-400">
            {error}
          </p>

          <button
            type="button"
            onClick={loadConversations}
            className="mt-5 rounded-xl bg-cyan-500 px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
          >
            Try Again
          </button>
        </div>
      </section>
    );
  }

  /*
  ==========================================================
  PAGE
  ==========================================================
  */

  return (
    <section className="h-[calc(100vh-170px)] min-h-[600px]">
      <div className="grid h-full overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 shadow-xl lg:grid-cols-[320px_minmax(0,1fr)_300px]">

        {/* ==================================================
            CONVERSATION LIST
        ================================================== */}

        <aside className="min-h-0 border-b border-slate-800 lg:border-b-0 lg:border-r">
          <ConversationList
            conversations={
              conversations
            }
            activeConversation={
              activeConversation
            }
            onConversationSelect={
              openConversation
            }
          />
        </aside>

        {/* ==================================================
            MAIN CHAT
        ================================================== */}

        <main className="flex min-h-0 min-w-0 flex-col">

          {activeConversation ? (
            <>
              {/* ============================================
                  HEADER
              ============================================ */}

              <div className="shrink-0 border-b border-slate-800">
                <ConversationHeader
                  conversation={
                    activeConversation
                  }
                />
              </div>

              {/* ============================================
                  MESSAGE ERROR
              ============================================ */}

              {messageError && (
                <div className="shrink-0 border-b border-red-500/20 bg-red-500/5 px-5 py-3">
                  <div className="flex items-center gap-2 text-sm text-red-400">
                    <AlertCircle
                      size={16}
                    />

                    <span>
                      {messageError}
                    </span>
                  </div>
                </div>
              )}

              {/* ============================================
                  MESSAGE LIST
              ============================================ */}

              <div className="min-h-0 flex-1">
                <MessageList
                  messages={
                    messages
                  }
                  loading={
                    messagesLoading
                  }
                />
              </div>

              {/* ============================================
                  MESSAGE COMPOSER
              ============================================ */}

              <div className="shrink-0 border-t border-slate-800">
                <MessageComposer
                  value={message}
                  message={message}
                  sending={sending}
                  onChange={
                    handleMessageChange
                  }
                  onSend={
                    handleSendMessage
                  }
                  onKeyDown={
                    handleMessageKeyDown
                  }
                />
              </div>
            </>
          ) : (
            /* ================================================
               NO ACTIVE CONVERSATION
            ================================================= */

            <div className="flex h-full items-center justify-center p-8">
              <div className="max-w-sm text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-cyan-500/10">
                  <MessageSquare
                    size={26}
                    className="text-cyan-400"
                  />
                </div>

                <h2 className="text-lg font-semibold text-white">
                  Select a conversation
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-400">
                  Choose one of your conversations
                  from the list to view your messages.
                </p>
              </div>
            </div>
          )}
        </main>

        {/* ==================================================
            PROPERTY CONTEXT
        ================================================== */}

        <aside className="hidden min-h-0 overflow-y-auto border-l border-slate-800 xl:block">
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

export default ConversationCenter;