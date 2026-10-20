/**
 * ==========================================================
 *
 * DELIVERY WORKER
 *
 * LeadFlow AI
 *
 * ==========================================================
 *
 * PURPOSE
 * -------
 *
 * Durable outbound message delivery worker.
 *
 * Architecture:
 *
 *   AI Auto Reply
 *        │
 *        ▼
 *   Message (status: sending)
 *        │
 *        ▼
 *   DeliveryJob (status: pending)
 *        │
 *        ▼
 *   DELIVERY WORKER
 *        │
 *        ▼
 *   messageTransportService
 *        │
 *        ├── SMS
 *        ├── WhatsApp
 *        ├── Website
 *        └── Facebook
 *
 * ==========================================================
 *
 * RESPONSIBILITIES
 * ----------------
 *
 * • Claim pending DeliveryJobs atomically
 * • Recover stale worker leases
 * • Load the canonical Message
 * • Validate tenant/message ownership
 * • Send through messageTransportService
 * • Mark DeliveryJob sent/failed
 * • Update Message delivery status
 * • Retry temporary failures
 * • Respect DeliveryJob maxAttempts
 * • Move permanently failed jobs to dead state
 * • Support graceful shutdown
 * • Prevent concurrent workers from processing the same job
 *
 * ==========================================================
 *
 * IMPORTANT ARCHITECTURE RULES
 * ----------------------------
 *
 * This worker:
 *
 *   DOES:
 *   ✓ claim jobs
 *   ✓ call transport
 *   ✓ update delivery state
 *   ✓ retry failures
 *
 *   DOES NOT:
 *   ✗ generate AI responses
 *   ✗ calculate lead scores
 *   ✗ change Lead.status
 *   ✗ assign leads
 *   ✗ create business events
 *   ✗ create inbound messages
 *   ✗ queue DeliveryJobs
 *
 * messageTransportService remains transport-only.
 *
 * deliveryJobService remains job/retry/lock-only.
 *
 * Message remains the canonical conversation record.
 *
 * ==========================================================
 */

import crypto from "crypto";

import Message from "../models/message.js";

import {
  claimNextDeliveryJob,
  markDeliveryJobSent,
  markDeliveryJobFailed,
  markDeliveryJobTransportAttempted,
  markDeliveryJobReconciliationRequired,
  recoverStaleDeliveryJobs,
  heartbeatDeliveryJob,
} from "../services/deliveryJobService.js";

import {
  sendOutboundMessage,
} from "../services/messageTransportService.js";

/**
 * ==========================================================
 * CONFIGURATION
 * ==========================================================
 */

const WORKER_NAME =
  process.env.DELIVERY_WORKER_NAME ||
  `delivery-worker-${process.pid}-${crypto
    .randomBytes(4)
    .toString("hex")}`;

const POLL_INTERVAL_MS = Number(
  process.env.DELIVERY_WORKER_POLL_INTERVAL_MS || 2000
);

const BATCH_SIZE = Number(
  process.env.DELIVERY_WORKER_BATCH_SIZE || 10
);

const STALE_RECOVERY_INTERVAL_MS = Number(
  process.env.DELIVERY_WORKER_STALE_RECOVERY_INTERVAL_MS ||
    30000
);

const SHUTDOWN_TIMEOUT_MS = Number(
  process.env.DELIVERY_WORKER_SHUTDOWN_TIMEOUT_MS || 30000
);

/**
 * Prevent accidental invalid configuration.
 */

const SAFE_POLL_INTERVAL_MS =
  Number.isFinite(POLL_INTERVAL_MS) && POLL_INTERVAL_MS >= 250
    ? POLL_INTERVAL_MS
    : 2000;

const SAFE_BATCH_SIZE =
  Number.isFinite(BATCH_SIZE) && BATCH_SIZE >= 1
    ? Math.min(BATCH_SIZE, 100)
    : 10;

const SAFE_STALE_RECOVERY_INTERVAL_MS =
  Number.isFinite(STALE_RECOVERY_INTERVAL_MS) &&
  STALE_RECOVERY_INTERVAL_MS >= 5000
    ? STALE_RECOVERY_INTERVAL_MS
    : 30000;

const SAFE_SHUTDOWN_TIMEOUT_MS =
  Number.isFinite(SHUTDOWN_TIMEOUT_MS) &&
  SHUTDOWN_TIMEOUT_MS >= 1000
    ? SHUTDOWN_TIMEOUT_MS
    : 30000;


/**
 * ==========================================================
 * DELIVERY LEASE HEARTBEAT
 * ==========================================================
 *
 * Extends a delivery lease while its worker is processing
 * an outbound transport request.
 *
 * SAFETY:
 * - Uses the original job ID and lock token.
 * - Does not overwrite job state.
 * - Stops if the lease no longer belongs to this worker.
 * - Prevents overlapping heartbeat requests.
 *
 * IMPORTANT:
 * A heartbeat does not establish whether a provider has
 * accepted a message.
 * ==========================================================
 */

