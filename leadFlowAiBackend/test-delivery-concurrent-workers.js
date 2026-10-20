/**
 * ==========================================================
 *
 * TEST 4 — CONCURRENT WORKERS
 *
 * Purpose
 * ----------------------------------------------------------
 * Prove that two workers attempting to claim the exact same
 * DeliveryJob concurrently cannot both acquire the job.
 *
 * Expected:
 *
 * Worker A ─────┐
 *               ├── atomic MongoDB claim
 * Worker B ─────┘
 *
 * Exactly ONE:
 *
 *     status = processing
 *     attempts = 1
 *     lockToken = one worker
 *
 * The other worker must receive:
 *
 *     null
 *
 * ==========================================================
 */

import mongoose from "mongoose";
import dotenv from "dotenv";

import Message from "./models/message.js";
import DeliveryJob from "./models/deliveryJob.js";

import {
  createDeliveryJob,
  claimDeliveryJob,
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
  let testJob = null;

  try {

    console.log("\n");
    console.log(
      "=========================================================="
    );

    console.log(
      "TEST 4 — CONCURRENT WORKERS"
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


    // ======================================================
    // STEP 1 — CREATE FRESH AI MESSAGE
    // ======================================================

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
          "TEST: Concurrent DeliveryJob worker claim.",

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


    // ======================================================
    // STEP 2 — CREATE DELIVERY JOB
    // ======================================================

    console.log(
      "\n----------------------------------------------------------"
    );

    console.log(
      "STEP 2 — Creating DeliveryJob"
    );

    console.log(
      "----------------------------------------------------------"
    );


    const idempotencyKey =
      `concurrent-worker-test:${testMessage._id}`;


    const createResult =
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

        idempotencyKey,

        metadata: {

          test:
            "concurrent-workers",

        },

      });


    if (
      !createResult?.created ||
      !createResult?.job
    ) {

      throw new Error(
        "Failed to create the test DeliveryJob."
      );
    }


    testJob =
      createResult.job;


    console.log(
      "\n✅ DeliveryJob created"
    );

    console.log(
      "Job ID:",
      testJob._id.toString()
    );

    console.log(
      "Status:",
      testJob.status
    );

    console.log(
      "Attempts:",
      testJob.attempts
    );


    // ======================================================
    // STEP 3 — VERIFY INITIAL STATE
    // ======================================================

    if (
      testJob.status !==
      "pending"
    ) {

      throw new Error(
        `Expected PENDING, found ${testJob.status}.`
      );
    }


    if (
      testJob.attempts !==
      0
    ) {

      throw new Error(
        `Expected attempts=0, found ${testJob.attempts}.`
      );
    }


    console.log(
      "\n✅ Initial PENDING state confirmed"
    );


    // ======================================================
    // STEP 4 — START TWO WORKERS CONCURRENTLY
    // ======================================================

    console.log(
      "\n----------------------------------------------------------"
    );

    console.log(
      "STEP 3 — Starting concurrent Worker A + Worker B claims"
    );

    console.log(
      "----------------------------------------------------------"
    );


    console.log(
      "\nBoth workers will attempt to claim:"
    );

    console.log(
      testJob._id.toString()
    );


    /*
     * IMPORTANT:
     *
     * Promise.all starts both operations without waiting for
     * Worker A to finish before Worker B begins.
     *
     * The actual protection comes from MongoDB's atomic
     * findOneAndUpdate() inside claimDeliveryJob().
     */

    const [
      workerA,
      workerB,
    ] = await Promise.all([

      claimDeliveryJob(

        testJob._id,

        {

          workerName:
            "concurrent-worker-A",

          leaseDurationMs:
            60000,

          organizationId:
            ORGANIZATION_ID,

        }

      ),

      claimDeliveryJob(

        testJob._id,

        {

          workerName:
            "concurrent-worker-B",

          leaseDurationMs:
            60000,

          organizationId:
            ORGANIZATION_ID,

        }

      ),

    ]);


    // ======================================================
    // STEP 5 — DISPLAY RESULTS
    // ======================================================

    console.log(
      "\n=========================================================="
    );

    console.log(
      "CONCURRENT CLAIM RESULTS"
    );

    console.log(
      "=========================================================="
    );


    console.log(
      "\nWorker A:"
    );

    if (
      workerA
    ) {

      console.log(
        "  Job ID:",
        workerA._id.toString()
      );

      console.log(
        "  Status:",
        workerA.status
      );

      console.log(
        "  Attempts:",
        workerA.attempts
      );

      console.log(
        "  Worker:",
        workerA.workerName
      );

      console.log(
        "  Lock:",
        workerA.lockToken
      );

    } else {

      console.log(
        "  RESULT: null"
      );

    }


    console.log(
      "\nWorker B:"
    );

    if (
      workerB
    ) {

      console.log(
        "  Job ID:",
        workerB._id.toString()
      );

      console.log(
        "  Status:",
        workerB.status
      );

      console.log(
        "  Attempts:",
        workerB.attempts
      );

      console.log(
        "  Worker:",
        workerB.workerName
      );

      console.log(
        "  Lock:",
        workerB.lockToken
      );

    } else {

      console.log(
        "  RESULT: null"
      );

    }


    // ======================================================
    // STEP 6 — DETERMINE WINNER
    // ======================================================

    const successfulClaims = [

      workerA,

      workerB,

    ].filter(
      Boolean
    );


    console.log(
      "\nSuccessful claims:",
      successfulClaims.length
    );


    if (
      successfulClaims.length !==
      1
    ) {

      throw new Error(
        `CRITICAL: Expected exactly ONE successful claim, got ${successfulClaims.length}.`
      );
    }


    const winningWorker =
      successfulClaims[0];


    console.log(
      "\n🏆 Winning worker:",
      winningWorker.workerName
    );


    // ======================================================
    // STEP 7 — VERIFY WINNER
    // ======================================================

    if (
      winningWorker.status !==
      "processing"
    ) {

      throw new Error(
        `Winning worker status should be PROCESSING, found ${winningWorker.status}.`
      );
    }


    if (
      winningWorker.attempts !==
      1
    ) {

      throw new Error(
        `CRITICAL: Expected attempts=1, found ${winningWorker.attempts}.`
      );
    }


    if (
      !winningWorker.lockToken
    ) {

      throw new Error(
        "Winning worker did not receive a lock token."
      );
    }


    console.log(
      "\n✅ Winning worker entered PROCESSING"
    );

    console.log(
      "✅ Winning worker attempt count = 1"
    );

    console.log(
      "✅ Winning worker received lock token"
    );


    // ======================================================
    // STEP 8 — VERIFY LOSER
    // ======================================================

    const losingWorker =
      workerA
        ? workerB
        : workerA;


    if (
      losingWorker !== null
    ) {

      console.log(
        "\nLosing worker result:"
      );

      console.log(
        losingWorker
      );

    }


    if (
      losingWorker !==
      null
    ) {

      throw new Error(
        "CRITICAL: Both workers successfully claimed the same DeliveryJob."
      );
    }


    console.log(
      "\n✅ Losing worker received null"
    );


    // ======================================================
    // STEP 9 — LOAD FINAL DATABASE STATE
    // ======================================================

    console.log(
      "\n----------------------------------------------------------"
    );

    console.log(
      "STEP 4 — Inspecting final MongoDB state"
    );

    console.log(
      "----------------------------------------------------------"
    );


    const persistedJob =
      await DeliveryJob.findById(
        testJob._id
      );


    if (
      !persistedJob
    ) {

      throw new Error(
        "DeliveryJob disappeared from MongoDB."
      );
    }


    console.log(
      "\nPersisted DeliveryJob:"
    );

    console.log(
      "Job ID:",
      persistedJob._id.toString()
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
      "Worker:",
      persistedJob.workerName
    );

    console.log(
      "Lock token:",
      persistedJob.lockToken
    );

    console.log(
      "Lock expires:",
      persistedJob.lockExpiresAt
    );


    // ======================================================
    // STEP 10 — FINAL ASSERTIONS
    // ======================================================

    console.log(
      "\n=========================================================="
    );

    console.log(
      "FINAL ASSERTIONS"
    );

    console.log(
      "=========================================================="
    );


    const finalStatusCorrect =
      persistedJob.status ===
      "processing";


    const finalAttemptsCorrect =
      persistedJob.attempts ===
      1;


    const finalWorkerCorrect =
      persistedJob.workerName ===
      winningWorker.workerName;


    const finalLockCorrect =
      Boolean(
        persistedJob.lockToken
      );


    const onlyOneWinner =
      successfulClaims.length ===
      1;


    console.log(
      onlyOneWinner
        ? "✅ Exactly ONE worker won the atomic claim"
        : "❌ More than one worker won"
    );


    console.log(
      finalStatusCorrect
        ? "✅ Final status = PROCESSING"
        : `❌ Final status = ${persistedJob.status}`
    );


    console.log(
      finalAttemptsCorrect
        ? "✅ Final attempts = 1"
        : `❌ Final attempts = ${persistedJob.attempts}`
    );


    console.log(
      finalWorkerCorrect
        ? "✅ MongoDB records the winning worker"
        : "❌ Winning worker mismatch"
    );


    console.log(
      finalLockCorrect
        ? "✅ MongoDB contains the winning lock token"
        : "❌ Lock token missing"
    );


    if (
      onlyOneWinner &&
      finalStatusCorrect &&
      finalAttemptsCorrect &&
      finalWorkerCorrect &&
      finalLockCorrect
    ) {

      console.log(
        "\n🎉 TEST 4 PASSED"
      );

      console.log(
        "Concurrent workers cannot claim the same DeliveryJob."
      );

      console.log(
        "MongoDB atomic claiming successfully prevents"
      );

      console.log(
        "double-processing at the worker claim boundary."
      );

    } else {

      throw new Error(
        "One or more concurrent worker assertions failed."
      );
    }


  } catch (
    error
  ) {

    console.error(
      "\n❌ TEST 4 FAILED"
    );

    console.error(
      error
    );

    process.exitCode = 1;

  } finally {

    // ------------------------------------------------------
    // CLEANUP
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
          "\n🧹 Temporary concurrent-worker test data cleaned up."
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