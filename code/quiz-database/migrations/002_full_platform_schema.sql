-- ============================================================
-- ShikshaSetu Platform — Platform Expansion Schema (PostgreSQL)
-- Migration: 002_full_platform_schema.sql
-- ============================================================

-- ---------- 1. UPDATE USERS TABLE ----------
-- Expand role check to include 'admin', add active status & audit timestamps.
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('admin', 'teacher', 'student'));

ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- ---------- 2. STUDENTS PROFILE TABLE ----------
CREATE TABLE IF NOT EXISTS students (
    id          SERIAL PRIMARY KEY,
    user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    class_id    INTEGER NOT NULL REFERENCES classes(id) ON DELETE RESTRICT,
    roll_number VARCHAR(50),
    section     VARCHAR(10) DEFAULT 'A',
    created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_students_user_id ON students(user_id);
CREATE INDEX IF NOT EXISTS idx_students_class_id ON students(class_id);

-- ---------- 3. TEACHERS PROFILE TABLE ----------
CREATE TABLE IF NOT EXISTS teachers (
    id            SERIAL PRIMARY KEY,
    user_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    employee_id   VARCHAR(50) UNIQUE,
    qualification VARCHAR(100),
    created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_teachers_user_id ON teachers(user_id);

-- ---------- 4. TEACHER CLASS ASSIGNMENTS ----------
CREATE TABLE IF NOT EXISTS teacher_class_assignments (
    id          SERIAL PRIMARY KEY,
    teacher_id  INTEGER NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
    class_id    INTEGER NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    subject_id  INTEGER NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_teacher_class_subject UNIQUE (teacher_id, class_id, subject_id)
);

CREATE INDEX IF NOT EXISTS idx_tca_teacher ON teacher_class_assignments(teacher_id);
CREATE INDEX IF NOT EXISTS idx_tca_class ON teacher_class_assignments(class_id);
CREATE INDEX IF NOT EXISTS idx_tca_subject ON teacher_class_assignments(subject_id);

-- ---------- 5. UPDATE QUIZZES TABLE ----------
ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS created_by INTEGER REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived'));
ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS max_attempts INTEGER NOT NULL DEFAULT 0;
ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_quizzes_status ON quizzes(status);
CREATE INDEX IF NOT EXISTS idx_quizzes_created_by ON quizzes(created_by);

-- ---------- 6. UPDATE QUESTIONS TABLE (BILINGUAL SUPPORT) ----------
ALTER TABLE questions ADD COLUMN IF NOT EXISTS question_text_pa TEXT;
ALTER TABLE questions ADD COLUMN IF NOT EXISTS option_a_pa TEXT;
ALTER TABLE questions ADD COLUMN IF NOT EXISTS option_b_pa TEXT;
ALTER TABLE questions ADD COLUMN IF NOT EXISTS option_c_pa TEXT;
ALTER TABLE questions ADD COLUMN IF NOT EXISTS option_d_pa TEXT;

-- ---------- 7. STUDENT QUERIES (DOUBTS) ----------
CREATE TABLE IF NOT EXISTS student_queries (
    id          SERIAL PRIMARY KEY,
    student_id  INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    class_id    INTEGER NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    subject_id  INTEGER REFERENCES subjects(id) ON DELETE SET NULL,
    chapter_id  INTEGER REFERENCES chapters(id) ON DELETE SET NULL,
    title       VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    status      VARCHAR(20) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'resolved')),
    created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_queries_student ON student_queries(student_id);
CREATE INDEX IF NOT EXISTS idx_queries_class ON student_queries(class_id);
CREATE INDEX IF NOT EXISTS idx_queries_status ON student_queries(status);

-- ---------- 8. QUERY RESPONSES ----------
CREATE TABLE IF NOT EXISTS query_responses (
    id            SERIAL PRIMARY KEY,
    query_id      INTEGER NOT NULL REFERENCES student_queries(id) ON DELETE CASCADE,
    responder_id  INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    response_text TEXT NOT NULL,
    created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_query_responses_query ON query_responses(query_id);
