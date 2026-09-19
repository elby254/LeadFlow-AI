// =====================================================
//
// AUTHENTICATION & AUTHORIZATION MIDDLEWARE
//
// Purpose
// -----------------------------------------------------
// This middleware is the security layer for LeadFlow AI.
//
// Authentication:
//   ✓ Verify JWT
//   ✓ Load authenticated User
//   ✓ Attach req.user
//   ✓ Attach req.organizationId
//   ✓ Attach req.agentId
//
// Agent-side security:
//   ✓ Agent identity always comes from JWT/User
//   ✓ Organization always comes from authenticated User
//   ✓ Client-supplied agentId is never trusted
//   ✓ Client-supplied organizationId is never trusted
//
// IMPORTANT
// -----------------------------------------------------
// ADMIN-SIDE BEHAVIOR IS PRESERVED.
//
// Agent-side controllers/services should use:
//
//   req.user
//   req.agentId
//   req.organizationId
//
// They must NOT trust:
//
//   req.body.agentId
//   req.body.organizationId
//   req.query.agentId
//   req.query.organizationId
//   req.params.agentId
//   req.params.organizationId
//
// =====================================================

import jwt from "jsonwebtoken";
import User from "../models/user.js";

// =====================================================
// ROLE NORMALIZATION
// =====================================================

const normalizeRole = (role) => {
  const normalized = String(role || "")
    .trim()
    .toLowerCase();

  if (normalized === "customer") {
    return "viewer";
  }

  if (normalized === "user") {
    return "viewer";
  }

  return normalized;
};

// =====================================================
// EXTRACT TOKEN
// =====================================================

const getTokenFromRequest = (req) => {
  const authHeader = req.headers.authorization;

  if (
    !authHeader ||
    typeof authHeader !== "string"
  ) {
    return null;
  }

  if (
    !authHeader.startsWith("Bearer ")
  ) {
    return null;
  }

  const token = authHeader
    .slice(7)
    .trim();

  return token || null;
};

// =====================================================
// PROTECT ROUTES
// =====================================================
//
// This middleware:
//
//   1. Verifies JWT
//   2. Finds User
//   3. Attaches req.user
//   4. Attaches authenticated organization
//   5. Attaches authenticated agent ID
//
// =====================================================

export const protect = async (
  req,
  res,
  next
) => {
  try {
    // -------------------------------------------------
    // JWT CONFIGURATION
    // -------------------------------------------------

    if (!process.env.JWT_SECRET) {
      console.error(
        "AUTHENTICATION ERROR: JWT_SECRET is not configured."
      );

      return res.status(500).json({
        success: false,
        message:
          "Authentication service is not configured.",
      });
    }

    // -------------------------------------------------
    // GET TOKEN
    // -------------------------------------------------

    const token =
      getTokenFromRequest(req);

    // -------------------------------------------------
    // NO TOKEN
    // -------------------------------------------------

    if (!token) {
      return res.status(401).json({
        success: false,
        message:
          "Authentication required.",
      });
    }

    // -------------------------------------------------
    // VERIFY TOKEN
    // -------------------------------------------------

    const decoded =
      jwt.verify(
        token,
        process.env.JWT_SECRET
      );

    // -------------------------------------------------
    // EXTRACT USER ID
    // -------------------------------------------------

    const userId =
      decoded?.id ||
      decoded?.userId ||
      decoded?._id;

    if (!userId) {
      console.error(
        "AUTHENTICATION ERROR: JWT does not contain a user ID."
      );

      return res.status(401).json({
        success: false,
        message:
          "Authentication required.",
      });
    }

    // -------------------------------------------------
    // FIND AUTHENTICATED USER
    // -------------------------------------------------

    const user =
      await User.findById(userId)
        .select("-password");

    if (!user) {
      console.error(
        "AUTHENTICATION ERROR: User from JWT was not found."
      );

      return res.status(401).json({
        success: false,
        message:
          "Authentication required.",
      });
    }

    // -------------------------------------------------
    // NORMALIZE ROLE
    // -------------------------------------------------

    const role =
      normalizeRole(user.role);

    // -------------------------------------------------
    // ATTACH AUTHENTICATED USER
    // -------------------------------------------------

    req.user = user;

    // Do not replace the database user's role object.
    // Store the normalized role on req.user for
    // downstream authorization checks.
    req.user.role = role;

    // -------------------------------------------------
    // AUTHENTICATED ORGANIZATION
    // -------------------------------------------------

    req.organizationId =
      user.organizationId || null;

    // -------------------------------------------------
    // AUTHENTICATED AGENT ID
    // -------------------------------------------------
    //
    // This is ALWAYS the authenticated User _id.
    //
    // It is NOT taken from:
    //
    //   req.body
    //   req.query
    //   req.params
    //   JWT-supplied agentId
    //
    // The JWT identifies the User.
    // The database User record is authoritative.
    //
    // -------------------------------------------------

    req.agentId =
      user._id;

    // -------------------------------------------------
    // DEBUG
    // -------------------------------------------------

    console.log(
      "[AUTH] Authenticated user:",
      {
        userId: user._id
          ? String(user._id)
          : null,

        name:
          user.name || null,

        email:
          user.email || null,

        role:
          role || null,

        organizationId:
          user.organizationId
            ? String(
                user.organizationId
              )
            : null,

        agentId:
          user._id
            ? String(user._id)
            : null,
      }
    );

    // -------------------------------------------------
    // AUTHENTICATION SUCCESS
    // -------------------------------------------------

    return next();

  } catch (error) {
    console.error(
      "AUTHENTICATION ERROR:",
      error.name,
      error.message
    );

    // -------------------------------------------------
    // JWT EXPIRED
    // -------------------------------------------------

    if (
      error.name ===
      "TokenExpiredError"
    ) {
      return res.status(401).json({
        success: false,
        message:
          "Authentication required.",
      });
    }

    // -------------------------------------------------
    // INVALID JWT
    // -------------------------------------------------

    if (
      error.name ===
      "JsonWebTokenError"
    ) {
      return res.status(401).json({
        success: false,
        message:
          "Authentication required.",
      });
    }

    // -------------------------------------------------
    // OTHER AUTH ERRORS
    // -------------------------------------------------

    return res.status(401).json({
      success: false,
      message:
        "Authentication required.",
    });
  }
};

