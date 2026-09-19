// ======================================================
// Viewing Calendar
// ======================================================

import { useMemo } from "react";

import {
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Clock,
  CheckCircle2,
  Loader2,
} from "lucide-react";

import useViewingCalendar from "../../hooks/useViewingCalendar";
import useViewingAvailability from "../../hooks/useViewingAvailability";

// ======================================================
// COMPONENT
// ======================================================

const ViewingCalendar = ({
  agentId = null,
  onSlotSelected,
  onDateSelected,
}) => {

  // ====================================================
  // CALENDAR HOOK
  // ====================================================

  const {
    calendar,
    selectedDate,
    selectedSlot,
    availableSlots,
    loading: calendarLoading,
    error: calendarError,
    currentMonth,
    loadCalendar,
    loadAvailableSlots,
    nextMonth,
    previousMonth,
    selectSlot,
    setSelectedDate,
  } = useViewingCalendar();

  // ====================================================
  // AVAILABILITY HOOK
  // ====================================================

  const {
    availability,
    loading: availabilityLoading,
    error: availabilityError,
    loadAvailability,
    setSelectedSlot: setAvailabilitySlot,
  } = useViewingAvailability();

  // ====================================================
  // CALENDAR DAYS
  // ====================================================

  const calendarDays = useMemo(() => {

    const year =
      selectedDate.getFullYear();

    const month =
      selectedDate.getMonth();

    const firstDay =
      new Date(
        year,
        month,
        1
      );

    const lastDay =
      new Date(
        year,
        month + 1,
        0
      );

    const startDay =
      firstDay.getDay();

    const daysInMonth =
      lastDay.getDate();

    const days = [];

    // Previous-month placeholders
    for (
      let index = 0;
      index < startDay;
      index += 1
    ) {

      days.push(null);

    }

    // Current month
    for (
      let day = 1;
      day <= daysInMonth;
      day += 1
    ) {

      days.push(
        new Date(
          year,
          month,
          day
        )
      );

    }

    return days;

  }, [selectedDate]);

  // ====================================================
  // SELECT DATE
  // ====================================================

  const handleDateSelect = async (date) => {

    if (!date) {
      return;
    }

    setSelectedDate(date);

    onDateSelected?.(date);

    await loadCalendar(date);

    await loadAvailableSlots(date);

    if (agentId) {

      await loadAvailability(
        agentId,
        date
      );

    }

  };

  // ====================================================
  // SELECT SLOT
  // ====================================================

  const handleSlotSelect = (slot) => {

    selectSlot(slot);

    setAvailabilitySlot(slot);

    onSlotSelected?.(
      slot,
      selectedDate
    );

  };

  // ====================================================
  // CHECK SELECTED DATE
  // ====================================================

  const isSelectedDate = (date) => {

    if (!date) {
      return false;
    }

    return (
      date.toDateString() ===
      selectedDate.toDateString()
    );

  };

  // ====================================================
  // CHECK TODAY
  // ====================================================

  const isToday = (date) => {

    if (!date) {
      return false;
    }

    return (
      date.toDateString() ===
      new Date().toDateString()
    );

  };

  // ====================================================
  // FORMAT SLOT TIME
  // ====================================================

  const formatSlotTime = (slot) => {

    const value =
      slot?.startTime ||
      slot?.start ||
      slot?.scheduledAt ||
      slot?.date;

    if (!value) {
      return "Time unavailable";
    }

    const date =
      new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "Time unavailable";
    }

    return date.toLocaleTimeString(
      "en-KE",
      {
        hour: "2-digit",
        minute: "2-digit",
      }
    );

  };

  // ====================================================
  // SLOT AVAILABILITY
  // ====================================================

  const slots =
    availability.length > 0
      ? availability
      : availableSlots;

  // ====================================================
  // LOADING
  // ====================================================

  const loading =
    calendarLoading ||
    availabilityLoading;

  // ====================================================
  // ERROR
  // ====================================================

  const error =
    calendarError ||
    availabilityError;

  // ====================================================
  // RENDER
  // ====================================================

  return (

    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">

      {/* ==================================================
          HEADER
      =================================================== */}

      <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">

        <div className="flex items-center gap-3">

          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">

            <CalendarDays size={20} />

          </div>

          <div>

            <h2 className="font-semibold text-gray-900">
              Viewing Calendar
            </h2>

            <p className="text-xs text-gray-500">
              Select a date and available viewing slot
            </p>

          </div>

        </div>

        {/* MONTH NAVIGATION */}

        <div className="flex items-center gap-1">

          <button
            type="button"
            onClick={previousMonth}
            className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-800"
            aria-label="Previous month"
          >

            <ChevronLeft size={18} />

          </button>

          <button
            type="button"
            onClick={nextMonth}
            className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-800"
            aria-label="Next month"
          >

            <ChevronRight size={18} />

          </button>

        </div>

      </div>

      {/* ==================================================
          MONTH
      =================================================== */}

      <div className="px-5 py-4">

        <h3 className="text-center text-base font-semibold text-gray-900">
          {currentMonth}
        </h3>

      </div>

      {/* ==================================================
          WEEK DAYS
      =================================================== */}

      <div className="grid grid-cols-7 border-b border-gray-100 px-4">

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
            className="py-2 text-center text-xs font-semibold uppercase tracking-wide text-gray-400"
          >
            {day}
          </div>

        ))}

      </div>

      {/* ==================================================
          CALENDAR GRID
      =================================================== */}

      <div className="grid grid-cols-7 gap-1 p-4">

        {calendarDays.map(
          (date, index) => {

            if (!date) {

              return (
                <div
                  key={`empty-${index}`}
                  className="h-11"
                />
              );

            }

            const selected =
              isSelectedDate(date);

            const today =
              isToday(date);

            return (

              <button
                key={date.toISOString()}
                type="button"
                onClick={() =>
                  handleDateSelect(date)
                }
                className={`relative flex h-11 items-center justify-center rounded-xl text-sm font-medium transition ${
                  selected
                    ? "bg-emerald-600 text-white shadow-sm"
                    : today
                      ? "border border-emerald-500 bg-emerald-50 text-emerald-700"
                      : "text-gray-700 hover:bg-gray-100"
                }`}
              >

                {date.getDate()}

                {today && !selected && (

                  <span className="absolute bottom-1 h-1 w-1 rounded-full bg-emerald-600" />

                )}

              </button>

            );

          }
        )}

      </div>

      {/* ==================================================
          SELECTED DATE
      =================================================== */}

      <div className="border-t border-gray-200 px-5 py-4">

        <div className="flex items-center justify-between">

          <div>

            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
              Selected date
            </p>

            <p className="mt-1 font-semibold text-gray-900">
              {selectedDate.toLocaleDateString(
                "en-KE",
                {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                }
              )}
            </p>

          </div>

          {loading && (

            <Loader2
              size={20}
              className="animate-spin text-emerald-600"
            />

          )}

        </div>

      </div>

      {/* ==================================================
          ERROR
      =================================================== */}

      {error && (

        <div className="mx-5 mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>

      )}

      {/* ==================================================
          AVAILABLE SLOTS
      =================================================== */}

      <div className="border-t border-gray-200 px-5 py-5">

        <div className="mb-4 flex items-center justify-between">

          <div>

            <h3 className="font-semibold text-gray-900">
              Available Times
            </h3>

            <p className="text-xs text-gray-500">
              Select a time for the property viewing
            </p>

          </div>

          <Clock
            size={18}
            className="text-gray-400"
          />

        </div>

        {slots.length === 0 && !loading && (

          <div className="rounded-xl bg-gray-50 px-4 py-6 text-center">

            <Clock
              size={25}
              className="mx-auto text-gray-300"
            />

            <p className="mt-2 text-sm font-medium text-gray-700">
              No available slots
            </p>

            <p className="mt-1 text-xs text-gray-500">
              Try selecting another date.
            </p>

          </div>

        )}

        {slots.length > 0 && (

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">

            {slots.map((slot) => {

              const slotId =
                slot?._id ||
                slot?.id;

              const selected =
                selectedSlot?._id === slotId ||
                selectedSlot?.id === slotId;

              const unavailable =
                slot?.available === false ||
                slot?.status === "booked" ||
                slot?.status === "reserved";

              return (

                <button
                  key={slotId}
                  type="button"
                  disabled={
                    unavailable
                  }
                  onClick={() =>
                    handleSlotSelect(slot)
                  }
                  className={`rounded-xl border px-3 py-3 text-sm font-medium transition ${
                    selected
                      ? "border-emerald-600 bg-emerald-50 text-emerald-700"
                      : unavailable
                        ? "cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400"
                        : "border-gray-200 text-gray-700 hover:border-emerald-400 hover:bg-emerald-50"
                  }`}
                >

                  <div className="flex items-center justify-center gap-2">

                    <Clock size={15} />

                    {formatSlotTime(
                      slot
                    )}

                  </div>

                  {selected && (

                    <CheckCircle2
                      size={15}
                      className="mx-auto mt-1 text-emerald-600"
                    />

                  )}

                </button>

              );

            })}

          </div>

        )}

      </div>

    </div>

  );

};

export default ViewingCalendar;