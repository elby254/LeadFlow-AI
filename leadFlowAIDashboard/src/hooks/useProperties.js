/**
 * ==========================================================
 *
 * Central hook for managing LeadFlow AI properties.
 *
 * Used by:
 * • Listings.jsx
 * • AvailableProperties.jsx
 * • SoldProperties.jsx
 * • ReservedProperties.jsx
 * • OccupiedProperties.jsx
 * • InactiveProperties.jsx
 * • Recommendations.jsx
 * • Admin Dashboard
 * • Agent Dashboard
 *
 * Backend Endpoints
 * -----------------
 * GET    /properties
 * GET    /properties/available
 * GET    /properties/sold
 * GET    /properties/reserved
 * GET    /properties/occupied
 * GET    /properties/inactive
 * GET    /properties/recommendations
 * POST   /properties
 * PUT    /properties/:id
 * DELETE /properties/:id
 *
 * IMPORTANT
 * ----------------------------------------------------------
 * The backend remains the primary source of truth.
 *
 * Dedicated status endpoints are used for:
 *
 * • available
 * • sold
 * • reserved
 * • occupied
 * • inactive
 *
 * This hook ALSO performs defensive frontend status
 * filtering so that an incorrectly broad backend response
 * cannot cause the wrong properties to appear on dedicated
 * status pages.
 *
 * IMAGE PIPELINE
 * ----------------------------------------------------------
 * Every property returned by this hook is normalized through
 * the shared LeadFlow AI property image helper.
 *
 * Backend:
 *
 * property.coverImage.url
 *
 * becomes:
 *
 * property.imageUrl
 *
 * Components should use:
 *
 * property.imageUrl
 *
 * rather than implementing their own:
 *
 * property.coverImage || property.image
 *
 * ==========================================================
 */

