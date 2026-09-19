/**
 * ==========================================================
 * -------
 * Displays a consistent status badge throughout the CRM.
 *
 * Used In
 * -------
 * • Leads
 * • Properties
 * • Follow-ups
 * • Conversations
 * • Reports
 * • Dashboard Tables
 *
 * Supported Statuses
 * ------------------
 * Leads
 * • New
 * • Qualified
 * • Hot Lead
 * • Negotiation
 * • Closed
 * • Lost
 *
 * Properties
 * • Available
 * • Reserved
 * • Sold
 * • Inactive
 *
 * Follow-ups
 * • Pending
 * • Completed
 * • Overdue
 *
 * Conversations
 * • Active
 * • Closed
 *
 * ==========================================================
 */

const STATUS_STYLES = {

  /* =====================================
      LEADS
  ===================================== */

  "New":
    "bg-blue-500/20 border-blue-500/30 text-blue-400",

  "Qualified":
    "bg-emerald-500/20 border-emerald-500/30 text-emerald-400",

  "Hot Lead":
    "bg-red-500/20 border-red-500/30 text-red-400",

  "Negotiation":
    "bg-amber-500/20 border-amber-500/30 text-amber-400",

  "Closed":
    "bg-cyan-500/20 border-cyan-500/30 text-cyan-400",

  "Lost":
    "bg-slate-700/30 border-slate-600 text-slate-400",

  /* =====================================
      PROPERTIES
  ===================================== */

  "Available":
    "bg-emerald-500/20 border-emerald-500/30 text-emerald-400",

  "Reserved":
    "bg-yellow-500/20 border-yellow-500/30 text-yellow-400",

  "Sold":
    "bg-cyan-500/20 border-cyan-500/30 text-cyan-400",

  "Inactive":
    "bg-slate-700/30 border-slate-600 text-slate-400",

  /* =====================================
      FOLLOW UPS
  ===================================== */

  "Pending":
    "bg-yellow-500/20 border-yellow-500/30 text-yellow-400",

  "Completed":
    "bg-emerald-500/20 border-emerald-500/30 text-emerald-400",

  "Overdue":
    "bg-red-500/20 border-red-500/30 text-red-400",

  /* =====================================
      CONVERSATIONS
  ===================================== */

  "Active":
    "bg-cyan-500/20 border-cyan-500/30 text-cyan-400",

    /* =====================================
    VIEWINGS
===================================== */

"Requested":
  "bg-blue-500/20 border-blue-500/30 text-blue-400",

"Pending Approval":
  "bg-yellow-500/20 border-yellow-500/30 text-yellow-400",

"Approved":
  "bg-emerald-500/20 border-emerald-500/30 text-emerald-400",

"Rejected":
  "bg-red-500/20 border-red-500/30 text-red-400",

"Scheduled":
  "bg-cyan-500/20 border-cyan-500/30 text-cyan-400",

"Checked In":
  "bg-indigo-500/20 border-indigo-500/30 text-indigo-400",

"In Progress":
  "bg-purple-500/20 border-purple-500/30 text-purple-400",

"Completed":
  "bg-emerald-500/20 border-emerald-500/30 text-emerald-400",

"Cancelled":
  "bg-slate-700/30 border-slate-600 text-slate-400",

"Rescheduled":
  "bg-orange-500/20 border-orange-500/30 text-orange-400",

"No Show":
  "bg-pink-500/20 border-pink-500/30 text-pink-400",

};

const DEFAULT_STYLE =
  "bg-slate-700/30 border-slate-600 text-slate-300";

const StatusBadge = ({
  status,
  className = "",
}) => {

  const badgeStyle =
    STATUS_STYLES[status] || DEFAULT_STYLE;

  return (

    <span
      className={`
        inline-flex
        items-center
        rounded-full
        border
        px-3
        py-1.5
        text-xs
        font-semibold
        whitespace-nowrap
        ${badgeStyle}
        ${className}
      `}
    >

      {status || "Unknown"}

    </span>

  );

};

export default StatusBadge;

