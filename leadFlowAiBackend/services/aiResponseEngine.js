/**
 * ==========================================================
 *
 * CONVERSATIONAL QUALIFICATION ENGINE
 *
 * LeadFlow AI
 *
 * ==========================================================
 *
 * Responsibilities:
 *
 * ✓ No repeated questions
 * ✓ Fully progressive profiling
 * ✓ Deterministic conversation flow
 * ✓ CRM-grade AI behavior
 * ✓ State-driven responses
 * ✓ Explicit qualification completion
 * ✓ Safe missing-field normalization
 *
 * IMPORTANT
 * ----------------------------------------------------------
 *
 * conversationStateEngine.js returns:
 *
 * {
 *   stage,
 *   complete,
 *   missingFields,
 *   missingFieldsArray,
 *   nextStep,
 *   summary
 * }
 *
 * This engine therefore uses an EFFECTIVE STATE rather
 * than assuming missingFields is always an object.
 *
 * ==========================================================
 */

import {
  getNextQuestion,
  getMissingFields,
  detectConversationStage,
} from "./conversationContextService.js";

/* ==========================================================
   NORMALIZE MISSING FIELDS
========================================================== */

/**
 * Supports BOTH formats:
 *
 * Array:
 *
 * [
 *   "budget",
 *   "bedrooms"
 * ]
 *
 * Object:
 *
 * {
 *   location: false,
 *   budget: true,
 *   bedrooms: true,
 *   moveDate: false,
 *   phone: false
 * }
 *
 * Always returns a normalized object.
 */
const normalizeMissingFields = (
  missingFields,
  lead
) => {

  /* --------------------------------------------------------
     ARRAY FORMAT
     -------------------------------------------------------- */

  if (
    Array.isArray(
      missingFields
    )
  ) {

    return {

      location:
        missingFields.includes(
          "location"
        ),

      budget:
        missingFields.includes(
          "budget"
        ),

      bedrooms:
        missingFields.includes(
          "bedrooms"
        ),

      moveDate:
        missingFields.includes(
          "moveDate"
        ) ||
        missingFields.includes(
          "move date"
        ),

      phone:
        missingFields.includes(
          "phone"
        ),

    };
  }

  /* --------------------------------------------------------
     OBJECT FORMAT
     -------------------------------------------------------- */

  if (
    missingFields &&
    typeof missingFields ===
      "object"
  ) {

    return {

      location:
        Boolean(
          missingFields.location
        ),

      budget:
        Boolean(
          missingFields.budget
        ),

      bedrooms:
        Boolean(
          missingFields.bedrooms
        ),

      moveDate:
        Boolean(
          missingFields.moveDate
        ) ||
        Boolean(
          missingFields["move date"]
        ),

      phone:
        Boolean(
          missingFields.phone
        ),

    };
  }

  /* --------------------------------------------------------
     FALLBACK
     
     If no state was supplied, derive it directly from
     the lead so the response engine does not accidentally
     treat a qualified lead as a first-contact conversation.
     -------------------------------------------------------- */

  const derivedMissing =
    getMissingFields(
      lead
    );

  return {

    location:
      derivedMissing.includes(
        "location"
      ),

    budget:
      derivedMissing.includes(
        "budget"
      ),

    bedrooms:
      derivedMissing.includes(
        "bedrooms"
      ),

    moveDate:
      derivedMissing.includes(
        "moveDate"
      ),

    phone:
      derivedMissing.includes(
        "phone"
      ),

  };
};

/* ==========================================================
   CALCULATE COMPLETION
========================================================== */

const isMissingFieldsComplete = (
  missingFields
) => {

  return !Object.values(
    missingFields
  ).some(
    (value) =>
      value === true
  );
};

/* ==========================================================
   MAIN RESPONSE ENGINE
========================================================== */

