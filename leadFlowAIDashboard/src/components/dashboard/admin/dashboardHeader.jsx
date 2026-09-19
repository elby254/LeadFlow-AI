/**

* ==========================================================
*
* Responsibilities
* ---
* ✓ Agency overview
* ✓ Global search
* ✓ Conversation activity
* ✓ Today's viewings
* ✓ Upcoming viewings
* ✓ Pending viewing requests
* ✓ Refresh dashboard
* ✓ Export reports
* ✓ System status
* ✓ AI Engine health
*
* Used By
* ---
* ✓ AdminDashboard.jsx
*
* Admin-side workflows
* ---
* Conversation Center
* Viewing Management
* Lead Pipeline
* AI Operations
*
* ==========================================================
  */

import { useState } from "react";

import {
RefreshCw,
Download,
Search,
Activity,
BrainCircuit,
CalendarDays,
Clock3,
MessageSquare,
} from "lucide-react";

/* ==========================================================
COMPONENT
========================================================== */

const DashboardHeader = ({
title = "Admin Workspace",

subtitle =
"Monitor agency performance, conversations, viewings, AI operations and team productivity.",

onRefresh,

onSearch,

onExport,

// --------------------------------------------------------
// VIEWING WORKFLOW
// --------------------------------------------------------

todaysViewings = 0,

upcomingViewings = 0,

pendingViewings = 0,

// --------------------------------------------------------
// CONVERSATION WORKFLOW
// --------------------------------------------------------

activeConversations = 0,

unreadConversations = 0,

// --------------------------------------------------------
// SYSTEM STATUS
// --------------------------------------------------------

systemHealthy = true,

aiEngineOnline = true,
}) => {

const [search, setSearch] = useState("");

/* ========================================================
SEARCH
======================================================== */

const handleSearchChange = (event) => {


const value =
  event.target.value;

setSearch(value);

onSearch?.(value);


};

/* ========================================================
REFRESH
======================================================== */

const handleRefresh = () => {


if (onRefresh) {

  onRefresh();

  return;

}

window.location.reload();


};

/* ========================================================
EXPORT
======================================================== */

const handleExport = () => {


if (onExport) {

  onExport();

  return;

}

console.log(
  "Admin reports export requested."
);


};

/* ========================================================
RENDER
======================================================== */

return (


<header className="w-full">

  {/* ====================================================
      TOP SECTION
  ==================================================== */}

  <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">

    {/* ==================================================
        TITLE
    ================================================== */}

    <div>

      <h1 className="text-3xl font-bold text-white">
        {title}
      </h1>

      <p className="mt-3 max-w-3xl text-slate-400">
        {subtitle}
      </p>

    </div>

    {/* ==================================================
        SYSTEM STATUS
    ================================================== */}

    <div className="flex flex-wrap gap-3">

      {/* SYSTEM */}

      <StatusPill
        icon={<Activity size={16} />}
        label={
          systemHealthy
            ? "System Healthy"
            : "System Attention"
        }
        healthy={systemHealthy}
        healthyClass="emerald"
      />

      {/* AI */}

      <StatusPill
        icon={
          <BrainCircuit size={16} />
        }
        label={
          aiEngineOnline
            ? "AI Engine Online"
            : "AI Engine Offline"
        }
        healthy={aiEngineOnline}
        healthyClass="cyan"
      />

    </div>

  </div>

  {/* ====================================================
      ADMIN WORKFLOW SUMMARY
  ==================================================== */}

  <div className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4">

    {/* TODAY'S VIEWINGS */}

    <WorkflowCard
      icon={
        <CalendarDays size={18} />
      }
      label="Today's Viewings"
      value={todaysViewings}
      color="blue"
    />

    {/* UPCOMING */}

    <WorkflowCard
      icon={
        <Clock3 size={18} />
      }
      label="Upcoming"
      value={upcomingViewings}
      color="purple"
    />

    {/* PENDING REQUESTS */}

    <WorkflowCard
      icon={
        <CalendarDays size={18} />
      }
      label="Pending Viewings"
      value={pendingViewings}
      color="amber"
    />

    {/* CONVERSATIONS */}

    <WorkflowCard
      icon={
        <MessageSquare size={18} />
      }
      label="Active Conversations"
      value={activeConversations}
      secondary={
        unreadConversations > 0
          ? `${unreadConversations} unread`
          : "All read"
      }
      color="emerald"
    />

  </div>

  {/* ====================================================
      SEARCH + ADMIN ACTIONS
  ==================================================== */}

  <div className="mt-6 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">

    {/* ==================================================
        GLOBAL SEARCH
    ================================================== */}

    <div className="relative w-full xl:max-w-xl">

      <Search
        size={18}
        className="
          absolute
          left-4
          top-1/2
          -translate-y-1/2
          text-slate-500
        "
      />

      <input
        type="text"
        value={search}
        onChange={handleSearchChange}
        placeholder="
          Search leads, agents, properties,
          conversations or viewings...
        "
        className="
          w-full
          rounded-xl
          border
          border-slate-700
          bg-slate-800
          py-3
          pl-11
          pr-4
          text-white
          placeholder:text-slate-500
          outline-none
          transition
          focus:border-cyan-500
          focus:ring-2
          focus:ring-cyan-500/20
        "
      />

    </div>

    {/* ==================================================
        ADMIN ACTIONS
    ================================================== */}

    <div className="flex flex-wrap gap-3">

      {/* REFRESH */}

      <button
        type="button"
        onClick={handleRefresh}
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
          hover:border-cyan-500/40
          hover:bg-slate-700
        "
      >

        <RefreshCw size={17} />

        Refresh

      </button>

      {/* EXPORT */}

      <button
        type="button"
        onClick={handleExport}
        className="
          flex
          items-center
          gap-2
          rounded-xl
          bg-cyan-600
          px-5
          py-3
          text-sm
          font-semibold
          text-white
          transition
          hover:bg-cyan-500
        "
      >

        <Download size={17} />

        Export Reports

      </button>

    </div>

  </div>

</header>


);

};

