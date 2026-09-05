# API Documentation

This document specifies all REST API endpoints for ShikshaSetu.

---

## Standard Response Format

All endpoints return a consistent JSON response envelope:

### Success Response
```json
{
  "success": true,
  "data": { ... }
}
```

### Error Response
```json
{
  "success": false,
  "error": "Descriptive error message"
}
```

---

## 1. Health Check

### Method
`GET`

### URL
`/api/health`

### Status
**STATUS: IMPLEMENTED**

### Purpose
Verifies that the backend API server is alive and accepting connections.

### Authentication Required
None

### Required Role
None

### Request Parameters
None

### Request Body
None

### Success Response
- **HTTP Status:** `200 OK`
```json
{
  "success": true,
  "message": "ShikshaSetu API is running"
}
```

### Error Responses
- None under normal operation.

---

## 2. Get All Classes

### Method
`GET`

### URL
`/api/classes`

### Status
**STATUS: IMPLEMENTED**

### Purpose
Retrieve the list of available academic classes (e.g., Class 8, Class 9, Class 10).

### Authentication Required
None (public for student browsing)

### Required Role
None

### Request Parameters
None

### Request Body
None

### Success Response
- **HTTP Status:** `200 OK`
```json
{
  "success": true,
  "data": [
    { "id": 1, "name": "Class 8" },
    { "id": 2, "name": "Class 9" },
    { "id": 3, "name": "Class 10" }
  ]
}
```

### Error Responses
- **HTTP Status:** `500 Internal Server Error`
```json
{
  "success": false,
  "error": "Failed to retrieve classes"
}
```

---

## 3. Get Subjects by Class ID

### Method
`GET`

### URL
`/api/classes/:classId/subjects`

### Status
**STATUS: IMPLEMENTED**

### Purpose
Retrieve all curriculum subjects belonging to a specific class.

### Authentication Required
None

### Required Role
None

### Request Parameters
- `classId` (Path parameter, integer, required): ID of the class.

### Validation Rules
- `classId` must be a positive integer.

### Success Response
- **HTTP Status:** `200 OK`
```json
{
  "success": true,
  "data": [
    { "id": 1, "classId": 1, "name": "Mathematics" },
    { "id": 2, "classId": 1, "name": "Science" }
  ]
}
```

### Error Responses
- **HTTP Status:** `400 Bad Request` (Invalid `classId` format)
- **HTTP Status:** `404 Not Found` (Class not found)
- **HTTP Status:** `500 Internal Server Error`

---

## 4. Get Chapters by Subject ID

### Method
`GET`

### URL
`/api/subjects/:subjectId/chapters`

### Status
**STATUS: IMPLEMENTED**

### Purpose
Retrieve all textbook chapters for a given subject.

### Authentication Required
None

### Required Role
None

### Request Parameters
- `subjectId` (Path parameter, integer, required): ID of the subject.

### Validation Rules
- `subjectId` must be a positive integer.

### Success Response
- **HTTP Status:** `200 OK`
```json
{
  "success": true,
  "data": [
    { "id": 1, "subjectId": 1, "name": "Rational Numbers" },
    { "id": 2, "subjectId": 1, "name": "Linear Equations in One Variable" }
  ]
}
```

### Error Responses
- **HTTP Status:** `400 Bad Request`
- **HTTP Status:** `404 Not Found`
- **HTTP Status:** `500 Internal Server Error`

---

## 5. Get Quizzes by Chapter ID

### Method
`GET`

### URL
`/api/chapters/:chapterId/quizzes`

### Status
**STATUS: IMPLEMENTED**

### Purpose
Retrieve all available quizzes associated with a chapter.

### Authentication Required
None

### Required Role
None

### Request Parameters
- `chapterId` (Path parameter, integer, required): ID of the chapter.

### Validation Rules
- `chapterId` must be a positive integer.

