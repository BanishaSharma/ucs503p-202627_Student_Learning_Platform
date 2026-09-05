// ============================================================
// ShikshaSetu Platform — TypeScript Domain Types & Interfaces
// ============================================================

export interface ClassItem {
  id: number;
  name: string;
}

export interface SubjectItem {
  id: number;
  classId: number;
  name: string;
}

export interface ChapterItem {
  id: number;
  subjectId: number;
  name: string;
}

export interface QuizItem {
  id: number;
  chapterId: number;
  title: string;
  description: string | null;
  durationMinutes: number;
  totalMarks: number;
  createdAt?: string | Date;
}

// Student-facing question shape — correct_answer is strictly omitted!
export interface StudentQuestionItem {
  id: number;
  quizId: number;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  questionOrder: number;
}

// Internal question shape used for scoring only
export interface InternalScoringQuestion {
  id: number;
  quizId: number;
  correctAnswer: "A" | "B" | "C" | "D";
}

// Answer submission unit
export interface SubmittedAnswer {
  questionId: number;
  selectedAnswer: "A" | "B" | "C" | "D";
}

// Payload sent by student to POST /api/quizzes/:quizId/attempts
export interface SubmitQuizAttemptPayload {
  studentId?: number | undefined;
  answers: SubmittedAnswer[];
}

// Computed score response returned to student
export interface QuizAttemptResult {
  attemptId: number;
  quizId: number;
  score: number;
  totalQuestions: number;
  percentage: number;
}

// Standard API response envelope
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}
