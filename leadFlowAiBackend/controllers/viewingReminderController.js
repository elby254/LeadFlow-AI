// ======================================================
//
// Purpose
// ------------------------------------------------------
// Handles all API operations related to property-viewing
// reminders.
//
// Responsibilities
// ------------------------------------------------------
// ✓ Create reminder records
// ✓ Retrieve reminders
// ✓ Retrieve reminders by viewing
// ✓ Retrieve reminders by viewer
// ✓ Retrieve reminders by agent
// ✓ Retrieve failed reminders
// ✓ Retrieve pending reminders
// ✓ Retrieve queued reminders
// ✓ Retrieve upcoming reminders
// ✓ Retrieve today's reminders
// ✓ Retrieve reminder by ID
// ✓ Update reminder configuration
// ✓ Update reminder delivery status
// ✓ Retry failed reminders
// ✓ Cancel reminders
// ✓ Archive reminders
// ✓ Restore archived reminders
// ✓ Retrieve reminder statistics
// ✓ Delete archived reminders
// ✓ Role-aware access control
//
// Reminder Workflow
// ------------------------------------------------------
//
// Viewing
//    ↓
// Reminder Created
//    ↓
// Pending
//    ↓
// Queued
//    ↓
// Sent
//    ↓
// Delivered
//    ↓
// Read
//
// Failure
// ------------------------------------------------------
//
// Pending / Queued / Sent
//          ↓
//        Failed
//          ↓
//        Retry
//          ↓
//       Queued
//
// Roles
// ------------------------------------------------------
//
// Admin
//    → Can view and manage all reminders
//
// Agent
//    → Can view/manage reminders assigned to them
//
// Viewer / Customer
//    → Can view their own reminders
//
// ======================================================

import mongoose from "mongoose";

import ViewingReminder from "../models/viewingReminder.js";

// ======================================================
// HELPERS
// ======================================================

/**
 * Extract the authenticated user's ID.
 *
 * The authentication middleware should normally expose
 * the authenticated user through req.user.
 */
const getUserId = (req) => {
  return req.user?._id || req.user?.id || null;
};

/**
 * Extract the authenticated user's role.
 */
const getUserRole = (req) => {
  return String(req.user?.role || "").toLowerCase();
};

/**
 * Normalize/validate a MongoDB ObjectId.
 */
const isValidObjectId = (id) => {
  return mongoose.Types.ObjectId.isValid(id);
};

/**
 * Return the organization ID if one exists.
 *
 * This supports installations where organizationId is attached
 * either to req.user or directly to req.
 */
const getOrganizationId = (req) => {
  return req.user?.organizationId || req.organizationId || null;
};

/**
 * Add organization filtering when organization information
 * exists.
 *
 * This prevents accidentally mixing reminder records between
 * organizations in a multi-tenant installation.
 */
const addOrganizationFilter = (filter, req) => {
  const organizationId = getOrganizationId(req);

  if (organizationId) {
    filter.organizationId = organizationId;
  }

  return filter;
};

// ======================================================
// ROLE FILTER
// ======================================================

/**
 * Build MongoDB filter according to authenticated user's role.
 *
 * Admin
 * -----
 * Can access all reminders within their organization.
 *
 * Agent
 * -----
 * Can access reminders assigned to them.
 *
 * Viewer / Customer
 * -----------------
 * Can access reminders belonging to them.
 *
 * Returns:
 *   null → authentication missing
 *   object → MongoDB access filter
 */
const buildRoleFilter = (req) => {
  const userId = getUserId(req);
  const role = getUserRole(req);

  // ----------------------------------------------------
  // AUTHENTICATION
  // ----------------------------------------------------

  if (!userId) {
    return null;
  }

  // ----------------------------------------------------
  // ADMIN
  // ----------------------------------------------------

  if (role === "admin") {
    return addOrganizationFilter({}, req);
  }

  // ----------------------------------------------------
  // AGENT
  // ----------------------------------------------------

  if (role === "agent") {
    return addOrganizationFilter(
      {
        agent: userId,
      },
      req
    );
  }

  // ----------------------------------------------------
  // VIEWER / CUSTOMER
  // ----------------------------------------------------

  return addOrganizationFilter(
    {
      viewer: userId,
    },
    req
  );
};

// ======================================================
// GET ALL REMINDERS
// ======================================================
//
// GET /api/viewing-reminders
//
// Optional query parameters:
//
// ?status=Pending
// ?channel=WhatsApp
// ?reminderType=ViewingConfirmation
// ?page=1
// ?limit=50
//
// ======================================================

