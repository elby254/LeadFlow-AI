/**
 * ==========================================================
 *
 * CONVERSATION CONTROLLER
 *
 * ==========================================================
 *
 * Handles
 * ----------------------------------------------------------
 * ✓ Conversation List
 * ✓ Recent Conversations
 * ✓ Search
 * ✓ Get Conversation
 * ✓ Mark Read
 * ✓ Archive
 * ✓ Pin
 * ✓ AI Replies
 * ✓ AI Reply Suggestions
 * ✓ Conversation Summary
 * ✓ Conversation Insights
 * ✓ Viewing Workflow
 *
 * ORGANIZATION ISOLATION
 * ----------------------------------------------------------
 * Every conversation query is scoped to the authenticated
 * user's organization.
 *
 * Organization resolution is centralized through:
 *
 *   resolveFromRequest()
 *
 * from:
 *
 *   services/organizationResolverService.js
 *
 * IMPORTANT
 * ----------------------------------------------------------
 * Conversation identifiers are NEVER trusted by themselves.
 *
 * Every Conversation read/update must include:
 *
 * {
 *   _id: conversationId,
 *   organizationId,
 * }
 *
 * Related Message, Lead, Property and Viewing lookups are
 * also scoped to the same organization.
 *
 * ==========================================================
 *
 * CANONICAL WORKFLOW ARCHITECTURE
 * ==========================================================
 *
 * Lead lifecycle:
 *
 *   services/leadLifeCycleService.js
 *
 * Lead scoring:
 *
 *   services/leadScoringRulesEngine.js
 *
 * Viewing workflow:
 *
 *   services/viewingService.js
 *
 * Assignment:
 *
 *   assignmentConflictResolver.js
 *
 * Business events:
 *
 *   events/leadEvents.js
 *
 * IMPORTANT
 * ----------------------------------------------------------
 *
 * This controller MUST NOT directly mutate:
 *
 *   lead.status
 *
 * when the operation belongs to the viewing workflow.
 *
 * Viewing requests are delegated to viewingService.js.
 *
 * ==========================================================
 */

import { randomUUID } from "node:crypto";

import Conversation from "../models/conversation.js";
import Message from "../models/message.js";
import Lead from "../models/lead.js";
import Property from "../models/property.js";

import {
  generateAIResponse,
} from "../services/aiResponseEngine.js";

import {
  resolveFromRequest,
} from "../services/organizationResolverService.js";

import {
  executeIdempotentRequest,
} from "../services/httpIdempotencyService.js";

import {
  requestViewing as requestViewingService,
} from "../services/viewingService.js";

import leadEventBus, {
  LEAD_EVENTS,
} from "../events/leadEvents.js";

import {
  withReliableTransaction,
  addLeadStatusChangedEvent,
  addViewingRequestedEvent,
} from "../services/outboxIntegrationService.js";

/**
 * ==========================================================
 * ORGANIZATION GUARD
 * ==========================================================
 */

const requireOrganization = async (
  req,
  res
) => {
  const organization =
    await resolveFromRequest(
      req
    );

  if (!organization) {
    console.error(
      "❌ CONVERSATION CONTROLLER - ORGANIZATION NOT ASSIGNED"
    );

    res.status(403).json({
      success: false,
      message:
        "Organization not assigned.",
    });

    return null;
  }

  return organization._id;
};

/**
 * ==========================================================
 * CANONICAL VIEWING READ-MODEL EVENTS
 * ==========================================================
 *
 * Critical business events are persisted into the Outbox
 * inside the same MongoDB transaction as the database
 * mutations.
 *
 * Only non-critical read-model synchronization events are
 * emitted directly after the transaction commits.
 *
 * IMPORTANT
 * ----------------------------------------------------------
 * Do NOT directly emit:
 *
 *   LEAD_VIEWING_REQUESTED
 *   LEAD_STATUS_CHANGED
 *
 * Those events are queued through outboxIntegrationService.
 *
 * ==========================================================
 */

const emitViewingReadModelEvents = ({
  organizationId,
  viewing,
  lead,
  previousStatus,
  property,
}) => {
  try {
    const currentStatus =
      lead?.status ||
      null;

    const viewingId =
      viewing?._id ||
      null;

    const leadId =
      lead?._id ||
      viewing?.leadId ||
      viewing?.lead ||
      null;

    const occurredAt =
      new Date();

    leadEventBus.emit(
      LEAD_EVENTS.LEAD_UPDATED,
      {
        leadId,
        organizationId,
        lead,
        viewing,
        property,
        status:
          currentStatus,
        score:
          Number(
            lead?.score ||
            0
          ),
        assignedTo:
          lead?.assignedTo ||
          null,
        currentViewingId:
          lead?.currentViewing ||
          viewingId ||
          null,
        followUpStatus:
          lead?.followUpStatus ||
          null,
        occurredAt,
      }
    );

    leadEventBus.emit(
      LEAD_EVENTS.PIPELINE_UPDATED,
      {
        leadId,
        organizationId,
        lead,
        viewing,
        property,
        previousStatus,
        status:
          currentStatus,
        score:
          Number(
            lead?.score ||
            0
          ),
        assignedTo:
          lead?.assignedTo ||
          null,
        currentViewingId:
          lead?.currentViewing ||
          viewingId ||
          null,
        followUpStatus:
          lead?.followUpStatus ||
          null,
        occurredAt,
      }
    );

    console.log(
      "📡 CONVERSATION CONTROLLER - VIEWING READ-MODEL EVENTS EMITTED:",
      {
        leadId:
          leadId
            ? String(leadId)
            : null,

        viewingId:
          viewingId
            ? String(viewingId)
            : null,

        previousStatus,

        status:
          currentStatus,
      }
    );
  } catch (error) {
    console.error(
      "⚠️ CONVERSATION CONTROLLER - VIEWING READ-MODEL EVENT ERROR:",
      error
    );
  }
};

