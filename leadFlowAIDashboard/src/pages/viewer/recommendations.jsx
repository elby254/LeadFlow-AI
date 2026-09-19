/**
 * =========================================================
 * VIEWER AI RECOMMENDATIONS
 * =========================================================
 *
 * Path
 * ----
 * src/pages/viewer/recommendations.jsx
 *
 * Route
 * -----
 * /viewer/recommendations
 *
 * Purpose
 * -------
 * Dedicated AI-powered property discovery page for viewers.
 *
 * Responsibilities
 * ----------------
 * ✓ Display AI-recommended properties
 * ✓ Explain why a property may match the viewer
 * ✓ Show property cover image
 * ✓ Show price
 * ✓ Show location
 * ✓ Show property type
 * ✓ Show bedrooms / bathrooms
 * ✓ Open property details
 * ✓ Save / unsave properties
 * ✓ Refresh recommendations
 * ✓ Handle loading state
 * ✓ Handle error state
 * ✓ Handle empty recommendations
 *
 * Architecture
 * ------------
 * This page REUSES the existing property architecture.
 *
 * It does NOT:
 * • Create another Property model
 * • Create another property API
 * • Create another image system
 *
 * Property lifecycle source of truth:
 *
 *     property.status
 *
 * Cover image source:
 *
 *     property.coverImage
 *
 * =========================================================
 */

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  ArrowRight,
  BedDouble,
  Bath,
  Bookmark,
  BookmarkCheck,
  Brain,
  ChevronLeft,
  ChevronRight,
  Home,
  MapPin,
  RefreshCw,
  Sparkles,
  AlertCircle,
} from "lucide-react";

import { useNavigate } from "react-router-dom";

import propertyService from "../../services/propertyService";

/*
==========================================================
OPTIONAL LOCAL STORAGE KEY
==========================================================

Saved properties are kept locally on the viewer side.

This does NOT replace a backend saved-property/favourite
system if one already exists.

It simply allows the page to provide save/unsave behaviour
without creating another property model.

If your existing application already has a dedicated
saved-property service, this can later be connected to it.
==========================================================
*/

const SAVED_PROPERTIES_KEY = "leadflowai_saved_properties";

/*
==========================================================
HELPER: EXTRACT ARRAY
==========================================================
*/

const extractArray = (response) => {
  if (Array.isArray(response)) {
    return response;
  }

  if (Array.isArray(response?.data)) {
    return response.data;
  }

  if (Array.isArray(response?.data?.data)) {
    return response.data.data;
  }

  if (Array.isArray(response?.properties)) {
    return response.properties;
  }

  if (Array.isArray(response?.data?.properties)) {
    return response.data.properties;
  }

  if (Array.isArray(response?.recommendations)) {
    return response.recommendations;
  }

  if (Array.isArray(response?.data?.recommendations)) {
    return response.data.recommendations;
  }

  return [];
};

/*
==========================================================
HELPER: PROPERTY ID
==========================================================
*/

const getPropertyId = (property) => {
  if (!property) {
    return null;
  }

  return (
    property._id ||
    property.id ||
    property.propertyId ||
    property.property?._id ||
    property.property?.id ||
    null
  );
};

/*
==========================================================
HELPER: NORMALIZE RECOMMENDATION
==========================================================

The backend may return either:

    property

or:

    {
      property: {...},
      reason: "...",
      matchReason: "..."
    }

This helper keeps the UI compatible with both.
==========================================================
*/

const normalizeRecommendation = (item) => {
  const property = item?.property || item?.propertyData || item;

  return {
    ...property,

    /*
    Preserve recommendation metadata.
    */

    recommendationReason:
      item?.reason ||
      item?.matchReason ||
      item?.recommendationReason ||
      property?.recommendationReason ||
      property?.aiMetadata?.matchReason ||
      "",

    matchScore:
      item?.matchScore ??
      item?.score ??
      property?.aiScore ??
      null,

    matchTags:
      item?.matchTags ||
      property?.aiMetadata?.matchTags ||
      [],
  };
};

