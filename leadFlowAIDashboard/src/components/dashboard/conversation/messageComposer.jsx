/**
 * =========================================================
 * MESSAGE COMPOSER
 * =========================================================
 *
 * Path
 * ----
 * src/components/dashboard/conversations/messageComposer.jsx
 *
 * Purpose
 * -------
 * Responsible for:
 *
 * ✓ Allowing the viewer to type a message
 * ✓ Sending a message for the active conversation
 * ✓ Handling empty messages safely
 * ✓ Showing sending state
 * ✓ Allowing Enter to send
 * ✓ Allowing Shift + Enter for a new line
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

const MessageComposer = ({
  activeConversation = null,
  onSendMessage,
  sending = false,
}) => {
  /* ========================================================
     MESSAGE STATE
  ======================================================== */

  const [message, setMessage] = useState("");

  /* ========================================================
     ACTIVE CONVERSATION ID
     ======================================================== */

  const activeConversationId =
    activeConversation?._id ||
    activeConversation?.id ||
    null;

  /* ========================================================
     SEND MESSAGE
  ======================================================== */

  const handleSubmit = async (event) => {
    event?.preventDefault();

    const trimmedMessage = message.trim();

    /*
     --------------------------------------------------------
     SAFETY CHECK
     --------------------------------------------------------
     */

    if (
      !trimmedMessage ||
      !activeConversationId ||
      sending
    ) {
      return;
    }

    try {
      console.log(
        "MessageComposer: Sending message:",
        {
          conversationId: activeConversationId,
          message: trimmedMessage,
        }
      );

      /*
      ------------------------------------------------------
      Parent handles the actual API request.
      ------------------------------------------------------
      */

      await onSendMessage(trimmedMessage);

      /*
      ------------------------------------------------------
      Clear composer only after successful send.
      ------------------------------------------------------
      */

      setMessage("");

    } catch (error) {
      console.error(
        "MessageComposer: Failed to send message:",
        error
      );
    }
  };

  /* ========================================================
     KEYBOARD HANDLER
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
     INPUT CHANGE
  ======================================================== */

  const handleChange = (event) => {
    setMessage(event.target.value);
  };

  /* ========================================================
     DISABLED STATE
  ======================================================== */

  const composerDisabled =
    !activeConversationId || sending;

  /* ========================================================
     RENDER
  ======================================================== */

  return (
    <form
      onSubmit={handleSubmit}
      className="
        shrink-0
        border-t
        border-slate-800
        bg-slate-950
        p-4
      "
    >
      <div className="flex items-end gap-3">

        {/* ==================================================
            MESSAGE INPUT
        ================================================== */}

        <textarea
          value={message}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          disabled={composerDisabled}
          rows={1}
          placeholder={
            activeConversationId
              ? "Type your message..."
              : "Select a conversation first..."
          }
          className="
            min-h-[46px]
            max-h-32
            flex-1
            resize-none
            rounded-xl
            border
            border-slate-700
            bg-slate-900
            px-4
            py-3
            text-sm
            text-white
            outline-none
            placeholder:text-slate-500
            transition
            focus:border-cyan-500
            focus:ring-1
            focus:ring-cyan-500
            disabled:cursor-not-allowed
            disabled:opacity-50
          "
        />

        {/* ==================================================
            SEND BUTTON
        ================================================== */}

        <button
          type="submit"
          disabled={
            composerDisabled ||
            !message.trim()
          }
          aria-label="Send message"
          title={
            activeConversationId
              ? "Send message"
              : "Select a conversation first"
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
            disabled:opacity-40
          "
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
          COMPOSER HINT
      ==================================================== */}

      {activeConversationId && (
        <p className="mt-2 px-1 text-xs text-slate-500">
          Press Enter to send · Shift + Enter for a new line
        </p>
      )}
    </form>
  );
};

export default MessageComposer;