// =====================================================
//
// ROLE-BASED ACCESS CONTROL MIDDLEWARE
//
// Purpose
// -----------------------------------------------------
// Authorization AFTER authentication.
//
// Authentication:
//
//   protect()
//      ↓
//   req.user
//
// Authorization:
//
//   roleMiddleware
//      ↓
//   controller
//
// =====================================================
//
// SECURITY MODEL
// -----------------------------------------------------
//
// ADMIN
// ✓ Full administrative access
// ✓ Assign leads
// ✓ Reassign leads
// ✓ View unassigned leads
//
// AGENT
// ✓ View assigned leads
// ✓ Update their operational lead data
// ✓ View their own performance
// ✗ Cannot assign leads
// ✗ Cannot reassign leads
//
// VIEWER
// ✓ General authenticated access where permitted
// ✗ No assignment workflow access
//
// =====================================================
//
// IMPORTANT
// -----------------------------------------------------
// This middleware does NOT authenticate users.
//
// It expects:
//
//   protect
//      ↓
//   roleMiddleware
//      ↓
//   controller
//
// =====================================================


// =====================================================
// ROLE NORMALIZATION
// =====================================================

const normalizeRole = (role) => {
  const normalized = String(role || "")
    .trim()
    .toLowerCase();

  // ---------------------------------------------------
  // Legacy compatibility
  // ---------------------------------------------------
  //
  // Existing customer/user accounts are treated as
  // viewers by the LeadFlow AI role system.
  //
  // ---------------------------------------------------

  if (
    normalized === "customer" ||
    normalized === "user"
  ) {
    return "viewer";
  }

  return normalized;
};


// =====================================================
// GET AUTHENTICATED USER ID
// =====================================================
//
// Supports both:
//
//   req.user._id
//   req.user.id
//
// =====================================================

const getAuthenticatedUserId = (req) => {
  return (
    req.user?._id ||
    req.user?.id ||
    null
  );
};


// =====================================================
// GET AUTHENTICATED ORGANIZATION ID
// =====================================================
//
// Preferred:
//
//   req.user.organizationId
//
// If protect() has already placed the value on:
//
//   req.organizationId
//
// that value is also supported.
//
// =====================================================

const getAuthenticatedOrganizationId = (req) => {
  return (
    req.user?.organizationId ||
    req.organizationId ||
    null
  );
};


// =====================================================
// ADMIN ONLY
// =====================================================
//
// ADMIN-ONLY authorization.
//
// Used for:
//
//   assignmentController.assignLead
//   assignmentController.reassignLead
//   assignmentController.getUnassignedLeads
//
// Expected chain:
//
//   protect
//      ↓
//   adminOnly
//      ↓
//   assignmentController
//
// =====================================================

export const adminOnly = (
  req,
  res,
  next
) => {
  // ---------------------------------------------------
  // Authentication safety
  // ---------------------------------------------------

  if (!req.user) {
    return res.status(401).json({
      success: false,
      message:
        "Authentication required.",
    });
  }

  // ---------------------------------------------------
  // Normalize role
  // ---------------------------------------------------

  const role = normalizeRole(
    req.user.role
  );

  // ---------------------------------------------------
  // Authorization
  // ---------------------------------------------------

  if (role !== "admin") {
    return res.status(403).json({
      success: false,
      message:
        "Access denied: Admins only.",
    });
  }

  // ---------------------------------------------------
  // Organization safety
  // ---------------------------------------------------
  //
  // Assignment operations are tenant-scoped.
  //
  // Establish the organization from the authenticated
  // user rather than trusting the client.
  //
  // ---------------------------------------------------

  const organizationId =
    getAuthenticatedOrganizationId(req);

  if (!organizationId) {
    return res.status(403).json({
      success: false,
      message:
        "Organization not assigned.",
    });
  }

  // ---------------------------------------------------
  // Establish authenticated context
  // ---------------------------------------------------

  req.adminId =
    getAuthenticatedUserId(req);

  req.organizationId =
    organizationId;

  // ---------------------------------------------------
  // Debug
  // ---------------------------------------------------

  console.log(
    "[ROLE] Admin authorized:",
    {
      adminId:
        req.adminId
          ? String(req.adminId)
          : null,

      organizationId:
        req.organizationId
          ? String(
              req.organizationId
            )
          : null,

      role,
    }
  );

  // ---------------------------------------------------
  // Authorized
  // ---------------------------------------------------

  return next();
};


