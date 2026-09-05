import express from "express";
import quizRoutes from "./routes/quiz.routes.js";
import { errorHandler } from "./middleware/errorHandler.js";

const app = express();

// Request body parser
app.use(express.json());

// Health check endpoint
app.get("/api/health", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "ShikshaSetu API is running"
  });
});

// Mount Quiz feature routes under /api
app.use("/api", quizRoutes);

// Catch-all 404 handler for undefined routes
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    error: "Endpoint not found"
  });
});

// Centralized error handling middleware (must be last)
app.use(errorHandler);

export default app;