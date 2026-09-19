/**
 * ============================================================
 *
 * MESSAGE TRANSPORT SERVICE
 *
 * Purpose
 * ------------------------------------------------------------
 * Central outbound message router for LeadFlow AI.
 *
 * This service decides HOW an AI-generated message should be
 * delivered based on the trusted communication source.
 *
 * Architecture
 * ------------------------------------------------------------
 *
 * Channel / Webhook
 *        ↓
 * source resolved
 *        ↓
 * aiIngestionController
 *        ↓
 * AI processing
 *        ↓
 * aiAutoReplyController
 *        ↓
 * messageTransportService
 *        ↓
 * ┌───────────────────────────────────────────────┐
 * │                                               │
 * │ sms       → Africa's Talking SMS              │
 * │ whatsapp  → WhatsApp transport               │
 * │ website   → website transport / SMS fallback  │
 * │ facebook  → Facebook transport                │
 * │                                               │
 * └───────────────────────────────────────────────┘
 *
 * ============================================================
 *
 * IMPORTANT
 * ------------------------------------------------------------
 *
 * CUSTOMER REQUESTS MUST NOT CONTROL THE TRANSPORT.
 *
 * The customer should only provide:
 *
 * {
 *   phone,
 *   message
 * }
 *
 * Source must be established by the trusted channel adapter,
 * webhook, authenticated application request, or upstream
 * ingestion layer.
 *
 * ============================================================
 *
 * SMS PROVIDER
 * ------------------------------------------------------------
 *
 * SMS is STRICTLY handled by:
 *
 *     africastalkingService.js
 *
 * This service does NOT implement SMS itself.
 *
 * It delegates SMS delivery to:
 *
 *     sendSMS()
 *
 * from Africa's Talking service.
 *
 * ============================================================
 */

import {
  sendSMS,
} from "./africastalkingService.js";

/* ============================================================
   SUPPORTED SOURCES
============================================================ */

/**
 * These are the communication sources currently supported
 * by LeadFlow AI.
 *
 * IMPORTANT:
 *
 * These values represent CHANNELS, not Lead.status values.
 *
 * Lead.status remains:
 *
 *     new
 *     contacted
 *     qualified
 *     viewing
 *     negotiation
 *     won
 *     lost
 */
const VALID_SOURCES = [
  "sms",
  "whatsapp",
  "website",
  "facebook",
];

/* ============================================================
   NORMALIZE SOURCE
============================================================ */

/**
 * Normalizes a trusted source value.
 *
 * This function does NOT read source from the customer's
 * message body.
 *
 * The caller must supply the trusted source.
 *
 * Supported canonical values:
 *
 *     sms
 *     whatsapp
 *     website
 *     facebook
 */
const normalizeSource = (
  source
) => {
  if (
    source === null ||
    source === undefined
  ) {
    return "";
  }

  const normalized =
    String(source)
      .trim()
      .toLowerCase();

  if (!normalized) {
    return "";
  }

  /* ----------------------------------------------------------
     SMS
  ---------------------------------------------------------- */

  if (
    [
      "sms",
      "text",
      "text_message",
      "text-message",
    ].includes(normalized)
  ) {
    return "sms";
  }

  /* ----------------------------------------------------------
     WHATSAPP
  ---------------------------------------------------------- */

  if (
    [
      "whatsapp",
      "whats_app",
      "whats-app",
    ].includes(normalized)
  ) {
    return "whatsapp";
  }

  /* ----------------------------------------------------------
     WEBSITE
  ---------------------------------------------------------- */

  if (
    [
      "website",
      "web",
      "site",
      "webchat",
      "web_chat",
    ].includes(normalized)
  ) {
    return "website";
  }

  /* ----------------------------------------------------------
     FACEBOOK
  ---------------------------------------------------------- */

  if (
    [
      "facebook",
      "messenger",
      "fb",
    ].includes(normalized)
  ) {
    return "facebook";
  }

  return "";
};

/* ============================================================
   VALIDATE PHONE
============================================================ */

/**
 * Validates the destination phone number.
 *
 * LeadFlow AI currently uses phone as the primary customer
 * communication identifier for SMS and WhatsApp.
 */
const validatePhone = (
  phone
) => {
  if (
    phone === null ||
    phone === undefined
  ) {
    return false;
  }

  return (
    String(phone).trim() !== ""
  );
};

/* ============================================================
   VALIDATE MESSAGE
============================================================ */

/**
 * Validates the outbound message.
 */
const validateMessage = (
  message
) => {
  if (
    message === null ||
    message === undefined
  ) {
    return false;
  }

  return (
    String(message).trim() !== ""
  );
};

/* ============================================================
   WHATSAPP TRANSPORT
============================================================ */

