import { afterAll, describe, expect, it } from "vitest";
import { and, count, eq } from "drizzle-orm";

import { db, pool } from "@/server/db/client";
import { uuidv7 } from "@/server/db/helpers";
import type { DbTx } from "@/server/db/helpers";
import {
  adherenceDaily,
  aiInsights,
  doseActions,
  doseEvents,
  medications,
  notifications,
  users,
} from "@/server/db/schema";
import { INSIGHT_MAX_ROWS } from "@/shared/constants";
import { insightResponseSchema } from "@/shared/validations/insight";

import { generateFallbackInsights } from "./fallback";
import { AI_SYSTEM_PROMPT } from "./provider";
import { insightsService } from "./service";

/**
 * Phase 17 acceptance — §10.10. Two boundaries are pinned here:
 *  1. the AI behavioral boundary (no diagnose / no prescribe, validated structured output,
 *     deterministic fallback), and
 *  2. the NEVER-MUTATE boundary — building a snapshot must not reconcile dose events, write
 *     dose actions, materialize `adherence_daily` or raise notifications/alerts.
 */
const dbTests = describe.skipIf(!process.env.DATABASE_URL);

class RollbackSignal extends Error {
  constructor() {
    super("expected rollback");
  }
}

async function inRollbackTransaction<T>(fn: (tx: DbTx, userId: string) => Promise<T>): Promise<T> {
  let result: T | undefined;
  try {
    await db.transaction(async (tx) => {
      const [user] = await tx
        .insert(users)
        .values({
          id: uuidv7(),
          name: "Insight Tester",
          email: `insight-${uuidv7()}@meditrackai.local`,
          timezone: "UTC",
          onboardingCompleted: true,
        })
        .returning({ id: users.id });
      result = await fn(tx, user!.id);
      throw new RollbackSignal();
    });
  } catch (err) {
    if (err instanceof RollbackSignal) return result as T;
    throw err;
  }
  throw new Error("unreachable");
}

async function seedMed(tx: DbTx, userId: string) {
  const medicationId = uuidv7();
  await tx.insert(medications).values({
    id: medicationId,
    userId,
    name: "Metformin",
    dosageAmount: "500",
    dosageUnit: "mg",
    status: "active",
    startDate: new Date(Date.now() - 30 * 86_400_000).toISOString().slice(0, 10),
  });
  return medicationId;
}

function doseEvent(
  overrides: Partial<typeof doseEvents.$inferInsert> & {
    id: string;
    userId: string;
    medicationId: string;
  },
) {
  return {
    snoozeCount: 0,
    statusUpdatedAt: new Date(),
    ...overrides,
  } as typeof doseEvents.$inferInsert;
}

async function countWhere(
  tx: DbTx,
  table: typeof doseActions | typeof adherenceDaily,
  userId: string,
): Promise<number> {
  const [row] = await tx
    .select({ n: count() })
    .from(table as typeof doseActions)
    .where(eq((table as typeof doseActions).userId, userId));
  return Number(row?.n ?? 0);
}

/** Runs `fn` with the AI provider disabled so no test ever hits the network. */
async function withoutAiProvider<T>(fn: () => Promise<T>): Promise<T> {
  const previous = process.env.AI_GEMINI_API_KEY;
  delete process.env.AI_GEMINI_API_KEY;
  try {
    return await fn();
  } finally {
    if (previous !== undefined) process.env.AI_GEMINI_API_KEY = previous;
  }
}

afterAll(async () => {
  await pool.end();
});

