/**
 * ===========================================================
 *
 * LEAD SCORING RULES ENGINE
 *
 * ===========================================================
 *
 * PURPOSE
 * ------------------------------------------------------------
 * Central intelligence engine responsible for:
 *
 * ✓ Converting lead information into a score from 0–100
 * ✓ Applying weighted scoring rules
 * ✓ Classifying leads into score bands
 * ✓ Supporting organization-level scoring configuration
 * ✓ Feeding the AI ingestion workflow
 * ✓ Feeding the lead lifecycle workflow
 * ✓ Feeding the automatic agent assignment workflow
 *
 * ===========================================================
 *
 * CANONICAL ARCHITECTURE
 * ===========================================================
 *
 * IMPORTANT
 * ------------------------------------------------------------
 *
 * This service owns:
 *
 *     LEAD SCORE
 *     LEAD SCORE CATEGORY
 *
 * It does NOT own:
 *
 *     Lead.status
 *     Agent assignment
 *     Viewing state
 *     Follow-up state
 *
 * Those responsibilities belong to separate services.
 *
 * ------------------------------------------------------------
 *
 * LIFECYCLE AUTHORITY
 * ------------------------------------------------------------
 *
 * services/leadLifeCycleService.js
 *
 * Canonical Lead.status values:
 *
 *     new
 *     contacted
 *     qualified
 *     viewing
 *     negotiation
 *     won
 *     lost
 *
 * ------------------------------------------------------------
 *
 * SCORING AUTHORITY
 * ------------------------------------------------------------
 *
 * This service calculates:
 *
 *     score:    0–100
 *
 *     category:
 *       new
 *       qualified
 *       hot
 *
 * IMPORTANT:
 *
 * "hot" is a SCORE CATEGORY.
 *
 * "hot" is NOT a Lead.status value.
 *
 * ===========================================================
 *
 * CANONICAL SCORE BANDS
 * ===========================================================
 *
 * Score       Category
 * --------------------
 *
 * 0–49        new
 * 50–79       qualified
 * 80–100      hot
 *
 * HOT_THRESHOLD = 80
 *
 * ===========================================================
 *
 * SCORE WEIGHTS
 * ===========================================================
 *
 * intent      30
 * budget      25
 * location    20
 * bedrooms    15
 * urgency     10
 *
 * Total       100
 *
 * ===========================================================
 *
 * INTENT ALIGNMENT
 * ===========================================================
 *
 * Lead.intent is the customer's expressed transaction intent.
 *
 * Canonical values:
 *
 *     property_search
 *     rent
 *     buy
 *
 * This scoring engine does NOT invent customer intent.
 *
 * It reads the already persisted intent and uses it as a
 * scoring signal.
 *
 * Channel source alone does NOT constitute transaction intent.
 *
 * Example:
 *
 * WhatsApp + no stated intent
 *
 *     intent score = 0
 *
 * WhatsApp + customer explicitly wants to rent
 *
 *     intent score = full intent weight
 *
 * ===========================================================
 */

import {
  // Intentionally no Lead model import here.
  //
  // Lead persistence belongs to:
  //
  // services/leadIntentPersistenceService.js
} from "./leadIntentPersistenceService.js";

/*
 * The scoring engine must remain free of direct persistence
 * responsibility.
 *
 * IMPORTANT:
 * ------------------------------------------------------------
 * The import above is intentionally NOT used directly because
 * leadIntentPersistenceService.js imports scoring functions.
 *
 * To avoid a static circular dependency, the compatibility
 * persistence wrapper below uses a dynamic import.
 */

/* ============================================================
   CANONICAL SCORE THRESHOLDS
============================================================ */

// These values are part of the LeadFlow AI scoring contract.
//
// Other services should import these constants rather than
// creating their own thresholds.
//

export const NEW_SCORE_MAX =
  49;

export const QUALIFIED_SCORE_MIN =
  50;

export const QUALIFIED_SCORE_MAX =
  79;

export const HOT_SCORE_THRESHOLD =
  80;

export const MAX_LEAD_SCORE =
  100;

/* ============================================================
   CANONICAL SCORE CATEGORIES
============================================================ */

// IMPORTANT:
// These are score categories, NOT Lead.status values.
//

export const LEAD_SCORE_CATEGORIES =
  Object.freeze({
    NEW:
      "new",

    QUALIFIED:
      "qualified",

    HOT:
      "hot",
  });

