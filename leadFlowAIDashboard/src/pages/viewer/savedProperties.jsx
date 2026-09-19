/**
 * ==========================================================
 *
 * VIEWER SAVED PROPERTIES
 *
 * Route
 * ----------------------------------------------------------
 * /viewer/saved-properties
 *
 * PURPOSE
 * ----------------------------------------------------------
 * Displays properties saved by the currently authenticated
 * viewer/customer.
 *
 * IMPORTANT
 * ----------------------------------------------------------
 * Saved properties are USER-SPECIFIC.
 *
 * This component does NOT request:
 *
 * • all organization properties
 * • all available properties
 * • all viewer properties
 *
 * It requests ONLY:
 *
 * propertyService.getSavedProperties()
 *
 * The backend/authentication layer is responsible for
 * determining the currently authenticated viewer/customer.
 *
 * ==========================================================
 *
 * FEATURES
 * ----------------------------------------------------------
 * • Display actual saved properties
 * • Cover image
 * • Property title
 * • Property type
 * • Location
 * • Price
 * • Bedrooms
 * • Bathrooms
 * • Status
 * • Availability
 * • Description
 * • Search by property type
 * • Search by location
 * • Pagination
 * • Remove from saved
 * • Open full property details
 *
 * ==========================================================
 *
 * IMAGE ARCHITECTURE
 * ----------------------------------------------------------
 * Property images are resolved ONLY through:
 *
 * getPropertyImageUrl(property)
 *
 * Do NOT manually inspect:
 *
 * • property.image
 * • property.images
 * • property.coverImage.url
 *
 * ==========================================================
 */

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Bath,
  BedDouble,
  Building2,
  ChevronLeft,
  ChevronRight,
  Eye,
  Heart,
  Home,
  MapPin,
  RefreshCw,
  Search,
  Trash2,
  X,
} from "lucide-react";

import propertyService from "../../services/propertyService";

import {
  getPropertyImageUrl,
} from "../../utils/propertyImage";


/* ==========================================================
   CONSTANTS
========================================================== */

const DEFAULT_FILTERS = {
  propertyType: "",
  location: "",
};

const PLACEHOLDER_IMAGE =
  "/placeholder-property.jpg";


/* ==========================================================
   HELPERS
========================================================== */

/**
 * Safely extract property ID.
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
 * Safely extract property title.
 */
const getPropertyTitle = (
  property
) => {
  return (
    property?.title ||
    property?.name ||
    property?.propertyName ||
    "Untitled Property"
  );
};


/**
 * Safely extract property type.
 */
const getPropertyType = (
  property
) => {
  return (
    property?.propertyType ||
    property?.type ||
    "Property"
  );
};


/**
 * Safely extract location.
 *
 * Supports both string and object
 * location structures.
 */
const getPropertyLocation = (
  property
) => {

  if (
    typeof property?.location ===
    "string"
  ) {

    return (
      property.location ||
      "Location not specified"
    );

  }


  if (
    property?.location &&
    typeof property.location ===
      "object"
  ) {

    const location =
      property.location;


    const combined = [
      location.address,
      location.name,
      location.estate,
      location.city,
      location.county,
    ].filter(Boolean);


    if (
      combined.length > 0
    ) {

      return [
        ...new Set(
          combined
        ),
      ].join(", ");

    }

  }


  const fallback = [
    property?.estate,
    property?.address,
    property?.city,
    property?.county,
  ].filter(Boolean);


  if (
    fallback.length > 0
  ) {

    return [
      ...new Set(
        fallback
      ),
    ].join(", ");

  }


  return "Location not specified";
};


/**
 * Safely format price.
 */
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

    return String(price);

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
    ).format(
      numericPrice
    );

  } catch {

    return `KES ${numericPrice.toLocaleString(
      "en-KE"
    )}`;

  }

};


/**
 * Normalize status.
 */
const normalizeStatus = (
  status
) => {

  if (
    status === null ||
    status === undefined
  ) {

    return "unknown";

  }


  return String(status)
    .trim()
    .toLowerCase();

};


/**
 * Display-friendly status.
 */
const formatStatus = (
  status
) => {

  if (
    !status
  ) {

    return "Unknown";

  }


  return String(status)
    .replace(
      /_/g,
      " "
    )
    .replace(
      /\b\w/g,
      (letter) =>
        letter.toUpperCase()
    );

};


