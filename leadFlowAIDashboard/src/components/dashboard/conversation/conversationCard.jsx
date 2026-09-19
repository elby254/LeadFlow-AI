/**
 * =========================================================
 * CONVERSATION CARD
 * =========================================================
 *
 * Path
 * ----
 * src/components/dashboard/conversations/conversationCard.jsx
 *
 * Purpose
 * -------
 * Represents a single conversation in the conversation list.
 *
 * Responsibilities
 * ----------------
 * ✓ Display customer/viewer conversation information
 * ✓ Display customer name
 * ✓ Display phone number when available
 * ✓ Display property information
 * ✓ Display latest message preview
 * ✓ Display conversation timestamp
 * ✓ Display unread count
 * ✓ Display conversation status
 * ✓ Highlight the active conversation
 * ✓ Select the conversation
 *
 * IMPORTANT
 * ---------
 * Conversation IDs are MongoDB ObjectIds.
 *
 * Supported:
 * • _id
 * • id
 *
 * Example MongoDB ID:
 * 6a426c07b8e66972b176c0af
 *
 * Used By
 * -------
 * conversationList.jsx
 *
 * =========================================================
 */

import {
  MessageSquare,
  Home,
  Phone,
  Clock,
  CheckCheck,
} from "lucide-react";

/**
 * =========================================================
 * HELPERS
 * =========================================================
 */

/**
 * Safely resolve a conversation ID.
 *
 * MongoDB uses `_id`.
 * Some frontend-normalized objects may use `id`.
 */
const getConversationId = (conversation) => {
  return (
    conversation?._id ||
    conversation?.id ||
    null
  );
};

/**
 * Safely convert values into strings.
 */
const safeString = (value, fallback = "") => {
  if (
    value === null ||
    value === undefined
  ) {
    return fallback;
  }

  return String(value);
};

/**
 * Resolve customer/viewer name from
 * different possible backend structures.
 */
const getCustomerName = (conversation) => {
  return (
    conversation?.customerName ||
    conversation?.viewerName ||
    conversation?.leadName ||
    conversation?.customer?.name ||
    conversation?.viewer?.name ||
    conversation?.lead?.name ||
    conversation?.user?.name ||
    "Customer"
  );
};

/**
 * Resolve customer phone.
 */
const getPhone = (conversation) => {
  return (
    conversation?.phone ||
    conversation?.customerPhone ||
    conversation?.viewerPhone ||
    conversation?.customer?.phone ||
    conversation?.viewer?.phone ||
    conversation?.lead?.phone ||
    ""
  );
};

/**
 * Resolve property name.
 */
const getPropertyName = (conversation) => {
  return (
    conversation?.propertyName ||
    conversation?.propertyTitle ||
    conversation?.property?.title ||
    conversation?.property?.name ||
    conversation?.listing?.title ||
    ""
  );
};

/**
 * Resolve last message.
 *
 * Supports both:
 *
 * lastMessage: "Hello..."
 *
 * and:
 *
 * lastMessage: {
 *   message: "Hello..."
 * }
 */
const getLastMessage = (conversation) => {
  const lastMessage =
    conversation?.lastMessage;

  if (
    typeof lastMessage === "string"
  ) {
    return lastMessage;
  }

  if (
    lastMessage &&
    typeof lastMessage === "object"
  ) {
    return (
      lastMessage.message ||
      lastMessage.text ||
      lastMessage.content ||
      ""
    );
  }

  return (
    conversation?.latestMessage ||
    conversation?.message ||
    conversation?.preview ||
    "No messages yet."
  );
};

/**
 * Resolve timestamp.
 */
const getTimestamp = (conversation) => {
  return (
    conversation?.lastMessageAt ||
    conversation?.lastMessage?.createdAt ||
    conversation?.updatedAt ||
    conversation?.createdAt ||
    conversation?.timestamp ||
    null
  );
};

/**
 * Format timestamp safely.
 */
const formatTimestamp = (value) => {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const now = new Date();

  const isToday =
    date.toDateString() ===
    now.toDateString();

  if (isToday) {
    return date.toLocaleTimeString(
      [],
      {
        hour: "numeric",
        minute: "2-digit",
      }
    );
  }

  return date.toLocaleDateString(
    [],
    {
      day: "numeric",
      month: "short",
    }
  );
};

/**
 * Resolve unread count.
 */
const getUnreadCount = (conversation) => {
  const value =
    conversation?.unreadCount ??
    conversation?.unread ??
    conversation?.unreadMessages ??
    0;

  const number = Number(value);

  return Number.isFinite(number)
    ? Math.max(0, number)
    : 0;
};

/**
 * Resolve status.
 */
const getStatus = (conversation) => {
  return (
    conversation?.status ||
    conversation?.conversationStatus ||
    "active"
  );
};

/**
 * =========================================================
 * COMPONENT
 * =========================================================
 */