// =====================================================
// AGENT ONLY
// =====================================================
//
// AGENT-SIDE authorization.
//
// Used for:
//
//   assignmentController.getMyLeads
//   assignmentController.getMyLeadById
//
// and agent-side operational controllers.
//
// Expected chain:
//
//   protect
//      ↓
//   agentOnly
//      ↓
//   controller
//
// =====================================================

export const agentOnly = (
  req,
  res,
  next
) => {
  // ---------------------------------------------------
  // Authentication safety
  // ---------------------------------------------------

  if (!req.user) {
    return res.status(401).json({
      success: false,
      message:
        "Authentication required.",
    });
  }

  // ---------------------------------------------------
  // Normalize role
  // ---------------------------------------------------

  const role = normalizeRole(
    req.user.role
  );

  // ---------------------------------------------------
  // Agent authorization
  // ---------------------------------------------------

  if (role !== "agent") {
    return res.status(403).json({
      success: false,
      message:
        "Access denied: Agents only.",
    });
  }

  // ---------------------------------------------------
  // Authenticated organization
  // ---------------------------------------------------

  const organizationId =
    getAuthenticatedOrganizationId(req);

  if (!organizationId) {
    return res.status(403).json({
      success: false,
      message:
        "Organization not assigned.",
    });
  }

  // ---------------------------------------------------
  // Authenticated agent
  // ---------------------------------------------------

  const agentId =
    getAuthenticatedUserId(req);

  if (!agentId) {
    return res.status(401).json({
      success: false,
      message:
        "Authenticated agent could not be identified.",
    });
  }

  // ===================================================
  // AUTHORITATIVE AGENT CONTEXT
  // ===================================================
  //
  // These values ALWAYS come from req.user.
  //
  // NEVER trust:
  //
  // req.body.agentId
  // req.query.agentId
  // req.params.agentId
  //
  // ===================================================

  req.agentId =
    agentId;

  req.organizationId =
    organizationId;

  // ---------------------------------------------------
  // Debug
  // ---------------------------------------------------

  console.log(
    "[ROLE] Agent authorized:",
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

      role,
    }
  );

  // ---------------------------------------------------
  // Authorized
  // ---------------------------------------------------

  return next();
};


// =====================================================
// VIEWER ONLY
// =====================================================
//
// Viewer authorization.
//
// Viewers must NEVER gain access to assignment
// endpoints.
//
// =====================================================

export const viewerOnly = (
  req,
  res,
  next
) => {
  // ---------------------------------------------------
  // Authentication safety
  // ---------------------------------------------------

  if (!req.user) {
    return res.status(401).json({
      success: false,
      message:
        "Authentication required.",
    });
  }

  // ---------------------------------------------------
  // Normalize role
  // ---------------------------------------------------

  const role = normalizeRole(
    req.user.role
  );

  // ---------------------------------------------------
  // Viewer authorization
  // ---------------------------------------------------

  if (role !== "viewer") {
    return res.status(403).json({
      success: false,
      message:
        "Access denied: Viewers only.",
    });
  }

  // ---------------------------------------------------
  // Authorized
  // ---------------------------------------------------

  return next();
};


// =====================================================
// FLEXIBLE ROLE CHECK
// =====================================================
//
// Example:
//
// allowRoles("admin", "agent")
//
// or:
//
// allowRoles(["admin", "agent"])
//
// =====================================================

