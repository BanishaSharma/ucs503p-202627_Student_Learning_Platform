import { query } from "./index.js";
import type { PoolClient } from "pg";
import type {
  ClassItem,
  SubjectItem,
  ChapterItem,
  QuizItem,
  StudentQuestionItem,
  InternalScoringQuestion,
  StudentAttemptHistoryItem
} from "../types/quiz.types.js";
import type { AuthUser, UserRole } from "../types/auth.types.js";
import type {
  TeacherAssignedClass,
  TeacherQuizSummary,
  QuestionDetail,
  TeacherStudentResult,
  StudentQueryItem,
  QueryResponseItem,
  AdminTeacherItem,
  AdminStudentItem,
  PlatformStats
} from "../types/platform.types.js";


/**
 * Retrieve all classes ordered by ID.
 */
export async function findClasses(): Promise<ClassItem[]> {
  const sql = `SELECT id, name FROM classes ORDER BY id ASC;`;
  const result = await query<ClassItem>(sql);
  return result.rows;
}

/**
 * Retrieve a single class by ID.
 */
export async function findClassById(classId: number): Promise<ClassItem | null> {
  const sql = `SELECT id, name FROM classes WHERE id = $1;`;
  const result = await query<ClassItem>(sql, [classId]);
  return result.rows[0] ?? null;
}

/**
 * Retrieve all subjects for a given class ID.
 */
export async function findSubjectsByClassId(classId: number): Promise<SubjectItem[]> {
  const sql = `
    SELECT id, class_id AS "classId", name 
    FROM subjects 
    WHERE class_id = $1 
    ORDER BY id ASC;
  `;
  const result = await query<SubjectItem>(sql, [classId]);
  return result.rows;
}

/**
 * Retrieve a single subject by ID.
 */
export async function findSubjectById(subjectId: number): Promise<SubjectItem | null> {
  const sql = `
    SELECT id, class_id AS "classId", name 
    FROM subjects 
    WHERE id = $1;
  `;
  const result = await query<SubjectItem>(sql, [subjectId]);
  return result.rows[0] ?? null;
}

/**
 * Retrieve all chapters for a given subject ID.
 */
export async function findChaptersBySubjectId(subjectId: number): Promise<ChapterItem[]> {
  const sql = `
    SELECT id, subject_id AS "subjectId", name 
    FROM chapters 
    WHERE subject_id = $1 
    ORDER BY id ASC;
  `;
  const result = await query<ChapterItem>(sql, [subjectId]);
  return result.rows;
}

/**
 * Retrieve a single chapter by ID.
 */
export async function findChapterById(chapterId: number): Promise<ChapterItem | null> {
  const sql = `
    SELECT id, subject_id AS "subjectId", name 
    FROM chapters 
    WHERE id = $1;
  `;
  const result = await query<ChapterItem>(sql, [chapterId]);
  return result.rows[0] ?? null;
}

/**
 * Retrieve all quizzes for a given chapter ID.
 */
export async function findQuizzesByChapterId(chapterId: number): Promise<QuizItem[]> {
  const sql = `
    SELECT 
      id, 
      chapter_id AS "chapterId", 
      title, 
      description, 
      duration_minutes AS "durationMinutes", 
      total_marks AS "totalMarks", 
      created_at AS "createdAt" 
    FROM quizzes 
    WHERE chapter_id = $1 
    ORDER BY id ASC;
  `;
  const result = await query<QuizItem>(sql, [chapterId]);
  return result.rows;
}

/**
 * Retrieve a single quiz by ID.
 */
export async function findQuizById(quizId: number): Promise<QuizItem | null> {
  const sql = `
    SELECT 
      id, 
      chapter_id AS "chapterId", 
      title, 
      description, 
      duration_minutes AS "durationMinutes", 
      total_marks AS "totalMarks", 
      created_at AS "createdAt" 
    FROM quizzes 
    WHERE id = $1;
  `;
  const result = await query<QuizItem>(sql, [quizId]);
  return result.rows[0] ?? null;
}

/**
 * Retrieve questions for a quiz for students.
 * SECURITY: correct_answer is strictly omitted from the query projection!
 */
