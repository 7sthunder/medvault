import { beforeEach, describe, expect, it, vi } from "vitest";
import { TRPCError } from "@trpc/server";
import * as reportsService from "@/server/domain/reports/service";
import type { ReportDTO } from "@/shared/types";
import { appRouter } from "../root";

vi.mock("@/server/domain/reports/service");

describe("Phase 20 — Reports tRPC router", () => {
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

  const mockReport: ReportDTO = {
    granularity: "daily",
    from: new Date("2026-03-01T00:00:00Z"),
    to: new Date("2026-03-30T23:59:59Z"),
    medicationId: null,
    table: [],
    trend: [],
    summary: {
      scheduled: 30,
      taken: 28,
      missed: 1,
      skipped: 1,
      adherencePercent: 93.3,
    },
    missedAnalysis: {
      byBucket: [],
      byMedication: [],
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

    await expect(
      unauthedCaller.reports.get({
        from: "2026-03-01",
        to: "2026-03-30",
        granularity: "daily",
      }),
    ).rejects.toThrow(TRPCError);
  });

  it("returns report data for authenticated user", async () => {
    vi.mocked(reportsService.getReportData).mockResolvedValue(mockReport);

    const authedCaller = appRouter.createCaller({
      db: dummyDb,
      user,
      session,
    });

    const result = await authedCaller.reports.get({
      from: "2026-03-01",
      to: "2026-03-30",
      granularity: "daily",
    });

    expect(result).toEqual(mockReport);
    expect(reportsService.getReportData).toHaveBeenCalledWith(
      dummyDb,
      user.id,
      expect.objectContaining({
        from: "2026-03-01",
        to: "2026-03-30",
        granularity: "daily",
      }),
    );
  });

  it("fails validation when from is after to", async () => {
    const authedCaller = appRouter.createCaller({
      db: dummyDb,
      user,
      session,
    });

    await expect(
      authedCaller.reports.get({
        from: "2026-03-31",
        to: "2026-03-01",
        granularity: "daily",
      }),
    ).rejects.toThrow();
  });
});
