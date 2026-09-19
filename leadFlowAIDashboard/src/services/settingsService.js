/**
 * ==========================================================
 *
 * PURPOSE
 * ----------------------------------------------------------
 * Central service responsible for reading and updating
 * workspace/platform settings.
 *
 * Used By
 * ----------------------------------------------------------
 * • AdminSettings.jsx
 * • Future Organization Settings
 * • AI Configuration
 * • Notification Configuration
 * • Security Configuration
 *
 * Backend
 * ----------------------------------------------------------
 * GET    /api/settings
 * PUT    /api/settings
 *
 * Future
 * ----------------------------------------------------------
 * GET    /api/settings/security
 * GET    /api/settings/notifications
 * GET    /api/settings/ai
 * PUT    /api/settings/security
 * PUT    /api/settings/notifications
 * PUT    /api/settings/ai
 *
 * ==========================================================
 */

import axiosClient from "../api/axiosClient";

class SettingsService {

  /* ========================================================
     GET ALL SETTINGS
  ======================================================== */

  async getSettings() {

    const response =
      await axiosClient.get(
        "/settings"
      );

    return response.data;

  }

  /* ========================================================
     UPDATE ALL SETTINGS
  ======================================================== */

  async updateSettings(
    settings
  ) {

    const response =
      await axiosClient.put(
        "/settings",
        settings
      );

    return response.data;

  }

  /* ========================================================
     PLATFORM SETTINGS
  ======================================================== */

  async updatePlatformSettings(
    payload
  ) {

    const response =
      await axiosClient.put(
        "/settings/platform",
        payload
      );

    return response.data;

  }

  /* ========================================================
     AI SETTINGS
  ======================================================== */

  async updateAISettings(
    payload
  ) {

    const response =
      await axiosClient.put(
        "/settings/ai",
        payload
      );

    return response.data;

  }

  /* ========================================================
     NOTIFICATION SETTINGS
  ======================================================== */

  async updateNotificationSettings(
    payload
  ) {

    const response =
      await axiosClient.put(
        "/settings/notifications",
        payload
      );

    return response.data;

  }

  /* ========================================================
     SECURITY SETTINGS
  ======================================================== */

  async updateSecuritySettings(
    payload
  ) {

    const response =
      await axiosClient.put(
        "/settings/security",
        payload
      );

    return response.data;

  }

  /* ========================================================
     REGIONAL SETTINGS
  ======================================================== */

  async updateRegionalSettings(
    payload
  ) {

    const response =
      await axiosClient.put(
        "/settings/regional",
        payload
      );

    return response.data;

  }

  /* ========================================================
     MAINTENANCE MODE
  ======================================================== */

  async toggleMaintenanceMode(
    enabled
  ) {

    const response =
      await axiosClient.put(
        "/settings/maintenance",
        {
          maintenanceMode: enabled,
        }
      );

    return response.data;

  }

  /* ========================================================
     RESET SETTINGS TO DEFAULTS
  ======================================================== */

  async resetSettings() {

    const response =
      await axiosClient.post(
        "/settings/reset"
      );

    return response.data;

  }

}

/* ==========================================================
   SINGLETON EXPORT
========================================================== */

const settingsService =
  new SettingsService();

export default settingsService;