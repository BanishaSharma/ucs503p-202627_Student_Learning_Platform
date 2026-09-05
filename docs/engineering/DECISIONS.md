# Architecture Decision Records (ADR)

This document tracks significant architectural and technical decisions made during the development of ShikshaSetu.

---

## DEC-001 — Selection of `node-postgres` (`pg`) with Connection Pooling over ORMs

### Context
We need a reliable, high-performance database client to communicate between our Node.js/Express backend and PostgreSQL 18. Options range from full ORMs (Prisma, TypeORM), query builders (Knex, Kysely), to low-level native drivers (`pg`).

### Options
1. **Prisma ORM:** High developer ergonomics, auto-generated migrations, but introduces heavy binary engines, potential latency overhead, and abstraction over raw SQL that obscures learning core database concepts.
2. **TypeORM:** Decorator-based ORM; historically complex migration handling and heavy dependency footprint.
3. **node-postgres (`pg`) with Connection Pool:** Lightweight, industry-standard driver for Node.js, direct control over parameterized SQL, fast startup, zero unnecessary abstraction layers.

### Decision
Use **`pg` (node-postgres)** with connection pooling.

### Reason
- ShikshaSetu is an educational platform and a software engineering learning vehicle. Writing explicit parameterized SQL helps developers understand SQL performance, query execution plans, indexes, and transactions.
- `pg.Pool` automatically manages connection reuse, preventing TCP connection exhaustion under concurrent student load.
- It has minimal dependencies, works natively with Node.js ESM, and complies with strict TypeScript requirements.

### Trade-offs
- Manual mapping between SQL query result rows (`result.rows`) and TypeScript types.
- Developers must write explicit SQL rather than calling ORM helper methods (`findUnique`).

### Consequences
All queries must be explicitly written as parameterized queries in `src/db/queries.ts`. No dynamic SQL concatenation is permitted.

---

## DEC-002 — Adoption of Hierarchical Content Schema (`classes` -> `subjects` -> `chapters` -> `quizzes`)

### Context
The initial database draft (`schema.sql` in root) implemented a flat MVP where `quizzes` held a plain string `subject` column, omitting `classes` and `chapters`. However, the required student workflow involves progressive drill-down navigation: Class (e.g. Class 8) -> Subject (e.g. Science) -> Chapter (e.g. Light) -> Quiz.

### Options
1. **Flat Model (`quizzes.subject` string):** Simpler initial schema, but cannot support class-based filtering, chapter progression, or standard Indian school curriculum structures without client-side string parsing.
2. **Normalized Hierarchical Model (`classes` -> `subjects` -> `chapters` -> `quizzes`):** Follows NCERT / state board curriculum hierarchy, allows clean relational joins, cascades, and indexed lookups.

### Decision
Adopt the **Normalized Hierarchical Model** in `code/quiz-database/migrations/`.

### Reason
- Directly supports the educational domain model of government schools (Class 8–10).
- Powers the 5 required REST browsing endpoints cleanly with foreign key relationships.
- Future-proofs the schema for syllabus updates, teacher assignments, and chapter-wise progress analytics.

### Trade-offs
- Requires managing multiple relational tables and foreign keys.
- Deletions require proper cascading rules (`ON DELETE CASCADE`).

### Consequences
Database migrations in `code/quiz-database/` will define `classes`, `subjects`, `chapters`, `quizzes`, `questions`, `quiz_attempts`, and `answers`. The `users` table is also retained for future auth integration.

---

## DEC-003 — Request Validation Using Zod at the HTTP Controller Boundary

### Context
Incoming HTTP requests (parameters, query strings, and POST JSON bodies) can contain invalid types, missing fields, or malformed data. Validation is required before passing data to services and the database.

### Options
1. **Manual `if / else` checking in controllers:** Verbose, error-prone, violates DRY, and does not automatically generate TypeScript types.
2. **`express-validator`:** Traditional middleware, but requires chaining syntax and is less tightly integrated with TypeScript type inference.
3. **`zod`:** TypeScript-first schema declaration and validation library with automatic type inference (`z.infer<typeof Schema>`).

### Decision
Adopt **`zod`** for request validation.

### Reason
- Clear, declarative schema definitions colocated in `src/schemas/`.
- Automatic TypeScript type inference eliminates duplicated type definitions between runtime checks and compile-time types.
- Rich error reporting with specific field path issues.

### Trade-offs
- Adds one runtime dependency (`zod`).

### Consequences
Controllers parse incoming data with `.parse()` or `.safeParse()`. If validation fails, a `ZodError` is thrown and handled by the centralized error middleware with HTTP 400 Bad Request.

---

## DEC-004 — Centralized Error Handling with Async Middleware Wrapper

### Context
Express route handlers and controllers perform asynchronous database operations. In Express, unhandled promise rejections can cause hanging requests or crash the Node process if not caught.

### Options
1. **Wrapping every controller in `try / catch`:** Massive code duplication across every endpoint, inconsistent error formatting.
2. **Custom `asyncHandler` wrapper + centralized Express error middleware:** Intercepts rejected promises and passes them to `next(error)`, directing execution to a single global error handler.

### Decision
Adopt the **`asyncHandler` wrapper pattern** with centralized Express error middleware.

### Reason
- Eliminates repetitive boilerplate in controllers.
- Centralizes all error formatting, logging, and security sanitization into a single file (`src/middleware/errorHandler.ts`).
- Ensures that every error consistently returns `{ "success": false, "error": "..." }`.

### Trade-offs
- Route definitions must wrap controller methods in `asyncHandler(controllerFn)`.

### Consequences
Controllers simply `throw` standard or custom errors; the middleware catches and handles them uniformly.

---

## DEC-005 — Server-Side Scoring and Database-Level Answer Verification

### Context
When a student submits a quiz attempt, should the score be calculated by the frontend and sent to the server, or calculated on the server?

### Options
1. **Client-Side Scoring:** Frontend checks answers against an internal key and sends `{ score: 5 }` to the backend.
2. **Server-Side Scoring:** Frontend only sends `{ answers: [{ questionId, selectedAnswer }] }`. The server retrieves the correct answer from PostgreSQL, performs evaluation, and persists the record.

### Decision
Enforce **Server-Side Scoring** exclusively.

### Reason
- Client-side scoring is fundamentally insecure in web applications because users can manipulate JavaScript state or forge HTTP requests.
- Exposing correct answers to the client before or during quiz taking enables cheating via developer tools.

### Trade-offs
- Requires querying questions/answers from the database during submission.

### Consequences
The backend queries the correct options from the database, evaluates answers, and inserts records into `quiz_attempts` and `answers` inside a single atomic database transaction.

---

## DEC-006 — Plain Numbered SQL Files for Migrations

### Context
Database schema updates must be tracked, reproducible, and easily executed across developer environments and CI/CD.

### Options
1. **External migration framework (`node-pg-migrate`, `knex`):** Automated tracking, but introduces configuration overhead and dependencies.
2. **Plain Numbered SQL Files (`001_initial_schema.sql`) with a lightweight runner script:** Universal format, executable via native `psql` or a simple TypeScript script (`tsx src/db/migrate.ts`).

### Decision
Use **Plain Numbered SQL Files** with a lightweight Node/TypeScript runner script.

### Reason
- Simple to inspect, understand, and run on any machine with `psql` or `npm`.
- Zero proprietary migration tool lock-in.
- Ideal for educational visibility into real database DDL.

### Trade-offs
- Schema rollback scripts must be written explicitly if needed.

### Consequences
Migration files are placed in `code/quiz-database/migrations/` and seeds in `code/quiz-database/seeds/`.