### Success Response
- **HTTP Status:** `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "chapterId": 1,
      "title": "Rational Numbers Quick Quiz",
      "description": "Test your fundamentals on rational and irrational numbers",
      "durationMinutes": 15,
      "totalMarks": 5
    }
  ]
}
```

### Error Responses
- **HTTP Status:** `400 Bad Request`
- **HTTP Status:** `404 Not Found`
- **HTTP Status:** `500 Internal Server Error`

---

## 6. Get Questions for a Quiz

### Method
`GET`

### URL
`/api/quizzes/:quizId/questions`

### Status
**STATUS: IMPLEMENTED**

### Purpose
Retrieve questions and options for a student to take a quiz.

### Authentication Required
None

### Required Role
None

### Request Parameters
- `quizId` (Path parameter, integer, required): ID of the quiz.

### Validation Rules
- `quizId` must be a positive integer.

### Security Consideration (CRITICAL)
- **The field `correct_answer` / `correctAnswer` MUST NEVER be returned in this response.**
- Exposing the correct answer allows cheating via client-side inspection / dev tools.

### Success Response
- **HTTP Status:** `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "quizId": 1,
      "questionText": "What is 0.75 expressed as a rational number in simplest form?",
      "optionA": "3/4",
      "optionB": "7/5",
      "optionC": "75/10",
      "optionD": "1/4",
      "questionOrder": 1
    }
  ]
}
```

### Error Responses
- **HTTP Status:** `400 Bad Request`
- **HTTP Status:** `404 Not Found`
- **HTTP Status:** `500 Internal Server Error`

---

## 7. Submit Quiz Attempt and Score

### Method
`POST`

### URL
`/api/quizzes/:quizId/attempts`

### Status
**STATUS: IMPLEMENTED**

### Purpose
Submit a student's answers for a quiz, evaluate the score server-side against the database, store the attempt and answer details, and return the score.

### Authentication Required
Optional/Deferred for this phase (accepts optional `studentId` in payload).

### Required Role
Student

### Request Parameters
- `quizId` (Path parameter, integer, required): ID of the quiz being attempted.

### Request Body
```json
{
  "studentId": 1,
  "answers": [
    { "questionId": 1, "selectedAnswer": "A" },
    { "questionId": 2, "selectedAnswer": "B" }
  ]
}
```

### Validation Rules (Zod Schema)
- `quizId` must be a positive integer.
- `studentId` (optional) must be a positive integer if provided.
- `answers` must be a non-empty array.
- Each answer must contain:
  - `questionId`: Positive integer.
  - `selectedAnswer`: Exactly one of `'A'`, `'B'`, `'C'`, `'D'`.
- All submitted `questionId`s must exist and belong to the specified `quizId`.

### Business & Security Rules
- **Server-Side Scoring:** The backend looks up the true `correct_answer` for each question from PostgreSQL.
- Any client-submitted `score` is completely ignored.
- The evaluation runs within a PostgreSQL transaction:
  1. Calculate `score`.
  2. Insert record into `quiz_attempts`.
  3. Insert records into `answers`.
  4. Commit transaction.

### Success Response
- **HTTP Status:** `201 Created`
```json
{
  "success": true,
  "data": {
    "attemptId": 1,
    "quizId": 1,
    "score": 2,
    "totalQuestions": 3,
    "percentage": 67,
    "answers": [
      {
        "questionId": 1,
        "selectedAnswer": "B",
        "correctAnswer": "B",
        "isCorrect": true
      },
      {
        "questionId": 2,
        "selectedAnswer": "C",
        "correctAnswer": "C",
        "isCorrect": true
      },
      {
        "questionId": 3,
        "selectedAnswer": "A",
        "correctAnswer": "D",
        "isCorrect": false
      }
    ]
  }
}
```

### Error Responses
- **HTTP Status:** `400 Bad Request` (Validation error or questions do not match quiz)
- **HTTP Status:** `404 Not Found` (Quiz not found)
- **HTTP Status:** `500 Internal Server Error`

---

