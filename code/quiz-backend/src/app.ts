import express from "express";
import cors from "cors";
import path from "node:path";
import { fileURLToPath } from "node:url";
import quizRoutes from "./routes/quiz.routes.js";
import { errorHandler } from "./middleware/errorHandler.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendPath = path.resolve(__dirname, "../../quiz-frontend");

const app = express();

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

// Mount Quiz feature routes under /api
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