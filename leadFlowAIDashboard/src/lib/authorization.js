/**
 * ==========================================================
 *
 * Maps Roles → Permissions
 *
 * Used by:
 *
 * • useAuth()
 * • RoleRoute.jsx
 * • ProtectedRoute.jsx
 * • Sidebar Navigation
 * • Feature Guards
 * • API Guards
 *
 * ==========================================================
 */

import ROLES from "./roles";
import PERMISSIONS from "./permissions";

/* ==========================================================
   ROLE → PERMISSION MAP
========================================================== */

export const ROLE_PERMISSIONS = Object.freeze({

  /* =======================================================
      ADMIN
  ======================================================= */

  [ROLES.ADMIN]: [

    // Leads
    PERMISSIONS.VIEW_LEADS,
    PERMISSIONS.CREATE_LEADS,
    PERMISSIONS.EDIT_LEADS,
    PERMISSIONS.DELETE_LEADS,
    PERMISSIONS.ASSIGN_LEADS,
    PERMISSIONS.EXPORT_LEADS,

    // Conversations
    PERMISSIONS.VIEW_CONVERSATIONS,
    PERMISSIONS.SEND_MESSAGES,
    PERMISSIONS.DELETE_MESSAGES,
    PERMISSIONS.AI_REPLY,

    // Follow Ups
    PERMISSIONS.VIEW_FOLLOWUPS,
    PERMISSIONS.CREATE_FOLLOWUPS,
    PERMISSIONS.EDIT_FOLLOWUPS,
    PERMISSIONS.COMPLETE_FOLLOWUPS,

    // Properties
    PERMISSIONS.VIEW_PROPERTIES,
    PERMISSIONS.CREATE_PROPERTIES,
    PERMISSIONS.EDIT_PROPERTIES,
    PERMISSIONS.DELETE_PROPERTIES,
    PERMISSIONS.MANAGE_PROPERTIES,
    PERMISSIONS.FEATURE_PROPERTIES,

    // Viewings
    PERMISSIONS.VIEW_APPOINTMENTS,
    PERMISSIONS.CREATE_APPOINTMENTS,
    PERMISSIONS.APPROVE_APPOINTMENTS,
    PERMISSIONS.CANCEL_APPOINTMENTS,

    // Reports
    PERMISSIONS.VIEW_REPORTS,
    PERMISSIONS.EXPORT_REPORTS,
    PERMISSIONS.VIEW_ANALYTICS,

    // AI
    PERMISSIONS.VIEW_AI_INSIGHTS,
    PERMISSIONS.CONFIGURE_AI,
    PERMISSIONS.OVERRIDE_AI_DECISIONS,

    // Users
    PERMISSIONS.VIEW_USERS,
    PERMISSIONS.CREATE_USERS,
    PERMISSIONS.EDIT_USERS,
    PERMISSIONS.DELETE_USERS,
    PERMISSIONS.ASSIGN_ROLES,

    // Agency
    PERMISSIONS.VIEW_AGENCY,
    PERMISSIONS.EDIT_AGENCY,
    PERMISSIONS.MANAGE_SUBSCRIPTION,

    // Notifications
    PERMISSIONS.VIEW_NOTIFICATIONS,
    PERMISSIONS.SEND_NOTIFICATIONS,

    // Settings
    PERMISSIONS.VIEW_SETTINGS,
    PERMISSIONS.EDIT_SETTINGS,

    // Dashboards
    PERMISSIONS.VIEW_ADMIN_DASHBOARD,

  ],

  /* =======================================================
      AGENT
  ======================================================= */

  [ROLES.AGENT]: [

    PERMISSIONS.VIEW_LEADS,
    PERMISSIONS.EDIT_LEADS,

    PERMISSIONS.VIEW_CONVERSATIONS,
    PERMISSIONS.SEND_MESSAGES,

    PERMISSIONS.VIEW_FOLLOWUPS,
    PERMISSIONS.CREATE_FOLLOWUPS,
    PERMISSIONS.COMPLETE_FOLLOWUPS,

    PERMISSIONS.VIEW_PROPERTIES,

    PERMISSIONS.VIEW_APPOINTMENTS,
    PERMISSIONS.CREATE_APPOINTMENTS,

    PERMISSIONS.VIEW_AGENT_DASHBOARD,

  ],

  /* =======================================================
      VIEWER
  ======================================================= */

  [ROLES.VIEWER]: [

    PERMISSIONS.VIEW_PROPERTIES,

    PERMISSIONS.VIEW_APPOINTMENTS,

    PERMISSIONS.VIEW_CONVERSATIONS,

    PERMISSIONS.SEND_MESSAGES,

    PERMISSIONS.VIEW_VIEWER_DASHBOARD,

  ],

});