const ConversationCard = ({
  conversation = null,
  active = false,
  onClick,
}) => {
  /**
   * -------------------------------------------------------
   * SAFE DATA
   * -------------------------------------------------------
   */

  if (!conversation) {
    return null;
  }

  const conversationId =
    getConversationId(conversation);

  const customerName =
    getCustomerName(conversation);

  const phone =
    getPhone(conversation);

  const propertyName =
    getPropertyName(conversation);

  const lastMessage =
    getLastMessage(conversation);

  const timestamp =
    getTimestamp(conversation);

  const unreadCount =
    getUnreadCount(conversation);

  const status =
    getStatus(conversation);

  /**
   * -------------------------------------------------------
   * CLICK HANDLER
   * -------------------------------------------------------
   *
   * The parent ConversationList normally supplies:
   *
   * onClick={onConversationSelect}
   *
   * Therefore pass the complete conversation object
   * upward rather than only the ID.
   */

  const handleClick = () => {
    console.log(
      "ConversationCard: Selected conversation:",
      conversationId
    );

    if (typeof onClick === "function") {
      onClick(conversation);
    }
  };

  /**
   * -------------------------------------------------------
   * STATUS DISPLAY
   * -------------------------------------------------------
   */

  const normalizedStatus =
    safeString(status)
      .toLowerCase()
      .trim();

  const statusLabel =
    normalizedStatus === "closed"
      ? "Closed"
      : normalizedStatus === "archived"
      ? "Archived"
      : normalizedStatus === "pending"
      ? "Pending"
      : "Active";

  /**
   * =======================================================
   * RENDER
   * =======================================================
   */

  return (
    <button
      type="button"
      onClick={handleClick}
      data-conversation-id={
        conversationId || undefined
      }
      aria-current={
        active ? "true" : undefined
      }
      className={`
        group
        w-full
        border-b
        px-4
        py-4
        text-left
        transition-all
        duration-200

        ${
          active
            ? "border-l-4 border-l-cyan-500 bg-cyan-50"
            : "border-l-4 border-l-transparent hover:bg-gray-50"
        }
      `}
    >
      {/* ===================================================
          TOP ROW
      =================================================== */}

      <div className="flex items-start gap-3">

        {/* =================================================
            AVATAR
        ================================================= */}

        <div
          className={`
            flex
            h-11
            w-11
            shrink-0
            items-center
            justify-center
            rounded-full
            font-semibold
            ${
              active
                ? "bg-cyan-500 text-slate-950"
                : "bg-slate-100 text-slate-600"
            }
          `}
        >
          {customerName
            .charAt(0)
            .toUpperCase()}
        </div>

        {/* =================================================
            MAIN CONTENT
        ================================================= */}

        <div className="min-w-0 flex-1">

          {/* ===============================================
              NAME + TIMESTAMP
          =============================================== */}

          <div className="flex items-start justify-between gap-2">

            <div className="min-w-0">

              <h3
                className={`
                  truncate
                  text-sm
                  ${
                    unreadCount > 0
                      ? "font-bold text-gray-900"
                      : "font-semibold text-gray-800"
                  }
                `}
              >
                {customerName}
              </h3>

            </div>

            {timestamp && (
              <span
                className={`
                  shrink-0
                  text-[11px]
                  ${
                    unreadCount > 0
                      ? "font-semibold text-cyan-600"
                      : "text-gray-400"
                  }
                `}
              >
                {formatTimestamp(
                  timestamp
                )}
              </span>
            )}

          </div>

          {/* ===============================================
              PHONE
          =============================================== */}

          {phone && (
            <div className="mt-1 flex items-center gap-1.5">

              <Phone
                size={11}
                className="shrink-0 text-gray-400"
              />

              <span className="truncate text-xs text-gray-500">
                {phone}
              </span>

            </div>
          )}

          {/* ===============================================
              PROPERTY
          =============================================== */}

          {propertyName && (
            <div className="mt-2 flex items-center gap-1.5">

              <Home
                size={13}
                className="shrink-0 text-cyan-500"
              />

              <span
                className={`
                  truncate
                  text-xs
                  ${
                    active
                      ? "font-medium text-cyan-700"
                      : "text-gray-600"
                  }
                `}
              >
                {propertyName}
              </span>

            </div>
          )}

          {/* ===============================================
              LAST MESSAGE
          =============================================== */}

          <div className="mt-2 flex items-start gap-1.5">

            <MessageSquare
              size={13}
              className="mt-0.5 shrink-0 text-gray-400"
            />

            <p
              className={`
                line-clamp-2
                text-xs
                leading-5
                ${
                  unreadCount > 0
                    ? "font-medium text-gray-700"
                    : "text-gray-500"
                }
              `}
            >
              {lastMessage}
            </p>

          </div>

          {/* ===============================================
              BOTTOM METADATA
          =============================================== */}

          <div className="mt-3 flex items-center justify-between gap-2">

            {/* STATUS */}

            <span
              className={`
                inline-flex
                items-center
                rounded-full
                px-2
                py-0.5
                text-[10px]
                font-medium
                ${
                  normalizedStatus ===
                  "closed"
                    ? "bg-gray-100 text-gray-600"
                    : normalizedStatus ===
                      "archived"
                    ? "bg-gray-100 text-gray-500"
                    : normalizedStatus ===
                      "pending"
                    ? "bg-amber-50 text-amber-600"
                    : "bg-emerald-50 text-emerald-600"
                }
              `}
            >
              {statusLabel}
            </span>

            {/* UNREAD */}

            {unreadCount > 0 && (
              <span
                className="
                  inline-flex
                  min-w-5
                  items-center
                  justify-center
                  rounded-full
                  bg-cyan-500
                  px-1.5
                  py-0.5
                  text-[10px]
                  font-bold
                  text-white
                "
              >
                {unreadCount > 99
                  ? "99+"
                  : unreadCount}
              </span>
            )}

            {/* READ INDICATOR */}

            {unreadCount === 0 && (
              <CheckCheck
                size={14}
                className="text-gray-400"
              />
            )}

          </div>

        </div>

      </div>

      {/* ===================================================
          OPTIONAL HOVER INDICATOR
      =================================================== */}

      <div
        className={`
          mt-2
          flex
          items-center
          gap-1
          text-[10px]
          opacity-0
          transition-opacity
          group-hover:opacity-100
          ${
            active
              ? "text-cyan-600"
              : "text-gray-400"
          }
        `}
      >
        <Clock size={10} />

        <span>
          {active
            ? "Active conversation"
            : "Open conversation"}
        </span>
      </div>
    </button>
  );
};

export default ConversationCard;