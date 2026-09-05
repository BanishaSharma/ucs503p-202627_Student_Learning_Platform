import {
  createStudentQuery,
  findQueriesByStudent,
  findQueriesForTeacher,
  findQueryById,
  findQueryResponses,
  addQueryResponse,
  updateQueryStatus
} from "../db/queries.js";
import { AppError } from "../middleware/errorHandler.js";
import type { CreateQueryInput } from "../schemas/query.schema.js";
import type { StudentQueryItem } from "../types/platform.types.js";
import type { AuthTokenPayload } from "../types/auth.types.js";

/**
 * Submit a new student doubt.
 */
export async function submitStudentQuery(
  studentId: number,
  classId: number,
  input: CreateQueryInput
): Promise<{ queryId: number }> {
  const queryId = await createStudentQuery(
    studentId,
    classId,
    input.subjectId ?? null,
    input.chapterId ?? null,
    input.title,
    input.description
  );
  return { queryId };
}

/**
 * Get queries accessible by current user (student sees own, teacher sees assigned classes).
 */
export async function getQueriesForUser(user: AuthTokenPayload): Promise<StudentQueryItem[]> {
  if (user.role === "student") {
    if (!user.studentId) {
      throw new AppError("Student profile not found.", 403);
    }
    return await findQueriesByStudent(user.studentId);
  } else if (user.role === "teacher") {
    if (!user.teacherId) {
      throw new AppError("Teacher profile not found.", 403);
    }
    return await findQueriesForTeacher(user.teacherId);
  } else if (user.role === "admin") {
    // Admin can view all queries
    return await findQueriesForTeacher(0);
  }
  return [];
}

/**
 * Get single query with full conversational responses.
 */
export async function getQueryDetails(queryId: number): Promise<StudentQueryItem> {
  const item = await findQueryById(queryId);
  if (!item) {
    throw new AppError(`Query with ID ${queryId} not found.`, 404);
  }
  const responses = await findQueryResponses(queryId);
  item.responses = responses;
  item.responseCount = responses.length;
  return item;
}

/**
 * Add a reply to a query thread.
 */
export async function replyToQuery(
  queryId: number,
  responderUserId: number,
  responseText: string
): Promise<{ responseId: number }> {
  const query = await findQueryById(queryId);
  if (!query) {
    throw new AppError(`Query with ID ${queryId} not found.`, 404);
  }
  const responseId = await addQueryResponse(queryId, responderUserId, responseText);
  return { responseId };
}

/**
 * Change status of a query (e.g. mark resolved).
 */
export async function setQueryStatus(
  queryId: number,
  status: "open" | "resolved"
): Promise<void> {
  const query = await findQueryById(queryId);
  if (!query) {
    throw new AppError(`Query with ID ${queryId} not found.`, 404);
  }
  await updateQueryStatus(queryId, status);
}