export async function findQuestionsByQuizId(quizId: number): Promise<StudentQuestionItem[]> {
  const sql = `
    SELECT 
      id, 
      quiz_id AS "quizId", 
      question_text AS "questionText", 
      option_a AS "optionA", 
      option_b AS "optionB", 
      option_c AS "optionC", 
      option_d AS "optionD", 
      question_order AS "questionOrder",
      question_text_pa AS "questionTextPa",
      option_a_pa AS "optionAPa",
      option_b_pa AS "optionBPa",
      option_c_pa AS "optionCPa",
      option_d_pa AS "optionDPa"
    FROM questions 
    WHERE quiz_id = $1 
    ORDER BY question_order ASC, id ASC;
  `;
  const result = await query<StudentQuestionItem>(sql, [quizId]);
  return result.rows;
}

/**
 * Retrieve questions for server-side evaluation only (includes correct_answer).
 * Used exclusively by the scoring service.
 */
export async function findQuestionsForScoring(quizId: number): Promise<InternalScoringQuestion[]> {
  const sql = `
    SELECT 
      id, 
      quiz_id AS "quizId", 
      correct_answer AS "correctAnswer" 
    FROM questions 
    WHERE quiz_id = $1;
  `;
  const result = await query<InternalScoringQuestion>(sql, [quizId]);
  return result.rows;
}

/**
 * Transactional insert: Creates a quiz attempt record.
 */
export async function insertQuizAttempt(
  client: PoolClient,
  quizId: number,
  studentId: number | null,
  score: number,
  totalQuestions: number
): Promise<number> {
  const sql = `
    INSERT INTO quiz_attempts (quiz_id, student_id, score, total_questions) 
    VALUES ($1, $2, $3, $4) 
    RETURNING id;
  `;
  const result = await client.query<{ id: number }>(sql, [quizId, studentId, score, totalQuestions]);
  const row = result.rows[0];
  if (!row) {
    throw new Error("Failed to insert quiz attempt");
  }
  return row.id;
}

/**
 * Transactional insert: Records an answer in the answers table.
 */
export async function insertAttemptAnswer(
  client: PoolClient,
  attemptId: number,
  questionId: number,
  selectedAnswer: "A" | "B" | "C" | "D",
  isCorrect: boolean
): Promise<void> {
  const sql = `
    INSERT INTO answers (attempt_id, question_id, selected_answer, is_correct) 
    VALUES ($1, $2, $3, $4);
  `;
  await client.query(sql, [attemptId, questionId, selectedAnswer, isCorrect]);
}

/**
 * Retrieve attempt history for students with full curriculum metadata.
 */
export async function findStudentAttempts(studentId?: number): Promise<StudentAttemptHistoryItem[]> {
  let sql = `
    SELECT 
      qa.id,
      qa.quiz_id AS "quizId",
      qa.student_id AS "studentId",
      qa.score,
      qa.total_questions AS "totalQuestions",
      ROUND((qa.score::numeric / qa.total_questions::numeric) * 100)::integer AS percentage,
      qa.attempted_at AS "attemptedAt",
      q.title AS "quizTitle",
      ch.name AS "chapterName",
      s.name AS "subjectName",
      c.name AS "className"
    FROM quiz_attempts qa
    JOIN quizzes q ON qa.quiz_id = q.id
    JOIN chapters ch ON q.chapter_id = ch.id
    JOIN subjects s ON ch.subject_id = s.id
    JOIN classes c ON s.class_id = c.id
  `;
  const params: unknown[] = [];
  if (studentId !== undefined) {
    sql += ` WHERE qa.student_id = $1`;
    params.push(studentId);
  }
  sql += ` ORDER BY qa.attempted_at DESC;`;
  const result = await query<StudentAttemptHistoryItem>(sql, params);
  return result.rows;
}

// ============================================================
// 1. AUTHENTICATION & USER QUERIES
// ============================================================

export interface DbUserRow {
  id: number;
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  isActive: boolean;
}

export async function findUserByEmail(email: string): Promise<DbUserRow | null> {
  const sql = `
    SELECT 
      id, 
      name, 
      email, 
      password_hash AS "passwordHash", 
      role, 
      is_active AS "isActive"
    FROM users 
    WHERE LOWER(email) = LOWER($1);
  `;
  const result = await query<DbUserRow>(sql, [email.trim()]);
  return result.rows[0] ?? null;
}

