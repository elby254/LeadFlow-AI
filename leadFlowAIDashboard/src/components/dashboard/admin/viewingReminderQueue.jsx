// ======================================================
//
// Displays upcoming viewing reminders that require
// admin attention.
//
// Responsibilities:
// ------------------------------------------------------
// ✓ Today's upcoming viewings
// ✓ Near-term upcoming viewings
// ✓ Pending approval reminders
// ✓ Agent/customer/property context
// ✓ Quick visual urgency indicators
//
// This component is UI-focused.
// API/context data is supplied through ViewingContext.
//
// ======================================================

import {
  BellRing,
  CalendarClock,
  Clock3,
  User,
  Building2,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

import { useViewingContext } from "../../../context/viewingContext";

// ======================================================
// DATE HELPERS
// ======================================================

const getViewingDate = (viewing) => {
  if (!viewing?.viewingDate) {
    return null;
  }

  const date = new Date(viewing.viewingDate);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
};

const formatDate = (date) => {
  if (!date) {
    return "Date unavailable";
  }

  return date.toLocaleDateString("en-KE", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatTime = (time) => {
  if (!time) {
    return "Time unavailable";
  }

  const parts = String(time).split(":");

  if (parts.length < 2) {
    return String(time);
  }

  const hours = Number(parts[0]);
  const minutes = Number(parts[1]);

  if (
    Number.isNaN(hours) ||
    Number.isNaN(minutes)
  ) {
    return String(time);
  }

  const date = new Date();

  date.setHours(hours, minutes, 0, 0);

  return date.toLocaleTimeString("en-KE", {
    hour: "numeric",
    minute: "2-digit",
  });
};

// ======================================================
// DAYS FROM TODAY
// ======================================================

const getDaysFromToday = (date) => {
  if (!date) {
    return null;
  }

  const today = new Date();

  today.setHours(0, 0, 0, 0);

  const target = new Date(date);

  target.setHours(0, 0, 0, 0);

  const difference =
    target.getTime() -
    today.getTime();

  return Math.round(
    difference / (1000 * 60 * 60 * 24)
  );
};

// ======================================================
// REMINDER LABEL
// ======================================================

const getReminderLabel = (daysFromToday) => {
  if (daysFromToday === 0) {
    return {
      label: "Today",
      className:
        "bg-red-100 text-red-700 border-red-200",
    };
  }

  if (daysFromToday === 1) {
    return {
      label: "Tomorrow",
      className:
        "bg-amber-100 text-amber-700 border-amber-200",
    };
  }

  if (
    daysFromToday !== null &&
    daysFromToday > 1 &&
    daysFromToday <= 7
  ) {
    return {
      label: `In ${daysFromToday} days`,
      className:
        "bg-blue-100 text-blue-700 border-blue-200",
    };
  }

  return {
    label: "Upcoming",
    className:
      "bg-gray-100 text-gray-600 border-gray-200",
  };
};

// ======================================================
// STATUS BADGE
// ======================================================

const StatusBadge = ({ status }) => {
  const normalizedStatus =
    status || "Unknown";

  if (
    normalizedStatus ===
    "Pending Approval"
  ) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
        <AlertCircle size={13} />

        Pending approval
      </span>
    );
  }

  if (
    normalizedStatus ===
      "Approved" ||
    normalizedStatus ===
      "Rescheduled"
  ) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
        <CheckCircle2 size={13} />

        {normalizedStatus}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs font-medium text-gray-600">
      {normalizedStatus}
    </span>
  );
};

// ======================================================
// MAIN COMPONENT
// ======================================================

