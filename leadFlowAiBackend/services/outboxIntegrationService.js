/**
 * ==========================================================
 *
 * LEADFLOW AI
 * OUTBOX INTEGRATION SERVICE
 *
 * ==========================================================
 *
 * PURPOSE
 * ----------------------------------------------------------
 *
 * Provides the application-level bridge between:
 *
 *   BUSINESS TRANSACTIONS
 *
 * and:
 *
 *   DURABLE OUTBOX EVENTS
 *
 * ==========================================================
 */

import {
  withOutboxTransaction,
  createOutboxEvent,
} from "./outboxService.js";

import {
  createLeadEventPayload,
  createLeadStatusChangedPayload,
  createLeadScoredPayload,
  isValidLeadEvent,
  LEAD_EVENTS,
} from "../events/leadEvents.js";


/* ==========================================================
   EVENT AGGREGATE TYPE
========================================================== */

const LEAD_AGGREGATE =
  "lead";


/* ==========================================================
   NORMALIZE ID
========================================================== */

const normalizeId = (
  value
) => {

  if (
    value === undefined ||
    value === null
  ) {

    return null;
  }


  if (
    typeof value === "object" &&
    value._id
  ) {

    return String(
      value._id
    );
  }


  return String(
    value
  );
};


/* ==========================================================
   REQUIRED ORGANIZATION
========================================================== */

const requireOrganizationId = (
  organizationId
) => {

  if (
    !organizationId
  ) {

    throw new Error(
      "Organization ID is required for a reliable event."
    );
  }


  return organizationId;
};


/* ==========================================================
   REQUIRED EVENT TYPE
========================================================== */

const requireCanonicalEvent =
  (
    eventType
  ) => {

    if (
      !isValidLeadEvent(
        eventType
      )
    ) {

      throw new Error(
        `Unsupported canonical event type: ${eventType}`
      );
    }


    return eventType;
  };


/* ==========================================================
   BUILD LEAD EVENT BASE
========================================================== */

const buildLeadEventBase = ({
  eventType,
  lead,
  organizationId,
  metadata = {},
}) => {

  if (
    !lead
  ) {

    throw new Error(
      `Lead is required for ${eventType}.`
    );
  }


  const leadId =
    normalizeId(
      lead?._id
    );


  if (
    !leadId
  ) {

    throw new Error(
      `Lead ID is required for ${eventType}.`
    );
  }


  const resolvedOrganizationId =
    requireOrganizationId(
      organizationId ||
        lead?.organizationId
    );


  return {

    eventType:
      requireCanonicalEvent(
        eventType
      ),

    aggregateType:
      LEAD_AGGREGATE,

    aggregateId:
      leadId,

    organizationId:
      resolvedOrganizationId,

    leadId,

    metadata,

  };
};


/* ==========================================================
   QUEUE OUTBOX EVENT
========================================================== */

export const addOutboxEvent =
  async ({
    session,

    eventType,

    aggregateType =
      LEAD_AGGREGATE,

    aggregateId,

    organizationId,

    payload = {},

    deduplicationKey,

    maxAttempts,

    occurredAt,

  }) => {

    if (
      !session
    ) {

      throw new Error(
        "MongoDB session is required when adding a reliable outbox event."
      );
    }


    const resolvedEventType =
      requireCanonicalEvent(
        eventType
      );


    const resolvedOrganizationId =
      requireOrganizationId(
        organizationId
      );


    const resolvedAggregateId =
      normalizeId(
        aggregateId
      );


    if (
      !resolvedAggregateId
    ) {

      throw new Error(
        `aggregateId is required for ${resolvedEventType}.`
      );
    }


    return createOutboxEvent({

      eventType:
        resolvedEventType,

      aggregateType,

      aggregateId:
        resolvedAggregateId,

      organizationId:
        resolvedOrganizationId,

      payload,

      deduplicationKey,

      maxAttempts,

      occurredAt,

      session,

    });
  };


/* ==========================================================
   RELIABLE TRANSACTION
========================================================== */

