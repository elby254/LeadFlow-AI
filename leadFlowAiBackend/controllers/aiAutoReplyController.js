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
 * AI Message
 *        ↓
 * DeliveryJob
 *        ↓
 * deliveryWorker
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
 * OUTBOUND DELIVERY
 * ------------------------------------------------------------
 *
 * AI response
 *      ↓
 * AI Message
 *      ↓
 * DeliveryJob
 *      ↓
 * deliveryWorker
 *      ↓
 * messageTransportService
 *      ↓
 * Provider
 *
 * IMPORTANT
 * ------------------------------------------------------------
 *
 * This controller NO LONGER calls sendOutboundMessage()
 * directly.
 *
 * It creates the canonical AI Message and durable
 * DeliveryJob instead.
 *
 * The deliveryWorker owns actual provider delivery.
 *
 * ============================================================
 */

import {
  generateAIResponse,
} from "../services/aiResponseEngine.js";

import {
  persistLeadIntent,
} from "../services/leadIntentPersistenceService.js";

import {
  updateConversationState,
} from "../services/conversationStateEngine.js";

import Message from "../models/message.js";

import {
  createDeliveryJob,
  resolveDeliveryProvider,
} from "../services/deliveryJobService.js";


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
    intent,
    organizationId
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
          organizationId
        )
      ) {

        console.warn(
          "⚠️ Intent persistence skipped: organizationId is missing."
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
        normalizedIntent,
        organizationId
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

    intent:
      mergeIfPresent(
        existing?.intent,
        normalizedIntent
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
         Validate organization context
      ------------------------------------------------------ */

      const outboundOrganizationId =
        normalizedExtractedData?.organizationId ||
        lead?.organizationId ||
        null;

      if (
        !hasValue(
          outboundOrganizationId
        )
      ) {

        console.warn(
          "⚠️ Auto reply skipped: organizationId is missing."
        );

        return;
      }

      console.log(
        "🏢 AUTO REPLY ORGANIZATION ID:",
        outboundOrganizationId
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
          effectiveIntent,
          outboundOrganizationId
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
        "📤 QUEUING AUTO REPLY TO:",
        lead.phone
      );

      console.log(
        "💬 MESSAGE:",
        finalMessage
      );


      /* ======================================================
         CHANNEL / SOURCE RESOLUTION
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
         Validate outbound source
      ------------------------------------------------------ */

      const validOutboundSources = [
        "sms",
        "whatsapp",
        "website",
        "facebook",
      ];

      if (
        !validOutboundSources.includes(
          outboundSource
        )
      ) {

        console.error(
          "❌ AUTO REPLY QUEUE FAILED: Unsupported outbound source.",
          {
            outboundSource,
            leadId:
              lead?._id ||
              null,
            organizationId:
              outboundOrganizationId,
          }
        );

        return {
          success: false,
          queued: false,
          reason:
            "Unsupported or missing outbound source.",
          source:
            outboundSource ||
            null,
        };
      }


      /* ------------------------------------------------------
         Resolve conversation ID
      ------------------------------------------------------ */

      const outboundConversationId =
        effectiveConversation?._id ||
        conversation?._id ||
        null;


      if (
        !outboundConversationId
      ) {

        console.error(
          "❌ AUTO REPLY QUEUE FAILED: conversationId is missing.",
          {
            leadId:
              lead?._id ||
              null,

            organizationId:
              outboundOrganizationId,
          }
        );

        return {
          success: false,
          queued: false,
          reason:
            "Conversation ID is required to create AI Message.",
        };
      }


      /* ------------------------------------------------------
         Resolve provider
      ------------------------------------------------------ */

      const outboundProvider =
        resolveDeliveryProvider(
          outboundSource
        );


      console.log(
        "🚚 AUTO REPLY DELIVERY PROVIDER:",
        outboundProvider ||
          "(none)"
      );


      /* ======================================================
         CREATE CANONICAL AI MESSAGE + DELIVERY JOB ATOMICALLY
      ====================================================== */

      /**
       * ATOMICITY INVARIANT
       * -------------------
       * Message and DeliveryJob must commit together.
       *
       * If either write fails, the transaction aborts and
       * neither new record is persisted.
       *
       * No provider calls or other external side effects belong
       * inside this transaction. The delivery worker remains
       * responsible for actual delivery and retries.
       */

      /**
       * Allocate the Message ID before entering withTransaction().
       * MongoDB may retry the transaction callback; keeping the ID
       * stable ensures callback retries represent the same Message.
       */
      const aiMessageId =
        new Message()._id;

      const aiMessageData = {
        _id:
          aiMessageId,

        organizationId:
          outboundOrganizationId,

        conversationId:
          outboundConversationId,

        leadId:
          lead?._id ||
          null,

        source:
          outboundSource,

        externalMessageId:
          null,

        senderId:
          null,

        senderRole:
          "ai",

        senderName:
          "AI Assistant",

        text:
          finalMessage,

        status:
          "sending",

        aiGenerated:
          true,

        aiConfidence:
          typeof normalizedAIResult?.score ===
            "number" &&
          normalizedAIResult.score >= 0 &&
          normalizedAIResult.score <= 100
            ? normalizedAIResult.score / 100
            : undefined,
      };

      /**
       * Keep the idempotency key stable for this logical Message.
       * This controller currently uses the "ai-message:" prefix.
       */
      const deliveryIdempotencyKey =
        `ai-message:${String(aiMessageId)}`;

      let aiMessage = null;
      let deliveryJob = null;
      let transactionCommitted = false;

      const session =
        await Message.db.startSession();

      try {
        await session.withTransaction(
          async () => {
            /* ================================================
               CREATE CANONICAL AI MESSAGE
            ================================================ */

            const createdMessages =
              await Message.create(
                [aiMessageData],
                { session }
              );

            const transactionMessage =
              createdMessages[0];

            if (
              !transactionMessage ||
              String(transactionMessage._id) !==
                String(aiMessageId)
            ) {
              throw new Error(
                "Atomic outbound creation failed: AI Message was not created correctly."
              );
            }

            /* ================================================
               CREATE DURABLE DELIVERY JOB
            ================================================ */

            const deliveryJobResult =
              await createDeliveryJob({
                organizationId:
                  outboundOrganizationId,

                messageId:
                  transactionMessage._id,

                conversationId:
                  outboundConversationId,

                leadId:
                  lead?._id ||
                  null,

                source:
                  outboundSource,

                recipient:
                  lead.phone,

                provider:
                  outboundProvider,

                idempotencyKey:
                  deliveryIdempotencyKey,

                channelMetadata:
                  normalizedExtractedData?.channelMetadata ||
                  {},

                metadata: {
                  aiGenerated: true,

                  leadId:
                    lead?._id ||
                    null,

                  conversationId:
                    outboundConversationId,

                  organizationId:
                    outboundOrganizationId,
                },

                // The job write must use the same transaction
                // session as the Message write.
                session,
              });

            const transactionDeliveryJob =
              deliveryJobResult?.job ||
              null;

            if (!transactionDeliveryJob) {
              throw new Error(
                "Atomic outbound creation failed: DeliveryJob was not created."
              );
            }

            /* ================================================
               VALIDATE MESSAGE/JOB RELATIONSHIP
            ================================================ */

            if (
              String(transactionDeliveryJob.messageId) !==
              String(transactionMessage._id)
            ) {
              throw new Error(
                "Atomic outbound creation failed: DeliveryJob references a different Message."
              );
            }

            if (
              String(transactionDeliveryJob.organizationId) !==
              String(transactionMessage.organizationId)
            ) {
              throw new Error(
                "Atomic outbound creation failed: Message and DeliveryJob organizations do not match."
              );
            }

            if (
              deliveryJobResult.created !== true ||
              deliveryJobResult.duplicate !== false
            ) {
              throw new Error(
                "Atomic outbound creation failed: expected a newly created DeliveryJob."
              );
            }

            /**
             * Store callback results for use only after
             * withTransaction() resolves successfully.
             *
             * These assignments have no external side effects.
             */
            aiMessage =
              transactionMessage;

            deliveryJob =
              transactionDeliveryJob;
          }
        );

        // withTransaction resolves after successful commit.
        transactionCommitted = true;

        if (!aiMessage || !deliveryJob) {
          throw new Error(
            "Outbound transaction completed without valid Message and DeliveryJob results."
          );
        }

        console.log(
          "✅ AI MESSAGE CREATED:",
          {
            messageId:
              aiMessage._id,

            organizationId:
              outboundOrganizationId,

            conversationId:
              outboundConversationId,

            leadId:
              lead?._id ||
              null,

            source:
              outboundSource,

            status:
              aiMessage.status,
          }
        );

        console.log(
          "✅ DELIVERY JOB CREATED:",
          {
            deliveryJobId:
              deliveryJob._id,

            messageId:
              aiMessage._id,

            organizationId:
              outboundOrganizationId,

            source:
              outboundSource,

            provider:
              deliveryJob.provider ||
              outboundProvider,

            status:
              deliveryJob.status,

            attempts:
              deliveryJob.attempts,
          }
        );

        console.log(
          "🔒 ATOMIC OUTBOUND CREATION COMMITTED:",
          {
            messageId:
              aiMessage._id,

            deliveryJobId:
              deliveryJob._id,

            idempotencyKey:
              deliveryIdempotencyKey,

            transactionCommitted,
          }
        );
      } catch (transactionError) {
        /**
         * Rethrow so the existing outer sendAutoReply() catch
         * returns success:false and queued:false.
         *
         * A failure in either write causes withTransaction()
         * to abort the transaction.
         */
        console.error(
          "❌ ATOMIC OUTBOUND CREATION FAILED:",
          {
            messageId:
              aiMessageId,

            organizationId:
              outboundOrganizationId,

            conversationId:
              outboundConversationId,

            transactionCommitted,

            error:
              transactionError?.message,
          }
        );

        throw transactionError;
      } finally {
        await session.endSession();
      }

      /* ======================================================
         UPDATE CONVERSATION MESSAGE STATE
      ====================================================== */

      /**
       * The AI Message is now a real conversation message.
       *
       * We update the in-memory conversation object when
       * possible so callers receive the latest conversation
       * state.
       *
       * We intentionally DO NOT increment unreadCount here.
       *
       * Customer inbound messages increment unreadCount.
       *
       * AI outbound messages should not create an unread
       * customer notification.
       */

      try {

        if (
          conversation &&
          typeof conversation ===
            "object"
        ) {

          if (
            typeof conversation.messageCount ===
              "number"
          ) {

            conversation.messageCount += 1;

          } else {

            conversation.messageCount =
              1;
          }


          conversation.lastMessage = {

            text:
              finalMessage,

            senderRole:
              "ai",

            senderId:
              null,

            timestamp:
              new Date(),

          };


          conversation.lastUpdated =
            new Date();


          /**
           * If this is a Mongoose document, persist the
           * conversation update.
           *
           * updateConversationState() may already have
           * persisted other state, so save only the
           * conversation message metadata here.
           */

          if (
            typeof conversation.save ===
            "function"
          ) {

            await conversation.save();

          }

        }

      } catch (
        conversationUpdateError
      ) {

        /**
         * The Message and DeliveryJob already exist.
         *
         * Therefore a conversation metadata failure must
         * NOT destroy the durable outbound job.
         *
         * The delivery pipeline remains recoverable.
         */

        console.error(
          "⚠️ AI conversation message metadata update failed:",
          conversationUpdateError
        );
      }


      /* ======================================================
         QUEUED RESULT
      ====================================================== */

      console.log(
        "📨 AUTO REPLY QUEUED FOR DELIVERY:",
        {

          messageId:
            aiMessage?._id,

          deliveryJobId:
            deliveryJob?._id,

          recipient:
            lead.phone,

          source:
            outboundSource,

          provider:
            deliveryJob?.provider ||
            outboundProvider,

        }
      );


      return {

        success:
          true,

        queued:
          true,

        delivered:
          false,

        messageId:
          aiMessage?._id,

        deliveryJobId:
          deliveryJob?._id,

        organizationId:
          outboundOrganizationId,

        conversationId:
          outboundConversationId,

        leadId:
          lead?._id ||
          null,

        source:
          outboundSource,

        provider:
          deliveryJob?.provider ||
          outboundProvider ||
          null,

        status:
          deliveryJob?.status ||
          "pending",

        message:
          finalMessage,

      };


    } catch (
      error
    ) {

      console.error(
        "❌ Auto reply failed:",
        error
      );

      return {

        success:
          false,

        queued:
          false,

        delivered:
          false,

        error:
          error?.message ||
          "Auto reply failed.",

      };
    }
  };


/* ============================================================
   DEFAULT EXPORT
============================================================ */

export default {
  sendAutoReply,
};