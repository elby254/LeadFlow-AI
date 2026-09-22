/**
 * ==========================================================
 *
 * AI INGESTION CONTROLLER
 *
 * Production entry point for customer conversations.
 *
 * ==========================================================
 *
 * CHANNEL ARCHITECTURE
 * ==========================================================
 *
 * WhatsApp
 *    ↓
 * WhatsApp Business Number
 *    ↓
 * WhatsApp Adapter
 *    ↓
 * req.normalizedMessage
 *    ↓
 * Resolve Organization
 *    ↓
 * ingestMessage()
 *
 *
 * SMS
 *    ↓
 * SMS Number
 *    ↓
 * SMS Adapter
 *    ↓
 * req.normalizedMessage
 *    ↓
 * Resolve Organization
 *    ↓
 * ingestMessage()
 *
 *
 * Website
 *    ↓
 * Tenant Context / Default Organization
 *    ↓
 * Website Adapter
 *    ↓
 * req.normalizedMessage
 *    ↓
 * Resolve Organization
 *    ↓
 * ingestMessage()
 *
 *
 * Facebook
 *    ↓
 * Page / Business Account
 *    ↓
 * Facebook Adapter
 *    ↓
 * req.normalizedMessage
 *    ↓
 * Resolve Organization
 *    ↓
 * ingestMessage()
 *
 * ==========================================================
 *
 * NORMALIZED MESSAGE CONTRACT
 * ==========================================================
 *
 * Channel adapters convert provider-specific payloads into:
 *
 * {
 *   channel,
 *   organizationId,
 *   customer: {
 *     name,
 *     phone,
 *     externalId
 *   },
 *   message: {
 *     text,
 *     type,
 *     externalMessageId
 *   },
 *   metadata: {}
 * }
 *
 * ==========================================================
 *
 * EXTRACTION ARCHITECTURE
 * ==========================================================
 *
 * Current customer message
 *          ↓
 * AI extraction
 *          ↓
 * deterministic extraction
 *          ↓
 * normalized extraction
 *          ↓
 * CURRENT MESSAGE WINS
 *          ↓
 * existing lead memory fills ONLY genuinely missing fields
 *
 * ==========================================================
 *
 * WEBHOOK IDEMPOTENCY
 * ==========================================================
 *
 * Provider message
 *          ↓
 * organizationId
 *          +
 * source
 *          +
 * externalMessageId
 *          ↓
 * Message lookup
 *          ↓
 * already processed?
 *      ↙          ↘
 *    YES           NO
 *     ↓             ↓
 * IGNORE         AI PROCESSING
 *
 * ==========================================================
 */

import Lead from "../models/lead.js";
import Message from "../models/message.js";

import {
  analyzeMessage,
} from "../services/aiQualificationService.js";

import {
  sendAutoReply,
} from "./aiAutoReplyController.js";

import {
  getConversationContext,
  detectConversationStage,
  updateConversationQualification,
} from "../services/conversationContextService.js";

import {
  updateConversationState,
} from "../services/conversationStateEngine.js";

import {
  calculateLeadScore,
} from "../services/leadScoringRulesEngine.js";

import leadEventBus, {
  LEAD_EVENTS,
} from "../events/leadEvents.js";

import {
  autoAssignLead,
} from "../services/leadAutoAssignmentService.js";

import {
  safeString,
  normalizePhone,
  normalizeBedrooms,
  normalizeBudget,
  normalizeMoveDate,
  normalizeLocation,
  normalizeIntent,

  resolveOrganizationId,
  isValidOrganizationId,

  resolveSource,

  extractStructuredCustomerData,
  mergeExtractedData,

  synchronizeAIInsights,
  synchronizeConversationMemory,

  debugExtraction,
} from "../services/aiIngestionService.js";



// ==========================================================
// DETECT HTTP RESPONSE
// ==========================================================

const isHttpResponse = (
  res
) => {

  return Boolean(
    res &&
    typeof res.status ===
      "function" &&
    typeof res.json ===
      "function"
  );
};



// ==========================================================
// NORMALIZED MESSAGE DETECTION
// ==========================================================

const hasNormalizedMessage = (
  req
) => {

  return Boolean(
    req?.normalizedMessage &&
    typeof req.normalizedMessage ===
      "object"
  );
};



// ==========================================================
// PREPARE NORMALIZED INGESTION INPUT
// ==========================================================

