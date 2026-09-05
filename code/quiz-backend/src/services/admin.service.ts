import {
  findAllTeachers,
  createUser,
  createTeacherProfile,
  updateUserStatus,
  findAllStudents,
  createStudentProfile,
  assignTeacherClass,
  removeTeacherClass,
  findPlatformStats,
  findUserByEmail,
  updateTeacherDetails,
  createVerificationToken,
  findAuditLogs
} from "../db/queries.js";
import { getClient } from "../db/index.js";
import { hashPassword } from "../utils/password.js";
import { generateSecureToken, hashToken } from "../utils/token.js";
import { logAuditAction } from "./audit.service.js";
import { AppError } from "../middleware/errorHandler.js";
import type {
  CreateTeacherAccountInput,
  CreateStudentAccountInput,
  AssignTeacherClassInput
} from "../schemas/admin.schema.js";
import type { AdminTeacherItem, AdminStudentItem, PlatformStats, AuditLogItem } from "../types/platform.types.js";

/**
 * List all teacher accounts with assignments.
 */
export async function getAllTeachers(): Promise<AdminTeacherItem[]> {
  return await findAllTeachers();
}

export interface CreateTeacherResult {
  userId: number;
  teacherId: number;
  status: "invited" | "active";
  inviteToken?: string;
  inviteUrl?: string;
}

/**
 * Admin provisions a teacher account into INVITED status with single-use invitation token.
 */
