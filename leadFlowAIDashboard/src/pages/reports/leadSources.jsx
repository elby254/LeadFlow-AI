/**
 * ==========================================================
 * Marketing dashboard showing where leads originate.
 *
 * Used by:
 * • Viewer
 * • Managers
 * • Marketing
 * • Investors
 *
 * Future
 * ------
 * This component can later become a Bar Chart.
 *
 * Backend
 * -------
 * GET /api/viewer/lead-sources
 *
 * ==========================================================
 */

import { useEffect, useState } from "react";

import {
  Globe,
  MessageCircle,
  Users,
  Building2,
  Share2,
  Camera,
} from "lucide-react";

const LeadSources = () => {

  const [sources, setSources] = useState([]);

  //------------------------------------------------------

  useEffect(() => {

    // Temporary mock data

    setSources([

      {
        source: "Website",
        leads: 84,
        icon: Globe,
      },

      {
        source: "Facebook",
        leads: 61,
        icon: Share2,
      },

      {
        source: "Instagram",
        leads: 42,
        icon: Camera,
      },

      {
        source: "WhatsApp",
        leads: 95,
        icon: MessageCircle,
      },

      {
        source: "Referral",
        leads: 33,
        icon: Users,
      },

      {
        source: "Walk-in",
        leads: 18,
        icon: Building2,
      },

    ]);

  }, []);

  //------------------------------------------------------

  const total = sources.reduce(
    (sum, item) => sum + item.leads,
    0
  );

  //------------------------------------------------------

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

        <h2 className="text-2xl font-bold text-white">
          Lead Sources
        </h2>

        <p className="mt-2 text-sm text-slate-400">
          Marketing performance by acquisition channel.
        </p>

      </div>

      {/* Sources */}

      <div className="space-y-6 p-6">

        {sources.map((item) => {

          const Icon = item.icon;

          const percentage =
            total > 0
              ? (item.leads / total) * 100
              : 0;

          return (

            <div key={item.source}>

              <div className="mb-2 flex items-center justify-between">

                <div className="flex items-center gap-3">

                  <div
                    className="
                      rounded-xl
                      bg-cyan-500/20
                      p-2
                    "
                  >

                    <Icon
                      size={18}
                      className="text-cyan-400"
                    />

                  </div>

                  <span className="font-medium text-white">

                    {item.source}

                  </span>

                </div>

                <div className="text-right">

                  <p className="font-bold text-white">

                    {item.leads}

                  </p>

                  <p className="text-xs text-slate-500">

                    {percentage.toFixed(0)}%

                  </p>

                </div>

              </div>

              {/* Progress */}

              <div className="h-3 rounded-full bg-slate-800">

                <div
                  className="
                    h-3
                    rounded-full
                    bg-cyan-500
                  "
                  style={{
                    width: `${percentage}%`,
                  }}
                />

              </div>

            </div>

          );

        })}

      </div>

    </section>

  );

};

export default LeadSources;