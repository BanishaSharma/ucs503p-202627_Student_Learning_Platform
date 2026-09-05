# Engineering Learning Notes & Core Concepts

This document explains the foundational software engineering concepts used in ShikshaSetu in clear, technically precise language. It serves as an educational reference guide.

---

## 1. ECMAScript Modules (ESM) in Node.js

### What It Is
ECMAScript Modules (ESM) is the official standard format for packaging JavaScript code for reuse, using `import` and `export` statements instead of legacy CommonJS `require()` and `module.exports`.

### Why We Need It
Modern JavaScript/TypeScript ecosystems, web standards, and modern libraries are standardizing on ESM. It allows static analysis, tree-shaking (removing unused code during bundling), and clean syntax.

### How It Works
In `code/quiz-backend/package.json`, `"type": "module"` signals to Node.js that all `.js` files are ES modules. Under TypeScript's `nodenext` module resolution, relative imports must explicitly include the `.js` extension even when importing from `.ts` files (e.g., `import app from "./app.js";`), because TypeScript emits JavaScript files that Node will execute natively.

### Where We Use It in This Project
Every file in `code/quiz-backend/src/` uses `import` and `export default` or named `export`.

### Common Mistakes
- Omitting the `.js` file extension in relative imports (e.g., `import app from "./app"`), which causes runtime `ERR_MODULE_NOT_FOUND` under Node's native ESM loader.
- Mixing `require()` and `import` haphazardly.

### Production Considerations
Ensure the build script (`tsc`) generates code compatible with the production Node.js runtime.

---

## 2. Express.js and the Middleware Pipeline

### What It Is
Express is a minimalist web framework for Node.js. It operates as a pipeline of functions ("middleware") through which incoming HTTP requests pass sequentially.

### Why We Need It
It provides routing, request body parsing, header manipulation, and error interception without having to write low-level Node `http.createServer` socket handlers.

### How It Works
Each middleware receives three arguments: `req` (the incoming request), `res` (the outgoing response), and `next` (a function to pass control to the subsequent middleware).
```text
HTTP Request ---> [ express.json() ] ---> [ Route Match ] ---> [ Controller ] ---> HTTP Response
```

### Where We Use It in This Project
- `express.json()` in `src/app.ts` parses JSON request bodies.
- `asyncHandler` wraps controller functions to catch asynchronous errors.
- Global error handler middleware in `src/middleware/errorHandler.ts` catches unhandled errors and formats standard JSON error envelopes.

### Common Mistakes
- Forgetting to call `next(error)` inside asynchronous callbacks, causing requests to hang indefinitely.
- Placing the global error handler before routes instead of at the very end of the middleware chain.

### Production Considerations
Ensure middleware does not perform blocking synchronous operations (`fs.readFileSync`), which freezes the single-threaded Node.js event loop for all concurrent users.

---

## 3. Layered Architecture (Controller vs. Service vs. DB)

### What It Is
An architectural pattern that divides an application into horizontal layers, each with a single, clearly defined responsibility:
1. **Controller Layer:** Speaks HTTP. Understands status codes, headers, and request/response formatting.
2. **Service Layer:** Speaks Domain Logic. Calculates scores, enforces business rules, coordinates transactions.
3. **Database Layer:** Speaks SQL. Executes parameterized queries against PostgreSQL.

### Why We Need It
Without layering, SQL queries, HTTP headers, business calculations, and validation logic become mixed in giant route handlers ("spaghetti code"). Separating them enables:
- Independent testing (testing business logic without spinning up an HTTP server).
- Code reuse (calling a service from a CLI tool, background queue, or API endpoint).
- Maintainability (modifying database schema without touching HTTP response controllers).

### How It Works
- Route calls Controller.
- Controller validates input, calls Service, and returns `res.json(...)`.
- Service calls DB query functions, performs domain calculations, and returns plain data to Controller.
- DB query function sends SQL to PostgreSQL and returns rows.

### Where We Use It in This Project
- `src/routes/quiz.routes.ts`
- `src/controllers/quiz.controller.ts`
- `src/services/quiz.service.ts`
- `src/db/queries.ts`

### Common Mistakes
- Calling SQL queries directly from a controller.
- Passing `req` and `res` into a service function.

---

## 4. Database Connection Pooling (`pg.Pool`)

### What It Is
A connection pool is a cache of pre-established database connections maintained by the backend server.

