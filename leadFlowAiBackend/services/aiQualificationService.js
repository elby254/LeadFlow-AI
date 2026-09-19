/**
 * ============================================================
 *
 * AI QUALIFICATION SERVICE
 *
 * Purpose
 * ------------------------------------------------------------
 * Understand customer messages and transform them into
 * structured business intelligence for the CRM.
 *
 * Responsibilities
 * ------------------------------------------------------------
 * ✓ Intent Detection
 * ✓ Lead Qualification
 * ✓ Property Preference Extraction
 * ✓ Viewing Workflow Detection
 * ✓ Conversation Stage Tracking
 * ✓ Lead Scoring
 * ✓ AI Suggestions
 * ✓ Agent Context
 * ✓ Robust extraction from natural/random customer messages
 *
 * ============================================================
 */

/* ============================================================
   CONFIGURATION
============================================================ */

const HIGH_SCORE = 70;
const QUALIFIED_SCORE = 50;

/* ============================================================
   INTENT TYPES
============================================================ */

export const INTENTS = {
  BUY: "buy",
  RENT: "rent",
  PROPERTY_SEARCH: "property_search",
  VIEWING: "viewing",
  RESCHEDULE: "reschedule",
  CANCEL_VIEWING: "cancel_viewing",
  GREETING: "greeting",
  QUESTION: "question",
  UNKNOWN: "unknown",
};

/* ============================================================
   CONVERSATION STAGES
============================================================ */

export const STAGES = {
  COLLECT_BUDGET: "collect_budget",
  COLLECT_LOCATION: "collect_location",
  COLLECT_BEDROOMS: "collect_bedrooms",
  COLLECT_PROPERTY_TYPE: "collect_property_type",
  COLLECT_MOVE_DATE: "collect_move_date",
  QUALIFIED: "qualified",
  VIEWING_REQUESTED: "viewing_requested",
  VIEWING_CONFIRMED: "viewing_confirmed",
};

/* ============================================================
   PROPERTY TYPES
============================================================ */

const PROPERTY_TYPES = [
  "bedsitter",
  "bedsitters",
  "studio",
  "apartment",
  "apartments",
  "flat",
  "flats",
  "house",
  "houses",
  "villa",
  "villas",
  "maisonette",
  "maisonettes",
  "bungalow",
  "bungalows",
  "townhouse",
  "townhouses",
  "office",
  "offices",
  "shop",
  "shops",
  "commercial",
  "warehouse",
  "warehouses",
  "land",
];

/* ============================================================
   KNOWN LOCATIONS
============================================================ */

const LOCATIONS = [
  "Nairobi",
  "Westlands",
  "Kilimani",
  "Kileleshwa",
  "Karen",
  "Langata",
  "Embakasi",
  "South B",
  "South C",
  "Ruaka",
  "Ruiru",
  "Kiambu",
  "Thika",
  "Kamulu",
  "Syokimau",
  "Kitengela",
  "Athi River",
  "Ngong",
  "Lavington",
  "Donholm",
  "Kasarani",
  "Roysambu",
  "Parklands",
  "Runda",
  "Muthaiga",
  "Gigiri",
  "Kahawa",
  "Kahawa West",
  "Kahawa Sukari",
  "Umoja",
  "Buruburu",
  "Imara Daima",
  "Nyayo Estate",
  "Southlands",
  "Dagoretti",
  "Kikuyu",
  "Limuru",
  "Juja",
  "Mlolongo",
  "Machakos",
];

/* ============================================================
   PROPERTY FEATURES
============================================================ */

const FEATURES = [
  "parking",
  "balcony",
  "wifi",
  "wi-fi",
  "internet",
  "security",
  "cctv",
  "garden",
  "gym",
  "pool",
  "swimming pool",
  "lift",
  "elevator",
  "borehole",
  "backup generator",
  "generator",
  "water",
  "electric fence",
];

/* ============================================================
   AMENITIES
============================================================ */

const AMENITIES = [
  "furnished",
  "unfurnished",
  "pets",
  "pet friendly",
  "pet-friendly",
  "children",
  "school",
  "hospital",
  "shopping mall",
  "supermarket",
];

/* ============================================================
   VIEWING KEYWORDS
============================================================ */

const VIEWING_KEYWORDS = [
  "view",
  "viewing",
  "visit",
  "see the house",
  "see the apartment",
  "see the property",
  "see it",
  "schedule viewing",
  "schedule a viewing",
  "book viewing",
  "book a viewing",
  "book appointment",
  "book an appointment",
  "appointment",
];

/* ============================================================
   RESCHEDULE KEYWORDS
============================================================ */

const RESCHEDULE_KEYWORDS = [
  "reschedule",
  "change date",
  "change the date",
  "change time",
  "change the time",
  "move appointment",
  "move the appointment",
  "another day",
  "different day",
  "different time",
];

/* ============================================================
   CANCELLATION KEYWORDS
============================================================ */

