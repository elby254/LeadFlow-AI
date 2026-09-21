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
 * │ whatsapp  → WhatsApp Cloud API               │
 * │ website   → Website realtime transport        │
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
 */

import {
  sendSMS,
} from "./africastalkingService.js";

import {
  sendWhatsAppMessage,
} from "./whatsappService.js";

import Organization from "../models/organization.js";


/* ============================================================
   SUPPORTED SOURCES
============================================================ */

const VALID_SOURCES = [
  "sms",
  "whatsapp",
  "website",
  "facebook",
];


/* ============================================================
   NORMALIZE SOURCE
============================================================ */

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
    ].includes(
      normalized
    )
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
    ].includes(
      normalized
    )
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
    ].includes(
      normalized
    )
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
    ].includes(
      normalized
    )
  ) {

    return "facebook";
  }

  return "";
};


/* ============================================================
   VALIDATE PHONE
============================================================ */

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
   RESOLVE ORGANIZATION WHATSAPP CONFIG
============================================================ */

/**
 * WhatsApp Phone Number IDs are organization-scoped.
 *
 * IMPORTANT:
 *
 * We deliberately DO NOT use:
 *
 *     process.env.WHATSAPP_PHONE_NUMBER_ID
 *
 * The access token remains server configuration.
 *
 * The Phone Number ID comes from the Organization document.
 */

const getOrganizationWhatsAppConfig =
  async (
    organizationId
  ) => {

    if (
      !organizationId
    ) {

      throw new Error(
        "Organization ID is required for WhatsApp outbound delivery."
      );
    }


    const organization =
      await Organization
        .findById(
          organizationId
        )
        .select(
          "whatsappPhoneNumberId whatsappBusinessAccountId whatsappBusinessNumber whatsappDisplayName whatsappEnabled"
        )
        .lean();


    if (
      !organization
    ) {

      throw new Error(
        "Organization could not be found for WhatsApp outbound delivery."
      );
    }


    if (
      !organization.whatsappEnabled
    ) {

      throw new Error(
        "WhatsApp is not enabled for this organization."
      );
    }


    if (
      !organization.whatsappPhoneNumberId
    ) {

      throw new Error(
        "Organization WhatsApp Phone Number ID is not configured."
      );
    }


    return organization;
  };


/* ============================================================
   WHATSAPP TRANSPORT
============================================================ */

const sendWhatsApp = async ({
  phone,
  message,
  context = {},
}) => {

  console.log(
    "💬 TRANSPORT: WhatsApp Cloud API"
  );


  const organizationId =
    context?.organizationId;


  if (
    !organizationId
  ) {

    throw new Error(
      "Organization ID is required for WhatsApp transport."
    );
  }


  const organization =
    await getOrganizationWhatsAppConfig(
      organizationId
    );


  console.log(
    "🏢 WHATSAPP ORGANIZATION CONFIG:",
    {

      organizationId,

      phoneNumberId:
        organization.whatsappPhoneNumberId,

      businessAccountId:
        organization.whatsappBusinessAccountId,

      businessNumber:
        organization.whatsappBusinessNumber,

      displayName:
        organization.whatsappDisplayName,

      enabled:
        organization.whatsappEnabled,

    }
  );


  const result =
    await sendWhatsAppMessage(
      phone,
      message,
      organization.whatsappPhoneNumberId
    );


  console.log(
    "✅ WHATSAPP TRANSPORT COMPLETE:",
    {

      organizationId,

      phoneNumberId:
        organization.whatsappPhoneNumberId,

      recipient:
        phone,

    }
  );


  return result;
};


/* ============================================================
   WEBSITE TRANSPORT
============================================================ */

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


  return {

    success:
      false,

    transport:
      "website",

    provider:
      "realtime",

    reason:
      "Website realtime transport is not configured in this service yet.",

  };
};


