/**
 * ============================================================
 *
 * AI AUTO REPLY CONTROLLER
 *
 * Purpose
 * ------------------------------------------------------------
 * Sends intelligent follow-up messages that continue lead
 * qualification automatically.
 *
 * Architecture
 * ------------------------------------------------------------
 *
 * aiIngestionController
 *        ↓
 * Normalized deterministic extraction
 *        ↓
 * AI Auto Reply Controller
 *        ↓
 * Lead Intent Persistence
 *        ↓
 * Conversation State
 *        ↓
 * AI Response Engine
 *        ↓
 * Africa's Talking SMS
 *
 * ============================================================
 *
 * IMPORTANT
 * ------------------------------------------------------------
 * Intent extraction is NO LONGER performed inside this
 * controller.
 *
 * The upstream aiIngestionController is responsible for:
 *
 * conversation
 *      ↓
 * deterministic extraction
 *      ↓
 * normalized extractedData
 *      ↓
 * sendAutoReply(..., extractedData)
 *
 * This controller then:
 *
 * extractedData.intent
 *      ↓
 * normalizeLeadIntent()
 *      ↓
 * persistLeadIntent()
 *      ↓
 * Lead.intent
 *
 * Empty / missing / unsupported intent is NEVER persisted.
 *
 * Canonical intent values:
 *
 *     rent
 *     buy
 *     property_search
 *
 * ============================================================
 *
 * SMS TRANSPORT
 * ------------------------------------------------------------
 *
 * All automatic SMS replies from this controller are sent
 * STRICTLY through Africa's Talking.
 *
 * This controller does NOT:
 *
 * - select WhatsApp
 * - select another SMS provider
 * - perform transport switching
 *
 * The centralized SMS implementation is:
 *
 *     ../services/africastalkingService.js
 *
 * ============================================================
 */

import { sendSMS } from "../services/africastalkingService.js";

import { generateAIResponse } from "../services/aiResponseEngine.js";

import {
  persistLeadIntent,
} from "../services/leadIntentPersistenceService.js";

import {
  updateConversationState,
} from "../services/conversationStateEngine.js";

/* ============================================================
   CANONICAL INTENT VALUES
============================================================ */

/**
 * ============================================================
 *
 * LEAD INTENT SEMANTICS
 *
 * ------------------------------------------------------------
 *
 * rent
 * ----
 * Customer explicitly wants to rent / lease a property.
 *
 * Examples:
 *
 * "I want to rent a house."
 * "I'm looking for a rental apartment."
 * "I want to lease a property."
 *
 *
 * buy
 * ---
 * Customer explicitly wants to buy / purchase / own
 * a property.
 *
 * Examples:
 *
 * "I want to buy a house."
 * "I'm looking to purchase a property."
 * "I want to own an apartment."
 *
 *
 * property_search
 * ---------------
 * Customer is clearly searching for a property but has NOT
 * specified whether they want to rent or buy.
 *
 * Examples:
 *
 * "I'm looking for a 3 bedroom house."
 * "I need a house in Kilimani."
 * "Can you help me find a property?"
 *
 *
 * IMPORTANT
 * ------------------------------------------------------------
 *
 * Do NOT infer rent or buy from:
 *
 * - budget
 * - location
 * - bedrooms
 * - property type
 * - move date
 *
 * Transaction intent must be explicit.
 *
 * ============================================================
 */

const VALID_INTENTS = [
  "rent",
  "buy",
  "property_search",
];

/* ============================================================
   NORMALIZE LEAD INTENT
============================================================ */

/**
 * Converts supported intent aliases into the application's
 * canonical intent vocabulary.
 *
 * IMPORTANT:
 *
 * This controller does NOT invent an intent.
 *
 * It only normalizes an intent that was already extracted
 * upstream.
 *
 * Unsupported intents return an empty string so they cannot
 * overwrite a valid existing lead intent.
 */