const CANCEL_KEYWORDS = [
  "cancel",
  "cancel viewing",
  "cancel the viewing",
  "cannot come",
  "can't come",
  "cannot make it",
  "can't make it",
  "not coming",
  "postpone",
];

/* ============================================================
   GREETING KEYWORDS
============================================================ */

const GREETINGS = [
  "hi",
  "hello",
  "hey",
  "good morning",
  "good afternoon",
  "good evening",
];

/* ============================================================
   NUMBER WORDS
============================================================ */

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

/* ============================================================
   NORMALIZE TEXT
============================================================ */

export const normalizeText = (
  text = ""
) =>
  String(text || "")
    .toLowerCase()
    .replace(
      /[\u2018\u2019]/g,
      "'"
    )
    .replace(
      /[\u201C\u201D]/g,
      '"'
    )
    .replace(
      /[.,!?;:()[\]{}]/g,
      " "
    )
    .replace(
      /\s+/g,
      " "
    )
    .trim();

/* ============================================================
   CHECK KEYWORD
============================================================ */

export const containsKeyword = (
  text,
  keywords
) => {
  const normalized =
    normalizeText(text);

  if (!normalized) {
    return false;
  }

  return keywords.some(
    (keyword) => {
      const normalizedKeyword =
        normalizeText(keyword);

      if (!normalizedKeyword) {
        return false;
      }

      const escaped =
        normalizedKeyword.replace(
          /[.*+?^${}()|[\]\\]/g,
          "\\$&"
        );

      return new RegExp(
        `(^|\\s)${escaped}(?=\\s|$)`,
        "i"
      ).test(normalized);
    }
  );
};

/* ============================================================
   FIND MATCH
============================================================ */

export const findFirstMatch = (
  text,
  list
) => {
  const normalized =
    normalizeText(text);

  if (!normalized) {
    return null;
  }

  const sorted =
    [...list].sort(
      (a, b) =>
        normalizeText(b).length -
        normalizeText(a).length
    );

  return (
    sorted.find(
      (item) => {
        const normalizedItem =
          normalizeText(item);

        const escaped =
          normalizedItem.replace(
            /[.*+?^${}()|[\]\\]/g,
            "\\$&"
          );

        return new RegExp(
          `(^|\\s)${escaped}(?=\\s|$)`,
          "i"
        ).test(normalized);
      }
    ) || null
  );
};

/* ============================================================
   CANONICAL PROPERTY TYPE
============================================================ */

const normalizePropertyType = (
  value
) => {
  if (!value) {
    return null;
  }

  const normalized =
    normalizeText(value);

  const aliases = {
    bedsitters: "bedsitter",
    apartments: "apartment",
    flats: "flat",
    houses: "house",
    villas: "villa",
    maisonettes: "maisonette",
    bungalows: "bungalow",
    townhouses: "townhouse",
    offices: "office",
    shops: "shop",
    warehouses: "warehouse",
  };

  return (
    aliases[normalized] ||
    normalized
  );
};

/* ============================================================
   CANONICAL LOCATION
============================================================ */

const normalizeLocation = (
  value
) => {
  if (!value) {
    return null;
  }

  const trimmed =
    String(value)
      .replace(/\s+/g, " ")
      .trim();

  if (!trimmed) {
    return null;
  }

  return trimmed
    .split(" ")
    .map(
      (word) =>
        word.charAt(0).toUpperCase() +
        word.slice(1).toLowerCase()
    )
    .join(" ");
};

/* ============================================================
   INTENT DETECTION
============================================================ */

export const detectIntent = (
  message = ""
) => {
  const rawText =
    String(message || "");

  const text =
    normalizeText(rawText);

  if (!text) {
    return INTENTS.UNKNOWN;
  }

  /* ----------------------------------------------------------
     Specific workflow intents win first.
  ---------------------------------------------------------- */

  if (
    containsKeyword(
      text,
      RESCHEDULE_KEYWORDS
    )
  ) {
    return INTENTS.RESCHEDULE;
  }

  if (
    containsKeyword(
      text,
      CANCEL_KEYWORDS
    )
  ) {
    return INTENTS.CANCEL_VIEWING;
  }

  if (
    containsKeyword(
      text,
      VIEWING_KEYWORDS
    )
  ) {
    return INTENTS.VIEWING;
  }

  /* ----------------------------------------------------------
     Explicit purchase intent
  ---------------------------------------------------------- */

  if (
    /\b(buy|buying|purchase|purchasing|own|ownership)\b/i.test(
      text
    )
  ) {
    return INTENTS.BUY;
  }

  /* ----------------------------------------------------------
     Explicit rental intent
  ---------------------------------------------------------- */

  if (
    /\b(rent|rental|renting|lease|leasing|tenant|tenancy)\b/i.test(
      text
    )
  ) {
    return INTENTS.RENT;
  }

  /* ----------------------------------------------------------
     Property-search language
  ---------------------------------------------------------- */

  const propertySearchSignals = [
    "looking for",
    "looking to",
    "searching for",
    "need a",
    "need an",
    "want a",
    "want an",
    "i need",
    "i want",
    "find me",
    "find a",
    "find an",
    "property",
    "house",
    "apartment",
    "flat",
    "villa",
    "bedsitter",
    "studio",
    "maisonette",
    "bungalow",
    "bedroom",
    "bedrooms",
    "br",
    "budget",
    "move in",
    "move next",
    "moving",
  ];

  if (
    containsKeyword(
      text,
      propertySearchSignals
    ) ||
    extractBedrooms(text) !== null ||
    extractBudget(text) !== null ||
    extractLocation(text) !== null ||
    extractPropertyType(text) !== null ||
    extractMoveDate(text) !== null
  ) {
    return INTENTS.PROPERTY_SEARCH;
  }

  /* ----------------------------------------------------------
     Greeting
  ---------------------------------------------------------- */

  if (
    containsKeyword(
      text,
      GREETINGS
    )
  ) {
    return INTENTS.GREETING;
  }

  /* ----------------------------------------------------------
     Question
  ---------------------------------------------------------- */

  if (
    rawText.includes("?") ||
    /\b(what|where|when|how|which|can|could|is|are|do|does)\b/i.test(
      text
    )
  ) {
    return INTENTS.QUESTION;
  }

  return INTENTS.UNKNOWN;
};

