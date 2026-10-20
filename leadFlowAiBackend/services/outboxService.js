/**
 * ==========================================================
 *
 * LEADFLOW AI
 * OUTBOX SERVICE
 *
 * ==========================================================
 *
 * PURPOSE
 * ----------------------------------------------------------
 *
 * Central service for durable business-event persistence.
 *
 * ==========================================================
 */

import crypto from "crypto";

import mongoose from "mongoose";

import OutboxEvent, {
  OUTBOX_STATUS,
  AGGREGATE_TYPES,
} from "../models/outboxEvent.js";

import {
  isValidLeadEvent,
} from "../events/leadEvents.js";

/* ==========================================================
   DEFAULTS
========================================================== */

const DEFAULT_MAX_ATTEMPTS =
  10;

/* ==========================================================
   REQUIRED VALUE
========================================================== */

const requireValue = (
  value,
  fieldName
) => {
  if (
    value === undefined ||
    value === null ||
    String(value).trim() === ""
  ) {
    throw new Error(
      `${fieldName} is required.`
    );
  }

  return value;
};

/* ==========================================================
   NORMALIZE STRING
========================================================== */

const normalizeString = (
  value
) => {
  if (
    value === undefined ||
    value === null
  ) {
    return null;
  }

  const normalized =
    String(value).trim();

  return normalized || null;
};

/* ==========================================================
   NORMALIZE OBJECT ID
========================================================== */

const normalizeObjectId = (
  value,
  fieldName
) => {
  requireValue(
    value,
    fieldName
  );

  if (
    !mongoose.Types.ObjectId.isValid(
      value
    )
  ) {
    throw new Error(
      `${fieldName} must be a valid MongoDB ObjectId.`
    );
  }

  return new mongoose.Types.ObjectId(
    value
  );
};

/* ==========================================================
   NORMALIZE AGGREGATE TYPE
========================================================== */

const normalizeAggregateType = (
  aggregateType
) => {
  const normalized =
    normalizeString(
      aggregateType
    );

  if (
    !normalized
  ) {
    throw new Error(
      "aggregateType is required."
    );
  }

  if (
    !AGGREGATE_TYPES.includes(
      normalized
    )
  ) {
    throw new Error(
      `Invalid aggregateType "${normalized}".`
    );
  }

  return normalized;
};

/* ==========================================================
   VALIDATE EVENT TYPE
========================================================== */

const validateEventType = (
  eventType
) => {
  const normalized =
    normalizeString(
      eventType
    );

  if (
    !normalized
  ) {
    throw new Error(
      "eventType is required."
    );
  }

  if (
    !isValidLeadEvent(
      normalized
    )
  ) {
    throw new Error(
      `Unsupported canonical event type: "${normalized}".`
    );
  }

  return normalized;
};

/* ==========================================================
   VALIDATE SESSION
========================================================== */

const validateSession = (
  session
) => {
  if (
    session === undefined ||
    session === null
  ) {
    return null;
  }

  if (
    typeof session !== "object" ||
    typeof session.withTransaction !==
      "function"
  ) {
    throw new Error(
      "Invalid MongoDB session supplied to outbox service."
    );
  }

  return session;
};

/* ==========================================================
   CREATE EVENT ID
========================================================== */

const createEventId = () => {
  return crypto.randomUUID();
};

/* ==========================================================
   NORMALIZE MAX ATTEMPTS
========================================================== */

const normalizeMaxAttempts = (
  maxAttempts
) => {
  const value =
    Number(
      maxAttempts ??
        DEFAULT_MAX_ATTEMPTS
    );

  if (
    !Number.isFinite(
      value
    ) ||
    value < 1
  ) {
    throw new Error(
      "maxAttempts must be a positive number."
    );
  }

  return Math.floor(
    value
  );
};

/* ==========================================================
   NORMALIZE OCCURRED AT
========================================================== */

const normalizeOccurredAt = (
  occurredAt
) => {
  if (
    occurredAt === undefined ||
    occurredAt === null
  ) {
    return new Date();
  }

  const date =
    occurredAt instanceof Date
      ? occurredAt
      : new Date(
          occurredAt
        );

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    throw new Error(
      "occurredAt must be a valid date."
    );
  }

  return date;
};

/* ==========================================================
   CLONE PAYLOAD SAFELY
========================================================== */

