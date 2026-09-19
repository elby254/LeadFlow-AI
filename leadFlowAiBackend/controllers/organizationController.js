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
 * WhatsApp configuration belongs to the Organization document.
 *
 * ==========================================================
 */

import Organization from "../models/organization.js";

/* ==========================================================
   HELPERS
========================================================== */

/**
 * Get the authenticated organization's ID.
 *
 * The authentication middleware already attaches:
 *
 * req.user.organizationId
 *
 * We intentionally do NOT trust:
 *
 * req.body.organizationId
 * req.params.organizationId
 * req.query.organizationId
 */
const getAuthenticatedOrganizationId = (req) => {
  return (
    req.user?.organizationId ||
    req.organizationId ||
    null
  );
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
      const organizationId =
        getAuthenticatedOrganizationId(req);

      if (!organizationId) {
        return res.status(403).json({
          success: false,
          message:
            "Authenticated organization is required",
        });
      }

      const organization =
        await Organization.findById(
          organizationId
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

      if (!organization) {
        return res.status(404).json({
          success: false,
          message:
            "Organization not found",
        });
      }

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
      const organizationId =
        getAuthenticatedOrganizationId(req);

      if (!organizationId) {
        return res.status(403).json({
          success: false,
          message:
            "Authenticated organization is required",
        });
      }

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
      
      A Meta phone_number_id must belong to only one
      LeadFlow AI organization.
      
      The Organization model also has a unique sparse
      index, but we perform an explicit check so the API
      can return a useful conflict response.
      */

      if (normalizedPhoneNumberId) {
        const existingOrganization =
          await Organization.findOne({
            whatsappPhoneNumberId:
              normalizedPhoneNumberId,

            _id: {
              $ne: organizationId,
            },
          }).select("_id name");

        if (existingOrganization) {
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

      const organization =
        await Organization.findByIdAndUpdate(
          organizationId,
          {
            $set: updates,
          },
          {
            new: true,
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

      if (!organization) {
        return res.status(404).json({
          success: false,
          message:
            "Organization not found",
        });
      }

      console.log(
        "✅ WhatsApp organization configuration updated:",
        {
          organizationId:
            organization._id.toString(),

          organizationName:
            organization.name,

          whatsappPhoneNumberId:
            organization.whatsappPhoneNumberId,

          whatsappEnabled:
            organization.whatsappEnabled,
        }
      );

      return res.status(200).json({
        success: true,
        message:
          "WhatsApp configuration updated successfully",

        data:
          serializeWhatsAppConfig(
            organization
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