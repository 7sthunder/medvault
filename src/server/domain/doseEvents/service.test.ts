import { afterAll, describe, expect, it } from "vitest";

import { db, pool } from "@/server/db/client";
import { uuidv7 } from "@/server/db/helpers";
import type { DbTx } from "@/server/db/helpers";
import { doseEvents, medicationSchedules, medications, users } from "@/server/db/schema";
import { eq, and, count } from "drizzle-orm";
import { HORIZON_DAYS } from "@/shared/constants";
import { addLocalDays, localDateKey } from "@/shared/times";

import { ensureDoseEvents, extendHorizon, voidFutureEvents, catchUp } from "./service";

const dbTests = describe.skipIf(!process.env.DATABASE_URL);

class RollbackSignal extends Error {
  constructor() {
    super("expected rollback");
  }
}

async function rollbackTx<T>(fn: (tx: DbTx, userId: string) => Promise<T>): Promise<T> {
  let result: T | undefined;
  try {
    await db.transaction(async (tx) => {
      const [user] = await tx
        .insert(users)
        .values({ id: uuidv7(), name: "Dose Evt Tester", email: `dose-evt-${uuidv7().slice(0, 8)}@medvault.local`, timezone: "UTC" })
        .returning({ id: users.id });
      result = await fn(tx, user!.id);
      throw new RollbackSignal();
    });
  } catch (err) {
    if (err instanceof RollbackSignal) return result as T;
    throw err;
  }
  throw new Error("unreachable");
}

interface SeededMed {
  tx: DbTx;
  userId: string;
  medicationId: string;
  scheduleIds: string[];
}

/** Insert an active med + N enabled 08:00-ish slots directly (bypassing the service). */
async function seedEnabledMed(tx: DbTx, userId: string, startDate = "2026-01-05", slotsByTime = ["08:00", "20:00"]): Promise<SeededMed> {
  const medicationId = uuidv7();
  await tx.insert(medications).values({
    id: medicationId,
    userId,
    name: `ScheduleSeed ${uuidv7().slice(0, 8)}`,
    dosageAmount: "500",
    dosageUnit: "mg",
    status: "active",
    startDate,
  });
  const scheduleIds: string[] = [];
  for (const timeOfDay of slotsByTime) {
    const id = uuidv7();
    scheduleIds.push(id);
    await tx.insert(medicationSchedules).values({ id, medicationId, timeOfDay, enabled: true });
  }
  return { tx, userId, medicationId, scheduleIds };
}

async function countFor(medicationId: string, tx: DbTx): Promise<number> {
  const [row] = await tx
    .select({ n: count() })
    .from(doseEvents)
    .where(eq(doseEvents.medicationId, medicationId));
  return Number(row!.n);
}

/** Whole days between two `YYYY-MM-DD` keys (exclusive end → inclusive window). */
function daysBetween(from: string, to: string): number {
  const ms = new Date(`${to}T00:00:00Z`).getTime() - new Date(`${from}T00:00:00Z`).getTime();
  return Math.round(ms / 86_400_000) + 1;
}

afterAll(async () => {
  await pool.end();
});

dbTests("doseEvents generation engine (§10.2)", () => {
  it(
    "ensureDoseEvents writes 2/day through the horizon (boundary case)",
    async () => {
      await rollbackTx(async (tx, userId) => {
        const { medicationId } = await seedEnabledMed(tx, userId, "2026-01-05", ["08:00", "20:00"]);
        const res = await ensureDoseEvents(tx, { userId, medicationId, timeZone: "UTC", to: "2026-01-08" });
        // 2026-01-05..08 inclusive = 4 days × 2 slots = 8, all new.
        expect(res.ensured).toBe(8);
        expect(res.skipped).toBe(false);
        expect(await countFor(medicationId, tx)).toBe(8);
      });
    },
    30_000,
  );

  it(
    "ensureDoseEvents is idempotent across the default horizon",
    async () => {
      await rollbackTx(async (tx, userId) => {
        const today = addLocalDays(new Date(), 0, "UTC");
        const from = localDateKey(addLocalDays(today, -2, "UTC"), "UTC");
        const to = localDateKey(addLocalDays(today, HORIZON_DAYS, "UTC"), "UTC");

        const { medicationId } = await seedEnabledMed(tx, userId, from, ["08:00"]);
        const first = await ensureDoseEvents(tx, { userId, medicationId, timeZone: "UTC", from, to });
        const days = daysBetween(from, to); // from..to inclusive, 1/day
        expect(first.ensured).toBe(days);
        expect(first.skipped).toBe(false);

        const second = await ensureDoseEvents(tx, { userId, medicationId, timeZone: "UTC", from, to });
        expect(second.ensured).toBe(0); // nothing newly inserted
        expect(await countFor(medicationId, tx)).toBe(days);
      });
    },
    30_000,
  );

  it(
    "voidFutureEvents cancels only unresolved future rows (history survives)",
    async () => {
      await rollbackTx(async (tx, userId) => {
        const { medicationId } = await seedEnabledMed(tx, userId, "2026-01-05", ["08:00"]);
        await ensureDoseEvents(tx, { userId, medicationId, timeZone: "UTC", to: "2026-01-10" });
        const before = await tx
          .select({ id: doseEvents.id, scheduledFor: doseEvents.scheduledFor })
          .from(doseEvents)
          .where(and(eq(doseEvents.medicationId, medicationId), eq(doseEvents.status, "upcoming")));

        // Mark the earliest row "taken" like a resolved past dose.
        const earliest = before.sort((a, b) => a.scheduledFor.getTime() - b.scheduledFor.getTime())[0]!;
        await tx.update(doseEvents).set({ status: "taken", takenAt: new Date() }).where(eq(doseEvents.id, earliest.id));

        const voided = await voidFutureEvents(tx, userId, medicationId, "2026-01-07", "UTC");
        expect(voided).toBeGreaterThanOrEqual(1);
        const remaining = await tx
          .select({ status: doseEvents.status })
          .from(doseEvents)
          .where(eq(doseEvents.medicationId, medicationId));
        expect(remaining.some((r) => r.status === "taken")).toBe(true); // history kept
        expect(remaining.filter((r) => r.status === "canceled").length).toBe(voided);
      });
    },
    30_000,
  );

  it(
    "extendHorizon + catchUp are the same gap-filling pass",
    async () => {
      await rollbackTx(async (tx, userId) => {
        const idA = await seedEnabledMed(tx, userId, "2026-01-05", ["08:00"]);
        await ensureDoseEvents(tx, { userId, medicationId: idA.medicationId, timeZone: "UTC", to: "2026-01-06" });

        const extended = await extendHorizon(tx, userId, "UTC");
        expect(extended.medications).toBe(1);
        expect(extended.ensured).toBeGreaterThan(0);

        const caughtUp = await catchUp(tx, userId, "UTC");
        expect(caughtUp.medications).toBe(1);
      });
    },
    30_000,
  );

  it(
    "paused/archived meds are skipped (no generation)",
    async () => {
      await rollbackTx(async (tx, userId) => {
        const { medicationId } = await seedEnabledMed(tx, userId, "2026-01-05", ["08:00"]);
        await tx.update(medications).set({ status: "paused" }).where(eq(medications.id, medicationId));
        const res = await ensureDoseEvents(tx, { userId, medicationId, timeZone: "UTC" });
        expect(res.skipped).toBe(true);
        expect(res.ensured).toBe(0);
      });
    },
    30_000,
  );
});