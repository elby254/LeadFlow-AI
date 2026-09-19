/**
 * ==========================================================
 *
 * OCCUPIED PROPERTIES
 *
 * Route
 * -----
 * /admin/properties/occupied
 *
 * Purpose
 * -------
 * Displays properties whose current status is "occupied".
 *
 * IMPORTANT
 * ----------------------------------------------------------
 * • Uses the centralized useProperties hook.
 * • Uses the dedicated occupiedProperties state.
 * • Uses occupiedLoading and occupiedError.
 * • Backend is the primary source of truth.
 * • The hook performs defensive status filtering.
 * • Property images use property.imageUrl first.
 * • This page does NOT generate property images.
 * • This page does NOT render MainLayout.
 *
 * MainLayout is already provided by the parent /admin route
 * in App.jsx.
 *
 * ==========================================================
 */

import React, {
  useMemo,
  useState,
} from "react";

import {
  Link,
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
  Users,
} from "lucide-react";

import useProperties from "../../hooks/useProperties";


/* ==========================================================
   HELPERS
========================================================== */

/**
 * Safely formats a property price.
 */
const formatPrice = (price, currency = "KES") => {
  if (
    price === null ||
    price === undefined ||
    price === ""
  ) {
    return "Price not available";
  }

  const numericPrice = Number(price);

  if (!Number.isFinite(numericPrice)) {
    return String(price);
  }

  try {
    return new Intl.NumberFormat(
      "en-KE",
      {
        style: "currency",
        currency: currency || "KES",
        maximumFractionDigits: 0,
      }
    ).format(numericPrice);
  } catch {
    return `KES ${numericPrice.toLocaleString("en-KE")}`;
  }
};


/**
 * Safely obtains the property ID.
 */
const getPropertyId = (property) => {
  return (
    property?._id ||
    property?.id ||
    ""
  );
};


/**
 * Safely obtains property title.
 */
const getPropertyTitle = (property) => {
  return (
    property?.title ||
    property?.name ||
    "Untitled Property"
  );
};


/**
 * Safely obtains property location.
 */
const getPropertyLocation = (property) => {
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

  const parts = [
    property?.estate,
    property?.address,
    property?.city,
    property?.county,
  ].filter(Boolean);

  if (parts.length > 0) {
    return [
      ...new Set(parts),
    ].join(", ");
  }

  return "Location not specified";
};


/**
 * Safely obtains image URL.
 *
 * The shared property image architecture uses
 * property.imageUrl.
 *
 * imageUrl is therefore the primary source.
 *
 * The additional fallbacks are defensive only.
 */
const getImageUrl = (property) => {
  return (
    property?.imageUrl ||
    property?.coverImage?.url ||
    property?.image ||
    ""
  );
};


/**
 * Safely obtains bedrooms.
 */
const getBedrooms = (property) => {
  return (
    property?.bedrooms ??
    property?.beds ??
    null
  );
};


/**
 * Safely obtains bathrooms.
 */
const getBathrooms = (property) => {
  return (
    property?.bathrooms ??
    property?.baths ??
    null
  );
};


/**
 * Safely obtains property size.
 */
const getPropertySize = (property) => {
  return (
    property?.area ??
    property?.size ??
    property?.squareFeet ??
    property?.squareMeters ??
    null
  );
};


/**
 * Normalize status for defensive filtering.
 */
const normalizeStatus = (status) => {
  if (
    status === null ||
    status === undefined
  ) {
    return "";
  }

  return String(status)
    .trim()
    .toLowerCase();
};


/* ==========================================================
   COMPONENT
========================================================== */

