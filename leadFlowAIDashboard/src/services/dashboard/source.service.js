/**
 * ============================================================
 *
 * PURPOSE
 * ------------------------------------------------------------
 * Generates Lead Source analytics for the Admin Dashboard.
 *
 * WORKFLOW
 * ------------------------------------------------------------
 * 1. Validate organization
 * 2. Fetch leads belonging ONLY to that organization
 * 3. Group leads by Lead.source
 * 4. Normalize supported source values
 * 5. Include zero-count sources
 * 6. Return chart-ready data
 *
 * MULTI-TENANT SECURITY
 * ------------------------------------------------------------
 * Only leads belonging to the supplied organizationId are
 * included in the analytics.
 *
 * SUPPORTED SOURCES
 * ------------------------------------------------------------
 * whatsapp
 * website
 * facebook
 * sms
 * manual
 *
 * ============================================================
 */

import Lead from "../../models/lead.js";

// ============================================================
// SUPPORTED LEAD SOURCES
// ============================================================
//
// Keep these values synchronized with the Lead schema enum.
//
// ============================================================

const SUPPORTED_SOURCES = [
  "whatsapp",
  "website",
  "facebook",
  "sms",
  "manual",
];

// ============================================================
// SOURCE LABELS
// ============================================================
//
// Backend values remain lowercase while the frontend receives
// readable labels.
//
// ============================================================

const SOURCE_LABELS = {
  whatsapp: "WhatsApp",
  website: "Website",
  facebook: "Facebook",
  sms: "SMS",
  manual: "Manual",
};

// ============================================================
// GET SOURCE DATA
// ============================================================

export const getSourceData = async (organizationId) => {
  try {
    // ========================================================
    // VALIDATE ORGANIZATION
    // ========================================================

    if (!organizationId) {
      console.log(
        "⚠️ Source analytics skipped: organizationId is missing."
      );

      return SUPPORTED_SOURCES.map((source) => ({
        source,
        label: SOURCE_LABELS[source],
        count: 0,
      }));
    }

    // ========================================================
    // AGGREGATE LEADS
    // ========================================================
    //
    // IMPORTANT:
    // organizationId is always included in the match.
    //
    // This prevents one organization's analytics from
    // exposing another organization's lead data.
    //
    // ========================================================

    const results = await Lead.aggregate([
      {
        $match: {
          organizationId,
        },
      },

      {
        $group: {
          _id: "$source",
          count: {
            $sum: 1,
          },
        },
      },
    ]);

    // ========================================================
    // BUILD SOURCE MAP
    // ========================================================

    const sourceMap = {};

    results.forEach((item) => {
      if (!item?._id) {
        return;
      }

      sourceMap[String(item._id).toLowerCase()] =
        Number(item.count || 0);
    });

    // ========================================================
    // RETURN STABLE CHART DATA
    // ========================================================
    //
    // Every supported source is returned even when its count
    // is zero. This prevents dashboard charts from changing
    // shape depending on available data.
    //
    // ========================================================

    const sourceData = SUPPORTED_SOURCES.map((source) => ({
      source,
      label: SOURCE_LABELS[source],
      count: sourceMap[source] || 0,
    }));

    console.log(
      "📊 Lead source analytics generated:",
      {
        organizationId,
        data: sourceData,
      }
    );

    return sourceData;
  } catch (error) {
    // ========================================================
    // ERROR HANDLING
    // ========================================================

    console.error(
      "❌ Lead source analytics error:",
      error
    );

    // ========================================================
    // SAFE DASHBOARD FALLBACK
    // ========================================================

    return SUPPORTED_SOURCES.map((source) => ({
      source,
      label: SOURCE_LABELS[source],
      count: 0,
    }));
  }
};

// ============================================================
// EXPORT CONFIGURATION
// ============================================================
//
// Useful for tests and future dashboard configuration.
//
// ============================================================

export {
  SUPPORTED_SOURCES,
  SOURCE_LABELS,
};