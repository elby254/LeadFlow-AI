/**
 * ==========================================================
 *
 * DELIVERY JOB SERVICE
 * LeadFlow AI
 *
 * ==========================================================
 *
 * Purpose
 * ----------------------------------------------------------
 * Central operational service for durable outbound message
 * delivery jobs.
 *
 * Responsibilities
 * ----------------------------------------------------------
 *
 * ✓ Create outbound delivery jobs
 * ✓ Enforce outbound idempotency
 * ✓ Atomically claim jobs
 * ✓ Prevent concurrent workers
 * ✓ Maintain worker leases
 * ✓ Track delivery attempts
 * ✓ Calculate retry delays
 * ✓ Mark jobs as sent
 * ✓ Mark jobs as failed
 * ✓ Move exhausted jobs to DEAD
 * ✓ Recover stale processing jobs
 * ✓ Manually retry failed/dead jobs
 * ✓ Provide delivery statistics
 *
 * IMPORTANT
 * ----------------------------------------------------------
 *
 * This service does NOT:
 *
 * ✗ Generate AI responses
 * ✗ Send messages directly
 * ✗ Call WhatsApp
 * ✗ Call Africa's Talking
 * ✗ Call website realtime transport
 * ✗ Mutate Lead lifecycle
 * ✗ Calculate Lead scores
 *
 * The architecture is:
 *
 * AI Reply
 *     ↓
 * Message
 *     ↓
 * DeliveryJobService
 *     ↓
 * DeliveryJob
 *     ↓
 * Delivery Worker
 *     ↓
 * messageTransportService
 *     ↓
 * Provider
 *
 * ==========================================================
 */

import crypto from "crypto";

import DeliveryJob, {
  DELIVERY_JOB_STATUS,
  DELIVERY_CHANNELS,
  DELIVERY_PROVIDERS,
} from "../models/deliveryJob.js";


// ==========================================================
// CONFIGURATION
// ==========================================================

const DEFAULT_MAX_ATTEMPTS =
  10;

const DEFAULT_LEASE_DURATION_MS =
  60 * 1000;

const DEFAULT_BASE_RETRY_DELAY_MS =
  2 * 1000;

const MAX_RETRY_DELAY_MS =
  5 * 60 * 1000;

const RETRY_JITTER_MS =
  1000;


// ==========================================================
// SAFE ERROR MESSAGE
// ==========================================================

const getErrorMessage = (
  error
) => {

  if (
    !error
  ) {

    return "Unknown delivery error.";
  }


  if (
    typeof error === "string"
  ) {

    return error;
  }


  return (
    error.message ||
    "Unknown delivery error."
  );
};


// ==========================================================
// SAFE OBJECT ID STRING
// ==========================================================

const normalizeId = (
  value
) => {

  if (
    value === null ||
    value === undefined
  ) {

    return null;
  }


  if (
    typeof value === "string"
  ) {

    return value.trim() ||
      null;
  }


  if (
    value?.toString
  ) {

    return value
      .toString()
      .trim() ||
      null;
  }


  return null;
};


// ==========================================================
// VALIDATE CHANNEL
// ==========================================================

const validateSource = (
  source
) => {

  const normalized =
    String(
      source || ""
    )
      .trim()
      .toLowerCase();


  if (
    !DELIVERY_CHANNELS.includes(
      normalized
    )
  ) {

    throw new Error(
      `Unsupported delivery source: "${source}".`
    );
  }


  return normalized;
};


// ==========================================================
// VALIDATE PROVIDER
// ==========================================================

const validateProvider = (
  provider
) => {

  if (
    provider === null ||
    provider === undefined ||
    provider === ""
  ) {

    return null;
  }


  const normalized =
    String(
      provider
    )
      .trim()
      .toLowerCase();


  if (
    !DELIVERY_PROVIDERS.includes(
      normalized
    )
  ) {

    throw new Error(
      `Unsupported delivery provider: "${provider}".`
    );
  }


  return normalized;
};


// ==========================================================
// PROVIDER RESOLUTION
// ==========================================================
//
// This is only a metadata resolver.
//
// Actual transport still belongs to
// messageTransportService.js.
//
// ==========================================================

export const resolveDeliveryProvider = (
  source
) => {

  const normalizedSource =
    validateSource(
      source
    );


  switch (
    normalizedSource
  ) {

    case "sms":

      return "africastalking";


    case "whatsapp":

      return "meta_whatsapp_cloud_api";


    case "website":

      return "realtime";


    case "facebook":

      return "facebook";


    default:

      return null;
  }
};


// ==========================================================
// IDEMPOTENCY KEY
// ==========================================================
//
// If the caller does not provide an explicit key, generate
// one from the Message ID.
//
// AI outbound messages should normally use:
//
//     ai-reply:<messageId>
//
// The caller can provide another deterministic key when
// needed.
//
// ==========================================================

export const buildDeliveryIdempotencyKey = ({
  messageId,
  idempotencyKey,
} = {}) => {

  const explicitKey =
    normalizeId(
      idempotencyKey
    );


  if (
    explicitKey
  ) {

    return explicitKey;
  }


  const normalizedMessageId =
    normalizeId(
      messageId
    );


  if (
    !normalizedMessageId
  ) {

    throw new Error(
      "messageId is required to build a delivery idempotency key."
    );
  }


  return `ai-reply:${normalizedMessageId}`;
};


