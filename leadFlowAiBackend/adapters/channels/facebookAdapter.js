/**
 * ==========================================================
 * FACEBOOK CHANNEL ADAPTER
 * ==========================================================
 *
 * LeadFlow AI
 *
 * Facebook / Messenger webhook
 *            ↓
 * Facebook Channel Adapter
 *            ↓
 * Normalized LeadFlow request
 *            ↓
 * AI Ingestion Controller
 *
 * RESPONSIBILITY
 * ----------------------------------------------------------
 * This adapter is responsible ONLY for Facebook/Messenger
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
 * ❌ Decide organization ownership
 *
 * Those responsibilities belong to the shared LeadFlow AI
 * ingestion pipeline.
 *
 * ==========================================================
 */

export const facebookAdapter = (
  req,
  res,
  next
) => {

  try {

    // ========================================================
    // 1. RAW FACEBOOK PAYLOAD
    // ========================================================

    const payload =
      req.body || {};


    console.log(
      "=================================================="
    );

    console.log(
      "📩 FACEBOOK CHANNEL ADAPTER"
    );

    console.log(
      "=================================================="
    );

    console.log(
      "📦 RAW FACEBOOK PAYLOAD:"
    );

    console.dir(
      payload,
      {
        depth: null,
      }
    );


    // ========================================================
    // 2. EXTRACT FACEBOOK EVENT
    // ========================================================

    const event =
      payload
        ?.entry?.[0]
        ?.messaging?.[0];


    // ========================================================
    // 3. EXTRACT CUSTOMER ID
    // ========================================================

    const senderId =
      event
        ?.sender?.id;


    // ========================================================
    // 4. EXTRACT MESSAGE TEXT
    // ========================================================

    const message =
      event
        ?.message?.text;


    // ========================================================
    // 5. EXTRACT FACEBOOK PAGE ID
    // ========================================================

    const pageId =
      event
        ?.recipient?.id;


    // ========================================================
    // 6. EXTRACT FACEBOOK MESSAGE ID
    // ========================================================

    const messageId =
      event
        ?.message?.mid;


    // ========================================================
    // 7. IGNORE NON-MESSAGE EVENTS
    // ========================================================
    //
    // Facebook can send events that are not normal customer
    // text messages.
    //
    // Examples:
    //
    // - delivery events
    // - read events
    // - postbacks
    // - reactions
    // - unsupported message types
    //
    // These should not enter AI ingestion.
    //
    // ========================================================

    if (
      !senderId ||
      !message
    ) {

      console.log(
        "ℹ️ Facebook event ignored — no customer text message."
      );

      return res
        .status(200)
        .json({
          success: true,
          ignored: true,
        });

    }


    // ========================================================
    // 8. TRUSTED CHANNEL IDENTITY
    // ========================================================
    //
    // The adapter determines the channel.
    //
    // The customer must NOT be allowed to submit:
    //
    // {
    //   source: "facebook"
    // }
    //
    // themselves.
    //
    // ========================================================

    req.source =
      "facebook";

    req.channel =
      "facebook";


    // ========================================================
    // 9. CUSTOMER INFORMATION
    // ========================================================
    //
    // Messenger normally gives us the Facebook sender ID,
    // rather than a phone number.
    //
    // Therefore:
    //
    // phone      → null
    // name       → null
    // externalId → Facebook sender ID
    //
    // A later customer/profile lookup can enrich the record.
    //
    // ========================================================

    req.channelCustomer = {

      name:
        null,

      phone:
        null,

      externalId:
        senderId,

    };


    // ========================================================
    // 10. PROVIDER METADATA
    // ========================================================
    //
    // Keep Facebook-specific information outside the generic
    // customer/message fields.
    //
    // ========================================================

    req.channelMetadata = {

      provider:
        "facebook",

      senderId,

      pageId,

      messageId,

    };


    // ========================================================
    // 11. NORMALIZED MESSAGE
    // ========================================================
    //
    // IMPORTANT:
    //
    // This follows the same LeadFlow AI internal contract
    // used by WhatsApp:
    //
    // {
    //   channel,
    //   organizationId,
    //   customer,
    //   message,
    //   metadata
    // }
    //
    // Facebook-specific information remains inside metadata.
    //
    // ========================================================

    req.normalizedMessage = {

      channel:
        "facebook",

      organizationId:
        req.organizationId ||
        req.organization?._id ||
        req.user?.organizationId ||
        null,

      customer: {

        name:
          null,

        phone:
          null,

        externalId:
          senderId,

      },

      message: {

        text:
          String(message).trim(),

        type:
          "text",

        externalMessageId:
          messageId ||
          null,

      },

      metadata: {

        provider:
          "facebook",

        senderId,

        pageId,

        messageId:
          messageId ||
          null,

      },

    };


    // ========================================================
    // 12. BACKWARD-COMPATIBLE INGESTION BODY
    // ========================================================
    //
    // The current AI ingestion controller expects the
    // customer-facing message in req.body.
    //
    // We therefore preserve that interface while introducing
    // req.normalizedMessage as the standardized internal
    // representation.
    //
    // DO NOT REMOVE THIS YET.
    //
    // We will update aiIngestionController.js after all channel
    // adapters have been standardized.
    //
    // ========================================================

    req.body = {

      phone:
        null,

      message:
        String(message).trim(),

    };


    // ========================================================
    // 13. DEBUG LOG
    // ========================================================

    console.log(
      "📱 FACEBOOK CHANNEL:",
      req.channel
    );

    console.log(
      "👤 FACEBOOK CUSTOMER:",
      req.channelCustomer
    );

    console.log(
      "🆔 FACEBOOK PAGE ID:",
      pageId
    );

    console.log(
      "🆔 FACEBOOK MESSAGE ID:",
      messageId
    );

    console.log(
      "🧠 NORMALIZED FACEBOOK MESSAGE:"
    );

    console.dir(
      req.normalizedMessage,
      {
        depth: null,
      }
    );


    // ========================================================
    // 14. CONTINUE TO SHARED INGESTION PIPELINE
    // ========================================================

    console.log(
      "➡️ FACEBOOK ADAPTER → AI INGESTION"
    );

    next();

  } catch (error) {

    // ========================================================
    // ERROR HANDLING
    // ========================================================

    console.error(
      "❌ Facebook adapter error:"
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

export default facebookAdapter;