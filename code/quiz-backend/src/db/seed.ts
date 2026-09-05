import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { pool, closePool } from "./index.js";
import "dotenv/config";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runSeeds(): Promise<void> {
  console.log("Starting PostgreSQL seed execution...");
  const seedsDir = path.resolve(__dirname, "../../../quiz-database/seeds");

  try {
    const files = await fs.readdir(seedsDir);
    const sqlFiles = files.filter((file) => file.endsWith(".sql")).sort();

    if (sqlFiles.length === 0) {
      console.log("No seed files found.");
      return;
    }

    for (const sqlFile of sqlFiles) {
      const filePath = path.join(seedsDir, sqlFile);
      console.log(`Applying seed file: ${sqlFile}`);
      const sql = await fs.readFile(filePath, "utf-8");
      await pool.query(sql);
      console.log(`Successfully seeded: ${sqlFile}`);
    }

    console.log("All seed data inserted successfully.");
  } catch (error) {
    console.error("Seed execution failed:", error);
    process.exitCode = 1;
  } finally {
    await closePool();
  }
}

runSeeds();
