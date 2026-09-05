# Testing & Verification Log

This document records all automated and manual verification procedures, test commands, expected outputs, and actual observed results.

---

## 1. Baseline Test Executions (Executed on 2026-09-04)

### Test Run 1: TypeScript Compilation (`npm run build`)
- **What Was Tested:** TypeScript compile check against existing codebase.
- **How It Was Tested:** Executed `npm run build` (`tsc`) in `code/quiz-backend/`.
- **Expected Result:** Clean exit with code 0; zero compiler errors.
- **Actual Result:** Clean exit with code 0; generated source declarations and maps.
- **Status:** **PASSED**

### Test Run 2: Backend Server Boot and Health Endpoint
- **What Was Tested:** Server startup on port 5000 and response of `GET /api/health`.
- **How It Was Tested:**
  1. Booted server using `npx tsx src/server.ts`.
  2. Executed HTTP request: `Invoke-RestMethod -Uri "http://localhost:5000/api/health" -Method GET`.
- **Expected Result:** HTTP 200 with `{ "success": true, "message": "ShikshaSetu API is running" }`.
- **Actual Result:**
  ```json
  {
    "success": true,
    "message": "ShikshaSetu API is running"
  }
  ```
- **Status:** **PASSED**

### Test Run 3: Local PostgreSQL Service Discovery
- **What Was Tested:** Verification of local PostgreSQL 18 service and CLI availability.
- **How It Was Tested:** PowerShell service query and WMI process inspection.
- **Expected Result:** Locate active PostgreSQL service and binary.
- **Actual Result:** Found service `postgresql-x64-18` running from `D:\postgres\bin\pg_ctl.exe`. `psql --version` returned `psql (PostgreSQL) 18.6`.
- **Status:** **PASSED**

---

## 2. Executed Feature Test Suite (Executed on 2026-09-05)

All tests below were executed against the running Express application connected to PostgreSQL 18.

| Test ID | Method | Endpoint / Test Target | Input / Payload | Expected Status | Actual Status | Actual Output / Behavior | Result |
|---|---|---|---|---|---|---|---|
| **TST-001** | GET | `/api/health` | None | 200 OK | 200 OK | `{"success": true, "message": "ShikshaSetu API is running"}` | **PASSED** |
| **TST-002** | GET | `/api/classes` | None | 200 OK | 200 OK | Returned 3 classes (`Class 8`, `Class 9`, `Class 10`) | **PASSED** |
| **TST-003** | GET | `/api/classes/1/subjects` | `classId = 1` | 200 OK | 200 OK | Returned `Mathematics` and `Science` for Class 8 | **PASSED** |
| **TST-004** | GET | `/api/classes/abc/subjects` | `classId = "abc"` | 400 Bad Request | 400 Bad Request | `{"success":false,"error":"Validation error: : Parameter must be an integer string"}` | **PASSED** |
| **TST-005** | GET | `/api/subjects/1/chapters` | `subjectId = 1` | 200 OK | 200 OK | Returned `Rational Numbers` and `Linear Equations` | **PASSED** |
| **TST-006** | GET | `/api/chapters/1/quizzes` | `chapterId = 1` | 200 OK | 200 OK | Returned 2 quizzes (`Fundamentals`, `Advanced Problems`) | **PASSED** |
| **TST-007** | GET | `/api/quizzes/1/questions` | `quizId = 1` | 200 OK | 200 OK | Returned 3 questions with options A..D; **verified `correct_answer` is 100% absent** | **PASSED** |
| **TST-008** | POST | `/api/quizzes/1/attempts` | Q1: B (correct), Q2: C (correct), Q3: D (wrong) | 201 Created | 201 Created | Computed score `2`, totalQuestions `3`, percentage `67%`, attemptId `1` | **PASSED** |
| **TST-009** | POST | `/api/quizzes/1/attempts` | Injected `score: 999` in client JSON body | 201 Created | 201 Created | Ignored injected `999`; computed true score `2` based on database answers | **PASSED** |
| **TST-010** | POST | `/api/quizzes/1/attempts` | `selectedAnswer: "X"` | 400 Bad Request | 400 Bad Request | `{"success":false,"error":"Validation error: answers.0.selectedAnswer: Invalid option: expected one of \"A\"|\"B\"|\"C\"|\"D\""}` | **PASSED** |
| **TST-011** | POST | `/api/quizzes/1/attempts` | Question ID 8 (belongs to Quiz 4, not Quiz 1) | 400 Bad Request | 400 Bad Request | `{"success":false,"error":"Question ID 8 does not belong to quiz ID 1"}` | **PASSED** |
| **TST-012** | GET | `/api/quizzes/9999/questions` | Non-existent quiz ID | 404 Not Found | 404 Not Found | `{"success":false,"error":"Quiz with ID 9999 not found"}` | **PASSED** |

### Database State Verification Post-Testing
- `quiz_attempts` row verified: `id: 1, student_id: 2, quiz_id: 1, score: 2, total_questions: 3`.
- `answers` rows verified:
  - Q1: `selected_answer: 'B', is_correct: true`
  - Q2: `selected_answer: 'C', is_correct: true`
  - Q3: `selected_answer: 'D', is_correct: false`

