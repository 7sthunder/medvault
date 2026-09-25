import { afterAll, describe, expect, it } from "vitest";

import { db, pool } from "@/server/db/client";
import { uuidv7 } from "@/server/db/helpers";
import type { DbTx } from "@/server/db/helpers";
import { users } from "@/server/db/schema";

import type { NotificationChannel, NotificationInput } from "./channels";
import { notificationsService } from "./service";

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

function input(userId: string, overrides: Partial<NotificationInput> = {}): NotificationInput {
  return {
    userId,
    type: "missed_dose",
    title: "Missed dose",
    body: "Metformin 500 mg was missed",
    entityType: "doseEvent",
    entityId: "dose-1",
    createdAt: new Date(),
    ...overrides,
  };
}

/** Records deliveries instead of writing rows — lets us assert fan-out without seeding channels. */
function recordingChannels(): { channels: NotificationChannel[]; delivered: NotificationInput[] } {
  const delivered: NotificationInput[] = [];
  return {
    delivered,
    channels: [{ name: "test", deliver: (_, i) => void delivered.push(i) }],
  };
}

afterAll(async () => {
  await pool.end();
});

dbTests("notificationsService (§10.7)", () => {
  it("create inserts a row through the in-app channel", async () => {
    await inRollbackTransaction("Notif One", "notif-one@medvault.local", async (tx, userId) => {
      const created = await notificationsService.create(tx, input(userId));
      expect(created).toBe(true);

      const unread = await notificationsService.unreadCount(tx, userId);
      expect(unread.count).toBe(1);

      const { items } = await notificationsService.list(tx, userId, { limit: 10 });
      expect(items).toHaveLength(1);
      expect(items[0]!.type).toBe("missed_dose");
      expect(items[0]!.entityId).toBe("dose-1");
    });
  });

  it("dedupes per entityId for missed_dose", async () => {
    await inRollbackTransaction("Notif Two", "notif-two@medvault.local", async (tx, userId) => {
      expect(await notificationsService.create(tx, input(userId))).toBe(true);
      expect(await notificationsService.create(tx, input(userId))).toBe(false);

      const { items } = await notificationsService.list(tx, userId, { limit: 10 });
      expect(items).toHaveLength(1);
      expect(items[0]!.entityId).toBe("dose-1");
    });
  });

  it("does not dedupe system notifications", async () => {
    await inRollbackTransaction("Notif Three", "notif-three@medvault.local", async (tx, userId) => {
      const make = () =>
        input(userId, {
          type: "system",
          title: "System",
          body: "info",
          entityType: null,
          entityId: null,
        });
      expect(await notificationsService.create(tx, make())).toBe(true);
      expect(await notificationsService.create(tx, make())).toBe(true);

      const { items } = await notificationsService.list(tx, userId, { limit: 10 });
      expect(items).toHaveLength(2);
    });
  });

  it("gates by notificationPrefs (doseReminders off suppresses missed_dose)", async () => {
    await inRollbackTransaction("Notif Four", "notif-four@medvault.local", async (tx, userId) => {
      const { channels, delivered } = recordingChannels();
      const prefs = {
        doseReminders: false,
        caregiverMissedAlerts: true,
        insights: true,
        sounds: true,
      };
      expect(await notificationsService.create(tx, input(userId), channels, prefs)).toBe(false);

      const prefsOn = { ...prefs, doseReminders: true };
      expect(await notificationsService.create(tx, input(userId), channels, prefsOn)).toBe(true);
      expect(delivered).toHaveLength(1);
    });
  });

  it("unread-first ordering and mark-read/mark-all-read work", async () => {
    await inRollbackTransaction("Notif Five", "notif-five@medvault.local", async (tx, userId) => {
      const a = input(userId, {
        type: "system",
        title: "A",
        body: "a",
        entityType: null,
        entityId: null,
        createdAt: new Date("2026-05-01T00:00:00Z"),
      });
      const b = input(userId, {
        type: "system",
        title: "B",
        body: "b",
        entityType: null,
        entityId: null,
        createdAt: new Date("2026-05-02T00:00:00Z"),
      });
      await notificationsService.create(tx, a);
      await notificationsService.create(tx, b);

      const { items } = await notificationsService.list(tx, userId, { limit: 10 });
      expect(items.map((i) => i.title)).toEqual(["B", "A"]);

      await notificationsService.markRead(tx, userId, items[1]!.id);
      const unread = await notificationsService.unreadCount(tx, userId);
      expect(unread.count).toBe(1);

      await notificationsService.markAllRead(tx, userId);
      const unreadAfter = await notificationsService.unreadCount(tx, userId);
      expect(unreadAfter.count).toBe(0);
    });
  });

  it("tab filter returns only that type's notifications", async () => {
    await inRollbackTransaction("Notif Six", "notif-six@medvault.local", async (tx, userId) => {
      await notificationsService.create(tx, input(userId));
      await notificationsService.create(
        tx,
        input(userId, {
          type: "system",
          title: "Sys",
          body: "s",
          entityType: null,
          entityId: null,
        }),
      );

      const dose = await notificationsService.list(tx, userId, { limit: 10, tab: "dose" });
      expect(dose.items.map((i) => i.type)).toEqual(["missed_dose"]);

      const sys = await notificationsService.list(tx, userId, { limit: 10, tab: "system" });
      expect(sys.items.map((i) => i.type)).toEqual(["system"]);
    });
  });
});
