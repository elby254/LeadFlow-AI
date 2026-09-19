/**
 * ============================================================
 *
 * ASSIGNMENT CONFLICT RESOLVER
 *
 * ============================================================
 *
 * PURPOSE
 * ------------------------------------------------------------
 * Final authority for ALL lead assignment mutations.
 *
 * Prevent:
 *
 * ✓ AI assignment overriding manual admin assignment
 * ✓ Automatic assignment overriding manual assignment
 * ✓ Multiple agents being assigned accidentally
 * ✓ Invalid/inactive agents receiving leads
 * ✓ Cross-organization assignments
 * ✓ Duplicate assignment mutations
 * ✓ Workload updates caused by rejected assignments
 *
 * Assignment priority
 * ------------------------------------------------------------
 *
 * manual > ai > auto
 *
 * ============================================================
 *
 * IMPORTANT ARCHITECTURE
 * ------------------------------------------------------------
 *
 * This file is the ONLY place responsible for mutating:
 *
 *   lead.assignedTo
 *   lead.assignedBy
 *   lead.assignedAt
 *   lead.assignedSource
 *
 * Other services may:
 *
 * ✓ select candidate agents
 * ✓ request an assignment
 * ✓ inspect the final result
 *
 * They MUST NOT directly mutate assignment fields before or
 * after this resolver.
 *
 * ============================================================
 */

import mongoose from "mongoose";

import Lead from "../models/lead.js";
import User from "../models/user.js";


// ============================================================
// ASSIGNMENT PRIORITY
// ============================================================

const PRIORITY = {
  auto: 1,
  ai: 2,
  manual: 3,
};


// ============================================================
// VALID ASSIGNMENT SOURCES
// ============================================================

const VALID_SOURCES = [
  "auto",
  "ai",
  "manual",
];


// ============================================================
// VALIDATE OBJECT ID
// ============================================================

const isValidObjectId = (
  value
) => {
  return Boolean(
    value &&
    mongoose.Types.ObjectId.isValid(
      value
    )
  );
};


// ============================================================
// NORMALIZE ASSIGNMENT ID
// ============================================================

const getAssignmentId = (
  value
) => {

  if (!value) {
    return null;
  }

  if (
    typeof value === "object" &&
    value._id
  ) {
    return String(
      value._id
    );
  }

  return String(
    value
  );
};


// ============================================================
// RESOLVE ASSIGNMENT CONFLICT
// ============================================================
//
// Return format:
//
// SUCCESS:
//
// {
//   accepted: true,
//   lead,
//   assignedAgent,
//   previousAgentId,
//   previousSource,
//   assignedSource
// }
//
// REJECTED:
//
// {
//   accepted: false,
//   reason,
//   lead,
//   assignedAgent: null
// }
//
// INVALID / NOT FOUND:
//
// {
//   accepted: false,
//   reason,
//   lead: null,
//   assignedAgent: null
// }
//
// ============================================================