/* ============================================================
   DEFAULT WEIGHTS
============================================================ */

// Total = 100
//
// Future SaaS enhancement:
// Each organization can have its own scoring configuration.
//

export const DEFAULT_WEIGHTS =
  Object.freeze({
    intent:
      30,

    budget:
      25,

    location:
      20,

    bedrooms:
      15,

    urgency:
      10,
  });

/* ============================================================
   HIGH-DEMAND LOCATIONS
============================================================ */

export const HIGH_DEMAND_LOCATIONS =
  Object.freeze([
    "ruaka",

    "kiambu",

    "kileleshwa",

    "westlands",

    "ruiru",
  ]);

/* ============================================================
   URGENCY KEYWORDS
============================================================ */

export const URGENCY_KEYWORDS =
  Object.freeze([
    "urgent",

    "urgently",

    "asap",

    "immediately",

    "immediate",

    "as soon as possible",

    "right away",

    "need it now",

    "this week",

    "next week",

    "this month",

    "next month",

    "today",

    "tomorrow",

    "within 7 days",

    "within 30 days",
  ]);

/* ============================================================
   INTENT VALUES
============================================================ */

// Canonical LeadFlow AI intent values.
//
// property_search:
//     Customer is looking for a property but has NOT explicitly
//     stated whether they want to rent or buy.
//
// rent:
//     Customer explicitly wants to rent / lease a property.
//
// buy:
//     Customer explicitly wants to buy / purchase a property.
//

export const VALID_INTENTS =
  Object.freeze([
    "property_search",

    "rent",

    "buy",
  ]);

/* ============================================================
   GET ORGANIZATION WEIGHTS
============================================================ */

// Future multi-tenant SaaS upgrade:
//
// Organization
//      ↓
// ScoringConfiguration
//      ↓
// Organization-specific weights
//
// For now the global baseline is returned.
//
// IMPORTANT:
// A copy is returned so callers cannot mutate the shared
// DEFAULT_WEIGHTS object.
//

export const getOrgWeights = (
  organizationId
) => {
  if (!organizationId) {
    return {
      ...DEFAULT_WEIGHTS,
    };
  }

  return {
    ...DEFAULT_WEIGHTS,
  };
};

/* ============================================================
   NORMALIZE TEXT
============================================================ */

const normalizeText = (
  value
) => {
  if (
    value ===
      undefined ||
    value ===
      null
  ) {
    return "";
  }

  return String(
    value
  )
    .trim()
    .toLowerCase();
};

/* ============================================================
   NORMALIZE INTENT
============================================================ */

// Equivalent expressions are normalized to:
//
//     property_search
//     rent
//     buy
//
// IMPORTANT:
// This function does NOT infer intent from:
//
//     budget
//     location
//     bedrooms
//     move date
//     channel
//

export const normalizeIntent = (
  value
) => {
  const intent =
    normalizeText(
      value
    );

  if (!intent) {
    return "";
  }

  /* ========================================================
     BUY
  ======================================================== */

  if (
    intent ===
      "buy" ||
    intent ===
      "buying" ||
    intent ===
      "purchase" ||
    intent ===
      "purchasing" ||
    intent ===
      "property_purchase" ||
    intent ===
      "property-purchase" ||
    intent.includes(
      "want to buy"
    ) ||
    intent.includes(
      "looking to buy"
    ) ||
    intent.includes(
      "looking to purchase"
    ) ||
    intent.includes(
      "want to purchase"
    )
  ) {
    return "buy";
  }

  /* ========================================================
     RENT
  ======================================================== */

  if (
    intent ===
      "rent" ||
    intent ===
      "renting" ||
    intent ===
      "rental" ||
    intent ===
      "lease" ||
    intent ===
      "leasing" ||
    intent ===
      "property_rental" ||
    intent ===
      "property-rental" ||
    intent.includes(
      "want to rent"
    ) ||
    intent.includes(
      "looking to rent"
    ) ||
    intent.includes(
      "want to lease"
    ) ||
    intent.includes(
      "looking to lease"
    )
  ) {
    return "rent";
  }

  /* ========================================================
     GENERIC PROPERTY SEARCH
  ======================================================== */

  if (
    intent ===
      "property_search" ||
    intent ===
      "property-search" ||
    intent ===
      "property search" ||
    intent ===
      "search" ||
    intent ===
      "property" ||
    intent ===
      "looking for property" ||
    intent ===
      "looking for a property" ||
    intent ===
      "looking_for_property" ||
    intent ===
      "looking-for-property"
  ) {
    return "property_search";
  }

  /* ========================================================
     UNKNOWN / LEGACY
  ======================================================== */
  //
  // Do NOT guess.
  //
  // Example:
  //
  // viewing
  // inquiry
  // sell
  // invest
  //
  // These are not automatically converted into rent/buy/search.
  //
  // ========================================================

  return intent;
};

