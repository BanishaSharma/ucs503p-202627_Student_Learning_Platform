import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().trim().email("Please provide a valid email address."),
  password: z.string().min(1, "Password is required.")
});

export const studentRegisterSchema = z.object({
  name: z.string().trim().min(2, "Full name must be at least 2 characters.").max(100),
  email: z.string().trim().email("Please provide a valid official school email address."),
  classId: z.number().int().positive("Please select a valid class tier."),
  rollNumber: z.string().trim().min(1, "Roll number is required.").max(50),
  section: z.string().trim().max(10).default("A"),
  password: z.string().min(8, "Password must be at least 8 characters.")
});

export const verifyEmailSchema = z.object({
  token: z.string().trim().min(1, "Verification token is required.")
});

export const resendVerificationSchema = z.object({
  email: z.string().trim().email("Please provide a valid email address.")
});

export const acceptTeacherInviteSchema = z.object({
  token: z.string().trim().min(1, "Invitation token is required."),
  password: z.string().min(8, "Password must be at least 8 characters.")
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required."),
  newPassword: z.string().min(8, "New password must be at least 8 characters.")
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email("Please provide a valid email address.")
});

export const resetPasswordSchema = z.object({
  token: z.string().trim().min(1, "Reset token is required."),
  newPassword: z.string().min(8, "New password must be at least 8 characters.")
});

export type LoginInput = z.infer<typeof loginSchema>;
export type StudentRegisterInput = z.infer<typeof studentRegisterSchema>;
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;
export type ResendVerificationInput = z.infer<typeof resendVerificationSchema>;
export type AcceptTeacherInviteInput = z.infer<typeof acceptTeacherInviteSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
