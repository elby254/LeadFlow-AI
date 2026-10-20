/**
 * ==========================================================
 *
 * LEADFLOW AI
 * OUTBOX WORKER
 *
 * ==========================================================
 *
 * PURPOSE
 * ----------------------------------------------------------
 *
 * Durable event delivery worker.
 *
 * The worker reads durable events from:
 *
 *   OutboxEvent
 *
 * and publishes them to:
 *
 *   events/leadEvents.js
 *
 * The canonical event bus then feeds:
 *
 *   realtimeEngine
 *   notification listeners
 *   automation listeners
 *   channel workflow listeners
 *   future consumers
 *
 * ==========================================================
 *
 * ARCHITECTURE
 * ==========================================================
 *
 * Database transaction
 *        ↓
 * OutboxEvent
 *        ↓
 * outboxWorker
 *        ↓
 * leadEventBus
 *        ↓
 * ┌───────────────────────────────┐
 * │ realtimeEngine                │
 * │ notification listeners        │
 * │ automation listeners          │
 * │ channel workflow listeners    │
 * │ future consumers              │
 * └───────────────────────────────┘
 *
 * ==========================================================
 *
 * DELIVERY SEMANTICS
 * ==========================================================
 *
 * Delivery is AT-LEAST-ONCE.
 *
 * Therefore:
 *
 *   eventId
 *
 * must be used by downstream consumers whenever they perform
 * an externally visible or irreversible operation.
 *
 * Possible sequence:
 *
 *   worker publishes event
 *        ↓
 *   consumer receives event
 *        ↓
 *   process crashes
 *        ↓
 *   worker retries event
 *
 * The same event may therefore be observed more than once.
 *
 * ==========================================================
 *
 * IMPORTANT
 * ==========================================================
 *
 * This worker does NOT:
 *
 * ✗ mutate Lead.status
 * ✗ calculate Lead.score
 * ✗ perform assignment
 * ✗ perform viewing workflow
 * ✗ send WhatsApp directly
 * ✗ send SMS directly
 *
 * It only delivers durable business events.
 *
 * ==========================================================
 */

import mongoose from "mongoose";

import leadEventBus, {
  isValidLeadEvent,
} from "../events/leadEvents.js";

import {
  claimNextOutboxEvent,
  markOutboxEventPublished,
  markOutboxEventFailed,
  recoverStaleOutboxEvents,
  getOutboxStatistics,
} from "../services/outboxService.js";


/* ==========================================================
   WORKER DEFAULTS
========================================================== */

const DEFAULT_WORKER_NAME =
  "leadflow-outbox-worker";

const DEFAULT_POLL_INTERVAL_MS =
  1000;

const DEFAULT_RECOVERY_INTERVAL_MS =
  30 * 1000;

const DEFAULT_LEASE_DURATION_MS =
  60 * 1000;

const DEFAULT_MAX_BATCH_SIZE =
  10;


/* ==========================================================
   WORKER STATE
========================================================== */

let workerRunning =
  false;

let workerStopping =
  false;

let workerTimer =
  null;

let recoveryTimer =
  null;

let currentProcessingPromise =
  null;


/* ==========================================================
   WORKER CONFIGURATION
========================================================== */

let workerConfig = {
  workerName:
    DEFAULT_WORKER_NAME,

  pollIntervalMs:
    DEFAULT_POLL_INTERVAL_MS,

  recoveryIntervalMs:
    DEFAULT_RECOVERY_INTERVAL_MS,

  leaseDurationMs:
    DEFAULT_LEASE_DURATION_MS,

  batchSize:
    DEFAULT_MAX_BATCH_SIZE,
};


/* ==========================================================
   HELPER
   NORMALIZE POSITIVE NUMBER
========================================================== */

const normalizePositiveNumber = (
  value,
  fallback
) => {

  const number =
    Number(
      value
    );

  if (
    !Number.isFinite(
      number
    ) ||
    number <= 0
  ) {
    return fallback;
  }

  return number;
};


/* ==========================================================
   CONFIGURE WORKER
========================================================== */

