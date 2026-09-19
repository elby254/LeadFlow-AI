// aiIngestionService.js

/**
 * ==========================================================
 *
 * AI INGESTION SERVICE
 *
 * Production ingestion helpers for LeadFlow AI.
 *
 * ==========================================================
 *
 * RESPONSIBILITIES
 * ==========================================================
 *
 * • Safe normalization
 * • Deterministic extraction
 * • AI + deterministic extraction merging
 * • CURRENT MESSAGE WINS
 * • AI insight synchronization
 * • Conversation memory synchronization
 * • Extraction debugging
 * • Normalized message contract support
 *
 * ==========================================================
 *
 * IMPORTANT
 * ==========================================================
 *
 * This file does NOT own the complete HTTP ingestion workflow.
 *
 * The controller owns:
 *
 * Customer message
 *       ↓
 * Organization resolution
 *       ↓
 * AI analysis
 *       ↓
 * Extraction
 *       ↓
 * Lead lookup / creation
 *       ↓
 * Lead persistence
 *       ↓
 * Conversation
 *       ↓
 * Messages
 *       ↓
 * Events
 *       ↓
 * Auto reply
 *
 * ==========================================================
 */

import mongoose from "mongoose";



// ==========================================================
// SUPPORTED LEAD SOURCES
// ==========================================================

const VALID_SOURCES = [
  "whatsapp",
  "sms",
  "website",
  "facebook",
];



// ==========================================================
// SAFE STRING
// ==========================================================

export const safeString = (
  value
) => {

  if (
    value === undefined ||
    value === null
  ) {
    return "";
  }

  return String(
    value
  ).trim();
};



// ==========================================================
// NORMALIZE PHONE
// ==========================================================

export const normalizePhone = (
  phone
) => {

  const normalized =
    safeString(
      phone
    );

  return normalized || null;
};



// ==========================================================
// NORMALIZED MESSAGE CONTRACT
// ==========================================================
//
// Channel adapters convert provider-specific payloads into
// this common structure:
//
// {
//   channel,
//   organizationId,
//   customer: {
//     name,
//     phone,
//     externalId
//   },
//   message: {
//     text,
//     type,
//     externalMessageId
//   },
//   metadata
// }
//
// IMPORTANT:
//
// This service does NOT parse WhatsApp, SMS, Website, or
// Facebook provider payloads.
//
// Provider-specific parsing belongs exclusively to:
//
// adapters/channels/
//
// This helper only validates the common contract when
// required by internal callers.
//
// ==========================================================

export const normalizeIncomingMessage = (
  normalizedMessage
) => {

  if (
    !normalizedMessage ||
    typeof normalizedMessage !==
      "object"
  ) {

    return null;
  }



  const customer =
    normalizedMessage.customer &&
    typeof normalizedMessage.customer ===
      "object"

      ? normalizedMessage.customer

      : {};



  const message =
    normalizedMessage.message &&
    typeof normalizedMessage.message ===
      "object"

      ? normalizedMessage.message

      : {};



  const metadata =
    normalizedMessage.metadata &&
    typeof normalizedMessage.metadata ===
      "object"

      ? normalizedMessage.metadata

      : {};



  const channel =
    safeString(
      normalizedMessage.channel
    ).toLowerCase();



  const organizationId =
    normalizedMessage.organizationId
      ? String(
          normalizedMessage.organizationId
        )
      : null;



  const phone =
    normalizePhone(
      customer.phone
    );



  const customerName =
    safeString(
      customer.name
    ) || null;



  const externalId =
    safeString(
      customer.externalId
    ) || null;



  const text =
    safeString(
      message.text
    );



  const type =
    safeString(
      message.type
    ).toLowerCase() ||
    "text";



  const externalMessageId =
    safeString(
      message.externalMessageId
    ) || null;



  return {

    channel:

      VALID_SOURCES.includes(
        channel
      )

        ? channel

        : null,



    organizationId,



    customer: {

      name:
        customerName,

      phone,

      externalId,

    },



    message: {

      text,

      type,

      externalMessageId,

    },



    metadata,

  };
};



// ==========================================================
// VALIDATE NORMALIZED MESSAGE CONTRACT
// ==========================================================
//
// This validation is intentionally lightweight.
//
// The adapters remain responsible for deciding whether a
// provider payload is valid.
//
// The service only confirms that the normalized structure
// contains the fields expected by the ingestion pipeline.
//
// ==========================================================

export const isValidNormalizedMessage = (
  normalizedMessage
) => {

  if (
    !normalizedMessage ||
    typeof normalizedMessage !==
      "object"
  ) {

    return false;
  }



  const normalized =
    normalizeIncomingMessage(
      normalizedMessage
    );



  if (
    !normalized
  ) {

    return false;
  }



  if (
    !normalized.channel
  ) {

    return false;
  }



  if (
    !normalized.message?.text
  ) {

    return false;
  }



  return true;
};



// ==========================================================
// NORMALIZE BEDROOM VALUE
// ==========================================================

