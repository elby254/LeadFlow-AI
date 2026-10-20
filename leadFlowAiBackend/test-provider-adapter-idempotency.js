import "dotenv/config";

import mongoose from "mongoose";

import Message from "./models/message.js";
import DeliveryJob from "./models/deliveryJob.js";

import {
  createDeliveryJob,
  claimDeliveryJob,
  recoverStaleDeliveryJobs,
} from "./services/deliveryJobService.js";


/* ============================================================
   CONFIG
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
  "Provider adapter idempotency test.";


const WORKER_A =
  "provider-adapter-worker-A";


const WORKER_B =
  "provider-adapter-worker-B";


/* ============================================================
   FAKE PROVIDER
============================================================ */

/**
 * Simulates a provider that supports idempotency.
 *
 * The provider stores every idempotency key it has already
 * accepted.
 *
 * First request with a key:
 *
 *     ACCEPT
 *
 * Second request with the same key:
 *
 *     DUPLICATE
 *
 * No real WhatsApp/SMS request is made.
 */

const fakeProvider =
  (() => {

    const acceptedKeys =
      new Map();


    return {

      send:
        async ({
          phone,
          message,
          idempotencyKey,
        }) => {

          console.log(
            "\n📡 FAKE PROVIDER RECEIVED:"
          );

          console.log({

            phone,

            message,

            idempotencyKey,

          });


          if (
            !idempotencyKey
          ) {

            throw new Error(
              "Provider rejected request: idempotencyKey is missing."
            );
          }


          const existing =
            acceptedKeys.get(
              idempotencyKey
            );


          if (
            existing
          ) {

            console.log(
              "\n♻️ FAKE PROVIDER DUPLICATE:"
            );

            console.log({

              idempotencyKey,

              originalProviderMessageId:
                existing.providerMessageId,

            });


            return {

              success:
                true,

              duplicate:
                true,

              provider:
                "fake-provider",

              providerMessageId:
                existing.providerMessageId,

            };

          }


          const providerMessageId =
            `fake-provider-${acceptedKeys.size + 1}`;


          acceptedKeys.set(
            idempotencyKey,
            {
              providerMessageId,
            }
          );


          console.log(
            "\n✅ FAKE PROVIDER ACCEPTED:"
          );

          console.log({

            idempotencyKey,

            providerMessageId,

          });


          return {

            success:
              true,

            duplicate:
              false,

            provider:
              "fake-provider",

            providerMessageId,

          };

        },


      getDeliveryCount:
        () =>
          acceptedKeys.size,


      getAcceptedKeys:
        () =>
          Array.from(
            acceptedKeys.keys()
          ),

    };

  })();


/* ============================================================
   TEST
============================================================ */

