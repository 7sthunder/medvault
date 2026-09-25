import { describe, expect, it, vi } from "vitest";
import type { Db } from "@/server/db/helpers";
import {
  medications,
  notifications,
  userPreferences,
} from "@/server/db/schema";
import {
  createMissedDoseNotification,
  createNotification,
  deleteNotification,
  getUnreadCount,
  listNotifications,
  markAllRead,
  markRead,
} from "./service";
import type { NotificationChannel } from "./channels";

describe("Notifications Service", () => {
  const userId = "user-123";

  describe("createNotification", () => {
    it("creates a notification when preferences allow", async () => {
      const mockCreated = {
        id: "notif-1",
        userId,
        type: "missed_dose",
        title: "Missed dose: Aspirin",
        body: "You missed your scheduled dose of Aspirin.",
        entityType: "doseEvent",
        entityId: "dose-1",
        readAt: null,
        createdAt: new Date("2026-09-25T08:00:00Z"),
      };

      const mockDb = {
        select: vi.fn(() => ({
          from: vi.fn((table: unknown) => {
            if (table === userPreferences) {
              return {
                where: vi.fn(() => ({
                  limit: vi.fn().mockResolvedValue([
                    { notificationPrefs: { doseReminders: true } },
                  ]),
                })),
              };
            }
            if (table === notifications) {
              return {
                where: vi.fn(() => ({
                  limit: vi.fn().mockResolvedValue([]),
                })),
              };
            }
            return {
              where: vi.fn(() => ({ limit: vi.fn().mockResolvedValue([]) })),
            };
          }),
        })),
        insert: vi.fn(() => ({
          values: vi.fn(() => ({
            returning: vi.fn().mockResolvedValue([mockCreated]),
          })),
        })),
      } as unknown as Db;

      const result = await createNotification(mockDb, {
        userId,
        type: "missed_dose",
        title: "Missed dose: Aspirin",
        body: "You missed your scheduled dose of Aspirin.",
        entityType: "doseEvent",
        entityId: "dose-1",
      });

      expect(result).toBeDefined();
      expect(result?.id).toBe("notif-1");
      expect(result?.title).toBe("Missed dose: Aspirin");
    });

    it("suppresses notification when user preference gates it off", async () => {
      const mockDb = {
        select: vi.fn(() => ({
          from: vi.fn(() => ({
            where: vi.fn(() => ({
              limit: vi.fn().mockResolvedValue([
                { notificationPrefs: { doseReminders: false } },
              ]),
            })),
          })),
        })),
      } as unknown as Db;

      const result = await createNotification(mockDb, {
        userId,
        type: "missed_dose",
        title: "Missed dose",
        body: "Missed dose body",
        entityType: "doseEvent",
        entityId: "dose-1",
      });

      expect(result).toBeNull();
    });

    it("deduplicates notifications for the same entity and type", async () => {
      const existingNotif = {
        id: "existing-notif",
        userId,
        type: "caregiver_alert",
        title: "Caregiver Alert",
        body: "Alert body",
        entityType: "caregiverAlert",
        entityId: "alert-1",
        readAt: null,
        createdAt: new Date("2026-09-25T07:00:00Z"),
      };

      const mockDb = {
        select: vi.fn(() => ({
          from: vi.fn((table: unknown) => {
            if (table === userPreferences) {
              return {
                where: vi.fn(() => ({
                  limit: vi.fn().mockResolvedValue([
                    { notificationPrefs: { caregiverMissedAlerts: true } },
                  ]),
                })),
              };
            }
            if (table === notifications) {
              return {
                where: vi.fn(() => ({
                  limit: vi.fn().mockResolvedValue([existingNotif]),
                })),
              };
            }
            return {
              where: vi.fn(() => ({ limit: vi.fn().mockResolvedValue([]) })),
            };
          }),
        })),
        insert: vi.fn(),
      } as unknown as Db;

      const result = await createNotification(mockDb, {
        userId,
        type: "caregiver_alert",
        title: "Duplicate Caregiver Alert",
        body: "Should not be inserted twice",
        entityType: "caregiverAlert",
        entityId: "alert-1",
      });

      expect(result).toBeDefined();
      expect(result?.id).toBe("existing-notif");
      expect(mockDb.insert).not.toHaveBeenCalled();
    });

    it("delivers across provided custom channels", async () => {
      const mockChannel: NotificationChannel = {
        name: "custom",
        deliver: vi.fn().mockResolvedValue(null),
      };

      const mockDb = {
        select: vi.fn(() => ({
          from: vi.fn(() => ({
            where: vi.fn(() => ({
              limit: vi.fn().mockResolvedValue([]),
            })),
          })),
        })),
      } as unknown as Db;

      await createNotification(
        mockDb,
        {
          userId,
          type: "system",
          title: "System Update",
          body: "A system update occurred.",
        },
        { channels: [mockChannel], bypassPreferences: true },
      );

      expect(mockChannel.deliver).toHaveBeenCalled();
    });
  });

  describe("createMissedDoseNotification", () => {
    it("looks up medication info and creates patient notification", async () => {
      const mockDb = {
        select: vi.fn(() => ({
          from: vi.fn((table: unknown) => {
            if (table === medications) {
              return {
                where: vi.fn(() => ({
                  limit: vi.fn().mockResolvedValue([
                    { name: "Metformin", dosageAmount: "500", dosageUnit: "mg" },
                  ]),
                })),
              };
            }
            if (table === userPreferences) {
              return {
                where: vi.fn(() => ({
                  limit: vi.fn().mockResolvedValue([
                    { notificationPrefs: { doseReminders: true } },
                  ]),
                })),
              };
            }
            if (table === notifications) {
              return {
                where: vi.fn(() => ({
                  limit: vi.fn().mockResolvedValue([]),
                })),
              };
            }
            return {
              where: vi.fn(() => ({ limit: vi.fn().mockResolvedValue([]) })),
            };
          }),
        })),
        insert: vi.fn(() => ({
          values: vi.fn(() => ({
            returning: vi.fn().mockResolvedValue([
              {
                id: "notif-missed-1",
                userId,
                type: "missed_dose",
                title: "Missed dose: Metformin",
                body: "You missed your scheduled dose of Metformin (500 mg). Take action or log details.",
                entityType: "doseEvent",
                entityId: "dose-99",
                readAt: null,
                createdAt: new Date(),
              },
            ]),
          })),
        })),
      } as unknown as Db;

      const notif = await createMissedDoseNotification(mockDb, {
        userId,
        medicationId: "med-1",
        doseEventId: "dose-99",
        scheduledFor: new Date(),
      });

      expect(notif).toBeDefined();
      expect(notif?.title).toContain("Metformin");
      expect(notif?.entityId).toBe("dose-99");
    });
  });

  describe("listNotifications", () => {
    it("returns mapped notifications with nextCursor pagination", async () => {
      const rows = [
        {
          id: "n-1",
          userId,
          type: "missed_dose",
          title: "Missed dose",
          body: "body 1",
          entityType: "doseEvent",
          entityId: "e-1",
          readAt: null,
          createdAt: new Date("2026-09-25T08:00:00Z"),
        },
        {
          id: "n-2",
          userId,
          type: "caregiver_alert",
          title: "Caregiver alert",
          body: "body 2",
          entityType: "caregiverAlert",
          entityId: "e-2",
          readAt: new Date("2026-09-25T08:05:00Z"),
          createdAt: new Date("2026-09-25T07:00:00Z"),
        },
      ];

      const mockDb = {
        select: vi.fn(() => ({
          from: vi.fn(() => ({
            where: vi.fn(() => ({
              orderBy: vi.fn(() => ({
                limit: vi.fn().mockResolvedValue(rows),
              })),
            })),
          })),
        })),
      } as unknown as Db;

      const res = await listNotifications(mockDb, userId, {
        tab: "all",
        limit: 1,
        unreadOnly: false,
      });

      expect(res.notifications).toHaveLength(1);
      expect(res.notifications[0]?.id).toBe("n-1");
      expect(res.nextCursor).toBe(rows[0]!.createdAt.toISOString());
    });
  });

  describe("getUnreadCount", () => {
    it("returns numeric count of unread notifications", async () => {
      const mockDb = {
        select: vi.fn(() => ({
          from: vi.fn(() => ({
            where: vi.fn().mockResolvedValue([{ total: 4 }]),
          })),
        })),
      } as unknown as Db;

      const count = await getUnreadCount(mockDb, userId);
      expect(count).toBe(4);
    });
  });

  describe("markRead", () => {
    it("updates readAt and returns updated NotifDTO", async () => {
      const updatedRow = {
        id: "n-1",
        userId,
        type: "missed_dose",
        title: "Title",
        body: "Body",
        entityType: "doseEvent",
        entityId: "e-1",
        readAt: new Date("2026-09-25T09:00:00Z"),
        createdAt: new Date("2026-09-25T08:00:00Z"),
      };

      const mockDb = {
        update: vi.fn(() => ({
          set: vi.fn(() => ({
            where: vi.fn(() => ({
              returning: vi.fn().mockResolvedValue([updatedRow]),
            })),
          })),
        })),
      } as unknown as Db;

      const res = await markRead(mockDb, userId, "n-1");
      expect(res.id).toBe("n-1");
      expect(res.readAt).toEqual(updatedRow.readAt);
    });

    it("throws error if notification row not found", async () => {
      const mockDb = {
        update: vi.fn(() => ({
          set: vi.fn(() => ({
            where: vi.fn(() => ({
              returning: vi.fn().mockResolvedValue([]),
            })),
          })),
        })),
      } as unknown as Db;

      await expect(markRead(mockDb, userId, "nonexistent")).rejects.toThrow(
        "Notification not found or access denied.",
      );
    });
  });

  describe("markAllRead", () => {
    it("updates all unread notifications and returns count", async () => {
      const mockDb = {
        update: vi.fn(() => ({
          set: vi.fn(() => ({
            where: vi.fn(() => ({
              returning: vi.fn().mockResolvedValue([{ id: "n-1" }, { id: "n-2" }]),
            })),
          })),
        })),
      } as unknown as Db;

      const res = await markAllRead(mockDb, userId);
      expect(res.count).toBe(2);
    });
  });

  describe("deleteNotification", () => {
    it("deletes notification row", async () => {
      const mockDb = {
        delete: vi.fn(() => ({
          where: vi.fn(() => ({
            returning: vi.fn().mockResolvedValue([{ id: "n-1" }]),
          })),
        })),
      } as unknown as Db;

      const ok = await deleteNotification(mockDb, userId, "n-1");
      expect(ok).toBe(true);
    });
  });
});
