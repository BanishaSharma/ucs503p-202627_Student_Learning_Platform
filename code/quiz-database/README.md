# Quiz Database Module

## Overview
This folder contains the PostgreSQL database schema migrations and seed scripts for the ShikshaSetu Quiz platform.

Target Database: **PostgreSQL 18**

---

## Migration & Seed Approach

We use plain, sequentially numbered SQL files (`migrations/001_initial_schema.sql` and `seeds/001_seed_quiz_data.sql`).

### Why Plain Numbered SQL Files?
1. **Zero Runtime Dependency Lock-in:** Plain SQL files can be executed by any database client, CI/CD pipeline, Docker entrypoint script, or terminal CLI (`psql`) without relying on specific ORM tools.
2. **Auditable DDL:** Changes to tables, constraints, and indexes are clearly visible in pull request diffs.
3. **Reproducibility:** Numbered filenames (`001_...`, `002_...`) guarantee deterministic execution order.
4. **Developer Convenience:** In addition to standard `psql` execution, the backend provides automated npm commands (`npm run db:migrate` and `npm run db:seed`) powered by `node-postgres` so developers do not need `psql` in their system PATH.

---

## Schema Structure

```text
classes (id, name)
  └── subjects (id, class_id FK, name)
        └── chapters (id, subject_id FK, name)
              └── quizzes (id, chapter_id FK, title, description, duration_minutes, total_marks, created_at)
                    ├── questions (id, quiz_id FK, question_text, option_a, option_b, option_c, option_d, correct_answer, question_order)
                    └── quiz_attempts (id, student_id, quiz_id FK, score, total_questions, attempted_at)
                          └── answers (id, attempt_id FK, question_id FK, selected_answer, is_correct)
```

Additionally, `users` (id, name, email, password_hash, role, created_at) is maintained for future authentication integration.

---

## How to Run

### Method 1: Using Backend npm Scripts (Recommended)
From `code/quiz-backend/`:
```bash
# Run schema migrations
npm run db:migrate

# Populate seed data
npm run db:seed
```

### Method 2: Using psql CLI Directly
```bash
# Apply schema
psql -U postgres -d shikshasetu_quiz -f migrations/001_initial_schema.sql

# Apply seed data
psql -U postgres -d shikshasetu_quiz -f seeds/001_seed_quiz_data.sql
```
*(On Windows with custom install: `& "D:\postgres\bin\psql.exe" -U postgres -d shikshasetu_quiz -f ...`)*
