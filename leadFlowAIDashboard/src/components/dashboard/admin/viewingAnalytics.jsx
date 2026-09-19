// ======================================================
//
// Purpose
// ------------------------------------------------------
// Calculates and displays viewing performance analytics
// directly from the viewings supplied by AdminViewings.
//
// Current LeadFlow AI workflow:
//
// ViewingContext
//      ↓
// AdminViewings
//      ↓
// ViewingAnalytics
//      ↓
// Calculate analytics from viewings
//
// No separate analytics endpoint is required.
//
// Supported outcomes:
// ------------------------------------------------------
// ✓ Completed
// ✓ Cancelled / Canceled
// ✓ No Show / No-Show / Noshow
// ✓ Total Viewings
//
// ======================================================

import {
  CalendarCheck2,
  CalendarX2,
  UserX,
  CalendarDays,
} from "lucide-react";

// ======================================================
// COMPONENT
// ======================================================

const ViewingAnalytics = ({
  viewings = [],
  loading = false,
}) => {
  // ====================================================
  // SAFETY
  // ====================================================
  //
  // Make sure the component always works even when
  // viewings is undefined, null, or another data type.
  // ====================================================

  const safeViewings = Array.isArray(viewings)
    ? viewings
    : [];

  // ====================================================
  // LOADING STATE
  // ====================================================

  if (loading) {
    return (
      <div className="space-y-6">

        {/* KPI SKELETONS */}

        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="h-32 animate-pulse rounded-xl bg-gray-200"
            />
          ))}
        </div>

        {/* PERFORMANCE SKELETON */}

        <div className="h-96 animate-pulse rounded-xl bg-gray-200" />
      </div>
    );
  }

  // ====================================================
  // STATUS NORMALIZATION
  // ====================================================
  //
  // LeadFlow AI may receive status values in different
  // formats depending on the backend/database.
  //
  // Examples:
  //
  // Completed
  // completed
  // COMPLETED
  //
  // Cancelled
  // canceled
  //
  // No Show
  // No-Show
  // noshow
  //
  // We normalize them before comparison.
  // ====================================================

  const getStatus = (viewing) => {
    return String(
      viewing?.status ||
        viewing?.viewingStatus ||
        ""
    )
      .trim()
      .toLowerCase();
  };

  // ====================================================
  // CALCULATE COMPLETED
  // ====================================================

  const completed = safeViewings.filter(
    (viewing) => {
      const status = getStatus(viewing);

      return status === "completed";
    }
  ).length;

  // ====================================================
  // CALCULATE CANCELLED
  // ====================================================

  const cancelled = safeViewings.filter(
    (viewing) => {
      const status = getStatus(viewing);

      return (
        status === "cancelled" ||
        status === "canceled"
      );
    }
  ).length;

  // ====================================================
  // CALCULATE NO SHOWS
  // ====================================================

  const noShows = safeViewings.filter(
    (viewing) => {
      const status = getStatus(viewing);

      return (
        status === "no-show" ||
        status === "no show" ||
        status === "noshow"
      );
    }
  ).length;

  // ====================================================
  // TOTAL VIEWINGS
  // ====================================================

  const total = safeViewings.length;

  // ====================================================
  // PERCENTAGES
  // ====================================================

  const completedPercentage =
    total > 0
      ? Math.round(
          (completed / total) * 100
        )
      : 0;

  const cancelledPercentage =
    total > 0
      ? Math.round(
          (cancelled / total) * 100
        )
      : 0;

  const noShowsPercentage =
    total > 0
      ? Math.round(
          (noShows / total) * 100
        )
      : 0;

  // ====================================================
  // COMPLETION RATE
  // ====================================================
  //
  // For this dashboard:
  //
  // Completion Rate =
  // Completed Viewings / Total Viewings
  //
  // ====================================================

  const completionRate =
    total > 0
      ? Math.round(
          (completed / total) * 100
        )
      : 0;

  // ====================================================
  // ANALYTICS OBJECT
  // ====================================================
  //
  // Keeping the calculated values in one object makes
  // the JSX below easier to read and maintain.
  // ====================================================

  const analytics = {
    completed,
    cancelled,
    noShows,
    total,
    completedPercentage,
    cancelledPercentage,
    noShowsPercentage,
    completionRate,
  };

  // ====================================================
  // RENDER
  // ====================================================

  return (
    <div className="space-y-6">

      {/* ==================================================
          KPI CARDS
      ================================================== */}

      <div className="grid gap-5 md:grid-cols-3">

        {/* =================================================
            COMPLETED
        ================================================= */}

        <div className="rounded-xl border border-emerald-200 bg-white p-6 shadow-sm">

          <div className="flex items-center justify-between">

            <div>
              <p className="text-sm text-gray-500">
                Completed Viewings
              </p>

              <h2 className="mt-2 text-3xl font-bold text-gray-900">
                {analytics.completed}
              </h2>
            </div>

            <div className="rounded-full bg-emerald-100 p-3">
              <CalendarCheck2
                size={26}
                className="text-emerald-600"
              />
            </div>

          </div>

        </div>

        {/* =================================================
            CANCELLED
        ================================================= */}

        <div className="rounded-xl border border-red-200 bg-white p-6 shadow-sm">

          <div className="flex items-center justify-between">

            <div>
              <p className="text-sm text-gray-500">
                Cancelled Viewings
              </p>

              <h2 className="mt-2 text-3xl font-bold text-gray-900">
                {analytics.cancelled}
              </h2>
            </div>

            <div className="rounded-full bg-red-100 p-3">
              <CalendarX2
                size={26}
                className="text-red-600"
              />
            </div>

          </div>

        </div>

        {/* =================================================
            NO SHOWS
        ================================================= */}

        <div className="rounded-xl border border-amber-200 bg-white p-6 shadow-sm">

          <div className="flex items-center justify-between">

            <div>
              <p className="text-sm text-gray-500">
                No Shows
              </p>

              <h2 className="mt-2 text-3xl font-bold text-gray-900">
                {analytics.noShows}
              </h2>
            </div>

            <div className="rounded-full bg-amber-100 p-3">
              <UserX
                size={26}
                className="text-amber-600"
              />
            </div>

          </div>

        </div>

      </div>

      {/* ==================================================
          PERFORMANCE PANEL
      ================================================== */}

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">

        {/* =================================================
            HEADER
        ================================================= */}

        <div className="border-b px-6 py-5">

          <div className="flex items-start gap-3">

            <CalendarDays
              size={22}
              className="mt-0.5 text-blue-600"
            />

            <div>

              <h2 className="text-lg font-semibold text-gray-900">
                Viewing Performance
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Overall viewing completion,
                cancellations, and no-show
                performance.
              </p>

            </div>

          </div>

        </div>

        {/* =================================================
            CHART / PERFORMANCE AREA
        ================================================= */}

        <div className="p-6">

          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">

            {/* ---------------------------------------------
                CHART HEADER
            --------------------------------------------- */}

            <div className="mb-5">

              <h3 className="font-semibold text-gray-900">
                Viewing Outcome Summary
              </h3>

              <p className="mt-1 text-sm text-gray-500">
                Distribution of completed,
                cancelled, and no-show
                appointments.
              </p>

            </div>

            {/* ---------------------------------------------
                PERFORMANCE BARS
            --------------------------------------------- */}

            <div className="space-y-5">

              {/* ==========================================
                  COMPLETED
              ========================================== */}

              <div>

                <div className="mb-1 flex items-center justify-between">

                  <span className="text-sm font-medium text-gray-700">
                    Completed
                  </span>

                  <span className="text-sm font-semibold text-gray-900">
                    {analytics.completed}
                  </span>

                </div>

                <div className="h-3 overflow-hidden rounded-full bg-gray-200">

                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                    style={{
                      width: `${analytics.completedPercentage}%`,
                    }}
                  />

                </div>

                <p className="mt-1 text-xs text-gray-500">
                  {analytics.completedPercentage}%
                </p>

              </div>

              {/* ==========================================
                  CANCELLED
              ========================================== */}

              <div>

                <div className="mb-1 flex items-center justify-between">

                  <span className="text-sm font-medium text-gray-700">
                    Cancelled
                  </span>

                  <span className="text-sm font-semibold text-gray-900">
                    {analytics.cancelled}
                  </span>

                </div>

                <div className="h-3 overflow-hidden rounded-full bg-gray-200">

                  <div
                    className="h-full rounded-full bg-red-500 transition-all duration-500"
                    style={{
                      width: `${analytics.cancelledPercentage}%`,
                    }}
                  />

                </div>

                <p className="mt-1 text-xs text-gray-500">
                  {analytics.cancelledPercentage}%
                </p>

              </div>

              {/* ==========================================
                  NO SHOWS
              ========================================== */}

              <div>

                <div className="mb-1 flex items-center justify-between">

                  <span className="text-sm font-medium text-gray-700">
                    No Shows
                  </span>

                  <span className="text-sm font-semibold text-gray-900">
                    {analytics.noShows}
                  </span>

                </div>

                <div className="h-3 overflow-hidden rounded-full bg-gray-200">

                  <div
                    className="h-full rounded-full bg-amber-500 transition-all duration-500"
                    style={{
                      width: `${analytics.noShowsPercentage}%`,
                    }}
                  />

                </div>

                <p className="mt-1 text-xs text-gray-500">
                  {analytics.noShowsPercentage}%
                </p>

              </div>

            </div>

          </div>

        </div>

        {/* =================================================
            FOOTER SUMMARY
        ================================================= */}

        <div className="flex items-center justify-between border-t bg-gray-50 px-6 py-5">

          {/* TOTAL */}

          <div>

            <p className="text-xs uppercase tracking-wide text-gray-500">
              Total Viewings
            </p>

            <p className="font-semibold text-gray-900">
              {analytics.total}
            </p>

          </div>

          {/* COMPLETION RATE */}

          <div className="text-right">

            <p className="text-xs uppercase tracking-wide text-gray-500">
              Completion Rate
            </p>

            <p className="font-semibold text-emerald-600">
              {analytics.completionRate}%
            </p>

          </div>

        </div>

      </div>

    </div>
  );
};

export default ViewingAnalytics;