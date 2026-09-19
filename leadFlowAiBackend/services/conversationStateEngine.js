/**
 * ============================================================
 *
 * CONVERSATION STATE ENGINE
 *
 * LeadFlow AI
 *
 * ============================================================
 *
 * MEMORY MUTATION LAYER
 *
 * Responsible for:
 *
 * - Updating conversation state in DB
 * - Tracking qualification progress
 * - Storing missing fields state
 * - Preventing repeated AI questions
 * - Persisting last question asked
 * - Merging latest AI extraction with existing lead memory
 * - Persisting lead intent into conversation memory
 *
 * ============================================================
 */

import Conversation from "../models/conversation.js";

import {
  getMissingFields,
  detectConversationStage,
} from "./conversationContextService.js";

// ============================================================
// SAFE VALUE HELPER
// ============================================================

const hasValue = (value) => {
  return (
    value !== null &&
    value !== undefined &&
    String(value).trim() !== ""
  );
};

// ============================================================
// MERGE VALUE
// ============================================================
//
// New valid value wins.
//
// Empty/null/undefined values NEVER erase existing memory.
//
// ============================================================

const mergeValue = (
  newValue,
  oldValue
) => {
  return hasValue(newValue)
    ? newValue
    : oldValue;
};

// ============================================================
// SAFE OBJECT CONVERSION
// ============================================================

const toPlainObject = (
  value = {}
) => {
  if (!value) {
    return {};
  }

  if (
    typeof value.toObject ===
    "function"
  ) {
    return value.toObject();
  }

  return {
    ...value,
  };
};

// ============================================================
// INTENT MEMORY NORMALIZER
// ============================================================
//
// IMPORTANT
// ------------------------------------------------------------
//
// This function does NOT determine customer intent.
//
// Intent has already been determined by the extraction layer.
//
// This function only keeps the stored value consistent.
//
// Canonical Lead intent semantics:
//
// - rent
// - buy
// - property_search
//
// Legacy values are normalized only for compatibility:
//
// property_rental
// property-rental
// rental
// lease
//
//     -> rent
//
// property_purchase
// property-purchase
// purchase
//
//     -> buy
//
// property_search
// property-search
// search
//
//     -> property_search
//
// ============================================================

const normalizeIntentMemory = (
  value
) => {

  if (!hasValue(value)) {
    return null;
  }

  const intent =
    String(value)
      .trim()
      .toLowerCase();

  // ========================================================
  // EXPLICIT RENT
  // ========================================================

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
    ].includes(intent)
  ) {
    return "rent";
  }

  // ========================================================
  // EXPLICIT BUY
  // ========================================================

  if (
    [
      "buy",
      "buying",
      "purchase",
      "purchasing",
      "own",
      "ownership",
      "property_purchase",
      "property-purchase",
    ].includes(intent)
  ) {
    return "buy";
  }

  // ========================================================
  // GENERIC PROPERTY SEARCH
  // ========================================================

  if (
    [
      "property_search",
      "property-search",
      "search",
      "looking",
    ].includes(intent)
  ) {
    return "property_search";
  }

  /*
   * Unknown intent values are NOT reinterpreted.
   *
   * Returning the original normalized string preserves
   * existing Lead intent information instead of silently
   * changing its meaning.
   */

  return intent;
};

// ============================================================
// MISSING FIELD STATE
// ============================================================

const buildMissingFieldsState = (
  missing = []
) => {
  return {
    location:
      missing.includes("location"),

    budget:
      missing.includes("budget"),

    bedrooms:
      missing.includes("bedrooms"),

    moveDate:
      missing.includes("moveDate"),

    phone:
      missing.includes("phone"),
  };
};

// ============================================================
// CONVERSATION STATUS
// ============================================================
//
// Conversation.status is NOT the same as conversation.stage.
//
// Existing Conversation.status enum:
//
// - active
// - qualified
// - pending
// - closed
// - archived
//
// Existing Conversation.stage represents workflow position.
//
// Therefore:
//
// incomplete
//     -> active
//
// complete
//     -> qualified
//
// ============================================================

const determineConversationStatus = (
  stage,
  complete
) => {

  if (complete) {
    return "qualified";
  }

  /*
   * Do not use stage as status.
   *
   * For example:
   *
   * stage = "qualifying"
   * status = "active"
   */

  if (stage === "closed") {
    return "closed";
  }

  return "active";
};

// ============================================================
// MAIN FUNCTION
// ============================================================

