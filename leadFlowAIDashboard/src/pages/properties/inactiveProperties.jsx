/**
 * ==========================================================
 *
 * LeadFlow AI — Shared Inactive Properties
 *
 * File
 * ----
 * src/pages/properties/inactiveProperties.jsx
 *
 * Shared Routes
 * -------------
 *
 * Admin:
 *   /admin/properties/inactive
 *
 * Agent:
 *   /agent/properties/inactive
 *
 * ==========================================================
 *
 * ARCHITECTURE
 * ----------------------------------------------------------
 *
 * This page is intentionally SHARED between Admin and Agent.
 *
 * App.jsx decides which workspace is rendering this page:
 *
 *   Admin
 *      ↓
 *   MainLayout
 *      ↓
 *   /admin/properties/inactive
 *      ↓
 *   InactiveProperties
 *
 *
 *   Agent
 *      ↓
 *   MainLayout
 *      ↓
 *   /agent/properties/inactive
 *      ↓
 *   InactiveProperties
 *
 * ==========================================================
 *
 * IMPORTANT
 * ----------------------------------------------------------
 *
 * This component does NOT render MainLayout.
 *
 * MainLayout is provided by App.jsx.
 *
 * ==========================================================
 *
 * DATA ARCHITECTURE
 * ----------------------------------------------------------
 *
 * Property data is obtained through:
 *
 *   useProperties("inactive")
 *
 * The backend endpoint is shared:
 *
 *   GET /api/properties/inactive
 *
 * Organization isolation and authenticated-user rules
 * belong to the backend/controller/service layer.
 *
 * The frontend must NOT send:
 *
 *   agentId
 *   organizationId
 *
 * ==========================================================
 *
 * IMAGE ARCHITECTURE
 * ----------------------------------------------------------
 *
 * Property images remain canonical:
 *
 *   Property.coverImage
 *
 * The property service / hook may expose:
 *
 *   property.imageUrl
 *
 * Therefore this component supports:
 *
 *   property.imageUrl
 *   property.coverImage.url
 *   property.image
 *
 * No image is created here.
 *
 * No image is regenerated here.
 *
 * No duplicate image is created here.
 *
 * ==========================================================
 */

import React, {
  useState,
} from "react";

import {
  Link,
  useLocation,
  useNavigate,
} from "react-router-dom";

import {
  Building2,
  MapPin,
  BedDouble,
  Bath,
  Square,
  Eye,
  RefreshCw,
  Search,
  AlertCircle,
  ArrowLeft,
  Home,
  Archive,
} from "lucide-react";

import useProperties from "../../hooks/useProperties";


/* ==========================================================
   HELPERS
========================================================== */

/**
 * Safely formats a property price.
 */
const formatPrice = (price) => {

  if (
    price === null ||
    price === undefined ||
    price === ""
  ) {
    return "Price not available";
  }

  const numericPrice =
    Number(price);

  if (Number.isNaN(numericPrice)) {
    return String(price);
  }

  return new Intl.NumberFormat(
    "en-KE",
    {
      style: "currency",
      currency: "KES",
      maximumFractionDigits: 0,
    }
  ).format(numericPrice);

};


/**
 * Safely obtains the property ID.
 */
const getPropertyId = (
  property
) => {

  return (
    property?._id ||
    property?.id ||
    ""
  );

};


/**
 * Safely obtains property title.
 */
const getPropertyTitle = (
  property
) => {

  return (
    property?.title ||
    property?.name ||
    "Untitled Property"
  );

};


/**
 * Safely obtains property location.
 */
const getPropertyLocation = (
  property
) => {

  if (
    typeof property?.location === "string"
  ) {

    return property.location;

  }


  if (
    property?.location &&
    typeof property.location === "object"
  ) {

    return (
      property.location.address ||
      property.location.name ||
      property.location.city ||
      "Location not specified"
    );

  }


  return (
    property?.address ||
    property?.city ||
    "Location not specified"
  );

};


/**
 * Safely obtains property image URL.
 *
 * Canonical image relationship:
 *
 *   Property.coverImage
 *          ↓
 *   PropertyImage
 *
 * The service/hook may normalize this to:
 *
 *   property.imageUrl
 *
 * Fallbacks are retained for backwards compatibility.
 */
