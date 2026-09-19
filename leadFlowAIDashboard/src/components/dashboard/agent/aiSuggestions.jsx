/**
 * ==========================================================
 * Central AI Copilot panel for real estate agents.
 *
 * Displays AI-generated recommendations to help agents:
 *
 * ✓ Reply faster
 * ✓ Recommend properties
 * ✓ Understand customer intent
 * ✓ Improve conversion
 * ✓ Schedule follow-ups
 *
 * This component NEVER calls AI directly.
 * It consumes data from useAISuggestions().
 *
 * Used By
 * ----------------------------------------------------------
 * Conversation Center
 * Lead Details
 * Agent Dashboard
 *
 * Hook
 * ----------------------------------------------------------
 * useAISuggestions()
 *
 * Backend
 * ----------------------------------------------------------
 * POST /api/ai/replies
 * POST /api/ai/property-match
 * POST /api/ai/summary
 * POST /api/ai/lead-insight
 * POST /api/ai/sentiment
 * POST /api/ai/next-action
 *
 * ==========================================================
 */

import { useState } from "react";

import {

  Bot,

  Sparkles,

  RotateCw,

  ChevronDown,

  ChevronUp,

  AlertTriangle,

  Loader2,

} from "lucide-react";

import useAISuggestions from "../../../hooks/useAISuggestions";

