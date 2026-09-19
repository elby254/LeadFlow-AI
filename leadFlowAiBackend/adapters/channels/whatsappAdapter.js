/**
 * ==========================================================
 * WHATSAPP CHANNEL ADAPTER
 * ==========================================================
 *
 * LeadFlow AI
 *
 * Meta WhatsApp webhook
 *            ↓
 * WhatsApp Channel Adapter
 *            ↓
 * Normalized LeadFlow request
 *            ↓
 * AI Ingestion Controller
 *
 * RESPONSIBILITY
 * ----------------------------------------------------------
 * This adapter is responsible ONLY for WhatsApp/Meta
 * provider-specific parsing and normalization.
 *
 * It does NOT:
 * ----------------------------------------------------------
 * ❌ Perform AI processing
 * ❌ Create or update leads
 * ❌ Calculate lead scores
 * ❌ Assign agents
 * ❌ Manage conversations
 * ❌ Generate replies
 * ❌ Perform AI qualification
 *
 * Those responsibilities belong to the shared LeadFlow AI
 * ingestion pipeline.
 *
 * ==========================================================
 */


/**
 * ==========================================================
 * EXTRACT WHATSAPP MESSAGE
 * ==========================================================
 *
 * Meta webhook structure:
 *
 * payload
 *   └── entry[]
 *        └── changes[]
 *             └── value
 *                  ├── metadata
 *                  ├── contacts[]
 *                  └── messages[]
 *
 * Provider-specific structure stays inside this adapter.
 *
 * ==========================================================
 */

const extractMessage = (
  payload
) => {

  const entry =
    payload?.entry?.[0];


  const change =
    entry?.changes?.[0];


  const value =
    change?.value;


  const message =
    value?.messages?.[0];


  if (!message) {

    return null;

  }


  return {

    message,

    value,

  };

};


/* ==========================================================
   WHATSAPP ADAPTER
========================================================== */

