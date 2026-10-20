import test from "node:test";
import assert from "node:assert/strict";

import {
  createWhatsAppStatusWebhookHandler,
} from "./middleware/handleWhatsAppStatusWebhook.js";

const ORGANIZATION_ID = "org-test-001";
const MESSAGE_ID = "message-test-001";
const DELIVERY_JOB_ID = "delivery-job-test-001";
const PHONE_NUMBER_ID = "meta-phone-test-001";
const PROVIDER_MESSAGE_ID = "wamid.test-message-001";

function createQuery(result) {
  const query = {
    select() {
      return query;
    },
    limit() {
      return query;
    },
    lean() {
      return Promise.resolve(result);
    },
  };

  return query;
}

function createHarness({
  organization = { _id: ORGANIZATION_ID },
  deliveryJobs = [{
    _id: DELIVERY_JOB_ID,
    messageId: MESSAGE_ID,
    organizationId: ORGANIZATION_ID,
  }],
  currentMessage = {
    _id: MESSAGE_ID,
    status: "sent",
    deliveredAt: null,
  },
  updatedMessage = { _id: MESSAGE_ID },
  resolverError = null,
  databaseError = null,
} = {}) {
  const calls = {
    resolver: [],
    deliveryJobFind: [],
    messageFindOne: [],
    messageFindOneAndUpdate: [],
    next: 0,
    responseStatus: null,
    responseBody: null,
  };

  const DeliveryJobModel = {
    find(filter) {
      calls.deliveryJobFind.push(filter);

      return createQuery(deliveryJobs);
    },
  };

  const MessageModel = {
    findOne(filter) {
      calls.messageFindOne.push(filter);

      return createQuery(currentMessage);
    },

    async findOneAndUpdate(filter, update, options) {
      calls.messageFindOneAndUpdate.push({
        filter,
        update,
        options,
      });

      if (databaseError) {
        throw databaseError;
      }

      return updatedMessage;
    },
  };

  const resolveByWhatsAppFn = async (phoneNumberId) => {
    calls.resolver.push(phoneNumberId);

    if (resolverError) {
      throw resolverError;
    }

    return organization;
  };

  const handler = createWhatsAppStatusWebhookHandler({
    DeliveryJobModel,
    MessageModel,
    resolveByWhatsAppFn,
  });

  const req = {
    body: {
      object: "whatsapp_business_account",
      entry: [{
        changes: [{
          field: "messages",
          value: {
            metadata: {
              phone_number_id: PHONE_NUMBER_ID,
            },
            statuses: [{
              id: PROVIDER_MESSAGE_ID,
              status: "delivered",
              timestamp: "1790000000",
            }],
          },
        }],
      }],
    },
  };

  const res = {
    status(code) {
      calls.responseStatus = code;
      return res;
    },

    json(body) {
      calls.responseBody = body;
      return res;
    },
  };

  const next = () => {
    calls.next += 1;
  };

  return {
    calls,
    handler,
    req,
    res,
    next,
  };
}

test("delivered callback updates only the matching outbound message", async () => {
  const harness = createHarness();

  await harness.handler(
    harness.req,
    harness.res,
    harness.next
  );

  assert.equal(harness.calls.resolver.length, 1);
  assert.equal(
    harness.calls.resolver[0],
    PHONE_NUMBER_ID
  );

  assert.deepEqual(
    harness.calls.deliveryJobFind[0],
    {
      organizationId: ORGANIZATION_ID,
      source: "whatsapp",
      provider: "meta_whatsapp_cloud_api",
      providerMessageId: PROVIDER_MESSAGE_ID,
    }
  );

  assert.deepEqual(
    harness.calls.messageFindOne[0],
    {
      _id: MESSAGE_ID,
      organizationId: ORGANIZATION_ID,
      source: "whatsapp",
      senderRole: {
        $in: ["ai", "agent", "admin"],
      },
    }
  );

  const updateCall =
    harness.calls.messageFindOneAndUpdate[0];

  assert.ok(updateCall);

  assert.equal(
    updateCall.update.$set.status,
    "delivered"
  );

  assert.ok(
    updateCall.update.$set.deliveredAt instanceof Date
  );

  assert.deepEqual(
    updateCall.filter.status,
    {
      $in: ["sending", "sent", "delivered"],
    }
  );

  assert.equal(updateCall.options.new, true);
  assert.equal(updateCall.options.runValidators, true);

  assert.equal(harness.calls.responseStatus, 200);
  assert.equal(harness.calls.next, 0);

  assert.deepEqual(harness.calls.responseBody, {
    success: true,
    statusCallbacksProcessed: 1,
  });
});

test("read callback does not set deliveredAt from the read timestamp", async () => {
  const harness = createHarness({
    currentMessage: {
      _id: MESSAGE_ID,
      status: "delivered",
      deliveredAt: new Date("2026-10-01T10:00:00.000Z"),
    },
  });

  harness.req.body.entry[0].changes[0].value.statuses[0] = {
    id: PROVIDER_MESSAGE_ID,
    status: "read",
    timestamp: "1790000100",
  };

  await harness.handler(
    harness.req,
    harness.res,
    harness.next
  );

  const update =
    harness.calls.messageFindOneAndUpdate[0].update.$set;

  assert.equal(update.status, "read");
  assert.equal(
    Object.hasOwn(update, "deliveredAt"),
    false
  );
});

