/**
 * ==========================================================
 *
 * AVAILABLE PROPERTIES
 *
 * Admin:
 * /admin/properties/available
 *
 * Agent:
 * /agent/properties/available
 *
 * Viewer:
 * /viewer/properties
 *
 * ==========================================================
 *
 * RESPONSIBILITIES
 *
 * ✓ Load available properties
 * ✓ Display only available properties
 * ✓ Handle loading
 * ✓ Handle errors
 * ✓ Refresh inventory
 * ✓ Navigate to property details
 * ✓ Resolve property images through the shared image helper
 * ✓ Support viewer-friendly property discovery
 *
 * ==========================================================
 *
 * IMPORTANT
 *
 * This component does NOT render MainLayout.
 *
 * MainLayout is provided by App.jsx / routing.
 *
 * ==========================================================
 *
 * IMAGE CONSISTENCY RULE
 *
 * Every property image MUST be resolved through:
 *
 *   getPropertyImageUrl(property)
 *
 * This component must NOT independently inspect:
 *
 *   property.coverImage
 *   property.images
 *   property.image
 *
 * Image resolution belongs to the shared helper only.
 *
 * ==========================================================
 */

import { useNavigate, useLocation } from "react-router-dom";

import useProperties from "../../hooks/useProperties";
import getPropertyImageUrl from "../../utils/propertyImage";

/* ==========================================================
   AVAILABLE PROPERTIES
========================================================== */

