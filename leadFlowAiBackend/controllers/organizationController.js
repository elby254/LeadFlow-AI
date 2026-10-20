/**
 * ==========================================================
 * ORGANIZATION CONTROLLER
 * LeadFlow AI
 * ==========================================================
 *
 * PURPOSE
 * ----------------------------------------------------------
 * Handles organization-level configuration.
 *
 * Current responsibilities:
 *
 * ✓ Read WhatsApp configuration
 * ✓ Update WhatsApp configuration
 * ✓ Enforce organization ownership through authenticated user
 * ✓ Prevent clients from choosing organizationId
 * ✓ Prevent arbitrary Organization fields from being updated
 *
 * IMPORTANT
 * ----------------------------------------------------------
 *
 * organizationId is NEVER accepted from req.body.
 *
 * The authenticated user's organizationId is authoritative.
 *
 * Organization resolution is centralized through:
 *
 * organizationResolverService.js
 *
 * WhatsApp configuration belongs to the Organization document.
 *
 * ==========================================================
 */

import Organization from "../models/organization.js";

import {
  resolveFromRequest,
  resolveByWhatsApp,
} from "../services/organizationResolverService.js";

/* ==========================================================
   HELPERS
========================================================== */

/**
 * Resolve the authenticated organization.
 *
 * IMPORTANT
 * ----------------------------------------------------------
 *
 * Organization resolution is centralized through the shared
 * organizationResolverService.
 *
 * We intentionally do NOT trust:
 *
 * req.body.organizationId
 * req.params.organizationId
 * req.query.organizationId
 *
 * The authenticated request context is authoritative.
 */
const getAuthenticatedOrganization =
  async (req) => {
    return resolveFromRequest(req);
  };

/**
 * Normalize optional string values.
 */
const normalizeString = (value) => {
  if (
    value === undefined ||
    value === null
  ) {
    return "";
  }

  return String(value).trim();
};

/**
 * Return only WhatsApp configuration.
 *
 * Never expose the complete Organization document
 * through this endpoint.
 */
const serializeWhatsAppConfig = (
  organization
) => {
  return {
    organizationId:
      organization._id,

    organizationName:
      organization.name,

    whatsapp: {
      whatsappPhoneNumberId:
        organization.whatsappPhoneNumberId || "",

      whatsappBusinessNumber:
        organization.whatsappBusinessNumber || "",

      whatsappBusinessAccountId:
        organization.whatsappBusinessAccountId || "",

      whatsappDisplayName:
        organization.whatsappDisplayName || "",

      whatsappEnabled:
        Boolean(
          organization.whatsappEnabled
        ),
    },
  };
};

/* ==========================================================
   GET WHATSAPP CONFIGURATION
========================================================== */

/**
 * GET
 * /api/organizations/whatsapp
 *
 * Returns the authenticated organization's
 * WhatsApp configuration.
 */
export const getWhatsAppConfiguration =
  async (req, res) => {
    try {
      /* ====================================================
         RESOLVE AUTHENTICATED ORGANIZATION
      ==================================================== */

      const organization =
        await getAuthenticatedOrganization(
          req
        );

      if (!organization) {
        return res.status(403).json({
          success: false,
          message:
            "Authenticated organization is required",
        });
      }

      /* ====================================================
         RETURN SAFE WHATSAPP CONFIGURATION
      ==================================================== */

      return res.status(200).json({
        success: true,
        data:
          serializeWhatsAppConfig(
            organization
          ),
      });
    } catch (error) {
      console.error(
        "❌ GET WHATSAPP CONFIGURATION ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to retrieve WhatsApp configuration",
      });
    }
  };

/* ==========================================================
   UPDATE WHATSAPP CONFIGURATION
========================================================== */

/**
 * PUT
 * /api/organizations/whatsapp
 *
 * Allowed fields ONLY:
 *
 * - whatsappPhoneNumberId
 * - whatsappBusinessNumber
 * - whatsappBusinessAccountId
 * - whatsappDisplayName
 * - whatsappEnabled
 *
 * organizationId from the client is ignored.
 */
