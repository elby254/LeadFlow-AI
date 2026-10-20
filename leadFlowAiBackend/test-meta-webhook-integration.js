import assert from "node:assert/strict";
import express from "express";
import http from "node:http";
import { createHmac } from "node:crypto";

import verifyMetaWebhookSignature
  from "./middleware/verifyMetaWebhookSignature.js";

const TEST_SECRET = "isolated-local-test-secret";

const app = express();

let adapterReached = false;
let capturedRawBody = null;

/*
 * Mirror the raw-body capture configured in server.js.
 */
app.use(
  express.json({
    verify: (req, res, buffer) => {
      if (
        req.originalUrl === "/api/webhooks/whatsapp" ||
        req.originalUrl.startsWith(
          "/api/webhooks/whatsapp?"
        )
      ) {
        req.rawBody = Buffer.from(buffer);
        capturedRawBody = Buffer.from(buffer);
      }
    },
  })
);

/*
 * Isolated WhatsApp route.
 *
 * No real adapter, database, lead creation, or AI processing.
 */
app.post(
  "/api/webhooks/whatsapp",

  verifyMetaWebhookSignature,

  (req, res) => {
    adapterReached = true;

    return res.status(200).json({
      success: true,
      testOnly: true,
    });
  }
);

const server = http.createServer(app);

const sign = (body) =>
  `sha256=${createHmac("sha256", TEST_SECRET)
    .update(body)
    .digest("hex")}`;

async function postWebhook(body, signature) {
  const address = server.address();

  const headers = {
    "Content-Type": "application/json",
  };

  if (signature) {
    headers["X-Hub-Signature-256"] = signature;
  }

  return fetch(
    `http://127.0.0.1:${address.port}/api/webhooks/whatsapp`,
    {
      method: "POST",
      headers,
      body,
    }
  );
}

try {
  process.env.META_APP_SECRET = TEST_SECRET;

  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });

  const payload = JSON.stringify({
    object: "whatsapp_business_account",
    entry: [],
  });

  /*
   * Test 1: valid signature reaches the route handler.
   */
  adapterReached = false;
  capturedRawBody = null;

  const validResponse = await postWebhook(
    payload,
    sign(Buffer.from(payload, "utf8"))
  );

  assert.equal(validResponse.status, 200);
  assert.equal(adapterReached, true);

  assert.deepEqual(
    capturedRawBody,
    Buffer.from(payload, "utf8")
  );

  console.log(
    "PASS: Express preserves the original request bytes."
  );

  console.log(
    "PASS: valid signature reaches the protected route."
  );

  /*
   * Test 2: invalid signature is rejected before the route.
   */
  adapterReached = false;

  const invalidResponse = await postWebhook(
    payload,
    sign(Buffer.from("different payload", "utf8"))
  );

  assert.equal(invalidResponse.status, 401);
  assert.equal(adapterReached, false);

  console.log(
    "PASS: invalid signature is rejected before the route handler."
  );

  /*
   * Test 3: missing signature is rejected before the route.
   */
  adapterReached = false;

  const missingResponse = await postWebhook(payload);

  assert.equal(missingResponse.status, 401);
  assert.equal(adapterReached, false);

  console.log(
    "PASS: missing signature is rejected before the route handler."
  );

  console.log(
    "\nAll isolated Express webhook integration tests passed."
  );

} finally {
  await new Promise((resolve) => {
    if (!server.listening) {
      resolve();
      return;
    }

    server.close(resolve);
  });
} 