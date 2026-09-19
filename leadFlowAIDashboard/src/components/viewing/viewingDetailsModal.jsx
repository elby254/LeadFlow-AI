/**
 * ==========================================================
 *
 * Full Property Viewing Details Modal
 *
 * Location
 * ----------------------------------------------------------
 * src/components/viewing/ViewingDetailsModal.jsx
 *
 * Responsibilities
 * ----------------------------------------------------------
 * ✓ Display full viewing information
 * ✓ Customer information
 * ✓ Property information
 * ✓ Agent information
 * ✓ Viewing date and time
 * ✓ Current status
 * ✓ Request information
 * ✓ Viewing timeline
 * ✓ Contextual workflow actions
 * ✓ Cancel modal
 *
 * Actions
 * ----------------------------------------------------------
 * Requested
 *   → Approve
 *   → Reject
 *   → Cancel
 *
 * Approved
 *   → Reschedule
 *   → Cancel
 *   → Complete
 *
 * Rescheduled
 *   → Reschedule
 *   → Cancel
 *   → Complete
 *
 * Completed
 *   → Submit Feedback
 *
 * Cancelled / Rejected
 *   → No workflow action
 *
 * ==========================================================
 */

import {
  CalendarDays,
  Clock,
  User,
  Phone,
  Mail,
  MapPin,
  Home,
  Building2,
  X,
  Check,
  XCircle,
  RotateCcw,
  Ban,
  CheckCircle2,
  MessageSquare,
} from "lucide-react";

import ViewingTimeline from "./ViewingTimeline";

/* ==========================================================
   STATUS CONFIGURATION
========================================================== */

const STATUS_CONFIG = {
  requested: {
    label: "Requested",
    className: "bg-blue-100 text-blue-700",
  },

  approved: {
    label: "Approved",
    className: "bg-emerald-100 text-emerald-700",
  },

  rescheduled: {
    label: "Rescheduled",
    className: "bg-amber-100 text-amber-700",
  },

  completed: {
    label: "Completed",
    className: "bg-green-100 text-green-700",
  },

  cancelled: {
    label: "Cancelled",
    className: "bg-red-100 text-red-700",
  },

  rejected: {
    label: "Rejected",
    className: "bg-red-100 text-red-700",
  },
};

/* ==========================================================
   HELPERS
========================================================== */

const normalizeStatus = (status) => {

  if (!status) {
    return "requested";
  }

  return String(status)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");

};

const formatDate = (value) => {

  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleDateString(
    "en-KE",
    {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }
  );

};

const formatTime = (value) => {

  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleTimeString(
    "en-KE",
    {
      hour: "2-digit",
      minute: "2-digit",
    }
  );

};

const getName = (person) => {

  if (!person) return "-";

  if (typeof person === "string") {
    return person;
  }

  return (
    person.name ||
    person.fullName ||
    person.displayName ||
    person.email ||
    "-"
  );

};

/* ==========================================================
   INFO ROW
========================================================== */

const InfoRow = ({
  icon,
  label,
  value,
}) => {

  return (
    <div className="flex gap-3">

      <div className="mt-0.5 text-gray-400">
        {icon}
      </div>

      <div className="min-w-0">

        <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
          {label}
        </p>

        <p className="mt-1 break-words text-sm font-medium text-gray-800">
          {value || "-"}
        </p>

      </div>

    </div>
  );

};

/* ==========================================================
   ACTION BUTTON
========================================================== */

const ActionButton = ({
  icon,
  label,
  variant = "secondary",
  onClick,
  disabled = false,
}) => {

  const styles = {

    primary:
      "bg-emerald-600 text-white hover:bg-emerald-700",

    success:
      "bg-green-600 text-white hover:bg-green-700",

    danger:
      "bg-red-600 text-white hover:bg-red-700",

    warning:
      "bg-amber-500 text-white hover:bg-amber-600",

    secondary:
      "border bg-white text-gray-700 hover:bg-gray-50",

  };

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`
        inline-flex
        items-center
        justify-center
        gap-2
        rounded-xl
        px-4
        py-2.5
        text-sm
        font-semibold
        transition
        disabled:cursor-not-allowed
        disabled:opacity-50
        ${styles[variant] || styles.secondary}
      `}
    >
      {icon}
      {label}
    </button>
  );

};

