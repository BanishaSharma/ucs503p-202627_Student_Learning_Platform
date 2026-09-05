import type { Request, Response } from "express";
import * as quizService from "../services/quiz.service.js";
import { positiveIntegerParamSchema, submitAttemptSchema } from "../schemas/quiz.schema.js";
import { sendSuccess } from "../utils/apiResponse.js";

/**
 * GET /api/classes
 */
export async function getClassesHandler(req: Request, res: Response): Promise<void> {
  const studentClassId = req.user?.role === "student" ? req.user.classId : undefined;
  const classes = await quizService.getClasses(studentClassId);
  sendSuccess(res, classes);
}

/**
 * GET /api/classes/:classId/subjects
 */
export async function getSubjectsByClassHandler(req: Request, res: Response): Promise<void> {
  const classId = positiveIntegerParamSchema.parse(req.params["classId"]);
  const studentClassId = req.user?.role === "student" ? req.user.classId : undefined;
  const subjects = await quizService.getSubjectsByClass(classId, studentClassId);
  sendSuccess(res, subjects);
}

/**
 * GET /api/subjects/:subjectId/chapters
 */
export async function getChaptersBySubjectHandler(req: Request, res: Response): Promise<void> {
  const subjectId = positiveIntegerParamSchema.parse(req.params["subjectId"]);
  const chapters = await quizService.getChaptersBySubject(subjectId);
  sendSuccess(res, chapters);
}

/**
 * GET /api/chapters/:chapterId/quizzes
 */
export async function getQuizzesByChapterHandler(req: Request, res: Response): Promise<void> {
  const chapterId = positiveIntegerParamSchema.parse(req.params["chapterId"]);
  const studentClassId = req.user?.role === "student" ? req.user.classId : undefined;
  const quizzes = await quizService.getQuizzesByChapter(chapterId, studentClassId);
  sendSuccess(res, quizzes);
}

/**
 * GET /api/quizzes/:quizId/questions
 */
export async function getQuestionsForQuizHandler(req: Request, res: Response): Promise<void> {
  const quizId = positiveIntegerParamSchema.parse(req.params["quizId"]);
  const studentClassId = req.user?.role === "student" ? req.user.classId : undefined;
  const questions = await quizService.getQuestionsForQuiz(quizId, studentClassId);
  sendSuccess(res, questions);
}

/**
 * POST /api/quizzes/:quizId/attempts
 */
export async function submitQuizAttemptHandler(req: Request, res: Response): Promise<void> {
  const quizId = positiveIntegerParamSchema.parse(req.params["quizId"]);
  const payload = submitAttemptSchema.parse(req.body);

  // Authenticated student identity takes strict precedence over any client-submitted studentId
  const effectiveStudentId = req.user?.studentId || payload.studentId;
  const studentClassId = req.user?.role === "student" ? req.user.classId : undefined;

  const result = await quizService.submitQuizAttempt(quizId, payload.answers, effectiveStudentId, studentClassId);
  sendSuccess(res, result, 201);
}

/**
 * GET /api/attempts
 */
export async function getStudentAttemptsHandler(req: Request, res: Response): Promise<void> {
  // If authenticated as a student, lock attempts history strictly to that student
  let studentIdParam: number | undefined;
  if (req.user?.role === "student" && req.user.studentId) {
    studentIdParam = req.user.studentId;
  } else if (req.query["studentId"]) {
    studentIdParam = Number(req.query["studentId"]);
  }

  const attempts = await quizService.getStudentAttempts(studentIdParam);
  sendSuccess(res, attempts);
}

