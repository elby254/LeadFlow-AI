/**
 * ============================================================
 *
 * PURPOSE
 * -------
 * Calculates AI performance and lead-intelligence metrics for
 * the Admin Dashboard.
 *
 * USED BY
 * -------
 * - AdminDashboardController
 * - AIAnalytics.jsx
 *
 * ORGANIZATION SECURITY
 * ---------------------
 * Every query is restricted to the supplied organizationId.
 *
 * DATA USED
 * ---------
 * Lead.score
 * Lead.urgent
 * Lead.intent
 * Lead.aiInsights
 *
 * AI INSIGHTS USED
 * ----------------
 * - buyingIntent
 * - budgetConfidence
 * - locationConfidence
 * - urgency
 * - recommendedAction
 * - missingInformation
 *
 * INTENT SEMANTICS
 * ----------------
 *
 * Lead.intent represents the customer's transaction intent:
 *
 * - rent
 * - buy
 * - property_search
 *
 * property_search is used when the customer is looking for
 * a property but has not explicitly stated whether they want
 * to rent or buy.
 *
 * IMPORTANT
 * ---------
 * averageBuyingIntent is an AI insight metric and is NOT the
 * same thing as Lead.intent.
 *
 * Categorical lead intent analytics are returned separately
 * through:
 *
 * analytics.intentDistribution
 *
 * ============================================================
 */

import Lead from "../../models/lead.js";

// ============================================================
// DEFAULT EMPTY ANALYTICS
// ============================================================
//
// Keeps the controller/frontend safe when an organization has
// no leads.
//
// ============================================================

const EMPTY_ANALYTICS = {
  averageScore: 0,

  /**
   * Numeric AI insight metric.
   *
   * IMPORTANT:
   * This is NOT lead.intent.
   */
  averageBuyingIntent: 0,

  averageBudgetConfidence: 0,

  averageLocationConfidence: 0,

  urgentLeads: 0,

  /**
   * Categorical customer transaction intent.
   *
   * Canonical values:
   * - rent
   * - buy
   * - property_search
   */
  intentDistribution: {
    rent: 0,
    buy: 0,
    property_search: 0,
  },

  urgencyDistribution: {
    High: 0,
    Medium: 0,
    Low: 0,
  },

  recommendedActions: {},

  missingInformation: {},
};

// ============================================================
// SAFE NUMBER HELPER
// ============================================================
//
// AI output can occasionally contain null, undefined, strings,
// or invalid values.
//
// ============================================================

const safeNumber = (value) => {
  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : 0;
};

// ============================================================
// NORMALIZE INTENT
// ============================================================
//
// Converts supported legacy aliases into the canonical Lead
// intent values.
//
// Canonical values:
// - rent
// - buy
// - property_search
//
// IMPORTANT:
// This normalization is only for analytics aggregation.
// It does not modify the Lead document.
//
// ============================================================

const normalizeIntent = (intent) => {

  if (
    intent === null ||
    intent === undefined
  ) {
    return null;
  }

  const normalized =
    String(intent)
      .trim()
      .toLowerCase();

  // ----------------------------------------------------------
  // RENT
  // ----------------------------------------------------------

  if (
    normalized === "rent" ||
    normalized === "rental" ||
    normalized === "lease" ||
    normalized === "property_rental" ||
    normalized === "property-rental"
  ) {
    return "rent";
  }

  // ----------------------------------------------------------
  // BUY
  // ----------------------------------------------------------

  if (
    normalized === "buy" ||
    normalized === "purchase" ||
    normalized === "property_purchase" ||
    normalized === "property-purchase"
  ) {
    return "buy";
  }

  // ----------------------------------------------------------
  // PROPERTY SEARCH
  // ----------------------------------------------------------

  if (
    normalized === "property_search" ||
    normalized === "property-search" ||
    normalized === "search" ||
    normalized === "property" ||
    normalized === "looking_for_property" ||
    normalized === "looking-for-property"
  ) {
    return "property_search";
  }

  // ----------------------------------------------------------
  // UNSUPPORTED INTENT
  // ----------------------------------------------------------

  return null;
};