/* ============================================================
   BUDGET EXTRACTION
============================================================ */

export const extractBudget = (
  message = ""
) => {
  const original =
    String(message || "");

  if (!original.trim()) {
    return null;
  }

  /* ----------------------------------------------------------
     Explicit currency amounts
  ---------------------------------------------------------- */

  const explicitCurrencyPatterns = [
    /(?:ksh|kes|kshs)\s*([\d,]+(?:\.\d+)?)\s*(k|m)?\b/i,

    /([\d,]+(?:\.\d+)?)\s*(k|m)\s*(?:ksh|kes|kshs)?\b/i,

    /([\d,]+(?:\.\d+)?)\s*(?:ksh|kes|kshs)\b/i,
  ];

  for (
    const pattern of explicitCurrencyPatterns
  ) {
    const match =
      original.match(pattern);

    if (!match) {
      continue;
    }

    let amount =
      parseFloat(
        String(match[1])
          .replace(/,/g, "")
      );

    const suffix =
      String(
        match[2] || ""
      ).toLowerCase();

    if (suffix === "k") {
      amount *= 1000;
    }

    if (suffix === "m") {
      amount *= 1000000;
    }

    if (
      Number.isFinite(amount) &&
      amount > 0
    ) {
      return Math.round(amount);
    }
  }

  /* ----------------------------------------------------------
     Contextual budget language
  ---------------------------------------------------------- */

  const contextualPatterns = [
    /\bbudget\s*(?:is|of|around|about|up to|under|below)?\s*(?:ksh|kes|kshs)?\s*([\d,]+(?:\.\d+)?)\s*(k|m)?\b/i,

    /\b(?:spend|afford|pay|rent|price)\s*(?:is|of|around|about|up to|under|below)?\s*(?:ksh|kes|kshs)?\s*([\d,]+(?:\.\d+)?)\s*(k|m)?\b/i,

    /\b(?:maximum|max|min|minimum)\s*(?:budget|price)?\s*(?:is|of|around|about|up to)?\s*(?:ksh|kes|kshs)?\s*([\d,]+(?:\.\d+)?)\s*(k|m)?\b/i,
  ];

  for (
    const pattern of contextualPatterns
  ) {
    const match =
      original.match(pattern);

    if (!match) {
      continue;
    }

    let amount =
      parseFloat(
        String(match[1])
          .replace(/,/g, "")
      );

    const suffix =
      String(
        match[2] || ""
      ).toLowerCase();

    if (suffix === "k") {
      amount *= 1000;
    }

    if (suffix === "m") {
      amount *= 1000000;
    }

    if (
      Number.isFinite(amount) &&
      amount > 0
    ) {
      return Math.round(amount);
    }
  }

  /* ----------------------------------------------------------
     Standalone large number
  ---------------------------------------------------------- */

  const numbers =
    original.match(
      /\b\d{4,7}\b/g
    );

  if (
    numbers &&
    numbers.length === 1
  ) {
    const candidate =
      Number(
        numbers[0]
          .replace(/,/g, "")
      );

    if (
      candidate >= 5000 &&
      candidate <= 100000000
    ) {
      return candidate;
    }
  }

  return null;
};

/* ============================================================
   LOCATION EXTRACTION
============================================================ */

