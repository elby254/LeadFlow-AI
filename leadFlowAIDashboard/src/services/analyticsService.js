/**
 * ==========================================================
 *
 * PURPOSE
 * ----------------------------------------------------------
 * Central frontend API service for LeadFlow AI analytics.
 *
 * Connects frontend analytics components to the backend
 * analytics routes.
 *
 * The backend is responsible for:
 *
 * • Authentication
 * • Organization isolation
 * • Agent-level access
 * • Role-based permissions
 * • Analytics calculations
 *
 * The frontend MUST NOT manually provide organizationId
 * for normal authenticated requests.
 *
 * ==========================================================
 *
 * BACKEND BASE ROUTE
 * ----------------------------------------------------------
 *
 * /api/analytics
 *
 * ==========================================================
 *
 * SUPPORTED ENDPOINTS
 * ----------------------------------------------------------
 *
 * GET /api/analytics/dashboard
 * GET /api/analytics/leads
 * GET /api/analytics/properties
 * GET /api/analytics/conversations
 * GET /api/analytics/agents
 * GET /api/analytics/followups
 * GET /api/analytics/ai
 * GET /api/analytics/conversions
 *
 * ==========================================================
 *
 * LEAD STATUS CONTRACT
 * ----------------------------------------------------------
 *
 * Lead.status is the single source of truth for the CRM
 * lifecycle.
 *
 * Valid Lead.status values:
 *
 * • new
 * • contacted
 * • qualified
 * • viewing
 * • negotiation
 * • won
 * • lost
 *
 * IMPORTANT
 * ----------------------------------------------------------
 *
 * The following are NOT Lead.status values:
 *
 * • hot
 * • follow_up
 * • viewing_requested
 * • viewing_scheduled
 * • closed
 *
 * Hot is an AI/lead-quality category derived from the lead
 * score, not a Lead.status.
 *
 * Viewing requested/scheduled states belong to the separate
 * viewingStatus field.
 *
 * Follow-up information belongs to the follow-up fields.
 *
 * won/lost represent the final Lead.status lifecycle states.
 *
 * ==========================================================
 *
 * INTENT SEMANTICS
 * ----------------------------------------------------------
 *
 * Lead.intent represents the customer's transaction intent.
 *
 * Canonical values:
 *
 * • rent
 * • buy
 * • property_search
 *
 * property_search means the customer is searching for a
 * property but has not explicitly stated whether they want
 * to rent or buy.
 *
 * IMPORTANT
 * ----------------------------------------------------------
 *
 * Lead intent is NOT the same as:
 *
 * • Lead.status
 * • AI buying-intent score/metric
 * • propertyType
 * • budget
 * • location
 * • bedrooms
 * • moveDate
 *
 * Aggregate intent analytics are returned by the backend as:
 *
 * analytics.intentDistribution
 *
 * The AI numeric metric:
 *
 * analytics.averageBuyingIntent
 *
 * remains separate from Lead.intent.
 *
 * ==========================================================
 */

import axiosClient from "../api/axiosClient";

// ==========================================================
// RESPONSE DATA HELPER
// ==========================================================
//
// Backend responses may be:
//
// {
//   data: {...}
// }
//
// or:
//
// {
//   success: true,
//   data: {...}
// }
//
// This helper keeps the service tolerant of the standard
// LeadFlow AI API response structure.
//
// ==========================================================

const extractData = (
  response,
  fallback = null
) => {

  return (
    response?.data?.data ??
    fallback
  );
};

// ==========================================================
// DASHBOARD ANALYTICS
// ==========================================================
//
// GET /api/analytics/dashboard
//
// Returns executive/dashboard-level analytics.
//
// The backend determines organization and role from the
// authenticated request.
//
// Optional params may include:
//
// {
//   startDate,
//   endDate
// }
//
// ==========================================================

export const getDashboardAnalytics = async (
  params = {}
) => {

  try {

    const response =
      await axiosClient.get(
        "/analytics/dashboard",
        {
          params,
        }
      );

    return extractData(
      response,
      {}
    );

  } catch (error) {

    console.error(
      "❌ Dashboard analytics error:",
      error
    );

    return {};
  }
};

