/**
 * ==========================================================
 *
 * AUTH CONTROLLER
 *
 * Handles:
 *
 * • Admin registration
 * • Login
 * • Agent creation
 * • Viewer creation
 *
 * ORGANIZATION RESOLUTION
 * ----------------------------------------------------------
 *
 * Organization lookup is centralized through:
 *
 * services/organizationResolverService.js
 *
 * This controller must NOT perform direct organization
 * lookups such as:
 *
 * Organization.findOne(...)
 *
 * Organization.findById(...)
 *
 * Organization.findOneAndUpdate(...)
 *
 * The shared organization resolver is responsible for
 * organization resolution.
 *
 * Organization creation during registration remains here
 * because registration may create a brand-new organization.
 *
 * ==========================================================
 */

import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import User from "../models/user.js";
import Organization from "../models/organization.js";

import {
  resolveByName,
  resolveFromRequest,
} from "../services/organizationResolverService.js";

/* ==========================================================
   JWT TOKEN GENERATOR
========================================================== */

const generateToken = (
  user
) => {

  return jwt.sign(
    {
      id:
        user._id,

      role:
        user.role,

      organizationId:
        user.organizationId,
    },

    process.env.JWT_SECRET,

    {
      expiresIn:
        "7d",
    }
  );
};

/* ==========================================================
   ADMIN REGISTRATION
========================================================== */

/**
 * Creates:
 *
 * 1. Organization
 * 2. Admin User
 *
 * Organization resolution is handled by the shared
 * organizationResolverService.
 *
 * Registration is the special case where the organization
 * may not exist yet.
 *
 * Existing organization:
 *     resolveByName()
 *
 * New organization:
 *     Organization.create()
 *
 * ==========================================================
 */

export const registerAdmin =
  async (
    req,
    res
  ) => {

    try {

      const {
        organizationName,
        name,
        email,
        password,
        phone,
      } = req.body;

      /* ====================================================
         VALIDATE REQUIRED FIELDS
      ==================================================== */

      if (
        !email ||
        !password ||
        !organizationName
      ) {

        return res
          .status(400)
          .json({
            success:
              false,

            message:
              "Missing required fields",
          });
      }

      /* ====================================================
         CHECK EXISTING USER
      ==================================================== */

      const existingUser =
        await User.findOne({
          email,
        });

      if (
        existingUser
      ) {

        return res
          .status(400)
          .json({
            success:
              false,

            message:
              "Email already exists",
          });
      }

      /* ====================================================
         CHECK EXISTING ORGANIZATION
      ==================================================== */

      /*
       * IMPORTANT
       * ----------------------------------------------------
       *
       * Organization resolution belongs to the shared
       * organizationResolverService.
       *
       * Do NOT use:
       *
       * Organization.findOne(...)
       *
       * here.
       */

      let organization =
        await resolveByName(
          organizationName
        );

      /* ====================================================
         CREATE ORGANIZATION IF IT DOES NOT EXIST
      ==================================================== */

      if (
        !organization
      ) {

        /*
         * Organization creation remains here because this
         * controller owns the admin registration workflow.
         *
         * This is NOT organization resolution.
         */

        organization =
          await Organization.create({

            name:
              organizationName,

            email,

            phone,

            owner:
              null,

          });
      }

      /* ====================================================
         HASH PASSWORD
      ==================================================== */

      const hashedPassword =
        await bcrypt.hash(
          password,
          10
        );

      /* ====================================================
         CREATE ADMIN
      ==================================================== */

      const admin =
        await User.create({

          name,

          email,

          password:
            hashedPassword,

          role:
            "admin",

          organizationId:
            organization._id,

        });

      /* ====================================================
         ASSIGN ORGANIZATION OWNER
      ==================================================== */

      organization.owner =
        admin._id;

      await organization.save();

      /* ====================================================
         GENERATE TOKEN
      ==================================================== */

      const token =
        generateToken(
          admin
        );

      /* ====================================================
         RESPONSE
      ==================================================== */

      return res
        .status(201)
        .json({

          success:
            true,

          token,

          user: {

            id:
              admin._id,

            name:
              admin.name,

            email:
              admin.email,

            role:
              admin.role,

            organizationId:
              admin.organizationId,

          },

          organization,

        });

    } catch (
      error
    ) {

      console.error(
        "❌ ADMIN REGISTRATION ERROR:",
        error
      );

      return res
        .status(500)
        .json({

          success:
            false,

          message:
            "Registration failed",

          error:
            error.message,

        });
    }
  };

/* ==========================================================
   LOGIN
========================================================== */

/**
 * Admin / Agent / Viewer
 *
 * Login itself does not need to perform a separate
 * organization lookup.
 *
 * User.organizationId is already the tenant relationship.
 *
 * ==========================================================
 */