const OccupiedProperties = () => {

  const navigate = useNavigate();


  /* ========================================================
     PROPERTY HOOK
     --------------------------------------------------------
     IMPORTANT:
     Use the dedicated occupied state exposed by the
     centralized useProperties hook.
  ======================================================== */

  const {
    occupiedProperties,
    occupiedLoading,
    occupiedError,
    fetchOccupiedProperties,
  } = useProperties("occupied");


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
     DEFENSIVE OCCUPIED FILTER
     --------------------------------------------------------
     The centralized hook already filters the API response.
     We apply one additional defensive filter here so this
     page can NEVER display another status accidentally.
  ======================================================== */

  const filteredOccupiedProperties =
    useMemo(() => {

      if (
        !Array.isArray(
          occupiedProperties
        )
      ) {
        return [];
      }

      return occupiedProperties.filter(
        (property) =>
          normalizeStatus(
            property?.status
          ) === "occupied"
      );

    }, [
      occupiedProperties,
    ]);


  /* ========================================================
     SEARCH FILTER
     --------------------------------------------------------
     Search is performed locally against the dedicated
     occupied dataset.

     This avoids mutating the centralized hook's dataset
     while the user types.
  ======================================================== */

  const displayedProperties =
    useMemo(() => {

      const properties =
        filteredOccupiedProperties;

      const query =
        searchQuery
          .trim()
          .toLowerCase();

      if (!query) {
        return properties;
      }

      return properties.filter(
        (property) => {

          const title =
            String(
              property?.title ||
              property?.name ||
              ""
            ).toLowerCase();

          const location =
            String(
              getPropertyLocation(
                property
              )
            ).toLowerCase();

          const propertyType =
            String(
              property?.propertyType ||
              ""
            ).toLowerCase();

          return (
            title.includes(query) ||
            location.includes(query) ||
            propertyType.includes(query)
          );
        }
      );

    }, [
      filteredOccupiedProperties,
      searchQuery,
    ]);


  /* ========================================================
     REFRESH HANDLER
     --------------------------------------------------------
     Uses the dedicated occupied endpoint:
     
     GET /properties/occupied
  ======================================================== */

  const handleRefresh = async () => {

    try {

      setRefreshing(true);

      await fetchOccupiedProperties();

    } catch (err) {

      console.error(
        "Occupied properties refresh failed:",
        err
      );

    } finally {

      setRefreshing(false);

    }
  };


  /* ========================================================
     CLEAR SEARCH
  ======================================================== */

  const handleClearSearch = () => {

    setSearchQuery("");

  };


  /* ========================================================
     PROPERTY DETAILS
  ======================================================== */

  const handlePropertyClick = (
    property
  ) => {

    const propertyId =
      getPropertyId(
        property
      );

    if (!propertyId) {
      return;
    }

    navigate(
      `/admin/properties/${propertyId}`
    );

  };


  /* ========================================================
     LOADING STATE
  ======================================================== */

  if (occupiedLoading) {

    return (
      <div className="min-h-screen bg-slate-50">

        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">

          {/* HEADER SKELETON */}

          <div className="mb-8">

            <div className="mb-4 h-5 w-28 animate-pulse rounded bg-slate-200" />

            <div className="flex items-center gap-3">

              <div className="h-12 w-12 animate-pulse rounded-2xl bg-slate-200" />

              <div>

                <div className="h-8 w-64 animate-pulse rounded-lg bg-slate-200" />

                <div className="mt-3 h-4 w-96 max-w-full animate-pulse rounded bg-slate-200" />

              </div>

            </div>

          </div>


          {/* SUMMARY SKELETON */}

          <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">

            {[1, 2, 3].map(
              (item) => (

                <div
                  key={item}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                >

                  <div className="h-4 w-32 animate-pulse rounded bg-slate-200" />

                  <div className="mt-3 h-8 w-20 animate-pulse rounded bg-slate-200" />

                </div>

              )
            )}

          </div>


          {/* CARD SKELETON */}

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">

            {[1, 2, 3, 4, 5, 6].map(
              (item) => (

                <div
                  key={item}
                  className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
                >

                  <div className="h-56 animate-pulse bg-slate-200" />

                  <div className="space-y-4 p-5">

                    <div className="h-5 w-3/4 animate-pulse rounded bg-slate-200" />

                    <div className="h-4 w-1/2 animate-pulse rounded bg-slate-200" />

                    <div className="h-4 w-full animate-pulse rounded bg-slate-200" />

                    <div className="h-10 w-full animate-pulse rounded bg-slate-200" />

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

  if (occupiedError) {

    return (
      <div className="min-h-screen bg-slate-50">

        <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">

          <button
            type="button"
            onClick={() =>
              navigate(
                "/admin/properties"
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

              Unable to load occupied properties

            </h2>


            <p className="mt-2 text-sm text-slate-600">

              {occupiedError}

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
                  "/admin/properties"
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

                <Users
                  size={24}
                />

              </div>


              <div>

                <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">

                  Occupied Properties

                </h1>


                <p className="mt-1 text-sm text-slate-500 sm:text-base">

                  Properties currently occupied by tenants or residents.

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
            SUMMARY
        ================================================== */}

        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">


          {/* OCCUPIED COUNT */}

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

            <div className="flex items-center justify-between">

              <div>

                <p className="text-sm font-medium text-slate-500">

                  Occupied Properties

                </p>


                <p className="mt-2 text-3xl font-bold text-slate-900">

                  {
                    filteredOccupiedProperties.length
                  }

                </p>

              </div>


              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100">

                <Users
                  size={22}
                  className="text-slate-700"
                />

              </div>

            </div>

          </div>


          {/* STATUS */}

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

            <div className="flex items-center justify-between">

              <div>

                <p className="text-sm font-medium text-slate-500">

                  Current Status

                </p>


                <p className="mt-2 text-lg font-semibold capitalize text-slate-900">

                  Occupied

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


          {/* INVENTORY */}

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:col-span-2 lg:col-span-1">

            <div className="flex items-center justify-between">

              <div>

                <p className="text-sm font-medium text-slate-500">

                  View Inventory

                </p>


                <Link
                  to="/admin/properties/listings"
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
              onChange={(event) =>
                setSearchQuery(
                  event.target.value
                )
              }
              placeholder="Search occupied properties by name, location, or type..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:bg-white"
            />

          </div>

        </div>


        {/* ==================================================
            SEARCH RESULT COUNT
        ================================================== */}

        {searchQuery && (
          <div className="mb-5 flex items-center justify-between">

            <p className="text-sm text-slate-500">

              Showing{" "}
              <span className="font-semibold text-slate-900">
                {displayedProperties.length}
              </span>{" "}
              matching occupied propert
              {displayedProperties.length === 1
                ? "y"
                : "ies"}

            </p>


            <button
              type="button"
              onClick={
                handleClearSearch
              }
              className="text-sm font-medium text-slate-700 hover:underline"
            >

              Clear Search

            </button>

          </div>
        )}


        {/* ==================================================
            EMPTY STATE
        ================================================== */}

        {displayedProperties.length === 0 ? (

          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">

            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">

              <Users
                size={30}
                className="text-slate-500"
              />

            </div>


            <h2 className="text-xl font-semibold text-slate-900">

              {searchQuery
                ? "No matching occupied properties"
                : "No occupied properties found"}

            </h2>


            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">

              {searchQuery
                ? "Try a different property name, location, or property type."
                : "There are currently no properties marked as occupied in the property inventory."}

            </p>


            {searchQuery && (

              <button
                type="button"
                onClick={
                  handleClearSearch
                }
                className="mt-5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
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

            {displayedProperties.map(
              (property, index) => {

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
                      `${title}-${index}`
                    }
                    className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-lg"
                  >

                    {/* ======================================
                        IMAGE
                    ====================================== */}

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
                          loading="lazy"
                        />

                      ) : (

                        <div className="flex h-full w-full flex-col items-center justify-center">

                          <Building2
                            size={42}
                            className="text-slate-300"
                          />

                          <span className="mt-2 text-xs text-slate-400">

                            No image available

                          </span>

                        </div>

                      )}


                      {/* STATUS */}

                      <div className="absolute left-4 top-4">

                        <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white shadow-sm">

                          <span className="h-1.5 w-1.5 rounded-full bg-white" />

                          Occupied

                        </span>

                      </div>

                    </div>


                    {/* ======================================
                        CONTENT
                    ====================================== */}

                    <div className="p-5">

                      {/* TITLE + LOCATION */}

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


                      {/* PRICE */}

                      <p className="mb-4 text-lg font-bold text-slate-900">

                        {formatPrice(
                          property?.price,
                          property?.currency
                        )}

                      </p>


                      {/* FEATURES */}

                      <div className="mb-5 flex flex-wrap gap-3 border-y border-slate-100 py-3 text-xs text-slate-500">

                        {bedrooms !== null && (

                          <span className="inline-flex items-center gap-1.5">

                            <BedDouble
                              size={15}
                            />

                            {bedrooms}{" "}

                            {Number(
                              bedrooms
                            ) === 1
                              ? "bed"
                              : "beds"}

                          </span>

                        )}


                        {bathrooms !== null && (

                          <span className="inline-flex items-center gap-1.5">

                            <Bath
                              size={15}
                            />

                            {bathrooms}{" "}

                            {Number(
                              bathrooms
                            ) === 1
                              ? "bath"
                              : "baths"}

                          </span>

                        )}


                        {size !== null && (

                          <span className="inline-flex items-center gap-1.5">

                            <Square
                              size={14}
                            />

                            {size}

                            {property?.sizeUnit
                              ? ` ${property.sizeUnit}`
                              : ""}

                          </span>

                        )}

                      </div>


                      {/* PROPERTY TYPE */}

                      {property?.propertyType && (

                        <div className="mb-4">

                          <span className="inline-flex rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">

                            {property.propertyType}

                          </span>

                        </div>

                      )}


                      {/* ACTION */}

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

export default OccupiedProperties;