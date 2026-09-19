/**
 * ==========================================================
 *
 * Path
 * ----
 * src/pages/agent/agentPerformance.jsx
 *
 * Purpose
 * -------
 * Agent-specific performance workspace.
 *
 * This page displays performance for the CURRENTLY
 * AUTHENTICATED AGENT only.
 *
 * Backend endpoint:
 *
 * GET /api/agent/performance
 *
 * ==========================================================
 */

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Activity,
  Award,
  BarChart3,
  CalendarCheck,
  CheckCircle2,
  Clock3,
  Loader2,
  Phone,
  RefreshCw,
  Target,
  TrendingUp,
  UserCheck,
  Users,
  XCircle,
} from "lucide-react";

import axiosClient from "../../api/axiosClient";

/* ==========================================================
   LEAD STATUS DEFINITIONS
========================================================== */

const LEAD_STATUSES = {
  NEW: "new",
  CONTACTED: "contacted",
  QUALIFIED: "qualified",
  VIEWING: "viewing",
  NEGOTIATION: "negotiation",
  WON: "won",
  LOST: "lost",
};

/*
 * Keep this reference because these statuses define the
 * workflow represented by the page.
 */
void LEAD_STATUSES;

/* ==========================================================
   DEFAULT PERFORMANCE STATE
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
   NUMBER HELPER
========================================================== */

const toNumber = (
  value,
  fallback = 0
) => {

  const number =
    Number(value);

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

  const top =
    toNumber(numerator);

  const bottom =
    toNumber(denominator);

  if (
    bottom <= 0
  ) {
    return 0;
  }

  return Math.round(
    (top / bottom) * 100
  );
};


/* ==========================================================
   EXTRACT PERFORMANCE DATA
========================================================== */

