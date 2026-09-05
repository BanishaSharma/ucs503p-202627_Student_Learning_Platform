import type { UserRole } from "./auth.types.js";

export interface TeacherAssignedClass {
  classId: number;
  className: string;
  subjectId: number;
  subjectName: string;
}

export interface TeacherQuizSummary {
  id: number;
  title: string;
  description: string | null;
  durationMinutes: number;
  totalMarks: number;
  status: "draft" | "published" | "archived";
  chapterId: number;
  chapterName: string;
  subjectId: number;
  subjectName: string;
  classId: number;
  className: string;
  questionCount: number;
  totalAttempts: number;
  avgScorePercentage: number;
  createdAt: string;
}

export interface QuestionDetail {
  id?: number;
  quizId?: number;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: "A" | "B" | "C" | "D";
  questionOrder?: number;
  questionTextPa?: string | null;
  optionAPa?: string | null;
  optionBPa?: string | null;
  optionCPa?: string | null;
  optionDPa?: string | null;
}

export interface TeacherStudentResult {
  attemptId: number;
  studentId: number;
  studentName: string;
  studentEmail: string;
  rollNumber: string | null;
  section: string | null;
  className: string;
  subjectName: string;
  quizTitle: string;
  score: number;
  totalQuestions: number;
  percentage: number;
  attemptedAt: string;
}

export interface StudentQueryItem {
  id: number;
  studentId: number;
  studentName: string;
  classId: number;
  className: string;
  subjectId: number | null;
  subjectName: string | null;
  chapterId: number | null;
  chapterName: string | null;
  title: string;
  description: string;
  status: "open" | "resolved";
  createdAt: string;
  updatedAt: string;
  responseCount: number;
  responses?: QueryResponseItem[];
}

export interface QueryResponseItem {
  id: number;
  queryId: number;
  responderId: number;
  responderName: string;
  responderRole: UserRole;
  responseText: string;
  createdAt: string;
}

export interface AdminTeacherItem {
  id: number;
  userId: number;
  name: string;
  email: string;
  isActive: boolean;
  employeeId: string | null;
  qualification: string | null;
  assignedClasses: {
    classId: number;
    className: string;
    subjectId: number;
    subjectName: string;
  }[];
  createdAt: string;
}

export interface AdminStudentItem {
  id: number;
  userId: number;
  name: string;
  email: string;
  isActive: boolean;
  classId: number;
  className: string;
  rollNumber: string | null;
  section: string | null;
  createdAt: string;
}

export interface PlatformStats {
  totalStudents: number;
  totalTeachers: number;
  totalQuizzes: number;
  totalAttempts: number;
  activeUsers: number;
}
