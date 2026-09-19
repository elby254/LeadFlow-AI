/**
 * ==========================================================
 *
 * Viewing Reminder Management Hook
 *
 * Responsible for:
 * ----------------------------------------------------------
 * ✓ Load all reminders
 * ✓ Load single reminder
 * ✓ Load viewing reminders
 * ✓ Load upcoming reminders
 * ✓ Load today's reminders
 * ✓ Load failed reminders
 * ✓ Create reminder
 * ✓ Update reminder
 * ✓ Cancel reminder
 * ✓ Mark reminder as sent
 * ✓ Retry failed reminder
 * ✓ Schedule viewing reminders
 * ✓ Cancel all viewing reminders
 * ✓ Refresh reminder data
 *
 * ==========================================================
 */

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import viewingReminderService from "../services/viewingReminderService";


const useViewingReminder = () => {

  /* ========================================================
     STATE
  ======================================================== */

  const [reminders, setReminders] = useState([]);

  const [selectedReminder, setSelectedReminder] =
    useState(null);

  const [viewingReminders, setViewingReminders] =
    useState([]);

  const [upcomingReminders, setUpcomingReminders] =
    useState([]);

  const [todayReminders, setTodayReminders] =
    useState([]);

  const [failedReminders, setFailedReminders] =
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
     ERROR HANDLER
  ======================================================== */

  const getErrorMessage = (err, fallback) => {

    return (
      err?.response?.data?.message ||
      err?.response?.data?.error ||
      fallback
    );

  };


  /* ========================================================
     GET ALL REMINDERS
  ======================================================== */

  const getReminders = useCallback(
    async (filters = {}) => {

      try {

        setLoading(true);

        clearMessages();

        const response =
          await viewingReminderService.getReminders(
            filters
          );

        setReminders(
          response?.data || []
        );

        return response?.data || [];

      } catch (err) {

        console.error(
          "GET REMINDERS ERROR:",
          err
        );

        setError(
          getErrorMessage(
            err,
            "Unable to load reminders."
          )
        );

        return [];

      } finally {

        setLoading(false);

      }

    },
    [clearMessages]
  );


  /* ========================================================
     GET SINGLE REMINDER
  ======================================================== */

  const getReminder = useCallback(
    async (reminderId) => {

      if (!reminderId) {

        setError(
          "Reminder ID is required."
        );

        return null;

      }

      try {

        setLoading(true);

        clearMessages();

        const response =
          await viewingReminderService.getReminder(
            reminderId
          );

        setSelectedReminder(
          response?.data || null
        );

        return response?.data || null;

      } catch (err) {

        console.error(
          "GET REMINDER ERROR:",
          err
        );

        setError(
          getErrorMessage(
            err,
            "Unable to load reminder."
          )
        );

        return null;

      } finally {

        setLoading(false);

      }

    },
    [clearMessages]
  );


  /* ========================================================
     GET REMINDERS FOR VIEWING
  ======================================================== */

  const getViewingReminders = useCallback(
    async (viewingId) => {

      if (!viewingId) {

        setError(
          "Viewing ID is required."
        );

        return [];

      }

      try {

        setLoading(true);

        clearMessages();

        const response =
          await viewingReminderService
            .getViewingReminders(
              viewingId
            );

        const data =
          response?.data || [];

        setViewingReminders(data);

        return data;

      } catch (err) {

        console.error(
          "GET VIEWING REMINDERS ERROR:",
          err
        );

        setError(
          getErrorMessage(
            err,
            "Unable to load viewing reminders."
          )
        );

        return [];

      } finally {

        setLoading(false);

      }

    },
    [clearMessages]
  );


  /* ========================================================
     GET UPCOMING REMINDERS
  ======================================================== */

  const loadUpcomingReminders = useCallback(
    async (filters = {}) => {

      try {

        setLoading(true);

        clearMessages();

        const response =
          await viewingReminderService
            .getUpcomingReminders(
              filters
            );

        const data =
          response?.data || [];

        setUpcomingReminders(data);

        return data;

      } catch (err) {

        console.error(
          "GET UPCOMING REMINDERS ERROR:",
          err
        );

        setError(
          getErrorMessage(
            err,
            "Unable to load upcoming reminders."
          )
        );

        return [];

      } finally {

        setLoading(false);

      }

    },
    [clearMessages]
  );


  /* ========================================================
     GET TODAY'S REMINDERS
  ======================================================== */

  const loadTodayReminders = useCallback(
    async (filters = {}) => {

      try {

        setLoading(true);

        clearMessages();

        const response =
          await viewingReminderService
            .getTodayReminders(
              filters
            );

        const data =
          response?.data || [];

        setTodayReminders(data);

        return data;

      } catch (err) {

        console.error(
          "GET TODAY REMINDERS ERROR:",
          err
        );

        setError(
          getErrorMessage(
            err,
            "Unable to load today's reminders."
          )
        );

        return [];

      } finally {

        setLoading(false);

      }

    },
    [clearMessages]
  );


  /* ========================================================
     GET FAILED REMINDERS
  ======================================================== */

  const loadFailedReminders = useCallback(
    async (filters = {}) => {

      try {

        setLoading(true);

        clearMessages();

        const response =
          await viewingReminderService
            .getFailedReminders(
              filters
            );

        const data =
          response?.data || [];

        setFailedReminders(data);

        return data;

      } catch (err) {

        console.error(
          "GET FAILED REMINDERS ERROR:",
          err
        );

        setError(
          getErrorMessage(
            err,
            "Unable to load failed reminders."
          )
        );

        return [];

      } finally {

        setLoading(false);

      }

    },
    [clearMessages]
  );


  /* ========================================================
     CREATE REMINDER
  ======================================================== */

  const createReminder = useCallback(
    async (payload) => {

      try {

        setLoading(true);

        clearMessages();

        const response =
          await viewingReminderService
            .createReminder(
              payload
            );

        const reminder =
          response?.data;

        if (reminder) {

          setReminders((prev) => [
            reminder,
            ...prev,
          ]);

        }

        setSuccess(
          "Reminder scheduled successfully."
        );

        return reminder || null;

      } catch (err) {

        console.error(
          "CREATE REMINDER ERROR:",
          err
        );

        setError(
          getErrorMessage(
            err,
            "Unable to schedule reminder."
          )
        );

        return null;

      } finally {

        setLoading(false);

      }

    },
    [clearMessages]
  );


  /* ========================================================
     UPDATE REMINDER
  ======================================================== */

  const updateReminder = useCallback(
    async (
      reminderId,
      payload
    ) => {

      if (!reminderId) {

        setError(
          "Reminder ID is required."
        );

        return null;

      }

      try {

        setLoading(true);

        clearMessages();

        const response =
          await viewingReminderService
            .updateReminder(
              reminderId,
              payload
            );

        const updatedReminder =
          response?.data;

        if (updatedReminder) {

          setReminders((prev) =>
            prev.map((reminder) =>
              reminder._id === reminderId
                ? updatedReminder
                : reminder
            )
          );

          setViewingReminders((prev) =>
            prev.map((reminder) =>
              reminder._id === reminderId
                ? updatedReminder
                : reminder
            )
          );

          setUpcomingReminders((prev) =>
            prev.map((reminder) =>
              reminder._id === reminderId
                ? updatedReminder
                : reminder
            )
          );

          setTodayReminders((prev) =>
            prev.map((reminder) =>
              reminder._id === reminderId
                ? updatedReminder
                : reminder
            )
          );

          setFailedReminders((prev) =>
            prev.map((reminder) =>
              reminder._id === reminderId
                ? updatedReminder
                : reminder
            )
          );

          if (
            selectedReminder?._id === reminderId
          ) {

            setSelectedReminder(
              updatedReminder
            );

          }

        }

        setSuccess(
          "Reminder updated successfully."
        );

        return updatedReminder || null;

      } catch (err) {

        console.error(
          "UPDATE REMINDER ERROR:",
          err
        );

        setError(
          getErrorMessage(
            err,
            "Unable to update reminder."
          )
        );

        return null;

      } finally {

        setLoading(false);

      }

    },
    [
      clearMessages,
      selectedReminder,
    ]
  );


  /* ========================================================
     CANCEL REMINDER
  ======================================================== */

  const cancelReminder = useCallback(
    async (reminderId) => {

      if (!reminderId) {

        setError(
          "Reminder ID is required."
        );

        return false;

      }

      try {

        setLoading(true);

        clearMessages();

        const response =
          await viewingReminderService
            .cancelReminder(
              reminderId
            );

        const cancelledReminder =
          response?.data;

        setReminders((prev) =>
          prev.map((reminder) =>
            reminder._id === reminderId
              ? cancelledReminder || {
                  ...reminder,
                  status: "Cancelled",
                }
              : reminder
          )
        );

        setUpcomingReminders((prev) =>
          prev.filter(
            (reminder) =>
              reminder._id !== reminderId
          )
        );

        setTodayReminders((prev) =>
          prev.filter(
            (reminder) =>
              reminder._id !== reminderId
          )
        );

        if (
          selectedReminder?._id === reminderId
        ) {

          setSelectedReminder(
            cancelledReminder || {
              ...selectedReminder,
              status: "Cancelled",
            }
          );

        }

        setSuccess(
          "Reminder cancelled successfully."
        );

        return true;

      } catch (err) {

        console.error(
          "CANCEL REMINDER ERROR:",
          err
        );

        setError(
          getErrorMessage(
            err,
            "Unable to cancel reminder."
          )
        );

        return false;

      } finally {

        setLoading(false);

      }

    },
    [
      clearMessages,
      selectedReminder,
    ]
  );


  /* ========================================================
     MARK REMINDER AS SENT
  ======================================================== */

  const markReminderSent = useCallback(
    async (reminderId) => {

      if (!reminderId) {

        setError(
          "Reminder ID is required."
        );

        return null;

      }

      try {

        setLoading(true);

        clearMessages();

        const response =
          await viewingReminderService
            .markReminderSent(
              reminderId
            );

        const updatedReminder =
          response?.data;

        if (updatedReminder) {

          setReminders((prev) =>
            prev.map((reminder) =>
              reminder._id === reminderId
                ? updatedReminder
                : reminder
            )
          );

          setTodayReminders((prev) =>
            prev.map((reminder) =>
              reminder._id === reminderId
                ? updatedReminder
                : reminder
            )
          );

          setUpcomingReminders((prev) =>
            prev.map((reminder) =>
              reminder._id === reminderId
                ? updatedReminder
                : reminder
            )
          );

        }

        return updatedReminder || null;

      } catch (err) {

        console.error(
          "MARK REMINDER SENT ERROR:",
          err
        );

        setError(
          getErrorMessage(
            err,
            "Unable to mark reminder as sent."
          )
        );

        return null;

      } finally {

        setLoading(false);

      }

    },
    [clearMessages]
  );


  /* ========================================================
     RETRY FAILED REMINDER
  ======================================================== */

  const retryReminder = useCallback(
    async (reminderId) => {

      if (!reminderId) {

        setError(
          "Reminder ID is required."
        );

        return null;

      }

      try {

        setLoading(true);

        clearMessages();

        const response =
          await viewingReminderService
            .retryReminder(
              reminderId
            );

        const updatedReminder =
          response?.data;

        if (updatedReminder) {

          setReminders((prev) =>
            prev.map((reminder) =>
              reminder._id === reminderId
                ? updatedReminder
                : reminder
            )
          );

          setFailedReminders((prev) =>
            prev.filter(
              (reminder) =>
                reminder._id !== reminderId
            )
          );

        }

        setSuccess(
          "Reminder queued for retry."
        );

        return updatedReminder || null;

      } catch (err) {

        console.error(
          "RETRY REMINDER ERROR:",
          err
        );

        setError(
          getErrorMessage(
            err,
            "Unable to retry reminder."
          )
        );

        return null;

      } finally {

        setLoading(false);

      }

    },
    [clearMessages]
  );


  /* ========================================================
     SCHEDULE VIEWING REMINDERS
  ======================================================== */

  const scheduleViewingReminders = useCallback(
    async (
      viewingId,
      payload = {}
    ) => {

      if (!viewingId) {

        setError(
          "Viewing ID is required."
        );

        return null;

      }

      try {

        setLoading(true);

        clearMessages();

        const response =
          await viewingReminderService
            .scheduleViewingReminders(
              viewingId,
              payload
            );

        const data =
          response?.data || [];

        /*
         * Backend may return either:
         *
         * {
         *   data: [...]
         * }
         *
         * or:
         *
         * {
         *   data: {
         *     reminders: [...]
         *   }
         * }
         */

        const createdReminders =
          Array.isArray(data)
            ? data
            : data?.reminders || [];

        if (createdReminders.length) {

          setReminders((prev) => [
            ...createdReminders,
            ...prev,
          ]);

          setViewingReminders(
            createdReminders
          );

        }

        setSuccess(
          "Viewing reminders scheduled successfully."
        );

        return data;

      } catch (err) {

        console.error(
          "SCHEDULE VIEWING REMINDERS ERROR:",
          err
        );

        setError(
          getErrorMessage(
            err,
            "Unable to schedule viewing reminders."
          )
        );

        return null;

      } finally {

        setLoading(false);

      }

    },
    [clearMessages]
  );


  /* ========================================================
     CANCEL ALL VIEWING REMINDERS
  ======================================================== */

  const cancelViewingReminders = useCallback(
    async (viewingId) => {

      if (!viewingId) {

        setError(
          "Viewing ID is required."
        );

        return false;

      }

      try {

        setLoading(true);

        clearMessages();

        await viewingReminderService
          .cancelViewingReminders(
            viewingId
          );

        setViewingReminders((prev) =>
          prev.map((reminder) => ({
            ...reminder,
            status: "Cancelled",
          }))
        );

        setUpcomingReminders((prev) =>
          prev.filter(
            (reminder) =>
              reminder.viewing?._id !== viewingId &&
              reminder.viewingId !== viewingId
          )
        );

        setTodayReminders((prev) =>
          prev.filter(
            (reminder) =>
              reminder.viewing?._id !== viewingId &&
              reminder.viewingId !== viewingId
          )
        );

        setSuccess(
          "Viewing reminders cancelled successfully."
        );

        return true;

      } catch (err) {

        console.error(
          "CANCEL VIEWING REMINDERS ERROR:",
          err
        );

        setError(
          getErrorMessage(
            err,
            "Unable to cancel viewing reminders."
          )
        );

        return false;

      } finally {

        setLoading(false);

      }

    },
    [clearMessages]
  );


  /* ========================================================
     REFRESH ALL REMINDER DATA
  ======================================================== */

  const refreshReminders = useCallback(
    async () => {

      await Promise.all([
        getReminders(),
        loadUpcomingReminders(),
        loadTodayReminders(),
        loadFailedReminders(),
      ]);

    },
    [
      getReminders,
      loadUpcomingReminders,
      loadTodayReminders,
      loadFailedReminders,
    ]
  );


  /* ========================================================
     INITIAL LOAD
  ======================================================== */

  useEffect(() => {

    getReminders();

    loadUpcomingReminders();

    loadTodayReminders();

    loadFailedReminders();

  }, [
    getReminders,
    loadUpcomingReminders,
    loadTodayReminders,
    loadFailedReminders,
  ]);


  /* ========================================================
     RETURN
  ======================================================== */

  return {

    /* ------------------------------------------------------
       State
    ------------------------------------------------------ */

    reminders,

    selectedReminder,

    viewingReminders,

    upcomingReminders,

    todayReminders,

    failedReminders,

    loading,

    error,

    success,


    /* ------------------------------------------------------
       Retrieval
    ------------------------------------------------------ */

    getReminders,

    getReminder,

    getViewingReminders,

    loadUpcomingReminders,

    loadTodayReminders,

    loadFailedReminders,


    /* ------------------------------------------------------
       CRUD
    ------------------------------------------------------ */

    createReminder,

    updateReminder,

    cancelReminder,


    /* ------------------------------------------------------
       Delivery
    ------------------------------------------------------ */

    markReminderSent,

    retryReminder,


    /* ------------------------------------------------------
       Viewing Workflow
    ------------------------------------------------------ */

    scheduleViewingReminders,

    cancelViewingReminders,


    /* ------------------------------------------------------
       Utilities
    ------------------------------------------------------ */

    refreshReminders,

    clearMessages,

    setSelectedReminder,

  };

};


/* ==========================================================
   DEFAULT EXPORT
========================================================== */

export default useViewingReminder;