/**
 * ==========================================================
 *
 * Right-side conversation information panel.
 *
 * Responsibilities
 * ----------------------------------------------------------
 * ✓ Customer profile
 * ✓ Contact information
 * ✓ Lead qualification
 * ✓ Lead score
 * ✓ Property interest
 * ✓ Assigned agent
 * ✓ Conversation statistics
 * ✓ AI summary
 * ✓ Viewing status
 * ✓ Viewing timeline
 * ✓ Viewing history
 * ✓ Viewing actions
 * ✓ Internal notes
 * ✓ Quick actions
 *
 * ==========================================================
 */

import {
  User,
  Phone,
  Mail,
  MapPin,
  Home,
  Star,
  Brain,
  Calendar,
  Clock,
  ShieldCheck,
  FileText,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Ban,
  MessageSquare,
} from "lucide-react";

import ViewingStatusBadge from "./ViewingStatusBadge";


/* ==========================================================
   COMPONENT
========================================================== */

const ConversationDetails = ({
  conversation,

  /* Customer actions */
  onCallCustomer,
  onAssignAgent,

  /* Viewing actions */
  onScheduleViewing,
  onApproveViewing,
  onRejectViewing,
  onRescheduleViewing,
  onCancelViewing,
  onCompleteViewing,

  /* Viewing data */
  viewing = null,
  viewingHistory = [],

  /* Notes */
  internalNotes = "",

  /* Optional loading state */
  viewingLoading = false,
}) => {

  /* ========================================================
     EMPTY STATE
  ======================================================== */

  if (!conversation) {
    return (
      <aside className="flex h-full items-center justify-center p-6">
        <div className="text-center">
          <MessageSquare
            size={42}
            className="mx-auto mb-3 text-gray-300"
          />

          <p className="font-medium text-gray-600">
            Select a conversation
          </p>

          <p className="mt-1 text-sm text-gray-400">
            Customer and viewing information will appear here.
          </p>
        </div>
      </aside>
    );
  }


  /* ========================================================
     VIEWING STATUS
  ======================================================== */

  const viewingStatus =
    viewing?.status ||
    conversation.viewingStatus ||
    null;


  /* ========================================================
     VIEWING DATE
  ======================================================== */

  const viewingDate =
    viewing?.scheduledDate ||
    viewing?.date ||
    conversation.viewingDate ||
    null;


  /* ========================================================
     VIEWING TIME
  ======================================================== */

  const viewingTime =
    viewing?.scheduledTime ||
    viewing?.time ||
    conversation.viewingTime ||
    null;


  /* ========================================================
     CAN SHOW VIEWING SECTION
  ======================================================== */

  const hasViewing =
    Boolean(
      viewing ||
      conversation.viewing ||
      viewingStatus
    );


  return (
    <aside className="flex h-full flex-col overflow-y-auto bg-white">

      {/* ====================================================
          HEADER
      ==================================================== */}

      <div className="border-b p-6">

        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-600 text-3xl font-bold text-white">

          {conversation.customerName
            ?.charAt(0)
            ?.toUpperCase() || "?"}

        </div>

        <h2 className="mt-4 text-center text-xl font-bold text-gray-800">

          {conversation.customerName ||
            "Unknown Customer"}

        </h2>

        <p className="mt-1 text-center text-sm text-gray-500">

          Lead ID:{" "}
          {conversation.id ||
            conversation._id ||
            "-"}

        </p>

      </div>


      {/* ====================================================
          CUSTOMER INFORMATION
      ==================================================== */}

      <section className="border-b p-6">

        <h3 className="mb-4 font-semibold text-gray-800">
          Customer Information
        </h3>

        <div className="space-y-4">

          <InfoRow
            icon={<Phone size={18} />}
            label="Phone"
            value={conversation.phone}
          />

          <InfoRow
            icon={<Mail size={18} />}
            label="Email"
            value={conversation.email}
          />

          <InfoRow
            icon={<MapPin size={18} />}
            label="Location"
            value={conversation.location}
          />

        </div>

      </section>


      {/* ====================================================
          PROPERTY INTEREST
      ==================================================== */}

      <section className="border-b p-6">

        <h3 className="mb-4 font-semibold text-gray-800">
          Property Interest
        </h3>

        <div className="space-y-4">

          <InfoRow
            icon={<Home size={18} />}
            label="Property"
            value={conversation.propertyName}
          />

          <InfoRow
            icon={<Star size={18} />}
            label="Budget"
            value={
              conversation.budget ||
              "-"
            }
          />

          <InfoRow
            icon={<Home size={18} />}
            label="Bedrooms"
            value={
              conversation.bedrooms ||
              "-"
            }
          />

        </div>

      </section>


      {/* ====================================================
          AI QUALIFICATION
      ==================================================== */}

      <section className="border-b p-6">

        <h3 className="mb-4 flex items-center gap-2 font-semibold text-gray-800">

          <Brain
            size={18}
            className="text-emerald-600"
          />

          AI Qualification

        </h3>

        <div className="space-y-3">

          <StatusBadge
            label="Qualification"
            value={
              conversation.aiQualification
            }
          />

          <StatusBadge
            label="Lead Score"
            value={
              conversation.leadScore !== undefined
                ? `${conversation.leadScore}/100`
                : "-"
            }
          />

          <StatusBadge
            label="Transaction Intent"
            value={formatIntent(transactionIntent)}
          />

        </div>

      </section>


      {/* ====================================================
          ASSIGNED AGENT
      ==================================================== */}

      <section className="border-b p-6">

        <h3 className="mb-4 font-semibold text-gray-800">
          Assigned Agent
        </h3>

        <InfoRow
          icon={<User size={18} />}
          label="Agent"
          value={
            conversation.assignedAgent ||
            "Unassigned"
          }
        />

      </section>


      {/* ====================================================
          VIEWING INFORMATION
      ==================================================== */}

      <section className="border-b p-6">

        <div className="mb-4 flex items-center justify-between">

          <h3 className="flex items-center gap-2 font-semibold text-gray-800">

            <Calendar
              size={18}
              className="text-emerald-600"
            />

            Property Viewing

          </h3>

          {hasViewing && (
            <ViewingStatusBadge
              status={viewingStatus}
            />
          )}

        </div>


        {!hasViewing ? (

          <div className="rounded-xl border border-dashed p-4 text-center">

            <Calendar
              size={28}
              className="mx-auto mb-2 text-gray-300"
            />

            <p className="text-sm font-medium text-gray-600">
              No viewing scheduled
            </p>

            <button
              type="button"
              onClick={() =>
                onScheduleViewing?.(
                  conversation
                )
              }
              className="mt-3 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
            >
              Schedule Viewing
            </button>

          </div>

        ) : (

          <div className="space-y-4">

            <InfoRow
              icon={<Calendar size={18} />}
              label="Date"
              value={viewingDate}
            />

            <InfoRow
              icon={<Clock size={18} />}
              label="Time"
              value={viewingTime}
            />

            <InfoRow
              icon={<MapPin size={18} />}
              label="Location"
              value={
                viewing?.location ||
                conversation.propertyLocation ||
                conversation.location
              }
            />

            {viewing?.agentName && (
              <InfoRow
                icon={<User size={18} />}
                label="Viewing Agent"
                value={viewing.agentName}
              />
            )}

          </div>

        )}

      </section>


      {/* ====================================================
          VIEWING TIMELINE
      ==================================================== */}

      {hasViewing && (

        <section className="border-b p-6">

          <h3 className="mb-4 font-semibold text-gray-800">
            Viewing Timeline
          </h3>

          <div className="space-y-4">

            <TimelineItem
              title="Viewing Requested"
              date={
                viewing?.requestedAt
              }
              active
            />

            <TimelineItem
              title="Viewing Approved"
              date={
                viewing?.approvedAt
              }
              active={
                [
                  "approved",
                  "scheduled",
                  "rescheduled",
                  "completed",
                ].includes(
                  viewingStatus
                )
              }
            />

            {viewingStatus === "rescheduled" && (
              <TimelineItem
                title="Viewing Rescheduled"
                date={
                  viewing?.rescheduledAt
                }
                active
              />
            )}

            <TimelineItem
              title="Viewing Completed"
              date={
                viewing?.completedAt
              }
              active={
                viewingStatus === "completed"
              }
            />

          </div>

        </section>

      )}


      {/* ====================================================
          VIEWING HISTORY
      ==================================================== */}

      {viewingHistory.length > 0 && (

        <section className="border-b p-6">

          <h3 className="mb-4 font-semibold text-gray-800">
            Viewing History
          </h3>

          <div className="space-y-3">

            {viewingHistory.map(
              (item, index) => (

                <div
                  key={
                    item._id ||
                    item.id ||
                    `viewing-history-${index}`
                  }
                  className="rounded-lg bg-gray-50 p-3"
                >

                  <div className="flex items-center justify-between gap-3">

                    <p className="text-sm font-medium text-gray-800">
                      {item.action ||
                        item.status ||
                        "Viewing update"}
                    </p>

                    <ViewingStatusBadge
                      status={
                        item.status
                      }
                    />

                  </div>

                  {item.createdAt && (
                    <p className="mt-1 text-xs text-gray-500">
                      {item.createdAt}
                    </p>
                  )}

                </div>

              )
            )}

          </div>

        </section>

      )}


      {/* ====================================================
          VIEWING ACTIONS
      ==================================================== */}

      {hasViewing && (

        <section className="border-b p-6">

          <h3 className="mb-4 font-semibold text-gray-800">
            Viewing Actions
          </h3>

          <div className="grid grid-cols-2 gap-2">

            {["requested", "pending"].includes(
              viewingStatus
            ) && (

              <>
                <button
                  type="button"
                  disabled={viewingLoading}
                  onClick={() =>
                    onApproveViewing?.(
                      viewing
                    )
                  }
                  className="flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <CheckCircle2 size={16} />
                  Approve
                </button>

                <button
                  type="button"
                  disabled={viewingLoading}
                  onClick={() =>
                    onRejectViewing?.(
                      viewing
                    )
                  }
                  className="flex items-center justify-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                >
                  <XCircle size={16} />
                  Reject
                </button>
              </>

            )}


            {[
              "approved",
              "scheduled",
              "rescheduled",
            ].includes(viewingStatus) && (

              <>
                <button
                  type="button"
                  disabled={viewingLoading}
                  onClick={() =>
                    onRescheduleViewing?.(
                      viewing
                    )
                  }
                  className="flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
                >
                  <RotateCcw size={16} />
                  Reschedule
                </button>

                <button
                  type="button"
                  disabled={viewingLoading}
                  onClick={() =>
                    onCancelViewing?.(
                      viewing
                    )
                  }
                  className="flex items-center justify-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                >
                  <Ban size={16} />
                  Cancel
                </button>

                <button
                  type="button"
                  disabled={viewingLoading}
                  onClick={() =>
                    onCompleteViewing?.(
                      viewing
                    )
                  }
                  className="col-span-2 flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  <CheckCircle2 size={16} />
                  Complete Viewing
                </button>
              </>

            )}

          </div>

        </section>

      )}


      {/* ====================================================
          AI SUMMARY
      ==================================================== */}

      <section className="border-b p-6">

        <h3 className="mb-4 flex items-center gap-2 font-semibold text-gray-800">

          <FileText
            size={18}
            className="text-emerald-600"
          />

          AI Summary

        </h3>

        <p className="rounded-lg bg-gray-50 p-4 text-sm leading-relaxed text-gray-700">

          {conversation.aiSummary ||
            "No AI summary available."}

        </p>

      </section>


      {/* ====================================================
          CONVERSATION STATISTICS
      ==================================================== */}

      <section className="border-b p-6">

        <h3 className="mb-4 font-semibold text-gray-800">
          Conversation
        </h3>

        <div className="space-y-4">

          <InfoRow
            icon={<Calendar size={18} />}
            label="Started"
            value={
              conversation.startedAt
            }
          />

          <InfoRow
            icon={<Clock size={18} />}
            label="Last Activity"
            value={
              conversation.updatedAt
            }
          />

          <InfoRow
            icon={<ShieldCheck size={18} />}
            label="Status"
            value={
              conversation.status
            }
          />

        </div>

      </section>


      {/* ====================================================
          INTERNAL NOTES
      ==================================================== */}

      <section className="border-b p-6">

        <h3 className="mb-3 flex items-center gap-2 font-semibold text-gray-800">

          <FileText size={18} />

          Internal Notes

        </h3>

        <div className="rounded-lg bg-amber-50 p-4 text-sm text-gray-700">

          {internalNotes ||
            conversation.internalNotes ||
            "No internal notes."}

        </div>

      </section>


      {/* ====================================================
          QUICK ACTIONS
      ==================================================== */}

      <div className="mt-auto space-y-3 p-6">

        <button
          type="button"
          onClick={() =>
            onCallCustomer?.(
              conversation
            )
          }
          className="w-full rounded-xl bg-emerald-600 py-3 font-medium text-white hover:bg-emerald-700"
        >
          Call Customer
        </button>


        {!hasViewing && (

          <button
            type="button"
            onClick={() =>
              onScheduleViewing?.(
                conversation
              )
            }
            className="w-full rounded-xl border py-3 font-medium hover:bg-gray-50"
          >
            Schedule Viewing
          </button>

        )}


        <button
          type="button"
          onClick={() =>
            onAssignAgent?.(
              conversation
            )
          }
          className="w-full rounded-xl border py-3 font-medium hover:bg-gray-50"
        >
          Assign Agent
        </button>

      </div>

    </aside>
  );
};


