/**
 * ==========================================================
 *
 * BUSINESS LOGIC
 * LEADFLOW AI VIEWING WORKFLOW
 *
 * Controllers own transactions and outbox events.
 * This service owns viewing business rules and mutations.
 *
 * ==========================================================
 *
 * CANONICAL ARCHITECTURE
 * ==========================================================
 *
 * Lead.status is controlled by:
 *   services/leadLifeCycleService.js
 *
 * Viewing.status is controlled independently.
 *
 * All transaction-aware mutations accept an optional
 * MongoDB session supplied by the calling controller.
 *
 * This service does NOT:
 * - Start nested transactions.
 * - Create outbox events.
 * - Publish critical business events.
 *
 * ==========================================================
 */

import Viewing from "../models/viewing.js";
import Lead from "../models/lead.js";
import Property from "../models/property.js";
import Notification from "../models/notification.js";

import {
  LEAD_STATUS,
  canTransitionLeadStatus,
  transitionLeadStatus,
} from "./leadLifeCycleService.js";

/* ==========================================================
   VIEWING STATUS CONSTANTS
========================================================== */

export const VIEWING_STATUS = Object.freeze({
  REQUESTED: "Requested",
  PENDING_APPROVAL: "Pending Approval",
  APPROVED: "Approved",
  RESCHEDULED: "Rescheduled",
  REJECTED: "Rejected",
  CANCELLED: "Cancelled",
  COMPLETED: "Completed",
});

/* ==========================================================
   ACTIVE VIEWING STATUSES
========================================================== */

const ACTIVE_VIEWING_STATUSES = Object.freeze([
  VIEWING_STATUS.REQUESTED,
  VIEWING_STATUS.PENDING_APPROVAL,
  VIEWING_STATUS.APPROVED,
  VIEWING_STATUS.RESCHEDULED,
]);

/* ==========================================================
   HELPER: NORMALIZE USER ID
========================================================== */

const normalizeUserId = (userId) => {
  if (!userId) {
    return null;
  }

  return userId?._id || userId;
};

/* ==========================================================
   HELPER: SAVE DOCUMENT WITH OPTIONAL SESSION
========================================================== */

const saveWithSession = async (document, session = null) => {
  if (!document) {
    throw new Error(
      "A document is required for persistence."
    );
  }

  if (session) {
    return document.save({ session });
  }

  return document.save();
};

/* ==========================================================
   HELPER: CREATE NOTIFICATION
========================================================== */

/**
 * Notification schema contract:
 *
 * - organizationId
 * - user
 * - title
 * - message
 * - type
 * - viewing
 * - lead
 * - property
 * - status
 *
 * Notifications created during a transaction must use
 * that same transaction session.
 */
const createNotification = async ({
  organizationId,
  userId,
  title,
  message,
  type,
  viewingId = null,
  leadId = null,
  propertyId = null,
  session = null,
}) => {
  const normalizedUserId = normalizeUserId(userId);

  if (!organizationId) {
    throw new Error(
      "Organization context is required."
    );
  }

  // A missing recipient should not prevent the business
  // operation from proceeding.
  if (!normalizedUserId) {
    return null;
  }

  if (!title || !message) {
    throw new Error(
      "Notification title and message are required."
    );
  }

  if (!type) {
    throw new Error(
      "Notification type is required."
    );
  }

  const notification = new Notification({
    organizationId,
    user: normalizedUserId,
    title,
    message,
    type,
    viewing: viewingId,
    lead: leadId,
    property: propertyId,
    status: "unread",
  });

  return saveWithSession(notification, session);
};

/* ==========================================================
   HELPER: VALIDATE TIME
========================================================== */

/**
 * Convert HH:mm into minutes after midnight.
 */
const timeToMinutes = (value) => {
  if (value === undefined || value === null) {
    return null;
  }

  const normalized = String(value).trim();
  const match = /^(\d{1,2}):(\d{2})$/.exec(normalized);

  if (!match) {
    return null;
  }

  const hours = Number(match[1]);
  const minutes = Number(match[2]);

  if (
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    return null;
  }

  return hours * 60 + minutes;
};

/* ==========================================================
   HELPER: VALIDATE VIEWING TIME RANGE
========================================================== */

const validateViewingTimeRange = ({
  startTime,
  endTime,
}) => {
  const start = timeToMinutes(startTime);
  const end = timeToMinutes(endTime);

  if (start === null || end === null) {
    throw new Error(
      "Viewing startTime and endTime must use HH:mm format."
    );
  }

  if (start >= end) {
    throw new Error(
      "Viewing endTime must be later than startTime."
    );
  }

  return { start, end };
};

