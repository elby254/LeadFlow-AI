/**
 * =========================================================
 * MESSAGE LIST
 * =========================================================
 *
 * Path
 * ----
 * src/components/dashboard/conversations/messageList.jsx
 *
 * Purpose
 * -------
 * Responsible for:
 *
 * ✓ Displaying messages for the active conversation
 * ✓ Rendering customer/viewer messages
 * ✓ Rendering agent messages
 * ✓ Rendering AI messages
 * ✓ Showing timestamps
 * ✓ Handling loading state
 * ✓ Handling empty conversation state
 * ✓ Providing a scrollable message area
 * ✓ Safely handling MongoDB _id values
 *
 * Used By
 * -------
 * Viewer Conversation Center
 *
 * =========================================================
 */

import { useEffect, useRef } from "react";
import MessageBubble from "./messageBubble";

const MessageList = ({
  messages = [],
  loading = false,
  conversation = null,
}) => {
  /* ========================================================
     SAFE MESSAGE DATA
  ======================================================== */

  const messageItems = Array.isArray(messages) ? messages : [];

  /* ========================================================
     MESSAGE CONTAINER REF
  ======================================================== */

  const messagesEndRef = useRef(null);

  /* ========================================================
     SCROLL TO LATEST MESSAGE
  ======================================================== */

  useEffect(() => {
    if (!messagesEndRef.current) return;

    messagesEndRef.current.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [messageItems.length]);

  /* ========================================================
     LOADING STATE
  ======================================================== */

  if (loading) {
    return (
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-4 py-6">
        <div className="flex flex-col gap-4">
          {/* Customer / Viewer skeleton */}
          <div className="flex justify-start">
            <div className="w-full max-w-xs">
              <div className="animate-pulse rounded-2xl rounded-bl-md bg-gray-100 px-4 py-3">
                <div className="mb-2 h-3 w-28 rounded bg-gray-200" />
                <div className="h-3 w-40 rounded bg-gray-200" />
              </div>
            </div>
          </div>

          {/* Agent skeleton */}
          <div className="flex justify-end">
            <div className="w-full max-w-xs">
              <div className="animate-pulse rounded-2xl rounded-br-md bg-gray-100 px-4 py-3">
                <div className="mb-2 ml-auto h-3 w-24 rounded bg-gray-200" />
                <div className="ml-auto h-3 w-36 rounded bg-gray-200" />
              </div>
            </div>
          </div>

          {/* Customer / Viewer skeleton */}
          <div className="flex justify-start">
            <div className="w-full max-w-sm">
              <div className="animate-pulse rounded-2xl rounded-bl-md bg-gray-100 px-4 py-3">
                <div className="mb-2 h-3 w-32 rounded bg-gray-200" />
                <div className="mb-2 h-3 w-full rounded bg-gray-200" />
                <div className="h-3 w-20 rounded bg-gray-200" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ========================================================
     EMPTY STATE
  ======================================================== */

  if (messageItems.length === 0) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center px-6 py-10">
        <div className="max-w-sm text-center">
          {/* Icon */}
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-7 w-7 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.7}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a10.8 10.8 0 01-4.13-.8L3 20l1.47-4.04A7.86 7.86 0 013 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
          </div>

          <h3 className="text-sm font-semibold text-gray-800">
            No messages yet
          </h3>

          <p className="mt-1 text-xs leading-5 text-gray-500">
            {conversation
              ? "Messages for this conversation will appear here."
              : "Select a conversation to view its messages."}
          </p>
        </div>
      </div>
    );
  }

  /* ========================================================
     RENDER MESSAGE LIST
  ======================================================== */

  return (
    <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-3">
        {messageItems.map((message, index) => {
          /* ==================================================
             SAFE MONGODB MESSAGE ID
          ================================================== */

          const messageId =
            message?._id?.toString?.() ||
            message?._id ||
            message?.id ||
            `message-${index}`;

          /* ==================================================
             RENDER
          ================================================== */

          return (
            <MessageBubble
              key={messageId}
              message={message}
            />
          );
        })}

        {/* ==================================================
            SCROLL TARGET
        ================================================== */}

        <div
          ref={messagesEndRef}
          className="h-px w-full"
          aria-hidden="true"
        />
      </div>
    </div>
  );
};

export default MessageList;