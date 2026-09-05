# Security Architecture & Policies

## 1. Threat Modeling for School Quiz Systems

In a government school learning platform, security focuses on integrity, availability, and fair assessment. The primary threats addressed in this phase include:

1. **Cheating via Client Inspection (DevTools / Network Sniffing):**
   Students inspecting HTTP network responses or DOM memory to find correct answers before submitting.
2. **Score Tampering:**
   A malicious client forging a payload containing `score: 100` or manipulating grades.
3. **SQL Injection:**
   Malicious input in URL parameters (`/api/classes/' OR 1=1--`) intended to extract, modify, or destroy database records.
4. **Information Disclosure:**
   Verbose database error traces returned to clients leaking table names, credentials, or internal paths.
5. **Credential Exposure:**
   Database passwords accidentally committed to source control.

---

## 2. Security Decisions & Mitigations

| WHAT | WHY | THREAT | MITIGATION | TRADE-OFF |
|---|---|---|---|---|
| **Omission of Correct Answers from Question API** | Students must not be able to deduce answers before attempting. | Cheating via browser DevTools inspection. | The SQL query for `GET /api/quizzes/:quizId/questions` explicitly selects only `id, quiz_id, question_text, option_a, option_b, option_c, option_d, question_order`. `correct_answer` is never fetched or sent to the client. | Requires a separate query on submission to fetch correct answers server-side. |
| **Mandatory Server-Side Scoring** | Clients are untrusted environments. | Client-side score manipulation. | The backend independently queries `correct_answer` from PostgreSQL, compares each submitted answer, and computes the score. Any client-provided `score` field is stripped by Zod schema validation. | Additional CPU cycles on server for evaluation; minimal impact. |
| **Strict Parameterized Queries ($1, $2)** | Protect against arbitrary SQL execution. | SQL Injection. | All database interactions use parameterized queries via `node-postgres` (`query('SELECT ... WHERE id = $1', [id])`). No dynamic string interpolation is permitted. | Slightly more verbose query code. |
| **Strict Request Validation (Zod)** | Rejects malformed or unexpected data before database execution. | Data corruption, type confusion, injection attacks. | All incoming parameters and request bodies are parsed through strict Zod schemas. Non-conforming payloads return immediate 400 Bad Request. | Requires defining schemas for every endpoint. |
| **Centralized Error Sanitization** | Prevent exposing server internals, stack traces, and database schemas. | Information disclosure / reconnaissance by attackers. | Global error handling middleware intercepts all errors. In non-development environments, internal database error messages are replaced with generic error descriptions (`Internal server error`). | Debugging in production requires checking centralized logs rather than HTTP response bodies. |
| **Environment Variable Isolation (`.env`)** | Protect database credentials and API secrets. | Accidental leak of credentials to GitHub. | `.env` is listed in `.gitignore`. A sanitized `.env.example` is committed with placeholder values. | Developers must maintain their own local `.env` file. |

---

## 3. Production Authentication, Lifecycle & RBAC Architecture

### 3.1 Token Security & Cryptographic Invariants
- **Raw Tokens Never Stored:** Tokens for teacher invitations, student email verification, and password resets are generated using `crypto.randomBytes(32).toString('hex')`. Raw tokens are returned to the user or sent via email. Only the SHA-256 hash (`crypto.createHash('sha256').update(rawToken).digest('hex')`) is persisted in PostgreSQL.
- **Single-Use Enforcement:** Tokens are checked for `used_at IS NULL` and immediately marked used within the transaction. Re-using any token fails with HTTP 400.
- **Strict Expiration Windows:**
  - Teacher invitation tokens: 48 hours
  - Student email verification tokens: 24 hours
  - Password reset tokens: 1 hour

### 3.2 Controlled Registration & Anti-Spoofing
- **Teacher Registration Restricted:** There is NO public endpoint for teacher registration. Teachers must be provisioned by authenticated administrators into `invited` status with `is_active = false`.
- **Domain Whitelisting:** Student self-registration requires an email domain present in `approved_email_domains` (`punjab.gov.in`, `gsss.punjab.gov.in`, `student.punjab.gov.in`, `shikshasetu.gov.in`).
- **Student Registry Anti-Spoofing:** Submitted `classId` and `rollNumber` are strictly validated against pre-approved records in `student_registry`. If a student attempts to enroll in a different class or forge a roll number, the backend throws HTTP 403.
- **Email Verification Gating:** Students begin in `pending_verification` with `is_active = false`. Login attempts prior to verifying email return HTTP 403.