describe("insight output contract (§10.10 — behavioral boundary)", () => {
  it("system prompt forbids diagnosis, prescribing and medication changes", () => {
    expect(AI_SYSTEM_PROMPT).toMatch(/Do NOT diagnose/i);
    expect(AI_SYSTEM_PROMPT).toMatch(/Do NOT prescribe/i);
    expect(AI_SYSTEM_PROMPT).toMatch(/changing any medication or dosage/i);
  });

  it("rejects a diagnostic/prescriptive category and strips unknown keys", () => {
    const diagnostic = insightResponseSchema.safeParse({
      tone: "neutral",
      insights: [
        { category: "diagnosis", summary: "You have type 2 diabetes", suggestedActionType: null },
      ],
    });
    expect(diagnostic.success).toBe(false);

    const prescriptive = insightResponseSchema.safeParse({
      tone: "encouraging",
      insights: [
        {
          category: "general",
          summary: "Stop taking Metformin",
          suggestedActionType: "increase_dose",
        },
      ],
    });
    expect(prescriptive.success).toBe(false);

    const clean = insightResponseSchema.parse({
      tone: "encouraging",
      insights: [
        {
          category: "snooze_pattern",
          summary: "You snooze evening doses most often.",
          detail: "Consider moving the reminder earlier.",
          suggestedActionType: "review_reminders",
          hallucinatedExtraField: "should be stripped",
        },
      ],
    });
    expect(clean.insights[0]).not.toHaveProperty("hallucinatedExtraField");
  });

  it("fallback engine is deterministic and never fabricates on empty data", () => {
    const empty = generateFallbackInsights({
      windowDays: 30,
      generatedAt: new Date().toISOString(),
      totals: { scheduled: 0, taken: 0, missed: 0, skipped: 0, snoozed: 0, adherencePercent: null },
      daily: [],
      medications: [],
      buckets: [],
      streak: { current: 0, longest: 0 },
      snoozeActionsLast7d: 0,
    });
    expect(empty).toEqual([]);

    const day = (date: string, taken: number, missed: number) => ({
      date,
      scheduled: taken + missed,
      taken,
      missed,
      skipped: 0,
      snoozed: 0,
      adherencePercent: taken + missed === 0 ? null : Math.round((taken / (taken + missed)) * 100),
    });
    const snapshot = {
      windowDays: 30,
      generatedAt: new Date().toISOString(),
      totals: {
        scheduled: 14,
        taken: 4,
        missed: 10,
        skipped: 0,
        snoozed: 0,
        adherencePercent: 28.6,
      },
      daily: [
        ...Array.from({ length: 7 }, (_, i) =>
          day(`2026-05-${String(i + 1).padStart(2, "0")}`, 8, 2),
        ),
        ...Array.from({ length: 7 }, (_, i) =>
          day(`2026-04-${String(i + 1).padStart(2, "0")}`, 2, 8),
        ),
      ],
      medications: [
        { name: "Metformin", adherencePercent: 30, taken: 3, missed: 7, skipped: 0 },
        { name: "Vitamin D", adherencePercent: 95, taken: 19, missed: 1, skipped: 0 },
      ],
      buckets: [{ bucket: "evening" as const, scheduled: 14, taken: 4, missed: 10, rate: 28.6 }],
      streak: { current: 1, longest: 3 },
      snoozeActionsLast7d: 0,
    };

    const first = generateFallbackInsights(snapshot);
    const second = generateFallbackInsights(snapshot);
    expect(first).toEqual(second);
    expect(first.length).toBeGreaterThan(0);

    // Highest-miss bucket + the medication gap are the two data-driven rules.
    expect(first.some((i) => i.category === "missed_analysis" && /evening/i.test(i.summary))).toBe(
      true,
    );
    expect(
      first.some((i) => i.category === "medication_difference" && /Metformin/.test(i.summary)),
    ).toBe(true);
    expect(first.every((i) => typeof i.summary === "string" && i.summary.length > 0)).toBe(true);
  });
});

dbTests("insight snapshot is strictly read-only (§10.10 never-mutate)", () => {
  it("builds the snapshot without reconciling events, writing dose actions or materializing", async () => {
    await inRollbackTransaction(async (tx, userId) => {
      const medicationId = await seedMed(tx, userId);

      // An overdue "upcoming" event: the canonical read path would flip it to `missed`
      // and write a `missed_auto` dose action. The read-only path must not.
      const staleId = uuidv7();
      await tx.insert(doseEvents).values(
        doseEvent({
          id: staleId,
          userId,
          medicationId,
          scheduledFor: new Date(Date.now() - 3 * 86_400_000),
          status: "upcoming",
        }),
      );

      // Plus settled history so the snapshot has real numbers to report.
      for (let i = 1; i <= 5; i += 1) {
        await tx.insert(doseEvents).values(
          doseEvent({
            id: uuidv7(),
            userId,
            medicationId,
            scheduledFor: new Date(Date.now() - i * 86_400_000),
            status: i === 5 ? "missed" : "taken",
            takenAt: i === 5 ? null : new Date(),
          }),
        );
      }

      const snapshot = await insightsService.snapshot(tx, userId, "UTC");

      // Boundary: nothing was written.
      const [event] = await tx
        .select({ status: doseEvents.status })
        .from(doseEvents)
        .where(eq(doseEvents.id, staleId));
      expect(event!.status).toBe("upcoming"); // not reconciled to `missed`
      expect(await countWhere(tx, doseActions, userId)).toBe(0); // no missed_auto action
      expect(await countWhere(tx, adherenceDaily, userId)).toBe(0); // not materialized
      const [notif] = await tx
        .select({ n: count() })
        .from(notifications)
        .where(eq(notifications.userId, userId));
      expect(Number(notif!.n)).toBe(0); // no notification fan-out

      // ...and it reports the same effective numbers the canonical write path would:
      // the stale row is counted as missed in memory without being persisted as missed.
      expect(snapshot.totals.scheduled).toBe(6);
      expect(snapshot.totals.taken).toBe(4);
      expect(snapshot.totals.missed).toBe(2);
      expect(snapshot.medications.map((m) => m.name)).toContain("Metformin");
      expect(snapshot.daily.length).toBeGreaterThan(0);
    });
  }, 30_000);

  it("snapshot stays within the §10.10 size caps", async () => {
    await inRollbackTransaction(async (tx, userId) => {
      await seedMed(tx, userId);
      const snapshot = await insightsService.snapshot(tx, userId, "UTC");
      expect(snapshot.windowDays).toBe(30);
      expect(snapshot.daily.length).toBeLessThanOrEqual(30);
      expect(snapshot.medications.length).toBeLessThanOrEqual(50);
      expect(snapshot.buckets.length).toBeLessThanOrEqual(4);
    });
  }, 30_000);
});

