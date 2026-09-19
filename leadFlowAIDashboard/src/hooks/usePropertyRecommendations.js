/**
 * ==========================================================
 *
 * Purpose
 * ----------------------------------------------------------
 * Fetches AI-generated property recommendations for a lead.
 *
 * This hook acts as the single source of truth for property
 * recommendations throughout LeadFlow AI.
 *
 * Endpoint
 * ----------------------------------------------------------
 * GET /api/property/recommendations/:leadId
 *
 * Expected Response
 * ----------------------------------------------------------
 * {
 *   data: {
 *     recommendationCount,
 *     recommendations
 *   }
 * }
 *
 * Used By
 * ----------------------------------------------------------
 * • PropertyRecommendations.jsx
 * • LeadDetails.jsx
 * • AI Property Recommendation Panel
 *
 * Future Consumers
 * ----------------------------------------------------------
 * • AI Chat Assistant
 * • Viewing Scheduler
 * • WhatsApp Property Suggestions
 *
 * ==========================================================
 *
 * IMAGE ARCHITECTURE
 * ==========================================================
 *
 * IMPORTANT:
 *
 * This hook does NOT:
 *
 * • Generate property images
 * • Upload property images
 * • Create PropertyImage documents
 * • Replace coverImage
 * • Modify coverImage
 * • Create image URLs
 * • Select a random image
 * • Generate an AI image
 *
 * The backend recommendation endpoint should return the
 * EXISTING property together with its existing coverImage.
 *
 * Example:
 *
 * recommendation
 *      ↓
 * existing Property
 *      ↓
 * property.coverImage
 *      ↓
 * existing PropertyImage
 *      ↓
 * property.coverImage.url
 *
 * The hook simply passes that property object through.
 *
 * Image resolution belongs to the shared:
 *
 *     getPropertyImageUrl(property)
 *
 * helper at the UI/display layer.
 *
 * ==========================================================
 */

import {
  useState,
  useEffect,
  useCallback,
} from "react";

import axiosClient from "../api/axiosClient";


/* ==========================================================
   HOOK
========================================================== */

const usePropertyRecommendations = (leadId) => {

  /* ========================================================
     STATE
  ======================================================== */

  const [
    recommendedProperties,
    setRecommendedProperties,
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
     FETCH RECOMMENDATIONS
     
     IMPORTANT:
     
     The response objects are stored as received.
     
     We do NOT map:
     
         coverImage → image
     
     We do NOT map:
     
         coverImage.url → new image
     
     We do NOT generate anything.
     
     We do NOT replace the existing image.
  ======================================================== */

  const fetchRecommendations = useCallback(
    async () => {

      /* ----------------------------------------------------
         No lead selected
         
         There is nothing to recommend.
      ---------------------------------------------------- */

      if (!leadId) {

        setRecommendedProperties([]);

        setLoading(false);

        setError("");

        return;

      }


      try {

        setLoading(true);

        setError("");


        /* ==================================================
           API REQUEST
        ================================================== */

        const response =
          await axiosClient.get(
            `/property/recommendations/${leadId}`
          );


        /* ==================================================
           RESPONSE DATA
           
           Support the documented response:
           
           {
             data: {
               recommendationCount,
               recommendations
             }
           }
           
           Also safely handle Axios responses where
           response.data itself is the payload.
        ================================================== */

        const responseBody =
          response?.data;


        const payload =
          responseBody?.data ||
          responseBody ||
          {};


        /* ==================================================
           RECOMMENDATIONS
           
           IMPORTANT:
           
           We intentionally do NOT transform the objects.
           
           This preserves:
           
               _id
               id
               title
               location
               price
               bedrooms
               bathrooms
               propertyType
               coverImage
               coverImage.url
               matchScore
               reason
               aiReason
               etc.
           
           exactly as provided by the backend.
        ================================================== */

        const recommendations =
          Array.isArray(
            payload?.recommendations
          )
            ? payload.recommendations
            : [];


        /* ==================================================
           STORE EXISTING PROPERTY OBJECTS
           
           No image transformation occurs here.
        ================================================== */

        setRecommendedProperties(
          recommendations
        );

      } catch (err) {

        console.error(
          "Failed loading property recommendations:",
          err
        );

        console.error(
          "Property recommendations response:",
          err?.response?.data
        );


        /* ==================================================
           ERROR MESSAGE
        ================================================== */

        const message =
          err?.response?.data?.message ||
          err?.response?.data?.error ||
          err?.message ||
          "Failed to load property recommendations.";


        setError(message);


        /* ==================================================
           CLEAR RECOMMENDATIONS AFTER FAILED REQUEST
        ================================================== */

        setRecommendedProperties([]);

      } finally {

        setLoading(false);

      }

    },
    [leadId]
  );


  /* ========================================================
     LOAD ON MOUNT / LEAD CHANGE
     
     Whenever the selected lead changes, retrieve that
     lead's recommendations.
  ======================================================== */

  useEffect(() => {

    fetchRecommendations();

  }, [
    fetchRecommendations,
  ]);


  /* ========================================================
     HOOK API
     
     Keep aliases for compatibility with existing consumers.
     
     Primary API:
     
       recommendedProperties
       loading
       error
       refreshRecommendations
     
     Compatibility API:
     
       properties
       refresh
  ======================================================== */

  return {

    /* ------------------------------------------------------
       Primary recommendation collection
    ------------------------------------------------------ */

    recommendedProperties,


    /* ------------------------------------------------------
       Compatibility alias
       
       This points to the SAME array.
       
       No transformation takes place.
    ------------------------------------------------------ */

    properties:
      recommendedProperties,


    /* ------------------------------------------------------
       Loading
    ------------------------------------------------------ */

    loading,


    /* ------------------------------------------------------
       Error
    ------------------------------------------------------ */

    error,


    /* ------------------------------------------------------
       Primary refresh API
    ------------------------------------------------------ */

    refreshRecommendations:
      fetchRecommendations,


    /* ------------------------------------------------------
       Compatibility refresh API
    ------------------------------------------------------ */

    refresh:
      fetchRecommendations,

  };

};


export default usePropertyRecommendations;