/**
 * ==========================================================
 *
 * Purpose
 * -------
 * Protects private CRM routes from unauthenticated users.
 *
 * Responsibilities
 * ----------------
 * ✓ Verify authentication
 * ✓ Verify valid session exists
 * ✓ Redirect unauthenticated users to Login
 *
 * NOTE
 * ----
 * This component DOES NOT check roles.
 *
 * Role-based authorization is handled by:
 *
 * RoleRoute.jsx
 *
 * Example
 * -------
 *
 * <ProtectedRoute>
 *      <Dashboard />
 * </ProtectedRoute>
 *
 * ==========================================================
 */

import { Navigate } from "react-router-dom";

import useAuth from "../../hooks/useAuth";

const ProtectedRoute = ({ children }) => {
  //----------------------------------------------------------
  // Authentication
  //----------------------------------------------------------

  const {
    loading,
    isAuthenticated,
  } = useAuth();

  //----------------------------------------------------------
  // Wait while authentication restores
  //----------------------------------------------------------

  if (loading) {
    return (
      <div
        className="
          flex
          min-h-screen
          items-center
          justify-center
          bg-slate-950
        "
      >
        <div
          className="
            rounded-2xl
            border
            border-slate-800
            bg-slate-900
            px-8
            py-6
            shadow-xl
          "
        >
          <p
            className="
              text-lg
              font-medium
              text-slate-300
            "
          >
            Restoring session...
          </p>
        </div>
      </div>
    );
  }

  //----------------------------------------------------------
  // User not authenticated
  //----------------------------------------------------------

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  //----------------------------------------------------------
  // Authenticated
  //----------------------------------------------------------

  return children;
};

export default ProtectedRoute;