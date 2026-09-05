import {
  findUserByEmail,
  findStudentProfileByUserId,
  findTeacherProfileByUserId,
  findUserById,
  createUser,
  createStudentProfile,
  updateUserStatus,
  updateUserPassword,
  isEmailDomainApproved,
  findRegistryStudentRecord,
  claimRegistryStudentRecord,
  createVerificationToken,
  findVerificationTokenByHash,
  markVerificationTokenUsed,
  invalidateUserVerificationTokens,
  createPasswordResetToken,
  findPasswordResetTokenByHash,
  markPasswordResetTokenUsed,
  invalidateUserPasswordResetTokens
} from "../db/queries.js";
import { getClient } from "../db/index.js";
import { comparePassword, hashPassword } from "../utils/password.js";
import { signToken } from "../utils/jwt.js";
import { generateSecureToken, hashToken } from "../utils/token.js";
import { logAuditAction } from "./audit.service.js";
import { AppError } from "../middleware/errorHandler.js";
import type {
  LoginInput,
  StudentRegisterInput,
  AcceptTeacherInviteInput,
  ChangePasswordInput,
  ResetPasswordInput
} from "../schemas/auth.schema.js";
import type { AuthUser, LoginResult, AuthTokenPayload } from "../types/auth.types.js";

/**
 * Authenticate a user with email and password.
 */
export async function loginUser(input: LoginInput, ipAddress?: string): Promise<LoginResult> {
  const user = await findUserByEmail(input.email);
  if (!user) {
    throw new AppError("Invalid email or password.", 401);
  }

  // Account status validation
  if (user.status === "invited") {
    throw new AppError(
      "Account invitation pending. Please check your official email and click the invitation link to establish your password.",
      403
    );
  }

  if (user.status === "pending_verification") {
    throw new AppError(
      "Email verification required. Please verify your email using the link sent during registration before signing in.",
      403
    );
  }

  if (user.status === "deactivated" || !user.isActive) {
    throw new AppError(
      "This account has been deactivated. Please contact your school administrator.",
      403
    );
  }

  const passwordMatch = await comparePassword(input.password, user.passwordHash);
  if (!passwordMatch) {
    throw new AppError("Invalid email or password.", 401);
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
    status: user.status,
    studentId,
    classId,
    className,
    teacherId,
    employeeId,
    qualification
  };

  await logAuditAction({
    userId: user.id,
    action: "USER_LOGIN_SUCCESS",
    resourceType: "auth",
    resourceId: user.id,
    details: { role: user.role, email: user.email },
    ipAddress
  });

  return { token, user: authUser };
}

/**
 * Retrieve current user profile from authenticated token.
 */
export async function getCurrentUser(tokenUser: AuthTokenPayload): Promise<AuthUser> {
  const user = await findUserById(tokenUser.userId);
  if (!user || !user.isActive || user.status !== "active") {
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
    status: user.status,
    studentId,
    classId,
    className,
    teacherId,
    employeeId,
    qualification
  };
}

/**
 * Controlled Student Self-Registration against approved domain and student registry.
 */
