/**

* ==========================================================
*
* Executive KPI overview for LeadFlow AI administrators.
*
* Covers
* ---
* ✓ Agency leads
* ✓ Active agents
* ✓ Properties
* ✓ Conversations
* ✓ Unread conversations
* ✓ Pending follow-ups
* ✓ AI qualification
* ✓ Today's viewings
* ✓ Upcoming viewings
* ✓ Pending viewing requests
* ✓ Completed viewings
* ✓ Missed viewings
* ✓ Closed deals
* ✓ Agency revenue
*
* Backend
* ---
* GET /api/dashboard/admin/summary
*
* Hook
* ---
* hooks/useAdminDashboard.js
*
* ==========================================================
  */

import useAdminDashboard from "../../../hooks/useAdminDashboard";

/* ==========================================================
COMPONENT
========================================================== */

const KPICards = () => {

const {
summary,
loading,
error,
} = useAdminDashboard();

/* ========================================================
LOADING
======================================================== */

if (loading) {
return ( <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
{Array.from({ length: 12 }).map((_, index) => ( <div
         key={index}
         className="
           animate-pulse
           rounded-2xl
           border
           border-slate-800
           bg-slate-900
           p-6
         "
       > <div className="h-4 w-32 rounded bg-slate-800" />


        <div className="mt-5 h-8 w-20 rounded bg-slate-800" />

        <div className="mt-4 h-3 w-40 rounded bg-slate-800" />
      </div>
    ))}
  </section>
);


}

/* ========================================================
ERROR
======================================================== */

if (error) {
return ( <section
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
Unable to load agency KPI metrics. </section>
);
}

/* ========================================================
METRICS
======================================================== */

const metrics = [


/* ======================================================
   LEADS
====================================================== */

{
  id: "agency-leads",
  title: "Agency Leads",
  value: summary?.totalLeads ?? 0,
  emoji: "📩",
  accent: "border-blue-500",
  badge: "bg-blue-500/20 text-blue-400",
  subtitle:
    "Total leads captured across the agency.",
},

/* ======================================================
   AGENTS
====================================================== */

{
  id: "active-agents",
  title: "Active Agents",
  value: summary?.activeAgents ?? 0,
  emoji: "👥",
  accent: "border-emerald-500",
  badge: "bg-emerald-500/20 text-emerald-400",
  subtitle:
    "Agents currently serving customers.",
},

/* ======================================================
   PROPERTIES
====================================================== */

{
  id: "properties",
  title: "Properties Listed",
  value: summary?.properties ?? 0,
  emoji: "🏠",
  accent: "border-orange-500",
  badge: "bg-orange-500/20 text-orange-400",
  subtitle:
    "Properties currently managed by the agency.",
},

/* ======================================================
   OPEN CONVERSATIONS
====================================================== */

{
  id: "open-conversations",
  title: "Open Conversations",
  value:
    summary?.activeConversations ??
    summary?.openConversations ??
    0,
  emoji: "💬",
  accent: "border-cyan-500",
  badge: "bg-cyan-500/20 text-cyan-400",
  subtitle:
    "Customer conversations currently active.",
},

/* ======================================================
   UNREAD CONVERSATIONS
====================================================== */

{
  id: "unread-conversations",
  title: "Unread Conversations",
  value:
    summary?.unreadConversations ??
    0,
  emoji: "🔔",
  accent: "border-red-500",
  badge: "bg-red-500/20 text-red-400",
  subtitle:
    "Customer conversations requiring attention.",
},

/* ======================================================
   PENDING FOLLOW-UPS
====================================================== */

{
  id: "pending-followups",
  title: "Pending Follow-ups",
  value:
    summary?.pendingFollowUps ??
    0,
  emoji: "⏰",
  accent: "border-yellow-500",
  badge: "bg-yellow-500/20 text-yellow-400",
  subtitle:
    "Follow-ups awaiting agent action.",
},

/* ======================================================
   AI QUALIFICATION
====================================================== */

{
  id: "qualification-rate",
  title: "AI Qualification",
  value:
    `${summary?.qualificationRate ?? 0}%`,
  emoji: "🤖",
  accent: "border-violet-500",
  badge: "bg-violet-500/20 text-violet-400",
  subtitle:
    "Leads successfully qualified by AI.",
},

/* ======================================================
   PENDING VIEWING REQUESTS
====================================================== */

{
  id: "pending-viewings",
  title: "Viewing Requests",
  value:
    summary?.pendingViewingRequests ??
    summary?.pendingViewings ??
    0,
  emoji: "📅",
  accent: "border-amber-500",
  badge: "bg-amber-500/20 text-amber-400",
  subtitle:
    "Viewing requests awaiting agent approval.",
},

/* ======================================================
   TODAY'S VIEWINGS
====================================================== */

{
  id: "today-viewings",
  title: "Today's Viewings",
  value:
    summary?.todayViewings ??
    0,
  emoji: "🗓️",
  accent: "border-cyan-500",
  badge: "bg-cyan-500/20 text-cyan-400",
  subtitle:
    "Property viewings scheduled for today.",
},

/* ======================================================
   UPCOMING VIEWINGS
====================================================== */

{
  id: "upcoming-viewings",
  title: "Upcoming Viewings",
  value:
    summary?.upcomingViewings ??
    0,
  emoji: "📆",
  accent: "border-indigo-500",
  badge: "bg-indigo-500/20 text-indigo-400",
  subtitle:
    "Future approved property viewings.",
},

/* ======================================================
   COMPLETED VIEWINGS
====================================================== */

{
  id: "completed-viewings",
  title: "Completed Viewings",
  value:
    summary?.completedViewings ??
    0,
  emoji: "✅",
  accent: "border-green-500",
  badge: "bg-green-500/20 text-green-400",
  subtitle:
    "Viewings successfully completed by agents.",
},

/* ======================================================
   MISSED VIEWINGS
====================================================== */

{
  id: "missed-viewings",
  title: "Missed Viewings",
  value:
    summary?.missedViewings ??
    0,
  emoji: "⚠️",
  accent: "border-red-500",
  badge: "bg-red-500/20 text-red-400",
  subtitle:
    "Scheduled viewings that were not completed.",
},

/* ======================================================
   CLOSED DEALS
====================================================== */

{
  id: "closed-deals",
  title: "Closed Deals",
  value:
    summary?.closedDeals ??
    0,
  emoji: "🏆",
  accent: "border-pink-500",
  badge: "bg-pink-500/20 text-pink-400",
  subtitle:
    "Successful transactions completed.",
},

/* ======================================================
   REVENUE
====================================================== */

{
  id: "agency-revenue",
  title: "Agency Revenue",
  value:
    `KES ${
      summary?.revenue?.toLocaleString?.() ??
      0
    }`,
  emoji: "💰",
  accent: "border-green-500",
  badge: "bg-green-500/20 text-green-400",
  subtitle:
    "Revenue generated from completed deals.",
},

/* ======================================================
   VIEWING CONVERSION
====================================================== */

{
  id: "viewing-conversion",
  title: "Viewing Conversion",
  value:
    `${summary?.viewingConversionRate ?? 0}%`,
  emoji: "📈",
  accent: "border-teal-500",
  badge: "bg-teal-500/20 text-teal-400",
  subtitle:
    "Qualified leads progressing to property viewings.",
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
     xl:grid-cols-4
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

      <div className="flex items-center justify-between">

        <h3
          className="
            text-sm
            font-medium
            text-slate-300
          "
        >
          {metric.title}
        </h3>

        <span className="text-2xl">
          {metric.emoji}
        </span>

      </div>

      {/* ==================================================
          VALUE
      =================================================== */}

      <div className="mt-4">

        <p
          className="
            text-3xl
            font-bold
            tracking-tight
            text-white
          "
        >
          {metric.value}
        </p>

      </div>

      {/* ==================================================
          LIVE STATUS
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
          Live Metric
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
