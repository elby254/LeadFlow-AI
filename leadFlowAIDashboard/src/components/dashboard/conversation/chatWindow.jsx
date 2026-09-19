/**
 * ==========================================================
 *
 * Main WhatsApp-style conversation window.
 *
 * Responsibilities
 * ----------------------------------------------------------
 * ✓ Display conversation header
 * ✓ Render message list
 * ✓ Infinite scroll (older messages)
 * ✓ Read receipts
 * ✓ Typing indicator
 * ✓ AI reply suggestions
 * ✓ Message composer
 * ✓ Auto-scroll newest messages
 * ✓ Empty state
 * ✓ Loading state
 *
 * Used By
 * ----------------------------------------------------------
 * ConversationCenter.jsx
 *
 * Children
 * ----------------------------------------------------------
 * MessageBubble
 * TypingIndicator
 * AIReplySuggestions
 * MessageComposer
 * ReadReceipt
 *
 * ==========================================================
 */

import { useEffect } from "react";
import { useRef } from "react";

import {
  ArrowLeft,
  Phone,
  Video,
  MoreVertical,
} from "lucide-react";

import MessageBubble from "./messageBubble";
import MessageComposer from "./messageComposer";
import TypingIndicator from "./typingIndicator";
import AIReplySuggestions from "./aiReplySuggestions";

/* ==========================================================
   COMPONENT
========================================================== */

const ChatWindow = ({
  conversation,
  messages = [],
  loading = false,
  hasOlderMessages = false,
  otherUserTyping = false,

  aiSuggestions = [],

  onBack,
  onLoadOlderMessages,
  onSendMessage,
  onTypingStart,
  onTypingStop,
}) => {
  const messagesEndRef = useRef(null);

  /* ========================================================
     AUTO SCROLL
  ======================================================== */

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages, otherUserTyping]);

  /* ========================================================
     EMPTY STATE
  ======================================================== */

  if (!conversation) {
    return (
      <div className="flex flex-1 items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-700">
            Select a conversation
          </h2>

          <p className="mt-2 text-gray-500">
            Choose a lead from the left panel.
          </p>
        </div>
      </div>
    );
  }

  /* ========================================================
     UI
  ======================================================== */

  return (
    <div className="flex h-full flex-col bg-gray-100">
      {/* ====================================================
          HEADER
      ===================================================== */}

      <header className="flex items-center justify-between border-b bg-white px-5 py-4 shadow-sm">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="rounded-lg p-2 hover:bg-gray-100 lg:hidden"
          >
            <ArrowLeft size={20} />
          </button>

          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-600 font-semibold text-white">
            {conversation.customerName?.charAt(0)}
          </div>

          <div>
            <h2 className="font-semibold text-gray-800">
              {conversation.customerName}
            </h2>

            <p className="text-sm text-gray-500">
              {conversation.propertyName}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button className="rounded-lg p-2 hover:bg-gray-100">
            <Phone size={18} />
          </button>

          <button className="rounded-lg p-2 hover:bg-gray-100">
            <Video size={18} />
          </button>

          <button className="rounded-lg p-2 hover:bg-gray-100">
            <MoreVertical size={18} />
          </button>
        </div>
      </header>

      {/* ====================================================
          MESSAGE AREA
      ===================================================== */}

      <div className="flex-1 overflow-y-auto px-5 py-6">
        {/* Older Messages */}

        {hasOlderMessages && (
          <div className="mb-5 text-center">
            <button
              onClick={onLoadOlderMessages}
              className="rounded-lg border bg-white px-4 py-2 text-sm hover:bg-gray-50"
            >
              Load Older Messages
            </button>
          </div>
        )}

        {/* Loading */}

        {loading && (
          <div className="py-6 text-center text-gray-500">
            Loading messages...
          </div>
        )}

        {/* Messages */}

        <div className="space-y-4">
          {messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
            />
          ))}

          {/* Typing */}

          {otherUserTyping && (
            <TypingIndicator />
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* ====================================================
          AI SUGGESTIONS
      ===================================================== */}

      {aiSuggestions.length > 0 && (
        <AIReplySuggestions
          suggestions={aiSuggestions}
        />
      )}

      {/* ====================================================
          COMPOSER
      ===================================================== */}

      <MessageComposer
        onSend={onSendMessage}
        onTypingStart={onTypingStart}
        onTypingStop={onTypingStop}
      />
    </div>
  );
};

export default ChatWindow;