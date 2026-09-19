/**
 * =========================================================
 * CONVERSATION SERVICE
 * =========================================================
 *
 * Path
 * ----
 * src/services/conversationService.js
 *
 * Purpose
 * -------
 * Central API service for LeadFlow AI conversations.
 *
 * This service is shared by:
 *
 * • ViewerConversationCenter
 * • Viewer conversation components
 * • Agent conversation components
 * • Admin conversation tools
 * • Future AI conversation workflows
 *
 * =========================================================
 *
 * VIEWER OPERATIONS
 * =========================================================
 *
 * getViewerConversations()
 *
 * getConversationMessages(conversationId)
 *
 * sendMessage({
 *   conversationId,
 *   message
 * })
 *
 * =========================================================
 *
 * IMPORTANT
 * =========================================================
 *
 * MongoDB conversation identifiers use:
 *
 *     _id
 *
 * The frontend should therefore pass:
 *
 *     conversation._id
 *
 * rather than relying on:
 *
 *     conversation.id
 *
 * =========================================================
 *
 * API ARCHITECTURE
 * =========================================================
 *
 * axiosClient
 *      ↓
 * conversationService
 *      ↓
 * conversation API
 *      ↓
 * MongoDB
 *
 * =========================================================
 */

import axiosClient from "../api/axiosClient";

/**
 * =========================================================
 * API BASE PATH
 * =========================================================
 *
 * IMPORTANT:
 *
 * Keep the base path here rather than duplicating
 * "/conversations" throughout the service.
 *
 * If your backend mounts the conversation router at:
 *
 *     /api/conversations
 *
 * this configuration is correct.
 *
 * =========================================================
 */

const BASE_PATH = "/conversations";

/**
 * =========================================================
 * RESPONSE HELPERS
 * =========================================================
 */

/**
 * Extract the actual API payload when axiosClient
 * returns an Axios response.
 *
 * This helper intentionally does NOT assume one exact
 * backend response structure.
 *
 * Supported examples:
 *
 *     response
 *
 *     response.data
 *
 *     {
 *       data: ...
 *     }
 */
const extractData = (response) => {
  if (response === undefined || response === null) {
    return response;
  }

  /**
   * Axios response:
   *
   * {
   *   data: ...
   *   status: 200
   * }
   *
   * In most cases axiosClient returns this structure.
   */
  if (
    response &&
    typeof response === "object" &&
    Object.prototype.hasOwnProperty.call(
      response,
      "data"
    )
  ) {
    return response.data;
  }

  return response;
};

/**
 * =========================================================
 * ID VALIDATION
 * =========================================================
 */

/**
 * Resolve a conversation identifier.
 *
 * MongoDB's `_id` is the canonical identifier.
 *
 * We keep `id` as a compatibility fallback because some
 * transformed API responses may expose `id`.
 */
const resolveConversationId = (conversationOrId) => {
  if (!conversationOrId) {
    return null;
  }

  /**
   * Direct string/ObjectId-like value.
   */
  if (
    typeof conversationOrId === "string" ||
    typeof conversationOrId === "number"
  ) {
    return String(conversationOrId);
  }

  /**
   * MongoDB / Mongoose document.
   */
  if (conversationOrId?._id) {
    return String(conversationOrId._id);
  }

  /**
   * Compatibility fallback.
   */
  if (conversationOrId?.id) {
    return String(conversationOrId.id);
  }

  return null;
};

/**
 * Throw a consistent error when a conversation ID
 * is required but missing.
 */
const requireConversationId = (
  conversationOrId,
  operationName
) => {
  const conversationId =
    resolveConversationId(conversationOrId);

  if (!conversationId) {
    const error = new Error(
      `Conversation ID is required to ${operationName}.`
    );

    error.code = "CONVERSATION_ID_REQUIRED";

    throw error;
  }

  return conversationId;
};

/**
 * =========================================================
 * SERVICE
 * =========================================================
 */

