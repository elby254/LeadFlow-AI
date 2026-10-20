// user management file.
// This controller allows an Admin to manage their team.

import User from "../models/user.js";

import {
  resolveFromRequest,
} from "../services/organizationResolverService.js";

// =====================================================
// ORGANIZATION RESOLVER
// =====================================================

/**
 * Resolve the authenticated user's active organization
 * through the centralized organization resolver.
 */
const getOrganizationId = async (req) => {
  const organization =
    await resolveFromRequest(req);

  if (!organization) {
    return null;
  }

  return organization._id || null;
};

// =====================================================
// GET ALL USERS IN ORGANIZATION
// Admin Only
// =====================================================

export const getOrganizationUsers = async (
  req,
  res
) => {
  try {
    const organizationId =
      await getOrganizationId(req);

    if (!organizationId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const users = await User.find({
      organizationId,
    }).select("-password");

    return res.status(200).json({
      success: true,
      count: users.length,
      users,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to load users",
      error: error.message,
    });
  }
};

// =====================================================
// GET ALL AGENTS
// =====================================================

export const getAgents = async (
  req,
  res
) => {
  try {
    const organizationId =
      await getOrganizationId(req);

    if (!organizationId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const agents = await User.find({
      organizationId,
      role: "agent",
    }).select("-password");

    return res.status(200).json({
      success: true,
      count: agents.length,
      agents,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to load agents",
      error: error.message,
    });
  }
};

// =====================================================
// GET ALL VIEWERS
// =====================================================

export const getViewers = async (
  req,
  res
) => {
  try {
    const organizationId =
      await getOrganizationId(req);

    if (!organizationId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const viewers = await User.find({
      organizationId,
      role: "viewer",
    }).select("-password");

    return res.status(200).json({
      success: true,
      count: viewers.length,
      viewers,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to load viewers",
      error: error.message,
    });
  }
};

// =====================================================
// GET SINGLE USER
// =====================================================

export const getUserById = async (
  req,
  res
) => {
  try {
    const organizationId =
      await getOrganizationId(req);

    if (!organizationId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const user = await User.findOne({
      _id: req.params.id,
      organizationId,
    }).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to load user",
      error: error.message,
    });
  }
};

// =====================================================
// DEACTIVATE USER
// =====================================================

export const deactivateUser = async (
  req,
  res
) => {
  try {
    const organizationId =
      await getOrganizationId(req);

    if (!organizationId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const user =
      await User.findOneAndUpdate(
        {
          _id: req.params.id,
          organizationId,
        },
        {
          isActive: false,
        },
        {
          returnDocument: "after",
        }
      ).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "User deactivated",
      user,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to deactivate user",
      error: error.message,
    });
  }
};

// =====================================================
// ACTIVATE USER
// =====================================================

export const activateUser = async (
  req,
  res
) => {
  try {
    const organizationId =
      await getOrganizationId(req);

    if (!organizationId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const user =
      await User.findOneAndUpdate(
        {
          _id: req.params.id,
          organizationId,
        },
        {
          isActive: true,
        },
        {
          returnDocument: "after",
        }
      ).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "User activated",
      user,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to activate user",
      error: error.message,
    });
  }
};