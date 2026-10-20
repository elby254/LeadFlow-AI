/**
 * ==========================================================
 *
 * ORGANIZATION RESOLVER SERVICE
 *
 * LeadFlow AI
 *
 * ==========================================================
 *
 * CENTRAL MULTI-TENANT ORGANIZATION RESOLUTION AUTHORITY
 *
 * ==========================================================
 *
 * ARCHITECTURAL RULE
 * ----------------------------------------------------------
 *
 * Organization resolution is centralized and channel-specific.
 *
 * The client may provide only an opaque/public tenant routing
 * identifier where required.
 *
 * The client may NEVER directly choose organizationId.
 *
 * All resolved organizations are validated against MongoDB
 * before entering the business workflow.
 *
 * ==========================================================
 *
 * CHANNELS
 * ----------------------------------------------------------
 *
 * Website
 *    websiteKey
 *        ↓
 *    Organization
 *
 * WhatsApp
 *    phone_number_id
 *        ↓
 *    Organization
 *
 * SMS
 *    business-number mapping
 *        ↓
 *    Organization
 *
 * Facebook
 *    page/account mapping
 *        ↓
 *    Organization
 *
 * Dashboard
 *    req.user.organizationId
 *        ↓
 *    Organization
 *
 * ==========================================================
 */

import mongoose from "mongoose";

import Organization from "../models/organization.js";


// ==========================================================
// CONSTANTS
// ==========================================================

const VALID_CHANNELS = [

  "whatsapp",

  "sms",

  "website",

  "facebook",

];


// ==========================================================
// NORMALIZE STRING
// ==========================================================

const normalizeString = (
  value
) => {

  if (
    value === undefined ||
    value === null
  ) {

    return null;
  }


  const normalized =
    String(
      value
    ).trim();


  return (
    normalized ||
    null
  );
};


// ==========================================================
// NORMALIZE CHANNEL
// ==========================================================

export const normalizeChannel = (
  channel
) => {

  const normalized =
    normalizeString(
      channel
    )?.toLowerCase();


  if (
    !normalized ||
    !VALID_CHANNELS.includes(
      normalized
    )
  ) {

    return null;
  }


  return normalized;
};


// ==========================================================
// VALIDATE ORGANIZATION ID
// ==========================================================

export const isValidOrganizationId = (
  organizationId
) => {

  return Boolean(
    organizationId
  ) &&
    mongoose.Types.ObjectId.isValid(
      organizationId
    );

};


// ==========================================================
// NORMALIZE ORGANIZATION ID
// ==========================================================

export const normalizeOrganizationId = (
  organizationId
) => {

  const normalized =
    normalizeString(
      organizationId
    );


  if (
    !isValidOrganizationId(
      normalized
    )
  ) {

    return null;
  }


  return normalized;
};


// ==========================================================
// NORMALIZE ORIGIN
// ==========================================================
//
// Converts:
//
// https://example.com/
// https://example.com
//
// into:
//
// https://example.com
//
// ==========================================================

export const normalizeOrigin = (
  origin
) => {

  const normalized =
    normalizeString(
      origin
    );


  if (
    !normalized
  ) {

    return null;
  }


  try {

    const url =
      new URL(
        normalized
      );


    return (
      `${url.protocol}//${url.host}`
    )
      .toLowerCase();

  } catch {

    return (
      normalized
        .replace(
          /\/+$/,
          ""
        )
        .toLowerCase()
    );

  }

};


// ==========================================================
// GET REQUEST ORIGIN
// ==========================================================

const getRequestOrigin = (
  req
) => {

  const origin =
    req?.headers?.origin ||
    req?.headers?.Origin ||
    null;


  if (
    origin
  ) {

    return normalizeOrigin(
      origin
    );

  }


  const referer =
    req?.headers?.referer ||
    req?.headers?.Referer ||
    null;


  if (
    referer
  ) {

    try {

      return normalizeOrigin(
        new URL(
          referer
        ).origin
      );

    } catch {

      return null;

    }

  }


  return null;

};


// ==========================================================
// GET WEBSITE KEY FROM REQUEST
// ==========================================================
//
// Canonical header:
//
// X-LeadFlow-Website-Key
//
// Internal adapters may also attach:
//
// req.websiteKey
//
// normalizedMessage.metadata.websiteKey
//
// ==========================================================

export const getWebsiteKeyFromRequest = (
  req
) => {

  const directWebsiteKey =
    normalizeString(
      req?.websiteKey
    );


  if (
    directWebsiteKey
  ) {

    return directWebsiteKey;
  }


  const headerWebsiteKey =
    normalizeString(
      req?.headers?.[
        "x-leadflow-website-key"
      ]
    );


  if (
    headerWebsiteKey
  ) {

    return headerWebsiteKey;
  }


  const normalizedMetadata =
    req?.normalizedMessage?.metadata ||
    {};


  const channelMetadata =
    req?.channelMetadata ||
    {};


  return (
    normalizeString(
      normalizedMetadata?.websiteKey
    ) ||

    normalizeString(
      normalizedMetadata?.siteKey
    ) ||

    normalizeString(
      normalizedMetadata?.widgetKey
    ) ||

    normalizeString(
      channelMetadata?.websiteKey
    ) ||

    normalizeString(
      channelMetadata?.siteKey
    ) ||

    normalizeString(
      channelMetadata?.widgetKey
    ) ||

    null
  );

};


