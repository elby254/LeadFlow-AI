/**
 * ============================================================
 *
 * PURPOSE
 * ------------------------------------------------------------
 * Generates the Admin Agent Leaderboard.
 *
 * This service is READ-ONLY.
 *
 * It does NOT:
 * - assign leads
 * - reassign leads
 * - modify lead status
 * - modify agent workload
 *
 * Assignment is handled by:
 *
 * leadAutoAssignmentService.js
 *
 * ============================================================
 *
 * USED BY
 * ------------------------------------------------------------
 * - AdminDashboardController
 * - AgentLeaderboard.jsx
 * - Admin dashboard analytics
 *
 * ============================================================
 *
 * ORGANIZATION SECURITY
 * ------------------------------------------------------------
 * Agents and leads are always filtered by organizationId.
 *
 * This prevents one organization from seeing another
 * organization's lead or agent performance data.
 *
 * ============================================================
 *
 * CURRENT AGENT WORKFLOW
 * ------------------------------------------------------------
 *
 * Agent eligibility:
 *
 * role       = "agent"
 * isActive   = true
 *
 * Lead ownership:
 *
 * assignedTo = agent._id
 *
 * Lead lifecycle:
 *
 * new
 * qualified
 * hot
 * follow_up
 * viewing_scheduled
 * closed
 *
 * ============================================================
 */

import User from "../../models/user.js";
import Lead from "../../models/lead.js";

// ============================================================
// LEAD STATUS DEFINITIONS
// ============================================================
//
// These are the statuses currently used by the LeadFlow AI
// lead lifecycle / dashboard workflow.
//
// ============================================================

const ACTIVE_STATUSES = [
  "new",
  "qualified",
  "hot",
  "follow_up",
  "viewing_scheduled",
];

const CLOSED_STATUS = "closed";

// ============================================================
// SAFE NUMBER HELPER
// ============================================================
//
// Prevents undefined / null / invalid values from affecting
// analytics calculations.
//
// ============================================================

const safeNumber = (value) => {
  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : 0;
};

// ============================================================
// GET AGENT LEADERBOARD
// ============================================================
//
// Returns performance metrics for every active agent within
// the specified organization.
//
// ============================================================

