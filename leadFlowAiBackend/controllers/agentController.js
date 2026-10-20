/**
 * ==========================================================
 * AGENT CONTROLLER
 * ==========================================================
 *
 * Purpose
 * ----------------------------------------------------------
 * Handles AGENT-SIDE lead operations in LeadFlow AI.
 *
 * Responsibilities
 * ----------------------------------------------------------
 *
 * ✓ View/update status of assigned leads
 * ✓ Add notes to assigned leads
 * ✓ Request/update viewing workflow
 * ✓ Submit viewing feedback
 * ✓ Get authenticated agent performance
 * ✓ Emit canonical lead/viewing pipeline events
 *
 * IMPORTANT
 * ----------------------------------------------------------
 * Lead assignment is NOT handled here.
 *
 * ADMIN / SYSTEM assignment workflow:
 *
 *   leadAutoAssignmentService
 *              ↓
 *   assignmentConflictResolver
 *              ↓
 *   lead.assignedTo = agent._id
 *
 * Agent workflow:
 *
 *   agentController
 *              ↓
 *   assignedTo === authenticated agent
 *
 * Therefore:
 *
 * ❌ Agents cannot assign leads
 * ❌ Agents cannot reassign leads
 * ❌ Agents cannot choose agentId
 * ❌ Agents cannot choose organizationId
 *
 * ==========================================================
 *
 * CANONICAL LEAD LIFECYCLE
 * ==========================================================
 *
 * Lead.status:
 *
 *   new
 *   contacted
 *   qualified
 *   viewing
 *   negotiation
 *   won
 *   lost
 *
 * Lifecycle authority:
 *
 *   services/leadLifeCycleService.js
 *
 * ==========================================================
 *
 * CANONICAL SCORING
 * ==========================================================
 *
 * Lead.score:
 *
 *   0–49   → new
 *   50–79  → qualified
 *   80–100 → hot
 *
 * IMPORTANT:
 *
 * "hot" is a score category.
 *
 * "hot" is NOT Lead.status.
 *
 * ==========================================================
 *
 * CANONICAL VIEWING WORKFLOW
 * ==========================================================
 *
 * Viewing.status:
 *
 *   Requested
 *   Pending Approval
 *   Approved
 *   Rescheduled
 *   Rejected
 *   Cancelled
 *   Completed
 *
 * Viewing workflow authority:
 *
 *   services/viewingService.js
 *
 * Lead.status may become:
 *
 *   viewing
 *
 * when the viewing workflow legitimately moves the lead
 * into the viewing lifecycle stage.
 *
 * Lead.viewingStatus is LEGACY compatibility data only.
 *
 * ==========================================================
 *
 * RELIABLE EVENT ARCHITECTURE
 * ==========================================================
 *
 * Critical business events are persisted through the
 * MongoDB Outbox.
 *
 * Critical lifecycle events:
 *
 *   lead.status.changed
 *   lead.won
 *   lead.lost
 *
 * Critical viewing events:
 *
 *   lead.viewing.requested
 *   lead.viewing.confirmed
 *   lead.viewing.completed
 *   lead.viewing.cancelled
 *
 * Flow:
 *
 *   domain mutation
 *          ↓
 *   OutboxEvent persisted
 *          ↓
 *   Outbox Worker
 *          ↓
 *   leadEventBus
 *          ↓
 *   realtimeEngine
 *
 * IMPORTANT:
 *
 * updateLeadStatus() persists the Lead mutation and its
 * lifecycle event(s) in the SAME transaction.
 *
 * ViewingService currently owns the Viewing mutation itself.
 * Therefore this controller queues the corresponding viewing
 * Outbox event after the domain service succeeds.
 *
 * The viewing transaction can be made fully atomic later by
 * adding session support to viewingService.js.
 *
 * ==========================================================
 */

import mongoose from "mongoose";

import Lead from "../models/lead.js";
import Conversation from "../models/conversation.js";
import Message from "../models/message.js";
import Viewing from "../models/viewing.js";

import {
  resolveFromRequest,
} from "../services/organizationResolverService.js";

import {
  canTransitionLeadStatus,
  transitionLeadStatus,
} from "../services/leadLifeCycleService.js";

import {
  HOT_SCORE_THRESHOLD,
} from "../services/leadScoringRulesEngine.js";

import {
  requestViewing,
  approveViewing,
  rejectViewing,
  rescheduleViewing,
  cancelViewing,
  completeViewing,
  submitFeedback,
} from "../services/viewingService.js";

import leadEventBus, {
  LEAD_EVENTS,
} from "../events/leadEvents.js";

