/**
 * ============================================================
 *
 * LEAD INTENT PERSISTENCE SERVICE
 *
 * ============================================================
 *
 * PURPOSE
 * ------------------------------------------------------------
 * Central service responsible for:
 *
 * ✓ Persisting lead intent
 * ✓ Preventing empty intent overwrite
 * ✓ Normalizing intent aliases
 * ✓ Recalculating the canonical lead score
 * ✓ Returning the canonical score category
 * ✓ Preserving organization isolation
 * ✓ Verifying database persistence
 *
 * ============================================================
 *
 * IMPORTANT ARCHITECTURE
 * ============================================================
 *
 * THIS SERVICE DOES NOT DETERMINE CUSTOMER INTENT.
 *
 * Intent is detected by the extraction / ingestion layer.
 *
 * This service ONLY:
 *
 *   detected intent
 *        ↓
 *   normalize
 *        ↓
 *   validate
 *        ↓
 *   persist
 *
 * ============================================================
 *
 * CANONICAL LEAD INTENT
 * ============================================================
 *
 *   property_search
 *   rent
 *   buy
 *
 * No other value may be persisted.
 *
 * ============================================================
 *
 * CANONICAL SCORE
 * ============================================================
 *
 * Score:
 *
 *   0–49   → new
 *   50–79  → qualified
 *   80–100 → hot
 *
 * IMPORTANT:
 *
 * "hot" is NOT Lead.status.
 *
 * Lead.status remains:
 *
 *   new
 *   contacted
 *   qualified
 *   viewing
 *   negotiation
 *   won
 *   lost
 *
 * ============================================================
 */

import mongoose from "mongoose";

import Lead from "../models/lead.js";

import {
  calculateLeadScore,
  getLeadCategory,
} from "./leadScoringRulesEngine.js";

/* ============================================================
   CANONICAL INTENTS
============================================================ */

const CANONICAL_INTENTS =
  Object.freeze([
    "property_search",
    "rent",
    "buy",
  ]);

/* ============================================================
   NORMALIZE INTENT
============================================================ */

/**
 * Converts supported aliases into canonical LeadFlow AI
 * transaction intents.
 *
 * IMPORTANT:
 * ------------------------------------------------------------
 *
 * Unknown values return an empty string.
 *
 * They are NEVER passed through unchanged.
 *
 * That prevents unsupported values such as:
 *
 *   sell
 *   invest
 *   viewing
 *   inquiry
 *   unknown
 *
 * from accidentally reaching Lead.intent.
 */
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
      .toLowerCase()
      .replace(
        /\s+/g,
        " "
      );

  if (
    !normalized
  ) {
    return "";
  }

  /* ========================================================
     RENT
  ======================================================== */

  if (
    [
      "rent",
      "rental",
      "renting",
      "lease",
      "leasing",
      "let",
      "letting",
      "property_rental",
      "property-rental",
    ].includes(
      normalized
    )
  ) {
    return "rent";
  }

  /* ========================================================
     BUY
  ======================================================== */

  if (
    [
      "buy",
      "buying",
      "purchase",
      "purchasing",
      "own",
      "ownership",
      "acquire",
      "acquiring",
      "property_purchase",
      "property-purchase",
    ].includes(
      normalized
    )
  ) {
    return "buy";
  }

  /* ========================================================
     GENERIC PROPERTY SEARCH
  ======================================================== */

  if (
    [
      "property_search",
      "property-search",
      "property search",
      "search",
      "looking",
      "looking for property",
      "looking_for_property",
      "looking-for-property",
      "property inquiry",
      "property_inquiry",
      "property-inquiry",
    ].includes(
      normalized
    )
  ) {
    return "property_search";
  }

  /* ========================================================
     UNKNOWN / UNSUPPORTED
  ======================================================== */

  return "";
};

/* ============================================================
   VALID INTENT
============================================================ */

const hasIntent = (
  value
) => {
  const normalized =
    normalizeIntent(
      value
    );

  return CANONICAL_INTENTS.includes(
    normalized
  );
};

/* ============================================================
   VALID OBJECT ID
============================================================ */

const isValidObjectId = (
  value
) => {
  return Boolean(
    value &&
      mongoose.Types.ObjectId.isValid(
        value
      )
  );
};

/* ============================================================
   VALID LEAD ID
============================================================ */

const isValidLeadId = (
  leadId
) => {
  return isValidObjectId(
    leadId
  );
};

/* ============================================================
   VALID ORGANIZATION ID
============================================================ */

