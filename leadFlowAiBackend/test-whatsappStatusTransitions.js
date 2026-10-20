import test from "node:test";
import assert from "node:assert/strict";

import {
  resolveNextStatus,
  parseProviderTimestamp,
} from "./middleware/handleWhatsAppStatusWebhook.js";


/**
 * ==========================================================
 * WHATSAPP STATUS TRANSITION TESTS
 * ==========================================================
 *
 * These tests are isolated:
 * - No MongoDB connection.
 * - No real WhatsApp requests.
 * - No production data changes.
 *
 * ==========================================================
 */


test("sending -> sent", () => {
  assert.equal(
    resolveNextStatus("sending", "sent"),
    "sent"
  );
});


test("sent -> delivered", () => {
  assert.equal(
    resolveNextStatus("sent", "delivered"),
    "delivered"
  );
});


test("delivered -> read", () => {
  assert.equal(
    resolveNextStatus("delivered", "read"),
    "read"
  );
});


test("read never downgrades to delivered", () => {
  assert.equal(
    resolveNextStatus("read", "delivered"),
    "read"
  );
});


test("read never downgrades to sent", () => {
  assert.equal(
    resolveNextStatus("read", "sent"),
    "read"
  );
});


test("delivered never downgrades to sent", () => {
  assert.equal(
    resolveNextStatus("delivered", "sent"),
    "delivered"
  );
});


test("sent -> failed", () => {
  assert.equal(
    resolveNextStatus("sent", "failed"),
    "failed"
  );
});


test("sending -> failed", () => {
  assert.equal(
    resolveNextStatus("sending", "failed"),
    "failed"
  );
});


test("delivered never downgrades to failed", () => {
  assert.equal(
    resolveNextStatus("delivered", "failed"),
    "delivered"
  );
});


test("read never downgrades to failed", () => {
  assert.equal(
    resolveNextStatus("read", "failed"),
    "read"
  );
});


test("failed does not downgrade to sent", () => {
  assert.equal(
    resolveNextStatus("failed", "sent"),
    "failed"
  );
});


test("failed can advance to delivered", () => {
  assert.equal(
    resolveNextStatus("failed", "delivered"),
    "delivered"
  );
});


test("failed can advance to read", () => {
  assert.equal(
    resolveNextStatus("failed", "read"),
    "read"
  );
});


test("unsupported incoming status is rejected", () => {
  assert.equal(
    resolveNextStatus("sent", "queued"),
    null
  );
});


test("unknown current status is rejected", () => {
  assert.equal(
    resolveNextStatus("unknown", "delivered"),
    null
  );
});


test("Meta Unix timestamp converts to a Date", () => {
  const result = parseProviderTimestamp("1790000000");

  assert.ok(result instanceof Date);

  assert.equal(
  result.toISOString(),
  "2026-09-21T14:13:20.000Z"
);
});


test("missing timestamp returns null", () => {
  assert.equal(
    parseProviderTimestamp(undefined),
    null
  );
});


test("invalid timestamp returns null", () => {
  assert.equal(
    parseProviderTimestamp("not-a-timestamp"),
    null
  );
});


test("zero timestamp returns null", () => {
  assert.equal(
    parseProviderTimestamp("0"),
    null
  );
});