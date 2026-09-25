import { afterAll, describe, expect, it } from "vitest";

import { db, pool } from "@/server/db/client";
import { uuidv7 } from "@/server/db/helpers";
import type { DbTx } from "@/server/db/helpers";
import { doseActions, doseEvents, medications, users } from "@/server/db/schema";
import type { DoseActionType, DoseEventStatus } from "@/shared/enums";

import { historyService } from "./service";

const dbTests = describe.skipIf(!process.env.DATABASE_URL);

async function inRollbackTransaction<T>(
  name: string,
  email: string,
  fn: (tx: DbTx, userId: string) => Promise<T>,
): Promise<T> {
  let caught: Error | null = null;
  let result: T | undefined;
  try {
    await db.transaction(async (tx) => {
      const [user] = await tx
        .insert(users)
        .values({ id: uuidv7(), name, email, timezone: "UTC", onboardingCompleted: true })
        .returning({ id: users.id });
      result = await fn(tx, user!.id);
      throw new RollbackSignal();
    });
  } catch (err) {
    if (err instanceof RollbackSignal) return result as T;
    caught = err as Error;
  }
  throw caught ?? new Error("transaction did not run");
}

class RollbackSignal extends Error {
  constructor() {
    super("expected rollback");
  }
}

async function seedMedication(
  tx: DbTx,
  userId: string,
  name: string,
  archivedAt: Date | null = null,
) {
  const [med] = await tx
    .insert(medications)
    .values({
      id: uuidv7(),
      userId,
      name,
      dosageAmount: "500",
      dosageUnit: "mg",
      status: archivedAt ? "active" : "active",
      startDate: "2026-01-01",
      archivedAt,
    })
    .returning({ id: medications.id });
  return med!.id;
}

async function seedDose(
  tx: DbTx,
  userId: string,
  medicationId: string,
  opts: {
    scheduledFor: Date;
    status: DoseEventStatus;
    action?: DoseActionType;
    occurredAt?: Date;
    meta?: Record<string, unknown>;
  },
) {
  const [event] = await tx
    .insert(doseEvents)
    .values({
      id: uuidv7(),
      userId,
      medicationId,
      scheduledFor: opts.scheduledFor,
      status: opts.status,
    })
    .returning({ id: doseEvents.id });
  if (opts.action) {
    await tx.insert(doseActions).values({
      id: uuidv7(),
      userId,
      doseEventId: event!.id,
      action: opts.action,
      occurredAt: opts.occurredAt ?? opts.scheduledFor,
      meta: opts.meta ?? null,
    });
  }
  return event!.id;
}

afterAll(async () => {
  await pool.end();
});