// ==========================================================
// LOCK TOKEN
// ==========================================================

const createLockToken = () => {

  return crypto
    .randomUUID();
};


// ==========================================================
// WORKER NAME
// ==========================================================

const resolveWorkerName = (
  workerName
) => {

  const normalized =
    normalizeId(
      workerName
    );


  if (
    normalized
  ) {

    return normalized;
  }


  return (
    process.env
      .DELIVERY_WORKER_NAME ||
    `delivery-worker-${process.pid}`
  );
};


// ==========================================================
// RETRY DELAY
// ==========================================================
//
// Exponential backoff:
//
// attempt 1 → ~2 sec
// attempt 2 → ~4 sec
// attempt 3 → ~8 sec
// attempt 4 → ~16 sec
//
// capped at 5 minutes.
//
// Small jitter prevents many workers from retrying at exactly
// the same moment.
//
// ==========================================================

export const calculateRetryDelay = (
  attempts,
  {
    baseDelayMs =
      DEFAULT_BASE_RETRY_DELAY_MS,

    maxDelayMs =
      MAX_RETRY_DELAY_MS,

    jitterMs =
      RETRY_JITTER_MS,

  } = {}
) => {

  const normalizedAttempts =
    Math.max(
      1,
      Number(
        attempts || 1
      )
    );


  const exponentialDelay =
    baseDelayMs *
    Math.pow(
      2,
      normalizedAttempts - 1
    );


  const cappedDelay =
    Math.min(
      exponentialDelay,
      maxDelayMs
    );


  const jitter =
    jitterMs > 0
      ? Math.floor(
          Math.random() *
          jitterMs
        )
      : 0;


  return Math.min(
    cappedDelay +
      jitter,

    maxDelayMs
  );
};


// ==========================================================
// BUILD JOB DATA
// ==========================================================

const buildDeliveryJobData = ({
  organizationId,
  messageId,
  conversationId,
  leadId = null,
  source,
  recipient,
  provider = null,
  status =
    DELIVERY_JOB_STATUS.PENDING,
  maxAttempts =
    DEFAULT_MAX_ATTEMPTS,
  nextAttemptAt = new Date(),
  idempotencyKey,
  channelMetadata = {},
  metadata = {},
} = {}) => {

  const normalizedOrganizationId =
    normalizeId(
      organizationId
    );

  const normalizedMessageId =
    normalizeId(
      messageId
    );

  const normalizedConversationId =
    normalizeId(
      conversationId
    );

  const normalizedLeadId =
    normalizeId(
      leadId
    );

  const normalizedRecipient =
    String(
      recipient || ""
    ).trim();

  const normalizedSource =
    validateSource(
      source
    );

  const normalizedProvider =
    validateProvider(
      provider
    );

  const normalizedIdempotencyKey =
    buildDeliveryIdempotencyKey({
      messageId:
        normalizedMessageId,

      idempotencyKey,
    });


  if (
    !normalizedOrganizationId
  ) {

    throw new Error(
      "organizationId is required to create a DeliveryJob."
    );
  }


  if (
    !normalizedMessageId
  ) {

    throw new Error(
      "messageId is required to create a DeliveryJob."
    );
  }


  if (
    !normalizedConversationId
  ) {

    throw new Error(
      "conversationId is required to create a DeliveryJob."
    );
  }


  if (
    !normalizedRecipient
  ) {

    throw new Error(
      "recipient is required to create a DeliveryJob."
    );
  }


  const normalizedMaxAttempts =
    Math.max(
      1,
      Number(
        maxAttempts ||
          DEFAULT_MAX_ATTEMPTS
      )
    );


  return {

    organizationId:
      normalizedOrganizationId,

    messageId:
      normalizedMessageId,

    conversationId:
      normalizedConversationId,

    leadId:
      normalizedLeadId,

    source:
      normalizedSource,

    recipient:
      normalizedRecipient,

    provider:
      normalizedProvider,

    status,

    attempts: 0,

    maxAttempts:
      normalizedMaxAttempts,

    nextAttemptAt:

      nextAttemptAt instanceof Date
        ? nextAttemptAt
        : new Date(
            nextAttemptAt ||
              Date.now()
          ),

    lockToken:
      null,

    lockExpiresAt:
      null,

    lockedAt:
      null,

    workerName:
      null,

    providerMessageId:
      null,

    lastError:
      "",

    lastErrorAt:
      null,

    sentAt:
      null,

    failedAt:
      null,

    deadAt:
      null,

    deadReason:
      "",

    idempotencyKey:
      normalizedIdempotencyKey,

    channelMetadata:
      channelMetadata || {},

    metadata:
      metadata || {},

  };
};


// ==========================================================
// CREATE DELIVERY JOB
// ==========================================================
//
// Creates exactly one operational job for a logical outbound
// Message.
//
// Unique idempotencyKey protects against duplicate creation.
//
// ==========================================================

