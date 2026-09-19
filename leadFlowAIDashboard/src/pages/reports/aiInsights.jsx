/**
 * Explains WHY LeadFlow AI qualified a lead.
 * 
 * This page provides transparency into the AI qualification 
 * process by displaying: 
 * 
 * • Qualification Score 
 * • Transaction Intent
 * • AI Buying Intent
 * • Urgency 
 * • Budget Confidence 
 * • Location Confidence 
 * • Missing Information 
 * • Recommended Next Action 
 * 
 * It helps agents understand the reasoning behind AI 
 * decisions before engaging the customer. 
 * 
 * ========================================================== 
 * 
 * Displays 
 * -------- 
 * • Overall AI Qualification Score 
 * • Customer Transaction Intent
 * • AI Buying Intent Rating
 * • Urgency Level 
 * • Budget Confidence 
 * • Location Confidence 
 * • Missing Information 
 * • AI Recommendation 
 * 
 * Future Enhancements 
 * ------------------- 
 * • Confidence graph 
 * • Timeline of qualification 
 * • AI reasoning explanation 
 * • Property match confidence 
 * • Lead quality prediction 
 * 
 * Purpose: 
 * 
 * "Explain why AI qualified this lead." 
 * ========================================================== 
 */ 
 
import {
  useNavigate,
  useParams,
} from "react-router-dom";

import useLeadDetails from "../../hooks/useLeadDetails"; 
 
/* ==========================================================
   TRANSACTION INTENT FORMATTER
========================================================== */

/**
 * LeadFlow AI canonical transaction intents:
 *
 * • rent
 * • buy
 * • property_search
 *
 * Transaction intent is different from AI buying-intent
 * scoring/ratings.
 */
const formatTransactionIntent = (intent) => {

  switch (
    String(intent || "")
      .trim()
      .toLowerCase()
  ) {

    case "rent":
    case "rental":
    case "lease":
    case "property_rental":
    case "property-rental":
      return "Rent";

    case "buy":
    case "purchase":
    case "property_purchase":
    case "property-purchase":
      return "Buy";

    case "property_search":
    case "property-search":
    case "search":
    case "looking_for_property":
    case "looking-for-property":
      return "Property Search";

    default:
      return "Not Specified";
  }
};

/* ==========================================================
   AI INSIGHTS
========================================================== */