export const configureOutboxWorker = (
  options = {}
) => {

  workerConfig = {
    workerName:
      String(
        options.workerName ||
          workerConfig.workerName ||
          DEFAULT_WORKER_NAME
      ).trim(),

    pollIntervalMs:
      normalizePositiveNumber(
        options.pollIntervalMs,
        workerConfig.pollIntervalMs
      ),

    recoveryIntervalMs:
      normalizePositiveNumber(
        options.recoveryIntervalMs,
        workerConfig.recoveryIntervalMs
      ),

    leaseDurationMs:
      normalizePositiveNumber(
        options.leaseDurationMs,
        workerConfig.leaseDurationMs
      ),

    batchSize:
      Math.max(
        1,
        Math.min(
          100,
          Math.floor(
            normalizePositiveNumber(
              options.batchSize,
              workerConfig.batchSize
            )
          )
        )
      ),
  };

  return {
    ...workerConfig,
  };
};


/* ==========================================================
   CHECK DATABASE CONNECTION
========================================================== */

const isDatabaseReady = () => {

  return (
    mongoose.connection.readyState ===
    1
  );
};


/* ==========================================================
   BUILD DELIVERY PAYLOAD
========================================================== */

/**
 * Builds the payload delivered to the canonical event bus.
 *
 * The original business payload remains intact.
 *
 * Delivery metadata is added without replacing the business
 * event's own fields.
 *
 * IMPORTANT:
 *
 * The durable OutboxEvent eventId is authoritative.
 */
const buildDeliveryPayload = (
  event
) => {

  const originalPayload =
    event?.payload;

  const payload =
    originalPayload &&
    typeof originalPayload ===
      "object"
      ? (
          typeof originalPayload.toObject ===
          "function"
            ? originalPayload.toObject()
            : typeof originalPayload.toJSON ===
              "function"
              ? originalPayload.toJSON()
              : {
                  ...originalPayload,
                }
        )
      : {};

  return {
    ...payload,

    /**
     * Stable durable event identifier.
     *
     * Downstream consumers should use this for idempotency.
     *
     * The OutboxEvent identifier is the source of truth.
     */
    eventId:
      event.eventId,

    /**
     * Explicit Outbox identifier.
     *
     * Currently the Outbox eventId is also the durable event
     * identifier, but the field remains explicit so the
     * delivery boundary is unambiguous.
     */
    outboxEventId:
      event.eventId,

    /**
     * Canonical business event type.
     */
    eventType:
      event.eventType,

    /**
     * Durable event timestamp.
     */
    eventOccurredAt:
      event.occurredAt ||
      payload.occurredAt ||
      null,
  };
};


/* ==========================================================
   VALIDATE OUTBOX EVENT
========================================================== */

const validateOutboxEvent = (
  event
) => {

  if (
    !event
  ) {
    throw new Error(
      "No outbox event supplied."
    );
  }

  if (
    !event.eventId
  ) {
    throw new Error(
      "Outbox event is missing eventId."
    );
  }

  if (
    !event.eventType
  ) {
    throw new Error(
      `Outbox event "${event.eventId}" is missing eventType.`
    );
  }

  if (
    !isValidLeadEvent(
      event.eventType
    )
  ) {
    throw new Error(
      `Outbox event "${event.eventId}" contains unsupported canonical event "${event.eventType}".`
    );
  }

  if (
    !event.organizationId
  ) {
    throw new Error(
      `Outbox event "${event.eventId}" is missing organizationId.`
    );
  }

  if (
    !event.aggregateType
  ) {
    throw new Error(
      `Outbox event "${event.eventId}" is missing aggregateType.`
    );
  }

  if (
    !event.aggregateId
  ) {
    throw new Error(
      `Outbox event "${event.eventId}" is missing aggregateId.`
    );
  }

  return true;
};


/* ==========================================================
   EVENT BUS PUBLISH
========================================================== */

/**
 * Publish exactly one durable Outbox event to the canonical
 * in-memory business-event bus.
 *
 * IMPORTANT:
 *
 * EventEmitter.emit() is synchronous.
 *
 * If a synchronous listener throws, the exception propagates
 * and this event is treated as failed.
 *
 * Async consumers must independently manage:
 *
 *   • idempotency
 *   • retries
 *   • external API failures
 *   • their own durable state
 *
 * The Outbox worker guarantees delivery to the canonical
 * application event bus boundary, not completion of every
 * asynchronous downstream consumer.
 */