/* ==========================================================
   COMPONENT
========================================================== */

const ViewingDetailsModal = ({
  viewing,
  open = false,
  loading = false,

  onClose,

  onApprove,
  onReject,
  onCancel,
  onReschedule,
  onComplete,
  onFeedback,

  onCallCustomer,
  onMessageCustomer,
}) => {

  if (!open || !viewing) {
    return null;
  }

  /* ========================================================
     NORMALIZE DATA
  ======================================================== */

  const status =
    normalizeStatus(viewing.status);

  const statusConfig =
    STATUS_CONFIG[status] ||
    STATUS_CONFIG.requested;

  const customer =
    viewing.customer ||
    viewing.lead ||
    {};

  const property =
    viewing.property ||
    {};

  const agent =
    viewing.agent ||
    viewing.assignedAgent ||
    {};

  /* ========================================================
     DATE / TIME
  ======================================================== */

  const viewingDate =
    viewing.startTime ||
    viewing.startsAt ||
    viewing.scheduledAt ||
    viewing.date;

  const viewingEnd =
    viewing.endTime ||
    viewing.endsAt;

  /* ========================================================
     IDENTIFIERS
  ======================================================== */

  const customerName =
    viewing.customerName ||
    customer.name ||
    customer.fullName ||
    "Customer";

  const propertyName =
    viewing.propertyName ||
    property.name ||
    property.title ||
    "Property";

  const agentName =
    viewing.agentName ||
    getName(agent);

  const customerPhone =
    viewing.customerPhone ||
    customer.phone;

  const customerEmail =
    viewing.customerEmail ||
    customer.email;

  const propertyLocation =
    viewing.propertyLocation ||
    property.location ||
    property.address;

  /* ========================================================
     RENDER
  ======================================================== */

  return (

    <div
      className="
        fixed
        inset-0
        z-50
        flex
        items-center
        justify-center
        bg-black/50
        p-4
      "
      role="dialog"
      aria-modal="true"
      aria-labelledby="viewing-details-title"
      onMouseDown={(event) => {

        if (event.target === event.currentTarget) {
          onClose?.();
        }

      }}
    >

      <div
        className="
          flex
          max-h-[92vh]
          w-full
          max-w-5xl
          flex-col
          overflow-hidden
          rounded-2xl
          bg-white
          shadow-2xl
        "
      >

        {/* ==================================================
            HEADER
        =================================================== */}

        <header
          className="
            flex
            items-start
            justify-between
            border-b
            p-6
          "
        >

          <div>

            <div className="flex flex-wrap items-center gap-3">

              <h2
                id="viewing-details-title"
                className="text-xl font-bold text-gray-900"
              >
                Viewing Details
              </h2>

              <span
                className={`
                  rounded-full
                  px-3
                  py-1
                  text-xs
                  font-semibold
                  ${statusConfig.className}
                `}
              >
                {statusConfig.label}
              </span>

            </div>

            <p className="mt-1 text-sm text-gray-500">
              Viewing ID:{" "}
              {viewing._id ||
                viewing.id ||
                "-"}
            </p>

          </div>

          <button
            type="button"
            onClick={onClose}
            className="
              rounded-lg
              p-2
              text-gray-500
              hover:bg-gray-100
              hover:text-gray-800
            "
            aria-label="Close viewing details"
          >
            <X size={20} />
          </button>

        </header>

        {/* ==================================================
            CONTENT
        =================================================== */}

        <div className="overflow-y-auto">

          <div className="grid gap-6 p-6 lg:grid-cols-2">

            {/* ==============================================
                VIEWING INFORMATION
            =============================================== */}

            <section className="rounded-2xl border p-5">

              <h3 className="mb-5 flex items-center gap-2 font-bold text-gray-900">

                <CalendarDays
                  size={18}
                  className="text-emerald-600"
                />

                Viewing Information

              </h3>

              <div className="space-y-5">

                <InfoRow
                  icon={<CalendarDays size={18} />}
                  label="Date"
                  value={formatDate(viewingDate)}
                />

                <InfoRow
                  icon={<Clock size={18} />}
                  label="Start Time"
                  value={formatTime(viewingDate)}
                />

                {viewingEnd && (

                  <InfoRow
                    icon={<Clock size={18} />}
                    label="End Time"
                    value={formatTime(viewingEnd)}
                  />

                )}

                <InfoRow
                  icon={<Home size={18} />}
                  label="Property"
                  value={propertyName}
                />

                <InfoRow
                  icon={<MapPin size={18} />}
                  label="Location"
                  value={propertyLocation}
                />

              </div>

            </section>

            {/* ==============================================
                CUSTOMER
            =============================================== */}

            <section className="rounded-2xl border p-5">

              <h3 className="mb-5 flex items-center gap-2 font-bold text-gray-900">

                <User
                  size={18}
                  className="text-emerald-600"
                />

                Customer

              </h3>

              <div className="space-y-5">

                <InfoRow
                  icon={<User size={18} />}
                  label="Name"
                  value={customerName}
                />

                <InfoRow
                  icon={<Phone size={18} />}
                  label="Phone"
                  value={customerPhone}
                />

                <InfoRow
                  icon={<Mail size={18} />}
                  label="Email"
                  value={customerEmail}
                />

              </div>

              <div className="mt-5 flex gap-2">

                {customerPhone && (

                  <ActionButton
                    icon={<Phone size={16} />}
                    label="Call"
                    variant="primary"
                    onClick={() =>
                      onCallCustomer?.(
                        customerPhone,
                        viewing
                      )
                    }
                  />

                )}

                {customerPhone && (

                  <ActionButton
                    icon={<MessageSquare size={16} />}
                    label="Message"
                    onClick={() =>
                      onMessageCustomer?.(
                        customer,
                        viewing
                      )
                    }
                  />

                )}

              </div>

            </section>

            {/* ==============================================
                PROPERTY
            =============================================== */}

            <section className="rounded-2xl border p-5">

              <h3 className="mb-5 flex items-center gap-2 font-bold text-gray-900">

                <Building2
                  size={18}
                  className="text-emerald-600"
                />

                Property

              </h3>

              <div className="space-y-5">

                <InfoRow
                  icon={<Home size={18} />}
                  label="Property"
                  value={propertyName}
                />

                <InfoRow
                  icon={<MapPin size={18} />}
                  label="Location"
                  value={propertyLocation}
                />

                <InfoRow
                  icon={<Building2 size={18} />}
                  label="Property ID"
                  value={
                    property._id ||
                    property.id ||
                    viewing.propertyId ||
                    "-"
                  }
                />

                <InfoRow
                  icon={<Home size={18} />}
                  label="Budget"
                  value={
                    viewing.budget ||
                    customer.budget ||
                    "-"
                  }
                />

              </div>

            </section>

            {/* ==============================================
                ASSIGNED AGENT
            =============================================== */}

            <section className="rounded-2xl border p-5">

              <h3 className="mb-5 flex items-center gap-2 font-bold text-gray-900">

                <User
                  size={18}
                  className="text-emerald-600"
                />

                Assigned Agent

              </h3>

              <div className="space-y-5">

                <InfoRow
                  icon={<User size={18} />}
                  label="Agent"
                  value={agentName}
                />

                <InfoRow
                  icon={<Mail size={18} />}
                  label="Email"
                  value={
                    agent.email ||
                    viewing.agentEmail
                  }
                />

                <InfoRow
                  icon={<Phone size={18} />}
                  label="Phone"
                  value={
                    agent.phone ||
                    viewing.agentPhone
                  }
                />

              </div>

            </section>

            {/* ==============================================
                REQUEST DETAILS
            =============================================== */}

            <section className="rounded-2xl border p-5 lg:col-span-2">

              <h3 className="mb-5 font-bold text-gray-900">
                Request Details
              </h3>

              <div className="grid gap-5 md:grid-cols-3">

                <InfoRow
                  icon={<Clock size={18} />}
                  label="Requested"
                  value={
                    formatDate(
                      viewing.requestedAt ||
                      viewing.createdAt
                    )
                  }
                />

                <InfoRow
                  icon={<Check size={18} />}
                  label="Approved"
                  value={
                    formatDate(
                      viewing.approvedAt
                    )
                  }
                />

                <InfoRow
                  icon={<RotateCcw size={18} />}
                  label="Rescheduled"
                  value={
                    formatDate(
                      viewing.rescheduledAt
                    )
                  }
                />

              </div>

              {(viewing.reason ||
                viewing.notes ||
                viewing.rejectionReason ||
                viewing.cancelReason) && (

                <div className="mt-5 rounded-xl bg-gray-50 p-4">

                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Notes / Reason
                  </p>

                  <p className="mt-2 text-sm text-gray-700">
                    {viewing.reason ||
                      viewing.notes ||
                      viewing.rejectionReason ||
                      viewing.cancelReason}
                  </p>

                </div>

              )}

            </section>

            {/* ==============================================
                TIMELINE
            =============================================== */}

            <div className="lg:col-span-2">

              <ViewingTimeline
                viewing={viewing}
              />

            </div>

          </div>

        </div>

        {/* ==================================================
            CONTEXTUAL ACTIONS
        =================================================== */}

        <footer
          className="
            flex
            flex-wrap
            items-center
            justify-end
            gap-3
            border-t
            bg-gray-50
            p-5
          "
        >

          {/* REQUESTED */}

          {status === "requested" && (

            <>
              <ActionButton
                icon={<Check size={16} />}
                label="Approve"
                variant="success"
                disabled={loading}
                onClick={() =>
                  onApprove?.(viewing)
                }
              />

              <ActionButton
                icon={<XCircle size={16} />}
                label="Reject"
                variant="danger"
                disabled={loading}
                onClick={() =>
                  onReject?.(viewing)
                }
              />

              <ActionButton
                icon={<Ban size={16} />}
                label="Cancel"
                variant="secondary"
                disabled={loading}
                onClick={() =>
                  onCancel?.(viewing)
                }
              />
            </>

          )}

          {/* APPROVED */}

          {status === "approved" && (

            <>
              <ActionButton
                icon={<RotateCcw size={16} />}
                label="Reschedule"
                variant="warning"
                disabled={loading}
                onClick={() =>
                  onReschedule?.(viewing)
                }
              />

              <ActionButton
                icon={<Ban size={16} />}
                label="Cancel"
                variant="danger"
                disabled={loading}
                onClick={() =>
                  onCancel?.(viewing)
                }
              />

              <ActionButton
                icon={<CheckCircle2 size={16} />}
                label="Complete Viewing"
                variant="success"
                disabled={loading}
                onClick={() =>
                  onComplete?.(viewing)
                }
              />
            </>

          )}

          {/* RESCHEDULED */}

          {status === "rescheduled" && (

            <>
              <ActionButton
                icon={<RotateCcw size={16} />}
                label="Reschedule Again"
                variant="warning"
                disabled={loading}
                onClick={() =>
                  onReschedule?.(viewing)
                }
              />

              <ActionButton
                icon={<Ban size={16} />}
                label="Cancel"
                variant="danger"
                disabled={loading}
                onClick={() =>
                  onCancel?.(viewing)
                }
              />

              <ActionButton
                icon={<CheckCircle2 size={16} />}
                label="Complete Viewing"
                variant="success"
                disabled={loading}
                onClick={() =>
                  onComplete?.(viewing)
                }
              />
            </>

          )}

          {/* COMPLETED */}

          {status === "completed" && (

            <ActionButton
              icon={<MessageSquare size={16} />}
              label="Submit Feedback"
              variant="primary"
              onClick={() =>
                onFeedback?.(viewing)
              }
            />

          )}

          {/* TERMINAL STATES */}

          {(status === "cancelled" ||
            status === "rejected") && (

            <span className="mr-auto text-sm text-gray-500">
              This viewing is no longer active.
            </span>

          )}

          {/* CLOSE */}

          <ActionButton
            label="Close"
            variant="secondary"
            onClick={onClose}
          />

        </footer>

      </div>

    </div>

  );

};

export default ViewingDetailsModal;

