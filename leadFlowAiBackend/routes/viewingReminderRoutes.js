// ======================================================
//
// LeadFlow AI
// Viewing Reminder Routes
//
// Purpose
// ------------------------------------------------------
// Defines API endpoints for the automated property-viewing
// reminder system.
//
// Mounted in server.js as:
//
// /api/viewing-reminders
//
// ======================================================

import express from "express";
import { protect } from "../middleware/authMiddleware.js";

import {
  // ====================================================
  // GENERAL REMINDERS
  // ====================================================

  getAllReminders,
  getReminderById,
  createReminder,

  // ====================================================
  // VIEWING / USER REMINDERS
  // ====================================================

  getRemindersByViewing,
  getRemindersByViewer,
  getRemindersByAgent,

  // ====================================================
  // REMINDER QUEUES
  // ====================================================

  getPendingReminders,
  getQueuedReminders,
  getFailedReminders,
  getUpcomingReminders,
  getTodayReminders,

  // ====================================================
  // REMINDER MUTATIONS
  // ====================================================

  updateReminder,
  updateReminderStatus,
  retryReminder,
  cancelReminder,
  archiveReminder,
  restoreReminder,

  // ====================================================
  // ANALYTICS / ADMIN
  // ====================================================

  getReminderStatistics,

  // ====================================================
  // CLEANUP
  // ====================================================

  deleteArchivedReminders,
} from "../controllers/viewingReminderController.js";

// ======================================================
// ROUTER
// ======================================================

const router = express.Router();
router.use(protect);

// ======================================================
// GENERAL REMINDERS
// ======================================================

// GET /api/viewing-reminders
//
// Returns reminders visible to the authenticated user

router.get(
  "/",
  getAllReminders
);

// ======================================================
// CREATE REMINDER
// ======================================================

// POST /api/viewing-reminders

router.post(
  "/",
  createReminder
);

// ======================================================
// REMINDER QUEUES
// ======================================================

// ------------------------------------------------------
// PENDING
// ------------------------------------------------------

// GET /api/viewing-reminders/pending

router.get(
  "/pending",
  getPendingReminders
);

// ------------------------------------------------------
// QUEUED
// ------------------------------------------------------

// GET /api/viewing-reminders/queued

router.get(
  "/queued",
  getQueuedReminders
);

// ------------------------------------------------------
// FAILED
// ------------------------------------------------------

// GET /api/viewing-reminders/failed

router.get(
  "/failed",
  getFailedReminders
);

// ------------------------------------------------------
// UPCOMING
// ------------------------------------------------------

// GET /api/viewing-reminders/upcoming

router.get(
  "/upcoming",
  getUpcomingReminders
);

// ------------------------------------------------------
// TODAY
// ------------------------------------------------------

// GET /api/viewing-reminders/today

router.get(
  "/today",
  getTodayReminders
);

// ======================================================
// VIEWING-SPECIFIC REMINDERS
// ======================================================

// GET /api/viewing-reminders/viewing/:viewingId

router.get(
  "/viewing/:viewingId",
  getRemindersByViewing
);

// ======================================================
// VIEWER REMINDERS
// ======================================================

// GET /api/viewing-reminders/viewer/:viewerId

router.get(
  "/viewer/:viewerId",
  getRemindersByViewer
);

// ======================================================
// AGENT REMINDERS
// ======================================================

// GET /api/viewing-reminders/agent/:agentId

router.get(
  "/agent/:agentId",
  getRemindersByAgent
);

// ======================================================
// REMINDER STATISTICS
// ======================================================

// GET /api/viewing-reminders/statistics

router.get(
  "/statistics",
  getReminderStatistics
);

// ======================================================
// UPDATE REMINDER
// ======================================================
//
// PUT /api/viewing-reminders/:id
//
// Updates reminder configuration such as:
// • reminder type
// • channel
// • subject
// • message
// • scheduledFor
// • recipient
//
// ======================================================

router.put(
  "/:id",
  updateReminder
);

// ======================================================
// UPDATE DELIVERY STATUS
// ======================================================
//
// PATCH /api/viewing-reminders/:id/status
//
// Used by the reminder delivery workflow.
//
// Example statuses:
// • Pending
// • Queued
// • Sent
// • Delivered
// • Read
// • Failed
// • Cancelled
//
// ======================================================

router.patch(
  "/:id/status",
  updateReminderStatus
);

// ======================================================
// RETRY FAILED REMINDER
// ======================================================
//
// POST /api/viewing-reminders/:id/retry
//
// Requeues a failed reminder according to the retry
// policy implemented in the controller.
//
// ======================================================

router.post(
  "/:id/retry",
  retryReminder
);

// ======================================================
// CANCEL REMINDER
// ======================================================
//
// PATCH /api/viewing-reminders/:id/cancel

router.patch(
  "/:id/cancel",
  cancelReminder
);

// ======================================================
// ARCHIVE REMINDER
// ======================================================
//
// PATCH /api/viewing-reminders/:id/archive

router.patch(
  "/:id/archive",
  archiveReminder
);

// ======================================================
// RESTORE REMINDER
// ======================================================
//
// PATCH /api/viewing-reminders/:id/restore
//
// Restores an archived reminder back into the active
// reminder workflow.
//
// ======================================================

router.patch(
  "/:id/restore",
  restoreReminder
);

// ======================================================
// ARCHIVED REMINDER CLEANUP
// ======================================================
//
// DELETE /api/viewing-reminders/archived
//
// Permanently removes archived reminders according to
// controller safeguards.
//
// ======================================================

router.delete(
  "/archived",
  deleteArchivedReminders
);

// ======================================================
// GET REMINDER BY ID
// ======================================================
//
// IMPORTANT
// ------------------------------------------------------
// This MUST remain after every named route.
//
// Otherwise:
//
// /failed
// /pending
// /queued
// /upcoming
// /today
// /statistics
// /archived
//
// could accidentally be interpreted as:
//
// /:id
//
// ======================================================

// GET /api/viewing-reminders/:id

router.get(
  "/:id",
  getReminderById
);

// ======================================================
// EXPORT
// ======================================================

export default router;