// ==========================================================
// RESOLVE BY ORGANIZATION ID
// ==========================================================

/**
 * Resolves an active organization directly by ID.
 *
 * IMPORTANT:
 *
 * This function may only be called after organization identity
 * has already been established by a trusted source.
 *
 * It does NOT accept customer body data.
 */

export const resolveById = async (
  organizationId
) => {

  const normalizedId =
    normalizeOrganizationId(
      organizationId
    );


  if (
    !normalizedId
  ) {

    return null;
  }


  const organization =
    await Organization.findOne({

      _id:
        normalizedId,

      isActive:
        true,

    });


  return (
    organization ||
    null
  );

};


// ==========================================================
// RESOLVE BY ORGANIZATION NAME
// ==========================================================

export const resolveByName = async (
  organizationName
) => {

  const normalizedName =
    normalizeString(
      organizationName
    );


  if (
    !normalizedName
  ) {

    return null;
  }


  const organization =
    await Organization.findOne({

      name:
        normalizedName,

    });


  return (
    organization ||
    null
  );

};


// ==========================================================
// RESOLVE WEBSITE ORGANIZATION
// ==========================================================

/**
 * Resolves an organization through its public website/widget
 * tenant routing key.
 *
 * IMPORTANT:
 *
 * websiteKey is a tenant routing identifier.
 *
 * It is NOT treated as a dashboard authentication secret.
 *
 * Optional websiteAllowedOrigins can provide an additional
 * production hardening layer.
 */

export const resolveByWebsiteKey = async (
  websiteKey,
  requestOrigin = null
) => {

  const normalizedWebsiteKey =
    normalizeString(
      websiteKey
    );


  if (
    !normalizedWebsiteKey
  ) {

    return null;
  }


  const organization =
    await Organization.findOne({

      websiteKey:
        normalizedWebsiteKey,

      isActive:
        true,

    });


  if (
    !organization
  ) {

    console.warn(
      "⚠️ WEBSITE ORGANIZATION NOT FOUND FOR WEBSITE KEY"
    );

    return null;
  }


  // ========================================================
  // OPTIONAL ORIGIN VALIDATION
  // ========================================================

  const allowedOrigins =
    Array.isArray(
      organization.websiteAllowedOrigins
    )

      ? organization.websiteAllowedOrigins
          .map(
            normalizeOrigin
          )
          .filter(
            Boolean
          )

      : [];


  if (
    allowedOrigins.length > 0
  ) {

    const normalizedRequestOrigin =
      normalizeOrigin(
        requestOrigin
      );


    if (
      !normalizedRequestOrigin
    ) {

      console.warn(
        "⚠️ WEBSITE ORIGIN REQUIRED FOR THIS ORGANIZATION:",
        organization._id.toString()
      );

      return null;
    }


    if (
      !allowedOrigins.includes(
        normalizedRequestOrigin
      )
    ) {

      console.warn(
        "⚠️ WEBSITE ORIGIN NOT ALLOWED:",
        {

          organizationId:
            organization._id.toString(),

          requestOrigin:
            normalizedRequestOrigin,

        }
      );

      return null;
    }

  }


  console.log(
    "🌐 WEBSITE ORGANIZATION RESOLVED:",
    {

      organizationId:
        organization._id.toString(),

      website:
        organization.website ||
        "",

    }
  );


  return organization;

};


// ==========================================================
// RESOLVE WHATSAPP ORGANIZATION
// ==========================================================

export const resolveByWhatsApp = async (
  phoneNumberId
) => {

  const normalizedPhoneNumberId =
    normalizeString(
      phoneNumberId
    );


  if (
    !normalizedPhoneNumberId
  ) {

    return null;
  }


  const organization =
    await Organization.findOne({

      whatsappPhoneNumberId:
        normalizedPhoneNumberId,

      whatsappEnabled:
        true,

      isActive:
        true,

    });


  return (
    organization ||
    null
  );

};


// ==========================================================
// RESOLVE CHANNEL ORGANIZATION
// ==========================================================

