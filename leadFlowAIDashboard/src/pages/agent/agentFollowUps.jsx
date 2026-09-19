/**
 * ==========================================================
 *
 * File
 * ----
 * src/pages/agent/agentFollowUps.jsx
 *
 * PURPOSE
 * -------
 * Agent-specific follow-up command center.
 *
 * This page belongs exclusively to the AGENT workflow.
 *
 * It does NOT duplicate the shared follow-up management
 * pages.
 *
 * Shared follow-up pages:
 *
 *   /followups
 *   /followup/:id
 *   /followups/calendar
 *
 * Agent workflow:
 *
 *   /agent/followups
 *
 * ==========================================================
 *
 * RESPONSIBILITIES
 * ----------------
 *
 * • Show the agent's follow-up workload
 * • Highlight today's actions
 * • Highlight overdue customers
 * • Show upcoming customer actions
 * • Show completed follow-ups
 * • Provide quick access to shared follow-up tools
 * • Allow the agent to open a specific follow-up
 *
 * ==========================================================
 *
 * IMPORTANT
 * ---------
 *
 * This page does NOT directly edit follow-ups.
 *
 * Editing remains inside:
 *
 *   FollowUpPage.jsx
 *
 * The shared inbox remains:
 *
 *   followups.jsx
 *
 * The shared calendar remains:
 *
 *   calendar.jsx
 *
 * ==========================================================
 */

