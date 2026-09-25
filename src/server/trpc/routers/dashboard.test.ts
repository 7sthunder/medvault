import { beforeEach, describe, expect, it, vi } from "vitest";
import { TRPCError } from "@trpc/server";
import * as dashboardService from "@/server/domain/dashboard/service";
import type { DashboardDTO } from "@/shared/types";
import { appRouter } from "../root";

vi.mock("@/server/domain/dashboard/service");

describe("Phase 18 — Dashboard tRPC router", () => {
  const dummyDb = {} as never;

  const user = {
    id: "user-123",
    email: "test@medvault.test",
    name: "Test User",
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

  const mockDashboardData: DashboardDTO = {
    stats: {
      adherenceToday: 100,
      currentStreak: 7,
      nextDoseTime: new Date("2026-03-01T20:00:00Z"),
      missedToday: 0,
      takenToday: 2,
      scheduledToday: 2,
    },
    dueNow: [],
    nextDose: null,
    today: [],
    week: [],
    medications: [],
    latestInsight: null,
    caregiver: {
      connectedCount: 0,
      newAlerts: 0,
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects unauthenticated requests with UNAUTHORIZED", async () => {
    const unauthedCaller = appRouter.createCaller({
      db: dummyDb,
      user: null,
      session: null,
    });

    await expect(unauthedCaller.dashboard.get()).rejects.toThrowError(
      new TRPCError({ code: "UNAUTHORIZED", message: "Sign in required." }),
    );
  });

  it("calls getDashboardData and returns DashboardDTO", async () => {
    vi.mocked(dashboardService.getDashboardData).mockResolvedValueOnce(
      mockDashboardData,
    );

    const caller = appRouter.createCaller({
      db: dummyDb,
      user,
      session,
    });

    const result = await caller.dashboard.get();
    expect(dashboardService.getDashboardData).toHaveBeenCalledWith(
      dummyDb,
      "user-123",
      { timeZone: undefined },
    );
    expect(result).toEqual(mockDashboardData);
  });

  it("passes custom timeZone option when provided", async () => {
    vi.mocked(dashboardService.getDashboardData).mockResolvedValueOnce(
      mockDashboardData,
    );

    const caller = appRouter.createCaller({
      db: dummyDb,
      user,
      session,
    });

    await caller.dashboard.get({ timeZone: "America/New_York" });
    expect(dashboardService.getDashboardData).toHaveBeenCalledWith(
      dummyDb,
      "user-123",
      { timeZone: "America/New_York" },
    );
  });
});
