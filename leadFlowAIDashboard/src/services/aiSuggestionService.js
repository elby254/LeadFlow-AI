/**
 * ==========================================================
 *
 * PURPOSE
 * ----------------------------------------------------------
 * Central service responsible for retrieving AI-generated
 * suggestions throughout LeadFlow AI.
 *
 * Used By
 * ----------------------------------------------------------
 * • AI Assistant
 * • Lead Qualification
 * • Conversation Workspace
 * • Agent Workspace
 * • Follow-up Workspace
 * • Property Recommendation Engine
 *
 * Backend
 * ----------------------------------------------------------
 * GET  /api/ai/suggestions/:leadId
 * POST /api/ai/suggestions
 * POST /api/ai/followup
 * POST /api/ai/reply
 * POST /api/ai/property-match
 * POST /api/ai/qualification
 *
 * Future
 * ----------------------------------------------------------
 * • OpenAI
 * • Claude
 * • Gemini
 * • Local LLM
 *
 * ==========================================================
 */

import axiosClient from "../api/axiosClient";

class AISuggestionService {

  /* ========================================================
     FETCH AI SUGGESTIONS FOR LEAD
  ======================================================== */

  async getSuggestions(
    leadId
  ) {

    const response =
      await axiosClient.get(
        `/ai/suggestions/${leadId}`
      );

    return response.data;

  }

  /* ========================================================
     GENERATE GENERAL AI SUGGESTION
  ======================================================== */

  async generateSuggestion(
    payload
  ) {

    /**
     * payload
     * ----------------------------
     * {
     *   leadId,
     *   context,
     *   message,
     *   conversationId
     * }
     */

    const response =
      await axiosClient.post(
        "/ai/suggestions",
        payload
      );

    return response.data;

  }

  /* ========================================================
     AI FOLLOW-UP SUGGESTION
  ======================================================== */

  async generateFollowupSuggestion(
    payload
  ) {

    /**
     * payload
     * ----------------------------
     * {
     *   leadId,
     *   previousConversation,
     *   followupType
     * }
     */

    const response =
      await axiosClient.post(
        "/ai/followup",
        payload
      );

    return response.data;

  }

  /* ========================================================
     AI REPLY GENERATION
  ======================================================== */

  async generateReply(
    payload
  ) {

    /**
     * payload
     * ----------------------------
     * {
     *   conversationId,
     *   leadId,
     *   latestMessage
     * }
     */

    const response =
      await axiosClient.post(
        "/ai/reply",
        payload
      );

    return response.data;

  }

  /* ========================================================
     PROPERTY MATCH SUGGESTION
  ======================================================== */

  async generatePropertyMatch(
    payload
  ) {

    /**
     * payload
     * ----------------------------
     * {
     *   leadId,
     *   preferences,
     *   budget,
     *   location,
     *   propertyType
     * }
     */

    const response =
      await axiosClient.post(
        "/ai/property-match",
        payload
      );

    return response.data;

  }

  /* ========================================================
     LEAD QUALIFICATION SUGGESTION
  ======================================================== */

  async generateQualificationSuggestion(
    payload
  ) {

    /**
     * payload
     * ----------------------------
     * {
     *   leadId,
     *   conversationHistory,
     *   leadInformation
     * }
     */

    const response =
      await axiosClient.post(
        "/ai/qualification",
        payload
      );

    return response.data;

  }

  /* ========================================================
     REGENERATE AI SUGGESTION
  ======================================================== */

  async regenerateSuggestion(
    suggestionId
  ) {

    /**
     * Forces the AI to generate a new
     * suggestion for an existing request.
     */

    const response =
      await axiosClient.post(
        `/ai/suggestions/${suggestionId}/regenerate`
      );

    return response.data;

  }

  /* ========================================================
     DELETE AI SUGGESTION (Optional)
  ======================================================== */

  async deleteSuggestion(
    suggestionId
  ) {

    const response =
      await axiosClient.delete(
        `/ai/suggestions/${suggestionId}`
      );

    return response.data;

  }

}

/* ==========================================================
   SINGLETON EXPORT
========================================================== */

const aiSuggestionService =
  new AISuggestionService();

export default aiSuggestionService;