// ==========================================================
// LEAD ANALYTICS
// ==========================================================
//
// GET /api/analytics/leads
//
// Tracks the actual Lead.status lifecycle.
//
// Valid Lead.status values:
//
// • new
// • contacted
// • qualified
// • viewing
// • negotiation
// • won
// • lost
//
// IMPORTANT
// ----------------------------------------------------------
//
// Hot is NOT a Lead.status.
// Hot should be derived from the lead score/AI qualification
// logic.
//
// Viewing requested/scheduled states are NOT Lead.status
// values. They belong to viewingStatus.
//
// Follow-up is represented by the dedicated follow-up fields.
//
// Optional params:
//
// {
//   startDate,
//   endDate
// }
//
// Agent filtering is handled by the backend according to
// the authenticated user's role.
//
// ==========================================================

export const getLeadAnalytics = async (
  params = {}
) => {

  try {

    const response =
      await axiosClient.get(
        "/analytics/leads",
        {
          params,
        }
      );

    return extractData(
      response,
      {}
    );

  } catch (error) {

    console.error(
      "❌ Lead analytics error:",
      error
    );

    return {};
  }
};

// ==========================================================
// PROPERTY ANALYTICS
// ==========================================================
//
// GET /api/analytics/properties
//
// Property performance analytics.
//
// Organization access is resolved server-side.
//
// Property analytics should remain separate from lead
// transaction intent analytics.
//
// ==========================================================

export const getPropertyAnalytics = async (
  params = {}
) => {

  try {

    const response =
      await axiosClient.get(
        "/analytics/properties",
        {
          params,
        }
      );

    return extractData(
      response,
      {}
    );

  } catch (error) {

    console.error(
      "❌ Property analytics error:",
      error
    );

    return {};
  }
};

// ==========================================================
// CONVERSATION ANALYTICS
// ==========================================================
//
// GET /api/analytics/conversations
//
// Measures conversation activity associated with the
// LeadFlow AI agent workflow.
//
// Conversation intent, when returned by the backend, should
// mirror the canonical Lead.intent semantics:
//
// • rent
// • buy
// • property_search
//
// ==========================================================

export const getConversationAnalytics = async (
  params = {}
) => {

  try {

    const response =
      await axiosClient.get(
        "/analytics/conversations",
        {
          params,
        }
      );

    return extractData(
      response,
      {}
    );

  } catch (error) {

    console.error(
      "❌ Conversation analytics error:",
      error
    );

    return {};
  }
};

// ==========================================================
// AGENT PERFORMANCE ANALYTICS
// ==========================================================
//
// GET /api/analytics/agents
//
// Used by admin/management views to measure agent
// performance.
//
// Typical metrics:
//
// • Assigned leads
// • Active leads
// • Closed/won leads
// • Average lead score
// • Conversion rate
//
// The backend determines which agents the authenticated
// user is permitted to see.
//
// ==========================================================

export const getAgentAnalytics = async (
  params = {}
) => {

  try {

    const response =
      await axiosClient.get(
        "/analytics/agents",
        {
          params,
        }
      );

    return extractData(
      response,
      []
    );

  } catch (error) {

    console.error(
      "❌ Agent analytics error:",
      error
    );

    return [];
  }
};

// ==========================================================
// FOLLOW-UP ANALYTICS
// ==========================================================
//
// GET /api/analytics/followups
//
// Follow-up analytics are based on the dedicated follow-up
// fields rather than inventing additional Lead.status values.
//
// Lead.status remains:
//
// • new
// • contacted
// • qualified
// • viewing
// • negotiation
// • won
// • lost
//
// Follow-up-specific states should come from fields such as
// followUpStatus, followUpDate, followUpOutcome, and related
// follow-up data.
//
// Used for measuring:
//
// • Follow-up workload
// • Pending actions
// • Scheduled follow-ups
// • Follow-up conversion
//
// ==========================================================

export const getFollowupAnalytics = async (
  params = {}
) => {

  try {

    const response =
      await axiosClient.get(
        "/analytics/followups",
        {
          params,
        }
      );

    return extractData(
      response,
      {}
    );

  } catch (error) {

    console.error(
      "❌ Follow-up analytics error:",
      error
    );

    return {};
  }
};

