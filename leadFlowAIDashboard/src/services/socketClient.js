import { io } from "socket.io-client";

const STORAGE_KEY = "leadflowai_auth";

/**
 * Resolve the Socket.IO server URL.
 *
 * VITE_API_BASE_URL may include an API path, such as /api.
 * Socket.IO connects to the server origin, not the API path.
 */
const resolveSocketUrl = () => {
  const configuredUrl = import.meta.env.VITE_API_BASE_URL;

  if (!configuredUrl) {
    return "http://localhost:5000";
  }

  try {
    return new URL(configuredUrl, window.location.origin).origin;
  } catch (error) {
    console.error("[SOCKET] Invalid VITE_API_BASE_URL:", error);
    return window.location.origin;
  }
};

const SOCKET_URL = resolveSocketUrl();

export const socket = io(SOCKET_URL, {
  autoConnect: false,
  transports: ["websocket"],
  auth: (callback) => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      const session = saved ? JSON.parse(saved) : null;

      callback({
        token:
          typeof session?.token === "string"
            ? session.token
            : "",
      });
    } catch (error) {
      console.error("[SOCKET] Could not read authentication session.");
      callback({ token: "" });
    }
  },
});

/**
 * Synchronize Socket.IO with the existing authentication session.
 *
 * Call this after login, logout, and session restoration.
 */
export const syncSocketAuthentication = (token) => {
  if (!token) {
    socket.disconnect();
    return;
  }

  socket.auth = {
    token,
  };

  if (socket.connected) {
    socket.disconnect();
  }

  socket.connect();
};

socket.on("connect", () => {
  console.log("[SOCKET] LeadFlow AI connected:", socket.id);
});

socket.on("connect_error", (error) => {
  console.error("[SOCKET] Connection rejected:", error.message);
});

socket.on("disconnect", (reason) => {
  console.log("[SOCKET] LeadFlow AI disconnected:", reason);
});

/**
 * Do not connect automatically here.
 * AuthContext owns the authenticated session lifecycle.
 */

export default socket;