export const getAllReminders = async (req, res) => {
  try {
    const roleFilter = buildRoleFilter(req);

    if (!roleFilter) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    const {
      status,
      channel,
      reminderType,
      page = 1,
      limit = 50,
    } = req.query;

    const filter = {
      ...roleFilter,
      isArchived: false,
    };

    // --------------------------------------------------
    // STATUS FILTER
    // --------------------------------------------------

    if (status) {
      filter.status = status;
    }

    // --------------------------------------------------
    // CHANNEL FILTER
    // --------------------------------------------------

    if (channel) {
      filter.channel = channel;
    }

    // --------------------------------------------------
    // REMINDER TYPE FILTER
    // --------------------------------------------------

    if (reminderType) {
      filter.reminderType = reminderType;
    }

    // --------------------------------------------------
    // PAGINATION
    // --------------------------------------------------

    const safePage = Math.max(
      Number(page) || 1,
      1
    );

    const safeLimit = Math.min(
      Math.max(Number(limit) || 50, 1),
      100
    );

    const skip =
      (safePage - 1) * safeLimit;

    // --------------------------------------------------
    // QUERY
    // --------------------------------------------------

    const [reminders, total] =
      await Promise.all([
        ViewingReminder.find(filter)
          .populate(
            "viewing",
            "scheduledAt status"
          )
          .populate(
            "property",
            "title location price"
          )
          .populate(
            "lead",
            "name phone email"
          )
          .populate(
            "agent",
            "name email phone role"
          )
          .populate(
            "viewer",
            "name email phone role"
          )
          .sort({
            scheduledFor: 1,
            createdAt: -1,
          })
          .skip(skip)
          .limit(safeLimit)
          .lean(),

        ViewingReminder.countDocuments(filter),
      ]);

    // --------------------------------------------------
    // RESPONSE
    // --------------------------------------------------

    return res.status(200).json({
      success: true,
      data: reminders,
      pagination: {
        page: safePage,
        limit: safeLimit,
        total,
        pages: Math.ceil(
          total / safeLimit
        ),
      },
    });
  } catch (error) {
    console.error(
      "GET ALL VIEWING REMINDERS ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to retrieve viewing reminders.",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : undefined,
    });
  }
};

// ======================================================
// GET REMINDER BY ID
// ======================================================
//
// GET /api/viewing-reminders/:id
//
// IMPORTANT:
// This route should remain after named routes in the router.
//
// ======================================================

export const getReminderById = async (req, res) => {
  try {
    const { id } = req.params;

    // --------------------------------------------------
    // VALIDATE ID
    // --------------------------------------------------

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid reminder ID.",
      });
    }

    // --------------------------------------------------
    // AUTH / ROLE FILTER
    // --------------------------------------------------

    const roleFilter = buildRoleFilter(req);

    if (!roleFilter) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    // --------------------------------------------------
    // QUERY
    // --------------------------------------------------

    const reminder =
      await ViewingReminder.findOne({
        _id: id,
        ...roleFilter,
        isArchived: false,
      })
        .populate(
          "viewing",
          "scheduledAt status"
        )
        .populate(
          "property",
          "title location price"
        )
        .populate(
          "lead",
          "name phone email"
        )
        .populate(
          "agent",
          "name email phone role"
        )
        .populate(
          "viewer",
          "name email phone role"
        )
        .lean();

    // --------------------------------------------------
    // NOT FOUND
    // --------------------------------------------------

    if (!reminder) {
      return res.status(404).json({
        success: false,
        message:
          "Viewing reminder not found.",
      });
    }

    return res.status(200).json({
      success: true,
      data: reminder,
    });
  } catch (error) {
    console.error(
      "GET VIEWING REMINDER BY ID ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to retrieve viewing reminder.",
    });
  }
};

// ======================================================
// GET REMINDERS BY VIEWING
// ======================================================
//
// GET /api/viewing-reminders/viewing/:viewingId
//
// ======================================================

export const getRemindersByViewing = async (
  req,
  res
) => {
  try {
    const { viewingId } = req.params;

    // --------------------------------------------------
    // VALIDATE VIEWING ID
    // --------------------------------------------------

    if (!viewingId) {
      return res.status(400).json({
        success: false,
        message: "Viewing ID is required.",
      });
    }

    if (!isValidObjectId(viewingId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid viewing ID.",
      });
    }

    // --------------------------------------------------
    // ROLE FILTER
    // --------------------------------------------------

    const roleFilter = buildRoleFilter(req);

    if (!roleFilter) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    // --------------------------------------------------
    // QUERY
    // --------------------------------------------------

    const reminders =
      await ViewingReminder.find({
        viewing: viewingId,
        ...roleFilter,
        isArchived: false,
      })
        .populate(
          "viewing",
          "scheduledAt status"
        )
        .populate(
          "property",
          "title location price"
        )
        .populate(
          "lead",
          "name phone email"
        )
        .populate(
          "agent",
          "name email phone role"
        )
        .populate(
          "viewer",
          "name email phone role"
        )
        .sort({
          scheduledFor: 1,
        })
        .lean();

    return res.status(200).json({
      success: true,
      count: reminders.length,
      data: reminders,
    });
  } catch (error) {
    console.error(
      "GET REMINDERS BY VIEWING ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to retrieve viewing reminders.",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : undefined,
    });
  }
};

// ======================================================
// GET REMINDERS BY VIEWER
// ======================================================
//
// GET /api/viewing-reminders/viewer/:viewerId
//
// ======================================================

