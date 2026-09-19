/**
 * ==========================================================
 *
 * Property Viewing Workflow Timeline
 *
 * Location
 * ----------------------------------------------------------
 * src/components/viewing/ViewingTimeline.jsx
 *
 * Responsibilities
 * ----------------------------------------------------------
 * ✓ Display viewing workflow history
 * ✓ Show status progression
 * ✓ Show timestamps
 * ✓ Show agent actions
 * ✓ Highlight current status
 * ✓ Handle cancelled/rejected viewings
 * ✓ Avoid inventing missing workflow events
 *
 * Workflow
 * ----------------------------------------------------------
 *
 * Requested
 *     ↓
 * Approved
 *     ↓
 * Rescheduled
 *     ↓
 * Completed
 *
 * ==========================================================
 */

import {
  Check,
  Clock,
  CalendarDays,
  XCircle,
  RotateCcw,
  User,
} from "lucide-react";

/* ==========================================================
   STATUS CONFIGURATION
========================================================== */

const STATUS_CONFIG = {

  requested: {
    label: "Requested",
    icon: Clock,
    color: "blue",
    description: "Viewing request submitted.",
  },

  approved: {
    label: "Approved",
    icon: Check,
    color: "emerald",
    description: "Viewing approved by the agent.",
  },

  rescheduled: {
    label: "Rescheduled",
    icon: RotateCcw,
    color: "amber",
    description: "Viewing time was rescheduled.",
  },

  completed: {
    label: "Completed",
    icon: Check,
    color: "green",
    description: "Viewing was completed.",
  },

  cancelled: {
    label: "Cancelled",
    icon: XCircle,
    color: "red",
    description: "Viewing was cancelled.",
  },

  rejected: {
    label: "Rejected",
    icon: XCircle,
    color: "red",
    description: "Viewing request was rejected.",
  },

};

/* ==========================================================
   WORKFLOW ORDER
========================================================== */

const WORKFLOW_ORDER = [
  "requested",
  "approved",
  "rescheduled",
  "completed",
];

/* ==========================================================
   HELPERS
========================================================== */

/**
 * Convert different backend date formats
 * into a readable date/time.
 */

const formatTimestamp = (value) => {

  if (!value) return null;

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toLocaleString(
    "en-KE",
    {
      dateStyle: "medium",
      timeStyle: "short",
    }
  );

};

/**
 * Normalize backend status values.
 */

const normalizeStatus = (status) => {

  if (!status) return "";

  return String(status)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");

};

/**
 * Get the timestamp associated with
 * a specific workflow status.
 */

const getStatusTimestamp = (
  viewing,
  status
) => {

  const timestampMap = {

    requested:
      viewing.requestedAt ||
      viewing.createdAt,

    approved:
      viewing.approvedAt,

    rescheduled:
      viewing.rescheduledAt,

    completed:
      viewing.completedAt,

    cancelled:
      viewing.cancelledAt,

    rejected:
      viewing.rejectedAt,

  };

  return timestampMap[status];

};

/**
 * Get the agent action associated
 * with a workflow status.
 */

const getAgentAction = (
  viewing,
  status
) => {

  const actionMap = {

    requested:
      viewing.requestedByAgent ||
      viewing.requestedBy,

    approved:
      viewing.approvedByAgent ||
      viewing.approvedBy,

    rescheduled:
      viewing.rescheduledByAgent ||
      viewing.rescheduledBy,

    completed:
      viewing.completedByAgent ||
      viewing.completedBy,

    cancelled:
      viewing.cancelledByAgent ||
      viewing.cancelledBy,

    rejected:
      viewing.rejectedByAgent ||
      viewing.rejectedBy,

  };

  return actionMap[status] || null;

};

/**
 * Extract a displayable agent name.
 */

const getAgentName = (agent) => {

  if (!agent) return null;

  if (typeof agent === "string") {
    return agent;
  }

  return (
    agent.name ||
    agent.fullName ||
    agent.displayName ||
    agent.email ||
    null
  );

};

/* ==========================================================
   BUILD TIMELINE
========================================================== */

const buildTimeline = (viewing) => {

  const currentStatus =
    normalizeStatus(viewing.status);

  /*
   * Prefer an explicit backend history if available.
   *
   * This is the most reliable source because
   * it represents what actually happened.
   */

  if (
    Array.isArray(viewing.statusHistory) &&
    viewing.statusHistory.length > 0
  ) {

    return viewing.statusHistory.map(
      (event, index) => {

        const status =
          normalizeStatus(event.status);

        return {

          id:
            event._id ||
            event.id ||
            `${status}-${index}`,

          status,

          timestamp:
            event.timestamp ||
            event.createdAt ||
            event.changedAt,

          agent:
            event.agent ||
            event.performedBy ||
            event.performedByAgent ||
            null,

          note:
            event.note ||
            event.reason ||
            event.description ||
            null,

          isCurrent:
            status === currentStatus,

        };

      }
    );

  }

  /*
   * Fallback for records where the backend
   * stores timestamps directly on the viewing.
   */

  const timeline = [];

  WORKFLOW_ORDER.forEach(
    (status) => {

      const timestamp =
        getStatusTimestamp(
          viewing,
          status
        );

      if (!timestamp) return;

      timeline.push({

        id: `${status}-${timestamp}`,

        status,

        timestamp,

        agent:
          getAgentAction(
            viewing,
            status
          ),

        note: null,

        isCurrent:
          status === currentStatus,

      });

    }
  );

  /*
   * Cancelled/rejected are terminal alternatives
   * and should not be added to the normal
   * Requested → Approved → Completed path.
   */

  if (
    currentStatus === "cancelled" ||
    currentStatus === "rejected"
  ) {

    const timestamp =
      getStatusTimestamp(
        viewing,
        currentStatus
      );

    timeline.push({

      id:
        `${currentStatus}-${timestamp || "current"}`,

      status:
        currentStatus,

      timestamp,

      agent:
        getAgentAction(
          viewing,
          currentStatus
        ),

      note:
        currentStatus === "cancelled"
          ? viewing.cancelReason
          : viewing.rejectionReason,

      isCurrent: true,

    });

  }

  return timeline;

};

