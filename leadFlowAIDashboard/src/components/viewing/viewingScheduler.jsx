/**
 * ==========================================================
 *
 * Property Viewing Scheduler
 *
 * Location
 * ----------------------------------------------------------
 * src/components/viewing/ViewingScheduler.jsx
 *
 * Responsibilities
 * ----------------------------------------------------------
 * ✓ Select viewing date
 * ✓ Load agent availability
 * ✓ Display available time slots
 * ✓ Select time slot
 * ✓ Validate selected slot
 * ✓ Request property viewing
 * ✓ Display loading/error/success states
 *
 * Workflow
 * ----------------------------------------------------------
 *
 * Select date
 *      ↓
 * Load availability
 *      ↓
 * Select slot
 *      ↓
 * Validate slot
 *      ↓
 * Request viewing
 *
 * Hooks Used
 * ----------------------------------------------------------
 * ✓ useViewingCalendar()
 * ✓ useViewingAvailability()
 * ✓ useViewings()
 *
 * ==========================================================
 */

import { useEffect, useState } from "react";

import useViewingCalendar from "../../hooks/useViewingCalendar";
import useViewingAvailability from "../../hooks/useViewingAvailability";
import useViewings from "../../hooks/useViewings";

/* ==========================================================
   COMPONENT
========================================================== */