const DELIVERY_HEARTBEAT_INTERVAL_MS = 20_000;

function startDeliveryLeaseHeartbeat(job) {
  let stopped = false;
  let timer = null;
  let inFlight = null;

  const jobId = stringifyId(job?._id);
  const lockToken = job?.lockToken;

  if (!jobId || !lockToken) {
    throw new Error(
      "Cannot start delivery heartbeat without a job ID and lock token."
    );
  }

  async function tick() {
    if (stopped) {
      return;
    }

    try {
      const renewedJob = await heartbeatDeliveryJob({
        jobId,
        lockToken,
      });

      if (!renewedJob) {
        stopped = true;

        logWarn(
          "Delivery heartbeat could not renew the lease. Worker ownership may have changed.",
          {
            deliveryJobId: jobId,
          }
        );

        return;
      }
    } catch (error) {
      logError(
        "Delivery heartbeat failed.",
        {
          deliveryJobId: jobId,
          error: error?.message,
        }
      );
    } finally {
      if (!stopped) {
        timer = setTimeout(scheduleTick, DELIVERY_HEARTBEAT_INTERVAL_MS);
        timer.unref?.();
      }
    }
  }

  function scheduleTick() {
    if (stopped || inFlight) {
      return;
    }

    inFlight = tick().finally(() => {
      inFlight = null;
    });
  }

  timer = setTimeout(scheduleTick, DELIVERY_HEARTBEAT_INTERVAL_MS);
  timer.unref?.();

  return async function stopHeartbeat() {
    stopped = true;

    if (timer) {
      clearTimeout(timer);
      timer = null;
    }

    if (inFlight) {
      await inFlight;
    }
  };
}

/**
 * ==========================================================
 * WORKER STATE
 * ==========================================================
 */

let workerRunning = false;
let workerStopping = false;
let pollTimer = null;
let recoveryTimer = null;

let activeJobs = 0;

let lastPollAt = null;
let lastRecoveryAt = null;

let stats = {
  startedAt: null,

  claimed: 0,
  sent: 0,
  failed: 0,
  dead: 0,

  skipped: 0,
  missingMessages: 0,
  invalidMessages: 0,

  transportFailures: 0,
  processingErrors: 0,

  staleJobsRecovered: 0,
};

/**
 * ==========================================================
 * LOGGING HELPERS
 * ==========================================================
 */

function logInfo(message, meta = {}) {
  console.log(
    `[DeliveryWorker:${WORKER_NAME}] ${message}`,
    Object.keys(meta).length ? meta : ""
  );
}

function logWarn(message, meta = {}) {
  console.warn(
    `[DeliveryWorker:${WORKER_NAME}] ${message}`,
    Object.keys(meta).length ? meta : ""
  );
}

function logError(message, meta = {}) {
  console.error(
    `[DeliveryWorker:${WORKER_NAME}] ${message}`,
    Object.keys(meta).length ? meta : ""
  );
}

/**
 * ==========================================================
 * SAFE ID FORMATTER
 * ==========================================================
 */

function stringifyId(value) {
  if (!value) {
    return null;
  }

  return value.toString();
}

/**
 * ==========================================================
 * MESSAGE STATUS HELPERS
 * ==========================================================
 *
 * Message statuses:
 *
 *   sending
 *   sent
 *   delivered
 *   read
 *   failed
 *
 * The worker only owns the transition:
 *
 *   sending -> sent
 *   sending -> failed
 *
 * Provider delivery/read callbacks may later transition:
 *
 *   sent -> delivered
 *   delivered -> read
 *
 * ==========================================================
 */

/**
 * Mark canonical Message as successfully sent.
 */
async function markMessageSent(
  job,
  transportResult
) {
  if (!job?.messageId) {
    return null;
  }

  const providerMessageId =
    transportResult?.providerMessageId ||
    transportResult?.messageId ||
    transportResult?.id ||
    null;

  const update = {
    status: "sent",
  };

  /**
   * Only set providerMessageId if the current Message schema
   * actually supports it.
   *
   * Since the supplied Message model does not currently define
   * providerMessageId, do NOT persist it here.
   *
   * DeliveryJob owns providerMessageId.
   */

  const message = await Message.findOneAndUpdate(
    {
  _id: job.messageId,
  organizationId: job.organizationId,
  status: {
    $in: ["sending", "sent"],
  },
},
    {
      $set: update,
    },
    {
      returnDocument: 'after',
    }
  );

  if (!message) {
    logWarn(
      "Message not found while marking delivery successful.",
      {
        messageId: stringifyId(job.messageId),
        organizationId: stringifyId(
          job.organizationId
        ),
        deliveryJobId: stringifyId(job._id),
      }
    );

    return null;
  }

  return message;
}

/**
 * ==========================================================
 * SYNCHRONIZE MESSAGE AFTER DELIVERY FAILURE
 * ==========================================================
 *
 * Message status reflects the overall delivery lifecycle,
 * not merely the outcome of an individual attempt.
 *
 * Retry scheduled:
 *   Message remains sending.
 *
 * Delivery permanently failed:
 *   Message becomes failed.
 *
 * A stale worker must not overwrite a Message that has
 * already reached a terminal or more advanced state.
 *
 * ==========================================================
 */