const publishToEventBus = (
  event
) => {

  validateOutboxEvent(
    event
  );

  const payload =
    buildDeliveryPayload(
      event
    );

  console.log(
    "📤 OUTBOX → EVENT BUS:",
    {
      eventId:
        String(
          event.eventId
        ),

      eventType:
        event.eventType,

      aggregateType:
        event.aggregateType,

      aggregateId:
        String(
          event.aggregateId
        ),

      organizationId:
        String(
          event.organizationId
        ),
    }
  );

  const delivered =
    leadEventBus.emit(
      event.eventType,
      payload
    );

  /**
   * EventEmitter.emit() returns false when there are no
   * registered listeners.
   *
   * This is NOT automatically a delivery failure.
   *
   * The event has still crossed the canonical application
   * event-bus boundary successfully.
   */
  if (
    !delivered
  ) {
    console.warn(
      "⚠️ OUTBOX EVENT BUS HAS NO ACTIVE LISTENERS:",
      event.eventType
    );
  }

  return {
    delivered,
    payload,
  };
};


/* ==========================================================
   PROCESS ONE EVENT
========================================================== */

/**
 * Processes one already-claimed event.
 *
 * The event must have:
 *
 *   status = processing
 *
 * and:
 *
 *   lockToken
 */
export const processOutboxEvent = async (
  event
) => {

  if (
    !event
  ) {
    return {
      processed:
        false,

      reason:
        "no-event",
    };
  }

  validateOutboxEvent(
    event
  );

  const eventId =
    String(
      event.eventId
    );

  const lockToken =
    event.lockToken;

  if (
    !lockToken
  ) {
    throw new Error(
      `Outbox event "${eventId}" does not have a worker lock token.`
    );
  }

  try {

    /* ------------------------------------
       Publish
    ------------------------------------ */

    const result =
      publishToEventBus(
        event
      );


    /* ------------------------------------
       Mark published
    ------------------------------------ */

    const published =
      await markOutboxEventPublished({
        eventId,

        lockToken,
      });

    if (
      !published
    ) {
      throw new Error(
        `Outbox event "${eventId}" could not be marked as published.`
      );
    }

    console.log(
      "✅ OUTBOX EVENT PUBLISHED:",
      {
        eventId,

        eventType:
          event.eventType,

        delivered:
          result.delivered,

        publishedAt:
          published.publishedAt,
      }
    );

    return {
      processed:
        true,

      success:
        true,

      event:
        published,
    };

  } catch (
    error
  ) {

    /* ------------------------------------
       Failure
    ------------------------------------ */

    console.error(
      "❌ OUTBOX EVENT DELIVERY FAILED:",
      {
        eventId,

        eventType:
          event.eventType,

        error,
      }
    );

    try {

      const failed =
        await markOutboxEventFailed({
          eventId,

          lockToken,

          error,

          retry:
            true,
        });

      if (
        failed
      ) {

        console.warn(
          "🔁 OUTBOX EVENT FAILURE RECORDED:",
          {
            eventId,

            status:
              failed.status,

            attempts:
              failed.attempts,

            nextAttemptAt:
              failed.nextAttemptAt,

            deadAt:
              failed.deadAt ||
              null,
          }
        );

      } else {

        console.warn(
          "⚠️ OUTBOX FAILURE STATE COULD NOT BE UPDATED:",
          {
            eventId,
          }
        );
      }

    } catch (
      statusError
    ) {

      /**
       * Serious operational condition.
       *
       * The event could not be published AND the worker could
       * not update its durable failure state.
       *
       * The lease will eventually expire and stale-event
       * recovery will make the event eligible again.
       */
      console.error(
        "🚨 OUTBOX FAILURE STATE UPDATE FAILED:",
        {
          eventId,

          deliveryError:
            error,

          stateUpdateError:
            statusError,
        }
      );
    }

    return {
      processed:
        true,

      success:
        false,

      error,
    };
  }
};


/* ==========================================================
   CLAIM + PROCESS ONE EVENT
========================================================== */

/**
 * Claims exactly one event and processes it.
 *
 * MongoDB performs the claim atomically, allowing multiple
 * worker processes to safely call this function.
 */
export const processNextOutboxEvent =
  async () => {

    if (
      !isDatabaseReady()
    ) {
      return {
        processed:
          false,

        reason:
          "database-not-ready",
      };
    }

    const event =
      await claimNextOutboxEvent({
        workerName:
          workerConfig.workerName,

        leaseDurationMs:
          workerConfig.leaseDurationMs,
      });

    if (
      !event
    ) {
      return {
        processed:
          false,

        reason:
          "no-event",
      };
    }

    return processOutboxEvent(
      event
    );
  };


/* ==========================================================
   PROCESS AVAILABLE EVENTS
========================================================== */

