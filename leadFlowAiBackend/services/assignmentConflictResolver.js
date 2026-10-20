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
 * ✓ Invalid assignment actors
 * ✓ Workload updates caused by rejected assignments
 * ✓ Concurrent assignment races
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
 *
 * EVENT ARCHITECTURE
 * ------------------------------------------------------------
 *
 * Assignment mutation and the canonical assignment Outbox
 * event are persisted inside the SAME MongoDB transaction.
 *
 * Therefore:
 *
 *   Lead assignment
 *        +
 *   LEAD_ASSIGNED outbox event
 *
 * succeed or roll back together.
 *
 * ============================================================
 */

import mongoose from "mongoose";
import { randomUUID } from "crypto";

import Lead from "../models/lead.js";
import User from "../models/user.js";

import {
  withReliableTransaction,
  addLeadAssignedEvent,
} from "./outboxIntegrationService.js";

/* ============================================================
   ASSIGNMENT PRIORITY
============================================================ */

const PRIORITY = Object.freeze({
  auto: 1,
  ai: 2,
  manual: 3,
});

/* ============================================================
   VALID ASSIGNMENT SOURCES
============================================================ */

const VALID_SOURCES = Object.freeze([
  "auto",
  "ai",
  "manual",
]);

/* ============================================================
   VALIDATE OBJECT ID
============================================================ */

const isValidObjectId = (value) => {
  return Boolean(
    value &&
      mongoose.Types.ObjectId.isValid(value)
  );
};

/* ============================================================
   NORMALIZE OBJECT ID
============================================================ */

const normalizeObjectId = (value) => {
  if (!value) {
    return null;
  }

  try {
    return String(value);
  } catch {
    return null;
  }
};

/* ============================================================
   NORMALIZE ASSIGNMENT ID
============================================================ */

/**
 * Handles:
 *
 *   ObjectId
 *   populated document
 *   string
 */
const getAssignmentId = (value) => {
  if (!value) {
    return null;
  }

  if (
    typeof value === "object" &&
    value._id
  ) {
    return normalizeObjectId(
      value._id
    );
  }

  return normalizeObjectId(value);
};

/* ============================================================
   LEGACY AGENT FIELD SUPPORT
============================================================ */

/**
 * The authoritative assignment field is:
 *
 *   assignedTo
 *
 * "agent" is legacy compatibility only.
 */
const hasLegacyAgentField = () => {
  return Boolean(
    Lead.schema?.path?.("agent")
  );
};

/* ============================================================
   SAFE ASSIGNED-BY VALIDATION
============================================================ */

/**
 * assignedBy represents the user who initiated the assignment.
 *
 * If supplied, it must:
 *
 * ✓ be a valid ObjectId
 * ✓ exist
 * ✓ belong to the same organization
 */
const validateAssignedBy = async (
  assignedBy,
  organizationId,
  session = null
) => {
  if (!assignedBy) {
    return {
      valid: true,
      user: null,
    };
  }

  if (
    !isValidObjectId(
      assignedBy
    )
  ) {
    return {
      valid: false,
      reason:
        "invalid_assigned_by",
      user: null,
    };
  }

  let query =
    User.findOne({
      _id: assignedBy,
      organizationId,
    }).select(
      "_id name email role organizationId isActive"
    );

  if (session) {
    query = query.session(
      session
    );
  }

  const user =
    await query;

  if (!user) {
    return {
      valid: false,
      reason:
        "assigned_by_not_found_in_organization",
      user: null,
    };
  }

  if (!user.organizationId) {
    return {
      valid: false,
      reason:
        "assigned_by_has_no_organization",
      user: null,
    };
  }

  if (
    String(
      user.organizationId
    ) !==
    String(
      organizationId
    )
  ) {
    return {
      valid: false,
      reason:
        "assigned_by_organization_mismatch",
      user: null,
    };
  }

  return {
    valid: true,
    user,
  };
};

/* ============================================================
   BUILD CURRENT SOURCE
============================================================ */

/**
 * Unknown / missing legacy assignment sources are treated as
 * manual.
 *
 * This is deliberately fail-closed.
 */
const getEffectiveCurrentSource = (
  assignedSource
) => {
  return VALID_SOURCES.includes(
    assignedSource
  )
    ? assignedSource
    : "manual";
};

