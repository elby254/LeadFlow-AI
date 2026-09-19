/**
 * ==========================================================
 *
 * Agent Dashboard Hook
 *
 * Responsibilities
 * ---
 * ✓ Agent dashboard summary
 * ✓ AUTHORITATIVE agent performance
 * ✓ Assigned lead metrics
 * ✓ Conversation metrics
 * ✓ Viewing metrics
 * ✓ Today's viewings
 * ✓ Upcoming viewings
 * ✓ Pending viewing requests
 * ✓ Follow-up queue
 * ✓ Hot leads
 * ✓ Recent conversations
 * ✓ Refresh dashboard
 * ✓ Loading / error / success state
 *
 * ==========================================================
 */

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import axiosClient from "../api/axiosClient";
import agentDashboardService from "../services/agentDashboardService";

/* ==========================================================
   DEFAULT PERFORMANCE
========================================================== */

const EMPTY_PERFORMANCE = {
  agent: {
    id: null,
    name: "",
  },

  assignedLeads: 0,
  activeLeads: 0,
  qualifiedLeads: 0,
  convertedLeads: 0,
  lostLeads: 0,

  totalFollowUps: 0,
  completedFollowUps: 0,
  pendingFollowUps: 0,
  overdueFollowUps: 0,

  totalViewings: 0,
  completedViewings: 0,
  upcomingViewings: 0,
  cancelledViewings: 0,

  callsMade: 0,
  messagesSent: 0,

  conversionRate: 0,
  followUpCompletionRate: 0,
  viewingCompletionRate: 0,

  recentActivity: [],
};

/* ==========================================================
   DEFAULT SUMMARY
========================================================== */

const EMPTY_SUMMARY = {
  totalLeads: 0,
  qualifiedLeads: 0,
  hotLeads: 0,
  closedLeads: 0,
  conversionRate: 0,

  activeConversations: 0,
  unreadConversations: 0,

  pendingViewingRequests: 0,
  todayViewings: 0,
  upcomingViewings: 0,
  completedViewings: 0,
  missedViewings: 0,

  pendingFollowUps: 0,

  viewingConversionRate: 0,
};

/* ==========================================================
   DEFAULT PIPELINE
========================================================== */

const EMPTY_PIPELINE = {
  total: 0,
  stages: [],
};

/* ==========================================================
   NUMBER HELPER
========================================================== */

const toNumber = (
  value,
  fallback = 0
) => {
  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : fallback;
};

/* ==========================================================
   PERCENTAGE HELPER
========================================================== */

const calculatePercentage = (
  numerator,
  denominator
) => {
  const top = toNumber(numerator);
  const bottom = toNumber(denominator);

  if (bottom <= 0) {
    return 0;
  }

  return Math.round(
    (top / bottom) * 100
  );
};

/* ==========================================================
   EXTRACT PERFORMANCE DATA
==========================================================

Supports all of these:

Axios response:
{
  data: {
    agent: {},
    leads: {},
    followUps: {},
    viewings: {},
    conversion: {},
    summary: {}
  }
}

Axios response wrapped in performance:
{
  data: {
    performance: {
      ...
    }
  }
}

Direct object:
{
  agent: {},
  leads: {},
  ...
}

========================================================== */

const extractPerformanceData = (
  response
) => {
  console.log(
    "[useAgentDashboard] Extracting performance response:",
    response
  );

  if (!response) {
    console.warn(
      "[useAgentDashboard] Performance response is empty."
    );

    return {};
  }

  /* ========================================================
     AXIOS RESPONSE
  ======================================================== */

  const axiosData =
    response?.data;

  console.log(
    "[useAgentDashboard] Axios performance data:",
    axiosData
  );

  if (
    axiosData &&
    typeof axiosData === "object" &&
    !Array.isArray(axiosData)
  ) {

    if (
      axiosData.performance &&
      typeof axiosData.performance === "object"
    ) {

      console.log(
        "[useAgentDashboard] Using response.data.performance"
      );

      return axiosData.performance;
    }

    console.log(
      "[useAgentDashboard] Using response.data directly"
    );

    return axiosData;
  }

  /* ========================================================
     DIRECT OBJECT
  ======================================================== */

  if (
    typeof response === "object" &&
    !Array.isArray(response)
  ) {

    if (
      response.performance &&
      typeof response.performance === "object"
    ) {

      console.log(
        "[useAgentDashboard] Using response.performance"
      );

      return response.performance;
    }

    console.log(
      "[useAgentDashboard] Using direct performance object"
    );

    return response;
  }

  console.warn(
    "[useAgentDashboard] Could not extract performance data."
  );

  return {};
};

