/**
 * ==========================================================
 * Viewing Availability Hook
 * ==========================================================
 *
 * RESPONSIBILITY
 * ----------------------------------------------------------
 * This hook manages:
 *
 * ✓ Agent availability
 * ✓ Available viewing slots
 * ✓ Selected agent
 * ✓ Selected date
 * ✓ Selected time slot
 * ✓ Viewing conflict checks
 * ✓ Loading state
 * ✓ Error state
 * ✓ Success state
 *
 * BUSINESS WORKFLOW
 * ----------------------------------------------------------
 *
 * useViewingAvailability
 *        ↓
 * Check available slots
 *        ↓
 * Check conflicts
 *        ↓
 * useViewings
 *        ↓
 * Request Viewing
 *        ↓
 * Agent Approval
 *
 * ==========================================================
 *
 * IMPORTANT
 * ----------------------------------------------------------
 * This hook does NOT:
 *
 * ✗ Approve viewings
 * ✗ Reject viewings
 * ✗ Cancel viewings
 * ✗ Complete viewings
 * ✗ Submit viewing feedback
 *
 * Those actions belong to useViewings().
 *
 * ==========================================================
 */

import {
  useCallback,
  useState,
} from "react";

import viewingService from "../services/viewingService";

/* ==========================================================
   HOOK
========================================================== */

const useViewingAvailability = () => {

  /* ========================================================
     STATE
  ======================================================== */

  const [availability, setAvailability] =
    useState([]);

  const [selectedAgent, setSelectedAgent] =
    useState(null);

  const [selectedDate, setSelectedDate] =
    useState(new Date());

  const [selectedSlot, setSelectedSlot] =
    useState(null);

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
     LOAD AVAILABILITY
  ======================================================== */

  const loadAvailability = useCallback(
    async (agentId, date = selectedDate) => {

      if (!agentId) {

        setAvailability([]);

        return [];

      }

      try {

        setLoading(true);

        clearMessages();

        /*
         * Availability belongs to the viewing
         * scheduling layer.
         */

        const response =
          await viewingService.getAvailableSlots(
            agentId,
            date
          );

        const slots =
          response?.data || [];

        setAvailability(slots);

        return slots;

      } catch (err) {

        console.error(
          "LOAD VIEWING AVAILABILITY ERROR:",
          err
        );

        setError(
          err?.response?.data?.message ||
          "Unable to load viewing availability."
        );

        setAvailability([]);

        return [];

      } finally {

        setLoading(false);

      }

    },
    [
      selectedDate,
      clearMessages,
    ]
  );

  /* ========================================================
     CHECK VIEWING CONFLICT
  ======================================================== */

  const checkConflict = useCallback(
    async (payload) => {

      if (!payload) {

        setError(
          "Viewing schedule information is required."
        );

        return null;

      }

      try {

        setLoading(true);

        clearMessages();

        const response =
          await viewingService.checkViewingConflict(
            payload
          );

        return response?.data || null;

      } catch (err) {

        console.error(
          "CHECK VIEWING CONFLICT ERROR:",
          err
        );

        setError(
          err?.response?.data?.message ||
          "Unable to check viewing schedule."
        );

        return null;

      } finally {

        setLoading(false);

      }

    },
    [clearMessages]
  );

  /* ========================================================
     SELECT AGENT
  ======================================================== */

  const selectAgent = useCallback((agent) => {

    setSelectedAgent(agent);

    /*
     * Changing the agent invalidates
     * the previously selected slot.
     */

    setSelectedSlot(null);

    setAvailability([]);

  }, []);

  /* ========================================================
     SELECT DATE
  ======================================================== */

  const selectDate = useCallback((date) => {

    if (!date) return;

    setSelectedDate(
      new Date(date)
    );

    /*
     * A slot belongs to a specific date.
     */

    setSelectedSlot(null);

  }, []);

  /* ========================================================
     SELECT SLOT
  ======================================================== */

  const selectSlot = useCallback((slot) => {

    setSelectedSlot(slot);

  }, []);

  /* ========================================================
     CLEAR SELECTED SLOT
  ======================================================== */

  const clearSelectedSlot = useCallback(() => {

    setSelectedSlot(null);

  }, []);

  /* ========================================================
     REFRESH AVAILABILITY
  ======================================================== */

  const refreshAvailability = useCallback(
    async () => {

      if (!selectedAgent) {

        setAvailability([]);

        return [];

      }

      return loadAvailability(
        selectedAgent?._id ||
        selectedAgent,
        selectedDate
      );

    },
    [
      selectedAgent,
      selectedDate,
      loadAvailability,
    ]
  );

  /* ========================================================
     RETURN
  ======================================================== */

  return {

    /* ------------------------------------------------------
       STATE
    ------------------------------------------------------ */

    availability,

    selectedAgent,

    selectedDate,

    selectedSlot,

    loading,

    error,

    success,

    /* ------------------------------------------------------
       AVAILABILITY
    ------------------------------------------------------ */

    loadAvailability,

    refreshAvailability,

    /* ------------------------------------------------------
       CONFLICT CHECKING
    ------------------------------------------------------ */

    checkConflict,

    /* ------------------------------------------------------
       SELECTION
    ------------------------------------------------------ */

    selectAgent,

    selectDate,

    selectSlot,

    clearSelectedSlot,

    /* ------------------------------------------------------
       DIRECT SETTERS
    ------------------------------------------------------ */

    setAvailability,

    setSelectedAgent,

    setSelectedDate,

    setSelectedSlot,

    /* ------------------------------------------------------
       STATUS
    ------------------------------------------------------ */

    clearMessages,

  };

};

/* ==========================================================
   EXPORT
========================================================== */

export default useViewingAvailability;