/**
 * WhatsApp transport placeholder.
 *
 * IMPORTANT:
 *
 * We intentionally do NOT pretend that a WhatsApp provider
 * exists in the current codebase.
 *
 * Once the LeadFlow AI WhatsApp service is connected, this
 * function should delegate to that service.
 *
 * DO NOT route WhatsApp through Africa's Talking SMS unless
 * the actual WhatsApp provider implementation explicitly
 * supports it.
 */
const sendWhatsApp = async ({
  phone,
  message,
  context = {},
}) => {
  console.warn(
    "⚠️ WhatsApp transport is not configured yet.",
    {
      phone,
      source:
        context?.source ||
        "whatsapp",
    }
  );

  /**
   * Returning a structured result allows the caller to
   * distinguish an unavailable transport from a successful
   * delivery.
   */
  return {
    success: false,
    transport: "whatsapp",
    provider: null,
    reason:
      "WhatsApp transport is not configured.",
  };
};

/* ============================================================
   WEBSITE TRANSPORT
============================================================ */

/**
 * Website transport.
 *
 * Website conversations are normally expected to receive
 * their response through the application's realtime/web
 * channel rather than an external SMS provider.
 *
 * The actual realtime delivery can later be connected to the
 * existing realtime engine / Socket.io layer.
 *
 * IMPORTANT:
 *
 * We do NOT silently send a website response as SMS here.
 *
 * This prevents the bug where:
 *
 *     source = website
 *
 * accidentally becomes:
 *
 *     Africa's Talking SMS
 *
 * ============================================================
 */
const sendWebsiteMessage = async ({
  phone,
  message,
  context = {},
}) => {
  console.log(
    "🌐 WEBSITE OUTBOUND MESSAGE:",
    {
      phone,
      source:
        context?.source ||
        "website",
    }
  );

  /**
   * The website transport should eventually publish the
   * message through the existing realtime conversation layer.
   *
   * For now we return a controlled result instead of
   * incorrectly using SMS.
   */
  return {
    success: false,
    transport: "website",
    provider: "realtime",
    reason:
      "Website realtime transport is not configured in this service yet.",
  };
};

/* ============================================================
   FACEBOOK TRANSPORT
============================================================ */

/**
 * Facebook / Messenger transport placeholder.
 *
 * This should eventually delegate to the Facebook Messenger
 * integration when configured.
 */
const sendFacebookMessage = async ({
  phone,
  message,
  context = {},
}) => {
  console.warn(
    "⚠️ Facebook transport is not configured yet.",
    {
      phone,
      source:
        context?.source ||
        "facebook",
    }
  );

  return {
    success: false,
    transport: "facebook",
    provider: null,
    reason:
      "Facebook transport is not configured.",
  };
};

/* ============================================================
   AFRICA'S TALKING SMS
============================================================ */

/**
 * Send SMS strictly through Africa's Talking.
 *
 * IMPORTANT:
 *
 * This is the ONLY SMS provider used by LeadFlow AI.
 *
 * We deliberately keep this wrapper separate so the transport
 * router remains provider-aware without duplicating provider
 * logic.
 */
const sendAfricaTalkingSMS = async ({
  phone,
  message,
}) => {
  console.log(
    "📱 TRANSPORT: Africa's Talking SMS"
  );

  console.log(
    "📤 AFRICA'S TALKING SMS TO:",
    phone
  );

  /**
   * Existing Africa's Talking implementation.
   *
   * africastalkingService.js
   *        ↓
   * sendSMS()
   */
  const result =
    await sendSMS(
      phone,
      message
    );

  console.log(
    "✅ AFRICA'S TALKING SMS TRANSPORT COMPLETE:",
    phone
  );

  return {
    success: true,
    transport: "sms",
    provider: "africastalking",
    result,
  };
};

/* ============================================================
   MAIN TRANSPORT ROUTER
============================================================ */

/**
 * ============================================================
 *
 * sendOutboundMessage()
 *
 * ============================================================
 *
 * Central outbound message function.
 *
 * Usage:
 *
 * await sendOutboundMessage({
 *   source,
 *   phone,
 *   message,
 *   context,
 * });
 *
 * ============================================================
 *
 * Source determines transport:
 *
 * sms
 *     ↓
 * Africa's Talking SMS
 *
 * whatsapp
 *     ↓
 * WhatsApp transport
 *
 * website
 *     ↓
 * Website realtime transport
 *
 * facebook
 *     ↓
 * Facebook transport
 *
 * ============================================================
 */