/*
==========================================================
HELPER: COVER IMAGE
==========================================================

Property.coverImage is a reference to PropertyImage.

Different backend population/serialization shapes may
appear, so this safely checks the common possibilities.

==========================================================
*/

const getCoverImage = (property) => {
  if (!property) {
    return null;
  }

  const coverImage = property.coverImage;

  /*
  Direct URL/string
  */

  if (typeof coverImage === "string") {
    return coverImage;
  }

  /*
  Populated PropertyImage object
  */

  if (coverImage && typeof coverImage === "object") {
    return (
      coverImage.url ||
      coverImage.imageUrl ||
      coverImage.secureUrl ||
      coverImage.src ||
      coverImage.path ||
      null
    );
  }

  /*
  Backward-compatible image fields.

  These do not create a new image architecture.
  They simply allow already-serialized property
  responses to render correctly.
  */

  return (
    property.coverImageUrl ||
    property.imageUrl ||
    property.primaryImage ||
    property.thumbnail ||
    (Array.isArray(property.images)
      ? property.images[0]?.url ||
        property.images[0]?.imageUrl ||
        property.images[0]
      : null) ||
    null
  );
};

/*
==========================================================
HELPER: FORMAT PRICE
==========================================================
*/

const formatPrice = (property) => {
  const price = Number(property?.price);

  if (!Number.isFinite(price)) {
    return "Price on request";
  }

  const currency = property?.currency || "KES";

  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(price);
};

/*
==========================================================
HELPER: LOCATION
==========================================================
*/

const getLocation = (property) => {
  return (
    property?.location ||
    property?.estate ||
    property?.city ||
    property?.county ||
    "Location not specified"
  );
};

/*
==========================================================
HELPER: LOAD SAVED PROPERTIES
==========================================================
*/

const loadSavedProperties = () => {
  try {
    const stored = localStorage.getItem(
      SAVED_PROPERTIES_KEY
    );

    if (!stored) {
      return [];
    }

    const parsed = JSON.parse(stored);

    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error(
      "Unable to load saved properties",
      error
    );

    return [];
  }
};

/*
==========================================================
HELPER: SAVE SAVED PROPERTIES
==========================================================
*/

const persistSavedProperties = (ids) => {
  try {
    localStorage.setItem(
      SAVED_PROPERTIES_KEY,
      JSON.stringify(ids)
    );
  } catch (error) {
    console.error(
      "Unable to persist saved properties",
      error
    );
  }
};

/*
==========================================================
PROPERTY CARD
==========================================================
*/

