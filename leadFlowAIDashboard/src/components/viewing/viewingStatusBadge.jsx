// ======================================================
// Reusable Viewing Status Badge
// ======================================================

import {
  Clock3,
  CheckCircle2,
  CalendarClock,
  XCircle,
  CircleAlert,
} from "lucide-react";

// ======================================================
// STATUS CONFIGURATION
// ======================================================

const STATUS_CONFIG = {

  requested: {
    label: "Requested",
    className:
      "bg-amber-50 text-amber-700 border-amber-200",
    icon: Clock3,
  },

  pending: {
    label: "Pending",
    className:
      "bg-amber-50 text-amber-700 border-amber-200",
    icon: Clock3,
  },

  approved: {
    label: "Approved",
    className:
      "bg-blue-50 text-blue-700 border-blue-200",
    icon: CheckCircle2,
  },

  scheduled: {
    label: "Scheduled",
    className:
      "bg-blue-50 text-blue-700 border-blue-200",
    icon: CheckCircle2,
  },

  rescheduled: {
    label: "Rescheduled",
    className:
      "bg-purple-50 text-purple-700 border-purple-200",
    icon: CalendarClock,
  },

  completed: {
    label: "Completed",
    className:
      "bg-emerald-50 text-emerald-700 border-emerald-200",
    icon: CheckCircle2,
  },

  cancelled: {
    label: "Cancelled",
    className:
      "bg-red-50 text-red-700 border-red-200",
    icon: XCircle,
  },

  rejected: {
    label: "Rejected",
    className:
      "bg-red-50 text-red-700 border-red-200",
    icon: XCircle,
  },

  missed: {
    label: "Missed",
    className:
      "bg-gray-100 text-gray-700 border-gray-200",
    icon: CircleAlert,
  },

};

// ======================================================
// NORMALIZE STATUS
// ======================================================

const normalizeStatus = (status) => {

  if (!status) {
    return "requested";
  }

  return String(status)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");

};

// ======================================================
// COMPONENT
// ======================================================

const ViewingStatusBadge = ({
  status,
  size = "sm",
  showIcon = true,
  className = "",
}) => {

  const normalizedStatus =
    normalizeStatus(status);

  const config =
    STATUS_CONFIG[normalizedStatus] ||
    STATUS_CONFIG.requested;

  const Icon =
    config.icon;

  // ====================================================
  // SIZE
  // ====================================================

  const sizeClasses = {

    xs:
      "px-2 py-0.5 text-[10px]",

    sm:
      "px-2.5 py-1 text-xs",

    md:
      "px-3 py-1.5 text-sm",

  };

  const iconSizes = {

    xs: 11,

    sm: 13,

    md: 15,

  };

  // ====================================================
  // RENDER
  // ====================================================

  return (

    <span
      className={`inline-flex items-center gap-1.5 rounded-full border font-medium ${config.className} ${
        sizeClasses[size] ||
        sizeClasses.sm
      } ${className}`}
    >

      {showIcon && (

        <Icon
          size={
            iconSizes[size] ||
            iconSizes.sm
          }
          strokeWidth={2}
        />

      )}

      <span>
        {config.label}
      </span>

    </span>

  );

};

export default ViewingStatusBadge;