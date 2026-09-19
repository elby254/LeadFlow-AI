/**
 * =========================================================
 * CONVERSATION HEADER
 * =========================================================
 *
 * Path
 * ----
 * src/components/dashboard/conversations/conversationHeader.jsx
 *
 * Purpose
 * -------
 * Responsible for:
 *
 * ✓ Displaying the active conversation header
 * ✓ Showing customer/viewer name
 * ✓ Showing conversation status
 * ✓ Showing property name
 * ✓ Showing phone number when available
 * ✓ Handling no active conversation
 *
 * Used By
 * -------
 * Viewer Conversation Center
 *
 * MongoDB
 * -------
 * Conversation documents use:
 *
 * _id: ObjectId(...)
 *
 * Therefore this component supports:
 *
 * conversation._id
 *
 * as the primary conversation identifier.
 *
 * =========================================================
 */

const ConversationHeader = ({ conversation = null }) => {
  /* ========================================================
     NO ACTIVE CONVERSATION
  ======================================================== */

  if (!conversation) {
    return (
      <div className="flex h-full min-h-[72px] items-center border-b bg-white px-5">
        <div>
          <h2 className="text-base font-semibold text-gray-900">
            Conversations
          </h2>

          <p className="mt-0.5 text-xs text-gray-500">
            Select a conversation to view messages
          </p>
        </div>
      </div>
    );
  }

  /* ========================================================
     SAFE DATA
  ======================================================== */

  const customerName =
    conversation.customerName ||
    conversation.customer?.name ||
    conversation.viewerName ||
    conversation.viewer?.name ||
    conversation.contactName ||
    "Unknown Customer";

  const phone =
    conversation.phone ||
    conversation.customer?.phone ||
    conversation.viewer?.phone ||
    conversation.contactPhone ||
    "";

  const propertyName =
    conversation.propertyName ||
    conversation.property?.name ||
    conversation.property?.title ||
    conversation.propertyTitle ||
    "No property selected";

  const status =
    conversation.status ||
    conversation.conversationStatus ||
    "active";

  /* ========================================================
     STATUS DISPLAY
  ======================================================== */

  const normalizedStatus = String(status).toLowerCase();

  const statusLabel =
    normalizedStatus === "closed"
      ? "Closed"
      : normalizedStatus === "resolved"
        ? "Resolved"
        : normalizedStatus === "archived"
          ? "Archived"
          : normalizedStatus === "pending"
            ? "Pending"
            : "Active";

  const statusClasses =
    normalizedStatus === "closed" ||
    normalizedStatus === "resolved" ||
    normalizedStatus === "archived"
      ? "bg-gray-100 text-gray-600"
      : normalizedStatus === "pending"
        ? "bg-yellow-50 text-yellow-700"
        : "bg-green-50 text-green-700";

  /* ========================================================
     AVATAR INITIAL
  ======================================================== */

  const avatarInitial =
    customerName && customerName !== "Unknown Customer"
      ? customerName.charAt(0).toUpperCase()
      : "?";

  /* ========================================================
     RENDER
  ======================================================== */

  return (
    <div className="flex min-h-[72px] items-center justify-between border-b bg-white px-5 py-3">
      {/* ==================================================
          CUSTOMER INFORMATION
      ================================================== */}

      <div className="flex min-w-0 items-center gap-3">
        {/* ==================================================
            AVATAR
        ================================================== */}

        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 text-sm font-semibold text-gray-600">
          {avatarInitial}
        </div>

        {/* ==================================================
            DETAILS
        ================================================== */}

        <div className="min-w-0">
          {/* CUSTOMER NAME */}

          <div className="flex flex-wrap items-center gap-2">
            <h2 className="truncate text-sm font-semibold text-gray-900">
              {customerName}
            </h2>

            {/* STATUS */}

            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${statusClasses}`}
            >
              {statusLabel}
            </span>
          </div>

          {/* PROPERTY */}

          <p
            className="mt-0.5 truncate text-xs text-gray-500"
            title={propertyName}
          >
            {propertyName}
          </p>

          {/* PHONE */}

          {phone && (
            <p className="mt-0.5 truncate text-[11px] text-gray-400">
              {phone}
            </p>
          )}
        </div>
      </div>

      {/* ==================================================
          RIGHT SIDE
      ================================================== */}

      <div className="ml-4 flex shrink-0 items-center">
        {/* ==================================================
            CONVERSATION ID

            Kept out of the visible UI, but retained here
            for debugging and future actions.
        ================================================== */}

        <span className="sr-only">
          Conversation ID:{" "}
          {conversation?._id?.toString?.() ||
            conversation?._id ||
            conversation?.id ||
            ""}
        </span>
      </div>
    </div>
  );
};

export default ConversationHeader;