import {
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";

import axiosClient from "../api/axiosClient";

/* ==========================================================
   SHARED PROPERTY IMAGE HELPER
========================================================== */

import getPropertyImageUrl from "../utils/propertyImage";

/* ==========================================================
   DEBUG
========================================================== */

console.log(
  "######## THIS IS THE REAL useProperties.js ########"
);

/* ==========================================================
   STATUS NORMALIZER
========================================================== */

/**
 * Converts different possible backend status formats into
 * one predictable lowercase value.
 *
 * Examples:
 *
 * "Available" -> "available"
 * "AVAILABLE" -> "available"
 * "Sold"      -> "sold"
 * "Reserved"  -> "reserved"
 * "Occupied"  -> "occupied"
 * "Inactive"  -> "inactive"
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
   PROPERTY IMAGE NORMALIZER
========================================================== */

/**
 * Adds the shared browser-ready imageUrl property.
 *
 * IMPORTANT:
 * ----------------------------------------------------------
 * The backend already returns:
 *
 * property.coverImage.url
 *
 * Example:
 *
 * {
 *   coverImage: {
 *     url: "http://localhost:5000/uploads/properties/image.jpg"
 *   }
 * }
 *
 * This helper converts that into:
 *
 * {
 *   coverImage: {...},
 *   imageUrl: "http://localhost:5000/uploads/properties/image.jpg"
 * }
 *
 * The original property structure is preserved.
 */
const normalizePropertyImage = (
  property
) => {

  if (!property) {
    return property;
  }

  const imageUrl =
    getPropertyImageUrl(
      property
    );

  console.log(
    "IMAGE NORMALIZATION:",
    {
      id:
        property?._id ||
        property?.id,

      title:
        property?.title ||
        property?.name,

      originalCoverImage:
        property?.coverImage,

      coverImageUrl:
        property?.coverImage?.url,

      resolvedImageUrl:
        imageUrl,
    }
  );

  return {
    ...property,

    imageUrl,
  };
};

/* ==========================================================
   NORMALIZE PROPERTY COLLECTION
========================================================== */

/**
 * Applies the shared image pipeline to every property.
 */
const normalizeProperties = (
  properties
) => {

  if (
    !Array.isArray(
      properties
    )
  ) {
    return [];
  }

  return properties.map(
    normalizePropertyImage
  );
};

/* ==========================================================
   EXTRACT PROPERTIES FROM API RESPONSE
========================================================== */

/**
 * Supports the common response formats used by the backend.
 *
 * Format 1:
 * {
 *   data: [...]
 * }
 *
 * Format 2:
 * {
 *   properties: [...]
 * }
 *
 * Format 3:
 * {
 *   data: {
 *     properties: [...]
 *   }
 * }
 *
 * Format 4:
 * [...]
 *
 * Format 5:
 * {
 *   results: [...]
 * }
 *
 * Format 6:
 * {
 *   data: {
 *     results: [...]
 *   }
 */
const extractProperties = (
  responseData
) => {

  console.log(
    "EXTRACT PROPERTIES INPUT:",
    responseData
  );

  /* --------------------------------------------------------
     Direct array
  -------------------------------------------------------- */

  if (
    Array.isArray(
      responseData
    )
  ) {

    return responseData;

  }

  /* --------------------------------------------------------
     data array
  -------------------------------------------------------- */

  if (
    Array.isArray(
      responseData?.data
    )
  ) {

    return responseData.data;

  }

  /* --------------------------------------------------------
     properties array
  -------------------------------------------------------- */

  if (
    Array.isArray(
      responseData?.properties
    )
  ) {

    return responseData.properties;

  }

  /* --------------------------------------------------------
     data.properties array
  -------------------------------------------------------- */

  if (
    Array.isArray(
      responseData?.data?.properties
    )
  ) {

    return responseData.data.properties;

  }

  /* --------------------------------------------------------
     results array
  -------------------------------------------------------- */

  if (
    Array.isArray(
      responseData?.results
    )
  ) {

    return responseData.results;

  }

  /* --------------------------------------------------------
     data.results array
  -------------------------------------------------------- */

  if (
    Array.isArray(
      responseData?.data?.results
    )
  ) {

    return responseData.data.results;

  }

  /* --------------------------------------------------------
     Nothing usable returned
  -------------------------------------------------------- */

  console.warn(
    "extractProperties: No property array found in response."
  );

  return [];
};

/* ==========================================================
   HOOK
========================================================== */

const useProperties = (
  filter = "all"
) => {

  console.log(
    "useProperties ENTERED with filter:",
    filter
  );

  /* ========================================================
     STATE
  ======================================================== */

  const [
    properties,
    setProperties,
  ] = useState([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");

  /* ========================================================
     DEDICATED STATUS STATE
  ======================================================== */

  const [
    reservedProperties,
    setReservedProperties,
  ] = useState([]);

  const [
    occupiedProperties,
    setOccupiedProperties,
  ] = useState([]);

  const [
    inactiveProperties,
    setInactiveProperties,
  ] = useState([]);

  /* ========================================================
     DEDICATED STATUS LOADING
  ======================================================== */

  const [
    reservedLoading,
    setReservedLoading,
  ] = useState(false);

  const [
    occupiedLoading,
    setOccupiedLoading,
  ] = useState(false);

  const [
    inactiveLoading,
    setInactiveLoading,
  ] = useState(false);

  /* ========================================================
     DEDICATED STATUS ERRORS
  ======================================================== */

  const [
    reservedError,
    setReservedError,
  ] = useState("");

  const [
    occupiedError,
    setOccupiedError,
  ] = useState("");

  const [
    inactiveError,
    setInactiveError,
  ] = useState("");

  /* ========================================================
     ENDPOINT
  ======================================================== */

  const endpoint = useMemo(() => {

    switch (filter) {

      case "available":
        return "/properties/available";

      case "sold":
        return "/properties/sold";

      case "reserved":
        return "/properties/reserved";

      case "occupied":
        return "/properties/occupied";

      case "inactive":
        return "/properties/inactive";

      case "recommendations":
        return "/properties/recommendations";

      case "all":
      default:
        return "/properties";
    }

  }, [
    filter,
  ]);

  /* ========================================================
     FETCH PROPERTIES
  ======================================================== */

  const fetchProperties =
    useCallback(
      async () => {

        console.log(
          "--------------------------------------------------"
        );

        console.log(
          "useProperties fetching:"
        );

        console.log(
          "Filter:",
          filter
        );

        console.log(
          "Endpoint:",
          endpoint
        );

        console.log(
          "--------------------------------------------------"
        );

        try {

          setLoading(true);

          setError("");

          /* --------------------------------------------------
             Request
          -------------------------------------------------- */

          const response =
            await axiosClient.get(
              endpoint,
              {
                headers: {
                  "Cache-Control":
                    "no-cache",

                  Pragma:
                    "no-cache",
                },

                params: {
                  _t: Date.now(),
                },
              }
            );

          console.log(
            "Properties response status:",
            response.status
          );

          console.log(
            "Properties raw response:",
            response.data
          );

          /* --------------------------------------------------
             Extract array
          -------------------------------------------------- */

          const fetchedProperties =
            extractProperties(
              response.data
            );

          console.log(
            "Extracted properties:",
            fetchedProperties
          );

          console.log(
            "Extracted property count:",
            fetchedProperties.length
          );

          /* --------------------------------------------------
             IMAGE PIPELINE DEBUG
          -------------------------------------------------- */

          console.log(
            "IMAGE PIPELINE DEBUG - BEFORE NORMALIZATION:",
            fetchedProperties?.map(
              (property) => ({
                id:
                  property?._id,

                title:
                  property?.title,

                imageUrl:
                  property?.imageUrl,

                image:
                  property?.image,

                coverImage:
                  property?.coverImage,

                coverImageUrl:
                  property?.coverImage?.url,
              })
            )
          );

          /* --------------------------------------------------
             NORMALIZE IMAGES
          -------------------------------------------------- */

          const normalizedProperties =
            normalizeProperties(
              fetchedProperties
            );

          /* --------------------------------------------------
             IMAGE PIPELINE DEBUG
          -------------------------------------------------- */

          console.log(
            "IMAGE PIPELINE DEBUG - AFTER NORMALIZATION:",
            normalizedProperties?.map(
              (property) => ({
                id:
                  property?._id,

                title:
                  property?.title,

                imageUrl:
                  property?.imageUrl,

                image:
                  property?.image,

                coverImage:
                  property?.coverImage,

                coverImageUrl:
                  property?.coverImage?.url,
              })
            )
          );

          /* --------------------------------------------------
             FIRST PROPERTY IMAGE DEBUG
          -------------------------------------------------- */

          console.log(
            "FIRST EXTRACTED PROPERTY IMAGE DEBUG:",
            normalizedProperties?.[0]
              ? {
                  id:
                    normalizedProperties[0]?._id,

                  title:
                    normalizedProperties[0]?.title,

                  imageUrl:
                    normalizedProperties[0]?.imageUrl,

                  image:
                    normalizedProperties[0]?.image,

                  coverImage:
                    normalizedProperties[0]?.coverImage,

                  coverImageUrl:
                    normalizedProperties[0]
                      ?.coverImage
                      ?.url,
                }
              : null
          );

          /* --------------------------------------------------
             Debug statuses
          -------------------------------------------------- */

          console.log(
            "Property statuses returned by API:",
            normalizedProperties.map(
              (property) => ({
                id:
                  property?._id ||
                  property?.id,

                title:
                  property?.title ||
                  property?.name,

                status:
                  property?.status,

                normalizedStatus:
                  normalizeStatus(
                    property?.status
                  ),
              })
            )
          );

          /* --------------------------------------------------
             Defensive filtering
          -------------------------------------------------- */

          let finalProperties =
            normalizedProperties;

          /*
           * Dedicated status filters.
           *
           * The backend should already return only the
           * requested status, but we enforce the rule again
           * on the frontend.
           */

          if (
            filter === "available"
          ) {

            finalProperties =
              normalizedProperties.filter(
                (property) =>
                  normalizeStatus(
                    property?.status
                  ) === "available"
              );

          }

          if (
            filter === "sold"
          ) {

            finalProperties =
              normalizedProperties.filter(
                (property) =>
                  normalizeStatus(
                    property?.status
                  ) === "sold"
              );

          }

          if (
            filter === "reserved"
          ) {

            finalProperties =
              normalizedProperties.filter(
                (property) =>
                  normalizeStatus(
                    property?.status
                  ) === "reserved"
              );

          }

          if (
            filter === "occupied"
          ) {

            finalProperties =
              normalizedProperties.filter(
                (property) =>
                  normalizeStatus(
                    property?.status
                  ) === "occupied"
              );

          }

          if (
            filter === "inactive"
          ) {

            finalProperties =
              normalizedProperties.filter(
                (property) =>
                  normalizeStatus(
                    property?.status
                  ) === "inactive"
              );

          }

          /*
           * Recommendations are intentionally not
           * frontend-filtered here.
           */

          console.log(
            `Final properties for filter "${filter}":`,
            finalProperties
          );

          /* --------------------------------------------------
             FINAL IMAGE DEBUG
          -------------------------------------------------- */

          console.log(
            "FINAL PROPERTY IMAGE PIPELINE:",
            finalProperties?.map(
              (property) => ({
                id:
                  property?._id,

                title:
                  property?.title,

                status:
                  property?.status,

                imageUrl:
                  property?.imageUrl,

                coverImageUrl:
                  property?.coverImage?.url,

                imageReady:
                  Boolean(
                    property?.imageUrl
                  ),
              })
            )
          );

          /* --------------------------------------------------
             Update main property state
          -------------------------------------------------- */

          setProperties(
            finalProperties
          );

          /* --------------------------------------------------
             Also update dedicated status state
          -------------------------------------------------- */

          if (
            filter === "reserved"
          ) {

            setReservedProperties(
              finalProperties
            );

          }

          if (
            filter === "occupied"
          ) {

            setOccupiedProperties(
              finalProperties
            );

          }

          if (
            filter === "inactive"
          ) {

            setInactiveProperties(
              finalProperties
            );

          }

        } catch (err) {

          console.error(
            "=================================================="
          );

          console.error(
            "PROPERTY FETCH ERROR"
          );

          console.error(
            "Endpoint:",
            endpoint
          );

          console.error(
            "Filter:",
            filter
          );

          console.error(
            "Error:",
            err
          );

          console.error(
            "Response:",
            err?.response?.data
          );

          console.error(
            "Status:",
            err?.response?.status
          );

          console.error(
            "=================================================="
          );

          const message =
            err?.response?.data?.message ||
            err?.response?.data?.error ||
            "Unable to load properties.";

          setError(
            message
          );

          setProperties(
            []
          );

          /* ----------------------------------------------
             Keep dedicated status state synchronized
          ---------------------------------------------- */

          if (
            filter === "reserved"
          ) {

            setReservedProperties(
              []
            );

            setReservedError(
              message
            );

          }

          if (
            filter === "occupied"
          ) {

            setOccupiedProperties(
              []
            );

            setOccupiedError(
              message
            );

          }

          if (
            filter === "inactive"
          ) {

            setInactiveProperties(
              []
            );

            setInactiveError(
              message
            );

          }

        } finally {

          setLoading(
            false
          );

        }

      },
      [
        endpoint,
        filter,
      ]
    );

  /* ========================================================
     FETCH RESERVED PROPERTIES
     --------------------------------------------------------
     GET /properties/reserved
  ======================================================== */

  const fetchReservedProperties =
    useCallback(
      async () => {

        console.log(
          "Fetching reserved properties..."
        );

        try {

          setReservedLoading(
            true
          );

          setReservedError(
            ""
          );

          const response =
            await axiosClient.get(
              "/properties/reserved",
              {
                headers: {
                  "Cache-Control":
                    "no-cache",

                  Pragma:
                    "no-cache",
                },

                params: {
                  _t: Date.now(),
                },
              }
            );

          console.log(
            "Reserved raw response:",
            response.data
          );

          const fetchedProperties =
            extractProperties(
              response.data
            );

          console.log(
            "Reserved extracted properties:",
            fetchedProperties
          );

          /* --------------------------------------------------
             Normalize images
          -------------------------------------------------- */

          const normalizedProperties =
            normalizeProperties(
              fetchedProperties
            );

          console.log(
            "Reserved IMAGE PIPELINE:",
            normalizedProperties?.map(
              (property) => ({
                id:
                  property?._id,

                title:
                  property?.title,

                status:
                  property?.status,

                coverImageUrl:
                  property?.coverImage?.url,

                imageUrl:
                  property?.imageUrl,

                imageReady:
                  Boolean(
                    property?.imageUrl
                  ),
              })
            )
          );

          const filteredProperties =
            normalizedProperties.filter(
              (property) =>
                normalizeStatus(
                  property?.status
                ) === "reserved"
            );

          console.log(
            "Reserved properties:",
            filteredProperties
          );

          setReservedProperties(
            filteredProperties
          );

          return filteredProperties;

        } catch (err) {

          console.error(
            "Failed to fetch reserved properties:",
            err
          );

          console.error(
            "Reserved response:",
            err?.response?.data
          );

          const message =
            err?.response?.data?.message ||
            err?.response?.data?.error ||
            "Unable to load reserved properties.";

          setReservedError(
            message
          );

          setReservedProperties(
            []
          );

          return [];

        } finally {

          setReservedLoading(
            false
          );

        }

      },
      []
    );

  /* ========================================================
     FETCH OCCUPIED PROPERTIES
     --------------------------------------------------------
     GET /properties/occupied
  ======================================================== */

  const fetchOccupiedProperties =
    useCallback(
      async () => {

        console.log(
          "Fetching occupied properties..."
        );

        try {

          setOccupiedLoading(
            true
          );

          setOccupiedError(
            ""
          );

          const response =
            await axiosClient.get(
              "/properties/occupied",
              {
                headers: {
                  "Cache-Control":
                    "no-cache",

                  Pragma:
                    "no-cache",
                },

                params: {
                  _t: Date.now(),
                },
              }
            );

          console.log(
            "Occupied raw response:",
            response.data
          );

          const fetchedProperties =
            extractProperties(
              response.data
            );

          const normalizedProperties =
            normalizeProperties(
              fetchedProperties
            );

          console.log(
            "Occupied IMAGE PIPELINE:",
            normalizedProperties?.map(
              (property) => ({
                id:
                  property?._id,

                title:
                  property?.title,

                coverImageUrl:
                  property?.coverImage?.url,

                imageUrl:
                  property?.imageUrl,
              })
            )
          );

          const filteredProperties =
            normalizedProperties.filter(
              (property) =>
                normalizeStatus(
                  property?.status
                ) === "occupied"
            );

          console.log(
            "Occupied properties:",
            filteredProperties
          );

          setOccupiedProperties(
            filteredProperties
          );

          return filteredProperties;

        } catch (err) {

          console.error(
            "Failed to fetch occupied properties:",
            err
          );

          console.error(
            "Occupied response:",
            err?.response?.data
          );

          const message =
            err?.response?.data?.message ||
            err?.response?.data?.error ||
            "Unable to load occupied properties.";

          setOccupiedError(
            message
          );

          setOccupiedProperties(
            []
          );

          return [];

        } finally {

          setOccupiedLoading(
            false
          );

        }

      },
      []
    );

  /* ========================================================
     FETCH INACTIVE PROPERTIES
     --------------------------------------------------------
     GET /properties/inactive
  ======================================================== */

  const fetchInactiveProperties =
    useCallback(
      async () => {

        console.log(
          "Fetching inactive properties..."
        );

        try {

          setInactiveLoading(
            true
          );

          setInactiveError(
            ""
          );

          const response =
            await axiosClient.get(
              "/properties/inactive",
              {
                headers: {
                  "Cache-Control":
                    "no-cache",

                  Pragma:
                    "no-cache",
                },

                params: {
                  _t: Date.now(),
                },
              }
            );

          console.log(
            "Inactive raw response:",
            response.data
          );

          const fetchedProperties =
            extractProperties(
              response.data
            );

          const normalizedProperties =
            normalizeProperties(
              fetchedProperties
            );

          console.log(
            "Inactive IMAGE PIPELINE:",
            normalizedProperties?.map(
              (property) => ({
                id:
                  property?._id,

                title:
                  property?.title,

                coverImageUrl:
                  property?.coverImage?.url,

                imageUrl:
                  property?.imageUrl,
              })
            )
          );

          const filteredProperties =
            normalizedProperties.filter(
              (property) =>
                normalizeStatus(
                  property?.status
                ) === "inactive"
            );

          console.log(
            "Inactive properties:",
            filteredProperties
          );

          setInactiveProperties(
            filteredProperties
          );

          return filteredProperties;

        } catch (err) {

          console.error(
            "Failed to fetch inactive properties:",
            err
          );

          console.error(
            "Inactive response:",
            err?.response?.data
          );

          const message =
            err?.response?.data?.message ||
            err?.response?.data?.error ||
            "Unable to load inactive properties.";

          setInactiveError(
            message
          );

          setInactiveProperties(
            []
          );

          return [];

        } finally {

          setInactiveLoading(
            false
          );

        }

      },
      []
    );

  /* ========================================================
     INITIAL LOAD
  ======================================================== */

  useEffect(() => {

    console.log(
      "useProperties useEffect fired."
    );

    fetchProperties();

  }, [
    fetchProperties,
  ]);

  /* ========================================================
     SEARCH
  ======================================================== */

  const searchProperties =
    useCallback(
      (query) => {

        /*
         * If search is empty, reload the original
         * dataset rather than trying to recover the
         * previous array.
         */

        if (
          !query ||
          !query.trim()
        ) {

          fetchProperties();

          return;

        }

        const normalizedQuery =
          query
            .trim()
            .toLowerCase();

        const filtered =
          properties.filter(
            (property) => {

              const title =
                String(
                  property?.title ||
                  property?.name ||
                  ""
                ).toLowerCase();

              const location =
                String(
                  property?.location ||
                  property?.address ||
                  ""
                ).toLowerCase();

              return (
                title.includes(
                  normalizedQuery
                ) ||
                location.includes(
                  normalizedQuery
                )
              );

            }
          );

        setProperties(
          filtered
        );

      },
      [
        properties,
        fetchProperties,
      ]
    );

  /* ========================================================
     STATUS FILTER
  ======================================================== */

  const filterByStatus =
    useCallback(
      (status) => {

        /*
         * "All" means reload the correct dataset
         * from the API.
         */

        if (
          !status ||
          normalizeStatus(
            status
          ) === "all"
        ) {

          fetchProperties();

          return;

        }

        const normalizedFilter =
          normalizeStatus(
            status
          );

        const filtered =
          properties.filter(
            (property) =>
              normalizeStatus(
                property?.status
              ) ===
              normalizedFilter
          );

        setProperties(
          filtered
        );

      },
      [
        properties,
        fetchProperties,
      ]
    );

  /* ========================================================
     REFRESH
  ======================================================== */

  const refreshProperties =
    useCallback(
      () => {

        console.log(
          "Refreshing properties..."
        );

        fetchProperties();

      },
      [
        fetchProperties,
      ]
    );

  /* ========================================================
     REFRESH RESERVED
  ======================================================== */

  const refreshReservedProperties =
    useCallback(
      () => {

        return fetchReservedProperties();

      },
      [
        fetchReservedProperties,
      ]
    );

  /* ========================================================
     REFRESH OCCUPIED
  ======================================================== */

  const refreshOccupiedProperties =
    useCallback(
      () => {

        return fetchOccupiedProperties();

      },
      [
        fetchOccupiedProperties,
      ]
    );

  /* ========================================================
     REFRESH INACTIVE
  ======================================================== */

  const refreshInactiveProperties =
    useCallback(
      () => {

        return fetchInactiveProperties();

      },
      [
        fetchInactiveProperties,
      ]
    );

  /* ========================================================
     RETURN
  ======================================================== */

  return {

    /* ------------------------------------------------------
       MAIN DATASET
    ------------------------------------------------------ */

    properties,

    loading,

    error,

    /* ------------------------------------------------------
       RESERVED
    ------------------------------------------------------ */

    reservedProperties,

    reservedLoading,

    reservedError,

    fetchReservedProperties,

    refreshReservedProperties,

    /* ------------------------------------------------------
       OCCUPIED
    ------------------------------------------------------ */

    occupiedProperties,

    occupiedLoading,

    occupiedError,

    fetchOccupiedProperties,

    refreshOccupiedProperties,

    /* ------------------------------------------------------
       INACTIVE
    ------------------------------------------------------ */

    inactiveProperties,

    inactiveLoading,

    inactiveError,

    fetchInactiveProperties,

    refreshInactiveProperties,

    /* ------------------------------------------------------
       GENERAL ACTIONS
    ------------------------------------------------------ */

    refreshProperties,

    searchProperties,

    filterByStatus,

  };

};

export default useProperties;

