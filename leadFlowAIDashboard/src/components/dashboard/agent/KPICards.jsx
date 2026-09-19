/**

* ==========================================================
*
* Agent-facing performance and workload overview.
*
* Workflow
* ---
* Lead
* ↓
* Qualified
* ↓
* Conversation
* ↓
* Viewing Requested
* ↓
* Viewing Scheduled
* ↓
* Negotiation
* ↓
* Closed
*
* Hook
* ---
* hooks/useDashboard.js
*
* ==========================================================
  */

import useDashboard from "../../../hooks/useDashboard";

const KPICards = ({ kpis = {} }) => {

const {
summary,
loading,
error,
} = useDashboard();

/* ========================================================
LOADING
======================================================== */

if (loading) {
return ( <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
{Array.from({ length: 9 }).map((_, index) => ( <div
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


        <div className="mt-5 h-9 w-20 rounded bg-slate-800" />

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
Unable to load agent dashboard metrics. </section>
);
}

/* ========================================================
MERGE KPI SOURCES
======================================================== */

const data = {
...summary,
...kpis,
};

/* ========================================================
METRICS
======================================================== */

const metrics = [


/* ======================================================
   LEADS
====================================================== */

{
  id: "total-leads",
  title: "Total Leads",
  value: data.totalLeads ?? 0,
  emoji: "📩",
  accent: "border-blue-500",
  badge: "bg-blue-500/20 text-blue-400",
  subtitle:
    "Leads currently assigned or visible to you.",
},

/* ======================================================
   QUALIFIED LEADS
====================================================== */

{
  id: "qualified-leads",
  title: "Qualified Leads",
  value: data.qualifiedLeads ?? 0,
  emoji: "🤖",
  accent: "border-emerald-500",
  badge: "bg-emerald-500/20 text-emerald-400",
  subtitle:
    "Prospects that AI or an agent has qualified.",
},

/* ======================================================
   HOT LEADS
====================================================== */

{
  id: "hot-leads",
  title: "Hot Leads",
  value: data.hotLeads ?? 0,
  emoji: "🔥",
  accent: "border-orange-500",
  badge: "bg-orange-500/20 text-orange-400",
  subtitle:
    "High-priority prospects requiring immediate attention.",
},

/* ======================================================
   OPEN CONVERSATIONS
====================================================== */

{
  id: "open-conversations",
  title: "Open Conversations",
  value:
    data.activeConversations ??
    data.openConversations ??
    0,
  emoji: "💬",
  accent: "border-cyan-500",
  badge: "bg-cyan-500/20 text-cyan-400",
  subtitle:
    "Customer conversations currently requiring attention.",
},

/* ======================================================
   UNREAD CONVERSATIONS
====================================================== */

{
  id: "unread-conversations",
  title: "Unread",
  value:
    data.unreadConversations ??
    data.unreadCount ??
    0,
  emoji: "🔔",
  accent: "border-red-500",
  badge: "bg-red-500/20 text-red-400",
  subtitle:
    "Customer messages waiting for your response.",
},

/* ======================================================
   PENDING VIEWING REQUESTS
====================================================== */

{
  id: "pending-viewing-requests",
  title: "Viewing Requests",
  value:
    data.pendingViewingRequests ??
    data.pendingViewings ??
    0,
  emoji: "📅",
  accent: "border-amber-500",
  badge: "bg-amber-500/20 text-amber-400",
  subtitle:
    "Customers waiting for a viewing decision.",
},

/* ======================================================
   TODAY'S VIEWINGS
====================================================== */

{
  id: "today-viewings",
  title: "Today's Viewings",
  value:
    data.todayViewings ??
    0,
  emoji: "🗓️",
  accent: "border-blue-500",
  badge: "bg-blue-500/20 text-blue-400",
  subtitle:
    "Property viewings scheduled for today.",
},

/* ======================================================
   UPCOMING VIEWINGS
====================================================== */

{
  id: "upcoming-viewings",
  title: "Upcoming",
  value:
    data.upcomingViewings ??
    0,
  emoji: "📆",
  accent: "border-indigo-500",
  badge: "bg-indigo-500/20 text-indigo-400",
  subtitle:
    "Approved viewings coming up for your leads.",
},

/* ======================================================
   COMPLETED VIEWINGS
====================================================== */

{
  id: "completed-viewings",
  title: "Completed Viewings",
  value:
    data.completedViewings ??
    0,
  emoji: "✅",
  accent: "border-green-500",
  badge: "bg-green-500/20 text-green-400",
  subtitle:
    "Viewings successfully completed.",
},

/* ======================================================
   MISSED VIEWINGS
====================================================== */

{
  id: "missed-viewings",
  title: "Missed Viewings",
  value:
    data.missedViewings ??
    0,
  emoji: "⚠️",
  accent: "border-red-500",
  badge: "bg-red-500/20 text-red-400",
  subtitle:
    "Scheduled viewings that were not completed.",
},

/* ======================================================
   PENDING FOLLOW-UPS
====================================================== */

{
  id: "pending-followups",
  title: "Pending Follow-ups",
  value:
    data.pendingFollowUps ??
    0,
  emoji: "⏰",
  accent: "border-yellow-500",
  badge: "bg-yellow-500/20 text-yellow-400",
  subtitle:
    "Customer follow-ups awaiting your action.",
},

/* ======================================================
   CONVERSION RATE
====================================================== */

{
  id: "conversion-rate",
  title: "Conversion Rate",
  value:
    `${data.conversionRate ?? 0}%`,
  emoji: "📈",
  accent: "border-violet-500",
  badge: "bg-violet-500/20 text-violet-400",
  subtitle:
    "Percentage of assigned leads converted into closed deals.",
},

/* ======================================================
   VIEWING CONVERSION
====================================================== */

{
  id: "viewing-conversion",
  title: "Viewing Conversion",
  value:
    `${data.viewingConversionRate ?? 0}%`,
  emoji: "🎯",
  accent: "border-teal-500",
  badge: "bg-teal-500/20 text-teal-400",
  subtitle:
    "Qualified leads progressing into property viewings.",
},

/* ======================================================
   CLOSED LEADS
====================================================== */

{
  id: "closed-leads",
  title: "Closed Leads",
  value:
    data.closedLeads ??
    data.closedDeals ??
    0,
  emoji: "🏠",
  accent: "border-pink-500",
  badge: "bg-pink-500/20 text-pink-400",
  subtitle:
    "Successfully converted customers.",
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
