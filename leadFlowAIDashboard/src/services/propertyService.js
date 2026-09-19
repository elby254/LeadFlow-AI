/**
 * ==========================================================
 *
 * Central API service for the LeadFlow AI Properties Module.
 *
 * Agent Workflow Alignment
 * ----------------------------------------------------------
 *
 * Leads
 *   ↓
 * Conversations
 *   ↓
 * Qualification
 *   ↓
 * Property Matching
 *   ↓
 * Viewings
 *   ↓
 * Follow-ups
 *   ↓
 * Negotiation / Conversion
 *
 * This service provides property operations required
 * by the Agent and Viewer workspaces while keeping
 * authorization on the backend.
 *
 * ==========================================================
 */

import axiosClient from "../api/axiosClient";
import getPropertyImageUrl from "../utils/propertyImage";


/* ==========================================================
   HELPERS
========================================================== */

/**
 * Extract the backend `data` property safely.
 *
 * Expected backend response:
 *
 * {
 *   success: true,
 *   data: ...
 * }
 */
const extractData = (
  response,
  fallback = null
) => {

  return (
    response?.data?.data ??
    fallback
  );

};


/* ==========================================================
   PROPERTY IMAGE NORMALIZATION
========================================================== */

/**
 * Normalize one property.
 *
 * The rest of the application can therefore consistently
 * use:
 *
 * property.imageUrl
 *
 * regardless of whether the backend stores:
 *
 * • coverImage
 * • image
 * • images
 * • imageUrl
 */
const normalizeProperty = (
  property
) => {

  if (!property) {
    return property;
  }

  return {
    ...property,

    imageUrl:
      getPropertyImageUrl(
        property
      ),
  };

};


/**
 * Normalize an array of properties.
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
    normalizeProperty
  );

};


/**
 * Normalize property response data.
 */
const normalizePropertyData = (
  data
) => {

  if (
    Array.isArray(
      data
    )
  ) {
    return normalizeProperties(
      data
    );
  }


  if (
    data &&
    typeof data === "object" &&
    (
      data.coverImage !== undefined ||
      data.image !== undefined ||
      data.imageUrl !== undefined ||
      data.title !== undefined ||
      data._id !== undefined
    )
  ) {
    return normalizeProperty(
      data
    );
  }


  return data;

};


/**
 * Extract and normalize property data.
 */
const extractPropertyData = (
  response,
  fallback = null
) => {

  const data =
    extractData(
      response,
      fallback
    );

  return normalizePropertyData(
    data
  );

};


/* ==========================================================
   PROPERTY ID HELPER
========================================================== */

/**
 * Safely obtain a property ID.
 *
 * Supports:
 *
 * property._id
 * property.id
 * populated saved-property objects
 */
const getPropertyId = (
  property
) => {

  if (!property) {
    return null;
  }


  if (
    property._id
  ) {
    return String(
      property._id
    );
  }


  if (
    property.id
  ) {
    return String(
      property.id
    );
  }


  /**
   * Support populated structures such as:
   *
   * {
   *   property: {
   *     _id: "..."
   *   }
   * }
   */
  if (
    property.property?._id
  ) {
    return String(
      property.property._id
    );
  }


  if (
    property.property?.id
  ) {
    return String(
      property.property.id
    );
  }


  return null;

};


/* ==========================================================
   SAVED PROPERTY STORAGE
========================================================== */

/**
 * Existing Viewer save architecture.
 *
 * PropertyDetails currently stores saved IDs using:
 *
 * localStorage.setItem(
 *   "leadflowai_saved_properties",
 *   JSON.stringify(savedIds)
 * )
 *
 * We intentionally use the same storage key here.
 */
const SAVED_PROPERTIES_STORAGE_KEY =
  "leadflowai_saved_properties";


/**
 * Read saved property IDs.
 */
const getSavedPropertyIds = () => {

  try {

    const raw =
      localStorage.getItem(
        SAVED_PROPERTIES_STORAGE_KEY
      );


    if (!raw) {
      return [];
    }


    const parsed =
      JSON.parse(
        raw
      );


    if (
      !Array.isArray(
        parsed
      )
    ) {
      return [];
    }


    return parsed
      .map(
        (item) => {

          if (
            typeof item === "string" ||
            typeof item === "number"
          ) {
            return String(
              item
            );
          }


          return getPropertyId(
            item
          );

        }
      )
      .filter(
        Boolean
      );

  } catch (error) {

    console.error(
      "[propertyService] Failed to read saved property IDs:",
      error
    );

    return [];

  }

};


