/**
 * ==========================================================
 *
 * Central permission registry.
 *
 * Purpose
 * -------
 * Prevent hardcoded permission strings across the system.
 *
 * Instead of:
 *
 * if(user.permissions.includes("VIEW_LEADS"))
 *
 * Use:
 *
 * if(user.permissions.includes(PERMISSIONS.VIEW_LEADS))
 *
 * Used by:
 * • AuthContext
 * • useAuth
 * • RoleRoute
 * • authorization.js
 * • Sidebar
 * • Dashboards
 * • API Guards
 *
 * ==========================================================
 */

/* ==========================================================
   CRM / LEADS
========================================================== */

export const PERMISSIONS = Object.freeze({

  /* -------------------------------
     Lead Management
  -------------------------------- */

  VIEW_LEADS: "VIEW_LEADS",

  CREATE_LEADS: "CREATE_LEADS",

  EDIT_LEADS: "EDIT_LEADS",

  DELETE_LEADS: "DELETE_LEADS",

  ASSIGN_LEADS: "ASSIGN_LEADS",

  EXPORT_LEADS: "EXPORT_LEADS",

  /* -------------------------------
     Conversations
  -------------------------------- */

  VIEW_CONVERSATIONS: "VIEW_CONVERSATIONS",

  SEND_MESSAGES: "SEND_MESSAGES",

  DELETE_MESSAGES: "DELETE_MESSAGES",

  AI_REPLY: "AI_REPLY",

  /* -------------------------------
     Follow Ups
  -------------------------------- */

  VIEW_FOLLOWUPS: "VIEW_FOLLOWUPS",

  CREATE_FOLLOWUPS: "CREATE_FOLLOWUPS",

  EDIT_FOLLOWUPS: "EDIT_FOLLOWUPS",

  COMPLETE_FOLLOWUPS: "COMPLETE_FOLLOWUPS",

  /* -------------------------------
     Properties
  -------------------------------- */

  VIEW_PROPERTIES: "VIEW_PROPERTIES",

  CREATE_PROPERTIES: "CREATE_PROPERTIES",

  EDIT_PROPERTIES: "EDIT_PROPERTIES",

  DELETE_PROPERTIES: "DELETE_PROPERTIES",

  MANAGE_PROPERTIES: "MANAGE_PROPERTIES",

  FEATURE_PROPERTIES: "FEATURE_PROPERTIES",

  /* -------------------------------
     Property Viewings
  -------------------------------- */

  VIEW_APPOINTMENTS: "VIEW_APPOINTMENTS",

  CREATE_APPOINTMENTS: "CREATE_APPOINTMENTS",

  APPROVE_APPOINTMENTS: "APPROVE_APPOINTMENTS",

  CANCEL_APPOINTMENTS: "CANCEL_APPOINTMENTS",

  /* -------------------------------
     Reports
  -------------------------------- */

  VIEW_REPORTS: "VIEW_REPORTS",

  EXPORT_REPORTS: "EXPORT_REPORTS",

  VIEW_ANALYTICS: "VIEW_ANALYTICS",

  /* -------------------------------
     AI
  -------------------------------- */

  VIEW_AI_INSIGHTS: "VIEW_AI_INSIGHTS",

  CONFIGURE_AI: "CONFIGURE_AI",

  OVERRIDE_AI_DECISIONS: "OVERRIDE_AI_DECISIONS",

  /* -------------------------------
     Users
  -------------------------------- */

  VIEW_USERS: "VIEW_USERS",

  CREATE_USERS: "CREATE_USERS",

  EDIT_USERS: "EDIT_USERS",

  DELETE_USERS: "DELETE_USERS",

  ASSIGN_ROLES: "ASSIGN_ROLES",

  /* -------------------------------
     Agency
  -------------------------------- */

  VIEW_AGENCY: "VIEW_AGENCY",

  EDIT_AGENCY: "EDIT_AGENCY",

  MANAGE_SUBSCRIPTION: "MANAGE_SUBSCRIPTION",

  /* -------------------------------
     Notifications
  -------------------------------- */

  VIEW_NOTIFICATIONS: "VIEW_NOTIFICATIONS",

  SEND_NOTIFICATIONS: "SEND_NOTIFICATIONS",

  /* -------------------------------
     Settings
  -------------------------------- */

  VIEW_SETTINGS: "VIEW_SETTINGS",

  EDIT_SETTINGS: "EDIT_SETTINGS",

  /* -------------------------------
     Dashboard
  -------------------------------- */

  VIEW_ADMIN_DASHBOARD: "VIEW_ADMIN_DASHBOARD",

  VIEW_AGENT_DASHBOARD: "VIEW_AGENT_DASHBOARD",

  VIEW_VIEWER_DASHBOARD: "VIEW_VIEWER_DASHBOARD",

});

/* ==========================================================
   DEFAULT EXPORT
========================================================== */

export default PERMISSIONS;