/* ==========================================================
   COMPONENT
========================================================== */

const ViewingTimeline = ({
  viewing,
  compact = false,
}) => {

  if (!viewing) {

    return (
      <div className="rounded-xl border border-dashed p-6 text-center text-sm text-gray-500">
        Select a viewing to see its workflow history.
      </div>
    );

  }

  const timeline =
    buildTimeline(viewing);

  if (timeline.length === 0) {

    return (
      <div className="rounded-xl border border-dashed p-6 text-center text-sm text-gray-500">
        No viewing history available.
      </div>
    );

  }

  return (

    <section
      className={`
        rounded-2xl
        border
        bg-white
        ${compact ? "p-4" : "p-6"}
      `}
    >

      {/* ====================================================
          HEADER
      ===================================================== */}

      <div className="mb-6">

        <h3 className="text-lg font-bold text-gray-900">
          Viewing Timeline
        </h3>

        <p className="mt-1 text-sm text-gray-500">
          History of actions and status changes.
        </p>

      </div>

      {/* ====================================================
          TIMELINE
      ===================================================== */}

      <div className="relative">

        {/* Vertical line */}

        <div className="absolute left-5 top-2 h-[calc(100%-1rem)] w-px bg-gray-200" />

        <div className="space-y-6">

          {timeline.map(
            (event, index) => {

              const config =
                STATUS_CONFIG[event.status] ||
                STATUS_CONFIG.requested;

              const Icon =
                config.icon;

              const timestamp =
                formatTimestamp(
                  event.timestamp
                );

              const agentName =
                getAgentName(
                  event.agent
                );

              return (

                <div
                  key={event.id}
                  className="relative flex gap-4"
                >

                  {/* ==================================================
                      STATUS ICON
                  =================================================== */}

                  <div
                    className={`
                      relative
                      z-10
                      flex
                      h-10
                      w-10
                      flex-shrink-0
                      items-center
                      justify-center
                      rounded-full
                      border-4
                      border-white
                      ${getIconBackground(config.color)}
                    `}
                  >

                    <Icon
                      size={16}
                      className={
                        getIconColor(
                          config.color
                        )
                      }
                    />

                  </div>

                  {/* ==================================================
                      EVENT CONTENT
                  =================================================== */}

                  <div
                    className={`
                      min-w-0
                      flex-1
                      rounded-xl
                      border
                      p-4
                      ${
                        event.isCurrent
                          ? "border-emerald-200 bg-emerald-50/50"
                          : "bg-white"
                      }
                    `}
                  >

                    {/* STATUS HEADER */}

                    <div className="flex flex-wrap items-center justify-between gap-2">

                      <div className="flex items-center gap-2">

                        <h4 className="font-semibold text-gray-900">
                          {config.label}
                        </h4>

                        {event.isCurrent && (

                          <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700">
                            Current
                          </span>

                        )}

                      </div>

                      {timestamp && (

                        <span className="text-xs text-gray-500">
                          {timestamp}
                        </span>

                      )}

                    </div>

                    {/* DESCRIPTION */}

                    <p className="mt-2 text-sm text-gray-600">
                      {event.note ||
                        config.description}
                    </p>

                    {/* AGENT ACTION */}

                    {agentName && (

                      <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">

                        <User size={14} />

                        <span>
                          Action by{" "}
                          <strong className="font-semibold text-gray-700">
                            {agentName}
                          </strong>
                        </span>

                      </div>

                    )}

                    {/* RESCHEDULE DETAILS */}

                    {event.status === "rescheduled" && (

                      <div className="mt-3 flex items-center gap-2 rounded-lg bg-amber-50 p-3 text-xs text-amber-800">

                        <CalendarDays size={14} />

                        <span>
                          The viewing time was changed.
                        </span>

                      </div>

                    )}

                  </div>

                </div>

              );

            }
          )}

        </div>

      </div>

    </section>

  );

};

/* ==========================================================
   ICON COLORS
========================================================== */

const getIconBackground = (
  color
) => {

  const colors = {

    blue:
      "bg-blue-100",

    emerald:
      "bg-emerald-100",

    green:
      "bg-green-100",

    amber:
      "bg-amber-100",

    red:
      "bg-red-100",

    gray:
      "bg-gray-100",

  };

  return (
    colors[color] ||
    colors.gray
  );

};

const getIconColor = (
  color
) => {

  const colors = {

    blue:
      "text-blue-600",

    emerald:
      "text-emerald-600",

    green:
      "text-green-600",

    amber:
      "text-amber-600",

    red:
      "text-red-600",

    gray:
      "text-gray-600",

  };

  return (
    colors[color] ||
    colors.gray
  );

};

/* ==========================================================
   EXPORT
========================================================== */

export default ViewingTimeline;