/* ==========================================================
   HELPER: CHECK TIME OVERLAP
========================================================== */

const hasTimeOverlap = ({
  existingStartTime,
  existingEndTime,
  requestedStartTime,
  requestedEndTime,
}) => {
  const existingStart = timeToMinutes(
    existingStartTime
  );

  const existingEnd = timeToMinutes(
    existingEndTime
  );

  const requestedStart = timeToMinutes(
    requestedStartTime
  );

  const requestedEnd = timeToMinutes(
    requestedEndTime
  );

  if (
    existingStart === null ||
    existingEnd === null ||
    requestedStart === null ||
    requestedEnd === null
  ) {
    return false;
  }

  return (
    existingStart < requestedEnd &&
    requestedStart < existingEnd
  );
};

/* ==========================================================
   HELPER: TRANSITION LEAD STATUS
========================================================== */

/**
 * All lead lifecycle transitions must pass through the
 * canonical lifecycle service.
 *
 * Returns:
 *   true  -> transition occurred
 *   false -> lead already had the requested status
 */
const transitionLeadIfNeeded = async ({
  lead,
  nextStatus,
  session = null,
}) => {
  if (!lead) {
    throw new Error(
      "Lead is required for lifecycle transition."
    );
  }

  const currentStatus = lead.status;

  if (currentStatus === nextStatus) {
    return false;
  }

  if (
    !canTransitionLeadStatus(
      currentStatus,
      nextStatus
    )
  ) {
    throw new Error(
      `Invalid lead lifecycle transition: ${currentStatus} -> ${nextStatus}`
    );
  }

  transitionLeadStatus(lead, nextStatus);

  await saveWithSession(lead, session);

  return true;
};

/* ==========================================================
   HELPER: LOAD TENANT-SCOPED LEAD
========================================================== */

const getLeadForOrganization = async ({
  leadId,
  organizationId,
  session = null,
}) => {
  if (!organizationId) {
    throw new Error(
      "Organization context is required."
    );
  }

  let query = Lead.findOne({
    _id: leadId,
    organizationId,
  });

  if (session) {
    query = query.session(session);
  }

  const lead = await query;

  if (!lead) {
    throw new Error("Lead not found.");
  }

  return lead;
};

/* ==========================================================
   HELPER: LOAD TENANT-SCOPED VIEWING
========================================================== */

const getViewingForOrganization = async ({
  viewingId,
  organizationId,
  populate = false,
  session = null,
}) => {
  if (!organizationId) {
    throw new Error(
      "Organization context is required."
    );
  }

  let query = Viewing.findOne({
    _id: viewingId,
    organizationId,
  });

  if (populate) {
    query = query
      .populate("lead")
      .populate("property")
      .populate("agent");
  }

  if (session) {
    query = query.session(session);
  }

  const viewing = await query;

  if (!viewing) {
    throw new Error("Viewing not found.");
  }

  return viewing;
};

/* ==========================================================
   HELPER: CHECK ACTIVE PROPERTY VIEWINGS
========================================================== */

const hasActivePropertyViewing = async ({
  organizationId,
  propertyId,
  excludeViewingId = null,
  session = null,
}) => {
  const query = {
    organizationId,
    property: propertyId,
    status: {
      $in: ACTIVE_VIEWING_STATUSES,
    },
  };

  if (excludeViewingId) {
    query._id = {
      $ne: excludeViewingId,
    };
  }

  let existingQuery = Viewing.findOne(query)
    .select("_id");

  if (session) {
    existingQuery = existingQuery.session(session);
  }

  const existing = await existingQuery;

  return Boolean(existing);
};

/* ==========================================================
   HELPER: RESTORE PROPERTY AVAILABILITY
========================================================== */

const restorePropertyAvailabilityIfFree = async ({
  organizationId,
  propertyId,
  session = null,
}) => {
  let propertyQuery = Property.findOne({
    _id: propertyId,
    organizationId,
  });

  if (session) {
    propertyQuery = propertyQuery.session(session);
  }

  const property = await propertyQuery;

  if (!property) {
    return null;
  }

  const activeViewing = await hasActivePropertyViewing({
    organizationId,
    propertyId,
    session,
  });

  if (activeViewing) {
    if (property.availability !== "viewing_booked") {
      property.availability = "viewing_booked";

      await saveWithSession(property, session);
    }

    return property;
  }

  // Preserve permanent inventory states.
  const propertyStatus = String(
    property.status || ""
  ).toLowerCase();

  if (propertyStatus === "reserved") {
    property.availability = "reserved";
  } else if (propertyStatus === "sold") {
    property.availability = "sold";
  } else if (propertyStatus === "inactive") {
    property.availability = "inactive";
  } else {
    property.availability = "available";
  }

  await saveWithSession(property, session);

  return property;
};

