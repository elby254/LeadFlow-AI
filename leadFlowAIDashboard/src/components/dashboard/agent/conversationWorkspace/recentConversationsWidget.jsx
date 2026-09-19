/**
 * ==========================================================
 * Compact conversation preview widget used inside the
 * Agent Conversation Workspace.
 *
 * Displays only the most recent conversations assigned to
 * the logged-in sales agent.
 *
 * Unlike ActiveConversations.jsx, this component is intended
 * to be a lightweight preview for quick navigation.
 *
 * Displays
 * ----------------------------------------------------------
 * • Customer name
 * • Last message preview
 * • AI qualification status
 * • Last activity
 * • Unread message count
 *
 * Used By
 * ----------------------------------------------------------
 * ConversationWorkspace.jsx
 *
 * Future Backend
 * ----------------------------------------------------------
 * GET /api/agent/conversations/recent
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
  UserRound,
  Flame,
  Bot,
} from "lucide-react";

const RecentConversationsWidget = () => {

  const navigate = useNavigate();

  //----------------------------------------------------------
  // STATE
  //----------------------------------------------------------

  const [recentConversations, setRecentConversations] =
    useState([]);

  //----------------------------------------------------------
  // MOCK DATA
  //----------------------------------------------------------

  useEffect(() => {

    setRecentConversations([

      {
        id: "CONV001",

        customerName: "James Mwangi",

        lastMessage:
          "I'd like to schedule a viewing this afternoon.",

        status: "Qualified",

        unread: 2,

        lastActivity: "12 mins ago",

      },

      {
        id: "CONV002",

        customerName: "Sarah Achieng",

        lastMessage:
          "Can we negotiate the purchase price?",

        status: "Hot Lead",

        unread: 1,

        lastActivity: "5 mins ago",

      },

      {
        id: "CONV003",

        customerName: "David Otieno",

        lastMessage:
          "Please send me similar listings.",

        status: "New Lead",

        unread: 0,

        lastActivity: "35 mins ago",

      },

      {
        id: "CONV004",

        customerName: "Grace Wambui",

        lastMessage:
          "I have received the property brochure.",

        status: "Qualified",

        unread: 0,

        lastActivity: "1 hour ago",

      },

      {
        id: "CONV005",

        customerName: "Peter Kamau",

        lastMessage:
          "Looking forward to tomorrow's viewing.",

        status: "Hot Lead",

        unread: 3,

        lastActivity: "2 mins ago",

      },

    ]);

  }, []);

  //----------------------------------------------------------
  // SHOW ONLY LATEST FIVE
  //----------------------------------------------------------

  const conversations = recentConversations.slice(0, 5);

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

      <div
        className="
          flex
          items-center
          justify-between
          border-b
          border-slate-800
          p-6
        "
      >

        <div>

          <h2
            className="
              flex
              items-center
              gap-2
              text-xl
              font-bold
              text-white
            "
          >

            <MessageSquare className="text-cyan-400" />

            Recent Conversations

          </h2>

          <p
            className="
              mt-2
              text-sm
              text-slate-400
            "
          >

            Jump back into your latest customer interactions.

          </p>

        </div>

        <button
          onClick={() =>
            navigate("/agent/conversations")
          }
          className="
            rounded-xl
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

          View All

        </button>

      </div>

      {/*======================================================
        CONVERSATION LIST
      ======================================================*/}

      <div className="divide-y divide-slate-800">

        {conversations.length === 0 ? (

          <div
            className="
              p-8
              text-center
              text-slate-400
            "
          >

            No recent conversations available.

          </div>

        ) : (

          conversations.map((conversation) => (

            <div
              key={conversation.id}
              className="
                flex
                items-center
                justify-between
                p-5
                transition
                hover:bg-slate-800/40
              "
            >

              {/* Left */}

              <div className="flex items-start gap-4">

                <div
                  className="
                    flex
                    h-12
                    w-12
                    items-center
                    justify-center
                    rounded-xl
                    bg-cyan-500/10
                  "
                >

                  <UserRound
                    size={22}
                    className="text-cyan-400"
                  />

                </div>

                <div>

                  <div className="flex items-center gap-3">

                    <h3
                      className="
                        font-semibold
                        text-white
                      "
                    >

                      {conversation.customerName}

                    </h3>

                    <span
                      className={`
                        rounded-full
                        border
                        px-3
                        py-1
                        text-xs
                        font-semibold
                        ${statusStyles(
                          conversation.status
                        )}
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
                      mt-2
                      max-w-md
                      text-sm
                      text-slate-400
                      line-clamp-1
                    "
                  >

                    {conversation.lastMessage}

                  </p>

                  <div
                    className="
                      mt-2
                      flex
                      items-center
                      gap-2
                      text-xs
                      text-slate-500
                    "
                  >

                    <Clock3 size={13} />

                    {conversation.lastActivity}

                  </div>

                </div>

              </div>

              {/* Right */}

              <div
                className="
                  flex
                  items-center
                  gap-3
                "
              >

                {conversation.unread > 0 && (

                  <span
                    className="
                      flex
                      h-8
                      min-w-8
                      items-center
                      justify-center
                      rounded-full
                      bg-red-500
                      px-2
                      text-xs
                      font-bold
                      text-white
                    "
                  >

                    {conversation.unread}

                  </span>

                )}

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

                  Open

                </button>

              </div>

            </div>

          ))

        )}

      </div>

      {/*======================================================
        FOOTER
      ======================================================*/}

      <div
        className="
          flex
          items-center
          justify-between
          border-t
          border-slate-800
          p-6
        "
      >

        <p
          className="
            text-sm
            text-slate-400
          "
        >

          Quickly resume your latest customer conversations.
          LeadFlow AI keeps your most active interactions
          readily available so you never miss an opportunity
          to move a prospect toward a property viewing or
          successful sale.

        </p>

        <button
          onClick={() =>
            navigate("/agent/conversations")
          }
          className="
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

          Open Workspace →

        </button>

      </div>

    </section>

  );

};

export default RecentConversationsWidget;













































