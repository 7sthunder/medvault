import { and, desc, eq } from "drizzle-orm";
import type { Db, DbTx } from "@/server/db/helpers";
import { uuidv7 } from "@/server/db/helpers";
import { aiInsights, doseEvents, medications } from "@/server/db/schema";
import { getAdherenceSummary } from "@/server/domain/adherence/service";
import { createNotification } from "@/server/domain/notifications/service";
import { subDays } from "date-fns";
import type { InsightCategory, InsightSource, SuggestedAction, TimeBucket } from "@/shared/enums";
import { now } from "@/shared/times";
import type { InsightDTO } from "@/shared/types";
import {
  insightResponseSchema,
  type SingleInsight,
} from "@/shared/validations/insight";

export interface MedicationSnapshot {
  id: string;
  name: string;
  adherencePercent: number;
  scheduled: number;
  taken: number;
  missed: number;
}

export interface BucketSnapshot {
  bucket: TimeBucket;
  adherencePercent: number;
  scheduled: number;
  taken: number;
  missed: number;
}

export interface InsightSnapshot {
  adherencePercent: number;
  totalScheduled: number;
  totalTaken: number;
  totalMissed: number;
  totalSkipped: number;
  streak: { current: number; longest: number };
  trend: {
    direction: "improving" | "declining" | "stable";
    current7: number;
    prior7: number;
  };
  byBucket: BucketSnapshot[];
  perMedication: MedicationSnapshot[];
  recentSnoozeCount: number;
  generatedAt: string;
}

export const BEHAVIORAL_SYSTEM_PROMPT = `
You are a supportive, behavioral health coach for MedVault medication adherence.
STRICT SAFETY BOUNDARIES:
- DO NOT diagnose conditions or illnesses.
- DO NOT prescribe treatments, adjustments to medication brands, or dosages.
- DO NOT recommend stopping, pausing, or changing prescription medications.
- Focus ONLY on behavioral patterns: timing habits, routine pairing, reminder settings, and caregiver support.
- If data is sparse or perfect, offer positive reinforcement.
- Return structured JSON with category, summary, detail, and suggestedActionType.
`.trim();

/**
 * Builds an analytics snapshot over the user's last 30 days of data.
 * Purely read-only; does not mutate any tables.
 */
export async function buildSnapshot(
  db: Db | DbTx,
  userId: string,
): Promise<InsightSnapshot> {
  const currentNow = now();
  const thirtyDaysAgo = subDays(currentNow, 30);

  const summary = await getAdherenceSummary(db, userId, {
    from: thirtyDaysAgo,
    to: currentNow,
  });

  // Query medications for breakdown
  const userMeds = await db
    .select({ id: medications.id, name: medications.name })
    .from(medications)
    .where(eq(medications.userId, userId));

  const perMedication: MedicationSnapshot[] = [];

  for (const med of userMeds) {
    const medSummary = await getAdherenceSummary(db, userId, {
      from: thirtyDaysAgo,
      to: currentNow,
      medicationId: med.id,
    });

    perMedication.push({
      id: med.id,
      name: med.name,
      adherencePercent: medSummary.adherencePercent ?? 100,
      scheduled: medSummary.scheduled,
      taken: medSummary.taken,
      missed: medSummary.missed,
    });
  }

  // Count snoozed doses in the period
  const snoozedRows = await db
    .select({ snoozeCount: doseEvents.snoozeCount })
    .from(doseEvents)
    .where(and(eq(doseEvents.userId, userId), eq(doseEvents.status, "snoozed")));

  const recentSnoozeCount = snoozedRows.reduce((acc, row) => acc + (row.snoozeCount || 1), 0);

  const byBucket: BucketSnapshot[] = summary.byBucket.map((b) => ({
    bucket: b.bucket,
    adherencePercent: b.rate ?? 100,
    scheduled: b.scheduled,
    taken: b.taken,
    missed: b.missed,
  }));

  return {
    adherencePercent: summary.adherencePercent ?? 100,
    totalScheduled: summary.scheduled,
    totalTaken: summary.taken,
    totalMissed: summary.missed,
    totalSkipped: summary.skipped,
    streak: {
      current: summary.streak.current,
      longest: summary.streak.longest,
    },
    trend: {
      direction: summary.trend.direction,
      current7: summary.trend.current7 ?? 100,
      prior7: summary.trend.prior7 ?? 100,
    },
    byBucket,
    perMedication,
    recentSnoozeCount,
    generatedAt: currentNow.toISOString(),
  };
}