/**
 * Executes business database operations and outbox event
 * creation within the same MongoDB transaction.
 *
 * IMPORTANT:
 * The callback receives the actual MongoDB ClientSession
 * as its first argument.
 *
 * The optional second argument exposes transaction helpers.
 *
 * Correct usage:
 *
 * await withReliableTransaction(async (session) => {
 *   await lead.save({ session });
 *
 *   await addLeadCreatedEvent({
 *     session,
 *     lead,
 *     organizationId,
 *   });
 * });
 *
 * Optional helper usage:
 *
 * await withReliableTransaction(
 *   async (session, { addEvent }) => {
 *     // Perform transactional database operations.
 *   }
 * );
 */
export const withReliableTransaction = async (
  callback,
  options = {}
) => {
  if (typeof callback !== "function") {
    throw new Error(
      "withReliableTransaction requires a callback function."
    );
  }

  return withOutboxTransaction(
    async (session) => {
      const addEvent = async (eventOptions) => {
        return addOutboxEvent({
          ...eventOptions,
          session,
        });
      };

      return callback(session, {
        addEvent,
      });
    },
    options
  );
};


/* ==========================================================
   LEAD CREATED
========================================================== */

/**
 * Durable:
 *
 *   lead.created
 */
export const addLeadCreatedEvent =
  async ({
    session,

    lead,

    organizationId,

    operationId,

    metadata = {},

    deduplicationKey,

  }) => {

    const base =
      buildLeadEventBase({

        eventType:
          LEAD_EVENTS.LEAD_CREATED,

        lead,

        organizationId,

        metadata,

      });


    const payload =
      createLeadEventPayload({

        leadId:
          base.leadId,

        organizationId:
          base.organizationId,

        lead,

        metadata,

      });


    const resolvedDeduplicationKey =
      resolveDeduplicationKey({

        deduplicationKey,

        operationId,

        eventType:
          LEAD_EVENTS.LEAD_CREATED,

        aggregateType:
          LEAD_AGGREGATE,

        aggregateId:
          base.leadId,

      });


    return addOutboxEvent({

      session,

      eventType:
        LEAD_EVENTS.LEAD_CREATED,

      aggregateType:
        LEAD_AGGREGATE,

      aggregateId:
        base.leadId,

      organizationId:
        base.organizationId,

      payload,

      deduplicationKey:
        resolvedDeduplicationKey,

    });
  };


/* ==========================================================
   LEAD STATUS CHANGED
========================================================== */

export const addLeadStatusChangedEvent =
  async ({
    session,

    lead,

    previousStatus,

    organizationId,

    operationId,

    metadata = {},

    deduplicationKey,

  }) => {

    const base =
      buildLeadEventBase({

        eventType:
          LEAD_EVENTS.LEAD_STATUS_CHANGED,

        lead,

        organizationId,

        metadata,

      });


    const payload =
      createLeadStatusChangedPayload({

        lead,

        previousStatus,

        metadata,

      });


    payload.organizationId =
      base.organizationId;


    const resolvedDeduplicationKey =
      resolveDeduplicationKey({

        deduplicationKey,

        operationId,

        eventType:
          LEAD_EVENTS.LEAD_STATUS_CHANGED,

        aggregateType:
          LEAD_AGGREGATE,

        aggregateId:
          base.leadId,

      });


    return addOutboxEvent({

      session,

      eventType:
        LEAD_EVENTS.LEAD_STATUS_CHANGED,

      aggregateType:
        LEAD_AGGREGATE,

      aggregateId:
        base.leadId,

      organizationId:
        base.organizationId,

      payload,

      deduplicationKey:
        resolvedDeduplicationKey,

    });
  };


/* ==========================================================
   LEAD SCORED
========================================================== */

export const addLeadScoredEvent =
  async ({
    session,

    lead,

    previousScore =
      null,

    previousCategory =
      null,

    score,

    category,

    organizationId,

    operationId,

    metadata = {},

    deduplicationKey,

  }) => {

    const base =
      buildLeadEventBase({

        eventType:
          LEAD_EVENTS.LEAD_SCORED,

        lead,

        organizationId,

        metadata,

      });


    const payload =
      createLeadScoredPayload({

        lead,

        previousScore,

        previousCategory,

        score,

        category,

        metadata,

      });


    payload.organizationId =
      base.organizationId;


    const resolvedDeduplicationKey =
      resolveDeduplicationKey({

        deduplicationKey,

        operationId,

        eventType:
          LEAD_EVENTS.LEAD_SCORED,

        aggregateType:
          LEAD_AGGREGATE,

        aggregateId:
          base.leadId,

      });


    return addOutboxEvent({

      session,

      eventType:
        LEAD_EVENTS.LEAD_SCORED,

      aggregateType:
        LEAD_AGGREGATE,

      aggregateId:
        base.leadId,

      organizationId:
        base.organizationId,

      payload,

      deduplicationKey:
        resolvedDeduplicationKey,

    });
  };


