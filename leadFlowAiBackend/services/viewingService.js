/**
 * ==========================================================
 *
 * Business logic for LeadFlow AI viewing workflow.
 *
 * Controllers call this service.
 * Database rules live here.
 *
 * ==========================================================
 */

import Viewing from "../models/viewing.js";
import Lead from "../models/lead.js";
import Property from "../models/property.js";
import Notification from "../models/notification.js";

/* ==========================================================
   LEAD STATUS SOURCE OF TRUTH
========================================================== */

/**
 * Existing Lead model status enum:
 *
 *   new
 *   contacted
 *   qualified
 *   viewing
 *   negotiation
 *   won
 *   lost
 *
 * IMPORTANT:
 * These are Lead.status values only.
 *
 * Viewing workflow states such as:
 *
 *   Requested
 *   Pending Approval
 *   Approved
 *   Rescheduled
 *   Rejected
 *   Cancelled
 *   Completed
 *
 * belong to Viewing.status and must NOT be written
 * into Lead.status.
 */

const LEAD_STATUS = {
  NEW: "new",
  CONTACTED: "contacted",
  QUALIFIED: "qualified",
  VIEWING: "viewing",
  NEGOTIATION: "negotiation",
  WON: "won",
  LOST: "lost",
};

/* ==========================================================
   HELPER
   CREATE NOTIFICATION
========================================================== */

const createNotification = async ({
  organizationId,
  userId,
  title,
  message,
  type = "viewing",
  metadata = {},
}) => {
  return Notification.create({
    organizationId,
    userId,
    title,
    message,
    type,
    metadata,
    isRead: false,
  });
};

/* ==========================================================
   PROPERTY CONFLICT CHECK
========================================================== */

export const checkPropertyConflict = async ({
  propertyId,
  viewingDate,
  startTime,
  endTime,
}) => {

  const conflict =
    await Viewing.findOne({

      property: propertyId,

      viewingDate,

      status: {
        $in: [
          "Requested",
          "Pending Approval",
          "Approved",
          "Rescheduled",
        ],
      },

      startTime,

      endTime,

    });

  return !!conflict;
};

/* ==========================================================
   AGENT CONFLICT CHECK
========================================================== */

export const checkAgentConflict = async ({
  agentId,
  viewingDate,
  startTime,
  endTime,
}) => {

  const conflict =
    await Viewing.findOne({

      agent: agentId,

      viewingDate,

      status: {
        $in: [
          "Requested",
          "Pending Approval",
          "Approved",
          "Rescheduled",
        ],
      },

      startTime,

      endTime,

    });

  return !!conflict;
};

/* ==========================================================
   REQUEST VIEWING
========================================================== */

export const requestViewing = async ({
  organizationId,
  requestedBy,
  leadId,
  propertyId,
  agentId,
  viewingDate,
  startTime,
  endTime,
  customerNotes,
}) => {

  /* ------------------------------------
     Validate Lead
  ------------------------------------ */

  const lead =
    await Lead.findById(leadId);

  if (!lead) {
    throw new Error(
      "Lead not found."
    );
  }

  /* ------------------------------------
     Validate Property
  ------------------------------------ */

  const property =
    await Property.findById(
      propertyId
    );

  if (!property) {
    throw new Error(
      "Property not found."
    );
  }

  /* ------------------------------------
     Property Availability
  ------------------------------------ */

  if (
    property.availability !==
    "available"
  ) {
    throw new Error(
      "Property is currently unavailable for viewing."
    );
  }

  /* ------------------------------------
     Conflict Detection
  ------------------------------------ */

  const propertyConflict =
    await checkPropertyConflict({

      propertyId,

      viewingDate,

      startTime,

      endTime,

    });

  if (propertyConflict) {
    throw new Error(
      "Property already has a viewing scheduled for this time."
    );
  }

  const agentConflict =
    await checkAgentConflict({

      agentId,

      viewingDate,

      startTime,

      endTime,

    });

  if (agentConflict) {
    throw new Error(
      "Assigned agent already has another viewing."
    );
  }

  /* ------------------------------------
     Create Viewing
  ------------------------------------ */

  const viewing =
    await Viewing.create({

      organizationId,

      requestedBy,

      lead: leadId,

      property: propertyId,

      agent: agentId,

      viewingDate,

      startTime,

      endTime,

      customerNotes,

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

      status:
        "Requested",

    });

  /* ------------------------------------
     Update Lead
  ------------------------------------ */

  /**
   * Lead.status uses the existing Lead
   * schema enum.
   *
   * A viewing request means the lead has
   * entered the viewing stage.
   *
   * DO NOT use:
   *
   * "viewing_requested"
   * "viewing_scheduled"
   */

  lead.status =
    LEAD_STATUS.VIEWING;

  await lead.save();

  /* ------------------------------------
     Update Property
  ------------------------------------ */

  property.availability =
    "viewing_booked";

  property.viewingStats.totalRequests += 1;

  await property.save();

  /* ------------------------------------
     Notify Agent
  ------------------------------------ */

  await createNotification({

    organizationId,

    userId: agentId,

    title:
      "New Viewing Request",

    message:
      `${lead.name} requested a viewing for "${property.title}".`,

    metadata: {

      viewingId:
        viewing._id,

    },

  });

  return viewing;
};

