import axios from "../api/axiosClient";

/**
 *
 * Central frontend service for all LeadFlow AI lead-related
 * API communication.
 *
 * Backend base route:
 *
 * /api/lead
 *
 * ==========================================================
 * RESPONSIBILITIES
 * ==========================================================
 *
 * Lead retrieval
 * --------------
 * - Fetch all leads
 * - Fetch hot leads
 * - Fetch new leads
 * - Fetch follow-up leads
 * - Fetch a single lead
 *
 * Lead lifecycle
 * --------------
 * - Update follow-up
 * - Add call history
 * - Add agent notes
 *
 * Property viewing workflow
 * -------------------------
 * - Request viewing
 * - Fetch lead viewings
 * - Approve viewing
 * - Reject viewing
 * - Cancel viewing
 * - Reschedule viewing
 * - Complete viewing
 * - Submit viewing feedback
 *
 * ==========================================================
 * IMPORTANT
 * ==========================================================
 *
 * Lead assignment is handled by the backend.
 *
 * The frontend DOES NOT decide which agent receives a lead.
 *
 * Backend workflow:
 *
 * Lead creation
 *      ↓
 * Lead scoring
 *      ↓
 * Lead lifecycle classification
 *      ↓
 * Auto assignment
 *      ↓
 * Conflict resolution
 *      ↓
 * Agent workload update
 *      ↓
 * Realtime event
 *
 * Assignment sources:
 *
 * - ai
 * - auto
 * - manual
 *
 * ==========================================================
 */

// ==========================================================
// GET ALL LEADS
// ==========================================================
//
// GET /api/lead
//
// Returns leads visible to the authenticated user.
//
// Backend is responsible for:
// - authentication
// - role filtering
// - organization isolation
// - agent-level visibility
//
// ==========================================================

export const getLeads = async () => {
  try {
    const response = await axios.get("/lead");

    return response.data?.data || [];
  } catch (error) {
    console.error(
      "❌ Lead fetch error:",
      error
    );

    return [];
  }
};

export const getMyLeads = async ({
  page = 1,
  limit = 10,
} = {}) => {
  try {
    const response = await axios.get("/lead/my", {
      params: {
        page,
        limit,
      },
    });

    return response.data || {
      data: [],
    };

  } catch (error) {

    console.error(
      "❌ My leads fetch error:",
      error
    );

    throw error;
  }
};

// ==========================================================
// GET HOT LEADS
// ==========================================================
//
// GET /api/lead/hot
//
// Returns leads currently classified as:
//
// status === "hot"
//
// Hot leads are normally high-priority leads produced by
// the backend lead scoring/lifecycle workflow.
//
// ==========================================================

export const getHotLeads = async () => {
  try {
    const response = await axios.get(
      "/lead/hot"
    );

    return response.data?.data || [];
  } catch (error) {
    console.error(
      "❌ Hot leads fetch error:",
      error
    );

    return [];
  }
};

// ==========================================================
// GET NEW LEADS
// ==========================================================
//
// GET /api/lead/new
//
// Returns leads currently classified as:
//
// status === "new"
//
// ==========================================================

export const getNewLeads = async () => {
  try {
    const response = await axios.get(
      "/lead/new"
    );

    return response.data?.data || [];
  } catch (error) {
    console.error(
      "❌ New leads fetch error:",
      error
    );

    return [];
  }
};

// ==========================================================
// GET FOLLOW-UP LEADS
// ==========================================================
//
// GET /api/lead/follow-up
//
// Returns leads requiring follow-up/action.
//
// The backend lifecycle can contain:
//
// - qualified
// - hot
// - follow_up
// - viewing_scheduled
//
// The backend remains the source of truth for determining
// which leads belong in this collection.
//
// ==========================================================

export const getFollowUpLeads = async () => {
  try {
    const response = await axios.get(
      "/lead/follow-up"
    );

    return response.data?.data || [];
  } catch (error) {
    console.error(
      "❌ Follow-up leads fetch error:",
      error
    );

    return [];
  }
};

// ==========================================================
// GET LEAD BY ID
// ==========================================================
//
// GET /api/lead/:id
//
// Returns the lead details.
//
// Depending on the backend controller, the response may
// contain:
//
// {
//   lead,
//   conversation,
//   aiInsights
// }
//
// ==========================================================