const normalizePayload = (
  payload
) => {
  if (
    payload === undefined ||
    payload === null
  ) {
    return {};
  }

  if (
    typeof payload !== "object"
  ) {
    throw new Error(
      "Outbox event payload must be an object."
    );
  }

  if (
    typeof payload.toObject ===
      "function"
  ) {
    return payload.toObject();
  }

  if (
    typeof payload.toJSON ===
      "function"
  ) {
    return payload.toJSON();
  }

  return {
    ...payload,
  };
};

/* ==========================================================
   BUILD EVENT DOCUMENT
========================================================== */

const buildOutboxEventData = ({
  eventId,

  eventType,

  aggregateType,

  aggregateId,

  organizationId,

  payload,

  deduplicationKey,

  maxAttempts,

  occurredAt,
}) => {
  const normalizedEventId =
    normalizeString(
      eventId
    ) ||
    createEventId();

  const normalizedEventType =
    validateEventType(
      eventType
    );

  const normalizedAggregateType =
    normalizeAggregateType(
      aggregateType
    );

  const normalizedAggregateId =
    normalizeString(
      aggregateId
    );

  if (
    !normalizedAggregateId
  ) {
    throw new Error(
      "aggregateId is required."
    );
  }

  const normalizedOrganizationId =
    normalizeObjectId(
      organizationId,
      "organizationId"
    );

  const normalizedPayload =
    normalizePayload(
      payload
    );

  const normalizedDeduplicationKey =
    normalizeString(
      deduplicationKey
    );

  const normalizedMaxAttempts =
    normalizeMaxAttempts(
      maxAttempts
    );

  const normalizedOccurredAt =
    normalizeOccurredAt(
      occurredAt
    );

  const eventData = {
    eventId:
      normalizedEventId,

    eventType:
      normalizedEventType,

    aggregateType:
      normalizedAggregateType,

    aggregateId:
      normalizedAggregateId,

    organizationId:
      normalizedOrganizationId,

    payload:
      normalizedPayload,

    status:
      OUTBOX_STATUS.PENDING,

    attempts:
      0,

    maxAttempts:
      normalizedMaxAttempts,

    nextAttemptAt:
      normalizedOccurredAt,

    occurredAt:
      normalizedOccurredAt,
  };

  /**
   * IMPORTANT
   * --------------------------------------------------------
   *
   * Never explicitly store:
   *
   *   deduplicationKey: null
   *
   * when no key exists.
   *
   * Leaving the field absent allows the sparse unique index
   * to ignore the event.
   */
  if (
    normalizedDeduplicationKey
  ) {
    eventData.deduplicationKey =
      normalizedDeduplicationKey;
  }

  return eventData;
};

/* ==========================================================
   CREATE OUTBOX EVENT
========================================================== */

export const createOutboxEvent =
  async ({
    eventId,

    eventType,

    aggregateType,

    aggregateId,

    organizationId,

    payload,

    deduplicationKey,

    maxAttempts =
      DEFAULT_MAX_ATTEMPTS,

    occurredAt,

    session,
  }) => {
    const normalizedSession =
      validateSession(
        session
      );

    const eventData =
      buildOutboxEventData({
        eventId,

        eventType,

        aggregateType,

        aggregateId,

        organizationId,

        payload,

        deduplicationKey,

        maxAttempts,

        occurredAt,
      });

    try {
      const documents =
        await OutboxEvent.create(
          [
            eventData,
          ],

          normalizedSession
            ? {
                session:
                  normalizedSession,
              }
            : undefined
        );

      return documents[0];
    } catch (error) {
      console.error(
        "❌ OUTBOX EVENT CREATION FAILED:",
        {
          code:
            error?.code,

          message:
            error?.message,

          keyPattern:
            error?.keyPattern,

          keyValue:
            error?.keyValue,

          eventId:
            eventData?.eventId,

          eventType:
            eventData?.eventType,

          aggregateId:
            eventData?.aggregateId,

          deduplicationKey:
            eventData?.deduplicationKey,
        }
      );

      /**
       * IMPORTANT TRANSACTION RULE
       * ------------------------------------------------------
       *
       * When a unique-key violation happens inside a MongoDB
       * transaction, the transaction is already aborted.
       *
       * Therefore we MUST NOT perform another query using
       * the same session here.
       *
       * Doing this:
       *
       *   catch duplicate
       *        ↓
       *   findOne().session(session)
       *
       * causes:
       *
       *   Transaction ... has been aborted
       *
       * to hide the original error.
       *
       * For transactional callers, let the original error
       * escape so withTransaction() can abort cleanly.
       */

      if (
        error?.code === 11000 &&
        normalizedSession
      ) {
        throw error;
      }

      /**
       * Non-transactional compatibility path.
       *
       * There is no aborted transaction here, so checking for
       * an existing event is safe.
       */
      if (
        error?.code === 11000 &&
        (
          eventData.deduplicationKey ||
          eventData.eventId
        )
      ) {
        const duplicateQuery =
          eventData.deduplicationKey
            ? {
                organizationId:
                  eventData.organizationId,

                deduplicationKey:
                  eventData.deduplicationKey,
              }
            : {
                eventId:
                  eventData.eventId,
              };

        const existingEvent =
          await OutboxEvent.findOne(
            duplicateQuery
          );

        if (
          existingEvent
        ) {
          return existingEvent;
        }
      }

      throw error;
    }
  };

