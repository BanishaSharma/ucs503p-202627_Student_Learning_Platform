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

