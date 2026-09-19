// ======================================================
//
// Responsibilities
// ------------------------------------------------------
// ✓ Load all viewings
// ✓ Refresh viewing data
// ✓ Create viewing requests
// ✓ Approve viewing requests
// ✓ Reject viewing requests
// ✓ Maintain selected viewing
// ✓ Maintain loading/error/success state
//
// Workflow
// ------------------------------------------------------
//
// viewingService
//       ↓
// useViewings
//       ↓
// ViewingContext
//       ↓
// AdminViewings
//
// ======================================================

import { useCallback, useState } from "react";

import viewingService from "../services/viewingService";

// ======================================================
// HOOK
// ======================================================

const useViewings = () => {
  // ====================================================
  // STATE
  // ====================================================

  const [viewings, setViewings] = useState([]);

  const [selectedViewing, setSelectedViewing] =
    useState(null);

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState(null);

  const [success, setSuccess] = useState("");

  // ====================================================
  // CLEAR MESSAGES
  // ====================================================

  const clearMessages = useCallback(() => {
    setError(null);
    setSuccess("");
  }, []);

  // ====================================================
  // GET ALL VIEWINGS
  // ====================================================
  //
  // This is the function consumed by AdminViewings:
  //
  // const { getViewings } = useViewingContext();
  //
  // useEffect(() => {
  //   getViewings();
  // }, [getViewings]);
  //
  // The actual API request is handled by:
  //
  // viewingService.getAllViewings()
  //
  // ====================================================

  const getViewings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response =
        await viewingService.getAllViewings();

      // ------------------------------------------------
      // Normalize API response
      // ------------------------------------------------
      //
      // Expected:
      //
      // {
      //   data: [...]
      // }
      //
      // ------------------------------------------------

      const data = Array.isArray(response?.data)
        ? response.data
        : [];

      setViewings(data);

      return data;
    } catch (err) {
      console.error(
        "Error loading viewings:",
        err
      );

      setError(
        err?.response?.data?.message ||
        "Unable to load viewings."
      );

      setViewings([]);

      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // ====================================================
  // LOAD ALL VIEWINGS
  // ====================================================
  //
  // Kept as a compatibility alias.
  //
  // Existing components can still call:
  //
  // loadAllViewings()
  //
  // ====================================================

  const loadAllViewings = useCallback(
    async () => {
      return await getViewings();
    },
    [getViewings]
  );

  // ====================================================
  // REFRESH VIEWINGS
  // ====================================================
  //
  // Used by buttons such as:
  //
  // <button onClick={refreshViewings}>
  //   Refresh Dashboard
  // </button>
  //
  // ====================================================

  const refreshViewings = useCallback(
    async () => {
      return await getViewings();
    },
    [getViewings]
  );

  // ====================================================
  // REQUEST VIEWING
  // ====================================================

  const requestViewing = useCallback(
    async (payload) => {
      try {
        setLoading(true);
        clearMessages();

        const response =
          await viewingService.createViewing(
            payload
          );

        // ------------------------------------------------
        // Store newly created viewing
        // ------------------------------------------------

        if (response?.data) {
          setSelectedViewing(response.data);
        }

        setSuccess(
          "Viewing request submitted successfully."
        );

        // ------------------------------------------------
        // Refresh viewing list
        // ------------------------------------------------

        await getViewings();

        return response;
      } catch (err) {
        console.error(
          "Error requesting viewing:",
          err
        );

        setError(
          err?.response?.data?.message ||
          "Unable to request viewing."
        );

        throw err;
      } finally {
        setLoading(false);
      }
    },
    [clearMessages, getViewings]
  );

  // ====================================================
  // APPROVE VIEWING
  // ====================================================

  const approveViewing = useCallback(
    async (id) => {
      try {
        setLoading(true);
        clearMessages();

        await viewingService.approveViewing(id);

        setSuccess(
          "Viewing approved successfully."
        );

        await getViewings();
      } catch (err) {
        console.error(
          "Error approving viewing:",
          err
        );

        setError(
          err?.response?.data?.message ||
          "Unable to approve viewing."
        );

        throw err;
      } finally {
        setLoading(false);
      }
    },
    [clearMessages, getViewings]
  );

  // ====================================================
  // REJECT VIEWING
  // ====================================================

  const rejectViewing = useCallback(
    async (id, payload = {}) => {
      try {
        setLoading(true);
        clearMessages();

        await viewingService.rejectViewing(
          id,
          payload
        );

        setSuccess(
          "Viewing rejected successfully."
        );

        await getViewings();
      } catch (err) {
        console.error(
          "Error rejecting viewing:",
          err
        );

        setError(
          err?.response?.data?.message ||
          "Unable to reject viewing."
        );

        throw err;
      } finally {
        setLoading(false);
      }
    },
    [clearMessages, getViewings]
  );

  // ====================================================
  // CANCEL VIEWING
  // ====================================================

  const cancelViewing = useCallback(
    async (id, payload = {}) => {
      try {
        setLoading(true);
        clearMessages();

        if (
          typeof viewingService.cancelViewing !==
          "function"
        ) {
          throw new Error(
            "cancelViewing is not implemented in viewingService."
          );
        }

        await viewingService.cancelViewing(
          id,
          payload
        );

        setSuccess(
          "Viewing cancelled successfully."
        );

        await getViewings();
      } catch (err) {
        console.error(
          "Error cancelling viewing:",
          err
        );

        setError(
          err?.response?.data?.message ||
          err?.message ||
          "Unable to cancel viewing."
        );

        throw err;
      } finally {
        setLoading(false);
      }
    },
    [clearMessages, getViewings]
  );

  // ====================================================
  // RESCHEDULE VIEWING
  // ====================================================

  const rescheduleViewing = useCallback(
    async (id, payload = {}) => {
      try {
        setLoading(true);
        clearMessages();

        if (
          typeof viewingService.rescheduleViewing !==
          "function"
        ) {
          throw new Error(
            "rescheduleViewing is not implemented in viewingService."
          );
        }

        await viewingService.rescheduleViewing(
          id,
          payload
        );

        setSuccess(
          "Viewing rescheduled successfully."
        );

        await getViewings();
      } catch (err) {
        console.error(
          "Error rescheduling viewing:",
          err
        );

        setError(
          err?.response?.data?.message ||
          err?.message ||
          "Unable to reschedule viewing."
        );

        throw err;
      } finally {
        setLoading(false);
      }
    },
    [clearMessages, getViewings]
  );

  // ====================================================
  // COMPLETE VIEWING
  // ====================================================

  const completeViewing = useCallback(
    async (id, payload = {}) => {
      try {
        setLoading(true);
        clearMessages();

        if (
          typeof viewingService.completeViewing !==
          "function"
        ) {
          throw new Error(
            "completeViewing is not implemented in viewingService."
          );
        }

        await viewingService.completeViewing(
          id,
          payload
        );

        setSuccess(
          "Viewing marked as completed."
        );

        await getViewings();
      } catch (err) {
        console.error(
          "Error completing viewing:",
          err
        );

        setError(
          err?.response?.data?.message ||
          err?.message ||
          "Unable to complete viewing."
        );

        throw err;
      } finally {
        setLoading(false);
      }
    },
    [clearMessages, getViewings]
  );

  // ====================================================
  // SELECT VIEWING
  // ====================================================

  const selectViewing = useCallback(
    (viewing) => {
      setSelectedViewing(viewing || null);
    },
    []
  );

  // ====================================================
  // CLEAR SELECTED VIEWING
  // ====================================================

  const clearSelectedViewing = useCallback(
    () => {
      setSelectedViewing(null);
    },
    []
  );

  // ====================================================
  // RETURN
  // ====================================================

  return {
    // ==================================================
    // STATE
    // ==================================================

    viewings,

    selectedViewing,

    loading,

    error,

    success,

    // ==================================================
    // DATA LOADING
    // ==================================================

    getViewings,

    loadAllViewings,

    refreshViewings,

    // ==================================================
    // VIEWING WORKFLOW
    // ==================================================

    requestViewing,

    approveViewing,

    rejectViewing,

    cancelViewing,

    rescheduleViewing,

    completeViewing,

    // ==================================================
    // SELECTION
    // ==================================================

    selectViewing,

    clearSelectedViewing,

    setSelectedViewing,

    // ==================================================
    // HELPERS
    // ==================================================

    clearMessages,
  };
};

// ======================================================
// EXPORT
// ======================================================

export default useViewings;