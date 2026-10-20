/**
 * ==========================================================
 *
 * VIEWING CONTROLLER
 *
 * ==========================================================
 *
 * Handles:
 * ----------------------------------------------------------
 * ✓ Request Viewing
 * ✓ List Viewings
 * ✓ Today's Viewings
 * ✓ Upcoming Viewings
 * ✓ Viewing Details
 * ✓ Approve
 * ✓ Reject
 * ✓ Cancel
 * ✓ Reschedule
 * ✓ Complete
 * ✓ Submit Feedback
 * ✓ Viewing Availability
 * ✓ Conflict Checking
 * ✓ Calendar Viewings
 * ✓ Agent Viewings
 * ✓ Lead Viewing History
 * ✓ Property Viewing History
 *
 * ==========================================================
 *
 * CANONICAL ARCHITECTURE
 * ==========================================================
 *
 * Lead lifecycle:
 *
 *   services/leadLifeCycleService.js
 *
 * Viewing workflow:
 *
 *   services/viewingService.js
 *
 * Business events:
 *
 *   events/leadEvents.js
 *
 * Reliable event persistence:
 *
 *   services/outboxIntegrationService.js
 *
 * ==========================================================
 *
 * IMPORTANT
 * ----------------------------------------------------------
 *
 * THIS CONTROLLER MUST NOT directly mutate:
 *
 *   lead.status
 *
 * or directly perform the core Viewing workflow mutation.
 *
 * All viewing mutations go through:
 *
 *   services/viewingService.js
 *
 * Lead lifecycle transitions go through:
 *
 *   services/leadLifeCycleService.js
 *
 * Business events are persisted through:
 *
 *   services/outboxIntegrationService.js
 *
 * This guarantees:
 *
 * ✓ conflict checking is centralized
 * ✓ tenant isolation is centralized
 * ✓ Lead lifecycle transitions are centralized
 * ✓ Viewing.status remains separate from Lead.status
 * ✓ property viewing statistics stay consistent
 * ✓ notifications remain consistent
 * ✓ critical business events are durable
 * ✓ event publication is delegated to the Outbox worker
 *
 * ==========================================================
 */

import { randomUUID } from "node:crypto";

import Viewing from "../models/viewing.js";
import Lead from "../models/lead.js";
import Property from "../models/property.js";
import Conversation from "../models/conversation.js";

/* ==========================================================
   ORGANIZATION RESOLUTION
========================================================== */

import {
  resolveFromRequest,
} from "../services/organizationResolverService.js";

/* ==========================================================
   VIEWING SERVICE
========================================================== */

import {
  requestViewing as requestViewingService,

  approveViewing as approveViewingService,

  rejectViewing as rejectViewingService,

  rescheduleViewing as rescheduleViewingService,

  cancelViewing as cancelViewingService,

  completeViewing as completeViewingService,

  submitFeedback as submitFeedbackService,

  checkPropertyConflict,

  checkAgentConflict,
} from "../services/viewingService.js";

/* ==========================================================
   LEAD LIFECYCLE
========================================================== */

import {
  isValidLeadStatus,
  canTransitionLeadStatus,
  transitionLeadStatus,
} from "../services/leadLifeCycleService.js";

/* ==========================================================
   CANONICAL EVENT NAMES
========================================================== */

import {
  LEAD_EVENTS,
} from "../events/leadEvents.js";

/* ==========================================================
   OUTBOX / RELIABLE EVENTS
========================================================== */

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

import {
  createOutboxEvent,
} from "../services/outboxService.js";

/* ==========================================================
   VIEWING STATUS SOURCE OF TRUTH
========================================================== */

/**
 * These are Viewing.status values.
 *
 * They are NOT Lead.status values.
 */
const VIEWING_STATUS =
  Object.freeze({
    REQUESTED:
      "Requested",

    PENDING_APPROVAL:
      "Pending Approval",

    APPROVED:
      "Approved",

    RESCHEDULED:
      "Rescheduled",

    REJECTED:
      "Rejected",

    CANCELLED:
      "Cancelled",

    COMPLETED:
      "Completed",
  });

/**
 * Viewing states that represent an active request.
 */
const VIEWING_REQUEST_STATUSES =
  Object.freeze([
    VIEWING_STATUS.REQUESTED,
    VIEWING_STATUS.PENDING_APPROVAL,
  ]);

/**
 * Viewing states that represent an actually
 * scheduled viewing.
 */
const VIEWING_SCHEDULED_STATUSES =
  Object.freeze([
    VIEWING_STATUS.APPROVED,
    VIEWING_STATUS.RESCHEDULED,
  ]);

/* ==========================================================
   ORGANIZATION RESOLUTION
========================================================== */

/**
 * Resolve authenticated organization through the
 * centralized organization resolver.
 */
const getOrganizationId =
  async (
    req
  ) => {
    const organization =
      await resolveFromRequest(
        req
      );

    return (
      organization?._id ||
      null
    );
  };

/* ==========================================================
   AUTHENTICATED USER ID
========================================================== */

const getAuthenticatedUserId =
  (req) => {
    return (
      req.user?._id ||
      req.user?.id ||
      null
    );
  };

/* ==========================================================
   ROLE
========================================================== */

const getRole =
  (req) => {
    return String(
      req.user?.role ||
        ""
    )
      .trim()
      .toLowerCase();
  };

/* ==========================================================
   NORMALIZE ID
========================================================== */

