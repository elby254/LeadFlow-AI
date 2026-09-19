/**
 * 
 * Displays the current sales pipeline for the logged-in agent.
 *
 * Pipeline Stages
 * ---------------
 * • Hot Leads
 * • Qualified
 * • Negotiation
 * • Closed
 *
 * Future Backend
 * --------------
 * GET /api/agent/pipeline
 *
 * {
 *   hot: 12,
 *   qualified: 24,
 *   negotiation: 8,
 *   closed: 15
 * }
 *
 * Clicking a stage should eventually filter the lead list.
 *
 * ==========================================================
 */

import {
  Flame,
  BadgeCheck,
  Handshake,
  CircleDollarSign,
} from "lucide-react";

import { useEffect, useState } from "react";

import { useNavigate } from "react-router-dom";

const MyPipeline = () => {

  const navigate = useNavigate();

  const [pipeline, setPipeline] = useState({
    hot: 0,
    qualified: 0,
    negotiation: 0,
    closed: 0,
  });

  //----------------------------------------------------------

  useEffect(() => {

    /**
     * Temporary mock data.
     *
     * Replace with:
     *
     * const data = await getMyPipeline();
     * setPipeline(data);
     *
     */

    setPipeline({

      hot: 12,

      qualified: 24,

      negotiation: 8,

      closed: 15,

    });

  }, []);

  //----------------------------------------------------------

  const stages = [

    {
      title: "Hot Leads",
      value: pipeline.hot,
      icon: Flame,
      color:
        "bg-red-500/15 text-red-300 border-red-500/20",
      filter: "hot",
    },

    {
      title: "Qualified",
      value: pipeline.qualified,
      icon: BadgeCheck,
      color:
        "bg-cyan-500/15 text-cyan-300 border-cyan-500/20",
      filter: "qualified",
    },

    {
      title: "Negotiation",
      value: pipeline.negotiation,
      icon: Handshake,
      color:
        "bg-orange-500/15 text-orange-300 border-orange-500/20",
      filter: "negotiation",
    },

    {
      title: "Closed",
      value: pipeline.closed,
      icon: CircleDollarSign,
      color:
        "bg-emerald-500/15 text-emerald-300 border-emerald-500/20",
      filter: "closed",
    },

  ];

  //----------------------------------------------------------

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
          My Pipeline
        </h2>

        <p
          className="
            mt-2
            text-sm
            text-slate-400
          "
        >
          Your active customer pipeline.
        </p>

      </div>

      {/* Pipeline */}

      <div
        className="
          grid
          gap-5
          p-6
          md:grid-cols-2
          xl:grid-cols-4
        "
      >

        {stages.map((stage) => {

          const Icon = stage.icon;

          return (

            <button
              key={stage.title}
              onClick={() =>
                navigate(`/agent/leads?status=${stage.filter}`)
              }
              className={`
                rounded-2xl
                border
                p-5
                text-left
                transition-all
                duration-300
                hover:-translate-y-1
                hover:shadow-lg
                ${stage.color}
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
                    {stage.title}
                  </p>

                  <h3
                    className="
                      mt-3
                      text-4xl
                      font-bold
                    "
                  >
                    {stage.value}
                  </h3>

                </div>

                <div
                  className="
                    rounded-xl
                    bg-slate-900/40
                    p-3
                  "
                >
                  <Icon size={30} />
                </div>

              </div>

            </button>

          );

        })}

      </div>

    </section>

  );

};

export default MyPipeline;