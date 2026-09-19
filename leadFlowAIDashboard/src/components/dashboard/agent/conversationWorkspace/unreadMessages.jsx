/**
 * ==========================================================
 * Displays all customer conversations that contain unread
 * messages for the currently logged-in sales agent.
 *
 * This allows agents to quickly identify conversations
 * requiring immediate attention.
 *
 * Displays
 * ----------------------------------------------------------
 * • Customer name
 * • Number of unread messages
 * • Last unread message preview
 * • Time received
 * • AI qualification status
 *
 * Used By
 * ----------------------------------------------------------
 * ConversationWorkspace.jsx
 *
 * Future Backend
 * ----------------------------------------------------------
 * GET /api/agent/conversations/unread
 *
 * Navigation
 * ----------------------------------------------------------
 * /agent/conversations/:conversationId
 *
 * ==========================================================
 */

import { useEffect, useState } from "react";

import { useNavigate } from "react-router-dom";

import {
  Mail,
  UserRound,
  Clock3,
  Flame,
  Bot,
} from "lucide-react";

const UnreadMessages = () => {

  const navigate = useNavigate();

  //----------------------------------------------------------
  // STATE
  //----------------------------------------------------------

  const [unreadMessages, setUnreadMessages] =
    useState([]);

  //----------------------------------------------------------
  // MOCK DATA
  //----------------------------------------------------------

  useEffect(() => {

    setUnreadMessages([

      {
        id: "CONV021",

        customerName: "James Mwangi",

        unread: 3,

        lastMessage:
          "Can we schedule a viewing tomorrow morning?",

        receivedAt: "8 mins ago",

        status: "Hot Lead",

      },

      {
        id: "CONV022",

        customerName: "Faith Njeri",

        unread: 1,

        lastMessage:
          "Please send me the payment options.",

        receivedAt: "15 mins ago",

        status: "Qualified",

      },

      {
        id: "CONV023",

        customerName: "Brian Otieno",

        unread: 5,

        lastMessage:
          "I'm interested in similar apartments around Kilimani.",

        receivedAt: "22 mins ago",

        status: "New Lead",

      },

    ]);

  }, []);

  //----------------------------------------------------------
  // STATUS BADGES
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

            <Mail className="text-cyan-400" />

            Unread Messages

          </h2>

          <p
            className="
              mt-2
              text-sm
              text-slate-400
            "
          >

            Customer conversations waiting for your response.

          </p>

        </div>

        <div
          className="
            rounded-full
            border
            border-cyan-500/20
            bg-cyan-500/10
            px-4
            py-2
          "
        >

          <p className="text-xs text-cyan-300">

            Total Unread

          </p>

          <p
            className="
              text-lg
              font-bold
              text-white
            "
          >

            {unreadMessages.reduce(
              (sum, conversation) =>
                sum + conversation.unread,
              0
            )}

          </p>

        </div>

      </div>

      {/*======================================================
        MESSAGE LIST
      ======================================================*/}

      <div className="divide-y divide-slate-800">

        {unreadMessages.length === 0 ? (

          <div
            className="
              p-8
              text-center
              text-slate-400
            "
          >

            🎉 No unread customer messages.

          </div>

        ) : (

          unreadMessages.map((conversation) => (

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
                    rounded-full
                    bg-cyan-500/10
                  "
                >

                  <UserRound
                    size={22}
                    className="text-cyan-400"
                  />

                </div>

                <div>

                  <h3
                    className="
                      font-semibold
                      text-white
                    "
                  >

                    {conversation.customerName}

                  </h3>

                  <p
                    className="
                      mt-2
                      max-w-lg
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
                      gap-3
                    "
                  >

                    <span
                      className="
                        flex
                        items-center
                        gap-1
                        text-xs
                        text-slate-500
                      "
                    >

                      <Clock3 size={13} />

                      {conversation.receivedAt}

                    </span>

                    <span
                      className={`
                        inline-flex
                        items-center
                        gap-1
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

                      {conversation.status ===
                      "Hot Lead" ? (

                        <Flame size={12} />

                      ) : (

                        <Bot size={12} />

                      )}

                      {conversation.status}

                    </span>

                  </div>

                </div>

              </div>

              {/* Right */}

              <div
                className="
                  flex
                  flex-col
                  items-end
                  gap-4
                "
              >

                {/* Unread Count */}

                <div
                  className="
                    flex
                    h-10
                    min-w-[42px]
                    items-center
                    justify-center
                    rounded-full
                    bg-red-500
                    px-3
                    text-sm
                    font-bold
                    text-white
                  "
                >

                  {conversation.unread}

                </div>

                {/* Open Conversation */}

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
                    py-2.5
                    text-sm
                    font-semibold
                    text-slate-950
                    transition
                    hover:bg-cyan-400
                  "
                >

                  Reply →

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

          Responding quickly improves customer engagement,
          increases property viewing bookings, and helps
          convert qualified prospects into successful sales.

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

export default UnreadMessages;