/**
 * =========================================================
 *
 * CONVERSATION LIST ITEM
 *
 * Path
 * ----
 * src/components/dashboard/conversations/conversationListItem.jsx
 *
 * Purpose
 * -------
 * Renders one conversation inside the Viewer conversation list.
 *
 * Responsibilities
 * ----------------------------------------------------------
 * ✓ Display agent/customer information
 * ✓ Display last message preview
 * ✓ Display property context
 * ✓ Display conversation status
 * ✓ Display last activity timestamp
 * ✓ Display unread count
 * ✓ Highlight active conversation
 * ✓ Handle conversation selection
 * ✓ Handle missing/partial conversation data safely
 *
 * Used By
 * ----------------------------------------------------------
 * conversationList.jsx
 *
 * =========================================================
 */

import {
  MessageCircle,
  Building2,
  UserRound,
  Clock3,
  CheckCircle2,
  Circle,
  Pin,
} from "lucide-react";

/* =========================================================
   HELPERS
========================================================= */

const getConversationId = (conversation) =>
  conversation?.id ||
  conversation?._id ||
  conversation?.conversationId ||
  null;

const getAgentName = (conversation) =>
  conversation?.agentName ||
  conversation?.agent?.name ||
  conversation?.assignedAgent?.name ||
  conversation?.agent?.fullName ||
  "Unassigned";

const getCustomerName = (conversation) =>
  conversation?.customerName ||
  conversation?.customer?.name ||
  conversation?.leadName ||
  conversation?.lead?.name ||
  "Customer";

const getPropertyName = (conversation) =>
  conversation?.propertyName ||
  conversation?.property?.name ||
  conversation?.property?.title ||
  conversation?.propertyTitle ||
  "No property selected";

const getLastMessage = (conversation) => {
  const message =
    conversation?.lastMessage ||
    conversation?.latestMessage ||
    conversation?.message ||
    "";

  if (typeof message === "string") {
    return message;
  }

  if (typeof message === "object" && message !== null) {
    return (
      message?.text ||
      message?.content ||
      message?.body ||
      message?.message ||
      ""
    );
  }

  return "";
};

const getStatus = (conversation) =>
  conversation?.status ||
  conversation?.conversationStatus ||
  "active";

const getUnreadCount = (conversation) =>
  Number(
    conversation?.unreadCount ??
      conversation?.unreadMessages ??
      conversation?.unread ??
      0
  );

const getLastActivity = (conversation) =>
  conversation?.lastActivity ||
  conversation?.lastActivityAt ||
  conversation?.updatedAt ||
  conversation?.lastMessageAt ||
  conversation?.createdAt ||
  null;

/* =========================================================
   DATE FORMATTER
========================================================= */

const formatActivityTime = (value) => {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const now = new Date();

  const diff = now.getTime() - date.getTime();

  /*
   * Future dates should still display a normal date.
   */
  if (diff < 0) {
    return date.toLocaleDateString([], {
      day: "numeric",
      month: "short",
    });
  }

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) {
    return "Just now";
  }

  if (minutes < 60) {
    return `${minutes}m`;
  }

  if (hours < 24) {
    return `${hours}h`;
  }

  if (days < 7) {
    return `${days}d`;
  }

  return date.toLocaleDateString([], {
    day: "numeric",
    month: "short",
  });
};

/* =========================================================
   STATUS NORMALIZER
========================================================= */

const normalizeStatus = (status) => {
  const normalized = String(status || "active")
    .trim()
    .toLowerCase();

  if (
    normalized === "closed" ||
    normalized === "completed" ||
    normalized === "resolved"
  ) {
    return "closed";
  }

  if (
    normalized === "pending" ||
    normalized === "waiting" ||
    normalized === "awaiting"
  ) {
    return "pending";
  }

  return "active";
};

/* =========================================================
   STATUS DISPLAY
========================================================= */

const getStatusConfig = (status) => {
  switch (status) {
    case "closed":
      return {
        label: "Closed",
        className: "bg-gray-100 text-gray-600",
        icon: CheckCircle2,
      };

    case "pending":
      return {
        label: "Pending",
        className: "bg-amber-50 text-amber-700",
        icon: Clock3,
      };

    default:
      return {
        label: "Active",
        className: "bg-emerald-50 text-emerald-700",
        icon: Circle,
      };
  }
};

/* =========================================================
   COMPONENT
========================================================= */