const extractPerformanceData = (
  response
) => {

  console.log(
    "[AgentPerformance] Extracting performance data from response:",
    response
  );

  if (!response) {

    console.warn(
      "[AgentPerformance] No response received."
    );

    return {};
  }

  /* ========================================================
     AXIOS RESPONSE
  ======================================================== */

  const axiosData =
    response?.data;

  console.log(
    "[AgentPerformance] Axios data:",
    axiosData
  );

  /* ========================================================
     AXIOS RESPONSE VALIDATION
  ======================================================== */

  if (
    axiosData &&
    typeof axiosData === "object" &&
    !Array.isArray(axiosData)
  ) {

    /* ======================================================
       CASE 1
       Backend response:
       
       {
         success: true,
         data: {
           agent: {},
           leads: {},
           followUps: {},
           viewings: {},
           conversion: {},
           summary: {}
         }
       }
       
       This is the CURRENT LeadFlow AI backend shape.
       ====================================================== */

    if (
      axiosData.data &&
      typeof axiosData.data === "object" &&
      !Array.isArray(axiosData.data)
    ) {

      console.log(
        "[AgentPerformance] Using response.data.data"
      );

      return axiosData.data;
    }

    /* ======================================================
       CASE 2
       Backend/service may already return:
       
       {
         agent: {},
         leads: {},
         followUps: {},
         ...
       }
       ====================================================== */

    if (
      axiosData.leads ||
      axiosData.followUps ||
      axiosData.viewings ||
      axiosData.conversion ||
      axiosData.summary ||
      axiosData.assignedLeads != null
    ) {

      console.log(
        "[AgentPerformance] Using response.data directly"
      );

      return axiosData;
    }

    /* ======================================================
       CASE 3
       Some API clients may return:
       
       {
         performance: {
           agent: {},
           leads: {},
           ...
         }
       }
       ====================================================== */

    if (
      axiosData.performance &&
      typeof axiosData.performance === "object"
    ) {

      console.log(
        "[AgentPerformance] Using response.data.performance"
      );

      return axiosData.performance;
    }

    console.warn(
      "[AgentPerformance] response.data did not contain a recognizable performance object:",
      axiosData
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

    /* ======================================================
       DIRECT PERFORMANCE OBJECT
       ====================================================== */

    if (
      response.leads ||
      response.followUps ||
      response.viewings ||
      response.conversion ||
      response.summary ||
      response.assignedLeads != null
    ) {

      console.log(
        "[AgentPerformance] Using direct response object"
      );

      return response;
    }

    /* ======================================================
       DIRECT PERFORMANCE WRAPPER
       ====================================================== */

    if (
      response.performance &&
      typeof response.performance === "object"
    ) {

      console.log(
        "[AgentPerformance] Using direct response.performance"
      );

      return response.performance;
    }

    /* ======================================================
       DIRECT DATA WRAPPER
       ====================================================== */

    if (
      response.data &&
      typeof response.data === "object"
    ) {

      console.log(
        "[AgentPerformance] Using direct response.data"
      );

      return response.data;
    }
  }

  console.warn(
    "[AgentPerformance] Could not extract performance data."
  );

  return {};
};

/* ==========================================================
   ACTIVITY NORMALIZATION
========================================================== */

const normalizeActivity = (
  data
) => {

  const activity =
    data?.recentActivity ??
    data?.activities ??
    data?.activity ??
    [];

  if (
    !Array.isArray(activity)
  ) {
    return [];
  }

  return activity.map(
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
========================================================== */

const normalizePerformance = (
  response
) => {

  const data =
    extractPerformanceData(
      response
    );

  console.log(
    "[AgentPerformance] FINAL DATA OBJECT BEING NORMALIZED:",
    data
  );

  console.log(
    "[AgentPerformance] data.leads:",
    data?.leads
  );

  console.log(
    "[AgentPerformance] data.summary:",
    data?.summary
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
    "[AgentPerformance] EXTRACTED NESTED OBJECTS:",
    {
      leads,
      followUps,
      viewings,
      conversion,
      summary,
    }
  );

  /* ========================================================
     LEADS
  ======================================================== */

  /*
   * IMPORTANT FIX
   *
   * leads.total is the authoritative assigned lead count.
   *
   * Backend:
   *
   * leads.total = 1
   *
   * Therefore:
   *
   * assignedLeads = 1
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

  /* ========================================================
     ACTIVE LEADS
  ======================================================== */

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
    "[AgentPerformance] CORRECTED LEAD COUNTS:",
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
        0
    );

  const completedFollowUps =
    toNumber(
      followUps.completed ??
        summary.completedFollowUps ??
        data.completedFollowUps ??
        0
    );

  const overdueFollowUps =
    toNumber(
      followUps.overdue ??
        summary.overdueFollowUps ??
        data.overdueFollowUps ??
        0
    );

  const pendingFollowUps =
    toNumber(
      followUps.pending ??
        data.pendingFollowUps ??
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
        0
    );

  const upcomingViewings =
    toNumber(
      viewings.upcoming ??
        data.upcomingViewings ??
        0
    );

  const cancelledViewings =
    toNumber(
      viewings.cancelled ??
        viewings.canceled ??
        data.cancelledViewings ??
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
     FOLLOW-UP COMPLETION
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
     VIEWING COMPLETION
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
     FINAL NORMALIZED OBJECT
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
    "[AgentPerformance] FINAL NORMALIZED PERFORMANCE:",
    normalized
  );

  console.log(
    "[AgentPerformance] ASSIGNED LEADS:",
    normalized.assignedLeads
  );

  return normalized;
};

/* ==========================================================
   DATE FORMATTER
========================================================== */

const formatActivityDate = (
  value
) => {

  if (!value) {
    return "Date unavailable";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "Date unavailable";
  }

  return date.toLocaleString(
    "en-KE",
    {
      dateStyle: "medium",
      timeStyle: "short",
    }
  );
};

/* ==========================================================
   ACTIVITY ICON
========================================================== */

const ActivityIcon = ({
  type,
}) => {

  const normalized =
    String(type || "")
      .toLowerCase();

  if (
    normalized.includes("call")
  ) {

    return (
      <Phone
        size={18}
        className="text-cyan-400"
      />
    );
  }

  if (
    normalized.includes("follow")
  ) {

    return (
      <Clock3
        size={18}
        className="text-amber-400"
      />
    );
  }

  if (
    normalized.includes("view")
  ) {

    return (
      <CalendarCheck
        size={18}
        className="text-blue-400"
      />
    );
  }

  if (
    normalized.includes("convert") ||
    normalized.includes("close")
  ) {

    return (
      <Award
        size={18}
        className="text-emerald-400"
      />
    );
  }

  return (
    <Activity
      size={18}
      className="text-slate-400"
    />
  );
};

/* ==========================================================
   PERFORMANCE CARD
========================================================== */

const PerformanceCard = ({
  title,
  value,
  subtitle,
  icon,
  iconClass = "text-cyan-400",
}) => {

  return (
    <div
      className="
        rounded-2xl
        border
        border-slate-800
        bg-slate-900
        p-6
        transition
        hover:border-slate-700
      "
    >

      <div className="flex items-start justify-between gap-4">

        <div>

          <p className="text-sm font-medium text-slate-400">
            {title}
          </p>

          <p className="mt-3 text-3xl font-bold text-white">
            {value}
          </p>

          {subtitle && (
            <p className="mt-2 text-sm text-slate-500">
              {subtitle}
            </p>
          )}

        </div>

        <div
          className="
            rounded-xl
            bg-slate-950
            p-3
          "
        >

          <span className={iconClass}>
            {icon}
          </span>

        </div>

      </div>

    </div>
  );
};

/* ==========================================================
   PROGRESS CARD
========================================================== */

const ProgressCard = ({
  title,
  value,
  description,
}) => {

  const safeValue =
    Math.min(
      100,
      Math.max(
        0,
        toNumber(value)
      )
    );

  return (
    <div
      className="
        rounded-2xl
        border
        border-slate-800
        bg-slate-900
        p-6
      "
    >

      <div className="flex items-center justify-between gap-4">

        <div>

          <h3 className="font-semibold text-white">
            {title}
          </h3>

          <p className="mt-1 text-sm text-slate-400">
            {description}
          </p>

        </div>

        <span className="text-2xl font-bold text-cyan-400">
          {safeValue}%
        </span>

      </div>

      <div className="mt-5 h-3 overflow-hidden rounded-full bg-slate-800">

        <div
          className="
            h-full
            rounded-full
            bg-cyan-500
            transition-all
            duration-500
          "
          style={{
            width: `${safeValue}%`,
          }}
        />

      </div>

    </div>
  );
};

/* ==========================================================
   MAIN COMPONENT
========================================================== */

const AgentPerformance = () => {

  const [
    performance,
    setPerformance,
  ] = useState(
    EMPTY_PERFORMANCE
  );

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");

  /* ========================================================
     LOAD PERFORMANCE
  ======================================================== */

  const loadPerformance =
    useCallback(
      async () => {

        try {

          setLoading(true);

          setError("");

          console.log(
            "[AgentPerformance] Loading current agent performance..."
          );

          /*
           * IMPORTANT
           *
           * No agentId is supplied.
           *
           * Backend determines the current agent
           * from the authenticated request.
           */

          const response =
            await axiosClient.get(
              "/agent/performance"
            );

          console.log(
            "[AgentPerformance] Raw performance response:",
            response
          );

          /*
           * CRITICAL:
           *
           * Use the exact same normalization logic
           * as the dashboard hook.
           */

          const normalized =
            normalizePerformance(
              response
            );

          console.log(
            "[AgentPerformance] Normalized performance:",
            normalized
          );

          console.log(
            "[AgentPerformance] ASSIGNED LEADS AFTER NORMALIZATION:",
            normalized.assignedLeads
          );

          setPerformance(
            normalized
          );

        } catch (
          requestError
        ) {

          console.error(
            "[AgentPerformance] Failed to load performance:",
            requestError
          );

          setPerformance(
            EMPTY_PERFORMANCE
          );

          setError(
            requestError
              ?.response
              ?.data
              ?.message ||
              requestError?.message ||
              "Unable to load your performance data."
          );

        } finally {

          setLoading(false);

        }

      },
      []
    );

  /* ========================================================
     INITIAL LOAD
  ======================================================== */

  useEffect(() => {

    loadPerformance();

  }, [
    loadPerformance,
  ]);

  /* ========================================================
     QUALIFICATION RATE
  ======================================================== */

  const leadQualificationRate =
    useMemo(
      () =>
        calculatePercentage(
          performance.qualifiedLeads,
          performance.assignedLeads
        ),
      [
        performance.qualifiedLeads,
        performance.assignedLeads,
      ]
    );

  /* ========================================================
     LOADING
  ======================================================== */

  if (loading) {

    return (
      <section
        className="
          min-h-[60vh]
          space-y-8
        "
      >

        <div>

          <h1 className="text-3xl font-bold text-white">
            My Performance
          </h1>

          <p className="mt-2 text-slate-400">
            Loading your LeadFlow AI performance...
          </p>

        </div>

        <div
          className="
            flex
            min-h-[350px]
            items-center
            justify-center
            rounded-2xl
            border
            border-slate-800
            bg-slate-900
          "
        >

          <div className="text-center">

            <Loader2
              size={38}
              className="
                mx-auto
                animate-spin
                text-cyan-400
              "
            />

            <p className="mt-4 text-slate-400">
              Loading performance...
            </p>

          </div>

        </div>

      </section>
    );
  }

  /* ========================================================
     PAGE
  ======================================================== */

  return (
    <section
      className="
        space-y-8
        text-white
      "
    >

      {/* ==================================================
          HEADER
      ================================================== */}

      <div
        className="
          flex
          flex-col
          gap-4
          md:flex-row
          md:items-center
          md:justify-between
        "
      >

        <div>

          <div className="flex items-center gap-3">

            <BarChart3
              size={30}
              className="text-cyan-400"
            />

            <h1 className="text-3xl font-bold">
              My Performance
            </h1>

          </div>

          <p className="mt-2 text-slate-400">
            Track your lead activity, follow-ups,
            viewings and customer conversions.
          </p>

        </div>

        <button
          type="button"
          onClick={loadPerformance}
          disabled={loading}
          className="
            inline-flex
            items-center
            justify-center
            gap-2
            rounded-xl
            border
            border-slate-700
            bg-slate-900
            px-4
            py-2.5
            text-sm
            font-semibold
            text-white
            transition
            hover:border-cyan-500
            hover:bg-slate-800
            disabled:cursor-not-allowed
            disabled:opacity-50
          "
        >

          <RefreshCw
            size={17}
            className={
              loading
                ? "animate-spin"
                : ""
            }
          />

          Refresh

        </button>

      </div>

      {/* ==================================================
          ERROR
      ================================================== */}

      {error && (

        <div
          className="
            rounded-2xl
            border
            border-red-500/30
            bg-red-500/10
            p-5
          "
        >

          <div className="flex gap-3">

            <XCircle
              size={22}
              className="shrink-0 text-red-400"
            />

            <div>

              <h2 className="font-semibold text-red-300">
                Performance data unavailable
              </h2>

              <p className="mt-1 text-sm text-red-400">
                {error}
              </p>

              <button
                type="button"
                onClick={loadPerformance}
                className="
                  mt-3
                  text-sm
                  font-semibold
                  text-red-300
                  underline
                  hover:no-underline
                "
              >
                Try again
              </button>

            </div>

          </div>

        </div>
      )}

      {/* ==================================================
          LEAD PERFORMANCE
      ================================================== */}

      <div>

        <div className="mb-4 flex items-center gap-3">

          <Users
            size={22}
            className="text-cyan-400"
          />

          <h2 className="text-xl font-bold">
            Lead Performance
          </h2>

        </div>

        <div
          className="
            grid
            gap-5
            sm:grid-cols-2
            xl:grid-cols-4
          "
        >

          <PerformanceCard
            title="Assigned Leads"
            value={
              performance.assignedLeads
            }
            subtitle="Leads assigned to you"
            icon={
              <Users size={22} />
            }
          />

          <PerformanceCard
            title="Active Leads"
            value={
              performance.activeLeads
            }
            subtitle="New, contacted, qualified, viewing or negotiation"
            icon={
              <Activity size={22} />
            }
            iconClass="text-amber-400"
          />

          <PerformanceCard
            title="Qualified Leads"
            value={
              performance.qualifiedLeads
            }
            subtitle={`${leadQualificationRate}% qualification rate`}
            icon={
              <UserCheck size={22} />
            }
            iconClass="text-blue-400"
          />

          <PerformanceCard
            title="Converted Leads"
            value={
              performance.convertedLeads
            }
            subtitle={`${performance.conversionRate}% conversion rate`}
            icon={
              <TrendingUp size={22} />
            }
            iconClass="text-emerald-400"
          />

        </div>

      </div>

      {/* ==================================================
          CONVERSION PERFORMANCE
      ================================================== */}

      <div
        className="
          grid
          gap-5
          lg:grid-cols-2
        "
      >

        <ProgressCard
          title="Lead Conversion"
          value={
            performance.conversionRate
          }
          description="Percentage of assigned leads that reached won status."
        />

        <ProgressCard
          title="Lead Qualification"
          value={
            leadQualificationRate
          }
          description="Percentage of assigned leads currently qualified."
        />

      </div>

      {/* ==================================================
          FOLLOW-UP PERFORMANCE
      ================================================== */}

      <div>

        <div className="mb-4 flex items-center gap-3">

          <Clock3
            size={22}
            className="text-cyan-400"
          />

          <h2 className="text-xl font-bold">
            Follow-up Performance
          </h2>

        </div>

        <div
          className="
            grid
            gap-5
            sm:grid-cols-2
            xl:grid-cols-4
          "
        >

          <PerformanceCard
            title="Total Follow-ups"
            value={
              performance.totalFollowUps
            }
            subtitle="Follow-up tasks"
            icon={
              <Clock3 size={22} />
            }
          />

          <PerformanceCard
            title="Completed"
            value={
              performance.completedFollowUps
            }
            subtitle="Successfully completed"
            icon={
              <CheckCircle2 size={22} />
            }
            iconClass="text-emerald-400"
          />

          <PerformanceCard
            title="Pending"
            value={
              performance.pendingFollowUps
            }
            subtitle="Still requiring action"
            icon={
              <Target size={22} />
            }
            iconClass="text-amber-400"
          />

          <PerformanceCard
            title="Overdue"
            value={
              performance.overdueFollowUps
            }
            subtitle="Requires immediate attention"
            icon={
              <XCircle size={22} />
            }
            iconClass="text-red-400"
          />

        </div>

      </div>

      <ProgressCard
        title="Follow-up Completion"
        value={
          performance.followUpCompletionRate
        }
        description="Percentage of follow-up tasks completed."
      />

      {/* ==================================================
          VIEWING PERFORMANCE
      ================================================== */}

      <div>

        <div className="mb-4 flex items-center gap-3">

          <CalendarCheck
            size={22}
            className="text-cyan-400"
          />

          <h2 className="text-xl font-bold">
            Property Viewing Performance
          </h2>

        </div>

        <div
          className="
            grid
            gap-5
            sm:grid-cols-2
            xl:grid-cols-4
          "
        >

          <PerformanceCard
            title="Total Viewings"
            value={
              performance.totalViewings
            }
            subtitle="Viewings assigned to you"
            icon={
              <CalendarCheck
                size={22}
              />
            }
          />

          <PerformanceCard
            title="Completed"
            value={
              performance.completedViewings
            }
            subtitle="Completed property visits"
            icon={
              <CheckCircle2
                size={22}
              />
            }
            iconClass="text-emerald-400"
          />

          <PerformanceCard
            title="Upcoming"
            value={
              performance.upcomingViewings
            }
            subtitle="Scheduled future visits"
            icon={
              <Clock3 size={22} />
            }
            iconClass="text-blue-400"
          />

          <PerformanceCard
            title="Cancelled"
            value={
              performance.cancelledViewings
            }
            subtitle="Cancelled appointments"
            icon={
              <XCircle size={22} />
            }
            iconClass="text-red-400"
          />

        </div>

      </div>

      <ProgressCard
        title="Viewing Completion"
        value={
          performance.viewingCompletionRate
        }
        description="Percentage of assigned viewings completed."
      />

      {/* ==================================================
          CUSTOMER COMMUNICATION
      ================================================== */}

      <div>

        <div className="mb-4 flex items-center gap-3">

          <Phone
            size={22}
            className="text-cyan-400"
          />

          <h2 className="text-xl font-bold">
            Customer Communication
          </h2>

        </div>

        <div
          className="
            grid
            gap-5
            md:grid-cols-2
          "
        >

          <PerformanceCard
            title="Calls Made"
            value={
              performance.callsMade
            }
            subtitle="Recorded customer calls"
            icon={
              <Phone size={22} />
            }
          />

          <PerformanceCard
            title="Messages Sent"
            value={
              performance.messagesSent
            }
            subtitle="Recorded customer messages"
            icon={
              <Activity size={22} />
            }
            iconClass="text-blue-400"
          />

        </div>

      </div>

      {/* ==================================================
          PERFORMANCE SNAPSHOT
      ================================================== */}

      <section
        className="
          rounded-2xl
          border
          border-cyan-500/20
          bg-cyan-500/5
          p-6
        "
      >

        <div className="flex items-start gap-4">

          <div
            className="
              rounded-xl
              bg-cyan-500/10
              p-3
            "
          >

            <TrendingUp
              size={24}
              className="text-cyan-400"
            />

          </div>

          <div>

            <h2 className="text-xl font-bold">
              Performance Snapshot
            </h2>

            <p className="mt-2 leading-7 text-slate-400">

              You currently have{" "}

              <span className="font-semibold text-white">
                {performance.activeLeads}
              </span>{" "}

              active leads,{" "}

              <span className="font-semibold text-white">
                {performance.pendingFollowUps}
              </span>{" "}

              pending follow-ups and{" "}

              <span className="font-semibold text-white">
                {performance.upcomingViewings}
              </span>{" "}

              upcoming property viewings.

              {performance.overdueFollowUps >
                0 && (
                <>
                  {" "}
                  You also have{" "}

                  <span className="font-semibold text-red-400">
                    {
                      performance.overdueFollowUps
                    }{" "}
                    overdue follow-up
                    {performance.overdueFollowUps !==
                    1
                      ? "s"
                      : ""}
                  </span>{" "}

                  requiring attention.
                </>
              )}

            </p>

          </div>

        </div>

      </section>

      {/* ==================================================
          RECENT ACTIVITY
      ================================================== */}

      <section
        className="
          rounded-2xl
          border
          border-slate-800
          bg-slate-900
        "
      >

        <div className="border-b border-slate-800 p-6">

          <div className="flex items-center gap-3">

            <Activity
              size={22}
              className="text-cyan-400"
            />

            <div>

              <h2 className="text-xl font-bold">
                Recent Activity
              </h2>

              <p className="mt-1 text-sm text-slate-400">
                Recent customer activity associated
                with your agent workspace.
              </p>

            </div>

          </div>

        </div>

        {performance.recentActivity.length ===
        0 ? (

          <div
            className="
              p-10
              text-center
            "
          >

            <Activity
              size={38}
              className="
                mx-auto
                text-slate-700
              "
            />

            <h3 className="mt-4 font-semibold text-white">
              No recent activity
            </h3>

            <p className="mt-2 text-sm text-slate-500">
              Your recent CRM activity will appear here.
            </p>

          </div>

        ) : (

          <div className="divide-y divide-slate-800">

            {performance.recentActivity
              .slice(0, 10)
              .map(
                (
                  item
                ) => (

                  <div
                    key={item.id}
                    className="
                      flex
                      items-start
                      gap-4
                      p-5
                      transition
                      hover:bg-slate-800/40
                    "
                  >

                    <div
                      className="
                        mt-1
                        rounded-xl
                        bg-slate-950
                        p-3
                      "
                    >

                      <ActivityIcon
                        type={
                          item.type
                        }
                      />

                    </div>

                    <div className="min-w-0 flex-1">

                      <div
                        className="
                          flex
                          flex-col
                          gap-1
                          sm:flex-row
                          sm:items-center
                          sm:justify-between
                        "
                      >

                        <h3 className="font-semibold text-white">
                          {item.title}
                        </h3>

                        <span className="text-xs text-slate-500">
                          {formatActivityDate(
                            item.date
                          )}
                        </span>

                      </div>

                      {item.status && (

                        <p className="mt-1 text-sm capitalize text-slate-400">
                          Status:{" "}
                          {item.status}
                        </p>

                      )}

                    </div>

                  </div>

                )
              )}

          </div>

        )}

      </section>

      {/* ==================================================
          AGENT WORKFLOW NOTE
      ================================================== */}

      <section
        className="
          rounded-2xl
          border
          border-slate-800
          bg-slate-900
          p-6
        "
      >

        <div className="flex gap-4">

          <div
            className="
              rounded-xl
              bg-emerald-500/10
              p-3
            "
          >

            <Award
              size={23}
              className="text-emerald-400"
            />

          </div>

          <div>

            <h2 className="font-semibold text-white">
              Agent Workflow
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-400">

              Use this workspace to identify where
              attention is needed: respond to{" "}

              <span className="text-slate-300">
                new
              </span>{" "}

              and{" "}

              <span className="text-slate-300">
                contacted
              </span>{" "}

              leads, qualify customers, manage{" "}

              <span className="text-slate-300">
                viewing
              </span>{" "}

              requests, handle{" "}

              <span className="text-slate-300">
                negotiation
              </span>

              , complete follow-ups and move qualified
              customers toward{" "}

              <span className="text-emerald-400">
                won
              </span>{" "}

              conversion.

            </p>

          </div>

        </div>

      </section>

    </section>
  );
};

export default AgentPerformance;