## 8. Get Student Quiz Attempt History

### Method
`GET`

### URL
`/api/attempts`

### Status
**STATUS: IMPLEMENTED**

### Purpose
Retrieve quiz attempt history records for a student, joined with quiz title, chapter name, subject name, and class name to support student progress tracking and performance dashboards.

### Authentication Required
Optional/Deferred for this phase (supports optional `?studentId=` query parameter).

### Required Role
None

### Request Parameters
- `studentId` (Query parameter, integer, optional): Filter attempt history by a specific student ID. If omitted, returns all recorded attempts.

### Validation Rules
- When provided, `studentId` must be a positive integer string.

### Success Response
- **HTTP Status:** `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "id": 4,
      "quizId": 1,
      "studentId": 1,
      "score": 2,
      "totalQuestions": 3,
      "percentage": 67,
      "attemptedAt": "2026-09-05T10:05:02.775Z",
      "quizTitle": "Rational Numbers - Fundamentals",
      "chapterName": "Rational Numbers",
      "subjectName": "Mathematics",
      "className": "Class 8"
    }
  ]
}
```

### Error Responses
- **HTTP Status:** `400 Bad Request` (Invalid `studentId` format)
- **HTTP Status:** `500 Internal Server Error`

---

## 9. User Authentication (Login)

### Method
`POST`

### URL
`/api/auth/login`

### Status
**STATUS: IMPLEMENTED**

### Purpose
Authenticate a user (admin, teacher, student) with email and password, returning a signed JWT token and user profile.

### Authentication Required
None

### Request Body
```json
{
  "email": "harpreet.math@punjab.gov.in",
  "password": "Password@123"
}
```

