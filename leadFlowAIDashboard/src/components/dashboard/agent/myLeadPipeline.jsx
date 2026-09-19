/**
 * ==========================================================
 * Agent Workspace
 *
 * Displays the logged-in agent's personal sales pipeline.
 *
 * Conversation Workflow
 * ----------------------------------------------------------
 * • New Leads
 * • Contacted
 * • Qualified
 *
 * Viewing Workflow
 * ----------------------------------------------------------
 * • Viewing Requested
 * • Viewing Scheduled
 *
 * Sales Workflow
 * ----------------------------------------------------------
 * • Negotiation
 * • Closed
 *
 * Data Source
 * ----------------------------------------------------------
 * useAgentDashboard()
 *
 * Expected dashboard data:
 *
 * {
 *   pipeline: {
 *     newLeads: 12,
 *     contacted: 8,
 *     qualified: 6,
 *     viewingRequests: 3,
 *     viewings: 5,
 *     negotiation: 3,
 *     closed: 2
 *   }
 * }
 *
 * ==========================================================
 */

import { useNavigate } from "react-router-dom";

import {
  UserPlus,
  PhoneCall,
  BadgeCheck,
  CalendarClock,
  CalendarCheck,
  Handshake,
  Home,
  MessageCircle,
  RefreshCw,
} from "lucide-react";

import useAgentDashboard from "../../../hooks/useAgentDashboard";

/* ==========================================================
   COMPONENT
========================================================== */