/* ==========================================================
   INFO ROW
========================================================== */

const InfoRow = ({
  icon,
  label,
  value,
}) => (

  <div className="flex items-start gap-3">

    <div className="mt-0.5 shrink-0 text-gray-400">
      {icon}
    </div>

    <div className="min-w-0">

      <p className="text-xs uppercase tracking-wide text-gray-500">
        {label}
      </p>

      <p className="break-words text-sm font-medium text-gray-800">
        {value || "-"}
      </p>

    </div>

  </div>
);


/* ==========================================================
   STATUS BADGE
========================================================== */

const StatusBadge = ({
  label,
  value,
}) => (

  <div className="flex items-center justify-between rounded-lg bg-gray-50 p-3">

    <span className="text-sm text-gray-500">
      {label}
    </span>

    <span className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-700">
      {value || "-"}
    </span>

  </div>
);


/* ==========================================================
   VIEWING TIMELINE ITEM
========================================================== */

const TimelineItem = ({
  title,
  date,
  active = false,
}) => (

  <div className="flex gap-3">

    <div
      className={`mt-1 h-3 w-3 shrink-0 rounded-full ${
        active
          ? "bg-emerald-600"
          : "bg-gray-300"
      }`}
    />

    <div className="min-w-0">

      <p
        className={`text-sm font-medium ${
          active
            ? "text-gray-800"
            : "text-gray-400"
        }`}
      >
        {title}
      </p>

      {date && (
        <p className="mt-1 text-xs text-gray-500">
          {date}
        </p>
      )}

    </div>

  </div>
);


/* ==========================================================
   EXPORT
========================================================== */

export default ConversationDetails;