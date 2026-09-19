/**
 * ==========================================================
 *
 * LEAD CONTROLLER
 *
 * Responsibilities
 * ----------------------------------------------------------
 * • Lead retrieval
 * • Agent lead isolation
 * • Organization isolation
 * • Lead follow-up
 * • Call history
 * • Agent notes
 * • Viewing workflow
 * • Viewing feedback
 * • Lead workflow synchronization
 * • Real-time lead events
 * • AI insight synchronization
 *
 * SECURITY MODEL
 * ----------------------------------------------------------
 *
 * ADMIN
 * → Can access organization leads
 *
 * AGENT
 * → Can ONLY access leads assigned to that agent
 *
 * VIEWER
 * → Read-only access according to route permissions
 *
 * IMPORTANT
 * ----------------------------------------------------------
 * This controller assumes protect() has already executed.
 *
 * req.user is therefore available.
 *
 * req.user:
 * {
 *   _id,
 *   id,
 *   role,
 *   organizationId
 * }
 *
 * ==========================================================
 */

import Lead from "../models/lead.js";
import Conversation from "../models/conversation.js";
import Property from "../models/property.js";
import Viewing from "../models/viewing.js";

import leadEventBus, {
  LEAD_EVENTS,
} from "../events/leadEvents.js";

/* ==========================================================
   HELPERS
========================================================== */

/**
 * Return authenticated user ID.
 */
const getUserId = (req) => {
  return req.user?._id || req.user?.id || null;
};

/**
 * Normalize role.
 */
const getRole = (req) => {
  return String(req.user?.role || "")
    .trim()
    .toLowerCase();
};

/**
 * ==========================================================
 * LEAD STATUS SOURCE OF TRUTH
 * ==========================================================
 *
 * IMPORTANT
 * ----------------------------------------------------------
 * These values MUST remain synchronized with the Lead schema.
 *
 * Lead.status:
 *
 * new
 * contacted
 * qualified
 * viewing
 * negotiation
 * won
 * lost
 *
 * Viewing-specific states belong to:
 *
 * lead.viewingStatus
 *
 * Follow-up-specific states belong to:
 *
 * lead.followUpStatus
 *
 * Lead urgency / hotness is represented by:
 *
 * lead.score
 *
 * ==========================================================
 */

const VALID_LEAD_STATUSES = [
  "new",
  "contacted",
  "qualified",
  "viewing",
  "negotiation",
  "won",
  "lost",
];

/**
 * Build organization-safe lead query.
 *
 * Every lead query should include organizationId.
 */
const buildOrganizationQuery = (req) => {
  const organizationId = req.user?.organizationId;

  if (!organizationId) {
    return null;
  }

  return {
    organizationId,
  };
};

/**
 * Apply strict agent isolation.
 *
 * ADMIN
 * → organization-wide
 *
 * AGENT
 * → assigned leads only
 *
 * VIEWER
 * → no agent assignment filtering here.
 *   Route-level permissions determine what viewers can access.
 */
const applyRoleLeadFilter = (req, query = {}) => {
  const role = getRole(req);
  const userId = getUserId(req);

  if (role === "agent") {
    query.assignedTo = userId;
  }

  return query;
};

/**
 * Get a lead while enforcing:
 *
 * 1. Authentication
 * 2. Organization isolation
 * 3. Agent assignment isolation
 *
 * This helper is intentionally used for lead mutation endpoints.
 */
const findAccessibleLead = async (req, leadId) => {
  const organizationId = req.user?.organizationId;
  const role = getRole(req);
  const userId = getUserId(req);

  if (!organizationId) {
    return {
      error: {
        status: 403,
        message: "Organization not assigned.",
      },
    };
  }

  const query = {
    _id: leadId,
    organizationId,
  };

  if (role === "agent") {
    query.assignedTo = userId;
  }

  const lead = await Lead.findOne(query);

  if (!lead) {
    return {
      error: {
        status: 404,
        message: "Lead not found or access denied.",
      },
    };
  }

  return { lead };
};

/**
 * ==========================================================
 * BUILD AI INSIGHTS
 * ==========================================================
 *
 * IMPORTANT
 * ----------------------------------------------------------
 * AI insights are derived from the actual Lead fields.
 *
 * buyingIntent:
 * → Lead.score
 *
 * urgency:
 * → Lead.urgent first
 * → moveDate second
 *
 * Lead.aiInsights.urgency MUST ALWAYS be:
 *
 * Low
 * Medium
 * High
 *
 * NEVER:
 *
 * Urgent
 * Normal
 *
 * ==========================================================
 */