export const createDeliveryJob =
  async ({
    organizationId,
    messageId,
    conversationId,
    leadId = null,
    source,
    recipient,
    provider = null,
    maxAttempts =
      DEFAULT_MAX_ATTEMPTS,
    nextAttemptAt =
      new Date(),
    idempotencyKey,
    channelMetadata = {},
    metadata = {},
    session = null,
  } = {}) => {

    const jobData =
      buildDeliveryJobData({
        organizationId,
        messageId,
        conversationId,
        leadId,
        source,
        recipient,
        provider:
          provider ||
          resolveDeliveryProvider(
            source
          ),
        maxAttempts,
        nextAttemptAt,
        idempotencyKey,
        channelMetadata,
        metadata,
      });


    try {

      const options =
        session
          ? { session }
          : {};


      const [job] =
        await DeliveryJob.create(
          [jobData],
          options
        );


      return {

        created: true,

        duplicate: false,

        job,

      };

    } catch (
      error
    ) {

      // ------------------------------------------------------
      // Duplicate idempotency key
      // ------------------------------------------------------

      if (
        error?.code === 11000 &&
        error?.keyPattern
          ?.idempotencyKey
      ) {

        if (
          session
        ) {

          throw error;
        }


        const existingJob =
          await DeliveryJob.findOne({
            idempotencyKey:
              jobData.idempotencyKey,

            organizationId:
              jobData.organizationId,
          });


        if (
          existingJob
        ) {

          return {

            created: false,

            duplicate: true,

            job:
              existingJob,

          };
        }
      }


      throw error;
    }
  };


// ==========================================================
// GET DELIVERY JOB
// ==========================================================

export const getDeliveryJob =
  async (
    jobId,
    {
      organizationId = null,
      session = null,
    } = {}
  ) => {

    const normalizedJobId =
      normalizeId(
        jobId
      );


    if (
      !normalizedJobId
    ) {

      return null;
    }


    const query = {

      _id:
        normalizedJobId,

    };


    if (
      organizationId
    ) {

      query.organizationId =
        organizationId;
    }


    const queryBuilder =
      DeliveryJob.findOne(
        query
      );


    if (
      session
    ) {

      queryBuilder.session(
        session
      );
    }


    return queryBuilder;
  };


// ==========================================================
// GET BY IDEMPOTENCY KEY
// ==========================================================

export const getDeliveryJobByIdempotencyKey =
  async (
    idempotencyKey,
    {
      organizationId = null,
    } = {}
  ) => {

    const normalizedKey =
      normalizeId(
        idempotencyKey
      );


    if (
      !normalizedKey
    ) {

      return null;
    }


    const query = {

      idempotencyKey:
        normalizedKey,

    };


    if (
      organizationId
    ) {

      query.organizationId =
        organizationId;
    }


    return DeliveryJob.findOne(
      query
    );
  };


// ==========================================================
// GET JOB BY MESSAGE
// ==========================================================

export const getDeliveryJobByMessageId =
  async (
    messageId,
    {
      organizationId = null,
    } = {}
  ) => {

    const normalizedMessageId =
      normalizeId(
        messageId
      );


    if (
      !normalizedMessageId
    ) {

      return null;
    }


    const query = {

      messageId:
        normalizedMessageId,

    };


    if (
      organizationId
    ) {

      query.organizationId =
        organizationId;
    }


    return DeliveryJob.findOne(
      query
    )
      .sort({
        createdAt: -1,
      });
  };


// ==========================================================
// COUNT PENDING JOBS
// ==========================================================

export const countPendingDeliveryJobs =
  async ({
    organizationId = null,
  } = {}) => {

    const query = {

      status:
        DELIVERY_JOB_STATUS.PENDING,

      nextAttemptAt: {
        $lte: new Date(),
      },

    };


    if (
      organizationId
    ) {

      query.organizationId =
        organizationId;
    }


    return DeliveryJob.countDocuments(
      query
    );
  };


// ==========================================================
// CLAIM NEXT DELIVERY JOB
// ==========================================================
//
// Atomic worker claim.
//
// The query guarantees that only one worker can successfully
// transition the job into PROCESSING for a given lease.
//
// Eligible jobs:
//
// pending and due
//
// OR
//
// failed and due
//
// OR
//
// processing but lease expired
//
// ==========================================================

export const claimNextDeliveryJob =
  async ({
    workerName = null,
    leaseDurationMs =
      DEFAULT_LEASE_DURATION_MS,
  } = {}) => {

    const now =
      new Date();

    const lockToken =
      createLockToken();

    const resolvedWorkerName =
      resolveWorkerName(
        workerName
      );

    const lockExpiresAt =
      new Date(
        now.getTime() +
          leaseDurationMs
      );


        const query = {

      reconciliationRequired: {
        $ne: true,
      },

      $or: [

        {

          status:
            DELIVERY_JOB_STATUS.PENDING,

          nextAttemptAt: {
            $lte: now,
          },

        },

        {

          status:
            DELIVERY_JOB_STATUS.FAILED,

          nextAttemptAt: {
            $lte: now,
          },

        },

        {

          status:
            DELIVERY_JOB_STATUS.PROCESSING,

          lockExpiresAt: {
            $lte: now,
          },

        },

        {

          status:
            DELIVERY_JOB_STATUS.PROCESSING,

          lockExpiresAt: null,

        },

      ],

    };


    const update = {

      $set: {

        status:
          DELIVERY_JOB_STATUS.PROCESSING,

        lockToken,

        lockedAt:
          now,

        lockExpiresAt,

        workerName:
          resolvedWorkerName,

        failedAt:
          null,

      },

      $inc: {

        attempts: 1,

      },

    };


    const options = {

      sort: {

        nextAttemptAt: 1,

        createdAt: 1,

      },

      returnDocument: 'after',

    };


    const job =
      await DeliveryJob.findOneAndUpdate(
        query,
        update,
        options
      );


    if (
      !job
    ) {

      return null;
    }


    return job;
  };


