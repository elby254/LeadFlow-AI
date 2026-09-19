/**
 * ==========================================================
 *
 * LeadFlow AI Viewing Calendar Hook
 *
 * Responsibilities
 * ----------------------------------------------------------
 * ✓ Calendar UI state
 * ✓ Selected viewing date
 * ✓ Selected time slot
 * ✓ Calendar viewing data
 * ✓ Available viewing slots
 * ✓ Loading / error / success state
 * ✓ Calendar navigation
 *
 * Architecture
 * ----------------------------------------------------------
 * viewingService
 *   → viewing records
 *   → upcoming viewings
 *   → today's viewings
 *   → availability
 *
 * calendarService
 *   → Google Calendar
 *   → Outlook Calendar
 *   → ICS generation
 *   → reminders
 *
 * ==========================================================
 */

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import viewingService from "../services/viewingService";

/* ==========================================================
   HOOK
========================================================== */

const useViewingCalendar = () => {

  /* ========================================================
     STATE
  ======================================================== */

  const [calendar, setCalendar] =
    useState([]);

  const [selectedDate, setSelectedDate] =
    useState(new Date());

  const [selectedSlot, setSelectedSlot] =
    useState(null);

  const [availableSlots, setAvailableSlots] =
    useState([]);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState(null);

  const [success, setSuccess] =
    useState("");

  /* ========================================================
     CLEAR MESSAGES
  ======================================================== */

  const clearMessages = useCallback(() => {

    setError(null);

    setSuccess("");

  }, []);

  /* ========================================================
     CURRENT MONTH
  ======================================================== */

  const currentMonth = useMemo(() => {

    return selectedDate.toLocaleString(
      "en-US",
      {
        month: "long",
        year: "numeric",
      }
    );

  }, [selectedDate]);

  /* ========================================================
     SELECT DATE
  ======================================================== */

  const selectDate = useCallback((date) => {

    if (!date) return;

    setSelectedDate(
      new Date(date)
    );

    setSelectedSlot(null);

  }, []);

  /* ========================================================
     SELECT TIME SLOT
  ======================================================== */

  const selectSlot = useCallback((slot) => {

    setSelectedSlot(slot);

  }, []);

  /* ========================================================
     SET SUCCESS MESSAGE
  ======================================================== */

  const showSuccess = useCallback((message) => {

    setSuccess(message);

    setError(null);

  }, []);

  /* ========================================================
     SET ERROR MESSAGE
  ======================================================== */

  const showError = useCallback((message) => {

    setError(message);

    setSuccess("");

  }, []);

  /* ========================================================
     RETURN
  ======================================================== */

  return {
    calendar,
    setCalendar,

    selectedDate,
    setSelectedDate,
    selectDate,

    selectedSlot,
    setSelectedSlot,
    selectSlot,

    availableSlots,
    setAvailableSlots,

    loading,
    setLoading,

    error,
    success,

    currentMonth,

    clearMessages,
    showSuccess,
    showError,
  };

};

export default useViewingCalendar;