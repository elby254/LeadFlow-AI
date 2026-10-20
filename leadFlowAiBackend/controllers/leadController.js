/**
 * ==========================================================
 *
 * LEAD CONTROLLER
 *
 * ==========================================================
 *
 * RESPONSIBILITIES
 * ----------------------------------------------------------
 * • Lead retrieval
 * • Organization isolation
 * • Agent lead isolation
 * • Lead follow-up
 * • Call history
 * • Agent notes
 * • Viewing orchestration
 * • Viewing access control
 * • Viewing business-event queuing
 * • Lead lifecycle event queuing
 * • AI insight synchronization
 *
 * ==========================================================
 *
 * CANONICAL LEAD WORKFLOW
 * ----------------------------------------------------------
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
 * IMPORTANT
 * ----------------------------------------------------------
 *
 * "hot" is NOT a Lead.status.
 *
 * Hotness is derived from:
 *
 *   lead.score >= HOT_SCORE_THRESHOLD
 *
 * Viewing workflow belongs to:
 *
 *   Viewing.status
 *
 * Follow-up workflow belongs to:
 *
 *   Lead.followUpStatus
 *   Lead.followUpOutcome
 *
 * Lifecycle transitions are controlled by:
 *
 *   services/leadLifeCycleService.js
 *
 * Score semantics are controlled by:
 *
 *   services/leadScoringRulesEngine.js
 *
 * Viewing business mutations are controlled by:
 *
 *   services/viewingService.js
 *
 * Business-event reliability is controlled by:
 *
 *   services/outboxIntegrationService.js
 *
 * ==========================================================
 */

import { randomUUID } from "node:crypto";

import Lead from "../models/lead.js";
import Conversation from "../models/conversation.js";
import Property from "../models/property.js";
import Viewing from "../models/viewing.js";

/* ==========================================================
   OUTBOX / EVENT INTEGRATION
========================================================== */

import {
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
   ORGANIZATION RESOLUTION
========================================================== */

import {
  resolveFromRequest,
} from "../services/organizationResolverService.js";

/* ==========================================================
   LEAD LIFECYCLE
========================================================== */

import {
  isValidLeadStatus,
  canTransitionLeadStatus,
  transitionLeadStatus,
} from "../services/leadLifeCycleService.js";

/* ==========================================================
   LEAD SCORING
========================================================== */

import {
  getLeadCategory,
  HOT_SCORE_THRESHOLD,
} from "../services/leadScoringRulesEngine.js";

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
  submitFeedback as submitViewingFeedbackService,
} from "../services/viewingService.js";

/* ==========================================================
   CANONICAL LEAD STATUSES
========================================================== */

const VALID_LEAD_STATUSES = [
  "new",
  "contacted",
  "qualified",
  "viewing",
  "negotiation",
  "won",
  "lost",
];

/* ==========================================================
   FOLLOW-UP STATUSES
========================================================== */

const VALID_FOLLOW_UP_STATUSES = [
  "pending",
  "scheduled",
  "completed",
  "cancelled",
];

/* ==========================================================
   FOLLOW-UP OUTCOMES
========================================================== */

const VALID_FOLLOW_UP_OUTCOMES = [
  "no_answer",
  "interested",
  "viewing_scheduled",
  "not_interested",
  "callback",
];

/* ==========================================================
   VIEWING STATUSES
========================================================== */

const VIEWING_STATUS = Object.freeze({
  REQUESTED: "Requested",
  PENDING_APPROVAL: "Pending Approval",
  APPROVED: "Approved",
  RESCHEDULED: "Rescheduled",
  REJECTED: "Rejected",
  CANCELLED: "Cancelled",
  COMPLETED: "Completed",
});

/* ==========================================================
   HELPERS
========================================================== */

/**
 * Return authenticated user ID.
 */
const getUserId = (req) => {
  return (
    req.user?._id ||
    req.user?.id ||
    null
  );
};

/**
 * Normalize role.
 */
const getRole = (req) => {
  return String(
    req.user?.role || ""
  )
    .trim()
    .toLowerCase();
};

/**
 * Safely convert IDs.
 */
const stringifyId = (value) => {
  if (
    value === undefined ||
    value === null
  ) {
    return null;
  }

  return String(
    value?._id ||
      value?.id ||
      value
  );
};

/**
 * Generate a stable operation ID when the
 * upstream request does not already provide one.
 *
 * Request IDs are preferred so a retry can reuse
 * the same operation identity when available.
 */
const getOperationId = (
  req,
  operation
) => {
  const requestId =
    req.id ||
    req.requestId ||
    req.headers?.["x-request-id"] ||
    req.headers?.["x-correlation-id"] ||
    null;

  if (requestId) {
    return `${operation}:${String(
      requestId
    )}`;
  }

  return `${operation}:${randomUUID()}`;
};

/**
 * Resolve authenticated organization.
 */
const getAuthenticatedOrganization =
  async (req) => {
    return resolveFromRequest(req);
  };

/**
 * Resolve authenticated organization ID.
 */
const getAuthenticatedOrganizationId =
  async (req) => {
    const organization =
      await getAuthenticatedOrganization(
        req
      );

    return organization?._id || null;
  };

/**
 * Build organization-safe query.
 */
const buildOrganizationQuery = (
  req
) => {
  const organizationId =
    req.user?.organizationId;

  if (!organizationId) {
    return null;
  }

  return {
    organizationId,
  };
};

/**
 * Apply agent-level lead isolation.
 */
const applyRoleLeadFilter = (
  req,
  query = {}
) => {
  const role =
    getRole(req);

  const userId =
    getUserId(req);

  if (
    role === "agent"
  ) {
    query.assignedTo =
      userId;
  }

  return query;
};

/**
 * Find a lead the authenticated user
 * is allowed to access.
 */
const findAccessibleLead =
  async (
    req,
    leadId
  ) => {
    const organizationId =
      req.user?.organizationId;

    const role =
      getRole(req);

    const userId =
      getUserId(req);

    if (!organizationId) {
      return {
        error: {
          status: 403,
          message:
            "Organization not assigned.",
        },
      };
    }

    if (
      role === "agent" &&
      !userId
    ) {
      return {
        error: {
          status: 401,
          message:
            "Authenticated agent ID not found.",
        },
      };
    }

    const query = {
      _id: leadId,
      organizationId,
    };

    if (
      role === "agent"
    ) {
      query.assignedTo =
        userId;
    }

    const lead =
      await Lead.findOne(
        query
      );

    if (!lead) {
      return {
        error: {
          status: 404,
          message:
            "Lead not found or access denied.",
        },
      };
    }

    return {
      lead,
    };
  };

/**
 * Find a viewing the authenticated
 * user can manage.
 *
 * READ ONLY.
 *
 * No viewing mutation happens here.
 */
