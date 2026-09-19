/**
 * ==========================================================
 *
 * WhatsApp-style typing indicator displayed at the bottom
 * of the conversation while another participant is typing.
 *
 * Responsibilities
 * ----------------------------------------------------------
 * ✓ Show typing animation
 * ✓ Display typing user's name
 * ✓ Support multiple users
 * ✓ Animated dots
 * ✓ Hide automatically
 *
 * Used By
 * ----------------------------------------------------------
 * ChatWindow.jsx
 *
 * ==========================================================
 */

import { Bot } from "lucide-react";

/* ==========================================================
   TYPING DOTS
========================================================== */

const TypingDots = () => {
  return (
    <div className="flex items-center gap-1">
      <span
        className="h-2 w-2 animate-bounce rounded-full bg-gray-500"
        style={{
          animationDelay: "0ms",
        }}
      />

      <span
        className="h-2 w-2 animate-bounce rounded-full bg-gray-500"
        style={{
          animationDelay: "150ms",
        }}
      />

      <span
        className="h-2 w-2 animate-bounce rounded-full bg-gray-500"
        style={{
          animationDelay: "300ms",
        }}
      />
    </div>
  );
};

/* ==========================================================
   COMPONENT
========================================================== */

const TypingIndicator = ({
  typingUsers = [],
  activeTyper = null,
  showBotIcon = false,
}) => {
  /* ========================================================
     NOTHING TO SHOW
  ======================================================== */

  if (
    !typingUsers.length &&
    !activeTyper
  ) {
    return null;
  }

  /* ========================================================
     DISPLAY NAME
  ======================================================== */

  let label = "";

  if (activeTyper) {
    label =
      activeTyper.userName ||
      activeTyper.fullName ||
      "Someone";
  } else if (typingUsers.length === 1) {
    label =
      typingUsers[0].userName ||
      typingUsers[0].fullName ||
      "Someone";
  } else {
    label = `${typingUsers.length} people`;
  }

  /* ========================================================
     UI
  ======================================================== */

  return (
    <div className="flex items-center gap-3 px-4 py-3">
      {/* Avatar */}

      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200">
        {showBotIcon ? (
          <Bot
            size={18}
            className="text-emerald-600"
          />
        ) : (
          <span className="font-semibold text-gray-700">
            {label.charAt(0).toUpperCase()}
          </span>
        )}
      </div>

      {/* Bubble */}

      <div className="rounded-2xl rounded-bl-md bg-white px-4 py-3 shadow-sm">
        <p className="mb-2 text-xs font-semibold text-emerald-600">
          {label}
        </p>

        <TypingDots />
      </div>
    </div>
  );
};

export default TypingIndicator;