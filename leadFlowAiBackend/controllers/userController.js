// user management file. This controller allows an Admin to manage their team.
import User from "../models/user.js";

// =====================================================
// GET ALL USERS IN ORGANIZATION
// Admin Only
// =====================================================

export const getOrganizationUsers = async (
  req,
  res
) => {
  try {
    const users = await User.find({
      organizationId:
        req.user.organizationId,
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
    const agents = await User.find({
      organizationId:
        req.user.organizationId,
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
    const viewers = await User.find({
      organizationId:
        req.user.organizationId,
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
    const user = await User.findOne({
      _id: req.params.id,
      organizationId:
        req.user.organizationId,
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
    const user = await User.findOneAndUpdate(
      {
        _id: req.params.id,
        organizationId:
          req.user.organizationId,
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
    const user = await User.findOneAndUpdate(
      {
        _id: req.params.id,
        organizationId:
          req.user.organizationId,
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