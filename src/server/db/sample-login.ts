import { hashPassword } from "better-auth/crypto";
import { eq } from "drizzle-orm";

import { log } from "@/lib/log";

import { db, pool } from "./client";
import { uuidv7, upsertUser } from "./helpers";
import { accounts, userPreferences } from "./schema";

/**
 * Local-only login shortcut for manual QA — the seeded `DEV_USERS` have no credential
 * account, so this writes one directly through Better Auth's own scrypt hashing.
 * Idempotent: re-running rotates the stored hash and leaves exactly one credential row.
 */
export const SAMPLE_LOGIN = {
  email: "sample@demo.com",
  password: "sample@demo.com",
  name: "Sample User",
  timezone: "UTC",
} as const;

export async function seedSampleLogin() {
  const userId = await upsertUser(db, {
    name: SAMPLE_LOGIN.name,
    email: SAMPLE_LOGIN.email,
    timezone: SAMPLE_LOGIN.timezone,
    onboardingCompleted: true,
    isDemo: false,
  });

  const password = await hashPassword(SAMPLE_LOGIN.password);
  const existing = await db
    .select({ id: accounts.id })
    .from(accounts)
    .where(eq(accounts.userId, userId));

  if (existing.length === 0) {
    await db.insert(accounts).values({
      id: uuidv7(),
      accountId: userId,
      providerId: "credential",
      userId,
      password,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  } else {
    for (const row of existing) {
      await db
        .update(accounts)
        .set({ password, updatedAt: new Date() })
        .where(eq(accounts.id, row.id));
    }
  }

  await db.insert(userPreferences).values({ userId, theme: "light" }).onConflictDoNothing();

  return { userId, accounts: existing.length === 0 ? 1 : existing.length };
}

async function main() {
  try {
    process.loadEnvFile();
  } catch {
    /* no .env — DATABASE_URL must already be in the environment */
  }
  if (!process.env.DATABASE_URL) {
    log.error("DATABASE_URL is missing — set it in .env before running pnpm db:sample-login");
    process.exit(1);
  }

  const { userId } = await seedSampleLogin();
  log.info(`sample login: ${SAMPLE_LOGIN.email} / ${SAMPLE_LOGIN.password} (user ${userId})`);
  await pool.end();
}

const entry = process.argv[1]?.replace(/\\/g, "/").split("/").pop();
if (entry === "sample-login.ts") {
  main().catch((error) => {
    log.error("Sample login setup failed", { error });
    process.exit(1);
  });
}
