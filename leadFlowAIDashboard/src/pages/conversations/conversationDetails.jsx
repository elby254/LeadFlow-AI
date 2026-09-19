/**
 *
 * Displays a complete conversation between a customer
 * and LeadFlow AI.
 *
 * This page is READ ONLY.
 *
 * Purpose
 * -------
 * Gives agents, managers and viewers full context
 * before engaging the customer.
 *
 * Latest Agent Workflow
 * ---------------------
 *
 * AI / Customer Conversation
 *          ↓
 * AI Qualification
 *          ↓
 * Agent Reviews Context
 *          ↓
 * Agent Contacts Customer
 *          ↓
 * Agent Records Outcome
 *          ↓
 * Follow-up Manager
 *
 * Displays
 * --------
 * • Customer profile
 * • Customer contact information
 * • AI Qualification Summary
 * • Customer intent
 * • Conversation timeline
 * • Message timestamps
 * • AI Summary
 * • Extracted Preferences
 * • Property context
 * • Recommended next action
 *
 * Agent Actions
 * -------------
 * • Contact Lead
 * • Schedule / Manage Follow-up
 * • Return to Conversations
 *
 * IMPORTANT
 * ---------
 * This page does NOT edit conversation messages.
 *
 * Conversation editing / messaging happens inside:
 *
 * AgentConversationCenter.jsx
 *
 * Follow-up planning happens inside:
 *
 * followups/FollowUpPage.jsx
 *
 * ==========================================================
 */

import { useEffect, useState } from "react";

import { useNavigate, useParams } from "react-router-dom";

import {
  ArrowLeft,
  Brain,
  User,
  Phone,
  Calendar,
  MapPin,
  Home,
  DollarSign,
  Sparkles,
  MessageSquare,
  Target,
  Clock,
  CheckCircle2,
  ClipboardList,
} from "lucide-react";

import MainLayout from "../../components/layout/mainlayout";

import LoadingSpinner from "../../components/common/loadingSpinner";

import ErrorCard from "../../components/common/errorCard";

import StatusBadge from "../../components/common/statusBadge";

import useLeadDetails from "../../hooks/useLeadDetails";

import conversationService from "../../services/conversationService";

/**
 * ==========================================================
 * HELPERS
 * ==========================================================
 */

/**
 * Safely extract an array from different backend
 * response structures.
 */
const extractArray = (value) => {
  if (Array.isArray(value)) {
    return value;
  }

  if (Array.isArray(value?.data)) {
    return value.data;
  }

  if (Array.isArray(value?.messages)) {
    return value.messages;
  }

  if (Array.isArray(value?.data?.messages)) {
    return value.data.messages;
  }

  return [];
};

/**
 * Safely extract conversation object.
 */
const extractConversation = (value) => {
  if (!value) {
    return null;
  }

  if (value?.data?.messages) {
    return value.data;
  }

  if (value?.data && !Array.isArray(value.data)) {
    return value.data;
  }

  return value;
};

/**
 * Format the canonical transaction intent.
 *
 * Canonical values:
 * • rent
 * • buy
 * • property_search
 */
const formatIntent = (value) => {
  switch (
    String(value || "")
      .trim()
      .toLowerCase()
  ) {
    case "rent":
      return "Rent";

    case "buy":
      return "Buy";

    case "property_search":
      return "Property Search";

    default:
      return "Not Specified";
  }
};

/**
 * ==========================================================
 * COMPONENT
 * ==========================================================
 */