export const login =
  async (
    req,
    res
  ) => {

    try {

      const {
        email,
        password,
      } = req.body;

      /* ====================================================
         VALIDATE INPUT
      ==================================================== */

      if (
        !email ||
        !password
      ) {

        return res
          .status(400)
          .json({

            success:
              false,

            message:
              "Email and password required",

          });
      }

      /* ====================================================
         NORMALIZE EMAIL
      ==================================================== */

      const normalizedEmail =
        email
          .trim()
          .toLowerCase();

      /* ====================================================
         FIND USER
      ==================================================== */

      const user =
        await User.findOne({

          email:
            normalizedEmail,

        });

      if (
        !user
      ) {

        return res
          .status(401)
          .json({

            success:
              false,

            message:
              "Invalid credentials",

          });
      }

      /* ====================================================
         VERIFY PASSWORD
      ==================================================== */

      const validPassword =
        await bcrypt.compare(
          password,
          user.password
        );

      if (
        !validPassword
      ) {

        return res
          .status(401)
          .json({

            success:
              false,

            message:
              "Invalid credentials",

          });
      }

      /* ====================================================
         UPDATE LAST LOGIN
      ==================================================== */

      user.lastLogin =
        new Date();

      await user.save();

      /* ====================================================
         GENERATE TOKEN
      ==================================================== */

      const token =
        generateToken(
          user
        );

      /* ====================================================
         RESPONSE
      ==================================================== */

      return res
        .status(200)
        .json({

          success:
            true,

          token,

          user: {

            id:
              user._id,

            name:
              user.name,

            email:
              user.email,

            role:
              user.role,

            organizationId:
              user.organizationId,

            permissions:
              user.permissions ||
              [],

            avatar:
              user.avatar ||
              null,

          },

        });

    } catch (
      error
    ) {

      console.error(
        "❌ LOGIN ERROR:",
        error
      );

      return res
        .status(500)
        .json({

          success:
            false,

          message:
            "Login failed",

          error:
            error.message,

        });
    }
  };

/* ==========================================================
   CREATE AGENT
========================================================== */

/**
 * Admin only.
 *
 * Organization identity comes from authenticated context.
 *
 * We resolve that context through the shared resolver rather
 * than trusting a client-supplied organizationId.
 *
 * ==========================================================
 */

export const createAgent =
  async (
    req,
    res
  ) => {

    try {

      const {
        name,
        email,
        password,
      } = req.body;

      /* ====================================================
         RESOLVE AUTHENTICATED ORGANIZATION
      ==================================================== */

      const organization =
        await resolveFromRequest(
          req
        );

      if (
        !organization
      ) {

        return res
          .status(403)
          .json({

            success:
              false,

            message:
              "Unauthorized organization access",

          });
      }

      /* ====================================================
         HASH PASSWORD
      ==================================================== */

      const hashedPassword =
        await bcrypt.hash(
          password,
          10
        );

      /* ====================================================
         CREATE AGENT
      ==================================================== */

      const agent =
        await User.create({

          name,

          email,

          password:
            hashedPassword,

          role:
            "agent",

          organizationId:
            organization._id,

        });

      /* ====================================================
         RESPONSE
      ==================================================== */

      return res
        .status(201)
        .json({

          success:
            true,

          user: {

            id:
              agent._id,

            name:
              agent.name,

            email:
              agent.email,

            role:
              agent.role,

          },

        });

    } catch (
      error
    ) {

      console.error(
        "❌ AGENT CREATION ERROR:",
        error
      );

      return res
        .status(500)
        .json({

          success:
            false,

          message:
            "Agent creation failed",

          error:
            error.message,

        });
    }
  };

/* ==========================================================
   CREATE VIEWER
========================================================== */

/**
 * Admin only.
 *
 * Organization identity comes from authenticated context.
 *
 * ==========================================================
 */

export const createViewer =
  async (
    req,
    res
  ) => {

    try {

      const {
        name,
        email,
        password,
      } = req.body;

      /* ====================================================
         RESOLVE AUTHENTICATED ORGANIZATION
      ==================================================== */

      const organization =
        await resolveFromRequest(
          req
        );

      if (
        !organization
      ) {

        return res
          .status(403)
          .json({

            success:
              false,

            message:
              "Unauthorized organization access",

          });
      }

      /* ====================================================
         HASH PASSWORD
      ==================================================== */

      const hashedPassword =
        await bcrypt.hash(
          password,
          10
        );

      /* ====================================================
         CREATE VIEWER
      ==================================================== */

      const viewer =
        await User.create({

          name,

          email,

          password:
            hashedPassword,

          role:
            "viewer",

          organizationId:
            organization._id,

        });

      /* ====================================================
         RESPONSE
      ==================================================== */

      return res
        .status(201)
        .json({

          success:
            true,

          user: {

            id:
              viewer._id,

            name:
              viewer.name,

            email:
              viewer.email,

            role:
              viewer.role,

          },

        });

    } catch (
      error
    ) {

      console.error(
        "❌ VIEWER CREATION ERROR:",
        error
      );

      return res
        .status(500)
        .json({

          success:
            false,

          message:
            "Viewer creation failed",

          error:
            error.message,

        });
    }
  };