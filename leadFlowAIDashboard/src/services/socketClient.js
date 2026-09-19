import { io } from "socket.io-client";

/**
 * Central real-time connection between frontend dashboard and backend AI CRM system.
 */

const SOCKET_URL = "http://localhost:5000"; // backend URL

export const socket = io(SOCKET_URL, {
  transports: ["websocket"],
  autoConnect: true,
});

/**
 * CONNECTION EVENTS
 */
socket.on("connect", () => {
  console.log("🟢 LeadFlow AI socket connected:", socket.id);
});

socket.on("disconnect", () => {
  console.log("🔴 LeadFlow AI socket disconnected");
});

export default socket;