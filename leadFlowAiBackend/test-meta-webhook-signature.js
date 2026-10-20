import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import verifyMetaWebhookSignature from "./middleware/verifyMetaWebhookSignature.js";

const TEST_SECRET = "local-test-secret-not-for-production";

const makeRequest = ({
  signature,
  rawBody,
} = {}) => ({
  rawBody,
  get: (header) =>
    header.toLowerCase() === "x-hub-signature-256"
      ? signature
      : undefined,
});

const makeResponse = () => {
  const res = {
    statusCode: null,
    body: null,

    status(code) {
      this.statusCode = code;
      return this;
    },

    json(body) {
      this.body = body;
      return this;
    },
  };

  return res;
};

const sign = (body, secret = TEST_SECRET) =>
  `sha256=${createHmac("sha256", secret)
    .update(body)
    .digest("hex")}`;

const runMiddleware = (req) => {
  const res = makeResponse();
  let nextCalled = false;
  let nextError = null;

  verifyMetaWebhookSignature(req, res, (error) => {
    nextCalled = true;
    nextError = error || null;
  });

  return {
    res,
    nextCalled,
    nextError,
  };
};

const originalSecret = process.env.META_APP_SECRET;

try {
  process.env.META_APP_SECRET = TEST_SECRET;

  const rawBody = Buffer.from(
    JSON.stringify({
      object: "whatsapp_business_account",
      entry: [],
    }),
    "utf8"
  );

  // 1. Correct signature
  {
    const result = runMiddleware(
      makeRequest({
        signature: sign(rawBody),
        rawBody,
      })
    );

    assert.equal(result.nextCalled, true);
    assert.equal(result.res.statusCode, null);

    console.log("PASS: valid signature accepted");
  }

  // 2. Missing signature
  {
    const result = runMiddleware(
      makeRequest({ rawBody })
    );

    assert.equal(result.nextCalled, false);
    assert.equal(result.res.statusCode, 401);

    console.log("PASS: missing signature rejected");
  }

  // 3. Incorrect signature
  {
    const result = runMiddleware(
      makeRequest({
        signature: sign(rawBody, "wrong-test-secret"),
        rawBody,
      })
    );

    assert.equal(result.nextCalled, false);
    assert.equal(result.res.statusCode, 401);

    console.log("PASS: incorrect signature rejected");
  }

  // 4. Missing original body
  {
    const result = runMiddleware(
      makeRequest({
        signature: sign(rawBody),
      })
    );

    assert.equal(result.nextCalled, false);
    assert.equal(result.res.statusCode, 400);

    console.log("PASS: missing raw body rejected");
  }

  // 5. Missing app secret
  {
    delete process.env.META_APP_SECRET;

    const result = runMiddleware(
      makeRequest({
        signature: sign(rawBody),
        rawBody,
      })
    );

    assert.equal(result.nextCalled, false);
    assert.equal(result.res.statusCode, 503);

    console.log("PASS: missing app secret fails closed");
  }

  console.log("\nAll signature middleware tests passed.");

} finally {
  if (originalSecret === undefined) {
    delete process.env.META_APP_SECRET;
  } else {
    process.env.META_APP_SECRET = originalSecret;
  }
}