export async function findUserById(id: number): Promise<DbUserRow | null> {
  const sql = `
    SELECT 
      id, 
      name, 
      email, 
      password_hash AS "passwordHash", 
      role, 
      is_active AS "isActive"
    FROM users 
    WHERE id = $1;
  `;
  const result = await query<DbUserRow>(sql, [id]);
  return result.rows[0] ?? null;
}

export interface StudentProfileRow {
  studentId: number;
  classId: number;
  className: string;
  rollNumber: string | null;
  section: string | null;
}

export async function findStudentProfileByUserId(userId: number): Promise<StudentProfileRow | null> {
  const sql = `
    SELECT 
      s.id AS "studentId",
      s.class_id AS "classId",
      c.name AS "className",
      s.roll_number AS "rollNumber",
      s.section
    FROM students s
    JOIN classes c ON s.class_id = c.id
    WHERE s.user_id = $1;
  `;
  const result = await query<StudentProfileRow>(sql, [userId]);
  return result.rows[0] ?? null;
}

export interface TeacherProfileRow {
  teacherId: number;
  employeeId: string | null;
  qualification: string | null;
}

export async function findTeacherProfileByUserId(userId: number): Promise<TeacherProfileRow | null> {
  const sql = `
    SELECT 
      t.id AS "teacherId",
      t.employee_id AS "employeeId",
      t.qualification
    FROM teachers t
    WHERE t.user_id = $1;
  `;
  const result = await query<TeacherProfileRow>(sql, [userId]);
  return result.rows[0] ?? null;
}

// ============================================================
// 2. STUDENT-SCOPED CURRICULUM QUERIES
// ============================================================

export async function findQuizzesForStudent(chapterId: number, studentClassId: number): Promise<QuizItem[]> {
  const sql = `
    SELECT 
      q.id, 
      q.chapter_id AS "chapterId", 
      q.title, 
      q.description, 
      q.duration_minutes AS "durationMinutes", 
      q.total_marks AS "totalMarks", 
      q.created_at AS "createdAt" 
    FROM quizzes q
    JOIN chapters ch ON q.chapter_id = ch.id
    JOIN subjects s ON ch.subject_id = s.id
    WHERE q.chapter_id = $1 
      AND s.class_id = $2 
      AND q.status = 'published'
    ORDER BY q.id ASC;
  `;
  const result = await query<QuizItem>(sql, [chapterId, studentClassId]);
  return result.rows;
}

export async function findQuizClassId(quizId: number): Promise<number | null> {
  const sql = `
    SELECT s.class_id 
    FROM quizzes q
    JOIN chapters ch ON q.chapter_id = ch.id
    JOIN subjects s ON ch.subject_id = s.id
    WHERE q.id = $1;
  `;
  const result = await query<{ class_id: number }>(sql, [quizId]);
  return result.rows[0]?.class_id ?? null;
}

// ============================================================
// 3. TEACHER WORKSPACE QUERIES
// ============================================================

export async function findTeacherAssignedClasses(teacherId: number): Promise<TeacherAssignedClass[]> {
  const sql = `
    SELECT DISTINCT
      c.id AS "classId",
      c.name AS "className",
      s.id AS "subjectId",
      s.name AS "subjectName"
    FROM teacher_class_assignments tca
    JOIN classes c ON tca.class_id = c.id
    JOIN subjects s ON tca.subject_id = s.id
    WHERE tca.teacher_id = $1
    ORDER BY c.id ASC, s.name ASC;
  `;
  const result = await query<TeacherAssignedClass>(sql, [teacherId]);
  return result.rows;
}

export async function findTeacherQuizzes(teacherUserId: number): Promise<TeacherQuizSummary[]> {
  const sql = `
    SELECT 
      q.id,
      q.title,
      q.description,
      q.duration_minutes AS "durationMinutes",
      q.total_marks AS "totalMarks",
      q.status,
      q.created_at AS "createdAt",
      ch.id AS "chapterId",
      ch.name AS "chapterName",
      s.id AS "subjectId",
      s.name AS "subjectName",
      c.id AS "classId",
      c.name AS "className",
      COUNT(DISTINCT qu.id)::integer AS "questionCount",
      COUNT(DISTINCT qa.id)::integer AS "totalAttempts",
      COALESCE(ROUND(AVG((qa.score::numeric / NULLIF(qa.total_questions, 0)::numeric) * 100)), 0)::integer AS "avgScorePercentage"
    FROM quizzes q
    JOIN chapters ch ON q.chapter_id = ch.id
    JOIN subjects s ON ch.subject_id = s.id
    JOIN classes c ON s.class_id = c.id
    LEFT JOIN questions qu ON qu.quiz_id = q.id
    LEFT JOIN quiz_attempts qa ON qa.quiz_id = q.id
    WHERE q.created_by = $1
    GROUP BY q.id, ch.id, ch.name, s.id, s.name, c.id, c.name
    ORDER BY q.created_at DESC;
  `;
  const result = await query<TeacherQuizSummary>(sql, [teacherUserId]);
  return result.rows;
}

