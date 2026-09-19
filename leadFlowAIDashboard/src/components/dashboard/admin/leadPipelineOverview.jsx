/**

* ==========================================================
*
* Agency-wide CRM pipeline overview.
*
* Admin workflow:
*
* New Lead
* ↓
* Conversation
* ↓
* Contacted
* ↓
* Qualified
* ↓
* Viewing Scheduled
* ↓
* Negotiation
* ↓
* Closed
*
* Also monitors:
* ---
* • Active Conversations
* • Viewing Requests
* • Scheduled Viewings
* • Completed Viewings
*
* Used By
* ---
* • AdminDashboard.jsx
*
* Data Sources
* ---
* • usePipeline()
* • useAdminDashboard()
*
* ==========================================================
  */

import { useNavigate } from "react-router-dom";

import usePipeline from "../../../hooks/usePipeline";
import useAdminDashboard from "../../../hooks/useAdminDashboard";

/* ==========================================================
COMPONENT
========================================================== */

const LeadPipelineOverview = () => {
const navigate = useNavigate();

/* ========================================================
PIPELINE DATA
======================================================== */

const {
pipelineStages = [],
loading: pipelineLoading,
} = usePipeline();

/* ========================================================
ADMIN DASHBOARD DATA
======================================================== */

const {
summary,
loading: dashboardLoading,
} = useAdminDashboard();

/* ========================================================
LOADING
======================================================== */

if (pipelineLoading || dashboardLoading) {
return ( <section className="rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-xl"> <p className="text-sm text-slate-400">
Loading agency pipeline overview... </p> </section>
);
}

/* ========================================================
SAFE PIPELINE DATA
======================================================== */

const stages = normalizePipeline(
pipelineStages
);

/* ========================================================
TOTAL LEADS
======================================================== */

const totalLeads = stages.reduce(
(sum, stage) =>
sum + (Number(stage.value) || 0),
0
);

/* ========================================================
WORKFLOW METRICS
======================================================== */

const workflowMetrics = [
{
id: "conversations",
title: "Active Conversations",
value:
summary?.activeConversations ??
summary?.openConversations ??
0,
emoji: "💬",
accent:
"border-cyan-500/30 bg-cyan-500/5",
text:
"text-cyan-400",
action: () =>
navigate("/conversations"),
},


{
  id: "requested",
  title: "Viewing Requests",
  value:
    summary?.viewingRequests ??
    summary?.requestedViewings ??
    0,
  emoji: "📅",
  accent:
    "border-blue-500/30 bg-blue-500/5",
  text:
    "text-blue-400",
  action: () =>
    navigate("/viewings"),
},

{
  id: "upcoming",
  title: "Upcoming Viewings",
  value:
    summary?.upcomingViewings ??
    summary?.scheduledViewings ??
    0,
  emoji: "🗓️",
  accent:
    "border-violet-500/30 bg-violet-500/5",
  text:
    "text-violet-400",
  action: () =>
    navigate("/viewings/upcoming"),
},

{
  id: "completed",
  title: "Completed Viewings",
  value:
    summary?.completedViewings ??
    0,
  emoji: "✅",
  accent:
    "border-emerald-500/30 bg-emerald-500/5",
  text:
    "text-emerald-400",
  action: () =>
    navigate("/viewings"),
},


];

/* ========================================================
RENDER
======================================================== */

return ( <section
   className="
     rounded-3xl
     border
     border-slate-800
     bg-slate-900
     shadow-xl
   "
 >


  {/* ====================================================
      HEADER
  ==================================================== */}

  <div className="border-b border-slate-800 p-6">

    <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

      <div>

        <h2 className="text-xl font-bold text-white">
          📈 Agency Lead Pipeline
        </h2>

        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-400">
          Monitor the complete customer acquisition workflow from
          conversations and qualification through property viewings,
          negotiation and closed deals.
        </p>

      </div>

      {/* TOTAL LEADS */}

      <div
        className="
          w-fit
          rounded-2xl
          border
          border-cyan-500/20
          bg-cyan-500/10
          px-5
          py-3
        "
      >

        <p className="text-xs text-cyan-300">
          Total Leads
        </p>

        <p className="mt-1 text-2xl font-bold text-white">
          {totalLeads}
        </p>

      </div>

    </div>

  </div>

  {/* ====================================================
      SALES PIPELINE
  ==================================================== */}

  <div className="p-6">

    <div className="mb-4">

      <h3 className="font-semibold text-white">
        Sales Workflow
      </h3>

      <p className="mt-1 text-xs text-slate-500">
        Agency-wide progression of leads through the
        LeadFlow AI conversion process.
      </p>

    </div>

    <div
      className="
        grid
        gap-4
        md:grid-cols-2
        xl:grid-cols-6
      "
    >

      {stages.map((stage, index) => (

        <article
          key={stage.stage}
          className="
            relative
            rounded-2xl
            border
            border-slate-700
            bg-slate-950
            p-5
            transition-all
            duration-300
            hover:-translate-y-1
            hover:border-cyan-500/30
            hover:shadow-lg
          "
        >

          {/* STEP NUMBER */}

          <div
            className="
              absolute
              right-4
              top-4
              flex
              h-7
              w-7
              items-center
              justify-center
              rounded-full
              bg-slate-800
              text-xs
              font-semibold
              text-slate-400
            "
          >
            {index + 1}
          </div>

          {/* EMOJI */}

          <div className="text-3xl">
            {stage.emoji}
          </div>

          {/* TITLE */}

          <p className="mt-4 text-sm font-medium text-slate-400">
            {stage.title}
          </p>

          {/* VALUE */}

          <h3 className="mt-2 text-3xl font-bold text-white">
            {stage.value}
          </h3>

          {/* DESCRIPTION */}

          <p className="mt-2 text-xs leading-relaxed text-slate-500">
            {stage.description}
          </p>

        </article>

      ))}

    </div>

  </div>

  {/* ====================================================
      CONVERSATION + VIEWING WORKFLOW
  ==================================================== */}

  <div className="border-t border-slate-800 p-6">

    <div className="mb-4">

      <h3 className="font-semibold text-white">
        💬 Conversation & Viewing Operations
      </h3>

      <p className="mt-1 text-xs text-slate-500">
        Monitor the operational activity connecting customer
        conversations with property viewings.
      </p>

    </div>

    <div
      className="
        grid
        gap-4
        sm:grid-cols-2
        xl:grid-cols-4
      "
    >

      {workflowMetrics.map((metric) => (

        <button
          key={metric.id}
          onClick={metric.action}
          className={`
            rounded-2xl
            border
            p-5
            text-left
            transition-all
            duration-300
            hover:-translate-y-1
            hover:shadow-lg
            ${metric.accent}
          `}
        >

          <div className="flex items-center justify-between">

            <span className="text-2xl">
              {metric.emoji}
            </span>

            <span
              className={`
                text-xs
                font-medium
                ${metric.text}
              `}
            >
              View →
            </span>

          </div>

          <p className="mt-4 text-sm font-medium text-slate-400">
            {metric.title}
          </p>

          <p className="mt-2 text-3xl font-bold text-white">
            {metric.value}
          </p>

        </button>

      ))}

    </div>

  </div>

  {/* ====================================================
      WORKFLOW EXPLANATION
  ==================================================== */}

  <div
    className="
      border-t
      border-slate-800
      bg-slate-950/50
      p-6
    "
  >

    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

      <div>

        <p className="text-sm font-semibold text-cyan-300">
          LeadFlow AI Workflow
        </p>

        <p className="mt-2 text-sm leading-relaxed text-slate-400">
          Customer conversations create opportunities, qualified
          leads can progress to scheduled property viewings, and
          completed viewings can move prospects into negotiation
          and eventually closed deals.
        </p>

      </div>

      <div className="flex flex-wrap gap-3">

        <button
          onClick={() =>
            navigate("/conversations")
          }
          className="
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
          View Conversations
        </button>

        <button
          onClick={() =>
            navigate("/viewings")
          }
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
          Manage Viewings →
        </button>

      </div>

    </div>

  </div>

</section>


);
};

