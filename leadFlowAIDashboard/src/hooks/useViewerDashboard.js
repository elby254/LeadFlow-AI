/**

* ==========================================================
*
* Viewer / Customer Dashboard Hook
*
* Responsibilities
* ---
* ✓ Load viewer dashboard summary
* ✓ Upcoming viewing count
* ✓ Today's viewing count
* ✓ Pending viewing requests
* ✓ Completed viewing count
* ✓ Saved property count
* ✓ Open conversation count
* ✓ Upcoming viewing records
* ✓ Recent conversations
* ✓ Refresh dashboard
* ✓ Loading / error / success state
*
* Architecture
* ---
*
* ViewerDashboard
* ```
    ↓
  ```
* useViewerDashboard
* ```
    ↓
  ```
* viewerDashboardService
* ```
    ↓
  ```
* /api/dashboard/viewer/summary
*
* ==========================================================
  */

import {
useCallback,
useEffect,
useState,
} from "react";

import viewerDashboardService from "../services/viewerDashboardService";

/* ==========================================================
HOOK
========================================================== */

const useViewerDashboard = () => {

/* ========================================================
STATE
======================================================== */

const [summary, setSummary] = useState({


upcomingViewings: 0,

todayViewings: 0,

pendingViewingRequests: 0,

completedViewings: 0,

savedProperties: 0,

openConversations: 0,


});

const [upcomingViewings, setUpcomingViewings] =
useState([]);

const [recentConversations, setRecentConversations] =
useState([]);

const [recentProperties, setRecentProperties] =
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
LOAD DASHBOARD SUMMARY
======================================================== */

const loadSummary = useCallback(async () => {


try {

  const response =
    await viewerDashboardService.getSummary();

  /*
   * Service returns:
   *
   * {
   *   data: {...}
   * }
   *
   * Keep the hook tolerant of either
   * Axios-style or direct service responses.
   */

  const data =
    response?.data ??
    response ??
    {};

  setSummary({

    upcomingViewings:
      data.upcomingViewings ??
      data.upcoming ??
      0,

    todayViewings:
      data.todayViewings ??
      data.todayViewingCount ??
      0,

    pendingViewingRequests:
      data.pendingViewingRequests ??
      data.pendingRequests ??
      0,

    completedViewings:
      data.completedViewings ??
      data.completed ??
      0,

    savedProperties:
      data.savedProperties ??
      data.savedListings ??
      0,

    openConversations:
      data.openConversations ??
      data.activeConversations ??
      0,

  });

  return data;

} catch (err) {

  console.error(
    "Viewer dashboard summary error:",
    err
  );

  throw err;

}


}, []);

/* ========================================================
LOAD UPCOMING VIEWINGS
======================================================== */

const loadUpcomingViewings =
useCallback(async () => {


  try {

    const response =
      await viewerDashboardService
        .getUpcomingViewings();

    const data =
      response?.data ??
      response ??
      [];

    setUpcomingViewings(
      Array.isArray(data)
        ? data
        : data?.viewings || []
    );

    return data;

  } catch (err) {

    console.error(
      "Upcoming viewer viewings error:",
      err
    );

    throw err;

  }

}, []);


/* ========================================================
LOAD RECENT CONVERSATIONS
======================================================== */

const loadRecentConversations =
useCallback(async () => {


  try {

    const response =
      await viewerDashboardService
        .getRecentConversations();

    const data =
      response?.data ??
      response ??
      [];

    setRecentConversations(
      Array.isArray(data)
        ? data
        : data?.conversations || []
    );

    return data;

  } catch (err) {

    console.error(
      "Viewer conversations error:",
      err
    );

    throw err;

  }

}, []);


/* ========================================================
LOAD RECENT / INTERESTED PROPERTIES
======================================================== */

const loadRecentProperties =
useCallback(async () => {


  try {

    /*
     * This endpoint can represent the viewer's
     * recently viewed / saved / interested properties.
     */

    const response =
      await viewerDashboardService
        .getRecentProperties();

    const data =
      response?.data ??
      response ??
      [];

    setRecentProperties(
      Array.isArray(data)
        ? data
        : data?.properties || []
    );

    return data;

  } catch (err) {

    console.error(
      "Viewer properties error:",
      err
    );

    throw err;

  }

}, []);


/* ========================================================
LOAD COMPLETE DASHBOARD
======================================================== */

const loadDashboard =
useCallback(async () => {


  try {

    setLoading(true);

    clearMessages();

    /*
     * Load the dashboard sections together.
     *
     * Promise.allSettled prevents one optional
     * dashboard section from breaking the entire
     * viewer dashboard.
     */

    const results =
      await Promise.allSettled([

        loadSummary(),

        loadUpcomingViewings(),

        loadRecentConversations(),

        loadRecentProperties(),

      ]);

    const failedRequests =
      results.filter(
        (result) =>
          result.status === "rejected"
      );

    if (failedRequests.length > 0) {

      /*
       * Summary is the most important section.
       *
       * If summary fails, report a dashboard error.
       */

      if (
        results[0]?.status ===
        "rejected"
      ) {

        throw (
          results[0].reason ||
          new Error(
            "Unable to load viewer dashboard."
          )
        );

      }

      /*
       * Optional sections failed.
       * Keep the dashboard usable but report
       * a non-blocking warning.
       */

      setError(
        "Some dashboard information could not be loaded."
      );

    }

    else {

      setSuccess(
        "Dashboard updated."
      );

    }

  } catch (err) {

    console.error(
      "Viewer dashboard error:",
      err
    );

    setError(
      err?.response?.data?.message ||
      err?.message ||
      "Unable to load your dashboard."
    );

  } finally {

    setLoading(false);

  }

}, [

  clearMessages,

  loadSummary,

  loadUpcomingViewings,

  loadRecentConversations,

  loadRecentProperties,

]);


/* ========================================================
REFRESH DASHBOARD
======================================================== */

const refreshDashboard =
useCallback(async () => {


  await loadDashboard();

}, [loadDashboard]);


/* ========================================================
INITIAL LOAD
======================================================== */

useEffect(() => {


loadDashboard();


}, [loadDashboard]);

/* ========================================================
RETURN
======================================================== */

return {


/* ======================================================
   DASHBOARD SUMMARY
====================================================== */

summary,

/* ======================================================
   DASHBOARD DATA
====================================================== */

upcomingViewings,

recentConversations,

recentProperties,

/* ======================================================
   STATUS
====================================================== */

loading,

error,

success,

/* ======================================================
   ACTIONS
====================================================== */

loadDashboard,

loadSummary,

loadUpcomingViewings,

loadRecentConversations,

loadRecentProperties,

refreshDashboard,

/* ======================================================
   UTILITIES
====================================================== */

clearMessages,


};

};

export default useViewerDashboard;
