import { beforeEach, describe, expect, it, vi } from "vitest";
import { TRPCError } from "@trpc/server";
import * as historyService from "@/server/domain/doseActions/history";
import type { DoseActionDTO } from "@/shared/types";
import { appRouter } from "../root";

vi.mock("@/server/domain/doseActions/history");

describe("Phase 19 — History tRPC router", () => {
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

  const sampleAction: DoseActionDTO = {
    id: "act-1",
    doseEventId: "dose-1",
    action: "take",
    occurredAt: new Date("2026-03-01T08:02:00Z"),
    meta: null,
    medication: {
      id: "med-1",
      name: "Metformin",
      dosageAmount: 500,
      dosageUnit: "mg",
      color: "blue",
      archivedAt: null,
    },
    eventStatus: "taken",
    eventScheduledFor: new Date("2026-03-01T08:00:00Z"),
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

    await expect(unauthedCaller.history.query({})).rejects.toThrowError(
      new TRPCError({ code: "UNAUTHORIZED", message: "Sign in required." }),
    );
  });

  it("calls queryDoseHistory with user context and filters", async () => {
    vi.mocked(historyService.queryDoseHistory).mockResolvedValueOnce({
      items: [sampleAction],
      nextCursor: null,
      totalCount: 1,
    });

    const caller = appRouter.createCaller({
      db: dummyDb,
      user,
      session,
    });

    const result = await caller.history.query({
      action: "take",
      limit: 10,
    });

    expect(historyService.queryDoseHistory).toHaveBeenCalledWith(
      dummyDb,
      "user-123",
      expect.objectContaining({
        action: "take",
        limit: 10,
      }),
    );

    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.id).toBe("act-1");
    expect(result.totalCount).toBe(1);
  });
});