/* ==========================================================
   CREATE MANY OUTBOX EVENTS
========================================================== */

export const createOutboxEvents =
  async ({
    events,

    session,
  }) => {
    const normalizedSession =
      validateSession(
        session
      );

    if (
      !Array.isArray(
        events
      ) ||
      events.length === 0
    ) {
      throw new Error(
        "events must be a non-empty array."
      );
    }

    const eventDocuments =
      events.map(
        (event) =>
          buildOutboxEventData(
            event
          )
      );

    return OutboxEvent.insertMany(
      eventDocuments,

      normalizedSession
        ? {
            session:
              normalizedSession,

            ordered:
              true,
          }
        : {
            ordered:
              true,
          }
    );
  };

/* ==========================================================
   GET OUTBOX EVENT
========================================================== */

export const getOutboxEvent =
  async ({
    eventId,

    organizationId,

    session,
  }) => {
    const normalizedOrganizationId =
      normalizeObjectId(
        organizationId,
        "organizationId"
      );

    const query = {
      eventId,

      organizationId:
        normalizedOrganizationId,
    };

    const request =
      OutboxEvent.findOne(
        query
      );

    const normalizedSession =
      validateSession(
        session
      );

    if (
      normalizedSession
    ) {
      request.session(
        normalizedSession
      );
    }

    return request;
  };

/* ==========================================================
   GET OUTBOX EVENT BY DEDUPLICATION KEY
========================================================== */

export const getOutboxEventByDeduplicationKey =
  async ({
    deduplicationKey,

    organizationId,

    session,
  }) => {
    const normalizedKey =
      normalizeString(
        deduplicationKey
      );

    if (
      !normalizedKey
    ) {
      throw new Error(
        "deduplicationKey is required."
      );
    }

    const normalizedOrganizationId =
      normalizeObjectId(
        organizationId,
        "organizationId"
      );

    const request =
      OutboxEvent.findOne({
        organizationId:
          normalizedOrganizationId,

        deduplicationKey:
          normalizedKey,
      });

    const normalizedSession =
      validateSession(
        session
      );

    if (
      normalizedSession
    ) {
      request.session(
        normalizedSession
      );
    }

    return request;
  };

/* ==========================================================
   COUNT PENDING EVENTS
========================================================== */

export const countPendingOutboxEvents =
  async ({
    organizationId,
  } = {}) => {
    const query = {
      status: {
        $in: [
          OUTBOX_STATUS.PENDING,
          OUTBOX_STATUS.FAILED,
        ],
      },

      nextAttemptAt: {
        $lte:
          new Date(),
      },
    };

    if (
      organizationId
    ) {
      query.organizationId =
        normalizeObjectId(
          organizationId,
          "organizationId"
        );
    }

    return OutboxEvent.countDocuments(
      query
    );
  };

/* ==========================================================
   WORKER LEASE DEFAULTS
========================================================== */

const DEFAULT_LEASE_DURATION_MS =
  60 * 1000;

const DEFAULT_RETRY_BASE_DELAY_MS =
  2 * 1000;

const DEFAULT_RETRY_MAX_DELAY_MS =
  5 * 60 * 1000;

const DEFAULT_RETRY_JITTER_MS =
  1000;

/* ==========================================================
   CALCULATE RETRY DELAY
========================================================== */