const prepareIngestionInput = (
  req
) => {

  const normalizedMessage =
    req?.normalizedMessage;



  // ========================================================
  // NEW STANDARDIZED ADAPTER CONTRACT
  // ========================================================

  if (
    hasNormalizedMessage(
      req
    )
  ) {

    const customer =
      normalizedMessage?.customer ||
      {};



    const message =
      normalizedMessage?.message ||
      {};



    const organizationId =
      normalizedMessage?.organizationId ||
      req?.organizationId ||
      req?.organization?._id ||
      req?.user?.organizationId ||
      null;



    const source =
      safeString(
        normalizedMessage?.channel
      ).toLowerCase();



    return {

      organizationId,

      source,

      phone:
        customer?.phone ??
        null,

      customerName:
        customer?.name ??
        null,

      externalId:
        customer?.externalId ??
        null,

      message:
        message?.text ??
        "",

      messageType:
        message?.type ??
        "text",

      externalMessageId:
        message?.externalMessageId ??
        null,

      metadata:
        normalizedMessage?.metadata ||
        {},

    };
  }



  // ========================================================
  // LEGACY / INTERNAL CONTRACT
  // ========================================================

  const body =
    req?.body ||
    {};



  return {

    organizationId:
      req?.organizationId ||
      req?.organization?._id ||
      req?.user?.organizationId ||
      null,

    source:
      safeString(
        req?.source ||
        req?.channel
      ).toLowerCase(),

    phone:
      body?.phone ??
      null,

    customerName:
      req?.customerName ||
      req?.channelCustomer?.name ||
      req?.customer?.name ||
      null,

    externalId:
      req?.channelCustomer?.externalId ||
      req?.customer?.externalId ||
      null,

    message:
      body?.message ??
      "",

    messageType:
      "text",

    externalMessageId:
      null,

    metadata:
      req?.channelMetadata ||
      {},

  };
};



// ==========================================================
// SAFE LEAD STATUS
// ==========================================================

const normalizeLeadStatus = (
  value,
  fallback = "new"
) => {

  const status =
    safeString(
      value
    ).toLowerCase();

  if (!status) {
    return fallback;
  }

  const allowedStatuses = [

    "new",
    "contacted",
    "qualified",
    "hot",
    "converted",
    "lost",
    "closed",

  ];

  if (
    allowedStatuses.includes(
      status
    )
  ) {

    return status;
  }

  return fallback;
};



// ==========================================================
// CONVERSATION STATUS SAFETY
// ==========================================================

const isValidConversationStatus = (
  conversation,
  value
) => {

  const statusPath =
    conversation?.constructor?.schema?.path(
      "status"
    );

  if (
    !statusPath
  ) {

    return false;
  }

  const enumValues =
    statusPath.enumValues || [];

  return enumValues.includes(
    value
  );
};



// ==========================================================
// CORE INGESTION ENGINE
// ==========================================================

