/**
 * ==========================================================
 * Displays premium property listings recommended
 * for prospective buyers or renters.
 *
 * Viewer Permissions
 * ------------------
 * ✓ Browse featured properties
 * ✓ View property details
 * ✓ Contact assigned property agent
 *
 * ✗ No editing
 * ✗ No inventory management
 * ✗ No CRM information
 *
 * Future Backend
 * --------------
 * GET /api/viewer/properties/featured
 *
 * Future Enhancements
 * -------------------
 * • AI personalized recommendations
 * • Save property to favourites
 * • Virtual tours
 * • Property comparison
 * • Mortgage estimator
 *
 * ==========================================================
 */

import { useEffect, useState } from "react";

import { useNavigate } from "react-router-dom";

import {
  MapPin,
  BedDouble,
  Bath,
  Home,
  Star,
} from "lucide-react";

const FeaturedProperties = () => {

  const navigate = useNavigate();

  //----------------------------------------------------------
  // State
  //----------------------------------------------------------

  const [properties, setProperties] = useState([]);

  const [loading, setLoading] = useState(true);

  //----------------------------------------------------------
  // Load Featured Properties
  //----------------------------------------------------------

  useEffect(() => {

    // Temporary mock data
    // Replace with backend API later

    setProperties([

      {
        _id: "prop001",

        title: "Luxury Apartment",

        location: "Westlands, Nairobi",

        price: "KES 14,500,000",

        bedrooms: 3,

        bathrooms: 2,

        type: "Apartment",

        featured: true,

        image:
          "https://images.unsplash.com/photo-1560185007-c5ca9d2c014d",

        agentId: "agent001",
      },

      {
        _id: "prop002",

        title: "Modern Family House",

        location: "Karen, Nairobi",

        price: "KES 32,000,000",

        bedrooms: 5,

        bathrooms: 4,

        type: "House",

        featured: true,

        image:
          "https://images.unsplash.com/photo-1570129477492-45c003edd2be",

        agentId: "agent002",
      },

      {
        _id: "prop003",

        title: "Executive Maisonette",

        location: "Kilimani, Nairobi",

        price: "KES 24,800,000",

        bedrooms: 4,

        bathrooms: 3,

        type: "Maisonette",

        featured: true,

        image:
          "https://images.unsplash.com/photo-1600585154526-990dced4db0d",

        agentId: "agent003",
      },

    ]);

    setLoading(false);

  }, []);

  //----------------------------------------------------------
  // Helpers
  //----------------------------------------------------------

  const openProperty = (propertyId) => {

    navigate(`/viewer/properties/${propertyId}`);

  };

  const contactAgent = (agentId) => {

    navigate(`/viewer/conversations/new?agent=${agentId}`);

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

          Loading featured properties...

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

            <Star
              size={22}
              className="text-yellow-400"
            />

            Featured Properties

          </h2>

          <p
            className="
              mt-2
              text-sm
              text-slate-400
            "
          >

            Hand-picked listings currently recommended for you.

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

          Browse All

        </button>

      </div>

      {/*======================================================
        PROPERTY GRID
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

              {property.featured && (

                <span
                  className="
                    absolute
                    left-4
                    top-4
                    rounded-full
                    bg-yellow-500
                    px-3
                    py-1
                    text-xs
                    font-bold
                    text-slate-950
                  "
                >

                  ⭐ Featured

                </span>

              )}

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

              <div>

                <p
                  className="
                    text-2xl
                    font-bold
                    text-cyan-400
                  "
                >

                  {property.price}

                </p>

              </div>

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

              {/*======================================================
                ACTIONS
              ======================================================*/}

              <div
                className="
                  flex
                  gap-3
                  pt-2
                "
              >

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
                    bg-slate-900
                    px-4
                    py-3
                    text-sm
                    font-semibold
                    text-white
                    transition
                    hover:border-cyan-500
                    hover:bg-slate-800
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

        <p
          className="
            text-sm
            text-slate-400
          "
        >

          Featured listings are updated regularly based on availability,
          market demand, and agency recommendations.

        </p>

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

export default FeaturedProperties;

