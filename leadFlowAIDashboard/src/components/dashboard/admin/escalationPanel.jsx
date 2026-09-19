/**
 * ==========================================================
 *
 * Admin dashboard for monitoring escalated customer
 * conversations and AI intervention requests.
 *
 * Backend
 * ----------------------------------------------------------
 * GET    /api/admin/escalations
 * GET    /api/admin/escalations/:id
 * PATCH  /api/admin/escalations/:id
 * POST   /api/admin/escalations/assign
 * POST   /api/admin/escalations/resolve
 *
 * ==========================================================
 */

import {
  AlertTriangle,
  ShieldAlert,
  Clock3,
  RefreshCw,
  Loader2,
  Users,
} from "lucide-react";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import escalationService from "../../services/escalationService";

const EscalationPanel = ({

  onViewCase,

  onAssignAgent,

  onResolveCase,

  onEscalateCase,

}) => {

  /*=========================================================
      STATE
  =========================================================*/

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [summary, setSummary] = useState({});

  const [escalations, setEscalations] = useState([]);

  const [search, setSearch] = useState("");

  const [statusFilter, setStatusFilter] =
    useState("All");

  /*=========================================================
      LOAD ESCALATIONS
  =========================================================*/

  const loadEscalations = async () => {

    try {

      setLoading(true);

      setError("");

      const response =
        await escalationService.getEscalations();

      setSummary(response.summary || {});

      setEscalations(
        Array.isArray(response.escalations)
          ? response.escalations
          : []
      );

    } catch (err) {

      console.error(err);

      setError(
        "Unable to load escalations."
      );

      setSummary({});

      setEscalations([]);

    } finally {

      setLoading(false);

    }

  };

  useEffect(() => {

    loadEscalations();

  }, []);

  /*=========================================================
      SUMMARY
  =========================================================*/

  const metrics = useMemo(() => ({

    total:
      summary.totalEscalations ?? 0,

    pending:
      summary.pending ?? 0,

    assigned:
      summary.assigned ?? 0,

    critical:
      summary.critical ?? 0,

    resolvedToday:
      summary.resolvedToday ?? 0,

    avgResolution:
      summary.averageResolutionTime ?? "--",

  }), [summary]);

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
          from-red-600/10
          to-orange-600/10
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
              bg-red-500/10
            "
          >

            <ShieldAlert
              className="
                h-6
                w-6
                text-red-400
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

              Escalation Center

            </h2>

            <p
              className="
                text-sm
                text-slate-400
              "
            >

              Critical customer case management

            </p>

          </div>

        </div>

        <button
          onClick={loadEscalations}
          disabled={loading}
          className="
            rounded-xl
            border
            border-slate-700
            bg-slate-800
            p-3
            transition
            hover:border-red-500/40
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
                text-red-400
              "
            />

          ) : (

            <RefreshCw
              className="
                h-5
                w-5
                text-red-400
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
              onClick={loadEscalations}
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

          {[1, 2, 3].map((item) => (

            <div
              key={item}
              className="
                h-32
                animate-pulse
                rounded-3xl
                bg-slate-800
              "
            />

          ))}

        </div>

      )}

      {/*=====================================================
          KPI CARDS
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

            {/* Total */}

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

                <Users
                  className="
                    h-5
                    w-5
                    text-cyan-400
                  "
                />

                <p
                  className="
                    text-xs
                    uppercase
                    tracking-wide
                    text-slate-500
                  "
                >

                  Total Escalations

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

                {metrics.total}

              </h3>

            </div>

            {/* Pending */}

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

                <Clock3
                  className="
                    h-5
                    w-5
                    text-amber-400
                  "
                />

                <p
                  className="
                    text-xs
                    uppercase
                    tracking-wide
                    text-amber-300
                  "
                >

                  Pending

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

                {metrics.pending}

              </h3>

            </div>

            {/* Critical */}

            <div
              className="
                rounded-2xl
                border
                border-red-500/20
                bg-red-500/5
                p-6
              "
            >

              <div className="flex items-center gap-3">

                <AlertTriangle
                  className="
                    h-5
                    w-5
                    text-red-400
                  "
                />

                <p
                  className="
                    text-xs
                    uppercase
                    tracking-wide
                    text-red-300
                  "
                >

                  Critical Cases

                </p>

              </div>

              <h3
                className="
                  mt-4
                  text-3xl
                  font-bold
                  text-red-400
                "
              >

                {metrics.critical}

              </h3>

            </div>

          </div>

        </div>

      )}

      {/*=====================================================
          SEARCH + FILTERS
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
                placeholder="Search customer, agent, reason..."
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
                  focus:border-red-500
                "
              />

            </div>

            {/*==============================================
                STATUS FILTER
            ==============================================*/}

            <div>

              <select
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(e.target.value)
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
                  focus:border-red-500
                "
              >

                <option>All</option>
                <option>Pending</option>
                <option>Assigned</option>
                <option>Critical</option>
                <option>Resolved</option>

              </select>

            </div>

          </div>

        </div>

      )}

      {/*=====================================================
          SUMMARY METRICS
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

            {/* Assigned */}

            <div
              className="
                rounded-2xl
                border
                border-cyan-500/20
                bg-cyan-500/5
                p-6
              "
            >

              <p
                className="
                  text-xs
                  uppercase
                  tracking-wide
                  text-cyan-300
                "
              >

                Assigned Cases

              </p>

              <h3
                className="
                  mt-3
                  text-3xl
                  font-bold
                  text-cyan-400
                "
              >

                {metrics.assigned}

              </h3>

            </div>

            {/* Resolved Today */}

            <div
              className="
                rounded-2xl
                border
                border-emerald-500/20
                bg-emerald-500/5
                p-6
              "
            >

              <p
                className="
                  text-xs
                  uppercase
                  tracking-wide
                  text-emerald-300
                "
              >

                Resolved Today

              </p>

              <h3
                className="
                  mt-3
                  text-3xl
                  font-bold
                  text-emerald-400
                "
              >

                {metrics.resolvedToday}

              </h3>

            </div>

            {/* Average Resolution */}

            <div
              className="
                rounded-2xl
                border
                border-violet-500/20
                bg-violet-500/5
                p-6
              "
            >

              <p
                className="
                  text-xs
                  uppercase
                  tracking-wide
                  text-violet-300
                "
              >

                Avg Resolution Time

              </p>

              <h3
                className="
                  mt-3
                  text-3xl
                  font-bold
                  text-violet-400
                "
              >

                {metrics.avgResolution}

              </h3>

            </div>

          </div>

        </div>

      )}

      {/*=====================================================
          ESCALATION LIST
      =====================================================*/}

      {!loading && !error && (

        <div
          className="
            border-t
            border-slate-800
            p-8
          "
        >

          <h3
            className="
              text-xl
              font-semibold
              text-white
            "
          >

            Active Escalations

          </h3>

          <div
            className="
              mt-6
              space-y-6
            "
          >

            {escalations

              .filter((item) => {

                const matchesSearch =

                  !search ||

                  item.customer
                    ?.toLowerCase()
                    .includes(search.toLowerCase()) ||

                  item.agent
                    ?.toLowerCase()
                    .includes(search.toLowerCase()) ||

                  item.reason
                    ?.toLowerCase()
                    .includes(search.toLowerCase());

                const matchesStatus =

                  statusFilter === "All"

                    ? true

                    : statusFilter === "Critical"

                    ? item.priority === "Critical"

                    : item.status === statusFilter;

                return (
                  matchesSearch &&
                  matchesStatus
                );

              })

              .map((item) => {

                const priorityStyles = {

                  Critical:
                    "bg-red-500/10 border-red-500/20 text-red-300",

                  High:
                    "bg-orange-500/10 border-orange-500/20 text-orange-300",

                  Medium:
                    "bg-amber-500/10 border-amber-500/20 text-amber-300",

                  Low:
                    "bg-cyan-500/10 border-cyan-500/20 text-cyan-300",

                };

                const slaColor =

                  item.slaRemaining <= 1

                    ? "text-red-400"

                    : item.slaRemaining <= 4

                    ? "text-amber-400"

                    : "text-emerald-400";

                return (

                  <div
                    key={item.id}
                    className="
                      rounded-3xl
                      border
                      border-slate-800
                      bg-slate-950/40
                      p-6
                      transition-all
                      duration-300
                      hover:border-red-500/30
                      hover:shadow-xl
                    "
                  >

                    {/*==================================
                        HEADER
                    ==================================*/}

                    <div
                      className="
                        flex
                        flex-wrap
                        items-start
                        justify-between
                        gap-5
                      "
                    >

                      <div>

                        <h4
                          className="
                            text-lg
                            font-semibold
                            text-white
                          "
                        >

                          {item.reason}

                        </h4>

                        <p
                          className="
                            mt-2
                            text-sm
                            text-slate-400
                          "
                        >

                          {item.description}

                        </p>

                      </div>

                      <span
                        className={`
                          rounded-full
                          border
                          px-4
                          py-2
                          text-xs
                          font-bold
                          ${
                            priorityStyles[item.priority] ||
                            "bg-slate-800 border-slate-700 text-slate-300"
                          }
                        `}
                      >

                        {item.priority}

                      </span>

                    </div>

                    {/*==================================
                        DETAILS
                    ==================================*/}

                    <div
                      className="
                        mt-6
                        grid
                        gap-5
                        md:grid-cols-2
                        xl:grid-cols-3
                      "
                    >

                      <div>

                        <p
                          className="
                            text-xs
                            uppercase
                            tracking-wide
                            text-slate-500
                          "
                        >

                          Customer

                        </p>

                        <p
                          className="
                            mt-2
                            font-semibold
                            text-white
                          "
                        >

                          {item.customer}

                        </p>

                      </div>

                      <div>

                        <p
                          className="
                            text-xs
                            uppercase
                            tracking-wide
                            text-slate-500
                          "
                        >

                          Assigned Agent

                        </p>

                        <p
                          className="
                            mt-2
                            font-semibold
                            text-white
                          "
                        >

                          {item.agent || "Unassigned"}

                        </p>

                      </div>

                      <div>

                        <p
                          className="
                            text-xs
                            uppercase
                            tracking-wide
                            text-slate-500
                          "
                        >

                          Source

                        </p>

                        <p
                          className="
                            mt-2
                            font-semibold
                            text-cyan-300
                          "
                        >

                          {item.channel}

                        </p>

                      </div>

                      <div>

                        <p
                          className="
                            text-xs
                            uppercase
                            tracking-wide
                            text-slate-500
                          "
                        >

                          Created

                        </p>

                        <p
                          className="
                            mt-2
                            text-white
                          "
                        >

                          {item.createdAt}

                        </p>

                      </div>

                      <div>

                        <p
                          className="
                            text-xs
                            uppercase
                            tracking-wide
                            text-slate-500
                          "
                        >

                          Status

                        </p>

                        <p
                          className="
                            mt-2
                            font-semibold
                            text-cyan-300
                          "
                        >

                          {item.status}

                        </p>

                      </div>

                      <div>

                        <p
                          className="
                            text-xs
                            uppercase
                            tracking-wide
                            text-slate-500
                          "
                        >

                          SLA Remaining

                        </p>

                        <p
                          className={`
                            mt-2
                            font-bold
                            ${slaColor}
                          `}
                        >

                          {item.slaRemaining} hrs

                        </p>

                      </div>

                    </div>

                    {/*==================================
                        ACTION BUTTONS
                    ==================================*/}

                    <div
                      className="
                        mt-8
                        flex
                        flex-wrap
                        gap-3
                      "
                    >

                      {/* View */}

                      <button
                        onClick={() =>
                          onViewCase?.(item)
                        }
                        className="
                          flex-1
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

                        View Case

                      </button>

                      {/* Assign */}

                      <button
                        onClick={() =>
                          onAssignAgent?.(item)
                        }
                        className="
                          rounded-xl
                          border
                          border-amber-500/30
                          bg-amber-500/10
                          px-5
                          py-3
                          text-sm
                          font-semibold
                          text-amber-300
                          transition
                          hover:bg-amber-500
                          hover:text-slate-950
                        "
                      >

                        Assign Agent

                      </button>

                      {/* Resolve */}

                      <button
                        onClick={() =>
                          onResolveCase?.(item)
                        }
                        className="
                          rounded-xl
                          border
                          border-emerald-500/30
                          bg-emerald-500/10
                          px-5
                          py-3
                          text-sm
                          font-semibold
                          text-emerald-300
                          transition
                          hover:bg-emerald-500
                          hover:text-slate-950
                        "
                      >

                        Resolve

                      </button>

                      {/* Escalate Further */}

                      <button
                        onClick={() =>
                          onEscalateCase?.(item)
                        }
                        className="
                          rounded-xl
                          border
                          border-red-500/30
                          bg-red-500/10
                          px-5
                          py-3
                          text-sm
                          font-semibold
                          text-red-300
                          transition
                          hover:bg-red-500
                          hover:text-white
                        "
                      >

                        Escalate Further

                      </button>

                    </div>

                  </div>

                );

              })}

            {/*==========================================
                EMPTY STATE
            ==========================================*/}

            {escalations.filter((item) => {

              const matchesSearch =
                !search ||
                item.customer
                  ?.toLowerCase()
                  .includes(search.toLowerCase()) ||
                item.agent
                  ?.toLowerCase()
                  .includes(search.toLowerCase()) ||
                item.reason
                  ?.toLowerCase()
                  .includes(search.toLowerCase());

              const matchesStatus =
                statusFilter === "All"
                  ? true
                  : statusFilter === "Critical"
                  ? item.priority === "Critical"
                  : item.status === statusFilter;

              return matchesSearch && matchesStatus;

            }).length === 0 && (

              <div
                className="
                  rounded-3xl
                  border
                  border-slate-800
                  bg-slate-950/40
                  p-12
                  text-center
                "
              >

                <ShieldAlert
                  className="
                    mx-auto
                    h-12
                    w-12
                    text-slate-600
                  "
                />

                <h3
                  className="
                    mt-5
                    text-lg
                    font-semibold
                    text-white
                  "
                >

                  No Escalations Found

                </h3>

                <p
                  className="
                    mt-3
                    text-sm
                    leading-7
                    text-slate-400
                  "
                >

                  No escalation cases match the
                  selected search or filter.

                </p>

              </div>

            )}

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

            <div>

              Total Escalations:

              <span
                className="
                  ml-2
                  font-semibold
                  text-red-300
                "
              >

                {escalations.length}

              </span>

            </div>

            <button
              onClick={loadEscalations}
              disabled={loading}
              className="
                rounded-xl
                border
                border-red-500/30
                bg-red-500/10
                px-4
                py-2
                text-xs
                font-semibold
                text-red-300
                transition
                hover:bg-red-500
                hover:text-white
                disabled:cursor-not-allowed
                disabled:opacity-50
              "
            >

              Refresh Escalations

            </button>

          </div>

        </div>

      )}

    </aside>

  );

};

export default EscalationPanel;