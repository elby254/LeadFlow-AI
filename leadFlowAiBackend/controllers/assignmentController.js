/**
 * ==========================================================
 *
 * ASSIGNMENT CONTROLLER
 *
 * ==========================================================
 *
 * Purpose
 * ----------------------------------------------------------
 * Handles the operational lead workflow between:
 *
 * Admin
 *   ↓
 * Assign / Reassign Lead
 *   ↓
 * Agent
 *   ↓
 * View Assigned Leads
 *
 * Security model
 * ----------------------------------------------------------
 *
 * ADMIN
 * ✓ Assign leads
 * ✓ Reassign leads
 * ✓ View unassigned leads
 *
 * AGENT
 * ✓ View ONLY assigned leads
 * ✓ Cannot assign leads
 * ✓ Cannot reassign leads
 *
 * VIEWER
 * ✗ No lead workflow access
 *
 * Multi-tenant isolation
 * ----------------------------------------------------------
 * Every lead query is restricted by:
 *
 * authenticated organization resolved through
 * organizationResolverService
 *
 * An agent can NEVER retrieve a lead belonging to
 * another organization.
 *
 * ==========================================================
 *
 * ASSIGNMENT AUTHORITY
 * ==========================================================
 *
 * Manual assignment:
 *
 *     assignmentController
 *              ↓
 *          Lead mutation
 *
 *
 * System / AI assignment:
 *
 *     leadAutoAssignmentService
 *              ↓
 *     assignmentConflictResolver
 *              ↓
 *     Lead assignment mutation
 *
 *
 * This controller does NOT change the automatic
 * assignment authority.
 *
 * ==========================================================
 *
 * RELIABLE EVENT ARCHITECTURE
 * ==========================================================
 *
 * Critical assignment event:
 *
 *     lead.assigned
 *
 * is persisted into the MongoDB Outbox in the SAME
 * transaction as the Lead assignment mutation.
 *
 * Flow:
 *
 *     Lead mutation
 *          +
 *     OutboxEvent
 *          ↓
 *     transaction commit
 *          ↓
 *     Outbox Worker
 *          ↓
 *     leadEventBus
 *          ↓
 *     realtimeEngine
 *
 * IMPORTANT:
 *
 * There must NOT be a direct:
 *
 *     leadEventBus.emit(
 *       LEAD_EVENTS.LEAD_ASSIGNED
 *     )
 *
 * from this controller.
 *
 * ==========================================================
 */

import mongoose from "mongoose";

import Lead from "../models/lead.js";


import leadEventBus, {
  LEAD_EVENTS,
} from "../events/leadEvents.js";

import { executeIdempotentRequest } from "../services/httpIdempotencyService.js";

import { resolveAssignmentConflict } from "../services/assignmentConflictResolver.js";

import {
  resolveFromRequest,
} from "../services/organizationResolverService.js";


// =====================================================
// HELPER: GET AUTHENTICATED USER ID
// =====================================================
//
// protect() should already have attached:
//
// req.user
//
// We support both:
//
// req.user._id
// req.user.id
//
// =====================================================

const getUserId = (
  req
) => {

  return (
    req.user?._id ||
    req.user?.id ||
    null
  );
};


// =====================================================
// HELPER: GET AUTHENTICATED ORGANIZATION ID
// =====================================================
//
// Organization resolution is centralized through:
//
// organizationResolverService
//
// This prevents individual controllers from resolving
// tenant identity through their own request-field logic.
//
// =====================================================

const getOrganizationId = async (
  req
) => {

  const organization =
    await resolveFromRequest(
      req
    );


  if (
    !organization
  ) {

    return null;
  }


  return (
    organization._id ||
    null
  );
};


// =====================================================
// HELPER: VALIDATE OBJECT ID
// =====================================================

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


// =====================================================
// HELPER: GENERIC ASSIGNMENT READ-MODEL EVENTS
// =====================================================
//
// These are NOT the critical assignment event.
//
// They remain direct during the current migration phase:
//
//   lead.updated
//   lead.pipeline.updated
//
// The critical:
//
//   lead.assigned
//
// event is Outbox-backed.
//
// =====================================================

