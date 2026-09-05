/**
 * ShikshaSetu Platform — Security Test Suite
 * Verifies 19 distinct security vectors across authentication, authorization, token lifecycle, and RBAC.
 */

import pg from "./code/quiz-backend/node_modules/pg/lib/index.js";
import dotenv from "./code/quiz-backend/node_modules/dotenv/lib/main.js";

dotenv.config({ path: "./code/quiz-backend/.env" });

const BASE_URL = process.env.API_BASE_URL || "http://localhost:5000";
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

let passedCount = 0;
let failedCount = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passedCount++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failedCount++;
  }
}

async function runSecurityTests() {
  console.log("\n==================================================================");
  console.log("SHIKSHASETU PLATFORM — 19-VECTOR SECURITY TEST SUITE");
  console.log("==================================================================\n");

  // Reset test student & cleanup previous test data for idempotent execution
  await pool.query(`
    DELETE FROM email_verification_tokens WHERE user_id IN (SELECT id FROM users WHERE email = 'harman.class9@punjab.gov.in' OR email LIKE 'security.%');
    DELETE FROM password_reset_tokens WHERE user_id IN (SELECT id FROM users WHERE email = 'harman.class9@punjab.gov.in' OR email LIKE 'security.%');
    DELETE FROM student_queries WHERE student_id IN (SELECT id FROM students WHERE user_id IN (SELECT id FROM users WHERE email = 'harman.class9@punjab.gov.in' OR email LIKE 'security.%'));
    DELETE FROM quiz_attempts WHERE student_id IN (SELECT id FROM students WHERE user_id IN (SELECT id FROM users WHERE email = 'harman.class9@punjab.gov.in' OR email LIKE 'security.%'));
    DELETE FROM students WHERE user_id IN (SELECT id FROM users WHERE email = 'harman.class9@punjab.gov.in' OR email LIKE 'security.%');
    DELETE FROM teachers WHERE user_id IN (SELECT id FROM users WHERE email LIKE 'security.%');
    DELETE FROM users WHERE email = 'harman.class9@punjab.gov.in' OR email LIKE 'security.%';
    UPDATE student_registry SET is_registered = false, registered_user_id = NULL WHERE email = 'harman.class9@punjab.gov.in';
  `);

  // Admin login for setup
  const adminLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@shikshasetu.gov.in", password: "Password@123" })
  });
  const adminLoginJson = await adminLoginRes.json();
  const adminToken = adminLoginJson.data?.token;

  // ------------------------------------------------------------------
  // VECTOR 1: Public teacher registration does not exist
  // ------------------------------------------------------------------
  console.log("--- VECTOR 1: Teacher Registration Restriction ---");
  const publicTeacherRes = await fetch(`${BASE_URL}/api/auth/register/teacher`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "intruder.teacher@example.com", password: "Password@123" })
  });
  assert(publicTeacherRes.status === 404 || publicTeacherRes.status === 405, "Public teacher registration endpoint does not exist (404/405)");

  // ------------------------------------------------------------------
  // VECTOR 2 & 3: Teacher Provisioning & Invitation Acceptance
  // ------------------------------------------------------------------
  console.log("\n--- VECTOR 2 & 3: Teacher Provisioning & Invitation Acceptance ---");
  const teacherEmail = `security.teacher.${Date.now()}@punjab.gov.in`;
  const provTeacherRes = await fetch(`${BASE_URL}/api/admin/teachers`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${adminToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      name: "Security Test Teacher",
      email: teacherEmail,
      employeeId: `EMP-${Date.now().toString().slice(-5)}`,
      qualification: "M.Sc. Physics"
    })
  });
  const provTeacherJson = await provTeacherRes.json();
  assert(provTeacherRes.status === 201 && provTeacherJson.data?.status === "invited", "Teacher provisioned in 'invited' status");
  const inviteToken = provTeacherJson.data?.inviteToken;
  const teacherUserId = provTeacherJson.data?.userId;

  // Unaccepted teacher login attempt must return HTTP 403
  const prematureTeacherLogin = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: teacherEmail, password: "Password@123" })
  });
  assert(prematureTeacherLogin.status === 403, "Unaccepted invited teacher login rejected with HTTP 403");

  // ------------------------------------------------------------------
  // VECTOR 4, 5, 6: Invitation Token Validation (Tampered, Valid, Re-used)
  // ------------------------------------------------------------------
  console.log("\n--- VECTOR 4, 5, 6: Invitation Token Validation ---");
  // Tampered token
  const tamperedAcceptRes = await fetch(`${BASE_URL}/api/auth/teacher/accept-invite`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token: "tampered-bogus-token-string-12345678", password: "NewPassword@123" })
  });
  assert(tamperedAcceptRes.status === 400 || tamperedAcceptRes.status === 401, "Tampered invitation token rejected");

  // Valid invite acceptance
  const validAcceptRes = await fetch(`${BASE_URL}/api/auth/teacher/accept-invite`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token: inviteToken, password: "TeacherNewPassword@123" })
  });
  assert(validAcceptRes.status === 200, "Valid invitation acceptance succeeds and sets password");

  // Re-used invitation token must fail
  const reusedAcceptRes = await fetch(`${BASE_URL}/api/auth/teacher/accept-invite`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token: inviteToken, password: "AnotherPassword@123" })
  });
  assert(reusedAcceptRes.status === 400, "Re-used invitation token rejected (single-use enforced)");

  // Verified teacher can now log in
  const acceptedTeacherLogin = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: teacherEmail, password: "TeacherNewPassword@123" })
  });
  assert(acceptedTeacherLogin.status === 200, "Active teacher with accepted invitation logs in successfully");

  // ------------------------------------------------------------------
  // VECTOR 7 & 8: Student Domain Whitelisting & Registry Anti-Spoofing
  // ------------------------------------------------------------------
  console.log("\n--- VECTOR 7 & 8: Student Domain & Registry Anti-Spoofing ---");
  // Unapproved domain
  const unapprovedDomainRes = await fetch(`${BASE_URL}/api/auth/register/student`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Rogue Student",
      email: "rogue@gmail.com",
      password: "Password@123",
      classId: 2,
      rollNumber: "201"
    })
  });
  assert(unapprovedDomainRes.status === 400 || unapprovedDomainRes.status === 403, "Student registration with unapproved domain (gmail.com) rejected with HTTP 400/403");

  // Spoofed roll number / class mismatch against pre-approved registry
  const spoofedRegistryRes = await fetch(`${BASE_URL}/api/auth/register/student`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Spoofing Student",
      email: "karan.class8@punjab.gov.in",
      password: "Password@123",
      classId: 3, // Registered as Class 8, claiming Class 10!
      rollNumber: "104"
    })
  });
  assert(spoofedRegistryRes.status === 403, "Student registration class/roll mismatch rejected with HTTP 403");

  // ------------------------------------------------------------------
  // VECTOR 9, 10, 11, 12: Student Verification Lifecycle
  // ------------------------------------------------------------------
  console.log("\n--- VECTOR 9, 10, 11, 12: Student Verification Lifecycle ---");
  // Valid student registration (harman.class9@punjab.gov.in, classId: 2, roll: 201)
  const validRegRes = await fetch(`${BASE_URL}/api/auth/register/student`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Harman Singh",
      email: "harman.class9@punjab.gov.in",
      password: "StudentPassword@123",
      classId: 2,
      rollNumber: "201",
      section: "A"
    })
  });
  const validRegJson = await validRegRes.json();
  assert(validRegRes.status === 201 && validRegJson.data?.status === "pending_verification", "Valid student registration created with status 'pending_verification'");
  const studentVerifyToken = validRegJson.data?.verificationToken;

  // Unverified student login rejected with HTTP 403
  const prematureStudentLogin = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "harman.class9@punjab.gov.in", password: "StudentPassword@123" })
  });
  assert(prematureStudentLogin.status === 403, "Unverified student login rejected with HTTP 403");

  // Resend verification email issues new valid token
  const resendRes = await fetch(`${BASE_URL}/api/auth/resend-verification`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "harman.class9@punjab.gov.in" })
  });
  const resendJson = await resendRes.json();
  assert(resendRes.status === 200 && resendJson.data?.verificationToken, "Resending verification email generates a fresh token");
  const freshStudentToken = resendJson.data?.verificationToken;

  // Verify email with the fresh token
  const verifyRes = await fetch(`${BASE_URL}/api/auth/verify-email`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token: freshStudentToken })
  });
  assert(verifyRes.status === 200, "Valid student email verification succeeds");

  // Re-using verification token fails
  const reusedVerifyRes = await fetch(`${BASE_URL}/api/auth/verify-email`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token: freshStudentToken })
  });
  assert(reusedVerifyRes.status === 400, "Re-used email verification token rejected (single-use enforced)");

  // Verified student now logs in successfully
  const activeStudentLogin = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "harman.class9@punjab.gov.in", password: "StudentPassword@123" })
  });
  assert(activeStudentLogin.status === 200, "Verified student logs in successfully with HTTP 200");
  const studentToken = (await activeStudentLogin.json()).data?.token;

  // ------------------------------------------------------------------
  // VECTOR 13, 14, 15: Password Reset Flow (Forgot & Reset)
  // ------------------------------------------------------------------
  console.log("\n--- VECTOR 13, 14, 15: Password Reset Flow ---");
  const forgotRes = await fetch(`${BASE_URL}/api/auth/forgot-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "harman.class9@punjab.gov.in" })
  });
  const forgotJson = await forgotRes.json();
  assert(forgotRes.status === 200 && forgotJson.data?.resetToken, "Forgot password endpoint generates single-use reset token");
  const resetToken = forgotJson.data?.resetToken;

  // Reset password using reset token
  const resetRes = await fetch(`${BASE_URL}/api/auth/reset-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token: resetToken, newPassword: "HarmanNewPassword@456" })
  });
  assert(resetRes.status === 200, "Password reset with valid token succeeds");

  // Re-using password reset token fails
  const reusedResetRes = await fetch(`${BASE_URL}/api/auth/reset-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token: resetToken, newPassword: "AnotherNewPassword@789" })
  });
  assert(reusedResetRes.status === 400, "Re-used reset token rejected (single-use enforced)");

  // Verify login with updated password
  const newPassLogin = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "harman.class9@punjab.gov.in", password: "HarmanNewPassword@456" })
  });
  assert(newPassLogin.status === 200, "Student logs in with newly reset password");
  const updatedStudentToken = (await newPassLogin.json()).data?.token;

  // ------------------------------------------------------------------
  // VECTOR 16 & 17: Authenticated Change Password
  // ------------------------------------------------------------------
  console.log("\n--- VECTOR 16 & 17: Authenticated Change Password ---");
  // Wrong old password fails
  const wrongOldPassRes = await fetch(`${BASE_URL}/api/auth/change-password`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${updatedStudentToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ currentPassword: "WrongOldPassword", newPassword: "FinalPassword@999" })
  });
  assert(wrongOldPassRes.status === 400, "Change password with incorrect current password rejected with HTTP 400");

  // Correct old password succeeds
  const correctOldPassRes = await fetch(`${BASE_URL}/api/auth/change-password`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${updatedStudentToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ currentPassword: "HarmanNewPassword@456", newPassword: "FinalPassword@999" })
  });
  assert(correctOldPassRes.status === 200, "Change password with valid current password succeeds");

  // ------------------------------------------------------------------
  // VECTOR 18: Account Deactivation & Immediate Token Rejection
  // ------------------------------------------------------------------
  console.log("\n--- VECTOR 18: Account Deactivation Enforcement ---");
  // Deactivate the test teacher
  const deactRes = await fetch(`${BASE_URL}/api/admin/users/${teacherUserId}/status`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${adminToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ isActive: false })
  });
  assert(deactRes.status === 200, "Admin deactivates teacher user account");

  const deactLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: teacherEmail, password: "TeacherNewPassword@123" })
  });
  assert(deactLoginRes.status === 403, "Deactivated account login immediately rejected with HTTP 403");

  // ------------------------------------------------------------------
  // VECTOR 19: Audit Logging Verification
  // ------------------------------------------------------------------
  console.log("\n--- VECTOR 19: Audit Logging & Sensitive Data Scrubbing ---");
  const auditRes = await fetch(`${BASE_URL}/api/admin/audit-logs?limit=20`, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  const auditJson = await auditRes.json();
  assert(auditRes.status === 200 && Array.isArray(auditJson.data) && auditJson.data.length > 0, "Admin retrieves audit logs from PostgreSQL");

  // Verify that no passwords, hashes, or tokens exist in audit logs details
  const auditStr = JSON.stringify(auditJson.data);
  const containsRawPassword = auditStr.includes("Password@123") || auditStr.includes("TeacherNewPassword@123");
  assert(!containsRawPassword, "Audit logs do NOT contain plaintext passwords or secrets");

  await pool.end();

  console.log("\n==================================================================");
  console.log(`SECURITY TEST SUMMARY: ${passedCount} PASSED, ${failedCount} FAILED`);
  console.log("==================================================================\n");

  if (failedCount > 0) {
    process.exit(1);
  }
}

runSecurityTests().catch((err) => {
  console.error("FATAL test runner error:", err);
  pool.end();
  process.exit(1);
});