export const generateAIResponse = (
  lead,
  aiResult,
  conversationContext = {},
  state = {}
) => {

  const totalMessages =
    conversationContext?.messages
      ?.length || 0;

  console.log(
    "================================================"
  );

  console.log(
    "🤖 AI RESPONSE ENGINE"
  );

  console.log(
    "================================================"
  );

  console.log(
    "Lead:",
    lead
  );

  console.log(
    "AI Result:",
    aiResult
  );

  console.log(
    "Incoming state:",
    state
  );

  /* ========================================================
     EFFECTIVE STATE
     
     The response engine must NEVER rely blindly on one
     representation of missingFields.
     ======================================================== */

  const normalizedMissingFields =
    normalizeMissingFields(
      state?.missingFields,
      lead
    );

  const derivedComplete =
    isMissingFieldsComplete(
      normalizedMissingFields
    );

  const derivedStage =
    state?.stage ||
    (
      derivedComplete
        ? "qualified"
        : detectConversationStage(
            lead
          )
    );

  const effectiveComplete =
    state?.complete === true ||
    (
      !Object.prototype.hasOwnProperty.call(
        state || {},
        "complete"
      ) &&
      derivedComplete
    ) ||
    (
      derivedStage ===
        "qualified" &&
      derivedComplete
    );

  const effectiveState = {

    ...state,

    stage:
      derivedStage,

    complete:
      effectiveComplete,

    missingFields:
      normalizedMissingFields,

  };

  console.log(
    "🧠 EFFECTIVE CONVERSATION STATE:",
    effectiveState
  );

  /* ========================================================
     SAFETY FALLBACK
     
     Only use this when there is genuinely no usable state.
     ======================================================== */

  if (
    !state ||
    typeof state !== "object"
  ) {

    console.warn(
      "⚠️ No conversation state supplied."
    );

    /*
     * Even without state, derive qualification directly
     * from the lead before returning generic text.
     */

    if (
      derivedComplete
    ) {

      console.log(
        "✅ Lead is already fully qualified despite missing state."
      );

    } else {

      return `
Hi 👋

Thanks for reaching out.

What kind of property are you looking for?
`;
    }
  }

  /* ========================================================
     QUALIFICATION COMPLETE
     
     IMPORTANT:
     This MUST happen BEFORE the first-contact check.
     
     Otherwise a fully qualified lead with only one message
     could incorrectly receive the generic greeting.
     ======================================================== */

  if (
    effectiveState.complete === true &&
    effectiveState.stage ===
      "qualified"
  ) {

    console.log(
      "🎯 QUALIFICATION COMPLETE — qualified response selected."
    );

    /* ------------------------------------------------------
       HOT LEAD
       ------------------------------------------------------ */

    if (
      Number(
        lead?.score || 0
      ) >= 70
    ) {

      return `
🔥 Excellent!

You're now a high-priority lead.

Summary:

📍 Location: ${lead?.location || "Not specified"}
💰 Budget: KES ${lead?.budget || "Not specified"}
🏠 Bedrooms: ${lead?.bedrooms || "Not specified"}
📅 Move Date: ${lead?.moveDate || "Not specified"}

An agent will contact you shortly.

Reply:

👉 CALL ME

for immediate assistance.
`;
    }

    /* ------------------------------------------------------
       QUALIFIED LEAD
       ------------------------------------------------------ */

    return `
✅ Thank you.

Your requirements have been captured successfully.

Summary:

📍 Location: ${lead?.location || "Not specified"}
💰 Budget: KES ${lead?.budget || "Not specified"}
🏠 Bedrooms: ${lead?.bedrooms || "Not specified"}
📅 Move Date: ${lead?.moveDate || "Not specified"}

An agent will review suitable properties and contact you shortly.
`;
  }

  /* ========================================================
     GREETING / FIRST CONTACT
     
     Only reached when qualification is NOT complete.
     ======================================================== */

  if (
    totalMessages <= 1
  ) {

    const nextQuestion =
      getNextQuestion(
        lead
      );

    console.log(
      "👋 FIRST CONTACT"
    );

    console.log(
      "❓ First qualification question:",
      nextQuestion
    );

    return `
Hi 👋

Thanks for contacting LeadFlow AI.

I'll help you find the right property.

👉 ${
      nextQuestion ||
      "What are you looking for?"
    }
`;
  }

  /* ========================================================
     STATE DRIVEN FLOW
     ======================================================== */

  const missing =
    effectiveState.missingFields;

  console.log(
    "🧠 NORMALIZED MISSING FIELDS:",
    missing
  );

  /* ========================================================
     STEP 1: LOCATION
     ======================================================== */

  if (
    missing.location
  ) {

    console.log(
      "➡️ Asking for LOCATION"
    );

    return `
Great 👍

Which area are you looking for?

Examples:
• Ruaka
• Ruiru
• Kiambu
• Nairobi CBD
`;
  }

  /* ========================================================
     STEP 2: BUDGET
     ======================================================== */

  if (
    missing.budget
  ) {

    console.log(
      "➡️ Asking for BUDGET"
    );

    return `
Perfect.

What budget range are you considering?

1. Below 30k
2. 30k - 60k
3. 60k - 100k
4. Above 100k
`;
  }

  /* ========================================================
     STEP 3: BEDROOMS
     ======================================================== */

  if (
    missing.bedrooms
  ) {

    console.log(
      "➡️ Asking for BEDROOMS"
    );

    return `
Got it 👍

How many bedrooms do you need?

1. Studio
2. 1 Bedroom
3. 2 Bedrooms
4. 3+ Bedrooms
`;
  }

  /* ========================================================
     STEP 4: MOVE DATE
     ======================================================== */

  if (
    missing.moveDate
  ) {

    console.log(
      "➡️ Asking for MOVE DATE"
    );

    return `
When would you like to move?

1. Immediately
2. This Week
3. Next Week
4. Next Month
`;
  }

  /* ========================================================
     STEP 5: PHONE NUMBER
     ======================================================== */

  if (
    missing.phone
  ) {

    console.log(
      "➡️ Asking for PHONE NUMBER"
    );

    return `
Almost done 👍

Could you share the best phone number
for viewing arrangements?
`;
  }

  /* ========================================================
     STATE/LEAD RECONCILIATION FALLBACK
     
     If all five qualification fields are actually present,
     do NOT send the generic "what are you looking for?"
     response.
     ======================================================== */

  const finalMissing =
    getMissingFields(
      lead
    );

  if (
    finalMissing.length === 0
  ) {

    console.log(
      "🎯 Final lead check confirms qualification is complete."
    );

    if (
      Number(
        lead?.score || 0
      ) >= 70
    ) {

      return `
🔥 Excellent!

You're now a high-priority lead.

Summary:

📍 Location: ${lead?.location || "Not specified"}
💰 Budget: KES ${lead?.budget || "Not specified"}
🏠 Bedrooms: ${lead?.bedrooms || "Not specified"}
📅 Move Date: ${lead?.moveDate || "Not specified"}

An agent will contact you shortly.

Reply:

👉 CALL ME

for immediate assistance.
`;
    }

    return `
✅ Thank you.

Your requirements have been captured successfully.

Summary:

📍 Location: ${lead?.location || "Not specified"}
💰 Budget: KES ${lead?.budget || "Not specified"}
🏠 Bedrooms: ${lead?.bedrooms || "Not specified"}
📅 Move Date: ${lead?.moveDate || "Not specified"}

An agent will review suitable properties and contact you shortly.
`;
  }

  /* ========================================================
     FINAL FALLBACK
     ======================================================== */

  console.log(
    "⚠️ Using final state-driven fallback."
  );

  return `
Thanks 👍

${
  getNextQuestion(
    lead
  ) ||
  "What else can I help you with?"
}
`;
};

/* ==========================================================
   DEFAULT EXPORT
========================================================== */

export default {
  generateAIResponse,
};