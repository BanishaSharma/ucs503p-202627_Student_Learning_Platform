import { z } from "zod";

export const createTeacherAccountSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters."),
  email: z.string().trim().email("Valid email address is required."),
  password: z.string().min(6, "Password must be at least 6 characters."),
  employeeId: z.string().trim().min(2, "Employee ID is required."),
  qualification: z.string().optional().nullable(),
  assignments: z.array(z.object({
    classId: z.number().int().positive(),
    subjectId: z.number().int().positive()
  })).optional()
});

export const createStudentAccountSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters."),
  email: z.string().trim().email("Valid email address is required."),
  password: z.string().min(6, "Password must be at least 6 characters."),
  classId: z.number().int().positive("Assigned Class ID is required."),
  rollNumber: z.string().optional().nullable(),
  section: z.string().default("A")
});

export const updateUserStatusSchema = z.object({
  isActive: z.boolean()
});

export const assignTeacherClassSchema = z.object({
  teacherId: z.number().int().positive(),
  classId: z.number().int().positive(),
  subjectId: z.number().int().positive()
});

export type CreateTeacherAccountInput = z.infer<typeof createTeacherAccountSchema>;
export type CreateStudentAccountInput = z.infer<typeof createStudentAccountSchema>;
export type UpdateUserStatusInput = z.infer<typeof updateUserStatusSchema>;
export type AssignTeacherClassInput = z.infer<typeof assignTeacherClassSchema>;
