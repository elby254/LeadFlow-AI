/**
 * ==========================================================
 *
 * SHARED ADMIN + AGENT
 * AI PROPERTY RECOMMENDATIONS
 *
 * Routes
 * ------
 * Admin:
 * /admin/properties/recommendations
 *
 * Agent:
 * /agent/properties/recommendations
 *
 * Purpose
 * -------
 * Displays AI-generated property recommendations.
 *
 * LeadFlow AI compares:
 *
 * • Budget
 * • Preferred Location
 * • Bedrooms
 * • Property Type
 * • Qualification Score
 * • Purchase Timeline
 *
 * Backend
 * -------
 * GET /api/properties/recommendations
 *
 * IMPORTANT
 * ---------
 * This component is SHARED between Admin and Agent.
 *
 * It does NOT render MainLayout.
 *
 * MainLayout is provided by the parent route.
 *
 * ==========================================================
 *
 * ROLE BEHAVIOUR
 * ==========================================================
 *
 * ADMIN
 * -----
 * • Can view recommendations
 * • Can refresh recommendations
 * • Can view properties
 * • Can add properties when inventory is empty
 *
 * AGENT
 * -----
 * • Can view recommendations
 * • Can refresh recommendations
 * • Can view properties
 * • Cannot add properties from this page
 *
 * ==========================================================
 *
 * IMAGE ARCHITECTURE
 * ==========================================================
 *
 * Recommendations MUST display the property's EXISTING
 * cover image.
 *
 * Image resolution is handled centrally by:
 *
 *     getPropertyImageUrl(property)
 *
 * This component MUST NOT:
 *
 * • Generate a new image
 * • Create a PropertyImage
 * • Upload an image
 * • Construct a fake coverImage object
 * • Inspect property.images[]
 * • Independently resolve image fields
 *
 * ==========================================================
 */

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useLocation,
  useNavigate,
} from "react-router-dom";

import usePropertyRecommendations from "../../hooks/usePropertyRecommendations";

import {
  getPropertyImageUrl,
} from "../../utils/propertyImage";


/* ==========================================================
   CONSTANTS
========================================================== */

const PLACEHOLDER_IMAGE =
  "/placeholder-property.jpg";


/* ==========================================================
   ROLE / ROUTE HELPERS
========================================================== */

/**
 * Determines whether the current page belongs to the
 * Agent workspace.
 *
 * The same component can therefore safely operate under:
 *
 * /admin/...
 *
 * and:
 *
 * /agent/...
 */
const getWorkspaceRole = (pathname = "") => {
  const normalizedPath =
    String(pathname)
      .trim()
      .toLowerCase();

  if (
    normalizedPath.startsWith("/agent")
  ) {
    return "agent";
  }

  if (
    normalizedPath.startsWith("/admin")
  ) {
    return "admin";
  }

  return "admin";
};


/**
 * Safely obtains a property identifier.
 */
const getPropertyId = (property) => {
  return (
    property?._id ||
    property?.id ||
    ""
  );
};


/* ==========================================================
   COMPONENT
========================================================== */

