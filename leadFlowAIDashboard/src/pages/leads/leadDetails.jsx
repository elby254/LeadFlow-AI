/**
 * ==========================================================
 *
 * Purpose
 * -------
 * Displays the complete 360° profile of a single customer.
 *
 * This is the primary Agent CRM workspace after a lead enters
 * the LeadFlow AI pipeline.
 *
 * Responsibilities
 * ----------------
 * • Customer profile
 * • Lead qualification
 * • AI score
 * • AI confidence
 * • Lead status
 * • Transaction intent
 * • Budget
 * • Location
 * • Bedrooms
 * • Move date
 * • Conversation history
 * • Agent notes
 * • Call history
 * • Follow-up information
 * • Property recommendations
 * • Agent workflow actions
 *
 * Agent Workflow
 * --------------
 * Lead
 *   ↓
 * AI Qualification
 *   ↓
 * Agent Review
 *   ↓
 * Contact Customer
 *   ↓
 * Follow-up
 *   ↓
 * Property Recommendation
 *   ↓
 * Viewing
 *   ↓
 * Negotiation
 *   ↓
 * Won / Lost
 *
 * ==========================================================
 */

import { useMemo } from "react";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

import {
  ArrowLeft,
  Brain,
  Calendar,
  CheckCircle2,
  Clock3,
  MapPin,
  Phone,
  Target,
  User,
} from "lucide-react";

import LeadHeader from "../../components/lead/leadHeader";
import LeadInfoCard from "../../components/lead/leadInfoCard";
import ConversationHistory from "../../components/lead/conversationHistory";
import FollowUpNotes from "../../components/lead/followUpNotes";
import FollowUpActions from "../../components/lead/followUpActions";
import LeadActions from "../../components/lead/leadActions";
import PropertyRecommendations from "../../components/lead/propertyRecommendations";

import useLeadDetails from "../../hooks/useLeadDetails";

/* ==========================================================
   HELPERS
========================================================== */

/**
 * Safely convert a value into a percentage number.
 */
const normalizePercentage = (value) => {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return 0;
  }

  return Math.max(
    0,
    Math.min(100, number)
  );
};

/**
 * Normalize backend status values.
 *
 * The current LeadFlow AI backend uses lowercase workflow
 * statuses while some older frontend components displayed
 * title-case values.
 *
 * IMPORTANT
 * ---------
 * These values must correspond to the Lead.status enum:
 *
 * • new
 * • contacted
 * • qualified
 * • viewing
 * • negotiation
 * • won
 * • lost
 */
const formatStatus = (status) => {
  if (!status) {
    return "Pending";
  }

  return String(status)
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase()
    );
};

/**
 * Returns the appropriate status styling.
 *
 * IMPORTANT
 * ---------
 * "hot", "follow_up", "viewing_scheduled" and "closed"
 * are NOT Lead.status values.
 *
 * Hot is determined from the lead score.
 * Follow-up has its own followUpStatus field.
 * Viewing has its own viewingStatus field.
 * Won/Lost are the terminal Lead.status values.
 */
const getStatusClasses = (status) => {
  switch (String(status).toLowerCase()) {
    case "new":
      return "bg-blue-500/20 text-blue-400 border-blue-500/30";

    case "contacted":
      return "bg-cyan-500/20 text-cyan-400 border-cyan-500/30";

    case "qualified":
      return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";

    case "viewing":
      return "bg-violet-500/20 text-violet-400 border-violet-500/30";

    case "negotiation":
      return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";

    case "won":
      return "bg-cyan-500/20 text-cyan-400 border-cyan-500/30";

    case "lost":
      return "bg-red-500/20 text-red-400 border-red-500/30";

    default:
      return "bg-slate-700/40 text-slate-300 border-slate-700";
  }
};

/**
 * Normalize the customer's transaction intent.
 *
 * Canonical LeadFlow AI intent values:
 *
 * • rent
 * • buy
 * • property_search
 *
 * "property_search" means the customer is searching for
 * a property but has not explicitly stated whether they
 * want to rent or buy.
 *
 * Property type, budget, location, bedrooms and move date
 * remain search criteria and are NOT transaction intent.
 */
