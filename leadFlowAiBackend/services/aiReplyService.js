/**
 * ============================================================
 *
 * AI REPLY SERVICE
 *
 * ============================================================
 *
 * PURPOSE
 * ------------------------------------------------------------
 * Central AI orchestration layer responsible for:
 *
 * ✓ AI Replies
 * ✓ Smart Suggestions
 * ✓ Viewing Workflow Messages
 * ✓ Property Recommendations
 * ✓ Lead Qualification
 * ✓ Conversation Intelligence
 * ✓ Agent Assistance
 * ✓ Structured Lead Information Extraction
 * ✓ Customer Intent Detection
 *
 * ============================================================
 */

import OpenAI from "openai";

import {
  normalizeIntent,
} from "./leadScoringRulesEngine.js";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/* ============================================================
   SYSTEM PROMPTS
============================================================ */

const GENERAL_SYSTEM_PROMPT = `
You are LeadFlow AI.

You assist Kenyan real estate agencies.

Rules:

- Be professional.
- Be concise.
- Never invent property information.
- Never promise unavailable properties.
- Encourage scheduling a viewing.
- Use friendly conversational English.
`;

const VIEWING_SYSTEM_PROMPT = `
You help customers schedule property viewings.

Rules:

- Confirm appointments clearly.
- Mention date and time when available.
- Encourage punctuality.
- Remain friendly.
`;

const AGENT_SYSTEM_PROMPT = `
You help real estate agents.

Provide concise recommendations.

Focus on:

- next best action
- lead quality
- objections
- follow-up strategy
`;

/* ============================================================
   CHAT HISTORY BUILDER
============================================================ */

export const buildConversationHistory = (
  messages = []
) => {
  return messages.map((message) => ({
    role:
      message.senderRole === "customer"
        ? "user"
        : "assistant",

    content: message.text || "",
  }));
};

/* ============================================================
   OPENAI REQUEST WRAPPER
============================================================ */

const callOpenAI = async ({
  systemPrompt,
  messages,
  temperature = 0.6,
  maxTokens = 300,
}) => {
  try {
    if (!process.env.OPENAI_API_KEY) {
      console.error(
        "[AIReplyService] OPENAI_API_KEY is missing."
      );

      return {
        success: false,
        content: "",
        error:
          "OPENAI_API_KEY is not configured.",
      };
    }

    const response =
      await client.chat.completions.create({
        model: "gpt-4.1-mini",

        temperature,

        max_tokens: maxTokens,

        messages: [
          {
            role: "system",
            content: systemPrompt,
          },

          ...messages,
        ],
      });

    const content =
      response.choices?.[0]?.message?.content ||
      "";

    return {
      success: true,

      content,
    };
  } catch (error) {
    console.error(
      "[AIReplyService] OpenAI Error:",
      error
    );

    return {
      success: false,

      content: "",

      error: error.message,
    };
  }
};

/* ============================================================
   PROMPT BUILDERS
============================================================ */

const buildConversationPrompt = (
  conversation,
  latestMessage
) => {
  return [
    ...buildConversationHistory(
      conversation.messages || []
    ),

    {
      role: "user",
      content: latestMessage,
    },
  ];
};

const buildSinglePrompt = (
  prompt
) => {
  return [
    {
      role: "user",
      content: prompt,
    },
  ];
};

/* ============================================================
   SAFE JSON PARSER
============================================================ */