export const extractLocation = (
  message = ""
) => {
  const text =
    normalizeText(message);

  if (!text) {
    return null;
  }

  /* ----------------------------------------------------------
     First use known CRM locations.
  ---------------------------------------------------------- */

  const known =
    findFirstMatch(
      text,
      LOCATIONS
    );

  if (known) {
    return normalizeLocation(
      known
    );
  }

  /* ----------------------------------------------------------
     Natural location expressions.
  ---------------------------------------------------------- */

  const patterns = [
    /\b(?:in|at|around|near|within|from)\s+([a-z][a-z\s-]{2,40}?)(?=\s+(?:with|for|under|over|budget|and|or|moving|move|next|this|my|i|please)\b|$)/i,

    /\b(?:area|location|neighborhood|neighbourhood)\s*(?:is|of|:)?\s*([a-z][a-z\s-]{2,40}?)(?=\s+(?:with|for|under|over|budget|and|or|moving|move|next|this|my|i|please)\b|$)/i,
  ];

  for (
    const pattern of patterns
  ) {
    const match =
      text.match(pattern);

    if (
      !match ||
      !match[1]
    ) {
      continue;
    }

    const candidate =
      match[1]
        .trim()
        .replace(
          /\s+/g,
          " "
        );

    if (
      candidate.length < 3 ||
      /\b(budget|house|apartment|flat|bedroom|bedrooms)\b/i.test(
        candidate
      )
    ) {
      continue;
    }

    return normalizeLocation(
      candidate
    );
  }

  return null;
};

/* ============================================================
   BEDROOM EXTRACTION
============================================================ */

export const extractBedrooms = (
  message = ""
) => {
  const text =
    normalizeText(message);

  if (!text) {
    return null;
  }

  if (
    /\bbedsitter\b/i.test(text)
  ) {
    return 1;
  }

  if (
    /\bstudio\b/i.test(text)
  ) {
    return 1;
  }

  const numericMatch =
    text.match(
      /\b(\d{1,2})\s*(?:bedrooms?|beds?|br)\b/i
    );

  if (numericMatch) {
    const bedrooms =
      parseInt(
        numericMatch[1],
        10
      );

    if (
      Number.isInteger(
        bedrooms
      ) &&
      bedrooms > 0 &&
      bedrooms <= 20
    ) {
      return bedrooms;
    }
  }

  const wordPattern =
    new RegExp(
      `\\b(${Object.keys(
        NUMBER_WORDS
      ).join("|")})\\s*(?:bedrooms?|beds?|br)\\b`,
      "i"
    );

  const wordMatch =
    text.match(
      wordPattern
    );

  if (wordMatch) {
    return NUMBER_WORDS[
      wordMatch[1]
        .toLowerCase()
    ];
  }

  return null;
};

/* ============================================================
   PROPERTY TYPE EXTRACTION
============================================================ */

export const extractPropertyType = (
  message = ""
) => {
  const text =
    normalizeText(message);

  if (!text) {
    return null;
  }

  const match =
    findFirstMatch(
      text,
      PROPERTY_TYPES
    );

  return normalizePropertyType(
    match
  );
};

/* ============================================================
   PROPERTY FEATURES
============================================================ */

export const extractFeatures = (
  message = ""
) => {
  const text =
    normalizeText(message);

  if (!text) {
    return [];
  }

  return FEATURES.filter(
    (feature) =>
      containsKeyword(
        text,
        [feature]
      )
  );
};

/* ============================================================
   AMENITIES
============================================================ */

export const extractAmenities = (
  message = ""
) => {
  const text =
    normalizeText(message);

  if (!text) {
    return [];
  }

  return AMENITIES.filter(
    (amenity) =>
      containsKeyword(
        text,
        [amenity]
      )
  );
};

/* ============================================================
   MOVE DATE
============================================================ */

export const extractMoveDate = (
  message = ""
) => {
  const text =
    normalizeText(message);

  if (!text) {
    return null;
  }

  if (
    /\b(today|right now)\b/i.test(
      text
    )
  ) {
    return "today";
  }

  if (
    /\b(immediately|asap|as soon as possible|right away)\b/i.test(
      text
    )
  ) {
    return "immediately";
  }

  if (
    /\b(this week|within this week)\b/i.test(
      text
    )
  ) {
    return "this week";
  }

  if (
    /\b(next week|coming week)\b/i.test(
      text
    )
  ) {
    return "next week";
  }

  if (
    /\b(this month|within this month)\b/i.test(
      text
    )
  ) {
    return "this month";
  }

  if (
    /\b(next month|coming month)\b/i.test(
      text
    )
  ) {
    return "next month";
  }

  if (
    /\b(2|two)\s+months?\b/i.test(
      text
    )
  ) {
    return "in 2 months";
  }

  if (
    /\b(3|three)\s+months?\b/i.test(
      text
    )
  ) {
    return "in 3 months";
  }

  if (
    /\b(4|four)\s+months?\b/i.test(
      text
    )
  ) {
    return "in 4 months";
  }

  const monthsMatch =
    text.match(
      /\bin\s+(\d+)\s+months?\b/i
    );

  if (monthsMatch) {
    return `in ${monthsMatch[1]} months`;
  }

  if (
    /\bnext year\b/i.test(
      text
    )
  ) {
    return "next year";
  }

  const monthMatch =
    text.match(
      /\b(?:in|by)\s+(january|february|march|april|may|june|july|august|september|october|november|december)\b/i
    );

  if (monthMatch) {
    return `in ${monthMatch[1].toLowerCase()}`;
  }

  return null;
};

/* ============================================================
   URGENCY
============================================================ */

