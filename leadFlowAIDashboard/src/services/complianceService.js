/**
 * ==========================================================
 *
 * PURPOSE
 * ----------------------------------------------------------
 * Central frontend service for all compliance, privacy,
 * consent, audit and regulatory API communication.
 *
 * Responsibilities
 * ----------------------------------------------------------
 * • Compliance status
 * • Audit logs
 * • Compliance reports
 * • Customer consent management
 * • Compliance settings
 * • Compliance data export
 *
 * AGENT WORKFLOW COMPATIBILITY
 * ----------------------------------------------------------
 * This service does NOT perform lead assignment directly.
 *
 * Agent assignment remains controlled by the backend:
 *
 * Lead
 *   ↓
 * Lead lifecycle / AI scoring
 *   ↓
 * Assignment Engine
 *   ↓
 * Agent
 *
 * Compliance operates alongside that workflow by providing
 * the audit, consent and governance layer.
 *
 * MULTI-TENANT SECURITY
 * ----------------------------------------------------------
 * Organization identity is NOT manually supplied by the
 * frontend.
 *
 * axiosClient/auth middleware is responsible for sending the
 * authenticated request.
 *
 * The backend determines:
 *
 * req.user.organizationId
 *
 * and applies organization-level isolation.
 *
 * BACKEND BASE ROUTE
 * ----------------------------------------------------------
 *
 * /api/compliance
 *
 * ==========================================================
 */

import axiosClient from "../api/axiosClient";

// ==========================================================
// RESPONSE HELPER
// ==========================================================
//
// Backend responses may be:
//
// {
//   data: {...}
// }
//
// or directly:
//
// {
//   ...
// }
//
// This helper keeps the service compatible with both forms.
//

const extractData = (response) => {
  return (
    response?.data?.data ??
    response?.data ??
    null
  );
};

// ==========================================================
// COMPLIANCE SERVICE
// ==========================================================

class ComplianceService {

  // ========================================================
  // GET COMPLIANCE STATUS
  // ========================================================
  //
  // GET /api/compliance/status
  //
  // Returns the current organization's compliance state.
  //
  // ========================================================

  async getComplianceStatus() {
    try {
      const response =
        await axiosClient.get(
          "/compliance/status"
        );

      return extractData(response);

    } catch (error) {

      console.error(
        "❌ Compliance status fetch error:",
        error
      );

      return null;
    }
  }

  // ========================================================
  // GET AUDIT LOGS
  // ========================================================
  //
  // GET /api/compliance/audit-logs
  //
  // Optional filters:
  //
  // {
  //   page,
  //   limit,
  //   userId,
  //   action,
  //   startDate,
  //   endDate
  // }
  //
  // ========================================================

  async getAuditLogs(
    params = {}
  ) {
    try {

      const response =
        await axiosClient.get(
          "/compliance/audit-logs",
          {
            params,
          }
        );

      const data =
        extractData(response);

      return Array.isArray(data)
        ? data
        : data?.logs ||
          data?.items ||
          [];

    } catch (error) {

      console.error(
        "❌ Compliance audit logs error:",
        error
      );

      return [];
    }
  }

  // ========================================================
  // GET COMPLIANCE REPORTS
  // ========================================================
  //
  // GET /api/compliance/reports
  //
  // Optional filters may include:
  //
  // {
  //   page,
  //   limit,
  //   startDate,
  //   endDate,
  //   type
  // }
  //
  // ========================================================

  async getComplianceReports(
    params = {}
  ) {
    try {

      const response =
        await axiosClient.get(
          "/compliance/reports",
          {
            params,
          }
        );

      return extractData(response);

    } catch (error) {

      console.error(
        "❌ Compliance reports fetch error:",
        error
      );

      return [];
    }
  }

  // ========================================================
  // GET CUSTOMER CONSENTS
  // ========================================================
  //
  // GET /api/compliance/consents
  //
  // Optional filters:
  //
  // {
  //   leadId,
  //   consentType,
  //   granted,
  //   page,
  //   limit
  // }
  //
  // ========================================================

  async getConsents(
    params = {}
  ) {
    try {

      const response =
        await axiosClient.get(
          "/compliance/consents",
          {
            params,
          }
        );

      const data =
        extractData(response);

      return Array.isArray(data)
        ? data
        : data?.consents ||
          data?.items ||
          [];

    } catch (error) {

      console.error(
        "❌ Compliance consents fetch error:",
        error
      );

      return [];
    }
  }

  // ========================================================
  // CREATE CUSTOMER CONSENT
  // ========================================================
  //
  // POST /api/compliance/consents
  //
  // Example payload:
  //
  // {
  //   leadId,
  //   consentType,
  //   granted,
  //   source
  // }
  //
  // ========================================================

  async createConsent(
    payload
  ) {
    try {

      if (!payload) {
        throw new Error(
          "Consent payload is required."
        );
      }

      const response =
        await axiosClient.post(
          "/compliance/consents",
          payload
        );

      return extractData(response);

    } catch (error) {

      console.error(
        "❌ Create consent error:",
        error
      );

      throw error;
    }
  }

  // ========================================================
  // UPDATE CUSTOMER CONSENT
  // ========================================================
  //
  // PUT /api/compliance/consents/:id
  //
  // ========================================================

  async updateConsent(
    consentId,
    payload
  ) {
    try {

      if (!consentId) {
        throw new Error(
          "Consent ID is required."
        );
      }

      if (!payload) {
        throw new Error(
          "Consent update payload is required."
        );
      }

      const response =
        await axiosClient.put(
          `/compliance/consents/${consentId}`,
          payload
        );

      return extractData(response);

    } catch (error) {

      console.error(
        "❌ Update consent error:",
        error
      );

      throw error;
    }
  }

  // ========================================================
  // UPDATE COMPLIANCE SETTINGS
  // ========================================================
  //
  // PUT /api/compliance/settings
  //
  // Example:
  //
  // {
  //   dataRetentionDays,
  //   requireConsent,
  //   enableAuditLogs,
  //   enableDataExport,
  //   enableAutoDeletion
  // }
  //
  // ========================================================

  async updateComplianceSettings(
    payload
  ) {
    try {

      if (!payload) {
        throw new Error(
          "Compliance settings payload is required."
        );
      }

      const response =
        await axiosClient.put(
          "/compliance/settings",
          payload
        );

      return extractData(response);

    } catch (error) {

      console.error(
        "❌ Compliance settings update error:",
        error
      );

      throw error;
    }
  }

  // ========================================================
  // EXPORT COMPLIANCE DATA
  // ========================================================
  //
  // POST /api/compliance/export
  //
  // Example payload:
  //
  // {
  //   format: "csv",
  //   startDate,
  //   endDate
  // }
  //
  // ========================================================

  async exportComplianceData(
    payload = {}
  ) {
    try {

      const response =
        await axiosClient.post(
          "/compliance/export",
          payload
        );

      return extractData(response);

    } catch (error) {

      console.error(
        "❌ Compliance data export error:",
        error
      );

      throw error;
    }
  }
}

// ==========================================================
// SINGLETON SERVICE INSTANCE
// ==========================================================
//
// IMPORTANT
// ----------------------------------------------------------
// Use:
//
// import complianceService from
// "../services/complianceService";
//
// Then:
//
// complianceService.getComplianceStatus();
//
// ==========================================================

const complianceService =
  new ComplianceService();

export default complianceService;