import "dotenv/config";

import express from "express";
import cors from "cors";
import http from "http";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

/* ==========================================================
   DATABASE
========================================================== */

import { connectDB } from "./config/db.js";

/* ==========================================================
   ROUTES
========================================================== */

import dashboardRoutes from "./routes/dashboardRoutes.js";
import leadRoutes from "./routes/leadRoutes.js";
import conversationRoutes from "./routes/conversationRoutes.js";
import aiRoutes from "./routes/aiRoutes.js";
import whatsappRoutes from "./routes/whatsappRoutes.js";
import agentRoutes from "./routes/agentRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import propertyRoutes from "./routes/propertyRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import viewingRoutes from "./routes/viewingRoutes.js";
import viewingReminderRoutes from "./routes/viewingReminderRoutes.js";
import propertySettingsRoutes from "./routes/propertySettingsRoutes.js";
import propertyImageRoutes from "./routes/propertyImageRoutes.js";
import webhookRoutes from "./routes/webhookRoutes.js";
import aiIngestionRoutes from "./routes/aiIngestionRoutes.js";
import organizationRoutes from "./routes/organizationRoutes.js";

/* ==========================================================
   ANALYTICS ROUTES
========================================================== */

/*
 * EXECUTIVE / PLATFORM ANALYTICS
 *
 * Provides:
 *
 *   GET /api/analytics/dashboard
 *
 * Used by:
 *
 *   AdminAnalytics.jsx
 *
 * This is separate from property analytics.
 */

import analyticsRoutes from "./routes/analyticsRoutes.js";

/*
 * PROPERTY-SPECIFIC ANALYTICS
 *
 * Provides:
 *
 *   GET /api/property-analytics
 *   GET /api/property-analytics/performance
 *   GET /api/property-analytics/occupancy
 *   GET /api/property-analytics/viewings
 *   GET /api/property-analytics/revenue
 *
 * This remains separate from the executive analytics route.
 */

import propertyAnalyticsRoutes from "./routes/propertyAnalyticsRoutes.js";

/* ==========================================================
   REALTIME
========================================================== */

import { initSocketServer } from "./realtime/socketServer.js";
import { initRealtimeEngine } from "./services/realtimeEngine.js";

/* ==========================================================
   APP
========================================================== */

const app = express();

const server = http.createServer(app);

/* ==========================================================
   CURRENT BACKEND DIRECTORY
========================================================== */

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/*
 * IMPORTANT
 *
 * server.js:
 *
 * C:\MERN\leadFlow AI\leadFlowAiBackend\server.js
 *
 * uploads:
 *
 * C:\MERN\leadFlow AI\leadFlowAiBackend\uploads
 *
 * Therefore we DO NOT use "../uploads".
 */

const uploadsDirectory = path.resolve(
  __dirname,
  "uploads"
);

const propertyUploadsDirectory = path.resolve(
  __dirname,
  "uploads",
  "properties"
);

/* ==========================================================
   CREATE UPLOAD DIRECTORIES
========================================================== */

if (!fs.existsSync(propertyUploadsDirectory)) {
  fs.mkdirSync(
    propertyUploadsDirectory,
    {
      recursive: true,
    }
  );
}

console.log(
  "=================================================="
);

console.log(
  "📁 BACKEND DIRECTORY:",
  __dirname
);

console.log(
  "📁 UPLOADS DIRECTORY:",
  uploadsDirectory
);

console.log(
  "📁 PROPERTY UPLOAD DIRECTORY:",
  propertyUploadsDirectory
);

console.log(
  "📁 PROPERTY UPLOAD DIRECTORY EXISTS:",
  fs.existsSync(
    propertyUploadsDirectory
  )
);

console.log(
  "=================================================="
);

/* ==========================================================
   CORS
========================================================== */

app.use(
  cors({
    origin: "http://localhost:5173",

    credentials: true,

    methods: [
      "GET",
      "POST",
      "PUT",
      "PATCH",
      "DELETE",
      "OPTIONS",
    ],

    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "Pragma",
      "Cache-Control",
      "X-Requested-With",
    ],
  })
);

/* ==========================================================
   BODY PARSERS
========================================================== */

app.use(
  express.json()
);

/*
 * Keep URL-encoded support available for:
 *
 * - website forms
 * - SMS/webhook payloads
 * - Facebook payloads
 * - WhatsApp integrations
 *
 * This does not interfere with JSON requests.
 */

app.use(
  express.urlencoded({
    extended: true,
  })
);

/* ==========================================================
   STATIC PROPERTY IMAGES
========================================================== */

/*
 * Browser:
 *
 * http://localhost:5000/uploads/properties/image.jpg
 *
 * Filesystem:
 *
 * C:\MERN\leadFlow AI\leadFlowAiBackend\
 * uploads\properties\image.jpg
 *
 * Express mapping:
 *
 * /uploads
 *      ↓
 * uploadsDirectory
 */