/* ============================================================
   FACEBOOK TRANSPORT
============================================================ */

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

    success:
      false,

    transport:
      "facebook",

    provider:
      null,

    reason:
      "Facebook transport is not configured.",

  };
};


/* ============================================================
   AFRICA'S TALKING SMS
============================================================ */

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

    success:
      true,

    transport:
      "sms",

    provider:
      "africastalking",

    result,

  };
};


/* ============================================================
   MAIN TRANSPORT ROUTER
============================================================ */

export const sendOutboundMessage =
  async ({
    source,
    phone,
    message,
    context = {},
  }) => {

    try {

      /* ------------------------------------------------------
         Validate phone
      ------------------------------------------------------ */

      if (
        !validatePhone(
          phone
        )
      ) {

        console.warn(
          "⚠️ Outbound message skipped: phone number is missing."
        );


        return {

          success:
            false,

          transport:
            null,

          provider:
            null,

          reason:
            "Phone number is required.",

        };
      }


      /* ------------------------------------------------------
         Validate message
      ------------------------------------------------------ */

      if (
        !validateMessage(
          message
        )
      ) {

        console.warn(
          "⚠️ Outbound message skipped: message is empty."
        );


        return {

          success:
            false,

          transport:
            null,

          provider:
            null,

          reason:
            "Message is required.",

        };
      }


      /* ------------------------------------------------------
         Normalize source
      ------------------------------------------------------ */

      const normalizedSource =
        normalizeSource(
          source
        );


      console.log(
        "🚚 OUTBOUND TRANSPORT SOURCE:",
        normalizedSource ||
          "(missing)"
      );


      /* ------------------------------------------------------
         Validate source
      ------------------------------------------------------ */

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

          success:
            false,

          transport:
            null,

          provider:
            null,

          reason:
            "Unsupported outbound message source.",

          source:
            normalizedSource ||
            null,

        };
      }


      const finalMessage =
        String(
          message
        ).trim();


      console.log(
        "🚚 OUTBOUND MESSAGE TRANSPORT:",
        {

          source:
            normalizedSource,

          phone,

          organizationId:
            context?.organizationId ||
            null,

          messageLength:
            finalMessage.length,

        }
      );


      /* ======================================================
         SMS
      ====================================================== */

      if (
        normalizedSource ===
        "sms"
      ) {

        return await sendAfricaTalkingSMS({

          phone,

          message:
            finalMessage,

        });
      }


      /* ======================================================
         WHATSAPP
      ====================================================== */

      if (
        normalizedSource ===
        "whatsapp"
      ) {

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


      /* ======================================================
         WEBSITE
      ====================================================== */

      if (
        normalizedSource ===
        "website"
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


      /* ======================================================
         FACEBOOK
      ====================================================== */

      if (
        normalizedSource ===
        "facebook"
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


      /* ------------------------------------------------------
         Defensive fallback
      ------------------------------------------------------ */

      console.error(
        "❌ No outbound transport matched source:",
        normalizedSource
      );


      return {

        success:
          false,

        transport:
          null,

        provider:
          null,

        reason:
          "No outbound transport matched the source.",

      };

    } catch (
      error
    ) {

      console.error(
        "❌ Outbound message transport failed:",
        error
      );


      return {

        success:
          false,

        transport:
          null,

        provider:
          null,

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

export const sendOutboundSMS =
  async (
    phone,
    message,
    context = {}
  ) => {

    return await sendOutboundMessage({

      source:
        "sms",

      phone,

      message,

      context,

    });
  };


/* ============================================================
   TRANSPORT AVAILABILITY
============================================================ */

export const getTransportAvailability =
  () => {

    return {

      sms: {

        available:
          true,

        provider:
          "africastalking",

      },

      whatsapp: {

        available:
          true,

        provider:
          "meta_whatsapp_cloud_api",

      },

      website: {

        available:
          false,

        provider:
          "realtime",

      },

      facebook: {

        available:
          false,

        provider:
          null,

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