/**
 * Save property IDs back to localStorage.
 */
const setSavedPropertyIds = (
  propertyIds
) => {

  try {

    const normalizedIds =
      Array.isArray(
        propertyIds
      )
        ? [
            ...new Set(
              propertyIds
                .filter(
                  Boolean
                )
                .map(
                  (id) =>
                    String(id)
                )
            ),
          ]
        : [];


    localStorage.setItem(
      SAVED_PROPERTIES_STORAGE_KEY,
      JSON.stringify(
        normalizedIds
      )
    );


    return normalizedIds;

  } catch (error) {

    console.error(
      "[propertyService] Failed to save property IDs:",
      error
    );

    throw error;

  }

};


/* ==========================================================
   GET ALL PROPERTIES
========================================================== */

/**
 * GET /api/properties
 */
export const getProperties = async (
  params = {}
) => {

  const response =
    await axiosClient.get(
      "/properties",
      {
        params,
      }
    );


  return extractPropertyData(
    response,
    []
  );

};


/* ==========================================================
   BACKWARDS COMPATIBILITY
========================================================== */

export const getAllProperties = async (
  params = {}
) => {

  return getProperties(
    params
  );

};


/* ==========================================================
   FEATURED PROPERTIES
========================================================== */

/**
 * ==========================================================
 * GET FEATURED PROPERTIES
 * ==========================================================
 *
 * Viewer / Landing-page property discovery.
 *
 * Expected endpoint:
 *
 * GET /api/properties/featured
 *
 * The backend should return:
 *
 * {
 *   success: true,
 *   data: [...]
 * }
 *
 * The response is normalized through the same property
 * image architecture used throughout LeadFlow AI.
 */
export const getFeaturedProperties = async (
  params = {}
) => {

  try {

    console.log(
      "[propertyService] Loading featured properties..."
    );


    const response =
      await axiosClient.get(
        "/properties/featured",
        {
          params,
        }
      );


    const data =
      extractPropertyData(
        response,
        []
      );


    /**
     * Keep the service response compatible with components
     * that use:
     *
     * featuredResponse?.data
     *
     * as well as components that directly expect an array.
     */
    const normalizedProperties =
      Array.isArray(
        data
      )
        ? data
        : Array.isArray(
            data?.data
          )
          ? data.data
          : [];


    console.log(
      "[propertyService] Featured properties loaded:",
      normalizedProperties
    );


    return {
      ...(
        response?.data ??
        {}
      ),

      data:
        normalizedProperties,

    };

  } catch (error) {

    console.error(
      "[propertyService] getFeaturedProperties error:",
      error
    );


    /**
     * Return a safe empty response rather than causing the
     * Viewer landing page to crash.
     */
    return {
      success:
        false,

      data:
        [],

      message:
        error?.response?.data?.message ??
        "Failed to load featured properties.",

    };

  }

};


/* ==========================================================
   AGENT PROPERTIES
========================================================== */

/**
 * Get properties assigned to the authenticated agent.
 */
export const getMyProperties = async (
  params = {}
) => {

  try {

    const response =
      await axiosClient.get(
        "/properties",
        {
          params: {
            ...params,
            assignedAgent: "me",
          },
        }
      );


    return extractPropertyData(
      response,
      []
    );

  } catch (error) {

    console.error(
      "getMyProperties error:",
      error
    );

    return [];

  }

};


/* ==========================================================
   GET PROPERTY BY ID
========================================================== */

/**
 * GET /api/properties/:id
 *
 * Shared property-details endpoint.
 *
 * Used by:
 *
 * • Admin
 * • Agent
 * • Viewer
 */
export const getPropertyById = async (
  id
) => {

  if (!id) {

    throw new Error(
      "Property ID is required."
    );

  }


  const response =
    await axiosClient.get(
      `/properties/${id}`
    );


  return extractPropertyData(
    response,
    {}
  );

};


/* ==========================================================
   SAVED PROPERTIES
========================================================== */