export const getRemindersByViewer = async (
  req,
  res
) => {
  try {
    const { viewerId } = req.params;

    // --------------------------------------------------
    // VALIDATE VIEWER ID
    // --------------------------------------------------

    if (!viewerId) {
      return res.status(400).json({
        success: false,
        message: "Viewer ID is required.",
      });
    }

    if (!isValidObjectId(viewerId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid viewer ID.",
      });
    }

    // --------------------------------------------------
    // AUTHENTICATION
    // --------------------------------------------------

    const userId = getUserId(req);
    const role = getUserRole(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    // --------------------------------------------------
    // ACCESS CONTROL
    // --------------------------------------------------
    //
    // Admin:
    // Can inspect any viewer's reminders.
    //
    // Agent:
    // Can inspect viewer reminders connected to
    // their assigned workflow.
    //
    // Viewer:
    // Can only inspect their own reminders.
    //
    // --------------------------------------------------

    if (
      role !== "admin" &&
      role !== "agent" &&
      String(userId) !== String(viewerId)
    ) {
      return res.status(403).json({
        success: false,
        message:
          "You are not authorized to view these reminders.",
      });
    }

    // --------------------------------------------------
    // BUILD FILTER
    // --------------------------------------------------

    const filter = {
      viewer: viewerId,
      isArchived: false,
    };

    // --------------------------------------------------
    // AGENT RESTRICTION
    // --------------------------------------------------

    if (role === "agent") {
      filter.agent = userId;
    }

    addOrganizationFilter(filter, req);

    // --------------------------------------------------
    // QUERY
    // --------------------------------------------------

    const reminders =
      await ViewingReminder.find(filter)
        .populate(
          "viewing",
          "scheduledAt status"
        )
        .populate(
          "property",
          "title location price"
        )
        .populate(
          "lead",
          "name phone email"
        )
        .populate(
          "agent",
          "name email phone role"
        )
        .populate(
          "viewer",
          "name email phone role"
        )
        .sort({
          scheduledFor: 1,
        })
        .lean();

    return res.status(200).json({
      success: true,
      count: reminders.length,
      data: reminders,
    });
  } catch (error) {
    console.error(
      "GET REMINDERS BY VIEWER ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to retrieve viewer reminders.",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : undefined,
    });
  }
};

// ======================================================
// GET REMINDERS BY AGENT
// ======================================================
//
// GET /api/viewing-reminders/agent/:agentId
//
// ======================================================

export const getRemindersByAgent = async (
  req,
  res
) => {
  try {
    const { agentId } = req.params;

    const {
      page = 1,
      limit = 50,
      status,
      includeArchived = false,
    } = req.query;

    // --------------------------------------------------
    // VALIDATE AGENT ID
    // --------------------------------------------------

    if (!agentId) {
      return res.status(400).json({
        success: false,
        message: "Agent ID is required.",
      });
    }

    if (!isValidObjectId(agentId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid agent ID.",
      });
    }

    // --------------------------------------------------
    // AUTH
    // --------------------------------------------------

    const userId = getUserId(req);
    const role = getUserRole(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    // --------------------------------------------------
    // ACCESS CONTROL
    // --------------------------------------------------

    if (
      role !== "admin" &&
      String(userId) !== String(agentId)
    ) {
      return res.status(403).json({
        success: false,
        message:
          "You are not authorized to view these agent reminders.",
      });
    }

    // --------------------------------------------------
    // PAGINATION
    // --------------------------------------------------

    const parsedPage = Math.max(
      Number(page) || 1,
      1
    );

    const parsedLimit = Math.min(
      Math.max(Number(limit) || 50, 1),
      100
    );

    const skip =
      (parsedPage - 1) * parsedLimit;

    // --------------------------------------------------
    // FILTER
    // --------------------------------------------------

    const filter = {
      agent: agentId,
    };

    addOrganizationFilter(filter, req);

    // --------------------------------------------------
    // ARCHIVED FILTER
    // --------------------------------------------------

    if (includeArchived !== "true") {
      filter.isArchived = false;
    }

    // --------------------------------------------------
    // STATUS FILTER
    // --------------------------------------------------

    if (status) {
      const allowedStatuses = [
        "Pending",
        "Queued",
        "Sent",
        "Delivered",
        "Read",
        "Failed",
        "Cancelled",
      ];

      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message:
            `Invalid reminder status: ${status}`,
        });
      }

      filter.status = status;
    }

    // --------------------------------------------------
    // QUERY
    // --------------------------------------------------

    const [reminders, total] =
      await Promise.all([
        ViewingReminder.find(filter)
          .populate("viewing")
          .populate("lead")
          .populate("property")
          .populate(
            "agent",
            "name email phone role"
          )
          .populate(
            "viewer",
            "name email phone role"
          )
          .sort({
            scheduledFor: 1,
            createdAt: -1,
          })
          .skip(skip)
          .limit(parsedLimit)
          .lean(),

        ViewingReminder.countDocuments(filter),
      ]);

    return res.status(200).json({
      success: true,
      message:
        "Agent reminders retrieved successfully.",
      count: reminders.length,
      total,
      page: parsedPage,
      limit: parsedLimit,
      totalPages: Math.ceil(
        total / parsedLimit
      ),
      data: reminders,
    });
  } catch (error) {
    console.error(
      "GET REMINDERS BY AGENT ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to retrieve agent reminders.",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : undefined,
    });
  }
};