export const resolveAssignmentConflict =
  async (
    leadId,
    newAssignment
  ) => {

    try {

      console.log(
        "=================================================="
      );

      console.log(
        "🔐 ASSIGNMENT CONFLICT CHECK"
      );

      console.log(
        "=================================================="
      );

      console.log(
        "📌 Lead ID:",
        leadId
      );

      console.log(
        "📌 Requested assignment:",
        newAssignment
      );


      // ======================================================
      // 1. VALIDATE LEAD ID
      // ======================================================

      if (
        !isValidObjectId(
          leadId
        )
      ) {

        console.log(
          "⚠️ Assignment rejected: invalid leadId."
        );

        return {
          accepted: false,
          reason: "invalid_lead_id",
          lead: null,
          assignedAgent: null,
        };
      }


      // ======================================================
      // 2. VALIDATE ASSIGNMENT
      // ======================================================

      if (
        !newAssignment?.assignedTo
      ) {

        console.log(
          "⚠️ Assignment rejected: assignedTo missing."
        );

        return {
          accepted: false,
          reason: "assigned_to_missing",
          lead: null,
          assignedAgent: null,
        };
      }


      if (
        !isValidObjectId(
          newAssignment.assignedTo
        )
      ) {

        console.log(
          "⚠️ Assignment rejected: invalid assignedTo."
        );

        return {
          accepted: false,
          reason: "invalid_assigned_to",
          lead: null,
          assignedAgent: null,
        };
      }


      // ======================================================
      // 3. VALIDATE SOURCE
      // ======================================================

      const newSource =
        newAssignment.assignedSource ||
        "auto";


      if (
        !VALID_SOURCES.includes(
          newSource
        )
      ) {

        console.log(
          `⚠️ Assignment rejected: invalid source "${newSource}".`
        );

        return {
          accepted: false,
          reason: "invalid_assignment_source",
          lead: null,
          assignedAgent: null,
        };
      }


      const newPriority =
        PRIORITY[
          newSource
        ];


      // ======================================================
      // 4. FIND LEAD
      // ======================================================

      const lead =
        await Lead.findById(
          leadId
        );


      if (!lead) {

        console.log(
          "⚠️ Lead not found for conflict resolution."
        );

        return {
          accepted: false,
          reason: "lead_not_found",
          lead: null,
          assignedAgent: null,
        };
      }


      // ======================================================
      // 5. ORGANIZATION VALIDATION
      // ======================================================

      if (
        !lead.organizationId
      ) {

        console.log(
          "🛑 Assignment rejected: lead has no organization."
        );

        return {
          accepted: false,
          reason: "lead_has_no_organization",
          lead,
          assignedAgent: null,
        };
      }


      // ======================================================
      // 6. FIND TARGET AGENT
      // ======================================================

      const targetAgent =
        await User.findOne({
          _id:
            newAssignment.assignedTo,

          role:
            "agent",

          isActive:
            true,
        });


      if (!targetAgent) {

        console.log(
          "🛑 Assignment rejected: target is not an active agent."
        );

        return {
          accepted: false,
          reason: "target_agent_invalid",
          lead,
          assignedAgent: null,
        };
      }


      // ======================================================
      // 7. TARGET AGENT ORGANIZATION
      // ======================================================

      if (
        !targetAgent.organizationId
      ) {

        console.log(
          "🛑 Assignment rejected: target agent has no organization."
        );

        return {
          accepted: false,
          reason: "target_agent_has_no_organization",
          lead,
          assignedAgent: null,
        };
      }


      // ======================================================
      // 8. CROSS-ORGANIZATION SECURITY
      // ======================================================

      if (
        String(
          lead.organizationId
        ) !==
        String(
          targetAgent.organizationId
        )
      ) {

        console.error(
          "🛑 CROSS-ORGANIZATION ASSIGNMENT BLOCKED:",
          {
            leadOrganization:
              String(
                lead.organizationId
              ),

            agentOrganization:
              String(
                targetAgent.organizationId
              ),

            leadId:
              String(
                lead._id
              ),

            targetAgentId:
              String(
                targetAgent._id
              ),
          }
        );

        return {
          accepted: false,
          reason: "cross_organization_assignment",
          lead,
          assignedAgent: null,
        };
      }


      // ======================================================
      // 9. CURRENT ASSIGNMENT
      // ======================================================

      const currentAgentId =
        lead.assignedTo
          ? getAssignmentId(
              lead.assignedTo
            )
          : null;


      // ======================================================
      // 10. NO EXISTING ASSIGNMENT
      // ======================================================

      if (
        !currentAgentId
      ) {

        lead.assignedTo =
          targetAgent._id;

        lead.assignedBy =
          newAssignment.assignedBy ||
          null;

        lead.assignedAt =
          newAssignment.assignedAt ||
          new Date();

        lead.assignedSource =
          newSource;


        // ----------------------------------------------------
        // Legacy compatibility
        // ----------------------------------------------------

        if (
          Object.prototype.hasOwnProperty.call(
            lead,
            "agent"
          )
        ) {

          lead.agent =
            targetAgent.name ||
            targetAgent.email ||
            null;
        }


        await lead.save();


        console.log(
          "✅ NEW LEAD ASSIGNMENT ACCEPTED:",
          {
            leadId:
              String(
                lead._id
              ),

            agentId:
              String(
                targetAgent._id
              ),

            source:
              newSource,
          }
        );


        return {
          accepted: true,

          reason:
            "new_assignment",

          lead,

          assignedAgent:
            targetAgent,

          previousAgentId:
            null,

          previousSource:
            null,

          assignedSource:
            newSource,
        };
      }


      // ======================================================
      // 11. SAME AGENT
      // ======================================================
      //
      // Repeating the same assignment is NOT a new workload
      // assignment.
      //
      // Therefore:
      //
      // ✓ no mutation
      // ✓ no save
      // ✓ no workload increment
      // ✓ no duplicate realtime event
      //
      // ======================================================

      if (
        currentAgentId ===
        String(
          targetAgent._id
        )
      ) {

        console.log(
          "ℹ️ Lead is already assigned to this agent."
        );

        return {
          accepted: false,

          reason:
            "already_assigned_to_target",

          lead,

          assignedAgent:
            targetAgent,

          previousAgentId:
            currentAgentId,

          previousSource:
            VALID_SOURCES.includes(
              lead.assignedSource
            )
              ? lead.assignedSource
              : "manual",
        };
      }


      // ======================================================
      // 12. CURRENT ASSIGNMENT SOURCE
      // ======================================================
      //
      // Legacy/unknown assignment sources are treated as
      // manual for safety.
      //
      // This is intentionally fail-closed.
      //
      // ======================================================

      const currentSource =
        VALID_SOURCES.includes(
          lead.assignedSource
        )
          ? lead.assignedSource
          : "manual";


      const currentPriority =
        PRIORITY[
          currentSource
        ] ||
        PRIORITY.manual;


      // ======================================================
      // 13. PRIORITY DEBUG
      // ======================================================

      console.log(
        "📊 ASSIGNMENT PRIORITY:",
        {
          leadId:
            String(
              lead._id
            ),

          currentAgentId,

          currentSource,

          currentPriority,

          requestedAgentId:
            String(
              targetAgent._id
            ),

          newSource,

          newPriority,
        }
      );


      // ======================================================
      // 14. BLOCK LOWER PRIORITY OVERRIDE
      // ======================================================
      //
      // Example:
      //
      // Existing:
      //   manual → Agent A
      //
      // Requested:
      //   ai → Agent B
      //
      // Result:
      //   BLOCKED
      //
      // IMPORTANT:
      //
      // This returns accepted:false.
      //
      // The caller MUST NOT:
      //
      // ✗ save the lead
      // ✗ modify assignment fields
      // ✗ increment workload
      // ✗ emit assignment event
      //
      // ======================================================

      if (
        newPriority <
        currentPriority
      ) {

        console.log(
          "🛑 ASSIGNMENT BLOCKED BY PRIORITY:",
          {
            leadId:
              String(
                lead._id
              ),

            existingAgent:
              currentAgentId,

            requestedAgent:
              String(
                targetAgent._id
              ),

            existingSource:
              currentSource,

            requestedSource:
              newSource,
          }
        );


        return {
          accepted: false,

          reason:
            "higher_priority_assignment_exists",

          lead,

          assignedAgent:
            null,

          previousAgentId:
            currentAgentId,

          previousSource:
            currentSource,
        };
      }


      // ======================================================
      // 15. OVERRIDE EXISTING ASSIGNMENT
      // ======================================================
      //
      // Allowed:
      //
      // manual > ai
      // manual > auto
      // ai > auto
      //
      // Equal-priority reassignment is also allowed.
      //
      // ======================================================

      const previousAgentId =
        currentAgentId;


      lead.assignedTo =
        targetAgent._id;

      lead.assignedBy =
        newAssignment.assignedBy ||
        null;

      lead.assignedAt =
        newAssignment.assignedAt ||
        new Date();

      lead.assignedSource =
        newSource;


      // ------------------------------------------------------
      // Legacy compatibility
      // ------------------------------------------------------

      if (
        Object.prototype.hasOwnProperty.call(
          lead,
          "agent"
        )
      ) {

        lead.agent =
          targetAgent.name ||
          targetAgent.email ||
          null;
      }


      await lead.save();


      console.log(
        "🔁 ASSIGNMENT OVERRIDE ACCEPTED:",
        {
          leadId:
            String(
              lead._id
            ),

          previousAgentId,

          newAgentId:
            String(
              targetAgent._id
            ),

          previousSource:
            currentSource,

          newSource,

          priority:
            newPriority,
        }
      );


      return {
        accepted: true,

        reason:
          "assignment_overridden",

        lead,

        assignedAgent:
          targetAgent,

        previousAgentId,

        previousSource:
          currentSource,

        assignedSource:
          newSource,
      };


    } catch (
      error
    ) {

      console.error(
        "❌ ASSIGNMENT CONFLICT RESOLVER ERROR:",
        error
      );

      console.error(
        error?.stack
      );


      return {
        accepted: false,

        reason:
          "resolver_error",

        lead: null,

        assignedAgent:
          null,

        error,
      };
    }
  };


// ============================================================
// DEFAULT EXPORT
// ============================================================

export default {
  resolveAssignmentConflict,
};