/**
 * ==========================================================
 * GET SAVED PROPERTIES
 * ==========================================================
 *
 * Viewer workflow:
 *
 * PropertyDetails
 *       ↓
 * Save property ID
 *       ↓
 * localStorage
 *       ↓
 * Saved Properties page
 *       ↓
 * Fetch complete property records
 *
 * IMPORTANT
 * ----------------------------------------------------------
 *
 * The existing PropertyDetails implementation stores only
 * property IDs locally.
 *
 * Therefore this method:
 *
 * 1. Reads the saved property IDs.
 * 2. Fetches each real property through:
 *
 *      GET /api/properties/:propertyId
 *
 * 3. Returns complete normalized property objects.
 *
 * This means SavedProperties.jsx receives actual property
 * details rather than only IDs.
 */
export const getSavedProperties = async (
  params = {}
) => {

  const {
    page = 1,
    limit = 12,
    propertyType = "",
    location = "",
  } = params;


  console.log(
    "[propertyService] Loading saved property IDs..."
  );


  const savedIds =
    getSavedPropertyIds();


  console.log(
    "[propertyService] Saved property IDs:",
    savedIds
  );


  if (
    savedIds.length === 0
  ) {

    console.log(
      "[propertyService] No saved properties found."
    );


    return {
      properties: [],
      data: [],
      pagination: {
        page: 1,
        limit,
        total: 0,
        totalPages: 0,
        hasNextPage: false,
        hasPreviousPage: false,
      },
      total: 0,
    };

  }


  /**
   * --------------------------------------------------------
   * FETCH ALL SAVED PROPERTY RECORDS
   * --------------------------------------------------------
   */
  const results =
    await Promise.allSettled(
      savedIds.map(
        async (propertyId) => {

          try {

            const property =
              await getPropertyById(
                propertyId
              );


            if (
              !property ||
              typeof property !== "object"
            ) {

              console.warn(
                "[propertyService] Invalid saved property response:",
                propertyId
              );

              return null;

            }


            return normalizeProperty(
              property
            );

          } catch (error) {

            console.warn(
              "[propertyService] Failed to load saved property:",
              propertyId,
              error
            );

            return null;

          }

        }
      )
    );


  /**
   * --------------------------------------------------------
   * KEEP SUCCESSFUL RECORDS
   * --------------------------------------------------------
   */
  let properties =
    results
      .map(
        (result) =>
          result.status ===
          "fulfilled"
            ? result.value
            : null
      )
      .filter(
        Boolean
      );


  console.log(
    "[propertyService] Loaded saved property records:",
    properties
  );


  /* ========================================================
     PROPERTY TYPE FILTER
  ======================================================== */

  if (
    propertyType &&
    String(
      propertyType
    ).trim()
  ) {

    const normalizedType =
      String(
        propertyType
      )
        .trim()
        .toLowerCase();


    properties =
      properties.filter(
        (property) => {

          const type =
            String(
              property?.propertyType ??
              property?.type ??
              ""
            )
              .trim()
              .toLowerCase();


          return (
            type ===
            normalizedType
          );

        }
      );

  }


  /* ========================================================
     LOCATION FILTER
  ======================================================== */

  if (
    location &&
    String(
      location
    ).trim()
  ) {

    const normalizedLocation =
      String(
        location
      )
        .trim()
        .toLowerCase();


    properties =
      properties.filter(
        (property) => {

          const locationValues = [

            property?.location,

            property?.address,

            property?.city,

            property?.county,

            property?.estate,

            property?.neighborhood,

            property?.area,

            property?.town,

            property?.location?.name,

            property?.location?.address,

            property?.location?.city,

            property?.location?.county,

            property?.location?.estate,

          ];


          const searchableLocation =
            locationValues
              .filter(
                (value) =>
                  value !==
                    undefined &&
                  value !==
                    null
              )
              .map(
                (value) =>
                  String(
                    value
                  )
              )
              .join(
                " "
              )
              .toLowerCase();


          return searchableLocation.includes(
            normalizedLocation
          );

        }
      );

  }


  /* ========================================================
     SORT
  ======================================================== */

  const orderMap =
    new Map(
      savedIds.map(
        (id, index) => [
          String(id),
          index,
        ]
      )
    );


  properties.sort(
    (a, b) => {

      const aIndex =
        orderMap.get(
          String(
            getPropertyId(a)
          )
        ) ??
        Number.MAX_SAFE_INTEGER;


      const bIndex =
        orderMap.get(
          String(
            getPropertyId(b)
          )
        ) ??
        Number.MAX_SAFE_INTEGER;


      return (
        aIndex -
        bIndex
      );

    }
  );


  /* ========================================================
     PAGINATION
  ======================================================== */

  const safeLimit =
    Math.max(
      Number(limit) || 12,
      1
    );


  const safePage =
    Math.max(
      Number(page) || 1,
      1
    );


  const total =
    properties.length;


  const totalPages =
    total === 0
      ? 0
      : Math.ceil(
          total /
            safeLimit
        );


  const currentPage =
    totalPages === 0
      ? 1
      : Math.min(
          safePage,
          totalPages
        );


  const startIndex =
    (
      currentPage -
      1
    ) *
    safeLimit;


  const endIndex =
    startIndex +
    safeLimit;


  const paginatedProperties =
    properties.slice(
      startIndex,
      endIndex
    );


  const result = {

    properties:
      paginatedProperties,

    data:
      paginatedProperties,

    pagination: {

      page:
        currentPage,

      limit:
        safeLimit,

      total,

      totalPages,

      hasNextPage:
        currentPage <
        totalPages,

      hasPreviousPage:
        currentPage >
        1,

    },

    total,

  };


  console.log(
    "[propertyService] Saved properties result:",
    result
  );


  return result;

};