### Success Response
- **HTTP Status:** `200 OK`
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOi...",
    "user": {
      "id": 4,
      "name": "Harpreet Kaur (Math/Sci Teacher)",
      "email": "harpreet.math@punjab.gov.in",
      "role": "teacher",
      "isActive": true,
      "teacherId": 4
    }
  }
}
```

---

## 10. Teacher Management & Authoring

### Endpoints
- `GET /api/teacher/classes`: Retrieve assigned classes and subjects for authenticated teacher.
- `GET /api/teacher/quizzes`: Retrieve quizzes created by or assigned to authenticated teacher.
- `POST /api/teacher/quizzes`: Create bilingual quiz with English and Punjabi questions.
- `PUT /api/teacher/quizzes/:quizId` & `PATCH /api/teacher/quizzes/:quizId`: Update quiz details or publish/draft status.
- `DELETE /api/teacher/quizzes/:quizId`: Delete a quiz.
- `POST /api/teacher/quizzes/upload-excel`: Upload spreadsheet (`.xlsx`) to parse and batch-import quiz questions.
- `GET /api/teacher/results`: Retrieve student attempt scores and percentages across assigned classes.

---

## 11. Student Academic Doubts & Q&A

### Endpoints
- `POST /api/queries`: Submit academic question from student to subject teacher.
- `GET /api/queries`: List queries (students view their own; teachers view questions for their assigned classes).
- `GET /api/queries/:queryId`: Retrieve doubt thread with teacher responses.
- `POST /api/queries/:queryId/responses`: Teacher replies to a student question.
- `PATCH /api/queries/:queryId/status`: Toggle doubt status between `open` and `resolved`.

---

## 12. State Admin Oversight & Provisioning

### Endpoints
- `GET /api/admin/stats`: Returns live platform metrics (`totalStudents`, `totalTeachers`, `totalQuizzes`, `totalAttempts`, `activeUsers`).
- `GET /api/admin/teachers`: List all registered teachers with assigned classes and active statuses.
- `POST /api/admin/teachers`: Provision a new teacher account with credentials and employee ID.
- `POST /api/admin/teachers/:teacherId/assignments`: Assign class and subject teaching responsibility.
- `GET /api/admin/students`: List enrolled students with classes, roll numbers, sections, and active statuses.
- `POST /api/admin/students`: Enroll a new student into Class 8, 9, or 10.
- `PATCH /api/admin/users/:userId/status`: Toggle user account active status (`true` / `false`). Deactivated users are blocked from logging in.
- `PUT /api/admin/teachers/:teacherId`: Update teacher name, employee ID, or qualifications.
- `GET /api/admin/audit-logs`: Retrieve recent system audit records (`limit` query parameter, defaults to 100).

---

## 13. Student Self-Registration & Email Verification Lifecycle

### `POST /api/auth/register/student`
- **Purpose:** Student registration against Punjab Government school approved domain and pre-enrolled `student_registry` records.
- **Access:** Public (rate-limited).
- **Body:** `{ name, email, password, classId, rollNumber, section }`
- **Validation:**
  - Email domain must exist in `approved_email_domains` (400 if invalid).
  - Pre-enrollment record must exist in `student_registry` (403 if unregistered).
  - Submitted `classId` and `rollNumber` must strictly match registry record (anti-spoofing; 403 on mismatch).
- **Success (201):** `{ message, verificationToken, userId, status: "pending_verification" }`

### `POST /api/auth/verify-email`
- **Purpose:** Verifies student email using single-use 24-hour verification token.
- **Access:** Public.
- **Body:** `{ token }`
- **Success (200):** `{ message: "Email verified successfully." }` (transitions account status to `active`, enables login).

### `POST /api/auth/resend-verification`
- **Purpose:** Invalidates previous token and issues fresh 24-hour verification token.
- **Access:** Public (rate-limited).
- **Body:** `{ email }`
- **Success (200):** `{ message, verificationToken }`

---

## 14. Teacher Invitation & Account Activation

### `POST /api/admin/teachers`
- **Purpose:** Admin provisions a teacher account in `invited` status with `is_active = false`.
- **Access:** Admin only.
- **Body:** `{ name, email, employeeId, qualification, assignments? }`
- **Success (201):** `{ userId, teacherId, status: "invited", inviteToken, inviteUrl }`

### `POST /api/auth/teacher/accept-invite`
- **Purpose:** Teacher accepts single-use 48-hour invitation token and establishes initial password.
- **Access:** Public (rate-limited).
- **Body:** `{ token, password }`
- **Success (200):** `{ message: "Teacher account activated successfully. You can now log in." }` (transitions status to `active`).

---

## 15. Password Management & Recovery

### `POST /api/auth/change-password`
- **Purpose:** Authenticated user updates their account password.
- **Access:** Authenticated (any role).
- **Body:** `{ currentPassword, newPassword }`
- **Success (200):** `{ message: "Password updated successfully." }`

### `POST /api/auth/forgot-password`
- **Purpose:** Requests a 1-hour single-use password reset token.
- **Access:** Public (rate-limited).
- **Body:** `{ email }`
- **Success (200):** `{ message, resetToken }`

### `POST /api/auth/reset-password`
- **Purpose:** Consumes single-use reset token and updates account password.
- **Access:** Public (rate-limited).
- **Body:** `{ token, newPassword }`
- **Success (200):** `{ message: "Password reset successfully." }`

---

## 16. Audit Log Specifications

### `GET /api/admin/audit-logs`
- **Purpose:** Returns chronological audit records with sensitive details stripped.
- **Access:** Admin only.
- **Query Parameters:** `limit` (number, default 100).
- **Schema:**
  ```json
  {
    "id": 1,
    "userId": 1,
    "userName": "State Administrator",
    "userEmail": "admin@shikshasetu.gov.in",
    "action": "ADMIN_PROVISION_TEACHER_INVITED",
    "resourceType": "teacher",
    "resourceId": "5",
    "details": { "email": "jaswinder.math@punjab.gov.in", "employeeId": "PUN-T-098" },
    "ipAddress": "127.0.0.1",
    "createdAt": "2026-09-05T12:00:00.000Z"
  }
  ```