export async function findQuizQuestionsForTeacher(quizId: number): Promise<QuestionDetail[]> {
  const sql = `
    SELECT 
      id,
      quiz_id AS "quizId",
      question_text AS "questionText",
      option_a AS "optionA",
      option_b AS "optionB",
      option_c AS "optionC",
      option_d AS "optionD",
      correct_answer AS "correctAnswer",
      question_order AS "questionOrder",
      question_text_pa AS "questionTextPa",
      option_a_pa AS "optionAPa",
      option_b_pa AS "optionBPa",
      option_c_pa AS "optionCPa",
      option_d_pa AS "optionDPa"
    FROM questions
    WHERE quiz_id = $1
    ORDER BY question_order ASC, id ASC;
  `;
  const result = await query<QuestionDetail>(sql, [quizId]);
  return result.rows;
}

export async function createQuiz(
  client: PoolClient,
  data: {
    chapterId: number;
    title: string;
    description: string | null;
    durationMinutes: number;
    totalMarks: number;
    createdBy: number;
    status: "draft" | "published" | "archived";
  }
): Promise<number> {
  const sql = `
    INSERT INTO quizzes (chapter_id, title, description, duration_minutes, total_marks, created_by, status)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING id;
  `;
  const result = await client.query<{ id: number }>(sql, [
    data.chapterId,
    data.title,
    data.description,
    data.durationMinutes,
    data.totalMarks,
    data.createdBy,
    data.status
  ]);
  const row = result.rows[0];
  if (!row) throw new Error("Failed to insert quiz");
  return row.id;
}

export async function createQuestion(
  client: PoolClient,
  data: {
    quizId: number;
    questionText: string;
    optionA: string;
    optionB: string;
    optionC: string;
    optionD: string;
    correctAnswer: "A" | "B" | "C" | "D";
    questionOrder: number;
    questionTextPa?: string | null;
    optionAPa?: string | null;
    optionBPa?: string | null;
    optionCPa?: string | null;
    optionDPa?: string | null;
  }
): Promise<number> {
  const sql = `
    INSERT INTO questions (
      quiz_id, question_text, option_a, option_b, option_c, option_d, correct_answer, question_order,
      question_text_pa, option_a_pa, option_b_pa, option_c_pa, option_d_pa
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
    RETURNING id;
  `;
  const result = await client.query<{ id: number }>(sql, [
    data.quizId,
    data.questionText,
    data.optionA,
    data.optionB,
    data.optionC,
    data.optionD,
    data.correctAnswer,
    data.questionOrder,
    data.questionTextPa ?? null,
    data.optionAPa ?? null,
    data.optionBPa ?? null,
    data.optionCPa ?? null,
    data.optionDPa ?? null
  ]);
  const row = result.rows[0];
  if (!row) throw new Error("Failed to insert question");
  return row.id;
}

export async function deleteQuestionsByQuizId(client: PoolClient, quizId: number): Promise<void> {
  await client.query(`DELETE FROM questions WHERE quiz_id = $1;`, [quizId]);
}

export async function updateQuiz(
  quizId: number,
  data: {
    title?: string;
    description?: string | null;
    durationMinutes?: number;
    totalMarks?: number;
    status?: "draft" | "published" | "archived";
  }
): Promise<void> {
  const fields: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  if (data.title !== undefined) {
    fields.push(`title = $${idx++}`);
    values.push(data.title);
  }
  if (data.description !== undefined) {
    fields.push(`description = $${idx++}`);
    values.push(data.description);
  }
  if (data.durationMinutes !== undefined) {
    fields.push(`duration_minutes = $${idx++}`);
    values.push(data.durationMinutes);
  }
  if (data.totalMarks !== undefined) {
    fields.push(`total_marks = $${idx++}`);
    values.push(data.totalMarks);
  }
  if (data.status !== undefined) {
    fields.push(`status = $${idx++}`);
    values.push(data.status);
  }

  if (fields.length === 0) return;
  fields.push(`updated_at = CURRENT_TIMESTAMP`);

  values.push(quizId);
  const sql = `UPDATE quizzes SET ${fields.join(", ")} WHERE id = $${idx};`;
  await query(sql, values);
}

