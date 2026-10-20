/**
 * ==========================================================
 *
 * HTTP IDEMPOTENCY SERVICE
 *
 * ==========================================================
 *
 * Responsibilities:
 *
 * - Persist HTTP mutation outcomes.
 * - Replay completed requests.
 * - Reject conflicting reuse of an idempotency key.
 * - Execute business changes and save responses atomically.
 * - Recover safely from concurrent duplicate requests.
 *
 * IMPORTANT:
 *
 * The business callback MUST use the supplied MongoDB session
 * for every database mutation that belongs to this operation.
 *
 * Do not perform Socket.IO emissions, HTTP calls, SMS delivery,
 * WhatsApp delivery, or other external side effects inside it.
 *
 * ==========================================================
 */

import mongoose from "mongoose";

import IdempotencyRecord from "../models/idempotencyRecord.js";

import {
  withReliableTransaction,
} from "./outboxIntegrationService.js";

import {
  requireIdempotencyKey,
  createRequestFingerprint,
  createStableOperationId,
} from "../utils/httpIdempotency.js";


/* ==========================================================
   ERROR FACTORY
========================================================== */

const createHttpError = (
  statusCode,
  message
) => {
  const error = new Error(message);

  error.statusCode = statusCode;

  return error;
};


/* ==========================================================
   REQUIRED ID
========================================================== */

const requireIdentityValue = (
  value,
  fieldName
) => {
  if (
    value === undefined ||
    value === null ||
    String(value).trim() === ""
  ) {
    throw createHttpError(
      401,
      `${fieldName} is required for HTTP idempotency.`
    );
  }

  return String(value).trim();
};


/* ==========================================================
   NORMALIZE REQUEST IDENTITY
========================================================== */

const resolveRequestIdentity = ({
  req,
  organizationId,
  actorId,
}) => {
  const normalizedOrganizationId =
    requireIdentityValue(
      organizationId,
      "Organization ID"
    );

  if (
    !mongoose.Types.ObjectId.isValid(
      normalizedOrganizationId
    )
  ) {
    throw createHttpError(
      400,
      "A valid organization ID is required."
    );
  }

  const normalizedActorId =
    requireIdentityValue(
      actorId,
      "Authenticated actor ID"
    );

  const method =
    String(
      req.method || ""
    ).toUpperCase();

  const routeKey =
    String(
      req.baseUrl || ""
    ) +
    String(
      req.route?.path ||
      req.path ||
      ""
    );

  if (
    !method ||
    !routeKey
  ) {
    throw new Error(
      "Unable to determine the HTTP idempotency route."
    );
  }

  const key =
    requireIdempotencyKey(req);

  const requestHash =
    createRequestFingerprint(req);

  const operationId =
    createStableOperationId({
      organizationId:
        normalizedOrganizationId,

      actorId:
        normalizedActorId,

      method,

      routeKey,

      key,
    });

  return {
    organizationId:
      normalizedOrganizationId,

    actorId:
      normalizedActorId,

    method,

    routeKey,

    key,

    requestHash,

    operationId,
  };
};


/* ==========================================================
   RECORD QUERY
========================================================== */

const buildIdentityQuery = ({
  organizationId,
  actorId,
  method,
  routeKey,
  key,
}) => ({
  organizationId,
  actorId,
  method,
  routeKey,
  key,
});


/* ==========================================================
   FIND EXISTING COMPLETED REQUEST
========================================================== */

const findCompletedRecord = async (
  identity
) => {
  const record =
    await IdempotencyRecord.findOne(
      buildIdentityQuery(identity)
    ).lean();

  if (!record) {
    return null;
  }

  if (
    record.requestHash !==
    identity.requestHash
  ) {
    throw createHttpError(
      409,
      "This Idempotency-Key has already been used with a different request."
    );
  }

  if (
    !record.completedAt ||
    !Number.isInteger(
      record.responseStatus
    ) ||
    !record.responseBody
  ) {
    /*
     * Incomplete records should never commit when the service
     * is used correctly. Do not execute a second mutation if
     * an incomplete record is found.
     */

    throw createHttpError(
      503,
      "The previous idempotent request is not yet available for replay. Retry shortly."
    );
  }

  return {
    replayed: true,

    status:
      record.responseStatus,

    body:
      record.responseBody,

    operationId:
      identity.operationId,
  };
};


/* ==========================================================
   DUPLICATE KEY ERROR DETECTION
========================================================== */

const isDuplicateKeyError = (
  error
) => {
  return (
    error?.code === 11000 ||
    error?.cause?.code === 11000
  );
};


/* ==========================================================
   VALIDATE OPERATION RESPONSE
========================================================== */

const validateOperationResponse = (
  response
) => {
  if (
    !response ||
    !Number.isInteger(
      response.status
    ) ||
    response.status < 200 ||
    response.status > 599 ||
    !Object.prototype.hasOwnProperty.call(
      response,
      "body"
    )
  ) {
    throw new Error(
      "Idempotent operations must return { status, body }."
    );
  }

  /*
   * This initial implementation stores successful outcomes
   * only. Error responses thrown by the business callback
   * roll back the transaction and can be retried.
   */

  if (
    response.status < 200 ||
    response.status >= 300
  ) {
    throw createHttpError(
      response.status,
      "The idempotent operation returned a non-success response. Throw an error to abort the transaction."
    );
  }

  if (
    response.body === undefined
  ) {
    throw new Error(
      "The idempotent response body must not be undefined."
    );
  }

  return response;
};