const findAccessibleViewing =
  async (
    req,
    viewingId
  ) => {
    const organization =
      await getAuthenticatedOrganization(
        req
      );

    if (!organization) {
      return {
        error: {
          status: 403,
          message:
            "Organization not assigned.",
        },
      };
    }

    const organizationId =
      organization._id;

    const viewing =
      await Viewing.findOne({
        _id: viewingId,
        organizationId,
      });

    if (!viewing) {
      return {
        error: {
          status: 404,
          message:
            "Viewing not found.",
        },
      };
    }

    const role =
      getRole(req);

    const userId =
      getUserId(req);

    if (
      role === "agent"
    ) {
      if (!userId) {
        return {
          error: {
            status: 401,
            message:
              "Authenticated agent ID not found.",
          },
        };
      }

      if (
        viewing.agent &&
        stringifyId(
          viewing.agent
        ) !==
          stringifyId(
            userId
          )
      ) {
        return {
          error: {
            status: 403,
            message:
              "You can only manage viewings assigned to you.",
          },
        };
      }
    }

    return {
      viewing,
      organizationId,
    };
  };

/**
 * Determine a reasonable HTTP status for
 * domain-service errors.
 */
const getServiceErrorStatus =
  (error) => {
    const code =
      error?.code;

    const message =
      String(
        error?.message || ""
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
        "during this period"
      ) ||
      message.includes(
        "scheduled"
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

/**
 * Send a normalized service error.
 */
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
        success: false,
        message:
          status === 500
            ? fallbackMessage
            : error?.message ||
              fallbackMessage,
      });
  };

/* ==========================================================
   LIFECYCLE TRANSITION AUTHORITY
========================================================== */

/**
 * The controller NEVER directly performs:
 *
 *   lead.status = ...
 *
 * Workflow changes go through:
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

      error.allowedStatuses =
        VALID_LEAD_STATUSES;

      throw error;
    }

    const currentStatus =
      lead.status;

    if (
      currentStatus ===
      nextStatus
    ) {
      return {
        changed: false,
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
      changed: true,
      previousStatus:
        currentStatus,
      status:
        lead.status,
    };
  };

/* ==========================================================
   AI INSIGHTS
========================================================== */

const buildAIInsights =
  (
    lead
  ) => {
    if (!lead) {
      return {
        buyingIntent: 0,
        urgency: "Low",
        budgetConfidence: 0,
        locationConfidence: 0,
        propertyTypeConfidence: 0,
        timelineConfidence: 0,
        missingInformation: [],
        recommendedAction:
          "",
      };
    }

    /* ========================================================
       BUYING INTENT
    ======================================================== */

    const rawScore =
      Number(
        lead.score
      );

    const buyingIntent =
      Number.isFinite(
        rawScore
      )
        ? Math.min(
            100,
            Math.max(
              0,
              rawScore
            )
          )
        : 0;

    /* ========================================================
       URGENCY
    ======================================================== */

    const moveDate =
      String(
        lead.moveDate || ""
      )
        .trim()
        .toLowerCase();

    let urgency =
      "Low";

    if (
      lead.urgent === true
    ) {
      urgency =
        "High";
    } else if (
      [
        "immediately",
        "urgent",
        "urgently",
        "as soon as possible",
        "asap",
        "right away",
        "need it now",
        "this month",
        "this week",
        "today",
        "tomorrow",
      ].includes(
        moveDate
      )
    ) {
      urgency =
        "High";
    } else if (
      [
        "next month",
        "next week",
        "next year",
      ].includes(
        moveDate
      )
    ) {
      urgency =
        "Medium";
    }

    /* ========================================================
       BUDGET CONFIDENCE
    ======================================================== */

    const budgetConfidence =
      lead.budget !==
        undefined &&
      lead.budget !==
        null &&
      lead.budget !==
        "" &&
      Number(
        lead.budget
      ) > 0
        ? 100
        : 0;

    /* ========================================================
       LOCATION CONFIDENCE
    ======================================================== */

    const locationConfidence =
      typeof lead.location ===
        "string" &&
      lead.location
        .trim()
        .length > 0
        ? 100
        : lead.location
        ? 100
        : 0;

    /* ========================================================
       PROPERTY TYPE CONFIDENCE
    ======================================================== */

    const propertyTypeConfidence =
      lead.propertyType !==
        undefined &&
      lead.propertyType !==
        null &&
      String(
        lead.propertyType
      ).trim() !== ""
        ? 100
        : 0;

    /* ========================================================
       TIMELINE CONFIDENCE
    ======================================================== */

    const timelineConfidence =
      lead.moveDate !==
        undefined &&
      lead.moveDate !==
        null &&
      String(
        lead.moveDate
      ).trim() !== ""
        ? 100
        : 0;

    /* ========================================================
       BEDROOM INFORMATION
    ======================================================== */

    const hasBedrooms =
      lead.bedrooms !==
        undefined &&
      lead.bedrooms !==
        null &&
      lead.bedrooms !==
        "";

    /* ========================================================
       MISSING INFORMATION
    ======================================================== */

    const missingInformation =
      [
        !lead.budget &&
          "Budget",

        !lead.location &&
          "Location",

        !hasBedrooms &&
          "Bedrooms",

        !lead.moveDate &&
          "Move Date",
      ].filter(
        Boolean
      );

    /* ========================================================
       RECOMMENDED ACTION
    ======================================================== */

    let recommendedAction =
      "Continue qualification";

    if (
      lead.urgent === true ||
      urgency === "High"
    ) {
      recommendedAction =
        "Contact customer urgently";
    }

    if (
      buyingIntent >=
        HOT_SCORE_THRESHOLD &&
      urgency !== "High"
    ) {
      recommendedAction =
        "Call today";
    }

    if (
      lead.status ===
      "viewing"
    ) {
      recommendedAction =
        "Prepare for viewing";
    }

    if (
      lead.followUpStatus ===
        "pending" ||
      lead.followUpStatus ===
        "scheduled"
    ) {
      recommendedAction =
        "Follow up";
    }

    switch (
      lead.status
    ) {
      case "new":
        if (
          buyingIntent <
            HOT_SCORE_THRESHOLD &&
          urgency !==
            "High"
        ) {
          recommendedAction =
            "Continue qualification";
        }
        break;

      case "contacted":
        if (
          urgency !==
          "High"
        ) {
          recommendedAction =
            "Continue qualification";
        }
        break;

      case "qualified":
        if (
          urgency ===
          "High"
        ) {
          recommendedAction =
            "Contact customer urgently";
        } else {
          recommendedAction =
            "Call tomorrow";
        }
        break;

      case "viewing":
        recommendedAction =
          "Prepare for viewing";
        break;

      case "negotiation":
        recommendedAction =
          "Continue negotiation";
        break;

      case "won":
        recommendedAction =
          "Complete closing";
        break;

      case "lost":
        recommendedAction =
          "Review lost lead";
        break;

      default:
        recommendedAction =
          "Continue qualification";
    }

    const allowedUrgencies = [
      "Low",
      "Medium",
      "High",
    ];

    if (
      !allowedUrgencies.includes(
        urgency
      )
    ) {
      console.warn(
        "⚠️ INVALID LEAD URGENCY DETECTED:",
        urgency
      );

      urgency =
        "Low";
    }

    return {
      buyingIntent,
      urgency,
      budgetConfidence,
      locationConfidence,
      propertyTypeConfidence,
      timelineConfidence,
      missingInformation,
      recommendedAction,
    };
  };