/* ============================================================
   BUILD CURRENT SOURCE QUERY
============================================================ */

/**
 * Used for the atomic update.
 *
 * We need the database query to represent the exact assignment
 * state we previously inspected.
 */
const buildCurrentSourceCondition = (
  rawSource,
  effectiveSource
) => {
  if (
    VALID_SOURCES.includes(
      rawSource
    )
  ) {
    return {
      assignedSource:
        effectiveSource,
    };
  }

  return {
    $or: [
      {
        assignedSource: {
          $exists: false,
        },
      },
      {
        assignedSource: null,
      },
      {
        assignedSource:
          effectiveSource,
      },
    ],
  };
};

/* ============================================================
   RESOLVE ASSIGNMENT CONFLICT
============================================================ */

/**
 * SUCCESS:
 *
 * {
 *   accepted: true,
 *   reason,
 *   lead,
 *   assignedAgent,
 *   previousAgentId,
 *   previousSource,
 *   assignedSource,
 *   assignmentEventQueued
 * }
 */
export const resolveAssignmentConflict =
  async (
    leadId,
    newAssignment,
    organizationId,
    {
    session: suppliedSession = null,
    operationId: suppliedOperationId = null,
  } = {}
  ) => {
    try {
      const runAssignmentTransaction = (callback) => {
  if (suppliedSession) {
    return callback(suppliedSession);
  }

  return withReliableTransaction(callback);
};
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

      console.log(
        "📌 Organization ID:",
        organizationId
      );

      /* ======================================================
         1. VALIDATE LEAD ID
      ====================================================== */

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
          reason:
            "invalid_lead_id",
          lead: null,
          assignedAgent: null,
        };
      }

      /* ======================================================
         2. VALIDATE ORGANIZATION
      ====================================================== */

      if (!organizationId) {
        console.log(
          "🛑 Assignment rejected: organizationId missing."
        );

        return {
          accepted: false,
          reason:
            "organization_required",
          lead: null,
          assignedAgent: null,
        };
      }

      if (
        !isValidObjectId(
          organizationId
        )
      ) {
        console.log(
          "🛑 Assignment rejected: invalid organizationId."
        );

        return {
          accepted: false,
          reason:
            "invalid_organization_id",
          lead: null,
          assignedAgent: null,
        };
      }

      const normalizedOrganizationId =
        normalizeObjectId(
          organizationId
        );

      /* ======================================================
         3. VALIDATE ASSIGNMENT OBJECT
      ====================================================== */

      if (
        !newAssignment ||
        typeof newAssignment !==
          "object"
      ) {
        console.log(
          "⚠️ Assignment rejected: assignment payload missing."
        );

        return {
          accepted: false,
          reason:
            "assignment_payload_missing",
          lead: null,
          assignedAgent: null,
        };
      }

      /* ======================================================
         4. VALIDATE TARGET AGENT ID
      ====================================================== */

      if (
        !newAssignment.assignedTo
      ) {
        console.log(
          "⚠️ Assignment rejected: assignedTo missing."
        );

        return {
          accepted: false,
          reason:
            "assigned_to_missing",
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
          reason:
            "invalid_assigned_to",
          lead: null,
          assignedAgent: null,
        };
      }

      /* ======================================================
         5. VALIDATE ASSIGNMENT SOURCE
      ====================================================== */

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
          reason:
            "invalid_assignment_source",
          lead: null,
          assignedAgent: null,
        };
      }

      const newPriority =
        PRIORITY[newSource];

      /* ======================================================
         6. VALIDATE ASSIGNMENT ACTOR
      ====================================================== */

      const assignedByValidation =
  await validateAssignedBy(
    newAssignment.assignedBy,
    normalizedOrganizationId,
    suppliedSession
  );

      if (
        !assignedByValidation.valid
      ) {
        console.log(
          "🛑 Assignment rejected: invalid assignment actor.",
          assignedByValidation.reason
        );

        return {
          accepted: false,
          reason:
            assignedByValidation.reason,
          lead: null,
          assignedAgent: null,
        };
      }

      /* ======================================================
         7. FIND LEAD — TENANT SCOPED
      ====================================================== */

      let leadQuery = Lead.findOne({
  _id: leadId,
  organizationId: normalizedOrganizationId,
});

if (suppliedSession) {
  leadQuery = leadQuery.session(suppliedSession);
}