// ======================================================
// GET FAILED REMINDERS
// ======================================================
//
// GET /api/viewing-reminders/failed
//
// ======================================================

export const getFailedReminders = async (
  req,
  res
) => {
  try {
    const roleFilter = buildRoleFilter(req);

    if (!roleFilter) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    const reminders =
      await ViewingReminder.find({
        ...roleFilter,
        status: "Failed",
        isArchived: false,
      })
        .populate(
          "viewing",
          "scheduledAt status"
        )
        .populate(
          "property",
          "title location price"
        )
        .populate(
          "lead",
          "name phone email"
        )
        .populate(
          "agent",
          "name email phone role"
        )
        .populate(
          "viewer",
          "name email phone role"
        )
        .sort({
          updatedAt: -1,
        })
        .lean();

    return res.status(200).json({
      success: true,
      data: reminders,
      count: reminders.length,
    });
  } catch (error) {
    console.error(
      "GET FAILED REMINDERS ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to retrieve failed reminders.",
    });
  }
};

// ======================================================
// GET PENDING REMINDERS
// ======================================================
//
// GET /api/viewing-reminders/pending
//
// Returns Pending and Queued reminders.
//
// ======================================================

export const getPendingReminders = async (
  req,
  res
) => {
  try {
    const roleFilter = buildRoleFilter(req);

    if (!roleFilter) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    const reminders =
      await ViewingReminder.find({
        ...roleFilter,
        status: {
          $in: [
            "Pending",
            "Queued",
          ],
        },
        isArchived: false,
      })
        .populate(
          "viewing",
          "scheduledAt status"
        )
        .populate(
          "property",
          "title location price"
        )
        .populate(
          "lead",
          "name phone email"
        )
        .populate(
          "agent",
          "name email phone role"
        )
        .populate(
          "viewer",
          "name email phone role"
        )
        .sort({
          scheduledFor: 1,
        })
        .lean();

    return res.status(200).json({
      success: true,
      data: reminders,
      count: reminders.length,
    });
  } catch (error) {
    console.error(
      "GET PENDING REMINDERS ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to retrieve pending reminders.",
    });
  }
};

// ======================================================
// GET QUEUED REMINDERS
// ======================================================
//
// GET /api/viewing-reminders/queued
//
// ======================================================

export const getQueuedReminders = async (
  req,
  res
) => {
  try {
    const {
      limit = 50,
      page = 1,
    } = req.query;

    const roleFilter = buildRoleFilter(req);

    if (!roleFilter) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    const parsedLimit = Math.min(
      Math.max(Number(limit) || 50, 1),
      100
    );

    const parsedPage = Math.max(
      Number(page) || 1,
      1
    );

    const skip =
      (parsedPage - 1) * parsedLimit;

    const filter = {
      ...roleFilter,
      status: "Queued",
      isArchived: false,
    };

    const [reminders, total] =
      await Promise.all([
        ViewingReminder.find(filter)
          .populate("viewing")
          .populate("lead")
          .populate("property")
          .populate(
            "agent",
            "name email phone role"
          )
          .populate(
            "viewer",
            "name email phone role"
          )
          .sort({
            scheduledFor: 1,
            createdAt: 1,
          })
          .skip(skip)
          .limit(parsedLimit)
          .lean(),

        ViewingReminder.countDocuments(filter),
      ]);

    return res.status(200).json({
      success: true,
      message:
        "Queued reminders retrieved successfully.",
      count: reminders.length,
      total,
      page: parsedPage,
      limit: parsedLimit,
      totalPages: Math.ceil(
        total / parsedLimit
      ),
      data: reminders,
    });
  } catch (error) {
    console.error(
      "GET QUEUED REMINDERS ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to retrieve queued reminders.",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : undefined,
    });
  }
};

// ======================================================
// GET UPCOMING REMINDERS
// ======================================================
//
// GET /api/viewing-reminders/upcoming
//
// Returns Pending / Queued reminders scheduled
// from now onward.
//
// ======================================================

export const getUpcomingReminders = async (
  req,
  res
) => {
  try {
    const roleFilter = buildRoleFilter(req);

    if (!roleFilter) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    const now = new Date();

    const reminders =
      await ViewingReminder.find({
        ...roleFilter,
        status: {
          $in: [
            "Pending",
            "Queued",
          ],
        },
        scheduledFor: {
          $gte: now,
        },
        isArchived: false,
      })
        .populate(
          "viewing",
          "scheduledAt status"
        )
        .populate(
          "property",
          "title location price"
        )
        .populate(
          "lead",
          "name phone email"
        )
        .populate(
          "agent",
          "name email phone role"
        )
        .populate(
          "viewer",
          "name email phone role"
        )
        .sort({
          scheduledFor: 1,
        })
        .limit(100)
        .lean();

    return res.status(200).json({
      success: true,
      data: reminders,
      count: reminders.length,
    });
  } catch (error) {
    console.error(
      "GET UPCOMING REMINDERS ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to retrieve upcoming reminders.",
    });
  }
};

