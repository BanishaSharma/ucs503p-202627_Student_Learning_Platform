import type { Request, Response } from "express";
import * as adminService from "../services/admin.service.js";
import {
  createTeacherAccountSchema,
  updateTeacherAccountSchema,
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
  const result = await adminService.createTeacherAccount(input, req.user?.userId, req.ip);
  sendSuccess(res, result, 201);
}

/**
 * PUT /api/admin/teachers/:teacherId
 */
export async function editTeacherHandler(req: Request, res: Response): Promise<void> {
  const teacherId = positiveIntegerParamSchema.parse(req.params["teacherId"]);
  const input = updateTeacherAccountSchema.parse(req.body);
  await adminService.editTeacher(teacherId, input, req.user?.userId, req.ip);
  sendSuccess(res, { message: "Teacher updated successfully." });
}

/**
 * PATCH /api/admin/users/:userId/status
 */
export async function updateUserStatusHandler(req: Request, res: Response): Promise<void> {
  const userId = positiveIntegerParamSchema.parse(req.params["userId"]);
  const input = updateUserStatusSchema.parse(req.body);
  await adminService.setUserStatus(userId, input.isActive, req.user?.userId, req.ip);
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
  const result = await adminService.createStudentAccount(input, req.user?.userId, req.ip);
  sendSuccess(res, result, 201);
}

/**
 * POST /api/admin/assignments (and /api/admin/teachers/:teacherId/assignments)
 */
export async function assignTeacherHandler(req: Request, res: Response): Promise<void> {
  const teacherId = req.params["teacherId"] ? Number(req.params["teacherId"]) : req.body?.teacherId;
  const input = assignTeacherClassSchema.parse({ ...req.body, teacherId });
  await adminService.assignTeacher(input, req.user?.userId, req.ip);
  sendSuccess(res, { message: "Teacher assignment created successfully." }, 201);
}

/**
 * DELETE /api/admin/assignments (and /api/admin/teachers/:teacherId/assignments)
 */
export async function unassignTeacherHandler(req: Request, res: Response): Promise<void> {
  const teacherId = req.params["teacherId"] ? Number(req.params["teacherId"]) : req.body?.teacherId;
  const input = assignTeacherClassSchema.parse({ ...req.body, teacherId });
  await adminService.unassignTeacher(input.teacherId, input.classId, input.subjectId, req.user?.userId, req.ip);
  sendSuccess(res, { message: "Teacher assignment removed successfully." });
}

/**
 * GET /api/admin/stats
 */
export async function getStatsHandler(_req: Request, res: Response): Promise<void> {
  const stats = await adminService.getPlatformStats();
  sendSuccess(res, stats);
}

/**
 * GET /api/admin/audit-logs
 */
export async function getAuditLogsHandler(req: Request, res: Response): Promise<void> {
  const limitParam = req.query["limit"];
  const limit = limitParam ? parseInt(String(limitParam), 10) : 100;
  const logs = await adminService.getAuditLogs(limit);
  sendSuccess(res, logs);
}