const normalizeId =
  (value) => {
    if (
      value ===
        undefined ||
      value === null
    ) {
      return null;
    }

    if (
      typeof value ===
        "object" &&
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

/* ==========================================================
   OPERATION ID
========================================================== */

/**
 * Stable operation identity for Outbox deduplication.
 *
 * Prefer an upstream request/correlation identifier.
 * Fall back to UUID when none exists.
 */
const getOperationId =
  (
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
      null;

    if (
      requestId
    ) {
      return `${operation}:${String(
        requestId
      )}`;
    }

    return `${operation}:${randomUUID()}`;
  };

/* ==========================================================
   ORGANIZATION FILTER
========================================================== */

/**
 * organizationId is NEVER accepted from:
 *
 *   req.body
 *   req.query
 *
 * It always comes from the authenticated organization.
 */
const applyOrganizationFilter =
  async (
    req,
    query = {}
  ) => {
    const organizationId =
      await getOrganizationId(
        req
      );

    if (
      organizationId
    ) {
      query.organizationId =
        organizationId;
    }

    return query;
  };

/* ==========================================================
   ACCESSIBLE VIEWING
========================================================== */

/**
 * Resolve a viewing while enforcing:
 *
 * ✓ organization isolation
 * ✓ agent isolation
 *
 * READ ONLY.
 *
 * No viewing mutation happens here.
 */
const findAccessibleViewing = async (
  req,
  viewingId,
  session = null
) => {
  const organizationId = await getOrganizationId(req);

  if (!organizationId) {
    return {
      error: {
        status: 401,
        message: "Authenticated organization not found.",
      },
    };
  }

  let query = Viewing.findOne({
    _id: viewingId,
    organizationId,
  });

  if (session) {
    query = query.session(session);
  }

  const viewing = await query;

  if (!viewing) {
    return {
      error: {
        status: 404,
        message: "Viewing not found.",
      },
    };
  }

  if (getRole(req) === "agent") {
    const userId = getAuthenticatedUserId(req);

    if (!userId) {
      return {
        error: {
          status: 401,
          message: "Authenticated agent ID not found.",
        },
      };
    }

    if (
      viewing.agent &&
      normalizeId(viewing.agent) !== normalizeId(userId)
    ) {
      return {
        error: {
          status: 403,
          message: "You can only manage viewings assigned to you.",
        },
      };
    }
  }

  if (getRole(req) === "customer") {
    const userId = getAuthenticatedUserId(req);

    if (!userId) {
      return {
        error: {
          status: 401,
          message: "Authenticated customer ID not found.",
        },
      };
    }

    if (
      viewing.requestedBy &&
      normalizeId(viewing.requestedBy) !== normalizeId(userId)
    ) {
      return {
        error: {
          status: 403,
          message: "You are not authorized to access this viewing.",
        },
      };
    }
  }

  return {
    viewing,
    organizationId,
  };
};

/* ==========================================================
   LEAD ACCESS
========================================================== */

const findAccessibleLead = async (
  req,
  leadId,
  session = null
) => {
  const organizationId = await getOrganizationId(req);

  if (!organizationId) {
    return {
      error: {
        status: 401,
        message: "Authenticated organization not found.",
      },
    };
  }

  const query = {
    _id: leadId,
    organizationId,
  };

  if (getRole(req) === "agent") {
    const userId = getAuthenticatedUserId(req);

    if (!userId) {
      return {
        error: {
          status: 401,
          message: "Authenticated agent ID not found.",
        },
      };
    }

    query.assignedTo = userId;
  }

  let leadQuery = Lead.findOne(query);

  if (session) {
    leadQuery = leadQuery.session(session);
  }

  const lead = await leadQuery;

  if (!lead) {
    return {
      error: {
        status: 404,
        message: "Lead not found or access denied.",
      },
    };
  }

  return {
    lead,
    organizationId,
  };
};

/* ==========================================================
   LEAD LIFECYCLE TRANSITION
========================================================== */

/**
 * The controller NEVER directly assigns:
 *
 *   lead.status = ...
 *
 * All lifecycle changes go through:
 *
 *   leadLifeCycleService.js
 */
const applyLeadStatusTransition =
  (
    lead,
    nextStatus
  ) => {
    if (!lead) {
      throw new Error(
        "Lead is required."
      );
    }

    if (
      !isValidLeadStatus(
        nextStatus
      )
    ) {
      const error =
        new Error(
          "Invalid lead status."
        );

      error.code =
        "INVALID_LEAD_STATUS";

      throw error;
    }

    const currentStatus =
      lead.status;

    if (
      currentStatus ===
      nextStatus
    ) {
      return {
        changed:
          false,

        previousStatus:
          currentStatus,

        status:
          currentStatus,
      };
    }

    if (
      !canTransitionLeadStatus(
        currentStatus,
        nextStatus
      )
    ) {
      const error =
        new Error(
          `Invalid lead lifecycle transition: ${currentStatus} → ${nextStatus}`
        );

      error.code =
        "INVALID_LEAD_TRANSITION";

      error.previousStatus =
        currentStatus;

      error.requestedStatus =
        nextStatus;

      throw error;
    }

    transitionLeadStatus(
      lead,
      nextStatus
    );

    return {
      changed:
        true,

      previousStatus:
        currentStatus,

      status:
        lead.status,
    };
  };

/* ==========================================================
   SERVICE ERROR STATUS
========================================================== */

const getServiceErrorStatus =
  (error) => {
    const code =
      error?.code;

    const message =
      String(
        error?.message ||
          ""
      ).toLowerCase();

    if (
      code ===
      "INVALID_LEAD_TRANSITION"
    ) {
      return 409;
    }

    if (
      code ===
      "INVALID_LEAD_STATUS"
    ) {
      return 400;
    }

    if (
      message.includes(
        "already"
      ) ||
      message.includes(
        "unavailable"
      ) ||
      message.includes(
        "another viewing"
      ) ||
      message.includes(
        "conflict"
      ) ||
      message.includes(
        "scheduled"
      ) ||
      message.includes(
        "cannot be"
      )
    ) {
      return 409;
    }

    if (
      message.includes(
        "not found"
      )
    ) {
      return 404;
    }

    if (
      message.includes(
        "required"
      ) ||
      message.includes(
        "invalid"
      )
    ) {
      return 400;
    }

    return 500;
  };

const sendServiceError =
  (
    res,
    error,
    fallbackMessage
  ) => {
    const status =
      getServiceErrorStatus(
        error
      );

    return res
      .status(status)
      .json({
        success:
          false,

        message:
          status === 500
            ? fallbackMessage
            : error?.message ||
              fallbackMessage,
      });
  };

/* ==========================================================
   FEEDBACK OUTCOME NORMALIZATION
========================================================== */

/**
 * Viewing feedback values accepted at the
 * controller boundary.
 *
 * Canonical persisted values:
 *
 *   Interested
 *   Needs Follow Up
 *   Not Interested
 *   Offer Expected
 *
 * Legacy frontend aliases are normalized
 * before calling viewingService.
 */
const normalizeFeedbackOutcome =
  (
    outcome
  ) => {
    if (
      outcome ===
        undefined ||
      outcome === null ||
      outcome === ""
    ) {
      return null;
    }

    const normalized =
      String(
        outcome
      )
        .trim()
        .toLowerCase();

    switch (
      normalized
    ) {
      case "interested":
        return "Interested";

      case "follow_up":
      case "needs follow up":
      case "needs_follow_up":
        return "Needs Follow Up";

      case "not_interested":
      case "not interested":
        return "Not Interested";

      case "negotiating":
      case "offer expected":
      case "offer_expected":
        return "Offer Expected";

      case "no_decision":
      case "no decision":
        return "Needs Follow Up";

      default:
        return null;
    }
  };

/**
 * Map canonical viewing outcome
 * to Lead.status.
 *
 * This function does NOT mutate the lead.
 */
const getLeadStatusFromViewingOutcome =
  (
    outcome
  ) => {
    switch (
      outcome
    ) {
      case "Interested":
        return "qualified";

      case "Offer Expected":
        return "negotiation";

      case "Needs Follow Up":
        return "qualified";

      case "Not Interested":
        return "lost";

      default:
        return null;
    }
  };

/* ==========================================================
   OUTBOX — LEAD READ MODEL EVENTS
========================================================== */

/**
 * Persist non-terminal lead read-model events.
 *
 * These are intentionally written into the Outbox too,
 * so the controller has no direct event-bus dependency.
 */
const queueLeadReadModelEvents =
  async ({
    lead,
    organizationId,
    operationId,
    session = null,
    extra = {},
  }) => {
    if (
      !lead ||
      !organizationId
    ) {
      return;
    }

    const leadId =
      normalizeId(
        lead._id
      );

    const payload = {
      leadId,

      organizationId:
        normalizeId(
          organizationId
        ),

      lead,

      status:
        lead.status ||
        null,

      score:
        Number(
          lead.score ||
            0
        ),

      assignedTo:
        lead.assignedTo ||
        null,

      currentViewingId:
        lead.currentViewing ||
        extra.currentViewingId ||
        null,

      followUpStatus:
        lead.followUpStatus ||
        null,

      ...extra,

      occurredAt:
        new Date(),
    };

    await createOutboxEvent({
      session,

      eventType:
        LEAD_EVENTS.LEAD_UPDATED,

      aggregateType:
        "lead",

      aggregateId:
        leadId,

      organizationId,

      payload,

      deduplicationKey:
        `${operationId}:lead.updated`,
    });

    await createOutboxEvent({
      session,

      eventType:
        LEAD_EVENTS.PIPELINE_UPDATED,

      aggregateType:
        "lead",

      aggregateId:
        leadId,

      organizationId,

      payload,

      deduplicationKey:
        `${operationId}:lead.pipeline.updated`,
    });
  };

/* ==========================================================
   OUTBOX — LEAD LIFECYCLE EVENTS
========================================================== */

/**
 * Queue lifecycle events ONLY when Lead.status
 * actually changes.
 *
 * Canonical payload:
 *
 *   previousStatus
 *   status
 *
 * Never:
 *
 *   newStatus
 */
const queueLeadLifecycleEvents =
  async ({
    lead,
    organizationId,
    previousStatus,
    operationId,
    session = null,
  }) => {
    if (
      !lead ||
      !organizationId
    ) {
      return;
    }

    const currentStatus =
      lead.status;

    if (
      !previousStatus ||
      !currentStatus ||
      previousStatus ===
        currentStatus
    ) {
      return;
    }

    await addLeadStatusChangedEvent({
      session,

      lead,

      organizationId,

      previousStatus,

      status:
        currentStatus,

      operationId,
    });

    if (
      currentStatus ===
      "won"
    ) {
      await addLeadWonEvent({
        session,

        lead,

        organizationId,

        previousStatus,

        operationId,
      });
    }

    if (
      currentStatus ===
      "lost"
    ) {
      await addLeadLostEvent({
        session,

        lead,

        organizationId,

        previousStatus,

        operationId,
      });
    }
  };

/* ==========================================================
   OUTBOX — VIEWING BUSINESS EVENTS
========================================================== */

/**
 * Queue canonical viewing events according to
 * Viewing.status.
 */
const queueViewingBusinessEvent =
  async ({
    viewing,
    lead,
    property,
    organizationId,
    previousViewingStatus =
      null,
    previousStatus =
      null,
    operationId,
    session = null,
  }) => {
    if (
      !viewing ||
      !organizationId
    ) {
      return;
    }

    const common = {
  session,
  viewing,
  lead,
  property,
  organizationId,

  // Previous state of the Viewing document.
  previousStatus: previousViewingStatus,

  // Previous state of the Lead lifecycle.
  previousLeadStatus: previousStatus,

  operationId,
};

    switch (
      viewing.status
    ) {
      case VIEWING_STATUS.REQUESTED:

        await addViewingRequestedEvent(
          common
        );

        break;

      case VIEWING_STATUS.APPROVED:

        await addViewingConfirmedEvent(
          common
        );

        break;

      case VIEWING_STATUS.COMPLETED:

        await addViewingCompletedEvent(
          common
        );

        break;

      case VIEWING_STATUS.CANCELLED:

        await addViewingCancelledEvent(
          common
        );

        break;

      default:
        /**
         * No separate canonical business event
         * currently exists for:
         *
         *   Rejected
         *   Rescheduled
         *
         * The Viewing document remains authoritative
         * for those states.
         */
        break;
    }
  };

/* ==========================================================
   REQUEST VIEWING
========================================================== */

/**
 * POST
 * /api/viewings
 *
 * ATOMIC TRANSACTION:
 *
 *   Viewing
 *   Lead
 *   Property
 *   Conversation
 *   Outbox events
 *
 * are committed together.
 */
export const requestViewing =
  async (
    req,
    res
  ) => {
    try {
      const {

        leadId,

        propertyId,

        viewingDate,

        startTime,

        endTime,

        customerNotes,

      } =
        req.body || {};

      const organizationId =
        await getOrganizationId(
          req
        );

      if (
        !organizationId
      ) {
        return res
          .status(401)
          .json({
            success:
              false,

            message:
              "Authenticated organization not found.",
          });
      }

      if (
        !leadId ||
        !propertyId ||
        !viewingDate ||
        !startTime ||
        !endTime
      ) {
        return res
          .status(400)
          .json({
            success:
              false,

            message:
              "leadId, propertyId, viewingDate, startTime and endTime are required.",
          });
      }

      const operationId =
        getOperationId(
          req,
          `viewing-request:${leadId}:${propertyId}`
        );

      const transactionResult =
        await withReliableTransaction(
          async (
            session
          ) => {
            /* ------------------------------------------------
               LOAD LEAD
            ------------------------------------------------ */

            const leadQuery =
              Lead.findOne({
                _id:
                  leadId,

                organizationId,
              }).session(
                session
              );

            const lead =
              await leadQuery;

            if (!lead) {
              const error =
                new Error(
                  "Lead not found."
                );

              error.statusCode =
                404;

              throw error;
            }

            /* ------------------------------------------------
               AGENT ACCESS
            ------------------------------------------------ */

            if (
              getRole(req) ===
              "agent"
            ) {
              const authenticatedAgentId =
                getAuthenticatedUserId(
                  req
                );

              if (
                !authenticatedAgentId
              ) {
                const error =
                  new Error(
                    "Authenticated agent ID not found."
                  );

                error.statusCode =
                  401;

                throw error;
              }

              if (
                normalizeId(
                  lead.assignedTo
                ) !==
                normalizeId(
                  authenticatedAgentId
                )
              ) {
                const error =
                  new Error(
                    "You can only request viewings for leads assigned to you."
                  );

                error.statusCode =
                  403;

                throw error;
              }
            }

            /* ------------------------------------------------
               LOAD PROPERTY
            ------------------------------------------------ */

            const property =
              await Property.findOne({
                _id:
                  propertyId,

                organizationId,
              }).session(
                session
              );

            if (!property) {
              const error =
                new Error(
                  "Property not found."
                );

                error.statusCode =
                  404;

              throw error;
            }

            /* ------------------------------------------------
               RESOLVE AGENT
            ------------------------------------------------ */

            const agentId =
              normalizeId(
                property.assignedAgent
              ) ||
              normalizeId(
                lead.assignedTo
              ) ||
              normalizeId(
                getAuthenticatedUserId(
                  req
                )
              );

            if (
              !agentId
            ) {
              const error =
                new Error(
                  "No agent is assigned to handle this viewing."
                );

              error.statusCode =
                400;

              throw error;
            }

            /* ------------------------------------------------
               PRESERVE PREVIOUS LEAD STATUS
            ------------------------------------------------ */

            const previousStatus =
              lead.status;

            /* ------------------------------------------------
               VIEWING SERVICE
            ------------------------------------------------ */

            const viewing =
              await requestViewingService({
                organizationId,

                requestedBy:
                  getAuthenticatedUserId(
                    req
                  ),

                leadId:
                  lead._id,

                propertyId:
                  property._id,

                agent: agentId,

                viewingDate,

                startTime,

                endTime,

                customerNotes,

                session,
              });

            /* ------------------------------------------------
               RELOAD FINAL LEAD
            ------------------------------------------------ */

            const updatedLead =
              await Lead.findOne({
                _id:
                  lead._id,

                organizationId,
              }).session(
                session
              );

            /* ------------------------------------------------
               RELOAD FINAL PROPERTY
            ------------------------------------------------ */

            const updatedProperty =
              await Property.findOne({
                _id:
                  property._id,

                organizationId,
              }).session(
                session
              );

            /* ------------------------------------------------
               RELOAD FINAL VIEWING
            ------------------------------------------------ */

            const finalViewing =
              await Viewing.findOne({
                _id:
                  viewing?._id,

                organizationId,
              }).session(
                session
              );

            /* ------------------------------------------------
               CONVERSATION READ MODEL
            ------------------------------------------------ */

            await Conversation.updateOne(
              {
                organizationId,

                leadId:
                  lead._id,
              },
              {
                status:
                  "awaiting_agent",

                updatedAt:
                  new Date(),

                lastUpdated:
                  new Date(),
              },
              {
                session,
              }
            );

            /* ------------------------------------------------
               OUTBOX — VIEWING REQUESTED
            ------------------------------------------------ */

            await queueViewingBusinessEvent({
              viewing:
                finalViewing ||
                viewing,

              lead:
                updatedLead,

              property:
                updatedProperty,

              organizationId,

              previousViewingStatus:
                null,

              previousStatus,

              operationId,

              session,
            });

            /* ------------------------------------------------
               OUTBOX — LEAD LIFECYCLE
            ------------------------------------------------ */

            if (
              updatedLead
            ) {
              await queueLeadLifecycleEvents({
                lead:
                  updatedLead,

                organizationId,

                previousStatus,

                operationId,

                session,
              });

              /* ----------------------------------------------
                 OUTBOX — READ MODEL
              ---------------------------------------------- */

              await queueLeadReadModelEvents({
                lead:
                  updatedLead,

                organizationId,

                operationId,

                session,

                extra: {
                  currentViewingId:
                    finalViewing?._id ||
                    viewing?._id ||
                    null,
                },
              });
            }

            return {
              viewing:
                finalViewing ||
                viewing,

              lead:
                updatedLead,

              property:
                updatedProperty,
            };
          }
        );

      /* ------------------------------------------------------
         SOCKET TRANSPORT COMPATIBILITY
      ------------------------------------------------------ */

      req.io
        ?.to(
          String(
            transactionResult
              .viewing?._id
          )
        )
        .emit(
          "viewing_requested",
          {
            viewing:
              transactionResult.viewing,

            lead:
              transactionResult.lead,

            property:
              transactionResult.property,
          }
        );

      return res
        .status(201)
        .json({
          success:
            true,

          message:
            "Viewing request submitted successfully.",

          data:
            transactionResult,
        });
    } catch (
      error
    ) {
      console.error(
        "REQUEST VIEWING ERROR:",
        error
      );

      const statusCode =
        Number(
          error?.statusCode
        ) ||
        getServiceErrorStatus(
          error
        );

      return res
        .status(
          statusCode
        )
        .json({
          success:
            false,

          message:
            error?.message ||
            "Failed to create viewing request.",
        });
    }
  };

/* ==========================================================
   GET ALL VIEWINGS
========================================================== */

/**
 * GET
 * /api/viewings
 */
export const getAllViewings =
  async (
    req,
    res
  ) => {
    try {
      if (!req.user) {
        return res
          .status(401)
          .json({
            success:
              false,

            message:
              "Authenticated user not found.",
          });
      }

      const query =
        await applyOrganizationFilter(
          req
        );

      if (
        !query.organizationId
      ) {
        return res
          .status(401)
          .json({
            success:
              false,

            message:
              "Authenticated organization not found.",
          });
      }

      if (
        getRole(req) ===
        "agent"
      ) {
        query.agent =
          getAuthenticatedUserId(
            req
          );
      }

      if (
        getRole(req) ===
        "customer"
      ) {
        query.requestedBy =
          getAuthenticatedUserId(
            req
          );
      }

      const viewings =
        await Viewing.find(
          query
        )
          .populate(
            "lead",
            "name phone email budget location status"
          )
          .populate(
            "property",
            "title location city county price availability"
          )
          .populate(
            "agent",
            "name email phone"
          )
          .populate(
            "requestedBy",
            "name email"
          )
          .sort({
            viewingDate:
              1,

            startTime:
              1,
          });

      return res
        .status(200)
        .json({
          success:
            true,

          count:
            viewings.length,

          data:
            viewings,
        });
    } catch (
      error
    ) {
      console.error(
        "GET ALL VIEWINGS ERROR:",
        error
      );

      return res
        .status(500)
        .json({
          success:
            false,

          message:
            "Failed to load viewings.",

          error:
            process.env.NODE_ENV ===
            "development"
              ? error.message
              : undefined,
        });
    }
  };

/* ==========================================================
   GET UPCOMING VIEWINGS
========================================================== */

/**
 * GET
 * /api/viewings/upcoming
 */
export const getUpcomingViewings =
  async (
    req,
    res
  ) => {
    try {
      const query =
        await applyOrganizationFilter(
          req
        );

      if (
        !query.organizationId
      ) {
        return res
          .status(401)
          .json({
            success:
              false,

            message:
              "Authenticated organization not found.",
          });
      }

      const today =
        new Date();

      today.setHours(
        0,
        0,
        0,
        0
      );

      query.viewingDate =
        {
          $gte:
            today,
        };

      query.status =
        {
          $in:
            [
              ...VIEWING_SCHEDULED_STATUSES,
            ],
        };

      if (
        getRole(req) ===
        "agent"
      ) {
        query.agent =
          getAuthenticatedUserId(
            req
          );
      }

      const viewings =
        await Viewing.find(
          query
        )
          .populate(
            "lead",
            "name phone status"
          )
          .populate(
            "property",
            "title location"
          )
          .populate(
            "agent",
            "name email"
          )
          .sort({
            viewingDate:
              1,

            startTime:
              1,
          });

      return res
        .status(200)
        .json({
          success:
            true,

          count:
            viewings.length,

          data:
            viewings,
        });
    } catch (
      error
    ) {
      console.error(
        "GET UPCOMING VIEWINGS ERROR:",
        error
      );

      return res
        .status(500)
        .json({
          success:
            false,

          message:
            "Failed to fetch upcoming viewings.",

          error:
            error.message,
        });
    }
  };

/* ==========================================================
   GET TODAY VIEWINGS
========================================================== */

/**
 * GET
 * /api/viewings/today
 */
export const getTodayViewings =
  async (
    req,
    res
  ) => {
    try {
      const query =
        await applyOrganizationFilter(
          req
        );

      if (
        !query.organizationId
      ) {
        return res
          .status(401)
          .json({
            success:
              false,

            message:
              "Authenticated organization not found.",
          });
      }

      const start =
        new Date();

      start.setHours(
        0,
        0,
        0,
        0
      );

      const end =
        new Date();

      end.setHours(
        23,
        59,
        59,
        999
      );

      query.viewingDate =
        {
          $gte:
            start,

          $lte:
            end,
        };

      query.status =
        {
          $in:
            [
              ...VIEWING_SCHEDULED_STATUSES,
            ],
        };

      if (
        getRole(req) ===
        "agent"
      ) {
        query.agent =
          getAuthenticatedUserId(
            req
          );
      }

      const viewings =
        await Viewing.find(
          query
        )
          .populate(
            "lead",
            "name phone status"
          )
          .populate(
            "property",
            "title location"
          )
          .populate(
            "agent",
            "name email"
          )
          .sort({
            startTime:
              1,
          });

      return res
        .status(200)
        .json({
          success:
            true,

          count:
            viewings.length,

          data:
            viewings,
        });
    } catch (
      error
    ) {
      console.error(
        "TODAY VIEWINGS ERROR:",
        error
      );

      return res
        .status(500)
        .json({
          success:
            false,

          message:
            "Failed to fetch today's viewings.",

          error:
            error.message,
        });
    }
  };

/* ==========================================================
   GET VIEWING BY ID
========================================================== */

/**
 * GET
 * /api/viewings/:id
 */
export const getViewingById =
  async (
    req,
    res
  ) => {
    try {
      const query =
        await applyOrganizationFilter(
          req,
          {
            _id:
              req.params.id,
          }
        );

      if (
        !query.organizationId
      ) {
        return res
          .status(401)
          .json({
            success:
              false,

            message:
              "Authenticated organization not found.",
          });
      }

      const viewing =
        await Viewing.findOne(
          query
        )
          .populate(
            "lead"
          )
          .populate(
            "property"
          )
          .populate(
            "agent"
          )
          .populate(
            "approvedBy",
            "name email"
          );

      if (!viewing) {
        return res
          .status(404)
          .json({
            success:
              false,

            message:
              "Viewing not found.",
          });
      }

      if (
        getRole(req) ===
        "agent"
      ) {
        if (
          normalizeId(
            viewing.agent
          ) !==
          normalizeId(
            getAuthenticatedUserId(
              req
            )
          )
        ) {
          return res
            .status(403)
            .json({
              success:
                false,

              message:
                "You are not authorized to view this viewing.",
            });
        }
      }

      if (
        getRole(req) ===
        "customer"
      ) {
        if (
          normalizeId(
            viewing.requestedBy
          ) !==
          normalizeId(
            getAuthenticatedUserId(
              req
            )
          )
        ) {
          return res
            .status(403)
            .json({
              success:
                false,

              message:
                "You are not authorized to view this viewing.",
            });
        }
      }

      return res
        .status(200)
        .json({
          success:
            true,

          data:
            viewing,
        });
    } catch (
      error
    ) {
      console.error(
        "GET VIEWING ERROR:",
        error
      );

      return res
        .status(500)
        .json({
          success:
            false,

          message:
            "Failed to fetch viewing.",

          error:
            error.message,
        });
    }
  };

/* ==========================================================
   VIEWING AVAILABILITY
========================================================== */

/**
 * GET
 * /api/viewings/availability
 *
 * Query:
 *
 * ?agentId=...
 * &date=2026-08-10
 */
export const getAvailableSlots =
  async (
    req,
    res
  ) => {
    try {
      const {
        agentId,
        date,
      } =
        req.query;

      if (!date) {
        return res
          .status(400)
          .json({
            success:
              false,

            message:
              "date query parameter is required.",
          });
      }

      const organizationId =
        await getOrganizationId(
          req
        );

      if (
        !organizationId
      ) {
        return res
          .status(401)
          .json({
            success:
              false,

            message:
              "Authenticated organization not found.",
          });
      }

      let effectiveAgentId =
        agentId ||
        null;

      /**
       * Agents cannot inspect another
       * agent's schedule.
       */
      if (
        getRole(req) ===
        "agent"
      ) {
        effectiveAgentId =
          getAuthenticatedUserId(
            req
          );
      }

      if (
        !effectiveAgentId
      ) {
        return res
          .status(400)
          .json({
            success:
              false,

            message:
              "agentId is required.",
          });
      }

      const dateStart =
        new Date(
          `${date}T00:00:00`
        );

      const dateEnd =
        new Date(
          `${date}T23:59:59.999`
        );

      if (
        Number.isNaN(
          dateStart.getTime()
        ) ||
        Number.isNaN(
          dateEnd.getTime()
        )
      ) {
        return res
          .status(400)
          .json({
            success:
              false,

            message:
              "Invalid date.",
          });
      }

      const existingViewings =
        await Viewing.find({
          organizationId,

          agent:
            effectiveAgentId,

          viewingDate: {
            $gte:
              dateStart,

            $lte:
              dateEnd,
          },

          status: {
            $in: [
              ...VIEWING_REQUEST_STATUSES,

              ...VIEWING_SCHEDULED_STATUSES,
            ],
          },
        })
          .select(
            "startTime endTime viewingDate property status"
          )
          .sort({
            startTime:
              1,
          })
          .lean();

      /**
       * Default business hours.
       */
      const businessStart =
        8;

      const businessEnd =
        18;

      const slotDuration =
        60;

      const slots = [];

      for (
        let hour =
          businessStart;
        hour <
        businessEnd;
        hour++
      ) {
        const start =
          `${String(
            hour
          ).padStart(
            2,
            "0"
          )}:00`;

        const end =
          `${String(
            hour + 1
          ).padStart(
            2,
            "0"
          )}:00`;

        const conflict =
          existingViewings.some(
            (
              viewing
            ) => {
              const existingStart =
                String(
                  viewing.startTime ||
                    ""
                );

              const existingEnd =
                String(
                  viewing.endTime ||
                    ""
                );

              return (
                existingStart <
                  end &&
                existingEnd >
                  start
              );
            }
          );

        slots.push({
          startTime:
            start,

          endTime:
            end,

          available:
            !conflict,
        });
      }

      return res
        .status(200)
        .json({
          success:
            true,

          data: {
            date,

            agentId:
              effectiveAgentId,

            businessHours:
              {
                start:
                  `${businessStart}:00`,

                end:
                  `${businessEnd}:00`,
              },

            slotDuration,

            slots,
          },
        });
    } catch (
      error
    ) {
      console.error(
        "GET AVAILABLE SLOTS ERROR:",
        error
      );

      return res
        .status(500)
        .json({
          success:
            false,

          message:
            "Failed to fetch available viewing slots.",

          error:
            error.message,
        });
    }
  };

/* ==========================================================
   CHECK VIEWING CONFLICT
========================================================== */

/**
 * POST
 * /api/viewings/check-conflict
 */
export const checkViewingConflict =
  async (
    req,
    res
  ) => {
    try {
      const {
        propertyId,

        agentId,

        viewingDate,

        startTime,

        endTime,

        excludeViewingId,
      } =
        req.body ||
        {};

      const organizationId =
        await getOrganizationId(
          req
        );

      if (
        !organizationId
      ) {
        return res
          .status(401)
          .json({
            success:
              false,

            message:
              "Authenticated organization not found.",
          });
      }

      if (
        !viewingDate ||
        !startTime ||
        !endTime
      ) {
        return res
          .status(400)
          .json({
            success:
              false,

            message:
              "viewingDate, startTime and endTime are required.",
          });
      }

      const conflicts = [];

      /* ------------------------------------------------------
         PROPERTY CONFLICT
      ------------------------------------------------------ */

      if (
        propertyId
      ) {
        let propertyConflict =
          await checkPropertyConflict({
            organizationId,

            propertyId,

            viewingDate,

            startTime,

            endTime,
          });

        /**
         * When excluding a viewing,
         * repeat the tenant-scoped query
         * excluding that ID.
         */
        if (
          excludeViewingId &&
          propertyConflict
        ) {
          const excludedConflict =
            await Viewing.findOne({
              organizationId,

              property:
                propertyId,

              viewingDate,

              startTime,

              endTime,

              _id: {
                $ne:
                  excludeViewingId,
              },

              status: {
                $in: [
                  ...VIEWING_REQUEST_STATUSES,

                  ...VIEWING_SCHEDULED_STATUSES,
                ],
              },
            });

          propertyConflict =
            Boolean(
              excludedConflict
            );
        }

        if (
          propertyConflict
        ) {
          conflicts.push({
            type:
              "property",

            message:
              "Property already has a viewing scheduled at this time.",
          });
        }
      }

      /* ------------------------------------------------------
         AGENT CONFLICT
      ------------------------------------------------------ */

      if (
        agentId
      ) {
        let agentConflict =
          await checkAgentConflict({
            organizationId,

            agentId,

            viewingDate,

            startTime,

            endTime,
          });

        if (
          excludeViewingId &&
          agentConflict
        ) {
          const excludedConflict =
            await Viewing.findOne({
              organizationId,

              agent:
                agentId,

              viewingDate,

              startTime,

              endTime,

              _id: {
                $ne:
                  excludeViewingId,
              },

              status: {
                $in: [
                  ...VIEWING_REQUEST_STATUSES,

                  ...VIEWING_SCHEDULED_STATUSES,
                ],
              },
            });

          agentConflict =
            Boolean(
              excludedConflict
            );
        }

        if (
          agentConflict
        ) {
          conflicts.push({
            type:
              "agent",

            message:
              "Agent already has another viewing scheduled at this time.",
          });
        }
      }

      return res
        .status(200)
        .json({
          success:
            true,

          data: {
            conflict:
              conflicts.length >
              0,

            conflicts,

            requestedSlot: {
              viewingDate,

              startTime,

              endTime,
            },
          },
        });
    } catch (
      error
    ) {
      console.error(
        "CHECK VIEWING CONFLICT ERROR:",
        error
      );

      return res
        .status(500)
        .json({
          success:
            false,

          message:
            "Failed to check viewing conflict.",

          error:
            error.message,
        });
    }
  };

/* ==========================================================
   CALENDAR VIEWINGS
========================================================== */

/**
 * GET
 * /api/viewings/calendar
 */
export const getCalendarViewings =
  async (
    req,
    res
  ) => {
    try {
      const {
        date,

        startDate,

        endDate,
      } =
        req.query;

      const query =
        await applyOrganizationFilter(
          req
        );

      if (
        !query.organizationId
      ) {
        return res
          .status(401)
          .json({
            success:
              false,

            message:
              "Authenticated organization not found.",
          });
      }

      if (
        startDate &&
        endDate
      ) {
        const start =
          new Date(
            `${startDate}T00:00:00`
          );

        const end =
          new Date(
            `${endDate}T23:59:59.999`
          );

        if (
          Number.isNaN(
            start.getTime()
          ) ||
          Number.isNaN(
            end.getTime()
          )
        ) {
          return res
            .status(400)
            .json({
              success:
                false,

              message:
                "Invalid calendar date range.",
            });
        }

        query.viewingDate =
          {
            $gte:
              start,

            $lte:
              end,
          };
      } else if (
        date
      ) {
        const start =
          new Date(
            `${date}T00:00:00`
          );

        const end =
          new Date(
            `${date}T23:59:59.999`
          );

        if (
          Number.isNaN(
            start.getTime()
          ) ||
          Number.isNaN(
            end.getTime()
          )
        ) {
          return res
            .status(400)
            .json({
              success:
                false,

              message:
                "Invalid calendar date.",
            });
        }

        query.viewingDate =
          {
            $gte:
              start,

            $lte:
              end,
          };
      } else {
        return res
          .status(400)
          .json({
            success:
              false,

            message:
              "Provide date or startDate and endDate.",
          });
      }

      if (
        getRole(req) ===
        "agent"
      ) {
        query.agent =
          getAuthenticatedUserId(
            req
          );
      }

      const viewings =
        await Viewing.find(
          query
        )
          .populate(
            "lead",
            "name phone status"
          )
          .populate(
            "property",
            "title location price"
          )
          .populate(
            "agent",
            "name email"
          )
          .sort({
            viewingDate:
              1,

            startTime:
              1,
          });

      return res
        .status(200)
        .json({
          success:
            true,

          count:
            viewings.length,

          data:
            viewings,
        });
    } catch (
      error
    ) {
      console.error(
        "GET CALENDAR VIEWINGS ERROR:",
        error
      );

      return res
        .status(500)
        .json({
          success:
            false,

          message:
            "Failed to fetch calendar viewings.",

          error:
            error.message,
        });
    }
  };

/* ==========================================================
   AGENT VIEWINGS
========================================================== */

/**
 * GET
 * /api/viewings/agent/:agentId
 *
 * Admin may inspect an agent.
 *
 * Agents are restricted to their own records.
 */
export const getAgentViewings =
  async (
    req,
    res
  ) => {
    try {
      const {
        agentId:
          requestedAgentId,
      } =
        req.params;

      const organizationId =
        await getOrganizationId(
          req
        );

      if (
        !organizationId
      ) {
        return res
          .status(401)
          .json({
            success:
              false,

            message:
              "Authenticated organization not found.",
          });
      }

      let effectiveAgentId =
        requestedAgentId;

      if (
        getRole(req) ===
        "agent"
      ) {
        effectiveAgentId =
          getAuthenticatedUserId(
            req
          );

        if (
          normalizeId(
            requestedAgentId
          ) !==
          normalizeId(
            effectiveAgentId
          )
        ) {
          return res
            .status(403)
            .json({
              success:
                false,

              message:
                "Agents may only view their own viewing schedule.",
            });
        }
      }

      const viewings =
        await Viewing.find({
          organizationId,

          agent:
            effectiveAgentId,
        })
          .populate(
            "lead",
            "name phone budget status"
          )
          .populate(
            "property",
            "title location price"
          )
          .populate(
            "agent",
            "name email"
          )
          .sort({
            viewingDate:
              1,

            startTime:
              1,
          });

      return res
        .status(200)
        .json({
          success:
            true,

          agentId:
            effectiveAgentId,

          count:
            viewings.length,

          data:
            viewings,
        });
    } catch (
      error
    ) {
      console.error(
        "GET AGENT VIEWINGS ERROR:",
        error
      );

      return res
        .status(500)
        .json({
          success:
            false,

          message:
            "Failed to fetch agent viewings.",

          error:
            error.message,
        });
    }
  };

/* ==========================================================
   LEAD VIEWING HISTORY
========================================================== */

/**
 * GET
 * /api/viewings/lead/:leadId
 */
export const getLeadViewings =
  async (
    req,
    res
  ) => {
    try {
      const {
        leadId,
      } =
        req.params;

      const result =
        await findAccessibleLead(
          req,
          leadId
        );

      if (
        result.error
      ) {
        return res
          .status(
            result.error.status
          )
          .json({
            success:
              false,

            message:
              result.error.message,
          });
      }

      const organizationId =
        result.organizationId;

      const viewings =
        await Viewing.find({
          organizationId,

          lead:
            result.lead._id,
        })
          .populate(
            "property",
            "title location price"
          )
          .populate(
            "agent",
            "name email"
          )
          .sort({
            viewingDate:
              -1,

            startTime:
              -1,
          });

      return res
        .status(200)
        .json({
          success:
            true,

          leadId,

          count:
            viewings.length,

          data:
            viewings,
        });
    } catch (
      error
    ) {
      console.error(
        "GET LEAD VIEWINGS ERROR:",
        error
      );

      return res
        .status(500)
        .json({
          success:
            false,

          message:
            "Failed to fetch lead viewing history.",

          error:
            error.message,
        });
    }
  };

/* ==========================================================
   PROPERTY VIEWING HISTORY
========================================================== */

/**
 * GET
 * /api/viewings/property/:propertyId
 */
export const getPropertyViewings =
  async (
    req,
    res
  ) => {
    try {
      const {
        propertyId,
      } =
        req.params;

      const organizationId =
        await getOrganizationId(
          req
        );

      if (
        !organizationId
      ) {
        return res
          .status(401)
          .json({
            success:
              false,

            message:
              "Authenticated organization not found.",
          });
      }

      const property =
        await Property.findOne({
          _id:
            propertyId,

          organizationId,
        });

      if (!property) {
        return res
          .status(404)
          .json({
            success:
              false,

            message:
              "Property not found.",
          });
      }

      const viewings =
        await Viewing.find({
          organizationId,

          property:
            propertyId,
        })
          .populate(
            "lead",
            "name phone status"
          )
          .populate(
            "agent",
            "name email"
          )
          .sort({
            viewingDate:
              -1,

            startTime:
              -1,
          });

      return res
        .status(200)
        .json({
          success:
            true,

          propertyId,

          count:
            viewings.length,

          data:
            viewings,
        });
    } catch (
      error
    ) {
      console.error(
        "GET PROPERTY VIEWINGS ERROR:",
        error
      );

      return res
        .status(500)
        .json({
          success:
            false,

          message:
            "Failed to fetch property viewing history.",

          error:
            error.message,
        });
    }
  };

/* ==========================================================
   APPROVE VIEWING
========================================================== */

/**
 * PATCH
 * /api/viewings/:id/approve
 */
export const approveViewing = async (req, res) => {
  try {
    const operationId = getOperationId(
      req,
      `viewing-approve:${req.params.id}`
    );

    const transactionResult = await withReliableTransaction(
      async (session) => {
        // 1. Load and authorize the viewing inside the transaction.
        const result = await findAccessibleViewing(
          req,
          req.params.id,
          session
        );

        if (result.error) {
          const error = new Error(result.error.message);
          error.statusCode = result.error.status;
          throw error;
        }

        const { viewing, organizationId } = result;

        // 2. Load and authorize the related lead in the same transaction.
        const leadResult = await findAccessibleLead(
          req,
          normalizeId(viewing.lead),
          session
        );

        if (leadResult.error) {
          const error = new Error(leadResult.error.message);
          error.statusCode = leadResult.error.status;
          throw error;
        }

        const previousViewingStatus = viewing.status;
        const previousStatus = leadResult.lead.status;

        // 3. Perform all viewing business mutations through the service.
        // The service receives the existing transaction session.
        const updatedViewing = await approveViewingService({
          organizationId,
          viewingId: viewing._id,
          approvedBy: getAuthenticatedUserId(req),
          session,
        });

        // 4. Reload the resulting records within the same transaction.
        const finalViewing = await Viewing.findOne({
          _id: updatedViewing?._id || viewing._id,
          organizationId,
        }).session(session);

        if (!finalViewing) {
          throw new Error(
            "Approved viewing could not be reloaded."
          );
        }

        const updatedLead = await Lead.findOne({
          _id: viewing.lead,
          organizationId,
        }).session(session);

        const property = await Property.findOne({
          _id: viewing.property,
          organizationId,
        }).session(session);

        if (!updatedLead || !property) {
          throw new Error(
            "Approved viewing is missing its related lead or property."
          );
        }

        // 5. Persist the viewing business event in this transaction.
        await queueViewingBusinessEvent({
          viewing: finalViewing,
          lead: updatedLead,
          property,
          organizationId,
          previousViewingStatus,
          previousStatus,
          operationId,
          session,
        });

        // 6. Persist lifecycle events only when Lead.status changed.
        await queueLeadLifecycleEvents({
          lead: updatedLead,
          organizationId,
          previousStatus,
          operationId,
          session,
        });

        // 7. Persist read-model events in the same transaction.
        await queueLeadReadModelEvents({
          lead: updatedLead,
          organizationId,
          operationId,
          session,
          extra: {
            currentViewingId: finalViewing._id,
          },
        });

        return {
          viewing: finalViewing,
          lead: updatedLead,
          property,
        };
      }
    );

    return res.status(200).json({
      success: true,
      message: "Viewing approved successfully.",
      data: transactionResult.viewing,
    });
  } catch (error) {
    console.error("APPROVE VIEWING ERROR:", error);

    if (error?.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }

    return sendServiceError(
      res,
      error,
      "Failed to approve viewing."
    );
  }
};


/* ==========================================================
   REJECT VIEWING
========================================================== */

/**
 * PATCH
 * /api/viewings/:id/reject
 *
 * ATOMIC TRANSACTION:
 *   Viewing rejection
 *   Related lead changes
 *   Outbox events
 */
export const rejectViewing = async (req, res) => {
  try {
    const operationId = getOperationId(
      req,
      `viewing-reject:${req.params.id}`
    );

    const transactionResult = await withReliableTransaction(
      async (session) => {
        // 1. Load and authorize the viewing.
        const result = await findAccessibleViewing(
          req,
          req.params.id,
          session
        );

        if (result.error) {
          const error = new Error(result.error.message);
          error.statusCode = result.error.status;
          throw error;
        }

        const { viewing, organizationId } = result;

        // 2. Load and authorize the related lead.
        const leadResult = await findAccessibleLead(
          req,
          normalizeId(viewing.lead),
          session
        );

        if (leadResult.error) {
          const error = new Error(leadResult.error.message);
          error.statusCode = leadResult.error.status;
          throw error;
        }

        const previousStatus = leadResult.lead.status;

        // 3. Delegate the viewing mutation to the service.
        const updatedViewing = await rejectViewingService({
          organizationId,
          viewingId: viewing._id,
          rejectedBy: getAuthenticatedUserId(req),
          rejectionReason: req.body?.rejectionReason || null,
          session,
        });

        // 4. Reload final state inside the transaction.
        const finalViewing = await Viewing.findOne({
          _id: updatedViewing?._id || viewing._id,
          organizationId,
        }).session(session);

        if (!finalViewing) {
          throw new Error(
            "Rejected viewing could not be reloaded."
          );
        }

        const updatedLead = await Lead.findOne({
          _id: viewing.lead,
          organizationId,
        }).session(session);

        if (!updatedLead) {
          throw new Error(
            "Rejected viewing's lead could not be reloaded."
          );
        }

        // 5. Queue lead lifecycle events if the status changed.
        await queueLeadLifecycleEvents({
          lead: updatedLead,
          organizationId,
          previousStatus,
          operationId,
          session,
        });

        // 6. Queue read-model events in the same transaction.
        await queueLeadReadModelEvents({
          lead: updatedLead,
          organizationId,
          operationId,
          session,
          extra: {
            currentViewingId: finalViewing._id,
            viewingStatus: finalViewing.status,
          },
        });

        return {
          viewing: finalViewing,
          lead: updatedLead,
        };
      }
    );

    return res.status(200).json({
      success: true,
      message: "Viewing rejected successfully.",
      data: transactionResult.viewing,
    });
  } catch (error) {
    console.error("REJECT VIEWING ERROR:", error);

    if (error?.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }

    return sendServiceError(
      res,
      error,
      "Failed to reject viewing."
    );
  }
};

/* ==========================================================
   RESCHEDULE VIEWING
========================================================== */

/**
 * PATCH
 * /api/viewings/:id/reschedule
 */
export const rescheduleViewing = async (req, res) => {
  try {
    const {
      viewingDate,
      startTime,
      endTime,
    } = req.body || {};

    if (!viewingDate || !startTime || !endTime) {
      return res.status(400).json({
        success: false,
        message:
          "viewingDate, startTime and endTime are required.",
      });
    }

    const operationId = getOperationId(
      req,
      `viewing-reschedule:${req.params.id}`
    );

    const transactionResult = await withReliableTransaction(
      async (session) => {
        // 1. Load and authorize the viewing.
        const result = await findAccessibleViewing(
          req,
          req.params.id,
          session
        );

        if (result.error) {
          const error = new Error(result.error.message);
          error.statusCode = result.error.status;
          throw error;
        }

        const { viewing, organizationId } = result;

        // 2. Load and authorize the related lead.
        const leadResult = await findAccessibleLead(
          req,
          normalizeId(viewing.lead),
          session
        );

        if (leadResult.error) {
          const error = new Error(leadResult.error.message);
          error.statusCode = leadResult.error.status;
          throw error;
        }

        const previousStatus = leadResult.lead.status;

        // 3. Delegate scheduling changes to viewingService.
        const updatedViewing = await rescheduleViewingService({
          organizationId,
          viewingId: viewing._id,
          viewingDate,
          startTime,
          endTime,
          session,
        });

        // 4. Reload resulting state.
        const finalViewing = await Viewing.findOne({
          _id: updatedViewing?._id || viewing._id,
          organizationId,
        }).session(session);

        if (!finalViewing) {
          throw new Error(
            "Rescheduled viewing could not be reloaded."
          );
        }

        const updatedLead = await Lead.findOne({
          _id: viewing.lead,
          organizationId,
        }).session(session);

        if (!updatedLead) {
          throw new Error(
            "Rescheduled viewing's lead could not be reloaded."
          );
        }

        // 5. Persist any lead lifecycle changes.
        await queueLeadLifecycleEvents({
          lead: updatedLead,
          organizationId,
          previousStatus,
          operationId,
          session,
        });

        // 6. Persist lead read-model updates.
        await queueLeadReadModelEvents({
          lead: updatedLead,
          organizationId,
          operationId,
          session,
          extra: {
            currentViewingId: finalViewing._id,
            viewingStatus: finalViewing.status,
            viewingDate: finalViewing.viewingDate,
            startTime: finalViewing.startTime,
            endTime: finalViewing.endTime,
          },
        });

        return {
          viewing: finalViewing,
          lead: updatedLead,
        };
      }
    );

    return res.status(200).json({
      success: true,
      message: "Viewing rescheduled successfully.",
      data: transactionResult.viewing,
    });
  } catch (error) {
    console.error("RESCHEDULE VIEWING ERROR:", error);

    if (error?.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }

    return sendServiceError(
      res,
      error,
      "Failed to reschedule viewing."
    );
  }
};

/* ==========================================================
   CANCEL VIEWING
========================================================== */

/**
 * PATCH
 * /api/viewings/:id/cancel
 */
export const cancelViewing = async (req, res) => {
  try {
    const operationId = getOperationId(
      req,
      `viewing-cancel:${req.params.id}`
    );

    const transactionResult = await withReliableTransaction(
      async (session) => {
        // 1. Load and authorize the viewing.
        const result = await findAccessibleViewing(
          req,
          req.params.id,
          session
        );

        if (result.error) {
          const error = new Error(result.error.message);
          error.statusCode = result.error.status;
          throw error;
        }

        const { viewing, organizationId } = result;

        // 2. Load and authorize the related lead.
        const leadResult = await findAccessibleLead(
          req,
          normalizeId(viewing.lead),
          session
        );

        if (leadResult.error) {
          const error = new Error(leadResult.error.message);
          error.statusCode = leadResult.error.status;
          throw error;
        }

        const previousViewingStatus = viewing.status;
        const previousStatus = leadResult.lead.status;

        // 3. Delegate cancellation to viewingService.
        const updatedViewing = await cancelViewingService({
          organizationId,
          viewingId: viewing._id,
          session,
        });

        // 4. Reload final records.
        const finalViewing = await Viewing.findOne({
          _id: updatedViewing?._id || viewing._id,
          organizationId,
        }).session(session);

        if (!finalViewing) {
          throw new Error(
            "Cancelled viewing could not be reloaded."
          );
        }

        const updatedLead = await Lead.findOne({
          _id: viewing.lead,
          organizationId,
        }).session(session);

        const property = await Property.findOne({
          _id: viewing.property,
          organizationId,
        }).session(session);

        if (!updatedLead || !property) {
          throw new Error(
            "Cancelled viewing is missing its related lead or property."
          );
        }

        // 5. Persist the canonical viewing cancellation event.
        await queueViewingBusinessEvent({
          viewing: finalViewing,
          lead: updatedLead,
          property,
          organizationId,
          previousViewingStatus,
          previousStatus,
          operationId,
          session,
        });

        // 6. Persist lead lifecycle changes.
        await queueLeadLifecycleEvents({
          lead: updatedLead,
          organizationId,
          previousStatus,
          operationId,
          session,
        });

        // 7. Persist read-model updates.
        await queueLeadReadModelEvents({
          lead: updatedLead,
          organizationId,
          operationId,
          session,
          extra: {
            currentViewingId: finalViewing._id,
            viewingStatus: finalViewing.status,
          },
        });

        return {
          viewing: finalViewing,
          lead: updatedLead,
          property,
        };
      }
    );

    return res.status(200).json({
      success: true,
      message: "Viewing cancelled successfully.",
      data: transactionResult.viewing,
    });
  } catch (error) {
    console.error("CANCEL VIEWING ERROR:", error);

    if (error?.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }

    return sendServiceError(
      res,
      error,
      "Failed to cancel viewing."
    );
  }
};


/* ==========================================================
   COMPLETE VIEWING
========================================================== */

/**
 * PATCH
 * /api/viewings/:id/complete
 */
export const completeViewing = async (req, res) => {
  try {
    const operationId = getOperationId(
      req,
      `viewing-complete:${req.params.id}`
    );

    const transactionResult = await withReliableTransaction(
      async (session) => {
        // 1. Load and authorize the viewing.
        const result = await findAccessibleViewing(
          req,
          req.params.id,
          session
        );

        if (result.error) {
          const error = new Error(result.error.message);
          error.statusCode = result.error.status;
          throw error;
        }

        const { viewing, organizationId } = result;

        // 2. Load and authorize the related lead.
        const leadResult = await findAccessibleLead(
          req,
          normalizeId(viewing.lead),
          session
        );

        if (leadResult.error) {
          const error = new Error(leadResult.error.message);
          error.statusCode = leadResult.error.status;
          throw error;
        }

        const previousViewingStatus = viewing.status;
        const previousStatus = leadResult.lead.status;

        // 3. Delegate viewing completion to viewingService.
        const updatedViewing = await completeViewingService({
          organizationId,
          viewingId: viewing._id,
          session,
        });

        // 4. Reload the resulting state.
        const finalViewing = await Viewing.findOne({
          _id: updatedViewing?._id || viewing._id,
          organizationId,
        }).session(session);

        if (!finalViewing) {
          throw new Error(
            "Completed viewing could not be reloaded."
          );
        }

        const updatedLead = await Lead.findOne({
          _id: viewing.lead,
          organizationId,
        }).session(session);

        const property = await Property.findOne({
          _id: viewing.property,
          organizationId,
        }).session(session);

        if (!updatedLead || !property) {
          throw new Error(
            "Completed viewing is missing its related lead or property."
          );
        }

        // 5. Persist the canonical viewing completion event.
        await queueViewingBusinessEvent({
          viewing: finalViewing,
          lead: updatedLead,
          property,
          organizationId,
          previousViewingStatus,
          previousStatus,
          operationId,
          session,
        });

        // 6. Persist lifecycle changes only if the lead changed.
        await queueLeadLifecycleEvents({
          lead: updatedLead,
          organizationId,
          previousStatus,
          operationId,
          session,
        });

        // 7. Persist read-model updates.
        await queueLeadReadModelEvents({
          lead: updatedLead,
          organizationId,
          operationId,
          session,
          extra: {
            currentViewingId: finalViewing._id,
            viewingStatus: finalViewing.status,
          },
        });

        return {
          viewing: finalViewing,
          lead: updatedLead,
          property,
        };
      }
    );

    return res.status(200).json({
      success: true,
      message: "Viewing completed successfully.",
      data: transactionResult.viewing,
    });
  } catch (error) {
    console.error("COMPLETE VIEWING ERROR:", error);

    if (error?.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }

    return sendServiceError(
      res,
      error,
      "Failed to complete viewing."
    );
  }
};


/* ==========================================================
   SUBMIT FEEDBACK
========================================================== */

/**
 * POST
 * /api/viewings/:id/feedback
 *
 * ATOMIC TRANSACTION:
 *   Viewing feedback
 *   Property rating updates
 *   Lead lifecycle changes
 *   Lead updates
 *   Outbox events
 */
export const submitFeedback = async (req, res) => {
  try {
    const {
      viewerRating,
      viewerComment,
      agentOutcome,
      followUpRequired,
    } = req.body || {};

    // Validate rating before opening the transaction.
    let normalizedRating = viewerRating;

    if (
      viewerRating !== undefined &&
      viewerRating !== null &&
      viewerRating !== ""
    ) {
      normalizedRating = Number(viewerRating);

      if (
        Number.isNaN(normalizedRating) ||
        normalizedRating < 1 ||
        normalizedRating > 5
      ) {
        return res.status(400).json({
          success: false,
          message: "Viewer rating must be between 1 and 5.",
        });
      }
    }

    // Normalize the outcome before opening the transaction.
    const normalizedOutcome = normalizeFeedbackOutcome(
      agentOutcome
    );

    if (
      agentOutcome !== undefined &&
      agentOutcome !== null &&
      agentOutcome !== "" &&
      !normalizedOutcome
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid agent outcome.",
      });
    }

    const operationId = getOperationId(
      req,
      `viewing-feedback:${req.params.id}`
    );

    const transactionResult = await withReliableTransaction(
      async (session) => {
        // 1. Load and authorize the viewing.
        const result = await findAccessibleViewing(
          req,
          req.params.id,
          session
        );

        if (result.error) {
          const error = new Error(result.error.message);
          error.statusCode = result.error.status;
          throw error;
        }

        const { viewing, organizationId } = result;

        // 2. Load and authorize the related lead.
        const leadResult = await findAccessibleLead(
          req,
          normalizeId(viewing.lead),
          session
        );

        if (leadResult.error) {
          const error = new Error(leadResult.error.message);
          error.statusCode = leadResult.error.status;
          throw error;
        }

        const lead = leadResult.lead;
        const previousStatus = lead.status;

        // 3. Persist viewing feedback through the service.
        // The service must use this session for every DB write.
        await submitFeedbackService({
          organizationId,
          viewingId: viewing._id,
          viewerRating: normalizedRating,
          viewerComment:
            typeof viewerComment === "string"
              ? viewerComment.trim()
              : viewerComment,
          agentOutcome: normalizedOutcome,
          followUpRequired: Boolean(followUpRequired),
          session,
        });

        // 4. Reload viewing state in this transaction.
        const finalViewing = await Viewing.findOne({
          _id: viewing._id,
          organizationId,
        }).session(session);

        if (!finalViewing) {
          throw new Error(
            "Viewing could not be reloaded after feedback submission."
          );
        }

        // 5. Apply lifecycle transition through the lifecycle service.
        const requestedLeadStatus = normalizedOutcome
          ? getLeadStatusFromViewingOutcome(normalizedOutcome)
          : null;

        if (
          requestedLeadStatus &&
          lead.status !== requestedLeadStatus
        ) {
          applyLeadStatusTransition(
            lead,
            requestedLeadStatus
          );
        }

        // 6. Apply follow-up rules.
        if (
          normalizedOutcome === "Needs Follow Up" ||
          normalizedOutcome === "Interested" ||
          followUpRequired
        ) {
          if (
            lead.followUpStatus !== "scheduled" &&
            lead.followUpStatus !== "completed"
          ) {
            lead.followUpStatus = "pending";
          }
        }

        // 7. Update lead contact/viewing references.
        lead.lastContact = new Date();
        lead.currentViewing = viewing._id;

        await lead.save({ session });

        // 8. Reload property after feedback service updates it.
        const property = await Property.findOne({
          _id: viewing.property,
          organizationId,
        }).session(session);

        if (!property) {
          throw new Error(
            "Viewing property could not be reloaded after feedback submission."
          );
        }

        // 9. Persist lead lifecycle events.
        await queueLeadLifecycleEvents({
          lead,
          organizationId,
          previousStatus,
          operationId,
          session,
        });

        // 10. Persist read-model events.
        await queueLeadReadModelEvents({
          lead,
          organizationId,
          operationId,
          session,
          extra: {
            currentViewingId: viewing._id,
            feedbackOutcome: normalizedOutcome,
            viewingStatus: finalViewing.status,
          },
        });

        return {
          viewing: finalViewing,
          lead,
          property,
        };
      }
    );

    return res.status(200).json({
      success: true,
      message: "Feedback submitted successfully.",
      data: transactionResult,
    });
  } catch (error) {
    console.error("SUBMIT FEEDBACK ERROR:", error);

    if (error?.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }

    return sendServiceError(
      res,
      error,
      "Failed to submit viewing feedback."
    );
  }
};


/* ==========================================================
   EXPORT
========================================================== */

export default {
  requestViewing,

  getAllViewings,

  getUpcomingViewings,

  getTodayViewings,

  getViewingById,

  getAvailableSlots,

  checkViewingConflict,

  getCalendarViewings,

  getAgentViewings,

  getLeadViewings,

  getPropertyViewings,

  approveViewing,

  rejectViewing,

  cancelViewing,

  rescheduleViewing,

  completeViewing,

  submitFeedback,
};