// ======================================================
//
// Central frontend API service for the automated
// property-viewing reminder system.
//
// Backend router:
//
// /api/viewing-reminders
//
// This service is responsible for:
//
// ✓ Creating reminders
// ✓ Loading reminders
// ✓ Loading a reminder by ID
// ✓ Loading reminders for a viewing
// ✓ Loading reminders for a viewer
// ✓ Loading reminders for an agent
// ✓ Loading pending reminders
// ✓ Loading queued reminders
//
// Used by:
//
// • useViewingReminder.js
// • Viewer viewing dashboard
// • Agent viewing dashboard
// • Admin viewing management
// • Reminder queue components
// • Viewing workflow
//
// ======================================================

import axiosClient from "../api/axiosClient";

// ======================================================
// API BASE PATH
// ======================================================

const BASE_PATH = "/viewing-reminders";

// ======================================================
// GET ALL REMINDERS
// ======================================================
//
// GET /api/viewing-reminders
//
// Returns all active reminders.
//
// ======================================================

const getAllReminders = async (params = {}) => {
  const response = await axiosClient.get(
    BASE_PATH,
    {
      params,
    }
  );

  return response.data?.data || [];
};

// GET QUEUED REMINDERS

axiosClient.get("/viewing-reminders/queued");

// ======================================================
// GET REMINDER BY ID
// ======================================================
//
// GET /api/viewing-reminders/:id
//
// ======================================================

const getReminderById = async (id) => {
  if (!id) {
    throw new Error(
      "Reminder ID is required."
    );
  }

  const response = await axiosClient.get(
    `${BASE_PATH}/${id}`
  );

  return response.data?.data || null;
};

// ======================================================
// CREATE REMINDER
// ======================================================
//
// POST /api/viewing-reminders
//
// Used when the viewing workflow creates a new reminder.
//
// Example:
//
// {
//   viewing,
//   lead,
//   property,
//   agent,
//   viewer,
//   reminderType,
//   channel,
//   subject,
//   message,
//   scheduledFor,
//   recipient
// }
//
// ======================================================

const createReminder = async (
  reminderData
) => {
  if (!reminderData) {
    throw new Error(
      "Reminder data is required."
    );
  }

  const response = await axiosClient.post(
    BASE_PATH,
    reminderData
  );

  return response.data?.data || null;
};

// ======================================================
// GET REMINDERS FOR VIEWING
// ======================================================
//
// GET /api/viewing-reminders/viewing/:viewingId
//
// Used by:
//
// • Viewing details
// • Admin viewing management
// • Agent viewing management
//
// ======================================================

const getRemindersByViewing = async (
  viewingId
) => {
  if (!viewingId) {
    throw new Error(
      "Viewing ID is required."
    );
  }

  const response = await axiosClient.get(
    `${BASE_PATH}/viewing/${viewingId}`
  );

  return response.data?.data || [];
};

// ======================================================
// GET REMINDERS FOR VIEWER
// ======================================================
//
// GET /api/viewing-reminders/viewer/:viewerId
//
// Used by:
//
// • Viewer dashboard
// • Upcoming viewing reminders
// • Reminder history
//
// ======================================================

const getRemindersByViewer = async (
  viewerId
) => {
  if (!viewerId) {
    throw new Error(
      "Viewer ID is required."
    );
  }

  const response = await axiosClient.get(
    `${BASE_PATH}/viewer/${viewerId}`
  );

  return response.data?.data || [];
};

// ======================================================
// GET REMINDERS FOR AGENT
// ======================================================
//
// GET /api/viewing-reminders/agent/:agentId
//
// Used by:
//
// • Agent dashboard
// • Agent reminder queue
// • Viewing operations
//
// ======================================================

const getRemindersByAgent = async (
  agentId
) => {
  if (!agentId) {
    throw new Error(
      "Agent ID is required."
    );
  }

  const response = await axiosClient.get(
    `${BASE_PATH}/agent/${agentId}`
  );

  return response.data?.data || [];
};

// ======================================================
// GET PENDING REMINDERS
// ======================================================
//
// GET /api/viewing-reminders/pending
//
// Pending reminders have not yet entered the
// delivery queue.
//
// ======================================================

const getPendingReminders = async (
  params = {}
) => {
  const response = await axiosClient.get(
    `${BASE_PATH}/pending`,
    {
      params,
    }
  );

  return response.data?.data || [];
};

// ======================================================
// GET QUEUED REMINDERS
// ======================================================
//
// GET /api/viewing-reminders/queued
//
// Queued reminders are ready for the reminder
// delivery engine.
//
// ======================================================

