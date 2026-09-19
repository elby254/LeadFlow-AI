/**
 * =========================================================
 * AVAILABLE PROPERTIES
 * =========================================================
 *
 * Path
 * ----
 * src/pages/properties/availableProperties.jsx
 *
 * Route
 * -----
 * /viewer/properties
 *
 * Purpose
 * -------
 * Viewer property discovery and browsing page.
 *
 * Responsibilities
 * ----------------
 * ✓ Browse available properties
 * ✓ Search properties
 * ✓ Filter by location
 * ✓ Filter by property type
 * ✓ Filter by price
 * ✓ Filter by bedrooms
 * ✓ Filter by status
 * ✓ Display property cards
 * ✓ Display canonical cover images
 * ✓ Open property details
 * ✓ Save / unsave properties
 * ✓ Pagination
 * ✓ Loading state
 * ✓ Empty state
 * ✓ Error state
 *
 * Architecture
 * ------------
 * This page REUSES the existing property architecture.
 *
 * Property lifecycle source of truth:
 *
 *     property.status
 *
 * Available property:
 *
 *     status === "available"
 *
 * Cover image:
 *
 *     property.coverImage
 *
 * No second Property model or duplicate
 * property service is created here.
 *
 * =========================================================
 */

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  AlertCircle,
  BedDouble,
  ChevronLeft,
  ChevronRight,
  Filter,
  Heart,
  Home,
  MapPin,
  RefreshCw,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";

import { useNavigate } from "react-router-dom";

import propertyService from "../../services/propertyService";

/*
============================================================
CONSTANTS
============================================================
*/

const PROPERTY_TYPES = [
  "Apartment",
  "Bedsitter",
  "Studio",
  "Maisonette",
  "House",
  "Villa",
  "Commercial",
  "Office",
  "Land",
];

const STATUS_OPTIONS = [
  {
    value: "available",
    label: "Available",
  },
  {
    value: "reserved",
    label: "Reserved",
  },
  {
    value: "sold",
    label: "Sold",
  },
  {
    value: "occupied",
    label: "Occupied",
  },
  {
    value: "inactive",
    label: "Inactive",
  },
];

const BEDROOM_OPTIONS = [
  {
    value: "",
    label: "Any bedrooms",
  },
  {
    value: "0",
    label: "Bedsitter / 0",
  },
  {
    value: "1",
    label: "1+ bedroom",
  },
  {
    value: "2",
    label: "2+ bedrooms",
  },
  {
    value: "3",
    label: "3+ bedrooms",
  },
  {
    value: "4",
    label: "4+ bedrooms",
  },
  {
    value: "5",
    label: "5+ bedrooms",
  },
];

const DEFAULT_FILTERS = {
  location: "",
  propertyType: "",
  minPrice: "",
  maxPrice: "",
  bedrooms: "",
  status: "available",
};

/*
============================================================
HELPERS
============================================================
*/

/**
 * Safely unwrap different response structures used by
 * existing property service methods.
 *
 * Supported examples:
 *
 * response.data
 *
 * response.data.data
 *
 * response.data.properties
 *
 * response.properties
 */
const extractPropertyData = (response) => {
  const payload = response?.data ?? response;

  if (Array.isArray(payload)) {
    return {
      properties: payload,
      pagination: null,
    };
  }

  if (Array.isArray(payload?.properties)) {
    return {
      properties: payload.properties,
      pagination:
        payload.pagination ||
        payload.meta ||
        null,
    };
  }

  if (Array.isArray(payload?.data)) {
    return {
      properties: payload.data,
      pagination:
        payload.pagination ||
        payload.meta ||
        null,
    };
  }

  return {
    properties: [],
    pagination: payload?.pagination || payload?.meta || null,
  };
};

/**
 * Extract the MongoDB identifier safely.
 *
 * Your backend uses:
 *
 *     _id
 *
 * but some existing frontend components may still use:
 *
 *     id
 */
const getPropertyId = (property) => {
  if (!property) return null;

  return (
    property._id ||
    property.id ||
    property.propertyId ||
    null
  );
};

/**
 * Resolve a canonical PropertyImage reference.
 *
 * The backend may return coverImage as:
 *
 * 1. populated object
 * 2. URL string
 * 3. object containing url
 * 4. object containing imageUrl
 * 5. object containing secureUrl
 *
 * This helper keeps the page compatible with the
 * existing property image architecture.
 */
