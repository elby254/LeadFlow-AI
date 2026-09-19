// ======================================================
// Viewer Viewing Dashboard
// ======================================================
//
// LeadFlow AI
//
// Purpose
// ------------------------------------------------------
// Displays a viewer/customer's property viewing activity.
//
// Responsibilities
// ------------------------------------------------------
// ✓ Load user's viewings
// ✓ Display upcoming viewing
// ✓ Display viewing timeline
// ✓ Display selected viewing details
// ✓ Allow viewer to request a viewing
// ✓ Refresh viewing data
//
// Context
// ------------------------------------------------------
// MUST be rendered inside <ViewingProvider>.
// ======================================================

import { useEffect } from "react";

import { CalendarDays } from "lucide-react";

import { useViewingContext } from "../../context/viewingContext";

import ViewingRequestCard from "../../components/dashboard/viewer/viewingRequestCard";
import ViewingTimeline from "../../components/dashboard/viewer/viewingTimeline";
import ViewingDetailsCard from "../../components/dashboard/viewer/viewingDetailsCard";
import UpcomingViewingCard from "../../components/dashboard/viewer/UpcomingViewingCard";

// ======================================================
// COMPONENT
// ======================================================

const Viewings = () => {
  // ====================================================
  // VIEWING CONTEXT
  // ====================================================

  const {
    viewings = [],
    loading,
    error,
    selectedViewing,
    getViewings,
    refreshViewings,
  } = useViewingContext();

  // ====================================================
  // INITIAL LOAD
  // ====================================================

  useEffect(() => {
    if (typeof getViewings === "function") {
      getViewings();
    }
  }, [getViewings]);

  // ====================================================
  // LOADING STATE
  // ====================================================

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <CalendarDays
            className="mx-auto mb-4 animate-pulse text-blue-600"
            size={48}
          />

          <p className="text-gray-500">
            Loading your viewings...
          </p>
        </div>
      </div>
    );
  }

  // ====================================================
  // ERROR STATE
  // ====================================================

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-6">
        <div className="w-full max-w-md rounded-xl border border-red-200 bg-red-50 p-8">
          <h2 className="mb-2 text-lg font-semibold text-red-700">
            Unable to load viewings
          </h2>

          <p className="mb-6 text-red-600">
            {error}
          </p>

          <button
            type="button"
            onClick={refreshViewings}
            className="rounded-lg bg-red-600 px-4 py-2 text-white transition hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // ====================================================
  // MAIN PAGE
  // ====================================================

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ==================================================
          HEADER
      ================================================== */}

      <div className="border-b bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              My Property Viewings
            </h1>

            <p className="mt-2 text-gray-500">
              Manage your scheduled property visits,
              requests, and viewing history.
            </p>
          </div>

          <button
            type="button"
            onClick={refreshViewings}
            className="rounded-lg bg-blue-600 px-5 py-3 text-white transition hover:bg-blue-700"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* ==================================================
          CONTENT
      ================================================== */}

      <div className="mx-auto max-w-7xl space-y-6 px-6 py-8">
        {/* ==================================================
            UPCOMING VIEWING
        ================================================== */}

        <UpcomingViewingCard
          viewing={viewings[0] || null}
        />

        {/* ==================================================
            MAIN GRID
        ================================================== */}

        <div className="grid gap-6 lg:grid-cols-3">
          {/* ==================================================
              LEFT COLUMN
          ================================================== */}

          <div className="space-y-6 lg:col-span-2">
            <ViewingTimeline
              viewings={viewings}
            />

            <ViewingDetailsCard
              viewing={selectedViewing}
            />
          </div>

          {/* ==================================================
              RIGHT COLUMN
          ================================================== */}

          <div>
            <ViewingRequestCard />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Viewings;

