/**
 * ==========================================================
 *
 * LeadFlow AI - Conversation Controller
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
 * Supported organization sources:
 *
 * req.user.organizationId
 * req.organizationId
 *
 * ==========================================================
 */

import Conversation from "../models/conversation.js";
import Message from "../models/message.js";
import Lead from "../models/lead.js";
import Property from "../models/property.js";
import Viewing from "../models/viewing.js";

import {
  generateAIResponse,
} from "../services/aiResponseEngine.js";

/**
 * ==========================================================
 * ORGANIZATION HELPER
 * ==========================================================
 *
 * Resolve organization ID from the authenticated request.
 *
 * Priority:
 *
 * 1. req.user.organizationId
 * 2. req.organizationId
 *
 * Returns:
 * organizationId | null
 *
 * ==========================================================
 */

const getOrganizationId = (req) => {
  return (
    req.user?.organizationId ||
    req.organizationId ||
    null
  );
};

/**
 * ==========================================================
 * ORGANIZATION GUARD
 * ==========================================================
 */

const requireOrganization = (
  req,
  res
) => {
  const organizationId =
    getOrganizationId(req);

  if (!organizationId) {
    console.error(
      "❌ CONVERSATION CONTROLLER - ORGANIZATION NOT ASSIGNED"
    );

    return res.status(403).json({
      success: false,
      message:
        "Organization not assigned.",
    });
  }

  return organizationId;
};

/**
 * ==========================================================
 * GET RECENT CONVERSATIONS
 *
 * GET /api/conversations/recent
 *
 * ==========================================================
 */

