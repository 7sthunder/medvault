import { beforeEach, describe, expect, it, vi } from "vitest";
import { TRPCError } from "@trpc/server";
import * as actions from "@/server/domain/doseEvents/actions";
import * as reconcile from "@/server/domain/doseEvents/reconcile";
import { appRouter } from "../root";

vi.mock("@/server/domain/doseEvents/actions");
vi.mock("@/server/domain/doseEvents/reconcile");

describe("Phase 13 — Dose tRPC router", () => {
  const dummyDb = {
    select: vi.fn(),
  } as never;

  const user = {
    id: "user-123",
    email: "test@medvault.test",
    name: "Test User",
    timezone: "UTC",
    emailVerified: true,
    image: null,
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

  const sampleDoseDTO = {
    id: "0193b8f0-6c1a-7f46-8000-000000000000",
    medicationId: "med-1",
    scheduleId: "slot-1",
    scheduledFor: new Date("2026-03-01T08:00:00Z"),
    status: "due" as const,
    missedDeadline: new Date("2026-03-01T08:30:00Z"),
    takenAt: null,
    skippedAt: null,
    skippedReason: null,
    snoozeCount: 0,
    snoozeUntil: null,
    statusUpdatedAt: new Date("2026-03-01T08:00:00Z"),
    source: "generated" as const,
    medication: {
      id: "med-1",
      name: "Metformin",
      dosageAmount: 500,
      dosageUnit: "mg",
      color: "#10b981",
      archivedAt: null,
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
      unauthedCaller.dose.take({ doseId: "0193b8f0-6c1a-7f46-8000-000000000000" }),
    ).rejects.toThrowError(
      new TRPCError({ code: "UNAUTHORIZED", message: "Sign in required." }),
    );
  });

  it("invokes takeDose on dose.take mutation", async () => {
    vi.mocked(actions.takeDose).mockResolvedValue({
      ...sampleDoseDTO,
      status: "taken",
    });

    const caller = appRouter.createCaller({
      db: dummyDb,
      user: user as never,
      session: session as never,
    });

    const res = await caller.dose.take({ doseId: "0193b8f0-6c1a-7f46-8000-000000000000" });
    expect(actions.takeDose).toHaveBeenCalledWith(
      dummyDb,
      user.id,
      "0193b8f0-6c1a-7f46-8000-000000000000",
    );
    expect(res.status).toBe("taken");
  });

  it("invokes snoozeDose on dose.snooze mutation", async () => {
    vi.mocked(actions.snoozeDose).mockResolvedValue({
      ...sampleDoseDTO,
      status: "snoozed",
      snoozeCount: 1,
    });

    const caller = appRouter.createCaller({
      db: dummyDb,
      user: user as never,
      session: session as never,
    });

    const res = await caller.dose.snooze({ doseId: "0193b8f0-6c1a-7f46-8000-000000000000" });
    expect(actions.snoozeDose).toHaveBeenCalledWith(
      dummyDb,
      user.id,
      "0193b8f0-6c1a-7f46-8000-000000000000",
    );
    expect(res.status).toBe("snoozed");
  });

  it("invokes skipDose on dose.skip mutation", async () => {
    vi.mocked(actions.skipDose).mockResolvedValue({
      ...sampleDoseDTO,
      status: "skipped",
      skippedReason: "Side effects",
    });

    const caller = appRouter.createCaller({
      db: dummyDb,
      user: user as never,
      session: session as never,
    });

    const res = await caller.dose.skip({
      doseId: "0193b8f0-6c1a-7f46-8000-000000000000",
      reason: "Side effects",
    });
    expect(actions.skipDose).toHaveBeenCalledWith(
      dummyDb,
      user.id,
      "0193b8f0-6c1a-7f46-8000-000000000000",
      "Side effects",
    );
    expect(res.status).toBe("skipped");
  });

  it("invokes reconcileDoseStatuses on dose.reconcile mutation", async () => {
    vi.mocked(reconcile.reconcileDoseStatuses).mockResolvedValue({
      autoMissedCount: 2,
      dueTransitionCount: 1,
    });

    const caller = appRouter.createCaller({
      db: dummyDb,
      user: user as never,
      session: session as never,
    });

    const res = await caller.dose.reconcile();
    expect(reconcile.reconcileDoseStatuses).toHaveBeenCalledWith(dummyDb, {
      userId: user.id,
    });
    expect(res.autoMissedCount).toBe(2);
  });
});
