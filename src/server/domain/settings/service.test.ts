import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Db } from "@/server/db/helpers";
import {
  aiInsights,
  caregiverAlerts,
  caregiverRelationships,
  doseEvents,
  medications,
  medicationSchedules,
  notifications,
  userPreferences,
  users,
} from "@/server/db/schema";
import {
  deleteAllData,
  deleteAccount,
  exportData,
  getDataOverview,
  getProfile,
  getReminderSettings,
  updateAppearance,
  updateCaregiverAlertPrefs,
  updateProfile,
  updateReminderSettings,
} from "./service";
import * as getOrCreateModule from "./get-or-createPreferences";

vi.mock("./get-or-createPreferences");

describe("Phase 24 — Settings Domain Service", () => {
  const userId = "user-settings-123";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getProfile & updateProfile", () => {
    it("returns user profile details", async () => {
      const mockUser = {
        id: userId,
        name: "Eleanor Vance",
        email: "eleanor@medvault.test",
        timezone: "America/New_York",
        createdAt: new Date("2026-01-01T00:00:00Z"),
      };

      const mockDb = {
        select: vi.fn(() => ({
          from: vi.fn(() => ({
            where: vi.fn(() => ({
              limit: vi.fn().mockResolvedValue([mockUser]),
            })),
          })),
        })),
      } as unknown as Db;

      const profile = await getProfile(mockDb, userId);
      expect(profile.id).toBe(userId);
      expect(profile.name).toBe("Eleanor Vance");
      expect(profile.email).toBe("eleanor@medvault.test");
      expect(profile.timezone).toBe("America/New_York");
    });

    it("throws error when user does not exist", async () => {
      const mockDb = {
        select: vi.fn(() => ({
          from: vi.fn(() => ({
            where: vi.fn(() => ({
              limit: vi.fn().mockResolvedValue([]),
            })),
          })),
        })),
      } as unknown as Db;

      await expect(getProfile(mockDb, userId)).rejects.toThrow("User not found");
    });

    it("updates name and timezone on user record", async () => {
      const mockUser = {
        id: userId,
        name: "Eleanor Vance Updated",
        email: "eleanor@medvault.test",
        timezone: "Europe/London",
        createdAt: new Date(),
      };

      const mockDb = {
        update: vi.fn(() => ({
          set: vi.fn(() => ({
            where: vi.fn().mockResolvedValue([]),
          })),
        })),
        select: vi.fn(() => ({
          from: vi.fn(() => ({
            where: vi.fn(() => ({
              limit: vi.fn().mockResolvedValue([mockUser]),
            })),
          })),
        })),
      } as unknown as Db;

      const updated = await updateProfile(mockDb, userId, {
        name: "Eleanor Vance Updated",
        timezone: "Europe/London",
      });

      expect(mockDb.update).toHaveBeenCalledWith(users);
      expect(updated.name).toBe("Eleanor Vance Updated");
      expect(updated.timezone).toBe("Europe/London");
    });
  });

  describe("getReminderSettings & updateReminderSettings", () => {
    it("returns reminder thresholds and per-medication items", async () => {
      vi.mocked(getOrCreateModule.getOrCreatePreferences).mockResolvedValue({
        userId,
        theme: "light",
        missedAfterMinutes: 45,
        snoozeMinutes: 15,
        maxSnoozes: 2,
        reminderBeforeMinutes: 10,
        notificationPrefs: {
          doseReminders: true,
          caregiverMissedAlerts: true,
          insights: false,
          sounds: true,
        },
        caregiverAlertPrefs: { missedDoseOn: true, adherenceDropThreshold: null, dailyDigest: false },
        reduceMotion: false,
        uiDensity: "comfortable",
        updatedAt: new Date(),
      });

      const mockDb = {
        select: vi.fn(() => ({
          from: vi.fn(() => ({
            where: vi.fn().mockResolvedValue([
              { id: "med-1", name: "Metformin", color: "blue", remindersEnabled: true },
            ]),
          })),
        })),
      } as unknown as Db;

      const reminders = await getReminderSettings(mockDb, userId);
      expect(reminders.missedAfterMinutes).toBe(45);
      expect(reminders.snoozeMinutes).toBe(15);
      expect(reminders.medications).toHaveLength(1);
      expect(reminders.medications[0]?.name).toBe("Metformin");
    });

    it("updates preferences and per-medication toggle statuses", async () => {
      vi.mocked(getOrCreateModule.upsertPreferences).mockResolvedValue({} as never);
      vi.mocked(getOrCreateModule.getOrCreatePreferences).mockResolvedValue({
        userId,
        theme: "light",
        missedAfterMinutes: 30,
        snoozeMinutes: 10,
        maxSnoozes: 3,
        reminderBeforeMinutes: 5,
        notificationPrefs: {
          doseReminders: true,
          caregiverMissedAlerts: true,
          insights: true,
          sounds: true,
        },
        caregiverAlertPrefs: { missedDoseOn: true, adherenceDropThreshold: null, dailyDigest: false },
        reduceMotion: false,
        uiDensity: "comfortable",
        updatedAt: new Date(),
      });

      const mockDb = {
        update: vi.fn(() => ({
          set: vi.fn(() => ({
            where: vi.fn().mockResolvedValue([]),
          })),
        })),
        select: vi.fn(() => ({
          from: vi.fn(() => ({
            where: vi.fn().mockResolvedValue([]),
          })),
        })),
      } as unknown as Db;

      await updateReminderSettings(mockDb, userId, {
        missedAfterMinutes: 30,
        snoozeMinutes: 10,
        maxSnoozes: 3,
        reminderBeforeMinutes: 5,
        notificationPrefs: {
          doseReminders: true,
          caregiverMissedAlerts: true,
          insights: true,
          sounds: true,
        },
        perMedicationReminders: [{ medicationId: "med-1", remindersEnabled: false }],
      });

      expect(getOrCreateModule.upsertPreferences).toHaveBeenCalled();
      expect(mockDb.update).toHaveBeenCalledWith(medications);
    });
  });

  describe("updateCaregiverAlertPrefs & updateAppearance", () => {
    it("updates caregiver alert prefs", async () => {
      await updateCaregiverAlertPrefs({} as Db, userId, {
        caregiverAlertPrefs: { missedDoseOn: false, dailyDigest: true },
      });
      expect(getOrCreateModule.upsertPreferences).toHaveBeenCalledWith(
        expect.anything(),
        userId,
        { caregiverAlertPrefs: { missedDoseOn: false, dailyDigest: true } },
      );
    });

    it("updates appearance preferences", async () => {
      await updateAppearance({} as Db, userId, {
        theme: "dark",
        uiDensity: "compact",
        reduceMotion: true,
      });
      expect(getOrCreateModule.upsertPreferences).toHaveBeenCalledWith(
        expect.anything(),
        userId,
        { theme: "dark", uiDensity: "compact", reduceMotion: true },
      );
    });
  });

  describe("getDataOverview & exportData", () => {
    it("getDataOverview aggregates counts across all user tables", async () => {
      const mockDb = {
        select: vi.fn(() => ({
          from: vi.fn((table: unknown) => {
            let count = 0;
            if (table === medications) count = 3;
            if (table === doseEvents) count = 12;
            if (table === aiInsights) count = 4;
            if (table === notifications) count = 5;
            if (table === caregiverRelationships) count = 1;
            return {
              where: vi.fn().mockResolvedValue(Array.from({ length: count }, (_, i) => ({ id: `id-${i}` }))),
            };
          }),
        })),
      } as unknown as Db;

      const overview = await getDataOverview(mockDb, userId);
      expect(overview.medicationCount).toBe(3);
      expect(overview.doseEventCount).toBe(12);
      expect(overview.insightCount).toBe(4);
      expect(overview.notificationCount).toBe(5);
      expect(overview.caregiverCount).toBe(1);
    });

    it("exportData bundles all tables with user metadata", async () => {
      const mockUser = {
        id: userId,
        name: "Test User",
        email: "test@medvault.test",
        timezone: "UTC",
        createdAt: new Date(),
      };

      const mockDb = {
        select: vi.fn(() => ({
          from: vi.fn((table: unknown) => {
            if (table === users) {
              return {
                where: vi.fn(() => ({ limit: vi.fn().mockResolvedValue([mockUser]) })),
              };
            }
            if (table === medications) {
              return { where: vi.fn().mockResolvedValue([{ id: "med-1", name: "Metformin" }]) };
            }
            if (table === doseEvents) {
              return { where: vi.fn().mockResolvedValue([{ id: "dose-1" }]) };
            }
            if (table === medicationSchedules) {
              return { where: vi.fn().mockResolvedValue([{ id: "slot-1" }]) };
            }
            if (table === aiInsights) {
              return { where: vi.fn().mockResolvedValue([{ id: "ins-1" }]) };
            }
            return { where: vi.fn().mockResolvedValue([]) };
          }),
        })),
      } as unknown as Db;

      const data = await exportData(mockDb, userId);
      expect(data.user.email).toBe("test@medvault.test");
      expect(data.medications).toHaveLength(1);
      expect(data.doseEvents).toHaveLength(1);
      expect(data.schedules).toHaveLength(1);
      expect(data.insights).toHaveLength(1);
      expect(data.exportedAt).toBeDefined();
    });
  });

  describe("deleteAllData & deleteAccount", () => {
    it("deleteAllData transactionally clears data while keeping user account", async () => {
      const deletedTables: unknown[] = [];

      const mockDb = {
        select: vi.fn(() => ({
          from: vi.fn(() => ({
            where: vi.fn().mockResolvedValue([{ id: "med-1" }]),
          })),
        })),
        delete: vi.fn((table: unknown) => {
          deletedTables.push(table);
          return {
            where: vi.fn().mockResolvedValue([]),
          };
        }),
      } as unknown as Db;

      const result = await deleteAllData(mockDb, userId);
      expect(result.success).toBe(true);

      // Verify child and parent tables wiped
      expect(deletedTables).toContain(doseEvents);
      expect(deletedTables).toContain(medicationSchedules);
      expect(deletedTables).toContain(medications);
      expect(deletedTables).toContain(aiInsights);
      expect(deletedTables).toContain(notifications);
      expect(deletedTables).toContain(caregiverAlerts);
      expect(deletedTables).toContain(caregiverRelationships);
      expect(deletedTables).toContain(userPreferences);

      // Verify users table was NOT deleted
      expect(deletedTables).not.toContain(users);
      expect(getOrCreateModule.getOrCreatePreferences).toHaveBeenCalledWith(mockDb, userId);
    });

    it("deleteAccount clears all data and deletes user row", async () => {
      const deletedTables: unknown[] = [];

      const mockDb = {
        select: vi.fn(() => ({
          from: vi.fn(() => ({
            where: vi.fn().mockResolvedValue([]),
          })),
        })),
        delete: vi.fn((table: unknown) => {
          deletedTables.push(table);
          return {
            where: vi.fn().mockResolvedValue([]),
          };
        }),
      } as unknown as Db;

      const result = await deleteAccount(mockDb, userId);
      expect(result.success).toBe(true);
      expect(deletedTables).toContain(users);
    });
  });
});
