// =====================================================
//
// AGENT CONTROLLER
//
// Purpose
// -----------------------------------------------------
// Handles AGENT-SIDE lead operations in LeadFlow AI.
//
// Responsibilities
// -----------------------------------------------------
//
// ✓ View/update status of assigned leads
// ✓ Add notes to assigned leads
// ✓ Schedule/update viewing information
// ✓ Get authenticated agent performance
// ✓ Emit lead pipeline events
//
// IMPORTANT
// -----------------------------------------------------
// Lead assignment is NOT handled here.
//
// ADMIN assignment workflow:
//
//   leadAssignmentController
//              ↓
//   resolveAssignmentConflict()
//              ↓
//   lead.assignedTo = agent._id
//
// Agent workflow:
//
//   agentController
//              ↓
//   assignedTo === authenticated agent
//
// Therefore:
//
// ❌ Agents cannot assign leads
// ❌ Agents cannot reassign leads
// ❌ Agents cannot choose agentId
// ❌ Agents cannot choose organizationId
//
// Security:
//
//   organizationId === authenticated organization
//   assignedTo     === authenticated agent
//
// =====================================================

import mongoose from "mongoose";

import Lead from "../models/lead.js";
import Conversation from "../models/conversation.js";
import Message from "../models/message.js";

import leadEventBus, {
  LEAD_EVENTS,
} from "../events/leadEvents.js";

// =====================================================
// HELPERS
// =====================================================

/**
 * Get authenticated user/agent ID.
 *
 * Authentication middleware establishes req.agentId
 * from the authenticated database user.
 *
 * req.user._id is retained as a safe fallback.
 */
const getAuthenticatedAgentId = (req) => {
  return (
    req.agentId ||
    req.user?._id ||
    req.user?.id ||
    null
  );
};

/**
 * Get authenticated organization ID.
 *
 * Organization MUST come from authenticated context.
 */
const getAuthenticatedOrganizationId = (req) => {
  return (
    req.organizationId ||
    req.user?.organizationId ||
    null
  );
};

/**
 * Validate MongoDB ObjectId.
 */
const isValidObjectId = (value) => {
  return Boolean(
    value &&
      mongoose.Types.ObjectId.isValid(value)
  );
};

/**
 * Safely convert a value to Number.
 */
const toNumber = (
  value,
  fallback = 0
) => {
  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : fallback;
};

/**
 * Compare ObjectId/string values safely.
 */
const sameId = (
  first,
  second
) => {
  if (
    !first ||
    !second
  ) {
    return false;
  }

  return (
    String(first) ===
    String(second)
  );
};

/**
 * Safely parse a date.
 */
const parseDate = (
  value
) => {
  if (!value) {
    return null;
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return null;
  }

  return date;
};

/**
 * Emit standard lead events.
 *
 * Events are emitted only after the database
 * operation has successfully completed.
 */
const emitLeadUpdate = (
  lead
) => {
  try {
    leadEventBus.emit(
      LEAD_EVENTS.LEAD_UPDATED,
      lead
    );

    leadEventBus.emit(
      LEAD_EVENTS.PIPELINE_UPDATE,
      lead
    );
  } catch (eventError) {
    console.error(
      "[AgentController] LEAD EVENT EMISSION ERROR:",
      eventError
    );
  }
};

// =====================================================
// UPDATE LEAD STATUS
// =====================================================
//
// AGENT ONLY
//
// POST
// /api/agent/status
//
// Allowed statuses:
//
//   new
//   contacted
//   qualified
//   viewing
//   negotiation
//   won
//   lost
//
// =====================================================

