import {
  findTeacherAssignedClasses,
  findTeacherQuizzes,
  findQuizById,
  findQuizQuestionsForTeacher,
  createQuiz,
  createQuestion,
  deleteQuestionsByQuizId,
  updateQuiz,
  deleteQuiz,
  findTeacherResults,
  findChapterById
} from "../db/queries.js";
import { getClient } from "../db/index.js";
import { AppError } from "../middleware/errorHandler.js";
import type { CreateQuizInput, UpdateQuizInput } from "../schemas/teacher.schema.js";
import type { TeacherAssignedClass, TeacherQuizSummary, QuestionDetail, TeacherStudentResult } from "../types/platform.types.js";

/**
 * Get classes and subjects assigned to a teacher.
 */
export async function getAssignedClasses(teacherId: number): Promise<TeacherAssignedClass[]> {
  return await findTeacherAssignedClasses(teacherId);
}

/**
 * Get quizzes created by a teacher.
 */
export async function getTeacherQuizzes(teacherUserId: number): Promise<TeacherQuizSummary[]> {
  return await findTeacherQuizzes(teacherUserId);
}

/**
 * Get complete quiz details including questions for teacher editing.
 */
export async function getQuizForEditing(quizId: number): Promise<{ quiz: any; questions: QuestionDetail[] }> {
  const quiz = await findQuizById(quizId);
  if (!quiz) {
    throw new AppError(`Quiz with ID ${quizId} not found.`, 404);
  }
  const questions = await findQuizQuestionsForTeacher(quizId);
  return { quiz, questions };
}

/**
 * Create a new quiz with questions within an atomic database transaction.
 */
export async function createTeacherQuiz(
  teacherUserId: number,
  input: CreateQuizInput
): Promise<{ quizId: number }> {
  const chapter = await findChapterById(input.chapterId);
  if (!chapter) {
    throw new AppError(`Chapter with ID ${input.chapterId} not found.`, 404);
  }

  const client = await getClient();
  try {
    await client.query("BEGIN;");

    const quizId = await createQuiz(client, {
      chapterId: input.chapterId,
      title: input.title,
      description: input.description ?? null,
      durationMinutes: input.durationMinutes,
      totalMarks: input.totalMarks,
      createdBy: teacherUserId,
      status: input.status
    });

    for (let i = 0; i < input.questions.length; i++) {
      const q = input.questions[i]!;
      await createQuestion(client, {
        quizId,
        questionText: q.questionText,
        optionA: q.optionA,
        optionB: q.optionB,
        optionC: q.optionC,
        optionD: q.optionD,
        correctAnswer: q.correctAnswer,
        questionOrder: q.questionOrder || i + 1,
        questionTextPa: q.questionTextPa,
        optionAPa: q.optionAPa,
        optionBPa: q.optionBPa,
        optionCPa: q.optionCPa,
        optionDPa: q.optionDPa
      });
    }

    await client.query("COMMIT;");
    return { quizId };
  } catch (err) {
    await client.query("ROLLBACK;");
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Update quiz metadata and optionally its question set.
 */
export async function updateTeacherQuiz(
  quizId: number,
  input: UpdateQuizInput
): Promise<void> {
  const existingQuiz = await findQuizById(quizId);
  if (!existingQuiz) {
    throw new AppError(`Quiz with ID ${quizId} not found.`, 404);
  }

  if (input.questions && input.questions.length > 0) {
    const client = await getClient();
    try {
      await client.query("BEGIN;");

      await updateQuiz(quizId, {
        title: input.title,
        description: input.description,
        durationMinutes: input.durationMinutes,
        totalMarks: input.totalMarks,
        status: input.status
      });

      await deleteQuestionsByQuizId(client, quizId);

      for (let i = 0; i < input.questions.length; i++) {
        const q = input.questions[i]!;
        await createQuestion(client, {
          quizId,
          questionText: q.questionText,
          optionA: q.optionA,
          optionB: q.optionB,
          optionC: q.optionC,
          optionD: q.optionD,
          correctAnswer: q.correctAnswer,
          questionOrder: q.questionOrder || i + 1,
          questionTextPa: q.questionTextPa,
          optionAPa: q.optionAPa,
          optionBPa: q.optionBPa,
          optionCPa: q.optionCPa,
          optionDPa: q.optionDPa
        });
      }

      await client.query("COMMIT;");
    } catch (err) {
      await client.query("ROLLBACK;");
      throw err;
    } finally {
      client.release();
    }
  } else {
    await updateQuiz(quizId, {
      title: input.title,
      description: input.description,
      durationMinutes: input.durationMinutes,
      totalMarks: input.totalMarks,
      status: input.status
    });
  }
}

/**
 * Delete a quiz.
 */
export async function deleteTeacherQuiz(quizId: number): Promise<void> {
  const existingQuiz = await findQuizById(quizId);
  if (!existingQuiz) {
    throw new AppError(`Quiz with ID ${quizId} not found.`, 404);
  }
  await deleteQuiz(quizId);
}

/**
 * Get student results for teacher's assigned classes.
 */
export async function getTeacherResultsData(teacherId: number): Promise<TeacherStudentResult[]> {
  return await findTeacherResults(teacherId);
}
