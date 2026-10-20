/**
 * ==========================================================
 *
 * PHASE 8E — ATOMIC OUTBOUND DATABASE WRITE FAILURE TEST
 *
 * LeadFlow AI
 *
 * ==========================================================
 *
 * PURPOSE
 * ----------------------------------------------------------
 *
 * 1. Create a temporary DeliveryJob with a unique test key.
 * 2. Start a MongoDB transaction.
 * 3. Insert a test Message inside the transaction.
 * 4. Attempt a second DeliveryJob insert using the same key.
 * 5. Let MongoDB reject the insert with E11000.
 * 6. Verify that the transaction rolled back the Message.
 * 7. Verify that the original collision record remains intact.
 * 8. Clean up only the test records created by this script.
 *
 * SAFETY
 * ----------------------------------------------------------
 *
 * - No transport/provider calls.
 * - No customer messages.
 * - No existing customer records intentionally modified.
 * - Uses generated ObjectIds and a unique test key.
 *
 * ==========================================================
 */

import mongoose from "mongoose";
import dotenv from "dotenv";

import Message from "./models/message.js";
import DeliveryJob from "./models/deliveryJob.js";

import {
  createDeliveryJob,
} from "./services/deliveryJobService.js";


dotenv.config();


const TEST_PREFIX =
  "atomic-write-failure-test-";