### 3.3 Authorization & Scoping Boundaries
- **Immediate Revocation:** On every authenticated request, `requireAuth` queries PostgreSQL to verify `dbUser.isActive === true` and `dbUser.status === 'active'`. Deactivated or invited accounts are rejected with HTTP 403 even if they hold a valid unexpired JWT.
- **Class Scoping:** Students can only browse subjects, view quizzes, and fetch questions for their assigned class (`classId`). Cross-class access attempts return HTTP 403.
- **Teacher Scoping:** Teachers can only edit quizzes and view results for subjects and classes assigned to them by administrators.

### 3.4 Audit Logging & Sensitive Data Scrubbing
- **Immutable Audit Trail:** Critical administrative and lifecycle events are logged to `audit_logs` (user ID, action, resource type, resource ID, IP address, timestamp, metadata).
- **Automated Scrubbing:** A recursive key scrubber strips `password`, `hash`, `token`, `secret`, `jwt`, and `bearer` from all audit log payloads before database persistence.

---

## 4. 19-Vector Security Matrix & Verification Results

| # | Security Vector | Threat / Attack Vector | Mitigation / Architecture | Verified Result |
|---|---|---|---|---|
| 1 | Teacher Registration Restriction | Rogue teacher account creation | No public registration endpoint exists (404/405) | ✅ PASS |
| 2 | Teacher Invitation State Gating | Premature access by uninvited faculty | Account created in `invited` state; login rejected with HTTP 403 | ✅ PASS |
| 3 | Teacher Invite Acceptance | Unauthorized password establishment | Single-use token required to set initial password and activate | ✅ PASS |
| 4 | Tampered Invitation Token | Forgery of invitation links | SHA-256 hash lookup in DB fails; rejected with HTTP 400 | ✅ PASS |
| 5 | Expired Invitation Token | Stale invitation exploitation | Verified against `expires_at` (48h); rejected with HTTP 400 | ✅ PASS |
| 6 | Re-used Invitation Token | Replay attack using captured link | Enforces `used_at IS NULL`; rejected with HTTP 400 | ✅ PASS |
| 7 | Student Domain Whitelisting | Spam/bot registration from public domains | Domain checked against `approved_email_domains`; rejected with HTTP 400 | ✅ PASS |
| 8 | Student Registry Anti-Spoofing | Class hopping or roll number impersonation | Strict match required against `student_registry`; rejected with HTTP 403 | ✅ PASS |
| 9 | Unverified Student Login Gating | Access before email confirmation | Account starts in `pending_verification`; login rejected with HTTP 403 | ✅ PASS |
| 10 | Email Verification Token | Account activation | Single-use token validates and transitions status to `active` | ✅ PASS |
| 11 | Re-used Verification Token | Replay attack on email verification | Token marked used; subsequent attempts rejected with HTTP 400 | ✅ PASS |
| 12 | Verification Token Refresh | Lost or expired verification email | `POST /api/auth/resend-verification` invalidates old and issues fresh token | ✅ PASS |
| 13 | Single-Use Password Reset Token | Account takeover via stale tokens | 1-hour expiration, stored as SHA-256 hash | ✅ PASS |
| 14 | Password Reset Execution | Unauthorized credential overwrite | Reset token validates identity; password updated with bcrypt hash | ✅ PASS |
| 15 | Re-used Password Reset Token | Replay attack to re-override password | Token marked used; re-use rejected with HTTP 400 | ✅ PASS |
| 16 | Authenticated Change Password | Session password update | Requires valid `currentPassword` before updating | ✅ PASS |
| 17 | Incorrect Old Password | Unauthorized password change on active session | Wrong old password rejected with HTTP 400 | ✅ PASS |
| 18 | Immediate Revocation | Deactivated account retains access via JWT | `requireAuth` validates active status in PostgreSQL on every request (HTTP 403) | ✅ PASS |
| 19 | Audit Logging & Sensitive Data Scrubbing | Plaintext secrets leaked in audit logs | Sensitive keys recursively omitted before storing in `audit_logs` | ✅ PASS |