/**
 * Processes up to batchSize available events.
 *
 * Events are intentionally processed one at a time within
 * this worker instance.
 *
 * Benefits:
 *
 *   • simpler ordering
 *   • easier debugging
 *   • less downstream pressure
 *   • deterministic worker behavior
 *
 * Multiple worker processes may still operate concurrently
 * because event claiming is performed atomically in MongoDB.
 */
export const processOutboxBatch =
  async () => {

    if (
      !isDatabaseReady()
    ) {
      return {
        processed:
          0,

        succeeded:
          0,

        failed:
          0,

        skipped:
          true,

        reason:
          "database-not-ready",
      };
    }

    let processed =
      0;

    let succeeded =
      0;

    let failed =
      0;

    for (
      let index = 0;
      index <
        workerConfig.batchSize;
      index += 1
    ) {

      if (
        workerStopping
      ) {
        break;
      }

      const result =
        await processNextOutboxEvent();

      if (
        !result.processed
      ) {
        break;
      }

      processed +=
        1;

      if (
        result.success
      ) {
        succeeded +=
          1;
      } else {
        failed +=
          1;
      }
    }

    return {
      processed,

      succeeded,

      failed,

      skipped:
        false,
    };
  };


/* ==========================================================
   WORKER POLL CYCLE
========================================================== */

/**
 * Executes one polling cycle.
 *
 * Kept separate from the continuous loop so it can be used
 * by:
 *
 *   • tests
 *   • startup diagnostics
 *   • administrative commands
 */
export const runOutboxPollCycle =
  async () => {

    if (
      workerStopping
    ) {
      return {
        skipped:
          true,

        reason:
          "worker-stopping",
      };
    }

    try {

      const result =
        await processOutboxBatch();

      if (
        result.processed >
        0
      ) {

        console.log(
          "📦 OUTBOX POLL CYCLE:",
          {
            processed:
              result.processed,

            succeeded:
              result.succeeded,

            failed:
              result.failed,
          }
        );
      }

      return result;

    } catch (
      error
    ) {

      /**
       * Polling itself failed.
       *
       * Individual claimed-event failures are handled by
       * processOutboxEvent().
       */
      console.error(
        "❌ OUTBOX POLL CYCLE ERROR:",
        error
      );

      return {
        skipped:
          false,

        processed:
          0,

        succeeded:
          0,

        failed:
          0,

        error,
      };
    }
  };


/* ==========================================================
   RECOVERY CYCLE
========================================================== */

/**
 * Requeues events whose worker leases have expired.
 */
export const runOutboxRecoveryCycle =
  async () => {

    if (
      workerStopping
    ) {
      return {
        skipped:
          true,

        reason:
          "worker-stopping",
      };
    }

    if (
      !isDatabaseReady()
    ) {
      return {
        skipped:
          true,

        reason:
          "database-not-ready",
      };
    }

    try {

      const result =
        await recoverStaleOutboxEvents({
          limit:
            100,
        });

      if (
        result?.recovered ||
        result?.dead
      ) {

        console.log(
          "♻️ OUTBOX STALE EVENT RECOVERY:",
          result
        );
      }

      return result;

    } catch (
      error
    ) {

      console.error(
        "❌ OUTBOX RECOVERY ERROR:",
        error
      );

      return {
        recovered:
          0,

        dead:
          0,

        error,
      };
    }
  };


/* ==========================================================
   POLLING LOOP
========================================================== */

/**
 * Schedules the next worker poll.
 *
 * setTimeout is deliberately used instead of setInterval.
 *
 * Why?
 *
 * If processing takes longer than the poll interval,
 * setInterval could create overlapping polling cycles.
 *
 * Recursive setTimeout keeps one scheduled poll cycle
 * behind the previous one.
 */
const scheduleNextPoll = () => {

  if (
    !workerRunning ||
    workerStopping
  ) {
    return;
  }

  workerTimer =
    setTimeout(
      async () => {

        workerTimer =
          null;

        if (
          !workerRunning ||
          workerStopping
        ) {
          return;
        }

        await runOutboxWorkerCycle();

        scheduleNextPoll();
      },

      workerConfig.pollIntervalMs
    );
};


/* ==========================================================
   RECOVERY LOOP
========================================================== */

/**
 * Schedules stale-worker recovery.
 */
const scheduleNextRecovery =
  () => {

    if (
      !workerRunning ||
      workerStopping
    ) {
      return;
    }

    recoveryTimer =
      setTimeout(
        async () => {

          recoveryTimer =
            null;

          if (
            !workerRunning ||
            workerStopping
          ) {
            return;
          }

          await runOutboxRecoveryCycle();

          scheduleNextRecovery();
        },

        workerConfig.recoveryIntervalMs
      );
  };


