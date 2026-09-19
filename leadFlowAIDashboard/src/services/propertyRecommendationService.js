/**
 * ==========================================================
 *
 * PURPOSE
 * ----------------------------------------------------------
 * Central service responsible for all AI property
 * recommendation requests.
 *
 * Every recommendation request should pass through
 * this service instead of calling axios directly.
 *
 * Used By
 * ----------------------------------------------------------
 * • usePropertyRecommendations()
 * • LeadDetails
 * • Viewer Dashboard
 * • AI Chat Assistant
 * • WhatsApp Recommendation Engine
 *
 * Backend
 * ----------------------------------------------------------
 * GET    /api/property/recommendations/:leadId
 * POST   /api/property/recommendations/generate
 * POST   /api/property/recommendations/feedback
 *
 * Future
 * ----------------------------------------------------------
 * • Recommendation history
 * • Personalized ranking
 * • Recommendation explanations
 * • Similar properties
 * • Saved recommendations
 *
 * ==========================================================
 */

import axiosClient from "../api/axiosClient";

class PropertyRecommendationService {

  /* ========================================================
     GET RECOMMENDATIONS
  ======================================================== */

  async getRecommendations(leadId) {

    if (!leadId) {
      throw new Error("Lead ID is required.");
    }

    const response =
      await axiosClient.get(
        `/property/recommendations/${leadId}`
      );

    return response.data;
  }

  /* ========================================================
     GENERATE RECOMMENDATIONS
  ======================================================== */

  async generateRecommendations(payload) {

    /**
     * Expected Payload
     *
     * {
     *    leadId,
     *    regenerate,
     *    filters
     * }
     */

    const response =
      await axiosClient.post(
        "/property/recommendations/generate",
        payload
      );

    return response.data;
  }

/* ========================================================
   SUBMIT RECOMMENDATION FEEDBACK
======================================================== */

  async submitFeedback(payload) {

    /**
     * Expected Payload
     *
     * {
     *    leadId,
     *    propertyId,
     *    action,          // viewed | liked | disliked | contacted
     *    notes
     * }
     */

    const response =
      await axiosClient.post(
        "/property/recommendations/feedback",
        payload
      );

    return response.data;

  }

  /* ========================================================
     REFRESH RECOMMENDATIONS
  ======================================================== */

  async refreshRecommendations(leadId) {

    /**
     * Regenerates fresh recommendations
     * for the specified lead.
     */

    return this.generateRecommendations({

      leadId,

      regenerate: true,

    });

  }

  /* ========================================================
     GET RECOMMENDATION COUNT
  ======================================================== */

  async getRecommendationCount(leadId) {

    const data =
      await this.getRecommendations(leadId);

    return data?.data?.recommendationCount || 0;

  }

  /* ========================================================
     GET RECOMMENDATION LIST
  ======================================================== */

  async getRecommendationList(leadId) {

    const data =
      await this.getRecommendations(leadId);

    return Array.isArray(
      data?.data?.recommendations
    )
      ? data.data.recommendations
      : [];

  }

}

/* ==========================================================
   SINGLETON EXPORT
========================================================== */

const propertyRecommendationService =
  new PropertyRecommendationService();

export default propertyRecommendationService;