const AISuggestions = ({

  conversationId,

  lead,

  messages = [],

  properties = [],

  availability,

  onInsertReply,

  onInsertProperty,

}) => {

  /* ========================================================
     AI HOOK
  ======================================================== */

  const {

    aiEnabled,

    loading,

    error,

    refreshAI,

    smartReplies,

    recommendedProperties,

    leadInsight,

    conversationSummary,

    nextBestAction,

    sentiment,

    followUpSuggestions,

    viewingSuggestions,

  } = useAISuggestions();

  /* ========================================================
     COLLAPSIBLE PANELS
  ======================================================== */

  const [

    expanded,

    setExpanded,

  ] = useState({

    replies: true,

    summary: true,

    properties: true,

    insight: true,

    sentiment: true,

    nextAction: true,

    followUp: true,

  });

  /* ========================================================
     TOGGLE PANEL
  ======================================================== */

  const toggleSection = (section) => {

    setExpanded((previous) => ({

      ...previous,

      [section]: !previous[section],

    }));

  };

  /* ========================================================
     REFRESH AI
  ======================================================== */

  const handleRefresh = () => {

    refreshAI(

      conversationId,

      messages,

      lead,

      properties,

      availability

    );

  };

  /* ========================================================
     EMPTY
  ======================================================== */

  if (!aiEnabled) {

    return (

      <aside
        className="
          rounded-3xl
          border
          border-slate-800
          bg-slate-900
          p-8
          shadow-xl
        "
      >

        <div className="text-center">

          <Bot
            className="
              mx-auto
              h-14
              w-14
              text-slate-600
            "
          />

          <h2
            className="
              mt-5
              text-xl
              font-bold
              text-white
            "
          >

            AI Assistant Disabled

          </h2>

          <p
            className="
              mt-3
              text-sm
              leading-7
              text-slate-400
            "
          >

            AI recommendations are currently
            unavailable.

          </p>

        </div>

      </aside>

    );

  }

  /* ========================================================
     COMPONENT
  ======================================================== */

  return (

    <aside
      className="
        overflow-hidden
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
          bg-gradient-to-r
          from-cyan-600/10
          to-blue-600/10
          p-6
        "
      >

        <div
          className="
            flex
            items-center
            gap-4
          "
        >

          <div
            className="
              flex
              h-12
              w-12
              items-center
              justify-center
              rounded-2xl
              bg-cyan-500/10
            "
          >

            <Sparkles
              className="
                h-6
                w-6
                text-cyan-400
              "
            />

          </div>

          <div>

            <h2
              className="
                text-xl
                font-bold
                text-white
              "
            >

              AI Assistant

            </h2>

            <p
              className="
                text-sm
                text-slate-400
              "
            >

              Smart recommendations for this lead

            </p>

          </div>

        </div>

        <button
          onClick={handleRefresh}
          disabled={loading}
          className="
            rounded-xl
            border
            border-slate-700
            bg-slate-800
            p-3
            transition
            hover:border-cyan-500/40
            hover:bg-slate-700
            disabled:cursor-not-allowed
            disabled:opacity-50
          "
        >

          {loading ? (

            <Loader2
              className="
                h-5
                w-5
                animate-spin
                text-cyan-400
              "
            />

          ) : (

            <RotateCw
              className="
                h-5
                w-5
                text-cyan-400
              "
            />

          )}

        </button>

      </div>

      {/*======================================================
        ERROR
      ======================================================*/}

      {error && (

        <div
          className="
            m-6
            flex
            items-start
            gap-3
            rounded-2xl
            border
            border-red-500/20
            bg-red-500/10
            p-4
          "
        >

          <AlertTriangle
            className="
              mt-0.5
              h-5
              w-5
              text-red-400
            "
          />

          <p
            className="
              text-sm
              text-red-300
            "
          >

            {error}

          </p>

        </div>

      )}

      {/*======================================================
        LOADING SKELETON
      ======================================================*/}

      {loading && (

        <div className="space-y-4 p-6">

          {[1, 2, 3, 4].map((item) => (

            <div
              key={item}
              className="
                h-24
                animate-pulse
                rounded-2xl
                bg-slate-800
              "
            />

          ))}

        </div>

      )}

      {/*======================================================
        SMART REPLIES
      ======================================================*/}

      {!loading && (

        <div className="border-t border-slate-800">

          <button
            onClick={() => toggleSection("replies")}
            className="
              flex
              w-full
              items-center
              justify-between
              p-6
              transition
              hover:bg-slate-800/40
            "
          >

            <div className="flex items-center gap-3">

              <Bot
                className="
                  h-5
                  w-5
                  text-cyan-400
                "
              />

              <h3
                className="
                  text-lg
                  font-semibold
                  text-white
                "
              >

                Smart Replies

              </h3>

              <span
                className="
                  rounded-full
                  bg-cyan-500/10
                  px-3
                  py-1
                  text-xs
                  font-semibold
                  text-cyan-300
                "
              >

                {smartReplies.length}

              </span>

            </div>

            {expanded.replies ? (

              <ChevronUp
                className="
                  h-5
                  w-5
                  text-slate-400
                "
              />

            ) : (

              <ChevronDown
                className="
                  h-5
                  w-5
                  text-slate-400
                "
              />

            )}

          </button>

          {expanded.replies && (

            <div className="space-y-4 px-6 pb-6">

              {smartReplies.length === 0 ? (

                <div
                  className="
                    rounded-2xl
                    border
                    border-slate-800
                    bg-slate-950/40
                    p-5
                    text-sm
                    text-slate-400
                  "
                >

                  No reply suggestions available.

                </div>

              ) : (

                smartReplies.map((reply, index) => (

                  <div
                    key={index}
                    className="
                      rounded-2xl
                      border
                      border-slate-800
                      bg-slate-950/40
                      p-5
                    "
                  >

                    <p
                      className="
                        text-sm
                        leading-7
                        text-slate-300
                      "
                    >

                      {reply.text || reply}

                    </p>

                    <div
                      className="
                        mt-5
                        flex
                        flex-wrap
                        gap-3
                      "
                    >

                      <button
                        onClick={() =>
                          onInsertReply?.(
                            reply.text || reply
                          )
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

                        Use Reply

                      </button>

                      <button
                        onClick={() =>
                          navigator.clipboard.writeText(
                            reply.text || reply
                          )
                        }
                        className="
                          rounded-xl
                          border
                          border-slate-700
                          bg-slate-800
                          px-4
                          py-2
                          text-sm
                          font-semibold
                          text-white
                          transition
                          hover:bg-slate-700
                        "
                      >

                        Copy

                      </button>

                    </div>

                  </div>

                ))

              )}

            </div>

          )}

        </div>

      )}

      {/*======================================================
        CONVERSATION SUMMARY
      ======================================================*/}

      {!loading && (

        <div className="border-t border-slate-800">

          <button
            onClick={() => toggleSection("summary")}
            className="
              flex
              w-full
              items-center
              justify-between
              p-6
              transition
              hover:bg-slate-800/40
            "
          >

            <div className="flex items-center gap-3">

              <Sparkles
                className="
                  h-5
                  w-5
                  text-emerald-400
                "
              />

              <h3
                className="
                  text-lg
                  font-semibold
                  text-white
                "
              >

                Conversation Summary

              </h3>

            </div>

            {expanded.summary ? (

              <ChevronUp
                className="
                  h-5
                  w-5
                  text-slate-400
                "
              />

            ) : (

              <ChevronDown
                className="
                  h-5
                  w-5
                  text-slate-400
                "
              />

            )}

          </button>

          {expanded.summary && (

            <div className="px-6 pb-6">

              <div
                className="
                  rounded-2xl
                  border
                  border-slate-800
                  bg-slate-950/40
                  p-5
                "
              >

                {conversationSummary ? (

                  <p
                    className="
                      text-sm
                      leading-7
                      text-slate-300
                    "
                  >

                    {conversationSummary}

                  </p>

                ) : (

                  <p
                    className="
                      text-sm
                      text-slate-400
                    "
                  >

                    No summary available yet.

                  </p>

                )}

              </div>

            </div>

          )}

        </div>

      )}

      {/*======================================================
        PROPERTY RECOMMENDATIONS
      ======================================================*/}

      {!loading && (

        <div className="border-t border-slate-800">

          <button
            onClick={() => toggleSection("properties")}
            className="
              flex
              w-full
              items-center
              justify-between
              p-6
              transition
              hover:bg-slate-800/40
            "
          >

            <div className="flex items-center gap-3">

              <Sparkles
                className="
                  h-5
                  w-5
                  text-cyan-400
                "
              />

              <h3
                className="
                  text-lg
                  font-semibold
                  text-white
                "
              >

                Property Matches

              </h3>

              <span
                className="
                  rounded-full
                  bg-cyan-500/10
                  px-3
                  py-1
                  text-xs
                  font-semibold
                  text-cyan-300
                "
              >

                {recommendedProperties.length}

              </span>

            </div>

            {expanded.properties ? (
              <ChevronUp className="h-5 w-5 text-slate-400" />
            ) : (
              <ChevronDown className="h-5 w-5 text-slate-400" />
            )}

          </button>

          {expanded.properties && (

            <div className="space-y-4 px-6 pb-6">

              {recommendedProperties.length === 0 ? (

                <div
                  className="
                    rounded-2xl
                    border
                    border-slate-800
                    bg-slate-950/40
                    p-5
                    text-sm
                    text-slate-400
                  "
                >

                  No AI property recommendations available.

                </div>

              ) : (

                recommendedProperties.map((property) => (

                  <div
                    key={property.id}
                    className="
                      rounded-2xl
                      border
                      border-slate-800
                      bg-slate-950/40
                      p-5
                    "
                  >

                    <div className="flex items-center justify-between">

                      <div>

                        <h4 className="font-semibold text-white">

                          {property.title}

                        </h4>

                        <p className="mt-1 text-sm text-slate-400">

                          {property.location}

                        </p>

                      </div>

                      <span
                        className="
                          rounded-full
                          bg-emerald-500/10
                          px-3
                          py-1
                          text-xs
                          font-bold
                          text-emerald-300
                        "
                      >

                        {property.matchScore}% Match

                      </span>

                    </div>

                    <button
                      onClick={() =>
                        onInsertProperty?.(property)
                      }
                      className="
                        mt-4
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

                      Insert Into Chat

                    </button>

                  </div>

                ))

              )}

            </div>

          )}

        </div>

      )}

      {/*======================================================
        LEAD INSIGHT
      ======================================================*/}

      {!loading && (

        <div className="border-t border-slate-800">

          <button
            onClick={() => toggleSection("insight")}
            className="
              flex
              w-full
              items-center
              justify-between
              p-6
              transition
              hover:bg-slate-800/40
            "
          >

            <h3
              className="
                text-lg
                font-semibold
                text-white
              "
            >

              Lead Insight

            </h3>

            {expanded.insight ? (
              <ChevronUp className="h-5 w-5 text-slate-400" />
            ) : (
              <ChevronDown className="h-5 w-5 text-slate-400" />
            )}

          </button>

          {expanded.insight && (

            <div className="px-6 pb-6">

              <div
                className="
                  rounded-2xl
                  border
                  border-slate-800
                  bg-slate-950/40
                  p-5
                "
              >

                {leadInsight ? (

                  <pre
                    className="
                      whitespace-pre-wrap
                      text-sm
                      leading-7
                      text-slate-300
                    "
                  >

                    {typeof leadInsight === "string"
                      ? leadInsight
                      : JSON.stringify(leadInsight, null, 2)}

                  </pre>

                ) : (

                  <p className="text-sm text-slate-400">

                    No AI lead insight available.

                  </p>

                )}

              </div>

            </div>

          )}

        </div>

      )}

      {/*======================================================
        SENTIMENT ANALYSIS
      ======================================================*/}

      {!loading && (

        <div className="border-t border-slate-800">

          <button
            onClick={() => toggleSection("sentiment")}
            className="
              flex
              w-full
              items-center
              justify-between
              p-6
              transition
              hover:bg-slate-800/40
            "
          >

            <h3
              className="
                text-lg
                font-semibold
                text-white
              "
            >

              Conversation Sentiment

            </h3>

            {expanded.sentiment ? (
              <ChevronUp className="h-5 w-5 text-slate-400" />
            ) : (
              <ChevronDown className="h-5 w-5 text-slate-400" />
            )}

          </button>

          {expanded.sentiment && (

            <div className="px-6 pb-6">

              <div
                className="
                  rounded-2xl
                  border
                  border-slate-800
                  bg-slate-950/40
                  p-5
                "
              >

                {sentiment ? (

                  <div className="flex items-center justify-between">

                    <span className="text-white font-semibold">

                      {sentiment.label || sentiment}

                    </span>

                    {sentiment.confidence && (

                      <span
                        className="
                          rounded-full
                          bg-cyan-500/10
                          px-3
                          py-1
                          text-xs
                          font-bold
                          text-cyan-300
                        "
                      >

                        {sentiment.confidence}% Confidence

                      </span>

                    )}

                  </div>

                ) : (

                  <p className="text-sm text-slate-400">

                    No sentiment analysis available.

                  </p>

                )}

              </div>

            </div>

          )}

        </div>

      )}

      {/*======================================================
        NEXT BEST ACTION
      ======================================================*/}

      {!loading && (

        <div className="border-t border-slate-800">

          <button
            onClick={() => toggleSection("nextAction")}
            className="
              flex
              w-full
              items-center
              justify-between
              p-6
              transition
              hover:bg-slate-800/40
            "
          >

            <h3
              className="
                text-lg
                font-semibold
                text-white
              "
            >

              Next Best Action

            </h3>

            {expanded.nextAction ? (
              <ChevronUp className="h-5 w-5 text-slate-400" />
            ) : (
              <ChevronDown className="h-5 w-5 text-slate-400" />
            )}

          </button>

          {expanded.nextAction && (

            <div className="px-6 pb-6">

              <div
                className="
                  rounded-2xl
                  border
                  border-slate-800
                  bg-slate-950/40
                  p-5
                "
              >

                {nextBestAction ? (

                  <p
                    className="
                      text-sm
                      leading-7
                      text-slate-300
                    "
                  >

                    {nextBestAction}

                  </p>

                ) : (

                  <p className="text-sm text-slate-400">

                    AI has not suggested the next action yet.

                  </p>

                )}

              </div>

            </div>

          )}

        </div>

      )}

      {/*======================================================
        FOLLOW-UP SUGGESTIONS
      ======================================================*/}

      {!loading && (

        <div className="border-t border-slate-800">

          <button
            onClick={() => toggleSection("followUp")}
            className="
              flex
              w-full
              items-center
              justify-between
              p-6
              transition
              hover:bg-slate-800/40
            "
          >

            <h3
              className="
                text-lg
                font-semibold
                text-white
              "
            >

              Follow-up Suggestions

            </h3>

            {expanded.followUp ? (

              <ChevronUp className="h-5 w-5 text-slate-400" />

            ) : (

              <ChevronDown className="h-5 w-5 text-slate-400" />

            )}

          </button>

          {expanded.followUp && (

            <div className="space-y-4 px-6 pb-6">

              {followUpSuggestions?.length ? (

                followUpSuggestions.map(

                  (suggestion, index) => (

                    <div
                      key={index}
                      className="
                        rounded-2xl
                        border
                        border-slate-800
                        bg-slate-950/40
                        p-5
                      "
                    >

                      <p
                        className="
                          text-sm
                          leading-7
                          text-slate-300
                        "
                      >

                        {suggestion}

                      </p>

                    </div>

                  )

                )

              ) : (

                <div
                  className="
                    rounded-2xl
                    border
                    border-slate-800
                    bg-slate-950/40
                    p-5
                    text-sm
                    text-slate-400
                  "
                >

                  No follow-up suggestions available.

                </div>

              )}

            </div>

          )}

        </div>

      )}

      {/*======================================================
        VIEWING SUGGESTIONS
      ======================================================*/}

      {!loading &&
        viewingSuggestions?.length > 0 && (

        <div className="border-t border-slate-800">

          <div className="p-6">

            <h3
              className="
                text-lg
                font-semibold
                text-white
              "
            >

              Viewing Recommendations

            </h3>

            <div className="mt-5 space-y-4">

              {viewingSuggestions.map(

                (item, index) => (

                  <div
                    key={index}
                    className="
                      rounded-2xl
                      border
                      border-slate-800
                      bg-slate-950/40
                      p-5
                    "
                  >

                    <p
                      className="
                        text-sm
                        leading-7
                        text-slate-300
                      "
                    >

                      {item}

                    </p>

                  </div>

                )

              )}

            </div>

          </div>

        </div>

      )}

      {/*======================================================
        FOOTER ACTIONS
      ======================================================*/}

      {!loading && (

        <div
          className="
            flex
            flex-wrap
            items-center
            justify-between
            gap-4
            border-t
            border-slate-800
            bg-slate-950/40
            p-6
          "
        >

          <p
            className="
              text-sm
              text-slate-500
            "
          >

            AI suggestions are advisory and should be
            reviewed before sending to customers.

          </p>

          <button
            onClick={handleRefresh}
            disabled={loading}
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
              disabled:cursor-not-allowed
              disabled:opacity-50
            "
          >

            Refresh AI

          </button>

        </div>

      )}

    </aside>

  );

};

export default AISuggestions;