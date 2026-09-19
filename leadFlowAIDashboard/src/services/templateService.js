/**
 * ==========================================================
 *
 * PURPOSE
 * ----------------------------------------------------------
 * Handles all reusable communication templates used
 * throughout LeadFlow AI.
 *
 * Templates include:
 *
 * • WhatsApp templates
 * • SMS templates
 * • Email templates
 * • AI Follow-up templates
 *
 * Used By
 * ----------------------------------------------------------
 * • Conversation Module
 * • Follow-up Queue
 * • AI Qualification
 * • Automation Rules
 * • Campaigns (future)
 *
 * Backend
 * ----------------------------------------------------------
 * GET    /api/templates
 * GET    /api/templates/:id
 * POST   /api/templates
 * PUT    /api/templates/:id
 * DELETE /api/templates/:id
 *
 * Future
 * ----------------------------------------------------------
 * • AI-generated templates
 * • Organization templates
 * • Template categories
 * • Template analytics
 *
 * ==========================================================
 */

import axiosClient from "../api/axiosClient";

class TemplateService {

  /* ========================================================
     GET ALL TEMPLATES
  ======================================================== */

  async getTemplates(params = {}) {

    /**
     * Optional Query
     *
     * {
     *   channel,
     *   category,
     *   search
     * }
     */

    const response =
      await axiosClient.get(
        "/templates",
        {
          params,
        }
      );

    return response.data;

  }

  /* ========================================================
     GET TEMPLATE
  ======================================================== */

  async getTemplate(templateId) {

    if (!templateId) {
      throw new Error("Template ID is required.");
    }

    const response =
      await axiosClient.get(
        `/templates/${templateId}`
      );

    return response.data;

  }

  /* ========================================================
     CREATE TEMPLATE
  ======================================================== */

  async createTemplate(payload) {

    /**
     * Example Payload
     *
     * {
     *   name,
     *   category,
     *   channel,
     *   subject,
     *   body
     * }
     */

    const response =
      await axiosClient.post(
        "/templates",
        payload
      );

    return response.data;

  }

  /* ========================================================
     UPDATE TEMPLATE
  ======================================================== */

  async updateTemplate(templateId, payload) {

    if (!templateId) {
      throw new Error("Template ID is required.");
    }

    const response =
      await axiosClient.put(
        `/templates/${templateId}`,
        payload
      );

    return response.data;

  }

  /* ========================================================
     DELETE TEMPLATE
  ======================================================== */

  async deleteTemplate(templateId) {

    if (!templateId) {
      throw new Error("Template ID is required.");
    }

    const response =
      await axiosClient.delete(
        `/templates/${templateId}`
      );

    return response.data;

  }

  /* ========================================================
     PREVIEW TEMPLATE
  ======================================================== */

  async previewTemplate(templateId, variables = {}) {

    /**
     * Example Variables
     *
     * {
     *   firstName: "James",
     *   propertyTitle: "3 Bedroom Apartment",
     *   agentName: "Alice"
     * }
     */

    if (!templateId) {
      throw new Error("Template ID is required.");
    }

    const response =
      await axiosClient.post(
        `/templates/${templateId}/preview`,
        variables
      );

    return response.data;

  }

  /* ========================================================
     GENERATE AI TEMPLATE
  ======================================================== */

  async generateAITemplate(payload) {

    /**
     * Example Payload
     *
     * {
     *   objective: "Follow-up",
     *   channel: "whatsapp",
     *   tone: "Professional",
     *   leadId
     * }
     */

    const response =
      await axiosClient.post(
        "/templates/ai-generate",
        payload
      );

    return response.data;

  }

}

/* ==========================================================
   SINGLETON EXPORT
========================================================== */

const templateService =
  new TemplateService();

export default templateService;