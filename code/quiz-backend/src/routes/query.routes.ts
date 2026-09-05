import { Router } from "express";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import {
  createQueryHandler,
  getQueriesHandler,
  getQueryDetailsHandler,
  replyToQueryHandler,
  updateStatusHandler
} from "../controllers/query.controller.js";

const router = Router();

router.use(asyncHandler(requireAuth));

router.post("/", asyncHandler(createQueryHandler));
router.get("/", asyncHandler(getQueriesHandler));
router.get("/:queryId", asyncHandler(getQueryDetailsHandler));
router.post("/:queryId/responses", asyncHandler(replyToQueryHandler));
router.patch("/:queryId/status", asyncHandler(updateStatusHandler));

export default router;