/* ==========================================================
   IDEMPOTENCY KEY HELPER
========================================================== */

export const buildOutboxDeduplicationKey = ({
  eventType,

  aggregateType,

  aggregateId,

  operationId,

}) => {

  const normalizedEventType =
    requireCanonicalEvent(
      eventType
    );


  const normalizedAggregateType =
    normalizeId(
      aggregateType
    );


  const normalizedAggregateId =
    normalizeId(
      aggregateId
    );


  const normalizedOperationId =
    normalizeId(
      operationId
    );


  if (
    !normalizedAggregateType
  ) {

    throw new Error(
      "aggregateType is required to build an outbox deduplication key."
    );
  }


  if (
    !normalizedAggregateId
  ) {

    throw new Error(
      "aggregateId is required to build an outbox deduplication key."
    );
  }


  if (
    !normalizedOperationId
  ) {

    throw new Error(
      "operationId is required to build an outbox deduplication key."
    );
  }


  return [

    normalizedEventType,

    normalizedAggregateType,

    normalizedAggregateId,

    normalizedOperationId,

  ].join(":");
};


/* ==========================================================
   RESOLVE DEDUPLICATION KEY
========================================================== */

const resolveDeduplicationKey = ({
  deduplicationKey,

  operationId,

  eventType,

  aggregateType,

  aggregateId,

}) => {

  if (
    deduplicationKey
  ) {

    return String(
      deduplicationKey
    ).trim();
  }


  if (
    operationId
  ) {

    return buildOutboxDeduplicationKey({

      eventType,

      aggregateType,

      aggregateId,

      operationId,

    });
  }


  return undefined;
};


/* ==========================================================
   LEAD ASSIGNED
========================================================== */

export const addLeadAssignedEvent =
  async ({
    session,

    lead,

    agentId,

    previousAgentId =
      null,

    organizationId,

    operationId,

    metadata = {},

    deduplicationKey,

  }) => {

    const base =
      buildLeadEventBase({

        eventType:
          LEAD_EVENTS.LEAD_ASSIGNED,

        lead,

        organizationId,

        metadata,

      });


    const resolvedAgentId =
      normalizeId(
        agentId ||
          lead?.assignedTo
      );


    if (
      !resolvedAgentId
    ) {

      throw new Error(
        "agentId is required for lead.assigned."
      );
    }


    const resolvedPreviousAgentId =
      normalizeId(
        previousAgentId
      );


    const payload = {

      leadId:
        base.leadId,

      organizationId:
        base.organizationId,

      agentId:
        resolvedAgentId,

      previousAgentId:
        resolvedPreviousAgentId,

      assignedTo:
        resolvedAgentId,

      lead,

      metadata,

      occurredAt:
        new Date(),

    };


    const resolvedDeduplicationKey =
      resolveDeduplicationKey({

        deduplicationKey,

        operationId,

        eventType:
          LEAD_EVENTS.LEAD_ASSIGNED,

        aggregateType:
          LEAD_AGGREGATE,

        aggregateId:
          base.leadId,

      });


    return addOutboxEvent({

      session,

      eventType:
        LEAD_EVENTS.LEAD_ASSIGNED,

      aggregateType:
        LEAD_AGGREGATE,

      aggregateId:
        base.leadId,

      organizationId:
        base.organizationId,

      payload,

      deduplicationKey:
        resolvedDeduplicationKey,

    });
  };


/* ==========================================================
   LEAD UNASSIGNED
========================================================== */

