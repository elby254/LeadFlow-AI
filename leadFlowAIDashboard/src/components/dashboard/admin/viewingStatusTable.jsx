// ======================================================
//
// Displays all property viewing requests and their
// current workflow status.
//
// Supports:
// ------------------------------------------------------
// ✓ Pending Approval
// ✓ Approved
// ✓ Rescheduled
// ✓ Completed
// ✓ Cancelled
// ✓ Rejected
//
// The component is intentionally UI-focused.
// Workflow actions should be handled through the
// ViewingContext so the table remains reusable.
//
// Expected props:
// ------------------------------------------------------
// viewings -> Array of viewing objects
//
// ======================================================

import {
  CalendarDays,
  Clock3,
  User,
  Building2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RotateCcw,
  UserX,
} from "lucide-react";

import { useViewingContext } from "../../../context/viewingContext";

// ======================================================
// STATUS CONFIGURATION
// ======================================================

const STATUS_CONFIG = {
  "Pending Approval": {
    label: "Pending Approval",
    className:
      "bg-amber-100 text-amber-700 border-amber-200",
    icon: Clock3,
  },

  Approved: {
    label: "Approved",
    className:
      "bg-emerald-100 text-emerald-700 border-emerald-200",
    icon: CheckCircle2,
  },

  Rescheduled: {
    label: "Rescheduled",
    className:
      "bg-blue-100 text-blue-700 border-blue-200",
    icon: RotateCcw,
  },

  Completed: {
    label: "Completed",
    className:
      "bg-purple-100 text-purple-700 border-purple-200",
    icon: CheckCircle2,
  },

  Cancelled: {
    label: "Cancelled",
    className:
      "bg-red-100 text-red-700 border-red-200",
    icon: XCircle,
  },

  Rejected: {
    label: "Rejected",
    className:
      "bg-gray-100 text-gray-700 border-gray-200",
    icon: XCircle,
  },

  "No Show": {
    label: "No Show",
    className:
      "bg-amber-100 text-amber-700 border-amber-200",
    icon: UserX,
  },
};

// ======================================================
// HELPERS
// ======================================================

const formatDate = (date) => {
  if (!date) {
    return "—";
  }

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "—";
  }

  return parsedDate.toLocaleDateString("en-KE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatTime = (time) => {
  if (!time) {
    return "—";
  }

  // Handles values such as:
  // 09:00
  // 14:30
  // 09:00:00

  const parts = String(time).split(":");

  if (parts.length < 2) {
    return time;
  }

  const hours = Number(parts[0]);
  const minutes = Number(parts[1]);

  if (
    Number.isNaN(hours) ||
    Number.isNaN(minutes)
  ) {
    return time;
  }

  const date = new Date();

  date.setHours(hours, minutes, 0, 0);

  return date.toLocaleTimeString("en-KE", {
    hour: "numeric",
    minute: "2-digit",
  });
};

// ======================================================
// STATUS BADGE
// ======================================================

