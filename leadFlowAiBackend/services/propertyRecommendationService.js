/**
 * ==========================================================
 *
 * Handles API requests for AI-powered property
 * recommendations.
 *
 * Backend Base
 * ----------------------------------------------------------
 * /api/property-recommendations
 *
 * ==========================================================
 */

import axiosClient from "../api/axiosClient";

/* ==========================================================
   GENERAL RECOMMENDATIONS
   GET /api/property-recommendations
========================================================== */

const getRecommendations = async (params = {}) => {
  const response = await axiosClient.get(
    "/property-recommendations",
    {
      params,
    }
  );

  return response.data;
};

/* ==========================================================
   SIMILAR PROPERTY RECOMMENDATIONS

   GET /api/property-recommendations/similar/:propertyId

   IMPORTANT:
   propertyId MUST be an ID string.
========================================================== */

const getSimilarProperties = async (propertyId) => {
  if (!propertyId) {
    throw new Error(
      "Property ID is required for similar property recommendations."
    );
  }

  const response = await axiosClient.get(
    `/property-recommendations/similar/${encodeURIComponent(
      propertyId
    )}`
  );

  return response.data;
};

/* ==========================================================
   LEAD RECOMMENDATIONS

   GET /api/property-recommendations/lead/:leadId
========================================================== */

const getLeadRecommendations = async (leadId, params = {}) => {
  if (!leadId) {
    throw new Error(
      "Lead ID is required for lead recommendations."
    );
  }

  const response = await axiosClient.get(
    `/property-recommendations/lead/${encodeURIComponent(
      leadId
    )}`,
    {
      params,
    }
  );

  return response.data;
};

/* ==========================================================
   FEATURED RECOMMENDATIONS

   GET /api/property-recommendations/featured
========================================================== */

const getFeaturedRecommendations = async () => {
  const response = await axiosClient.get(
    "/property-recommendations/featured"
  );

  return response.data;
};

/* ==========================================================
   EXPORT
========================================================== */

const propertyRecommendationService = {
  getRecommendations,
  getSimilarProperties,
  getLeadRecommendations,
  getFeaturedRecommendations,
};

export default propertyRecommendationService;