/**
 * Deterministic rule-based fallback generator.
 * Produces 2–3 high-value behavioral coaching cards directly from snapshot metrics.
 */
export function generateFallbackInsights(snapshot: InsightSnapshot): SingleInsight[] {
  const insights: SingleInsight[] = [];

  // Rule 1: Time bucket pattern (missed doses clustered in a specific time window)
  const worstBucket = [...snapshot.byBucket]
    .filter((b) => b.scheduled > 0)
    .sort((a, b) => a.adherencePercent - b.adherencePercent)[0];

  if (worstBucket && worstBucket.adherencePercent < 85 && worstBucket.missed > 0) {
    const bucketName = worstBucket.bucket.charAt(0).toUpperCase() + worstBucket.bucket.slice(1);
    insights.push({
      category: "timing_pattern",
      summary: `${bucketName} doses show lower adherence (${worstBucket.adherencePercent}%).`,
      detail: `You have missed ${worstBucket.missed} doses scheduled during the ${worstBucket.bucket}. Pairing these doses with an established daily routine (like a meal or commute) can improve consistency.`,
      suggestedActionType: "review_schedule",
      confidence: 0.9,
    });
  }

  // Rule 2: Snooze pattern
  if (snapshot.recentSnoozeCount >= 3) {
    insights.push({
      category: "snooze_pattern",
      summary: `Frequent snoozing detected (${snapshot.recentSnoozeCount} times).`,
      detail: "Snoozing frequently indicates reminder times might conflict with your daily activities. Consider adjusting your reminder window in Settings.",
      suggestedActionType: "review_reminders",
      confidence: 0.85,
    });
  }

  // Rule 3: Streak & momentum
  if (snapshot.streak.current >= 3) {
    insights.push({
      category: "adherence_improvement",
      summary: `Great momentum! You are on a ${snapshot.streak.current}-day streak.`,
      detail: "Your consistency supports steady medication levels. Keeping your pill organizer or digital log visible can help maintain this streak.",
      suggestedActionType: "encourage",
      confidence: 0.95,
    });
  } else if (snapshot.trend.direction === "declining") {
    insights.push({
      category: "adherence_decline",
      summary: "Adherence has decreased over the last 7 days.",
      detail: `Your 7-day adherence is at ${snapshot.trend.current7}%, down from ${snapshot.trend.prior7}%. Review upcoming schedules or invite a caregiver for support.`,
      suggestedActionType: "review_caregiver",
      confidence: 0.88,
    });
  }

  // Rule 4: Medication specific variance
  const lowMed = snapshot.perMedication.find((m) => m.scheduled >= 3 && m.adherencePercent < 80);
  if (lowMed && insights.length < 3) {
    insights.push({
      category: "medication_difference",
      summary: `Lower adherence observed for ${lowMed.name} (${lowMed.adherencePercent}%).`,
      detail: `You took ${lowMed.taken} of ${lowMed.scheduled} doses. Discuss any side effects or scheduling frictions for this medication with your healthcare provider.`,
      suggestedActionType: "review_schedule",
      confidence: 0.87,
    });
  }

  // Fallback default if all metrics are clean / sparse
  if (insights.length === 0) {
    insights.push({
      category: "general",
      summary: "Medication adherence is well-maintained.",
      detail: `Overall adherence is currently ${snapshot.adherencePercent}%. Consistent habits are the most effective way to maximize therapeutic benefits.`,
      suggestedActionType: "encourage",
      confidence: 0.92,
    });
  }

  return insights.slice(0, 3);
}

/**
 * Executes AI generation with fallback safety, saves results, prunes history, and notifies user.
 */