export async function deleteQuiz(quizId: number): Promise<void> {
  await query(`DELETE FROM quizzes WHERE id = $1;`, [quizId]);
}

export async function findTeacherResults(teacherId: number): Promise<TeacherStudentResult[]> {
  const sql = `
    SELECT 
      qa.id AS "attemptId",
      qa.student_id AS "studentId",
      u.name AS "studentName",
      u.email AS "studentEmail",
      st.roll_number AS "rollNumber",
      st.section,
      c.name AS "className",
      s.name AS "subjectName",
      q.title AS "quizTitle",
      qa.score,
      qa.total_questions AS "totalQuestions",
      ROUND((qa.score::numeric / NULLIF(qa.total_questions, 0)::numeric) * 100)::integer AS percentage,
      qa.attempted_at AS "attemptedAt"
    FROM quiz_attempts qa
    JOIN quizzes q ON qa.quiz_id = q.id
    JOIN chapters ch ON q.chapter_id = ch.id
    JOIN subjects s ON ch.subject_id = s.id
    JOIN classes c ON s.class_id = c.id
    JOIN students st ON qa.student_id = st.id
    JOIN users u ON st.user_id = u.id
    JOIN teacher_class_assignments tca ON (tca.class_id = c.id AND tca.subject_id = s.id AND tca.teacher_id = $1)
    ORDER BY qa.attempted_at DESC
    LIMIT 100;
  `;
  const result = await query<TeacherStudentResult>(sql, [teacherId]);
  return result.rows;
}

// ============================================================
// 4. STUDENT DOUBTS & QUERIES
// ============================================================

export async function createStudentQuery(
  studentId: number,
  classId: number,
  subjectId: number | null,
  chapterId: number | null,
  title: string,
  description: string
): Promise<number> {
  const sql = `
    INSERT INTO student_queries (student_id, class_id, subject_id, chapter_id, title, description, status)
    VALUES ($1, $2, $3, $4, $5, $6, 'open')
    RETURNING id;
  `;
  const result = await query<{ id: number }>(sql, [studentId, classId, subjectId, chapterId, title, description]);
  return result.rows[0]!.id;
}

export async function findQueriesByStudent(studentId: number): Promise<StudentQueryItem[]> {
  const sql = `
    SELECT 
      sq.id,
      sq.student_id AS "studentId",
      u.name AS "studentName",
      sq.class_id AS "classId",
      c.name AS "className",
      sq.subject_id AS "subjectId",
      s.name AS "subjectName",
      sq.chapter_id AS "chapterId",
      ch.name AS "chapterName",
      sq.title,
      sq.description,
      sq.status,
      sq.created_at AS "createdAt",
      sq.updated_at AS "updatedAt",
      COUNT(qr.id)::integer AS "responseCount"
    FROM student_queries sq
    JOIN students st ON sq.student_id = st.id
    JOIN users u ON st.user_id = u.id
    JOIN classes c ON sq.class_id = c.id
    LEFT JOIN subjects s ON sq.subject_id = s.id
    LEFT JOIN chapters ch ON sq.chapter_id = ch.id
    LEFT JOIN query_responses qr ON qr.query_id = sq.id
    WHERE sq.student_id = $1
    GROUP BY sq.id, u.name, c.name, s.name, ch.name
    ORDER BY sq.updated_at DESC;
  `;
  const result = await query<StudentQueryItem>(sql, [studentId]);
  return result.rows;
}

