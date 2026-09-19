/**
 * ==========================================================
 *
 * Purpose
 * ----------------------------------------------------------
 * Protects frontend routes based on authentication and
 * user role.
 *
 * Supported roles:
 * ----------------------------------------------------------
 * • admin
 * • agent
 * • viewer
 *
 * Authentication flow:
 *
 * Login
 *   ↓
 * AuthContext
 *   ↓
 * isAuthenticated
 *   ↓
 * RoleRoute
 *   ↓
 * Correct workspace
 *
 * ==========================================================
 */

import { Navigate } from "react-router-dom";

import useAuth from "../../hooks/useAuth";

/* ==========================================================
   ROLE ROUTE
========================================================== */

const RoleRoute = ({
  allowedRoles = [],
  children,
}) => {

  /* ========================================================
     AUTHENTICATION
  ======================================================== */

  const {
    loading,
    isAuthenticated,
    user,
  } = useAuth();

  /* ========================================================
     WAIT FOR AUTHENTICATION RESTORATION
  ======================================================== */

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <p className="text-slate-400">
          Loading authentication...
        </p>
      </div>
    );
  }

  /* ========================================================
     NOT AUTHENTICATED
  ======================================================== */

  if (!isAuthenticated || !user) {
    console.warn(
      "RoleRoute: user is not authenticated."
    );

    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  /* ========================================================
     USER ROLE
  ======================================================== */

  const userRole =
    user.role?.toLowerCase();

  /* ========================================================
     NORMALIZE ALLOWED ROLES
     
     This makes the route tolerant of:
     
     "admin"
     "ADMIN"
     "Admin"
     
     while the backend remains the source of truth.
  ======================================================== */

  const normalizedAllowedRoles =
    allowedRoles.map((role) =>
      role?.toLowerCase()
    );

  /* ========================================================
     ROLE AUTHORIZATION
  ======================================================== */

  if (
    normalizedAllowedRoles.length > 0 &&
    !normalizedAllowedRoles.includes(userRole)
  ) {

    console.warn(
      "RoleRoute: unauthorized role.",
      {
        userRole,
        allowedRoles: normalizedAllowedRoles,
      }
    );

    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  /* ========================================================
     AUTHORIZED
  ======================================================== */

  console.log(
    "RoleRoute: access granted.",
    {
      user: user.email,
      role: userRole,
    }
  );

  return children;
};

export default RoleRoute;