app.use(
  "/uploads",
  express.static(
    uploadsDirectory,
    {
      fallthrough: false,
      maxAge: "1d",
    }
  )
);

/* ==========================================================
   PROPERTY IMAGE DEBUG ROUTE
========================================================== */

app.get(
  "/api/debug/uploads",
  (req, res) => {
    try {
      const files =
        fs.readdirSync(
          propertyUploadsDirectory
        );

      const detailedFiles =
        files.map(
          (filename) => {
            const fullPath =
              path.join(
                propertyUploadsDirectory,
                filename
              );

            const stats =
              fs.statSync(
                fullPath
              );

            return {
              filename,

              path:
                fullPath,

              exists:
                fs.existsSync(
                  fullPath
                ),

              size:
                stats.size,

              modified:
                stats.mtime,
            };
          }
        );

      return res.status(200).json({
        success: true,

        backendDirectory:
          __dirname,

        uploadsDirectory,

        propertyUploadsDirectory,

        exists:
          fs.existsSync(
            propertyUploadsDirectory
          ),

        count:
          detailedFiles.length,

        files:
          detailedFiles,
      });

    } catch (error) {
      console.error(
        "UPLOAD DEBUG ERROR:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          error.message,

        propertyUploadsDirectory,
      });
    }
  }
);

/* ==========================================================
   DIRECT PROPERTY IMAGE DEBUG
========================================================== */

/*
 * Example:
 *
 * /api/debug/property-image/foo.jpg
 */

app.get(
  "/api/debug/property-image/:filename",
  (req, res) => {
    try {
      const filename =
        path.basename(
          req.params.filename
        );

      const imagePath =
        path.resolve(
          propertyUploadsDirectory,
          filename
        );

      console.log(
        "=================================================="
      );

      console.log(
        "🖼️ PROPERTY IMAGE DEBUG"
      );

      console.log(
        "Filename:",
        filename
      );

      console.log(
        "Resolved path:",
        imagePath
      );

      console.log(
        "Directory:",
        propertyUploadsDirectory
      );

      console.log(
        "Exists:",
        fs.existsSync(
          imagePath
        )
      );

      console.log(
        "=================================================="
      );

      if (
        !fs.existsSync(
          imagePath
        )
      ) {
        return res.status(404).json({
          success: false,

          message:
            "Property image file not found",

          filename,

          expectedPath:
            imagePath,

          propertyUploadsDirectory,
        });
      }

      return res.sendFile(
        imagePath
      );

    } catch (error) {
      console.error(
        "PROPERTY IMAGE DEBUG ERROR:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          error.message,
      });
    }
  }
);

/* ==========================================================
   REALTIME / SOCKET.IO
========================================================== */

const io =
  initSocketServer(
    server
  );

initRealtimeEngine(
  io
);

/* ==========================================================
   SOCKET.IO ACCESS
========================================================== */

app.use(
  (req, res, next) => {
    req.io = io;
    next();
  }
);

/* ==========================================================
   CHANNEL ADAPTER REGISTRATION
========================================================== */

/*
 * IMPORTANT
 * ----------------------------------------------------------
 * Your adapter files are middleware adapters.
 *
 * They should NOT automatically be mounted as:
 *
 * app.use("/api/whatsapp", whatsappAdapter);
 *
 * unless the adapter itself is designed to be a route.
 *
 * Your existing webhook route remains responsible for
 * receiving the external webhook:
 *
 * WhatsApp
 *    ↓
 * whatsappRoutes
 *    ↓
 * whatsappAdapter
 *    ↓
 * AI ingestion
 *
 * Therefore the adapter should normally be called from
 * the corresponding webhook/controller rather than mounted
 * globally here.
 *
 * The imports above are intentionally commented until we
 * confirm the exact adapter architecture.
 */

/* ==========================================================
   API ROUTES
========================================================== */

app.use(
  "/api/dashboard",
  dashboardRoutes
);

app.use(
  "/api/lead",
  leadRoutes
);

app.use(
  "/api/conversations",
  conversationRoutes
);

app.use(
  "/api/ai",
  aiRoutes
);

/* ==========================================================
   WHATSAPP WEBHOOK
========================================================== */

app.use(
  "/api/webhooks/whatsapp",
  whatsappRoutes
);

app.use(
  "/api/agent",
  agentRoutes
);

app.use(
  "/api/auth",
  authRoutes
);

app.use(
  "/api/users",
  userRoutes
);

app.use(
  "/api/organizations",
  organizationRoutes
);

/* ==========================================================
   AI INGESTION ROUTES
========================================================== */

/*
 * Workflow:
 *
 * Customer message
 *       ↓
 * Channel adapter
 *       ↓
 * Organization resolution
 *       ↓
 * AI extraction
 *       ↓
 * Deterministic extraction
 *       ↓
 * CURRENT MESSAGE WINS
 *       ↓
 * Existing lead memory fills missing fields
 *       ↓
 * Lead update
 *       ↓
 * Score
 *       ↓
 * Auto-assignment
 *       ↓
 * Conversation state
 *       ↓
 * Conversation memory
 *       ↓
 * Message persistence
 *       ↓
 * Events
 *       ↓
 * Auto-reply
 *
 * The ai-ingestion route is the internal entry point
 * for that workflow.
 */