const getCoverImage = (property) => {
  if (!property) return null;

  const coverImage = property.coverImage;

  if (!coverImage) {
    /*
     * Some existing API responses may expose the resolved
     * image separately.
     */
    return (
      property.coverImageUrl ||
      property.imageUrl ||
      property.primaryImage ||
      property.thumbnail ||
      null
    );
  }

  if (typeof coverImage === "string") {
    return coverImage;
  }

  if (typeof coverImage === "object") {
    return (
      coverImage.url ||
      coverImage.imageUrl ||
      coverImage.secureUrl ||
      coverImage.src ||
      coverImage.path ||
      null
    );
  }

  return null;
};

/**
 * Format property price without assuming a fixed currency.
 */
const formatPrice = (property) => {
  const price = Number(property?.price);

  if (!Number.isFinite(price)) {
    return "Price unavailable";
  }

  const currency = property?.currency || "KES";

  try {
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(price);
  } catch {
    return `${currency} ${price.toLocaleString()}`;
  }
};

/**
 * Format date-independent status text.
 */
const formatStatus = (status) => {
  if (!status) return "Unknown";

  return String(status)
    .charAt(0)
    .toUpperCase() +
    String(status).slice(1);
};

/**
 * Determine whether a property is saved.
 *
 * Supports common existing frontend naming without
 * changing the backend model.
 */
const isPropertySaved = (property, savedProperties) => {
  const id = getPropertyId(property);

  if (!id) return false;

  return savedProperties.has(String(id));
};

/*
============================================================
PROPERTY CARD
============================================================
*/

