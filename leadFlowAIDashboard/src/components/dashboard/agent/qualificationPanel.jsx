/**
 * ==========================================================
 *
 * Displays AI lead qualification for the
 * currently selected customer.
 *
 * Used In
 * ----------------------------------------------------------
 * • Conversation Center
 * • Lead Details
 * • Agent Dashboard
 * • AI Assistant
 *
 * Backend
 * ----------------------------------------------------------
 * POST /api/ai/lead-qualification
 * GET  /api/leads/:id/qualification
 * PATCH /api/leads/:id/qualification
 *
 * ==========================================================
 */

import {

  Brain,

  Award,

  RotateCw,

  Loader2,

  AlertTriangle,

  UserCheck,

} from "lucide-react";

import useAISuggestions from "../../../hooks/useAISuggestions";

const QualificationPanel = ({

  lead,

  onUpdateLead,

  onScheduleViewing,

  onOpenConversation,

}) => {

  /*=========================================================
      AI DATA
  =========================================================*/

  const {

    loading,

    error,

    refreshAI,

    leadInsight,

  } = useAISuggestions();

  /*=========================================================
      EMPTY
  =========================================================*/

  if (!lead) {

    return (

      <aside
        className="
          rounded-3xl
          border
          border-slate-800
          bg-slate-900
          p-8
          shadow-xl
        "
      >

        <div className="text-center">

          <UserCheck
            className="
              mx-auto
              h-16
              w-16
              text-slate-600
            "
          />

          <h2
            className="
              mt-5
              text-xl
              font-bold
              text-white
            "
          >

            No Lead Selected

          </h2>

          <p
            className="
              mt-3
              text-sm
              leading-7
              text-slate-400
            "
          >

            Select a lead to view
            qualification analysis.

          </p>

        </div>

      </aside>

    );

  }

  /*=========================================================
      QUALIFICATION OBJECT
  =========================================================*/

  const qualification =
    lead.qualification ||
    leadInsight ||
    {};

  const qualificationScore =
    qualification.score ?? 0;

  const qualificationStatus =
    qualification.status ||
    "Unknown";

  const confidence =
    qualification.confidence ?? 0;

  /*=========================================================
      INTENT SEMANTICS
  =========================================================*/

  /**
   * ========================================================
   *
   * LEAD INTENT SEMANTICS
   *
   * --------------------------------------------------------
   *
   * lead.intent is the customer's TRANSACTION INTENT.
   *
   * rent
   * ----
   * Customer explicitly wants to rent / lease.
   *
   * buy
   * ---
   * Customer explicitly wants to buy / purchase / own.
   *
   * property_search
   * ---------------
   * Customer is searching for a property but has not
   * explicitly specified whether they want to rent or buy.
   *
   * IMPORTANT
   * --------------------------------------------------------
   *
   * Property criteria such as:
   *
   * • propertyType
   * • budget
   * • location
   * • bedrooms
   * • moveDate
   *
   * are SEARCH CRITERIA, not transaction intent.
   *
   * Do not interpret property_search as buy.
   *
   * ========================================================
   */

  const intentLabels = {

    rent: "Rent",

    buy: "Buy",

    property_search: "Property Search",

  };

  const rawLeadIntent =
    String(
      lead.intent || ""
    )
      .trim()
      .toLowerCase();

  const rawQualificationIntent =
    String(
      qualification.intent || ""
    )
      .trim()
      .toLowerCase();

  const normalizedIntent =
    intentLabels[rawLeadIntent]
      ? rawLeadIntent
      : intentLabels[rawQualificationIntent]
        ? rawQualificationIntent
        : "";

  const intentLabel =
    intentLabels[normalizedIntent] ||
    "Not Specified";

  /*=========================================================
      REFRESH
  =========================================================*/

  const handleRefresh = () => {

    refreshAI(
      lead.id
    );

  };

  /*=========================================================
      STATUS COLORS
  =========================================================*/

  const statusColor = (() => {

    switch (qualificationStatus) {

      case "Qualified":

        return "bg-emerald-500/10 text-emerald-300 border-emerald-500/20";

      case "Needs Follow-up":

        return "bg-amber-500/10 text-amber-300 border-amber-500/20";

      case "Missing Information":

        return "bg-blue-500/10 text-blue-300 border-blue-500/20";

      case "Not Qualified":

        return "bg-red-500/10 text-red-300 border-red-500/20";

      default:

        return "bg-slate-800 text-slate-300 border-slate-700";

    }

  })();

  /*=========================================================
      AI RECOMMENDATION
  =========================================================*/

  const defaultRecommendation = (() => {

    switch (normalizedIntent) {

      case "rent":

        return "This lead is interested in renting property. Continue matching suitable rental properties with the customer's budget, location, property type, and other requirements, then schedule a viewing when appropriate.";

      case "buy":

        return "This lead is interested in buying property. Continue matching suitable properties with the customer's budget, location, property type, and other requirements, then schedule a viewing when appropriate.";

      case "property_search":

        return "This lead is actively searching for a property, but the rent-or-buy preference has not been specified. Continue gathering the customer's transaction intent while matching properties against the available search criteria.";

      default:

        return "Continue gathering the customer's property requirements and transaction intent before making a recommendation. Use the confirmed budget, location, property type, bedrooms, and timeline to guide property matching.";

    }

  })();

  /*=========================================================
      COMPONENT
  =========================================================*/

  return (

    <aside
      className="
        overflow-hidden
        rounded-3xl
        border
        border-slate-800
        bg-slate-900
        shadow-xl
      "
    >

      {/*=====================================================
          HEADER
      =====================================================*/}

      <div
        className="
          flex
          items-center
          justify-between
          border-b
          border-slate-800
          bg-gradient-to-r
          from-cyan-600/10
          to-blue-600/10
          p-6
        "
      >

        <div
          className="
            flex
            items-center
            gap-4
          "
        >

          <div
            className="
              flex
              h-12
              w-12
              items-center
              justify-center
              rounded-2xl
              bg-cyan-500/10
            "
          >

            <Brain
              className="
                h-6
                w-6
                text-cyan-400
              "
            />

          </div>

          <div>

            <h2
              className="
                text-xl
                font-bold
                text-white
              "
            >

              Lead Qualification

            </h2>

            <p
              className="
                text-sm
                text-slate-400
              "
            >

              AI qualification analysis

            </p>

          </div>

        </div>

        <button
          onClick={handleRefresh}
          disabled={loading}
          className="
            rounded-xl
            border
            border-slate-700
            bg-slate-800
            p-3
            transition
            hover:border-cyan-500/40
            hover:bg-slate-700
            disabled:cursor-not-allowed
            disabled:opacity-50
          "
        >

          {loading ? (

            <Loader2
              className="
                h-5
                w-5
                animate-spin
                text-cyan-400
              "
            />

          ) : (

            <RotateCw
              className="
                h-5
                w-5
                text-cyan-400
              "
            />

          )}

        </button>

      </div>

      {/*=====================================================
          ERROR
      =====================================================*/}

      {error && (

        <div
          className="
            m-6
            flex
            items-start
            gap-3
            rounded-2xl
            border
            border-red-500/20
            bg-red-500/10
            p-4
          "
        >

          <AlertTriangle
            className="
              mt-0.5
              h-5
              w-5
              text-red-400
            "
          />

          <p
            className="
              text-sm
              text-red-300
            "
          >

            {error}

          </p>

        </div>

      )}

      {/*=====================================================
          LOADING
      =====================================================*/}

      {loading && (

        <div className="space-y-5 p-6">

          {[1, 2, 3].map((item) => (

            <div
              key={item}
              className="
                h-28
                animate-pulse
                rounded-2xl
                bg-slate-800
              "
            />

          ))}

        </div>

      )}

      {/*=====================================================
          QUALIFICATION SCORE
      =====================================================*/}

      {!loading && (

        <div className="p-8">

          <div
            className="
              rounded-3xl
              border
              border-cyan-500/20
              bg-cyan-500/5
              p-8
            "
          >

            <div
              className="
                flex
                items-center
                justify-between
                gap-6
                flex-wrap
              "
            >

              <div>

                <p
                  className="
                    text-xs
                    uppercase
                    tracking-wide
                    text-cyan-300
                  "
                >

                  Qualification Score

                </p>

                <h2
                  className="
                    mt-2
                    text-5xl
                    font-bold
                    text-cyan-400
                  "
                >

                  {qualificationScore}

                </h2>

                <p
                  className="
                    mt-2
                    text-sm
                    text-slate-400
                  "
                >

                  /100

                </p>

              </div>

              <div
                className={`
                  rounded-full
                  border
                  px-5
                  py-3
                  text-sm
                  font-bold
                  ${statusColor}
                `}
              >

                {qualificationStatus}

              </div>

            </div>

            {/* Progress */}

            <div
              className="
                mt-8
                h-3
                overflow-hidden
                rounded-full
                bg-slate-800
              "
            >

              <div
                className="
                  h-full
                  rounded-full
                  bg-cyan-500
                  transition-all
                  duration-700
                "
                style={{
                  width: `${qualificationScore}%`,
                }}
              />

            </div>

            {/* Confidence */}

            <div
              className="
                mt-6
                flex
                items-center
                gap-3
              "
            >

              <Award
                className="
                  h-5
                  w-5
                  text-emerald-400
                "
              />

              <span
                className="
                  text-sm
                  text-slate-300
                "
              >

                AI Confidence

              </span>

              <span
                className="
                  rounded-full
                  bg-emerald-500/10
                  px-3
                  py-1
                  text-xs
                  font-bold
                  text-emerald-300
                "
              >

                {confidence}%

              </span>

            </div>

          </div>

        </div>

      )}

      {/*=====================================================
          QUALIFICATION DETAILS
      =====================================================*/}

      {!loading && (

        <div
          className="
            border-t
            border-slate-800
            p-8
          "
        >

          <h3
            className="
              text-xl
              font-semibold
              text-white
            "
          >

            Qualification Details

          </h3>

          <div
            className="
              mt-6
              grid
              gap-5
              md:grid-cols-2
              xl:grid-cols-3
            "
          >

            {/* Budget */}

            <div
              className="
                rounded-2xl
                border
                border-slate-800
                bg-slate-950/40
                p-5
              "
            >

              <p
                className="
                  text-xs
                  uppercase
                  tracking-wide
                  text-slate-500
                "
              >

                Budget

              </p>

              <p
                className="
                  mt-2
                  text-lg
                  font-semibold
                  text-cyan-400
                "
              >

                {qualification.budget ||
                  lead.budget ||
                  "Not Confirmed"}

              </p>

            </div>

            {/* Property Type */}

            <div
              className="
                rounded-2xl
                border
                border-slate-800
                bg-slate-950/40
                p-5
              "
            >

              <p
                className="
                  text-xs
                  uppercase
                  tracking-wide
                  text-slate-500
                "
              >

                Property Type

              </p>

              <p
                className="
                  mt-2
                  text-lg
                  font-semibold
                  text-white
                "
              >

                {qualification.propertyType ||
                  lead.propertyType ||
                  "Unknown"}

              </p>

            </div>

            {/* Preferred Location */}

            <div
              className="
                rounded-2xl
                border
                border-slate-800
                bg-slate-950/40
                p-5
              "
            >

              <p
                className="
                  text-xs
                  uppercase
                  tracking-wide
                  text-slate-500
                "
              >

                Preferred Location

              </p>

              <p
                className="
                  mt-2
                  text-lg
                  font-semibold
                  text-white
                "
              >

                {qualification.location ||
                  lead.location ||
                  "Unknown"}

              </p>

            </div>

            {/* Timeline */}

            <div
              className="
                rounded-2xl
                border
                border-slate-800
                bg-slate-950/40
                p-5
              "
            >

              <p
                className="
                  text-xs
                  uppercase
                  tracking-wide
                  text-slate-500
                "
              >

                Property Timeline

              </p>

              <p
                className="
                  mt-2
                  text-lg
                  font-semibold
                  text-white
                "
              >

                {qualification.timeline ||
                  lead.timeline ||
                  "Unknown"}

              </p>

            </div>

            {/* Financing */}

            <div
              className="
                rounded-2xl
                border
                border-slate-800
                bg-slate-950/40
                p-5
              "
            >

              <p
                className="
                  text-xs
                  uppercase
                  tracking-wide
                  text-slate-500
                "
              >

                Financing

              </p>

              <p
                className="
                  mt-2
                  text-lg
                  font-semibold
                  text-white
                "
              >

                {qualification.financing ||
                  "Unknown"}

              </p>

            </div>

            {/* Transaction Intent */}

            <div
              className="
                rounded-2xl
                border
                border-emerald-500/20
                bg-emerald-500/5
                p-5
              "
            >

              <p
                className="
                  text-xs
                  uppercase
                  tracking-wide
                  text-emerald-300
                "
              >

                Transaction Intent

              </p>

              <p
                className="
                  mt-2
                  text-lg
                  font-semibold
                  text-white
                "
              >

                {intentLabel}

              </p>

            </div>

          </div>

        </div>

      )}

      {/*=====================================================
          QUALIFICATION SUMMARY
      =====================================================*/}

      {!loading && (

        <div
          className="
            border-t
            border-slate-800
            p-8
          "
        >

          <h3
            className="
              text-xl
              font-semibold
              text-white
            "
          >

            Qualification Summary

          </h3>

          <div
            className="
              mt-6
              rounded-2xl
              border
              border-slate-800
              bg-slate-950/40
              p-6
            "
          >

            <div
              className="
                grid
                gap-5
                md:grid-cols-2
              "
            >

              <div>

                <p
                  className="
                    text-xs
                    uppercase
                    tracking-wide
                    text-slate-500
                  "
                >

                  Lead Category

                </p>

                <p
                  className="
                    mt-2
                    text-lg
                    font-semibold
                    text-white
                  "
                >

                  {qualification.category ||
                    "Standard"}

                </p>

              </div>

              <div>

                <p
                  className="
                    text-xs
                    uppercase
                    tracking-wide
                    text-slate-500
                  "
                >

                  Recommended Priority

                </p>

                <p
                  className="
                    mt-2
                    text-lg
                    font-semibold
                    text-cyan-400
                  "
                >

                  {qualification.priority ||
                    lead.priority ||
                    "Medium"}

                </p>

              </div>

            </div>

          </div>

        </div>

      )}

      {/*=====================================================
          MISSING INFORMATION
      =====================================================*/}

      {!loading && (

        <div
          className="
            border-t
            border-slate-800
            p-8
          "
        >

          <h3
            className="
              text-xl
              font-semibold
              text-white
            "
          >

            Missing Information

          </h3>

          <div
            className="
              mt-6
              rounded-2xl
              border
              border-slate-800
              bg-slate-950/40
              p-6
            "
          >

            {qualification.missingInformation?.length ? (

              <ul className="space-y-4">

                {qualification.missingInformation.map(

                  (item, index) => (

                    <li
                      key={index}
                      className="
                        flex
                        items-center
                        gap-3
                      "
                    >

                      <div
                        className="
                          h-5
                          w-5
                          rounded-md
                          border
                          border-amber-500
                          bg-amber-500/10
                        "
                      />

                      <span
                        className="
                          text-sm
                          text-slate-300
                        "
                      >

                        {item}

                      </span>

                    </li>

                  )

                )}

              </ul>

            ) : (

              <div
                className="
                  rounded-xl
                  bg-emerald-500/10
                  p-5
                  text-center
                "
              >

                <p
                  className="
                    font-semibold
                    text-emerald-300
                  "
                >

                  ✓ Qualification Complete

                </p>

                <p
                  className="
                    mt-2
                    text-sm
                    text-slate-300
                  "
                >

                  AI has all information required
                  to qualify this lead.

                </p>

              </div>

            )}

          </div>

        </div>

      )}

      {/*=====================================================
          AI RECOMMENDATION
      =====================================================*/}

      {!loading && (

        <div
          className="
            border-t
            border-slate-800
            p-8
          "
        >

          <h3
            className="
              text-xl
              font-semibold
              text-white
            "
          >

            AI Recommendation

          </h3>

          <div
            className="
              mt-6
              rounded-3xl
              border
              border-cyan-500/20
              bg-cyan-500/5
              p-6
            "
          >

            <div
              className="
                flex
                items-center
                gap-3
              "
            >

              <Brain
                className="
                  h-6
                  w-6
                  text-cyan-400
                "
              />

              <h4
                className="
                  text-lg
                  font-semibold
                  text-cyan-300
                "
              >

                AI Insight

              </h4>

            </div>

            <p
              className="
                mt-5
                text-sm
                leading-8
                text-slate-300
              "
            >

              {qualification.recommendation ||
                defaultRecommendation}

            </p>

          </div>

        </div>

      )}

      {/*=====================================================
          ACTION BUTTONS
      =====================================================*/}

      {!loading && (

        <div
          className="
            border-t
            border-slate-800
            p-8
          "
        >

          <div
            className="
              grid
              gap-4
              md:grid-cols-2
            "
          >

            <button
              onClick={() =>
                onUpdateLead?.(lead)
              }
              className="
                rounded-xl
                bg-cyan-500
                px-5
                py-3
                text-sm
                font-semibold
                text-slate-950
                transition
                hover:bg-cyan-400
              "
            >

              Update Lead

            </button>

            <button
              onClick={() =>
                onScheduleViewing?.(lead)
              }
              className="
                rounded-xl
                bg-amber-500
                px-5
                py-3
                text-sm
                font-semibold
                text-slate-950
                transition
                hover:bg-amber-400
              "
            >

              Schedule Viewing

            </button>

            <button
              onClick={() =>
                onOpenConversation?.(lead)
              }
              className="
                rounded-xl
                border
                border-slate-700
                bg-slate-800
                px-5
                py-3
                text-sm
                font-semibold
                text-white
                transition
                hover:bg-slate-700
              "
            >

              Open Conversation

            </button>

            <button
              onClick={handleRefresh}
              className="
                rounded-xl
                border
                border-cyan-500/30
                bg-cyan-500/10
                px-5
                py-3
                text-sm
                font-semibold
                text-cyan-300
                transition
                hover:bg-cyan-500
                hover:text-slate-950
              "
            >

              Refresh Qualification

            </button>

          </div>

        </div>

      )}

      {/*=====================================================
          FOOTER
      =====================================================*/}

      <div
        className="
          border-t
          border-slate-800
          bg-slate-950/40
          p-6
        "
      >

        <div
          className="
            flex
            flex-col
            gap-3
            text-sm
            text-slate-500
            md:flex-row
            md:items-center
            md:justify-between
          "
        >

          <p>

            LeadFlow AI Qualification Engine

          </p>

          <p>

            Lead ID{" "}

            <span className="font-semibold">

              #{lead.id}

            </span>

          </p>

        </div>

      </div>

    </aside>

  );

};

export default QualificationPanel;