let lead = await leadQuery;

      if (!lead) {
        console.log(
          "⚠️ Lead not found for conflict resolution."
        );

        return {
          accepted: false,
          reason:
            "lead_not_found",
          lead: null,
          assignedAgent: null,
        };
      }

      /* ======================================================
         8. DEFENSIVE LEAD ORGANIZATION VALIDATION
      ====================================================== */

      if (!lead.organizationId) {
        console.log(
          "🛑 Assignment rejected: lead has no organization."
        );

        return {
          accepted: false,
          reason:
            "lead_has_no_organization",
          lead,
          assignedAgent: null,
        };
      }

      if (
        String(
          lead.organizationId
        ) !==
        normalizedOrganizationId
      ) {
        console.error(
          "🛑 CROSS-ORGANIZATION LEAD ACCESS BLOCKED:",
          {
            leadOrganization:
              String(
                lead.organizationId
              ),

            requestedOrganization:
              normalizedOrganizationId,

            leadId:
              String(
                lead._id
              ),
          }
        );

        return {
          accepted: false,
          reason:
            "lead_organization_mismatch",
          lead: null,
          assignedAgent: null,
        };
      }

      /* ======================================================
         9. FIND TARGET AGENT
      ====================================================== */

      let targetAgentQuery = User.findOne({
  _id: newAssignment.assignedTo,
  organizationId: normalizedOrganizationId,
  role: "agent",
  isActive: true,
}).select(
  "_id name email role organizationId isActive"
);

if (suppliedSession) {
  targetAgentQuery =
    targetAgentQuery.session(suppliedSession);
}

const targetAgent = await targetAgentQuery;

