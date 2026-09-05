import { z } from "zod";

/**
 * Validates a positive integer route parameter (e.g. :classId, :subjectId, :chapterId, :quizId).
 */
export const positiveIntegerParamSchema = z
  .string({ message: "Parameter is required" })
  .regex(/^\d+$/, "Parameter must be an integer string")
  .transform((val) => parseInt(val, 10))
  .refine((val) => val > 0, { message: "Parameter must be a positive integer" });

/**
 * Validates each submitted answer object.
 */
export const submittedAnswerSchema = z.object({
  questionId: z
    .number({ message: "questionId is required" })
    .int("questionId must be an integer")
    .positive("questionId must be a positive integer"),
  selectedAnswer: z.enum(["A", "B", "C", "D"] as const)
});

/**
 * Validates the request body for POST /api/quizzes/:quizId/attempts.
 * Ignores any client-submitted score or extra fields.
 */
export const submitAttemptSchema = z.object({
  studentId: z.number().int().positive().optional(),
  answers: z.array(submittedAnswerSchema).default([])
});

export type SubmitAttemptInput = z.infer<typeof submitAttemptSchema>;