const RecommendationCard = ({
  property,
  saved,
  onToggleSave,
  onOpen,
}) => {
  const image = getCoverImage(property);

  const propertyId = getPropertyId(property);

  const reason =
    property.recommendationReason ||
    "This property may match your preferences and discovery activity.";

  return (
    <article className="group overflow-hidden rounded-2xl border bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      {/* ==================================================
          COVER IMAGE
      ================================================== */}

      <div className="relative h-56 overflow-hidden bg-gray-100">
        {image ? (
          <img
            src={image}
            alt={property.title || "Property"}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
            onError={(event) => {
              event.currentTarget.style.display =
                "none";
            }}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Home className="h-12 w-12 text-gray-300" />
          </div>
        )}

        {/* ==================================================
            AI BADGE
        ================================================== */}

        <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1.5 text-xs font-semibold text-gray-800 shadow-sm backdrop-blur">
          <Sparkles className="h-3.5 w-3.5" />

          AI Recommended
        </div>

        {/* ==================================================
            SAVE BUTTON
        ================================================== */}

        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();

            if (propertyId) {
              onToggleSave(propertyId);
            }
          }}
          aria-label={
            saved
              ? "Remove property from saved"
              : "Save property"
          }
          className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full bg-white/95 shadow-sm backdrop-blur transition hover:bg-white"
        >
          {saved ? (
            <BookmarkCheck className="h-5 w-5 text-primary" />
          ) : (
            <Bookmark className="h-5 w-5 text-gray-700" />
          )}
        </button>

        {/* ==================================================
            STATUS
        ================================================== */}

        {property.status && (
          <span className="absolute bottom-3 left-3 rounded-full bg-black/70 px-3 py-1 text-xs font-medium capitalize text-white backdrop-blur">
            {property.status}
          </span>
        )}
      </div>

      {/* ==================================================
          CARD CONTENT
      ================================================== */}

      <div className="space-y-4 p-5">
        {/* ==================================================
            TITLE
        ================================================== */}

        <div>
          <h3 className="line-clamp-1 text-lg font-semibold text-gray-900">
            {property.title || "Property"}
          </h3>

          <div className="mt-1 flex items-center gap-1.5 text-sm text-gray-500">
            <MapPin className="h-4 w-4 shrink-0" />

            <span className="line-clamp-1">
              {getLocation(property)}
            </span>
          </div>
        </div>

        {/* ==================================================
            PRICE
        ================================================== */}

        <div>
          <p className="text-xl font-bold text-gray-900">
            {formatPrice(property)}
          </p>

          {property.paymentType && (
            <p className="text-xs capitalize text-gray-500">
              {property.paymentType === "rent"
                ? "For rent"
                : "For sale"}
            </p>
          )}
        </div>

        {/* ==================================================
            PROPERTY META
        ================================================== */}

        <div className="flex flex-wrap gap-4 border-y py-3 text-sm text-gray-600">
          <div className="flex items-center gap-1.5">
            <Home className="h-4 w-4" />

            <span>
              {property.propertyType ||
                "Property"}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <BedDouble className="h-4 w-4" />

            <span>
              {property.bedrooms ?? 0} beds
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <Bath className="h-4 w-4" />

            <span>
              {property.bathrooms ?? 0} baths
            </span>
          </div>
        </div>

        {/* ==================================================
            WHY THIS MATCHES
        ================================================== */}

        <div className="rounded-xl bg-gray-50 p-4">
          <div className="mb-2 flex items-center gap-2">
            <Brain className="h-4 w-4 text-primary" />

            <span className="text-sm font-semibold text-gray-800">
              Why this may match you
            </span>
          </div>

          <p className="text-sm leading-5 text-gray-600">
            {reason}
          </p>

          {/* ==================================================
              MATCH TAGS
          ================================================== */}

          {Array.isArray(property.matchTags) &&
            property.matchTags.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {property.matchTags
                  .slice(0, 4)
                  .map((tag, index) => (
                    <span
                      key={`${tag}-${index}`}
                      className="rounded-full bg-white px-2.5 py-1 text-xs text-gray-600 ring-1 ring-gray-200"
                    >
                      {tag}
                    </span>
                  ))}
              </div>
            )}
        </div>

        {/* ==================================================
            OPEN DETAILS
        ================================================== */}

        <button
          type="button"
          onClick={() => onOpen(property)}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
        >
          View Property

          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </article>
  );
};

/*
==========================================================
MAIN PAGE
==========================================================
*/

