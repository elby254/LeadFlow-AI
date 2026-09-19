/**
 * ==========================================================
 * Displays recent messages received from property agents.
 *
 * Gives viewers quick access to:
 *
 * • Property updates
 * • Viewing confirmations
 * • Price negotiations
 * • Follow-up conversations
 *
 * Used by:
 * • Viewer Conversation Workspace
 *
 * Future Backend
 * ----------------------------------------------------------
 * GET /api/viewer/agent-messages
 *
 * Future Enhancements
 * ----------------------------------------------------------
 * • AI message summaries
 * • Smart replies
 * • Priority inbox
 * • Message translation
 * • Property-specific notifications
 *
 * ==========================================================
 */

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  User,
  Building2,
  MessageCircle,
  Clock3,
} from "lucide-react";

const AgentMessages = () => {

  //----------------------------------------------------------
  // Navigation
  //----------------------------------------------------------

  const navigate = useNavigate();

  //----------------------------------------------------------
  // State
  //----------------------------------------------------------

  const [messages, setMessages] = useState([]);

  const [loading, setLoading] = useState(true);

  //----------------------------------------------------------
  // Mock Data
  //----------------------------------------------------------

  useEffect(() => {

    // Temporary mock data
    // Replace with:
    // GET /api/viewer/agent-messages

    setTimeout(() => {

      setMessages([

        {
          _id: "msg001",

          conversationId: "conv001",

          propertyId: "property001",

          propertyName: "Luxury 4 Bedroom Villa",

          agentName: "Grace Wanjiru",

          message:
            "Good morning. The property is still available. Would tomorrow at 10:00 AM work for a viewing?",

          createdAt: "2026-07-20T09:15:00Z",

          status: "Unread",
        },

        {
          _id: "msg002",

          conversationId: "conv002",

          propertyId: "property002",

          propertyName: "Modern Apartment",

          agentName: "David Mwangi",

          message:
            "The seller has reduced the asking price. Let me know if you'd like an updated quotation.",

          createdAt: "2026-07-19T16:45:00Z",

          status: "Read",
        },

        {
          _id: "msg003",

          conversationId: "conv003",

          propertyId: "property003",

          propertyName: "Executive Penthouse",

          agentName: "Anne Njeri",

          message:
            "Your viewing appointment has been confirmed for Friday afternoon.",

          createdAt: "2026-07-18T14:20:00Z",

          status: "Unread",
        },

      ]);

      setLoading(false);

    }, 700);

  }, []);

  //----------------------------------------------------------
  // Navigation Helpers
  //----------------------------------------------------------

  const openConversation = (conversationId) => {
    navigate(`/viewer/conversations/${conversationId}`);
  };

  //----------------------------------------------------------
  // Badge Styles
  //----------------------------------------------------------

  const getStatusStyles = (status) => {

    switch (status) {

      case "Unread":
        return "bg-cyan-500/20 text-cyan-300 border-cyan-500/20";

      case "Read":
        return "bg-slate-700 text-slate-300 border-slate-600";

      default:
        return "bg-slate-700 text-slate-300 border-slate-600";

    }

  };

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
          p-6
          shadow-xl
        "
      >

        <p className="text-sm text-slate-400">

          Loading agent messages...

        </p>

      </section>

    );

  }

  //----------------------------------------------------------
  // Component
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
              text-2xl
              font-bold
              text-white
            "
          >

            <MessageCircle
              size={24}
              className="text-cyan-400"
            />

            Agent Messages

          </h2>

          <p
            className="
              mt-2
              text-sm
              text-slate-400
            "
          >

            Stay updated with responses from your property agents.

          </p>

        </div>

        <div
          className="
            rounded-full
            border
            border-cyan-500/20
            bg-cyan-500/10
            px-5
            py-3
          "
        >

          <p className="text-xs text-cyan-300">

            Unread

          </p>

          <p
            className="
              text-2xl
              font-bold
              text-white
            "
          >

            {
              messages.filter(
                (message) =>
                  message.status === "Unread"
              ).length
            }

          </p>

        </div>

      </div>

      {/*======================================================
        MESSAGE LIST
      ======================================================*/}

      <div className="space-y-5 p-6">

        {messages.map((message) => (

          <article
            key={message._id}
            className="
              rounded-2xl
              border
              border-slate-800
              bg-slate-950
              p-5
              transition-all
              duration-300
              hover:border-cyan-500/40
              hover:shadow-lg
              hover:shadow-cyan-900/20
            "
          >

            {/* Top Row */}

            <div
              className="
                flex
                items-start
                justify-between
              "
            >

              <div
                className="
                  flex
                  items-start
                  gap-4
                "
              >

                {/* Avatar */}

                <div
                  className="
                    flex
                    h-14
                    w-14
                    items-center
                    justify-center
                    rounded-2xl
                    bg-cyan-500
                  "
                >

                  <User
                    size={24}
                    className="text-white"
                  />

                </div>

                {/* Agent Info */}

                <div>

                  <h3
                    className="
                      text-lg
                      font-bold
                      text-white
                    "
                  >

                    {message.agentName}

                  </h3>

                  <div
                    className="
                      mt-2
                      flex
                      items-center
                      gap-2
                      text-sm
                      text-slate-400
                    "
                  >

                    <Building2 size={16} />

                    {message.propertyName}

                  </div>

                </div>

              </div>

              {/* Status */}

              <span
                className={`
                  rounded-full
                  border
                  px-3
                  py-1
                  text-xs
                  font-semibold
                  ${getStatusStyles(message.status)}
                `}
              >

                {message.status}

              </span>

            </div>

            {/* Message */}

            <div
              className="
                mt-5
                rounded-xl
                border
                border-slate-800
                bg-slate-900
                p-4
              "
            >

              <p
                className="
                  text-sm
                  leading-7
                  text-slate-300
                "
              >

                {message.message}

              </p>

            </div>

            {/* Time */}

            <div
              className="
                mt-4
                flex
                items-center
                gap-2
                text-xs
                text-slate-500
              "
            >

              <Clock3 size={15} />

              {new Date(
                message.createdAt
              ).toLocaleString()}

            </div>

            {/*======================================================
              ACTIONS
            ======================================================*/}

            <div className="mt-5 flex gap-3">

              <button
                onClick={() =>
                  openConversation(
                    message.conversationId
                  )
                }
                className="
                  flex-1
                  rounded-xl
                  bg-cyan-500
                  px-4
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

            </div>

          </article>

        ))}

        {/*======================================================
          EMPTY STATE
        ======================================================*/}

        {messages.length === 0 && (

          <div
            className="
              rounded-2xl
              border
              border-slate-800
              bg-slate-950
              p-10
              text-center
            "
          >

            <MessageCircle
              size={42}
              className="
                mx-auto
                text-slate-600
              "
            />

            <h3
              className="
                mt-4
                text-xl
                font-semibold
                text-white
              "
            >

              No Agent Messages

            </h3>

            <p
              className="
                mt-2
                text-sm
                text-slate-400
              "
            >

              You haven't received any messages from
              property agents yet.

            </p>

          </div>

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

          Keep track of property updates, viewing confirmations,
          negotiations, and follow-ups from your assigned agents.

        </p>

        <button
          onClick={() =>
            navigate("/viewer/conversations")
          }
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

          View All Messages →

        </button>

      </div>

    </section>

  );

};

export default AgentMessages;