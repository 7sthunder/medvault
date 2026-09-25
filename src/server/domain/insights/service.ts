/**
 * Phase 17 — AI insights domain service (§10.10).
 *
 * `generate` is the only write path: it builds a bounded snapshot (never mutates the
 * user's meds/schedules/dose events — read-only), asks the injected provider, validates
 * the reply against `insightResponseSchema`, falls back to the deterministic rule engine on
 * any provider/validation failure, then persists up to `RECENT_INSIGHTS` rows and prunes to
 * `INSIGHT_MAX_ROWS`. On a successful generation it also emits the `insight` notification.
 */

import { and, desc, eq, gte, notInArray } from "drizzle-orm";

import type { DbClient } from "@/server/db/helpers";
import { aiInsights, doseActions } from "@/server/db/schema";
import { now } from "@/shared/times";
import { RECENT_INSIGHTS, INSIGHT_MAX_ROWS } from "@/shared/constants";
import type { InsightSource, SuggestedAction } from "@/shared/enums";
import type { InsightDTO } from "@/shared/types";
import {
  INSIGHT_SNAPSHOT_CAPS,
  insightResponseSchema,
  type InsightItem,
  type InsightSnapshot,
} from "@/shared/validations/insight";

import { resolveAiProvider } from "./provider";
import { generateFallbackInsights } from "./fallback";
import { adherenceService, type AdherenceWindow } from "@/server/domain/adherence/service";
import { notificationsService } from "@/server/domain/notifications/service";
import { addLocalDays, combineDateAndTime, localDateKey } from "@/shared/times";

/** Result of one generation pass — the router hands `items` straight to the page. */
export interface InsightGenerationResult {
  /** Newly persisted rows (newest first, same order as generated). */
  items: InsightDTO[];
  /** Which engine produced the rows ('ai' or 'fallback'). */
  source: InsightSource;
  /** `true` when the user has no data yet — nothing was generated or persisted. */
  empty: boolean;
}

function toInsightDTO(row: typeof aiInsights.$inferSelect): InsightDTO {
  return {
    id: row.id,
    category: row.category,
    summary: row.summary,
    detail: row.detail,
    suggestedActionType: row.suggestedActionType,
    source: row.source,
    confidence: row.confidence == null ? null : Number(row.confidence),
    createdAt: row.createdAt,
  };
}

/** Start-of-local-day instant for a calendar key. */
function dayStart(dateKey: string, timeZone: string): Date {
  return combineDateAndTime(dateKey, "00:00", timeZone);
}

