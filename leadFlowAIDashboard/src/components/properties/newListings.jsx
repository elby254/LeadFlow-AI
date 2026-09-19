/**
 * Displays properties recently added to LeadFlow AI.
 *
 * Used by:
 * • Viewer
 * • Managers
 * • Investors
 *
 * Read-only monitoring of newly onboarded inventory.
 *
 * Future Backend
 * --------------
 * GET /api/viewer/new-listings
 *
 * ==========================================================
 */

import { useEffect, useState } from "react";

import {
  Home,
  UserCheck,
  CalendarDays,
  Wallet,
} from "lucide-react";

const NewListings = () => {

  const [listings, setListings] = useState([]);

  //--------------------------------------------------------

  useEffect(() => {

    // Temporary mock data

    setListings([

      {

        _id: "listing001",

        property: "3 Bedroom Apartment",

        agent: "Sarah Wanjiru",

        addedToday: "09:20 AM",

        price: "KES 9,500,000",

      },

      {

        _id: "listing002",

        property: "5 Bedroom Maisonette",

        agent: "James Kariuki",

        addedToday: "10:45 AM",

        price: "KES 18,000,000",

      },

      {

        _id: "listing003",

        property: "Commercial Office",

        agent: "Peter Maina",

        addedToday: "11:35 AM",

        price: "KES 32,000,000",

      },

      {

        _id: "listing004",

        property: "Residential Plot",

        agent: "Sarah Wanjiru",

        addedToday: "01:10 PM",

        price: "KES 6,500,000",

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

          New Listings

        </h2>

        <p className="mt-2 text-sm text-slate-400">

          Properties recently added to the CRM.

        </p>

      </div>

      {/* Table */}

      <div className="overflow-x-auto">

        <table className="w-full">

          <thead>

            <tr className="border-b border-slate-800">

              <th className="px-6 py-4 text-left text-sm text-slate-400">
                Property
              </th>

              <th className="px-6 py-4 text-left text-sm text-slate-400">
                Agent
              </th>

              <th className="px-6 py-4 text-left text-sm text-slate-400">
                Added Today
              </th>

              <th className="px-6 py-4 text-left text-sm text-slate-400">
                Price
              </th>

            </tr>

          </thead>

          <tbody>

            {listings.map((listing) => (

              <tr
                key={listing._id}
                className="
                  border-b
                  border-slate-800
                  hover:bg-slate-800/40
                "
              >

                {/* Property */}

                <td className="px-6 py-5">

                  <div className="flex items-center gap-3">

                    <div
                      className="
                        rounded-xl
                        bg-cyan-500/20
                        p-2
                      "
                    >

                      <Home
                        size={18}
                        className="text-cyan-400"
                      />

                    </div>

                    <span className="font-medium text-white">

                      {listing.property}

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

                      {listing.agent}

                    </span>

                  </div>

                </td>

                {/* Added Today */}

                <td className="px-6 py-5">

                  <div className="flex items-center gap-2">

                    <CalendarDays
                      size={16}
                      className="text-orange-400"
                    />

                    <span className="text-slate-300">

                      {listing.addedToday}

                    </span>

                  </div>

                </td>

                {/* Price */}

                <td className="px-6 py-5">

                  <div className="flex items-center gap-2">

                    <Wallet
                      size={16}
                      className="text-violet-400"
                    />

                    <span className="font-semibold text-white">

                      {listing.price}

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

export default NewListings;