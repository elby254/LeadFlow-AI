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
 * Channel-aware outbound transport
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
 * OUTBOUND TRANSPORT
 * ------------------------------------------------------------
 *
 * WhatsApp inbound
 *      ↓
 * WhatsApp outbound
 *
 * SMS inbound
 *      ↓
 * Africa's Talking SMS outbound
 *
 * The controller does NOT guess a transport.
 *
 * If the inbound channel is explicitly available as:
 *
 *     whatsapp
 *
 * WhatsApp is used.
 *
 * ============================================================
 */

import {
  sendOutboundMessage,
} from "../services/messageTransportService.js";

import {
  generateAIResponse,
} from "../services/aiResponseEngine.js";

import {
  persistLeadIntent,
} from "../services/leadIntentPersistenceService.js";

import {
  updateConversationState,
} from "../services/conversationStateEngine.js";


/* ============================================================
   CANONICAL INTENT VALUES
============================================================ */

const VALID_INTENTS = [
  "rent",
  "buy",
  "property_search",
];


/* ============================================================
   NORMALIZE LEAD INTENT
============================================================ */

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
    ].includes(
      normalized
    )
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
    ].includes(
      normalized
    )
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
    ].includes(
      normalized
    )
  ) {

    return "property_search";
  }

  console.warn(
    "⚠️ Unsupported lead intent ignored:",
    intent
  );

  return "";
};


/* ============================================================
   SAFE VALUE HELPER
============================================================ */

const hasValue = (
  value
) => {

  return (
    value !== null &&
    value !== undefined &&
    String(value).trim() !== ""
  );
};


/* ============================================================
   MERGE VALUE HELPER
============================================================ */

const mergeIfPresent = (
  existing,
  incoming
) => {

  return hasValue(
    incoming
  )
    ? incoming
    : existing;
};


/* ============================================================
   NORMALIZE AI RESULT
============================================================ */

const normalizeAIResult = (
  aiResult = {}
) => {

  const extracted =
    aiResult?.extracted ||
    {};

  const missingInformation =
    Array.isArray(
      aiResult?.missingInformation
    )
      ? aiResult.missingInformation
      : [];

  const normalizedIntent =
    normalizeLeadIntent(
      extracted?.intent
    );

  return {

    ...aiResult,

    extracted: {

      ...extracted,

      budget:
        extracted.budget ??
        null,

      location:
        extracted.location ??
        null,

      bedrooms:
        extracted.bedrooms ??
        null,

      propertyType:
        extracted.propertyType ??
        null,

      moveDate:
        extracted.moveDate ??
        null,

      financing:
        extracted.financing ??
        null,

      intent:
        normalizedIntent ||
        null,

      phone:
        extracted.phone ??
        null,

    },

    missingInformation,

  };
};


/* ============================================================
   PERSIST LEAD INTENT
============================================================ */