const getQueuedReminders = async (
  params = {}
) => {
  const response = await axiosClient.get(
    `${BASE_PATH}/queued`,
    {
      params,
    }
  );

  return response.data?.data || [];
};


// ======================================================

//
// Remaining backend endpoints:
//
// GET    /failed
// POST   /:id/retry
// PATCH  /:id/cancel
// PATCH  /:id/archive
// GET    /statistics
// DELETE /archived
//
// ======================================================

// ======================================================
// GET FAILED REMINDERS
// ======================================================
//
// GET /api/viewing-reminders/failed
//
// Used by:
//
// • Admin reminder monitoring
// • Agent reminder queue
// • Failed delivery dashboard
// • useViewingReminder.js
//
// ======================================================

const getFailedReminders = async (
  params = {}
) => {
  const response = await axiosClient.get(
    `${BASE_PATH}/failed`,
    {
      params,
    }
  );

  return response.data?.data || [];
};

// ======================================================
// RETRY FAILED REMINDER
// ======================================================
//
// POST /api/viewing-reminders/:id/retry
//
// Workflow:
//
// Failed
//   ↓
// Retry requested
//   ↓
// Retry count checked
//   ↓
// Queued
//   ↓
// Delivery engine
//
// ======================================================

const retryReminder = async (id) => {
  if (!id) {
    throw new Error(
      "Reminder ID is required."
    );
  }

  const response = await axiosClient.post(
    `${BASE_PATH}/${id}/retry`
  );

  return response.data?.data || null;
};

// ======================================================
// CANCEL REMINDER
// ======================================================
//
// PATCH /api/viewing-reminders/:id/cancel
//
// Used when:
//
// • Viewing is cancelled
// • Reminder is no longer required
// • Agent cancels reminder
// • Viewer cancels viewing
//
// ======================================================

const cancelReminder = async (id) => {
  if (!id) {
    throw new Error(
      "Reminder ID is required."
    );
  }

  const response = await axiosClient.patch(
    `${BASE_PATH}/${id}/cancel`
  );

  return response.data?.data || null;
};

// ======================================================
// ARCHIVE REMINDER
// ======================================================
//
// PATCH /api/viewing-reminders/:id/archive
//
// Archiving preserves historical information while
// removing the reminder from normal operational views.
//
// ======================================================

const archiveReminder = async (id) => {
  if (!id) {
    throw new Error(
      "Reminder ID is required."
    );
  }

  const response = await axiosClient.patch(
    `${BASE_PATH}/${id}/archive`
  );

  return response.data?.data || null;
};

// ======================================================
// GET REMINDER STATISTICS
// ======================================================
//
// GET /api/viewing-reminders/statistics
//
// Used by:
//
// • Admin dashboard
// • Reminder analytics
// • System monitoring
//
// Expected data:
//
// {
//   total,
//   pending,
//   queued,
//   sent,
//   delivered,
//   read,
//   failed,
//   cancelled
// }
//
// ======================================================

const getReminderStatistics = async (
  params = {}
) => {
  const response = await axiosClient.get(
    `${BASE_PATH}/statistics`,
    {
      params,
    }
  );

  return response.data?.data || {};
};

// ======================================================
// DELETE ARCHIVED REMINDERS
// ======================================================
//
// DELETE /api/viewing-reminders/archived
//
// Administrative/system cleanup.
//
// Only reminders marked:
//
// isArchived === true
//
// should be permanently removed by the backend.
//
// ======================================================

const deleteArchivedReminders = async (
  params = {}
) => {
  const response = await axiosClient.delete(
    `${BASE_PATH}/archived`,
    {
      params,
    }
  );

  return response.data;
};

// ======================================================
// COMPLETE SERVICE EXPORT
// ======================================================
//
// NOTE:
// These exports assume Part 1 is directly above this
// section in the SAME file.
//
// Do not create another default export if this section
// is appended to Part 1.
//
// ======================================================

Object.assign(
  viewingReminderService,
  {
    getFailedReminders,
    retryReminder,
    cancelReminder,
    archiveReminder,
    getReminderStatistics,
    deleteArchivedReminders,
  }
);

// ======================================================
// EXPORT PART 1
// ======================================================

const viewingReminderService = {
  getAllReminders,
  getReminderById,
  createReminder,
  getRemindersByViewing,
  getRemindersByViewer,
  getRemindersByAgent,
  getPendingReminders,
  getQueuedReminders,
};

export default viewingReminderService;


