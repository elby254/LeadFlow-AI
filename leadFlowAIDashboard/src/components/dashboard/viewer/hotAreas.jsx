/**
 * ==========================================================
 * Displays the highest-performing property demand locations.
 *
 * Used by:
 * • Viewer
 * • Managers
 * • Marketing
 * • Investors
 *
 * Helps identify where customer demand is strongest.
 *
 * Future Backend
 * --------------
 * GET /api/viewer/hot-areas
 *
 * Future Enhancement
 * ------------------
 * Can later become:
 * • Heat Map
 * • Geo Map
 * • Interactive Nairobi Map
 *
 * ==========================================================
 */

import { useEffect, useState } from "react";

import {
  Flame,
  MapPin,
  TrendingUp,
} from "lucide-react";

const HotAreas = () => {

  const [areas, setAreas] = useState([]);

  //------------------------------------------------------

  useEffect(() => {

    // Temporary mock data

    setAreas([

      {
        area: "Westlands",
        leads: 96,
        growth: "+18%",
      },

      {
        area: "Karen",
        leads: 82,
        growth: "+12%",
      },

      {
        area: "Kilimani",
        leads: 74,
        growth: "+10%",
      },

      {
        area: "Ruaka",
        leads: 63,
        growth: "+9%",
      },

      {
        area: "Runda",
        leads: 51,
        growth: "+7%",
      },

    ]);

  }, []);

  //------------------------------------------------------

  const maxLeads = Math.max(
    ...areas.map((area) => area.leads),
    1
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

        <h2 className="flex items-center gap-2 text-2xl font-bold text-white">

          <Flame className="text-orange-400" />

          Hot Areas

        </h2>

        <p className="mt-2 text-sm text-slate-400">

          Property locations generating the highest customer demand.

        </p>

      </div>

      {/* Areas */}

      <div className="space-y-5 p-6">

        {areas.map((area, index) => {

          const width = (area.leads / maxLeads) * 100;

          return (

            <div
              key={area.area}
              className="
                rounded-2xl
                border
                border-slate-800
                bg-slate-950
                p-5
              "
            >

              <div className="mb-3 flex items-center justify-between">

                <div className="flex items-center gap-3">

                  <div
                    className="
                      flex
                      h-10
                      w-10
                      items-center
                      justify-center
                      rounded-full
                      bg-orange-500/15
                      font-bold
                      text-orange-400
                    "
                  >

                    #{index + 1}

                  </div>

                  <div>

                    <h3 className="flex items-center gap-2 font-semibold text-white">

                      <MapPin
                        size={16}
                        className="text-cyan-400"
                      />

                      {area.area}

                    </h3>

                    <p className="text-xs text-slate-500">

                      High customer demand

                    </p>

                  </div>

                </div>

                <div className="text-right">

                  <p className="text-xl font-bold text-white">

                    {area.leads}

                  </p>

                  <p
                    className="
                      flex
                      items-center
                      justify-end
                      gap-1
                      text-sm
                      font-medium
                      text-emerald-400
                    "
                  >

                    <TrendingUp size={14} />

                    {area.growth}

                  </p>

                </div>

              </div>

              {/* Demand Bar */}

              <div className="h-3 rounded-full bg-slate-800">

                <div
                  className="
                    h-3
                    rounded-full
                    bg-gradient-to-r
                    from-orange-500
                    to-cyan-500
                  "
                  style={{
                    width: `${width}%`,
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

export default HotAreas;