export const getAgentLeaderboard = async (
  organizationId
) => {
  try {
    // ========================================================
    // VALIDATE ORGANIZATION
    // ========================================================

    if (!organizationId) {
      console.log(
        "⚠️ Agent leaderboard skipped: organizationId is missing."
      );

      return [];
    }

    // ========================================================
    // FETCH ACTIVE AGENTS
    // ========================================================
    //
    // This matches the agent selection rules used by
    // leadAutoAssignmentService.js.
    //
    // Only active agents can receive automatically assigned
    // leads and appear in the active leaderboard.
    //
    // ========================================================

    const agents = await User.find({
      organizationId,
      role: "agent",
      isActive: true,
    })
      .select(
        "_id name email assignedLeadCount closedLeadCount isActive organizationId"
      )
      .sort({
        createdAt: 1,
      });

    // ========================================================
    // NO ACTIVE AGENTS
    // ========================================================

    if (!agents.length) {
      console.log(
        `ℹ️ No active agents found for organization ${organizationId}.`
      );

      return [];
    }

    console.log(
      `👥 Building leaderboard for ${agents.length} active agent(s).`
    );

    // ========================================================
    // BUILD AGENT METRICS
    // ========================================================

    const leaderboard = await Promise.all(
      agents.map(async (agent) => {
        // ====================================================
        // FETCH ASSIGNED LEADS
        // ====================================================
        //
        // organizationId is included deliberately even though
        // assignedTo normally identifies the agent.
        //
        // This provides an additional multi-tenant safety
        // boundary.
        //
        // ====================================================

        const assignedLeads = await Lead.find({
          organizationId,
          assignedTo: agent._id,
        })
          .select(
            "_id status score assignedAt assignedSource"
          )
          .lean();

        // ====================================================
        // BASIC COUNTS
        // ====================================================

        const assignedCount =
          assignedLeads.length;

        const closedLeads =
          assignedLeads.filter(
            (lead) =>
              lead.status === CLOSED_STATUS
          );

        const activeLeads =
          assignedLeads.filter(
            (lead) =>
              ACTIVE_STATUSES.includes(
                lead.status
              )
          );

        const closedCount =
          closedLeads.length;

        const activeCount =
          activeLeads.length;

        // ====================================================
        // STATUS BREAKDOWN
        // ====================================================
        //
        // Useful for the dashboard and future analytics.
        //
        // ====================================================

        const newCount =
          assignedLeads.filter(
            (lead) =>
              lead.status === "new"
          ).length;

        const qualifiedCount =
          assignedLeads.filter(
            (lead) =>
              lead.status === "qualified"
          ).length;

        const hotCount =
          assignedLeads.filter(
            (lead) =>
              lead.status === "hot"
          ).length;

        const followUpCount =
          assignedLeads.filter(
            (lead) =>
              lead.status === "follow_up"
          ).length;

        const viewingScheduledCount =
          assignedLeads.filter(
            (lead) =>
              lead.status ===
              "viewing_scheduled"
          ).length;

        // ====================================================
        // LEAD SCORE ANALYTICS
        // ====================================================

        const totalScore =
          assignedLeads.reduce(
            (sum, lead) =>
              sum +
              safeNumber(lead.score),
            0
          );

        const averageScore =
          assignedCount === 0
            ? 0
            : Number(
                (
                  totalScore /
                  assignedCount
                ).toFixed(1)
              );

        // ====================================================
        // HOT LEAD RATE
        // ====================================================

        const hotLeadRate =
          assignedCount === 0
            ? 0
            : Number(
                (
                  (hotCount /
                    assignedCount) *
                  100
                ).toFixed(1)
              );

        // ====================================================
        // CONVERSION RATE
        // ====================================================
        //
        // Conversion is calculated as:
        //
        // closed leads / total assigned leads
        //
        // ====================================================

        const conversionRate =
          assignedCount === 0
            ? 0
            : Number(
                (
                  (closedCount /
                    assignedCount) *
                  100
                ).toFixed(1)
              );

        // ====================================================
        // ACTIVE WORKLOAD RATE
        // ====================================================
        //
        // Shows what percentage of assigned leads are still
        // active in the pipeline.
        //
        // ====================================================

        const activeRate =
          assignedCount === 0
            ? 0
            : Number(
                (
                  (activeCount /
                    assignedCount) *
                  100
                ).toFixed(1)
              );

        // ====================================================
        // RETURN AGENT METRICS
        // ====================================================

        return {
          agentId: agent._id,

          name:
            agent.name || "Unknown Agent",

          email:
            agent.email || null,

          // -----------------------------------------------
          // Assignment metrics
          // -----------------------------------------------

          assignedLeads:
            assignedCount,

          activeLeads:
            activeCount,

          closedLeads:
            closedCount,

          // -----------------------------------------------
          // Pipeline metrics
          // -----------------------------------------------

          newLeads:
            newCount,

          qualifiedLeads:
            qualifiedCount,

          hotLeads:
            hotCount,

          followUpLeads:
            followUpCount,

          viewingScheduledLeads:
            viewingScheduledCount,

          // -----------------------------------------------
          // Performance metrics
          // -----------------------------------------------

          averageScore,

          hotLeadRate,

          conversionRate,

          activeRate,

          // -----------------------------------------------
          // Current agent workload counter
          // -----------------------------------------------
          //
          // This comes from the User document and is the
          // same counter maintained by the latest
          // leadAutoAssignmentService.js.
          //
          // -----------------------------------------------

          assignedLeadCount:
            safeNumber(
              agent.assignedLeadCount
            ),

          closedLeadCount:
            safeNumber(
              agent.closedLeadCount
            ),
        };
      })
    );

    // ========================================================
    // SORT LEADERBOARD
    // ========================================================
    //
    // Primary:
    //   Highest conversion rate
    //
    // Secondary:
    //   Highest average lead score
    //
    // Tertiary:
    //   Highest number of closed leads
    //
    // Final:
    //   Highest assigned leads
    //
    // ========================================================

    leaderboard.sort(
      (a, b) => {
        if (
          b.conversionRate !==
          a.conversionRate
        ) {
          return (
            b.conversionRate -
            a.conversionRate
          );
        }

        if (
          b.averageScore !==
          a.averageScore
        ) {
          return (
            b.averageScore -
            a.averageScore
          );
        }

        if (
          b.closedLeads !==
          a.closedLeads
        ) {
          return (
            b.closedLeads -
            a.closedLeads
          );
        }

        return (
          b.assignedLeads -
          a.assignedLeads
        );
      }
    );

    // ========================================================
    // ADD RANKING
    // ========================================================

    const rankedLeaderboard =
      leaderboard.map(
        (agent, index) => ({
          rank: index + 1,
          ...agent,
        })
      );

    // ========================================================
    // LOGGING
    // ========================================================

    console.log(
      "📊 Agent leaderboard generated:"
    );

    console.dir(
      rankedLeaderboard,
      {
        depth: null,
      }
    );

    // ========================================================
    // RETURN
    // ========================================================

    return rankedLeaderboard;

  } catch (error) {
    // ========================================================
    // ERROR HANDLING
    // ========================================================

    console.error(
      "❌ Agent leaderboard error:",
      error
    );

    return [];
  }
};

// ============================================================
// OPTIONAL SINGLE-AGENT PERFORMANCE HELPER
// ============================================================
//
// Useful if the agent dashboard later needs to request the
// same metrics for one agent.
//
// ============================================================

export const getSingleAgentLeaderboardEntry =
  async (
    organizationId,
    agentId
  ) => {
    try {
      if (
        !organizationId ||
        !agentId
      ) {
        return null;
      }

      const leaderboard =
        await getAgentLeaderboard(
          organizationId
        );

      return (
        leaderboard.find(
          (agent) =>
            String(agent.agentId) ===
            String(agentId)
        ) || null
      );

    } catch (error) {
      console.error(
        "❌ Single agent leaderboard error:",
        error
      );

      return null;
    }
  };