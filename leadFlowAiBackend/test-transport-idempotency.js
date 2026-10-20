/**
 * ============================================================
 *
 * LEADFLOW AI
 *
 * TEST 6 — TRANSPORT IDEMPOTENCY PROPAGATION
 *
 * ============================================================
 *
 * PURPOSE
 * ------------------------------------------------------------
 *
 * Verify that:
 *
 * 1. DeliveryJob stores a durable idempotency key.
 * 2. Worker A passes that identity through the transport router.
 * 3. The WhatsApp adapter receives the identity.
 * 4. Worker B retries the same DeliveryJob.
 * 5. Both attempts use the same identity.
 * 6. No real HTTP request reaches Meta.
 *
 * SAFETY
 * ------------------------------------------------------------
 *
 * - Requires local MongoDB replica set rs0.
 * - Creates a temporary organization.
 * - Uses fake WhatsApp credentials.
 * - Intercepts axios.post before network access.
 * - Cleans up only records created by this test.
 *
 * IMPORTANT
 * ------------------------------------------------------------
 *
 * This proves application-level identity propagation.
 * It does NOT prove native Meta API deduplication.
 *
 * ============================================================
 */

import "dotenv/config";

import axios from "axios";
import { randomUUID } from "node:crypto";
import mongoose from "mongoose";

import Message from "./models/message.js";
import DeliveryJob from "./models/deliveryJob.js";
import Organization from "./models/organization.js";

import {
  createDeliveryJob,
  claimDeliveryJob,
} from "./services/deliveryJobService.js";

import {
  sendOutboundMessage,
} from "./services/messageTransportService.js";


/* ============================================================
   CONFIGURATION
============================================================ */

const mongoUri =
  process.env.MONGODB_URI ||
  process.env.MONGO_URI;

if (!mongoUri) {
  throw new Error(
    "MONGODB_URI or MONGO_URI is required."
  );
}

const TEST_PHONE =
  "+254700555555";

const TEST_MESSAGE =
  "Transport idempotency propagation test.";

const WORKER_A =
  "transport-idempotency-worker-A";

const WORKER_B =
  "transport-idempotency-worker-B";


/* ============================================================
   SAVE ORIGINAL PROCESS STATE
============================================================ */

const originalAxiosPost =
  axios.post;

const originalAccessToken =
  process.env.WHATSAPP_ACCESS_TOKEN;

const originalProviderCapture =
  process.env.TEST_CAPTURE_PROVIDER_IDEMPOTENCY;

const originalLegacyCapture =
  process.env.TEST_CAPTURE_IDEMPOTENCY;


/* ============================================================
   TEST
============================================================ */

