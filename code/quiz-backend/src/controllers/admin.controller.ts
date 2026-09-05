import type { Request, Response } from "express";
import * as adminService from "../services/admin.service.js";
import {
  createTeacherAccountSchema,
  createStudentAccountSchema,
  updateUserStatusSchema,
  assignTeacherClassSchema
} from "../schemas/admin.schema.js";
import { positiveIntegerParamSchema } from "../schemas/quiz.schema.js";
import { sendSuccess } from "../utils/apiResponse.js";

/**
 * GET /api/admin/teachers
 */
export async function getTeachersHandler(_req: Request, res: Response): Promise<void> {
  const teachers = await adminService.getAllTeachers();
  sendSuccess(res, teachers);
}

/**
 * POST /api/admin/teachers
 */
export async function createTeacherHandler(req: Request, res: Response): Promise<void> {
  const input = createTeacherAccountSchema.parse(req.body);
  const result = await adminService.createTeacherAccount(input);
  sendSuccess(res, result, 201);
}

/**
 * PATCH /api/admin/users/:userId/status
 */
export async function updateUserStatusHandler(req: Request, res: Response): Promise<void> {
  const userId = positiveIntegerParamSchema.parse(req.params["userId"]);
  const input = updateUserStatusSchema.parse(req.body);
  await adminService.setUserStatus(userId, input.isActive);
  sendSuccess(res, { message: `User status updated to ${input.isActive ? "active" : "inactive"}.` });
}

/**
 * GET /api/admin/students
 */
export async function getStudentsHandler(_req: Request, res: Response): Promise<void> {
  const students = await adminService.getAllStudents();
  sendSuccess(res, students);
}

/**
 * POST /api/admin/students
 */
export async function createStudentHandler(req: Request, res: Response): Promise<void> {
  const input = createStudentAccountSchema.parse(req.body);
  const result = await adminService.createStudentAccount(input);
  sendSuccess(res, result, 201);
}

/**
 * POST /api/admin/assignments
 */
export async function assignTeacherHandler(req: Request, res: Response): Promise<void> {
  const input = assignTeacherClassSchema.parse(req.body);
  await adminService.assignTeacher(input);
  sendSuccess(res, { message: "Teacher assignment created successfully." }, 201);
}

/**
 * DELETE /api/admin/assignments
 */
export async function unassignTeacherHandler(req: Request, res: Response): Promise<void> {
  const input = assignTeacherClassSchema.parse(req.body);
  await adminService.unassignTeacher(input.teacherId, input.classId, input.subjectId);
  sendSuccess(res, { message: "Teacher assignment removed successfully." });
}

/**
 * GET /api/admin/stats
 */
export async function getStatsHandler(_req: Request, res: Response): Promise<void> {
  const stats = await adminService.getPlatformStats();
  sendSuccess(res, stats);
}
