import type { Request, Response } from "express";
import * as teacherService from "../services/teacher.service.js";
import { importQuestionsFromExcel } from "../services/excelImport.service.js";
import { createQuizSchema, updateQuizSchema } from "../schemas/teacher.schema.js";
import { positiveIntegerParamSchema } from "../schemas/quiz.schema.js";
import { sendSuccess } from "../utils/apiResponse.js";
import { AppError } from "../middleware/errorHandler.js";

/**
 * GET /api/teacher/classes
 */
export async function getAssignedClassesHandler(req: Request, res: Response): Promise<void> {
  const teacherId = req.user?.teacherId;
  if (!teacherId) {
    throw new AppError("Teacher profile not associated with this account.", 403);
  }
  const classes = await teacherService.getAssignedClasses(teacherId);
  sendSuccess(res, classes);
}

/**
 * GET /api/teacher/quizzes
 */
export async function getTeacherQuizzesHandler(req: Request, res: Response): Promise<void> {
  const userId = req.user!.userId;
  const quizzes = await teacherService.getTeacherQuizzes(userId);
  sendSuccess(res, quizzes);
}

/**
 * GET /api/teacher/quizzes/:quizId
 */
export async function getQuizForEditingHandler(req: Request, res: Response): Promise<void> {
  const quizId = positiveIntegerParamSchema.parse(req.params["quizId"]);
  const result = await teacherService.getQuizForEditing(quizId);
  sendSuccess(res, result);
}

/**
 * POST /api/teacher/quizzes
 */
export async function createQuizHandler(req: Request, res: Response): Promise<void> {
  const userId = req.user!.userId;
  const input = createQuizSchema.parse(req.body);
  const result = await teacherService.createTeacherQuiz(userId, input);
  sendSuccess(res, result, 201);
}

/**
 * PUT /api/teacher/quizzes/:quizId
 */
export async function updateQuizHandler(req: Request, res: Response): Promise<void> {
  const quizId = positiveIntegerParamSchema.parse(req.params["quizId"]);
  const input = updateQuizSchema.parse(req.body);
  await teacherService.updateTeacherQuiz(quizId, input);
  sendSuccess(res, { message: "Quiz updated successfully." });
}

/**
 * DELETE /api/teacher/quizzes/:quizId
 */
export async function deleteQuizHandler(req: Request, res: Response): Promise<void> {
  const quizId = positiveIntegerParamSchema.parse(req.params["quizId"]);
  await teacherService.deleteTeacherQuiz(quizId);
  sendSuccess(res, { message: "Quiz deleted successfully." });
}

/**
 * POST /api/teacher/quizzes/import-excel
 */
export async function importExcelHandler(req: Request, res: Response): Promise<void> {
  if (!req.file || !req.file.buffer) {
    throw new AppError("Please upload a valid .xlsx Excel file.", 400);
  }
  const userId = req.user!.userId;
  const chapterId = req.body.chapterId ? Number(req.body.chapterId) : undefined;
  const title = req.body.title ? String(req.body.title) : undefined;
  const durationMinutes = req.body.durationMinutes ? Number(req.body.durationMinutes) : undefined;

  const result = await importQuestionsFromExcel(req.file.buffer, userId, {
    chapterId,
    title,
    durationMinutes
  });
  sendSuccess(res, result, 201);
}

/**
 * GET /api/teacher/results
 */
export async function getTeacherResultsHandler(req: Request, res: Response): Promise<void> {
  const teacherId = req.user?.teacherId;
  if (!teacherId) {
    throw new AppError("Teacher profile not associated with this account.", 403);
  }
  const results = await teacherService.getTeacherResultsData(teacherId);
  sendSuccess(res, results);
}