// ======================================================
// GET TODAY'S REMINDERS
// ======================================================
//
// GET /api/viewing-reminders/today
//
// ======================================================

export const getTodayReminders = async (
  req,
  res
) => {
  try {
    const roleFilter = buildRoleFilter(req);

    if (!roleFilter) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    const startOfDay = new Date();

    startOfDay.setHours(
      0,
      0,
      0,
      0
    );

    const endOfDay = new Date();

    endOfDay.setHours(
      23,
      59,
      59,
      999
    );

    const reminders =
      await ViewingReminder.find({
        ...roleFilter,
        scheduledFor: {
          $gte: startOfDay,
          $lte: endOfDay,
        },
        isArchived: false,
      })
        .populate(
          "viewing",
          "scheduledAt status"
        )
        .populate(
          "property",
          "title location price"
        )
        .populate(
          "lead",
          "name phone email"
        )
        .populate(
          "agent",
          "name email phone role"
        )
        .populate(
          "viewer",
          "name email phone role"
        )
        .sort({
          scheduledFor: 1,
        })
        .lean();

    return res.status(200).json({
      success: true,
      data: reminders,
      count: reminders.length,
    });
  } catch (error) {
    console.error(
      "GET TODAY REMINDERS ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to retrieve today's reminders.",
    });
  }
};

// ======================================================
// CREATE REMINDER
// ======================================================
//
// POST /api/viewing-reminders
//
// ======================================================

export const createReminder = async (
  req,
  res
) => {
  try {
    const userId = getUserId(req);
    const role = getUserRole(req);

    // --------------------------------------------------
    // AUTH
    // --------------------------------------------------

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    // --------------------------------------------------
    // AUTHORIZATION
    // --------------------------------------------------

    if (
      role !== "admin" &&
      role !== "agent"
    ) {
      return res.status(403).json({
        success: false,
        message:
          "You are not authorized to create viewing reminders.",
      });
    }

    // --------------------------------------------------
    // BODY
    // --------------------------------------------------

    const {
      viewing,
      lead,
      property,
      agent,
      viewer,
      reminderType,
      channel,
      subject,
      message,
      scheduledFor,
      recipient,
      maxRetries,
      isAutomated = true,
    } = req.body;

    // --------------------------------------------------
    // REQUIRED FIELDS
    // --------------------------------------------------

    if (
      !viewing ||
      !lead ||
      !property ||
      !agent ||
      !viewer ||
      !reminderType ||
      !channel ||
      !message ||
      !scheduledFor
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Missing required reminder fields.",
      });
    }

    // --------------------------------------------------
    // VALIDATE IDS
    // --------------------------------------------------

    const ids = {
      viewing,
      lead,
      property,
      agent,
      viewer,
    };

    for (const [key, value] of Object.entries(
      ids
    )) {
      if (!isValidObjectId(value)) {
        return res.status(400).json({
          success: false,
          message:
            `Invalid ${key} ID.`,
        });
      }
    }

    // --------------------------------------------------
    // AGENT PROTECTION
    // --------------------------------------------------

    if (
      role === "agent" &&
      String(agent) !== String(userId)
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Agents can only create reminders assigned to themselves.",
      });
    }

    // --------------------------------------------------
    // DATE
    // --------------------------------------------------

    const scheduledDate =
      new Date(scheduledFor);

    if (
      Number.isNaN(
        scheduledDate.getTime()
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid scheduledFor date.",
      });
    }

    // --------------------------------------------------
    // CREATE DATA
    // --------------------------------------------------

    const reminderData = {
      viewing,
      lead,
      property,
      agent,
      viewer,
      reminderType,
      channel,
      subject: subject || "",
      message,
      scheduledFor: scheduledDate,
      status: "Pending",
      retryCount: 0,
      maxRetries:
        Number(maxRetries) >= 0
          ? Number(maxRetries)
          : 3,
      recipient: recipient || {},
      isAutomated,
      isArchived: false,
    };

    addOrganizationFilter(
      reminderData,
      req
    );

    // --------------------------------------------------
    // CREATE
    // --------------------------------------------------

    const reminder =
      await ViewingReminder.create(
        reminderData
      );

    return res.status(201).json({
      success: true,
      message:
        "Viewing reminder created successfully.",
      data: reminder,
    });
  } catch (error) {
    console.error(
      "CREATE VIEWING REMINDER ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to create viewing reminder.",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : undefined,
    });
  }
};

// ======================================================
// UPDATE REMINDER
// ======================================================
//
// PUT /api/viewing-reminders/:id
//
// Updates reminder configuration.
//
// ======================================================

