import {
  findClasses,
  findClassById,
  findSubjectsByClassId,
  findSubjectById,
  findChaptersBySubjectId,
  findChapterById,
  findQuizzesByChapterId,
  findQuizById,
  findQuestionsByQuizId,
  findQuestionsForScoring,
  insertQuizAttempt,
  insertAttemptAnswer,
  findStudentAttempts,
  findQuizzesForStudent,
  findQuizClassId
} from "../db/queries.js";
import { getClient } from "../db/index.js";
import { AppError } from "../middleware/errorHandler.js";
import type {
  ClassItem,
  SubjectItem,
  ChapterItem,
  QuizItem,
  StudentQuestionItem,
  SubmittedAnswer,
  QuizAttemptResult,
  EvaluatedAnswerResult,
  StudentAttemptHistoryItem
} from "../types/quiz.types.js";

/**
 * Retrieve all classes, optionally scoped to a student's assigned class.
 */
export async function getClasses(studentClassId?: number): Promise<ClassItem[]> {
  if (studentClassId) {
    const singleClass = await findClassById(studentClassId);
    return singleClass ? [singleClass] : [];
  }
  return await findClasses();
}

/**
 * Retrieve subjects belonging to a class with student enrollment enforcement.
 */
export async function getSubjectsByClass(classId: number, studentClassId?: number): Promise<SubjectItem[]> {
  if (studentClassId && studentClassId !== classId) {
    throw new AppError("Access restricted: You may only access content for your enrolled class.", 403);
  }
  const classRecord = await findClassById(classId);
  if (!classRecord) {
    throw new AppError(`Class with ID ${classId} not found`, 404);
  }
  return await findSubjectsByClassId(classId);
}

/**
 * Retrieve chapters belonging to a subject.
 */
export async function getChaptersBySubject(subjectId: number): Promise<ChapterItem[]> {
  const subjectRecord = await findSubjectById(subjectId);
  if (!subjectRecord) {
    throw new AppError(`Subject with ID ${subjectId} not found`, 404);
  }
  return await findChaptersBySubjectId(subjectId);
}

/**
 * Retrieve quizzes belonging to a chapter.
 * If studentClassId is provided, returns only published quizzes for the student's class.
 */
export async function getQuizzesByChapter(chapterId: number, studentClassId?: number): Promise<QuizItem[]> {
  const chapterRecord = await findChapterById(chapterId);
  if (!chapterRecord) {
    throw new AppError(`Chapter with ID ${chapterId} not found`, 404);
  }
  if (studentClassId !== undefined) {
    return await findQuizzesForStudent(chapterId, studentClassId);
  }
  return await findQuizzesByChapterId(chapterId);
}

/**
 * Retrieve questions for students to take a quiz.
 * SECURITY: Correct answers are never returned.
 */
export async function getQuestionsForQuiz(quizId: number): Promise<StudentQuestionItem[]> {
  const quizRecord = await findQuizById(quizId);
  if (!quizRecord) {
    throw new AppError(`Quiz with ID ${quizId} not found`, 404);
  }
  return await findQuestionsByQuizId(quizId);
}

/**
 * Evaluates and scores a submitted quiz attempt server-side within a database transaction.
 * Ignores any client-submitted score fields.
 * Enforces that students can only submit attempts for quizzes in their assigned class.
 */
export async function submitQuizAttempt(
  quizId: number,
  answers: SubmittedAnswer[],
  studentId?: number,
  studentClassId?: number
): Promise<QuizAttemptResult> {
  const quizRecord = await findQuizById(quizId);
  if (!quizRecord) {
    throw new AppError(`Quiz with ID ${quizId} not found`, 404);
  }

  // Validate student class authorization
  if (studentClassId !== undefined) {
    const quizClassId = await findQuizClassId(quizId);
    if (quizClassId && quizClassId !== studentClassId) {
      throw new AppError("Forbidden: You are not authorized to attempt quizzes outside your assigned class.", 403);
    }
  }

  // Fetch official correct answers from database
  const scoringQuestions = await findQuestionsForScoring(quizId);
  if (scoringQuestions.length === 0) {
    throw new AppError("Quiz has no questions configured for evaluation", 400);
  }

  // Map question IDs to their true correct answers
  const correctMap = new Map<number, "A" | "B" | "C" | "D">();
  for (const q of scoringQuestions) {
    correctMap.set(q.id, q.correctAnswer);
  }

  // Ensure submitted answers only contain valid questions for this quiz
  const seenQuestionIds = new Set<number>();
  for (const ans of answers) {
    if (!correctMap.has(ans.questionId)) {
      throw new AppError(
        `Question ID ${ans.questionId} does not belong to quiz ID ${quizId}`,
        400
      );
    }
    if (seenQuestionIds.has(ans.questionId)) {
      throw new AppError(
        `Duplicate answer submitted for question ID ${ans.questionId}`,
        400
      );
    }
    seenQuestionIds.add(ans.questionId);
  }

  // Server-side scoring calculation
  let score = 0;
  const evaluatedAnswers: EvaluatedAnswerResult[] = [];

  for (const ans of answers) {
    const trueAnswer = correctMap.get(ans.questionId)!;
    const isCorrect = ans.selectedAnswer === trueAnswer;
    if (isCorrect) {
      score += 1;
    }
    evaluatedAnswers.push({
      questionId: ans.questionId,
      selectedAnswer: ans.selectedAnswer,
      correctAnswer: trueAnswer,
      isCorrect
    });
  }

  const totalQuestions = scoringQuestions.length;

  // Persist attempt and individual answers within an atomic transaction
  const client = await getClient();
  try {
    await client.query("BEGIN");

    const attemptId = await insertQuizAttempt(
      client,
      quizId,
      studentId ?? null,
      score,
      totalQuestions
    );

    for (const evaluated of evaluatedAnswers) {
      await insertAttemptAnswer(
        client,
        attemptId,
        evaluated.questionId,
        evaluated.selectedAnswer,
        evaluated.isCorrect
      );
    }

    await client.query("COMMIT");

    return {
      attemptId,
      quizId,
      score,
      totalQuestions,
      percentage: totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0,
      answers: evaluatedAnswers
    };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Retrieve student quiz attempts history with curriculum metadata.
 */
export async function getStudentAttempts(studentId?: number): Promise<StudentAttemptHistoryItem[]> {
  return await findStudentAttempts(studentId);
}
