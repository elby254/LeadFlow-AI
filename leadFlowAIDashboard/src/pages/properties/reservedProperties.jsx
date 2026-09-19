/**
 * ==========================================================
 *
 * RESERVED PROPERTIES
 *
 * Shared Admin + Agent Page
 *
 * Routes
 * ------
 * /admin/properties/reserved
 * /agent/properties/reserved
 *
 * Purpose
 * -------
 * Displays properties whose current status is:
 *
 *     reserved
 *
 * IMPORTANT
 * ----------------------------------------------------------
 * • Uses the centralized useProperties hook.
 * • Backend is the primary source of truth.
 * • The hook performs defensive status filtering.
 * • Property images are resolved ONLY through:
 *
 *       getPropertyImageUrl(property)
 *
 * • This page does NOT generate property images.
 * • This page does NOT create PropertyImage records.
 * • This page does NOT upload images.
 * • This page does NOT inspect property.images[].
 * • This page does NOT inspect property.image.
 * • This page does NOT construct image URLs.
 * • This page does NOT render MainLayout.
 *
 * MainLayout is provided by the parent workspace route.
 *
 * ==========================================================
 *
 * IMAGE ARCHITECTURE
 * ==========================================================
 *
 * Property images are resolved centrally through:
 *
 *     utils/propertyImage.js
 *
 * The helper is the SINGLE source of truth.
 *
 * The property may contain:
 *
 *     coverImage
 *
 * or:
 *
 *     coverImage.url
 *
 * The page does NOT resolve those fields itself.
 *
 * ==========================================================
 */

import React from "react";

import {
  Link,
  useLocation,
} from "react-router-dom";

import {
  Building2,
  MapPin,
  BedDouble,
  Bath,
  Square,
  RefreshCw,
  AlertCircle,
  Home,
} from "lucide-react";

import useProperties from "../../hooks/useProperties";

import {
  getPropertyImageUrl,
} from "../../utils/propertyImage";

/* ==========================================================
   PLACEHOLDER IMAGE
========================================================== */

/**
 * Used only when the centralized image helper cannot
 * resolve an existing property cover image.
 *
 * This is NOT an AI-generated property image.
 */
const PLACEHOLDER_IMAGE =
  "/placeholder-property.jpg";

/* ==========================================================
   RESERVED PROPERTIES
========================================================== */

