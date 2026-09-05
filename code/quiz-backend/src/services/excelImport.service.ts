import * as xlsx from "xlsx";
import { getClient, query } from "../db/index.js";
import { createQuiz, createQuestion } from "../db/queries.js";
import { AppError } from "../middleware/errorHandler.js";

export interface ExcelImportResult {
  importedCount: number;
  questionCount: number;
  failedCount: number;
  errors: { row: number; reason: string }[];
  quizId?: number;
}

interface ExcelRow {
  class?: string | number;
  subject?: string;
  chapter?: string;
  chapter_id?: string | number;
  quiz_title?: string;
  quiz_description?: string;
  duration_minutes?: string | number;
  question?: string;
  question_text?: string;
  option_a?: string | number;
  option_b?: string | number;
  option_c?: string | number;
  option_d?: string | number;
  correct_answer?: string;
  question_order?: string | number;
  question_pa?: string;
  question_text_pa?: string;
  option_a_pa?: string | number;
  option_b_pa?: string | number;
  option_c_pa?: string | number;
  option_d_pa?: string | number;
}

export interface ExcelImportOptions {
  chapterId?: number;
  title?: string;
  durationMinutes?: number;
}

/**
 * Parses and transactionally imports quiz questions from an uploaded Excel file.
 */
export async function importQuestionsFromExcel(
  fileBuffer: Buffer,
  teacherUserId: number,
  fallbackOptions?: ExcelImportOptions
): Promise<ExcelImportResult> {
  const workbook = xlsx.read(fileBuffer, { type: "buffer" });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    throw new AppError("The uploaded Excel workbook contains no sheets.", 400);
  }

  const sheet = workbook.Sheets[sheetName]!;
  const rawRows: ExcelRow[] = xlsx.utils.sheet_to_json(sheet, { defval: "" });

  if (!rawRows || rawRows.length === 0) {
    throw new AppError("The Excel sheet is empty. Please add questions to import.", 400);
  }

  const errors: { row: number; reason: string }[] = [];
  const validRows: {
    chapterId: number;
    quizTitle: string;
    quizDescription: string | null;
    durationMinutes: number;
    questionText: string;
    optionA: string;
    optionB: string;
    optionC: string;
    optionD: string;
    correctAnswer: "A" | "B" | "C" | "D";
    questionOrder: number;
    questionTextPa?: string;
    optionAPa?: string;
    optionBPa?: string;
    optionCPa?: string;
    optionDPa?: string;
  }[] = [];

  // Pre-load all chapters with subject and class metadata for fast fuzzy/case-insensitive matching
  const chaptersLookup = await query<{
    chapterId: number;
    chapterName: string;
    subjectName: string;
    className: string;
  }>(`
    SELECT 
      ch.id AS "chapterId", 
      LOWER(ch.name) AS "chapterName", 
      LOWER(s.name) AS "subjectName", 
      LOWER(c.name) AS "className"
    FROM chapters ch
    JOIN subjects s ON ch.subject_id = s.id
    JOIN classes c ON s.class_id = c.id;
  `);

  for (let i = 0; i < rawRows.length; i++) {
    const rowNum = i + 2; // Row 1 is header, data starts at Row 2
    const row = rawRows[i]!;

    const className = String(row.class || "").trim().toLowerCase();
    const subjectName = String(row.subject || "").trim().toLowerCase();
    const chapterName = String(row.chapter || "").trim().toLowerCase();
    const quizTitle = String(row.quiz_title || fallbackOptions?.title || "").trim();
    const questionText = String(row.question || row.question_text || "").trim();
    const optionA = String(row.option_a || "").trim();
    const optionB = String(row.option_b || "").trim();
    const optionC = String(row.option_c || "").trim();
    const optionD = String(row.option_d || "").trim();
    const rawCorrect = String(row.correct_answer || "").trim().toUpperCase();

    if (!questionText) {
      errors.push({ row: rowNum, reason: "Missing question text" });
      continue;
    }
    if (!optionA || !optionB || !optionC || !optionD) {
      errors.push({ row: rowNum, reason: "All four options (option_a, option_b, option_c, option_d) must be filled" });
      continue;
    }
    if (!["A", "B", "C", "D"].includes(rawCorrect)) {
      errors.push({ row: rowNum, reason: `Invalid correct_answer '${rawCorrect}'. Must be one of A, B, C, or D` });
      continue;
    }

    let targetChapterId: number | undefined;
    if (chapterName) {
      const matchedChapter = chaptersLookup.rows.find((c) => {
        const matchChap = c.chapterName.includes(chapterName) || chapterName.includes(c.chapterName);
        if (className && subjectName) {
          return matchChap && c.className.includes(className) && c.subjectName.includes(subjectName);
        }
        return matchChap;
      });
      if (matchedChapter) {
        targetChapterId = matchedChapter.chapterId;
      }
    }

    if (!targetChapterId && (row.chapter_id || fallbackOptions?.chapterId)) {
      targetChapterId = Number(row.chapter_id || fallbackOptions?.chapterId);
    }

    if (!targetChapterId) {
      errors.push({
        row: rowNum,
        reason: `Could not determine target chapter for question row ${rowNum}`
      });
      continue;
    }

    const duration = Number(row.duration_minutes || fallbackOptions?.durationMinutes) || 15;
    const order = Number(row.question_order) || validRows.length + 1;

    validRows.push({
      chapterId: targetChapterId,
      quizTitle: quizTitle || `Imported Quiz`,
      quizDescription: String(row.quiz_description || "").trim() || null,
      durationMinutes: duration > 0 ? duration : 15,
      questionText,
      optionA,
      optionB,
      optionC,
      optionD,
      correctAnswer: rawCorrect as "A" | "B" | "C" | "D",
      questionOrder: order,
      questionTextPa: (row.question_pa || row.question_text_pa) ? String(row.question_pa || row.question_text_pa).trim() : undefined,
      optionAPa: row.option_a_pa ? String(row.option_a_pa).trim() : undefined,
      optionBPa: row.option_b_pa ? String(row.option_b_pa).trim() : undefined,
      optionCPa: row.option_c_pa ? String(row.option_c_pa).trim() : undefined,
      optionDPa: row.option_d_pa ? String(row.option_d_pa).trim() : undefined
    });
  }

  if (validRows.length === 0) {
    return {
      importedCount: 0,
      questionCount: 0,
      failedCount: errors.length,
      errors
    };
  }

  // Transactional insertion of Quiz and Questions
  const client = await getClient();
  try {
    await client.query("BEGIN;");

    const first = validRows[0]!;
    const quizId = await createQuiz(client, {
      chapterId: first.chapterId,
      title: first.quizTitle,
      description: first.quizDescription,
      durationMinutes: first.durationMinutes,
      totalMarks: validRows.length,
      createdBy: teacherUserId,
      status: "published"
    });

    for (const q of validRows) {
      await createQuestion(client, {
        quizId,
        questionText: q.questionText,
        optionA: q.optionA,
        optionB: q.optionB,
        optionC: q.optionC,
        optionD: q.optionD,
        correctAnswer: q.correctAnswer,
        questionOrder: q.questionOrder,
        questionTextPa: q.questionTextPa,
        optionAPa: q.optionAPa,
        optionBPa: q.optionBPa,
        optionCPa: q.optionCPa,
        optionDPa: q.optionDPa
      });
    }

    await client.query("COMMIT;");

    return {
      importedCount: validRows.length,
      questionCount: validRows.length,
      failedCount: errors.length,
      errors,
      quizId
    };
  } catch (err) {
    await client.query("ROLLBACK;");
    throw err;
  } finally {
    client.release();
  }
}
