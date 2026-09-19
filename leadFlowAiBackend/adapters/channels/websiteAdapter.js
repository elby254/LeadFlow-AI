/**
 * ==========================================================
 * WEBSITE CHANNEL ADAPTER
 * ==========================================================
 *
 * LeadFlow AI
 *
 * Website Chat
 *       ↓
 * Website Channel Adapter
 *       ↓
 * Normalized LeadFlow request
 *       ↓
 * AI Ingestion Controller
 *
 * RESPONSIBILITY
 * ----------------------------------------------------------
 * This adapter is responsible ONLY for normalizing incoming
 * website chat messages.
 *
 * Website is an application-controlled channel, so its
 * incoming payload is already much simpler than provider
 * webhooks such as WhatsApp or Facebook.
 *
 * It does NOT:
 * ----------------------------------------------------------
 * ❌ Perform AI processing
 * ❌ Create or update leads
 * ❌ Calculate lead scores
 * ❌ Assign agents
 * ❌ Manage conversations
 * ❌ Generate AI replies
 * ❌ Perform AI qualification
 *
 * Those responsibilities belong to the shared LeadFlow AI
 * ingestion pipeline.
 *
 * ==========================================================
 */


/* ==========================================================
   WEBSITE ADAPTER
========================================================== */

export const websiteAdapter = (
  req,
  res,
  next
) => {

  try {

    // ========================================================
    // 1. RAW WEBSITE PAYLOAD
    // ========================================================

    const payload =
      req.body || {};


    console.log(
      "=================================================="
    );

    console.log(
      "🌐 WEBSITE CHANNEL ADAPTER"
    );

    console.log(
      "=================================================="
    );

    console.log(
      "📦 RAW WEBSITE PAYLOAD:"
    );

    console.dir(
      payload,
      {
        depth: null,
      }
    );


    // ========================================================
    // 2. EXTRACT CUSTOMER DATA
    // ========================================================

    const phone =
      payload?.phone;


    const message =
      payload?.message;


    // ========================================================
    // 3. VALIDATE WEBSITE MESSAGE
    // ========================================================

    if (
      !phone ||
      !message
    ) {

      console.error(
        "❌ Website message requires phone and message."
      );

      return res
        .status(400)
        .json({

          success: false,

          message:
            "Website message requires phone and message",

        });

    }


    // ========================================================
    // 4. NORMALIZE VALUES
    // ========================================================

    const normalizedPhone =
      String(
        phone
      ).trim();


    const normalizedMessage =
      String(
        message
      ).trim();


    if (
      !normalizedPhone ||
      !normalizedMessage
    ) {

      console.error(
        "❌ Website message contains an empty phone or message."
      );

      return res
        .status(400)
        .json({

          success: false,

          message:
            "Website message requires a valid phone and message",

        });

    }


    // ========================================================
    // 5. DETERMINE CUSTOMER NAME
    // ========================================================
    //
    // Website chat may be used by:
    //
    // - authenticated users
    // - anonymous visitors
    // - users whose profile is already available
    //
    // We therefore preserve the existing fallback order.
    //
    // ========================================================

    const customerName =
      req.user?.name ||
      req.customer?.name ||
      payload?.name ||
      null;


    // ========================================================
    // 6. EXTRACT OPTIONAL WEBSITE MESSAGE ID
    // ========================================================
    //
    // A website client may provide its own message identifier.
    //
    // This is optional because older website clients may not
    // send one.
    //
    // ========================================================

    const messageId =
      payload?.messageId ||
      payload?.id ||
      null;


    // ========================================================
    // 7. TRUSTED CHANNEL IDENTITY
    // ========================================================
    //
    // The server determines the channel.
    //
    // The customer does not control:
    //
    // source = "website"
    //
    // ========================================================

    req.source =
      "website";

    req.channel =
      "website";


    // ========================================================
    // 8. CUSTOMER INFORMATION
    // ========================================================

    req.channelCustomer = {

      name:
        customerName,

      phone:
        normalizedPhone,

      externalId:
        payload?.externalId ||
        null,

    };


    // ========================================================
    // 9. PROVIDER / CHANNEL METADATA
    // ========================================================
    //
    // Website does not have a third-party messaging provider
    // like WhatsApp or Africa's Talking.
    //
    // We therefore identify the provider as the LeadFlow
    // website application itself.
    //
    // ========================================================

    req.channelMetadata = {

      provider:
        "website",

      messageId:
        messageId,

      sessionId:
        payload?.sessionId ||
        null,

      conversationId:
        payload?.conversationId ||
        null,

    };


    // ========================================================
    // 10. NORMALIZED MESSAGE
    // ========================================================
    //
    // This is the standardized internal LeadFlow AI
    // representation.
    //
    // Everything downstream can use this structure without
    // knowing how the website request was originally shaped.
    //
    // ========================================================

    req.normalizedMessage = {

      channel:
        "website",

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
          payload?.externalId ||
          null,

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
          "website",

        messageId:
          messageId,

        sessionId:
          payload?.sessionId ||
          null,

        conversationId:
          payload?.conversationId ||
          null,

      },

    };


    // ========================================================
    // 11. BACKWARD-COMPATIBLE INGESTION BODY
    // ========================================================
    //
    // IMPORTANT:
    //
    // The current AI ingestion controller still supports the
    // simple:
    //
    // {
    //   phone,
    //   message
    // }
    //
    // interface.
    //
    // We preserve it while the adapters are being standardized.
    //
    // The standardized representation is available through:
    //
    // req.normalizedMessage
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
      "🌐 WEBSITE CHANNEL:",
      req.channel
    );

    console.log(
      "👤 WEBSITE CUSTOMER:",
      req.channelCustomer
    );

    console.log(
      "🆔 WEBSITE MESSAGE ID:",
      messageId
    );

    console.log(
      "🔐 WEBSITE SESSION ID:",
      payload?.sessionId ||
      null
    );

    console.log(
      "💬 WEBSITE CONVERSATION ID:",
      payload?.conversationId ||
      null
    );

    console.log(
      "🧠 NORMALIZED WEBSITE MESSAGE:"
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
      "➡️ WEBSITE ADAPTER → AI INGESTION"
    );

    next();

  } catch (error) {

    // ========================================================
    // ERROR HANDLING
    // ========================================================

    console.error(
      "❌ Website adapter error:"
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

export default websiteAdapter;