/**
 * Synchronize AI insights.
 */
const synchronizeAIInsights =
  async (
    lead,
    save = true
  ) => {
    const aiInsights =
      buildAIInsights(
        lead
      );

    lead.aiInsights =
      aiInsights;

    if (save) {
      await lead.save();
    }

    return aiInsights;
  };

/* ==========================================================
   LEAD EVENT PAYLOAD
========================================================== */

const buildLeadEventPayload =
  (
    lead,
    extra = {}
  ) => {
    if (!lead) {
      return null;
    }

    return {
      leadId:
        stringifyId(
          lead._id
        ),

      organizationId:
        stringifyId(
          lead.organizationId
        ),

      name:
        lead.name ||
        "Unknown",

      phone:
        lead.phone ||
        null,

      status:
        lead.status ||
        "new",

      score:
        Number(
          lead.score || 0
        ),

      scoreCategory:
        getLeadCategory(
          Number(
            lead.score || 0
          )
        ),

      assignedTo:
        lead.assignedTo
          ? stringifyId(
              lead.assignedTo
            )
          : null,

      currentViewingId:
        lead.currentViewing
          ? stringifyId(
              lead.currentViewing
            )
          : null,

      followUpStatus:
        lead.followUpStatus ||
        null,

      updatedAt:
        lead.updatedAt ||
        new Date(),

      ...extra,
    };
  };

/* ==========================================================
   READ-MODEL OUTBOX EVENTS
========================================================== */

/**
 * LEAD_UPDATED and PIPELINE_UPDATED are read-model events.
 *
 * They are still useful to the realtime layer, but unlike
 * lifecycle/viewing business events they do not carry
 * business-state authority.
 *
 * They are therefore queued as ordinary outbox events.
 */
const queueLeadReadModelEvents =
  async ({
    lead,
    organizationId,
    operationId,
    extra = {},
  }) => {
    if (!lead) {
      return;
    }

    const payload =
      buildLeadEventPayload(
        lead,
        {
          ...extra,

          occurredAt:
            new Date(),
        }
      );

    const aggregateId =
      stringifyId(
        lead._id
      );

    await createOutboxEvent({
      eventType:
        "lead.updated",

      aggregateType:
        "lead",

      aggregateId,

      organizationId,

      payload,

      deduplicationKey:
        `${operationId}:lead.updated`,
    });

    await createOutboxEvent({
      eventType:
        "lead.pipeline.updated",

      aggregateType:
        "lead",

      aggregateId,

      organizationId,

      payload,

      deduplicationKey:
        `${operationId}:lead.pipeline.updated`,
    });
  };

/* ==========================================================
   QUEUE LEAD LIFECYCLE EVENTS
========================================================== */

/**
 * Lifecycle business events are queued ONLY when Lead.status
 * actually changes.
 *
 * Canonical payload uses:
 *
 *   previousStatus
 *   status
 *
 * Never:
 *
 *   newStatus
 */
const queueLifecycleEvents =
  async ({
    lead,
    previousStatus,
    organizationId,
    operationId,
  }) => {
    if (!lead) {
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
      lead,
      organizationId,
      previousStatus,
      operationId,
    });

    if (
      currentStatus ===
      "won"
    ) {
      await addLeadWonEvent({
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
        lead,
        organizationId,
        previousStatus,
        operationId,
      });
    }
  };

/* ==========================================================
   QUEUE VIEWING BUSINESS EVENTS
========================================================== */

/**
 * Viewing business events are based on Viewing.status.
 *
 * Supported reliable events:
 *
 *   Requested
 *   Approved
 *   Completed
 *   Cancelled
 *
 * Rejected and Rescheduled remain represented by the
 * Viewing document plus read-model updates.
 */
const queueViewingBusinessEvent =
  async ({
    viewing,
    lead,
    property,
    organizationId,
    previousViewingStatus = null,
    previousLeadStatus = null,
    operationId,
  }) => {
    if (!viewing) {
      return;
    }

    const currentViewingStatus =
      viewing.status;

    const basePayload = {
      viewing,
      lead,
      property,
      organizationId,
      previousViewingStatus,
      previousStatus:
        previousLeadStatus,
      operationId,
    };

    switch (
      currentViewingStatus
    ) {
      case VIEWING_STATUS.REQUESTED:
        await addViewingRequestedEvent(
          basePayload
        );
        break;

      case VIEWING_STATUS.APPROVED:
        await addViewingConfirmedEvent(
          basePayload
        );
        break;

      case VIEWING_STATUS.COMPLETED:
        await addViewingCompletedEvent(
          basePayload
        );
        break;

      case VIEWING_STATUS.CANCELLED:
        await addViewingCancelledEvent(
          basePayload
        );
        break;

      default:
        break;
    }
  };

/* ==========================================================
   GET MY LEADS
========================================================== */

export const getMyLeads =
  async (
    req,
    res
  ) => {
    try {
      const organizationId =
        req.user?.organizationId;

      const role =
        getRole(req);

      const userId =
        getUserId(req);

      console.log(
        "\n========== GET MY LEADS =========="
      );

      console.log(
        "User:",
        req.user
      );

      console.log(
        "Role:",
        role
      );

      console.log(
        "User ID:",
        userId
      );

      console.log(
        "Organization ID:",
        organizationId
      );

      if (
        !organizationId
      ) {
        return res
          .status(403)
          .json({
            success: false,
            message:
              "Organization not assigned.",
          });
      }

      if (
        !userId &&
        role ===
          "agent"
      ) {
        return res
          .status(401)
          .json({
            success: false,
            message:
              "Authenticated agent ID not found.",
          });
      }

      const page =
        Math.max(
          parseInt(
            req.query.page,
            10
          ) || 1,
          1
        );

      const limit =
        Math.min(
          Math.max(
            parseInt(
              req.query.limit,
              10
            ) || 20,
            1
          ),
          100
        );

      const skip =
        (page - 1) *
        limit;

      const query = {
        organizationId,
      };

      if (
        role === "agent"
      ) {
        query.assignedTo =
          userId;
      }

      console.log(
        "My leads query:",
        query
      );

      const [
        leads,
        total,
      ] =
        await Promise.all([
          Lead.find(
            query
          )
            .sort({
              urgent: -1,
              score: -1,
              createdAt: -1,
            })
            .skip(
              skip
            )
            .limit(
              limit
            ),

          Lead.countDocuments(
            query
          ),
        ]);

      console.log(
        "Leads found:",
        leads.length
      );

      console.log(
        "Total leads:",
        total
      );

      return res
        .status(200)
        .json({
          success: true,
          data: leads,

          pagination: {
            page,
            limit,
            total,
            totalPages:
              Math.ceil(
                total /
                  limit
              ),
          },
        });
    } catch (error) {
      console.error(
        "\n========== GET MY LEADS ERROR ==========",
        error
      );

      return res
        .status(500)
        .json({
          success: false,
          message:
            "Failed to fetch assigned leads.",
          error:
            process.env.NODE_ENV ===
            "development"
              ? error.message
              : undefined,
        });
    }
  };