export const updateLeadStatus = async (
  req,
  res
) => {
  try {
    console.log(
      "[AgentController] UPDATE LEAD STATUS REQUEST"
    );

    // -------------------------------------------------
    // LEAD ID
    // -------------------------------------------------

    const leadId =
      req.body?.lead?._id ||
      req.body?.leadId ||
      req.params?.id;

    // -------------------------------------------------
    // STATUS
    // -------------------------------------------------

    const {
      status,
    } = req.body || {};

    // -------------------------------------------------
    // AUTHENTICATED CONTEXT
    // -------------------------------------------------

    const agentId =
      getAuthenticatedAgentId(req);

    const organizationId =
      getAuthenticatedOrganizationId(req);

    // =================================================
    // AUTHENTICATION
    // =================================================

    if (
      !req.user ||
      !agentId
    ) {
      return res.status(401).json({
        success: false,
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
      return res.status(403).json({
        success: false,
        message:
          "Organization not assigned.",
      });
    }

    // =================================================
    // LEAD ID
    // =================================================

    if (
      !isValidObjectId(
        leadId
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "A valid lead ID is required.",
      });
    }

    // =================================================
    // STATUS
    // =================================================

    if (
      !status ||
      !String(status).trim()
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Lead status is required.",
      });
    }

    const normalizedStatus =
      String(status)
        .trim()
        .toLowerCase();

    // =================================================
    // VALID STATUS
    // =================================================

    const allowedStatuses = [
      "new",
      "contacted",
      "qualified",
      "viewing",
      "negotiation",
      "won",
      "lost",
    ];

    if (
      !allowedStatuses.includes(
        normalizedStatus
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid lead status.",
        allowedStatuses,
      });
    }

    // =================================================
    // AUTHORITATIVE AGENT QUERY
    // =================================================

    const lead =
      await Lead.findOne({
        _id: leadId,
        organizationId,
        assignedTo: agentId,
      });

    if (!lead) {
      return res.status(404).json({
        success: false,
        message:
          "Lead not found.",
      });
    }

    // =================================================
    // UPDATE STATUS
    // =================================================

    lead.status =
      normalizedStatus;

    await lead.save();

    console.log(
      "[AgentController] Lead status updated:",
      {
        leadId:
          String(
            lead._id
          ),

        status:
          lead.status,

        agentId:
          String(
            agentId
          ),

        organizationId:
          String(
            organizationId
          ),
      }
    );

    // =================================================
    // EVENTS
    // =================================================

    emitLeadUpdate(
      lead
    );

    // =================================================
    // RESPONSE
    // =================================================

    return res.status(200).json({
      success: true,
      message:
        "Lead status updated successfully.",
      data:
        lead,
    });

  } catch (error) {
    console.error(
      "[AgentController] UPDATE LEAD STATUS ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to update lead status.",
    });
  }
};

// =====================================================
// ADD LEAD NOTE
// =====================================================
//
// AGENT ONLY
//
// POST
// /api/agent/note
//
// =====================================================

export const addLeadNote = async (
  req,
  res
) => {
  try {
    console.log(
      "[AgentController] ADD LEAD NOTE REQUEST"
    );

    const {
      leadId,
      text,
    } = req.body || {};

    const agentId =
      getAuthenticatedAgentId(req);

    const organizationId =
      getAuthenticatedOrganizationId(req);

    // =================================================
    // AUTHENTICATION
    // =================================================

    if (
      !req.user ||
      !agentId
    ) {
      return res.status(401).json({
        success: false,
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
      return res.status(403).json({
        success: false,
        message:
          "Organization not assigned.",
      });
    }

    // =================================================
    // LEAD ID
    // =================================================

    if (
      !isValidObjectId(
        leadId
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "A valid lead ID is required.",
      });
    }

    // =================================================
    // NOTE
    // =================================================

    if (
      !text ||
      !String(text).trim()
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Note text is required.",
      });
    }

    // =================================================
    // FIND ONLY AGENT'S LEAD
    // =================================================

    const lead =
      await Lead.findOne({
        _id: leadId,
        organizationId,
        assignedTo: agentId,
      });

    if (!lead) {
      return res.status(404).json({
        success: false,
        message:
          "Lead not found.",
      });
    }

    // =================================================
    // ADD NOTE
    // =================================================

    if (
      !Array.isArray(
        lead.notes
      )
    ) {
      lead.notes = [];
    }

    const trimmedText =
      String(text).trim();

    lead.notes.push({
      text:
        trimmedText,

      createdAt:
        new Date(),

      createdBy:
        agentId,
    });

    // =================================================
    // LEGACY COMPATIBILITY
    // =================================================

    lead.noteText =
      trimmedText;

    await lead.save();

    console.log(
      "[AgentController] Note added:",
      {
        leadId:
          String(
            lead._id
          ),

        agentId:
          String(
            agentId
          ),

        organizationId:
          String(
            organizationId
          ),
      }
    );

    // =================================================
    // EVENTS
    // =================================================

    emitLeadUpdate(
      lead
    );

    // =================================================
    // RESPONSE
    // =================================================

    return res.status(200).json({
      success: true,
      message:
        "Lead note added successfully.",
      data:
        lead,
    });

  } catch (error) {
    console.error(
      "[AgentController] ADD LEAD NOTE ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to add lead note.",
    });
  }
};