export async function registerStudent(
  input: StudentRegisterInput,
  ipAddress?: string
): Promise<{ message: string; verificationToken: string; userId: number; status: "pending_verification" }> {
  const email = input.email.trim().toLowerCase();
  const domain = email.split("@")[1];
  if (!domain) {
    throw new AppError("Invalid email address format.", 400);
  }

  // 1. Verify email domain against approved_email_domains table
  const domainAllowed = await isEmailDomainApproved(domain);
  if (!domainAllowed) {
    throw new AppError(
      `Registration restricted: The email domain '@${domain}' is not authorized for Punjab Government school accounts.`,
      400
    );
  }

  // 2. Verify student registry record (government school pre-enrollment)
  const registryRecord = await findRegistryStudentRecord(email);
  if (!registryRecord) {
    throw new AppError(
      `Registration denied: No pre-enrolled government school registry record found for '${email}'. Please contact your school administration.`,
      403
    );
  }

  if (registryRecord.isRegistered) {
    throw new AppError("An account has already been registered for this student record.", 409);
  }

  // 3. Prevent class and roll number spoofing
  if (input.classId !== registryRecord.classId) {
    throw new AppError(
      `Enrollment mismatch: You selected a class that does not match your official government school enrollment record.`,
      403
    );
  }

  if (input.rollNumber.trim().toLowerCase() !== registryRecord.rollNumber.trim().toLowerCase()) {
    throw new AppError(
      `Enrollment mismatch: The roll number provided does not match your official student registry record.`,
      403
    );
  }

  // 4. Check if user email already exists in users table
  const existingUser = await findUserByEmail(email);
  if (existingUser) {
    throw new AppError("An account with this email address already exists.", 409);
  }

  const passwordHash = await hashPassword(input.password);
  const client = await getClient();

  try {
    await client.query("BEGIN;");

    // Create user with status 'pending_verification' and isActive = false
    const userId = await createUser(client, {
      name: input.name.trim(),
      email,
      passwordHash,
      role: "student",
      isActive: false,
      status: "pending_verification"
    });

    // Create student profile
    await createStudentProfile(client, {
      userId,
      classId: input.classId,
      rollNumber: input.rollNumber.trim(),
      section: input.section?.trim() || registryRecord.section || "A"
    });

    // Claim registry record
    await claimRegistryStudentRecord(client, registryRecord.id, userId);

    // Generate secure email verification token
    const rawToken = generateSecureToken();
    const tokenHash = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await createVerificationToken(client, {
      userId,
      tokenHash,
      tokenType: "student_verify",
      expiresAt
    });

    await client.query("COMMIT;");

    await logAuditAction({
      userId,
      action: "STUDENT_REGISTER_PENDING_VERIFY",
      resourceType: "student",
      resourceId: userId,
      details: { email, classId: input.classId, rollNumber: input.rollNumber },
      ipAddress
    });

    return {
      message: "Registration successful. Please verify your email before signing in.",
      verificationToken: rawToken,
      userId,
      status: "pending_verification"
    };
  } catch (err) {
    await client.query("ROLLBACK;");
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Verify student email using one-time token.
 */
export async function verifyStudentEmail(token: string, ipAddress?: string): Promise<{ message: string }> {
  const tokenHash = hashToken(token);
  const record = await findVerificationTokenByHash(tokenHash);

  if (!record) {
    throw new AppError("Invalid or unknown verification token.", 400);
  }

  if (record.usedAt) {
    throw new AppError("This verification token has already been used.", 400);
  }

  if (new Date() > new Date(record.expiresAt)) {
    throw new AppError("Verification token has expired. Please request a new verification link.", 400);
  }

  if (record.tokenType !== "student_verify") {
    throw new AppError("Invalid verification token type.", 400);
  }

  // Activate student account
  await updateUserStatus(record.userId, true, "active");
  await markVerificationTokenUsed(record.id);

  await logAuditAction({
    userId: record.userId,
    action: "STUDENT_EMAIL_VERIFIED",
    resourceType: "user",
    resourceId: record.userId,
    ipAddress
  });

  return { message: "Email verified successfully! You may now log in with your credentials." };
}

/**
 * Resend verification link for an unverified student account.
 */
export async function resendVerificationEmail(
  email: string,
  ipAddress?: string
): Promise<{ message: string; verificationToken?: string }> {
  const user = await findUserByEmail(email);
  if (!user || user.status !== "pending_verification") {
    // Avoid user enumeration
    return { message: "If an unverified account exists for this email, a verification link has been sent." };
  }

  await invalidateUserVerificationTokens(user.id, "student_verify");

  const rawToken = generateSecureToken();
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  await createVerificationToken(null, {
    userId: user.id,
    tokenHash,
    tokenType: "student_verify",
    expiresAt
  });

  await logAuditAction({
    userId: user.id,
    action: "STUDENT_RESEND_VERIFICATION",
    resourceType: "user",
    resourceId: user.id,
    ipAddress
  });

  return {
    message: "Verification email re-sent successfully.",
    verificationToken: rawToken
  };
}

/**
 * Teacher accepts admin invitation, verifies email, and establishes initial password.
 */
export async function acceptTeacherInvite(
  input: AcceptTeacherInviteInput,
  ipAddress?: string
): Promise<{ message: string }> {
  const tokenHash = hashToken(input.token);
  const record = await findVerificationTokenByHash(tokenHash);

  if (!record) {
    throw new AppError("Invalid or unknown invitation token.", 400);
  }

  if (record.usedAt) {
    throw new AppError("This teacher invitation has already been accepted.", 400);
  }

  if (new Date() > new Date(record.expiresAt)) {
    throw new AppError("Invitation link has expired. Please contact your school administrator for a new invitation.", 400);
  }

  if (record.tokenType !== "teacher_invite") {
    throw new AppError("Invalid invitation token.", 400);
  }

  const passwordHash = await hashPassword(input.password);

  // Set password and transition status to active
  await updateUserPassword(record.userId, passwordHash);
  await updateUserStatus(record.userId, true, "active");
  await markVerificationTokenUsed(record.id);

  await logAuditAction({
    userId: record.userId,
    action: "TEACHER_ACCEPT_INVITE_ACTIVE",
    resourceType: "teacher",
    resourceId: record.userId,
    ipAddress
  });

  return { message: "Teacher account activated successfully. You can now log in." };
}

/**
 * Authenticated user password change.
 */
export async function changePassword(
  userId: number,
  input: ChangePasswordInput,
  ipAddress?: string
): Promise<{ message: string }> {
  const user = await findUserById(userId);
  if (!user) {
    throw new AppError("User account not found.", 404);
  }

  const passwordValid = await comparePassword(input.currentPassword, user.passwordHash);
  if (!passwordValid) {
    throw new AppError("Current password is incorrect.", 400);
  }

  const newHash = await hashPassword(input.newPassword);
  await updateUserPassword(userId, newHash);

  await logAuditAction({
    userId,
    action: "USER_CHANGE_PASSWORD",
    resourceType: "user",
    resourceId: userId,
    ipAddress
  });

  return { message: "Password updated successfully." };
}

/**
 * Initiate password reset request (generates hashed token with 1 hour expiration).
 */
export async function forgotPassword(
  email: string,
  ipAddress?: string
): Promise<{ message: string; resetToken?: string }> {
  const user = await findUserByEmail(email);
  if (!user || !user.isActive || user.status !== "active") {
    // Prevent email enumeration
    return { message: "If an active account exists with that email address, password reset instructions have been sent." };
  }

  await invalidateUserPasswordResetTokens(user.id);

  const rawToken = generateSecureToken();
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await createPasswordResetToken({
    userId: user.id,
    tokenHash,
    expiresAt
  });

  await logAuditAction({
    userId: user.id,
    action: "USER_REQUEST_PASSWORD_RESET",
    resourceType: "user",
    resourceId: user.id,
    ipAddress
  });

  return {
    message: "Password reset instructions have been sent.",
    resetToken: rawToken
  };
}

/**
 * Reset password using valid one-time token.
 */
export async function resetPassword(
  input: ResetPasswordInput,
  ipAddress?: string
): Promise<{ message: string }> {
  const tokenHash = hashToken(input.token);
  const record = await findPasswordResetTokenByHash(tokenHash);

  if (!record) {
    throw new AppError("Invalid or unknown password reset token.", 400);
  }

  if (record.usedAt) {
    throw new AppError("This password reset token has already been used.", 400);
  }

  if (new Date() > new Date(record.expiresAt)) {
    throw new AppError("Password reset token has expired. Please request a new password reset link.", 400);
  }

  const newHash = await hashPassword(input.newPassword);
  await updateUserPassword(record.userId, newHash);
  await markPasswordResetTokenUsed(record.id);

  await logAuditAction({
    userId: record.userId,
    action: "USER_RESET_PASSWORD_SUCCESS",
    resourceType: "user",
    resourceId: record.userId,
    ipAddress
  });

  return { message: "Password has been successfully reset. You may now sign in." };
}