const buildAIInsights = (lead) => {
  if (!lead) {
    return {
      buyingIntent: 0,
      urgency: "Low",
      budgetConfidence: 0,
      locationConfidence: 0,
      propertyTypeConfidence: 0,
      timelineConfidence: 0,
      missingInformation: [],
      recommendedAction: "",
    };
  }

  /* ========================================================
     BUYING INTENT
  ======================================================== */

  const rawScore = Number(lead.score);

  const buyingIntent = Number.isFinite(rawScore)
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

  const moveDate = String(
    lead.moveDate || ""
  )
    .trim()
    .toLowerCase();

  let urgency = "Low";

  /*
   * IMPORTANT:
   *
   * Explicit Lead urgency has priority.
   *
   * lead.urgent is a BOOLEAN signal.
   *
   * It does NOT mean the same thing as
   * AI priority.
   */

  if (lead.urgent === true) {
    urgency = "High";
  }

  /*
   * Timeline-based urgency.
   */

  else if (
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
    ].includes(moveDate)
  ) {
    urgency = "High";
  }

  else if (
    [
      "next month",
      "next week",
      "next year",
    ].includes(moveDate)
  ) {
    urgency = "Medium";
  }

  /* ========================================================
     BUDGET CONFIDENCE
  ======================================================== */

  const budgetConfidence =
    lead.budget !== undefined &&
    lead.budget !== null &&
    lead.budget !== "" &&
    Number(lead.budget) > 0
      ? 100
      : 0;

  /* ========================================================
     LOCATION CONFIDENCE
  ======================================================== */

  const locationConfidence =
    typeof lead.location === "string" &&
    lead.location.trim().length > 0
      ? 100
      : lead.location
      ? 100
      : 0;

  /* ========================================================
     PROPERTY TYPE CONFIDENCE
  ======================================================== */

  const propertyTypeConfidence =
    lead.propertyType !== undefined &&
    lead.propertyType !== null &&
    String(lead.propertyType).trim() !== ""
      ? 100
      : 0;

  /* ========================================================
     TIMELINE CONFIDENCE
  ======================================================== */

  const timelineConfidence =
    lead.moveDate !== undefined &&
    lead.moveDate !== null &&
    String(lead.moveDate).trim() !== ""
      ? 100
      : 0;

  /* ========================================================
     BEDROOM INFORMATION
  ======================================================== */

  const hasBedrooms =
    lead.bedrooms !== undefined &&
    lead.bedrooms !== null &&
    lead.bedrooms !== "";

  /* ========================================================
     MISSING INFORMATION
  ======================================================== */

  const missingInformation = [
    !lead.budget && "Budget",
    !lead.location && "Location",
    !hasBedrooms && "Bedrooms",
    !lead.moveDate && "Move Date",
  ].filter(Boolean);

  /* ========================================================
     RECOMMENDED ACTION
  ======================================================== */

  let recommendedAction =
    "Continue qualification";

  /* --------------------------------------------------------
     EXPLICIT URGENCY
  -------------------------------------------------------- */

  if (
    lead.urgent === true ||
    urgency === "High"
  ) {
    recommendedAction =
      "Contact customer urgently";
  }

  /* --------------------------------------------------------
     HIGH BUYING INTENT
  -------------------------------------------------------- */

  if (
    buyingIntent >= 80 &&
    urgency !== "High"
  ) {
    recommendedAction =
      "Call today";
  }

  /* --------------------------------------------------------
     VIEWING
  -------------------------------------------------------- */

  if (
    lead.viewingStatus ===
      "requested"
  ) {
    recommendedAction =
      "Prepare for viewing";
  }

  if (
    lead.viewingStatus ===
      "approved" ||
    lead.viewingStatus ===
      "scheduled" ||
    lead.viewingStatus ===
      "rescheduled"
  ) {
    recommendedAction =
      "Prepare for viewing";
  }

  /* --------------------------------------------------------
     FOLLOW-UP
  -------------------------------------------------------- */

  if (
    lead.followUpStatus ===
      "pending" ||
    lead.followUpStatus ===
      "scheduled"
  ) {
    recommendedAction =
      "Follow up";
  }

  /* --------------------------------------------------------
     VALID LEAD STATUS
  -------------------------------------------------------- */

  switch (lead.status) {
    case "new":

      if (
        buyingIntent < 80 &&
        urgency !== "High"
      ) {
        recommendedAction =
          "Continue qualification";
      }

      break;

    case "contacted":

      if (
        urgency !== "High"
      ) {
        recommendedAction =
          "Continue qualification";
      }

      break;

    case "qualified":

      if (
        urgency === "High"
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

      if (
        urgency === "High"
      ) {
        recommendedAction =
          "Contact customer urgently";
      } else {
        recommendedAction =
          "Continue qualification";
      }
  }

  /* ========================================================
     FINAL SAFETY CHECK
  ======================================================== */

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

    urgency = "Low";
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
 * ==========================================================
 * SYNCHRONIZE AI INSIGHTS
 * ==========================================================
 *
 * Calculates the AI insights and stores them directly on
 * the Lead document.
 *
 * This prevents the following problem:
 *
 * lead.aiInsights = {
 *   buyingIntent: 0,
 *   urgency: "Low",
 *   ...
 * }
 *
 * while the real lead data says:
 *
 * score: 81
 * budget: 120000
 * location: "Kilimani"
 * bedrooms: 3
 * moveDate: "next month"
 */
const synchronizeAIInsights = async (
  lead,
  save = true
) => {
  const aiInsights =
    buildAIInsights(lead);

  lead.aiInsights = aiInsights;

  if (save) {
    await lead.save();
  }

  return aiInsights;
};

/**
 * Emit a lead update event.
 */
const emitLeadUpdate = (lead) => {
  if (!lead) {
    return;
  }

  try {
    leadEventBus.emit(
      LEAD_EVENTS.LEAD_UPDATED,
      lead
    );

    leadEventBus.emit(
      LEAD_EVENTS.PIPELINE_UPDATE,
      lead
    );
  } catch (error) {
    console.error(
      "LEAD EVENT EMISSION ERROR:",
      error
    );
  }
};

// =====================================================
// GET MY LEADS
// =====================================================
//
// GET /api/lead/my?page=1&limit=20
//
// Agent:
//   Returns only leads assigned to the authenticated agent.
//
// Admin:
//   Can optionally see all organization leads.
//
// Organization isolation is ALWAYS enforced.
//
// =====================================================

export const getMyLeads = async (req, res) => {
  try {
    const organizationId = req.user?.organizationId;
    const role = getRole(req);
    const userId = getUserId(req);

    console.log("\n========== GET MY LEADS ==========");
    console.log("User:", req.user);
    console.log("Role:", role);
    console.log("User ID:", userId);
    console.log("Organization ID:", organizationId);

    if (!organizationId) {
      return res.status(403).json({
        success: false,
        message: "Organization not assigned.",
      });
    }

    if (!userId && role === "agent") {
      return res.status(401).json({
        success: false,
        message: "Authenticated agent ID not found.",
      });
    }

    const page = Math.max(
      parseInt(req.query.page, 10) || 1,
      1
    );

    const limit = Math.min(
      Math.max(
        parseInt(req.query.limit, 10) || 20,
        1
      ),
      100
    );

    const skip = (page - 1) * limit;

    const query = {
      organizationId,
    };

    // -------------------------------------------------
    // AGENT ISOLATION
    // -------------------------------------------------

    if (role === "agent") {
      query.assignedTo = userId;
    }

    console.log("My leads query:", query);

    const [leads, total] = await Promise.all([
      Lead.find(query)
        .sort({
          urgent: -1,
          score: -1,
          createdAt: -1,
        })
        .skip(skip)
        .limit(limit),

      Lead.countDocuments(query),
    ]);

    console.log("Leads found:", leads.length);
    console.log("Total leads:", total);

    return res.status(200).json({
      success: true,
      data: leads,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("\n========== GET MY LEADS ERROR ==========");
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch assigned leads.",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : undefined,
    });
  }
};

/* ==========================================================
   GET HOT LEADS
========================================================== */

/**
 * GET /api/lead/hot
 *
 * Returns hot leads visible to the authenticated user.
 *
 * IMPORTANT
 * ----------------------------------------------------------
 * "hot" is NOT a Lead.status value.
 *
 * Hot leads are determined by lead.score.
 *
 * ADMIN
 * → All hot leads in organization
 *
 * AGENT
 * → Only assigned hot leads
 */
export const getHotLeads = async (
  req,
  res
) => {
  try {
    const query =
      buildOrganizationQuery(req);

    if (!query) {
      return res.status(403).json({
        success: false,
        message:
          "Organization not assigned.",
      });
    }

    /**
     * HOT = score threshold.
     *
     * Keep this independent from Lead.status.
     */
    query.score = {
      $gte: 80,
    };

    applyRoleLeadFilter(
      req,
      query
    );

    console.log(
      "🔥 GET HOT LEADS:",
      {
        userId: getUserId(req),
        role: getRole(req),
        organizationId:
          req.user?.organizationId,
        query,
      }
    );

    const hotLeads =
      await Lead.find(query)
        .sort({
          score: -1,
          createdAt: -1,
        });

    return res.status(200).json({
      success: true,
      data: hotLeads,
    });
  } catch (error) {
    console.error(
      "GET HOT LEADS ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to fetch hot leads.",
    });
  }
};