// =====================================================
// SCHEDULE VIEWING
// =====================================================
//
// AGENT ONLY
//
// POST
// /api/agent/schedule-viewing
//
// =====================================================

export const scheduleViewing = async (
  req,
  res
) => {
  try {
    console.log(
      "[AgentController] SCHEDULE VIEWING REQUEST"
    );

    const {
      leadId,
      date,
      viewingStatus,
    } = req.body || {};

    const agentId =
      getAuthenticatedAgentId(req);

    const organizationId =
      getAuthenticatedOrganizationId(req);

    // =================================================
    // AUTHENTICATION
    // =================================================

    if (
      !req.user ||
      !agentId
    ) {
      return res.status(401).json({
        success: false,
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
      return res.status(403).json({
        success: false,
        message:
          "Organization not assigned.",
      });
    }

    // =================================================
    // LEAD ID
    // =================================================

    if (
      !isValidObjectId(
        leadId
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "A valid lead ID is required.",
      });
    }

    // =================================================
    // DATE
    // =================================================

    if (!date) {
      return res.status(400).json({
        success: false,
        message:
          "Viewing date is required.",
      });
    }

    const parsedDate =
      parseDate(date);

    if (!parsedDate) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid viewing date.",
      });
    }

    // =================================================
    // FIND ONLY AGENT'S LEAD
    // =================================================

    const lead =
      await Lead.findOne({
        _id: leadId,
        organizationId,
        assignedTo: agentId,
      });

    if (!lead) {
      return res.status(404).json({
        success: false,
        message:
          "Lead not found.",
      });
    }

    // =================================================
    // VALID VIEWING STATUS
    // =================================================

    const allowedViewingStatuses = [
      "none",
      "requested",
      "approved",
      "scheduled",
      "rescheduled",
      "cancelled",
      "completed",
    ];

    const normalizedViewingStatus =
      viewingStatus
        ? String(
            viewingStatus
          )
            .trim()
            .toLowerCase()
        : "scheduled";

    if (
      !allowedViewingStatuses.includes(
        normalizedViewingStatus
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid viewing status.",
        allowedViewingStatuses,
      });
    }

    // =================================================
    // UPDATE VIEWING
    // =================================================

    lead.viewingStatus =
      normalizedViewingStatus;

    lead.nextViewingDate =
      parsedDate;

    // =================================================
    // VIEWING REQUEST COUNT
    // =================================================
    //
    // IMPORTANT:
    // This is existing persisted viewing activity.
    //
    // We increment only when a viewing is actually
    // requested/scheduled/rescheduled through this
    // authenticated-agent endpoint.
    //
    // =================================================

    if (
      normalizedViewingStatus ===
        "requested" ||
      normalizedViewingStatus ===
        "scheduled" ||
      normalizedViewingStatus ===
        "rescheduled"
    ) {
      lead.viewingRequestCount =
        toNumber(
          lead.viewingRequestCount,
          0
        ) + 1;
    }

    // =================================================
    // ALIGN LEAD STATUS
    // =================================================

    if (
      normalizedViewingStatus ===
        "scheduled" ||
      normalizedViewingStatus ===
        "requested" ||
      normalizedViewingStatus ===
        "rescheduled"
    ) {
      lead.status =
        "viewing";
    }

    // =================================================
    // COMPLETED VIEWING
    // =================================================

    if (
      normalizedViewingStatus ===
      "completed"
    ) {
      lead.viewingCompleted =
        true;
    }

    // =================================================
    // CANCELLED VIEWING
    // =================================================

    if (
      normalizedViewingStatus ===
      "cancelled"
    ) {
      // Do not erase the historical
      // viewingRequestCount.
      //
      // The request happened; cancellation
      // is simply its resulting state.
    }

    await lead.save();

    console.log(
      "[AgentController] Viewing updated:",
      {
        leadId:
          String(
            lead._id
          ),

        viewingStatus:
          lead.viewingStatus,

        nextViewingDate:
          lead.nextViewingDate,

        status:
          lead.status,

        viewingRequestCount:
          lead.viewingRequestCount,

        viewingCompleted:
          lead.viewingCompleted,

        agentId:
          String(
            agentId
          ),

        organizationId:
          String(
            organizationId
          ),
      }
    );

    // =================================================
    // EVENTS
    // =================================================

    emitLeadUpdate(
      lead
    );

    // =================================================
    // RESPONSE
    // =================================================

    return res.status(200).json({
      success: true,
      message:
        "Viewing scheduled successfully.",
      data:
        lead,
    });

  } catch (error) {
    console.error(
      "[AgentController] SCHEDULE VIEWING ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to update viewing.",
    });
  }
};

