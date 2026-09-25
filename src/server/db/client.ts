import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import { log } from "@/lib/log";

import * as schema from "./schema";

/**
 * DB client singleton — HMR-safe in dev via `globalThis` (plan Phase 05 "State/flow").
 * Connects over the Supabase session pooler; SSL is required by Supabase.
 */
try {
  process.loadEnvFile();
} catch {
  /* no .env — DATABASE_URL must already be in the environment */
}

const globalForDb = globalThis as unknown as {
  __meditrackaiDb?: ReturnType<typeof createClient>;
  __meditrackaiPool?: Pool;
};

function createClient() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    max: 3,
  });
  pool.on("error", (err) => {
    log.error("Unexpected error on idle PostgreSQL client", { error: err });
  });
  return { pool, db: drizzle(pool, { schema }) };
}

const instance =
  globalForDb.__meditrackaiDb ??
  (() => {
    const created = createClient();
    if (process.env.NODE_ENV !== "production") {
      globalForDb.__meditrackaiDb = created;
      globalForDb.__meditrackaiPool = created.pool;
    }
    return created;
  })();

export const db = instance.db;
export const pool = instance.pool;