/* ==========================================================
   GET NEW LEADS
========================================================== */

/**
 * GET /api/lead/new
 *
 * Returns recent leads visible to user.
 *
 * Agent:
 * → Assigned leads only.
 */
export const getNewLeads = async (
  req,
  res
) => {
  try {
    const query =
      buildOrganizationQuery(req);

    if (!query) {
      return res.status(403).json({
        success: false,
        message:
          "Organization not assigned.",
      });
    }

    /**
     * NEW means Lead.status = new.
     */
    query.status = "new";

    applyRoleLeadFilter(
      req,
      query
    );

    const leads =
      await Lead.find(query)
        .sort({
          createdAt: -1,
        })
        .limit(10);

    return res.status(200).json({
      success: true,
      data: leads,
    });
  } catch (error) {
    console.error(
      "GET NEW LEADS ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to fetch new leads.",
    });
  }
};

/* ==========================================================
   GET ALL LEADS
========================================================== */

/**
 * GET /api/lead
 *
 * ADMIN
 * → All organization leads
 *
 * AGENT
 * → Only assigned leads
 */
export const getAllLeads = async (
  req,
  res
) => {
  try {
    const query =
      buildOrganizationQuery(req);

    if (!query) {
      return res.status(403).json({
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
        userId: getUserId(req),
        role: getRole(req),
        query,
      }
    );

    const leads =
      await Lead.find(query)
        .sort({
          createdAt: -1,
        });

    return res.status(200).json({
      success: true,
      data: leads,
    });
  } catch (error) {
    console.error(
      "GET ALL LEADS ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to fetch leads.",
    });
  }
};

/* ==========================================================
   GET LEAD BY ID
========================================================== */

/**
 * GET /api/lead/:id
 *
 * Agent can ONLY open an assigned lead.
 */
export const getLeadById = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

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
        id: getUserId(req),
        role: getRole(req),
        organizationId:
          req.user?.organizationId,
      }
    );

    const result =
      await findAccessibleLead(
        req,
        id
      );

    if (result.error) {
      return res
        .status(result.error.status)
        .json({
          success: false,
          message:
            result.error.message,
        });
    }

    const lead = result.lead;

    /* ======================================================
       SYNCHRONIZE AI INSIGHTS
    ====================================================== */

    const aiInsights =
      await synchronizeAIInsights(
        lead,
        true
      );

    console.log(
      "🤖 AI INSIGHTS:",
      {
        leadId: lead._id,
        score: lead.score,
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

    /* ======================================================
       CONVERSATION
    ====================================================== */

    const conversation =
      await Conversation.findOne({
        leadId: lead._id,
        organizationId:
          req.user.organizationId,
      });

    /* ======================================================
       RETURN
    ====================================================== */

    return res.status(200).json({
      success: true,

      data: {
        lead,
        conversation,
        aiInsights,
      },
    });
  } catch (error) {
    console.error(
      "========== GET LEAD ERROR =========="
    );

    console.error(error);
    console.error(error.stack);

    return res.status(500).json({
      success: false,
      message:
        "Failed to fetch lead.",
    });
  }
};

