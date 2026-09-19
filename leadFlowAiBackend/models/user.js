// =====================================================
//
// Stores:
// ✓ Admins
// ✓ Agents
// ✓ Viewers
//
// Role responsibilities
// -----------------------------------------------------
//
// ADMIN
// → Agency owner / administrator
// → Full organization access
// → Manage users
// → Assign and reassign leads
// → Manage system workflows
//
// AGENT
// → Sales representative
// → Access ONLY assigned leads
// → Manage assigned lead workflow
// → Add notes
// → Schedule/update viewing workflows
// → Manage follow-ups
// → Record calls
//
// VIEWER
// → Read-only access
// → Dashboard/customer-facing viewing only
// → No operational modifications
//
// =====================================================

import mongoose from "mongoose";

// =====================================================
// USER SCHEMA
// =====================================================

const userSchema = new mongoose.Schema(
  {
    // =====================================================
    // BASIC PROFILE
    // =====================================================

    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },

    password: {
      type: String,
      required: true,
    },

    // =====================================================
    // ROLE MANAGEMENT
    // =====================================================
    //
    // Supported application roles:
    //
    // admin
    // agent
    // viewer
    //
    // IMPORTANT:
    // Role middleware must enforce permissions.
    // The model only defines valid roles.
    // =====================================================

    role: {
      type: String,
      enum: ["admin", "agent", "viewer"],
      default: "agent",
      lowercase: true,
      trim: true,
      index: true,
    },

    // =====================================================
    // ORGANIZATION OWNERSHIP
    // =====================================================
    //
    // Every operational user should belong to an
    // organization for multi-tenant isolation.
    //
    // Admin:
    // → Owns/manages organization
    //
    // Agent:
    // → Belongs to organization
    //
    // Viewer:
    // → Belongs to organization
    //
    // Leads must use the same organizationId.
    // =====================================================

    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      default: null,
      index: true,
    },

    // =====================================================
    // ACCOUNT STATUS
    // =====================================================
    //
    // Inactive users must not be allowed to perform
    // authenticated operational actions.
    //
    // The protect middleware should enforce this.
    // =====================================================

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    lastLogin: {
      type: Date,
      default: null,
    },

    // =====================================================
    // AGENT PERFORMANCE
    // =====================================================
    //
    // Used by:
    // ✓ Agent dashboard
    // ✓ Performance analytics
    // ✓ Lead assignment statistics
    // ✓ Future reporting
    //
    // These are counters and should be updated by the
    // appropriate lead workflow services/controllers.
    // =====================================================

    assignedLeadCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    closedLeadCount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

// =====================================================
// INDEXES
// =====================================================
//
// Helps common agent/organization queries.
//
// Example:
//
// Lead assignment:
// User.find({
//   organizationId,
//   role: "agent",
//   isActive: true,
// });
//
// =====================================================

userSchema.index({
  organizationId: 1,
  role: 1,
  isActive: 1,
});

// =====================================================
// SAFE JSON TRANSFORMATION
// =====================================================
//
// Never expose the password field when returning a User
// object through JSON.
//
// This provides an additional safety layer even when a
// controller forgets to explicitly select("-password").
//
// =====================================================

userSchema.set("toJSON", {
  transform: (_doc, ret) => {
    delete ret.password;
    return ret;
  },
});

// =====================================================
// MODEL
// =====================================================

const User =
  mongoose.models.User ||
  mongoose.model("User", userSchema);

export default User;