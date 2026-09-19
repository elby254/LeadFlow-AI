// ======================================================
// Upcoming Viewings Dashboard Widget
// ======================================================

import { useEffect } from "react";

import {
  CalendarDays,
  Clock,
  MapPin,
  User,
  ChevronRight,
  RefreshCw,
  AlertCircle,
} from "lucide-react";

import useViewings from "../../hooks/useViewings";

import ViewingStatusBadge from "./ViewingStatusBadge";

// ======================================================
// COMPONENT
// ======================================================

const UpcomingViewingsWidget = ({
  limit = 5,
  onViewingClick,
  onViewAll,
}) => {

  // ====================================================
  // VIEWINGS HOOK
  // ====================================================

  const {
    viewings,
    loading,
    error,
    loadUpcoming,
  } = useViewings();

  // ====================================================
  // LOAD UPCOMING VIEWINGS
  // ====================================================

  useEffect(() => {

    loadUpcoming();

  }, [loadUpcoming]);

  // ====================================================
  // FILTER UPCOMING VIEWINGS
  // ====================================================

  const upcomingViewings = (viewings || [])
    .filter((viewing) => {

      const status =
        viewing?.status?.toLowerCase();

      return (
        status === "approved" ||
        status === "scheduled" ||
        status === "rescheduled"
      );

    })
    .sort((a, b) => {

      const first =
        new Date(
          a?.scheduledAt ||
          a?.startTime ||
          a?.date
        ).getTime();

      const second =
        new Date(
          b?.scheduledAt ||
          b?.startTime ||
          b?.date
        ).getTime();

      return first - second;

    })
    .slice(0, limit);

  // ====================================================
  // FORMAT DATE
  // ====================================================

  const formatDate = (value) => {

    if (!value) {
      return "Date not available";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "Date not available";
    }

    return date.toLocaleDateString(
      "en-KE",
      {
        weekday: "short",
        day: "numeric",
        month: "short",
      }
    );

  };

  // ====================================================
  // FORMAT TIME
  // ====================================================

  const formatTime = (value) => {

    if (!value) {
      return "Time not available";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "Time not available";
    }

    return date.toLocaleTimeString(
      "en-KE",
      {
        hour: "2-digit",
        minute: "2-digit",
      }
    );

  };

  // ====================================================
  // GET VIEWING DATETIME
  // ====================================================

  const getViewingDateTime = (viewing) => {

    return (
      viewing?.scheduledAt ||
      viewing?.startTime ||
      viewing?.date ||
      null
    );

  };

  // ====================================================
  // RENDER
  // ====================================================

  return (

    <section className="rounded-2xl border border-gray-200 bg-white shadow-sm">

      {/* ==================================================
          HEADER
      =================================================== */}

      <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">

        <div className="flex items-center gap-3">

          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">

            <CalendarDays size={20} />

          </div>

          <div>

            <h2 className="font-semibold text-gray-900">
              Upcoming Viewings
            </h2>

            <p className="text-xs text-gray-500">
              Scheduled property appointments
            </p>

          </div>

        </div>

        <button
          type="button"
          onClick={() => loadUpcoming()}
          disabled={loading}
          className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
          aria-label="Refresh upcoming viewings"
        >

          <RefreshCw
            size={17}
            className={
              loading
                ? "animate-spin"
                : ""
            }
          />

        </button>

      </div>

      {/* ==================================================
          ERROR
      =================================================== */}

      {error && (

        <div className="flex items-start gap-2 border-b border-red-100 bg-red-50 px-5 py-3 text-sm text-red-700">

          <AlertCircle
            size={17}
            className="mt-0.5 flex-shrink-0"
          />

          <span>
            {error}
          </span>

        </div>

      )}

      {/* ==================================================
          LOADING
      =================================================== */}

      {loading && (

        <div className="space-y-3 p-5">

          {[1, 2, 3].map((item) => (

            <div
              key={item}
              className="animate-pulse rounded-xl border border-gray-100 p-4"
            >

              <div className="h-4 w-1/2 rounded bg-gray-200" />

              <div className="mt-3 h-3 w-3/4 rounded bg-gray-100" />

              <div className="mt-2 h-3 w-1/2 rounded bg-gray-100" />

            </div>

          ))}

        </div>

      )}

      {/* ==================================================
          EMPTY STATE
      =================================================== */}

      {!loading &&
        upcomingViewings.length === 0 && (

          <div className="px-5 py-10 text-center">

            <CalendarDays
              size={32}
              className="mx-auto text-gray-300"
            />

            <h3 className="mt-3 font-medium text-gray-800">
              No upcoming viewings
            </h3>

            <p className="mt-1 text-sm text-gray-500">
              Scheduled property viewings will appear here.
            </p>

          </div>

        )}

      {/* ==================================================
          VIEWINGS
      =================================================== */}

      {!loading &&
        upcomingViewings.length > 0 && (

          <div className="divide-y divide-gray-100">

            {upcomingViewings.map(
              (viewing) => {

                const dateTime =
                  getViewingDateTime(
                    viewing
                  );

                return (

                  <button
                    key={viewing._id}
                    type="button"
                    onClick={() =>
                      onViewingClick?.(
                        viewing
                      )
                    }
                    className="group w-full px-5 py-4 text-left transition hover:bg-gray-50"
                  >

                    <div className="flex items-start gap-4">

                      {/* DATE */}

                      <div className="flex w-14 flex-shrink-0 flex-col items-center rounded-xl bg-emerald-50 px-2 py-2">

                        <span className="text-xs font-medium uppercase text-emerald-600">
                          {dateTime
                            ? new Date(
                                dateTime
                              ).toLocaleDateString(
                                "en-KE",
                                {
                                  month: "short",
                                }
                              )
                            : "---"}
                        </span>

                        <span className="text-xl font-bold text-emerald-700">
                          {dateTime
                            ? new Date(
                                dateTime
                              ).getDate()
                            : "--"}
                        </span>

                      </div>

                      {/* CONTENT */}

                      <div className="min-w-0 flex-1">

                        {/* PROPERTY */}

                        <div className="flex items-start justify-between gap-3">

                          <div className="min-w-0">

                            <h3 className="truncate font-semibold text-gray-900">
                              {viewing.propertyName ||
                                viewing.property?.name ||
                                "Property viewing"}
                            </h3>

                            <p className="mt-1 truncate text-sm text-gray-500">
                              {viewing.customerName ||
                                viewing.customer?.name ||
                                "Customer"}
                            </p>

                          </div>

                          <ViewingStatusBadge
                            status={
                              viewing.status
                            }
                          />

                        </div>

                        {/* DETAILS */}

                        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs text-gray-500">

                          <span className="flex items-center gap-1">

                            <Clock size={14} />

                            {formatTime(
                              dateTime
                            )}

                          </span>

                          <span className="flex items-center gap-1">

                            <MapPin size={14} />

                            {viewing.location ||
                              viewing.property?.location ||
                              "Location pending"}

                          </span>

                          <span className="flex items-center gap-1">

                            <User size={14} />

                            {viewing.agentName ||
                              viewing.agent?.name ||
                              "Assigned agent"}

                          </span>

                        </div>

                        {/* DATE */}

                        <p className="mt-2 text-xs font-medium text-gray-600">

                          {formatDate(
                            dateTime
                          )}

                        </p>

                      </div>

                      {/* CHEVRON */}

                      <ChevronRight
                        size={18}
                        className="mt-2 flex-shrink-0 text-gray-300 transition group-hover:translate-x-1 group-hover:text-gray-500"
                      />

                    </div>

                  </button>

                );

              }
            )}

          </div>

        )}

      {/* ==================================================
          FOOTER
      =================================================== */}

      {upcomingViewings.length > 0 && (

        <div className="border-t border-gray-200 px-5 py-3">

          <button
            type="button"
            onClick={() =>
              onViewAll?.()
            }
            className="flex w-full items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium text-emerald-600 transition hover:bg-emerald-50"
          >

            View all upcoming viewings

            <ChevronRight size={16} />

          </button>

        </div>

      )}

    </section>

  );

};

export default UpcomingViewingsWidget;