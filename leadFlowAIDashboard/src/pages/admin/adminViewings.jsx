// ======================================================
// Admin Viewing Management
// ======================================================

import { useEffect } from "react";
import { CalendarCheck2 } from "lucide-react";

import { useViewingContext } from "../../context/viewingContext";

import ViewingOverviewCard from "../../components/dashboard/admin/viewingOverviewCard";
import ViewingStatusTable from "../../components/dashboard/admin/viewingStatusTable";
import ViewingAnalytics from "../../components/dashboard/admin/viewingAnalytics";
import ViewingReminderQueue from "../../components/dashboard/admin/viewingReminderQueue";

const AdminViewings = () => {
  const {
    viewings,
    loading,
    error,
    getViewings,
    refreshViewings,
  } = useViewingContext();

  useEffect(() => {
    getViewings();
  }, [getViewings]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <CalendarCheck2
            className="mx-auto mb-4 animate-pulse"
            size={48}
          />

          <p className="text-gray-500">
            Loading viewing operations...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="rounded-xl border border-red-200 bg-red-50 p-8">
          <h2 className="mb-2 text-lg font-semibold text-red-700">
            Unable to load viewing operations
          </h2>

          <p className="mb-6 text-red-600">
            {error}
          </p>

          <button
            type="button"
            onClick={refreshViewings}
            className="rounded-lg bg-red-600 px-4 py-2 text-white transition hover:bg-red-700"
          >
            Reload
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ==================================================
          HEADER
      ================================================== */}

      <div className="border-b bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6">

          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Viewing Management
            </h1>

            <p className="mt-2 text-gray-500">
              Monitor, approve, schedule and manage all
              property viewings across the agency.
            </p>
          </div>

          <button
            type="button"
            onClick={refreshViewings}
            className="rounded-lg bg-blue-600 px-5 py-3 text-white transition hover:bg-blue-700"
          >
            Refresh Dashboard
          </button>

        </div>
      </div>

      {/* ==================================================
          CONTENT
      ================================================== */}

      <div className="mx-auto max-w-7xl space-y-6 px-6 py-8">

        <ViewingOverviewCard
          totalViewings={viewings.length}
          viewings={viewings}
        />

        <ViewingAnalytics
          viewings={viewings}
        />

        <div className="grid gap-6 lg:grid-cols-3">

          <div className="space-y-6 lg:col-span-2">
            <ViewingStatusTable
              viewings={viewings}
            />
          </div>

          <div>
            <ViewingReminderQueue />
          </div>

        </div>

      </div>

    </div>
  );
};

export default AdminViewings;