const normalizeLeadIntent = (
  intent
) => {
  if (
    intent === null ||
    intent === undefined
  ) {
    return "";
  }

  const normalized =
    String(intent)
      .trim()
      .toLowerCase();

  if (!normalized) {
    return "";
  }

  /* ----------------------------------------------------------
     RENT
  ---------------------------------------------------------- */

  if (
    [
      "rent",
      "rental",
      "lease",
      "property_rental",
      "property-rental",
      "property rent",
      "property lease",
      "renting",
      "leasing",
    ].includes(normalized)
  ) {
    return "rent";
  }

  /* ----------------------------------------------------------
     BUY
  ---------------------------------------------------------- */

  if (
    [
      "buy",
      "purchase",
      "property_purchase",
      "property-purchase",
      "property buy",
      "buying",
      "purchasing",
      "own",
      "ownership",
    ].includes(normalized)
  ) {
    return "buy";
  }

  /* ----------------------------------------------------------
     GENERIC PROPERTY SEARCH
  ---------------------------------------------------------- */

  if (
    [
      "property_search",
      "property-search",
      "property search",
      "search",
      "property",
      "looking_for_property",
      "looking-for-property",
      "looking for property",
      "property inquiry",
      "property_inquiry",
    ].includes(normalized)
  ) {
    return "property_search";
  }

  /**
   * Unsupported values such as:
   *
   * viewing
   * inquiry
   * sell
   * invest
   * unknown
   * etc.
   *
   * must NOT become Lead.intent.
   */

  console.warn(
    "⚠️ Unsupported lead intent ignored:",
    intent
  );

  return "";
};

/* ============================================================
   SAFE VALUE HELPER
============================================================ */

/**
 * Determines whether a value is actually usable.
 *
 * IMPORTANT:
 * We intentionally do NOT use:
 *
 *     Boolean(value)
 *
 * because false and 0 may theoretically be valid values.
 */
const hasValue = (value) => {
  return (
    value !== null &&
    value !== undefined &&
    String(value).trim() !== ""
  );
};

/* ============================================================
   MERGE VALUE HELPER
============================================================ */

/**
 * Merge rule:
 *
 * incoming value exists
 *      ↓
 * use incoming value
 *
 * incoming value is null / undefined / empty
 *      ↓
 * preserve existing value
 *
 * IMPORTANT:
 * This prevents valid conversation memory from being erased
 * by incomplete extraction.
 */
const mergeIfPresent = (
  existing,
  incoming
) => {
  return hasValue(incoming)
    ? incoming
    : existing;
};

/* ============================================================
   NORMALIZE AI RESULT
============================================================ */

/**
 * Normalizes the AI qualification result so every expected
 * extraction field exists.
 *
 * The normalizer itself does NOT destroy previous values.
 * It only guarantees a predictable structure.
 *
 * IMPORTANT:
 * Intent is NOT independently extracted here.
 *
 * Intent comes from extractedData supplied by the upstream
 * aiIngestionController.
 */
const normalizeAIResult = (
  aiResult = {}
) => {
  /**
   * The AI qualification service returns:
   *
   * {
   *   extracted: {...},
   *   score,
   *   stage,
   *   missingInformation,
   *   ...
   * }
   */

  const extracted =
    aiResult?.extracted || {};

  const missingInformation =
    Array.isArray(
      aiResult?.missingInformation
    )
      ? aiResult.missingInformation
      : [];

  /**
   * Normalize AI intent independently only for purposes of
   * keeping the AI result consistent.
   *
   * Unsupported intent becomes null.
   *
   * The upstream deterministic extraction still has priority
   * when building the final effective intent.
   */
  const normalizedIntent =
    normalizeLeadIntent(
      extracted?.intent
    );

  return {
    ...aiResult,

    extracted: {
      ...extracted,

      budget:
        extracted.budget ?? null,

      location:
        extracted.location ?? null,

      bedrooms:
        extracted.bedrooms ?? null,

      propertyType:
        extracted.propertyType ?? null,

      moveDate:
        extracted.moveDate ?? null,

      financing:
        extracted.financing ?? null,

      intent:
        normalizedIntent || null,

      phone:
        extracted.phone ?? null,
    },

    missingInformation,
  };
};

/* ============================================================
   PERSIST LEAD INTENT
============================================================ */

/**
 * Persists an already-extracted intent to the Lead document.
 *
 * IMPORTANT:
 *
 * This function DOES NOT call OpenAI.
 *
 * Intent extraction has already happened upstream inside:
 *
 * aiIngestionController
 *
 * The normalized intent is supplied directly to this
 * controller through extractedData.
 *
 * Flow:
 *
 * aiIngestionController
 *        ↓
 * extractedData.intent
 *        ↓
 * normalizeLeadIntent()
 *        ↓
 * persistExtractedLeadIntent()
 *        ↓
 * persistLeadIntent()
 *        ↓
 * Lead.intent
 *
 * If intent persistence fails, the AI reply should still
 * be allowed to continue.
 */
