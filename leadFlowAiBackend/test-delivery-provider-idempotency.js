import "dotenv/config";
import mongoose from "mongoose";

import Message from "./models/message.js";
import DeliveryJob from "./models/deliveryJob.js";

import {
  createDeliveryJob,
  claimDeliveryJob,
  recoverStaleDeliveryJobs,
} from "./services/deliveryJobService.js";


const mongoUri =
  process.env.MONGODB_URI ||
  process.env.MONGO_URI;


if (!mongoUri) {
  throw new Error(
    "MONGODB_URI or MONGO_URI is required."
  );
}


/* ============================================================
   TEST CONSTANTS
============================================================ */

const ORGANIZATION_ID =
  "6abfaed5e4f898dc5078510a";

const TEST_PHONE =
  "+254700555555";

const TEST_MESSAGE =
  "Provider idempotency test message.";

const WORKER_A =
  "provider-idempotency-worker-A";

const WORKER_B =
  "provider-idempotency-worker-B";


/* ============================================================
   MAIN TEST
============================================================ */

const run =
  async () => {

    console.log(
      "\n============================================================"
    );

    console.log(
      "TEST 5 — PROVIDER IDEMPOTENCY"
    );

    console.log(
      "============================================================\n"
    );


    await mongoose.connect(
      mongoUri
    );


    console.log(
      "✅ MongoDB connected"
    );


    let message = null;
    let job = null;


    try {

      /* ======================================================
         CREATE FRESH AI MESSAGE
      ====================================================== */

      message =
        await Message.create({

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

        status:
          message.status,

        aiGenerated:
          message.aiGenerated,

      });


      /* ======================================================
         CREATE DELIVERY JOB
      ====================================================== */

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

        status:
          job.status,

        attempts:
          job.attempts,

        idempotencyKey:
          job.idempotencyKey,

      });


      /* ======================================================
         ASSERT INITIAL IDENTITY
      ====================================================== */

      const expectedKey =
        `ai-reply:${message._id}`;


      if (
        job.idempotencyKey !==
        expectedKey
      ) {

        throw new Error(
          `FAIL: Expected idempotency key ${expectedKey} but received ${job.idempotencyKey}`
        );
      }


      console.log(
        "✅ Initial idempotency key is correct."
      );


      /* ======================================================
         WORKER A CLAIMS
      ====================================================== */

      const workerAJob =
        await claimDeliveryJob(
          job._id,
          {

            workerName:
              WORKER_A,

            leaseDurationMs:
              1000,

            organizationId:
              ORGANIZATION_ID,

          }
        );


      if (
        !workerAJob
      ) {

        throw new Error(
          "FAIL: Worker A could not claim DeliveryJob."
        );
      }


      console.log(
        "\n👷 WORKER A CLAIMED JOB:"
      );

      console.log({

        worker:
          workerAJob.workerName,

        attempts:
          workerAJob.attempts,

        status:
          workerAJob.status,

        lockToken:
          workerAJob.lockToken,

        idempotencyKey:
          workerAJob.idempotencyKey,

      });


      /* ======================================================
         CAPTURE PROVIDER IDENTITY
      ====================================================== */

      const workerAKey =
        workerAJob.idempotencyKey;


      if (
        workerAKey !==
        expectedKey
      ) {

        throw new Error(
          "FAIL: Worker A changed the DeliveryJob idempotency key."
        );
      }


      console.log(
        "✅ Worker A uses the durable DeliveryJob key."
      );


      /* ======================================================
         SIMULATE WORKER CRASH
      ====================================================== */

      console.log(
        "\n💥 SIMULATING WORKER A CRASH..."
      );

      console.log(
        "Worker A will NOT mark the job sent."
      );


      /* ======================================================
         WAIT FOR LEASE TO EXPIRE
      ====================================================== */

      await new Promise(
        resolve =>
          setTimeout(
            resolve,
            1500
          )
      );


      /* ======================================================
         RECOVER STALE JOB
      ====================================================== */

      const recovery =
        await recoverStaleDeliveryJobs({

          workerName:
            "provider-idempotency-recovery",

          limit:
            10,

        });


      console.log(
        "\n🔄 STALE LEASE RECOVERY:"
      );

      console.log({

        scanned:
          recovery.scanned,

        recovered:
          recovery.recovered,

      });


      /* ======================================================
         FORCE RETRY IMMEDIATELY
         ONLY FOR TEST SPEED
      ====================================================== */

      await DeliveryJob.updateOne(

        {
          _id:
            job._id,

          organizationId:
            ORGANIZATION_ID,

        },

        {
          $set: {
            nextAttemptAt:
              new Date(),
          },
        }

      );


      /* ======================================================
         WORKER B CLAIMS SAME JOB
      ====================================================== */

      const workerBJob =
        await claimDeliveryJob(
          job._id,
          {

            workerName:
              WORKER_B,

            leaseDurationMs:
              1000,

            organizationId:
              ORGANIZATION_ID,

          }
        );


      if (
        !workerBJob
      ) {

        throw new Error(
          "FAIL: Worker B could not reclaim DeliveryJob."
        );
      }


      console.log(
        "\n👷 WORKER B CLAIMED RETRY:"
      );

      console.log({

        worker:
          workerBJob.workerName,

        attempts:
          workerBJob.attempts,

        status:
          workerBJob.status,

        lockToken:
          workerBJob.lockToken,

        idempotencyKey:
          workerBJob.idempotencyKey,

      });


      /* ======================================================
         CRITICAL ASSERTION
      ====================================================== */

      const workerBKey =
        workerBJob.idempotencyKey;


      if (
        workerBKey !==
        workerAKey
      ) {

        throw new Error(
          [
            "FAIL: Provider idempotency identity changed between retries.",
            `Worker A: ${workerAKey}`,
            `Worker B: ${workerBKey}`,
          ].join("\n")
        );
      }


      console.log(
        "\n✅ CRITICAL PASS:"
      );

      console.log(
        "Worker A and Worker B use the SAME durable idempotency key."
      );


      /* ======================================================
         FINAL DATABASE VERIFICATION
      ====================================================== */

      const finalJob =
        await DeliveryJob
          .findOne({

            _id:
              job._id,

            organizationId:
              ORGANIZATION_ID,

          })
          .lean();


      console.log(
        "\n🔍 FINAL DELIVERY JOB:"
      );

      console.log({

        jobId:
          String(finalJob._id),

        attempts:
          finalJob.attempts,

        status:
          finalJob.status,

        idempotencyKey:
          finalJob.idempotencyKey,

        workerName:
          finalJob.workerName,

      });


      if (
        finalJob.idempotencyKey !==
        expectedKey
      ) {

        throw new Error(
          "FAIL: Final persisted provider identity changed."
        );
      }


      console.log(
        "\n============================================================"
      );

      console.log(
        "TEST 5A RESULT: PASS"
      );

      console.log(
        "============================================================"
      );

      console.log(
        "\nProven:"
      );

      console.log(
        "1. One AI Message creates one DeliveryJob."
      );

      console.log(
        "2. DeliveryJob receives a deterministic idempotency key."
      );

      console.log(
        "3. Worker A uses that identity."
      );

      console.log(
        "4. Worker A can crash before completion."
      );

      console.log(
        "5. Worker B can reclaim the same DeliveryJob."
      );

      console.log(
        "6. Worker B receives the SAME idempotency identity."
      );

      console.log(
        "\nProvider-level deduplication is the remaining boundary."
      );


    } finally {

      /* ======================================================
         CLEANUP
      ====================================================== */

      if (
        job?._id
      ) {

        await DeliveryJob.deleteOne({
          _id:
            job._id,
        });

      }


      if (
        message?._id
      ) {

        await Message.deleteOne({
          _id:
            message._id,
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


run()
  .catch(
    error => {

      console.error(
        "\n❌ TEST 5A FAILED:"
      );

      console.error(
        error
      );

      process.exit(
        1
      );

    }
  );