const emitAssignmentReadModelEvents = (
  lead,
  agent
) => {

  try {

    if (
      !lead
    ) {

      return;
    }


    const organizationId =
      lead.organizationId ||
      null;


    const payload = {

      leadId:
        lead._id ||
        null,

      organizationId,

      lead,

      status:
        lead.status ||
        "new",

      score:
        Number(
          lead.score ||
          0
        ),

      assignedTo:
        lead.assignedTo ||
        null,

      assignedAt:
        lead.assignedAt ||
        null,

      assignedBy:
        lead.assignedBy ||
        null,

      assignedSource:
        lead.assignedSource ||
        null,

      agent:
        agent
          ? {
              _id:
                agent._id ||
                null,

              name:
                agent.name ||
                null,

              email:
                agent.email ||
                null,

              role:
                agent.role ||
                null,
            }
          : null,

      currentViewingId:
        lead.currentViewing ||
        null,

      followUpStatus:
        lead.followUpStatus ||
        null,

      occurredAt:
        new Date(),

    };


    // =================================================
    // GENERIC LEAD UPDATE
    // =================================================

    leadEventBus.emit(

      LEAD_EVENTS.LEAD_UPDATED,

      payload

    );


    // =================================================
    // CANONICAL PIPELINE UPDATE
    // =================================================

    leadEventBus.emit(

      LEAD_EVENTS.PIPELINE_UPDATED,

      payload

    );


    console.log(
      "📡 ASSIGNMENT READ-MODEL EVENTS EMITTED"
    );


  } catch (
    eventError
  ) {

    console.error(
      "⚠️ ASSIGNMENT READ-MODEL EVENT ERROR:",
      eventError
    );
  }
};


// =====================================================
// CANONICAL MANUAL ASSIGNMENT HANDLER
// =====================================================
//
// Responsibilities:
// - Validate the authenticated admin and organization.
// - Validate the lead and target agent IDs.
// - Require HTTP idempotency.
// - Reuse the HTTP idempotency transaction.
// - Delegate assignment decisions to assignmentConflictResolver.
// - Commit the lead mutation and critical Outbox event together.
// - Emit non-critical realtime events only after a new commit.
//
// =====================================================

