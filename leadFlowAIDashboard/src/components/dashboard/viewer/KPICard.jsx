/**

* ==========================================================
*
* Customer-facing dashboard overview.
*
* Purpose
* ---
* Gives the viewer a quick overview of their property journey:
*
* Properties
* ```
  ↓
  ```
* Conversations
* ```
  ↓
  ```
* Viewing Request
* ```
  ↓
  ```
* Viewing Scheduled
* ```
  ↓
  ```
* Viewing Completed
*
* Viewer metrics
* ---
* ✓ Upcoming Viewings
* ✓ Today's Viewing
* ✓ Pending Viewing Requests
* ✓ Completed Viewings
* ✓ Saved Properties
* ✓ Open Conversations
*
* IMPORTANT
* ---
* This component does NOT expose:
*
* ✗ Agency revenue
* ✗ Other customers
* ✗ Agent performance
* ✗ Internal AI lead score
* ✗ Agency conversion rate
* ✗ Internal qualification data
*
* Hook
* ---
* hooks/useViewerDashboard.js
*
* ==========================================================
  */

import useViewerDashboard from "../../../hooks/useViewerDashboard";

/* ==========================================================
COMPONENT
========================================================== */

const KPICards = ({ kpis = {} }) => {

const {
summary,
loading,
error,
} = useViewerDashboard();

/* ========================================================
LOADING STATE
======================================================== */

if (loading) {


return (
  <section
    className="
      grid
      grid-cols-1
      gap-5
      sm:grid-cols-2
      xl:grid-cols-3
    "
  >

    {Array.from({ length: 6 }).map((_, index) => (

      <div
        key={index}
        className="
          animate-pulse
          rounded-2xl
          border
          border-slate-800
          bg-slate-900
          p-6
        "
      >

        <div
          className="
            h-4
            w-32
            rounded
            bg-slate-800
          "
        />

        <div
          className="
            mt-5
            h-9
            w-20
            rounded
            bg-slate-800
          "
        />

        <div
          className="
            mt-4
            h-3
            w-40
            rounded
            bg-slate-800
          "
        />

      </div>

    ))}

  </section>
);


}

/* ========================================================
ERROR STATE
======================================================== */

if (error) {


return (
  <section
    className="
      rounded-2xl
      border
      border-red-500/30
      bg-red-500/10
      p-6
      text-sm
      text-red-400
    "
  >

    Unable to load your dashboard information.

  </section>
);


}

/* ========================================================
MERGE DASHBOARD DATA
======================================================== */

const data = {
...(summary || {}),
...(kpis || {}),
};

/* ========================================================
VIEWER METRICS
======================================================== */

const metrics = [

/* ======================================================
   UPCOMING VIEWINGS
====================================================== */

{
  id: "upcoming-viewings",

  title: "Upcoming Viewings",

  value:
    data.upcomingViewings ??
    data.upcoming ??
    0,

  emoji: "📅",

  accent: "border-cyan-500",

  badge:
    "bg-cyan-500/20 text-cyan-400",

  subtitle:
    "Property viewings you have scheduled with an agent.",
},

/* ======================================================
   TODAY'S VIEWING
====================================================== */

{
  id: "today-viewing",

  title: "Today's Viewing",

  value:
    data.todayViewings ??
    data.todayViewingCount ??
    0,

  emoji: "🗓️",

  accent: "border-blue-500",

  badge:
    "bg-blue-500/20 text-blue-400",

  subtitle:
    "Viewings scheduled for today.",
},

/* ======================================================
   PENDING REQUESTS
====================================================== */

{
  id: "pending-requests",

  title: "Pending Requests",

  value:
    data.pendingViewingRequests ??
    data.pendingRequests ??
    0,

  emoji: "⏳",

  accent: "border-amber-500",

  badge:
    "bg-amber-500/20 text-amber-400",

  subtitle:
    "Viewing requests waiting for an agent response.",
},

/* ======================================================
   COMPLETED VIEWINGS
====================================================== */

{
  id: "completed-viewings",

  title: "Completed Viewings",

  value:
    data.completedViewings ??
    data.completed ??
    0,

  emoji: "✅",

  accent: "border-emerald-500",

  badge:
    "bg-emerald-500/20 text-emerald-400",

  subtitle:
    "Property viewings you have completed.",
},

/* ======================================================
   SAVED PROPERTIES
====================================================== */

{
  id: "saved-properties",

  title: "Saved Properties",

  value:
    data.savedProperties ??
    data.savedListings ??
    0,

  emoji: "❤️",

  accent: "border-rose-500",

  badge:
    "bg-rose-500/20 text-rose-400",

  subtitle:
    "Properties you have saved for later.",
},

/* ======================================================
   OPEN CONVERSATIONS
====================================================== */

{
  id: "open-conversations",

  title: "Open Conversations",

  value:
    data.openConversations ??
    data.activeConversations ??
    0,

  emoji: "💬",

  accent: "border-violet-500",

  badge:
    "bg-violet-500/20 text-violet-400",

  subtitle:
    "Active conversations with your property agents.",
},


];

/* ========================================================
RENDER
======================================================== */

return ( <section
   className="
     grid
     grid-cols-1
     gap-5
     sm:grid-cols-2
     xl:grid-cols-3
   "
 >


  {metrics.map((metric) => (

    <article
      key={metric.id}
      className={`
        rounded-2xl
        border
        border-slate-800
        border-l-4
        ${metric.accent}
        bg-slate-900
        p-6
        shadow-lg
        transition-all
        duration-300
        hover:-translate-y-1
        hover:border-cyan-500/40
      `}
    >

      {/* ==================================================
          HEADER
      =================================================== */}

      <div
        className="
          flex
          items-center
          justify-between
          gap-3
        "
      >

        <h3
          className="
            text-sm
            font-medium
            text-slate-300
          "
        >
          {metric.title}
        </h3>

        <span
          className="
            text-2xl
          "
          aria-hidden="true"
        >
          {metric.emoji}
        </span>

      </div>

      {/* ==================================================
          VALUE
      =================================================== */}

      <div className="mt-4">

        <p
          className="
            text-4xl
            font-bold
            tracking-tight
            text-white
          "
        >
          {metric.value}
        </p>

      </div>

      {/* ==================================================
          STATUS
      =================================================== */}

      <div className="mt-3">

        <span
          className={`
            inline-flex
            rounded-full
            px-2.5
            py-1
            text-xs
            font-medium
            ${metric.badge}
          `}
        >
          Your Activity
        </span>

      </div>

      {/* ==================================================
          DESCRIPTION
      =================================================== */}

      <p
        className="
          mt-4
          text-sm
          leading-relaxed
          text-slate-400
        "
      >
        {metric.subtitle}
      </p>

    </article>

  ))}

</section>


);

};

export default KPICards;
