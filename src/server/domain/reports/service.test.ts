import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Db } from "@/server/db/helpers";
import { users } from "@/server/db/schema";
import * as adherenceService from "@/server/domain/adherence/service";
import type { AdherenceSummaryDTO, MedicationPerformanceDTO } from "@/shared/types";
import { generateReportCsv, getReportData } from "./service";

vi.mock("@/server/domain/adherence/service");

describe("Phase 20 — Reports domain service", () => {
  const userId = "user-123";

  const mockAdherenceSummary: AdherenceSummaryDTO = {
    from: new Date("2026-03-01T00:00:00Z"),
    to: new Date("2026-03-31T23:59:59Z"),
    scheduled: 60,
    taken: 50,
    missed: 6,
    skipped: 4,
    snoozed: 3,
    adherencePercent: 83.3,
    days: [
      {
        date: "2026-03-01", // Week 2026-W09
        scheduled: 2,
        taken: 2,
        missed: 0,
        skipped: 0,
        snoozed: 0,
        adherencePercent: 100,
        streakDay: true,
      },
      {
        date: "2026-03-02", // Week 2026-W10
        scheduled: 2,
        taken: 1,
        missed: 1,
        skipped: 0,
        snoozed: 1,
        adherencePercent: 50,
        streakDay: false,
      },
      {
        date: "2026-03-03", // Week 2026-W10
        scheduled: 2,
        taken: 2,
        missed: 0,
        skipped: 0,
        snoozed: 0,
        adherencePercent: 100,
        streakDay: true,
      },
      {
        date: "2026-03-04", // Week 2026-W10
        scheduled: 2,
        taken: 1,
        missed: 0,
        skipped: 1,
        snoozed: 0,
        adherencePercent: 50,
        streakDay: false,
      },
    ],
    streak: {
      current: 2,
      longest: 14,
      currentEndsToday: true,
    },
    trend: {
      daily: [],
      rolling7: [],
      direction: "improving",
      current7: 85,
      prior7: 80,
    },
    byBucket: [
      {
        bucket: "morning",
        scheduled: 30,
        taken: 28,
        missed: 1,
        rate: 93.3,
      },
      {
        bucket: "afternoon",
        scheduled: 0,
        taken: 0,
        missed: 0,
        rate: null,
      },
      {
        bucket: "evening",
        scheduled: 30,
        taken: 22,
        missed: 5,
        rate: 73.3,
      },
      {
        bucket: "night",
        scheduled: 0,
        taken: 0,
        missed: 0,
        rate: null,
      },
    ],
  };

  const mockMedPerformance: MedicationPerformanceDTO[] = [
    {
      medicationId: "med-1",
      name: "Metformin",
      color: "blue",
      frequencyLabel: "once-daily",
      scheduled: 30,
      taken: 28,
      missed: 1,
      skipped: 1,
      adherencePercent: 93.3,
      bestBucket: "morning",
      worstBucket: "evening",
      lastTakenAt: new Date("2026-03-04T08:00:00Z"),
    },
    {
      medicationId: "med-2",
      name: "Atorvastatin",
      color: "emerald",
      frequencyLabel: "once-daily",
      scheduled: 30,
      taken: 22,
      missed: 5,
      skipped: 3,
      adherencePercent: 73.3,
      bestBucket: "evening",
      worstBucket: "evening",
      lastTakenAt: new Date("2026-03-03T20:00:00Z"),
    },
  ];

  function createMockDb() {
    return {
      select: vi.fn(() => ({
        from: vi.fn((table: unknown) => {
          let rows: Record<string, unknown>[] = [];
          if (table === users) {
            rows = [{ timezone: "UTC" }];
          }
          const queryPromise = Promise.resolve(rows);
          return {
            where: vi.fn(() =>
              Object.assign(queryPromise, {
                limit: vi.fn().mockResolvedValue(rows),
              }),
            ),
          };
        }),
      })),
    } as unknown as Db;
  }

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(adherenceService.getAdherenceSummary).mockResolvedValue(mockAdherenceSummary);
    vi.mocked(adherenceService.getMedicationPerformance).mockResolvedValue(mockMedPerformance);
  });

  describe("getReportData", () => {
    it("aggregates daily report rows matching adherenceSummary", async () => {
      const db = createMockDb();
      const report = await getReportData(db, userId, {
        from: "2026-03-01",
        to: "2026-03-04",
        granularity: "daily",
      });

      expect(report.granularity).toBe("daily");
      expect(report.table).toHaveLength(4);
      expect(report.table[0]?.period).toBe("2026-03-01");
      expect(report.table[0]?.scheduled).toBe(2);
      expect(report.table[0]?.taken).toBe(2);
      expect(report.table[0]?.adherencePercent).toBe(100);

      // Verify mathematical parity
      const totalScheduled = report.table.reduce((sum, r) => sum + r.scheduled, 0);
      const totalTaken = report.table.reduce((sum, r) => sum + r.taken, 0);
      const totalMissed = report.table.reduce((sum, r) => sum + r.missed, 0);
      const totalSkipped = report.table.reduce((sum, r) => sum + r.skipped, 0);

      expect(totalScheduled).toBe(8);
      expect(totalTaken).toBe(6);
      expect(totalMissed).toBe(1);
      expect(totalSkipped).toBe(1);

      // Top summary parity
      expect(report.summary.scheduled).toBe(mockAdherenceSummary.scheduled);
      expect(report.summary.taken).toBe(mockAdherenceSummary.taken);
      expect(report.summary.missed).toBe(mockAdherenceSummary.missed);
      expect(report.summary.skipped).toBe(mockAdherenceSummary.skipped);
      expect(report.summary.adherencePercent).toBe(mockAdherenceSummary.adherencePercent);

      // Trend series parity
      expect(report.trend).toHaveLength(4);
      expect(report.trend[0]?.label).toBe("2026-03-01");
      expect(report.trend[0]?.adherence).toBe(100);
    });

    it("aggregates weekly report rows into ISO weeks", async () => {
      const db = createMockDb();
      const report = await getReportData(db, userId, {
        from: "2026-03-01",
        to: "2026-03-04",
        granularity: "weekly",
      });

      expect(report.granularity).toBe("weekly");
      // 2026-03-01 is Sunday of week 9 (2026-W09)
      // 2026-03-02, 03, 04 are week 10 (2026-W10)
      expect(report.table).toHaveLength(2);

      const week9 = report.table.find((r) => r.period === "2026-W09");
      const week10 = report.table.find((r) => r.period === "2026-W10");

      expect(week9).toBeDefined();
      expect(week9?.scheduled).toBe(2);
      expect(week9?.taken).toBe(2);
      expect(week9?.adherencePercent).toBe(100);

      expect(week10).toBeDefined();
      expect(week10?.scheduled).toBe(6); // 2 + 2 + 2
      expect(week10?.taken).toBe(4); // 1 + 2 + 1
      expect(week10?.missed).toBe(1);
      expect(week10?.skipped).toBe(1);
      expect(week10?.adherencePercent).toBe(66.7);

      // Parity check across all weeks
      const sumScheduled = report.table.reduce((sum, r) => sum + r.scheduled, 0);
      const sumTaken = report.table.reduce((sum, r) => sum + r.taken, 0);
      expect(sumScheduled).toBe(8);
      expect(sumTaken).toBe(4 + 2);
    });

    it("aggregates monthly report rows into YYYY-MM", async () => {
      const db = createMockDb();
      const report = await getReportData(db, userId, {
        from: "2026-03-01",
        to: "2026-03-04",
        granularity: "monthly",
      });

      expect(report.granularity).toBe("monthly");
      expect(report.table).toHaveLength(1);
      expect(report.table[0]?.period).toBe("2026-03");
      expect(report.table[0]?.scheduled).toBe(8);
      expect(report.table[0]?.taken).toBe(6);
      expect(report.table[0]?.missed).toBe(1);
      expect(report.table[0]?.skipped).toBe(1);
      expect(report.table[0]?.adherencePercent).toBe(75);
    });

    it("filters missed dose analysis when medicationId is specified", async () => {
      const db = createMockDb();
      const report = await getReportData(db, userId, {
        from: "2026-03-01",
        to: "2026-03-04",
        granularity: "daily",
        medicationId: "med-2",
      });

      expect(adherenceService.getAdherenceSummary).toHaveBeenCalledWith(
        db,
        userId,
        expect.objectContaining({ medicationId: "med-2" }),
      );

      expect(report.medicationId).toBe("med-2");
      expect(report.missedAnalysis.byMedication).toHaveLength(1);
      expect(report.missedAnalysis.byMedication[0]?.medicationId).toBe("med-2");
      expect(report.missedAnalysis.byMedication[0]?.missed).toBe(5);
    });

    it("sorts byMedication descending by missed count", async () => {
      const db = createMockDb();
      const report = await getReportData(db, userId, {
        from: "2026-03-01",
        to: "2026-03-04",
      });

      expect(report.missedAnalysis.byMedication).toHaveLength(2);
      expect(report.missedAnalysis.byMedication[0]?.medicationId).toBe("med-2"); // 5 missed
      expect(report.missedAnalysis.byMedication[1]?.medicationId).toBe("med-1"); // 1 missed
    });
  });

  describe("generateReportCsv", () => {
    it("generates valid RFC 4180 CSV with header and data rows", () => {
      const report = {
        granularity: "daily" as const,
        from: new Date("2026-03-01T00:00:00Z"),
        to: new Date("2026-03-02T23:59:59Z"),
        table: [
          {
            period: "2026-03-01",
            scheduled: 4,
            taken: 4,
            missed: 0,
            skipped: 0,
            adherencePercent: 100,
          },
          {
            period: "2026-03-02",
            scheduled: 4,
            taken: 2,
            missed: 1,
            skipped: 1,
            adherencePercent: 50,
          },
        ],
        trend: [],
        summary: {
          scheduled: 8,
          taken: 6,
          missed: 1,
          skipped: 1,
          adherencePercent: 75,
        },
        missedAnalysis: {
          byBucket: [],
          byMedication: [],
        },
      };

      const csv = generateReportCsv(report);
      const lines = csv.trim().split("\r\n");

      expect(lines[0]).toBe("Period,Scheduled,Taken,Missed,Skipped,Adherence Rate");
      expect(lines[1]).toBe("2026-03-01,4,4,0,0,100%");
      expect(lines[2]).toBe("2026-03-02,4,2,1,1,50%");
      expect(lines).toHaveLength(3);
    });

    it("handles null adherence percentages as N/A", () => {
      const report = {
        granularity: "daily" as const,
        from: new Date("2026-03-01T00:00:00Z"),
        to: new Date("2026-03-01T23:59:59Z"),
        table: [
          {
            period: "2026-03-01",
            scheduled: 0,
            taken: 0,
            missed: 0,
            skipped: 0,
            adherencePercent: null,
          },
        ],
        trend: [],
        summary: {
          scheduled: 0,
          taken: 0,
          missed: 0,
          skipped: 0,
          adherencePercent: null,
        },
        missedAnalysis: {
          byBucket: [],
          byMedication: [],
        },
      };

      const csv = generateReportCsv(report);
      expect(csv).toContain("2026-03-01,0,0,0,0,N/A");
    });
  });
});
