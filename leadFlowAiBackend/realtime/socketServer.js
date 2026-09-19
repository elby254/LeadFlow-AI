 // Bridges backend EventEmitter → WebSocket frontend updates 

import { Server } from "socket.io";

let io;

export const initSocketServer = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  console.log("⚡ Socket server initialized");

  io.on("connection", (socket) => {
    console.log("🟢 Client connected:", socket.id);

    socket.on("join_org", (organizationId) => {
  socket.join(`organization:${organizationId}`);

  console.log(
    `🏢 Joined org room: organization:${organizationId}`
  );
});

socket.on("join_agent", (agentId) => {
  socket.join(`agent:${agentId}`);

  console.log(
    `👤 Joined agent room: agent:${agentId}`
  );
});

    socket.on("disconnect", () => {
      console.log("client disconnected:", socket.id);
    });
  });

  return io;
};