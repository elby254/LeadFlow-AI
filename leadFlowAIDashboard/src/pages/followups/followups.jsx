/**
 * ==========================================================
 *
 * SHARED FOLLOW-UP INBOX
 *
 * Route
 * ----------------------------------------------------------
 * /followups
 *
 * Purpose
 * ----------------------------------------------------------
 * Shared follow-up workspace used by authorized users
 * to review and manage customer follow-up activity.
 *
 * This page displays:
 *
 * • Upcoming follow-ups
 * • Today's follow-ups
 * • Overdue follow-ups
 * • Completed follow-ups
 * • Search
 * • Filters
 * • Follow-up statistics
 * • AI check-up message status
 * • AI lead score
 *
 * IMPORTANT
 * ----------------------------------------------------------
 * This page does NOT edit follow-ups directly.
 *
 * Clicking a follow-up opens:
 *
 * /followup/:leadId
 *
 * Follow-up editing is handled inside the shared
 * FollowUpPage component.
 *
 * This page is intentionally SHARED.
 *
 * It is NOT:
 *
 * • AgentFollowUps
 * • AdminFollowUps
 * • ViewerFollowUps
 *
 * Access and data visibility should be controlled by the
 * authentication / authorization layer and useFollowUps()
 * hook.
 *
 * ==========================================================
 */

import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  CalendarClock,
  Clock3,
  MessageCircle,
  ArrowRight,
} from "lucide-react";

import useFollowUps from "../../hooks/useFollowUps";

/* ==========================================================
   SHARED FOLLOW-UP INBOX
========================================================== */