const handleManualAssignment = async (
  req,
  res,
  {
    targetAgentId,
    operationName,
    successMessage,
  }
) => {
  try {
    console.log(
      `👤 ADMIN ${operationName.toUpperCase()} REQUEST`
    );

    const { id: leadId } = req.params;

    const adminId = getUserId(req);

    const organizationId = await getOrganizationId(req);

    // -------------------------------------------------
    // AUTHENTICATION
    // -------------------------------------------------

    if (!req.user || !adminId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    // -------------------------------------------------
    // ORGANIZATION
    // -------------------------------------------------

    if (!organizationId) {
      return res.status(403).json({
        success: false,
        message: "Organization not assigned.",
      });
    }

    // -------------------------------------------------
    // VALIDATE LEAD ID
    // -------------------------------------------------

    if (!isValidObjectId(leadId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid lead ID.",
      });
    }

    // -------------------------------------------------
    // VALIDATE TARGET AGENT ID
    // -------------------------------------------------

    if (!isValidObjectId(targetAgentId)) {
      return res.status(400).json({
        success: false,
        message: "A valid agent ID is required.",
      });
    }

    // -------------------------------------------------
    // IDEMPOTENT ASSIGNMENT TRANSACTION
    // -------------------------------------------------

    const result = await executeIdempotentRequest({
      req,

      organizationId,

      actorId: adminId,

      execute: async ({
        session,
        operationId,
      }) => {
        // The resolver owns assignment decisions.
        // It must reuse this transaction's session.
        const decision = await resolveAssignmentConflict(
          leadId,
          {
            assignedTo: targetAgentId,
            assignedBy: adminId,
            assignedSource: "manual",
            assignedAt: new Date(),
          },
          organizationId,
          {
            session,
            operationId,
          }
        );

        // ---------------------------------------------
        // RESOLVER RESULT VALIDATION
        // ---------------------------------------------

        if (!decision || typeof decision.accepted !== "boolean") {
          const error = new Error(
            "Assignment resolver returned an invalid result."
          );

          error.statusCode = 500;

          throw error;
        }

        // ---------------------------------------------
        // SAME-AGENT NO-OP
        // ---------------------------------------------
        //
        // This is a successful request, but not a new
        // assignment. Do not emit another read-model event.
        //
        // ---------------------------------------------

        if (
          !decision.accepted &&
          decision.reason === "already_assigned_to_target"
        ) {
          const existingLead = decision.lead;

          const existingAgent = decision.assignedAgent;

          return {
            status: 200,

            body: {
              success: true,
              message: "Lead is already assigned to this agent.",

              data: existingLead?.toObject
                ? existingLead.toObject()
                : existingLead,

              assignedAgent: existingAgent?.toObject
                ? existingAgent.toObject()
                : existingAgent,
            },
          };
        }

        // ---------------------------------------------
        // MAP REJECTED DECISIONS TO HTTP ERRORS
        // ---------------------------------------------
        //
        // Throwing inside execute aborts the transaction.
        // Rejected assignments must not be recorded as
        // completed successful idempotency operations.
        //
        // ---------------------------------------------

        if (!decision.accepted) {
          const reason = decision.reason;

          const statusByReason = {
            lead_not_found: 404,

            target_agent_invalid: 400,

            invalid_assigned_by: 400,

            assigned_by_not_found_in_organization: 403,

            assigned_by_has_no_organization: 403,

            assigned_by_organization_mismatch: 403,

            higher_priority_assignment_exists: 409,

            concurrent_assignment_change: 409,
          };

          const statusCode = statusByReason[reason] || 500;

          const messageByReason = {
            lead_not_found: "Lead not found.",

            target_agent_invalid:
              "The selected user is not a valid active agent in this organization.",

            invalid_assigned_by:
              "The assigning administrator is invalid.",

            assigned_by_not_found_in_organization:
              "The assigning administrator does not belong to this organization.",

            assigned_by_has_no_organization:
              "The assigning administrator has no organization.",

            assigned_by_organization_mismatch:
              "The assigning administrator belongs to a different organization.",

            higher_priority_assignment_exists:
              "The existing assignment has higher priority and cannot be overridden.",

            concurrent_assignment_change:
              "The assignment changed concurrently. Refresh the lead and try again.",

            resolver_error:
              "The assignment could not be completed.",
          };

          const error = new Error(
            messageByReason[reason] ||
              "The assignment could not be completed."
          );

          error.statusCode = statusCode;

          error.assignmentReason = reason;

          throw error;
        }

        // ---------------------------------------------
        // SUCCESSFUL ASSIGNMENT
        // ---------------------------------------------

        const assignedLead = decision.lead;

        const assignedAgent = decision.assignedAgent;

        if (!assignedLead || !assignedAgent) {
          const error = new Error(
            "Assignment resolver did not return the assigned lead and agent."
          );

          error.statusCode = 500;

          throw error;
        }

        const leadResponse = assignedLead.toObject
          ? assignedLead.toObject()
          : assignedLead;

        const agentResponse = assignedAgent.toObject
          ? assignedAgent.toObject()
          : assignedAgent;

        console.log("📦 ASSIGNMENT TRANSACTION ACCEPTED", {
          operationName,

          leadId: String(assignedLead._id),

          agentId: String(assignedAgent._id),

          organizationId: String(organizationId),

          operationId,
        });

        return {
          status: 200,

          body: {
            success: true,

            message: successMessage,

            data: leadResponse,

            assignedAgent: agentResponse,
          },

          // Available to postCommit for a newly executed
          // operation. It is not persisted in the response.
          postCommitData: {
            lead: assignedLead,
            agent: assignedAgent,
          },
        };
      },

      // -----------------------------------------------
      // NON-CRITICAL REALTIME EVENTS
      // -----------------------------------------------
      //
      // This callback runs after a new operation commits.
      // An idempotent replay must not emit these events again.
      //
      // -----------------------------------------------

      postCommit: async (operationResult) => {
        const committed = operationResult?.postCommitData;

        if (!committed?.lead || !committed?.agent) {
          return;
        }

        emitAssignmentReadModelEvents(
          committed.lead,
          committed.agent
        );

        console.log("✅ ASSIGNMENT READ-MODEL EVENTS EMITTED", {
          operationName,

          leadId: String(committed.lead._id),

          agentId: String(committed.agent._id),
        });
      },
    });

    // -------------------------------------------------
    // RETURN IDEMPOTENT RESPONSE
    // -------------------------------------------------

    return res.status(result.status).json(result.body);
  } catch (error) {
    console.error(
      `❌ ADMIN ${operationName.toUpperCase()} FAILED:`,
      error?.message
    );

    // Never expose internal database errors or stack traces.
    const statusCode =
      Number.isInteger(error?.statusCode) &&
      error.statusCode >= 400 &&
      error.statusCode <= 599
        ? error.statusCode
        : 500;

    const safeMessages = {
      400: error.message,
      401: error.message,
      403: error.message,
      404: error.message,
      409: error.message,
      503: error.message,
    };

    return res.status(statusCode).json({
      success: false,

      message:
        safeMessages[statusCode] ||
        "The assignment could not be completed. Please try again.",
    });
  }
};