const getImageUrl = (
  property
) => {

  /* --------------------------------------------------------
     NORMALIZED SERVICE IMAGE
  -------------------------------------------------------- */

  if (
    typeof property?.imageUrl === "string" &&
    property.imageUrl.trim()
  ) {

    return property.imageUrl;

  }


  /* --------------------------------------------------------
     CANONICAL COVER IMAGE
  -------------------------------------------------------- */

  if (
    typeof property?.coverImage === "string" &&
    property.coverImage.trim()
  ) {

    return property.coverImage;

  }


  if (
    property?.coverImage &&
    typeof property.coverImage === "object"
  ) {

    return (
      property.coverImage.url ||
      property.coverImage.imageUrl ||
      property.coverImage.secureUrl ||
      property.coverImage.path ||
      ""
    );

  }


  /* --------------------------------------------------------
     LEGACY IMAGE FIELD
  -------------------------------------------------------- */

  if (
    typeof property?.image === "string" &&
    property.image.trim()
  ) {

    return property.image;

  }


  return "";

};


/**
 * Safely obtains bedrooms.
 */
const getBedrooms = (
  property
) => {

  return (
    property?.bedrooms ??
    property?.beds ??
    null
  );

};


/**
 * Safely obtains bathrooms.
 */
const getBathrooms = (
  property
) => {

  return (
    property?.bathrooms ??
    property?.baths ??
    null
  );

};


/**
 * Safely obtains property size.
 */
const getPropertySize = (
  property
) => {

  return (
    property?.area ??
    property?.size ??
    property?.squareFeet ??
    property?.squareMeters ??
    null
  );

};


/* ==========================================================
   COMPONENT
========================================================== */