export async function findQueriesForTeacher(teacherId: number): Promise<StudentQueryItem[]> {
  const sql = `
    SELECT DISTINCT
      sq.id,
      sq.student_id AS "studentId",
      u.name AS "studentName",
      sq.class_id AS "classId",
      c.name AS "className",
      sq.subject_id AS "subjectId",
      s.name AS "subjectName",
      sq.chapter_id AS "chapterId",
      ch.name AS "chapterName",
      sq.title,
      sq.description,
      sq.status,
      sq.created_at AS "createdAt",
      sq.updated_at AS "updatedAt",
      COUNT(qr.id)::integer AS "responseCount"
    FROM student_queries sq
    JOIN students st ON sq.student_id = st.id
    JOIN users u ON st.user_id = u.id
    JOIN classes c ON sq.class_id = c.id
    LEFT JOIN subjects s ON sq.subject_id = s.id
    LEFT JOIN chapters ch ON sq.chapter_id = ch.id
    LEFT JOIN query_responses qr ON qr.query_id = sq.id
    JOIN teacher_class_assignments tca ON (
      tca.class_id = sq.class_id 
      AND (sq.subject_id IS NULL OR tca.subject_id = sq.subject_id)
      AND tca.teacher_id = $1
    )
    GROUP BY sq.id, u.name, c.name, s.name, ch.name
    ORDER BY sq.status ASC, sq.updated_at DESC;
  `;
  const result = await query<StudentQueryItem>(sql, [teacherId]);
  return result.rows;
}

export async function findQueryById(queryId: number): Promise<StudentQueryItem | null> {
  const sql = `
    SELECT 
      sq.id,
      sq.student_id AS "studentId",
      u.name AS "studentName",
      sq.class_id AS "classId",
      c.name AS "className",
      sq.subject_id AS "subjectId",
      s.name AS "subjectName",
      sq.chapter_id AS "chapterId",
      ch.name AS "chapterName",
      sq.title,
      sq.description,
      sq.status,
      sq.created_at AS "createdAt",
      sq.updated_at AS "updatedAt",
      0::integer AS "responseCount"
    FROM student_queries sq
    JOIN students st ON sq.student_id = st.id
    JOIN users u ON st.user_id = u.id
    JOIN classes c ON sq.class_id = c.id
    LEFT JOIN subjects s ON sq.subject_id = s.id
    LEFT JOIN chapters ch ON sq.chapter_id = ch.id
    WHERE sq.id = $1;
  `;
  const result = await query<StudentQueryItem>(sql, [queryId]);
  return result.rows[0] ?? null;
}

export async function findQueryResponses(queryId: number): Promise<QueryResponseItem[]> {
  const sql = `
    SELECT 
      qr.id,
      qr.query_id AS "queryId",
      qr.responder_id AS "responderId",
      u.name AS "responderName",
      u.role AS "responderRole",
      qr.response_text AS "responseText",
      qr.created_at AS "createdAt"
    FROM query_responses qr
    JOIN users u ON qr.responder_id = u.id
    WHERE qr.query_id = $1
    ORDER BY qr.created_at ASC;
  `;
  const result = await query<QueryResponseItem>(sql, [queryId]);
  return result.rows;
}

export async function addQueryResponse(
  queryId: number,
  responderId: number,
  responseText: string
): Promise<number> {
  const sql = `
    INSERT INTO query_responses (query_id, responder_id, response_text)
    VALUES ($1, $2, $3)
    RETURNING id;
  `;
  const result = await query<{ id: number }>(sql, [queryId, responderId, responseText]);
  await query(`UPDATE student_queries SET updated_at = CURRENT_TIMESTAMP WHERE id = $1;`, [queryId]);
  return result.rows[0]!.id;
}

export async function updateQueryStatus(queryId: number, status: "open" | "resolved"): Promise<void> {
  const sql = `UPDATE student_queries SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2;`;
  await query(sql, [status, queryId]);
}

// ============================================================
// 5. ADMIN MANAGEMENT QUERIES
// ============================================================

export async function findAllTeachers(): Promise<AdminTeacherItem[]> {
  const sql = `
    SELECT 
      t.id,
      t.user_id AS "userId",
      u.name,
      u.email,
      u.is_active AS "isActive",
      t.employee_id AS "employeeId",
      t.qualification,
      t.created_at AS "createdAt",
      COALESCE(
        json_agg(
          json_build_object(
            'classId', c.id,
            'className', c.name,
            'subjectId', s.id,
            'subjectName', s.name
          )
        ) FILTER (WHERE c.id IS NOT NULL),
        '[]'::json
      ) AS "assignedClasses"
    FROM teachers t
    JOIN users u ON t.user_id = u.id
    LEFT JOIN teacher_class_assignments tca ON tca.teacher_id = t.id
    LEFT JOIN classes c ON tca.class_id = c.id
    LEFT JOIN subjects s ON tca.subject_id = s.id
    GROUP BY t.id, u.name, u.email, u.is_active, t.employee_id, t.qualification, t.created_at
    ORDER BY u.name ASC;
  `;
  const result = await query<AdminTeacherItem>(sql);
  return result.rows;
}

