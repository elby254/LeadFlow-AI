// handles register admin, login, create agent, create viewer
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import User from "../models/user.js";
import Organization from "../models/organization.js";

// =====================================================
// JWT TOKEN GENERATOR
// =====================================================

const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      role: user.role,
      organizationId: user.organizationId,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "7d",
    }
  );
};

// =====================================================
// ADMIN REGISTRATION
// Creates:
// 1. Organization
// 2. Admin User
// =====================================================

export const registerAdmin = async (req, res) => {
  try {
    const {
      organizationName,
      name,
      email,
      password,
      phone,
    } = req.body;

    if (!email || !password || !organizationName) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Email already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Prevent duplicate organization by name (important SaaS fix)
    let organization = await Organization.findOne({
      name: organizationName,
    });

    if (!organization) {
      organization = await Organization.create({
        name: organizationName,
        email,
        phone,
        owner: null,
      });
    }

    const admin = await User.create({
      name,
      email,
      password: hashedPassword,
      role: "admin",
      organizationId: organization._id,
    });

    organization.owner = admin._id;
    await organization.save();

    const token = generateToken(admin);

    return res.status(201).json({
      success: true,
      token,
      user: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        organizationId: admin.organizationId,
      },
      organization,
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Registration failed",
      error: error.message,
    });
  }
};

// =====================================================
// LOGIN
// Admin / Agent / Viewer
// =====================================================

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password required",
      });
    }

    const normalizedEmail =
  email.trim().toLowerCase();

const user =
  await User.findOne({

    email: normalizedEmail,

  });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const validPassword = await bcrypt.compare(
      password,
      user.password
    );

    if (!validPassword) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    user.lastLogin = new Date();
    await user.save();

    const token = generateToken(user);

    return res.status(200).json({

  success: true,

  token,

  user: {

    id: user._id,

    name: user.name,

    email: user.email,

    role: user.role,

    organizationId: user.organizationId,

    permissions: user.permissions || [],

    avatar: user.avatar || null,

  },

});

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Login failed",
      error: error.message,
    });
  }
};

// =====================================================
// CREATE AGENT
// Admin only
// =====================================================

export const createAgent = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!req.user?.organizationId) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized organization access",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const agent = await User.create({
      name,
      email,
      password: hashedPassword,
      role: "agent",
      organizationId: req.user.organizationId,
    });

    return res.status(201).json({
      success: true,
      user: {
        id: agent._id,
        name: agent.name,
        email: agent.email,
        role: agent.role,
      },
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Agent creation failed",
      error: error.message,
    });
  }
};

// =====================================================
// CREATE VIEWER
// Admin only
// =====================================================

export const createViewer = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!req.user?.organizationId) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized organization access",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const viewer = await User.create({
      name,
      email,
      password: hashedPassword,
      role: "viewer",
      organizationId: req.user.organizationId,
    });

    return res.status(201).json({
      success: true,
      user: {
        id: viewer._id,
        name: viewer.name,
        email: viewer.email,
        role: viewer.role,
      },
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Viewer creation failed",
      error: error.message,
    });
  }
};