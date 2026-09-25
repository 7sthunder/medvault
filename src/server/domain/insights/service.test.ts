import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Db } from "@/server/db/helpers";
import { aiInsights, doseEvents, medications } from "@/server/db/schema";
import * as adherenceService from "@/server/domain/adherence/service";
import * as notifService from "@/server/domain/notifications/service";
import {
  BEHAVIORAL_SYSTEM_PROMPT,
  buildSnapshot,
  generateFallbackInsights,
  generateInsights,
  getLatestInsight,
  type InsightSnapshot,
  listInsights,
} from "./service";
import { singleInsightSchema } from "@/shared/validations/insight";

vi.mock("@/server/domain/adherence/service");
vi.mock("@/server/domain/notifications/service");

describe("Phase 23 — AI Insights Domain Service", () => {
  const userId = "test-user-123";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Safety Prompt & Schema Boundaries", () => {
    it("strictly prohibits medical diagnostics and prescriptions in prompt", () => {
      expect(BEHAVIORAL_SYSTEM_PROMPT).toContain("DO NOT diagnose conditions or illnesses");
      expect(BEHAVIORAL_SYSTEM_PROMPT).toContain("DO NOT prescribe treatments");
      expect(BEHAVIORAL_SYSTEM_PROMPT).toContain("Focus ONLY on behavioral patterns");
    });

    it("rejects invalid or diagnostic categories via singleInsightSchema", () => {
      const valid = singleInsightSchema.safeParse({
        category: "timing_pattern",
        summary: "Consistent morning timing",
        detail: "Taking doses with breakfast enhances habit formation.",
        suggestedActionType: "review_schedule",
        confidence: 0.9,
      });
      expect(valid.success).toBe(true);

      const invalidCategory = singleInsightSchema.safeParse({
        category: "clinical_diagnosis",
        summary: "Condition diagnosis",
      });
      expect(invalidCategory.success).toBe(false);
    });
  });

  describe("Deterministic Fallback Rule Engine", () => {
    const baseSnapshot: InsightSnapshot = {
      adherencePercent: 100,
      totalScheduled: 10,
      totalTaken: 10,
      totalMissed: 0,
      totalSkipped: 0,
      streak: { current: 1, longest: 5 },
      trend: { direction: "stable", current7: 100, prior7: 100 },
      byBucket: [
        { bucket: "morning", adherencePercent: 100, scheduled: 5, taken: 5, missed: 0 },
        { bucket: "evening", adherencePercent: 100, scheduled: 5, taken: 5, missed: 0 },
      ],
      perMedication: [
        { id: "med-1", name: "Metformin", adherencePercent: 100, scheduled: 10, taken: 10, missed: 0 },
      ],
      recentSnoozeCount: 0,
      generatedAt: new Date().toISOString(),
    };

    it("generates timing_pattern insight when a bucket has lower adherence", () => {
      const snapshot: InsightSnapshot = {
        ...baseSnapshot,
        byBucket: [
          { bucket: "morning", adherencePercent: 100, scheduled: 5, taken: 5, missed: 0 },
          { bucket: "night", adherencePercent: 60, scheduled: 5, taken: 3, missed: 2 },
        ],
      };

      const insights = generateFallbackInsights(snapshot);
      const timingInsight = insights.find((i) => i.category === "timing_pattern");
      expect(timingInsight).toBeDefined();
      expect(timingInsight?.summary).toContain("Night doses show lower adherence (60%)");
      expect(timingInsight?.suggestedActionType).toBe("review_schedule");
    });

    it("generates snooze_pattern insight when snooze count is high", () => {
      const snapshot: InsightSnapshot = {
        ...baseSnapshot,
        recentSnoozeCount: 4,
      };

      const insights = generateFallbackInsights(snapshot);
      const snoozeInsight = insights.find((i) => i.category === "snooze_pattern");
      expect(snoozeInsight).toBeDefined();
      expect(snoozeInsight?.summary).toContain("Frequent snoozing detected (4 times)");
      expect(snoozeInsight?.suggestedActionType).toBe("review_reminders");
    });

    it("generates adherence_improvement insight on strong streak", () => {
      const snapshot: InsightSnapshot = {
        ...baseSnapshot,
        streak: { current: 7, longest: 14 },
      };

      const insights = generateFallbackInsights(snapshot);
      const streakInsight = insights.find((i) => i.category === "adherence_improvement");
      expect(streakInsight).toBeDefined();
      expect(streakInsight?.summary).toContain("7-day streak");
    });

    it("generates adherence_decline insight when 7-day trend drops", () => {
      const snapshot: InsightSnapshot = {
        ...baseSnapshot,
        streak: { current: 0, longest: 10 },
        trend: { direction: "declining", current7: 65, prior7: 90 },
      };

      const insights = generateFallbackInsights(snapshot);
      const declineInsight = insights.find((i) => i.category === "adherence_decline");
      expect(declineInsight).toBeDefined();
      expect(declineInsight?.summary).toContain("decreased over the last 7 days");
      expect(declineInsight?.suggestedActionType).toBe("review_caregiver");
    });

    it("generates medication_difference insight when one med has low adherence", () => {
      const snapshot: InsightSnapshot = {
        ...baseSnapshot,
        perMedication: [
          { id: "med-1", name: "Metformin", adherencePercent: 100, scheduled: 10, taken: 10, missed: 0 },
          { id: "med-2", name: "Lisinopril", adherencePercent: 50, scheduled: 6, taken: 3, missed: 3 },
        ],
      };

      const insights = generateFallbackInsights(snapshot);
      const medInsight = insights.find((i) => i.category === "medication_difference");
      expect(medInsight).toBeDefined();
      expect(medInsight?.summary).toContain("Lower adherence observed for Lisinopril");
    });

    it("returns general positive reinforcement when adherence is well-maintained and sparse", () => {
      const insights = generateFallbackInsights(baseSnapshot);
      expect(insights.length).toBeGreaterThanOrEqual(1);
      expect(insights[0]?.category).toBe("general");
      expect(insights[0]?.summary).toContain("Medication adherence is well-maintained");
    });
  });

  describe("Snapshot Builder & Data Aggregation", () => {
    it("builds snapshot from adherence domain summary and user medications", async () => {
      vi.mocked(adherenceService.getAdherenceSummary).mockResolvedValue({
        from: new Date("2026-08-26T00:00:00Z"),
        to: new Date("2026-09-25T00:00:00Z"),
        scheduled: 20,
        taken: 18,
        missed: 2,
        skipped: 0,
        snoozed: 1,
        adherencePercent: 90,
        streak: { current: 5, longest: 12, currentEndsToday: true },
        trend: {
          daily: [],
          rolling7: [],
          direction: "improving",
          current7: 95,
          prior7: 85,
        },
        days: [],
        byBucket: [
          { bucket: "morning", scheduled: 10, taken: 10, missed: 0, rate: 100 },
          { bucket: "evening", scheduled: 10, taken: 8, missed: 2, rate: 80 },
        ],
      });

      const mockDb = {
        select: vi.fn(() => ({
          from: vi.fn((table: unknown) => {
            if (table === medications) {
              return {
                where: vi.fn().mockResolvedValue([{ id: "med-1", name: "Metformin" }]),
              };
            }
            if (table === doseEvents) {
              return {
                where: vi.fn().mockResolvedValue([{ snoozeCount: 2 }]),
              };
            }
            return {
              where: vi.fn().mockResolvedValue([]),
            };
          }),
        })),
      } as unknown as Db;

      const snapshot = await buildSnapshot(mockDb, userId);

      expect(snapshot.adherencePercent).toBe(90);
      expect(snapshot.totalScheduled).toBe(20);
      expect(snapshot.totalTaken).toBe(18);
      expect(snapshot.totalMissed).toBe(2);
      expect(snapshot.streak.current).toBe(5);
      expect(snapshot.recentSnoozeCount).toBe(2);
      expect(snapshot.perMedication).toHaveLength(1);
      expect(snapshot.perMedication[0]?.name).toBe("Metformin");
    });
  });

  describe("generateInsights, Pruning & Immutability", () => {
    it("generates fallback insights, persists them, notifies, and prunes when count > 20", async () => {
      vi.mocked(adherenceService.getAdherenceSummary).mockResolvedValue({
        from: new Date(),
        to: new Date(),
        scheduled: 10,
        taken: 10,
        missed: 0,
        skipped: 0,
        snoozed: 0,
        adherencePercent: 100,
        streak: { current: 4, longest: 10, currentEndsToday: true },
        trend: { daily: [], rolling7: [], direction: "stable", current7: 100, prior7: 100 },
        days: [],
        byBucket: [],
      });

      const insertedRows: Record<string, unknown>[] = [];
      const deletedIds: string[] = [];

      // Existing 22 rows to trigger pruning
      const existingRows = Array.from({ length: 22 }, (_, i) => ({
        id: `existing-insight-${i}`,
      }));

      const mockDb = {
        select: vi.fn(() => ({
          from: vi.fn((table: unknown) => {
            if (table === medications) {
              return { where: vi.fn().mockResolvedValue([]) };
            }
            if (table === doseEvents) {
              return { where: vi.fn().mockResolvedValue([]) };
            }
            if (table === aiInsights) {
              return {
                where: vi.fn(() => ({
                  orderBy: vi.fn().mockResolvedValue(existingRows),
                })),
              };
            }
            return { where: vi.fn().mockResolvedValue([]) };
          }),
        })),
        insert: vi.fn(() => ({
          values: vi.fn((vals: Record<string, unknown>) => {
            insertedRows.push(vals);
            return {
              returning: vi.fn().mockResolvedValue([
                {
                  id: vals.id || "gen-id",
                  userId: vals.userId,
                  category: vals.category,
                  summary: vals.summary,
                  detail: vals.detail,
                  suggestedActionType: vals.suggestedActionType,
                  source: vals.source,
                  confidence: vals.confidence,
                  createdAt: vals.createdAt,
                },
              ]),
            };
          }),
        })),
        delete: vi.fn(() => ({
          where: vi.fn(() => {
            deletedIds.push("deleted");
            return Promise.resolve();
          }),
        })),
      } as unknown as Db;

      const results = await generateInsights(mockDb, userId);

      expect(results.length).toBeGreaterThanOrEqual(1);
      expect(results[0]?.source).toBe("fallback");
      expect(insertedRows.length).toBe(results.length);
      expect(notifService.createNotification).toHaveBeenCalled();

      // Pruning verification: 22 existing rows > 20 limit -> 2 rows deleted
      expect(deletedIds.length).toBe(2);
    });

    it("verifies compile and test boundary: never mutates medication schedules or records", async () => {
      vi.mocked(adherenceService.getAdherenceSummary).mockResolvedValue({
        from: new Date(),
        to: new Date(),
        scheduled: 0,
        taken: 0,
        missed: 0,
        skipped: 0,
        snoozed: 0,
        adherencePercent: 100,
        streak: { current: 0, longest: 0, currentEndsToday: false },
        trend: { daily: [], rolling7: [], direction: "stable", current7: 100, prior7: 100 },
        days: [],
        byBucket: [],
      });

      const updatedTables: unknown[] = [];
      const mockDb = {
        select: vi.fn(() => ({
          from: vi.fn(() => ({
            where: vi.fn(() =>
              Object.assign(Promise.resolve([]), {
                orderBy: vi.fn().mockResolvedValue([]),
              }),
            ),
          })),
        })),
        insert: vi.fn(() => ({
          values: vi.fn((vals: Record<string, unknown>) => ({
            returning: vi.fn().mockResolvedValue([vals]),
          })),
        })),
        update: vi.fn((table: unknown) => {
          updatedTables.push(table);
          return { set: vi.fn(() => ({ where: vi.fn().mockResolvedValue([]) })) };
        }),
        delete: vi.fn(() => ({
          where: vi.fn().mockResolvedValue([]),
        })),
      } as unknown as Db;

      await generateInsights(mockDb, userId);

      // Verify db.update was NEVER called (medications, doseEvents, schedules are untouched)
      expect(updatedTables).toHaveLength(0);
      expect(mockDb.update).not.toHaveBeenCalled();
    });
  });

  describe("listInsights and getLatestInsight", () => {
    it("listInsights returns ordered DTOs", async () => {
      const row = {
        id: "insight-1",
        userId,
        category: "timing_pattern",
        summary: "Morning timing consistent",
        detail: "Doses taken on time",
        suggestedActionType: "review_schedule",
        source: "fallback",
        confidence: "0.95",
        createdAt: new Date(),
      };

      const mockDb = {
        select: vi.fn(() => ({
          from: vi.fn(() => ({
            where: vi.fn(() => ({
              orderBy: vi.fn(() => ({
                limit: vi.fn().mockResolvedValue([row]),
              })),
            })),
          })),
        })),
      } as unknown as Db;

      const list = await listInsights(mockDb, userId);
      expect(list).toHaveLength(1);
      expect(list[0]?.id).toBe("insight-1");
      expect(list[0]?.confidence).toBe(0.95);
    });

    it("getLatestInsight returns null when no insights exist", async () => {
      const mockDb = {
        select: vi.fn(() => ({
          from: vi.fn(() => ({
            where: vi.fn(() => ({
              orderBy: vi.fn(() => ({
                limit: vi.fn().mockResolvedValue([]),
              })),
            })),
          })),
        })),
      } as unknown as Db;

      const latest = await getLatestInsight(mockDb, userId);
      expect(latest).toBeNull();
    });
  });
});