/* ============================================================
   VALID CANONICAL INTENT
============================================================ */

export const isValidCanonicalIntent = (
  value
) => {
  const normalized =
    normalizeIntent(
      value
    );

  return VALID_INTENTS.includes(
    normalized
  );
};

/* ============================================================
   NUMERIC VALUE HELPER
============================================================ */

const toNumber = (
  value
) => {
  const number =
    Number(
      value
    );

  return Number.isFinite(
    number
  )
    ? number
    : 0;
};

/* ============================================================
   NORMALIZE SCORE
============================================================ */

export const normalizeScore = (
  score
) => {
  const normalized =
    toNumber(
      score
    );

  return Math.max(
    0,

    Math.min(
      MAX_LEAD_SCORE,

      normalized
    )
  );
};

/* ============================================================
   GET PERSISTED INTENT
============================================================ */

// Priority:
//
// 1. lead.intent
// 2. lead.customerIntent
//
// customerIntent exists only as a legacy compatibility
// fallback.
//
// Current source of truth:
//     lead.intent
//

export const getPersistedLeadIntent = (
  lead
) => {
  if (!lead) {
    return "";
  }

  const intent =
    lead.intent ||
    lead.customerIntent ||
    "";

  const normalizedIntent =
    normalizeIntent(
      intent
    );

  if (
    isValidCanonicalIntent(
      normalizedIntent
    )
  ) {
    return normalizedIntent;
  }

  return "";
};

/* ============================================================
   PERSIST LEAD INTENT — COMPATIBILITY WRAPPER
============================================================ */

/**
 * IMPORTANT
 * ------------------------------------------------------------
 *
 * Lead scoring does NOT own persistence.
 *
 * Canonical persistence authority:
 *
 *   services/leadIntentPersistenceService.js
 *
 * This function remains temporarily available for compatibility
 * with existing callers that historically imported
 * persistLeadIntent() from this scoring engine.
 *
 * It delegates to the canonical persistence service.
 *
 * IMPORTANT:
 * organizationId is required.
 *
 * The dynamic import avoids a static circular dependency because
 * leadIntentPersistenceService.js imports calculateLeadScore()
 * from this module.
 */

export const persistLeadIntent =
  async (
    leadId,

    intent,

    organizationId
  ) => {
    if (!organizationId) {
      throw new Error(
        "Organization ID is required to persist intent."
      );
    }

    const {
      persistLeadIntent:
        canonicalPersistLeadIntent,
    } =
      await import(
        "./leadIntentPersistenceService.js"
      );

    return canonicalPersistLeadIntent(
      leadId,

      intent,

      organizationId
    );
  };

/* ============================================================
   INTENT SCORING
============================================================ */

// Intent points are awarded ONLY when explicit canonical
// intent exists.
//
// Channel source alone does NOT award intent points.
//

const calculateIntentScore = (
  lead,

  weights
) => {
  const intent =
    getPersistedLeadIntent(
      lead
    );

  console.log(
    "[LeadScoringRulesEngine] Persisted intent for scoring:",
    intent ||
      "(none)"
  );

  if (
    isValidCanonicalIntent(
      intent
    )
  ) {
    return weights.intent;
  }

  return 0;
};

/* ============================================================
   BUDGET SCORING
============================================================ */

// Current scoring semantics:
//
// No usable budget:
//     0
//
// KES 1–99,999:
//     50% of budget weight
//
// KES 100,000–199,999:
//     80% of budget weight
//
// KES 200,000+:
//     100% of budget weight
//
// IMPORTANT:
// This is a budget signal used by the existing LeadFlow
// scoring model. It is not itself a "budget match" against
// a particular property.
//

