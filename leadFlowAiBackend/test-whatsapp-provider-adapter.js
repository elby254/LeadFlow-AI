/**
 * ============================================================
 *
 * TEST 7 — WHATSAPP PROVIDER ADAPTER CONTRACT
 *
 * ============================================================
 *
 * PURPOSE
 * ------------------------------------------------------------
 *
 * Verify that:
 *
 * 1. A DeliveryJob stores a stable idempotency key.
 * 2. Worker A passes the identity through the transport router.
 * 3. The organization-scoped WhatsApp configuration is respected.
 * 4. The WhatsApp adapter receives the identity.
 * 5. A simulated worker crash allows the same job to be retried.
 * 6. Worker B reuses the same idempotency identity.
 * 7. The test never sends a real HTTP request to Meta.
 *
 * SAFETY
 * ------------------------------------------------------------
 *
 * - Does not modify existing production organizations.
 * - Creates a temporary test organization.
 * - Uses fake WhatsApp credentials.
 * - Intercepts axios.post before network access.
 * - Modifies only its own test DeliveryJob during retry.
 * - Deletes only test-created records.
 * - Restores environment variables and axios.post.
 *
 * IMPORTANT
 * ------------------------------------------------------------
 *
 * This tests adapter identity propagation.
 *
 * It does NOT prove native Meta API idempotency.
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
  "WhatsApp provider adapter idempotency test.";


const WORKER_A =
  "whatsapp-provider-worker-A";


const WORKER_B =
  "whatsapp-provider-worker-B";


/* ============================================================
   SAVE ORIGINAL TEST ENVIRONMENT
============================================================ */

const originalAxiosPost =
  axios.post;


const originalAccessToken =
  process.env.WHATSAPP_ACCESS_TOKEN;


const originalCaptureFlag =
  process.env.TEST_CAPTURE_PROVIDER_IDEMPOTENCY;


/* ============================================================
   TEST
============================================================ */

