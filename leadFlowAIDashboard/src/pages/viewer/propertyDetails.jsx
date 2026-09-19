/**
 * ==========================================================
 *
 * PURPOSE
 * ----------------------------------------------------------
 * Displays complete information for
 * a single property.
 *
 * Used By
 * ----------------------------------------------------------
 * • Public Listings
 * • Recommendations
 * • Search Results
 * • Saved Properties
 *
 * ==========================================================
 */

import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import {
  ArrowLeft,
  Heart,
  Share2,
  Calendar,
} from "lucide-react";

import PropertyStatusBadge from "../../components/properties/propertyStatusBadge";
import PropertyPricingPanel from "../../components/properties/propertyPricingPanel";

/*
==========================================================
SHARED PROPERTY IMAGE HELPER
==========================================================

Use the centralized image resolver instead of accessing
property.coverImage or property.image directly.

This keeps image handling consistent across LeadFlow AI.
*/
import { getPropertyImage } from "../../components/properties/propertyImageHelper";

import propertyService from "../../services/propertyService";
import propertyRecommendationService from "../../services/propertyRecommendationService";


const PropertyDetails = () => {

  /*
  ==========================================================
  ROUTE
  ==========================================================
  */

  const {
    propertyId,
  } = useParams();


  /*
  ==========================================================
  PROPERTY
  ==========================================================
  */

  const [
    property,
    setProperty,
  ] = useState(null);


  /*
  ==========================================================
  RECOMMENDATIONS
  ==========================================================
  */

  const [
    recommendations,
    setRecommendations,
  ] = useState([]);


  /*
  ==========================================================
  UI
  ==========================================================
  */

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");


  /*
  ==========================================================
  USER ACTIONS
  ==========================================================
  */

  const [
    favourite,
    setFavourite,
  ] = useState(false);

  const [
    scheduling,
    setScheduling,
  ] = useState(false);


  /*
  ==========================================================
  LOAD PROPERTY
  ==========================================================
  */

  const loadProperty = async () => {

    try {

      setLoading(true);

      setError("");

      const response =
        await propertyService.getPropertyById(
          propertyId
        );


      /*
      --------------------------------------------------------
      Expected backend response
      --------------------------------------------------------

      {
        data: {
          ...
        }
      }
      --------------------------------------------------------
      */

      const loadedProperty =
        response?.data || null;


      setProperty(
        loadedProperty
      );


      /*
      --------------------------------------------------------
      IMPORTANT
      --------------------------------------------------------
      Return the actual property so the caller can immediately
      use it for recommendations.

      React state updates are asynchronous.
      --------------------------------------------------------
      */

      return loadedProperty;


    } catch (error) {

      console.error(
        "Property loading error:",
        error
      );

      setError(
        "Unable to load property."
      );

      return null;

    }

  };


  /*
  ==========================================================
  LOAD RECOMMENDATIONS
  ==========================================================
  */

  /**
   * Load similar properties for the currently viewed property.
   *
   * IMPORTANT:
   * Receive the property directly instead of reading
   * property._id from React state.
   *
   * React state updates are asynchronous.
   */

  const loadRecommendations = async (
    currentProperty
  ) => {

    try {

      /*
      --------------------------------------------------------
      SAFETY CHECK
      --------------------------------------------------------
      */

      if (!currentProperty?._id) {

        console.warn(
          "Recommendation request skipped: property is not loaded."
        );

        setRecommendations([]);

        return;

      }


      /*
      --------------------------------------------------------
      LOAD SIMILAR PROPERTIES
      --------------------------------------------------------
      */

      const response =
        await propertyRecommendationService.getSimilarProperties(
          currentProperty._id
        );


      /*
      --------------------------------------------------------
      STORE RESULTS
      --------------------------------------------------------
      */

      setRecommendations(
        Array.isArray(response?.data)
          ? response.data
          : []
      );


    } catch (error) {

      console.error(
        "Recommendation error:",
        error
      );


      /*
      --------------------------------------------------------
      FAIL SAFELY
      --------------------------------------------------------
      Recommendation failure must never break the property
      details page.
      --------------------------------------------------------
      */

      setRecommendations([]);

    }

  };


  /*
  ==========================================================
  INITIAL LOAD
  ==========================================================
  */

  useEffect(() => {

    let mounted = true;


    const initialise = async () => {

      try {

        setLoading(true);

        setError("");


        /*
        ------------------------------------------------------
        LOAD PROPERTY FIRST
        ------------------------------------------------------
        */

        const loadedProperty =
          await loadProperty();


        /*
        ------------------------------------------------------
        ONLY LOAD RECOMMENDATIONS AFTER WE HAVE THE ACTUAL
        PROPERTY OBJECT.
        ------------------------------------------------------
        */

        if (
          mounted &&
          loadedProperty?._id
        ) {

          await loadRecommendations(
            loadedProperty
          );

        } else {

          if (mounted) {

            setRecommendations([]);

          }

        }


      } catch (error) {

        console.error(
          "Property details initialisation error:",
          error
        );


        if (mounted) {

          setRecommendations([]);

          setError(
            "Unable to load property."
          );

        }


      } finally {

        if (mounted) {

          setLoading(false);

        }

      }

    };


    initialise();


    /*
    ----------------------------------------------------------
    CLEANUP
    ----------------------------------------------------------
    */

    return () => {

      mounted = false;

    };


  }, [propertyId]);


  /*
  ==========================================================
  FAVOURITE
  ==========================================================
  */

  const toggleFavourite = () => {

    setFavourite(
      (previous) => !previous
    );

  };


  /*
  ==========================================================
  SHARE
  ==========================================================
  */

  const handleShare = async () => {

    try {

      if (
        navigator.share &&
        property
      ) {

        await navigator.share({

          title:
            property.title,

          text:
            property.description,

          url:
            window.location.href,

        });

        return;

      }


      await navigator.clipboard.writeText(
        window.location.href
      );


      alert(
        "Property link copied."
      );


    } catch (error) {

      console.error(
        "Property sharing error:",
        error
      );

    }

  };


  /*
  ==========================================================
  SCHEDULE VIEWING
  ==========================================================
  */

  const handleScheduleViewing = async () => {

    try {

      setScheduling(true);


      /*
      --------------------------------------------------------
      FUTURE BACKEND INTEGRATION
      --------------------------------------------------------

      viewingService.createViewing()

      --------------------------------------------------------
      */

      alert(
        "Viewing request submitted."
      );


    } catch (error) {

      console.error(
        "Viewing request error:",
        error
      );


    } finally {

      setScheduling(false);

    }

  };


  /*
  ==========================================================
  BACK
  ==========================================================
  */

  const goBack = () => {

    window.history.back();

  };


  /*
  ==========================================================
  STATES
  ==========================================================
  */

  if (loading) {

    return (

      <div className="flex items-center justify-center py-32">

        <p className="text-muted-foreground">

          Loading property...

        </p>

      </div>

    );

  }


  if (error) {

    return (

      <div className="flex items-center justify-center py-32">

        <p className="text-destructive">

          {error}

        </p>

      </div>

    );

  }


  if (!property) {

    return (

      <div className="flex items-center justify-center py-32">

        <p className="text-muted-foreground">

          Property not found.

        </p>

      </div>

    );

  }


  /*
  ==========================================================
  RESOLVED PROPERTY IMAGE
  ==========================================================
  */

  const propertyImage =
    getPropertyImage(property);


  /*
  ==========================================================
  PAGE
  ==========================================================
  */

  return (

    <section className="mx-auto max-w-7xl space-y-8 px-4 py-8">

      {/* ======================================================
          TOP ACTIONS
      ====================================================== */}

      <div className="flex flex-wrap items-center justify-between gap-4">

        <button
          type="button"
          onClick={goBack}
          className="
            inline-flex
            items-center
            gap-2
            rounded-lg
            border
            px-4
            py-2
            hover:bg-muted
          "
        >

          <ArrowLeft size={18} />

          Back

        </button>


        <div className="flex gap-3">

          <button
            type="button"
            onClick={toggleFavourite}
            aria-label={
              favourite
                ? "Remove property from favourites"
                : "Add property to favourites"
            }
            className="
              rounded-lg
              border
              p-3
              hover:bg-muted
            "
          >

            <Heart
              size={18}
              fill={
                favourite
                  ? "currentColor"
                  : "none"
              }
            />

          </button>


          <button
            type="button"
            onClick={handleShare}
            aria-label="Share property"
            className="
              rounded-lg
              border
              p-3
              hover:bg-muted
            "
          >

            <Share2 size={18} />

          </button>

        </div>

      </div>


      {/* ======================================================
          MAIN CONTENT
      ====================================================== */}

      <div className="grid gap-8 lg:grid-cols-3">

        {/* ====================================================
            LEFT
        ==================================================== */}

        <div className="space-y-6 lg:col-span-2">

          {/* ==================================================
              PROPERTY COVER IMAGE
          ================================================== */}

          {propertyImage ? (

            <img
              src={propertyImage}
              alt={property.title || "Property"}
              className="
                h-[450px]
                w-full
                rounded-2xl
                object-cover
              "
            />

          ) : (

            <div
              className="
                flex
                h-[450px]
                w-full
                items-center
                justify-center
                rounded-2xl
                border
                bg-muted
                text-sm
                text-muted-foreground
              "
            >

              No property image available.

            </div>

          )}


          {/* ==================================================
              PROPERTY TITLE
          ================================================== */}

          <div>

            <div className="flex flex-wrap items-center justify-between gap-3">

              <h1 className="text-3xl font-bold">

                {property.title}

              </h1>


              <PropertyStatusBadge
                status={property.status}
              />

            </div>


            <p className="mt-2 text-muted-foreground">

              {property.location}

            </p>

          </div>


          {/* ==================================================
              DESCRIPTION
          ================================================== */}

          <div>

            <h2 className="mb-3 text-xl font-semibold">

              Description

            </h2>


            <p className="leading-7 text-muted-foreground">

              {property.description ||
                "No property description available."}

            </p>

          </div>


          {/* ==================================================
              FEATURES
          ================================================== */}

          <div>

            <h2 className="mb-3 text-xl font-semibold">

              Features

            </h2>


            {property.features?.length > 0 ? (

              <div className="flex flex-wrap gap-2">

                {property.features.map(
                  (feature, index) => (

                    <span
                      key={`${feature}-${index}`}
                      className="
                        rounded-full
                        border
                        px-3
                        py-1
                        text-sm
                      "
                    >

                      {feature}

                    </span>

                  )
                )}

              </div>

            ) : (

              <p className="text-sm text-muted-foreground">

                No features listed.

              </p>

            )}

          </div>


          {/* ==================================================
              AMENITIES
          ================================================== */}

          <div>

            <h2 className="mb-3 text-xl font-semibold">

              Amenities

            </h2>


            {property.amenities?.length > 0 ? (

              <div className="flex flex-wrap gap-2">

                {property.amenities.map(
                  (item, index) => (

                    <span
                      key={`${item}-${index}`}
                      className="
                        rounded-full
                        bg-muted
                        px-3
                        py-1
                        text-sm
                      "
                    >

                      {item}

                    </span>

                  )
                )}

              </div>

            ) : (

              <p className="text-sm text-muted-foreground">

                No amenities listed.

              </p>

            )}

          </div>

        </div>


        {/* ====================================================
            RIGHT
        ==================================================== */}

        <div className="space-y-6">

          <PropertyPricingPanel
            property={property}
          />


          <button
            type="button"
            onClick={handleScheduleViewing}
            disabled={scheduling}
            className="
              flex
              w-full
              items-center
              justify-center
              gap-2
              rounded-xl
              bg-primary
              px-5
              py-4
              font-medium
              text-primary-foreground
              hover:opacity-90
              disabled:cursor-not-allowed
              disabled:opacity-60
            "
          >

            <Calendar size={18} />

            {scheduling
              ? "Submitting..."
              : "Schedule Viewing"}

          </button>

        </div>

      </div>


      {/* ======================================================
          RECOMMENDATIONS
      ====================================================== */}

      {recommendations.length > 0 && (

        <div className="space-y-4">

          <h2 className="text-2xl font-semibold">

            Similar Properties

          </h2>


          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">

            {recommendations.map(
              (item) => {

                /*
                ------------------------------------------------
                RESOLVE RECOMMENDATION IMAGE THROUGH THE SAME
                SHARED IMAGE HELPER
                ------------------------------------------------
                */

                const recommendationImage =
                  getPropertyImage(item);


                return (

                  <div
                    key={item._id}
                    className="
                      overflow-hidden
                      rounded-xl
                      border
                      bg-card
                    "
                  >

                    {/* ========================================
                        RECOMMENDATION IMAGE
                    ======================================== */}

                    {recommendationImage ? (

                      <img
                        src={recommendationImage}
                        alt={
                          item.title ||
                          "Recommended property"
                        }
                        className="
                          h-52
                          w-full
                          object-cover
                        "
                      />

                    ) : (

                      <div
                        className="
                          flex
                          h-52
                          w-full
                          items-center
                          justify-center
                          bg-muted
                          text-sm
                          text-muted-foreground
                        "
                      >

                        No image available.

                      </div>

                    )}


                    {/* ========================================
                        RECOMMENDATION DETAILS
                    ======================================== */}

                    <div className="space-y-2 p-4">

                      <h3 className="font-semibold">

                        {item.title}

                      </h3>


                      <p className="text-sm text-muted-foreground">

                        {item.location}

                      </p>


                      <PropertyStatusBadge
                        status={item.status}
                      />

                    </div>

                  </div>

                );

              }
            )}

          </div>

        </div>

      )}

    </section>

  );

};


export default PropertyDetails;