import type { Request, Response } from "express";
import * as authService from "../services/auth.service.js";
import { loginSchema } from "../schemas/auth.schema.js";
import { sendSuccess } from "../utils/apiResponse.js";
import { AppError } from "../middleware/errorHandler.js";

/**
 * POST /api/auth/login
 */
export async function loginHandler(req: Request, res: Response): Promise<void> {
  const input = loginSchema.parse(req.body);
  const result = await authService.loginUser(input);
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