const isValidOrganizationId = (
  organizationId
) => {
  return isValidObjectId(
    organizationId
  );
};

/* ============================================================
   SCHEMA FIELD SUPPORT
============================================================ */

/**
 * Detect whether the Lead schema actually contains a field.
 *
 * We use schema.path() instead of checking toObject() so that
 * schema support is determined directly from the model
 * definition.
 */
const hasLeadField = (
  fieldName
) => {
  return Boolean(
    Lead.schema?.path?.(
      fieldName
    )
  );
};

/* ============================================================
   PERSIST LEAD INTENT
============================================================ */

export const persistLeadIntent =
  async (
    leadId,
    intent,
    organizationId
  ) => {
    try {
      console.log(
        "================================================"
      );

      console.log(
        "🧠 LEAD INTENT PERSISTENCE"
      );

      console.log(
        "================================================"
      );

      console.log(
        "Lead ID:",
        leadId
      );

      console.log(
        "Organization ID:",
        organizationId
      );

      console.log(
        "Incoming Intent:",
        intent || "(empty)"
      );

      /* ======================================================
         1. VALIDATE LEAD ID
      ====================================================== */

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
          success:
            false,

          updated:
            false,

          intent:
            null,

          error:
            "Invalid lead ID.",
        };
      }

      /* ======================================================
         2. VALIDATE ORGANIZATION ID
      ====================================================== */

      if (
        !isValidOrganizationId(
          organizationId
        )
      ) {
        console.error(
          "❌ Lead intent persistence aborted: invalid or missing organizationId."
        );

        return {
          success:
            false,

          updated:
            false,

          intent:
            null,

          error:
            "Valid organization ID is required.",
        };
      }

      /* ======================================================
         3. NORMALIZE
      ====================================================== */

      const normalizedIntent =
        normalizeIntent(
          intent
        );

      console.log(
        "🧠 LEAD INTENT PERSISTENCE - INCOMING INTENT:",
        intent || "(empty)"
      );

      console.log(
        "🧠 LEAD INTENT PERSISTENCE - NORMALIZED INTENT:",
        normalizedIntent ||
          "(empty)"
      );

      /* ======================================================
         4. NEVER WRITE INVALID / EMPTY INTENT
      ====================================================== */

      if (
        !hasIntent(
          normalizedIntent
        )
      ) {
        console.log(
          "ℹ️ Lead intent persistence skipped: no valid canonical intent supplied."
        );

        return {
          success:
            true,

          updated:
            false,

          intent:
            null,

          reason:
            "No valid canonical intent supplied.",
        };
      }

      /* ======================================================
         5. FIND LEAD
      ====================================================== */

      /**
       * IMPORTANT:
       *
       * Lead ID alone is NEVER sufficient.
       *
       * Tenant scope is mandatory.
       */
      const lead =
        await Lead.findOne({
          _id:
            leadId,

          organizationId,
        });

      if (!lead) {
        console.error(
          "❌ Lead intent persistence failed: lead not found in organization:",
          {
            leadId,
            organizationId,
          }
        );

        return {
          success:
            false,

          updated:
            false,

          intent:
            null,

          error:
            "Lead not found.",
        };
      }

      /* ======================================================
         6. DEFENSE-IN-DEPTH ORGANIZATION CHECK
      ====================================================== */

      if (
        !lead.organizationId
      ) {
        console.error(
          "🛑 Lead intent persistence blocked: lead has no organization.",
          {
            leadId:
              String(
                lead._id
              ),
          }
        );

        return {
          success:
            false,

          updated:
            false,

          intent:
            null,

          error:
            "Lead has no organization.",
        };
      }

      if (
        String(
          lead.organizationId
        ) !==
        String(
          organizationId
        )
      ) {
        console.error(
          "🛑 CROSS-ORGANIZATION LEAD ACCESS BLOCKED:",
          {
            leadId:
              String(
                lead._id
              ),

            leadOrganization:
              String(
                lead.organizationId
              ),

            requestedOrganization:
              String(
                organizationId
              ),
          }
        );

        return {
          success:
            false,

          updated:
            false,

          intent:
            null,

          error:
            "Lead organization mismatch.",
        };
      }

      /* ======================================================
         7. EXISTING INTENT
      ====================================================== */

      const previousIntent =
        normalizeIntent(
          lead.intent
        );

      console.log(
        "🧠 EXISTING LEAD INTENT:",
        previousIntent ||
          "(none)"
      );

      /* ======================================================
         8. WRITE CANONICAL INTENT
      ====================================================== */

      /**
       * The persistence layer does NOT interpret customer
       * language.
       *
       * It only persists the already-detected canonical intent.
       */
      lead.intent =
        normalizedIntent;

      console.log(
        "🎯 LEAD INTENT BEFORE SAVE:",
        lead.intent
      );

      /* ======================================================
         9. RECALCULATE CANONICAL SCORE
      ====================================================== */

      /**
       * Score authority remains:
       *
       *   leadScoringRulesEngine.js
       *
       * This service does not invent or modify scoring rules.
       */
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
        "🏷️ LEAD SCORE CATEGORY AFTER INTENT:",
        category
      );

      /* ======================================================
         10. PERSIST SCORE
      ====================================================== */

      lead.score =
        score;

      /* ======================================================
         11. OPTIONAL SCORE CATEGORY
      ====================================================== */

      /**
       * Some older Lead schemas may contain a category field.
       *
       * If it exists, it represents the SCORE CATEGORY only.
       *
       * It does NOT represent lifecycle state.
       *
       * We intentionally DO NOT write:
       *
       *   lead.stage = category
       *
       * because "stage" can be confused with Lead.status and
       * would violate the canonical lifecycle semantics.
       */
      if (
        hasLeadField(
          "category"
        )
      ) {
        lead.category =
          category;
      }

      /* ======================================================
         12. SAVE
      ====================================================== */

      await lead.save();

      console.log(
        "✅ LEAD INTENT + SCORE SAVED"
      );

      /* ======================================================
         13. RELOAD FROM DATABASE
      ====================================================== */

      /**
       * IMPORTANT:
       *
       * organizationId MUST be selected here because the
       * verification layer performs a second tenant check.
       */
      const persistedLead =
        await Lead.findOne({
          _id:
            lead._id,

          organizationId,
        }).select(
          "organizationId intent score category"
        );

      if (!persistedLead) {
        console.error(
          "❌ Lead intent persistence verification failed: persisted lead could not be reloaded."
        );

        return {
          success:
            false,

          updated:
            false,

          intent:
            null,

          error:
            "Lead could not be reloaded after persistence.",
        };
      }

      /* ======================================================
         14. DEFENSE-IN-DEPTH VERIFICATION
      ====================================================== */

      if (
        !persistedLead.organizationId
      ) {
        console.error(
          "🛑 Persistence verification failed: persisted lead has no organization."
        );

        return {
          success:
            false,

          updated:
            false,

          intent:
            null,

          error:
            "Persisted lead has no organization.",
        };
      }

      if (
        String(
          persistedLead.organizationId
        ) !==
        String(
          organizationId
        )
      ) {
        console.error(
          "🛑 CROSS-ORGANIZATION PERSISTENCE VERIFICATION BLOCKED:",
          {
            leadId:
              String(
                persistedLead._id
              ),

            leadOrganization:
              String(
                persistedLead.organizationId
              ),

            requestedOrganization:
              String(
                organizationId
              ),
          }
        );

        return {
          success:
            false,

          updated:
            false,

          intent:
            null,

          error:
            "Persisted lead organization mismatch.",
        };
      }

      /* ======================================================
         15. VERIFY PERSISTED INTENT
      ====================================================== */

      const persistedIntent =
        normalizeIntent(
          persistedLead.intent
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
        "Organization ID:",
        organizationId
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
        "Persisted Score:",
        persistedLead.score
      );

      console.log(
        "Persisted Score Category:",
        persistedLead.category ||
          category
      );

      console.log(
        "================================================"
      );

      /* ======================================================
         16. VERIFY INTENT PERSISTENCE
      ====================================================== */

      if (
        persistedIntent !==
        normalizedIntent
      ) {
        console.error(
          "❌ INTENT PERSISTENCE VERIFICATION FAILED"
        );

        return {
          success:
            false,

          updated:
            false,

          intent:
            persistedIntent ||
            null,

          score:
            persistedLead.score ??
            0,

          category:
            persistedLead.category ||
            category,

          error:
            "Intent was not persisted correctly.",

          lead:
            persistedLead,
        };
      }

      /* ======================================================
         17. SUCCESS
      ====================================================== */

      const updated =
        previousIntent !==
        persistedIntent;

      return {
        success:
          true,

        updated,

        leadId:
          persistedLead._id,

        previousIntent:
          previousIntent ||
          null,

        intent:
          persistedIntent,

        score:
          Number(
            persistedLead.score ||
              0
          ),

        /**
         * Score category only.
         *
         * This is NOT Lead.status.
         */
        category:
          persistedLead.category ||
          category,

        lead:
          persistedLead,
      };
    } catch (error) {
      console.error(
        "❌ Lead intent persistence error:",
        error
      );

      console.error(
        error?.stack
      );

      return {
        success:
          false,

        updated:
          false,

        intent:
          null,

        error:
          error?.message ||
          "Failed to persist lead intent.",
      };
    }
  };