export const calculateRetryDelay = ({
  attempt,

  baseDelayMs =
    DEFAULT_RETRY_BASE_DELAY_MS,

  maxDelayMs =
    DEFAULT_RETRY_MAX_DELAY_MS,

  jitterMs =
    DEFAULT_RETRY_JITTER_MS,
}) => {
  const normalizedAttempt =
    Math.max(
      1,
      Number(
        attempt
      ) || 1
    );

  const normalizedBase =
    Math.max(
      1,
      Number(
        baseDelayMs
      ) ||
        DEFAULT_RETRY_BASE_DELAY_MS
    );

  const normalizedMax =
    Math.max(
      normalizedBase,

      Number(
        maxDelayMs
      ) ||
        DEFAULT_RETRY_MAX_DELAY_MS
    );

  const normalizedJitter =
    Math.max(
      0,

      Number(
        jitterMs
      ) ||
        DEFAULT_RETRY_JITTER_MS
    );

  const exponentialDelay =
    normalizedBase *
    Math.pow(
      2,
      normalizedAttempt -
        1
    );

  const boundedDelay =
    Math.min(
      exponentialDelay,

      normalizedMax
    );

  const jitter =
    normalizedJitter > 0
      ? Math.floor(
          Math.random() *
            (
              normalizedJitter +
              1
            )
        )
      : 0;

  return (
    boundedDelay +
    jitter
  );
};

/* ==========================================================
   CLAIM NEXT OUTBOX EVENT
========================================================== */

export const claimNextOutboxEvent =
  async ({
    workerName =
      "outbox-worker",

    leaseDurationMs =
      DEFAULT_LEASE_DURATION_MS,
  } = {}) => {
    const normalizedWorkerName =
      normalizeString(
        workerName
      ) ||
      "outbox-worker";

    const normalizedLease =
      Math.max(
        1000,

        Number(
          leaseDurationMs
        ) ||
          DEFAULT_LEASE_DURATION_MS
      );

    const now =
      new Date();

    const lockExpiresAt =
      new Date(
        now.getTime() +
          normalizedLease
      );

    const lockToken =
      createEventId();

    const claimFilter = {
      $or: [
        {
          status:
            OUTBOX_STATUS.PENDING,

          nextAttemptAt: {
            $lte:
              now,
          },
        },

        {
          status:
            OUTBOX_STATUS.FAILED,

          nextAttemptAt: {
            $lte:
              now,
          },
        },

        {
          status:
            OUTBOX_STATUS.PROCESSING,

          lockExpiresAt: {
            $lte:
              now,
          },
        },
      ],

      $expr: {
        $lt: [
          "$attempts",
          "$maxAttempts",
        ],
      },
    };

    const update = {
      $set: {
        status:
          OUTBOX_STATUS.PROCESSING,

        lockedAt:
          now,

        lockExpiresAt,

        lockToken,

        workerName:
          normalizedWorkerName,

        nextAttemptAt:
          now,
      },

      $inc: {
        attempts:
          1,
      },
    };

    return OutboxEvent.findOneAndUpdate(
      claimFilter,

      update,

      {
        returnDocument: "after",

        sort: {
          nextAttemptAt:
            1,

          createdAt:
            1,
        },
      }
    );
  };

/* ==========================================================
   CLAIM SPECIFIC EVENT
========================================================== */

export const claimOutboxEvent =
  async ({
    eventId,

    organizationId,

    workerName =
      "outbox-worker",

    leaseDurationMs =
      DEFAULT_LEASE_DURATION_MS,
  }) => {
    const normalizedEventId =
      requireValue(
        eventId,
        "eventId"
      );

    const normalizedWorkerName =
      normalizeString(
        workerName
      ) ||
      "outbox-worker";

    const normalizedLease =
      Math.max(
        1000,

        Number(
          leaseDurationMs
        ) ||
          DEFAULT_LEASE_DURATION_MS
      );

    const now =
      new Date();

    const lockExpiresAt =
      new Date(
        now.getTime() +
          normalizedLease
      );

    const lockToken =
      createEventId();

    const query = {
      eventId:
        normalizedEventId,

      $or: [
        {
          status:
            OUTBOX_STATUS.PENDING,
        },

        {
          status:
            OUTBOX_STATUS.FAILED,

          nextAttemptAt: {
            $lte:
              now,
          },
        },

        {
          status:
            OUTBOX_STATUS.PROCESSING,

          lockExpiresAt: {
            $lte:
              now,
          },
        },
      ],

      $expr: {
        $lt: [
          "$attempts",
          "$maxAttempts",
        ],
      },
    };

    if (
      organizationId
    ) {
      query.organizationId =
        normalizeObjectId(
          organizationId,
          "organizationId"
        );
    }

    return OutboxEvent.findOneAndUpdate(
      query,

      {
        $set: {
          status:
            OUTBOX_STATUS.PROCESSING,

          lockedAt:
            now,

          lockExpiresAt,

          lockToken,

          workerName:
            normalizedWorkerName,

          nextAttemptAt:
            now,
        },

        $inc: {
          attempts:
            1,
        },
      },

      {
        returnDocument: "after",
          
      }
    );
  };

