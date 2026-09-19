/**
 * ==========================================================
 *
 * WHATSAPP WEBHOOK
 * LeadFlow AI
 *
 * ==========================================================
 *
 * RESPONSIBILITIES
 * ----------------------------------------------------------
 *
 * This file is responsible ONLY for WhatsApp / Meta
 * webhook verification.
 *
 * Incoming POST messages are handled by the channel
 * middleware architecture:
 *
 * WhatsApp
 *     ↓
 * whatsappRoutes
 *     ↓
 * whatsappAdapter
 *     ↓
 * channelOrganizationResolver
 *     ↓
 * aiIngestionController
 *
 *
 * IMPORTANT
 * ----------------------------------------------------------
 *
 * This file must NOT duplicate:
 *
 * - WhatsApp payload parsing
 * - customer normalization
 * - organization resolution
 * - AI ingestion
 *
 * Those responsibilities belong to the appropriate
 * channel/ingestion layers.
 *
 * ==========================================================
 */


// ==========================================================
// VERIFY WHATSAPP WEBHOOK
// ==========================================================
//
// Meta sends:
//
// GET /api/webhooks/whatsapp
//
// Query parameters:
//
// hub.mode
// hub.verify_token
// hub.challenge
//
// ==========================================================

export const verifyWhatsAppWebhook = (
  req,
  res
) => {

  try {

    const VERIFY_TOKEN =
      process.env.WHATSAPP_VERIFY_TOKEN;


    const mode =
      req.query["hub.mode"];

    const token =
      req.query["hub.verify_token"];

    const challenge =
      req.query["hub.challenge"];


    console.log(
      "=================================================="
    );

    console.log(
      "🔐 WHATSAPP WEBHOOK VERIFICATION"
    );

    console.log(
      "=================================================="
    );


    console.log(
      "Mode:",
      mode
    );

    console.log(
      "Token provided:",
      Boolean(token)
    );

    console.log(
      "Challenge provided:",
      Boolean(challenge)
    );


    // ======================================================
    // CHECK VERIFY TOKEN CONFIGURATION
    // ======================================================

    if (!VERIFY_TOKEN) {

      console.error(
        "❌ WHATSAPP_VERIFY_TOKEN is not configured."
      );

      return res
        .sendStatus(500);
    }


    // ======================================================
    // VALIDATE META VERIFICATION REQUEST
    // ======================================================

    if (
      mode === "subscribe" &&
      token === VERIFY_TOKEN
    ) {

      console.log(
        "✅ WHATSAPP WEBHOOK VERIFIED"
      );


      return res
        .status(200)
        .send(challenge);
    }


    // ======================================================
    // VERIFICATION FAILED
    // ======================================================

    console.error(
      "❌ WHATSAPP WEBHOOK VERIFICATION FAILED"
    );


    return res
      .sendStatus(403);

  } catch (error) {

    console.error(
      "❌ WHATSAPP VERIFICATION ERROR:",
      error
    );

    console.error(
      error?.stack
    );


    return res
      .sendStatus(500);
  }
};


// ==========================================================
// DEFAULT EXPORT
// ==========================================================

export default {
  verifyWhatsAppWebhook,
};