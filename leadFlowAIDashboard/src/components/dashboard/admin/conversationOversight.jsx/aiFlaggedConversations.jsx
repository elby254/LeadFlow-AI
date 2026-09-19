/**
 * ==========================================================
 * AI Flagged Conversations
 * ==========================================================
 *
 * ADMIN ONLY COMPONENT
 *
 * Displays conversations automatically flagged by LeadFlow AI
 * that require administrative review.
 *
 * AI Flags include:
 * -----------------------------------------
 * • Compliance violations
 * • Customer complaints
 * • Abusive language
 * • Escalation requests
 * • Low AI confidence
 * • Human review required
 *
 * Used By
 * -----------------------------------------
 * Admin Dashboard
 * Admin Conversation Center
 *
 * Future Backend
 * -----------------------------------------
 * GET /api/conversations/flagged
 *
 * Future Enhancements
 * -----------------------------------------
 * • Assign reviewer
 * • Resolve / dismiss flag
 * • View AI explanation
 * • Escalation timeline
 * • Compliance audit history
 * ==========================================================
 */

import { useNavigate } from "react-router-dom";

import {
  AlertTriangle,
  ShieldAlert,
  BrainCircuit,
  MessageSquareWarning,
} from "lucide-react";

import useConversations from "../../../../hooks/useConversations";

const AIFlaggedConversations = () => {

  const navigate = useNavigate();

  const {
    conversations = [],
    loading,
  } = useConversations();

  //----------------------------------------------------------
  // Loading State
  //----------------------------------------------------------

  if (loading) {

    return (

      <section
        className="
          rounded-3xl
          border
          border-slate-800
          bg-slate-900
          p-8
          shadow-xl
        "
      >

        <p className="text-sm text-slate-400">
          Loading AI oversight...
        </p>

      </section>

    );

  }

  //----------------------------------------------------------
  // AI Flag Extraction
  //----------------------------------------------------------

  const flaggedConversations = conversations

    .filter((conversation) =>

      conversation.aiFlagged === true ||

      conversation.requiresReview === true ||

      conversation.flagged === true ||

      conversation.status === "Flagged"

    )

    .sort(

      (a, b) =>

        new Date(b.updatedAt || b.createdAt) -

        new Date(a.updatedAt || a.createdAt)

    );

  //----------------------------------------------------------
  // Priority Counts
  //----------------------------------------------------------

  const criticalFlags = flaggedConversations.filter(

    (conversation) => conversation.priority === "Critical"

  );

  const highFlags = flaggedConversations.filter(

    (conversation) => conversation.priority === "High"

  );

  const mediumFlags = flaggedConversations.filter(

    (conversation) => conversation.priority === "Medium"

  );

  const lowFlags = flaggedConversations.filter(

    (conversation) => conversation.priority === "Low"

  );

  //----------------------------------------------------------
  // Dashboard Preview
  //----------------------------------------------------------

  const preview = flaggedConversations.slice(0, 5);

  return (

    <section
      className={`
        rounded-3xl
        border
        border-slate-800
        bg-slate-900
        p-8
        shadow-xl
      `}
    >

      {/* ======================================================
          FLAGGED CONVERSATIONS LIST
      ====================================================== */}

      <div className="px-6">

        <h3 className="mb-5 text-lg font-semibold text-white">
          Latest Flagged Conversations
        </h3>

        {preview.length === 0 ? (

          <div
            className="
              rounded-2xl
              border
              border-slate-700
              bg-slate-800
              p-8
              text-center
            "
          >

            <p className="text-slate-400">
              🎉 No conversations currently require AI review.
            </p>

          </div>

        ) : (

          <div className="space-y-4">

            {preview.map((conversation) => (

              <div
                key={conversation._id}
                className="
                  rounded-2xl
                  border
                  border-slate-700
                  bg-slate-800
                  p-5
                  transition-all
                  hover:border-cyan-500/30
                "
              >

                <div className="flex items-start justify-between">

                  {/* LEFT */}

                  <div className="flex-1">

                    <div className="flex items-center gap-3">

                      <h4 className="text-lg font-semibold text-white">

                        {conversation.customerName ||
                          conversation.lead?.name ||
                          "Unknown Customer"}

                      </h4>

                      <span
                        className={`
                          rounded-full
                          border
                          px-3
                          py-1
                          text-xs
                          font-semibold
                          ${getPriorityStyles(
                            conversation.priority
                          )}
                        `}
                      >
                        {conversation.priority || "Review"}
                      </span>

                    </div>

                    <p className="mt-3 text-sm text-slate-300">

                      {conversation.flagReason ||
                        "Conversation requires manual administrative review."}

                    </p>

                    <div className="mt-4 flex flex-wrap gap-5 text-xs text-slate-500">

                      <span>

                        👤 Assigned Agent:

                        <strong className="ml-1 text-slate-300">

                          {conversation.agentName ||
                            conversation.agent?.name ||
                            "Unknown"}

                        </strong>

                      </span>

                      <span>

                        💬 Status:

                        <strong className="ml-1 text-slate-300">

                          {conversation.status || "Open"}

                        </strong>

                      </span>

                      <span>

                        🕒

                        {conversation.updatedAt
                          ? new Date(
                              conversation.updatedAt
                            ).toLocaleString()
                          : ""}

                      </span>

                    </div>

                  </div>

                  {/* RIGHT ACTIONS */}

                  <div className="ml-6 flex flex-col gap-3">

                    <button
                      onClick={() =>
                        navigate(
                          `/admin/conversations/${conversation._id}`
                        )
                      }
                      className="
                        rounded-lg
                        bg-cyan-500
                        px-4
                        py-2
                        text-sm
                        font-semibold
                        text-slate-950
                        transition
                        hover:bg-cyan-400
                      "
                    >
                      Review
                    </button>

                    <button
                      onClick={() =>
                        navigate(
                          `/admin/leads/${
                            conversation.leadId ||
                            conversation.lead?._id
                          }`
                        )
                      }
                      className="
                        rounded-lg
                        border
                        border-slate-600
                        bg-slate-900
                        px-4
                        py-2
                        text-sm
                        text-slate-300
                        transition
                        hover:border-slate-500
                        hover:bg-slate-950
                      "
                    >
                      View Lead
                    </button>

                  </div>

                </div>

              </div>

            ))}

          </div>

        )}

      </div>

      {/* ======================================================
          ADMIN ACTIONS
      ====================================================== */}

      <div
        className="
          mt-6
          border-t
          border-slate-800
          p-6
        "
      >

        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

          <div>

            <h3 className="font-semibold text-white">
              Administrative Oversight
            </h3>

            <p className="mt-1 text-sm text-slate-400">
              Review flagged conversations before they escalate into customer
              complaints or compliance incidents.
            </p>

          </div>

          <div className="flex gap-3">

            <button
              onClick={() =>
                navigate("/admin/conversations")
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
              Review All
            </button>

            <button
              onClick={() =>
                navigate("/admin/reports")
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
              Generate Compliance Report
            </button>

          </div>

        </div>

      </div>

    </section>

  );

};

export default AIFlaggedConversations;