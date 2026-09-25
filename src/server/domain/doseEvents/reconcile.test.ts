import { afterAll, describe, expect, it } from "vitest";
import { and, eq } from "drizzle-orm";

import { db, pool } from "@/server/db/client";
import { uuidv7 } from "@/server/db/helpers";
import type { DbTx } from "@/server/db/helpers";
import {
  doseActions,
  doseEvents,
  medications,
  notifications,
  userPreferences,
  users,
} from "@/server/db/schema";

import { reconcileUser } from "./reconcile";

const dbTests = describe.skipIf(!process.env.DATABASE_URL);

/** Fixed clock so every deadline assertion is deterministic. */
const T = new Date("2026-03-10T08:00:00.000Z");
const MIN = 60_000;

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
        .values({
          id: uuidv7(),
          name: "Reconcile Tester",
          email: `reconcile-${uuidv7().slice(0, 8)}@medvault.local`,
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

interface SeedOptions {
  remindersEnabled?: boolean;
  notificationPrefs?: Record<string, boolean>;
}

async function seedEvent(
  tx: DbTx,
  userId: string,
  scheduledFor: Date,
  opts: SeedOptions = {},
): Promise<string> {
  const medicationId = uuidv7();
  await tx.insert(medications).values({
    id: medicationId,
    userId,
    name: "Metformin",
    dosageAmount: "500",
    dosageUnit: "mg",
    status: "active",
    startDate: "2026-03-01",
    remindersEnabled: opts.remindersEnabled ?? true,
  });
  if (opts.notificationPrefs) {
    await tx.insert(userPreferences).values({ userId, notificationPrefs: opts.notificationPrefs });
  }
  const eventId = uuidv7();
  await tx
    .insert(doseEvents)
    .values({ id: eventId, userId, medicationId, scheduledFor, status: "upcoming" });
  return eventId;
}

async function notificationTypes(tx: DbTx, userId: string): Promise<string[]> {
  const rows = await tx
    .select({ type: notifications.type })
    .from(notifications)
    .where(eq(notifications.userId, userId));
  return rows.map((r) => r.type);
}

async function statusOf(tx: DbTx, eventId: string): Promise<string | undefined> {
  const [row] = await tx
    .select({ status: doseEvents.status })
    .from(doseEvents)
    .where(eq(doseEvents.id, eventId));
  return row?.status;
}

afterAll(async () => {
  await pool.end();
});

dbTests("reconcile status machine + reminder producers (§10.3)", () => {
  it("emits one upcoming_dose reminder inside the lead window and dedupes repeats", async () => {
    await rollbackTx(async (tx, userId) => {
      const eventId = await seedEvent(tx, userId, T);
      const insideWindow = new Date(T.getTime() - 3 * MIN);

      const first = await reconcileUser(tx, userId, { now: insideWindow });
      expect(first.scanned).toBe(1);
      expect(first.reconciled).toBe(0);
      expect(await notificationTypes(tx, userId)).toEqual(["upcoming_dose"]);

      const second = await reconcileUser(tx, userId, { now: insideWindow });
      expect(second.reconciled).toBe(0);
      expect(await notificationTypes(tx, userId)).toEqual(["upcoming_dose"]);
      expect(await statusOf(tx, eventId)).toBe("upcoming");
    });
  }, 30_000);

  it("stays silent before the lead window opens", async () => {
    await rollbackTx(async (tx, userId) => {
      await seedEvent(tx, userId, T);
      const early = new Date(T.getTime() - 20 * MIN);
      const result = await reconcileUser(tx, userId, { now: early });
      expect(result.reconciled).toBe(0);
      expect(await notificationTypes(tx, userId)).toEqual([]);
    });
  }, 30_000);

  it("flips upcoming → due at the scheduled instant and emits due_dose", async () => {
    await rollbackTx(async (tx, userId) => {
      const eventId = await seedEvent(tx, userId, T);
      const at = new Date(T.getTime() + 1 * MIN);
      const result = await reconcileUser(tx, userId, { now: at });
      expect(result.reconciled).toBe(1);
      expect(await statusOf(tx, eventId)).toBe("due");
      expect(await notificationTypes(tx, userId)).toEqual(["due_dose"]);
    });
  }, 30_000);

  it("records a missed transition, dose action and missed_dose alert past the deadline", async () => {
    await rollbackTx(async (tx, userId) => {
      const eventId = await seedEvent(tx, userId, T);
      const at = new Date(T.getTime() + 31 * MIN);
      const result = await reconcileUser(tx, userId, { now: at });
      expect(result.missed).toBe(1);
      expect(await statusOf(tx, eventId)).toBe("missed");

      const actions = await tx
        .select({ action: doseActions.action })
        .from(doseActions)
        .where(and(eq(doseActions.userId, userId), eq(doseActions.doseEventId, eventId)));
      expect(actions.map((a) => a.action)).toEqual(["missed_auto"]);
      expect(await notificationTypes(tx, userId)).toEqual(["missed_dose"]);
    });
  }, 30_000);

  it("respects per-medication remindersEnabled = false", async () => {
    await rollbackTx(async (tx, userId) => {
      await seedEvent(tx, userId, T, { remindersEnabled: false });
      const result = await reconcileUser(tx, userId, { now: new Date(T.getTime() - 3 * MIN) });
      expect(result.scanned).toBe(1);
      expect(await notificationTypes(tx, userId)).toEqual([]);
    });
  }, 30_000);

  it("respects the user doseReminders preference gate", async () => {
    await rollbackTx(async (tx, userId) => {
      await seedEvent(tx, userId, T, {
        notificationPrefs: {
          doseReminders: false,
          caregiverMissedAlerts: true,
          insights: true,
          sounds: true,
        },
      });
      const result = await reconcileUser(tx, userId, { now: new Date(T.getTime() - 3 * MIN) });
      expect(result.scanned).toBe(1);
      expect(await notificationTypes(tx, userId)).toEqual([]);
    });
  }, 30_000);
});