/* ==========================================================
STATUS PILL
========================================================== */

const StatusPill = ({
icon,
label,
healthy,
healthyClass = "emerald",
}) => {

const styles = {


emerald: {
  container:
    "border-emerald-500/30 bg-emerald-500/15 text-emerald-400",
},

cyan: {
  container:
    "border-cyan-500/30 bg-cyan-500/15 text-cyan-400",
},


};

const activeStyle =
styles[healthyClass] ||
styles.emerald;

const inactiveStyle = {
container:
"border-red-500/30 bg-red-500/15 text-red-400",
};

const selectedStyle =
healthy
? activeStyle
: inactiveStyle;

return (


<div
  className={`
    flex
    items-center
    gap-2
    rounded-full
    border
    px-4
    py-2
    text-sm
    font-medium
    ${selectedStyle.container}
  `}
>

  {icon}

  {label}

</div>


);

};

/* ==========================================================
WORKFLOW CARD
========================================================== */

const WorkflowCard = ({
icon,
label,
value,
secondary,
color = "emerald",
}) => {

const colors = {


blue:
  "border-blue-500/20 bg-blue-500/10 text-blue-400",

purple:
  "border-purple-500/20 bg-purple-500/10 text-purple-400",

amber:
  "border-amber-500/20 bg-amber-500/10 text-amber-400",

emerald:
  "border-emerald-500/20 bg-emerald-500/10 text-emerald-400",


};

return (


<div
  className={`
    rounded-xl
    border
    bg-slate-900/60
    p-4
    transition
    hover:bg-slate-800
    ${colors[color] || colors.emerald}
  `}
>

  <div className="flex items-center justify-between">

    <div className="flex items-center gap-2">

      {icon}

      <span className="text-xs font-medium text-slate-400">
        {label}
      </span>

    </div>

  </div>

  <div className="mt-2 flex items-end justify-between">

    <span className="text-2xl font-bold text-white">
      {value}
    </span>

    {secondary && (

      <span className="text-xs text-slate-500">
        {secondary}
      </span>

    )}

  </div>

</div>


);

};

export default DashboardHeader;
