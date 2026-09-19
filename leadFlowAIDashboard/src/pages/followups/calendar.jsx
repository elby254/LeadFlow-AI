/**
 * ==========================================================
 * SHARED FOLLOW-UP CALENDAR
 * ==========================================================
 *
 * File
 * ----
 * pages/followups/calendar.jsx
 *
 * PURPOSE
 * -------
 * Shared LeadFlowAI calendar for customer follow-up activity.
 *
 * This page is NOT agent-specific.
 *
 * It can be used by:
 * • Agents
 * • Managers
 * • Administrators
 * • Other authorized LeadFlowAI users
 *
 * Displays
 * --------
 * • Today's Follow-ups
 * • Upcoming Follow-ups
 * • Overdue Tasks
 * • Scheduled Calls
 * • AI check-up follow-ups
 * • Completed actions
 *
 * IMPORTANT
 * ---------
 * This page does not edit follow-ups directly.
 *
 * Detailed follow-up editing remains inside:
 *
 * /followup/:id
 *
 * Future Backend
 * --------------
 * GET    /api/followups/calendar
 * GET    /api/followups/day/:date
 *
 * ==========================================================
 */

import { useMemo, useState } from "react";

import {
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Clock,
  AlertTriangle,
  CheckCircle2,
  MessageCircle,
} from "lucide-react";

import MainLayout from "../../components/layout/mainLayout";
import PageHeader from "../../components/common/pageHeader";
import LoadingSpinner from "../../components/common/loadingSpinner";
import ErrorCard from "../../components/common/errorCard";

import useFollowUps from "../../hooks/useFollowUps";

/* ==========================================================
   CALENDAR CONSTANTS
========================================================== */

const DAYS = [
  "Sun",
  "Mon",
  "Tue",
  "Wed",
  "Thu",
  "Fri",
  "Sat",
];

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

/* ==========================================================
   SHARED FOLLOW-UP CALENDAR
========================================================== */

