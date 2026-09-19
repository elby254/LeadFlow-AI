/**
 * ==========================================================
 *
 * VIEWER PROPERTY PANEL
 * ----------------------------------------------------------
 * Displays ONLY conversations that belong to the currently
 * authenticated viewer.
 *
 * Every conversation is tied to ONE property and ONE agent.
 *
 * The backend is responsible for filtering conversations
 * using the logged-in viewer's identity.
 *
 * Future Backend
 * ----------------------------------------------------------
 * GET /api/viewer/conversations/recent
 *
 * Returns ONLY:
 *
 * req.user.id conversations
 *
 * [
 *   {
 *      conversationId,
 *      property,
 *      agent,
 *      latestMessage,
 *      unreadCount,
 *      conversationStatus,
 *      updatedAt
 *   }
 * ]
 *
 * This component NEVER displays conversations belonging
 * to other viewers.
 *
 * ==========================================================
 */

import { useNavigate } from "react-router-dom";

import {
  Home,
  User,
  MessageCircle,
  Clock3,
  MapPin,
} from "lucide-react";

import useConversations from "../../../../hooks/useConversations";

const RecentConversations = () => {

  //----------------------------------------------------------
  // Navigation
  //----------------------------------------------------------

  const navigate = useNavigate();

  //----------------------------------------------------------
  // Viewer Conversations
  //----------------------------------------------------------

  /**
   * Backend already returns ONLY the
   * authenticated viewer's conversations.
   *
   * No client-side filtering required.
   */

  const {

    conversations = [],

    loading,

  } = useConversations();

  //----------------------------------------------------------
  // Property Conversations
  //----------------------------------------------------------

  const propertyConversations = [...conversations]

    .sort(

      (a, b) =>

        new Date(b.updatedAt || b.createdAt) -
        new Date(a.updatedAt || a.createdAt)

    )

    .slice(0, 5);

  //----------------------------------------------------------
  // Helpers
  //----------------------------------------------------------

  const formatDate = (date) => {

    if (!date) return "";

    return new Date(date).toLocaleString();

  };

  //----------------------------------------------------------
  // Conversation Status
  //----------------------------------------------------------

  const getStatusStyles = (status) => {

    switch (status) {

      case "Awaiting Your Reply":

        return "bg-orange-500/10 border-orange-500/20 text-orange-300";

      case "Viewing Confirmed":

        return "bg-emerald-500/10 border-emerald-500/20 text-emerald-300";

      case "Offer In Progress":

        return "bg-violet-500/10 border-violet-500/20 text-violet-300";

      case "Agent Replied":

        return "bg-cyan-500/10 border-cyan-500/20 text-cyan-300";

      default:

        return "bg-slate-700 border-slate-600 text-slate-300";

    }

  };

  //----------------------------------------------------------
  // Loading
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

          Loading your property conversations...

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
              gap-3
              text-2xl
              font-bold
              text-white
            "
          >

            <MessageCircle
              size={24}
              className="text-cyan-400"
            />

            Your Property Conversations

          </h2>

          <p
            className="
              mt-2
              text-sm
              text-slate-400
            "
          >

            Continue conversations with the property agents
            helping you buy, rent or invest.

          </p>

        </div>

        <button
          onClick={() =>
            navigate("/viewer/conversations")
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

          Conversation Center

        </button>

      </div>

      {/*======================================================
        PROPERTY CONVERSATIONS
      ======================================================*/}

      <div className="divide-y divide-slate-800">

        {propertyConversations.length === 0 ? (

          <div
            className="
              p-10
              text-center
            "
          >

            <MessageCircle
              size={46}
              className="
                mx-auto
                text-slate-600
              "
            />

            <h3
              className="
                mt-5
                text-xl
                font-semibold
                text-white
              "
            >

              No Property Conversations

            </h3>

            <p
              className="
                mt-2
                text-sm
                text-slate-400
              "
            >

              Conversations with property agents will
              appear here after you enquire about a listing.

            </p>

          </div>

        ) : (

          propertyConversations.map((conversation) => (

            <article
              key={
                conversation._id ||
                conversation.conversationId
              }
              className="
                p-6
                transition
                hover:bg-slate-800/30
              "
            >

              <div
                className="
                  flex
                  items-start
                  justify-between
                  gap-6
                "
              >

                {/*====================================
                  PROPERTY INFORMATION
                ====================================*/}

                <div
                  className="
                    flex
                    flex-1
                    items-start
                    gap-5
                  "
                >

                  {/* Property Thumbnail */}

                  <div
                    className="
                      flex
                      h-20
                      w-20
                      items-center
                      justify-center
                      overflow-hidden
                      rounded-2xl
                      bg-slate-800
                    "
                  >

                    {conversation.property?.image ? (

                      <img
                        src={conversation.property.image}
                        alt={
                          conversation.property.name
                        }
                        className="
                          h-full
                          w-full
                          object-cover
                        "
                      />

                    ) : (

                      <Home
                        size={30}
                        className="text-slate-500"
                      />

                    )}

                  </div>

                  {/* Property Details */}

                  <div className="flex-1">

                    <h3
                      className="
                        text-lg
                        font-bold
                        text-white
                      "
                    >

                      {conversation.property?.name ||
                        "Property"}

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

                      <MapPin size={15} />

                      {conversation.property?.location ||
                        "Location unavailable"}

                    </div>

                    {/* Agent */}

                    <div
                      className="
                        mt-4
                        flex
                        items-center
                        gap-3
                      "
                    >

                      <div
                        className="
                          flex
                          h-10
                          w-10
                          items-center
                          justify-center
                          rounded-full
                          bg-cyan-500
                        "
                      >

                        <User
                          size={18}
                          className="text-white"
                        />

                      </div>

                      <div>

                        <p
                          className="
                            text-sm
                            font-semibold
                            text-white
                          "
                        >

                          {conversation.agent?.name ||
                            conversation.agentName ||
                            "Property Agent"}

                        </p>

                        <p
                          className="
                            text-xs
                            text-slate-500
                          "
                        >

                          Property Consultant

                        </p>

                      </div>

                    </div>

                  </div>

                </div>

                {/*====================================
                  CONVERSATION SUMMARY
                ====================================*/}

                <div
                  className="
                    w-full
                    max-w-sm
                    space-y-4
                  "
                >

                  {/* Conversation Status */}

                  <div>

                    <span
                      className={`
                        inline-flex
                        rounded-full
                        border
                        px-3
                        py-1
                        text-xs
                        font-semibold
                        ${getStatusStyles(
                          conversation.conversationStatus
                        )}
                      `}
                    >

                      {conversation.conversationStatus ||
                        "Active Conversation"}

                    </span>

                  </div>

                  {/* Latest Message */}

                  <div
                    className="
                      rounded-xl
                      border
                      border-slate-800
                      bg-slate-950
                      p-4
                    "
                  >

                    <p
                      className="
                        mb-2
                        text-xs
                        font-semibold
                        uppercase
                        tracking-wide
                        text-slate-500
                      "
                    >

                      Latest Message

                    </p>

                    <p
                      className="
                        line-clamp-3
                        text-sm
                        leading-7
                        text-slate-300
                      "
                    >

                      {conversation.latestMessage?.sender === "agent"
                        ? `${conversation.agent?.name || "Agent"}: `
                        : "You: "}

                      {conversation.latestMessage?.text ||
                        "No recent messages."}

                    </p>

                  </div>

                  {/* Metadata */}

                  <div
                    className="
                      flex
                      items-center
                      justify-between
                    "
                  >

                    <div
                      className="
                        flex
                        items-center
                        gap-2
                        text-xs
                        text-slate-500
                      "
                    >

                      <Clock3 size={15} />

                      {formatDate(
                        conversation.updatedAt ||
                        conversation.createdAt
                      )}

                    </div>

                    {conversation.unreadCount > 0 && (

                      <div
                        className="
                          rounded-full
                          bg-cyan-500
                          px-3
                          py-1
                          text-xs
                          font-semibold
                          text-slate-950
                        "
                      >

                        {conversation.unreadCount} New

                      </div>

                    )}

                  </div>

                  {/* Actions */}

                  <div className="flex gap-3">

                    <button
                      onClick={() =>
                        navigate(
                          `/viewer/conversations/${
                            conversation._id ||
                            conversation.conversationId
                          }`
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

                      Continue Chat

                    </button>

                    <button
                      onClick={() =>
                        navigate(
                          `/viewer/properties/${
                            conversation.property?._id ||
                            conversation.propertyId
                          }`
                        )
                      }
                      className="
                        rounded-xl
                        border
                        border-slate-700
                        bg-slate-800
                        px-4
                        py-3
                        text-sm
                        font-semibold
                        text-white
                        transition
                        hover:bg-slate-700
                      "
                    >

                      View Property

                    </button>

                  </div>

                </div>

              </div>

            </article>

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

          Your conversations stay linked to each property,
          making it easy to continue discussions, arrange
          viewings and monitor your buying journey.

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

          Open Conversation Center →

        </button>

      </div>

    </section>

  );

};

export default RecentConversations;