if (!targetAgent) {
  console.log(
    "🛑 Assignment rejected: target is not an active agent in this organization."
  );

  return {
    accepted: false,
    reason: "target_agent_invalid",
    lead,
    assignedAgent: null,
  };
}

      /* ======================================================
         10. DEFENSIVE TARGET AGENT ORGANIZATION VALIDATION
      ====================================================== */

      if (
        !targetAgent.organizationId
      ) {
        console.log(
          "🛑 Assignment rejected: target agent has no organization."
        );

        return {
          accepted: false,
          reason:
            "target_agent_has_no_organization",
          lead,
          assignedAgent: null,
        };
      }

      if (
        String(
          targetAgent.organizationId
        ) !==
        normalizedOrganizationId
      ) {
        console.error(
          "🛑 CROSS-ORGANIZATION TARGET AGENT BLOCKED:",
          {
            leadOrganization:
              String(
                lead.organizationId
              ),

            agentOrganization:
              String(
                targetAgent.organizationId
              ),

            requestedOrganization:
              normalizedOrganizationId,

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
          reason:
            "cross_organization_assignment",
          lead,
          assignedAgent: null,
        };
      }

      /* ======================================================
         11. CURRENT ASSIGNMENT
      ====================================================== */

      const currentAgentId =
        getAssignmentId(
          lead.assignedTo
        );

      const targetAgentId =
        String(
          targetAgent._id
        );

      /* ======================================================
         12. NO EXISTING ASSIGNMENT
      ====================================================== */

      if (
        !currentAgentId
      ) {
        const assignedAt =
          newAssignment.assignedAt ||
          new Date();

        const update = {
          $set: {
            assignedTo:
              targetAgent._id,

            assignedBy:
              newAssignment.assignedBy ||
              null,

            assignedAt,

            assignedSource:
              newSource,
          },
        };

        if (
          hasLegacyAgentField()
        ) {
          update.$set.agent =
            targetAgent.name ||
            targetAgent.email ||
            null;
        }

        /**
         * The Lead assignment mutation and its canonical
         * LEAD_ASSIGNED Outbox event are committed together.
         */
        const operationId =
  suppliedOperationId || randomUUID();

const transactionResult =
  await runAssignmentTransaction(
  async (session) => {
              const updatedLead =
                await Lead.findOneAndUpdate(
                  {
                    _id:
                      lead._id,

                    organizationId:
                      normalizedOrganizationId,

                    $or: [
                      {
                        assignedTo: {
                          $exists: false,
                        },
                      },
                      {
                        assignedTo: null,
                      },
                    ],
                  },

                  update,

                  {
                    returnDocument: 'after',
                    runValidators: true,
                    session,
                  }
                );

              if (!updatedLead) {
                console.log(
                  "⚠️ Assignment lost a concurrency race. Lead was assigned by another request."
                );

                const currentLead =
                  await Lead.findOne({
                    _id:
                      lead._id,

                    organizationId:
                      normalizedOrganizationId,
                  }).session(
                    session
                  );

                return {
                  accepted:
                    false,

                  reason:
                    "concurrent_assignment_change",

                  lead:
                    currentLead,

                  assignedAgent:
                    null,

                  previousAgentId:
                    currentLead
                      ? getAssignmentId(
                          currentLead.assignedTo
                        )
                      : null,

                  previousSource:
                    currentLead
                      ? getEffectiveCurrentSource(
                          currentLead.assignedSource
                        )
                      : null,
                };
              }

              await addLeadAssignedEvent({
                session,

                lead:
                  updatedLead,

                agentId:
                  targetAgentId,

                previousAgentId:
                  null,

                organizationId:
                  normalizedOrganizationId,

                operationId,

                metadata: {
                  assignmentSource:
                    newSource,

                  assignedBy:
                    newAssignment.assignedBy ||
                    null,

                  assignedAt:
                    updatedLead.assignedAt ||
                    assignedAt,
                },
              });

              return {
                accepted:
                  true,

                updatedLead,

                assignmentEventQueued:
                  true,
              };
            }
          );

        if (
          !transactionResult?.accepted
        ) {
          return {
            accepted: false,

            reason:
              transactionResult?.reason ||
              "concurrent_assignment_change",

            lead:
              transactionResult?.lead ||
              null,

            assignedAgent:
              null,

            previousAgentId:
              transactionResult?.previousAgentId ||
              null,

            previousSource:
              transactionResult?.previousSource ||
              null,

            assignmentEventQueued:
              false,
          };
        }

        lead =
          transactionResult.updatedLead;

        console.log(
          "✅ NEW LEAD ASSIGNMENT ACCEPTED:",
          {
            leadId:
              String(
                lead._id
              ),

            agentId:
              targetAgentId,

            source:
              newSource,

            organizationId:
              normalizedOrganizationId,
          }
        );

        console.log(
          "📦 Assignment + LEAD_ASSIGNED outbox event committed atomically:",
          {
            leadId:
              String(
                lead._id
              ),

            agentId:
              targetAgentId,

            operationId,
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

          assignedBy:
            lead.assignedBy ||
            null,

          assignedAt:
            lead.assignedAt ||
            assignedAt,

          assignmentEventQueued:
            true,

          operationId,
        };
      }

      /* ======================================================
         13. SAME AGENT
      ====================================================== */

      if (
        currentAgentId ===
        targetAgentId
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
            getEffectiveCurrentSource(
              lead.assignedSource
            ),

          assignedSource:
            lead.assignedSource ||
            null,

          assignmentEventQueued:
            false,
        };
      }

      /* ======================================================
         14. CURRENT ASSIGNMENT SOURCE
      ====================================================== */

      const currentSource =
        getEffectiveCurrentSource(
          lead.assignedSource
        );

      const currentPriority =
        PRIORITY[
          currentSource
        ] ||
        PRIORITY.manual;

      /* ======================================================
         15. PRIORITY DEBUG
      ====================================================== */

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
            targetAgentId,

          newSource,

          newPriority,

          organizationId:
            normalizedOrganizationId,
        }
      );

      /* ======================================================
         16. BLOCK LOWER PRIORITY OVERRIDE
      ====================================================== */

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
              targetAgentId,

            existingSource:
              currentSource,

            requestedSource:
              newSource,

            organizationId:
              normalizedOrganizationId,
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

          assignedSource:
            newSource,

          assignmentEventQueued:
            false,
        };
      }

      /* ======================================================
         17. OVERRIDE EXISTING ASSIGNMENT
      ====================================================== */

      const previousAgentId =
        currentAgentId;

      const previousSource =
        currentSource;

      const assignedAt =
        newAssignment.assignedAt ||
        new Date();

      const update = {
        $set: {
          assignedTo:
            targetAgent._id,

          assignedBy:
            newAssignment.assignedBy ||
            null,

          assignedAt,

          assignedSource:
            newSource,
        },
      };

      if (
        hasLegacyAgentField()
      ) {
        update.$set.agent =
          targetAgent.name ||
          targetAgent.email ||
          null;
      }

      /**
       * Only override the assignment if the database still
       * contains the exact assignment state this resolver read.
       */
      const currentSourceCondition =
        buildCurrentSourceCondition(
          lead.assignedSource,
          currentSource
        );

      const operationId =
  suppliedOperationId || randomUUID();

