/**
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
 */

import Viewing from "../models/viewing.js";
import Lead from "../models/lead.js";
import Property from "../models/property.js";
import Notification from "../models/notification.js";
import Conversation from "../models/conversation.js";

/* ==========================================================
   LEAD STATUS SOURCE OF TRUTH
========================================================== */

/**
 * IMPORTANT
 * ----------------------------------------------------------
 * Lead.status MUST use only the values defined by the
 * existing Lead model:
 *
 *   new
 *   contacted
 *   qualified
 *   viewing
 *   negotiation
 *   won
 *   lost
 *
 * Viewing-specific states must NOT be stored inside
 * Lead.status.
 *
 * Viewing lifecycle is handled by:
 *
 *   Viewing.status
 *   Lead.viewingStatus
 *
 * Follow-up is handled by:
 *
 *   Lead.followUpStatus
 *   Lead.followUpOutcome
 *
 * Hot leads are determined using Lead.score.
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
 * Safely applies a Lead status.
 *
 * This protects this controller from accidentally writing
 * unsupported values such as:
 *
 *   viewing_requested
 *   viewing_scheduled
 *   follow_up
 *   closed
 *   hot
 *
 * Those are NOT valid Lead.status values.
 */
const setLeadStatus = (lead, status) => {
  if (!VALID_LEAD_STATUSES.includes(status)) {
    console.warn(
      "INVALID LEAD STATUS BLOCKED:",
      status
    );

    return false;
  }

  lead.status = status;

  return true;
};

/* ==========================================================
   HELPERS
========================================================== */

/**
 * Creates an in-app notification.
 */
const createNotification = async ({
  organizationId,
  userId,
  title,
  message,
  type = "viewing",
  metadata = {},
}) => {
  try {
    await Notification.create({
      organizationId,
      recipient: userId,
      title,
      message,
      type,
      metadata,
    });
  } catch (error) {
    console.error(
      "Notification creation failed:",
      error.message
    );
  }
};

/**
 * Checks whether a property already has
 * an active viewing at the same date/time.
 */
const hasPropertyConflict = async ({
  propertyId,
  viewingDate,
  startTime,
  excludeViewingId = null,
}) => {
  const query = {
    property: propertyId,
    viewingDate,
    startTime,
    status: {
      $in: [
        "Pending Approval",
        "Approved",
        "Rescheduled",
      ],
    },
  };

  if (excludeViewingId) {
    query._id = {
      $ne: excludeViewingId,
    };
  }

  return Viewing.findOne(query);
};

/**
 * Checks whether an agent already has
 * another viewing scheduled.
 */
const hasAgentConflict = async ({
  agentId,
  viewingDate,
  startTime,
  excludeViewingId = null,
}) => {
  const query = {
    agent: agentId,
    viewingDate,
    startTime,
    status: {
      $in: [
        "Pending Approval",
        "Approved",
        "Rescheduled",
      ],
    },
  };

  if (excludeViewingId) {
    query._id = {
      $ne: excludeViewingId,
    };
  }

  return Viewing.findOne(query);
};

/**
 * Adds organization isolation where possible.
 */
const applyOrganizationFilter = (req, query = {}) => {
  if (req.user?.organizationId) {
    query.organizationId = req.user.organizationId;
  }

  return query;
};

/* ==========================================================
   REQUEST VIEWING
========================================================== */

/**
 * POST
 * /api/viewings
 *
 * Customer/agent creates a viewing request.
 */