/**
 * ==========================================================
 * VIEWING TRANSACTION OPERATION ID
 * ==========================================================
 *
 * IMPORTANT
 * ----------------------------------------------------------
 * The request ID is generated outside the transaction.
 *
 * This matters because MongoDB may retry a transaction
 * callback. The same operationId must therefore be reused
 * across retries so the Outbox deduplication key remains
 * deterministic.
 *
 * ==========================================================
 */

const buildViewingOperationId = ({
  conversationId,
  requestId,
}) => {
  if (!conversationId) {
    return null;
  }

  return [
    "conversation-viewing-request",
    String(conversationId),
    String(
      requestId ||
      randomUUID()
    ),
  ].join(":");
};

/**
 * ==========================================================
 * GET RECENT CONVERSATIONS
 *
 * GET /api/conversations/recent
 * ==========================================================
 */

export const getRecentConversations =
  async (
    req,
    res
  ) => {
    try {
      console.log(
        "📥 GET RECENT CONVERSATIONS"
      );

      const organizationId =
        await requireOrganization(
          req,
          res
        );

      if (!organizationId) {
        return;
      }

      console.log(
        "🏢 GET RECENT CONVERSATIONS - ORGANIZATION:",
        organizationId
      );

      const conversations =
        await Conversation.find({
          organizationId,
        })
          .sort({
            lastUpdated:
              -1,

            updatedAt:
              -1,

            createdAt:
              -1,
          })
          .limit(
            20
          )
          .lean();

      console.log(
        "💬 GET RECENT CONVERSATIONS - COUNT:",
        conversations.length
      );

      return res.status(200).json({
  success:
    true,

  count:
    conversations.length,

  data:
    conversations,
});
    } catch (error) {
      console.error(
        "GET RECENT CONVERSATIONS ERROR:",
        error
      );

      return res.status(500).json({
        success:
          false,

        message:
          "Failed to fetch recent conversations.",

        error:
          error.message,
      });
    }
  };

/**
 * ==========================================================
 * GET CONVERSATIONS
 *
 * GET /api/conversations
 * ==========================================================
 */

export const getConversations =
  async (
    req,
    res
  ) => {
    try {
      console.log(
        "📥 GET CONVERSATIONS"
      );

      const {
        page = 1,
        limit = 20,
        search = "",
        status,
        archived,
        pinned,
      } = req.query;

      const organizationId =
        await requireOrganization(
          req,
          res
        );

      if (!organizationId) {
        return;
      }

      console.log(
        "🏢 GET CONVERSATIONS - ORGANIZATION:",
        organizationId
      );

      const pageNumber =
        Math.max(
          Number(page) ||
            1,
          1
        );

      const limitNumber =
        Math.min(
          Math.max(
            Number(limit) ||
              20,
            1
          ),
          100
        );

      const skip =
        (
          pageNumber -
          1
        ) *
        limitNumber;

      const query = {
        organizationId,
      };

      if (
        typeof search ===
          "string" &&
        search.trim()
      ) {
        const searchTerm =
          search.trim();

        query.$or = [
          {
            customerName: {
              $regex:
                searchTerm,

              $options:
                "i",
            },
          },

          {
            phoneNumber: {
              $regex:
                searchTerm,

              $options:
                "i",
            },
          },

          {
            propertyName: {
              $regex:
                searchTerm,

              $options:
                "i",
            },
          },

          {
            location: {
              $regex:
                searchTerm,

              $options:
                "i",
            },
          },
        ];
      }

      if (
        status &&
        status !==
          "all"
      ) {
        query.status =
          status;
      }

      if (
        archived ===
        "true"
      ) {
        query.archived =
          true;
      }

      if (
        archived ===
        "false"
      ) {
        query.archived = {
          $ne:
            true,
        };
      }

      if (
        pinned ===
        "true"
      ) {
        query.pinned =
          true;
      }

      console.log(
        "🔎 GET CONVERSATIONS - QUERY:",
        query
      );

      const total =
        await Conversation.countDocuments(
          query
        );

      const conversations =
        await Conversation.find(
          query
        )
          .sort({
            pinned:
              -1,

            lastUpdated:
              -1,

            updatedAt:
              -1,

            createdAt:
              -1,
          })
          .skip(
            skip
          )
          .limit(
            limitNumber
          )
          .lean();

      console.log(
        "💬 GET CONVERSATIONS - COUNT:",
        conversations.length
      );

      console.log(
        "📊 GET CONVERSATIONS - TOTAL:",
        total
      );

      const totalPages =
        Math.ceil(
          total /
          limitNumber
        );

      return res.status(200).json({
  success:
    true,

  count:
    total,

  data:
    conversations,

  conversations,

  total,

  pagination: {
          page:
            pageNumber,

          limit:
            limitNumber,

          total,

          totalPages,

          hasNextPage:
            pageNumber <
            totalPages,

          hasPreviousPage:
            pageNumber >
            1,
        },
      });
    } catch (error) {
      console.error(
        "GET CONVERSATIONS ERROR:",
        error
      );

      return res.status(500).json({
        success:
          false,

        message:
          "Failed to fetch conversations.",

        error:
          error.message,
      });
    }
  };

/**
 * ==========================================================
 * SEARCH CONVERSATIONS
 *
 * GET /api/conversations/search
 * ==========================================================
 */