export async function generateInsights(
  db: Db | DbTx,
  userId: string,
): Promise<InsightDTO[]> {
  const snapshot = await buildSnapshot(db, userId);

  let generatedList: SingleInsight[] = [];
  let source: InsightSource = "fallback";

  // Check if an AI provider API key is present
  const apiKey =
    process.env.OPENAI_API_KEY ||
    process.env.ANTHROPIC_API_KEY ||
    process.env.GEMINI_API_KEY;

  if (apiKey) {
    try {
      // In production with API key, call LLM endpoint with structured schema
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: BEHAVIORAL_SYSTEM_PROMPT },
            {
              role: "user",
              content: `Analyze this medication adherence snapshot and return insights:\n${JSON.stringify(snapshot)}`,
            },
          ],
          response_format: { type: "json_object" },
          temperature: 0.3,
        }),
      });

      if (response.ok) {
        const json = await response.json();
        const content = json.choices?.[0]?.message?.content;
        if (content) {
          const parsed = insightResponseSchema.parse(JSON.parse(content));
          generatedList = parsed.insights;
          source = "ai";
        }
      }
    } catch {
      // Fallback silently on network/parse failure
      generatedList = [];
    }
  }

  // If AI was not used or failed validation, run deterministic fallback
  if (generatedList.length === 0) {
    generatedList = generateFallbackInsights(snapshot);
    source = "fallback";
  }

  const createdInsights: InsightDTO[] = [];
  const currentNow = now();

  // Persist newly generated insights
  for (const item of generatedList) {
    const id = uuidv7();

    const insertBuilder = db
      .insert(aiInsights)
      .values({
        id,
        userId,
        category: item.category as InsightCategory,
        summary: item.summary,
        detail: item.detail ?? null,
        suggestedActionType: (item.suggestedActionType ?? null) as SuggestedAction | null,
        dataSnapshot: snapshot,
        source,
        confidence: item.confidence ? String(item.confidence) : "0.90",
        createdAt: currentNow,
      });

    let row: typeof aiInsights.$inferSelect | undefined;
    if (typeof (insertBuilder as { returning?: unknown }).returning === "function") {
      const rows = await (insertBuilder as { returning: () => Promise<(typeof aiInsights.$inferSelect)[]> }).returning();
      row = rows[0];
    } else {
      await insertBuilder;
      row = {
        id,
        userId,
        category: item.category as InsightCategory,
        summary: item.summary,
        detail: item.detail ?? null,
        suggestedActionType: (item.suggestedActionType ?? null) as SuggestedAction | null,
        dataSnapshot: snapshot,
        source,
        confidence: item.confidence ? String(item.confidence) : "0.90",
        createdAt: currentNow,
      };
    }

    if (row) {
      createdInsights.push({
        id: row.id,
        category: row.category,
        summary: row.summary,
        detail: row.detail,
        suggestedActionType: row.suggestedActionType,
        source: row.source,
        confidence: row.confidence ? Number(row.confidence) : null,
        createdAt: row.createdAt,
      });

      // Dispatch notification for the insight
      await createNotification(db, {
        userId,
        type: "insight",
        title: "New AI Adherence Insight",
        body: row.summary,
        entityType: "insight",
        entityId: row.id,
      });
    }
  }

  // Prune history to latest 20 insights per plan §10.10
  const allRows = await db
    .select({ id: aiInsights.id })
    .from(aiInsights)
    .where(eq(aiInsights.userId, userId))
    .orderBy(desc(aiInsights.createdAt));

  if (allRows.length > 20) {
    const toDelete = allRows.slice(20);
    for (const item of toDelete) {
      await db.delete(aiInsights).where(eq(aiInsights.id, item.id));
    }
  }

  return createdInsights;
}

/**
 * Lists insights for a user ordered by newest first.
 */
export async function listInsights(
  db: Db | DbTx,
  userId: string,
  limit: number = 20,
): Promise<InsightDTO[]> {
  const rows = await db
    .select()
    .from(aiInsights)
    .where(eq(aiInsights.userId, userId))
    .orderBy(desc(aiInsights.createdAt))
    .limit(limit);

  return rows.map((r) => ({
    id: r.id,
    category: r.category,
    summary: r.summary,
    detail: r.detail,
    suggestedActionType: r.suggestedActionType,
    source: r.source,
    confidence: r.confidence ? Number(r.confidence) : null,
    createdAt: r.createdAt,
  }));
}

/**
 * Returns the single latest insight for dashboard widget integration.
 */
export async function getLatestInsight(
  db: Db | DbTx,
  userId: string,
): Promise<InsightDTO | null> {
  const [row] = await db
    .select()
    .from(aiInsights)
    .where(eq(aiInsights.userId, userId))
    .orderBy(desc(aiInsights.createdAt))
    .limit(1);

  if (!row) return null;

  return {
    id: row.id,
    category: row.category,
    summary: row.summary,
    detail: row.detail,
    suggestedActionType: row.suggestedActionType,
    source: row.source,
    confidence: row.confidence ? Number(row.confidence) : null,
    createdAt: row.createdAt,
  };
}
