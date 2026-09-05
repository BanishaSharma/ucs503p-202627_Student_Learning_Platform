import { findUserByEmail, findStudentProfileByUserId, findTeacherProfileByUserId, findUserById } from "../db/queries.js";
import { comparePassword } from "../utils/password.js";
import { signToken } from "../utils/jwt.js";
import { AppError } from "../middleware/errorHandler.js";
import type { LoginInput } from "../schemas/auth.schema.js";
import type { AuthUser, LoginResult, AuthTokenPayload } from "../types/auth.types.js";

/**
 * Authenticate a user with email and password.
 */
export async function loginUser(input: LoginInput): Promise<LoginResult> {
  const user = await findUserByEmail(input.email);
  if (!user) {
    throw new AppError("Invalid email or password.", 401);
  }

  const passwordMatch = await comparePassword(input.password, user.passwordHash);
  if (!passwordMatch) {
    throw new AppError("Invalid email or password.", 401);
  }

  if (!user.isActive) {
    throw new AppError("This account has been deactivated. Please contact your school administrator.", 403);
  }

  let studentId: number | undefined;
  let classId: number | undefined;
  let className: string | undefined;
  let teacherId: number | undefined;
  let employeeId: string | undefined;
  let qualification: string | undefined;

  if (user.role === "student") {
    const studentProfile = await findStudentProfileByUserId(user.id);
    if (studentProfile) {
      studentId = studentProfile.studentId;
      classId = studentProfile.classId;
      className = studentProfile.className;
    }
  } else if (user.role === "teacher") {
    const teacherProfile = await findTeacherProfileByUserId(user.id);
    if (teacherProfile) {
      teacherId = teacherProfile.teacherId;
      employeeId = teacherProfile.employeeId ?? undefined;
      qualification = teacherProfile.qualification ?? undefined;
    }
  }

  const tokenPayload: AuthTokenPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
    name: user.name,
    studentId,
    classId,
    teacherId
  };

  const token = signToken(tokenPayload);

  const authUser: AuthUser = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
    studentId,
    classId,
    className,
    teacherId,
    employeeId,
    qualification
  };

  return { token, user: authUser };
}

/**
 * Retrieve current user profile from authenticated token.
 */
export async function getCurrentUser(tokenUser: AuthTokenPayload): Promise<AuthUser> {
  const user = await findUserById(tokenUser.userId);
  if (!user || !user.isActive) {
    throw new AppError("User account not found or deactivated.", 401);
  }

  let studentId: number | undefined = tokenUser.studentId;
  let classId: number | undefined = tokenUser.classId;
  let className: string | undefined;
  let teacherId: number | undefined = tokenUser.teacherId;
  let employeeId: string | undefined;
  let qualification: string | undefined;

  if (user.role === "student") {
    const studentProfile = await findStudentProfileByUserId(user.id);
    if (studentProfile) {
      studentId = studentProfile.studentId;
      classId = studentProfile.classId;
      className = studentProfile.className;
    }
  } else if (user.role === "teacher") {
    const teacherProfile = await findTeacherProfileByUserId(user.id);
    if (teacherProfile) {
      teacherId = teacherProfile.teacherId;
      employeeId = teacherProfile.employeeId ?? undefined;
      qualification = teacherProfile.qualification ?? undefined;
    }
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
    studentId,
    classId,
    className,
    teacherId,
    employeeId,
    qualification
  };
}
