import { migrate } from "drizzle-orm/node-postgres/migrator";

import { log } from "@/lib/log";

import { db, pool } from "./client";

async function main() {
  try {
    process.loadEnvFile();
  } catch {
    /* no .env — DATABASE_URL must already be in the environment */
  }
  if (!process.env.DATABASE_URL) {
    log.error("DATABASE_URL is missing — set it in .env before running pnpm db:migrate");
    process.exit(1);
  }

  await migrate(db, { migrationsFolder: "./drizzle" });
  log.info("migrate: applied up to date");
  await pool.end();
}

const entry = process.argv[1]?.replace(/\\/g, "/").split("/").pop();
if (entry === "migrate.ts") {
  main().catch((error) => {
    log.error("Database migration failed", { error });
    process.exit(1);
  });
}
