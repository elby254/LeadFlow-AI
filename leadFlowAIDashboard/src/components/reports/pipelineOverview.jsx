/**
 * ==========================================================
 * Read-only overview of the LeadFlow AI sales pipeline.
 *
 * Used by:
 * • Viewer
 * • Manager
 * • Investor
 *
 * Future Backend
 * --------------
 * GET /api/viewer/pipeline-overview
 *
 * ==========================================================
 */

import { useEffect, useState } from "react";

import {
  CircleDot,
  BadgeCheck,
  Handshake,
  Trophy,
} from "lucide-react";

const PipelineOverview = () => {

  const [pipeline, setPipeline] = useState({

    new: 0,

    qualified: 0,

    negotiation: 0,

    closed: 0,

  });

  //--------------------------------------------------------

  useEffect(() => {

    // Temporary mock data

    setPipeline({

      new: 42,

      qualified: 26,

      negotiation: 11,

      closed: 8,

    });

  }, []);

  //--------------------------------------------------------

  const stages = [

    {

      title: "New",

      value: pipeline.new,

      icon: CircleDot,

      color: "bg-cyan-500",

    },

    {

      title: "Qualified",

      value: pipeline.qualified,

      icon: BadgeCheck,

      color: "bg-emerald-500",

    },

    {

      title: "Negotiation",

      value: pipeline.negotiation,

      icon: Handshake,

      color: "bg-orange-500",

    },

    {

      title: "Closed",

      value: pipeline.closed,

      icon: Trophy,

      color: "bg-violet-500",

    },

  ];

  //--------------------------------------------------------

  const total =
    pipeline.new +
    pipeline.qualified +
    pipeline.negotiation +
    pipeline.closed;

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

        <div className="flex items-center justify-between">

          <div>

            <h2 className="text-2xl font-bold text-white">
              Pipeline Overview
            </h2>

            <p className="mt-2 text-sm text-slate-400">
              Read-only summary of the current sales pipeline.
            </p>

          </div>

          <div className="text-right">

            <p className="text-sm text-slate-400">
              Total Leads
            </p>

            <p className="text-3xl font-bold text-cyan-400">
              {total}
            </p>

          </div>

        </div>

      </div>

      {/* Pipeline Cards */}

      <div
        className="
          grid
          gap-6
          p-6
          sm:grid-cols-2
          xl:grid-cols-4
        "
      >

        {stages.map((stage) => {

          const Icon = stage.icon;

          return (

            <div
              key={stage.title}
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

                  <p className="text-sm text-slate-400">
                    {stage.title}
                  </p>

                  <h3 className="mt-3 text-4xl font-bold text-white">
                    {stage.value}
                  </h3>

                </div>

                <div
                  className={`
                    ${stage.color}
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

              {/* Progress Bar */}

              <div className="mt-6">

                <div className="h-2 w-full rounded-full bg-slate-800">

                  <div
                    className={`${stage.color} h-2 rounded-full`}
                    style={{
                      width:
                        total > 0
                          ? `${(stage.value / total) * 100}%`
                          : "0%",
                    }}
                  />

                </div>

                <p className="mt-2 text-xs text-slate-500">

                  {total > 0
                    ? `${Math.round(
                        (stage.value / total) * 100
                      )}% of pipeline`
                    : "0% of pipeline"}

                </p>

              </div>

            </div>

          );

        })}

      </div>

    </section>

  );

};

export default PipelineOverview;