/* ==========================================================
   GET FOLLOW-UP LEADS
========================================================== */

/**
 * GET /api/lead/follow-up
 *
 * Agent receives only assigned follow-up leads.
 *
 * IMPORTANT
 * ----------------------------------------------------------
 * Follow-up is NOT a Lead.status.
 *
 * Lead.status remains one of:
 *
 * new
 * contacted
 * qualified
 * viewing
 * negotiation
 * won
 * lost
 *
 * Follow-up state is stored in:
 *
 * lead.followUpStatus
 * lead.followUpOutcome
 */
export const getFollowUpLeads = async (
  req,
  res
) => {
  try {
    const query =
      buildOrganizationQuery(req);

    if (!query) {
      return res.status(403).json({
        success: false,
        message:
          "Organization not assigned.",
      });
    }

    /**
     * Follow-up leads are identified by
     * followUpStatus / followUpDate.
     *
     * Keep Lead.status independent.
     */
    query.followUpStatus = {
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
      await Lead.find(query)
        .sort({
          nextFollowUpDate: 1,
          updatedAt: -1,
        });

    return res.status(200).json({
      success: true,
      data: leads,
    });
  } catch (error) {
    console.error(
      "GET FOLLOW-UP LEADS ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to fetch follow-up leads.",
    });
  }
};

/* ==========================================================
   UPDATE FOLLOW-UP
========================================================== */

/**
 * PATCH /api/lead/:id/followup
 *
 * Agent:
 * → Can update ONLY their assigned lead.
 */
export const updateFollowUp = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

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

    if (result.error) {
      return res
        .status(result.error.status)
        .json({
          success: false,
          message:
            result.error.message,
        });
    }

    const lead = result.lead;

    /* ======================================================
       NEXT FOLLOW-UP DATE
    ====================================================== */

    if (
      nextFollowUpDate !==
      undefined
    ) {
      if (
        nextFollowUpDate === null ||
        nextFollowUpDate === ""
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
          return res.status(400).json({
            success: false,
            message:
              "Invalid next follow-up date.",
          });
        }

        lead.nextFollowUpDate =
          date;
      }
    }

    /* ======================================================
       NEXT ACTION
    ====================================================== */

    if (
      nextAction !== undefined
    ) {
      lead.nextAction =
        String(nextAction).trim();
    }

    /* ======================================================
       NOTE TEXT
    ====================================================== */

    if (
      noteText !== undefined
    ) {
      lead.noteText =
        String(noteText).trim();
    }

    /* ======================================================
       FOLLOW-UP STATUS
    ====================================================== */

    if (
      followUpStatus !==
      undefined
    ) {
      const allowedStatuses = [
        "pending",
        "scheduled",
        "completed",
        "cancelled",
      ];

      if (
        !allowedStatuses.includes(
          followUpStatus
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid follow-up status.",
        });
      }

      lead.followUpStatus =
        followUpStatus;
    }

    /* ======================================================
       FOLLOW-UP OUTCOME
    ====================================================== */

    if (
      followUpOutcome !==
      undefined
    ) {
      const allowedOutcomes = [
        "no_answer",
        "interested",
        "viewing_scheduled",
        "not_interested",
        "callback",
      ];

      if (
        followUpOutcome !== null &&
        !allowedOutcomes.includes(
          followUpOutcome
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid follow-up outcome.",
        });
      }

      lead.followUpOutcome =
        followUpOutcome;
    }

    /* ======================================================
       LEAD STATUS
    ====================================================== */

    if (
      status !== undefined
    ) {
      if (
        !VALID_LEAD_STATUSES.includes(
          status
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid lead status.",
          allowedStatuses:
            VALID_LEAD_STATUSES,
        });
      }

      lead.status = status;
    }

    /* ======================================================
       LAST CONTACT
    ====================================================== */

    lead.lastContact =
      new Date();

    lead.followUpUpdatedAt =
      new Date();

    /* ======================================================
       AI INSIGHTS
    ====================================================== */

    lead.aiInsights =
      buildAIInsights(lead);

    await lead.save();

    emitLeadUpdate(lead);

    return res.status(200).json({
      success: true,
      message:
        "Follow-up updated successfully.",
      data: lead,
    });
  } catch (error) {
    console.error(
      "UPDATE FOLLOW-UP ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to update follow-up.",
    });
  }
};

/* ==========================================================
   ADD CALL HISTORY
========================================================== */

/**
 * POST /api/lead/:id/call-history
 *
 * Agent:
 * → Can add call history ONLY to assigned lead.
 */
