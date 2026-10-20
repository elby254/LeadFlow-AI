/**
 * ==========================================================
 *
 * TEST 2 — STALE DELIVERYJOB LEASE RECOVERY
 *
 * Purpose
 * ----------------------------------------------------------
 * Prove that a DeliveryJob whose worker lease expires is
 * recovered from PROCESSING back to FAILED and scheduled
 * for another attempt.
 *
 * Expected:
 *
 * PENDING
 *   ↓
 * PROCESSING
 *   ↓
 * lease expires
 *   ↓
 * recoverStaleDeliveryJobs()
 *   ↓
 * FAILED
 *   ↓
 * nextAttemptAt scheduled
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
      "TEST 2 — STALE DELIVERYJOB LEASE RECOVERY"
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
          "TEST: This message is for stale lease recovery.",

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


    // ------------------------------------------------------
    // 3. CREATE DELIVERY JOB
    // ------------------------------------------------------

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
      `stale-lease-test:${testMessage._id}`;


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
            "stale-lease-recovery",

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
      "Initial status:",
      testJob.status
    );

    console.log(
      "Initial attempts:",
      testJob.attempts
    );


    // ------------------------------------------------------
    // 4. CLAIM THE JOB WITH A VERY SHORT LEASE
    // ------------------------------------------------------

    console.log(
      "\n----------------------------------------------------------"
    );

    console.log(
      "STEP 3 — Claiming DeliveryJob"
    );

    console.log(
      "----------------------------------------------------------"
    );


    const leaseDurationMs =
      1000;


    const claimedJob =
      await claimDeliveryJob(

        testJob._id,

        {

          workerName:
            "stale-lease-test-worker",

          leaseDurationMs,

          organizationId:
            ORGANIZATION_ID,

        }

      );


    if (
      !claimedJob
    ) {

      throw new Error(
        "DeliveryJob could not be claimed."
      );
    }


    console.log(
      "\n✅ DeliveryJob claimed"
    );

    console.log(
      "Status:",
      claimedJob.status
    );

    console.log(
      "Attempts:",
      claimedJob.attempts
    );

    console.log(
      "Worker:",
      claimedJob.workerName
    );

    console.log(
      "Lock token:",
      claimedJob.lockToken
    );

    console.log(
      "Locked at:",
      claimedJob.lockedAt
    );

    console.log(
      "Lock expires at:",
      claimedJob.lockExpiresAt
    );


    // ------------------------------------------------------
    // 5. VERIFY PROCESSING STATE
    // ------------------------------------------------------

    if (
      claimedJob.status !==
      "processing"
    ) {

      throw new Error(
        `Expected PROCESSING status, found ${claimedJob.status}.`
      );
    }


    if (
      claimedJob.attempts !== 1
    ) {

      throw new Error(
        `Expected attempts=1 after first claim, found ${claimedJob.attempts}.`
      );
    }


    if (
      !claimedJob.lockToken
    ) {

      throw new Error(
        "Expected lockToken to be present."
      );
    }


    console.log(
      "\n✅ PROCESSING state confirmed"
    );


    // ------------------------------------------------------
    // 6. WAIT FOR LEASE TO EXPIRE
    // ------------------------------------------------------

    console.log(
      "\n----------------------------------------------------------"
    );

    console.log(
      "STEP 4 — Waiting for lease to expire"
    );

    console.log(
      "----------------------------------------------------------"
    );


    console.log(
      `Lease duration: ${leaseDurationMs}ms`
    );


    await new Promise(
      (resolve) =>
        setTimeout(
          resolve,
          1500
        )
    );


    const beforeRecovery =
      await DeliveryJob.findById(
        testJob._id
      );


    console.log(
      "\nCurrent job after lease expiration:"
    );

    console.log(
      "Status:",
      beforeRecovery.status
    );

    console.log(
      "Attempts:",
      beforeRecovery.attempts
    );

    console.log(
      "Lock expires at:",
      beforeRecovery.lockExpiresAt
    );

    console.log(
      "Current time:",
      new Date()
    );


    // ------------------------------------------------------
    // 7. VERIFY LEASE IS ACTUALLY EXPIRED
    // ------------------------------------------------------

    if (
      beforeRecovery.status !==
      "processing"
    ) {

      throw new Error(
        `Expected job to remain PROCESSING before recovery, found ${beforeRecovery.status}.`
      );
    }


    if (
      !beforeRecovery.lockExpiresAt ||
      beforeRecovery.lockExpiresAt >
        new Date()
    ) {

      throw new Error(
        "DeliveryJob lease has not actually expired."
      );
    }


    console.log(
      "\n✅ Stale PROCESSING lease confirmed"
    );


    // ------------------------------------------------------
    // 8. RECOVER STALE JOB
    // ------------------------------------------------------

    console.log(
      "\n----------------------------------------------------------"
    );

    console.log(
      "STEP 5 — Recovering stale DeliveryJob"
    );

    console.log(
      "----------------------------------------------------------"
    );


    const recoveryResult =
      await recoverStaleDeliveryJobs({

        workerName:
          "stale-recovery-test-worker",

        limit:
          100,

      });


    console.log(
      "\nRECOVERY RESULT:"
    );

    console.dir(
      recoveryResult,
      {
        depth: 5,
      }
    );


    // ------------------------------------------------------
    // 9. LOAD RECOVERED JOB
    // ------------------------------------------------------

    const recoveredJob =
      await DeliveryJob.findById(
        testJob._id
      );


    console.log(
      "\nRecovered DeliveryJob:"
    );

    console.log(
      "Job ID:",
      recoveredJob._id.toString()
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
      "Failed at:",
      recoveredJob.failedAt
    );

    console.log(
      "Lock token:",
      recoveredJob.lockToken
    );

    console.log(
      "Lock expires at:",
      recoveredJob.lockExpiresAt
    );

    console.log(
      "Worker:",
      recoveredJob.workerName
    );


    // ------------------------------------------------------
    // 10. ASSERT RECOVERY
    // ------------------------------------------------------

    if (
      recoveredJob.status !==
      "failed"
    ) {

      throw new Error(
        `Expected FAILED after stale recovery, found ${recoveredJob.status}.`
      );
    }


    if (
      recoveredJob.attempts !== 1
    ) {

      throw new Error(
        `Expected attempts to remain 1 after recovery, found ${recoveredJob.attempts}.`
      );
    }


    if (
      !recoveredJob.nextAttemptAt
    ) {

      throw new Error(
        "Expected nextAttemptAt to be scheduled."
      );
    }


    if (
      recoveredJob.nextAttemptAt <=
      new Date()
    ) {

      throw new Error(
        "Expected nextAttemptAt to be in the future."
      );
    }


    if (
      recoveredJob.lockToken !==
      null
    ) {

      throw new Error(
        "Expected lockToken to be cleared after recovery."
      );
    }


    if (
      recoveredJob.lockExpiresAt !==
      null
    ) {

      throw new Error(
        "Expected lockExpiresAt to be cleared after recovery."
      );
    }


    console.log(
      "\n✅ STALE LEASE RECOVERY PASSED"
    );


    // ------------------------------------------------------
    // 11. FINAL RESULT
    // ------------------------------------------------------

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
      "✅ Job entered PROCESSING"
    );

    console.log(
      "✅ Worker lease was created"
    );

    console.log(
      "✅ Lease expired"
    );

    console.log(
      "✅ Stale job was detected"
    );

    console.log(
      "✅ Job returned to FAILED"
    );

    console.log(
      "✅ Retry was scheduled"
    );

    console.log(
      "✅ Lock token was cleared"
    );

    console.log(
      "✅ Lock expiration was cleared"
    );


    console.log(
      "\n🎉 TEST 2 PASSED"
    );

    console.log(
      "Stale DeliveryJob leases are recoverable."
    );


  } catch (
    error
  ) {

    console.error(
      "\n❌ TEST 2 FAILED"
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
          "\n🧹 Temporary stale-lease test data cleaned up."
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