const InactiveProperties = () => {

  const navigate =
    useNavigate();

  const location =
    useLocation();


  /* ========================================================
     WORKSPACE DETECTION
     --------------------------------------------------------
     This component is shared.
     
     Admin:
       /admin/properties/inactive

     Agent:
       /agent/properties/inactive

     We use the current route only to determine navigation.
     
     We do NOT use this to determine authorization.
     
     Authorization remains the responsibility of:
     
       RoleRoute
       protect()
       backend controller/service
  ======================================================== */

  const isAgentWorkspace =
    location.pathname.startsWith(
      "/agent/"
    );


  const workspaceBasePath =
    isAgentWorkspace
      ? "/agent"
      : "/admin";


  const propertiesBasePath =
    `${workspaceBasePath}/properties`;


  /* ========================================================
     CENTRALIZED PROPERTY HOOK
  ======================================================== */

  const {
    inactiveProperties,
    inactiveLoading,
    inactiveError,
    fetchInactiveProperties,
    searchProperties,
  } = useProperties(
    "inactive"
  );


  /* ========================================================
     LOCAL STATE
  ======================================================== */

  const [
    searchQuery,
    setSearchQuery,
  ] = useState("");


  const [
    refreshing,
    setRefreshing,
  ] = useState(false);


  /* ========================================================
     SAFE ARRAY
  ======================================================== */

  const safeInactiveProperties =
    Array.isArray(
      inactiveProperties
    )
      ? inactiveProperties
      : [];


  /* ========================================================
     SEARCH HANDLER
  ======================================================== */

  const handleSearch = (
    event
  ) => {

    const value =
      event.target.value;

    setSearchQuery(
      value
    );


    if (
      typeof searchProperties ===
      "function"
    ) {

      searchProperties(
        value
      );

    }

  };


  /* ========================================================
     REFRESH HANDLER
  ======================================================== */

  const handleRefresh = async () => {

    try {

      setRefreshing(
        true
      );


      if (
        typeof fetchInactiveProperties ===
        "function"
      ) {

        await fetchInactiveProperties();

      }

    } catch (error) {

      console.error(
        "Inactive properties refresh error:",
        error
      );

    } finally {

      setRefreshing(
        false
      );

    }

  };


  /* ========================================================
     PROPERTY DETAILS
     --------------------------------------------------------
     IMPORTANT:
     The destination depends on the workspace.
     
     Admin:
       /admin/properties/:propertyId
     
     Agent:
       /agent/properties/:propertyId
  ======================================================== */

  const handlePropertyClick = (
    property
  ) => {

    const propertyId =
      getPropertyId(
        property
      );


    if (!propertyId) {

      console.warn(
        "Unable to navigate to property: missing property ID",
        property
      );

      return;

    }


    navigate(
      `${propertiesBasePath}/${propertyId}`
    );

  };


  /* ========================================================
     LOADING STATE
  ======================================================== */

  if (inactiveLoading) {

    return (

      <div className="min-h-screen bg-slate-50 p-6">

        <div className="mx-auto max-w-7xl">

          <div className="mb-8">

            <div className="h-8 w-64 animate-pulse rounded-lg bg-slate-200" />

            <div className="mt-3 h-4 w-96 animate-pulse rounded bg-slate-200" />

          </div>


          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">

            {[
              1,
              2,
              3,
              4,
              5,
              6,
            ].map(
              (item) => (

                <div
                  key={item}
                  className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
                >

                  <div className="h-52 animate-pulse bg-slate-200" />


                  <div className="space-y-4 p-5">

                    <div className="h-5 w-3/4 animate-pulse rounded bg-slate-200" />

                    <div className="h-4 w-1/2 animate-pulse rounded bg-slate-200" />

                    <div className="h-4 w-full animate-pulse rounded bg-slate-200" />

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
     ERROR STATE
  ======================================================== */

  if (inactiveError) {

    return (

      <div className="min-h-screen bg-slate-50 p-6">

        <div className="mx-auto max-w-3xl">

          <button
            type="button"
            onClick={() =>
              navigate(
                propertiesBasePath
              )
            }
            className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-slate-900"
          >

            <ArrowLeft
              size={18}
            />

            Back to Properties

          </button>


          <div className="rounded-2xl border border-red-200 bg-white p-8 text-center shadow-sm">

            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50">

              <AlertCircle
                className="text-red-500"
                size={28}
              />

            </div>


            <h2 className="text-xl font-semibold text-slate-900">

              Unable to load inactive properties

            </h2>


            <p className="mt-2 text-sm text-slate-600">

              {inactiveError}

            </p>


            <button
              type="button"
              onClick={
                handleRefresh
              }
              disabled={
                refreshing
              }
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >

              <RefreshCw
                size={17}
                className={
                  refreshing
                    ? "animate-spin"
                    : ""
                }
              />

              Try Again

            </button>

          </div>

        </div>

      </div>

    );

  }


  /* ========================================================
     MAIN PAGE
  ======================================================== */

  return (

    <div className="min-h-screen bg-slate-50">

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">


        {/* ==================================================
            PAGE HEADER
        ================================================== */}

        <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

          <div>

            <button
              type="button"
              onClick={() =>
                navigate(
                  propertiesBasePath
                )
              }
              className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-900"
            >

              <ArrowLeft
                size={17}
              />

              Properties

            </button>


            <div className="flex items-center gap-3">

              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-white">

                <Archive
                  size={24}
                />

              </div>


              <div>

                <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">

                  Inactive Properties

                </h1>


                <p className="mt-1 text-sm text-slate-500 sm:text-base">

                  Properties that are currently inactive and not available for active use.

                </p>

              </div>

            </div>

          </div>


          <button
            type="button"
            onClick={
              handleRefresh
            }
            disabled={
              refreshing
            }
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >

            <RefreshCw
              size={17}
              className={
                refreshing
                  ? "animate-spin"
                  : ""
              }
            />

            Refresh

          </button>

        </div>


        {/* ==================================================
            SUMMARY CARDS
        ================================================== */}

        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">


          {/* =================================================
              TOTAL INACTIVE
          ================================================= */}

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

            <div className="flex items-center justify-between">

              <div>

                <p className="text-sm font-medium text-slate-500">

                  Inactive Properties

                </p>


                <p className="mt-2 text-3xl font-bold text-slate-900">

                  {
                    safeInactiveProperties.length
                  }

                </p>

              </div>


              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100">

                <Archive
                  size={22}
                  className="text-slate-700"
                />

              </div>

            </div>

          </div>


          {/* =================================================
              CURRENT STATUS
          ================================================= */}

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

            <div className="flex items-center justify-between">

              <div>

                <p className="text-sm font-medium text-slate-500">

                  Current Status

                </p>


                <p className="mt-2 text-lg font-semibold capitalize text-slate-900">

                  Inactive

                </p>

              </div>


              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100">

                <Building2
                  size={22}
                  className="text-slate-700"
                />

              </div>

            </div>

          </div>


          {/* =================================================
              ALL LISTINGS
          ================================================= */}

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:col-span-2 lg:col-span-1">

            <div className="flex items-center justify-between">

              <div>

                <p className="text-sm font-medium text-slate-500">

                  View Inventory

                </p>


                <Link
                  to={`${propertiesBasePath}/listings`}
                  className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-slate-900 hover:underline"
                >

                  All Listings

                  <Eye
                    size={15}
                  />

                </Link>

              </div>


              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100">

                <Home
                  size={22}
                  className="text-slate-700"
                />

              </div>

            </div>

          </div>

        </div>


        {/* ==================================================
            SEARCH
        ================================================== */}

        <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">

          <div className="relative">

            <Search
              size={19}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />


            <input
              type="search"
              value={
                searchQuery
              }
              onChange={
                handleSearch
              }
              placeholder="Search inactive properties by name or location..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:bg-white"
            />

          </div>

        </div>


        {/* ==================================================
            EMPTY STATE
        ================================================== */}

        {safeInactiveProperties.length === 0 ? (

          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">

            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">

              <Archive
                size={30}
                className="text-slate-500"
              />

            </div>


            <h2 className="text-xl font-semibold text-slate-900">

              No inactive properties found

            </h2>


            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">

              There are currently no properties marked as inactive, or no properties match your search.

            </p>


            {searchQuery && (

              <button
                type="button"
                onClick={() => {

                  setSearchQuery("");

                  handleRefresh();

                }}
                className="mt-5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
              >

                Clear Search

              </button>

            )}

          </div>

        ) : (

          /* ==================================================
             PROPERTY GRID
          ================================================== */

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">

            {safeInactiveProperties.map(
              (property) => {

                const propertyId =
                  getPropertyId(
                    property
                  );


                const title =
                  getPropertyTitle(
                    property
                  );


                const location =
                  getPropertyLocation(
                    property
                  );


                const imageUrl =
                  getImageUrl(
                    property
                  );


                const bedrooms =
                  getBedrooms(
                    property
                  );


                const bathrooms =
                  getBathrooms(
                    property
                  );


                const size =
                  getPropertySize(
                    property
                  );


                return (

                  <article
                    key={
                      propertyId ||
                      title
                    }
                    className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
                  >

                    {/* ==================================================
                        PROPERTY IMAGE
                    ================================================== */}

                    <div className="relative h-56 overflow-hidden bg-slate-100">

                      {imageUrl ? (

                        <img
                          src={
                            imageUrl
                          }
                          alt={
                            title
                          }
                          className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                          onError={(event) => {

                            event.currentTarget.style.display =
                              "none";

                          }}
                        />

                      ) : (

                        <div className="flex h-full w-full items-center justify-center">

                          <Building2
                            size={42}
                            className="text-slate-300"
                          />

                        </div>

                      )}


                      {/* =================================================
                          STATUS BADGE
                      ================================================= */}

                      <div className="absolute left-4 top-4">

                        <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white shadow-sm">

                          <span className="h-1.5 w-1.5 rounded-full bg-white" />

                          Inactive

                        </span>

                      </div>

                    </div>


                    {/* ==================================================
                        PROPERTY CONTENT
                    ================================================== */}

                    <div className="p-5">

                      <div className="mb-3">

                        <h2 className="line-clamp-1 text-lg font-semibold text-slate-900">

                          {title}

                        </h2>


                        <div className="mt-1 flex items-center gap-1.5 text-sm text-slate-500">

                          <MapPin
                            size={15}
                            className="shrink-0"
                          />


                          <span className="line-clamp-1">

                            {location}

                          </span>

                        </div>

                      </div>


                      {/* =================================================
                          PRICE
                      ================================================= */}

                      <p className="mb-4 text-lg font-bold text-slate-900">

                        {
                          formatPrice(
                            property?.price
                          )
                        }

                      </p>


                      {/* =================================================
                          PROPERTY FEATURES
                      ================================================= */}

                      <div className="mb-5 flex flex-wrap gap-3 border-y border-slate-100 py-3 text-xs text-slate-500">

                        {bedrooms !== null && (

                          <span className="inline-flex items-center gap-1.5">

                            <BedDouble
                              size={15}
                            />

                            {bedrooms} bed

                          </span>

                        )}


                        {bathrooms !== null && (

                          <span className="inline-flex items-center gap-1.5">

                            <Bath
                              size={15}
                            />

                            {bathrooms} bath

                          </span>

                        )}


                        {size !== null && (

                          <span className="inline-flex items-center gap-1.5">

                            <Square
                              size={14}
                            />

                            {size}

                          </span>

                        )}

                      </div>


                      {/* =================================================
                          VIEW PROPERTY
                      ================================================= */}

                      {propertyId ? (

                        <button
                          type="button"
                          onClick={() =>
                            handlePropertyClick(
                              property
                            )
                          }
                          className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                        >

                          <Eye
                            size={17}
                          />

                          View Property

                        </button>

                      ) : (

                        <div className="rounded-xl bg-slate-100 px-4 py-3 text-center text-sm text-slate-500">

                          Property ID unavailable

                        </div>

                      )}

                    </div>

                  </article>

                );

              }
            )}

          </div>

        )}

      </div>

    </div>

  );

};


/* ==========================================================
   EXPORT
========================================================== */

export default InactiveProperties;