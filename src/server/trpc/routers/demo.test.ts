import { beforeEach, describe, expect, it, vi } from "vitest";
import * as demoService from "@/server/domain/demo/service";
import { appRouter } from "../root";

vi.mock("@/server/domain/demo/service");

describe("Phase 25 — Demo tRPC Router", () => {
  const dummyDb = {} as never;

  const mockDemoUser = {
    id: "demo-user-123",
    email: "demo@medvault.demo",
    name: "Arun Kumar",
    timezone: "UTC",
    emailVerified: true,
    image: null,
    onboardingCompleted: true,
    isDemo: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockState = {
    id: "state-123",
    userId: mockDemoUser.id,
    simulationNow: null,
    timeMultiplier: 1,
    scenario: "baseline",
    hasCaregiverDemoData: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(demoService.getDemoUser).mockResolvedValue(mockDemoUser as never);
    vi.mocked(demoService.getDemoState).mockResolvedValue(mockState as never);
  });

  it("getState returns demo user and state without requiring authentication", async () => {
    const unauthedCaller = appRouter.createCaller({
      db: dummyDb,
      user: null,
      session: null,
    });

    const res = await unauthedCaller.demo.getState();
    expect(res.demoUser.name).toBe("Arun Kumar");
    expect(res.demoUser.email).toBe("demo@medvault.demo");
    expect(res.state.scenario).toBe("baseline");
    expect(demoService.getDemoUser).toHaveBeenCalledWith(dummyDb);
    expect(demoService.getDemoState).toHaveBeenCalledWith(dummyDb, mockDemoUser.id);
  });

  it("enter routes to enterDemo", async () => {
    vi.mocked(demoService.enterDemo).mockResolvedValue({
      success: true,
      demoUserId: mockDemoUser.id,
      state: mockState as never,
    });

    const caller = appRouter.createCaller({
      db: dummyDb,
      user: null,
      session: null,
    });

    const res = await caller.demo.enter();
    expect(res.success).toBe(true);
    expect(res.demoUserId).toBe(mockDemoUser.id);
    expect(demoService.enterDemo).toHaveBeenCalledWith(dummyDb);
  });

  it("leave routes to leaveDemo", async () => {
    vi.mocked(demoService.leaveDemo).mockResolvedValue({ success: true });

    const caller = appRouter.createCaller({
      db: dummyDb,
      user: null,
      session: null,
    });

    const res = await caller.demo.leave();
    expect(res.success).toBe(true);
    expect(demoService.leaveDemo).toHaveBeenCalled();
  });

  it("reset routes to resetDemo", async () => {
    vi.mocked(demoService.resetDemo).mockResolvedValue({ success: true, userId: mockDemoUser.id });

    const caller = appRouter.createCaller({
      db: dummyDb,
      user: null,
      session: null,
    });

    const res = await caller.demo.reset();
    expect(res.success).toBe(true);
    expect(demoService.resetDemo).toHaveBeenCalledWith(dummyDb);
  });

  it("setTime routes to setTime domain method", async () => {
    const target = "2026-06-15T12:00:00.000Z";
    vi.mocked(demoService.setTime).mockResolvedValue({
      simulationNow: new Date(target),
    });

    const caller = appRouter.createCaller({
      db: dummyDb,
      user: null,
      session: null,
    });

    const res = await caller.demo.setTime({ time: target });
    expect(res.simulationNow).toEqual(new Date(target));
    expect(demoService.setTime).toHaveBeenCalledWith(dummyDb, mockDemoUser.id, { time: target });
  });

  it("simulate routes to simulateAction", async () => {
    vi.mocked(demoService.simulateAction).mockResolvedValue({
      success: true,
      doseId: "dose-1",
      action: "take",
    });

    const caller = appRouter.createCaller({
      db: dummyDb,
      user: null,
      session: null,
    });

    const res = await caller.demo.simulate({ action: "take" });
    expect(res.action).toBe("take");
    expect(demoService.simulateAction).toHaveBeenCalledWith(dummyDb, mockDemoUser.id, { action: "take" });
  });

  it("applyScenario routes to applyScenario domain method", async () => {
    vi.mocked(demoService.applyScenario).mockResolvedValue({
      scenario: "decline",
      message: "Simulated decline",
    });

    const caller = appRouter.createCaller({
      db: dummyDb,
      user: null,
      session: null,
    });

    const res = await caller.demo.applyScenario({ scenario: "decline" });
    expect(res.scenario).toBe("decline");
    expect(demoService.applyScenario).toHaveBeenCalledWith(dummyDb, mockDemoUser.id, { scenario: "decline" });
  });

  it("generateAlert routes to generateCaregiverAlert", async () => {
    vi.mocked(demoService.generateCaregiverAlert).mockResolvedValue({ success: true });

    const caller = appRouter.createCaller({
      db: dummyDb,
      user: null,
      session: null,
    });

    const res = await caller.demo.generateAlert();
    expect(res.success).toBe(true);
    expect(demoService.generateCaregiverAlert).toHaveBeenCalledWith(dummyDb, mockDemoUser.id);
  });

  it("generateInsight routes to generateDemoInsight", async () => {
    vi.mocked(demoService.generateDemoInsight).mockResolvedValue([
      {
        id: "ins-1",
        category: "timing_pattern",
        summary: "Morning routine consistency",
        detail: null,
        suggestedActionType: null,
        confidence: null,
        source: "fallback",
        createdAt: new Date(),
      },
    ]);

    const caller = appRouter.createCaller({
      db: dummyDb,
      user: null,
      session: null,
    });

    const res = await caller.demo.generateInsight();
    expect(res).toHaveLength(1);
    expect(res[0]?.summary).toBe("Morning routine consistency");
    expect(demoService.generateDemoInsight).toHaveBeenCalledWith(dummyDb, mockDemoUser.id);
  });
});
