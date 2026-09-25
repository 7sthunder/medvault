import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Db } from "@/server/db/helpers";
import { doseEvents, medications, users } from "@/server/db/schema";
import { getDashboardData } from "./service";
import * as adherenceModule from "@/server/domain/adherence/summary";
import * as doseEventsService from "@/server/domain/doseEvents/service";
import * as reconcileService from "@/server/domain/doseEvents/reconcile";
import * as medService from "@/server/domain/medications/service";

vi.mock("@/server/domain/adherence/summary");
vi.mock("@/server/domain/doseEvents/service");
vi.mock("@/server/domain/doseEvents/reconcile");
vi.mock("@/server/domain/medications/service");

describe("Phase 18 — Dashboard domain service", () => {
  const userId = "user-1";

  const mockMed = {
    id: "med-1",
    userId,
    name: "Metformin",
    dosageAmount: "500",
    dosageUnit: "mg",
    instructions: "With food",
    notes: null,
    status: "active" as const,
    startDate: "2026-01-01",
    endDate: null,
    color: "blue",
    remindersEnabled: true,
    archivedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockMedDTO = {
    id: "med-1",
    name: "Metformin",
    dosageAmount: 500,
    dosageUnit: "mg",
    instructions: "With food",
    notes: null,
    status: "active" as const,
    startDate: "2026-01-01",
    endDate: null,
    color: "blue",
    remindersEnabled: true,
    frequencyLabel: "once-daily" as const,
    isArchived: false,
    slots: [],
    archivedAt: null,
    nextDoseAt: null,
    adherencePercent: null,
    createdAt: new Date(),
  };

  const mockSummary = {
    from: new Date("2026-02-22T00:00:00Z"),
    to: new Date("2026-03-01T00:00:00Z"),
    scheduled: 7,
    taken: 6,
    missed: 1,
    skipped: 0,
    snoozed: 0,
    adherencePercent: 85.7,
    streak: {
      current: 4,
      longest: 12,
      target: 14,
      currentEndsToday: true,
    },
    trend: {
      daily: [],
      rolling7: [],
      direction: "improving" as const,
      current7: 85.7,
      prior7: 80.5,
    },
    days: [
      {
        date: "2026-02-25",
        scheduled: 1,
        taken: 1,
        missed: 0,
        skipped: 0,
        snoozed: 0,
        adherencePercent: 100,
        streakDay: true,
      },
      {
        date: "2026-02-26",
        scheduled: 1,
        taken: 1,
        missed: 0,
        skipped: 0,
        snoozed: 0,
        adherencePercent: 100,
        streakDay: true,
      },
    ],
    byBucket: [],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(doseEventsService.ensureDoseEvents).mockResolvedValue({
      generatedCount: 0,
      horizonFrom: new Date(),
      horizonTo: new Date(),
    });
    vi.mocked(reconcileService.reconcileDoseStatuses).mockResolvedValue({
      autoMissedCount: 0,
      dueTransitionCount: 0,
    });
    vi.mocked(adherenceModule.getAdherenceSummary).mockResolvedValue(mockSummary);
    vi.mocked(medService.listMedications).mockResolvedValue([mockMedDTO]);
  });

  function createMockDb(doseRows: Record<string, unknown>[] = [], futureDoseRows: Record<string, unknown>[] = []) {
    let callIndex = 0;
    return {
      select: vi.fn(() => ({
        from: vi.fn((table: unknown) => {
          let rows: Record<string, unknown>[] = [];
          if (table === users) {
            rows = [{ timezone: "UTC" }];
          } else if (table === medications) {
            rows = [mockMed];
          } else if (table === doseEvents) {
            callIndex++;
            // Call 1 is today's doses; Call 2 is future doses
            rows = callIndex === 1 ? doseRows : futureDoseRows;
          }

          const queryPromise = Promise.resolve(rows);
          return {
            where: vi.fn(() =>
              Object.assign(queryPromise, {
                limit: vi.fn().mockResolvedValue(rows),
                orderBy: vi.fn(() =>
                  Object.assign(Promise.resolve(rows), {
                    limit: vi.fn().mockResolvedValue(rows),
                  }),
                ),
              }),
            ),
          };
        }),
      })),
    } as unknown as Db;
  }

  it("aggregates stats correctly when doses are taken and upcoming", async () => {
    const today = new Date();
    const dose1 = {
      id: "dose-1",
      userId,
      medicationId: "med-1",
      scheduleId: "slot-1",
      scheduledFor: new Date(today.getTime() - 3600000), // 1 hour ago
      dueAt: new Date(today.getTime() - 3600000),
      missDeadline: new Date(today.getTime() + 3600000),
      status: "taken" as const,
      source: "generated" as const,
      takenAt: new Date(today.getTime() - 3500000),
      snoozeCount: 0,
      snoozeUntil: null,
      skippedReason: null,
      version: 1,
      createdAt: today,
      updatedAt: today,
    };

    const dose2 = {
      id: "dose-2",
      userId,
      medicationId: "med-1",
      scheduleId: "slot-2",
      scheduledFor: new Date(today.getTime() + 7200000), // 2 hours in future
      dueAt: new Date(today.getTime() + 7200000),
      missDeadline: new Date(today.getTime() + 14400000),
      status: "upcoming" as const,
      source: "generated" as const,
      takenAt: null,
      snoozeCount: 0,
      snoozeUntil: null,
      skippedReason: null,
      version: 1,
      createdAt: today,
      updatedAt: today,
    };

    const mockDb = createMockDb([dose1, dose2]);
    const result = await getDashboardData(mockDb, userId);

    expect(doseEventsService.ensureDoseEvents).toHaveBeenCalledWith(mockDb, {
      userId,
      timeZone: "UTC",
    });
    expect(reconcileService.reconcileDoseStatuses).toHaveBeenCalledWith(mockDb, {
      userId,
    });

    expect(result.stats.takenToday).toBe(1);
    expect(result.stats.missedToday).toBe(0);
    expect(result.stats.scheduledToday).toBe(2);
    expect(result.stats.adherenceToday).toBe(100);
    expect(result.stats.currentStreak).toBe(4);
    expect(result.nextDose?.id).toBe("dose-2");
    expect(result.dueNow).toHaveLength(0);
    expect(result.today).toHaveLength(2);
    expect(result.medications).toHaveLength(1);
    expect(result.week).toEqual(mockSummary.days);
    expect(result.latestInsight).not.toBeNull();
    expect(result.caregiver.connectedCount).toBe(0);
  });

  it("identifies dueNow doses and computes nextDose", async () => {
    const today = new Date();
    const doseDue = {
      id: "dose-due",
      userId,
      medicationId: "med-1",
      scheduleId: "slot-1",
      scheduledFor: today,
      dueAt: today,
      missDeadline: new Date(today.getTime() + 7200000),
      status: "due" as const,
      source: "generated" as const,
      takenAt: null,
      snoozeCount: 0,
      snoozeUntil: null,
      skippedReason: null,
      version: 1,
      createdAt: today,
      updatedAt: today,
    };

    const mockDb = createMockDb([doseDue]);
    const result = await getDashboardData(mockDb, userId);

    expect(result.dueNow).toHaveLength(1);
    expect(result.dueNow[0]?.id).toBe("dose-due");
    expect(result.nextDose?.id).toBe("dose-due");
    // Since 0 doses have resolved yet, adherenceToday should be null
    expect(result.stats.adherenceToday).toBeNull();
    expect(result.stats.takenToday).toBe(0);
    expect(result.stats.scheduledToday).toBe(1);
  });

  it("handles empty state when no medications or doses exist", async () => {
    vi.mocked(medService.listMedications).mockResolvedValueOnce([]);
    const mockDb = createMockDb([]);
    const result = await getDashboardData(mockDb, userId);

    expect(result.stats.adherenceToday).toBeNull();
    expect(result.stats.scheduledToday).toBe(0);
    expect(result.stats.takenToday).toBe(0);
    expect(result.nextDose).toBeNull();
    expect(result.dueNow).toHaveLength(0);
    expect(result.today).toHaveLength(0);
    expect(result.medications).toHaveLength(0);
    expect(result.latestInsight).toBeNull();
  });
});