const ViewingScheduler = ({
  customer,
  property,
  agentId,
  onSuccess,
  onCancel,
}) => {

  /* ========================================================
     LOCAL FORM STATE
  ======================================================== */

  const [selectedDate, setSelectedDate] =
    useState(new Date());

  const [selectedSlot, setSelectedSlot] =
    useState(null);

  const [validating, setValidating] =
    useState(false);

  const [booking, setBooking] =
    useState(false);

  const [validationMessage, setValidationMessage] =
    useState("");

  /* ========================================================
     VIEWING CALENDAR HOOK
  ======================================================== */

  const {
    availableSlots: calendarSlots,
    loadAvailableSlots,
    loading: calendarLoading,
    error: calendarError,
  } = useViewingCalendar();

  /* ========================================================
     AVAILABILITY HOOK
  ======================================================== */

  const {
    availability,
    selectedAgent,
    selectedSlot: availabilitySlot,
    loading: availabilityLoading,
    error: availabilityError,
    loadAvailability,
    validateSlot,
    setSelectedAgent,
    setSelectedDate:
      setAvailabilityDate,
    setSelectedSlot:
      setAvailabilitySlot,
  } = useViewingAvailability();

  /* ========================================================
     VIEWINGS HOOK
  ======================================================== */

  const {
    requestViewing,
    loading: viewingLoading,
    error: viewingError,
    success: viewingSuccess,
  } = useViewings();

  /* ========================================================
     SYNC AGENT
  ======================================================== */

  useEffect(() => {

    if (!agentId) return;

    setSelectedAgent(agentId);

  }, [
    agentId,
    setSelectedAgent,
  ]);

  /* ========================================================
     SYNC DATE
  ======================================================== */

  useEffect(() => {

    setAvailabilityDate(selectedDate);

  }, [
    selectedDate,
    setAvailabilityDate,
  ]);

  /* ========================================================
     LOAD AVAILABILITY
  ======================================================== */

  useEffect(() => {

    if (!agentId) return;

    loadAvailability(
      agentId,
      selectedDate
    );

  }, [
    agentId,
    selectedDate,
    loadAvailability,
  ]);

  /* ========================================================
     LOAD CALENDAR SLOTS
  ======================================================== */

  useEffect(() => {

    loadAvailableSlots(
      selectedDate
    );

  }, [
    selectedDate,
    loadAvailableSlots,
  ]);

  /* ========================================================
     MERGE SLOT SOURCES
  ======================================================== */

  const slots =
    availability?.length
      ? availability
      : calendarSlots || [];

  /* ========================================================
     SELECT DATE
  ======================================================== */

  const handleDateChange = (event) => {

    const value =
      event.target.value;

    if (!value) return;

    const date =
      new Date(`${value}T00:00:00`);

    setSelectedDate(date);

    setSelectedSlot(null);

    setValidationMessage("");

    setAvailabilitySlot(null);

  };

  /* ========================================================
     SELECT SLOT
  ======================================================== */

  const handleSlotSelect = (slot) => {

    setSelectedSlot(slot);

    setAvailabilitySlot(slot);

    setValidationMessage("");

  };

  /* ========================================================
     VALIDATE SLOT
  ======================================================== */

  const handleValidateSlot = async () => {

    if (!selectedSlot) {

      setValidationMessage(
        "Please select a time slot."
      );

      return false;

    }

    const slotId =
      selectedSlot._id ||
      selectedSlot.id ||
      selectedSlot.slotId;

    if (!slotId) {

      setValidationMessage(
        "This time slot cannot be validated."
      );

      return false;

    }

    try {

      setValidating(true);

      setValidationMessage("");

      const result =
        await validateSlot(slotId);

      if (!result) {

        setValidationMessage(
          "This time slot is no longer available."
        );

        return false;

      }

      setValidationMessage(
        "Time slot is available."
      );

      return true;

    } finally {

      setValidating(false);

    }

  };

  /* ========================================================
     REQUEST VIEWING
  ======================================================== */

  const handleRequestViewing = async () => {

    if (!customer) {

      setValidationMessage(
        "Customer information is required."
      );

      return;

    }

    if (!property) {

      setValidationMessage(
        "Property information is required."
      );

      return;

    }

    if (!agentId) {

      setValidationMessage(
        "Please assign an agent before scheduling."
      );

      return;

    }

    if (!selectedSlot) {

      setValidationMessage(
        "Please select a time slot."
      );

      return;

    }

    /* ------------------------------------------------------
       VALIDATE SLOT BEFORE BOOKING
    ------------------------------------------------------ */

    const valid =
      await handleValidateSlot();

    if (!valid) return;

    /* ------------------------------------------------------
       EXTRACT SLOT INFORMATION
    ------------------------------------------------------ */

    const startTime =
      selectedSlot.startTime ||
      selectedSlot.start ||
      selectedSlot.startsAt;

    const endTime =
      selectedSlot.endTime ||
      selectedSlot.end ||
      selectedSlot.endsAt;

    /* ------------------------------------------------------
       REQUEST PAYLOAD
    ------------------------------------------------------ */

    const payload = {

      customerId:
        customer._id ||
        customer.id,

      propertyId:
        property._id ||
        property.id,

      agentId,

      date:
        selectedDate.toISOString(),

      slotId:
        selectedSlot._id ||
        selectedSlot.id ||
        selectedSlot.slotId,

      startTime,

      endTime,

      status: "requested",

    };

    try {

      setBooking(true);

      const result =
        await requestViewing(payload);

      if (!result) return;

      setValidationMessage("");

      onSuccess?.(result);

    } finally {

      setBooking(false);

    }

  };

  /* ========================================================
     LOADING STATE
  ======================================================== */

  const loading =
    calendarLoading ||
    availabilityLoading ||
    viewingLoading ||
    booking ||
    validating;

  /* ========================================================
     ERROR STATE
  ======================================================== */

  const error =
    calendarError ||
    availabilityError ||
    viewingError;

  /* ========================================================
     DATE DISPLAY VALUE
  ======================================================== */

  const dateValue =
    selectedDate
      .toISOString()
      .split("T")[0];

  /* ========================================================
     RENDER
  ======================================================== */

  return (
    <div className="rounded-2xl border bg-white p-6 shadow-sm">

      {/* ======================================================
          HEADER
      ====================================================== */}

      <div className="mb-6">

        <h2 className="text-xl font-bold text-gray-900">
          Schedule Property Viewing
        </h2>

        <p className="mt-1 text-sm text-gray-500">
          Select a date and available time for the property
          viewing.
        </p>

      </div>

      {/* ======================================================
          CUSTOMER / PROPERTY SUMMARY
      ====================================================== */}

      <div className="mb-6 grid gap-4 md:grid-cols-2">

        <div className="rounded-xl bg-gray-50 p-4">

          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Customer
          </p>

          <p className="mt-1 font-semibold text-gray-900">
            {customer?.name ||
              customer?.customerName ||
              "Customer"}
          </p>

        </div>

        <div className="rounded-xl bg-gray-50 p-4">

          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Property
          </p>

          <p className="mt-1 font-semibold text-gray-900">
            {property?.name ||
              property?.propertyName ||
              "Property"}
          </p>

        </div>

      </div>

      {/* ======================================================
          STEP 1 — DATE
      ====================================================== */}

      <section className="mb-6">

        <label
          htmlFor="viewing-date"
          className="mb-2 block text-sm font-semibold text-gray-800"
        >
          1. Select date
        </label>

        <input
          id="viewing-date"
          type="date"
          value={dateValue}
          min={
            new Date()
              .toISOString()
              .split("T")[0]
          }
          onChange={handleDateChange}
          className="
            w-full
            rounded-xl
            border
            px-4
            py-3
            text-sm
            outline-none
            focus:border-emerald-500
            focus:ring-2
            focus:ring-emerald-100
          "
        />

      </section>

      {/* ======================================================
          STEP 2 — AVAILABLE SLOTS
      ====================================================== */}

      <section className="mb-6">

        <div className="mb-3 flex items-center justify-between">

          <label className="text-sm font-semibold text-gray-800">
            2. Select available time
          </label>

          {loading && (
            <span className="text-xs text-gray-500">
              Loading...
            </span>
          )}

        </div>

        {slots.length === 0 && !loading && (

          <div className="rounded-xl border border-dashed p-5 text-center text-sm text-gray-500">
            No available viewing slots for this date.
          </div>

        )}

        {slots.length > 0 && (

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">

            {slots.map((slot) => {

              const slotId =
                slot._id ||
                slot.id ||
                slot.slotId;

              const isSelected =
                selectedSlot &&
                (
                  selectedSlot._id === slotId ||
                  selectedSlot.id === slotId ||
                  selectedSlot.slotId === slotId
                );

              const isUnavailable =
                slot.available === false ||
                slot.isAvailable === false ||
                slot.status === "booked" ||
                slot.status === "reserved";

              return (

                <button
                  key={slotId}
                  type="button"
                  disabled={isUnavailable}
                  onClick={() =>
                    handleSlotSelect(slot)
                  }
                  className={`
                    rounded-xl
                    border
                    px-3
                    py-3
                    text-sm
                    font-medium
                    transition
                    ${
                      isSelected
                        ? "border-emerald-600 bg-emerald-600 text-white"
                        : isUnavailable
                        ? "cursor-not-allowed bg-gray-100 text-gray-400"
                        : "hover:border-emerald-500 hover:bg-emerald-50"
                    }
                  `}
                >

                  {slot.label ||
                    slot.time ||
                    slot.startTime ||
                    "Available"}

                </button>

              );

            })}

          </div>

        )}

      </section>

      {/* ======================================================
          STEP 3 — VALIDATE
      ====================================================== */}

      <section className="mb-6">

        <button
          type="button"
          disabled={
            !selectedSlot ||
            loading
          }
          onClick={handleValidateSlot}
          className="
            w-full
            rounded-xl
            border
            border-emerald-600
            py-3
            font-semibold
            text-emerald-700
            transition
            hover:bg-emerald-50
            disabled:cursor-not-allowed
            disabled:opacity-50
          "
        >

          {validating
            ? "Checking availability..."
            : "Validate Selected Slot"}

        </button>

      </section>

      {/* ======================================================
          STATUS
      ====================================================== */}

      {(validationMessage || error) && (

        <div
          className={`
            mb-6
            rounded-xl
            p-4
            text-sm
            ${
              error
                ? "bg-red-50 text-red-700"
                : "bg-emerald-50 text-emerald-700"
            }
          `}
        >
          {error ||
            validationMessage}
        </div>

      )}

      {/* ======================================================
          SUCCESS
      ====================================================== */}

      {viewingSuccess && (

        <div className="mb-6 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-700">
          {viewingSuccess}
        </div>

      )}

      {/* ======================================================
          ACTIONS
      ====================================================== */}

      <div className="flex flex-col gap-3 sm:flex-row">

        <button
          type="button"
          onClick={() =>
            onCancel?.()
          }
          className="
            flex-1
            rounded-xl
            border
            py-3
            font-semibold
            text-gray-700
            hover:bg-gray-50
          "
        >
          Cancel
        </button>

        <button
          type="button"
          disabled={
            loading ||
            !selectedSlot
          }
          onClick={handleRequestViewing}
          className="
            flex-1
            rounded-xl
            bg-emerald-600
            py-3
            font-semibold
            text-white
            transition
            hover:bg-emerald-700
            disabled:cursor-not-allowed
            disabled:opacity-50
          "
        >

          {booking
            ? "Requesting viewing..."
            : "Request Viewing"}

        </button>

      </div>

    </div>
  );

};

export default ViewingScheduler;

