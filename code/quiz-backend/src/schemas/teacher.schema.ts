import { z } from "zod";

export const questionInputSchema = z.object({
  questionText: z.string().min(1, "Question text is required."),
  optionA: z.string().min(1, "Option A is required."),
  optionB: z.string().min(1, "Option B is required."),
  optionC: z.string().min(1, "Option C is required."),
  optionD: z.string().min(1, "Option D is required."),
  correctAnswer: z.enum(["A", "B", "C", "D"] as const),
  questionOrder: z.number().int().positive().default(1),
  questionTextPa: z.string().optional().nullable(),
  optionAPa: z.string().optional().nullable(),
  optionBPa: z.string().optional().nullable(),
  optionCPa: z.string().optional().nullable(),
  optionDPa: z.string().optional().nullable()
});

export const createQuizSchema = z.object({
  chapterId: z.number().int().positive("Valid chapter ID is required."),
  title: z.string().trim().min(3, "Title must be at least 3 characters.").max(200),
  description: z.string().optional().nullable(),
  durationMinutes: z.number().int().positive().default(15),
  totalMarks: z.number().int().positive().default(5),
  status: z.enum(["draft", "published", "archived"] as const).default("published"),
  questions: z.array(questionInputSchema).min(1, "Quiz must contain at least one question.")
});

export const updateQuizSchema = z.object({
  title: z.string().trim().min(3).max(200).optional(),
  description: z.string().optional().nullable(),
  durationMinutes: z.number().int().positive().optional(),
  totalMarks: z.number().int().positive().optional(),
  status: z.enum(["draft", "published", "archived"] as const).optional(),
  questions: z.array(questionInputSchema).optional()
});

export type CreateQuizInput = z.infer<typeof createQuizSchema>;
export type UpdateQuizInput = z.infer<typeof updateQuizSchema>;
export type QuestionInput = z.infer<typeof questionInputSchema>;
