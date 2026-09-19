/**
 * ==========================================================
 *
 * Purpose
 * ----------------------------------------------------------
 * Displays AI-recommended properties for the
 * currently selected lead.
 *
 * Used In
 * ----------------------------------------------------------
 * • Conversation Center
 * • Lead Details
 * • Agent Dashboard
 * • AI Assistant
 *
 * Data Source
 * ----------------------------------------------------------
 * useAISuggestions()
 *
 * Backend
 * ----------------------------------------------------------
 * POST /api/ai/property-match
 * GET  /api/properties/recommended/:leadId
 *
 * IMAGE ARCHITECTURE
 * ----------------------------------------------------------
 *
 * Lead
 *   ↓
 * Recommendation Engine
 *   ↓
 * Existing Property
 *   ↓
 * Existing PropertyImage
 *   ↓
 * Same PropertyImage URL
 *
 * IMPORTANT
 * ----------------------------------------------------------
 * This component MUST NOT generate, create, upload, or
 * replace property images.
 *
 * The recommendation engine returns an existing property.
 *
 * That property's existing:
 *
 *     property.coverImage
 *              ↓
 *       PropertyImage
 *              ↓
 *          PropertyImage.url
 *
 * is resolved through:
 *
 *     getPropertyImageUrl(property)
 *
 * This guarantees that the recommendation panel displays
 * the same cover image already associated with the property.
 *
 * ==========================================================
 */

import {
  Sparkles,
  Home,
  RotateCw,
  Loader2,
  AlertTriangle,
} from "lucide-react";

import useAISuggestions from "../../../hooks/useAISuggestions";

import getPropertyImageUrl from "../../../utils/propertyImage";


/* ==========================================================
   PROPERTY RECOMMENDATION PANEL
========================================================== */

