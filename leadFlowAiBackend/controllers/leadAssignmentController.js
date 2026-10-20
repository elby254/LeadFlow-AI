// =====================================================
//
// LEAD ASSIGNMENT CONTROLLER
//
// Purpose
// -----------------------------------------------------
// Handles ADMIN-ONLY lead assignment operations.
//
// Workflow
// -----------------------------------------------------
//
// ADMIN
//   ↓
// protect()
//   ↓
// allowRoles(["admin"])
//   ↓
// leadAssignmentController
//   ↓
// Validate organization
//   ↓
// Validate lead
//   ↓
// Validate target agent
//   ↓
// assignmentConflictResolver
//   ↓
// Resolve assignment priority
//   ↓
// Perform assignment mutation
//   ↓
// MongoDB
//   ↓
// Update workload counters
//   ↓
// Reliable Outbox Event
//   ↓
// Outbox Worker
//   ↓
// realtimeEngine
//
// AGENT
//   ↓
// protect()
//   ↓
// allowRoles(["agent"])
//   ↓
// getMyLeads()
//   ↓
// assignedTo === req.user._id
//
// Responsibilities
// -----------------------------------------------------
// ✓ Assign lead to an agent
// ✓ Reassign lead to another agent
// ✓ View unassigned leads
// ✓ Agent views own assigned leads
// ✓ Agent views one assigned lead
//
// Agents NEVER assign themselves.
//
// Viewers NEVER access assignment operations.
//
// Assignment authority
// -----------------------------------------------------
// assignedTo = authoritative agent identity
//
// Legacy field:
//   agent
//
// may be synchronized by the resolver for compatibility,
// but it is NOT used as the authoritative assignment
// identity.
//
// IMPORTANT
// -----------------------------------------------------
// This controller does NOT directly mutate assignment
// fields.
//
// The assignment resolver is the final authority.
//
// IMPORTANT EVENT ARCHITECTURE
// -----------------------------------------------------
// This controller does NOT directly call:
//
//   leadEventBus.emit()
//
// Critical assignment events are persisted through:
//
//   services/outboxIntegrationService.js
//
// The Outbox worker later publishes:
//
//   LEAD_ASSIGNED
//
// to:
//
//   events/leadEvents.js
//
// which is consumed by realtimeEngine.
//
// =====================================================

import {
  randomUUID,
} from "node:crypto";

import mongoose from "mongoose";

import Lead from "../models/lead.js";
import User from "../models/user.js";

import {
  resolveAssignmentConflict,
} from "../services/assignmentConflictResolver.js";

import {
  resolveFromRequest,
} from "../services/organizationResolverService.js";


// =====================================================
// HELPER: AUTHENTICATED USER ID
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
// HELPER: ORGANIZATION ID
// =====================================================
//
// Organization must come from the centralized
// organization resolver.
//
// Never trust:
//
//   req.body.organizationId
//   req.query.organizationId
//   req.params.organizationId
//
// =====================================================

