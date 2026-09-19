// ======================================================
// Reusable Time Slot Picker
// ======================================================

import { Clock3 } from "lucide-react";

const TimeSlotPicker = ({

  slots = [],

  selectedSlot,

  onSelectSlot,

  loading = false,

}) => {

  // ====================================================
  // HELPERS
  // ====================================================

  const isSelected = (slotId) => {

    if (!selectedSlot) return false;

    return (

      selectedSlot._id === slotId ||

      selectedSlot === slotId

    );

  };

  // ====================================================
  // RENDER
  // ====================================================

  return (

    <div className="rounded-xl border border-gray-200 bg-white shadow-sm">

      {/* ============================================== */}
      {/* HEADER */}
      {/* ============================================== */}

      <div className="flex items-center gap-3 border-b px-5 py-4">

        <Clock3
          size={20}
          className="text-blue-600"
        />

        <div>

          <h2 className="font-semibold text-gray-900">

            Available Time Slots

          </h2>

          <p className="text-sm text-gray-500">

            Select a preferred appointment time.

          </p>

        </div>
        
      </div>

      {/* ============================================== */}
      {/* BODY */}
      {/* ============================================== */}

      <div className="p-5">

        {loading ? (

          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">

            {[...Array(6)].map((_, index) => (

              <div

                key={index}

                className="h-12 animate-pulse rounded-lg bg-gray-100"

              />

            ))}

          </div>

        ) : (

          slots.length === 0 ? (

            <div className="py-8 text-center">

              <Clock3
                size={40}
                className="mx-auto mb-3 text-gray-300"
              />

              <p className="text-gray-500">

                No available time slots.

              </p>

            </div>

          ) : (

            <div className="grid grid-cols-2 gap-3 md:grid-cols-3">

              {slots.map((slot) => (

                <button

                  key={slot._id}

                  type="button"

                  disabled={!slot.available}

                  onClick={() => onSelectSlot(slot)}

                  className={`rounded-lg border px-4 py-3 text-sm font-medium transition

                    ${
                      isSelected(slot._id)
                        ? "border-blue-600 bg-blue-600 text-white"
                        : slot.available
                        ? "border-gray-200 bg-white hover:border-blue-500 hover:bg-blue-50"
                        : "cursor-not-allowed border-gray-100 bg-gray-100 text-gray-400"
                    }

                  `}

                >

                  {slot.startTime}

                  {" - "}

                  {slot.endTime}

                </button>

              ))}

            </div>

          ))}

      </div>

      {/* ============================================== */}
      {/* FOOTER */}
      {/* ============================================== */}

      <div className="flex items-center justify-between border-t bg-gray-50 px-5 py-3 text-sm text-gray-500">

        <div className="flex items-center gap-2">

          <span className="h-2 w-2 rounded-full bg-green-500" />

          <span>

            Available

          </span>

        </div>

        <div>

          Selected:

          {" "}

          <span className="font-medium text-gray-700">

            {selectedSlot

              ? `${selectedSlot.startTime} - ${selectedSlot.endTime}`

              : "None"}

          </span>

        </div>

      </div>

    </div>

  );

};

export default TimeSlotPicker;