export const addLeadUnassignedEvent =
  async ({
    session,

    lead,

    previousAgentId,

    organizationId,

    operationId,

    metadata = {},

    deduplicationKey,

  }) => {

    const base =
      buildLeadEventBase({

        eventType:
          LEAD_EVENTS.LEAD_UNASSIGNED,

        lead,

        organizationId,

        metadata,

      });


    const resolvedPreviousAgentId =
      normalizeId(
        previousAgentId
      );


    if (
      !resolvedPreviousAgentId
    ) {

      throw new Error(
        "previousAgentId is required for lead.unassigned."
      );
    }


    const payload = {

      leadId:
        base.leadId,

      organizationId:
        base.organizationId,

      previousAgentId:
        resolvedPreviousAgentId,

      assignedTo:
        null,

      lead,

      metadata,

      occurredAt:
        new Date(),

    };


    const resolvedDeduplicationKey =
      resolveDeduplicationKey({

        deduplicationKey,

        operationId,

        eventType:
          LEAD_EVENTS.LEAD_UNASSIGNED,

        aggregateType:
          LEAD_AGGREGATE,

        aggregateId:
          base.leadId,

      });


    return addOutboxEvent({

      session,

      eventType:
        LEAD_EVENTS.LEAD_UNASSIGNED,

      aggregateType:
        LEAD_AGGREGATE,

      aggregateId:
        base.leadId,

      organizationId:
        base.organizationId,

      payload,

      deduplicationKey:
        resolvedDeduplicationKey,

    });
  };


/* ==========================================================
   VIEWING EVENT BASE
========================================================== */

const buildViewingEventBase = ({
  eventType,

  viewing,

  lead =
    null,

  organizationId,

  metadata =
    {},

}) => {

  const normalizedViewingId =
    normalizeId(
      viewing?._id ||
        viewing?.id
    );


  if (
    !normalizedViewingId
  ) {

    throw new Error(
      `Viewing ID is required for ${eventType}.`
    );
  }


  const resolvedOrganizationId =
    requireOrganizationId(

      organizationId ||

      viewing?.organizationId ||

      lead?.organizationId

    );


  const leadId =
    normalizeId(

      lead?._id ||

      lead?.id ||

      viewing?.lead

    );


  return {

    eventType:
      requireCanonicalEvent(
        eventType
      ),

    aggregateType:
      "viewing",

    aggregateId:
      normalizedViewingId,

    organizationId:
      resolvedOrganizationId,

    viewingId:
      normalizedViewingId,

    leadId,

    metadata,

  };
};


/* ==========================================================
   VIEWING REQUESTED
========================================================== */

export const addViewingRequestedEvent =
  async ({
    session,

    viewing,

    lead =
      null,

    property =
      null,

    organizationId,

    operationId,

    metadata =
      {},

    deduplicationKey,

  }) => {

    const base =
      buildViewingEventBase({

        eventType:
          LEAD_EVENTS.LEAD_VIEWING_REQUESTED,

        viewing,

        lead,

        organizationId,

        metadata,

      });


    const payload = {

      viewingId:
        base.viewingId,

      leadId:
        base.leadId,

      organizationId:
        base.organizationId,

      viewing,

      lead,

      property,

      viewingStatus:
        viewing?.status ||
        "Requested",

      viewingDate:
        viewing?.viewingDate ||
        null,

      startTime:
        viewing?.startTime ||
        null,

      endTime:
        viewing?.endTime ||
        null,

      metadata,

      occurredAt:
        new Date(),

    };


    const resolvedDeduplicationKey =
      resolveDeduplicationKey({

        deduplicationKey,

        operationId,

        eventType:
          LEAD_EVENTS.LEAD_VIEWING_REQUESTED,

        aggregateType:
          "viewing",

        aggregateId:
          base.viewingId,

      });


    return addOutboxEvent({

      session,

      eventType:
        LEAD_EVENTS.LEAD_VIEWING_REQUESTED,

      aggregateType:
        "viewing",

      aggregateId:
        base.viewingId,

      organizationId:
        base.organizationId,

      payload,

      deduplicationKey:
        resolvedDeduplicationKey,

    });
  };


/* ==========================================================
   VIEWING CONFIRMED
========================================================== */