/* ==========================================================
   HEARTBEAT OUTBOX EVENT
========================================================== */

export const heartbeatOutboxEvent =
  async ({
    eventId,

    lockToken,

    leaseDurationMs =
      DEFAULT_LEASE_DURATION_MS,
  }) => {
    const normalizedEventId =
      requireValue(
        eventId,
        "eventId"
      );

    const normalizedLockToken =
      requireValue(
        lockToken,
        "lockToken"
      );

    const normalizedLease =
      Math.max(
        1000,

        Number(
          leaseDurationMs
        ) ||
          DEFAULT_LEASE_DURATION_MS
      );

    const now =
      new Date();

    const newExpiry =
      new Date(
        now.getTime() +
          normalizedLease
      );

    return OutboxEvent.findOneAndUpdate(
      {
        eventId:
          normalizedEventId,

        status:
          OUTBOX_STATUS.PROCESSING,

        lockToken:
          normalizedLockToken,
      },

      {
        $set: {
          lockExpiresAt:
            newExpiry,
        },
      },

      { returnDocument: "after" }
    );
  };

/* ==========================================================
   MARK EVENT PUBLISHED
========================================================== */

export const markOutboxEventPublished =
  async ({
    eventId,

    lockToken,
  }) => {
    const normalizedEventId =
      requireValue(
        eventId,
        "eventId"
      );

    const normalizedLockToken =
      requireValue(
        lockToken,
        "lockToken"
      );

    const publishedAt =
      new Date();

    const event =
      await OutboxEvent.findOneAndUpdate(
        {
          eventId:
            normalizedEventId,

          status:
            OUTBOX_STATUS.PROCESSING,

          lockToken:
            normalizedLockToken,
        },

        {
          $set: {
            status:
              OUTBOX_STATUS.PUBLISHED,

            publishedAt,

            lastError:
              null,

            lastErrorAt:
              null,

            deadAt:
              null,

            deadReason:
              null,
          },

          $unset: {
            lockedAt:
              "",

            lockExpiresAt:
              "",

            lockToken:
              "",

            workerName:
              "",
          },
        },

        {
          new:
            true,
        }
      );

    if (
      !event
    ) {
      throw new Error(
        `Unable to mark outbox event "${normalizedEventId}" as published. Worker lock may have expired or ownership changed.`
      );
    }

    return event;
  };

/* ==========================================================
   MARK EVENT FAILED
========================================================== */

export const markOutboxEventFailed =
  async ({
    eventId,

    lockToken,

    error,

    retry =
      true,
  }) => {
    const normalizedEventId =
      requireValue(
        eventId,
        "eventId"
      );

    const normalizedLockToken =
      requireValue(
        lockToken,
        "lockToken"
      );

    const errorMessage =
      error instanceof Error
        ? error.message
        : normalizeString(
            error
          ) ||
          "Unknown outbox delivery error.";

    const now =
      new Date();

    const event =
      await OutboxEvent.findOne({
        eventId:
          normalizedEventId,

        status:
          OUTBOX_STATUS.PROCESSING,

        lockToken:
          normalizedLockToken,
      });

    if (
      !event
    ) {
      throw new Error(
        `Unable to update failed outbox event "${normalizedEventId}". Worker lock may have expired or ownership changed.`
      );
    }

    const exhausted =
      event.attempts >=
      event.maxAttempts;

    const shouldDeadLetter =
      !retry ||
      exhausted;

    if (
      shouldDeadLetter
    ) {
      event.status =
        OUTBOX_STATUS.DEAD;

      event.lastError =
        errorMessage;

      event.lastErrorAt =
        now;

      event.deadAt =
        now;

      event.deadReason =
        !retry
          ? "Retry disabled."
          : `Maximum attempts (${event.maxAttempts}) exhausted.`;

      event.lockedAt =
        null;

      event.lockExpiresAt =
        null;

      event.lockToken =
        null;

      event.workerName =
        null;

      await event.save();

      return event;
    }

    const retryDelay =
      calculateRetryDelay({
        attempt:
          event.attempts,
      });

    const nextAttemptAt =
      new Date(
        now.getTime() +
          retryDelay
      );

    event.status =
      OUTBOX_STATUS.FAILED;

    event.nextAttemptAt =
      nextAttemptAt;

    event.lastError =
      errorMessage;

    event.lastErrorAt =
      now;

    event.lockedAt =
      null;

    event.lockExpiresAt =
      null;

    event.lockToken =
      null;

    event.workerName =
      null;

    await event.save();

    return event;
  };