/* ==========================================================
   GET HOT LEADS
========================================================== */

export const getHotLeads =
  async (
    req,
    res
  ) => {
    try {
      const query =
        buildOrganizationQuery(
          req
        );

      if (!query) {
        return res
          .status(403)
          .json({
            success: false,
            message:
              "Organization not assigned.",
          });
      }

      query.score = {
        $gte:
          HOT_SCORE_THRESHOLD,
      };

      applyRoleLeadFilter(
        req,
        query
      );

      console.log(
        "🔥 GET HOT LEADS:",
        {
          userId:
            getUserId(
              req
            ),

          role:
            getRole(
              req
            ),

          organizationId:
            req.user
              ?.organizationId,

          query,
        }
      );

      const hotLeads =
        await Lead.find(
          query
        ).sort({
          score: -1,
          createdAt: -1,
        });

      return res
        .status(200)
        .json({
          success: true,
          data:
            hotLeads,
        });
    } catch (error) {
      console.error(
        "GET HOT LEADS ERROR:",
        error
      );

      return res
        .status(500)
        .json({
          success: false,
          message:
            "Failed to fetch hot leads.",
        });
    }
  };

/* ==========================================================
   GET NEW LEADS
========================================================== */

export const getNewLeads =
  async (
    req,
    res
  ) => {
    try {
      const query =
        buildOrganizationQuery(
          req
        );

      if (!query) {
        return res
          .status(403)
          .json({
            success: false,
            message:
              "Organization not assigned.",
          });
      }

      query.status =
        "new";

      applyRoleLeadFilter(
        req,
        query
      );

      const leads =
        await Lead.find(
          query
        )
          .sort({
            createdAt: -1,
          })
          .limit(10);

      return res
        .status(200)
        .json({
          success: true,
          data:
            leads,
        });
    } catch (error) {
      console.error(
        "GET NEW LEADS ERROR:",
        error
      );

      return res
        .status(500)
        .json({
          success: false,
          message:
            "Failed to fetch new leads.",
        });
    }
  };

/* ==========================================================
   GET ALL LEADS
========================================================== */

export const getAllLeads =
  async (
    req,
    res
  ) => {
    try {
      const query =
        buildOrganizationQuery(
          req
        );

      if (!query) {
        return res
          .status(403)
          .json({
            success: false,
            message:
              "Organization not assigned.",
          });
      }

      applyRoleLeadFilter(
        req,
        query
      );

      console.log(
        "📋 GET LEADS:",
        {
          userId:
            getUserId(
              req
            ),

          role:
            getRole(
              req
            ),

          query,
        }
      );

      const leads =
        await Lead.find(
          query
        ).sort({
          createdAt: -1,
        });

      return res
  .status(200)
  .json({
    success: true,
    count: leads.length,
    data: leads,
  });
    } catch (error) {
      console.error(
        "GET ALL LEADS ERROR:",
        error
      );

      return res
        .status(500)
        .json({
          success: false,
          message:
            "Failed to fetch leads.",
        });
    }
  };

/* ==========================================================
   GET LEAD BY ID
========================================================== */

export const getLeadById =
  async (
    req,
    res
  ) => {
    try {
      const { id } =
        req.params;

      console.log(
        "========== GET LEAD =========="
      );

      console.log(
        "Lead route param:",
        id
      );

      console.log(
        "Authenticated user:",
        {
          id:
            getUserId(
              req
            ),

          role:
            getRole(
              req
            ),

          organizationId:
            req.user
              ?.organizationId,
        }
      );

      const result =
        await findAccessibleLead(
          req,
          id
        );

      if (
        result.error
      ) {
        return res
          .status(
            result.error.status
          )
          .json({
            success: false,
            message:
              result.error.message,
          });
      }

      const lead =
        result.lead;

      const aiInsights =
        buildAIInsights(
          lead
        );

      console.log(
        "🤖 AI INSIGHTS:",
        {
          leadId:
            lead._id,

          score:
            lead.score,

          isComplete:
            lead.isComplete,

          location:
            lead.location,

          budget:
            lead.budget,

          bedrooms:
            lead.bedrooms,

          moveDate:
            lead.moveDate,

          propertyType:
            lead.propertyType,

          aiInsights,
        }
      );

      const organization =
        await getAuthenticatedOrganization(
          req
        );

      if (!organization) {
        return res
          .status(403)
          .json({
            success: false,
            message:
              "Organization not assigned.",
          });
      }

      const conversation =
        await Conversation.findOne(
          {
            leadId:
              lead._id,

            organizationId:
              organization._id,
          }
        );

      return res
        .status(200)
        .json({
          success: true,

          data: {
            lead,
            conversation,
            aiInsights,
          },
        });
    } catch (error) {
      console.error(
        "========== GET LEAD ERROR ==========",
        error
      );

      console.error(
        error.stack
      );

      return res
        .status(500)
        .json({
          success: false,
          message:
            "Failed to fetch lead.",
        });
    }
  };

/* ==========================================================
   GET FOLLOW-UP LEADS
========================================================== */

export const getFollowUpLeads =
  async (
    req,
    res
  ) => {
    try {
      const query =
        buildOrganizationQuery(
          req
        );

      if (!query) {
        return res
          .status(403)
          .json({
            success: false,
            message:
              "Organization not assigned.",
          });
      }

      query.followUpStatus =
        {
          $in: [
            "pending",
            "scheduled",
          ],
        };

      applyRoleLeadFilter(
        req,
        query
      );

      const leads =
        await Lead.find(
          query
        ).sort({
          nextFollowUpDate: 1,
          updatedAt: -1,
        });

      return res
        .status(200)
        .json({
          success: true,
          data:
            leads,
        });
    } catch (error) {
      console.error(
        "GET FOLLOW-UP LEADS ERROR:",
        error
      );

      return res
        .status(500)
        .json({
          success: false,
          message:
            "Failed to fetch follow-up leads.",
        });
    }
  };

/* ==========================================================
   UPDATE FOLLOW-UP
========================================================== */

