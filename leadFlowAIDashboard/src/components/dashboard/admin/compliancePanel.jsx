/**
 * ==========================================================
 * LeadFlow AI
 * Compliance Panel
 * ==========================================================
 *
 * Admin-only compliance monitoring dashboard.
 *
 * Used In
 * ----------------------------------------------------------
 * • Admin Dashboard
 * • Compliance Center
 * • AI Monitoring
 * • Audit Dashboard
 *
 * Backend
 * ----------------------------------------------------------
 * GET    /api/admin/compliance
 * GET    /api/admin/compliance/violations
 * POST   /api/admin/compliance/review/:id
 * PATCH  /api/admin/compliance/:id
 *
 * ==========================================================
 */

import {
  ShieldCheck,
  ShieldAlert,
  RotateCw,
  Loader2,
  AlertTriangle,
} from "lucide-react";

import { useEffect, useState } from "react";

import complianceService from "../../services/complianceService";

const CompliancePanel = ({
  onReviewCase,
  onResolveCase,
  onEscalateCase
}) => {

  /*=========================================================
      STATE
  =========================================================*/

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [summary, setSummary] = useState({});

  const [violations, setViolations] = useState([]);

  const [search, setSearch] = useState("");

  const [severityFilter, setSeverityFilter] =
    useState("All");

  /*=========================================================
      LOAD DATA
  =========================================================*/

  const loadCompliance = async () => {

    try {

      setLoading(true);

      setError("");

      const response =
        await complianceService.getComplianceDashboard();

      setSummary(response.summary || {});

      setViolations(
        Array.isArray(response.violations)
          ? response.violations
          : []
      );

    } catch (err) {

      console.error(err);

      setError(
        "Unable to load compliance dashboard."
      );

      setSummary({});

      setViolations([]);

    } finally {

      setLoading(false);

    }

  };

  useEffect(() => {

    loadCompliance();

  }, []);

  /*=========================================================
      SUMMARY
  =========================================================*/

  const complianceScore =
    summary.score ?? 0;

  const systemStatus =
    summary.status || "Unknown";

  /*=========================================================
      STATUS COLORS
  =========================================================*/

  const statusStyles = (() => {

    switch (systemStatus) {

      case "Healthy":

        return {
          badge:
            "bg-emerald-500/10 border-emerald-500/20 text-emerald-300",
          icon: ShieldCheck,
        };

      case "Warning":

        return {
          badge:
            "bg-amber-500/10 border-amber-500/20 text-amber-300",
          icon: ShieldAlert,
        };

      case "Critical":

        return {
          badge:
            "bg-red-500/10 border-red-500/20 text-red-300",
          icon: AlertTriangle,
        };

      default:

        return {
          badge:
            "bg-slate-800 border-slate-700 text-slate-300",
          icon: ShieldAlert,
        };

    }

  })();

  const StatusIcon = statusStyles.icon;

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
          from-emerald-600/10
          to-cyan-600/10
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
              bg-emerald-500/10
            "
          >

            <ShieldCheck
              className="
                h-6
                w-6
                text-emerald-400
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

              Compliance Center

            </h2>

            <p
              className="
                text-sm
                text-slate-400
              "
            >

              AI policy & regulatory monitoring

            </p>

          </div>

        </div>

        <button
          onClick={loadCompliance}
          disabled={loading}
          className="
            rounded-xl
            border
            border-slate-700
            bg-slate-800
            p-3
            transition
            hover:border-emerald-500/40
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
                text-emerald-400
              "
            />

          ) : (

            <RotateCw
              className="
                h-5
                w-5
                text-emerald-400
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
              onClick={loadCompliance}
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
          COMPLIANCE SCORE
      =====================================================*/}

      {!loading && !error && (

        <div className="p-8">

          <div
            className="
              rounded-3xl
              border
              border-emerald-500/20
              bg-emerald-500/5
              p-8
            "
          >

            <div
              className="
                flex
                flex-wrap
                items-center
                justify-between
                gap-6
              "
            >

              <div>

                <p
                  className="
                    text-xs
                    uppercase
                    tracking-wide
                    text-emerald-300
                  "
                >

                  Compliance Score

                </p>

                <h2
                  className="
                    mt-2
                    text-5xl
                    font-bold
                    text-emerald-400
                  "
                >

                  {complianceScore}%

                </h2>

              </div>

              <div
                className={`
                  flex
                  items-center
                  gap-3
                  rounded-full
                  border
                  px-5
                  py-3
                  ${statusStyles.badge}
                `}
              >

                <StatusIcon className="h-5 w-5" />

                <span
                  className="
                    text-sm
                    font-bold
                  "
                >

                  {systemStatus}

                </span>

              </div>

            </div>

            {/* Progress */}

            <div
              className="
                mt-8
                h-3
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
                  width: `${complianceScore}%`,
                }}
              />

            </div>

          </div>

        </div>

      )}

      {/*=====================================================
          SEARCH + FILTER
      =====================================================*/}

      {!loading && !error && (

        <div
          className="
            border-t
            border-slate-800
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

            {/* Search */}

            <div className="flex-1">

              <input

                type="text"

                value={search}

                onChange={(e) =>
                  setSearch(e.target.value)
                }

                placeholder="Search customer, agent or rule..."

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
                  focus:border-emerald-500
                "

              />

            </div>

            {/* Severity Filter */}

            <div>

              <select

                value={severityFilter}

                onChange={(e) =>
                  setSeverityFilter(e.target.value)
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
                  focus:border-emerald-500
                "

              >

                <option>All</option>

                <option>Critical</option>

                <option>High</option>

                <option>Medium</option>

                <option>Low</option>

                <option>Resolved</option>

              </select>

            </div>

          </div>

        </div>

      )}

      {/*=====================================================
          KPI METRICS
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

            {/* Messages Reviewed */}

            <div
              className="
                rounded-2xl
                border
                border-slate-800
                bg-slate-950/40
                p-6
              "
            >

              <p
                className="
                  text-xs
                  uppercase
                  tracking-wide
                  text-slate-500
                "
              >

                Messages Reviewed

              </p>

              <h3
                className="
                  mt-3
                  text-3xl
                  font-bold
                  text-white
                "
              >

                {summary.messagesReviewed ?? 0}

              </h3>

            </div>

            {/* Violations */}

            <div
              className="
                rounded-2xl
                border
                border-red-500/20
                bg-red-500/5
                p-6
              "
            >

              <p
                className="
                  text-xs
                  uppercase
                  tracking-wide
                  text-red-300
                "
              >

                Violations

              </p>

              <h3
                className="
                  mt-3
                  text-3xl
                  font-bold
                  text-red-400
                "
              >

                {summary.violations ?? 0}

              </h3>

            </div>

            {/* Pending Reviews */}

            <div
              className="
                rounded-2xl
                border
                border-amber-500/20
                bg-amber-500/5
                p-6
              "
            >

              <p
                className="
                  text-xs
                  uppercase
                  tracking-wide
                  text-amber-300
                "
              >

                Pending Reviews

              </p>

              <h3
                className="
                  mt-3
                  text-3xl
                  font-bold
                  text-amber-400
                "
              >

                {summary.pendingReviews ?? 0}

              </h3>

            </div>

            {/* Escalated */}

            <aside>
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
      Escalated Cases
    </p>

    <h3
      className="
        mt-3
        text-3xl
        font-bold
        text-cyan-400
      "
    >
      {summary.escalatedCases ?? 0}
    </h3>
  </div>

  {/* Privacy Alerts */}
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
      Privacy Alerts
    </p>

    <h3
      className="
        mt-3
        text-3xl
        font-bold
        text-violet-400
      "
    >
      {summary.privacyAlerts ?? 0}
    </h3>
  </div>

  {/* Consent Issues */}
  <div
    className="
      rounded-2xl
      border
      border-orange-500/20
      bg-orange-500/5
      p-6
    "
  >
    <p
      className="
        text-xs
        uppercase
        tracking-wide
        text-orange-300
      "
    >
      Consent Issues
    </p>

    <h3
      className="
        mt-3
        text-3xl
        font-bold
        text-orange-400
      "
    >
      {summary.consentIssues ?? 0}
    </h3>
  </div>
</aside>
 
  </div>

  {/*=====================================================
  COMPLIANCE VIOLATIONS
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
      Compliance Violations
    </h3>

    {violations.filter((item) => {
      const matchesSearch =
        !search ||
        item.customer?.toLowerCase().includes(search.toLowerCase()) ||
        item.agent?.toLowerCase().includes(search.toLowerCase()) ||
        item.rule?.toLowerCase().includes(search.toLowerCase());

      const matchesSeverity = (() => {
        if (severityFilter === "All") return true;
        if (item.status === "Resolved") return severityFilter === "Resolved";
        return item.severity === severityFilter;
      })();

      return matchesSearch && matchesSeverity;
    }).length === 0 ? (
      <div
        className="
          mt-6
          rounded-3xl
          border
          border-slate-800
          bg-slate-950/40
          p-10
          text-center
        "
      >
        <ShieldCheck
          className="
            mx-auto
            h-12
            w-12
            text-emerald-400
          "
        />

        <h4
          className="
            mt-5
            text-lg
            font-semibold
            text-white
          "
        >
          No Compliance Violations
        </h4>

        <p
          className="
            mt-3
            text-sm
            leading-7
            text-slate-400
          "
        >
          No incidents match the selected search or filter.
        </p>
      </div>
    ) : null}
  </div>
)}


            <div
              className="
                mt-6
                space-y-6
              "
            >

              {violations

                .filter((item) => {

                  const matchesSearch =

                    !search ||

                    item.customer
                      ?.toLowerCase()
                      .includes(search.toLowerCase()) ||

                    item.agent
                      ?.toLowerCase()
                      .includes(search.toLowerCase()) ||

                    item.rule
                      ?.toLowerCase()
                      .includes(search.toLowerCase());

                  const matchesSeverity =

                    severityFilter === "All"

                      ? true

                      : item.status === "Resolved"

                      ? severityFilter === "Resolved"

                      : item.severity === severityFilter;

                  return (
                    matchesSearch &&
                    matchesSeverity
                  );

                })

                .map((item) => {

                  const severityStyles = {

                    Critical:
                      "bg-red-500/10 border-red-500/20 text-red-300",

                    High:
                      "bg-orange-500/10 border-orange-500/20 text-orange-300",

                    Medium:
                      "bg-amber-500/10 border-amber-500/20 text-amber-300",

                    Low:
                      "bg-cyan-500/10 border-cyan-500/20 text-cyan-300",

                  };

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
                        hover:border-emerald-500/30
                        hover:shadow-lg
                      "
                    >

                      {/*==============================
                          HEADER
                      ==============================*/}

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

                            {item.rule}

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
                              severityStyles[
                                item.severity
                              ] ||
                              "bg-slate-800 text-slate-300 border-slate-700"
                            }
                          `}
                        >

                          {item.severity}

                        </span>

                      </div>

                      {/*==============================
                          DETAILS
                      ==============================*/}

                      <div
                        className="
                          mt-6
                          grid
                          gap-5
                          md:grid-cols-2
                          xl:grid-cols-4
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

                            Agent

                          </p>

                          <p
                            className="
                              mt-2
                              font-semibold
                              text-white
                            "
                          >

                            {item.agent}

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

                            Time

                          </p>

                          <p
                            className="
                              mt-2
                              font-semibold
                              text-white
                            "
                          >

                            {item.timestamp}

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

                      </div>

                      {/*==============================
                          ACTION BUTTONS
                      ==============================*/}

                      <div
                        className="
                          mt-8
                          flex
                          flex-wrap
                          gap-3
                        "
                      >

                        {/* Review */}

                        <button
                          onClick={() =>
                            onReviewCase?.(item)
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

                          Review Case

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

                          Mark Resolved

                        </button>

                        {/* Escalate */}

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

                          Escalate

                        </button>

                      </div>

                    </div>

                  );

                })}

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

              Showing{" "}

              <span
                className="
                  font-semibold
                  text-emerald-400
                "
              >

                {
                  violations.filter((item) => {

                    const matchesSearch =
                      !search ||

                      item.customer
                        ?.toLowerCase()
                        .includes(search.toLowerCase()) ||

                      item.agent
                        ?.toLowerCase()
                        .includes(search.toLowerCase()) ||

                      item.rule
                        ?.toLowerCase()
                        .includes(search.toLowerCase());

                    const matchesSeverity =
                      severityFilter === "All"

                        ? true

                        : item.status === "Resolved"

                        ? severityFilter === "Resolved"

                        : item.severity === severityFilter;

                    return (
                      matchesSearch &&
                      matchesSeverity
                    );

                  }).length
                }

              </span>

              {" "}case

              {
                violations.filter((item) => {

                  const matchesSearch =
                    !search ||

                    item.customer
                      ?.toLowerCase()
                      .includes(search.toLowerCase()) ||

                    item.agent
                      ?.toLowerCase()
                      .includes(search.toLowerCase()) ||

                    item.rule
                      ?.toLowerCase()
                      .includes(search.toLowerCase());

                  const matchesSeverity =
                    severityFilter === "All"

                      ? true

                      : item.status === "Resolved"

                      ? severityFilter === "Resolved"

                      : item.severity === severityFilter;

                  return (
                    matchesSearch &&
                    matchesSeverity
                  );

                }).length !== 1 && "s"
              }

            </div>

            <div
              className="
                flex
                items-center
                gap-5
              "
            >

              <span>

                Total Violations:

                {" "}

                <span
                  className="
                    font-semibold
                    text-white
                  "
                >

                  {violations.length}

                </span>

              </span>

              <button
                onClick={loadCompliance}
                className="
                  rounded-xl
                  border
                  border-emerald-500/30
                  bg-emerald-500/10
                  px-4
                  py-2
                  text-xs
                  font-semibold
                  text-emerald-300
                  transition
                  hover:bg-emerald-500
                  hover:text-slate-950
                "
              >

                Refresh Compliance

              </button>

            </div>

          </div>

        </div>

      )}

    </aside>

  );

};

export default CompliancePanel;
