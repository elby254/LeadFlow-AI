/**
 * ============================================================
 *
 * LEADFLOW AI
 *
 * OUTBOUND MESSAGE + DELIVERYJOB TRANSACTION ATOMICITY TEST
 *
 * File:
 * -----
 * test-delivery-transaction-atomicity.js
 *
 * Purpose:
 * --------
 * Verify that an AI Message and its corresponding DeliveryJob
 * can be persisted atomically using a MongoDB transaction.
 *
 * TEST 8B
 * -------
 * Simulate DeliveryJob creation failure inside a transaction.
 *
 * Expected:
 *
 *   Message     -> ROLLED BACK
 *   DeliveryJob -> NOT PERSISTED
 *
 * TEST 8C
 * -------
 * Successfully create a Message and DeliveryJob inside one
 * MongoDB transaction.
 *
 * Expected:
 *
 *   Message     -> COMMITTED
 *   DeliveryJob -> COMMITTED
 *
 * SAFETY
 * ------
 * • Uses the existing Message model.
 * • Uses the existing DeliveryJob model.
 * • Uses the existing createDeliveryJob service.
 * • Does not invoke the auto-reply controller.
 * • Does not start the delivery worker.
 * • Does not call SMS or WhatsApp providers.
 * • Uses unique test IDs.
 * • Cleans up records created by this test.
 *
 * IMPORTANT
 * ---------
 * Run against the local rs0 replica set using:
 *
 *   node --env-file=.env.local .\test-delivery-transaction-atomicity.js
 *
 * Do not run against production data.
 *
 * ============================================================
 */

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


/**
 * Use the same organization ID used by the existing
 * outbound consistency reliability test.
 *
 * All created records are tracked by their unique IDs.
 */

const ORGANIZATION_ID =
  "6abfaed5e4f898dc5078510a";


/**
 * This number is stored only as test data.
 *
 * No transport service is invoked by this script.
 */

const TEST_PHONE =
  "+254700555555";


const TEST_PREFIX =
  `transaction-atomicity-${Date.now()}-${process.pid}`;


/* ============================================================
   HELPERS
============================================================ */

/**
 * Convert an identifier to a stable string.
 */

const idString = (value) =>
  value == null
    ? null
    : String(value);


/**
 * Build a fresh AI Message payload.
 */

const buildMessageData = ({
  messageId,
  conversationId,
  leadId,
  text,
}) => ({
  _id: messageId,

  organizationId:
    ORGANIZATION_ID,

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
    "AI Assistant",

  text,

  status:
    "sending",

  aiGenerated:
    true,

  aiConfidence:
    0.95,
});


/**
 * Independently inspect persistence after a transaction.
 *
 * These reads intentionally do not use the transaction
 * session. They check what is visible after the transaction
 * has committed or aborted.
 */

const inspectPersistedRecords = async ({
  messageId,
  organizationId,
}) => {
  const message =
    await Message.findOne({
      _id: messageId,
      organizationId,
    }).lean();

  const jobs =
    await DeliveryJob.find({
      organizationId,
      messageId,
    }).lean();

  return {
    message,
    jobs,
  };
};


/* ============================================================
   TEST RUNNER
============================================================ */

