/**
 * ==========================================================
 *
 * Purpose
 * ----------------------------------------------------------
 * Displays business performance for every property managed
 * by the organization.
 *
 * Intended Users
 * ----------------------------------------------------------
 * • Admin
 * • Organization Owner
 *
 * Shows
 * ----------------------------------------------------------
 * • Property
 * • Assigned Agent
 * • Status
 * • Property Views
 * • Leads Generated
 * • Scheduled Viewings
 * • Conversion Rate
 * • Estimated Revenue
 * • Last Updated
 *
 * Data Source
 * ----------------------------------------------------------
 * usePropertyAnalytics()
 *
 * Backend
 * ----------------------------------------------------------
 * GET /api/analytics/properties
 *
 * ==========================================================
 */

import { useMemo } from "react";
import { useNavigate } from "react-router-dom";

import {

  Building2,

  Eye,

  Users,

  Calendar,

  DollarSign,

  TrendingUp,

  ArrowRight,

  Loader2,

} from "lucide-react";

import usePropertyAnalytics from "../../../hooks/usePropertyAnalytics";

const PropertyPerformanceTable = () => {

  //----------------------------------------------------------
  // Navigation
  //----------------------------------------------------------

  const navigate = useNavigate();

  //----------------------------------------------------------
  // Analytics
  //----------------------------------------------------------

  const {

    properties,

    loading,

    error,

    refresh,

  } = usePropertyAnalytics();

  //----------------------------------------------------------
  // Totals
  //----------------------------------------------------------

  const totals = useMemo(() => {

    if (!properties.length) {

      return {

        properties: 0,

        views: 0,

        leads: 0,

        viewings: 0,

        revenue: 0,

      };

    }

    return properties.reduce(

      (summary, property) => ({

        properties:
          summary.properties + 1,

        views:
          summary.views +
          (property.views || 0),

        leads:
          summary.leads +
          (property.totalLeads || 0),

        viewings:
          summary.viewings +
          (property.totalViewings || 0),

        revenue:
          summary.revenue +
          (property.revenue || 0),

      }),

      {

        properties: 0,

        views: 0,

        leads: 0,

        viewings: 0,

        revenue: 0,

      }

    );

  }, [properties]);

  //----------------------------------------------------------
  // Loading
  //----------------------------------------------------------

  if (loading) {

    return (

      <section
        className="
          rounded-2xl
          border
          border-slate-800
          bg-slate-900
          p-20
        "
      >

        <div className="flex justify-center">

          <Loader2
            size={34}
            className="animate-spin text-cyan-400"
          />

        </div>

      </section>

    );

  }

  //----------------------------------------------------------
  // Error
  //----------------------------------------------------------

  if (error) {

    return (

      <section
        className="
          rounded-2xl
          border
          border-red-500/30
          bg-red-500/10
          p-10
        "
      >

        <h3 className="text-xl font-bold text-red-400">

          Unable to Load Property Analytics

        </h3>

        <p className="mt-3 text-slate-300">

          {error}

        </p>

        <button

          onClick={refresh}

          className="
            mt-6
            rounded-xl
            bg-cyan-500
            px-5
            py-3
            font-semibold
            text-slate-950
          "

        >

          Retry

        </button>

      </section>

    );

  }

  //----------------------------------------------------------
  // Page
  //----------------------------------------------------------

  return (

    <section className="space-y-8">

      {/* ==========================================
          HEADER
      ========================================== */}

      <div className="flex items-center justify-between">

        <div>

          <h2 className="text-2xl font-bold text-white">

            Property Performance

          </h2>

          <p className="mt-2 text-slate-400">

            Monitor listing performance across all
            agents and properties.

          </p>

        </div>

        <button

          onClick={() =>
            navigate("/properties/listings")
          }

          className="
            flex
            items-center
            gap-2
            rounded-xl
            border
            border-cyan-500
            px-5
            py-3
            font-semibold
            text-cyan-400
            transition
            hover:bg-cyan-500
            hover:text-slate-950
          "

        >

          View Listings

          <ArrowRight size={18} />

        </button>

      </div>

      {/* ==========================================
          SUMMARY CARDS
      ========================================== */}

      <div className="grid gap-6 md:grid-cols-5">

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">

          <Building2
            size={22}
            className="text-cyan-400"
          />

          <p className="mt-4 text-3xl font-bold text-white">

            {totals.properties}

          </p>

          <p className="mt-2 text-sm text-slate-400">

            Properties

          </p>

        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">

          <Eye
            size={22}
            className="text-emerald-400"
          />

          <p className="mt-4 text-3xl font-bold text-white">

            {totals.views.toLocaleString()}

          </p>

          <p className="mt-2 text-sm text-slate-400">

            Views

          </p>

        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">

          <Users
            size={22}
            className="text-yellow-400"
          />

          <p className="mt-4 text-3xl font-bold text-white">

            {totals.leads}

          </p>

          <p className="mt-2 text-sm text-slate-400">

            Leads

          </p>

        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">

          <Calendar
            size={22}
            className="text-purple-400"
          />

          <p className="mt-4 text-3xl font-bold text-white">

            {totals.viewings}

          </p>

          <p className="mt-2 text-sm text-slate-400">

            Viewings

          </p>

        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">

          <DollarSign
            size={22}
            className="text-red-400"
          />

          <p className="mt-4 text-3xl font-bold text-white">

            KES {totals.revenue.toLocaleString()}

          </p>

          <p className="mt-2 text-sm text-slate-400">

            Revenue

          </p>

        </div>

      </div>

      {/* ==========================================================
          PERFORMANCE TABLE
      ========================================================== */}

      <section className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">

        <div className="overflow-x-auto">

          <table className="min-w-full">

            <thead className="border-b border-slate-800 bg-slate-950">

              <tr>

                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-400">
                  Property
                </th>

                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-400">
                  Agent
                </th>

                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-400">
                  Status
                </th>

                <th className="px-6 py-4 text-center text-sm font-semibold text-slate-400">
                  Views
                </th>

                <th className="px-6 py-4 text-center text-sm font-semibold text-slate-400">
                  Leads
                </th>

                <th className="px-6 py-4 text-center text-sm font-semibold text-slate-400">
                  Viewings
                </th>

                <th className="px-6 py-4 text-center text-sm font-semibold text-slate-400">
                  Conversion
                </th>

                <th className="px-6 py-4 text-right text-sm font-semibold text-slate-400">
                  Revenue
                </th>

                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-400">
                  Updated
                </th>

              </tr>

            </thead>

            <tbody>

              {properties.length === 0 ? (

                <tr>

                  <td
                    colSpan={9}
                    className="py-16 text-center text-slate-500"
                  >

                    No property analytics available.

                  </td>

                </tr>

              ) : (

                properties.map((property) => {

                  const conversionRate =
                    property.totalLeads > 0
                      ? (
                          (property.totalViewings /
                            property.totalLeads) *
                          100
                        ).toFixed(1)
                      : "0.0";

                  return (

                    <tr
                      key={property._id}
                      className="border-b border-slate-800/40 transition hover:bg-slate-800/40"
                    >

                      {/* Property */}

                      <td className="px-6 py-5">

                        <div>

                          <p className="font-semibold text-white">

                            {property.title}

                          </p>

                          <p className="mt-1 text-sm text-slate-500">

                            {property.location}

                          </p>

                        </div>

                      </td>

                      {/* Agent */}

                      <td className="px-6 py-5">

                        <div>

                          <p className="text-white">

                            {property.agentName || "-"}

                          </p>

                          <p className="mt-1 text-xs text-slate-500">

                            {property.agentEmail || ""}

                          </p>

                        </div>

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

                            ${
                              property.status === "Available"
                                ? "bg-emerald-500/20 text-emerald-400"

                                : property.status === "Reserved"
                                ? "bg-purple-500/20 text-purple-400"

                                : property.status === "Sold"
                                ? "bg-yellow-500/20 text-yellow-400"

                                : "bg-red-500/20 text-red-400"
                            }
                          `}
                        >

                          {property.status}

                        </span>

                      </td>

                      {/* Views */}

                      <td className="px-6 py-5 text-center text-white">

                        {property.views ?? 0}

                      </td>

                      {/* Leads */}

                      <td className="px-6 py-5 text-center text-white">

                        {property.totalLeads ?? 0}

                      </td>

                      {/* Viewings */}

                      <td className="px-6 py-5 text-center text-white">

                        {property.totalViewings ?? 0}

                      </td>

                      {/* Conversion */}

                      <td className="px-6 py-5 text-center">

                        <div className="flex items-center justify-center gap-2">

                          <TrendingUp
                            size={16}
                            className="text-cyan-400"
                          />

                          <span className="font-semibold text-cyan-400">

                            {conversionRate}%

                          </span>

                        </div>

                      </td>

                      {/* Revenue */}

                      <td className="px-6 py-5 text-right font-semibold text-emerald-400">

                        KES{" "}

                        {Number(
                          property.revenue || 0
                        ).toLocaleString()}

                      </td>

                      {/* Updated */}

                      <td className="px-6 py-5 text-sm text-slate-500">

                        {property.updatedAt
                          ? new Date(
                              property.updatedAt
                            ).toLocaleDateString()

                          : "-"}

                      </td>

                    </tr>

                  );

                })

              )}

            </tbody>

          </table>

        </div>

      </section>

    </section>

  );

};

export default PropertyPerformanceTable;