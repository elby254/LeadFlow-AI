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
 * ✓ Applying weighted qualification rules
 * ✓ Classifying leads into lifecycle stages
 * ✓ Supporting organization-level scoring configuration
 * ✓ Feeding the AI ingestion workflow
 * ✓ Feeding the lead lifecycle workflow
 * ✓ Feeding the automatic agent assignment workflow
 *
 * ===========================================================
 *
 * LIFECYCLE ALIGNMENT
 * ------------------------------------------------------------
 *
 * Score       Category       Assignment Strategy
 * ------------------------------------------------------------
 * 0–49        new            Round robin
 * 50–79       qualified      Least-busy agent
 * 80–100      hot            Best-performing agent
 *
 * IMPORTANT
 * ------------------------------------------------------------
 * This service ONLY calculates score/category.
 *
 * It does NOT assign agents.
 *
 * Agent assignment is handled by:
 *
 * services/leadAutoAssignmentService.js
 *
 * ===========================================================
 *
 * INTENT ALIGNMENT
 * ------------------------------------------------------------
 *
 * Lead.intent is the customer's expressed transaction intent.
 *
 * Canonical values:
 *
 *     property_search
 *     rent
 *     buy
 *
 * IMPORTANT
 * ------------------------------------------------------------
 *
 * This engine does NOT determine customer intent.
 *
 * Intent is determined by the AI/deterministic extraction
 * layer and persisted through the intent persistence service.
 *
 * This engine only:
 *
 * ✓ Reads persisted Lead.intent
 * ✓ Normalizes it for scoring
 * ✓ Uses its existence as a scoring signal
 *
 * It does NOT convert:
 *
 *     property_search -> rent
 *     property_search -> buy
 *
 * without explicit customer intent.
 *
 * ===========================================================
 */

import Lead from "../models/lead.js";

// ============================================================
// DEFAULT WEIGHTS
// ============================================================
//
// Total = 100
//
// These are the global baseline weights.
//
// Future SaaS enhancement:
// Each organization can have its own scoring configuration.
//

const DEFAULT_WEIGHTS = {
  intent: 30,
  budget: 25,
  location: 20,
  bedrooms: 15,
  urgency: 10,
};

// ============================================================
// HIGH-DEMAND LOCATIONS
// ============================================================

const HIGH_DEMAND_LOCATIONS = [
  "ruaka",
  "kiambu",
  "kileleshwa",
  "westlands",
  "ruiru",
];

// ============================================================
// URGENCY KEYWORDS
// ============================================================

const URGENCY_KEYWORDS = [
  "urgent",
  "urgently",
  "asap",
  "immediately",
  "immediate",
  "as soon as possible",
  "right away",
  "need it now",
  "this week",
  "this month",
  "today",
  "tomorrow",
];

// ============================================================
// INTENT VALUES
// ============================================================
//
// IMPORTANT
// ------------------------------------------------------------
//
// These are the canonical LeadFlow AI intent values.
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
// IMPORTANT:
//
// "lease" is NOT persisted as a separate intent.
// It is normalized to:
//
//     rent
//
// "purchase" is NOT persisted as a separate intent.
// It is normalized to:
//
//     buy
//
// ============================================================

const VALID_INTENTS = [
  "property_search",
  "rent",
  "buy",
];

// ============================================================
// GET ORGANIZATION WEIGHTS
// ============================================================
//
// Future multi-tenant SaaS upgrade.
//
// Eventually:
//
// Organization
//      ↓
// ScoringConfiguration
//      ↓
// Organization-specific weights
//
// For now we use the global baseline.
//

export const getOrgWeights = (
  organizationId
) => {
  if (!organizationId) {
    return DEFAULT_WEIGHTS;
  }

  return DEFAULT_WEIGHTS;
};

// ============================================================
// NORMALIZE TEXT
// ============================================================

const normalizeText = (
  value
) => {
  if (
    value === undefined ||
    value === null
  ) {
    return "";
  }

  return String(value)
    .trim()
    .toLowerCase();
};