// ==========================================================
// CLAIM SPECIFIC DELIVERY JOB
// ==========================================================
//
// Useful for manual retry, targeted processing, and tests.
//
// ==========================================================

export const claimDeliveryJob =
  async (
    jobId,
    {
      workerName = null,
      leaseDurationMs =
        DEFAULT_LEASE_DURATION_MS,
      organizationId = null,
    } = {}
  ) => {

    const normalizedJobId =
      normalizeId(
        jobId
      );


    if (
      !normalizedJobId
    ) {

      throw new Error(
        "jobId is required to claim a DeliveryJob."
      );
    }


    const now =
      new Date();

    const lockToken =
      createLockToken();

    const resolvedWorkerName =
      resolveWorkerName(
        workerName
      );

    const lockExpiresAt =
      new Date(
        now.getTime() +
          leaseDurationMs
      );


        const query = {

      _id:
        normalizedJobId,

      reconciliationRequired: {
        $ne: true,
      },

      $or: [

        {

          status:
            DELIVERY_JOB_STATUS.PENDING,

        },

        {

          status:
            DELIVERY_JOB_STATUS.FAILED,

          nextAttemptAt: {
            $lte: now,
          },

        },

        {

          status:
            DELIVERY_JOB_STATUS.PROCESSING,

          lockExpiresAt: {
            $lte: now,
          },

        },

        {

          status:
            DELIVERY_JOB_STATUS.PROCESSING,

          lockExpiresAt: null,

        },

      ],

    };


    if (
      organizationId
    ) {

      query.organizationId =
        organizationId;
    }


    const job =
      await DeliveryJob.findOneAndUpdate(

        query,

        {

          $set: {

            status:
              DELIVERY_JOB_STATUS.PROCESSING,

            lockToken,

            lockedAt:
              now,

            lockExpiresAt,

            workerName:
              resolvedWorkerName,

            failedAt:
              null,

          },

          $inc: {

            attempts: 1,

          },

        },

        {

          returnDocument: 'after',

        }

      );


    return job;
  };


// ==========================================================
// MARK TRANSPORT ATTEMPTED
// ==========================================================
//
// Persisted immediately before outbound transport begins.
//
// Only the worker holding the current lock may set this
// marker. It is NOT proof that the provider accepted a
// message; it means the outcome may become uncertain.
//
// ==========================================================

export const markDeliveryJobTransportAttempted =
  async ({
    jobId,
    lockToken,
    organizationId = null,
  } = {}) => {
    const normalizedJobId =
      normalizeId(jobId);

    const normalizedLockToken =
      normalizeId(lockToken);

    if (!normalizedJobId) {
      throw new Error(
        "jobId is required to mark transport attempted."
      );
    }

    if (!normalizedLockToken) {
      throw new Error(
        "lockToken is required to mark transport attempted."
      );
    }

    const now = new Date();

    return DeliveryJob.findOneAndUpdate(
      {
        _id: normalizedJobId,
        status: DELIVERY_JOB_STATUS.PROCESSING,
        lockToken: normalizedLockToken,

        // Do not begin a second transport attempt after an
        // earlier attempt has an uncertain outcome.
        transportAttemptedAt: null,
        reconciliationRequired: {
          $ne: true,
        },

        ...(organizationId
          ? { organizationId }
          : {}),
      },
      {
        $set: {
          transportAttemptedAt: now,
        },
      },
      {
        returnDocument: "after",
      }
    );
  };


// ==========================================================
// MARK DELIVERY JOB FOR RECONCILIATION
// ==========================================================
//
// Used when transport may have reached the provider, but
// the application cannot establish the final outcome.
//
// The job remains PROCESSING but loses its lease and is
// excluded from automatic claims by reconciliationRequired.
//
// IMPORTANT:
// - Lock-token fenced.
// - Does not schedule an automatic retry.
// - Does not mark the canonical Message failed.
// - Requires explicit reconciliation before retrying.
//
// ==========================================================

export const markDeliveryJobReconciliationRequired =
  async ({
    jobId,
    lockToken,
    error,
    organizationId = null,
    providerMessageId = null,
  } = {}) => {
    const normalizedJobId =
      normalizeId(jobId);

    const normalizedLockToken =
      normalizeId(lockToken);

    if (!normalizedJobId) {
      throw new Error(
        "jobId is required to mark reconciliation required."
      );
    }

    if (!normalizedLockToken) {
      throw new Error(
        "lockToken is required to mark reconciliation required."
      );
    }

    const now = new Date();

    const query = {
      _id: normalizedJobId,
      status: DELIVERY_JOB_STATUS.PROCESSING,
      lockToken: normalizedLockToken,
      transportAttemptedAt: {
        $ne: null,
      },
      ...(organizationId
        ? { organizationId }
        : {}),
    };

    const update = {
      $set: {
        reconciliationRequired: true,
        lastError:
          String(
            error ||
            "Transport outcome is uncertain; manual reconciliation required."
          ).slice(0, 2000),
        lastErrorAt: now,
        lockToken: null,
        lockExpiresAt: null,
        lockedAt: null,
        workerName: null,
      },
    };

    if (providerMessageId) {
      update.$set.providerMessageId =
        String(providerMessageId);
    }

    return DeliveryJob.findOneAndUpdate(
      query,
      update,
      {
        returnDocument: "after",
      }
    );
  }; 