export const updateWhatsAppConfiguration =
  async (req, res) => {
    try {
      /* ====================================================
         RESOLVE AUTHENTICATED ORGANIZATION
      ==================================================== */

      const organization =
        await getAuthenticatedOrganization(
          req
        );

      if (!organization) {
        return res.status(403).json({
          success: false,
          message:
            "Authenticated organization is required",
        });
      }

      const organizationId =
        organization._id;

      /* ====================================================
         EXTRACT ONLY ALLOWED FIELDS
      ==================================================== */

      const {
        whatsappPhoneNumberId,
        whatsappBusinessNumber,
        whatsappBusinessAccountId,
        whatsappDisplayName,
        whatsappEnabled,
      } = req.body || {};

      /* ====================================================
         NORMALIZE VALUES
      ==================================================== */

      const normalizedPhoneNumberId =
        normalizeString(
          whatsappPhoneNumberId
        );

      const normalizedBusinessNumber =
        normalizeString(
          whatsappBusinessNumber
        );

      const normalizedBusinessAccountId =
        normalizeString(
          whatsappBusinessAccountId
        );

      const normalizedDisplayName =
        normalizeString(
          whatsappDisplayName
        );

      const normalizedEnabled =
        Boolean(whatsappEnabled);

      /* ====================================================
         ENABLED REQUIRES PHONE NUMBER ID
      ==================================================== */

      if (
        normalizedEnabled &&
        !normalizedPhoneNumberId
      ) {
        return res.status(400).json({
          success: false,
          message:
            "whatsappPhoneNumberId is required when WhatsApp is enabled",
        });
      }

      /* ====================================================
         CHECK PHONE NUMBER ID OWNERSHIP
      ====================================================
      
      Organization resolution is centralized through
      organizationResolverService.js.
      
      The shared resolver checks whether the supplied
      WhatsApp phone_number_id already belongs to an
      active/enabled LeadFlow AI organization.
      
      If it resolves to the same organization, that is
      allowed.
      
      If it resolves to another organization, return
      a conflict response.
      
      The Organization schema's unique sparse index
      remains the final database-level protection.
      ==================================================== */

      if (normalizedPhoneNumberId) {
        const existingOrganization =
          await resolveByWhatsApp(
            normalizedPhoneNumberId
          );

        if (
          existingOrganization &&
          existingOrganization._id.toString() !==
            organizationId.toString()
        ) {
          return res.status(409).json({
            success: false,
            message:
              "This WhatsApp phone number ID is already connected to another organization",
          });
        }
      }

      /* ====================================================
         BUILD SAFE UPDATE
      ==================================================== */

      const updates = {
        whatsappPhoneNumberId:
          normalizedPhoneNumberId,

        whatsappBusinessNumber:
          normalizedBusinessNumber,

        whatsappBusinessAccountId:
          normalizedBusinessAccountId,

        whatsappDisplayName:
          normalizedDisplayName,

        whatsappEnabled:
          normalizedEnabled,
      };

      /* ====================================================
         UPDATE ORGANIZATION
      ==================================================== */

      const updatedOrganization =
        await Organization.findByIdAndUpdate(
          organizationId,
          {
            $set: updates,
          },
          {
            returnDocument: 'after',
            runValidators: true,
          }
        ).select(
          [
            "_id",
            "name",
            "whatsappPhoneNumberId",
            "whatsappBusinessNumber",
            "whatsappBusinessAccountId",
            "whatsappDisplayName",
            "whatsappEnabled",
          ].join(" ")
        );

      if (!updatedOrganization) {
        return res.status(404).json({
          success: false,
          message:
            "Organization not found",
        });
      }

      /* ====================================================
         SUCCESS LOG
      ==================================================== */

      console.log(
        "✅ WhatsApp organization configuration updated:",
        {
          organizationId:
            updatedOrganization._id.toString(),

          organizationName:
            updatedOrganization.name,

          whatsappPhoneNumberId:
            updatedOrganization.whatsappPhoneNumberId,

          whatsappEnabled:
            updatedOrganization.whatsappEnabled,
        }
      );

      /* ====================================================
         RESPONSE
      ==================================================== */

      return res.status(200).json({
        success: true,
        message:
          "WhatsApp configuration updated successfully",

        data:
          serializeWhatsAppConfig(
            updatedOrganization
          ),
      });
    } catch (error) {
      /* ====================================================
         HANDLE MONGOOSE DUPLICATE KEY
      ==================================================== */

      if (
        error?.code === 11000
      ) {
        return res.status(409).json({
          success: false,
          message:
            "This WhatsApp phone number ID is already connected to another organization",
        });
      }

      console.error(
        "❌ UPDATE WHATSAPP CONFIGURATION ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to update WhatsApp configuration",
      });
    }
  };

/* ==========================================================
   EXPORT
========================================================== */

export default {
  getWhatsAppConfiguration,
  updateWhatsAppConfiguration,
};