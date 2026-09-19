/**
 * 
 * Gives the sales agent an instant overview of today's workload.
 *
 * Shows:
 *
 * • Today's Follow-ups
 * • Scheduled Calls
 * • Overdue Tasks
 * • Property Viewings Today
 *
 * Future Backend
 * --------------
 * GET /api/agent/today-work
 *
 * {
 *   followUpsToday: 8,
 *   scheduledCalls: 5,
 *   overdueTasks: 2,
 *   viewingsToday: 3
 * }
 *
 * ==========================================================
 */

import {
  CalendarClock,
  PhoneCall,
  AlertTriangle,
  Building2,
} from "lucide-react";

import { useEffect, useState } from "react";

const TodayWork = () => {

  const [today, setToday] = useState({
    followUpsToday: 0,
    scheduledCalls: 0,
    overdueTasks: 0,
    viewingsToday: 0,
  });

  //--------------------------------------------------------

  useEffect(() => {

    /**
     * Temporary mock data.
     *
     * Replace with:
     *
     * const data = await getTodayWork();
     * setToday(data);
     *
     */

    setToday({

      followUpsToday: 8,

      scheduledCalls: 5,

      overdueTasks: 2,

      viewingsToday: 3,

    });

  }, []);

  //--------------------------------------------------------

  const cards = [

    {
      title: "Today's Follow-ups",
      value: today.followUpsToday,
      icon: CalendarClock,
      color:
        "bg-cyan-500/15 text-cyan-300 border-cyan-500/20",
    },

    {
      title: "Scheduled Calls",
      value: today.scheduledCalls,
      icon: PhoneCall,
      color:
        "bg-emerald-500/15 text-emerald-300 border-emerald-500/20",
    },

    {
      title: "Overdue Tasks",
      value: today.overdueTasks,
      icon: AlertTriangle,
      color:
        "bg-red-500/15 text-red-300 border-red-500/20",
    },

    {
      title: "Property Viewings",
      value: today.viewingsToday,
      icon: Building2,
      color:
        "bg-orange-500/15 text-orange-300 border-orange-500/20",
    },

  ];

  //--------------------------------------------------------

  return (

    <section
      className="
        rounded-3xl
        border
        border-slate-800
        bg-slate-900
        shadow-xl
      "
    >

      {/* Header */}

      <div
        className="
          border-b
          border-slate-800
          p-6
        "
      >

        <h2
          className="
            text-2xl
            font-bold
            text-white
          "
        >
          Today's Work
        </h2>

        <p
          className="
            mt-2
            text-sm
            text-slate-400
          "
        >
          Your workload for today.
        </p>

      </div>

      {/* Cards */}

      <div
        className="
          grid
          gap-5
          p-6
          md:grid-cols-2
          xl:grid-cols-4
        "
      >

        {cards.map((card) => {

          const Icon = card.icon;

          return (

            <div
              key={card.title}
              className={`
                rounded-2xl
                border
                p-5
                transition
                hover:scale-[1.02]
                ${card.color}
              `}
            >

              <div className="flex items-center justify-between">

                <div>

                  <p
                    className="
                      text-sm
                      font-medium
                      opacity-80
                    "
                  >
                    {card.title}
                  </p>

                  <h3
                    className="
                      mt-3
                      text-4xl
                      font-bold
                    "
                  >
                    {card.value}
                  </h3>

                </div>

                <div
                  className="
                    rounded-xl
                    bg-slate-900/40
                    p-3
                  "
                >
                  <Icon size={28} />
                </div>

              </div>

            </div>

          );

        })}

      </div>

    </section>

  );

};

export default TodayWork;