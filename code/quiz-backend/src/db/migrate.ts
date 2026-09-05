import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { pool, closePool } from "./index.js";
import "dotenv/config";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigrations(): Promise<void> {
  console.log("Starting PostgreSQL schema migrations...");
  // Migration directory is in code/quiz-database/migrations/
  const migrationsDir = path.resolve(__dirname, "../../../quiz-database/migrations");

  try {
    const files = await fs.readdir(migrationsDir);
    const sqlFiles = files.filter((file) => file.endsWith(".sql")).sort();

    if (sqlFiles.length === 0) {
      console.log("No migration files found.");
      return;
    }

    for (const sqlFile of sqlFiles) {
      const filePath = path.join(migrationsDir, sqlFile);
      console.log(`Executing migration: ${sqlFile}`);
      const sql = await fs.readFile(filePath, "utf-8");
      await pool.query(sql);
      console.log(`Successfully applied: ${sqlFile}`);
    }

    console.log("All migrations completed successfully.");
  } catch (error) {
    console.error("Migration failed:", error);
    process.exitCode = 1;
  } finally {
    await closePool();
  }
}

runMigrations();
