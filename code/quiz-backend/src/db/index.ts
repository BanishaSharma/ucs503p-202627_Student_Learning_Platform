import "dotenv/config";
import pg from "pg";
import type { QueryResult, PoolClient } from "pg";

const { Pool } = pg;

// Connection pool configuration
const poolConfig: pg.PoolConfig = process.env.DATABASE_URL
  ? { connectionString: process.env.DATABASE_URL }
  : {
      host: process.env.PGHOST || "localhost",
      port: process.env.PGPORT ? parseInt(process.env.PGPORT, 10) : 5432,
      user: process.env.PGUSER || "postgres",
      password: process.env.PGPASSWORD || "",
      database: process.env.PGDATABASE || "shikshasetu_quiz",
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000
    };

export const pool = new Pool(poolConfig);

// Pool error handling for idle clients
pool.on("error", (err: Error) => {
  console.error("Unexpected error on idle PostgreSQL client:", err);
});

/**
 * Executes a parameterized SQL query using an available pool connection.
 */
export async function query<T extends pg.QueryResultRow = pg.QueryResultRow>(
  text: string,
  params?: unknown[]
): Promise<QueryResult<T>> {
  const start = Date.now();
  const res = await pool.query<T>(text, params);
  const duration = Date.now() - start;
  if (process.env.NODE_ENV === "development") {
    // Log query execution time in dev mode without leaking sensitive values
    // console.debug(`Executed query: ${text.substring(0, 80)}... [${duration}ms, rows: ${res.rowCount}]`);
  }
  return res;
}

/**
 * Acquires a client connection from the pool (used for transactions).
 * Remember to release the client back to the pool via client.release().
 */
export async function getClient(): Promise<PoolClient> {
  return await pool.connect();
}

/**
 * Closes the connection pool gracefully (used in tests and shutdown).
 */
export async function closePool(): Promise<void> {
  await pool.end();
}