export const normalizeBedrooms = (
  value
) => {

  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return null;
  }

  const number =
    Number(
      String(value).replace(
        /[^0-9.]/g,
        ""
      )
    );

  if (
    !Number.isFinite(number) ||
    number < 1
  ) {
    return null;
  }

  return number;
};



// ==========================================================
// NORMALIZE BUDGET VALUE
// ==========================================================
//
// Supports:
//
// 120000
// 120,000
// KES 120000
// 120000 KES
// KES 120,000
// 120k
// 120K
// 120.5k
//
// ==========================================================

export const normalizeBudget = (
  value
) => {

  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return null;
  }

  let raw =
    String(value)
      .trim()
      .toLowerCase();

  raw =
    raw
      .replace(
        /kes/g,
        ""
      )
      .replace(
        /ksh/g,
        ""
      )
      .replace(
        /,/g,
        ""
      )
      .trim();

  let multiplier = 1;

  if (
    raw.endsWith("k")
  ) {

    multiplier = 1000;

    raw =
      raw.slice(
        0,
        -1
      );
  }

  const number =
    Number(
      raw
    );

  if (
    !Number.isFinite(number) ||
    number < 0
  ) {
    return null;
  }

  return Math.round(
    number * multiplier
  );
};



// ==========================================================
// NORMALIZE MOVE DATE
// ==========================================================

export const normalizeMoveDate = (
  value
) => {

  if (
    value === undefined ||
    value === null
  ) {
    return null;
  }

  const normalized =
    String(value)
      .trim()
      .replace(
        /\s+/g,
        " "
      );

  if (!normalized) {
    return null;
  }

  return normalized;
};



// ==========================================================
// NORMALIZE LOCATION
// ==========================================================

export const normalizeLocation = (
  value
) => {

  if (
    value === undefined ||
    value === null
  ) {
    return null;
  }

  const normalized =
    String(value)
      .trim()
      .replace(
        /\s+/g,
        " "
      )
      .replace(
        /^[,.\s]+|[,.\s]+$/g,
        ""
      );

  if (!normalized) {
    return null;
  }

  return normalized;
};



// ==========================================================
// NUMBER WORDS
// ==========================================================

const NUMBER_WORDS = {

  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,

};



// ==========================================================
// EXTRACT BEDROOMS
// ==========================================================

export const extractBedroomsFromMessage = (
  message
) => {

  const text =
    safeString(
      message
    ).toLowerCase();

  if (!text) {
    return null;
  }

  const numericMatch =
    text.match(
      /\b(\d+(?:\.\d+)?)\s*(?:bedrooms?|beds?|br)\b/i
    );

  if (numericMatch) {

    return normalizeBedrooms(
      numericMatch[1]
    );
  }

  const wordPattern =
    Object.keys(
      NUMBER_WORDS
    ).join("|");

  const wordMatch =
    text.match(
      new RegExp(
        `\\b(${wordPattern})\\s*(?:bedrooms?|beds?|br)\\b`,
        "i"
      )
    );

  if (wordMatch) {

    return NUMBER_WORDS[
      wordMatch[1].toLowerCase()
    ];
  }

  return null;
};



// ==========================================================
// EXTRACT BUDGET
// ==========================================================

export const extractBudgetFromMessage = (
  message
) => {

  const text =
    safeString(
      message
    ).toLowerCase();

  if (!text) {
    return null;
  }



  // --------------------------------------------------------
  // Currency first
  // --------------------------------------------------------

  const currencyMatch =
    text.match(
      /\b(?:kes|ksh)\s*([0-9]+(?:[.,][0-9]+)?\s*k?)\b/i
    );

  if (currencyMatch) {

    const budget =
      normalizeBudget(
        currencyMatch[1]
      );

    if (
      budget !== null
    ) {
      return budget;
    }
  }



  // --------------------------------------------------------
  // Budget keyword
  // --------------------------------------------------------

  const budgetMatch =
    text.match(
      /\b(?:budget|afford|rent|price|cost)\b\s*(?:of|is|around|about|up to|upto|at|approximately)?\s*(?:kes|ksh)?\s*([0-9]+(?:[.,][0-9]+)?\s*k?)\b/i
    );

  if (budgetMatch) {

    const budget =
      normalizeBudget(
        budgetMatch[1]
      );

    if (
      budget !== null
    ) {
      return budget;
    }
  }



  // --------------------------------------------------------
  // Amount followed by KES/KSH
  // --------------------------------------------------------

  const amountCurrencyMatch =
    text.match(
      /\b([0-9]+(?:[.,][0-9]+)?\s*k?)\s*(?:kes|ksh)\b/i
    );

  if (amountCurrencyMatch) {

    const budget =
      normalizeBudget(
        amountCurrencyMatch[1]
      );

    if (
      budget !== null
    ) {
      return budget;
    }
  }



  // --------------------------------------------------------
  // Amount followed by budget
  // --------------------------------------------------------

  const amountBudgetMatch =
    text.match(
      /\b([0-9]+(?:[.,][0-9]+)?\s*k?)\s*(?:budget)\b/i
    );

  if (amountBudgetMatch) {

    const budget =
      normalizeBudget(
        amountBudgetMatch[1]
      );

    if (
      budget !== null
    ) {
      return budget;
    }
  }



  // --------------------------------------------------------
  // Standalone K expression
  // --------------------------------------------------------

  const standaloneKMatch =
    text.match(
      /\b([0-9]+(?:\.[0-9]+)?\s*k)\b/i
    );

  if (standaloneKMatch) {

    const budget =
      normalizeBudget(
        standaloneKMatch[1]
      );

    if (
      budget !== null
    ) {
      return budget;
    }
  }

  return null;
};



