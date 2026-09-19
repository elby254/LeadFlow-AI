/**
 * ==========================================================
 * Read-only record of recently completed follow-ups.
 *
 * Used by:
 * • Managers
 * • Viewers
 * • Investors
 *
 * Helps monitor agent activity and customer engagement.
 *
 * Future Backend
 * --------------
 * GET /api/viewer/recent-followups
 *
 * ==========================================================
 */

import { useEffect, useState } from "react";

import {
  User,
  UserCheck,
  CheckCircle2,
  Clock3,
} from "lucide-react";

const RecentFollowUps = () => {

  const [followUps, setFollowUps] = useState([]);

  //--------------------------------------------------------

  useEffect(() => {

    // Temporary mock data

    setFollowUps([

      {
        _id: "f001",

        customer: "John Mwangi",

        agent: "Sarah Wanjiru",

        outcome: "Viewing Scheduled",

        completedAt: "Today • 10:45 AM",

      },

      {
        _id: "f002",

        customer: "Grace Wanjiku",

        agent: "James Kariuki",

        outcome: "Interested - Needs Financing",

        completedAt: "Today • 09:18 AM",

      },

      {
        _id: "f003",

        customer: "Brian Otieno",

        agent: "Peter Maina",

        outcome: "Negotiation Started",

        completedAt: "Yesterday • 4:10 PM",

      },

      {
        _id: "f004",

        customer: "Faith Njeri",

        agent: "Sarah Wanjiru",

        outcome: "Follow-up Completed",

        completedAt: "Yesterday • 1:25 PM",

      },

    ]);

  }, []);

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

        <h2 className="text-2xl font-bold text-white">

          Recent Follow-ups

        </h2>

        <p className="mt-2 text-sm text-slate-400">

          Recently completed customer follow-ups.

        </p>

      </div>

      {/* Table */}

      <div className="overflow-x-auto">

        <table className="w-full">

          <thead>

            <tr className="border-b border-slate-800">

              <th className="px-6 py-4 text-left text-sm text-slate-400">
                Customer
              </th>

              <th className="px-6 py-4 text-left text-sm text-slate-400">
                Agent
              </th>

              <th className="px-6 py-4 text-left text-sm text-slate-400">
                Outcome
              </th>

              <th className="px-6 py-4 text-left text-sm text-slate-400">
                Completed
              </th>

            </tr>

          </thead>

          <tbody>

            {followUps.map((item) => (

              <tr
                key={item._id}
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

                      {item.customer}

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

                      {item.agent}

                    </span>

                  </div>

                </td>

                {/* Outcome */}

                <td className="px-6 py-5">

                  <div className="flex items-center gap-2">

                    <CheckCircle2
                      size={16}
                      className="text-violet-400"
                    />

                    <span
                      className="
                        rounded-full
                        bg-violet-500/15
                        px-3
                        py-1
                        text-sm
                        text-violet-300
                      "
                    >

                      {item.outcome}

                    </span>

                  </div>

                </td>

                {/* Time */}

                <td className="px-6 py-5">

                  <div className="flex items-center gap-2">

                    <Clock3
                      size={16}
                      className="text-orange-400"
                    />

                    <span className="text-slate-400">

                      {item.completedAt}

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

export default RecentFollowUps;