export async function createUser(
  client: PoolClient,
  data: {
    name: string;
    email: string;
    passwordHash: string;
    role: UserRole;
    isActive: boolean;
  }
): Promise<number> {
  const sql = `
    INSERT INTO users (name, email, password_hash, role, is_active)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING id;
  `;
  const result = await client.query<{ id: number }>(sql, [
    data.name,
    data.email.trim().toLowerCase(),
    data.passwordHash,
    data.role,
    data.isActive
  ]);
  return result.rows[0]!.id;
}

export async function createTeacherProfile(
  client: PoolClient,
  data: {
    userId: number;
    employeeId: string | null;
    qualification: string | null;
  }
): Promise<number> {
  const sql = `
    INSERT INTO teachers (user_id, employee_id, qualification)
    VALUES ($1, $2, $3)
    RETURNING id;
  `;
  const result = await client.query<{ id: number }>(sql, [
    data.userId,
    data.employeeId,
    data.qualification
  ]);
  return result.rows[0]!.id;
}

export async function updateUserStatus(userId: number, isActive: boolean): Promise<void> {
  const sql = `UPDATE users SET is_active = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2;`;
  await query(sql, [isActive, userId]);
}

export async function findAllStudents(): Promise<AdminStudentItem[]> {
  const sql = `
    SELECT 
      st.id,
      st.user_id AS "userId",
      u.name,
      u.email,
      u.is_active AS "isActive",
      c.id AS "classId",
      c.name AS "className",
      st.roll_number AS "rollNumber",
      st.section,
      st.created_at AS "createdAt"
    FROM students st
    JOIN users u ON st.user_id = u.id
    JOIN classes c ON st.class_id = c.id
    ORDER BY c.id ASC, st.roll_number ASC, u.name ASC;
  `;
  const result = await query<AdminStudentItem>(sql);
  return result.rows;
}

export async function createStudentProfile(
  client: PoolClient,
  data: {
    userId: number;
    classId: number;
    rollNumber: string | null;
    section: string | null;
  }
): Promise<number> {
  const sql = `
    INSERT INTO students (user_id, class_id, roll_number, section)
    VALUES ($1, $2, $3, $4)
    RETURNING id;
  `;
  const result = await client.query<{ id: number }>(sql, [
    data.userId,
    data.classId,
    data.rollNumber,
    data.section
  ]);
  return result.rows[0]!.id;
}

export async function assignTeacherClass(
  teacherId: number,
  classId: number,
  subjectId: number
): Promise<void> {
  const sql = `
    INSERT INTO teacher_class_assignments (teacher_id, class_id, subject_id)
    VALUES ($1, $2, $3)
    ON CONFLICT (teacher_id, class_id, subject_id) DO NOTHING;
  `;
  await query(sql, [teacherId, classId, subjectId]);
}

export async function removeTeacherClass(
  teacherId: number,
  classId: number,
  subjectId: number
): Promise<void> {
  const sql = `
    DELETE FROM teacher_class_assignments 
    WHERE teacher_id = $1 AND class_id = $2 AND subject_id = $3;
  `;
  await query(sql, [teacherId, classId, subjectId]);
}

export async function findPlatformStats(): Promise<PlatformStats> {
  const sql = `
    SELECT 
      (SELECT COUNT(*) FROM students)::integer AS "totalStudents",
      (SELECT COUNT(*) FROM teachers)::integer AS "totalTeachers",
      (SELECT COUNT(*) FROM quizzes WHERE status = 'published')::integer AS "totalQuizzes",
      (SELECT COUNT(*) FROM quiz_attempts)::integer AS "totalAttempts",
      (SELECT COUNT(*) FROM users WHERE is_active = true)::integer AS "activeUsers";
  `;
  const result = await query<PlatformStats>(sql);
  return result.rows[0]!;
}