/* ==========================================================
   PROPERTY CONFLICT CHECK
========================================================== */

export const checkPropertyConflict = async ({
  organizationId,
  propertyId,
  viewingDate,
  startTime,
  endTime,
  excludeViewingId = null,
  session = null,
}) => {
  if (!organizationId) {
    throw new Error(
      "Organization context is required."
    );
  }

  validateViewingTimeRange({
    startTime,
    endTime,
  });

  const query = {
    organizationId,
    property: propertyId,
    viewingDate,
    status: {
      $in: ACTIVE_VIEWING_STATUSES,
    },
  };

  if (excludeViewingId) {
    query._id = {
      $ne: excludeViewingId,
    };
  }

  let existingQuery = Viewing.find(query)
    .select("startTime endTime");

  if (session) {
    existingQuery = existingQuery.session(session);
  }

  const existingViewings = await existingQuery;

  return existingViewings.some((existing) =>
    hasTimeOverlap({
      existingStartTime: existing.startTime,
      existingEndTime: existing.endTime,
      requestedStartTime: startTime,
      requestedEndTime: endTime,
    })
  );
};

/* ==========================================================
   AGENT CONFLICT CHECK
========================================================== */

export const checkAgentConflict = async ({
  organizationId,
  agentId,
  viewingDate,
  startTime,
  endTime,
  excludeViewingId = null,
  session = null,
}) => {
  if (!organizationId) {
    throw new Error(
      "Organization context is required."
    );
  }

  validateViewingTimeRange({
    startTime,
    endTime,
  });

  const query = {
    organizationId,
    agent: agentId,
    viewingDate,
    status: {
      $in: ACTIVE_VIEWING_STATUSES,
    },
  };

  if (excludeViewingId) {
    query._id = {
      $ne: excludeViewingId,
    };
  }

  let existingQuery = Viewing.find(query)
    .select("startTime endTime");

  if (session) {
    existingQuery = existingQuery.session(session);
  }

  const existingViewings = await existingQuery;

  return existingViewings.some((existing) =>
    hasTimeOverlap({
      existingStartTime: existing.startTime,
      existingEndTime: existing.endTime,
      requestedStartTime: startTime,
      requestedEndTime: endTime,
    })
  );
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
  conversationId = null,
  viewingDate,
  startTime,
  endTime,
  customerNotes,
  session = null,
}) => {
  if (!organizationId) {
    throw new Error(
      "Organization context is required."
    );
  }

  validateViewingTimeRange({
    startTime,
    endTime,
  });

  /* ------------------------------------
     Validate Lead
  ------------------------------------ */

  const lead = await getLeadForOrganization({
    leadId,
    organizationId,
    session,
  });

  /*
   * A viewing request moves the lead into the canonical
   * viewing stage. Terminal or otherwise incompatible
   * lifecycle states must not be moved backward.
   */
  if (
    lead.status !== LEAD_STATUS.VIEWING &&
    !canTransitionLeadStatus(
      lead.status,
      LEAD_STATUS.VIEWING
    )
  ) {
    throw new Error(
      `Lead cannot request a viewing from the current lifecycle stage: ${lead.status}`
    );
  }

  /* ------------------------------------
     Validate Property
  ------------------------------------ */

  let propertyQuery = Property.findOne({
    _id: propertyId,
    organizationId,
  });

  if (session) {
    propertyQuery = propertyQuery.session(session);
  }

  const property = await propertyQuery;

  if (!property) {
    throw new Error("Property not found.");
  }

  if (
  String(property.status || "").trim().toLowerCase() !== "available" ||
  property.isArchived === true
) {
  throw new Error(
    "Property is currently unavailable for viewing."
  );
}

  /* ------------------------------------
     Property Conflict
  ------------------------------------ */

  const propertyConflict = await checkPropertyConflict({
    organizationId,
    propertyId,
    viewingDate,
    startTime,
    endTime,
    session,
  });

  if (propertyConflict) {
    throw new Error(
      "Property already has a viewing scheduled during this period."
    );
  }

  /* ------------------------------------
     Agent Conflict
  ------------------------------------ */

  const agentConflict = await checkAgentConflict({
    organizationId,
    agentId,
    viewingDate,
    startTime,
    endTime,
    session,
  });

  if (agentConflict) {
    throw new Error(
      "Assigned agent already has another viewing during this period."
    );
  }

  /* ------------------------------------
     Create Viewing
  ------------------------------------ */

  const viewingData = {
  organizationId,
  requestedBy,
  lead: lead._id,
  property: property._id,
  agent: agentId,
  ...(conversationId ? { conversation: conversationId } : {}),
    viewingDate,
    startTime,
    endTime,
    customerNotes,

    location: {
      address: property.location,
      city: property.city,
      county: property.county,
      latitude: property.coordinates?.latitude,
      longitude: property.coordinates?.longitude,
    },

    status: VIEWING_STATUS.REQUESTED,
  };

  const viewing = session
    ? (await Viewing.create([viewingData], { session }))[0]
    : await Viewing.create(viewingData);

  /* ------------------------------------
     Update Lead Lifecycle
  ------------------------------------ */

  await transitionLeadIfNeeded({
    lead,
    nextStatus: LEAD_STATUS.VIEWING,
    session,
  });


  /* ------------------------------------
   SYNCHRONIZE LEAD VIEWING STATE
------------------------------------ */

lead.currentViewing = viewing._id;
lead.viewingStatus = "requested";
lead.viewingRequestCount =
  Number(lead.viewingRequestCount || 0) + 1;
lead.nextViewingDate = viewing.viewingDate;
lead.viewingCompleted = false; 


  /* ------------------------------------
     Update Lead Contact Timestamp
  ------------------------------------ */

  lead.lastContact = new Date();

  await saveWithSession(lead, session);

  /* ------------------------------------
     Update Property Statistics
  ------------------------------------ */

  if (property.viewingStats) {
    property.viewingStats.totalRequests =
      Number(property.viewingStats.totalRequests || 0) + 1;
  }

  /*
   * A Requested viewing does not mark the property as
   * viewing_booked. Approval is the point at which the
   * property availability changes.
   */
  await saveWithSession(property, session);

  /* ------------------------------------
     Notify Agent
  ------------------------------------ */

  await createNotification({
    organizationId,
    userId: agentId,
    title: "New Viewing Request",
    message: `${lead.name} requested a viewing for "${property.title}".`,
    type: "VIEWING_REQUESTED",
    viewingId: viewing._id,
    leadId: lead._id,
    propertyId: property._id,
    session,
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
  session = null,
}) => {
  if (!organizationId) {
    throw new Error(
      "Organization context is required."
    );
  }

  /* ------------------------------------
     Load Viewing
  ------------------------------------ */

  const viewing = await getViewingForOrganization({
    viewingId,
    organizationId,
    populate: true,
    session,
  });

  /* ------------------------------------
     Validate Current State
  ------------------------------------ */

  if (viewing.status === VIEWING_STATUS.APPROVED) {
    throw new Error("Viewing already approved.");
  }

  if (
    ![
      VIEWING_STATUS.REQUESTED,
      VIEWING_STATUS.PENDING_APPROVAL,
      VIEWING_STATUS.RESCHEDULED,
    ].includes(viewing.status)
  ) {
    throw new Error(
      `Viewing cannot be approved from status "${viewing.status}".`
    );
  }

  if (!viewing.property || !viewing.lead || !viewing.agent) {
    throw new Error(
      "Viewing must have a valid lead, property, and agent."
    );
  }

  /* ------------------------------------
     Re-check Property Conflict
  ------------------------------------ */

  const propertyConflict = await checkPropertyConflict({
    organizationId,
    propertyId: viewing.property._id,
    viewingDate: viewing.viewingDate,
    startTime: viewing.startTime,
    endTime: viewing.endTime,
    excludeViewingId: viewing._id,
    session,
  });

  if (propertyConflict) {
    throw new Error(
      "Property already has another viewing during this period."
    );
  }

  /* ------------------------------------
     Re-check Agent Conflict
  ------------------------------------ */

  const agentConflict = await checkAgentConflict({
    organizationId,
    agentId: viewing.agent._id,
    viewingDate: viewing.viewingDate,
    startTime: viewing.startTime,
    endTime: viewing.endTime,
    excludeViewingId: viewing._id,
    session,
  });

  if (agentConflict) {
    throw new Error(
      "Assigned agent already has another viewing during this period."
    );
  }

  /* ------------------------------------
     Update Viewing
  ------------------------------------ */

  viewing.status = VIEWING_STATUS.APPROVED;
  viewing.approvedBy = approvedBy;
  viewing.approvedAt = new Date();

  await saveWithSession(viewing, session);

  /* ------------------------------------
     Keep Lead in Viewing Stage
  ------------------------------------ */

  const lead = await getLeadForOrganization({
    leadId: viewing.lead._id,
    organizationId,
    session,
  });

  if (lead.status !== LEAD_STATUS.VIEWING) {
    if (
      canTransitionLeadStatus(
        lead.status,
        LEAD_STATUS.VIEWING
      )
    ) {
      await transitionLeadIfNeeded({
        lead,
        nextStatus: LEAD_STATUS.VIEWING,
        session,
      });
    } else {
      throw new Error(
        `Lead cannot enter viewing stage from lifecycle status "${lead.status}".`
      );
    }
  }

  lead.lastContact = new Date();

  await saveWithSession(lead, session);

  /* ------------------------------------
     Update Property Availability
  ------------------------------------ */

  let propertyQuery = Property.findOne({
    _id: viewing.property._id,
    organizationId,
  });

  if (session) {
    propertyQuery = propertyQuery.session(session);
  }

  const property = await propertyQuery;

  if (!property) {
    throw new Error("Property not found.");
  }

  property.availability = "viewing_booked";

  await saveWithSession(property, session);

  /* ------------------------------------
     Notify Customer
  ------------------------------------ */

  await createNotification({
    organizationId,
    userId: viewing.requestedBy,
    title: "Viewing Approved",
    message: `Your viewing for "${property.title}" has been approved.`,
    type: "VIEWING_APPROVED",
    viewingId: viewing._id,
    leadId: lead._id,
    propertyId: property._id,
    session,
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
  session = null,
}) => {
  if (!organizationId) {
    throw new Error(
      "Organization context is required."
    );
  }

  const viewing = await getViewingForOrganization({
    viewingId,
    organizationId,
    populate: true,
    session,
  });

  /* ------------------------------------
     Validate Current State
  ------------------------------------ */

  if (
    ![
      VIEWING_STATUS.REQUESTED,
      VIEWING_STATUS.PENDING_APPROVAL,
      VIEWING_STATUS.RESCHEDULED,
    ].includes(viewing.status)
  ) {
    throw new Error(
      `Viewing cannot be rejected from status "${viewing.status}".`
    );
  }

  if (!viewing.property || !viewing.lead) {
    throw new Error(
      "Viewing must have a valid lead and property."
    );
  }

  /* ------------------------------------
     Update Viewing
  ------------------------------------ */

  viewing.status = VIEWING_STATUS.REJECTED;
  viewing.rejectionReason =
    rejectionReason || "No reason provided.";

  await saveWithSession(viewing, session);

  /* ------------------------------------
     Update Lead Lifecycle and Follow-up
  ------------------------------------ */

  const lead = await getLeadForOrganization({
    leadId: viewing.lead._id,
    organizationId,
    session,
  });

  /*
   * Only move viewing -> qualified when the lead is
   * actually in the viewing stage.
   *
   * Never downgrade a lead that has advanced elsewhere.
   */
  if (lead.status === LEAD_STATUS.VIEWING) {
    await transitionLeadIfNeeded({
      lead,
      nextStatus: LEAD_STATUS.QUALIFIED,
      session,
    });
  }

  lead.followUpStatus = "pending";
  lead.lastContact = new Date();
  lead.nextAction = "Follow up after rejected viewing";

  await saveWithSession(lead, session);

  /* ------------------------------------
     Restore Property Availability
  ------------------------------------ */

  await restorePropertyAvailabilityIfFree({
    organizationId,
    propertyId: viewing.property._id,
    session,
  });

  /* ------------------------------------
     Notify Customer
  ------------------------------------ */

  await createNotification({
    organizationId,
    userId: viewing.requestedBy,
    title: "Viewing Rejected",
    message: `Your viewing request for "${viewing.property.title}" was rejected.`,
    type: "VIEWING_REJECTED",
    viewingId: viewing._id,
    leadId: lead._id,
    propertyId: viewing.property._id,
    session,
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
  session = null,
}) => {
  if (!organizationId) {
    throw new Error(
      "Organization context is required."
    );
  }

  validateViewingTimeRange({
    startTime,
    endTime,
  });

  const viewing = await getViewingForOrganization({
    viewingId,
    organizationId,
    populate: true,
    session,
  });

  /* ------------------------------------
     Validate Current State
  ------------------------------------ */

  if (
    [
      VIEWING_STATUS.REJECTED,
      VIEWING_STATUS.CANCELLED,
      VIEWING_STATUS.COMPLETED,
    ].includes(viewing.status)
  ) {
    throw new Error(
      `Viewing cannot be rescheduled from status "${viewing.status}".`
    );
  }

  if (!viewing.property || !viewing.lead || !viewing.agent) {
    throw new Error(
      "Viewing must have a valid lead, property, and agent."
    );
  }

  /* ------------------------------------
     Check Property Conflict
  ------------------------------------ */

  const propertyConflict = await checkPropertyConflict({
    organizationId,
    propertyId: viewing.property._id,
    viewingDate,
    startTime,
    endTime,
    excludeViewingId: viewing._id,
    session,
  });

  if (propertyConflict) {
    throw new Error(
      "Property already has another viewing during this period."
    );
  }

  /* ------------------------------------
     Check Agent Conflict
  ------------------------------------ */

  const agentConflict = await checkAgentConflict({
    organizationId,
    agentId: viewing.agent._id,
    viewingDate,
    startTime,
    endTime,
    excludeViewingId: viewing._id,
    session,
  });

  if (agentConflict) {
    throw new Error(
      "Agent already has another scheduled viewing during this period."
    );
  }

  /* ------------------------------------
     Preserve Previous Schedule
  ------------------------------------ */

  if (!Array.isArray(viewing.previousSchedules)) {
    viewing.previousSchedules = [];
  }

  viewing.previousSchedules.push({
    viewingDate: viewing.viewingDate,
    startTime: viewing.startTime,
    endTime: viewing.endTime,
    changedAt: new Date(),
  });

  /* ------------------------------------
     Apply New Schedule
  ------------------------------------ */

  viewing.viewingDate = viewingDate;
  viewing.startTime = startTime;
  viewing.endTime = endTime;
  viewing.status = VIEWING_STATUS.RESCHEDULED;

  viewing.rescheduleCount =
    Number(viewing.rescheduleCount || 0) + 1;

  await saveWithSession(viewing, session);

  /* ------------------------------------
     Keep Lead in Viewing Stage
  ------------------------------------ */

  const lead = await getLeadForOrganization({
    leadId: viewing.lead._id,
    organizationId,
    session,
  });

  if (lead.status !== LEAD_STATUS.VIEWING) {
    if (
      canTransitionLeadStatus(
        lead.status,
        LEAD_STATUS.VIEWING
      )
    ) {
      await transitionLeadIfNeeded({
        lead,
        nextStatus: LEAD_STATUS.VIEWING,
        session,
      });
    } else {
      throw new Error(
        `Lead cannot enter viewing stage from lifecycle status "${lead.status}".`
      );
    }
  }

  lead.lastContact = new Date();

  await saveWithSession(lead, session);

  /* ------------------------------------
     Keep Property Booked
  ------------------------------------ */

  let propertyQuery = Property.findOne({
    _id: viewing.property._id,
    organizationId,
  });

  if (session) {
    propertyQuery = propertyQuery.session(session);
  }

  const property = await propertyQuery;

  if (!property) {
    throw new Error("Property not found.");
  }

  property.availability = "viewing_booked";

  await saveWithSession(property, session);

  /* ------------------------------------
     Notify Customer
  ------------------------------------ */

  await createNotification({
    organizationId,
    userId: viewing.requestedBy,
    title: "Viewing Rescheduled",
    message: `Your viewing for "${property.title}" has been rescheduled.`,
    type: "VIEWING_RESCHEDULED",
    viewingId: viewing._id,
    leadId: lead._id,
    propertyId: property._id,
    session,
  });

  return viewing;
};

/* ==========================================================
   CANCEL VIEWING
========================================================== */

export const cancelViewing = async ({
  organizationId,
  viewingId,
  cancelledBy,
  cancellationReason,
  session = null,
}) => {
  if (!organizationId) {
    throw new Error(
      "Organization context is required."
    );
  }

  const viewing = await getViewingForOrganization({
    viewingId,
    organizationId,
    populate: true,
    session,
  });

  /* ------------------------------------
     Validate Current State
  ------------------------------------ */

  if (
    [
      VIEWING_STATUS.CANCELLED,
      VIEWING_STATUS.REJECTED,
      VIEWING_STATUS.COMPLETED,
    ].includes(viewing.status)
  ) {
    throw new Error(
      `Viewing cannot be cancelled from status "${viewing.status}".`
    );
  }

  if (!viewing.property || !viewing.lead) {
    throw new Error(
      "Viewing must have a valid lead and property."
    );
  }

  /* ------------------------------------
     Update Viewing
  ------------------------------------ */

  viewing.status = VIEWING_STATUS.CANCELLED;

  if (cancelledBy) {
    viewing.cancelledBy = cancelledBy;
  }

  if (cancellationReason) {
    viewing.cancellationReason = cancellationReason;
  }

  viewing.cancelledAt = new Date();

  await saveWithSession(viewing, session);

  /* ------------------------------------
     Update Lead Lifecycle and Follow-up
  ------------------------------------ */

  const lead = await getLeadForOrganization({
    leadId: viewing.lead._id,
    organizationId,
    session,
  });

  /*
   * Cancellation must not create a fake Lead.status
   * such as "follow_up".
   */
  if (lead.status === LEAD_STATUS.VIEWING) {
    await transitionLeadIfNeeded({
      lead,
      nextStatus: LEAD_STATUS.QUALIFIED,
      session,
    });
  }

  lead.followUpStatus = "pending";
  lead.lastContact = new Date();
  lead.nextAction = "Follow up after cancelled viewing";

  await saveWithSession(lead, session);

  /* ------------------------------------
     Restore Property Availability
  ------------------------------------ */

  await restorePropertyAvailabilityIfFree({
    organizationId,
    propertyId: viewing.property._id,
    session,
  });

  /* ------------------------------------
     Notify Customer
  ------------------------------------ */

  await createNotification({
    organizationId,
    userId: viewing.requestedBy,
    title: "Viewing Cancelled",
    message: `Your viewing for "${viewing.property.title}" has been cancelled.`,
    type: "VIEWING_CANCELLED",
    viewingId: viewing._id,
    leadId: lead._id,
    propertyId: viewing.property._id,
    session,
  });

  return viewing;
};

/* ==========================================================
   COMPLETE VIEWING
========================================================== */

export const completeViewing = async ({
  organizationId,
  viewingId,
  session = null,
}) => {
  if (!organizationId) {
    throw new Error(
      "Organization context is required."
    );
  }

  const viewing = await getViewingForOrganization({
    viewingId,
    organizationId,
    populate: true,
    session,
  });

  /* ------------------------------------
     Validate Current State
  ------------------------------------ */

  if (viewing.status === VIEWING_STATUS.COMPLETED) {
    throw new Error("Viewing is already completed.");
  }

  if (
    ![
      VIEWING_STATUS.APPROVED,
      VIEWING_STATUS.RESCHEDULED,
    ].includes(viewing.status)
  ) {
    throw new Error(
      `Viewing cannot be completed from status "${viewing.status}".`
    );
  }

  if (!viewing.property || !viewing.lead) {
    throw new Error(
      "Viewing must have a valid lead and property."
    );
  }

  /* ------------------------------------
     Complete Viewing
  ------------------------------------ */

  viewing.status = VIEWING_STATUS.COMPLETED;
  viewing.completedAt = new Date();

  await saveWithSession(viewing, session);

  /* ------------------------------------
     Update Lead Follow-up
  ------------------------------------ */

  const lead = await getLeadForOrganization({
    leadId: viewing.lead._id,
    organizationId,
    session,
  });

  /*
   * Completing a viewing does not automatically move
   * the lead backward to "qualified".
   *
   * The post-viewing outcome determines the next
   * canonical lifecycle transition.
   */
  lead.followUpStatus = "pending";
  lead.lastContact = new Date();
  lead.nextAction = "Contact customer after completed viewing";

  await saveWithSession(lead, session);

  /* ------------------------------------
     Restore Property Availability
  ------------------------------------ */

  const property = await restorePropertyAvailabilityIfFree({
    organizationId,
    propertyId: viewing.property._id,
    session,
  });

  /* ------------------------------------
     Update Property Statistics
  ------------------------------------ */

  if (property) {
    if (!property.viewingStats) {
      property.viewingStats = {};
    }

    property.viewingStats.completedViewings =
      Number(property.viewingStats.completedViewings || 0) + 1;

    await saveWithSession(property, session);
  }

  /* ------------------------------------
     Notify Customer
  ------------------------------------ */

  await createNotification({
    organizationId,
    userId: viewing.requestedBy,
    title: "Viewing Completed",
    message: `Thank you for attending the viewing of "${viewing.property.title}".`,
    type: "VIEWING_REMINDER",
    viewingId: viewing._id,
    leadId: lead._id,
    propertyId: viewing.property._id,
    session,
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
  session = null,
}) => {
  if (!organizationId) {
    throw new Error(
      "Organization context is required."
    );
  }

  /* ------------------------------------
     Load Viewing
  ------------------------------------ */

  const viewing = await getViewingForOrganization({
    viewingId,
    organizationId,
    populate: true,
    session,
  });

  /* ------------------------------------
     Feedback Only After Completion
  ------------------------------------ */

  if (viewing.status !== VIEWING_STATUS.COMPLETED) {
    throw new Error(
      "Viewing must be completed before feedback can be submitted."
    );
  }

  /* ------------------------------------
     Prevent Duplicate Feedback
  ------------------------------------ */

  const existingFeedback =
    viewing.feedback &&
    typeof viewing.feedback.toObject === "function"
      ? viewing.feedback.toObject()
      : viewing.feedback;

  if (
    existingFeedback &&
    Object.keys(existingFeedback).length > 0
  ) {
    throw new Error(
      "Feedback has already been submitted for this viewing."
    );
  }

  /* ------------------------------------
     Validate Rating
  ------------------------------------ */

  let normalizedRating;

  if (
    viewerRating !== undefined &&
    viewerRating !== null
  ) {
    normalizedRating = Number(viewerRating);

    if (
      !Number.isFinite(normalizedRating) ||
      normalizedRating < 1 ||
      normalizedRating > 5
    ) {
      throw new Error(
        "Viewer rating must be between 1 and 5."
      );
    }
  }

  /* ------------------------------------
     Save Feedback
  ------------------------------------ */

  viewing.feedback = {
    viewerRating: normalizedRating,
    viewerComment,
    agentOutcome,
    followUpRequired: Boolean(followUpRequired),
  };

  await saveWithSession(viewing, session);

  /* ------------------------------------
     Update Property Rating
  ------------------------------------ */

  if (normalizedRating !== undefined) {
    let propertyQuery = Property.findOne({
      _id: viewing.property._id,
      organizationId,
    });

    if (session) {
      propertyQuery = propertyQuery.session(session);
    }

    const property = await propertyQuery;

    if (!property) {
      throw new Error("Property not found.");
    }

    if (!property.viewingStats) {
      property.viewingStats = {};
    }

    const stats = property.viewingStats;

    /*
     * Preserve the existing rating calculation:
     *
     * new average =
     * ((old average * (completed count - 1)) + rating)
     * / completed count
     *
     * This assumes the viewing's rating has not already
     * contributed to the stored average.
     */
    const completed = Math.max(
      Number(stats.completedViewings || 0),
      1
    );

    const currentAverage = Number(
      stats.averageRating || 0
    );

    stats.averageRating = Number(
      (
        (
          currentAverage * (completed - 1) +
          normalizedRating
        ) / completed
      ).toFixed(2)
    );

    await saveWithSession(property, session);
  }

  /* ------------------------------------
     Update Lead Follow-up
  ------------------------------------ */

  if (followUpRequired) {
    const lead = await getLeadForOrganization({
      leadId: viewing.lead._id,
      organizationId,
      session,
    });

    lead.followUpStatus = "pending";
    lead.nextAction = "Follow up after viewing";

    await saveWithSession(lead, session);
  }

  /* ------------------------------------
     Notify Assigned Agent
  ------------------------------------ */

  await createNotification({
    organizationId,
    userId: viewing.agent,
    title: "Viewing Feedback Submitted",
    message: `Feedback has been submitted for "${viewing.property.title}".`,
    type: "VIEWING_REMINDER",
    viewingId: viewing._id,
    leadId: viewing.lead._id,
    propertyId: viewing.property._id,
    session,
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
  if (!organizationId) {
    throw new Error(
      "Organization context is required."
    );
  }

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
  if (!organizationId) {
    throw new Error(
      "Organization context is required."
    );
  }

  const query = {
    organizationId,

    viewingDate: {
      $gte: new Date(),
    },

    status: {
      $in: [
        VIEWING_STATUS.APPROVED,
        VIEWING_STATUS.RESCHEDULED,
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
  if (!organizationId) {
    throw new Error(
      "Organization context is required."
    );
  }

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
        VIEWING_STATUS.APPROVED,
        VIEWING_STATUS.RESCHEDULED,
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
  viewingId,
  organizationId
) => {
  if (!organizationId) {
    throw new Error(
      "Organization context is required."
    );
  }

  return Viewing.findOne({
    _id: viewingId,
    organizationId,
  })
    .populate("lead")
    .populate("property")
    .populate("agent")
    .populate(
      "approvedBy",
      "name email"
    );
};

/* ==========================================================
   DEFAULT EXPORT
========================================================== */

export default {
  VIEWING_STATUS,

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