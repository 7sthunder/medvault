import { beforeEach, describe, expect, it, vi } from "vitest";
import { TRPCError } from "@trpc/server";
import * as insightsService from "@/server/domain/insights/service";
import type { InsightDTO } from "@/shared/types";
import { appRouter } from "../root";

vi.mock("@/server/domain/insights/service");

describe("Phase 23 — Insights tRPC Router", () => {
  const dummyDb = {} as never;

  const user = {
    id: "user-123",
    email: "user@medvault.test",
    name: "Primary User",
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

    await expect(unauthedCaller.insights.list()).rejects.toThrow(TRPCError);
    await expect(unauthedCaller.insights.latest()).rejects.toThrow(TRPCError);
    await expect(unauthedCaller.insights.regenerate()).rejects.toThrow(TRPCError);
  });

  it("lists insights for authenticated user", async () => {
    const authedCaller = appRouter.createCaller({
      db: dummyDb,
      user,
      session,
    });

    const mockInsight: InsightDTO = {
      id: "ins-1",
      category: "timing_pattern",
      summary: "Consistent morning timing",
      detail: "Taking doses with food improves adherence",
      suggestedActionType: "review_schedule",
      source: "fallback",
      confidence: 0.92,
      createdAt: new Date(),
    };

    vi.mocked(insightsService.listInsights).mockResolvedValue([mockInsight]);

    const result = await authedCaller.insights.list({ limit: 10 });
    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe("ins-1");
    expect(insightsService.listInsights).toHaveBeenCalledWith(dummyDb, user.id, 10);
  });

  it("returns latest insight for dashboard widget", async () => {
    const authedCaller = appRouter.createCaller({
      db: dummyDb,
      user,
      session,
    });

    const mockInsight: InsightDTO = {
      id: "ins-latest",
      category: "adherence_improvement",
      summary: "You are on a 5-day streak",
      detail: "Keep up the great work!",
      suggestedActionType: "encourage",
      source: "ai",
      confidence: 0.95,
      createdAt: new Date(),
    };

    vi.mocked(insightsService.getLatestInsight).mockResolvedValue(mockInsight);

    const result = await authedCaller.insights.latest();
    expect(result).not.toBeNull();
    expect(result?.id).toBe("ins-latest");
    expect(insightsService.getLatestInsight).toHaveBeenCalledWith(dummyDb, user.id);
  });

  it("triggers insight regeneration", async () => {
    const authedCaller = appRouter.createCaller({
      db: dummyDb,
      user,
      session,
    });

    const mockInsight: InsightDTO = {
      id: "ins-new",
      category: "snooze_pattern",
      summary: "Frequent snoozing detected",
      detail: "Consider shifting reminder times",
      suggestedActionType: "review_reminders",
      source: "fallback",
      confidence: 0.88,
      createdAt: new Date(),
    };

    vi.mocked(insightsService.generateInsights).mockResolvedValue([mockInsight]);

    const result = await authedCaller.insights.regenerate();
    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe("ins-new");
    expect(insightsService.generateInsights).toHaveBeenCalledWith(dummyDb, user.id);
  });
});