const persistExtractedLeadIntent =
  async (
    lead,
    intent
  ) => {

    try {

      if (
        !lead?._id
      ) {

        console.warn(
          "⚠️ Intent persistence skipped: lead._id is missing."
        );

        return null;
      }


      if (
        !hasValue(
          intent
        )
      ) {

        console.log(
          "ℹ️ No lead intent detected. Nothing to persist."
        );

        return null;
      }


      const normalizedIntent =
        normalizeLeadIntent(
          intent
        );


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


      await persistLeadIntent(
        lead._id,
        normalizedIntent
      );


      lead.intent =
        normalizedIntent;


      console.log(
        "✅ LEAD INTENT PERSISTED:",
        {

          leadId:
            lead._id,

          intent:
            normalizedIntent,

        }
      );


      return normalizedIntent;

    } catch (
      error
    ) {

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

const buildMergedSummary = (
  existing = {},
  extracted = {}
) => {

  const normalizedIntent =
    normalizeLeadIntent(
      extracted?.intent
    );

  return {

    ...existing,

    budget:
      mergeIfPresent(
        existing?.budget,
        extracted?.budget
      ),

    location:
      mergeIfPresent(
        existing?.location,
        extracted?.location
      ),

    bedrooms:
      mergeIfPresent(
        existing?.bedrooms,
        extracted?.bedrooms
      ),

    propertyType:
      mergeIfPresent(
        existing?.propertyType,
        extracted?.propertyType
      ),

    moveDate:
      mergeIfPresent(
        existing?.moveDate,
        extracted?.moveDate
      ),

    financing:
      mergeIfPresent(
        existing?.financing ??
          null,

        extracted?.financing ??
          null
      ) ?? null,

    intent:
      mergeIfPresent(
        existing?.intent,
        normalizedIntent
      ),

    phone:
      mergeIfPresent(
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
    normalized.extracted ||
    {};

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
    effectiveIntent ||
      "(none)"
  );

  const effectiveExtracted = {

    ...extracted,

    intent:
      hasValue(
        effectiveIntent
      )
        ? effectiveIntent
        : null,

  };

  const previousSummary =
    conversation?.summary ||
    state?.conversation
      ?.summary ||
    {};

  const summary =
    buildMergedSummary(
      previousSummary,
      effectiveExtracted
    );

  if (
    hasValue(
      effectiveIntent
    )
  ) {

    summary.intent =
      effectiveIntent;

  } else {

    const existingIntent =
      normalizeLeadIntent(
        summary?.intent
      );

    summary.intent =
      existingIntent ||
      null;
  }

  const effectivePhone =
    mergeIfPresent(

      mergeIfPresent(
        lead?.phone,
        conversation?.phone
      ),

      extractedData?.phone ||
        extracted?.phone

    );

  summary.phone =
    mergeIfPresent(
      summary?.phone,
      effectivePhone
    );

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

  const complete =
    !missingFields.budget &&
    !missingFields.location &&
    !missingFields.bedrooms &&
    !missingFields.moveDate &&
    !missingFields.phone;

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

  const finalStage =
    complete
      ? "qualified"
      : effectiveStage;

  const effectiveConversation = {

    ...conversation,

    customerName:
      conversation?.customerName ||
      lead?.name ||
      "",

    phone:
      effectivePhone ||
      null,

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

  const existingAIExtracted =
    state?.conversation
      ?.aiContext
      ?.extracted ||
    {};

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

      ...(state?.conversation ||
        {}),

      ...effectiveConversation,

      summary,

      missingFields,

      aiContext: {

        ...(state?.conversation
          ?.aiContext || {}),

        confidence:
          hasValue(
            normalized.score
          )
            ? normalized.score
            : (
                state?.conversation
                  ?.aiContext
                  ?.confidence ||
                0
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

          ...(existingAIExtracted ||
            {}),

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
              existingAIExtracted?.financing ??
                null,

              effectiveExtracted?.financing ??
                null
            ) ?? null,

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

export const sendAutoReply =
  async (
    lead,
    aiResult,
    conversation,
    state,
    extractedData
  ) => {

    try {

      /* ------------------------------------------------------
         Validate input
      ------------------------------------------------------ */

      if (
        !lead
      ) {

        console.error(
          "❌ Auto reply aborted: lead is missing."
        );

        return;
      }


      if (
        !lead.phone
      ) {

        console.warn(
          "⚠️ Auto reply skipped: lead has no phone number."
        );

        return;
      }


      /* ------------------------------------------------------
         Normalize latest AI result
      ------------------------------------------------------ */

      const normalizedAIResult =
        normalizeAIResult(
          aiResult
        );

      console.log(
        "🧠 AUTO REPLY AI RESULT:",
        normalizedAIResult
      );


      /* ------------------------------------------------------
         NORMALIZED EXTRACTED DATA
      ------------------------------------------------------ */

      const normalizedExtractedData =
        extractedData || {};

      console.log(
        "🧠 AUTO REPLY EXTRACTED DATA:",
        normalizedExtractedData
      );


      /* ------------------------------------------------------
         EFFECTIVE INTENT
      ------------------------------------------------------ */

      const extractedDataIntent =
        normalizeLeadIntent(
          normalizedExtractedData?.intent
        );

      const aiIntent =
        normalizeLeadIntent(
          normalizedAIResult
            ?.extracted
            ?.intent
        );

      const conversationIntent =
        normalizeLeadIntent(
          conversation
            ?.summary
            ?.intent
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
        effectiveIntent ||
          "(none)"
      );


      /* ------------------------------------------------------
         PERSIST LEAD INTENT
      ------------------------------------------------------ */

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


      /* ------------------------------------------------------
         Build final merged state
      ------------------------------------------------------ */

      const {
        effectiveConversation,
        effectiveState
      } =
        buildEffectiveState(
          lead,
          normalizedAIResult,
          conversation,
          state,
          normalizedExtractedData
        );

      const finalIntent =
        persistedIntent ||
        effectiveIntent;


      if (
        hasValue(
          finalIntent
        )
      ) {

        const normalizedFinalIntent =
          normalizeLeadIntent(
            finalIntent
          );

        if (
          VALID_INTENTS.includes(
            normalizedFinalIntent
          )
        ) {

          effectiveConversation
            .summary
            .intent =
            normalizedFinalIntent;

          effectiveState
            .conversation
            .summary
            .intent =
            normalizedFinalIntent;

          effectiveState
            .conversation
            .aiContext =
            effectiveState
              .conversation
              .aiContext ||
            {};

          effectiveState
            .conversation
            .aiContext
            .extracted =
            effectiveState
              .conversation
              .aiContext
              .extracted ||
            {};

          effectiveState
            .conversation
            .aiContext
            .extracted
            .intent =
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
        effectiveConversation
          .summary
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


      /* ------------------------------------------------------
         Synchronize conversation state
      ------------------------------------------------------ */

      try {

        if (
          typeof updateConversationState ===
          "function"
        ) {

          await updateConversationState(

            lead,

            conversation,

            {

              ...normalizedAIResult.extracted,

              ...normalizedExtractedData,

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
                  .financing ??
                null,

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

        console.error(
          "⚠️ Conversation state synchronization failed:",
          stateError
        );
      }


      /* ------------------------------------------------------
         Generate AI reply using FINAL state
      ------------------------------------------------------ */

      const message =
        await generateAIResponse(
          lead,
          normalizedAIResult,
          effectiveConversation,
          effectiveState
        );


      if (
        !message
      ) {

        console.warn(
          "⚠️ AI response engine returned an empty message."
        );

        return;
      }


      const finalMessage =
        String(
          message
        ).trim();


      if (
        !finalMessage
      ) {

        console.warn(
          "⚠️ AI response engine returned a blank message."
        );

        return;
      }


      /* ------------------------------------------------------
         Debug
      ------------------------------------------------------ */

      console.log(
        "📤 SENDING AUTO REPLY TO:",
        lead.phone
      );

      console.log(
        "💬 MESSAGE:",
        finalMessage
      );


      /* ======================================================
         CENTRALIZED OUTBOUND TRANSPORT
      ====================================================== */

      /**
       * The inbound channel was resolved upstream by the
       * trusted channel adapter and aiIngestionController.
       *
       * We therefore use:
       *
       *     normalizedExtractedData.channel
       *
       * or:
       *
       *     normalizedExtractedData.source
       *
       * as the transport source.
       *
       * We NEVER infer transport from the customer's phone
       * number.
       */

      const outboundSource =
        normalizedExtractedData?.channel ||
        normalizedExtractedData?.source ||
        "";

      console.log(
        "📡 AUTO REPLY OUTBOUND SOURCE:",
        outboundSource ||
          "(missing)"
      );


      console.log(
        "📡 AUTO REPLY TRANSPORT:",
        outboundSource ===
          "whatsapp"
          ? "WHATSAPP CLOUD API"
          : outboundSource ===
            "sms"
            ? "AFRICA'S TALKING SMS"
            : outboundSource ||
              "(unsupported / unavailable)"
      );


      /* ------------------------------------------------------
         Validate organization context
      ------------------------------------------------------ */

      const outboundOrganizationId =
        normalizedExtractedData?.organizationId ||
        lead?.organizationId ||
        null;

      console.log(
        "🏢 AUTO REPLY ORGANIZATION ID:",
        outboundOrganizationId ||
          "(missing)"
      );


      /* ------------------------------------------------------
         Send through centralized transport
      ------------------------------------------------------ */

      const transportResult =
        await sendOutboundMessage({

          source:
            outboundSource,

          phone:
            lead.phone,

          message:
            finalMessage,

          context: {

            organizationId:
              outboundOrganizationId,

            leadId:
              lead?._id ||
              null,

            conversationId:
              effectiveConversation
                ?._id ||
              conversation?._id ||
              null,

            channelMetadata:
              normalizedExtractedData
                ?.channelMetadata ||
              {},

          },

        });


      /* ------------------------------------------------------
         Transport result
      ------------------------------------------------------ */

      console.log(
        "📨 AUTO REPLY TRANSPORT RESULT:",
        transportResult
      );


      /* ------------------------------------------------------
         Delivery result
      ------------------------------------------------------ */

      if (
        transportResult?.success
      ) {

        console.log(
          "✅ AUTO REPLY DELIVERED:",
          {

            transport:
              transportResult
                ?.transport,

            provider:
              transportResult
                ?.provider,

            recipient:
              lead.phone,

          }
        );

      } else {

        console.error(
          "❌ AUTO REPLY DELIVERY FAILED:",
          {

            source:
              outboundSource,

            recipient:
              lead.phone,

            reason:
              transportResult
                ?.reason ||
              "Unknown transport failure.",

          }
        );
      }


      return transportResult;

    } catch (
      error
    ) {

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