/* ==========================================================
   EXECUTE IDEMPOTENT TRANSACTION
========================================================== */

/**
 * Execute one transaction-safe HTTP mutation.
 *
 * @param {Object} options
 * @param {Object} options.req Express request
 * @param {*} options.organizationId Organization ObjectId
 * @param {*} options.actorId Authenticated actor ID
 * @param {Function} options.execute
 *
 * execute receives:
 *
 * {
 *   session,
 *   operationId,
 *   identity
 * }
 *
 * execute must return:
 *
 * {
 *   status: 201,
 *   body: { ... }
 * }
 *
 * Optional postCommit is called only after a newly committed
 * operation. It is never called for an idempotent replay.
 */

export const executeIdempotentRequest = async ({
  req,
  organizationId,
  actorId,
  execute,
  postCommit,
}) => {
  if (
    typeof execute !== "function"
  ) {
    throw new Error(
      "executeIdempotentRequest requires an execute callback."
    );
  }

  if (
    postCommit !== undefined &&
    typeof postCommit !== "function"
  ) {
    throw new Error(
      "postCommit must be a function when provided."
    );
  }

  const identity =
    resolveRequestIdentity({
      req,
      organizationId,
      actorId,
    });

  /*
   * Fast path: avoid opening a transaction for a completed
   * replay.
   */

  const existing =
    await findCompletedRecord(
      identity
    );

  if (existing) {
    return existing;
  }

  let operationResult;

  try {
    operationResult =
      await withReliableTransaction(
        async (session) => {
          /*
           * Reserve this request identity inside the same
           * transaction as its business mutations.
           *
           * The compound unique index is the concurrency
           * authority; the initial lookup above is only an
           * optimization.
           */

          const [record] =
            await IdempotencyRecord.create(
              [
                {
                  organizationId:
                    identity.organizationId,

                  actorId:
                    identity.actorId,

                  method:
                    identity.method,

                  routeKey:
                    identity.routeKey,

                  key:
                    identity.key,

                  requestHash:
                    identity.requestHash,
                },
              ],
              {
                session,
              }
            );

          /*
           * All business mutations and outbox writes performed
           * by execute must use this session.
           */

          const response =
  validateOperationResponse(
    await execute({
      session,

      operationId:
        identity.operationId,

      identity,
    })
  );

/*
 * Store a JSON-safe snapshot of the HTTP response.
 *
 * This prevents Mongoose documents from being stored
 * directly inside a Mixed field and preserves the JSON
 * representation clients receive.
 */
const responseBody =
  JSON.parse(
    JSON.stringify(
      response.body
    )
  );

          /*
           * Store the exact HTTP response in the same
           * transaction as the business operation.
           */

          record.responseStatus =
  response.status;

record.responseBody =
  responseBody;

record.completedAt =
  new Date();

await record.save({
  session,
});

return {
  replayed: false,

  status:
    response.status,

  body:
    responseBody,

  operationId:
    identity.operationId,

  /*
   * Available to postCommit for this execution only.
   * It is deliberately not persisted in the HTTP response.
   */
  postCommitData:
    response.postCommitData,
};
        }
      );
  } catch (error) {
    /*
     * A concurrent request may win the unique-index race.
     *
     * Only resolve the failure as a replay when a committed
     * record exists and its fingerprint matches. All unrelated
     * database errors continue to propagate.
     */

    if (isDuplicateKeyError(error)) {
  /*
   * A competing transaction may still be committing when
   * the duplicate-key error reaches this request.
   *
   * Retry the lookup briefly. Never rerun the business
   * operation merely because the winner isn't visible yet.
   */
  const maxLookups = 8;
  const delayMs = 150;

  for (let attempt = 0; attempt < maxLookups; attempt += 1) {
    const committedRecord = await findCompletedRecord(identity)
      .catch((lookupError) => {
        if (lookupError?.statusCode === 409) {
          throw lookupError;
        }

        throw lookupError;
      });

    if (committedRecord) {
      return committedRecord;
    }

    if (attempt < maxLookups - 1) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  throw createHttpError(
    503,
    "A request with this Idempotency-Key is being processed. Retry the request using the same key."
  );
}

    throw error;
  }

  /*
   * External side effects are intentionally outside the
   * MongoDB transaction. Their failure must not cause a
   * committed business operation to be executed again.
   */

  if (
    postCommit
  ) {
    try {
      await postCommit(
        operationResult
      );
    } catch (error) {
      console.error(
        "HTTP IDEMPOTENCY POST-COMMIT ACTION FAILED:",
        {
          operationId:
            identity.operationId,

          message:
            error?.message,
        }
      );
    }
  }

  return operationResult;
};


/* ==========================================================
   DEFAULT EXPORT
========================================================== */

export default {
  executeIdempotentRequest,
};