/**
 * ==========================================================
 *
 * SOLD PROPERTIES
 *
 * Routes
 * ------
 * /admin/properties/sold
 * /agent/properties/sold
 *
 * Purpose
 * -------
 * Displays all properties marked as SOLD.
 *
 * Used By
 * -------
 * • Admin
 * • Agent
 * • Viewer
 * • Managers
 *
 * Backend
 * -------
 * GET /api/properties/sold
 *
 * IMPORTANT
 * ---------
 * This page does NOT render MainLayout.
 *
 * MainLayout is provided by the parent workspace route.
 *
 * ==========================================================
 *
 * SHARED ADMIN + AGENT ARCHITECTURE
 * ---------------------------------
 *
 * The component determines the active workspace from the
 * current URL:
 *
 *     /admin/properties/sold
 *          ↓
 *     /admin/properties/:id
 *
 *     /agent/properties/sold
 *          ↓
 *     /agent/properties/:id
 *
 * This allows the same component to be safely reused by
 * both Admin and Agent workspaces.
 *
 * ==========================================================
 *
 * IMAGE ARCHITECTURE
 * ------------------
 *
 * Every property image is resolved through:
 *
 *     getPropertyImageUrl(property)
 *
 * This component does NOT:
 *
 * • Construct image URLs
 * • Generate images
 * • Upload images
 * • Create PropertyImage records
 * • Create fake coverImage objects
 *
 * The shared image helper remains the single source of truth.
 *
 * ==========================================================
 */

import { useLocation, useNavigate } from "react-router-dom";

import useProperties from "../../hooks/useProperties";

import getPropertyImageUrl from "../../utils/propertyImage";

/* ==========================================================
   SOLD PROPERTY CARD
========================================================== */

