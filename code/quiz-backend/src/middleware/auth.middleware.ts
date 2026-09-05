import type { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/jwt.js";
import { findUserById, findStudentProfileByUserId, findTeacherProfileByUserId } from "../db/queries.js";
import { AppError } from "./errorHandler.js";
import type { AuthTokenPayload, UserRole } from "../types/auth.types.js";

// Extend Express Request type with authenticated user payload
declare global {
  namespace Express {
    interface Request {
      user?: AuthTokenPayload;
    }
  }
}

/**
 * Authentication middleware: verifies Bearer token and active user status.
 */
export async function requireAuth(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new AppError("Authentication required. Please provide a valid Bearer token.", 401);
  }

  const token = authHeader.split(" ")[1];
  if (!token) {
    throw new AppError("Authentication token is missing.", 401);
  }

  const decoded = verifyToken(token);

  // Validate active status against PostgreSQL
  const dbUser = await findUserById(decoded.userId);
  if (!dbUser) {
    throw new AppError("User account no longer exists.", 401);
  }

  if (!dbUser.isActive) {
    throw new AppError("Account has been deactivated. Please contact the administrator.", 403);
  }

  // Hydrate role-specific IDs if not already present
  if (dbUser.role === "student" && !decoded.studentId) {
    const studentProfile = await findStudentProfileByUserId(dbUser.id);
    if (studentProfile) {
      decoded.studentId = studentProfile.studentId;
      decoded.classId = studentProfile.classId;
    }
  } else if (dbUser.role === "teacher" && !decoded.teacherId) {
    const teacherProfile = await findTeacherProfileByUserId(dbUser.id);
    if (teacherProfile) {
      decoded.teacherId = teacherProfile.teacherId;
    }
  }

  req.user = decoded;
  next();
}

/**
 * Role-based authorization middleware.
 */
export function requireRole(...allowedRoles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new AppError("Authentication required.", 401);
    }

    if (!allowedRoles.includes(req.user.role)) {
      throw new AppError(`Forbidden: Access denied for role '${req.user.role}'.`, 403);
    }

    next();
  };
}

/**
 * Optional authentication middleware: attaches req.user if a valid token is provided,
 * but does not reject unauthenticated requests.
 */
export async function optionalAuth(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next();
  }

  const token = authHeader.split(" ")[1];
  if (!token) {
    return next();
  }

  try {
    const decoded = verifyToken(token);
    const dbUser = await findUserById(decoded.userId);
    if (dbUser && dbUser.isActive) {
      if (dbUser.role === "student" && !decoded.studentId) {
        const studentProfile = await findStudentProfileByUserId(dbUser.id);
        if (studentProfile) {
          decoded.studentId = studentProfile.studentId;
          decoded.classId = studentProfile.classId;
        }
      } else if (dbUser.role === "teacher" && !decoded.teacherId) {
        const teacherProfile = await findTeacherProfileByUserId(dbUser.id);
        if (teacherProfile) {
          decoded.teacherId = teacherProfile.teacherId;
        }
      }
      req.user = decoded;
    }
  } catch {
    // Ignore token errors in optionalAuth
  }

  next();
}