export const searchConversations =
  async (
    req,
    res
  ) => {
    try {
      const {
        query = "",
      } =
        req.query;

      const organizationId =
        await requireOrganization(
          req,
          res
        );

      if (!organizationId) {
        return;
      }

      console.log(
        "🔎 SEARCH CONVERSATIONS - ORGANIZATION:",
        organizationId
      );

      if (
        typeof query !==
          "string" ||
        !query.trim()
      ) {
        return res.status(400).json({
          success:
            false,

          message:
            "Search query is required.",
        });
      }

      const searchTerm =
        query.trim();

      const searchQuery = {
        organizationId,

        $or: [
          {
            customerName: {
              $regex:
                searchTerm,

              $options:
                "i",
            },
          },

          {
            phoneNumber: {
              $regex:
                searchTerm,

              $options:
                "i",
            },
          },

          {
            propertyName: {
              $regex:
                searchTerm,

              $options:
                "i",
            },
          },

          {
            location: {
              $regex:
                searchTerm,

              $options:
                "i",
            },
          },
        ],
      };

      console.log(
        "🔎 SEARCH CONVERSATIONS - QUERY:",
        searchQuery
      );

      const conversations =
        await Conversation.find(
          searchQuery
        )
          .sort({
            lastUpdated:
              -1,

            updatedAt:
              -1,

            createdAt:
              -1,
          })
          .limit(
            50
          )
          .lean();

      console.log(
        "💬 SEARCH CONVERSATIONS - COUNT:",
        conversations.length
      );

      return res.status(200).json({
  success:
    true,

  count:
    conversations.length,

  data:
    conversations,

  conversations,

  total:
    conversations.length,
});
    } catch (error) {
      console.error(
        "SEARCH CONVERSATIONS ERROR:",
        error
      );

      return res.status(500).json({
        success:
          false,

        message:
          "Failed to search conversations.",

        error:
          error.message,
      });
    }
  };

/**
 * ==========================================================
 * GET SINGLE CONVERSATION
 *
 * GET /api/conversations/:id
 * ==========================================================
 */

export const getConversationById =
  async (
    req,
    res
  ) => {
    try {
      const {
        id,
      } =
        req.params;

      console.log(
        "📥 GET CONVERSATION:",
        id
      );

      const organizationId =
        await requireOrganization(
          req,
          res
        );

      if (!organizationId) {
        return;
      }

      console.log(
        "🏢 GET CONVERSATION - ORGANIZATION:",
        organizationId
      );

      const conversation =
        await Conversation.findOne({
          _id:
            id,

          organizationId,
        })
          .lean();

      if (!conversation) {
        return res.status(404).json({
          success:
            false,

          message:
            "Conversation not found.",
        });
      }

      console.log(
        "🔗 GET CONVERSATION - LEAD ID:",
        conversation.leadId
      );

      let lead =
        null;

      if (
        conversation.leadId
      ) {
        lead =
          await Lead.findOne({
            _id:
              conversation.leadId,

            organizationId,
          })
            .lean();
      }

      if (
        !lead &&
        conversation.lead
      ) {
        lead =
          await Lead.findOne({
            _id:
              conversation.lead,

            organizationId,
          })
            .lean();
      }

      console.log(
        "👤 GET CONVERSATION - LEAD:",
        lead
      );

      return res.status(200).json({
        success:
          true,

        data: {
          conversation,

          lead,
        },

        conversation,

        lead,
      });
    } catch (error) {
      console.error(
        "GET CONVERSATION ERROR:",
        error
      );

      return res.status(500).json({
        success:
          false,

        message:
          "Failed to fetch conversation.",

        error:
          error.message,
      });
    }
  };

/**
 * ==========================================================
 * MARK CONVERSATION READ
 *
 * PATCH /api/conversations/:id/read
 * ==========================================================
 */

export const markConversationRead =
  async (
    req,
    res
  ) => {
    try {
      const {
        id,
      } =
        req.params;

      const organizationId =
        await requireOrganization(
          req,
          res
        );

      if (!organizationId) {
        return;
      }

      console.log(
        "📖 MARK CONVERSATION READ:",
        id
      );

      const conversation =
        await Conversation.findOneAndUpdate(
          {
            _id:
              id,

            organizationId,
          },

          {
            unreadCount:
              0,

            lastReadAt:
              new Date(),
          },

          {
            returnDocument:
              "after",
          }
        );

      if (!conversation) {
        return res.status(404).json({
          success:
            false,

          message:
            "Conversation not found.",
        });
      }

      return res.status(200).json({
        success:
          true,

        message:
          "Conversation marked as read.",

        conversation,
      });
    } catch (error) {
      console.error(
        "MARK CONVERSATION READ ERROR:",
        error
      );

      return res.status(500).json({
        success:
          false,

        message:
          "Failed to mark conversation as read.",

        error:
          error.message,
      });
    }
  };

/**
 * ==========================================================
 * ARCHIVE CONVERSATION
 *
 * PATCH /api/conversations/:id/archive
 * ==========================================================
 */

export const archiveConversation =
  async (
    req,
    res
  ) => {
    try {
      const {
        id,
      } =
        req.params;

      const organizationId =
        await requireOrganization(
          req,
          res
        );

      if (!organizationId) {
        return;
      }

      console.log(
        "📦 ARCHIVE CONVERSATION:",
        id
      );

      const conversation =
        await Conversation.findOneAndUpdate(
          {
            _id:
              id,

            organizationId,
          },

          {
            archived:
              true,

            archivedAt:
              new Date(),
          },

          {
            returnDocument:
              "after",
          }
        );

      if (!conversation) {
        return res.status(404).json({
          success:
            false,

          message:
            "Conversation not found.",
        });
      }

      return res.status(200).json({
        success:
          true,

        message:
          "Conversation archived successfully.",

        conversation,
      });
    } catch (error) {
      console.error(
        "ARCHIVE CONVERSATION ERROR:",
        error
      );

      return res.status(500).json({
        success:
          false,

        message:
          "Failed to archive conversation.",

        error:
          error.message,
      });
    }
  };

