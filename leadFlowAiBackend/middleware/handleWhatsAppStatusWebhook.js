/**
 * ==========================================================
 * WHATSAPP DELIVERY STATUS WEBHOOK
 * LeadFlow AI
 * ==========================================================
 *
 * Responsibilities:
 * - Process Meta WhatsApp delivery status notifications.
 * - Resolve the organization from its WhatsApp phone number ID.
 * - Match provider message IDs to DeliveryJob records.
 * - Update the corresponding outbound Message.
 * - Prevent stale callbacks from downgrading delivery status.
 *
 * IMPORTANT:
 * - Signature verification must run before this middleware.
 * - Status callbacks must never enter AI ingestion.
 * - All database lookups are organization-scoped.
 *
 * ==========================================================
 */

import DeliveryJob from "../models/deliveryJob.js";
import Message from "../models/message.js";

import {
  resolveByWhatsApp,
} from "../services/organizationResolverService.js";


const SUPPORTED_STATUSES = new Set([
  "sent",
  "delivered",
  "read",
  "failed",
]);


/**
 * Convert Meta's Unix timestamp (seconds) to a Date.
 */
function parseProviderTimestamp(timestamp) {
  if (
    timestamp === undefined ||
    timestamp === null ||
    timestamp === ""
  ) {
    return null;
  }

  const seconds = Number(timestamp);

  if (!Number.isFinite(seconds) || seconds <= 0) {
    return null;
  }

  const date = new Date(seconds * 1000);

  return Number.isNaN(date.getTime())
    ? null
    : date;
}


/**
 * Return the next safe Message status.
 *
 * A callback may advance a message, but must never downgrade
 * a message already marked delivered or read.
 */
function resolveNextStatus(currentStatus, incomingStatus) {
  const current = String(currentStatus || "").toLowerCase();
  const incoming = String(incomingStatus || "").toLowerCase();

  if (!SUPPORTED_STATUSES.has(incoming)) {
    return null;
  }

  if (current === "read") {
    return "read";
  }

  if (current === "delivered" && incoming !== "read") {
    return "delivered";
  }

  if (current === "failed" && incoming === "sent") {
    return "failed";
  }

  if (incoming === "failed") {
    return "failed";
  }

  const rank = {
    sending: 0,
    sent: 1,
    delivered: 2,
    read: 3,
    failed: -1,
  };

  if (
    rank[incoming] === undefined ||
    rank[current] === undefined
  ) {
    return null;
  }

  if (incoming === "failed") {
    return "failed";
  }

  return rank[incoming] >= rank[current]
    ? incoming
    : current;
}


/**
 * Process a single Meta status notification.
 */
async function processStatus(
  statusItem,
  metadata,
  {
    DeliveryJobModel,
    MessageModel,
    resolveByWhatsAppFn,
  }
) {
  const providerMessageId = String(
    statusItem?.id || ""
  ).trim();

  const incomingStatus = String(
    statusItem?.status || ""
  ).trim().toLowerCase();

  const phoneNumberId = String(
    metadata?.phone_number_id || ""
  ).trim();

  if (
    !providerMessageId ||
    !phoneNumberId ||
    !SUPPORTED_STATUSES.has(incomingStatus)
  ) {
    console.warn(
      "WHATSAPP_STATUS_CALLBACK_SKIPPED",
      {
        hasProviderMessageId: Boolean(providerMessageId),
        hasPhoneNumberId: Boolean(phoneNumberId),
        status: incomingStatus || "missing",
      }
    );

    return;
  }

  const organization = await resolveByWhatsAppFn(
    phoneNumberId
  );

  if (!organization?._id) {
    const error = new Error(
      "WhatsApp status callback organization could not be resolved."
    );

    error.statusCode = 503;

    throw error;
  }

  /**
   * Match the provider ID inside the resolved organization.
   *
   * Never search by provider message ID alone.
   */
  const deliveryJobs = await DeliveryJobModel.find({
    organizationId: organization._id,
    source: "whatsapp",
    provider: "meta_whatsapp_cloud_api",
    providerMessageId,
  })
    .select("_id messageId organizationId")
    .limit(2)
    .lean();

  if (deliveryJobs.length === 0) {
    /**
     * A callback can arrive before the worker persists the
     * provider ID. Returning a retryable error allows Meta
     * to retry instead of silently losing the notification.
     */
    const error = new Error(
      "Matching WhatsApp delivery job was not found."
    );

    error.statusCode = 503;

    throw error;
  }

  if (deliveryJobs.length !== 1) {
    console.error(
      "WHATSAPP_STATUS_CALLBACK_AMBIGUOUS_JOB",
      {
        organizationId: String(organization._id),
        provider: "meta_whatsapp_cloud_api",
      }
    );

    const error = new Error(
      "WhatsApp provider message ID matched multiple delivery jobs."
    );

    error.statusCode = 503;

    throw error;
  }

  const deliveryJob = deliveryJobs[0];

  /**
   * Meta timestamps are Unix seconds.
   */
  const providerTimestamp = parseProviderTimestamp(
    statusItem.timestamp
  );

  /**
   * Update only outbound WhatsApp messages belonging to
   * this organization.
   *
   * Atomic status conditions prevent stale callbacks from
   * downgrading delivered/read messages.
   */
  const currentMessage = await MessageModel.findOne({
    _id: deliveryJob.messageId,
    organizationId: organization._id,
    source: "whatsapp",
    senderRole: {
      $in: ["ai", "agent", "admin"],
    },
  })
    .select("_id status deliveredAt")
    .lean();

  if (!currentMessage) {
    console.warn(
      "WHATSAPP_STATUS_MESSAGE_NOT_FOUND",
      {
        organizationId: String(organization._id),
        deliveryJobId: String(deliveryJob._id),
      }
    );

    return;
  }

  const nextStatus = resolveNextStatus(
    currentMessage.status,
    incomingStatus
  );

  if (!nextStatus) {
    console.warn(
      "WHATSAPP_STATUS_TRANSITION_SKIPPED",
      {
        organizationId: String(organization._id),
        currentStatus: currentMessage.status,
        incomingStatus,
      }
    );

    return;
  }

  const allowedCurrentStatuses = {
    sent: ["sending", "sent"],
    delivered: ["sending", "sent", "delivered"],
    read: ["sending", "sent", "delivered", "read"],
    failed: ["sending", "sent", "failed"],
  };

  const update = {
    status: nextStatus,
  };

  /**
   * deliveredAt means delivery time, not read time.
   * Never populate it using the timestamp of a read event.
   */
  if (
  incomingStatus === "delivered" &&
  nextStatus === "delivered" &&
  providerTimestamp &&
  !currentMessage.deliveredAt
) {
  update.deliveredAt = providerTimestamp;
}

  const updatedMessage = await MessageModel.findOneAndUpdate(
    {
      _id: currentMessage._id,
      organizationId: organization._id,
      source: "whatsapp",
      senderRole: {
        $in: ["ai", "agent", "admin"],
      },
      status: {
        $in: allowedCurrentStatuses[nextStatus],
      },
    },
    {
      $set: update,
    },
    {
      new: true,
      runValidators: true,
    }
  );

  /**
   * A concurrent callback may have advanced the status
   * after the initial read. Do not overwrite it.
   */
  if (!updatedMessage) {
    console.info(
      "WHATSAPP_STATUS_CONCURRENT_UPDATE",
      {
        organizationId: String(organization._id),
        incomingStatus,
      }
    );
  }
}


