/**
 * ==========================================================
 *
 * SOCKET.IO SERVER
 *
 * Responsibilities:
 * - Authenticate dashboard socket connections using JWT.
 * - Load the authoritative user from MongoDB.
 * - Reject inactive or invalid accounts.
 * - Derive room membership from the authenticated user.
 * - Never trust client-supplied organization or agent IDs.
 *
 * SECURITY:
 * Agents must not automatically receive organization-wide
 * lead events because they are restricted to assigned leads.
 *
 * ==========================================================
 */

import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

import User from "../models/user.js";

let io;

/**
 * Normalize application roles consistently with HTTP auth.
 */
const normalizeRole = (role) => {
  const normalized = String(role || "")
    .trim()
    .toLowerCase();

  if (normalized === "customer" || normalized === "user") {
    return "viewer";
  }

  return normalized;
};

/**
 * Extract a bearer token from the Socket.IO handshake.
 *
 * The frontend should provide:
 *
 * io(API_URL, {
 *   auth: {
 *     token: jwtToken
 *   }
 * });
 *
 * The token is never accepted from a room-join payload.
 */
const getSocketToken = (socket) => {
  const authToken = socket.handshake?.auth?.token;

  if (typeof authToken === "string" && authToken.trim()) {
    return authToken.trim();
  }

  const authorization =
    socket.handshake?.headers?.authorization;

  if (
    typeof authorization === "string" &&
    authorization.startsWith("Bearer ")
  ) {
    const token = authorization.slice(7).trim();

    return token || null;
  }

  return null;
};

/**
 * Authenticate the socket against the database.
 *
 * The JWT identifies the user; the database determines
 * their current role, organization, and account status.
 */
const authenticateSocket = async (socket, next) => {
  try {
    if (!process.env.JWT_SECRET) {
      console.error(
        "[SOCKET AUTH] JWT_SECRET is not configured."
      );

      return next(new Error("Socket authentication unavailable."));
    }

    const token = getSocketToken(socket);

    if (!token) {
      return next(new Error("Authentication required."));
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    const userId =
      decoded?.id ||
      decoded?.userId ||
      decoded?._id;

    if (
      !userId ||
      !mongoose.isValidObjectId(String(userId))
    ) {
      return next(new Error("Authentication required."));
    }

    const user = await User.findById(userId)
      .select("_id name email role organizationId isActive");

    if (!user) {
      return next(new Error("Authentication required."));
    }

    if (user.isActive !== true) {
      return next(new Error("Account is inactive."));
    }

    const role = normalizeRole(user.role);

    if (!["admin", "agent", "viewer"].includes(role)) {
      return next(new Error("Unauthorized account role."));
    }

    const organizationId = user.organizationId
      ? String(user.organizationId)
      : null;

    /*
     * Operational dashboard users must belong to an
     * organization before receiving internal room access.
     */
    if (!organizationId) {
      return next(new Error("Organization not assigned."));
    }

    /*
     * Attach server-verified identity.
     *
     * Never replace these values with data from a socket
     * event or client-supplied organization/agent ID.
     */
    socket.data.userId = String(user._id);
    socket.data.organizationId = organizationId;
    socket.data.role = role;
    socket.data.authenticated = true;

    return next();
  } catch (error) {
    console.error(
      "[SOCKET AUTH] Connection rejected:",
      error.name || "Error"
    );

    return next(new Error("Authentication required."));
  }
};

export const initSocketServer = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      /*
       * Replace this wildcard with the configured dashboard
       * origin before production deployment.
       *
       * CORS is not authentication; JWT verification above
       * remains mandatory regardless of origin.
       */
      origin: process.env.FRONTEND_URL || "http://localhost:5173",
      methods: ["GET", "POST"],
    },
  });

  /*
   * Authenticate before a socket can connect and receive
   * internal events.
   */
  io.use(authenticateSocket);

  console.log("[SOCKET] Socket server initialized.");

  io.on("connection", async (socket) => {
    const {
      userId,
      organizationId,
      role,
    } = socket.data;

    console.log("[SOCKET] Authenticated client connected:", {
      socketId: socket.id,
      userId,
      organizationId,
      role,
    });

    /*
     * Admins can join the organization-wide room.
     *
     * Agents must not join this room because the realtime
     * engine publishes organization-wide lead payloads.
     *
     * Viewers receive no internal rooms until their event
     * permissions have been explicitly defined.
     */
    if (role === "admin") {
  const organizationRoom = `organization:${organizationId}`;

  await socket.join(organizationRoom);

  console.log("[SOCKET] Admin organization room membership:", {
    socketId: socket.id,
    organizationId,
    organizationRoom,
    joined: socket.rooms.has(organizationRoom),
  });
}

    /*
     * Agents can join only their own server-derived room.
     *
     * This does not yet guarantee that every event sent to
     * this room contains only assigned-lead information.
     * That publisher-level authorization is a separate fix.
     */
    if (role === "agent") {
      await socket.join(`agent:${userId}`);
    }

    /*
     * Reject legacy client-controlled room joins.
     *
     * This prevents clients from selecting another tenant
     * or agent by submitting arbitrary IDs.
     */
    socket.on("join_org", () => {
      socket.emit("socket_error", {
        message: "Organization room membership is server-managed.",
      });
    });

    socket.on("join_agent", () => {
      socket.emit("socket_error", {
        message: "Agent room membership is server-managed.",
      });
    });

    socket.on("disconnect", (reason) => {
      console.log("[SOCKET] Client disconnected:", {
        socketId: socket.id,
        userId,
        reason,
      });
    });
  });

  return io;
};