async function runAtomicOutboundWriteFailureTest() {

  let session = null;

  let mongoConnectedHere = false;

  let collisionJobId = null;

  let testMessageId = null;

  let testOrganizationId = null;

  let idempotencyKey = null;

  let duplicateKeyFailureObserved = false;

  let transactionAbortObserved = false;

  let testPassed = false;


  try {

    console.log("\n==============================================");

    console.log(
      "PHASE 8E: ATOMIC OUTBOUND DATABASE WRITE FAILURE"
    );

    console.log("==============================================\n");


    // ======================================================
    // STEP 1 — CONNECT TO MONGODB
    // ======================================================

    if (
      mongoose.connection.readyState === 0
    ) {

      if (
        !process.env.MONGO_URI
      ) {

        throw new Error(
          "MONGO_URI is missing. Check your root .env file."
        );
      }

      await mongoose.connect(
        process.env.MONGO_URI
      );

      mongoConnectedHere = true;

    } else {

      console.log(
        "ℹ️ Reusing the existing Mongoose connection."
      );
    }


    console.log(
      "✅ MongoDB connected."
    );


    // ======================================================
    // STEP 2 — CONFIRM TRANSACTION SUPPORT
    // ======================================================

    const hello =
      await mongoose.connection.db
        .admin()
        .command({
          hello: 1,
        });


    if (
      !hello.setName &&
      hello.msg !== "isdbgrid"
    ) {

      throw new Error(
        "MongoDB deployment does not support multi-document transactions."
      );
    }


    console.log(
      "✅ Transaction-capable deployment confirmed."
    );


    // ======================================================
    // STEP 3 — ENSURE MODELS AND INDEXES ARE INITIALIZED
    // ======================================================

    await Message.init();

    await DeliveryJob.init();


    const indexes =
      await DeliveryJob.collection.indexes();


    const uniqueIdempotencyIndex =
      indexes.find(
        (index) =>
          index.unique === true &&
          index.key?.idempotencyKey === 1
      );


    if (
      !uniqueIdempotencyIndex
    ) {

      throw new Error(
        "The required unique idempotencyKey index was not found. Refusing to run the test."
      );
    }


    console.log(
      "✅ Unique DeliveryJob idempotency index confirmed:",
      uniqueIdempotencyIndex.name
    );


    // ======================================================
    // STEP 4 — GENERATE ISOLATED TEST IDENTIFIERS
    // ======================================================

    testOrganizationId =
      new mongoose.Types.ObjectId();


    const conversationId =
      new mongoose.Types.ObjectId();


    const leadId =
      new mongoose.Types.ObjectId();


    testMessageId =
      new mongoose.Types.ObjectId();


    idempotencyKey =
      `${TEST_PREFIX}${testMessageId.toString()}`;


    const collisionMessageId =
      new mongoose.Types.ObjectId();


    console.log(
      "🧪 Test organization:",
      testOrganizationId.toString()
    );


    console.log(
      "🧪 Test Message ID:",
      testMessageId.toString()
    );


    console.log(
      "🧪 Collision idempotency key:",
      idempotencyKey
    );


    // ======================================================
    // STEP 5 — CREATE THE COLLISION RECORD
    // ======================================================
    //
    // This is a temporary, persisted DeliveryJob.
    //
    // It is deliberately marked DEAD so the running delivery
    // worker cannot claim it.
    //
    // It has no associated Message because MongoDB references
    // do not automatically enforce foreign-key constraints.
    //
    // The unique key is reserved for this test only.
    // ======================================================

    const collisionJob =
      await DeliveryJob.create({

        organizationId:
          testOrganizationId,

        messageId:
          collisionMessageId,

        conversationId,

        leadId,

        source:
          "website",

        recipient:
          "+254700000000",

        provider:
          "realtime",

        status:
          "dead",

        attempts:
          10,

        maxAttempts:
          10,

        nextAttemptAt:
          new Date(),

        deadAt:
          new Date(),

        deadReason:
          "Temporary Phase 8E test collision record.",

        idempotencyKey,

        metadata: {

          testOnly: true,

          testName:
            "atomicOutboundWriteFailure",

        },

      });


    collisionJobId =
      collisionJob._id;


    console.log(
      "✅ Temporary collision record created:",
      collisionJobId.toString()
    );


    // ======================================================
    // STEP 6 — START THE TRANSACTION
    // ======================================================

    session =
      await mongoose.startSession();


    try {

      await session.withTransaction(
        async () => {

          // ------------------------------------------------
          // WRITE 1 — INSERT THE TEST MESSAGE
          // ------------------------------------------------

          const [message] =
            await Message.create(

              [

                {

                  _id:
                    testMessageId,

                  organizationId:
                    testOrganizationId,

                  conversationId,

                  leadId,

                  source:
                    "website",

                  externalMessageId:
                    null,

                  senderId:
                    null,

                  senderRole:
                    "ai",

                  senderName:
                    "Atomic Write Failure Test",

                  text:
                    `${TEST_PREFIX} temporary transaction test`,

                  status:
                    "sending",

                  aiGenerated:
                    true,

                  aiConfidence:
                    0.9,

                },

              ],

              {
                session,
              }

            );


          console.log(
            "✅ Test Message inserted inside transaction:",
            message._id.toString()
          );


          // ------------------------------------------------
          // WRITE 2 — ATTEMPT THE DELIVERYJOB INSERT
          // ------------------------------------------------
          //
          // The key already exists on collisionJob.
          //
          // createDeliveryJob receives the same session as
          // Message.create.
          //
          // MongoDB should reject the second insert with E11000.
          //
          // The service must rethrow the error when a session
          // is supplied.
          // ------------------------------------------------

          console.log(
            "🧪 Attempting DeliveryJob insert with duplicate key..."
          );


          try {

            await createDeliveryJob({

              organizationId:
                testOrganizationId,

              messageId:
                message._id,

              conversationId,

              leadId,

              source:
                "website",

              recipient:
                "+254700000000",

              provider:
                "realtime",

              maxAttempts:
                10,

              idempotencyKey,

              metadata: {

                testOnly: true,

                testName:
                  "atomicOutboundWriteFailure",

              },

              session,

            });


            throw new Error(
              "TEST FAILURE: duplicate-key DeliveryJob insert unexpectedly succeeded."
            );


          } catch (error) {

            if (
              error.message.includes(
                "duplicate-key DeliveryJob insert unexpectedly succeeded"
              )
            ) {

              throw error;
            }


            if (
              error?.code !== 11000
            ) {

              console.error(
                "❌ DeliveryJob insert failed for an unexpected reason:",
                error
              );

              throw error;
            }


            duplicateKeyFailureObserved =
              true;


            console.log(
              "✅ MongoDB rejected the DeliveryJob insert with E11000."
            );


            console.log(
              "✅ Duplicate-key error propagated from createDeliveryJob."
            );


            // Rethrow so withTransaction aborts the Message insert.
            throw error;

          }

        }
      );


      throw new Error(
        "TEST FAILURE: transaction unexpectedly committed."
      );


    } catch (error) {

      if (
        !duplicateKeyFailureObserved
      ) {

        throw error;
      }


      if (
        error?.code !== 11000
      ) {

        throw error;
      }


      transactionAbortObserved =
        true;


      console.log(
        "✅ Transaction aborted after the database write failure."
      );

    }


    // ======================================================
    // STEP 7 — VERIFY ROLLBACK OUTSIDE THE TRANSACTION
    // ======================================================

    const persistedMessage =
      await Message.findOne({

        _id:
          testMessageId,

        organizationId:
          testOrganizationId,

      }).lean();


    const jobForTestMessage =
      await DeliveryJob.findOne({

        organizationId:
          testOrganizationId,

        messageId:
          testMessageId,

      }).lean();


    const persistedCollisionJob =
      await DeliveryJob.findOne({

        _id:
          collisionJobId,

        organizationId:
          testOrganizationId,

        idempotencyKey,

      }).lean();


    if (
      persistedMessage
    ) {

      throw new Error(
        "FAIL: Message persisted after the transaction aborted."
      );
    }


    if (
      jobForTestMessage
    ) {

      throw new Error(
        "FAIL: A DeliveryJob referencing the test Message persisted."
      );
    }


    if (
      !persistedCollisionJob
    ) {

      throw new Error(
        "FAIL: The original collision record is unexpectedly missing."
      );
    }


    if (
      String(persistedCollisionJob.messageId) !==
      String(collisionMessageId)
    ) {

      throw new Error(
        "FAIL: The original collision record was unexpectedly changed."
      );
    }


    if (
      persistedCollisionJob.status !== "dead"
    ) {

      throw new Error(
        "FAIL: The original collision record's status changed."
      );
    }


    console.log(
      "✅ Test Message does not exist after rollback."
    );


    console.log(
      "✅ No DeliveryJob references the test Message."
    );


    console.log(
      "✅ Original collision record remains intact."
    );


    console.log(
      "✅ No provider calls were made."
    );


    console.log(
      "✅ No customer messages were sent."
    );


    testPassed = true;


    console.log("\n==============================================");

    console.log(
      "✅ PHASE 8E: ACTUAL DATABASE WRITE FAILURE TEST PASSED"
    );

    console.log("==============================================\n");


  } catch (error) {

    console.error(
      "\n❌ PHASE 8E TEST FAILED:",
      error
    );

  } finally {

    // ======================================================
    // STEP 8 — CLEAN UP ONLY OUR OWN TEST RECORDS
    // ======================================================

    if (
      session
    ) {

      await session.endSession();

    }


    if (
      mongoose.connection.readyState === 1 &&
      testOrganizationId
    ) {

      try {

        if (
          testMessageId
        ) {

          await Message.deleteOne({

            _id:
              testMessageId,

            organizationId:
              testOrganizationId,

          });

        }


        if (
          testMessageId
        ) {

          await DeliveryJob.deleteMany({

            organizationId:
              testOrganizationId,

            messageId:
              testMessageId,

          });

        }


        if (
          collisionJobId
        ) {

          await DeliveryJob.deleteOne({

            _id:
              collisionJobId,

            organizationId:
              testOrganizationId,

          });

        }


        console.log(
          "🧹 Temporary Phase 8E test records cleaned up."
        );


      } catch (cleanupError) {

        console.error(
          "⚠️ Test cleanup failed. Inspect the generated test IDs before removing any records:",
          cleanupError
        );

        console.error(
          {
            organizationId:
              testOrganizationId.toString(),

            messageId:
              testMessageId?.toString() || null,

            collisionJobId:
              collisionJobId?.toString() || null,

            idempotencyKey,

          }
        );

        testPassed = false;

      }

    }


    if (
      mongoConnectedHere
    ) {

      await mongoose.disconnect();

    }


    if (
      !testPassed ||
      !duplicateKeyFailureObserved ||
      !transactionAbortObserved
    ) {

      process.exitCode = 1;

    }

  }

}


runAtomicOutboundWriteFailureTest();