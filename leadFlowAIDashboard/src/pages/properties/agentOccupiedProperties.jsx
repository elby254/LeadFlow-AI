/**
 * ==========================================================
 *
 * LEADFLOW AI — AGENT OCCUPIED PROPERTIES
 *
 * Route
 * -----
 * /agent/properties/occupied
 *
 * Purpose
 * -------
 * Provides agents with a lightweight overview of occupied
 * properties.
 *
 * AGENT VISIBILITY
 * ----------------------------------------------------------
 * Agents can see:
 *
 * • Total number of occupied properties
 * • Property names
 * • Property locations
 *
 * Agents do NOT see:
 *
 * • Property images
 * • Property prices
 * • Bedrooms
 * • Bathrooms
 * • Property size
 * • Tenant information
 * • Administrative controls
 * • Archive/delete actions
 *
 * DATA ARCHITECTURE
 * ----------------------------------------------------------
 * This page uses the same centralized useProperties hook
 * as the admin property workspace.
 *
 * The data source remains shared.
 *
 * Only the presentation/workflow is agent-specific.
 *
 * IMPORTANT
 * ----------------------------------------------------------
 * This component does NOT render MainLayout.
 *
 * MainLayout is provided by the parent /agent route
 * in App.jsx.
 *
 * ==========================================================
 */