/* ==========================================================
   MARK EVENT DEAD
========================================================== */

export const markOutboxEventDead =
  async ({
    eventId,

    lockToken,

    reason,
  }) => {
    const normalizedEventId =
      requireValue(
        eventId,
        "eventId"
      );

    const normalizedLockToken =
      requireValue(
        lockToken,
        "lockToken"
      );

    const now =
      new Date();

    const event =
      await OutboxEvent.findOneAndUpdate(
        {
          eventId:
            normalizedEventId,

          status:
            OUTBOX_STATUS.PROCESSING,

          lockToken:
            normalizedLockToken,
        },

        {
          $set: {
            status:
              OUTBOX_STATUS.DEAD,

            lastError:
              normalizeString(
                reason
              ) ||
              "Event manually dead-lettered.",

            lastErrorAt:
              now,

            deadAt:
              now,

            deadReason:
              normalizeString(
                reason
              ) ||
              "Event manually dead-lettered.",
          },

          $unset: {
            lockedAt:
              "",

            lockExpiresAt:
              "",

            lockToken:
              "",

            workerName:
              "",
          },
        },

        {
          new:
            true,
        }
      );

    if (
      !event
    ) {
      throw new Error(
        `Unable to dead-letter outbox event "${normalizedEventId}". Worker lock may have expired or ownership changed.`
      );
    }

    return event;
  };

/* ==========================================================
   RECOVER STALE EVENTS
========================================================== */

export const recoverStaleOutboxEvents =
  async ({
    limit =
      100,
  } = {}) => {
    const normalizedLimit =
      Math.max(
        1,

        Math.min(
          1000,

          Number(
            limit
          ) ||
            100
        )
      );

    const now =
      new Date();

    const staleEvents =
      await OutboxEvent.find({
        status:
          OUTBOX_STATUS.PROCESSING,

        lockExpiresAt: {
          $lte:
            now,
        },
      })
        .select(
          "_id eventId attempts maxAttempts lastError"
        )
        .limit(
          normalizedLimit
        );

    if (
      staleEvents.length ===
      0
    ) {
      return {
        recovered:
          0,

        dead:
          0,
      };
    }

    let recovered =
      0;

    let dead =
      0;

    for (
      const staleEvent of
      staleEvents
    ) {
      const attempts =
        Number(
          staleEvent.attempts ||
            0
        );

      const maxAttempts =
        Number(
          staleEvent.maxAttempts ||
            DEFAULT_MAX_ATTEMPTS
        );

      if (
        attempts >=
        maxAttempts
      ) {
        await OutboxEvent.updateOne(
          {
            _id:
              staleEvent._id,

            status:
              OUTBOX_STATUS.PROCESSING,

            lockExpiresAt: {
              $lte:
                now,
            },
          },

          {
            $set: {
              status:
                OUTBOX_STATUS.DEAD,

              deadAt:
                now,

              deadReason:
                `Maximum attempts (${maxAttempts}) exhausted while recovering stale worker lease.`,

              lastError:
                staleEvent.lastError ||
                "Worker lease expired.",

              lastErrorAt:
                now,
            },

            $unset: {
              lockedAt:
                "",

              lockExpiresAt:
                "",

              lockToken:
                "",

              workerName:
                "",
            },
          }
        );

        dead +=
          1;

        continue;
      }

      const retryDelay =
        calculateRetryDelay({
          attempt:
            attempts,
        });

      const nextAttemptAt =
        new Date(
          now.getTime() +
            retryDelay
        );

      const result =
        await OutboxEvent.updateOne(
          {
            _id:
              staleEvent._id,

            status:
              OUTBOX_STATUS.PROCESSING,

            lockExpiresAt: {
              $lte:
                now,
            },
          },

          {
            $set: {
              status:
                OUTBOX_STATUS.FAILED,

              nextAttemptAt,

              lastError:
                staleEvent.lastError ||
                "Worker lease expired.",

              lastErrorAt:
                now,
            },

            $unset: {
              lockedAt:
                "",

              lockExpiresAt:
                "",

              lockToken:
                "",

              workerName:
                "",
            },
          }
        );

      if (
        result.modifiedCount ===
        1
      ) {
        recovered +=
          1;
      }
    }

    return {
      recovered,

      dead,
    };
  };

