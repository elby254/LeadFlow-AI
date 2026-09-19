import {
  CalendarCheck2,
  CalendarClock,
  Clock3,
  AlertCircle,
} from "lucide-react";

// ======================================================
//
// Displays a high-level operational summary of property
// viewings for the admin dashboard.
//
// Expected props:
// ------------------------------------------------------
// totalViewings     -> Total number of viewings
// viewings          -> Array of viewing objects
//
// Supported statuses:
// ------------------------------------------------------
// Pending Approval
// Approved
// Rescheduled
// Completed
// Cancelled
// Rejected
//
// ======================================================

const ViewingOverviewCard = ({
  totalViewings = 0,
  viewings = [],
}) => {
  // ====================================================
  // SAFETY
  // ====================================================
  //
  // Make sure viewings is always treated as an array.
  // This prevents the dashboard from crashing if the
  // API temporarily returns null or undefined.
  //
  const safeViewings = Array.isArray(viewings)
    ? viewings
    : [];

  // ====================================================
  // STATUS COUNTS
  // ====================================================

  const pendingCount = safeViewings.filter(
    (viewing) =>
      viewing.status === "Pending Approval"
  ).length;

  const approvedCount = safeViewings.filter(
    (viewing) =>
      viewing.status === "Approved"
  ).length;

  const rescheduledCount = safeViewings.filter(
    (viewing) =>
      viewing.status === "Rescheduled"
  ).length;

  const completedCount = safeViewings.filter(
    (viewing) =>
      viewing.status === "Completed"
  ).length;

  // ====================================================
  // ACTIVE VIEWINGS
  // ====================================================
  //
  // Active = Approved + Rescheduled.
  //
  const activeCount =
    approvedCount + rescheduledCount;

  // ====================================================
  // DISPLAY TOTAL
  // ====================================================

  const displayTotal =
    typeof totalViewings === "number"
      ? totalViewings
      : safeViewings.length;

  // ====================================================
  // CARD DATA
  // ====================================================

  const overviewItems = [
    {
      label: "Total Viewings",
      value: displayTotal,
      description: "All viewing appointments",
      icon: CalendarCheck2,
      iconWrapper:
        "bg-blue-100 text-blue-600",
      border:
        "border-blue-200",
    },

    {
      label: "Pending Approval",
      value: pendingCount,
      description: "Requests awaiting action",
      icon: Clock3,
      iconWrapper:
        "bg-amber-100 text-amber-600",
      border:
        "border-amber-200",
    },

    {
      label: "Active Viewings",
      value: activeCount,
      description: "Approved or rescheduled",
      icon: CalendarClock,
      iconWrapper:
        "bg-emerald-100 text-emerald-600",
      border:
        "border-emerald-200",
    },

    {
      label: "Completed",
      value: completedCount,
      description: "Successfully completed",
      icon: AlertCircle,
      iconWrapper:
        "bg-purple-100 text-purple-600",
      border:
        "border-purple-200",
    },
  ];

  // ====================================================
  // RENDER
  // ====================================================

  return (
    <section className="space-y-4">
      {/* ==================================================
          SECTION HEADER
      ================================================== */}

      <div>
        <h2 className="text-lg font-semibold text-gray-900">
          Viewing Overview
        </h2>

        <p className="mt-1 text-sm text-gray-500">
          Current property viewing activity across the agency.
        </p>
      </div>

      {/* ==================================================
          OVERVIEW CARDS
      ================================================== */}

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {overviewItems.map((item) => {
          const Icon = item.icon;

          return (
            <div
              key={item.label}
              className={`rounded-xl border bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${item.border}`}
            >
              <div className="flex items-start justify-between">
                {/* ----------------------------------------
                    TEXT
                ---------------------------------------- */}

                <div>
                  <p className="text-sm font-medium text-gray-500">
                    {item.label}
                  </p>

                  <p className="mt-2 text-3xl font-bold text-gray-900">
                    {item.value}
                  </p>

                  <p className="mt-1 text-xs text-gray-500">
                    {item.description}
                  </p>
                </div>

                {/* ----------------------------------------
                    ICON
                ---------------------------------------- */}

                <div
                  className={`rounded-full p-3 ${item.iconWrapper}`}
                >
                  <Icon size={24} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default ViewingOverviewCard;