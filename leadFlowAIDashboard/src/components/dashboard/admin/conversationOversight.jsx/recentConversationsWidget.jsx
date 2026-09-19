/**
 * ==========================================================
 *
 * PURPOSE
 * ----------------------------------------------------------
 * Reusable dashboard widget shown on:
 *
 * • Admin Dashboard
 * • Agent Dashboard
 * • Home Dashboard
 *
 * Shows ONLY:
 * • Most recent conversations across the agency requiring administrator visibility.
 * 
 * NOT intended to display the full conversation history.
 *
 * ==========================================================
 */

import { useNavigate } from "react-router-dom";
import useConversations from "../../../../hooks/useConversations";

const RecentConversations = () => {
  const navigate = useNavigate();

  const {
    conversations,
    loading,
  } = useConversations();

  // Dashboard preview only
  const preview = conversations.slice(0, 5);

  const getStatusStyles = (status) => {
    switch (status) {
      case "Hot Lead":
        return "bg-red-500/20 text-red-400";

      case "Qualified":
        return "bg-emerald-500/20 text-emerald-400";

      case "AI Escalated":
        return "bg-red-500/20 text-red-400";

      case "Awaiting Agent":
        return "bg-yellow-500/20 text-yellow-400";

      case "Resolved":
        return "bg-green-500/20 text-green-400";

      default:
        return "bg-orange-500/20 text-orange-400";
    }
  };

  if (loading) {
    return (
      <section className="rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-xl">
        <p className="text-sm text-slate-400">
          Loading recent conversations...
        </p>
      </section>
    );
  }

  return (
    <section
      className="
        rounded-3xl
        border
        border-slate-800
        bg-slate-900
        shadow-xl
      "
    >
      {/* Header */}

      <div className="flex items-center justify-between border-b border-slate-800 p-6">

        <div>

          <h2 className="text-xl font-bold text-white">
            💬 Conversation Oversight
          </h2>

         <p className="mt-1 text-sm text-slate-400">
            Monitor the latest customer conversations across the agency.
         </p>

        </div>

        <button
          onClick={() => navigate("/conversations")}
          className="
            rounded-lg
            bg-cyan-500
            px-4
            py-2
            text-sm
            font-semibold
            text-slate-950
            hover:bg-cyan-400
          "
        >
          Open Conversation Center
        </button>

      </div>

      {/* Body */}

      <div className="divide-y divide-slate-800">

        {preview.length === 0 ? (

          <div className="p-6 text-center text-slate-400">
            No conversations yet.
          </div>

        ) : (

          preview.map((conversation) => (

            <div
              key={conversation._id}
              className="
                flex
                items-center
                justify-between
                p-5
                hover:bg-slate-800/40
              "
            >

              <div className="space-y-1">

                <h3 className="font-semibold text-white">
                  {conversation.customerName ||
                    conversation.customer ||
                    "Unknown Customer"}
                </h3>

                <p className="text-xs text-cyan-400">
                 Agent: {conversation.agentName || "Unassigned"}
                </p>

                <p className="text-sm text-slate-400 line-clamp-1">
                  {conversation.lastMessage ||
                    conversation.messages?.at(-1)?.text ||
                    "No recent message"}
                </p>

                <p className="text-xs text-slate-500">
                  {conversation.updatedAt
                    ? new Date(
                        conversation.updatedAt
                      ).toLocaleString()
                    : conversation.time || ""}
                </p>

              </div>

              <div className="flex flex-col items-end gap-3">

                <span
                  className={`
                    rounded-full
                    px-3
                    py-1
                    text-xs
                    font-semibold
                    ${getStatusStyles(conversation.status)}
                  `}
                >
                  {conversation.status || "New"}
                </span>

                <button
                  onClick={() =>
                    navigate(
                      navigate(`/admin/conversations/${conversation._id}`)
                    )
                  }
                  className="
                    rounded-lg
                    bg-slate-800
                    px-3
                    py-2
                    text-xs
                    text-white
                    hover:bg-slate-700
                  "
                >
                  Audit
                </button>

              </div>

            </div>

          ))

        )}

      </div>

    </section>
  );
};

export default RecentConversations;