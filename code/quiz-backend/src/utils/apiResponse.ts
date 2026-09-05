import type { Response } from "express";
import type { ApiResponse } from "../types/quiz.types.js";

/**
 * Sends a standardized success JSON response.
 */
export function sendSuccess<T>(res: Response, data: T, statusCode = 200): void {
  const payload: ApiResponse<T> = {
    success: true,
    data
  };
  res.status(statusCode).json(payload);
}

/**
 * Sends a standardized error JSON response.
 */
export function sendError(res: Response, error: string, statusCode = 500): void {
  const payload: ApiResponse = {
    success: false,
    error
  };
  res.status(statusCode).json(payload);
}