// =====================================================
// REQUIRE ROLE
// =====================================================

export const requireRole = (
  ...allowedRoles
) => {
  const normalizedRoles =
    allowedRoles.map(
      normalizeRole
    );

  return (
    req,
    res,
    next
  ) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message:
          "Authentication required.",
      });
    }

    const userRole =
      normalizeRole(
        req.user.role
      );

    if (
      !normalizedRoles.includes(
        userRole
      )
    ) {
      return res.status(403).json({
        success: false,
        message:
          "You are not authorized to perform this action.",
      });
    }

    return next();
  };
};

// =====================================================
// ADMIN ONLY
// =====================================================
//
// ADMIN BEHAVIOR PRESERVED.
//
// =====================================================

export const adminOnly = (
  req,
  res,
  next
) => {
  return requireRole("admin")(
    req,
    res,
    next
  );
};

// =====================================================
// ADMIN / AGENT
// =====================================================
//
// ADMIN BEHAVIOR PRESERVED.
//
// =====================================================

export const adminOrAgent = (
  req,
  res,
  next
) => {
  return requireRole(
    "admin",
    "agent"
  )(
    req,
    res,
    next
  );
};

// =====================================================
// AGENT ONLY
// =====================================================
//
// STRICT AGENT AUTHENTICATION.
//
// This middleware assumes protect() has already run.
//
// It guarantees:
//
//   ✓ req.user exists
//   ✓ authenticated user has agent role
//   ✓ req.agentId is authenticated user's _id
//   ✓ req.organizationId belongs to authenticated user
//
// =====================================================

export const agentOnly = (
  req,
  res,
  next
) => {
  // -------------------------------------------------
  // AUTHENTICATION SAFETY
  // -------------------------------------------------

  if (!req.user) {
    return res.status(401).json({
      success: false,
      message:
        "Authentication required.",
    });
  }

  // -------------------------------------------------
  // ROLE CHECK
  // -------------------------------------------------

  const role =
    normalizeRole(
      req.user.role
    );

  if (role !== "agent") {
    return res.status(403).json({
      success: false,
      message:
        "You are not authorized to perform this action.",
    });
  }

  // -------------------------------------------------
  // ORGANIZATION CHECK
  // -------------------------------------------------

  if (!req.user.organizationId) {
    return res.status(403).json({
      success: false,
      message:
        "Organization not assigned.",
    });
  }

  // -------------------------------------------------
  // FORCE AUTHENTICATED AGENT CONTEXT
  // -------------------------------------------------

  req.agentId =
    req.user._id;

  req.organizationId =
    req.user.organizationId;

  // -------------------------------------------------
  // DEBUG
  // -------------------------------------------------

  console.log(
    "[AGENT AUTH] Agent context established:",
    {
      agentId:
        req.agentId
          ? String(req.agentId)
          : null,

      organizationId:
        req.organizationId
          ? String(
              req.organizationId
            )
          : null,

      role:
        role,
    }
  );

  return next();
};

