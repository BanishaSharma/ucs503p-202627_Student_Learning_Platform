import { Router } from "express";
import rateLimit from "express-rate-limit";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import {
  loginHandler,
  logoutHandler,
  getMeHandler,
  registerStudentHandler,
  verifyEmailHandler,
  resendVerificationHandler,
  acceptTeacherInviteHandler,
  changePasswordHandler,
  forgotPasswordHandler,
  resetPasswordHandler
} from "../controllers/auth.controller.js";

const router = Router();

// Rate limiter for authentication & registration attempts
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: process.env.NODE_ENV === "production" ? 100 : 1000,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    success: false,
    error: "Too many authentication requests from this IP. Please try again after 15 minutes."
  }
});

// Password reset limiter
const passwordResetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: process.env.NODE_ENV === "production" ? 15 : 200,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    success: false,
    error: "Too many password reset attempts. Please try again later."
  }
});

// Standard Auth Endpoints
router.post("/login", authLimiter, asyncHandler(loginHandler));
router.post("/logout", asyncHandler(logoutHandler));
router.get("/me", asyncHandler(requireAuth), asyncHandler(getMeHandler));

// Student Self-Registration & Email Verification
router.post("/register/student", authLimiter, asyncHandler(registerStudentHandler));
router.post("/verify-email", asyncHandler(verifyEmailHandler));
router.post("/resend-verification", authLimiter, asyncHandler(resendVerificationHandler));

// Teacher Invitation Acceptance
router.post("/teacher/accept-invite", authLimiter, asyncHandler(acceptTeacherInviteHandler));

// Password Management Endpoints
router.post("/change-password", asyncHandler(requireAuth), asyncHandler(changePasswordHandler));
router.post("/forgot-password", passwordResetLimiter, asyncHandler(forgotPasswordHandler));
router.post("/reset-password", passwordResetLimiter, asyncHandler(resetPasswordHandler));

export default router;