// ==========================================================
// HEARTBEAT / EXTEND LEASE
// ==========================================================
//
// Worker can periodically extend its lease during a long
// provider request.
//
// IMPORTANT:
// Only the worker owning the lock may extend it.
//
// ==========================================================

export const heartbeatDeliveryJob =
  async ({
    jobId,
    lockToken,
    leaseDurationMs =
      DEFAULT_LEASE_DURATION_MS,
  } = {}) => {

    const normalizedJobId =
      normalizeId(
        jobId
      );

    const normalizedLockToken =
      normalizeId(
        lockToken
      );


    if (
      !normalizedJobId
    ) {

      throw new Error(
        "jobId is required for heartbeat."
      );
    }


    if (
      !normalizedLockToken
    ) {

      throw new Error(
        "lockToken is required for heartbeat."
      );
    }


    const now =
      new Date();

    const lockExpiresAt =
      new Date(
        now.getTime() +
          leaseDurationMs
      );


    return DeliveryJob.findOneAndUpdate(

      {

        _id:
          normalizedJobId,

        status:
          DELIVERY_JOB_STATUS.PROCESSING,

        lockToken:
          normalizedLockToken,

      },

      {

        $set: {

          lockExpiresAt,

        },

      },

      {

        returnDocument: 'after',

      }

    );
  };


// ==========================================================
// MARK JOB SENT
// ==========================================================
//
// Only the worker holding the current lock may mark the job
// sent.
//
// ==========================================================

export const markDeliveryJobSent =
  async ({
    jobId,
    lockToken,
    providerMessageId = null,
    organizationId = null,
  } = {}) => {

    const normalizedJobId =
      normalizeId(
        jobId
      );

    const normalizedLockToken =
      normalizeId(
        lockToken
      );


    if (
      !normalizedJobId
    ) {

      throw new Error(
        "jobId is required to mark delivery job sent."
      );
    }


    if (
      !normalizedLockToken
    ) {

      throw new Error(
        "lockToken is required to mark delivery job sent."
      );
    }


    const now =
      new Date();

    const query = {

      _id:
        normalizedJobId,

      status:
        DELIVERY_JOB_STATUS.PROCESSING,

      lockToken:
        normalizedLockToken,

    };


    if (
      organizationId
    ) {

      query.organizationId =
        organizationId;
    }


    const update = {

      $set: {

        status:
          DELIVERY_JOB_STATUS.SENT,

        sentAt:
          now,

        providerMessageId:
          normalizeId(
            providerMessageId
          ),

        lastError:
          "",

        lastErrorAt:
          null,

        lockToken:
          null,

        lockExpiresAt:
          null,

        lockedAt:
          null,

        workerName:
          null,

      },

    };


    return DeliveryJob.findOneAndUpdate(

      query,

      update,

      {

        returnDocument: 'after',

      }

    );
  };


// ==========================================================
// MARK JOB FAILED
// ==========================================================
//
// Handles retry scheduling.
//
// If attempts remain:
//
//     PROCESSING
//          ↓
//       FAILED
//          ↓
//     nextAttemptAt
//
// If attempts exhausted:
//
//     PROCESSING
//          ↓
//        DEAD
//
// The retry policy is controlled here rather than inside the
// worker.
//
// ==========================================================