/* ==========================================================
   LIST DEAD EVENTS
========================================================== */

export const listDeadOutboxEvents =
  async ({
    organizationId,

    limit =
      100,

    skip =
      0,
  } = {}) => {
    const normalizedLimit =
      Math.max(
        1,

        Math.min(
          1000,

          Number(
            limit
          ) ||
            100
        )
      );

    const normalizedSkip =
      Math.max(
        0,

        Number(
          skip
        ) ||
          0
      );

    const query = {
      status:
        OUTBOX_STATUS.DEAD,
    };

    if (
      organizationId
    ) {
      query.organizationId =
        normalizeObjectId(
          organizationId,
          "organizationId"
        );
    }

    return OutboxEvent.find(
      query
    )
      .sort({
        deadAt:
          -1,
      })
      .skip(
        normalizedSkip
      )
      .limit(
        normalizedLimit
      );
  };

/* ==========================================================
   GET OUTBOX STATISTICS
========================================================== */

export const getOutboxStatistics =
  async ({
    organizationId,
  } = {}) => {
    const match =
      {};

    if (
      organizationId
    ) {
      match.organizationId =
        normalizeObjectId(
          organizationId,
          "organizationId"
        );
    }

    const results =
      await OutboxEvent.aggregate([
        {
          $match:
            match,
        },

        {
          $group: {
            _id:
              "$status",

            count: {
              $sum:
                1,
            },
          },
        },
      ]);

    const statistics = {
      pending:
        0,

      processing:
        0,

      published:
        0,

      failed:
        0,

      dead:
        0,

      total:
        0,
    };

    for (
      const result of
      results
    ) {
      const status =
        result?._id;

      const count =
        Number(
          result?.count ||
            0
        );

      if (
        Object.prototype.hasOwnProperty.call(
          statistics,
          status
        )
      ) {
        statistics[status] =
          count;
      }

      statistics.total +=
        count;
    }

    return statistics;
  };

/* ==========================================================
   PURGE PUBLISHED EVENTS
========================================================== */

export const purgePublishedOutboxEvents =
  async ({
    olderThanDays =
      30,

    limit =
      1000,
  } = {}) => {
    const days =
      Math.max(
        1,

        Number(
          olderThanDays
        ) ||
          30
      );

    const normalizedLimit =
      Math.max(
        1,

        Math.min(
          10000,

          Number(
            limit
          ) ||
            1000
        )
      );

    const cutoff =
      new Date(
        Date.now() -
          days *
            24 *
            60 *
            60 *
            1000
      );

    const events =
      await OutboxEvent.find({
        status:
          OUTBOX_STATUS.PUBLISHED,

        publishedAt: {
          $lte:
            cutoff,
        },
      })
        .select(
          "_id"
        )
        .limit(
          normalizedLimit
        );

    if (
      events.length ===
      0
    ) {
      return {
        deleted:
          0,
      };
    }

    const ids =
      events.map(
        (event) =>
          event._id
      );

    const result =
      await OutboxEvent.deleteMany({
        _id: {
          $in:
            ids,
        },
      });

    return {
      deleted:
        Number(
          result.deletedCount ||
            0
        ),
    };
  };

/* ==========================================================
   STATUS HELPERS
========================================================== */

export const isTerminalOutboxStatus =
  (
    status
  ) => {
    return (
      status ===
        OUTBOX_STATUS.PUBLISHED ||
      status ===
        OUTBOX_STATUS.DEAD
    );
  };

export const isRetryableOutboxStatus =
  (
    status
  ) => {
    return (
      status ===
        OUTBOX_STATUS.PENDING ||
      status ===
        OUTBOX_STATUS.FAILED ||
      status ===
        OUTBOX_STATUS.PROCESSING
    );
  };

/* ==========================================================
   WITH OUTBOX TRANSACTION
========================================================== */