const ConversationDetails = () => {
  const navigate = useNavigate();

  /**
   * Route parameter
   *
   * Expected:
   *
   * /conversations/:leadId
   *
   * or
   *
   * /conversation/:leadId
   */
  const { leadId, id } = useParams();

  const resolvedLeadId = leadId || id;

  /**
   * ========================================================
   * LEAD DETAILS
   * ========================================================
   */

  const {
    lead,
    loading: leadLoading,
    error: leadError,
    refreshLead,
  } = useLeadDetails(resolvedLeadId);

  /**
   * ========================================================
   * CONVERSATION STATE
   * ========================================================
   */

  const [conversation, setConversation] = useState(null);

  const [conversationLoading, setConversationLoading] =
    useState(true);

  const [conversationError, setConversationError] =
    useState("");

  /**
   * ========================================================
   * LOAD CONVERSATION
   * ========================================================
   */

  const loadConversation = async () => {
    if (!resolvedLeadId) {
      console.error(
        "ConversationDetails: Missing lead ID."
      );

      setConversationError(
        "Unable to load conversation because the lead ID is missing."
      );

      setConversationLoading(false);

      return;
    }

    try {
      console.log(
        "ConversationDetails: Loading conversation for lead:",
        resolvedLeadId
      );

      setConversationLoading(true);

      setConversationError("");

      const response =
        await conversationService.getConversationByLeadId(
          resolvedLeadId
        );

      console.log(
        "ConversationDetails: Conversation response:",
        response
      );

      const normalizedConversation =
        extractConversation(response);

      console.log(
        "ConversationDetails: Normalized conversation:",
        normalizedConversation
      );

      setConversation(
        normalizedConversation
      );
    } catch (error) {
      console.error(
        "ConversationDetails: Failed to load conversation:",
        error
      );

      setConversationError(
        error.response?.data?.message ||
          "Unable to load conversation."
      );
    } finally {
      setConversationLoading(false);
    }
  };

  /**
   * ========================================================
   * INITIAL LOAD
   * ========================================================
   */

  useEffect(() => {
    loadConversation();
  }, [resolvedLeadId]);

  /**
   * ========================================================
   * LOADING
   * ========================================================
   */

  const loading =
    leadLoading ||
    conversationLoading;

  /**
   * ========================================================
   * ERROR
   * ========================================================
   */

  const error =
    leadError ||
    conversationError;

  /**
   * ========================================================
   * RETRY
   * ========================================================
   */

  const handleRetry = async () => {
    console.log(
      "ConversationDetails: Retrying lead and conversation load..."
    );

    try {
      if (refreshLead) {
        await refreshLead();
      }
    } catch (error) {
      console.error(
        "ConversationDetails: Failed to refresh lead:",
        error
      );
    }

    await loadConversation();
  };

  /**
   * ========================================================
   * CONVERSATION MESSAGES
   * ========================================================
   */

  const messages = extractArray(
    conversation?.messages
      ? conversation.messages
      : conversation
  );

  /**
   * ========================================================
   * CUSTOMER / LEAD DATA
   * ========================================================
   */

  const customerName =
    lead?.name ||
    conversation?.customerName ||
    conversation?.leadName ||
    "Unknown Customer";

  const customerPhone =
    lead?.phone ||
    conversation?.customerPhone ||
    conversation?.phone ||
    "-";

  const leadStatus =
    lead?.status ||
    conversation?.leadStatus ||
    conversation?.status ||
    "Pending";

  /**
   * ========================================================
   * CONVERSATION SUMMARY
   * ========================================================
   *
   * conversation.summary mirrors lead.intent and
   * contains extracted customer search criteria.
   */

  const conversationSummary =
    conversation?.summary &&
    typeof conversation.summary === "object"
      ? conversation.summary
      : {};

  /**
   * ========================================================
   * PROPERTY CONTEXT
   * ========================================================
   */

  const propertyTitle =
    conversation?.propertyTitle ||
    conversation?.property?.title ||
    lead?.propertyTitle ||
    lead?.property?.title ||
    "No property selected";

  const propertyLocation =
    conversation?.propertyLocation ||
    conversation?.property?.location ||
    lead?.propertyLocation ||
    conversationSummary.location ||
    lead?.location ||
    "-";

  /**
   * ========================================================
   * QUALIFICATION DATA
   * ========================================================
   */

  const qualificationScore =
    lead?.score ??
    lead?.aiScore ??
    conversation?.score ??
    conversation?.aiScore ??
    0;

  /**
   * Transaction intent is a customer transaction preference.
   *
   * Canonical values:
   * • rent
   * • buy
   * • property_search
   *
   * conversation.summary.intent mirrors lead.intent.
   */
  const transactionIntent =
    lead?.intent ||
    conversationSummary.intent ||
    conversation?.intent ||
    lead?.customerIntent ||
    conversation?.customerIntent ||
    "";

  const budget =
    lead?.budget ??
    conversationSummary.budget ??
    conversation?.budget ??
    conversation?.qualification?.budget;

  const bedrooms =
    lead?.bedrooms ??
    conversationSummary.bedrooms ??
    conversation?.bedrooms ??
    conversation?.qualification?.bedrooms;

  const moveDate =
    lead?.moveDate ||
    conversationSummary.moveDate ||
    conversation?.moveDate ||
    conversation?.qualification?.moveDate ||
    "Flexible";

  const summary =
    lead?.summary ||
    lead?.aiSummary ||
    conversation?.aiSummary ||
    conversationSummary.summary ||
    "No AI summary is available yet.";

  /**
   * ========================================================
   * EXTRACTED PREFERENCES
   * ========================================================
   */

  const preferences =
    lead?.preferences ||
    lead?.extractedPreferences ||
    conversation?.preferences ||
    conversation?.extractedPreferences ||
    {};

  /**
   * ========================================================
   * RECOMMENDED NEXT ACTION
   * ========================================================
   */

  const recommendedAction =
    lead?.recommendedAction ||
    lead?.aiRecommendation ||
    conversation?.recommendedAction ||
    conversation?.aiRecommendation ||
    "Review the conversation and contact the customer.";

  /**
   * ========================================================
   * NAVIGATION ACTIONS
   * ========================================================
   */

  const handleContactLead = () => {
    console.log(
      "ConversationDetails: Opening contact workspace for lead:",
      resolvedLeadId
    );

    navigate(`/lead/${resolvedLeadId}`);
  };

  const handleFollowUp = () => {
    console.log(
      "ConversationDetails: Opening follow-up manager for lead:",
      resolvedLeadId
    );

    navigate(`/followup/${resolvedLeadId}`);
  };

  /**
   * ========================================================
   * LOADING VIEW
   * ========================================================
   */

  if (loading) {
    return (
      <MainLayout>
        <LoadingSpinner />
      </MainLayout>
    );
  }

  /**
   * ========================================================
   * ERROR VIEW
   * ========================================================
   */

  if (error) {
    return (
      <MainLayout>
        <ErrorCard
          message={error}
          onRetry={handleRetry}
        />
      </MainLayout>
    );
  }

  /**
   * ========================================================
   * PAGE
   * ========================================================
   */

  return (
    <MainLayout>
      <div className="space-y-8">

        {/* =========================================
            BACK BUTTON
        ========================================= */}

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
            text-white
            transition
            hover:border-cyan-500
            hover:bg-slate-800
          "
        >
          <ArrowLeft size={18} />

          Back
        </button>

        {/* =========================================
            PAGE HEADER
        ========================================= */}

        <section
          className="
            rounded-3xl
            border
            border-slate-800
            bg-slate-900
            p-8
          "
        >
          <div
            className="
              flex
              flex-col
              gap-6
              lg:flex-row
              lg:items-center
              lg:justify-between
            "
          >

            <div>

              <div className="flex items-center gap-3">

                <MessageSquare
                  size={30}
                  className="text-cyan-400"
                />

                <h1
                  className="
                    text-3xl
                    font-bold
                    text-white
                  "
                >
                  Conversation Details
                </h1>

              </div>

              <p className="mt-3 text-slate-400">
                Review the customer's AI conversation and
                qualification context before taking action.
              </p>

            </div>

            {/* =====================================
                AGENT ACTIONS
            ===================================== */}

            <div className="flex flex-col gap-3 sm:flex-row">

              <button
                onClick={handleContactLead}
                className="
                  inline-flex
                  items-center
                  justify-center
                  gap-2
                  rounded-xl
                  bg-cyan-500
                  px-5
                  py-3
                  font-semibold
                  text-slate-950
                  transition
                  hover:bg-cyan-400
                "
              >
                <Phone size={18} />

                Contact Lead
              </button>

              <button
                onClick={handleFollowUp}
                className="
                  inline-flex
                  items-center
                  justify-center
                  gap-2
                  rounded-xl
                  border
                  border-cyan-500/40
                  bg-cyan-500/10
                  px-5
                  py-3
                  font-semibold
                  text-cyan-300
                  transition
                  hover:border-cyan-500
                  hover:bg-cyan-500/20
                "
              >
                <Calendar size={18} />

                Manage Follow-up
              </button>

            </div>

          </div>
        </section>

        {/* =========================================
            CUSTOMER + QUALIFICATION
        ========================================= */}

        <section className="grid gap-8 xl:grid-cols-3">

          {/* =====================================
              CUSTOMER PROFILE
          ===================================== */}

          <aside
            className="
              space-y-6
              rounded-3xl
              border
              border-slate-800
              bg-slate-900
              p-6
            "
          >

            <div className="flex items-center gap-3">

              <div
                className="
                  flex
                  h-12
                  w-12
                  items-center
                  justify-center
                  rounded-full
                  bg-cyan-500/10
                "
              >
                <User
                  size={22}
                  className="text-cyan-400"
                />
              </div>

              <div>

                <h2 className="text-xl font-bold text-white">
                  {customerName}
                </h2>

                <p className="text-slate-400">
                  Customer
                </p>

              </div>

            </div>

            <div className="space-y-5">

              {/* Phone */}

              <div className="flex items-center gap-3">

                <Phone
                  size={18}
                  className="text-slate-500"
                />

                <div>

                  <p className="text-xs text-slate-500">
                    Phone
                  </p>

                  <p className="text-slate-300">
                    {customerPhone}
                  </p>

                </div>

              </div>

              {/* Location */}

              <div className="flex items-center gap-3">

                <MapPin
                  size={18}
                  className="text-slate-500"
                />

                <div>

                  <p className="text-xs text-slate-500">
                    Preferred Location
                  </p>

                  <p className="text-slate-300">
                    {lead?.location ||
                      conversationSummary.location ||
                      propertyLocation ||
                      "-"}
                  </p>

                </div>

              </div>

              {/* Budget */}

              <div className="flex items-center gap-3">

                <DollarSign
                  size={18}
                  className="text-slate-500"
                />

                <div>

                  <p className="text-xs text-slate-500">
                    Budget
                  </p>

                  <p className="text-slate-300">

                    {budget
                      ? `KES ${Number(
                          budget
                        ).toLocaleString()}`
                      : "-"}

                  </p>

                </div>

              </div>

              {/* Bedrooms */}

              <div className="flex items-center gap-3">

                <Home
                  size={18}
                  className="text-slate-500"
                />

                <div>

                  <p className="text-xs text-slate-500">
                    Property Requirement
                  </p>

                  <p className="text-slate-300">

                    {bedrooms
                      ? `${bedrooms} bedrooms`
                      : "-"}

                  </p>

                </div>

              </div>

              {/* Move Date */}

              <div className="flex items-center gap-3">

                <Calendar
                  size={18}
                  className="text-slate-500"
                />

                <div>

                  <p className="text-xs text-slate-500">
                    Move Date
                  </p>

                  <p className="text-slate-300">
                    {moveDate}
                  </p>

                </div>

              </div>

            </div>

            <div>

              <p className="mb-2 text-xs text-slate-500">
                Lead Status
              </p>

              <StatusBadge
                status={leadStatus}
              />

            </div>

          </aside>

          {/* =====================================
              AI QUALIFICATION
          ===================================== */}

          <section
            className="
              rounded-3xl
              border
              border-cyan-500/20
              bg-cyan-500/5
              p-6
            "
          >

            <div className="flex items-center gap-3">

              <Brain
                size={24}
                className="text-cyan-400"
              />

              <div>

                <h2 className="text-xl font-bold text-white">
                  AI Qualification
                </h2>

                <p className="text-sm text-slate-400">
                  Customer intent and engagement context
                </p>

              </div>

            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">

              {/* Score */}

              <div
                className="
                  rounded-2xl
                  border
                  border-slate-800
                  bg-slate-950
                  p-5
                "
              >

                <div className="flex items-center gap-2">

                  <Target
                    size={18}
                    className="text-cyan-400"
                  />

                  <p className="text-sm text-slate-400">
                    AI Score
                  </p>

                </div>

                <p className="mt-3 text-3xl font-bold text-cyan-400">
                  {qualificationScore}
                </p>

              </div>

              {/* Transaction Intent */}

              <div
                className="
                  rounded-2xl
                  border
                  border-slate-800
                  bg-slate-950
                  p-5
                "
              >

                <div className="flex items-center gap-2">

                  <Sparkles
                    size={18}
                    className="text-cyan-400"
                  />

                  <p className="text-sm text-slate-400">
                    Transaction Intent
                  </p>

                </div>

                <p className="mt-3 font-semibold text-white">
                  {formatIntent(transactionIntent)}
                </p>

              </div>

            </div>

            {/* Recommendation */}

            <div
              className="
                mt-5
                rounded-2xl
                border
                border-cyan-500/20
                bg-cyan-500/10
                p-5
              "
            >

              <div className="flex items-center gap-2">

                <ClipboardList
                  size={18}
                  className="text-cyan-400"
                />

                <h3 className="font-semibold text-white">
                  Recommended Next Action
                </h3>

              </div>

              <p className="mt-3 leading-7 text-slate-300">
                {recommendedAction}
              </p>

            </div>

          </section>

          {/* =====================================
              PROPERTY CONTEXT
          ===================================== */}

          <aside
            className="
              rounded-3xl
              border
              border-slate-800
              bg-slate-900
              p-6
            "
          >

            <div className="flex items-center gap-3">

              <Home
                size={24}
                className="text-cyan-400"
              />

              <h2 className="text-xl font-bold text-white">
                Property Context
              </h2>

            </div>

            <div className="mt-6 space-y-5">

              <div>

                <p className="text-xs text-slate-500">
                  Property
                </p>

                <p className="mt-1 font-semibold text-white">
                  {propertyTitle}
                </p>

              </div>

              <div>

                <p className="text-xs text-slate-500">
                  Location
                </p>

                <p className="mt-1 text-slate-300">
                  {propertyLocation}
                </p>

              </div>

              <div>

                <p className="text-xs text-slate-500">
                  Customer Requirement
                </p>

                <p className="mt-1 text-slate-300">

                  {bedrooms
                    ? `${bedrooms} bedrooms`
                    : "Not specified"}

                </p>

              </div>

              <div>

                <p className="text-xs text-slate-500">
                  Budget
                </p>

                <p className="mt-1 text-slate-300">

                  {budget
                    ? `KES ${Number(
                        budget
                      ).toLocaleString()}`
                    : "Not specified"}

                </p>

              </div>

            </div>

          </aside>

        </section>

        {/* =========================================
            CONVERSATION TIMELINE
        ========================================= */}

        <section
          className="
            rounded-3xl
            border
            border-slate-800
            bg-slate-900
            p-8
          "
        >

          <div className="flex items-center justify-between">

            <div>

              <h2 className="text-2xl font-bold text-white">
                Conversation Timeline
              </h2>

              <p className="mt-2 text-slate-400">
                Complete customer and AI interaction history.
              </p>

            </div>

            <MessageSquare
              size={28}
              className="text-cyan-400"
            />

          </div>

          <div className="mt-8 space-y-6">

            {messages.length > 0 ? (

              messages.map((message, index) => {

                const sender =
                  message.sender ||
                  message.role ||
                  message.senderType ||
                  "customer";

                const isCustomer =
                  String(sender).toLowerCase() ===
                    "customer" ||
                  String(sender).toLowerCase() ===
                    "user";

                const messageText =
                  message.text ||
                  message.message ||
                  message.content ||
                  "";

                const timestamp =
                  message.timestamp ||
                  message.createdAt ||
                  message.date;

                return (
                  <div
                    key={
                      message._id ||
                      message.id ||
                      index
                    }
                    className={`flex ${
                      isCustomer
                        ? "justify-start"
                        : "justify-end"
                    }`}
                  >

                    <div
                      className={`
                        max-w-2xl
                        rounded-2xl
                        px-5
                        py-4

                        ${
                          isCustomer
                            ? "bg-slate-800 text-white"
                            : "bg-cyan-500 text-slate-950"
                        }
                      `}
                    >

                      <div className="mb-2 flex items-center gap-2 text-xs font-semibold">

                        {isCustomer ? (
                          <User size={14} />
                        ) : (
                          <Brain size={14} />
                        )}

                        <span>
                          {isCustomer
                            ? "Customer"
                            : sender === "agent"
                            ? "Agent"
                            : "LeadFlow AI"}
                        </span>

                      </div>

                      <p className="leading-7">
                        {messageText}
                      </p>

                      {timestamp && (
                        <div
                          className="
                            mt-3
                            flex
                            items-center
                            justify-end
                            gap-1
                            text-xs
                            opacity-70
                          "
                        >

                          <Clock size={12} />

                          {new Date(
                            timestamp
                          ).toLocaleString()}

                        </div>
                      )}

                    </div>

                  </div>
                );
              })

            ) : (

              <div
                className="
                  rounded-2xl
                  border
                  border-dashed
                  border-slate-700
                  py-16
                  text-center
                "
              >

                <Brain
                  size={42}
                  className="mx-auto text-slate-600"
                />

                <h3
                  className="
                    mt-4
                    text-lg
                    font-semibold
                    text-white
                  "
                >
                  No Conversation Found
                </h3>

                <p className="mt-2 text-slate-400">
                  There are currently no messages available
                  for this customer.
                </p>

              </div>

            )}

          </div>

        </section>

        {/* =========================================
            AI SUMMARY
        ========================================= */}

        <section
          className="
            rounded-3xl
            border
            border-cyan-500/20
            bg-cyan-500/10
            p-8
          "
        >

          <div className="flex items-center gap-3">

            <Sparkles
              size={22}
              className="text-cyan-400"
            />

            <h2 className="text-2xl font-bold text-white">
              AI Summary
            </h2>

          </div>

          <p className="mt-6 leading-8 text-slate-300">
            {summary}
          </p>

        </section>

        {/* =========================================
            EXTRACTED PREFERENCES
        ========================================= */}

        {Object.keys(preferences).length > 0 && (

          <section
            className="
              rounded-3xl
              border
              border-slate-800
              bg-slate-900
              p-8
            "
          >

            <div className="flex items-center gap-3">

              <CheckCircle2
                size={22}
                className="text-cyan-400"
              />

              <h2 className="text-2xl font-bold text-white">
                Extracted Preferences
              </h2>

            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">

              {Object.entries(preferences).map(
                ([key, value]) => (

                  <div
                    key={key}
                    className="
                      rounded-2xl
                      border
                      border-slate-800
                      bg-slate-950
                      p-5
                    "
                  >

                    <p className="text-xs uppercase tracking-wide text-slate-500">
                      {key.replace(
                        /([A-Z])/g,
                        " $1"
                      )}
                    </p>

                    <p className="mt-2 text-white">
                      {Array.isArray(value)
                        ? value.join(", ")
                        : String(value)}
                    </p>

                  </div>

                )
              )}

            </div>

          </section>

        )}

        {/* =========================================
            NEXT STEP
        ========================================= */}

        <section
          className="
            rounded-3xl
            border
            border-cyan-500/30
            bg-slate-900
            p-8
          "
        >

          <div
            className="
              flex
              flex-col
              gap-6
              lg:flex-row
              lg:items-center
              lg:justify-between
            "
          >

            <div>

              <h2 className="text-2xl font-bold text-white">
                Ready for the next customer action?
              </h2>

              <p className="mt-2 max-w-2xl leading-7 text-slate-400">
                Use the conversation context above to contact
                the customer, record the interaction outcome,
                and schedule the next follow-up when required.
              </p>

            </div>

            <div className="flex flex-col gap-3 sm:flex-row">

              <button
                onClick={handleContactLead}
                className="
                  inline-flex
                  items-center
                  justify-center
                  gap-2
                  rounded-xl
                  bg-cyan-500
                  px-6
                  py-3
                  font-bold
                  text-slate-950
                  transition
                  hover:bg-cyan-400
                "
              >

                <Phone size={18} />

                Contact Customer

              </button>

              <button
                onClick={handleFollowUp}
                className="
                  inline-flex
                  items-center
                  justify-center
                  gap-2
                  rounded-xl
                  border
                  border-slate-700
                  bg-slate-950
                  px-6
                  py-3
                  font-semibold
                  text-white
                  transition
                  hover:border-cyan-500
                "
              >

                <Calendar size={18} />

                Schedule Follow-up

              </button>

            </div>

          </div>

        </section>

      </div>
    </MainLayout>
  );
};

export default ConversationDetails;