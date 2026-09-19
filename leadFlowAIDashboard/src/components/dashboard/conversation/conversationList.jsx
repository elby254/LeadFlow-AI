/**
 * =========================================================
 * CONVERSATION LIST
 * =========================================================
 *
 * Path
 * ----
 * src/components/dashboard/conversations/conversationList.jsx
 *
 * Purpose
 * -------
 * Responsible for:
 *
 * ✓ Displaying the viewer's conversations
 * ✓ Selecting an active conversation
 * ✓ Showing conversation count
 * ✓ Handling empty state
 * ✓ Highlighting the active conversation
 *
 * Database
 * --------
 * MongoDB conversations use:
 *
 * _id: ObjectId(...)
 *
 * The frontend may receive the MongoDB ObjectId as a
 * string after JSON serialization.
 *
 * Used By
 * -------
 * Viewer Conversation Center
 *
 * =========================================================
 */

import ConversationListItem from "./conversationListItem";

const ConversationList = ({
  conversations = [],
  activeConversation = null,
  onConversationSelect,
}) => {
  /* ========================================================
     SAFE CONVERSATION DATA
  ======================================================== */

  const conversationItems = Array.isArray(conversations)
    ? conversations
    : [];

  /* ========================================================
     NORMALIZE CONVERSATION ID
  ======================================================== */

  const getConversationId = (conversation) => {
    if (!conversation) {
      return null;
    }

    /*
     * MongoDB uses _id.
     *
     * Some frontend code may still use id, so we keep the
     * fallback for compatibility.
     */

    const id =
      conversation?._id ??
      conversation?.id ??
      null;

    if (id === null || id === undefined) {
      return null;
    }

    /*
     * ObjectId values returned from MongoDB/API should normally
     * already be strings in the browser.
     *
     * String() also safely handles ObjectId-like values.
     */

    return String(id);
  };

  /* ========================================================
     ACTIVE CONVERSATION ID
  ======================================================== */

  const activeConversationId =
    getConversationId(activeConversation);

  /* ========================================================
     HANDLE CONVERSATION SELECTION
  ======================================================== */

  const handleConversationSelect = (conversation) => {
    if (!conversation) {
      return;
    }

    if (typeof onConversationSelect === "function") {
      onConversationSelect(conversation);
    }
  };

  /* ========================================================
     EMPTY STATE
  ======================================================== */

  if (conversationItems.length === 0) {
    return (
      <div className="flex h-full flex-col">
        {/* ==================================================
            HEADER
        ================================================== */}

        <div className="shrink-0 border-b px-4 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-900">
              Conversations
            </h2>

            <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">
              0
            </span>
          </div>
        </div>

        {/* ==================================================
            EMPTY CONTENT
        ================================================== */}

        <div className="flex flex-1 items-center justify-center px-6 py-10 text-center">
          <div>
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.8}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a10.8 10.8 0 01-4.13-.8L3 20l1.47-4.04A7.86 7.86 0 013 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
            </div>

            <h3 className="text-sm font-semibold text-gray-800">
              No conversations
            </h3>

            <p className="mt-1 text-xs leading-5 text-gray-500">
              Your conversations will appear here.
            </p>
          </div>
        </div>
      </div>
    );
  }

  /* ========================================================
     RENDER
  ======================================================== */

  return (
    <div className="flex h-full flex-col">
      {/* ====================================================
          LIST HEADER
      ==================================================== */}

      <div className="shrink-0 border-b px-4 py-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-900">
            Conversations
          </h2>

          <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">
            {conversationItems.length}
          </span>
        </div>
      </div>

      {/* ====================================================
          CONVERSATION ITEMS
      ==================================================== */}

      <div className="min-h-0 flex-1 overflow-y-auto">
        {conversationItems.map((conversation, index) => {
          /* ==================================================
             CONVERSATION ID

             Example from MongoDB:

             _id:
             ObjectId("6a426c07b8e66972b176c0af")

             Browser/API representation:

             "6a426c07b8e66972b176c0af"
          ================================================== */

          const conversationId =
            getConversationId(conversation);

          /* ==================================================
             ACTIVE STATE

             Normalize both IDs to strings so that:

             ObjectId
             "6a426c07b8e66972b176c0af"

             and

             "6a426c07b8e66972b176c0af"

             compare correctly.
          ================================================== */

          const isActive =
            conversationId !== null &&
            activeConversationId !== null &&
            conversationId === activeConversationId;

          /* ==================================================
             SAFE REACT KEY
          ================================================== */

          const itemKey =
            conversationId || `conversation-${index}`;

          return (
            <ConversationListItem
              key={itemKey}
              conversation={conversation}
              active={isActive}
              onClick={() =>
                handleConversationSelect(conversation)
              }
            />
          );
        })}
      </div>
    </div>
  );
};

export default ConversationList;