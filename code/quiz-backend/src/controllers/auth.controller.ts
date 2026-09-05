import type { Request, Response } from "express";
import * as authService from "../services/auth.service.js";
import {
  loginSchema,
  studentRegisterSchema,
  verifyEmailSchema,
  resendVerificationSchema,
  acceptTeacherInviteSchema,
  changePasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema
} from "../schemas/auth.schema.js";
import { sendSuccess } from "../utils/apiResponse.js";
import { AppError } from "../middleware/errorHandler.js";

/**
 * POST /api/auth/login
 */
export async function loginHandler(req: Request, res: Response): Promise<void> {
  const input = loginSchema.parse(req.body);
  const result = await authService.loginUser(input, req.ip);
  sendSuccess(res, result);
}

/**
 * POST /api/auth/logout
 */
export async function logoutHandler(_req: Request, res: Response): Promise<void> {
  sendSuccess(res, { message: "Logged out successfully." });
}

/**
 * GET /api/auth/me
 */
export async function getMeHandler(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw new AppError("Authentication required.", 401);
  }
  const user = await authService.getCurrentUser(req.user);
  sendSuccess(res, user);
}

/**
 * POST /api/auth/register/student
 */
export async function registerStudentHandler(req: Request, res: Response): Promise<void> {
  const input = studentRegisterSchema.parse(req.body);
  const result = await authService.registerStudent(input, req.ip);
  sendSuccess(res, result, 201);
}

/**
 * POST /api/auth/verify-email
 */
export async function verifyEmailHandler(req: Request, res: Response): Promise<void> {
  const input = verifyEmailSchema.parse(req.body);
  const result = await authService.verifyStudentEmail(input.token, req.ip);
  sendSuccess(res, result);
}

/**
 * POST /api/auth/resend-verification
 */
export async function resendVerificationHandler(req: Request, res: Response): Promise<void> {
  const input = resendVerificationSchema.parse(req.body);
  const result = await authService.resendVerificationEmail(input.email, req.ip);
  sendSuccess(res, result);
}

/**
 * POST /api/auth/teacher/accept-invite
 */
export async function acceptTeacherInviteHandler(req: Request, res: Response): Promise<void> {
  const input = acceptTeacherInviteSchema.parse(req.body);
  const result = await authService.acceptTeacherInvite(input, req.ip);
  sendSuccess(res, result);
}

/**
 * POST /api/auth/change-password
 */
export async function changePasswordHandler(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw new AppError("Authentication required.", 401);
  }
  const input = changePasswordSchema.parse(req.body);
  const result = await authService.changePassword(req.user.userId, input, req.ip);
  sendSuccess(res, result);
}

/**
 * POST /api/auth/forgot-password
 */
export async function forgotPasswordHandler(req: Request, res: Response): Promise<void> {
  const input = forgotPasswordSchema.parse(req.body);
  const result = await authService.forgotPassword(input.email, req.ip);
  sendSuccess(res, result);
}

/**
 * POST /api/auth/reset-password
 */
export async function resetPasswordHandler(req: Request, res: Response): Promise<void> {
  const input = resetPasswordSchema.parse(req.body);
  const result = await authService.resetPassword(input, req.ip);
  sendSuccess(res, result);
}