export const markDeliveryJobFailed =
  async ({
    jobId,
    lockToken,
    error,
    retry = true,
    organizationId = null,
    retryDelayMs = null,
  } = {}) => {

    const normalizedJobId =
      normalizeId(
        jobId
      );

    const normalizedLockToken =
      normalizeId(
        lockToken
      );

    const errorMessage =
      getErrorMessage(
        error
      );


    if (
      !normalizedJobId
    ) {

      throw new Error(
        "jobId is required to mark delivery job failed."
      );
    }


    if (
      !normalizedLockToken
    ) {

      throw new Error(
        "lockToken is required to mark delivery job failed."
      );
    }


    const job =
      await DeliveryJob.findOne({

        _id:
          normalizedJobId,

        status:
          DELIVERY_JOB_STATUS.PROCESSING,

        lockToken:
          normalizedLockToken,

        ...(organizationId
          ? {
              organizationId,
            }
          : {}),

      });


    if (
      !job
    ) {

      return null;
    }

    // ------------------------------------------------------
    // UNCERTAIN TRANSPORT OUTCOME
    // ------------------------------------------------------
    //
    // Once transport has been attempted, an error does not
    // prove the provider rejected the message.
    //
    // Never automatically retry an uncertain send.
    //
    // ------------------------------------------------------

    if (job.transportAttemptedAt) {
      return markDeliveryJobReconciliationRequired({
        jobId: normalizedJobId,
        lockToken: normalizedLockToken,
        error: errorMessage,
        organizationId,
      });
    }

    const now =
      new Date();

    const attempts =
      Number(
        job.attempts || 0
      );

    const maxAttempts =
      Number(
        job.maxAttempts ||
          DEFAULT_MAX_ATTEMPTS
      );


    const attemptsRemaining =
      attempts <
      maxAttempts;


    // ------------------------------------------------------
    // Retryable failure
    // ------------------------------------------------------

    if (
      retry &&
      attemptsRemaining
    ) {

      const delay =
        retryDelayMs !== null
          ? Math.max(
              0,
              Number(
                retryDelayMs
              )
            )
          : calculateRetryDelay(
              attempts
            );


      const nextAttemptAt =
        new Date(
          now.getTime() +
            delay
        );


      return DeliveryJob.findOneAndUpdate(

        {

          _id:
            normalizedJobId,

          status:
            DELIVERY_JOB_STATUS.PROCESSING,

          lockToken:
            normalizedLockToken,

        },

        {

          $set: {

            status:
              DELIVERY_JOB_STATUS.FAILED,

            nextAttemptAt,

            lastError:
              errorMessage,

            lastErrorAt:
              now,

            failedAt:
              now,

            lockToken:
              null,

            lockExpiresAt:
              null,

            lockedAt:
              null,

            workerName:
              null,

          },

        },

        {

          returnDocument: 'after',

        }

      );
    }


    // ------------------------------------------------------
    // Permanent / exhausted failure
    // ------------------------------------------------------

    return DeliveryJob.findOneAndUpdate(

      {

        _id:
          normalizedJobId,

        status:
          DELIVERY_JOB_STATUS.PROCESSING,

        lockToken:
          normalizedLockToken,

      },

      {

        $set: {

          status:
            DELIVERY_JOB_STATUS.DEAD,

          lastError:
            errorMessage,

          lastErrorAt:
            now,

          failedAt:
            now,

          deadAt:
            now,

          deadReason:
            retry
              ? `Maximum delivery attempts (${maxAttempts}) exhausted.`
              : "Delivery failure marked non-retryable.",

          lockToken:
            null,

          lockExpiresAt:
            null,

          lockedAt:
            null,

          workerName:
            null,

        },

      },

      {

        returnDocument: 'after',

      }

    );
  };


// ==========================================================
// RECOVER STALE DELIVERY JOBS
// ==========================================================
//
// Finds jobs whose processing lease expired.
//
// Instead of immediately marking them DEAD, they return to
// FAILED and become eligible for retry.
//
// This handles:
// 
// Worker crash
// Process restart
// Network hang
// Machine shutdown
//
// ==========================================================

export const recoverStaleDeliveryJobs =
  async ({
    workerName = null,
    limit = 100,
  } = {}) => {

    const now =
      new Date();

    const resolvedWorkerName =
      resolveWorkerName(
        workerName
      );


    const staleJobs =
      await DeliveryJob.find({

        status:
          DELIVERY_JOB_STATUS.PROCESSING,

        lockExpiresAt: {
          $lte: now,
        },

      })

        .sort({
          lockExpiresAt: 1,
        })

        .limit(
          Math.max(
            1,
            Number(
              limit || 100
            )
          )
        );


    const recovered =
      [];


    for (
      const job
      of staleJobs
    ) {

      const attempts =
        Number(
          job.attempts || 0
        );

      const maxAttempts =
        Number(
          job.maxAttempts ||
            DEFAULT_MAX_ATTEMPTS
        );


      const attemptsRemaining =
        attempts <
        maxAttempts;


            // ------------------------------------------------------
      // UNCERTAIN TRANSPORT OUTCOME
      // ------------------------------------------------------
      //
      // If transport was attempted, a worker crash or expired
      // lease cannot establish whether the provider accepted
      // the message. Do not automatically retry it.
      //
      // ------------------------------------------------------

      if (
        job.transportAttemptedAt ||
        job.reconciliationRequired === true
      ) {
        const reconciliationJob =
          await DeliveryJob.findOneAndUpdate(
            {
              _id: job._id,
              status: DELIVERY_JOB_STATUS.PROCESSING,
              lockToken: job.lockToken,
              lockExpiresAt: {
                $lte: now,
              },
            },
            {
              $set: {
                reconciliationRequired: true,

                lastError:
                  "Transport outcome uncertain after worker lease expired; manual reconciliation required.",

                lastErrorAt: now,

                lockToken: null,
                lockExpiresAt: null,
                lockedAt: null,
                workerName: resolvedWorkerName,
              },
            },
            {
              returnDocument: "after",
            }
          );

        if (reconciliationJob) {
          recovered.push(reconciliationJob);
        }

        continue;
      }


      if (
        attemptsRemaining
      ) {

        const delay =
          calculateRetryDelay(
            attempts
          );

        const nextAttemptAt =
          new Date(
            now.getTime() +
              delay
          );


        const recoveredJob =
          await DeliveryJob.findOneAndUpdate(

            {
              _id: job._id,

              status: DELIVERY_JOB_STATUS.PROCESSING,

              lockToken: job.lockToken,

              lockExpiresAt: {
                $lte: now,
              },
            },

            {

              $set: {

                status:
                  DELIVERY_JOB_STATUS.FAILED,

                nextAttemptAt,

                lastError:
                  job.lastError ||
                  "Delivery worker lease expired.",

                lastErrorAt:
                  now,

                failedAt:
                  now,

                lockToken:
                  null,

                lockExpiresAt:
                  null,

                lockedAt:
                  null,

                workerName:
                  resolvedWorkerName,

              },

            },

            {

              returnDocument: 'after',

            }

          );


        if (
          recoveredJob
        ) {

          recovered.push(
            recoveredJob
          );
        }

      } else {

        const deadJob =
          await DeliveryJob.findOneAndUpdate(

            {
              _id: job._id,

              status: DELIVERY_JOB_STATUS.PROCESSING,

              lockToken: job.lockToken,

              lockExpiresAt: {
               $lte: now,
              },
            },

            {

              $set: {

                status:
                  DELIVERY_JOB_STATUS.DEAD,

                lastError:
                  job.lastError ||
                  "Delivery worker lease expired after maximum attempts.",

                lastErrorAt:
                  now,

                failedAt:
                  now,

                deadAt:
                  now,

                deadReason:
                  `Maximum delivery attempts (${maxAttempts}) exhausted after stale worker lease.`,

                lockToken:
                  null,

                lockExpiresAt:
                  null,

                lockedAt:
                  null,

                workerName:
                  null,

              },

            },

            {

              returnDocument: 'after',

            }

          );


        if (
          deadJob
        ) {

          recovered.push(
            deadJob
          );
        }
      }
    }


    return {

      workerName:
        resolvedWorkerName,

      scanned:
        staleJobs.length,

      recovered:
        recovered.length,

      jobs:
        recovered,

    };
  };


