// ======================================================
// Reschedule Viewing Modal
// ======================================================

import { CalendarClock, X } from "lucide-react";

import CalendarPicker from "./CalendarPicker";
import TimeSlotPicker from "./TimeSlotPicker";

const RescheduleModal = ({

  open,

  calendar,

  slots,

  currentMonth,

  selectedDate,

  selectedSlot,

  loading = false,

  notes,

  onPreviousMonth,

  onNextMonth,

  onDateSelect,

  onSlotSelect,

  onNotesChange,

  onConfirm,

  onClose,

}) => {

  if (!open) return null;

  return (

    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">

      <div className="max-h-[90vh] w-full max-w-5xl overflow-auto rounded-2xl bg-white shadow-2xl">

        {/* ============================================== */}
        {/* HEADER */}
        {/* ============================================== */}

        <div className="flex items-center justify-between border-b px-6 py-5">

          <div className="flex items-center gap-3">

            <CalendarClock

              size={24}

              className="text-blue-600"

            />

            <div>

              <h2 className="text-xl font-semibold text-gray-900">

                Reschedule Viewing

              </h2>

              <p className="text-sm text-gray-500">

                Choose a new viewing date and time.

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

        <div className="grid gap-6 p-6 lg:grid-cols-2">

          {/* Calendar */}

          <CalendarPicker

            currentMonth={currentMonth}

            calendar={calendar}

            selectedDate={selectedDate}

            loading={loading}

            onPreviousMonth={onPreviousMonth}

            onNextMonth={onNextMonth}

            onSelectDate={onDateSelect}

          />

          {/* Time Slots */}

          <TimeSlotPicker

            slots={slots}

            selectedSlot={selectedSlot}

            loading={loading}

            onSelectSlot={onSlotSelect}

          />

        </div>

        {/* ============================================== */}
        {/* NOTES */}
        {/* ============================================== */}

        <div className="px-6 pb-6">

          <label className="mb-2 block text-sm font-medium text-gray-700">

            Reschedule Notes

          </label>

          <textarea

            rows={4}

            value={notes}

            onChange={(e) =>

              onNotesChange(e.target.value)

            }

            placeholder="Provide a reason for rescheduling..."

            className="w-full resize-none rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"

          />

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

            Cancel

          </button>

          <button

            type="button"

            onClick={onConfirm}

            disabled={

              loading ||

              !selectedDate ||

              !selectedSlot

            }

            className="rounded-lg bg-blue-600 px-5 py-3 font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"

          >

            {loading

              ? "Rescheduling..."

              : "Confirm Reschedule"}

          </button>

        </div>

      </div>

    </div>

  );

};

export default RescheduleModal;