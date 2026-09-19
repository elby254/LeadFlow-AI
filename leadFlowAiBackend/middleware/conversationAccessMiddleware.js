/**
 * ==========================================================
 *
 * CONVERSATION ACCESS MIDDLEWARE
 * LeadFlow AI
 *
 * ==========================================================
 *
 * Purpose
 * ----------------------------------------------------------
 *
 * Enforces:
 *
 * ✓ Authentication
 * ✓ Organization isolation
 * ✓ Agent conversation access
 * ✓ Viewer conversation ownership
 * ✓ Conversation existence
 *
 * IMPORTANT
 * ----------------------------------------------------------
 *
 * protect() MUST run before this middleware.
 *
 * ==========================================================
 */

import mongoose from "mongoose";

import Conversation from "../models/conversation.js";
import Lead from "../models/lead.js";

/* ==========================================================
   GET USER ID
========================================================== */

const getUserId = (
  req
) => {
  return (
    req.user?._id ||
    req.user?.id ||
    null
  );
};

/* ==========================================================
   GET ROLE
========================================================== */

const getRole = (
  req
) => {
  return String(
    req.user?.role ||
      ""
  )
    .trim()
    .toLowerCase();
};

/* ==========================================================
   VERIFY OBJECT ID
========================================================== */

const isValidObjectId =
  (
    value
  ) => {
    return Boolean(
      value &&
      mongoose.Types.ObjectId.isValid(
        value
      )
    );
  };

/* ==========================================================
   CONVERSATION ACCESS
========================================================== */

export const conversationAccess =
  async (
    req,
    res,
    next
  ) => {
    try {
      if (
        !req.user
      ) {
        return res
          .status(401)
          .json({
            success: false,

            message:
              "Authentication required.",
          });
      }

      const organizationId =
        req.user.organizationId ||
        req.organizationId;

      const userId =
        getUserId(
          req
        );

      const role =
        getRole(
          req
        );

      const conversationId =
        req.params.id ||
        req.params.conversationId;

      if (
        !isValidObjectId(
          conversationId
        )
      ) {
        return res
          .status(400)
          .json({
            success: false,

            message:
              "Invalid conversation ID.",
          });
      }

      if (
        !organizationId
      ) {
        return res
          .status(403)
          .json({
            success: false,

            message:
              "Organization not assigned.",
          });
      }

      /* ------------------------------------------------------
         ORGANIZATION ISOLATION
      ------------------------------------------------------ */

      const conversation =
        await Conversation.findOne({
          _id:
            conversationId,

          organizationId,
        });

      if (
        !conversation
      ) {
        return res
          .status(404)
          .json({
            success: false,

            message:
              "Conversation not found or access denied.",
          });
      }

      /* ------------------------------------------------------
         ADMIN
      ------------------------------------------------------ */

      if (
        role ===
        "admin"
      ) {
        req.conversation =
          conversation;

        return next();
      }

      /* ------------------------------------------------------
         AGENT
      ------------------------------------------------------ */

      if (
        role ===
        "agent"
      ) {
        let allowed =
          false;

        /*
         * Direct conversation assignment.
         */

        if (
          conversation.assignedAgent &&
          userId &&
          String(
            conversation.assignedAgent
          ) ===
            String(
              userId
            )
        ) {
          allowed =
            true;
        }

        /*
         * Lead assignment compatibility.
         */

        if (
          !allowed &&
          conversation.leadId
        ) {
          const lead =
            await Lead.findOne({
              _id:
                conversation.leadId,

              organizationId,

              assignedTo:
                userId,
            }).select(
              "_id"
            );

          if (
            lead
          ) {
            allowed =
              true;
          }
        }

        if (
          !allowed
        ) {
          return res
            .status(403)
            .json({
              success: false,

              message:
                "You are not authorized to access this conversation.",
            });
        }

        req.conversation =
          conversation;

        return next();
      }

      /* ------------------------------------------------------
         VIEWER
      ------------------------------------------------------ */

      if (
        role ===
        "viewer"
      ) {
        const userIdString =
          userId
            ? String(
                userId
              )
            : null;

        const userEmail =
          String(
            req.user?.email ||
              ""
          )
            .trim()
            .toLowerCase();

        const userPhone =
          String(
            req.user?.phone ||
              ""
          ).trim();

        const participantMatch =
          userIdString &&
          Array.isArray(
            conversation.participants
          ) &&
          conversation.participants.some(
            (
              participant
            ) =>
              participant?.userId &&
              String(
                participant.userId
              ) ===
                userIdString
          );

        const emailMatch =
          userEmail &&
          conversation.email &&
          String(
            conversation.email
          )
            .trim()
            .toLowerCase() ===
            userEmail;

        const phoneMatch =
          userPhone &&
          conversation.phone &&
          String(
            conversation.phone
          ).trim() ===
            userPhone;

        if (
          !participantMatch &&
          !emailMatch &&
          !phoneMatch
        ) {
          return res
            .status(403)
            .json({
              success: false,

              message:
                "You are not authorized to access this conversation.",
            });
        }

        req.conversation =
          conversation;

        return next();
      }

      return res
        .status(403)
        .json({
          success: false,

          message:
            "You are not authorized to access conversations.",
        });
    } catch (error) {
      console.error(
        "CONVERSATION ACCESS ERROR:",
        error
      );

      return res
        .status(500)
        .json({
          success: false,

          message:
            "Failed to verify conversation access.",

          error:
            error.message,
        });
    }
  };