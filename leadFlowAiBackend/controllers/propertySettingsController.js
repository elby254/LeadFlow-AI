/**
 *
 * LeadFlow AI
 *
 * Endpoints
 * ----------------------------------------------------------
 * GET /api/properties/settings
 * PUT /api/properties/settings
 *
 * Purpose
 * ----------------------------------------------------------
 * Provides organization-level Property Management settings.
 *
 * Organization isolation
 * ----------------------------------------------------------
 * organizationId is NEVER accepted from the frontend.
 *
 * It is obtained from the authenticated user:
 *
 * req.user.organizationId
 *
 * This prevents one organization from reading or modifying
 * another organization's property settings.
 *
 * ==========================================================
 */

import mongoose from "mongoose";

import PropertySettings from "../models/propertySettings.js";


/* ==========================================================
   HELPER
========================================================== */

/**
 * Get the organization ID from the authenticated request.
 *
 * The authentication middleware is expected to populate:
 *
 * req.user = {
 *   id,
 *   organizationId,
 *   role,
 *   ...
 * }
 */
const getOrganizationId = (req) => {

  return (
    req.user?.organizationId ??
    req.user?.organization?._id ??
    req.user?.organization?.id ??
    null
  );

};


/* ==========================================================
   GET PROPERTY SETTINGS
========================================================== */

/**
 * GET
 * /api/properties/settings
 *
 * Returns the PropertySettings document belonging to the
 * authenticated user's organization.
 *
 * If settings do not exist yet, default settings are created.
 */
export const getPropertySettings = async (
  req,
  res
) => {

  try {

    console.log(
      "[PROPERTY SETTINGS] GET request received"
    );

    console.log(
      "[PROPERTY SETTINGS] Authenticated user:",
      {
        id: req.user?.id,
        organizationId: req.user?.organizationId,
        role: req.user?.role,
      }
    );


    /* ------------------------------------------------------
       ORGANIZATION
    ------------------------------------------------------ */

    const organizationId =
      getOrganizationId(req);


    if (!organizationId) {

      console.error(
        "[PROPERTY SETTINGS] Missing organizationId"
      );

      return res.status(401).json({

        success: false,

        message:
          "Authenticated organization could not be determined.",

      });

    }


    /* ------------------------------------------------------
       VALIDATE OBJECT ID
    ------------------------------------------------------ */

    if (
      !mongoose.Types.ObjectId.isValid(
        organizationId
      )
    ) {

      console.error(
        "[PROPERTY SETTINGS] Invalid organizationId:",
        organizationId
      );

      return res.status(400).json({

        success: false,

        message:
          "Invalid organization identifier.",

      });

    }


    /* ------------------------------------------------------
       GET OR CREATE SETTINGS
    ------------------------------------------------------ */

    const settings =
      await PropertySettings.getOrCreate(
        organizationId,
        req.user?.id ?? null
      );


    console.log(
      "[PROPERTY SETTINGS] Settings loaded:",
      settings._id.toString()
    );


    /* ------------------------------------------------------
       RESPONSE
    ------------------------------------------------------ */

    return res.status(200).json({

      success: true,

      data: settings,

    });

  } catch (error) {

    console.error(
      "[PROPERTY SETTINGS] GET ERROR:",
      error
    );

    return res.status(500).json({

      success: false,

      message:
        "Unable to load property settings.",

      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : undefined,

    });

  }

};


/* ==========================================================
   UPDATE PROPERTY SETTINGS
========================================================== */

/**
 * PUT
 * /api/properties/settings
 *
 * Updates settings belonging to the authenticated user's
 * organization.
 *
 * Example body:
 *
 * {
 *   "general": {
 *     "defaultStatus": "available"
 *   },
 *   "aiRecommendations": {
 *     "enabled": true
 *   }
 * }
 *
 * organizationId MUST NOT be supplied by the frontend.
 */
export const updatePropertySettings = async (
  req,
  res
) => {

  try {

    console.log(
      "[PROPERTY SETTINGS] PUT request received"
    );

    console.log(
      "[PROPERTY SETTINGS] Authenticated user:",
      {
        id: req.user?.id,
        organizationId: req.user?.organizationId,
        role: req.user?.role,
      }
    );


    /* ------------------------------------------------------
       ORGANIZATION
    ------------------------------------------------------ */

    const organizationId =
      getOrganizationId(req);


    if (!organizationId) {

      console.error(
        "[PROPERTY SETTINGS] Missing organizationId"
      );

      return res.status(401).json({

        success: false,

        message:
          "Authenticated organization could not be determined.",

      });

    }


    /* ------------------------------------------------------
       VALIDATE OBJECT ID
    ------------------------------------------------------ */

    if (
      !mongoose.Types.ObjectId.isValid(
        organizationId
      )
    ) {

      return res.status(400).json({

        success: false,

        message:
          "Invalid organization identifier.",

      });

    }


    /* ------------------------------------------------------
       VALIDATE BODY
    ------------------------------------------------------ */

    if (
      !req.body ||
      typeof req.body !== "object" ||
      Array.isArray(req.body)
    ) {

      return res.status(400).json({

        success: false,

        message:
          "Settings payload must be an object.",

      });

    }


    /* ------------------------------------------------------
       PROTECT ORGANIZATION OWNERSHIP
    ------------------------------------------------------ */

    const updates = {
      ...req.body,
    };


    /*
     * These fields must never be controlled by the client.
     *
     * PropertySettings.updateSettings() also protects them,
     * but we remove them here as a second security boundary.
     */

    delete updates.organizationId;

    delete updates._id;

    delete updates.createdAt;

    delete updates.updatedAt;

    delete updates.createdBy;

    delete updates.updatedBy;


    /* ------------------------------------------------------
       GET OR CREATE SETTINGS
    ------------------------------------------------------ */

    const settings =
      await PropertySettings.getOrCreate(
        organizationId,
        req.user?.id ?? null
      );


    /* ------------------------------------------------------
       UPDATE SETTINGS
    ------------------------------------------------------ */

    await settings.updateSettings(
      updates,
      req.user?.id ?? null
    );


    console.log(
      "[PROPERTY SETTINGS] Settings updated:",
      settings._id.toString()
    );


    /* ------------------------------------------------------
       RESPONSE
    ------------------------------------------------------ */

    return res.status(200).json({

      success: true,

      message:
        "Property settings updated successfully.",

      data: settings,

    });

  } catch (error) {

    console.error(
      "[PROPERTY SETTINGS] PUT ERROR:",
      error
    );


    /* ------------------------------------------------------
       MONGOOSE VALIDATION ERROR
    ------------------------------------------------------ */

    if (
      error?.name ===
      "ValidationError"
    ) {

      return res.status(400).json({

        success: false,

        message:
          "Property settings validation failed.",

        errors:
          Object.fromEntries(
            Object.entries(
              error.errors || {}
            ).map(
              ([field, validationError]) => [
                field,
                validationError.message,
              ]
            )
          ),

      });

    }


    /* ------------------------------------------------------
       DUPLICATE ORGANIZATION SETTINGS
    ------------------------------------------------------ */

    if (
      error?.code === 11000
    ) {

      return res.status(409).json({

        success: false,

        message:
          "Property settings already exist for this organization.",

      });

    }


    /* ------------------------------------------------------
       GENERIC ERROR
    ------------------------------------------------------ */

    return res.status(500).json({

      success: false,

      message:
        "Unable to update property settings.",

      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : undefined,

    });

  }

};


/* ==========================================================
   EXPORT
========================================================== */

export default {

  getPropertySettings,

  updatePropertySettings,

};