const MyLeadPipeline = () => {
  const navigate = useNavigate();

  const {
    pipeline,
    loading,
    error,
    refreshDashboard,
  } = useAgentDashboard();

  /* ========================================================
     LOADING
  ======================================================== */

  if (loading) {
    return (
      <section className="rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent" />

          <p className="text-sm text-slate-400">
            Loading your lead pipeline...
          </p>
        </div>
      </section>
    );
  }

  /* ========================================================
     ERROR
  ======================================================== */

  if (error) {
    return (
      <section className="rounded-3xl border border-red-500/20 bg-slate-900 p-6 shadow-xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-semibold text-red-400">
              Unable to load pipeline
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {error}
            </p>
          </div>

          <button
            onClick={refreshDashboard}
            className="
              flex
              items-center
              justify-center
              gap-2
              rounded-xl
              bg-cyan-500
              px-4
              py-2
              text-sm
              font-semibold
              text-slate-950
              transition
              hover:bg-cyan-400
            "
          >
            <RefreshCw size={16} />

            Try Again
          </button>
        </div>
      </section>
    );
  }

  /* ========================================================
     NORMALIZE PIPELINE DATA
  ======================================================== */

  const pipelineData = pipeline || {};

  /* ========================================================
     PIPELINE STAGES
  ======================================================== */

  const stages = [
    /* ======================================================
       CONVERSATION WORKFLOW
    ====================================================== */

    {
      title: "New Leads",
      value: pipelineData.newLeads ?? 0,
      icon: UserPlus,
      color: "bg-cyan-500",
      description:
        "Recently assigned prospects waiting for engagement.",
      route: "/leads?stage=new",
      workflow: "Conversation",
    },

    {
      title: "Contacted",
      value: pipelineData.contacted ?? 0,
      icon: PhoneCall,
      color: "bg-orange-500",
      description:
        "Customers who have received initial outreach.",
      route: "/leads?stage=contacted",
      workflow: "Conversation",
    },

    {
      title: "Qualified",
      value: pipelineData.qualified ?? 0,
      icon: BadgeCheck,
      color: "bg-emerald-500",
      description:
        "Prospects qualified for property opportunities.",
      route: "/leads?stage=qualified",
      workflow: "Conversation",
    },

    /* ======================================================
       VIEWING WORKFLOW
    ====================================================== */

    {
      title: "Viewing Requested",
      value: pipelineData.viewingRequests ?? 0,
      icon: CalendarClock,
      color: "bg-blue-500",
      description:
        "Customers who have requested a property viewing.",
      route: "/viewings?status=requested",
      workflow: "Viewing",
    },

    {
      title: "Viewing Scheduled",
      value: pipelineData.viewings ?? 0,
      icon: CalendarCheck,
      color: "bg-violet-500",
      description:
        "Customers with confirmed property viewing appointments.",
      route: "/viewings?status=scheduled",
      workflow: "Viewing",
    },

    /* ======================================================
       SALES WORKFLOW
    ====================================================== */

    {
      title: "Negotiation",
      value: pipelineData.negotiation ?? 0,
      icon: Handshake,
      color: "bg-amber-500",
      description:
        "Customers actively negotiating property terms.",
      route: "/leads?stage=negotiation",
      workflow: "Sales",
    },

    {
      title: "Closed",
      value: pipelineData.closed ?? 0,
      icon: Home,
      color: "bg-pink-500",
      description:
        "Successfully converted customers.",
      route: "/leads?stage=closed",
      workflow: "Sales",
    },
  ];

  /* ========================================================
     TOTAL PIPELINE
  ======================================================== */

  const total = stages.reduce(
    (sum, stage) => sum + stage.value,
    0
  );

  /* ========================================================
     CONVERSATION TOTAL
  ======================================================== */

  const conversationTotal =
    (pipelineData.newLeads ?? 0) +
    (pipelineData.contacted ?? 0) +
    (pipelineData.qualified ?? 0);

  /* ========================================================
     VIEWING TOTAL
  ======================================================== */

  const viewingTotal =
    (pipelineData.viewingRequests ?? 0) +
    (pipelineData.viewings ?? 0);

  /* ========================================================
     RENDER
  ======================================================== */

  return (
    <section className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-900 shadow-2xl">

      {/* ====================================================
          HEADER
      ==================================================== */}

      <div className="border-b border-slate-800 p-6">

        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

          <div>

            <h2 className="text-xl font-bold text-white">
              📈 My Lead Pipeline
            </h2>

            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-400">
              Track your assigned customers from first conversation
              through qualification, property viewing, negotiation
              and successful conversion.
            </p>

          </div>

          {/* ==================================================
              PIPELINE SUMMARY
          ================================================== */}

          <div className="flex flex-wrap gap-3">

            {/* Total Leads */}

            <div
              className="
                rounded-2xl
                border
                border-cyan-500/20
                bg-cyan-500/10
                px-5
                py-3
              "
            >
              <p className="text-xs font-medium uppercase tracking-wide text-cyan-300">
                Assigned Pipeline
              </p>

              <p className="mt-1 text-2xl font-bold text-white">
                {total}
              </p>
            </div>

            {/* Conversations */}

            <button
              onClick={() => navigate("/conversations")}
              className="
                rounded-2xl
                border
                border-blue-500/20
                bg-blue-500/10
                px-5
                py-3
                text-left
                transition
                hover:bg-blue-500/20
              "
            >
              <div className="flex items-center gap-2">
                <MessageCircle
                  size={15}
                  className="text-blue-400"
                />

                <p className="text-xs font-medium uppercase tracking-wide text-blue-300">
                  Conversations
                </p>
              </div>

              <p className="mt-1 text-2xl font-bold text-white">
                {conversationTotal}
              </p>
            </button>

            {/* Viewings */}

            <button
              onClick={() => navigate("/viewings")}
              className="
                rounded-2xl
                border
                border-violet-500/20
                bg-violet-500/10
                px-5
                py-3
                text-left
                transition
                hover:bg-violet-500/20
              "
            >
              <div className="flex items-center gap-2">
                <CalendarCheck
                  size={15}
                  className="text-violet-400"
                />

                <p className="text-xs font-medium uppercase tracking-wide text-violet-300">
                  Viewings
                </p>
              </div>

              <p className="mt-1 text-2xl font-bold text-white">
                {viewingTotal}
              </p>
            </button>

          </div>

        </div>

      </div>

      {/* ====================================================
          WORKFLOW LABELS
      ==================================================== */}

      <div className="border-b border-slate-800 bg-slate-950/50 px-6 py-4">

        <div className="flex flex-wrap items-center gap-3 text-xs font-medium">

          <span className="rounded-full bg-blue-500/10 px-3 py-1.5 text-blue-300">
            Conversation Workflow
          </span>

          <span className="text-slate-600">
            →
          </span>

          <span className="rounded-full bg-violet-500/10 px-3 py-1.5 text-violet-300">
            Viewing Workflow
          </span>

          <span className="text-slate-600">
            →
          </span>

          <span className="rounded-full bg-amber-500/10 px-3 py-1.5 text-amber-300">
            Sales Workflow
          </span>

        </div>

      </div>

      {/* ====================================================
          PIPELINE
      ==================================================== */}

      <div className="grid gap-5 p-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7">

        {stages.map((stage) => {

          const Icon = stage.icon;

          return (
            <button
              key={stage.title}
              onClick={() => navigate(stage.route)}
              className="
                group
                rounded-2xl
                border
                border-slate-700
                bg-slate-950
                p-5
                text-left
                transition-all
                duration-300
                hover:-translate-y-1
                hover:border-cyan-500/30
                hover:shadow-lg
              "
            >

              {/* ==================================================
                  WORKFLOW TYPE
              ================================================== */}

              <span
                className={`
                  inline-flex
                  rounded-full
                  px-2
                  py-1
                  text-[10px]
                  font-semibold
                  uppercase
                  tracking-wide

                  ${
                    stage.workflow === "Conversation"
                      ? "bg-blue-500/10 text-blue-300"
                      : stage.workflow === "Viewing"
                      ? "bg-violet-500/10 text-violet-300"
                      : "bg-amber-500/10 text-amber-300"
                  }
                `}
              >
                {stage.workflow}
              </span>

              {/* ==================================================
                  ICON
              ================================================== */}

              <div
                className={`
                  ${stage.color}
                  mb-4
                  mt-4
                  flex
                  h-12
                  w-12
                  items-center
                  justify-center
                  rounded-xl
                  transition-transform
                  duration-300
                  group-hover:scale-105
                `}
              >
                <Icon
                  size={22}
                  className="text-white"
                />
              </div>

              {/* ==================================================
                  STAGE
              ================================================== */}

              <h3 className="text-sm font-medium text-slate-400">
                {stage.title}
              </h3>

              {/* ==================================================
                  VALUE
              ================================================== */}

              <p className="mt-2 text-4xl font-bold text-white">
                {stage.value}
              </p>

              {/* ==================================================
                  DESCRIPTION
              ================================================== */}

              <p className="mt-3 text-sm leading-relaxed text-slate-500">
                {stage.description}
              </p>

              {/* ==================================================
                  ACTION
              ================================================== */}

              <p className="mt-4 text-xs font-medium text-cyan-400 opacity-0 transition group-hover:opacity-100">
                View stage →
              </p>

            </button>
          );

        })}

      </div>

      {/* ====================================================
          CONVERSATION WORKFLOW
      ==================================================== */}

      <div className="mx-6 mb-4 rounded-2xl border border-blue-500/20 bg-blue-500/5 p-5">

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

          <div>

            <div className="flex items-center gap-2">

              <MessageCircle
                size={18}
                className="text-blue-400"
              />

              <h3 className="font-semibold text-white">
                Conversation Workflow
              </h3>

            </div>

            <p className="mt-2 text-sm leading-relaxed text-slate-400">
              Manage customer conversations, respond to new leads,
              qualify prospects and move qualified customers into
              the viewing workflow.
            </p>

          </div>

          <button
            onClick={() => navigate("/conversations")}
            className="
              w-fit
              rounded-xl
              border
              border-blue-500/30
              bg-blue-500/10
              px-4
              py-2
              text-sm
              font-medium
              text-blue-300
              transition
              hover:bg-blue-500/20
            "
          >
            Open Conversations
          </button>

        </div>

      </div>

      {/* ====================================================
          VIEWING WORKFLOW
      ==================================================== */}

      <div className="mx-6 mb-6 rounded-2xl border border-violet-500/20 bg-violet-500/5 p-5">

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

          <div>

            <div className="flex items-center gap-2">

              <CalendarCheck
                size={18}
                className="text-violet-400"
              />

              <h3 className="font-semibold text-white">
                Viewing Workflow
              </h3>

            </div>

            <p className="mt-2 text-sm leading-relaxed text-slate-400">
              Review viewing requests, confirm appointments,
              manage reschedules and complete property visits
              before moving customers into negotiation.
            </p>

          </div>

          <button
            onClick={() => navigate("/viewings")}
            className="
              w-fit
              rounded-xl
              border
              border-violet-500/30
              bg-violet-500/10
              px-4
              py-2
              text-sm
              font-medium
              text-violet-300
              transition
              hover:bg-violet-500/20
            "
          >
            Manage Viewings
          </button>

        </div>

      </div>

      {/* ====================================================
          FOOTER
      ==================================================== */}

      <div className="flex flex-col gap-4 border-t border-slate-800 p-6 sm:flex-row sm:items-center sm:justify-between">

        <p className="max-w-3xl text-sm leading-relaxed text-slate-400">
          Focus on progressing your assigned customers from
          conversation to qualification, viewing, negotiation
          and successful property sales.
        </p>

        <div className="flex flex-wrap gap-3">

          <button
            onClick={refreshDashboard}
            className="
              flex
              items-center
              gap-2
              rounded-xl
              border
              border-slate-700
              bg-slate-800
              px-5
              py-3
              text-sm
              font-medium
              text-slate-300
              transition
              hover:bg-slate-700
            "
          >
            <RefreshCw size={16} />

            Refresh
          </button>

          <button
            onClick={() => navigate("/leads")}
            className="
              rounded-xl
              bg-cyan-500
              px-5
              py-3
              text-sm
              font-semibold
              text-slate-950
              transition
              hover:bg-cyan-400
            "
          >
            View My Leads →
          </button>

        </div>

      </div>

    </section>
  );
};

export default MyLeadPipeline;