/* ============================================================
   GET PERSISTED INTENT
============================================================ */

export const getPersistedLeadIntent =
  async (
    leadId,
    organizationId
  ) => {
    try {
      /* ======================================================
         1. VALIDATE LEAD ID
      ====================================================== */

      if (
        !isValidLeadId(
          leadId
        )
      ) {
        return {
          success:
            false,

          intent:
            null,

          error:
            "Invalid lead ID.",
        };
      }

      /* ======================================================
         2. VALIDATE ORGANIZATION ID
      ====================================================== */

      if (
        !isValidOrganizationId(
          organizationId
        )
      ) {
        console.error(
          "❌ Cannot retrieve lead intent: invalid or missing organizationId."
        );

        return {
          success:
            false,

          intent:
            null,

          error:
            "Valid organization ID is required.",
        };
      }

      /* ======================================================
         3. FIND LEAD — TENANT SCOPED
      ====================================================== */

      /**
       * organizationId is intentionally selected because the
       * defense-in-depth check below depends on it.
       */
      const lead =
        await Lead.findOne({
          _id:
            leadId,

          organizationId,
        }).select(
          "organizationId intent score category"
        );

      if (!lead) {
        return {
          success:
            false,

          intent:
            null,

          error:
            "Lead not found.",
        };
      }

      /* ======================================================
         4. DEFENSE-IN-DEPTH ORGANIZATION CHECK
      ====================================================== */

      if (
        !lead.organizationId
      ) {
        console.error(
          "🛑 Cannot retrieve lead intent: lead has no organization."
        );

        return {
          success:
            false,

          intent:
            null,

          error:
            "Lead has no organization.",
        };
      }

      if (
        String(
          lead.organizationId
        ) !==
        String(
          organizationId
        )
      ) {
        console.error(
          "🛑 CROSS-ORGANIZATION LEAD INTENT ACCESS BLOCKED:",
          {
            leadId:
              String(
                lead._id
              ),

            leadOrganization:
              String(
                lead.organizationId
              ),

            requestedOrganization:
              String(
                organizationId
              ),
          }
        );

        return {
          success:
            false,

          intent:
            null,

          error:
            "Lead organization mismatch.",
        };
      }

      /* ======================================================
         5. NORMALIZE PERSISTED INTENT
      ====================================================== */

      const persistedIntent =
        normalizeIntent(
          lead.intent
        );

      /* ======================================================
         6. RETURN
      ====================================================== */

      return {
        success:
          true,

        intent:
          persistedIntent ||
          null,

        score:
          Number(
            lead.score ||
              0
          ),

        /**
         * Score category.
         *
         * NOT Lead.status.
         */
        category:
          lead.category ||
          getLeadCategory(
            Number(
              lead.score ||
                0
            )
          ),
      };
    } catch (error) {
      console.error(
        "❌ Get persisted lead intent error:",
        error
      );

      console.error(
        error?.stack
      );

      return {
        success:
          false,

        intent:
          null,

        error:
          error?.message ||
          "Failed to retrieve lead intent.",
      };
    }
  };

/* ============================================================
   UPDATE INTENT ONLY
============================================================ */

/**
 * Compatibility wrapper.
 *
 * The actual implementation remains centralized in
 * persistLeadIntent().
 */
export const updateLeadIntent =
  async (
    leadId,
    intent,
    organizationId
  ) => {
    return persistLeadIntent(
      leadId,
      intent,
      organizationId
    );
  };

/* ============================================================
   OPTIONAL NORMALIZER EXPORT
============================================================ */

/**
 * Exporting this utility makes it possible for other
 * persistence-facing services to use exactly the same
 * canonical normalization without importing the AI reply
 * service.
 *
 * It still does NOT detect intent.
 */
export {
  normalizeIntent,
};

/* ============================================================
   DEFAULT EXPORT
============================================================ */

export default {
  persistLeadIntent,

  getPersistedLeadIntent,

  updateLeadIntent,

  normalizeIntent,
};