/* ==========================================================
   CLEAR TIMERS
========================================================== */

const clearWorkerTimers = () => {

  if (
    workerTimer
  ) {
    clearTimeout(
      workerTimer
    );

    workerTimer =
      null;
  }

  if (
    recoveryTimer
  ) {
    clearTimeout(
      recoveryTimer
    );

    recoveryTimer =
      null;
  }
};


/* ==========================================================
   START WORKER
========================================================== */

/**
 * Starts the durable Outbox worker.
 *
 * Idempotent within one Node.js process.
 *
 * Calling startOutboxWorker() twice will not create two
 * polling loops inside the same process.
 */
export const startOutboxWorker =
  async (
    options = {}
  ) => {

    /* ------------------------------------
       Configure
    ------------------------------------ */

    configureOutboxWorker(
      options
    );


    /* ------------------------------------
       Already running
    ------------------------------------ */

    if (
      workerRunning
    ) {

      console.log(
        "ℹ️ Outbox worker is already running:",
        workerConfig.workerName
      );

      return {
        started:
          false,

        alreadyRunning:
          true,

        ...workerConfig,
      };
    }


    /* ------------------------------------
       Reset shutdown state
    ------------------------------------ */

    workerStopping =
      false;

    workerRunning =
      true;


    /* ------------------------------------
       Startup log
    ------------------------------------ */

    console.log(
      "=================================================="
    );

    console.log(
      "🚀 LEADFLOW AI OUTBOX WORKER STARTED"
    );

    console.log(
      "=================================================="
    );

    console.log(
      "👷 Worker:",
      workerConfig.workerName
    );

    console.log(
      "⏱️ Poll interval:",
      `${workerConfig.pollIntervalMs}ms`
    );

    console.log(
      "♻️ Recovery interval:",
      `${workerConfig.recoveryIntervalMs}ms`
    );

    console.log(
      "🔒 Lease duration:",
      `${workerConfig.leaseDurationMs}ms`
    );

    console.log(
      "📦 Batch size:",
      workerConfig.batchSize
    );

    console.log(
      "=================================================="
    );


    /* ------------------------------------
       Initial recovery
    ------------------------------------ */

    await runOutboxRecoveryCycle();


    /* ------------------------------------
       Initial poll
    ------------------------------------ */

    await runOutboxWorkerCycle();


    /* ------------------------------------
       Schedule future work
    ------------------------------------ */

    scheduleNextPoll();

    scheduleNextRecovery();


    return {
      started:
        true,

      alreadyRunning:
        false,

      ...workerConfig,
    };
  };


/* ==========================================================
   STOP WORKER
========================================================== */

/**
 * Gracefully stops future polling.
 *
 * IMPORTANT:
 *
 * This does not forcibly terminate an already-running event
 * handler.
 *
 * The currently claimed event is allowed to finish.
 */
export const stopOutboxWorker =
  async () => {

    if (
      !workerRunning
    ) {
      return {
        stopped:
          false,

        alreadyStopped:
          true,
      };
    }

    console.log(
      "🛑 Stopping LeadFlow AI Outbox Worker..."
    );

    workerStopping =
      true;

    workerRunning =
      false;

    clearWorkerTimers();


    /* ------------------------------------
       Wait for current processing
    ------------------------------------ */

    if (
      currentProcessingPromise
    ) {

      try {

        await currentProcessingPromise;

      } catch (
        error
      ) {

        console.error(
          "❌ Error while waiting for active outbox processing:",
          error
        );
      }

      currentProcessingPromise =
        null;
    }


    console.log(
      "✅ LeadFlow AI Outbox Worker stopped."
    );

    return {
      stopped:
        true,

      alreadyStopped:
        false,
    };
  };


/* ==========================================================
   CONTROLLED RUN WRAPPER
========================================================== */

/**
 * Internal wrapper used for worker polling.
 *
 * This prevents two polling cycles from overlapping inside
 * the same worker process.
 *
 * This is especially important when:
 *
 *   • a poll cycle is manually triggered
 *   • the configured poll interval is short
 *   • processing takes longer than expected
 */
export const runOutboxWorkerCycle =
  async () => {

    if (
      currentProcessingPromise
    ) {
      return currentProcessingPromise;
    }

    const operation =
      (async () => {

        try {

          return await runOutboxPollCycle();

        } finally {

          currentProcessingPromise =
            null;
        }
      })();

    currentProcessingPromise =
      operation;

    return operation;
  };


