/**
 * ==========================================================
 *
 * Centralized role definitions for the application.
 *
 * Purpose
 * -------
 * Prevent hardcoded role strings throughout the codebase.
 *
 * Instead of:
 *
 * if (user.role === "admin")
 *
 * Use:
 *
 * if (user.role === ROLES.ADMIN)
 *
 * Used by:
 * • AuthContext
 * • useAuth
 * • ProtectedRoute
 * • RoleRoute
 * • Sidebar Navigation
 * • Dashboard Routing
 * • Permission Guards
 *
 * ==========================================================
 */

/* ==========================================================
   ROLE CONSTANTS
========================================================== */

export const ROLES = Object.freeze({
  ADMIN: "admin",

  AGENT: "agent",

  VIEWER: "viewer",
});

/* ==========================================================
   DASHBOARD ROUTES
========================================================== */

export const ROLE_DASHBOARDS = Object.freeze({
  [ROLES.ADMIN]: "/dashboard/admin",

  [ROLES.AGENT]: "/dashboard/agent",

  [ROLES.VIEWER]: "/dashboard/viewer",
});

/* ==========================================================
   LOGIN REDIRECTS
========================================================== */

export const getDashboardByRole = (role) => {
  return (
    ROLE_DASHBOARDS[role] || "/login"
  );
};

/* ==========================================================
   ROLE CHECKERS
========================================================== */

export const isAdmin = (role) =>
  role === ROLES.ADMIN;

export const isAgent = (role) =>
  role === ROLES.AGENT;

export const isViewer = (role) =>
  role === ROLES.VIEWER;

/* ==========================================================
   ALL ROLES
========================================================== */

export const ALL_ROLES = Object.freeze([
  ROLES.ADMIN,
  ROLES.AGENT,
  ROLES.VIEWER,
]);

/* ==========================================================
   DEFAULT EXPORT
========================================================== */

export default ROLES;