// =====================================================
// ASSIGN LEAD TO AGENT
// =====================================================
//
// ADMIN ONLY
//
// POST
// /api/lead/:id/assign
//
// Body:
//
// {
//   "agentId": "AGENT_USER_ID"
// }
//
// Workflow:
//
// Admin
//   ↓
// Select lead
//   ↓
// Select agent
//   ↓
// Validate agent
//   ↓
// Validate same organization
//   ↓
// Assignment transaction
//      ├── Lead mutation
//      └── lead.assigned Outbox event
//   ↓
// Transaction commit
//   ↓
// Generic realtime events
//
// =====================================================

export const assignLead = async (req, res) => {
  return handleManualAssignment(req, res, {
    targetAgentId: req.body?.agentId,

    operationName: "manual-assign",

    successMessage: "Lead assigned successfully.",
  });
};


// =====================================================
// REASSIGN LEAD
// =====================================================
//
// ADMIN ONLY
//
// PATCH
// /api/lead/:id/reassign
//
// Body:
//
// {
//   "newAgentId": "AGENT_USER_ID"
// }
//
// Assignment event semantics:
//
// Existing agent A
//       ↓
// Lead reassigned
//       ↓
// New agent B
//
// A single canonical:
//
//     lead.assigned
//
// event is generated with:
//
//     previousAgentId = A
//     agentId         = B
//
// We do NOT emit an artificial:
//
//     lead.unassigned
//
// event here because reassignment is one assignment-change
// business fact. LEAD_UNASSIGNED remains reserved for a
// genuine removal of assignment.
//
// =====================================================

export const reassignLead = async (req, res) => {
  return handleManualAssignment(req, res, {
    targetAgentId: req.body?.newAgentId,

    operationName: "manual-reassign",

    successMessage: "Lead reassigned successfully.",
  });
};


// =====================================================
// GET UNASSIGNED LEADS
// =====================================================
//
// ADMIN ONLY
//
// GET
// /api/lead/unassigned
//
// Returns only leads belonging to the authenticated
// admin's organization.
//
// =====================================================

export const getUnassignedLeads = async (
  req,
  res
) => {

  try {

    console.log(
      "📋 FETCHING UNASSIGNED LEADS"
    );


    const organizationId =
      await getOrganizationId(
        req
      );


    // -------------------------------------------------
    // AUTHENTICATION SAFETY
    // -------------------------------------------------

    if (
      !req.user
    ) {

      return res.status(401).json({

        success:
          false,

        message:
          "Authentication required.",

      });
    }


    // -------------------------------------------------
    // ORGANIZATION SAFETY
    // -------------------------------------------------

    if (
      !organizationId
    ) {

      return res.status(403).json({

        success:
          false,

        message:
          "Organization not assigned.",

      });
    }


    // -------------------------------------------------
    // FETCH UNASSIGNED LEADS
    // -------------------------------------------------

    const leads =
      await Lead.find({

        organizationId,

        $or: [

          {
            assignedTo:
              null,
          },

          {
            assignedTo: {
              $exists:
                false,
            },
          },

        ],

      })
        .sort({

          createdAt:
            -1,

        })
        .populate(

          "assignedBy",

          "name email role"

        );


    // -------------------------------------------------
    // RESPONSE
    // -------------------------------------------------

    return res.status(200).json({

      success:
        true,

      count:
        leads.length,

      data:
        leads,

    });


  } catch (
    error
  ) {

    console.error(
      "❌ GET UNASSIGNED LEADS ERROR:",
      error
    );


    return res.status(500).json({

      success:
        false,

      message:
        "Failed to fetch unassigned leads.",

    });
  }
};


// =====================================================
// GET MY LEADS
// =====================================================
//
// AGENT ONLY
//
// GET
// /api/lead/my-leads
//
// IMPORTANT
// -----------------------------------------------------
// This is the main agent workflow endpoint.
//
// The agent NEVER supplies:
//
// ?agentId=
//
// Instead:
//
// req.user._id
//
// determines which leads are returned.
//
// =====================================================

