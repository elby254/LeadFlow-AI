/**
 * ==========================================================
 *
 * PURPOSE
 * ----------------------------------------------------------
 * Home dashboard for property seekers.
 *
 * Features
 * ----------------------------------------------------------
 * • Welcome section
 * • Featured Properties
 * • AI Recommendations
 * • Recently Viewed
 * • Saved Properties
 *
 * ==========================================================
 */

import {
  useEffect,
  useState,
} from "react";

import {
  Home,
  Star,
  Heart,
  Clock3,
} from "lucide-react";

import propertyService from "../../services/propertyService";

import propertyRecommendationService
  from "../../services/propertyRecommendationService";

/*
==========================================================
SHARED PROPERTY IMAGE HELPER
==========================================================

All property image resolution is handled centrally.

The component does NOT directly access:

  property.coverImage
  property.image

Instead:

  property
      ↓
  getPropertyImageUrl()
      ↓
  browser-ready image URL
*/
import {
  getPropertyImageUrl,
} from "../../utils/propertyImage";


const ViewerLanding = () => {

  /*
  ==========================================================
  FEATURED
  ==========================================================
  */

  const [
    featured,
    setFeatured,
  ] = useState([]);


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
  RECENT
  ==========================================================
  */

  const [
    recent,
    setRecent,
  ] = useState([]);


  /*
  ==========================================================
  SAVED
  ==========================================================
  */

  const [
    saved,
    setSaved,
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


  /*
  ==========================================================
  LOAD DASHBOARD
  ==========================================================
  */

  const loadDashboard = async () => {

    try {

      setLoading(true);


      /*
      ======================================================
      FEATURED PROPERTIES
      ======================================================
      */

      const featuredResponse =
        await propertyService.getFeaturedProperties();


      setFeatured(
        Array.isArray(
          featuredResponse?.data
        )
          ? featuredResponse.data
          : []
      );


      /*
      ======================================================
      AI RECOMMENDATIONS
      ======================================================
      */

      const recommendationResponse =
        await propertyRecommendationService
          .getRecommendations();


      setRecommendations(
        Array.isArray(
          recommendationResponse?.data
        )
          ? recommendationResponse.data
          : []
      );


      /*
      ======================================================
      RECENTLY VIEWED
      ======================================================
      */

      const recentResponse =
        await propertyService.getRecentlyViewed();


      setRecent(
        Array.isArray(
          recentResponse?.data
        )
          ? recentResponse.data
          : []
      );


      /*
      ======================================================
      SAVED PROPERTIES
      ======================================================
      */

      const savedResponse =
        await propertyService.getSavedProperties({
          page: 1,
        });


      setSaved(
        Array.isArray(
          savedResponse?.data
        )
          ? savedResponse.data
          : []
      );


    } catch (error) {

      console.error(
        "Viewer dashboard failed",
        error
      );


    } finally {

      setLoading(false);

    }

  };


  /*
  ==========================================================
  INITIAL LOAD
  ==========================================================
  */

  useEffect(() => {

    loadDashboard();

  }, []);


  /*
  ==========================================================
  SUMMARY
  ==========================================================
  */

  const summaryCards = [

    {
      title: "Featured",
      value: featured.length,
      icon: Home,
    },

    {
      title: "Recommended",
      value: recommendations.length,
      icon: Star,
    },

    {
      title: "Saved",
      value: saved.length,
      icon: Heart,
    },

    {
      title: "Recently Viewed",
      value: recent.length,
      icon: Clock3,
    },

  ];


  /*
  ==========================================================
  LOADING
  ==========================================================
  */

  if (loading) {

    return (

      <div className="flex items-center justify-center py-32">

        <p className="text-muted-foreground">

          Loading your dashboard...

        </p>

      </div>

    );

  }


  /*
  ==========================================================
  PAGE
  ==========================================================
  */

  return (

    <section className="space-y-10">

      {/* ====================================================
          HERO
      ==================================================== */}

      <div className="rounded-2xl bg-primary p-8 text-primary-foreground">

        <h1 className="text-4xl font-bold">

          Find Your Perfect Property

        </h1>


        <p className="mt-3 max-w-2xl text-lg opacity-90">

          Discover homes, apartments, commercial
          spaces and land recommended specifically
          for you by LeadFlow AI.

        </p>

      </div>


      {/* ====================================================
          SUMMARY CARDS
      ==================================================== */}

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">

        {summaryCards.map((card) => {

          const Icon = card.icon;


          return (

            <div
              key={card.title}
              className="rounded-xl border bg-card p-6"
            >

              <div className="mb-4 flex items-center justify-between">

                <Icon className="h-7 w-7 text-primary" />


                <span className="text-3xl font-bold">

                  {card.value}

                </span>

              </div>


              <h3 className="font-semibold">

                {card.title}

              </h3>

            </div>

          );

        })}

      </div>


      {/* ====================================================
          FEATURED PROPERTIES
      ==================================================== */}

      <section className="space-y-4">

        <h2 className="text-2xl font-semibold">

          Featured Properties

        </h2>


        {featured.length === 0 ? (

          <div className="rounded-xl border bg-card p-6">

            <p className="text-sm text-muted-foreground">

              No featured properties available.

            </p>

          </div>

        ) : (

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">

            {featured.map((property) => {

              /*
              ------------------------------------------------
              RESOLVE IMAGE THROUGH SHARED HELPER
              ------------------------------------------------
              */

              const imageUrl =
                getPropertyImageUrl(property);


              return (

                <div
                  key={property._id}
                  className="
                    overflow-hidden
                    rounded-xl
                    border
                    bg-card
                  "
                >

                  {/* ========================================
                      PROPERTY IMAGE
                  ======================================== */}

                  {imageUrl ? (

                    <img
                      src={imageUrl}
                      alt={
                        property.title ||
                        "Property"
                      }
                      className="
                        h-56
                        w-full
                        object-cover
                      "
                    />

                  ) : (

                    <div
                      className="
                        flex
                        h-56
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
                      PROPERTY DETAILS
                  ======================================== */}

                  <div className="space-y-2 p-4">

                    <h3 className="font-semibold">

                      {property.title}

                    </h3>


                    <p className="text-sm text-muted-foreground">

                      {property.location}

                    </p>


                    <p className="font-semibold text-primary">

                      KES{" "}

                      {Number(
                        property.price || 0
                      ).toLocaleString()}

                    </p>

                  </div>

                </div>

              );

            })}

          </div>

        )}

      </section>


      {/* ====================================================
          AI RECOMMENDATIONS
      ==================================================== */}

      <section className="space-y-4">

        <h2 className="text-2xl font-semibold">

          Recommended For You

        </h2>


        {recommendations.length === 0 ? (

          <div className="rounded-xl border bg-card p-6">

            <p className="text-sm text-muted-foreground">

              No AI recommendations are available yet.

            </p>

          </div>

        ) : (

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">

            {recommendations.map((property) => {

              /*
              ------------------------------------------------
              RESOLVE IMAGE THROUGH SHARED HELPER
              ------------------------------------------------
              */

              const imageUrl =
                getPropertyImageUrl(property);


              return (

                <div
                  key={property._id}
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

                  {imageUrl ? (

                    <img
                      src={imageUrl}
                      alt={
                        property.title ||
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

                      {property.title}

                    </h3>


                    <p className="text-sm text-muted-foreground">

                      {property.location}

                    </p>

                  </div>

                </div>

              );

            })}

          </div>

        )}

      </section>


      {/* ====================================================
          RECENTLY VIEWED
      ==================================================== */}

      {recent.length > 0 && (

        <section className="space-y-4">

          <h2 className="text-2xl font-semibold">

            Recently Viewed

          </h2>


          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">

            {recent.map((property) => {

              /*
              ------------------------------------------------
              IMAGE RESOLUTION
              ------------------------------------------------

              Even though the current Recently Viewed card
              does not display an image, image resolution
              remains centralized if the card is expanded
              later.

              The actual image rendering is intentionally
              omitted to preserve the existing architecture.
              ------------------------------------------------
              */

              return (

                <div
                  key={property._id}
                  className="
                    rounded-xl
                    border
                    bg-card
                    p-4
                  "
                >

                  <h3 className="font-semibold">

                    {property.title}

                  </h3>


                  <p className="text-sm text-muted-foreground">

                    {property.location}

                  </p>

                </div>

              );

            })}

          </div>

        </section>

      )}

    </section>

  );

};


export default ViewerLanding;