const calculateBudgetScore = (
  lead,

  weights
) => {
  const budget =
    toNumber(
      lead?.budget
    );

  if (
    !budget ||
    budget <= 0
  ) {
    return 0;
  }

  if (
    budget >=
    200000
  ) {
    return weights.budget;
  }

  if (
    budget >=
    100000
  ) {
    return (
      weights.budget *
      0.8
    );
  }

  return (
    weights.budget *
    0.5
  );
};

/* ============================================================
   LOCATION SCORING
============================================================ */

// No location:
//     0
//
// Known location but not in high-demand list:
//     60% of location weight
//
// High-demand location:
//     100% of location weight
//

const calculateLocationScore = (
  lead,

  weights
) => {
  const location =
    normalizeText(
      lead?.location
    );

  if (!location) {
    return 0;
  }

  const isHighDemandLocation =
    HIGH_DEMAND_LOCATIONS.some(
      (
        highDemandLocation
      ) =>
        location.includes(
          highDemandLocation
        )
    );

  if (
    isHighDemandLocation
  ) {
    return weights.location;
  }

  return (
    weights.location *
    0.6
  );
};

/* ============================================================
   BEDROOM SCORING
============================================================ */

// No usable bedroom value:
//     0
//
// 1–2 bedrooms:
//     70% of bedroom weight
//
// 3+ bedrooms:
//     100% of bedroom weight
//

const calculateBedroomScore = (
  lead,

  weights
) => {
  const bedrooms =
    toNumber(
      lead?.bedrooms
    );

  if (
    !bedrooms ||
    bedrooms <= 0
  ) {
    return 0;
  }

  if (
    bedrooms >=
    3
  ) {
    return weights.bedrooms;
  }

  return (
    weights.bedrooms *
    0.7
  );
};

/* ============================================================
   URGENCY SCORING
============================================================ */

// Urgency can come from:
// ✓ lead.urgent
// ✓ moveDate text containing a recognized urgency signal
//

const calculateUrgencyScore = (
  lead,

  weights
) => {
  if (
    lead?.urgent ===
    true
  ) {
    return weights.urgency;
  }

  const moveDate =
    normalizeText(
      lead?.moveDate
    );

  if (!moveDate) {
    return 0;
  }

  const isUrgent =
    URGENCY_KEYWORDS.some(
      (
        keyword
      ) =>
        moveDate.includes(
          keyword
        )
    );

  if (
    isUrgent
  ) {
    return weights.urgency;
  }

  return 0;
};

/* ============================================================
   CORE SCORE CALCULATION
============================================================ */

// Returns:
//     integer 0–100
//
// IMPORTANT:
// This function does NOT:
//
// ❌ modify Lead.status
// ❌ set Lead.intent
// ❌ assign an agent
// ❌ update MongoDB
//
// It only calculates a score.
//

export const calculateLeadScore = (
  lead
) => {
  if (!lead) {
    return 0;
  }

  let score =
    0;

  const weights =
    getOrgWeights(
      lead.organizationId
    );

  /* ========================================================
     1. INTENT
  ======================================================== */

  score +=
    calculateIntentScore(
      lead,

      weights
    );

  /* ========================================================
     2. BUDGET
  ======================================================== */

  score +=
    calculateBudgetScore(
      lead,

      weights
    );

  /* ========================================================
     3. LOCATION
  ======================================================== */

  score +=
    calculateLocationScore(
      lead,

      weights
    );

  /* ========================================================
     4. BEDROOMS
  ======================================================== */

  score +=
    calculateBedroomScore(
      lead,

      weights
    );

  /* ========================================================
     5. URGENCY
  ======================================================== */

  score +=
    calculateUrgencyScore(
      lead,

      weights
    );

  /* ========================================================
     NORMALIZATION
  ======================================================== */

  const normalizedScore =
    normalizeScore(
      score
    );

  console.log(
    "[LeadScoringRulesEngine] Final lead score:",
    Math.round(
      normalizedScore
    )
  );

  return Math.round(
    normalizedScore
  );
};

/* ============================================================
   LEAD SCORE CATEGORY
============================================================ */

// IMPORTANT:
//
// These are SCORE BANDS.
//
// They do NOT write to Lead.status.
//