const formatIntent = (intent) => {
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
   CONFIDENCE BAR
========================================================== */

const ConfidenceBar = ({
  label,
  value,
  icon,
}) => {
  const percentage = normalizePercentage(value);

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-sm text-slate-400">
          {icon}
          <span>{label}</span>
        </div>

        <span className="font-semibold text-white">
          {percentage}%
        </span>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-slate-800">
        <div
          className="
            h-full
            rounded-full
            bg-cyan-500
            transition-all
            duration-500
          "
          style={{
            width: `${percentage}%`,
          }}
        />
      </div>
    </div>
  );
};

/* ==========================================================
   PAGE
========================================================== */

const LeadDetails = () => {
  const navigate = useNavigate();

  const { id } = useParams();

  const {
    lead,
    conversation,
    loading,
    error,
    refreshLead,
  } = useLeadDetails(id);

  /* ========================================================
     NORMALIZED AI DATA
  ======================================================== */

  const aiData = useMemo(() => {
    if (!lead) {
      return {};
    }

    const insights =
      lead.aiInsights || {};

    return {
      score:
        lead.score ??
        insights.score ??
        0,

      /*
       * Legacy AI buyingIntent is retained for compatibility.
       *
       * It is NOT used as the customer's transaction intent.
       * The customer's actual transaction intent is lead.intent.
       */
      buyingIntent:
        lead.buyingIntent ??
        insights.buyingIntent ??
        0,

      /*
       * Canonical customer transaction intent.
       *
       * Priority:
       * 1. lead.intent
       * 2. conversation.summary.intent
       * 3. conversation.intent
       *
       * This keeps conversation memory synchronized with
       * the authoritative Lead intent.
       */
      intent:
        lead.intent ??
        conversation?.summary?.intent ??
        conversation?.intent ??
        "",

      budgetConfidence:
        lead.budgetConfidence ??
        insights.budgetConfidence ??
        0,

      locationConfidence:
        lead.locationConfidence ??
        insights.locationConfidence ??
        0,

      bedroomConfidence:
        lead.bedroomConfidence ??
        insights.bedroomConfidence ??
        0,

      moveDateConfidence:
        lead.moveDateConfidence ??
        insights.moveDateConfidence ??
        0,

      urgency:
        lead.urgency ??
        insights.urgency ??
        "Low",

      recommendedAction:
        lead.recommendedAction ??
        insights.recommendedAction ??
        "",

      missingInformation:
        lead.missingInformation ??
        insights.missingInformation ??
        [],
    };
  }, [lead, conversation]);

  /* ========================================================
     SAFE STATUS
  ======================================================== */

  const status = lead?.status || "new";

  /* ========================================================
     TRANSACTION INTENT
  ======================================================== */

  const transactionIntent = formatIntent(
    aiData.intent
  );

  /* ========================================================
     HOT LEAD
  ======================================================== */

  /*
   * "hot" is a scoring category, not a Lead.status.
   *
   * Keep it derived from the score instead of inserting
   * "hot" into the Lead workflow.
   */
  const isHotLead =
    Number(aiData.score) >= 70;

  /* ========================================================
     LOADING
  ======================================================== */

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 p-8">
        <div className="mx-auto flex min-h-[60vh] max-w-7xl items-center justify-center">
          <div className="text-center">

            <div
              className="
                mx-auto
                mb-4
                h-10
                w-10
                animate-spin
                rounded-full
                border-4
                border-slate-700
                border-t-cyan-400
              "
            />

            <p className="text-lg font-medium text-white">
              Loading Lead...
            </p>

            <p className="mt-2 text-sm text-slate-500">
              Preparing the customer workspace.
            </p>

          </div>
        </div>
      </main>
    );
  }

  /* ========================================================
     ERROR
  ======================================================== */

  if (error) {
    return (
      <main className="min-h-screen bg-slate-950 p-8">
        <div className="mx-auto max-w-7xl">

          <button
            onClick={() => navigate(-1)}
            className="
              mb-8
              inline-flex
              items-center
              gap-2
              rounded-xl
              border
              border-slate-700
              bg-slate-900
              px-5
              py-3
              text-sm
              font-medium
              text-white
              transition
              hover:border-cyan-500
              hover:bg-slate-800
            "
          >
            <ArrowLeft size={18} />
            Back
          </button>

          <div
            className="
              rounded-3xl
              border
              border-red-500/30
              bg-red-500/10
              p-8
            "
          >
            <h2 className="text-xl font-bold text-red-400">
              Unable to Load Lead
            </h2>

            <p className="mt-3 text-slate-300">
              {error}
            </p>

            <button
              onClick={refreshLead}
              className="
                mt-6
                rounded-xl
                bg-red-500
                px-5
                py-3
                font-semibold
                text-white
                transition
                hover:bg-red-600
              "
            >
              Try Again
            </button>
          </div>

        </div>
      </main>
    );
  }

  /* ========================================================
     NO LEAD
  ======================================================== */

  if (!lead) {
    return (
      <main className="min-h-screen bg-slate-950 p-8">
        <div className="mx-auto max-w-7xl">

          <button
            onClick={() => navigate(-1)}
            className="
              inline-flex
              items-center
              gap-2
              rounded-xl
              border
              border-slate-700
              bg-slate-900
              px-5
              py-3
              text-sm
              font-medium
              text-white
              transition
              hover:border-cyan-500
            "
          >
            <ArrowLeft size={18} />
            Back
          </button>

          <div
            className="
              mt-8
              rounded-3xl
              border
              border-slate-800
              bg-slate-900
              p-10
              text-center
            "
          >
            <User
              size={42}
              className="mx-auto text-slate-600"
            />

            <h2 className="mt-4 text-2xl font-bold text-white">
              Lead Not Found
            </h2>

            <p className="mt-2 text-slate-400">
              This lead may have been removed or is no longer
              available to your organization.
            </p>
          </div>

        </div>
      </main>
    );
  }

  /* ========================================================
     MAIN
  ======================================================== */

  return (
    <main className="min-h-screen bg-slate-950 p-4 sm:p-6 lg:p-8">

      <div className="mx-auto max-w-7xl space-y-8">

        {/* ==================================================
            BACK NAVIGATION
        ================================================== */}

        <button
          onClick={() => navigate(-1)}
          className="
            inline-flex
            items-center
            gap-2
            rounded-xl
            border
            border-slate-700
            bg-slate-900
            px-5
            py-3
            text-sm
            font-medium
            text-white
            transition
            hover:border-cyan-500
            hover:bg-slate-800
          "
        >
          <ArrowLeft size={18} />
          Back
        </button>

        {/* ==================================================
            CUSTOMER HEADER
        ================================================== */}

        <LeadHeader
          lead={lead}
        />

        {/* ==================================================
            AGENT WORKFLOW ACTIONS
        ================================================== */}

        <section
          className="
            rounded-3xl
            border
            border-slate-800
            bg-slate-900
            p-6
            shadow-xl
          "
        >

          <div className="mb-5">

            <div className="flex items-center gap-3">

              <Target
                size={22}
                className="text-cyan-400"
              />

              <div>

                <h2 className="text-xl font-bold text-white">
                  Agent Workflow
                </h2>

                <p className="mt-1 text-sm text-slate-400">
                  Review, contact, follow up and move this lead
                  through the sales pipeline.
                </p>

              </div>

            </div>

          </div>

          <LeadActions
            lead={lead}
            refreshLead={refreshLead}
          />

        </section>

        {/* ==================================================
            CUSTOMER + AI SUMMARY
        ================================================== */}

        <section className="grid gap-6 xl:grid-cols-3">

          {/* =================================================
              CUSTOMER INFORMATION
          ================================================= */}

          <div className="xl:col-span-2">

            <LeadInfoCard
              lead={lead}
            />

          </div>

          {/* =================================================
              AI QUALIFICATION
          ================================================= */}

          <aside
            className="
              rounded-3xl
              border
              border-slate-800
              bg-slate-900
              p-6
              shadow-xl
            "
          >

            <div className="mb-6">

              <div className="flex items-center gap-3">

                <div
                  className="
                    flex
                    h-11
                    w-11
                    items-center
                    justify-center
                    rounded-xl
                    bg-violet-500/20
                  "
                >

                  <Brain
                    size={22}
                    className="text-violet-400"
                  />

                </div>

                <div>

                  <h2 className="text-xl font-bold text-white">
                    AI Qualification
                  </h2>

                  <p className="text-sm text-slate-400">
                    Lead intelligence
                  </p>

                </div>

              </div>

            </div>

            {/* =================================================
                AI SCORE
            ================================================= */}

            <div
              className="
                rounded-2xl
                border
                border-cyan-500/20
                bg-cyan-500/10
                p-6
                text-center
              "
            >

              <p className="text-sm text-slate-400">
                AI Lead Score
              </p>

              <h3
                className="
                  mt-2
                  text-5xl
                  font-black
                  text-cyan-400
                "
              >
                {Number(aiData.score) || 0}
              </h3>

              <p
                className="
                  mt-2
                  text-xs
                  uppercase
                  tracking-wider
                  text-slate-500
                "
              >
                Qualification Score
              </p>

              {/* HOT CATEGORY */}

              {isHotLead && (
                <div
                  className="
                    mt-4
                    inline-flex
                    rounded-full
                    bg-red-500/20
                    px-3
                    py-1
                    text-xs
                    font-semibold
                    text-red-400
                  "
                >
                  High-Priority Lead
                </div>
              )}

            </div>

            {/* =================================================
                STATUS
            ================================================= */}

            <div className="mt-6">

              <p className="mb-2 text-sm text-slate-400">
                Pipeline Status
              </p>

              <span
                className={`
                  inline-flex
                  items-center
                  gap-2
                  rounded-full
                  border
                  px-4
                  py-2
                  text-sm
                  font-semibold
                  ${getStatusClasses(status)}
                `}
              >

                {status === "won" ? (
                  <CheckCircle2 size={16} />
                ) : (
                  <Clock3 size={16} />
                )}

                {formatStatus(status)}

              </span>

            </div>

            {/* =================================================
                TRANSACTION INTENT
            ================================================= */}

            <div className="mt-6">

              <p className="mb-2 text-sm text-slate-400">
                Transaction Intent
              </p>

              <span
                className="
                  inline-flex
                  items-center
                  gap-2
                  rounded-full
                  border
                  border-cyan-500/30
                  bg-cyan-500/10
                  px-4
                  py-2
                  text-sm
                  font-semibold
                  text-cyan-300
                "
              >

                <Target size={16} />

                {transactionIntent}

              </span>

            </div>

            {/* =================================================
                URGENCY
            ================================================= */}

            <div className="mt-6">

              <p className="mb-2 text-sm text-slate-400">
                AI Urgency
              </p>

              <span
                className={`
                  inline-flex
                  rounded-full
                  px-4
                  py-2
                  text-sm
                  font-semibold
                  ${
                    String(aiData.urgency).toLowerCase() ===
                    "high"
                      ? "bg-red-500/20 text-red-400"
                      : String(aiData.urgency).toLowerCase() ===
                        "medium"
                      ? "bg-yellow-500/20 text-yellow-400"
                      : "bg-slate-700 text-slate-300"
                  }
                `}
              >
                {aiData.urgency || "Low"}
              </span>

            </div>

            {/* =================================================
                CONFIDENCE
            ================================================= */}

            <div className="mt-8 space-y-5">

              <ConfidenceBar
                label="Budget Confidence"
                value={aiData.budgetConfidence}
                icon={
                  <span className="text-cyan-400">
                    KES
                  </span>
                }
              />

              <ConfidenceBar
                label="Location Confidence"
                value={aiData.locationConfidence}
                icon={
                  <MapPin
                    size={16}
                    className="text-emerald-400"
                  />
                }
              />

              <ConfidenceBar
                label="Bedroom Confidence"
                value={aiData.bedroomConfidence}
                icon={
                  <User
                    size={16}
                    className="text-yellow-400"
                  />
                }
              />

              <ConfidenceBar
                label="Move Date Confidence"
                value={aiData.moveDateConfidence}
                icon={
                  <Calendar
                    size={16}
                    className="text-violet-400"
                  />
                }
              />

            </div>

            {/* =================================================
                RECOMMENDED ACTION
            ================================================= */}

            {aiData.recommendedAction && (
              <div
                className="
                  mt-8
                  rounded-2xl
                  border
                  border-violet-500/20
                  bg-violet-500/10
                  p-4
                "
              >

                <p
                  className="
                    text-xs
                    font-semibold
                    uppercase
                    tracking-wider
                    text-violet-400
                  "
                >
                  AI Recommended Action
                </p>

                <p className="mt-2 text-sm text-slate-200">
                  {aiData.recommendedAction}
                </p>

              </div>
            )}

            {/* =================================================
                MISSING INFORMATION
            ================================================= */}

            {Array.isArray(
              aiData.missingInformation
            ) &&
              aiData.missingInformation.length > 0 && (
                <div
                  className="
                    mt-5
                    rounded-2xl
                    border
                    border-yellow-500/20
                    bg-yellow-500/10
                    p-4
                  "
                >

                  <p
                    className="
                      text-xs
                      font-semibold
                      uppercase
                      tracking-wider
                      text-yellow-400
                    "
                  >
                    Missing Information
                  </p>

                  <div className="mt-3 flex flex-wrap gap-2">

                    {aiData.missingInformation.map(
                      (field, index) => (
                        <span
                          key={`${field}-${index}`}
                          className="
                            rounded-lg
                            bg-slate-800
                            px-3
                            py-1.5
                            text-xs
                            text-slate-300
                          "
                        >
                          {formatStatus(field)}
                        </span>
                      )
                    )}

                  </div>

                </div>
              )}

          </aside>

        </section>

        {/* ==================================================
            MAIN CRM WORKSPACE
        ================================================== */}

        <section className="grid gap-8 xl:grid-cols-3">

          {/* =================================================
              LEFT
              CONVERSATION
          ================================================= */}

          <div className="space-y-8 xl:col-span-2">

            <section
              className="
                overflow-hidden
                rounded-3xl
                border
                border-slate-800
                bg-slate-900
                shadow-xl
              "
            >

              <div className="border-b border-slate-800 p-6">

                <div className="flex items-center gap-3">

                  <Phone
                    size={22}
                    className="text-emerald-400"
                  />

                  <div>

                    <h2 className="text-2xl font-bold text-white">
                      Conversation Timeline
                    </h2>

                    <p className="mt-1 text-sm text-slate-400">
                      Complete customer conversation history.
                    </p>

                  </div>

                </div>

              </div>

              <div className="p-6">

                <ConversationHistory
                  conversation={conversation}
                />

              </div>

            </section>

          </div>

          {/* =================================================
              RIGHT SIDEBAR
          ================================================= */}

          <aside className="space-y-8">

            {/* ==============================================
                FOLLOW-UP
            ============================================== */}

            <section
              className="
                rounded-3xl
                border
                border-slate-800
                bg-slate-900
                p-6
              "
            >

              <div className="flex items-center gap-3">

                <Calendar
                  size={21}
                  className="text-yellow-400"
                />

                <h2 className="text-xl font-bold text-white">
                  Follow-up
                </h2>

              </div>

              <div className="mt-6 space-y-5">

                <div>

                  <p className="text-sm text-slate-400">
                    Next Follow-up
                  </p>

                  <h3 className="mt-2 text-lg font-bold text-white">

                    {lead.nextFollowUpDate
                      ? new Date(
                          lead.nextFollowUpDate
                        ).toLocaleString()
                      : "Not Scheduled"}

                  </h3>

                </div>

                <div>

                  <p className="text-sm text-slate-400">
                    Follow-up Status
                  </p>

                  <span
                    className={`
                      mt-2
                      inline-flex
                      rounded-full
                      px-4
                      py-2
                      text-sm
                      font-semibold
                      ${
                        String(
                          lead.followUpStatus
                        ).toLowerCase() ===
                        "completed"
                          ? "bg-emerald-500/20 text-emerald-400"
                          : String(
                              lead.followUpStatus
                            ).toLowerCase() ===
                            "overdue"
                          ? "bg-red-500/20 text-red-400"
                          : "bg-yellow-500/20 text-yellow-400"
                      }
                    `}
                  >
                    {lead.followUpStatus ||
                      "Pending"}
                  </span>

                </div>

              </div>

            </section>

            {/* ==============================================
                FOLLOW-UP ACTIONS
            ============================================== */}

            <section
              className="
                rounded-3xl
                border
                border-slate-800
                bg-slate-900
                p-6
              "
            >

              <h2 className="mb-5 text-xl font-bold text-white">
                Follow-up Actions
              </h2>

              <FollowUpActions
                lead={lead}
                refreshLead={refreshLead}
              />

            </section>

            {/* ==============================================
                AGENT NOTES
            ============================================== */}

            <section
              className="
                rounded-3xl
                border
                border-slate-800
                bg-slate-900
                p-6
              "
            >

              <h2 className="mb-5 text-xl font-bold text-white">
                📝 Agent Notes
              </h2>

              <FollowUpNotes
                lead={lead}
                refreshLead={refreshLead}
              />

            </section>

            {/* ==============================================
                CALL HISTORY
            ============================================== */}

            <section
              className="
                rounded-3xl
                border
                border-slate-800
                bg-slate-900
                p-6
              "
            >

              <div className="flex items-center gap-3">

                <Phone
                  size={20}
                  className="text-emerald-400"
                />

                <h2 className="text-xl font-bold text-white">
                  Call History
                </h2>

              </div>

              {!Array.isArray(
                lead.callHistory
              ) ||
              lead.callHistory.length === 0 ? (

                <div
                  className="
                    mt-6
                    rounded-2xl
                    border
                    border-dashed
                    border-slate-700
                    p-5
                    text-center
                  "
                >

                  <Phone
                    size={24}
                    className="mx-auto text-slate-600"
                  />

                  <p className="mt-3 text-sm text-slate-400">
                    No calls recorded yet.
                  </p>

                </div>

              ) : (

                <div className="mt-6 space-y-4">

                  {lead.callHistory
                    .slice()
                    .reverse()
                    .map((call, index) => (

                      <div
                        key={
                          call._id ||
                          `call-${index}`
                        }
                        className="
                          rounded-2xl
                          border
                          border-slate-700
                          bg-slate-800
                          p-4
                        "
                      >

                        <div
                          className="
                            flex
                            flex-col
                            gap-2
                            sm:flex-row
                            sm:items-center
                            sm:justify-between
                          "
                        >

                          <span className="font-semibold text-cyan-300">
                            {call.outcome ||
                              "Call"}
                          </span>

                          {call.calledAt && (
                            <span className="text-xs text-slate-500">
                              {new Date(
                                call.calledAt
                              ).toLocaleString()}
                            </span>
                          )}

                        </div>

                        {call.notes && (
                          <p className="mt-3 text-sm leading-6 text-slate-300">
                            {call.notes}
                          </p>
                        )}

                      </div>

                    ))}

                </div>

              )}

            </section>

          </aside>

        </section>

        {/* ==================================================
            PROPERTY RECOMMENDATIONS
        ================================================== */}

        <section
          className="
            overflow-hidden
            rounded-3xl
            border
            border-slate-800
            bg-slate-900
            shadow-xl
          "
        >

          <div className="border-b border-slate-800 p-6">

            <div
              className="
                flex
                flex-col
                gap-4
                sm:flex-row
                sm:items-center
                sm:justify-between
              "
            >

              <div>

                <div className="flex items-center gap-3">

                  <Target
                    size={22}
                    className="text-cyan-400"
                  />

                  <h2 className="text-2xl font-bold text-white">
                    Property Recommendations
                  </h2>

                </div>

                <p className="mt-2 text-sm text-slate-400">
                  AI-selected properties matching this
                  customer's requirements.
                </p>

              </div>

              <div
                className="
                  inline-flex
                  w-fit
                  items-center
                  gap-2
                  rounded-full
                  border
                  border-cyan-500/30
                  bg-cyan-500/10
                  px-4
                  py-2
                  text-sm
                  font-semibold
                  text-cyan-300
                "
              >

                <Brain size={16} />

                Personalized Matches

              </div>

            </div>

          </div>

          <div className="p-6">

            <PropertyRecommendations
              leadId={lead._id}
            />

          </div>

        </section>

        {/* ==================================================
            WORKFLOW STATUS
        ================================================== */}

        <section
          className="
            rounded-3xl
            border
            border-slate-800
            bg-slate-900
            p-6
          "
        >

          <div className="mb-6">

            <h2 className="text-xl font-bold text-white">
              Lead Workflow
            </h2>

            <p className="mt-1 text-sm text-slate-400">
              Current position of this customer in the CRM
              workflow.
            </p>

          </div>

          <div
            className="
              grid
              gap-3
              sm:grid-cols-2
              lg:grid-cols-4
              xl:grid-cols-7
            "
          >

            {[
              "new",
              "contacted",
              "qualified",
              "viewing",
              "negotiation",
              "won",
              "lost",
            ].map((step) => {

              const active =
                String(status).toLowerCase() ===
                step;

              return (
                <div
                  key={step}
                  className={`
                    rounded-2xl
                    border
                    p-4
                    transition
                    ${
                      active
                        ? "border-cyan-500/40 bg-cyan-500/10"
                        : "border-slate-800 bg-slate-950"
                    }
                  `}
                >

                  <div className="flex items-center gap-3">

                    <div
                      className={`
                        flex
                        h-9
                        w-9
                        shrink-0
                        items-center
                        justify-center
                        rounded-full
                        ${
                          active
                            ? "bg-cyan-500 text-slate-950"
                            : "bg-slate-800 text-slate-500"
                        }
                      `}
                    >

                      {active ? (
                        <CheckCircle2 size={18} />
                      ) : (
                        <Clock3 size={18} />
                      )}

                    </div>

                    <span
                      className={`
                        text-sm
                        font-semibold
                        ${
                          active
                            ? "text-cyan-300"
                            : "text-slate-500"
                        }
                      `}
                    >
                      {formatStatus(step)}
                    </span>

                  </div>

                </div>
              );
            })}

          </div>

          {/* =================================================
              VIEWING / FOLLOW-UP ARE SEPARATE WORKFLOW DATA
          ================================================= */}

          <div className="mt-6 grid gap-4 sm:grid-cols-2">

            <div
              className="
                rounded-2xl
                border
                border-slate-800
                bg-slate-950
                p-4
              "
            >

              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Viewing Status
              </p>

              <p className="mt-2 font-semibold text-slate-200">
                {formatStatus(
                  lead.viewingStatus || "none"
                )}
              </p>

            </div>

            <div
              className="
                rounded-2xl
                border
                border-slate-800
                bg-slate-950
                p-4
              "
            >

              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Follow-up Status
              </p>

              <p className="mt-2 font-semibold text-slate-200">
                {formatStatus(lead.followUpStatus || "Pending")}
              </p>

            </div>

          </div>

        </section>

      </div>

    </main>
  );
};

export default LeadDetails;