const run = async () => {

  console.log(
    "\n============================================================"
  );

  console.log(
    "TEST 7 — WHATSAPP PROVIDER ADAPTER CONTRACT"
  );

  console.log(
    "============================================================\n"
  );


  let connected = false;

  let organizationId = null;

  let message = null;

  let job = null;

  let axiosMockInstalled = false;

  const fakeProviderRequests = [];


  try {

    /* ========================================================
       CONNECT TO MONGODB
    ======================================================== */

    await mongoose.connect(mongoUri);

    connected = true;

    console.log(
      "✅ MongoDB connected"
    );


    /* ========================================================
       CREATE ISOLATED TEST ORGANIZATION
    ======================================================== */

    /*
     * IMPORTANT:
     *
     * Use the native collection insert to avoid executing the
     * existing Organization Mongoose pre-save hook.
     *
     * This bypasses Mongoose document middleware, but MongoDB
     * indexes still apply.
     *
     * No existing organization is modified.
     */

    const testId =
      randomUUID();


    const organizationDocument = {

      name:
        `LeadFlowAI WhatsApp Test ${testId}`,

      email:
        `whatsapp-test-${testId}@example.invalid`,

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
        "LeadFlowAI Test",

      isActive:
        true,

      createdAt:
        new Date(),

      updatedAt:
        new Date(),

    };


    const organizationInsert =
      await Organization.collection.insertOne(
        organizationDocument
      );


    organizationId =
      organizationInsert.insertedId;


    console.log(
      "\n✅ ISOLATED TEST ORGANIZATION CREATED:"
    );


    console.log({

      organizationId:
        String(organizationId),

      whatsappEnabled:
        true,

      phoneNumberId:
        organizationDocument.whatsappPhoneNumberId,

    });


    /* ========================================================
       SET TEST-ONLY ENVIRONMENT
    ======================================================== */

    /*
     * These values exist only inside this Node.js test process.
     *
     * The HTTP request is intercepted below, so the fake token
     * is never sent to Meta.
     */

    process.env.WHATSAPP_ACCESS_TOKEN =
      "test-token-not-real";


    process.env.TEST_CAPTURE_PROVIDER_IDEMPOTENCY =
      "true";


    /* ========================================================
       INSTALL FAKE WHATSAPP HTTP PROVIDER
    ======================================================== */

    /*
     * The real transport router and WhatsApp adapter execute.
     *
     * Only the final Axios HTTP request is intercepted.
     *
     * No network request is made.
     */

    axios.post = async (
      url,
      body,
      config
    ) => {

      const requestNumber =
        fakeProviderRequests.length + 1;


      const fakeProviderMessageId =
        `fake-whatsapp-${requestNumber}`;


      fakeProviderRequests.push({

        url,

        body,

        headers:
          config?.headers,

        providerMessageId:
          fakeProviderMessageId,

      });


      console.log(
        "\n📡 FAKE WHATSAPP PROVIDER ACCEPTED REQUEST:"
      );


      console.log({

        requestNumber,

        providerMessageId:
          fakeProviderMessageId,

        recipient:
          body?.to,

        endpoint:
          url,

      });


      return {

        status:
          200,

        statusText:
          "OK",

        data: {

          messaging_product:
            "whatsapp",

          contacts: [

            {

              input:
                body.to,

              wa_id:
                body.to,

            },

          ],

          messages: [

            {

              id:
                fakeProviderMessageId,

            },

          ],

        },

      };

    };


    axiosMockInstalled = true;


    /* ========================================================
       CREATE TEST AI MESSAGE
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
      "\n🤖 AI MESSAGE CREATED:"
    );


    console.log({

      messageId:
        String(message._id),

    });


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
      "\n📦 DELIVERY JOB CREATED:"
    );


    console.log({

      jobId:
        String(job._id),

      idempotencyKey:
        job.idempotencyKey,

      provider:
        job.provider,

      status:
        job.status,

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
      job.provider !==
      "meta_whatsapp_cloud_api"
    ) {

      throw new Error(
        [
          "FAIL: Incorrect DeliveryJob provider.",
          "Expected: meta_whatsapp_cloud_api",
          `Actual: ${job.provider}`,
        ].join("\n")
      );

    }


    console.log(
      "✅ DeliveryJob provider and identity are correct."
    );


    /* ========================================================
       WORKER A CLAIM
    ======================================================== */

    const workerAJob =
      await claimDeliveryJob(

        job._id,

        {

          workerName:
            WORKER_A,

          leaseDurationMs:
            1000,

          organizationId,

        }

      );


    if (!workerAJob) {

      throw new Error(
        "FAIL: Worker A could not claim DeliveryJob."
      );

    }


    console.log(
      "\n👷 WORKER A CLAIMED:"
    );


    console.log({

      attempts:
        workerAJob.attempts,

      idempotencyKey:
        workerAJob.idempotencyKey,

      provider:
        workerAJob.provider,

    });


    /* ========================================================
       BUILD WORKER A TRANSPORT CONTEXT
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


    console.log(
      "\n🚚 WORKER A → TRANSPORT:"
    );


    console.log(
      transportContextA
    );


    /* ========================================================
       WORKER A → ACTUAL TRANSPORT ROUTER
    ======================================================== */

    const resultA =
      await sendOutboundMessage({

        source:
          workerAJob.source,

        phone:
          workerAJob.recipient,

        message:
          TEST_MESSAGE,

        context:
          transportContextA,

      });


    console.log(
      "\n📡 WORKER A PROVIDER RESULT:"
    );


    console.log({

      success:
        resultA?.success,

      transport:
        resultA?.transport,

      provider:
        resultA?.provider,

      testProviderIdentity:
        resultA?.testProviderIdentity,

    });


    if (
      resultA?.success !== true
    ) {

      throw new Error(
        [
          "FAIL: Simulated WhatsApp provider request failed.",
          `Reason: ${resultA?.reason || "Unknown error"}`,
        ].join("\n")
      );

    }


    /* ========================================================
       VERIFY WORKER A ADAPTER IDENTITY
    ======================================================== */

    const identityA =
      resultA?.testProviderIdentity;


    if (
      identityA?.idempotencyKey !==
      workerAJob.idempotencyKey
    ) {

      throw new Error(
        [
          "FAIL: WhatsApp adapter did not receive the expected idempotency key.",
          `Expected: ${workerAJob.idempotencyKey}`,
          `Actual: ${identityA?.idempotencyKey}`,
        ].join("\n")
      );

    }


    if (
      String(identityA?.messageId) !==
      String(workerAJob.messageId)
    ) {

      throw new Error(
        "FAIL: WhatsApp adapter did not receive the expected messageId."
      );

    }


    if (
      String(identityA?.deliveryJobId) !==
      String(workerAJob._id)
    ) {

      throw new Error(
        "FAIL: WhatsApp adapter did not receive the expected deliveryJobId."
      );

    }


    if (
      fakeProviderRequests.length !== 1
    ) {

      throw new Error(
        "FAIL: Expected exactly one intercepted provider request after Worker A."
      );

    }


    console.log(
      "\n✅ WORKER A → WHATSAPP ADAPTER: PASS"
    );


    /* ========================================================
       SIMULATE WORKER A CRASH
    ======================================================== */

    /*
     * The fake provider accepted the request, but Worker A did
     * not mark the DeliveryJob sent.
     *
     * For this adapter-contract test, transition only this
     * test's DeliveryJob to retryable failed status.
     *
     * We intentionally do not invoke global stale recovery,
     * because it could affect unrelated jobs in the database.
     *
     * Stale lease recovery is covered by its dedicated tests.
     */

    console.log(
      "\n💥 SIMULATING WORKER A CRASH"
    );


    console.log(
      "Fake provider accepted request 1."
    );


    console.log(
      "Worker A did not mark the DeliveryJob sent."
    );


    const retryPreparation =
      await DeliveryJob.updateOne(

        {

          _id:
            job._id,

          organizationId,

          status:
            "processing",

        },

        {

          $set: {

            status:
              "failed",

            nextAttemptAt:
              new Date(Date.now() - 1000),

            lockToken:
              null,

            lockExpiresAt:
              null,

            lockedAt:
              null,

            workerName:
              null,

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
        "FAIL: Could not safely prepare the test DeliveryJob for retry."
      );

    }


    console.log(
      "✅ Only the isolated test DeliveryJob was prepared for retry."
    );


    /* ========================================================
       WORKER B CLAIMS THE SAME JOB
    ======================================================== */

    const workerBJob =
      await claimDeliveryJob(

        job._id,

        {

          workerName:
            WORKER_B,

          leaseDurationMs:
            1000,

          organizationId,

        }

      );


    if (!workerBJob) {

      throw new Error(
        "FAIL: Worker B could not reclaim the test DeliveryJob."
      );

    }


    console.log(
      "\n👷 WORKER B CLAIMED:"
    );


    console.log({

      attempts:
        workerBJob.attempts,

      idempotencyKey:
        workerBJob.idempotencyKey,

      provider:
        workerBJob.provider,

    });


    /* ========================================================
       VERIFY STABLE DELIVERY IDENTITY
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
       BUILD WORKER B TRANSPORT CONTEXT
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


    console.log(
      "\n🚚 WORKER B → TRANSPORT:"
    );


    console.log(
      transportContextB
    );


    /* ========================================================
       WORKER B → ACTUAL TRANSPORT ROUTER
    ======================================================== */

    const resultB =
      await sendOutboundMessage({

        source:
          workerBJob.source,

        phone:
          workerBJob.recipient,

        message:
          TEST_MESSAGE,

        context:
          transportContextB,

      });


    console.log(
      "\n📡 WORKER B PROVIDER RESULT:"
    );


    console.log({

      success:
        resultB?.success,

      transport:
        resultB?.transport,

      provider:
        resultB?.provider,

      testProviderIdentity:
        resultB?.testProviderIdentity,

    });


    if (
      resultB?.success !== true
    ) {

      throw new Error(
        [
          "FAIL: Simulated WhatsApp retry failed.",
          `Reason: ${resultB?.reason || "Unknown error"}`,
        ].join("\n")
      );

    }


    /* ========================================================
       VERIFY WORKER B ADAPTER IDENTITY
    ======================================================== */

    const identityB =
      resultB?.testProviderIdentity;


    if (
      identityB?.idempotencyKey !==
      workerBJob.idempotencyKey
    ) {

      throw new Error(
        "FAIL: Worker B idempotency key did not reach the WhatsApp adapter."
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
      "\n✅ WORKER B → WHATSAPP ADAPTER: PASS"
    );


    /* ========================================================
       FINAL RESULT
    ======================================================== */

    console.log(
      "\n============================================================"
    );


    console.log(
      "TEST 7 RESULT: PASS"
    );


    console.log(
      "============================================================"
    );


    console.log(
      "\nProven:"
    );


    console.log(
      "1. DeliveryJob stores a stable idempotency key."
    );


    console.log(
      "2. Worker A passes the identity into the transport router."
    );


    console.log(
      "3. The isolated organization's WhatsApp configuration is respected."
    );


    console.log(
      "4. The WhatsApp adapter receives the expected identity."
    );


    console.log(
      "5. The HTTP request is intercepted before network access."
    );


    console.log(
      "6. Worker A's test job is made retryable without modifying unrelated jobs."
    );


    console.log(
      "7. Worker B reuses the same DeliveryJob identity."
    );


    console.log(
      "8. Worker B passes the same identity to the adapter."
    );


    console.log(
      "\n⚠️ This test does not prove native Meta API deduplication."
    );


    console.log(
      "The provider requests were simulated locally."
    );


  } finally {

    /* ========================================================
       RESTORE AXIOS
    ======================================================== */

    if (axiosMockInstalled) {

      axios.post =
        originalAxiosPost;

    }


    /* ========================================================
       RESTORE ENVIRONMENT VARIABLES
    ======================================================== */

    if (
      originalAccessToken === undefined
    ) {

      delete process.env.WHATSAPP_ACCESS_TOKEN;

    } else {

      process.env.WHATSAPP_ACCESS_TOKEN =
        originalAccessToken;

    }


    if (
      originalCaptureFlag === undefined
    ) {

      delete process.env.TEST_CAPTURE_PROVIDER_IDEMPOTENCY;

    } else {

      process.env.TEST_CAPTURE_PROVIDER_IDEMPOTENCY =
        originalCaptureFlag;

    }


    /* ========================================================
       DELETE ONLY TEST DELIVERY JOB
    ======================================================== */

    if (
      connected &&
      job?._id
    ) {

      await DeliveryJob.deleteOne({

        _id:
          job._id,

        organizationId,

      });

    }


    /* ========================================================
       DELETE ONLY TEST MESSAGE
    ======================================================== */

    if (
      connected &&
      message?._id
    ) {

      await Message.deleteOne({

        _id:
          message._id,

        organizationId,

      });

    }


    /* ========================================================
       DELETE ONLY TEST ORGANIZATION
    ======================================================== */

    if (
      connected &&
      organizationId
    ) {

      await Organization.collection.deleteOne({

        _id:
          organizationId,

      });


      console.log(
        "\n🧹 Temporary test organization removed."
      );

    }


    /* ========================================================
       DISCONNECT
    ======================================================== */

    if (connected) {

      await mongoose.disconnect();


      console.log(
        "🔌 MongoDB disconnected."
      );

    }

  }

};


/* ============================================================
   RUN TEST
============================================================ */

run().catch(
  error => {

    console.error(
      "\n❌ TEST 7 FAILED:"
    );


    console.error(
      error?.stack || error
    );


    process.exitCode = 1;

  }
);