const ViewerPropertyCard = ({
  property,
  saved,
  saving,
  onOpen,
  onToggleSave,
}) => {
  const coverImage = getCoverImage(property);

  const title =
    property?.title ||
    "Untitled Property";

  const location =
    property?.location ||
    property?.estate ||
    property?.city ||
    "Location unavailable";

  const bedrooms =
    Number.isFinite(Number(property?.bedrooms))
      ? Number(property.bedrooms)
      : 0;

  const propertyType =
    property?.propertyType ||
    "Property";

  const status =
    property?.status ||
    "available";

  return (
    <article className="group overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
      {/* ====================================================
          IMAGE
      ==================================================== */}

      <div className="relative aspect-[16/10] overflow-hidden bg-gray-100">
        {coverImage ? (
          <img
            src={coverImage}
            alt={title}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
            loading="lazy"
            onError={(event) => {
              event.currentTarget.style.display = "none";
            }}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <div className="text-center text-gray-400">
              <Home className="mx-auto h-10 w-10" />

              <p className="mt-2 text-sm">
                No cover image
              </p>
            </div>
          </div>
        )}

        {/* ==================================================
            STATUS
        ================================================== */}

        <div className="absolute left-3 top-3">
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold shadow-sm ${
              status === "available"
                ? "bg-white text-green-700"
                : "bg-white text-gray-700"
            }`}
          >
            {formatStatus(status)}
          </span>
        </div>

        {/* ==================================================
            SAVE
        ================================================== */}

        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onToggleSave(property);
          }}
          disabled={saving}
          aria-label={
            saved
              ? `Remove ${title} from saved properties`
              : `Save ${title}`
          }
          className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/95 shadow-sm transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Heart
            className={`h-5 w-5 ${
              saved
                ? "fill-current text-red-500"
                : "text-gray-600"
            }`}
          />
        </button>
      </div>

      {/* ====================================================
          CONTENT
      ==================================================== */}

      <div className="p-5">
        <div className="mb-2 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="line-clamp-1 text-lg font-semibold text-gray-900">
              {title}
            </h3>

            <div className="mt-1 flex items-center gap-1.5 text-sm text-gray-500">
              <MapPin className="h-4 w-4 shrink-0" />

              <span className="line-clamp-1">
                {location}
              </span>
            </div>
          </div>
        </div>

        {/* ==================================================
            PROPERTY META
        ================================================== */}

        <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-600">
          <span className="inline-flex items-center gap-1.5">
            <Home className="h-4 w-4" />

            {propertyType}
          </span>

          <span className="inline-flex items-center gap-1.5">
            <BedDouble className="h-4 w-4" />

            {bedrooms === 0
              ? "0 bedrooms"
              : `${bedrooms} ${
                  bedrooms === 1
                    ? "bedroom"
                    : "bedrooms"
                }`}
          </span>

          {Number(property?.bathrooms) > 0 && (
            <span>
              {property.bathrooms}{" "}
              {Number(property.bathrooms) === 1
                ? "bath"
                : "baths"}
            </span>
          )}
        </div>

        {/* ==================================================
            PRICE
        ================================================== */}

        <div className="mb-4">
          <p className="text-xl font-bold text-gray-900">
            {formatPrice(property)}
          </p>

          {property?.paymentType === "rent" && (
            <p className="text-xs text-gray-500">
              Rental property
            </p>
          )}
        </div>

        {/* ==================================================
            DETAILS BUTTON
        ================================================== */}

        <button
          type="button"
          onClick={() => onOpen(property)}
          className="w-full rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
        >
          View Property
        </button>
      </div>
    </article>
  );
};

/*
============================================================
MAIN PAGE
============================================================
*/

const AvailableProperties = () => {
  const navigate = useNavigate();

  /*
  ==========================================================
  PROPERTIES
  ==========================================================
  */

  const [properties, setProperties] = useState([]);

  /*
  ==========================================================
  LOADING / ERROR
  ==========================================================
  */

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  /*
  ==========================================================
  SEARCH
  ==========================================================
  */

  const [search, setSearch] = useState("");

  /*
  ==========================================================
  FILTERS
  ==========================================================
  */

  const [filters, setFilters] =
    useState(DEFAULT_FILTERS);

  const [showFilters, setShowFilters] =
    useState(false);

  /*
  ==========================================================
  PAGINATION
  ==========================================================
  */

  const [page, setPage] = useState(1);

  const [pagination, setPagination] =
    useState(null);

  const [totalPages, setTotalPages] =
    useState(1);

  /*
  ==========================================================
  SAVED PROPERTIES
  ==========================================================
  */

  const [savedProperties, setSavedProperties] =
    useState(() => {
      try {
        const stored =
          localStorage.getItem(
            "leadflowai_saved_properties"
          );

        if (!stored) {
          return new Set();
        }

        const parsed = JSON.parse(stored);

        return new Set(
          Array.isArray(parsed)
            ? parsed.map(String)
            : []
        );
      } catch {
        return new Set();
      }
    });

  const [savingPropertyId, setSavingPropertyId] =
    useState(null);

  /*
  ==========================================================
  PAGE SIZE
  ==========================================================
  */

  const limit = 12;

  /*
  ==========================================================
  BUILD QUERY
  ==========================================================
  */

  const queryParams = useMemo(() => {
    const params = {
      page,
      limit,

      /*
       * Available is the default lifecycle state for
       * this viewer discovery page.
       */
      status:
        filters.status ||
        "available",
    };

    if (search.trim()) {
      params.search = search.trim();
    }

    if (filters.location.trim()) {
      params.location =
        filters.location.trim();
    }

    if (filters.propertyType) {
      params.propertyType =
        filters.propertyType;
    }

    if (
      filters.minPrice !== "" &&
      Number.isFinite(
        Number(filters.minPrice)
      )
    ) {
      params.minPrice =
        Number(filters.minPrice);
    }

    if (
      filters.maxPrice !== "" &&
      Number.isFinite(
        Number(filters.maxPrice)
      )
    ) {
      params.maxPrice =
        Number(filters.maxPrice);
    }

    if (
      filters.bedrooms !== ""
    ) {
      params.bedrooms =
        Number(filters.bedrooms);
    }

    return params;
  }, [
    page,
    limit,
    search,
    filters,
  ]);

  /*
  ==========================================================
  LOAD PROPERTIES
  ==========================================================
  */

  const loadProperties = useCallback(
    async () => {
      try {
        setLoading(true);
        setError("");

        /*
         * Reuse the existing property service.
         *
         * Preferred method:
         *
         *     getAvailableProperties()
         *
         * This keeps the viewer workflow connected to
         * the existing Property model/controller.
         */

        let response;

        if (
          typeof propertyService.getAvailableProperties ===
          "function"
        ) {
          response =
            await propertyService.getAvailableProperties(
              queryParams
            );
        } else if (
          typeof propertyService.getProperties ===
          "function"
        ) {
          /*
           * Compatibility fallback for an existing
           * property service that exposes only
           * getProperties().
           */

          response =
            await propertyService.getProperties(
              queryParams
            );
        } else {
          throw new Error(
            "No compatible property listing service is available."
          );
        }

        const {
          properties: propertyData,
          pagination: paginationData,
        } = extractPropertyData(response);

        /*
         * Viewer discovery should only show actual
         * available properties.
         *
         * We do this defensively even when the backend
         * already filters status=available.
         */

        const availableProperties =
          propertyData.filter(
            (property) =>
              !filters.status ||
              String(property?.status)
                .toLowerCase() ===
                String(filters.status)
                  .toLowerCase()
          );

        setProperties(
          availableProperties
        );

        setPagination(
          paginationData
        );

        /*
         * Support several existing pagination
         * response formats.
         */

        const serverTotalPages =
          Number(
            paginationData?.totalPages
          ) ||
          Number(
            paginationData?.pages
          ) ||
          0;

        const total =
          Number(
            paginationData?.total
          ) ||
          Number(
            paginationData?.count
          ) ||
          0;

        if (serverTotalPages > 0) {
          setTotalPages(
            serverTotalPages
          );
        } else if (total > 0) {
          setTotalPages(
            Math.max(
              1,
              Math.ceil(
                total / limit
              )
            )
          );
        } else {
          /*
           * If the backend does not return
           * pagination metadata, infer whether
           * another page may exist from page size.
           */

          setTotalPages(
            propertyData.length === limit
              ? page + 1
              : page
          );
        }
      } catch (requestError) {
        console.error(
          "Unable to load available properties:",
          requestError
        );

        setProperties([]);

        setPagination(null);

        setTotalPages(1);

        setError(
          requestError?.response?.data?.message ||
            requestError?.message ||
            "Unable to load available properties."
        );
      } finally {
        setLoading(false);
      }
    },
    [
      queryParams,
      filters.status,
      page,
      limit,
    ]
  );

  /*
  ==========================================================
  INITIAL / FILTERED LOAD
  ==========================================================
  */

  useEffect(() => {
    loadProperties();
  }, [loadProperties]);

  /*
  ==========================================================
  SEARCH HANDLER
  ==========================================================
  */

  const handleSearchChange = (
    event
  ) => {
    setSearch(
      event.target.value
    );

    setPage(1);
  };

  /*
  ==========================================================
  FILTER HANDLER
  ==========================================================
  */

  const handleFilterChange = (
    field,
    value
  ) => {
    setFilters(
      (previous) => ({
        ...previous,
        [field]: value,
      })
    );

    setPage(1);
  };

  /*
  ==========================================================
  RESET FILTERS
  ==========================================================
  */

  const resetFilters = () => {
    setSearch("");

    setFilters(
      DEFAULT_FILTERS
    );

    setPage(1);
  };

  /*
  ==========================================================
  OPEN PROPERTY
  ==========================================================
  */

  const handleOpenProperty = (
    property
  ) => {
    const propertyId =
      getPropertyId(property);

    if (!propertyId) {
      console.error(
        "Cannot open property without an ID:",
        property
      );

      return;
    }

    /*
     * Reuse the existing viewer property
     * details route.
     *
     * If your App.jsx uses a different route,
     * only this navigation target needs changing.
     */

    navigate(
      `/viewer/properties/${propertyId}`
    );
  };

  /*
  ==========================================================
  SAVE / UNSAVE PROPERTY
  ==========================================================
  */

  const handleToggleSave = async (
    property
  ) => {
    const propertyId =
      getPropertyId(property);

    if (!propertyId) {
      console.error(
        "Cannot save property without an ID:",
        property
      );

      return;
    }

    const normalizedId =
      String(propertyId);

    try {
      setSavingPropertyId(
        normalizedId
      );

      const currentlySaved =
        savedProperties.has(
          normalizedId
        );

      /*
       * Prefer the existing property service methods
       * when available.
       *
       * This prevents this page from creating a
       * duplicate saved-property API architecture.
       */

      if (
        currentlySaved &&
        typeof propertyService.unsaveProperty ===
          "function"
      ) {
        await propertyService.unsaveProperty(
          normalizedId
        );
      } else if (
        !currentlySaved &&
        typeof propertyService.saveProperty ===
          "function"
      ) {
        await propertyService.saveProperty(
          normalizedId
        );
      }

      /*
       * Update local state.
       *
       * If saveProperty / unsaveProperty does not
       * exist in the current service, this still gives
       * the viewer a local saved state.
       */

      setSavedProperties(
        (previous) => {
          const next =
            new Set(previous);

          if (next.has(normalizedId)) {
            next.delete(
              normalizedId
            );
          } else {
            next.add(
              normalizedId
            );
          }

          try {
            localStorage.setItem(
              "leadflowai_saved_properties",
              JSON.stringify(
                Array.from(next)
              )
            );
          } catch (storageError) {
            console.warn(
              "Unable to persist saved property state:",
              storageError
            );
          }

          return next;
        }
      );
    } catch (saveError) {
      console.error(
        "Unable to update saved property:",
        saveError
      );
    } finally {
      setSavingPropertyId(null);
    }
  };

  /*
  ==========================================================
  PAGINATION
  ==========================================================
  */

  const goToPreviousPage = () => {
    setPage(
      (previous) =>
        Math.max(
          1,
          previous - 1
        )
    );
  };

  const goToNextPage = () => {
    setPage(
      (previous) =>
        Math.min(
          totalPages,
          previous + 1
        )
    );
  };

  /*
  ==========================================================
  ACTIVE FILTER COUNT
  ==========================================================
  */

  const activeFilterCount = useMemo(() => {
    let count = 0;

    if (filters.location.trim()) {
      count += 1;
    }

    if (filters.propertyType) {
      count += 1;
    }

    if (filters.minPrice !== "") {
      count += 1;
    }

    if (filters.maxPrice !== "") {
      count += 1;
    }

    if (filters.bedrooms !== "") {
      count += 1;
    }

    /*
     * status=available is the default viewer
     * discovery state, so it is not counted as
     * an additional user filter.
     */

    return count;
  }, [filters]);

  /*
  ==========================================================
  RENDER
  ==========================================================
  */

  return (
    <section className="min-h-screen bg-gray-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* ==================================================
            PAGE HEADER
        ================================================== */}

        <div className="mb-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="mb-1 text-sm font-medium text-primary">
                LeadFlow AI
              </p>

              <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
                Browse Properties
              </h1>

              <p className="mt-1 max-w-2xl text-sm text-gray-500 sm:text-base">
                Discover available properties that
                match your requirements.
              </p>
            </div>

            {!loading && (
              <div className="text-sm text-gray-500">
                {properties.length}{" "}
                {properties.length === 1
                  ? "property"
                  : "properties"}{" "}
                on this page
              </div>
            )}
          </div>
        </div>

        {/* ==================================================
            SEARCH
        ================================================== */}

        <div className="mb-5 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 lg:flex-row">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />

              <input
                type="search"
                value={search}
                onChange={
                  handleSearchChange
                }
                placeholder="Search by property name, location, estate, city..."
                className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
              />
            </div>

            <button
              type="button"
              onClick={() =>
                setShowFilters(
                  (previous) =>
                    !previous
                )
              }
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 px-5 py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
            >
              <SlidersHorizontal className="h-4 w-4" />

              Filters

              {activeFilterCount > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-xs text-primary-foreground">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>

          {/* ==================================================
              FILTER PANEL
          ================================================== */}

          {showFilters && (
            <div className="mt-4 border-t border-gray-100 pt-4">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                {/* LOCATION */}

                <div className="xl:col-span-2">
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Location
                  </label>

                  <input
                    type="text"
                    value={
                      filters.location
                    }
                    onChange={(event) =>
                      handleFilterChange(
                        "location",
                        event.target.value
                      )
                    }
                    placeholder="e.g. Kilimani"
                    className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
                  />
                </div>

                {/* PROPERTY TYPE */}

                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Property type
                  </label>

                  <select
                    value={
                      filters.propertyType
                    }
                    onChange={(event) =>
                      handleFilterChange(
                        "propertyType",
                        event.target.value
                      )
                    }
                    className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
                  >
                    <option value="">
                      All types
                    </option>

                    {PROPERTY_TYPES.map(
                      (type) => (
                        <option
                          key={type}
                          value={type}
                        >
                          {type}
                        </option>
                      )
                    )}
                  </select>
                </div>

                {/* STATUS */}

                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Status
                  </label>

                  <select
                    value={
                      filters.status
                    }
                    onChange={(event) =>
                      handleFilterChange(
                        "status",
                        event.target.value
                      )
                    }
                    className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
                  >
                    {STATUS_OPTIONS.map(
                      (option) => (
                        <option
                          key={
                            option.value
                          }
                          value={
                            option.value
                          }
                        >
                          {option.label}
                        </option>
                      )
                    )}
                  </select>
                </div>

                {/* BEDROOMS */}

                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Bedrooms
                  </label>

                  <select
                    value={
                      filters.bedrooms
                    }
                    onChange={(event) =>
                      handleFilterChange(
                        "bedrooms",
                        event.target.value
                      )
                    }
                    className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
                  >
                    {BEDROOM_OPTIONS.map(
                      (option) => (
                        <option
                          key={
                            option.value ||
                            "any"
                          }
                          value={
                            option.value
                          }
                        >
                          {option.label}
                        </option>
                      )
                    )}
                  </select>
                </div>

                {/* MIN PRICE */}

                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Min price
                  </label>

                  <input
                    type="number"
                    min="0"
                    value={
                      filters.minPrice
                    }
                    onChange={(event) =>
                      handleFilterChange(
                        "minPrice",
                        event.target.value
                      )
                    }
                    placeholder="0"
                    className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
                  />
                </div>

                {/* MAX PRICE */}

                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Max price
                  </label>

                  <input
                    type="number"
                    min="0"
                    value={
                      filters.maxPrice
                    }
                    onChange={(event) =>
                      handleFilterChange(
                        "maxPrice",
                        event.target.value
                      )
                    }
                    placeholder="No maximum"
                    className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
                  />
                </div>
              </div>

              {/* FILTER ACTIONS */}

              <div className="mt-4 flex justify-end">
                <button
                  type="button"
                  onClick={resetFilters}
                  className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
                >
                  <X className="h-4 w-4" />

                  Clear filters
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ==================================================
            ERROR
        ================================================== */}

        {error && (
          <div className="mb-5 flex flex-col gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />

              <div>
                <h2 className="text-sm font-semibold text-red-800">
                  Unable to load properties
                </h2>

                <p className="mt-1 text-sm text-red-700">
                  {error}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={loadProperties}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100"
            >
              <RefreshCw className="h-4 w-4" />

              Retry
            </button>
          </div>
        )}

        {/* ==================================================
            LOADING
        ================================================== */}

        {loading ? (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({
              length: 6,
            }).map((_, index) => (
              <div
                key={index}
                className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm"
              >
                <div className="aspect-[16/10] animate-pulse bg-gray-200" />

                <div className="space-y-3 p-5">
                  <div className="h-5 w-3/4 animate-pulse rounded bg-gray-200" />

                  <div className="h-4 w-1/2 animate-pulse rounded bg-gray-100" />

                  <div className="h-4 w-2/3 animate-pulse rounded bg-gray-100" />

                  <div className="h-7 w-1/3 animate-pulse rounded bg-gray-200" />

                  <div className="h-11 w-full animate-pulse rounded-xl bg-gray-100" />
                </div>
              </div>
            ))}
          </div>
        ) : properties.length === 0 ? (
          /* ==================================================
             EMPTY STATE
          ================================================== */

          <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-16 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
              <Filter className="h-6 w-6 text-gray-400" />
            </div>

            <h2 className="mt-4 text-lg font-semibold text-gray-900">
              No properties found
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500">
              We couldn't find properties matching
              your current search and filters. Try
              changing your criteria.
            </p>

            <button
              type="button"
              onClick={resetFilters}
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90"
            >
              <X className="h-4 w-4" />

              Clear filters
            </button>
          </div>
        ) : (
          /* ==================================================
             PROPERTY GRID
          ================================================== */

          <>
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {properties.map(
                (property) => {
                  const propertyId =
                    getPropertyId(
                      property
                    );

                  const normalizedId =
                    propertyId
                      ? String(
                          propertyId
                        )
                      : "";

                  return (
                    <ViewerPropertyCard
                      key={
                        normalizedId ||
                        `${property.title}-${property.location}`
                      }
                      property={
                        property
                      }
                      saved={isPropertySaved(
                        property,
                        savedProperties
                      )}
                      saving={
                        savingPropertyId ===
                        normalizedId
                      }
                      onOpen={
                        handleOpenProperty
                      }
                      onToggleSave={
                        handleToggleSave
                      }
                    />
                  );
                }
              )}
            </div>

            {/* ==================================================
                PAGINATION
            ================================================== */}

            {totalPages > 1 && (
              <div className="mt-8 flex flex-col items-center justify-between gap-4 rounded-2xl border border-gray-200 bg-white p-4 sm:flex-row">
                <p className="text-sm text-gray-500">
                  Page{" "}
                  <span className="font-semibold text-gray-900">
                    {page}
                  </span>{" "}
                  of{" "}
                  <span className="font-semibold text-gray-900">
                    {totalPages}
                  </span>
                </p>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={
                      goToPreviousPage
                    }
                    disabled={page <= 1}
                    className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ChevronLeft className="h-4 w-4" />

                    Previous
                  </button>

                  <button
                    type="button"
                    onClick={
                      goToNextPage
                    }
                    disabled={
                      page >=
                      totalPages
                    }
                    className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Next

                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
};

export default AvailableProperties;