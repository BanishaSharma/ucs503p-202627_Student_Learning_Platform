import { query } from "../db/index.js";

const SENSITIVE_KEY_REGEX = /password|hash|token|jwt|secret|auth/i;

function sanitizeDetails(details?: Record<string, unknown>): Record<string, unknown> | null {
  if (!details || typeof details !== "object") return null;

  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(details)) {
    if (SENSITIVE_KEY_REGEX.test(key)) {
      continue; // Strictly omit passwords, tokens, hashes, JWTs
    }
    if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      sanitized[key] = sanitizeDetails(value as Record<string, unknown>);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

export interface AuditLogEntry {
  userId?: number | null;
  action: string;
  resourceType: string;
  resourceId?: string | number | null;
  details?: Record<string, unknown>;
  ipAddress?: string;
}

export async function logAuditAction(entry: AuditLogEntry): Promise<void> {
  try {
    const cleanDetails = sanitizeDetails(entry.details);
    const sql = `
      INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details, ip_address)
      VALUES ($1, $2, $3, $4, $5, $6);
    `;
    await query(sql, [
      entry.userId ?? null,
      entry.action,
      entry.resourceType,
      entry.resourceId !== undefined && entry.resourceId !== null ? String(entry.resourceId) : null,
      cleanDetails ? JSON.stringify(cleanDetails) : null,
      entry.ipAddress ?? null
    ]);
  } catch (err) {
    // Non-blocking log failure - do not crash application flow if logging fails
    console.error("Failed to write audit log:", err);
  }
}