dbTests("historyService (§11.10)", () => {
  it("returns newest-first actions with a resolved medication", async () => {
    await inRollbackTransaction("Hist One", "hist-one@medvault.local", async (tx, userId) => {
      const medId = await seedMedication(tx, userId, "Metformin");
      await seedDose(tx, userId, medId, {
        scheduledFor: new Date("2026-05-01T08:00:00Z"),
        status: "taken",
        action: "take",
        occurredAt: new Date("2026-05-01T08:05:00Z"),
      });
      await seedDose(tx, userId, medId, {
        scheduledFor: new Date("2026-05-02T08:00:00Z"),
        status: "missed",
        action: "missed_auto",
        occurredAt: new Date("2026-05-02T08:30:00Z"),
      });

      const page = await historyService.query(tx, userId, "UTC", { limit: 10 });
      expect(page.items).toHaveLength(2);
      expect(page.items[0]!.occurredAt.getTime()).toBeGreaterThan(
        page.items[1]!.occurredAt.getTime(),
      );
      expect(page.items[0]!.medication.name).toBe("Metformin");
      expect(page.nextCursor).toBeNull();
    });
  });

  it("status=taken includes take-late events (event status stays taken)", async () => {
    await inRollbackTransaction("Hist Two", "hist-two@medvault.local", async (tx, userId) => {
      const medId = await seedMedication(tx, userId, "Metformin");
      await seedDose(tx, userId, medId, {
        scheduledFor: new Date("2026-05-01T08:00:00Z"),
        status: "taken",
        action: "take",
        occurredAt: new Date("2026-05-01T08:05:00Z"),
        meta: { takenLate: true },
      });
      await seedDose(tx, userId, medId, {
        scheduledFor: new Date("2026-05-02T08:00:00Z"),
        status: "missed",
        action: "missed_auto",
        occurredAt: new Date("2026-05-02T08:30:00Z"),
      });

      const taken = await historyService.query(tx, userId, "UTC", { status: "taken", limit: 10 });
      expect(taken.items).toHaveLength(1);
      expect(taken.items[0]!.eventStatus).toBe("taken");

      const missed = await historyService.query(tx, userId, "UTC", { status: "missed", limit: 10 });
      expect(missed.items).toHaveLength(1);
      expect(missed.items[0]!.eventStatus).toBe("missed");
    });
  });

  it("status=snoozed returns snooze audit rows", async () => {
    await inRollbackTransaction("Hist Three", "hist-three@medvault.local", async (tx, userId) => {
      const medId = await seedMedication(tx, userId, "Vitamin D");
      // A dose that was snoozed then taken: final status taken, but snooze rows exist.
      await seedDose(tx, userId, medId, {
        scheduledFor: new Date("2026-05-01T09:00:00Z"),
        status: "taken",
        action: "snooze",
        occurredAt: new Date("2026-05-01T09:00:00Z"),
      });
      await seedDose(tx, userId, medId, {
        scheduledFor: new Date("2026-05-02T09:00:00Z"),
        status: "taken",
        action: "take",
        occurredAt: new Date("2026-05-02T09:01:00Z"),
      });

      const snoozed = await historyService.query(tx, userId, "UTC", {
        status: "snoozed",
        limit: 10,
      });
      expect(snoozed.items).toHaveLength(1);
      expect(snoozed.items[0]!.action).toBe("snooze");
    });
  });

  it("filters by medicationId", async () => {
    await inRollbackTransaction("Hist Four", "hist-four@medvault.local", async (tx, userId) => {
      const a = await seedMedication(tx, userId, "Metformin");
      const b = await seedMedication(tx, userId, "Lisinopril");
      await seedDose(tx, userId, a, {
        scheduledFor: new Date("2026-05-01T08:00:00Z"),
        status: "taken",
        action: "take",
        occurredAt: new Date("2026-05-01T08:05:00Z"),
      });
      await seedDose(tx, userId, b, {
        scheduledFor: new Date("2026-05-02T08:00:00Z"),
        status: "taken",
        action: "take",
        occurredAt: new Date("2026-05-02T08:05:00Z"),
      });

      const page = await historyService.query(tx, userId, "UTC", { medicationId: a, limit: 10 });
      expect(page.items).toHaveLength(1);
      expect(page.items[0]!.medication.name).toBe("Metformin");
    });
  });

  it("cursor pagination returns successive pages", async () => {
    await inRollbackTransaction("Hist Five", "hist-five@medvault.local", async (tx, userId) => {
      const medId = await seedMedication(tx, userId, "Metformin");
      for (let i = 1; i <= 3; i++) {
        await seedDose(tx, userId, medId, {
          scheduledFor: new Date(`2026-05-0${i}T08:00:00Z`),
          status: "taken",
          action: "take",
          occurredAt: new Date(`2026-05-0${i}T08:05:00Z`),
        });
      }

      const first = await historyService.query(tx, userId, "UTC", { limit: 2 });
      expect(first.items).toHaveLength(2);
      expect(first.nextCursor).not.toBeNull();

      const second = await historyService.query(tx, userId, "UTC", {
        limit: 2,
        cursor: first.nextCursor!,
      });
      expect(second.items).toHaveLength(1);
      expect(second.nextCursor).toBeNull();
      expect(second.items[0]!.id).not.toBe(first.items[0]!.id);
    });
  });

  it("still resolves archived medications", async () => {
    await inRollbackTransaction("Hist Six", "hist-six@medvault.local", async (tx, userId) => {
      const medId = await seedMedication(tx, userId, "Old Med", new Date("2026-04-01T00:00:00Z"));
      await seedDose(tx, userId, medId, {
        scheduledFor: new Date("2026-03-01T08:00:00Z"),
        status: "taken",
        action: "take",
        occurredAt: new Date("2026-03-01T08:05:00Z"),
      });

      const page = await historyService.query(tx, userId, "UTC", { limit: 10 });
      expect(page.items).toHaveLength(1);
      expect(page.items[0]!.medication.name).toBe("Old Med");
    });
  });
});
