import jwt from "jsonwebtoken";
import type { AuthTokenPayload } from "../types/auth.types.js";
import { AppError } from "../middleware/errorHandler.js";

const JWT_SECRET = process.env["JWT_SECRET"] || "shikshasetu_default_secret_key_change_in_production";
const JWT_EXPIRES_IN = (process.env["JWT_EXPIRES_IN"] || "7d") as jwt.SignOptions["expiresIn"];

/**
 * Sign an authentication payload into a signed JWT.
 */
export function signToken(payload: AuthTokenPayload): string {
  const options: jwt.SignOptions = { expiresIn: JWT_EXPIRES_IN };
  return jwt.sign(payload, JWT_SECRET, options);
}

/**
 * Verify and decode an authentication JWT.
 */
export function verifyToken(token: string): AuthTokenPayload {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthTokenPayload;
    return decoded;
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      throw new AppError("Authentication token has expired. Please sign in again.", 401);
    }
    throw new AppError("Invalid authentication token.", 401);
  }
}
