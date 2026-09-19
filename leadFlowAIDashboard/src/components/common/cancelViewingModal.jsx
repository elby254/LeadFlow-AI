// ======================================================
// Cancel Viewing Modal
// ======================================================

import { AlertTriangle, X } from "lucide-react";

const CANCEL_REASONS = [

  "Client unavailable",

  "Agent unavailable",

  "Property unavailable",

  "Scheduling conflict",

  "Emergency",

  "Other",

];

const CancelViewingModal = ({

  open,

  reason,

  notes,

  loading = false,

  onReasonChange,

  onNotesChange,

  onCancel,

  onClose,

}) => {

  if (!open) return null;

  return (

    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">

      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">

        {/* ============================================== */}
        {/* HEADER */}
        {/* ============================================== */}

        <div className="flex items-center justify-between border-b px-6 py-5">

          <div className="flex items-center gap-3">

            <AlertTriangle

              size={24}

              className="text-red-600"

            />

            <div>

              <h2 className="text-xl font-semibold text-gray-900">

                Cancel Viewing

              </h2>

              <p className="text-sm text-gray-500">

                This action cannot be undone.

              </p>

            </div>

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
        {/* BODY */}
        {/* ============================================== */}

        <div className="space-y-5 p-6">

          <div>

            <label className="mb-2 block text-sm font-medium text-gray-700">

              Cancellation Reason

            </label>

            <select

              value={reason}

              onChange={(e) =>

                onReasonChange(e.target.value)

              }

              className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-red-500"

            >

              <option value="">

                Select a reason

              </option>

              {CANCEL_REASONS.map((item) => (

                <option

                  key={item}

                  value={item}

                >

                  {item}

                </option>

              ))}

            </select>

          </div>

          <div>

            <label className="mb-2 block text-sm font-medium text-gray-700">

              Additional Notes

            </label>

            <textarea

              rows={4}

              value={notes}

              onChange={(e) =>

                onNotesChange(e.target.value)

              }

              placeholder="Provide additional information..."

              className="w-full resize-none rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-red-500"

            />

          </div>

          {/* ============================================== */}
          {/* WARNING */}
          {/* ============================================== */}

          <div className="rounded-lg border border-red-200 bg-red-50 p-4">

            <div className="flex items-start gap-3">

              <AlertTriangle
                size={18}
                className="mt-0.5 text-red-600"
              />

              <div>

                <p className="text-sm font-semibold text-red-700">

                  Important

                </p>

                <p className="mt-1 text-sm text-red-600">

                  Cancelling this viewing will immediately notify
                  all affected parties and release the reserved
                  calendar time slot.

                </p>

              </div>

            </div>

          </div>

        </div>

        {/* ============================================== */}
        {/* FOOTER */}
        {/* ============================================== */}

        <div className="flex items-center justify-end gap-3 border-t px-6 py-5">

          <button

            type="button"

            onClick={onClose}

            disabled={loading}

            className="rounded-lg border border-gray-300 px-5 py-3 font-medium text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"

          >

            Keep Viewing

          </button>

          <button

            type="button"

            onClick={onCancel}

            disabled={

              loading ||

              !reason

            }

            className="rounded-lg bg-red-600 px-5 py-3 font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"

          >

            {loading

              ? "Cancelling..."

              : "Cancel Viewing"}

          </button>

        </div>

      </div>

    </div>

  );

};

export default CancelViewingModal;