/**
 * ==========================================================
 *
 * WHATSAPP ORGANIZATION RESOLVER
 * LeadFlow AI
 *
 * ==========================================================
 *
 * PURPOSE
 * ----------------------------------------------------------
 *
 * Resolves an incoming WhatsApp Business webhook to the
 * correct LeadFlow AI organization.
 *
 *
 * ARCHITECTURE
 * ----------------------------------------------------------
 *
 * Customer
 *     ↓
 * WhatsApp
 *     ↓
 * Meta WhatsApp Business API
 *     ↓
 * phone_number_id
 *     ↓
 * organizationResolverService
 *     ↓
 * Organization
 *     ↓
 * organizationId
 *     ↓
 * Conversation
 *     ↓
 * Message
 *
 *
 * IMPORTANT
 * ----------------------------------------------------------
 *
 * The customer NEVER provides organizationId.
 *
 * The organization is determined from Meta's:
 *
 *     metadata.phone_number_id
 *
 * Organization resolution is centralized through:
 *
 *     services/organizationResolverService.js
 *
 * This file intentionally contains NO direct Organization
 * database queries.
 *
 * ==========================================================
 */

import {
  resolveByWhatsApp,
} from "../services/organizationResolverService.js";

/* ==========================================================
   NORMALIZE PHONE NUMBER ID
========================================================== */

/**
 * Meta provides phone_number_id as a string.
 *
 * We normalize it before passing it to the shared resolver.
 */
const normalizePhoneNumberId = (
  phoneNumberId
) => {

  if (
    phoneNumberId ===
      undefined ||
    phoneNumberId ===
      null
  ) {

    return null;

  }

  const normalized =
    String(
      phoneNumberId
    ).trim();

  return (
    normalized || null
  );
};

/* ==========================================================
   RESOLVE ORGANIZATION FROM PHONE NUMBER ID
========================================================== */

/**
 * Primary WhatsApp organization resolver.
 *
 * IMPORTANT
 * ----------------------------------------------------------
 *
 * Organization lookup is delegated to the shared:
 *
 *     resolveByWhatsApp()
 *
 * The shared resolver is responsible for checking the
 * organization's WhatsApp phone number ID and active/
 * enabled state.
 *
 * Example:
 *
 * const organization =
 *   await resolveOrganizationFromWhatsApp(
 *     phoneNumberId
 *   );
 */
export const resolveOrganizationFromWhatsApp =
  async (
    phoneNumberId
  ) => {

    console.log(
      "📱 Resolving WhatsApp organization:",
      phoneNumberId
    );

    /* ======================================================
       VALIDATE PHONE NUMBER ID
    ====================================================== */

    const normalizedPhoneNumberId =
      normalizePhoneNumberId(
        phoneNumberId
      );

    if (
      !normalizedPhoneNumberId
    ) {

      console.error(
        "❌ WhatsApp phoneNumberId is missing."
      );

      return null;

    }

    /* ======================================================
       SHARED ORGANIZATION RESOLUTION
    ====================================================== */

    const organization =
      await resolveByWhatsApp(
        normalizedPhoneNumberId
      );

    /* ======================================================
       ORGANIZATION NOT FOUND
    ====================================================== */

    if (
      !organization
    ) {

      console.error(
        "❌ No active LeadFlow AI organization found for WhatsApp phoneNumberId:",
        normalizedPhoneNumberId
      );

      return null;

    }

    /* ======================================================
       SUCCESS
    ====================================================== */

    console.log(
      "✅ WhatsApp organization resolved:",
      {

        organizationId:
          organization._id.toString(),

        organizationName:
          organization.name,

        whatsappPhoneNumberId:
          organization.whatsappPhoneNumberId,

        whatsappBusinessNumber:
          organization.whatsappBusinessNumber,

        isActive:
          organization.isActive,

      }
    );

    return organization;

  };

/* ==========================================================
   RESOLVE ORGANIZATION DIRECTLY FROM META WEBHOOK VALUE
========================================================== */

/**
 * Meta webhook:
 *
 * value.metadata.phone_number_id
 *
 * This helper extracts the ID and delegates to the primary
 * shared organization resolver.
 */
export const resolveWhatsAppOrganizationFromWebhook =
  async (
    value
  ) => {

    console.log(
      "📲 Resolving organization from WhatsApp webhook..."
    );

    /* ======================================================
       VALIDATE WEBHOOK VALUE
    ====================================================== */

    if (
      !value
    ) {

      console.error(
        "❌ WhatsApp webhook value is missing."
      );

      return null;

    }

    /* ======================================================
       EXTRACT META PHONE NUMBER ID
    ====================================================== */

    const phoneNumberId =
      value
        ?.metadata
        ?.phone_number_id;

    console.log(
      "📱 Meta phone_number_id:",
      phoneNumberId
    );

    /* ======================================================
       RESOLVE ORGANIZATION
    ====================================================== */

    const organization =
      await resolveOrganizationFromWhatsApp(
        phoneNumberId
      );

    if (
      !organization
    ) {

      console.error(
        "❌ Could not resolve WhatsApp organization from webhook."
      );

      return null;

    }

    return organization;

  };

/* ==========================================================
   REQUIRE WHATSAPP ORGANIZATION
========================================================== */

/**
 * This version throws when an organization cannot be found.
 *
 * Useful when the calling operation cannot continue without
 * a valid organization.
 */
export const requireWhatsAppOrganization =
  async (
    phoneNumberId
  ) => {

    const normalizedPhoneNumberId =
      normalizePhoneNumberId(
        phoneNumberId
      );

    const organization =
      await resolveOrganizationFromWhatsApp(
        normalizedPhoneNumberId
      );

    if (
      !organization
    ) {

      throw new Error(
        `No active LeadFlow AI organization is connected to WhatsApp phoneNumberId: ${normalizedPhoneNumberId || "unknown"}`
      );

    }

    return organization;

  };

/* ==========================================================
   REQUIRE ORGANIZATION FROM WEBHOOK
========================================================== */

/**
 * Convenience helper for webhook controllers.
 */
export const requireWhatsAppOrganizationFromWebhook =
  async (
    value
  ) => {

    const organization =
      await resolveWhatsAppOrganizationFromWebhook(
        value
      );

    if (
      !organization
    ) {

      const phoneNumberId =
        value
          ?.metadata
          ?.phone_number_id ||
        "unknown";

      throw new Error(
        `No active LeadFlow AI organization is connected to WhatsApp phoneNumberId: ${phoneNumberId}`
      );

    }

    return organization;

  };

/* ==========================================================
   DEFAULT EXPORT
========================================================== */

export default {

  resolveOrganizationFromWhatsApp,

  resolveWhatsAppOrganizationFromWebhook,

  requireWhatsAppOrganization,

  requireWhatsAppOrganizationFromWebhook,

};