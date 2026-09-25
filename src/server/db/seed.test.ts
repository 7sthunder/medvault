import { afterAll, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import type { AnyPgTable } from "drizzle-orm/pg-core";

import { db, pool } from "./client";
import { demoTotals, seedDemoWorkspace } from "./demo-seed";
import { INSERT_SCHEMAS } from "./insert-schemas";
import { seedAll } from "./seed";
import {
  adherenceDaily,
  aiInsights,
  caregiverAlerts,
  caregiverInvitations,
  caregiverRelationships,
  demoStates,
  doseActions,
  doseEvents,
  medicationSchedules,
  medications,
  notifications,
  userPreferences,
  users,
} from "./schema";

// The `client` module loads `.env` at import time; these tests only run when a real
// DATABASE_URL (Supabase) is present so `pnpm test` stays green without one in CI.
const dbTests = describe.skipIf(!process.env.DATABASE_URL);

async function countRows(table: AnyPgTable): Promise<number> {
  const rows = await db.select().from(table);
  return rows.length;
}

async function snapshotCounts() {
  return {
    users: await countRows(users),
    medications: await countRows(medications),
    medicationSchedules: await countRows(medicationSchedules),
    doseEvents: await countRows(doseEvents),
    doseActions: await countRows(doseActions),
    adherenceDaily: await countRows(adherenceDaily),
    aiInsights: await countRows(aiInsights),
    notifications: await countRows(notifications),
    demoStates: await countRows(demoStates),
    userPreferences: await countRows(userPreferences),
    caregiverAlerts: await countRows(caregiverAlerts),
    caregiverInvitations: await countRows(caregiverInvitations),
    caregiverRelationships: await countRows(caregiverRelationships),
  };
}

afterAll(async () => {
  await pool.end();
});

dbTests("seed runs twice and leaves identical row counts", () => {
  it("row counts are stable across a second seed", async () => {
    await seedAll(db);
    const first = await snapshotCounts();
    await seedAll(db);
    const second = await snapshotCounts();

    expect(second).toEqual(first);
    expect(second.users).toBeGreaterThanOrEqual(3); // Alice, Bob + demo Arun Kumar
  }, 60_000);
});

dbTests("§19 demo totals are exact", () => {
  it("matches the §19 acceptance numbers", async () => {
    await seedDemoWorkspace(db);
    const t = await demoTotals(db);

    expect(t).not.toBeNull();
    expect(t!.scheduled).toBe(84);
    expect(t!.taken).toBe(76);
    expect(t!.missed).toBe(5);
    expect(t!.skipped).toBe(3);
    expect(t!.snoozedEvents).toBe(8);
    expect(t!.snoozeActions).toBe(8);
    expect(t!.streakDays).toBe(7);
    expect(t!.dayRows).toBe(17);
    expect(t!.percent).toBe(90.5);
  }, 60_000);
});

dbTests("demo user has a medication named after §19 (Arun Kumar / Metformin)", () => {
  it("seeds the four demo medications", async () => {
    await seedDemoWorkspace(db);
    const demoUser = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, "arun@medvault.local"))
      .limit(1);
    expect(demoUser.length).toBe(1);
    const meds = await db.select().from(medications).where(eq(medications.userId, demoUser[0]!.id));
    const names = meds.map((m) => m.name);
    expect(names).toContain("Metformin");
    expect(names).toContain("Vitamin D");
  }, 60_000);
});

dbTests("insert-schemas", () => {
  it("every table has a zod-validated insert demo row (and rejects empty)", () => {
    expect(INSERT_SCHEMAS.length).toBe(16);
    for (const entry of INSERT_SCHEMAS) {
      expect(entry.schema.safeParse(entry.demoRow).success, entry.name).toBe(true);
      expect(entry.schema.safeParse({}).success, entry.name).toBe(false);
    }
  });
});
