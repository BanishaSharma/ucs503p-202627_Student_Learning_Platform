import { Router } from "express";
import { asyncHandler } from "../middleware/asyncHandler.js";
import {
  getClassesHandler,
  getSubjectsByClassHandler,
  getChaptersBySubjectHandler,
  getQuizzesByChapterHandler,
  getQuestionsForQuizHandler,
  submitQuizAttemptHandler
} from "../controllers/quiz.controller.js";

const router = Router();

// Browsing Hierarchy Endpoints
router.get("/classes", asyncHandler(getClassesHandler));
router.get("/classes/:classId/subjects", asyncHandler(getSubjectsByClassHandler));
router.get("/subjects/:subjectId/chapters", asyncHandler(getChaptersBySubjectHandler));
router.get("/chapters/:chapterId/quizzes", asyncHandler(getQuizzesByChapterHandler));
router.get("/quizzes/:quizId/questions", asyncHandler(getQuestionsForQuizHandler));

// Quiz Submission & Evaluation Endpoint
router.post("/quizzes/:quizId/attempts", asyncHandler(submitQuizAttemptHandler));

export default router;
