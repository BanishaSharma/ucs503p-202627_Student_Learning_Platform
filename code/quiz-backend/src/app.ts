import express from "express";
import cors from "cors";
import helmet from "helmet";
import path from "node:path";
import { fileURLToPath } from "node:url";
import authRoutes from "./routes/auth.routes.js";
import teacherRoutes from "./routes/teacher.routes.js";
import queryRoutes from "./routes/query.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import quizRoutes from "./routes/quiz.routes.js";
import { errorHandler } from "./middleware/errorHandler.js";

import fs from "node:fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distFrontendPath = path.resolve(__dirname, "../../quiz-frontend/dist");
const rootFrontendPath = path.resolve(__dirname, "../../quiz-frontend");
const frontendPath = fs.existsSync(distFrontendPath) ? distFrontendPath : rootFrontendPath;

const app = express();

// Security headers with permissive CSP for local Vite development
app.use(helmet({ contentSecurityPolicy: false }));

// Enable Cross-Origin Resource Sharing for any client (Vite, React, mobile)
app.use(cors());

// Request body parser
app.use(express.json());

// Serve static frontend assets from code/quiz-frontend
app.use(express.static(frontendPath));

// Health check endpoint
app.get("/api/health", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "ShikshaSetu API is running"
  });
});

// Mount platform feature routes under /api
app.use("/api/auth", authRoutes);
app.use("/api/teacher", teacherRoutes);
app.use("/api/queries", queryRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api", quizRoutes);


// Catch-all 404 handler for unknown API routes
app.use("/api", (_req, res) => {
  res.status(404).json({
    success: false,
    error: "Endpoint not found"
  });
});

// Fallback to frontend index.html for non-API GET requests (Express 5 compatible)
app.use((req, res, next) => {
  if (req.method === "GET" && !req.path.startsWith("/api")) {
    return res.sendFile(path.join(frontendPath, "index.html"));
  }
  next();
});

// Centralized error handling middleware (must be last)
app.use(errorHandler);

export default app;