// =====================================================
// AGENT IDENTITY CHECK
// =====================================================

export const sameAgent = (
  req,
  res,
  next
) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message:
        "Authentication required.",
    });
  }

  const role =
    normalizeRole(
      req.user.role
    );

  // -------------------------------------------------
  // Only enforce for agents
  // -------------------------------------------------

  if (role !== "agent") {
    return next();
  }

  const authenticatedAgentId =
    String(req.user._id);

  const requestedAgentId =
    req.params?.agentId ||
    req.body?.agentId ||
    req.query?.agentId;

  // -------------------------------------------------
  // No agent ID supplied
  // -------------------------------------------------

  if (!requestedAgentId) {
    req.agentId =
      req.user._id;

    return next();
  }

  // -------------------------------------------------
  // Prevent impersonation
  // -------------------------------------------------

  if (
    String(requestedAgentId) !==
    authenticatedAgentId
  ) {
    return res.status(403).json({
      success: false,
      message:
        "You cannot access another agent's data.",
    });
  }

  // -------------------------------------------------
  // Force authenticated ID
  // -------------------------------------------------

  req.agentId =
    req.user._id;

  return next();
};

// =====================================================
// ORGANIZATION OWNERSHIP CHECK
// =====================================================
//
// ADMIN BEHAVIOR PRESERVED.
//
// =====================================================

export const sameOrganization = (
  req,
  res,
  next
) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message:
        "Authentication required.",
    });
  }

  const authenticatedOrganizationId =
    req.user.organizationId ||
    req.organizationId;

  const requestedOrganizationId =
    req.params?.organizationId ||
    req.body?.organizationId ||
    req.query?.organizationId;

  const role =
    normalizeRole(
      req.user.role
    );

  // =================================================
  // STRICT AGENT BEHAVIOR
  // =================================================

  if (role === "agent") {
    if (
      !authenticatedOrganizationId
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Organization not assigned.",
      });
    }

    if (
      requestedOrganizationId &&
      String(
        authenticatedOrganizationId
      ) !==
      String(
        requestedOrganizationId
      )
    ) {
      return res.status(403).json({
        success: false,
        message:
          "You cannot access another organization's data.",
      });
    }

    req.organizationId =
      authenticatedOrganizationId;

    req.agentId =
      req.user._id;

    return next();
  }

  // =================================================
  // ADMIN / OTHER EXISTING BEHAVIOR
  // =================================================

  if (!requestedOrganizationId) {
    return next();
  }

  if (
    !authenticatedOrganizationId
  ) {
    return res.status(403).json({
      success: false,
      message:
        "Organization not assigned.",
    });
  }

  if (
    String(
      authenticatedOrganizationId
    ) !==
    String(
      requestedOrganizationId
    )
  ) {
    return res.status(403).json({
      success: false,
      message:
        "You cannot access another organization's data.",
    });
  }

  return next();
};

// =====================================================
// STRICT AGENT CONTEXT
// =====================================================
//
// Convenience middleware for agent workflows.
//
// =====================================================

export const strictAgentContext = (
  req,
  res,
  next
) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message:
        "Authentication required.",
    });
  }

  const role =
    normalizeRole(
      req.user.role
    );

  if (role !== "agent") {
    return res.status(403).json({
      success: false,
      message:
        "You are not authorized to perform this action.",
    });
  }

  if (!req.user.organizationId) {
    return res.status(403).json({
      success: false,
      message:
        "Organization not assigned.",
    });
  }

  // -------------------------------------------------
  // Force authenticated context
  // -------------------------------------------------

  req.organizationId =
    req.user.organizationId;

  req.agentId =
    req.user._id;

  console.log(
    "[STRICT AGENT CONTEXT]",
    {
      agentId:
        String(req.agentId),

      organizationId:
        String(
          req.organizationId
        ),

      role:
        req.user.role,
    }
  );

  return next();
};

// =====================================================
// EXPORT HELPERS
// =====================================================

export {
  normalizeRole,
  getTokenFromRequest,
};