// ==========================================================
// RETRY JOB NOW
// ==========================================================
//
// Manual/operator recovery.
//
// Works for:
//
// failed
// dead
//
// The job returns to pending immediately.
//
// ==========================================================

export const retryDeliveryJobNow =
  async (
    jobId,
    {
      organizationId = null,
      resetAttempts = false,
    } = {}
  ) => {

    const normalizedJobId =
      normalizeId(
        jobId
      );


    if (
      !normalizedJobId
    ) {

      throw new Error(
        "jobId is required to retry a delivery job."
      );
    }


    const query = {
  _id: normalizedJobId,

  status: {
    $in: [
      DELIVERY_JOB_STATUS.FAILED,
      DELIVERY_JOB_STATUS.DEAD,
    ],
  },

  // Never retry a delivery whose transport outcome is uncertain.
  transportAttemptedAt: null,

  reconciliationRequired: {
    $ne: true,
  },
};


    if (
      organizationId
    ) {

      query.organizationId =
        organizationId;
    }


    const setFields = {

      status:
        DELIVERY_JOB_STATUS.PENDING,

      nextAttemptAt:
        new Date(),

      failedAt:
        null,

      deadAt:
        null,

      deadReason:
        "",

      lastError:
        "",

      lastErrorAt:
        null,

      lockToken:
        null,

      lockExpiresAt:
        null,

      lockedAt:
        null,

      workerName:
        null,

    };


    const update = {

      $set:
        setFields,

    };


    if (
      resetAttempts
    ) {

      update.$set.attempts =
        0;
    }


    return DeliveryJob.findOneAndUpdate(

      query,

      update,

      {

        returnDocument: 'after',

      }

    );
  };


// ==========================================================
// RELEASE JOB
// ==========================================================
//
// Used when a worker intentionally gives up its lease
// without considering the delivery attempt itself a permanent
// failure.
//
// ==========================================================

export const releaseDeliveryJob =
  async ({
    jobId,
    lockToken,
    organizationId = null,
    nextAttemptAt = null,
  } = {}) => {

    const normalizedJobId =
      normalizeId(
        jobId
      );

    const normalizedLockToken =
      normalizeId(
        lockToken
      );


    if (
      !normalizedJobId
    ) {

      throw new Error(
        "jobId is required to release a delivery job."
      );
    }


    if (
      !normalizedLockToken
    ) {

      throw new Error(
        "lockToken is required to release a delivery job."
      );
    }


    const query = {
  _id: normalizedJobId,

  status: DELIVERY_JOB_STATUS.PROCESSING,

  lockToken: normalizedLockToken,

  // A job can be released only before transport is attempted.
  transportAttemptedAt: null,

  reconciliationRequired: {
    $ne: true,
  },

  ...(organizationId
    ? {
        organizationId,
      }
    : {}),
};


    return DeliveryJob.findOneAndUpdate(

      query,

      {

        $set: {

          status:
            DELIVERY_JOB_STATUS.PENDING,

          nextAttemptAt:

            nextAttemptAt
              ? new Date(
                  nextAttemptAt
                )
              : new Date(),

          lockToken:
            null,

          lockExpiresAt:
            null,

          lockedAt:
            null,

          workerName:
            null,

        },

      },

      {

        returnDocument: 'after',

      }

    );
  };


  // ==========================================================
// LIST RECONCILIATION-REQUIRED DELIVERY JOBS
// ==========================================================
//
// Read-only operator queue.
//
// IMPORTANT
// ----------------------------------------------------------
// - Organization scope is mandatory.
// - No message content is returned.
// - No delivery jobs are modified.
// - No automatic retries are triggered.
// - Results are bounded and ordered deterministically.
//
// ==========================================================