export const addViewingConfirmedEvent =
  async ({
    session,

    viewing,

    lead =
      null,

    property =
      null,

    previousStatus =
      null,

    organizationId,

    operationId,

    metadata =
      {},

    deduplicationKey,

  }) => {

    const base =
      buildViewingEventBase({

        eventType:
          LEAD_EVENTS.LEAD_VIEWING_CONFIRMED,

        viewing,

        lead,

        organizationId,

        metadata,

      });


    const payload = {

      viewingId:
        base.viewingId,

      leadId:
        base.leadId,

      organizationId:
        base.organizationId,

      previousStatus,

      status:
        viewing?.status ||
        "Approved",

      viewing,

      lead,

      property,

      viewingDate:
        viewing?.viewingDate ||
        null,

      startTime:
        viewing?.startTime ||
        null,

      endTime:
        viewing?.endTime ||
        null,

      approvedBy:
        normalizeId(
          viewing?.approvedBy
        ),

      approvedAt:
        viewing?.approvedAt ||
        null,

      metadata,

      occurredAt:
        new Date(),

    };


    const resolvedDeduplicationKey =
      resolveDeduplicationKey({

        deduplicationKey,

        operationId,

        eventType:
          LEAD_EVENTS.LEAD_VIEWING_CONFIRMED,

        aggregateType:
          "viewing",

        aggregateId:
          base.viewingId,

      });


    return addOutboxEvent({

      session,

      eventType:
        LEAD_EVENTS.LEAD_VIEWING_CONFIRMED,

      aggregateType:
        "viewing",

      aggregateId:
        base.viewingId,

      organizationId:
        base.organizationId,

      payload,

      deduplicationKey:
        resolvedDeduplicationKey,

    });
  };


/* ==========================================================
   VIEWING COMPLETED
========================================================== */

export const addViewingCompletedEvent =
  async ({
    session,

    viewing,

    lead =
      null,

    property =
      null,

    organizationId,

    operationId,

    metadata =
      {},

    deduplicationKey,

  }) => {

    const base =
      buildViewingEventBase({

        eventType:
          LEAD_EVENTS.LEAD_VIEWING_COMPLETED,

        viewing,

        lead,

        organizationId,

        metadata,

      });


    const payload = {

      viewingId:
        base.viewingId,

      leadId:
        base.leadId,

      organizationId:
        base.organizationId,

      status:
        viewing?.status ||
        "Completed",

      viewing,

      lead,

      property,

      completedAt:
        viewing?.completedAt ||
        null,

      metadata,

      occurredAt:
        new Date(),

    };


    const resolvedDeduplicationKey =
      resolveDeduplicationKey({

        deduplicationKey,

        operationId,

        eventType:
          LEAD_EVENTS.LEAD_VIEWING_COMPLETED,

        aggregateType:
          "viewing",

        aggregateId:
          base.viewingId,

      });


    return addOutboxEvent({

      session,

      eventType:
        LEAD_EVENTS.LEAD_VIEWING_COMPLETED,

      aggregateType:
        "viewing",

      aggregateId:
        base.viewingId,

      organizationId:
        base.organizationId,

      payload,

      deduplicationKey:
        resolvedDeduplicationKey,

    });
  };


/* ==========================================================
   VIEWING CANCELLED
========================================================== */

export const addViewingCancelledEvent =
  async ({
    session,

    viewing,

    lead =
      null,

    property =
      null,

    previousStatus =
      null,

    organizationId,

    operationId,

    metadata =
      {},

    deduplicationKey,

  }) => {

    const base =
      buildViewingEventBase({

        eventType:
          LEAD_EVENTS.LEAD_VIEWING_CANCELLED,

        viewing,

        lead,

        organizationId,

        metadata,

      });


    const payload = {

      viewingId:
        base.viewingId,

      leadId:
        base.leadId,

      organizationId:
        base.organizationId,

      previousStatus,

      status:
        viewing?.status ||
        "Cancelled",

      viewing,

      lead,

      property,

      cancellationReason:
        viewing?.cancellationReason ||
        null,

      cancelledBy:
        normalizeId(
          viewing?.cancelledBy
        ),

      cancelledAt:
        viewing?.cancelledAt ||
        null,

      metadata,

      occurredAt:
        new Date(),

    };


    const resolvedDeduplicationKey =
      resolveDeduplicationKey({

        deduplicationKey,

        operationId,

        eventType:
          LEAD_EVENTS.LEAD_VIEWING_CANCELLED,

        aggregateType:
          "viewing",

        aggregateId:
          base.viewingId,

      });


    return addOutboxEvent({

      session,

      eventType:
        LEAD_EVENTS.LEAD_VIEWING_CANCELLED,

      aggregateType:
        "viewing",

      aggregateId:
        base.viewingId,

      organizationId:
        base.organizationId,

      payload,

      deduplicationKey:
        resolvedDeduplicationKey,

    });
  };