// ============================================================
// NORMALIZE INTENT
// ============================================================
//
// IMPORTANT
// ------------------------------------------------------------
//
// This function normalizes equivalent intent expressions into
// the canonical LeadFlow AI vocabulary:
//
//     property_search
//     rent
//     buy
//
// Examples:
//
// "Buy"
// "BUY"
// "buying"
// "I want to buy"
// "purchase"
// "purchasing"
//     -> buy
//
// "Rent"
// "renting"
// "rental"
// "lease"
// "leasing"
// "I want to rent"
//     -> rent
//
// "property_search"
// "property search"
// "looking for a property"
//     -> property_search
//
// IMPORTANT:
//
// This function does NOT infer transaction intent from unrelated
// information such as budget, location, bedrooms, or move date.
//
// ============================================================

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

  // ==========================================================
  // BUY
  // ==========================================================

  if (
    intent === "buy" ||
    intent === "buying" ||
    intent === "purchase" ||
    intent === "purchasing" ||
    intent === "property_purchase" ||
    intent === "property-purchase" ||
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

  // ==========================================================
  // RENT
  // ==========================================================

  if (
    intent === "rent" ||
    intent === "renting" ||
    intent === "rental" ||
    intent === "lease" ||
    intent === "leasing" ||
    intent === "property_rental" ||
    intent === "property-rental" ||
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

  // ==========================================================
  // GENERIC PROPERTY SEARCH
  // ==========================================================

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

  // ==========================================================
  // LEGACY / OTHER VALUES
  // ==========================================================
  //
  // IMPORTANT:
  //
  // We intentionally do NOT convert unrelated values such as:
  //
  //     viewing
  //     inquiry
  //     sell
  //     invest
  //
  // into one of the canonical transaction intents.
  //
  // The scoring layer must not guess what the customer wants.
  //
  // Returning the normalized value here allows compatibility
  // with existing data while VALID_INTENTS below determines
  // whether it is a valid canonical transaction intent.
  //
  // ==========================================================

  return intent;
};

// ============================================================
// VALID CANONICAL INTENT
// ============================================================

const isValidIntent = (
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

// ============================================================
// NUMERIC VALUE HELPER
// ============================================================

const toNumber = (
  value
) => {
  const number =
    Number(value);

  return Number.isFinite(
    number
  )
    ? number
    : 0;
};

// ============================================================
// GET PERSISTED INTENT
// ============================================================
//
// Reads intent without modifying the Lead.
//
// Priority:
//
// 1. lead.intent
// 2. lead.customerIntent
//
// This allows compatibility with older lead documents.
//
// IMPORTANT
// ------------------------------------------------------------
//
// lead.intent is the current source of truth.
//
// customerIntent is retained only as a compatibility fallback.
//
// The returned value is normalized into:
//
//     property_search
//     rent
//     buy
//
// ============================================================

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

  // ==========================================================
  // ONLY RETURN CANONICAL INTENTS
  // ==========================================================

  if (
    isValidIntent(
      normalizedIntent
    )
  ) {
    return normalizedIntent;
  }

  // ==========================================================
  // UNKNOWN / LEGACY INTENT
  // ==========================================================
  //
  // Do not invent a transaction intent.
  //
  // For example:
  //
  // viewing
  // inquiry
  // sell
  // invest
  //
  // should not automatically become rent/buy/search.
  //
  // ==========================================================

  return "";
};

// ============================================================
// PERSIST LEAD INTENT
// ============================================================
//
// IMPORTANT
// ------------------------------------------------------------
//
// This function is the explicit persistence boundary.
//
// Scoring functions remain pure and do NOT automatically
// modify MongoDB.
//
// Call this after AI/user intent has been determined.
//
// Example:
//
// await persistLeadIntent(
//   lead._id,
//   extracted.intent
// );
//
// IMPORTANT
// ------------------------------------------------------------
//
// This compatibility function uses the same canonical intent
// semantics as the main intent persistence service.
//
// Canonical values:
//
//     property_search
//     rent
//     buy
//
// ============================================================

export const persistLeadIntent = async (
  leadId,
  intent
) => {
  if (!leadId) {
    throw new Error(
      "Lead ID is required to persist intent."
    );
  }

  const normalizedIntent =
    normalizeIntent(
      intent
    );

  // ==========================================================
  // NEVER WRITE UNKNOWN / EMPTY INTENT
  // ==========================================================

  if (
    !isValidIntent(
      normalizedIntent
    )
  ) {
    console.log(
      "[LeadScoringRulesEngine] Intent persistence skipped:",
      intent || "(empty/unsupported)"
    );

    return null;
  }

  const updatedLead =
    await Lead.findByIdAndUpdate(
      leadId,
      {
        $set: {
          intent:
            normalizedIntent,
        },
      },
      {
        new: true,
        runValidators: true,
      }
    );

  if (!updatedLead) {
    throw new Error(
      `Lead not found while persisting intent: ${leadId}`
    );
  }

  console.log(
    `[LeadScoringRulesEngine] Intent persisted: ${normalizedIntent} for lead ${leadId}`
  );

  return updatedLead;
};

// ============================================================
// INTENT SCORING
// ============================================================

const calculateIntentScore = (
  lead,
  weights
) => {

  // ----------------------------------------------------------
  // IMPORTANT
  // ----------------------------------------------------------
  //
  // Use the persisted intent first.
  //
  // This means once intent has been saved to the Lead,
  // subsequent scoring requests continue to see it.
  //
  // ----------------------------------------------------------

  const intent =
    getPersistedLeadIntent(
      lead
    );

  console.log(
    "[LeadScoringRulesEngine] Persisted intent for scoring:",
    intent || "(none)"
  );

  if (
    isValidIntent(
      intent
    )
  ) {
    return weights.intent;
  }

  // ----------------------------------------------------------
  // WhatsApp leads indicate active inbound intent.
  // ----------------------------------------------------------

  const source =
    normalizeText(
      lead.source
    );

  if (
    source ===
    "whatsapp"
  ) {
    return weights.intent;
  }

  // ----------------------------------------------------------
  // Other known active communication channels
  // ----------------------------------------------------------

  if (
    source === "sms" ||
    source === "web" ||
    source === "website" ||
    source === "chat"
  ) {
    return (
      weights.intent *
      0.8
    );
  }

  return 0;
};

// ============================================================
// BUDGET SCORING
// ============================================================

const calculateBudgetScore = (
  lead,
  weights
) => {
  const budget =
    toNumber(
      lead.budget
    );

  if (
    !budget ||
    budget <= 0
  ) {
    return 0;
  }

  if (
    budget >= 200000
  ) {
    return weights.budget;
  }

  if (
    budget >= 100000
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

// ============================================================
// LOCATION SCORING
// ============================================================

const calculateLocationScore = (
  lead,
  weights
) => {
  const location =
    normalizeText(
      lead.location
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

// ============================================================
// BEDROOM SCORING
// ============================================================

const calculateBedroomScore = (
  lead,
  weights
) => {
  const bedrooms =
    toNumber(
      lead.bedrooms
    );

  if (
    !bedrooms ||
    bedrooms <= 0
  ) {
    return 0;
  }

  if (
    bedrooms >= 3
  ) {
    return weights.bedrooms;
  }

  return (
    weights.bedrooms *
    0.7
  );
};

// ============================================================
// URGENCY SCORING
// ============================================================

const calculateUrgencyScore = (
  lead,
  weights
) => {
  if (
    lead?.urgent === true
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
      (keyword) =>
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

// ============================================================
// CORE SCORE CALCULATION
// ============================================================
//
// Returns an integer between 0 and 100.
//
// IMPORTANT:
// This function does NOT save anything to MongoDB.
//

export const calculateLeadScore = (
  lead
) => {
  if (!lead) {
    return 0;
  }

  let score = 0;

  const weights =
    getOrgWeights(
      lead.organizationId
    );

  // ==========================================================
  // 1. INTENT
  // ==========================================================

  score +=
    calculateIntentScore(
      lead,
      weights
    );

  // ==========================================================
  // 2. BUDGET
  // ==========================================================

  score +=
    calculateBudgetScore(
      lead,
      weights
    );

  // ==========================================================
  // 3. LOCATION
  // ==========================================================

  score +=
    calculateLocationScore(
      lead,
      weights
    );

  // ==========================================================
  // 4. BEDROOMS
  // ==========================================================

  score +=
    calculateBedroomScore(
      lead,
      weights
    );

  // ==========================================================
  // 5. URGENCY
  // ==========================================================

  score +=
    calculateUrgencyScore(
      lead,
      weights
    );

  // ==========================================================
  // NORMALIZATION
  // ==========================================================

  score = Math.max(
    0,
    Math.min(
      100,
      score
    )
  );

  console.log(
    "[LeadScoringRulesEngine] Final lead score:",
    Math.round(score)
  );

  return Math.round(
    score
  );
};

// ============================================================
// LEAD CATEGORY CLASSIFIER
// ============================================================
//
// IMPORTANT
// ------------------------------------------------------------
//
// "hot" is a SCORING CATEGORY.
//
// It is NOT Lead.status.
//
// Lead.status remains:
//
//     new
//     contacted
//     qualified
//     viewing
//     negotiation
//     won
//     lost
//
// Therefore this function returning:
//
//     hot
//
// does NOT mean:
//
//     lead.status = "hot"
//
// ============================================================

export const getLeadCategory = (
  score
) => {
  const normalizedScore =
    Math.max(
      0,
      Math.min(
        100,
        Number(score) || 0
      )
    );

  if (
    normalizedScore >= 80
  ) {
    return "hot";
  }

  if (
    normalizedScore >= 50
  ) {
    return "qualified";
  }

  return "new";
};

// ============================================================
// COMPLETE SCORING RESULT
// ============================================================

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

// ============================================================
// AI SCORE ENHANCER
// ============================================================

export const aiScoreEnhancer =
  async (
    lead
  ) => {
    if (!lead) {
      return {
        aiBoost: 0,
      };
    }

    return {
      aiBoost: 0,
    };
  };

// ============================================================
// OPTIONAL AI + RULE SCORE
// ============================================================

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
      Math.max(
        0,
        Math.min(
          100,
          baseScore +
            aiBoost
        )
      );

    return Math.round(
      finalScore
    );
  };

// ============================================================
// DEBUG / EXPLANATION HELPER
// ============================================================

export const explainLeadScore = (
  lead
) => {
  if (!lead) {
    return {
      score: 0,
      category: "new",
      intent: "",
      breakdown: {},
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
      Object.values(
        breakdown
      ).reduce(
        (
          total,
          value
        ) =>
          total + value,
        0
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

// ============================================================
// DEFAULT EXPORT
// ============================================================

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

  persistLeadIntent,
};