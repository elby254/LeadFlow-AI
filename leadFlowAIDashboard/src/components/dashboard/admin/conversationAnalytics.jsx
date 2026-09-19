/**
 * ==========================================================
 *
 * Admin analytics dashboard for conversations.
 *
 * Used In
 * ----------------------------------------------------------
 * • Admin Dashboard
 * • Analytics Center
 * • Executive Reports
 *
 * Backend
 * ----------------------------------------------------------
 * GET /api/admin/conversations/analytics
 *
 * ==========================================================
 */

import {
  MessageSquare,
  Activity,
  Clock3,
  Bot,
  Users,
  RefreshCw,
  Loader2,
  AlertTriangle,
} from "lucide-react";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import analyticsService from "../../services/analyticsService";

const ConversationAnalytics = () => {

  /*=========================================================
      STATE
  =========================================================*/

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [analytics, setAnalytics] = useState({});

  const [search, setSearch] = useState("");

  const [dateRange, setDateRange] =
    useState("Last 30 Days");

  /*=========================================================
      LOAD ANALYTICS
  =========================================================*/

  const loadAnalytics = async () => {

    try {

      setLoading(true);

      setError("");

      const response =
        await analyticsService.getConversationAnalytics({
          dateRange,
        });

      setAnalytics(response || {});

    } catch (err) {

      console.error(err);

      setError(
        "Unable to load conversation analytics."
      );

      setAnalytics({});

    } finally {

      setLoading(false);

    }

  };

  useEffect(() => {

    loadAnalytics();

  }, [dateRange]);

  /*=========================================================
      OVERVIEW
  =========================================================*/

  const overview =
    analytics.overview || {};

  const kpis = useMemo(() => ({

    totalConversations:
      overview.totalConversations ?? 0,

    activeConversations:
      overview.activeConversations ?? 0,

    averageResponseTime:
      overview.averageResponseTime ?? "--",

    aiHandled:
      overview.aiHandled ?? 0,

    humanHandled:
      overview.humanHandled ?? 0,

    resolutionRate:
      overview.resolutionRate ?? 0,

  }), [overview]);

  /*=========================================================
      COMPONENT
  =========================================================*/

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

      {/*=====================================================
          HEADER
      =====================================================*/}

      <div
        className="
          flex
          items-center
          justify-between
          border-b
          border-slate-800
          bg-gradient-to-r
          from-cyan-600/10
          to-indigo-600/10
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

            <Activity
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

              Conversation Analytics

            </h2>

            <p
              className="
                text-sm
                text-slate-400
              "
            >

              AI & agent conversation insights

            </p>

          </div>

        </div>

        <button
          onClick={loadAnalytics}
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

            <RefreshCw
              className="
                h-5
                w-5
                text-cyan-400
              "
            />
          )}

        </button>

      </div>

      {/*=====================================================
          ERROR
      =====================================================*/}

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
            p-5
          "
        >

          <AlertTriangle
            className="
              mt-1
              h-5
              w-5
              text-red-400
            "
          />

          <div>

            <p
              className="
                text-sm
                text-red-300
              "
            >

              {error}

            </p>

            <button
              onClick={loadAnalytics}
              className="
                mt-4
                rounded-lg
                bg-red-500
                px-4
                py-2
                text-xs
                font-semibold
                text-white
                transition
                hover:bg-red-400
              "
            >

              Retry

            </button>

          </div>

        </div>

      )}

      {/*=====================================================
          LOADING
      =====================================================*/}

      {loading && (

        <div className="space-y-5 p-6">

          {[1, 2, 3, 4].map((item) => (

            <div
              key={item}
              className="
                h-28
                animate-pulse
                rounded-3xl
                bg-slate-800
              "
            />

          ))}

        </div>

      )}

      {/*=====================================================
          OVERVIEW KPI CARDS
      =====================================================*/}

      {!loading && !error && (

        <div className="p-8">

          <div
            className="
              grid
              gap-5
              sm:grid-cols-2
              xl:grid-cols-3
            "
          >

            {/* Total Conversations */}

            <div
              className="
                rounded-2xl
                border
                border-slate-800
                bg-slate-950/40
                p-6
              "
            >

              <div className="flex items-center gap-3">

                <MessageSquare className="h-5 w-5 text-cyan-400" />

                <p className="text-xs uppercase tracking-wide text-slate-500">

                  Total Conversations

                </p>

              </div>

              <h3
                className="
                  mt-4
                  text-3xl
                  font-bold
                  text-white
                "
              >

                {kpis.totalConversations}

              </h3>

            </div>

            {/* Active */}

            <div
              className="
                rounded-2xl
                border
                border-emerald-500/20
                bg-emerald-500/5
                p-6
              "
            >

              <div className="flex items-center gap-3">

                <Users className="h-5 w-5 text-emerald-400" />

                <p className="text-xs uppercase tracking-wide text-emerald-300">

                  Active Conversations

                </p>

              </div>

              <h3
                className="
                  mt-4
                  text-3xl
                  font-bold
                  text-emerald-400
                "
              >

                {kpis.activeConversations}

              </h3>

            </div>

            {/* Response Time */}

            <div
              className="
                rounded-2xl
                border
                border-amber-500/20
                bg-amber-500/5
                p-6
              "
            >

              <div className="flex items-center gap-3">

                <Clock3 className="h-5 w-5 text-amber-400" />

                <p className="text-xs uppercase tracking-wide text-amber-300">

                  Avg Response Time

                </p>

              </div>

              <h3
                className="
                  mt-4
                  text-3xl
                  font-bold
                  text-amber-400
                "
              >

                {kpis.averageResponseTime}

              </h3>

            </div>

          </div>

        </div>

      )}

      {/*=====================================================
          FILTERS
      =====================================================*/}

      {!loading && !error && (

        <div
          className="
            border-t
            border-b
            border-slate-800
            p-6
          "
        >

          <div
            className="
              flex
              flex-col
              gap-4
              lg:flex-row
            "
          >

            {/*==============================================
                SEARCH
            ==============================================*/}

            <div className="flex-1">

              <input
                type="text"
                placeholder="Search conversations, agent..."
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
                className="
                  w-full
                  rounded-2xl
                  border
                  border-slate-700
                  bg-slate-950
                  px-5
                  py-3
                  text-sm
                  text-white
                  placeholder:text-slate-500
                  outline-none
                  transition
                  focus:border-cyan-500
                "
              />

            </div>

            {/*==============================================
                DATE RANGE
            ==============================================*/}

            <div>

              <select
                value={dateRange}
                onChange={(e) =>
                  setDateRange(e.target.value)
                }
                className="
                  rounded-2xl
                  border
                  border-slate-700
                  bg-slate-950
                  px-5
                  py-3
                  text-sm
                  text-white
                  outline-none
                  transition
                  focus:border-cyan-500
                "
              >

                <option>Today</option>
                <option>Last 7 Days</option>
                <option>Last 30 Days</option>
                <option>Last 90 Days</option>
                <option>This Year</option>

              </select>

            </div>

          </div>

        </div>

      )}

      {/*=====================================================
          ANALYTICS SUMMARY
      =====================================================*/}

      {!loading && !error && (

        <div className="p-8">

          <div
            className="
              grid
              gap-5
              sm:grid-cols-2
              xl:grid-cols-3
            "
          >

            {/* AI Replies */}

            <div
              className="
                rounded-2xl
                border
                border-cyan-500/20
                bg-cyan-500/5
                p-6
              "
            >

              <div className="flex items-center gap-3">

                <Bot className="h-5 w-5 text-cyan-400" />

                <p
                  className="
                    text-xs
                    uppercase
                    tracking-wide
                    text-cyan-300
                  "
                >

                  AI Replies

                </p>

              </div>

              <h3
                className="
                  mt-4
                  text-3xl
                  font-bold
                  text-cyan-400
                "
              >

                {kpis.aiHandled}

              </h3>

            </div>

            {/* Human Replies */}

            <div
              className="
                rounded-2xl
                border
                border-violet-500/20
                bg-violet-500/5
                p-6
              "
            >

              <div className="flex items-center gap-3">

                <Users
                  className="
                    h-5
                    w-5
                    text-violet-400
                  "
                />

                <p
                  className="
                    text-xs
                    uppercase
                    tracking-wide
                    text-violet-300
                  "
                >

                  Human Replies

                </p>

              </div>

              <h3
                className="
                  mt-4
                  text-3xl
                  font-bold
                  text-violet-400
                "
              >

                {kpis.humanHandled}

              </h3>

            </div>

            {/* Resolution Rate */}

            <div
              className="
                rounded-2xl
                border
                border-emerald-500/20
                bg-emerald-500/5
                p-6
              "
            >

              <div className="flex items-center gap-3">

                <Activity
                  className="
                    h-5
                    w-5
                    text-emerald-400
                  "
                />

                <p
                  className="
                    text-xs
                    uppercase
                    tracking-wide
                    text-emerald-300
                  "
                >

                  Resolution Rate

                </p>

              </div>

              <h3
                className="
                  mt-4
                  text-3xl
                  font-bold
                  text-emerald-400
                "
              >

                {kpis.resolutionRate}%

              </h3>

              {/* Progress */}

              <div
                className="
                  mt-5
                  h-2
                  overflow-hidden
                  rounded-full
                  bg-slate-800
                "
              >

                <div
                  className="
                    h-full
                    rounded-full
                    bg-emerald-500
                    transition-all
                    duration-700
                  "
                  style={{
                    width: `${kpis.resolutionRate}%`,
                  }}
                />

              </div>

            </div>

          </div>

        </div>

      )}

      {/*=====================================================
          CONVERSATION TRENDS
      =====================================================*/}

      {!loading && !error && (

        <div
          className="
            border-t
            border-slate-800
            p-8
          "
        >

          <div
            className="
              grid
              gap-6
              xl:grid-cols-2
            "
          >

            {/*==============================================
                Conversation Volume Trend
            ==============================================*/}

            <div
              className="
                rounded-3xl
                border
                border-slate-800
                bg-slate-950/40
                p-6
              "
            >

              <div
                className="
                  flex
                  items-center
                  justify-between
                "
              >

                <div>

                  <h3
                    className="
                      text-lg
                      font-semibold
                      text-white
                    "
                  >

                    Conversation Volume

                  </h3>

                  <p
                    className="
                      mt-1
                      text-sm
                      text-slate-400
                    "
                  >

                    Daily conversation trend

                  </p>

                </div>

                <Activity
                  className="
                    h-6
                    w-6
                    text-cyan-400
                  "
                />

              </div>

              <div
                className="
                  mt-8
                  flex
                  h-72
                  items-center
                  justify-center
                  rounded-2xl
                  border
                  border-dashed
                  border-slate-700
                  bg-slate-900/50
                "
              >

                <p
                  className="
                    text-sm
                    text-slate-500
                  "
                >

                  Conversation Trend Chart

                  <br />

                  (Recharts / Chart.js)

                </p>

              </div>

            </div>

            {/*==============================================
                Channel Distribution
            ==============================================*/}

            <div
              className="
                rounded-3xl
                border
                border-slate-800
                bg-slate-950/40
                p-6
              "
            >

              <div
                className="
                  flex
                  items-center
                  justify-between
                "
              >

                <div>

                  <h3
                    className="
                      text-lg
                      font-semibold
                      text-white
                    "
                  >

                    Channel Distribution

                  </h3>

                  <p
                    className="
                      mt-1
                      text-sm
                      text-slate-400
                    "
                  >

                    Conversation source breakdown

                  </p>

                </div>

                <MessageSquare
                  className="
                    h-6
                    w-6
                    text-violet-400
                  "
                />

              </div>

              <div
                className="
                  mt-8
                  flex
                  h-72
                  items-center
                  justify-center
                  rounded-2xl
                  border
                  border-dashed
                  border-slate-700
                  bg-slate-900/50
                "
              >

                <p
                  className="
                    text-sm
                    text-slate-500
                  "
                >

                  Pie / Doughnut Chart

                  <br />

                  WhatsApp • SMS • Website • Facebook

                </p>

              </div>

            </div>

          </div>

        </div>

      )}

      {/*=====================================================
          RESPONSE TIME + PEAK HOURS
      =====================================================*/}

      {!loading && !error && (

        <div
          className="
            border-t
            border-slate-800
            p-8
          "
        >

          <div
            className="
              grid
              gap-6
              xl:grid-cols-2
            "
          >

            {/*==============================================
                Response Time Trend
            ==============================================*/}

            <div
              className="
                rounded-3xl
                border
                border-slate-800
                bg-slate-950/40
                p-6
              "
            >

              <div
                className="
                  flex
                  items-center
                  justify-between
                "
              >

                <div>

                  <h3
                    className="
                      text-lg
                      font-semibold
                      text-white
                    "
                  >

                    Response Time Trend

                  </h3>

                  <p
                    className="
                      mt-1
                      text-sm
                      text-slate-400
                    "
                  >

                    AI vs Human response speed

                  </p>

                </div>

                <Clock3
                  className="
                    h-6
                    w-6
                    text-amber-400
                  "
                />

              </div>

              <div
                className="
                  mt-8
                  flex
                  h-72
                  items-center
                  justify-center
                  rounded-2xl
                  border
                  border-dashed
                  border-slate-700
                  bg-slate-900/50
                "
              >

                <p
                  className="
                    text-sm
                    text-slate-500
                  "
                >

                  Response Time Line Chart

                </p>

              </div>

            </div>

            {/*==============================================
                Peak Activity
            ==============================================*/}

            <div
              className="
                rounded-3xl
                border
                border-slate-800
                bg-slate-950/40
                p-6
              "
            >

              <div
                className="
                  flex
                  items-center
                  justify-between
                "
              >

                <div>

                  <h3
                    className="
                      text-lg
                      font-semibold
                      text-white
                    "
                  >

                    Peak Activity Hours

                  </h3>

                  <p
                    className="
                      mt-1
                      text-sm
                      text-slate-400
                    "
                  >

                    Highest customer engagement

                  </p>

                </div>

                <Clock3
                  className="
                    h-6
                    w-6
                    text-emerald-400
                  "
                />

              </div>

              <div
                className="
                  mt-8
                  flex
                  h-72
                  items-center
                  justify-center
                  rounded-2xl
                  border
                  border-dashed
                  border-slate-700
                  bg-slate-900/50
                "
              >

                <p
                  className="
                    text-sm
                    text-slate-500
                  "
                >

                  Hourly Activity Bar Chart

                </p>

              </div>

            </div>

          </div>

        </div>

      )}

      {/*=====================================================
          AGENT PERFORMANCE
      =====================================================*/}

      {!loading && !error && (

        <div
          className="
            border-t
            border-slate-800
            p-8
          "
        >

          <div
            className="
              grid
              gap-6
              xl:grid-cols-[2fr_1fr]
            "
          >

            {/*==============================================
                AGENT PERFORMANCE TABLE
            ==============================================*/}

            <div
              className="
                overflow-hidden
                rounded-3xl
                border
                border-slate-800
                bg-slate-950/40
              "
            >

              <div
                className="
                  border-b
                  border-slate-800
                  p-6
                "
              >

                <h3
                  className="
                    text-lg
                    font-semibold
                    text-white
                  "
                >

                  Agent Performance

                </h3>

                <p
                  className="
                    mt-1
                    text-sm
                    text-slate-400
                  "
                >

                  Conversation handling metrics

                </p>

              </div>

              <div className="overflow-x-auto">

                <table className="min-w-full">

                  <thead
                    className="
                      bg-slate-900
                    "
                  >

                    <tr>

                      <th
                        className="
                          px-6
                          py-4
                          text-left
                          text-xs
                          uppercase
                          tracking-wide
                          text-slate-500
                        "
                      >

                        Agent

                      </th>

                      <th
                        className="
                          px-6
                          py-4
                          text-center
                          text-xs
                          uppercase
                          tracking-wide
                          text-slate-500
                        "
                      >

                        Conversations

                      </th>

                      <th
                        className="
                          px-6
                          py-4
                          text-center
                          text-xs
                          uppercase
                          tracking-wide
                          text-slate-500
                        "
                      >

                        Avg Response

                      </th>

                      <th
                        className="
                          px-6
                          py-4
                          text-center
                          text-xs
                          uppercase
                          tracking-wide
                          text-slate-500
                        "
                      >

                        Resolution

                      </th>

                    </tr>

                  </thead>

                  <tbody>

                    {(analytics.agentPerformance || []).map((agent) => (

                      <tr
                        key={agent.id}
                        className="
                          border-t
                          border-slate-800
                          hover:bg-slate-800/40
                        "
                      >

                        <td
                          className="
                            px-6
                            py-5
                          "
                        >

                          <div>

                            <p
                              className="
                                font-semibold
                                text-white
                              "
                            >

                              {agent.name}

                            </p>

                            <p
                              className="
                                text-sm
                                text-slate-500
                              "
                            >

                              {agent.role}

                            </p>

                          </div>

                        </td>

                        <td
                          className="
                            px-6
                            py-5
                            text-center
                            font-semibold
                            text-cyan-300
                          "
                        >

                          {agent.conversations}

                        </td>

                        <td
                          className="
                            px-6
                            py-5
                            text-center
                            text-white
                          "
                        >

                          {agent.responseTime}

                        </td>

                        <td
                          className="
                            px-6
                            py-5
                            text-center
                            font-semibold
                            text-emerald-400
                          "
                        >

                          {agent.resolutionRate}%

                        </td>

                      </tr>

                    ))}

                  </tbody>

                </table>

              </div>

            </div>

            {/*==============================================
                AI INSIGHTS
            ==============================================*/}

            <div
              className="
                rounded-3xl
                border
                border-cyan-500/20
                bg-cyan-500/5
                p-6
              "
            >

              <div
                className="
                  flex
                  items-center
                  gap-3
                "
              >

                <Bot
                  className="
                    h-6
                    w-6
                    text-cyan-400
                  "
                />

                <h3
                  className="
                    text-lg
                    font-semibold
                    text-cyan-300
                  "
                >

                  AI Insights

                </h3>

              </div>

              <div className="mt-6 space-y-5">

                {(analytics.aiInsights || []).length === 0 ? (

                  <p
                    className="
                      text-sm
                      leading-7
                      text-slate-300
                    "
                  >

                    No AI insights available.

                  </p>

                ) : (

                  analytics.aiInsights.map((insight, index) => (

                    <div
                      key={index}
                      className="
                        rounded-2xl
                        border
                        border-cyan-500/20
                        bg-slate-900/40
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

                        {insight}

                      </p>

                    </div>

                  ))

                )}

              </div>

            </div>

          </div>

        </div>

      )}

      {/*=====================================================
          FOOTER
      =====================================================*/}

      {!loading && !error && (

        <div
          className="
            border-t
            border-slate-800
            bg-slate-950/40
            p-6
          "
        >

          <div
            className="
              flex
              flex-col
              gap-3
              text-sm
              text-slate-500
              md:flex-row
              md:items-center
              md:justify-between
            "
          >

            {/* Summary */}

            <div>

              Showing analytics for

              <span
                className="
                  ml-2
                  font-semibold
                  text-cyan-300
                "
              >

                {dateRange}

              </span>

            </div>

            {/* Last Updated */}

            <div
              className="
                flex
                items-center
                gap-6
              "
            >

              <span>

                Last Updated:

                {" "}

                <span
                  className="
                    font-semibold
                    text-white
                  "
                >

                  {analytics.lastUpdated ||
                    "Just now"}

                </span>

              </span>

              <button
                onClick={loadAnalytics}
                disabled={loading}
                className="
                  rounded-xl
                  border
                  border-cyan-500/30
                  bg-cyan-500/10
                  px-4
                  py-2
                  text-xs
                  font-semibold
                  text-cyan-300
                  transition
                  hover:bg-cyan-500
                  hover:text-slate-950
                  disabled:cursor-not-allowed
                  disabled:opacity-50
                "
              >

                {loading ? (

                  <Loader2
                    className="
                      h-4
                      w-4
                      animate-spin
                    "
                  />

                ) : (

                  "Refresh Analytics"

                )}

              </button>

            </div>

          </div>

        </div>

      )}

    </aside>

  );

};

export default ConversationAnalytics;