const parseAIJson = (
  content
) => {
  if (!content) {
    return null;
  }

  try {
    return JSON.parse(content);
  } catch (error) {
    // --------------------------------------------------------
    // Sometimes the model wraps JSON in markdown fences.
    // --------------------------------------------------------

    const cleaned =
      content
        .replace(
          /^```json\s*/i,
          ""
        )
        .replace(
          /^```\s*/i,
          ""
        )
        .replace(
          /\s*```$/i,
          ""
        )
        .trim();

    try {
      return JSON.parse(cleaned);
    } catch (secondError) {
      console.error(
        "[AIReplyService] Failed to parse AI JSON:",
        secondError
      );

      return null;
    }
  }
};

/* ============================================================
   NORMALIZE INTENT
============================================================ */
/*
 * Canonical Lead intent semantics:
 *
 * ------------------------------------------------------------
 *
 * rent
 * ------------------------------------------------------------
 * Customer explicitly wants to:
 *
 * - rent
 * - lease
 * - let
 * - find a rental
 *
 *
 * buy
 * ------------------------------------------------------------
 * Customer explicitly wants to:
 *
 * - buy
 * - purchase
 * - own
 * - acquire
 *
 *
 * property_search
 * ------------------------------------------------------------
 * Customer is looking/searching for a property but has NOT
 * explicitly stated whether they want to rent or buy.
 *
 *
 * IMPORTANT
 * ------------------------------------------------------------
 * Intent describes WHAT THE CUSTOMER WANTS TO DO.
 *
 * buyingIntent describes HOW STRONG the customer's interest
 * is and is therefore a separate field.
 *
 * Examples:
 *
 * "I'm looking for a house"
 *     → property_search
 *
 * "I'm looking for a house to rent"
 *     → rent
 *
 * "I want to rent a house"
 *     → rent
 *
 * "I'm looking for a house to buy"
 *     → buy
 *
 * "I want to purchase a house"
 *     → buy
 *
 * Legacy AI values are normalized:
 *
 * property_rental
 * property-rental
 * rental
 * lease
 *
 *     → rent
 *
 * property_purchase
 * property-purchase
 * purchase
 *
 *     → buy
 *
 * property_search
 * property-search
 *
 *     → property_search
 *
 * ============================================================
 */

const normalizeCustomerIntent = (
  value
) => {

  const intent =
    String(
      value ?? ""
    )
      .trim()
      .toLowerCase();

  if (!intent) {
    return null;
  }

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
    ].includes(
      intent
    )
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
    ].includes(
      intent
    )
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

/* ============================================================
   NORMALIZE EXTRACTED LEAD INFORMATION
============================================================ */

const normalizeExtractedLeadInformation = (
  extracted = {}
) => {

  /*
   * The scoring engine may already expose normalizeIntent.
   *
   * We first use the project-level normalizer when it returns
   * a valid canonical intent, then fall back to the local
   * semantic normalizer.
   *
   * This protects the extraction layer from legacy values such
   * as property_rental/property_purchase.
   */

  let normalizedIntent = null;

  try {

    normalizedIntent =
      normalizeIntent(
        extracted.intent
      );

  } catch (error) {

    console.warn(
      "[AIReplyService] normalizeIntent failed:",
      error.message
    );

  }

  normalizedIntent =
    normalizeCustomerIntent(
      normalizedIntent ||
      extracted.intent
    );

  return {

    name:
      extracted.name ||
      "",

    budget:
      extracted.budget !== undefined &&
      extracted.budget !== null
        ? extracted.budget
        : "",

    location:
      extracted.location ||
      "",

    bedrooms:
      extracted.bedrooms !== undefined &&
      extracted.bedrooms !== null
        ? extracted.bedrooms
        : "",

    propertyType:
      extracted.propertyType ||
      "",

    moveDate:
      extracted.moveDate ||
      "",

    phone:
      extracted.phone ||
      "",

    /*
     * Canonical customer transaction intent.
     *
     * Possible values:
     *
     * rent
     * buy
     * property_search
     *
     */

    intent:
      normalizedIntent ||
      "",

    /*
     * buyingIntent is intentionally separate.
     *
     * It represents the strength of the customer's interest,
     * not whether the customer wants to rent or buy.
     */

    buyingIntent:
      extracted.buyingIntent ||
      "",

    confidence:
      extracted.confidence !== undefined
        ? extracted.confidence
        : null,
  };
};

/* ============================================================
   SHARED EXPORTS
============================================================ */

export {
  GENERAL_SYSTEM_PROMPT,
  VIEWING_SYSTEM_PROMPT,
  AGENT_SYSTEM_PROMPT,
  callOpenAI,
  buildConversationPrompt,
  buildSinglePrompt,
};

/* ============================================================
   GENERATE AI REPLY
============================================================ */

export const generateReply = async (
  conversation = {},
  latestCustomerMessage = ""
) => {
  const messages =
    buildConversationPrompt(
      conversation,
      latestCustomerMessage
    );

  const result =
    await callOpenAI({
      systemPrompt:
        GENERAL_SYSTEM_PROMPT,

      messages,

      temperature: 0.6,

      maxTokens: 250,
    });

  return {
    success: result.success,

    reply:
      result.content,

    error:
      result.error,
  };
};

/* ============================================================
   REGENERATE AI REPLY
============================================================ */

export const regenerateReply = async (
  conversation = {},
  latestCustomerMessage = ""
) => {
  const messages = [
    ...buildConversationPrompt(
      conversation,
      latestCustomerMessage
    ),

    {
      role: "user",

      content:
        "Generate a different response with the same meaning.",
    },
  ];

  const result =
    await callOpenAI({
      systemPrompt:
        GENERAL_SYSTEM_PROMPT,

      messages,

      temperature: 0.9,

      maxTokens: 250,
    });

  return {
    success:
      result.success,

    reply:
      result.content,

    error:
      result.error,
  };
};

/* ============================================================
   GENERATE SMART REPLY SUGGESTIONS
============================================================ */

export const generateSuggestions =
  async (
    conversation = {}
  ) => {
    const transcript =
      conversation.messages
        ?.map(
          (message) =>
            `${message.senderRole}: ${message.text}`
        )
        .join("\n") || "";

    const prompt = `
Provide THREE short reply suggestions.

Conversation:

${transcript}

Return each reply on a separate line.
`;

    const result =
      await callOpenAI({
        systemPrompt:
          GENERAL_SYSTEM_PROMPT,

        messages:
          buildSinglePrompt(
            prompt
          ),

        temperature: 0.8,

        maxTokens: 250,
      });

    return {
      success:
        result.success,

      suggestions:
        result.content
          .split("\n")
          .map((item) =>
            item
              .replace(
                /^\d+\.\s*/,
                ""
              )
              .trim()
          )
          .filter(Boolean)
          .slice(0, 3),

      error:
        result.error,
    };
  };

/* ============================================================
   SUMMARIZE CONVERSATION
============================================================ */

export const summarizeConversation =
  async (
    conversation = {}
  ) => {
    const transcript =
      conversation.messages
        ?.map(
          (message) =>
            `${message.senderRole}: ${message.text}`
        )
        .join("\n") || "";

    const prompt = `
Summarize this conversation.

Maximum 100 words.

Focus on:

- customer needs
- budget
- preferred location
- property type
- next action

Conversation:

${transcript}
`;

    const result =
      await callOpenAI({
        systemPrompt:
          GENERAL_SYSTEM_PROMPT,

        messages:
          buildSinglePrompt(
            prompt
          ),

        temperature: 0.4,

        maxTokens: 200,
      });

    return {
      success:
        result.success,

      summary:
        result.content,

      error:
        result.error,
    };
  };

/* ============================================================
   IMPROVE REPLY TONE
============================================================ */

export const improveReplyTone =
  async (
    reply = "",
    tone = "professional"
  ) => {
    const prompt = `
Rewrite the following reply.

Tone:
${tone}

Reply:

${reply}

Do not change the meaning.
`;

    const result =
      await callOpenAI({
        systemPrompt:
          GENERAL_SYSTEM_PROMPT,

        messages:
          buildSinglePrompt(
            prompt
          ),

        temperature: 0.5,

        maxTokens: 250,
      });

    return {
      success:
        result.success,

      reply:
        result.content,

      error:
        result.error,
    };
  };

/* ============================================================
   TRANSLATE REPLY
============================================================ */

export const translateReply =
  async (
    reply = "",
    language = "Swahili"
  ) => {
    const prompt = `
Translate this reply into ${language}.

Reply:

${reply}

Maintain a natural conversational tone.
`;

    const result =
      await callOpenAI({
        systemPrompt:
          GENERAL_SYSTEM_PROMPT,

        messages:
          buildSinglePrompt(
            prompt
          ),

        temperature: 0.4,

        maxTokens: 250,
      });

    return {
      success:
        result.success,

      translatedReply:
        result.content,

      error:
        result.error,
    };
  };

/* ============================================================
   GENERATE FOLLOW-UP MESSAGE
============================================================ */

export const generateFollowUpMessage =
  async (
    lead = {},
    property = {}
  ) => {
    const prompt = `
Write a professional follow-up message.

Customer Name:
${lead.name || "Customer"}

Property:
${property.title || "Property"}

Location:
${property.location || ""}

Budget:
${lead.budget || "Unknown"}

Purpose:

Encourage the customer to continue the conversation
or schedule a viewing.
`;

    const result =
      await callOpenAI({
        systemPrompt:
          GENERAL_SYSTEM_PROMPT,

        messages:
          buildSinglePrompt(
            prompt
          ),

        temperature: 0.7,

        maxTokens: 250,
      });

    return {
      success:
        result.success,

      message:
        result.content,

      error:
        result.error,
    };
  };

/* ============================================================
   CALL PREPARATION
============================================================ */

export const generateCallPreparation =
  async (
    lead = {}
  ) => {
    const prompt = `
Prepare an agent before calling.

Lead Details

Name:
${lead.name}

Budget:
${lead.budget}

Location:
${lead.location}

Bedrooms:
${lead.bedrooms}

Move Date:
${lead.moveDate}

Intent:
${lead.intent}

Score:
${lead.score}

Provide:

1. Customer summary

2. Important talking points

3. Questions to ask

4. Possible objections
`;

    const result =
      await callOpenAI({
        systemPrompt:
          AGENT_SYSTEM_PROMPT,

        messages:
          buildSinglePrompt(
            prompt
          ),

        temperature: 0.4,

        maxTokens: 400,
      });

    return {
      success:
        result.success,

      preparation:
        result.content,

      error:
        result.error,
    };
  };

/* ============================================================
   NEXT BEST ACTION
============================================================ */

export const generateNextBestAction =
  async (
    lead = {},
    conversation = {}
  ) => {
    const transcript =
      conversation.messages
        ?.map(
          (message) =>
            `${message.senderRole}: ${message.text}`
        )
        .join("\n") || "";

    const prompt = `
Lead Score:
${lead.score}

Intent:
${lead.intent}

Status:
${lead.status}

Conversation:

${transcript}

Recommend ONE next action.

Examples:

- Schedule viewing
- Call customer
- Wait for response
- Continue qualification
- Send follow-up

Explain briefly why.
`;

    const result =
      await callOpenAI({
        systemPrompt:
          AGENT_SYSTEM_PROMPT,

        messages:
          buildSinglePrompt(
            prompt
          ),

        temperature: 0.4,

        maxTokens: 250,
      });

    return {
      success:
        result.success,

      recommendation:
        result.content,

      error:
        result.error,
    };
  };

/* ============================================================
   VIEWING APPROVAL MESSAGE
============================================================ */

export const generateViewingConfirmation =
  async (
    viewing = {}
  ) => {
    const prompt = `
Create a professional viewing confirmation.

Property:
${viewing.propertyTitle}

Date:
${viewing.viewingDate}

Time:
${viewing.startTime}

Location:
${viewing.address}

Keep the message friendly and concise.
`;

    const result =
      await callOpenAI({
        systemPrompt:
          VIEWING_SYSTEM_PROMPT,

        messages:
          buildSinglePrompt(
            prompt
          ),

        temperature: 0.4,

        maxTokens: 220,
      });

    return {
      success:
        result.success,

      message:
        result.content,

      error:
        result.error,
    };
  };

/* ============================================================
   VIEWING REJECTION MESSAGE
============================================================ */

export const generateViewingRejectionMessage =
  async (
    reason = ""
  ) => {
    const prompt = `
Write a polite viewing rejection.

Reason:

${reason}

Offer the customer an opportunity
to choose another date.
`;

    const result =
      await callOpenAI({
        systemPrompt:
          VIEWING_SYSTEM_PROMPT,

        messages:
          buildSinglePrompt(
            prompt
          ),

        temperature: 0.4,

        maxTokens: 220,
      });

    return {
      success:
        result.success,

      message:
        result.content,

      error:
        result.error,
    };
  };

/* ============================================================
   VIEWING REMINDER
============================================================ */

export const generateViewingReminder =
  async (
    viewing = {}
  ) => {
    const prompt = `
Create a reminder for tomorrow's viewing.

Property:
${viewing.propertyTitle}

Date:
${viewing.viewingDate}

Time:
${viewing.startTime}

Address:
${viewing.address}

Mention arriving on time.
`;

    const result =
      await callOpenAI({
        systemPrompt:
          VIEWING_SYSTEM_PROMPT,

        messages:
          buildSinglePrompt(
            prompt
          ),

        temperature: 0.4,

        maxTokens: 220,
      });

    return {
      success:
        result.success,

      message:
        result.content,

      error:
        result.error,
    };
  };

/* ============================================================
   VIEWING RESCHEDULE MESSAGE
============================================================ */

export const generateViewingRescheduleMessage =
  async (
    oldViewing = {},
    newViewing = {}
  ) => {
    const prompt = `
Inform the customer that the viewing
has been rescheduled.

Old Date:
${oldViewing.viewingDate}

Old Time:
${oldViewing.startTime}

New Date:
${newViewing.viewingDate}

New Time:
${newViewing.startTime}

Property:
${newViewing.propertyTitle}

Be apologetic and professional.
`;

    const result =
      await callOpenAI({
        systemPrompt:
          VIEWING_SYSTEM_PROMPT,

        messages:
          buildSinglePrompt(
            prompt
          ),

        temperature: 0.4,

        maxTokens: 250,
      });

    return {
      success:
        result.success,

      message:
        result.content,

      error:
        result.error,
    };
  };

/* ============================================================
   VIEWING CANCELLATION MESSAGE
============================================================ */

export const generateViewingCancellationMessage =
  async (
    propertyTitle = ""
  ) => {
    const prompt = `
Inform the customer that the viewing
has been cancelled.

Property:

${propertyTitle}

Offer assistance in scheduling another
appointment.
`;

    const result =
      await callOpenAI({
        systemPrompt:
          VIEWING_SYSTEM_PROMPT,

        messages:
          buildSinglePrompt(
            prompt
          ),

        temperature: 0.4,

        maxTokens: 220,
      });

    return {
      success:
        result.success,

      message:
        result.content,

      error:
        result.error,
    };
  };

/* ============================================================
   POST-VIEWING THANK YOU
============================================================ */

export const generatePostViewingMessage =
  async (
    propertyTitle = ""
  ) => {
    const prompt = `
Write a thank-you message after
a completed property viewing.

Property:

${propertyTitle}

Encourage the customer to share
their thoughts or ask questions.
`;

    const result =
      await callOpenAI({
        systemPrompt:
          VIEWING_SYSTEM_PROMPT,

        messages:
          buildSinglePrompt(
            prompt
          ),

        temperature: 0.5,

        maxTokens: 220,
      });

    return {
      success:
        result.success,

      message:
        result.content,

      error:
        result.error,
    };
  };


/* ============================================================
   DETECT CUSTOMER URGENCY
============================================================ */

export const detectUrgency =
  async (
    conversation = {}
  ) => {

    const transcript =
      conversation.messages
        ?.map(
          (message) =>
            `${message.senderRole}: ${message.text}`
        )
        .join("\n") || "";

    const prompt = `
Determine how urgent this customer is.

Return ONLY one value:

High
Medium
Low

Do not explain.
Do not add punctuation.
Do not add any other text.

Conversation:

${transcript}
`;

    const result =
      await callOpenAI({
        systemPrompt:
          AGENT_SYSTEM_PROMPT,

        messages:
          buildSinglePrompt(
            prompt
          ),

        temperature: 0.1,

        maxTokens: 20,
      });

    if (
      !result.success
    ) {
      return {
        success: false,

        urgency: null,

        error:
          result.error,
      };
    }

    const rawUrgency =
      String(
        result.content || ""
      )
        .trim()
        .toLowerCase();

    let urgency = null;

    if (
      rawUrgency.includes(
        "high"
      )
    ) {
      urgency = "High";
    }

    else if (
      rawUrgency.includes(
        "medium"
      )
    ) {
      urgency = "Medium";
    }

    else if (
      rawUrgency.includes(
        "low"
      )
    ) {
      urgency = "Low";
    }

    console.log(
      "🤖 AI CONVERSATION URGENCY:",
      {
        raw:
          result.content,

        normalized:
          urgency,
      }
    );

    return {
      success:
        result.success,

      urgency,

      error:
        result.error,
    };
  };

/* ============================================================
   DETECT CUSTOMER OBJECTIONS
============================================================ */

export const detectObjections =
  async (
    conversation = {}
  ) => {
    const transcript =
      conversation.messages
        ?.map(
          (message) =>
            `${message.senderRole}: ${message.text}`
        )
        .join("\n") || "";

    const prompt = `
Identify customer objections.

Examples:

- Price
- Location
- Timing
- Size
- Financing
- None

Conversation:

${transcript}
`;

    const result =
      await callOpenAI({
        systemPrompt:
          AGENT_SYSTEM_PROMPT,

        messages:
          buildSinglePrompt(
            prompt
          ),

        temperature: 0.2,

        maxTokens: 180,
      });

    return {
      success:
        result.success,

      objections:
        result.content,

      error:
        result.error,
    };
  };

/* ============================================================
   PROPERTY RECOMMENDATION
============================================================ */

export const recommendProperties =
  async (
    lead = {},
    properties = []
  ) => {
    const prompt = `
Customer

Budget:
${lead.budget}

Location:
${lead.location}

Bedrooms:
${lead.bedrooms}

Property Type:
${lead.propertyType}

Intent:
${lead.intent}

Available Properties:

${JSON.stringify(
  properties,
  null,
  2
)}

Recommend the best matching properties.

Explain briefly why.
`;

    const result =
      await callOpenAI({
        systemPrompt:
          GENERAL_SYSTEM_PROMPT,

        messages:
          buildSinglePrompt(
            prompt
          ),

        temperature: 0.4,

        maxTokens: 400,
      });

    return {
      success:
        result.success,

      recommendations:
        result.content,

      error:
        result.error,
    };
  };

/* ============================================================
   EXPLAIN PROPERTY MATCH
============================================================ */

export const explainRecommendation =
  async (
    lead = {},
    property = {}
  ) => {
    const prompt = `
Explain why this property
matches the customer.

Customer

${JSON.stringify(
  lead,
  null,
  2
)}

Property

${JSON.stringify(
  property,
  null,
  2
)}

Keep the explanation under 100 words.
`;

    const result =
      await callOpenAI({
        systemPrompt:
          GENERAL_SYSTEM_PROMPT,

        messages:
          buildSinglePrompt(
            prompt
          ),

        temperature: 0.4,

        maxTokens: 180,
      });

    return {
      success:
        result.success,

      explanation:
        result.content,

      error:
        result.error,
    };
  };

/* ============================================================
   CONVERSATION INSIGHTS
============================================================ */

export const generateConversationInsights =
  async (
    conversation = {}
  ) => {
    const transcript =
      conversation.messages
        ?.map(
          (message) =>
            `${message.senderRole}: ${message.text}`
        )
        .join("\n") || "";

    const prompt = `
Analyze this conversation.

Return:

• Customer intent

• Lead quality

• Missing information

• Urgency

• Recommended action

Conversation:

${transcript}
`;

    const result =
      await callOpenAI({
        systemPrompt:
          AGENT_SYSTEM_PROMPT,

        messages:
          buildSinglePrompt(
            prompt
          ),

        temperature: 0.3,

        maxTokens: 350,
      });

    return {
      success:
        result.success,

      insights:
        result.content,

      error:
        result.error,
    };
  };

/* ============================================================
   QUALIFY LEAD
============================================================ */

export const qualifyLead =
  async (
    conversation = {}
  ) => {
    const transcript =
      conversation.messages
        ?.map(
          (message) =>
            `${message.senderRole}: ${message.text}`
        )
        .join("\n") || "";

    const prompt = `
Analyze this customer.

Determine:

- Qualification status
- Estimated budget
- Preferred location
- Bedrooms
- Property type
- Move date
- Customer intent
- Overall lead score (0-100)

For Customer intent use these canonical semantics:

"buy"
"rent"
"property_search"

Intent rules:

- Use "buy" ONLY when the customer explicitly wants to
  buy, purchase, own, or acquire a property.

- Use "rent" ONLY when the customer explicitly wants to
  rent, lease, or obtain a rental property.

- Use "property_search" when the customer is looking for
  a property but has not specified whether they want to
  rent or buy.

IMPORTANT:

"looking for a property to rent"
→ rent

"looking for a property to buy"
→ buy

"looking for a property"
→ property_search

Do not use "property_purchase" or "property_rental".
Use the canonical values above.

Conversation:

${transcript}
`;

    const result =
      await callOpenAI({
        systemPrompt:
          AGENT_SYSTEM_PROMPT,

        messages:
          buildSinglePrompt(
            prompt
          ),

        temperature: 0.2,

        maxTokens: 350,
      });

    return {
      success:
        result.success,

      qualification:
        result.content,

      error:
        result.error,
    };
  };

/* ============================================================
   EXTRACT LEAD INFORMATION
============================================================ */
/*
 * IMPORTANT
 * ------------------------------------------------------------
 * This function returns STRUCTURED DATA.
 *
 * The extracted intent follows the same canonical semantics
 * used by aiIngestionController.js:
 *
 *     rent
 *     buy
 *     property_search
 *
 * ------------------------------------------------------------
 *
 * Intent is NOT the same as buyingIntent.
 *
 * intent:
 *     What transaction the customer wants.
 *
 * buyingIntent:
 *     How strong the customer's interest appears.
 *
 * ============================================================
 */

export const extractLeadInformation =
  async (
    conversation = {}
  ) => {

    const transcript =
      conversation.messages
        ?.map(
          (message) =>
            `${message.senderRole}: ${message.text}`
        )
        .join("\n") || "";

    const prompt = `
Extract structured customer information
from the conversation below.

Return ONLY valid JSON.

Use exactly this structure:

{
  "name": "",
  "budget": null,
  "location": "",
  "bedrooms": null,
  "propertyType": "",
  "moveDate": "",
  "phone": "",
  "intent": "",
  "buyingIntent": "",
  "confidence": null
}

============================================================
INTENT SEMANTICS
============================================================

The "intent" field describes the customer's
PROPERTY TRANSACTION INTENT.

Use ONLY these canonical values:

"buy"
"rent"
"property_search"

------------------------------------------------------------
BUY
------------------------------------------------------------

Use "buy" when the customer explicitly indicates
they want to:

- buy
- purchase
- own
- acquire

Examples:

"I want to buy a house."
→ "buy"

"I'm looking to purchase a property."
→ "buy"

"I want to own a home."
→ "buy"

"I'm looking for a house to buy."
→ "buy"

------------------------------------------------------------
RENT
------------------------------------------------------------

Use "rent" when the customer explicitly indicates
they want to:

- rent
- lease
- let
- find a rental

Examples:

"I want to rent a house."
→ "rent"

"I'm looking to lease an apartment."
→ "rent"

"I'm looking for a house to rent."
→ "rent"

"I need a rental in Kilimani."
→ "rent"

------------------------------------------------------------
PROPERTY SEARCH
------------------------------------------------------------

Use "property_search" when the customer is searching
for a property but has NOT specified whether they want
to rent or buy.

Examples:

"I'm looking for a house."
→ "property_search"

"I need a 3 bedroom apartment."
→ "property_search"

"Can you help me find a property?"
→ "property_search"

"I'm searching for a house in Kilimani."
→ "property_search"

============================================================
CRITICAL PRIORITY RULE
============================================================

Explicit transaction intent ALWAYS overrides
generic search language.

For example:

"I'm looking for a house to rent."

The phrase "looking for" indicates a search, but
"to rent" explicitly defines the transaction.

Therefore:

intent = "rent"

NOT:

intent = "property_search"

Likewise:

"I'm looking for a house to buy."

Therefore:

intent = "buy"

NOT:

intent = "property_search"

Only use "property_search" when rent/buy intent
has not been explicitly stated.

============================================================
LEGACY INTENT NORMALIZATION
============================================================

If the conversation uses legacy terminology,
normalize it to the canonical values.

property_rental
property-rental
rental
lease

→ "rent"

property_purchase
property-purchase
purchase

→ "buy"

property_search
property-search

→ "property_search"

Do NOT return:

"property_rental"
"property_purchase"
"property-rental"
"property-purchase"

The final "intent" value must be one of:

"buy"
"rent"
"property_search"

============================================================
BUYING INTENT
============================================================

"buyingIntent" is NOT the same as "intent".

It describes the strength of the customer's
interest or likelihood to proceed.

For example:

intent:
"rent"

buyingIntent:
"High"

is valid because buyingIntent represents
interest strength, while intent represents
the transaction type.

If the customer is renting, buyingIntent can
still represent overall transaction interest.

Do not replace "rent" or "buy" with buyingIntent.

============================================================
CONFIDENCE
============================================================

"confidence" should be a number from 0 to 1 when
confidence can reasonably be estimated.

Use null when confidence cannot reasonably be determined.

============================================================
GENERAL EXTRACTION RULES
============================================================

- Do not invent information.
- Use null when a numeric value is unavailable.
- Use an empty string when text information is unavailable.
- Preserve information explicitly stated by the customer.
- If multiple messages provide information, use the
  conversation context.
- Do not infer rent merely because the customer mentions
  a monthly amount.
- Do not infer buy merely because the customer mentions
  investment.
- Explicit customer wording has priority over assumptions.

Conversation:

${transcript}
`;

    const result =
      await callOpenAI({
        systemPrompt:
          AGENT_SYSTEM_PROMPT,

        messages:
          buildSinglePrompt(
            prompt
          ),

        temperature: 0.1,

        maxTokens: 450,
      });

    if (!result.success) {
      return {
        success: false,

        extracted: null,

        error:
          result.error,
      };
    }

    const parsed =
      parseAIJson(
        result.content
      );

    if (!parsed) {
      return {
        success: false,

        extracted: null,

        error:
          "AI returned invalid structured lead information.",
      };
    }

    const extracted =
      normalizeExtractedLeadInformation(
        parsed
      );

    console.log(
      "[AIReplyService] Extracted lead information:",
      extracted
    );

    console.log(
      "[AIReplyService] Extracted intent:",
      extracted.intent
    );

    console.log(
      "[AIReplyService] Intent semantics:",
      {
        intent:
          extracted.intent,

        meaning:
          extracted.intent === "rent"
            ? "Explicit rental/lease intent"
            : extracted.intent === "buy"
              ? "Explicit purchase/ownership intent"
              : extracted.intent === "property_search"
                ? "Property search without explicit rent/buy intent"
                : "No transaction intent detected",
      }
    );

    return {
      success: true,

      extracted,

      // --------------------------------------------------------
      // Convenience property.
      //
      // This makes it very easy for a controller/service to do:
      //
      // const { intent } =
      //   await extractLeadInformation(conversation);
      //
      // --------------------------------------------------------

      intent:
        extracted.intent,

      error: undefined,
    };
  };

/* ============================================================
   DETECT BUYING INTENT
============================================================ */

export const detectBuyingIntent =
  async (
    conversation = {}
  ) => {
    const transcript =
      conversation.messages
        ?.map(
          (message) =>
            `${message.senderRole}: ${message.text}`
        )
        .join("\n") || "";

    const prompt = `
Determine the customer's buying intent.

Return one of:

- Very High
- High
- Medium
- Low

Explain briefly.

Conversation:

${transcript}
`;

    const result =
      await callOpenAI({
        systemPrompt:
          AGENT_SYSTEM_PROMPT,

        messages:
          buildSinglePrompt(
            prompt
          ),

        temperature: 0.2,

        maxTokens: 150,
      });

    return {
      success:
        result.success,

      buyingIntent:
        result.content,

      error:
        result.error,
    };
  };

/* ============================================================
   CALCULATE LEAD PRIORITY
============================================================ */

export const calculateLeadPriority =
  async (
    lead = {}
  ) => {
    const prompt = `
Customer

${JSON.stringify(
  lead,
  null,
  2
)}

Determine the CRM priority.

Return:

Priority:
Urgent
High
Medium
Low

Reason:
One sentence.
`;

    const result =
      await callOpenAI({
        systemPrompt:
          AGENT_SYSTEM_PROMPT,

        messages:
          buildSinglePrompt(
            prompt
          ),

        temperature: 0.2,

        maxTokens: 150,
      });

    return {
      success:
        result.success,

      priority:
        result.content,

      error:
        result.error,
    };
  };

/* ============================================================
   DEFAULT EXPORT
============================================================ */

export default {

  /* ---------- Conversation ---------- */

  generateReply,
  regenerateReply,
  generateSuggestions,
  summarizeConversation,

  /* ---------- Reply Utilities ---------- */

  improveReplyTone,
  translateReply,

  /* ---------- Agent Assistance ---------- */

  generateFollowUpMessage,
  generateCallPreparation,
  generateNextBestAction,

  /* ---------- Viewing Workflow ---------- */

  generateViewingConfirmation,
  generateViewingRejectionMessage,
  generateViewingReminder,
  generateViewingRescheduleMessage,
  generateViewingCancellationMessage,
  generatePostViewingMessage,

  /* ---------- CRM Intelligence ---------- */

  detectConversationSentiment,
  detectUrgency,
  detectObjections,
  generateConversationInsights,

  /* ---------- Property Intelligence ---------- */

  recommendProperties,
  explainRecommendation,

  /* ---------- Lead Intelligence ---------- */

  qualifyLead,
  extractLeadInformation,
  detectBuyingIntent,
  calculateLeadPriority,

  /* ---------- Shared Utilities ---------- */

  buildConversationHistory,

};