export const allowRoles = (
  ...allowedRoles
) => {
  const normalizedRoles =
    allowedRoles
      .flat()
      .map(normalizeRole)
      .filter(Boolean);

  return (
    req,
    res,
    next
  ) => {
    // -------------------------------------------------
    // Authentication safety
    // -------------------------------------------------

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message:
          "Authentication required.",
      });
    }

    // -------------------------------------------------
    // Normalize authenticated role
    // -------------------------------------------------

    const userRole =
      normalizeRole(
        req.user.role
      );

    // -------------------------------------------------
    // Authorization
    // -------------------------------------------------

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

    // -------------------------------------------------
    // Establish organization context for
    // tenant-scoped controllers.
    //
    // We only use the authenticated user's
    // organization.
    // -------------------------------------------------

    const organizationId =
      getAuthenticatedOrganizationId(req);

    if (organizationId) {
      req.organizationId =
        organizationId;
    }

    // -------------------------------------------------
    // Establish agent context when applicable.
    // -------------------------------------------------

    if (userRole === "agent") {
      req.agentId =
        getAuthenticatedUserId(req);
    }

    // -------------------------------------------------
    // Debug
    // -------------------------------------------------

    console.log(
      "[ROLE] Role authorized:",
      {
        role:
          userRole,

        organizationId:
          req.organizationId
            ? String(
                req.organizationId
              )
            : null,

        agentId:
          req.agentId
            ? String(
                req.agentId
              )
            : null,
      }
    );

    return next();
  };
};


// =====================================================
// ADMIN OR AGENT
// =====================================================
//
// Allows:
//
//   admin
//   agent
//
// Useful for shared operational endpoints.
//
// =====================================================

export const adminOrAgent = (
  req,
  res,
  next
) => {
  return allowRoles(
    "admin",
    "agent"
  )(
    req,
    res,
    next
  );
};


// =====================================================
// AUTHENTICATED USER
// =====================================================
//
// Allows:
//
//   admin
//   agent
//   viewer
//
// This middleware should be used for normal LeadFlow
// authenticated endpoints where all three roles are
// allowed.
//
// =====================================================

export const authenticatedUser = (
  req,
  res,
  next
) => {
  // ---------------------------------------------------
  // Authentication safety
  // ---------------------------------------------------

  if (!req.user) {
    return res.status(401).json({
      success: false,
      message:
        "Authentication required.",
    });
  }

  // ---------------------------------------------------
  // Supported roles
  // ---------------------------------------------------

  const allowedRoles = [
    "admin",
    "agent",
    "viewer",
  ];

  // ---------------------------------------------------
  // Normalize authenticated role
  // ---------------------------------------------------

  const userRole =
    normalizeRole(
      req.user.role
    );

  // ---------------------------------------------------
  // Authorization
  // ---------------------------------------------------

  if (
    !allowedRoles.includes(
      userRole
    )
  ) {
    return res.status(403).json({
      success: false,
      message:
        "Access denied.",
    });
  }

  // ---------------------------------------------------
  // Establish organization context when available.
  //
  // This is useful for controllers that perform
  // tenant-scoped operations.
  //
  // ---------------------------------------------------

  const organizationId =
    getAuthenticatedOrganizationId(req);

  if (organizationId) {
    req.organizationId =
      organizationId;
  }

  // ---------------------------------------------------
  // Establish agent context when authenticated user
  // is an agent.
  // ---------------------------------------------------

  if (userRole === "agent") {
    req.agentId =
      getAuthenticatedUserId(req);
  }

  // ---------------------------------------------------
  // Debug
  // ---------------------------------------------------

  console.log(
    "[ROLE] Authenticated user:",
    {
      userId:
        getAuthenticatedUserId(req)
          ? String(
              getAuthenticatedUserId(
                req
              )
            )
          : null,

      role:
        userRole,

      organizationId:
        req.organizationId
          ? String(
              req.organizationId
            )
          : null,

      agentId:
        req.agentId
          ? String(
              req.agentId
            )
          : null,
    }
  );

  // ---------------------------------------------------
  // Authorized
  // ---------------------------------------------------

  return next();
};


// =====================================================
// AGENT OR VIEWER
// =====================================================
//
// Allows:
//
//   agent
//   viewer
//
// =====================================================

export const agentOrViewer = (
  req,
  res,
  next
) => {
  return allowRoles(
    "agent",
    "viewer"
  )(
    req,
    res,
    next
  );
};


// =====================================================
// EXPORT ROLE HELPER
// =====================================================

export {
  normalizeRole,
};