/**
 * ==========================================================
 *
 * PURPOSE
 * ----------------------------------------------------------
 * Central frontend service for escalation workflows.
 *
 * Escalations may be created when:
 *
 * • High-value / hot lead requires manager attention
 * • Customer complaint requires intervention
 * • Agent response SLA is exceeded
 * • AI confidence is too low
 * • Manual review is required
 * • Lead requires administrative intervention
 *
 * MULTI-TENANT SECURITY
 * ----------------------------------------------------------
 * Organization ownership MUST be enforced by the backend.
 *
 * The frontend does NOT send:
 *
 * • organizationId
 * • createdBy
 * • tenant information
 *
 * These should be derived from the authenticated request.
 *
 * ASSIGNMENT WORKFLOW
 * ----------------------------------------------------------
 * LeadFlow AI uses the following general workflow:
 *
 * Lead
 *   ↓
 * AI Qualification
 *   ↓
 * Lead Status / Score
 *   ↓
 * Auto Assignment
 *   ↓
 * Agent Workflow
 *   ↓
 * Escalation when required
 *   ↓
 * Admin / Manager Resolution
 *
 * BACKEND ROUTES
 * ----------------------------------------------------------
 * GET    /api/escalations
 * GET    /api/escalations/:id
 * POST   /api/escalations
 * PUT    /api/escalations/:id
 * PUT    /api/escalations/:id/assign
 * PUT    /api/escalations/:id/resolve
 * DELETE /api/escalations/:id
 *
 * ==========================================================
 */

import axiosClient from "../api/axiosClient";

// ==========================================================
// GET ALL ESCALATIONS
// ==========================================================
//
// GET /api/escalations
//
// Optional filters:
//
// {
//   status,
//   priority,
//   assignedTo,
//   leadId,
//   page,
//   limit
// }
//
// Backend should automatically restrict results to the
// authenticated user's organization.
//
// ==========================================================

export const getEscalations = async (params = {}) => {
  try {
    const response = await axiosClient.get(
      "/escalations",
      {
        params,
      }
    );

    return response.data?.data || [];
  } catch (error) {
    console.error(
      "❌ Escalation fetch error:",
      error
    );

    return [];
  }
};

// ==========================================================
// GET SINGLE ESCALATION
// ==========================================================
//
// GET /api/escalations/:id
//
// ==========================================================

export const getEscalation = async (
  escalationId
) => {
  try {
    if (!escalationId) {
      throw new Error(
        "Escalation ID is required."
      );
    }

    const response =
      await axiosClient.get(
        `/escalations/${escalationId}`
      );

    return response.data?.data || null;
  } catch (error) {
    console.error(
      "❌ Escalation details fetch error:",
      error
    );

    throw error;
  }
};

// ==========================================================
// CREATE ESCALATION
// ==========================================================
//
// POST /api/escalations
//
// Expected payload:
//
// {
//   leadId,
//   conversationId,
//   reason,
//   priority,
//   notes
// }
//
// IMPORTANT
// ----------------------------------------------------------
// Do NOT send organizationId from the frontend.
//
// The backend should derive organization ownership from the
// authenticated user and validate the referenced lead.
//
// ==========================================================

export const createEscalation = async (
  payload
) => {
  try {
    if (!payload) {
      throw new Error(
        "Escalation payload is required."
      );
    }

    const response =
      await axiosClient.post(
        "/escalations",
        payload
      );

    return response.data?.data || null;
  } catch (error) {
    console.error(
      "❌ Escalation creation error:",
      error
    );

    throw error;
  }
};

// ==========================================================
// UPDATE ESCALATION
// ==========================================================
//
// PUT /api/escalations/:id
//
// Possible updates:
//
// {
//   reason,
//   priority,
//   notes,
//   status
// }
//
// Backend remains responsible for authorization and
// organization isolation.
//
// ==========================================================

export const updateEscalation = async (
  escalationId,
  payload
) => {
  try {
    if (!escalationId) {
      throw new Error(
        "Escalation ID is required."
      );
    }

    if (!payload) {
      throw new Error(
        "Escalation update payload is required."
      );
    }

    const response =
      await axiosClient.put(
        `/escalations/${escalationId}`,
        payload
      );

    return response.data?.data || null;
  } catch (error) {
    console.error(
      "❌ Escalation update error:",
      error
    );

    throw error;
  }
};

