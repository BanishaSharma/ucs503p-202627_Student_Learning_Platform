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
  findUserByEmail
} from "../db/queries.js";
import { getClient } from "../db/index.js";
import { hashPassword } from "../utils/password.js";
import { AppError } from "../middleware/errorHandler.js";
import type {
  CreateTeacherAccountInput,
  CreateStudentAccountInput,
  AssignTeacherClassInput
} from "../schemas/admin.schema.js";
import type { AdminTeacherItem, AdminStudentItem, PlatformStats } from "../types/platform.types.js";

/**
 * List all teacher accounts with assignments.
 */
export async function getAllTeachers(): Promise<AdminTeacherItem[]> {
  return await findAllTeachers();
}

/**
 * Create an admin-authorized teacher account with hashed password and class assignments.
 */
export async function createTeacherAccount(input: CreateTeacherAccountInput): Promise<{ userId: number; teacherId: number }> {
  const existing = await findUserByEmail(input.email);
  if (existing) {
    throw new AppError(`A user with email '${input.email}' already exists.`, 400);
  }

  const passwordHash = await hashPassword(input.password);
  const client = await getClient();

  try {
    await client.query("BEGIN;");

    const userId = await createUser(client, {
      name: input.name,
      email: input.email,
      passwordHash,
      role: "teacher",
      isActive: true
    });

    const teacherId = await createTeacherProfile(client, {
      userId,
      employeeId: input.employeeId,
      qualification: input.qualification ?? null
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

    await client.query("COMMIT;");
    return { userId, teacherId };
  } catch (err) {
    await client.query("ROLLBACK;");
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Activate or deactivate an account (immediately blocks login when false).
 */
export async function setUserStatus(userId: number, isActive: boolean): Promise<void> {
  await updateUserStatus(userId, isActive);
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
export async function createStudentAccount(input: CreateStudentAccountInput): Promise<{ userId: number; studentId: number }> {
  const existing = await findUserByEmail(input.email);
  if (existing) {
    throw new AppError(`A user with email '${input.email}' already exists.`, 400);
  }

  const passwordHash = await hashPassword(input.password);
  const client = await getClient();

  try {
    await client.query("BEGIN;");

    const userId = await createUser(client, {
      name: input.name,
      email: input.email,
      passwordHash,
      role: "student",
      isActive: true
    });

    const studentId = await createStudentProfile(client, {
      userId,
      classId: input.classId,
      rollNumber: input.rollNumber ?? null,
      section: input.section || "A"
    });

    await client.query("COMMIT;");
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
export async function assignTeacher(input: AssignTeacherClassInput): Promise<void> {
  await assignTeacherClass(input.teacherId, input.classId, input.subjectId);
}

/**
 * Remove a teacher assignment.
 */
export async function unassignTeacher(teacherId: number, classId: number, subjectId: number): Promise<void> {
  await removeTeacherClass(teacherId, classId, subjectId);
}

/**
 * Retrieve platform overview stats.
 */
export async function getPlatformStats(): Promise<PlatformStats> {
  return await findPlatformStats();
}