/* ==========================================================
   GET PERMISSIONS FOR ROLE
========================================================== */

export const getPermissionsByRole = (role) => {

  return ROLE_PERMISSIONS[role] || [];

};

/* ==========================================================
   CHECK PERMISSION
========================================================== */

export const hasPermission = (

  role,

  permission

) => {

  return getPermissionsByRole(role).includes(permission);

};

/* ==========================================================
   CHECK MULTIPLE PERMISSIONS
========================================================== */

export const hasAnyPermission = (

  role,

  permissions = []

) => {

  return permissions.some(permission =>

    hasPermission(role, permission)

  );

};

/* ==========================================================
   REQUIRE ALL PERMISSIONS
========================================================== */

export const hasAllPermissions = (

  role,

  permissions = []

) => {

  return permissions.every(permission =>

    hasPermission(role, permission)

  );

};

/* ==========================================================
   ROLE HELPERS
========================================================== */

export const canAccessAdminDashboard = role =>

  role === ROLES.ADMIN;

export const canAccessAgentDashboard = role =>

  role === ROLES.AGENT;

export const canAccessViewerDashboard = role =>

  role === ROLES.VIEWER;

/* ==========================================================
   FEATURE HELPERS
========================================================== */

export const canManageLeads = role =>

  hasPermission(role, PERMISSIONS.EDIT_LEADS);

export const canAssignLeads = role =>

  hasPermission(role, PERMISSIONS.ASSIGN_LEADS);

export const canManageProperties = role =>

  hasPermission(role, PERMISSIONS.MANAGE_PROPERTIES);

export const canViewReports = role =>

  hasPermission(role, PERMISSIONS.VIEW_REPORTS);

export const canConfigureAI = role =>

  hasPermission(role, PERMISSIONS.CONFIGURE_AI);

export const canSendMessages = role =>

  hasPermission(role, PERMISSIONS.SEND_MESSAGES);

export const canViewAnalytics = role =>

  hasPermission(role, PERMISSIONS.VIEW_ANALYTICS);

export const canViewLead = (role) =>
  hasPermission(role, PERMISSIONS.VIEW_LEADS);

export const canCreateLead = (role) =>
  hasPermission(role, PERMISSIONS.CREATE_LEADS);

export const canEditLead = (role) =>
  hasPermission(role, PERMISSIONS.EDIT_LEADS);

export const canDeleteLead = (role) =>
  hasPermission(role, PERMISSIONS.DELETE_LEADS);

export const canAssignLead = (role) =>
  hasPermission(role, PERMISSIONS.ASSIGN_LEADS);

export const canViewProperty = (role) =>
  hasPermission(role, PERMISSIONS.VIEW_PROPERTIES);

export const canCreateProperty = (role) =>
  hasPermission(role, PERMISSIONS.CREATE_PROPERTIES);

export const canEditProperty = (role) =>
  hasPermission(role, PERMISSIONS.EDIT_PROPERTIES);

export const canDeleteProperty = (role) =>
  hasPermission(role, PERMISSIONS.DELETE_PROPERTIES);

export const canFeatureProperty = (role) =>
  hasPermission(role, PERMISSIONS.FEATURE_PROPERTIES);

export const canExportReports = (role) =>
  hasPermission(role, PERMISSIONS.EXPORT_REPORTS);

export const canViewUsers = (role) =>
  hasPermission(role, PERMISSIONS.VIEW_USERS);

export const canCreateUsers = (role) =>
  hasPermission(role, PERMISSIONS.CREATE_USERS);

export const canEditUsers = (role) =>
  hasPermission(role, PERMISSIONS.EDIT_USERS);

export const canDeleteUsers = (role) =>
  hasPermission(role, PERMISSIONS.DELETE_USERS);

/* ==========================================================
   DEFAULT EXPORT
========================================================== */

const authorization = {

  ROLE_PERMISSIONS,

  getPermissionsByRole,

  hasPermission,

  hasAnyPermission,

  hasAllPermissions,

  canAccessAdminDashboard,

  canAccessAgentDashboard,

  canAccessViewerDashboard,

  canManageLeads,

  canAssignLeads,

  canManageProperties,

  canViewReports,

  canConfigureAI,

  canSendMessages,

  canViewAnalytics,

  canCreateLead,
  canEditLead,
  canDeleteLead,
  canAssignLead,

  canViewProperty,
  canCreateProperty,
  canEditProperty,
  canDeleteProperty,
  canFeatureProperty,

  canExportReports,

  canViewUsers,
  canCreateUsers,
  canEditUsers,
  canDeleteUsers,

};

export default authorization;