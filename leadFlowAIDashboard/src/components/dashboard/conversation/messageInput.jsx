/**
 * =========================================================
 * MESSAGE INPUT
 * =========================================================
 *
 * Path
 * ----
 * src/components/dashboard/conversations/messageInput.jsx
 *
 * Purpose
 * -------
 * Responsible for:
 *
 * ✓ Allowing the viewer to type a message
 * ✓ Sending a message
 * ✓ Preventing empty messages
 * ✓ Handling Enter-to-send
 * ✓ Showing sending state
 * ✓ Disabling input when no conversation is active
 *
 * Used By
 * -------
 * Viewer Conversation Center
 *
 * =========================================================
 */

import { useState } from "react";

import {
  Send,
  Loader2,
} from "lucide-react";

const MessageInput = ({
  activeConversation = null,
  onSendMessage,
  sending = false,
}) => {
  /* ========================================================
     MESSAGE STATE
  ======================================================== */

  const [message, setMessage] = useState("");

  /* ========================================================
     SAFE ACTIVE CONVERSATION
  ======================================================== */

  const hasActiveConversation =
    Boolean(
      activeConversation?._id ||
      activeConversation?.id
    );

  /* ========================================================
     HANDLE INPUT
  ======================================================== */

  const handleChange = (event) => {
    setMessage(event.target.value);
  };

  /* ========================================================
     SEND MESSAGE
  ======================================================== */

  const handleSubmit = async (event) => {
    event.preventDefault();

    const trimmedMessage = message.trim();

    /*
     Do not send:
     • empty messages
     • messages while sending
     • messages without an active conversation
    */

    if (
      !trimmedMessage ||
      sending ||
      !hasActiveConversation
    ) {
      return;
    }

    try {
      /*
       Parent component is responsible for:
       • API request
       • updating message list
       • error handling
      */

      await onSendMessage(trimmedMessage);

      /*
       Clear the input only after the
       parent successfully handles the message.
      */

      setMessage("");
    } catch (error) {
      /*
       Keep the typed message if sending failed.
       The parent component handles/logs the error.
      */

      console.error(
        "MessageInput: Failed to send message:",
        error
      );
    }
  };

  /* ========================================================
     HANDLE ENTER
  ======================================================== */

  const handleKeyDown = (event) => {
    /*
     Enter sends the message.

     Shift + Enter creates a new line.
    */

    if (
      event.key === "Enter" &&
      !event.shiftKey
    ) {
      event.preventDefault();

      handleSubmit(event);
    }
  };

  /* ========================================================
     PLACEHOLDER
  ======================================================== */

  const placeholder =
    hasActiveConversation
      ? "Type your message..."
      : "Select a conversation first";

  /* ========================================================
     RENDER
  ======================================================== */

  return (
    <form
      onSubmit={handleSubmit}
      className="
        shrink-0
        border-t
        border-slate-200
        bg-white
        p-4
      "
    >
      <div className="flex items-end gap-3">

        {/* ==================================================
            MESSAGE TEXTAREA
        ================================================== */}

        <textarea
          value={message}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          disabled={
            !hasActiveConversation ||
            sending
          }
          placeholder={placeholder}
          rows={1}
          className="
            min-h-[46px]
            max-h-32
            flex-1
            resize-none
            rounded-xl
            border
            border-slate-300
            bg-white
            px-4
            py-3
            text-sm
            text-slate-900
            outline-none
            transition
            placeholder:text-slate-400
            focus:border-cyan-500
            focus:ring-2
            focus:ring-cyan-500/20
            disabled:cursor-not-allowed
            disabled:bg-slate-100
            disabled:text-slate-400
          "
          aria-label="Message"
        />

        {/* ==================================================
            SEND BUTTON
        ================================================== */}

        <button
          type="submit"
          disabled={
            !message.trim() ||
            !hasActiveConversation ||
            sending
          }
          className="
            flex
            h-[46px]
            w-[46px]
            shrink-0
            items-center
            justify-center
            rounded-xl
            bg-cyan-500
            text-slate-950
            transition
            hover:bg-cyan-400
            disabled:cursor-not-allowed
            disabled:opacity-50
          "
          aria-label={
            sending
              ? "Sending message"
              : "Send message"
          }
        >
          {sending ? (
            <Loader2
              size={19}
              className="animate-spin"
            />
          ) : (
            <Send size={19} />
          )}
        </button>

      </div>

      {/* ====================================================
          INPUT HINT
      ==================================================== */}

      {hasActiveConversation && (
        <p className="mt-2 px-1 text-xs text-slate-400">
          Press Enter to send · Shift + Enter for a new line
        </p>
      )}
    </form>
  );
};

export default MessageInput;