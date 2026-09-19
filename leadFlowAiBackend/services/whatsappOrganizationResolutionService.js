/**
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
 * This service
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
 * This prevents one organization's WhatsApp messages from
 * being accidentally assigned to another organization.
 *
 * ==========================================================
 */

import Organization from "../models/organization.js";


// ==========================================================
// NORMALIZE PHONE NUMBER ID
// ==========================================================
//
// Meta provides phone_number_id as a string.
//
// We normalize it before querying MongoDB.
//
// ==========================================================

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
    String(phoneNumberId).trim();

  return normalized || null;
};


// ==========================================================
// RESOLVE ORGANIZATION FROM PHONE NUMBER ID
// ==========================================================
//
// Primary resolver.
//
// Example:
//
// const organization =
//   await resolveOrganizationFromWhatsApp(
//     phoneNumberId
//   );
//
// ==========================================================

export const resolveOrganizationFromWhatsApp =
  async (
    phoneNumberId
  ) => {

    console.log(
      "📱 Resolving WhatsApp organization:",
      phoneNumberId
    );


    // ========================================================
    // VALIDATE PHONE NUMBER ID
    // ========================================================

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


    // ========================================================
    // FIND ORGANIZATION
    // ========================================================
    //
    // IMPORTANT:
    //
    // The updated Organization model uses:
    //
    // whatsappPhoneNumberId
    //
    // and:
    //
    // whatsappBusinessNumber
    //
    // We do NOT use the generic organization.phone field.
    //
    // ========================================================

    const organization =
      await Organization.findOne({

        whatsappPhoneNumberId:
          normalizedPhoneNumberId,

        isActive:
          true,

      });


    // ========================================================
    // ORGANIZATION NOT FOUND
    // ========================================================

    if (
      !organization
    ) {

      console.error(
        "❌ No active LeadFlow AI organization found for WhatsApp phoneNumberId:",
        normalizedPhoneNumberId
      );

      return null;
    }


    // ========================================================
    // SUCCESS
    // ========================================================

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


// ==========================================================
// RESOLVE ORGANIZATION DIRECTLY FROM META WEBHOOK VALUE
// ==========================================================
//
// Meta webhook:
//
// value.metadata.phone_number_id
//
// This helper extracts the ID and delegates to the primary
// resolver.
//
// ==========================================================

export const resolveWhatsAppOrganizationFromWebhook =
  async (
    value
  ) => {

    console.log(
      "📲 Resolving organization from WhatsApp webhook..."
    );


    // ========================================================
    // VALIDATE WEBHOOK VALUE
    // ========================================================

    if (
      !value
    ) {

      console.error(
        "❌ WhatsApp webhook value is missing."
      );

      return null;
    }


    // ========================================================
    // EXTRACT META PHONE NUMBER ID
    // ========================================================

    const phoneNumberId =
      value?.metadata?.phone_number_id;


    console.log(
      "📱 Meta phone_number_id:",
      phoneNumberId
    );


    // ========================================================
    // RESOLVE ORGANIZATION
    // ========================================================

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


// ==========================================================
// REQUIRE WHATSAPP ORGANIZATION
// ==========================================================
//
// This version throws when an organization cannot be found.
//
// Useful when the calling operation cannot continue without
// a valid organization.
//
// ==========================================================

export const requireWhatsAppOrganization =
  async (
    phoneNumberId
  ) => {

    const organization =
      await resolveOrganizationFromWhatsApp(
        phoneNumberId
      );


    if (
      !organization
    ) {

      throw new Error(
        `No active LeadFlow AI organization is connected to WhatsApp phoneNumberId: ${phoneNumberId}`
      );
    }


    return organization;
  };


// ==========================================================
// REQUIRE ORGANIZATION FROM WEBHOOK
// ==========================================================
//
// Convenience helper for webhook controllers.
//
// ==========================================================

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
        value?.metadata?.phone_number_id ||
        "unknown";


      throw new Error(
        `No active LeadFlow AI organization is connected to WhatsApp phoneNumberId: ${phoneNumberId}`
      );
    }


    return organization;
  };


// ==========================================================
// DEFAULT EXPORT
// ==========================================================

export default {

  resolveOrganizationFromWhatsApp,

  resolveWhatsAppOrganizationFromWebhook,

  requireWhatsAppOrganization,

  requireWhatsAppOrganizationFromWebhook,

};