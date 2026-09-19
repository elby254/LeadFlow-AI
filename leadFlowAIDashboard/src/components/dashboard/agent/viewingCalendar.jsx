// ======================================================
// Agent Dashboard
// Weekly Viewing Calendar
// ======================================================

import {

  CalendarDays,
  Clock3,
  CheckCircle2,

} from "lucide-react";

import CalendarPicker from "../../common/CalendarPicker";

const ViewingCalendar = ({

  calendar,

  currentMonth,

  selectedDate,

  selectedDayViewings = [],

  loading = false,

  onPreviousMonth,

  onNextMonth,

  onDateSelect,

}) => {

  return (

    <div className="rounded-xl border border-gray-200 bg-white shadow-sm">

      {/* ============================================== */}
      {/* HEADER */}
      {/* ============================================== */}

      <div className="border-b px-6 py-5">

        <h2 className="text-lg font-semibold text-gray-900">

          Viewing Calendar

        </h2>

        <p className="mt-1 text-sm text-gray-500">

          Manage your viewing schedule and daily availability.

        </p>

      </div>

      {/* ============================================== */}
      {/* CALENDAR */}
      {/* ============================================== */}

      <div className="p-6">

        <CalendarPicker

          calendar={calendar}

          currentMonth={currentMonth}

          selectedDate={selectedDate}

          loading={loading}

          onPreviousMonth={onPreviousMonth}

          onNextMonth={onNextMonth}

          onSelectDate={onDateSelect}

        />

      </div>

      {/* ============================================== */}
      {/* DAILY VIEWINGS */}
      {/* ============================================== */}

      <div className="border-t bg-gray-50 px-6 py-5">

        <div className="mb-4 flex items-center gap-2">

          <CalendarDays

            size={18}

            className="text-blue-600"

          />

          <h3 className="font-semibold text-gray-900">

            Daily Schedule

          </h3>

        </div>

        {loading ? (

          <div className="space-y-4">

            {[...Array(3)].map((_, index) => (

              <div

                key={index}

                className="h-20 animate-pulse rounded-lg bg-gray-200"

              />

            ))}

          </div>

        ) : selectedDayViewings.length === 0 ? (

          <div className="rounded-lg border border-dashed border-gray-300 bg-white p-8 text-center">

            <CalendarDays

              size={42}

              className="mx-auto mb-3 text-gray-300"

            />

            <h4 className="font-semibold text-gray-700">

              No Viewings Scheduled

            </h4>

            <p className="mt-2 text-sm text-gray-500">

              There are no appointments scheduled for the selected day.

            </p>

          </div>

        ) : (

          <div className="space-y-4">

            {selectedDayViewings.map((viewing) => (

              <div

                key={viewing._id}

                className="rounded-lg border border-gray-200 bg-white p-4 transition hover:border-blue-300"

              >

                <div className="flex items-start justify-between">

                  <div>

                    <div className="flex items-center gap-2">

                      <Clock3

                        size={16}

                        className="text-amber-600"

                      />

                      <span className="font-semibold text-gray-900">

                        {viewing.startTime}

                        {" - "}

                        {viewing.endTime}

                      </span>

                    </div>

                    <p className="mt-2 text-sm font-medium text-gray-800">

                      {viewing.customerName}

                    </p>

                    <p className="mt-1 text-sm text-gray-500">

                      {viewing.propertyTitle}

                    </p>

                  </div>

                  <CheckCircle2

                    size={20}

                    className="text-emerald-500"

                  />

                </div>

              </div>

            ))}

          </div>

        )}

      </div>

      {/* ============================================== */}
      {/* FOOTER */}
      {/* ============================================== */}

      <div className="flex items-center justify-between border-t px-6 py-4">

        <div>

          <p className="text-xs uppercase tracking-wide text-gray-500">

            Selected Date

          </p>

          <p className="font-medium text-gray-900">

            {selectedDate

              ? new Date(selectedDate).toLocaleDateString()

              : "None"}

          </p>

        </div>

        <div className="text-right">

          <p className="text-xs uppercase tracking-wide text-gray-500">

            Total Viewings

          </p>

          <p className="font-medium text-gray-900">

            {selectedDayViewings.length}

          </p>

        </div>

      </div>

    </div>

  );

};

export default ViewingCalendar;