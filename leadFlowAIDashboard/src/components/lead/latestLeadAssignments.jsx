/**
 * Displays the newest lead assignments inside the agency.
 *
 * Helps admins monitor:
 *
 * • Which customer was assigned
 * • Assigned sales agent
 * • Assignment time
 * • AI Lead Score
 * • Current Lead Status
 *
 * Future Backend Route
 *
 * GET /api/admin/latest-assignments
 *
 * ===============================================================
 */

import { useEffect, useState } from "react";

const LatestLeadAssignments = () => {

  /**
   * Temporary Mock Data
   * Replace later with:
   *
   * useLatestAssignments()
   *
   */

  const [assignments, setAssignments] = useState([]);

  useEffect(() => {

    setAssignments([

      {
        id: 1,
        customer: "John Mwangi",
        agent: "Alice Wanjiru",
        assignedAt: "10 mins ago",
        score: 94,
        status: "HOT",
      },

      {
        id: 2,
        customer: "Grace Achieng",
        agent: "Brian Otieno",
        assignedAt: "18 mins ago",
        score: 87,
        status: "CONTACTED",
      },

      {
        id: 3,
        customer: "Peter Kamau",
        agent: "Alice Wanjiru",
        assignedAt: "35 mins ago",
        score: 79,
        status: "FOLLOW-UP",
      },

      {
        id: 4,
        customer: "Faith Njeri",
        agent: "Kevin Maina",
        assignedAt: "52 mins ago",
        score: 65,
        status: "NEW",
      },

    ]);

  }, []);

  //----------------------------------------------------------

  const scoreColor = (score) => {

    if (score >= 90)
      return "text-red-400";

    if (score >= 75)
      return "text-amber-400";

    return "text-emerald-400";

  };

  //----------------------------------------------------------

  const statusStyles = (status) => {

    switch (status) {

      case "HOT":

        return "bg-red-500/20 text-red-400";

      case "CONTACTED":

        return "bg-blue-500/20 text-blue-300";

      case "FOLLOW-UP":

        return "bg-yellow-500/20 text-yellow-300";

      default:

        return "bg-emerald-500/20 text-emerald-300";

    }

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

      <div
        className="
          flex
          items-center
          justify-between
          border-b
          border-slate-800
          p-6
        "
      >

        <div>

          <h2
            className="
              text-xl
              font-bold
              text-white
            "
          >

            Latest Lead Assignments

          </h2>

          <p
            className="
              mt-1
              text-sm
              text-slate-400
            "
          >

            Most recently distributed leads across the agency.

          </p>

        </div>

        <span
          className="
            rounded-full
            bg-cyan-500/20
            px-3
            py-1
            text-sm
            font-medium
            text-cyan-300
          "
        >

          {assignments.length} Today

        </span>

      </div>

      {/* Table */}

      <div className="overflow-x-auto">

        <table className="w-full">

          <thead>

            <tr
              className="
                border-b
                border-slate-800
                text-left
                text-xs
                uppercase
                tracking-wide
                text-slate-500
              "
            >

              <th className="px-6 py-4">

                Lead Name

              </th>

              <th className="px-6 py-4">

                Assigned Agent

              </th>

              <th className="px-6 py-4">

                Assigned Time

              </th>

              <th className="px-6 py-4">

                Lead Score

              </th>

              <th className="px-6 py-4">

                Status

              </th>

            </tr>

          </thead>

          <tbody>

            {assignments.map((lead) => (

              <tr
                key={lead.id}
                className="
                  border-b
                  border-slate-800
                  transition
                  hover:bg-slate-800/50
                "
              >

                {/* Lead */}

                <td
                  className="
                    px-6
                    py-5
                    font-semibold
                    text-white
                  "
                >

                  {lead.customer}

                </td>

                {/* Agent */}

                <td
                  className="
                    px-6
                    py-5
                    text-slate-300
                  "
                >

                  {lead.agent}

                </td>

                {/* Time */}

                <td
                  className="
                    px-6
                    py-5
                    text-slate-400
                  "
                >

                  {lead.assignedAt}

                </td>

                {/* Score */}

                <td
                  className={`
                    px-6
                    py-5
                    font-bold
                    ${scoreColor(lead.score)}
                  `}
                >

                  {lead.score}

                </td>

                {/* Status */}

                <td className="px-6 py-5">

                  <span
                    className={`
                      rounded-full
                      px-3
                      py-1
                      text-xs
                      font-semibold
                      ${statusStyles(lead.status)}
                    `}
                  >

                    {lead.status}

                  </span>

                </td>

              </tr>

            ))}

          </tbody>

        </table>

      </div>

    </section>

  );

};

export default LatestLeadAssignments;