const FollowUps = () => {
  const navigate = useNavigate();

  /* ========================================================
     FOLLOW-UP DATA
  ======================================================== */

  const {
    followUps = [],
    loading,
    error,
    refreshFollowUps,
  } = useFollowUps();

  /* ========================================================
     SEARCH
  ======================================================== */

  const [search, setSearch] = useState("");

  /* ========================================================
     FILTER
  ======================================================== */

  const [filter, setFilter] = useState("All");

  /* ========================================================
     TODAY
  ======================================================== */

  const today = useMemo(() => {
    const date = new Date();

    date.setHours(0, 0, 0, 0);

    return date;
  }, []);

  /* ========================================================
     FOLLOW-UP DATE
  ======================================================== */

  /**
   * Returns the current follow-up date.
   *
   * nextFollowUpDate is the preferred source.
   *
   * followUpDate remains supported for older records.
   */

  const getFollowUpDate = (lead) => {
    return (
      lead?.nextFollowUpDate ||
      lead?.followUpDate ||
      null
    );
  };

  /* ========================================================
     FOLLOW-UP CATEGORY
  ======================================================== */

  const getCategory = (date, status) => {
    /*
     * A record without a date is treated as upcoming
     * so it remains visible instead of disappearing.
     */

    if (!date) {
      return "upcoming";
    }

    const followDate = new Date(date);

    if (Number.isNaN(followDate.getTime())) {
      return "upcoming";
    }

    followDate.setHours(0, 0, 0, 0);

    const normalizedStatus = String(
      status || ""
    ).toLowerCase();

    /*
     * Completed and cancelled records should never
     * become overdue based only on their old date.
     */

    if (
      normalizedStatus === "completed" ||
      normalizedStatus === "cancelled"
    ) {
      return "completed";
    }

    if (followDate < today) {
      return "overdue";
    }

    if (
      followDate.getTime() ===
      today.getTime()
    ) {
      return "today";
    }

    return "upcoming";
  };

  /* ========================================================
     FORMAT DATE
  ======================================================== */

  const formatDate = (date) => {
    if (!date) {
      return "Not scheduled";
    }

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "Not scheduled";
    }

    return parsedDate.toLocaleDateString(
      undefined,
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  };

  /* ========================================================
     DUE DATE COLOR
  ======================================================== */

  const getDueColor = (date, status) => {
    const category = getCategory(
      date,
      status
    );

    switch (category) {
      case "overdue":
        return "text-red-400";

      case "today":
        return "text-yellow-400";

      case "completed":
        return "text-emerald-400";

      default:
        return "text-cyan-400";
    }
  };

  /* ========================================================
     STATUS BADGE
  ======================================================== */

  const getStatusColor = (status) => {
    switch (
      String(status || "").toLowerCase()
    ) {
      case "completed":
        return "bg-green-500/20 text-green-400";

      case "scheduled":
        return "bg-cyan-500/20 text-cyan-400";

      case "cancelled":
        return "bg-red-500/20 text-red-400";

      case "overdue":
        return "bg-red-500/20 text-red-400";

      case "pending":
        return "bg-yellow-500/20 text-yellow-400";

      default:
        return "bg-yellow-500/20 text-yellow-400";
    }
  };

  /* ========================================================
     AI CHECK-UP MESSAGE STATUS
  ======================================================== */

  const getCheckUpStatus = (lead) => {
    /*
     * Support the different field names that may exist
     * across current and older LeadFlow AI records.
     */

    if (
      lead?.checkUpMessageSent ||
      lead?.checkupMessageSent ||
      lead?.followUpMessageSent
    ) {
      return "Sent";
    }

    if (
      lead?.checkUpMessage ||
      lead?.checkupMessage ||
      lead?.aiCheckUpMessage
    ) {
      return "Ready";
    }

    return "Not generated";
  };

  /* ========================================================
     FILTERED FOLLOW-UPS
  ======================================================== */

  const filteredFollowUps = useMemo(() => {
    const query = search
      .trim()
      .toLowerCase();

    return followUps.filter((lead) => {
      const followUpDate =
        getFollowUpDate(lead);

      const category = getCategory(
        followUpDate,
        lead?.followUpStatus
      );

      /* ----------------------------------------------------
         CATEGORY FILTER
      ---------------------------------------------------- */

      if (
        filter === "Overdue" &&
        category !== "overdue"
      ) {
        return false;
      }

      if (
        filter === "Today" &&
        category !== "today"
      ) {
        return false;
      }

      if (
        filter === "Upcoming" &&
        category !== "upcoming"
      ) {
        return false;
      }

      if (
        filter === "Completed" &&
        category !== "completed"
      ) {
        return false;
      }

      /* ----------------------------------------------------
         SEARCH
      ---------------------------------------------------- */

      if (!query) {
        return true;
      }

      const haystack = `
        ${lead?.name || ""}
        ${lead?.phone || ""}
        ${lead?.location || ""}
        ${lead?.status || ""}
        ${lead?.followUpStatus || ""}
      `.toLowerCase();

      return haystack.includes(query);
    });
  }, [followUps, search, filter]);

  /* ========================================================
     STATISTICS
  ======================================================== */

  const statistics = useMemo(() => {
    let todayCount = 0;
    let upcomingCount = 0;
    let overdueCount = 0;
    let completedCount = 0;

    followUps.forEach((lead) => {
      const category = getCategory(
        getFollowUpDate(lead),
        lead?.followUpStatus
      );

      if (category === "today") {
        todayCount += 1;
      }

      if (category === "upcoming") {
        upcomingCount += 1;
      }

      if (category === "overdue") {
        overdueCount += 1;
      }

      if (category === "completed") {
        completedCount += 1;
      }
    });

    return {
      total: followUps.length,
      today: todayCount,
      upcoming: upcomingCount,
      overdue: overdueCount,
      completed: completedCount,
    };
  }, [followUps]);

  /* ========================================================
     OPEN FOLLOW-UP
  ======================================================== */

  const openFollowUp = (leadId) => {
    if (!leadId) {
      console.warn(
        "Unable to open follow-up: missing lead ID"
      );

      return;
    }

    navigate(`/followup/${leadId}`);
  };

  /* ========================================================
     PAGE
  ======================================================== */

  return (
    <section className="space-y-6">

      {/* ====================================================
          HEADER
      ==================================================== */}

      <section
        className="
          rounded-2xl
          border
          border-slate-800
          bg-slate-900
          p-6
        "
      >

        <div
          className="
            flex
            flex-col
            gap-4
            lg:flex-row
            lg:items-center
            lg:justify-between
          "
        >

          <div>

            <h1 className="text-2xl font-bold text-white">
              Follow-up Inbox
            </h1>

            <p className="mt-2 text-slate-400">
              Review customer follow-ups, upcoming
              actions, overdue tasks, and AI-assisted
              check-up activity.
            </p>

          </div>

          <button
            type="button"
            onClick={refreshFollowUps}
            className="
              rounded-xl
              border
              border-slate-700
              bg-slate-950
              px-4
              py-2
              text-sm
              font-semibold
              text-white
              transition
              hover:border-cyan-500
              hover:bg-slate-800
            "
          >
            Refresh
          </button>

        </div>

      </section>

      {/* ====================================================
          STATISTICS
      ==================================================== */}

      <section
        className="
          grid
          gap-4
          sm:grid-cols-2
          xl:grid-cols-5
        "
      >

        {/* TOTAL */}

        <div
          className="
            rounded-2xl
            border
            border-slate-800
            bg-slate-900
            p-5
          "
        >

          <p className="text-sm text-slate-400">
            Total
          </p>

          <p className="mt-2 text-3xl font-black text-white">
            {statistics.total}
          </p>

        </div>

        {/* TODAY */}

        <div
          className="
            rounded-2xl
            border
            border-yellow-900/40
            bg-yellow-950/20
            p-5
          "
        >

          <p className="text-sm text-yellow-400">
            Today
          </p>

          <p className="mt-2 text-3xl font-black text-yellow-300">
            {statistics.today}
          </p>

        </div>

        {/* UPCOMING */}

        <div
          className="
            rounded-2xl
            border
            border-cyan-900/40
            bg-cyan-950/20
            p-5
          "
        >

          <p className="text-sm text-cyan-400">
            Upcoming
          </p>

          <p className="mt-2 text-3xl font-black text-cyan-300">
            {statistics.upcoming}
          </p>

        </div>

        {/* OVERDUE */}

        <div
          className="
            rounded-2xl
            border
            border-red-900/40
            bg-red-950/20
            p-5
          "
        >

          <p className="text-sm text-red-400">
            Overdue
          </p>

          <p className="mt-2 text-3xl font-black text-red-300">
            {statistics.overdue}
          </p>

        </div>

        {/* COMPLETED */}

        <div
          className="
            rounded-2xl
            border
            border-emerald-900/40
            bg-emerald-950/20
            p-5
          "
        >

          <p className="text-sm text-emerald-400">
            Completed
          </p>

          <p className="mt-2 text-3xl font-black text-emerald-300">
            {statistics.completed}
          </p>

        </div>

      </section>

      {/* ====================================================
          SEARCH + FILTERS
      ==================================================== */}

      <section
        className="
          rounded-2xl
          border
          border-slate-800
          bg-slate-900
          p-6
        "
      >

        <div className="flex flex-col gap-4 md:flex-row">

          {/* SEARCH */}

          <input
            type="text"
            placeholder="Search customer, phone or location..."
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            className="
              flex-1
              rounded-xl
              border
              border-slate-700
              bg-slate-950
              p-3
              text-white
              outline-none
              placeholder:text-slate-500
              focus:border-cyan-500
            "
          />

          {/* FILTER */}

          <select
            value={filter}
            onChange={(event) =>
              setFilter(event.target.value)
            }
            className="
              rounded-xl
              border
              border-slate-700
              bg-slate-950
              px-4
              text-white
              outline-none
              focus:border-cyan-500
            "
          >

            <option value="All">
              All
            </option>

            <option value="Overdue">
              Overdue
            </option>

            <option value="Today">
              Today
            </option>

            <option value="Upcoming">
              Upcoming
            </option>

            <option value="Completed">
              Completed
            </option>

          </select>

        </div>

      </section>

      {/* ====================================================
          LOADING
      ==================================================== */}

      {loading && (
        <div
          className="
            rounded-2xl
            border
            border-slate-800
            bg-slate-900
            p-20
            text-center
          "
        >

          <Clock3
            className="
              mx-auto
              mb-4
              animate-pulse
              text-cyan-400
            "
            size={32}
          />

          <p className="text-lg text-slate-300">
            Loading follow-ups...
          </p>

        </div>
      )}

      {/* ====================================================
          ERROR
      ==================================================== */}

      {!loading && error && (
        <div
          className="
            rounded-2xl
            border
            border-red-900
            bg-red-950/40
            p-10
          "
        >

          <p className="text-red-400">
            {error}
          </p>

          <button
            type="button"
            onClick={refreshFollowUps}
            className="
              mt-5
              rounded-lg
              bg-red-500
              px-4
              py-2
              font-semibold
              text-white
              transition
              hover:bg-red-400
            "
          >
            Retry
          </button>

        </div>
      )}

      {/* ====================================================
          EMPTY
      ==================================================== */}

      {!loading &&
        !error &&
        filteredFollowUps.length === 0 && (
          <div
            className="
              rounded-2xl
              border
              border-slate-800
              bg-slate-900
              p-20
              text-center
            "
          >

            <CalendarClock
              size={42}
              className="mx-auto text-slate-600"
            />

            <h2 className="mt-5 text-2xl font-bold text-white">
              No Follow-ups
            </h2>

            <p className="mt-3 text-slate-400">
              Nothing matches your current search or
              filters.
            </p>

          </div>
        )}

      {/* ====================================================
          FOLLOW-UP TABLE
      ==================================================== */}

      {!loading &&
        !error &&
        filteredFollowUps.length > 0 && (
          <section
            className="
              overflow-hidden
              rounded-2xl
              border
              border-slate-800
              bg-slate-900
            "
          >

            <div className="overflow-x-auto">

              <table className="min-w-full">

                {/* ==========================================
                    TABLE HEADER
                ========================================== */}

                <thead
                  className="
                    border-b
                    border-slate-800
                    bg-slate-950
                  "
                >

                  <tr
                    className="
                      text-left
                      text-sm
                      uppercase
                      tracking-wide
                      text-slate-400
                    "
                  >

                    <th className="px-6 py-4">
                      Customer
                    </th>

                    <th className="px-6 py-4">
                      Phone
                    </th>

                    <th className="px-6 py-4">
                      Due Date
                    </th>

                    <th className="px-6 py-4">
                      Status
                    </th>

                    <th className="px-6 py-4">
                      Check-up
                    </th>

                    <th className="px-6 py-4">
                      AI Score
                    </th>

                    <th className="px-6 py-4 text-right">
                      Action
                    </th>

                  </tr>

                </thead>

                {/* ==========================================
                    TABLE BODY
                ========================================== */}

                <tbody>

                  {filteredFollowUps.map((lead) => {

                    const followUpDate =
                      getFollowUpDate(lead);

                    const category =
                      getCategory(
                        followUpDate,
                        lead?.followUpStatus
                      );

                    const checkUpStatus =
                      getCheckUpStatus(lead);

                    return (
                      <tr
                        key={lead._id}
                        onClick={() =>
                          openFollowUp(
                            lead._id
                          )
                        }
                        className="
                          cursor-pointer
                          border-b
                          border-slate-800
                          transition
                          hover:bg-slate-800/60
                        "
                      >

                        {/* ==================================
                            CUSTOMER
                        ================================== */}

                        <td className="px-6 py-5">

                          <div>

                            <p className="font-semibold text-white">
                              {lead?.name ||
                                "Unnamed Customer"}
                            </p>

                            <p className="mt-1 text-xs text-slate-500">
                              {lead?.location ||
                                "No location"}
                            </p>

                          </div>

                        </td>

                        {/* ==================================
                            PHONE
                        ================================== */}

                        <td className="px-6 py-5 text-slate-300">
                          {lead?.phone || "-"}
                        </td>

                        {/* ==================================
                            DUE DATE
                        ================================== */}

                        <td className="px-6 py-5">

                          <span
                            className={`
                              font-semibold
                              ${getDueColor(
                                followUpDate,
                                lead?.followUpStatus
                              )}
                            `}
                          >
                            {formatDate(
                              followUpDate
                            )}
                          </span>

                        </td>

                        {/* ==================================
                            STATUS
                        ================================== */}

                        <td className="px-6 py-5">

                          <span
                            className={`
                              rounded-full
                              px-3
                              py-1
                              text-xs
                              font-semibold
                              ${getStatusColor(
                                category ===
                                  "overdue"
                                  ? "Overdue"
                                  : lead?.followUpStatus
                              )}
                            `}
                          >
                            {category ===
                            "overdue"
                              ? "Overdue"
                              : lead?.followUpStatus ||
                                "Pending"}
                          </span>

                        </td>

                        {/* ==================================
                            CHECK-UP
                        ================================== */}

                        <td className="px-6 py-5">

                          <span
                            className={`
                              inline-flex
                              items-center
                              gap-2
                              rounded-full
                              px-3
                              py-1
                              text-xs
                              font-semibold
                              ${
                                checkUpStatus ===
                                "Sent"
                                  ? "bg-emerald-500/20 text-emerald-400"
                                  : checkUpStatus ===
                                    "Ready"
                                  ? "bg-cyan-500/20 text-cyan-400"
                                  : "bg-slate-800 text-slate-400"
                              }
                            `}
                          >

                            <MessageCircle
                              size={13}
                            />

                            {checkUpStatus}

                          </span>

                        </td>

                        {/* ==================================
                            AI SCORE
                        ================================== */}

                        <td className="px-6 py-5">

                          <span
                            className="
                              rounded-lg
                              bg-cyan-500/20
                              px-3
                              py-1
                              font-semibold
                              text-cyan-300
                            "
                          >
                            {lead?.score ?? 0}
                          </span>

                        </td>

                        {/* ==================================
                            ACTION
                        ================================== */}

                        <td className="px-6 py-5 text-right">

                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();

                              openFollowUp(
                                lead._id
                              );
                            }}
                            className="
                              inline-flex
                              items-center
                              gap-2
                              rounded-lg
                              bg-cyan-500
                              px-4
                              py-2
                              font-semibold
                              text-slate-950
                              transition
                              hover:bg-cyan-400
                            "
                          >

                            Open

                            <ArrowRight
                              size={16}
                            />

                          </button>

                        </td>

                      </tr>
                    );
                  })}

                </tbody>

              </table>

            </div>

          </section>
        )}

    </section>
  );
};

export default FollowUps;