/**
 * Read-only overview of current property inventory status.
 *
 * Used by:
 * • Viewer
 * • Managers
 * • Investors
 *
 * Shows the operational status of all property listings.
 *
 * Future Backend
 * --------------
 * GET /api/viewer/inventory-status
 *
 * ==========================================================
 */

import { useEffect, useState } from "react";

import {
  CheckCircle2,
  Clock3,
  BadgeCheck,
  Archive,
} from "lucide-react";

const PropertyInventoryOverview = () => {

  const [inventory, setInventory] = useState({

    available: 0,

    reserved: 0,

    sold: 0,

    inactive: 0,

  });

  //--------------------------------------------------------

  useEffect(() => {

    // Temporary mock data

    setInventory({

      available: 148,

      reserved: 41,

      sold: 37,

      inactive: 17,

    });

  }, []);

  //--------------------------------------------------------

  const total =
    inventory.available +
    inventory.reserved +
    inventory.sold +
    inventory.inactive;

  //--------------------------------------------------------

  const cards = [

    {

      title: "Available",

      value: inventory.available,

      icon: CheckCircle2,

      color: "bg-emerald-500",

    },

    {

      title: "Reserved",

      value: inventory.reserved,

      icon: Clock3,

      color: "bg-orange-500",

    },

    {

      title: "Sold",

      value: inventory.sold,

      icon: BadgeCheck,

      color: "bg-cyan-500",

    },

    {

      title: "Inactive",

      value: inventory.inactive,

      icon: Archive,

      color: "bg-slate-500",

    },

  ];

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
              Inventory Status
            </h2>

            <p className="mt-2 text-sm text-slate-400">
              Current property stock across the agency.
            </p>

          </div>

          <div className="text-right">

            <p className="text-sm text-slate-400">
              Total Properties
            </p>

            <p className="text-3xl font-bold text-cyan-400">
              {total}
            </p>

          </div>

        </div>

      </div>

      {/* Status Cards */}

      <div
        className="
          grid
          gap-6
          p-6
          sm:grid-cols-2
          xl:grid-cols-4
        "
      >

        {cards.map((card) => {

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

                  <h3 className="mt-3 text-4xl font-bold text-white">
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

              {/* Progress */}

              <div className="mt-6">

                <div className="h-2 w-full rounded-full bg-slate-800">

                  <div
                    className={`${card.color} h-2 rounded-full`}
                    style={{
                      width:
                        total > 0
                          ? `${(card.value / total) * 100}%`
                          : "0%",
                    }}
                  />

                </div>

                <p className="mt-2 text-xs text-slate-500">

                  {total > 0
                    ? `${Math.round(
                        (card.value / total) * 100
                      )}% of inventory`
                    : "0% of inventory"}

                </p>

              </div>

            </div>

          );

        })}

      </div>

    </section>

  );

};

export default PropertyInventoryOverview;