/* ==========================================================
   APPROVE VIEWING
========================================================== */

export const approveViewing = async ({
  organizationId,
  viewingId,
  approvedBy,
}) => {

  const viewing =
    await Viewing.findById(viewingId)
      .populate("lead")
      .populate("property")
      .populate("agent");

  if (!viewing) {
    throw new Error(
      "Viewing not found."
    );
  }

  if (
    viewing.status ===
    "Approved"
  ) {
    throw new Error(
      "Viewing already approved."
    );
  }

  viewing.status =
    "Approved";

  viewing.approvedBy =
    approvedBy;

  viewing.approvedAt =
    new Date();

  await viewing.save();

  /* ------------------------------------
     Update Lead
  ------------------------------------ */

  /**
   * The Lead remains in the existing
   * "viewing" lifecycle stage.
   *
   * Scheduling details are represented
   * by Viewing.status / viewingDate /
   * startTime rather than inventing a
   * Lead.status value.
   */

  await Lead.findByIdAndUpdate(
    viewing.lead._id,
    {
      status:
        LEAD_STATUS.VIEWING,

      lastContact:
        new Date(),
    }
  );

  /* ------------------------------------
     Update Property
  ------------------------------------ */

  await Property.findByIdAndUpdate(
    viewing.property._id,
    {
      availability:
        "viewing_booked",
    }
  );

  /* ------------------------------------
     Notify Customer
  ------------------------------------ */

  await createNotification({

    organizationId,

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

  return viewing;
};

/* ==========================================================
   REJECT VIEWING
========================================================== */

export const rejectViewing = async ({
  organizationId,
  viewingId,
  rejectedBy,
  rejectionReason,
}) => {

  const viewing =
    await Viewing.findById(viewingId)
      .populate("lead")
      .populate("property");

  if (!viewing) {
    throw new Error(
      "Viewing not found."
    );
  }

  viewing.status =
    "Rejected";

  viewing.approvedBy =
    rejectedBy;

  viewing.rejectionReason =
    rejectionReason ||
    "No reason provided.";

  viewing.approvedAt =
    new Date();

  await viewing.save();

  /* ------------------------------------
     Lead returns to qualified stage
  ------------------------------------ */

  /**
   * "follow_up" is NOT a valid Lead.status.
   *
   * Follow-up state is represented using:
   *
   *   followUpStatus
   *   nextAction
   *
   * The Lead.status therefore remains
   * "qualified".
   */

  await Lead.findByIdAndUpdate(
    viewing.lead._id,
    {
      status:
        LEAD_STATUS.QUALIFIED,

      followUpStatus:
        "pending",

      lastContact:
        new Date(),
    }
  );

  /* ------------------------------------
     Property becomes available again
  ------------------------------------ */

  await Property.findByIdAndUpdate(
    viewing.property._id,
    {
      availability:
        "available",
    }
  );

  /* ------------------------------------
     Notify Customer
  ------------------------------------ */

  await createNotification({

    organizationId,

    userId:
      viewing.requestedBy,

    title:
      "Viewing Rejected",

    message:
      `Your viewing request for "${viewing.property.title}" was rejected.`,

    metadata: {

      viewingId:
        viewing._id,

      reason:
        rejectionReason,

    },

  });

  return viewing;
};

/* ==========================================================
   RESCHEDULE VIEWING
========================================================== */

export const rescheduleViewing = async ({
  organizationId,
  viewingId,
  viewingDate,
  startTime,
  endTime,
}) => {

  const viewing =
    await Viewing.findById(viewingId)
      .populate("lead")
      .populate("property")
      .populate("agent");

  if (!viewing) {
    throw new Error(
      "Viewing not found."
    );
  }

  /* ------------------------------------
     Check Property Availability
  ------------------------------------ */

  const propertyConflict =
    await Viewing.findOne({

      _id: {
        $ne: viewingId,
      },

      property:
        viewing.property._id,

      viewingDate,

      startTime,

      endTime,

      status: {
        $in: [
          "Requested",
          "Pending Approval",
          "Approved",
          "Rescheduled",
        ],
      },

    });

  if (propertyConflict) {
    throw new Error(
      "Property already has another viewing during this period."
    );
  }

  /* ------------------------------------
     Check Agent Schedule
  ------------------------------------ */

  const agentConflict =
    await Viewing.findOne({

      _id: {
        $ne: viewingId,
      },

      agent:
        viewing.agent._id,

      viewingDate,

      startTime,

      endTime,

      status: {
        $in: [
          "Requested",
          "Pending Approval",
          "Approved",
          "Rescheduled",
        ],
      },

    });

  if (agentConflict) {
    throw new Error(
      "Agent already has another scheduled viewing."
    );
  }

  /* ------------------------------------
     Save Previous Schedule
  ------------------------------------ */

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

  /* ------------------------------------
     Apply New Schedule
  ------------------------------------ */

  viewing.viewingDate =
    viewingDate;

  viewing.startTime =
    startTime;

  viewing.endTime =
    endTime;

  viewing.status =
    "Rescheduled";

  viewing.rescheduleCount += 1;

  await viewing.save();

  /* ------------------------------------
     Lead remains in viewing stage
  ------------------------------------ */

  await Lead.findByIdAndUpdate(
    viewing.lead._id,
    {
      status:
        LEAD_STATUS.VIEWING,

      lastContact:
        new Date(),
    }
  );

  /* ------------------------------------
     Notify Customer
  ------------------------------------ */

  await createNotification({

    organizationId,

    userId:
      viewing.requestedBy,

    title:
      "Viewing Rescheduled",

    message:
      `Your viewing for "${viewing.property.title}" has been rescheduled.`,

    metadata: {

      viewingId:
        viewing._id,

      viewingDate,

      startTime,

      endTime,

    },

  });

  return viewing;
};

/* ==========================================================
   CANCEL VIEWING
========================================================== */

export const cancelViewing = async ({
  organizationId,
  viewingId,
}) => {

  const viewing =
    await Viewing.findById(viewingId)
      .populate("lead")
      .populate("property");

  if (!viewing) {
    throw new Error(
      "Viewing not found."
    );
  }

  viewing.status =
    "Cancelled";

  await viewing.save();

  /* ------------------------------------
     Lead Back To Qualified
  ------------------------------------ */

  /**
   * "follow_up" is NOT a valid Lead.status.
   *
   * Follow-up remains represented through
   * Lead.followUpStatus.
   */

  await Lead.findByIdAndUpdate(

    viewing.lead._id,

    {

      status:
        LEAD_STATUS.QUALIFIED,

      followUpStatus:
        "pending",

      lastContact:
        new Date(),

    }

  );

  /* ------------------------------------
     Property Available Again
  ------------------------------------ */

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

  /* ------------------------------------
     Notify Customer
  ------------------------------------ */

  await createNotification({

    organizationId,

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

  return viewing;
};

/* ==========================================================
   COMPLETE VIEWING
========================================================== */

export const completeViewing = async ({
  organizationId,
  viewingId,
}) => {

  const viewing =
    await Viewing.findById(viewingId)
      .populate("lead")
      .populate("property");

  if (!viewing) {
    throw new Error(
      "Viewing not found."
    );
  }

  viewing.status =
    "Completed";

  await viewing.save();

  /* ------------------------------------
     Update Lead
  ------------------------------------ */

  /**
   * "follow_up" is NOT a valid Lead.status.
   *
   * After a completed viewing, the lead
   * returns to the valid CRM qualification
   * stage while follow-up is tracked using
   * the dedicated follow-up fields.
   */

  await Lead.findByIdAndUpdate(

    viewing.lead._id,

    {

      status:
        LEAD_STATUS.QUALIFIED,

      followUpStatus:
        "pending",

      lastContact:
        new Date(),

      nextAction:
        "Contact customer after completed viewing",

    }

  );

  /* ------------------------------------
     Update Property Statistics
  ------------------------------------ */

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

  /* ------------------------------------
     Notify Customer
  ------------------------------------ */

  await createNotification({

    organizationId,

    userId:
      viewing.requestedBy,

    title:
      "Viewing Completed",

    message:
      `Thank you for attending the viewing of "${viewing.property.title}".`,

    metadata: {

      viewingId:
        viewing._id,

    },

  });

  return viewing;
};

/* ==========================================================
   SUBMIT FEEDBACK
========================================================== */

export const submitFeedback = async ({
  organizationId,
  viewingId,
  viewerRating,
  viewerComment,
  agentOutcome,
  followUpRequired,
}) => {

  const viewing =
    await Viewing.findById(viewingId)
      .populate("lead")
      .populate("property");

  if (!viewing) {
    throw new Error(
      "Viewing not found."
    );
  }

  /* ------------------------------------
     Save Feedback
  ------------------------------------ */

  viewing.feedback = {

    viewerRating,

    viewerComment,

    agentOutcome,

    followUpRequired,

  };

  await viewing.save();

  /* ------------------------------------
     Update Property Rating
  ------------------------------------ */

  if (viewerRating) {

    const property =
      await Property.findById(
        viewing.property._id
      );

    const stats =
      property.viewingStats;

    const completed =
      Math.max(
        stats.completedViewings,
        1
      );

    const currentAverage =
      stats.averageRating || 0;

    stats.averageRating =
      Number(

        (
          (
            currentAverage *
            (completed - 1)
          ) +
          viewerRating
        ) / completed

      ).toFixed(2);

    await property.save();
  }

  /* ------------------------------------
     Lead Follow-up Recommendation
  ------------------------------------ */

  if (followUpRequired) {

    await Lead.findByIdAndUpdate(

      viewing.lead._id,

      {

        followUpStatus:
          "pending",

        nextAction:
          "Follow up after viewing",

      }

    );
  }

  /* ------------------------------------
     Notify Assigned Agent
  ------------------------------------ */

  await createNotification({

    organizationId,

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

  return viewing.feedback;
};

/* ==========================================================
   GET ALL VIEWINGS
========================================================== */

export const getAllViewings = async ({
  organizationId,
  role,
  userId,
}) => {

  const query = {
    organizationId,
  };

  if (role === "agent") {
    query.agent = userId;
  }

  return Viewing.find(query)
    .populate(
      "lead",
      "name phone budget location status"
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
};

/* ==========================================================
   GET UPCOMING VIEWINGS
========================================================== */

export const getUpcomingViewings = async ({
  organizationId,
  role,
  userId,
}) => {

  const query = {
    organizationId,

    viewingDate: {
      $gte: new Date(),
    },

    status: {
      $in: [
        "Approved",
        "Rescheduled",
      ],
    },
  };

  if (role === "agent") {
    query.agent = userId;
  }

  return Viewing.find(query)
    .populate(
      "lead",
      "name phone status"
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
};

/* ==========================================================
   GET TODAY VIEWINGS
========================================================== */

export const getTodayViewings = async ({
  organizationId,
  role,
  userId,
}) => {

  const start = new Date();

  start.setHours(
    0,
    0,
    0,
    0
  );

  const end = new Date();

  end.setHours(
    23,
    59,
    59,
    999
  );

  const query = {

    organizationId,

    viewingDate: {

      $gte: start,

      $lte: end,

    },

    status: {

      $in: [

        "Approved",

        "Rescheduled",

      ],

    },

  };

  if (role === "agent") {
    query.agent = userId;
  }

  return Viewing.find(query)
    .populate(
      "lead",
      "name phone status"
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
};

/* ==========================================================
   GET VIEWING BY ID
========================================================== */

export const getViewingById = async (
  viewingId
) => {

  return Viewing.findById(
    viewingId
  )
    .populate("lead")
    .populate("property")
    .populate("agent")
    .populate(
      "approvedBy",
      "name email"
    );
};

/* ==========================================================
   EXPORT
========================================================== */

export default {

  requestViewing,

  approveViewing,

  rejectViewing,

  rescheduleViewing,

  cancelViewing,

  completeViewing,

  submitFeedback,

  getAllViewings,

  getUpcomingViewings,

  getTodayViewings,

  getViewingById,

  checkPropertyConflict,

  checkAgentConflict,

};