const persistExtractedLeadIntent = async (
  lead,
  intent
) => {
  try {
    if (!lead?._id) {
      console.warn(
        "⚠️ Intent persistence skipped: lead._id is missing."
      );

      return null;
    }

    if (!hasValue(intent)) {
      console.log(
        "ℹ️ No lead intent detected. Nothing to persist."
      );

      return null;
    }

    /**
     * ========================================================
     * NORMALIZE INTENT
     * ========================================================
     */

    const normalizedIntent =
      normalizeLeadIntent(
        intent
      );

    /**
     * Never persist unsupported intent values.
     */
    if (
      !VALID_INTENTS.includes(
        normalizedIntent
      )
    ) {
      console.log(
        "ℹ️ Unsupported intent not persisted:",
        intent
      );

      return null;
    }

    console.log(
      "🎯 NORMALIZED LEAD INTENT RECEIVED:",
      normalizedIntent
    );

    /**
     * ========================================================
     * ACTUAL INTENT PERSISTENCE
     * ========================================================
     *
     * Intent has already been extracted upstream.
     *
     * We now explicitly write it to the Lead document through
     * the dedicated persistence service.
     */
    await persistLeadIntent(
      lead._id,
      normalizedIntent
    );

    /**
     * Keep the in-memory Lead synchronized too.
     *
     * This is important because subsequent conversation-state
     * logic may read lead.intent before another database query.
     */
    lead.intent =
      normalizedIntent;

    console.log(
      "✅ LEAD INTENT PERSISTED:",
      {
        leadId: lead._id,
        intent: normalizedIntent,
      }
    );

    return normalizedIntent;

  } catch (error) {
    /**
     * Intent persistence must NOT prevent the customer from
     * receiving the AI response.
     */
    console.error(
      "⚠️ Lead intent persistence failed:",
      error
    );

    return null;
  }
};

/* ============================================================
   BUILD MERGED EXTRACTION
============================================================ */

/**
 * Builds a safe merged summary.
 *
 * Priority:
 *
 * 1. New valid extracted value
 * 2. Existing conversation value
 *
 * Empty extraction values NEVER overwrite existing information.
 */
const buildMergedSummary = (
  existing = {},
  extracted = {}
) => {
  /**
   * Normalize incoming intent before merging.
   *
   * This prevents values such as:
   *
   * property_rental
   * property_purchase
   * lease
   * purchase
   *
   * from entering the conversation summary.
   */
  const normalizedIntent =
    normalizeLeadIntent(
      extracted?.intent
    );

  return {
    /**
     * Preserve any additional fields already present in
     * the conversation summary.
     */
    ...existing,

    budget: mergeIfPresent(
      existing?.budget,
      extracted?.budget
    ),

    location: mergeIfPresent(
      existing?.location,
      extracted?.location
    ),

    bedrooms: mergeIfPresent(
      existing?.bedrooms,
      extracted?.bedrooms
    ),

    propertyType: mergeIfPresent(
      existing?.propertyType,
      extracted?.propertyType
    ),

    moveDate: mergeIfPresent(
      existing?.moveDate,
      extracted?.moveDate
    ),

    financing:
      mergeIfPresent(
        existing?.financing ?? null,
        extracted?.financing ?? null
      ) ?? null,

    /**
     * Only merge a canonical intent.
     *
     * If the incoming intent is unsupported, the existing
     * valid intent is preserved.
     */
    intent: mergeIfPresent(
      existing?.intent,
      normalizedIntent
    ),

    phone: mergeIfPresent(
      existing?.phone,
      extracted?.phone
    ),
  };
};

/* ============================================================
   BUILD EFFECTIVE CONVERSATION STATE
============================================================ */

