/**
 * ============================================================
 *
 * LEAD INTENT PERSISTENCE SERVICE
 *
 * ============================================================
 *
 * Central service responsible for:
 *
 * ✓ Persisting lead intent
 * ✓ Preventing empty intent overwrite
 * ✓ Normalizing intent
 * ✓ Recalculating score
 * ✓ Persisting lifecycle category
 *
 * ============================================================
 */

import Lead from "../models/lead.js";

import {
  calculateLeadScore,
  getLeadCategory,
} from "./leadScoringRulesEngine.js";

// ============================================================
// NORMALIZE INTENT
// ============================================================
//
// IMPORTANT
// ------------------------------------------------------------
//
// This service does NOT determine customer intent.
//
// Intent has already been detected by the extraction layer.
//
// This function only normalizes equivalent intent values into
// the canonical LeadFlow AI intent vocabulary.
//
// Canonical intent values:
//
//     property_search
//     rent
//     buy
//
// Supported aliases:
//
//     lease
//     rental
//     property_rental
//         -> rent
//
//     purchase
//     property_purchase
//         -> buy
//
// Generic property search:
//
//     property_search
//         -> property_search
//
// Empty / unknown values are rejected and MUST NOT overwrite
// an existing Lead.intent.
//
// ============================================================

const normalizeIntent = (
  value
) => {
  if (
    value === null ||
    value === undefined
  ) {
    return "";
  }

  const normalized =
    String(value)
      .trim()
      .toLowerCase();

  if (
    !normalized
  ) {
    return "";
  }

  // ==========================================================
  // RENT INTENT
  // ==========================================================

  if (
    [
      "rent",
      "rental",
      "lease",
      "property_rental",
      "property-rental",
    ].includes(
      normalized
    )
  ) {
    return "rent";
  }

  // ==========================================================
  // BUY INTENT
  // ==========================================================

  if (
    [
      "buy",
      "purchase",
      "property_purchase",
      "property-purchase",
    ].includes(
      normalized
    )
  ) {
    return "buy";
  }

  // ==========================================================
  // GENERIC PROPERTY SEARCH
  // ==========================================================

  if (
    [
      "property_search",
      "property-search",
      "search",
      "property",
      "looking_for_property",
      "looking-for-property",
    ].includes(
      normalized
    )
  ) {
    return "property_search";
  }

  // ==========================================================
  // OTHER INTENTS
  // ==========================================================
  //
  // These are intentionally not converted into rent/buy.
  //
  // The persistence service should not guess.
  //
  // For example:
  //
  //     viewing
  //     inquiry
  //     sell
  //     invest
  //     unknown
  //
  // are not silently converted into:
  //
  //     rent
  //     buy
  //     property_search
  //
  // ==========================================================

  return normalized;
};

// ============================================================
// VALID INTENT
// ============================================================

const hasIntent = (
  value
) => {
  return (
    normalizeIntent(value) !== ""
  );
};

// ============================================================
// VALID LEAD ID
// ============================================================

const isValidLeadId = (
  leadId
) => {
  if (
    leadId === null ||
    leadId === undefined
  ) {
    return false;
  }

  const value =
    String(leadId).trim();

  return /^[a-fA-F0-9]{24}$/.test(
    value
  );
};

// ============================================================
// PERSIST LEAD INTENT
// ============================================================