const transactionResult =
  await runAssignmentTransaction(
    async (session) => {
            const updatedLead =
              await Lead.findOneAndUpdate(
                {
                  _id:
                    lead._id,

                  organizationId:
                    normalizedOrganizationId,

                  assignedTo:
                    lead.assignedTo,

                  ...currentSourceCondition,
                },

                update,

                {
                  returnDocument: 'after',
                  runValidators: true,
                  session,
                }
              );

            if (!updatedLead) {
              console.log(
                "⚠️ Assignment override lost a concurrency race."
              );

              const currentLead =
                await Lead.findOne({
                  _id:
                    lead._id,

                  organizationId:
                    normalizedOrganizationId,
                }).session(
                  session
                );

              return {
                accepted: false,

                reason:
                  "concurrent_assignment_change",

                lead:
                  currentLead,

                assignedAgent:
                  null,

                previousAgentId:
                  currentLead
                    ? getAssignmentId(
                        currentLead.assignedTo
                      )
                    : null,

                previousSource:
                  currentLead
                    ? getEffectiveCurrentSource(
                        currentLead.assignedSource
                      )
                    : null,
              };
            }

            await addLeadAssignedEvent({
              session,

              lead:
                updatedLead,

              agentId:
                targetAgentId,

              previousAgentId:
                previousAgentId ||
                null,

              organizationId:
                normalizedOrganizationId,

              operationId,

              metadata: {
                assignmentSource:
                  newSource,

                assignedBy:
                  newAssignment.assignedBy ||
                  null,

                assignedAt:
                  updatedLead.assignedAt ||
                  assignedAt,
              },
            });

            return {
              accepted:
                true,

              updatedLead,

              assignmentEventQueued:
                true,
            };
          }
        );

      if (
        !transactionResult?.accepted
      ) {
        return {
          accepted: false,

          reason:
            transactionResult?.reason ||
            "concurrent_assignment_change",

          lead:
            transactionResult?.lead ||
            null,

          assignedAgent:
            null,

          previousAgentId:
            transactionResult?.previousAgentId ||
            null,

          previousSource:
            transactionResult?.previousSource ||
            null,

          assignmentEventQueued:
            false,
        };
      }

      lead =
        transactionResult.updatedLead;

      console.log(
        "🔁 ASSIGNMENT OVERRIDE ACCEPTED:",
        {
          leadId:
            String(
              lead._id
            ),

          previousAgentId,

          newAgentId:
            targetAgentId,

          previousSource,

          newSource,

          priority:
            newPriority,

          organizationId:
            normalizedOrganizationId,
        }
      );

      console.log(
        "📦 Assignment override + LEAD_ASSIGNED outbox event committed atomically:",
        {
          leadId:
            String(
              lead._id
            ),

          previousAgentId,

          newAgentId:
            targetAgentId,

          operationId,
        }
      );

      /* ======================================================
         18. SUCCESS RESPONSE
      ====================================================== */

      return {
        accepted: true,

        reason:
          "assignment_overridden",

        lead,

        assignedAgent:
          targetAgent,

        previousAgentId,

        previousSource,

        assignedSource:
          newSource,

        assignedBy:
          lead.assignedBy ||
          null,

        assignedAt:
          lead.assignedAt ||
          assignedAt,

        assignmentEventQueued:
          true,

        operationId,
      };
    } catch (error) {
  console.error(
    "❌ ASSIGNMENT CONFLICT RESOLVER ERROR:",
    error
  );

  console.error(
    error?.stack
  );

  // When an outer transaction owns the session, propagate
  // database errors so that transaction can abort.
  if (suppliedSession) {
    throw error;
  }

  // Preserve the existing result-based contract for callers
  // that use the resolver's own transaction.
  return {
    accepted: false,
    reason: "resolver_error",
    lead: null,
    assignedAgent: null,
    error,
  };
}
  };

/* ============================================================
   DEFAULT EXPORT
============================================================ */

export default {
  resolveAssignmentConflict,
};