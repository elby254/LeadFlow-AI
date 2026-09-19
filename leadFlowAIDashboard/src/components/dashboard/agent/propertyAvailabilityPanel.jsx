/**
 * ==========================================================
 *
 * Purpose
 * ----------------------------------------------------------
 * Shows available properties that an agent can recommend
 * to active leads.
 *
 * Intended Users
 * ----------------------------------------------------------
 * • Agent
 *
 * Features
 * ----------------------------------------------------------
 * • View available listings
 * • Quick property overview
 * • Search properties
 * • Filter by status
 * • Navigate to property details
 *
 * Data Source
 * ----------------------------------------------------------
 * useAvailableProperties()
 *
 * Backend
 * ----------------------------------------------------------
 * GET /api/properties/available
 *
 * IMAGE ARCHITECTURE
 * ----------------------------------------------------------
 *
 * This component displays the property's EXISTING
 * cover image.
 *
 * Flow:
 *
 *     Existing Property
 *           ↓
 *     Existing PropertyImage
 *           ↓
 *     property.coverImage
 *           ↓
 *     getPropertyImageUrl(property)
 *           ↓
 *     Existing image URL
 *
 * IMPORTANT
 * ----------------------------------------------------------
 *
 * This component does NOT:
 *
 * • Generate a new image
 * • Upload an image
 * • Create PropertyImage records
 * • Replace coverImage
 * • Use property.images[0] as the primary image source
 *
 * The shared helper is the single frontend image resolver.
 *
 * Shared helper:
 *
 *     src/utils/propertyImage.js
 *
 * ==========================================================
 */

import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  Building2,
  Search,
  MapPin,
  Home,
  Loader2,
  ArrowRight,
  RefreshCw,
} from "lucide-react";

import useAvailableProperties from "../../../hooks/useAvailableProperties";

import getPropertyImageUrl from "../../../utils/propertyImage";


/* ==========================================================
   PROPERTY AVAILABILITY PANEL
========================================================== */