/**
 * ==========================================================
 * PIN CONVERSATION
 *
 * PATCH /api/conversations/:id/pin
 * ==========================================================
 */

export const pinConversation =
  async (
    req,
    res
  ) => {
    try {
      const {
        id,
      } =
        req.params;

      const organizationId =
        await requireOrganization(
          req,
          res
        );

      if (!organizationId) {
        return;
      }

      console.log(
        "📌 PIN CONVERSATION:",
        id
      );

      const conversation =
        await Conversation.findOne({
          _id:
            id,

          organizationId,
        });

      if (!conversation) {
        return res.status(404).json({
          success:
            false,

          message:
            "Conversation not found.",
        });
      }

      conversation.pinned =
        !conversation.pinned;

      await conversation.save();

      console.log(
        "📌 PIN CONVERSATION - NEW STATE:",
        conversation.pinned
      );

      return res.status(200).json({
        success:
          true,

        message:
          conversation.pinned
            ? "Conversation pinned."
            : "Conversation unpinned.",

        conversation,
      });
    } catch (error) {
      console.error(
        "PIN CONVERSATION ERROR:",
        error
      );

      return res.status(500).json({
        success:
          false,

        message:
          "Failed to update conversation pin.",

        error:
          error.message,
      });
    }
  };

/**
 * ==========================================================
 * GENERATE AI REPLY
 *
 * POST /api/conversations/:id/ai/reply
 * ==========================================================
 */

export const generateAIReply =
  async (
    req,
    res
  ) => {
    try {
      const {
        id:
          conversationId,
      } =
        req.params;

      const {
        instruction =
          "",
      } =
        req.body ||
        {};

      console.log(
        "🤖 GENERATE AI REPLY - CONVERSATION:",
        conversationId
      );

      const organizationId =
        await requireOrganization(
          req,
          res
        );

      if (!organizationId) {
        return;
      }

      console.log(
        "🏢 GENERATE AI REPLY - ORGANIZATION:",
        organizationId
      );

      const conversation =
        await Conversation.findOne({
          _id:
            conversationId,

          organizationId,
        });

      if (!conversation) {
        return res.status(404).json({
          success:
            false,

          message:
            "Conversation not found.",
        });
      }

      const recentMessages =
        await Message.find({
          conversationId,

          organizationId,

          deleted: {
            $ne:
              true,
          },
        })
          .sort({
            createdAt:
              -1,
          })
          .limit(
            20
          )
          .lean();

      const messages =
        recentMessages.reverse();

      console.log(
        "💬 GENERATE AI REPLY - MESSAGE COUNT:",
        messages.length
      );

      let lead =
        null;

      if (
        conversation.leadId
      ) {
        lead =
          await Lead.findOne({
            _id:
              conversation.leadId,

            organizationId,
          })
            .lean();
      }

      if (
        !lead &&
        conversation.lead
      ) {
        lead =
          await Lead.findOne({
            _id:
              conversation.lead,

            organizationId,
          })
            .lean();
      }

      console.log(
        "👤 GENERATE AI REPLY - LEAD:",
        lead
      );

      const effectiveState =
        conversation?.effectiveState ||
        conversation?.state ||
        conversation?.aiState ||
        conversation?.qualificationState ||
        lead?.effectiveState ||
        lead?.state ||
        lead?.aiState ||
        {};

      console.log(
        "🧠 GENERATE AI REPLY - EFFECTIVE STATE:",
        effectiveState
      );

      const aiResult =
        conversation?.aiResult ||
        conversation?.lastAIResult ||
        lead?.aiResult ||
        {};

      console.log(
        "🤖 GENERATE AI REPLY - AI RESULT:",
        aiResult
      );

      const conversationContext = {
        messages,

        conversation,

        lead,
      };

      console.log(
        "🧠 GENERATE AI REPLY - CONVERSATION CONTEXT:",
        conversationContext
      );

      let generatedReply =
        generateAIResponse(
          lead || {},

          aiResult,

          conversationContext,

          effectiveState
        );

      console.log(
        "🤖 GENERATE AI REPLY - GENERATED RESPONSE:",
        generatedReply
      );

      if (
        instruction &&
        instruction.trim()
      ) {
        generatedReply =
          `${generatedReply}\n\n${instruction.trim()}`;

        console.log(
          "📝 GENERATE AI REPLY - INSTRUCTION APPENDED:",
          instruction.trim()
        );
      }

      const aiMessage =
        await Message.create({
          organizationId,

          conversationId,

          senderId:
            req.user?.id ||
            null,

          senderRole:
            "ai",

          text:
            generatedReply,

          attachments:
            [],

          voiceNote:
            null,

          status:
            "sent",

          delivered:
            true,

          deliveredAt:
            new Date(),

          read:
            false,
        });

      console.log(
        "✅ GENERATE AI REPLY - AI MESSAGE CREATED:",
        aiMessage._id
      );

      conversation.lastMessage = {
        text:
          generatedReply,

        senderId:
          req.user?.id ||
          null,

        senderRole:
          "ai",

        createdAt:
          aiMessage.createdAt,
      };

      conversation.updatedAt =
        new Date();

      conversation.lastUpdated =
        new Date();

      conversation.unreadCount =
        (
          conversation.unreadCount ||
          0
        ) +
        1;

      await conversation.save();

      console.log(
        "✅ GENERATE AI REPLY - CONVERSATION UPDATED"
      );

      req.io
        ?.to(
          conversationId.toString()
        )
        .emit(
          "ai_reply_generated",
          aiMessage
        );

      console.log(
        "📡 GENERATE AI REPLY - SOCKET EVENT EMITTED"
      );

      return res.status(201).json({
        success:
          true,

        message:
          "AI reply generated successfully.",

        data: {
          reply:
            generatedReply,

          message:
            aiMessage,

          conversationId,

          effectiveState,
        },
      });
    } catch (error) {
      console.error(
        "GENERATE AI REPLY ERROR:",
        error
      );

      return res.status(500).json({
        success:
          false,

        message:
          "Failed to generate AI reply.",

        error:
          error.message,
      });
    }
  };

