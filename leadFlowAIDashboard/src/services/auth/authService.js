/**
 * ==========================================================
 * Handles all authentication requests to the backend.
 *
 * Endpoints
 * ----------
 * POST /auth/login
 * POST /auth/logout
 * POST /auth/register
 * POST /auth/verify
 * POST /auth/refresh-token
 * GET  /auth/me
 *
 * Used by:
 * • AuthContext
 * • useAuth Hook
 * • Login Page
 * • Register Page
 * • OTP Verification
 *
 * ==========================================================
 */

import axiosClient from "../../api/axiosClient";

/* ==========================================================
   LOGIN
========================================================== */

export const login = async (credentials) => {
  try {
    const response = await axiosClient.post(
      "/auth/login",
      credentials
    );

    return response.data;
  } catch (error) {
    throw (
      error.response?.data || {
        message: "Unable to login.",
      }
    );
  }
};

/* ==========================================================
   REGISTER
========================================================== */

export const register = async (userData) => {
  try {
    const response = await axiosClient.post(
      "/auth/register",
      userData
    );

    return response.data;
  } catch (error) {
    throw (
      error.response?.data || {
        message: "Registration failed.",
      }
    );
  }
};


/* ==========================================================
   CURRENT AUTHENTICATED USER
========================================================== */

export const getCurrentUser = async () => {
  try {
    const response = await axiosClient.get("/auth/me");

    return response.data;
  } catch (error) {
    throw (
      error.response?.data || {
        message: "Unable to load current user.",
      }
    );
  }
};


/* ==========================================================
   VERIFY ACCOUNT / OTP
========================================================== */

export const verify = async (verificationData) => {
  try {
    const response = await axiosClient.post(
      "/auth/verify",
      verificationData
    );

    return response.data;
  } catch (error) {
    throw (
      error.response?.data || {
        message: "Verification failed.",
      }
    );
  }
};

/* ==========================================================
   REFRESH TOKEN
========================================================== */

export const refreshToken = async () => {
  try {
    const response = await axiosClient.post(
      "/auth/refresh-token"
    );

    return response.data;
  } catch (error) {
    throw (
      error.response?.data || {
        message: "Session expired.",
      }
    );
  }
};

/* ==========================================================
   LOGOUT
========================================================== */

export const logout = async () => {
  try {
    const response = await axiosClient.post(
      "/auth/logout"
    );

    return response.data;
  } catch (error) {
    throw (
      error.response?.data || {
        message: "Logout failed.",
      }
    );
  }
};

/* ==========================================================
   EXPORT
========================================================== */

const authService = {
  login,
  register,
  getCurrentUser,
  verify,
  refreshToken,
  logout,
};

export default authService;