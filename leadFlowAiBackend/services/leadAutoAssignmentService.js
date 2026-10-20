/**
 * ==========================================================
 *
 * LEAD AUTO ASSIGNMENT ENGINE
 *
 * ==========================================================
 *
 * PURPOSE
 * ----------------------------------------------------------
 * Automatically selects a candidate agent for incoming leads.
 *
 * ==========================================================
 *
 * IMPORTANT ARCHITECTURE
 * ----------------------------------------------------------
 *
 * This service SELECTS.
 *
 * assignmentConflictResolver.js DECIDES + MUTATES + PERSISTS
 * the canonical assignment event atomically.
 *
 * Therefore this file MUST NOT directly mutate:
 *
 *   lead.assignedTo
 *   lead.assignedBy
 *   lead.assignedAt
 *   lead.assignedSource
 *
 * The resolver is the final authority.
 *
 * ==========================================================
 *
 * FLOW
 * ----------------------------------------------------------
 *
 * Lead
 *   ↓
 * Validate
 *   ↓
 * Existing assignment check
 *   ↓
 * Organization validation
 *   ↓
 * Active agents
 *   ↓
 * Score-based candidate selection
 *   ↓
 * Round-robin fallback
 *   ↓
 * Conflict resolver
 *   ↓
 * ┌─────────────────────────────────────────────┐
 * │ accepted = false                            │
 * │ → stop                                      │
 * │ → no workload                               │
 * │ → no assignment event                      │
 * │                                             │
 * │ accepted = true                             │
 * │ → assignment already persisted atomically   │
 * │ → assignment event already persisted        │
 * │ → workload increment                        │
 * └─────────────────────────────────────────────┘
 *
 * ==========================================================
 */

import mongoose from "mongoose";

import User from "../models/user.js";

import {
  HOT_SCORE_THRESHOLD,
  QUALIFIED_SCORE_MIN,
  MAX_LEAD_SCORE,
} from "./leadScoringRulesEngine.js";

import {
  resolveAssignmentConflict,
} from "./assignmentConflictResolver.js";

/* ==========================================================
   ROUND-ROBIN MEMORY
========================================================== */

/**
 * organizationId → next agent index
 */
const orgRoundRobinIndex = new Map();

/* ==========================================================
   GET ACTIVE AGENTS
========================================================== */

const getAgents = async (
  organizationId
) => {
  if (
    !organizationId
  ) {
    return [];
  }

  return User.find({
    organizationId,

    role:
      "agent",

    isActive:
      true,
  }).sort({
    createdAt:
      1,
  });
};

/* ==========================================================
   ROUND-ROBIN ASSIGNMENT
========================================================== */

const roundRobinAssign = (
  organizationId,
  agents
) => {
  if (
    !organizationId ||
    !Array.isArray(
      agents
    ) ||
    !agents.length
  ) {
    return null;
  }

  const organizationKey =
    String(
      organizationId
    );

  const currentIndex =
    orgRoundRobinIndex.get(
      organizationKey
    ) ?? 0;

  const selectedAgent =
    agents[
      currentIndex %
      agents.length
    ];

  const nextIndex =
    (
      currentIndex +
      1
    ) %
    agents.length;

  orgRoundRobinIndex.set(
    organizationKey,
    nextIndex
  );

  return selectedAgent;
};

/* ==========================================================
   LEAST BUSY AGENT
========================================================== */

const leastBusyAgent = (
  agents
) => {
  if (
    !Array.isArray(
      agents
    ) ||
    !agents.length
  ) {
    return null;
  }

  return [
    ...agents,
  ].sort(
    (
      a,
      b
    ) => {
      const workloadA =
        Number(
          a?.assignedLeadCount ||
          0
        );

      const workloadB =
        Number(
          b?.assignedLeadCount ||
          0
        );

      if (
        workloadA !==
        workloadB
      ) {
        return (
          workloadA -
          workloadB
        );
      }

      return String(
        a?._id ||
        ""
      ).localeCompare(
        String(
          b?._id ||
          ""
        )
      );
    }
  )[0];
};

/* ==========================================================
   BEST PERFORMING AGENT
========================================================== */

const bestPerformingAgent = (
  agents
) => {
  if (
    !Array.isArray(
      agents
    ) ||
    !agents.length
  ) {
    return null;
  }

  return [
    ...agents,
  ].sort(
    (
      a,
      b
    ) => {
      const wonA =
        Number(
          a?.wonLeadCount ??
          a?.closedLeadCount ??
          0
        );

      const wonB =
        Number(
          b?.wonLeadCount ??
          b?.closedLeadCount ??
          0
        );

      if (
        wonA !==
        wonB
      ) {
        return (
          wonB -
          wonA
        );
      }

      const workloadA =
        Number(
          a?.assignedLeadCount ||
          0
        );

      const workloadB =
        Number(
          b?.assignedLeadCount ||
          0
        );

      if (
        workloadA !==
        workloadB
      ) {
        return (
          workloadA -
          workloadB
        );
      }

      return String(
        a?._id ||
        ""
      ).localeCompare(
        String(
          b?._id ||
          ""
        )
      );
    }
  )[0];
};

/* ==========================================================
   NORMALIZE ROUTING SCORE
========================================================== */

const normalizeRoutingScore = (
  value
) => {
  const numericScore =
    Number(
      value
    );

  if (
    !Number.isFinite(
      numericScore
    )
  ) {
    return 0;
  }

  return Math.min(
    MAX_LEAD_SCORE,
    Math.max(
      0,
      numericScore
    )
  );
};

/* ==========================================================
   SCORE-BASED ASSIGNMENT
========================================================== */

const scoreBasedAssign = (
  agents,
  leadScore
) => {
  if (
    !Array.isArray(
      agents
    ) ||
    !agents.length
  ) {
    return null;
  }

  const score =
    normalizeRoutingScore(
      leadScore
    );

  if (
    score >=
    HOT_SCORE_THRESHOLD
  ) {
    return bestPerformingAgent(
      agents
    );
  }

  if (
    score >=
    QUALIFIED_SCORE_MIN
  ) {
    return leastBusyAgent(
      agents
    );
  }

  return null;
};

/* ==========================================================
   CHECK EXISTING ASSIGNMENT
========================================================== */

const hasExistingAssignment = (
  lead
) => {
  return Boolean(
    lead?.assignedTo
  );
};

/* ==========================================================
   VALIDATE ORGANIZATION ID
========================================================== */

const isValidOrganizationId = (
  organizationId
) => {
  return Boolean(
    organizationId &&
      mongoose.Types.ObjectId.isValid(
        organizationId
      )
  );
};

/* ==========================================================
   NORMALIZE ASSIGNMENT ID
========================================================== */

const getAssignmentId = (
  assignment
) => {
  if (
    !assignment
  ) {
    return null;
  }

  if (
    typeof assignment ===
      "object" &&
    assignment._id
  ) {
    return String(
      assignment._id
    );
  }

  return String(
    assignment
  );
};

/* ==========================================================
   UPDATE AGENT WORKLOAD
========================================================== */

const updateAgentWorkload = async (
  previousAgentId,
  newAgentId,
  organizationId
) => {
  if (
    !newAgentId
  ) {
    return null;
  }

  if (
    previousAgentId &&
    String(
      previousAgentId
    ) ===
      String(
        newAgentId
      )
  ) {
    return null;
  }

  if (
    previousAgentId
  ) {
    await User.findOneAndUpdate(
      {
        _id:
          previousAgentId,

        organizationId,

        role:
          "agent",

        assignedLeadCount: {
          $gt:
            0,
        },
      },

      {
        $inc: {
          assignedLeadCount:
            -1,
        },
      },

      { returnDocument: "after" }
    );
  }

  const updatedAgent =
    await User.findOneAndUpdate(
      {
        _id:
          newAgentId,

        organizationId,

        role:
          "agent",

        isActive:
          true,
      },

      {
        $inc: {
          assignedLeadCount:
            1,
        },
      },

      { returnDocument: "after" }
    );

  return updatedAgent;
};

/* ==========================================================
   MAIN AUTO ASSIGNMENT FUNCTION
========================================================== */

export const autoAssignLead =
  async (
    lead
  ) => {
    try {
      /* ====================================================
         1. VALIDATE LEAD
      ==================================================== */

      if (
        !lead
      ) {
        console.log(
          "⚠️ Auto assignment skipped: lead is missing."
        );

        return null;
      }

      /* ====================================================
         2. VALIDATE LEAD ID
      ==================================================== */

      const leadId =
        lead._id;

      if (
        !leadId
      ) {
        console.log(
          "⚠️ Auto assignment skipped: lead ID is missing."
        );

        return null;
      }

      /* ====================================================
         3. VALIDATE ORGANIZATION
      ==================================================== */

      const organizationId =
        lead.organizationId;

      if (
        !isValidOrganizationId(
          organizationId
        )
      ) {
        console.log(
          "⚠️ Auto assignment skipped: invalid organization ID."
        );

        return null;
      }

      /* ====================================================
         4. EXISTING ASSIGNMENT PROTECTION
      ==================================================== */

      if (
        hasExistingAssignment(
          lead
        )
      ) {
        console.log(
          `ℹ️ Lead ${leadId} is already assigned. Auto assignment skipped.`
        );

        return {
          accepted:
            false,

          reason:
            "lead_already_assigned",

          lead,

          assignedAgent:
            null,

          assignmentEventQueued:
            false,
        };
      }

      /* ====================================================
         5. GET ACTIVE AGENTS
      ==================================================== */

      const agents =
        await getAgents(
          organizationId
        );

      if (
        !agents.length
      ) {
        console.log(
          `⚠️ No active agents found for organization ${organizationId}.`
        );

        return {
          accepted:
            false,

          reason:
            "no_active_agents",

          lead,

          assignedAgent:
            null,

          assignmentEventQueued:
            false,
        };
      }

      console.log(
        `👥 ${agents.length} active agent(s) available for lead ${leadId}.`
      );

      /* ====================================================
         6. NORMALIZE LEAD SCORE
      ==================================================== */

      const leadScore =
        normalizeRoutingScore(
          lead.score
        );

      console.log(
        "🎯 Lead routing score:",
        leadScore
      );

      /* ====================================================
         7. SELECT CANDIDATE AGENT
      ==================================================== */

      let candidateAgent =
        null;

      if (
        leadScore >=
        QUALIFIED_SCORE_MIN
      ) {
        candidateAgent =
          scoreBasedAssign(
            agents,
            leadScore
          );
      }

      if (
        !candidateAgent
      ) {
        candidateAgent =
          roundRobinAssign(
            organizationId,
            agents
          );
      }

      /* ====================================================
         8. VALIDATE CANDIDATE
      ==================================================== */

      if (
        !candidateAgent
      ) {
        console.log(
          `⚠️ No agent could be selected for lead ${leadId}.`
        );

        return {
          accepted:
            false,

          reason:
            "candidate_agent_not_found",

          lead,

          assignedAgent:
            null,

          assignmentEventQueued:
            false,
        };
      }

      /* ====================================================
         9. DEFENSE-IN-DEPTH ORGANIZATION CHECK
      ==================================================== */

      if (
        String(
          candidateAgent.organizationId
        ) !==
        String(
          organizationId
        )
      ) {
        console.error(
          "❌ SECURITY: Candidate agent belongs to another organization."
        );

        return {
          accepted:
            false,

          reason:
            "candidate_cross_organization",

          lead,

          assignedAgent:
            null,

          assignmentEventQueued:
            false,
        };
      }

      /* ====================================================
         10. BUILD PROPOSED ASSIGNMENT
      ==================================================== */

      const assignedAt =
        new Date();

      const proposedAssignment = {
        assignedTo:
          candidateAgent._id,

        assignedBy:
          null,

        assignedSource:
          "ai",

        assignedAt,
      };

      console.log(
        "🎯 PROPOSED ASSIGNMENT:",
        {
          leadId:
            String(
              leadId
            ),

          candidateAgent:
            String(
              candidateAgent._id
            ),

          organizationId:
            String(
              organizationId
            ),

          score:
            leadScore,

          source:
            "ai",
        }
      );

      /* ====================================================
         11. CONFLICT RESOLUTION
      ==================================================== */

      /**
       * assignmentConflictResolver.js owns:
       *
       * ✓ authoritative assignment mutation
       * ✓ concurrency guard
       * ✓ LEAD_ASSIGNED Outbox event
       * ✓ atomic assignment + event transaction
       */
      const resolution =
        await resolveAssignmentConflict(
          leadId,

          proposedAssignment,

          organizationId
        );

      /* ====================================================
         12. RESOLUTION REJECTED
      ==================================================== */

      if (
        !resolution?.accepted
      ) {
        console.log(
          "🛑 AUTO ASSIGNMENT NOT ACCEPTED:",
          {
            leadId:
              String(
                leadId
              ),

            reason:
              resolution?.reason ||
              "unknown",
          }
        );

        return (
          resolution || {
            accepted:
              false,

            reason:
              "assignment_not_accepted",

            lead,

            assignedAgent:
              null,

            assignmentEventQueued:
              false,
          }
        );
      }

      /* ====================================================
         13. RESOLUTION MUST CONTAIN AGENT
      ==================================================== */

      const assignedAgent =
        resolution.assignedAgent;

      if (
        !assignedAgent
      ) {
        console.error(
          "❌ Resolver accepted assignment but returned no assigned agent."
        );

        return {
          accepted:
            false,

          reason:
            "resolver_missing_agent",

          lead:
            resolution.lead ||
            lead,

          assignedAgent:
            null,

          assignmentEventQueued:
            resolution.assignmentEventQueued ===
            true,
        };
      }

      /* ====================================================
         14. VERIFY FINAL ASSIGNMENT
      ==================================================== */

      const resolvedLead =
        resolution.lead ||
        lead;

      const finalAssignedTo =
        getAssignmentId(
          resolvedLead.assignedTo
        );

      const resolvedAgentId =
        getAssignmentId(
          assignedAgent
        );

      if (
        !finalAssignedTo
      ) {
        console.error(
          "❌ Assignment verification failed: lead has no assignedTo after resolver."
        );

        return {
          accepted:
            false,

          reason:
            "assignment_verification_failed",

          lead:
            resolvedLead,

          assignedAgent:
            null,

          assignmentEventQueued:
            resolution.assignmentEventQueued ===
            true,
        };
      }

      if (
        finalAssignedTo !==
        resolvedAgentId
      ) {
        console.error(
          "❌ Assignment verification failed: resolver result and lead assignment disagree.",
          {
            leadAssignedTo:
              finalAssignedTo,

            resolverAgent:
              resolvedAgentId,
          }
        );

        return {
          accepted:
            false,

          reason:
            "assignment_agent_mismatch",

          lead:
            resolvedLead,

          assignedAgent:
            null,

          assignmentEventQueued:
            resolution.assignmentEventQueued ===
            true,
        };
      }

      /* ====================================================
         15. GET PREVIOUS AGENT
      ==================================================== */

      const previousAgentId =
        resolution.previousAgentId ||
        null;

      /* ====================================================
         16. IMPORTANT
      ==================================================== */

      /**
       * DO NOT SAVE THE LEAD HERE.
       *
       * The resolver already performed the authoritative
       * assignment mutation and atomically persisted the
       * canonical assignment Outbox event.
       */
      console.log(
        "✅ Resolver confirmed final assignment:",
        {
          leadId:
            String(
              leadId
            ),

          assignedAgent:
            String(
              assignedAgent._id
            ),

          source:
            resolution.assignedSource ||
            "ai",

          assignmentEventQueued:
            resolution.assignmentEventQueued ===
            true,
        }
      );

      /* ====================================================
         17. UPDATE AGENT WORKLOAD
      ==================================================== */

      let updatedAgent =
        null;

      try {
        updatedAgent =
          await updateAgentWorkload(
            previousAgentId,

            assignedAgent._id,

            organizationId
          );

        if (
          updatedAgent
        ) {
          console.log(
            "📈 Agent workload incremented:",
            {
              agent:
                updatedAgent.name,

              agentId:
                updatedAgent._id,

              assignedLeadCount:
                updatedAgent.assignedLeadCount,
            }
          );
        } else {
          console.warn(
            "⚠️ Agent workload was not updated.",
            {
              agentId:
                assignedAgent._id,

              leadId,
            }
          );
        }
      } catch (
        workloadError
      ) {
        console.error(
          "⚠️ Agent workload update failed after successful assignment:",
          workloadError
        );
      }

      /* ====================================================
         18. CANONICAL ASSIGNMENT EVENT RESULT
      ==================================================== */

      /**
       * The resolver already persisted the event atomically.
       *
       * No second Outbox transaction occurs here.
       */
      const assignmentEventQueued =
        resolution.assignmentEventQueued ===
        true;

      console.log(
        "📦 Canonical lead.assigned event persisted atomically:",
        assignmentEventQueued
      );

      /* ====================================================
         19. FINAL LOGGING
      ==================================================== */

      console.log(
        `📦 Auto-assigned lead ${leadId} → ${
          updatedAgent?.name ||
          assignedAgent?.name ||
          assignedAgent?.email ||
          assignedAgent?._id
        }`
      );

      console.log(
        "📌 Assignment source:",
        resolution.assignedSource
      );

      console.log(
        "📌 Lead score:",
        leadScore
      );

      console.log(
        "📌 Organization:",
        organizationId
      );

      console.log(
        "📌 Final agent:",
        assignedAgent._id
      );

      console.log(
        "📌 Assignment event queued:",
        assignmentEventQueued
      );

      /* ====================================================
         20. RETURN FINAL RESULT
      ==================================================== */

      return {
        accepted:
          true,

        reason:
          resolution.reason ||
          "assignment_created",

        lead:
          resolvedLead,

        assignedAgent:
          updatedAgent ||
          assignedAgent,

        previousAgentId:
          previousAgentId,

        previousSource:
          resolution.previousSource ||
          null,

        assignedSource:
          resolution.assignedSource,

        assignmentEventQueued,
      };
    } catch (
      error
    ) {
      console.error(
        "❌ AUTO ASSIGNMENT ERROR:"
      );

      console.error(
        error
      );

      console.error(
        error?.stack
      );

      return null;
    }
  };

/* ==========================================================
   EXPORT HELPERS
========================================================== */

export {
  getAgents,

  roundRobinAssign,

  leastBusyAgent,

  bestPerformingAgent,

  scoreBasedAssign,
};