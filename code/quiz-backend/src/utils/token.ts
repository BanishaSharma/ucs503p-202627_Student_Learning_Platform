import crypto from "node:crypto";

/**
 * Generate a cryptographically secure random token string.
 */
export function generateSecureToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Hash a raw token using SHA-256 for secure database storage.
 */
export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token.trim()).digest("hex");
}
