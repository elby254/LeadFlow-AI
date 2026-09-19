/**
 * ==========================================================
 *
 * Individual WhatsApp-style message bubble.
 *
 * Responsibilities
 * ----------------------------------------------------------
 * ✓ Sent vs received messages
 * ✓ Read receipts
 * ✓ Delivery status
 * ✓ Attachments
 * ✓ Images
 * ✓ Documents
 * ✓ Voice notes
 * ✓ Failed messages
 * ✓ Sending animation
 * ✓ Timestamp
 *
 * Used By
 * ----------------------------------------------------------
 * ChatWindow.jsx
 *
 * ==========================================================
 */

import {
  Check,
  CheckCheck,
  Clock3,
  AlertCircle,
  FileText,
  Download,
} from "lucide-react";

/* ==========================================================
   HELPERS
========================================================== */

const formatTime = (date) => {
  if (!date) return "";

  return new Date(date).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
};

/* ==========================================================
   COMPONENT
========================================================== */

const MessageBubble = ({ message }) => {
  const {
    senderId,
    currentUserId,

    text,

    createdAt,

    status,

    attachments = [],

    voiceNote,

    isMine,

    senderName,
  } = message;

  const mine =
    isMine ??
    senderId === currentUserId;

  /* ========================================================
     DELIVERY ICON
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
     ATTACHMENTS
  ======================================================== */

  const renderAttachments = () => {
    if (!attachments.length) return null;

    return (
      <div className="mt-3 space-y-2">
        {attachments.map((file, index) => {
          const image =
            file.type?.startsWith("image");

          if (image) {
            return (
              <img
                key={index}
                src={file.url}
                alt={file.name}
                className="max-h-60 rounded-xl border object-cover"
              />
            );
          }

          return (
            <div
              key={index}
              className="flex items-center justify-between rounded-lg border bg-white/70 p-3"
            >
              <div className="flex items-center gap-2">
                <FileText
                  size={18}
                  className="text-gray-500"
                />

                <div>
                  <p className="text-sm font-medium">
                    {file.name}
                  </p>

                  <p className="text-xs text-gray-500">
                    {file.size}
                  </p>
                </div>
              </div>

              <a
                href={file.url}
                target="_blank"
                rel="noreferrer"
              >
                <Download size={18} />
              </a>
            </div>
          );
        })}
      </div>
    );
  };

  /* ========================================================
     VOICE NOTE
  ======================================================== */

  const renderVoice = () => {
    if (!voiceNote) return null;

    return (
      <div className="mt-3">
        <audio
          controls
          className="w-full"
        >
          <source
            src={voiceNote.url}
            type="audio/webm"
          />
        </audio>
      </div>
    );
  };

  /* ========================================================
     UI
  ======================================================== */

  return (
    <div
      className={`flex ${
        mine
          ? "justify-end"
          : "justify-start"
      }`}
    >
      <div
        className={`max-w-[75%] rounded-2xl px-4 py-3 shadow-sm

        ${
          mine
            ? "rounded-br-md bg-emerald-600 text-white"
            : "rounded-bl-md bg-white text-gray-800"
        }`}
      >
        {/* Sender */}

        {!mine && (
          <p className="mb-2 text-xs font-semibold text-emerald-600">
            {senderName}
          </p>
        )}

        {/* Message */}

        {text && (
          <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">
            {text}
          </p>
        )}

        {/* Attachments */}

        {renderAttachments()}

        {/* Voice */}

        {renderVoice()}

        {/* Footer */}

        <div
          className={`mt-3 flex items-center gap-2 text-[11px]

          ${
            mine
              ? "justify-end text-emerald-100"
              : "justify-end text-gray-500"
          }`}
        >
          <span>
            {formatTime(createdAt)}
          </span>

          {mine && renderStatus()}
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;