const run = async () => {
  let connected = false;
  let axiosMockInstalled = false;

  let organizationId = null;
  let message = null;
  let job = null;

  const fakeProviderRequests = [];

  console.log(
    "\n============================================================"
  );

  console.log(
    "TEST 6 — TRANSPORT IDEMPOTENCY PROPAGATION"
  );

  console.log(
    "============================================================\n"
  );

  try {
    /* ========================================================
       CONNECT TO MONGODB
    ======================================================== */

    await mongoose.connect(mongoUri);

    connected = true;

    const hello =
      await mongoose.connection.db
        .admin()
        .command({
          hello: 1,
        });

    console.log(
      "DATABASE CONNECTION:"
    );

    console.log({
      host: mongoose.connection.host,
      database: mongoose.connection.name,
      replicaSet: hello.setName || null,
      isWritablePrimary: hello.isWritablePrimary,
      primary: hello.primary || null,
    });

    /*
     * Fail closed unless the test is connected to the intended
     * local replica set.
     */

    if (
      mongoose.connection.host !== "127.0.0.1" &&
      mongoose.connection.host !== "localhost"
    ) {
      throw new Error(
        "SAFETY STOP: This test must run against local MongoDB."
      );
    }

    if (
      hello.setName !== "rs0" ||
      hello.isWritablePrimary !== true
    ) {
      throw new Error(
        "SAFETY STOP: Expected local replica set rs0 with a writable primary."
      );
    }

    console.log(
      "\nLocal replica-set safety check passed."
    );


    /* ========================================================
       CREATE ISOLATED TEST ORGANIZATION
    ======================================================== */

    const testId =
      randomUUID();

    const organizationDocument = {
      name:
        `LeadFlowAI Transport Test ${testId}`,

      email:
        `transport-test-${testId}@example.invalid`,

      phone:
        TEST_PHONE,

      website:
        "",

      address:
        "",

      whatsappEnabled:
        true,

      whatsappPhoneNumberId:
        `test-phone-${testId}`,

      whatsappBusinessAccountId:
        `test-business-${testId}`,

      whatsappBusinessNumber:
        TEST_PHONE,

      whatsappDisplayName:
        "LeadFlowAI Transport Test",

      isActive:
        true,

      createdAt:
        new Date(),

      updatedAt:
        new Date(),
    };

    /*
     * Native collection insert avoids running unrelated
     * Organization Mongoose pre-save hooks.
     */

    const organizationInsert =
      await Organization.collection.insertOne(
        organizationDocument
      );

    organizationId =
      organizationInsert.insertedId;

    console.log(
      "\nTemporary test organization created."
    );

    console.log({
      organizationId: String(organizationId),
      whatsappEnabled: true,
    });


    /* ========================================================
       INSTALL TEST-ONLY PROVIDER CONFIGURATION
    ======================================================== */

    process.env.WHATSAPP_ACCESS_TOKEN =
      "test-token-not-real";

    process.env.TEST_CAPTURE_PROVIDER_IDEMPOTENCY =
      "true";

    /*
     * The following flag is retained for compatibility with
     * the older test, but the WhatsApp service uses the
     * provider-specific flag above.
     */

    process.env.TEST_CAPTURE_IDEMPOTENCY =
      "true";


    /* ========================================================
       INTERCEPT AXIOS BEFORE ANY NETWORK ACCESS
    ======================================================== */

    axios.post = async (
      url,
      body,
      config
    ) => {
      const requestNumber =
        fakeProviderRequests.length + 1;

      const providerMessageId =
        `fake-transport-${requestNumber}`;

      const request = {
        url,
        body,
        headers: config?.headers,
        providerMessageId,
      };

      fakeProviderRequests.push(request);

      console.log(
        "\nFAKE PROVIDER ACCEPTED REQUEST:"
      );

      console.log({
        requestNumber,
        providerMessageId,
        recipient: body?.to,
      });

      return {
        status: 200,
        statusText: "OK",

        data: {
          messaging_product: "whatsapp",

          contacts: [
            {
              input: body.to,
              wa_id: body.to,
            },
          ],

          messages: [
            {
              id: providerMessageId,
            },
          ],
        },
      };
    };

    axiosMockInstalled = true;


    /* ========================================================
       CREATE TEST MESSAGE
    ======================================================== */

    message =
      await Message.create({
        organizationId,

        conversationId:
          new mongoose.Types.ObjectId(),

        leadId:
          new mongoose.Types.ObjectId(),

        source:
          "whatsapp",

        senderId:
          null,

        senderRole:
          "ai",

        senderName:
          "AI Assistant",

        text:
          TEST_MESSAGE,

        status:
          "sending",

        aiGenerated:
          true,

        aiConfidence:
          0.95,
      });

    console.log(
      "\nTest message created:",
      String(message._id)
    );


    /* ========================================================
       CREATE DELIVERY JOB
    ======================================================== */

    const createResult =
      await createDeliveryJob({
        organizationId,

        messageId:
          message._id,

        conversationId:
          message.conversationId,

        leadId:
          message.leadId,

        source:
          "whatsapp",

        recipient:
          TEST_PHONE,
      });

    job =
      createResult.job;

    if (!job) {
      throw new Error(
        "FAIL: DeliveryJob was not created."
      );
    }

    const expectedKey =
      `ai-reply:${message._id}`;

    console.log(
      "\nDeliveryJob created:"
    );

    console.log({
      jobId: String(job._id),
      idempotencyKey: job.idempotencyKey,
      provider: job.provider,
      status: job.status,
    });

    if (
      job.idempotencyKey !== expectedKey
    ) {
      throw new Error(
        [
          "FAIL: Incorrect DeliveryJob idempotency key.",
          `Expected: ${expectedKey}`,
          `Actual: ${job.idempotencyKey}`,
        ].join("\n")
      );
    }

    if (
      job.provider !== "meta_whatsapp_cloud_api"
    ) {
      throw new Error(
        [
          "FAIL: Incorrect DeliveryJob provider.",
          `Actual: ${job.provider}`,
        ].join("\n")
      );
    }


    /* ========================================================
       WORKER A CLAIM
    ======================================================== */

    const workerAJob =
      await claimDeliveryJob(
        job._id,
        {
          workerName: WORKER_A,
          leaseDurationMs: 1000,
          organizationId,
        }
      );

    if (!workerAJob) {
      throw new Error(
        "FAIL: Worker A could not claim DeliveryJob."
      );
    }

    console.log(
      "\nWorker A claimed DeliveryJob:",
      {
        attempts: workerAJob.attempts,
        idempotencyKey: workerAJob.idempotencyKey,
      }
    );


    /* ========================================================
       WORKER A TRANSPORT
    ======================================================== */

    const transportContextA = {
      organizationId:
        workerAJob.organizationId,

      leadId:
        workerAJob.leadId,

      conversationId:
        workerAJob.conversationId,

      messageId:
        workerAJob.messageId,

      deliveryJobId:
        workerAJob._id,

      source:
        workerAJob.source,

      provider:
        workerAJob.provider,

      channelMetadata:
        workerAJob.channelMetadata || {},

      metadata:
        workerAJob.metadata || {},

      idempotencyKey:
        workerAJob.idempotencyKey,
    };

    const resultA =
      await sendOutboundMessage({
        source: workerAJob.source,
        phone: workerAJob.recipient,
        message: TEST_MESSAGE,
        context: transportContextA,
      });

    console.log(
      "\nWorker A transport result:",
      {
        success: resultA?.success,
        provider: resultA?.provider,
        testProviderIdentity:
          resultA?.testProviderIdentity,
      }
    );

    if (resultA?.success !== true) {
      throw new Error(
        [
          "FAIL: Worker A transport did not succeed.",
          `Reason: ${resultA?.reason || "Unknown error"}`,
        ].join("\n")
      );
    }

    const identityA =
      resultA?.testProviderIdentity;

    if (
      identityA?.idempotencyKey !==
      workerAJob.idempotencyKey
    ) {
      throw new Error(
        "FAIL: Worker A idempotency key did not reach the WhatsApp adapter."
      );
    }

    if (
      String(identityA?.messageId) !==
      String(workerAJob.messageId)
    ) {
      throw new Error(
        "FAIL: Worker A messageId did not reach the adapter."
      );
    }

    if (
      String(identityA?.deliveryJobId) !==
      String(workerAJob._id)
    ) {
      throw new Error(
        "FAIL: Worker A deliveryJobId did not reach the adapter."
      );
    }

    if (
      fakeProviderRequests.length !== 1
    ) {
      throw new Error(
        "FAIL: Expected exactly one intercepted request after Worker A."
      );
    }

    console.log(
      "\nPASS: Worker A identity reached the mocked provider boundary."
    );


    /* ========================================================
       SIMULATE WORKER A CRASH
    ======================================================== */

    /*
     * The fake provider accepted request 1, but the worker did
     * not mark the job sent. Prepare only this test job for
     * retry; do not invoke global stale-job recovery.
     */

    const retryPreparation =
      await DeliveryJob.updateOne(
        {
          _id: job._id,
          organizationId,
          status: "processing",
        },
        {
          $set: {
            status: "failed",

            nextAttemptAt:
              new Date(Date.now() - 1000),

            lockToken: null,
            lockExpiresAt: null,
            lockedAt: null,
            workerName: null,

            lastError:
              "TEST: simulated worker crash after fake provider acceptance",

            lastErrorAt:
              new Date(),
          },
        }
      );

    if (
      retryPreparation.matchedCount !== 1
    ) {
      throw new Error(
        "FAIL: Could not safely prepare the test job for retry."
      );
    }

    console.log(
      "\nWorker A crash simulated. Only the test job was modified."
    );


    /* ========================================================
       WORKER B CLAIM
    ======================================================== */

    const workerBJob =
      await claimDeliveryJob(
        job._id,
        {
          workerName: WORKER_B,
          leaseDurationMs: 1000,
          organizationId,
        }
      );

    if (!workerBJob) {
      throw new Error(
        "FAIL: Worker B could not reclaim the DeliveryJob."
      );
    }

    console.log(
      "\nWorker B claimed DeliveryJob:",
      {
        attempts: workerBJob.attempts,
        idempotencyKey: workerBJob.idempotencyKey,
      }
    );


    /* ========================================================
       VERIFY SAME DURABLE IDENTITY
    ======================================================== */

    if (
      workerBJob.idempotencyKey !==
      workerAJob.idempotencyKey
    ) {
      throw new Error(
        "FAIL: Worker B received a different idempotency key."
      );
    }

    if (
      String(workerBJob.messageId) !==
      String(workerAJob.messageId)
    ) {
      throw new Error(
        "FAIL: Worker B received a different messageId."
      );
    }

    if (
      String(workerBJob._id) !==
      String(workerAJob._id)
    ) {
      throw new Error(
        "FAIL: Worker B claimed a different DeliveryJob."
      );
    }


    /* ========================================================
       WORKER B TRANSPORT
    ======================================================== */

    const transportContextB = {
      organizationId:
        workerBJob.organizationId,

      leadId:
        workerBJob.leadId,

      conversationId:
        workerBJob.conversationId,

      messageId:
        workerBJob.messageId,

      deliveryJobId:
        workerBJob._id,

      source:
        workerBJob.source,

      provider:
        workerBJob.provider,

      channelMetadata:
        workerBJob.channelMetadata || {},

      metadata:
        workerBJob.metadata || {},

      idempotencyKey:
        workerBJob.idempotencyKey,
    };

    const resultB =
      await sendOutboundMessage({
        source: workerBJob.source,
        phone: workerBJob.recipient,
        message: TEST_MESSAGE,
        context: transportContextB,
      });

    console.log(
      "\nWorker B transport result:",
      {
        success: resultB?.success,
        provider: resultB?.provider,
        testProviderIdentity:
          resultB?.testProviderIdentity,
      }
    );

    if (resultB?.success !== true) {
      throw new Error(
        [
          "FAIL: Worker B transport did not succeed.",
          `Reason: ${resultB?.reason || "Unknown error"}`,
        ].join("\n")
      );
    }

    const identityB =
      resultB?.testProviderIdentity;

    if (
      identityB?.idempotencyKey !==
      workerBJob.idempotencyKey
    ) {
      throw new Error(
        "FAIL: Worker B idempotency key did not reach the adapter."
      );
    }

    if (
      identityB?.idempotencyKey !==
      identityA?.idempotencyKey
    ) {
      throw new Error(
        "FAIL: Idempotency identity changed between attempts."
      );
    }

    if (
      String(identityB?.messageId) !==
      String(identityA?.messageId)
    ) {
      throw new Error(
        "FAIL: messageId changed between attempts."
      );
    }

    if (
      String(identityB?.deliveryJobId) !==
      String(identityA?.deliveryJobId)
    ) {
      throw new Error(
        "FAIL: deliveryJobId changed between attempts."
      );
    }

    if (
      fakeProviderRequests.length !== 2
    ) {
      throw new Error(
        [
          "FAIL: Expected exactly two intercepted provider requests.",
          `Actual: ${fakeProviderRequests.length}`,
        ].join("\n")
      );
    }

    console.log(
      "\nPASS: Worker B reused the same identity."
    );


    /* ========================================================
       FINAL ASSERTIONS
    ======================================================== */

    console.log(
      "\n============================================================"
    );

    console.log(
      "TEST 6 RESULT: PASS"
    );

    console.log(
      "============================================================"
    );

    console.log(
      "\nVerified:"
    );

    console.log(
      "1. DeliveryJob stores a durable idempotency key."
    );

    console.log(
      "2. Worker A passes the key through the real transport router."
    );

    console.log(
      "3. The WhatsApp adapter receives the expected identity."
    );

    console.log(
      "4. Worker B retries the same DeliveryJob."
    );

    console.log(
      "5. Both attempts use the same idempotency identity."
    );

    console.log(
      "6. Both provider HTTP calls were intercepted locally."
    );

    console.log(
      "\nThis test does not prove native Meta API deduplication."
    );

  } finally {
    /* ========================================================
       RESTORE AXIOS
    ======================================================== */

    if (axiosMockInstalled) {
      axios.post = originalAxiosPost;
    }


    /* ========================================================
       RESTORE ENVIRONMENT VARIABLES
    ======================================================== */

    const restoreEnvironmentVariable = (
      name,
      originalValue
    ) => {
      if (originalValue === undefined) {
        delete process.env[name];
      } else {
        process.env[name] = originalValue;
      }
    };

    restoreEnvironmentVariable(
      "WHATSAPP_ACCESS_TOKEN",
      originalAccessToken
    );

    restoreEnvironmentVariable(
      "TEST_CAPTURE_PROVIDER_IDEMPOTENCY",
      originalProviderCapture
    );

    restoreEnvironmentVariable(
      "TEST_CAPTURE_IDEMPOTENCY",
      originalLegacyCapture
    );


    /* ========================================================
       CLEAN UP ONLY TEST-OWNED RECORDS
    ======================================================== */

    if (
      connected &&
      organizationId
    ) {
      if (job?._id) {
        await DeliveryJob.deleteOne({
          _id: job._id,
          organizationId,
        });
      }

      if (message?._id) {
        await Message.deleteOne({
          _id: message._id,
          organizationId,
        });
      }

      await Organization.collection.deleteOne({
        _id: organizationId,
      });

      console.log(
        "\nTemporary test records cleaned up."
      );
    }


    /* ========================================================
       DISCONNECT
    ======================================================== */

    if (
      connected &&
      mongoose.connection.readyState !== 0
    ) {
      await mongoose.disconnect();

      console.log(
        "MongoDB disconnected."
      );
    }
  }
};


/* ============================================================
   RUN TEST
============================================================ */

run().catch((error) => {
  console.error(
    "\nTEST 6 FAILED:"
  );

  console.error(
    error?.stack || error
  );

  process.exitCode = 1;
});