export const getMyLeads = async (
  req,
  res
) => {

  try {

    console.log(
      "🤝 AGENT FETCHING ASSIGNED LEADS"
    );


    const agentId =
      getUserId(
        req
      );


    const organizationId =
      await getOrganizationId(
        req
      );


    // -------------------------------------------------
    // AUTHENTICATION SAFETY
    // -------------------------------------------------

    if (
      !req.user ||
      !agentId
    ) {

      return res.status(401).json({

        success:
          false,

        message:
          "Authentication required.",

      });
    }


    // -------------------------------------------------
    // ORGANIZATION SAFETY
    // -------------------------------------------------

    if (
      !organizationId
    ) {

      return res.status(403).json({

        success:
          false,

        message:
          "Organization not assigned.",

      });
    }


    // -------------------------------------------------
    // FETCH ONLY THIS AGENT'S LEADS
    // -------------------------------------------------
    //
    // BOTH conditions are mandatory:
    //
    // organizationId
    //
    // AND
    //
    // assignedTo = authenticated agent
    //
    // -------------------------------------------------

    const leads =
      await Lead.find({

        organizationId,

        assignedTo:
          agentId,

      })
        .sort({

          updatedAt:
            -1,

        })
        .populate(

          "assignedTo",

          "name email role"

        )
        .populate(

          "assignedBy",

          "name email role"

        );


    // -------------------------------------------------
    // RESPONSE
    // -------------------------------------------------

    return res.status(200).json({

      success:
        true,

      count:
        leads.length,

      data:
        leads,

    });


  } catch (
    error
  ) {

    console.error(
      "❌ GET MY LEADS ERROR:",
      error
    );


    return res.status(500).json({

      success:
        false,

      message:
        "Failed to fetch assigned leads.",

    });
  }
};


// =====================================================
// GET SINGLE ASSIGNED LEAD
// =====================================================
//
// AGENT ONLY
//
// GET
// /api/lead/:id
//
// An agent can only retrieve the lead if:
//
// organizationId matches
// AND
// assignedTo matches req.user
//
// =====================================================

export const getMyLeadById = async (
  req,
  res
) => {

  try {

    console.log(
      "🔎 AGENT FETCHING ASSIGNED LEAD"
    );


    const {
      id,
    } = req.params;


    const agentId =
      getUserId(
        req
      );


    const organizationId =
      await getOrganizationId(
        req
      );


    // -------------------------------------------------
    // AUTHENTICATION
    // -------------------------------------------------

    if (
      !req.user ||
      !agentId
    ) {

      return res.status(401).json({

        success:
          false,

        message:
          "Authentication required.",

      });
    }


    // -------------------------------------------------
    // ORGANIZATION
    // -------------------------------------------------

    if (
      !organizationId
    ) {

      return res.status(403).json({

        success:
          false,

        message:
          "Organization not assigned.",

      });
    }


    // -------------------------------------------------
    // VALIDATE ID
    // -------------------------------------------------

    if (
      !isValidObjectId(
        id
      )
    ) {

      return res.status(400).json({

        success:
          false,

        message:
          "Invalid lead ID.",

      });
    }


    // -------------------------------------------------
    // FETCH ONLY ASSIGNED LEAD
    // -------------------------------------------------

    const lead =
      await Lead.findOne({

        _id:
          id,

        organizationId,

        assignedTo:
          agentId,

      })
        .populate(

          "assignedTo",

          "name email role"

        )
        .populate(

          "assignedBy",

          "name email role"

        )
        .populate(

          "notes.createdBy",

          "name email role"

        );


    // -------------------------------------------------
    // NOT FOUND
    // -------------------------------------------------
    //
    // We intentionally return 404 rather than revealing
    // that the lead exists in another agent's account.
    //
    // -------------------------------------------------

    if (
      !lead
    ) {

      return res.status(404).json({

        success:
          false,

        message:
          "Lead not found.",

      });
    }


    // -------------------------------------------------
    // RESPONSE
    // -------------------------------------------------

    return res.status(200).json({

      success:
        true,

      data:
        lead,

    });


  } catch (
    error
  ) {

    console.error(
      "❌ GET MY LEAD ERROR:",
      error
    );


    return res.status(500).json({

      success:
        false,

      message:
        "Failed to fetch lead.",

    });
  }
};


// =====================================================
// DEFAULT EXPORT
// =====================================================

export default {

  assignLead,

  reassignLead,

  getUnassignedLeads,

  getMyLeads,

  getMyLeadById,

};