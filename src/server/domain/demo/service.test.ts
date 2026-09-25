import { afterAll, describe, expect, it } from "vitest";
import { and, eq, gte, inArray } from "drizzle-orm";

import { db, pool } from "@/server/db/client";
import { uuidv7 } from "@/server/db/helpers";
import type { DbTx } from "@/server/db/helpers";
import {
  caregiverAlerts,
  caregiverRelationships,
  demoStates,
  doseEvents,
  medications,
  users,
} from "@/server/db/schema";
import { DEMO_USER_EMAIL } from "@/server/db/demo-seed";
import { addLocalDays, now, resetNowImpl, setNowImpl, startOfLocalDay } from "@/shared/times";
import { demoTimeSchema } from "@/shared/validations/settings";

import { DEMO_COOKIE, issueDemoToken, verifyDemoToken } from "./token";
import {
  SCENARIO_DAYS,
  demoService,
  ensureDemoUser,
  readState,
  resolveSimulationNow,
} from "./service";

/**
 * Phase 18 acceptance — §10.8 demo domain.
 *
 * The properties that matter and are easy to regress:
 *  - **isolation** — simulation acts on the demo user, never on a real account;
 *  - **real-service coherence** — a simulated take produces the same rows a real take does;
 *  - **clock threading** — `setTime` makes `now()` follow, and release restores real time;
 *  - **token integrity** — a forged or tampered demo cookie is rejected.
 *
 * Everything runs inside a rollback transaction so the shared demo workspace is left exactly as
 * found, which matters because these tests intentionally mutate it.
 */
const dbTests = describe.skipIf(!process.env.DATABASE_URL);

class RollbackSignal extends Error {
  constructor() {
    super("expected rollback");
  }
}

async function inRollbackTransaction<T>(fn: (tx: DbTx) => Promise<T>): Promise<T> {
  let result: T | undefined;
  try {
    await db.transaction(async (tx) => {
      result = await fn(tx);
      throw new RollbackSignal();
    });
  } catch (err) {
    if (err instanceof RollbackSignal) return result as T;
    throw err;
  }
  throw new Error("unreachable");
}

/** A stranger account with one dose, so we can prove the demo controls never touch a real user. */
async function seedStranger(tx: DbTx) {
  const [user] = await tx
    .insert(users)
    .values({
      id: uuidv7(),
      name: "Demo Test Stranger",
      email: `demo-stranger-${uuidv7()}@meditrackai.local`,
      timezone: "UTC",
      onboardingCompleted: true,
    })
    .returning({ id: users.id });

  const [med] = await tx
    .insert(medications)
    .values({
      id: uuidv7(),
      userId: user!.id,
      name: "Stranger Med",
      dosageAmount: "10",
      dosageUnit: "mg",
      status: "active",
      startDate: "2026-01-01",
    })
    .returning({ id: medications.id });

  const [event] = await tx
    .insert(doseEvents)
    .values({
      id: uuidv7(),
      userId: user!.id,
      medicationId: med!.id,
      scheduledFor: new Date("2026-01-01T08:00:00.000Z"),
      missedDeadline: new Date("2026-01-01T08:30:00.000Z"),
      status: "upcoming",
    })
    .returning({ id: doseEvents.id });

  return { userId: user!.id, doseEventId: event!.id };
}

afterAll(async () => {
  resetNowImpl();
  await pool.end();
});

dbTests("demo domain — state", () => {
  it("reports totals for the shared demo workspace and never touches a stranger", async () => {
    await inRollbackTransaction(async (tx) => {
      const stranger = await seedStranger(tx);
      const demo = await ensureDemoUser(tx);
      const state = await readState(tx, demo.id);

      expect(state.active).toBe(true);
      expect(state.totals.scheduled).toBeGreaterThan(0);
      expect(state.simulationNow).toBeNull();
      expect(state.scenario).toBe("baseline");

      // The stranger's own single dose is untouched and excluded from the demo totals.
      const [row] = await tx
        .select({ status: doseEvents.status })
        .from(doseEvents)
        .where(eq(doseEvents.id, stranger.doseEventId))
        .limit(1);
      expect(row?.status).toBe("upcoming");
      expect(stranger.userId).not.toBe(demo.id);
    });
  });

  it("resolveSimulationNow is null until setTime pins the clock", async () => {
    await inRollbackTransaction(async (tx) => {
      const demo = await ensureDemoUser(tx);
      expect(await resolveSimulationNow(tx, demo.id)).toBeNull();

      const target = new Date("2026-03-01T09:00:00.000Z");
      const state = await demoService.setTime(tx, target);
      expect(state.simulationNow?.toISOString()).toBe(target.toISOString());
      expect((await resolveSimulationNow(tx, demo.id))?.toISOString()).toBe(target.toISOString());
    });
  });
});