// ==========================================================
// AI PERFORMANCE ANALYTICS
// ==========================================================
//
// GET /api/analytics/ai
//
// Measures AI-assisted lead qualification.
//
// The analytics layer should remain aligned with the
// centralized lead scoring engine:
//
// • Lead score: 0–100
// • Hot category: >= 70
// • Qualified category: >= 50
// • New/Cold category: < 50
//
// IMPORTANT
// ----------------------------------------------------------
//
// Hot is a score/qualification category, NOT a Lead.status.
//
// Actual Lead.status values remain:
//
// • new
// • contacted
// • qualified
// • viewing
// • negotiation
// • won
// • lost
//
// AI analytics may also include:
//
// • Average score
// • Average buying intent
// • Intent distribution
// • Budget confidence
// • Location confidence
// • Urgency
// • Recommended actions
// • Missing information
//
// Intent analytics use:
//
// analytics.intentDistribution
//
// Canonical transaction intents:
//
// • rent
// • buy
// • property_search
//
// analytics.averageBuyingIntent remains a separate numeric
// AI insight metric and must not be treated as Lead.intent.
//
// ==========================================================

export const getAIAnalytics = async (
  params = {}
) => {

  try {

    const response =
      await axiosClient.get(
        "/analytics/ai",
        {
          params,
        }
      );

    return extractData(
      response,
      {}
    );

  } catch (error) {

    console.error(
      "❌ AI analytics error:",
      error
    );

    return {};
  }
};

// ==========================================================
// CONVERSION ANALYTICS
// ==========================================================
//
// GET /api/analytics/conversions
//
// Measures progression through the actual CRM Lead.status
// lifecycle:
//
// new
//   ↓
// contacted
//   ↓
// qualified
//   ↓
// viewing
//   ↓
// negotiation
//   ↓
// won
//
// lost represents the unsuccessful terminal outcome.
//
// IMPORTANT
// ----------------------------------------------------------
//
// The following are NOT Lead.status values:
//
// • hot
// • follow_up
// • viewing_scheduled
// • closed
//
// Those concepts are represented by score/qualification,
// dedicated follow-up fields, viewingStatus, and the final
// won/lost statuses respectively.
//
// ==========================================================

export const getConversionAnalytics = async (
  params = {}
) => {

  try {

    const response =
      await axiosClient.get(
        "/analytics/conversions",
        {
          params,
        }
      );

    return extractData(
      response,
      {}
    );

  } catch (error) {

    console.error(
      "❌ Conversion analytics error:",
      error
    );

    return {};
  }
};

// ==========================================================
// EXPORT ANALYTICS REPORT
// ==========================================================
//
// GET /api/analytics/export/:format
//
// Supported formats:
//
// • pdf
// • excel
// • csv
//
// Returns a Blob for browser download.
//
// ==========================================================

export const exportAnalytics = async (
  format = "pdf",
  params = {}
) => {

  try {

    const supportedFormats = [
      "pdf",
      "excel",
      "csv",
    ];

    if (
      !supportedFormats.includes(
        format
      )
    ) {

      throw new Error(
        `Unsupported analytics export format: ${format}`
      );
    }

    const response =
      await axiosClient.get(
        `/analytics/export/${format}`,
        {
          params,
          responseType: "blob",
        }
      );

    return response.data;

  } catch (error) {

    console.error(
      "❌ Analytics export error:",
      error
    );

    throw error;
  }
};

// ==========================================================
// SERVICE EXPORT
// ==========================================================
//
// Supports BOTH:
//
// import analyticsService from ".../analyticsService";
//
// and:
//
// import {
//   getLeadAnalytics
// } from ".../analyticsService";
//
// ==========================================================

const analyticsService = {

  getDashboardAnalytics,

  getLeadAnalytics,

  getPropertyAnalytics,

  getConversationAnalytics,

  getAgentAnalytics,

  getFollowupAnalytics,

  getAIAnalytics,

  getConversionAnalytics,

  exportAnalytics,
};

export default analyticsService;