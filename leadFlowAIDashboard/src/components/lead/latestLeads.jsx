/**
 * ==========================================================
 * Displays the newest leads entering LeadFlow AI.
 *
 * Viewer users can monitor incoming business without
 * modifying any customer records.
 *
 * Future Backend
 * --------------
 * GET /api/viewer/latest-leads
 *
 * ==========================================================
 */

import { useEffect, useState } from "react";

import {
  User,
  Bot,
  CalendarDays,
  UserCheck,
} from "lucide-react";

const LatestLeads = () => {

  const [leads, setLeads] = useState([]);

  //----------------------------------------------------------

  useEffect(() => {

    // Temporary mock data

    setLeads([

      {

        _id: "lead001",

        customer: "John Mwangi",

        agent: "Sarah Wanjiru",

        aiScore: 94,

        source: "WhatsApp",

        created: "Today 09:10",

      },

      {

        _id: "lead002",

        customer: "Grace Wanjiku",

        agent: "James Kariuki",

        aiScore: 88,

        source: "Facebook",

        created: "Today 08:42",

      },

      {

        _id: "lead003",

        customer: "Brian Otieno",

        agent: "Sarah Wanjiru",

        aiScore: 91,

        source: "Website",

        created: "Yesterday",

      },

      {

        _id: "lead004",

        customer: "Faith Njeri",

        agent: "Peter Maina",

        aiScore: 76,

        source: "Referral",

        created: "Yesterday",

      },

    ]);

  }, []);

  //----------------------------------------------------------

  const scoreColor = (score) => {

    if (score >= 90)
      return "text-emerald-400";

    if (score >= 75)
      return "text-yellow-400";

    return "text-red-400";

  };

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

      <div className="border-b border-slate-800 p-6">

        <h2 className="text-2xl font-bold text-white">
          Latest Leads
        </h2>

        <p className="mt-2 text-sm text-slate-400">
          Recently created customer leads.
        </p>

      </div>

      {/* Table */}

      <div className="overflow-x-auto">

        <table className="w-full">

          <thead>

            <tr className="border-b border-slate-800 text-left">

              <th className="px-6 py-4 text-sm text-slate-400">
                Customer
              </th>

              <th className="px-6 py-4 text-sm text-slate-400">
                Assigned Agent
              </th>

              <th className="px-6 py-4 text-sm text-slate-400">
                AI Score
              </th>

              <th className="px-6 py-4 text-sm text-slate-400">
                Source
              </th>

              <th className="px-6 py-4 text-sm text-slate-400">
                Created
              </th>

            </tr>

          </thead>

          <tbody>

            {leads.map((lead) => (

              <tr
                key={lead._id}
                className="
                  border-b
                  border-slate-800
                  hover:bg-slate-800/40
                "
              >

                {/* Customer */}

                <td className="px-6 py-5">

                  <div className="flex items-center gap-3">

                    <div
                      className="
                        rounded-xl
                        bg-cyan-500/20
                        p-2
                      "
                    >

                      <User
                        size={18}
                        className="text-cyan-400"
                      />

                    </div>

                    <span className="font-medium text-white">
                      {lead.customer}
                    </span>

                  </div>

                </td>

                {/* Agent */}

                <td className="px-6 py-5">

                  <div className="flex items-center gap-2">

                    <UserCheck
                      size={16}
                      className="text-emerald-400"
                    />

                    <span className="text-slate-300">
                      {lead.agent}
                    </span>

                  </div>

                </td>

                {/* AI Score */}

                <td className="px-6 py-5">

                  <div className="flex items-center gap-2">

                    <Bot
                      size={16}
                      className="text-violet-400"
                    />

                    <span
                      className={`font-bold ${scoreColor(
                        lead.aiScore
                      )}`}
                    >
                      {lead.aiScore}%
                    </span>

                  </div>

                </td>

                {/* Source */}

                <td className="px-6 py-5">

                  <span
                    className="
                      rounded-full
                      bg-slate-800
                      px-3
                      py-1
                      text-sm
                      text-slate-300
                    "
                  >
                    {lead.source}
                  </span>

                </td>

                {/* Created */}

                <td className="px-6 py-5">

                  <div className="flex items-center gap-2">

                    <CalendarDays
                      size={16}
                      className="text-orange-400"
                    />

                    <span className="text-slate-400">
                      {lead.created}
                    </span>

                  </div>

                </td>

              </tr>

            ))}

          </tbody>

        </table>

      </div>

    </section>

  );

};

export default LatestLeads;