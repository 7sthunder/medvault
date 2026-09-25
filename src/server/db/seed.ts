import { log } from "@/lib/log";

import { db, pool } from "./client";
import { seedDemoWorkspace } from "./demo-seed";
import type { Db } from "./helpers";
import { upsertUser } from "./helpers";
import { userPreferences } from "./schema";

/**
 * Phase 05 seed (plan §8/§19): two normal dev users + helper, then the §19 demo workspace.
 * Idempotent — `pnpm db:seed` twice yields identical row counts (verified in `seed.test.ts`).
 */
export const DEV_USERS = [
  { email: "alice@meditrackai.local", name: "Alice Hartono", timezone: "Asia/Kolkata" },
  { email: "bob@meditrackai.local", name: "Bob Mensah", timezone: "Africa/Accra" },
] as const;

export async function seedAll(target: Db = db) {
  for (const u of DEV_USERS) {
    const userId = await upsertUser(target, {
      name: u.name,
      email: u.email,
      timezone: u.timezone,
      onboardingCompleted: true,
      isDemo: false,
    });
    await target
      .insert(userPreferences)
      .values({
        userId,
        theme: "light",
        notificationPrefs: {
          doseReminders: true,
          caregiverMissedAlerts: true,
          insights: true,
          sounds: true,
        },
        caregiverAlertPrefs: {
          missedDoseOn: true,
          adherenceDropThreshold: null,
          dailyDigest: false,
        },
      })
      .onConflictDoNothing();
  }

  const demo = await seedDemoWorkspace(target);
  return { devUsers: DEV_USERS.length, demo };
}

async function main() {
  try {
    process.loadEnvFile();
  } catch {
    /* no .env — DATABASE_URL must already be in the environment */
  }
  if (!process.env.DATABASE_URL) {
    log.error("DATABASE_URL is missing — set it in .env before running pnpm db:seed");
    process.exit(1);
  }

  const { devUsers, demo } = await seedAll();
  log.info(`seed: ${devUsers} dev users + preferences`);
  log.info(
    `seed: demo workspace (${demo.scheduled} scheduled / ${demo.taken} taken / ${demo.missed} missed / ${demo.skipped} skipped / ${demo.snoozed} snoozed)`,
  );
  await pool.end();
}

const entry = process.argv[1]?.replace(/\\/g, "/").split("/").pop();
if (entry === "seed.ts") {
  main().catch((error) => {
    log.error("Database seed failed", { error });
    process.exit(1);
  });
}
