import { z } from "zod";

export const createQuerySchema = z.object({
  subjectId: z.number().int().positive().optional().nullable(),
  chapterId: z.number().int().positive().optional().nullable(),
  title: z.string().trim().min(5, "Title must be at least 5 characters.").max(200),
  description: z.string().trim().min(10, "Please provide more details in your question.")
});

export const addResponseSchema = z.object({
  responseText: z.string().trim().min(1, "Response cannot be empty.")
});

export const updateStatusSchema = z.object({
  status: z.enum(["open", "resolved"] as const)
});

export type CreateQueryInput = z.infer<typeof createQuerySchema>;
export type AddResponseInput = z.infer<typeof addResponseSchema>;
export type UpdateStatusInput = z.infer<typeof updateStatusSchema>;