import React, {
  useMemo,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import {
  Users,
  MapPin,
  RefreshCw,
  Search,
  AlertCircle,
  ArrowLeft,
  Building2,
} from "lucide-react";

import useProperties from "../../hooks/useProperties";


/* ==========================================================
   HELPERS
========================================================== */

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
 * Safely obtains the property name.
 */
const getPropertyName = (property) => {

  return (
    property?.title ||
    property?.name ||
    "Unnamed Property"
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
 * Normalizes property status.
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

const AgentOccupiedProperties = () => {

  const navigate =
    useNavigate();


  /* ========================================================
     CENTRALIZED PROPERTY DATA
  ======================================================== */

  const {
    occupiedProperties,
    occupiedLoading,
    occupiedError,
    fetchOccupiedProperties,
  } = useProperties(
    "occupied"
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
     DEFENSIVE STATUS FILTER
     --------------------------------------------------------
     Even though useProperties("occupied") should already
     provide occupied properties, keep the page defensive.
  ======================================================== */

  const occupiedList = useMemo(() => {

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
     SEARCH
     --------------------------------------------------------
     Agents can search by:
     • property name
     • location
  ======================================================== */

  const displayedProperties = useMemo(() => {

    const query =
      searchQuery
        .trim()
        .toLowerCase();


    if (!query) {

      return occupiedList;

    }


    return occupiedList.filter(
      (property) => {

        const name =
          getPropertyName(
            property
          )
            .toLowerCase();


        const location =
          getPropertyLocation(
            property
          )
            .toLowerCase();


        return (
          name.includes(query) ||
          location.includes(query)
        );

      }
    );

  }, [
    occupiedList,
    searchQuery,
  ]);


  /* ========================================================
     REFRESH
  ======================================================== */

  const handleRefresh = async () => {

    try {

      setRefreshing(true);

      await fetchOccupiedProperties();

    } catch (error) {

      console.error(
        "Agent occupied properties refresh failed:",
        error
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
     BACK TO AGENT PROPERTY DASHBOARD
  ======================================================== */

  const handleBack = () => {

    navigate(
      "/agent/properties"
    );

  };


  /* ========================================================
     LOADING STATE
  ======================================================== */

  if (occupiedLoading) {

    return (

      <div className="min-h-screen bg-slate-50">

        <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">

          <div className="mb-8">

            <div className="mb-4 h-5 w-32 animate-pulse rounded bg-slate-200" />

            <div className="flex items-center gap-3">

              <div className="h-12 w-12 animate-pulse rounded-2xl bg-slate-200" />

              <div>

                <div className="h-8 w-64 animate-pulse rounded-lg bg-slate-200" />

                <div className="mt-3 h-4 w-80 max-w-full animate-pulse rounded bg-slate-200" />

              </div>

            </div>

          </div>


          {/* COUNT SKELETON */}

          <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

            <div className="h-4 w-40 animate-pulse rounded bg-slate-200" />

            <div className="mt-3 h-10 w-24 animate-pulse rounded bg-slate-200" />

          </div>


          {/* LIST SKELETON */}

          <div className="space-y-3">

            {[1, 2, 3, 4, 5].map(
              (item) => (

                <div
                  key={item}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                >

                  <div className="h-5 w-2/5 animate-pulse rounded bg-slate-200" />

                  <div className="mt-3 h-4 w-1/3 animate-pulse rounded bg-slate-200" />

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
            onClick={handleBack}
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
                size={28}
                className="text-red-500"
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
              onClick={handleRefresh}
              disabled={refreshing}
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
     MAIN AGENT VIEW
  ======================================================== */

  return (

    <div className="min-h-screen bg-slate-50">

      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">


        {/* ==================================================
            HEADER
        ================================================== */}

        <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">

          <div>

            <button
              type="button"
              onClick={handleBack}
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

                  Overview of properties currently occupied.

                </p>

              </div>

            </div>

          </div>


          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
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
            OCCUPIED COUNT
        ================================================== */}

        <div className="mb-6">

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

            <div className="flex items-center justify-between">

              <div>

                <p className="text-sm font-medium text-slate-500">

                  Occupied Properties

                </p>


                <p className="mt-2 text-4xl font-bold tracking-tight text-slate-900">

                  {occupiedList.length}

                </p>

              </div>


              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100">

                <Users
                  size={24}
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
              value={searchQuery}
              onChange={(event) =>
                setSearchQuery(
                  event.target.value
                )
              }
              placeholder="Search by property name or location..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:bg-white"
            />

          </div>

        </div>


        {/* ==================================================
            RESULT COUNT
        ================================================== */}

        {searchQuery && (

          <div className="mb-5 flex items-center justify-between">

            <p className="text-sm text-slate-500">

              Showing{" "}

              <span className="font-semibold text-slate-900">

                {displayedProperties.length}

              </span>{" "}

              occupied propert
              {displayedProperties.length === 1
                ? "y"
                : "ies"}

            </p>


            <button
              type="button"
              onClick={handleClearSearch}
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

              <Building2
                size={30}
                className="text-slate-500"
              />

            </div>


            <h2 className="text-xl font-semibold text-slate-900">

              {searchQuery
                ? "No matching occupied properties"
                : "No occupied properties"}

            </h2>


            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">

              {searchQuery
                ? "Try another property name or location."
                : "There are currently no occupied properties in the inventory."}

            </p>


            {searchQuery && (

              <button
                type="button"
                onClick={handleClearSearch}
                className="mt-5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
              >

                Clear Search

              </button>

            )}

          </div>

        ) : (

          /* ==================================================
             SIMPLE AGENT PROPERTY LIST
          ================================================== */

          <div className="space-y-3">

            {displayedProperties.map(
              (property, index) => {

                const propertyId =
                  getPropertyId(
                    property
                  );


                const propertyName =
                  getPropertyName(
                    property
                  );


                const location =
                  getPropertyLocation(
                    property
                  );


                return (

                  <div
                    key={
                      propertyId ||
                      `${propertyName}-${index}`
                    }
                    className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md"
                  >

                    <div className="flex items-start gap-4">

                      {/* PROPERTY ICON */}

                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100">

                        <Building2
                          size={21}
                          className="text-slate-700"
                        />

                      </div>


                      {/* BASIC PROPERTY INFORMATION */}

                      <div className="min-w-0 flex-1">

                        <h2 className="truncate text-base font-semibold text-slate-900">

                          {propertyName}

                        </h2>


                        <div className="mt-1 flex items-center gap-1.5 text-sm text-slate-500">

                          <MapPin
                            size={15}
                            className="shrink-0"
                          />

                          <span className="truncate">

                            {location}

                          </span>

                        </div>

                      </div>


                      {/* STATUS */}

                      <span className="shrink-0 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700">

                        Occupied

                      </span>

                    </div>

                  </div>

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

export default AgentOccupiedProperties;