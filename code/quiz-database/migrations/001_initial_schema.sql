-- ============================================================
-- ShikshaSetu Platform — Initial Quiz Database Schema (PostgreSQL)
-- Migration: 001_initial_schema.sql
-- ============================================================

-- ---------- USERS ----------
-- Forward-compatible user accounts table for students and teachers.
CREATE TABLE IF NOT EXISTS users (
    id            SERIAL PRIMARY KEY,
    name          VARCHAR(100) NOT NULL,
    email         VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role          VARCHAR(20) NOT NULL CHECK (role IN ('student', 'teacher')),
    created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ---------- CLASSES ----------
-- Educational class tiers (e.g. Class 8, Class 9, Class 10).
CREATE TABLE IF NOT EXISTS classes (
    id   SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE
);

-- ---------- SUBJECTS ----------
-- Subjects associated with a class tier (e.g. Mathematics, Science).
CREATE TABLE IF NOT EXISTS subjects (
    id       SERIAL PRIMARY KEY,
    class_id INTEGER NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    name     VARCHAR(100) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_subjects_class_id ON subjects(class_id);

-- ---------- CHAPTERS ----------
-- Textbook chapters belonging to a subject.
CREATE TABLE IF NOT EXISTS chapters (
    id         SERIAL PRIMARY KEY,
    subject_id INTEGER NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    name       VARCHAR(150) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_chapters_subject_id ON chapters(subject_id);

-- ---------- QUIZZES ----------
-- Quiz assessments created under a chapter.
CREATE TABLE IF NOT EXISTS quizzes (
    id               SERIAL PRIMARY KEY,
    chapter_id       INTEGER NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
    title            VARCHAR(200) NOT NULL,
    description      TEXT,
    duration_minutes INTEGER NOT NULL DEFAULT 15 CHECK (duration_minutes > 0),
    total_marks      INTEGER NOT NULL DEFAULT 5 CHECK (total_marks > 0),
    created_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_quizzes_chapter_id ON quizzes(chapter_id);

-- ---------- QUESTIONS ----------
-- Multiple choice questions belonging to a quiz.
-- 4 distinct options (A, B, C, D) with the correct option stored in correct_answer.
-- NOTE: correct_answer must NEVER be exposed to students through GET requests.
CREATE TABLE IF NOT EXISTS questions (
    id             SERIAL PRIMARY KEY,
    quiz_id        INTEGER NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
    question_text  TEXT NOT NULL,
    option_a       TEXT NOT NULL,
    option_b       TEXT NOT NULL,
    option_c       TEXT NOT NULL,
    option_d       TEXT NOT NULL,
    correct_answer VARCHAR(1) NOT NULL CHECK (correct_answer IN ('A', 'B', 'C', 'D')),
    question_order INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_questions_quiz_id ON questions(quiz_id);

-- ---------- QUIZ ATTEMPTS ----------
-- Tracks a student's submission and calculated score.
-- student_id is a plain integer for now and will link to users(id) once auth is wired up.
CREATE TABLE IF NOT EXISTS quiz_attempts (
    id              SERIAL PRIMARY KEY,
    student_id      INTEGER,
    quiz_id         INTEGER NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
    score           INTEGER NOT NULL CHECK (score >= 0),
    total_questions INTEGER NOT NULL CHECK (total_questions > 0),
    attempted_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_attempts_quiz_id ON quiz_attempts(quiz_id);
CREATE INDEX IF NOT EXISTS idx_attempts_student_id ON quiz_attempts(student_id);

-- ---------- ANSWERS ----------
-- Stores individual answers for an attempt, evaluated server-side.
CREATE TABLE IF NOT EXISTS answers (
    id              SERIAL PRIMARY KEY,
    attempt_id      INTEGER NOT NULL REFERENCES quiz_attempts(id) ON DELETE CASCADE,
    question_id     INTEGER NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    selected_answer VARCHAR(1) NOT NULL CHECK (selected_answer IN ('A', 'B', 'C', 'D')),
    is_correct      BOOLEAN NOT NULL,
    CONSTRAINT uq_attempt_question UNIQUE (attempt_id, question_id)
);

CREATE INDEX IF NOT EXISTS idx_answers_attempt_id ON answers(attempt_id);
CREATE INDEX IF NOT EXISTS idx_answers_question_id ON answers(question_id);
