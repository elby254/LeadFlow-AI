/**
 * ============================================================
 *
 * PURPOSE
 * -------
 * Builds the unified Admin Dashboard activity feed.
 *
 * ACTIVITY SOURCES
 * ----------------
 * • Lead creation
 * • Lead assignment
 * • Follow-up scheduling
 * • Lead closure
 * • Conversation updates
 * • User login activity
 *
 * ORGANIZATION SECURITY
 * ---------------------
 * Every query is restricted to the supplied organizationId.
 *
 * LEAD LIFECYCLE
 * --------------
 * new
 * qualified
 * hot
 * follow_up
 * viewing_scheduled
 * closed
 *
 * ASSIGNMENT WORKFLOW
 * -------------------
 * assignedTo
 * assignedAt
 * assignedBy
 * assignedSource
 *
 * Automatic AI assignment uses:
 *
 * assignedSource = "ai"
 *
 * ============================================================
 */

import Lead from "../../models/lead.js";
import Conversation from "../../models/conversation.js";
import User from "../../models/user.js";

// ============================================================
// GET RECENT ACTIVITY
// ============================================================

export const getRecentActivity = async (
  organizationId,
  limit = 20
) => {
  try {
    // ========================================================
    // VALIDATION
    // ========================================================

    if (!organizationId) {
      console.log(
        "⚠️ Recent activity skipped: organizationId is missing."
      );

      return [];
    }

    // Prevent invalid or excessive limits
    const safeLimit = Math.min(
      Math.max(Number(limit) || 20, 1),
      100
    );

    // ========================================================
    // 1. RECENT LEADS
    // ========================================================

    const leads = await Lead.find({
      organizationId,
    })
      .sort({
        updatedAt: -1,
      })
      .limit(safeLimit)
      .populate(
        "assignedTo",
        "name email role"
      )
      .lean();

    // ========================================================
    // 2. RECENT CONVERSATIONS
    // ========================================================

    const conversations =
      await Conversation.find({
        organizationId,
      })
        .sort({
          updatedAt: -1,
        })
        .limit(safeLimit)
        .lean();

    // ========================================================
    // 3. RECENT USER ACTIVITY
    // ========================================================
    //
    // Only users belonging to the same organization
    // are included.
    //
    // ========================================================

    const users =
      await User.find({
        organizationId,
        lastLogin: {
          $ne: null,
        },
      })
        .sort({
          lastLogin: -1,
        })
        .limit(safeLimit)
        .lean();

    // ========================================================
    // UNIFIED ACTIVITY ARRAY
    // ========================================================

    const activity = [];

    // ========================================================
    // LEAD EVENTS
    // ========================================================

    leads.forEach((lead) => {
      // ======================================================
      // LEAD CREATED
      // ======================================================

      if (lead.createdAt) {
        activity.push({
          type: "lead_created",

          icon: "🟢",

          title: "New Lead",

          description:
            `${lead.name || "Unknown customer"} entered the pipeline.`,

          leadId: lead._id,

          status:
            lead.status || "new",

          score:
            Number(lead.score || 0),

          timestamp:
            lead.createdAt,
        });
      }

      // ======================================================
      // LEAD ASSIGNED
      // ======================================================
      //
      // Supports the latest assignment workflow:
      //
      // assignedTo
      // assignedAt
      // assignedBy
      // assignedSource
      //
      // ======================================================

      if (lead.assignedTo) {
        const assignedAgent =
          lead.assignedTo;

        const assignmentSource =
          lead.assignedSource ||
          "auto";

        let assignmentDescription =
          `${lead.name || "Unknown customer"} assigned to ${
            assignedAgent.name || "an agent"
          }.`;

        // Make AI assignment explicit
        if (
          assignmentSource === "ai"
        ) {
          assignmentDescription =
            `${lead.name || "Unknown customer"} was automatically assigned to ${
              assignedAgent.name || "an agent"
            } by AI routing.`;
        }

        // Manual assignment
        if (
          assignmentSource === "manual"
        ) {
          assignmentDescription =
            `${lead.name || "Unknown customer"} was manually assigned to ${
              assignedAgent.name || "an agent"
            }.`;
        }

        activity.push({
          type: "lead_assigned",

          icon:
            assignmentSource === "ai"
              ? "🤖"
              : "👤",

          title:
            assignmentSource === "ai"
              ? "AI Lead Assignment"
              : "Lead Assigned",

          description:
            assignmentDescription,

          leadId:
            lead._id,

          agentId:
            assignedAgent._id,

          agentName:
            assignedAgent.name,

          assignmentSource,

          status:
            lead.status || "new",

          score:
            Number(lead.score || 0),

          timestamp:
            lead.assignedAt ||
            lead.updatedAt ||
            lead.createdAt,
        });
      }

      // ======================================================
      // FOLLOW-UP SCHEDULED
      // ======================================================
      //
      // The latest workflow uses:
      //
      // nextFollowUpDate
      //
      // ======================================================

      if (
        lead.nextFollowUpDate
      ) {
        activity.push({
          type: "follow_up",

          icon: "📅",

          title:
            "Follow-up Scheduled",

          description:
            `${lead.name || "Unknown customer"} has a follow-up scheduled.`,

          leadId:
            lead._id,

          followUpDate:
            lead.nextFollowUpDate,

          status:
            lead.status || "follow_up",

          timestamp:
            lead.followUpUpdatedAt ||
            lead.updatedAt ||
            lead.createdAt,
        });
      }

      // ======================================================
      // VIEWING SCHEDULED
      // ======================================================
      //
      // Supported lifecycle stage:
      //
      // viewing_scheduled
      //
      // ======================================================

      if (
        lead.status ===
        "viewing_scheduled"
      ) {
        activity.push({
          type:
            "viewing_scheduled",

          icon: "🏠",

          title:
            "Viewing Scheduled",

          description:
            `${lead.name || "Unknown customer"} has a property viewing scheduled.`,

          leadId:
            lead._id,

          status:
            lead.status,

          timestamp:
            lead.updatedAt ||
            lead.createdAt,
        });
      }

      // ======================================================
      // HOT LEAD
      // ======================================================
      //
      // Only generate this event when the lead is currently
      // classified as hot.
      //
      // ======================================================

      if (
        lead.status === "hot"
      ) {
        activity.push({
          type:
            "hot_lead",

          icon: "🔥",

          title:
            "Hot Lead",

          description:
            `${lead.name || "Unknown customer"} is now classified as a hot lead.`,

          leadId:
            lead._id,

          score:
            Number(lead.score || 0),

          status:
            lead.status,

          timestamp:
            lead.updatedAt ||
            lead.createdAt,
        });
      }

      // ======================================================
      // QUALIFIED LEAD
      // ======================================================
      //
      // Useful for the agent workflow and dashboard.
      //
      // ======================================================

      if (
        lead.status ===
        "qualified"
      ) {
        activity.push({
          type:
            "lead_qualified",

          icon: "✅",

          title:
            "Lead Qualified",

          description:
            `${lead.name || "Unknown customer"} has been qualified.`,

          leadId:
            lead._id,

          score:
            Number(lead.score || 0),

          status:
            lead.status,

          timestamp:
            lead.updatedAt ||
            lead.createdAt,
        });
      }

      // ======================================================
      // LEAD CLOSED
      // ======================================================

      if (
        lead.status ===
        "closed"
      ) {
        activity.push({
          type:
            "lead_closed",

          icon: "🏆",

          title:
            "Lead Closed",

          description:
            `${lead.name || "Unknown customer"} was successfully closed.`,

          leadId:
            lead._id,

          score:
            Number(lead.score || 0),

          status:
            lead.status,

          timestamp:
            lead.updatedAt ||
            lead.createdAt,
        });
      }
    });

    // ========================================================
    // CONVERSATION EVENTS
    // ========================================================

    conversations.forEach(
      (conversation) => {
        activity.push({
          type:
            "conversation",

          icon: "💬",

          title:
            "Conversation Updated",

          description:
            `${
              conversation.customerName ||
              "Customer"
            } continued the conversation.`,

          leadId:
            conversation.leadId ||
            null,

          conversationId:
            conversation._id,

          timestamp:
            conversation.updatedAt ||
            conversation.createdAt,
        });
      }
    );

    // ========================================================
    // USER LOGIN EVENTS
    // ========================================================

    users.forEach((user) => {
      activity.push({
        type:
          "login",

        icon:
          "🔑",

        title:
          user.role === "agent"
            ? "Agent Login"
            : "User Login",

        description:
          `${user.name || "User"} logged into LeadFlowAI.`,

        userId:
          user._id,

        role:
          user.role,

        timestamp:
          user.lastLogin,
      });
    });

    // ========================================================
    // REMOVE INVALID EVENTS
    // ========================================================
    //
    // Protect the frontend from malformed timestamps.
    //
    // ========================================================

    const validActivity =
      activity.filter(
        (item) =>
          item.timestamp &&
          !Number.isNaN(
            new Date(
              item.timestamp
            ).getTime()
          )
      );

    // ========================================================
    // SORT NEWEST FIRST
    // ========================================================

    validActivity.sort(
      (a, b) =>
        new Date(
          b.timestamp
        ) -
        new Date(
          a.timestamp
        )
    );

    // ========================================================
    // RETURN LIMITED FEED
    // ========================================================

    return validActivity.slice(
      0,
      safeLimit
    );

  } catch (error) {
    // ========================================================
    // ERROR HANDLING
    // ========================================================

    console.error(
      "❌ Recent activity analytics error:",
      error
    );

    return [];
  }
};

// ============================================================
// DEFAULT EXPORT
// ============================================================

export default {
  getRecentActivity,
};