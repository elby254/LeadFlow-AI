/**
 * ==========================================================
 *
 * PURPOSE
 * ----------------------------------------------------------
 * Central service responsible for user management.
 *
 * All user-related API requests should go through
 * this service instead of calling axios directly.
 *
 * Used By
 * ----------------------------------------------------------
 * • Admin User Management
 * • Profile Page
 * • Agent Performance
 * • Settings
 * • Auth Context (future profile refresh)
 *
 * Backend
 * ----------------------------------------------------------
 * GET    /api/users
 * GET    /api/users/:id
 * POST   /api/users
 * PUT    /api/users/:id
 * DELETE /api/users/:id
 *
 * Future
 * ----------------------------------------------------------
 * • Activate / Deactivate user
 * • Assign role
 * • Upload avatar
 * • Organization membership
 *
 * ==========================================================
 */

import axiosClient from "../api/axiosClient";

class UserService {

  /* ========================================================
     GET ALL USERS
  ======================================================== */

  async getUsers(params = {}) {

    const response =
      await axiosClient.get(
        "/users",
        {
          params,
        }
      );

    return response.data;

  }

  /* ========================================================
     GET SINGLE USER
  ======================================================== */

  async getUser(userId) {

    if (!userId) {
      throw new Error("User ID is required.");
    }

    const response =
      await axiosClient.get(
        `/users/${userId}`
      );

    return response.data;

  }

  /* ========================================================
     CREATE USER
  ======================================================== */

  async createUser(payload) {

    /**
     * Example Payload
     *
     * {
     *   name,
     *   email,
     *   password,
     *   role,
     *   organizationId
     * }
     */

    const response =
      await axiosClient.post(
        "/users",
        payload
      );

    return response.data;

  }

  /* ========================================================
     UPDATE USER
  ======================================================== */

  async updateUser(userId, payload) {

    if (!userId) {
      throw new Error("User ID is required.");
    }

    const response =
      await axiosClient.put(
        `/users/${userId}`,
        payload
      );

    return response.data;

  }

  /* ========================================================
     DELETE USER
  ======================================================== */

  async deleteUser(userId) {

    if (!userId) {
      throw new Error("User ID is required.");
    }

    const response =
      await axiosClient.delete(
        `/users/${userId}`
      );

    return response.data;

  }

  /* ========================================================
     CHANGE USER ROLE
  ======================================================== */

  async changeRole(userId, role) {

    if (!userId) {
      throw new Error("User ID is required.");
    }

    const response =
      await axiosClient.patch(
        `/users/${userId}/role`,
        { role }
      );

    return response.data;

  }

  /* ========================================================
     ACTIVATE / DEACTIVATE USER
  ======================================================== */

  async toggleStatus(userId, isActive) {

    if (!userId) {
      throw new Error("User ID is required.");
    }

    const response =
      await axiosClient.patch(
        `/users/${userId}/status`,
        { isActive }
      );

    return response.data;

  }

  /* ========================================================
     GET CURRENT USER PROFILE
  ======================================================== */

  async getProfile() {

    const response =
      await axiosClient.get(
        "/users/profile"
      );

    return response.data;

  }

}

/* ==========================================================
   SINGLETON EXPORT
========================================================== */

const userService =
  new UserService();

export default userService;