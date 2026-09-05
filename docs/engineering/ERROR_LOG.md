# Error Log

This document records technical errors encountered during the development of ShikshaSetu, detailing root causes, debugging processes, resolutions, and lessons learned.

---

## ERR-001 — PostgreSQL CLI (`psql`) Not Recognized in Terminal

### Date
2026-09-04

### Context
Auditing the local environment to inspect PostgreSQL installation, database versions, and CLI availability prior to configuring database migrations.

### Error
```text
psql : The term 'psql' is not recognized as the name of a cmdlet, function, script file, or operable program. Check 
the spelling of the name, or if a path was included, verify that the path is correct and try again.
At line:1 char:1
+ psql --version
+ ~~~~
    + CategoryInfo          : ObjectNotFound: (psql:String) [], CommandNotFoundException
    + FullyQualifiedErrorId : CommandNotFoundException
```

### Symptoms
The command `psql --version` failed in PowerShell with exit code 1.

### Root Cause
PostgreSQL 18.6 was installed in a custom non-default location (`D:\postgres\bin\`), but that directory was not present in the Windows system or user `PATH` environment variable.

### Investigation
1. Queried Windows services via PowerShell: `Get-Service *postgres*` returned a running service named `postgresql-x64-18`.
2. Inspected the service binary path using Windows Management Instrumentation (WMI):
   `Get-CimInstance win32_service -Filter "Name = 'postgresql-x64-18'" | Select-Object -ExpandProperty PathName`
3. The binary path returned was `"D:\postgres\bin\pg_ctl.exe" runservice -N "postgresql-x64-18" -D "D:\postgres\data" -w`.
4. Executed `& "D:\postgres\bin\psql.exe" --version`, which returned `psql (PostgreSQL) 18.6`.

### Fix
For command-line tasks, execute the binary via its explicit path: `& "D:\postgres\bin\psql.exe"`.
For backend application runtime, use the Node.js `pg` driver (node-postgres), which communicates directly over TCP (port 5432) and does not depend on system shell PATH variables.

### Why This Fix Works
Directly referencing the verified absolute binary path bypasses the Windows PATH lookup mechanism. In the Node.js backend, `pg` implements the PostgreSQL wire protocol over TCP/IP sockets directly, making it completely independent of external CLI tools.

### Alternative Solutions Considered
- Modify system environment variables via Windows Registry or `[Environment]::SetEnvironmentVariable`: Rejected because modifying machine-level environment variables requires elevated permissions and might affect other processes.
- Rely solely on Node.js scripts for all DB migrations and operations: Selected as primary solution for the development workflow, while documenting the absolute `psql` path for manual database administrator queries.

### Verification
Ran `& "D:\postgres\bin\psql.exe" --version` and received:
`psql (PostgreSQL) 18.6`

### Prevention
1. Never assume CLI developer tools (`psql`, `docker`, etc.) are globally present in PATH across different developer workstations.
2. Build self-contained migration and seed scripts using the application's runtime language (Node.js/TypeScript with `pg`) so any developer with `npm` can run them regardless of host OS configuration.

### Lesson
Always verify installed services and binary paths dynamically rather than assuming standard default directories or global PATH entries.

---

## ERR-002 — PostgreSQL Non-Interactive Password Authentication Failure

### Date
2026-09-04

### Context
Attempting to list PostgreSQL databases non-interactively using `psql -U postgres -l -w` to inspect existing databases on the local instance.

### Error
```text
psql: error: connection to server at "localhost" (::1), port 5432 failed: fe_sendauth: no password supplied
```

### Symptoms
Connection attempt failed immediately when the `-w` (no-password) flag was supplied.

### Root Cause
The PostgreSQL server configuration (`pg_hba.conf`) requires password authentication (SCRAM-SHA-256 or MD5) for connections from `localhost` / `::1` for the `postgres` superuser. Because `-w` was passed, `psql` aborted rather than prompting for a password.

### Investigation
PostgreSQL security policy is working as intended; local TCP socket connections are not trusted without authentication credentials.

### Fix
1. Provide database configuration through environment variables via `.env` file (`PGPASSWORD` or `DATABASE_URL=postgresql://postgres:<password>@localhost:5432/<dbname>`).
2. Document in `.env.example` the required credential variables so developers configure their credentials locally without committing secrets to source control.

### Why This Fix Works
The `pg` Node.js client automatically reads `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, and `PGDATABASE` or a connection URI from environment variables to complete the authentication handshake securely.

### Alternative Solutions Considered
- Edit `pg_hba.conf` to set `trust` mode for IPv4/IPv6: Rejected because `trust` removes password authentication, creating a security risk even in local development.
- Hardcode credentials in application code: Absolutely rejected (violates 12-factor app security principles).

### Verification
Verified environment variable pattern against `node-postgres` specifications and verified `.env.example` documentation design.

### Prevention
Always use a `.env` file for local secrets and keep `.env` in `.gitignore`.

### Lesson
Database connections must always be parameterized via environment variables from day one, allowing seamless transitions between local development, staging, and production without code changes.

---

## ERR-003 — TypeScript Compilation Errors with Zod v4 Schema Overloads

### Date
2026-09-04

### Context
Running `npm run build` (`tsc`) after implementing request validation schemas in `src/schemas/quiz.schema.ts`.

### Error
```text
src/schemas/quiz.schema.ts(7,13): error TS2769: No overload matches this call.
  The last overload gave the following error.
    Object literal may only specify known properties, and 'required_error' does not exist in type '{ error?: string | $ZodErrorMap<$ZodIssueInvalidType<unknown>> | undefined; message?: string | undefined; }'.
src/schemas/quiz.schema.ts(17,15): error TS2353: Object literal may only specify known properties, and 'required_error' does not exist in type '{ error?: string | $ZodErrorMap<$ZodIssueInvalidType<unknown>> | undefined; message?: string | undefined; }'.
src/schemas/quiz.schema.ts(20,26): error TS2769: No overload matches this call.
  The last overload gave the following error.
    Argument of type 'string[]' is not assignable to parameter of type 'Readonly<Record<string, EnumValue>>'.
      Index signature for type 'string' is missing in type 'string[]'.
src/schemas/quiz.schema.ts(32,37): error TS2353: Object literal may only specify known properties, and 'required_error' does not exist in type '{ error?: string | $ZodErrorMap<$ZodIssueInvalidType<unknown>> | undefined; message?: string | undefined; }'.
```

### Symptoms
`npm run build` exited with code 1 due to type mismatches in Zod schema definitions.

### Root Cause
`npm install zod` installed Zod version `4.5.4` (Zod v4). In Zod v4:
1. The option `{ required_error: "..." }` has been deprecated/removed in favor of `{ message: "..." }` or `{ error: "..." }`.
2. `z.enum()` requires a constant tuple (`as const`) so TypeScript can infer the literal union type rather than a generic `string[]`.

### Investigation
Inspected the installed `zod` version in `package.json` (`^4.5.4`) and reviewed the TypeScript compiler error message pointing to `src/schemas/quiz.schema.ts`.

### Fix
Updated `src/schemas/quiz.schema.ts`:
- Replaced `{ required_error: "..." }` with `{ message: "..." }`.
- Added `as const` assertion to `z.enum(["A", "B", "C", "D"] as const)`.

### Why This Fix Works
1. `{ message: "..." }` matches the valid Zod v4 options interface.
2. `as const` preserves the literal types `readonly ["A", "B", "C", "D"]`, satisfying Zod's enum parameter requirements.

### Alternative Solutions Considered
- Downgrade to Zod v3 (`zod@^3.22.4`): Not needed, as adapting to the modern Zod v4 API is cleaner and future-proof.

### Verification
Executed `npm run build` (`tsc`). Compilation completed with code 0 and zero errors.

### Prevention
When adopting major new library releases, check the library's latest TypeScript signatures and compiler diagnostic hints.

### Lesson
TypeScript's strict compiler options (`verbatimModuleSyntax`, `exactOptionalPropertyTypes`) immediately catch subtle API differences in library upgrades at build time, preventing runtime bugs.

---

## ERR-004 — Missing `rootDir` and `outDir` in `tsconfig.json` Causing `MODULE_NOT_FOUND`

### Date
2026-09-04

### Context
Running `npm start` (`node dist/server.js`) after executing `npm run build`.

### Error
```text
Error: Cannot find module 'D:\software project\ucs503p-202627_Student_Learning_Platform\code\quiz-backend\dist\server.js'
    at Module._resolveFilename (node:internal/modules/cjs/loader:1421:15)
...
  code: 'MODULE_NOT_FOUND'
```

### Symptoms
The compiled file `dist/server.js` did not exist despite `tsc` exiting with code 0.

### Root Cause
In `tsconfig.json`, lines 5 and 6 (`"rootDir": "./src"` and `"outDir": "./dist"`) were commented out in the initial repository template. Consequently, `tsc` compiled `.ts` files into `.js` files in-place within `src/` rather than placing them into the dedicated `dist/` directory expected by `package.json`'s `"start"` script.

### Investigation
Inspected `tsconfig.json` compiler options and verified with `list_dir` that `.js` files were being emitted inside `src/`.

### Fix
1. Uncommented `"rootDir": "./src"` and `"outDir": "./dist"` in `tsconfig.json`.
2. Removed all inadvertently emitted `.js`, `.js.map`, `.d.ts`, and `.d.ts.map` files from `src/`.
3. Re-ran `npm run build`, which cleanly emitted all build artifacts to `dist/`.

### Why This Fix Works
Setting `"outDir": "./dist"` explicitly directs the TypeScript compiler to place all generated JavaScript code, source maps, and declaration files into `dist/`, matching the `"start": "node dist/server.js"` execution contract.

### Alternative Solutions Considered
- Change `package.json` to point `"start": "node src/server.js"`: Rejected because mixing compiled artifacts with source code in `src/` is a bad practice and pollutes git working trees.

### Verification
Checked `code/quiz-backend/dist/server.js` exists. Verified `node dist/server.js` executes.

### Prevention
Always verify that `tsconfig.json` defines clean, segregated `rootDir` and `outDir` paths before running build workflows.

### Lesson
When inheriting a starter template, inspect compiler configuration to ensure output targets match package script expectations.

---

## ERR-005 — ESM Module Graph Hoisting Causing Uninitialized Environment Variables in Database Pool

### Date
2026-09-04

### Context
Querying the database through Express route handlers after bootstrapping the backend application.

### Error
```text
DB Error: SASL: SCRAM-SERVER-FIRST-MESSAGE: client password must be a string
HTTP Status: 500 Internal Server Error
```

### Symptoms
When hitting `GET /api/classes`, the server returned an HTTP 500 Internal Server Error. Logs revealed a PostgreSQL SCRAM authentication handshake error indicating the client password was not a string.

### Root Cause
In ECMAScript Modules (ESM), `import` statements form a dependency graph evaluated before the body of the importing module executes. In `server.ts`:
```typescript
import "dotenv/config";
import app from "./app.js";
```
`app.js` imported `quiz.routes.js`, which imported `quiz.controller.js`, which imported `quiz.service.js`, which imported `db/queries.js`, which imported `db/index.js`.
Because `src/db/index.ts` did not import `dotenv/config` itself, and dependencies in the module graph are evaluated first, `poolConfig` in `db/index.ts` was instantiated when `process.env.PGPASSWORD` was still unpopulated (`undefined`), causing the password to evaluate to an empty or missing value during connection initialization.

### Investigation
Isolated the database query in a standalone Node script. Observed that `process.env.PGPASSWORD` was only available if `dotenv/config` was imported directly before or within `db/index.ts`.

### Fix
Added `import "dotenv/config";` directly at line 1 of `src/db/index.ts`.

### Why This Fix Works
Importing `dotenv/config` at the top of `src/db/index.ts` guarantees that environment variables from `.env` are parsed and loaded into `process.env` before the `pg.Pool` configuration object is instantiated.

### Alternative Solutions Considered
- Initialize `Pool` lazily on the first query: Viable, but importing `dotenv/config` in the database entry point is cleaner and ensures configuration is ready at boot time.

### Verification
Ran `node -e "import('./dist/db/index.js').then(...)`. Successfully returned all 3 classes from the PostgreSQL database (`Class 8`, `Class 9`, `Class 10`).

### Prevention
Any module that reads `process.env` at file load time (top-level scope) in Node.js ESM must ensure `dotenv/config` is explicitly loaded before or within that module.

### Lesson
ESM import hoisting behaves differently from CommonJS `require()`. In ESM, imports are statically resolved and executed depth-first before parent module code runs.