export const listReconciliationRequiredDeliveryJobs =
  async ({
    organizationId,
    limit = 50,
  } = {}) => {

    const normalizedOrganizationId =
      normalizeId(organizationId);

    if (!normalizedOrganizationId) {
      throw new Error(
        "organizationId is required to list reconciliation-required delivery jobs."
      );
    }

    const parsedLimit = Number(limit);

    const safeLimit =
      Number.isFinite(parsedLimit)
        ? Math.min(
            100,
            Math.max(
              1,
              Math.floor(parsedLimit)
            )
          )
        : 50;

    const jobs =
      await DeliveryJob.find({
        organizationId: normalizedOrganizationId,
        reconciliationRequired: true,
      })
        .select([
          "_id",
          "organizationId",
          "messageId",
          "conversationId",
          "leadId",
          "channel",
          "status",
          "transportAttemptedAt",
          "reconciliationRequired",
          "providerMessageId",
          "lastError",
          "lastErrorAt",
          "attempts",
          "createdAt",
          "updatedAt",
        ].join(" "))
        .sort({
          transportAttemptedAt: 1,
          createdAt: 1,
          _id: 1,
        })
        .limit(safeLimit)
        .lean();

    return jobs;
  };


// ==========================================================
// LIST DEAD JOBS
// ==========================================================

export const listDeadDeliveryJobs =
  async ({
    organizationId = null,
    limit = 100,
  } = {}) => {

    const query = {

      status:
        DELIVERY_JOB_STATUS.DEAD,

    };


    if (
      organizationId
    ) {

      query.organizationId =
        organizationId;
    }


    return DeliveryJob.find(
      query
    )

      .sort({
        deadAt: -1,

        createdAt: -1,
      })

      .limit(
        Math.max(
          1,
          Number(
            limit || 100
          )
        )
      );
  };


// ==========================================================
// GET DELIVERY JOB HISTORY
// ==========================================================

export const getDeliveryJobHistory =
  async ({
    organizationId = null,
    messageId = null,
    conversationId = null,
    leadId = null,
    limit = 100,
  } = {}) => {

    const query = {};


    if (
      organizationId
    ) {

      query.organizationId =
        organizationId;
    }


    if (
      messageId
    ) {

      query.messageId =
        normalizeId(
          messageId
        );
    }


    if (
      conversationId
    ) {

      query.conversationId =
        normalizeId(
          conversationId
        );
    }


    if (
      leadId
    ) {

      query.leadId =
        normalizeId(
          leadId
        );
    }


    return DeliveryJob.find(
      query
    )

      .sort({
        createdAt: -1,
      })

      .limit(
        Math.max(
          1,
          Number(
            limit || 100
          )
        )
      );
  };


// ==========================================================
// DELIVERY STATISTICS
// ==========================================================

export const getDeliveryJobStatistics =
  async ({
    organizationId = null,
  } = {}) => {

    const match = {};


    if (
      organizationId
    ) {

      match.organizationId =
        organizationId;
    }


    const results =
      await DeliveryJob.aggregate([

        {

          $match:
            match,

        },

        {

          $group: {

            _id:
              "$status",

            count: {
              $sum: 1,
            },

          },

        },

      ]);


    const statistics = {

      total: 0,

      pending: 0,

      processing: 0,

      sent: 0,

      failed: 0,

      dead: 0,

    };


    for (
      const result
      of results
    ) {

      const status =
        result?._id;

      const count =
        Number(
          result?.count || 0
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


// ==========================================================
// PURGE OLD SENT JOBS
// ==========================================================
//
// Optional operational maintenance.
//
// This removes only successfully completed DeliveryJobs.
// Message records remain untouched.
//
// ==========================================================

export const purgeSentDeliveryJobs =
  async ({
    organizationId = null,
    olderThanDate,
    limit = 1000,
  } = {}) => {

    if (
      !olderThanDate
    ) {

      throw new Error(
        "olderThanDate is required to purge sent delivery jobs."
      );
    }


    const query = {

      status:
        DELIVERY_JOB_STATUS.SENT,

      sentAt: {

        $lte:
          new Date(
            olderThanDate
          ),

      },

    };


    if (
      organizationId
    ) {

      query.organizationId =
        organizationId;
    }


    const jobs =
      await DeliveryJob.find(
        query
      )

        .select("_id")

        .limit(
          Math.max(
            1,
            Number(
              limit || 1000
            )
          )
        );


    if (
      !jobs.length
    ) {

      return {

        deletedCount: 0,

      };
    }


    const ids =
      jobs.map(
        (job) =>
          job._id
      );


    const result =
      await DeliveryJob.deleteMany({

        _id: {
          $in: ids,
        },

      });


    return {

      deletedCount:
        result.deletedCount ||
        0,

    };
  };


// ==========================================================
// DEFAULT EXPORT
// ==========================================================

export default {

  createDeliveryJob,

  getDeliveryJob,

  getDeliveryJobByIdempotencyKey,

  getDeliveryJobByMessageId,

  countPendingDeliveryJobs,

  claimNextDeliveryJob,

  claimDeliveryJob,

  markDeliveryJobTransportAttempted,

  markDeliveryJobReconciliationRequired,

  heartbeatDeliveryJob,

  markDeliveryJobSent,

  markDeliveryJobFailed,

  recoverStaleDeliveryJobs,

  retryDeliveryJobNow,

  releaseDeliveryJob,

  listReconciliationRequiredDeliveryJobs,

  listDeadDeliveryJobs,

  getDeliveryJobHistory,

  getDeliveryJobStatistics,

  purgeSentDeliveryJobs,

  resolveDeliveryProvider,

  buildDeliveryIdempotencyKey,

  calculateRetryDelay,

};