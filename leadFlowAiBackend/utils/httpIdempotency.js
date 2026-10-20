import crypto from "node:crypto";

/**
 * ==========================================================
 *
 * HTTP IDEMPOTENCY UTILITIES
 *
 * ==========================================================
 *
 * Responsibilities:
 *
 * - Validate client-supplied idempotency keys.
 * - Create deterministic request fingerprints.
 * - Create stable operation IDs for logical HTTP requests.
 *
 * IMPORTANT:
 *
 * This module performs no database operations.
 *
 * ==========================================================
 */


/**
 * ==========================================================
 * STABLE SERIALIZATION
 * ==========================================================
 *
 * Sort object keys recursively so equivalent JSON objects
 * generate the same serialized representation.
 *
 * Array order remains significant.
 *
 * ==========================================================
 */

const stableSerialize = (value) => {
  if (value === null) {
    return "null";
  }

  if (value === undefined) {
    return '"[undefined]"';
  }

  if (typeof value !== "object") {
    const serialized = JSON.stringify(value);

    if (serialized === undefined) {
      throw new Error(
        "Unsupported value encountered during serialization."
      );
    }

    return serialized;
  }

  if (Array.isArray(value)) {
    return `[${value
      .map(stableSerialize)
      .join(",")}]`;
  }

  const keys = Object.keys(value).sort();

  return `{${keys
    .map(
      (key) =>
        `${JSON.stringify(key)}:${stableSerialize(value[key])}`
    )
    .join(",")}}`;
};


/**
 * ==========================================================
 * HASH STRUCTURED DATA
 * ==========================================================
 */

const sha256 = (value) => {
  return crypto
    .createHash("sha256")
    .update(value)
    .digest("hex");
};


/**
 * ==========================================================
 * REQUIRE IDEMPOTENCY KEY
 * ==========================================================
 *
 * Reads the standard HTTP header:
 *
 * Idempotency-Key
 *
 * ==========================================================
 */

export const requireIdempotencyKey = (req) => {
  const rawKey = req.get("Idempotency-Key");

  if (
    typeof rawKey !== "string" ||
    !rawKey.trim()
  ) {
    const error = new Error(
      "The Idempotency-Key header is required for this operation."
    );

    error.statusCode = 400;

    throw error;
  }

  const key = rawKey.trim();

  if (key.length > 255) {
    const error = new Error(
      "Idempotency-Key must not exceed 255 characters."
    );

    error.statusCode = 400;

    throw error;
  }

  if (/[\s\x00-\x1F\x7F]/.test(key)) {
    const error = new Error(
      "Idempotency-Key must not contain whitespace or control characters."
    );

    error.statusCode = 400;

    throw error;
  }

  return key;
};


/**
 * ==========================================================
 * REQUEST FINGERPRINT
 * ==========================================================
 *
 * Identical logical requests produce identical fingerprints.
 *
 * Includes:
 *
 * - HTTP method
 * - Mounted route
 * - Route parameters
 * - Request body
 *
 * Excludes:
 *
 * - Authorization headers
 * - Cookies
 * - Volatile transport metadata
 *
 * ==========================================================
 */

export const createRequestFingerprint = (req) => {
  const fingerprintInput = {
    method: String(req.method || "").toUpperCase(),

    route:
      String(req.baseUrl || "") +
      String(req.route?.path || req.path || ""),

    params: req.params || {},

    body: req.body || {},
  };

  return sha256(
    stableSerialize(fingerprintInput)
  );
};


/**
 * ==========================================================
 * STABLE OPERATION ID
 * ==========================================================
 *
 * Generates a deterministic identifier for one logical
 * HTTP operation within its identity scope.
 *
 * Structured serialization avoids delimiter ambiguity.
 *
 * ==========================================================
 */

export const createStableOperationId = ({
  organizationId,
  actorId,
  method,
  routeKey,
  key,
}) => {
  const input = {
    organizationId: String(organizationId),

    actorId: String(actorId),

    method: String(method).toUpperCase(),

    routeKey: String(routeKey),

    key: String(key),
  };

  return sha256(
    stableSerialize(input)
  );
};