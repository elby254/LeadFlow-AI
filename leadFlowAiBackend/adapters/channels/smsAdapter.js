/**
 * ==========================================================
 * SMS CHANNEL ADAPTER
 * ==========================================================
 *
 * LeadFlow AI
 *
 * Africa's Talking webhook
 *            ↓
 * SMS Channel Adapter
 *            ↓
 * Normalized LeadFlow request
 *            ↓
 * AI Ingestion Controller
 *
 * RESPONSIBILITY
 * ----------------------------------------------------------
 * This adapter is responsible ONLY for SMS provider-specific
 * parsing and normalization.
 *
 * It does NOT:
 * ----------------------------------------------------------
 * ❌ Perform AI processing
 * ❌ Create or update leads
 * ❌ Calculate lead scores
 * ❌ Assign agents
 * ❌ Manage conversations
 * ❌ Generate replies
 * ❌ Resolve AI qualification
 *
 * Those responsibilities belong to the shared LeadFlow AI
 * ingestion pipeline.
 *
 * ==========================================================
 */

export const smsAdapter = (
  req,
  res,
  next
) => {

  try {

    // ========================================================
    // 1. RAW AFRICA'S TALKING PAYLOAD
    // ========================================================

    const payload =
      req.body || {};


    console.log(
      "=================================================="
    );

    console.log(
      "📩 SMS CHANNEL ADAPTER"
    );

    console.log(
      "=================================================="
    );

    console.log(
      "📦 RAW SMS PAYLOAD:"
    );

    console.dir(
      payload,
      {
        depth: null,
      }
    );


    // ========================================================
    // 2. EXTRACT CUSTOMER PHONE
    // ========================================================
    //
    // Africa's Talking commonly provides `from`.
    //
    // Additional fallbacks are retained so the adapter can
    // handle existing/test payload variations.
    //
    // ========================================================

    const phone =
      payload?.from ||
      payload?.phoneNumber ||
      payload?.phone ||
      null;


    // ========================================================
    // 3. EXTRACT MESSAGE TEXT
    // ========================================================

    const message =
      payload?.text ||
      payload?.message ||
      null;


    // ========================================================
    // 4. VALIDATE INCOMING SMS
    // ========================================================

    if (
      !phone ||
      !message
    ) {

      console.error(
        "❌ SMS webhook requires sender and message."
      );

      return res
        .status(400)
        .json({
          success: false,

          message:
            "SMS webhook requires sender and message",
        });

    }


    // ========================================================
    // 5. NORMALIZE VALUES
    // ========================================================

    const normalizedPhone =
      String(phone).trim();

    const normalizedMessage =
      String(message).trim();


    if (
      !normalizedPhone ||
      !normalizedMessage
    ) {

      console.error(
        "❌ SMS webhook contains an empty sender or message."
      );

      return res
        .status(400)
        .json({
          success: false,

          message:
            "SMS webhook requires a valid sender and message",
        });

    }


    // ========================================================
    // 6. EXTRACT PROVIDER IDENTIFIERS
    // ========================================================

    const receivingNumber =
      payload?.to ||
      payload?.shortCode ||
      payload?.recipient ||
      null;


    const messageId =
      payload?.messageId ||
      payload?.id ||
      null;


    // ========================================================
    // 7. TRUSTED CHANNEL IDENTITY
    // ========================================================
    //
    // The provider determines the channel.
    //
    // The customer must NOT be allowed to decide the source
    // by submitting it in the webhook body.
    //
    // ========================================================

    req.source =
      "sms";

    req.channel =
      "sms";


    // ========================================================
    // 8. CUSTOMER INFORMATION
    // ========================================================

    req.channelCustomer = {

      phone:
        normalizedPhone,

      name:
        null,

      externalId:
        normalizedPhone,

    };


    // ========================================================
    // 9. PROVIDER METADATA
    // ========================================================

    req.channelMetadata = {

      provider:
        "africastalking",

      receivingNumber,

      messageId:
        messageId ||
        null,

    };


    // ========================================================
    // 10. NORMALIZED MESSAGE
    // ========================================================
    //
    // This is the standardized LeadFlow AI representation.
    //
    // Provider-specific Africa's Talking fields should not
    // travel further into the application.
    //
    // ========================================================

    req.normalizedMessage = {

      channel:
        "sms",

      organizationId:
        req.organizationId ||
        req.organization?._id ||
        req.user?.organizationId ||
        null,

      customer: {

        phone:
          normalizedPhone,

        name:
          null,

        externalId:
          normalizedPhone,

      },

      message: {

        text:
          normalizedMessage,

        type:
          "text",

        externalMessageId:
          messageId ||
          null,

      },

      metadata: {

        provider:
          "africastalking",

        receivingNumber,

        messageId:
          messageId ||
          null,

      },

    };


    // ========================================================
    // 11. BACKWARD-COMPATIBLE INGESTION BODY
    // ========================================================
    //
    // IMPORTANT:
    //
    // The current AI ingestion controller already expects:
    //
    // {
    //   phone,
    //   message
    // }
    //
    // We preserve that interface while also exposing the new
    // normalized message through req.normalizedMessage.
    //
    // Once all adapters are standardized, the ingestion
    // controller can consume req.normalizedMessage directly.
    //
    // ========================================================

    req.body = {

      phone:
        normalizedPhone,

      message:
        normalizedMessage,

    };


    // ========================================================
    // 12. DEBUG INFORMATION
    // ========================================================

    console.log(
      "📱 SMS CHANNEL:",
      req.channel
    );

    console.log(
      "👤 SMS CUSTOMER:",
      req.channelCustomer
    );

    console.log(
      "📞 SMS RECEIVING NUMBER:",
      receivingNumber
    );

    console.log(
      "🆔 SMS MESSAGE ID:",
      messageId
    );

    console.log(
      "🧠 NORMALIZED SMS MESSAGE:"
    );

    console.dir(
      req.normalizedMessage,
      {
        depth: null,
      }
    );


    // ========================================================
    // 13. CONTINUE TO SHARED INGESTION PIPELINE
    // ========================================================

    console.log(
      "➡️ SMS ADAPTER → AI INGESTION"
    );

    next();

  } catch (error) {

    // ========================================================
    // ERROR HANDLING
    // ========================================================

    console.error(
      "❌ SMS adapter error:"
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

export default smsAdapter;