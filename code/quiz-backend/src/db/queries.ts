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
      question_order AS "questionOrder" 
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