// ============================================================
// NORMALIZE URGENCY
// ============================================================
//
// Keeps the dashboard consistent even if the AI service returns
// lowercase or differently formatted values.
//
// ============================================================

const normalizeUrgency = (urgency) => {

  if (!urgency) {
    return null;
  }

  const normalized =
    String(urgency)
      .trim()
      .toLowerCase();

  if (normalized === "high") {
    return "High";
  }

  if (normalized === "medium") {
    return "Medium";
  }

  if (normalized === "low") {
    return "Low";
  }

  return null;
};

// ============================================================
// NORMALIZE AI ARRAY VALUES
// ============================================================
//
// Prevents malformed AI data from breaking analytics.
//
// ============================================================

const normalizeArray = (value) => {

  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter(
      (item) =>
        item !== null &&
        item !== undefined &&
        String(item).trim() !== ""
    )
    .map((item) =>
      String(item).trim()
    );
};

// ============================================================
// GET AI ANALYTICS
// ============================================================

export const getAIAnalytics = async (
  organizationId
) => {

  try {

    // ========================================================
    // VALIDATE ORGANIZATION
    // ========================================================

    if (!organizationId) {

      console.log(
        "⚠️ AI analytics skipped: organizationId is missing."
      );

      return EMPTY_ANALYTICS;
    }

    // ========================================================
    // FETCH ORGANIZATION LEADS
    // ========================================================
    //
    // Only fields required by the AI analytics engine are
    // retrieved.
    //
    // Lead.intent is included separately from aiInsights so
    // categorical transaction intent can be aggregated without
    // confusing it with AI buying-intent metrics.
    //
    // ========================================================

    const leads = await Lead.find({
      organizationId,
    }).select(
      "score urgent intent aiInsights"
    );

    // ========================================================
    // NO LEADS
    // ========================================================

    if (!leads.length) {

      return {
        ...EMPTY_ANALYTICS,

        intentDistribution: {
          ...EMPTY_ANALYTICS.intentDistribution,
        },

        urgencyDistribution: {
          ...EMPTY_ANALYTICS.urgencyDistribution,
        },
      };
    }

    // ========================================================
    // RUNNING TOTALS
    // ========================================================

    let totalScore = 0;

    /**
     * Numeric AI insight.
     *
     * This is intentionally separate from Lead.intent.
     */
    let totalBuyingIntent = 0;

    let totalBudgetConfidence = 0;

    let totalLocationConfidence = 0;

    let urgentLeads = 0;

    // ========================================================
    // DISTRIBUTIONS
    // ========================================================

    /**
     * Customer transaction intent distribution.
     *
     * Source:
     * Lead.intent
     *
     * Canonical values:
     * - rent
     * - buy
     * - property_search
     */
    const intentDistribution = {
      rent: 0,
      buy: 0,
      property_search: 0,
    };

    const urgencyDistribution = {
      High: 0,
      Medium: 0,
      Low: 0,
    };

    const recommendedActions = {};

    const missingInformation = {};

    // ========================================================
    // PROCESS LEADS
    // ========================================================

    leads.forEach((lead) => {

      // ------------------------------------------------------
      // LEAD SCORE
      // ------------------------------------------------------

      totalScore += safeNumber(
        lead.score
      );

      // ------------------------------------------------------
      // CUSTOMER TRANSACTION INTENT
      // ------------------------------------------------------
      //
      // IMPORTANT:
      // Lead.intent is the customer's transaction intent.
      //
      // It is NOT:
      // - aiInsights.buyingIntent
      // - propertyType
      // - budget
      // - location
      // - bedrooms
      //
      // Those are separate data points.
      //
      // ------------------------------------------------------

      const intent =
        normalizeIntent(
          lead.intent
        );

      if (intent) {

        intentDistribution[
          intent
        ]++;
      }

      // ------------------------------------------------------
      // URGENT LEADS
      // ------------------------------------------------------

      if (lead.urgent === true) {

        urgentLeads++;
      }

      // ------------------------------------------------------
      // AI INSIGHTS
      // ------------------------------------------------------

      const ai =
        lead.aiInsights || {};

      // ------------------------------------------------------
      // AI BUYING INTENT
      // ------------------------------------------------------
      //
      // This is a numeric/AI insight metric.
      //
      // It must NOT be used as Lead.intent.
      //
      // ------------------------------------------------------

      totalBuyingIntent +=
        safeNumber(
          ai.buyingIntent
        );

      // ------------------------------------------------------
      // BUDGET CONFIDENCE
      // ------------------------------------------------------

      totalBudgetConfidence +=
        safeNumber(
          ai.budgetConfidence
        );

      // ------------------------------------------------------
      // LOCATION CONFIDENCE
      // ------------------------------------------------------

      totalLocationConfidence +=
        safeNumber(
          ai.locationConfidence
        );

      // ======================================================
      // URGENCY DISTRIBUTION
      // ======================================================

      const urgency =
        normalizeUrgency(
          ai.urgency
        );

      if (urgency) {

        urgencyDistribution[
          urgency
        ]++;
      }

      // ======================================================
      // RECOMMENDED ACTION
      // ======================================================

      if (
        ai.recommendedAction !==
          null &&
        ai.recommendedAction !==
          undefined &&
        String(
          ai.recommendedAction
        ).trim() !== ""
      ) {

        const action =
          String(
            ai.recommendedAction
          ).trim();

        recommendedActions[
          action
        ] =
          (
            recommendedActions[
              action
            ] || 0
          ) + 1;
      }

      // ======================================================
      // MISSING INFORMATION
      // ======================================================

      const missingFields =
        normalizeArray(
          ai.missingInformation
        );

      missingFields.forEach(
        (field) => {

          missingInformation[
            field
          ] =
            (
              missingInformation[
                field
              ] || 0
            ) + 1;
        }
      );
    });

    // ========================================================
    // CALCULATE AVERAGES
    // ========================================================

    const averageScore =
      Number(
        (
          totalScore /
          leads.length
        ).toFixed(1)
      );

    /**
     * Numeric AI insight metric.
     *
     * This remains separate from intentDistribution.
     */
    const averageBuyingIntent =
      Number(
        (
          totalBuyingIntent /
          leads.length
        ).toFixed(1)
      );

    const averageBudgetConfidence =
      Number(
        (
          totalBudgetConfidence /
          leads.length
        ).toFixed(1)
      );

    const averageLocationConfidence =
      Number(
        (
          totalLocationConfidence /
          leads.length
        ).toFixed(1)
      );

    // ========================================================
    // FINAL ANALYTICS RESULT
    // ========================================================

    const analytics = {

      averageScore,

      /**
       * Numeric AI insight metric.
       *
       * NOT lead.intent.
       */
      averageBuyingIntent,

      averageBudgetConfidence,

      averageLocationConfidence,

      urgentLeads,

      /**
       * Categorical customer transaction intent.
       *
       * Source:
       * Lead.intent
       *
       * Values:
       * - rent
       * - buy
       * - property_search
       */
      intentDistribution,

      urgencyDistribution,

      recommendedActions,

      missingInformation,
    };

    // ========================================================
    // DEBUG LOGGING
    // ========================================================

    console.log(
      "🤖 AI ANALYTICS CALCULATED:",
      {
        organizationId:
          String(organizationId),

        totalLeads:
          leads.length,

        averageScore,

        averageBuyingIntent,

        averageBudgetConfidence,

        averageLocationConfidence,

        urgentLeads,

        intentDistribution,

        urgencyDistribution,
      }
    );

    // ========================================================
    // RETURN
    // ========================================================

    return analytics;

  } catch (error) {

    // ========================================================
    // ERROR HANDLING
    // ========================================================

    console.error(
      "❌ AI analytics error:",
      error
    );

    return {
      ...EMPTY_ANALYTICS,

      intentDistribution: {
        ...EMPTY_ANALYTICS.intentDistribution,
      },

      urgencyDistribution: {
        ...EMPTY_ANALYTICS.urgencyDistribution,
      },
    };
  }
};

// ============================================================
// DEFAULT EXPORT
// ============================================================
//
// Optional service-style export for controllers that prefer:
//
// import aiAnalyticsService from "...";
//
// ============================================================

const aiAnalyticsService = {
  getAIAnalytics,
};

export default aiAnalyticsService;