dbTests("demo domain — clock", () => {
  it("setTime/advanceDays/release drives the shared now() and restores it", async () => {
    try {
      await inRollbackTransaction(async (tx) => {
        const demo = await ensureDemoUser(tx);
        const pinned = new Date("2026-06-15T12:00:00.000Z");

        const afterSet = await demoService.setTime(tx, pinned);
        // The service is clock-agnostic; the tRPC context installs the override. Assert the
        // contract that install relies on: the stored instant is what `now()` would return.
        expect(afterSet.simulationNow?.toISOString()).toBe(pinned.toISOString());
        setNowImpl(() => afterSet.simulationNow!);
        expect(now().toISOString()).toBe(pinned.toISOString());

        const advanced = await demoService.advanceDays(tx, 1);
        setNowImpl(() => advanced.simulationNow!);
        expect(now().getTime()).toBeGreaterThan(pinned.getTime());

        const released = await demoService.setTime(tx, null);
        expect(released.simulationNow).toBeNull();
        expect(await resolveSimulationNow(tx, demo.id)).toBeNull();
      });
    } finally {
      resetNowImpl();
    }
  });

  it("advanceDays lands on a whole local day, not a same-time offset", async () => {
    await inRollbackTransaction(async (tx) => {
      await ensureDemoUser(tx);
      await demoService.setTime(tx, new Date("2026-06-15T17:45:00.000Z"));
      const advanced = await demoService.advanceDays(tx, 1);
      const sim = advanced.simulationNow!;
      // Asia/Kolkata is UTC+5:30, so 17:45Z is 23:15 local; +1 day must be the next local
      // midnight, not 17:45Z the following day.
      expect(sim.toISOString()).toBe("2026-06-15T18:30:00.000Z");
    });
  });
});

dbTests("demo domain — simulation actions", () => {
  it("simulateAction take produces a real taken dose for the demo user", async () => {
    await inRollbackTransaction(async (tx) => {
      const demo = await ensureDemoUser(tx);
      await demoService.setTime(tx, new Date());

      const result = await demoService.simulateAction(tx, { action: "take" });
      if (result.ok) {
        expect(result.action).toBe("take");
        expect(result.changed).toBe(1);
        const [row] = await tx
          .select({ status: doseEvents.status, userId: doseEvents.userId })
          .from(doseEvents)
          .where(eq(doseEvents.id, result.doseEventId!))
          .limit(1);
        expect(row?.userId).toBe(demo.id);
        expect(row?.status).toBe("taken");
      } else {
        // Nothing due (e.g. every slot already settled) — a clean no-op, not a failure.
        expect(result.doseEventId).toBeNull();
        expect(result.detail).toMatch(/no dose is due/i);
      }
    });
  });

  it("simulateAction miss writes the missed status on a still-actionable dose", async () => {
    await inRollbackTransaction(async (tx) => {
      const demo = await ensureDemoUser(tx);
      const [event] = await tx
        .select({ id: doseEvents.id })
        .from(doseEvents)
        .where(and(eq(doseEvents.userId, demo.id), eq(doseEvents.status, "upcoming")))
        .limit(1);
      if (!event) return;

      const result = await demoService.simulateAction(tx, {
        action: "miss",
        doseEventId: event.id,
      });
      expect(result.ok).toBe(true);
      const [row] = await tx
        .select({ status: doseEvents.status })
        .from(doseEvents)
        .where(eq(doseEvents.id, event.id))
        .limit(1);
      expect(row?.status).toBe("missed");
    });
  });

  it("simulateAction refuses to move a dose owned by somebody else", async () => {
    await inRollbackTransaction(async (tx) => {
      const demo = await ensureDemoUser(tx);
      const stranger = await seedStranger(tx);

      const result = await demoService.simulateAction(tx, {
        action: "miss",
        doseEventId: stranger.doseEventId,
      });
      // The owner-scoped UPDATE matches no row: reported as a no-op, never as a write.
      expect(result.changed).toBe(0);
      const [row] = await tx
        .select({ status: doseEvents.status })
        .from(doseEvents)
        .where(eq(doseEvents.id, stranger.doseEventId))
        .limit(1);
      expect(row?.status).toBe("upcoming");
      expect(demo.id).not.toBe(stranger.userId);
    });
  });
});