/* ==========================================================
   SEARCH SAVED PROPERTIES
========================================================== */

/**
 * Search only within the Viewer saved-property collection.
 */
export const searchSavedProperties = async (
  params = {}
) => {

  const {
    search = "",
    propertyType = "",
    location = "",
    page = 1,
    limit = 12,
  } = params;


  console.log(
    "[propertyService] Searching saved properties:",
    {
      search,
      propertyType,
      location,
      page,
      limit,
    }
  );


  /**
   * Load the saved properties first.
   */
  const result =
    await getSavedProperties({
      page: 1,
      limit: 9999,
      propertyType,
      location,
    });


  let properties =
    Array.isArray(
      result?.properties
    )
      ? result.properties
      : [];


  /* ========================================================
     GENERAL SEARCH
  ======================================================== */

  if (
    search &&
    String(
      search
    ).trim()
  ) {

    const normalizedSearch =
      String(
        search
      )
        .trim()
        .toLowerCase();


    properties =
      properties.filter(
        (property) => {

          const searchableValues = [

            property?.title,

            property?.name,

            property?.description,

            property?.propertyType,

            property?.type,

            property?.location,

            property?.address,

            property?.city,

            property?.county,

            property?.estate,

            property?.neighborhood,

            property?.area,

            property?.town,

            property?.status,

          ];


          const searchableText =
            searchableValues
              .filter(
                (value) =>
                  value !==
                    undefined &&
                  value !==
                    null
              )
              .map(
                (value) =>
                  String(
                    value
                  )
              )
              .join(
                " "
              )
              .toLowerCase();


          return searchableText.includes(
            normalizedSearch
          );

        }
      );

  }


  /* ========================================================
     PAGINATION
  ======================================================== */

  const total =
    properties.length;


  const safeLimit =
    Math.max(
      Number(limit) || 12,
      1
    );


  const safePage =
    Math.max(
      Number(page) || 1,
      1
    );


  const totalPages =
    total === 0
      ? 0
      : Math.ceil(
          total /
            safeLimit
        );


  const currentPage =
    totalPages === 0
      ? 1
      : Math.min(
          safePage,
          totalPages
        );


  const startIndex =
    (
      currentPage -
      1
    ) *
    safeLimit;


  const paginatedProperties =
    properties.slice(
      startIndex,
      startIndex +
        safeLimit
    );


  const response = {

    properties:
      paginatedProperties,

    data:
      paginatedProperties,

    pagination: {

      page:
        currentPage,

      limit:
        safeLimit,

      total,

      totalPages,

      hasNextPage:
        currentPage <
        totalPages,

      hasPreviousPage:
        currentPage >
        1,

    },

    total,

  };


  console.log(
    "[propertyService] Saved property search result:",
    response
  );


  return response;

};


/* ==========================================================
   REMOVE SAVED PROPERTY
========================================================== */

/**
 * Remove a saved property from localStorage.
 */