/* ==========================================================
   NORMALIZE ACTIVITY
========================================================== */

const normalizeActivity = (
  data
) => {

  const rawActivity =
    data?.recentActivity ??
    data?.activities ??
    data?.activity ??
    [];

  if (
    !Array.isArray(rawActivity)
  ) {
    return [];
  }

  return rawActivity.map(
    (
      item,
      index
    ) => ({
      ...item,

      id:
        item?._id ??
        item?.id ??
        `activity-${index}`,

      type:
        item?.type ??
        item?.activityType ??
        "Activity",

      title:
        item?.title ??
        item?.description ??
        item?.action ??
        "Agent activity",

      date:
        item?.date ??
        item?.createdAt ??
        item?.timestamp ??
        null,

      status:
        item?.status ??
        "",
    })
  );
};

/* ==========================================================
   AUTHORITATIVE PERFORMANCE NORMALIZER
==========================================================

BACKEND CURRENTLY RETURNS:

{
  agent: {
    id,
    name
  },

  leads: {
    total,
    qualified,
    converted,
    lost
  },

  followUps: {
    total,
    completed,
    overdue,
    completionRate
  },

  viewings: {
    scheduled
  },

  conversion: {
    rate
  },

  summary: {
    totalLeads,
    qualifiedLeads,
    convertedLeads,
    lostLeads,
    totalFollowUps,
    completedFollowUps,
    overdueFollowUps,
    scheduledViewings,
    conversionRate
  }
}

IMPORTANT:

The authoritative assigned-lead value is:

    data.leads.total

For the current backend response this is:

    1

Do NOT convert data.leads itself to Number().

========================================================== */