/* ==========================================================
   WORKER STATUS
========================================================== */

/**
 * Lightweight health/status information.
 */
export const getOutboxWorkerStatus =
  async () => {

    const databaseReady =
      isDatabaseReady();

    let statistics =
      null;

    if (
      databaseReady
    ) {

      try {

        statistics =
          await getOutboxStatistics();

      } catch (
        error
      ) {

        console.error(
          "⚠️ Unable to read Outbox statistics:",
          error
        );
      }
    }

    return {
      running:
        workerRunning,

      stopping:
        workerStopping,

      databaseReady,

      processing:
        Boolean(
          currentProcessingPromise
        ),

      workerName:
        workerConfig.workerName,

      configuration: {
        ...workerConfig,
      },

      statistics,
    };
  };


/* ==========================================================
   HEALTH CHECK
========================================================== */

/**
 * Returns whether the worker infrastructure is operational.
 *
 * This does not require pending events to exist.
 */
export const isOutboxWorkerHealthy =
  () => {

    return (
      workerRunning &&
      !workerStopping &&
      isDatabaseReady()
    );
  };


/* ==========================================================
   WAIT FOR DATABASE
========================================================== */

/**
 * Wait until Mongoose reports an active connection.
 *
 * This keeps worker startup predictable when application
 * startup and database connection happen close together.
 */
const waitForDatabase = async ({
  timeoutMs =
    30 * 1000,

  retryIntervalMs =
    500,
} = {}) => {

  const startedAt =
    Date.now();

  while (
    Date.now() -
      startedAt <
    timeoutMs
  ) {

    if (
      isDatabaseReady()
    ) {
      return true;
    }

    await new Promise(
      (resolve) =>
        setTimeout(
          resolve,
          retryIntervalMs
        )
    );
  }

  return false;
};


/* ==========================================================
   START WHEN DATABASE IS READY
========================================================== */

/**
 * Convenience startup helper for server.js.
 *
 * This does not throw merely because MongoDB is not ready.
 *
 * Instead it logs the condition and returns false.
 *
 * server.js remains responsible for deciding whether the
 * complete application should continue booting.
 */
export const startOutboxWorkerWhenReady =
  async (
    options = {}
  ) => {

    const ready =
      await waitForDatabase({
        timeoutMs:
          options.databaseWaitTimeoutMs ||
          30 * 1000,

        retryIntervalMs:
          options.databaseRetryIntervalMs ||
          500,
      });

    if (
      !ready
    ) {

      console.error(
        "❌ Outbox worker could not start because MongoDB did not become ready."
      );

      return {
        started:
          false,

        databaseReady:
          false,
      };
    }

    return startOutboxWorker(
      options
    );
  };


/* ==========================================================
   PROCESS SIGNAL HANDLERS
========================================================== */

let shutdownHandlersRegistered =
  false;


/**
 * Register graceful process shutdown.
 *
 * The handlers are registered once.
 */
export const registerOutboxWorkerShutdownHandlers =
  () => {

    if (
      shutdownHandlersRegistered
    ) {
      return;
    }

    shutdownHandlersRegistered =
      true;

    const shutdown =
      async (
        signal
      ) => {

        console.log(
          `🛑 Received ${signal}. Stopping Outbox Worker...`
        );

        try {

          await stopOutboxWorker();

        } catch (
          error
        ) {

          console.error(
            "❌ Outbox worker shutdown error:",
            error
          );
        }
      };


    process.once(
      "SIGINT",
      () =>
        shutdown(
          "SIGINT"
        )
    );


    process.once(
      "SIGTERM",
      () =>
        shutdown(
          "SIGTERM"
        )
    );
  };


/* ==========================================================
   REGISTER SHUTDOWN HANDLERS
========================================================== */

registerOutboxWorkerShutdownHandlers();


/* ==========================================================
   DEFAULT EXPORT
========================================================== */

export default {
  configureOutboxWorker,

  startOutboxWorker,

  startOutboxWorkerWhenReady,

  stopOutboxWorker,

  processOutboxEvent,

  processNextOutboxEvent,

  processOutboxBatch,

  runOutboxPollCycle,

  runOutboxRecoveryCycle,

  runOutboxWorkerCycle,

  getOutboxWorkerStatus,

  isOutboxWorkerHealthy,

  registerOutboxWorkerShutdownHandlers,
};