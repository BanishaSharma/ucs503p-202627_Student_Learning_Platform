import type { Request, Response } from "express";
import * as queryService from "../services/query.service.js";
import { createQuerySchema, addResponseSchema, updateStatusSchema } from "../schemas/query.schema.js";
import { positiveIntegerParamSchema } from "../schemas/quiz.schema.js";
import { sendSuccess } from "../utils/apiResponse.js";
import { AppError } from "../middleware/errorHandler.js";

/**
 * POST /api/queries
 */
export async function createQueryHandler(req: Request, res: Response): Promise<void> {
  const user = req.user!;
  if (user.role !== "student" || !user.studentId || !user.classId) {
    throw new AppError("Only authorized students can submit queries.", 403);
  }

  const input = createQuerySchema.parse(req.body);
  const result = await queryService.submitStudentQuery(user.studentId, user.classId, input);
  sendSuccess(res, result, 201);
}

/**
 * GET /api/queries
 */
export async function getQueriesHandler(req: Request, res: Response): Promise<void> {
  const user = req.user!;
  const queries = await queryService.getQueriesForUser(user);
  sendSuccess(res, queries);
}

/**
 * GET /api/queries/:queryId
 */
export async function getQueryDetailsHandler(req: Request, res: Response): Promise<void> {
  const queryId = positiveIntegerParamSchema.parse(req.params["queryId"]);
  const details = await queryService.getQueryDetails(queryId);
  sendSuccess(res, details);
}

/**
 * POST /api/queries/:queryId/responses
 */
export async function replyToQueryHandler(req: Request, res: Response): Promise<void> {
  const queryId = positiveIntegerParamSchema.parse(req.params["queryId"]);
  const input = addResponseSchema.parse(req.body);
  const userId = req.user!.userId;
  const result = await queryService.replyToQuery(queryId, userId, input.responseText);
  sendSuccess(res, result, 201);
}

/**
 * PATCH /api/queries/:queryId/status
 */
export async function updateStatusHandler(req: Request, res: Response): Promise<void> {
  const queryId = positiveIntegerParamSchema.parse(req.params["queryId"]);
  const input = updateStatusSchema.parse(req.body);
  await queryService.setQueryStatus(queryId, input.status);
  sendSuccess(res, { message: `Query status updated to '${input.status}'.` });
}