export const extractUrgency = (
  message = ""
) => {
  const text =
    normalizeText(message);

  return /\b(today|urgent|urgently|immediately|asap|as soon as possible|this week|right away)\b/i.test(
    text
  );
};

/* ============================================================
   VIEWING REQUEST
============================================================ */

export const detectViewingRequest = (
  message = ""
) => {
  const text =
    normalizeText(message);

  return containsKeyword(
    text,
    VIEWING_KEYWORDS
  );
};

/* ============================================================
   VIEWING RESCHEDULE
============================================================ */

export const detectViewingReschedule = (
  message = ""
) => {
  const text =
    normalizeText(message);

  return containsKeyword(
    text,
    RESCHEDULE_KEYWORDS
  );
};

/* ============================================================
   VIEWING CANCELLATION
============================================================ */

export const detectViewingCancellation = (
  message = ""
) => {
  const text =
    normalizeText(message);

  return containsKeyword(
    text,
    CANCEL_KEYWORDS
  );
};

/* ============================================================
   VIEWING DATE
============================================================ */

export const extractViewingDate = (
  message = ""
) => {
  const text =
    normalizeText(message);

  if (
    /\btoday\b/i.test(text)
  ) {
    return "today";
  }

  if (
    /\btomorrow\b/i.test(text)
  ) {
    return "tomorrow";
  }

  if (
    /\bthis weekend\b/i.test(text)
  ) {
    return "this weekend";
  }

  if (
    /\bnext week\b/i.test(text)
  ) {
    return "next week";
  }

  const days = [
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday",
  ];

  for (
    const day of days
  ) {
    if (
      new RegExp(
        `\\b${day}\\b`,
        "i"
      ).test(text)
    ) {
      return day;
    }
  }

  return null;
};

/* ============================================================
   VIEWING TIME
============================================================ */

export const extractViewingTime = (
  message = ""
) => {
  const text =
    normalizeText(message);

  const timeMatch =
    text.match(
      /\b(\d{1,2})(:\d{2})?\s?(am|pm)\b/i
    );

  if (timeMatch) {
    return timeMatch[0];
  }

  if (
    /\bmorning\b/i.test(text)
  ) {
    return "morning";
  }

  if (
    /\bafternoon\b/i.test(text)
  ) {
    return "afternoon";
  }

  if (
    /\bevening\b/i.test(text)
  ) {
    return "evening";
  }

  return null;
};

/* ============================================================
   FINANCING
============================================================ */

export const detectFinancing = (
  message = ""
) => {
  const text =
    normalizeText(message);

  if (
    /\b(mortgage|bank loan|loan|financing|finance|financed)\b/i.test(
      text
    )
  ) {
    return "mortgage";
  }

  if (
    /\bcash\b/i.test(text)
  ) {
    return "cash";
  }

  return null;
};

/* ============================================================
   SENTIMENT
============================================================ */

export const detectSentiment = (
  message = ""
) => {
  const text =
    normalizeText(message);

  const positiveWords = [
    "interested",
    "love",
    "great",
    "perfect",
    "nice",
    "good",
    "book",
    "schedule",
    "visit",
    "ready",
    "buy",
    "rent",
    "like",
    "want",
    "need",
  ];

  const negativeWords = [
    "cancel",
    "expensive",
    "bad",
    "hate",
    "not interested",
    "later",
    "never",
    "no",
  ];

  let score = 0;

  positiveWords.forEach(
    (word) => {
      if (
        containsKeyword(
          text,
          [word]
        )
      ) {
        score++;
      }
    }
  );

  negativeWords.forEach(
    (word) => {
      if (
        containsKeyword(
          text,
          [word]
        )
      ) {
        score--;
      }
    }
  );

  if (score >= 2) {
    return "positive";
  }

  if (score <= -2) {
    return "negative";
  }

  return "neutral";
};

/* ============================================================
   AVAILABILITY QUESTION
============================================================ */

export const isAvailabilityQuestion = (
  message = ""
) => {
  const text =
    normalizeText(message);

  return (
    /\bavailable\b/i.test(text) ||
    /\bstill available\b/i.test(text) ||
    /\bvacant\b/i.test(text) ||
    /\boccupied\b/i.test(text)
  );
};

/* ============================================================
   PRICE NEGOTIATION
============================================================ */

export const detectNegotiationIntent = (
  message = ""
) => {
  const text =
    normalizeText(message);

  return (
    /\bdiscount\b/i.test(text) ||
    /\bbest price\b/i.test(text) ||
    /\bnegotiable\b/i.test(text) ||
    /\breduce\b/i.test(text) ||
    /\bcheaper\b/i.test(text) ||
    /\bnegotiate\b/i.test(text)
  );
};

/* ============================================================
   LEAD SCORE
============================================================ */