export const requestViewing = async (req, res) => {
  try {
    const {
      leadId,
      propertyId,
      viewingDate,
      startTime,
      endTime,
      customerNotes,
    } = req.body;

    const organizationId =
      req.user?.organizationId;

    /* ------------------------------------------------------
       Validate required fields
    ------------------------------------------------------ */

    if (
      !leadId ||
      !propertyId ||
      !viewingDate ||
      !startTime ||
      !endTime
    ) {
      return res.status(400).json({
        success: false,
        message:
          "leadId, propertyId, viewingDate, startTime and endTime are required.",
      });
    }

    /* ------------------------------------------------------
       Validate Lead
    ------------------------------------------------------ */

    const lead = await Lead.findById(leadId);

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: "Lead not found.",
      });
    }

    /* ------------------------------------------------------
       Validate Property
    ------------------------------------------------------ */

    const property =
      await Property.findById(propertyId);

    if (!property) {
      return res.status(404).json({
        success: false,
        message: "Property not found.",
      });
    }

    /* ------------------------------------------------------
       Property availability
    ------------------------------------------------------ */

    if (
      property.availability &&
      property.availability !== "available"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Property is currently unavailable for viewing.",
      });
    }

    /* ------------------------------------------------------
       Property conflict
    ------------------------------------------------------ */

    const propertyConflict =
      await hasPropertyConflict({
        propertyId,
        viewingDate,
        startTime,
      });

    if (propertyConflict) {
      return res.status(409).json({
        success: false,
        message:
          "Property already has a viewing during this time.",
      });
    }

    /* ------------------------------------------------------
       Agent conflict
    ------------------------------------------------------ */

    if (property.assignedAgent) {
      const agentConflict =
        await hasAgentConflict({
          agentId:
            property.assignedAgent,
          viewingDate,
          startTime,
        });

      if (agentConflict) {
        return res.status(409).json({
          success: false,
          message:
            "Assigned agent already has another viewing scheduled.",
        });
      }
    }

    /* ------------------------------------------------------
       Create Viewing
    ------------------------------------------------------ */

    const viewing =
      await Viewing.create({
        organizationId,

        lead: lead._id,

        property: property._id,

        agent:
          property.assignedAgent || null,

        requestedBy:
          req.user?.id || null,

        viewingDate,

        startTime,

        endTime,

        location: {
          address:
            property.location,

          city:
            property.city,

          county:
            property.county,

          latitude:
            property.coordinates
              ?.latitude,

          longitude:
            property.coordinates
              ?.longitude,
        },

        customerNotes,

        status:
          "Pending Approval",

        source:
          lead.source,
      });

    /* ------------------------------------------------------
       Update Lead
    ------------------------------------------------------ */

    /**
     * "viewing" is the valid Lead.status value.
     *
     * The more specific request state is already stored
     * on Viewing.status as "Pending Approval".
     */
    setLeadStatus(
      lead,
      "viewing"
    );

    /**
     * Keep Lead.viewingStatus synchronized where the field
     * exists in the Lead model.
     *
     * This is NOT Lead.status.
     */
    if (
      Object.prototype.hasOwnProperty.call(
        lead,
        "viewingStatus"
      ) ||
      lead.schema?.path("viewingStatus")
    ) {
      lead.viewingStatus =
        "requested";
    }

    await lead.save();

    /* ------------------------------------------------------
       Update Property statistics
    ------------------------------------------------------ */

    property.availability =
      "viewing_booked";

    if (!property.viewingStats) {
      property.viewingStats = {};
    }

    property.viewingStats.totalRequests =
      (property.viewingStats.totalRequests || 0) + 1;

    await property.save();

    /* ------------------------------------------------------
       Link Conversation
    ------------------------------------------------------ */

    await Conversation.updateOne(
      {
        leadId: lead._id,
      },
      {
        status: "awaiting_agent",
      }
    );

    /* ------------------------------------------------------
       Notify Agent
    ------------------------------------------------------ */

    if (property.assignedAgent) {
      await createNotification({
        organizationId,

        userId:
          property.assignedAgent,

        title:
          "New Viewing Request",

        message:
          `${lead.name} requested a viewing for ${property.title}.`,

        metadata: {
          viewingId:
            viewing._id,
        },
      });
    }

    return res.status(201).json({
      success: true,

      message:
        "Viewing request submitted successfully.",

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
        "Failed to create viewing request.",

      error:
        error.message,
    });
  }
};

/**
 * ==========================================================
 *
 * GET ALL VIEWINGS
 *
 * GET
 * /api/viewings
 *
 * Returns viewings visible to the authenticated user.
 *
 * Admin:
 *   → All organization viewings
 *
 * Agent:
 *   → Only assigned viewings
 *
 * Customer:
 *   → Only their requested viewings
 *
 * ==========================================================
 */