export const removeSavedProperty = async (
  propertyId
) => {

  if (!propertyId) {

    throw new Error(
      "Property ID is required."
    );

  }


  const normalizedId =
    String(
      propertyId
    );


  console.log(
    "[propertyService] Removing saved property:",
    normalizedId
  );


  const savedIds =
    getSavedPropertyIds();


  const updatedIds =
    savedIds.filter(
      (id) =>
        String(id) !==
        normalizedId
    );


  setSavedPropertyIds(
    updatedIds
  );


  console.log(
    "[propertyService] Updated saved property IDs:",
    updatedIds
  );


  return {

    success:
      true,

    propertyId:
      normalizedId,

    removed:
      savedIds.length !==
      updatedIds.length,

    savedPropertyIds:
      updatedIds,

  };

};


/* ==========================================================
   CREATE PROPERTY
========================================================== */

/**
 * POST /api/properties
 *
 * Administrative operation.
 */
export const createProperty = async (
  propertyData
) => {

  if (!propertyData) {

    throw new Error(
      "Property data is required."
    );

  }


  const response =
    await axiosClient.post(
      "/properties",
      propertyData
    );


  return extractPropertyData(
    response,
    {}
  );

};


/* ==========================================================
   UPDATE PROPERTY
========================================================== */

/**
 * PUT /api/properties/:id
 */
export const updateProperty = async (
  id,
  propertyData
) => {

  if (!id) {

    throw new Error(
      "Property ID is required."
    );

  }


  if (!propertyData) {

    throw new Error(
      "Property data is required."
    );

  }


  const response =
    await axiosClient.put(
      `/properties/${id}`,
      propertyData
    );


  return extractPropertyData(
    response,
    {}
  );

};


/* ==========================================================
   ARCHIVE PROPERTY
========================================================== */

export const archiveProperty = async (
  id
) => {

  if (!id) {

    throw new Error(
      "Property ID is required."
    );

  }


  const response =
    await axiosClient.patch(
      `/properties/${id}/archive`
    );


  return extractPropertyData(
    response,
    {}
  );

};


/* ==========================================================
   RESTORE PROPERTY
========================================================== */

export const restoreProperty = async (
  id
) => {

  if (!id) {

    throw new Error(
      "Property ID is required."
    );

  }


  const response =
    await axiosClient.patch(
      `/properties/${id}/restore`
    );


  return extractPropertyData(
    response,
    {}
  );

};


/* ==========================================================
   DELETE PROPERTY
========================================================== */

export const deleteProperty = async (
  id
) => {

  if (!id) {

    throw new Error(
      "Property ID is required."
    );

  }


  const response =
    await axiosClient.delete(
      `/properties/${id}`
    );


  return response?.data ?? {};

};


/* ==========================================================
   AVAILABLE PROPERTIES
========================================================== */

export const getAvailableProperties = async (
  params = {}
) => {

  const response =
    await axiosClient.get(
      "/properties/available",
      {
        params,
      }
    );


  return extractPropertyData(
    response,
    []
  );

};


/* ==========================================================
   SOLD PROPERTIES
========================================================== */

export const getSoldProperties = async (
  params = {}
) => {

  const response =
    await axiosClient.get(
      "/properties/sold",
      {
        params,
      }
    );


  return extractPropertyData(
    response,
    []
  );

};


/* ==========================================================
   RESERVED PROPERTIES
========================================================== */

export const getReservedProperties = async (
  params = {}
) => {

  const response =
    await axiosClient.get(
      "/properties/reserved",
      {
        params,
      }
    );


  return extractPropertyData(
    response,
    []
  );

};


/* ==========================================================
   OCCUPIED PROPERTIES
========================================================== */

export const getOccupiedProperties = async (
  params = {}
) => {

  const response =
    await axiosClient.get(
      "/properties/occupied",
      {
        params,
      }
    );


  return extractPropertyData(
    response,
    []
  );

};


/* ==========================================================
   INACTIVE PROPERTIES
========================================================== */

export const getInactiveProperties = async (
  params = {}
) => {

  const response =
    await axiosClient.get(
      "/properties/inactive",
      {
        params,
      }
    );


  return extractPropertyData(
    response,
    []
  );

};


/* ==========================================================
   PROPERTY DASHBOARD
========================================================== */

export const getPropertyDashboard = async () => {

  const response =
    await axiosClient.get(
      "/properties/dashboard"
    );


  return extractData(
    response,
    {}
  );

};


/* ==========================================================
   INVENTORY
========================================================== */

