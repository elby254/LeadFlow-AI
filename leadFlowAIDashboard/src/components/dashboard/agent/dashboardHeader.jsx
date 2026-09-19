/**

* ==========================================================
*
* LeadFlow AI
* Agent Dashboard Header
*
* Agent-side identity + control panel.
*
* Responsibilities
* ---
* ✓ Agency context
* ✓ Kenya market context
* ✓ Global agent search
* ✓ Conversation activity
* ✓ Today's viewings
* ✓ Upcoming viewings
* ✓ Pending viewing requests
* ✓ Conversation Center navigation
* ✓ Viewing Calendar navigation
* ✓ New Lead navigation
* ✓ Dashboard refresh
*
* Used By
* ---
* ✓ Agent Dashboard
*
* ==========================================================
  */

import { useState } from "react";

import {
RefreshCw,
Plus,
Search,
MessageSquare,
CalendarDays,
Clock3,
Bell,
} from "lucide-react";

import { useNavigate } from "react-router-dom";

/* ==========================================================
COMPONENT
========================================================== */

const DashboardHeader = ({
todaysViewings = 0,
upcomingViewings = 0,
pendingViewings = 0,
unreadConversations = 0,
activeConversations = 0,
}) => {

const [search, setSearch] =
useState("");

const navigate =
useNavigate();

/* ========================================================
REFRESH
======================================================== */

const handleRefresh = () => {


window.location.reload();


};

/* ========================================================
NEW LEAD
======================================================== */

const handleNewLead = () => {


navigate("/lead/new");


};

/* ========================================================
OPEN CONVERSATIONS
======================================================== */

const handleConversations = () => {


navigate("/conversations");


};

/* ========================================================
OPEN VIEWING CALENDAR
======================================================== */

const handleViewingCalendar = () => {


navigate("/viewings");


};

/* ========================================================
SEARCH
======================================================== */

const handleSearch = (event) => {


const value =
  event.target.value;

setSearch(value);


};

const handleSearchSubmit = (event) => {


event.preventDefault();

const query =
  search.trim();

if (!query) return;

navigate(
  `/search?q=${encodeURIComponent(query)}`
);


};

/* ========================================================
RENDER
======================================================== */

return (


<header
  className="
    rounded-3xl
    border
    border-slate-800
    bg-slate-900/80
    p-6
    shadow-2xl
    backdrop-blur-xl
    md:p-8
  "
>

  {/* ====================================================
      TOP ROW
  ==================================================== */}

  <div
    className="
      flex
      flex-col
      gap-5
      lg:flex-row
      lg:items-center
      lg:justify-between
    "
  >

    {/* ==================================================
        IDENTITY
    ================================================== */}

    <div>

      <div className="flex items-center gap-3">

        <h1
          className="
            text-2xl
            font-bold
            text-white
            md:text-3xl
          "
        >
          📊 LeadFlow AI
        </h1>

      </div>

      <p
        className="
          mt-2
          max-w-2xl
          text-sm
          text-slate-400
          md:text-base
        "
      >
        Real-time customer acquisition,
        conversation and property viewing
        workspace for real estate agents.
      </p>

    </div>

    {/* ==================================================
        CONTEXT
    ================================================== */}

    <div className="flex flex-wrap gap-3">

      {/* SYSTEM */}

      <span
        className="
          inline-flex
          items-center
          gap-2
          rounded-full
          border
          border-emerald-500/30
          bg-emerald-500/20
          px-4
          py-2
          text-sm
          font-medium
          text-emerald-400
        "
      >

        <span className="h-2 w-2 rounded-full bg-emerald-400" />

        System Active

      </span>

      {/* MARKET */}

      <span
        className="
          rounded-full
          border
          border-blue-500/30
          bg-blue-500/20
          px-4
          py-2
          text-sm
          font-medium
          text-blue-400
        "
      >
        Kenya Market Mode 🇰🇪
      </span>

    </div>

  </div>

  {/* ====================================================
      WORKFLOW SUMMARY
  ==================================================== */}

  <div
    className="
      mt-7
      grid
      grid-cols-2
      gap-3
      md:grid-cols-4
    "
  >

    {/* TODAY */}

    <WorkflowCard
      icon={<CalendarDays size={17} />}
      label="Today's Viewings"
      value={todaysViewings}
      color="blue"
      onClick={handleViewingCalendar}
    />

    {/* UPCOMING */}

    <WorkflowCard
      icon={<Clock3 size={17} />}
      label="Upcoming"
      value={upcomingViewings}
      color="purple"
      onClick={handleViewingCalendar}
    />

    {/* PENDING */}

    <WorkflowCard
      icon={<Bell size={17} />}
      label="Viewing Requests"
      value={pendingViewings}
      color="amber"
      onClick={handleViewingCalendar}
    />

    {/* CONVERSATIONS */}

    <WorkflowCard
      icon={<MessageSquare size={17} />}
      label="Conversations"
      value={activeConversations}
      secondary={
        unreadConversations > 0
          ? `${unreadConversations} unread`
          : "All read"
      }
      color="emerald"
      onClick={handleConversations}
    />

  </div>

  {/* ====================================================
      SEARCH + ACTIONS
  ==================================================== */}

  <div
    className="
      mt-7
      flex
      flex-col
      gap-4
      lg:flex-row
      lg:items-center
      lg:justify-between
    "
  >

    {/* ==================================================
        SEARCH
    ================================================== */}

    <form
      onSubmit={handleSearchSubmit}
      className="relative w-full lg:max-w-xl"
    >

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
        onChange={handleSearch}
        placeholder="
          Search leads, conversations,
          properties or viewings...
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
          focus:border-blue-500
          focus:ring-2
          focus:ring-blue-500/20
        "
      />

    </form>

    {/* ==================================================
        ACTIONS
    ================================================== */}

    <div
      className="
        flex
        flex-wrap
        gap-3
      "
    >

      {/* CONVERSATIONS */}

      <button
        type="button"
        onClick={handleConversations}
        className="
          inline-flex
          items-center
          gap-2
          rounded-xl
          border
          border-slate-700
          bg-slate-800
          px-4
          py-3
          text-sm
          font-medium
          text-slate-300
          transition
          hover:border-emerald-500/40
          hover:bg-slate-700
          hover:text-white
        "
      >

        <MessageSquare size={17} />

        Conversations

        {unreadConversations > 0 && (

          <span
            className="
              flex
              h-5
              min-w-5
              items-center
              justify-center
              rounded-full
              bg-emerald-600
              px-1.5
              text-[10px]
              font-bold
              text-white
            "
          >
            {unreadConversations}
          </span>

        )}

      </button>

      {/* VIEWINGS */}

      <button
        type="button"
        onClick={handleViewingCalendar}
        className="
          inline-flex
          items-center
          gap-2
          rounded-xl
          border
          border-slate-700
          bg-slate-800
          px-4
          py-3
          text-sm
          font-medium
          text-slate-300
          transition
          hover:border-blue-500/40
          hover:bg-slate-700
          hover:text-white
        "
      >

        <CalendarDays size={17} />

        Viewings

      </button>

      {/* REFRESH */}

      <button
        type="button"
        onClick={handleRefresh}
        className="
          inline-flex
          items-center
          gap-2
          rounded-xl
          border
          border-slate-700
          bg-slate-800
          px-4
          py-3
          text-sm
          font-medium
          text-slate-300
          transition
          hover:bg-slate-700
        "
      >

        <RefreshCw size={17} />

        Refresh

      </button>

      {/* NEW LEAD */}

      <button
        type="button"
        onClick={handleNewLead}
        className="
          inline-flex
          items-center
          gap-2
          rounded-xl
          bg-blue-600
          px-5
          py-3
          text-sm
          font-semibold
          text-white
          transition
          hover:bg-blue-500
        "
      >

        <Plus size={17} />

        New Lead

      </button>

    </div>

  </div>

</header>


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
color,
onClick,
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


<button
  type="button"
  onClick={onClick}
  className={`
    w-full
    rounded-2xl
    border
    p-4
    text-left
    transition
    hover:-translate-y-0.5
    hover:bg-slate-800
    ${colors[color] || colors.blue}
  `}
>

  <div className="flex items-center gap-2">

    {icon}

    <span
      className="
        text-xs
        font-medium
        text-slate-400
      "
    >
      {label}
    </span>

  </div>

  <div
    className="
      mt-2
      flex
      items-end
      justify-between
      gap-2
    "
  >

    <span
      className="
        text-2xl
        font-bold
        text-white
      "
    >
      {value}
    </span>

    {secondary && (

      <span
        className="
          text-[11px]
          text-slate-500
        "
      >
        {secondary}
      </span>

    )}

  </div>

</button>


);

};

export default DashboardHeader;
