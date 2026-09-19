/**
 * ==========================================================
 * Displays conversations currently assigned to the logged-in
 * sales agent.
 *
 * Unlike the admin dashboard, this component ONLY shows the
 * agent's own customer conversations requiring attention.
 *
 * Used By
 * ----------------------------------------------------------
 * AgentDashboard.jsx
 *
 * Future Backend
 * ----------------------------------------------------------
 * GET /api/agent/conversations
 *
 * Future Navigation
 * ----------------------------------------------------------
 * /agent/conversations/:conversationId
 *
 * ==========================================================
 */

import { useEffect, useState } from "react";

import { useNavigate } from "react-router-dom";

import {
  MessageSquare,
  Clock3,
  Flame,
  Bot,
  UserRound,
} from "lucide-react";

const ActiveConversations = () => {

  const navigate = useNavigate();

  //----------------------------------------------------------
  // STATE
  //----------------------------------------------------------

  const [conversations, setConversations] = useState([]);

  //----------------------------------------------------------
  // MOCK DATA
  //----------------------------------------------------------

  useEffect(() => {

    setConversations([

      {
        id: "C001",

        customerName: "James Mwangi",

        lastMessage:
          "I'd like to schedule a property viewing.",

        status: "Qualified",

        unread: 2,

        lastActivity: "12 mins ago",

      },

      {
        id: "C002",

        customerName: "Sarah Achieng",

        lastMessage:
          "Can you negotiate the asking price?",

        status: "Hot Lead",

        unread: 1,

        lastActivity: "2 mins ago",

      },

      {
        id: "C003",

        customerName: "David Otieno",

        lastMessage:
          "Do you have similar apartments available?",

        status: "New Lead",

        unread: 0,

        lastActivity: "1 hour ago",

      },

      {
        id: "C004",

        customerName: "Grace Wambui",

        lastMessage:
          "Please send me more property photos.",

        status: "Qualified",

        unread: 3,

        lastActivity: "25 mins ago",

      },

    ]);

  }, []);

  //----------------------------------------------------------
  // SUMMARY
  //----------------------------------------------------------

  const totalConversations = conversations.length;

  const unreadMessages = conversations.reduce(

    (total, conversation) =>
      total + (conversation.unread || 0),

    0

  );

  //----------------------------------------------------------
  // STATUS COLORS
  //----------------------------------------------------------

  const statusStyles = (status) => {

    switch (status) {

      case "Hot Lead":
        return "bg-red-500/10 border-red-500/20 text-red-400";

      case "Qualified":
        return "bg-emerald-500/10 border-emerald-500/20 text-emerald-400";

      default:
        return "bg-cyan-500/10 border-cyan-500/20 text-cyan-400";

    }

  };

  //----------------------------------------------------------
  // RENDER
  //----------------------------------------------------------

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

      {/*======================================================
        HEADER
      ======================================================*/}

      <div className="border-b border-slate-800 p-6">

        <div className="flex items-center justify-between">

          <div>

            <h2 className="flex items-center gap-2 text-2xl font-bold text-white">

              <MessageSquare className="text-cyan-400" />

              Active Conversations

            </h2>

            <p className="mt-2 text-sm text-slate-400">

              Customers currently assigned to you requiring attention.

            </p>

          </div>

          <button
            onClick={() => navigate("/agent/conversations")}
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
            View All
          </button>

        </div>

      </div>

      {/*======================================================
        SUMMARY
      ======================================================*/}

      <div
        className="
          grid
          gap-5
          p-6
          md:grid-cols-2
        "
      >

        <div
          className="
            rounded-2xl
            border
            border-slate-700
            bg-slate-950
            p-5
          "
        >

          <p className="text-sm text-slate-400">

            Active Conversations

          </p>

          <h3 className="mt-3 text-4xl font-bold text-white">

            {totalConversations}

          </h3>

        </div>

        <div
          className="
            rounded-2xl
            border
            border-orange-500/20
            bg-orange-500/10
            p-5
          "
        >

          <p className="text-sm text-orange-300">

            Unread Messages

          </p>

          <h3 className="mt-3 text-4xl font-bold text-white">

            {unreadMessages}

          </h3>

        </div>

      </div>

      {/*======================================================
        CONVERSATION LIST
      ======================================================*/}

      <div className="px-6 pb-6">

        <h3 className="mb-5 text-lg font-semibold text-white">

          Your Conversations

        </h3>

        <div className="space-y-4">

          {conversations.length === 0 ? (

            <div
              className="
                rounded-2xl
                border
                border-slate-700
                bg-slate-800
                p-6
                text-center
                text-slate-400
              "
            >

              No active conversations assigned.

            </div>

          ) : (

            conversations.map((conversation) => (

              <div
                key={conversation.id}
                className="
                  flex
                  flex-col
                  gap-5
                  rounded-2xl
                  border
                  border-slate-700
                  bg-slate-800
                  p-5
                  transition
                  hover:border-cyan-500/30
                  lg:flex-row
                  lg:items-center
                  lg:justify-between
                "
              >

                {/* Left */}

                <div className="flex items-start gap-5">

                  <div
                    className="
                      flex
                      h-14
                      w-14
                      items-center
                      justify-center
                      rounded-2xl
                      bg-cyan-500/10
                    "
                  >

                    <UserRound
                      size={24}
                      className="text-cyan-400"
                    />

                  </div>

                  <div>

                    <div className="flex items-center gap-3">

                      <h4
                        className="
                          text-lg
                          font-semibold
                          text-white
                        "
                      >

                        {conversation.customerName}

                      </h4>

                      <span
                        className={`
                          rounded-full
                          border
                          px-3
                          py-1
                          text-xs
                          font-semibold
                          ${statusStyles(conversation.status)}
                        `}
                      >

                        {conversation.status === "Hot Lead" ? (
                          <span className="flex items-center gap-1">
                            <Flame size={12} />
                            {conversation.status}
                          </span>
                        ) : (
                          <span className="flex items-center gap-1">
                            <Bot size={12} />
                            {conversation.status}
                          </span>
                        )}

                      </span>

                    </div>

                    <p
                      className="
                        mt-3
                        max-w-xl
                        text-sm
                        text-slate-400
                      "
                    >

                      {conversation.lastMessage}

                    </p>

                    <div
                      className="
                        mt-3
                        flex
                        items-center
                        gap-2
                        text-xs
                        text-slate-500
                      "
                    >

                      <Clock3 size={14} />

                      {conversation.lastActivity}

                    </div>

                  </div>

                </div>

                {/* Right */}

                <div className="flex items-center gap-4">

                  {conversation.unread > 0 && (

                    <div
                      className="
                        flex
                        h-10
                        w-10
                        items-center
                        justify-center
                        rounded-full
                        bg-red-500
                        text-sm
                        font-bold
                        text-white
                      "
                    >

                      {conversation.unread}

                    </div>

                  )}

                  <div
                    className="
                      flex
                      flex-wrap
                      gap-3
                    "
                  >

                    <button
                      onClick={() =>
                        navigate(
                          `/agent/conversations/${conversation.id}`
                        )
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

                      Open Conversation

                    </button>

                    <button
                      onClick={() =>
                        navigate(
                          `/agent/leads/${conversation.id}`
                        )
                      }
                      className="
                        rounded-xl
                        border
                        border-slate-600
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

                      View Lead

                    </button>

                  </div>

                </div>

              </div>

            ))

          )}

        </div>

      </div>

      {/*======================================================
        FOOTER
      ======================================================*/}

      <div
        className="
          flex
          flex-col
          gap-4
          border-t
          border-slate-800
          p-6
          lg:flex-row
          lg:items-center
          lg:justify-between
        "
      >

        <p
          className="
            text-sm
            text-slate-400
          "
        >
          Stay responsive to customers. LeadFlow AI highlights
          qualified and hot conversations so you can prioritize
          the prospects most likely to convert into successful
          property sales.
        </p>

        <button
          onClick={() =>
            navigate("/agent/conversations")
          }
          className="
            inline-flex
            items-center
            gap-2
            rounded-xl
            bg-violet-500
            px-6
            py-3
            text-sm
            font-semibold
            text-white
            transition
            hover:bg-violet-400
          "
        >

          Conversation Workspace →

        </button>

      </div>

    </section>

  );

};

export default ActiveConversations;