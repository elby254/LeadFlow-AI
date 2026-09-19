/**
 * ==========================================================
 *
 * Viewing Management API Service
 *
 * ==========================================================
 *
 * BUSINESS WORKFLOW
 * ----------------------------------------------------------
 *
 * Customer
 *    ↓
 * Request Viewing
 *    ↓
 * Agent Approval
 *    ↓
 * Approved Viewing
 *    ↓
 * Reschedule / Cancel
 *    ↓
 * Completed Viewing
 *    ↓
 * Feedback
 *
 * ==========================================================
 *
 * RESPONSIBILITIES
 * ----------------------------------------------------------
 *
 * ✓ Viewing requests
 * ✓ Viewing retrieval
 * ✓ Viewing approval
 * ✓ Viewing rejection
 * ✓ Viewing rescheduling
 * ✓ Viewing cancellation
 * ✓ Viewing completion
 * ✓ Viewing feedback
 * ✓ Upcoming viewings
 * ✓ Today's viewings
 * ✓ Agent's own viewings
 * ✓ Availability
 * ✓ Schedule conflict checking
 * ✓ Calendar viewings
 * ✓ Lead viewings
 * ✓ Property viewings
 *
 * ==========================================================
 *
 * IMPORTANT
 * ----------------------------------------------------------
 *
 * Agent identity is NOT supplied manually from the frontend.
 *
 * The backend determines the authenticated agent from:
 *
 *     req.user
 *
 * and applies organization + agent isolation.
 *
 * Therefore:
 *
 *     getMyViewings()
 *
 * intentionally calls:
 *
 *     GET /api/viewings
 *
 * rather than sending an agentId.
 *
 * ==========================================================
 */

import axiosClient from "../api/axiosClient";

/* ==========================================================
   BASE URL
========================================================== */

const BASE_URL = "/viewings";

/* ==========================================================
   GET ALL VIEWINGS
========================================================== */

/**
 * GET /api/viewings
 *
 * Retrieves viewings visible to the authenticated user.
 *
 * Backend behavior:
 *
 * ADMIN
 *   → organization viewings
 *
 * AGENT
 *   → only viewings assigned to req.user
 *
 * VIEWER
 *   → according to backend access rules
 *
 * Optional filters:
 *
 * - status
 * - agent
 * - lead
 * - property
 * - date
 * - startDate
 * - endDate
 * - page
 * - limit
 */

const getAllViewings = async (params = {}) => {
  try {
    const response = await axiosClient.get(
      BASE_URL,
      {
        params,
      }
    );

    return response.data;
  } catch (error) {
    console.error(
      "❌ Get all viewings error:",
      error
    );

    throw error;
  }
};

/* ==========================================================
   GET MY VIEWINGS
========================================================== */

/**
 * GET /api/viewings
 *
 * Retrieves viewings belonging to the currently
 * authenticated agent.
 *
 * IMPORTANT
 * ----------------------------------------------------------
 *
 * Do NOT send agentId from the frontend.
 *
 * The backend determines the current agent from:
 *
 *     req.user
 *
 * The backend viewing service then applies:
 *
 *     query.agent = userId
 *
 * when:
 *
 *     role === "agent"
 *
 * This guarantees that an agent cannot request another
 * agent's viewings simply by changing an agentId.
 *
 * Example:
 *
 * viewingService.getMyViewings({
 *   page: 1,
 *   limit: 10,
 * });
 *
 * ==========================================================
 */

const getMyViewings = async (params = {}) => {
  try {
    const response = await axiosClient.get(
      BASE_URL,
      {
        params,
      }
    );

    return response.data;
  } catch (error) {
    console.error(
      "❌ Get my viewings error:",
      error
    );

    throw error;
  }
};

/* ==========================================================
   GET SINGLE VIEWING
========================================================== */

/**
 * GET /api/viewings/:id
 */

const getViewingById = async (viewingId) => {
  if (!viewingId) {
    throw new Error(
      "Viewing ID is required."
    );
  }

  try {
    const response = await axiosClient.get(
      `${BASE_URL}/${viewingId}`
    );

    return response.data;
  } catch (error) {
    console.error(
      "❌ Get viewing by ID error:",
      error
    );

    throw error;
  }
};

/* ==========================================================
   GET UPCOMING VIEWINGS
========================================================== */

/**
 * GET /api/viewings/upcoming
 */

const getUpcomingViewings = async (
  params = {}
) => {
  try {
    const response = await axiosClient.get(
      `${BASE_URL}/upcoming`,
      {
        params,
      }
    );

    return response.data;
  } catch (error) {
    console.error(
      "❌ Get upcoming viewings error:",
      error
    );

    throw error;
  }
};

/* ==========================================================
   GET TODAY'S VIEWINGS
========================================================== */

/**
 * GET /api/viewings/today
 */

const getTodayViewings = async () => {
  try {
    const response = await axiosClient.get(
      `${BASE_URL}/today`
    );

    return response.data;
  } catch (error) {
    console.error(
      "❌ Get today's viewings error:",
      error
    );

    throw error;
  }
};

