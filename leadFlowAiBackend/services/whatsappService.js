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
 * Those responsibilities belong elsewhere.
 */

import axios from "axios";

const WHATSAPP_API_VERSION =
  process.env.WHATSAPP_API_VERSION || "v23.0";

const getConfig = () => {
  const phoneNumberId =
    process.env.WHATSAPP_PHONE_NUMBER_ID;

  const accessToken =
    process.env.WHATSAPP_ACCESS_TOKEN;

  if (!phoneNumberId) {
    throw new Error(
      "WHATSAPP_PHONE_NUMBER_ID is not configured"
    );
  }

  if (!accessToken) {
    throw new Error(
      "WHATSAPP_ACCESS_TOKEN is not configured"
    );
  }

  return {
    phoneNumberId,
    accessToken,
  };
};

const normalizePhone = (phone) => {
  if (!phone) {
    throw new Error("WhatsApp recipient phone is required");
  }

  return String(phone)
    .replace(/[^\d]/g, "")
    .replace(/^0+/, "");
};

export const sendWhatsAppMessage = async (
  phone,
  message
) => {
  const { phoneNumberId, accessToken } =
    getConfig();

  const normalizedPhone =
    normalizePhone(phone);

  if (!message) {
    throw new Error(
      "WhatsApp message cannot be empty"
    );
  }

  const url =
    `https://graph.facebook.com/` +
    `${WHATSAPP_API_VERSION}/` +
    `${phoneNumberId}/messages`;

  console.log(
    "📱 WHATSAPP OUTBOUND:",
    normalizedPhone
  );

  const response = await axios.post(
    url,
    {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: normalizedPhone,
      type: "text",
      text: {
        preview_url: false,
        body: message,
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
    success: true,
    provider: "whatsapp",
    channel: "whatsapp",
    recipient: normalizedPhone,
    providerResponse: response.data,
  };
};

export default {
  sendWhatsAppMessage,
};