const Recommendations = () => {
  const navigate = useNavigate();

  /*
  ========================================================
  STATE
  ========================================================
  */

  const [recommendations, setRecommendations] =
    useState([]);

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] = useState("");

  const [savedProperties, setSavedProperties] =
    useState([]);

  const [page, setPage] = useState(1);

  /*
  Number displayed per page.
  */

  const ITEMS_PER_PAGE = 9;

  /*
  ========================================================
  LOAD RECOMMENDATIONS
  ========================================================
  */

  const loadRecommendations = useCallback(
    async ({ refresh = false } = {}) => {
      try {
        if (refresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError("");

        /*
        Existing LeadFlow AI property architecture.

        The recommendation service already exists in
        propertyService.js.

        The primary method expected here is:

            getRecommendations()

        */

        const response =
          await propertyService.getRecommendations();

        const data = extractArray(response);

        const normalized = data
          .map(normalizeRecommendation)
          .filter(
            (property) =>
              Boolean(getPropertyId(property))
          );

        setRecommendations(normalized);

        setPage(1);
      } catch (requestError) {
        console.error(
          "Unable to load AI recommendations",
          requestError
        );

        setRecommendations([]);

        setError(
          requestError?.response?.data?.message ||
            requestError?.message ||
            "Unable to load recommendations. Please try again."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  /*
  ========================================================
  INITIAL LOAD
  ========================================================
  */

  useEffect(() => {
    setSavedProperties(loadSavedProperties());

    loadRecommendations();
  }, [loadRecommendations]);

  /*
  ========================================================
  SAVE / UNSAVE
  ========================================================
  */

  const handleToggleSave = (propertyId) => {
    setSavedProperties((previous) => {
      const alreadySaved =
        previous.includes(propertyId);

      const next = alreadySaved
        ? previous.filter(
            (id) => id !== propertyId
          )
        : [...previous, propertyId];

      persistSavedProperties(next);

      return next;
    });
  };

  /*
  ========================================================
  OPEN PROPERTY DETAILS
  ========================================================
  */

  const handleOpenProperty = (property) => {
    const propertyId =
      getPropertyId(property);

    if (!propertyId) {
      console.error(
        "Cannot open property without an ID",
        property
      );

      return;
    }

    /*
    Reuse the existing viewer property details
    route.

    If your existing AppRoutes.jsx uses a different
    route, change ONLY this navigation target.
    */

    navigate(
      `/viewer/properties/${propertyId}`
    );
  };

  /*
  ========================================================
  PAGINATION
  ========================================================
  */

  const totalPages = Math.max(
    1,
    Math.ceil(
      recommendations.length /
        ITEMS_PER_PAGE
    )
  );

  const visibleRecommendations =
    useMemo(() => {
      const start =
        (page - 1) * ITEMS_PER_PAGE;

      return recommendations.slice(
        start,
        start + ITEMS_PER_PAGE
      );
    }, [
      recommendations,
      page,
    ]);

  /*
  ========================================================
  PAGE CHANGE
  ========================================================
  */

  const goToPage = (nextPage) => {
    if (
      nextPage < 1 ||
      nextPage > totalPages
    ) {
      return;
    }

    setPage(nextPage);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  /*
  ========================================================
  LOADING STATE
  ========================================================
  */

  if (loading) {
    return (
      <section className="min-h-full bg-gray-50 px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          {/* Header skeleton */}

          <div className="mb-8 animate-pulse">
            <div className="h-8 w-72 rounded bg-gray-200" />

            <div className="mt-3 h-4 w-96 max-w-full rounded bg-gray-100" />
          </div>

          {/* Cards skeleton */}

          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({
              length: 6,
            }).map((_, index) => (
              <div
                key={index}
                className="overflow-hidden rounded-2xl border bg-white"
              >
                <div className="h-56 animate-pulse bg-gray-200" />

                <div className="space-y-4 p-5">
                  <div className="h-5 w-3/4 animate-pulse rounded bg-gray-200" />

                  <div className="h-4 w-1/2 animate-pulse rounded bg-gray-100" />

                  <div className="h-6 w-1/3 animate-pulse rounded bg-gray-200" />

                  <div className="h-12 animate-pulse rounded-xl bg-gray-100" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  /*
  ========================================================
  PAGE
  ========================================================
  */

  return (
    <section className="min-h-full bg-gray-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* ==================================================
            PAGE HEADER
        ================================================== */}

        <header className="mb-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="mb-3 flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
                  <Sparkles className="h-5 w-5 text-primary" />
                </span>

                <span className="text-sm font-semibold text-primary">
                  LeadFlow AI
                </span>
              </div>

              <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
                Recommended for You
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500 sm:text-base">
                Explore properties that may match
                your preferences, requirements, and
                property discovery activity.
              </p>
            </div>

            {/* ==================================================
                REFRESH
            ================================================== */}

            <button
              type="button"
              onClick={() =>
                loadRecommendations({
                  refresh: true,
                })
              }
              disabled={refreshing}
              className="inline-flex items-center justify-center gap-2 rounded-xl border bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw
                className={`h-4 w-4 ${
                  refreshing
                    ? "animate-spin"
                    : ""
                }`}
              />

              {refreshing
                ? "Refreshing..."
                : "Refresh recommendations"}
            </button>
          </div>
        </header>

        {/* ==================================================
            ERROR
        ================================================== */}

        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />

            <div className="flex-1">
              <h2 className="text-sm font-semibold text-red-800">
                Recommendations unavailable
              </h2>

              <p className="mt-1 text-sm text-red-700">
                {error}
              </p>

              <button
                type="button"
                onClick={() =>
                  loadRecommendations()
                }
                className="mt-3 text-sm font-semibold text-red-800 underline underline-offset-2"
              >
                Try again
              </button>
            </div>
          </div>
        )}

        {/* ==================================================
            EMPTY STATE
        ================================================== */}

        {!error &&
          recommendations.length === 0 && (
            <div className="flex min-h-[420px] items-center justify-center rounded-2xl border bg-white px-6 py-12 text-center">
              <div className="max-w-md">
                <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                  <Sparkles className="h-8 w-8 text-primary" />
                </div>

                <h2 className="text-xl font-semibold text-gray-900">
                  No recommendations yet
                </h2>

                <p className="mt-2 text-sm leading-6 text-gray-500">
                  We don't have personalized property
                  recommendations for you yet. Browse
                  available properties and interact with
                  listings to build your discovery
                  preferences.
                </p>

                <button
                  type="button"
                  onClick={() =>
                    navigate(
                      "/viewer/properties"
                    )
                  }
                  className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
                >
                  Browse Properties

                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

        {/* ==================================================
            RECOMMENDATION CONTENT
        ================================================== */}

        {recommendations.length > 0 && (
          <>
            {/* ==================================================
                SUMMARY
            ================================================== */}

            <div className="mb-6 flex flex-col gap-3 rounded-2xl border bg-white p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  {recommendations.length}{" "}
                  {recommendations.length === 1
                    ? "property"
                    : "properties"}{" "}
                  recommended
                </p>

                <p className="mt-1 text-xs text-gray-500">
                  Recommendations are based on
                  available property data and your
                  viewer discovery activity.
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Brain className="h-4 w-4 text-primary" />

                AI-assisted discovery
              </div>
            </div>

            {/* ==================================================
                CARDS
            ================================================== */}

            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {visibleRecommendations.map(
                (property) => {
                  const propertyId =
                    getPropertyId(
                      property
                    );

                  return (
                    <RecommendationCard
                      key={propertyId}
                      property={property}
                      saved={savedProperties.includes(
                        propertyId
                      )}
                      onToggleSave={
                        handleToggleSave
                      }
                      onOpen={
                        handleOpenProperty
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
              <div className="mt-8 flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    goToPage(page - 1)
                  }
                  disabled={page === 1}
                  aria-label="Previous page"
                  className="flex h-10 w-10 items-center justify-center rounded-lg border bg-white text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>

                {Array.from(
                  {
                    length: totalPages,
                  },
                  (_, index) =>
                    index + 1
                ).map((pageNumber) => (
                  <button
                    key={pageNumber}
                    type="button"
                    onClick={() =>
                      goToPage(
                        pageNumber
                      )
                    }
                    className={`flex h-10 min-w-10 items-center justify-center rounded-lg px-3 text-sm font-semibold transition ${
                      page === pageNumber
                        ? "bg-primary text-primary-foreground"
                        : "border bg-white text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {pageNumber}
                  </button>
                ))}

                <button
                  type="button"
                  onClick={() =>
                    goToPage(page + 1)
                  }
                  disabled={
                    page === totalPages
                  }
                  aria-label="Next page"
                  className="flex h-10 w-10 items-center justify-center rounded-lg border bg-white text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            )}

            {/* ==================================================
                FOOTER INFORMATION
            ================================================== */}

            <div className="mt-10 rounded-2xl border bg-white p-5">
              <div className="flex items-start gap-3">
                <Brain className="mt-0.5 h-5 w-5 shrink-0 text-primary" />

                <div>
                  <h3 className="text-sm font-semibold text-gray-900">
                    About your recommendations
                  </h3>

                  <p className="mt-1 text-sm leading-6 text-gray-500">
                    LeadFlow AI uses property information
                    such as location, property type,
                    price, bedrooms, and other available
                    matching signals to surface relevant
                    listings. Recommendations are
                    informational and should be reviewed
                    against the property's current
                    details and availability.
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </section>
  );
};

export default Recommendations;