/**
 * ==========================================================
 * GENERATE REPLY SUGGESTIONS
 *
 * POST /api/conversations/:id/ai/suggestions
 * ==========================================================
 */

export const generateReplySuggestions =
  async (
    req,
    res
  ) => {
    try {
      const {
        id:
          conversationId,
      } =
        req.params;

      const {
        tone =
          "professional",
      } =
        req.body ||
        {};

      const organizationId =
        await requireOrganization(
          req,
          res
        );

      if (!organizationId) {
        return;
      }

      console.log(
        "💡 GENERATE REPLY SUGGESTIONS - CONVERSATION:",
        conversationId
      );

      const conversation =
        await Conversation.findOne({
          _id:
            conversationId,

          organizationId,
        });

      if (!conversation) {
        return res.status(404).json({
          success:
            false,

          message:
            "Conversation not found.",
        });
      }

      const recentMessages =
        await Message.find({
          conversationId,

          organizationId,

          deleted: {
            $ne:
              true,
          },
        })
          .sort({
            createdAt:
              -1,
          })
          .limit(
            20
          )
          .lean();

      const messages =
        recentMessages.reverse();

      const latestCustomerMessage =
        [
          ...messages,
        ]
          .reverse()
          .find(
            (message) =>
              message.senderRole !==
                "ai" &&
              message.senderRole !==
                "system" &&
              message.senderRole !==
                "agent"
          );

      const latestText =
        latestCustomerMessage?.text?.trim() ||
        "";

      if (!latestText) {
        return res.status(400).json({
          success:
            false,

          message:
            "There is no customer message to generate suggestions for.",
        });
      }

      const lowerText =
        latestText.toLowerCase();

      let suggestions =
        [];

      if (
        lowerText.includes(
          "price"
        ) ||
        lowerText.includes(
          "cost"
        ) ||
        lowerText.includes(
          "how much"
        )
      ) {
        suggestions = [
          "Thanks for your interest. Which property are you asking about?",

          "I'd be happy to help with the price. Could you confirm the property you're interested in?",

          "Sure, I can help with the pricing details. Please share the property listing.",
        ];
      }

      else if (
        lowerText.includes(
          "viewing"
        ) ||
        lowerText.includes(
          "visit"
        ) ||
        lowerText.includes(
          "see the property"
        )
      ) {
        suggestions = [
          "Absolutely. What date and time would work best for you?",

          "We can arrange a viewing. Please share your preferred date and time.",

          "I'd be happy to help schedule a viewing. Which day works best for you?",
        ];
      }

      else if (
        lowerText.includes(
          "available"
        ) ||
        lowerText.includes(
          "still available"
        )
      ) {
        suggestions = [
          "I'd be happy to check the property's availability. Which property are you interested in?",

          "Sure. Could you confirm the property you're referring to?",

          "Please share the property listing and I'll help you check availability.",
        ];
      }

      else if (
        lowerText.includes(
          "location"
        ) ||
        lowerText.includes(
          "where"
        )
      ) {
        suggestions = [
          "Which property are you interested in so I can provide the correct location?",

          "Could you please confirm the property you're asking about?",

          "Please share the property listing you're referring to.",
        ];
      }

      else if (
        lowerText.includes(
          "bedroom"
        ) ||
        lowerText.includes(
          "bedrooms"
        )
      ) {
        suggestions = [
          "Sure. How many bedrooms are you looking for?",

          "How many bedrooms would best suit your needs?",

          "I'd be happy to help. What number of bedrooms do you prefer?",
        ];
      }

      else {
        suggestions = [
          "Thanks for reaching out. Could you tell me a little more about what you're looking for?",

          "I'd be happy to help. Could you share your preferred location and budget?",

          "Thanks for your message. Could you provide a few more details about your property requirements?",
        ];
      }

      return res.status(200).json({
        success:
          true,

        data: {
          conversationId,

          latestCustomerMessage:
            latestText,

          tone,

          suggestions:
            suggestions.map(
              (
                text,
                index
              ) => ({
                id:
                  `suggestion-${index + 1}`,

                tone,

                text,
              })
            ),

          contextUsed:
            messages.length,
        },
      });
    } catch (error) {
      console.error(
        "GENERATE REPLY SUGGESTIONS ERROR:",
        error
      );

      return res.status(500).json({
        success:
          false,

        message:
          "Failed to generate reply suggestions.",

        error:
          error.message,
      });
    }
  };

/**
 * ==========================================================
 * GET CONVERSATION SUMMARY
 *
 * GET /api/conversations/:id/summary
 * ==========================================================
 */

