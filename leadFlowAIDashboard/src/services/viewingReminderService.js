/**
 * ==========================================================
 *
 * Responsible for:
 * ----------------------------------------------------------
 * ✓ Get all reminders
 * ✓ Get reminder by ID
 * ✓ Create reminder
 * ✓ Update reminder
 * ✓ Cancel reminder
 * ✓ Mark reminder as sent
 * ✓ Retry failed reminder
 * ✓ Load reminders for a viewing
 * ✓ Load upcoming reminders
 * ✓ Load today's reminders
 *
 * Used By
 * ----------------------------------------------------------
 * useViewingReminder.js
 * Viewing Reminder Center
 * Viewing Workflow
 * Notification / Reminder System
 *
 * ==========================================================
 */

import axiosClient from "../api/axiosClient";

/* ==========================================================
   BASE URL
========================================================== */

const BASE_URL = "/viewing-reminders";


/* ==========================================================
   GET ALL REMINDERS
========================================================== */

/**
 * GET
 * /api/viewing-reminders
 *
 * Returns reminders visible to the authenticated user.
 *
 * Optional filters:
 *
 * {
 *   status,
 *   viewingId,
 *   type,
 *   date,
 *   page,
 *   limit
 * }
 */

const getReminders = async (filters = {}) => {

  const response = await axiosClient.get(
    BASE_URL,
    {
      params: filters,
    }
  );

  return response.data;
};


/* ==========================================================
   GET SINGLE REMINDER
========================================================== */

/**
 * GET
 * /api/viewing-reminders/:id
 */

const getReminder = async (reminderId) => {

  const response = await axiosClient.get(
    `${BASE_URL}/${reminderId}`
  );

  return response.data;
};


/* ==========================================================
   CREATE REMINDER
========================================================== */

/**
 * POST
 * /api/viewing-reminders
 *
 * Example payload:
 *
 * {
 *   viewingId,
 *   type: "one_day_before",
 *   scheduledFor,
 *   channel: "in_app"
 * }
 */

const createReminder = async (payload) => {

  const response = await axiosClient.post(
    BASE_URL,
    payload
  );

  return response.data;
};


/* ==========================================================
   UPDATE REMINDER
========================================================== */

/**
 * PATCH
 * /api/viewing-reminders/:id
 */

const updateReminder = async (
  reminderId,
  payload
) => {

  const response = await axiosClient.patch(
    `${BASE_URL}/${reminderId}`,
    payload
  );

  return response.data;
};


/* ==========================================================
   CANCEL REMINDER
========================================================== */

/**
 * PATCH
 * /api/viewing-reminders/:id/cancel
 */

const cancelReminder = async (reminderId) => {

  const response = await axiosClient.patch(
    `${BASE_URL}/${reminderId}/cancel`
  );

  return response.data;
};


/* ==========================================================
   MARK REMINDER AS SENT
========================================================== */

/**
 * PATCH
 * /api/viewing-reminders/:id/sent
 *
 * Used by the reminder worker after successful delivery.
 */

const markReminderSent = async (reminderId) => {

  const response = await axiosClient.patch(
    `${BASE_URL}/${reminderId}/sent`
  );

  return response.data;
};


/* ==========================================================
   RETRY FAILED REMINDER
========================================================== */

/**
 * PATCH
 * /api/viewing-reminders/:id/retry
 */

const retryReminder = async (reminderId) => {

  const response = await axiosClient.patch(
    `${BASE_URL}/${reminderId}/retry`
  );

  return response.data;
};


/* ==========================================================
   GET REMINDERS FOR A VIEWING
========================================================== */

/**
 * GET
 * /api/viewing-reminders/viewing/:viewingId
 *
 * Returns all reminders belonging to a specific viewing.
 */

const getViewingReminders = async (viewingId) => {

  const response = await axiosClient.get(
    `${BASE_URL}/viewing/${viewingId}`
  );

  return response.data;
};


/* ==========================================================
   GET UPCOMING REMINDERS
========================================================== */

/**
 * GET
 * /api/viewing-reminders/upcoming
 *
 * Returns pending reminders scheduled for upcoming
 * viewings.
 */

const getUpcomingReminders = async (filters = {}) => {

  const response = await axiosClient.get(
    `${BASE_URL}/upcoming`,
    {
      params: filters,
    }
  );

  return response.data;
};


/* ==========================================================
   GET TODAY'S REMINDERS
========================================================== */

/**
 * GET
 * /api/viewing-reminders/today
 *
 * Returns reminders scheduled for today.
 */

const getTodayReminders = async (filters = {}) => {

  const response = await axiosClient.get(
    `${BASE_URL}/today`,
    {
      params: filters,
    }
  );

  return response.data;
};


/* ==========================================================
   GET FAILED REMINDERS
========================================================== */

/**
 * GET
 * /api/viewing-reminders/failed
 *
 * Returns reminders that failed delivery.
 */

const getFailedReminders = async (filters = {}) => {

  const response = await axiosClient.get(
    `${BASE_URL}/failed`,
    {
      params: filters,
    }
  );

  return response.data;
};


/* ==========================================================
   SCHEDULE VIEWING REMINDERS
========================================================== */

/**
 * POST
 * /api/viewing-reminders/viewing/:viewingId/schedule
 *
 * Creates the reminder schedule for an approved viewing.
 *
 * Normally creates:
 *
 * ✓ One-day-before reminder
 * ✓ One-hour-before reminder
 */

const scheduleViewingReminders = async (
  viewingId,
  payload = {}
) => {

  const response = await axiosClient.post(
    `${BASE_URL}/viewing/${viewingId}/schedule`,
    payload
  );

  return response.data;
};


/* ==========================================================
   CANCEL ALL VIEWING REMINDERS
========================================================== */

/**
 * PATCH
 * /api/viewing-reminders/viewing/:viewingId/cancel
 *
 * Cancels all pending reminders belonging to a viewing.
 *
 * Used when:
 *
 * ✓ Viewing cancelled
 * ✓ Viewing rejected
 * ✓ Viewing completed
 * ✓ Viewing rescheduled
 */

const cancelViewingReminders = async (
  viewingId
) => {

  const response = await axiosClient.patch(
    `${BASE_URL}/viewing/${viewingId}/cancel`
  );

  return response.data;
};


/* ==========================================================
   EXPORT SERVICE
========================================================== */

const viewingReminderService = {

  /* Retrieval */

  getReminders,

  getReminder,

  getViewingReminders,

  getUpcomingReminders,

  getTodayReminders,

  getFailedReminders,


  /* CRUD */

  createReminder,

  updateReminder,

  cancelReminder,


  /* Delivery */

  markReminderSent,

  retryReminder,


  /* Viewing workflow */

  scheduleViewingReminders,

  cancelViewingReminders,

};


/* ==========================================================
   DEFAULT EXPORT
========================================================== */

export default viewingReminderService;