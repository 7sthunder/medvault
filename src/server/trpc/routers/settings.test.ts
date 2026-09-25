import { beforeEach, describe, expect, it, vi } from "vitest";
import { TRPCError } from "@trpc/server";
import * as settingsService from "@/server/domain/settings/service";
import { appRouter } from "../root";

vi.mock("@/server/domain/settings/service");
vi.mock("@/server/domain/settings/get-or-createPreferences");

describe("Phase 24 — Settings tRPC Router", () => {
  const dummyDb = {} as never;

  const user = {
    id: "user-123",
    email: "user@medvault.test",
    name: "Eleanor Vance",
    timezone: "UTC",
    emailVerified: true,
    image: null,
    onboardingCompleted: true,
    isDemo: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const session = {
    id: "sess-1",
    userId: user.id,
    expiresAt: new Date(Date.now() + 86400000),
    token: "token",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects unauthenticated calls with UNAUTHORIZED", async () => {
    const unauthedCaller = appRouter.createCaller({
      db: dummyDb,
      user: null,
      session: null,
    });

    await expect(unauthedCaller.settings.getProfile()).rejects.toThrow(TRPCError);
    await expect(
      unauthedCaller.settings.updateProfile({ name: "New Name", timezone: "UTC" }),
    ).rejects.toThrow(TRPCError);
    await expect(unauthedCaller.settings.getReminders()).rejects.toThrow(TRPCError);
    await expect(unauthedCaller.settings.getDataOverview()).rejects.toThrow(TRPCError);
  });

  it("routes getProfile and updateProfile to domain service", async () => {
    const caller = appRouter.createCaller({
      db: dummyDb,
      user,
      session,
    });

    const mockProfile = {
      id: user.id,
      name: user.name,
      email: user.email,
      timezone: user.timezone,
      createdAt: user.createdAt,
      role: "patient" as const,
      accessCode: "MV-TEST01",
    };

    vi.mocked(settingsService.getProfile).mockResolvedValue(mockProfile);
    vi.mocked(settingsService.updateProfile).mockResolvedValue({
      ...mockProfile,
      name: "Updated Name",
    });

    const fetched = await caller.settings.getProfile();
    expect(fetched.name).toBe("Eleanor Vance");
    expect(settingsService.getProfile).toHaveBeenCalledWith(dummyDb, user.id);

    const updated = await caller.settings.updateProfile({
      name: "Updated Name",
      timezone: "UTC",
    });
    expect(updated.name).toBe("Updated Name");
    expect(settingsService.updateProfile).toHaveBeenCalledWith(dummyDb, user.id, {
      name: "Updated Name",
      timezone: "UTC",
    });
  });

  it("routes reminder queries and updates", async () => {
    const caller = appRouter.createCaller({
      db: dummyDb,
      user,
      session,
    });

    const mockReminders = {
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
      medications: [],
    };

    vi.mocked(settingsService.getReminderSettings).mockResolvedValue(mockReminders);
    vi.mocked(settingsService.updateReminderSettings).mockResolvedValue(mockReminders);

    const res = await caller.settings.getReminders();
    expect(res.missedAfterMinutes).toBe(30);

    await caller.settings.updateReminders({
      missedAfterMinutes: 45,
      snoozeMinutes: 15,
      maxSnoozes: 2,
      reminderBeforeMinutes: 10,
      notificationPrefs: {
        doseReminders: true,
        caregiverMissedAlerts: false,
        insights: true,
        sounds: true,
      },
    });

    expect(settingsService.updateReminderSettings).toHaveBeenCalled();
  });

  it("routes appearance and caregiver preferences updates", async () => {
    const caller = appRouter.createCaller({
      db: dummyDb,
      user,
      session,
    });

    await caller.settings.updateAppearance({
      theme: "dark",
      uiDensity: "compact",
      reduceMotion: true,
    });
    expect(settingsService.updateAppearance).toHaveBeenCalledWith(dummyDb, user.id, {
      theme: "dark",
      uiDensity: "compact",
      reduceMotion: true,
    });

    await caller.settings.updateCaregiverPrefs({
      caregiverAlertPrefs: { missedDoseOn: false, dailyDigest: true },
    });
    expect(settingsService.updateCaregiverAlertPrefs).toHaveBeenCalledWith(dummyDb, user.id, {
      caregiverAlertPrefs: { missedDoseOn: false, dailyDigest: true },
    });
  });

  it("routes data overview and export queries", async () => {
    const caller = appRouter.createCaller({
      db: dummyDb,
      user,
      session,
    });

    vi.mocked(settingsService.getDataOverview).mockResolvedValue({
      medicationCount: 2,
      doseEventCount: 10,
      insightCount: 3,
      notificationCount: 4,
      caregiverCount: 1,
    });

    const overview = await caller.settings.getDataOverview();
    expect(overview.medicationCount).toBe(2);

    vi.mocked(settingsService.exportData).mockResolvedValue({
      user: { id: user.id, name: user.name, email: user.email, timezone: user.timezone },
      medications: [],
      doseEvents: [],
      schedules: [],
      insights: [],
      exportedAt: new Date().toISOString(),
    });

    const exportPayload = await caller.settings.exportData();
    expect(exportPayload.user.email).toBe(user.email);
  });

  it("routes typed destructive operations: deleteAllData and deleteAccount", async () => {
    const caller = appRouter.createCaller({
      db: dummyDb,
      user,
      session,
    });

    vi.mocked(settingsService.deleteAllData).mockResolvedValue({ success: true });
    vi.mocked(settingsService.deleteAccount).mockResolvedValue({ success: true });

    const wipeRes = await caller.settings.deleteAllData({ confirmPhrase: "DELETE ALL DATA" });
    expect(wipeRes.success).toBe(true);
    expect(settingsService.deleteAllData).toHaveBeenCalledWith(dummyDb, user.id);

    const deleteAccRes = await caller.settings.deleteAccount({ confirmPhrase: "DELETE MY ACCOUNT" });
    expect(deleteAccRes.success).toBe(true);
    expect(settingsService.deleteAccount).toHaveBeenCalledWith(dummyDb, user.id);
  });
});