export const getLeadCategory = (
  score
) => {
  const normalizedScore =
    normalizeScore(
      score
    );

  if (
    normalizedScore >=
    HOT_SCORE_THRESHOLD
  ) {
    return (
      LEAD_SCORE_CATEGORIES.HOT
    );
  }

  if (
    normalizedScore >=
    QUALIFIED_SCORE_MIN
  ) {
    return (
      LEAD_SCORE_CATEGORIES.QUALIFIED
    );
  }

  return (
    LEAD_SCORE_CATEGORIES.NEW
  );
};

/* ============================================================
   HOT SCORE CHECK
============================================================ */

// Canonical HOT threshold:
//     80
//

export const isHotScore = (
  score
) => {
  return (
    normalizeScore(
      score
    ) >=
    HOT_SCORE_THRESHOLD
  );
};

/* ============================================================
   COMPLETE SCORING RESULT
============================================================ */

// Returns the scoring contract:
//
// {
//   score,
//   category,
//   intent
// }
//
// IMPORTANT:
// category is NOT Lead.status.
//

export const evaluateLead = (
  lead
) => {
  const score =
    calculateLeadScore(
      lead
    );

  const category =
    getLeadCategory(
      score
    );

  return {
    score,

    category,

    intent:
      getPersistedLeadIntent(
        lead
      ),
  };
};

/* ============================================================
   AI SCORE ENHANCER
============================================================ */

// Extension point for future structured AI scoring.
//
// IMPORTANT:
// Any future AI boost MUST remain bounded inside 0–100 and
// MUST NOT directly modify Lead.status.
//

export const aiScoreEnhancer =
  async (
    lead
  ) => {
    if (!lead) {
      return {
        aiBoost:
          0,
      };
    }

    return {
      aiBoost:
        0,
    };
  };

/* ============================================================
   OPTIONAL AI + RULE SCORE
============================================================ */

// This returns a final score only.
//
// It does NOT persist the score.
//

export const calculateEnhancedLeadScore =
  async (
    lead
  ) => {
    const baseScore =
      calculateLeadScore(
        lead
      );

    const aiResult =
      await aiScoreEnhancer(
        lead
      );

    const aiBoost =
      Number(
        aiResult?.aiBoost ||
          0
      );

    const finalScore =
      normalizeScore(
        baseScore +
          aiBoost
      );

    return Math.round(
      finalScore
    );
  };

/* ============================================================
   DEBUG / EXPLANATION HELPER
============================================================ */

// Returns:
//
// score
// category
// intent
// breakdown
//
// IMPORTANT:
// category remains a score category, not Lead.status.
//

export const explainLeadScore = (
  lead
) => {
  if (!lead) {
    return {
      score:
        0,

      category:
        LEAD_SCORE_CATEGORIES.NEW,

      intent:
        "",

      breakdown:
        {},
    };
  }

  const weights =
    getOrgWeights(
      lead.organizationId
    );

  const breakdown = {
    intent:
      calculateIntentScore(
        lead,

        weights
      ),

    budget:
      calculateBudgetScore(
        lead,

        weights
      ),

    location:
      calculateLocationScore(
        lead,

        weights
      ),

    bedrooms:
      calculateBedroomScore(
        lead,

        weights
      ),

    urgency:
      calculateUrgencyScore(
        lead,

        weights
      ),
  };

  const score =
    Math.round(
      normalizeScore(
        Object.values(
          breakdown
        ).reduce(
          (
            total,

            value
          ) =>
            total +
            value,

          0
        )
      )
    );

  return {
    score,

    category:
      getLeadCategory(
        score
      ),

    intent:
      getPersistedLeadIntent(
        lead
      ),

    breakdown,
  };
};

/* ============================================================
   DEFAULT EXPORT
============================================================ */

export default {
  calculateLeadScore,

  getLeadCategory,

  evaluateLead,

  calculateEnhancedLeadScore,

  aiScoreEnhancer,

  explainLeadScore,

  getOrgWeights,

  normalizeIntent,

  getPersistedLeadIntent,

  /*
   * Compatibility wrapper.
   *
   * Canonical persistence authority remains:
   * leadIntentPersistenceService.js
   */
  persistLeadIntent,

  isValidCanonicalIntent,

  normalizeScore,

  isHotScore,

  HOT_SCORE_THRESHOLD,

  NEW_SCORE_MAX,

  QUALIFIED_SCORE_MIN,

  QUALIFIED_SCORE_MAX,

  MAX_LEAD_SCORE,

  LEAD_SCORE_CATEGORIES,

  DEFAULT_WEIGHTS,

  VALID_INTENTS,
};