const ConversationListItem = ({
  conversation,
  active = false,
  onClick,
}) => {
  if (!conversation) {
    return null;
  }

  const conversationId = getConversationId(conversation);

  const agentName = getAgentName(conversation);
  const customerName = getCustomerName(conversation);
  const propertyName = getPropertyName(conversation);
  const lastMessage = getLastMessage(conversation);

  const rawStatus = getStatus(conversation);
  const status = normalizeStatus(rawStatus);

  const unreadCount = getUnreadCount(conversation);

  const lastActivity = getLastActivity(conversation);
  const activityTime = formatActivityTime(lastActivity);

  const statusConfig = getStatusConfig(status);
  const StatusIcon = statusConfig.icon;

  const isPinned =
    Boolean(conversation?.isPinned) ||
    Boolean(conversation?.pinned);

  const handleClick = () => {
    if (typeof onClick === "function") {
      onClick(conversation);
    }
  };

  /* =======================================================
     KEYBOARD SUPPORT
  ======================================================= */

  const handleKeyDown = (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleClick();
    }
  };

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div
      role="button"
      tabIndex={0}
      data-conversation-id={conversationId || undefined}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={`
        group relative w-full cursor-pointer
        border-b border-gray-100
        px-4 py-4 text-left
        transition-all duration-150
        focus:outline-none
        focus-visible:ring-2
        focus-visible:ring-inset
        focus-visible:ring-blue-500

        ${
          active
            ? "bg-blue-50/70"
            : "bg-white hover:bg-gray-50"
        }
      `}
    >
      {/* ==================================================
          ACTIVE INDICATOR
      ================================================== */}

      {active && (
        <div
          className="
            absolute inset-y-0 left-0
            w-1 rounded-r-full
            bg-blue-600
          "
        />
      )}

      <div className="flex items-start gap-3">
        {/* ==================================================
            CUSTOMER AVATAR
        ================================================== */}

        <div
          className={`
            flex h-11 w-11 shrink-0
            items-center justify-center
            rounded-full
            text-sm font-semibold
            ${
              active
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-600"
            }
          `}
        >
          {customerName?.charAt(0)?.toUpperCase() || (
            <UserRound className="h-5 w-5" />
          )}
        </div>

        {/* ==================================================
            MAIN CONTENT
        ================================================== */}

        <div className="min-w-0 flex-1">
          {/* =================================================
              TOP ROW
          ================================================= */}

          <div className="mb-1 flex items-start justify-between gap-2">
            <div className="flex min-w-0 items-center gap-1.5">
              <h3
                className={`
                  truncate text-sm
                  ${
                    unreadCount > 0 || active
                      ? "font-semibold text-gray-900"
                      : "font-medium text-gray-800"
                  }
                `}
              >
                {customerName}
              </h3>

              {isPinned && (
                <Pin
                  className="h-3.5 w-3.5 shrink-0 text-gray-400"
                  aria-label="Pinned conversation"
                />
              )}
            </div>

            {/* =================================================
                LAST ACTIVITY
            ================================================= */}

            {activityTime && (
              <span
                className={`
                  shrink-0 text-[11px]
                  ${
                    unreadCount > 0
                      ? "font-semibold text-blue-600"
                      : "text-gray-400"
                  }
                `}
              >
                {activityTime}
              </span>
            )}
          </div>

          {/* ==================================================
              AGENT
          ================================================== */}

          <div className="mb-1.5 flex min-w-0 items-center gap-1.5">
            <UserRound className="h-3.5 w-3.5 shrink-0 text-gray-400" />

            <span className="truncate text-xs text-gray-500">
              {agentName}
            </span>
          </div>

          {/* ==================================================
              LAST MESSAGE
          ================================================== */}

          <div className="mb-2 flex min-w-0 items-start gap-1.5">
            <MessageCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gray-400" />

            <p
              className={`
                line-clamp-2 text-xs leading-5
                ${
                  unreadCount > 0
                    ? "font-medium text-gray-700"
                    : "text-gray-500"
                }
              `}
            >
              {lastMessage || "No messages yet"}
            </p>
          </div>

          {/* ==================================================
              BOTTOM INFORMATION
          ================================================== */}

          <div className="flex min-w-0 items-center justify-between gap-2">
            {/* ================================================
                PROPERTY
            ================================================= */}

            <div className="flex min-w-0 items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5 shrink-0 text-gray-400" />

              <span className="truncate text-[11px] text-gray-500">
                {propertyName}
              </span>
            </div>

            {/* ================================================
                STATUS + UNREAD
            ================================================= */}

            <div className="flex shrink-0 items-center gap-2">
              {/* STATUS */}

              <span
                className={`
                  inline-flex items-center gap-1
                  rounded-full px-2 py-0.5
                  text-[10px] font-medium
                  ${statusConfig.className}
                `}
              >
                <StatusIcon className="h-3 w-3" />

                {statusConfig.label}
              </span>

              {/* UNREAD COUNT */}

              {unreadCount > 0 && (
                <span
                  className="
                    flex h-5 min-w-5
                    items-center justify-center
                    rounded-full
                    bg-blue-600
                    px-1.5
                    text-[10px]
                    font-bold
                    text-white
                  "
                  aria-label={`${unreadCount} unread messages`}
                >
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConversationListItem;