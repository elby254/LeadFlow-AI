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
 * assignmentConflictResolver.js DECIDES + MUTATES.
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
 * ┌────────────────────────────────────┐
 * │ accepted = false                   │
 * │ → stop                             │
 * │ → no workload                      │
 * │ → no realtime event                │
 * │                                    │
 * │ accepted = true                    │
 * │ → workload increment               │
 * │ → realtime event                   │
 * └────────────────────────────────────┘
 *
 * ==========================================================
 */

import mongoose from "mongoose";

import User from "../models/user.js";

import {
  emitLeadAssigned,
} from "./realtimeEngine.js";

import {
  resolveAssignmentConflict,
} from "./assignmentConflictResolver.js";


// ==========================================================
// ROUND-ROBIN MEMORY
// ==========================================================
//
// organizationId → next agent index
//
// ==========================================================

const orgRoundRobinIndex =
  new Map();


// ==========================================================
// GET ACTIVE AGENTS
// ==========================================================
//
// IMPORTANT:
// Organization isolation happens here AND again inside
// the conflict resolver.
//
// Defense in depth.
//
// ==========================================================

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


// ==========================================================
// ROUND-ROBIN ASSIGNMENT
// ==========================================================

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


// ==========================================================
// LEAST BUSY AGENT
// ==========================================================

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
    ...agents
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


      // Stable tie-breaker.

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