// =====================================================
// GET AGENT PERFORMANCE
// =====================================================
//
// AGENT ONLY
//
// GET
// /api/agent/performance
//
// IMPORTANT
// -----------------------------------------------------
// This endpoint NEVER accepts:
//
//   agentId
//   organizationId
//
// from the client.
//
// It uses:
//
//   req.agentId
//   req.organizationId
//
// established by authentication.
//
// =====================================================

export const getAgentPerformance = async (
  req,
  res
) => {
  try {
    console.log(
      "[AgentPerformance] REQUEST RECEIVED"
    );

    // =================================================
    // AUTHENTICATED AGENT
    // =================================================

    const authenticatedAgentId =
      getAuthenticatedAgentId(req);

    const organizationId =
      getAuthenticatedOrganizationId(req);

    const authenticatedAgentName =
      req.user?.name ||
      req.user?.email ||
      "Agent";

    // =================================================
    // DEBUG AUTH CONTEXT
    // =================================================

    console.log(
      "[AgentPerformance] Authenticated context:",
      {
        agentId:
          authenticatedAgentId
            ? String(
                authenticatedAgentId
              )
            : null,

        agentName:
          authenticatedAgentName,

        organizationId:
          organizationId
            ? String(
                organizationId
              )
            : null,

        role:
          req.user?.role ||
          null,
      }
    );

    // =================================================
    // AUTHENTICATION
    // =================================================

    if (
      !req.user ||
      !authenticatedAgentId
    ) {
      console.error(
        "[AgentPerformance] Missing authenticated agent ID."
      );

      return res.status(401).json({
        success: false,
        message:
          "Authenticated agent could not be identified.",
      });
    }

    // =================================================
    // ORGANIZATION
    // =================================================

    if (
      !organizationId
    ) {
      console.error(
        "[AgentPerformance] Missing authenticated organization ID."
      );

      return res.status(403).json({
        success: false,
        message:
          "Organization not assigned.",
      });
    }

    // =================================================
    // AUTHORITATIVE QUERY
    // =================================================
    //
    // assignedTo is the authoritative assignment field.
    //
    // =================================================

    const agentQuery = {
      organizationId,
      assignedTo:
        authenticatedAgentId,
    };

    console.log(
      "[AgentPerformance] AUTHORITATIVE QUERY:",
      {
        organizationId:
          String(
            organizationId
          ),

        assignedTo:
          String(
            authenticatedAgentId
          ),
      }
    );

    // =================================================
    // COUNT ASSIGNED LEADS
    // =================================================

    const assignedLeadCount =
      await Lead.countDocuments(
        agentQuery
      );

    console.log(
      "[AgentPerformance] ASSIGNED LEAD COUNT:",
      assignedLeadCount
    );

    // =================================================
    // FIND AGENT LEADS
    // =================================================

    const leads =
      await Lead.find(
        agentQuery
      )
        .sort({
          updatedAt: -1,
        })
        .lean();

    console.log(
      "[AgentPerformance] Agent leads found:",
      leads.length
    );

    // =================================================
    // DEBUG ASSIGNMENTS
    // =================================================

    console.log(
      "[AgentPerformance] Assigned lead IDs:",
      leads.map(
        (lead) => ({
          id:
            lead?._id
              ? String(
                  lead._id
                )
              : null,

          assignedTo:
            lead?.assignedTo
              ? String(
                  lead.assignedTo
                )
              : null,

          organizationId:
            lead?.organizationId
              ? String(
                  lead.organizationId
                )
              : null,

          status:
            lead?.status ||
            null,
        })
      )
    );

    // =================================================
    // STATUS HELPER
    // =================================================

    const getStatus = (
      lead
    ) => {
      return String(
        lead?.status || ""
      )
        .trim()
        .toLowerCase();
    };

    // =================================================
    // BASIC LEADS
    // =================================================

    const totalLeads =
      assignedLeadCount;

    // =================================================
    // QUALIFIED LEADS
    // =================================================

    const qualifiedLeads =
      leads.filter(
        (lead) =>
          getStatus(lead) ===
          "qualified"
      ).length;

    // =================================================
    // CONVERTED / WON
    // =================================================

    const convertedLeads =
      leads.filter(
        (lead) =>
          getStatus(lead) ===
          "won"
      ).length;

    // =================================================
    // LOST
    // =================================================

    const lostLeads =
      leads.filter(
        (lead) =>
          getStatus(lead) ===
          "lost"
      ).length;

    // =====================================================
    // FOLLOW-UP METRICS
    // =====================================================
    //
    // IMPORTANT
    // -----------------------------------------------------
    // Current Lead schema contains follow-up STATE:
    //
    //   nextFollowUpDate
    //   followUpStatus
    //   followUpOutcome
    //   followUpUpdatedAt
    //
    // There is NO followUpHistory[].
    //
    // Therefore we deliberately do NOT pretend that
    // followUpUpdatedAt represents an individual follow-up
    // event.
    //
    // We count only persisted follow-up state.
    //
    // =====================================================

    let totalFollowUps = 0;

    let completedFollowUps = 0;

    let pendingFollowUps = 0;

    let overdueFollowUps = 0;

    const today =
      new Date();

    today.setHours(
      0,
      0,
      0,
      0
    );

    leads.forEach(
      (lead) => {
        const followUpDate =
          lead?.nextFollowUpDate ||
          lead?.followUpDate;

        const followUpStatus =
          String(
            lead?.followUpStatus ||
            ""
          )
            .trim()
            .toLowerCase();

        // -------------------------------------------------
        // No persisted follow-up state
        // -------------------------------------------------

        if (
          !followUpDate &&
          followUpStatus !==
            "completed"
        ) {
          return;
        }

        totalFollowUps +=
          1;

        // -------------------------------------------------
        // COMPLETED
        // -------------------------------------------------

        if (
          followUpStatus ===
          "completed"
        ) {
          completedFollowUps +=
            1;

          return;
        }

        // -------------------------------------------------
        // CANCELLED
        // -------------------------------------------------

        if (
          followUpStatus ===
          "cancelled"
        ) {
          return;
        }

        // -------------------------------------------------
        // PENDING / SCHEDULED
        // -------------------------------------------------

        if (
          followUpStatus ===
            "pending" ||
          followUpStatus ===
            "scheduled"
        ) {
          pendingFollowUps +=
            1;
        }

        // -------------------------------------------------
        // OVERDUE
        // -------------------------------------------------

        if (!followUpDate) {
          return;
        }

        const parsedFollowUpDate =
          parseDate(
            followUpDate
          );

        if (
          !parsedFollowUpDate
        ) {
          return;
        }

        parsedFollowUpDate.setHours(
          0,
          0,
          0,
          0
        );

        if (
          parsedFollowUpDate <
          today
        ) {
          overdueFollowUps +=
            1;
        }
      }
    );

    console.log(
      "[AgentPerformance] REAL PERSISTED FOLLOW-UP METRICS:",
      {
        totalFollowUps,

        completedFollowUps,

        pendingFollowUps,

        overdueFollowUps,
      }
    );

    // =====================================================
    // VIEWING METRICS
    // =====================================================
    //
    // AUTHORITATIVE EXISTING LEAD FIELDS:
    //
    //   viewingStatus
    //   nextViewingDate
    //   viewingRequestCount
    //   viewingCompleted
    //
    // We do NOT infer viewing activity from:
    //
    //   updatedAt
    //   lastContact
    //   status === "viewing" alone
    //
    // For legacy records with an explicit viewingStatus
    // but no request count, one viewing activity is allowed
    // as a backward-compatible persisted viewing record.
    //
    // =====================================================

    let totalViewings = 0;

    let completedViewings = 0;

    let upcomingViewings = 0;

    let cancelledViewings = 0;

    let requestedViewings = 0;

    let scheduledViewings = 0;

    let rescheduledViewings = 0;

    let approvedViewings = 0;

    leads.forEach(
      (lead) => {
        const viewingStatus =
          String(
            lead?.viewingStatus ||
            "none"
          )
            .trim()
            .toLowerCase();

        const requestCount =
          toNumber(
            lead?.viewingRequestCount,
            0
          );

        // -------------------------------------------------
        // ACTUAL PERSISTED VIEWING ACTIVITY
        // -------------------------------------------------

        const hasExplicitViewingCount =
          requestCount > 0;

        const hasLegacyViewingState =
          [
            "requested",
            "approved",
            "scheduled",
            "rescheduled",
            "cancelled",
            "completed",
          ].includes(
            viewingStatus
          );

        if (
          hasExplicitViewingCount
        ) {
          totalViewings +=
            requestCount;
        } else if (
          hasLegacyViewingState
        ) {
          totalViewings +=
            1;
        }

        // -------------------------------------------------
        // STATUS BREAKDOWN
        // -------------------------------------------------

        if (
          viewingStatus ===
          "requested"
        ) {
          requestedViewings +=
            1;
        }

        if (
          viewingStatus ===
          "approved"
        ) {
          approvedViewings +=
            1;
        }

        if (
          viewingStatus ===
          "scheduled"
        ) {
          scheduledViewings +=
            1;
        }

        if (
          viewingStatus ===
          "rescheduled"
        ) {
          rescheduledViewings +=
            1;
        }

        if (
          viewingStatus ===
          "cancelled"
        ) {
          cancelledViewings +=
            1;
        }

        // -------------------------------------------------
        // COMPLETED
        // -------------------------------------------------

        if (
          viewingStatus ===
            "completed" ||
          lead?.viewingCompleted ===
            true
        ) {
          completedViewings +=
            1;
        }

        // -------------------------------------------------
        // UPCOMING
        // -------------------------------------------------

        if (
          [
            "approved",
            "scheduled",
            "rescheduled",
          ].includes(
            viewingStatus
          ) &&
          lead?.nextViewingDate
        ) {
          const viewingDate =
            parseDate(
              lead.nextViewingDate
            );

          if (
            viewingDate &&
            viewingDate >=
              new Date()
          ) {
            upcomingViewings +=
              1;
          }
        }
      }
    );

    console.log(
      "[AgentPerformance] REAL VIEWING METRICS:",
      {
        totalViewings,

        requestedViewings,

        approvedViewings,

        scheduledViewings,

        rescheduledViewings,

        completedViewings,

        upcomingViewings,

        cancelledViewings,
      }
    );

    // =====================================================
    // CALL METRICS
    // =====================================================
    //
    // IMPORTANT
    // -----------------------------------------------------
    // Calls are NOT inferred from:
    //
    //   lastContact
    //   updatedAt
    //   followUpUpdatedAt
    //
    // Those are timestamps, not proof of a call.
    //
    // The authoritative call activity is:
    //
    //   Lead.callHistory[]
    //
    // Only entries where:
    //
    //   call.agent === authenticatedAgentId
    //
    // are counted.
    //
    // =====================================================

    let callsMade = 0;

    const agentCallActivity = [];

    leads.forEach(
      (lead) => {
        if (
          !Array.isArray(
            lead?.callHistory
          )
        ) {
          return;
        }

        lead.callHistory.forEach(
          (call) => {
            if (
              !call
            ) {
              return;
            }

            // -------------------------------------------------
            // STRICT AGENT OWNERSHIP
            // -------------------------------------------------

            if (
              !sameId(
                call.agent,
                authenticatedAgentId
              )
            ) {
              return;
            }

            // -------------------------------------------------
            // VALID CALL ACTIVITY
            // -------------------------------------------------

            callsMade +=
              1;

            agentCallActivity.push({
              type:
                "call",

              id:
                call._id ||
                `call-${String(
                  lead._id
                )}-${String(
                  call.calledAt ||
                    ""
                )}`,

              leadId:
                lead._id,

              calledAt:
                call.calledAt ||
                null,

              outcome:
                call.outcome ||
                "",

              notes:
                call.notes ||
                "",

              nextFollowUpDate:
                call.nextFollowUpDate ||
                null,

              agent:
                call.agent,
            });
          }
        );
      }
    );

    console.log(
      "[AgentPerformance] REAL CALL METRICS:",
      {
        callsMade,

        callRecords:
          agentCallActivity.length,
      }
    );

    // =====================================================
    // CONVERSATION / MESSAGE METRICS
    // =====================================================
    //
    // Conversation.js stores conversation metadata.
    //
    // Message.js stores the actual messages.
    //
    // Therefore:
    //
    // ❌ conversation.messageCount is NOT used.
    //
    // ❌ total conversation messages are NOT treated
    //    as agent activity.
    //
    // We locate conversations belonging to this agent's
    // organization and either:
    //
    //   assignedAgent === authenticatedAgentId
    //
    // OR:
    //
    //   leadId belongs to one of this agent's leads.
    //
    // Then we count ONLY messages where:
    //
    //   senderRole === "agent"
    //
    // AND:
    //
    //   senderId === authenticatedAgentId
    //
    // =====================================================

    const assignedLeadIds =
      leads.map(
        (lead) =>
          lead._id
      );

    const conversationQuery = {
      organizationId,

      $or: [
        {
          assignedAgent:
            authenticatedAgentId,
        },

        ...(assignedLeadIds.length
          ? [
              {
                leadId: {
                  $in:
                    assignedLeadIds,
                },
              },
            ]
          : []),
      ],
    };

    const conversations =
      await Conversation.find(
        conversationQuery
      )
        .select({
          _id: 1,
          leadId: 1,
          assignedAgent: 1,
          organizationId: 1,
        })
        .lean();

    const conversationIds =
      conversations.map(
        (
          conversation
        ) =>
          conversation._id
      );

    let messagesSent = 0;

    const agentMessageActivity = [];

    if (
      conversationIds.length >
      0
    ) {
      const agentMessages =
        await Message.find({
          conversationId: {
            $in:
              conversationIds,
          },

          senderRole:
            "agent",

          senderId:
            authenticatedAgentId,

          deleted: {
            $ne: true,
          },
        })
          .select({
            _id: 1,

            conversationId: 1,

            senderId: 1,

            senderRole: 1,

            text: 1,

            createdAt: 1,
          })
          .sort({
            createdAt: -1,
          })
          .lean();

      messagesSent =
        agentMessages.length;

      agentMessages.forEach(
        (
          message
        ) => {
          agentMessageActivity.push({
            type:
              "message",

            id:
              message._id,

            conversationId:
              message.conversationId,

            senderId:
              message.senderId,

            senderRole:
              message.senderRole,

            text:
              message.text ||
              "",

            createdAt:
              message.createdAt ||
              null,
          });
        }
      );
    }

    console.log(
      "[AgentPerformance] REAL MESSAGE METRICS:",
      {
        conversations:
          conversations.length,

        conversationIds:
          conversationIds.length,

        messagesSent,

        agentMessageRecords:
          agentMessageActivity.length,
      }
    );

    // =====================================================
    // REAL AGENT COMMUNICATION SUMMARY
    // =====================================================

    const totalAgentCommunication =
      callsMade +
      messagesSent;

    console.log(
      "[AgentPerformance] REAL AGENT COMMUNICATION:",
      {
        callsMade,

        messagesSent,

        totalAgentCommunication,
      }
    );

    // =====================================================
    // FOLLOW-UP COMPLETION RATE
    // =====================================================

    const followUpCompletionRate =
      totalFollowUps > 0
        ? Number(
            (
              (
                completedFollowUps /
                totalFollowUps
              ) *
              100
            ).toFixed(
              1
            )
          )
        : 0;

    // =====================================================
    // VIEWING COMPLETION RATE
    // =====================================================

    const viewingCompletionRate =
      totalViewings > 0
        ? Number(
            (
              (
                completedViewings /
                totalViewings
              ) *
              100
            ).toFixed(
              1
            )
          )
        : 0;

    // =====================================================
    // CONVERSION RATE
    // =====================================================

    const conversionRate =
      totalLeads > 0
        ? Number(
            (
              (
                convertedLeads /
                totalLeads
              ) *
              100
            ).toFixed(
              1
            )
          )
        : 0;

    // =====================================================
    // RECENT REAL ACTIVITY
    // =====================================================
    //
    // ONLY actual agent communication is included:
    //
    // ✓ calls
    // ✓ messages
    //
    // Deliberately excluded:
    //
    // ❌ updatedAt
    // ❌ lastContact
    // ❌ followUpUpdatedAt
    // ❌ generic lead status changes
    //
    // =====================================================

    const recentActivity = [
      ...agentCallActivity.map(
        (
          activity
        ) => ({
          id:
            activity.id,

          type:
            "call",

          title:
            "Agent call",

          description:
            activity.outcome ||
            "Customer call recorded.",

          leadId:
            activity.leadId,

          date:
            activity.calledAt,

          status:
            activity.outcome ||
            "",
        })
      ),

      ...agentMessageActivity.map(
        (
          activity
        ) => ({
          id:
            activity.id,

          type:
            "message",

          title:
            "Agent message",

          description:
            activity.text ||
            "Customer message sent.",

          conversationId:
            activity.conversationId,

          date:
            activity.createdAt,

          status:
            "sent",
        })
      ),
    ]
      .sort(
        (
          first,
          second
        ) => {
          const firstDate =
            first?.date
              ? new Date(
                  first.date
                ).getTime()
              : 0;

          const secondDate =
            second?.date
              ? new Date(
                  second.date
                ).getTime()
              : 0;

          return (
            secondDate -
            firstDate
          );
        }
      )
      .slice(
        0,
        20
      );

    console.log(
      "[AgentPerformance] RECENT REAL ACTIVITY:",
      recentActivity
    );

    // =====================================================
    // PERFORMANCE OBJECT
    // =====================================================

    const performance = {
      agent: {
        id:
          authenticatedAgentId
            ? String(
                authenticatedAgentId
              )
            : null,

        name:
          authenticatedAgentName,
      },

      // ---------------------------------------------------
      // LEADS
      // ---------------------------------------------------

      leads: {
        total:
          totalLeads,

        qualified:
          qualifiedLeads,

        converted:
          convertedLeads,

        lost:
          lostLeads,
      },

      // ---------------------------------------------------
      // FOLLOW-UPS
      // ---------------------------------------------------

      followUps: {
        total:
          totalFollowUps,

        completed:
          completedFollowUps,

        pending:
          pendingFollowUps,

        overdue:
          overdueFollowUps,

        completionRate:
          followUpCompletionRate,
      },

      // ---------------------------------------------------
      // VIEWINGS
      // ---------------------------------------------------

      viewings: {
        total:
          totalViewings,

        requested:
          requestedViewings,

        approved:
          approvedViewings,

        scheduled:
          scheduledViewings,

        rescheduled:
          rescheduledViewings,

        completed:
          completedViewings,

        cancelled:
          cancelledViewings,

        upcoming:
          upcomingViewings,

        completionRate:
          viewingCompletionRate,
      },

      // ---------------------------------------------------
      // COMMUNICATION
      // ---------------------------------------------------

      communication: {
        callsMade,

        messagesSent,

        total:
          totalAgentCommunication,
      },

      // ---------------------------------------------------
      // BACKWARD COMPATIBILITY
      // ---------------------------------------------------

      callsMade,

      messagesSent,

      // ---------------------------------------------------
      // CONVERSION
      // ---------------------------------------------------

      conversion: {
        rate:
          conversionRate,
      },

      // ---------------------------------------------------
      // RECENT ACTIVITY
      // ---------------------------------------------------

      recentActivity,

      // ---------------------------------------------------
      // SUMMARY
      // ---------------------------------------------------

      summary: {
        totalLeads,

        qualifiedLeads,

        convertedLeads,

        lostLeads,

        totalFollowUps,

        completedFollowUps,

        pendingFollowUps,

        overdueFollowUps,

        totalViewings,

        requestedViewings,

        approvedViewings,

        scheduledViewings,

        rescheduledViewings,

        upcomingViewings,

        completedViewings,

        cancelledViewings,

        callsMade,

        messagesSent,

        totalAgentCommunication,

        conversionRate,

        followUpCompletionRate,

        viewingCompletionRate,
      },
    };

    // =====================================================
    // DEBUG FINAL PERFORMANCE
    // =====================================================

    console.log(
      "[AgentPerformance] FINAL PERFORMANCE:",
      performance
    );

    console.log(
      "[AgentPerformance] FINAL REAL METRICS:",
      {
        assignedLeads:
          totalLeads,

        qualifiedLeads:
          qualifiedLeads,

        convertedLeads:
          convertedLeads,

        lostLeads:
          lostLeads,

        totalFollowUps:
          totalFollowUps,

        completedFollowUps:
          completedFollowUps,

        pendingFollowUps:
          pendingFollowUps,

        overdueFollowUps:
          overdueFollowUps,

        totalViewings:
          totalViewings,

        requestedViewings:
          requestedViewings,

        approvedViewings:
          approvedViewings,

        scheduledViewings:
          scheduledViewings,

        rescheduledViewings:
          rescheduledViewings,

        completedViewings:
          completedViewings,

        upcomingViewings:
          upcomingViewings,

        cancelledViewings:
          cancelledViewings,

        callsMade:
          callsMade,

        messagesSent:
          messagesSent,

        totalAgentCommunication:
          totalAgentCommunication,
      }
    );

    // =====================================================
    // RESPONSE
    // =====================================================

    return res.status(200).json({
      success: true,

      data:
        performance,
    });

  } catch (error) {
    console.error(
      "[AgentController] GET AGENT PERFORMANCE ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to load agent performance.",
    });
  }
};