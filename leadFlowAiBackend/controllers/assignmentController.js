// =====================================================
//
// Purpose
// -----------------------------------------------------
// Handles the operational lead workflow between:
//
// Admin
//   ↓
// Assign / Reassign Lead
//   ↓
// Agent
//   ↓
// View Assigned Leads
//
// Security model
// -----------------------------------------------------
//
// ADMIN
// ✓ Assign leads
// ✓ Reassign leads
// ✓ View unassigned leads
//
// AGENT
// ✓ View ONLY assigned leads
// ✓ Cannot assign leads
// ✓ Cannot reassign leads
//
// VIEWER
// ✗ No lead workflow access
//
// Multi-tenant isolation
// -----------------------------------------------------
// Every lead query is restricted by:
//
// req.user.organizationId
//
// An agent can NEVER retrieve a lead belonging to
// another organization.
//
// =====================================================

import mongoose from "mongoose";
import Lead from "../models/lead.js";
import User from "../models/user.js";

import leadEventBus, {
  LEAD_EVENTS,
} from "../events/leadEvents.js";

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

const getUserId = (req) => {
  return req.user?._id || req.user?.id || null;
};

// =====================================================
// HELPER: GET ORGANIZATION ID
// =====================================================
//
// protect() attaches:
//
// req.organizationId
//
// We also support:
//
// req.user.organizationId
//
// =====================================================

const getOrganizationId = (req) => {
  return (
    req.organizationId ||
    req.user?.organizationId ||
    null
  );
};

// =====================================================
// HELPER: VALIDATE OBJECT ID
// =====================================================