async function synchronizeMessageAfterDeliveryFailure(
  job,
  failureResult
) {
  if (!job?.messageId) {
    return null;
  }

  /**
   * A null result means the job was not updated.
   *
   * This can happen if the worker's lease is no longer valid
   * or another worker has already changed the job.
   *
   * Do not modify the Message without a confirmed outcome.
   */
  if (!failureResult) {
    logWarn(
      "Skipping Message failure synchronization because DeliveryJob failure was not recorded.",
      {
        deliveryJobId: stringifyId(job._id),
        messageId: stringifyId(job.messageId),
        organizationId: stringifyId(job.organizationId),
      }
    );

    return null;
  }

  /**
   * Another delivery attempt is scheduled.
   *
   * Leave the canonical Message in its current state.
   *
   * In the normal case it remains "sending".
   */
  if (failureResult.status === "failed") {
    logInfo(
      "Delivery failed temporarily; Message remains retryable.",
      {
        deliveryJobId: stringifyId(job._id),
        messageId: stringifyId(job.messageId),
        attempts: failureResult.attempts,
        nextAttemptAt: failureResult.nextAttemptAt,
      }
    );

    return null;
  }

  /**
   * The job is permanently dead.
   *
   * Update only Messages still in "sending".
   *
   * This avoids downgrading a Message that a provider callback
   * or another process has already advanced to "sent",
   * "delivered", or "read".
   */
  if (failureResult.status === "dead") {
    const message = await Message.findOneAndUpdate(
      {
        _id: job.messageId,
        organizationId: job.organizationId,
        status: "sending",
      },
      {
        $set: {
          status: "failed",
        },
      },
      {
        returnDocument: "after",
      }
    );

    if (!message) {
      logWarn(
        "Message was not changed to failed because it was missing or no longer sending.",
        {
          deliveryJobId: stringifyId(job._id),
          messageId: stringifyId(job.messageId),
          organizationId: stringifyId(job.organizationId),
        }
      );
    }

    return message;
  }

  /**
   * Unexpected status: fail safely and leave the Message
   * unchanged rather than guessing.
   */
  logWarn(
    "Unrecognized DeliveryJob failure status; Message was not changed.",
    {
      deliveryJobId: stringifyId(job._id),
      messageId: stringifyId(job.messageId),
      status: failureResult.status,
    }
  );

  return null;
}


/**
 * ==========================================================
 * MESSAGE VALIDATION
 * ==========================================================
 */