const processIngestion = async (
  req
) => {

  // ========================================================
  // 1. VALIDATE REQUEST
  // ========================================================

  if (
    !req ||
    typeof req !== "object"
  ) {

    const error =
      new Error(
        "Invalid ingestion request."
      );

    error.status = 400;

    throw error;
  }



  if (
    !req.body ||
    typeof req.body !== "object"
  ) {

    const error =
      new Error(
        "Ingestion request body is required."
      );

    error.status = 400;

    throw error;
  }



  // ========================================================
  // 1A. NORMALIZED MESSAGE CONTRACT
  // ========================================================

  const ingestionInput =
    prepareIngestionInput(
      req
    );



  // ========================================================
  // 1B. REQUEST BODY CONTRACT
  // ========================================================

  const allowedBodyFields = [
    "phone",
    "message",
  ];

  const unexpectedBodyFields =
    Object.keys(
      req.body
    ).filter(
      (field) =>
        !allowedBodyFields.includes(
          field
        )
    );

  if (
    unexpectedBodyFields.length > 0
  ) {

    const error =
      new Error(
        `Only phone and message are accepted in req.body. Unexpected field(s): ${unexpectedBodyFields.join(", ")}`
      );

    error.status = 400;

    throw error;
  }



  // ========================================================
  // 2. RESOLVE ORGANIZATION
  // ========================================================

  if (
    ingestionInput.organizationId &&
    !req.organizationId
  ) {

    req.organizationId =
      ingestionInput.organizationId;
  }



  const organizationId =
    resolveOrganizationId(
      req
    ) ||
    ingestionInput.organizationId;



  // ========================================================
  // 3. RESOLVE SOURCE
  // ========================================================

  if (
    ingestionInput.source &&
    !req.source
  ) {

    req.source =
      ingestionInput.source;
  }



  if (
    ingestionInput.source &&
    !req.channel
  ) {

    req.channel =
      ingestionInput.source;
  }



  const normalizedSource =
    resolveSource(
      req
    ) ||
    ingestionInput.source;



  // ========================================================
  // 4. EXTRACT INPUT
  // ========================================================

  const rawPhone =
    ingestionInput.phone;



  const message =
    ingestionInput.message;



  // ========================================================
  // EXTERNAL PROVIDER MESSAGE ID
  // ========================================================
  //
  // This is the provider's unique message identifier.
  //
  // WhatsApp:
  //
  //     wamid....
  //
  // It is NOT the MongoDB Message _id.
  //
  // It is used to prevent webhook retries from triggering
  // AI processing and automatic replies again.
  //
  // ========================================================

  const externalMessageId =
    safeString(
      ingestionInput.externalMessageId
    ) ||
    null;



  // ========================================================
  // CUSTOMER NAME
  // ========================================================

  const channelCustomerName =
    safeString(
      ingestionInput.customerName ||
      req?.customerName ||
      req?.channelCustomer?.name ||
      req?.customer?.name
    );



  // ========================================================
  // PHONE
  // ========================================================

  const phone =
    normalizePhone(
      rawPhone
    );



  console.log(
    "\n=========================================================="
  );

  console.log(
    "🧠 AI INGEST TRIGGERED:"
  );

  console.log({

    organizationId,

    source:
      normalizedSource,

    customerName:
      channelCustomerName ||
      null,

    phone,

    message,

    externalMessageId,

    normalized:
      hasNormalizedMessage(
        req
      ),

  });

  console.log(
    "=========================================================="
  );



  // ========================================================
  // 5. VALIDATE MESSAGE
  // ========================================================

  if (
    typeof message !==
      "string" ||
    !message.trim()
  ) {

    const error =
      new Error(
        "Message is required."
      );

    error.status = 400;

    throw error;
  }



  const cleanMessage =
    message.trim();



  // ========================================================
  // 5A. VALIDATE PHONE
  // ========================================================

  if (
    !phone
  ) {

    const error =
      new Error(
        "Phone is required."
      );

    error.status = 400;

    throw error;
  }



  // ========================================================
  // 6. VALIDATE ORGANIZATION
  // ========================================================

  if (
    !isValidOrganizationId(
      organizationId
    )
  ) {

    console.error(
      "❌ AI INGESTION ERROR: Organization could not be resolved."
    );

    const error =
      new Error(
        "Organization context could not be resolved."
      );

    error.status = 400;

    throw error;
  }



  // ========================================================
  // 7. VALIDATE SOURCE
  // ========================================================

  if (
    !normalizedSource
  ) {

    console.error(
      "❌ AI INGESTION ERROR: Invalid lead source.",
      {
        source:
          req?.source ||
          req?.channel ||
          "website",
      }
    );

    const error =
      new Error(
        "A valid lead source is required."
      );

    error.status = 400;

    throw error;
  }



  // ========================================================
  // 7A. WEBHOOK IDEMPOTENCY CHECK
  // ========================================================
  //
  // IMPORTANT:
  //
  // This check MUST happen BEFORE:
  //
  //     analyzeMessage()
  //     Lead lookup
  //     Lead creation
  //     Conversation updates
  //     Events
  //     sendAutoReply()
  //
  // The provider's external message ID is scoped by:
  //
  //     organizationId
  //     source
  //     externalMessageId
  //
  // This prevents the same WhatsApp webhook from being
  // processed more than once.
  //
  // For channels that do not provide an external provider
  // message ID, normal processing continues.
  //
  // ========================================================

  if (
    externalMessageId
  ) {

    const existingExternalMessage =
      await Message.findOne({

        organizationId,

        source:
          normalizedSource,

        externalMessageId,

      })
        .select({

          _id: 1,

          organizationId: 1,

          conversationId: 1,

          leadId: 1,

          source: 1,

          externalMessageId: 1,

          createdAt: 1,

        })
        .lean();



    if (
      existingExternalMessage
    ) {

      console.log(
        "♻️ DUPLICATE WHATSAPP MESSAGE IGNORED"
      );

      console.log({

        organizationId,

        source:
          normalizedSource,

        externalMessageId,

        existingMessageId:
          existingExternalMessage._id,

        conversationId:
          existingExternalMessage.conversationId ||
          null,

        leadId:
          existingExternalMessage.leadId ||
          null,

        originalCreatedAt:
          existingExternalMessage.createdAt ||
          null,

      });



      return {

        success:
          true,

        duplicate:
          true,

        message:
          "Duplicate external message ignored.",

        data: {

          duplicate:
            true,

          externalMessageId,

          source:
            normalizedSource,

          organizationId,

          existingMessageId:
            existingExternalMessage._id,

          conversationId:
            existingExternalMessage.conversationId ||
            null,

          leadId:
            existingExternalMessage.leadId ||
            null,

        },

      };
    }



    console.log(
      "🆕 NEW EXTERNAL MESSAGE ID:",
      externalMessageId
    );
  }



  // ========================================================
  // 8. AI QUALIFICATION
  // ========================================================

  const aiResult =
    await Promise.resolve(
      analyzeMessage(
        cleanMessage
      )
    );



  console.log(
    "🤖 AI RESULT:",
    aiResult
  );



  console.log(
    "AI Extraction:"
  );



  console.dir(
    aiResult?.extracted,
    {
      depth: null,
    }
  );



  // ========================================================
  // 9. EXTRACT AI DATA
  // ========================================================

  const aiExtractedData =
    aiResult?.extracted ||
    aiResult?.extractedData ||
    {};



  const aiInsights =
    aiResult?.insights ||
    {};



  // ========================================================
  // 9A. DETERMINISTIC EXTRACTION
  // ========================================================

  const deterministicData =
    extractStructuredCustomerData(
      cleanMessage
    );



  console.log(
    "🔎 DETERMINISTIC EXTRACTION:",
    deterministicData
  );



  // ========================================================
  // 9A.1 RESOLVE CUSTOMER NAME
  // ========================================================

  let customerName =
    channelCustomerName ||
    safeString(
      deterministicData?.name
    ) ||
    "";



  console.log(
    "👤 RESOLVED CUSTOMER NAME:",
    customerName ||
    null
  );



  // ========================================================
  // 9B. MERGE EXTRACTION
  // ========================================================

  const extractedData =
    mergeExtractedData(
      aiExtractedData,
      deterministicData
    );



  // ========================================================
  // 9B.1 NORMALIZED EXTRACTION
  // ========================================================

  const normalizedExtraction =
    extractedData;



  console.log(
    "🧠 NORMALIZED EXTRACTION:",
    normalizedExtraction
  );



  // ========================================================
  // 9C. FULL EXTRACTION DEBUG
  // ========================================================

  debugExtraction(

    cleanMessage,

    aiResult,

    aiExtractedData,

    deterministicData,

    normalizedExtraction

  );



  // ========================================================
  // 10. LOAD CONVERSATION CONTEXT
  // ========================================================

  let conversation =
    await getConversationContext(

      organizationId,

      customerName,

      phone

    );



  console.log(
    "📚 Loading conversation for:",
    {

      organizationId,

      customerName,

      phone,

    }
  );



  if (
    conversation
  ) {

    console.log(
      "♻️ Existing conversation loaded:",
      conversation._id.toString()
    );



    console.log(
      "🔗 EXISTING CONVERSATION - LEAD ID:",
      conversation.leadId ||
      null
    );



    console.log(
      "📚 Conversation Context:"
    );



    console.dir(
      conversation.toObject(),
      {
        depth: null,
      }
    );

  } else {

    console.log(
      "🆕 No existing conversation found."
    );
  }



  // ========================================================
  // 11. FIND EXISTING LEAD
  // ========================================================

  let lead = null;



  if (
    phone
  ) {

    lead =
      await Lead.findOne({

        phone,

        organizationId,

      });
  }



  if (
    !lead &&
    customerName
  ) {

    lead =
      await Lead.findOne({

        name:
          customerName,

        organizationId,

      }).sort({

        updatedAt:
          -1,

      });
  }



  // ========================================================
  // 11A. RESOLVE NAME FROM EXISTING LEAD
  // ========================================================

  if (
    !customerName &&
    lead?.name &&
    lead.name !== "Unknown"
  ) {

    customerName =
      safeString(
        lead.name
      );
  }



  // ========================================================
  // DEBUG EXISTING LEAD
  // ========================================================

  if (
    lead
  ) {

    console.log(
      "♻️ EXISTING LEAD FOUND:"
    );



    console.dir(
      lead.toObject(),
      {
        depth: null,
      }
    );

  } else {

    console.log(
      "🆕 NO EXISTING LEAD FOUND."
    );
  }



  // ========================================================
  // 12. DETERMINE NEW LEAD
  // ========================================================

  const isNewLead =
    !lead;



  // ========================================================
  // 13. CREATE LEAD
  // ========================================================

  if (
    !lead
  ) {

    lead =
      new Lead({

        name:
          customerName ||
          "Unknown",

        phone:
          phone ||
          "",

        status:
          "new",

        organizationId,

        source:
          normalizedSource,

        intent:
          normalizeIntent(
            normalizedExtraction?.intent
          ) ||
          "",

        assignedTo:
          null,

        assignedBy:
          null,

        assignedAt:
          null,

        assignedSource:
          "auto",

      });



    console.log(
      "🆕 NEW LEAD CREATED IN MEMORY:",
      {

        source:
          normalizedSource,

        organizationId:
          String(
            organizationId
          ),

        intent:
          lead.intent ||
          "",

      }
    );
  }



  // ========================================================
  // 14. PROGRESSIVE CUSTOMER ENRICHMENT
  // ========================================================

  if (
    customerName
  ) {

    lead.name =
      customerName;
  }



  if (
    phone
  ) {

    lead.phone =
      phone;
  }



  // ========================================================
  // 15. SOURCE
  // ========================================================

  lead.source =
    normalizedSource;



  // ========================================================
  // 16. BUDGET
  // ========================================================

  if (
    extractedData.budget !==
      undefined &&
    extractedData.budget !==
      null &&
    extractedData.budget !==
      ""
  ) {

    const budget =
      normalizeBudget(
        extractedData.budget
      );



    if (
      budget !== null
    ) {

      console.log(
        "💰 CURRENT MESSAGE BUDGET:",
        budget
      );



      lead.budget =
        budget;
    }
  }



  // ========================================================
  // 17. LOCATION
  // ========================================================

  if (
    extractedData.location
  ) {

    const location =
      normalizeLocation(
        extractedData.location
      );



    if (
      location
    ) {

      console.log(
        "📍 CURRENT MESSAGE LOCATION:",
        location
      );



      lead.location =
        location;
    }
  }



  // ========================================================
  // 18. BEDROOMS
  // ========================================================

  if (
    extractedData.bedrooms !==
      undefined &&
    extractedData.bedrooms !==
      null &&
    extractedData.bedrooms !==
      ""
  ) {

    const bedrooms =
      normalizeBedrooms(
        extractedData.bedrooms
      );



    if (
      bedrooms !== null
    ) {

      console.log(
        "🛏️ CURRENT MESSAGE BEDROOMS:",
        bedrooms
      );



      lead.bedrooms =
        bedrooms;
    }
  }



  // ========================================================
  // 19. MOVE DATE
  // ========================================================

  if (
    extractedData.moveDate
  ) {

    const moveDate =
      normalizeMoveDate(
        extractedData.moveDate
      );



    if (
      moveDate
    ) {

      console.log(
        "📅 CURRENT MESSAGE MOVE DATE:",
        moveDate
      );



      lead.moveDate =
        moveDate;
    }
  }



  // ========================================================
  // 20. URGENCY
  // ========================================================

  if (
    typeof extractedData.urgent ===
      "boolean"
  ) {

    console.log(
      "🚨 CURRENT MESSAGE URGENCY:",
      extractedData.urgent
    );



    lead.urgent =
      extractedData.urgent;
  }



  // ========================================================
  // 21. AI INSIGHTS
  // ========================================================

  lead.aiInsights = {

    ...(lead.aiInsights || {}),

    ...aiInsights,

  };



  // ========================================================
  // 21A. INTENT MEMORY
  // ========================================================

  if (
    extractedData.intent
  ) {

    const normalizedIntentValue =
      normalizeIntent(
        extractedData.intent
      );



    if (
      normalizedIntentValue
    ) {

      lead.aiInsights = {

        ...(lead.aiInsights || {}),

        intent:
          normalizedIntentValue,

      };
    }
  }



  // ========================================================
  // 21B. SYNCHRONIZE AI INSIGHTS
  // ========================================================

  synchronizeAIInsights(
    lead,
    {
      ...aiResult,

      insights:
        aiInsights,

    }
  );



  // ========================================================
  // 21C. LEAD INTENT
  // ========================================================

  const normalizedLeadIntent =
    normalizeIntent(
      extractedData?.intent
    );



  if (
    normalizedLeadIntent
  ) {

    lead.intent =
      normalizedLeadIntent;
  }



  // ========================================================
  // 22. LEAD STATUS
  // ========================================================

  if (
    aiResult?.stage
  ) {

    lead.status =
      normalizeLeadStatus(
        aiResult.stage,
        lead.status ||
        "new"
      );
  }



  if (
    !lead.status
  ) {

    lead.status =
      "new";
  }



  // ========================================================
  // 23. CALCULATE LEAD SCORE
  // ========================================================

  lead.score =
    calculateLeadScore(
      lead
    );



  console.log(
    "🎯 LEAD SCORE:",
    lead.score
  );



  // ========================================================
  // 23A. SYNCHRONIZE BUYING INTENT AGAINST FINAL SCORE
  // ========================================================

  synchronizeAIInsights(
    lead,
    {
      ...aiResult,

      score:
        lead.score,

      insights:
        aiInsights,

    }
  );



  // ========================================================
  // 24. COMPLETION STATE
  // ========================================================

  const hasBudget =
    lead.budget !==
      undefined &&
    lead.budget !==
      null;



  const hasLocation =
    Boolean(
      lead.location
    );



  const hasBedrooms =
    lead.bedrooms !==
      undefined &&
    lead.bedrooms !==
      null;



  const hasMoveDate =
    Boolean(
      lead.moveDate
    );



  lead.isComplete =
    hasBudget &&
    hasLocation &&
    hasBedrooms &&
    hasMoveDate;



  // ========================================================
  // 25. DEBUG LEAD
  // ========================================================

  console.log(
    "========== LEAD BEFORE SAVE =========="
  );



  console.dir(
    lead.toObject(),
    {
      depth: null,
    }
  );



  console.log(
    "======================================"
  );



  // ========================================================
  // 26. SAVE LEAD
  // ========================================================

  await lead.save();



  console.log(
    "✅ LEAD SAVED:",
    lead._id.toString()
  );



  // ========================================================
  // 26A. POST-SAVE EXTRACTION VERIFICATION
  // ========================================================

  console.log(
    "\n=========================================================="
  );



  console.log(
    "🔍 POST-SAVE LEAD EXTRACTION VERIFICATION"
  );



  console.log(
    "=========================================================="
  );



  console.table({

    message:
      cleanMessage,

    budget:
      lead.budget ??
      null,

    location:
      lead.location ||
      "",

    bedrooms:
      lead.bedrooms ??
      null,

    moveDate:
      lead.moveDate ||
      "",

    phone:
      lead.phone ||
      "",

    urgent:
      lead.urgent ??
      false,

    intent:
      lead.intent ||
      "",

    score:
      lead.score ??
      0,

    status:
      lead.status ||
      "",

    isComplete:
      lead.isComplete ??
      false,

  });



  console.log(
    "==========================================================\n"
  );



  // ========================================================
  // 27. AUTO ASSIGNMENT
  // ========================================================

  try {

    await autoAssignLead(
      lead
    );



    const assignedLead =
      await Lead.findById(
        lead._id
      );



    if (
      !assignedLead
    ) {

      throw new Error(
        "Lead disappeared after auto-assignment."
      );
    }



    lead =
      assignedLead;



    console.log(
      "👤 LEAD ASSIGNMENT:",
      {

        leadId:
          lead._id,

        assignedTo:
          lead.assignedTo,

        agent:
          lead.agent,

      }
    );



  } catch (
    assignmentError
  ) {

    console.error(
      "⚠️ AUTO ASSIGNMENT FAILED:",
      assignmentError.message
    );



    console.error(
      assignmentError
    );
  }



  // ========================================================
  // 28. UPDATE CONVERSATION QUALIFICATION MEMORY
  // ========================================================

  conversation =
    await updateConversationQualification(

      conversation,

      lead

    );



  // ========================================================
  // 28A. FORCE CURRENT LEAD MEMORY INTO CONVERSATION
  // ========================================================

  synchronizeConversationMemory(

    conversation,

    lead

  );



  // ========================================================
  // 29. DETECT CONVERSATION STAGE
  // ========================================================

  const stage =
    detectConversationStage(
      lead
    );



  console.log(
    "💬 DETECTED CONVERSATION STAGE:",
    stage
  );



  // ========================================================
  // 30. CONVERSATION STATE ENGINE
  // ========================================================

  const state =
    await updateConversationState(

      lead,

      conversation,

      extractedData,

      null

    );



  console.log(
    "🧠 CONVERSATION STATE:",
    state
  );



  // ========================================================
  // 30A. SYNCHRONIZE STATE MEMORY
  // ========================================================

  if (
    state?.conversation
  ) {

    synchronizeConversationMemory(

      state.conversation,

      lead

    );
  }



  // ========================================================
  // 31. UPDATE CONVERSATION METADATA
  // ========================================================

  conversation.customerName =

    customerName ||

    lead.name ||

    conversation.customerName ||

    "Unknown";



  if (
    lead.phone
  ) {

    conversation.phone =
      lead.phone;
  }



  conversation.leadId =
    lead._id;



  conversation.stage =

    state?.stage ||

    stage ||

    conversation.stage ||

    "collect_location";



  conversation.lastUpdated =
    new Date();



  // ========================================================
  // 31A. CONVERSATION STATUS
  // ========================================================

  const candidateConversationStatus =
    safeString(
      state?.status
    ).toLowerCase();



  if (
    candidateConversationStatus &&
    isValidConversationStatus(
      conversation,
      candidateConversationStatus
    )
  ) {

    conversation.status =
      candidateConversationStatus;
  }



  // ========================================================
  // 31B. FINAL QUALIFICATION MEMORY SYNC
  // ========================================================

  synchronizeConversationMemory(

    conversation,

    lead

  );



  // ========================================================
  // SAVE CONVERSATION
  // ========================================================

  await conversation.save();



  console.log(
    "💬 SAVED CONVERSATION:"
  );



  console.dir(
    conversation.toObject(),
    {
      depth: null,
    }
  );



  // ========================================================
  // 32. CREATE CUSTOMER MESSAGE
  // ========================================================
  //
  // IMPORTANT:
  //
  // source + externalMessageId are now persisted so the
  // same provider message can be recognized if the webhook
  // is delivered again.
  //
  // For WhatsApp this stores the Meta wamid.
  //
  // ========================================================

  const customerMessage =
    await Message.create({

      organizationId,

      conversationId:
        conversation._id,

      leadId:
        lead._id,

      source:
        normalizedSource,

      externalMessageId:
        externalMessageId,

      senderId:
        null,

      senderRole:
        "customer",

      senderName:
        customerName ||
        lead.name ||
        "",

      text:
        cleanMessage,

      status:
        "sent",

      aiGenerated:
        false,

    });



  console.log(
    "💬 CUSTOMER MESSAGE SAVED:",
    customerMessage._id.toString()
  );



  // ========================================================
  // 33. UPDATE CONVERSATION COUNTERS
  // ========================================================

  conversation.messageCount =

    Number(
      conversation.messageCount ||
      0
    ) + 1;



  conversation.unreadCount =

    Number(
      conversation.unreadCount ||
      0
    ) + 1;



  conversation.lastMessage = {

    text:
      cleanMessage,

    senderId:
      null,

    senderRole:
      "customer",

    createdAt:
      customerMessage.createdAt,

  };



  conversation.lastUpdated =
    new Date();



  await conversation.save();



  console.log(
    "📊 Conversation counters updated."
  );



  // ========================================================
  // 34. NEW LEAD EVENT
  // ========================================================

  if (
    isNewLead
  ) {

    leadEventBus.emit(

      LEAD_EVENTS.NEW_LEAD,

      lead

    );



    console.log(
      "📡 Emitting NEW_LEAD"
    );
  }



  // ========================================================
  // 35. HOT LEAD EVENT
  // ========================================================

  if (
    Number(
      lead.score
    ) >= 70
  ) {

    leadEventBus.emit(

      LEAD_EVENTS.HOT_LEAD,

      lead

    );



    console.log(
      "🔥 HOT_LEAD triggered"
    );
  }



  // ========================================================
  // 36. PIPELINE EVENT
  // ========================================================

  leadEventBus.emit(

    LEAD_EVENTS.PIPELINE_UPDATE,

    lead

  );



  console.log(
    "📊 PIPELINE_UPDATE sent"
  );



  // ========================================================
  // 37. CONVERSATION UPDATE EVENT
  // ========================================================

  leadEventBus.emit(

    LEAD_EVENTS.CONVERSATION_UPDATE,

    {

      lead,

      conversation,

      state,

      message:
        customerMessage,

    }

  );



  // ========================================================
  // 38. DEBUG NEXT STEP
  // ========================================================

  const missingFields = [];



  if (
    !hasBudget
  ) {

    missingFields.push(
      "budget"
    );
  }



  if (
    !hasLocation
  ) {

    missingFields.push(
      "location"
    );
  }



  if (
    !hasBedrooms
  ) {

    missingFields.push(
      "bedrooms"
    );
  }



  if (
    !hasMoveDate
  ) {

    missingFields.push(
      "moveDate"
    );
  }



  if (
    !lead.phone
  ) {

    missingFields.push(
      "phone"
    );
  }



  console.log(
    "🧠 Missing Fields:",
    missingFields
  );



  console.log(
    "❓ Next Step:",
    state?.nextStep ||
    null
  );



  // ========================================================
  // 39. AUTO REPLY
  // ========================================================
  //
  // normalizedSource is trusted because it came from the
  // channel adapter / normalized message contract.
  //
  // We explicitly pass the source forward so the outbound
  // transport layer knows whether this conversation came from:
  //
  //     whatsapp
  //     sms
  //     website
  //     facebook
  //
  // The customer's message cannot choose the transport.
  //
  // ========================================================

  console.log(
    "📤 SENDING AUTO REPLY TO:",
    lead.phone
  );



  console.log(
    "📡 AUTO REPLY CHANNEL:",
    normalizedSource
  );



  await sendAutoReply(

    lead,

    aiResult,

    conversation,

    state,

    {

      ...extractedData,

      channel:
        normalizedSource,

      source:
        normalizedSource,

      organizationId:
        organizationId,

      channelMetadata:
        ingestionInput.metadata ||
        req?.channelMetadata ||
        {},

    }

  );



  // ========================================================
  // 40. RETURN RESULT
  // ========================================================

  return {

    success:
      true,

    message:
      "Message processed successfully",

    data: {

      lead,

      conversation,

      customerMessage,

      aiResult,

      state,

      extraction: {

        ai:
          aiExtractedData,

        deterministic:
          deterministicData,

        merged:
          normalizedExtraction,

      },

    },

  };
};