### Why We Need It
Establishing a new TCP and TLS handshake with PostgreSQL for every incoming HTTP request is computationally expensive and introduces latency (often 50–100ms per request). If hundreds of students click "Submit Quiz" simultaneously, creating hundreds of individual connections would crash PostgreSQL with "too many connections" errors.

### How It Works
When the backend starts, `pg.Pool` establishes a fixed set of connections (e.g. 10–20). When a query needs to run, it borrows an idle connection from the pool, executes the query, and immediately returns the connection to the pool for another request to use.

### Where We Use It in This Project
`code/quiz-backend/src/db/index.ts` creates and exports a singleton `Pool` instance.

### Common Mistakes
- Borrowing a connection client manually (`pool.connect()`) and forgetting to release it (`client.release()`), causing connection pool starvation where all future requests hang.
- Creating a new `new Pool()` inside every route handler rather than a single shared pool.

---

## 5. SQL Parameterization & SQL Injection

### What It Is
SQL parameterization is the practice of separating the SQL query command structure from user-supplied data values using placeholder tokens (`$1`, `$2` in PostgreSQL).

### Why We Need It
If user input is directly concatenated into SQL strings:
```typescript
// DANGEROUS / VULNERABLE:
const sql = `SELECT * FROM classes WHERE id = '${req.params.id}'`;
```
An attacker can supply `1' OR '1'='1` or `1; DROP TABLE users;`, altering the database query structure. This is SQL Injection (SQLi), one of the most critical web vulnerabilities.

### How It Works
When using parameters:
```typescript
// SECURE:
const sql = 'SELECT * FROM classes WHERE id = $1';
await pool.query(sql, [req.params.id]);
```
The database engine compiles the SQL command structure first, and treats `$1` strictly as a literal data value, never as executable SQL commands, regardless of what characters it contains.

### Where We Use It in This Project
Every query in `src/db/queries.ts` uses `$1, $2, ...` placeholders.

---

## 6. Runtime Schema Validation with Zod

### What It Is
Zod is a TypeScript-first schema validation library that validates data at runtime and infers static TypeScript types.

### Why We Need It
TypeScript types only exist at compile time; once compiled to JavaScript, types are erased. At runtime, external user input (like a POST request body) could contain anything. Zod validates that the incoming payload actually conforms to the expected types before the application processes it.

### How It Works
```typescript
import { z } from "zod";

export const SubmitQuizSchema = z.object({
  answers: z.array(z.object({
    questionId: z.number().int().positive(),
    selectedAnswer: z.enum(["A", "B", "C", "D"])
  })).min(1)
});

export type SubmitQuizInput = z.infer<typeof SubmitQuizSchema>;
```
Calling `SubmitQuizSchema.parse(req.body)` either returns the validated, typed data or throws a descriptive `ZodError`.

### Where We Use It in This Project
`src/schemas/quiz.schema.ts` for validating URL params and quiz submission bodies.

---

## 7. Relational Foreign Keys & Cascades

### What It Is
A foreign key is a column in a relational database table that links to the primary key of another table, enforcing referential integrity.

### Why We Need It
It ensures data consistency: a question cannot exist for a quiz that was deleted; a quiz cannot point to a non-existent chapter.

### How It Works
In `code/quiz-database/migrations/001_initial_schema.sql`:
```sql
CREATE TABLE questions (
    id SERIAL PRIMARY KEY,
    quiz_id INTEGER NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
    ...
);
```
`ON DELETE CASCADE` instructs PostgreSQL that if a quiz row is deleted, all associated questions in that quiz are automatically and cleanly deleted by the database engine.

---

## 8. Server-Side vs. Client-Side Evaluation

### What It Is
Computing scores and validating answers on the backend server rather than trusting calculations sent by the user's web browser.

### Why We Need It
Any code running in a student's browser can be inspected, paused, or altered using Developer Tools, browser extensions, or custom HTTP clients (like Postman or curl). If the frontend sends `{ score: 5 }`, any student could award themselves 100%.

### How It Works
1. Student submits only their selections: `[{ questionId: 1, selectedAnswer: 'B' }]`.
2. The server queries the database for the verified `correct_answer` of question 1.
3. Server evaluates `is_correct = (selected == correct)` and computes the total score.
4. The verified score is saved in the database and returned to the student.