export const calculateLeadScore = (
  data = {}
) => {
  let score = 0;

  if (
    data.intent === INTENTS.BUY ||
    data.intent === INTENTS.RENT ||
    data.intent ===
      INTENTS.PROPERTY_SEARCH
  ) {
    score += 30;
  }

  if (data.budget) {
    score += 20;
  }

  if (data.location) {
    score += 15;
  }

  if (data.bedrooms) {
    score += 10;
  }

  if (data.propertyType) {
    score += 10;
  }

  if (data.moveDate) {
    score += 5;
  }

  if (data.viewingRequested) {
    score += 15;
  }

  if (data.urgent) {
    score += 15;
  }

  if (
    data.sentiment ===
    "positive"
  ) {
    score += 10;
  }

  return Math.min(
    score,
    100
  );
};

/* ============================================================
   QUALIFICATION STATUS
============================================================ */

export const determineQualification = (
  score = 0
) => {
  const numericScore =
    Number(score);

  const safeScore =
    Number.isFinite(
      numericScore
    )
      ? numericScore
      : 0;

  return {
    isQualified:
      safeScore >=
      QUALIFIED_SCORE,

    isHot:
      safeScore >=
      HIGH_SCORE,
  };
};

/* ============================================================
   CONVERSATION STAGE
============================================================ */

export const determineStage = (
  data = {}
) => {
  if (!data.budget) {
    return STAGES.COLLECT_BUDGET;
  }

  if (!data.location) {
    return STAGES.COLLECT_LOCATION;
  }

  if (!data.bedrooms) {
    return STAGES.COLLECT_BEDROOMS;
  }

  /*
   * Property type is optional.
   */

  if (!data.moveDate) {
    return STAGES.COLLECT_MOVE_DATE;
  }

  if (data.viewingRequested) {
    return STAGES.VIEWING_REQUESTED;
  }

  return STAGES.QUALIFIED;
};

/* ============================================================
   RECOMMENDED ACTION
============================================================ */

export const recommendAction = (
  data = {},
  score = 0
) => {
  if (data.cancelViewing) {
    return "Cancel viewing";
  }

  if (data.rescheduleViewing) {
    return "Reschedule viewing";
  }

  if (data.viewingRequested) {
    return "Schedule property viewing";
  }

  if (score >= HIGH_SCORE) {
    return "Agent should call immediately";
  }

  if (
    score >=
    QUALIFIED_SCORE
  ) {
    return "Schedule follow-up";
  }

  return "Continue qualification";
};

/* ============================================================
   MISSING INFORMATION
============================================================ */

export const getMissingInformation = (
  data = {}
) => {
  const missing = [];

  if (!data.budget) {
    missing.push("budget");
  }

  if (!data.location) {
    missing.push("location");
  }

  if (!data.bedrooms) {
    missing.push("bedrooms");
  }

  if (!data.moveDate) {
    missing.push("move date");
  }

  return missing;
};

/* ============================================================
   CONFIDENCE
============================================================ */

export const calculateConfidence = (
  data = {}
) => {
  return {
    budget:
      data.budget
        ? 100
        : 0,

    location:
      data.location
        ? 100
        : 0,

    bedrooms:
      data.bedrooms
        ? 100
        : 0,

    propertyType:
      data.propertyType
        ? 100
        : 0,

    moveDate:
      data.moveDate
        ? 100
        : 0,

    financing:
      data.financing
        ? 100
        : 0,

    intent:
      data.intent
        ? 100
        : 0,
  };
};

/* ============================================================
   PRIORITY
============================================================ */

export const determinePriority = (
  score = 0
) => {
  const numericScore =
    Number(score) || 0;

  if (numericScore >= 85) {
    return "Urgent";
  }

  if (numericScore >= 70) {
    return "High";
  }

  if (numericScore >= 50) {
    return "Medium";
  }

  return "Low";
};

/* ============================================================
   SUGGESTED REPLIES
============================================================ */

export const generateSuggestedReplies = (
  analysis = {}
) => {
  const replies = [];

  if (!analysis.budget) {
    replies.push(
      "What budget are you working with?"
    );
  }

  if (!analysis.location) {
    replies.push(
      "Which area are you interested in?"
    );
  }

  if (!analysis.bedrooms) {
    replies.push(
      "How many bedrooms do you need?"
    );
  }

  if (!analysis.propertyType) {
    replies.push(
      "Are you looking for an apartment, house, villa or another property type?"
    );
  }

  if (!analysis.moveDate) {
    replies.push(
      "When are you planning to move?"
    );
  }

  if (analysis.viewingRequested) {
    replies.push(
      "I can help schedule a property viewing."
    );
  }

  if (analysis.rescheduleViewing) {
    replies.push(
      "Let's choose another viewing date that works for you."
    );
  }

  if (analysis.cancelViewing) {
    replies.push(
      "Your viewing request can be cancelled."
    );
  }

  if (replies.length === 0) {
    replies.push(
      "I'll connect you with one of our property advisors."
    );
  }

  return replies.slice(
    0,
    3
  );
};

/* ============================================================
   MAIN AI ANALYSIS PIPELINE
============================================================ */

