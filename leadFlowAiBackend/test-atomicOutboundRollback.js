import mongoose from "mongoose";
import dotenv from "dotenv";

import Message from "./models/message.js";
import DeliveryJob from "./models/deliveryJob.js";

dotenv.config();

const TEST_PREFIX = "atomic-rollback-test-";

async function runAtomicOutboundRollbackTest() {
  let session;

  const organizationId =
    new mongoose.Types.ObjectId();

  const conversationId =
    new mongoose.Types.ObjectId();

  const leadId =
    new mongoose.Types.ObjectId();

  const messageId =
    new mongoose.Types.ObjectId();

  const idempotencyKey =
    `${TEST_PREFIX}${messageId}`;

  let expectedValidationFailure = false;

  try {
    console.log("\n========================================");
    console.log("PHASE 8D: ATOMIC ROLLBACK TEST");
    console.log("========================================\n");

    if (!process.env.MONGO_URI) {
      throw new Error(
        "MONGO_URI is missing from the environment."
      );
    }

    await mongoose.connect(
      process.env.MONGO_URI
    );

    console.log("✅ MongoDB connected.");

    const hello =
      await mongoose.connection.db
        .admin()
        .command({ hello: 1 });

    if (
      !hello.setName &&
      hello.msg !== "isdbgrid"
    ) {
      throw new Error(
        "MongoDB does not support multi-document transactions on this deployment."
      );
    }

    console.log(
      "✅ Transaction-capable deployment confirmed."
    );

    session = await mongoose.startSession();

    try {
      await session.withTransaction(async () => {
        /*
         * OPERATION 1
         *
         * Insert the AI Message inside the transaction.
         */

        const [message] = await Message.create(
          [
            {
              _id: messageId,
              organizationId,
              conversationId,
              leadId,
              source: "website",
              externalMessageId: null,
              senderId: null,
              senderRole: "ai",
              senderName: "Rollback Test",
              text: `${TEST_PREFIX} temporary test message`,
              status: "sending",
              aiGenerated: true,
              aiConfidence: 0.9,
            },
          ],
          { session }
        );

        console.log(
          "✅ Message inserted inside transaction:",
          message._id.toString()
        );

        /*
         * OPERATION 2
         *
         * Deliberately violate the DeliveryJob schema.
         *
         * The invalid provider is not included in the schema's
         * allowed provider enum.
         *
         * validate() must throw before any DeliveryJob insert.
         */

        const invalidJob = new DeliveryJob({
          organizationId,
          messageId: message._id,
          conversationId,
          leadId,
          source: "website",
          recipient: "+254700000000",
          provider: "invalid_rollback_test_provider",
          status: "pending",
          attempts: 0,
          maxAttempts: 10,
          nextAttemptAt: new Date(),
          idempotencyKey,
        });

        try {
          await invalidJob.validate();

          throw new Error(
            "TEST FAILURE: invalid provider unexpectedly passed validation."
          );
        } catch (error) {
          if (
            error.message.includes(
              "invalid provider unexpectedly passed validation"
            )
          ) {
            throw error;
          }

          if (
            error.name !== "ValidationError"
          ) {
            throw error;
          }

          expectedValidationFailure = true;

          console.log(
            "✅ Expected DeliveryJob validation failure:",
            error.message
          );

          /*
           * Re-throwing this error exits the transaction callback.
           * MongoDB should abort the transaction, including the
           * Message insert above.
           */
          throw error;
        }
      });

      throw new Error(
        "TEST FAILURE: transaction unexpectedly committed."
      );

    } catch (error) {
      if (!expectedValidationFailure) {
        throw error;
      }

      console.log(
        "✅ Transaction aborted after expected validation failure."
      );
    }

    /*
     * Verify the database state outside the transaction.
     */

    const persistedMessage =
      await Message.findOne({
        _id: messageId,
        organizationId,
      }).lean();

    const persistedJob =
      await DeliveryJob.findOne({
        organizationId,
        idempotencyKey,
      }).lean();

    if (persistedMessage) {
      throw new Error(
        "FAIL: Message persisted despite transaction abort."
      );
    }

    if (persistedJob) {
      throw new Error(
        "FAIL: DeliveryJob persisted despite transaction abort."
      );
    }

    console.log("\n========================================");
    console.log("✅ PHASE 8D ROLLBACK TEST PASSED");
    console.log("========================================");
    console.log("Message exists after abort: false");
    console.log("DeliveryJob exists after abort: false");
    console.log("Provider calls made: 0");
    console.log("Customer messages sent: 0");
    console.log("========================================\n");

  } finally {
    if (session) {
      await session.endSession();
    }

    await mongoose.disconnect();
  }
}

runAtomicOutboundRollbackTest().catch((error) => {
  console.error(
    "\n❌ PHASE 8D ROLLBACK TEST FAILED:",
    error
  );

  process.exitCode = 1;
});