const SoldPropertyCard = ({
  property,
  onView,
}) => {
  /* ========================================================
     PROPERTY IMAGE

     IMPORTANT:
     The shared helper is the single source of truth for
     property image resolution.
  ======================================================== */

  const imageUrl =
    getPropertyImageUrl(property);

  /* ========================================================
     SAFE PROPERTY VALUES
  ======================================================== */

  const title =
    property?.title ||
    property?.name ||
    "Untitled Property";

  const location =
    property?.location ||
    property?.address ||
    "Location not specified";

  const currency =
    property?.currency ||
    "KES";

  const price =
    Number(property?.price || 0);

  const bedrooms =
    property?.bedrooms ??
    property?.beds ??
    "-";

  const bathrooms =
    property?.bathrooms ??
    property?.baths ??
    "-";

  const propertyType =
    property?.propertyType ||
    "-";

  const status =
    property?.status ||
    "sold";

  /* ========================================================
     SOLD DATE
  ======================================================== */

  const soldDate =
    property?.soldDate
      ? new Date(
          property.soldDate
        ).toLocaleDateString()
      : "Not recorded";

  /* ========================================================
     CARD
  ======================================================== */

  return (
    <article
      className="
        overflow-hidden
        rounded-3xl
        border
        border-slate-800
        bg-slate-900
        shadow-xl
        transition
        duration-200
        hover:border-slate-700
        hover:shadow-2xl
      "
    >

      {/* ====================================================
          IMAGE
      ==================================================== */}

      <div className="relative">

        {imageUrl ? (
          <img
            src={imageUrl}
            alt={`${title} cover`}
            className="
              h-56
              w-full
              object-cover
            "
            loading="lazy"
            onError={(event) => {
              /*
               * The shared helper remains responsible for
               * resolving the image URL.
               *
               * If the resolved image itself fails, hide the
               * broken image and reveal the visual fallback.
               */

              console.error(
                "[SoldProperties] Failed to load property cover image:",
                imageUrl
              );

              event.currentTarget.style.display =
                "none";

              const fallback =
                event.currentTarget
                  .nextElementSibling;

              if (fallback) {
                fallback.classList.remove(
                  "hidden"
                );
              }
            }}
          />
        ) : null}

        {/* ==================================================
            IMAGE FALLBACK
        ================================================== */}

        <div
          className={`
            flex
            h-56
            w-full
            items-center
            justify-center
            bg-slate-950
            text-slate-600
            ${imageUrl ? "hidden" : ""}
          `}
          aria-hidden="true"
        >

          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            className="h-12 w-12"
          >

            <rect
              x="3"
              y="3"
              width="18"
              height="18"
              rx="2"
            />

            <circle
              cx="8.5"
              cy="8.5"
              r="1.5"
            />

            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m21 15-5-5L5 21"
            />

          </svg>

        </div>

        {/* ==================================================
            SOLD BADGE
        ================================================== */}

        <div
          className="
            absolute
            right-4
            top-4
            rounded-full
            bg-red-500/90
            px-3
            py-1
            text-sm
            font-semibold
            capitalize
            text-white
            shadow-lg
          "
        >
          {status}
        </div>

      </div>

      {/* ====================================================
          PROPERTY INFORMATION
      ==================================================== */}

      <div className="space-y-4 p-6">

        {/* ==================================================
            TITLE
        ================================================== */}

        <div>

          <h2
            className="
              truncate
              text-xl
              font-bold
              text-white
            "
          >
            {title}
          </h2>

          <p
            className="
              mt-1
              truncate
              text-slate-400
            "
          >
            {location}
          </p>

        </div>

        {/* ==================================================
            PRICE + STATUS
        ================================================== */}

        <div
          className="
            flex
            items-center
            justify-between
            gap-4
          "
        >

          <span
            className="
              text-lg
              font-semibold
              text-cyan-400
            "
          >
            {currency}{" "}
            {price.toLocaleString()}
          </span>

          <span
            className="
              rounded-full
              bg-red-500/20
              px-3
              py-1
              text-sm
              font-medium
              capitalize
              text-red-400
            "
          >
            Sold
          </span>

        </div>

        {/* ==================================================
            DETAILS
        ================================================== */}

        <div
          className="
            space-y-2
            border-t
            border-slate-800
            pt-4
            text-sm
            text-slate-300
          "
        >

          {/* BEDROOMS */}

          <p>
            <span className="mr-2">
              🛏
            </span>

            Bedrooms:

            <span className="ml-2">
              {bedrooms}
            </span>
          </p>

          {/* BATHROOMS */}

          <p>
            <span className="mr-2">
              🛁
            </span>

            Bathrooms:

            <span className="ml-2">
              {bathrooms}
            </span>
          </p>

          {/* PROPERTY TYPE */}

          <p>
            <span className="mr-2">
              🏠
            </span>

            Type:

            <span className="ml-2 capitalize">
              {propertyType}
            </span>
          </p>

          {/* ESTATE */}

          {property?.estate && (
            <p>
              <span className="mr-2">
                📍
              </span>

              Estate:

              <span className="ml-2">
                {property.estate}
              </span>
            </p>
          )}

          {/* COUNTY */}

          {property?.county && (
            <p>
              <span className="mr-2">
                🗺️
              </span>

              County:

              <span className="ml-2">
                {property.county}
              </span>
            </p>
          )}

          {/* BUYER */}

          <p>
            <span className="mr-2">
              👤
            </span>

            Buyer:

            <span className="ml-2">
              {property?.buyer ||
                "Not recorded"}
            </span>
          </p>

          {/* SOLD DATE */}

          <p>
            <span className="mr-2">
              📅
            </span>

            Sold Date:

            <span className="ml-2">
              {soldDate}
            </span>
          </p>

        </div>

        {/* ==================================================
            VIEW PROPERTY
        ================================================== */}

        <button
          type="button"
          onClick={onView}
          className="
            w-full
            rounded-xl
            bg-slate-800
            py-3
            font-semibold
            text-white
            transition
            hover:bg-slate-700
            focus:outline-none
            focus:ring-2
            focus:ring-cyan-500
            focus:ring-offset-2
            focus:ring-offset-slate-900
          "
        >
          View Property
        </button>

      </div>

    </article>
  );
};

/* ==========================================================
   SOLD PROPERTIES PAGE
========================================================== */

