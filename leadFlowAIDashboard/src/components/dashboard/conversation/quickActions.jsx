/**
 * ==========================================================
 *
 * Quick actions shown in the conversation header.
 *
 * Responsibilities
 * ----------------------------------------------------------
 * ✓ Call customer
 * ✓ Schedule viewing
 * ✓ Approve viewing
 * ✓ Reject viewing
 * ✓ Reschedule viewing
 * ✓ Cancel viewing
 * ✓ Complete viewing
 * ✓ Assign/Reassign agent
 * ✓ Pin conversation
 * ✓ Archive conversation
 * ✓ Mark as read
 * ✓ AI Summary
 * ✓ Export conversation
 *
 * Used By
 * ----------------------------------------------------------
 * ChatWindow.jsx
 * ConversationDetails.jsx
 *
 * ==========================================================
 */

import {
  Phone,
  CalendarDays,
  CheckCircle,
  XCircle,
  CalendarClock,
  Ban,
  ClipboardCheck,
  UserPlus,
  Pin,
  Archive,
  CheckCheck,
  Brain,
  Download,
} from "lucide-react";

/* ==========================================================
   COMPONENT
========================================================== */

const QuickActions = ({
  conversation,

  // Customer actions
  onCall,

  // Viewing actions
  onSchedule,
  onApproveViewing,
  onRejectViewing,
  onRescheduleViewing,
  onCancelViewing,
  onCompleteViewing,

  // Conversation actions
  onAssign,
  onPin,
  onArchive,
  onMarkRead,
  onAISummary,
  onExport,
}) => {
  if (!conversation) return null;

  /*
   * --------------------------------------------------------
   * VIEWING STATE
   * --------------------------------------------------------
   *
   * Supports:
   * requested
   * scheduled
   * approved
   * rejected
   * rescheduled
   * cancelled
   * completed
   */

  const viewingStatus =
    conversation?.viewing?.status ||
    conversation?.viewingStatus ||
    null;

  const normalizedStatus =
    viewingStatus?.toLowerCase();

  /*
   * --------------------------------------------------------
   * ACTION VISIBILITY
   * --------------------------------------------------------
   */

  const canSchedule =
    !viewingStatus ||
    normalizedStatus === "rejected" ||
    normalizedStatus === "cancelled";

  const canApprove =
    normalizedStatus === "requested" ||
    normalizedStatus === "pending";

  const canReject =
    normalizedStatus === "requested" ||
    normalizedStatus === "pending";

  const canReschedule =
    normalizedStatus === "scheduled" ||
    normalizedStatus === "approved" ||
    normalizedStatus === "rescheduled";

  const canCancel =
    normalizedStatus === "requested" ||
    normalizedStatus === "scheduled" ||
    normalizedStatus === "approved" ||
    normalizedStatus === "rescheduled";

  const canComplete =
    normalizedStatus === "scheduled" ||
    normalizedStatus === "approved" ||
    normalizedStatus === "rescheduled";

  return (
    <div className="flex flex-wrap items-center gap-2">

      {/* ==================================================
          CALL CUSTOMER
      ================================================== */}

      <ActionButton
        icon={<Phone size={18} />}
        label="Call"
        color="emerald"
        onClick={() =>
          onCall?.(conversation)
        }
      />

      {/* ==================================================
          SCHEDULE VIEWING
      ================================================== */}

      {canSchedule && (
        <ActionButton
          icon={<CalendarDays size={18} />}
          label="Schedule Viewing"
          color="blue"
          onClick={() =>
            onSchedule?.(conversation)
          }
        />
      )}

      {/* ==================================================
          APPROVE VIEWING
      ================================================== */}

      {canApprove && (
        <ActionButton
          icon={<CheckCircle size={18} />}
          label="Approve"
          color="green"
          onClick={() =>
            onApproveViewing?.(conversation)
          }
        />
      )}

      {/* ==================================================
          REJECT VIEWING
      ================================================== */}

      {canReject && (
        <ActionButton
          icon={<XCircle size={18} />}
          label="Reject"
          color="red"
          onClick={() =>
            onRejectViewing?.(conversation)
          }
        />
      )}

      {/* ==================================================
          RESCHEDULE VIEWING
      ================================================== */}

      {canReschedule && (
        <ActionButton
          icon={<CalendarClock size={18} />}
          label="Reschedule"
          color="amber"
          onClick={() =>
            onRescheduleViewing?.(conversation)
          }
        />
      )}

      {/* ==================================================
          CANCEL VIEWING
      ================================================== */}

      {canCancel && (
        <ActionButton
          icon={<Ban size={18} />}
          label="Cancel"
          color="red"
          onClick={() =>
            onCancelViewing?.(conversation)
          }
        />
      )}

      {/* ==================================================
          COMPLETE VIEWING
      ================================================== */}

      {canComplete && (
        <ActionButton
          icon={<ClipboardCheck size={18} />}
          label="Complete Viewing"
          color="indigo"
          onClick={() =>
            onCompleteViewing?.(conversation)
          }
        />
      )}

      {/* ==================================================
          ASSIGN / REASSIGN AGENT
      ================================================== */}

      <ActionButton
        icon={<UserPlus size={18} />}
        label={
          conversation.assignedAgent
            ? "Reassign"
            : "Assign"
        }
        color="purple"
        onClick={() =>
          onAssign?.(conversation)
        }
      />

      {/* ==================================================
          PIN
      ================================================== */}

      <ActionButton
        icon={<Pin size={18} />}
        label={
          conversation.pinned
            ? "Unpin"
            : "Pin"
        }
        color={
          conversation.pinned
            ? "amber"
            : "gray"
        }
        onClick={() =>
          onPin?.(conversation)
        }
      />

      {/* ==================================================
          MARK AS READ
      ================================================== */}

      <ActionButton
        icon={<CheckCheck size={18} />}
        label="Read"
        color="green"
        onClick={() =>
          onMarkRead?.(conversation)
        }
      />

      {/* ==================================================
          ARCHIVE
      ================================================== */}

      <ActionButton
        icon={<Archive size={18} />}
        label="Archive"
        color="red"
        onClick={() =>
          onArchive?.(conversation)
        }
      />

      {/* ==================================================
          AI SUMMARY
      ================================================== */}

      <ActionButton
        icon={<Brain size={18} />}
        label="AI Summary"
        color="indigo"
        onClick={() =>
          onAISummary?.(conversation)
        }
      />

      {/* ==================================================
          EXPORT
      ================================================== */}

      <ActionButton
        icon={<Download size={18} />}
        label="Export"
        color="slate"
        onClick={() =>
          onExport?.(conversation)
        }
      />

    </div>
  );
};

/* ==========================================================
   ACTION BUTTON
========================================================== */

const ActionButton = ({
  icon,
  label,
  color,
  onClick,
}) => {

  const colors = {

    emerald:
      "bg-emerald-50 text-emerald-700 hover:bg-emerald-100",

    blue:
      "bg-blue-50 text-blue-700 hover:bg-blue-100",

    purple:
      "bg-purple-50 text-purple-700 hover:bg-purple-100",

    amber:
      "bg-amber-50 text-amber-700 hover:bg-amber-100",

    green:
      "bg-green-50 text-green-700 hover:bg-green-100",

    red:
      "bg-red-50 text-red-700 hover:bg-red-100",

    indigo:
      "bg-indigo-50 text-indigo-700 hover:bg-indigo-100",

    slate:
      "bg-slate-50 text-slate-700 hover:bg-slate-100",

    gray:
      "bg-gray-100 text-gray-700 hover:bg-gray-200",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${colors[color] || colors.gray}`}
    >
      {icon}

      <span>
        {label}
      </span>
    </button>
  );
};

export default QuickActions;

