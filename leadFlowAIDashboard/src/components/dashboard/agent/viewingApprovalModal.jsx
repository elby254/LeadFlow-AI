// ======================================================
// Agent Dashboard
// Viewing Approval Modal
// ======================================================

import {

  CheckCircle2,
  XCircle,
  CalendarClock,
  X,

} from "lucide-react";

const ViewingApprovalModal = ({

  open,

  viewing,

  loading = false,

  notes,

  onNotesChange,

  onApprove,

  onReject,

  onReschedule,

  onClose,

}) => {

  if (!open || !viewing) return null;

  return (

    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">

      <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl">

        {/* ============================================== */}
        {/* HEADER */}
        {/* ============================================== */}

        <div className="flex items-center justify-between border-b px-6 py-5">

          <div>

            <h2 className="text-xl font-semibold text-gray-900">

              Viewing Approval

            </h2>

            <p className="mt-1 text-sm text-gray-500">

              Review the customer's viewing request before taking action.

            </p>

          </div>

          <button

            type="button"

            onClick={onClose}

            className="rounded-lg p-2 transition hover:bg-gray-100"

          >

            <X size={20} />

          </button>

        </div>

        {/* ============================================== */}
        {/* REQUEST DETAILS */}
        {/* ============================================== */}

        <div className="space-y-5 p-6">

          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">

            <div className="grid gap-4 md:grid-cols-2">

              <div>

                <p className="text-xs uppercase tracking-wide text-gray-500">

                  Customer

                </p>

                <p className="font-medium text-gray-900">

                  {viewing.customerName}

                </p>

              </div>

              <div>

                <p className="text-xs uppercase tracking-wide text-gray-500">

                  Property

                </p>

                <p className="font-medium text-gray-900">

                  {viewing.propertyTitle}

                </p>

              </div>

              <div>

                <p className="text-xs uppercase tracking-wide text-gray-500">

                  Requested Date

                </p>

                <p className="font-medium text-gray-900">

                  {new Date(viewing.date).toLocaleDateString()}

                </p>

              </div>

              <div>

                <p className="text-xs uppercase tracking-wide text-gray-500">

                  Requested Time

                </p>

                <p className="font-medium text-gray-900">

                  {viewing.startTime}

                  {" - "}

                  {viewing.endTime}

                </p>

              </div>

            </div>

          </div>

          {/* ============================================== */}
          {/* AGENT NOTES */}
          {/* ============================================== */}

          <div>

            <label className="mb-2 block text-sm font-medium text-gray-700">

              Agent Notes

            </label>

            <textarea

              rows={4}

              value={notes}

              onChange={(e) =>

                onNotesChange(e.target.value)

              }

              placeholder="Add notes for the customer or internal records..."

              className="w-full resize-none rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"

            />

          </div>

          {/* ============================================== */}
          {/* ACTIONS */}
          {/* ============================================== */}

          <div className="grid gap-4 md:grid-cols-3">

            {/* APPROVE */}

            <button

              type="button"

              onClick={onApprove}

              disabled={loading}

              className="flex flex-col items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 p-5 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50"

            >

              <CheckCircle2

                size={30}

                className="mb-3 text-emerald-600"

              />

              <span className="font-semibold text-emerald-700">

                Approve

              </span>

              <span className="mt-1 text-center text-xs text-emerald-600">

                Confirm the viewing request.

              </span>

            </button>

            {/* REJECT */}

            <button

              type="button"

              onClick={onReject}

              disabled={loading}

              className="flex flex-col items-center justify-center rounded-xl border border-red-200 bg-red-50 p-5 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"

            >

              <XCircle

                size={30}

                className="mb-3 text-red-600"

              />

              <span className="font-semibold text-red-700">

                Reject

              </span>

              <span className="mt-1 text-center text-xs text-red-600">

                Decline this viewing request.

              </span>

            </button>

            {/* RESCHEDULE */}

            <button

              type="button"

              onClick={onReschedule}

              disabled={loading}

              className="flex flex-col items-center justify-center rounded-xl border border-blue-200 bg-blue-50 p-5 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50"

            >

              <CalendarClock

                size={30}

                className="mb-3 text-blue-600"

              />

              <span className="font-semibold text-blue-700">

                Reschedule

              </span>

              <span className="mt-1 text-center text-xs text-blue-600">

                Choose another viewing date.

              </span>

            </button>

          </div>

        </div>

        {/* ============================================== */}
        {/* FOOTER */}
        {/* ============================================== */}

        <div className="flex items-center justify-between border-t bg-gray-50 px-6 py-5">

          <div>

            <p className="text-xs uppercase tracking-wide text-gray-500">

              Viewing Reference

            </p>

            <p className="font-medium text-gray-900">

              {viewing.referenceNumber || viewing._id}

            </p>

          </div>

          {loading && (

            <span className="text-sm font-medium text-blue-600">

              Processing...

            </span>

          )}

        </div>

      </div>

    </div>

  );

};

export default ViewingApprovalModal;