export const updateReminder = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid reminder ID.",
      });
    }

    const roleFilter =
      buildRoleFilter(req);

    if (!roleFilter) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    const reminder =
      await ViewingReminder.findOne({
        _id: id,
        ...roleFilter,
        isArchived: false,
      });

    if (!reminder) {
      return res.status(404).json({
        success: false,
        message:
          "Viewing reminder not found.",
      });
    }

    // --------------------------------------------------
    // ALLOWED FIELDS
    // --------------------------------------------------

    const allowedFields = [
      "reminderType",
      "channel",
      "subject",
      "message",
      "scheduledFor",
      "recipient",
      "maxRetries",
      "isAutomated",
    ];

    for (const field of allowedFields) {
      if (
        req.body[field] !== undefined
      ) {
        reminder[field] =
          req.body[field];
      }
    }

    // --------------------------------------------------
    // DATE VALIDATION
    // --------------------------------------------------

    if (
      req.body.scheduledFor !== undefined
    ) {
      const date =
        new Date(
          req.body.scheduledFor
        );

      if (
        Number.isNaN(
          date.getTime()
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid scheduledFor date.",
        });
      }

      reminder.scheduledFor =
        date;
    }

    await reminder.save();

    return res.status(200).json({
      success: true,
      message:
        "Viewing reminder updated successfully.",
      data: reminder,
    });
  } catch (error) {
    console.error(
      "UPDATE VIEWING REMINDER ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to update viewing reminder.",
    });
  }
};

// ======================================================
// UPDATE REMINDER STATUS
// ======================================================
//
// PATCH /api/viewing-reminders/:id/status
//
// Supported:
//
// Pending
// Queued
// Sent
// Delivered
// Read
// Failed
// Cancelled
//
// ======================================================

export const updateReminderStatus = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    const {
      status,
      failureReason,
    } = req.body;

    // --------------------------------------------------
    // VALIDATE ID
    // --------------------------------------------------

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid reminder ID.",
      });
    }

    // --------------------------------------------------
    // VALIDATE STATUS
    // --------------------------------------------------

    const allowedStatuses = [
      "Pending",
      "Queued",
      "Sent",
      "Delivered",
      "Read",
      "Failed",
      "Cancelled",
    ];

    if (
      !allowedStatuses.includes(status)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid reminder status.",
      });
    }

    // --------------------------------------------------
    // AUTH
    // --------------------------------------------------

    const userId =
      getUserId(req);

    const role =
      getUserRole(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message:
          "Authentication required.",
      });
    }

    // --------------------------------------------------
    // AUTHORIZATION
    // --------------------------------------------------

    if (
      role !== "admin" &&
      role !== "agent"
    ) {
      return res.status(403).json({
        success: false,
        message:
          "You are not authorized to update reminder status.",
      });
    }

    // --------------------------------------------------
    // ROLE FILTER
    // --------------------------------------------------

    const roleFilter =
      buildRoleFilter(req);

    if (!roleFilter) {
      return res.status(401).json({
        success: false,
        message:
          "Authentication required.",
      });
    }

    // --------------------------------------------------
    // FIND
    // --------------------------------------------------

    const reminder =
      await ViewingReminder.findOne({
        _id: id,
        ...roleFilter,
        isArchived: false,
      });

    if (!reminder) {
      return res.status(404).json({
        success: false,
        message:
          "Viewing reminder not found.",
      });
    }

    // --------------------------------------------------
    // STATUS TRANSITIONS
    // --------------------------------------------------

    const transitions = {
      Pending: [
        "Queued",
        "Cancelled",
        "Failed",
      ],

      Queued: [
        "Sent",
        "Cancelled",
        "Failed",
      ],

      Sent: [
        "Delivered",
        "Failed",
      ],

      Delivered: [
        "Read",
      ],

      Read: [],

      Failed: [
        "Queued",
        "Cancelled",
      ],

      Cancelled: [],
    };

    const currentStatus =
      reminder.status;

    // --------------------------------------------------
    // SAME STATUS
    // --------------------------------------------------

    if (
      currentStatus === status
    ) {
      return res.status(200).json({
        success: true,
        message:
          "Reminder already has this status.",
        data: reminder,
      });
    }

    const validTransitions =
      transitions[
        currentStatus
      ] || [];

    // --------------------------------------------------
    // INVALID TRANSITION
    // --------------------------------------------------

    if (
      !validTransitions.includes(status)
    ) {
      return res.status(400).json({
        success: false,
        message:
          `Invalid reminder status transition: ${currentStatus} → ${status}.`,
      });
    }

    // --------------------------------------------------
    // UPDATE STATUS
    // --------------------------------------------------

    reminder.status =
      status;

    // --------------------------------------------------
    // SENT
    // --------------------------------------------------

    if (status === "Sent") {
      reminder.sentAt =
        new Date();
    }

    // --------------------------------------------------
    // FAILED
    // --------------------------------------------------

    if (status === "Failed") {
      reminder.failureReason =
        failureReason || "";

      reminder.lastRetryAt =
        new Date();
    }

    // --------------------------------------------------
    // DELIVERED / READ
    // --------------------------------------------------

    if (
      status === "Delivered" ||
      status === "Read"
    ) {
      reminder.sentAt =
        reminder.sentAt ||
        new Date();
    }

    await reminder.save();

    return res.status(200).json({
      success: true,
      message:
        "Viewing reminder status updated.",
      data: reminder,
    });
  } catch (error) {
    console.error(
      "UPDATE REMINDER STATUS ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to update reminder status.",
    });
  }
};

