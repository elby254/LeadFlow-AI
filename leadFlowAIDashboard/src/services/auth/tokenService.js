/**
 * ==========================================================
 *
 * Responsible for:
 *
 * • Access Token validation
 * • Automatic token refresh
 * • Session expiration detection
 * • Refresh Token management
 *
 * Used by:
 * • axiosClient
 * • AuthContext
 * • ProtectedRoute
 *
 * Backend Endpoints
 * ----------------------------------------------------------
 * POST /api/auth/refresh-token
 *
 * ==========================================================
 */

import axios from "axios";

import sessionService from "./sessionService";

const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000/api";

/* ==========================================================
   Decode JWT
========================================================== */

const decodeJWT = (token) => {
  try {
    const payload = token.split(".")[1];

    return JSON.parse(atob(payload));
  } catch (error) {
    return null;
  }
};

/* ==========================================================
   Check Expiration
========================================================== */

export const isTokenExpired = () => {
  const token = sessionService.getToken();

  if (!token) return true;

  const decoded = decodeJWT(token);

  if (!decoded?.exp) return true;

  /**
   * exp is seconds
   */

  return decoded.exp * 1000 < Date.now();
};

/* ==========================================================
   Refresh Access Token
========================================================== */

export const refreshAccessToken = async () => {
  try {
    const refreshToken =
      sessionService.getRefreshToken();

    if (!refreshToken) {
      throw new Error(
        "Refresh token not found."
      );
    }

    const response = await axios.post(
      `${API_BASE_URL}/auth/refresh-token`,
      {
        refreshToken,
      }
    );

    /**
     * Expected response
     *
     * {
     *    token,
     *    expiresAt
     * }
     */

    const { token, expiresAt } =
      response.data;

    sessionService.updateToken(
      token,
      expiresAt
    );

    return token;
  } catch (error) {
    /**
     * Refresh failed.
     * Destroy session.
     */

    sessionService.clearSession();

    throw error;
  }
};

/* ==========================================================
   Get Valid Token
========================================================== */

export const getValidToken = async () => {
  /**
   * Current token still valid
   */

  if (!isTokenExpired()) {
    return sessionService.getToken();
  }

  /**
   * Expired
   * Request new one
   */

  return await refreshAccessToken();
};

/* ==========================================================
   Authorization Header
========================================================== */

export const getAuthorizationHeader =
  async () => {
    const token = await getValidToken();

    if (!token) return {};

    return {
      Authorization: `Bearer ${token}`,
    };
  };

/* ==========================================================
   EXPORT
========================================================== */

const tokenService = {
  decodeJWT,

  isTokenExpired,

  refreshAccessToken,

  getValidToken,

  getAuthorizationHeader,
};

export default tokenService;