const run = async () => {
  console.log(
    "\n============================================================"
  );

  console.log(
    "LEADFLOW AI — TRANSACTION ATOMICITY TEST"
  );

  console.log(
    "============================================================\n"
  );


  /* ==========================================================
     CONNECT TO MONGODB
  ========================================================== */

  await mongoose.connect(
    mongoUri
  );


  const hello =
    await mongoose.connection.db
      .admin()
      .command({
        hello: 1,
      });


  console.log(
    "DATABASE CONNECTION:"
  );

  console.log({
    host:
      mongoose.connection.host,

    database:
      mongoose.connection.name,

    replicaSet:
      hello.setName || null,

    isWritablePrimary:
      hello.isWritablePrimary,

    primary:
      hello.primary || null,
  });


  /**
   * Guard against accidentally running this test against
   * the Atlas database or another unintended environment.
   *
   * This script is specifically for the local rs0 replica set.
   */

  if (
    mongoose.connection.host !== "127.0.0.1" &&
    mongoose.connection.host !== "localhost"
  ) {
    throw new Error(
      "SAFETY STOP: This test must run against local MongoDB, not Atlas or another remote host."
    );
  }


  if (
    hello.setName !== "rs0" ||
    hello.isWritablePrimary !== true
  ) {
    throw new Error(
      "SAFETY STOP: Expected the local rs0 replica set with a writable primary."
    );
  }


  console.log(
    "\n✅ Local replica-set safety check passed."
  );


  /* ==========================================================
     TEST DATA TRACKING
  ========================================================== */

  const createdMessageIds = [];

  const createdJobIds = [];

  let testFailures = 0;


  try {


    /* ========================================================
       TEST 8B — TRANSACTION ROLLBACK
    ======================================================== */

    console.log(
      "\n============================================================"
    );

    console.log(
      "TEST 8B — DELIVERYJOB FAILURE MUST ROLL BACK MESSAGE"
    );

    console.log(
      "============================================================\n"
    );


    const rollbackMessageId =
      new mongoose.Types.ObjectId();

    const rollbackConversationId =
      new mongoose.Types.ObjectId();

    const rollbackLeadId =
      new mongoose.Types.ObjectId();


    createdMessageIds.push(
      rollbackMessageId
    );


    const rollbackSession =
      await mongoose.startSession();


    let rollbackFailureCaught =
      false;

    let rollbackMessageIdInsideTransaction =
      null;


    try {

      await rollbackSession.withTransaction(
        async () => {

          console.log(
            "STEP 1: Creating AI Message inside transaction..."
          );


          const messages =
            await Message.create(
              [
                buildMessageData({
                  messageId:
                    rollbackMessageId,

                  conversationId:
                    rollbackConversationId,

                  leadId:
                    rollbackLeadId,

                  text:
                    `${TEST_PREFIX} rollback scenario`,
                }),
              ],
              {
                session:
                  rollbackSession,
              }
            );


          const message =
            messages[0];


          rollbackMessageIdInsideTransaction =
            message._id;


          console.log(
            "AI MESSAGE CREATED INSIDE TRANSACTION:"
          );

          console.log({
            messageId:
              idString(message._id),

            status:
              message.status,

            senderRole:
              message.senderRole,

            aiGenerated:
              message.aiGenerated,
          });


          console.log(
            "\nSTEP 2: Deliberately causing DeliveryJob validation failure..."
          );


          /**
           * We intentionally pass an invalid organization ID.
           *
           * The invalid ID causes DeliveryJob creation to fail
           * during validation.
           *
           * Crucially, this call receives the same transaction
           * session as Message.create().
           *
           * The error must escape the transaction callback.
           */

          await createDeliveryJob({
            organizationId:
              "invalid-organization-id",

            messageId:
              message._id,

            conversationId:
              rollbackConversationId,

            leadId:
              rollbackLeadId,

            source:
              "website",

            recipient:
              TEST_PHONE,

            idempotencyKey:
              `ai-message:${String(message._id)}`,

            session:
              rollbackSession,

            metadata: {
              test:
                "transaction-atomicity-rollback",

              testRun:
                TEST_PREFIX,
            },
          });


          /**
           * Reaching this line would mean the expected failure
           * did not occur.
           */

          throw new Error(
            "TEST FAILURE: DeliveryJob creation unexpectedly succeeded."
          );

        }
      );

    } catch (error) {

      rollbackFailureCaught =
        true;


      console.log(
        "\n✅ Expected transactional failure caught."
      );

      console.log({
        errorName:
          error.name,

        errorMessage:
          error.message,
      });

    } finally {

      await rollbackSession.endSession();

    }


    if (!rollbackFailureCaught) {

      testFailures += 1;

      console.error(
        "\n❌ TEST 8B FAILED: No transactional failure was caught."
      );

    } else {

      console.log(
        "\nSTEP 3: Inspecting MongoDB independently after transaction abort..."
      );


      const rollbackRecords =
        await inspectPersistedRecords({
          messageId:
            rollbackMessageId,

          organizationId:
            ORGANIZATION_ID,
        });


      console.log(
        "ROLLBACK PERSISTENCE CHECK:"
      );

      console.log({
        messageId:
          idString(rollbackMessageId),

        messagePersisted:
          rollbackRecords.message !== null,

        matchingDeliveryJobCount:
          rollbackRecords.jobs.length,
      });


      /**
       * Atomicity assertion:
       *
       * Neither the Message nor a matching DeliveryJob
       * should be visible after the aborted transaction.
       */

      const rollbackPassed =
        rollbackRecords.message === null &&
        rollbackRecords.jobs.length === 0;


      if (rollbackPassed) {

        console.log(
          "\n✅ TEST 8B RESULT: PASS"
        );

        console.log(
          "The failed DeliveryJob creation caused the Message transaction to roll back."
        );

        console.log(
          "No matching Message or DeliveryJob remains persisted."
        );

      } else {

        testFailures += 1;

        console.error(
          "\n❌ TEST 8B RESULT: FAIL"
        );

        console.error({
          messagePersisted:
            rollbackRecords.message !== null,

          matchingDeliveryJobCount:
            rollbackRecords.jobs.length,
        });

      }

    }


    /* ========================================================
       TEST 8C — SUCCESSFUL ATOMIC COMMIT
    ======================================================== */

    console.log(
      "\n============================================================"
    );

    console.log(
      "TEST 8C — MESSAGE AND DELIVERYJOB COMMIT TOGETHER"
    );

    console.log(
      "============================================================\n"
    );


    const commitMessageId =
      new mongoose.Types.ObjectId();

    const commitConversationId =
      new mongoose.Types.ObjectId();

    const commitLeadId =
      new mongoose.Types.ObjectId();


    createdMessageIds.push(
      commitMessageId
    );


    const commitSession =
      await mongoose.startSession();


    let committedJobId =
      null;


    try {

      await commitSession.withTransaction(
        async () => {

          console.log(
            "STEP 1: Creating AI Message inside transaction..."
          );


          const messages =
            await Message.create(
              [
                buildMessageData({
                  messageId:
                    commitMessageId,

                  conversationId:
                    commitConversationId,

                  leadId:
                    commitLeadId,

                  text:
                    `${TEST_PREFIX} commit scenario`,
                }),
              ],
              {
                session:
                  commitSession,
              }
            );


          const message =
            messages[0];


          console.log(
            "AI MESSAGE CREATED INSIDE TRANSACTION:"
          );

          console.log({
            messageId:
              idString(message._id),

            status:
              message.status,
          });


          console.log(
            "\nSTEP 2: Creating matching DeliveryJob inside the same transaction..."
          );


          const jobResult =
            await createDeliveryJob({
              organizationId:
                ORGANIZATION_ID,

              messageId:
                message._id,

              conversationId:
                commitConversationId,

              leadId:
                commitLeadId,

              source:
                "website",

              recipient:
                TEST_PHONE,

              idempotencyKey:
                `ai-message:${String(message._id)}`,

              session:
                commitSession,

              metadata: {
                test:
                  "transaction-atomicity-commit",

                testRun:
                  TEST_PREFIX,
              },
            });


          const job =
            jobResult?.job || null;


          if (!job) {

            throw new Error(
              "DeliveryJob service returned no job."
            );

          }


          if (
            idString(job.messageId) !==
            idString(message._id)
          ) {

            throw new Error(
              "DeliveryJob messageId does not match the AI Message."
            );

          }


          if (
            idString(job.organizationId) !==
            idString(message.organizationId)
          ) {

            throw new Error(
              "Message and DeliveryJob organization IDs do not match."
            );

          }


          committedJobId =
            job._id;


          createdJobIds.push(
            job._id
          );


          console.log(
            "DELIVERY JOB CREATED INSIDE TRANSACTION:"
          );

          console.log({
            deliveryJobId:
              idString(job._id),

            messageId:
              idString(job.messageId),

            organizationId:
              idString(job.organizationId),

            status:
              job.status,

            idempotencyKey:
              job.idempotencyKey,

            created:
              jobResult.created,

            duplicate:
              jobResult.duplicate,
          });


          if (
            jobResult.created !== true ||
            jobResult.duplicate !== false
          ) {

            throw new Error(
              "Expected a newly created DeliveryJob, not a duplicate."
            );

          }

        }
      );


      console.log(
        "\n✅ MongoDB transaction committed successfully."
      );


    } finally {

      await commitSession.endSession();

    }


    /* ========================================================
       VERIFY COMMITTED RECORDS OUTSIDE TRANSACTION
    ======================================================== */

    console.log(
      "\nSTEP 3: Inspecting committed records independently..."
    );


    const committedRecords =
      await inspectPersistedRecords({
        messageId:
          commitMessageId,

        organizationId:
          ORGANIZATION_ID,
      });


    const persistedMessage =
      committedRecords.message;


    const persistedJobs =
      committedRecords.jobs;


    console.log(
      "COMMIT PERSISTENCE CHECK:"
    );

    console.log({
      messageId:
        idString(commitMessageId),

      messagePersisted:
        persistedMessage !== null,

      messageStatus:
        persistedMessage?.status ?? null,

      senderRole:
        persistedMessage?.senderRole ?? null,

      aiGenerated:
        persistedMessage?.aiGenerated ?? null,

      matchingDeliveryJobCount:
        persistedJobs.length,

      deliveryJobs:
        persistedJobs.map((job) => ({
          deliveryJobId:
            idString(job._id),

          messageId:
            idString(job.messageId),

          organizationId:
            idString(job.organizationId),

          status:
            job.status,

          idempotencyKey:
            job.idempotencyKey,
        })),
    });


    const commitPassed =
      persistedMessage !== null &&
      persistedMessage.senderRole === "ai" &&
      persistedMessage.aiGenerated === true &&
      persistedJobs.length === 1 &&
      idString(persistedJobs[0].messageId) ===
        idString(persistedMessage._id) &&
      idString(persistedJobs[0].organizationId) ===
        idString(persistedMessage.organizationId) &&
      idString(persistedJobs[0]._id) ===
        idString(committedJobId);


    if (commitPassed) {

      console.log(
        "\n✅ TEST 8C RESULT: PASS"
      );

      console.log(
        "The AI Message and matching DeliveryJob are both persisted."
      );

      console.log(
        "Exactly one matching DeliveryJob exists."
      );

      console.log(
        "Message ID and organization ID match."
      );

    } else {

      testFailures += 1;

      console.error(
        "\n❌ TEST 8C RESULT: FAIL"
      );

      console.error(
        "The committed Message/DeliveryJob relationship did not meet the assertions."
      );

    }


    /* ========================================================
       FINAL RESULT
    ======================================================== */

    console.log(
      "\n============================================================"
    );

    if (testFailures === 0) {

      console.log(
        "TRANSACTION ATOMICITY TEST: PASS"
      );

      console.log(
        "TEST 8B: PASS — FAILED JOB CREATION ROLLS BACK MESSAGE"
      );

      console.log(
        "TEST 8C: PASS — MESSAGE AND JOB COMMIT TOGETHER"
      );

    } else {

      console.log(
        "TRANSACTION ATOMICITY TEST: FAIL"
      );

      console.log(
        `Failed assertions: ${testFailures}`
      );

    }

    console.log(
      "============================================================\n"
    );


    if (testFailures > 0) {
      process.exitCode = 1;
    }


  } finally {


    /* ========================================================
       CLEANUP TEST RECORDS
    ======================================================== */

    console.log(
      "\n============================================================"
    );

    console.log(
      "CLEANING UP TRANSACTION TEST DATA"
    );

    console.log(
      "============================================================"
    );


    /**
     * Delete only records belonging to this test's tracked IDs.
     *
     * Delete jobs before messages to avoid leaving test jobs
     * referencing deleted test messages.
     */

    if (createdJobIds.length > 0) {

      const jobCleanup =
        await DeliveryJob.deleteMany({
          _id: {
            $in: createdJobIds,
          },

          organizationId:
            ORGANIZATION_ID,
        });


      console.log(
        "DeliveryJob cleanup:"
      );

      console.log({
        deletedCount:
          jobCleanup.deletedCount,
      });

    }


    if (createdMessageIds.length > 0) {

      const messageCleanup =
        await Message.deleteMany({
          _id: {
            $in: createdMessageIds,
          },

          organizationId:
            ORGANIZATION_ID,
        });


      console.log(
        "Message cleanup:"
      );

      console.log({
        deletedCount:
          messageCleanup.deletedCount,
      });

    }


    /**
     * A transaction that aborts should leave no records.
     * This extra cleanup is narrowly scoped to the unique
     * test-run identifier, in case an unexpected error leaves
     * partially created test artifacts.
     */

    const orphanCleanup =
      await DeliveryJob.deleteMany({
        organizationId:
          ORGANIZATION_ID,

        "metadata.testRun":
          TEST_PREFIX,
      });


    console.log(
      "Additional test-run DeliveryJob cleanup:"
    );

    console.log({
      deletedCount:
        orphanCleanup.deletedCount,
    });


    console.log(
      "\n🧹 Transaction test cleanup completed."
    );


    await mongoose.disconnect();


    console.log(
      "🔌 MongoDB disconnected."
    );

  }

};


/* ============================================================
   EXECUTE
============================================================ */

run().catch(async (error) => {

  console.error(
    "\n❌ TRANSACTION ATOMICITY TEST FAILED:"
  );

  console.error(
    error
  );


  if (mongoose.connection.readyState !== 0) {

    await mongoose.disconnect().catch(() => {});

  }


  process.exit(1);

});