const SoldProperties = () => {
  const navigate = useNavigate();

  const location = useLocation();

  /* ========================================================
     DETERMINE CURRENT WORKSPACE
     
     Supports:
     
     /admin/properties/sold
     /agent/properties/sold
  ======================================================== */

  const isAgentWorkspace =
    location.pathname.startsWith("/agent/");

  const propertiesBasePath =
    isAgentWorkspace
      ? "/agent/properties"
      : "/admin/properties";

  /* ========================================================
     PROPERTY DATA
     
     IMPORTANT:
     The hook remains centralized.
     
     The page does not directly call the API.
  ======================================================== */

  const {
    properties = [],
    loading,
    error,
    refreshProperties,
  } = useProperties("sold");

  /* ========================================================
     SAFE PROPERTY ARRAY
  ======================================================== */

  const safeProperties =
    Array.isArray(properties)
      ? properties
      : [];

  /* ========================================================
     VIEW PROPERTY
     
     Workspace-aware navigation:
     
     Admin:
       /admin/properties/:id
     
     Agent:
       /agent/properties/:id
  ======================================================== */

  const handleViewProperty = (
    property
  ) => {
    const propertyId =
      property?._id ||
      property?.id;

    if (!propertyId) {
      console.warn(
        "[SoldProperties] Property ID is missing."
      );

      return;
    }

    navigate(
      `${propertiesBasePath}/${encodeURIComponent(
        String(propertyId)
      )}`
    );
  };

  /* ========================================================
     REFRESH
  ======================================================== */

  const handleRefresh = async () => {
    try {
      await refreshProperties();
    } catch (refreshError) {
      console.error(
        "[SoldProperties] Refresh failed:",
        refreshError
      );
    }
  };

  /* ========================================================
     LOADING
  ======================================================== */

  if (loading) {
    return (
      <section className="space-y-8">

        {/* ==================================================
            HEADER SKELETON
        ================================================== */}

        <div>

          <div
            className="
              h-9
              w-64
              animate-pulse
              rounded
              bg-slate-800
            "
          />

          <div
            className="
              mt-3
              h-4
              w-96
              max-w-full
              animate-pulse
              rounded
              bg-slate-800
            "
          />

        </div>

        {/* ==================================================
            CARD SKELETONS
        ================================================== */}

        <div
          className="
            grid
            gap-6
            md:grid-cols-2
            xl:grid-cols-3
          "
        >

          {Array.from({
            length: 6,
          }).map((_, index) => (

            <div
              key={index}
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
                    h-5
                    w-3/4
                    animate-pulse
                    rounded
                    bg-slate-800
                  "
                />

                <div
                  className="
                    h-4
                    w-1/2
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
                    h-10
                    w-full
                    animate-pulse
                    rounded-xl
                    bg-slate-800
                  "
                />

              </div>

            </div>

          ))}

        </div>

      </section>
    );
  }

  /* ========================================================
     PAGE
  ======================================================== */

  return (
    <section className="space-y-8">

      {/* ====================================================
          HEADER
      ==================================================== */}

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

          {/* WORKSPACE-AWARE CONTEXT */}

          <p
            className="
              mb-2
              text-sm
              font-medium
              uppercase
              tracking-wide
              text-slate-500
            "
          >
            {isAgentWorkspace
              ? "Agent Workspace"
              : "Admin Workspace"}
          </p>

          <h1
            className="
              text-3xl
              font-bold
              text-white
            "
          >
            Sold Properties
          </h1>

          <p
            className="
              mt-2
              text-slate-400
            "
          >
            Successfully completed property sales.
          </p>

        </div>

        {/* ==================================================
            HEADER ACTIONS
        ================================================== */}

        <button
          type="button"
          onClick={handleRefresh}
          disabled={loading}
          className="
            rounded-xl
            border
            border-slate-700
            px-5
            py-3
            font-medium
            text-white
            transition
            hover:bg-slate-800
            focus:outline-none
            focus:ring-2
            focus:ring-cyan-500
            disabled:cursor-not-allowed
            disabled:opacity-50
          "
        >
          {loading
            ? "Refreshing..."
            : "Refresh"}
        </button>

      </div>

      {/* ====================================================
          ERROR
      ==================================================== */}

      {error && (
        <div
          className="
            rounded-xl
            border
            border-red-500/20
            bg-red-500/10
            p-4
            text-red-400
          "
        >

          <div
            className="
              flex
              items-center
              justify-between
              gap-4
            "
          >

            <p>
              {error}
            </p>

            <button
              type="button"
              onClick={handleRefresh}
              className="
                shrink-0
                rounded-lg
                border
                border-red-500/30
                px-3
                py-2
                text-sm
                font-medium
                text-red-300
                transition
                hover:bg-red-500/10
              "
            >
              Retry
            </button>

          </div>

        </div>
      )}

      {/* ====================================================
          PROPERTY COUNT
      ==================================================== */}

      <div
        className="
          rounded-2xl
          border
          border-slate-800
          bg-slate-900/70
          px-5
          py-4
        "
      >

        <p
          className="
            text-sm
            text-slate-400
          "
        >
          Total sold properties
        </p>

        <p
          className="
            mt-1
            text-2xl
            font-bold
            text-white
          "
        >
          {safeProperties.length}
        </p>

      </div>

      {/* ====================================================
          EMPTY STATE
      ==================================================== */}

      {!error &&
        safeProperties.length === 0 && (
          <div
            className="
              rounded-3xl
              border
              border-slate-800
              bg-slate-900
              px-6
              py-16
              text-center
            "
          >

            <div className="text-5xl">
              🏠
            </div>

            <h2
              className="
                mt-4
                text-xl
                font-bold
                text-white
              "
            >
              No sold properties
            </h2>

            <p
              className="
                mt-2
                text-slate-400
              "
            >
              There are currently no properties
              marked as sold.
            </p>

          </div>
        )}

      {/* ====================================================
          PROPERTY CARDS
      ==================================================== */}

      {!error &&
        safeProperties.length > 0 && (
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

                const propertyId =
                  property?._id ||
                  property?.id;

                return (
                  <SoldPropertyCard
                    key={
                      propertyId ||
                      `sold-property-${index}`
                    }
                    property={property}
                    onView={() =>
                      handleViewProperty(
                        property
                      )
                    }
                  />
                );
              }
            )}

          </div>
        )}

    </section>
  );
};

/* ==========================================================
   EXPORT
========================================================== */

export default SoldProperties;