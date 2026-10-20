/**
 * ==========================================================
 *
 * CHANNEL ORGANIZATION RESOLVER
 * LeadFlow AI
 *
 * ==========================================================
 *
 * PURPOSE
 * ----------------------------------------------------------
 * Resolves the LeadFlow AI organization from trusted
 * channel/provider metadata.
 *
 * IMPORTANT
 * ----------------------------------------------------------
 *
 * Organization resolution is centralized through:
 *
 * services/organizationResolverService.js
 *
 * This middleware MUST NOT independently query the
 * Organization model.
 *
 * Organization must NEVER be selected from:
 *
 * req.body.organizationId
 *
 * The organization is resolved from trusted provider
 * metadata or authenticated server-side context.
 *
 * ==========================================================
 */

import {
  resolveByWhatsApp,
  resolveFromRequest,
} from "../services/organizationResolverService.js";

/* ==========================================================
   CHANNEL ORGANIZATION RESOLVER
========================================================== */

export const resolveChannelOrganization =
  async (
    req,
    res,
    next
  ) => {

    try {

      const source =
        req.source;

      /* ====================================================
         SOURCE VALIDATION
      ==================================================== */

      if (!source) {

        return res.status(400).json({
          success: false,

          message:
            "Trusted channel source is required",
        });

      }

      let organization = null;

      /* ====================================================
         WHATSAPP
      ==================================================== */

      if (
        source === "whatsapp"
      ) {

        const phoneNumberId =
          req.channelMetadata
            ?.phoneNumberId;

        console.log(
          "\n=========================================================="
        );

        console.log(
          "🏢 WHATSAPP ORGANIZATION RESOLUTION"
        );

        console.log(
          "=========================================================="
        );

        console.log(
          "📱 WhatsApp Phone Number ID:",
          phoneNumberId
        );

        /* ----------------------------------------------------
           META PHONE NUMBER ID IS REQUIRED
        ---------------------------------------------------- */

        if (!phoneNumberId) {

          console.error(
            "❌ WhatsApp phone number ID is missing."
          );

          return res.status(400).json({
            success: false,

            message:
              "WhatsApp phone number ID is missing",
          });

        }

        /* ----------------------------------------------------
           SHARED ORGANIZATION RESOLUTION
        ----------------------------------------------------

        Organization resolution is centralized through:

        resolveByWhatsApp()

        The resolver is responsible for checking:

        - whatsappPhoneNumberId
        - whatsappEnabled
        - isActive

        Do NOT perform Organization.findOne() here.
        ---------------------------------------------------- */

        organization =
          await resolveByWhatsApp(
            phoneNumberId
          );

        console.log(
          "🏢 Organization resolved:",
          organization
            ? organization._id
            : null
        );

        console.log(
          "🏷️ Organization name:",
          organization
            ? organization.name
            : null
        );

        console.log(
          "=========================================================="
        );

      }

      /* ====================================================
         WEBSITE
      ==================================================== */

      /**
       * Website organization resolution is intentionally
       * delegated to the shared organization resolver.
       *
       * The resolver uses trusted authenticated/server-side
       * organization context.
       *
       * DO NOT use:
       *
       * req.body.organizationId
       *
       * req.params.organizationId
       *
       * req.query.organizationId
       */

      if (
        source === "website"
      ) {

        organization =
          await resolveFromRequest(
            req
          );

      }

      /* ====================================================
         FACEBOOK
      ==================================================== */

      /**
       * Facebook requires a trusted Page ID →
       * Organization mapping.
       *
       * The current Organization schema does not yet contain
       * a dedicated Facebook Page ID field.
       *
       * Therefore we intentionally do not invent a lookup
       * field here.
       */

      if (
        source === "facebook"
      ) {

        const pageId =
          req.channelMetadata
            ?.pageId;

        if (!pageId) {

          return res.status(400).json({
            success: false,

            message:
              "Facebook page ID is missing",
          });

        }

        console.warn(
          "⚠️ Facebook organization mapping is not configured.",
          {
            pageId,
          }
        );

      }

      /* ====================================================
         SMS
      ==================================================== */

      /**
       * SMS requires a trusted receiving/business number
       * or provider account mapping.
       *
       * The current Organization schema does not yet contain
       * a dedicated SMS configuration field.
       *
       * Therefore we intentionally do not invent a lookup
       * field here.
       */

      if (
        source === "sms"
      ) {

        const receivingNumber =
          req.channelMetadata
            ?.receivingNumber;

        if (
          !receivingNumber
        ) {

          return res.status(400).json({
            success: false,

            message:
              "SMS receiving number is missing",
          });

        }

        console.warn(
          "⚠️ SMS organization mapping is not configured.",
          {
            receivingNumber,
          }
        );

      }

      /* ====================================================
         FINAL ORGANIZATION VALIDATION
      ==================================================== */

      if (
        !organization
      ) {

        console.error(
          "❌ Unable to resolve organization for channel.",
          {
            source,
          }
        );

        return res.status(404).json({
          success: false,

          message:
            "Unable to resolve organization for channel",

          source,
        });

      }

      /* ====================================================
         TRUSTED ORGANIZATION CONTEXT
      ==================================================== */

      req.organization =
        organization;

      req.organizationId =
        organization._id;

      console.log(
        "\n=========================================================="
      );

      console.log(
        "✅ CHANNEL ORGANIZATION RESOLVED"
      );

      console.log({
        source,

        organizationId:
          organization._id,

        organizationName:
          organization.name,
      });

      console.log(
        "==========================================================\n"
      );

      /* ====================================================
         CONTINUE
      ==================================================== */

      next();

    } catch (
      error
    ) {

      console.error(
        "❌ Channel organization resolution error:",
        error
      );

      next(error);

    }

  };

/* ==========================================================
   EXPORT
========================================================== */

export default resolveChannelOrganization;