export const getInventoryStatus = async () => {

  const response =
    await axiosClient.get(
      "/properties/inventory"
    );


  return extractData(
    response,
    {}
  );

};


/* ==========================================================
   NEW LISTINGS
========================================================== */

export const getNewListings = async (
  params = {}
) => {

  const response =
    await axiosClient.get(
      "/properties/new",
      {
        params,
      }
    );


  return extractPropertyData(
    response,
    []
  );

};


/* ==========================================================
   AI PROPERTY RECOMMENDATIONS
========================================================== */

/**
 * General:
 *
 * GET /api/properties/recommendations
 *
 * Lead-specific:
 *
 * GET /api/properties/recommendations/:leadId
 */
export const getRecommendations = async (
  leadId = null,
  params = {}
) => {

  const endpoint =
    leadId
      ? `/properties/recommendations/${leadId}`
      : "/properties/recommendations";


  const response =
    await axiosClient.get(
      endpoint,
      {
        params,
      }
    );


  return extractPropertyData(
    response,
    []
  );

};


/* ==========================================================
   SEARCH ALL PROPERTIES
========================================================== */

export const searchProperties = async (
  query,
  params = {}
) => {

  if (!query) {

    throw new Error(
      "Search query is required."
    );

  }


  const response =
    await axiosClient.get(
      "/properties/search",
      {
        params: {

          ...params,

          q:
            query,

        },
      }
    );


  return extractPropertyData(
    response,
    []
  );

};


/* ==========================================================
   PROPERTY MATCHING
========================================================== */

export const getPropertyMatches = async (
  params = {}
) => {

  const response =
    await axiosClient.get(
      "/properties/matches",
      {
        params,
      }
    );


  return extractPropertyData(
    response,
    []
  );

};


/* ==========================================================
   PROPERTY STATISTICS
========================================================== */

export const getPropertyStatistics = async (
  params = {}
) => {

  const response =
    await axiosClient.get(
      "/properties/statistics",
      {
        params,
      }
    );


  return extractData(
    response,
    {}
  );

};


/* ==========================================================
   PROPERTY SETTINGS
========================================================== */

export const getPropertySettings = async () => {

  const response =
    await axiosClient.get(
      "/properties/settings"
    );


  return extractData(
    response,
    {}
  );

};


/* ==========================================================
   SETTINGS BACKWARDS COMPATIBILITY
========================================================== */

export const getPropertiesSettings = async () => {

  return getPropertySettings();

};


/* ==========================================================
   DEFAULT SERVICE
========================================================== */

const propertyService = {

  /* --------------------------------------------------------
     GENERAL PROPERTY ACCESS
  -------------------------------------------------------- */

  getProperties,

  getAllProperties,

  getPropertyById,


  /* --------------------------------------------------------
     FEATURED PROPERTIES
  -------------------------------------------------------- */

  getFeaturedProperties,


  /* --------------------------------------------------------
     SAVED PROPERTIES / VIEWER
  -------------------------------------------------------- */

  getSavedProperties,

  searchSavedProperties,

  removeSavedProperty,


  /* --------------------------------------------------------
     AGENT WORKFLOW
  -------------------------------------------------------- */

  getMyProperties,

  getAvailableProperties,

  getNewListings,


  /* --------------------------------------------------------
     PROPERTY MATCHING
  -------------------------------------------------------- */

  getRecommendations,

  getPropertyMatches,

  searchProperties,


  /* --------------------------------------------------------
     PROPERTY STATUS
  -------------------------------------------------------- */

  getSoldProperties,

  getReservedProperties,

  getOccupiedProperties,

  getInactiveProperties,


  /* --------------------------------------------------------
     ADMIN PROPERTY MANAGEMENT
  -------------------------------------------------------- */

  createProperty,

  updateProperty,

  archiveProperty,

  restoreProperty,

  deleteProperty,


  /* --------------------------------------------------------
     ADMIN PROPERTY ANALYTICS
  -------------------------------------------------------- */

  getPropertyDashboard,

  getInventoryStatus,

  getPropertyStatistics,


  /* --------------------------------------------------------
     ADMIN SETTINGS
  -------------------------------------------------------- */

  getPropertySettings,

  getPropertiesSettings,

};


/* ==========================================================
   DEFAULT EXPORT
========================================================== */

export default propertyService;