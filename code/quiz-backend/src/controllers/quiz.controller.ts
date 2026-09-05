import type { Request, Response } from "express";
import * as quizService from "../services/quiz.service.js";
import { positiveIntegerParamSchema, submitAttemptSchema } from "../schemas/quiz.schema.js";
import { sendSuccess } from "../utils/apiResponse.js";

/**
 * GET /api/classes
 */
export async function getClassesHandler(_req: Request, res: Response): Promise<void> {
  const classes = await quizService.getClasses();
  sendSuccess(res, classes);
}

/**
 * GET /api/classes/:classId/subjects
 */
export async function getSubjectsByClassHandler(req: Request, res: Response): Promise<void> {
  const classId = positiveIntegerParamSchema.parse(req.params["classId"]);
  const subjects = await quizService.getSubjectsByClass(classId);
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
  const quizzes = await quizService.getQuizzesByChapter(chapterId);
  sendSuccess(res, quizzes);
}

/**
 * GET /api/quizzes/:quizId/questions
 */
export async function getQuestionsForQuizHandler(req: Request, res: Response): Promise<void> {
  const quizId = positiveIntegerParamSchema.parse(req.params["quizId"]);
  const questions = await quizService.getQuestionsForQuiz(quizId);
  sendSuccess(res, questions);
}

/**
 * POST /api/quizzes/:quizId/attempts
 */
export async function submitQuizAttemptHandler(req: Request, res: Response): Promise<void> {
  const quizId = positiveIntegerParamSchema.parse(req.params["quizId"]);
  const payload = submitAttemptSchema.parse(req.body);
  const result = await quizService.submitQuizAttempt(quizId, payload.answers, payload.studentId);
  sendSuccess(res, result, 201);
}

/**
 * GET /api/attempts
 */
export async function getStudentAttemptsHandler(req: Request, res: Response): Promise<void> {
  const studentIdParam = req.query["studentId"] ? Number(req.query["studentId"]) : undefined;
  const attempts = await quizService.getStudentAttempts(studentIdParam);
  sendSuccess(res, attempts);
}