// ======================================================
// RETRY FAILED REMINDER
// ======================================================
//
// POST /api/viewing-reminders/:id/retry
//
// This is the ONLY retry handler used by the routes.
//
// ======================================================

export const retryReminder = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid reminder ID.",
      });
    }

    // --------------------------------------------------
    // AUTH
    // --------------------------------------------------

    const userId =
      getUserId(req);

    const role =
      getUserRole(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message:
          "Authentication required.",
      });
    }

    // --------------------------------------------------
    // AUTHORIZATION
    // --------------------------------------------------

    if (
      role !== "admin" &&
      role !== "agent"
    ) {
      return res.status(403).json({
        success: false,
        message:
          "You are not authorized to retry reminders.",
      });
    }

    // --------------------------------------------------
    // ROLE FILTER
    // --------------------------------------------------

    const roleFilter =
      buildRoleFilter(req);

    if (!roleFilter) {
      return res.status(401).json({
        success: false,
        message:
          "Authentication required.",
      });
    }

    // --------------------------------------------------
    // FIND FAILED REMINDER
    // --------------------------------------------------

    const reminder =
      await ViewingReminder.findOne({
        _id: id,
        ...roleFilter,
        status: "Failed",
        isArchived: false,
      });

    if (!reminder) {
      return res.status(404).json({
        success: false,
        message:
          "Failed reminder not found.",
      });
    }

    // --------------------------------------------------
    // RETRY LIMIT
    // --------------------------------------------------

    const maxRetries =
      Number(reminder.maxRetries) || 0;

    const retryCount =
      Number(reminder.retryCount) || 0;

    if (
      retryCount >= maxRetries
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Maximum retry attempts reached for this reminder.",
        data: {
          retryCount,
          maxRetries,
        },
      });
    }

    // --------------------------------------------------
    // RESET DELIVERY STATE
    // --------------------------------------------------

    reminder.retryCount =
      retryCount + 1;

    reminder.lastRetryAt =
      new Date();

    reminder.status =
      "Queued";

    reminder.failureReason =
      "";

    reminder.sentAt =
      null;

    // --------------------------------------------------
    // SAVE
    // --------------------------------------------------

    await reminder.save();

    return res.status(200).json({
      success: true,
      message:
        "Reminder queued for retry.",
      data: reminder,
    });
  } catch (error) {
    console.error(
      "RETRY REMINDER ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to retry reminder.",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : undefined,
    });
  }
};

// ======================================================
// CANCEL REMINDER
// ======================================================
//
// PATCH /api/viewing-reminders/:id/cancel
//
// ======================================================

export const cancelReminder = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid reminder ID.",
      });
    }

    const roleFilter =
      buildRoleFilter(req);

    if (!roleFilter) {
      return res.status(401).json({
        success: false,
        message:
          "Authentication required.",
      });
    }

    const reminder =
      await ViewingReminder.findOne({
        _id: id,
        ...roleFilter,
        isArchived: false,
      });

    if (!reminder) {
      return res.status(404).json({
        success: false,
        message:
          "Viewing reminder not found.",
      });
    }

    // --------------------------------------------------
    // ONLY PENDING / QUEUED
    // --------------------------------------------------

    if (
      ![
        "Pending",
        "Queued",
      ].includes(
        reminder.status
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          `Reminder cannot be cancelled from ${reminder.status} status.`,
      });
    }

    reminder.status =
      "Cancelled";

    await reminder.save();

    return res.status(200).json({
      success: true,
      message:
        "Viewing reminder cancelled.",
      data: reminder,
    });
  } catch (error) {
    console.error(
      "CANCEL VIEWING REMINDER ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to cancel viewing reminder.",
    });
  }
};

// ======================================================
// ARCHIVE REMINDER
// ======================================================
//
// PATCH /api/viewing-reminders/:id/archive
//
// Soft deletes a reminder.
//
// ======================================================

export const archiveReminder = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid reminder ID.",
      });
    }

    const roleFilter =
      buildRoleFilter(req);

    if (!roleFilter) {
      return res.status(401).json({
        success: false,
        message:
          "Authentication required.",
      });
    }

    const reminder =
      await ViewingReminder.findOne({
        _id: id,
        ...roleFilter,
        isArchived: false,
      });

    if (!reminder) {
      return res.status(404).json({
        success: false,
        message:
          "Viewing reminder not found.",
      });
    }

    reminder.isArchived =
      true;

    await reminder.save();

    return res.status(200).json({
      success: true,
      message:
        "Viewing reminder archived.",
      data: reminder,
    });
  } catch (error) {
    console.error(
      "ARCHIVE VIEWING REMINDER ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to archive viewing reminder.",
    });
  }
};

// ======================================================
// RESTORE REMINDER
// ======================================================
//
// PATCH /api/viewing-reminders/:id/restore
//
// Admin only.
//
// ======================================================