export const getAllViewings = async (req, res) => {
  try {
    // ======================================================
    // AUTHENTICATED USER
    // ======================================================

    const user = req.user;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Authenticated user not found.",
      });
    }

    // ======================================================
    // BUILD QUERY
    // ======================================================

    const query = {};

    // ======================================================
    // ORGANIZATION ISOLATION
    // ======================================================

    if (user.organizationId) {
      query.organizationId = user.organizationId;
    }

    // ======================================================
    // ROLE FILTERING
    // ======================================================

    if (user.role === "agent") {
      query.agent = user._id || user.id;
    }

    // Customers should only see their own requested viewings.
    if (user.role === "customer") {
      query.requestedBy = user._id || user.id;
    }

    // ======================================================
    // FETCH VIEWINGS
    // ======================================================

    const viewings = await Viewing.find(query)
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
        viewingDate: 1,
        startTime: 1,
      });

    // ======================================================
    // RESPONSE
    // ======================================================

    return res.status(200).json({
      success: true,
      count: viewings.length,
      data: viewings,
    });

  } catch (error) {
    console.error("==========================================");
    console.error("GET ALL VIEWINGS ERROR");
    console.error("==========================================");
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to load viewings.",
      error:
        process.env.NODE_ENV === "development"
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
  async (req, res) => {
    try {
      const query =
        applyOrganizationFilter(req);

      const today =
        new Date();

      today.setHours(
        0,
        0,
        0,
        0
      );

      query.viewingDate = {
        $gte: today,
      };

      query.status = {
        $in: [
          "Pending Approval",
          "Approved",
          "Rescheduled",
        ],
      };

      if (
        req.user?.role === "agent"
      ) {
        query.agent =
          req.user.id;
      }

      const viewings =
        await Viewing.find(query)
          .populate(
            "lead",
            "name phone"
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
            viewingDate: 1,
            startTime: 1,
          });

      return res.status(200).json({
        success: true,

        count:
          viewings.length,

        data:
          viewings,
      });
    } catch (error) {
      console.error(
        "GET UPCOMING VIEWINGS ERROR:",
        error
      );

      return res.status(500).json({
        success: false,

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
  async (req, res) => {
    try {
      const query =
        applyOrganizationFilter(req);

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

      query.viewingDate = {
        $gte: start,
        $lte: end,
      };

      query.status = {
        $in: [
          "Approved",
          "Rescheduled",
        ],
      };

      if (
        req.user?.role === "agent"
      ) {
        query.agent =
          req.user.id;
      }

      const todayViewings =
        await Viewing.find(query)
          .populate(
            "lead",
            "name phone"
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
            startTime: 1,
          });

      return res.status(200).json({
        success: true,

        count:
          todayViewings.length,

        data:
          todayViewings,
      });
    } catch (error) {
      console.error(
        "TODAY VIEWINGS ERROR:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          "Failed to fetch today's viewings.",

        error:
          error.message,
      });
    }
  };

/* ==========================================================
   VIEWING DETAILS
========================================================== */

/**
 * GET
 * /api/viewings/:id
 */
export const getViewingById =
  async (req, res) => {
    try {
      const query = {
        _id: req.params.id,
      };

      applyOrganizationFilter(
        req,
        query
      );

      const viewing =
        await Viewing.findOne(query)
          .populate("lead")
          .populate("property")
          .populate("agent")
          .populate(
            "approvedBy",
            "name email"
          );

      if (!viewing) {
        return res.status(404).json({
          success: false,

          message:
            "Viewing not found.",
        });
      }

      return res.status(200).json({
        success: true,

        data:
          viewing,
      });
    } catch (error) {
      console.error(
        "GET VIEWING ERROR:",
        error
      );

      return res.status(500).json({
        success: false,

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
 * ?agentId=...
 * &date=2026-08-10
 *
 * Returns available time slots for an agent.
 */
export const getAvailableSlots =
  async (req, res) => {
    try {
      const {
        agentId,
        date,
      } = req.query;

      if (!date) {
        return res.status(400).json({
          success: false,

          message:
            "date query parameter is required.",
        });
      }

      const query =
        applyOrganizationFilter(
          req,
          {
            viewingDate: {
              $gte:
                new Date(
                  `${date}T00:00:00`
                ),

              $lte:
                new Date(
                  `${date}T23:59:59.999`
                ),
            },

            status: {
              $in: [
                "Pending Approval",
                "Approved",
                "Rescheduled",
              ],
            },
          }
        );

      if (agentId) {
        query.agent =
          agentId;
      } else if (
        req.user?.role === "agent"
      ) {
        query.agent =
          req.user.id;
      }

      const existingViewings =
        await Viewing.find(query)
          .select(
            "startTime endTime viewingDate property"
          )
          .sort({
            startTime: 1,
          })
          .lean();

      /*
       * Default business hours.
       * These can later be moved into
       * an AgentAvailability model.
       */
      const businessStart = 8;
      const businessEnd = 18;
      const slotDuration = 60;

      const slots = [];

      for (
        let hour = businessStart;
        hour < businessEnd;
        hour++
      ) {
        const start =
          `${String(hour).padStart(2, "0")}:00`;

        const end =
          `${String(hour + 1).padStart(2, "0")}:00`;

        const conflict =
          existingViewings.some(
            (viewing) =>
              viewing.startTime === start ||
              (
                viewing.startTime <= start &&
                viewing.endTime > start
              )
          );

        slots.push({
          startTime: start,
          endTime: end,
          available: !conflict,
        });
      }

      return res.status(200).json({
        success: true,

        data: {
          date,

          agentId:
            agentId ||
            req.user?.id ||
            null,

          businessHours: {
            start:
              `${businessStart}:00`,

            end:
              `${businessEnd}:00`,
          },

          slotDuration,

          slots,
        },
      });
    } catch (error) {
      console.error(
        "GET AVAILABLE SLOTS ERROR:",
        error
      );

      return res.status(500).json({
        success: false,

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
 *
 * Body:
 * {
 *   propertyId,
 *   agentId,
 *   viewingDate,
 *   startTime,
 *   endTime,
 *   excludeViewingId
 * }
 */
export const checkViewingConflict =
  async (req, res) => {
    try {
      const {
        propertyId,
        agentId,
        viewingDate,
        startTime,
        endTime,
        excludeViewingId,
      } = req.body;

      if (
        !viewingDate ||
        !startTime ||
        !endTime
      ) {
        return res.status(400).json({
          success: false,

          message:
            "viewingDate, startTime and endTime are required.",
        });
      }

      const conflicts = [];

      /* ------------------------------------------------------
         Property conflict
      ------------------------------------------------------ */

      if (propertyId) {
        const propertyConflict =
          await hasPropertyConflict({
            propertyId,

            viewingDate,

            startTime,

            excludeViewingId,
          });

        if (propertyConflict) {
          conflicts.push({
            type: "property",

            message:
              "Property already has a viewing scheduled at this time.",

            viewingId:
              propertyConflict._id,
          });
        }
      }

      /* ------------------------------------------------------
         Agent conflict
      ------------------------------------------------------ */

      if (agentId) {
        const agentConflict =
          await hasAgentConflict({
            agentId,

            viewingDate,

            startTime,

            excludeViewingId,
          });

        if (agentConflict) {
          conflicts.push({
            type: "agent",

            message:
              "Agent already has another viewing scheduled at this time.",

            viewingId:
              agentConflict._id,
          });
        }
      }

      return res.status(200).json({
        success: true,

        data: {
          conflict:
            conflicts.length > 0,

          conflicts,

          requestedSlot: {
            viewingDate,
            startTime,
            endTime,
          },
        },
      });
    } catch (error) {
      console.error(
        "CHECK VIEWING CONFLICT ERROR:",
        error
      );

      return res.status(500).json({
        success: false,

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
 *
 * Query:
 * ?date=2026-08-10
 *
 * Returns viewings for a selected calendar date.
 */
export const getCalendarViewings =
  async (req, res) => {
    try {
      const {
        date,
        startDate,
        endDate,
      } = req.query;

      const query =
        applyOrganizationFilter(req);

      if (startDate && endDate) {
        query.viewingDate = {
          $gte:
            new Date(
              `${startDate}T00:00:00`
            ),

          $lte:
            new Date(
              `${endDate}T23:59:59.999`
            ),
        };
      } else if (date) {
        query.viewingDate = {
          $gte:
            new Date(
              `${date}T00:00:00`
            ),

          $lte:
            new Date(
              `${date}T23:59:59.999`
            ),
        };
      } else {
        return res.status(400).json({
          success: false,

          message:
            "Provide date or startDate and endDate.",
        });
      }

      if (
        req.user?.role === "agent"
      ) {
        query.agent =
          req.user.id;
      }

      const viewings =
        await Viewing.find(query)
          .populate(
            "lead",
            "name phone"
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
            viewingDate: 1,
            startTime: 1,
          });

      return res.status(200).json({
        success: true,

        count:
          viewings.length,

        data:
          viewings,
      });
    } catch (error) {
      console.error(
        "GET CALENDAR VIEWINGS ERROR:",
        error
      );

      return res.status(500).json({
        success: false,

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
 * Returns viewings assigned to an agent.
 */
export const getAgentViewings =
  async (req, res) => {
    try {
      const {
        agentId,
      } = req.params;

      const query =
        applyOrganizationFilter(
          req,
          {
            agent:
              agentId,
          }
        );

      const viewings =
        await Viewing.find(query)
          .populate(
            "lead",
            "name phone budget"
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
            viewingDate: 1,
            startTime: 1,
          });

      return res.status(200).json({
        success: true,

        agentId,

        count:
          viewings.length,

        data:
          viewings,
      });
    } catch (error) {
      console.error(
        "GET AGENT VIEWINGS ERROR:",
        error
      );

      return res.status(500).json({
        success: false,

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
 *
 * Returns all viewings associated with a lead.
 */
export const getLeadViewings =
  async (req, res) => {
    try {
      const {
        leadId,
      } = req.params;

      const leadQuery =
        applyOrganizationFilter(
          req,
          {
            _id: leadId,
          }
        );

      const lead =
        await Lead.findOne(
          leadQuery
        );

      if (!lead) {
        return res.status(404).json({
          success: false,

          message:
            "Lead not found.",
        });
      }

      const query =
        applyOrganizationFilter(
          req,
          {
            lead:
              leadId,
          }
        );

      const viewings =
        await Viewing.find(query)
          .populate(
            "property",
            "title location price"
          )
          .populate(
            "agent",
            "name email"
          )
          .sort({
            viewingDate: -1,
            startTime: -1,
          });

      return res.status(200).json({
        success: true,

        leadId,

        count:
          viewings.length,

        data:
          viewings,
      });
    } catch (error) {
      console.error(
        "GET LEAD VIEWINGS ERROR:",
        error
      );

      return res.status(500).json({
        success: false,

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
 *
 * Returns viewing history for a property.
 */
export const getPropertyViewings =
  async (req, res) => {
    try {
      const {
        propertyId,
      } = req.params;

      const propertyQuery =
        applyOrganizationFilter(
          req,
          {
            _id: propertyId,
          }
        );

      const property =
        await Property.findOne(
          propertyQuery
        );

      if (!property) {
        return res.status(404).json({
          success: false,

          message:
            "Property not found.",
        });
      }

      const query =
        applyOrganizationFilter(
          req,
          {
            property:
              propertyId,
          }
        );

      const viewings =
        await Viewing.find(query)
          .populate(
            "lead",
            "name phone"
          )
          .populate(
            "agent",
            "name email"
          )
          .sort({
            viewingDate: -1,
            startTime: -1,
          });

      return res.status(200).json({
        success: true,

        propertyId,

        count:
          viewings.length,

        data:
          viewings,
      });
    } catch (error) {
      console.error(
        "GET PROPERTY VIEWINGS ERROR:",
        error
      );

      return res.status(500).json({
        success: false,

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
export const approveViewing =
  async (req, res) => {
    try {
      const query = {
        _id: req.params.id,
      };

      applyOrganizationFilter(
        req,
        query
      );

      const viewing =
        await Viewing.findOne(query)
          .populate("lead")
          .populate("property");

      if (!viewing) {
        return res.status(404).json({
          success: false,

          message:
            "Viewing not found.",
        });
      }

      if (
        viewing.status !==
        "Pending Approval"
      ) {
        return res.status(400).json({
          success: false,

          message:
            "Only pending requests can be approved.",
        });
      }

      /* Re-check conflicts before approval */

      const propertyConflict =
        await hasPropertyConflict({
          propertyId:
            viewing.property._id,

          viewingDate:
            viewing.viewingDate,

          startTime:
            viewing.startTime,

          excludeViewingId:
            viewing._id,
        });

      if (propertyConflict) {
        return res.status(409).json({
          success: false,

          message:
            "Property is no longer available at this time.",
        });
      }

      if (viewing.agent) {
        const agentConflict =
          await hasAgentConflict({
            agentId:
              viewing.agent,

            viewingDate:
              viewing.viewingDate,

            startTime:
              viewing.startTime,

            excludeViewingId:
              viewing._id,
          });

        if (agentConflict) {
          return res.status(409).json({
            success: false,

            message:
              "Agent is no longer available at this time.",
          });
        }
      }

      viewing.status =
        "Approved";

      viewing.approvedBy =
        req.user.id;

      viewing.approvedAt =
        new Date();

      await viewing.save();

      /**
       * IMPORTANT:
       *
       * "viewing_scheduled" is NOT a valid Lead.status.
       *
       * The existing Lead enum uses:
       *
       *     viewing
       *
       * The detailed viewing state remains:
       *
       *     Viewing.status = "Approved"
       */
      const lead =
        await Lead.findById(
          viewing.lead._id
        );

      if (lead) {
        setLeadStatus(
          lead,
          "viewing"
        );

        /**
         * Keep Lead.viewingStatus synchronized
         * without polluting Lead.status.
         */
        if (
          lead.schema?.path(
            "viewingStatus"
          )
        ) {
          lead.viewingStatus =
            "approved";
        }

        await lead.save();
      }

      await Property.findByIdAndUpdate(
        viewing.property._id,
        {
          availability:
            "viewing_booked",
        }
      );

      await createNotification({
        organizationId:
          req.user.organizationId,

        userId:
          viewing.requestedBy,

        title:
          "Viewing Approved",

        message:
          `Your viewing for "${viewing.property.title}" has been approved.`,

        metadata: {
          viewingId:
            viewing._id,
        },
      });

      return res.status(200).json({
        success: true,

        message:
          "Viewing approved successfully.",

        data:
          viewing,
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

        error:
          error.message,
      });
    }
  };

/* ==========================================================
   REJECT VIEWING
========================================================== */

/**
 * PATCH
 * /api/viewings/:id/reject
 */
export const rejectViewing =
  async (req, res) => {
    try {
      const {
        rejectionReason,
      } = req.body;

      const query = {
        _id: req.params.id,
      };

      applyOrganizationFilter(
        req,
        query
      );

      const viewing =
        await Viewing.findOne(query)
          .populate("lead")
          .populate("property");

      if (!viewing) {
        return res.status(404).json({
          success: false,

          message:
            "Viewing not found.",
        });
      }

      if (
        viewing.status !==
        "Pending Approval"
      ) {
        return res.status(400).json({
          success: false,

          message:
            "Only pending requests can be rejected.",
        });
      }

      viewing.status =
        "Rejected";

      viewing.rejectionReason =
        rejectionReason ||
        "No reason provided";

      await viewing.save();

      await Property.findByIdAndUpdate(
        viewing.property._id,
        {
          availability:
            "available",
        }
      );

      const lead =
        await Lead.findById(
          viewing.lead._id
        );

      if (lead) {
        setLeadStatus(
          lead,
          "qualified"
        );

        if (
          lead.schema?.path(
            "viewingStatus"
          )
        ) {
          lead.viewingStatus =
            "none";
        }

        await lead.save();
      }

      await createNotification({
        organizationId:
          req.user.organizationId,

        userId:
          viewing.requestedBy,

        title:
          "Viewing Request Rejected",

        message:
          `Your request to view "${viewing.property.title}" was declined.`,

        metadata: {
          viewingId:
            viewing._id,

          rejectionReason,
        },
      });

      return res.status(200).json({
        success: true,

        message:
          "Viewing rejected successfully.",

        data:
          viewing,
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

        error:
          error.message,
      });
    }
  };

/* ==========================================================
   RESCHEDULE VIEWING
========================================================== */

/**
 * PATCH
 * /api/viewings/:id/reschedule
 */
export const rescheduleViewing =
  async (req, res) => {
    try {
      const {
        viewingDate,
        startTime,
        endTime,
        customerNotes,
      } = req.body;

      if (
        !viewingDate ||
        !startTime ||
        !endTime
      ) {
        return res.status(400).json({
          success: false,

          message:
            "viewingDate, startTime and endTime are required.",
        });
      }

      const query = {
        _id: req.params.id,
      };

      applyOrganizationFilter(
        req,
        query
      );

      const viewing =
        await Viewing.findOne(query)
          .populate("property")
          .populate("lead");

      if (!viewing) {
        return res.status(404).json({
          success: false,

          message:
            "Viewing not found.",
        });
      }

      if (
        viewing.status ===
        "Cancelled" ||
        viewing.status ===
        "Completed" ||
        viewing.status ===
        "Rejected"
      ) {
        return res.status(400).json({
          success: false,

          message:
            "This viewing cannot be rescheduled.",
        });
      }

      /* ------------------------------------------------------
         Check property conflict
      ------------------------------------------------------ */

      const propertyConflict =
        await hasPropertyConflict({
          propertyId:
            viewing.property._id,

          viewingDate,

          startTime,

          excludeViewingId:
            viewing._id,
        });

      if (propertyConflict) {
        return res.status(409).json({
          success: false,

          message:
            "Property is already booked at the requested time.",
        });
      }

      /* ------------------------------------------------------
         Check agent conflict
      ------------------------------------------------------ */

      if (viewing.agent) {
        const agentConflict =
          await hasAgentConflict({
            agentId:
              viewing.agent,

            viewingDate,

            startTime,

            excludeViewingId:
              viewing._id,
          });

        if (agentConflict) {
          return res.status(409).json({
            success: false,

            message:
              "Agent is already booked at the requested time.",
          });
        }
      }

      /* ------------------------------------------------------
         Save previous schedule
      ------------------------------------------------------ */

      if (
        !viewing.previousSchedules
      ) {
        viewing.previousSchedules =
          [];
      }

      viewing.previousSchedules.push({
        viewingDate:
          viewing.viewingDate,

        startTime:
          viewing.startTime,

        endTime:
          viewing.endTime,

        changedAt:
          new Date(),
      });

      viewing.rescheduleCount =
        (viewing.rescheduleCount || 0) + 1;

      /* ------------------------------------------------------
         Update schedule
      ------------------------------------------------------ */

      viewing.viewingDate =
        viewingDate;

      viewing.startTime =
        startTime;

      viewing.endTime =
        endTime;

      if (
        customerNotes !==
        undefined
      ) {
        viewing.customerNotes =
          customerNotes;
      }

      viewing.status =
        "Rescheduled";

      await viewing.save();

      const lead =
        await Lead.findById(
          viewing.lead._id
        );

      if (lead) {
        /**
         * Lead.status remains "viewing".
         *
         * Rescheduled is a Viewing.status,
         * not a Lead.status.
         */
        setLeadStatus(
          lead,
          "viewing"
        );

        if (
          lead.schema?.path(
            "viewingStatus"
          )
        ) {
          lead.viewingStatus =
            "rescheduled";
        }

        await lead.save();
      }

      await createNotification({
        organizationId:
          req.user.organizationId,

        userId:
          viewing.requestedBy,

        title:
          "Viewing Rescheduled",

        message:
          `Your viewing for "${viewing.property.title}" has been rescheduled.`,

        metadata: {
          viewingId:
            viewing._id,
        },
      });

      return res.status(200).json({
        success: true,

        message:
          "Viewing rescheduled successfully.",

        data:
          viewing,
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

        error:
          error.message,
      });
    }
  };

/* ==========================================================
   CANCEL VIEWING
========================================================== */

/**
 * PATCH
 * /api/viewings/:id/cancel
 */
export const cancelViewing =
  async (req, res) => {
    try {
      const query = {
        _id: req.params.id,
      };

      applyOrganizationFilter(
        req,
        query
      );

      const viewing =
        await Viewing.findOne(query)
          .populate("lead")
          .populate("property");

      if (!viewing) {
        return res.status(404).json({
          success: false,

          message:
            "Viewing not found.",
        });
      }

      if (
        viewing.status ===
        "Cancelled"
      ) {
        return res.status(400).json({
          success: false,

          message:
            "Viewing has already been cancelled.",
        });
      }

      viewing.status =
        "Cancelled";

      viewing.cancelledAt =
        new Date();

      viewing.cancelledBy =
        req.user.id;

      await viewing.save();

      await Property.findByIdAndUpdate(
        viewing.property._id,
        {
          availability:
            "available",

          $inc: {
            "viewingStats.cancelledViewings":
              1,
          },
        }
      );

      const lead =
        await Lead.findById(
          viewing.lead._id
        );

      if (lead) {
        /**
         * Cancelled is a Viewing.status.
         *
         * Lead.status returns to qualified.
         */
        setLeadStatus(
          lead,
          "qualified"
        );

        if (
          lead.schema?.path(
            "viewingStatus"
          )
        ) {
          lead.viewingStatus =
            "cancelled";
        }

        await lead.save();
      }

      await createNotification({
        organizationId:
          req.user.organizationId,

        userId:
          viewing.requestedBy,

        title:
          "Viewing Cancelled",

        message:
          `Your viewing for "${viewing.property.title}" has been cancelled.`,

        metadata: {
          viewingId:
            viewing._id,
        },
      });

      return res.status(200).json({
        success: true,

        message:
          "Viewing cancelled successfully.",

        data:
          viewing,
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

        error:
          error.message,
      });
    }
  };

/* ==========================================================
   COMPLETE VIEWING
========================================================== */

/**
 * PATCH
 * /api/viewings/:id/complete
 */
export const completeViewing =
  async (req, res) => {
    try {
      const query = {
        _id: req.params.id,
      };

      applyOrganizationFilter(
        req,
        query
      );

      const viewing =
        await Viewing.findOne(query)
          .populate("lead")
          .populate("property");

      if (!viewing) {
        return res.status(404).json({
          success: false,

          message:
            "Viewing not found.",
        });
      }

      if (
        viewing.status ===
        "Completed"
      ) {
        return res.status(400).json({
          success: false,

          message:
            "Viewing has already been completed.",
        });
      }

      viewing.status =
        "Completed";

      viewing.completedAt =
        new Date();

      await viewing.save();

      await Property.findByIdAndUpdate(
        viewing.property._id,
        {
          availability:
            "available",

          $inc: {
            "viewingStats.completedViewings":
              1,
          },
        }
      );

      const lead =
        await Lead.findById(
          viewing.lead._id
        );

      if (lead) {
        /**
         * IMPORTANT:
         *
         * "follow_up" is NOT a valid Lead.status.
         *
         * After a completed viewing the Lead remains
         * in the valid "qualified" stage until the sales
         * workflow moves it to:
         *
         *   negotiation
         *   won
         *   lost
         *
         * Follow-up information belongs to:
         *
         *   followUpStatus
         *   followUpOutcome
         */
        setLeadStatus(
          lead,
          "qualified"
        );

        if (
          lead.schema?.path(
            "viewingStatus"
          )
        ) {
          lead.viewingStatus =
            "completed";
        }

        if (
          lead.schema?.path(
            "lastContact"
          )
        ) {
          lead.lastContact =
            new Date();
        }

        await lead.save();
      }

      await createNotification({
        organizationId:
          req.user.organizationId,

        userId:
          viewing.requestedBy,

        title:
          "Viewing Completed",

        message:
          `Your viewing for "${viewing.property.title}" has been marked as completed.`,

        metadata: {
          viewingId:
            viewing._id,
        },
      });

      return res.status(200).json({
        success: true,

        message:
          "Viewing completed successfully.",

        data:
          viewing,
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

        error:
          error.message,
      });
    }
  };

/* ==========================================================
   SUBMIT FEEDBACK
========================================================== */

/**
 * POST
 * /api/viewings/:id/feedback
 */
export const submitFeedback =
  async (req, res) => {
    try {
      const {
        viewerRating,
        viewerComment,
        agentOutcome,
        followUpRequired,
      } = req.body;

      const query = {
        _id: req.params.id,
      };

      applyOrganizationFilter(
        req,
        query
      );

      const viewing =
        await Viewing.findOne(query)
          .populate("lead")
          .populate("property");

      if (!viewing) {
        return res.status(404).json({
          success: false,

          message:
            "Viewing not found.",
        });
      }

      if (
        viewerRating !==
          undefined &&
        (
          Number(viewerRating) < 1 ||
          Number(viewerRating) > 5
        )
      ) {
        return res.status(400).json({
          success: false,

          message:
            "viewerRating must be between 1 and 5.",
        });
      }

      /* ------------------------------------------------------
         Save feedback
      ------------------------------------------------------ */

      viewing.feedback = {
        viewerRating:
          viewerRating !== undefined
            ? Number(viewerRating)
            : undefined,

        viewerComment,

        agentOutcome,

        followUpRequired:
          Boolean(
            followUpRequired
          ),
      };

      await viewing.save();

      /* ------------------------------------------------------
         Update property rating
      ------------------------------------------------------ */

      if (
        viewerRating !==
        undefined
      ) {
        const property =
          await Property.findById(
            viewing.property._id
          );

        if (property) {
          if (
            !property.viewingStats
          ) {
            property.viewingStats =
              {};
          }

          const currentRating =
            Number(
              property.viewingStats.averageRating ||
                0
            );

          const ratingCount =
            Number(
              property.viewingStats.ratingCount ||
                0
            );

          property.viewingStats.averageRating =
            (
              currentRating *
              ratingCount +
              Number(viewerRating)
            ) /
            (ratingCount + 1);

          property.viewingStats.ratingCount =
            ratingCount + 1;

          await property.save();
        }
      }

      /* ------------------------------------------------------
         Lead follow-up
      ------------------------------------------------------ */

      if (
        followUpRequired
      ) {
        await Lead.findByIdAndUpdate(
          viewing.lead._id,
          {
            followUpStatus:
              "pending",

            nextAction:
              "Customer follow-up after viewing",
          }
        );
      }

      /* ------------------------------------------------------
         Notify agent
      ------------------------------------------------------ */

      if (viewing.agent) {
        await createNotification({
          organizationId:
            req.user.organizationId,

          userId:
            viewing.agent,

          title:
            "Viewing Feedback Submitted",

          message:
            `Feedback has been submitted for "${viewing.property.title}".`,

          metadata: {
            viewingId:
              viewing._id,
          },
        });
      }

      return res.status(200).json({
        success: true,

        message:
          "Feedback submitted successfully.",

        data:
          viewing.feedback,
      });
    } catch (error) {
      console.error(
        "SUBMIT FEEDBACK ERROR:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          "Failed to submit viewing feedback.",

        error:
          error.message,
      });
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