import "dotenv/config";
import app from "./app.js";
import { closePool } from "./db/index.js";

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 5000;

const server = app.listen(PORT, () => {
  console.log(`ShikshaSetu backend running on http://localhost:${PORT}`);
});

// Keep event loop active in headless/service environments
const keepAlive = setInterval(() => {}, 60000);

// Graceful shutdown handling
const shutdown = async (signal: string) => {
  console.log(`Received ${signal}. Gracefully shutting down...`);
  clearInterval(keepAlive);
  server.close(async () => {
    console.log("HTTP server closed.");
    await closePool();
    console.log("PostgreSQL pool closed. Process exiting.");
    process.exit(0);
  });
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));