export async function createTeacherAccount(
  input: CreateTeacherAccountInput,
  adminUserId?: number,
  ipAddress?: string
): Promise<CreateTeacherResult> {
  const existing = await findUserByEmail(input.email);
  if (existing) {
    throw new AppError(`A user with email '${input.email}' already exists.`, 400);
  }

  // Generate temporary random hash if no password was supplied
  const rawInitialPassword = input.password || generateSecureToken();
  const passwordHash = await hashPassword(rawInitialPassword);
  const client = await getClient();

  try {
    await client.query("BEGIN;");

    // Teacher begins in 'invited' lifecycle status with isActive = false
    const userId = await createUser(client, {
      name: input.name.trim(),
      email: input.email.trim().toLowerCase(),
      passwordHash,
      role: "teacher",
      isActive: false,
      status: "invited"
    });

    const teacherId = await createTeacherProfile(client, {
      userId,
      employeeId: input.employeeId.trim(),
      qualification: input.qualification?.trim() ?? null
    });

    if (input.assignments && input.assignments.length > 0) {
      for (const a of input.assignments) {
        await client.query(
          `INSERT INTO teacher_class_assignments (teacher_id, class_id, subject_id)
           VALUES ($1, $2, $3)
           ON CONFLICT (teacher_id, class_id, subject_id) DO NOTHING;`,
          [teacherId, a.classId, a.subjectId]
        );
      }
    }

    // Generate secure single-use invitation token
    const rawInviteToken = generateSecureToken();
    const tokenHash = hashToken(rawInviteToken);
    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48 hours

    await createVerificationToken(client, {
      userId,
      tokenHash,
      tokenType: "teacher_invite",
      expiresAt
    });

    await client.query("COMMIT;");

    await logAuditAction({
      userId: adminUserId ?? null,
      action: "ADMIN_PROVISION_TEACHER_INVITED",
      resourceType: "teacher",
      resourceId: teacherId,
      details: { email: input.email, employeeId: input.employeeId },
      ipAddress
    });

    return {
      userId,
      teacherId,
      status: "invited",
      inviteToken: rawInviteToken,
      inviteUrl: `/accept-invite?token=${rawInviteToken}`
    };
  } catch (err) {
    await client.query("ROLLBACK;");
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Edit teacher profile information.
 */
export async function editTeacher(
  teacherId: number,
  data: {
    name?: string;
    employeeId?: string | null;
    qualification?: string | null;
  },
  adminUserId?: number,
  ipAddress?: string
): Promise<void> {
  await updateTeacherDetails(teacherId, data);
  await logAuditAction({
    userId: adminUserId ?? null,
    action: "ADMIN_UPDATE_TEACHER",
    resourceType: "teacher",
    resourceId: teacherId,
    details: data as Record<string, unknown>,
    ipAddress
  });
}

/**
 * Activate or deactivate an account (immediately blocks login when false).
 */
export async function setUserStatus(
  userId: number,
  isActive: boolean,
  adminUserId?: number,
  ipAddress?: string
): Promise<void> {
  const targetStatus = isActive ? "active" : "deactivated";
  await updateUserStatus(userId, isActive, targetStatus);

  await logAuditAction({
    userId: adminUserId ?? null,
    action: isActive ? "ADMIN_ACTIVATE_USER" : "ADMIN_DEACTIVATE_USER",
    resourceType: "user",
    resourceId: userId,
    details: { isActive, status: targetStatus },
    ipAddress
  });
}

/**
 * List all student accounts with classes.
 */
export async function getAllStudents(): Promise<AdminStudentItem[]> {
  return await findAllStudents();
}

/**
 * Create an admin-authorized student account tied to a specific class.
 */
export async function createStudentAccount(
  input: CreateStudentAccountInput,
  adminUserId?: number,
  ipAddress?: string
): Promise<{ userId: number; studentId: number }> {
  const existing = await findUserByEmail(input.email);
  if (existing) {
    throw new AppError(`A user with email '${input.email}' already exists.`, 400);
  }

  const passwordHash = await hashPassword(input.password);
  const client = await getClient();

  try {
    await client.query("BEGIN;");

    const userId = await createUser(client, {
      name: input.name.trim(),
      email: input.email.trim().toLowerCase(),
      passwordHash,
      role: "student",
      isActive: true,
      status: "active"
    });

    const studentId = await createStudentProfile(client, {
      userId,
      classId: input.classId,
      rollNumber: input.rollNumber?.trim() ?? null,
      section: input.section?.trim() || "A"
    });

    await client.query("COMMIT;");

    await logAuditAction({
      userId: adminUserId ?? null,
      action: "ADMIN_CREATE_STUDENT",
      resourceType: "student",
      resourceId: studentId,
      details: { email: input.email, classId: input.classId },
      ipAddress
    });

    return { userId, studentId };
  } catch (err) {
    await client.query("ROLLBACK;");
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Assign a teacher to a class & subject.
 */
export async function assignTeacher(
  input: AssignTeacherClassInput,
  adminUserId?: number,
  ipAddress?: string
): Promise<void> {
  await assignTeacherClass(input.teacherId, input.classId, input.subjectId);
  await logAuditAction({
    userId: adminUserId ?? null,
    action: "ADMIN_ASSIGN_TEACHER_CLASS",
    resourceType: "teacher_assignment",
    resourceId: `${input.teacherId}-${input.classId}-${input.subjectId}`,
    details: { teacherId: input.teacherId, classId: input.classId, subjectId: input.subjectId },
    ipAddress
  });
}

/**
 * Remove a teacher assignment.
 */
export async function unassignTeacher(
  teacherId: number,
  classId: number,
  subjectId: number,
  adminUserId?: number,
  ipAddress?: string
): Promise<void> {
  await removeTeacherClass(teacherId, classId, subjectId);
  await logAuditAction({
    userId: adminUserId ?? null,
    action: "ADMIN_UNASSIGN_TEACHER_CLASS",
    resourceType: "teacher_assignment",
    resourceId: `${teacherId}-${classId}-${subjectId}`,
    ipAddress
  });
}

/**
 * Retrieve platform overview stats.
 */
export async function getPlatformStats(): Promise<PlatformStats> {
  return await findPlatformStats();
}

/**
 * Retrieve recent platform audit logs.
 */
export async function getAuditLogs(limit = 100): Promise<AuditLogItem[]> {
  return await findAuditLogs(limit);
}