const ViewingReminderQueue = ({
  limit = 5,
}) => {
  // ====================================================
  // VIEWING CONTEXT
  // ====================================================

  const {
    viewings = [],
    loading = false,
    getViewings,
  } = useViewingContext();

  // ====================================================
  // SAFETY
  // ====================================================

  const safeViewings = Array.isArray(viewings)
    ? viewings
    : [];

  // ====================================================
  // BUILD REMINDER QUEUE
  // ====================================================
  //
  // Only approved/rescheduled/pending appointments
  // that are upcoming are included.
  //
  const reminderQueue = safeViewings
    .filter((viewing) => {
      const date =
        getViewingDate(viewing);

      if (!date) {
        return false;
      }

      const daysFromToday =
        getDaysFromToday(date);

      if (
        daysFromToday === null ||
        daysFromToday < 0
      ) {
        return false;
      }

      return [
        "Pending Approval",
        "Approved",
        "Rescheduled",
      ].includes(viewing.status);
    })
    .sort((a, b) => {
      const dateA =
        getViewingDate(a)?.getTime() ||
        0;

      const dateB =
        getViewingDate(b)?.getTime() ||
        0;

      if (dateA !== dateB) {
        return dateA - dateB;
      }

      return String(
        a.startTime || ""
      ).localeCompare(
        String(b.startTime || "")
      );
    })
    .slice(0, limit);

  // ====================================================
  // LOADING STATE
  // ====================================================

  if (loading) {
    return (
      <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b px-5 py-5">
          <div className="h-5 w-40 animate-pulse rounded bg-gray-200" />

          <div className="mt-2 h-4 w-56 animate-pulse rounded bg-gray-200" />
        </div>

        <div className="space-y-4 p-5">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="rounded-lg border border-gray-100 p-4"
            >
              <div className="h-4 w-32 animate-pulse rounded bg-gray-200" />

              <div className="mt-3 h-3 w-48 animate-pulse rounded bg-gray-200" />

              <div className="mt-2 h-3 w-36 animate-pulse rounded bg-gray-200" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  // ====================================================
  // RENDER
  // ====================================================

  return (
    <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
      {/* ==================================================
          HEADER
      ================================================== */}

      <div className="border-b px-5 py-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-blue-100 p-2">
                <BellRing
                  size={19}
                  className="text-blue-600"
                />
              </div>

              <h2 className="text-lg font-semibold text-gray-900">
                Viewing Reminders
              </h2>
            </div>

            <p className="mt-2 text-sm text-gray-500">
              Upcoming appointments requiring attention.
            </p>
          </div>

          <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">
            {reminderQueue.length}
          </span>
        </div>
      </div>

      {/* ==================================================
          QUEUE
      ================================================== */}

      <div className="divide-y divide-gray-100">
        {reminderQueue.length === 0 ? (
          <div className="flex min-h-[260px] flex-col items-center justify-center px-5 text-center">
            <CalendarClock
              size={42}
              className="mb-4 text-gray-300"
            />

            <h3 className="text-sm font-semibold text-gray-700">
              No upcoming reminders
            </h3>

            <p className="mt-1 max-w-xs text-xs leading-5 text-gray-500">
              There are no upcoming property viewings
              requiring attention.
            </p>
          </div>
        ) : (
          reminderQueue.map((viewing) => {
            const date =
              getViewingDate(viewing);

            const daysFromToday =
              getDaysFromToday(date);

            const reminder =
              getReminderLabel(
                daysFromToday
              );

            const property =
              viewing.property || {};

            const lead =
              viewing.lead || {};

            const agent =
              viewing.agent || {};

            const id =
              viewing._id ||
              viewing.id;

            return (
              <div
                key={id}
                className="p-5 transition hover:bg-gray-50"
              >
                {/* ========================================
                    REMINDER HEADER
                ======================================== */}

                <div className="flex items-start justify-between gap-3">
                  <span
                    className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${reminder.className}`}
                  >
                    {reminder.label}
                  </span>

                  <StatusBadge
                    status={viewing.status}
                  />
                </div>

                {/* ========================================
                    PROPERTY
                ======================================== */}

                <div className="mt-4 flex items-start gap-3">
                  <div className="rounded-lg bg-gray-100 p-2">
                    <Building2
                      size={17}
                      className="text-gray-600"
                    />
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-gray-900">
                      {property.title ||
                        viewing.propertyTitle ||
                        "Property unavailable"}
                    </p>

                    <p className="mt-1 truncate text-xs text-gray-500">
                      {property.location ||
                        "Location unavailable"}
                    </p>
                  </div>
                </div>

                {/* ========================================
                    DATE / TIME
                ======================================== */}

                <div className="mt-4 rounded-lg bg-gray-50 p-3">
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-800">
                    <CalendarClock
                      size={16}
                      className="text-blue-600"
                    />

                    {formatDate(date)}
                  </div>

                  <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
                    <Clock3
                      size={14}
                      className="text-gray-400"
                    />

                    {formatTime(
                      viewing.startTime
                    )}

                    {viewing.endTime && (
                      <>
                        <span>–</span>

                        {formatTime(
                          viewing.endTime
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* ========================================
                    LEAD / AGENT
                ======================================== */}

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="flex items-center gap-2">
                    <User
                      size={15}
                      className="text-gray-400"
                    />

                    <div className="min-w-0">
                      <p className="text-[11px] uppercase tracking-wide text-gray-400">
                        Lead
                      </p>

                      <p className="truncate text-xs font-medium text-gray-700">
                        {lead.name ||
                          viewing.leadName ||
                          "Unknown lead"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <User
                      size={15}
                      className="text-gray-400"
                    />

                    <div className="min-w-0">
                      <p className="text-[11px] uppercase tracking-wide text-gray-400">
                        Agent
                      </p>

                      <p className="truncate text-xs font-medium text-gray-700">
                        {agent.name ||
                          viewing.agentName ||
                          "Unassigned"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ==================================================
          FOOTER
      ================================================== */}

      <div className="flex items-center justify-between border-t bg-gray-50 px-5 py-4">
        <p className="text-xs text-gray-500">
          Showing the next {limit} relevant viewing
          {limit === 1 ? "" : "s"}.
        </p>

        {getViewings && (
          <button
            type="button"
            onClick={getViewings}
            className="text-xs font-medium text-blue-600 transition hover:text-blue-700"
          >
            Refresh
          </button>
        )}
      </div>
    </section>
  );
};

export default ViewingReminderQueue;

