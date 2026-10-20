/**
 * ==========================================================
 *
 * TEST 3 — WORKER CRASH RECOVERY
 *
 * Purpose
 * ----------------------------------------------------------
 * Prove that when Worker A claims a DeliveryJob and then
 * disappears before completing it, the expired lease can be
 * recovered and Worker B can claim the same job.
 *
 * Expected lifecycle:
 *
 * PENDING
 *    ↓
 * Worker A claims
 *    ↓
 * PROCESSING / attempts = 1
 *    ↓
 * Worker A crashes
 *    ↓
 * Lease expires
 *    ↓
 * Stale recovery
 *    ↓
 * FAILED
 *    ↓
 * Worker B claims
 *    ↓
 * PROCESSING / attempts = 2
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
  recoverStaleDeliveryJobs,
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
      "TEST 3 — WORKER CRASH RECOVERY"
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
          "TEST: Worker crash recovery.",

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
      `worker-crash-test:${testMessage._id}`;


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
            "worker-crash-recovery",

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
    // STEP 3 — WORKER A CLAIMS THE JOB
    // ======================================================

    console.log(
      "\n----------------------------------------------------------"
    );

    console.log(
      "STEP 3 — Worker A claims DeliveryJob"
    );

    console.log(
      "----------------------------------------------------------"
    );


    const workerALease =
      1000;


    const workerA =
      await claimDeliveryJob(

        testJob._id,

        {

          workerName:
            "worker-A-crash-test",

          leaseDurationMs:
            workerALease,

          organizationId:
            ORGANIZATION_ID,

        }

      );


    if (
      !workerA
    ) {

      throw new Error(
        "Worker A could not claim the DeliveryJob."
      );
    }


    console.log(
      "\n✅ Worker A claimed DeliveryJob"
    );

    console.log(
      "Job ID:",
      workerA._id.toString()
    );

    console.log(
      "Status:",
      workerA.status
    );

    console.log(
      "Attempts:",
      workerA.attempts
    );

    console.log(
      "Worker:",
      workerA.workerName
    );

    console.log(
      "Worker A lock:",
      workerA.lockToken
    );

    console.log(
      "Lock expires:",
      workerA.lockExpiresAt
    );


    // ------------------------------------------------------
    // ASSERT WORKER A CLAIM
    // ------------------------------------------------------

    if (
      workerA.status !==
      "processing"
    ) {

      throw new Error(
        `Expected PROCESSING, found ${workerA.status}.`
      );
    }


    if (
      workerA.attempts !== 1
    ) {

      throw new Error(
        `Expected attempts=1, found ${workerA.attempts}.`
      );
    }


    if (
      workerA.workerName !==
      "worker-A-crash-test"
    ) {

      throw new Error(
        "Worker A name was not persisted correctly."
      );
    }


    if (
      !workerA.lockToken
    ) {

      throw new Error(
        "Worker A did not receive a lock token."
      );
    }


    console.log(
      "\n✅ Worker A claim confirmed"
    );


    // ======================================================
    // STEP 4 — SIMULATE WORKER A CRASH
    // ======================================================

    console.log(
      "\n----------------------------------------------------------"
    );

    console.log(
      "STEP 4 — Simulating Worker A crash"
    );

    console.log(
      "----------------------------------------------------------"
    );


    console.log(
      "Worker A will NOT call:"
    );

    console.log(
      "  markDeliveryJobSent()"
    );

    console.log(
      "  markDeliveryJobFailed()"
    );

    console.log(
      "  releaseDeliveryJob()"
    );

    console.log(
      "  heartbeatDeliveryJob()"
    );


    console.log(
      "\n💥 Worker A has effectively crashed."
    );


    // ------------------------------------------------------
    // WAIT UNTIL LEASE EXPIRES
    // ------------------------------------------------------

    await new Promise(
      (resolve) =>
        setTimeout(
          resolve,
          1500
        )
    );


    const afterCrash =
      await DeliveryJob.findById(
        testJob._id
      );


    console.log(
      "\nJob after simulated crash:"
    );

    console.log(
      "Status:",
      afterCrash.status
    );

    console.log(
      "Attempts:",
      afterCrash.attempts
    );

    console.log(
      "Worker:",
      afterCrash.workerName
    );

    console.log(
      "Lock token:",
      afterCrash.lockToken
    );

    console.log(
      "Lock expires:",
      afterCrash.lockExpiresAt
    );

    console.log(
      "Current time:",
      new Date()
    );


    if (
      afterCrash.status !==
      "processing"
    ) {

      throw new Error(
        `Expected PROCESSING after simulated crash, found ${afterCrash.status}.`
      );
    }


    if (
      !afterCrash.lockExpiresAt ||
      afterCrash.lockExpiresAt >
        new Date()
    ) {

      throw new Error(
        "Worker A lease has not expired."
      );
    }


    console.log(
      "\n✅ Worker A lease expired while job remained PROCESSING"
    );


    // ======================================================
    // STEP 5 — RECOVER WORKER A'S STALE JOB
    // ======================================================

    console.log(
      "\n----------------------------------------------------------"
    );

    console.log(
      "STEP 5 — Recovering Worker A's stale job"
    );

    console.log(
      "----------------------------------------------------------"
    );


    const recoveryResult =
      await recoverStaleDeliveryJobs({

        workerName:
          "worker-B-recovery-manager",

        limit:
          100,

      });


    console.log(
      "\nRECOVERY RESULT:"
    );

    console.dir(
      recoveryResult,
      {
        depth: 4,
      }
    );


    // ------------------------------------------------------
    // LOAD RECOVERED JOB
    // ------------------------------------------------------

    const recoveredJob =
      await DeliveryJob.findById(
        testJob._id
      );


    console.log(
      "\nRecovered job:"
    );

    console.log(
      "Status:",
      recoveredJob.status
    );

    console.log(
      "Attempts:",
      recoveredJob.attempts
    );

    console.log(
      "Next attempt:",
      recoveredJob.nextAttemptAt
    );

    console.log(
      "Last error:",
      recoveredJob.lastError
    );

    console.log(
      "Lock token:",
      recoveredJob.lockToken
    );

    console.log(
      "Lock expires:",
      recoveredJob.lockExpiresAt
    );


    if (
      recoveredJob.status !==
      "failed"
    ) {

      throw new Error(
        `Expected FAILED after recovery, found ${recoveredJob.status}.`
      );
    }


    if (
      recoveredJob.attempts !== 1
    ) {

      throw new Error(
        `Expected attempts=1 after recovery, found ${recoveredJob.attempts}.`
      );
    }


    if (
      !recoveredJob.nextAttemptAt
    ) {

      throw new Error(
        "Expected nextAttemptAt after recovery."
      );
    }


    console.log(
      "\n✅ Worker A job successfully recovered"
    );


    // ======================================================
    // STEP 6 — WORKER B CLAIMS THE RECOVERED JOB
    // ======================================================

    console.log(
      "\n----------------------------------------------------------"
    );

    console.log(
      "STEP 6 — Worker B claims recovered DeliveryJob"
    );

    console.log(
      "----------------------------------------------------------"
    );


    // The normal recovery policy schedules the retry a few
    // seconds into the future. For this controlled test,
    // manually make the recovered job immediately eligible.
    //
    // This does NOT bypass the claim logic. Worker B still
    // must successfully atomically claim the job.

    await DeliveryJob.updateOne(

      {
        _id:
          testJob._id,

        organizationId:
          ORGANIZATION_ID,

        status:
          "failed",

      },

      {

        $set: {

          nextAttemptAt:
            new Date(),

        },

      }

    );


    const workerB =
      await claimDeliveryJob(

        testJob._id,

        {

          workerName:
            "worker-B-recovery-test",

          leaseDurationMs:
            5000,

          organizationId:
            ORGANIZATION_ID,

        }

      );


    if (
      !workerB
    ) {

      throw new Error(
        "Worker B could not claim the recovered DeliveryJob."
      );
    }


    console.log(
      "\n✅ Worker B claimed recovered DeliveryJob"
    );

    console.log(
      "Job ID:",
      workerB._id.toString()
    );

    console.log(
      "Status:",
      workerB.status
    );

    console.log(
      "Attempts:",
      workerB.attempts
    );

    console.log(
      "Worker:",
      workerB.workerName
    );

    console.log(
      "New lock token:",
      workerB.lockToken
    );

    console.log(
      "New lock expires:",
      workerB.lockExpiresAt
    );


    // ======================================================
    // STEP 7 — FINAL ASSERTIONS
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


    const sameJob =
      workerB._id.toString() ===
      testJob._id.toString();


    const processing =
      workerB.status ===
      "processing";


    const secondAttempt =
      workerB.attempts ===
      2;


    const workerChanged =
      workerB.workerName ===
      "worker-B-recovery-test";


    const newLock =
      workerB.lockToken &&
      workerB.lockToken !==
        workerA.lockToken;


    console.log(
      sameJob
        ? "✅ Worker B claimed the SAME DeliveryJob"
        : "❌ Worker B claimed a different DeliveryJob"
    );


    console.log(
      processing
        ? "✅ Job returned to PROCESSING"
        : "❌ Job did not return to PROCESSING"
    );


    console.log(
      secondAttempt
        ? "✅ Attempt counter advanced from 1 → 2"
        : `❌ Expected attempts=2, found ${workerB.attempts}`
    );


    console.log(
      workerChanged
        ? "✅ Worker ownership changed A → B"
        : "❌ Worker ownership did not change"
    );


    console.log(
      newLock
        ? "✅ Worker B received a NEW lock token"
        : "❌ Worker B did not receive a new lock token"
    );


    if (
      sameJob &&
      processing &&
      secondAttempt &&
      workerChanged &&
      newLock
    ) {

      console.log(
        "\n🎉 TEST 3 PASSED"
      );

      console.log(
        "A crashed worker cannot permanently strand a DeliveryJob."
      );

      console.log(
        "A second worker can recover and claim the job."
      );

    } else {

      throw new Error(
        "One or more Worker B recovery assertions failed."
      );
    }


  } catch (
    error
  ) {

    console.error(
      "\n❌ TEST 3 FAILED"
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
          "\n🧹 Temporary Worker A/B crash test data cleaned up."
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