const Recommendations = () => {

  const navigate = useNavigate();

  const location = useLocation();


  /* ========================================================
     WORKSPACE
  ======================================================== */

  const workspaceRole =
    useMemo(
      () =>
        getWorkspaceRole(
          location?.pathname
        ),
      [location?.pathname]
    );


  const isAgent =
    workspaceRole === "agent";

  const isAdmin =
    workspaceRole === "admin";


  /* ========================================================
     AI RECOMMENDATION DATA
  ======================================================== */

  const {
    recommendations,
    loading,
    error,
    refreshRecommendations,
  } = usePropertyRecommendations();


  /* ========================================================
     LOCAL PAGE STATE
     
     Prevents the UI from remaining stuck indefinitely if
     the recommendation request does not resolve.
  ======================================================== */

  const [
    requestTimedOut,
    setRequestTimedOut,
  ] = useState(false);


  /* ========================================================
     NORMALIZE RECOMMENDATIONS
     
     Always work with an array.
  ======================================================== */

  const safeRecommendations =
    useMemo(() => {

      if (
        !Array.isArray(
          recommendations
        )
      ) {
        return [];
      }

      return recommendations.filter(
        (property) =>
          property &&
          typeof property === "object"
      );

    }, [
      recommendations,
    ]);


  /* ========================================================
     LOADING TIMEOUT
     
     This only controls the UI.
     
     It does NOT cancel the backend request.
  ======================================================== */

  useEffect(() => {

    if (!loading) {

      setRequestTimedOut(false);

      return undefined;
    }


    const timeout =
      window.setTimeout(() => {

        setRequestTimedOut(true);

      }, 10000);


    return () => {

      window.clearTimeout(
        timeout
      );

    };

  }, [
    loading,
  ]);


  /* ========================================================
     REFRESH HANDLER
  ======================================================== */

  const handleRefresh =
    async () => {

      setRequestTimedOut(false);

      try {

        await refreshRecommendations();

      } catch (
        refreshError
      ) {

        console.error(
          "AI RECOMMENDATIONS REFRESH ERROR:",
          refreshError
        );

      }

    };


  /* ========================================================
     VIEW PROPERTY
     
     IMPORTANT
     --------------------------------------------------------
     We remain inside the current workspace.
     
     Admin:
       /admin/properties/:id
     
     Agent:
       /agent/properties/:id
  ======================================================== */

  const handleViewProperty =
    (property) => {

      const propertyId =
        getPropertyId(
          property
        );


      if (!propertyId) {

        console.error(
          "AI RECOMMENDATIONS - Property ID unavailable:",
          property
        );

        return;
      }


      navigate(
        `/${workspaceRole}/properties/${encodeURIComponent(
          String(propertyId)
        )}`
      );

    };


  /* ========================================================
     ADD PROPERTY
     
     Admin-only action.
  ======================================================== */

  const handleAddProperty =
    () => {

      if (!isAdmin) {

        console.warn(
          "AI RECOMMENDATIONS - Agent attempted to access admin-only Add Property action."
        );

        return;
      }


      navigate(
        "/admin/properties/add"
      );

    };


  /* ========================================================
     INVENTORY
     
     Admin and Agent use their own workspace inventory route.
  ======================================================== */

  const handleViewInventory =
    () => {

      navigate(
        `/${workspaceRole}/properties`
      );

    };


  /* ========================================================
     LOADING STATE
     
     Only display the loading screen while the request is
     actively loading and has not timed out.
  ======================================================== */

  if (
    loading &&
    !requestTimedOut
  ) {

    return (

      <div className="space-y-8">

        {/* ==================================================
            HEADER
        ================================================== */}

        <div>

          <div className="flex items-center gap-3">

            <div
              className="
                flex
                h-11
                w-11
                items-center
                justify-center
                rounded-xl
                bg-violet-500/10
                text-violet-400
              "
            >
              ✨
            </div>


            <h1
              className="
                text-3xl
                font-bold
                text-white
              "
            >
              AI Property Recommendations
            </h1>

          </div>


          <p
            className="
              mt-2
              text-slate-400
            "
          >
            Checking the current property inventory for
            suitable AI matches.
          </p>

        </div>


        {/* ==================================================
            LOADING INDICATOR
        ================================================== */}

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
              animate-pulse
              items-center
              justify-center
              rounded-full
              bg-violet-500/10
              text-3xl
            "
          >
            ✨
          </div>


          <h2
            className="
              mt-5
              text-xl
              font-bold
              text-white
            "
          >
            Finding property matches...
          </h2>


          <p
            className="
              mx-auto
              mt-2
              max-w-xl
              text-slate-400
            "
          >
            LeadFlow AI is checking the available property
            inventory for suitable matches.
          </p>

        </div>

      </div>

    );
  }


  /* ========================================================
     PAGE
  ======================================================== */

  return (

    <div className="space-y-8">

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

          <div className="flex items-center gap-3">

            <div
              className="
                flex
                h-11
                w-11
                items-center
                justify-center
                rounded-xl
                bg-violet-500/10
                text-violet-400
              "
            >
              ✨
            </div>


            <div>

              <h1
                className="
                  text-3xl
                  font-bold
                  text-white
                "
              >
                AI Property Recommendations
              </h1>


              <p
                className="
                  mt-2
                  text-slate-400
                "
              >
                Properties matched automatically by
                LeadFlow AI.
              </p>

            </div>

          </div>

        </div>


        {/* ==================================================
            REFRESH
        ================================================== */}

        <button
          type="button"
          onClick={
            handleRefresh
          }
          disabled={
            loading
          }
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
            disabled:cursor-not-allowed
            disabled:opacity-50
          "
        >

          {loading
            ? "Checking..."
            : "Refresh"}

        </button>

      </div>


      {/* ====================================================
          ERROR STATE
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

          <div className="flex items-start gap-4">

            <div className="text-2xl">
              ⚠️
            </div>


            <div className="flex-1">

              <h2
                className="
                  font-semibold
                  text-white
                "
              >
                Unable to load AI recommendations
              </h2>


              <p
                className="
                  mt-1
                  text-sm
                  leading-6
                  text-red-300
                "
              >
                {error}
              </p>


              <button
                type="button"
                onClick={
                  handleRefresh
                }
                className="
                  mt-4
                  rounded-xl
                  bg-red-500/20
                  px-4
                  py-2
                  text-sm
                  font-semibold
                  text-red-300
                  transition
                  hover:bg-red-500/30
                "
              >
                Try Again
              </button>

            </div>

          </div>

        </div>

      )}


      {/* ====================================================
          TIMEOUT STATE
      ==================================================== */}

      {requestTimedOut &&
        loading && (

          <div
            className="
              rounded-2xl
              border
              border-amber-500/20
              bg-amber-500/10
              p-5
            "
          >

            <div className="flex items-start gap-4">

              <div className="text-2xl">
                ⏳
              </div>


              <div className="flex-1">

                <h2
                  className="
                    font-semibold
                    text-white
                  "
                >
                  Recommendation request is taking longer
                  than expected
                </h2>


                <p
                  className="
                    mt-1
                    text-sm
                    leading-6
                    text-amber-300
                  "
                >
                  The recommendation service has not
                  responded yet. You can try again or
                  continue working with the property
                  inventory.
                </p>


                <div
                  className="
                    mt-4
                    flex
                    flex-wrap
                    gap-3
                  "
                >

                  <button
                    type="button"
                    onClick={
                      handleRefresh
                    }
                    disabled={
                      loading
                    }
                    className="
                      rounded-xl
                      bg-amber-500/20
                      px-4
                      py-2
                      text-sm
                      font-semibold
                      text-amber-200
                      transition
                      hover:bg-amber-500/30
                      disabled:opacity-50
                    "
                  >
                    Try Again
                  </button>


                  <button
                    type="button"
                    onClick={
                      handleViewInventory
                    }
                    className="
                      rounded-xl
                      border
                      border-slate-700
                      px-4
                      py-2
                      text-sm
                      font-semibold
                      text-white
                      transition
                      hover:bg-slate-800
                    "
                  >
                    View Properties
                  </button>

                </div>

              </div>

            </div>

          </div>

        )}


      {/* ====================================================
          NO PROPERTIES AVAILABLE
          
          Covers:
          
          • Empty recommendation response
          • No suitable matches
          • Empty property inventory
          • Recommendation timeout
      ==================================================== */}

      {safeRecommendations.length === 0 &&
        (!error ||
          requestTimedOut) && (

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

            {/* ==================================================
                ICON
            ================================================== */}

            <div
              className="
                mx-auto
                flex
                h-20
                w-20
                items-center
                justify-center
                rounded-full
                border
                border-violet-500/20
                bg-violet-500/10
                text-4xl
              "
            >
              🤖
            </div>


            {/* ==================================================
                TITLE
            ================================================== */}

            <h2
              className="
                mt-6
                text-2xl
                font-bold
                text-white
              "
            >
              No Properties Available for AI Matching
            </h2>


            {/* ==================================================
                DESCRIPTION
            ================================================== */}

            <p
              className="
                mx-auto
                mt-3
                max-w-2xl
                leading-7
                text-slate-400
              "
            >
              There are currently no suitable properties
              available for LeadFlow AI to match. Add
              available properties to your inventory and
              AI recommendations will appear here when
              suitable matches are found.
            </p>


            {/* ==================================================
                INVENTORY ACTIONS
            ================================================== */}

            <div
              className="
                mt-8
                flex
                flex-col
                items-center
                justify-center
                gap-3
                sm:flex-row
              "
            >

              {/* ==================================================
                  ADMIN ONLY
              ================================================== */}

              {isAdmin && (

                <button
                  type="button"
                  onClick={
                    handleAddProperty
                  }
                  className="
                    rounded-xl
                    bg-cyan-500
                    px-5
                    py-3
                    font-semibold
                    text-slate-950
                    transition
                    hover:bg-cyan-400
                  "
                >
                  Add Property
                </button>

              )}


              {/* ==================================================
                  BOTH ADMIN + AGENT
              ================================================== */}

              <button
                type="button"
                onClick={
                  handleViewInventory
                }
                className="
                  rounded-xl
                  border
                  border-slate-700
                  px-5
                  py-3
                  font-semibold
                  text-white
                  transition
                  hover:bg-slate-800
                "
              >
                View Properties
              </button>


              <button
                type="button"
                onClick={
                  handleRefresh
                }
                className="
                  rounded-xl
                  border
                  border-slate-700
                  px-5
                  py-3
                  font-semibold
                  text-white
                  transition
                  hover:bg-slate-800
                "
              >
                Check Again
              </button>

            </div>


            {/* ==================================================
                AI MATCHING EXPLANATION
            ================================================== */}

            <div
              className="
                mx-auto
                mt-8
                max-w-2xl
                rounded-2xl
                border
                border-slate-800
                bg-slate-950
                p-5
                text-left
              "
            >

              <p
                className="
                  text-sm
                  font-semibold
                  text-slate-300
                "
              >
                AI matching uses available inventory
              </p>


              <p
                className="
                  mt-2
                  text-sm
                  leading-6
                  text-slate-500
                "
              >
                LeadFlow AI can match properties using
                factors such as budget, location, bedrooms,
                property type, qualification score, and
                purchase timeline.
              </p>

            </div>

          </div>

        )}


      {/* ====================================================
          RECOMMENDATION CARDS
      ==================================================== */}

      {safeRecommendations.length > 0 && (

        <div
          className="
            grid
            gap-6
            lg:grid-cols-2
            xl:grid-cols-3
          "
        >

          {safeRecommendations.map(
            (property, index) => {

              /* ==================================================
                 PROPERTY ID
              ================================================== */

              const propertyId =
                getPropertyId(
                  property
                );


              /* ==================================================
                 EXISTING PROPERTY COVER IMAGE
                 
                 IMPORTANT:
                 
                 This resolves the property's EXISTING
                 Property.coverImage.
                 
                 It does NOT generate a new image.
                 
                 It does NOT create a PropertyImage.
                 
                 It does NOT upload anything.
              ================================================== */

              const imageUrl =
                getPropertyImageUrl(
                  property
                ) ||
                PLACEHOLDER_IMAGE;


              return (

                <article
                  key={
                    propertyId ||
                    `${property?.title || "property"}-${index}`
                  }
                  className="
                    overflow-hidden
                    rounded-3xl
                    border
                    border-violet-500/20
                    bg-slate-900
                    shadow-xl
                    transition
                    hover:border-violet-500/40
                  "
                >

                  {/* ==================================================
                      PROPERTY IMAGE
                  ================================================== */}

                  <div
                    className="
                      relative
                      bg-slate-950
                    "
                  >

                    <img
                      src={
                        imageUrl
                      }
                      alt={
                        property?.title ||
                        "Recommended property"
                      }
                      className="
                        h-56
                        w-full
                        object-cover
                      "
                      loading="lazy"
                      onError={(
                        event
                      ) => {

                        console.error(
                          "RECOMMENDATIONS - Failed to load property cover image:",
                          imageUrl
                        );


                        if (
                          event
                            .currentTarget
                            .src !==
                          window.location.origin +
                            PLACEHOLDER_IMAGE
                        ) {

                          event
                            .currentTarget
                            .src =
                            PLACEHOLDER_IMAGE;

                        }

                      }}
                    />


                    {/* ==================================================
                        MATCH BADGE
                    ================================================== */}

                    <div
                      className="
                        absolute
                        right-4
                        top-4
                        rounded-full
                        bg-violet-500
                        px-3
                        py-1
                        text-sm
                        font-bold
                        text-white
                        shadow-lg
                      "
                    >
                      {property?.score ?? 0}% Match
                    </div>

                  </div>


                  {/* ==================================================
                      PROPERTY INFORMATION
                  ================================================== */}

                  <div
                    className="
                      space-y-5
                      p-6
                    "
                  >

                    {/* ==================================================
                        TITLE + LOCATION
                    ================================================== */}

                    <div>

                      <h2
                        className="
                          line-clamp-2
                          text-xl
                          font-bold
                          text-white
                        "
                      >
                        {property?.title ||
                          "Untitled Property"}
                      </h2>


                      <p
                        className="
                          mt-1
                          line-clamp-2
                          text-slate-400
                        "
                      >
                        {property?.location ||
                          "Location not specified"}
                      </p>

                    </div>


                    {/* ==================================================
                        PRICE + MATCH STATUS
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
                        {property?.currency ||
                          "KES"}{" "}

                        {Number(
                          property?.price || 0
                        ).toLocaleString()}
                      </span>


                      <span
                        className="
                          rounded-full
                          bg-emerald-500/20
                          px-3
                          py-1
                          text-sm
                          font-semibold
                          text-emerald-400
                        "
                      >
                        AI Match
                      </span>

                    </div>


                    {/* ==================================================
                        AI REASON
                    ================================================== */}

                    {property?.reason && (

                      <div
                        className="
                          rounded-xl
                          bg-slate-950
                          p-4
                        "
                      >

                        <p
                          className="
                            text-sm
                            leading-6
                            text-slate-300
                          "
                        >
                          🤖{" "}
                          {property.reason}
                        </p>

                      </div>

                    )}


                    {/* ==================================================
                        PROPERTY DETAILS
                    ================================================== */}

                    <div
                      className="
                        grid
                        grid-cols-2
                        gap-3
                        text-sm
                        text-slate-300
                      "
                    >

                      <div>
                        🛏{" "}
                        {property?.bedrooms ??
                          "-"}{" "}
                        Bedrooms
                      </div>


                      <div>
                        🛁{" "}
                        {property?.bathrooms ??
                          "-"}{" "}
                        Bathrooms
                      </div>


                      <div>
                        🏠{" "}
                        {property?.propertyType ||
                          "-"}
                      </div>


                      <div>
                        📍{" "}
                        {property?.location ||
                          "-"}
                      </div>

                    </div>


                    {/* ==================================================
                        VIEW PROPERTY
                    ================================================== */}

                    {propertyId ? (

                      <button
                        type="button"
                        onClick={() =>
                          handleViewProperty(
                            property
                          )
                        }
                        className="
                          w-full
                          rounded-xl
                          bg-cyan-500
                          py-3
                          font-semibold
                          text-slate-950
                          transition
                          hover:bg-cyan-400
                          focus:outline-none
                          focus:ring-2
                          focus:ring-cyan-500
                          focus:ring-offset-2
                          focus:ring-offset-slate-900
                        "
                      >
                        View Property
                      </button>

                    ) : (

                      <div
                        className="
                          rounded-xl
                          bg-slate-800
                          px-4
                          py-3
                          text-center
                          text-sm
                          text-slate-400
                        "
                      >
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

  );
};


/* ==========================================================
   EXPORT
========================================================== */

export default Recommendations;