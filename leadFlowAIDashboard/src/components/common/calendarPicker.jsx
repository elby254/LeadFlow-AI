// ======================================================
// Reusable Calendar Picker
// ======================================================

import { ChevronLeft, ChevronRight } from "lucide-react";

const CalendarPicker = ({

  currentMonth,

  selectedDate,

  calendar = [],

  onPreviousMonth,

  onNextMonth,

  onSelectDate,

  loading = false,

}) => {

  // ====================================================
  // HELPERS
  // ====================================================

  const isSelected = (date) => {

    if (!selectedDate) return false;

    return (

      new Date(date).toDateString() ===

      new Date(selectedDate).toDateString()

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

      <div className="flex items-center justify-between border-b px-5 py-4">

        <button

          type="button"

          onClick={onPreviousMonth}

          className="rounded-lg p-2 transition hover:bg-gray-100"

        >

          <ChevronLeft size={20} />

        </button>

        <h2 className="text-lg font-semibold text-gray-800">

          {currentMonth}

        </h2>

        <button

          type="button"

          onClick={onNextMonth}

          className="rounded-lg p-2 transition hover:bg-gray-100"

        >

          <ChevronRight size={20} />

        </button>

      </div>

      {/* ============================================== */}
      {/* WEEK DAYS */}
      {/* ============================================== */}

      <div className="grid grid-cols-7 border-b bg-gray-50 text-center text-xs font-semibold uppercase tracking-wide text-gray-500">

        {[
          "Sun",
          "Mon",
          "Tue",
          "Wed",
          "Thu",
          "Fri",
          "Sat",
        ].map((day) => (

          <div

            key={day}

            className="py-3"

          >

            {day}

          </div>

        ))}

      </div>

      {/* ============================================== */}
      {/* CALENDAR GRID */}
      {/* ============================================== */}

      <div className="grid grid-cols-7 gap-2 p-4">

        {loading ? (

          [...Array(35)].map((_, index) => (

            <div

              key={index}

              className="h-14 animate-pulse rounded-lg bg-gray-100"

            />

          ))

        ) : (

          calendar.map((day) => (

            <button

              key={day.date}

              type="button"

              disabled={!day.available}

              onClick={() => onSelectDate(day.date)}

              className={`relative h-14 rounded-lg border text-sm font-medium transition

                ${
                  isSelected(day.date)
                    ? "border-blue-600 bg-blue-600 text-white"
                    : day.available
                    ? "border-gray-200 bg-white hover:border-blue-400 hover:bg-blue-50"
                    : "cursor-not-allowed border-gray-100 bg-gray-100 text-gray-400"
                }

              `}

            >

              {/* Day Number */}

              <span>

                {new Date(day.date).getDate()}

              </span>

              {/* Availability Indicator */}

              {day.available && (

                <span

                  className={`absolute bottom-1 left-1/2 h-2 w-2 -translate-x-1/2 rounded-full

                    ${
                      isSelected(day.date)
                        ? "bg-white"
                        : "bg-green-500"
                    }

                  `}

                />

              )}

            </button>

          ))

        )}

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

            {selectedDate
              ? new Date(selectedDate).toLocaleDateString()
              : "None"}

          </span>

        </div>

      </div>

    </div>

  );

};

export default CalendarPicker;