export const getConversationSummary =
  async (
    req,
    res
  ) => {
    try {
      const {
        id,
      } =
        req.params;

      const organizationId =
        await requireOrganization(
          req,
          res
        );

      if (!organizationId) {
        return;
      }

      console.log(
        "📊 GET CONVERSATION SUMMARY:",
        id
      );

      const conversation =
        await Conversation.findOne({
          _id:
            id,

          organizationId,
        })
          .lean();

      if (!conversation) {
        return res.status(404).json({
          success:
            false,

          message:
            "Conversation not found.",
        });
      }

      const messages =
        await Message.find({
          conversationId:
            id,

          organizationId,

          deleted: {
            $ne:
              true,
          },
        })
          .sort({
            createdAt:
              1,
          })
          .lean();

      const totalMessages =
        messages.length;

      const customerMessages =
        messages.filter(
          (message) =>
            message.senderRole ===
              "viewer" ||
            message.senderRole ===
              "customer"
        ).length;

      const agentMessages =
        messages.filter(
          (message) =>
            message.senderRole ===
            "agent"
        ).length;

      const aiMessages =
        messages.filter(
          (message) =>
            message.senderRole ===
            "ai"
        ).length;

      const adminMessages =
        messages.filter(
          (message) =>
            message.senderRole ===
            "admin"
        ).length;

      const unreadMessages =
        messages.filter(
          (message) =>
            !message.read
        ).length;

      const firstMessage =
        messages.length
          ? messages[0]
          : null;

      const latestMessage =
        messages.length
          ? messages[
              messages.length - 1
            ]
          : null;

      const firstActivity =
        firstMessage?.createdAt ||
        conversation.createdAt ||
        null;

      const lastActivity =
        latestMessage?.createdAt ||
        conversation.updatedAt ||
        null;

      const latestMessagePreview =
        latestMessage
          ? latestMessage.text ||
            (
              latestMessage.voiceNote
                ? "🎤 Voice Note"
                : latestMessage
                    .attachments
                    ?.length
                ? "📎 Attachment"
                : ""
            )
          : "";

      let conversationStatus =
        "empty";

      if (
        totalMessages >
        0
      ) {
        conversationStatus =
          unreadMessages >
          0
            ? "needs_attention"
            : "active";
      }

      const summary = {
        conversationId:
          conversation._id,

        totalMessages,

        customerMessages,

        agentMessages,

        aiMessages,

        adminMessages,

        unreadMessages,

        conversationStatus,

        firstActivity,

        lastActivity,

        latestMessage:
          latestMessage
            ? {
                id:
                  latestMessage._id,

                text:
                  latestMessagePreview,

                senderId:
                  latestMessage.senderId,

                senderRole:
                  latestMessage.senderRole,

                createdAt:
                  latestMessage.createdAt,

                read:
                  latestMessage.read,
              }
            : null,
      };

      return res.status(200).json({
        success:
          true,

        data: {
          conversation,

          summary,
        },
      });
    } catch (error) {
      console.error(
        "GET CONVERSATION SUMMARY ERROR:",
        error
      );

      return res.status(500).json({
        success:
          false,

        message:
          "Failed to generate conversation summary.",

        error:
          error.message,
      });
    }
  };

/**
 * ==========================================================
 * GET CONVERSATION INSIGHTS
 *
 * GET /api/conversations/:id/insights
 * ==========================================================
 */

export const getConversationInsights =
  async (
    req,
    res
  ) => {
    try {
      const {
        id,
      } =
        req.params;

      const organizationId =
        await requireOrganization(
          req,
          res
        );

      if (!organizationId) {
        return;
      }

      console.log(
        "🧠 GET CONVERSATION INSIGHTS:",
        id
      );

      const conversation =
        await Conversation.findOne({
          _id:
            id,

          organizationId,
        })
          .lean();

      if (!conversation) {
        return res.status(404).json({
          success:
            false,

          message:
            "Conversation not found.",
        });
      }

      const messages =
        await Message.find({
          conversationId:
            id,

          organizationId,

          deleted: {
            $ne:
              true,
          },
        })
          .sort({
            createdAt:
              1,
          })
          .lean();

      const customerMessages =
        messages.filter(
          (message) =>
            message.senderRole ===
              "viewer" ||
            message.senderRole ===
              "customer"
        );

      const latestCustomerMessage =
        customerMessages[
          customerMessages.length -
            1
        ];

      const text =
        latestCustomerMessage?.text ||
        "";

      const lowerText =
        text.toLowerCase();

      /**
       * This is a conversational insight category.
       *
       * It is NOT persisted as Lead.intent.
       *
       * Canonical Lead.intent remains:
       *
       *   property_search
       *   rent
       *   buy
       */

      let intent =
        "general_inquiry";

      if (
        lowerText.includes(
          "viewing"
        ) ||
        lowerText.includes(
          "visit"
        )
      ) {
        intent =
          "property_viewing";
      } else if (
        lowerText.includes(
          "price"
        ) ||
        lowerText.includes(
          "cost"
        ) ||
        lowerText.includes(
          "budget"
        )
      ) {
        intent =
          "pricing";
      } else if (
        lowerText.includes(
          "available"
        ) ||
        lowerText.includes(
          "availability"
        )
      ) {
        intent =
          "availability";
      } else if (
        lowerText.includes(
          "location"
        ) ||
        lowerText.includes(
          "where"
        )
      ) {
        intent =
          "location";
      } else if (
        lowerText.includes(
          "bedroom"
        ) ||
        lowerText.includes(
          "bedrooms"
        )
      ) {
        intent =
          "property_requirements";
      }

      const lead =
        conversation.leadId
          ? await Lead.findOne({
              _id:
                conversation.leadId,

              organizationId,
            })
              .lean()
          : conversation.lead
          ? await Lead.findOne({
              _id:
                conversation.lead,

              organizationId,
            })
              .lean()
          : null;

      const insights = {
        conversationId:
          conversation._id,

        intent,

        messageCount:
          messages.length,

        customerMessageCount:
          customerMessages.length,

        lastCustomerMessage:
          text,

        recommendedAction:
          intent ===
          "property_viewing"
            ? "Respond and confirm preferred viewing date and time."
            : intent ===
              "pricing"
            ? "Confirm the property before providing pricing information."
            : intent ===
              "availability"
            ? "Check the property's current availability."
            : intent ===
              "location"
            ? "Provide the verified property location."
            : "Continue qualification and identify the customer's property requirements.",

        leadContext:
          lead
            ? {
                id:
                  lead._id,

                status:
                  lead.status,

                score:
                  lead.score,

                budget:
                  lead.budget,

                location:
                  lead.location,

                bedrooms:
                  lead.bedrooms,

                moveDate:
                  lead.moveDate,
              }
            : null,
      };

      return res.status(200).json({
        success:
          true,

        data:
          insights,
      });
    } catch (error) {
      console.error(
        "GET CONVERSATION INSIGHTS ERROR:",
        error
      );

      return res.status(500).json({
        success:
          false,

        message:
          "Failed to generate conversation insights.",

        error:
          error.message,
      });
    }
  };