function validateDeliveryMessage(
  job,
  message
) {
  const errors = [];

  if (!job) {
    errors.push("DeliveryJob is missing.");
  }

  if (!message) {
    errors.push("Message is missing.");
  }

  if (job && !job.organizationId) {
    errors.push(
      "DeliveryJob organizationId is missing."
    );
  }

  if (message && !message.organizationId) {
    errors.push(
      "Message organizationId is missing."
    );
  }

  /**
   * Tenant isolation.
   *
   * A DeliveryJob must NEVER be allowed to deliver a Message
   * belonging to another organization.
   */
  if (
    job &&
    message &&
    stringifyId(job.organizationId) !==
      stringifyId(message.organizationId)
  ) {
    errors.push(
      "DeliveryJob and Message organizationId do not match."
    );
  }

  if (
    message &&
    !message.conversationId
  ) {
    errors.push(
      "Message conversationId is missing."
    );
  }

  if (
    message &&
    !message.text?.trim()
  ) {
    errors.push(
      "Message text is empty."
    );
  }

  if (
    job &&
    !job.source
  ) {
    errors.push(
      "DeliveryJob source is missing."
    );
  }

  if (
    job &&
    !job.recipient
  ) {
    errors.push(
      "DeliveryJob recipient is missing."
    );
  }

  if (
    message &&
    message.senderRole !== "ai"
  ) {
    errors.push(
      `Expected AI message but received senderRole="${message.senderRole}".`
    );
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * ==========================================================
 * LOAD MESSAGE
 * ==========================================================
 *
 * Always scope by organizationId.
 *
 * This is deliberate tenant isolation.
 */

async function loadDeliveryMessage(job) {
  if (!job?.messageId) {
    return null;
  }

  return Message.findOne({
    _id: job.messageId,
    organizationId: job.organizationId,
  });
}

/**
 * ==========================================================
 * BUILD TRANSPORT CONTEXT
 * ==========================================================
 */

function buildTransportContext(
  job,
  message
) {
  return {
    organizationId:
      job.organizationId || null,

    leadId:
      job.leadId ||
      message?.leadId ||
      null,

    conversationId:
      job.conversationId ||
      message?.conversationId ||
      null,

    messageId:
      message?._id ||
      job.messageId ||
      null,

    deliveryJobId:
      job._id ||
      null,

    source:
      job.source ||
      message?.source ||
      null,

    provider:
      job.provider ||
      null,

    channelMetadata:
      job.channelMetadata ||
      {},

    metadata:
      job.metadata ||
      {},

    /**
     * Useful for providers that eventually support
     * idempotency keys.
     */
    idempotencyKey:
      job.idempotencyKey ||
      null,
  };
}

/**
 * ==========================================================
 * TRANSPORT RESULT NORMALIZATION
 * ==========================================================
 *
 * Different transports may return slightly different
 * response shapes.
 *
 * Normalize enough for the worker without changing the
 * transport service contract.
 */

function normalizeTransportResult(
  result
) {
  if (!result) {
    return {
      success: false,
      reason:
        "Transport returned no result.",
    };
  }

  return {
    success:
      result.success === true,

    transport:
      result.transport ||
      null,

    provider:
      result.provider ||
      null,

    providerMessageId:
      result.providerMessageId ||
      result.messageId ||
      result.id ||
      null,

    reason:
      result.reason ||
      result.error ||
      null,

    error:
      result.error ||
      null,

    raw: result,
  };
}

/**
 * ==========================================================
 * PROCESS ONE DELIVERY JOB
 * ==========================================================
 */

async function processDeliveryJob(job) {
  if (!job) {
    stats.skipped += 1;

    return {
      success: false,
      skipped: true,
      reason: "No DeliveryJob supplied.",
    };
  }

  activeJobs += 1;
  stats.claimed += 1;

  const jobId =
    stringifyId(job._id);

  const messageId =
    stringifyId(job.messageId);

  const organizationId =
    stringifyId(job.organizationId);

  logInfo(
    "Processing DeliveryJob.",
    {
      deliveryJobId: jobId,
      messageId,
      organizationId,
      source: job.source,
      provider: job.provider,
      attempt: job.attempts,
      maxAttempts: job.maxAttempts,
    }
  );

  try {
    /**
     * ------------------------------------------------------
     * STEP 1 — LOAD CANONICAL MESSAGE
     * ------------------------------------------------------
     */

    const message =
      await loadDeliveryMessage(job);

    if (!message) {
      const reason =
        "Canonical Message not found for DeliveryJob.";

      logError(reason, {
        deliveryJobId: jobId,
        messageId,
        organizationId,
      });

      const failureResult =
        await markDeliveryJobFailed({
          jobId: job._id,
          lockToken: job.lockToken,
          error: reason,
          organizationId: job.organizationId,
        });

      await synchronizeMessageAfterDeliveryFailure(
        job,
        failureResult
      );

      if (failureResult?.status === "dead") {
        stats.dead += 1;
      } else {
        stats.failed += 1;
      }

      return {
        success: false,
        dead: failureResult?.status === "dead",
        reason,
      };
    }

    /**
     * ------------------------------------------------------
     * STEP 2 — VALIDATE MESSAGE
     * ------------------------------------------------------
     */

    const validation =
      validateDeliveryMessage(
        job,
        message
      );

    if (!validation.valid) {
      stats.invalidMessages += 1;

      const reason =
        `Invalid delivery message: ${validation.errors.join(
          " "
        )}`;

      logError(reason, {
        deliveryJobId: jobId,
        messageId,
        organizationId,
        errors: validation.errors,
      });

      const failureResult =
        await markDeliveryJobFailed({
  jobId: job._id,
  lockToken: job.lockToken,
  error: reason,
  organizationId: job.organizationId,
});

      /**
       * The canonical Message is invalid. Do not pretend
       * transport was attempted.
       */
      await synchronizeMessageAfterDeliveryFailure(
  job,
  failureResult
);

      if (
        failureResult?.status ===
        "dead"
      ) {
        stats.dead += 1;
      } else {
        stats.failed += 1;
      }

      return {
        success: false,
        dead:
          failureResult?.status ===
          "dead",
        reason,
      };
    }

    /**
     * ------------------------------------------------------
     * STEP 3 — BUILD TRANSPORT CONTEXT
     * ------------------------------------------------------
     */

    const transportContext =
      buildTransportContext(
        job,
        message
      );

    /**
     * ------------------------------------------------------
     * STEP 4 — SEND THROUGH CENTRAL TRANSPORT SERVICE
     * ------------------------------------------------------
     *
     * IMPORTANT:
     *
     * The worker does NOT know how WhatsApp/SMS/etc.
     * actually work.
     *
     * It delegates to messageTransportService.
     */

    logInfo(
      "Sending outbound message through transport.",
      {
        deliveryJobId: jobId,
        messageId,
        source: job.source,
        provider: job.provider,
        recipient: job.recipient,
      }
    );

       let transportResult;

    // ------------------------------------------------------
    // STEP 4A — DURABLY RECORD TRANSPORT ATTEMPT
    // ------------------------------------------------------
    //
    // If this update fails, do not call the provider.
    // This protects against sending without a durable record
    // that the transport attempt is about to begin.
    //
    // ------------------------------------------------------

    const transportAttempt =
      await markDeliveryJobTransportAttempted({
        jobId: job._id,
        lockToken: job.lockToken,
        organizationId: job.organizationId,
      });

    if (transportAttempt) {
  job.transportAttemptedAt =
    transportAttempt.transportAttemptedAt;
}

    if (!transportAttempt) {
      logWarn(
        "Transport was not started because the delivery job could not record its transport attempt.",
        {
          deliveryJobId: jobId,
          messageId,
          organizationId,
        }
      );

      return {
        success: false,
        skipped: true,
        reason: "transport_attempt_marker_not_recorded",
      };
    }

    // ------------------------------------------------------
    // STEP 4B — START LEASE HEARTBEAT AND SEND
    // ------------------------------------------------------

    const stopHeartbeat =
      startDeliveryLeaseHeartbeat(job);

    try {
      transportResult =
        await sendOutboundMessage({
          source: job.source,
          phone: job.recipient,
          message: message.text,
          context: transportContext,
        });
    } catch (transportError) {
      const reason =
        transportError?.message ||
        "Outbound transport failed.";

      // The provider may have accepted the message even
      // though the application received an error.
      const reconciliationJob =
        await markDeliveryJobReconciliationRequired({
          jobId: job._id,
          lockToken: job.lockToken,
          error: reason,
          organizationId: job.organizationId,
        });

      if (reconciliationJob) {
        logWarn(
          "Transport outcome is uncertain; automatic retry has been prevented.",
          {
            deliveryJobId: jobId,
            messageId,
            organizationId,
            reconciliationRequired: true,
          }
        );

        return {
          success: false,
          reconciliationRequired: true,
          reason: "transport_outcome_uncertain",
          deliveryJob: reconciliationJob,
        };
      }

      // The lock may have changed while the request was
      // in flight. Do not overwrite another worker's state.
      logWarn(
        "Transport threw an error, but reconciliation could not be recorded with the current lock.",
        {
          deliveryJobId: jobId,
          messageId,
          organizationId,
        }
      );

      return {
        success: false,
        reconciliationRequired: true,
        reason: "transport_error_reconciliation_write_failed",
      };
    } finally {
      await stopHeartbeat();
    }

    /**
     * ------------------------------------------------------
     * STEP 5 — NORMALIZE TRANSPORT RESULT
     * ------------------------------------------------------
     */

    const normalizedTransportResult =
      normalizeTransportResult(
        transportResult
      );

    /**
     * ------------------------------------------------------
     * STEP 6 — TRANSPORT FAILURE
     * ------------------------------------------------------
     */
    if (!normalizedTransportResult.success) {
      stats.transportFailures += 1;

      const reason =
        normalizedTransportResult.reason ||
        "Outbound transport failed.";

      logWarn(
        "Outbound transport reported failure; reconciliation is required because transport was attempted.",
        {
          deliveryJobId: jobId,
          messageId,
          organizationId,
          source: job.source,
          provider:
            normalizedTransportResult.provider ||
            job.provider,
          reconciliationRequired: true,
        }
      );

      const reconciliationJob =
        await markDeliveryJobReconciliationRequired({
          jobId: job._id,
          lockToken: job.lockToken,
          error: reason,
          organizationId: job.organizationId,
          providerMessageId:
            normalizedTransportResult.providerMessageId ||
            null,
        });

      if (!reconciliationJob) {
        logError(
          "Transport returned failure, but reconciliation could not be recorded with the current lock.",
          {
            deliveryJobId: jobId,
            messageId,
            organizationId,
          }
        );

        return {
          success: false,
          reconciliationRequired: true,
          reason: "transport_failure_reconciliation_write_failed",
        };
      }

      logWarn(
        "DeliveryJob requires manual reconciliation; automatic retry was prevented.",
        {
          deliveryJobId: jobId,
          messageId,
          organizationId,
        }
      );

      return {
        success: false,
        reconciliationRequired: true,
        reason: "transport_outcome_uncertain",
        deliveryJob: reconciliationJob,
      };
    }

    /**
     * ------------------------------------------------------
     * STEP 7 — TRANSPORT SUCCESS
     * ------------------------------------------------------
     */

    logInfo(
      "Outbound transport succeeded.",
      {
        deliveryJobId: jobId,
        messageId,
        organizationId,
        source: job.source,
        provider:
          normalizedTransportResult.provider ||
          job.provider,
        providerMessageId:
          normalizedTransportResult.providerMessageId,
      }
    );

    /**
     * ------------------------------------------------------
     * STEP 8 — MARK DELIVERY JOB SENT
     * ------------------------------------------------------
     */

const sentJob = await markDeliveryJobSent({
  jobId: job._id,
  lockToken: job.lockToken,
  providerMessageId:
    normalizedTransportResult.providerMessageId || null,
  organizationId: job.organizationId,
});

/**
 * ------------------------------------------------------
 * STEP 8A — VERIFY DELIVERY JOB UPDATE
 * ------------------------------------------------------
 *
 * The provider has already accepted the message.
 *
 * If this worker lost its lease, do not:
 * - Claim successful job completion.
 * - Change the canonical Message.
 * - Automatically resend the message.
 *
 * Another worker or recovery process must reconcile
 * the DeliveryJob without risking a duplicate send.
 *
 * ------------------------------------------------------
 */

if (!sentJob) {
  logWarn(
    "Transport succeeded, but DeliveryJob could not be marked sent because the worker lease or job state changed.",
    {
      deliveryJobId: jobId,
      messageId,
      organizationId,
      provider: normalizedTransportResult.provider || job.provider,
      hasProviderMessageId: Boolean(
        normalizedTransportResult.providerMessageId
      ),
    }
  );

  return {
    success: false,
    reconciliationRequired: true,
    reason: "delivery_job_state_changed_after_transport_success",
  };
}

/**
 * ------------------------------------------------------
 * STEP 9 — UPDATE CANONICAL MESSAGE
 * ------------------------------------------------------
 */

const synchronizedMessage = await markMessageSent(
  job,
  normalizedTransportResult
);

if (!synchronizedMessage) {
  logError(
    "Provider accepted the message, but canonical Message synchronization failed.",
    {
      deliveryJobId: jobId,
      messageId,
      organizationId,
      provider: normalizedTransportResult.provider || job.provider,
      hasProviderMessageId: Boolean(
        normalizedTransportResult.providerMessageId
      ),
      deliveryJobStatus: sentJob.status,
      synchronizationRequired: true,
    }
  );

  return {
    success: false,
    transportSucceeded: true,
    messageSynchronized: false,
    reconciliationRequired: false,
    reason: "message_synchronization_failed_after_transport_success",
    deliveryJob: sentJob,
  };
}

stats.sent += 1;

    logInfo(
      "DeliveryJob completed successfully.",
      {
        deliveryJobId: jobId,
        messageId,
        organizationId,
        providerMessageId:
          normalizedTransportResult.providerMessageId,
      }
    );

    return {
      success: true,

      deliveryJob:
        sentJob,

      transport:
        normalizedTransportResult,
    };
  } catch (error) {
    /**
     * ======================================================
     * UNEXPECTED PROCESSING ERROR
     * ======================================================
     */

    stats.processingErrors += 1;

    const reason =
      error?.message ||
      "Unexpected DeliveryJob processing error.";

    logError(
      "Unexpected DeliveryJob processing error.",
      {
        deliveryJobId: jobId,
        messageId,
        organizationId,
        error: reason,
        stack: error?.stack,
      }
    );

    /**
     * Important:
     *
     * We still attempt to transition the DeliveryJob
     * through the durable failure mechanism.
     */
    try {
            // A processing exception after transport was attempted
      // must not trigger an automatic retry.
      if (job.transportAttemptedAt) {
        const reconciliationJob =
          await markDeliveryJobReconciliationRequired({
            jobId: job._id,
            lockToken: job.lockToken,
            error: reason,
            organizationId: job.organizationId,
          });

        if (reconciliationJob) {
          logWarn(
            "Unexpected processing error after transport attempt; manual reconciliation required.",
            {
              deliveryJobId: jobId,
              messageId,
              organizationId,
            }
          );

          return {
            success: false,
            reconciliationRequired: true,
            reason: "unexpected_error_after_transport_attempt",
            deliveryJob: reconciliationJob,
          };
        }

        logError(
          "Unable to record reconciliation after an unexpected processing error.",
          {
            deliveryJobId: jobId,
            messageId,
            organizationId,
          }
        );

        return {
          success: false,
          reconciliationRequired: true,
          reason: "unexpected_error_reconciliation_write_failed",
        };
      }

      const failureResult =
        await markDeliveryJobFailed({
  jobId: job._id,
  lockToken: job.lockToken,
  error: reason,
  organizationId: job.organizationId,
});

      await synchronizeMessageAfterDeliveryFailure(
  job,
  failureResult
);

      if (
        failureResult?.status ===
        "dead"
      ) {
        stats.dead += 1;
      } else {
        stats.failed += 1;
      }

      return {
        success: false,
        dead:
          failureResult?.status ===
          "dead",
        reason,
      };
    } catch (failureUpdateError) {
      /**
       * This is particularly important.
       *
       * If we cannot even update DeliveryJob state,
       * the lease may expire naturally and another worker
       * can recover it.
       */

      logError(
        "CRITICAL: Unable to record DeliveryJob failure.",
        {
          deliveryJobId: jobId,
          messageId,
          originalError: reason,
          failureUpdateError:
            failureUpdateError?.message,
        }
      );

      return {
        success: false,
        reason,
        stateUpdateFailed: true,
      };
    }
  } finally {
    activeJobs -= 1;
  }
}

/**
 * ==========================================================
 * CLAIM AND PROCESS ONE JOB
 * ==========================================================
 */

async function claimAndProcessOne() {
  if (
    workerStopping ||
    !workerRunning
  ) {
    return {
      success: false,
      stopped: true,
    };
  }

  let job = null;

  try {
    /**
     * Atomic claim.
     *
     * deliveryJobService guarantees that two workers should
     * not receive the same active job.
     */
    job =
      await claimNextDeliveryJob({
        workerName:
          WORKER_NAME,
      });
  } catch (error) {
    logError(
      "Failed to claim DeliveryJob.",
      {
        error:
          error?.message,
        stack:
          error?.stack,
      }
    );

    return {
      success: false,
      claimError: true,
    };
  }

  if (!job) {
    return {
      success: false,
      empty: true,
    };
  }

  return processDeliveryJob(job);
}

/**
 * ==========================================================
 * PROCESS BATCH
 * ==========================================================
 */

async function processBatch() {
  if (
    workerStopping ||
    !workerRunning
  ) {
    return;
  }

  lastPollAt =
    new Date();

  /**
   * Process a bounded batch.
   *
   * Promise.all is intentionally NOT used here.
   *
   * Sequential processing keeps provider pressure predictable
   * and makes worker behavior easier to reason about.
   *
   * Multiple worker processes can still run concurrently,
   * because job claiming is atomic.
   */

  for (
    let index = 0;
    index < SAFE_BATCH_SIZE;
    index += 1
  ) {
    if (
      workerStopping ||
      !workerRunning
    ) {
      break;
    }

    const result =
      await claimAndProcessOne();

    /**
     * No more available work.
     */
    if (
      result?.empty ||
      result?.stopped
    ) {
      break;
    }
  }
}

/**
 * ==========================================================
 * POLLING LOOP
 * ==========================================================
 */

function scheduleNextPoll() {
  if (
    workerStopping ||
    !workerRunning
  ) {
    return;
  }

  clearTimeout(
    pollTimer
  );

  pollTimer =
    setTimeout(
      async () => {
        try {
          await processBatch();
        } catch (error) {
          logError(
            "Unhandled polling loop error.",
            {
              error:
                error?.message,
              stack:
                error?.stack,
            }
          );
        } finally {
          scheduleNextPoll();
        }
      },
      SAFE_POLL_INTERVAL_MS
    );
}

/**
 * ==========================================================
 * STALE JOB RECOVERY
 * ==========================================================
 *
 * If a worker crashes after claiming a job:
 *
 *   DeliveryJob = processing
 *   lockExpiresAt = past
 *
 * Another worker must eventually recover it.
 *
 * This prevents permanent stuck jobs.
 */

async function recoverStaleJobs() {
  if (
    workerStopping ||
    !workerRunning
  ) {
    return;
  }

  lastRecoveryAt =
    new Date();

  try {
    const result =
      await recoverStaleDeliveryJobs({
        workerName:
          WORKER_NAME,
      });

    const recoveredJobs = Array.isArray(result?.jobs)
  ? result.jobs
  : [];

const recoveredCount = Number(
  result?.recovered ??
    result?.recoveredCount ??
    result?.modifiedCount ??
    result?.count ??
    0
);

stats.staleJobsRecovered += recoveredCount;

/**
 * A stale job may become dead when its maximum attempts
 * have been exhausted.
 *
 * Synchronize its canonical Message as well.
 */
for (const recoveredJob of recoveredJobs) {
  if (recoveredJob?.status !== "dead") {
    continue;
  }

  try {
    await Message.findOneAndUpdate(
      {
        _id: recoveredJob.messageId,
        organizationId: recoveredJob.organizationId,
        status: "sending",
      },
      {
        $set: {
          status: "failed",
        },
      },
      {
        returnDocument: "after",
      }
    );
  } catch (error) {
    logError(
      "Failed to synchronize Message after stale DeliveryJob became dead.",
      {
        deliveryJobId: stringifyId(recoveredJob._id),
        messageId: stringifyId(recoveredJob.messageId),
        organizationId: stringifyId(
          recoveredJob.organizationId
        ),
        error: error?.message,
      }
    );
  }
}

if (recoveredCount > 0) {
  logWarn(
    "Recovered stale DeliveryJobs.",
    {
      recoveredCount,
    }
  );
}

  } catch (error) {
    logError(
      "Failed to recover stale DeliveryJobs.",
      {
        error: error?.message,
        stack: error?.stack,
      }
    );
  }
}

/**
 * ==========================================================
 * START WORKER
 * ==========================================================
 */

async function startDeliveryWorker() {
  if (workerRunning) {
    logWarn(
      "Delivery worker is already running."
    );

    return getWorkerStatus();
  }

  workerStopping = false;
  workerRunning = true;

  stats.startedAt =
    new Date();

  logInfo(
    "Delivery worker starting.",
    {
      pollIntervalMs:
        SAFE_POLL_INTERVAL_MS,

      batchSize:
        SAFE_BATCH_SIZE,

      staleRecoveryIntervalMs:
        SAFE_STALE_RECOVERY_INTERVAL_MS,

      shutdownTimeoutMs:
        SAFE_SHUTDOWN_TIMEOUT_MS,
    }
  );

  /**
   * Recover stale jobs immediately on startup.
   */
  await recoverStaleJobs();

  /**
   * Start periodic stale-job recovery.
   */
  clearInterval(
    recoveryTimer
  );

  recoveryTimer =
    setInterval(
      () => {
        recoverStaleJobs()
          .catch((error) => {
            logError(
              "Stale recovery timer failed.",
              {
                error:
                  error?.message,
              }
            );
          });
      },
      SAFE_STALE_RECOVERY_INTERVAL_MS
    );

  /**
   * Process immediately instead of waiting for the
   * first polling interval.
   */
  try {
    await processBatch();
  } catch (error) {
    logError(
      "Initial DeliveryJob batch failed.",
      {
        error:
          error?.message,
      }
    );
  }

  /**
   * Continue polling.
   */
  scheduleNextPoll();

  logInfo(
    "Delivery worker started successfully."
  );

  return getWorkerStatus();
}

/**
 * ==========================================================
 * STOP WORKER
 * ==========================================================
 */

async function stopDeliveryWorker(
  reason = "manual shutdown"
) {
  if (
    !workerRunning &&
    !workerStopping
  ) {
    return getWorkerStatus();
  }

  logInfo(
    "Stopping delivery worker.",
    {
      reason,
      activeJobs,
    }
  );

  workerStopping = true;

  clearTimeout(
    pollTimer
  );

  clearInterval(
    recoveryTimer
  );

  pollTimer = null;
  recoveryTimer = null;

  /**
   * Allow currently running job to finish.
   *
   * We do NOT abruptly release active jobs.
   *
   * If the process dies before completion, the lease will
   * expire and another worker can recover the job.
   */
  const shutdownStartedAt =
    Date.now();

  while (
    activeJobs > 0 &&
    Date.now() -
      shutdownStartedAt <
      SAFE_SHUTDOWN_TIMEOUT_MS
  ) {
    await new Promise(
      (resolve) =>
        setTimeout(
          resolve,
          250
        )
    );
  }

  if (activeJobs > 0) {
    logWarn(
      "Shutdown timeout reached while jobs are still active.",
      {
        activeJobs,
      }
    );
  }

  workerRunning = false;
  workerStopping = false;

  logInfo(
    "Delivery worker stopped.",
    {
      activeJobs,
    }
  );

  return getWorkerStatus();
}

/**
 * ==========================================================
 * WORKER STATUS
 * ==========================================================
 */

function getWorkerStatus() {
  return {
    workerName:
      WORKER_NAME,

    running:
      workerRunning,

    stopping:
      workerStopping,

    activeJobs,

    lastPollAt,

    lastRecoveryAt,

    stats: {
      ...stats,
    },

    configuration: {
      pollIntervalMs:
        SAFE_POLL_INTERVAL_MS,

      batchSize:
        SAFE_BATCH_SIZE,

      staleRecoveryIntervalMs:
        SAFE_STALE_RECOVERY_INTERVAL_MS,

      shutdownTimeoutMs:
        SAFE_SHUTDOWN_TIMEOUT_MS,
    },
  };
}

/**
 * ==========================================================
 * SINGLE-JOB PROCESSING API
 * ==========================================================
 *
 * Useful for:
 *
 * • tests
 * • debugging
 * • manual recovery
 * • future admin tooling
 *
 * This does NOT bypass the DeliveryJob lock.
 *
 * The supplied job should already be claimed.
 */

async function processClaimedDeliveryJob(
  job
) {
  if (!job) {
    throw new Error(
      "processClaimedDeliveryJob requires a DeliveryJob."
    );
  }

  return processDeliveryJob(
    job
  );
}

/**
 * ==========================================================
 * GRACEFUL PROCESS SIGNAL HANDLING
 * ==========================================================
 */

let signalHandlersRegistered =
  false;

function registerSignalHandlers() {
  if (
    signalHandlersRegistered
  ) {
    return;
  }

  signalHandlersRegistered =
    true;

  const shutdown =
    async (signal) => {
      logInfo(
        `Received ${signal}.`
      );

      try {
        await stopDeliveryWorker(
          signal
        );

        /**
         * Give stdout/stderr a moment to flush.
         */
        setTimeout(
          () => {
            process.exit(0);
          },
          100
        );
      } catch (error) {
        logError(
          "Graceful shutdown failed.",
          {
            signal,
            error:
              error?.message,
          }
        );

        process.exit(1);
      }
    };

  process.once(
    "SIGTERM",
    () => shutdown("SIGTERM")
  );

  process.once(
    "SIGINT",
    () => shutdown("SIGINT")
  );
}

/**
 * Register handlers when this module loads.
 *
 * Starting the worker itself remains explicit.
 */
registerSignalHandlers();

/**
 * ==========================================================
 * EXPORTS
 * ==========================================================
 */

export {
  startDeliveryWorker,
  stopDeliveryWorker,

  processDeliveryJob,
  processClaimedDeliveryJob,

  recoverStaleJobs,

  getWorkerStatus,

  validateDeliveryMessage,
  buildTransportContext,
  normalizeTransportResult,

  WORKER_NAME,
};