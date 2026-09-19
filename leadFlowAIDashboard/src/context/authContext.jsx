// ======================================================
//
// Global Authentication Context
//
// Stores:
// ✓ Logged-in user
// ✓ JWT token
// ✓ Organization
// ✓ Role
// ✓ Permissions
//
// Authentication flow:
//
// Login.jsx
//    ↓
// POST /api/auth/login
//    ↓
// AuthContext.login()
//    ↓
// localStorage: leadflowai_auth
//    ↓
// axiosClient interceptor
//    ↓
// Authorization: Bearer <JWT>
//
// ======================================================

import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

// ======================================================
// CONTEXT
// ======================================================

export const AuthContext = createContext(null);

// ======================================================
// STORAGE
// ======================================================

const STORAGE_KEY = "leadflowai_auth";

// ======================================================
// PROVIDER
// ======================================================

export const AuthProvider = ({ children }) => {
  // ====================================================
  // AUTHENTICATION STATE
  // ====================================================

  const [user, setUser] = useState(null);

  const [token, setToken] = useState(null);

  const [loading, setLoading] = useState(true);

  // ====================================================
  // RESTORE SESSION
  // ====================================================

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);

      // -----------------------------------------------
      // No saved session
      // -----------------------------------------------

      if (!saved) {
        setLoading(false);
        return;
      }

      const auth = JSON.parse(saved);

      // -----------------------------------------------
      // Validate saved session
      // -----------------------------------------------

      if (!auth?.token || !auth?.user) {
        localStorage.removeItem(STORAGE_KEY);

        setLoading(false);

        return;
      }

      // -----------------------------------------------
      // Restore state
      // -----------------------------------------------

      setUser(auth.user);

      setToken(auth.token);

      console.log(
        "LeadFlow AI auth session restored."
      );

    } catch (error) {
      console.error(
        "Failed to restore LeadFlow AI auth session:",
        error
      );

      localStorage.removeItem(STORAGE_KEY);

      setUser(null);

      setToken(null);

    } finally {
      setLoading(false);
    }
  }, []);

  // ====================================================
  // LOGIN
  // ====================================================

  const login = useCallback((authData) => {
    // --------------------------------------------------
    // Validate backend response
    // --------------------------------------------------

    if (!authData?.token) {
      throw new Error(
        "Login response did not contain a JWT token."
      );
    }

    if (!authData?.user) {
      throw new Error(
        "Login response did not contain a user."
      );
    }

    // --------------------------------------------------
    // Extract session
    // --------------------------------------------------

    const authenticatedUser = authData.user;

    const authenticatedToken = authData.token;

    // --------------------------------------------------
    // Update React state
    // --------------------------------------------------

    setUser(authenticatedUser);

    setToken(authenticatedToken);

    // --------------------------------------------------
    // IMPORTANT
    // Persist immediately.
    //
    // Do NOT wait for the useEffect.
    // --------------------------------------------------

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        user: authenticatedUser,
        token: authenticatedToken,
      })
    );

    // --------------------------------------------------
    // Debug confirmation
    // --------------------------------------------------

    console.log(
      "LeadFlow AI login successful."
    );

    console.log(
      "Authenticated user:",
      authenticatedUser
    );

    console.log(
      "JWT stored:",
      !!authenticatedToken
    );

  }, []);

  // ====================================================
  // LOGOUT
  // ====================================================

  const logout = useCallback(() => {
    // --------------------------------------------------
    // Clear React state
    // --------------------------------------------------

    setUser(null);

    setToken(null);

    // --------------------------------------------------
    // Clear LeadFlow AI session
    // --------------------------------------------------

    localStorage.removeItem(STORAGE_KEY);

    // --------------------------------------------------
    // Remove legacy authentication storage
    // --------------------------------------------------

    localStorage.removeItem("user");

    localStorage.removeItem("token");

    console.log(
      "LeadFlow AI session cleared."
    );

  }, []);

  // ====================================================
  // REGISTER
  // ====================================================

  const register = useCallback(
    (authData) => {
      login(authData);
    },
    [login]
  );

  // ====================================================
  // UPDATE PROFILE
  // ====================================================

  const updateProfile = useCallback(
    (updates) => {
      setUser((previousUser) => {
        if (!previousUser) {
          return previousUser;
        }

        const updatedUser = {
          ...previousUser,
          ...updates,
        };

        // ---------------------------------------------
        // Keep localStorage synchronized
        // ---------------------------------------------

        const saved = localStorage.getItem(
          STORAGE_KEY
        );

        if (saved) {
          try {
            const auth = JSON.parse(saved);

            localStorage.setItem(
              STORAGE_KEY,
              JSON.stringify({
                ...auth,
                user: updatedUser,
              })
            );

          } catch (error) {
            console.error(
              "Failed to update stored user:",
              error
            );
          }
        }

        return updatedUser;
      });
    },
    []
  );

  // ====================================================
  // AUTHENTICATION STATUS
  // ====================================================

  const isAuthenticated =
    !!user && !!token;

  // ====================================================
  // BUSINESS CONTEXT
  // ====================================================

  const organizationId =
    user?.organizationId || null;

  const agencyId =
    user?.agencyId || null;

  const role =
    user?.role || null;

  const permissions =
    user?.permissions || [];

  // ====================================================
  // CONTEXT VALUE
  // ====================================================

  const value = useMemo(
    () => ({
      // Authentication
      user,
      token,
      loading,
      isAuthenticated,

      // Organization
      organizationId,
      agencyId,

      // Authorization
      role,
      permissions,

      // Actions
      login,
      logout,
      register,
      updateProfile,
    }),
    [
      user,
      token,
      loading,
      isAuthenticated,
      organizationId,
      agencyId,
      role,
      permissions,
      login,
      logout,
      register,
      updateProfile,
    ]
  );

  // ====================================================
  // PROVIDER
  // ====================================================

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// ======================================================
// EXPORT
// ======================================================

export default AuthProvider;