// ==========================================================
// EXTRACT LOCATION
// ==========================================================

export const extractLocationFromMessage = (
  message
) => {

  const text =
    safeString(
      message
    ).trim();

  if (!text) {
    return null;
  }

  const locationPatterns = [

    /\b(?:in|around|near|at|from)\s+([A-Za-z][A-Za-z0-9'’.-]*(?:\s+[A-Za-z][A-Za-z0-9'’.-]*){0,3}?)(?=\s+(?:with|and|for|within|under|over|budget|rent|price|move|moving|bedroom|bedrooms?|bed|beds?|house|apartment|flat|property|that|which)\b|[,.!?]|$)/i,

    /\b(?:location|area|place)\s+(?:is|would be|should be|of)\s+([A-Za-z][A-Za-z0-9'’.-]*(?:\s+[A-Za-z][A-Za-z0-9'’.-]*){0,3}?)(?=\s+(?:with|and|for|within|under|over|budget|rent|price|move|moving|bedroom|bedrooms?|bed|beds?|house|apartment|flat|property|that|which)\b|[,.!?]|$)/i,

    /\b(?:interested in|looking in|searching in|want in)\s+([A-Za-z][A-Za-z0-9'’.-]*(?:\s+[A-Za-z][A-Za-z0-9'’.-]*){0,3}?)(?=\s+(?:with|and|for|within|under|over|budget|rent|price|move|moving|bedroom|bedrooms?|bed|beds?|house|apartment|flat|property|that|which)\b|[,.!?]|$)/i,

  ];

  for (
    const pattern of locationPatterns
  ) {

    const match =
      text.match(
        pattern
      );

    if (
      match &&
      match[1]
    ) {

      const location =
        normalizeLocation(
          match[1]
        );

      if (location) {
        return location;
      }
    }
  }



  // --------------------------------------------------------
  // Location-only follow-up
  // --------------------------------------------------------

  const locationOnlyPattern =
    /^[A-Za-z][A-Za-z0-9'’.-]*(?:\s+[A-Za-z][A-Za-z0-9'’.-]*){0,2}$/;

  if (
    locationOnlyPattern.test(
      text
    )
  ) {

    const lower =
      text.toLowerCase();

    const excludedWords = [

      "yes",
      "no",
      "okay",
      "ok",
      "sure",
      "thanks",
      "thank",
      "hello",
      "hi",
      "hey",
      "tomorrow",
      "today",
      "later",
      "please",
      "urgent",
      "urgently",
      "asap",
      "rent",
      "buy",
      "buying",
      "house",
      "home",
      "property",
      "apartment",
      "flat",
      "bedroom",
      "bedrooms",
      "bed",
      "beds",
      "budget",

    ];

    if (
      !excludedWords.includes(
        lower
      )
    ) {

      return normalizeLocation(
        text
      );
    }
  }

  return null;
};



// ==========================================================
// EXTRACT MOVE DATE
// ==========================================================

export const extractMoveDateFromMessage = (
  message
) => {

  const text =
    safeString(
      message
    ).toLowerCase();

  if (!text) {
    return null;
  }

  const relativeMatch =
    text.match(
      /\b(?:move|moving|relocate|relocating)\b\s*(?:in|by|around|on)?\s*(next\s+(?:month|week|year)|this\s+(?:month|week|year)|tomorrow|today|in\s+\d+\s+(?:days?|weeks?|months?|years?))\b/i
    );

  if (relativeMatch) {

    return normalizeMoveDate(
      relativeMatch[1]
    );
  }

  const standaloneMatch =
    text.match(
      /\b(next\s+(?:month|week|year)|this\s+(?:month|week|year)|tomorrow|today|in\s+\d+\s+(?:days?|weeks?|months?|years?))\b/i
    );

  if (standaloneMatch) {

    return normalizeMoveDate(
      standaloneMatch[1]
    );
  }

  return null;
};



// ==========================================================
// EXTRACT URGENCY
// ==========================================================

export const extractUrgencyFromMessage = (
  message
) => {

  const text =
    safeString(
      message
    ).toLowerCase();

  if (!text) {
    return null;
  }

  const urgent =
    /\b(urgent|urgently|asap|immediately|as soon as possible|right away|need immediately|need it now)\b/i
      .test(
        text
      );

  if (urgent) {
    return true;
  }

  return null;
};