const ReservedProperties = () => {
  /* ========================================================
     LOCATION
  ======================================================== */

  const location = useLocation();

  /* ========================================================
     DETERMINE CURRENT WORKSPACE
     
     Supports:
     
     /admin/properties/reserved
     
     /agent/properties/reserved
     
     IMPORTANT:
     We do not hard-code the admin route.
  ======================================================== */

  const isAgentWorkspace =
    location.pathname.startsWith("/agent/");

  const workspace =
    isAgentWorkspace
      ? "agent"
      : "admin";

  const propertiesBasePath =
    `/${workspace}/properties`;

  /* ========================================================
     PROPERTY HOOK
     
     IMPORTANT:
     
     The centralized hook remains the source of property
     inventory data.
     
     useProperties("reserved") is responsible for retrieving
     the reserved inventory.
  ======================================================== */

  const {
    reservedProperties,
    reservedLoading,
    reservedError,
    fetchReservedProperties,
  } = useProperties("reserved");

  /* ========================================================
     NORMALIZE PROPERTY DATA
  ======================================================== */

  const properties =
    Array.isArray(reservedProperties)
      ? reservedProperties
      : [];

  const loading =
    reservedLoading;

  const error =
    reservedError;

  /* ========================================================
     REFRESH
  ======================================================== */

  const handleRefresh = () => {
    try {
      fetchReservedProperties();
    } catch (refreshError) {
      console.error(
        "RESERVED PROPERTIES REFRESH ERROR:",
        refreshError
      );
    }
  };

  /* ========================================================
     FORMAT PRICE
  ======================================================== */

  const formatPrice = (
    price,
    currency = "KES"
  ) => {
    if (
      price === null ||
      price === undefined ||
      price === ""
    ) {
      return "Price not available";
    }

    const numericPrice =
      Number(price);

    if (
      !Number.isFinite(
        numericPrice
      )
    ) {
      return `${currency || "KES"} ${price}`;
    }

    try {
      return new Intl.NumberFormat(
        "en-KE",
        {
          style: "currency",
          currency:
            currency || "KES",
          maximumFractionDigits: 0,
        }
      ).format(numericPrice);
    } catch {
      return `${
        currency || "KES"
      } ${numericPrice.toLocaleString(
        "en-KE"
      )}`;
    }
  };

  /* ========================================================
     PROPERTY TITLE
  ======================================================== */

  const getPropertyTitle = (
    property
  ) => {
    return (
      property?.title ||
      property?.name ||
      "Untitled Property"
    );
  };

  /* ========================================================
     PROPERTY LOCATION
     
     This helper only formats already available property
     metadata.
     
     It does NOT resolve images.
  ======================================================== */

  const getPropertyLocation = (
    property
  ) => {
    const parts = [
      property?.estate,
      property?.location,
      property?.city,
      property?.county,
    ].filter(Boolean);

    if (
      parts.length === 0
    ) {
      return "Location not specified";
    }

    return [
      ...new Set(parts),
    ].join(", ");
  };

  /* ========================================================
     PROPERTY IMAGE
     
     IMPORTANT
     --------------------------------------------------------
     CENTRALIZED IMAGE ARCHITECTURE
     
     The ONLY image resolver used by this component is:
     
         getPropertyImageUrl(property)
     
     No:
     
         property.imageUrl
         property.image
         property.images[]
         property.coverImage.url
     
     is inspected here.
  ======================================================== */

  const getImageUrl = (
    property
  ) => {
    return (
      getPropertyImageUrl(
        property
      ) ||
      PLACEHOLDER_IMAGE
    );
  };

  /* ========================================================
     STATUS LABEL
  ======================================================== */

  const getStatusLabel = (
    status
  ) => {
    if (!status) {
      return "Reserved";
    }

    const normalizedStatus =
      String(status)
        .trim()
        .toLowerCase();

    return (
      normalizedStatus
        .charAt(0)
        .toUpperCase() +
      normalizedStatus.slice(1)
    );
  };

  /* ========================================================
     PROPERTY ID
  ======================================================== */

  const getPropertyId = (
    property
  ) => {
    return (
      property?._id ||
      property?.id
    );
  };

  /* ========================================================
     PROPERTY DETAILS PATH
     
     Shared between Admin and Agent.
  ======================================================== */

  const getPropertyDetailsPath =
    (property) => {
      const propertyId =
        getPropertyId(
          property
        );

      if (!propertyId) {
        return `${propertiesBasePath}/listings`;
      }

      return `${propertiesBasePath}/${encodeURIComponent(
        String(propertyId)
      )}`;
    };

  /* ========================================================
     EMPTY STATE
  ======================================================== */

  const renderEmptyState = () => {
    return (
      <div
        className="
          flex
          flex-col
          items-center
          justify-center
          rounded-2xl
          border
          border-dashed
          border-gray-300
          bg-white
          px-6
          py-16
          text-center
        "
      >

        <div
          className="
            mb-5
            flex
            h-16
            w-16
            items-center
            justify-center
            rounded-full
            bg-gray-100
          "
        >
          <Building2
            className="
              h-8
              w-8
              text-gray-400
            "
          />
        </div>

        <h2
          className="
            text-lg
            font-semibold
            text-gray-900
          "
        >
          No reserved properties
        </h2>

        <p
          className="
            mt-2
            max-w-md
            text-sm
            text-gray-500
          "
        >
          There are currently no
          properties with a reserved
          status in your property
          inventory.
        </p>

        <Link
          to={`${propertiesBasePath}/listings`}
          className="
            mt-6
            inline-flex
            items-center
            gap-2
            rounded-lg
            bg-gray-900
            px-4
            py-2.5
            text-sm
            font-medium
            text-white
            transition
            hover:bg-gray-800
          "
        >
          <Building2
            className="h-4 w-4"
          />

          View Listings
        </Link>

      </div>
    );
  };

  /* ========================================================
     ERROR STATE
  ======================================================== */

  const renderErrorState = () => {
    return (
      <div
        className="
          rounded-2xl
          border
          border-red-200
          bg-red-50
          p-6
        "
      >

        <div
          className="
            flex
            items-start
            gap-4
          "
        >

          <div
            className="
              flex
              h-10
              w-10
              shrink-0
              items-center
              justify-center
              rounded-full
              bg-red-100
            "
          >
            <AlertCircle
              className="
                h-5
                w-5
                text-red-600
              "
            />
          </div>

          <div className="flex-1">

            <h2
              className="
                font-semibold
                text-red-900
              "
            >
              Unable to load reserved
              properties
            </h2>

            <p
              className="
                mt-1
                text-sm
                text-red-700
              "
            >
              {error ||
                "Something went wrong while loading the reserved property inventory."}
            </p>

            <button
              type="button"
              onClick={
                handleRefresh
              }
              disabled={loading}
              className="
                mt-4
                inline-flex
                items-center
                gap-2
                rounded-lg
                border
                border-red-300
                bg-white
                px-4
                py-2
                text-sm
                font-medium
                text-red-700
                transition
                hover:bg-red-100
                disabled:cursor-not-allowed
                disabled:opacity-60
              "
            >

              <RefreshCw
                className={`h-4 w-4 ${
                  loading
                    ? "animate-spin"
                    : ""
                }`}
              />

              Try Again

            </button>

          </div>

        </div>

      </div>
    );
  };

  /* ========================================================
     LOADING STATE
  ======================================================== */

  if (loading) {
    return (
      <div
        className="
          min-h-full
          bg-gray-50
        "
      >

        <div
          className="
            mx-auto
            max-w-7xl
            px-4
            py-6
            sm:px-6
            lg:px-8
          "
        >

          <div className="mb-8">

            <div
              className="
                h-8
                w-64
                animate-pulse
                rounded
                bg-gray-200
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
                bg-gray-200
              "
            />

          </div>

          <div
            className="
              grid
              grid-cols-1
              gap-6
              sm:grid-cols-2
              lg:grid-cols-3
            "
          >

            {Array.from({
              length: 6,
            }).map(
              (_, index) => (
                <div
                  key={index}
                  className="
                    overflow-hidden
                    rounded-2xl
                    border
                    border-gray-200
                    bg-white
                  "
                >

                  <div
                    className="
                      h-52
                      animate-pulse
                      bg-gray-200
                    "
                  />

                  <div
                    className="
                      space-y-4
                      p-5
                    "
                  >

                    <div
                      className="
                        h-5
                        w-3/4
                        animate-pulse
                        rounded
                        bg-gray-200
                      "
                    />

                    <div
                      className="
                        h-4
                        w-1/2
                        animate-pulse
                        rounded
                        bg-gray-200
                      "
                    />

                    <div
                      className="
                        h-4
                        w-2/3
                        animate-pulse
                        rounded
                        bg-gray-200
                      "
                    />

                    <div
                      className="
                        h-10
                        w-full
                        animate-pulse
                        rounded
                        bg-gray-200
                      "
                    />

                  </div>

                </div>
              )
            )}

          </div>

        </div>

      </div>
    );
  }

  /* ========================================================
     PAGE
  ======================================================== */

  return (
    <div
      className="
        min-h-full
        bg-gray-50
      "
    >

      {/* ====================================================
          PAGE HEADER
      ==================================================== */}

      <div
        className="
          border-b
          border-gray-200
          bg-white
        "
      >

        <div
          className="
            mx-auto
            max-w-7xl
            px-4
            py-6
            sm:px-6
            lg:px-8
          "
        >

          <div
            className="
              flex
              flex-col
              gap-5
              sm:flex-row
              sm:items-center
              sm:justify-between
            "
          >

            <div>

              {/* Breadcrumb */}

              <div
                className="
                  mb-2
                  flex
                  items-center
                  gap-2
                  text-sm
                  text-gray-500
                "
              >

                <Link
                  to={
                    propertiesBasePath
                  }
                  className="
                    transition
                    hover:text-gray-900
                  "
                >
                  Properties
                </Link>

                <span>/</span>

                <span
                  className="
                    text-gray-700
                  "
                >
                  Reserved
                </span>

              </div>

              {/* Title */}

              <div
                className="
                  flex
                  items-center
                  gap-3
                "
              >

                <div
                  className="
                    flex
                    h-11
                    w-11
                    items-center
                    justify-center
                    rounded-xl
                    bg-amber-100
                  "
                >

                  <Building2
                    className="
                      h-6
                      w-6
                      text-amber-700
                    "
                  />

                </div>

                <div>

                  <h1
                    className="
                      text-2xl
                      font-bold
                      tracking-tight
                      text-gray-900
                      sm:text-3xl
                    "
                  >
                    Reserved Properties
                  </h1>

                  <p
                    className="
                      mt-1
                      text-sm
                      text-gray-500
                    "
                  >
                    Properties currently
                    reserved by prospective
                    buyers or tenants.
                  </p>

                </div>

              </div>

            </div>

            {/* ==================================================
                HEADER ACTIONS
            ================================================== */}

            <div
              className="
                flex
                items-center
                gap-3
              "
            >

              <button
                type="button"
                onClick={
                  handleRefresh
                }
                disabled={loading}
                className="
                  inline-flex
                  items-center
                  justify-center
                  gap-2
                  rounded-lg
                  border
                  border-gray-300
                  bg-white
                  px-4
                  py-2.5
                  text-sm
                  font-medium
                  text-gray-700
                  shadow-sm
                  transition
                  hover:bg-gray-50
                  disabled:cursor-not-allowed
                  disabled:opacity-60
                "
              >

                <RefreshCw
                  className={`h-4 w-4 ${
                    loading
                      ? "animate-spin"
                      : ""
                  }`}
                />

                Refresh

              </button>

              <Link
                to={`${propertiesBasePath}/listings`}
                className="
                  inline-flex
                  items-center
                  justify-center
                  gap-2
                  rounded-lg
                  bg-gray-900
                  px-4
                  py-2.5
                  text-sm
                  font-medium
                  text-white
                  shadow-sm
                  transition
                  hover:bg-gray-800
                "
              >

                <Building2
                  className="h-4 w-4"
                />

                All Listings

              </Link>

            </div>

          </div>

        </div>

      </div>

      {/* ====================================================
          MAIN CONTENT
      ==================================================== */}

      <main
        className="
          mx-auto
          max-w-7xl
          px-4
          py-6
          sm:px-6
          lg:px-8
        "
      >

        {/* ==================================================
            SUMMARY
        ================================================== */}

        <div
          className="
            mb-6
            grid
            grid-cols-1
            gap-4
            sm:grid-cols-2
          "
        >

          {/* Reserved Count */}

          <div
            className="
              rounded-2xl
              border
              border-gray-200
              bg-white
              p-5
              shadow-sm
            "
          >

            <div
              className="
                flex
                items-center
                justify-between
              "
            >

              <div>

                <p
                  className="
                    text-sm
                    font-medium
                    text-gray-500
                  "
                >
                  Reserved Properties
                </p>

                <p
                  className="
                    mt-2
                    text-3xl
                    font-bold
                    text-gray-900
                  "
                >
                  {properties.length}
                </p>

              </div>

              <div
                className="
                  flex
                  h-12
                  w-12
                  items-center
                  justify-center
                  rounded-xl
                  bg-amber-100
                "
              >

                <Building2
                  className="
                    h-6
                    w-6
                    text-amber-700
                  "
                />

              </div>

            </div>

          </div>

          {/* Inventory Status */}

          <div
            className="
              rounded-2xl
              border
              border-gray-200
              bg-white
              p-5
              shadow-sm
            "
          >

            <div
              className="
                flex
                items-center
                justify-between
              "
            >

              <div>

                <p
                  className="
                    text-sm
                    font-medium
                    text-gray-500
                  "
                >
                  Inventory Status
                </p>

                <p
                  className="
                    mt-2
                    text-lg
                    font-semibold
                    text-amber-700
                  "
                >
                  Reserved
                </p>

              </div>

              <div
                className="
                  flex
                  h-12
                  w-12
                  items-center
                  justify-center
                  rounded-xl
                  bg-amber-100
                "
              >

                <Home
                  className="
                    h-6
                    w-6
                    text-amber-700
                  "
                />

              </div>

            </div>

          </div>

        </div>

        {/* ==================================================
            ERROR
        ================================================== */}

        {error &&
          renderErrorState()}

        {/* ==================================================
            EMPTY
        ================================================== */}

        {!error &&
          properties.length === 0 &&
          renderEmptyState()}

        {/* ==================================================
            PROPERTY GRID
        ================================================== */}

        {!error &&
          properties.length > 0 && (

            <div
              className="
                grid
                grid-cols-1
                gap-6
                md:grid-cols-2
                xl:grid-cols-3
              "
            >

              {properties.map(
                (property) => {

                  /* ========================================
                     PROPERTY ID
                  ======================================== */

                  const propertyId =
                    getPropertyId(
                      property
                    );

                  /* ========================================
                     PROPERTY IMAGE
                     
                     CENTRALIZED IMAGE RESOLUTION
                  ======================================== */

                  const imageUrl =
                    getImageUrl(
                      property
                    );

                  /* ========================================
                     PROPERTY PATH
                  ======================================== */

                  const propertyPath =
                    getPropertyDetailsPath(
                      property
                    );

                  /* ========================================
                     REACT KEY
                  ======================================== */

                  const propertyKey =
                    propertyId ||
                    `${getPropertyTitle(
                      property
                    )}-${property?.createdAt || ""}`;

                  return (
                    <article
                      key={propertyKey}
                      className="
                        group
                        overflow-hidden
                        rounded-2xl
                        border
                        border-gray-200
                        bg-white
                        shadow-sm
                        transition
                        duration-200
                        hover:-translate-y-0.5
                        hover:shadow-md
                      "
                    >

                      {/* ====================================
                          PROPERTY IMAGE
                          
                          Entire image is clickable.
                      ==================================== */}

                      <Link
                        to={
                          propertyPath
                        }
                        className="
                          relative
                          block
                          h-56
                          overflow-hidden
                          bg-gray-100
                        "
                        aria-label={`View ${getPropertyTitle(
                          property
                        )}`}
                      >

                        {imageUrl ? (

                          <img
                            src={imageUrl}
                            alt={
                              getPropertyTitle(
                                property
                              )
                            }
                            className="
                              h-full
                              w-full
                              object-cover
                              transition
                              duration-300
                              group-hover:scale-105
                            "
                            loading="lazy"
                            onError={(
                              event
                            ) => {

                              console.error(
                                "RESERVED PROPERTIES - Failed to load property cover image:",
                                imageUrl
                              );

                              if (
                                event
                                  .currentTarget
                                  .src !==
                                window
                                  .location
                                  .origin +
                                  PLACEHOLDER_IMAGE
                              ) {
                                event
                                  .currentTarget
                                  .src =
                                  PLACEHOLDER_IMAGE;
                              }

                            }}
                          />

                        ) : (

                          <div
                            className="
                              flex
                              h-full
                              w-full
                              flex-col
                              items-center
                              justify-center
                              bg-gray-100
                              text-gray-400
                            "
                          >

                            <Building2
                              className="
                                h-10
                                w-10
                              "
                            />

                            <span
                              className="
                                mt-2
                                text-xs
                              "
                            >
                              No image available
                            </span>

                          </div>

                        )}

                        {/* ==================================
                            STATUS BADGE
                        ================================== */}

                        <div
                          className="
                            absolute
                            left-4
                            top-4
                          "
                        >

                          <span
                            className="
                              inline-flex
                              items-center
                              rounded-full
                              bg-amber-100
                              px-3
                              py-1
                              text-xs
                              font-semibold
                              text-amber-800
                              shadow-sm
                            "
                          >

                            {getStatusLabel(
                              property?.status
                            )}

                          </span>

                        </div>

                      </Link>

                      {/* ====================================
                          CONTENT
                      ==================================== */}

                      <div
                        className="
                          p-5
                        "
                      >

                        <div
                          className="
                            min-w-0
                          "
                        >

                          {/* Property Title */}

                          <Link
                            to={
                              propertyPath
                            }
                          >

                            <h2
                              className="
                                truncate
                                text-lg
                                font-semibold
                                text-gray-900
                                transition
                                group-hover:text-gray-700
                              "
                            >
                              {getPropertyTitle(
                                property
                              )}
                            </h2>

                          </Link>

                          {/* Location */}

                          <div
                            className="
                              mt-2
                              flex
                              items-start
                              gap-2
                              text-sm
                              text-gray-500
                            "
                          >

                            <MapPin
                              className="
                                mt-0.5
                                h-4
                                w-4
                                shrink-0
                              "
                            />

                            <span
                              className="
                                line-clamp-2
                              "
                            >
                              {getPropertyLocation(
                                property
                              )}
                            </span>

                          </div>

                        </div>

                        {/* ==================================
                            PRICE
                        ================================== */}

                        <div
                          className="
                            mt-4
                          "
                        >

                          <p
                            className="
                              text-xl
                              font-bold
                              text-gray-900
                            "
                          >

                            {formatPrice(
                              property?.price,
                              property?.currency
                            )}

                          </p>

                          {property
                            ?.paymentType && (

                            <p
                              className="
                                mt-1
                                text-xs
                                text-gray-500
                              "
                            >
                              {
                                property.paymentType
                              }
                            </p>

                          )}

                        </div>

                        {/* ==================================
                            PROPERTY FEATURES
                        ================================== */}

                        <div
                          className="
                            mt-4
                            flex
                            flex-wrap
                            items-center
                            gap-4
                            border-t
                            border-gray-100
                            pt-4
                            text-sm
                            text-gray-600
                          "
                        >

                          {/* Bedrooms */}

                          {property
                              ?.bedrooms !==
                            undefined &&
                            property
                              ?.bedrooms !==
                              null && (

                              <div
                                className="
                                  flex
                                  items-center
                                  gap-1.5
                                "
                              >

                                <BedDouble
                                  className="
                                    h-4
                                    w-4
                                  "
                                />

                                <span>
                                  {
                                    property.bedrooms
                                  }{" "}
                                  {Number(
                                    property.bedrooms
                                  ) === 1
                                    ? "Bed"
                                    : "Beds"}
                                </span>

                              </div>

                            )}

                          {/* Bathrooms */}

                          {property
                              ?.bathrooms !==
                            undefined &&
                            property
                              ?.bathrooms !==
                              null && (

                              <div
                                className="
                                  flex
                                  items-center
                                  gap-1.5
                                "
                              >

                                <Bath
                                  className="
                                    h-4
                                    w-4
                                  "
                                />

                                <span>
                                  {
                                    property.bathrooms
                                  }{" "}
                                  {Number(
                                    property.bathrooms
                                  ) === 1
                                    ? "Bath"
                                    : "Baths"}
                                </span>

                              </div>

                            )}

                          {/* Size */}

                          {(property
                            ?.size ||
                            property
                              ?.area ||
                            property
                              ?.squareFeet) && (

                            <div
                              className="
                                flex
                                items-center
                                gap-1.5
                              "
                            >

                              <Square
                                className="
                                  h-4
                                  w-4
                                "
                              />

                              <span>

                                {property
                                  ?.size ||
                                  property
                                    ?.area ||
                                  property
                                    ?.squareFeet}

                                {property
                                  ?.sizeUnit
                                  ? ` ${property.sizeUnit}`
                                  : ""}

                              </span>

                            </div>

                          )}

                        </div>

                        {/* ==================================
                            PROPERTY TYPE
                        ================================== */}

                        {property
                          ?.propertyType && (

                          <div
                            className="
                              mt-4
                            "
                          >

                            <span
                              className="
                                inline-flex
                                rounded-md
                                bg-gray-100
                                px-2.5
                                py-1
                                text-xs
                                font-medium
                                capitalize
                                text-gray-700
                              "
                            >
                              {
                                property.propertyType
                              }
                            </span>

                          </div>

                        )}

                        {/* ==================================
                            VIEW PROPERTY
                        ================================== */}

                        {propertyId && (

                          <Link
                            to={
                              propertyPath
                            }
                            className="
                              mt-5
                              flex
                              w-full
                              items-center
                              justify-center
                              rounded-lg
                              border
                              border-gray-300
                              px-4
                              py-2.5
                              text-sm
                              font-medium
                              text-gray-700
                              transition
                              hover:bg-gray-50
                              focus:outline-none
                              focus:ring-2
                              focus:ring-gray-400
                              focus:ring-offset-2
                            "
                          >
                            View Property
                          </Link>

                        )}

                      </div>

                    </article>
                  );
                }
              )}

            </div>

          )}

      </main>

    </div>
  );
};

/* ==========================================================
   EXPORT
========================================================== */

export default ReservedProperties;