const run =
  async () => {

    console.log(
      "\n============================================================"
    );

    console.log(
      "TEST 5B — PROVIDER ADAPTER IDEMPOTENCY"
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
         CREATE AI MESSAGE
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

        idempotencyKey:
          job.idempotencyKey,

        status:
          job.status,

      });


      const expectedKey =
        `ai-reply:${message._id}`;


      if (
        job.idempotencyKey !==
        expectedKey
      ) {

        throw new Error(
          "FAIL: DeliveryJob generated unexpected idempotency key."
        );
      }


      /* ======================================================
         WORKER A CLAIM
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
          "FAIL: Worker A could not claim job."
        );
      }


      console.log(
        "\n👷 WORKER A:"
      );

      console.log({

        attempts:
          workerAJob.attempts,

        idempotencyKey:
          workerAJob.idempotencyKey,

      });


      /* ======================================================
         WORKER A → PROVIDER
      ====================================================== */

      const providerResultA =
        await fakeProvider.send({

          phone:
            workerAJob.recipient,

          message:
            TEST_MESSAGE,

          idempotencyKey:
            workerAJob.idempotencyKey,

        });


      if (
        !providerResultA.success ||
        providerResultA.duplicate
      ) {

        throw new Error(
          "FAIL: First provider request was not accepted as a new delivery."
        );
      }


      console.log(
        "\n💥 SIMULATING WORKER A CRASH AFTER PROVIDER ACCEPTANCE"
      );

      console.log(
        "Worker A does NOT call markDeliveryJobSent()."
      );


      /* ======================================================
         WAIT FOR LEASE EXPIRATION
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
            "provider-adapter-recovery",

          limit:
            10,

        });


      console.log(
        "\n🔄 RECOVERY:"
      );

      console.log({

        scanned:
          recovery.scanned,

        recovered:
          recovery.recovered,

      });


      /* ======================================================
         FORCE NEXT RETRY
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
         WORKER B CLAIM
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
          "FAIL: Worker B could not reclaim job."
        );
      }


      console.log(
        "\n👷 WORKER B:"
      );

      console.log({

        attempts:
          workerBJob.attempts,

        idempotencyKey:
          workerBJob.idempotencyKey,

      });


      /* ======================================================
         CRITICAL RETRY ASSERTION
      ====================================================== */

      if (
        workerBJob.idempotencyKey !==
        workerAJob.idempotencyKey
      ) {

        throw new Error(
          [
            "FAIL: Worker B received a different provider identity.",
            `Worker A: ${workerAJob.idempotencyKey}`,
            `Worker B: ${workerBJob.idempotencyKey}`,
          ].join("\n")
        );
      }


      console.log(
        "\n🔁 WORKER B RETRYING SAME PROVIDER IDENTITY"
      );


      /* ======================================================
         WORKER B → PROVIDER
      ====================================================== */

      const providerResultB =
        await fakeProvider.send({

          phone:
            workerBJob.recipient,

          message:
            TEST_MESSAGE,

          idempotencyKey:
            workerBJob.idempotencyKey,

        });


      /* ======================================================
         PROVIDER MUST DEDUPLICATE
      ====================================================== */

      if (
        !providerResultB.success
      ) {

        throw new Error(
          "FAIL: Provider did not accept the idempotent retry."
        );
      }


      if (
        providerResultB.duplicate !==
        true
      ) {

        throw new Error(
          "FAIL: Provider treated retry as a NEW delivery."
        );
      }


      console.log(
        "\n♻️ PROVIDER CORRECTLY DETECTED DUPLICATE"
      );


      /* ======================================================
         DELIVERY COUNT
      ====================================================== */

      const deliveryCount =
        fakeProvider.getDeliveryCount();


      console.log(
        "\n📊 FAKE PROVIDER DELIVERY COUNT:"
      );

      console.log(
        deliveryCount
      );


      if (
        deliveryCount !==
        1
      ) {

        throw new Error(
          [
            "FAIL: Provider delivered the message more than once.",
            `Delivery count: ${deliveryCount}`,
          ].join("\n")
        );
      }


      /* ======================================================
         FINAL RESULT
      ====================================================== */

      console.log(
        "\n============================================================"
      );

      console.log(
        "TEST 5B RESULT: PASS"
      );

      console.log(
        "============================================================"
      );


      console.log(
        "\nProven:"
      );

      console.log(
        "1. Worker A sent using the durable DeliveryJob identity."
      );

      console.log(
        "2. Provider accepted the first delivery."
      );

      console.log(
        "3. Worker A crashed before marking the job sent."
      );

      console.log(
        "4. Worker B reclaimed the same DeliveryJob."
      );

      console.log(
        "5. Worker B reused the SAME provider identity."
      );

      console.log(
        "6. Provider detected the duplicate."
      );

      console.log(
        "7. Provider delivery count remained exactly 1."
      );


      console.log(
        "\n⚠️ IMPORTANT:"
      );

      console.log(
        "This test proves the REQUIRED provider contract."
      );

      console.log(
        "It does NOT yet prove Meta WhatsApp or Africa's Talking"
      );

      console.log(
        "themselves provide the same idempotency behavior."
      );

    } finally {

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
        "\n❌ TEST 5B FAILED:"
      );

      console.error(
        error
      );

      process.exit(
        1
      );

    }
  );