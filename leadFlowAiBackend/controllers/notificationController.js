/**
 * ============================================================
 *
 * Responsible for viewing workflow notifications.
 *
 * Events
 * ------------------------------------------------------------
 * ✓ Viewing Approved
 * ✓ Viewing Rejected
 * ✓ Viewing Reminder
 * ✓ Viewing Rescheduled
 * ✓ Viewing Cancelled
 *
 * Future integrations
 * ------------------------------------------------------------
 * SMS
 * WhatsApp
 * Email
 * Push Notifications
 * Socket.io
 * ============================================================
 */

import Notification from "../models/notification.js";
import Viewing from "../models/viewing.js";
import Lead from "../models/lead.js";
import Property from "../models/property.js";

/* ============================================================
   CREATE NOTIFICATION
============================================================ */

const createNotification = async ({
  organizationId,
  userId,
  title,
  message,
  type,
  viewingId,
  leadId,
  propertyId,
}) => {
  return Notification.create({
    organizationId,
    user: userId,
    title,
    message,
    type,
    viewing: viewingId,
    lead: leadId,
    property: propertyId,
    status: "unread",
  });
};

/* ============================================================
   VIEWING APPROVED
============================================================ */

export const notifyViewingApproved = async (
  req,
  res
) => {
  try {
    const viewing = await Viewing.findById(
      req.params.id
    )
      .populate("lead")
      .populate("property");

    if (!viewing) {
      return res.status(404).json({
        success: false,
        message: "Viewing not found",
      });
    }

    await createNotification({
      organizationId:
        viewing.organizationId,

      userId:
        viewing.requestedBy,

      viewingId:
        viewing._id,

      leadId:
        viewing.lead._id,

      propertyId:
        viewing.property._id,

      type: "VIEWING_APPROVED",

      title: "Viewing Approved",

      message: `Your viewing for "${viewing.property.title}" has been approved for ${viewing.viewingDate.toDateString()} at ${viewing.startTime}.`,
    });

    return res.json({
      success: true,
      message: "Approval notification sent.",
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err.message,
    });
  }
};

/* ============================================================
   VIEWING REJECTED
============================================================ */

export const notifyViewingRejected =
  async (req, res) => {
    try {
      const viewing =
        await Viewing.findById(
          req.params.id
        )
          .populate("lead")
          .populate("property");

      if (!viewing) {
        return res.status(404).json({
          success: false,
          message:
            "Viewing not found",
        });
      }

      await createNotification({
        organizationId:
          viewing.organizationId,

        userId:
          viewing.requestedBy,

        viewingId:
          viewing._id,

        leadId:
          viewing.lead._id,

        propertyId:
          viewing.property._id,

        type: "VIEWING_REJECTED",

        title:
          "Viewing Request Rejected",

        message: `Unfortunately your viewing request for "${viewing.property.title}" has been rejected.`,
      });

      res.json({
        success: true,
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        error: err.message,
      });
    }
  };

/* ============================================================
   VIEWING RESCHEDULED
============================================================ */

export const notifyViewingRescheduled =
  async (req, res) => {
    try {
      const viewing =
        await Viewing.findById(
          req.params.id
        )
          .populate("lead")
          .populate("property");

      if (!viewing) {
        return res.status(404).json({
          success: false,
          message:
            "Viewing not found",
        });
      }

      await createNotification({
        organizationId:
          viewing.organizationId,

        userId:
          viewing.requestedBy,

        viewingId:
          viewing._id,

        leadId:
          viewing.lead._id,

        propertyId:
          viewing.property._id,

        type:
          "VIEWING_RESCHEDULED",

        title:
          "Viewing Rescheduled",

        message: `Your viewing has been rescheduled to ${viewing.viewingDate.toDateString()} at ${viewing.startTime}.`,
      });

      res.json({
        success: true,
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        error: err.message,
      });
    }
  };

/* ============================================================
   VIEWING CANCELLED
============================================================ */

export const notifyViewingCancelled =
  async (req, res) => {
    try {
      const viewing =
        await Viewing.findById(
          req.params.id
        )
          .populate("lead")
          .populate("property");

      if (!viewing) {
        return res.status(404).json({
          success: false,
          message:
            "Viewing not found",
        });
      }

      await createNotification({
        organizationId:
          viewing.organizationId,

        userId:
          viewing.requestedBy,

        viewingId:
          viewing._id,

        leadId:
          viewing.lead._id,

        propertyId:
          viewing.property._id,

        type:
          "VIEWING_CANCELLED",

        title:
          "Viewing Cancelled",

        message: `Your viewing for "${viewing.property.title}" has been cancelled.`,
      });

      res.json({
        success: true,
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        error: err.message,
      });
    }
  };

/* ============================================================
   VIEWING REMINDER
============================================================ */

export const sendViewingReminder =
  async (req, res) => {
    try {
      const viewing =
        await Viewing.findById(
          req.params.id
        )
          .populate("lead")
          .populate("property");

      if (!viewing) {
        return res.status(404).json({
          success: false,
          message:
            "Viewing not found",
        });
      }

      await createNotification({
        organizationId:
          viewing.organizationId,

        userId:
          viewing.requestedBy,

        viewingId:
          viewing._id,

        leadId:
          viewing.lead._id,

        propertyId:
          viewing.property._id,

        type:
          "VIEWING_REMINDER",

        title:
          "Viewing Reminder",

        message: `Reminder: You have a property viewing tomorrow at ${viewing.startTime} for "${viewing.property.title}".`,
      });

      res.json({
        success: true,
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        error: err.message,
      });
    }
  };

/* ============================================================
   EXPORT
============================================================ */

export default {
  notifyViewingApproved,
  notifyViewingRejected,
  notifyViewingRescheduled,
  notifyViewingCancelled,
  sendViewingReminder,
};