/**
 * ==========================================================
 * Displays AI-personalized property recommendations for
 * the current viewer.
 *
 * Recommendations are generated from:
 * • Preferred locations
 * • Budget range
 * • Property type
 * • Previous searches
 * • Saved properties
 * • AI similarity scoring
 *
 * This component is READ-ONLY.
 *
 * Used by:
 * • Viewer Dashboard
 *
 * Future Backend
 * ----------------------------------------------------------
 * GET /api/viewer/recommended-properties
 *
 * Future AI Enhancements
 * ----------------------------------------------------------
 * • Recommendation explanations
 * • Similar property clustering
 * • Behaviour-based recommendations
 * • Price prediction
 * • Market trend recommendations
 *
 * ==========================================================
 */

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  Sparkles,
  MapPin,
  BedDouble,
  Bath,
  Home,
} from "lucide-react";

const RecommendedProperties = () => {

  //----------------------------------------------------------
  // Navigation
  //----------------------------------------------------------

  const navigate = useNavigate();

  //----------------------------------------------------------
  // State
  //----------------------------------------------------------

  const [properties, setProperties] = useState([]);

  const [loading, setLoading] = useState(true);

  //----------------------------------------------------------
  // Mock Data
  //----------------------------------------------------------

  useEffect(() => {

    // Temporary mock data
    // Replace with GET /api/viewer/recommended-properties

    setTimeout(() => {

      setProperties([

        {
          _id: "prop001",

          title: "Modern 3 Bedroom Apartment",

          location: "Westlands",

          type: "Apartment",

          bedrooms: 3,

          bathrooms: 2,

          price: "KES 13,500,000",

          image:
            "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85",

          matchScore: 96,

          reason:
            "Matches your preferred location and budget.",

          agentId: "agent001",
        },

        {
          _id: "prop002",

          title: "Luxury Family Villa",

          location: "Karen",

          type: "House",

          bedrooms: 5,

          bathrooms: 4,

          price: "KES 42,000,000",

          image:
            "https://images.unsplash.com/photo-1568605114967-8130f3a36994",

          matchScore: 91,

          reason:
            "Similar to properties you've recently viewed.",

          agentId: "agent002",
        },

        {
          _id: "prop003",

          title: "Executive Penthouse",

          location: "Kilimani",

          type: "Penthouse",

          bedrooms: 4,

          bathrooms: 3,

          price: "KES 28,500,000",

          image:
            "https://images.unsplash.com/photo-1494526585095-c41746248156",

          matchScore: 88,

          reason:
            "Recommended by LeadFlow AI based on your interests.",

          agentId: "agent003",
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
          Loading AI recommendations...
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

            <Sparkles
              size={24}
              className="text-cyan-400"
            />

            AI Recommended Properties

          </h2>

          <p
            className="
              mt-2
              text-sm
              text-slate-400
            "
          >

            Personalized property suggestions generated from your
            preferences and browsing activity.

          </p>

        </div>

        <button
          onClick={() =>
            navigate("/viewer/properties")
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

          Browse Properties

        </button>

      </div>

      {/*======================================================
        RECOMMENDED PROPERTY GRID
      ======================================================*/}

      <div
        className="
          grid
          gap-6
          p-6
          md:grid-cols-2
          xl:grid-cols-3
        "
      >

        {properties.map((property) => (

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

              {/* AI Match Badge */}

              <div
                className="
                  absolute
                  right-4
                  top-4
                  rounded-full
                  bg-cyan-500
                  px-3
                  py-2
                  text-xs
                  font-bold
                  text-slate-950
                "
              >

                {property.matchScore}% Match

              </div>

            </div>

            {/* Property Details */}

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

              {/* Property Specs */}

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

                <span className="flex items-center gap-2">

                  <Home size={18} />

                  {property.type}

                </span>

              </div>

              {/* AI Explanation */}

              <div
                className="
                  rounded-xl
                  border
                  border-cyan-500/20
                  bg-cyan-500/10
                  p-4
                "
              >

                <p
                  className="
                    text-xs
                    font-semibold
                    uppercase
                    tracking-wide
                    text-cyan-300
                  "
                >

                  Why Recommended

                </p>

                <p
                  className="
                    mt-2
                    text-sm
                    leading-relaxed
                    text-slate-300
                  "
                >

                  {property.reason}

                </p>

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

        <div>

          <p className="text-sm text-slate-400">

            Recommendations are continuously updated as you browse,
            save properties, and interact with listings.

          </p>

        </div>

        <button
          onClick={() =>
            navigate("/viewer/properties")
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

          Explore More Properties →

        </button>

      </div>

    </section>

  );

};

export default RecommendedProperties;