/* ==========================================================
   LEAD WON
========================================================== */

export const addLeadWonEvent =
  async ({
    session,

    lead,

    previousStatus =
      null,

    organizationId,

    operationId,

    metadata =
      {},

    deduplicationKey,

  }) => {

    const base =
      buildLeadEventBase({

        eventType:
          LEAD_EVENTS.LEAD_WON,

        lead,

        organizationId,

        metadata,

      });


    const payload = {

      leadId:
        base.leadId,

      organizationId:
        base.organizationId,

      previousStatus,

      status:
        lead?.status ||
        "won",

      lead,

      metadata,

      occurredAt:
        new Date(),

    };


    const resolvedDeduplicationKey =
      resolveDeduplicationKey({

        deduplicationKey,

        operationId,

        eventType:
          LEAD_EVENTS.LEAD_WON,

        aggregateType:
          LEAD_AGGREGATE,

        aggregateId:
          base.leadId,

      });


    return addOutboxEvent({

      session,

      eventType:
        LEAD_EVENTS.LEAD_WON,

      aggregateType:
        LEAD_AGGREGATE,

      aggregateId:
        base.leadId,

      organizationId:
        base.organizationId,

      payload,

      deduplicationKey:
        resolvedDeduplicationKey,

    });
  };


/* ==========================================================
   LEAD LOST
========================================================== */

export const addLeadLostEvent =
  async ({
    session,

    lead,

    previousStatus =
      null,

    organizationId,

    operationId,

    metadata =
      {},

    deduplicationKey,

  }) => {

    const base =
      buildLeadEventBase({

        eventType:
          LEAD_EVENTS.LEAD_LOST,

        lead,

        organizationId,

        metadata,

      });


    const payload = {

      leadId:
        base.leadId,

      organizationId:
        base.organizationId,

      previousStatus,

      status:
        lead?.status ||
        "lost",

      lead,

      metadata,

      occurredAt:
        new Date(),

    };


    const resolvedDeduplicationKey =
      resolveDeduplicationKey({

        deduplicationKey,

        operationId,

        eventType:
          LEAD_EVENTS.LEAD_LOST,

        aggregateType:
          LEAD_AGGREGATE,

        aggregateId:
          base.leadId,

      });


    return addOutboxEvent({

      session,

      eventType:
        LEAD_EVENTS.LEAD_LOST,

      aggregateType:
        LEAD_AGGREGATE,

      aggregateId:
        base.leadId,

      organizationId:
        base.organizationId,

      payload,

      deduplicationKey:
        resolvedDeduplicationKey,

    });
  };


/* ==========================================================
   CRITICAL EVENT MAP
========================================================== */

export const RELIABLE_CRITICAL_EVENTS = Object.freeze([
  LEAD_EVENTS.LEAD_CREATED,
  LEAD_EVENTS.LEAD_STATUS_CHANGED,
  LEAD_EVENTS.LEAD_SCORED,
  LEAD_EVENTS.LEAD_ASSIGNED,

  LEAD_EVENTS.LEAD_VIEWING_REQUESTED,
  LEAD_EVENTS.LEAD_VIEWING_CONFIRMED,
  LEAD_EVENTS.LEAD_VIEWING_COMPLETED,
  LEAD_EVENTS.LEAD_VIEWING_CANCELLED,

  LEAD_EVENTS.LEAD_WON,
  LEAD_EVENTS.LEAD_LOST,
]);


/* ==========================================================
   CHECK CRITICAL EVENT
========================================================== */

export const isReliableCriticalEvent =
  (
    eventType
  ) => {

    return RELIABLE_CRITICAL_EVENTS.includes(
      eventType
    );
  };


/* ==========================================================
   DEFAULT EXPORT
========================================================== */

export default {

  withReliableTransaction,

  addOutboxEvent,

  addLeadCreatedEvent,

  addLeadStatusChangedEvent,

  addLeadScoredEvent,

  addLeadAssignedEvent,

  addLeadUnassignedEvent,

  addViewingRequestedEvent,

  addViewingConfirmedEvent,

  addViewingCompletedEvent,

  addViewingCancelledEvent,

  addLeadWonEvent,

  addLeadLostEvent,

  buildOutboxDeduplicationKey,

  isReliableCriticalEvent,

  RELIABLE_CRITICAL_EVENTS,

};