export const updateConversationState = async (
  lead,
  conversation,
  extractedData = {},
  lastQuestionAsked = null
) => {
  try {
    console.log(
      "================================================"
    );

    console.log(
      "🧠 CONVERSATION STATE ENGINE"
    );

    console.log(
      "================================================"
    );

    // ========================================================
    // VALIDATE LEAD
    // ========================================================

    if (!lead) {
      console.error(
        "❌ Conversation State Engine: lead is missing."
      );

      return null;
    }

    // ========================================================
    // VALIDATE CONVERSATION
    // ========================================================

    if (!conversation) {
      console.error(
        "❌ Conversation State Engine: conversation is missing."
      );

      return null;
    }

    if (!conversation._id) {
      console.error(
        "❌ Conversation State Engine: conversation._id is missing."
      );

      return null;
    }

    // ========================================================
    // EXISTING LEAD
    // ========================================================

    const existingLead =
      toPlainObject(lead);

    // ========================================================
    // EXISTING SUMMARY
    // ========================================================

    const existingSummary =
      conversation?.summary || {};

    // ========================================================
    // LATEST EXTRACTION
    // ========================================================

    const extracted =
      extractedData || {};

    console.log(
      "========== EXISTING LEAD =========="
    );

    console.dir(
      existingLead,
      {
        depth: null,
      }
    );

    console.log(
      "========== EXTRACTED AI DATA =========="
    );

    console.dir(
      extracted,
      {
        depth: null,
      }
    );

    console.log(
      "========== EXISTING CONVERSATION SUMMARY =========="
    );

    console.dir(
      existingSummary,
      {
        depth: null,
      }
    );

    // ========================================================
    // MERGE LEAD MEMORY
    // ========================================================
    //
    // IMPORTANT:
    //
    // The state engine is a MEMORY layer.
    //
    // It does NOT reinterpret customer intent.
    //
    // Priority:
    //
    // 1. Latest valid extraction
    // 2. Existing conversation memory
    // 3. Existing Lead memory
    //
    // This means the extraction layer decides the meaning,
    // while this engine preserves it.
    //
    // ========================================================

    const updatedLead = {
      ...existingLead,

      // ------------------------------------------------------
      // BUDGET
      // ------------------------------------------------------

      budget:
        mergeValue(
          extracted.budget,
          mergeValue(
            existingSummary.budget,
            existingLead.budget
          )
        ),

      // ------------------------------------------------------
      // LOCATION
      // ------------------------------------------------------

      location:
        mergeValue(
          extracted.location,
          mergeValue(
            existingSummary.location,
            existingLead.location
          )
        ),

      // ------------------------------------------------------
      // BEDROOMS
      // ------------------------------------------------------

      bedrooms:
        mergeValue(
          extracted.bedrooms,
          mergeValue(
            existingSummary.bedrooms,
            existingLead.bedrooms
          )
        ),

      // ------------------------------------------------------
      // MOVE DATE
      // ------------------------------------------------------

      moveDate:
        mergeValue(
          extracted.moveDate,
          mergeValue(
            existingSummary.moveDate,
            existingLead.moveDate
          )
        ),

      // ------------------------------------------------------
      // PROPERTY TYPE
      // ------------------------------------------------------

      propertyType:
        mergeValue(
          extracted.propertyType,
          mergeValue(
            existingSummary.propertyType,
            existingLead.propertyType
          )
        ),

      // ------------------------------------------------------
      // FINANCING
      // ------------------------------------------------------

      financing:
        mergeValue(
          extracted.financing,
          mergeValue(
            existingSummary.financing,
            existingLead.financing
          )
        ),

      // ------------------------------------------------------
      // INTENT
      // ------------------------------------------------------
      //
      // IMPORTANT:
      //
      // DO NOT redefine intent here.
      //
      // The extraction layer already determines whether the
      // customer wants:
      //
      // rent
      // buy
      // property_search
      //
      // This engine only preserves that decision.
      //
      // Priority:
      //
      // 1. Latest valid extraction
      // 2. Existing conversation intent
      // 3. Existing Lead intent
      //
      // Empty extraction NEVER destroys intent.
      //
      // ======================================================

      intent:
        normalizeIntentMemory(
          mergeValue(
            extracted.intent,
            mergeValue(
              existingSummary.intent,
              existingLead.intent
            )
          )
        ),

      // ------------------------------------------------------
      // PHONE
      // ------------------------------------------------------

      phone:
        mergeValue(
          extracted.phone,
          mergeValue(
            conversation.phone,
            existingLead.phone
          )
        ),
    };

    // ========================================================
    // DEBUG
    // ========================================================

    console.log(
      "========== UPDATED / MERGED LEAD =========="
    );

    console.dir(
      updatedLead,
      {
        depth: null,
      }
    );

    console.log(
      "Budget:",
      updatedLead.budget
    );

    console.log(
      "Location:",
      updatedLead.location
    );

    console.log(
      "Bedrooms:",
      updatedLead.bedrooms
    );

    console.log(
      "Property Type:",
      updatedLead.propertyType
    );

    console.log(
      "Move Date:",
      updatedLead.moveDate
    );

    console.log(
      "Financing:",
      updatedLead.financing
    );

    console.log(
      "Intent:",
      updatedLead.intent
    );

    console.log(
      "Phone:",
      updatedLead.phone
    );

    // ========================================================
    // MISSING FIELDS
    // ========================================================

    const missing =
      getMissingFields(
        updatedLead
      );

    console.log(
      "🧠 Missing fields array:",
      missing
    );

    // ========================================================
    // COMPLETE
    // ========================================================

    const complete =
      missing.length === 0;

    console.log(
      "✅ Qualification complete:",
      complete
    );

    // ========================================================
    // MISSING FIELD STATE
    // ========================================================

    const missingFieldsState =
      buildMissingFieldsState(
        missing
      );

    console.log(
      "Missing fields state:",
      missingFieldsState
    );

    // ========================================================
    // CONVERSATION STAGE
    // ========================================================

    const stage =
      detectConversationStage(
        updatedLead
      );

    console.log(
      "Conversation stage:",
      stage
    );

    // ========================================================
    // CONVERSATION STATUS
    // ========================================================

    const status =
      determineConversationStatus(
        stage,
        complete
      );

    console.log(
      "Conversation status:",
      status
    );

    // ========================================================
    // QUESTION MEMORY
    // ========================================================

    let safeLastQuestion =
      lastQuestionAsked;

    if (
      conversation?.lastQuestionAsked ===
      lastQuestionAsked
    ) {
      safeLastQuestion = null;
    }

    console.log(
      "Previous question:",
      conversation?.lastQuestionAsked
    );

    console.log(
      "Incoming question:",
      lastQuestionAsked
    );

    console.log(
      "Persisted question:",
      safeLastQuestion
    );

    // --------------------------------------------------------
    // No question is required once qualification is complete.
    // --------------------------------------------------------

    if (complete) {
      safeLastQuestion = null;
    }

    // ========================================================
    // MERGED CONVERSATION SUMMARY
    // ========================================================
    //
    // IMPORTANT:
    //
    // This summary MUST use updatedLead.intent.
    //
    // Never use raw incoming extraction directly here.
    //
    // This guarantees that the conversation memory mirrors
    // the Lead memory.
    //
    // ========================================================

    const mergedSummary = {
      ...existingSummary,

      budget:
        updatedLead.budget ??
        null,

      location:
        updatedLead.location ??
        null,

      bedrooms:
        updatedLead.bedrooms ??
        null,

      propertyType:
        updatedLead.propertyType ??
        null,

      moveDate:
        updatedLead.moveDate ??
        null,

      financing:
        updatedLead.financing ??
        null,

      // ------------------------------------------------------
      // INTENT
      // ------------------------------------------------------
      //
      // Lead intent is the source of truth.
      //
      // Conversation summary mirrors it.
      //
      // ======================================================

      intent:
        hasValue(
          updatedLead.intent
        )
          ? String(
              updatedLead.intent
            )
              .trim()
              .toLowerCase()
          : null,

      phone:
        updatedLead.phone ??
        null,
    };

    console.log(
      "========== MERGED CONVERSATION SUMMARY =========="
    );

    console.dir(
      mergedSummary,
      {
        depth: null,
      }
    );

    // ========================================================
    // INTENT DEBUG
    // ========================================================

    console.log(
      "========== INTENT MEMORY =========="
    );

    console.log(
      "Lead intent:",
      updatedLead.intent
    );

    console.log(
      "Conversation intent:",
      mergedSummary.intent
    );

    console.log(
      "Intent meaning:",
      updatedLead.intent === "rent"
        ? "Customer explicitly wants to rent/lease."
        : updatedLead.intent === "buy"
          ? "Customer explicitly wants to buy/purchase."
          : updatedLead.intent === "property_search"
            ? "Customer is searching for a property without explicit rent/buy intent."
            : "No transaction intent currently stored."
    );

    // ========================================================
    // PERSIST
    // ========================================================

    const updatedConversation =
      await Conversation.findByIdAndUpdate(
        conversation._id,

        {
          $set: {
            // ------------------------------------------------
            // IMPORTANT:
            //
            // Conversation.status and Conversation.stage are
            // separate fields with separate enums.
            //
            // ------------------------------------------------

            status,

            stage,

            missingFields:
              missingFieldsState,

            lastQuestionAsked:
              safeLastQuestion,

            complete,

            summary:
              mergedSummary,

            phone:
              updatedLead.phone ||
              null,

            lastUpdated:
              new Date(),
          },
        },

        {
          returnDocument: "after",
        }
      );

    console.log(
      "✅ Conversation state persisted."
    );

    console.log(
      "Conversation ID:",
      conversation._id
    );

    console.log(
      "Persisted status:",
      updatedConversation?.status
    );

    console.log(
      "Persisted stage:",
      updatedConversation?.stage
    );

    console.log(
      "Persisted complete:",
      updatedConversation?.complete
    );

    console.log(
      "Persisted missingFields:",
      updatedConversation?.missingFields
    );

    console.log(
      "Persisted intent:",
      updatedConversation?.summary?.intent
    );

    // ========================================================
    // RETURN
    // ========================================================

    return {
      conversation:
        updatedConversation,

      stage,

      status,

      complete,

      missingFields:
        missingFieldsState,

      missingFieldsArray:
        missing,

      nextStep:
        missing[0] ||
        null,

      summary:
        mergedSummary,
    };

  } catch (error) {
    console.error(
      "❌ Conversation State Engine Error:",
      error
    );

    console.error(
      "Stack:",
      error?.stack
    );

    return null;
  }
};

// ============================================================
// DEFAULT EXPORT
// ============================================================

export default {
  updateConversationState,
};