/**
 * ==========================================================
 *
 * Purpose
 * ----------------------------------------------------------
 * Displays AI-recommended properties for a qualified lead.
 *
 * This component consumes the Property Recommendation Engine
 * through usePropertyRecommendations().
 *
 * IMPORTANT IMAGE ARCHITECTURE
 * ----------------------------------------------------------
 *
 * Recommendations MUST display the existing property's
 * persisted cover image.
 *
 * Flow:
 *
 *     Lead
 *       ↓
 *     Recommendation Engine
 *       ↓
 *     Existing Property
 *       ↓
 *     Existing PropertyImage
 *       ↓
 *     Existing coverImage.url
 *
 * This component MUST NOT:
 *
 * • Generate a new image
 * • Create a PropertyImage
 * • Upload an image
 * • Create a fake coverImage object
 * • Replace the property's existing image
 *
 * The backend remains the source of truth for property
 * images.
 *
 * ==========================================================
 */

import { useNavigate } from "react-router-dom";

import usePropertyRecommendations from "../../hooks/usePropertyRecommendations";

import getPropertyImageUrl from "../../utils/propertyImage";


const PropertyRecommendations = ({ lead }) => {

  const navigate = useNavigate();


  /* ========================================================
     PROPERTY RECOMMENDATIONS
  ======================================================== */

  const {
    properties,
    loading,
    error,
  } = usePropertyRecommendations(
    lead?._id
  );


  /* ========================================================
     LOADING
  ======================================================== */

  if (loading) {

    return (

      <div
        className="
          rounded-2xl
          border
          border-slate-800
          bg-slate-900
          p-8
          text-center
          text-slate-300
        "
      >

        Loading property recommendations...

      </div>

    );

  }


  /* ========================================================
     ERROR
  ======================================================== */

  if (error) {

    return (

      <div
        className="
          rounded-2xl
          border
          border-red-500/30
          bg-red-500/10
          p-6
          text-red-300
        "
      >

        {error}

      </div>

    );

  }


  /* ========================================================
     NO RESULTS
  ======================================================== */

  if (
    !properties ||
    properties.length === 0
  ) {

    return (

      <div
        className="
          rounded-2xl
          border
          border-slate-800
          bg-slate-900
          p-8
          text-center
        "
      >

        <h3
          className="
            text-lg
            font-semibold
            text-white
          "
        >

          No Matching Properties

        </h3>


        <p
          className="
            mt-2
            text-slate-400
          "
        >

          LeadFlow AI couldn't find any available
          properties matching this customer's
          requirements.

        </p>

      </div>

    );

  }


  /* ========================================================
     PROPERTY CARDS
  ======================================================== */

  return (

    <div
      className="
        grid
        gap-6
      "
    >

      {properties.map((property) => (

        <div
          key={
            property._id ||
            property.id
          }
          className="
            overflow-hidden
            rounded-2xl
            border
            border-slate-800
            bg-slate-900
            shadow-xl
          "
        >

          {/* ==================================================
              PROPERTY IMAGE
              
              IMPORTANT:
              
              Resolve the EXISTING coverImage only.
              
              The helper supports:
              
              coverImage.url
              coverImage ObjectId/string
              
              It does NOT generate or create images.
          ================================================== */}

          <div
            className="
              h-56
              overflow-hidden
              bg-slate-800
            "
          >

            {(() => {

              const imageUrl =
                getPropertyImageUrl(
                  property
                );


              if (!imageUrl) {

                return (

                  <div
                    className="
                      flex
                      h-full
                      items-center
                      justify-center
                      text-6xl
                    "
                  >

                    🏡

                  </div>

                );

              }


              return (

                <img
                  src={imageUrl}
                  alt={
                    property.title ||
                    "Recommended property"
                  }
                  className="
                    h-full
                    w-full
                    object-cover
                  "
                  onError={(event) => {

                    event.currentTarget.style.display =
                      "none";

                    const fallback =
                      event.currentTarget
                        .nextElementSibling;

                    if (fallback) {

                      fallback.classList.remove(
                        "hidden"
                      );

                    }

                  }}
                />

              );

            })()}


            {/* ==================================================
                IMAGE FALLBACK
            ================================================== */}

            {getPropertyImageUrl(
              property
            ) && (

              <div
                className="
                  hidden
                  h-full
                  w-full
                  items-center
                  justify-center
                  text-6xl
                "
              >

                🏡

              </div>

            )}

          </div>


          {/* ==================================================
              PROPERTY DETAILS
          ================================================== */}

          <div
            className="
              space-y-4
              p-6
            "
          >

            {/* ==================================================
                TITLE + LOCATION
            ================================================== */}

            <div>

              <h3
                className="
                  text-xl
                  font-bold
                  text-white
                "
              >

                {property.title ||
                  "Untitled Property"}

              </h3>


              <p
                className="
                  mt-2
                  text-slate-400
                "
              >

                {property.location ||
                  "Location not specified"}

              </p>

            </div>


            {/* ==================================================
                PRICE
            ================================================== */}

            <div
              className="
                grid
                grid-cols-2
                gap-4
              "
            >

              <div>

                <p
                  className="
                    text-xs
                    uppercase
                    text-slate-500
                  "
                >

                  Price

                </p>


                <p
                  className="
                    mt-1
                    font-semibold
                    text-emerald-400
                  "
                >

                  {property.currency ||
                    "KES"}{" "}

                  {Number(
                    property.price || 0
                  ).toLocaleString()}

                </p>

              </div>


              {/* ==================================================
                  BEDROOMS
              ================================================== */}

              <div>

                <p
                  className="
                    text-xs
                    uppercase
                    text-slate-500
                  "
                >

                  Bedrooms

                </p>


                <p
                  className="
                    mt-1
                    font-semibold
                    text-white
                  "
                >

                  {property.bedrooms ??
                    "-"}

                </p>

              </div>

            </div>


            {/* ==================================================
                BATHROOMS
            ================================================== */}

            <div
              className="
                grid
                grid-cols-2
                gap-4
              "
            >

              <div>

                <p
                  className="
                    text-xs
                    uppercase
                    text-slate-500
                  "
                >

                  Bathrooms

                </p>


                <p
                  className="
                    mt-1
                    font-semibold
                    text-white
                  "
                >

                  {property.bathrooms ??
                    "-"}

                </p>

              </div>


              {/* ==================================================
                  PROPERTY TYPE
              ================================================== */}

              <div>

                <p
                  className="
                    text-xs
                    uppercase
                    text-slate-500
                  "
                >

                  Property Type

                </p>


                <p
                  className="
                    mt-1
                    font-semibold
                    text-white
                  "
                >

                  {property.propertyType ||
                    property.type ||
                    "-"}

                </p>

              </div>

            </div>


            {/* ==================================================
                RECOMMENDATION SCORE
            ================================================== */}

            {property.recommendationScore !==
              undefined && (

              <div>

                <p
                  className="
                    text-xs
                    uppercase
                    text-slate-500
                  "
                >

                  AI Match Score

                </p>


                <p
                  className="
                    mt-1
                    font-semibold
                    text-cyan-400
                  "
                >

                  {property.recommendationScore}%

                </p>

              </div>

            )}


            {/* ==================================================
                AI REASON
            ================================================== */}

            {property.reason && (

              <div
                className="
                  rounded-xl
                  border
                  border-cyan-500/20
                  bg-cyan-500/5
                  p-4
                "
              >

                <p
                  className="
                    text-xs
                    font-semibold
                    uppercase
                    tracking-wide
                    text-cyan-400
                  "
                >

                  AI Recommendation

                </p>


                <p
                  className="
                    mt-2
                    text-sm
                    leading-6
                    text-slate-300
                  "
                >

                  {property.reason}

                </p>

              </div>

            )}


            {/* ==================================================
                VIEW PROPERTY
            ================================================== */}

            <button
              type="button"
              onClick={() =>
                navigate(
                  `/admin/properties/${
                    property._id ||
                    property.id
                  }`
                )
              }
              className="
                w-full
                rounded-xl
                bg-cyan-500
                py-3
                font-bold
                text-slate-950
                transition
                hover:bg-cyan-400
              "
            >

              View Property

            </button>

          </div>

        </div>

      ))}

    </div>

  );

};


export default PropertyRecommendations;