/**
 * ==========================================================
 * Unified property overview for LeadFlow AI.
 *
 * Merges:
 * • PropertyOverview
 * • ListingsOverview
 *
 * Displays:
 * • Total property inventory
 * • Inventory status
 * • Property type distribution
 * • Quick access to browse listings
 *
 * USED BY
 * -------
 * ViewerDashboard.jsx
 *
 * Future Backend
 * --------------
 * GET /api/viewer/property-overview
 *
 * ==========================================================
 */

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  Building2,
  Building,
  Home,
  Briefcase,
  Map,
  CheckCircle2,
  Clock3,
  BadgeCheck,
  Archive,
  ArrowRight,
} from "lucide-react";

const PropertyOverview = () => {

  const navigate = useNavigate();

  //----------------------------------------------------------
  // PROPERTY DATA
  //----------------------------------------------------------

  const [properties, setProperties] = useState({

    total: 0,

    available: 0,

    reserved: 0,

    sold: 0,

    inactive: 0,

    apartments: 0,

    houses: 0,

    commercial: 0,

    land: 0,

  });

  //----------------------------------------------------------
  // MOCK DATA
  //----------------------------------------------------------

  useEffect(() => {

    // Temporary data
    // Replace with API call later.

    setProperties({

      total: 243,

      available: 148,

      reserved: 41,

      sold: 37,

      inactive: 17,

      apartments: 96,

      houses: 74,

      commercial: 38,

      land: 35,

    });

  }, []);

  //----------------------------------------------------------
  // INVENTORY KPI CARDS
  //----------------------------------------------------------

  const inventoryCards = [

    {
      title: "Total Listings",
      value: properties.total,
      icon: Building2,
      color: "bg-cyan-500",
    },

    {
      title: "Available",
      value: properties.available,
      icon: CheckCircle2,
      color: "bg-emerald-500",
    },

    {
      title: "Reserved",
      value: properties.reserved,
      icon: Clock3,
      color: "bg-orange-500",
    },

    {
      title: "Sold",
      value: properties.sold,
      icon: BadgeCheck,
      color: "bg-violet-500",
    },

  ];

  //----------------------------------------------------------
  // PROPERTY TYPE BREAKDOWN
  //----------------------------------------------------------

  const propertyTypes = [

    {
      title: "Apartments",
      value: properties.apartments,
      icon: Building,
      color: "bg-cyan-500",
    },

    {
      title: "Houses",
      value: properties.houses,
      icon: Home,
      color: "bg-emerald-500",
    },

    {
      title: "Commercial",
      value: properties.commercial,
      icon: Briefcase,
      color: "bg-orange-500",
    },

    {
      title: "Land",
      value: properties.land,
      icon: Map,
      color: "bg-violet-500",
    },

    {
      title: "Inactive",
      value: properties.inactive,
      icon: Archive,
      color: "bg-slate-500",
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

      {/*======================================================
          HEADER
      ======================================================*/}

      <div className="border-b border-slate-800 p-6">

        <div className="flex items-center justify-between">

          <div>

            <h2 className="text-2xl font-bold text-white">
              🏠 Property Overview
            </h2>

            <p className="mt-2 text-sm text-slate-400">
              Browse the current property inventory available
              across the agency.
            </p>

          </div>

          <button
            onClick={() => navigate("/viewer/properties")}
            className="
              flex
              items-center
              gap-2
              rounded-xl
              bg-cyan-500
              px-5
              py-3
              text-sm
              font-semibold
              text-slate-950
              transition
              hover:bg-cyan-400
            "
          >
            Browse Properties

            <ArrowRight size={16} />

          </button>

        </div>

      </div>

      {/*======================================================
          INVENTORY KPI CARDS
      ======================================================*/}

      <div
        className="
          grid
          gap-6
          p-6
          sm:grid-cols-2
          xl:grid-cols-4
        "
      >

        {inventoryCards.map((card) => {

          const Icon = card.icon;

          return (

            <div
              key={card.title}
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
                    {card.title}
                  </p>

                  <h3
                    className="
                      mt-3
                      text-4xl
                      font-bold
                      text-white
                    "
                  >
                    {card.value}
                  </h3>

                </div>

                <div
                  className={`
                    ${card.color}
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

            </div>

          );

        })}

      </div>

      {/*======================================================
          PROPERTY TYPE BREAKDOWN
      ======================================================*/}

      <div className="border-t border-slate-800 p-6">

        <div className="mb-6">

          <h3
            className="
              text-xl
              font-bold
              text-white
            "
          >
            Property Types
          </h3>

          <p
            className="
              mt-2
              text-sm
              text-slate-400
            "
          >
            Distribution of listings currently available in the
            LeadFlow AI marketplace.
          </p>

        </div>

        <div
          className="
            grid
            gap-5
            sm:grid-cols-2
            lg:grid-cols-3
            xl:grid-cols-5
          "
        >

          {propertyTypes.map((property) => {

            const Icon = property.icon;

            return (

              <div
                key={property.title}
                className="
                  rounded-2xl
                  border
                  border-slate-800
                  bg-slate-950
                  p-5
                  transition
                  hover:border-cyan-500/30
                "
              >

                <div className="flex items-center justify-between">

                  <div>

                    <p
                      className="
                        text-sm
                        text-slate-400
                      "
                    >
                      {property.title}
                    </p>

                    <h3
                      className="
                        mt-3
                        text-3xl
                        font-bold
                        text-white
                      "
                    >
                      {property.value}
                    </h3>

                  </div>

                  <div
                    className={`
                      ${property.color}
                      flex
                      h-12
                      w-12
                      items-center
                      justify-center
                      rounded-xl
                    `}
                  >

                    <Icon
                      size={22}
                      className="text-white"
                    />

                  </div>

                </div>

              </div>

            );

          })}

        </div>

      </div>

      {/*======================================================
          INVENTORY SUMMARY
      ======================================================*/}

      <div className="border-t border-slate-800 p-6">

        <div
          className="
            rounded-2xl
            border
            border-cyan-500/20
            bg-cyan-500/10
            p-6
          "
        >

          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">

            <div>

              <h3
                className="
                  text-xl
                  font-bold
                  text-cyan-300
                "
              >
                Inventory Summary
              </h3>

              <p
                className="
                  mt-2
                  max-w-3xl
                  text-sm
                  leading-relaxed
                  text-slate-300
                "
              >
                LeadFlow AI currently manages{" "}
                <strong className="text-white">
                  {properties.total}
                </strong>{" "}
                listings across apartments, residential homes,
                commercial properties and land. Browse available
                properties, compare locations and connect directly
                with an assigned real estate agent.
              </p>

            </div>

            <div
              className="
                rounded-2xl
                border
                border-slate-700
                bg-slate-900
                p-5
                text-center
              "
            >

              <p
                className="
                  text-sm
                  text-slate-400
                "
              >
                Available Properties
              </p>

              <h3
                className="
                  mt-2
                  text-5xl
                  font-bold
                  text-emerald-400
                "
              >
                {properties.available}
              </h3>

            </div>

          </div>

        </div>

      </div>

      {/*======================================================
          FOOTER
      ======================================================*/}

      <div
        className="
          flex
          flex-col
          gap-4
          border-t
          border-slate-800
          p-6
          lg:flex-row
          lg:items-center
          lg:justify-between
        "
      >

        <p
          className="
            text-sm
            text-slate-400
          "
        >
          Explore all available listings, compare property types,
          and begin conversations with real estate agents.
        </p>

        <button
          onClick={() => navigate("/viewer/properties")}
          className="
            inline-flex
            items-center
            gap-2
            rounded-xl
            bg-cyan-500
            px-6
            py-3
            text-sm
            font-semibold
            text-slate-950
            transition
            hover:bg-cyan-400
          "
        >

          Browse All Properties

          <ArrowRight size={18} />

        </button>

      </div>

    </section>

  );

};

export default PropertyOverview;