export const getLeadById = async (id) => {
  try {
    if (!id) {
      console.error(
        "❌ getLeadById: Lead ID is required."
      );

      return null;
    }

    const response = await axios.get(
      `/lead/${id}`
    );

    return response.data?.data || null;
  } catch (error) {
    console.error(
      "❌ Lead details fetch error:",
      error
    );

    return null;
  }
};

// ==========================================================
// UPDATE FOLLOW-UP
// ==========================================================
//
// PATCH /api/lead/:id/followup
//
// Expected payload:
//
// {
//   nextFollowUpDate,
//   nextAction,
//   noteText,
//   followUpStatus
// }
//
// Backend may also update:
//
// - status
// - followUpUpdatedAt
// - updatedAt
//
// ==========================================================

export const updateFollowUp = async (
  id,
  followUpData
) => {
  try {
    if (!id) {
      throw new Error(
        "Lead ID is required."
      );
    }

    const response = await axios.patch(
      `/lead/${id}/followup`,
      followUpData
    );

    return response.data?.data || null;
  } catch (error) {
    console.error(
      "❌ Follow-up update error:",
      error
    );

    throw error;
  }
};

// ==========================================================
// ADD CALL HISTORY
// ==========================================================
//
// POST /api/lead/:id/call-history
//
// Expected payload:
//
// {
//   outcome,
//   notes,
//   nextFollowUpDate,
//   followUpStatus,
//   status
// }
//
// Backend remains responsible for lifecycle transitions.
//
// Example:
//
// new
//   ↓
// qualified
//   ↓
// follow_up
//   ↓
// viewing_scheduled
//   ↓
// closed
//
// ==========================================================

export const addCallHistory = async (
  id,
  callData
) => {
  try {
    if (!id) {
      throw new Error(
        "Lead ID is required."
      );
    }

    const response = await axios.post(
      `/lead/${id}/call-history`,
      callData
    );

    return response.data?.data || null;
  } catch (error) {
    console.error(
      "❌ Call history error:",
      error
    );

    throw error;
  }
};

// ==========================================================
// ADD AGENT NOTE
// ==========================================================
//
// POST /api/lead/:id/notes
//
// Accepts either:
//
// addAgentNote(id, "Customer wants a 3-bedroom property.")
//
// OR:
//
// addAgentNote(id, {
//   text: "Customer wants a 3-bedroom property."
// })
//
// ==========================================================

export const addAgentNote = async (
  id,
  text
) => {
  try {
    if (!id) {
      throw new Error(
        "Lead ID is required."
      );
    }

    const payload =
      typeof text === "string"
        ? {
            text,
          }
        : text;

    const response = await axios.post(
      `/lead/${id}/notes`,
      payload
    );

    return response.data?.data || [];
  } catch (error) {
    console.error(
      "❌ Agent note error:",
      error
    );

    throw error;
  }
};

// ==========================================================
// REQUEST PROPERTY VIEWING
// ==========================================================
//
// POST /api/lead/:id/request-viewing
//
// Expected payload:
//
// {
//   propertyId,
//   viewingDate,
//   startTime,
//   endTime,
//   customerNotes
// }
//
// Backend is responsible for:
// - validating the lead
// - validating the property
// - validating agent/customer relationship
// - creating the viewing
// - updating lifecycle state when appropriate
//
// ==========================================================

export const requestViewing = async (
  id,
  viewingData
) => {
  try {
    if (!id) {
      throw new Error(
        "Lead ID is required."
      );
    }

    const response = await axios.post(
      `/lead/${id}/request-viewing`,
      viewingData
    );

    return response.data?.data || null;
  } catch (error) {
    console.error(
      "❌ Viewing request error:",
      error
    );

    throw error;
  }
};

// ==========================================================
// GET LEAD VIEWINGS
// ==========================================================
//
// GET /api/lead/:id/viewings
//
// Returns all property viewings associated with the lead.
//
// ==========================================================

export const getLeadViewings = async (
  id
) => {
  try {
    if (!id) {
      console.error(
        "❌ getLeadViewings: Lead ID is required."
      );

      return [];
    }

    const response = await axios.get(
      `/lead/${id}/viewings`
    );

    return response.data?.data || [];
  } catch (error) {
    console.error(
      "❌ Lead viewings fetch error:",
      error
    );

    return [];
  }
};

// ==========================================================
// APPROVE VIEWING
// ==========================================================
//
// PATCH /api/viewings/:id/approve
//
// ==========================================================

