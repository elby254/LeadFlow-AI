/**
 * ==========================================================
 *
 * Central authentication hook used across the application.
 *
 * Every page should consume authentication through this hook.
 *
 * Example:
 *
 * const {
 *    user,
 *    login,
 *    logout,
 *    hasRole,
 *    hasPermission,
 *    isAdmin,
 *    isAgent,
 *    isViewer,
 * } = useAuth();
 *
 * ==========================================================
 */

import { useContext, useMemo } from "react";

import { AuthContext } from "../context/authContext";

const useAuth = () => {
  //----------------------------------------------------------
  // Global Auth Context
  //----------------------------------------------------------

  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside <AuthProvider>"
    );
  }

  //----------------------------------------------------------
  // Context Values
  //----------------------------------------------------------

  const {
  user,
  login,
  logout,
  register,
  updateProfile,
  loading,
  token,
  isAuthenticated,
} = context;

  //----------------------------------------------------------
  // ROLE HELPERS
  //----------------------------------------------------------

  const hasRole = (role) => {
    if (!user) return false;

    return user.role === role;
  };

  //----------------------------------------------------------
  // PERMISSION HELPERS
  //----------------------------------------------------------

  const hasPermission = (permission) => {
    if (!user) return false;

    if (!user.permissions) return false;

    return user.permissions.includes(permission);
  };

  //----------------------------------------------------------
  // Convenience Role Flags
  //----------------------------------------------------------

  const isAdmin = hasRole("admin");

  const isAgent = hasRole("agent");

  const isViewer = hasRole("viewer");

  //----------------------------------------------------------
  // Memoized Return Object
  //----------------------------------------------------------

  return useMemo(
    () => ({
      user,

      token,

      loading,

      login,

      logout,

      register,

      updateProfile,

      isAuthenticated,

      hasRole,

      hasPermission,

      isAdmin,

      isAgent,

      isViewer,
    }),
    [
      user,
      token,
      loading,
      login,
      logout,
      register,
      updateProfile,
    ]
  );
};

export default useAuth;