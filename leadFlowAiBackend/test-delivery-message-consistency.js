import "dotenv/config";

import mongoose from "mongoose";

import Message from "./models/message.js";
import DeliveryJob from "./models/deliveryJob.js";

import {
  createDeliveryJob,
} from "./services/deliveryJobService.js";


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

const ORGANIZATION_ID =
  "6abfaed5e4f898dc5078510a";

const TEST_PHONE =
  "+254700555555";

const TEST_MESSAGE =
  "Outbound message consistency reliability test.";


/* ============================================================
   TEST
============================================================ */

const run = async () => {

  console.log(
    "\n============================================================"
  );

  console.log(
    "TEST 8 — OUTBOUND MESSAGE AND DELIVERYJOB CONSISTENCY"
  );

  console.log(
    "============================================================\n"
  );

  await mongoose.connect(mongoUri);

  console.log("✅ MongoDB connected");

  let message = null;
  let job = null;

  try {

    /* ========================================================
       STEP 1 — CREATE AI MESSAGE
    ======================================================== */

    message = await Message.create({

      organizationId:
        ORGANIZATION_ID,

      conversationId:
        new mongoose.Types.ObjectId(),

      leadId:
        new mongoose.Types.ObjectId(),

      source:
        "website",

      externalMessageId:
        null,

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

      organizationId:
        String(message.organizationId),

      status:
        message.status,

      aiGenerated:
        message.aiGenerated,

    });


    /* ========================================================
       STEP 2 — VERIFY NO DELIVERYJOB EXISTS YET
    ======================================================== */

    const jobsBefore =
      await DeliveryJob.countDocuments({

        organizationId:
          ORGANIZATION_ID,

        messageId:
          message._id,

      });

    console.log(
      "\n📦 DELIVERY JOBS BEFORE CREATION:"
    );

    console.log(jobsBefore);

    if (jobsBefore !== 0) {
      throw new Error(
        "FAIL: Unexpected DeliveryJob exists before creation."
      );
    }


    /* ========================================================
       STEP 3 — CREATE DELIVERYJOB NORMALLY
    ======================================================== */

    const createResult =
      await createDeliveryJob({

        organizationId:
          ORGANIZATION_ID,

        messageId:
          message._id,

        conversationId:
          message.conversationId,

        leadId:
          message.leadId,

        source:
          "website",

        recipient:
          TEST_PHONE,

      });

    job =
      createResult.job;

    console.log(
      "\n📦 DELIVERY JOB CREATED:"
    );

    console.log({

      jobId:
        String(job._id),

      messageId:
        String(job.messageId),

      organizationId:
        String(job.organizationId),

      status:
        job.status,

      idempotencyKey:
        job.idempotencyKey,

      created:
        createResult.created,

      duplicate:
        createResult.duplicate,

    });


    /* ========================================================
       STEP 4 — VERIFY MESSAGE ↔ DELIVERYJOB RELATIONSHIP
    ======================================================== */

    const persistedMessage =
      await Message.findOne({

        _id:
          message._id,

        organizationId:
          ORGANIZATION_ID,

      }).lean();

    const persistedJobs =
      await DeliveryJob.find({

        organizationId:
          ORGANIZATION_ID,

        messageId:
          message._id,

      }).lean();


    console.log(
      "\n🔍 PERSISTED MESSAGE:"
    );

    console.log({

      messageId:
        String(persistedMessage._id),

      status:
        persistedMessage.status,

      senderRole:
        persistedMessage.senderRole,

      aiGenerated:
        persistedMessage.aiGenerated,

    });


    console.log(
      "\n🔍 MATCHING DELIVERY JOBS:"
    );

    console.log(
      persistedJobs.map((item) => ({

        jobId:
          String(item._id),

        messageId:
          String(item.messageId),

        status:
          item.status,

        idempotencyKey:
          item.idempotencyKey,

      }))
    );


    /* ========================================================
       STEP 5 — ASSERT EXACTLY ONE JOB
    ======================================================== */

    if (persistedJobs.length !== 1) {
      throw new Error(
        `FAIL: Expected exactly one DeliveryJob, found ${persistedJobs.length}.`
      );
    }

    if (
      String(persistedJobs[0].messageId) !==
      String(persistedMessage._id)
    ) {
      throw new Error(
        "FAIL: DeliveryJob does not reference the expected Message."
      );
    }

    if (
      persistedJobs[0].idempotencyKey !==
      `ai-reply:${persistedMessage._id}`
    ) {
      throw new Error(
        "FAIL: DeliveryJob idempotency key does not match Message."
      );
    }


    /* ========================================================
       STEP 6 — FINAL RESULT
    ======================================================== */

    console.log(
      "\n============================================================"
    );

    console.log(
      "TEST 8A RESULT: PASS"
    );

    console.log(
      "============================================================"
    );

    console.log(
      "\nProven:"
    );

    console.log(
      "1. An AI Message can be persisted."
    );

    console.log(
      "2. A DeliveryJob can reference that Message."
    );

    console.log(
      "3. The job belongs to the same organization."
    );

    console.log(
      "4. The job uses the expected deterministic identity."
    );

    console.log(
      "5. Exactly one matching DeliveryJob exists."
    );

    console.log(
      "\n⚠️ This is the successful-write path."
    );

    console.log(
      "It does NOT yet prove atomicity when job creation fails."
    );

  } finally {

    /* ========================================================
       CLEANUP
    ======================================================== */

    if (job?._id) {

      await DeliveryJob.deleteOne({
        _id: job._id,
      });

    }

    if (message?._id) {

      await Message.deleteOne({
        _id: message._id,
      });

    }

    console.log(
      "\n🧹 Test data cleaned."
    );

    await mongoose.disconnect();

    console.log(
      "🔌 MongoDB disconnected."
    );

  }

};


run().catch((error) => {

  console.error(
    "\n❌ TEST 8A FAILED:"
  );

  console.error(error);

  process.exit(1);

});