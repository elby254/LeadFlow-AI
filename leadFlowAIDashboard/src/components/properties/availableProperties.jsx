/**
 * ==========================================================
 * Displays the newest available property listings.
 *
 * Used by:
 * • Viewer
 * • Managers
 * • Investors
 *
 * Read-only inventory monitor.
 *
 * Future Backend
 * --------------
 * GET /api/viewer/available-properties
 *
 * ==========================================================
 */

import { useEffect, useState } from "react";

import {
  MapPin,
  BedDouble,
  BadgeCheck,
} from "lucide-react";

const AvailableProperties = () => {

  const [properties, setProperties] = useState([]);

  //--------------------------------------------------------

  useEffect(() => {

    // Temporary mock data

    setProperties([

      {

        _id: "prop001",

        image:
          "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800",

        location: "Westlands, Nairobi",

        price: "KES 9,500,000",

        bedrooms: 3,

        status: "Available",

      },

      {

        _id: "prop002",

        image:
          "https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800",

        location: "Karen, Nairobi",

        price: "KES 18,000,000",

        bedrooms: 5,

        status: "Available",

      },

      {

        _id: "prop003",

        image:
          "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=800",

        location: "Kilimani, Nairobi",

        price: "KES 12,300,000",

        bedrooms: 4,

        status: "Available",

      },

      {

        _id: "prop004",

        image:
          "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800",

        location: "Ruaka, Kiambu",

        price: "KES 7,800,000",

        bedrooms: 2,

        status: "Available",

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
          Available Properties
        </h2>

        <p className="mt-2 text-sm text-slate-400">
          Latest available listings across the agency.
        </p>

      </div>

      {/* Property Grid */}

      <div
        className="
          grid
          gap-6
          p-6
          md:grid-cols-2
          xl:grid-cols-4
        "
      >

        {properties.map((property) => (

          <div
            key={property._id}
            className="
              overflow-hidden
              rounded-2xl
              border
              border-slate-800
              bg-slate-950
              transition
              hover:border-cyan-500/40
            "
          >

            {/* Property Image */}

            <img
              src={property.image}
              alt={property.location}
              className="h-48 w-full object-cover"
            />

            {/* Details */}

            <div className="space-y-4 p-5">

              {/* Location */}

              <div className="flex items-center gap-2">

                <MapPin
                  size={16}
                  className="text-cyan-400"
                />

                <span className="text-sm text-slate-300">

                  {property.location}

                </span>

              </div>

              {/* Price */}

              <h3 className="text-2xl font-bold text-white">

                {property.price}

              </h3>

              {/* Bedrooms */}

              <div className="flex items-center gap-2">

                <BedDouble
                  size={16}
                  className="text-orange-400"
                />

                <span className="text-sm text-slate-300">

                  {property.bedrooms} Bedrooms

                </span>

              </div>

              {/* Status */}

              <div className="flex items-center gap-2">

                <BadgeCheck
                  size={16}
                  className="text-emerald-400"
                />

                <span
                  className="
                    rounded-full
                    bg-emerald-500/15
                    px-3
                    py-1
                    text-sm
                    font-medium
                    text-emerald-300
                  "
                >

                  {property.status}

                </span>

              </div>

            </div>

          </div>

        ))}

      </div>

    </section>

  );

};

export default AvailableProperties;