app.use(
  "/api/ai-ingestion",
  aiIngestionRoutes
);

/* ==========================================================
   WEBHOOK ROUTES
========================================================== */

app.use(
  "/api/webhooks",
  webhookRoutes
);

/* ==========================================================
   PROPERTY ROUTES
========================================================== */

app.use(
  "/api/properties",
  propertyRoutes
);

/* ==========================================================
   PROPERTY IMAGE ROUTES
========================================================== */

app.use(
  "/api/properties",
  propertyImageRoutes
);

/* ==========================================================
   PROPERTY SETTINGS
========================================================== */

app.use(
  "/api/properties/settings",
  propertySettingsRoutes
);

/* ==========================================================
   ADMIN
========================================================== */

app.use(
  "/api/admin",
  adminRoutes
);

/* ==========================================================
   VIEWINGS
========================================================== */

app.use(
  "/api/viewings",
  viewingRoutes
);

/* ==========================================================
   VIEWING REMINDERS
========================================================== */

app.use(
  "/api/viewing-reminders",
  viewingReminderRoutes
);

/* ==========================================================
   EXECUTIVE ANALYTICS
========================================================== */

/*
 * GET /api/analytics/dashboard
 *
 * Used by:
 *
 *   AdminAnalytics.jsx
 *
 * This is the executive/platform analytics endpoint.
 *
 * It is intentionally separate from:
 *
 *   /api/property-analytics
 */

app.use(
  "/api/analytics",
  analyticsRoutes
);

/* ==========================================================
   PROPERTY ANALYTICS
========================================================== */

/*
 * Property-specific analytics remain available under their
 * own namespace.
 *
 * Endpoints:
 *
 * GET /api/property-analytics
 *
 * GET /api/property-analytics/performance
 *
 * GET /api/property-analytics/occupancy
 *
 * GET /api/property-analytics/viewings
 *
 * GET /api/property-analytics/revenue
 *
 * This does NOT replace /api/analytics.
 */

app.use(
  "/api/property-analytics",
  propertyAnalyticsRoutes
);

/* ==========================================================
   HEALTH CHECK
========================================================== */

app.get(
  "/api/health",
  (req, res) => {
    res.status(200).json({
      success: true,

      message:
        "LeadFlow AI API is running",

      timestamp:
        new Date().toISOString(),
    });
  }
);

/* ==========================================================
   404 HANDLER
========================================================== */

app.use(
  (req, res) => {
    console.error(
      `❌ 404 ROUTE NOT FOUND: ${req.method} ${req.originalUrl}`
    );

    res.status(404).json({
      success: false,

      message:
        `Route not found: ${req.method} ${req.originalUrl}`,
    });
  }
);

/* ==========================================================
   GLOBAL ERROR HANDLER
========================================================== */

app.use(
  (
    error,
    req,
    res,
    next
  ) => {
    console.error(
      "=================================================="
    );

    console.error(
      "❌ GLOBAL SERVER ERROR"
    );

    console.error(
      error
    );

    console.error(
      "=================================================="
    );

    res.status(
      error.status || 500
    ).json({
      success: false,

      message:
        error.message ||
        "Internal server error",
    });
  }
);

/* ==========================================================
   DATABASE CONNECTION
========================================================== */

connectDB()
  .then(() => {
    console.log(
      "✅ MongoDB connected successfully"
    );

    const PORT =
      process.env.PORT ||
      5000;

    server.listen(
      PORT,
      () => {
        console.log(
          "=================================================="
        );

        console.log(
          `🚀 LeadFlow AI running on port ${PORT}`
        );

        console.log(
          `📡 API: http://localhost:${PORT}/api`
        );

        console.log(
          `❤️ Health: http://localhost:${PORT}/api/health`
        );

        console.log(
          `🖼️ Images: http://localhost:${PORT}/uploads/properties/`
        );

        console.log(
          `📁 Image filesystem: ${propertyUploadsDirectory}`
        );

        console.log(
          `🔎 Upload debug: http://localhost:${PORT}/api/debug/uploads`
        );

        console.log(
          `📊 Analytics: http://localhost:${PORT}/api/analytics/dashboard`
        );

        console.log(
          `🏠 Property Analytics: http://localhost:${PORT}/api/property-analytics`
        );

        console.log(
          "=================================================="
        );
      }
    );
  })
  .catch(
    (error) => {
      console.error(
        "❌ Failed to connect to MongoDB:",
        error
      );

      process.exit(1);
    }
  );

/* ==========================================================
   EXPORT
========================================================== */

export {
  app,
  server,
  io,
};