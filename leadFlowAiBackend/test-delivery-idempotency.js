/**
 * ==========================================================
 *
 * TEST 1 — DUPLICATE AI DELIVERYJOB CREATION
 *
 * Purpose
 * ----------------------------------------------------------
 * Prove that one AI Message can have only one DeliveryJob
 * when the same idempotency key is submitted twice.
 *
 * Expected:
 *
 * FIRST  -> created: true
 * SECOND -> created: false, duplicate: true
 * MongoDB -> exactly 1 DeliveryJob
 *
 * ==========================================================
 */

import mongoose from "mongoose";
import dotenv from "dotenv";

import Message from "./models/message.js";
import DeliveryJob from "./models/deliveryJob.js";

import {
  createDeliveryJob,
  resolveDeliveryProvider,
} from "./services/deliveryJobService.js";

dotenv.config();


// ==========================================================
// TEST DATA
// ==========================================================

const ORGANIZATION_ID =
  "6abfaed5e4f898dc5078510a";

const CONVERSATION_ID =
  "6ac665daa54156e92f4b899f";

const LEAD_ID =
  "6ac665daa54156e92f4b89a1";

const RECIPIENT =
  "+254755344062";


// ==========================================================
// TEST
// ==========================================================

const runTest = async () => {

  let testMessage = null;

  try {

    console.log("\n");
    console.log(
      "=========================================================="
    );

    console.log(
      "TEST 1 — DUPLICATE AI DELIVERYJOB CREATION"
    );

    console.log(
      "=========================================================="
    );


    // ------------------------------------------------------
    // 1. CONNECT TO MONGODB
    // ------------------------------------------------------

    const mongoUri =
      process.env.MONGODB_URI ||
      process.env.MONGO_URI;

    if (!mongoUri) {

      throw new Error(
        "MongoDB connection string not found. Expected MONGODB_URI or MONGO_URI."
      );
    }


    await mongoose.connect(
      mongoUri
    );


    console.log(
      "\n✅ MongoDB connected"
    );


    // ------------------------------------------------------
    // 2. CREATE FRESH AI MESSAGE
    // ------------------------------------------------------

    console.log(
      "\n----------------------------------------------------------"
    );

    console.log(
      "STEP 1 — Creating fresh AI Message"
    );

    console.log(
      "----------------------------------------------------------"
    );


    testMessage =
      await Message.create({

        organizationId:
          ORGANIZATION_ID,

        conversationId:
          CONVERSATION_ID,

        leadId:
          LEAD_ID,

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
          "TEST: This is a duplicate DeliveryJob idempotency test.",

        status:
          "sending",

        aiGenerated:
          true,

        aiConfidence:
          0.90,

      });


    console.log(
      "\n✅ Fresh AI Message created"
    );

    console.log(
      "Message ID:",
      testMessage._id.toString()
    );

    console.log(
      "Organization:",
      testMessage.organizationId.toString()
    );

    console.log(
      "Conversation:",
      testMessage.conversationId.toString()
    );

    console.log(
      "Lead:",
      testMessage.leadId.toString()
    );

    console.log(
      "Source:",
      testMessage.source
    );

    console.log(
      "Status:",
      testMessage.status
    );

    console.log(
      "Sender Role:",
      testMessage.senderRole
    );


    // ------------------------------------------------------
    // 3. BUILD IDEMPOTENCY KEY
    // ------------------------------------------------------

    const idempotencyKey =
      `ai-message:${testMessage._id}`;


    console.log(
      "\nIdempotency Key:"
    );

    console.log(
      idempotencyKey
    );


    // ------------------------------------------------------
    // 4. VERIFY NO JOB EXISTS YET
    // ------------------------------------------------------

    const beforeCount =
      await DeliveryJob.countDocuments({

        organizationId:
          ORGANIZATION_ID,

        messageId:
          testMessage._id,

      });


    console.log(
      "\nDeliveryJobs BEFORE:",
      beforeCount
    );


    if (
      beforeCount !== 0
    ) {

      throw new Error(
        `Expected 0 DeliveryJobs before test, found ${beforeCount}.`
      );
    }


    console.log(
      "✅ No DeliveryJob exists yet"
    );


    // ======================================================
    // FIRST CREATE
    // ======================================================

    console.log(
      "\n=========================================================="
    );

    console.log(
      "FIRST createDeliveryJob() CALL"
    );

    console.log(
      "=========================================================="
    );


    const firstResult =
      await createDeliveryJob({

        organizationId:
          testMessage.organizationId,

        messageId:
          testMessage._id,

        conversationId:
          testMessage.conversationId,

        leadId:
          testMessage.leadId,

        source:
          testMessage.source,

        recipient:
          RECIPIENT,

        provider:
          resolveDeliveryProvider(
            testMessage.source
          ),

        idempotencyKey,

        metadata: {

          test:
            "duplicate-ai-deliveryjob",

          testRun:
            new Date().toISOString(),

          attempt:
            1,

        },

      });


    console.log(
      "\nFIRST RESULT:"
    );

    console.dir(
      firstResult,
      {
        depth: 5,
      }
    );


    // ------------------------------------------------------
    // FIRST ASSERTION
    // ------------------------------------------------------

    if (
      firstResult?.created !== true ||
      firstResult?.duplicate !== false
    ) {

      throw new Error(
        "FIRST createDeliveryJob() call did not create a new DeliveryJob."
      );
    }


    if (
      !firstResult?.job?._id
    ) {

      throw new Error(
        "FIRST createDeliveryJob() call did not return a DeliveryJob."
      );
    }


    const firstJobId =
      firstResult.job._id.toString();


    console.log(
      "\n✅ FIRST CALL PASSED"
    );

    console.log(
      "Created DeliveryJob:",
      firstJobId
    );


    // ======================================================
    // SECOND CREATE
    // ======================================================

    console.log(
      "\n=========================================================="
    );

    console.log(
      "SECOND createDeliveryJob() CALL"
    );

    console.log(
      "=========================================================="
    );


    const secondResult =
      await createDeliveryJob({

        organizationId:
          testMessage.organizationId,

        messageId:
          testMessage._id,

        conversationId:
          testMessage.conversationId,

        leadId:
          testMessage.leadId,

        source:
          testMessage.source,

        recipient:
          RECIPIENT,

        provider:
          resolveDeliveryProvider(
            testMessage.source
          ),

        idempotencyKey,

        metadata: {

          test:
            "duplicate-ai-deliveryjob",

          testRun:
            new Date().toISOString(),

          attempt:
            2,

        },

      });


    console.log(
      "\nSECOND RESULT:"
    );

    console.dir(
      secondResult,
      {
        depth: 5,
      }
    );


    // ------------------------------------------------------
    // SECOND ASSERTION
    // ------------------------------------------------------

    if (
      secondResult?.created !== false ||
      secondResult?.duplicate !== true
    ) {

      throw new Error(
        "SECOND createDeliveryJob() call did not detect the duplicate."
      );
    }


    if (
      !secondResult?.job?._id
    ) {

      throw new Error(
        "SECOND duplicate response did not return the existing DeliveryJob."
      );
    }


    const secondJobId =
      secondResult.job._id.toString();


    console.log(
      "\n✅ SECOND CALL PASSED"
    );

    console.log(
      "Existing DeliveryJob returned:",
      secondJobId
    );


    // ------------------------------------------------------
    // 5. SAME JOB ASSERTION
    // ------------------------------------------------------

    if (
      firstJobId !==
      secondJobId
    ) {

      throw new Error(
        "CRITICAL: First and second calls returned different DeliveryJobs."
      );
    }


    console.log(
      "\n✅ SAME JOB ID CONFIRMED"
    );

    console.log(
      "Job ID:",
      firstJobId
    );


    // ------------------------------------------------------
    // 6. COUNT JOBS AFTER BOTH CALLS
    // ------------------------------------------------------

    const afterCount =
      await DeliveryJob.countDocuments({

        organizationId:
          ORGANIZATION_ID,

        messageId:
          testMessage._id,

      });


    console.log(
      "\nDeliveryJobs AFTER:",
      afterCount
    );


    if (
      afterCount !== 1
    ) {

      throw new Error(
        `CRITICAL: Expected exactly 1 DeliveryJob, found ${afterCount}.`
      );
    }


    console.log(
      "✅ EXACTLY ONE DELIVERYJOB EXISTS"
    );


    // ------------------------------------------------------
    // 7. LOAD JOB FROM MONGODB
    // ------------------------------------------------------

    const persistedJob =
      await DeliveryJob.findOne({

        organizationId:
          ORGANIZATION_ID,

        messageId:
          testMessage._id,

      });


    console.log(
      "\n=========================================================="
    );

    console.log(
      "PERSISTED DELIVERYJOB"
    );

    console.log(
      "=========================================================="
    );


    console.log(
      "Job ID:",
      persistedJob._id.toString()
    );

    console.log(
      "Message ID:",
      persistedJob.messageId.toString()
    );

    console.log(
      "Organization:",
      persistedJob.organizationId.toString()
    );

    console.log(
      "Status:",
      persistedJob.status
    );

    console.log(
      "Attempts:",
      persistedJob.attempts
    );

    console.log(
      "Provider:",
      persistedJob.provider
    );

    console.log(
      "Recipient:",
      persistedJob.recipient
    );

    console.log(
      "Idempotency Key:",
      persistedJob.idempotencyKey
    );


    // ------------------------------------------------------
    // 8. FINAL ASSERTIONS
    // ------------------------------------------------------

    const messageIdMatches =
      persistedJob.messageId.toString() ===
      testMessage._id.toString();


    const organizationMatches =
      persistedJob.organizationId.toString() ===
      ORGANIZATION_ID;


    const idempotencyMatches =
      persistedJob.idempotencyKey ===
      idempotencyKey;


    console.log(
      "\n=========================================================="
    );

    console.log(
      "FINAL ASSERTIONS"
    );

    console.log(
      "=========================================================="
    );


    console.log(
      messageIdMatches
        ? "✅ DeliveryJob belongs to the AI Message"
        : "❌ DeliveryJob messageId mismatch"
    );


    console.log(
      organizationMatches
        ? "✅ DeliveryJob belongs to correct organization"
        : "❌ DeliveryJob organization mismatch"
    );


    console.log(
      idempotencyMatches
        ? "✅ Idempotency key matches"
        : "❌ Idempotency key mismatch"
    );


    if (
      messageIdMatches &&
      organizationMatches &&
      idempotencyMatches
    ) {

      console.log(
        "\n🎉 TEST 1 PASSED"
      );

      console.log(
        "Duplicate AI DeliveryJob creation is prevented."
      );

      console.log(
        "\nInvariant confirmed:"
      );

      console.log(
        "ONE AI Message → ONE DeliveryJob → ONE idempotencyKey"
      );

    } else {

      throw new Error(
        "One or more final assertions failed."
      );
    }


  } catch (
    error
  ) {

    console.error(
      "\n❌ TEST 1 FAILED"
    );

    console.error(
      error
    );

    process.exitCode = 1;

  } finally {

    // ------------------------------------------------------
    // CLEANUP
    // ------------------------------------------------------
    //
    // IMPORTANT:
    // We remove ONLY the temporary test data.
    //
    // Existing successful DeliveryJob
    // 6ac793da5f9bbe5de7bd18d0
    // is untouched.
    //
    // ------------------------------------------------------

    if (
      testMessage?._id
    ) {

      try {

        await DeliveryJob.deleteMany({

          messageId:
            testMessage._id,

        });


        await Message.deleteOne({

          _id:
            testMessage._id,

        });


        console.log(
          "\n🧹 Temporary test data cleaned up."
        );

      } catch (
        cleanupError
      ) {

        console.error(
          "\n⚠️ Cleanup failed:"
        );

        console.error(
          cleanupError
        );
      }
    }


    await mongoose.disconnect();

    console.log(
      "MongoDB disconnected."
    );
  }
};


// ==========================================================
// RUN
// ==========================================================

runTest();