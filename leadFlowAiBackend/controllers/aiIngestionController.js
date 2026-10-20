/**
 * ==========================================================
 *
 * LeadFlow AI
 *
 * Production entry point for customer conversations.
 *
 * ==========================================================
 *
 * RESPONSIBILITIES
 * ==========================================================
 *
 * • Resolve tenant through centralized organization resolver
 * • Normalize public / adapter input
 * • Webhook idempotency
 * • AI extraction
 * • Deterministic extraction
 * • CURRENT MESSAGE WINS
 * • Existing lead memory fills missing information
 * • Canonical intent persistence in the Lead document
 * • Canonical lifecycle transition
 * • Canonical score calculation
 * • Durable critical Lead events through Outbox
 * • Auto-assignment
 * • Conversation qualification/state synchronization
 * • Customer Message persistence
 * • Non-critical realtime events
 * • AI auto reply
 *
 * ==========================================================
 *
 * CANONICAL AUTHORITIES
 * ==========================================================
 *
 * Tenant:
 *   services/organizationResolverService.js
 *
 * Extraction:
 *   services/aiQualificationService.js
 *   services/aiIngestionService.js
 *
 * Lead intent:
 *   services/leadIntentPersistenceService.js
 *
 * Lead lifecycle:
 *   services/leadLifeCycleService.js
 *
 * Lead scoring:
 *   services/leadScoringRulesEngine.js
 *
 * Assignment:
 *   services/leadAutoAssignmentService.js
 *   services/assignmentConflictResolver.js
 *
 * Reliable events:
 *   services/outboxIntegrationService.js
 *   workers/outboxWorker.js
 *
 * Conversation:
 *   services/conversationContextService.js
 *   services/conversationStateEngine.js
 *
 * Auto reply:
 *   controllers/aiAutoReplyController.js
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
  getLeadCategory,
  normalizeIntent,
  isValidCanonicalIntent,
} from "../services/leadScoringRulesEngine.js";

import {
  determineLeadStatus,
  transitionLeadStatus,
} from "../services/leadLifeCycleService.js";

import leadEventBus, {
  LEAD_EVENTS,
} from "../events/leadEvents.js";

import {
  autoAssignLead,
} from "../services/leadAutoAssignmentService.js";

import {
  withReliableTransaction,
  addLeadCreatedEvent,
  addLeadStatusChangedEvent,
  addLeadScoredEvent,
  addLeadWonEvent,
  addLeadLostEvent,
} from "../services/outboxIntegrationService.js";

import {
  resolveFromRequest,
} from "../services/organizationResolverService.js";

import {
  safeString,
  normalizePhone,
  normalizeBedrooms,
  normalizeBudget,
  normalizeMoveDate,
  normalizeLocation,
  isValidOrganizationId,
  resolveSource,
  extractStructuredCustomerData,
  mergeExtractedData,
  synchronizeAIInsights,
  synchronizeConversationMemory,
  debugExtraction,
} from "../services/aiIngestionService.js";


// ==========================================================
// CONSTANTS
// ==========================================================

const VALID_SOURCES = Object.freeze([
  "whatsapp",
  "sms",
  "website",
  "facebook",
]);

const VALID_LIFECYCLE_STATUSES = Object.freeze([
  "new",
  "contacted",
  "qualified",
  "viewing",
  "negotiation",
  "won",
  "lost",
]);


// ==========================================================
// HTTP RESPONSE DETECTION
// ==========================================================

const isHttpResponse = (
  res
) => {

  return Boolean(
    res &&
    typeof res.status === "function" &&
    typeof res.json === "function"
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
    typeof req.normalizedMessage === "object" &&
    !Array.isArray(
      req.normalizedMessage
    )
  );
};


// ==========================================================
// WEBSITE IDEMPOTENCY KEY
// ==========================================================

const getWebsiteIdempotencyKey = (
  req
) => {

  const rawKey =
    req?.headers?.["x-idempotency-key"];

  const normalizedKey =
    safeString(
      Array.isArray(rawKey)
        ? rawKey[0]
        : rawKey
    ).trim();

  return normalizedKey || null;
};


// ==========================================================
// PREPARE INGESTION INPUT
// ==========================================================
//
// Supports both:
//
// 1. Public website request:
//      req.body = {
//        phone,
//        message
//      }
//
// 2. Channel adapter:
//      req.normalizedMessage
//
// The trusted source comes from req.source / req.channel
// or the adapter normalized message.
//
// ==========================================================

const prepareIngestionInput = (
  req
) => {

  const normalizedMessage =
    req?.normalizedMessage;

  const requestSource =
    safeString(
      req?.source ||
      req?.channel
    ).toLowerCase();


  // ========================================================
  // PUBLIC WEBSITE BODY
  // ========================================================
  //
  // The website route intentionally forwards:
  //
  // {
  //   phone,
  //   message
  // }
  //
  // We preserve this exact contract.
  //
  // ========================================================

  if (
    requestSource === "website" &&
    typeof req?.body?.message === "string" &&
    req.body.message.trim()
  ) {

    return {

      source:
        "website",

      phone:
        req.body?.phone ??
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
        req.body.message,

      messageType:
        "text",

      // The direct public website route does not currently
      // provide a stable external provider message ID.
      externalMessageId:
        null,

      metadata:
        req?.channelMetadata ||
        {},

    };
  }


  // ========================================================
  // STANDARDIZED CHANNEL ADAPTER CONTRACT
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

    const source =
      safeString(
        normalizedMessage?.channel ||
        requestSource
      ).toLowerCase();

    return {

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
        message?.type ||
        "text",

      externalMessageId:
        message?.externalMessageId ??
        null,

      metadata:
        normalizedMessage?.metadata ||
        req?.channelMetadata ||
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

    source:
      requestSource,

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
// PUBLIC BODY VALIDATION
// ==========================================================

const validatePublicHttpBody = (
  req
) => {

  if (
    !req?.body ||
    typeof req.body !== "object" ||
    Array.isArray(req.body)
  ) {

    const error =
      new Error(
        "Ingestion request body is required."
      );

    error.status = 400;

    throw error;
  }


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
    statusPath.enumValues ||
    [];

  return enumValues.includes(
    value
  );
};


// ==========================================================
// LEAD STATUS SAFETY
// ==========================================================

const isCanonicalLeadStatus = (
  value
) => {

  return VALID_LIFECYCLE_STATUSES.includes(
    safeString(
      value
    ).toLowerCase()
  );
};


// ==========================================================
// EXTERNAL MESSAGE DUPLICATE ERROR DETECTION
// ==========================================================

const isExternalMessageDuplicateError = (
  error
) => {

  if (
    !error ||
    error.code !== 11000
  ) {

    return false;
  }

  const keyPattern =
    error?.keyPattern ||
    {};

  const keyValue =
    error?.keyValue ||
    {};

  const hasExternalMessageKey =
    Object.prototype.hasOwnProperty.call(
      keyPattern,
      "externalMessageId"
    ) ||
    Object.prototype.hasOwnProperty.call(
      keyValue,
      "externalMessageId"
    );

  const hasOrganizationKey =
    Object.prototype.hasOwnProperty.call(
      keyPattern,
      "organizationId"
    ) ||
    Object.prototype.hasOwnProperty.call(
      keyValue,
      "organizationId"
    );

  const hasSourceKey =
    Object.prototype.hasOwnProperty.call(
      keyPattern,
      "source"
    ) ||
    Object.prototype.hasOwnProperty.call(
      keyValue,
      "source"
    );

  return (
    hasExternalMessageKey &&
    hasOrganizationKey &&
    hasSourceKey
  );
};

const assertExternalMessageMatches = (
  existingMessage,
  incomingMessage
) => {
  if (!existingMessage?._id) {
    throw new Error(
      "Cannot validate a duplicate without an existing message."
    );
  }

  const existingText = String(
    existingMessage.text ?? ""
  ).trim();

  const incomingText = String(
    incomingMessage ?? ""
  ).trim();

  if (existingText !== incomingText) {
    const error = new Error(
      "This external message ID has already been used for different message content."
    );

    error.status = 409;
    error.code = "EXTERNAL_MESSAGE_ID_CONFLICT";

    throw error;
  }
};

// ==========================================================
// FIND EXISTING EXTERNAL MESSAGE
// ==========================================================

const findExistingExternalMessage = async (
  organizationId,
  normalizedSource,
  externalMessageId
) => {

  if (
    !organizationId ||
    !normalizedSource ||
    !externalMessageId
  ) {

    return null;
  }

  return Message
    .findOne({

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
  text: 1,
  senderRole: 1,
  createdAt: 1,
})
    .lean();
};

// ==========================================================
// BUILD DUPLICATE RESPONSE
// ==========================================================

const buildDuplicateResponse = (
  organizationId,
  normalizedSource,
  externalMessageId,
  existingExternalMessage
) => {
  if (!existingExternalMessage?._id) {
    throw new Error(
      "Cannot build a confirmed duplicate response without an existing message."
    );
  }

  console.log(
    "♻️ DUPLICATE EXTERNAL MESSAGE IGNORED"
  );

  console.log({
    organizationId,
    source: normalizedSource,
    externalMessageId,
    existingMessageId: existingExternalMessage._id,
    conversationId: existingExternalMessage.conversationId || null,
    leadId: existingExternalMessage.leadId || null,
    originalCreatedAt: existingExternalMessage.createdAt || null,
  });

  return {
    success: true,
    duplicate: true,
    message: "Duplicate external message ignored.",
    data: {
      duplicate: true,
      externalMessageId,
      source: normalizedSource,
      organizationId,
      existingMessageId: existingExternalMessage._id,
      conversationId: existingExternalMessage.conversationId || null,
      leadId: existingExternalMessage.leadId || null,
    },
  };
};

// ==========================================================
// APPLY EXTRACTED DATA TO LEAD
// ==========================================================

const applyExtractedDataToLead = (
  lead,
  extractedData,
  aiResult,
  aiInsights,
  customerName,
  phone,
  normalizedSource
) => {

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


  lead.source =
    normalizedSource;


  // ========================================================
  // BUDGET
  // ========================================================

  if (
    extractedData?.budget !== undefined &&
    extractedData?.budget !== null &&
    extractedData?.budget !== ""
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
  // LOCATION
  // ========================================================

  if (
    extractedData?.location
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
  // BEDROOMS
  // ========================================================

  if (
    extractedData?.bedrooms !== undefined &&
    extractedData?.bedrooms !== null &&
    extractedData?.bedrooms !== ""
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
  // MOVE DATE
  // ========================================================

  if (
    extractedData?.moveDate
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
  // URGENCY
  // ========================================================

  if (
    typeof extractedData?.urgent ===
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
  // AI INSIGHTS
  // ========================================================

  lead.aiInsights = {

    ...(lead.aiInsights || {}),

    ...(aiInsights || {}),

  };


  // ========================================================
  // CANONICAL INTENT
  // ========================================================

  const normalizedLeadIntent =
    normalizeIntent(
      extractedData?.intent
    );


  if (
    normalizedLeadIntent &&
    isValidCanonicalIntent(
      normalizedLeadIntent
    )
  ) {

    lead.intent =
      normalizedLeadIntent;

    lead.aiInsights = {

      ...(lead.aiInsights || {}),

      intent:
        normalizedLeadIntent,

    };

  }


  // ========================================================
  // AI INSIGHT SYNCHRONIZATION
  // ========================================================

  synchronizeAIInsights(
    lead,
    {
      ...(aiResult || {}),

      insights:
        aiInsights || {},

    }
  );


  return lead;
};


// ==========================================================
// CALCULATE COMPLETION
// ==========================================================

const updateLeadCompletion = (
  lead
) => {

  const hasBudget =
    lead.budget !== undefined &&
    lead.budget !== null;

  const hasLocation =
    Boolean(
      lead.location
    );

  const hasBedrooms =
    lead.bedrooms !== undefined &&
    lead.bedrooms !== null;

  const hasMoveDate =
    Boolean(
      lead.moveDate
    );

  lead.isComplete =
    Boolean(
      hasBudget &&
      hasLocation &&
      hasBedrooms &&
      hasMoveDate
    );

  return {
    hasBudget,
    hasLocation,
    hasBedrooms,
    hasMoveDate,
  };
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


  // ========================================================
  // 2. PREPARE INPUT
  // ========================================================

  const ingestionInput =
    prepareIngestionInput(
      req
    );


  // ========================================================
  // 3. RESOLVE ORGANIZATION
  // ========================================================

  const organization =
    await resolveFromRequest(
      req
    );


  const organizationId =
    organization?._id ||
    null;


  // ========================================================
  // 4. SOURCE
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
    (
      resolveSource(
        req
      ) ||
      ingestionInput.source ||
      ""
    )
      .trim()
      .toLowerCase();


  // ========================================================
  // 5. INPUT VALUES
  // ========================================================

  const phone =
    normalizePhone(
      ingestionInput.phone
    );

  const message =
    safeString(
      ingestionInput.message
    );


  const rawExternalMessageId =
    safeString(
      ingestionInput.externalMessageId
    ) ||
    null;


  // ========================================================
  // WEBSITE IDEMPOTENCY
  // ========================================================

  const websiteIdempotencyKey =
    normalizedSource === "website"
      ? getWebsiteIdempotencyKey(req)
      : null;


  if (
    normalizedSource === "website" &&
    !rawExternalMessageId &&
    !websiteIdempotencyKey
  ) {

    const error =
      new Error(
        "X-Idempotency-Key header is required for website ingestion."
      );

    error.status = 400;

    throw error;
  }


  const externalMessageId =
    rawExternalMessageId ||
    (
      normalizedSource === "website" &&
      websiteIdempotencyKey
        ? `website:${websiteIdempotencyKey}`
        : null
    );


  const ingestionOperationId =
    externalMessageId
      ? `${normalizedSource}:${externalMessageId}`
      : null;


  const channelCustomerName =
    safeString(
      ingestionInput.customerName ||
      req?.customerName ||
      req?.channelCustomer?.name ||
      req?.customer?.name
    );


  // ========================================================
  // DEBUG
  // ========================================================

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
  // 6. VALIDATE MESSAGE
  // ========================================================

  if (
    !message
  ) {

    const error =
      new Error(
        "Message is required."
      );

    error.status = 400;

    throw error;
  }


  // ========================================================
  // 7. VALIDATE PHONE
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
  // 8. VALIDATE ORGANIZATION
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
  // 9. VALIDATE SOURCE
  // ========================================================

  if (
    !VALID_SOURCES.includes(
      normalizedSource
    )
  ) {

    console.error(
      "❌ AI INGESTION ERROR: Invalid lead source.",
      {
        source:
          normalizedSource,
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
  // 10. WEBHOOK IDEMPOTENCY
  // ========================================================

  if (
    externalMessageId
  ) {

    const existingExternalMessage =
      await findExistingExternalMessage(

        organizationId,

        normalizedSource,

        externalMessageId

      );


    if (
      existingExternalMessage
    ) {

      assertExternalMessageMatches(
        existingExternalMessage,
        message
      );

      return buildDuplicateResponse(

        organizationId,

        normalizedSource,

        externalMessageId,

        existingExternalMessage

      );
    }


    console.log(
      "🆕 NEW EXTERNAL MESSAGE ID:",
      externalMessageId
    );
  }


  // ========================================================
  // 11. AI QUALIFICATION
  // ========================================================

  const aiResult =
    await Promise.resolve(
      analyzeMessage(
        message
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


  const aiExtractedData =
    aiResult?.extracted ||
    aiResult?.extractedData ||
    {};

  const aiInsights =
    aiResult?.insights ||
    {};


  // ========================================================
  // 12. DETERMINISTIC EXTRACTION
  // ========================================================

  const deterministicData =
    extractStructuredCustomerData(
      message
    );


  console.log(
    "🔎 DETERMINISTIC EXTRACTION:",
    deterministicData
  );


  // ========================================================
  // 13. CUSTOMER NAME
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
  // 14. MERGE EXTRACTION
  // ========================================================

  const extractedData =
    mergeExtractedData(
      aiExtractedData,
      deterministicData
    );


  const normalizedExtraction =
    extractedData;


  console.log(
    "🧠 NORMALIZED EXTRACTION:",
    normalizedExtraction
  );


  // ========================================================
  // 15. FULL EXTRACTION DEBUG
  // ========================================================

  debugExtraction(

    message,

    aiResult,

    aiExtractedData,

    deterministicData,

    normalizedExtraction

  );


  // ========================================================
  // 16. LOAD CONVERSATION
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
  // 17. FIND EXISTING LEAD
  // ========================================================

  let existingLead =
    null;


  if (
    phone
  ) {

    existingLead =
      await Lead.findOne({

        phone,

        organizationId,

      });
  }


  if (
    !existingLead &&
    customerName
  ) {

    existingLead =
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
  // 18. RESOLVE NAME FROM EXISTING LEAD
  // ========================================================

  if (
    !customerName &&
    existingLead?.name &&
    existingLead.name !== "Unknown"
  ) {

    customerName =
      safeString(
        existingLead.name
      );
  }


  // ========================================================
  // 19. EXISTING LEAD DEBUG
  // ========================================================

  if (
    existingLead
  ) {

    console.log(
      "♻️ EXISTING LEAD FOUND:"
    );

    console.dir(
      existingLead.toObject(),
      {
        depth: null,
      }
    );

  } else {

    console.log(
      "🆕 NO EXISTING LEAD FOUND."
    );
  }


  const isNewLead =
    !existingLead;


  // ========================================================
  // 20. CANDIDATE LEAD STATE
  // ========================================================

  let candidateLead;


  if (
    existingLead
  ) {

    candidateLead =
      existingLead;

  } else {

    candidateLead =
      new Lead({

        name:
          customerName ||
          "Unknown",

        phone:
          phone,

        status:
          "new",

        organizationId,

        source:
          normalizedSource,

        intent:
          "",

        score:
          0,

        assignedTo:
          null,

        assignedBy:
          null,

        assignedAt:
          null,

        assignedSource:
          null,

      });
  }


  // ========================================================
  // 21. APPLY EXTRACTION TO CANDIDATE
  // ========================================================

  applyExtractedDataToLead(

    candidateLead,

    extractedData,

    aiResult,

    aiInsights,

    customerName,

    phone,

    normalizedSource

  );


  // ========================================================
  // 22. COMPLETION
  // ========================================================

  const completion =
    updateLeadCompletion(
      candidateLead
    );


  // ========================================================
  // 23. DETERMINE CANONICAL LIFECYCLE
  // ========================================================

  const candidateStatus =
    determineLeadStatus(
      candidateLead,
      aiResult || {}
    );


  if (
    candidateStatus &&
    isCanonicalLeadStatus(
      candidateStatus
    ) &&
    candidateStatus !== candidateLead.status
  ) {

    transitionLeadStatus(
      candidateLead,
      candidateStatus
    );
  }


  if (
    !isCanonicalLeadStatus(
      candidateLead.status
    )
  ) {

    transitionLeadStatus(
      candidateLead,
      "new"
    );
  }


  // ========================================================
  // 24. CALCULATE CANONICAL SCORE
  // ========================================================

  candidateLead.score =
    calculateLeadScore(
      candidateLead
    );


  const candidateCategory =
    getLeadCategory(
      candidateLead.score
    );


  console.log(
    "🎯 CANDIDATE LEAD SCORE:",
    candidateLead.score
  );


  console.log(
    "🏷️ CANDIDATE SCORE CATEGORY:",
    candidateCategory
  );


  console.log(
    "🔄 CANDIDATE LIFECYCLE STATUS:",
    candidateLead.status
  );


  // ========================================================
  // 25. TRANSACTIONAL LEAD + OUTBOX
  // ========================================================

  let lead;

  let previousStatus =
    "new";

  let previousScore =
    0;

  let previousCategory =
    "new";

  let createdInsideTransaction =
    false;


  const transactionResult =
  await withReliableTransaction(
    async (session) => {

        console.log(
          "=================================================="
        );

        console.log(
          "🔐 LEAD + OUTBOX TRANSACTION START"
        );

        console.log(
          "=================================================="
        );


        // ====================================================
        // 25A. RELOAD AUTHORITATIVE LEAD INSIDE TRANSACTION
        // ====================================================

        let transactionalLead =
          null;


        if (
          existingLead?._id
        ) {

          transactionalLead =
            await Lead.findOne({

              _id:
                existingLead._id,

              organizationId,

            }).session(
              session
            );


          if (
            !transactionalLead
          ) {

            throw new Error(
              "Existing Lead could not be reloaded inside the tenant-scoped transaction."
            );
          }

        } else {

          transactionalLead =
            new Lead({

              name:
                customerName ||
                "Unknown",

              phone:
                phone,

              status:
                "new",

              organizationId,

              source:
                normalizedSource,

              intent:
                "",

              score:
                0,

              assignedTo:
                null,

              assignedBy:
                null,

              assignedAt:
                null,

              assignedSource:
                null,

            });


          createdInsideTransaction =
            true;
        }


        // ====================================================
        // 25B. SNAPSHOT PREVIOUS CANONICAL STATE
        // ====================================================

        previousStatus =
          isCanonicalLeadStatus(
            transactionalLead.status
          )
            ? transactionalLead.status
            : "new";


        previousScore =
          Number(
            transactionalLead.score ||
            0
          );


        previousCategory =
          getLeadCategory(
            previousScore
          );


        // ====================================================
        // 25C. APPLY CURRENT MESSAGE DATA
        // ====================================================

        applyExtractedDataToLead(

          transactionalLead,

          extractedData,

          aiResult,

          aiInsights,

          customerName,

          phone,

          normalizedSource

        );


        // ====================================================
        // 25D. UPDATE COMPLETION
        // ====================================================

        updateLeadCompletion(
          transactionalLead
        );


        // ====================================================
        // 25E. DETERMINE CANONICAL STATUS
        // ====================================================

        const desiredStatus =
          determineLeadStatus(
            transactionalLead,
            aiResult || {}
          );


        if (
          desiredStatus &&
          desiredStatus !== transactionalLead.status
        ) {

          transitionLeadStatus(
            transactionalLead,
            desiredStatus
          );
        }


        if (
          !isCanonicalLeadStatus(
            transactionalLead.status
          )
        ) {

          transitionLeadStatus(
            transactionalLead,
            "new"
          );
        }


        // ====================================================
        // 25F. CALCULATE SCORE FROM FINAL TRANSACTIONAL LEAD
        // ====================================================

        const finalScore =
          calculateLeadScore(
            transactionalLead
          );


        const finalCategory =
          getLeadCategory(
            finalScore
          );


        transactionalLead.score =
          finalScore;


        // ====================================================
        // 25G. DEBUG TRANSACTIONAL LEAD
        // ====================================================

        console.log(
          "========== LEAD BEFORE TRANSACTION SAVE =========="
        );


        console.dir(
          transactionalLead.toObject(),
          {
            depth: null,
          }
        );


        console.log(
          "=================================================="
        );


// ====================================================
// 25H. TEST FAILURE INJECTION — LEAD SAVE
// ====================================================

if (
  process.env.TEST_FORCE_LEAD_SAVE_FAILURE === "true"
) {

  console.warn(
    "⚠️ TEST: Forcing Lead save failure inside transaction."
  );

  throw new Error(
    "TEST: Lead persistence failed inside transaction."
  );
}

        // ====================================================
        // 25H. SAVE LEAD WITH REAL CLIENT SESSION
        // ====================================================

        await transactionalLead.save({
          session,
        });


        console.log(
          "✅ LEAD SAVED INSIDE TRANSACTION:",
          transactionalLead._id.toString()
        );


        // ====================================================
        // 25I. CRITICAL OUTBOX EVENT: LEAD CREATED
        // ====================================================

        if (
          createdInsideTransaction
        ) {

          await addLeadCreatedEvent({

            session,

            lead:
              transactionalLead,

            organizationId,

            operationId:
              ingestionOperationId,

            metadata: {

              source:
                normalizedSource,

              externalMessageId,

              customerName:
                customerName ||
                transactionalLead.name ||
                null,

            },

          });


          console.log(
            "📦 OUTBOX: LEAD_CREATED"
          );
        }


        // ====================================================
        // 25J. CRITICAL OUTBOX EVENT: STATUS
        // ====================================================

        const finalStatus =
          transactionalLead.status;


        if (
          previousStatus !==
          finalStatus
        ) {

          await addLeadStatusChangedEvent({

            session,

            lead:
              transactionalLead,

            previousStatus,

            organizationId,

            operationId:
              ingestionOperationId,

            metadata: {

              source:
                normalizedSource,

              externalMessageId,

            },

          });


          console.log(
            "📦 OUTBOX: LEAD_STATUS_CHANGED",
            {
              previousStatus,
              status:
                finalStatus,
            }
          );


          // ==================================================
          // WON / LOST SPECIAL EVENTS
          // ==================================================

          if (
            finalStatus ===
            "won"
          ) {

            await addLeadWonEvent({

              session,

              lead:
                transactionalLead,

              organizationId,

              operationId:
                ingestionOperationId,

              metadata: {

                source:
                  normalizedSource,

                externalMessageId,

              },

            });


            console.log(
              "📦 OUTBOX: LEAD_WON"
            );
          }


          if (
            finalStatus ===
            "lost"
          ) {

            await addLeadLostEvent({

              session,

              lead:
                transactionalLead,

              organizationId,

              operationId:
                ingestionOperationId,

              metadata: {

                source:
                  normalizedSource,

                externalMessageId,

              },

            });


            console.log(
              "📦 OUTBOX: LEAD_LOST"
            );
          }
        }


        // ====================================================
        // 25K. CRITICAL OUTBOX EVENT: SCORE
        // ====================================================

        const scoreChanged =
          previousScore !==
          finalScore;

        const categoryChanged =
          previousCategory !==
          finalCategory;


        if (
          createdInsideTransaction ||
          scoreChanged ||
          categoryChanged
        ) {

          await addLeadScoredEvent({

            session,

            lead:
              transactionalLead,

            previousScore,

            previousCategory,

            score:
              finalScore,

            category:
              finalCategory,

            organizationId,

            operationId:
              ingestionOperationId,

            metadata: {

              source:
                normalizedSource,

              externalMessageId,

            },

          });


          console.log(
            "📦 OUTBOX: LEAD_SCORED",
            {
              previousScore,
              score:
                finalScore,
              previousCategory,
              category:
                finalCategory,
            }
          );
        }


        console.log(
          "✅ LEAD + OUTBOX TRANSACTION READY TO COMMIT"
        );


        return {

          lead:
            transactionalLead,

          score:
            finalScore,

          category:
            finalCategory,

          status:
            finalStatus,

          created:
            createdInsideTransaction,

          previousStatus,

          previousScore,

          previousCategory,

        };
      }
    );


  lead =
    transactionResult.lead;


  // ========================================================
  // 26. TRANSACTION RESULT DEBUG
  // ========================================================

  console.log(
    "=================================================="
  );

  console.log(
    "✅ LEAD + OUTBOX TRANSACTION COMMITTED"
  );

  console.log(
    "=================================================="
  );

  console.log({

    leadId:
      lead?._id,

    organizationId,

    status:
      lead?.status,

    score:
      lead?.score,

    category:
      transactionResult?.category,

    previousStatus:
      transactionResult?.previousStatus,

    previousScore:
      transactionResult?.previousScore,

  });


  // ========================================================
  // 27. POST-TRANSACTION LEAD VERIFICATION
  // ========================================================

  const persistedLead =
    await Lead.findOne({

      _id:
        lead._id,

      organizationId,

    });


  if (
    !persistedLead
  ) {

    throw new Error(
      "Lead could not be reloaded after transaction commit."
    );
  }


  lead =
    persistedLead;


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
      message,

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

    scoreCategory:
      getLeadCategory(
        lead.score
      ),

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
  // 28. AUTO ASSIGNMENT
  // ========================================================

  let assignmentResult =
    null;


  try {

    assignmentResult =
      await autoAssignLead(
        lead
      );


    const assignedLead =
      await Lead.findOne({

        _id:
          lead._id,

        organizationId,

      });


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

        accepted:
          assignmentResult?.accepted ??
          null,

        reason:
          assignmentResult?.reason ||
          null,

        assignedTo:
          lead.assignedTo,

        assignedSource:
          lead.assignedSource,

        previousAgentId:
          assignmentResult?.previousAgentId ||
          null,

        assignmentEventQueued:
          assignmentResult?.assignmentEventQueued ??
          null,

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
  // 29. UPDATE CONVERSATION QUALIFICATION
  // ========================================================

  if (
    !conversation
  ) {

    throw new Error(
      "Conversation context could not be created or loaded."
    );
  }


  conversation =
    await updateConversationQualification(

      conversation,

      lead

    );


  // ========================================================
  // 30. FORCE CURRENT LEAD MEMORY INTO CONVERSATION
  // ========================================================

  synchronizeConversationMemory(

    conversation,

    lead

  );


  // ========================================================
  // 31. DETECT CONVERSATION STAGE
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
  // 32. CONVERSATION STATE ENGINE
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
  // 33. SYNCHRONIZE STATE MEMORY
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
  // 34. UPDATE CONVERSATION METADATA
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
  // 35. CONVERSATION STATUS
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
  // 36. FINAL CONVERSATION MEMORY SYNC
  // ========================================================

  synchronizeConversationMemory(

    conversation,

    lead

  );

// ========================================================
// 37. TEST FAILURE INJECTION — CONVERSATION SAVE
// ========================================================

if (
  process.env.TEST_FORCE_CONVERSATION_SAVE_FAILURE === "true"
) {
  console.warn(
    "⚠️ TEST: Forcing Conversation save failure."
  );

  throw new Error(
    "TEST: Conversation persistence failed."
  );
}

  // ========================================================
  // 37. SAVE CONVERSATION
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
  // 38. CREATE CUSTOMER MESSAGE
  // ========================================================

  let customerMessage;

  // ========================================================
// 38A. TEST FAILURE INJECTION — MESSAGE CREATE
// ========================================================

if (
  process.env.TEST_FORCE_MESSAGE_CREATE_FAILURE === "true"
) {
  console.warn(
    "⚠️ TEST: Forcing customer Message persistence failure."
  );

  throw new Error(
    "TEST: Customer message persistence failed."
  );
}


  try {

    customerMessage =
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
          message,

        status:
          "sent",

        aiGenerated:
          false,

      });


  } catch (
    messageCreateError
  ) {

    if (
      externalMessageId &&
      isExternalMessageDuplicateError(
        messageCreateError
      )
    ) {

      console.log(
        "♻️ CONCURRENT DUPLICATE WEBHOOK DETECTED"
      );


      console.log({

        organizationId,

        source:
          normalizedSource,

        externalMessageId,

        message:
          "Another webhook request already stored this external message.",

      });


      const existingExternalMessage =
        await findExistingExternalMessage(

          organizationId,

          normalizedSource,

          externalMessageId

        );


      if (
        existingExternalMessage
      ) {

        assertExternalMessageMatches(
  existingExternalMessage,
  message
);

        return buildDuplicateResponse(

          organizationId,

          normalizedSource,

          externalMessageId,

          existingExternalMessage

        );
      }


      console.error(
  "⚠️ DUPLICATE KEY CONFLICT COULD NOT BE RESOLVED",
  {
    organizationId,
    source: normalizedSource,
    externalMessageId,
    mongoErrorCode: messageCreateError?.code,
    mongoKeyPattern: messageCreateError?.keyPattern,
  }
);

const recoveryError = new Error(
  "An inbound message conflict occurred, but the existing message could not be confirmed."
);

recoveryError.status = 503;
recoveryError.code =
  "INBOUND_DUPLICATE_RECOVERY_FAILED";

throw recoveryError;
    }


    throw messageCreateError;
  }


  console.log(
    "💬 CUSTOMER MESSAGE SAVED:",
    customerMessage._id.toString()
  );


  // ========================================================
  // 39. UPDATE CONVERSATION COUNTERS
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
      message,

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
  // 40. NON-CRITICAL REALTIME PIPELINE EVENT
  // ========================================================

  leadEventBus.emit(
  LEAD_EVENTS.PIPELINE_UPDATED,
  lead
);


  console.log(
    "📊 PIPELINE_UPDATE sent"
  );


  // ========================================================
  // 41. NON-CRITICAL CONVERSATION UPDATE
  // ========================================================

  leadEventBus.emit(

    LEAD_EVENTS.CONVERSATION_UPDATED,

    {

      lead,

      conversation,

      state,

      message:
        customerMessage,

    }

  );


  console.log(
    "💬 CONVERSATION_UPDATE sent"
  );


  // ========================================================
  // 42. DEBUG NEXT STEP
  // ========================================================

  const missingFields = [];


  if (
    !completion.hasBudget
  ) {

    missingFields.push(
      "budget"
    );
  }


  if (
    !completion.hasLocation
  ) {

    missingFields.push(
      "location"
    );
  }


  if (
    !completion.hasBedrooms
  ) {

    missingFields.push(
      "bedrooms"
    );
  }


  if (
    !completion.hasMoveDate
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
  // 43. AUTO REPLY
  // ========================================================

  console.log(
    "📤 SENDING AUTO REPLY TO:",
    lead.phone
  );


  console.log(
    "📡 AUTO REPLY CHANNEL:",
    normalizedSource
  );


  const autoReplyResult =
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


  console.log(
    "📨 AUTO REPLY RESULT:",
    autoReplyResult
  );


  // ========================================================
  // 44. RELOAD FINAL LEAD
  // ========================================================

  const finalLead =
    await Lead.findOne({

      _id:
        lead._id,

      organizationId,

    });


  if (
    finalLead
  ) {

    lead =
      finalLead;
  }


  // ========================================================
  // 45. FINAL RESULT
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

      assignment:
        assignmentResult,

      autoReply:
        autoReplyResult,

      scoreCategory:
        getLeadCategory(
          lead.score
        ),

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

  const httpMode =
    isHttpResponse(
      res
    );


  try {

    // ======================================================
    // PUBLIC HTTP BODY CONTRACT
    // ======================================================

    if (
      httpMode &&
      !hasNormalizedMessage(
        req
      )
    ) {

      validatePublicHttpBody(
        req
      );
    }


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
            error?.message ||
            "AI ingestion failed.",

        });
    }


    // ======================================================
    // INTERNAL ERROR
    // ======================================================

    throw error;
  }
};


// ==========================================================
// DEFAULT EXPORT
// ==========================================================

export default {

  ingestMessage,

};