const PropertyAvailabilityPanel = () => {

  //----------------------------------------------------------
  // Navigation
  //----------------------------------------------------------

  const navigate = useNavigate();


  //----------------------------------------------------------
  // Hook
  //----------------------------------------------------------

  const {
    properties,
    loading,
    error,
    refresh,
  } = useAvailableProperties();


  //----------------------------------------------------------
  // Search
  //----------------------------------------------------------

  const [search, setSearch] = useState("");


  //----------------------------------------------------------
  // Filtered Properties
  //----------------------------------------------------------

  const filteredProperties = useMemo(() => {

    if (!Array.isArray(properties)) {
      return [];
    }

    if (!search.trim()) {
      return properties;
    }

    const keyword =
      search.trim().toLowerCase();

    return properties.filter((property) => {

      const title =
        property.title?.toLowerCase() || "";

      const location =
        property.location?.toLowerCase() || "";

      const propertyType =
        property.propertyType?.toLowerCase() || "";

      return (
        title.includes(keyword) ||
        location.includes(keyword) ||
        propertyType.includes(keyword)
      );

    });

  }, [properties, search]);


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
            className="
              animate-spin
              text-cyan-400
            "
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

        <h3
          className="
            text-xl
            font-bold
            text-red-400
          "
        >
          Unable to Load Available Properties
        </h3>

        <p
          className="
            mt-3
            text-slate-300
          "
        >
          {error}
        </p>

        <button
          type="button"
          onClick={refresh}
          className="
            mt-6
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

          <RefreshCw size={18} />

          Refresh

        </button>

      </section>

    );

  }


  //----------------------------------------------------------
  // Safe Properties Array
  //----------------------------------------------------------

  const safeProperties =
    Array.isArray(properties)
      ? properties
      : [];


  //----------------------------------------------------------
  // Render
  //----------------------------------------------------------

  return (

    <section className="space-y-8">


      {/* ======================================================
          HEADER
      ====================================================== */}

      <div
        className="
          flex
          flex-col
          gap-4
          md:flex-row
          md:items-center
          md:justify-between
        "
      >

        <div>

          <h2
            className="
              text-2xl
              font-bold
              text-white
            "
          >
            Available Properties
          </h2>

          <p
            className="
              mt-2
              text-slate-400
            "
          >
            Browse listings currently available for
            your clients.
          </p>

        </div>


        <button
          type="button"
          onClick={() =>
            navigate("/properties/available")
          }
          className="
            inline-flex
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

          View All

          <ArrowRight size={18} />

        </button>

      </div>


      {/* ======================================================
          SUMMARY
      ====================================================== */}

      <div
        className="
          grid
          gap-6
          md:grid-cols-3
        "
      >


        {/* ====================================================
            AVAILABLE LISTINGS
        ==================================================== */}

        <div
          className="
            rounded-2xl
            border
            border-slate-800
            bg-slate-900
            p-6
          "
        >

          <Building2
            size={22}
            className="text-cyan-400"
          />

          <h3
            className="
              mt-4
              text-3xl
              font-bold
              text-white
            "
          >
            {safeProperties.length}
          </h3>

          <p
            className="
              mt-2
              text-sm
              text-slate-400
            "
          >
            Available Listings
          </p>

        </div>


        {/* ====================================================
            PROPERTY TYPES
        ==================================================== */}

        <div
          className="
            rounded-2xl
            border
            border-slate-800
            bg-slate-900
            p-6
          "
        >

          <Home
            size={22}
            className="text-emerald-400"
          />

          <h3
            className="
              mt-4
              text-3xl
              font-bold
              text-white
            "
          >

            {
              [
                ...new Set(
                  safeProperties
                    .map(
                      (property) =>
                        property.propertyType
                    )
                    .filter(Boolean)
                ),
              ].length
            }

          </h3>

          <p
            className="
              mt-2
              text-sm
              text-slate-400
            "
          >
            Property Types
          </p>

        </div>


        {/* ====================================================
            LOCATIONS
        ==================================================== */}

        <div
          className="
            rounded-2xl
            border
            border-slate-800
            bg-slate-900
            p-6
          "
        >

          <MapPin
            size={22}
            className="text-purple-400"
          />

          <h3
            className="
              mt-4
              text-3xl
              font-bold
              text-white
            "
          >

            {
              [
                ...new Set(
                  safeProperties
                    .map(
                      (property) =>
                        property.location
                    )
                    .filter(Boolean)
                ),
              ].length
            }

          </h3>

          <p
            className="
              mt-2
              text-sm
              text-slate-400
            "
          >
            Locations
          </p>

        </div>

      </div>


      {/* ======================================================
          SEARCH
      ====================================================== */}

      <div
        className="
          rounded-2xl
          border
          border-slate-800
          bg-slate-900
          p-6
        "
      >

        <div className="relative">

          <Search
            size={18}
            className="
              absolute
              left-4
              top-1/2
              -translate-y-1/2
              text-slate-500
            "
          />

          <input
            type="text"
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="
              Search property, location or type...
            "
            className="
              w-full
              rounded-xl
              border
              border-slate-700
              bg-slate-950
              py-3
              pl-12
              pr-4
              text-white
              placeholder:text-slate-500
              outline-none
              transition
              focus:border-cyan-500
            "
          />

        </div>

      </div>


      {/* ======================================================
          PROPERTY GRID
      ====================================================== */}

      <div
        className="
          grid
          gap-6
          lg:grid-cols-2
          xl:grid-cols-3
        "
      >

        {filteredProperties.map((property) => {

          /* ==================================================
             EXISTING COVER IMAGE
             
             IMPORTANT:
             
             Resolve the existing cover image through the
             shared helper.
             
             We intentionally DO NOT use:
             
                 property.images[0]
             
             The property's coverImage is the source of truth.
          ================================================== */

          const propertyImage =
            getPropertyImageUrl(property);


          return (

            <article
              key={property._id}
              className="
                overflow-hidden
                rounded-2xl
                border
                border-slate-800
                bg-slate-900
                transition
                hover:border-cyan-500
                hover:shadow-xl
              "
            >


              {/* =============================================
                  PROPERTY IMAGE
              ============================================= */}

              <div
                className="
                  relative
                  h-52
                  overflow-hidden
                  bg-slate-800
                "
              >

                {propertyImage ? (

                  <img
                    src={propertyImage}
                    alt={
                      property.title ||
                      "Property"
                    }
                    className="
                      h-full
                      w-full
                      object-cover
                    "
                    onError={(event) => {

                      event.currentTarget.style.display =
                        "none";

                    }}
                  />

                ) : (

                  <div
                    className="
                      flex
                      h-full
                      items-center
                      justify-center
                    "
                  >

                    <Building2
                      size={42}
                      className="
                        text-slate-600
                      "
                    />

                  </div>

                )}


                {/* =========================================
                    STATUS
                ========================================= */}

                <span
                  className="
                    absolute
                    right-4
                    top-4
                    rounded-full
                    bg-emerald-500
                    px-3
                    py-1
                    text-xs
                    font-semibold
                    text-slate-950
                  "
                >
                  Available
                </span>

              </div>


              {/* =============================================
                  PROPERTY DETAILS
              ============================================= */}

              <div
                className="
                  space-y-5
                  p-6
                "
              >


                {/* ==========================================
                    TITLE + LOCATION
                ========================================== */}

                <div>

                  <h3
                    className="
                      text-lg
                      font-bold
                      text-white
                    "
                  >
                    {property.title ||
                      "Untitled Property"}
                  </h3>

                  <div
                    className="
                      mt-2
                      flex
                      items-center
                      gap-2
                      text-sm
                      text-slate-400
                    "
                  >

                    <MapPin size={15} />

                    <span>
                      {property.location ||
                        "Location not specified"}
                    </span>

                  </div>

                </div>


                {/* ==========================================
                    PRICE
                ========================================== */}

                <div
                  className="
                    text-2xl
                    font-bold
                    text-cyan-400
                  "
                >

                  {property.currency || "KES"}{" "}

                  {Number(
                    property.price || 0
                  ).toLocaleString()}

                </div>


                {/* ==========================================
                    PROPERTY DETAILS
                ========================================== */}

                <div
                  className="
                    grid
                    grid-cols-3
                    gap-3
                    text-center
                  "
                >

                  {/* BEDROOMS */}

                  <div
                    className="
                      rounded-xl
                      bg-slate-950
                      p-3
                    "
                  >

                    <p
                      className="
                        text-lg
                        font-bold
                        text-white
                      "
                    >
                      {property.bedrooms ?? "-"}
                    </p>

                    <p
                      className="
                        text-xs
                        text-slate-500
                      "
                    >
                      Beds
                    </p>

                  </div>


                  {/* BATHROOMS */}

                  <div
                    className="
                      rounded-xl
                      bg-slate-950
                      p-3
                    "
                  >

                    <p
                      className="
                        text-lg
                        font-bold
                        text-white
                      "
                    >
                      {property.bathrooms ?? "-"}
                    </p>

                    <p
                      className="
                        text-xs
                        text-slate-500
                      "
                    >
                      Baths
                    </p>

                  </div>


                  {/* PROPERTY TYPE */}

                  <div
                    className="
                      rounded-xl
                      bg-slate-950
                      p-3
                    "
                  >

                    <p
                      className="
                        text-sm
                        font-bold
                        text-white
                      "
                    >
                      {property.propertyType ||
                        "-"}
                    </p>

                    <p
                      className="
                        text-xs
                        text-slate-500
                      "
                    >
                      Type
                    </p>

                  </div>

                </div>


                {/* ==========================================
                    ACTIONS
                ========================================== */}

                <div
                  className="
                    flex
                    gap-3
                  "
                >

                  {/* VIEW DETAILS */}

                  <button
                    type="button"
                    onClick={() =>
                      navigate(
                        `/properties/${property._id}`
                      )
                    }
                    className="
                      flex-1
                      rounded-xl
                      bg-cyan-500
                      px-4
                      py-3
                      font-semibold
                      text-slate-950
                      transition
                      hover:bg-cyan-400
                    "
                  >
                    View Details
                  </button>


                  {/* RECOMMEND */}

                  <button
                    type="button"
                    className="
                      rounded-xl
                      border
                      border-cyan-500
                      px-4
                      py-3
                      font-semibold
                      text-cyan-400
                      transition
                      hover:bg-cyan-500
                      hover:text-slate-950
                    "
                  >
                    Recommend
                  </button>

                </div>

              </div>

            </article>

          );

        })}

      </div>


      {/* ======================================================
          EMPTY STATE
      ====================================================== */}

      {filteredProperties.length === 0 && (

        <section
          className="
            rounded-2xl
            border
            border-slate-800
            bg-slate-900
            p-16
            text-center
          "
        >

          <Building2
            size={56}
            className="
              mx-auto
              mb-6
              text-slate-600
            "
          />

          <h3
            className="
              text-2xl
              font-bold
              text-white
            "
          >
            No Properties Found
          </h3>

          <p
            className="
              mx-auto
              mt-3
              max-w-md
              text-slate-400
            "
          >
            No available properties match your
            current search.
          </p>

          <button
            type="button"
            onClick={() => setSearch("")}
            className="
              mt-8
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
            Clear Search
          </button>

        </section>

      )}


      {/* ======================================================
          FOOTER
      ====================================================== */}

      {filteredProperties.length > 0 && (

        <div
          className="
            flex
            flex-col
            items-center
            justify-between
            gap-4
            rounded-2xl
            border
            border-slate-800
            bg-slate-900
            p-6
            text-sm
            text-slate-400
            md:flex-row
          "
        >

          <p>

            Showing{" "}

            <span
              className="
                font-semibold
                text-white
              "
            >
              {filteredProperties.length}
            </span>{" "}

            of{" "}

            <span
              className="
                font-semibold
                text-white
              "
            >
              {safeProperties.length}
            </span>{" "}

            available properties.

          </p>


          <button
            type="button"
            onClick={refresh}
            className="
              inline-flex
              items-center
              gap-2
              rounded-xl
              border
              border-cyan-500
              px-5
              py-2.5
              font-semibold
              text-cyan-400
              transition
              hover:bg-cyan-500
              hover:text-slate-950
            "
          >

            <RefreshCw size={16} />

            Refresh Listings

          </button>

        </div>

      )}

    </section>

  );

};


export default PropertyAvailabilityPanel;