/* ==========================================================
   REQUEST VIEWING
========================================================== */

/**
 * POST /api/viewings
 *
 * Creates a new viewing request.
 *
 * Example payload:
 *
 * {
 *   leadId,
 *   propertyId,
 *   agentId,
 *   viewingDate,
 *   startTime,
 *   endTime,
 *   customerNotes
 * }
 */

const requestViewing = async (payload) => {
  if (!payload) {
    throw new Error(
      "Viewing information is required."
    );
  }

  try {
    const response = await axiosClient.post(
      BASE_URL,
      payload
    );

    return response.data;
  } catch (error) {
    console.error(
      "❌ Request viewing error:",
      error
    );

    throw error;
  }
};

/* ==========================================================
   APPROVE VIEWING
========================================================== */

/**
 * PATCH /api/viewings/:id/approve
 */

const approveViewing = async (viewingId) => {
  if (!viewingId) {
    throw new Error(
      "Viewing ID is required."
    );
  }

  try {
    const response = await axiosClient.patch(
      `${BASE_URL}/${viewingId}/approve`
    );

    return response.data;
  } catch (error) {
    console.error(
      "❌ Approve viewing error:",
      error
    );

    throw error;
  }
};

/* ==========================================================
   REJECT VIEWING
========================================================== */

/**
 * PATCH /api/viewings/:id/reject
 *
 * Example payload:
 *
 * {
 *   rejectionReason: "Agent unavailable"
 * }
 */

const rejectViewing = async (
  viewingId,
  payload = {}
) => {
  if (!viewingId) {
    throw new Error(
      "Viewing ID is required."
    );
  }

  try {
    const response = await axiosClient.patch(
      `${BASE_URL}/${viewingId}/reject`,
      payload
    );

    return response.data;
  } catch (error) {
    console.error(
      "❌ Reject viewing error:",
      error
    );

    throw error;
  }
};

/* ==========================================================
   RESCHEDULE VIEWING
========================================================== */

/**
 * PATCH /api/viewings/:id/reschedule
 *
 * Example payload:
 *
 * {
 *   viewingDate,
 *   startTime,
 *   endTime,
 *   reason
 * }
 */

const rescheduleViewing = async (
  viewingId,
  payload
) => {
  if (!viewingId) {
    throw new Error(
      "Viewing ID is required."
    );
  }

  if (!payload) {
    throw new Error(
      "Rescheduling information is required."
    );
  }

  try {
    const response = await axiosClient.patch(
      `${BASE_URL}/${viewingId}/reschedule`,
      payload
    );

    return response.data;
  } catch (error) {
    console.error(
      "❌ Reschedule viewing error:",
      error
    );

    throw error;
  }
};

/* ==========================================================
   CANCEL VIEWING
========================================================== */

/**
 * PATCH /api/viewings/:id/cancel
 *
 * Example payload:
 *
 * {
 *   reason
 * }
 */

const cancelViewing = async (
  viewingId,
  payload = {}
) => {
  if (!viewingId) {
    throw new Error(
      "Viewing ID is required."
    );
  }

  try {
    const response = await axiosClient.patch(
      `${BASE_URL}/${viewingId}/cancel`,
      payload
    );

    return response.data;
  } catch (error) {
    console.error(
      "❌ Cancel viewing error:",
      error
    );

    throw error;
  }
};

/* ==========================================================
   COMPLETE VIEWING
========================================================== */

/**
 * PATCH /api/viewings/:id/complete
 *
 * Example payload:
 *
 * {
 *   outcome,
 *   notes
 * }
 */

const completeViewing = async (
  viewingId,
  payload = {}
) => {
  if (!viewingId) {
    throw new Error(
      "Viewing ID is required."
    );
  }

  try {
    const response = await axiosClient.patch(
      `${BASE_URL}/${viewingId}/complete`,
      payload
    );

    return response.data;
  } catch (error) {
    console.error(
      "❌ Complete viewing error:",
      error
    );

    throw error;
  }
};

/* ==========================================================
   SUBMIT FEEDBACK
========================================================== */

/**
 * POST /api/viewings/:id/feedback
 *
 * Example payload:
 *
 * {
 *   viewerRating: 5,
 *   viewerComment: "Very good property",
 *   agentOutcome: "Interested",
 *   followUpRequired: true
 * }
 */

const submitFeedback = async (
  viewingId,
  payload
) => {
  if (!viewingId) {
    throw new Error(
      "Viewing ID is required."
    );
  }

  if (!payload) {
    throw new Error(
      "Feedback information is required."
    );
  }

  try {
    const response = await axiosClient.post(
      `${BASE_URL}/${viewingId}/feedback`,
      payload
    );

    return response.data;
  } catch (error) {
    console.error(
      "❌ Submit viewing feedback error:",
      error
    );

    throw error;
  }
};