export const analyzeMessage = (
  message = ""
) => {
  const cleanMessage =
    String(message || "")
      .trim();

  /* ----------------------------------------------------------
     Empty message protection
  ---------------------------------------------------------- */

  if (!cleanMessage) {
    const emptyAnalysis = {
      score: 0,
      priority: "Low",
      stage: STAGES.COLLECT_BUDGET,
      isQualified: false,
      isHot: false,

      extracted: {
        intent: INTENTS.UNKNOWN,
        budget: null,
        location: null,
        bedrooms: null,
        propertyType: null,
        features: [],
        amenities: [],
        moveDate: null,
        urgent: false,
        viewingRequested: false,
        rescheduleViewing: false,
        cancelViewing: false,
        viewingDate: null,
        viewingTime: null,
        financing: null,
        sentiment: "neutral",
      },

      confidence: {
        budget: 0,
        location: 0,
        bedrooms: 0,
        propertyType: 0,
        moveDate: 0,
        financing: 0,
        intent: 0,
      },

      missingInformation: [
        "budget",
        "location",
        "bedrooms",
        "move date",
      ],

      recommendedAction:
        "Continue qualification",

      suggestedReplies:
        generateSuggestedReplies({}),
    };

    return emptyAnalysis;
  }

  /* ----------------------------------------------------------
     EXTRACTION
  ---------------------------------------------------------- */

  const intent =
    detectIntent(
      cleanMessage
    );

  const budget =
    extractBudget(
      cleanMessage
    );

  const location =
    extractLocation(
      cleanMessage
    );

  const bedrooms =
    extractBedrooms(
      cleanMessage
    );

  const propertyType =
    extractPropertyType(
      cleanMessage
    );

  const features =
    extractFeatures(
      cleanMessage
    );

  const amenities =
    extractAmenities(
      cleanMessage
    );

  const moveDate =
    extractMoveDate(
      cleanMessage
    );

  const urgent =
    extractUrgency(
      cleanMessage
    );

  const viewingRequested =
    detectViewingRequest(
      cleanMessage
    );

  const rescheduleViewing =
    detectViewingReschedule(
      cleanMessage
    );

  const cancelViewing =
    detectViewingCancellation(
      cleanMessage
    );

  const viewingDate =
    extractViewingDate(
      cleanMessage
    );

  const viewingTime =
    extractViewingTime(
      cleanMessage
    );

  const financing =
    detectFinancing(
      cleanMessage
    );

  const sentiment =
    detectSentiment(
      cleanMessage
    );

  /* ----------------------------------------------------------
     STRUCTURED EXTRACTION
  ---------------------------------------------------------- */

  const extracted = {
    intent,

    budget,

    location,

    bedrooms,

    propertyType,

    features,

    amenities,

    moveDate,

    urgent,

    viewingRequested,

    rescheduleViewing,

    cancelViewing,

    viewingDate,

    viewingTime,

    financing,

    sentiment,
  };

  /* ----------------------------------------------------------
     LEAD SCORE
  ---------------------------------------------------------- */

  const score =
    calculateLeadScore(
      extracted
    );

  /* ----------------------------------------------------------
     QUALIFICATION
  ---------------------------------------------------------- */

  const qualification =
    determineQualification(
      score
    );

  /* ----------------------------------------------------------
     CONVERSATION STAGE
  ---------------------------------------------------------- */

  const stage =
    determineStage(
      extracted
    );

  /* ----------------------------------------------------------
     MISSING INFORMATION
  ---------------------------------------------------------- */

  const missingInformation =
    getMissingInformation(
      extracted
    );

  /* ----------------------------------------------------------
     CONFIDENCE
  ---------------------------------------------------------- */

  const confidence =
    calculateConfidence(
      extracted
    );

  /* ----------------------------------------------------------
     PRIORITY
  ---------------------------------------------------------- */

  const priority =
    determinePriority(
      score
    );

  /* ----------------------------------------------------------
     RECOMMENDED ACTION
  ---------------------------------------------------------- */

  const recommendedAction =
    recommendAction(
      extracted,
      score
    );

  /* ----------------------------------------------------------
     SUGGESTED REPLIES
  ---------------------------------------------------------- */

  const suggestedReplies =
    generateSuggestedReplies(
      extracted
    );

  /* ----------------------------------------------------------
     FINAL ANALYSIS OBJECT
  ---------------------------------------------------------- */

  const analysis = {
    score,

    priority,


    ...qualification,

    extracted,

    confidence,

    missingInformation,

    recommendedAction,

    suggestedReplies,
  };

  return analysis;
};

/* ============================================================
   QUICK LEAD STATUS
============================================================ */

export const determineLeadStatus = (
  score = 0
) => {
  const numericScore =
    Number(score) || 0;

  if (numericScore >= HIGH_SCORE) {
    return "hot";
  }

  if (
    numericScore >=
    QUALIFIED_SCORE
  ) {
    return "qualified";
  }

  return "new";
};

/* ============================================================
   PROPERTY MATCH SCORE
============================================================ */