// ==========================================================
// PUBLIC INGEST MESSAGE
// ==========================================================

export const ingestMessage = async (
  req,
  res
) => {

  // ========================================================
  // DETERMINE CALLING MODE
  // ========================================================

  const httpMode =
    isHttpResponse(
      res
    );



  try {

    // ======================================================
    // PROCESS
    // ======================================================

    const result =
      await processIngestion(
        req
      );



    // ======================================================
    // HTTP CALLER
    // ======================================================

    if (
      httpMode
    ) {

      return res
        .status(
          200
        )
        .json(
          result
        );
    }



    // ======================================================
    // INTERNAL CALLER
    // ======================================================

    return result;



  } catch (
    error
  ) {

    // ======================================================
    // ERROR LOGGING
    // ======================================================

    console.error(
      "❌ AI INGESTION FAILED:"
    );



    console.error(
      error
    );



    console.error(
      error?.stack
    );



    // ======================================================
    // HTTP ERROR
    // ======================================================

    if (
      httpMode
    ) {

      return res
        .status(
          error.status ||
          500
        )
        .json({

          success:
            false,

          message:
            error.status
              ? error.message
              : "AI ingestion failed.",

          error:
            error.message,

        });
    }



    // ======================================================
    // INTERNAL ERROR
    // ========================================================

    throw error;
  }
};



// ==========================================================
// DEFAULT EXPORT
// ==========================================================

export default {

  ingestMessage,

};