import {
  withReliableTransaction,
  addLeadStatusChangedEvent,
  addLeadWonEvent,
  addLeadLostEvent,
  addViewingRequestedEvent,
  addViewingConfirmedEvent,
  addViewingCompletedEvent,
  addViewingCancelledEvent,
} from "../services/outboxIntegrationService.js";


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
const getAuthenticatedAgentId = (
  req
) => {

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
 * Organization MUST come from the centralized
 * organization resolver.
 */
const getAuthenticatedOrganizationId = async (
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


/**
 * Validate MongoDB ObjectId.
 */
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


/**
 * Safely convert a value to Number.
 */
const toNumber = (
  value,
  fallback = 0
) => {

  const number =
    Number(value);

  return Number.isFinite(
    number
  )
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

  if (
    !value
  ) {

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
 * Normalize viewing status.
 *
 * IMPORTANT:
 * -----------------------------------------------------
 * This reads the REAL Viewing.status.
 *
 * It does NOT read Lead.viewingStatus.
 */
const normalizeViewingStatus = (
  status
) => {

  if (
    !status
  ) {

    return null;
  }

  return String(status)
    .trim();
};


/**
 * Extract viewing document from a viewing service result.
 *
 * Compatible with service methods returning either:
 *
 *   viewing
 *
 * or:
 *
 *   { viewing, lead, property, ... }
 */
const extractViewingFromResult = (
  result
) => {

  if (
    !result
  ) {

    return null;
  }

  return (
    result.viewing ||
    result.data?.viewing ||
    result
  );
};


/**
 * Extract lead document from a viewing service result.
 */
const extractLeadFromViewingResult = (
  result
) => {

  return (
    result?.lead ||
    result?.data?.lead ||
    null
  );
};


/**
 * Resolve a stable request/operation ID when the
 * infrastructure provides one.
 *
 * This is intentionally NOT generated from Date.now(),
 * because deterministic identifiers are preferable for
 * Outbox deduplication.
 */
const getRequestOperationId = (
  req,
  operation
) => {

  const requestId =
    req?.id ||
    req?.requestId ||
    req?.headers?.["x-request-id"] ||
    req?.headers?.["x-correlation-id"] ||
    null;


  if (
    !requestId
  ) {

    return null;
  }


  return `${operation}:${String(requestId)}`;
};


/**
 * =====================================================
 * EMIT GENERIC LEAD UPDATE
 * =====================================================
 *
 * These are non-critical realtime/read-model events.
 *
 * They intentionally remain direct during the current
 * migration phase.
 *
 * Critical lifecycle/viewing events do NOT use this helper.
 */
const emitLeadUpdate = (
  lead
) => {

  try {

    const organizationId =
      lead?.organizationId ||
      null;

    const payload = {

      leadId:
        lead?._id ||
        null,

      organizationId,

      lead,

      status:
        lead?.status ||
        null,

      score:
        Number(
          lead?.score ||
          0
        ),

      assignedTo:
        lead?.assignedTo ||
        null,

      currentViewingId:
        lead?.currentViewing ||
        null,

      followUpStatus:
        lead?.followUpStatus ||
        null,

      occurredAt:
        new Date(),

    };


    // -------------------------------------------------
    // NON-CRITICAL READ-MODEL EVENT
    // -------------------------------------------------

    leadEventBus.emit(
      LEAD_EVENTS.LEAD_UPDATED,
      payload
    );


    // -------------------------------------------------
    // NON-CRITICAL PIPELINE EVENT
    // -------------------------------------------------

    leadEventBus.emit(
      LEAD_EVENTS.PIPELINE_UPDATED,
      payload
    );


  } catch (
    eventError
  ) {

    console.error(
      "[AgentController] LEAD EVENT EMISSION ERROR:",
      eventError
    );
  }
};


/**
 * =====================================================
 * QUEUE CANONICAL LEAD LIFECYCLE EVENTS
 * =====================================================
 *
 * Critical lifecycle events are persisted to Outbox.
 *
 * This helper is used for lead mutations performed by
 * viewingService where the Lead has already been changed
 * by the domain service.
 *
 * updateLeadStatus() performs its own atomic transaction
 * because it owns the Lead mutation directly.
 */
const queueLifecycleEvents = async ({
  lead,
  previousStatus,
  operationId = null,
}) => {

  if (
    !lead
  ) {

    return false;
  }


  const currentStatus =
    lead.status ||
    "new";


  const statusChanged =
    String(
      previousStatus ||
      ""
    ) !==
    String(
      currentStatus
    );


  if (
    !statusChanged
  ) {

    return false;
  }


  const organizationId =
    lead.organizationId ||
    null;


  if (
    !organizationId
  ) {

    throw new Error(
      "Cannot queue lifecycle event without organizationId."
    );
  }


  await withReliableTransaction(
    async (
      session
    ) => {

      // ================================================
      // STATUS CHANGED
      // ================================================

      await addLeadStatusChangedEvent({

        session,

        lead,

        organizationId,

        previousStatus:
          previousStatus ||
          null,

        status:
          currentStatus,

        operationId,

      });


      console.log(
        "[AgentController] OUTBOX QUEUED: LEAD_STATUS_CHANGED"
      );


      // ================================================
      // WON
      // ================================================

      if (
        currentStatus ===
        "won"
      ) {

        await addLeadWonEvent({

          session,

          lead,

          organizationId,

          previousStatus:
            previousStatus ||
            null,

          operationId,

        });


        console.log(
          "[AgentController] OUTBOX QUEUED: LEAD_WON"
        );
      }


      // ================================================
      // LOST
      // ================================================

      if (
        currentStatus ===
        "lost"
      ) {

        await addLeadLostEvent({

          session,

          lead,

          organizationId,

          previousStatus:
            previousStatus ||
            null,

          operationId,

        });


        console.log(
          "[AgentController] OUTBOX QUEUED: LEAD_LOST"
        );
      }

    }
  );


  return true;
};


/**
 * =====================================================
 * QUEUE CANONICAL VIEWING EVENT
 * =====================================================
 *
 * Viewing workflow is driven by the Viewing document.
 *
 * Lead.viewingStatus is NOT used.
 *
 * Canonical Viewing.status:
 *
 *   Requested
 *   Pending Approval
 *   Approved
 *   Rescheduled
 *   Rejected
 *   Cancelled
 *   Completed
 *
 * Event mapping:
 *
 *   Requested
 *       ↓
 *   LEAD_VIEWING_REQUESTED
 *
 *   Approved / Rescheduled
 *       ↓
 *   LEAD_VIEWING_CONFIRMED
 *
 *   Completed
 *       ↓
 *   LEAD_VIEWING_COMPLETED
 *
 *   Cancelled
 *       ↓
 *   LEAD_VIEWING_CANCELLED
 *
 * Rejected deliberately has no CANCELLED event.
 */
const queueViewingEvent = async ({
  viewing,
  lead,
  previousViewingStatus,
  operationId = null,
}) => {

  if (
    !viewing
  ) {

    return false;
  }


  const currentViewingStatus =
    normalizeViewingStatus(
      viewing.status
    );


  const organizationId =
    viewing.organizationId ||
    lead?.organizationId ||
    null;


  if (
    !currentViewingStatus
  ) {

    return false;
  }


  if (
    !organizationId
  ) {

    throw new Error(
      "Cannot queue viewing event without organizationId."
    );
  }


  const statusChanged =
    String(
      previousViewingStatus ||
      ""
    ) !==
    String(
      currentViewingStatus
    );


  if (
    !statusChanged
  ) {

    return false;
  }


  const queueOptions = {

    session:
      null,

    viewing,

    lead:
      lead ||
      null,

    organizationId,

    previousViewingStatus:
      previousViewingStatus ||
      null,

    operationId,

  };


  await withReliableTransaction(
    async (
      session
    ) => {

      const eventOptions = {

        ...queueOptions,

        session,

      };


      // ================================================
      // REQUESTED
      // ================================================

      if (
        currentViewingStatus ===
        "Requested"
      ) {

        await addViewingRequestedEvent(
          eventOptions
        );


        console.log(
          "[AgentController] OUTBOX QUEUED: LEAD_VIEWING_REQUESTED"
        );


        return;
      }


      // ================================================
      // APPROVED
      // ================================================

      if (
        currentViewingStatus ===
        "Approved"
      ) {

        await addViewingConfirmedEvent(
          eventOptions
        );


        console.log(
          "[AgentController] OUTBOX QUEUED: LEAD_VIEWING_CONFIRMED"
        );


        return;
      }


      // ================================================
      // RESCHEDULED
      // ================================================

      if (
        currentViewingStatus ===
        "Rescheduled"
      ) {

        await addViewingConfirmedEvent(
          eventOptions
        );


        console.log(
          "[AgentController] OUTBOX QUEUED: LEAD_VIEWING_CONFIRMED"
        );


        return;
      }


      // ================================================
      // COMPLETED
      // ================================================

      if (
        currentViewingStatus ===
        "Completed"
      ) {

        await addViewingCompletedEvent(
          eventOptions
        );


        console.log(
          "[AgentController] OUTBOX QUEUED: LEAD_VIEWING_COMPLETED"
        );


        return;
      }


      // ================================================
      // CANCELLED
      // ================================================

      if (
        currentViewingStatus ===
        "Cancelled"
      ) {

        await addViewingCancelledEvent(
          eventOptions
        );


        console.log(
          "[AgentController] OUTBOX QUEUED: LEAD_VIEWING_CANCELLED"
        );


        return;
      }


      // ================================================
      // REJECTED
      // ================================================
      //
      // Rejected deliberately produces no viewing
      // cancellation event.
      //
      // The Viewing.status itself remains authoritative.
      // ================================================

      if (
        currentViewingStatus ===
        "Rejected"
      ) {

        console.log(
          "[AgentController] Viewing rejected. No CANCELLED event queued."
        );
      }

    }
  );


  return true;
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
// Canonical statuses:
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
      getAuthenticatedAgentId(
        req
      );


    const organizationId =
      await getAuthenticatedOrganizationId(
        req
      );


    // =================================================
    // AUTHENTICATION
    // =================================================

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


    // =================================================
    // ORGANIZATION
    // =================================================

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


    // =================================================
    // LEAD ID
    // =================================================

    if (
      !isValidObjectId(
        leadId
      )
    ) {

      return res.status(400).json({

        success:
          false,

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

        success:
          false,

        message:
          "Lead status is required.",

      });
    }


    const normalizedStatus =
      String(status)
        .trim()
        .toLowerCase();


    // =================================================
    // LOAD ONLY ASSIGNED LEAD
    // =================================================

    const lead =
      await Lead.findOne({

        _id:
          leadId,

        organizationId,

        assignedTo:
          agentId,

      });


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


    // =================================================
    // VALIDATE CANONICAL TRANSITION
    // =================================================

    const currentStatus =
      lead.status ||
      "new";


    if (
      !canTransitionLeadStatus(
        currentStatus,
        normalizedStatus
      )
    ) {

      return res.status(400).json({

        success:
          false,

        message:
          `Invalid lead lifecycle transition: ${currentStatus} → ${normalizedStatus}.`,

      });
    }


    // =================================================
    // CAPTURE PREVIOUS STATUS
    // =================================================

    const previousStatus =
      currentStatus;


    // =================================================
    // APPLY CANONICAL TRANSITION
    // =================================================

    const transitionResult =
      transitionLeadStatus(
        lead,
        normalizedStatus
      );


    // =================================================
    // REQUEST / OPERATION ID
    // =================================================

    const operationId =
      getRequestOperationId(
        req,
        `agent-status-${String(
          lead._id
        )}`
      );


    // =================================================
    // ATOMIC LEAD + OUTBOX TRANSACTION
    // =================================================
    //
    // The Lead mutation and critical lifecycle events are
    // committed together.
    //
    // =================================================

    await withReliableTransaction(
      async (
        session
      ) => {

        await lead.save({
          session,
        });


        // ---------------------------------------------
        // STATUS CHANGED
        // ---------------------------------------------

        if (
          transitionResult.changed
        ) {

          await addLeadStatusChangedEvent({

            session,

            lead,

            organizationId,

            previousStatus,

            status:
              lead.status,

            operationId,

          });


          console.log(
            "[AgentController] OUTBOX QUEUED: LEAD_STATUS_CHANGED"
          );


          // -------------------------------------------
          // WON
          // -------------------------------------------

          if (
            lead.status ===
            "won"
          ) {

            await addLeadWonEvent({

              session,

              lead,

              organizationId,

              previousStatus,

              operationId,

            });


            console.log(
              "[AgentController] OUTBOX QUEUED: LEAD_WON"
            );
          }


          // -------------------------------------------
          // LOST
          // -------------------------------------------

          if (
            lead.status ===
            "lost"
          ) {

            await addLeadLostEvent({

              session,

              lead,

              organizationId,

              previousStatus,

              operationId,

            });


            console.log(
              "[AgentController] OUTBOX QUEUED: LEAD_LOST"
            );
          }
        }

      }
    );


    console.log(
      "[AgentController] Lead lifecycle transition completed:",
      {

        leadId:
          String(
            lead._id
          ),

        previousStatus:
          transitionResult.previousStatus,

        status:
          transitionResult.status,

        changed:
          transitionResult.changed,

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
    // NON-CRITICAL PIPELINE SYNCHRONIZATION
    // =================================================

    emitLeadUpdate(
      lead
    );


    // =================================================
    // RESPONSE
    // =================================================

    return res.status(200).json({

      success:
        true,

      message:
        "Lead status updated successfully.",

      data:
        lead,

      lifecycle: {

        previousStatus,

        status:
          lead.status,

        changed:
          previousStatus !==
          lead.status,

      },

    });


  } catch (
    error
  ) {

    console.error(
      "[AgentController] UPDATE LEAD STATUS ERROR:",
      error
    );


    if (
      error?.message?.includes(
        "Invalid Lead lifecycle transition"
      ) ||
      error?.message?.includes(
        "Invalid Lead status"
      )
    ) {

      return res.status(400).json({

        success:
          false,

        message:
          error.message,

      });
    }


    return res.status(500).json({

      success:
        false,

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
      getAuthenticatedAgentId(
        req
      );


    const organizationId =
      await getAuthenticatedOrganizationId(
        req
      );


    // =================================================
    // AUTHENTICATION
    // =================================================

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


    // =================================================
    // ORGANIZATION
    // =================================================

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


    // =================================================
    // LEAD ID
    // =================================================

    if (
      !isValidObjectId(
        leadId
      )
    ) {

      return res.status(400).json({

        success:
          false,

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

        success:
          false,

        message:
          "Note text is required.",

      });
    }


    // =================================================
    // FIND ONLY AGENT'S LEAD
    // =================================================

    const lead =
      await Lead.findOne({

        _id:
          leadId,

        organizationId,

        assignedTo:
          agentId,

      });


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
    // NON-CRITICAL EVENTS
    // =================================================

    emitLeadUpdate(
      lead
    );


    // =================================================
    // RESPONSE
    // =================================================

    return res.status(200).json({

      success:
        true,

      message:
        "Lead note added successfully.",

      data:
        lead,

    });


  } catch (
    error
  ) {

    console.error(
      "[AgentController] ADD LEAD NOTE ERROR:",
      error
    );


    return res.status(500).json({

      success:
        false,

      message:
        "Failed to add lead note.",

    });
  }
};


// =====================================================
// REQUEST / SCHEDULE VIEWING
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
      "[AgentController] REQUEST VIEWING"
    );


    const {
      leadId,
      propertyId,
      date,
      viewingDate,
      startTime,
      endTime,
      notes,
      message,
      viewingStatus,
    } = req.body || {};


    const agentId =
      getAuthenticatedAgentId(
        req
      );


    const organizationId =
      await getAuthenticatedOrganizationId(
        req
      );


    // =================================================
    // AUTHENTICATION
    // =================================================

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


    // =================================================
    // ORGANIZATION
    // =================================================

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


    // =================================================
    // LEAD ID
    // =================================================

    if (
      !isValidObjectId(
        leadId
      )
    ) {

      return res.status(400).json({

        success:
          false,

        message:
          "A valid lead ID is required.",

      });
    }


    // =================================================
    // PROPERTY ID
    // =================================================

    if (
      propertyId &&
      !isValidObjectId(
        propertyId
      )
    ) {

      return res.status(400).json({

        success:
          false,

        message:
          "A valid property ID is required.",

      });
    }


    // =================================================
    // DATE
    // =================================================

    const requestedViewingDate =
      viewingDate ||
      date ||
      null;


    if (
      !requestedViewingDate
    ) {

      return res.status(400).json({

        success:
          false,

        message:
          "Viewing date is required.",

      });
    }


    const parsedDate =
      parseDate(
        requestedViewingDate
      );


    if (
      !parsedDate
    ) {

      return res.status(400).json({

        success:
          false,

        message:
          "Invalid viewing date.",

      });
    }


    // =================================================
    // LOAD ONLY ASSIGNED LEAD
    // =================================================

    const leadBefore =
      await Lead.findOne({

        _id:
          leadId,

        organizationId,

        assignedTo:
          agentId,

      });


    if (
      !leadBefore
    ) {

      return res.status(404).json({

        success:
          false,

        message:
          "Lead not found.",

      });
    }


    const previousLeadStatus =
      leadBefore.status ||
      "new";


    // =================================================
    // CLIENT MUST NOT CONTROL VIEWING STATUS
    // =================================================

    if (
      viewingStatus
    ) {

      console.log(
        "[AgentController] Legacy viewingStatus ignored. Viewing service owns viewing workflow:",
        viewingStatus
      );
    }


    // =================================================
    // REQUEST VIEWING THROUGH DOMAIN SERVICE
    // =================================================

    const serviceResult =
      await requestViewing({

        leadId,

        propertyId:
          propertyId ||
          null,

        agentId,

        organizationId,

        date:
          requestedViewingDate,

        viewingDate:
          requestedViewingDate,

        startTime:
          startTime ||
          null,

        endTime:
          endTime ||
          null,

        notes:
          notes ||
          message ||
          "",

        requestedBy:
          agentId,

      });


    const viewing =
      extractViewingFromResult(
        serviceResult
      );


    const serviceLead =
      extractLeadFromViewingResult(
        serviceResult
      );


    // =================================================
    // LOAD FINAL LEAD
    // =================================================

    const finalLead =
      serviceLead ||
      await Lead.findOne({

        _id:
          leadId,

        organizationId,

        assignedTo:
          agentId,

      });


    if (
      !finalLead
    ) {

      throw new Error(
        "Lead could not be reloaded after viewing request."
      );
    }


    console.log(
      "[AgentController] Viewing request created:",
      {

        viewingId:
          viewing?._id
            ? String(
                viewing._id
              )
            : null,

        leadId:
          String(
            finalLead._id
          ),

        leadStatus:
          finalLead.status,

        previousLeadStatus,

        viewingStatus:
          viewing?.status ||
          null,

      }
    );


    // =================================================
    // REQUEST OPERATION ID
    // =================================================

    const operationId =
      getRequestOperationId(
        req,
        `agent-viewing-request-${String(
          viewing?._id ||
          leadId
        )}`
      );


    // =================================================
    // VIEWING EVENT → OUTBOX
    // =================================================

    await queueViewingEvent({

      viewing,

      lead:
        finalLead,

      previousViewingStatus:
        null,

      operationId,

    });


    // =================================================
    // LEAD LIFECYCLE EVENT → OUTBOX
    // =================================================

    if (
      previousLeadStatus !==
      finalLead.status
    ) {

      await queueLifecycleEvents({

        lead:
          finalLead,

        previousStatus:
          previousLeadStatus,

        operationId,

      });

    } else {

      emitLeadUpdate(
        finalLead
      );
    }


    // =================================================
    // RESPONSE
    // =================================================

    return res.status(200).json({

      success:
        true,

      message:
        "Viewing request submitted successfully.",

      data: {

        viewing,

        lead:
          finalLead,

      },

    });


  } catch (
    error
  ) {

    console.error(
      "[AgentController] REQUEST VIEWING ERROR:",
      error
    );


    if (
      error?.status
    ) {

      return res.status(
        error.status
      ).json({

        success:
          false,

        message:
          error.message,

      });
    }


    return res.status(500).json({

      success:
        false,

      message:
        "Failed to request viewing.",

      error:
        error.message,

    });
  }
};


// =====================================================
// APPROVE VIEWING
// =====================================================
//
// AGENT ONLY
//
// POST
// /api/agent/approve-viewing
//
// =====================================================

export const approveAgentViewing = async (
  req,
  res
) => {

  try {

    console.log(
      "[AgentController] APPROVE VIEWING REQUEST"
    );


    const {
      viewingId,
    } = req.body || {};


    const agentId =
      getAuthenticatedAgentId(
        req
      );


    const organizationId =
      await getAuthenticatedOrganizationId(
        req
      );


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


    if (
      !isValidObjectId(
        viewingId
      )
    ) {

      return res.status(400).json({

        success:
          false,

        message:
          "A valid viewing ID is required.",

      });
    }


    const existingViewing =
      await Viewing.findOne({

        _id:
          viewingId,

        organizationId,

      }).lean();


    if (
      !existingViewing
    ) {

      return res.status(404).json({

        success:
          false,

        message:
          "Viewing not found.",

      });
    }


    const lead =
      await Lead.findOne({

        _id:
          existingViewing.leadId,

        organizationId,

        assignedTo:
          agentId,

      });


    if (
      !lead
    ) {

      return res.status(404).json({

        success:
          false,

        message:
          "Assigned lead not found.",

      });
    }


    const previousViewingStatus =
      normalizeViewingStatus(
        existingViewing.status
      );


    const previousLeadStatus =
      lead.status ||
      "new";


    const serviceResult =
      await approveViewing({

        viewingId,

        agentId,

        organizationId,

      });


    const viewing =
      extractViewingFromResult(
        serviceResult
      ) ||
      await Viewing.findOne({

        _id:
          viewingId,

        organizationId,

      });


    const finalLead =
      extractLeadFromViewingResult(
        serviceResult
      ) ||
      await Lead.findOne({

        _id:
          existingViewing.leadId,

        organizationId,

        assignedTo:
          agentId,

      });


    const operationId =
      getRequestOperationId(
        req,
        `agent-viewing-approve-${String(
          viewingId
        )}`
      );


    // =================================================
    // VIEWING EVENT → OUTBOX
    // =================================================

    await queueViewingEvent({

      viewing,

      lead:
        finalLead,

      previousViewingStatus,

      operationId,

    });


    // =================================================
    // LEAD LIFECYCLE → OUTBOX IF CHANGED
    // =================================================

    if (
      finalLead &&
      previousLeadStatus !==
      finalLead.status
    ) {

      await queueLifecycleEvents({

        lead:
          finalLead,

        previousStatus:
          previousLeadStatus,

        operationId,

      });

    } else if (
      finalLead
    ) {

      emitLeadUpdate(
        finalLead
      );
    }


    return res.status(200).json({

      success:
        true,

      message:
        "Viewing approved successfully.",

      data: {

        viewing,

        lead:
          finalLead,

      },

    });


  } catch (
    error
  ) {

    console.error(
      "[AgentController] APPROVE VIEWING ERROR:",
      error
    );


    return res.status(
      error?.status ||
      500
    ).json({

      success:
        false,

      message:
        error?.message ||
        "Failed to approve viewing.",

    });
  }
};


// =====================================================
// REJECT VIEWING
// =====================================================
//
// POST
// /api/agent/reject-viewing
//
// =====================================================

export const rejectAgentViewing = async (
  req,
  res
) => {

  try {

    console.log(
      "[AgentController] REJECT VIEWING REQUEST"
    );


    const {
      viewingId,
      reason,
    } = req.body || {};


    const agentId =
      getAuthenticatedAgentId(
        req
      );


    const organizationId =
      await getAuthenticatedOrganizationId(
        req
      );


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


    if (
      !isValidObjectId(
        viewingId
      )
    ) {

      return res.status(400).json({

        success:
          false,

        message:
          "A valid viewing ID is required.",

      });
    }


    const existingViewing =
      await Viewing.findOne({

        _id:
          viewingId,

        organizationId,

      }).lean();


    if (
      !existingViewing
    ) {

      return res.status(404).json({

        success:
          false,

        message:
          "Viewing not found.",

      });
    }


    const lead =
      await Lead.findOne({

        _id:
          existingViewing.leadId,

        organizationId,

        assignedTo:
          agentId,

      });


    if (
      !lead
    ) {

      return res.status(404).json({

        success:
          false,

        message:
          "Assigned lead not found.",

      });
    }


    const previousViewingStatus =
      normalizeViewingStatus(
        existingViewing.status
      );


    const previousLeadStatus =
      lead.status ||
      "new";


    const serviceResult =
      await rejectViewing({

        viewingId,

        agentId,

        organizationId,

        reason:
          reason ||
          "",

      });


    const viewing =
      extractViewingFromResult(
        serviceResult
      ) ||
      await Viewing.findOne({

        _id:
          viewingId,

        organizationId,

      });


    const finalLead =
      extractLeadFromViewingResult(
        serviceResult
      ) ||
      await Lead.findOne({

        _id:
          existingViewing.leadId,

        organizationId,

        assignedTo:
          agentId,

      });


    const operationId =
      getRequestOperationId(
        req,
        `agent-viewing-reject-${String(
          viewingId
        )}`
      );


    // =================================================
    // REJECTED HAS NO CANCELLED EVENT
    // =================================================

    await queueViewingEvent({

      viewing,

      lead:
        finalLead,

      previousViewingStatus,

      operationId,

    });


    // =================================================
    // LEAD LIFECYCLE EVENT IF SERVICE CHANGED IT
    // =================================================

    if (
      finalLead &&
      previousLeadStatus !==
      finalLead.status
    ) {

      await queueLifecycleEvents({

        lead:
          finalLead,

        previousStatus:
          previousLeadStatus,

        operationId,

      });

    } else if (
      finalLead
    ) {

      emitLeadUpdate(
        finalLead
      );
    }


    return res.status(200).json({

      success:
        true,

      message:
        "Viewing rejected successfully.",

      data: {

        viewing,

        lead:
          finalLead,

      },

    });


  } catch (
    error
  ) {

    console.error(
      "[AgentController] REJECT VIEWING ERROR:",
      error
    );


    return res.status(
      error?.status ||
      500
    ).json({

      success:
        false,

      message:
        error?.message ||
        "Failed to reject viewing.",

    });
  }
};


// =====================================================
// RESCHEDULE VIEWING
// =====================================================
//
// POST
// /api/agent/reschedule-viewing
//
// =====================================================

export const rescheduleAgentViewing = async (
  req,
  res
) => {

  try {

    console.log(
      "[AgentController] RESCHEDULE VIEWING REQUEST"
    );


    const {
      viewingId,
      date,
      viewingDate,
      startTime,
      endTime,
      reason,
      notes,
    } = req.body || {};


    const agentId =
      getAuthenticatedAgentId(
        req
      );


    const organizationId =
      await getAuthenticatedOrganizationId(
        req
      );


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


    if (
      !isValidObjectId(
        viewingId
      )
    ) {

      return res.status(400).json({

        success:
          false,

        message:
          "A valid viewing ID is required.",

      });
    }


    const requestedDate =
      viewingDate ||
      date ||
      null;


    if (
      !requestedDate
    ) {

      return res.status(400).json({

        success:
          false,

        message:
          "A new viewing date is required.",

      });
    }


    if (
      !parseDate(
        requestedDate
      )
    ) {

      return res.status(400).json({

        success:
          false,

        message:
          "Invalid rescheduled viewing date.",

      });
    }


    const existingViewing =
      await Viewing.findOne({

        _id:
          viewingId,

        organizationId,

      }).lean();


    if (
      !existingViewing
    ) {

      return res.status(404).json({

        success:
          false,

        message:
          "Viewing not found.",

      });
    }


    const lead =
      await Lead.findOne({

        _id:
          existingViewing.leadId,

        organizationId,

        assignedTo:
          agentId,

      });


    if (
      !lead
    ) {

      return res.status(404).json({

        success:
          false,

        message:
          "Assigned lead not found.",

      });
    }


    const previousViewingStatus =
      normalizeViewingStatus(
        existingViewing.status
      );


    const previousLeadStatus =
      lead.status ||
      "new";


    const serviceResult =
      await rescheduleViewing({

        viewingId,

        agentId,

        organizationId,

        date:
          requestedDate,

        viewingDate:
          requestedDate,

        startTime:
          startTime ||
          null,

        endTime:
          endTime ||
          null,

        reason:
          reason ||
          "",

        notes:
          notes ||
          "",

      });


    const viewing =
      extractViewingFromResult(
        serviceResult
      ) ||
      await Viewing.findOne({

        _id:
          viewingId,

        organizationId,

      });


    const finalLead =
      extractLeadFromViewingResult(
        serviceResult
      ) ||
      await Lead.findOne({

        _id:
          existingViewing.leadId,

        organizationId,

        assignedTo:
          agentId,

      });


    const operationId =
      getRequestOperationId(
        req,
        `agent-viewing-reschedule-${String(
          viewingId
        )}`
      );


    // =================================================
    // VIEWING EVENT → OUTBOX
    // =================================================

    await queueViewingEvent({

      viewing,

      lead:
        finalLead,

      previousViewingStatus,

      operationId,

    });


    // =================================================
    // LEAD LIFECYCLE → OUTBOX IF CHANGED
    // =================================================

    if (
      finalLead &&
      previousLeadStatus !==
      finalLead.status
    ) {

      await queueLifecycleEvents({

        lead:
          finalLead,

        previousStatus:
          previousLeadStatus,

        operationId,

      });

    } else if (
      finalLead
    ) {

      emitLeadUpdate(
        finalLead
      );
    }


    return res.status(200).json({

      success:
        true,

      message:
        "Viewing rescheduled successfully.",

      data: {

        viewing,

        lead:
          finalLead,

      },

    });


  } catch (
    error
  ) {

    console.error(
      "[AgentController] RESCHEDULE VIEWING ERROR:",
      error
    );


    return res.status(
      error?.status ||
      500
    ).json({

      success:
        false,

      message:
        error?.message ||
        "Failed to reschedule viewing.",

    });
  }
};


// =====================================================
// CANCEL VIEWING
// =====================================================
//
// POST
// /api/agent/cancel-viewing
//
// =====================================================

export const cancelAgentViewing = async (
  req,
  res
) => {

  try {

    console.log(
      "[AgentController] CANCEL VIEWING REQUEST"
    );


    const {
      viewingId,
      reason,
    } = req.body || {};


    const agentId =
      getAuthenticatedAgentId(
        req
      );


    const organizationId =
      await getAuthenticatedOrganizationId(
        req
      );


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


    if (
      !isValidObjectId(
        viewingId
      )
    ) {

      return res.status(400).json({

        success:
          false,

        message:
          "A valid viewing ID is required.",

      });
    }


    const existingViewing =
      await Viewing.findOne({

        _id:
          viewingId,

        organizationId,

      }).lean();


    if (
      !existingViewing
    ) {

      return res.status(404).json({

        success:
          false,

        message:
          "Viewing not found.",

      });
    }


    const lead =
      await Lead.findOne({

        _id:
          existingViewing.leadId,

        organizationId,

        assignedTo:
          agentId,

      });


    if (
      !lead
    ) {

      return res.status(404).json({

        success:
          false,

        message:
          "Assigned lead not found.",

      });
    }


    const previousViewingStatus =
      normalizeViewingStatus(
        existingViewing.status
      );


    const previousLeadStatus =
      lead.status ||
      "new";


    const serviceResult =
      await cancelViewing({

        viewingId,

        agentId,

        organizationId,

        reason:
          reason ||
          "",

      });


    const viewing =
      extractViewingFromResult(
        serviceResult
      ) ||
      await Viewing.findOne({

        _id:
          viewingId,

        organizationId,

      });


    const finalLead =
      extractLeadFromViewingResult(
        serviceResult
      ) ||
      await Lead.findOne({

        _id:
          existingViewing.leadId,

        organizationId,

        assignedTo:
          agentId,

      });


    const operationId =
      getRequestOperationId(
        req,
        `agent-viewing-cancel-${String(
          viewingId
        )}`
      );


    // =================================================
    // VIEWING EVENT → OUTBOX
    // =================================================

    await queueViewingEvent({

      viewing,

      lead:
        finalLead,

      previousViewingStatus,

      operationId,

    });


    // =================================================
    // LEAD LIFECYCLE → OUTBOX IF CHANGED
    // =================================================

    if (
      finalLead &&
      previousLeadStatus !==
      finalLead.status
    ) {

      await queueLifecycleEvents({

        lead:
          finalLead,

        previousStatus:
          previousLeadStatus,

        operationId,

      });

    } else if (
      finalLead
    ) {

      emitLeadUpdate(
        finalLead
      );
    }


    return res.status(200).json({

      success:
        true,

      message:
        "Viewing cancelled successfully.",

      data: {

        viewing,

        lead:
          finalLead,

      },

    });


  } catch (
    error
  ) {

    console.error(
      "[AgentController] CANCEL VIEWING ERROR:",
      error
    );


    return res.status(
      error?.status ||
      500
    ).json({

      success:
        false,

      message:
        error?.message ||
        "Failed to cancel viewing.",

    });
  }
};


// =====================================================
// COMPLETE VIEWING
// =====================================================
//
// POST
// /api/agent/complete-viewing
//
// IMPORTANT
// -----------------------------------------------------
//
// Completion of a viewing does NOT automatically change:
//
//   Lead.status = qualified
//
// or:
//
//   Lead.status = negotiation
//
// The Lead lifecycle remains governed by the lifecycle
// service and the actual post-viewing outcome.
//
// =====================================================

export const completeAgentViewing = async (
  req,
  res
) => {

  try {

    console.log(
      "[AgentController] COMPLETE VIEWING REQUEST"
    );


    const {
      viewingId,
      notes,
      outcome,
    } = req.body || {};


    const agentId =
      getAuthenticatedAgentId(
        req
      );


    const organizationId =
      await getAuthenticatedOrganizationId(
        req
      );


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


    if (
      !isValidObjectId(
        viewingId
      )
    ) {

      return res.status(400).json({

        success:
          false,

        message:
          "A valid viewing ID is required.",

      });
    }


    const existingViewing =
      await Viewing.findOne({

        _id:
          viewingId,

        organizationId,

      }).lean();


    if (
      !existingViewing
    ) {

      return res.status(404).json({

        success:
          false,

        message:
          "Viewing not found.",

      });
    }


    const lead =
      await Lead.findOne({

        _id:
          existingViewing.leadId,

        organizationId,

        assignedTo:
          agentId,

      });


    if (
      !lead
    ) {

      return res.status(404).json({

        success:
          false,

        message:
          "Assigned lead not found.",

      });
    }


    const previousViewingStatus =
      normalizeViewingStatus(
        existingViewing.status
      );


    const previousLeadStatus =
      lead.status ||
      "new";


    const serviceResult =
      await completeViewing({

        viewingId,

        agentId,

        organizationId,

        notes:
          notes ||
          "",

        outcome:
          outcome ||
          null,

      });


    const viewing =
      extractViewingFromResult(
        serviceResult
      ) ||
      await Viewing.findOne({

        _id:
          viewingId,

        organizationId,

      });


    const finalLead =
      extractLeadFromViewingResult(
        serviceResult
      ) ||
      await Lead.findOne({

        _id:
          existingViewing.leadId,

        organizationId,

        assignedTo:
          agentId,

      });


    const operationId =
      getRequestOperationId(
        req,
        `agent-viewing-complete-${String(
          viewingId
        )}`
      );


    // =================================================
    // VIEWING EVENT → OUTBOX
    // =================================================

    await queueViewingEvent({

      viewing,

      lead:
        finalLead,

      previousViewingStatus,

      operationId,

    });


    // =================================================
    // LEAD LIFECYCLE → OUTBOX IF CHANGED
    // =================================================

    if (
      finalLead &&
      previousLeadStatus !==
      finalLead.status
    ) {

      await queueLifecycleEvents({

        lead:
          finalLead,

        previousStatus:
          previousLeadStatus,

        operationId,

      });

    } else if (
      finalLead
    ) {

      emitLeadUpdate(
        finalLead
      );
    }


    return res.status(200).json({

      success:
        true,

      message:
        "Viewing completed successfully.",

      data: {

        viewing,

        lead:
          finalLead,

      },

    });


  } catch (
    error
  ) {

    console.error(
      "[AgentController] COMPLETE VIEWING ERROR:",
      error
    );


    return res.status(
      error?.status ||
      500
    ).json({

      success:
        false,

      message:
        error?.message ||
        "Failed to complete viewing.",

    });
  }
};


// =====================================================
// SUBMIT VIEWING FEEDBACK
// =====================================================
//
// POST
// /api/agent/viewing-feedback
//
// =====================================================

export const submitViewingFeedback = async (
  req,
  res
) => {

  try {

    console.log(
      "[AgentController] SUBMIT VIEWING FEEDBACK REQUEST"
    );


    const {
      viewingId,
      feedback,
      rating,
      comment,
      interested,
      outcome,
      followUpDate,
    } = req.body || {};


    const agentId =
      getAuthenticatedAgentId(
        req
      );


    const organizationId =
      await getAuthenticatedOrganizationId(
        req
      );


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


    if (
      !isValidObjectId(
        viewingId
      )
    ) {

      return res.status(400).json({

        success:
          false,

        message:
          "A valid viewing ID is required.",

      });
    }


    const existingViewing =
      await Viewing.findOne({

        _id:
          viewingId,

        organizationId,

      }).lean();


    if (
      !existingViewing
    ) {

      return res.status(404).json({

        success:
          false,

        message:
          "Viewing not found.",

      });
    }


    const lead =
      await Lead.findOne({

        _id:
          existingViewing.leadId,

        organizationId,

        assignedTo:
          agentId,

      });


    if (
      !lead
    ) {

      return res.status(404).json({

        success:
          false,

        message:
          "Assigned lead not found.",

      });
    }


    const feedbackPayload = {

      ...(feedback || {}),

      rating:
        rating ??
        feedback?.rating ??
        null,

      comment:
        comment ??
        feedback?.comment ??
        "",

      interested:
        interested ??
        feedback?.interested ??
        null,

      outcome:
        outcome ??
        feedback?.outcome ??
        null,

      followUpDate:
        followUpDate ??
        feedback?.followUpDate ??
        null,

      submittedBy:
        agentId,

      submittedAt:
        new Date(),

    };


    const serviceResult =
      await submitFeedback({

        viewingId,

        agentId,

        organizationId,

        feedback:
          feedbackPayload,

      });


    const viewing =
      extractViewingFromResult(
        serviceResult
      ) ||
      await Viewing.findOne({

        _id:
          viewingId,

        organizationId,

      });


    const finalLead =
      extractLeadFromViewingResult(
        serviceResult
      ) ||
      await Lead.findOne({

        _id:
          existingViewing.leadId,

        organizationId,

        assignedTo:
          agentId,

      });


    // =================================================
    // FEEDBACK DOES NOT CHANGE VIEWING STATUS HERE
    // =================================================
    //
    // Therefore no viewing transition event is produced.
    //
    // Generic lead/pipeline synchronization remains direct
    // during this migration phase.
    // =================================================

    if (
      finalLead
    ) {

      emitLeadUpdate(
        finalLead
      );
    }


    return res.status(200).json({

      success:
        true,

      message:
        "Viewing feedback submitted successfully.",

      data: {

        viewing,

        lead:
          finalLead,

      },

    });


  } catch (
    error
  ) {

    console.error(
      "[AgentController] SUBMIT VIEWING FEEDBACK ERROR:",
      error
    );


    return res.status(
      error?.status ||
      500
    ).json({

      success:
        false,

      message:
        error?.message ||
        "Failed to submit viewing feedback.",

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
// It uses authenticated context only.
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
      getAuthenticatedAgentId(
        req
      );


    const organizationId =
      await getAuthenticatedOrganizationId(
        req
      );


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

        success:
          false,

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

        success:
          false,

        message:
          "Organization not assigned.",

      });
    }


    // =================================================
    // AUTHORITATIVE LEAD QUERY
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
          updatedAt:
            -1,
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
        (
          lead
        ) => ({

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

          score:
            lead?.score ||
            0,

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
        lead?.status ||
        ""
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
    // HOT LEADS
    // =================================================

    const hotLeads =
      leads.filter(
        (lead) =>
          Number(
            lead?.score ||
            0
          ) >=
          HOT_SCORE_THRESHOLD
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
      (
        lead
      ) => {

        const followUpDate =
          lead?.nextFollowUpDate ||
          null;


        const followUpStatus =
          String(
            lead?.followUpStatus ||
            ""
          )
            .trim()
            .toLowerCase();


        // -------------------------------------------------
        // NO PERSISTED FOLLOW-UP STATE
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

        if (
          !followUpDate
        ) {

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

    const assignedLeadIds =
      leads.map(
        (
          lead
        ) =>
          lead._id
      );


    let viewingDocuments = [];


    if (
      assignedLeadIds.length >
      0
    ) {

      viewingDocuments =
        await Viewing.find({

          organizationId,

          leadId: {
            $in:
              assignedLeadIds,
          },

        })
          .sort({
            createdAt:
              -1,
          })
          .lean();
    }


    let totalViewings = 0;

    let completedViewings = 0;

    let upcomingViewings = 0;

    let cancelledViewings = 0;

    let rejectedViewings = 0;

    let requestedViewings = 0;

    let pendingApprovalViewings = 0;

    let scheduledViewings = 0;

    let rescheduledViewings = 0;

    let approvedViewings = 0;


    const now =
      new Date();


    viewingDocuments.forEach(
      (
        viewing
      ) => {

        const viewingStatus =
          normalizeViewingStatus(
            viewing?.status
          );


        if (
          !viewingStatus
        ) {

          return;
        }


        totalViewings +=
          1;


        switch (
          viewingStatus
        ) {

          case "Requested":

            requestedViewings +=
              1;

            break;


          case "Pending Approval":

            pendingApprovalViewings +=
              1;

            break;


          case "Approved":

            approvedViewings +=
              1;

            scheduledViewings +=
              1;

            break;


          case "Rescheduled":

            rescheduledViewings +=
              1;

            scheduledViewings +=
              1;

            break;


          case "Rejected":

            rejectedViewings +=
              1;

            break;


          case "Cancelled":

            cancelledViewings +=
              1;

            break;


          case "Completed":

            completedViewings +=
              1;

            break;


          default:

            break;
        }


        // -------------------------------------------------
        // UPCOMING SCHEDULED VIEWING
        // -------------------------------------------------

        if (
          viewingStatus ===
            "Approved" ||
          viewingStatus ===
            "Rescheduled"
        ) {

          const viewingDate =
            parseDate(
              viewing.startTime ||
              viewing.date ||
              viewing.viewingDate
            );


          if (
            viewingDate &&
            viewingDate >=
              now
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

        pendingApprovalViewings,

        approvedViewings,

        scheduledViewings,

        rescheduledViewings,

        completedViewings,

        upcomingViewings,

        cancelledViewings,

        rejectedViewings,

      }
    );


    // =====================================================
    // CALL METRICS
    // =====================================================

    let callsMade = 0;

    const agentCallActivity = [];


    leads.forEach(
      (
        lead
      ) => {

        if (
          !Array.isArray(
            lead?.callHistory
          )
        ) {

          return;
        }


        lead.callHistory.forEach(
          (
            call
          ) => {

            if (
              !call
            ) {

              return;
            }


            if (
              !sameId(
                call.agent,
                authenticatedAgentId
              )
            ) {

              return;
            }


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

          _id:
            1,

          leadId:
            1,

          assignedAgent:
            1,

          organizationId:
            1,

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

          organizationId,

          conversationId: {
            $in:
              conversationIds,
          },

          senderRole:
            "agent",

          senderId:
            authenticatedAgentId,

          deleted: {
            $ne:
              true,
          },

        })
          .select({

            _id:
              1,

            conversationId:
              1,

            senderId:
              1,

            senderRole:
              1,

            text:
              1,

            createdAt:
              1,

          })
          .sort({

            createdAt:
              -1,

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

        hot:
          hotLeads,

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

        pendingApproval:
          pendingApprovalViewings,

        approved:
          approvedViewings,

        scheduled:
          scheduledViewings,

        rescheduled:
          rescheduledViewings,

        rejected:
          rejectedViewings,

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

        hotLeads,

        convertedLeads,

        lostLeads,

        totalFollowUps,

        completedFollowUps,

        pendingFollowUps,

        overdueFollowUps,

        totalViewings,

        requestedViewings,

        pendingApprovalViewings,

        approvedViewings,

        scheduledViewings,

        rescheduledViewings,

        rejectedViewings,

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

        hotLeads:
          hotLeads,

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

        pendingApprovalViewings:
          pendingApprovalViewings,

        approvedViewings:
          approvedViewings,

        scheduledViewings:
          scheduledViewings,

        rescheduledViewings:
          rescheduledViewings,

        rejectedViewings:
          rejectedViewings,

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

      success:
        true,

      data:
        performance,

    });


  } catch (
    error
  ) {

    console.error(
      "[AgentController] GET AGENT PERFORMANCE ERROR:",
      error
    );


    return res.status(500).json({

      success:
        false,

      message:
        "Failed to load agent performance.",

    });
  }
};


// =====================================================
// DEFAULT EXPORT
// =====================================================

export default {

  updateLeadStatus,

  addLeadNote,

  scheduleViewing,

  approveAgentViewing,

  rejectAgentViewing,

  rescheduleAgentViewing,

  cancelAgentViewing,

  completeAgentViewing,

  submitViewingFeedback,

  getAgentPerformance,

};