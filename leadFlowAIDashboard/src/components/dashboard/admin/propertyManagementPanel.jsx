/**
 * ==========================================================
 *
 * Admin Dashboard Component
 *
 * Purpose
 * ----------------------------------------------------------
 * Central property management workspace for administrators.
 *
 * Responsibilities
 * ----------------------------------------------------------
 * • Portfolio overview
 * • Property statistics
 * • Quick management actions
 * • Navigation to property modules
 * • Recent management activity
 *
 * Used By
 * ----------------------------------------------------------
 * AdminDashboard.jsx
 *
 * Navigation
 * ----------------------------------------------------------
 * /properties
 * /properties/listings
 * /properties/add
 * /properties/available
 * /properties/sold
 *
 * ==========================================================
 */

import { useMemo } from "react";
import { useNavigate } from "react-router-dom";

import {
  Building2,
  Plus,
  Upload,
  Users,
  Archive,
  ArrowRight,
  MapPin,
  CheckCircle2,
  Home,
} from "lucide-react";

import useProperties from "../../../hooks/useProperties";

const PropertyManagementPanel = () => {

  //----------------------------------------------------------
  // Navigation
  //----------------------------------------------------------

  const navigate = useNavigate();

  //----------------------------------------------------------
  // Properties Hook
  //----------------------------------------------------------

  const {

    properties = [],

    loading,

    error,

    refresh,

  } = useProperties();

  //----------------------------------------------------------
  // Portfolio Statistics
  //----------------------------------------------------------

  const statistics = useMemo(() => {

    const total = properties.length;

    const available = properties.filter(
      (property) => property.status === "Available"
    ).length;

    const sold = properties.filter(
      (property) => property.status === "Sold"
    ).length;

    const reserved = properties.filter(
      (property) =>
        property.status === "Reserved"
    ).length;

    const offMarket = properties.filter(
      (property) =>
        property.status === "Off Market"
    ).length;

    return {

      total,

      available,

      sold,

      reserved,

      offMarket,

    };

  }, [properties]);

  //----------------------------------------------------------
  // Recent Activity
  //----------------------------------------------------------

  const recentActivity = useMemo(() => {

    return [...properties]

      .sort(

        (a, b) =>

          new Date(b.updatedAt) -

          new Date(a.updatedAt)

      )

      .slice(0, 5);

  }, [properties]);

  //----------------------------------------------------------
  // Quick Actions
  //----------------------------------------------------------

  const quickActions = [

    {

      title: "Add Property",

      description:
        "Create a new property listing.",

      icon: Plus,

      action: () =>
        navigate("/properties/add"),

      color:
        "bg-cyan-500 text-slate-950",

    },

    {

      title: "Listings",

      description:
        "Manage all property listings.",

      icon: Building2,

      action: () =>
        navigate("/properties/listings"),

      color:
        "bg-emerald-500 text-slate-950",

    },

    {
  title: "Available",
  description: "Browse available properties.",
  icon: Home,

  action: () =>
    navigate("/properties/available"),

  color: "bg-yellow-400 text-slate-950",
},

    {

      title: "Sold",

      description:
        "View completed sales.",

      icon: CheckCircle2,

      action: () =>
        navigate("/properties/sold"),

      color:
        "bg-purple-500 text-white",

    },

  ];

  //----------------------------------------------------------
  // Loading State
  //----------------------------------------------------------

  if (loading) {

    return (

      <section className="rounded-2xl border border-slate-800 bg-slate-900 p-8">

        <div className="flex items-center justify-center py-20">

          <p className="text-slate-400">

            Loading property management panel...

          </p>

        </div>

      </section>

    );

  }

  //----------------------------------------------------------
  // Error State
  //----------------------------------------------------------

  if (error) {

    return (

      <section className="rounded-2xl border border-red-500/30 bg-slate-900 p-8">

        <div className="space-y-4 text-center">

          <h2 className="text-xl font-bold text-red-400">

            Unable to Load Properties

          </h2>

          <p className="text-slate-400">

            {error}

          </p>

          <button
            onClick={refresh}
            className="
              rounded-xl
              bg-cyan-500
              px-5
              py-3
              font-semibold
              text-slate-950
              transition
              hover:bg-cyan-400
            "
          >

            Retry

          </button>

        </div>

      </section>

    );

  }

  //----------------------------------------------------------
  // Component
  //----------------------------------------------------------

  return (

    <section className="space-y-8">

      {/* ====================================================
          HEADER
      ==================================================== */}

      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

        <div>

          <h2 className="text-3xl font-black text-white">

            Property Management

          </h2>

          <p className="mt-2 text-slate-400">

            Manage the entire LeadFlow AI property portfolio.

          </p>

        </div>

        <button

          onClick={() => navigate("/properties")}

          className="
            inline-flex
            items-center
            gap-2
            rounded-xl
            bg-cyan-500
            px-5
            py-3
            font-semibold
            text-slate-950
            transition
            hover:bg-cyan-400
          "

        >

          Open Properties

          <ArrowRight size={18} />

        </button>

      </div>

      {/* ====================================================
          PROPERTY SUMMARY
      ==================================================== */}

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-5">

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">

          <Building2
            className="mb-4 text-cyan-400"
            size={30}
          />

          <p className="text-sm text-slate-400">

            Total Properties

          </p>

          <h3 className="mt-2 text-4xl font-black text-white">

            {statistics.total}

          </h3>

        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">

          <Home
            className="mb-4 text-emerald-400"
            size={30}
          />

          <p className="text-sm text-slate-400">

            Available

          </p>

          <h3 className="mt-2 text-4xl font-black text-emerald-400">

            {statistics.available}

          </h3>

        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">

          <CheckCircle2
            className="mb-4 text-yellow-400"
            size={30}
          />

          <p className="text-sm text-slate-400">

            Sold

          </p>

          <h3 className="mt-2 text-4xl font-black text-yellow-400">

            {statistics.sold}

          </h3>

        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">

          <Users
            className="mb-4 text-purple-400"
            size={30}
          />

          <p className="text-sm text-slate-400">

            Reserved

          </p>

          <h3 className="mt-2 text-4xl font-black text-purple-400">

            {statistics.reserved}

          </h3>

        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">

          <Archive
            className="mb-4 text-red-400"
            size={30}
          />

          <p className="text-sm text-slate-400">

            Off Market

          </p>

          <h3 className="mt-2 text-4xl font-black text-red-400">

            {statistics.offMarket}

          </h3>

        </div>

      </div>

      {/* ====================================================
          QUICK ACTIONS
      ==================================================== */}

      <section className="rounded-2xl border border-slate-800 bg-slate-900 p-8">

        <div className="mb-8">

          <h3 className="text-xl font-bold text-white">

            Quick Actions

          </h3>

          <p className="mt-2 text-sm text-slate-400">

            Frequently used administrative property operations.

          </p>

        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">

          {quickActions.map((action) => {

            const Icon = action.icon;

            return (

              <button

                key={action.title}

                onClick={action.action}

                className="
                  rounded-2xl
                  border
                  border-slate-800
                  bg-slate-950
                  p-6
                  text-left
                  transition
                  hover:border-cyan-500
                  hover:-translate-y-1
                "

              >

                <div
                  className={`mb-5 inline-flex rounded-xl p-3 ${action.color}`}
                >

                  <Icon size={24} />

                </div>

                <h4 className="text-lg font-bold text-white">

                  {action.title}

                </h4>

                <p className="mt-2 text-sm leading-relaxed text-slate-400">

                  {action.description}

                </p>

              </button>

            );

          })}

        </div>

      </section>

      {/* ====================================================
          RECENT PROPERTY ACTIVITY
      ==================================================== */}

      <section className="rounded-2xl border border-slate-800 bg-slate-900 p-8">

        <div className="mb-8 flex items-center justify-between">

          <div>

            <h3 className="text-xl font-bold text-white">

              Recent Property Activity

            </h3>

            <p className="mt-2 text-sm text-slate-400">

              Latest property updates across the organization.

            </p>

          </div>

          <button

            onClick={() => navigate("/properties/listings")}

            className="
              rounded-xl
              border
              border-cyan-500
              px-4
              py-2
              text-sm
              font-semibold
              text-cyan-400
              transition
              hover:bg-cyan-500
              hover:text-slate-950
            "

          >

            View All

          </button>

        </div>

        <div className="overflow-x-auto">

          <table className="w-full">

            <thead>

              <tr className="border-b border-slate-800 text-left">

                <th className="pb-4 font-semibold text-slate-400">

                  Property

                </th>

                <th className="pb-4 font-semibold text-slate-400">

                  Location

                </th>

                <th className="pb-4 font-semibold text-slate-400">

                  Price

                </th>

                <th className="pb-4 font-semibold text-slate-400">

                  Status

                </th>

                <th className="pb-4 font-semibold text-slate-400">

                  Updated

                </th>

              </tr>

            </thead>

            <tbody>

              {recentActivity.length === 0 ? (

                <tr>

                  <td
                    colSpan={5}
                    className="py-10 text-center text-slate-500"
                  >

                    No recent property activity.

                  </td>

                </tr>

              ) : (

                recentActivity.map((property) => (

                  <tr
                    key={property._id}
                    className="border-b border-slate-800/50 hover:bg-slate-800/40"
                  >

                    <td className="py-5">

                      <div>

                        <p className="font-semibold text-white">

                          {property.title}

                        </p>

                        <p className="mt-1 text-sm text-slate-500">

                          {property.propertyType}

                        </p>

                      </div>

                    </td>

                    <td className="py-5">

                      <div className="flex items-center gap-2">

                        <MapPin
                          size={15}
                          className="text-cyan-400"
                        />

                        <span className="text-slate-300">

                          {property.location}

                        </span>

                      </div>

                    </td>

                    <td className="py-5 font-semibold text-cyan-400">

                      {property.price
                        ? `KES ${Number(
                            property.price
                          ).toLocaleString()}`
                        : "-"}

                    </td>

                    <td className="py-5">

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

                              : property.status === "Sold"
                              ? "bg-yellow-500/20 text-yellow-400"

                              : property.status === "Reserved"
                              ? "bg-purple-500/20 text-purple-400"

                              : "bg-red-500/20 text-red-400"
                          }
                        `}
                      >

                        {property.status}

                      </span>

                    </td>

                    <td className="py-5 text-sm text-slate-500">

                      {property.updatedAt
                        ? new Date(
                            property.updatedAt
                          ).toLocaleDateString()

                        : "-"}

                    </td>

                  </tr>

                ))

              )}

            </tbody>

          </table>

        </div>

      </section>

      {/* ====================================================
          PORTFOLIO DISTRIBUTION
      ==================================================== */}

      <section className="grid gap-6 xl:grid-cols-2">

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8">

          <h3 className="text-xl font-bold text-white">

            Portfolio Distribution

          </h3>

          <p className="mt-2 text-sm text-slate-400">

            Current breakdown of all managed properties.

          </p>

          <div className="mt-8 space-y-6">

            {[
              {
                label: "Available",
                value: statistics.available,
                color: "bg-emerald-500",
              },

              {
                label: "Reserved",
                value: statistics.reserved,
                color: "bg-purple-500",
              },

              {
                label: "Sold",
                value: statistics.sold,
                color: "bg-yellow-500",
              },

              {
                label: "Off Market",
                value: statistics.offMarket,
                color: "bg-red-500",
              },

            ].map((item) => (

              <div key={item.label}>

                <div className="mb-2 flex items-center justify-between">

                  <span className="font-medium text-white">

                    {item.label}

                  </span>

                  <span className="text-slate-400">

                    {item.value}

                  </span>

                </div>

                <div className="h-3 overflow-hidden rounded-full bg-slate-800">

                  <div
                    className={`${item.color} h-full rounded-full transition-all duration-700`}
                    style={{
                      width:
                        statistics.total === 0
                          ? "0%"
                          : `${
                              (item.value /
                                statistics.total) *
                              100
                            }%`,
                    }}
                  />

                </div>

              </div>

            ))}

          </div>

        </div>

        {/* ====================================================
            PORTFOLIO SUMMARY
        ==================================================== */}

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8">

          <h3 className="text-xl font-bold text-white">

            Portfolio Overview

          </h3>

          <p className="mt-2 text-sm text-slate-400">

            Quick access to the most common administrative
            property management tasks.

          </p>

          <div className="mt-8 space-y-4">

            <button

              onClick={() => navigate("/properties/add")}

              className="
                flex
                w-full
                items-center
                justify-between
                rounded-xl
                border
                border-slate-800
                bg-slate-950
                px-5
                py-4
                transition
                hover:border-cyan-500
              "

            >

              <div className="flex items-center gap-4">

                <Plus
                  size={20}
                  className="text-cyan-400"
                />

                <span className="font-medium text-white">

                  Create New Property

                </span>

              </div>

              <ArrowRight
                size={18}
                className="text-slate-500"
              />

            </button>

            <button

              onClick={() =>
                navigate("/properties/listings")
              }

              className="
                flex
                w-full
                items-center
                justify-between
                rounded-xl
                border
                border-slate-800
                bg-slate-950
                px-5
                py-4
                transition
                hover:border-cyan-500
              "

            >

              <div className="flex items-center gap-4">

                <Building2
                  size={20}
                  className="text-emerald-400"
                />

                <span className="font-medium text-white">

                  Manage Listings

                </span>

              </div>

              <ArrowRight
                size={18}
                className="text-slate-500"
              />

            </button>

            <button

              onClick={() =>
                navigate("/properties/available")
              }

              className="
                flex
                w-full
                items-center
                justify-between
                rounded-xl
                border
                border-slate-800
                bg-slate-950
                px-5
                py-4
                transition
                hover:border-cyan-500
              "

            >

              <div className="flex items-center gap-4">

                <Home
                  size={20}
                  className="text-yellow-400"
                />

                <span className="font-medium text-white">

                  Browse Available Properties

                </span>

              </div>

              <ArrowRight
                size={18}
                className="text-slate-500"
              />

            </button>

            <button

              onClick={() =>
                navigate("/properties/sold")
              }

              className="
                flex
                w-full
                items-center
                justify-between
                rounded-xl
                border
                border-slate-800
                bg-slate-950
                px-5
                py-4
                transition
                hover:border-cyan-500
              "

            >

              <div className="flex items-center gap-4">

                <CheckCircle2
                  size={20}
                  className="text-purple-400"
                />

                <span className="font-medium text-white">

                  View Sold Properties

                </span>

              </div>

              <ArrowRight
                size={18}
                className="text-slate-500"
              />

            </button>

          </div>

          {/* ==================================================
              ADMIN SUMMARY
          ================================================== */}

          <div className="mt-10 rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-6">

            <h4 className="text-lg font-bold text-cyan-400">

              Administrator Summary

            </h4>

            <p className="mt-4 leading-7 text-slate-300">

              LeadFlow AI currently manages{" "}

              <span className="font-bold text-white">

                {statistics.total}

              </span>{" "}

              properties across your organization.

              {" "}

              <span className="font-bold text-emerald-400">

                {statistics.available}

              </span>{" "}

              are available,

              {" "}

              <span className="font-bold text-purple-400">

                {statistics.reserved}

              </span>{" "}

              are reserved,

              {" "}

              <span className="font-bold text-yellow-400">

                {statistics.sold}

              </span>{" "}

              have been sold,

              and{" "}

              <span className="font-bold text-red-400">

                {statistics.offMarket}

              </span>{" "}

              are currently off the market.

            </p>

          </div>

        </div>

      </section>

    </section>

  );

};

export default PropertyManagementPanel;