export const addCallHistory = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

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
      return res.status(400).json({
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

    if (result.error) {
      return res
        .status(result.error.status)
        .json({
          success: false,
          message:
            result.error.message,
        });
    }

    const lead = result.lead;

    let followUpDate = null;

    if (
      nextFollowUpDate !==
        undefined &&
      nextFollowUpDate !== null &&
      nextFollowUpDate !== ""
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
        return res.status(400).json({
          success: false,
          message:
            "Invalid next follow-up date.",
        });
      }
    }

    if (
      followUpStatus !==
        undefined &&
      followUpStatus !== null
    ) {
      const allowedStatuses = [
        "pending",
        "scheduled",
        "completed",
        "cancelled",
      ];

      if (
        !allowedStatuses.includes(
          followUpStatus
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid follow-up status.",
        });
      }
    }

    if (
      status !== undefined &&
      status !== ""
    ) {
      if (
        !VALID_LEAD_STATUSES.includes(
          status
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid lead status.",
          allowedStatuses:
            VALID_LEAD_STATUSES,
        });
      }
    }

    if (
      !Array.isArray(
        lead.callHistory
      )
    ) {
      lead.callHistory = [];
    }

    const callRecord = {
      calledAt: new Date(),

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
        getUserId(req),
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

    if (
      status !== undefined &&
      status !== ""
    ) {
      lead.status =
        status;
    }

    lead.followUpUpdatedAt =
      new Date();

    /* ======================================================
       AI INSIGHTS
    ====================================================== */

    lead.aiInsights =
      buildAIInsights(lead);

    await lead.save();

    emitLeadUpdate(lead);

    return res.status(201).json({
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

    return res.status(500).json({
      success: false,
      message:
        "Failed to save call history.",
    });
  }
};

/* ==========================================================
   ADD AGENT NOTE
========================================================== */

/**
 * POST /api/lead/:id/notes
 *
 * Agent:
 * → Can add notes ONLY to assigned lead.
 */
export const addAgentNote = async (
  req,
  res
) => {
  try {
    const { id } = req.params;
    const { text } = req.body;

    if (
      typeof text !==
        "string" ||
      !text.trim()
    ) {
      return res.status(400).json({
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

    if (result.error) {
      return res
        .status(result.error.status)
        .json({
          success: false,
          message:
            result.error.message,
        });
    }

    const lead = result.lead;

    if (
      !Array.isArray(
        lead.notes
      )
    ) {
      lead.notes = [];
    }

    lead.notes.push({
      text: text.trim(),

      createdAt:
        new Date(),

      createdBy:
        getUserId(req),
    });

    lead.lastContact =
      new Date();

    lead.aiInsights =
      buildAIInsights(lead);

    await lead.save();

    emitLeadUpdate(lead);

    console.log(
      "📝 AGENT NOTE ADDED:",
      {
        leadId: lead._id,
        agentId:
          getUserId(req),
      }
    );

    return res.status(200).json({
      success: true,
      message:
        "Agent note added successfully.",
      data: lead.notes,
    });
  } catch (error) {
    console.error(
      "ADD AGENT NOTE ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to add agent note.",
    });
  }
};

/* ==========================================================
   REQUEST VIEWING
========================================================== */

/**
 * POST /api/lead/:id/viewing/request
 *
 * Here :id = LEAD ID.
 *
 * Agent can request viewing only for an assigned lead.
 */
export const requestViewing = async (
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
      return res.status(400).json({
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
      return res.status(400).json({
        success: false,
        message:
          "Viewing date, start time and end time are required.",
      });
    }

    const result =
      await findAccessibleLead(
        req,
        id
      );

    if (result.error) {
      return res
        .status(result.error.status)
        .json({
          success: false,
          message:
            result.error.message,
        });
    }

    const lead = result.lead;

    const property =
      await Property.findById(
        propertyId
      );

    if (!property) {
      return res.status(404).json({
        success: false,
        message:
          "Property not found.",
      });
    }

    if (
      property.organizationId &&
      req.user.organizationId &&
      String(
        property.organizationId
      ) !==
        String(
          req.user.organizationId
        )
    ) {
      return res.status(403).json({
        success: false,
        message:
          "You cannot access this property.",
      });
    }

    const assignedAgent =
      property.assignedAgent ||
      getUserId(req);

    const viewing =
      await Viewing.create({
        lead: lead._id,

        property:
          property._id,

        agent:
          assignedAgent,

        requestedBy:
          getUserId(req),

        organizationId:
          req.user.organizationId,

        viewingDate,

        startTime,

        endTime,

        customerNotes,

        location: {
          address:
            property.location,

          city:
            property.city,

          county:
            property.county,
        },

        status:
          "Requested",
      });

    /**
     * ======================================================
     * LEAD STATUS
     * ======================================================
     *
     * "viewing_requested" is NOT a valid Lead.status.
     *
     * Lead.status → viewing
     *
     * Lead.viewingStatus → requested
     */

    lead.status =
      "viewing";

    lead.viewingStatus =
      "requested";

    lead.currentViewing =
      viewing._id;

    lead.nextViewingDate =
      viewingDate
        ? new Date(viewingDate)
        : null;

    lead.viewingRequestCount =
      (lead.viewingRequestCount ||
        0) + 1;

    lead.aiInsights =
      buildAIInsights(lead);

    await lead.save();

    if (
      property.availability
    ) {
      property.availability =
        "viewing_booked";

      await property.save();
    }

    emitLeadUpdate(lead);

    return res.status(201).json({
      success: true,
      message:
        "Viewing requested.",
      data: viewing,
    });
  } catch (error) {
    console.error(
      "REQUEST VIEWING ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to request viewing.",
    });
  }
};

/* ==========================================================
   APPROVE VIEWING
========================================================== */

export const approveViewing = async (
  req,
  res
) => {
  try {
    const viewing =
      await Viewing.findById(
        req.params.id
      );

    if (!viewing) {
      return res.status(404).json({
        success: false,
        message:
          "Viewing not found.",
      });
    }

    if (
      req.user.organizationId &&
      viewing.organizationId &&
      String(
        viewing.organizationId
      ) !==
        String(
          req.user.organizationId
        )
    ) {
      return res.status(403).json({
        success: false,
        message:
          "You are not authorized to modify this viewing.",
      });
    }

    if (
      getRole(req) ===
        "agent" &&
      viewing.agent &&
      String(
        viewing.agent
      ) !==
        String(
          getUserId(req)
        )
    ) {
      return res.status(403).json({
        success: false,
        message:
          "You can only manage viewings assigned to you.",
      });
    }

    viewing.status =
      "Approved";

    viewing.approvedBy =
      getUserId(req);

    viewing.approvedAt =
      new Date();

    await viewing.save();

    const lead =
      await Lead.findOne({
        _id: viewing.lead,

        organizationId:
          req.user.organizationId,

        ...(getRole(req) ===
        "agent"
          ? {
              assignedTo:
                getUserId(req),
            }
          : {}),
      });

    if (lead) {
      /**
       * Lead.status = viewing
       *
       * Viewing-specific state remains
       * in lead.viewingStatus.
       */
      lead.status =
        "viewing";

      lead.viewingStatus =
        "scheduled";

      lead.currentViewing =
        viewing._id;

      lead.nextViewingDate =
        viewing.viewingDate
          ? new Date(
              viewing.viewingDate
            )
          : null;

      lead.aiInsights =
        buildAIInsights(lead);

      await lead.save();

      emitLeadUpdate(lead);
    }

    return res.status(200).json({
      success: true,
      message:
        "Viewing approved.",
      data: viewing,
    });
  } catch (error) {
    console.error(
      "APPROVE VIEWING ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to approve viewing.",
    });
  }
};

/* ==========================================================
   REJECT VIEWING
========================================================== */

export const rejectViewing = async (
  req,
  res
) => {
  try {
    const {
      rejectionReason,
    } = req.body;

    const viewing =
      await Viewing.findById(
        req.params.id
      );

    if (!viewing) {
      return res.status(404).json({
        success: false,
        message:
          "Viewing not found.",
      });
    }

    if (
      req.user.organizationId &&
      viewing.organizationId &&
      String(
        viewing.organizationId
      ) !==
        String(
          req.user.organizationId
        )
    ) {
      return res.status(403).json({
        success: false,
        message:
          "You are not authorized to modify this viewing.",
      });
    }

    if (
      getRole(req) ===
        "agent" &&
      viewing.agent &&
      String(
        viewing.agent
      ) !==
        String(
          getUserId(req)
        )
    ) {
      return res.status(403).json({
        success: false,
        message:
          "You can only manage viewings assigned to you.",
      });
    }

    viewing.status =
      "Rejected";

    viewing.rejectionReason =
      rejectionReason ||
      null;

    await viewing.save();

    const lead =
      await Lead.findOne({
        _id: viewing.lead,
        organizationId:
          req.user.organizationId,

        ...(getRole(req) ===
        "agent"
          ? {
              assignedTo:
                getUserId(req),
            }
          : {}),
      });

    if (lead) {
      /**
       * Rejected viewing returns the lead
       * to the qualified workflow stage.
       */
      lead.status =
        "qualified";

      lead.viewingStatus =
        "cancelled";

      lead.currentViewing =
        null;

      lead.nextViewingDate =
        null;

      lead.aiInsights =
        buildAIInsights(lead);

      await lead.save();

      emitLeadUpdate(lead);
    }

    return res.status(200).json({
      success: true,
      message:
        "Viewing rejected.",
      data: viewing,
    });
  } catch (error) {
    console.error(
      "REJECT VIEWING ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to reject viewing.",
    });
  }
};