const getOrganizationId =
  async (
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
// HELPER: OBJECT ID VALIDATION
// =====================================================

const isValidObjectId = (
  value
) => {
  return (
    Boolean(value) &&
    mongoose.Types.ObjectId.isValid(
      value
    )
  );
};

// =====================================================
// HELPER: REQUEST / OPERATION ID
// =====================================================
//
// Used for Outbox deduplication.
//
// Priority:
//
// 1. req.id
// 2. req.requestId
// 3. x-request-id
// 4. x-correlation-id
// 5. generated UUID
//
// This keeps repeated requests identifiable by the Outbox
// reliability layer.
//
// =====================================================

const getOperationId = (
  req,
  operation
) => {
  const requestId =
    req.id ||
    req.requestId ||
    req.headers?.[
      "x-request-id"
    ] ||
    req.headers?.[
      "x-correlation-id"
    ] ||
    randomUUID();

  return [
    "lead-assignment",
    operation,
    String(
      requestId
    ),
  ].join(":");
};

// =====================================================
// HELPER: UPDATE WORKLOAD
// =====================================================
//
// Workload counters are changed ONLY after the resolver
// has successfully returned an accepted assignment.
//
// IMPORTANT
// -----------------------------------------------------
// Organization is included in both user queries so a
// workload counter cannot accidentally be modified on
// a user from another organization.
//
// =====================================================

const updateAssignmentWorkload =
  async (
    previousAgentId,
    newAgentId,
    organizationId
  ) => {

    // ---------------------------------------------------
    // No new assignment
    // ---------------------------------------------------

    if (
      !newAgentId
    ) {
      return;
    }

    // ---------------------------------------------------
    // Same agent
    // ---------------------------------------------------
    //
    // No workload change.
    //
    // ---------------------------------------------------

    if (
      previousAgentId &&
      String(
        previousAgentId
      ) ===
        String(
          newAgentId
        )
    ) {
      return;
    }

    // ---------------------------------------------------
    // Decrease previous agent workload
    // ---------------------------------------------------

    if (
      previousAgentId
    ) {
      const previousAgent =
        await User.findOneAndUpdate(
          {
            _id:
              previousAgentId,

            organizationId,

            role:
              "agent",
          },

          {
            $inc: {
              assignedLeadCount:
                -1,
            },
          }
        );

      if (
        !previousAgent
      ) {
        console.warn(
          "⚠️ Previous agent workload could not be updated:",
          {
            previousAgentId:
              String(
                previousAgentId
              ),

            organizationId:
              String(
                organizationId
              ),
          }
        );
      }
    }

    // ---------------------------------------------------
    // Increase new agent workload
    // ---------------------------------------------------

    const newAgent =
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
        }
      );

    if (
      !newAgent
    ) {
      console.warn(
        "⚠️ New agent workload could not be updated:",
        {
          newAgentId:
            String(
              newAgentId
            ),

          organizationId:
            String(
              organizationId
            ),
        }
      );
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
// =====================================================

export const assignLead =
  async (
    req,
    res
  ) => {

    try {
      console.log(
        "👤 ADMIN ASSIGN LEAD REQUEST"
      );

      const {
        id,
      } =
        req.params;

      const {
        agentId,
      } =
        req.body ||
        {};

      const adminId =
        getUserId(
          req
        );

      const organizationId =
        await getOrganizationId(
          req
        );

      // =================================================
      // AUTHENTICATION
      // =================================================

      if (
        !req.user ||
        !adminId
      ) {
        return res
          .status(401)
          .json({
            success:
              false,

            message:
              "Authentication required.",
          });
      }

      // =================================================
      // ORGANIZATION
      // =================================================

      if (
        !organizationId
      ) {
        return res
          .status(403)
          .json({
            success:
              false,

            message:
              "Organization not assigned.",
          });
      }

      // =================================================
      // LEAD ID
      // =================================================

      if (
        !isValidObjectId(
          id
        )
      ) {
        return res
          .status(400)
          .json({
            success:
              false,

            message:
              "Invalid lead ID.",
          });
      }

      // =================================================
      // AGENT ID
      // =================================================

      if (
        !isValidObjectId(
          agentId
        )
      ) {
        return res
          .status(400)
          .json({
            success:
              false,

            message:
              "A valid agent ID is required.",
          });
      }

      // =================================================
      // FIND LEAD
      // =================================================

      const lead =
        await Lead.findOne({
          _id:
            id,

          organizationId,
        });

      if (
        !lead
      ) {
        return res
          .status(404)
          .json({
            success:
              false,

            message:
              "Lead not found.",
          });
      }

      // =================================================
      // FIND TARGET AGENT
      // =================================================

      const agent =
        await User.findOne({
          _id:
            agentId,

          role:
            "agent",

          isActive:
            true,

          organizationId,
        })
          .select(
            "_id name email role organizationId isActive assignedLeadCount"
          );

      if (
        !agent
      ) {
        return res
          .status(400)
          .json({
            success:
              false,

            message:
              "The selected user is not an active agent in this organization.",
          });
      }

      // =================================================
      // STORE PREVIOUS ASSIGNMENT
      // =================================================

      const previousAgentId =
        lead.assignedTo ||
        null;

      // =================================================
      // PREVENT UNNECESSARY REASSIGNMENT
      // =================================================

      if (
        previousAgentId &&
        String(
          previousAgentId
        ) ===
          String(
            agent._id
          )
      ) {
        return res
          .status(200)
          .json({
            success:
              true,

            message:
              "Lead is already assigned to this agent.",

            data:
              lead,

            assignedAgent: {
              _id:
                agent._id,

              name:
                agent.name,

              email:
                agent.email,

              role:
                agent.role,
            },
          });
      }

      // =================================================
      // OPERATION ID
      // =================================================

      const operationId =
        getOperationId(
          req,
          "assign"
        );

      // =================================================
      // DELEGATE ASSIGNMENT TO RESOLVER
      // =================================================
      //
      // IMPORTANT:
      //
      // Do NOT write:
      //
      // lead.assignedTo = agent._id
      //
      // here.
      //
      // The resolver owns the mutation.
      //
      // =================================================

      const resolution =
        await resolveAssignmentConflict(
          lead._id,

          {
            assignedTo:
              agent._id,

            assignedBy:
              adminId,

            assignedSource:
              "manual",

            assignedAt:
              new Date(),
          },

          organizationId
        );

      // =================================================
      // RESOLUTION FAILURE
      // =================================================

      if (
        !resolution ||
        !resolution.accepted
      ) {
        console.warn(
          "🛑 LEAD ASSIGNMENT REJECTED BY RESOLVER:",
          {
            leadId:
              String(
                lead._id
              ),

            reason:
              resolution?.reason ||
              "unknown",

            organizationId:
              String(
                organizationId
              ),
          }
        );

        return res
          .status(400)
          .json({
            success:
              false,

            message:
              "Lead assignment could not be completed.",

            reason:
              resolution?.reason ||
              "assignment_rejected",
          });
      }

      // =================================================
      // RESOLVER RESULT
      // =================================================

      const resolvedLead =
        resolution.lead;

      if (
        !resolvedLead
      ) {
        console.error(
          "❌ Resolver accepted assignment but returned no lead."
        );

        return res
          .status(500)
          .json({
            success:
              false,

            message:
              "Assignment resolution returned an invalid result.",
          });
      }

      // =================================================
      // DETERMINE WHETHER ASSIGNMENT CHANGED
      // =================================================

      const newAgentId =
        resolvedLead.assignedTo ||
        null;

      const assignmentChanged =
        Boolean(
          newAgentId &&
          (
            !previousAgentId ||
            String(
              previousAgentId
            ) !==
              String(
                newAgentId
              )
          )
        );

      // =================================================
      // UPDATE WORKLOAD
      // =================================================

      if (
        assignmentChanged
      ) {
        await updateAssignmentWorkload(
          previousAgentId,

          newAgentId,

          organizationId
        );
      }

      // =================================================
      // DEBUG
      // =================================================

      console.log(
        "✅ LEAD ASSIGNMENT RESOLVED:",
        {
          leadId:
            String(
              resolvedLead._id
            ),

          assignedTo:
            resolvedLead.assignedTo
              ? String(
                  resolvedLead.assignedTo
                )
              : null,

          assignedBy:
            resolvedLead.assignedBy
              ? String(
                  resolvedLead.assignedBy
                )
              : null,

          assignedSource:
            resolvedLead.assignedSource,

          organizationId:
            String(
              organizationId
            ),

          assignmentChanged,

          operationId,
        }
      );

      // =================================================
      // RESPONSE
      // =================================================

      return res
        .status(200)
        .json({
          success:
            true,

          message:
            assignmentChanged
              ? "Lead assigned successfully."
              : "Lead assignment was not changed.",

          data:
            resolvedLead,

          assignedAgent: {
            _id:
              agent._id,

            name:
              agent.name,

            email:
              agent.email,

            role:
              agent.role,
          },
        });

    } catch (
      error
    ) {

      console.error(
        "❌ ASSIGN LEAD ERROR:",
        error
      );

      return res
        .status(500)
        .json({
          success:
            false,

          message:
            "Failed to assign lead.",
        });
    }
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
// =====================================================

export const reassignLead =
  async (
    req,
    res
  ) => {

    try {
      console.log(
        "🔄 ADMIN REASSIGN LEAD REQUEST"
      );

      const {
        id,
      } =
        req.params;

      const {
        newAgentId,
      } =
        req.body ||
        {};

      const adminId =
        getUserId(
          req
        );

      const organizationId =
        await getOrganizationId(
          req
        );

      // =================================================
      // AUTHENTICATION
      // =================================================

      if (
        !req.user ||
        !adminId
      ) {
        return res
          .status(401)
          .json({
            success:
              false,

            message:
              "Authentication required.",
          });
      }

      // =================================================
      // ORGANIZATION
      // =================================================

      if (
        !organizationId
      ) {
        return res
          .status(403)
          .json({
            success:
              false,

            message:
              "Organization not assigned.",
          });
      }

      // =================================================
      // LEAD ID
      // =================================================

      if (
        !isValidObjectId(
          id
        )
      ) {
        return res
          .status(400)
          .json({
            success:
              false,

            message:
              "Invalid lead ID.",
          });
      }

      // =================================================
      // NEW AGENT ID
      // =================================================

      if (
        !isValidObjectId(
          newAgentId
        )
      ) {
        return res
          .status(400)
          .json({
            success:
              false,

            message:
              "A valid new agent ID is required.",
          });
      }

      // =================================================
      // FIND LEAD
      // =================================================

      const lead =
        await Lead.findOne({
          _id:
            id,

          organizationId,
        });

      if (
        !lead
      ) {
        return res
          .status(404)
          .json({
            success:
              false,

            message:
              "Lead not found.",
          });
      }

      // =================================================
      // FIND NEW AGENT
      // =================================================

      const newAgent =
        await User.findOne({
          _id:
            newAgentId,

          role:
            "agent",

          isActive:
            true,

          organizationId,
        })
          .select(
            "_id name email role organizationId isActive assignedLeadCount"
          );

      if (
        !newAgent
      ) {
        return res
          .status(400)
          .json({
            success:
              false,

            message:
              "The selected user is not an active agent in this organization.",
          });
      }

      // =================================================
      // PREVIOUS AGENT
      // =================================================

      const previousAgentId =
        lead.assignedTo ||
        null;

      // =================================================
      // SAME AGENT
      // =================================================

      if (
        previousAgentId &&
        String(
          previousAgentId
        ) ===
          String(
            newAgent._id
          )
      ) {
        return res
          .status(200)
          .json({
            success:
              true,

            message:
              "Lead is already assigned to this agent.",

            data:
              lead,

            assignedAgent: {
              _id:
                newAgent._id,

              name:
                newAgent.name,

              email:
                newAgent.email,

              role:
                newAgent.role,
            },
          });
      }

      // =================================================
      // OPERATION ID
      // =================================================

      const operationId =
        getOperationId(
          req,
          "reassign"
        );

      // =================================================
      // DELEGATE REASSIGNMENT TO RESOLVER
      // =================================================
      //
      // Manual reassignment has the highest priority.
      //
      // The resolver remains the final mutation authority.
      //
      // =================================================

      const resolution =
        await resolveAssignmentConflict(
          lead._id,

          {
            assignedTo:
              newAgent._id,

            assignedBy:
              adminId,

            assignedSource:
              "manual",

            assignedAt:
              new Date(),
          },

          organizationId
        );

      // =================================================
      // RESOLUTION FAILURE
      // =================================================

      if (
        !resolution ||
        !resolution.accepted
      ) {

        console.warn(
          "🛑 LEAD REASSIGNMENT REJECTED BY RESOLVER:",
          {
            leadId:
              String(
                lead._id
              ),

            reason:
              resolution?.reason ||
              "unknown",

            organizationId:
              String(
                organizationId
              ),
          }
        );

        return res
          .status(400)
          .json({
            success:
              false,

            message:
              "Lead reassignment could not be completed.",

            reason:
              resolution?.reason ||
              "assignment_rejected",
          });
      }

      // =================================================
      // RESOLVER RESULT
      // =================================================

      const resolvedLead =
        resolution.lead;

      if (
        !resolvedLead
      ) {

        console.error(
          "❌ Resolver accepted reassignment but returned no lead."
        );

        return res
          .status(500)
          .json({
            success:
              false,

            message:
              "Assignment resolution returned an invalid result.",
          });
      }

      // =================================================
      // DETERMINE NEW ASSIGNMENT
      // =================================================

      const resolvedAgentId =
        resolvedLead.assignedTo ||
        null;

      const assignmentChanged =
        Boolean(
          resolvedAgentId &&
          (
            !previousAgentId ||
            String(
              previousAgentId
            ) !==
              String(
                resolvedAgentId
              )
          )
        );

      // =================================================
      // UPDATE WORKLOAD COUNTERS
      // =================================================

      if (
        assignmentChanged
      ) {

        await updateAssignmentWorkload(
          previousAgentId,

          resolvedAgentId,

          organizationId
        );
      }

      // =================================================
      // RELIABLE ASSIGNMENT EVENT
      // =================================================
      //
      // Reassignment is represented by another canonical
      // LEAD_ASSIGNED event with previousAgentId populated.
      //
      // We deliberately DO NOT create an artificial:
      //
      //   LEAD_UNASSIGNED
      //
      // event for reassignment.
      //
      // =================================================

      if (
        assignmentChanged
      )

      // =================================================
      // DEBUG
      // =================================================

      console.log(
        "🔁 LEAD REASSIGNMENT RESOLVED:",
        {
          leadId:
            String(
              resolvedLead._id
            ),

          previousAgentId:
            previousAgentId
              ? String(
                  previousAgentId
                )
              : null,

          newAgentId:
            resolvedAgentId
              ? String(
                  resolvedAgentId
                )
              : null,

          assignedBy:
            String(
              adminId
            ),

          assignedSource:
            resolvedLead.assignedSource,

          organizationId:
            String(
              organizationId
            ),

          assignmentChanged,

          operationId,
        }
      );

      // =================================================
      // RESPONSE
      // =================================================

      return res
        .status(200)
        .json({
          success:
            true,

          message:
            assignmentChanged
              ? "Lead reassigned successfully."
              : "Lead assignment was not changed.",

          data:
            resolvedLead,

          assignedAgent: {
            _id:
              newAgent._id,

            name:
              newAgent.name,

            email:
              newAgent.email,

            role:
              newAgent.role,
          },
        });

    } catch (
      error
    ) {

      console.error(
        "❌ REASSIGN LEAD ERROR:",
        error
      );

      return res
        .status(500)
        .json({
          success:
            false,

          message:
            "Failed to reassign lead.",
        });
    }
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
// =====================================================

export const getUnassignedLeads =
  async (
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

      // =================================================
      // AUTHENTICATION
      // =================================================

      if (
        !req.user
      ) {
        return res
          .status(401)
          .json({
            success:
              false,

            message:
              "Authentication required.",
          });
      }

      // =================================================
      // ORGANIZATION
      // =================================================

      if (
        !organizationId
      ) {
        return res
          .status(403)
          .json({
            success:
              false,

            message:
              "Organization not assigned.",
          });
      }

      // =================================================
      // QUERY
      // =================================================

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

      // =================================================
      // RESPONSE
      // =================================================

      return res
        .status(200)
        .json({
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

      return res
        .status(500)
        .json({
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
// SECURITY
// -----------------------------------------------------
// Agent ID comes ONLY from authentication.
//
// Never:
//
//   req.body.agentId
//   req.query.agentId
//   req.params.agentId
//
// =====================================================

export const getMyLeads =
  async (
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

      // =================================================
      // AUTHENTICATION
      // =================================================

      if (
        !req.user ||
        !agentId
      ) {
        return res
          .status(401)
          .json({
            success:
              false,

            message:
              "Authentication required.",
          });
      }

      // =================================================
      // ORGANIZATION
      // =================================================

      if (
        !organizationId
      ) {
        return res
          .status(403)
          .json({
            success:
              false,

            message:
              "Organization not assigned.",
          });
      }

      // =================================================
      // AUTHORITATIVE QUERY
      // =================================================
      //
      // assignedTo is the ONLY assignment identity.
      //
      // =================================================

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

      console.log(
        "📦 Agent leads found:",
        leads.length
      );

      // =================================================
      // RESPONSE
      // =================================================

      return res
        .status(200)
        .json({
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

      return res
        .status(500)
        .json({
          success:
            false,

          message:
            "Failed to fetch assigned leads.",
        });
    }
  };

// =====================================================
// GET MY LEAD BY ID
// =====================================================
//
// AGENT ONLY
//
// GET
// /api/lead/my-leads/:id
//
// =====================================================

export const getMyLeadById =
  async (
    req,
    res
  ) => {

    try {
      console.log(
        "🔎 AGENT FETCHING ASSIGNED LEAD"
      );

      const {
        id,
      } =
        req.params;

      const agentId =
        getUserId(
          req
        );

      const organizationId =
        await getOrganizationId(
          req
        );

      // =================================================
      // AUTHENTICATION
      // =================================================

      if (
        !req.user ||
        !agentId
      ) {
        return res
          .status(401)
          .json({
            success:
              false,

            message:
              "Authentication required.",
          });
      }

      // =================================================
      // ORGANIZATION
      // =================================================

      if (
        !organizationId
      ) {
        return res
          .status(403)
          .json({
            success:
              false,

            message:
              "Organization not assigned.",
          });
      }

      // =================================================
      // VALIDATE ID
      // =================================================

      if (
        !isValidObjectId(
          id
        )
      ) {
        return res
          .status(400)
          .json({
            success:
              false,

            message:
              "Invalid lead ID.",
          });
      }

      // =================================================
      // AUTHORITATIVE AGENT QUERY
      // =================================================
      //
      // Both conditions are mandatory:
      //
      // organizationId
      // assignedTo
      //
      // =====================================================

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

      // =================================================
      // NOT FOUND
      // =================================================
      //
      // Do not reveal whether the lead exists under
      // another agent.
      //
      // =================================================

      if (
        !lead
      ) {
        return res
          .status(404)
          .json({
            success:
              false,

            message:
              "Lead not found.",
          });
      }

      // =================================================
      // RESPONSE
      // =================================================

      return res
        .status(200)
        .json({
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

      return res
        .status(500)
        .json({
          success:
            false,

          message:
            "Failed to fetch lead.",
        });
    }
  };