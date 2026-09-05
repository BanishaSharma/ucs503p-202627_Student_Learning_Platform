import type { Request, Response, NextFunction, ErrorRequestHandler } from "express";
import { ZodError } from "zod";
import { sendError } from "../utils/apiResponse.js";

export class AppError extends Error {
  public statusCode: number;

  constructor(message: string, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export const errorHandler: ErrorRequestHandler = (
  err: Error | AppError | ZodError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // Handle Zod validation errors
  if (err instanceof ZodError) {
    const errorMessages = err.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join(", ");
    sendError(res, `Validation error: ${errorMessages}`, 400);
    return;
  }

  // Handle explicit application errors
  if (err instanceof AppError) {
    sendError(res, err.message, err.statusCode);
    return;
  }

  // PostgreSQL specific error codes (e.g. 23503: foreign_key_violation, 23505: unique_violation)
  const pgError = err as { code?: string; detail?: string };
  if (pgError.code === "23503") {
    sendError(res, "Referenced entity does not exist", 400);
    return;
  }
  if (pgError.code === "23505") {
    sendError(res, "A record with this identifier already exists", 409);
    return;
  }

  // Centralized logging for unexpected errors
  console.error("Unhandled Application Error:", err);

  // Return generic error without leaking server stack trace
  sendError(res, "Internal server error", 500);
};
