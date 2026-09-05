import { Router } from "express";
import rateLimit from "express-rate-limit";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { loginHandler, logoutHandler, getMeHandler } from "../controllers/auth.controller.js";

const router = Router();

// Rate limiter for authentication attempts (15 requests per 15 minutes per IP)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    success: false,
    error: "Too many login attempts from this IP. Please try again after 15 minutes."
  }
});

router.post("/login", authLimiter, asyncHandler(loginHandler));
router.post("/logout", asyncHandler(logoutHandler));
router.get("/me", asyncHandler(requireAuth), asyncHandler(getMeHandler));

export default router;