const buildEffectiveState = (
  lead = {},
  aiResult = {},
  conversation = {},
  state = {},
  extractedData = {}
) => {
  const normalized =
    normalizeAIResult(
      aiResult
    );

  const extracted =
    normalized.extracted || {};

  /**
   * ==========================================================
   * EFFECTIVE INTENT
   * ==========================================================
   *
   * Intent now comes from the upstream deterministic
   * extraction pipeline.
   *
   * Priority:
   *
   * 1. extractedData.intent
   * 2. aiResult.extracted.intent
   * 3. existing conversation intent
   * 4. Lead intent
   * 5. empty
   *
   * IMPORTANT:
   *
   * This controller does NOT call OpenAI to discover intent.
   */
  const extractedDataIntent =
    normalizeLeadIntent(
      extractedData?.intent
    );

  const aiIntent =
    normalizeLeadIntent(
      aiResult?.extracted?.intent
    );

  const conversationIntent =
    normalizeLeadIntent(
      conversation?.summary?.intent
    );

  const leadIntent =
    normalizeLeadIntent(
      lead?.intent
    );

  const effectiveIntent =
    extractedDataIntent ||
    aiIntent ||
    conversationIntent ||
    leadIntent ||
    "";

  console.log(
    "🎯 NORMALIZED EFFECTIVE INTENT:",
    effectiveIntent || "(none)"
  );

  /**
   * Build a safe extraction object that includes the
   * canonical intent.
   */
  const effectiveExtracted = {
    ...extracted,

    intent:
      hasValue(effectiveIntent)
        ? effectiveIntent
        : null,
  };

  /**
   * ==========================================================
   * EXISTING CONVERSATION SUMMARY
   * ==========================================================
   *
   * This is our existing memory.
   */

  const previousSummary =
    conversation?.summary ||
    state?.conversation?.summary ||
    {};

  /**
   * ==========================================================
   * MERGED SUMMARY
   * ==========================================================
   */

  const summary =
    buildMergedSummary(
      previousSummary,
      effectiveExtracted
    );

  /**
   * ==========================================================
   * EXPLICIT INTENT MERGE
   * ==========================================================
   *
   * Ensure the deterministic upstream intent is not lost.
   */
  if (
    hasValue(
      effectiveIntent
    )
  ) {
    summary.intent =
      effectiveIntent;
  } else {
    /**
     * If there is no new intent, preserve only a valid
     * existing intent.
     */
    const existingIntent =
      normalizeLeadIntent(
        summary?.intent
      );

    summary.intent =
      existingIntent || null;
  }

  /**
   * ==========================================================
   * PHONE MERGE
   * ==========================================================
   *
   * Priority:
   *
   * 1. Latest extracted phone
   * 2. Existing conversation phone
   * 3. Lead phone
   */

  const effectivePhone =
    mergeIfPresent(
      mergeIfPresent(
        lead?.phone,
        conversation?.phone
      ),
      extractedData?.phone ||
        extracted?.phone
    );

  /**
   * Keep phone synchronized inside summary too.
   */
  summary.phone =
    mergeIfPresent(
      summary?.phone,
      effectivePhone
    );

  /**
   * ==========================================================
   * MISSING FIELDS
   * ==========================================================
   *
   * Calculate missing information from the FINAL merged
   * state, NOT directly from the latest extraction.
   */

  const missingFields = {
    budget:
      !hasValue(
        summary.budget
      ),

    location:
      !hasValue(
        summary.location
      ),

    bedrooms:
      !hasValue(
        summary.bedrooms
      ),

    moveDate:
      !hasValue(
        summary.moveDate
      ),

    phone:
      !hasValue(
        effectivePhone
      ),
  };

  /**
   * Property type is useful but is NOT a blocking
   * qualification field.
   */

  const complete =
    !missingFields.budget &&
    !missingFields.location &&
    !missingFields.bedrooms &&
    !missingFields.moveDate &&
    !missingFields.phone;

  /**
   * ==========================================================
   * EFFECTIVE STAGE
   * ==========================================================
   */

  const effectiveStage =
    hasValue(
      normalized.stage
    )
      ? normalized.stage
      : (
          conversation?.stage ||
          state?.stage ||
          null
        );

  /**
   * If all required fields are present, the conversation
   * should remain qualified even if the latest AI result
   * incorrectly says otherwise.
   */

  const finalStage =
    complete
      ? "qualified"
      : effectiveStage;

  /**
   * ==========================================================
   * EFFECTIVE CONVERSATION
   * ==========================================================
   */

  const effectiveConversation = {
    ...conversation,

    customerName:
      conversation?.customerName ||
      lead?.name ||
      "",

    phone:
      effectivePhone || null,

    leadId:
      conversation?.leadId ||
      lead?._id ||
      null,

    summary,

    missingFields,

    stage:
      finalStage,

    status:
      complete
        ? "qualified"
        : conversation?.status ||
          "pending",

    lastMessage:
      conversation?.lastMessage ||
      null,

    lastQuestionAsked:
      conversation?.lastQuestionAsked ||
      null,
  };

  /**
   * ==========================================================
   * EFFECTIVE STATE
   * ==========================================================
   */

  const existingAIExtracted =
    state?.conversation
      ?.aiContext
      ?.extracted || {};

  const existingAIIntent =
    normalizeLeadIntent(
      existingAIExtracted?.intent
    );

  const finalAIIntent =
    effectiveIntent ||
    existingAIIntent ||
    null;

  const effectiveState = {
    ...state,

    conversation: {
      ...(state?.conversation || {}),
      ...effectiveConversation,

      summary,

      missingFields,

      /**
       * Keep latest AI information available to the response
       * engine.
       */
      aiContext: {
        ...(state?.conversation?.aiContext || {}),

        confidence:
          hasValue(
            normalized.score
          )
            ? normalized.score
            : (
                state?.conversation
                  ?.aiContext
                  ?.confidence || 0
              ),

        suggestedReplies:
          Array.isArray(
            normalized.suggestedReplies
          )
            ? normalized.suggestedReplies
            : (
                state?.conversation
                  ?.aiContext
                  ?.suggestedReplies ||
                []
              ),

        nextBestAction:
          hasValue(
            normalized.recommendedAction
          )
            ? normalized.recommendedAction
            : (
                state?.conversation
                  ?.aiContext
                  ?.nextBestAction ||
                ""
              ),

        extracted: {
          ...(existingAIExtracted || {}),

          /**
           * IMPORTANT:
           *
           * Merge extraction safely here too.
           *
           * An empty extraction field cannot erase an older
           * extracted value.
           */

          budget:
            mergeIfPresent(
              existingAIExtracted?.budget,
              effectiveExtracted?.budget
            ),

          location:
            mergeIfPresent(
              existingAIExtracted?.location,
              effectiveExtracted?.location
            ),

          bedrooms:
            mergeIfPresent(
              existingAIExtracted?.bedrooms,
              effectiveExtracted?.bedrooms
            ),

          propertyType:
            mergeIfPresent(
              existingAIExtracted?.propertyType,
              effectiveExtracted?.propertyType
            ),

          moveDate:
            mergeIfPresent(
              existingAIExtracted?.moveDate,
              effectiveExtracted?.moveDate
            ),

          financing:
            mergeIfPresent(
              existingAIExtracted?.financing ?? null,
              effectiveExtracted?.financing ?? null
            ) ?? null,

          /**
           * Only canonical intents are allowed.
           */
          intent:
            finalAIIntent,

          phone:
            mergeIfPresent(
              existingAIExtracted?.phone,
              effectivePhone
            ),
        },
      },
    },

    stage:
      finalStage,

    missingFields,

    nextStep:
      normalized
        .missingInformation
        ?. [0] ||
      null,

    complete,
  };

  return {
    effectiveConversation,
    effectiveState,
    normalizedAIResult:
      normalized,
  };
};