/**
 * Extract bedrooms.
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
 * Extract bathrooms.
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
 * Centralized image resolver.
 *
 * IMPORTANT:
 * ----------------------------------------------------------
 * This component does not inspect the image structure.
 *
 * getPropertyImageUrl() remains the single source of truth.
 */
const getPropertyImage = (
  property
) => {

  return (
    getPropertyImageUrl(
      property
    ) ||
    PLACEHOLDER_IMAGE
  );

};


/**
 * Safely extract API data.
 *
 * Supports:
 *
 * {
 *   data: [...]
 * }
 *
 * and:
 *
 * {
 *   data: {
 *      properties: [...]
 *   }
 * }
 */
const extractSavedProperties = (
 response
) => {

  const payload =
    response?.data;


  if (
    Array.isArray(
      payload
    )
  ) {

    return payload;

  }


  if (
    Array.isArray(
      payload?.properties
    )
  ) {

    return payload.properties;

  }


  if (
    Array.isArray(
      payload?.savedProperties
    )
  ) {

    return payload.savedProperties;

  }


  if (
    Array.isArray(
      response?.properties
    )
  ) {

    return response.properties;

  }


  if (
    Array.isArray(
      response?.savedProperties
    )
  ) {

    return response.savedProperties;

  }


  return [];

};


/**
 * Extract pagination information.
 *
 * Supports several common backend structures.
 */
const extractPagination = (
  response
) => {

  const payload =
    response?.data;


  const pagination =
    response?.pagination ||
    payload?.pagination ||
    {};


  const page =
    Number(
      pagination?.page ??
      response?.page ??
      payload?.page ??
      1
    );


  const totalPages =
    Number(
      pagination?.totalPages ??
      response?.totalPages ??
      payload?.totalPages ??
      1
    );


  const total =
    Number(
      pagination?.total ??
      response?.total ??
      payload?.total ??
      0
    );


  return {

    page:
      Number.isFinite(page) &&
      page > 0
        ? page
        : 1,

    totalPages:
      Number.isFinite(
        totalPages
      ) &&
      totalPages > 0
        ? totalPages
        : 1,

    total:
      Number.isFinite(total) &&
      total >= 0
        ? total
        : 0,

  };

};


/* ==========================================================
   PROPERTY CARD
========================================================== */

