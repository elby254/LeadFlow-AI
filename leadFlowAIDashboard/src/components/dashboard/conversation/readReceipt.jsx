/**
 * ==========================================================
 *
 * WhatsApp-style read receipt indicator.
 *
 * Responsibilities
 * ----------------------------------------------------------
 * ✓ Sending indicator
 * ✓ Sent indicator
 * ✓ Delivered indicator
 * ✓ Read indicator
 * ✓ Failed indicator
 * ✓ Optional timestamp
 * ✓ Reusable across chat components
 *
 * Used By
 * ----------------------------------------------------------
 * MessageBubble.jsx
 * ChatWindow.jsx
 *
 * ==========================================================
 */

import {
  Check,
  CheckCheck,
  Clock3,
  AlertCircle,
} from "lucide-react";

/* ==========================================================
   COMPONENT
========================================================== */

const ReadReceipt = ({
  status = "sent",
  timestamp,
  showTimestamp = true,
  className = "",
}) => {
  /* ========================================================
     FORMAT TIME
  ======================================================== */

  const formatTime = (date) => {
    if (!date) return "";

    return new Date(date).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  /* ========================================================
     STATUS ICON
  ======================================================== */

  const renderStatus = () => {
    switch (status) {
      case "sending":
        return (
          <Clock3
            size={14}
            className="text-gray-400"
          />
        );

      case "sent":
        return (
          <Check
            size={14}
            className="text-gray-400"
          />
        );

      case "delivered":
        return (
          <CheckCheck
            size={14}
            className="text-gray-400"
          />
        );

      case "read":
        return (
          <CheckCheck
            size={14}
            className="text-blue-500"
          />
        );

      case "failed":
        return (
          <AlertCircle
            size={14}
            className="text-red-500"
          />
        );

      default:
        return null;
    }
  };

  /* ========================================================
     UI
  ======================================================== */

  return (
    <div
      className={`flex items-center gap-1 text-xs ${className}`}
    >
      {showTimestamp && timestamp && (
        <span>
          {formatTime(timestamp)}
        </span>
      )}

      {renderStatus()}
    </div>
  );
};

export default ReadReceipt;