export const sendOutboundMessage = async ({
  source,
  phone,
  message,
  context = {},
}) => {
  try {
    /* --------------------------------------------------------
       Validate phone
    -------------------------------------------------------- */

    if (
      !validatePhone(
        phone
      )
    ) {
      console.warn(
        "⚠️ Outbound message skipped: phone number is missing."
      );

      return {
        success: false,
        transport: null,
        provider: null,
        reason:
          "Phone number is required.",
      };
    }

    /* --------------------------------------------------------
       Validate message
    -------------------------------------------------------- */

    if (
      !validateMessage(
        message
      )
    ) {
      console.warn(
        "⚠️ Outbound message skipped: message is empty."
      );

      return {
        success: false,
        transport: null,
        provider: null,
        reason:
          "Message is required.",
      };
    }

    /* --------------------------------------------------------
       Normalize source
    -------------------------------------------------------- */

    const normalizedSource =
      normalizeSource(
        source
      );

    console.log(
      "🚚 OUTBOUND TRANSPORT SOURCE:",
      normalizedSource ||
        "(missing)"
    );

    /* --------------------------------------------------------
       Validate source
    -------------------------------------------------------- */

    if (
      !VALID_SOURCES.includes(
        normalizedSource
      )
    ) {
      console.error(
        "❌ Unsupported outbound message source:",
        source
      );

      return {
        success: false,
        transport: null,
        provider: null,
        reason:
          "Unsupported outbound message source.",
        source:
          normalizedSource ||
          null,
      };
    }

    /* --------------------------------------------------------
       Normalize message
    -------------------------------------------------------- */

    const finalMessage =
      String(
        message
      ).trim();

    /* --------------------------------------------------------
       Transport debug
    -------------------------------------------------------- */

    console.log(
      "🚚 OUTBOUND MESSAGE TRANSPORT:",
      {
        source:
          normalizedSource,
        phone,
        messageLength:
          finalMessage.length,
      }
    );

    /* ========================================================
       SMS
    ======================================================== */

    if (
      normalizedSource === "sms"
    ) {
      return await sendAfricaTalkingSMS({
        phone,
        message:
          finalMessage,
      });
    }

    /* ========================================================
       WHATSAPP
    ======================================================== */

    if (
      normalizedSource === "whatsapp"
    ) {
      console.log(
        "💬 TRANSPORT: WhatsApp"
      );

      return await sendWhatsApp({
        phone,
        message:
          finalMessage,
        context: {
          ...context,
          source:
            normalizedSource,
        },
      });
    }

    /* ========================================================
       WEBSITE
    ======================================================== */

    if (
      normalizedSource === "website"
    ) {
      return await sendWebsiteMessage({
        phone,
        message:
          finalMessage,
        context: {
          ...context,
          source:
            normalizedSource,
        },
      });
    }

    /* ========================================================
       FACEBOOK
    ======================================================== */

    if (
      normalizedSource === "facebook"
    ) {
      return await sendFacebookMessage({
        phone,
        message:
          finalMessage,
        context: {
          ...context,
          source:
            normalizedSource,
        },
      });
    }

    /* --------------------------------------------------------
       Defensive fallback
    -------------------------------------------------------- */

    console.error(
      "❌ No outbound transport matched source:",
      normalizedSource
    );

    return {
      success: false,
      transport: null,
      provider: null,
      reason:
        "No outbound transport matched the source.",
    };

  } catch (error) {
    console.error(
      "❌ Outbound message transport failed:",
      error
    );

    return {
      success: false,
      transport: null,
      provider: null,
      reason:
        error?.message ||
        "Outbound transport failed.",
      error,
    };
  }
};

/* ============================================================
   CONVENIENCE SMS FUNCTION
============================================================ */

/**
 * Explicit SMS helper.
 *
 * This is useful when another internal service intentionally
 * needs to send an SMS and already knows the channel is SMS.
 *
 * IMPORTANT:
 *
 * It STILL goes strictly through Africa's Talking.
 */
export const sendOutboundSMS = async (
  phone,
  message,
  context = {}
) => {
  return await sendOutboundMessage({
    source: "sms",
    phone,
    message,
    context,
  });
};

/* ============================================================
   TRANSPORT AVAILABILITY
============================================================ */

/**
 * Returns the currently configured transport providers.
 *
 * This is useful for diagnostics and health checks.
 */
export const getTransportAvailability = () => {
  return {
    sms: {
      available: true,
      provider:
        "africastalking",
    },

    whatsapp: {
      available: false,
      provider: null,
    },

    website: {
      available: false,
      provider:
        "realtime",
    },

    facebook: {
      available: false,
      provider: null,
    },
  };
};

/* ============================================================
   DEFAULT EXPORT
============================================================ */

export default {
  sendOutboundMessage,
  sendOutboundSMS,
  getTransportAvailability,
};