export const updateFollowUp =
  async (
    req,
    res
  ) => {
    try {
      const { id } =
        req.params;

      const {
        nextFollowUpDate,
        nextAction,
        noteText,
        followUpStatus,
        followUpOutcome,
        status,
      } = req.body;

      const result =
        await findAccessibleLead(
          req,
          id
        );

      if (
        result.error
      ) {
        return res
          .status(
            result.error.status
          )
          .json({
            success: false,
            message:
              result.error.message,
          });
      }

      const lead =
        result.lead;

      const previousStatus =
        lead.status;

      if (
        nextFollowUpDate !==
        undefined
      ) {
        if (
          nextFollowUpDate ===
            null ||
          nextFollowUpDate ===
            ""
        ) {
          lead.nextFollowUpDate =
            null;
        } else {
          const date =
            new Date(
              nextFollowUpDate
            );

          if (
            Number.isNaN(
              date.getTime()
            )
          ) {
            return res
              .status(400)
              .json({
                success:
                  false,
                message:
                  "Invalid next follow-up date.",
              });
          }

          lead.nextFollowUpDate =
            date;
        }
      }

      if (
        nextAction !==
        undefined
      ) {
        lead.nextAction =
          String(
            nextAction
          ).trim();
      }

      if (
        noteText !==
        undefined
      ) {
        lead.noteText =
          String(
            noteText
          ).trim();
      }

      if (
        followUpStatus !==
        undefined
      ) {
        if (
          !VALID_FOLLOW_UP_STATUSES.includes(
            followUpStatus
          )
        ) {
          return res
            .status(400)
            .json({
              success:
                false,
              message:
                "Invalid follow-up status.",
            });
        }

        lead.followUpStatus =
          followUpStatus;
      }

      if (
        followUpOutcome !==
        undefined
      ) {
        if (
          followUpOutcome !==
            null &&
          !VALID_FOLLOW_UP_OUTCOMES.includes(
            followUpOutcome
          )
        ) {
          return res
            .status(400)
            .json({
              success:
                false,
              message:
                "Invalid follow-up outcome.",
            });
        }

        lead.followUpOutcome =
          followUpOutcome;
      }

      if (
        status !==
        undefined
      ) {
        try {
          applyLeadStatusTransition(
            lead,
            status
          );
        } catch (
          error
        ) {
          return sendServiceError(
            res,
            error,
            "Failed to update lead status."
          );
        }
      }

      lead.lastContact =
        new Date();

      lead.followUpUpdatedAt =
        new Date();

      lead.aiInsights =
        buildAIInsights(
          lead
        );

      await lead.save();

      const organizationId =
        stringifyId(
          lead.organizationId
        );

      const operationId =
        getOperationId(
          req,
          `lead-followup:${lead._id}`
        );

      await queueLifecycleEvents({
        lead,
        previousStatus,
        organizationId,
        operationId,
      });

      await queueLeadReadModelEvents({
        lead,
        organizationId,
        operationId,
      });

      return res
        .status(200)
        .json({
          success: true,

          message:
            "Follow-up updated successfully.",

          data:
            lead,
        });
    } catch (error) {
      console.error(
        "UPDATE FOLLOW-UP ERROR:",
        error
      );

      return res
        .status(500)
        .json({
          success: false,
          message:
            "Failed to update follow-up.",
        });
    }
  };

/* ==========================================================
   ADD CALL HISTORY
========================================================== */

export const addCallHistory =
  async (
    req,
    res
  ) => {
    try {
      const { id } =
        req.params;

      const {
        outcome,
        notes,
        nextFollowUpDate,
        followUpStatus,
        status,
      } = req.body;

      if (
        typeof outcome !==
          "string" ||
        !outcome.trim()
      ) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              "Call outcome is required.",
          });
      }

      const result =
        await findAccessibleLead(
          req,
          id
        );

      if (
        result.error
      ) {
        return res
          .status(
            result.error.status
          )
          .json({
            success: false,
            message:
              result.error.message,
          });
      }

      const lead =
        result.lead;

      const previousStatus =
        lead.status;

      let followUpDate =
        null;

      if (
        nextFollowUpDate !==
          undefined &&
        nextFollowUpDate !==
          null &&
        nextFollowUpDate !==
          ""
      ) {
        followUpDate =
          new Date(
            nextFollowUpDate
          );

        if (
          Number.isNaN(
            followUpDate.getTime()
          )
        ) {
          return res
            .status(400)
            .json({
              success: false,
              message:
                "Invalid next follow-up date.",
            });
        }
      }

      if (
        followUpStatus !==
          undefined &&
        followUpStatus !==
          null
      ) {
        if (
          !VALID_FOLLOW_UP_STATUSES.includes(
            followUpStatus
          )
        ) {
          return res
            .status(400)
            .json({
              success: false,
              message:
                "Invalid follow-up status.",
            });
        }
      }

      if (
        status !==
          undefined &&
        status !== ""
      ) {
        try {
          applyLeadStatusTransition(
            lead,
            status
          );
        } catch (
          error
        ) {
          return sendServiceError(
            res,
            error,
            "Failed to update lead status."
          );
        }
      }

      if (
        !Array.isArray(
          lead.callHistory
        )
      ) {
        lead.callHistory =
          [];
      }

      const callRecord = {
        calledAt:
          new Date(),

        outcome:
          outcome.trim(),

        notes:
          typeof notes ===
          "string"
            ? notes.trim()
            : "",

        nextFollowUpDate:
          followUpDate,

        agent:
          getUserId(
            req
          ),
      };

      lead.callHistory.push(
        callRecord
      );

      lead.lastContact =
        new Date();

      if (
        followUpDate
      ) {
        lead.nextFollowUpDate =
          followUpDate;
      }

      if (
        followUpStatus !==
        undefined
      ) {
        lead.followUpStatus =
          followUpStatus;
      }

      lead.followUpUpdatedAt =
        new Date();

      lead.aiInsights =
        buildAIInsights(
          lead
        );

      await lead.save();

      const organizationId =
        stringifyId(
          lead.organizationId
        );

      const operationId =
        getOperationId(
          req,
          `lead-call:${lead._id}`
        );

      await queueLifecycleEvents({
        lead,
        previousStatus,
        organizationId,
        operationId,
      });

      await queueLeadReadModelEvents({
        lead,
        organizationId,
        operationId,
      });

      return res
        .status(201)
        .json({
          success: true,

          message:
            "Call history added successfully.",

          data: {
            call:
              callRecord,

            leadId:
              lead._id,

            lastContact:
              lead.lastContact,

            nextFollowUpDate:
              lead.nextFollowUpDate,

            followUpStatus:
              lead.followUpStatus,

            status:
              lead.status,

            callHistory:
              lead.callHistory,

            aiInsights:
              lead.aiInsights,
          },
        });
    } catch (error) {
      console.error(
        "ADD CALL HISTORY ERROR:",
        error
      );

      return res
        .status(500)
        .json({
          success: false,
          message:
            "Failed to save call history.",
        });
    }
  };

/* ==========================================================
   ADD AGENT NOTE
========================================================== */

export const addAgentNote =
  async (
    req,
    res
  ) => {
    try {
      const { id } =
        req.params;

      const { text } =
        req.body;

      if (
        typeof text !==
          "string" ||
        !text.trim()
      ) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              "Note text is required.",
          });
      }

      const result =
        await findAccessibleLead(
          req,
          id
        );

      if (
        result.error
      ) {
        return res
          .status(
            result.error.status
          )
          .json({
            success: false,
            message:
              result.error.message,
          });
      }

      const lead =
        result.lead;

      if (
        !Array.isArray(
          lead.notes
        )
      ) {
        lead.notes =
          [];
      }

      lead.notes.push({
        text:
          text.trim(),

        createdAt:
          new Date(),

        createdBy:
          getUserId(
            req
          ),
      });

      lead.lastContact =
        new Date();

      lead.aiInsights =
        buildAIInsights(
          lead
        );

      await lead.save();

      const organizationId =
        stringifyId(
          lead.organizationId
        );

      const operationId =
        getOperationId(
          req,
          `lead-note:${lead._id}`
        );

      await queueLeadReadModelEvents({
        lead,
        organizationId,
        operationId,
      });

      console.log(
        "📝 AGENT NOTE ADDED:",
        {
          leadId:
            lead._id,

          agentId:
            getUserId(
              req
            ),
        }
      );

      return res
        .status(200)
        .json({
          success: true,

          message:
            "Agent note added successfully.",

          data:
            lead.notes,
        });
    } catch (error) {
      console.error(
        "ADD AGENT NOTE ERROR:",
        error
      );

      return res
        .status(500)
        .json({
          success: false,
          message:
            "Failed to add agent note.",
        });
    }
  };

