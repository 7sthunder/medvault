import { afterAll, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";

import { db, pool } from "@/server/db/client";
import { uuidv7 } from "@/server/db/helpers";
import type { DbTx } from "@/server/db/helpers";
import { userPreferences, users } from "@/server/db/schema";

import {
  DEFAULT_REMINDER_DEFAULTS,
  getOrCreatePreferences,
  getPreferences,
} from "./get-or-createPreferences";

const dbTests = describe.skipIf(!process.env.DATABASE_URL);

class RollbackSignal extends Error {
  constructor() {
    super("expected rollback");
  }
}

async function rollbackUser<T>(fn: (tx: DbTx, userId: string) => Promise<T>): Promise<T> {
  let result: T | undefined;
  try {
    await db.transaction(async (tx) => {
      const [user] = await tx
        .insert(users)
        .values({ id: uuidv7(), name: "Prefs Tester", email: `prefs-${uuidv7().slice(0, 8)}@medvault.local`, timezone: "UTC" })
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

afterAll(async () => {
  await pool.end();
});

dbTests("getOrCreatePreferences (phase 10 / §8.13)", () => {
  it(
    "creates a row with the given defaults on a fresh user",
    async () => {
      await rollbackUser(async (tx, userId) => {
        const row = await getOrCreatePreferences(tx, userId, DEFAULT_REMINDER_DEFAULTS);
        expect(row).toMatchObject({ userId, ...DEFAULT_REMINDER_DEFAULTS });
        expect(row!.theme).toBe("light");

        const reread = await getPreferences(tx, userId);
        expect(reread).not.toBeNull();
        expect(reread!.missedAfterMinutes).toBe(DEFAULT_REMINDER_DEFAULTS.missedAfterMinutes);
      });
    },
    30_000,
  );

  it(
    "upserts on re-run so remit always reflects the latest values",
    async () => {
      await rollbackUser(async (tx, userId) => {
        await getOrCreatePreferences(tx, userId, DEFAULT_REMINDER_DEFAULTS);
        const updated = await getOrCreatePreferences(tx, userId, {
          missedAfterMinutes: 45,
          snoozeMinutes: 15,
          maxSnoozes: 4,
          reminderBeforeMinutes: 10,
        });
        expect(updated!.missedAfterMinutes).toBe(45);
        expect(updated!.snoozeMinutes).toBe(15);

        const all = await tx
          .select({ userId: userPreferences.userId })
          .from(userPreferences)
          .where(eq(userPreferences.userId, userId));
        expect(all.length).toBe(1); // upsert keeps a single row per user
      });
    },
    30_000,
  );

  it(
    "returns null from getPreferences for a completely uninitialised user",
    async () => {
      await rollbackUser(async (tx, userId) => {
        const prefs = await getPreferences(tx, userId);
        expect(prefs).toBeNull();
      });
    },
    30_000,
  );
});