import { Router } from "express";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { requireAuth, requireRole } from "../middleware/auth.middleware.js";
import {
  getTeachersHandler,
  createTeacherHandler,
  updateUserStatusHandler,
  getStudentsHandler,
  createStudentHandler,
  assignTeacherHandler,
  unassignTeacherHandler,
  getStatsHandler
} from "../controllers/admin.controller.js";

const router = Router();

// Restrict all routes to admin
router.use(asyncHandler(requireAuth));
router.use(requireRole("admin"));

router.get("/teachers", asyncHandler(getTeachersHandler));
router.post("/teachers", asyncHandler(createTeacherHandler));
router.patch("/users/:userId/status", asyncHandler(updateUserStatusHandler));

router.get("/students", asyncHandler(getStudentsHandler));
router.post("/students", asyncHandler(createStudentHandler));

router.post("/assignments", asyncHandler(assignTeacherHandler));
router.delete("/assignments", asyncHandler(unassignTeacherHandler));

router.get("/stats", asyncHandler(getStatsHandler));

export default router;
