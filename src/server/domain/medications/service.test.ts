import { afterAll, describe, expect, it } from "vitest";

import { db, pool } from "@/server/db/client";
import { uuidv7 } from "@/server/db/helpers";
import type { DbTx } from "@/server/db/helpers";
import { users } from "@/server/db/schema";

import { medicationService } from "./service";

// Same gate as `seed.test.ts`: these integration tests only run when a real
// DATABASE_URL is present, so `pnpm test` stays green without one in CI.
const dbTests = describe.skipIf(!process.env.DATABASE_URL);

/**
 * run against a transaction that is ALWAYS rolled back, so writes never leak into
 * other parallel test workers (seed.test.ts asserts whole-table row counts).
 */
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
        .values({
          id: uuidv7(),
          name,
          email,
          timezone: "UTC",
          onboardingCompleted: true,
        })
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

function validMedication(name: string) {
  return {
    name,
    dosageAmount: 500,
    dosageUnit: "mg",
    instructions: null,
    notes: null,
    status: "active" as const,
    startDate: "2026-01-01",
    endDate: null,
    color: "#10b981",
    remindersEnabled: true,
    reminderBeforeMinutes: 5,
  };
}

afterAll(async () => {
  await pool.end();
});

dbTests("medicationService CRUD (§10.1)", () => {
  it("create → list/get round-trip with a default slot", async () => {
    const name = `Metformin ${uuidv7().slice(0, 8)}`;
    const outcome = await inRollbackTransaction(
      "Med Crud One",
      "med-crud-one@meditrackai.local",
      async (tx, userId) => {
        const created = await medicationService.create(tx, userId, "UTC", {
          medication: validMedication(name),
        });

        expect(created.dosageAmount).toBe(500);
        expect(created.frequencyLabel).toBe("once-daily");
        expect(created.slots).toHaveLength(1);
        expect(created.slots[0]!.timeOfDay).toBe("08:00");

        const byId = await medicationService.get(tx, userId, created.id);
        expect(byId.id).toBe(created.id);
        expect(byId.name).toBe(created.name);

        const { medications: list, archived } = await medicationService.list(tx, userId);
        expect(list.map((m) => m.id)).toContain(created.id);
        expect(archived).toHaveLength(0);
      },
    );
    expect(outcome).toBeUndefined();
  }, 30_000);

  it("create rejects duplicate active names", async () => {
    await inRollbackTransaction(
      "Med Crud Dup",
      "med-crud-dup@meditrackai.local",
      async (tx, userId) => {
        const input = { medication: validMedication(`Dup ${uuidv7().slice(0, 8)}`) };
        await medicationService.create(tx, userId, "UTC", input);
        await expect(medicationService.create(tx, userId, "UTC", input)).rejects.toMatchObject({
          code: "CONFLICT",
        });
      },
    );
  }, 30_000);

  it("get denies a foreign owner (NOT_FOUND, not leaking existence)", async () => {
    const name = `Metformin ${uuidv7().slice(0, 8)}`;
    await inRollbackTransaction(
      "Med Crud Owner",
      "med-crud-owner@meditrackai.local",
      async (tx, ownerId) => {
        const [outsider] = await tx
          .insert(users)
          .values({
            id: uuidv7(),
            name: "Med Crud Outsider",
            email: "med-crud-outsider@meditrackai.local",
            timezone: "UTC",
          })
          .returning({ id: users.id });
        const created = await medicationService.create(tx, ownerId, "UTC", {
          medication: validMedication(name),
        });
        await expect(medicationService.get(tx, outsider!.id, created.id)).rejects.toMatchObject({
          code: "NOT_FOUND",
        });
      },
    );
  }, 30_000);

  it("update rewrites schedule slots and keeps history", async () => {
    const name = `Metformin ${uuidv7().slice(0, 8)}`;
    await inRollbackTransaction(
      "Med Crud Update",
      "med-crud-update@meditrackai.local",
      async (tx, userId) => {
        const created = await medicationService.create(tx, userId, "UTC", {
          medication: validMedication(name),
        });
        const updated = await medicationService.update(tx, userId, "UTC", {
          id: created.id,
          medication: { ...validMedication(name), remindersEnabled: false },
          schedule: {
            slots: [
              {
                timeOfDay: "08:00",
                daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
                dosageAmount: null,
                instructionOverride: null,
                enabled: true,
              },
              {
                timeOfDay: "20:00",
                daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
                dosageAmount: null,
                instructionOverride: null,
                enabled: true,
              },
            ],
          },
        });
        expect(updated.remindersEnabled).toBe(false);
        expect(updated.slots).toHaveLength(2);
        expect(updated.frequencyLabel).toBe("twice-daily");
      },
    );
  }, 30_000);

  it("update rejects editing someone else's medication", async () => {
    const name = `Metformin ${uuidv7().slice(0, 8)}`;
    await inRollbackTransaction(
      "Med Crud U2",
      "med-crud-u2@meditrackai.local",
      async (tx, ownerId) => {
        const [outsider] = await tx
          .insert(users)
          .values({
            id: uuidv7(),
            name: "Med Crud U3",
            email: "med-crud-u3@meditrackai.local",
            timezone: "UTC",
          })
          .returning({ id: users.id });
        const created = await medicationService.create(tx, ownerId, "UTC", {
          medication: validMedication(name),
        });
        await expect(
          medicationService.update(tx, outsider!.id, "UTC", {
            id: created.id,
            medication: { ...validMedication(name) },
          }),
        ).rejects.toMatchObject({ code: "NOT_FOUND" });
      },
    );
  }, 30_000);

  it("archive soft-deletes: excluded from list, kept in archived bucket, still gettable", async () => {
    const name = `Metformin ${uuidv7().slice(0, 8)}`;
    await inRollbackTransaction(
      "Med Crud Archive",
      "med-crud-archive@meditrackai.local",
      async (tx, userId) => {
        const created = await medicationService.create(tx, userId, "UTC", {
          medication: validMedication(name),
        });
        const archived = await medicationService.archive(tx, userId, "UTC", created.id);
        expect(archived.archivedAt).not.toBeNull();
        expect(archived.status).toBe("paused");

        const { medications: list, archived: bucket } = await medicationService.list(tx, userId);
        expect(list.map((m) => m.id)).not.toContain(created.id);
        expect(bucket.map((m) => m.id)).toContain(created.id);

        // history preserved: get() still resolves it
        const byId = await medicationService.get(tx, userId, created.id);
        expect(byId.id).toBe(created.id);
      },
    );
  }, 30_000);
});