export const withOutboxTransaction =
  async (
    callback,

    {
      transactionOptions =
        {},
    } = {}
  ) => {
    if (
      typeof callback !==
      "function"
    ) {
      throw new Error(
        "withOutboxTransaction requires a callback function."
      );
    }

    const session =
      await mongoose.startSession();

    try {
      let result;

      await session.withTransaction(
        async () => {
          result =
            await callback(
              session
            );
        },

        transactionOptions
      );

      return result;
    } finally {
      await session.endSession();
    }
  };

/* ==========================================================
   CREATE TRANSACTIONAL EVENT
========================================================== */

export const createTransactionalOutboxEvent =
  async (
    eventOptions
  ) => {
    return withOutboxTransaction(
      async (
        session
      ) => {
        return createOutboxEvent({
          ...eventOptions,

          session,
        });
      }
    );
  };

/* ==========================================================
   REQUEUE DEAD EVENT
========================================================== */

export const requeueDeadOutboxEvent =
  async ({
    eventId,

    organizationId,
  }) => {
    const normalizedEventId =
      requireValue(
        eventId,
        "eventId"
      );

    const query = {
      eventId:
        normalizedEventId,

      status:
        OUTBOX_STATUS.DEAD,
    };

    if (
      organizationId
    ) {
      query.organizationId =
        normalizeObjectId(
          organizationId,
          "organizationId"
        );
    }

    const event =
      await OutboxEvent.findOneAndUpdate(
        query,

        {
          $set: {
            status:
              OUTBOX_STATUS.PENDING,

            nextAttemptAt:
              new Date(),

            lastError:
              null,

            lastErrorAt:
              null,

            deadAt:
              null,

            deadReason:
              null,
          },

          $unset: {
            lockedAt:
              "",

            lockExpiresAt:
              "",

            lockToken:
              "",

            workerName:
              "",

            publishedAt:
              "",
          },
        },

        {
          new:
            true,
        }
      );

    if (
      !event
    ) {
      throw new Error(
        `Dead outbox event "${normalizedEventId}" was not found.`
      );
    }

    return event;
  };

/* ==========================================================
   RETRY EVENT NOW
========================================================== */

export const retryOutboxEventNow =
  async ({
    eventId,

    organizationId,
  }) => {
    const normalizedEventId =
      requireValue(
        eventId,
        "eventId"
      );

    const query = {
      eventId:
        normalizedEventId,

      status:
        OUTBOX_STATUS.FAILED,
    };

    if (
      organizationId
    ) {
      query.organizationId =
        normalizeObjectId(
          organizationId,
          "organizationId"
        );
    }

    const event =
      await OutboxEvent.findOneAndUpdate(
        query,

        {
          $set: {
            nextAttemptAt:
              new Date(),
          },
        },

        {
          new:
            true,
        }
      );

    if (
      !event
    ) {
      throw new Error(
        `Failed outbox event "${normalizedEventId}" was not found.`
      );
    }

    return event;
  };

/* ==========================================================
   EVENT HISTORY
========================================================== */

export const getOutboxEventHistory =
  async ({
    eventId,

    organizationId,
  }) => {
    const normalizedEventId =
      requireValue(
        eventId,
        "eventId"
      );

    const query = {
      eventId:
        normalizedEventId,
    };

    if (
      organizationId
    ) {
      query.organizationId =
        normalizeObjectId(
          organizationId,
          "organizationId"
        );
    }

    return OutboxEvent.findOne(
      query
    ).lean();
  };

/* ==========================================================
   DEFAULT EXPORT
========================================================== */

export default {
  createOutboxEvent,

  createOutboxEvents,

  createTransactionalOutboxEvent,

  withOutboxTransaction,

  getOutboxEvent,

  getOutboxEventByDeduplicationKey,

  getOutboxEventHistory,

  countPendingOutboxEvents,

  claimNextOutboxEvent,

  claimOutboxEvent,

  heartbeatOutboxEvent,

  markOutboxEventPublished,

  markOutboxEventFailed,

  markOutboxEventDead,

  recoverStaleOutboxEvents,

  listDeadOutboxEvents,

  getOutboxStatistics,

  purgePublishedOutboxEvents,

  requeueDeadOutboxEvent,

  retryOutboxEventNow,

  calculateRetryDelay,

  isTerminalOutboxStatus,

  isRetryableOutboxStatus,
};