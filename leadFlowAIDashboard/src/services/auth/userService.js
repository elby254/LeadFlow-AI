/**
 * ==========================================================
 *
 * Handles authenticated user profile management.
 *
 * Authentication is handled by authService.
 *
 * This service manages:
 *
 * • User Profile
 * • Preferences
 * • Avatar
 * • Account
 *
 * Backend Endpoints
 * ----------------------------------------------------------
 *
 * GET    /users/profile
 * PUT    /users/profile
 * PATCH  /users/preferences
 * PATCH  /users/avatar
 * DELETE /users/account
 *
 * ==========================================================
 */

import axiosClient from "../../api/axiosClient";

/* ==========================================================
   GET PROFILE
========================================================== */

export const getProfile = async () => {
  try {
    const response = await axiosClient.get(
      "/users/profile"
    );

    return response.data;
  } catch (error) {
    throw (
      error.response?.data || {
        message: "Unable to load profile.",
      }
    );
  }
};

/* ==========================================================
   UPDATE PROFILE
========================================================== */

export const updateProfile = async (profileData) => {
  try {
    const response = await axiosClient.put(
      "/users/profile",
      profileData
    );

    return response.data;
  } catch (error) {
    throw (
      error.response?.data || {
        message: "Unable to update profile.",
      }
    );
  }
};

/* ==========================================================
   UPDATE USER PREFERENCES
========================================================== */

export const updatePreferences = async (
  preferences
) => {
  try {
    const response = await axiosClient.patch(
      "/users/preferences",
      preferences
    );

    return response.data;
  } catch (error) {
    throw (
      error.response?.data || {
        message:
          "Unable to update preferences.",
      }
    );
  }
};

/* ==========================================================
   UPDATE PROFILE PHOTO
========================================================== */

export const updateAvatar = async (
  avatarData
) => {
  /**
   * avatarData should be FormData
   */

  try {
    const response = await axiosClient.patch(
      "/users/avatar",
      avatarData,
      {
        headers: {
          "Content-Type":
            "multipart/form-data",
        },
      }
    );

    return response.data;
  } catch (error) {
    throw (
      error.response?.data || {
        message:
          "Unable to update profile picture.",
      }
    );
  }
};

/* ==========================================================
   DELETE ACCOUNT
========================================================== */

export const deleteAccount = async () => {
  try {
    const response = await axiosClient.delete(
      "/users/account"
    );

    return response.data;
  } catch (error) {
    throw (
      error.response?.data || {
        message: "Unable to delete account.",
      }
    );
  }
};

/* ==========================================================
   EXPORT
========================================================== */

const userService = {
  getProfile,

  updateProfile,

  updatePreferences,

  updateAvatar,

  deleteAccount,
};

export default userService;