/* ==========================================================
   RESCHEDULE VIEWING
========================================================== */

export const rescheduleViewing = async (
  req,
  res
) => {
  try {
    const { id } =
      req.params;

    const {
      viewingDate,
      startTime,
      endTime,
      rescheduleReason,
    } = req.body;

    if (
      !viewingDate ||
      !startTime ||
      !endTime
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Viewing date, start time and end time are required.",
      });
    }

    const viewing =
      await Viewing.findById(
        id
      );

    if (!viewing) {
      return res.status(404).json({
        success: false,
        message:
          "Viewing not found.",
      });
    }

    if (
      req.user.organizationId &&
      viewing.organizationId &&
      String(
        viewing.organizationId
      ) !==
        String(
          req.user.organizationId
        )
    ) {
      return res.status(403).json({
        success: false,
        message:
          "You are not authorized to modify this viewing.",
      });
    }

    if (
      getRole(req) ===
        "agent" &&
      viewing.agent &&
      String(
        viewing.agent
      ) !==
        String(
          getUserId(req)
        )
    ) {
      return res.status(403).json({
        success: false,
        message:
          "You can only manage viewings assigned to you.",
      });
    }

    viewing.viewingDate =
      viewingDate;

    viewing.startTime =
      startTime;

    viewing.endTime =
      endTime;

    viewing.rescheduleReason =
      rescheduleReason ||
      null;

    viewing.rescheduledAt =
      new Date();

    viewing.rescheduledBy =
      getUserId(req);

    viewing.status =
      "Rescheduled";

    await viewing.save();

    const lead =
      await Lead.findOne({
        _id: viewing.lead,
        organizationId:
          req.user.organizationId,

        ...(getRole(req) ===
        "agent"
          ? {
              assignedTo:
                getUserId(req),
            }
          : {}),
      });

    if (lead) {
      /**
       * Lead.status remains "viewing".
       *
       * Rescheduling belongs to
       * lead.viewingStatus.
       */
      lead.status =
        "viewing";

      lead.viewingStatus =
        "rescheduled";

      lead.currentViewing =
        viewing._id;

      lead.nextViewingDate =
        new Date(
          viewingDate
        );

      lead.aiInsights =
        buildAIInsights(lead);

      await lead.save();

      emitLeadUpdate(lead);
    }

    return res.status(200).json({
      success: true,
      message:
        "Viewing rescheduled successfully.",
      data: viewing,
    });
  } catch (error) {
    console.error(
      "RESCHEDULE VIEWING ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to reschedule viewing.",
    });
  }
};