const conversationService = {
  /**
   * =======================================================
   * VIEWER
   * GET CONVERSATIONS
   * =======================================================
   *
   * Endpoint:
   *
   * GET /api/conversations/viewer
   *
   * Used by:
   *
   * ViewerConversationCenter
   *
   * Example:
   *
   * const response =
   *   await conversationService.getViewerConversations();
   *
   * =======================================================
   */
  async getViewerConversations() {
    console.log(
      "conversationService: Getting viewer conversations..."
    );

    try {
      const response =
        await axiosClient.get(
          `${BASE_PATH}/viewer`
        );

      console.log(
        "conversationService: Viewer conversations response:",
        response
      );

      return extractData(response);
    } catch (error) {
      console.error(
        "conversationService: Failed to get viewer conversations:",
        error
      );

      throw error;
    }
  },

  /**
   * =======================================================
   * GET CONVERSATION BY ID
   * =======================================================
   *
   * Endpoint:
   *
   * GET /api/conversations/:conversationId
   *
   * Useful for:
   *
   * • Conversation details
   * • Deep links
   * • Refreshing a conversation
   * • Future notification workflows
   *
   * =======================================================
   */
  async getConversation(conversationOrId) {
    const conversationId =
      requireConversationId(
        conversationOrId,
        "load the conversation"
      );

    console.log(
      "conversationService: Getting conversation:",
      conversationId
    );

    try {
      const response =
        await axiosClient.get(
          `${BASE_PATH}/${encodeURIComponent(
            conversationId
          )}`
        );

      console.log(
        "conversationService: Conversation response:",
        response
      );

      return extractData(response);
    } catch (error) {
      console.error(
        "conversationService: Failed to get conversation:",
        error
      );

      throw error;
    }
  },

  /**
   * =======================================================
   * GET CONVERSATION MESSAGES
   * =======================================================
   *
   * Endpoint:
   *
   * GET /api/conversations/:conversationId/messages
   *
   * Used directly by:
   *
   * ViewerConversationCenter
   *
   * Existing page call:
   *
   * conversationService.getConversationMessages(
   *   conversation._id
   * );
   *
   * =======================================================
   */
  async getConversationMessages(
    conversationOrId
  ) {
    const conversationId =
      requireConversationId(
        conversationOrId,
        "load conversation messages"
      );

    console.log(
      "conversationService: Getting messages for conversation:",
      conversationId
    );

    try {
      const response =
        await axiosClient.get(
          `${BASE_PATH}/${encodeURIComponent(
            conversationId
          )}/messages`
        );

      console.log(
        "conversationService: Conversation messages response:",
        response
      );

      return extractData(response);
    } catch (error) {
      console.error(
        "conversationService: Failed to get conversation messages:",
        error
      );

      throw error;
    }
  },

  /**
   * =======================================================
   * SEND MESSAGE
   * =======================================================
   *
   * Endpoint:
   *
   * POST /api/conversations/:conversationId/messages
   *
   * Existing page call:
   *
   * conversationService.sendMessage({
   *   conversationId,
   *   message,
   * });
   *
   * =======================================================
   *
   * Payload:
   *
   * {
   *   message: "Hello"
   * }
   *
   * =======================================================
   */
  async sendMessage({
    conversationId,
    message,
  }) {
    const resolvedConversationId =
      requireConversationId(
        conversationId,
        "send a message"
      );

    const trimmedMessage =
      typeof message === "string"
        ? message.trim()
        : "";

    /**
     * Prevent accidental empty API requests.
     */
    if (!trimmedMessage) {
      const error = new Error(
        "Message cannot be empty."
      );

      error.code = "EMPTY_MESSAGE";

      throw error;
    }

    console.log(
      "conversationService: Sending message:",
      {
        conversationId:
          resolvedConversationId,
        message: trimmedMessage,
      }
    );

    try {
      const response =
        await axiosClient.post(
          `${BASE_PATH}/${encodeURIComponent(
            resolvedConversationId
          )}/messages`,
          {
            message: trimmedMessage,
          }
        );

      console.log(
        "conversationService: Send message response:",
        response
      );

      return extractData(response);
    } catch (error) {
      console.error(
        "conversationService: Failed to send message:",
        error
      );

      throw error;
    }
  },

  /**
   * =======================================================
   * CREATE CONVERSATION
   * =======================================================
   *
   * Useful for future workflows such as:
   *
   * Viewer
   *   ↓
   * Property
   *   ↓
   * Contact Agent
   *   ↓
   * Create Conversation
   *
   * Endpoint:
   *
   * POST /api/conversations
   *
   * Example:
   *
   * createConversation({
   *   agentId,
   *   propertyId,
   *   initialMessage
   * })
   *
   * =======================================================
   */
  async createConversation({
    agentId,
    propertyId,
    initialMessage,
  } = {}) {
    const payload = {};

    if (agentId) {
      payload.agentId = agentId;
    }

    if (propertyId) {
      payload.propertyId = propertyId;
    }

    if (
      typeof initialMessage === "string" &&
      initialMessage.trim()
    ) {
      payload.initialMessage =
        initialMessage.trim();
    }

    console.log(
      "conversationService: Creating conversation:",
      payload
    );

    try {
      const response =
        await axiosClient.post(
          BASE_PATH,
          payload
        );

      console.log(
        "conversationService: Create conversation response:",
        response
      );

      return extractData(response);
    } catch (error) {
      console.error(
        "conversationService: Failed to create conversation:",
        error
      );

      throw error;
    }
  },

  /**
   * =======================================================
   * MARK CONVERSATION AS READ
   * =======================================================
   *
   * Useful for:
   *
   * • Conversation unread badges
   * • Notification synchronization
   * • Viewer dashboard
   * • Agent dashboard
   *
   * Endpoint:
   *
   * PATCH /api/conversations/:conversationId/read
   *
   * =======================================================
   */
  async markConversationAsRead(
    conversationOrId
  ) {
    const conversationId =
      requireConversationId(
        conversationOrId,
        "mark the conversation as read"
      );

    console.log(
      "conversationService: Marking conversation as read:",
      conversationId
    );

    try {
      const response =
        await axiosClient.patch(
          `${BASE_PATH}/${encodeURIComponent(
            conversationId
          )}/read`
        );

      console.log(
        "conversationService: Mark as read response:",
        response
      );

      return extractData(response);
    } catch (error) {
      console.error(
        "conversationService: Failed to mark conversation as read:",
        error
      );

      throw error;
    }
  },

  /**
   * =======================================================
   * ARCHIVE CONVERSATION
   * =======================================================
   *
   * Future conversation-management operation.
   *
   * Endpoint:
   *
   * PATCH /api/conversations/:conversationId/archive
   *
   * =======================================================
   */
  async archiveConversation(
    conversationOrId
  ) {
    const conversationId =
      requireConversationId(
        conversationOrId,
        "archive the conversation"
      );

    console.log(
      "conversationService: Archiving conversation:",
      conversationId
    );

    try {
      const response =
        await axiosClient.patch(
          `${BASE_PATH}/${encodeURIComponent(
            conversationId
          )}/archive`
        );

      console.log(
        "conversationService: Archive conversation response:",
        response
      );

      return extractData(response);
    } catch (error) {
      console.error(
        "conversationService: Failed to archive conversation:",
        error
      );

      throw error;
    }
  },

  /**
   * =======================================================
   * SEARCH CONVERSATIONS
   * =======================================================
   *
   * Future operation for conversation dashboards.
   *
   * Endpoint:
   *
   * GET /api/conversations/search
   *
   * Example:
   *
   * searchConversations("apartment")
   *
   * =======================================================
   */
  async searchConversations(query = "") {
    const trimmedQuery =
      typeof query === "string"
        ? query.trim()
        : "";

    console.log(
      "conversationService: Searching conversations:",
      trimmedQuery
    );

    try {
      const response =
        await axiosClient.get(
          `${BASE_PATH}/search`,
          {
            params: {
              q: trimmedQuery,
            },
          }
        );

      console.log(
        "conversationService: Search conversations response:",
        response
      );

      return extractData(response);
    } catch (error) {
      console.error(
        "conversationService: Failed to search conversations:",
        error
      );

      throw error;
    }
  },

  /**
   * =======================================================
   * REFRESH CONVERSATION
   * =======================================================
   *
   * Convenience method.
   *
   * Equivalent to:
   *
   * getConversation(conversationId)
   *
   * Kept separate because future caching/realtime
   * behavior can be added here without changing
   * consuming components.
   *
   * =======================================================
   */
  async refreshConversation(
    conversationOrId
  ) {
    return this.getConversation(
      conversationOrId
    );
  },

  /**
   * =======================================================
   * REFRESH MESSAGES
   * =======================================================
   *
   * Convenience alias for:
   *
   * getConversationMessages()
   *
   * =======================================================
   */
  async refreshMessages(
    conversationOrId
  ) {
    return this.getConversationMessages(
      conversationOrId
    );
  },
};

/**
 * =========================================================
 * EXPORT
 * =========================================================
 */

export default conversationService;