// ==========================================================
// NORMALIZE INTENT
// ==========================================================

export const normalizeIntent = (
  value
) => {

  const intent =
    safeString(
      value
    ).toLowerCase();

  if (!intent) {
    return null;
  }

  if (
    [
      "rent",
      "rental",
      "renting",
      "lease",
      "leasing",
      "letting",
      "property_rental",
      "property-rental",
    ].includes(
      intent
    )
  ) {

    return "rent";
  }

  if (
    [
      "buy",
      "buying",
      "purchase",
      "purchasing",
      "ownership",
      "property_purchase",
      "property-purchase",
    ].includes(
      intent
    )
  ) {

    return "buy";
  }

  if (
    [
      "property_search",
      "property-search",
      "search",
      "looking",
      "property inquiry",
      "property_inquiry",
      "property-inquiry",
    ].includes(
      intent
    )
  ) {

    return "property_search";
  }

  return null;
};



// ==========================================================
// EXTRACT INTENT FROM CURRENT MESSAGE
// ==========================================================

export const extractIntentFromMessage = (
  message
) => {

  const text =
    safeString(
      message
    ).toLowerCase();

  if (!text) {
    return null;
  }



  // --------------------------------------------------------
  // RENT
  // --------------------------------------------------------

  if (
    /\b(rent|renting|lease|leasing|let|letting|rental)\b/i
      .test(
        text
      )
  ) {

    return "rent";
  }



  // --------------------------------------------------------
  // BUY
  // --------------------------------------------------------

  if (
    /\b(buy|buying|purchase|purchasing|own|ownership)\b/i
      .test(
        text
      )
  ) {

    return "buy";
  }



  // --------------------------------------------------------
  // PROPERTY SEARCH
  // --------------------------------------------------------

  if (
    /\b(looking for|searching for|interested in|want|need|find me|looking to|searching|find)\b/i
      .test(
        text
      )
  ) {

    return "property_search";
  }

  return null;
};



// ==========================================================
// EXTRACT CUSTOMER NAME
// ==========================================================

