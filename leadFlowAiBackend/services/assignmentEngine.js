/**
 * ==========================================================
 *
 * ASSIGNMENT ENGINE
 *
 * ==========================================================
 *
 * PURPOSE
 * ----------------------------------------------------------
 * Compatibility layer for LeadFlow AI lead assignment.
 *
 * IMPORTANT
 * ----------------------------------------------------------
 * This file contains NO assignment algorithm.
 *
 * The single source of truth for automatic assignment is:
 *
 *     ./leadAutoAssignmentEngine.js
 *
 * ==========================================================
 *
 * ARCHITECTURE
 * ----------------------------------------------------------
 *
 * Caller
 *   ↓
 * assignmentEngine
 *   ↓
 * leadAutoAssignmentEngine
 *   ↓
 * candidate selection
 *   ↓
 * assignmentConflictResolver
 *   ↓
 * final assignment
 *
 * ==========================================================
 */

import {
  autoAssignLead as autoAssignLeadFromService,

  getAgents,

  roundRobinAssign,

  leastBusyAgent,

  bestPerformingAgent,

  scoreBasedAssign,

} from "./leadAutoAssignmentEngine.js";


// ==========================================================
// MAIN ASSIGNMENT ENGINE
// ==========================================================
//
// Existing imports can continue using:
//
// import {
//   autoAssignLead
// } from "./assignmentEngine.js";
//
// ==========================================================

export const autoAssignLead = async (
  lead
) => {

  try {

    // ======================================================
    // VALIDATION
    // ======================================================

    if (!lead) {

      console.log(
        "⚠️ Assignment engine skipped: lead is missing."
      );

      return null;
    }


    // ======================================================
    // DELEGATE
    // ======================================================

    const result =
      await autoAssignLeadFromService(
        lead
      );


    // ======================================================
    // RESULT LOGGING
    // ======================================================

    if (
      result?.accepted
    ) {

      console.log(
        "🤖 Assignment engine completed successfully."
      );

      console.log(
        "📌 Lead:",
        lead._id
      );

      console.log(
        "📌 Assigned agent:",
        result?.assignedAgent?._id ||
        lead.assignedTo ||
        null
      );

      console.log(
        "📌 Assignment source:",
        result?.assignedSource ||
        lead.assignedSource ||
        "ai"
      );

    } else {

      console.log(
        "ℹ️ Assignment engine did not create an assignment."
      );

      if (
        result?.reason
      ) {

        console.log(
          "📌 Assignment result:",
          result.reason
        );
      }
    }


    return result;

  } catch (
    error
  ) {

    console.error(
      "❌ ASSIGNMENT ENGINE ERROR:",
      error
    );

    console.error(
      error?.stack
    );

    return null;
  }
};


// ==========================================================
// ROUTING HELPERS
// ==========================================================
//
// Re-exported only for backwards compatibility/testing.
//
// ==========================================================

export {
  getAgents,

  roundRobinAssign,

  leastBusyAgent,

  bestPerformingAgent,

  scoreBasedAssign,
};


// ==========================================================
// DEFAULT EXPORT
// ==========================================================

export default {

  autoAssignLead,

  getAgents,

  roundRobinAssign,

  leastBusyAgent,

  bestPerformingAgent,

  scoreBasedAssign,
};