/**
 * ==========================================================
 * REQUEST VIEWING
 *
 * POST /api/conversations/:id/request-viewing
 * ==========================================================
 *
 * ATOMIC TRANSACTION BOUNDARY
 * ----------------------------------------------------------
 *
 * The viewing request is one MongoDB transaction:
 *
 *   Viewing mutation
 *        +
 *   Lead lifecycle mutation
 *        +
 *   Property mutation
 *        +
 *   Conversation mutation
 *        +
 *   Outbox business events
 *
 * Either all commit or all roll back.
 *
 * The viewing service receives the same session so it never
 * opens a separate transaction for its own database writes.
 *
 * ==========================================================
 */

export const requestViewing =
  async (
    req,
    res
  ) => {
    try {
      const {
        id:
          conversationId,
      } =
        req.params;

      const {
        propertyId,
        viewingDate,
        startTime,
        endTime,
        customerNotes,
      } =
        req.body || {};

      const organizationId =
        await requireOrganization(
          req,
          res
        );

      if (!organizationId) {
        return;
      }

      /* ----------------------------------------------------
   AUTHENTICATED ACTOR
---------------------------------------------------- */

const actorId =
  req.user?._id ||
  req.user?.id;

if (!actorId) {
  return res.status(401).json({
    success: false,
    message: "Authenticated user is required.",
  });
}

      console.log(
        "👁️ REQUEST VIEWING - CONVERSATION:",
        conversationId
      );

      console.log(
        "🏢 REQUEST VIEWING - ORGANIZATION:",
        organizationId
      );

      /* ----------------------------------------------------
         BASIC INPUT VALIDATION
      ---------------------------------------------------- */

      if (!conversationId) {
        return res.status(400).json({
          success:
            false,

          message:
            "Conversation ID is required.",
        });
      }

      if (!propertyId) {
        return res.status(400).json({
          success:
            false,

          message:
            "Property ID is required.",
        });
      }

      if (
        !viewingDate ||
        !startTime ||
        !endTime
      ) {
        return res.status(400).json({
          success:
            false,

          message:
            "Viewing date, start time and end time are required.",
        });
      }

      /* ----------------------------------------------------
   IDEMPOTENT ATOMIC WORKFLOW
---------------------------------------------------- */

const idempotentResult =
  await executeIdempotentRequest({
    req,

    organizationId,

    actorId,

    execute: async ({
  session,
  operationId,
}) => {
      /*
       * Keep the existing viewing transaction body here.
       * It must use this supplied session for every
       * business mutation and outbox write.
       */
            /* ----------------------------------------------
               LOAD CONVERSATION
            ---------------------------------------------- */

            const conversation =
              await Conversation.findOne({
                _id:
                  conversationId,

                organizationId,
              })
                .session(
                  session
                );

            if (!conversation) {
              const error =
                new Error(
                  "Conversation not found."
                );

              error.statusCode =
                404;

              throw error;
            }

            /* ----------------------------------------------
               LOAD LEAD
            ---------------------------------------------- */

            let lead =
              null;

            if (
              conversation.leadId
            ) {
              lead =
                await Lead.findOne({
                  _id:
                    conversation.leadId,

                  organizationId,
                })
                  .session(
                    session
                  );
            }

            if (
              !lead &&
              conversation.lead
            ) {
              lead =
                await Lead.findOne({
                  _id:
                    conversation.lead,

                  organizationId,
                })
                  .session(
                    session
                  );
            }

            if (!lead) {
              const error =
                new Error(
                  "No lead is associated with this conversation."
                );

              error.statusCode =
                400;

              throw error;
            }

            /* ----------------------------------------------
               LOAD PROPERTY
            ---------------------------------------------- */

            const property =
              await Property.findOne({
                _id:
                  propertyId,

                organizationId,
              })
                .session(
                  session
                );

            if (!property) {
              const error =
                new Error(
                  "Property not found."
                );

              error.statusCode =
                404;

              throw error;
            }

            /* ----------------------------------------------
               DETERMINE AGENT
            ---------------------------------------------- */

            const agentId =
              property.assignedAgent ||
              lead.assignedTo ||
              null;

            if (!agentId) {
              const error =
                new Error(
                  "No agent is assigned to handle this viewing."
                );

              error.statusCode =
                400;

              throw error;
            }

            /* ----------------------------------------------
               PRESERVE PREVIOUS LEAD STATUS
            ---------------------------------------------- */

            const previousStatus =
              lead.status;

            /* ----------------------------------------------
               VIEWING SERVICE
            *
            * IMPORTANT:
            * Same MongoDB session is passed into the
            * canonical viewing service.
            * ---------------------------------------------- */

            const viewing =
              await requestViewingService({
                organizationId,

                requestedBy:
                  req.user?._id ||
                  req.user?.id ||
                  null,

                leadId:
                  lead._id,

                conversationId: conversation._id,

                propertyId:
                  property._id,

                agentId,

                viewingDate,

                startTime,

                endTime,

                customerNotes,

                session,
              });

            /* ----------------------------------------------
               FINAL LEAD STATE
            ---------------------------------------------- */

            const updatedLead =
              await Lead.findOne({
                _id:
                  lead._id,

                organizationId,
              })
                .session(
                  session
                );

            if (!updatedLead) {
              throw new Error(
                "Lead disappeared during viewing transaction."
              );
            }

            /* ----------------------------------------------
               FINAL PROPERTY STATE
            ---------------------------------------------- */

            const updatedProperty =
              await Property.findOne({
                _id:
                  property._id,

                organizationId,
              })
                .session(
                  session
                );

            if (!updatedProperty) {
              throw new Error(
                "Property disappeared during viewing transaction."
              );
            }

            /* ----------------------------------------------
   UPDATE CONVERSATION VIEWING STATE
---------------------------------------------- */

const now = new Date();

conversation.currentViewing = viewing._id;
conversation.viewingStatus = "requested";
conversation.nextViewingDate = viewing.viewingDate;
conversation.lastViewingRequested = now;
conversation.viewingRequestCount =
  Number(conversation.viewingRequestCount || 0) + 1;

conversation.updatedAt = now;
conversation.lastUpdated = now;

await conversation.save({ session });

            /* ----------------------------------------------
               OUTBOX: VIEWING REQUESTED
            ---------------------------------------------- */

            await addViewingRequestedEvent({
              session,

              organizationId,

              viewing,

              lead:
                updatedLead,

              property:
                updatedProperty,

              previousStatus,

              operationId,
            });

            console.log(
              "📦 OUTBOX QUEUED: LEAD_VIEWING_REQUESTED"
            );

            /* ----------------------------------------------
               OUTBOX: LEAD STATUS CHANGED
            ---------------------------------------------- */

            if (
              previousStatus &&
              updatedLead.status &&
              previousStatus !==
                updatedLead.status
            ) {
              await addLeadStatusChangedEvent({
                session,

                lead:
                  updatedLead,

                organizationId,

                previousStatus,

                status:
                  updatedLead.status,

                operationId,
              });

              console.log(
                "📦 OUTBOX QUEUED: LEAD_STATUS_CHANGED",
                {
                  leadId:
                    String(
                      updatedLead._id
                    ),

                  previousStatus,

                  status:
                    updatedLead.status,
                }
              );
            }

            const transactionResult = {
  conversation,

  viewing,

  lead: updatedLead,

  property: updatedProperty,

  previousStatus,

  operationId,
};

      /*
       * Persist the successful HTTP response in the same
       * transaction as the viewing mutation and outbox events.
       */
      return {
        status: 201,

        body: {
          success: true,

          message:
            "Viewing requested successfully.",

          data: {
            viewing:
              transactionResult.viewing,

            lead:
              transactionResult.lead,

            property:
              transactionResult.property,

            conversation:
              transactionResult.conversation,
          },
        },

        /*
         * Used only after a newly committed operation.
         * This data is not included in the HTTP response.
         */
        postCommitData: {
          previousStatus:
            transactionResult.previousStatus,
        },
      };
    },

    postCommit: async (result) => {
      const data =
        result.body.data;

      const previousStatus =
        result.postCommitData?.previousStatus;

      /* ----------------------------------------------
         POST-COMMIT NON-CRITICAL READ-MODEL EVENTS
      ---------------------------------------------- */

      emitViewingReadModelEvents({
        organizationId,

        viewing:
          data.viewing,

        lead:
          data.lead,

        previousStatus,

        property:
          data.property,
      });

      /* ----------------------------------------------
         OPTIONAL SOCKET TRANSPORT
      ---------------------------------------------- */

      req.io
        ?.to(
          String(
            conversationId
          )
        )
        .emit(
          "viewing_requested",
          {
            viewing:
              data.viewing,

            lead:
              data.lead,

            property:
              data.property,
          }
        );

      console.log(
        "REQUEST VIEWING - ATOMIC TRANSACTION COMMITTED:",
        {
          operationId:
            result.operationId,

          viewingId:
            data.viewing?._id || null,

          leadId:
            data.lead?._id || null,
        }
      );
    },
  });

return res
  .status(
    idempotentResult.status
  )
  .json(
    idempotentResult.body
  );
    } catch (error) {
      console.error(
        "REQUEST VIEWING ERROR:",
        error
      );

      const statusCode =
        Number(
          error?.statusCode
        ) ||
        500;

      return res.status(
        statusCode
      ).json({
        success:
          false,

        message:
          error?.message ||
          "Failed to request viewing.",

        error:
          process.env.NODE_ENV ===
          "development"
            ? error?.message
            : undefined,
      });
    }
  };

/**
 * ==========================================================
 * DEFAULT EXPORT
 * ==========================================================
 */

export default {
  getRecentConversations,

  getConversations,

  searchConversations,

  getConversationById,

  markConversationRead,

  archiveConversation,

  pinConversation,

  generateAIReply,

  generateReplySuggestions,

  getConversationSummary,

  getConversationInsights,

  requestViewing,
};