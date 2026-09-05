export type UserRole = "admin" | "teacher" | "student";

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  studentId?: number;
  classId?: number;
  className?: string;
  teacherId?: number;
  employeeId?: string;
  qualification?: string;
}

export interface AuthTokenPayload {
  userId: number;
  email: string;
  role: UserRole;
  name: string;
  studentId?: number;
  classId?: number;
  teacherId?: number;
}

export interface LoginResult {
  token: string;
  user: AuthUser;
}