/* ==========================================================
   REQUEST VIEWING
========================================================== */

export const requestViewing =
  async (
    req,
    res
  ) => {
    try {
      const { id } =
        req.params;

      const {
        propertyId,
        viewingDate,
        startTime,
        endTime,
        customerNotes,
      } = req.body;

      if (!propertyId) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              "Property is required.",
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
            success: false,
            message:
              "Viewing date, start time and end time are required.",
          });
      }

      const leadResult =
        await findAccessibleLead(
          req,
          id
        );

      if (
        leadResult.error
      ) {
        return res
          .status(
            leadResult.error.status
          )
          .json({
            success: false,
            message:
              leadResult.error.message,
          });
      }

      const lead =
        leadResult.lead;

      const organization =
        await getAuthenticatedOrganization(
          req
        );

      if (!organization) {
        return res
          .status(403)
          .json({
            success: false,
            message:
              "Organization not assigned.",
          });
      }

      const organizationId =
        organization._id;

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
            success: false,
            message:
              "Property not found.",
          });
      }

      const previousStatus =
        lead.status;

      const viewing =
        await requestViewingService({
          organizationId,

          requestedBy:
            getUserId(
              req
            ),

          leadId:
            lead._id,

          propertyId:
            property._id,

          agentId:
            stringifyId(
              property.assignedAgent ||
                getUserId(
                  req
                )
            ),

          viewingDate,

          startTime,

          endTime,

          customerNotes,
        });

      const updatedLead =
        await Lead.findOne({
          _id:
            lead._id,

          organizationId,
        });

      const viewingId =
        viewing?._id ||
        viewing?.viewing?._id ||
        viewing?.data?.viewing?._id;

      const updatedViewing =
        viewingId
          ? await Viewing.findOne({
              _id:
                viewingId,

              organizationId,
            })
          : viewing;

      const operationId =
        getOperationId(
          req,
          `viewing-request:${viewingId || lead._id}`
        );

      if (
        updatedLead
      ) {
        await queueLifecycleEvents({
          lead:
            updatedLead,

          previousStatus,

          organizationId,

          operationId,
        });
      }

      await queueViewingBusinessEvent({
        viewing:
          updatedViewing,

        lead:
          updatedLead,

        property,

        organizationId,

        previousViewingStatus:
          null,

        previousLeadStatus:
          previousStatus,

        operationId,
      });

      if (
        updatedLead
      ) {
        await queueLeadReadModelEvents({
          lead:
            updatedLead,

          organizationId,

          operationId,

          extra: {
            currentViewingId:
              viewingId
                ? stringifyId(
                    viewingId
                  )
                : null,
          },
        });
      }

      return res
        .status(201)
        .json({
          success: true,

          message:
            "Viewing requested.",

          data: {
            viewing:
              updatedViewing,

            lead:
              updatedLead,
          },
        });
    } catch (error) {
      console.error(
        "REQUEST VIEWING ERROR:",
        error
      );

      return sendServiceError(
        res,
        error,
        "Failed to request viewing."
      );
    }
  };

/* ==========================================================
   APPROVE VIEWING
========================================================== */

