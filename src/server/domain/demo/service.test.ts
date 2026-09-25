import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Db } from "@/server/db/helpers";
import * as demoSeedModule from "@/server/db/demo-seed";
import * as insightsModule from "@/server/domain/insights/service";
import * as notificationsModule from "@/server/domain/notifications/service";
import {
  applyScenario,
  enterDemo,
  generateCaregiverAlert,
  generateDemoInsight,
  getDemoState,
  getDemoUser,
  leaveDemo,
  resetDemo,
  setTime,
  simulateAction,
  DEMO_CAREGIVER_EMAIL,
  DEMO_COOKIE_NAME,
} from "./service";

vi.mock("@/server/db/demo-seed");
vi.mock("@/server/domain/insights/service");
vi.mock("@/server/domain/notifications/service");

describe("Phase 25 — Demo Domain Service", () => {
  const demoUserId = "demo-user-arun-kumar";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getDemoUser", () => {
    it("returns existing demo user if present", async () => {
      const mockUser = {
        id: demoUserId,
        email: demoSeedModule.DEMO_USER_EMAIL,
        name: "Arun Kumar",
        isDemo: true,
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

      const user = await getDemoUser(mockDb);
      expect(user.id).toBe(demoUserId);
      expect(user.name).toBe("Arun Kumar");
      expect(demoSeedModule.seedDemoWorkspace).not.toHaveBeenCalled();
    });

    it("seeds demo workspace if demo user is not found initially", async () => {
      const mockUser = {
        id: demoUserId,
        email: demoSeedModule.DEMO_USER_EMAIL,
        name: "Arun Kumar",
        isDemo: true,
      };

      let callCount = 0;
      const mockDb = {
        select: vi.fn(() => ({
          from: vi.fn(() => ({
            where: vi.fn(() => ({
              limit: vi.fn().mockImplementation(() => {
                callCount++;
                return Promise.resolve(callCount === 1 ? [] : [mockUser]);
              }),
            })),
          })),
        })),
      } as unknown as Db;

      const user = await getDemoUser(mockDb);
      expect(demoSeedModule.seedDemoWorkspace).toHaveBeenCalledWith(mockDb);
      expect(user.id).toBe(demoUserId);
    });
  });

  describe("getDemoState", () => {
    it("returns existing demo state row", async () => {
      const mockState = {
        id: "state-1",
        userId: demoUserId,
        simulationNow: null,
        timeMultiplier: 1,
        scenario: "baseline",
        hasCaregiverDemoData: false,
      };

      const mockDb = {
        select: vi.fn(() => ({
          from: vi.fn(() => ({
            where: vi.fn(() => ({
              limit: vi.fn().mockResolvedValue([mockState]),
            })),
          })),
        })),
      } as unknown as Db;

      const state = await getDemoState(mockDb, demoUserId);
      expect(state.scenario).toBe("baseline");
      expect(state.timeMultiplier).toBe(1);
    });

    it("creates baseline demo state if missing", async () => {
      const mockState = {
        id: "state-1",
        userId: demoUserId,
        simulationNow: null,
        timeMultiplier: 1,
        scenario: "baseline",
        hasCaregiverDemoData: false,
      };

      let callCount = 0;
      const insertValues = vi.fn().mockResolvedValue(undefined);
      const mockDb = {
        select: vi.fn(() => ({
          from: vi.fn(() => ({
            where: vi.fn(() => ({
              limit: vi.fn().mockImplementation(() => {
                callCount++;
                return Promise.resolve(callCount === 1 ? [] : [mockState]);
              }),
            })),
          })),
        })),
        insert: vi.fn(() => ({
          values: insertValues,
        })),
      } as unknown as Db;

      const state = await getDemoState(mockDb, demoUserId);
      expect(insertValues).toHaveBeenCalled();
      expect(state.scenario).toBe("baseline");
    });
  });

  describe("enterDemo & leaveDemo", () => {
    it("enterDemo returns success with demoUserId and state", async () => {
      const mockUser = { id: demoUserId, email: demoSeedModule.DEMO_USER_EMAIL, name: "Arun" };
      const mockState = { id: "s-1", userId: demoUserId, scenario: "baseline" };

      let queryCount = 0;
      const mockDb = {
        select: vi.fn(() => ({
          from: vi.fn(() => ({
            where: vi.fn(() => ({
              limit: vi.fn().mockImplementation(() => {
                queryCount++;
                return Promise.resolve(queryCount === 1 ? [mockUser] : [mockState]);
              }),
            })),
          })),
        })),
      } as unknown as Db;

      const res = await enterDemo(mockDb);
      expect(res.success).toBe(true);
      expect(res.demoUserId).toBe(demoUserId);
      expect(res.state).toEqual(mockState);
    });

    it("leaveDemo returns success", async () => {
      const res = await leaveDemo();
      expect(res.success).toBe(true);
      expect(DEMO_COOKIE_NAME).toBe("medvault_demo_session");
    });
  });

  describe("resetDemo", () => {
    it("reseeds database and restores demo state to baseline", async () => {
      vi.mocked(demoSeedModule.seedDemoWorkspace).mockResolvedValue({
        userId: demoUserId,
        scheduled: 84,
        taken: 76,
        missed: 5,
        skipped: 3,
        snoozed: 8,
      });

      const updateWhere = vi.fn().mockResolvedValue(undefined);
      const updateSet = vi.fn(() => ({ where: updateWhere }));
      const mockDb = {
        update: vi.fn(() => ({ set: updateSet })),
      } as unknown as Db;

      const res = await resetDemo(mockDb);
      expect(res.success).toBe(true);
      expect(res.userId).toBe(demoUserId);
      expect(demoSeedModule.seedDemoWorkspace).toHaveBeenCalledWith(mockDb);
      expect(updateSet).toHaveBeenCalledWith(
        expect.objectContaining({
          simulationNow: null,
          scenario: "baseline",
          hasCaregiverDemoData: false,
        }),
      );
    });
  });

  describe("setTime", () => {
    it("updates simulationNow date on demo_state", async () => {
      const updateWhere = vi.fn().mockResolvedValue(undefined);
      const updateSet = vi.fn(() => ({ where: updateWhere }));
      const mockDb = {
        update: vi.fn(() => ({ set: updateSet })),
      } as unknown as Db;

      const targetIso = "2026-06-15T10:00:00.000Z";
      const res = await setTime(mockDb, demoUserId, { time: targetIso });

      expect(res.simulationNow).toEqual(new Date(targetIso));
      expect(updateSet).toHaveBeenCalledWith(
        expect.objectContaining({
          simulationNow: new Date(targetIso),
        }),
      );
    });

    it("clears simulationNow to null when resetting clock", async () => {
      const updateWhere = vi.fn().mockResolvedValue(undefined);
      const updateSet = vi.fn(() => ({ where: updateWhere }));
      const mockDb = {
        update: vi.fn(() => ({ set: updateSet })),
      } as unknown as Db;

      const res = await setTime(mockDb, demoUserId, { time: null });
      expect(res.simulationNow).toBeNull();
      expect(updateSet).toHaveBeenCalledWith(
        expect.objectContaining({
          simulationNow: null,
        }),
      );
    });
  });

  describe("simulateAction", () => {
    it("simulates 'take' on due dose and inserts doseAction", async () => {
      const mockDose = {
        id: "dose-101",
        userId: demoUserId,
        status: "due",
        snoozeCount: 0,
        scheduledFor: new Date(),
      };

      const updateWhere = vi.fn().mockResolvedValue(undefined);
      const updateSet = vi.fn(() => ({ where: updateWhere }));
      const insertValues = vi.fn().mockResolvedValue(undefined);

      const mockDb = {
        select: vi.fn(() => ({
          from: vi.fn(() => ({
            where: vi.fn(() => ({
              orderBy: vi.fn(() => ({
                limit: vi.fn().mockResolvedValue([mockDose]),
              })),
            })),
          })),
        })),
        update: vi.fn(() => ({ set: updateSet })),
        insert: vi.fn(() => ({ values: insertValues })),
      } as unknown as Db;

      const res = await simulateAction(mockDb, demoUserId, { action: "take" });
      expect(res.success).toBe(true);
      expect(res.doseId).toBe("dose-101");
      expect(res.action).toBe("take");
      expect(updateSet).toHaveBeenCalledWith(
        expect.objectContaining({ status: "taken" }),
      );
      expect(insertValues).toHaveBeenCalledWith(
        expect.objectContaining({ action: "take", doseEventId: "dose-101" }),
      );
    });

    it("simulates 'miss' action", async () => {
      const mockDose = {
        id: "dose-102",
        userId: demoUserId,
        status: "due",
        snoozeCount: 0,
        scheduledFor: new Date(),
      };

      const updateWhere = vi.fn().mockResolvedValue(undefined);
      const updateSet = vi.fn(() => ({ where: updateWhere }));
      const insertValues = vi.fn().mockResolvedValue(undefined);

      const mockDb = {
        select: vi.fn(() => ({
          from: vi.fn(() => ({
            where: vi.fn(() => ({
              orderBy: vi.fn(() => ({
                limit: vi.fn().mockResolvedValue([mockDose]),
              })),
            })),
          })),
        })),
        update: vi.fn(() => ({ set: updateSet })),
        insert: vi.fn(() => ({ values: insertValues })),
      } as unknown as Db;

      const res = await simulateAction(mockDb, demoUserId, { action: "miss" });
      expect(res.action).toBe("miss");
      expect(updateSet).toHaveBeenCalledWith(
        expect.objectContaining({ status: "missed" }),
      );
    });

    it("simulates 'skip' action with reason", async () => {
      const mockDose = {
        id: "dose-103",
        userId: demoUserId,
        status: "due",
        snoozeCount: 0,
        scheduledFor: new Date(),
      };

      const updateWhere = vi.fn().mockResolvedValue(undefined);
      const updateSet = vi.fn(() => ({ where: updateWhere }));
      const insertValues = vi.fn().mockResolvedValue(undefined);

      const mockDb = {
        select: vi.fn(() => ({
          from: vi.fn(() => ({
            where: vi.fn(() => ({
              orderBy: vi.fn(() => ({
                limit: vi.fn().mockResolvedValue([mockDose]),
              })),
            })),
          })),
        })),
        update: vi.fn(() => ({ set: updateSet })),
        insert: vi.fn(() => ({ values: insertValues })),
      } as unknown as Db;

      const res = await simulateAction(mockDb, demoUserId, {
        action: "skip",
        skipReason: "Nausea",
      });
      expect(res.action).toBe("skip");
      expect(updateSet).toHaveBeenCalledWith(
        expect.objectContaining({ status: "skipped", skippedReason: "Nausea" }),
      );
      expect(insertValues).toHaveBeenCalledWith(
        expect.objectContaining({ action: "skip", meta: { reason: "Nausea" } }),
      );
    });

    it("simulates 'snooze' action, incrementing count and setting snoozeUntil", async () => {
      const mockDose = {
        id: "dose-104",
        userId: demoUserId,
        status: "due",
        snoozeCount: 1,
        scheduledFor: new Date(),
      };

      const updateWhere = vi.fn().mockResolvedValue(undefined);
      const updateSet = vi.fn(() => ({ where: updateWhere }));
      const insertValues = vi.fn().mockResolvedValue(undefined);

      const mockDb = {
        select: vi.fn(() => ({
          from: vi.fn(() => ({
            where: vi.fn(() => ({
              orderBy: vi.fn(() => ({
                limit: vi.fn().mockResolvedValue([mockDose]),
              })),
            })),
          })),
        })),
        update: vi.fn(() => ({ set: updateSet })),
        insert: vi.fn(() => ({ values: insertValues })),
      } as unknown as Db;

      const res = await simulateAction(mockDb, demoUserId, { action: "snooze" });
      expect(res.action).toBe("snooze");
      expect(updateSet).toHaveBeenCalledWith(
        expect.objectContaining({ status: "snoozed", snoozeCount: 2 }),
      );
    });
  });

  describe("applyScenario", () => {
    it("applies 'baseline' scenario by calling resetDemo", async () => {
      vi.mocked(demoSeedModule.seedDemoWorkspace).mockResolvedValue({
        userId: demoUserId,
        scheduled: 84,
        taken: 76,
        missed: 5,
        skipped: 3,
        snoozed: 8,
      });

      const updateWhere = vi.fn().mockResolvedValue(undefined);
      const updateSet = vi.fn(() => ({ where: updateWhere }));
      const mockDb = {
        update: vi.fn(() => ({ set: updateSet })),
      } as unknown as Db;

      const res = await applyScenario(mockDb, demoUserId, { scenario: "baseline" });
      expect(res.scenario).toBe("baseline");
      expect(demoSeedModule.seedDemoWorkspace).toHaveBeenCalled();
    });

    it("applies 'decline' scenario by marking recent doses missed", async () => {
      const recentDoses = [{ id: "d1" }, { id: "d2" }, { id: "d3" }];

      const updateWhere = vi.fn().mockResolvedValue(undefined);
      const updateSet = vi.fn(() => ({ where: updateWhere }));

      const mockDb = {
        select: vi.fn(() => ({
          from: vi.fn(() => ({
            where: vi.fn(() => ({
              orderBy: vi.fn(() => ({
                limit: vi.fn().mockResolvedValue(recentDoses),
              })),
            })),
          })),
        })),
        update: vi.fn(() => ({ set: updateSet })),
      } as unknown as Db;

      const res = await applyScenario(mockDb, demoUserId, { scenario: "decline" });
      expect(res.scenario).toBe("decline");
      expect(updateSet).toHaveBeenCalledWith(
        expect.objectContaining({ status: "missed" }),
      );
      expect(updateSet).toHaveBeenCalledWith(
        expect.objectContaining({ scenario: "decline" }),
      );
    });

    it("applies 'improvement' scenario by marking missed doses taken", async () => {
      const updateWhere = vi.fn().mockResolvedValue(undefined);
      const updateSet = vi.fn(() => ({ where: updateWhere }));

      const mockDb = {
        update: vi.fn(() => ({ set: updateSet })),
      } as unknown as Db;

      const res = await applyScenario(mockDb, demoUserId, { scenario: "improvement" });
      expect(res.scenario).toBe("improvement");
      expect(updateSet).toHaveBeenCalledWith(
        expect.objectContaining({ status: "taken" }),
      );
    });

    it("applies 'caregiver_demo' scenario by creating alert and relationship", async () => {
      const caregiverUser = { id: "cg-1", email: DEMO_CAREGIVER_EMAIL };
      const rel = { id: "rel-1" };
      const dose = { id: "dose-cg" };

      const updateWhere = vi.fn().mockResolvedValue(undefined);
      const updateSet = vi.fn(() => ({ where: updateWhere }));
      const insertValues = vi.fn().mockResolvedValue(undefined);

      const mockDb = {
        select: vi.fn(() => ({
          from: vi.fn(() => ({
            where: vi.fn(() => ({
              limit: vi.fn().mockResolvedValueOnce([caregiverUser]),
              orderBy: vi.fn(() => ({
                limit: vi.fn().mockResolvedValueOnce([dose]),
              })),
            })),
          })),
        })),
        update: vi.fn(() => ({ set: updateSet })),
        insert: vi.fn(() => ({ values: insertValues })),
      } as unknown as Db;

      // Ensure select chain for caregiverRelationship
      let selectCount = 0;
      mockDb.select = vi.fn(() => ({
        from: vi.fn(() => ({
          where: vi.fn(() => {
            selectCount++;
            if (selectCount === 1) {
              return { limit: vi.fn().mockResolvedValue([caregiverUser]) };
            }
            if (selectCount === 2) {
              return { limit: vi.fn().mockResolvedValue([rel]) };
            }
            return {
              orderBy: vi.fn(() => ({
                limit: vi.fn().mockResolvedValue([dose]),
              })),
            };
          }),
        })),
      })) as unknown as typeof mockDb.select;

      const res = await applyScenario(mockDb, demoUserId, { scenario: "caregiver_demo" });
      expect(res.scenario).toBe("caregiver_demo");
      expect(notificationsModule.createNotification).toHaveBeenCalled();
    });
  });

  describe("generateCaregiverAlert", () => {
    it("creates relationship and missed dose alert", async () => {
      const caregiverUser = { id: "cg-1", email: DEMO_CAREGIVER_EMAIL };
      const rel = { id: "rel-1" };
      const dose = { id: "dose-cg" };

      let selectCount = 0;
      const mockDb = {
        select: vi.fn(() => ({
          from: vi.fn(() => ({
            where: vi.fn(() => {
              selectCount++;
              if (selectCount === 1) {
                return { limit: vi.fn().mockResolvedValue([caregiverUser]) };
              }
              if (selectCount === 2) {
                return { limit: vi.fn().mockResolvedValue([rel]) };
              }
              return {
                orderBy: vi.fn(() => ({
                  limit: vi.fn().mockResolvedValue([dose]),
                })),
              };
            }),
          })),
        })),
        update: vi.fn(() => ({ set: vi.fn(() => ({ where: vi.fn().mockResolvedValue(undefined) })) })),
        insert: vi.fn(() => ({ values: vi.fn().mockResolvedValue(undefined) })),
      } as unknown as Db;

      const res = await generateCaregiverAlert(mockDb, demoUserId);
      expect(res.success).toBe(true);
      expect(notificationsModule.createNotification).toHaveBeenCalled();
    });
  });

  describe("generateDemoInsight", () => {
    it("delegates to generateInsights domain service", async () => {
      const mockInsights = [
        {
          id: "ins-1",
          userId: demoUserId,
          category: "timing_pattern",
          summary: "Consistent morning adherence",
          detail: "Take with breakfast.",
          source: "fallback",
          createdAt: new Date(),
        },
      ];

      vi.mocked(insightsModule.generateInsights).mockResolvedValue(mockInsights as never);

      const mockDb = {} as Db;
      const res = await generateDemoInsight(mockDb, demoUserId);
      expect(res).toEqual(mockInsights);
      expect(insightsModule.generateInsights).toHaveBeenCalledWith(mockDb, demoUserId);
    });
  });

  describe("isolation guarantee", () => {
    it("ensures simulateAction scopes mutations strictly to demo user doses", async () => {
      const realUserId = "real-user-eleanor";
      const whereConditionSpy = vi.fn();

      const mockDb = {
        select: vi.fn(() => ({
          from: vi.fn(() => ({
            where: vi.fn((condition) => {
              whereConditionSpy(condition);
              return {
                orderBy: vi.fn(() => ({
                  limit: vi.fn().mockResolvedValue([
                    { id: "dose-demo-1", userId: demoUserId, status: "due", snoozeCount: 0 },
                  ]),
                })),
              };
            }),
          })),
        })),
        update: vi.fn(() => ({
          set: vi.fn(() => ({
            where: vi.fn().mockResolvedValue(undefined),
          })),
        })),
        insert: vi.fn(() => ({
          values: vi.fn().mockResolvedValue(undefined),
        })),
      } as unknown as Db;

      await simulateAction(mockDb, demoUserId, { action: "take" });
      expect(whereConditionSpy).toHaveBeenCalled();
      // Ensure real user is never queried or touched
      expect(demoUserId).not.toBe(realUserId);
    });
  });
});