export const whatsappAdapter = (
  req,
  res,
  next
) => {

  try {

    // ========================================================
    // 1. RAW WHATSAPP PAYLOAD
    // ========================================================

    const payload =
      req.body || {};


    console.log(
      "=================================================="
    );

    console.log(
      "📩 WHATSAPP CHANNEL ADAPTER"
    );

    console.log(
      "=================================================="
    );

    console.log(
      "📦 RAW WHATSAPP PAYLOAD:"
    );

    console.dir(
      payload,
      {
        depth: null,
      }
    );


    // ========================================================
    // 2. EXTRACT CUSTOMER MESSAGE
    // ========================================================

    const extracted =
      extractMessage(
        payload
      );


    // ========================================================
    // 3. IGNORE NON-MESSAGE EVENTS
    // ========================================================
    //
    // WhatsApp can send webhook events for:
    //
    // - message status
    // - delivery
    // - read receipts
    // - other events
    //
    // These do not enter AI ingestion.
    //
    // ========================================================

    if (!extracted) {

      console.log(
        "ℹ️ WhatsApp event ignored — no inbound customer message."
      );

      return res
        .status(200)
        .json({
          success: true,
          ignored: true,
        });

    }


    const {
      message,
      value,
    } = extracted;


    // ========================================================
    // 4. EXTRACT CUSTOMER PHONE
    // ========================================================

    const phone =
      message?.from;


    // ========================================================
    // 5. EXTRACT CUSTOMER TEXT
    // ========================================================
    //
    // Current adapter handles WhatsApp text messages.
    //
    // Media-specific processing can be added later without
    // exposing Meta's raw structure to AI ingestion.
    //
    // ========================================================

    const text =
      message?.text?.body;


    // ========================================================
    // 6. VALIDATE CUSTOMER TEXT MESSAGE
    // ========================================================

    if (
      !phone ||
      !text
    ) {

      console.log(
        "ℹ️ WhatsApp event ignored — no customer text message found."
      );

      return res
        .status(200)
        .json({

          success: true,

          ignored: true,

          reason:
            "No customer text message found",

        });

    }


    // ========================================================
    // 7. NORMALIZE MESSAGE TEXT
    // ========================================================

    const normalizedPhone =
      String(
        phone
      ).trim();


    const normalizedMessage =
      String(
        text
      ).trim();


    if (
      !normalizedPhone ||
      !normalizedMessage
    ) {

      console.log(
        "ℹ️ WhatsApp message ignored — empty phone or text."
      );

      return res
        .status(200)
        .json({

          success: true,

          ignored: true,

          reason:
            "Empty customer phone or message",

        });

    }


    // ========================================================
    // 8. EXTRACT WHATSAPP BUSINESS IDENTIFIER
    // ========================================================
    //
    // phone_number_id is critical for multi-tenant routing.
    //
    // It identifies the WhatsApp Business number that received
    // the customer message.
    //
    // Organization resolution can use this identifier.
    //
    // ========================================================

    const phoneNumberId =
      value
        ?.metadata
        ?.phone_number_id;


    if (!phoneNumberId) {

      console.error(
        "❌ WhatsApp phone number ID is missing."
      );

      return res
        .status(400)
        .json({

          success: false,

          message:
            "WhatsApp phone number ID is missing",

        });

    }


    // ========================================================
    // 9. EXTRACT CUSTOMER PROFILE
    // ========================================================

    const customerName =
      value
        ?.contacts?.[0]
        ?.profile?.name ||
      null;


    // ========================================================
    // 10. EXTRACT PROVIDER MESSAGE ID
    // ========================================================

    const messageId =
      message?.id ||
      null;


    // ========================================================
    // 11. EXTRACT BUSINESS ACCOUNT INFORMATION
    // ========================================================

    const businessAccountId =
      value
        ?.metadata
        ?.business_account_id ||
      null;


    const displayPhoneNumber =
      value
        ?.metadata
        ?.display_phone_number ||
      null;


    // ========================================================
    // 12. TRUSTED CHANNEL IDENTITY
    // ========================================================
    //
    // The provider determines the channel.
    //
    // The customer cannot choose:
    //
    // source = "whatsapp"
    //
    // through the request body.
    //
    // ========================================================

    req.source =
      "whatsapp";

    req.channel =
      "whatsapp";


    // ========================================================
    // 13. CUSTOMER INFORMATION
    // ========================================================

    req.channelCustomer = {

      name:
        customerName,

      phone:
        normalizedPhone,

      externalId:
        normalizedPhone,

    };


    // ========================================================
    // 14. PROVIDER METADATA
    // ========================================================

    req.channelMetadata = {

      provider:
        "whatsapp",

      phoneNumberId,

      businessAccountId,

      displayPhoneNumber,

      messageId,

    };


    // ========================================================
    // 15. NORMALIZED MESSAGE
    // ========================================================
    //
    // This is the standardized internal LeadFlow AI
    // representation.
    //
    // AI ingestion should work with this representation
    // rather than knowing about Meta's webhook structure.
    //
    // ========================================================

    req.normalizedMessage = {

      channel:
        "whatsapp",

      organizationId:
        req.organizationId ||
        req.organization?._id ||
        req.user?.organizationId ||
        null,

      customer: {

        name:
          customerName,

        phone:
          normalizedPhone,

        externalId:
          normalizedPhone,

      },

      message: {

        text:
          normalizedMessage,

        type:
          "text",

        externalMessageId:
          messageId,

      },

      metadata: {

        provider:
          "whatsapp",

        phoneNumberId,

        businessAccountId,

        displayPhoneNumber,

        messageId,

      },

    };


    // ========================================================
    // 16. BACKWARD-COMPATIBLE INGESTION BODY
    // ========================================================
    //
    // IMPORTANT:
    //
    // The current AI ingestion controller still supports:
    //
    // {
    //   phone,
    //   message
    // }
    //
    // Therefore we preserve this interface for now.
    //
    // The standardized object above is available through:
    //
    // req.normalizedMessage
    //
    // After all channel adapters are standardized, the common
    // ingestion controller can consume normalizedMessage
    // directly.
    //
    // ========================================================

    req.body = {

      phone:
        normalizedPhone,

      message:
        normalizedMessage,

    };


    // ========================================================
    // 17. DEBUG INFORMATION
    // ========================================================

    console.log(
      "📱 WHATSAPP CHANNEL:",
      req.channel
    );

    console.log(
      "👤 WHATSAPP CUSTOMER:",
      req.channelCustomer
    );

    console.log(
      "📞 WHATSAPP PHONE NUMBER ID:",
      phoneNumberId
    );

    console.log(
      "🏢 WHATSAPP BUSINESS ACCOUNT ID:",
      businessAccountId
    );

    console.log(
      "📲 WHATSAPP DISPLAY NUMBER:",
      displayPhoneNumber
    );

    console.log(
      "🆔 WHATSAPP MESSAGE ID:",
      messageId
    );

    console.log(
      "🧠 NORMALIZED WHATSAPP MESSAGE:"
    );

    console.dir(
      req.normalizedMessage,
      {
        depth: null,
      }
    );


    // ========================================================
    // 18. CONTINUE TO SHARED INGESTION PIPELINE
    // ========================================================

    console.log(
      "➡️ WHATSAPP ADAPTER → AI INGESTION"
    );

    next();

  } catch (error) {

    // ========================================================
    // ERROR HANDLING
    // ========================================================

    console.error(
      "❌ WhatsApp adapter error:"
    );

    console.error(
      error
    );

    console.error(
      error?.stack
    );

    next(error);

  }

};


// ==========================================================
// DEFAULT EXPORT
// ==========================================================

export default whatsappAdapter;