dbTests("insight generation (§10.10 fallback-safe pipeline)", () => {
  it("falls back to the deterministic engine when no provider is configured, and labels the rows", async () => {
    await withoutAiProvider(() =>
      inRollbackTransaction(async (tx, userId) => {
        const medicationId = await seedMed(tx, userId);
        for (let i = 1; i <= 6; i += 1) {
          await tx.insert(doseEvents).values(
            doseEvent({
              id: uuidv7(),
              userId,
              medicationId,
              scheduledFor: new Date(Date.now() - i * 86_400_000),
              status: i <= 4 ? "taken" : "missed",
              takenAt: i <= 4 ? new Date() : null,
            }),
          );
        }

        const result = await insightsService.generate(tx, userId, "UTC");
        expect(result.source).toBe("fallback");
        expect(result.empty).toBe(false);
        expect(result.items.length).toBeGreaterThan(0);
        expect(result.items.every((i) => i.source === "fallback")).toBe(true);

        // Snapshot is stored on the row and the user is notified via the single writer.
        const [row] = await tx
          .select({ dataSnapshot: aiInsights.dataSnapshot })
          .from(aiInsights)
          .where(eq(aiInsights.userId, userId))
          .limit(1);
        const raw = row!.dataSnapshot;
        const stored = (typeof raw === "string" ? JSON.parse(raw) : raw) as {
          windowDays: number;
          totals: { taken: number };
        };
        expect(stored.windowDays).toBe(30);
        expect(stored.totals.taken).toBe(4);

        const [notif] = await tx
          .select({ n: count() })
          .from(notifications)
          .where(and(eq(notifications.userId, userId), eq(notifications.type, "insight")));
        expect(Number(notif!.n)).toBe(1);

        expect(await insightsService.list(tx, userId)).toHaveLength(result.items.length);
      }),
    );
  }, 30_000);

  it("returns the prerequisites state without persisting when there is no data", async () => {
    await withoutAiProvider(() =>
      inRollbackTransaction(async (tx, userId) => {
        const result = await insightsService.generate(tx, userId, "UTC");
        expect(result.empty).toBe(true);
        expect(result.items).toEqual([]);
        expect(await insightsService.list(tx, userId)).toEqual([]);
      }),
    );
  }, 30_000);

  it("prunes the history to the newest INSIGHT_MAX_ROWS rows", async () => {
    await withoutAiProvider(() =>
      inRollbackTransaction(async (tx, userId) => {
        const medicationId = await seedMed(tx, userId);
        for (let i = 1; i <= 3; i += 1) {
          await tx.insert(doseEvents).values(
            doseEvent({
              id: uuidv7(),
              userId,
              medicationId,
              scheduledFor: new Date(Date.now() - i * 86_400_000),
              status: "taken",
              takenAt: new Date(),
            }),
          );
        }

        // Pre-fill beyond the cap so the prune branch is exercised.
        for (let i = 0; i < INSIGHT_MAX_ROWS + 5; i += 1) {
          await tx.insert(aiInsights).values({
            id: uuidv7(),
            userId,
            category: "general",
            summary: `Old insight ${i}`,
            detail: null,
            suggestedActionType: null,
            dataSnapshot: "{}",
            source: "fallback",
            confidence: null,
            createdAt: new Date(Date.now() - (INSIGHT_MAX_ROWS + 5 - i) * 60_000),
          });
        }

        await insightsService.generate(tx, userId, "UTC");
        expect(await insightsService.list(tx, userId)).toHaveLength(INSIGHT_MAX_ROWS);
      }),
    );
  }, 30_000);
});