/* ============================================================
   AUTO REPLY
============================================================ */

/**
 * Signature:
 *
 * sendAutoReply(
 *   lead,
 *   aiResult,
 *   conversation,
 *   state,
 *   extractedData
 * )
 *
 * extractedData is supplied by aiIngestionController after
 * normalized deterministic extraction.
 */
export const sendAutoReply = async (
  lead,
  aiResult,
  conversation,
  state,
  extractedData
) => {
  try {
    /* --------------------------------------------------------
       Validate input
    -------------------------------------------------------- */

    if (!lead) {
      console.error(
        "❌ Auto reply aborted: lead is missing."
      );

      return;
    }

    if (!lead.phone) {
      console.warn(
        "⚠️ Auto reply skipped: lead has no phone number."
      );

      return;
    }

    /* --------------------------------------------------------
       Normalize latest AI result
    -------------------------------------------------------- */

    const normalizedAIResult =
      normalizeAIResult(
        aiResult
      );

    console.log(
      "🧠 AUTO REPLY AI RESULT:",
      normalizedAIResult
    );

    /* --------------------------------------------------------
       NORMALIZED EXTRACTED DATA
    -------------------------------------------------------- */

    const normalizedExtractedData =
      extractedData || {};

    console.log(
      "🧠 AUTO REPLY EXTRACTED DATA:",
      normalizedExtractedData
    );

    /**
     * ========================================================
     * EFFECTIVE INTENT
     * ========================================================
     *
     * IMPORTANT:
     *
     * Intent is now received from the upstream
     * aiIngestionController.
     *
     * There is NO extractLeadInformation() call here.
     *
     * Priority:
     *
     * 1. extractedData.intent
     * 2. aiResult.extracted.intent
     * 3. conversation.summary.intent
     * 4. lead.intent
     * 5. empty
     *
     * Every value is normalized into:
     *
     *     rent
     *     buy
     *     property_search
     *
     * Unsupported values are ignored.
     */
    const extractedDataIntent =
      normalizeLeadIntent(
        normalizedExtractedData?.intent
      );

    const aiIntent =
      normalizeLeadIntent(
        normalizedAIResult?.extracted?.intent
      );

    const conversationIntent =
      normalizeLeadIntent(
        conversation?.summary?.intent
      );

    const leadIntent =
      normalizeLeadIntent(
        lead?.intent
      );

    const effectiveIntent =
      extractedDataIntent ||
      aiIntent ||
      conversationIntent ||
      leadIntent ||
      "";

    console.log(
      "🎯 AUTO REPLY EFFECTIVE INTENT:",
      effectiveIntent || "(none)"
    );

    /* --------------------------------------------------------
       PERSIST LEAD INTENT
    -------------------------------------------------------- */

    /**
     * ========================================================
     * IMPORTANT INTENT PERSISTENCE FLOW
     * ========================================================
     *
     * aiIngestionController
     *      ↓
     * normalized deterministic extraction
     *      ↓
     * extractedData.intent
     *      ↓
     * normalizeLeadIntent()
     *      ↓
     * sendAutoReply()
     *      ↓
     * persistLeadIntent()
     *      ↓
     * Lead.intent
     *
     * The controller no longer extracts intent itself.
     *
     * The persistence helper safely handles:
     *
     * - missing lead ID
     * - missing intent
     * - unsupported intent
     * - persistence errors
     *
     * None of those should prevent the actual reply.
     */

    const persistedIntent =
      await persistExtractedLeadIntent(
        lead,
        effectiveIntent
      );

    if (
      hasValue(
        persistedIntent
      )
    ) {
      console.log(
        "🎯 AUTO REPLY INTENT PERSISTED:",
        persistedIntent
      );
    } else {
      console.log(
        "ℹ️ AUTO REPLY: No new intent persisted."
      );
    }

    /* --------------------------------------------------------
       Build final merged state
    -------------------------------------------------------- */

    const {
      effectiveConversation,
      effectiveState,
    } = buildEffectiveState(
      lead,
      normalizedAIResult,
      conversation,
      state,
      normalizedExtractedData
    );

    /**
     * If intent was supplied by the upstream extraction
     * pipeline or persisted successfully, preserve it in
     * the effective conversation state as well.
     */

    const finalIntent =
      persistedIntent ||
      effectiveIntent;

    if (
      hasValue(
        finalIntent
      )
    ) {
      /**
       * Re-normalize before placing the intent into any
       * conversation state.
       */
      const normalizedFinalIntent =
        normalizeLeadIntent(
          finalIntent
        );

      if (
        VALID_INTENTS.includes(
          normalizedFinalIntent
        )
      ) {
        effectiveConversation.summary.intent =
          normalizedFinalIntent;

        effectiveState.conversation.summary.intent =
          normalizedFinalIntent;

        effectiveState.conversation.aiContext =
          effectiveState.conversation.aiContext ||
          {};

        effectiveState.conversation.aiContext.extracted =
          effectiveState.conversation.aiContext.extracted ||
          {};

        effectiveState.conversation.aiContext.extracted.intent =
          normalizedFinalIntent;
      }
    }

    console.log(
      "🧠 AUTO REPLY EFFECTIVE SUMMARY:",
      effectiveConversation.summary
    );

    console.log(
      "🧠 AUTO REPLY EFFECTIVE PHONE:",
      effectiveConversation.phone
    );

    console.log(
      "🧠 AUTO REPLY EFFECTIVE INTENT:",
      effectiveConversation.summary
        ?.intent
    );

    console.log(
      "🧠 AUTO REPLY MISSING FIELDS:",
      effectiveState.missingFields
    );

    console.log(
      "🧠 AUTO REPLY STAGE:",
      effectiveState.stage
    );

    console.log(
      "🧠 AUTO REPLY COMPLETE:",
      effectiveState.complete
    );

    /* --------------------------------------------------------
       Synchronize conversation state
    -------------------------------------------------------- */

    /**
     * IMPORTANT:
     *
     * The state engine expects:
     *
     * updateConversationState(
     *   lead,
     *   conversation,
     *   extractedData,
     *   lastQuestionAsked
     * )
     *
     * Do NOT pass:
     *
     * updateConversationState(
     *   effectiveConversation,
     *   effectiveState
     * )
     *
     * because that causes the old lead.toObject()
     * parameter mismatch.
     */

    try {
      if (
        typeof updateConversationState ===
        "function"
      ) {
        await updateConversationState(
          lead,
          conversation,
          {
            /**
             * Start with the latest normalized extraction.
             */
            ...normalizedAIResult.extracted,

            /**
             * Then explicitly include upstream deterministic
             * extraction data.
             */
            ...normalizedExtractedData,

            /**
             * Explicitly pass the FINAL merged values.
             *
             * This ensures the state engine receives valid
             * conversation memory instead of null/empty values.
             */

            budget:
              effectiveConversation
                .summary
                .budget,

            location:
              effectiveConversation
                .summary
                .location,

            bedrooms:
              effectiveConversation
                .summary
                .bedrooms,

            propertyType:
              effectiveConversation
                .summary
                .propertyType,

            moveDate:
              effectiveConversation
                .summary
                .moveDate,

            financing:
              effectiveConversation
                .summary
                .financing ?? null,

            /**
             * Always pass the canonical intent.
             */
            intent:
              effectiveConversation
                .summary
                .intent,

            phone:
              effectiveConversation
                .phone,
          },
          effectiveConversation
            .lastQuestionAsked
        );
      }
    } catch (
      stateError
    ) {
      /**
       * State synchronization should not prevent the actual
       * reply from being delivered.
       */

      console.error(
        "⚠️ Conversation state synchronization failed:",
        stateError
      );
    }

    /* --------------------------------------------------------
       Generate AI reply using FINAL state
    -------------------------------------------------------- */

    const message =
      await generateAIResponse(
        lead,
        normalizedAIResult,
        effectiveConversation,
        effectiveState
      );

    if (!message) {
      console.warn(
        "⚠️ AI response engine returned an empty message."
      );

      return;
    }

    const finalMessage =
      String(
        message
      ).trim();

    if (!finalMessage) {
      console.warn(
        "⚠️ AI response engine returned a blank message."
      );

      return;
    }

    /* --------------------------------------------------------
       Debug
    -------------------------------------------------------- */

    console.log(
      "📤 SENDING AUTO REPLY TO:",
      lead.phone
    );

    console.log(
      "💬 MESSAGE:",
      finalMessage
    );

    /* --------------------------------------------------------
       AFRICA'S TALKING SMS ONLY
    -------------------------------------------------------- */

    /**
     * ========================================================
     *
     * STRICT SMS TRANSPORT
     *
     * ========================================================
     *
     * Every automatic reply from this controller is sent
     * strictly through the Africa's Talking SMS service.
     *
     * There is intentionally NO transport selection based on:
     *
     *     source
     *
     * and there is intentionally NO WhatsApp fallback here.
     *
     * The source determines how the customer message entered
     * the system, but this controller's outbound transport is
     * Africa's Talking SMS.
     *
     * Flow:
     *
     * AI Response
     *      ↓
     * sendSMS()
     *      ↓
     * africastalkingService.js
     *      ↓
     * Africa's Talking
     *
     * ========================================================
     */

    console.log(
      "📡 AUTO REPLY TRANSPORT: AFRICA'S TALKING SMS"
    );

    await sendSMS(
      lead.phone,
      finalMessage
    );

    console.log(
      "✅ Africa's Talking SMS auto reply sent to:",
      lead.phone
    );

  } catch (error) {
    console.error(
      "❌ Auto reply failed:",
      error
    );
  }
};

/* ============================================================
   DEFAULT EXPORT
============================================================ */

export default {
  sendAutoReply,
};