const PropertyRecommendationPanel = ({
  lead,
  onInsertProperty,
  onViewProperty,
  onCompareProperty,
  onBookmarkProperty,
}) => {

  /* ========================================================
     AI DATA
  ======================================================== */

  const {
    loading,
    error,
    refreshAI,
    recommendedProperties,
  } = useAISuggestions();


  /* ========================================================
     NORMALIZE RECOMMENDATIONS
     
     Always work with an array.
     
     This protects the component if the hook temporarily
     returns null or undefined.
  ======================================================== */

  const safeRecommendations = Array.isArray(
    recommendedProperties
  )
    ? recommendedProperties
    : [];


  /* ========================================================
     REFRESH
  ======================================================== */

  const handleRefresh = () => {

    if (!lead?.id) {
      return;
    }

    refreshAI(lead.id);

  };


  /* ========================================================
     EMPTY LEAD
  ======================================================== */

  if (!lead) {

    return (

      <aside
        className="
          rounded-3xl
          border
          border-slate-800
          bg-slate-900
          p-8
          shadow-xl
        "
      >

        <div className="text-center">

          <Home
            className="
              mx-auto
              h-16
              w-16
              text-slate-600
            "
          />

          <h2
            className="
              mt-5
              text-xl
              font-bold
              text-white
            "
          >
            No Lead Selected
          </h2>

          <p
            className="
              mt-3
              text-sm
              leading-7
              text-slate-400
            "
          >
            Select a lead to generate
            AI-powered property recommendations.
          </p>

        </div>

      </aside>

    );

  }


  /* ========================================================
     COMPONENT
  ======================================================== */

  return (

    <aside
      className="
        overflow-hidden
        rounded-3xl
        border
        border-slate-800
        bg-slate-900
        shadow-xl
      "
    >

      {/* =====================================================
          HEADER
      ===================================================== */}

      <div
        className="
          flex
          items-center
          justify-between
          border-b
          border-slate-800
          bg-gradient-to-r
          from-cyan-600/10
          to-blue-600/10
          p-6
        "
      >

        <div
          className="
            flex
            items-center
            gap-4
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
              bg-cyan-500/10
            "
          >

            <Sparkles
              className="
                h-6
                w-6
                text-cyan-400
              "
            />

          </div>

          <div>

            <h2
              className="
                text-xl
                font-bold
                text-white
              "
            >
              AI Property Matches
            </h2>

            <p
              className="
                text-sm
                text-slate-400
              "
            >
              Ranked recommendations
              for this customer
            </p>

          </div>

        </div>


        {/* ===================================================
            REFRESH
        =================================================== */}

        <button
          type="button"
          onClick={handleRefresh}
          disabled={loading || !lead?.id}
          aria-label="Refresh property recommendations"
          title="Refresh property recommendations"
          className="
            rounded-xl
            border
            border-slate-700
            bg-slate-800
            p-3
            transition
            hover:border-cyan-500/40
            hover:bg-slate-700
            disabled:cursor-not-allowed
            disabled:opacity-50
          "
        >

          {loading ? (

            <Loader2
              className="
                h-5
                w-5
                animate-spin
                text-cyan-400
              "
            />

          ) : (

            <RotateCw
              className="
                h-5
                w-5
                text-cyan-400
              "
            />

          )}

        </button>

      </div>


      {/* =====================================================
          ERROR
      ===================================================== */}

      {error && (

        <div
          className="
            m-6
            flex
            items-start
            gap-3
            rounded-2xl
            border
            border-red-500/20
            bg-red-500/10
            p-4
          "
        >

          <AlertTriangle
            className="
              mt-0.5
              h-5
              w-5
              shrink-0
              text-red-400
            "
          />

          <p
            className="
              text-sm
              text-red-300
            "
          >
            {error}
          </p>

        </div>

      )}


      {/* =====================================================
          LOADING
      ===================================================== */}

      {loading && (

        <div className="space-y-5 p-6">

          {[1, 2, 3].map((item) => (

            <div
              key={item}
              className="
                h-48
                animate-pulse
                rounded-2xl
                bg-slate-800
              "
            />

          ))}

        </div>

      )}


      {/* =====================================================
          EMPTY RECOMMENDATIONS
      ===================================================== */}

      {!loading &&
        safeRecommendations.length === 0 && (

        <div className="p-8">

          <div
            className="
              rounded-2xl
              border
              border-slate-800
              bg-slate-950/40
              p-8
              text-center
            "
          >

            <Home
              className="
                mx-auto
                h-12
                w-12
                text-slate-600
              "
            />

            <h3
              className="
                mt-5
                text-lg
                font-semibold
                text-white
              "
            >
              No Recommendations Available
            </h3>

            <p
              className="
                mt-3
                text-sm
                leading-7
                text-slate-400
              "
            >
              AI couldn't find matching
              properties for this lead yet.
            </p>

            <button
              type="button"
              onClick={handleRefresh}
              disabled={loading}
              className="
                mt-6
                rounded-xl
                bg-cyan-500
                px-5
                py-3
                text-sm
                font-semibold
                text-slate-950
                transition
                hover:bg-cyan-400
                disabled:cursor-not-allowed
                disabled:opacity-50
              "
            >
              Find Matches
            </button>

          </div>

        </div>

      )}


      {/* =====================================================
          PROPERTY RECOMMENDATION CARDS
      ===================================================== */}

      {!loading &&
        safeRecommendations.length > 0 && (

        <div
          className="
            space-y-6
            p-6
          "
        >

          {safeRecommendations.map((property, index) => {

            /* =================================================
               PROPERTY IDENTIFIER
               
               Different backend response shapes may use:
               
               property.id
               property._id
               property.propertyId
            ================================================= */

            const propertyId =
              property?.id ||
              property?._id ||
              property?.propertyId ||
              `recommended-property-${index}`;


            /* =================================================
               EXISTING COVER IMAGE
               
               IMPORTANT:
               
               We resolve the image ONLY from the existing
               property data.
               
               No image generation.
               No image upload.
               No new PropertyImage.
               
               Expected architecture:
               
               property.coverImage
                       ↓
               PropertyImage
                       ↓
               PropertyImage.url
            ================================================= */

            const propertyImageUrl =
              getPropertyImageUrl(property);


            /* =================================================
               FALLBACK IMAGE
               
               This is ONLY a frontend display fallback.
               
               It does not create a PropertyImage and does
               not modify the property.
            ================================================= */

            const imageSource =
              propertyImageUrl ||
              "/images/property-placeholder.jpg";


            /* =================================================
               NORMALIZED DISPLAY VALUES
            ================================================= */

            const propertyTitle =
              property?.title ||
              "Untitled Property";

            const propertyLocation =
              property?.location ||
              "Location not specified";

            const propertyType =
              property?.propertyType ||
              property?.type ||
              "Property";

            const propertyPrice =
              property?.price !== undefined &&
              property?.price !== null
                ? property.price
                : "Price on request";

            const propertyBedrooms =
              property?.bedrooms ??
              "-";

            const propertyBathrooms =
              property?.bathrooms ??
              "-";

            const propertyParking =
              property?.parking ||
              property?.parkingSpaces ||
              "N/A";

            const matchScore =
              property?.matchScore ??
              property?.score ??
              0;

            const aiReason =
              property?.aiReason ||
              property?.reason ||
              "This property closely matches the customer's preferred location, budget, property type and purchasing intent.";


            return (

              <article
                key={propertyId}
                className="
                  overflow-hidden
                  rounded-3xl
                  border
                  border-slate-800
                  bg-slate-950/40
                  transition-all
                  duration-300
                  hover:-translate-y-1
                  hover:border-cyan-500/30
                  hover:shadow-xl
                  hover:shadow-cyan-500/10
                "
              >

                {/* ==========================================
                    PROPERTY IMAGE
                ========================================== */}

                <div className="relative">

                  <img
                    src={imageSource}
                    alt={propertyTitle}
                    className="
                      h-56
                      w-full
                      object-cover
                    "
                    onError={(event) => {

                      /*
                       * Prevent an infinite onError loop if
                       * the placeholder itself cannot load.
                       */

                      if (
                        event.currentTarget.src.endsWith(
                          "/images/property-placeholder.jpg"
                        )
                      ) {
                        return;
                      }

                      event.currentTarget.src =
                        "/images/property-placeholder.jpg";

                    }}
                  />


                  {/* ========================================
                      EXISTING IMAGE INDICATOR
                      
                      This makes the architecture explicit:
                      the image belongs to the property.
                  ======================================== */}

                  {propertyImageUrl && (

                    <div
                      className="
                        absolute
                        bottom-4
                        left-4
                        rounded-full
                        bg-slate-950/85
                        px-3
                        py-1.5
                        text-xs
                        font-medium
                        text-slate-200
                        backdrop-blur
                      "
                    >
                      Property Cover
                    </div>

                  )}


                  {/* ========================================
                      MATCH BADGE
                  ======================================== */}

                  <div
                    className="
                      absolute
                      left-4
                      top-4
                      rounded-full
                      bg-emerald-500
                      px-4
                      py-2
                      text-xs
                      font-bold
                      text-white
                      shadow-lg
                    "
                  >
                    {matchScore}% Match
                  </div>


                  {/* ========================================
                      PROPERTY TYPE
                  ======================================== */}

                  <div
                    className="
                      absolute
                      right-4
                      top-4
                      rounded-full
                      bg-slate-900/90
                      px-4
                      py-2
                      text-xs
                      font-semibold
                      text-white
                      backdrop-blur
                    "
                  >
                    {propertyType}
                  </div>

                </div>


                {/* ==========================================
                    CONTENT
                ========================================== */}

                <div className="p-6">

                  <div
                    className="
                      flex
                      items-start
                      justify-between
                      gap-4
                    "
                  >

                    <div className="min-w-0">

                      <h3
                        className="
                          text-xl
                          font-bold
                          text-white
                        "
                      >
                        {propertyTitle}
                      </h3>

                      <p
                        className="
                          mt-2
                          text-sm
                          text-slate-400
                        "
                      >
                        {propertyLocation}
                      </p>

                    </div>


                    {/* ======================================
                        PRICE
                    ====================================== */}

                    <div
                      className="
                        shrink-0
                        text-right
                      "
                    >

                      <p
                        className="
                          text-xs
                          uppercase
                          tracking-wide
                          text-slate-500
                        "
                      >
                        Price
                      </p>

                      <h3
                        className="
                          mt-1
                          text-xl
                          font-bold
                          text-cyan-400
                        "
                      >

                        {typeof propertyPrice === "number"
                          ? `KES ${propertyPrice.toLocaleString()}`
                          : propertyPrice}

                      </h3>

                    </div>

                  </div>


                  {/* =========================================
                      PROPERTY DETAILS
                  ========================================= */}

                  <div
                    className="
                      mt-6
                      grid
                      grid-cols-3
                      gap-4
                    "
                  >

                    <div
                      className="
                        rounded-xl
                        border
                        border-slate-800
                        bg-slate-900
                        p-4
                        text-center
                      "
                    >

                      <p
                        className="
                          text-xs
                          text-slate-500
                        "
                      >
                        Bedrooms
                      </p>

                      <p
                        className="
                          mt-2
                          font-bold
                          text-white
                        "
                      >
                        {propertyBedrooms}
                      </p>

                    </div>


                    <div
                      className="
                        rounded-xl
                        border
                        border-slate-800
                        bg-slate-900
                        p-4
                        text-center
                      "
                    >

                      <p
                        className="
                          text-xs
                          text-slate-500
                        "
                      >
                        Bathrooms
                      </p>

                      <p
                        className="
                          mt-2
                          font-bold
                          text-white
                        "
                      >
                        {propertyBathrooms}
                      </p>

                    </div>


                    <div
                      className="
                        rounded-xl
                        border
                        border-slate-800
                        bg-slate-900
                        p-4
                        text-center
                      "
                    >

                      <p
                        className="
                          text-xs
                          text-slate-500
                        "
                      >
                        Parking
                      </p>

                      <p
                        className="
                          mt-2
                          font-bold
                          text-white
                        "
                      >
                        {propertyParking}
                      </p>

                    </div>

                  </div>


                  {/* =========================================
                      AI REASONING
                  ========================================= */}

                  <div
                    className="
                      mt-6
                      rounded-2xl
                      border
                      border-cyan-500/20
                      bg-cyan-500/5
                      p-5
                    "
                  >

                    <div
                      className="
                        flex
                        items-center
                        gap-2
                      "
                    >

                      <Sparkles
                        className="
                          h-5
                          w-5
                          text-cyan-400
                        "
                      />

                      <h4
                        className="
                          font-semibold
                          text-cyan-300
                        "
                      >
                        AI Recommendation
                      </h4>

                    </div>

                    <p
                      className="
                        mt-3
                        text-sm
                        leading-7
                        text-slate-300
                      "
                    >
                      {aiReason}
                    </p>

                  </div>


                  {/* =========================================
                      ACTION BUTTONS
                  ========================================= */}

                  <div
                    className="
                      mt-6
                      flex
                      flex-wrap
                      gap-3
                    "
                  >

                    {/* =======================================
                        INSERT INTO CHAT
                    ======================================= */}

                    <button
                      type="button"
                      onClick={() =>
                        onInsertProperty?.(property)
                      }
                      className="
                        flex-1
                        rounded-xl
                        bg-cyan-500
                        px-5
                        py-3
                        text-sm
                        font-semibold
                        text-slate-950
                        transition
                        hover:bg-cyan-400
                      "
                    >
                      Insert Into Chat
                    </button>


                    {/* =======================================
                        VIEW PROPERTY
                    ======================================= */}

                    <button
                      type="button"
                      onClick={() =>
                        onViewProperty?.(property)
                      }
                      className="
                        rounded-xl
                        border
                        border-slate-700
                        bg-slate-800
                        px-5
                        py-3
                        text-sm
                        font-semibold
                        text-white
                        transition
                        hover:bg-slate-700
                      "
                    >
                      View
                    </button>


                    {/* =======================================
                        COMPARE
                    ======================================= */}

                    <button
                      type="button"
                      onClick={() =>
                        onCompareProperty?.(property)
                      }
                      className="
                        rounded-xl
                        border
                        border-amber-500/30
                        bg-amber-500/10
                        px-5
                        py-3
                        text-sm
                        font-semibold
                        text-amber-300
                        transition
                        hover:bg-amber-500
                        hover:text-slate-950
                      "
                    >
                      Compare
                    </button>


                    {/* =======================================
                        BOOKMARK
                    ======================================= */}

                    <button
                      type="button"
                      onClick={() =>
                        onBookmarkProperty?.(property)
                      }
                      className="
                        rounded-xl
                        border
                        border-emerald-500/30
                        bg-emerald-500/10
                        px-5
                        py-3
                        text-sm
                        font-semibold
                        text-emerald-300
                        transition
                        hover:bg-emerald-500
                        hover:text-slate-950
                      "
                    >
                      Bookmark
                    </button>

                  </div>

                </div>

              </article>

            );

          })}

        </div>

      )}


      {/* =====================================================
          FOOTER
      ===================================================== */}

      {!loading &&
        safeRecommendations.length > 0 && (

        <div
          className="
            border-t
            border-slate-800
            bg-slate-950/40
            p-6
          "
        >

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

              <h4
                className="
                  font-semibold
                  text-white
                "
              >
                AI Recommendation Engine
              </h4>

              <p
                className="
                  mt-2
                  text-sm
                  leading-7
                  text-slate-400
                "
              >
                Recommendations are ranked using
                customer preferences, previous
                conversations, budget, location,
                viewing history and LeadFlow AI
                matching algorithms.
              </p>

              <p
                className="
                  mt-2
                  text-xs
                  leading-6
                  text-slate-500
                "
              >
                Property images are retrieved from
                each property's existing cover image.
                The recommendation engine does not
                generate new property images.
              </p>

            </div>


            {/* =============================================
                TOTAL MATCHES
            ============================================= */}

            <div
              className="
                rounded-2xl
                border
                border-cyan-500/20
                bg-cyan-500/10
                px-5
                py-4
                text-center
              "
            >

              <p
                className="
                  text-xs
                  uppercase
                  tracking-wide
                  text-cyan-300
                "
              >
                Total Matches
              </p>

              <h3
                className="
                  mt-2
                  text-3xl
                  font-bold
                  text-cyan-400
                "
              >
                {safeRecommendations.length}
              </h3>

            </div>

          </div>

        </div>

      )}

    </aside>

  );

};


export default PropertyRecommendationPanel;