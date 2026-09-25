import { beforeEach, describe, expect, it, vi } from "vitest";
import { TRPCError } from "@trpc/server";
import * as adherenceService from "@/server/domain/adherence/service";
import { appRouter } from "../root";

vi.mock("@/server/domain/adherence/service");

describe("Phase 16 — Adherence tRPC router", () => {
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

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects unauthenticated requests with UNAUTHORIZED", async () => {
    const unauthedCaller = appRouter.createCaller({
      db: dummyDb,
      user: null,
      session: null,
    });

    await expect(unauthedCaller.adherence.summary()).rejects.toThrowError(
      new TRPCError({ code: "UNAUTHORIZED", message: "Sign in required." }),
    );
  });

  it("calls getAdherenceSummary for adherence.summary query", async () => {
    const caller = appRouter.createCaller({
      db: dummyDb,
      user,
      session,
    });

    const mockSummary = {
      from: new Date("2026-02-01T00:00:00Z"),
      to: new Date("2026-03-01T00:00:00Z"),
      scheduled: 84,
      taken: 76,
      missed: 5,
      skipped: 3,
      snoozed: 8,
      adherencePercent: 90.5,
      days: [],
      streak: { current: 7, longest: 7, currentEndsToday: true },
      trend: {
        daily: [],
        rolling7: [],
        direction: "stable" as const,
        current7: 90.5,
        prior7: 90.5,
      },
      byBucket: [],
    };

    vi.mocked(adherenceService.getAdherenceSummary).mockResolvedValueOnce(mockSummary);

    const result = await caller.adherence.summary({ rangePreset: "30d" });

    expect(adherenceService.getAdherenceSummary).toHaveBeenCalledWith(
      dummyDb,
      "user-123",
      { rangePreset: "30d" },
    );
    expect(result.adherencePercent).toBe(90.5);
    expect(result.streak.current).toBe(7);
  });

  it("calls getMedicationPerformance for adherence.byMedication query", async () => {
    const caller = appRouter.createCaller({
      db: dummyDb,
      user,
      session,
    });

    const mockPerf = [
      {
        medicationId: "med-1",
        name: "Metformin",
        color: "var(--color-emerald-500)",
        frequencyLabel: "twice-daily" as const,
        scheduled: 60,
        taken: 58,
        missed: 2,
        skipped: 0,
        adherencePercent: 96.7,
        bestBucket: "morning" as const,
        worstBucket: "evening" as const,
        lastTakenAt: new Date(),
      },
    ];

    vi.mocked(adherenceService.getMedicationPerformance).mockResolvedValueOnce(mockPerf);

    const result = await caller.adherence.byMedication();

    expect(adherenceService.getMedicationPerformance).toHaveBeenCalledWith(
      dummyDb,
      "user-123",
      undefined,
    );
    expect(result).toHaveLength(1);
    expect(result[0]?.name).toBe("Metformin");
  });

  it("calls getTimeBucketPatterns for adherence.patterns query", async () => {
    const caller = appRouter.createCaller({
      db: dummyDb,
      user,
      session,
    });

    const mockPatterns = [
      { bucket: "morning" as const, scheduled: 30, taken: 29, missed: 1, rate: 96.7 },
      { bucket: "afternoon" as const, scheduled: 10, taken: 8, missed: 2, rate: 80 },
      { bucket: "evening" as const, scheduled: 30, taken: 28, missed: 2, rate: 93.3 },
      { bucket: "night" as const, scheduled: 0, taken: 0, missed: 0, rate: null },
    ];

    vi.mocked(adherenceService.getTimeBucketPatterns).mockResolvedValueOnce(mockPatterns);

    const result = await caller.adherence.patterns();

    expect(adherenceService.getTimeBucketPatterns).toHaveBeenCalledWith(
      dummyDb,
      "user-123",
      undefined,
    );
    expect(result).toHaveLength(4);
  });

  it("calls recomputeRange for adherence.recompute mutation", async () => {
    const caller = appRouter.createCaller({
      db: dummyDb,
      user,
      session,
    });

    vi.mocked(adherenceService.recomputeRange).mockResolvedValueOnce();

    const res = await caller.adherence.recompute({
      from: "2026-02-01",
      to: "2026-03-01",
    });

    expect(adherenceService.recomputeRange).toHaveBeenCalledWith(
      dummyDb,
      "user-123",
      "2026-02-01",
      "2026-03-01",
      undefined,
    );
    expect(res).toEqual({ success: true });
  });
});