/* ==========================================================
   CANCEL VIEWING
========================================================== */

export const cancelViewing = async (
  req,
  res
) => {
  try {
    const viewing =
      await Viewing.findById(
        req.params.id
      );

    if (!viewing) {
      return res.status(404).json({
        success: false,
        message:
          "Viewing not found.",
      });
    }

    if (
      req.user.organizationId &&
      viewing.organizationId &&
      String(
        viewing.organizationId
      ) !==
        String(
          req.user.organizationId
        )
    ) {
      return res.status(403).json({
        success: false,
        message:
          "You are not authorized to modify this viewing.",
      });
    }

    if (
      getRole(req) ===
        "agent" &&
      viewing.agent &&
      String(
        viewing.agent
      ) !==
        String(
          getUserId(req)
        )
    ) {
      return res.status(403).json({
        success: false,
        message:
          "You can only manage viewings assigned to you.",
      });
    }

    viewing.status =
      "Cancelled";

    await viewing.save();

    if (viewing.property) {
      await Property.findByIdAndUpdate(
        viewing.property,
        {
          availability:
            "available",
        }
      );
    }

    const lead =
      await Lead.findOne({
        _id: viewing.lead,

        organizationId:
          req.user.organizationId,

        ...(getRole(req) ===
        "agent"
          ? {
              assignedTo:
                getUserId(req),
            }
          : {}),
      });

    if (lead) {
      /**
       * Cancelled viewing returns the lead
       * to qualification.
       */
      lead.status =
        "qualified";

      lead.viewingStatus =
        "cancelled";

      lead.currentViewing =
        null;

      lead.nextViewingDate =
        null;

      lead.aiInsights =
        buildAIInsights(lead);

      await lead.save();

      emitLeadUpdate(lead);
    }

    return res.status(200).json({
      success: true,
      message:
        "Viewing cancelled.",
      data: viewing,
    });
  } catch (error) {
    console.error(
      "CANCEL VIEWING ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to cancel viewing.",
    });
  }
};

/* ==========================================================
   COMPLETE VIEWING
========================================================== */

export const completeViewing = async (
  req,
  res
) => {
  try {
    const viewing =
      await Viewing.findById(
        req.params.id
      );

    if (!viewing) {
      return res.status(404).json({
        success: false,
        message:
          "Viewing not found.",
      });
    }

    if (
      req.user.organizationId &&
      viewing.organizationId &&
      String(
        viewing.organizationId
      ) !==
        String(
          req.user.organizationId
        )
    ) {
      return res.status(403).json({
        success: false,
        message:
          "You are not authorized to modify this viewing.",
      });
    }

    if (
      getRole(req) ===
        "agent" &&
      viewing.agent &&
      String(
        viewing.agent
      ) !==
        String(
          getUserId(req)
        )
    ) {
      return res.status(403).json({
        success: false,
        message:
          "You can only manage viewings assigned to you.",
      });
    }

    if (
      viewing.status ===
      "Completed"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Viewing is already completed.",
      });
    }

    viewing.status =
      "Completed";

    viewing.completedAt =
      new Date();

    await viewing.save();

    const lead =
      await Lead.findOne({
        _id: viewing.lead,

        organizationId:
          req.user.organizationId,

        ...(getRole(req) ===
        "agent"
          ? {
              assignedTo:
                getUserId(req),
            }
          : {}),
      });

    if (lead) {
      lead.viewingStatus =
        "completed";

      lead.viewingCompleted =
        true;

      lead.lastContact =
        new Date();

      /**
       * IMPORTANT
       * ----------------------------------------------------
       * Completing a viewing does NOT mean the Lead.status
       * becomes "viewing_scheduled" or another invalid value.
       *
       * Keep the valid Lead workflow status.
       *
       * Feedback may later move it to:
       * negotiation / won / lost / qualified.
       *
       * Until feedback is available, keep the lead
       * qualified if it was already qualified.
       */
      if (
        lead.status ===
          "new" ||
        lead.status ===
          "contacted"
      ) {
        lead.status =
          "qualified";
      }

      lead.aiInsights =
        buildAIInsights(lead);

      await lead.save();

      emitLeadUpdate(lead);
    }

    if (viewing.property) {
      await Property.findByIdAndUpdate(
        viewing.property,
        {
          availability:
            "available",

          $inc: {
            "viewingStats.completedViewings":
              1,
          },
        }
      );
    }

    return res.status(200).json({
      success: true,
      message:
        "Viewing completed.",
      data: viewing,
    });
  } catch (error) {
    console.error(
      "COMPLETE VIEWING ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to complete viewing.",
    });
  }
};

/* ==========================================================
   SUBMIT VIEWING FEEDBACK
========================================================== */