export const insightsService = {
  /**
   * §10.10 bounded snapshot. Every read is a strict read-only adherence aggregation
   * (`readOnly: true`): no reconcile, no re-materialize, so generating an insight can
   * never touch dose events, dose actions, notifications or caregiver alerts.
   */
  async snapshot(db: DbClient, userId: string, timeZone: string): Promise<InsightSnapshot> {
    const at = now();
    const todayKey = localDateKey(at, timeZone);
    const from = addLocalDays(dayStart(todayKey, timeZone), -(INSIGHT_SNAPSHOT_CAPS.dailyDays - 1), timeZone);
    const to = combineDateAndTime(todayKey, "23:59", timeZone);
    const window: AdherenceWindow = { from, to };
    const readOnly = { readOnly: true };

    const [summary, perMed, snoozeActions] = await Promise.all([
      adherenceService.summary(db, userId, timeZone, window, null, readOnly),
      adherenceService.byMedication(db, userId, timeZone, window, readOnly),
      db
        .select({ id: doseActions.id })
        .from(doseActions)
        .where(
          and(
            eq(doseActions.userId, userId),
            eq(doseActions.action, "snooze"),
            gte(doseActions.occurredAt, new Date(at.getTime() - 7 * 24 * 60 * 60 * 1000)),
          ),
        ),
    ]);

    const snapshot: InsightSnapshot = {
      windowDays: INSIGHT_SNAPSHOT_CAPS.dailyDays,
      generatedAt: at.toISOString(),
      totals: {
        scheduled: summary.scheduled,
        taken: summary.taken,
        missed: summary.missed,
        skipped: summary.skipped,
        snoozed: summary.snoozed,
        adherencePercent: summary.adherencePercent,
      },
      daily: summary.days.slice(-INSIGHT_SNAPSHOT_CAPS.dailyDays).map((d) => ({
        date: d.date,
        scheduled: d.scheduled,
        taken: d.taken,
        missed: d.missed,
        skipped: d.skipped,
        snoozed: d.snoozed,
        adherencePercent: d.adherencePercent,
      })),
      medications: perMed.slice(0, INSIGHT_SNAPSHOT_CAPS.medications).map((m) => ({
        name: m.name,
        adherencePercent: m.adherencePercent,
        taken: m.taken,
        missed: m.missed,
        skipped: m.skipped,
      })),
      buckets: summary.byBucket.slice(0, INSIGHT_SNAPSHOT_CAPS.buckets).map((b) => ({
        bucket: b.bucket,
        scheduled: b.scheduled,
        taken: b.taken,
        missed: b.missed,
        rate: b.rate,
      })),
      streak: { current: summary.streak.current, longest: summary.streak.longest },
      snoozeActionsLast7d: snoozeActions.length,
    };
    return snapshot;
  },

  /** One full generation pass — provider → validate → fallback → persist → prune → notify. */
  async generate(db: DbClient, userId: string, timeZone: string): Promise<InsightGenerationResult> {
    const snapshot = await this.snapshot(db, userId, timeZone);

    // Empty state — the page shows the prerequisites card, nothing is persisted.
    if (snapshot.totals.scheduled === 0 && snapshot.totals.taken === 0 && snapshot.totals.missed === 0) {
      return { items: [], source: "fallback", empty: true };
    }

    const at = now();
    let items: InsightItem[];
    let source: InsightSource = "fallback";

    const provider = resolveAiProvider();
    if (provider) {
      try {
        const parsed = insightResponseSchema.safeParse(await provider.generate(snapshot));
        if (parsed.success) {
          items = parsed.data.insights;
          source = "ai";
        } else {
          items = generateFallbackInsights(snapshot);
        }
      } catch {
        items = generateFallbackInsights(snapshot);
      }
    } else {
      items = generateFallbackInsights(snapshot);
    }

    if (items.length === 0) {
      return { items: [], source, empty: true };
    }

    const rows = await db
      .insert(aiInsights)
      .values(
        items.slice(0, RECENT_INSIGHTS).map((item) => ({
          id: crypto.randomUUID(),
          userId,
          category: item.category,
          summary: item.summary,
          detail: item.detail ?? null,
          suggestedActionType: (item.suggestedActionType ?? null) as SuggestedAction | null,
          dataSnapshot: JSON.stringify(snapshot),
          source,
          confidence: null,
          createdAt: at,
        })),
      )
      .returning();

    await pruneInsights(db, userId);

    // §10.7 `insight` notification → href `/insights` (gated on `insights` pref).
    await notificationsService.create(db, {
      userId,
      type: "insight",
      title: "New insights ready",
      body: `We found ${rows.length} pattern${rows.length === 1 ? "" : "s"} in your adherence — review them now.`,
      entityType: "insight",
      entityId: rows[0]!.id,
      createdAt: at,
    });

    return { items: rows.map(toInsightDTO), source, empty: false };
  },

  /** Newest `INSIGHT_MAX_ROWS` rows for the insights page (newest first). */
  async list(db: DbClient, userId: string): Promise<InsightDTO[]> {
    const rows = await db
      .select()
      .from(aiInsights)
      .where(eq(aiInsights.userId, userId))
      .orderBy(desc(aiInsights.createdAt))
      .limit(INSIGHT_MAX_ROWS);
    return rows.map(toInsightDTO);
  },
};

/** §10.10 keep-newest — delete any row older than the newest `INSIGHT_MAX_ROWS`. */
async function pruneInsights(db: DbClient, userId: string): Promise<void> {
  const keep = await db
    .select({ id: aiInsights.id })
    .from(aiInsights)
    .where(eq(aiInsights.userId, userId))
    .orderBy(desc(aiInsights.createdAt))
    .limit(INSIGHT_MAX_ROWS);
  if (keep.length === INSIGHT_MAX_ROWS) {
    await db
      .delete(aiInsights)
      .where(and(eq(aiInsights.userId, userId), notInArray(aiInsights.id, keep.map((r) => r.id))));
  }
}