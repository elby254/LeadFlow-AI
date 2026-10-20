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
  "Simulated DeliveryJob creation failure test.";


/* ============================================================
   TEST
============================================================ */

const run = async () => {

  console.log(
    "\n============================================================"
  );

  console.log(
    "TEST 8B — DELIVERYJOB CREATION FAILURE"
  );

  console.log(
    "============================================================\n"
  );

  await mongoose.connect(mongoUri);

  console.log("✅ MongoDB connected");

  let message = null;

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

      status:
        message.status,

    });


    /* ========================================================
       STEP 2 — SIMULATE DELIVERYJOB CREATION FAILURE
    ======================================================== */

    console.log(
      "\n💥 SIMULATING DELIVERYJOB CREATION FAILURE"
    );

    let simulatedFailure = false;

    try {

      // Deliberately invalid organizationId.
      // This causes schema validation to fail before
      // a DeliveryJob can be persisted.

      await createDeliveryJob({

        organizationId:
          "invalid-organization-id",

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

    } catch (error) {

      simulatedFailure = true;

      console.log(
        "✅ Expected DeliveryJob creation failure caught."
      );

      console.log({
        errorName:
          error.name,

        errorMessage:
          error.message,

      });

    }

    if (!simulatedFailure) {

      throw new Error(
        "FAIL: DeliveryJob creation unexpectedly succeeded."
      );

    }


    /* ========================================================
       STEP 3 — INSPECT PERSISTED MESSAGE
    ======================================================== */

    const persistedMessage =
      await Message.findOne({

        _id:
          message._id,

        organizationId:
          ORGANIZATION_ID,

      }).lean();

    console.log(
      "\n🔍 MESSAGE AFTER FAILED JOB CREATION:"
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


    /* ========================================================
       STEP 4 — COUNT MATCHING DELIVERY JOBS
    ======================================================== */

    const matchingJobs =
      await DeliveryJob.countDocuments({

        organizationId:
          ORGANIZATION_ID,

        messageId:
          message._id,

      });

    console.log(
      "\n📦 MATCHING DELIVERY JOB COUNT:"
    );

    console.log(matchingJobs);


    /* ========================================================
       STEP 5 — ASSERT THE FAILURE STATE
    ======================================================== */

    if (!persistedMessage) {

      throw new Error(
        "FAIL: Test Message unexpectedly disappeared."
      );

    }

    if (matchingJobs !== 0) {

      throw new Error(
        `FAIL: Expected zero matching DeliveryJobs, found ${matchingJobs}.`
      );

    }

    if (persistedMessage.status !== "sending") {

      throw new Error(
        `Unexpected Message status: ${persistedMessage.status}`
      );

    }


    console.log(
      "\n============================================================"
    );

    console.log(
      "TEST 8B RESULT: FAILURE MODE REPRODUCED"
    );

    console.log(
      "============================================================"
    );

    console.log(
      "\nConfirmed:"
    );

    console.log(
      "1. AI Message was persisted."
    );

    console.log(
      "2. DeliveryJob creation failed."
    );

    console.log(
      "3. The Message remains in sending status."
    );

    console.log(
      "4. No matching DeliveryJob exists."
    );

    console.log(
      "\n⚠️ This reproduces an orphaned outbound Message."
    );

  } finally {

    /* ========================================================
       CLEANUP
    ======================================================== */

    if (message?._id) {

      await DeliveryJob.deleteMany({

        organizationId:
          ORGANIZATION_ID,

        messageId:
          message._id,

      });

      await Message.deleteOne({

        _id:
          message._id,

        organizationId:
          ORGANIZATION_ID,

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
    "\n❌ TEST 8B FAILED:"
  );

  console.error(error);

  process.exit(1);

});