const AIInsights = () => {

  const navigate =
    useNavigate();

  const { id } =
    useParams();

  const {
    lead,
    conversation,
    aiInsights,
    loading,
    error,
  } = useLeadDetails(id);

  /* ========================================================
     LOADING STATE
  ======================================================== */

  if (loading) {

    return (
      <div
        className="
          min-h-screen
          bg-slate-950
          flex
          items-center
          justify-center
          text-white
        "
      >
        Loading AI Insights...
      </div>
    );
  }

  /* ========================================================
     ERROR STATE
  ======================================================== */

  if (error) {

    return (
      <div
        className="
          min-h-screen
          bg-slate-950
          flex
          items-center
          justify-center
          text-red-400
        "
      >
        {error}
      </div>
    );
  }

  /* ========================================================
     LIVE AI INSIGHTS
     
     Received directly from GET /api/lead/:id
  ======================================================== */

  const score =
    aiInsights?.qualificationScore ?? 0;

  /**
   * --------------------------------------------------------
   * TRANSACTION INTENT
   * --------------------------------------------------------
   *
   * Customer's actual transaction intent comes from:
   *
   * 1. lead.intent
   * 2. conversation.summary.intent
   * 3. conversation.intent
   *
   * This is separate from aiInsights.buyingIntent.
   */
  const transactionIntent =
    formatTransactionIntent(
      lead?.intent ??
      conversation?.summary?.intent ??
      conversation?.intent
    );

  /**
   * --------------------------------------------------------
   * AI BUYING INTENT
   * --------------------------------------------------------
   *
   * This remains the AI-generated insight/rating.
   *
   * It is NOT used as lead.intent.
   */
  const buyingIntent =
    aiInsights?.buyingIntent ?? "N/A";

  const urgency =
    aiInsights?.urgency ?? "Unknown";

  const budgetConfidence =
    aiInsights?.budgetConfidence ?? 0;

  const locationConfidence =
    aiInsights?.locationConfidence ?? 0;

  const bedroomConfidence =
    aiInsights?.bedroomConfidence ?? 0;

  const moveDateConfidence =
    aiInsights?.moveDateConfidence ?? 0;

  const missing =
    aiInsights?.missingInformation ?? [];

  const recommendation =
    aiInsights?.recommendedAction ??
    "Continue qualification";

  /* ========================================================
     PAGE
  ======================================================== */

  return (
    <main
      className="
        min-h-screen
        bg-slate-950
        p-8
      "
    >

      <div
        className="
          mx-auto
          max-w-5xl
          space-y-8
        "
      >

        {/* ==================================================
            BACK BUTTON
        ================================================== */}

        <button
          type="button"
          onClick={() => navigate(-1)}
          className="
            rounded-lg
            border
            border-slate-700
            px-4
            py-2
            text-white
            hover:bg-slate-800
          "
        >
          ← Back
        </button>

        {/* ==================================================
            PAGE HEADER
        ================================================== */}

        <div>

          <h1
            className="
              text-3xl
              font-bold
              text-white
            "
          >
            🤖 AI Insights
          </h1>

          <p
            className="
              mt-2
              text-slate-400
            "
          >
            Understand why LeadFlow AI qualified
            this lead.
          </p>

        </div>

        {/* ==================================================
            AI INSIGHT CARDS
        ================================================== */}

        <div
          className="
            grid
            gap-6
            md:grid-cols-2
          "
        >

          {/* ==================================================
              QUALIFICATION SCORE
          ================================================== */}

          <div
            className="
              rounded-2xl
              bg-slate-900
              border
              border-slate-800
              p-6
            "
          >

            <p
              className="
                text-slate-400
                text-sm
              "
            >
              Qualification Score
            </p>

            <h2
              className="
                mt-3
                text-6xl
                font-bold
                text-cyan-400
              "
            >
              {score}
            </h2>

          </div>

          {/* ==================================================
              TRANSACTION INTENT
          ================================================== */}

          <div
            className="
              rounded-2xl
              bg-slate-900
              border
              border-slate-800
              p-6
            "
          >

            <p
              className="
                text-slate-400
                text-sm
              "
            >
              Transaction Intent
            </p>

            <h2
              className="
                mt-3
                text-3xl
                font-bold
                text-white
              "
            >
              {transactionIntent}
            </h2>

            <p
              className="
                mt-2
                text-sm
                text-slate-500
              "
            >
              Customer's stated property
              transaction intent.
            </p>

          </div>

          {/* ==================================================
              AI BUYING INTENT
          ================================================== */}

          <div
            className="
              rounded-2xl
              bg-slate-900
              border
              border-slate-800
              p-6
            "
          >

            <p
              className="
                text-slate-400
                text-sm
              "
            >
              AI Buying Intent
            </p>

            <h2
              className="
                mt-3
                text-3xl
              "
            >
              {buyingIntent}
            </h2>

            <p
              className="
                mt-2
                text-sm
                text-slate-500
              "
            >
              AI-generated intent insight;
              separate from transaction intent.
            </p>

          </div>

          {/* ==================================================
              URGENCY
          ================================================== */}

          <div
            className="
              rounded-2xl
              bg-slate-900
              border
              border-slate-800
              p-6
            "
          >

            <p
              className="
                text-slate-400
                text-sm
              "
            >
              Urgency
            </p>

            <h2
              className="
                mt-3
                text-3xl
                font-bold
                text-orange-400
              "
            >
              {urgency}
            </h2>

          </div>

          {/* ==================================================
              BUDGET CONFIDENCE
          ================================================== */}

          <div
            className="
              rounded-2xl
              bg-slate-900
              border
              border-slate-800
              p-6
            "
          >

            <p
              className="
                text-slate-400
                text-sm
              "
            >
              Budget Confidence
            </p>

            <h2
              className="
                mt-3
                text-3xl
                font-bold
                text-green-400
              "
            >
              {budgetConfidence}
            </h2>

          </div>

          {/* ==================================================
              LOCATION CONFIDENCE
          ================================================== */}

          <div
            className="
              rounded-2xl
              bg-slate-900
              border
              border-slate-800
              p-6
            "
          >

            <p
              className="
                text-slate-400
                text-sm
              "
            >
              Location Confidence
            </p>

            <h2
              className="
                mt-3
                text-3xl
                font-bold
                text-blue-400
              "
            >
              {locationConfidence}
            </h2>

          </div>

          {/* ==================================================
              MISSING INFORMATION
          ================================================== */}

          <div
            className="
              rounded-2xl
              bg-slate-900
              border
              border-slate-800
              p-6
            "
          >

            <p
              className="
                text-slate-400
                text-sm
              "
            >
              Missing Information
            </p>

            <h2
              className="
                mt-3
                text-xl
                font-semibold
                text-white
              "
            >
              {missing.length === 0
                ? "None"
                : missing.join(", ")}
            </h2>

          </div>

        </div>

        {/* ==================================================
            ADDITIONAL CONFIDENCE INFORMATION
        ================================================== */}

        <div
          className="
            rounded-2xl
            bg-slate-900
            border
            border-slate-800
            p-8
          "
        >

          <h2
            className="
              text-2xl
              font-bold
              text-white
            "
          >
            Qualification Confidence
          </h2>

          <div
            className="
              mt-6
              grid
              gap-6
              sm:grid-cols-2
            "
          >

            {/* BEDROOM CONFIDENCE */}

            <div
              className="
                rounded-xl
                border
                border-slate-800
                bg-slate-950
                p-5
              "
            >

              <p
                className="
                  text-sm
                  text-slate-400
                "
              >
                Bedroom Confidence
              </p>

              <p
                className="
                  mt-2
                  text-2xl
                  font-bold
                  text-white
                "
              >
                {bedroomConfidence}
              </p>

            </div>

            {/* MOVE DATE CONFIDENCE */}

            <div
              className="
                rounded-xl
                border
                border-slate-800
                bg-slate-950
                p-5
              "
            >

              <p
                className="
                  text-sm
                  text-slate-400
                "
              >
                Move Date Confidence
              </p>

              <p
                className="
                  mt-2
                  text-2xl
                  font-bold
                  text-white
                "
              >
                {moveDateConfidence}
              </p>

            </div>

          </div>

        </div>

        {/* ==================================================
            RECOMMENDED ACTION
        ================================================== */}

        <div
          className="
            rounded-2xl
            bg-slate-900
            border
            border-slate-800
            p-8
          "
        >

          <h2
            className="
              text-2xl
              font-bold
              text-white
            "
          >
            Recommended Action
          </h2>

          <div
            className="
              mt-6
              rounded-xl
              bg-cyan-500/10
              border
              border-cyan-500/30
              p-6
            "
          >

            <p
              className="
                text-3xl
                font-bold
                text-cyan-300
              "
            >
              {recommendation}
            </p>

            <p
              className="
                mt-3
                text-slate-300
              "
            >
              AI recommendation based on
              qualification score, urgency,
              completeness of customer information,
              transaction intent, and AI
              qualification signals.
            </p>

          </div>

        </div>

      </div>

    </main>
  );
};

export default AIInsights;