const AvailableProperties = () => {
  const navigate = useNavigate();
  const location = useLocation();

  /* ========================================================
     DETERMINE CURRENT WORKSPACE

     This component is shared between:

       /admin/properties/available
       /agent/properties/available
       /viewer/properties

     The details destination therefore depends on the
     current workspace.
  ======================================================== */

  const pathname = location.pathname || "";

  const isViewer =
    pathname.startsWith("/viewer");

  const isAgent =
    pathname.startsWith("/agent");

  const isAdmin =
    pathname.startsWith("/admin");

  /* ========================================================
     LOAD AVAILABLE PROPERTIES
  ======================================================== */

  const {
    properties,
    loading,
    error,
    refreshProperties,
  } = useProperties("available");

  /* ========================================================
     NORMALIZE DATA
  ======================================================== */

  const safeProperties = Array.isArray(properties)
    ? properties
    : [];

  /* ========================================================
     DEVELOPMENT DEBUGGING
  ======================================================== */

  console.log(
    "[AvailableProperties] current pathname:",
    pathname
  );

  console.log(
    "[AvailableProperties] workspace:",
    isViewer
      ? "viewer"
      : isAgent
      ? "agent"
      : isAdmin
      ? "admin"
      : "unknown"
  );

  console.log(
    "[AvailableProperties] hook properties:",
    properties
  );

  console.log(
    "[AvailableProperties] property count:",
    safeProperties.length
  );

  console.log(
    "[AvailableProperties] loading:",
    loading
  );

  console.log(
    "[AvailableProperties] error:",
    error
  );

  /* ========================================================
     PROPERTY DETAILS NAVIGATION
  ========================================================

     IMPORTANT:

     Viewer MUST NOT be sent to:

       /admin/properties/:id

     because the viewer does not have access to the admin
     workspace.

     Viewer details route:

       /viewer/properties/:propertyId

     Agent details route:

       /agent/properties/:propertyId

     Admin details route:

       /admin/properties/:propertyId

  ======================================================== */

  const handleViewProperty = (propertyId) => {
    if (!propertyId) {
      console.warn(
        "[AvailableProperties] Property ID is missing."
      );

      return;
    }

    const encodedPropertyId = encodeURIComponent(
      String(propertyId)
    );

    let destination;

    if (isViewer) {
      destination =
        `/viewer/properties/${encodedPropertyId}`;
    } else if (isAgent) {
      destination =
        `/agent/properties/${encodedPropertyId}`;
    } else {
      destination =
        `/admin/properties/${encodedPropertyId}`;
    }

    console.log(
      "[AvailableProperties] Opening property:",
      propertyId
    );

    console.log(
      "[AvailableProperties] Destination:",
      destination
    );

    navigate(destination);
  };

  /* ========================================================
     VIEWER SAVE / WORKFLOW NOTE
  ========================================================

     Saving, sharing, scheduling a viewing and similar
     customer actions belong to PropertyDetails.

     We intentionally do NOT duplicate those actions here.

     The viewer flow becomes:

       Available Properties
              ↓
       Property Details
              ↓
       Save Property
       Share Property
       Schedule Viewing
       Similar Properties
       Contact Agent
  ======================================================== */

  /* ========================================================
     LOADING STATE
  ======================================================== */

  if (loading) {
    return (
      <div className="space-y-8">

        {/* Header skeleton */}

        <section className="space-y-3">

          <div
            className="
              h-9
              w-72
              animate-pulse
              rounded-lg
              bg-slate-800
            "
          />

          <div
            className="
              h-5
              w-96
              max-w-full
              animate-pulse
              rounded-lg
              bg-slate-800
            "
          />

        </section>

        {/* Property skeletons */}

        <div
          className="
            grid
            gap-6
            md:grid-cols-2
            xl:grid-cols-3
          "
        >

          {[1, 2, 3, 4, 5, 6].map(
            (item) => (
              <div
                key={item}
                className="
                  overflow-hidden
                  rounded-3xl
                  border
                  border-slate-800
                  bg-slate-900
                "
              >

                <div
                  className="
                    h-56
                    animate-pulse
                    bg-slate-800
                  "
                />

                <div className="space-y-4 p-6">

                  <div
                    className="
                      h-6
                      animate-pulse
                      rounded
                      bg-slate-800
                    "
                  />

                  <div
                    className="
                      h-4
                      w-2/3
                      animate-pulse
                      rounded
                      bg-slate-800
                    "
                  />

                  <div
                    className="
                      h-6
                      w-1/2
                      animate-pulse
                      rounded
                      bg-slate-800
                    "
                  />

                  <div
                    className="
                      h-11
                      animate-pulse
                      rounded-xl
                      bg-slate-800
                    "
                  />

                </div>

              </div>
            )
          )}

        </div>

      </div>
    );
  }

  /* ========================================================
     PAGE
  ======================================================== */

  return (
    <div className="space-y-8">

      {/* ====================================================
          HEADER
      ==================================================== */}

      <section
        className="
          flex
          flex-col
          gap-5
          rounded-3xl
          border
          border-slate-800
          bg-slate-900
          p-6
          sm:flex-row
          sm:items-center
          sm:justify-between
        "
      >

        <div>

          <p
            className="
              text-sm
              font-medium
              text-emerald-400
            "
          >
            {isViewer
              ? "Find Your Next Home"
              : "Property Inventory"}
          </p>

          <h1
            className="
              mt-1
              text-3xl
              font-bold
              text-white
            "
          >
            Available Properties
          </h1>

          <p
            className="
              mt-2
              text-slate-400
            "
          >
            {isViewer
              ? "Explore properties currently available and find one that matches your needs."
              : "Properties currently marked as available for customers."}
          </p>

        </div>

        <button
          type="button"
          onClick={refreshProperties}
          disabled={loading}
          className="
            inline-flex
            items-center
            justify-center
            rounded-xl
            border
            border-slate-700
            bg-slate-950
            px-5
            py-3
            font-semibold
            text-white
            transition
            hover:border-emerald-500/50
            hover:bg-slate-800
            disabled:cursor-not-allowed
            disabled:opacity-50
          "
        >
          Refresh
        </button>

      </section>

      {/* ====================================================
          VIEWER DISCOVERY MESSAGE
      ==================================================== */}

      {isViewer && safeProperties.length > 0 && (
        <section
          className="
            rounded-2xl
            border
            border-cyan-500/20
            bg-cyan-500/5
            p-5
          "
        >

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

            <div>

              <h2
                className="
                  font-semibold
                  text-white
                "
              >
                Find a property that fits you
              </h2>

              <p
                className="
                  mt-1
                  text-sm
                  text-slate-400
                "
              >
                Open any property to see its full details,
                save it for later, share it, or request a
                viewing.
              </p>

            </div>

            <button
              type="button"
              onClick={() =>
                navigate("/viewer/saved-properties")
              }
              className="
                shrink-0
                rounded-xl
                border
                border-slate-700
                bg-slate-900
                px-4
                py-2.5
                text-sm
                font-semibold
                text-white
                transition
                hover:border-cyan-500/50
                hover:bg-slate-800
              "
            >
              Saved Properties
            </button>

          </div>

        </section>
      )}

      {/* ====================================================
          ERROR
      ==================================================== */}

      {error && (
        <section
          className="
            rounded-2xl
            border
            border-red-500/20
            bg-red-500/10
            p-5
            text-red-400
          "
        >

          <p className="font-semibold">
            Unable to load available properties.
          </p>

          <p className="mt-1 text-sm">
            {error}
          </p>

          <button
            type="button"
            onClick={refreshProperties}
            className="
              mt-4
              rounded-lg
              border
              border-red-500/30
              px-4
              py-2
              text-sm
              font-semibold
              text-red-300
              transition
              hover:bg-red-500/10
            "
          >
            Try Again
          </button>

        </section>
      )}

      {/* ====================================================
          EMPTY STATE
      ==================================================== */}

      {!error && safeProperties.length === 0 && (
        <section
          className="
            rounded-3xl
            border
            border-slate-800
            bg-slate-900
            p-10
            text-center
          "
        >

          <div
            className="
              mx-auto
              flex
              h-14
              w-14
              items-center
              justify-center
              rounded-2xl
              bg-slate-800
              text-slate-400
            "
          >

            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              className="h-7 w-7"
              aria-hidden="true"
            >

              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="
                  M3 21h18
                  M5 21V8l7-5 7 5v13
                  M9 21v-6h6v6
                  M9 10h.01
                  M12 10h.01
                  M15 10h.01
                "
              />

            </svg>

          </div>

          <h2
            className="
              mt-5
              text-xl
              font-bold
              text-white
            "
          >
            No available properties
          </h2>

          <p
            className="
              mx-auto
              mt-2
              max-w-lg
              text-sm
              text-slate-400
            "
          >
            There are currently no properties marked
            as available. Refresh the inventory or
            check the full property listings.
          </p>

          <button
            type="button"
            onClick={refreshProperties}
            className="
              mt-6
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
            Refresh Properties
          </button>

        </section>
      )}

      {/* ====================================================
          AVAILABLE INVENTORY
      ==================================================== */}

      {safeProperties.length > 0 && (
        <section>

          {/* Section header */}

          <div
            className="
              mb-5
              flex
              flex-col
              gap-2
              sm:flex-row
              sm:items-center
              sm:justify-between
            "
          >

            <div>

              <h2
                className="
                  text-xl
                  font-bold
                  text-white
                "
              >
                {isViewer
                  ? "Properties You Can Explore"
                  : "Available Inventory"}
              </h2>

              <p
                className="
                  mt-1
                  text-sm
                  text-slate-400
                "
              >
                {safeProperties.length}{" "}
                {safeProperties.length === 1
                  ? "property"
                  : "properties"}{" "}
                currently available.
              </p>

            </div>

          </div>

          {/* ==================================================
              PROPERTY GRID
          ================================================== */}

          <div
            className="
              grid
              gap-6
              md:grid-cols-2
              xl:grid-cols-3
            "
          >

            {safeProperties.map(
              (property, index) => {

                /* ==================================================
                   PROPERTY ID
                ================================================== */

                const propertyId =
                  property?._id ||
                  property?.id;

                /* ==================================================
                   SHARED IMAGE HELPER
                ================================================== */

                const image =
                  getPropertyImageUrl(property);

                /* ==================================================
                   PROPERTY DISPLAY DATA
                ================================================== */

                const title =
                  property?.title ||
                  property?.name ||
                  "Untitled Property";

                const location =
                  property?.location ||
                  property?.address ||
                  "Location unavailable";

                const price =
                  Number(property?.price || 0);

                const currency =
                  property?.currency ||
                  "KES";

                const bedrooms =
                  property?.bedrooms ??
                  property?.beds ??
                  "-";

                const bathrooms =
                  property?.bathrooms ??
                  property?.baths ??
                  "-";

                const status =
                  property?.status ||
                  "available";

                return (
                  <article
                    key={
                      propertyId ||
                      `available-property-${index}`
                    }
                    className="
                      group
                      overflow-hidden
                      rounded-3xl
                      border
                      border-slate-800
                      bg-slate-900
                      shadow-xl
                      transition
                      hover:-translate-y-1
                      hover:border-emerald-500/30
                    "
                  >

                    {/* ==================================================
                        IMAGE
                    ================================================== */}

                    <div
                      className="
                        relative
                        overflow-hidden
                      "
                    >

                      <img
                        src={image}
                        alt={title}
                        className="
                          h-56
                          w-full
                          object-cover
                          transition
                          duration-500
                          group-hover:scale-105
                        "
                        onError={(event) => {
                          event.currentTarget.onerror = null;

                          /*
                           * Do not construct another image URL here.
                           *
                           * getPropertyImageUrl() is the single source
                           * of truth for property image resolution.
                           */
                        }}
                      />

                      {/* Image overlay */}

                      <div
                        className="
                          pointer-events-none
                          absolute
                          inset-0
                          bg-gradient-to-t
                          from-slate-950/70
                          via-transparent
                          to-transparent
                        "
                      />

                      {/* Availability badge */}

                      <span
                        className="
                          absolute
                          right-4
                          top-4
                          rounded-full
                          bg-emerald-500/90
                          px-3
                          py-1
                          text-xs
                          font-semibold
                          capitalize
                          text-slate-950
                        "
                      >
                        {status}
                      </span>

                      {/* Viewer discovery label */}

                      {isViewer && (
                        <span
                          className="
                            absolute
                            bottom-4
                            left-4
                            rounded-full
                            bg-slate-950/80
                            px-3
                            py-1
                            text-xs
                            font-medium
                            text-white
                            backdrop-blur-sm
                          "
                        >
                          Available to view
                        </span>
                      )}

                    </div>

                    {/* ==================================================
                        CONTENT
                    ================================================== */}

                    <div className="space-y-5 p-6">

                      {/* Property title */}

                      <div>

                        <h3
                          className="
                            text-xl
                            font-bold
                            text-white
                          "
                        >
                          {title}
                        </h3>

                        <p
                          className="
                            mt-2
                            flex
                            items-start
                            gap-2
                            text-sm
                            text-slate-400
                          "
                        >

                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            className="
                              mt-0.5
                              h-4
                              w-4
                              shrink-0
                            "
                            aria-hidden="true"
                          >

                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="
                                M12 21s7-6.1 7-12a7 7 0 1 0-14 0c0 5.9 7 12 7 12Z
                              "
                            />

                            <circle
                              cx="12"
                              cy="9"
                              r="2.2"
                            />

                          </svg>

                          <span>
                            {location}
                          </span>

                        </p>

                      </div>

                      {/* ==================================================
                          PRICE
                      ================================================== */}

                      <div
                        className="
                          flex
                          items-center
                          justify-between
                          gap-4
                        "
                      >

                        <div>

                          <p
                            className="
                              text-xs
                              font-medium
                              uppercase
                              tracking-wide
                              text-slate-500
                            "
                          >
                            Asking Price
                          </p>

                          <span
                            className="
                              mt-1
                              block
                              text-lg
                              font-bold
                              text-cyan-400
                            "
                          >
                            {currency}{" "}
                            {price.toLocaleString()}
                          </span>

                        </div>

                        <span
                          className="
                            rounded-full
                            bg-emerald-500/10
                            px-3
                            py-1
                            text-xs
                            font-medium
                            text-emerald-400
                          "
                        >
                          Ready to show
                        </span>

                      </div>

                      {/* ==================================================
                          FEATURES
                      ================================================== */}

                      <div
                        className="
                          grid
                          grid-cols-2
                          gap-3
                          border-t
                          border-slate-800
                          pt-4
                          text-sm
                          text-slate-300
                        "
                      >

                        <span className="flex items-center gap-2">
                          <span aria-hidden="true">
                            🛏
                          </span>

                          <span>
                            {bedrooms} Bedrooms
                          </span>
                        </span>

                        <span className="flex items-center gap-2">
                          <span aria-hidden="true">
                            🛁
                          </span>

                          <span>
                            {bathrooms} Bathrooms
                          </span>
                        </span>

                      </div>

                      {/* ==================================================
                          VIEW PROPERTY
                      ================================================== */}

                      <button
                        type="button"
                        onClick={() =>
                          handleViewProperty(
                            propertyId
                          )
                        }
                        disabled={!propertyId}
                        className="
                          flex
                          w-full
                          items-center
                          justify-center
                          gap-2
                          rounded-xl
                          bg-cyan-500
                          py-3
                          font-semibold
                          text-slate-950
                          transition
                          hover:bg-cyan-400
                          disabled:cursor-not-allowed
                          disabled:opacity-50
                        "
                      >

                        {isViewer
                          ? "View Property Details"
                          : "View Property"}

                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          className="h-4 w-4"
                          aria-hidden="true"
                        >

                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M5 12h14M13 6l6 6-6 6"
                          />

                        </svg>

                      </button>

                      {/* ==================================================
                          VIEWER QUICK ACTION HINT
                      ==================================================

                          Actual save/share/viewing actions belong on
                          PropertyDetails.

                          This keeps the inventory cards clean while
                          making the workflow obvious to the customer.
                      ================================================== */}

                      {isViewer && (
                        <p
                          className="
                            text-center
                            text-xs
                            text-slate-500
                          "
                        >
                          Open details to save, share,
                          or schedule a viewing.
                        </p>
                      )}

                    </div>

                  </article>
                );
              }
            )}

          </div>

        </section>
      )}

    </div>
  );
};

export default AvailableProperties;