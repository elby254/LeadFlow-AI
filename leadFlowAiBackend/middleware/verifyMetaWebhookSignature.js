import {
  createHmac,
  timingSafeEqual,
} from "node:crypto";

/**
 * ==========================================================
 * META WEBHOOK SIGNATURE VERIFICATION
 * ==========================================================
 *
 * Protects the WhatsApp POST webhook by validating
 * X-Hub-Signature-256 against the original request-body bytes.
 *
 * Required environment variable:
 *
 * META_APP_SECRET
 *
 * IMPORTANT:
 * - This is the Meta application secret, NOT the webhook
 *   verification token.
 * - Never log the app secret or received signature.
 * - Never process a WhatsApp POST without successful
 *   signature verification.
 * ==========================================================
 */

const verifyMetaWebhookSignature = (
  req,
  res,
  next
) => {
  try {
    const appSecret =
      process.env.META_APP_SECRET;

    if (
      typeof appSecret !== "string" ||
      appSecret.length === 0
    ) {
      console.error(
        "META_WEBHOOK_SIGNATURE_CONFIGURATION_ERROR: " +
        "META_APP_SECRET is not configured."
      );

      return res.status(503).json({
        success: false,
        message:
          "Webhook signature verification is not configured.",
      });
    }

    const signature =
      req.get("X-Hub-Signature-256");

    if (
      typeof signature !== "string" ||
      !/^sha256=[a-f0-9]{64}$/i.test(signature)
    ) {
      return res.status(401).json({
        success: false,
        message: "Invalid webhook signature.",
      });
    }

    if (!Buffer.isBuffer(req.rawBody)) {
      console.error(
        "META_WEBHOOK_SIGNATURE_ERROR: " +
        "Original request body is unavailable."
      );

      return res.status(400).json({
        success: false,
        message:
          "Unable to verify webhook request.",
      });
    }

    const receivedSignature =
      Buffer.from(
        signature.slice("sha256=".length),
        "hex"
      );

    const expectedSignature =
      createHmac(
        "sha256",
        appSecret
      )
        .update(req.rawBody)
        .digest();

    if (
  receivedSignature.length !==
    expectedSignature.length ||
  !timingSafeEqual(
    receivedSignature,
    expectedSignature
  )
) {
      return res.status(401).json({
        success: false,
        message: "Invalid webhook signature.",
      });
    }

    return next();

  } catch (error) {
    console.error(
      "META_WEBHOOK_SIGNATURE_VERIFICATION_ERROR:",
      error?.message || "Unknown error"
    );

    return res.status(500).json({
      success: false,
      message:
        "Webhook signature verification failed.",
    });
  }
};

export default verifyMetaWebhookSignature;