// ==========================================================
// ASSIGN ESCALATION
// ==========================================================
//
// PUT /api/escalations/:id/assign
//
// Expected payload:
//
// {
//   assignedTo
// }
//
// Assignment authorization must be handled by the backend.
//
// The frontend should never assume that any user is allowed
// to assign an escalation.
//
// ==========================================================

export const assignEscalation = async (
  escalationId,
  assignedTo
) => {
  try {
    if (!escalationId) {
      throw new Error(
        "Escalation ID is required."
      );
    }

    if (!assignedTo) {
      throw new Error(
        "Assigned user ID is required."
      );
    }

    const response =
      await axiosClient.put(
        `/escalations/${escalationId}/assign`,
        {
          assignedTo,
        }
      );

    return response.data?.data || null;
  } catch (error) {
    console.error(
      "❌ Escalation assignment error:",
      error
    );

    throw error;
  }
};

// ==========================================================
// RESOLVE ESCALATION
// ==========================================================
//
// PUT /api/escalations/:id/resolve
//
// Expected payload:
//
// {
//   resolutionNotes
// }
//
// Resolution should update the escalation state on the
// backend and may also trigger lead/realtime workflow events.
//
// ==========================================================

export const resolveEscalation = async (
  escalationId,
  resolutionNotes = ""
) => {
  try {
    if (!escalationId) {
      throw new Error(
        "Escalation ID is required."
      );
    }

    const response =
      await axiosClient.put(
        `/escalations/${escalationId}/resolve`,
        {
          resolutionNotes,
        }
      );

    return response.data?.data || null;
  } catch (error) {
    console.error(
      "❌ Escalation resolution error:",
      error
    );

    throw error;
  }
};

// ==========================================================
// DELETE ESCALATION
// ==========================================================
//
// DELETE /api/escalations/:id
//
// This should normally be restricted to authorized
// administrative users on the backend.
//
// ==========================================================

export const deleteEscalation = async (
  escalationId
) => {
  try {
    if (!escalationId) {
      throw new Error(
        "Escalation ID is required."
      );
    }

    const response =
      await axiosClient.delete(
        `/escalations/${escalationId}`
      );

    return response.data?.data || null;
  } catch (error) {
    console.error(
      "❌ Escalation deletion error:",
      error
    );

    throw error;
  }
};

// ==========================================================
// GET ESCALATIONS FOR A LEAD
// ==========================================================
//
// GET /api/escalations?leadId=:leadId
//
// This is useful from LeadDetails / Agent workflow.
//
// ==========================================================

export const getLeadEscalations = async (
  leadId
) => {
  try {
    if (!leadId) {
      console.error(
        "❌ getLeadEscalations: Lead ID is required."
      );

      return [];
    }

    const response =
      await axiosClient.get(
        "/escalations",
        {
          params: {
            leadId,
          },
        }
      );

    return response.data?.data || [];
  } catch (error) {
    console.error(
      "❌ Lead escalation fetch error:",
      error
    );

    return [];
  }
};

// ==========================================================
// GET PENDING ESCALATIONS
// ==========================================================
//
// GET /api/escalations?status=pending
//
// Useful for:
// • Admin dashboard
// • Manager queue
// • Agent escalation workflow
//
// ==========================================================

export const getPendingEscalations = async (
  params = {}
) => {
  try {
    const response =
      await axiosClient.get(
        "/escalations",
        {
          params: {
            ...params,
            status: "pending",
          },
        }
      );

    return response.data?.data || [];
  } catch (error) {
    console.error(
      "❌ Pending escalations fetch error:",
      error
    );

    return [];
  }
};

// ==========================================================
// GET HIGH PRIORITY ESCALATIONS
// ==========================================================
//
// GET /api/escalations?priority=high
//
// Used for urgent administrative intervention.
//
// ==========================================================

export const getHighPriorityEscalations =
  async (params = {}) => {
    try {
      const response =
        await axiosClient.get(
          "/escalations",
          {
            params: {
              ...params,
              priority: "high",
            },
          }
        );

      return response.data?.data || [];
    } catch (error) {
      console.error(
        "❌ High-priority escalations fetch error:",
        error
      );

      return [];
    }
  };

// ==========================================================
// SERVICE OBJECT
// ==========================================================

const escalationService = {
  getEscalations,
  getEscalation,
  getLeadEscalations,
  getPendingEscalations,
  getHighPriorityEscalations,
  createEscalation,
  updateEscalation,
  assignEscalation,
  resolveEscalation,
  deleteEscalation,
};

// ==========================================================
// DEFAULT EXPORT
// ==========================================================

export default escalationService;