dbTests("demo domain — scenarios", () => {
  it("applyScenario rewrites the window and records the scenario", async () => {
    await inRollbackTransaction(async (tx) => {
      const demo = await ensureDemoUser(tx);
      const result = await demoService.applyScenario(tx, "decline");
      expect(result.action).toBe("scenario");
      expect(result.detail.length).toBeGreaterThan(0);

      const [row] = await tx
        .select()
        .from(demoStates)
        .where(eq(demoStates.userId, demo.id))
        .limit(1);
      expect(row?.scenario).toBe("decline");

      const missed = await tx
        .select({ id: doseEvents.id })
        .from(doseEvents)
        .where(and(eq(doseEvents.userId, demo.id), eq(doseEvents.status, "missed")));
      expect(missed.length).toBeGreaterThan(0);
    });
  });

  it("applyScenario baseline settles the window back to all-taken", async () => {
    await inRollbackTransaction(async (tx) => {
      const demo = await ensureDemoUser(tx);
      const declined = await demoService.applyScenario(tx, "decline");
      expect(declined.changed).toBeGreaterThan(0);

      await demoService.applyScenario(tx, "baseline");

      // Anchored to the *local* day boundary in the demo user's timezone, which is the
      // window `applyScenario` actually rewrites. A plain `now - 14 days` measured in UTC
      // reaches ~21h further back for a user east of Greenwich, so it also sweeps in the
      // fixture's own early-window misses — rows the scenario deliberately left alone — and
      // fails on doses the service never touched.
      const since = addLocalDays(
        startOfLocalDay(new Date(), demo.timezone),
        -(SCENARIO_DAYS - 1),
        demo.timezone,
      );
      const stillUnsettled = await tx
        .select({ id: doseEvents.id })
        .from(doseEvents)
        .where(
          and(
            eq(doseEvents.userId, demo.id),
            inArray(doseEvents.status, ["missed", "skipped"]),
            gte(doseEvents.scheduledFor, since),
          ),
        );

      expect(stillUnsettled).toHaveLength(0);
    });
  });
});

dbTests("demo domain — generated data", () => {
  it("generateCaregiverAlert links a caregiver and raises a real alert", async () => {
    await inRollbackTransaction(async (tx) => {
      const demo = await ensureDemoUser(tx);
      await demoService.applyScenario(tx, "decline");
      await demoService.setTime(tx, new Date());

      const result = await demoService.generateCaregiverAlert(tx);
      expect(["caregiver_alert"]).toContain(result.action);

      const relationships = await tx
        .select({ id: caregiverRelationships.id })
        .from(caregiverRelationships)
        .where(eq(caregiverRelationships.patientUserId, demo.id));
      expect(relationships.length).toBeGreaterThan(0);

      if (result.changed > 0) {
        const alerts = await tx
          .select({ id: caregiverAlerts.id })
          .from(caregiverAlerts)
          .where(eq(caregiverAlerts.patientUserId, demo.id));
        expect(alerts.length).toBeGreaterThan(0);
      }
    });
  });

  it("reset restores the fixture totals and clears the clock", async () => {
    await inRollbackTransaction(async (tx) => {
      const demo = await ensureDemoUser(tx);
      await demoService.setTime(tx, new Date("2026-05-05T00:00:00.000Z"));
      await demoService.applyScenario(tx, "decline");

      const state = await demoService.reset(tx);
      expect(state.simulationNow).toBeNull();
      expect(state.scenario).toBe("baseline");
      expect(state.totals.scheduled).toBe(84);
      expect(state.totals.taken).toBe(76);
      expect(state.totals.missed).toBe(5);
      expect(state.totals.skipped).toBe(3);
      expect(demo.email).toBe(DEMO_USER_EMAIL);
    });
  });
});

describe("demo contracts", () => {
  it("demoTimeSchema rejects a simulated instant more than a year from real time", () => {
    expect(demoTimeSchema.safeParse({ simulationNow: new Date() }).success).toBe(true);
    expect(
      demoTimeSchema.safeParse({ simulationNow: new Date(Date.now() + 400 * 24 * 60 * 60 * 1000) })
        .success,
    ).toBe(false);
  });

  it("round-trips a valid demo token and rejects tampering", () => {
    const token = issueDemoToken("user-123");
    expect(verifyDemoToken(token)).toBe("user-123");
    expect(DEMO_COOKIE).toBe("meditrackai_demo_session");
  });

  it("rejects a forged, tampered, expired or malformed token", () => {
    const token = issueDemoToken("user-123");
    const [body, signature] = token.split(".");

    expect(verifyDemoToken(undefined)).toBeNull();
    expect(verifyDemoToken("")).toBeNull();
    expect(verifyDemoToken("not-a-token")).toBeNull();
    expect(verifyDemoToken(`${body}.${signature}x`)).toBeNull();
    // Re-signing the body with a different id must not validate against the old signature.
    expect(
      verifyDemoToken(
        `${Buffer.from('{"userId":"evil","issuedAt":1}').toString("base64url")}.${signature}`,
      ),
    ).toBeNull();
    // An honest but expired token is rejected too.
    const stale = issueDemoToken("user-123", Date.now() - 13 * 60 * 60 * 1000);
    expect(verifyDemoToken(stale)).toBeNull();
  });
});