import {
  useMemo,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import {
  AlertTriangle,
  ArrowRight,
  CalendarClock,
  CalendarDays,
  CheckCircle2,
  Clock3,
  MessageCircle,
  RefreshCw,
  Users,
} from "lucide-react";

import useFollowUps from "../../hooks/useFollowUps";


/* ==========================================================
   AGENT FOLLOW-UPS
========================================================== */

const AgentFollowUps = () => {

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
     TODAY
  ======================================================== */

  const today = useMemo(() => {

    const date = new Date();

    date.setHours(
      0,
      0,
      0,
      0
    );

    return date;

  }, []);


  /* ========================================================
     DATE HELPERS
  ======================================================== */

  const getFollowUpDate = (lead) => {

    return (
      lead?.nextFollowUpDate ||
      lead?.followUpDate ||
      null
    );

  };


  const getDate = (lead) => {

    const date =
      getFollowUpDate(lead);

    if (!date) {
      return null;
    }

    const parsed =
      new Date(date);

    if (
      Number.isNaN(
        parsed.getTime()
      )
    ) {
      return null;
    }

    return parsed;

  };


  /* ========================================================
     STATUS
  ======================================================== */

  const getStatus = (lead) => {

    const status =
      (
        lead?.followUpStatus ||
        lead?.status ||
        "Pending"
      ).toLowerCase();

    if (
      status === "completed"
    ) {
      return "Completed";
    }

    if (
      status === "cancelled"
    ) {
      return "Cancelled";
    }

    const date =
      getDate(lead);

    if (
      date
    ) {

      const normalized =
        new Date(date);

      normalized.setHours(
        0,
        0,
        0,
        0
      );

      if (
        normalized < today
      ) {
        return "Overdue";
      }

    }

    if (
      status === "scheduled"
    ) {
      return "Scheduled";
    }

    return "Pending";

  };


  /* ========================================================
     CHECK-UP STATUS
  ======================================================== */

  const getCheckUpStatus = (lead) => {

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

    return "Not Ready";

  };


  /* ========================================================
     CATEGORY HELPERS
  ======================================================== */

  const isToday = (lead) => {

    const date =
      getDate(lead);

    if (!date) {
      return false;
    }

    return (
      date.getFullYear() ===
        today.getFullYear() &&
      date.getMonth() ===
        today.getMonth() &&
      date.getDate() ===
        today.getDate()
    );

  };


  const isUpcoming = (lead) => {

    const date =
      getDate(lead);

    if (!date) {
      return false;
    }

    const status =
      getStatus(lead);

    if (
      status === "Completed" ||
      status === "Cancelled" ||
      status === "Overdue"
    ) {
      return false;
    }

    return date > today;

  };


  /* ========================================================
     STATISTICS
  ======================================================== */

  const statistics = useMemo(() => {

    let todayCount = 0;
    let overdueCount = 0;
    let upcomingCount = 0;
    let completedCount = 0;

    followUps.forEach((lead) => {

      const status =
        getStatus(lead);

      if (
        status === "Completed"
      ) {
        completedCount += 1;
        return;
      }

      if (
        status === "Overdue"
      ) {
        overdueCount += 1;
        return;
      }

      if (
        isToday(lead)
      ) {
        todayCount += 1;
        return;
      }

      if (
        isUpcoming(lead)
      ) {
        upcomingCount += 1;
      }

    });

    return {
      total: followUps.length,
      today: todayCount,
      overdue: overdueCount,
      upcoming: upcomingCount,
      completed: completedCount,
    };

  }, [
    followUps,
  ]);


  /* ========================================================
     TODAY'S FOLLOW-UPS
  ======================================================== */

  const todaysFollowUps = useMemo(() => {

    return followUps
      .filter((lead) => {

        const status =
          getStatus(lead);

        if (
          status === "Completed" ||
          status === "Cancelled"
        ) {
          return false;
        }

        return isToday(lead);

      })
      .sort((a, b) => {

        const dateA =
          getDate(a);

        const dateB =
          getDate(b);

        if (!dateA) return 1;

        if (!dateB) return -1;

        return (
          dateA.getTime() -
          dateB.getTime()
        );

      })
      .slice(0, 5);

  }, [
    followUps,
  ]);


  /* ========================================================
     OVERDUE FOLLOW-UPS
  ======================================================== */

  const overdueFollowUps = useMemo(() => {

    return followUps
      .filter(
        (lead) =>
          getStatus(lead) ===
          "Overdue"
      )
      .sort((a, b) => {

        const dateA =
          getDate(a);

        const dateB =
          getDate(b);

        if (!dateA) return 1;

        if (!dateB) return -1;

        return (
          dateA.getTime() -
          dateB.getTime()
        );

      })
      .slice(0, 5);

  }, [
    followUps,
  ]);


  /* ========================================================
     UPCOMING FOLLOW-UPS
  ======================================================== */

  const upcomingFollowUps = useMemo(() => {

    return followUps
      .filter(
        (lead) =>
          isUpcoming(lead)
      )
      .sort((a, b) => {

        const dateA =
          getDate(a);

        const dateB =
          getDate(b);

        if (!dateA) return 1;

        if (!dateB) return -1;

        return (
          dateA.getTime() -
          dateB.getTime()
        );

      })
      .slice(0, 5);

  }, [
    followUps,
  ]);


  /* ========================================================
     OPEN FOLLOW-UP
  ======================================================== */

  const openFollowUp = (leadId) => {

    if (!leadId) {

      console.warn(
        "Unable to open follow-up: missing lead ID."
      );

      return;
    }

    navigate(
      `/followup/${leadId}`
    );

  };


  /* ========================================================
     FORMAT DATE
  ======================================================== */

  const formatDate = (lead) => {

    const date =
      getDate(lead);

    if (!date) {
      return "Not scheduled";
    }

    return date.toLocaleDateString(
      undefined,
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );

  };


  /* ========================================================
     FORMAT TIME
  ======================================================== */

  const formatTime = (lead) => {

    const date =
      getDate(lead);

    if (!date) {
      return "No time";
    }

    return date.toLocaleTimeString(
      undefined,
      {
        hour: "2-digit",
        minute: "2-digit",
      }
    );

  };


  /* ========================================================
     LOADING
  ======================================================== */

  if (loading) {

    return (
      <div
        className="
          flex
          min-h-screen
          items-center
          justify-center
          bg-slate-950
        "
      >

        <div className="text-center">

          <CalendarClock
            size={48}
            className="
              mx-auto
              mb-4
              animate-pulse
              text-cyan-400
            "
          />

          <p className="text-slate-400">
            Loading your follow-up workspace...
          </p>

        </div>

      </div>
    );

  }


  /* ========================================================
     ERROR
  ======================================================== */

  if (error) {

    return (
      <div
        className="
          flex
          min-h-screen
          items-center
          justify-center
          bg-slate-950
          p-6
        "
      >

        <div
          className="
            w-full
            max-w-lg
            rounded-2xl
            border
            border-red-900
            bg-red-950/30
            p-8
          "
        >

          <div className="flex items-center gap-3">

            <AlertTriangle
              className="text-red-400"
              size={26}
            />

            <h2 className="text-xl font-bold text-white">
              Unable to load follow-ups
            </h2>

          </div>

          <p className="mt-4 text-red-300">
            {error}
          </p>

          <button
            onClick={refreshFollowUps}
            className="
              mt-6
              inline-flex
              items-center
              gap-2
              rounded-xl
              bg-red-500
              px-5
              py-3
              font-semibold
              text-white
              transition
              hover:bg-red-400
            "
          >

            <RefreshCw size={17} />

            Retry

          </button>

        </div>

      </div>
    );

  }


  /* ========================================================
     MAIN WORKSPACE
  ======================================================== */

  return (
    <main
      className="
        min-h-screen
        bg-slate-950
        p-6
        lg:p-8
      "
    >

      <div
        className="
          mx-auto
          max-w-7xl
          space-y-8
        "
      >

        {/* ==================================================
            HEADER
        ================================================== */}

        <section
          className="
            rounded-3xl
            border
            border-slate-800
            bg-slate-900
            p-6
            lg:p-8
          "
        >

          <div
            className="
              flex
              flex-col
              gap-6
              lg:flex-row
              lg:items-center
              lg:justify-between
            "
          >

            <div>

              <div className="flex items-center gap-3">

                <CalendarClock
                  size={30}
                  className="text-cyan-400"
                />

                <h1
                  className="
                    text-3xl
                    font-bold
                    text-white
                  "
                >
                  My Follow-ups
                </h1>

              </div>

              <p
                className="
                  mt-3
                  max-w-2xl
                  text-slate-400
                "
              >
                Stay on top of customer commitments,
                follow-up actions, and AI-assisted
                check-ins assigned to you.
              </p>

            </div>


            <div
              className="
                flex
                flex-wrap
                gap-3
              "
            >

              <button
                onClick={refreshFollowUps}
                className="
                  inline-flex
                  items-center
                  gap-2
                  rounded-xl
                  border
                  border-slate-700
                  bg-slate-950
                  px-4
                  py-3
                  font-semibold
                  text-white
                  transition
                  hover:border-cyan-500
                "
              >

                <RefreshCw size={17} />

                Refresh

              </button>

              <button
                onClick={() =>
                  navigate("/followups")
                }
                className="
                  inline-flex
                  items-center
                  gap-2
                  rounded-xl
                  bg-cyan-500
                  px-5
                  py-3
                  font-semibold
                  text-slate-950
                  transition
                  hover:bg-cyan-400
                "
              >

                Open Inbox

                <ArrowRight size={17} />

              </button>

            </div>

          </div>

        </section>


        {/* ==================================================
            WORKLOAD STATISTICS
        ================================================== */}

        <section
          className="
            grid
            gap-4
            sm:grid-cols-2
            xl:grid-cols-5
          "
        >

          {/* Total */}

          <div
            className="
              rounded-2xl
              border
              border-slate-800
              bg-slate-900
              p-5
            "
          >

            <div className="flex items-center justify-between">

              <p className="text-sm text-slate-400">
                Total
              </p>

              <Users
                size={20}
                className="text-slate-500"
              />

            </div>

            <p
              className="
                mt-3
                text-3xl
                font-black
                text-white
              "
            >
              {statistics.total}
            </p>

          </div>


          {/* Today */}

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

            <p
              className="
                mt-3
                text-3xl
                font-black
                text-yellow-300
              "
            >
              {statistics.today}
            </p>

            <p className="mt-1 text-xs text-yellow-500/70">
              Actions requiring attention
            </p>

          </div>


          {/* Overdue */}

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

            <p
              className="
                mt-3
                text-3xl
                font-black
                text-red-300
              "
            >
              {statistics.overdue}
            </p>

            <p className="mt-1 text-xs text-red-500/70">
              Need immediate attention
            </p>

          </div>


          {/* Upcoming */}

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

            <p
              className="
                mt-3
                text-3xl
                font-black
                text-cyan-300
              "
            >
              {statistics.upcoming}
            </p>

            <p className="mt-1 text-xs text-cyan-500/70">
              Future customer actions
            </p>

          </div>


          {/* Completed */}

          <div
            className="
              rounded-2xl
              border
              border-emerald-900/40
              bg-emerald-950/10
              p-5
            "
          >

            <p className="text-sm text-emerald-400">
              Completed
            </p>

            <p
              className="
                mt-3
                text-3xl
                font-black
                text-emerald-300
              "
            >
              {statistics.completed}
            </p>

            <p className="mt-1 text-xs text-emerald-500/70">
              Customer actions completed
            </p>

          </div>

        </section>


        {/* ==================================================
            QUICK ACTIONS
        ================================================== */}

        <section>

          <div className="mb-4">

            <h2
              className="
                text-xl
                font-bold
                text-white
              "
            >
              Follow-up Tools
            </h2>

            <p className="mt-1 text-sm text-slate-400">
              Access the shared follow-up management tools.
            </p>

          </div>

          <div
            className="
              grid
              gap-4
              md:grid-cols-2
              xl:grid-cols-3
            "
          >

            {/* Inbox */}

            <button
              onClick={() =>
                navigate("/followups")
              }
              className="
                group
                rounded-2xl
                border
                border-slate-800
                bg-slate-900
                p-6
                text-left
                transition
                hover:border-cyan-500/50
                hover:bg-slate-800
              "
            >

              <CalendarClock
                size={28}
                className="
                  text-cyan-400
                  transition
                  group-hover:scale-110
                "
              />

              <h3 className="mt-4 text-lg font-bold text-white">
                Follow-up Inbox
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-400">
                View, search, filter, and open your assigned
                customer follow-ups.
              </p>

              <span
                className="
                  mt-4
                  inline-flex
                  items-center
                  gap-2
                  text-sm
                  font-semibold
                  text-cyan-400
                "
              >
                Open Inbox
                <ArrowRight size={15} />
              </span>

            </button>


            {/* Calendar */}

            <button
              onClick={() =>
                navigate("/followups/calendar")
              }
              className="
                group
                rounded-2xl
                border
                border-slate-800
                bg-slate-900
                p-6
                text-left
                transition
                hover:border-cyan-500/50
                hover:bg-slate-800
              "
            >

              <CalendarDays
                size={28}
                className="
                  text-cyan-400
                  transition
                  group-hover:scale-110
                "
              />

              <h3 className="mt-4 text-lg font-bold text-white">
                Follow-up Calendar
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-400">
                Plan customer actions by date and identify
                overdue work.
              </p>

              <span
                className="
                  mt-4
                  inline-flex
                  items-center
                  gap-2
                  text-sm
                  font-semibold
                  text-cyan-400
                "
              >
                Open Calendar
                <ArrowRight size={15} />
              </span>

            </button>


            {/* Today's work */}

            <button
              onClick={() =>
                navigate("/followups")
              }
              className="
                group
                rounded-2xl
                border
                border-slate-800
                bg-slate-900
                p-6
                text-left
                transition
                hover:border-yellow-500/50
                hover:bg-slate-800
              "
            >

              <Clock3
                size={28}
                className="
                  text-yellow-400
                  transition
                  group-hover:scale-110
                "
              />

              <h3 className="mt-4 text-lg font-bold text-white">
                Today's Actions
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-400">
                Focus on customers who require an action
                today.
              </p>

              <span
                className="
                  mt-4
                  inline-flex
                  items-center
                  gap-2
                  text-sm
                  font-semibold
                  text-yellow-400
                "
              >
                View Today's Work
                <ArrowRight size={15} />
              </span>

            </button>

          </div>

        </section>


        {/* ==================================================
            TODAY + OVERDUE
        ================================================== */}

        <section
          className="
            grid
            gap-6
            xl:grid-cols-2
          "
        >

          {/* =================================================
              TODAY
          ================================================= */}

          <section
            className="
              rounded-3xl
              border
              border-yellow-900/40
              bg-yellow-950/10
              p-6
            "
          >

            <div className="flex items-center justify-between">

              <div className="flex items-center gap-3">

                <Clock3
                  size={23}
                  className="text-yellow-400"
                />

                <div>

                  <h2 className="text-xl font-bold text-white">
                    Today's Follow-ups
                  </h2>

                  <p className="text-sm text-slate-400">
                    Customers requiring action today.
                  </p>

                </div>

              </div>

              <span
                className="
                  rounded-full
                  bg-yellow-500/20
                  px-3
                  py-1
                  text-sm
                  font-bold
                  text-yellow-300
                "
              >
                {statistics.today}
              </span>

            </div>


            <div className="mt-6 space-y-3">

              {todaysFollowUps.length === 0 ? (

                <div
                  className="
                    rounded-2xl
                    border
                    border-dashed
                    border-slate-700
                    p-8
                    text-center
                  "
                >

                  <CheckCircle2
                    size={34}
                    className="
                      mx-auto
                      text-emerald-400
                    "
                  />

                  <p className="mt-3 font-semibold text-white">
                    No follow-ups due today
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    Your schedule is clear.
                  </p>

                </div>

              ) : (

                todaysFollowUps.map((lead) => (

                  <button
                    key={lead._id}
                    onClick={() =>
                      openFollowUp(lead._id)
                    }
                    className="
                      flex
                      w-full
                      items-center
                      justify-between
                      rounded-xl
                      border
                      border-slate-800
                      bg-slate-950
                      p-4
                      text-left
                      transition
                      hover:border-yellow-500/50
                      hover:bg-slate-900
                    "
                  >

                    <div className="min-w-0">

                      <p className="truncate font-semibold text-white">
                        {lead.name ||
                          lead.customerName ||
                          "Customer"}
                      </p>

                      <p className="mt-1 text-sm text-slate-400">
                        {formatTime(lead)}
                      </p>

                    </div>

                    <ArrowRight
                      size={18}
                      className="shrink-0 text-yellow-400"
                    />

                  </button>

                ))

              )}

            </div>


            {statistics.today > 5 && (

              <button
                onClick={() =>
                  navigate("/followups")
                }
                className="
                  mt-5
                  text-sm
                  font-semibold
                  text-yellow-400
                  hover:text-yellow-300
                "
              >
                View all today's follow-ups →
              </button>

            )}

          </section>


          {/* =================================================
              OVERDUE
          ================================================= */}

          <section
            className="
              rounded-3xl
              border
              border-red-900/50
              bg-red-950/10
              p-6
            "
          >

            <div className="flex items-center justify-between">

              <div className="flex items-center gap-3">

                <AlertTriangle
                  size={23}
                  className="text-red-400"
                />

                <div>

                  <h2 className="text-xl font-bold text-white">
                    Overdue Follow-ups
                  </h2>

                  <p className="text-sm text-slate-400">
                    Customer actions that need attention.
                  </p>

                </div>

              </div>

              <span
                className="
                  rounded-full
                  bg-red-500/20
                  px-3
                  py-1
                  text-sm
                  font-bold
                  text-red-300
                "
              >
                {statistics.overdue}
              </span>

            </div>


            <div className="mt-6 space-y-3">

              {overdueFollowUps.length === 0 ? (

                <div
                  className="
                    rounded-2xl
                    border
                    border-dashed
                    border-slate-700
                    p-8
                    text-center
                  "
                >

                  <CheckCircle2
                    size={34}
                    className="
                      mx-auto
                      text-emerald-400
                    "
                  />

                  <p className="mt-3 font-semibold text-white">
                    No overdue follow-ups
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    Great — nothing is waiting past its due date.
                  </p>

                </div>

              ) : (

                overdueFollowUps.map((lead) => (

                  <button
                    key={lead._id}
                    onClick={() =>
                      openFollowUp(lead._id)
                    }
                    className="
                      flex
                      w-full
                      items-center
                      justify-between
                      rounded-xl
                      border
                      border-red-900/40
                      bg-red-950/20
                      p-4
                      text-left
                      transition
                      hover:border-red-500/50
                    "
                  >

                    <div className="min-w-0">

                      <p className="truncate font-semibold text-white">
                        {lead.name ||
                          lead.customerName ||
                          "Customer"}
                      </p>

                      <p className="mt-1 text-sm text-red-400">
                        Due {formatDate(lead)}
                      </p>

                    </div>

                    <ArrowRight
                      size={18}
                      className="shrink-0 text-red-400"
                    />

                  </button>

                ))

              )}

            </div>


            {statistics.overdue > 5 && (

              <button
                onClick={() =>
                  navigate("/followups")
                }
                className="
                  mt-5
                  text-sm
                  font-semibold
                  text-red-400
                  hover:text-red-300
                "
              >
                View all overdue follow-ups →
              </button>

            )}

          </section>

        </section>


        {/* ==================================================
            UPCOMING
        ================================================== */}

        <section
          className="
            rounded-3xl
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
              sm:flex-row
              sm:items-center
              sm:justify-between
            "
          >

            <div className="flex items-center gap-3">

              <CalendarDays
                size={23}
                className="text-cyan-400"
              />

              <div>

                <h2 className="text-xl font-bold text-white">
                  Upcoming Customer Actions
                </h2>

                <p className="text-sm text-slate-400">
                  Prepare for your next customer conversations.
                </p>

              </div>

            </div>

            <button
              onClick={() =>
                navigate("/followups/calendar")
              }
              className="
                inline-flex
                items-center
                gap-2
                text-sm
                font-semibold
                text-cyan-400
                hover:text-cyan-300
              "
            >
              Calendar
              <ArrowRight size={15} />
            </button>

          </div>


          <div
            className="
              mt-6
              overflow-x-auto
            "
          >

            {upcomingFollowUps.length === 0 ? (

              <div
                className="
                  rounded-2xl
                  border
                  border-dashed
                  border-slate-700
                  p-10
                  text-center
                "
              >

                <CalendarDays
                  size={36}
                  className="
                    mx-auto
                    text-slate-600
                  "
                />

                <p className="mt-3 font-semibold text-white">
                  No upcoming follow-ups
                </p>

              </div>

            ) : (

              <div className="min-w-[700px]">

                <div
                  className="
                    grid
                    grid-cols-[2fr_1fr_1fr_1fr_auto]
                    gap-4
                    border-b
                    border-slate-800
                    px-4
                    pb-3
                    text-xs
                    font-semibold
                    uppercase
                    tracking-wide
                    text-slate-500
                  "
                >

                  <span>Customer</span>
                  <span>Date</span>
                  <span>Time</span>
                  <span>Check-up</span>
                  <span />

                </div>


                <div className="divide-y divide-slate-800">

                  {upcomingFollowUps.map((lead) => {

                    const checkUpStatus =
                      getCheckUpStatus(lead);

                    return (

                      <button
                        key={lead._id}
                        onClick={() =>
                          openFollowUp(
                            lead._id
                          )
                        }
                        className="
                          grid
                          w-full
                          grid-cols-[2fr_1fr_1fr_1fr_auto]
                          items-center
                          gap-4
                          px-4
                          py-4
                          text-left
                          transition
                          hover:bg-slate-800/50
                        "
                      >

                        <div className="min-w-0">

                          <p className="truncate font-semibold text-white">
                            {lead.name ||
                              lead.customerName ||
                              "Customer"}
                          </p>

                          <p className="mt-1 truncate text-xs text-slate-500">
                            {lead.phone || "No phone"}
                          </p>

                        </div>


                        <span className="text-sm text-slate-300">
                          {formatDate(lead)}
                        </span>


                        <span className="text-sm text-slate-300">
                          {formatTime(lead)}
                        </span>


                        <span
                          className={`
                            inline-flex
                            w-fit
                            items-center
                            gap-2
                            rounded-full
                            px-3
                            py-1
                            text-xs
                            font-semibold

                            ${
                              checkUpStatus === "Sent"
                                ? "bg-emerald-500/20 text-emerald-400"
                                : checkUpStatus === "Ready"
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


                        <ArrowRight
                          size={17}
                          className="text-slate-500"
                        />

                      </button>

                    );

                  })}

                </div>

              </div>

            )}

          </div>

        </section>


        {/* ==================================================
            AGENT WORKFLOW NOTE
        ================================================== */}

        <section
          className="
            rounded-2xl
            border
            border-cyan-900/40
            bg-cyan-950/10
            p-5
          "
        >

          <div className="flex gap-3">

            <MessageCircle
              size={21}
              className="
                mt-0.5
                shrink-0
                text-cyan-400
              "
            />

            <div>

              <h3 className="font-semibold text-white">
                Agent workflow
              </h3>

              <p className="mt-1 text-sm leading-6 text-slate-400">
                Use this workspace to prioritize customer
                actions. Open a follow-up when you need to
                review or update its schedule, notes, outcome,
                or AI-assisted check-up message.
              </p>

            </div>

          </div>

        </section>

      </div>

    </main>
  );

};


export default AgentFollowUps;