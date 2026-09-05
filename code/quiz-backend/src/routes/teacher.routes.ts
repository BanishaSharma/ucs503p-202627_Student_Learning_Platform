import { Router } from "express";
import multer from "multer";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { requireAuth, requireRole } from "../middleware/auth.middleware.js";
import {
  getAssignedClassesHandler,
  getTeacherQuizzesHandler,
  getQuizForEditingHandler,
  createQuizHandler,
  updateQuizHandler,
  deleteQuizHandler,
  importExcelHandler,
  getTeacherResultsHandler
} from "../controllers/teacher.controller.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB max
});

const router = Router();

// Protect all teacher endpoints
router.use(asyncHandler(requireAuth));
router.use(requireRole("teacher", "admin"));

router.get("/classes", asyncHandler(getAssignedClassesHandler));
router.get("/quizzes", asyncHandler(getTeacherQuizzesHandler));
router.get("/quizzes/:quizId", asyncHandler(getQuizForEditingHandler));
router.post("/quizzes", asyncHandler(createQuizHandler));
router.put("/quizzes/:quizId", asyncHandler(updateQuizHandler));
router.patch("/quizzes/:quizId", asyncHandler(updateQuizHandler));
router.patch("/quizzes/:quizId/publish", asyncHandler(async (req, res) => {
  req.body = { ...req.body, status: "published" };
  await updateQuizHandler(req, res);
}));
router.delete("/quizzes/:quizId", asyncHandler(deleteQuizHandler));
router.post("/quizzes/import-excel", upload.single("file"), asyncHandler(importExcelHandler));
router.post("/quizzes/upload-excel", upload.single("file"), asyncHandler(importExcelHandler));
router.get("/results", asyncHandler(getTeacherResultsHandler));

export default router;
