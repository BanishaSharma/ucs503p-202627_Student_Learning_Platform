# Deployment & Environment Guide

This document outlines environment configurations, deployment targets, build procedures, and database operational instructions.

---

## 1. Environments

| Environment | Purpose | Database | Host / Execution |
|---|---|---|---|
| **LOCAL** | Developer workstation for coding, unit testing, and debugging. | Local PostgreSQL 18 (`localhost:5432`) | `tsx watch src/server.ts` |
| **DEVELOPMENT** | Shared integration environment on GitHub branch `development`. | Shared development database | Staging server / container |
| **STAGING** | Pre-production testing environment for full end-to-end rehearsal. | Managed PostgreSQL (Cloud SQL / RDS) | Containerized app (Docker/ECS/Cloud Run) |
| **PRODUCTION** | Live system serving teachers and students in schools. | Highly available managed PostgreSQL with automated daily backups | Load-balanced containers with HTTPS |

---

## 2. Environment Variables

All environment variables are loaded via `dotenv` in `src/server.ts`. A template `.env.example` is maintained in the backend root.

| Variable Name | Required | Default (Local) | Description |
|---|---|---|---|
| `PORT` | No | `5000` | Port for the Express HTTP server. |
| `NODE_ENV` | No | `development` | Runtime environment (`development`, `test`, `production`). |
| `DATABASE_URL` | Optional | — | Full PostgreSQL connection URI (`postgresql://user:pass@host:5432/dbname`). |
| `PGHOST` | Yes (if no URL) | `localhost` | PostgreSQL server hostname. |
| `PGPORT` | Yes (if no URL) | `5432` | PostgreSQL server port. |
| `PGUSER` | Yes (if no URL) | `postgres` | Database user name. |
| `PGPASSWORD` | Yes (if no URL) | — | Database user password. |
| `PGDATABASE` | Yes (if no URL) | `shikshasetu_quiz` | Target database name. |

> [!CAUTION]
> **Never commit `.env` files to git.** The file `.env` must remain listed in `.gitignore`.

---

## 3. Local Development Setup Instructions

### Prerequisites
- Node.js `v20+` or `v24.x`
- PostgreSQL `16+` or `18.x`
- Git

### Steps
1. Navigate to the backend directory:
   ```bash
   cd code/quiz-backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create local `.env`:
   Copy `.env.example` to `.env` and fill in your local PostgreSQL credentials.
   ```bash
   cp .env.example .env
   ```
4. Create local database (using `psql` or pgAdmin):
   ```sql
   CREATE DATABASE shikshasetu_quiz;
   ```
5. Run migrations to create tables:
   ```bash
   npm run db:migrate
   ```
6. Populate seed curriculum and questions:
   ```bash
   npm run db:seed
   ```
7. Start development server with live reload:
   ```bash
   npm run dev
   ```
8. Verify health endpoint:
   ```bash
   curl http://localhost:5000/api/health
   ```

---

## 4. Production Build & Execution

1. Compile TypeScript to JavaScript:
   ```bash
   npm run build
   ```
2. Start the production server using Node.js:
   ```bash
   npm run start
   ```

---

## 5. Running the Full Stack Locally (Database, Backend, Frontend)

### Terminal 1: Database (PostgreSQL)
Ensure the PostgreSQL Windows service is running:
```powershell
Get-Service postgresql*
# If stopped, start it:
Start-Service postgresql-x64-18
```
*(Database `shikshasetu_quiz` is already created and seeded).*

### Terminal 2: Backend API Server
```powershell
cd "d:\software project\ucs503p-202627_Student_Learning_Platform\code\quiz-backend"
npm run dev
# Server listens on http://localhost:5000
```

### Accessing the Frontend
There are two ways to run/access the frontend:

- **Method A (Integrated — Easiest):**  
  Open your web browser and navigate directly to:  
  **[http://localhost:5000](http://localhost:5000)**  
  The backend serves the interactive student learning platform from `code/quiz-frontend/` directly, with live API and database connectivity.

- **Method B (Independent Dev Server):**  
  Open a separate terminal:
  ```powershell
  cd "d:\software project\ucs503p-202627_Student_Learning_Platform\code\quiz-frontend"
  npm run dev
  # Opens on http://localhost:3000 (CORS is enabled on backend to allow cross-origin requests)
  ```

