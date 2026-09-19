/**
 * ==========================================================
 *
 *
 * Displays the complete 360° profile of a single customer.
 *
 * This page acts as the central workspace for agents after a
 * lead has been qualified by the AI.
 *
 * Includes:
 *
 * • Customer Profile
 * • Qualification Summary
 * • AI Score
 * • Budget
 * • Location
 * • Bedrooms
 * • Move Date
 * • Conversation Timeline
 * • Agent Notes
 * • Call History
 * • Follow-up Actions
 * • Property Recommendations
 *
 * ==========================================================
 */

import { useNavigate, useParams } from "react-router-dom";

import LeadHeader from "../../components/lead/leadHeader";
import LeadInfoCard from "../../components/lead/leadInfoCard";
import ConversationHistory from "../../components/lead/conversationHistory";
import FollowUpNotes from "../../components/lead/followUpNotes";
import FollowUpActions from "../../components/lead/followUpActions";
import LeadActions from "../../components/lead/leadActions";
import PropertyRecommendations from "../../components/lead/propertyRecommendations";

import useLeadDetails from "../../hooks/useLeadDetails";

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

  /* ==========================================================
     LOADING
  ========================================================== */

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 p-8">
        <div className="mx-auto max-w-7xl text-white">
          Loading Lead...
        </div>
      </main>
    );
  }

  /* ==========================================================
     ERROR
  ========================================================== */

  if (error) {
    return (
      <main className="min-h-screen bg-slate-950 p-8">
        <div className="mx-auto max-w-7xl space-y-4">
          <p className="text-red-400">{error}</p>

          <button
            onClick={() => navigate(-1)}
            className="rounded-lg border border-slate-700 px-4 py-2 text-white hover:bg-slate-800"
          >
            ← Back
          </button>
        </div>
      </main>
    );
  }

  /* ==========================================================
     LEAD NOT FOUND
  ========================================================== */

  if (!lead) {
    return (
      <main className="min-h-screen bg-slate-950 p-8">
        <div className="mx-auto max-w-7xl space-y-4">
          <p className="text-slate-400">
            Lead information could not be found.
          </p>

          <button
            onClick={() => navigate(-1)}
            className="rounded-lg border border-slate-700 px-4 py-2 text-white hover:bg-slate-800"
          >
            ← Back
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 p-8">
      <div className="mx-auto max-w-7xl space-y-8">

        {/* ======================================================
            NAVIGATION
        ====================================================== */}

        <button
          onClick={() => navigate(-1)}
          className="
            rounded-lg
            border
            border-slate-700
            px-4
            py-2
            text-white
            transition
            hover:bg-slate-800
          "
        >
          ← Back to Dashboard
        </button>

        {/* ======================================================
            CUSTOMER PROFILE
        ====================================================== */}

        <LeadHeader lead={lead} />

        {/* ======================================================
            QUALIFICATION SUMMARY
        ====================================================== */}

        <LeadInfoCard lead={lead} />

        {/* ======================================================
            AI QUALIFICATION ACTIONS
        ====================================================== */}

        <LeadActions lead={lead} />

        {/* ======================================================
            QUICK WORKSPACE NAVIGATION
        ====================================================== */}

        <div className="grid gap-4 md:grid-cols-3">

          {/* Conversation */}

          <button
            onClick={() => navigate(`/conversation/${id}`)}
            className="
              rounded-2xl
              border
              border-cyan-500/30
              bg-cyan-500/10
              p-5
              text-left
              transition
              hover:bg-cyan-500/20
            "
          >
            <p className="text-lg font-semibold text-cyan-300">
              💬 Conversation History
            </p>

            <p className="mt-2 text-sm text-slate-400">
              Read the complete AI conversation with this customer.
            </p>
          </button>

          {/* Contact */}

          <button
            onClick={() => navigate(`/contact/${id}`)}
            className="
              rounded-2xl
              border
              border-emerald-500/30
              bg-emerald-500/10
              p-5
              text-left
              transition
              hover:bg-emerald-500/20
            "
          >
            <p className="text-lg font-semibold text-emerald-300">
              📞 Contact Lead
            </p>

            <p className="mt-2 text-sm text-slate-400">
              Call the customer and record call outcomes.
            </p>
          </button>

          {/* AI Insights */}

          <button
            onClick={() => navigate(`/insights/${id}`)}
            className="
              rounded-2xl
              border
              border-purple-500/30
              bg-purple-500/10
              p-5
              text-left
              transition
              hover:bg-purple-500/20
            "
          >
            <p className="text-lg font-semibold text-purple-300">
              🤖 AI Insights
            </p>

            <p className="mt-2 text-sm text-slate-400">
              Understand why AI qualified this customer.
            </p>
          </button>

        </div>

        {/* ======================================================
            MAIN WORKSPACE
        ====================================================== */}

        <div className="grid gap-8 lg:grid-cols-3">

          {/* ==================================================
              LEFT COLUMN
          ================================================== */}

          <div className="space-y-8 lg:col-span-2">

            {/* Conversation Timeline */}

            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-white">
                💬 Conversation Timeline
              </h2>

              <ConversationHistory
                conversation={conversation}
              />
            </section>

          </div>

          {/* ==================================================
              RIGHT COLUMN
          ================================================== */}

          <div className="space-y-8">

            {/* ==================================================
                AGENT NOTES
            ================================================== */}

            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-white">
                📝 Agent Notes
              </h2>

              <FollowUpNotes
                lead={lead}
                refreshLead={refreshLead}
              />
            </section>

            {/* ==================================================
                FOLLOW-UP ACTIONS
            ================================================== */}

            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-white">
                📅 Follow-up Actions
              </h2>

              <FollowUpActions
                lead={lead}
                refreshLead={refreshLead}
              />
            </section>

            {/* ==================================================
                CALL HISTORY
            ================================================== */}

            <section
              className="
                rounded-2xl
                border
                border-slate-800
                bg-slate-900
                p-5
              "
            >
              <h2 className="mb-4 text-lg font-semibold text-white">
                📞 Call History
              </h2>

              {!lead.callHistory ||
              lead.callHistory.length === 0 ? (
                <p className="text-sm text-slate-400">
                  No calls have been recorded yet.
                </p>
              ) : (
                <div className="space-y-4">

                  {lead.callHistory
                    .slice()
                    .reverse()
                    .map((call, index) => (
                      <div
                        key={
                          call._id ||
                          call.id ||
                          index
                        }
                        className="
                          rounded-xl
                          border
                          border-slate-700
                          bg-slate-800
                          p-4
                        "
                      >
                        <div className="flex items-center justify-between gap-4">

                          <span className="font-semibold text-cyan-300">
                            {call.outcome || "Call"}
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
                          <p className="mt-3 text-sm text-slate-300">
                            {call.notes}
                          </p>
                        )}

                        {call.nextFollowUpDate && (
                          <p className="mt-3 text-sm text-emerald-400">
                            Follow-up:{" "}
                            {new Date(
                              call.nextFollowUpDate
                            ).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    ))}

                </div>
              )}
            </section>

            {/* ==================================================
                PROPERTY RECOMMENDATIONS
            ================================================== */}

            <section className="space-y-3">

              <h2 className="text-xl font-semibold text-white">
                🏡 Property Recommendations
              </h2>

              <PropertyRecommendations
                leadId={lead._id || id}
              />

            </section>

          </div>

        </div>

      </div>
    </main>
  );
};

export default LeadDetails;