export const submitViewingFeedback = async (
  req,
  res
) => {
  try {
    const { id } =
      req.params;

    const {
      viewerRating,
      viewerComment,
      agentOutcome,
    } = req.body;

    const viewing =
      await Viewing.findById(
        id
      );

    if (!viewing) {
      return res.status(404).json({
        success: false,
        message:
          "Viewing not found.",
      });
    }

    if (
      req.user.organizationId &&
      viewing.organizationId &&
      String(
        viewing.organizationId
      ) !==
        String(
          req.user.organizationId
        )
    ) {
      return res.status(403).json({
        success: false,
        message:
          "You are not authorized to modify this viewing.",
      });
    }

    if (
      getRole(req) ===
        "agent" &&
      viewing.agent &&
      String(
        viewing.agent
      ) !==
        String(
          getUserId(req)
        )
    ) {
      return res.status(403).json({
        success: false,
        message:
          "You can only manage viewings assigned to you.",
      });
    }

    if (
      viewing.status ===
      "Completed"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Feedback has already been submitted for this viewing.",
      });
    }

    let rating = null;

    if (
      viewerRating !==
        undefined &&
      viewerRating !== null &&
      viewerRating !== ""
    ) {
      rating =
        Number(
          viewerRating
        );

      if (
        Number.isNaN(
          rating
        ) ||
        rating < 1 ||
        rating > 5
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Viewer rating must be between 1 and 5.",
        });
      }
    }

    const allowedOutcomes = [
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
      return res.status(400).json({
        success: false,
        message:
          "Invalid agent outcome.",
      });
    }

    viewing.feedback = {
      ...(viewing.feedback || {}),

      ...(rating !== null
        ? {
            viewerRating:
              rating,
          }
        : {}),

      ...(viewerComment !==
        undefined
        ? {
            viewerComment:
              typeof viewerComment ===
              "string"
                ? viewerComment.trim()
                : "",
          }
        : {}),

      ...(agentOutcome
        ? {
            agentOutcome,
          }
        : {}),

      submittedAt:
        new Date(),

      submittedBy:
        getUserId(req),
    };

    viewing.status =
      "Completed";

    viewing.completedAt =
      new Date();

    await viewing.save();

    /**
     * ======================================================
     * LEAD STATUS AFTER VIEWING
     * ======================================================
     *
     * IMPORTANT
     * ------------------------------------------------------
     * Lead.status only accepts:
     *
     * new
     * contacted
     * qualified
     * viewing
     * negotiation
     * won
     * lost
     *
     * Therefore:
     *
     * follow_up → qualified
     * interested → qualified
     * negotiating → negotiation
     * not_interested → lost
     * no_decision → qualified
     */

    let leadStatus =
      "qualified";

    switch (
      agentOutcome
    ) {
      case "interested":
        leadStatus =
          "qualified";
        break;

      case "negotiating":
        leadStatus =
          "negotiation";
        break;

      case "follow_up":
        leadStatus =
          "qualified";
        break;

      case "not_interested":
        leadStatus =
          "lost";
        break;

      case "no_decision":
        leadStatus =
          "qualified";
        break;

      default:
        leadStatus =
          "qualified";
    }

    const lead =
      await Lead.findOne({
        _id: viewing.lead,

        organizationId:
          req.user.organizationId,

        ...(getRole(req) ===
        "agent"
          ? {
              assignedTo:
                getUserId(req),
            }
          : {}),
      });

    if (lead) {
      lead.status =
        leadStatus;

      lead.viewingStatus =
        "completed";

      lead.viewingCompleted =
        true;

      lead.interestedAfterViewing =
        agentOutcome ===
        "interested"
          ? "interested"
          : agentOutcome ===
            "not_interested"
          ? "not_interested"
          : agentOutcome ===
            "no_decision"
          ? "thinking"
          : "unknown";

      lead.lastContact =
        new Date();

      lead.currentViewing =
        viewing._id;

      /**
       * If the outcome requires follow-up,
       * use the follow-up fields rather than
       * inventing a Lead.status.
       */
      if (
        agentOutcome ===
          "follow_up" ||
        agentOutcome ===
          "interested" ||
        agentOutcome ===
          "no_decision"
      ) {
        lead.followUpStatus =
          lead.followUpStatus ||
          "pending";
      }

      lead.aiInsights =
        buildAIInsights(lead);

      await lead.save();

      emitLeadUpdate(lead);
    }

    if (viewing.property) {
      await Property.findByIdAndUpdate(
        viewing.property,
        {
          availability:
            "available",

          $inc: {
            "viewingStats.completedViewings":
              1,
          },
        }
      );
    }

    return res.status(200).json({
      success: true,
      message:
        "Viewing feedback submitted successfully.",
      data: viewing,
    });
  } catch (error) {
    console.error(
      "SUBMIT VIEWING FEEDBACK ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to submit viewing feedback.",
    });
  }
};

/* ==========================================================
   GET LEAD VIEWINGS
========================================================== */

/**
 * GET /api/lead/:id/viewings
 *
 * Here :id = LEAD ID.
 *
 * Agent can only retrieve viewings belonging to
 * an assigned lead.
 */
export const getLeadViewings = async (
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

    if (result.error) {
      return res
        .status(result.error.status)
        .json({
          success: false,
          message:
            result.error.message,
        });
    }

    const lead =
      result.lead;

    const viewings =
      await Viewing.find({
        lead: lead._id,

        ...(req.user.organizationId
          ? {
              organizationId:
                req.user
                  .organizationId,
            }
          : {}),
      })
        .populate("property")
        .populate("agent")
        .sort({
          viewingDate: -1,
        });

    return res.status(200).json({
      success: true,
      data: viewings,
    });
  } catch (error) {
    console.error(
      "GET LEAD VIEWINGS ERROR:",
      error
    );

    return res.status(500).json({
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