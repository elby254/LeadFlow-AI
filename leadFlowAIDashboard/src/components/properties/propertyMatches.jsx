/**
 * ==========================================================
 * Displays AI-recommended property matches for the
 * logged-in agent's customers.
 *
 * Every recommendation represents the highest matching
 * property for one of the agent's active leads.
 *
 * Future Backend
 * --------------
 * GET /api/agent/property-matches
 *
 * ==========================================================
 */

import { useEffect, useState } from "react";

import { useNavigate } from "react-router-dom";

import {
  Building2,
  MapPin,
  BadgeDollarSign,
  Sparkles,
} from "lucide-react";

const PropertyMatches = () => {

  const navigate = useNavigate();

  const [matches, setMatches] = useState([]);

  //----------------------------------------------------------

  useEffect(() => {

    /**
     * Temporary mock data.
     * Replace with backend.
     */

    setMatches([

      {
        id: "property001",

        leadId: "lead001",

        customer: "John Mwangi",

        property: "3 Bedroom Apartment",

        location: "Westlands",

        price: "KES 9,000,000",

        match: 98,

        image:
          "https://images.unsplash.com/photo-1560185007-cde436f6a4d0?w=800",

      },

      {
        id: "property002",

        leadId: "lead002",

        customer: "Grace Wanjiku",

        property: "4 Bedroom Maisonette",

        location: "Karen",

        price: "KES 18,500,000",

        match: 95,

        image:
          "https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800",

      },

      {
        id: "property003",

        leadId: "lead003",

        customer: "Brian Otieno",

        property: "Studio Apartment",

        location: "Kilimani",

        price: "KES 4,700,000",

        match: 92,

        image:
          "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=800",

      },

    ]);

  }, []);

  //----------------------------------------------------------

  const matchColor = (score) => {

    if (score >= 95)
      return "text-emerald-400";

    if (score >= 90)
      return "text-cyan-400";

    return "text-orange-400";

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

        <div className="flex items-center justify-between">

          <div>

            <h2 className="text-2xl font-bold text-white">
              Property Matches
            </h2>

            <p className="mt-2 text-sm text-slate-400">
              AI-selected listings matching your customers.
            </p>

          </div>

          <Sparkles
            className="text-cyan-400"
            size={28}
          />

        </div>

      </div>

      {/* Cards */}

      <div
        className="
          grid
          gap-6
          p-6
          lg:grid-cols-3
        "
      >

        {matches.map((property) => (

          <div
            key={property.id}
            className="
              overflow-hidden
              rounded-2xl
              border
              border-slate-800
              bg-slate-950
            "
          >

            <img
              src={property.image}
              alt={property.property}
              className="
                h-52
                w-full
                object-cover
              "
            />

            <div className="space-y-4 p-5">

              <div>

                <p className="text-xs uppercase tracking-wide text-cyan-400">
                  Recommended for
                </p>

                <h3 className="mt-1 text-lg font-semibold text-white">
                  {property.customer}
                </h3>

              </div>

              <div className="flex items-center gap-2">

                <Building2
                  size={18}
                  className="text-cyan-400"
                />

                <span className="text-slate-300">
                  {property.property}
                </span>

              </div>

              <div className="flex items-center gap-2">

                <MapPin
                  size={18}
                  className="text-orange-400"
                />

                <span className="text-slate-300">
                  {property.location}
                </span>

              </div>

              <div className="flex items-center gap-2">

                <BadgeDollarSign
                  size={18}
                  className="text-emerald-400"
                />

                <span className="font-semibold text-white">
                  {property.price}
                </span>

              </div>

              <div className="flex items-center justify-between">

                <span className="text-sm text-slate-400">
                  AI Match
                </span>

                <span
                  className={`text-2xl font-bold ${matchColor(
                    property.match
                  )}`}
                >
                  {property.match}%
                </span>

              </div>

              <div className="flex gap-3">

                <button
                  onClick={() =>
                    navigate(`/properties/${property.id}`)
                  }
                  className="
                    flex-1
                    rounded-xl
                    border
                    border-slate-700
                    px-4
                    py-2
                    text-sm
                    text-white
                    hover:bg-slate-800
                  "
                >
                  View Property
                </button>

                <button
                  onClick={() =>
                    navigate(`/contact/${property.leadId}`)
                  }
                  className="
                    flex-1
                    rounded-xl
                    bg-cyan-500
                    px-4
                    py-2
                    text-sm
                    font-semibold
                    text-slate-950
                    hover:bg-cyan-400
                  "
                >
                  Share
                </button>

              </div>

            </div>

          </div>

        ))}

      </div>

    </section>

  );

};

export default PropertyMatches;