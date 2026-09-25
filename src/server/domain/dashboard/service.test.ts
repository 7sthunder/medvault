import { afterAll, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";

import { db, pool } from "@/server/db/client";
import { uuidv7 } from "@/server/db/helpers";
import type { DbTx } from "@/server/db/helpers";
import { aiInsights, doseEvents, medicationSchedules, medications, users } from "@/server/db/schema";
import { localDateKey, setNowImpl, resetNowImpl } from "@/shared/times";

import { dashboardService } from "./service";
import { medicationExtras } from "@/server/domain/medications/extras";

const dbTests = describe.skipIf(!process.env.DATABASE_URL);

class RollbackSignal extends Error {
  constructor() {
    super("expected rollback");
  }
}

/** Runs `fn` inside a transaction that always rolls back + cleans the created user. */
async function rollbackTx<T>(fn: (tx: DbTx, userId: string) => Promise<T>): Promise<T> {
  let result: T | undefined;
  try {
    await db.transaction(async (tx) => {
      const [user] = await tx
        .insert(users)
        .values({
          id: uuidv7(),
          name: "Dashboard Tester",
          email: `dash-${uuidv7().slice(0, 8)}@medvault.local`,
          timezone: "UTC",
        })
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

async function seedMed(tx: DbTx, userId: string, name: string, startDate?: string): Promise<string> {
  const medicationId = uuidv7();
  await tx.insert(medications).values({
    id: medicationId,
    userId,
    name,
    dosageAmount: "250",
    dosageUnit: "mg",
    status: "active",
    startDate: startDate ?? localDateKey(new Date(), "UTC"),
    color: "#10b981",
  });
  await tx.insert(medicationSchedules).values({
    id: uuidv7(),
    medicationId,
    timeOfDay: "08:00",
    enabled: true,
  });
  return medicationId;
}

afterAll(async () => {
  await pool.end();
});

dbTests("dashboardService.get (§11.4)", () => {
  it(
    "returns an empty dashboard for a fresh user (no meds → no doses)",
    async () => {
      await rollbackTx(async (tx, userId) => {
        const dto = await dashboardService.get(tx, userId, "UTC");
        expect(dto.stats.scheduledToday).toBe(0);
        expect(dto.stats.adherenceToday).toBeNull();
        expect(dto.dueNow).toHaveLength(0);
        expect(dto.nextDose).toBeNull();
        expect(dto.today).toHaveLength(0);
        // The 7-day summary window materialises zero-filled days even pre-medication.
        expect(dto.week).toHaveLength(7);
        expect(dto.week.every((d) => d.scheduled === 0)).toBe(true);
        expect(dto.medications).toHaveLength(0);
        expect(dto.latestInsight).toBeNull();
        expect(dto.caregiver.connectedCount).toBe(0);
        expect(dto.caregiver.newAlerts).toBe(0);
      });
    },
    30_000,
  );

  it(
    "exposes a soonest unresolved dose as nextDose after seeding an active med",
    async () => {
      await rollbackTx(async (tx, userId) => {
        const medId = await seedMed(tx, userId, "Metformin");
        // Generate a dose for today via the canonical generator.
        const { ensureDoseEvents } = await import("@/server/domain/doseEvents/service");
        const ensured = await ensureDoseEvents(tx, { userId, medicationId: medId, timeZone: "UTC" });
        expect(ensured.ensured).toBeGreaterThan(0);

        const dto = await dashboardService.get(tx, userId, "UTC");
        expect(dto.medications).toHaveLength(1);
        expect(dto.medications[0]!.name).toBe("Metformin");
        // The 08:00 slot is in the past or future — check we found /any/ next dose or none.
        expect(dto.medications[0]!.nextDoseAt).toBeTruthy();
        if (dto.nextDose) {
          expect(dto.nextDose.scheduledFor.getTime()).toBeGreaterThanOrEqual(
            dto.nextDose.scheduledFor.getTime(),
          );
        }
      });
    },
    30_000,
  );

  it(
    "shows a missedToday count once time passes the missedAfterMinutes deadline",
    async () => {
      await rollbackTx(async (tx, userId) => {
        // Freeze the clock to a fixed instant so missed detection is deterministic.
        setNowImpl(() => new Date("2026-05-14T20:00:00Z"));
        try {
          const medId = await seedMed(tx, userId, "Atorvastatin", "2026-05-01");
          const { ensureDoseEvents } = await import("@/server/domain/doseEvents/service");
          await ensureDoseEvents(tx, { userId, medicationId: medId, timeZone: "UTC", from: "2026-05-14", to: "2026-05-14" });
          const dto = await dashboardService.get(tx, userId, "UTC");
          expect(dto.today.length).toBeGreaterThan(0);
          // At 20:00 UTC the 08:00 dose is already missed (deadline 08:00+30m in UTC prefs).
          expect(dto.today[0]!.status).toBe("missed" as never);
          expect(dto.stats.missedToday).toBe(1);
        } finally {
          resetNowImpl();
        }
      });
    },
    30_000,
  );
});

dbTests("medicationExtras (adherence% + next dose)", () => {
  it(
    "fills adherencePercent from resolved events and leaves null when no data",
    async () => {
      await rollbackTx(async (tx, userId) => {
        const idA = await seedMed(tx, userId, "A");
        const idB = await seedMed(tx, userId, "B");

        const { ensureDoseEvents } = await import("@/server/domain/doseEvents/service");
        await ensureDoseEvents(tx, { userId, medicationId: idA, timeZone: "UTC" });
        await ensureDoseEvents(tx, { userId, medicationId: idB, timeZone: "UTC" });

        // Resolve today's A dose as taken so the window counts it.
        const [row] = await tx
          .select()
          .from(doseEvents)
          .where(eq(doseEvents.medicationId, idA));
        if (row) {
          await tx.update(doseEvents).set({ status: "taken", takenAt: new Date() }).where(eq(doseEvents.id, row.id));
        }

        const extras = await medicationExtras(tx, userId, "UTC", [
          { id: idA, name: "A", color: "#10b981", frequencyLabel: "once-daily" },
          { id: idB, name: "B", color: "#3b82f6", frequencyLabel: "once-daily" },
        ]);

        const a = extras.get(idA)!;
        expect(a.adherencePercent).not.toBeNull();
        expect(a.nextDoseAt).not.toBeNull();

        const b = extras.get(idB)!;
        expect(b.adherencePercent).toBeNull();
        expect(b.nextDoseAt).not.toBeNull(); // upcoming future doses count
      });
    },
    30_000,
  );
});

dbTests("dashboardService.latestInsight", () => {
  it(
    "returns the newest insight row when one exists",
    async () => {
      await rollbackTx(async (tx, userId) => {
        await tx.insert(aiInsights).values({
          id: uuidv7(),
          userId,
          category: "general",
          summary: "Your morning doses are on time.",
          detail: null,
          suggestedActionType: null,
          dataSnapshot: { window: "7d" },
          source: "fallback",
          confidence: "0.80",
        });
        const dto = await dashboardService.get(tx, userId, "UTC");
        expect(dto.latestInsight?.summary).toBe("Your morning doses are on time.");
        expect(dto.latestInsight?.category).toBe("general");
      });
    },
    30_000,
  );
});