export const approveViewing =
  async (
    req,
    res
  ) => {
    try {
      const result =
        await findAccessibleViewing(
          req,
          req.params.id
        );

      if (
        result.error
      ) {
        return res
          .status(
            result.error.status
          )
          .json({
            success: false,
            message:
              result.error.message,
          });
      }

      const {
        viewing,
        organizationId,
      } =
        result;

      const previousViewingStatus =
        viewing.status;

      const leadResult =
        await findAccessibleLead(
          req,
          stringifyId(
            viewing.lead
          )
        );

      if (
        leadResult.error
      ) {
        return res
          .status(
            leadResult.error.status
          )
          .json({
            success: false,
            message:
              leadResult.error.message,
          });
      }

      const previousStatus =
        leadResult.lead.status;

      const updatedViewing =
        await approveViewingService({
          organizationId,

          viewingId:
            viewing._id,

          approvedBy:
            getUserId(
              req
            ),
        });

      const finalViewing =
        await Viewing.findOne({
          _id:
            updatedViewing?._id ||
            viewing._id,

          organizationId,
        });

      const updatedLead =
        await Lead.findOne({
          _id:
            viewing.lead,

          organizationId,
        });

      const operationId =
        getOperationId(
          req,
          `viewing-approve:${viewing._id}`
        );

      if (
        updatedLead
      ) {
        await queueLifecycleEvents({
          lead:
            updatedLead,

          previousStatus,

          organizationId,

          operationId,
        });
      }

      await queueViewingBusinessEvent({
        viewing:
          finalViewing ||
          updatedViewing,

        lead:
          updatedLead,

        property:
          null,

        organizationId,

        previousViewingStatus,

        previousLeadStatus:
          previousStatus,

        operationId,
      });

      if (
        updatedLead
      ) {
        await queueLeadReadModelEvents({
          lead:
            updatedLead,

          organizationId,

          operationId,
        });
      }

      return res
        .status(200)
        .json({
          success: true,

          message:
            "Viewing approved.",

          data: {
            viewing:
              finalViewing ||
              updatedViewing,

            lead:
              updatedLead,
          },
        });
    } catch (error) {
      console.error(
        "APPROVE VIEWING ERROR:",
        error
      );

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

export const rejectViewing =
  async (
    req,
    res
  ) => {
    try {
      const {
        rejectionReason,
      } =
        req.body;

      const result =
        await findAccessibleViewing(
          req,
          req.params.id
        );

      if (
        result.error
      ) {
        return res
          .status(
            result.error.status
          )
          .json({
            success: false,
            message:
              result.error.message,
          });
      }

      const {
        viewing,
        organizationId,
      } =
        result;

      const previousViewingStatus =
        viewing.status;

      const leadResult =
        await findAccessibleLead(
          req,
          stringifyId(
            viewing.lead
          )
        );

      if (
        leadResult.error
      ) {
        return res
          .status(
            leadResult.error.status
          )
          .json({
            success: false,
            message:
              leadResult.error.message,
          });
      }

      const previousStatus =
        leadResult.lead.status;

      const updatedViewing =
        await rejectViewingService({
          organizationId,

          viewingId:
            viewing._id,

          rejectedBy:
            getUserId(
              req
            ),

          rejectionReason:
            rejectionReason ||
            null,
        });

      const finalViewing =
        await Viewing.findOne({
          _id:
            updatedViewing?._id ||
            viewing._id,

          organizationId,
        });

      const updatedLead =
        await Lead.findOne({
          _id:
            viewing.lead,

          organizationId,
        });

      const operationId =
        getOperationId(
          req,
          `viewing-reject:${viewing._id}`
        );

      if (
        updatedLead
      ) {
        await queueLifecycleEvents({
          lead:
            updatedLead,

          previousStatus,

          organizationId,

          operationId,
        });

        await queueLeadReadModelEvents({
          lead:
            updatedLead,

          organizationId,

          operationId,
        });
      }

      return res
        .status(200)
        .json({
          success: true,

          message:
            "Viewing rejected.",

          data: {
            viewing:
              finalViewing ||
              updatedViewing,

            lead:
              updatedLead,
          },
        });
    } catch (error) {
      console.error(
        "REJECT VIEWING ERROR:",
        error
      );

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

export const rescheduleViewing =
  async (
    req,
    res
  ) => {
    try {
      const {
        viewingDate,
        startTime,
        endTime,
      } =
        req.body;

      if (
        !viewingDate ||
        !startTime ||
        !endTime
      ) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              "Viewing date, start time and end time are required.",
          });
      }

      const result =
        await findAccessibleViewing(
          req,
          req.params.id
        );

      if (
        result.error
      ) {
        return res
          .status(
            result.error.status
          )
          .json({
            success: false,
            message:
              result.error.message,
          });
      }

      const {
        viewing,
        organizationId,
      } =
        result;

      const previousViewingStatus =
        viewing.status;

      const leadResult =
        await findAccessibleLead(
          req,
          stringifyId(
            viewing.lead
          )
        );

      if (
        leadResult.error
      ) {
        return res
          .status(
            leadResult.error.status
          )
          .json({
            success: false,
            message:
              leadResult.error.message,
          });
      }

      const previousStatus =
        leadResult.lead.status;

      const updatedViewing =
        await rescheduleViewingService({
          organizationId,

          viewingId:
            viewing._id,

          viewingDate,

          startTime,

          endTime,
        });

      const finalViewing =
        await Viewing.findOne({
          _id:
            updatedViewing?._id ||
            viewing._id,

          organizationId,
        });

      const updatedLead =
        await Lead.findOne({
          _id:
            viewing.lead,

          organizationId,
        });

      const operationId =
        getOperationId(
          req,
          `viewing-reschedule:${viewing._id}`
        );

      if (
        updatedLead
      ) {
        await queueLifecycleEvents({
          lead:
            updatedLead,

          previousStatus,

          organizationId,

          operationId,
        });

        await queueLeadReadModelEvents({
          lead:
            updatedLead,

          organizationId,

          operationId,
        });
      }

      return res
        .status(200)
        .json({
          success: true,

          message:
            "Viewing rescheduled successfully.",

          data: {
            viewing:
              finalViewing ||
              updatedViewing,

            lead:
              updatedLead,
          },
        });
    } catch (error) {
      console.error(
        "RESCHEDULE VIEWING ERROR:",
        error
      );

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

export const cancelViewing =
  async (
    req,
    res
  ) => {
    try {
      const result =
        await findAccessibleViewing(
          req,
          req.params.id
        );

      if (
        result.error
      ) {
        return res
          .status(
            result.error.status
          )
          .json({
            success: false,
            message:
              result.error.message,
          });
      }

      const {
        viewing,
        organizationId,
      } =
        result;

      const previousViewingStatus =
        viewing.status;

      const leadResult =
        await findAccessibleLead(
          req,
          stringifyId(
            viewing.lead
          )
        );

      if (
        leadResult.error
      ) {
        return res
          .status(
            leadResult.error.status
          )
          .json({
            success: false,
            message:
              leadResult.error.message,
          });
      }

      const previousStatus =
        leadResult.lead.status;

      const updatedViewing =
        await cancelViewingService({
          organizationId,

          viewingId:
            viewing._id,
        });

      const finalViewing =
        await Viewing.findOne({
          _id:
            updatedViewing?._id ||
            viewing._id,

          organizationId,
        });

      const updatedLead =
        await Lead.findOne({
          _id:
            viewing.lead,

          organizationId,
        });

      const operationId =
        getOperationId(
          req,
          `viewing-cancel:${viewing._id}`
        );

      if (
        updatedLead
      ) {
        await queueLifecycleEvents({
          lead:
            updatedLead,

          previousStatus,

          organizationId,

          operationId,
        });
      }

      await queueViewingBusinessEvent({
        viewing:
          finalViewing ||
          updatedViewing,

        lead:
          updatedLead,

        property:
          null,

        organizationId,

        previousViewingStatus,

        previousLeadStatus:
          previousStatus,

        operationId,
      });

      if (
        updatedLead
      ) {
        await queueLeadReadModelEvents({
          lead:
            updatedLead,

          organizationId,

          operationId,
        });
      }

      return res
        .status(200)
        .json({
          success: true,

          message:
            "Viewing cancelled.",

          data: {
            viewing:
              finalViewing ||
              updatedViewing,

            lead:
              updatedLead,
          },
        });
    } catch (error) {
      console.error(
        "CANCEL VIEWING ERROR:",
        error
      );

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

export const completeViewing =
  async (
    req,
    res
  ) => {
    try {
      const result =
        await findAccessibleViewing(
          req,
          req.params.id
        );

      if (
        result.error
      ) {
        return res
          .status(
            result.error.status
          )
          .json({
            success: false,
            message:
              result.error.message,
          });
      }

      const {
        viewing,
        organizationId,
      } =
        result;

      const previousViewingStatus =
        viewing.status;

      const leadResult =
        await findAccessibleLead(
          req,
          stringifyId(
            viewing.lead
          )
        );

      if (
        leadResult.error
      ) {
        return res
          .status(
            leadResult.error.status
          )
          .json({
            success: false,
            message:
              leadResult.error.message,
          });
      }

      const previousStatus =
        leadResult.lead.status;

      /**
       * Completing a viewing is a Viewing workflow mutation.
       *
       * It does NOT automatically mean:
       *
       *   Lead.status = qualified
       *   Lead.status = negotiation
       *   Lead.status = won
       *
       * The viewingService owns completion semantics.
       */
      const updatedViewing =
        await completeViewingService({
          organizationId,

          viewingId:
            viewing._id,
        });

      const finalViewing =
        await Viewing.findOne({
          _id:
            updatedViewing?._id ||
            viewing._id,

          organizationId,
        });

      const updatedLead =
        await Lead.findOne({
          _id:
            viewing.lead,

          organizationId,
        });

      const operationId =
        getOperationId(
          req,
          `viewing-complete:${viewing._id}`
        );

      if (
        updatedLead
      ) {
        await queueLifecycleEvents({
          lead:
            updatedLead,

          previousStatus,

          organizationId,

          operationId,
        });
      }

      await queueViewingBusinessEvent({
        viewing:
          finalViewing ||
          updatedViewing,

        lead:
          updatedLead,

        property:
          null,

        organizationId,

        previousViewingStatus,

        previousLeadStatus:
          previousStatus,

        operationId,
      });

      if (
        updatedLead
      ) {
        await queueLeadReadModelEvents({
          lead:
            updatedLead,

          organizationId,

          operationId,
        });
      }

      return res
        .status(200)
        .json({
          success: true,

          message:
            "Viewing completed.",

          data: {
            viewing:
              finalViewing ||
              updatedViewing,

            lead:
              updatedLead,
          },
        });
    } catch (error) {
      console.error(
        "COMPLETE VIEWING ERROR:",
        error
      );

      return sendServiceError(
        res,
        error,
        "Failed to complete viewing."
      );
    }
  };

/* ==========================================================
   SUBMIT VIEWING FEEDBACK
========================================================== */

export const submitViewingFeedback =
  async (
    req,
    res
  ) => {
    try {
      const {
        viewerRating,
        viewerComment,
        agentOutcome,
        followUpRequired,
      } =
        req.body;

      const result =
        await findAccessibleViewing(
          req,
          req.params.id
        );

      if (
        result.error
      ) {
        return res
          .status(
            result.error.status
          )
          .json({
            success: false,
            message:
              result.error.message,
          });
      }

      const {
        viewing,
        organizationId,
      } =
        result;

      let normalizedRating =
        viewerRating;

      if (
        viewerRating !==
          undefined &&
        viewerRating !==
          null &&
        viewerRating !==
          ""
      ) {
        normalizedRating =
          Number(
            viewerRating
          );

        if (
          Number.isNaN(
            normalizedRating
          ) ||
          normalizedRating <
            1 ||
          normalizedRating >
            5
        ) {
          return res
            .status(400)
            .json({
              success: false,
              message:
                "Viewer rating must be between 1 and 5.",
            });
        }
      }

      const allowedOutcomes =
        [
          "interested",
          "negotiating",
          "follow_up",
          "not_interested",
          "no_decision",
        ];

      if (
        agentOutcome &&
        !allowedOutcomes.includes(
          agentOutcome
        )
      ) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              "Invalid agent outcome.",
          });
      }

      const leadResult =
        await findAccessibleLead(
          req,
          stringifyId(
            viewing.lead
          )
        );

      if (
        leadResult.error
      ) {
        return res
          .status(
            leadResult.error.status
          )
          .json({
            success: false,
            message:
              leadResult.error.message,
          });
      }

      const lead =
        leadResult.lead;

      const previousStatus =
        lead.status;

      await submitViewingFeedbackService({
        organizationId,

        viewingId:
          viewing._id,

        viewerRating:
          normalizedRating,

        viewerComment:
          typeof viewerComment ===
          "string"
            ? viewerComment.trim()
            : viewerComment,

        agentOutcome,

        followUpRequired:
          Boolean(
            followUpRequired
          ),
      });

      /* ------------------------------------------------------
         Business outcome → Lead lifecycle
      ------------------------------------------------------ */

      if (
        agentOutcome
      ) {
        let requestedLeadStatus =
          null;

        switch (
          agentOutcome
        ) {
          case "interested":
            requestedLeadStatus =
              "qualified";
            break;

          case "negotiating":
            requestedLeadStatus =
              "negotiation";
            break;

          case "follow_up":
            requestedLeadStatus =
              "qualified";
            break;

          case "not_interested":
            requestedLeadStatus =
              "lost";
            break;

          case "no_decision":
            requestedLeadStatus =
              "qualified";
            break;

          default:
            requestedLeadStatus =
              null;
        }

        if (
          requestedLeadStatus &&
          lead.status !==
            requestedLeadStatus
        ) {
          try {
            applyLeadStatusTransition(
              lead,
              requestedLeadStatus
            );
          } catch (
            error
          ) {
            return sendServiceError(
              res,
              error,
              "Failed to apply viewing outcome to lead lifecycle."
            );
          }
        }
      }

      /* ------------------------------------------------------
         Follow-up derived from viewing outcome
      ------------------------------------------------------ */

      if (
        agentOutcome ===
          "follow_up" ||
        agentOutcome ===
          "interested" ||
        agentOutcome ===
          "no_decision" ||
        followUpRequired
      ) {
        if (
          lead.followUpStatus !==
            "scheduled" &&
          lead.followUpStatus !==
            "completed"
        ) {
          lead.followUpStatus =
            "pending";
        }
      }

      lead.lastContact =
        new Date();

      lead.currentViewing =
        viewing._id;

      lead.aiInsights =
        buildAIInsights(
          lead
        );

      await lead.save();

      const finalViewing =
        await Viewing.findOne({
          _id:
            viewing._id,

          organizationId,
        });

      const operationId =
        getOperationId(
          req,
          `viewing-feedback:${viewing._id}`
        );

      await queueLifecycleEvents({
        lead,
        previousStatus,
        organizationId,
        operationId,
      });

      await queueLeadReadModelEvents({
        lead,
        organizationId,
        operationId,
        extra: {
          currentViewingId:
            stringifyId(
              viewing._id
            ),
        },
      });

      return res
        .status(200)
        .json({
          success: true,

          message:
            "Viewing feedback submitted successfully.",

          data: {
            viewing:
              finalViewing,

            lead,
          },
        });
    } catch (error) {
      console.error(
        "SUBMIT VIEWING FEEDBACK ERROR:",
        error
      );

      return sendServiceError(
        res,
        error,
        "Failed to submit viewing feedback."
      );
    }
  };

/* ==========================================================
   GET LEAD VIEWINGS
========================================================== */

export const getLeadViewings =
  async (
    req,
    res
  ) => {
    try {
      const { id } =
        req.params;

      const result =
        await findAccessibleLead(
          req,
          id
        );

      if (
        result.error
      ) {
        return res
          .status(
            result.error.status
          )
          .json({
            success: false,
            message:
              result.error.message,
          });
      }

      const lead =
        result.lead;

      const organization =
        await getAuthenticatedOrganization(
          req
        );

      if (!organization) {
        return res
          .status(403)
          .json({
            success: false,
            message:
              "Organization not assigned.",
          });
      }

      const viewings =
        await Viewing.find({
          lead:
            lead._id,

          organizationId:
            organization._id,
        })
          .populate(
            "property"
          )
          .populate(
            "agent"
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
          success: true,

          data:
            viewings,
        });
    } catch (error) {
      console.error(
        "GET LEAD VIEWINGS ERROR:",
        error
      );

      return res
        .status(500)
        .json({
          success: false,
          message:
            "Failed to fetch lead viewings.",
        });
    }
  };

/* ==========================================================
   DEFAULT EXPORT
========================================================== */

export default {
  getMyLeads,
  getHotLeads,
  getNewLeads,
  getAllLeads,
  getLeadById,
  getFollowUpLeads,
  updateFollowUp,
  addCallHistory,
  addAgentNote,
  requestViewing,
  approveViewing,
  rejectViewing,
  rescheduleViewing,
  cancelViewing,
  completeViewing,
  submitViewingFeedback,
  getLeadViewings,
};