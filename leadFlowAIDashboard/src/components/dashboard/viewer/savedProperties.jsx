/**
 * ==========================================================
 * Displays properties bookmarked by the current viewer.
 *
 * Allows viewers to quickly revisit their favourite
 * listings directly from the dashboard.
 *
 * Used by:
 * • Viewer Dashboard
 *
 * Future Backend
 * ----------------------------------------------------------
 * GET /api/viewer/saved-properties
 *
 * Future Enhancements
 * ----------------------------------------------------------
 * • AI recommendations from saved listings
 * • Property comparison
 * • Price change notifications
 * • Share saved properties
 * • Notes per property
 *
 * ==========================================================
 */

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  Heart,
  MapPin,
  BedDouble,
  Bath,
  CalendarDays,
} from "lucide-react";

const SavedProperties = () => {

  //----------------------------------------------------------
  // Navigation
  //----------------------------------------------------------

  const navigate = useNavigate();

  //----------------------------------------------------------
  // State
  //----------------------------------------------------------

  const [savedProperties, setSavedProperties] = useState([]);

  const [loading, setLoading] = useState(true);

  //----------------------------------------------------------
  // Mock Data
  //----------------------------------------------------------

  useEffect(() => {

    // Temporary mock data
    // Replace with:
    // GET /api/viewer/saved-properties

    setTimeout(() => {

      setSavedProperties([

        {
          _id: "property001",

          title: "Luxury 4 Bedroom Villa",

          location: "Karen",

          price: "KES 45,000,000",

          bedrooms: 4,

          bathrooms: 3,

          image:
            "https://images.unsplash.com/photo-1568605114967-8130f3a36994",

          savedAt: "2026-07-10T10:20:00Z",

          agentId: "agent001",
        },

        {
          _id: "property002",

          title: "Modern Westlands Apartment",

          location: "Westlands",

          price: "KES 14,800,000",

          bedrooms: 3,

          bathrooms: 2,

          image:
            "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85",

          savedAt: "2026-07-13T08:45:00Z",

          agentId: "agent002",
        },

        {
          _id: "property003",

          title: "Executive Kilimani Penthouse",

          location: "Kilimani",

          price: "KES 29,000,000",

          bedrooms: 4,

          bathrooms: 4,

          image:
            "https://images.unsplash.com/photo-1494526585095-c41746248156",

          savedAt: "2026-07-15T15:30:00Z",

          agentId: "agent003",
        },

        {
          _id: "property004",

          title: "Family Home in Runda",

          location: "Runda",

          price: "KES 37,500,000",

          bedrooms: 5,

          bathrooms: 4,

          image:
            "https://images.unsplash.com/photo-1570129477492-45c003edd2be",

          savedAt: "2026-07-17T09:10:00Z",

          agentId: "agent004",
        },

      ]);

      setLoading(false);

    }, 700);

  }, []);

  //----------------------------------------------------------
  // Navigation Helpers
  //----------------------------------------------------------

  const openProperty = (propertyId) => {
    navigate(`/viewer/properties/${propertyId}`);
  };

  const contactAgent = (agentId) => {
    navigate(`/viewer/agents/${agentId}`);
  };

  //----------------------------------------------------------
  // Loading State
  //----------------------------------------------------------

  if (loading) {

    return (

      <section
        className="
          rounded-3xl
          border
          border-slate-800
          bg-slate-900
          p-6
          shadow-xl
        "
      >

        <p className="text-sm text-slate-400">
          Loading saved properties...
        </p>

      </section>

    );

  }

  //----------------------------------------------------------
  // Component
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
              flex
              items-center
              gap-2
              text-2xl
              font-bold
              text-white
            "
          >

            <Heart
              size={24}
              className="text-red-400"
            />

            Saved Properties

          </h2>

          <p
            className="
              mt-2
              text-sm
              text-slate-400
            "
          >

            Properties you've bookmarked for future review and comparison.

          </p>

        </div>

        <button
          onClick={() =>
            navigate("/viewer/saved-properties")
          }
          className="
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

          View All

        </button>

      </div>

      {/*======================================================
        SAVED PROPERTIES GRID
      ======================================================*/}

      <div
        className="
          grid
          gap-6
          p-6
          md:grid-cols-2
          xl:grid-cols-2
        "
      >

        {savedProperties.map((property) => (

          <article
            key={property._id}
            className="
              overflow-hidden
              rounded-2xl
              border
              border-slate-800
              bg-slate-950
              transition-all
              duration-300
              hover:-translate-y-1
              hover:border-cyan-500/40
              hover:shadow-xl
              hover:shadow-cyan-900/20
            "
          >

            {/* Property Image */}

            <div className="relative">

              <img
                src={property.image}
                alt={property.title}
                className="
                  h-56
                  w-full
                  object-cover
                "
              />

              {/* Saved Badge */}

              <div
                className="
                  absolute
                  right-4
                  top-4
                  flex
                  items-center
                  gap-1
                  rounded-full
                  bg-red-500
                  px-3
                  py-2
                  text-xs
                  font-bold
                  text-white
                "
              >

                <Heart size={14} fill="white" />

                Saved

              </div>

            </div>

            {/* Property Information */}

            <div className="space-y-4 p-6">

              <div>

                <h3
                  className="
                    text-xl
                    font-bold
                    text-white
                  "
                >

                  {property.title}

                </h3>

                <p
                  className="
                    mt-2
                    flex
                    items-center
                    gap-2
                    text-sm
                    text-slate-400
                  "
                >

                  <MapPin size={16} />

                  {property.location}

                </p>

              </div>

              {/* Price */}

              <p
                className="
                  text-2xl
                  font-bold
                  text-cyan-400
                "
              >

                {property.price}

              </p>

              {/* Features */}

              <div
                className="
                  flex
                  items-center
                  justify-between
                  text-sm
                  text-slate-300
                "
              >

                <span className="flex items-center gap-2">

                  <BedDouble size={18} />

                  {property.bedrooms} Beds

                </span>

                <span className="flex items-center gap-2">

                  <Bath size={18} />

                  {property.bathrooms} Baths

                </span>

              </div>

              {/* Saved Date */}

              <div
                className="
                  flex
                  items-center
                  gap-2
                  rounded-xl
                  border
                  border-slate-800
                  bg-slate-900
                  p-3
                "
              >

                <CalendarDays
                  size={16}
                  className="text-cyan-400"
                />

                <span className="text-sm text-slate-300">

                  Saved on{" "}
                  {new Date(
                    property.savedAt
                  ).toLocaleDateString()}

                </span>

              </div>

              {/*======================================================
                ACTIONS
              ======================================================*/}

              <div className="flex gap-3">

                <button
                  onClick={() =>
                    openProperty(property._id)
                  }
                  className="
                    flex-1
                    rounded-xl
                    bg-cyan-500
                    px-4
                    py-3
                    text-sm
                    font-semibold
                    text-slate-950
                    transition
                    hover:bg-cyan-400
                  "
                >

                  View Details

                </button>

                <button
                  onClick={() =>
                    contactAgent(property.agentId)
                  }
                  className="
                    flex-1
                    rounded-xl
                    border
                    border-slate-700
                    bg-slate-800
                    px-4
                    py-3
                    text-sm
                    font-semibold
                    text-white
                    transition
                    hover:border-cyan-500/40
                    hover:bg-slate-700
                  "
                >

                  Contact Agent

                </button>

              </div>

            </div>

          </article>

        ))}

      </div>

      {/*======================================================
        EMPTY STATE
      ======================================================*/}

      {savedProperties.length === 0 && (

        <div className="p-8">

          <div
            className="
              rounded-2xl
              border
              border-slate-800
              bg-slate-950
              p-10
              text-center
            "
          >

            <Heart
              size={42}
              className="
                mx-auto
                text-slate-600
              "
            />

            <h3
              className="
                mt-4
                text-xl
                font-semibold
                text-white
              "
            >

              No Saved Properties

            </h3>

            <p
              className="
                mt-2
                text-sm
                text-slate-400
              "
            >

              Browse available listings and save your favourite
              properties to access them quickly later.

            </p>

            <button
              onClick={() =>
                navigate("/viewer/properties")
              }
              className="
                mt-6
                rounded-xl
                bg-cyan-500
                px-6
                py-3
                font-semibold
                text-slate-950
                transition
                hover:bg-cyan-400
              "
            >

              Browse Properties

            </button>

          </div>

        </div>

      )}

      {/*======================================================
        FOOTER
      ======================================================*/}

      <div
        className="
          flex
          items-center
          justify-between
          border-t
          border-slate-800
          p-6
        "
      >

        <p
          className="
            text-sm
            text-slate-400
          "
        >

          Saved properties stay in your account so you can compare
          listings and contact agents whenever you're ready.

        </p>

        <button
          onClick={() =>
            navigate("/viewer/saved-properties")
          }
          className="
            rounded-xl
            border
            border-cyan-500/30
            bg-cyan-500/10
            px-5
            py-3
            text-sm
            font-semibold
            text-cyan-300
            transition
            hover:bg-cyan-500
            hover:text-slate-950
          "
        >

          Manage Saved Properties →

        </button>

      </div>

    </section>

  );

};

export default SavedProperties;