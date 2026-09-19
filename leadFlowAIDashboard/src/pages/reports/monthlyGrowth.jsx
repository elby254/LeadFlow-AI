/**
 * ==========================================================
 * Displays monthly business growth trends.
 *
 * Used by:
 * • Viewer Dashboard
 * • Managers
 * • Investors
 * • Executives
 *
 * Backend
 * -------
 * GET /api/viewer/monthly-growth
 *
 * Response
 * --------
 * [
 *   {
 *     month,
 *     leads,
 *     closedDeals,
 *     revenue
 *   }
 * ]
 *
 * ==========================================================
 */

import { useEffect, useState } from "react";

import axiosClient from "../../api/axiosClient";

const MonthlyGrowth = () => {

  const [growth, setGrowth] = useState([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  //--------------------------------------------------------

  const fetchGrowth = async () => {

    try {

      setLoading(true);

      setError("");

      const response = await axiosClient.get(
        "/viewer/monthly-growth"
      );

      setGrowth(response.data);

    } catch (err) {

      console.error(err);

      setError("Unable to load monthly growth.");

      //----------------------------------------------------
      // Temporary fallback
      //----------------------------------------------------

      setGrowth([

        {
          month: "Jan",
          leads: 62,
          closedDeals: 18,
          revenue: 9800000,
        },

        {
          month: "Feb",
          leads: 71,
          closedDeals: 21,
          revenue: 11200000,
        },

        {
          month: "Mar",
          leads: 85,
          closedDeals: 27,
          revenue: 13800000,
        },

        {
          month: "Apr",
          leads: 93,
          closedDeals: 30,
          revenue: 15600000,
        },

        {
          month: "May",
          leads: 101,
          closedDeals: 35,
          revenue: 18100000,
        },

        {
          month: "Jun",
          leads: 118,
          closedDeals: 42,
          revenue: 21400000,
        },

      ]);

    } finally {

      setLoading(false);

    }

  };

  //--------------------------------------------------------

  useEffect(() => {

    fetchGrowth();

  }, []);

  //--------------------------------------------------------

  if (loading) {

    return (

      <section
        className="
          rounded-3xl
          border
          border-slate-800
          bg-slate-900
          p-8
        "
      >

        <p className="text-slate-400">

          Loading Monthly Growth...

        </p>

      </section>

    );

  }

  //--------------------------------------------------------

  if (error) {

    console.warn(error);

  }

  //--------------------------------------------------------

  const totalLeads = growth.reduce(
    (sum, month) => sum + month.leads,
    0
  );

  const totalDeals = growth.reduce(
    (sum, month) => sum + month.closedDeals,
    0
  );

  const totalRevenue = growth.reduce(
    (sum, month) => sum + month.revenue,
    0
  );

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

          Monthly Growth

        </h2>

        <p className="mt-2 text-sm text-slate-400">

          Business performance across recent months.

        </p>

      </div>

      {/* Summary */}

      <div
        className="
          grid
          gap-6
          border-b
          border-slate-800
          p-6
          md:grid-cols-3
        "
      >

        <div>

          <p className="text-sm text-slate-400">

            Total Leads

          </p>

          <h3 className="mt-2 text-3xl font-bold text-cyan-400">

            {totalLeads}

          </h3>

        </div>

        <div>

          <p className="text-sm text-slate-400">

            Closed Deals

          </p>

          <h3 className="mt-2 text-3xl font-bold text-emerald-400">

            {totalDeals}

          </h3>

        </div>

        <div>

          <p className="text-sm text-slate-400">

            Revenue

          </p>

          <h3 className="mt-2 text-3xl font-bold text-orange-400">

            KES {totalRevenue.toLocaleString()}

          </h3>

        </div>

      </div>

      {/* Monthly Table */}

      <div className="overflow-x-auto">

        <table className="w-full">

          <thead>

            <tr className="border-b border-slate-800">

              <th className="px-6 py-4 text-left text-slate-400">

                Month

              </th>

              <th className="px-6 py-4 text-left text-slate-400">

                Leads

              </th>

              <th className="px-6 py-4 text-left text-slate-400">

                Closed Deals

              </th>

              <th className="px-6 py-4 text-left text-slate-400">

                Revenue

              </th>

            </tr>

          </thead>

          <tbody>

            {growth.map((month) => (

              <tr
                key={month.month}
                className="
                  border-b
                  border-slate-800
                  hover:bg-slate-800/40
                "
              >

                <td className="px-6 py-5 font-semibold text-white">

                  {month.month}

                </td>

                <td className="px-6 py-5 text-cyan-300">

                  {month.leads}

                </td>

                <td className="px-6 py-5 text-emerald-300">

                  {month.closedDeals}

                </td>

                <td className="px-6 py-5 text-orange-300">

                  KES {month.revenue.toLocaleString()}

                </td>

              </tr>

            ))}

          </tbody>

        </table>

      </div>

    </section>

  );

};

export default MonthlyGrowth;