export const calculatePropertyMatch = (
  lead = {},
  property = {}
) => {
  let score = 0;

  if (
    lead.location &&
    property.location &&
    String(
      lead.location
    ).toLowerCase() ===
      String(
        property.location
      ).toLowerCase()
  ) {
    score += 30;
  }

  if (
    lead.propertyType &&
    property.propertyType &&
    String(
      lead.propertyType
    ).toLowerCase() ===
      String(
        property.propertyType
      ).toLowerCase()
  ) {
    score += 20;
  }

  if (
    lead.bedrooms &&
    property.bedrooms &&
    Number(
      lead.bedrooms
    ) ===
      Number(
        property.bedrooms
      )
  ) {
    score += 20;
  }

  if (
    lead.budget &&
    property.price &&
    Number(
      property.price
    ) <=
      Number(
        lead.budget
      ) * 1.1
  ) {
    score += 30;
  }

  return Math.min(
    score,
    100
  );
};

/* ============================================================
   VIEWING RECOMMENDATION
============================================================ */

export const recommendViewing = (
  analysis = {}
) => {
  return (
    Number(
      analysis.score
    ) >= 70 &&
    analysis.extracted
      ?.viewingRequested ===
      true
  );
};

/* ============================================================
   CONVERSATION SUMMARY
============================================================ */

export const generateConversationSummary = (
  analysis = {}
) => {
  const extracted =
    analysis.extracted ||
    {};

  return {
    budget:
      extracted.budget ?? "",

    location:
      extracted.location ?? "",

    bedrooms:
      extracted.bedrooms ?? "",

    propertyType:
      extracted.propertyType ?? "",

    moveDate:
      extracted.moveDate ?? "",

    financing:
      extracted.financing ?? "",

    intent:
      extracted.intent ?? "",
  };
};

/* ============================================================
   AI INSIGHTS
============================================================ */

export const generateInsights = (
  analysis = {}
) => {
  const extracted =
    analysis.extracted || {};

  let urgency = "Low";

  if (
    extracted.urgent === true
  ) {
    urgency = "High";
  } else if (
    extracted.moveDate
  ) {
    const moveDate =
      String(
        extracted.moveDate
      )
        .trim()
        .toLowerCase();

    if (
      [
        "immediately",
        "urgent",
        "urgently",
        "asap",
        "as soon as possible",
        "right away",
        "need it now",
        "this week",
        "this month",
        "today",
        "tomorrow",
      ].includes(
        moveDate
      )
    ) {
      urgency = "High";
    } else if (
      [
        "next week",
        "next month",
        "next year",
      ].includes(
        moveDate
      )
    ) {
      urgency = "Medium";
    }
  }

  return {
    buyingIntent:
      extracted.intent || "",

    urgency,

    leadScore:
      Number(
        analysis.score
      ) || 0,

    priority:
      analysis.priority ||
      "Low",

    recommendedAction:
      analysis.recommendedAction ||
      "",

    missingInformation:
      analysis.missingInformation ||
      [],
  };
};

/* ============================================================
   DEBUG LOGGER
============================================================ */

export const logAnalysis = (
  analysis = {}
) => {
  console.log(
    "========== AI ANALYSIS =========="
  );

  console.table({
    Intent:
      analysis.extracted
        ?.intent,

    Budget:
      analysis.extracted
        ?.budget,

    Location:
      analysis.extracted
        ?.location,

    Bedrooms:
      analysis.extracted
        ?.bedrooms,

    PropertyType:
      analysis.extracted
        ?.propertyType,

    MoveDate:
      analysis.extracted
        ?.moveDate,

    Financing:
      analysis.extracted
        ?.financing,

    Viewing:
      analysis.extracted
        ?.viewingRequested,

    Score:
      analysis.score,

    Stage:
      analysis.stage,

    Priority:
      analysis.priority,

    Qualified:
      analysis.isQualified,

    Hot:
      analysis.isHot,
  });

  console.log(
    "Missing:",
    analysis.missingInformation
  );

  console.log(
    "Recommended:",
    analysis.recommendedAction
  );

  console.log(
    "Full AI Extraction:"
  );

  console.dir(
    analysis.extracted,
    {
      depth: null,
    }
  );
};

/* ============================================================
   DEFAULT EXPORT
============================================================ */

export default {
  analyzeMessage,

  detectIntent,

  extractBudget,

  extractLocation,

  extractBedrooms,

  extractPropertyType,

  extractFeatures,

  extractAmenities,

  extractMoveDate,

  extractUrgency,

  detectViewingRequest,

  detectViewingReschedule,

  detectViewingCancellation,

  extractViewingDate,

  extractViewingTime,

  detectFinancing,

  detectSentiment,

  isAvailabilityQuestion,

  detectNegotiationIntent,

  calculateLeadScore,

  determineQualification,

  determineStage,

  recommendAction,

  determinePriority,

  determineLeadStatus,

  calculateConfidence,

  calculatePropertyMatch,

  recommendViewing,

  generateConversationSummary,

  generateInsights,

  generateSuggestedReplies,

  logAnalysis,

  normalizeText,

  containsKeyword,

  findFirstMatch,
};