const Calendar = () => {
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

    date.setHours(0, 0, 0, 0);

    return date;
  }, []);

  /* ========================================================
     CALENDAR STATE
  ======================================================== */

  const [currentMonth, setCurrentMonth] = useState(
    today.getMonth()
  );

  const [currentYear, setCurrentYear] = useState(
    today.getFullYear()
  );

  const [selectedDate, setSelectedDate] = useState(
    new Date(today)
  );

  /* ========================================================
     NORMALIZE FOLLOW-UP DATE
  ======================================================== */

  const getFollowUpDate = (task) => {
    return (
      task?.nextFollowUpDate ||
      task?.followUpDate ||
      null
    );
  };

  /* ========================================================
     NORMALIZE STATUS
  ======================================================== */

  const getEffectiveStatus = (task) => {
    const date = getFollowUpDate(task);

    const status =
      task?.followUpStatus ||
      task?.status ||
      "Pending";

    const normalized = String(status).toLowerCase();

    /*
     * Completed and cancelled items retain
     * their explicit status.
     */

    if (
      normalized === "completed" ||
      normalized === "cancelled"
    ) {
      return status;
    }

    /*
     * If there is no scheduled date, preserve
     * the existing status.
     */

    if (!date) {
      return status;
    }

    const followDate = new Date(date);

    if (
      Number.isNaN(
        followDate.getTime()
      )
    ) {
      return status;
    }

    followDate.setHours(0, 0, 0, 0);

    /*
     * Automatically identify past scheduled
     * follow-ups as overdue.
     */

    if (followDate < today) {
      return "Overdue";
    }

    return status;
  };

  /* ========================================================
     MONTH NAVIGATION
  ======================================================== */

  const previousMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);

      setCurrentYear(
        (year) => year - 1
      );
    } else {
      setCurrentMonth(
        (month) => month - 1
      );
    }
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);

      setCurrentYear(
        (year) => year + 1
      );
    } else {
      setCurrentMonth(
        (month) => month + 1
      );
    }
  };

  /* ========================================================
     CALENDAR CALCULATIONS
  ======================================================== */

  const firstDay = new Date(
    currentYear,
    currentMonth,
    1
  ).getDay();

  const daysInMonth = new Date(
    currentYear,
    currentMonth + 1,
    0
  ).getDate();

  const calendarDays = useMemo(() => {
    const cells = [];

    /*
     * Empty cells before the first day of the month.
     */

    for (let i = 0; i < firstDay; i++) {
      cells.push(null);
    }

    /*
     * Actual days of the month.
     */

    for (
      let day = 1;
      day <= daysInMonth;
      day++
    ) {
      cells.push(day);
    }

    return cells;
  }, [
    firstDay,
    daysInMonth,
  ]);

  /* ========================================================
     SELECTED DATE FOLLOW-UPS
  ======================================================== */

  const selectedFollowUps = useMemo(() => {
    return followUps.filter((task) => {
      const date = getFollowUpDate(task);

      if (!date) {
        return false;
      }

      const taskDate = new Date(date);

      if (
        Number.isNaN(
          taskDate.getTime()
        )
      ) {
        return false;
      }

      return (
        taskDate.getDate() ===
          selectedDate.getDate() &&
        taskDate.getMonth() ===
          selectedDate.getMonth() &&
        taskDate.getFullYear() ===
          selectedDate.getFullYear()
      );
    });
  }, [
    followUps,
    selectedDate,
  ]);

  /* ========================================================
     CHECK FOLLOW-UPS ON DATE
  ======================================================== */

  const hasFollowUpsOnDate = (date) => {
    return followUps.some((task) => {
      const taskDate =
        getFollowUpDate(task);

      if (!taskDate) {
        return false;
      }

      const parsed = new Date(taskDate);

      if (
        Number.isNaN(
          parsed.getTime()
        )
      ) {
        return false;
      }

      return (
        parsed.getFullYear() ===
          date.getFullYear() &&
        parsed.getMonth() ===
          date.getMonth() &&
        parsed.getDate() ===
          date.getDate()
      );
    });
  };

  /* ========================================================
     CHECK OVERDUE FOLLOW-UPS ON DATE
  ======================================================== */

  const hasOverdueOnDate = (date) => {
    return followUps.some((task) => {
      const taskDate =
        getFollowUpDate(task);

      if (!taskDate) {
        return false;
      }

      const parsed = new Date(taskDate);

      if (
        Number.isNaN(
          parsed.getTime()
        )
      ) {
        return false;
      }

      return (
        parsed.getFullYear() ===
          date.getFullYear() &&
        parsed.getMonth() ===
          date.getMonth() &&
        parsed.getDate() ===
          date.getDate() &&
        getEffectiveStatus(task) ===
          "Overdue"
      );
    });
  };

  /* ========================================================
     UPCOMING FOLLOW-UPS
  ======================================================== */

  const upcomingFollowUps = useMemo(() => {
    return followUps
      .filter((task) => {
        const status =
          getEffectiveStatus(task);

        return (
          status === "Scheduled" ||
          status === "Pending"
        );
      })
      .filter((task) => {
        const date =
          getFollowUpDate(task);

        if (!date) {
          return false;
        }

        const parsed = new Date(date);

        if (
          Number.isNaN(
            parsed.getTime()
          )
        ) {
          return false;
        }

        return parsed >= today;
      })
      .sort((a, b) => {
        return (
          new Date(
            getFollowUpDate(a)
          ) -
          new Date(
            getFollowUpDate(b)
          )
        );
      })
      .slice(0, 5);
  }, [followUps, today]);

  /* ========================================================
     OVERDUE FOLLOW-UPS
  ======================================================== */

  const overdueFollowUps = useMemo(() => {
    return followUps
      .filter(
        (task) =>
          getEffectiveStatus(task) ===
          "Overdue"
      )
      .sort((a, b) => {
        return (
          new Date(
            getFollowUpDate(a)
          ) -
          new Date(
            getFollowUpDate(b)
          )
        );
      })
      .slice(0, 5);
  }, [followUps]);

  /* ========================================================
     COMPLETED FOLLOW-UPS
  ======================================================== */

  const completedCount = useMemo(() => {
    return followUps.filter(
      (task) =>
        getEffectiveStatus(task) ===
        "Completed"
    ).length;
  }, [followUps]);

  /* ========================================================
     LOADING
  ======================================================== */

  if (loading) {
    return (
      <MainLayout>
        <LoadingSpinner />
      </MainLayout>
    );
  }

  /* ========================================================
     ERROR
  ======================================================== */

  if (error) {
    return (
      <MainLayout>
        <ErrorCard
          message={error}
          onRetry={refreshFollowUps}
        />
      </MainLayout>
    );
  }

  /* ========================================================
     MAIN PAGE
  ======================================================== */

  return (
    <MainLayout>
      <div className="space-y-8">

        {/* =================================================
            PAGE HEADER
        ================================================= */}

        <PageHeader
          title="Follow-up Calendar"
          subtitle="Track customer check-ups, scheduled follow-ups and overdue actions."
        />

        {/* =================================================
            MONTH NAVIGATION
        ================================================= */}

        <section
          className="
            flex
            items-center
            justify-between
            rounded-3xl
            border
            border-slate-800
            bg-slate-900
            p-6
          "
        >

          <button
            type="button"
            onClick={previousMonth}
            aria-label="Previous month"
            className="
              rounded-xl
              border
              border-slate-700
              bg-slate-950
              p-3
              transition
              hover:border-cyan-500
            "
          >
            <ChevronLeft
              className="text-white"
            />
          </button>

          <div className="text-center">

            <h2
              className="
                text-3xl
                font-bold
                text-white
              "
            >
              {MONTHS[currentMonth]}{" "}
              {currentYear}
            </h2>

            <p className="mt-2 text-slate-400">
              Customer follow-up schedule
            </p>

          </div>

          <button
            type="button"
            onClick={nextMonth}
            aria-label="Next month"
            className="
              rounded-xl
              border
              border-slate-700
              bg-slate-950
              p-3
              transition
              hover:border-cyan-500
            "
          >
            <ChevronRight
              className="text-white"
            />
          </button>

        </section>

        {/* =================================================
            CALENDAR
        ================================================= */}

        <section
          className="
            rounded-3xl
            border
            border-slate-800
            bg-slate-900
            p-8
          "
        >

          {/* WEEK DAYS */}

          <div className="mb-6 grid grid-cols-7 gap-3">

            {DAYS.map((day) => (
              <div
                key={day}
                className="
                  py-3
                  text-center
                  text-sm
                  font-semibold
                  uppercase
                  tracking-wide
                  text-slate-400
                "
              >
                {day}
              </div>
            ))}

          </div>

          {/* CALENDAR GRID */}

          <div className="grid grid-cols-7 gap-3">

            {calendarDays.map(
              (day, index) => {

                /*
                 * Empty calendar cell.
                 */

                if (!day) {
                  return (
                    <div
                      key={`empty-${index}`}
                      className="
                        h-28
                        rounded-2xl
                        bg-slate-950
                      "
                    />
                  );
                }

                const date = new Date(
                  currentYear,
                  currentMonth,
                  day
                );

                const isToday =
                  date.toDateString() ===
                  today.toDateString();

                const isSelected =
                  date.toDateString() ===
                  selectedDate.toDateString();

                const hasFollowUps =
                  hasFollowUpsOnDate(
                    date
                  );

                const overdue =
                  hasOverdueOnDate(
                    date
                  );

                return (
                  <button
                    type="button"
                    key={day}
                    onClick={() =>
                      setSelectedDate(
                        date
                      )
                    }
                    aria-label={`Select ${date.toLocaleDateString()}`}
                    className={`
                      relative
                      flex
                      h-28
                      flex-col
                      rounded-2xl
                      border
                      p-3
                      text-left
                      transition

                      ${
                        isSelected
                          ? "border-cyan-500 bg-cyan-500/10"
                          : "border-slate-800 bg-slate-950 hover:border-cyan-500/40"
                      }
                    `}
                  >

                    {/* DATE */}

                    <span
                      className={`
                        text-lg
                        font-bold

                        ${
                          isToday
                            ? "text-cyan-400"
                            : "text-white"
                        }
                      `}
                    >
                      {day}
                    </span>

                    {/* INDICATORS */}

                    <div
                      className="
                        mt-auto
                        flex
                        items-center
                        gap-2
                      "
                    >

                      {hasFollowUps && (
                        <span
                          className="
                            h-3
                            w-3
                            rounded-full
                            bg-cyan-500
                          "
                          title="Follow-ups scheduled"
                        />
                      )}

                      {overdue && (
                        <AlertTriangle
                          size={14}
                          className="text-red-400"
                        />
                      )}

                    </div>

                  </button>
                );
              }
            )}

          </div>

        </section>

        {/* =================================================
            SELECTED DAY + SIDE PANELS
        ================================================= */}

        <section
          className="
            grid
            gap-8
            xl:grid-cols-2
          "
        >

          {/* =================================================
              SELECTED DAY
          ================================================= */}

          <section
            className="
              rounded-3xl
              border
              border-slate-800
              bg-slate-900
              p-8
            "
          >

            <div
              className="
                flex
                items-center
                gap-3
              "
            >

              <CalendarDays
                size={24}
                className="text-cyan-400"
              />

              <div>

                <h2
                  className="
                    text-2xl
                    font-bold
                    text-white
                  "
                >
                  {selectedDate.toLocaleDateString(
                    undefined,
                    {
                      weekday: "long",
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    }
                  )}
                </h2>

                <p className="text-slate-400">
                  Scheduled customer actions
                </p>

              </div>

            </div>

            <div className="mt-8 space-y-5">

              {selectedFollowUps.length === 0 ? (

                <div
                  className="
                    rounded-2xl
                    border
                    border-dashed
                    border-slate-700
                    py-14
                    text-center
                  "
                >

                  <CalendarDays
                    size={40}
                    className="
                      mx-auto
                      text-slate-600
                    "
                  />

                  <h3
                    className="
                      mt-4
                      text-lg
                      font-semibold
                      text-white
                    "
                  >
                    No Follow-ups Scheduled
                  </h3>

                  <p
                    className="
                      mt-2
                      text-slate-400
                    "
                  >
                    Nothing is planned for this day.
                  </p>

                </div>

              ) : (

                selectedFollowUps.map(
                  (task) => {

                    const taskDate =
                      getFollowUpDate(
                        task
                      );

                    const status =
                      getEffectiveStatus(
                        task
                      );

                    const checkUpSent =
                      Boolean(
                        task.checkUpMessageSent ||
                        task.checkupMessageSent ||
                        task.followUpMessageSent
                      );

                    return (
                      <div
                        key={task._id}
                        className="
                          rounded-2xl
                          border
                          border-slate-800
                          bg-slate-950
                          p-5
                        "
                      >

                        {/* CUSTOMER */}

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
                                font-semibold
                                text-white
                              "
                            >
                              {task.name ||
                                task.customerName ||
                                "Customer"}
                            </h3>

                            <p
                              className="
                                mt-1
                                text-sm
                                text-slate-400
                              "
                            >
                              {task.phone ||
                                "No phone"}
                            </p>

                          </div>

                          {/* STATUS */}

                          <span
                            className={`
                              rounded-full
                              px-3
                              py-1
                              text-xs
                              font-semibold

                              ${
                                status ===
                                "Completed"
                                  ? "bg-emerald-500/20 text-emerald-400"
                                  : status ===
                                    "Overdue"
                                  ? "bg-red-500/20 text-red-400"
                                  : "bg-cyan-500/20 text-cyan-400"
                              }
                            `}
                          >
                            {status}
                          </span>

                        </div>

                        {/* TIME */}

                        <div
                          className="
                            mt-5
                            flex
                            items-center
                            gap-3
                            text-slate-300
                          "
                        >

                          <Clock size={18} />

                          {taskDate
                            ? new Date(
                                taskDate
                              ).toLocaleTimeString(
                                [],
                                {
                                  hour: "2-digit",
                                  minute:
                                    "2-digit",
                                }
                              )
                            : "No time set"}

                        </div>

                        {/* REMINDER */}

                        {task.reminder && (
                          <p
                            className="
                              mt-4
                              text-sm
                              text-slate-400
                            "
                          >
                            Reminder:{" "}
                            {task.reminder}
                          </p>
                        )}

                        {/* NOTES */}

                        {task.notes && (
                          <p
                            className="
                              mt-4
                              text-sm
                              leading-7
                              text-slate-400
                            "
                          >
                            {task.notes}
                          </p>
                        )}

                        {/* CHECK-UP */}

                        <div
                          className="
                            mt-5
                            flex
                            items-center
                            gap-3
                          "
                        >

                          <MessageCircle
                            size={17}
                            className={
                              checkUpSent
                                ? "text-emerald-400"
                                : "text-slate-500"
                            }
                          />

                          <span
                            className={
                              checkUpSent
                                ? "text-sm text-emerald-400"
                                : "text-sm text-slate-500"
                            }
                          >
                            {checkUpSent
                              ? "Check-up sent"
                              : "Check-up not sent"}
                          </span>

                        </div>

                      </div>
                    );
                  }
                )

              )}

            </div>

          </section>

          {/* =================================================
              RIGHT COLUMN
          ================================================= */}

          <section className="space-y-8">

            {/* =================================================
                UPCOMING
            ================================================= */}

            <section
              className="
                rounded-3xl
                border
                border-slate-800
                bg-slate-900
                p-8
              "
            >

              <h2
                className="
                  text-2xl
                  font-bold
                  text-white
                "
              >
                Upcoming Follow-ups
              </h2>

              <div className="mt-6 space-y-4">

                {upcomingFollowUps.length ===
                0 ? (

                  <p
                    className="
                      text-sm
                      text-slate-500
                    "
                  >
                    No upcoming follow-ups.
                  </p>

                ) : (

                  upcomingFollowUps.map(
                    (task) => (
                      <div
                        key={task._id}
                        className="
                          flex
                          items-center
                          justify-between
                          rounded-xl
                          border
                          border-slate-800
                          bg-slate-950
                          p-4
                        "
                      >

                        <div>

                          <h3
                            className="
                              font-semibold
                              text-white
                            "
                          >
                            {task.name ||
                              task.customerName ||
                              "Customer"}
                          </h3>

                          <p
                            className="
                              text-sm
                              text-slate-400
                            "
                          >
                            {new Date(
                              getFollowUpDate(
                                task
                              )
                            ).toLocaleString()}
                          </p>

                        </div>

                        <Clock
                          size={18}
                          className="text-cyan-400"
                        />

                      </div>
                    )
                  )

                )}

              </div>

            </section>

            {/* =================================================
                OVERDUE
            ================================================= */}

            <section
              className="
                rounded-3xl
                border
                border-red-900
                bg-red-950/20
                p-8
              "
            >

              <h2
                className="
                  text-2xl
                  font-bold
                  text-red-400
                "
              >
                Overdue Tasks
              </h2>

              <div className="mt-6 space-y-4">

                {overdueFollowUps.length ===
                0 ? (

                  <p
                    className="
                      text-sm
                      text-slate-500
                    "
                  >
                    No overdue tasks.
                  </p>

                ) : (

                  overdueFollowUps.map(
                    (task) => (
                      <div
                        key={task._id}
                        className="
                          flex
                          items-center
                          justify-between
                          rounded-xl
                          border
                          border-red-900/40
                          bg-red-950/30
                          p-4
                        "
                      >

                        <div>

                          <h3
                            className="
                              font-semibold
                              text-white
                            "
                          >
                            {task.name ||
                              task.customerName ||
                              "Customer"}
                          </h3>

                          <p
                            className="
                              text-sm
                              text-slate-400
                            "
                          >
                            Due{" "}
                            {new Date(
                              getFollowUpDate(
                                task
                              )
                            ).toLocaleDateString()}
                          </p>

                        </div>

                        <AlertTriangle
                          size={20}
                          className="text-red-400"
                        />

                      </div>
                    )
                  )

                )}

              </div>

            </section>

            {/* =================================================
                COMPLETED
            ================================================= */}

            <section
              className="
                rounded-3xl
                border
                border-emerald-900/40
                bg-emerald-950/10
                p-8
              "
            >

              <div
                className="
                  flex
                  items-center
                  gap-3
                "
              >

                <CheckCircle2
                  size={22}
                  className="text-emerald-400"
                />

                <h2
                  className="
                    text-2xl
                    font-bold
                    text-white
                  "
                >
                  Completed Actions
                </h2>

              </div>

              <p
                className="
                  mt-4
                  text-slate-400
                "
              >
                {completedCount}{" "}
                follow-ups completed.
              </p>

            </section>

          </section>

        </section>

      </div>
    </MainLayout>
  );
};

export default Calendar;