// ==========================================================
// BEST PERFORMING AGENT
// ==========================================================
//
// Primary:
// closedLeadCount DESC
//
// Secondary:
// assignedLeadCount ASC
//
// Tertiary:
// _id ASC
//
// ==========================================================

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
    ...agents
  ].sort(
    (
      a,
      b
    ) => {

      const closedA =
        Number(
          a?.closedLeadCount ||
          0
        );


      const closedB =
        Number(
          b?.closedLeadCount ||
          0
        );


      if (
        closedA !==
        closedB
      ) {

        return (
          closedB -
          closedA
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


// ==========================================================
// SCORE-BASED ASSIGNMENT
// ==========================================================
//
// 80+
// → best performing agent
//
// 50–79
// → least busy agent
//
// <50
// → null → round-robin fallback
//
// ==========================================================

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


  const numericScore =
    Number(
      leadScore
    );


  const score =
    Number.isFinite(
      numericScore
    )
      ? numericScore
      : 0;


  if (
    score >= 80
  ) {

    return bestPerformingAgent(
      agents
    );
  }


  if (
    score >= 50
  ) {

    return leastBusyAgent(
      agents
    );
  }


  return null;
};


// ==========================================================
// CHECK EXISTING ASSIGNMENT
// ==========================================================

const hasExistingAssignment = (
  lead
) => {

  return Boolean(
    lead?.assignedTo
  );
};


// ==========================================================
// VALIDATE ORGANIZATION ID
// ==========================================================

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


// ==========================================================
// NORMALIZE ASSIGNMENT ID
// ==========================================================

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


// ==========================================================
// MAIN AUTO ASSIGNMENT FUNCTION
// ==========================================================

export const autoAssignLead =
  async (
    lead
  ) => {

    try {

      // ====================================================
      // 1. VALIDATE LEAD
      // ====================================================

      if (
        !lead
      ) {

        console.log(
          "⚠️ Auto assignment skipped: lead is missing."
        );

        return null;
      }


      // ====================================================
      // 2. VALIDATE LEAD ID
      // ====================================================

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


      // ====================================================
      // 3. VALIDATE ORGANIZATION
      // ====================================================

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


      // ====================================================
      // 4. EXISTING ASSIGNMENT PROTECTION
      // ====================================================
      //
      // Automatic assignment should never compete with an
      // already assigned lead.
      //
      // Manual and AI assignment therefore remain protected.
      //
      // ====================================================

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
        };
      }


      // ====================================================
      // 5. GET ACTIVE AGENTS
      // ====================================================

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
        };
      }


      console.log(
        `👥 ${agents.length} active agent(s) available for lead ${leadId}.`
      );


      // ====================================================
      // 6. DETERMINE LEAD SCORE
      // ====================================================

      const rawScore =
        Number(
          lead.score
        );


      const leadScore =
        Number.isFinite(
          rawScore
        )
          ? rawScore
          : 0;


      // ====================================================
      // 7. SELECT CANDIDATE AGENT
      // ====================================================

      let candidateAgent =
        null;


      // ----------------------------------------------------
      // SCORE-BASED ROUTING
      // ----------------------------------------------------

      if (
        leadScore >= 50
      ) {

        candidateAgent =
          scoreBasedAssign(
            agents,
            leadScore
          );
      }


      // ----------------------------------------------------
      // ROUND-ROBIN FALLBACK
      // ----------------------------------------------------

      if (
        !candidateAgent
      ) {

        candidateAgent =
          roundRobinAssign(
            organizationId,
            agents
          );
      }


      // ====================================================
      // 8. VALIDATE CANDIDATE
      // ====================================================

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
        };
      }


      // ====================================================
      // 9. DEFENSE-IN-DEPTH ORGANIZATION CHECK
      // ====================================================

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
        };
      }


      // ====================================================
      // 10. BUILD PROPOSED ASSIGNMENT
      // ====================================================

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


      // ====================================================
      // 11. CONFLICT RESOLUTION
      // ====================================================
      //
      // IMPORTANT:
      //
      // The resolver is now the ONLY assignment mutation
      // authority.
      //
      // This service does NOT mutate the lead before or
      // after this call.
      //
      // ====================================================

      const resolution =
        await resolveAssignmentConflict(
          leadId,
          proposedAssignment
        );


      // ====================================================
      // 12. RESOLUTION REJECTED
      // ====================================================
      //
      // CRITICAL:
      //
      // A rejected assignment MUST stop here.
      //
      // DO NOT:
      //
      // ✗ modify lead
      // ✗ save lead
      // ✗ increment workload
      // ✗ emit realtime event
      //
      // ====================================================

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


        return resolution ||
          {
            accepted:
              false,

            reason:
              "assignment_not_accepted",

            lead,

            assignedAgent:
              null,
          };
      }


      // ====================================================
      // 13. RESOLUTION MUST CONTAIN AGENT
      // ====================================================

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

          lead,

          assignedAgent:
            null,
        };
      }


      // ====================================================
      // 14. VERIFY FINAL ASSIGNMENT
      // ====================================================

      const finalAssignedTo =
        getAssignmentId(
          resolution.lead?.assignedTo
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
            resolution.lead ||
            lead,

          assignedAgent:
            null,
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
            resolution.lead ||
            lead,

          assignedAgent:
            null,
        };
      }


      // ====================================================
      // 15. IMPORTANT
      // ====================================================
      //
      // DO NOT SAVE THE LEAD HERE.
      //
      // The resolver already performed the authoritative
      // assignment mutation and save.
      //
      // ====================================================

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
            resolution.assignedSource,
        }
      );


      // ====================================================
      // 16. UPDATE AGENT WORKLOAD
      // ====================================================
      //
      // This happens ONLY after:
      //
      // ✓ resolver accepted assignment
      // ✓ assignment was persisted
      // ✓ assignment was verified
      //
      // ====================================================

      const updatedAgent =
        await User.findOneAndUpdate(

          {
            _id:
              assignedAgent._id,

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

          { returnDocument: 'after' }
        );


      if (
        !updatedAgent
      ) {

        console.error(
          "⚠️ Agent workload could not be updated after successful assignment.",
          {
            agentId:
              assignedAgent._id,

            leadId,
          }
        );

      } else {

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
      }


      // ====================================================
      // 17. REALTIME ASSIGNMENT EVENT
      // ====================================================
      //
      // Realtime failure MUST NOT undo the persisted
      // assignment.
      //
      // ====================================================

      try {

        emitLeadAssigned(
          resolution.lead,
          updatedAgent ||
          assignedAgent
        );

      } catch (
        realtimeError
      ) {

        console.error(
          "⚠️ Lead assignment realtime event failed:",
          realtimeError?.message
        );
      }


      // ====================================================
      // 18. FINAL LOGGING
      // ====================================================

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


      // ====================================================
      // 19. RETURN FINAL RESULT
      // ====================================================

      return {

        accepted:
          true,

        reason:
          resolution.reason ||
          "assignment_created",

        lead:
          resolution.lead,

        assignedAgent:
          updatedAgent ||
          assignedAgent,

        previousAgentId:
          resolution.previousAgentId ||
          null,

        previousSource:
          resolution.previousSource ||
          null,

        assignedSource:
          resolution.assignedSource,

      };


    } catch (
      error
    ) {

      // ====================================================
      // ERROR HANDLING
      // ====================================================

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


// ==========================================================
// EXPORT HELPERS
// ==========================================================

export {
  getAgents,

  roundRobinAssign,

  leastBusyAgent,

  bestPerformingAgent,

  scoreBasedAssign,
};