const StatusBadge = ({ status }) => {
  const config =
    STATUS_CONFIG[status] ||
    {
      label: status || "Unknown",
      className:
        "bg-gray-100 text-gray-700 border-gray-200",
      icon: AlertCircle,
    };

  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${config.className}`}
    >
      <Icon size={14} />

      {config.label}
    </span>
  );
};

// ======================================================
// MAIN COMPONENT
// ======================================================

const ViewingStatusTable = ({
  viewings = [],
}) => {
  // ====================================================
  // VIEWING CONTEXT
  // ====================================================
  //
  // These actions are intentionally obtained from the
  // context instead of making API calls directly inside
  // the table.
  //
  const {
    approveViewing,
    rejectViewing,
    cancelViewing,
    rescheduleViewing,
    completeViewing,
  } = useViewingContext();

  // ====================================================
  // SAFETY
  // ====================================================

  const safeViewings = Array.isArray(viewings)
    ? viewings
    : [];

  // ====================================================
  // EMPTY STATE
  // ====================================================

  if (safeViewings.length === 0) {
    return (
      <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b px-6 py-5">
          <h2 className="text-lg font-semibold text-gray-900">
            Viewing Status
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Monitor and manage property viewing requests.
          </p>
        </div>

        <div className="flex min-h-[260px] flex-col items-center justify-center px-6 text-center">
          <CalendarDays
            size={44}
            className="mb-4 text-gray-300"
          />

          <h3 className="text-base font-semibold text-gray-700">
            No viewings found
          </h3>

          <p className="mt-1 max-w-md text-sm text-gray-500">
            There are currently no property viewing requests
            to display.
          </p>
        </div>
      </section>
    );
  }

  // ====================================================
  // ACTION HANDLERS
  // ====================================================

  const handleApprove = async (id) => {
    if (!approveViewing) {
      return;
    }

    await approveViewing(id);
  };

  const handleReject = async (id) => {
    if (!rejectViewing) {
      return;
    }

    const reason = window.prompt(
      "Enter the reason for rejecting this viewing:"
    );

    if (reason === null) {
      return;
    }

    await rejectViewing(id, {
      rejectionReason:
        reason.trim() ||
        "No reason provided",
    });
  };

  const handleCancel = async (id) => {
    if (!cancelViewing) {
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to cancel this viewing?"
    );

    if (!confirmed) {
      return;
    }

    await cancelViewing(id);
  };

  const handleComplete = async (id) => {
    if (!completeViewing) {
      return;
    }

    const confirmed = window.confirm(
      "Mark this viewing as completed?"
    );

    if (!confirmed) {
      return;
    }

    await completeViewing(id);
  };

  // ====================================================
  // ACTION BUTTONS
  // ====================================================

  const renderActions = (viewing) => {
    const id = viewing._id || viewing.id;

    switch (viewing.status) {
      case "Pending Approval":
        return (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() =>
                handleApprove(id)
              }
              className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-emerald-700"
            >
              Approve
            </button>

            <button
              type="button"
              onClick={() =>
                handleReject(id)
              }
              className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-red-700"
            >
              Reject
            </button>
          </div>
        );

      case "Approved":
        return (
          <div className="flex flex-wrap gap-2">
            {cancelViewing && (
              <button
                type="button"
                onClick={() =>
                  handleCancel(id)
                }
                className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50"
              >
                Cancel
              </button>
            )}

            {completeViewing && (
              <button
                type="button"
                onClick={() =>
                  handleComplete(id)
                }
                className="rounded-lg bg-purple-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-purple-700"
              >
                Complete
              </button>
            )}
          </div>
        );

      case "Rescheduled":
        return (
          <div className="flex flex-wrap gap-2">
            {cancelViewing && (
              <button
                type="button"
                onClick={() =>
                  handleCancel(id)
                }
                className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50"
              >
                Cancel
              </button>
            )}

            {completeViewing && (
              <button
                type="button"
                onClick={() =>
                  handleComplete(id)
                }
                className="rounded-lg bg-purple-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-purple-700"
              >
                Complete
              </button>
            )}
          </div>
        );

      default:
        return (
          <span className="text-xs text-gray-400">
            No actions
          </span>
        );
    }
  };

  // ====================================================
  // RENDER
  // ====================================================

  return (
    <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
      {/* ==================================================
          HEADER
      ================================================== */}

      <div className="border-b px-6 py-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Viewing Status
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Monitor and manage property viewing requests.
            </p>
          </div>

          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
            {safeViewings.length} viewing
            {safeViewings.length === 1 ? "" : "s"}
          </span>
        </div>
      </div>

      {/* ==================================================
          TABLE
      ================================================== */}

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          {/* =================================================
              TABLE HEADER
          ================================================= */}

          <thead className="bg-gray-50">
            <tr>
              <th className="whitespace-nowrap px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                Property
              </th>

              <th className="whitespace-nowrap px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                Lead
              </th>

              <th className="whitespace-nowrap px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                Agent
              </th>

              <th className="whitespace-nowrap px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                Date & Time
              </th>

              <th className="whitespace-nowrap px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                Status
              </th>

              <th className="whitespace-nowrap px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                Actions
              </th>
            </tr>
          </thead>

          {/* =================================================
              TABLE BODY
          ================================================= */}

          <tbody className="divide-y divide-gray-100 bg-white">
            {safeViewings.map((viewing) => {
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
                <tr
                  key={id}
                  className="transition hover:bg-gray-50"
                >
                  {/* ========================================
                      PROPERTY
                  ======================================== */}

                  <td className="px-6 py-4">
                    <div className="flex min-w-[190px] items-start gap-3">
                      <div className="rounded-lg bg-blue-50 p-2">
                        <Building2
                          size={18}
                          className="text-blue-600"
                        />
                      </div>

                      <div>
                        <p className="font-medium text-gray-900">
                          {property.title ||
                            viewing.propertyTitle ||
                            "Property unavailable"}
                        </p>

                        <p className="mt-1 text-xs text-gray-500">
                          {property.location ||
                            "Location unavailable"}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* ========================================
                      LEAD
                  ======================================== */}

                  <td className="px-6 py-4">
                    <div className="min-w-[150px]">
                      <p className="font-medium text-gray-900">
                        {lead.name ||
                          viewing.leadName ||
                          "Unknown lead"}
                      </p>

                      {lead.phone && (
                        <p className="mt-1 text-xs text-gray-500">
                          {lead.phone}
                        </p>
                      )}
                    </div>
                  </td>

                  {/* ========================================
                      AGENT
                  ======================================== */}

                  <td className="px-6 py-4">
                    <div className="flex min-w-[140px] items-center gap-2">
                      <div className="rounded-full bg-gray-100 p-2">
                        <User
                          size={16}
                          className="text-gray-500"
                        />
                      </div>

                      <span className="text-sm text-gray-700">
                        {agent.name ||
                          viewing.agentName ||
                          "Unassigned"}
                      </span>
                    </div>
                  </td>

                  {/* ========================================
                      DATE / TIME
                  ======================================== */}

                  <td className="px-6 py-4">
                    <div className="min-w-[130px]">
                      <div className="flex items-center gap-2 text-sm font-medium text-gray-800">
                        <CalendarDays
                          size={15}
                          className="text-gray-400"
                        />

                        {formatDate(
                          viewing.viewingDate
                        )}
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
                  </td>

                  {/* ========================================
                      STATUS
                  ======================================== */}

                  <td className="px-6 py-4">
                    <StatusBadge
                      status={viewing.status}
                    />
                  </td>

                  {/* ========================================
                      ACTIONS
                  ======================================== */}

                  <td className="px-6 py-4">
                    {renderActions(viewing)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ==================================================
          MOBILE NOTE
      ================================================== */}

      <div className="border-t bg-gray-50 px-6 py-3 lg:hidden">
        <p className="text-xs text-gray-500">
          Swipe horizontally to view all viewing details.
        </p>
      </div>
    </section>
  );
};

export default ViewingStatusTable;