const normalizePerformance = (
  response
) => {

  console.log(
    "[useAgentDashboard] Raw performance response:",
    response
  );

  const data =
    extractPerformanceData(
      response
    );

  console.log(
    "[useAgentDashboard] FINAL DATA OBJECT BEING NORMALIZED:",
    data
  );

  /* ========================================================
     NESTED OBJECTS
  ======================================================== */

  const leads =
    data?.leads &&
    typeof data.leads === "object"
      ? data.leads
      : {};

  const followUps =
    data?.followUps &&
    typeof data.followUps === "object"
      ? data.followUps
      : {};

  const viewings =
    data?.viewings &&
    typeof data.viewings === "object"
      ? data.viewings
      : {};

  const conversion =
    data?.conversion &&
    typeof data.conversion === "object"
      ? data.conversion
      : {};

  const summary =
    data?.summary &&
    typeof data.summary === "object"
      ? data.summary
      : {};

  console.log(
    "[useAgentDashboard] Backend lead structure:",
    {
      leads,
      summary,
    }
  );

  /* ========================================================
     LEADS
  ======================================================== */

  /*
   * IMPORTANT:
   *
   * leads.total is authoritative.
   *
   * Current backend:
   *
   * leads.total = 1
   */

  const assignedLeads =
    toNumber(
      leads.total ??
        summary.totalLeads ??
        data.assignedLeads ??
        data.totalLeads ??
        data.leadsAssigned ??
        0
    );

  const qualifiedLeads =
    toNumber(
      leads.qualified ??
        summary.qualifiedLeads ??
        data.qualifiedLeads ??
        data.qualified ??
        0
    );

  const convertedLeads =
    toNumber(
      leads.converted ??
        summary.convertedLeads ??
        data.convertedLeads ??
        data.conversions ??
        data.closedLeads ??
        0
    );

  const lostLeads =
    toNumber(
      leads.lost ??
        summary.lostLeads ??
        data.lostLeads ??
        data.lost ??
        0
    );

  /*
   * Active leads are all assigned leads that are
   * neither converted nor lost.
   */

  const activeLeads =
    data.activeLeads != null
      ? toNumber(
          data.activeLeads
        )
      : Math.max(
          0,
          assignedLeads -
            convertedLeads -
            lostLeads
        );

  console.log(
    "[useAgentDashboard] Corrected lead counts:",
    {
      assignedLeads,
      activeLeads,
      qualifiedLeads,
      convertedLeads,
      lostLeads,
    }
  );

  /* ========================================================
     FOLLOW-UPS
  ======================================================== */

  const totalFollowUps =
    toNumber(
      followUps.total ??
        summary.totalFollowUps ??
        data.totalFollowUps ??
        data.followUpCount ??
        data.followups ??
        0
    );

  const completedFollowUps =
    toNumber(
      followUps.completed ??
        summary.completedFollowUps ??
        data.completedFollowUps ??
        data.followUpsCompleted ??
        data.completedFollowups ??
        0
    );

  const overdueFollowUps =
    toNumber(
      followUps.overdue ??
        summary.overdueFollowUps ??
        data.overdueFollowUps ??
        data.followUpsOverdue ??
        data.overdueFollowups ??
        0
    );

  const pendingFollowUps =
    toNumber(
      followUps.pending ??
        data.pendingFollowUps ??
        data.followUpsPending ??
        Math.max(
          0,
          totalFollowUps -
            completedFollowUps
        )
    );

  /* ========================================================
     VIEWINGS
  ======================================================== */

  const scheduledViewings =
    toNumber(
      viewings.scheduled ??
        summary.scheduledViewings ??
        data.scheduledViewings ??
        0
    );

  const completedViewings =
    toNumber(
      viewings.completed ??
        summary.completedViewings ??
        data.completedViewings ??
        data.viewingsCompleted ??
        0
    );

  const upcomingViewings =
    toNumber(
      viewings.upcoming ??
        data.upcomingViewings ??
        data.viewingsUpcoming ??
        0
    );

  const cancelledViewings =
    toNumber(
      viewings.cancelled ??
        viewings.canceled ??
        data.cancelledViewings ??
        data.canceledViewings ??
        data.viewingsCancelled ??
        0
    );

  /* ========================================================
     COMMUNICATION
  ======================================================== */

  const callsMade =
    toNumber(
      data.callsMade ??
        data.calls ??
        data.totalCalls ??
        0
    );

  const messagesSent =
    toNumber(
      data.messagesSent ??
        data.messages ??
        data.totalMessages ??
        0
    );

  /* ========================================================
     CONVERSION
  ======================================================== */

  const conversionRate =
    conversion.rate != null
      ? toNumber(
          conversion.rate
        )
      : data.conversionRate != null
      ? toNumber(
          data.conversionRate
        )
      : calculatePercentage(
          convertedLeads,
          assignedLeads
        );

  /* ========================================================
     FOLLOW-UP COMPLETION RATE
  ======================================================== */

  const followUpCompletionRate =
    followUps.completionRate != null
      ? toNumber(
          followUps.completionRate
        )
      : data.followUpCompletionRate != null
      ? toNumber(
          data.followUpCompletionRate
        )
      : calculatePercentage(
          completedFollowUps,
          totalFollowUps
        );

  /* ========================================================
     VIEWING COMPLETION RATE
  ======================================================== */

  const viewingCompletionRate =
    data.viewingCompletionRate != null
      ? toNumber(
          data.viewingCompletionRate
        )
      : calculatePercentage(
          completedViewings,
          scheduledViewings
        );

  /* ========================================================
     FINAL NORMALIZED PERFORMANCE
  ======================================================== */

  const normalized = {
    agent: {
      id:
        data?.agent?.id ??
        data?.agent?._id ??
        null,

      name:
        data?.agent?.name ??
        "",
    },

    assignedLeads,

    activeLeads,

    qualifiedLeads,

    convertedLeads,

    lostLeads,

    totalFollowUps,

    completedFollowUps,

    pendingFollowUps,

    overdueFollowUps,

    totalViewings:
      scheduledViewings,

    completedViewings,

    upcomingViewings,

    cancelledViewings,

    callsMade,

    messagesSent,

    conversionRate,

    followUpCompletionRate,

    viewingCompletionRate,

    recentActivity:
      normalizeActivity(data),
  };

  console.log(
    "[useAgentDashboard] Corrected performance:",
    normalized
  );

  console.log(
    "[useAgentDashboard] NORMALIZED PERFORMANCE:",
    normalized
  );

  console.log(
    "[useAgentDashboard] ASSIGNED LEADS:",
    normalized.assignedLeads
  );

  return normalized;
};