/**
 * Express middleware.
 *
 * Status-only callbacks are acknowledged here and do not
 * continue to the WhatsApp adapter or AI ingestion.
 *
 * If a payload contains both statuses and inbound messages,
 * process the statuses and continue so the messages are not
 * accidentally discarded.
 */
export function createWhatsAppStatusWebhookHandler({
  DeliveryJobModel = DeliveryJob,
  MessageModel = Message,
  resolveByWhatsAppFn = resolveByWhatsApp,
} = {}) {
  const dependencies = {
    DeliveryJobModel,
    MessageModel,
    resolveByWhatsAppFn,
  };

  return async function handleWhatsAppStatusWebhook(
    req,
    res,
    next
  ) {
  try {
    const entries = Array.isArray(req.body?.entry)
      ? req.body.entry
      : [];

    let statusCount = 0;
    let inboundMessageCount = 0;

    for (const entry of entries) {
      const changes = Array.isArray(entry?.changes)
        ? entry.changes
        : [];

      for (const change of changes) {
        const value = change?.value || {};

        const statuses = Array.isArray(value.statuses)
          ? value.statuses
          : [];

        const messages = Array.isArray(value.messages)
          ? value.messages
          : [];

        if (messages.length > 0) {
          inboundMessageCount += messages.length;
        }

        for (const statusItem of statuses) {
          await processStatus(
           statusItem,
           value.metadata,
           dependencies
        );

          statusCount += 1;
        }
      }
    }

    if (statusCount > 0) {
      console.info(
        "WHATSAPP_STATUS_CALLBACKS_PROCESSED",
        {
          count: statusCount,
        }
      );
    }

    /**
     * Status-only notification:
     * acknowledge it without invoking AI ingestion.
     */
    if (
      statusCount > 0 &&
      inboundMessageCount === 0
    ) {
      return res.status(200).json({
        success: true,
        statusCallbacksProcessed: statusCount,
      });
    }

    /**
     * No statuses, or a mixed payload containing inbound
     * messages: preserve the existing inbound pipeline.
     */
    return next();
  } catch (error) {
    console.error(
      "WHATSAPP_STATUS_CALLBACK_FAILED",
      {
        statusCode: error?.statusCode || 500,
        message: error?.message || "Unknown processing error",
      }
    );

    return res.status(
      error?.statusCode || 500
    ).json({
      success: false,
      error: "WhatsApp status callback processing failed.",
    });
  }
  };
}

const handleWhatsAppStatusWebhook =
  createWhatsAppStatusWebhookHandler();

export default handleWhatsAppStatusWebhook;


/**
 * Export the pure transition helper for focused testing.
 */
export {
  resolveNextStatus,
  parseProviderTimestamp,
};