export const restoreReminder = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid reminder ID.",
      });
    }

    const userId =
      getUserId(req);

    const role =
      getUserRole(req);

    // --------------------------------------------------
    // AUTH
    // --------------------------------------------------

    if (!userId) {
      return res.status(401).json({
        success: false,
        message:
          "Authentication required.",
      });
    }

    // --------------------------------------------------
    // ADMIN ONLY
    // --------------------------------------------------

    if (role !== "admin") {
      return res.status(403).json({
        success: false,
        message:
          "Only administrators can restore archived reminders.",
      });
    }

    // --------------------------------------------------
    // FILTER
    // --------------------------------------------------

    const filter = {
      _id: id,
      isArchived: true,
    };

    addOrganizationFilter(
      filter,
      req
    );

    // --------------------------------------------------
    // FIND
    // --------------------------------------------------

    const reminder =
      await ViewingReminder.findOne(
        filter
      );

    if (!reminder) {
      return res.status(404).json({
        success: false,
        message:
          "Archived reminder not found.",
      });
    }

    // --------------------------------------------------
    // RESTORE
    // --------------------------------------------------

    reminder.isArchived =
      false;

    await reminder.save();

    return res.status(200).json({
      success: true,
      message:
        "Viewing reminder restored.",
      data: reminder,
    });
  } catch (error) {
    console.error(
      "RESTORE VIEWING REMINDER ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to restore viewing reminder.",
    });
  }
};

// ======================================================
// GET REMINDER STATISTICS
// ======================================================
//
// GET /api/viewing-reminders/statistics
//
// ======================================================

export const getReminderStatistics = async (
  req,
  res
) => {
  try {
    const roleFilter =
      buildRoleFilter(req);

    if (!roleFilter) {
      return res.status(401).json({
        success: false,
        message:
          "Authentication required.",
      });
    }

    const filter = {
      ...roleFilter,
      isArchived: false,
    };

    const [
      total,
      pending,
      queued,
      sent,
      delivered,
      read,
      failed,
      cancelled,
    ] = await Promise.all([
      ViewingReminder.countDocuments(
        filter
      ),

      ViewingReminder.countDocuments({
        ...filter,
        status: "Pending",
      }),

      ViewingReminder.countDocuments({
        ...filter,
        status: "Queued",
      }),

      ViewingReminder.countDocuments({
        ...filter,
        status: "Sent",
      }),

      ViewingReminder.countDocuments({
        ...filter,
        status: "Delivered",
      }),

      ViewingReminder.countDocuments({
        ...filter,
        status: "Read",
      }),

      ViewingReminder.countDocuments({
        ...filter,
        status: "Failed",
      }),

      ViewingReminder.countDocuments({
        ...filter,
        status: "Cancelled",
      }),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        total,
        pending,
        queued,
        sent,
        delivered,
        read,
        failed,
        cancelled,
      },
    });
  } catch (error) {
    console.error(
      "GET REMINDER STATISTICS ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to load reminder statistics.",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : undefined,
    });
  }
};

// ======================================================
// DELETE ARCHIVED REMINDERS
// ======================================================
//
// DELETE /api/viewing-reminders/archived
//
// Permanently deletes archived reminders.
//
// Intended for administrative cleanup.
//
// ======================================================

export const deleteArchivedReminders = async (
  req,
  res
) => {
  try {
    const userId =
      getUserId(req);

    const role =
      getUserRole(req);

    // --------------------------------------------------
    // AUTH
    // --------------------------------------------------

    if (!userId) {
      return res.status(401).json({
        success: false,
        message:
          "Authentication required.",
      });
    }

    // --------------------------------------------------
    // ADMIN ONLY
    // --------------------------------------------------

    if (role !== "admin") {
      return res.status(403).json({
        success: false,
        message:
          "Only administrators can permanently delete archived reminders.",
      });
    }

    // --------------------------------------------------
    // FILTER
    // --------------------------------------------------

    const filter = {
      isArchived: true,
    };

    addOrganizationFilter(
      filter,
      req
    );

    // --------------------------------------------------
    // DELETE
    // --------------------------------------------------

    const result =
      await ViewingReminder.deleteMany(
        filter
      );

    return res.status(200).json({
      success: true,
      message:
        "Archived reminders deleted successfully.",
      deletedCount:
        result.deletedCount,
    });
  } catch (error) {
    console.error(
      "DELETE ARCHIVED REMINDERS ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to delete archived reminders.",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : undefined,
    });
  }
};

// ======================================================
// DEFAULT EXPORT
// ======================================================
//
// Must match the functions imported by:
// viewingReminderRoutes.js
//
// ======================================================

export default {
  // General
  getAllReminders,
  getReminderById,
  createReminder,

  // Viewing / users
  getRemindersByViewing,
  getRemindersByViewer,
  getRemindersByAgent,

  // Queues
  getPendingReminders,
  getQueuedReminders,
  getFailedReminders,
  getUpcomingReminders,
  getTodayReminders,

  // Mutations
  updateReminder,
  updateReminderStatus,
  retryReminder,
  cancelReminder,
  archiveReminder,
  restoreReminder,

  // Analytics
  getReminderStatistics,

  // Cleanup
  deleteArchivedReminders,
};