/* ==========================================================
   HOOK
========================================================== */

const useAgentDashboard = () => {

  /* ========================================================
     PERFORMANCE
  ======================================================== */

  const [
    performance,
    setPerformance,
  ] = useState(
    EMPTY_PERFORMANCE
  );

  /* ========================================================
     SUMMARY
  ======================================================== */

  const [
    summary,
    setSummary,
  ] = useState(
    EMPTY_SUMMARY
  );

  /* ========================================================
     PIPELINE
  ======================================================== */

  const [
    pipeline,
    setPipeline,
  ] = useState(
    EMPTY_PIPELINE
  );

  /* ========================================================
     HOT LEADS
  ======================================================== */

  const [
    hotLeads,
    setHotLeads,
  ] = useState([]);

  /* ========================================================
     NEW LEADS
  ======================================================== */

  const [
    newLeads,
    setNewLeads,
  ] = useState([]);

  /* ========================================================
     RECENT CONVERSATIONS
  ======================================================== */

  const [
    recentConversations,
    setRecentConversations,
  ] = useState([]);

  /* ========================================================
     TODAY'S VIEWINGS
  ======================================================== */

  const [
    todayViewings,
    setTodayViewings,
  ] = useState([]);

  /* ========================================================
     UPCOMING VIEWINGS
  ======================================================== */

  const [
    upcomingViewings,
    setUpcomingViewings,
  ] = useState([]);

  /* ========================================================
     PENDING VIEWING REQUESTS
  ======================================================== */

  const [
    pendingViewingRequests,
    setPendingViewingRequests,
  ] = useState([]);

  /* ========================================================
     FOLLOW-UP QUEUE
  ======================================================== */

  const [
    followUpQueue,
    setFollowUpQueue,
  ] = useState([]);

  /* ========================================================
     STATUS
  ======================================================== */

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState(null);

  const [
    success,
    setSuccess,
  ] = useState("");

  /* ========================================================
     CLEAR MESSAGES
  ======================================================== */

  const clearMessages =
    useCallback(() => {

      setError(null);
      setSuccess("");

    }, []);

  /* ========================================================
     NORMALIZE LIST
  ======================================================== */

  const normalizeList =
    useCallback(
      (response) => {

        const data =
          response?.data ??
          response ??
          [];

        if (
          Array.isArray(data)
        ) {
          return data;
        }

        return (
          data?.items ||
          data?.leads ||
          data?.viewings ||
          data?.conversations ||
          data?.followUps ||
          []
        );
      },
      []
    );

  /* ========================================================
     LOAD AUTHORITATIVE PERFORMANCE
  ========================================================

  GET /api/agent/performance

  The backend determines the current agent from
  authentication.

  No agentId is supplied.

  ======================================================== */

  const loadPerformance =
    useCallback(
      async () => {

        console.log(
          "[useAgentDashboard] Loading AUTHORITATIVE agent performance..."
        );

        const response =
          await axiosClient.get(
            "/agent/performance"
          );

        console.log(
          "[useAgentDashboard] Performance endpoint response:",
          response
        );

        const normalized =
          normalizePerformance(
            response
          );

        setPerformance(
          normalized
        );

        console.log(
          "[useAgentDashboard] Performance state updated:",
          normalized
        );

        return normalized;
      },
      []
    );

  /* ========================================================
     LOAD SUMMARY
  ======================================================== */

  const loadSummary =
    useCallback(
      async () => {

        const response =
          await agentDashboardService
            .getSummary();

        const data =
          response?.data ??
          response ??
          {};

        setSummary({
          totalLeads:
            toNumber(
              data.totalLeads
            ),

          qualifiedLeads:
            toNumber(
              data.qualifiedLeads
            ),

          hotLeads:
            toNumber(
              data.hotLeads
            ),

          closedLeads:
            toNumber(
              data.closedLeads ??
                data.closedDeals
            ),

          conversionRate:
            toNumber(
              data.conversionRate
            ),

          activeConversations:
            toNumber(
              data.activeConversations ??
                data.openConversations
            ),

          unreadConversations:
            toNumber(
              data.unreadConversations ??
                data.unreadCount
            ),

          pendingViewingRequests:
            toNumber(
              data.pendingViewingRequests ??
                data.pendingViewings
            ),

          todayViewings:
            toNumber(
              data.todayViewings
            ),

          upcomingViewings:
            toNumber(
              data.upcomingViewings ??
                data.upcoming
            ),

          completedViewings:
            toNumber(
              data.completedViewings
            ),

          missedViewings:
            toNumber(
              data.missedViewings
            ),

          pendingFollowUps:
            toNumber(
              data.pendingFollowUps
            ),

          viewingConversionRate:
            toNumber(
              data.viewingConversionRate
            ),
        });

        return data;
      },
      []
    );

  /* ========================================================
     LOAD PIPELINE
  ======================================================== */

  const loadPipeline =
    useCallback(
      async () => {

        const response =
          await agentDashboardService
            .getPipeline();

        const data =
          response?.data ??
          response ??
          {};

        setPipeline({
          total:
            toNumber(
              data.total ??
                data.totalLeads
            ),

          stages:
            Array.isArray(
              data.stages ??
                data.pipeline
            )
              ? (
                  data.stages ??
                  data.pipeline ??
                  []
                )
              : [],
        });

        return data;
      },
      []
    );

  /* ========================================================
     LOAD HOT LEADS
  ======================================================== */

  const loadHotLeads =
    useCallback(
      async () => {

        const response =
          await agentDashboardService
            .getHotLeads();

        const data =
          normalizeList(
            response
          );

        setHotLeads(data);

        return data;
      },
      [normalizeList]
    );

  /* ========================================================
     LOAD NEW LEADS
  ======================================================== */

  const loadNewLeads =
    useCallback(
      async () => {

        const response =
          await agentDashboardService
            .getNewLeads();

        const data =
          normalizeList(
            response
          );

        setNewLeads(data);

        return data;
      },
      [normalizeList]
    );

  /* ========================================================
     LOAD RECENT CONVERSATIONS
  ======================================================== */

  const loadRecentConversations =
    useCallback(
      async () => {

        const response =
          await agentDashboardService
            .getRecentConversations();

        const data =
          normalizeList(
            response
          );

        setRecentConversations(
          data
        );

        return data;
      },
      [normalizeList]
    );

  /* ========================================================
     LOAD TODAY VIEWINGS
  ======================================================== */

  const loadTodayViewings =
    useCallback(
      async () => {

        const response =
          await agentDashboardService
            .getTodayViewings();

        const data =
          normalizeList(
            response
          );

        setTodayViewings(data);

        return data;
      },
      [normalizeList]
    );

  /* ========================================================
     LOAD UPCOMING VIEWINGS
  ======================================================== */

  const loadUpcomingViewings =
    useCallback(
      async () => {

        const response =
          await agentDashboardService
            .getUpcomingViewings();

        const data =
          normalizeList(
            response
          );

        setUpcomingViewings(
          data
        );

        return data;
      },
      [normalizeList]
    );

  /* ========================================================
     LOAD PENDING VIEWING REQUESTS
  ======================================================== */

  const loadPendingViewingRequests =
    useCallback(
      async () => {

        const response =
          await agentDashboardService
            .getPendingViewingRequests();

        const data =
          normalizeList(
            response
          );

        setPendingViewingRequests(
          data
        );

        return data;
      },
      [normalizeList]
    );

  /* ========================================================
     LOAD FOLLOW-UP QUEUE
  ======================================================== */

  const loadFollowUpQueue =
    useCallback(
      async () => {

        const response =
          await agentDashboardService
            .getFollowUpQueue();

        const data =
          normalizeList(
            response
          );

        setFollowUpQueue(data);

        return data;
      },
      [normalizeList]
    );

  /* ========================================================
     LOAD COMPLETE DASHBOARD
  ======================================================== */

  const loadDashboard =
    useCallback(
      async () => {

        try {

          setLoading(true);

          clearMessages();

          console.log(
            "[useAgentDashboard] Loading complete agent dashboard..."
          );

          const results =
            await Promise.allSettled([

              loadPerformance(),

              loadSummary(),

              loadPipeline(),

              loadHotLeads(),

              loadNewLeads(),

              loadRecentConversations(),

              loadTodayViewings(),

              loadUpcomingViewings(),

              loadPendingViewingRequests(),

              loadFollowUpQueue(),

            ]);

          /* ==================================================
             PERFORMANCE IS CRITICAL
          ================================================== */

          const performanceResult =
            results[0];

          if (
            performanceResult?.status ===
            "rejected"
          ) {

            console.error(
              "[useAgentDashboard] Performance request failed:",
              performanceResult.reason
            );

            throw (
              performanceResult.reason ||
              new Error(
                "Unable to load agent performance."
              )
            );
          }

          /* ==================================================
             SUMMARY IS CRITICAL
          ================================================== */

          const summaryResult =
            results[1];

          if (
            summaryResult?.status ===
            "rejected"
          ) {

            console.error(
              "[useAgentDashboard] Summary request failed:",
              summaryResult.reason
            );

            throw (
              summaryResult.reason ||
              new Error(
                "Unable to load agent dashboard."
              )
            );
          }

          /* ==================================================
             OPTIONAL SECTIONS
          ================================================== */

          const failedSections =
            results.filter(
              (
                result
              ) =>
                result.status ===
                "rejected"
            );

          if (
            failedSections.length >
            0
          ) {

            setError(
              "Some dashboard information could not be loaded."
            );

          } else {

            setSuccess(
              "Dashboard updated."
            );

          }

          console.log(
            "[useAgentDashboard] Dashboard successfully loaded."
          );

        } catch (
          err
        ) {

          console.error(
            "[useAgentDashboard] Dashboard error:",
            err
          );

          setError(
            err?.response?.data
              ?.message ||
            err?.message ||
            "Unable to load agent dashboard."
          );

        } finally {

          setLoading(false);

        }

      },
      [
        clearMessages,
        loadPerformance,
        loadSummary,
        loadPipeline,
        loadHotLeads,
        loadNewLeads,
        loadRecentConversations,
        loadTodayViewings,
        loadUpcomingViewings,
        loadPendingViewingRequests,
        loadFollowUpQueue,
      ]
    );

  /* ========================================================
     REFRESH DASHBOARD
  ======================================================== */

  const refreshDashboard =
    useCallback(
      async () => {

        console.log(
          "[useAgentDashboard] Refreshing dashboard..."
        );

        await loadDashboard();

      },
      [loadDashboard]
    );

  /* ========================================================
     INITIAL LOAD
  ======================================================== */

  useEffect(() => {

    loadDashboard();

  }, [
    loadDashboard,
  ]);

  /* ========================================================
     RETURN
  ======================================================== */

  return {

    performance,

    summary,

    pipeline,

    hotLeads,

    newLeads,

    recentConversations,

    todayViewings,

    upcomingViewings,

    pendingViewingRequests,

    followUpQueue,

    loading,

    error,

    success,

    loadDashboard,

    loadPerformance,

    loadSummary,

    loadPipeline,

    loadHotLeads,

    loadNewLeads,

    loadRecentConversations,

    loadTodayViewings,

    loadUpcomingViewings,

    loadPendingViewingRequests,

    loadFollowUpQueue,

    refreshDashboard,

    clearMessages,
  };
};

export default useAgentDashboard;