const SavedPropertyCard = ({
  property,
  onView,
  onRemove,
}) => {

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


  const propertyType =
    getPropertyType(
      property
    );


  const image =
    getPropertyImage(
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


  const status =
    normalizeStatus(
      property?.status ||
      property?.availability
    );


  return (

    <article
      className="
        group
        overflow-hidden
        rounded-3xl
        border
        border-slate-800
        bg-slate-900
        shadow-sm
        transition
        duration-200
        hover:-translate-y-1
        hover:border-slate-700
        hover:shadow-xl
      "
    >

      {/* ====================================================
          IMAGE
      ==================================================== */}

      <div
        className="
          relative
          h-64
          w-full
          overflow-hidden
          bg-slate-950
        "
      >

        <img
          src={image}
          alt={title}
          className="
            h-full
            w-full
            object-cover
            transition
            duration-300
            group-hover:scale-105
          "
          onError={(
            event
          ) => {

            if (
              event.currentTarget.src !==
              window.location.origin +
                PLACEHOLDER_IMAGE
            ) {

              event.currentTarget.src =
                PLACEHOLDER_IMAGE;

            }

          }}
        />


        {/* ==================================================
            SAVED BADGE
        ================================================== */}

        <div
          className="
            absolute
            left-4
            top-4
            inline-flex
            items-center
            gap-2
            rounded-full
            bg-slate-950/85
            px-3
            py-2
            text-xs
            font-semibold
            text-rose-400
            backdrop-blur
          "
        >

          <Heart
            size={14}
            fill="currentColor"
          />

          Saved

        </div>


        {/* ==================================================
            STATUS
        ================================================== */}

        <div
          className="
            absolute
            right-4
            top-4
          "
        >

          <span
            className={`
              inline-flex
              rounded-full
              px-3
              py-2
              text-xs
              font-semibold
              capitalize
              backdrop-blur
              ${
                status ===
                "available"
                  ? "bg-emerald-500/90 text-slate-950"
                  : status ===
                    "reserved"
                  ? "bg-amber-500/90 text-slate-950"
                  : status ===
                    "sold"
                  ? "bg-red-500/90 text-white"
                  : "bg-slate-950/85 text-slate-200"
              }
            `}
          >

            {formatStatus(
              status
            )}

          </span>

        </div>

      </div>


      {/* ====================================================
          CONTENT
      ==================================================== */}

      <div
        className="
          space-y-5
          p-5
        "
      >

        {/* ==================================================
            TITLE + TYPE
        ================================================== */}

        <div>

          <div
            className="
              flex
              items-start
              justify-between
              gap-3
            "
          >

            <h2
              className="
                line-clamp-2
                text-xl
                font-bold
                text-white
              "
            >

              {title}

            </h2>

          </div>


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

            <MapPin
              size={16}
              className="
                shrink-0
                text-cyan-400
              "
            />

            <span
              className="
                line-clamp-2
              "
            >

              {location}

            </span>

          </div>

        </div>


        {/* ==================================================
            PROPERTY TYPE
        ================================================== */}

        <div
          className="
            inline-flex
            items-center
            gap-2
            rounded-full
            border
            border-slate-700
            bg-slate-950
            px-3
            py-2
            text-xs
            font-semibold
            text-slate-300
          "
        >

          <Building2
            size={14}
          />

          <span
            className="
              capitalize
            "
          >

            {String(
              propertyType
            ).replace(
              /_/g,
              " "
            )}

          </span>

        </div>


        {/* ==================================================
            PRICE
        ================================================== */}

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

            Price

          </p>


          <p
            className="
              mt-1
              text-2xl
              font-bold
              text-cyan-400
            "
          >

            {formatPrice(
              property?.price,
              property?.currency
            )}

          </p>

        </div>


        {/* ==================================================
            SPECIFICATIONS
        ================================================== */}

        <div
          className="
            grid
            grid-cols-2
            gap-3
          "
        >

          {/* BEDROOMS */}

          <div
            className="
              rounded-2xl
              border
              border-slate-800
              bg-slate-950
              p-3
            "
          >

            <div
              className="
                flex
                items-center
                gap-2
                text-slate-400
              "
            >

              <BedDouble
                size={16}
              />

              <span
                className="
                  text-xs
                "
              >

                Bedrooms

              </span>

            </div>


            <p
              className="
                mt-1
                text-lg
                font-bold
                text-white
              "
            >

              {bedrooms ??
                "—"}

            </p>

          </div>


          {/* BATHROOMS */}

          <div
            className="
              rounded-2xl
              border
              border-slate-800
              bg-slate-950
              p-3
            "
          >

            <div
              className="
                flex
                items-center
                gap-2
                text-slate-400
              "
            >

              <Bath
                size={16}
              />

              <span
                className="
                  text-xs
                "
              >

                Bathrooms

              </span>

            </div>


            <p
              className="
                mt-1
                text-lg
                font-bold
                text-white
              "
            >

              {bathrooms ??
                "—"}

            </p>

          </div>

        </div>


        {/* ==================================================
            DESCRIPTION
        ================================================== */}

        <div>

          <p
            className="
              line-clamp-3
              text-sm
              leading-6
              text-slate-400
            "
          >

            {property?.description ||
              "No property description is available."}

          </p>

        </div>


        {/* ==================================================
            ACTIONS
        ================================================== */}

        <div
          className="
            grid
            grid-cols-[1fr_auto]
            gap-3
          "
        >

          {/* VIEW */}

          <button
            type="button"
            onClick={() =>
              onView(
                property
              )
            }
            className="
              inline-flex
              items-center
              justify-center
              gap-2
              rounded-xl
              bg-cyan-500
              px-4
              py-3
              text-sm
              font-semibold
              text-slate-950
              transition
              hover:bg-cyan-400
              focus:outline-none
              focus:ring-2
              focus:ring-cyan-500
            "
          >

            <Eye
              size={17}
            />

            View Property

          </button>


          {/* REMOVE */}

          <button
            type="button"
            onClick={() =>
              onRemove(
                property
              )
            }
            aria-label={
              `Remove ${title} from saved properties`
            }
            title="Remove from saved"
            className="
              inline-flex
              items-center
              justify-center
              rounded-xl
              border
              border-red-500/30
              bg-red-500/10
              px-4
              py-3
              text-red-400
              transition
              hover:bg-red-500/20
              focus:outline-none
              focus:ring-2
              focus:ring-red-500
            "
          >

            <Trash2
              size={18}
            />

          </button>

        </div>

      </div>

    </article>

  );

};


/* ==========================================================
   MAIN COMPONENT
========================================================== */

const SavedProperties = () => {

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
    removingId,
    setRemovingId,
  ] = useState(null);


  const [
    error,
    setError,
  ] = useState("");


  /* ========================================================
     FILTER STATE
  ======================================================== */

  const [
    filters,
    setFilters,
  ] = useState(
    DEFAULT_FILTERS
  );


  /* ========================================================
     PAGINATION
  ======================================================== */

  const [
    currentPage,
    setCurrentPage,
  ] = useState(1);


  const [
    totalPages,
    setTotalPages,
  ] = useState(1);


  const [
    totalSaved,
    setTotalSaved,
  ] = useState(0);


  /* ========================================================
     SEARCH INPUT STATE
     
     We keep this separate from the applied filters so the
     viewer can type before pressing Search.
  ======================================================== */

  const [
    searchInputs,
    setSearchInputs,
  ] = useState(
    DEFAULT_FILTERS
  );


  /* ========================================================
     LOAD SAVED PROPERTIES
     
     IMPORTANT
     --------------------------------------------------------
     We intentionally call:
     
       propertyService.getSavedProperties()
     
     and NOT:
     
       getProperties()
     
     This is what keeps the page user-specific.
  ======================================================== */

  const loadSavedProperties =
    useCallback(
      async (
        page = 1,
        appliedFilters = filters
      ) => {

        try {

          setLoading(true);

          setError("");


          /* --------------------------------------------------
             BUILD REQUEST
             
             Only send supported saved-property filters.
             
             Search is restricted to:
             • propertyType
             • location
          -------------------------------------------------- */

          const params = {
            page,
          };


          if (
            appliedFilters?.propertyType
          ) {

            params.propertyType =
              appliedFilters.propertyType.trim();

          }


          if (
            appliedFilters?.location
          ) {

            params.location =
              appliedFilters.location.trim();

          }


          console.log(
            "=================================================="
          );

          console.log(
            "VIEWER SAVED PROPERTIES"
          );

          console.log(
            "Loading saved properties..."
          );

          console.log(
            "Saved property params:",
            params
          );


          /* --------------------------------------------------
             USER-SPECIFIC SAVED PROPERTIES
          -------------------------------------------------- */

          const response =
            await propertyService.getSavedProperties(
              params
            );


          console.log(
            "Saved properties response:",
            response
          );


          const loadedProperties =
            extractSavedProperties(
              response
            );


          const pagination =
            extractPagination(
              response
            );


          console.log(
            "Authenticated viewer saved properties:",
            loadedProperties
          );


          console.log(
            "Saved property count:",
            loadedProperties.length
          );


          console.log(
            "Pagination:",
            pagination
          );


          setProperties(
            loadedProperties
          );


          setCurrentPage(
            pagination.page ||
            page
          );


          setTotalPages(
            pagination.totalPages ||
            1
          );


          setTotalSaved(
            pagination.total ||
            loadedProperties.length
          );


        } catch (
          requestError
        ) {

          console.error(
            "FAILED LOADING VIEWER SAVED PROPERTIES:",
            requestError
          );


          console.error(
            "Saved properties API response:",
            requestError?.response?.data
          );


          setProperties([]);


          setTotalPages(1);


          setTotalSaved(0);


          setError(
            requestError?.response?.data
              ?.message ||
            requestError?.message ||
            "Unable to load your saved properties."
          );

        } finally {

          setLoading(false);

        }

      },
      [filters]
    );


  /* ========================================================
     INITIAL LOAD
  ======================================================== */

  useEffect(() => {

    loadSavedProperties(
      currentPage,
      filters
    );

  }, [
    currentPage,
  ]);


  /* ========================================================
     SEARCH INPUT CHANGE
  ======================================================== */

  const handleInputChange = (
    event
  ) => {

    const {
      name,
      value,
    } = event.target;


    setSearchInputs(
      (previous) => ({
        ...previous,
        [name]: value,
      })
    );

  };


  /* ========================================================
     APPLY SEARCH
     
     Search ONLY:
     • Property Type
     • Location
  ======================================================== */

  const handleSearch = () => {

    const nextFilters = {
      propertyType:
        searchInputs.propertyType.trim(),
      location:
        searchInputs.location.trim(),
    };


    console.log(
      "Applying saved property filters:",
      nextFilters
    );


    setFilters(
      nextFilters
    );


    setCurrentPage(1);


    loadSavedProperties(
      1,
      nextFilters
    );

  };


  /* ========================================================
     ENTER KEY SEARCH
  ======================================================== */

  const handleSearchKeyDown = (
    event
  ) => {

    if (
      event.key ===
      "Enter"
    ) {

      event.preventDefault();

      handleSearch();

    }

  };


  /* ========================================================
     RESET FILTERS
  ======================================================== */

  const handleResetFilters =
    () => {

      setSearchInputs(
        DEFAULT_FILTERS
      );


      setFilters(
        DEFAULT_FILTERS
      );


      setCurrentPage(1);


      loadSavedProperties(
        1,
        DEFAULT_FILTERS
      );

    };


  /* ========================================================
     REMOVE SAVED PROPERTY
  ======================================================== */

  const handleRemoveSaved =
    async (
      property
    ) => {

      const propertyId =
        getPropertyId(
          property
        );


      if (
        !propertyId
      ) {

        console.warn(
          "Cannot remove saved property: missing property ID.",
          property
        );

        return;

      }


      const title =
        getPropertyTitle(
          property
        );


      try {

        setRemovingId(
          String(
            propertyId
          )
        );


        console.log(
          "Removing saved property:",
          {
            propertyId,
            title,
          }
        );


        await propertyService.removeSavedProperty(
          propertyId
        );


        console.log(
          "Saved property removed:",
          propertyId
        );


        /* --------------------------------------------------
           Immediately remove from UI.
           
           This makes the page feel instant instead of waiting
           for another full request.
        -------------------------------------------------- */

        setProperties(
          (previous) =>
            previous.filter(
              (item) =>
                String(
                  getPropertyId(
                    item
                  )
                ) !==
                String(
                  propertyId
                )
            )
        );


        setTotalSaved(
          (previous) =>
            Math.max(
              0,
              previous - 1
            )
        );


        /* --------------------------------------------------
           Reload the current page.
           
           Important for pagination:
           if removing the final item on a page, the backend
           can provide the correct next dataset.
        -------------------------------------------------- */

        await loadSavedProperties(
          currentPage,
          filters
        );

      } catch (
        removeError
      ) {

        console.error(
          "UNABLE TO REMOVE SAVED PROPERTY:",
          removeError
        );


        console.error(
          "Remove saved property response:",
          removeError?.response?.data
        );


        setError(
          removeError?.response?.data
            ?.message ||
          removeError?.message ||
          `Unable to remove "${title}" from saved properties.`
        );

      } finally {

        setRemovingId(
          null
        );

      }

    };


  /* ========================================================
     VIEW PROPERTY
     
     IMPORTANT
     --------------------------------------------------------
     Viewer MUST remain in the Viewer workspace.
     
     /viewer/saved-properties
          ↓
     /viewer/properties/:propertyId
     
     NOT:
     
     /properties/:id
     
     and NOT:
     
     /admin/properties/:id
  ======================================================== */

  const handleView =
    (property) => {

      const propertyId =
        getPropertyId(
          property
        );


      if (
        !propertyId
      ) {

        console.warn(
          "Cannot view saved property: missing property ID.",
          property
        );

        return;

      }


      window.location.href =
        `/viewer/properties/${encodeURIComponent(
          String(
            propertyId
          )
        )}`;

    };


  /* ========================================================
     CURRENT FILTER SUMMARY
  ======================================================== */

  const hasActiveFilters =
    Boolean(
      filters.propertyType ||
      filters.location
    );


  /* ========================================================
     MEMOIZED PROPERTY COUNT
  ======================================================== */

  const visibleCount =
    useMemo(
      () =>
        properties.length,
      [properties]
    );


  /* ========================================================
     LOADING SKELETON
  ======================================================== */

  if (
    loading &&
    properties.length === 0
  ) {

    return (

      <section
        className="
          space-y-8
        "
      >

        {/* HEADER */}

        <div>

          <div
            className="
              h-10
              w-72
              animate-pulse
              rounded-xl
              bg-slate-800
            "
          />

          <div
            className="
              mt-3
              h-5
              w-[32rem]
              max-w-full
              animate-pulse
              rounded-lg
              bg-slate-800
            "
          />

        </div>


        {/* SEARCH */}

        <div
          className="
            rounded-3xl
            border
            border-slate-800
            bg-slate-900
            p-5
          "
        >

          <div
            className="
              grid
              gap-4
              md:grid-cols-3
            "
          >

            {[1, 2, 3].map(
              (item) => (

                <div
                  key={item}
                  className="
                    h-12
                    animate-pulse
                    rounded-xl
                    bg-slate-800
                  "
                />

              )
            )}

          </div>

        </div>


        {/* CARDS */}

        <div
          className="
            grid
            gap-6
            md:grid-cols-2
            xl:grid-cols-3
          "
        >

          {[1, 2, 3].map(
            (item) => (

              <div
                key={item}
                className="
                  h-[620px]
                  animate-pulse
                  rounded-3xl
                  bg-slate-800
                "
              />

            )
          )}

        </div>

      </section>

    );

  }


  /* ========================================================
     PAGE
  ======================================================== */

  return (

    <section
      className="
        mx-auto
        max-w-7xl
        space-y-8
      "
    >

      {/* ====================================================
          HEADER
      ==================================================== */}

      <div
        className="
          flex
          flex-col
          gap-4
          sm:flex-row
          sm:items-end
          sm:justify-between
        "
      >

        <div>

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
                h-12
                w-12
                items-center
                justify-center
                rounded-2xl
                bg-rose-500/10
              "
            >

              <Heart
                size={24}
                className="
                  text-rose-400
                "
                fill="currentColor"
              />

            </div>


            <h1
              className="
                text-3xl
                font-bold
                text-white
              "
            >

              Saved Properties

            </h1>

          </div>


          <p
            className="
              mt-3
              max-w-2xl
              text-slate-400
            "
          >

            Properties you have saved for
            later. Search your saved homes
            by property type or location.

          </p>

        </div>


        {/* TOTAL */}

        {!loading && (

          <div
            className="
              inline-flex
              items-center
              gap-2
              self-start
              rounded-full
              border
              border-slate-800
              bg-slate-900
              px-4
              py-2
              text-sm
              font-medium
              text-slate-300
              sm:self-auto
            "
          >

            <Heart
              size={15}
              className="
                text-rose-400
              "
              fill="currentColor"
            />

            {totalSaved}{" "}
            {totalSaved === 1
              ? "saved property"
              : "saved properties"}

          </div>

        )}

      </div>


      {/* ====================================================
          SEARCH PANEL
      ==================================================== */}

      <div
        className="
          rounded-3xl
          border
          border-slate-800
          bg-slate-900
          p-5
          shadow-sm
        "
      >

        <div
          className="
            mb-5
            flex
            items-center
            justify-between
            gap-4
          "
        >

          <div>

            <h2
              className="
                text-lg
                font-semibold
                text-white
              "
            >

              Search Saved Properties

            </h2>


            <p
              className="
                mt-1
                text-sm
                text-slate-500
              "
            >

              Filter by property type and
              location.

            </p>

          </div>


          {hasActiveFilters && (

            <button
              type="button"
              onClick={
                handleResetFilters
              }
              className="
                inline-flex
                items-center
                gap-2
                text-sm
                font-medium
                text-cyan-400
                transition
                hover:text-cyan-300
              "
            >

              <X
                size={15}
              />

              Clear filters

            </button>

          )}

        </div>


        <div
          className="
            grid
            gap-4
            md:grid-cols-[1fr_1fr_auto]
          "
        >

          {/* PROPERTY TYPE */}

          <div>

            <label
              htmlFor="saved-property-type"
              className="
                mb-2
                block
                text-sm
                font-medium
                text-slate-300
              "
            >

              Property Type

            </label>


            <div
              className="
                relative
              "
            >

              <Building2
                size={17}
                className="
                  pointer-events-none
                  absolute
                  left-4
                  top-1/2
                  -translate-y-1/2
                  text-slate-500
                "
              />


              <select
                id="saved-property-type"
                name="propertyType"
                value={
                  searchInputs.propertyType
                }
                onChange={
                  handleInputChange
                }
                className="
                  h-12
                  w-full
                  appearance-none
                  rounded-xl
                  border
                  border-slate-700
                  bg-slate-950
                  pl-11
                  pr-4
                  text-sm
                  text-white
                  outline-none
                  transition
                  focus:border-cyan-500
                  focus:ring-2
                  focus:ring-cyan-500/20
                "
              >

                <option
                  value=""
                >
                  All property types
                </option>

                <option
                  value="apartment"
                >
                  Apartment
                </option>

                <option
                  value="house"
                >
                  House
                </option>

                <option
                  value="villa"
                >
                  Villa
                </option>

                <option
                  value="townhouse"
                >
                  Townhouse
                </option>

                <option
                  value="studio"
                >
                  Studio
                </option>

                <option
                  value="office"
                >
                  Office
                </option>

                <option
                  value="commercial"
                >
                  Commercial
                </option>

                <option
                  value="land"
                >
                  Land
                </option>

              </select>

            </div>

          </div>


          {/* LOCATION */}

          <div>

            <label
              htmlFor="saved-property-location"
              className="
                mb-2
                block
                text-sm
                font-medium
                text-slate-300
              "
            >

              Location

            </label>


            <div
              className="
                relative
              "
            >

              <MapPin
                size={17}
                className="
                  pointer-events-none
                  absolute
                  left-4
                  top-1/2
                  -translate-y-1/2
                  text-slate-500
                "
              />


              <input
                id="saved-property-location"
                type="text"
                name="location"
                value={
                  searchInputs.location
                }
                onChange={
                  handleInputChange
                }
                onKeyDown={
                  handleSearchKeyDown
                }
                placeholder="e.g. Kilimani, Westlands..."
                className="
                  h-12
                  w-full
                  rounded-xl
                  border
                  border-slate-700
                  bg-slate-950
                  pl-11
                  pr-4
                  text-sm
                  text-white
                  placeholder:text-slate-600
                  outline-none
                  transition
                  focus:border-cyan-500
                  focus:ring-2
                  focus:ring-cyan-500/20
                "
              />

            </div>

          </div>


          {/* SEARCH BUTTON */}

          <div
            className="
              flex
              items-end
            "
          >

            <button
              type="button"
              onClick={
                handleSearch
              }
              disabled={
                loading
              }
              className="
                inline-flex
                h-12
                w-full
                items-center
                justify-center
                gap-2
                rounded-xl
                bg-cyan-500
                px-6
                text-sm
                font-semibold
                text-slate-950
                transition
                hover:bg-cyan-400
                disabled:cursor-not-allowed
                disabled:opacity-60
                focus:outline-none
                focus:ring-2
                focus:ring-cyan-500
                md:w-auto
              "
            >

              {loading ? (

                <RefreshCw
                  size={17}
                  className="
                    animate-spin
                  "
                />

              ) : (

                <Search
                  size={17}
                />

              )}

              Search

            </button>

          </div>

        </div>

      </div>


      {/* ====================================================
          ERROR
      ==================================================== */}

      {error && (

        <div
          className="
            rounded-2xl
            border
            border-red-500/20
            bg-red-500/10
            p-5
          "
        >

          <div
            className="
              flex
              items-start
              gap-3
            "
          >

            <div
              className="
                text-xl
              "
            >
              ⚠️
            </div>


            <div>

              <h2
                className="
                  font-semibold
                  text-white
                "
              >

                Unable to load saved properties

              </h2>


              <p
                className="
                  mt-1
                  text-sm
                  text-red-300
                "
              >

                {error}

              </p>


              <button
                type="button"
                onClick={() =>
                  loadSavedProperties(
                    currentPage,
                    filters
                  )
                }
                className="
                  mt-4
                  inline-flex
                  items-center
                  gap-2
                  rounded-xl
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

                <RefreshCw
                  size={15}
                />

                Try Again

              </button>

            </div>

          </div>

        </div>

      )}


      {/* ====================================================
          ACTIVE FILTER SUMMARY
      ==================================================== */}

      {hasActiveFilters && (

        <div
          className="
            flex
            flex-wrap
            items-center
            gap-2
          "
        >

          <span
            className="
              text-sm
              text-slate-500
            "
          >

            Active filters:

          </span>


          {filters.propertyType && (

            <span
              className="
                rounded-full
                bg-cyan-500/10
                px-3
                py-1.5
                text-xs
                font-medium
                capitalize
                text-cyan-400
              "
            >

              Type:{" "}
              {String(
                filters.propertyType
              ).replace(
                /_/g,
                " "
              )}

            </span>

          )}


          {filters.location && (

            <span
              className="
                rounded-full
                bg-cyan-500/10
                px-3
                py-1.5
                text-xs
                font-medium
                text-cyan-400
              "
            >

              Location:{" "}
              {filters.location}

            </span>

          )}

        </div>

      )}


      {/* ====================================================
          PROPERTY RESULTS
      ==================================================== */}

      {!loading &&
        properties.length === 0 && (

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

            <div
              className="
                mx-auto
                flex
                h-16
                w-16
                items-center
                justify-center
                rounded-2xl
                bg-slate-800
              "
            >

              {hasActiveFilters ? (

                <Search
                  size={28}
                  className="
                    text-slate-500
                  "
                />

              ) : (

                <Heart
                  size={28}
                  className="
                    text-slate-500
                  "
                />

              )}

            </div>


            <h2
              className="
                mt-5
                text-xl
                font-semibold
                text-white
              "
            >

              {hasActiveFilters
                ? "No matching saved properties"
                : "You have no saved properties yet"}

            </h2>


            <p
              className="
                mx-auto
                mt-2
                max-w-lg
                text-sm
                leading-6
                text-slate-400
              "
            >

              {hasActiveFilters
                ? "Try another property type or location, or clear your filters to see all of your saved properties."
                : "When you save a property, it will appear here so you can quickly return to it later."}

            </p>


            {hasActiveFilters && (

              <button
                type="button"
                onClick={
                  handleResetFilters
                }
                className="
                  mt-6
                  inline-flex
                  items-center
                  gap-2
                  rounded-xl
                  border
                  border-slate-700
                  px-5
                  py-3
                  text-sm
                  font-semibold
                  text-white
                  transition
                  hover:bg-slate-800
                "
              >

                <X
                  size={16}
                />

                Clear Filters

              </button>

            )}

          </div>

        )}


      {/* ====================================================
          PROPERTY GRID
      ==================================================== */}

      {properties.length > 0 && (

        <>

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
                  text-sm
                  text-slate-400
                "
              >

                Showing{" "}

                <span
                  className="
                    font-semibold
                    text-white
                  "
                >

                  {visibleCount}

                </span>

                {" "}saved{" "}

                {visibleCount === 1
                  ? "property"
                  : "properties"}

              </p>

            </div>


            {loading && (

              <RefreshCw
                size={17}
                className="
                  animate-spin
                  text-cyan-400
                "
              />

            )}

          </div>


          <div
            className="
              grid
              gap-6
              md:grid-cols-2
              xl:grid-cols-3
            "
          >

            {properties.map(
              (property) => {

                const propertyId =
                  getPropertyId(
                    property
                  );


                const isRemoving =
                  removingId ===
                  String(
                    propertyId
                  );


                return (

                  <div
                    key={
                      String(
                        propertyId
                      )
                    }
                    className={
                      isRemoving
                        ? "pointer-events-none opacity-50"
                        : ""
                    }
                  >

                    <SavedPropertyCard
                      property={
                        property
                      }
                      onView={
                        handleView
                      }
                      onRemove={
                        handleRemoveSaved
                      }
                    />

                  </div>

                );

              }
            )}

          </div>

        </>

      )}


      {/* ====================================================
          PAGINATION
      ==================================================== */}

      {totalPages > 1 && (

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
            p-4
            sm:flex-row
          "
        >

          {/* PREVIOUS */}

          <button
            type="button"
            disabled={
              currentPage <= 1 ||
              loading
            }
            onClick={() => {

              if (
                currentPage > 1
              ) {

                setCurrentPage(
                  (page) =>
                    page - 1
                );

              }

            }}
            className="
              inline-flex
              w-full
              items-center
              justify-center
              gap-2
              rounded-xl
              border
              border-slate-700
              px-4
              py-2.5
              text-sm
              font-medium
              text-white
              transition
              hover:bg-slate-800
              disabled:cursor-not-allowed
              disabled:opacity-40
              sm:w-auto
            "
          >

            <ChevronLeft
              size={17}
            />

            Previous

          </button>


          {/* PAGE */}

          <div
            className="
              text-sm
              text-slate-400
            "
          >

            Page{" "}

            <span
              className="
                font-semibold
                text-white
              "
            >

              {currentPage}

            </span>

            {" "}of{" "}

            <span
              className="
                font-semibold
                text-white
              "
            >

              {totalPages}

            </span>

          </div>


          {/* NEXT */}

          <button
            type="button"
            disabled={
              currentPage >=
                totalPages ||
              loading
            }
            onClick={() => {

              if (
                currentPage <
                totalPages
              ) {

                setCurrentPage(
                  (page) =>
                    page + 1
                );

              }

            }}
            className="
              inline-flex
              w-full
              items-center
              justify-center
              gap-2
              rounded-xl
              border
              border-slate-700
              px-4
              py-2.5
              text-sm
              font-medium
              text-white
              transition
              hover:bg-slate-800
              disabled:cursor-not-allowed
              disabled:opacity-40
              sm:w-auto
            "
          >

            Next

            <ChevronRight
              size={17}
            />

          </button>

        </div>

      )}

    </section>

  );

};


/* ==========================================================
   EXPORT
========================================================== */

export default SavedProperties;