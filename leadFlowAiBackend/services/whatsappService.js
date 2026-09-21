/**
 * ==========================================================
 * WHATSAPP SERVICE
 * ==========================================================
 *
 * Responsibility
 * --------------
 * Actually sends outbound WhatsApp messages.
 *
 * This service does NOT:
 * - determine organization
 * - determine source
 * - create leads
 * - perform AI extraction
 * - decide customer intent
 *
 * The caller is responsible for providing the correct
 * organization-scoped WhatsApp Phone Number ID.
 *
 * ==========================================================
 */

import axios from "axios";

const WHATSAPP_API_VERSION =
  process.env.WHATSAPP_API_VERSION || "v23.0";


/* ============================================================
   CONFIGURATION
============================================================ */

/**
 * WhatsApp access token is application/server configuration.
 *
 * Phone Number ID is NOT global configuration.
 *
 * Phone Number ID belongs to the organization and must
 * therefore be supplied by the caller.
 */

const getConfig = (
  phoneNumberId
) => {

  const accessToken =
    process.env.WHATSAPP_ACCESS_TOKEN;


  if (
    !phoneNumberId
  ) {

    throw new Error(
      "Organization WhatsApp Phone Number ID is required"
    );
  }


  if (
    !accessToken
  ) {

    throw new Error(
      "WHATSAPP_ACCESS_TOKEN is not configured"
    );
  }


  return {

    phoneNumberId:
      String(
        phoneNumberId
      ).trim(),

    accessToken,

  };
};


/* ============================================================
   NORMALIZE PHONE
============================================================ */

const normalizePhone = (
  phone
) => {

  if (
    !phone
  ) {

    throw new Error(
      "WhatsApp recipient phone is required"
    );
  }


  return String(phone)
    .replace(/[^\d]/g, "")
    .replace(/^0+/, "");
};


/* ============================================================
   SEND WHATSAPP MESSAGE
============================================================ */

export const sendWhatsAppMessage = async (
  phone,
  message,
  phoneNumberId
) => {

  const {
    phoneNumberId:
      organizationPhoneNumberId,

    accessToken,

  } = getConfig(
    phoneNumberId
  );


  const normalizedPhone =
    normalizePhone(
      phone
    );


  if (
    !message
  ) {

    throw new Error(
      "WhatsApp message cannot be empty"
    );
  }


  const url =
    `https://graph.facebook.com/` +
    `${WHATSAPP_API_VERSION}/` +
    `${organizationPhoneNumberId}/messages`;


  console.log(
    "📱 WHATSAPP OUTBOUND:",
    {

      phoneNumberId:
        organizationPhoneNumberId,

      recipient:
        normalizedPhone,

    }
  );


  const response =
    await axios.post(

      url,

      {

        messaging_product:
          "whatsapp",

        recipient_type:
          "individual",

        to:
          normalizedPhone,

        type:
          "text",

        text: {

          preview_url:
            false,

          body:
            message,

        },

      },

      {

        headers: {

          Authorization:
            `Bearer ${accessToken}`,

          "Content-Type":
            "application/json",

        },

      }

    );


  console.log(
    "✅ WhatsApp message accepted:",
    response.data
  );


  return {

    success:
      true,

    provider:
      "whatsapp",

    channel:
      "whatsapp",

    transport:
      "whatsapp",

    recipient:
      normalizedPhone,

    phoneNumberId:
      organizationPhoneNumberId,

    providerResponse:
      response.data,

  };
};


/* ============================================================
   DEFAULT EXPORT
============================================================ */

export default {

  sendWhatsAppMessage,

};