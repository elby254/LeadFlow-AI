/**
 * ==========================================================
 * Executive summary for Viewer Dashboard.
 *
 * Displays today's business performance.
 *
 * Future Backend
 * --------------
 * GET /api/viewer/business-snapshot
 *
 * ==========================================================
 */

import { useEffect, useState } from "react";

import {
  Users,
  BadgeCheck,
  UserCheck,
  Building2,
} from "lucide-react";

const BusinessSnapshot = () => {

  const [snapshot, setSnapshot] = useState({

    todaysLeads: 0,

    qualifiedToday: 0,

    activeAgents: 0,

    listingsAvailable: 0,

  });

  //--------------------------------------------------------

  useEffect(() => {

    // Temporary mock data

    setSnapshot({

      todaysLeads: 18,

      qualifiedToday: 12,

      activeAgents: 7,

      listingsAvailable: 143,

    });

  }, []);

  //--------------------------------------------------------

  const cards = [

    {

      title: "Today's Leads",

      value: snapshot.todaysLeads,

      icon: Users,

      color: "bg-cyan-500",

    },

    {

      title: "Qualified Today",

      value: snapshot.qualifiedToday,

      icon: BadgeCheck,

      color: "bg-emerald-500",

    },

    {

      title: "Active Agents",

      value: snapshot.activeAgents,

      icon: UserCheck,

      color: "bg-orange-500",

    },

    {

      title: "Listings Available",

      value: snapshot.listingsAvailable,

      icon: Building2,

      color: "bg-violet-500",

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

      <div className="border-b border-slate-800 p-6">

        <h2
          className="
            text-2xl
            font-bold
            text-white
          "
        >
          Business Snapshot
        </h2>

        <p
          className="
            mt-2
            text-sm
            text-slate-400
          "
        >
          Executive overview of today's business performance.
        </p>

      </div>

      {/* Cards */}

      <div
        className="
          grid
          gap-6
          p-6
          sm:grid-cols-2
          xl:grid-cols-4
        "
      >

        {cards.map((card) => {

          const Icon = card.icon;

          return (

            <div
              key={card.title}
              className="
                rounded-2xl
                border
                border-slate-800
                bg-slate-950
                p-6
              "
            >

              <div className="flex items-center justify-between">

                <div>

                  <p
                    className="
                      text-sm
                      text-slate-400
                    "
                  >
                    {card.title}
                  </p>

                  <h3
                    className="
                      mt-3
                      text-4xl
                      font-bold
                      text-white
                    "
                  >
                    {card.value}
                  </h3>

                </div>

                <div
                  className={`
                    ${card.color}
                    flex
                    h-14
                    w-14
                    items-center
                    justify-center
                    rounded-2xl
                  `}
                >

                  <Icon
                    size={26}
                    className="text-white"
                  />

                </div>

              </div>

            </div>

          );

        })}

      </div>

    </section>

  );

};

export default BusinessSnapshot;