export const resolveByChannel = async ({
  channel,
  metadata = {},
  requestOrigin = null,
} = {}) => {

  const normalizedChannel =
    normalizeChannel(
      channel
    );


  if (
    !normalizedChannel
  ) {

    return null;
  }


  switch (
    normalizedChannel
  ) {

    // ======================================================
    // WHATSAPP
    // ======================================================

    case "whatsapp": {

      const phoneNumberId =
        metadata?.phoneNumberId ||
        metadata?.phone_number_id ||
        metadata?.whatsappPhoneNumberId;


      return await resolveByWhatsApp(
        phoneNumberId
      );

    }


    // ======================================================
    // WEBSITE
    // ======================================================

    case "website": {

      const websiteKey =
        metadata?.websiteKey ||
        metadata?.siteKey ||
        metadata?.widgetKey;


      return await resolveByWebsiteKey(

        websiteKey,

        requestOrigin

      );

    }


    // ======================================================
    // SMS
    // ======================================================

    case "sms": {

      // Future SMS number → organization mapping.
      //
      // IMPORTANT:
      //
      // Never infer an organization from the customer's
      // phone number.

      return null;

    }


    // ======================================================
    // FACEBOOK
    // ======================================================

    case "facebook": {

      // Future Facebook page/account → organization mapping.

      return null;

    }


    default: {

      return null;

    }

  }

};


// ==========================================================
// RESOLVE FROM REQUEST
// ==========================================================
//
// SINGLE AUTHORITATIVE REQUEST RESOLUTION ENTRY POINT.
//
// ==========================================================

export const resolveFromRequest = async (
  req
) => {

  if (
    !req ||
    typeof req !== "object"
  ) {

    return null;
  }


  // ========================================================
  // DETERMINE CHANNEL
  // ========================================================

  const normalizedMessageChannel =
    normalizeChannel(
      req?.normalizedMessage?.channel
    );


  const requestChannel =
    normalizeChannel(
      req?.source ||
      req?.channel ||
      normalizedMessageChannel
    );


  const requestOrigin =
    getRequestOrigin(
      req
    );


  // ========================================================
  // CHANNEL METADATA
  // ========================================================

  const channelMetadata = {

    ...(req?.normalizedMessage?.metadata || {}),

    ...(req?.channelMetadata || {}),

  };


  // ========================================================
  // WEBSITE
  // ========================================================
  //
  // Website resolution uses websiteKey.
  //
  // Authenticated organization context can remain a fallback
  // for trusted internal/dashboard requests.
  //
  // ========================================================

  if (
    requestChannel ===
    "website"
  ) {

    const websiteKey =
      getWebsiteKeyFromRequest(
        req
      );


    if (
      websiteKey
    ) {

      const websiteOrganization =
        await resolveByWebsiteKey(

          websiteKey,

          requestOrigin

        );


      if (
        websiteOrganization
      ) {

        return websiteOrganization;
      }

    }

  }


  // ========================================================
  // CHANNEL-SPECIFIC RESOLUTION
  // ========================================================
  //
  // WhatsApp and other provider channels should resolve
  // through their trusted provider mapping first.
  //
  // ========================================================

  if (
    requestChannel
  ) {

    const channelOrganization =
      await resolveByChannel({

        channel:
          requestChannel,

        metadata:
          channelMetadata,

        requestOrigin,

      });


    if (
      channelOrganization
    ) {

      return channelOrganization;
    }

  }


  // ========================================================
  // AUTHENTICATED DASHBOARD / TRUSTED INTERNAL REQUEST
  // ========================================================

  const authenticatedOrganizationId =
    req?.user?.organizationId ||
    req?.organization?._id ||
    req?.organization?.id;


  if (
    authenticatedOrganizationId
  ) {

    return await resolveById(
      authenticatedOrganizationId
    );

  }


  // ========================================================
  // NO SAFE TENANT CONTEXT
  // ========================================================

  console.warn(
    "⚠️ ORGANIZATION RESOLUTION FAILED: NO TRUSTED TENANT CONTEXT."
  );


  return null;

};


// ==========================================================
// RESOLVE ORGANIZATION ID FROM REQUEST
// ==========================================================

export const resolveOrganizationIdFromRequest =
  async (
    req
  ) => {

    const organization =
      await resolveFromRequest(
        req
      );


    if (
      !organization
    ) {

      return null;
    }


    return String(
      organization._id
    );

  };


// ==========================================================
// ASSERT ORGANIZATION
// ==========================================================

export const assertOrganization = (
  organization,
  message =
    "Organization context could not be resolved."
) => {

  if (
    !organization
  ) {

    const error =
      new Error(
        message
      );


    error.status =
      400;


    throw error;

  }


  return organization;

};


// ==========================================================
// EXPORT DEFAULT
// ==========================================================

export default {

  normalizeChannel,

  isValidOrganizationId,

  normalizeOrganizationId,

  normalizeOrigin,

  getWebsiteKeyFromRequest,

  resolveById,

  resolveByName,

  resolveByWebsiteKey,

  resolveByWhatsApp,

  resolveByChannel,

  resolveFromRequest,

  resolveOrganizationIdFromRequest,

  assertOrganization,

};