export const persistLeadIntent =
  async (
    leadId,
    intent
  ) => {
    try {

      // ========================================================
      // VALIDATE ID
      // ========================================================

      if (
        !isValidLeadId(
          leadId
        )
      ) {
        console.error(
          "❌ Lead intent persistence aborted: invalid lead ID:",
          leadId
        );

        return {
          success: false,
          updated: false,
          intent: null,
          error:
            "Invalid lead ID.",
        };
      }

      // ========================================================
      // NORMALIZE
      // ========================================================

      const normalizedIntent =
        normalizeIntent(
          intent
        );

      console.log(
        "🧠 LEAD INTENT PERSISTENCE - INCOMING INTENT:",
        intent
      );

      console.log(
        "🧠 LEAD INTENT PERSISTENCE - NORMALIZED INTENT:",
        normalizedIntent ||
          "(empty)"
      );

      // ========================================================
      // NEVER WRITE EMPTY INTENT
      // ========================================================

      if (
        !hasIntent(
          normalizedIntent
        )
      ) {
        console.log(
          "ℹ️ Lead intent persistence skipped: no valid intent extracted."
        );

        return {
          success: true,
          updated: false,
          intent: null,
          reason:
            "No valid intent supplied.",
        };
      }

      // ========================================================
      // FIND LEAD
      // ========================================================

      const lead =
        await Lead.findById(
          leadId
        );

      if (!lead) {
        console.error(
          "❌ Lead intent persistence failed: lead not found:",
          leadId
        );

        return {
          success: false,
          updated: false,
          intent: null,
          error:
            "Lead not found.",
        };
      }

      // ========================================================
      // EXISTING INTENT
      // ========================================================

      const previousIntent =
        normalizeIntent(
          lead.intent
        );

      console.log(
        "🧠 EXISTING LEAD INTENT:",
        previousIntent ||
          "(none)"
      );

      // ========================================================
      // WRITE INTENT
      // ========================================================
      //
      // IMPORTANT:
      //
      // The persistence layer does NOT reinterpret the customer's
      // conversation.
      //
      // It only persists the already-detected intent after
      // normalization.
      //
      // Examples:
      //
      //     lease
      //         -> rent
      //
      //     property_rental
      //         -> rent
      //
      //     purchase
      //         -> buy
      //
      //     property_purchase
      //         -> buy
      //
      //     property_search
      //         -> property_search
      //
      // ========================================================

      lead.intent =
        normalizedIntent;

      console.log(
        "🎯 LEAD INTENT BEFORE SAVE:",
        lead.intent
      );

      // ========================================================
      // RECALCULATE SCORE
      // ========================================================

      const score =
        calculateLeadScore(
          lead
        );

      const category =
        getLeadCategory(
          score
        );

      console.log(
        "📊 LEAD SCORE AFTER INTENT:",
        score
      );

      console.log(
        "🏷️ LEAD CATEGORY AFTER INTENT:",
        category
      );

      // ========================================================
      // PERSIST SCORE
      // ========================================================

      lead.score =
        score;

      // ========================================================
      // PERSIST CATEGORY WHEN SUPPORTED
      // ========================================================

      if (
        Object.prototype.hasOwnProperty.call(
          lead.toObject(),
          "category"
        )
      ) {
        lead.category =
          category;
      }

      // ========================================================
      // PERSIST STAGE WHEN SUPPORTED
      // ========================================================
      //
      // This remains compatible with projects where stage is
      // available on the Lead model.
      //
      // It does NOT replace Lead.status.
      //
      // Lead.status must continue using the existing Lead enum:
      //
      //     new
      //     contacted
      //     qualified
      //     viewing
      //     negotiation
      //     won
      //     lost
      //
      // ========================================================

      if (
        Object.prototype.hasOwnProperty.call(
          lead.toObject(),
          "stage"
        )
      ) {
        lead.stage =
          category;
      }

      // ========================================================
      // SAVE
      // ========================================================

      await lead.save();

      // ========================================================
      // RELOAD FROM DATABASE
      // ========================================================
      //
      // This is deliberate.
      //
      // It verifies that Mongoose actually persisted the field.
      //
      // ========================================================

      const persistedLead =
        await Lead.findById(
          lead._id
        ).select(
          "intent score category stage"
        );

      const persistedIntent =
        normalizeIntent(
          persistedLead?.intent
        );

      console.log(
        "================================================"
      );

      console.log(
        "✅ LEAD INTENT DATABASE VERIFICATION"
      );

      console.log(
        "Lead ID:",
        lead._id
      );

      console.log(
        "Previous Intent:",
        previousIntent ||
          "(none)"
      );

      console.log(
        "Requested Intent:",
        intent
      );

      console.log(
        "Normalized Intent:",
        normalizedIntent
      );

      console.log(
        "Persisted Intent:",
        persistedIntent ||
          "(empty)"
      );

      console.log(
        "================================================"
      );

      // ========================================================
      // VERIFY PERSISTENCE
      // ========================================================

      if (
        persistedIntent !==
        normalizedIntent
      ) {
        console.error(
          "❌ INTENT PERSISTENCE VERIFICATION FAILED"
        );

        return {
          success: false,
          updated: false,
          intent:
            persistedIntent ||
            null,
          error:
            "Intent was not persisted correctly.",
          lead:
            persistedLead,
        };
      }

      // ========================================================
      // SUCCESS
      // ========================================================

      return {
        success: true,

        updated:
          previousIntent !==
          persistedIntent,

        leadId:
          persistedLead._id,

        previousIntent:
          previousIntent ||
          null,

        intent:
          persistedIntent,

        score:
          persistedLead.score ??
          0,

        category:
          persistedLead.category ||
          persistedLead.stage ||
          "new",

        lead:
          persistedLead,
      };

    } catch (error) {

      console.error(
        "❌ Lead intent persistence error:",
        error
      );

      return {
        success: false,
        updated: false,
        intent: null,
        error:
          error?.message ||
          "Failed to persist lead intent.",
      };
    }
  };

// ============================================================
// GET PERSISTED INTENT
// ============================================================

export const getPersistedLeadIntent =
  async (
    leadId
  ) => {
    try {

      // ========================================================
      // VALIDATE ID
      // ========================================================

      if (
        !isValidLeadId(
          leadId
        )
      ) {
        return {
          success: false,
          intent: null,
          error:
            "Invalid lead ID.",
        };
      }

      // ========================================================
      // FIND LEAD
      // ========================================================

      const lead =
        await Lead.findById(
          leadId
        ).select(
          "intent score category stage"
        );

      if (!lead) {
        return {
          success: false,
          intent: null,
          error:
            "Lead not found.",
        };
      }

      // ========================================================
      // NORMALIZE PERSISTED INTENT
      // ========================================================

      const persistedIntent =
        normalizeIntent(
          lead.intent
        );

      return {
        success: true,

        intent:
          persistedIntent ||
          null,

        score:
          lead.score ??
          0,

        category:
          lead.category ||
          lead.stage ||
          "new",
      };

    } catch (error) {

      console.error(
        "❌ Get persisted lead intent error:",
        error
      );

      return {
        success: false,
        intent: null,
        error:
          error?.message ||
          "Failed to retrieve lead intent.",
      };
    }
  };

// ============================================================
// UPDATE INTENT ONLY
// ============================================================

export const updateLeadIntent =
  async (
    leadId,
    intent
  ) => {
    return persistLeadIntent(
      leadId,
      intent
    );
  };

// ============================================================
// DEFAULT EXPORT
// ============================================================

export default {
  persistLeadIntent,
  getPersistedLeadIntent,
  updateLeadIntent,
};