export const getRecentConversations =
  async (req, res) => {
    try {
      console.log(
        "📥 GET RECENT CONVERSATIONS"
      );

      const organizationId =
        requireOrganization(
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
            lastUpdated: -1,
            updatedAt: -1,
            createdAt: -1,
          })
          .limit(20)
          .lean();

      console.log(
        "💬 GET RECENT CONVERSATIONS - COUNT:",
        conversations.length
      );

      return res.status(200).json({
        success: true,
        data: conversations,
      });
    } catch (error) {
      console.error(
        "GET RECENT CONVERSATIONS ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
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
 *
 * Supported query parameters:
 *
 * ?page=1
 * ?limit=20
 * ?search=john
 * ?status=active
 * ?archived=true
 * ?archived=false
 * ?pinned=true
 *
 * ==========================================================
 */

export const getConversations =
  async (req, res) => {
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

      /**
       * ------------------------------------------------------
       * ORGANIZATION
       * ------------------------------------------------------
       */

      const organizationId =
        requireOrganization(
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

      /**
       * ------------------------------------------------------
       * PAGINATION
       * ------------------------------------------------------
       */

      const pageNumber =
        Math.max(
          Number(page) || 1,
          1
        );

      const limitNumber =
        Math.min(
          Math.max(
            Number(limit) || 20,
            1
          ),
          100
        );

      const skip =
        (pageNumber - 1) *
        limitNumber;

      /**
       * ------------------------------------------------------
       * BASE QUERY
       * ------------------------------------------------------
       *
       * IMPORTANT:
       *
       * Organization filtering MUST exist here.
       *
       * This prevents:
       *
       * Organization A
       *       ↓
       * GET /api/conversations
       *       ↓
       * receiving
       * Organization B conversations.
       *
       * ------------------------------------------------------
       */

      const query = {
        organizationId,
      };

      /**
       * ------------------------------------------------------
       * SEARCH
       * ------------------------------------------------------
       */

      if (
        typeof search === "string" &&
        search.trim()
      ) {
        const searchTerm =
          search.trim();

        query.$or = [
          {
            customerName: {
              $regex:
                searchTerm,
              $options: "i",
            },
          },
          {
            phoneNumber: {
              $regex:
                searchTerm,
              $options: "i",
            },
          },
          {
            propertyName: {
              $regex:
                searchTerm,
              $options: "i",
            },
          },
          {
            location: {
              $regex:
                searchTerm,
              $options: "i",
            },
          },
        ];
      }

      /**
       * ------------------------------------------------------
       * STATUS FILTER
       * ------------------------------------------------------
       */

      if (
        status &&
        status !== "all"
      ) {
        query.status =
          status;
      }

      /**
       * ------------------------------------------------------
       * ARCHIVED FILTER
       * ------------------------------------------------------
       */

      if (
        archived === "true"
      ) {
        query.archived =
          true;
      }

      if (
        archived === "false"
      ) {
        query.archived = {
          $ne: true,
        };
      }

      /**
       * ------------------------------------------------------
       * PINNED FILTER
       * ------------------------------------------------------
       */

      if (
        pinned === "true"
      ) {
        query.pinned =
          true;
      }

      console.log(
        "🔎 GET CONVERSATIONS - QUERY:",
        query
      );

      /**
       * ------------------------------------------------------
       * TOTAL
       * ------------------------------------------------------
       */

      const total =
        await Conversation.countDocuments(
          query
        );

      /**
       * ------------------------------------------------------
       * FETCH
       * ------------------------------------------------------
       */

      const conversations =
        await Conversation.find(
          query
        )
          .sort({
            pinned: -1,
            lastUpdated: -1,
            updatedAt: -1,
            createdAt: -1,
          })
          .skip(skip)
          .limit(limitNumber)
          .lean();

      console.log(
        "💬 GET CONVERSATIONS - COUNT:",
        conversations.length
      );

      console.log(
        "📊 GET CONVERSATIONS - TOTAL:",
        total
      );

      return res.status(200).json({
        success: true,

        data: conversations,

        conversations,

        total,

        pagination: {
          page:
            pageNumber,

          limit:
            limitNumber,

          total,

          totalPages:
            Math.ceil(
              total /
                limitNumber
            ),

          hasNextPage:
            pageNumber <
            Math.ceil(
              total /
                limitNumber
            ),

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
        success: false,
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
 *
 * ==========================================================
 */

export const searchConversations =
  async (req, res) => {
    try {
      const {
        query = "",
      } = req.query;

      /**
       * ------------------------------------------------------
       * ORGANIZATION
       * ------------------------------------------------------
       */

      const organizationId =
        requireOrganization(
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

      /**
       * ------------------------------------------------------
       * VALIDATE SEARCH
       * ------------------------------------------------------
       */

      if (
        typeof query !== "string" ||
        !query.trim()
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Search query is required.",
        });
      }

      const searchTerm =
        query.trim();

      /**
       * ------------------------------------------------------
       * ORGANIZATION-SCOPED SEARCH
       * ------------------------------------------------------
       */

      const searchQuery = {
        organizationId,

        $or: [
          {
            customerName: {
              $regex:
                searchTerm,
              $options: "i",
            },
          },
          {
            phoneNumber: {
              $regex:
                searchTerm,
              $options: "i",
            },
          },
          {
            propertyName: {
              $regex:
                searchTerm,
              $options: "i",
            },
          },
          {
            location: {
              $regex:
                searchTerm,
              $options: "i",
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
            lastUpdated: -1,
            updatedAt: -1,
            createdAt: -1,
          })
          .limit(50)
          .lean();

      console.log(
        "💬 SEARCH CONVERSATIONS - COUNT:",
        conversations.length
      );

      return res.status(200).json({
        success: true,

        data: conversations,

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
        success: false,
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
 *
 * ==========================================================
 */

export const getConversationById =
  async (req, res) => {
    try {
      const {
        id,
      } = req.params;

      console.log(
        "📥 GET CONVERSATION:",
        id
      );

      /**
       * ------------------------------------------------------
       * ORGANIZATION
       * ------------------------------------------------------
       */

      const organizationId =
        requireOrganization(
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

      /**
       * ------------------------------------------------------
       * ORGANIZATION-SCOPED LOOKUP
       * ------------------------------------------------------
       *
       * DO NOT use:
       *
       * Conversation.findById(id)
       *
       * because that allows an authenticated user to retrieve
       * another organization's conversation if they somehow
       * obtain its ID.
       *
       * ------------------------------------------------------
       */

      const conversation =
        await Conversation.findOne({
          _id: id,
          organizationId,
        }).lean();

      if (!conversation) {
        return res.status(404).json({
          success: false,
          message:
            "Conversation not found.",
        });
      }

      console.log(
        "🔗 GET CONVERSATION - LEAD ID:",
        conversation.leadId
      );

      /**
       * ------------------------------------------------------
       * LOAD ASSOCIATED LEAD
       * ------------------------------------------------------
       *
       * Support:
       *
       * conversation.leadId
       * conversation.lead
       *
       * ------------------------------------------------------
       */

      let lead = null;

      if (
        conversation.leadId
      ) {
        lead =
          await Lead.findById(
            conversation.leadId
          ).lean();
      }

      if (
        !lead &&
        conversation.lead
      ) {
        lead =
          await Lead.findById(
            conversation.lead
          ).lean();
      }

      console.log(
        "👤 GET CONVERSATION - LEAD:",
        lead
      );

      return res.status(200).json({
        success: true,

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
        success: false,
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
 *
 * ==========================================================
 */

export const markConversationRead =
  async (req, res) => {
    try {
      const {
        id,
      } = req.params;

      const organizationId =
        requireOrganization(
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
            _id: id,
            organizationId,
          },
          {
            unreadCount: 0,
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
          success: false,
          message:
            "Conversation not found.",
        });
      }

      return res.status(200).json({
        success: true,

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
        success: false,
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
 *
 * ==========================================================
 */

export const archiveConversation =
  async (req, res) => {
    try {
      const {
        id,
      } = req.params;

      const organizationId =
        requireOrganization(
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
            _id: id,
            organizationId,
          },
          {
            archived: true,
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
          success: false,
          message:
            "Conversation not found.",
        });
      }

      return res.status(200).json({
        success: true,

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
        success: false,
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
 *
 * ==========================================================
 */

export const pinConversation =
  async (req, res) => {
    try {
      const {
        id,
      } = req.params;

      const organizationId =
        requireOrganization(
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
          _id: id,
          organizationId,
        });

      if (!conversation) {
        return res.status(404).json({
          success: false,
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
        success: true,

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
        success: false,
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
 *
 * ==========================================================
 */

export const generateAIReply =
  async (req, res) => {
    try {
      const {
        id: conversationId,
      } = req.params;

      const {
        instruction = "",
      } = req.body || {};

      console.log(
        "🤖 GENERATE AI REPLY - CONVERSATION:",
        conversationId
      );

      /**
       * ------------------------------------------------------
       * ORGANIZATION
       * ------------------------------------------------------
       */

      const organizationId =
        requireOrganization(
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

      /**
       * ------------------------------------------------------
       * LOAD CONVERSATION
       * ------------------------------------------------------
       */

      const conversation =
        await Conversation.findOne({
          _id: conversationId,
          organizationId,
        });

      if (!conversation) {
        return res.status(404).json({
          success: false,
          message:
            "Conversation not found.",
        });
      }

      /**
       * ------------------------------------------------------
       * LOAD RECENT MESSAGES
       * ------------------------------------------------------
       */

      const recentMessages =
        await Message.find({
          conversationId,
          deleted: {
            $ne: true,
          },
        })
          .sort({
            createdAt: -1,
          })
          .limit(20)
          .lean();

      const messages =
        recentMessages.reverse();

      console.log(
        "💬 GENERATE AI REPLY - MESSAGE COUNT:",
        messages.length
      );

      /**
       * ------------------------------------------------------
       * LOAD LEAD
       * ------------------------------------------------------
       */

      let lead = null;

      if (
        conversation.leadId
      ) {
        lead =
          await Lead.findById(
            conversation.leadId
          ).lean();
      }

      if (
        !lead &&
        conversation.lead
      ) {
        lead =
          await Lead.findById(
            conversation.lead
          ).lean();
      }

      console.log(
        "👤 GENERATE AI REPLY - LEAD:",
        lead
      );

      /**
       * ------------------------------------------------------
       * RESOLVE STATE
       * ------------------------------------------------------
       */

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

      /**
       * ------------------------------------------------------
       * AI RESULT
       * ------------------------------------------------------
       */

      const aiResult =
        conversation?.aiResult ||
        conversation?.lastAIResult ||
        lead?.aiResult ||
        {};

      console.log(
        "🤖 GENERATE AI REPLY - AI RESULT:",
        aiResult
      );

      /**
       * ------------------------------------------------------
       * BUILD CONVERSATION CONTEXT
       * ------------------------------------------------------
       */

      const conversationContext = {
        messages,
        conversation,
        lead,
      };

      console.log(
        "🧠 GENERATE AI REPLY - CONVERSATION CONTEXT:",
        conversationContext
      );

      /**
       * ------------------------------------------------------
       * GENERATE RESPONSE
       * ------------------------------------------------------
       */

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

      /**
       * ------------------------------------------------------
       * OPTIONAL INSTRUCTION
       * ------------------------------------------------------
       */

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

      /**
       * ------------------------------------------------------
       * CREATE AI MESSAGE
       * ------------------------------------------------------
       */

      const aiMessage =
        await Message.create({
          conversationId,

          senderId:
            req.user?.id || null,

          senderRole: "ai",

          text:
            generatedReply,

          attachments: [],

          voiceNote: null,

          status: "sent",

          delivered: true,

          deliveredAt:
            new Date(),

          read: false,
        });

      console.log(
        "✅ GENERATE AI REPLY - AI MESSAGE CREATED:",
        aiMessage._id
      );

      /**
       * ------------------------------------------------------
       * UPDATE CONVERSATION
       * ------------------------------------------------------
       */

      conversation.lastMessage = {
        text:
          generatedReply,

        senderId:
          req.user?.id || null,

        senderRole: "ai",

        createdAt:
          aiMessage.createdAt,
      };

      conversation.updatedAt =
        new Date();

      conversation.lastUpdated =
        new Date();

      conversation.unreadCount =
        (conversation.unreadCount || 0) +
        1;

      await conversation.save();

      console.log(
        "✅ GENERATE AI REPLY - CONVERSATION UPDATED"
      );

      /**
       * ------------------------------------------------------
       * SOCKET EVENT
       * ------------------------------------------------------
       */

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

      /**
       * ------------------------------------------------------
       * RESPONSE
       * ------------------------------------------------------
       */

      return res.status(201).json({
        success: true,

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
        success: false,
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
 *
 * ==========================================================
 */

export const generateReplySuggestions =
  async (req, res) => {
    try {
      const {
        id: conversationId,
      } = req.params;

      const {
        tone = "professional",
      } = req.body || {};

      const organizationId =
        requireOrganization(
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

      /**
       * ------------------------------------------------------
       * ORGANIZATION-SCOPED CONVERSATION
       * ------------------------------------------------------
       */

      const conversation =
        await Conversation.findOne({
          _id: conversationId,
          organizationId,
        });

      if (!conversation) {
        return res.status(404).json({
          success: false,
          message:
            "Conversation not found.",
        });
      }

      /**
       * ------------------------------------------------------
       * LOAD MESSAGES
       * ------------------------------------------------------
       */

      const recentMessages =
        await Message.find({
          conversationId,
          deleted: {
            $ne: true,
          },
        })
          .sort({
            createdAt: -1,
          })
          .limit(20)
          .lean();

      const messages =
        recentMessages.reverse();

      /**
       * ------------------------------------------------------
       * FIND LATEST CUSTOMER MESSAGE
       * ------------------------------------------------------
       */

      const latestCustomerMessage =
        [...messages]
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
          success: false,
          message:
            "There is no customer message to generate suggestions for.",
        });
      }

      const lowerText =
        latestText.toLowerCase();

      let suggestions = [];

      /**
       * ------------------------------------------------------
       * PRICING
       * ------------------------------------------------------
       */

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

      /**
       * ------------------------------------------------------
       * VIEWING
       * ------------------------------------------------------
       */

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

      /**
       * ------------------------------------------------------
       * AVAILABILITY
       * ------------------------------------------------------
       */

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

      /**
       * ------------------------------------------------------
       * LOCATION
       * ------------------------------------------------------
       */

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

      /**
       * ------------------------------------------------------
       * BEDROOMS
       * ------------------------------------------------------
       */

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

      /**
       * ------------------------------------------------------
       * GENERAL
       * ------------------------------------------------------
       */

      else {
        suggestions = [
          "Thanks for reaching out. Could you tell me a little more about what you're looking for?",

          "I'd be happy to help. Could you share your preferred location and budget?",

          "Thanks for your message. Could you provide a few more details about your property requirements?",
        ];
      }

      return res.status(200).json({
        success: true,

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
        success: false,
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
 *
 * ==========================================================
 */

export const getConversationSummary =
  async (req, res) => {
    try {
      const {
        id,
      } = req.params;

      const organizationId =
        requireOrganization(
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

      /**
       * ------------------------------------------------------
       * ORGANIZATION-SCOPED CONVERSATION
       * ------------------------------------------------------
       */

      const conversation =
        await Conversation.findOne({
          _id: id,
          organizationId,
        }).lean();

      if (!conversation) {
        return res.status(404).json({
          success: false,
          message:
            "Conversation not found.",
        });
      }

      /**
       * ------------------------------------------------------
       * LOAD MESSAGES
       * ------------------------------------------------------
       */

      const messages =
        await Message.find({
          conversationId: id,

          deleted: {
            $ne: true,
          },
        })
          .sort({
            createdAt: 1,
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
                : latestMessage.attachments
                    ?.length
                ? "📎 Attachment"
                : ""
            )
          : "";

      let conversationStatus =
        "empty";

      if (
        totalMessages > 0
      ) {
        conversationStatus =
          unreadMessages > 0
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
        success: true,

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
        success: false,

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
 *
 * ==========================================================
 */

export const getConversationInsights =
  async (req, res) => {
    try {
      const {
        id,
      } = req.params;

      const organizationId =
        requireOrganization(
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

      /**
       * ------------------------------------------------------
       * ORGANIZATION-SCOPED CONVERSATION
       * ------------------------------------------------------
       */

      const conversation =
        await Conversation.findOne({
          _id: id,
          organizationId,
        }).lean();

      if (!conversation) {
        return res.status(404).json({
          success: false,
          message:
            "Conversation not found.",
        });
      }

      /**
       * ------------------------------------------------------
       * LOAD MESSAGES
       * ------------------------------------------------------
       */

      const messages =
        await Message.find({
          conversationId: id,

          deleted: {
            $ne: true,
          },
        })
          .sort({
            createdAt: 1,
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
          customerMessages.length - 1
        ];

      const text =
        latestCustomerMessage?.text ||
        "";

      const lowerText =
        text.toLowerCase();

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

      /**
       * ------------------------------------------------------
       * LOAD LEAD
       * ------------------------------------------------------
       */

      const lead =
        conversation.leadId
          ? await Lead.findById(
              conversation.leadId
            ).lean()
          : conversation.lead
          ? await Lead.findById(
              conversation.lead
            ).lean()
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
        success: true,

        data: insights,
      });
    } catch (error) {
      console.error(
        "GET CONVERSATION INSIGHTS ERROR:",
        error
      );

      return res.status(500).json({
        success: false,

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
 *
 * ==========================================================
 */

export const requestViewing =
  async (req, res) => {
    try {
      const {
        id: conversationId,
      } = req.params;

      const {
        propertyId,
        viewingDate,
        startTime,
        endTime,
        customerNotes,
      } = req.body;

      /**
       * ------------------------------------------------------
       * ORGANIZATION
       * ------------------------------------------------------
       */

      const organizationId =
        requireOrganization(
          req,
          res
        );

      if (!organizationId) {
        return;
      }

      console.log(
        "👁️ REQUEST VIEWING - CONVERSATION:",
        conversationId
      );

      console.log(
        "🏢 REQUEST VIEWING - ORGANIZATION:",
        organizationId
      );

      /**
       * ------------------------------------------------------
       * LOAD ORGANIZATION-SCOPED CONVERSATION
       * ------------------------------------------------------
       */

      const conversation =
        await Conversation.findOne({
          _id: conversationId,
          organizationId,
        });

      if (!conversation) {
        return res.status(404).json({
          success: false,
          message:
            "Conversation not found.",
        });
      }

      /**
       * ------------------------------------------------------
       * VALIDATE PROPERTY
       * ------------------------------------------------------
       */

      if (!propertyId) {
        return res.status(400).json({
          success: false,
          message:
            "Property ID is required.",
        });
      }

      const property =
        await Property.findById(
          propertyId
        );

      if (!property) {
        return res.status(404).json({
          success: false,
          message:
            "Property not found.",
        });
      }

      /**
       * ------------------------------------------------------
       * LOAD LEAD
       * ------------------------------------------------------
       */

      let lead = null;

      if (
        conversation.leadId
      ) {
        lead =
          await Lead.findById(
            conversation.leadId
          );
      }

      if (
        !lead &&
        conversation.lead
      ) {
        lead =
          await Lead.findById(
            conversation.lead
          );
      }

      if (!lead) {
        return res.status(400).json({
          success: false,
          message:
            "No lead is associated with this conversation.",
        });
      }

      console.log(
        "👤 REQUEST VIEWING - LEAD:",
        lead._id
      );

      console.log(
        "🏠 REQUEST VIEWING - PROPERTY:",
        property._id
      );

      /**
       * ------------------------------------------------------
       * CREATE VIEWING
       * ------------------------------------------------------
       */

      const viewing =
        await Viewing.create({
          lead:
            lead._id,

          property:
            property._id,

          agent:
            property.assignedAgent,

          requestedBy:
            req.user?.id ||
            null,

          viewingDate,

          startTime,

          endTime,

          customerNotes,

          location: {
            address:
              property.location,

            city:
              property.city,

            county:
              property.county,
          },

          status:
            "Requested",
        });

      /**
       * ------------------------------------------------------
       * UPDATE LEAD
       * ------------------------------------------------------
       */

      lead.status =
        "viewing";

      await lead.save();

      /**
       * ------------------------------------------------------
       * UPDATE PROPERTY
       * ------------------------------------------------------
       */

      property.availability =
        "viewing_booked";

      await property.save();

      /**
       * ------------------------------------------------------
       * UPDATE CONVERSATION
       * ------------------------------------------------------
       */

      conversation.updatedAt =
        new Date();

      conversation.lastUpdated =
        new Date();

      await conversation.save();

      console.log(
        "✅ REQUEST VIEWING - VIEWING CREATED:",
        viewing._id
      );

      console.log(
        "✅ REQUEST VIEWING - CONVERSATION UPDATED"
      );

      return res.status(201).json({
        success: true,

        message:
          "Viewing requested successfully.",

        data: {
          viewing,

          lead,

          property,
        },
      });
    } catch (error) {
      console.error(
        "REQUEST VIEWING ERROR:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          "Failed to request viewing.",

        error:
          error.message,
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