const isValidObjectId = (value) => {
  return mongoose.Types.ObjectId.isValid(value);
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
// Assign lead
//   ↓
// Emit pipeline update
//
// =====================================================

export const assignLead = async (req, res) => {
  try {
    console.log(
      "👤 ADMIN ASSIGN LEAD REQUEST"
    );

    const { id } = req.params;
    const { agentId } = req.body;

    const adminId = getUserId(req);
    const organizationId = getOrganizationId(req);

    // -------------------------------------------------
    // AUTHENTICATION SAFETY
    // -------------------------------------------------

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    // -------------------------------------------------
    // ORGANIZATION SAFETY
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

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid lead ID.",
      });
    }

    // -------------------------------------------------
    // VALIDATE AGENT ID
    // -------------------------------------------------

    if (
      !agentId ||
      !isValidObjectId(agentId)
    ) {
      return res.status(400).json({
        success: false,
        message: "A valid agent ID is required.",
      });
    }

    // -------------------------------------------------
    // FIND LEAD
    // -------------------------------------------------
    //
    // IMPORTANT:
    // Organization is included to prevent an admin
    // from accidentally modifying another organization's
    // lead.
    //
    // -------------------------------------------------

    const lead = await Lead.findOne({
      _id: id,
      organizationId,
    });

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: "Lead not found.",
      });
    }

    // -------------------------------------------------
    // FIND AGENT
    // -------------------------------------------------
    //
    // The target user MUST:
    //
    // ✓ Exist
    // ✓ Be an agent
    // ✓ Belong to same organization
    //
    // -------------------------------------------------

    const agent = await User.findOne({
      _id: agentId,
      role: "agent",
      organizationId,
    }).select("_id name email role organizationId");

    if (!agent) {
      return res.status(400).json({
        success: false,
        message:
          "The selected user is not a valid agent in this organization.",
      });
    }

    // -------------------------------------------------
    // ASSIGN LEAD
    // -------------------------------------------------

    lead.assignedTo = agent._id;
    lead.assignedBy = adminId;
    lead.assignedAt = new Date();
    lead.assignedSource = "manual";

    // -------------------------------------------------
    // OPTIONAL LEGACY AGENT FIELD
    // -------------------------------------------------
    //
    // Your Lead schema still contains:
    //
    // agent: String
    //
    // Keep it synchronized for compatibility with
    // older parts of the application.
    //
    // New workflow should rely on assignedTo.
    //
    // -------------------------------------------------

    lead.agent =
      agent.name ||
      agent.email ||
      null;

    await lead.save();

    // -------------------------------------------------
    // REAL-TIME EVENT
    // -------------------------------------------------

    leadEventBus.emit(
      LEAD_EVENTS.LEAD_UPDATED,
      lead
    );

    leadEventBus.emit(
      LEAD_EVENTS.PIPELINE_UPDATE,
      lead
    );

    // -------------------------------------------------
    // RESPONSE
    // -------------------------------------------------

    return res.status(200).json({
      success: true,
      message: "Lead assigned successfully.",
      data: lead,
      assignedAgent: {
        _id: agent._id,
        name: agent.name,
        email: agent.email,
        role: agent.role,
      },
    });

  } catch (error) {
    console.error(
      "❌ ASSIGN LEAD ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to assign lead.",
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

export const reassignLead = async (
  req,
  res
) => {
  try {
    console.log(
      "🔄 ADMIN REASSIGN LEAD REQUEST"
    );

    const { id } = req.params;
    const { newAgentId } = req.body;

    const adminId = getUserId(req);
    const organizationId = getOrganizationId(req);

    // -------------------------------------------------
    // AUTHENTICATION SAFETY
    // -------------------------------------------------

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    // -------------------------------------------------
    // ORGANIZATION SAFETY
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

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid lead ID.",
      });
    }

    // -------------------------------------------------
    // VALIDATE NEW AGENT ID
    // -------------------------------------------------

    if (
      !newAgentId ||
      !isValidObjectId(newAgentId)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "A valid new agent ID is required.",
      });
    }

    // -------------------------------------------------
    // FIND LEAD
    // -------------------------------------------------

    const lead = await Lead.findOne({
      _id: id,
      organizationId,
    });

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: "Lead not found.",
      });
    }

    // -------------------------------------------------
    // FIND NEW AGENT
    // -------------------------------------------------

    const newAgent = await User.findOne({
      _id: newAgentId,
      role: "agent",
      organizationId,
    }).select(
      "_id name email role organizationId"
    );

    if (!newAgent) {
      return res.status(400).json({
        success: false,
        message:
          "The selected user is not a valid agent in this organization.",
      });
    }

    // -------------------------------------------------
    // UPDATE ASSIGNMENT
    // -------------------------------------------------

    lead.assignedTo = newAgent._id;
    lead.assignedBy = adminId;
    lead.assignedAt = new Date();
    lead.assignedSource = "manual";

    // Keep legacy field synchronized.
    lead.agent =
      newAgent.name ||
      newAgent.email ||
      null;

    await lead.save();

    // -------------------------------------------------
    // REAL-TIME EVENTS
    // -------------------------------------------------

    leadEventBus.emit(
      LEAD_EVENTS.LEAD_UPDATED,
      lead
    );

    leadEventBus.emit(
      LEAD_EVENTS.PIPELINE_UPDATE,
      lead
    );

    // -------------------------------------------------
    // RESPONSE
    // -------------------------------------------------

    return res.status(200).json({
      success: true,
      message:
        "Lead reassigned successfully.",
      data: lead,
      assignedAgent: {
        _id: newAgent._id,
        name: newAgent.name,
        email: newAgent.email,
        role: newAgent.role,
      },
    });

  } catch (error) {
    console.error(
      "❌ REASSIGN LEAD ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
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
      getOrganizationId(req);

    // -------------------------------------------------
    // AUTHENTICATION SAFETY
    // -------------------------------------------------

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    // -------------------------------------------------
    // ORGANIZATION SAFETY
    // -------------------------------------------------

    if (!organizationId) {
      return res.status(403).json({
        success: false,
        message: "Organization not assigned.",
      });
    }

    // -------------------------------------------------
    // FETCH UNASSIGNED LEADS
    // -------------------------------------------------

    const leads = await Lead.find({
      organizationId,
      $or: [
        { assignedTo: null },
        { assignedTo: { $exists: false } },
      ],
    })
      .sort({
        createdAt: -1,
      })
      .populate(
        "assignedBy",
        "name email role"
      );

    // -------------------------------------------------
    // RESPONSE
    // -------------------------------------------------

    return res.status(200).json({
      success: true,
      count: leads.length,
      data: leads,
    });

  } catch (error) {
    console.error(
      "❌ GET UNASSIGNED LEADS ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
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
// This prevents an agent from changing the request
// and attempting to retrieve another agent's leads.
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

    const agentId = getUserId(req);
    const organizationId =
      getOrganizationId(req);

    // -------------------------------------------------
    // AUTHENTICATION SAFETY
    // -------------------------------------------------

    if (!req.user || !agentId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    // -------------------------------------------------
    // ORGANIZATION SAFETY
    // -------------------------------------------------

    if (!organizationId) {
      return res.status(403).json({
        success: false,
        message: "Organization not assigned.",
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

    const leads = await Lead.find({
      organizationId,
      assignedTo: agentId,
    })
      .sort({
        updatedAt: -1,
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
      success: true,
      count: leads.length,
      data: leads,
    });

  } catch (error) {
    console.error(
      "❌ GET MY LEADS ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
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
// This helper is useful for the agent lead-details
// workflow.
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

    const { id } = req.params;

    const agentId = getUserId(req);
    const organizationId =
      getOrganizationId(req);

    // -------------------------------------------------
    // AUTHENTICATION
    // -------------------------------------------------

    if (!req.user || !agentId) {
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
    // VALIDATE ID
    // -------------------------------------------------

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid lead ID.",
      });
    }

    // -------------------------------------------------
    // FETCH ONLY ASSIGNED LEAD
    // -------------------------------------------------

    const lead = await Lead.findOne({
      _id: id,
      organizationId,
      assignedTo: agentId,
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

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: "Lead not found.",
      });
    }

    // -------------------------------------------------
    // RESPONSE
    // -------------------------------------------------

    return res.status(200).json({
      success: true,
      data: lead,
    });

  } catch (error) {
    console.error(
      "❌ GET MY LEAD ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to fetch lead.",
    });
  }
};