/* ==========================================================
NORMALIZE PIPELINE
========================================================== */

const normalizePipeline = (pipelineStages = []) => {

const defaults = [
{
stage: "new",
title: "New Leads",
emoji: "📩",
value: 0,
description:
"New customer opportunities entering the agency.",
},


{
  stage: "contacted",
  title: "Contacted",
  emoji: "📞",
  value: 0,
  description:
    "Leads that have received initial agent contact.",
},

{
  stage: "qualified",
  title: "Qualified",
  emoji: "🤖",
  value: 0,
  description:
    "Leads qualified through the LeadFlow AI workflow.",
},

{
  stage: "viewingScheduled",
  title: "Viewing Scheduled",
  emoji: "📅",
  value: 0,
  description:
    "Qualified customers with a property viewing scheduled.",
},

{
  stage: "negotiation",
  title: "Negotiation",
  emoji: "🤝",
  value: 0,
  description:
    "Customers actively negotiating property terms.",
},

{
  stage: "closed",
  title: "Closed",
  emoji: "🏠",
  value: 0,
  description:
    "Successfully converted property transactions.",
},


];

if (!Array.isArray(pipelineStages)) {
return defaults;
}

return defaults.map((defaultStage) => {


const matchingStage =
  pipelineStages.find(
    (stage) =>
      stage?.stage === defaultStage.stage ||
      stage?.key === defaultStage.stage ||
      stage?.id === defaultStage.stage
  );

return {
  ...defaultStage,
  ...matchingStage,
  value:
    matchingStage?.value ??
    defaultStage.value,
  title:
    matchingStage?.title ??
    defaultStage.title,
  emoji:
    matchingStage?.emoji ??
    defaultStage.emoji,
  description:
    matchingStage?.description ??
    defaultStage.description,
};


});
};

export default LeadPipelineOverview;