export const approveViewing = async (
  viewingId
) => {
  try {
    if (!viewingId) {
      throw new Error(
        "Viewing ID is required."
      );
    }

    const response = await axios.patch(
      `/viewings/${viewingId}/approve`
    );

    return response.data?.data || null;
  } catch (error) {
    console.error(
      "❌ Approve viewing error:",
      error
    );

    throw error;
  }
};

// ==========================================================
// REJECT VIEWING
// ==========================================================
//
// PATCH /api/viewings/:id/reject
//
// Expected payload:
//
// {
//   rejectionReason
// }
//
// ==========================================================

export const rejectViewing = async (
  viewingId,
  rejectionReason
) => {
  try {
    if (!viewingId) {
      throw new Error(
        "Viewing ID is required."
      );
    }

    const response = await axios.patch(
      `/viewings/${viewingId}/reject`,
      {
        rejectionReason,
      }
    );

    return response.data?.data || null;
  } catch (error) {
    console.error(
      "❌ Reject viewing error:",
      error
    );

    throw error;
  }
};

// ==========================================================
// CANCEL VIEWING
// ==========================================================
//
// PATCH /api/viewings/:id/cancel
//
// ==========================================================

export const cancelViewing = async (
  viewingId
) => {
  try {
    if (!viewingId) {
      throw new Error(
        "Viewing ID is required."
      );
    }

    const response = await axios.patch(
      `/viewings/${viewingId}/cancel`
    );

    return response.data?.data || null;
  } catch (error) {
    console.error(
      "❌ Cancel viewing error:",
      error
    );

    throw error;
  }
};

// ==========================================================
// RESCHEDULE VIEWING
// ==========================================================
//
// PATCH /api/viewings/:id/reschedule
//
// Expected payload:
//
// {
//   viewingDate,
//   startTime,
//   endTime,
//   rescheduleReason
// }
//
// ==========================================================

export const rescheduleViewing = async (
  viewingId,
  scheduleData
) => {
  try {
    if (!viewingId) {
      throw new Error(
        "Viewing ID is required."
      );
    }

    const response = await axios.patch(
      `/viewings/${viewingId}/reschedule`,
      scheduleData
    );

    return response.data?.data || null;
  } catch (error) {
    console.error(
      "❌ Reschedule viewing error:",
      error
    );

    throw error;
  }
};

// ==========================================================
// COMPLETE VIEWING
// ==========================================================
//
// POST /api/viewings/:id/complete
//
// Expected payload:
//
// {
//   viewerRating,
//   viewerComment,
//   agentOutcome
// }
//
// ==========================================================

export const completeViewing = async (
  viewingId,
  feedbackData
) => {
  try {
    if (!viewingId) {
      throw new Error(
        "Viewing ID is required."
      );
    }

    const response = await axios.post(
      `/viewings/${viewingId}/complete`,
      feedbackData
    );

    return response.data?.data || null;
  } catch (error) {
    console.error(
      "❌ Complete viewing error:",
      error
    );

    throw error;
  }
};

// ==========================================================
// SUBMIT VIEWING FEEDBACK
// ==========================================================
//
// PATCH /api/viewings/:id/feedback
//
// Expected payload:
//
// {
//   viewerRating,
//   viewerComment,
//   agentOutcome
// }
//
// ==========================================================

export const submitViewingFeedback = async (
  viewingId,
  feedbackData
) => {
  try {
    if (!viewingId) {
      throw new Error(
        "Viewing ID is required."
      );
    }

    const response = await axios.patch(
      `/viewings/${viewingId}/feedback`,
      feedbackData
    );

    return response.data?.data || null;
  } catch (error) {
    console.error(
      "❌ Viewing feedback error:",
      error
    );

    throw error;
  }
};

// ==========================================================
// SERVICE EXPORT
// ==========================================================
//
// Named exports are preserved for components/hooks that
// import individual functions.
//
// Default export is preserved for components that use:
//
// import leadService from ".../leadService";
//
// ==========================================================

const leadService = {
  getLeads,
  getMyLeads,
  getHotLeads,
  getNewLeads,
  getFollowUpLeads,

  getLeadById,

  updateFollowUp,
  addCallHistory,
  addAgentNote,

  requestViewing,
  getLeadViewings,

  approveViewing,
  rejectViewing,
  cancelViewing,
  rescheduleViewing,
  completeViewing,
  submitViewingFeedback,
};

export default leadService;