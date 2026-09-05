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

## 3. Data Privacy & Future Authentication Considerations

- **Password Storage (Future Auth Phase):** When user authentication is integrated, all passwords must be hashed using `bcrypt` (minimum salt rounds: 10) or `argon2`. Plaintext passwords must never be stored.
- **Role-Based Access Control (RBAC):** Quiz creation and question modification must be restricted to authenticated users with role `teacher` or `admin`. Quiz taking is permitted for `student`.
