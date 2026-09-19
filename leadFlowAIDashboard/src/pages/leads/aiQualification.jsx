/**
 * Displays the complete AI qualification report
 * for a single lead.
 *
 * This page explains WHY LeadFlow AI scored
 * the lead the way it did.
 *
 * Shows:
 *
 * • AI Score
 * • Qualification Status
 * • Confidence Breakdown
 * • Budget Analysis
 * • Preferred Locations
 * • Bedroom Preference
 * • Move Timeline
 * • Customer Intent
 * • AI Reasoning
 * • Recommended Next Action
 * • Property Recommendations
 *
 * ==========================================================
 */

import { useNavigate, useParams } from "react-router-dom";

import {
  ArrowLeft,
  Brain,
  Sparkles,
  Target,
  Home,
  Calendar,
  DollarSign,
  MapPin,
} from "lucide-react";

import MainLayout from "../../components/layout/mainLayout";

import LoadingSpinner from "../../components/common/loadingSpinner";

import ErrorCard from "../../components/common/errorCard";

import StatusBadge from "../../components/common/statusBadge";

import RecommendationCard from "../../components/properties/recommendationCard";

import useLeadDetails from "../../hooks/useLeadDetails";

const AIQualification = () => {
  const navigate = useNavigate();

  const { id } = useParams();

  const {
    lead,
    loading,
    error,
    refreshLead,
  } = useLeadDetails(id);

  /* =======================================================
     LOADING
  ======================================================= */

  if (loading) {
    return (
      <MainLayout>
        <LoadingSpinner />
      </MainLayout>
    );
  }

  /* =======================================================
     ERROR
  ======================================================= */

  if (error) {
    return (
      <MainLayout>
        <ErrorCard
          message={error}
          onRetry={refreshLead}
        />
      </MainLayout>
    );
  }

  /* =======================================================
     LEAD NOT FOUND
  ======================================================= */

  if (!lead) {
    return (
      <MainLayout>
        <div
          className="
            rounded-3xl
            border
            border-slate-800
            bg-slate-900
            p-8
            text-slate-400
          "
        >
          Lead not found.
        </div>
      </MainLayout>
    );
  }

  /* =======================================================
     HELPER FUNCTIONS
  ======================================================= */

  const scoreColor = () => {
    if ((lead.score || 0) >= 90) {
      return "text-emerald-400";
    }

    if ((lead.score || 0) >= 75) {
      return "text-cyan-400";
    }

    if ((lead.score || 0) >= 60) {
      return "text-yellow-400";
    }

    return "text-red-400";
  };

  const confidenceBar = (value = 0) => ({
    width: `${value}%`,
  });

  /**
   * =======================================================
   * TRANSACTION INTENT
   * =======================================================
   *
   * Canonical Lead intent values:
   *
   * • rent
   * • buy
   * • property_search
   *
   * Intent describes WHAT TRANSACTION the customer wants.
   *
   * Search criteria such as:
   * • propertyType
   * • budget
   * • location
   * • bedrooms
   * • moveDate
   *
   * are kept separate.
   */

  const formatIntent = (intent) => {
    switch (
      String(intent || "")
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

  const transactionIntent =
    lead.intent ||
    lead.customerIntent ||
    "";

  return (
    <MainLayout>
      <div className="space-y-8">

        {/* =====================================================
            BACK BUTTON
        ===================================================== */}

        <button
          type="button"
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

          Back to Lead
        </button>

        {/* =====================================================
            PAGE HEADER
        ===================================================== */}

        <section
          className="
            rounded-3xl
            border
            border-slate-800
            bg-slate-900
            p-8
          "
        >
          <div className="flex items-center gap-4">

            <div
              className="
                flex
                h-16
                w-16
                items-center
                justify-center
                rounded-2xl
                bg-cyan-500/20
              "
            >
              <Brain
                size={34}
                className="text-cyan-400"
              />
            </div>

            <div>
              <h1
                className="
                  text-3xl
                  font-bold
                  text-white
                "
              >
                AI Qualification Report
              </h1>

              <p
                className="
                  mt-2
                  text-slate-400
                "
              >
                Understand how LeadFlow AI evaluated this customer.
              </p>
            </div>

          </div>
        </section>

        {/* =====================================================
            SCORE + STATUS
        ===================================================== */}

        <section className="grid gap-6 xl:grid-cols-3">

          {/* AI SCORE */}

          <div
            className="
              rounded-3xl
              border
              border-slate-800
              bg-slate-900
              p-8
            "
          >
            <div className="flex items-center gap-3">

              <Sparkles
                className="text-cyan-400"
                size={22}
              />

              <h2
                className="
                  text-xl
                  font-bold
                  text-white
                "
              >
                AI Match Score
              </h2>

            </div>

            <h3
              className={`
                mt-8
                text-7xl
                font-black
                ${scoreColor()}
              `}
            >
              {lead.score || 0}%
            </h3>

            <p
              className="
                mt-4
                text-slate-400
              "
            >
              Overall qualification confidence.
            </p>
          </div>

          {/* STATUS */}

          <div
            className="
              rounded-3xl
              border
              border-slate-800
              bg-slate-900
              p-8
            "
          >
            <div className="flex items-center gap-3">

              <Target
                className="text-emerald-400"
                size={22}
              />

              <h2
                className="
                  text-xl
                  font-bold
                  text-white
                "
              >
                Qualification Status
              </h2>

            </div>

            <div className="mt-8">
              <StatusBadge
                status={lead.status}
              />
            </div>

            <p
              className="
                mt-6
                leading-7
                text-slate-400
              "
            >
              The qualification status is determined from
              customer intent, affordability, urgency,
              preferred location and AI confidence.
            </p>
          </div>

          {/* NEXT ACTION */}

          <div
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

              <h2
                className="
                  text-xl
                  font-bold
                  text-white
                "
              >
                Recommended Next Action
              </h2>

            </div>

            <div className="mt-8">
              <h3
                className="
                  text-2xl
                  font-bold
                  text-cyan-400
                "
              >
                {lead.nextAction ||
                  "Schedule Property Viewing"}
              </h3>
            </div>

            <p
              className="
                mt-4
                leading-7
                text-slate-300
              "
            >
              Based on AI analysis this is the action most
              likely to move the customer toward conversion.
            </p>
          </div>

        </section>

        {/* =====================================================
            CONFIDENCE BREAKDOWN
        ===================================================== */}

        <section
          className="
            rounded-3xl
            border
            border-slate-800
            bg-slate-900
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
            Confidence Breakdown
          </h2>

          <p
            className="
              mt-2
              text-slate-400
            "
          >
            AI confidence for each extracted customer preference.
          </p>

          <div className="mt-8 space-y-8">

            {/* Budget */}

            <div>
              <div className="mb-3 flex justify-between">

                <span className="flex items-center gap-2 text-white">
                  <DollarSign size={18} />

                  Budget
                </span>

                <span className="font-semibold text-cyan-400">
                  {lead.budgetConfidence || 0}%
                </span>

              </div>

              <div className="h-3 rounded-full bg-slate-800">

                <div
                  style={confidenceBar(
                    lead.budgetConfidence
                  )}
                  className="
                    h-full
                    rounded-full
                    bg-cyan-500
                  "
                />

              </div>
            </div>

            {/* Location */}

            <div>
              <div className="mb-3 flex justify-between">

                <span className="flex items-center gap-2 text-white">
                  <MapPin size={18} />

                  Location
                </span>

                <span className="font-semibold text-emerald-400">
                  {lead.locationConfidence || 0}%
                </span>

              </div>

              <div className="h-3 rounded-full bg-slate-800">

                <div
                  style={confidenceBar(
                    lead.locationConfidence
                  )}
                  className="
                    h-full
                    rounded-full
                    bg-emerald-500
                  "
                />

              </div>
            </div>

            {/* Bedrooms */}

            <div>
              <div className="mb-3 flex justify-between">

                <span className="flex items-center gap-2 text-white">
                  <Home size={18} />

                  Bedrooms
                </span>

                <span className="font-semibold text-yellow-400">
                  {lead.bedroomConfidence || 0}%
                </span>

              </div>

              <div className="h-3 rounded-full bg-slate-800">

                <div
                  style={confidenceBar(
                    lead.bedroomConfidence
                  )}
                  className="
                    h-full
                    rounded-full
                    bg-yellow-500
                  "
                />

              </div>
            </div>

            {/* Move Date */}

            <div>
              <div className="mb-3 flex justify-between">

                <span className="flex items-center gap-2 text-white">
                  <Calendar size={18} />

                  Move Timeline
                </span>

                <span className="font-semibold text-violet-400">
                  {lead.moveDateConfidence || 0}%
                </span>

              </div>

              <div className="h-3 rounded-full bg-slate-800">

                <div
                  style={confidenceBar(
                    lead.moveDateConfidence
                  )}
                  className="
                    h-full
                    rounded-full
                    bg-violet-500
                  "
                />

              </div>
            </div>

          </div>
        </section>

        {/* =====================================================
            CUSTOMER INTENT + AI REASONING
        ===================================================== */}

        <section className="grid gap-8 xl:grid-cols-2">

          {/* ================================================
              CUSTOMER PREFERENCES
          ================================================ */}

          <section
            className="
              rounded-3xl
              border
              border-slate-800
              bg-slate-900
              p-8
            "
          >
            <h2 className="text-2xl font-bold text-white">
              Customer Intent
            </h2>

            <p className="mt-2 text-slate-400">
              Transaction intent and property preferences extracted
              automatically by LeadFlow AI.
            </p>

            <div className="mt-8 space-y-6">

              {/* TRANSACTION INTENT */}

              <div
                className="
                  rounded-2xl
                  border
                  border-cyan-500/20
                  bg-cyan-500/10
                  p-5
                "
              >
                <p className="text-sm text-slate-400">
                  Transaction Intent
                </p>

                <h3 className="mt-2 text-xl font-bold text-cyan-400">
                  {formatIntent(
                    transactionIntent
                  )}
                </h3>
              </div>

              {/* BUDGET */}

              <div
                className="
                  rounded-2xl
                  border
                  border-slate-800
                  bg-slate-950
                  p-5
                "
              >
                <p className="text-sm text-slate-400">
                  Budget
                </p>

                <h3 className="mt-2 text-xl font-bold text-cyan-400">
                  {lead.budget
                    ? `KES ${Number(
                        lead.budget
                      ).toLocaleString()}`
                    : "Not detected"}
                </h3>
              </div>

              {/* LOCATION */}

              <div
                className="
                  rounded-2xl
                  border
                  border-slate-800
                  bg-slate-950
                  p-5
                "
              >
                <p className="text-sm text-slate-400">
                  Preferred Location
                </p>

                <h3 className="mt-2 text-xl font-bold text-emerald-400">
                  {lead.location || "Unknown"}
                </h3>
              </div>

              {/* BEDROOMS */}

              <div
                className="
                  rounded-2xl
                  border
                  border-slate-800
                  bg-slate-950
                  p-5
                "
              >
                <p className="text-sm text-slate-400">
                  Bedrooms
                </p>

                <h3 className="mt-2 text-xl font-bold text-yellow-400">
                  {lead.bedrooms || "-"}
                </h3>
              </div>

              {/* MOVE DATE */}

              <div
                className="
                  rounded-2xl
                  border
                  border-slate-800
                  bg-slate-950
                  p-5
                "
              >
                <p className="text-sm text-slate-400">
                  Expected Move Date
                </p>

                <h3 className="mt-2 text-xl font-bold text-violet-400">
                  {lead.moveDate || "Flexible"}
                </h3>
              </div>

              {/* PROPERTY TYPE */}

              <div
                className="
                  rounded-2xl
                  border
                  border-slate-800
                  bg-slate-950
                  p-5
                "
              >
                <p className="text-sm text-slate-400">
                  Property Type
                </p>

                <h3 className="mt-2 text-xl font-bold capitalize text-white">
                  {lead.propertyType || "Not specified"}
                </h3>
              </div>

            </div>
          </section>

          {/* ================================================
              AI REASONING
          ================================================ */}

          <section
            className="
              rounded-3xl
              border
              border-slate-800
              bg-slate-900
              p-8
            "
          >
            <h2 className="text-2xl font-bold text-white">
              AI Reasoning
            </h2>

            <p className="mt-2 text-slate-400">
              Why LeadFlow AI qualified this customer.
            </p>

            <div className="mt-8 space-y-5">

              {(lead.reasoning || [
                "Customer budget matches available listings.",

                "Preferred location has active inventory.",

                "Move timeline indicates a property requirement.",

                "Conversation shows high engagement.",

                "Customer responded positively to recommendations.",
              ]).map((reason, index) => (

                <div
                  key={index}
                  className="
                    flex
                    items-start
                    gap-4
                    rounded-2xl
                    border
                    border-cyan-500/20
                    bg-cyan-500/10
                    p-5
                  "
                >
                  <Sparkles
                    size={18}
                    className="mt-1 text-cyan-400"
                  />

                  <p className="leading-7 text-slate-300">
                    {reason}
                  </p>
                </div>

              ))}

            </div>
          </section>

        </section>

        {/* =====================================================
            PROPERTY RECOMMENDATIONS
        ===================================================== */}

        <section
          className="
            rounded-3xl
            border
            border-slate-800
            bg-slate-900
            p-8
          "
        >
          <div className="mb-8">

            <h2 className="text-2xl font-bold text-white">
              Recommended Properties
            </h2>

            <p className="mt-2 text-slate-400">
              AI-selected listings matching this customer's preferences.
            </p>

          </div>

          {lead.recommendations &&
          lead.recommendations.length > 0 ? (

            <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">

              {lead.recommendations.map((property) => (

                <RecommendationCard
                  key={property._id}
                  property={property}
                />

              ))}

            </div>

          ) : (

            <div
              className="
                rounded-2xl
                border
                border-dashed
                border-slate-700
                py-20
                text-center
              "
            >
              <Brain
                size={42}
                className="mx-auto text-slate-600"
              />

              <h3 className="mt-5 text-xl font-semibold text-white">
                No Recommendations Available
              </h3>

              <p className="mt-2 text-slate-400">
                LeadFlow AI has not generated property matches yet.
              </p>
            </div>

          )}

        </section>

      </div>
    </MainLayout>
  );
};

export default AIQualification;