test("stale sent callback does not downgrade delivered status", async () => {
  const harness = createHarness({
    currentMessage: {
      _id: MESSAGE_ID,
      status: "delivered",
      deliveredAt: new Date("2026-10-01T10:00:00.000Z"),
    },
  });

  harness.req.body.entry[0].changes[0].value.statuses[0] = {
    id: PROVIDER_MESSAGE_ID,
    status: "sent",
    timestamp: "1790000200",
  };

  await harness.handler(
    harness.req,
    harness.res,
    harness.next
  );

  const updateCall =
    harness.calls.messageFindOneAndUpdate[0];

  assert.equal(updateCall.update.$set.status, "delivered");
  assert.equal(
    Object.hasOwn(updateCall.update.$set, "deliveredAt"),
    false
  );
});

test("missing organization returns 503 without querying delivery jobs", async () => {
  const harness = createHarness({
    organization: null,
  });

  await harness.handler(
    harness.req,
    harness.res,
    harness.next
  );

  assert.equal(harness.calls.responseStatus, 503);
  assert.equal(harness.calls.deliveryJobFind.length, 0);
  assert.equal(harness.calls.messageFindOneAndUpdate.length, 0);
  assert.equal(harness.calls.next, 0);
});

test("missing delivery job returns 503 without updating a message", async () => {
  const harness = createHarness({
    deliveryJobs: [],
  });

  await harness.handler(
    harness.req,
    harness.res,
    harness.next
  );

  assert.equal(harness.calls.responseStatus, 503);
  assert.equal(harness.calls.messageFindOne.length, 0);
  assert.equal(harness.calls.messageFindOneAndUpdate.length, 0);
});

test("ambiguous delivery jobs return 503 without updating a message", async () => {
  const harness = createHarness({
    deliveryJobs: [
      {
        _id: "job-1",
        messageId: MESSAGE_ID,
        organizationId: ORGANIZATION_ID,
      },
      {
        _id: "job-2",
        messageId: MESSAGE_ID,
        organizationId: ORGANIZATION_ID,
      },
    ],
  });

  await harness.handler(
    harness.req,
    harness.res,
    harness.next
  );

  assert.equal(harness.calls.responseStatus, 503);
  assert.equal(harness.calls.messageFindOne.length, 0);
  assert.equal(harness.calls.messageFindOneAndUpdate.length, 0);
});

test("database update error returns 500", async () => {
  const harness = createHarness({
    databaseError: new Error("Simulated database failure"),
  });

  await harness.handler(
    harness.req,
    harness.res,
    harness.next
  );

  assert.equal(harness.calls.responseStatus, 500);

  assert.deepEqual(harness.calls.responseBody, {
    success: false,
    error: "WhatsApp status callback processing failed.",
  });
});

test("status-only callback returns 200 without calling next", async () => {
  const harness = createHarness();

  await harness.handler(
    harness.req,
    harness.res,
    harness.next
  );

  assert.equal(harness.calls.responseStatus, 200);
  assert.equal(harness.calls.next, 0);
});

test("inbound message continues to the existing pipeline", async () => {
  const harness = createHarness();

  harness.req.body.entry[0].changes[0].value = {
    metadata: {
      phone_number_id: PHONE_NUMBER_ID,
    },
    messages: [{
      id: "inbound-message-test-001",
      from: "254700000000",
      type: "text",
      text: {
        body: "I am looking for a house",
      },
    }],
  };

  await harness.handler(
    harness.req,
    harness.res,
    harness.next
  );

  assert.equal(harness.calls.next, 1);
  assert.equal(harness.calls.responseStatus, null);
  assert.equal(harness.calls.messageFindOneAndUpdate.length, 0);
});

test("mixed status and inbound message processes status and continues pipeline", async () => {
  const harness = createHarness();

  harness.req.body.entry[0].changes[0].value.messages = [{
    id: "inbound-message-test-002",
    from: "254700000000",
    type: "text",
    text: {
      body: "Thanks",
    },
  }];

  await harness.handler(
    harness.req,
    harness.res,
    harness.next
  );

  assert.equal(
    harness.calls.messageFindOneAndUpdate.length,
    1
  );

  assert.equal(harness.calls.next, 1);
  assert.equal(harness.calls.responseStatus, null);
});

test("missing outbound message is acknowledged without an update", async () => {
  const harness = createHarness({
    currentMessage: null,
  });

  await harness.handler(
    harness.req,
    harness.res,
    harness.next
  );

  assert.equal(harness.calls.messageFindOneAndUpdate.length, 0);
  assert.equal(harness.calls.responseStatus, 200);
});

test("unknown provider status is skipped safely", async () => {
  const harness = createHarness();

  harness.req.body.entry[0].changes[0].value.statuses[0] = {
    id: PROVIDER_MESSAGE_ID,
    status: "queued",
    timestamp: "1790000000",
  };

  await harness.handler(
    harness.req,
    harness.res,
    harness.next
  );

  assert.equal(harness.calls.deliveryJobFind.length, 0);
  assert.equal(harness.calls.messageFindOneAndUpdate.length, 0);

  assert.equal(harness.calls.responseStatus, 200);
  assert.equal(harness.calls.next, 0);
});