/* ==========================================================
   GET AVAILABLE VIEWING SLOTS
========================================================== */

/**
 * GET /api/viewings/availability
 *
 * Query parameters:
 *
 * agentId
 * date
 */

const getAvailableSlots = async (
  agentId,
  date
) => {
  if (!agentId) {
    throw new Error(
      "Agent ID is required."
    );
  }

  if (!date) {
    throw new Error(
      "Viewing date is required."
    );
  }

  try {
    const response = await axiosClient.get(
      `${BASE_URL}/availability`,
      {
        params: {
          agentId,
          date,
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error(
      "❌ Get available viewing slots error:",
      error
    );

    throw error;
  }
};

/* ==========================================================
   CHECK VIEWING SCHEDULE CONFLICT
========================================================== */

/**
 * POST /api/viewings/check-conflict
 *
 * Example payload:
 *
 * {
 *   agentId,
 *   propertyId,
 *   viewingDate,
 *   startTime,
 *   endTime
 * }
 */

const checkViewingConflict = async (
  payload
) => {
  if (!payload) {
    throw new Error(
      "Viewing schedule information is required."
    );
  }

  try {
    const response = await axiosClient.post(
      `${BASE_URL}/check-conflict`,
      payload
    );

    return response.data;
  } catch (error) {
    console.error(
      "❌ Check viewing conflict error:",
      error
    );

    throw error;
  }
};

/* ==========================================================
   GET VIEWINGS FOR A SPECIFIC DATE
========================================================== */

/**
 * GET /api/viewings/calendar
 *
 * Used by:
 *
 * ✓ useViewingCalendar
 * ✓ Viewing calendar page
 * ✓ Agent schedule
 */

const getCalendarViewings = async (
  date
) => {
  if (!date) {
    throw new Error(
      "Calendar date is required."
    );
  }

  try {
    const response = await axiosClient.get(
      `${BASE_URL}/calendar`,
      {
        params: {
          date,
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error(
      "❌ Get calendar viewings error:",
      error
    );

    throw error;
  }
};

/* ==========================================================
   GET AGENT VIEWINGS
========================================================== */

/**
 * GET /api/viewings/agent/:agentId
 *
 * Retrieves viewings belonging to a particular agent.
 *
 * NOTE:
 * This is different from getMyViewings().
 *
 * getMyViewings()
 *     → uses authenticated user identity
 *
 * getAgentViewings(agentId)
 *     → explicitly requests a particular agent
 *
 * The backend should enforce authorization.
 */

const getAgentViewings = async (
  agentId,
  params = {}
) => {
  if (!agentId) {
    throw new Error(
      "Agent ID is required."
    );
  }

  try {
    const response = await axiosClient.get(
      `${BASE_URL}/agent/${agentId}`,
      {
        params,
      }
    );

    return response.data;
  } catch (error) {
    console.error(
      "❌ Get agent viewings error:",
      error
    );

    throw error;
  }
};

/* ==========================================================
   GET LEAD VIEWINGS
========================================================== */

/**
 * GET /api/viewings/lead/:leadId
 */

const getLeadViewings = async (
  leadId
) => {
  if (!leadId) {
    throw new Error(
      "Lead ID is required."
    );
  }

  try {
    const response = await axiosClient.get(
      `${BASE_URL}/lead/${leadId}`
    );

    return response.data;
  } catch (error) {
    console.error(
      "❌ Get lead viewings error:",
      error
    );

    throw error;
  }
};

/* ==========================================================
   GET PROPERTY VIEWINGS
========================================================== */

/**
 * GET /api/viewings/property/:propertyId
 */

const getPropertyViewings = async (
  propertyId,
  params = {}
) => {
  if (!propertyId) {
    throw new Error(
      "Property ID is required."
    );
  }

  try {
    const response = await axiosClient.get(
      `${BASE_URL}/property/${propertyId}`,
      {
        params,
      }
    );

    return response.data;
  } catch (error) {
    console.error(
      "❌ Get property viewings error:",
      error
    );

    throw error;
  }
};

/* ==========================================================
   VIEWING SERVICE OBJECT
========================================================== */

const viewingService = {

  /* --------------------------------------------------------
     VIEWING RETRIEVAL
  -------------------------------------------------------- */

  getAllViewings,

  getMyViewings,

  getViewingById,

  getUpcomingViewings,

  getTodayViewings,


  /* --------------------------------------------------------
     VIEWING WORKFLOW
  -------------------------------------------------------- */

  requestViewing,

  approveViewing,

  rejectViewing,

  rescheduleViewing,

  cancelViewing,

  completeViewing,

  submitFeedback,


  /* --------------------------------------------------------
     AVAILABILITY & SCHEDULING
  -------------------------------------------------------- */

  getAvailableSlots,

  checkViewingConflict,

  getCalendarViewings,

  getAgentViewings,

  getLeadViewings,

  getPropertyViewings,

};

/* ==========================================================
   DEFAULT EXPORT
========================================================== */

export default viewingService;