export const extractCustomerNameFromMessage = (
  message
) => {

  const text =
    safeString(
      message
    ).trim();

  if (!text) {
    return null;
  }

  const patterns = [

    /\bmy\s+name\s+is\s+([A-Za-z][A-Za-z'’-]*(?:\s+[A-Za-z][A-Za-z'’-]*){0,2})/i,

    /\b(?:i\s+am|i'm|im|this\s+is)\s+([A-Za-z][A-Za-z'’-]*(?:\s+[A-Za-z][A-Za-z'’-]*){0,2})/i,

  ];

  const stopWords =
    new Set([

      "looking",
      "searching",
      "interested",
      "need",
      "want",
      "trying",
      "from",
      "here",
      "today",
      "tomorrow",
      "a",
      "an",
      "the",

    ]);

  for (
    const pattern of patterns
  ) {

    const match =
      text.match(
        pattern
      );

    if (
      match &&
      match[1]
    ) {

      const candidate =
        match[1]
          .trim()
          .replace(
            /[,.!?;:]+$/,
            ""
          )
          .trim();

      if (!candidate) {
        continue;
      }

      const firstWord =
        candidate
          .split(/\s+/)[0]
          .toLowerCase();

      if (
        stopWords.has(
          firstWord
        )
      ) {
        continue;
      }

      return candidate;
    }
  }

  return null;
};



// ==========================================================
// DETERMINISTIC CURRENT-MESSAGE EXTRACTION
// ==========================================================

export const extractStructuredCustomerData = (
  message
) => {

  const result = {};



  const bedrooms =
    extractBedroomsFromMessage(
      message
    );

  if (
    bedrooms !== null
  ) {

    result.bedrooms =
      bedrooms;
  }



  const budget =
    extractBudgetFromMessage(
      message
    );

  if (
    budget !== null
  ) {

    result.budget =
      budget;
  }



  const location =
    extractLocationFromMessage(
      message
    );

  if (
    location
  ) {

    result.location =
      location;
  }



  const moveDate =
    extractMoveDateFromMessage(
      message
    );

  if (
    moveDate
  ) {

    result.moveDate =
      moveDate;
  }



  const urgent =
    extractUrgencyFromMessage(
      message
    );

  if (
    urgent !== null
  ) {

    result.urgent =
      urgent;
  }



  const intent =
    extractIntentFromMessage(
      message
    );

  if (
    intent
  ) {

    result.intent =
      intent;
  }



  const name =
    extractCustomerNameFromMessage(
      message
    );

  if (
    name
  ) {

    result.name =
      name;
  }

  return result;
};



// ==========================================================
// MERGE AI + DETERMINISTIC EXTRACTION
// ==========================================================
//
// IMPORTANT:
//
// CURRENT MESSAGE WINS.
//
// Deterministic extraction comes directly from the current
// customer message and therefore overrides AI interpretation.
//
// AI is only used where deterministic extraction did not
// identify a value.
//
// ==========================================================

export const mergeExtractedData = (
  aiExtractedData,
  deterministicData
) => {

  const aiData =
    aiExtractedData &&
    typeof aiExtractedData === "object"

      ? aiExtractedData

      : {};

  const deterministic =
    deterministicData &&
    typeof deterministicData === "object"

      ? deterministicData

      : {};

  const merged = {
    ...aiData,
  };



  // --------------------------------------------------------
  // BEDROOMS
  // --------------------------------------------------------

  const deterministicBedrooms =
    normalizeBedrooms(
      deterministic.bedrooms
    );

  const aiBedrooms =
    normalizeBedrooms(
      aiData.bedrooms
    );

  if (
    deterministicBedrooms !== null
  ) {

    merged.bedrooms =
      deterministicBedrooms;

  } else if (
    aiBedrooms !== null
  ) {

    merged.bedrooms =
      aiBedrooms;
  }



  // --------------------------------------------------------
  // BUDGET
  // --------------------------------------------------------

  const deterministicBudget =
    normalizeBudget(
      deterministic.budget
    );

  const aiBudget =
    normalizeBudget(
      aiData.budget
    );

  if (
    deterministicBudget !== null
  ) {

    merged.budget =
      deterministicBudget;

  } else if (
    aiBudget !== null
  ) {

    merged.budget =
      aiBudget;
  }



  // --------------------------------------------------------
  // LOCATION
  // --------------------------------------------------------

  const deterministicLocation =
    normalizeLocation(
      deterministic.location
    );

  const aiLocation =
    normalizeLocation(
      aiData.location
    );

  if (
    deterministicLocation
  ) {

    merged.location =
      deterministicLocation;

  } else if (
    aiLocation
  ) {

    merged.location =
      aiLocation;
  }



  // --------------------------------------------------------
  // MOVE DATE
  // --------------------------------------------------------

  const deterministicMoveDate =
    normalizeMoveDate(
      deterministic.moveDate
    );

  const aiMoveDate =
    normalizeMoveDate(
      aiData.moveDate
    );

  if (
    deterministicMoveDate
  ) {

    merged.moveDate =
      deterministicMoveDate;

  } else if (
    aiMoveDate
  ) {

    merged.moveDate =
      aiMoveDate;
  }



  // --------------------------------------------------------
  // URGENCY
  // --------------------------------------------------------

  if (
    typeof deterministic.urgent ===
      "boolean"
  ) {

    merged.urgent =
      deterministic.urgent;

  } else if (
    typeof aiData.urgent ===
      "boolean"
  ) {

    merged.urgent =
      aiData.urgent;
  }



  // --------------------------------------------------------
  // INTENT
  // --------------------------------------------------------

  const deterministicIntent =
    normalizeIntent(
      deterministic.intent
    );

  const aiIntent =
    normalizeIntent(
      aiData.intent
    );

  if (
    deterministicIntent
  ) {

    merged.intent =
      deterministicIntent;

  } else if (
    aiIntent
  ) {

    merged.intent =
      aiIntent;
  }



  // --------------------------------------------------------
  // NAME
  // --------------------------------------------------------

  if (
    deterministic.name
  ) {

    merged.name =
      safeString(
        deterministic.name
      );
  }



  return merged;
};



// ==========================================================
// RESOLVE ORGANIZATION ID
// ==========================================================

export const resolveOrganizationId = (
  req
) => {

  const requestOrganizationId =
    req?.organizationId ||
    req?.organization?._id ||
    req?.organization?.id ||
    req?.user?.organizationId;

  if (
    requestOrganizationId
  ) {

    return String(
      requestOrganizationId
    );
  }

  if (
    process.env.DEFAULT_ORGANIZATION_ID
  ) {

    return String(
      process.env.DEFAULT_ORGANIZATION_ID
    );
  }

  return null;
};



// ==========================================================
// VALIDATE ORGANIZATION ID
// ==========================================================

export const isValidOrganizationId = (
  organizationId
) => {

  return (
    Boolean(
      organizationId
    ) &&
    mongoose.Types.ObjectId.isValid(
      organizationId
    )
  );
};



// ==========================================================
// NORMALIZE SOURCE
// ==========================================================

export const normalizeSource = (
  source
) => {

  if (
    typeof source !== "string"
  ) {

    return null;
  }

  const normalized =
    source
      .trim()
      .toLowerCase();

  if (
    !VALID_SOURCES.includes(
      normalized
    )
  ) {

    return null;
  }

  return normalized;
};



// ==========================================================
// RESOLVE SOURCE
// ==========================================================

export const resolveSource = (
  req
) => {

  const source =
    req?.source ||
    req?.channel ||
    "website";

  return normalizeSource(
    source
  );
};



// ==========================================================
// NORMALIZE AI URGENCY
// ==========================================================

export const normalizeAIUrgency = (
  value
) => {

  const normalized =
    safeString(
      value
    )
      .toLowerCase()
      .trim();

  if (!normalized) {
    return null;
  }

  if (
    [
      "urgent",
      "urgently",
      "asap",
      "critical",
      "immediate",
      "immediately",
      "right away",
      "as soon as possible",
      "need it now",
    ].includes(
      normalized
    )
  ) {

    return "High";
  }

  if (
    [
      "high",
      "very high",
      "highest",
    ].includes(
      normalized
    )
  ) {

    return "High";
  }

  if (
    [
      "medium",
      "moderate",
      "normal",
      "average",
    ].includes(
      normalized
    )
  ) {

    return "Medium";
  }

  if (
    [
      "low",
      "lowest",
      "none",
      "minimal",
    ].includes(
      normalized
    )
  ) {

    return "Low";
  }

  return null;
};



// ==========================================================
// NORMALIZE CONFIDENCE
// ==========================================================

export const normalizeConfidence = (
  value,
  fallback = 0
) => {

  const number =
    Number(
      value
    );

  if (
    !Number.isFinite(
      number
    )
  ) {

    return fallback;
  }

  return Math.min(
    100,
    Math.max(
      0,
      number
    )
  );
};



// ==========================================================
// AI INSIGHTS SYNCHRONIZATION
// ==========================================================

export const synchronizeAIInsights = (
  lead,
  aiResult
) => {

  if (
    !lead
  ) {

    return null;
  }



  // ========================================================
  // EXISTING INSIGHTS
  // ========================================================

  const currentInsights =
    lead.aiInsights &&
    typeof lead.aiInsights === "object"

      ? (
          typeof lead.aiInsights.toObject ===
            "function"

            ? lead.aiInsights.toObject()

            : {
                ...lead.aiInsights,
              }
        )

      : {};



  // ========================================================
  // AI CONFIDENCE
  // ========================================================

  const confidence =
    aiResult?.confidence &&
    typeof aiResult.confidence === "object"

      ? aiResult.confidence

      : {};



  // ========================================================
  // BUYING INTENT
  // ========================================================

  const aiScore =
    Number(
      aiResult?.score
    );

  const leadScore =
    Number(
      lead.score
    );

  let buyingIntent =
    normalizeConfidence(
      currentInsights.buyingIntent,
      0
    );

  if (
    Number.isFinite(
      aiScore
    )
  ) {

    buyingIntent =
      normalizeConfidence(
        aiScore,
        buyingIntent
      );

  } else if (
    Number.isFinite(
      leadScore
    )
  ) {

    buyingIntent =
      normalizeConfidence(
        leadScore,
        buyingIntent
      );
  }



  // ========================================================
  // URGENCY
  // ========================================================

  let urgency =
    normalizeAIUrgency(
      currentInsights.urgency
    ) ||
    "Low";



  // ========================================================
  // AI PRIORITY
  // ========================================================

  if (
    aiResult?.priority !== undefined &&
    aiResult?.priority !== null &&
    safeString(
      aiResult.priority
    )
  ) {

    const normalizedPriority =
      normalizeAIUrgency(
        aiResult.priority
      );

    if (
      normalizedPriority
    ) {

      urgency =
        normalizedPriority;

    } else {

      console.warn(
        "⚠️ UNKNOWN AI PRIORITY. FALLING BACK TO EXISTING VALID URGENCY:",
        aiResult.priority
      );
    }
  }



  // ========================================================
  // CURRENT MESSAGE URGENCY
  // ========================================================

  if (
    typeof aiResult?.extracted?.urgent ===
      "boolean"
  ) {

    if (
      aiResult.extracted.urgent
    ) {

      urgency =
        "High";
    }
  }



  // ========================================================
  // LEAD BOOLEAN URGENCY FALLBACK
  // ========================================================

  if (
    typeof lead.urgent ===
      "boolean" &&
    !aiResult?.priority
  ) {

    if (
      lead.urgent === true
    ) {

      urgency =
        "High";
    }
  }



  // ========================================================
  // BUDGET CONFIDENCE
  // ========================================================

  let budgetConfidence =
    normalizeConfidence(
      currentInsights.budgetConfidence,
      0
    );

  if (
    confidence.budget !== undefined &&
    confidence.budget !== null
  ) {

    budgetConfidence =
      normalizeConfidence(
        confidence.budget,
        budgetConfidence
      );
  }



  // ========================================================
  // LOCATION CONFIDENCE
  // ========================================================

  let locationConfidence =
    normalizeConfidence(
      currentInsights.locationConfidence,
      0
    );

  if (
    confidence.location !== undefined &&
    confidence.location !== null
  ) {

    locationConfidence =
      normalizeConfidence(
        confidence.location,
        locationConfidence
      );
  }



  // ========================================================
  // PROPERTY TYPE CONFIDENCE
  // ========================================================

  let propertyTypeConfidence =
    normalizeConfidence(
      currentInsights.propertyTypeConfidence,
      0
    );

  if (
    confidence.propertyType !== undefined &&
    confidence.propertyType !== null
  ) {

    propertyTypeConfidence =
      normalizeConfidence(
        confidence.propertyType,
        propertyTypeConfidence
      );
  }



  // ========================================================
  // TIMELINE CONFIDENCE
  // ========================================================

  let timelineConfidence =
    normalizeConfidence(
      currentInsights.timelineConfidence,
      0
    );

  if (
    confidence.moveDate !== undefined &&
    confidence.moveDate !== null
  ) {

    timelineConfidence =
      normalizeConfidence(
        confidence.moveDate,
        timelineConfidence
      );
  }



  // ========================================================
  // MISSING INFORMATION
  // ========================================================

  let missingInformation = [];

  if (
    Array.isArray(
      aiResult?.missingInformation
    )
  ) {

    missingInformation =
      [
        ...aiResult.missingInformation,
      ];

  } else if (
    Array.isArray(
      currentInsights.missingInformation
    )
  ) {

    missingInformation =
      [
        ...currentInsights.missingInformation,
      ];
  }



  // ========================================================
  // RECOMMENDED ACTION
  // ========================================================

  let recommendedAction =
    safeString(
      aiResult?.recommendedAction
    );

  if (
    !recommendedAction
  ) {

    recommendedAction =
      safeString(
        currentInsights.recommendedAction
      );
  }



  // ========================================================
  // FINAL AI INSIGHTS
  // ========================================================

  const synchronizedInsights = {

    ...currentInsights,

    buyingIntent,

    urgency,

    budgetConfidence,

    locationConfidence,

    propertyTypeConfidence,

    timelineConfidence,

    missingInformation,

    recommendedAction,

  };



  // ========================================================
  // CURRENT LEAD INTENT
  // ========================================================

  const currentIntent =
    normalizeIntent(
      lead.intent
    );

  if (
    currentIntent
  ) {

    synchronizedInsights.intent =
      currentIntent;
  }



  // ========================================================
  // FINAL SAFETY CHECK
  // ========================================================

  const allowedUrgencies = [
    "Low",
    "Medium",
    "High",
  ];

  if (
    !allowedUrgencies.includes(
      synchronizedInsights.urgency
    )
  ) {

    console.warn(
      "⚠️ INVALID URGENCY DETECTED BEFORE LEAD SAVE:",
      synchronizedInsights.urgency
    );

    synchronizedInsights.urgency =
      "Low";
  }



  // ========================================================
  // WRITE TO LEAD DOCUMENT
  // ========================================================

  lead.aiInsights =
    synchronizedInsights;



  // ========================================================
  // DEBUG
  // ========================================================

  console.log(
    "\n=========================================================="
  );

  console.log(
    "🧠 AI INSIGHTS SYNCHRONIZATION"
  );

  console.log(
    "=========================================================="
  );

  console.log(
    "🤖 RAW AI PRIORITY:",
    aiResult?.priority ??
    null
  );

  console.log(
    "🛡️ NORMALIZED URGENCY:",
    synchronizedInsights.urgency
  );

  console.log(
    "----------------------------------------------------------"
  );

  console.log(
    "🤖 AI CONFIDENCE:"
  );

  console.dir(
    confidence,
    {
      depth: null,
    }
  );

  console.log(
    "----------------------------------------------------------"
  );

  console.log(
    "📊 AI SCORE:",
    aiResult?.score ??
    null
  );

  console.log(
    "📊 LEAD SCORE:",
    lead.score ??
    null
  );

  console.log(
    "----------------------------------------------------------"
  );

  console.log(
    "🧠 SYNCHRONIZED LEAD AI INSIGHTS:"
  );

  console.dir(
    synchronizedInsights,
    {
      depth: null,
    }
  );

  console.log(
    "----------------------------------------------------------"
  );

  console.table({

    buyingIntent:
      synchronizedInsights.buyingIntent,

    urgency:
      synchronizedInsights.urgency,

    budgetConfidence:
      synchronizedInsights.budgetConfidence,

    locationConfidence:
      synchronizedInsights.locationConfidence,

    propertyTypeConfidence:
      synchronizedInsights.propertyTypeConfidence,

    timelineConfidence:
      synchronizedInsights.timelineConfidence,

    missingInformation:
      synchronizedInsights.missingInformation.join(
        ", "
      ),

    recommendedAction:
      synchronizedInsights.recommendedAction,

  });

  console.log(
    "==========================================================\n"
  );



  return synchronizedInsights;
};



// ==========================================================
// SYNCHRONIZE CONVERSATION MEMORY
// ==========================================================

export const synchronizeConversationMemory = (
  conversation,
  lead
) => {

  if (
    !conversation ||
    !lead
  ) {

    return;
  }



  // ========================================================
  // SUMMARY
  // ========================================================

  if (
    !conversation.summary
  ) {

    conversation.summary = {};
  }



  if (
    lead.budget !== undefined &&
    lead.budget !== null
  ) {

    conversation.summary.budget =
      String(
        lead.budget
      );
  }



  if (
    lead.location
  ) {

    conversation.summary.location =
      String(
        lead.location
      );
  }



  if (
    lead.bedrooms !== undefined &&
    lead.bedrooms !== null
  ) {

    conversation.summary.bedrooms =
      String(
        lead.bedrooms
      );
  }



  if (
    lead.moveDate
  ) {

    conversation.summary.moveDate =
      String(
        lead.moveDate
      );
  }



  if (
    lead.phone
  ) {

    conversation.summary.phone =
      String(
        lead.phone
      );
  }



  if (
    lead.intent
  ) {

    conversation.summary.intent =
      String(
        lead.intent
      );
  }



  if (
    lead.aiInsights?.intent
  ) {

    conversation.summary.intent =
      String(
        lead.aiInsights.intent
      );
  }



  // ========================================================
  // MISSING FIELDS
  // ========================================================

  if (
    !conversation.missingFields
  ) {

    conversation.missingFields = {};
  }



  conversation.missingFields.budget =
    !(
      lead.budget !== undefined &&
      lead.budget !== null
    );



  conversation.missingFields.location =
    !Boolean(
      lead.location
    );



  conversation.missingFields.bedrooms =
    !(
      lead.bedrooms !== undefined &&
      lead.bedrooms !== null
    );



  conversation.missingFields.moveDate =
    !Boolean(
      lead.moveDate
    );



  conversation.missingFields.phone =
    !Boolean(
      lead.phone
    );
};



// ==========================================================
// DEBUG EXTRACTION
// ==========================================================

export const debugExtraction = (
  message,
  aiResult,
  aiExtractedData,
  deterministicData,
  extractedData
) => {

  console.log(
    "\n=========================================================="
  );

  console.log(
    "🔬 EXTRACTION DEBUG"
  );

  console.log(
    "=========================================================="
  );

  console.log(
    "💬 CUSTOMER MESSAGE:"
  );

  console.log(
    message
  );

  console.log(
    "----------------------------------------------------------"
  );

  console.log(
    "🤖 RAW AI RESULT:"
  );

  console.dir(
    aiResult,
    {
      depth: null,
    }
  );

  console.log(
    "----------------------------------------------------------"
  );

  console.log(
    "🤖 AI EXTRACTED DATA:"
  );

  console.dir(
    aiExtractedData,
    {
      depth: null,
    }
  );

  console.log(
    "----------------------------------------------------------"
  );

  console.log(
    "🤖 AI CONFIDENCE:"
  );

  console.dir(
    aiResult?.confidence,
    {
      depth: null,
    }
  );

  console.log(
    "----------------------------------------------------------"
  );

  console.log(
    "🧩 DETERMINISTIC EXTRACTION:"
  );

  console.dir(
    deterministicData,
    {
      depth: null,
    }
  );

  console.log(
    "----------------------------------------------------------"
  );

  console.log(
    "🧠 FINAL CURRENT MESSAGE EXTRACTION:"
  );

  console.dir(
    extractedData,
    {
      depth: null,
    }
  );

  console.log(
    "----------------------------------------------------------"
  );

  console.log(
    "📋 EXTRACTION SUMMARY:"
  );

  console.table({

    bedrooms:
      extractedData?.bedrooms ??
      null,

    budget:
      extractedData?.budget ??
      null,

    location:
      extractedData?.location ??
      null,

    moveDate:
      extractedData?.moveDate ??
      null,

    urgent:
      extractedData?.urgent ??
      null,

    intent:
      extractedData?.intent ??
      null,

    budgetConfidence:
      aiResult?.confidence?.budget ??
      0,

    locationConfidence:
      aiResult?.confidence?.location ??
      0,

    bedroomsConfidence:
      aiResult?.confidence?.bedrooms ??
      0,

    propertyTypeConfidence:
      aiResult?.confidence?.propertyType ??
      0,

    moveDateConfidence:
      aiResult?.confidence?.moveDate ??
      0,

    intentConfidence:
      aiResult?.confidence?.intent ??
      0,

    isQualified:
      aiResult?.isQualified ??
      false,

    isHot:
      aiResult?.isHot ??
      false,

    stage:
      aiResult?.stage ??
      null,

  });

  console.log(
    "==========================================================\n"
  );
};



// ==========================================================
// DEFAULT EXPORT
// ==========================================================

export default {

  safeString,

  normalizePhone,

  normalizeIncomingMessage,

  isValidNormalizedMessage,

  normalizeBedrooms,

  normalizeBudget,

  normalizeMoveDate,

  normalizeLocation,

  extractBedroomsFromMessage,

  extractBudgetFromMessage,

  extractLocationFromMessage,

  extractMoveDateFromMessage,

  extractUrgencyFromMessage,

  normalizeIntent,

  extractIntentFromMessage,

  extractCustomerNameFromMessage,

  extractStructuredCustomerData,

  mergeExtractedData,

  resolveOrganizationId,

  isValidOrganizationId,

  normalizeSource,

  resolveSource,

  normalizeAIUrgency,

  normalizeConfidence,

  synchronizeAIInsights,

  synchronizeConversationMemory,

  debugExtraction,

};