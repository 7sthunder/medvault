/**
 * Phase 17 — deterministic fallback insight generator (§10.10 step 3).
 *
 * When the AI provider is unavailable or its output fails validation, this rule engine
 * derives insights straight from the snapshot. Every rule is pure + deterministic (same
 * snapshot → same insights), so the tests can assert exact output. Rules are evaluated in
 * priority order and the engine caps at `FALLBACK_MAX_INSIGHTS`.
 */

import type { InsightItem } from "@/shared/validations/insight";
import type { InsightSnapshot } from "@/shared/validations/insight";

export const FALLBACK_MAX_INSIGHTS = 3;

/** Percentage-point gap (worst vs best med) that triggers `medication_difference`. */
const MED_GAP_PP = 20;

/** Snooze fraction of scheduled doses above which `snooze_pattern` fires. */
const SNOOZE_RATE_MIN = 0.2;

/** Adherence % change between trailing windows that registers as decline/improvement. */
const WINDOW_DELTA_PP = 10;

/** Weekly averages of the last N days (last window first). */
function trailingAdherence(snapshot: InsightSnapshot, size: number): { recent: number | null; prior: number | null } {
  const withData = snapshot.daily.filter((d) => d.scheduled > 0 && d.adherencePercent !== null).slice(-size * 2);
  const recent = withData.slice(-size);
  const prior = withData.slice(-size * 2, -size);
  const avg = (rows: typeof withData) =>
    rows.length === 0 ? null : rows.reduce((acc, d) => acc + (d.adherencePercent ?? 0), 0) / rows.length;
  return { recent: avg(recent), prior: avg(prior) };
}

function medDifference(snapshot: InsightSnapshot): InsightItem | null {
  const meds = snapshot.medications.filter((m) => m.taken + m.missed + m.skipped > 0 && m.adherencePercent !== null);
  if (meds.length < 2) return null;
  const sorted = [...meds].sort((a, b) => (a.adherencePercent ?? 0) - (b.adherencePercent ?? 0));
  const worst = sorted[0]!;
  const best = sorted[sorted.length - 1]!;
  if ((best.adherencePercent! - worst.adherencePercent!) < MED_GAP_PP) return null;
  return {
    category: "medication_difference",
    summary: `${worst.name} is behind your other medications.`,
    detail: `${worst.name} averages ${Math.round(worst.adherencePercent!)}% adherence while ${best.name} averages ${Math.round(best.adherencePercent!)}% over the last 30 days. A small reminder tweak could close the gap.`,
    suggestedActionType: "review_reminders",
  };
}

function missedBucket(snapshot: InsightSnapshot): InsightItem | null {
  const buckets = snapshot.buckets.filter((b) => b.missed > 0);
  if (buckets.length === 0) return null;
  const worst = [...buckets].sort((a, b) => b.missed - a.missed)[0]!;
  const label = worst.bucket === "morning" ? "morning" : worst.bucket === "afternoon" ? "afternoon" : worst.bucket === "evening" ? "evening" : "night";
  return {
    category: "missed_analysis",
    summary: `${label[0]!.toUpperCase()}${label.slice(1)} doses are missed most often.`,
    detail: `You missed ${worst.missed} ${label} dose${worst.missed === 1 ? "" : "s"} in the last 30 days (${worst.taken} taken). Reviewing that time-of-day schedule could help.`,
    suggestedActionType: "review_schedule",
  };
}

function snoozePattern(snapshot: InsightSnapshot): InsightItem | null {
  if (snapshot.totals.scheduled === 0) return null;
  const rate = snapshot.totals.snoozed / snapshot.totals.scheduled;
  if (rate < SNOOZE_RATE_MIN || snapshot.snoozeActionsLast7d === 0) return null;
  return {
    category: "snooze_pattern",
    summary: "You snooze doses more than a fifth of the time.",
    detail: `In the last 30 days ${snapshot.totals.snoozed} of ${snapshot.totals.scheduled} scheduled doses were snoozed first. The snoozed dose still counts toward your streak when taken, but delaying it can push it past its window.`,
    suggestedActionType: "review_reminders",
  };
}

function trendInsight(snapshot: InsightSnapshot): InsightItem | null {
  const { recent, prior } = trailingAdherence(snapshot, 7);
  if (recent === null || prior === null) return null;
  const delta = recent - prior;
  if (delta <= -WINDOW_DELTA_PP) {
    return {
      category: "adherence_decline",
      summary: "Your adherence has dipped over the last week.",
      detail: `Your 7-day average dropped from ${Math.round(prior)}% to ${Math.round(recent)}% over the past week.`, 
      suggestedActionType: "review_schedule",
    };
  }
  if (delta >= WINDOW_DELTA_PP) {
    return {
      category: "adherence_improvement",
      summary: "Your adherence is moving in the right direction.",
      detail: `Your 7-day average climbed from ${Math.round(prior)}% to ${Math.round(recent)}% over the past week. Keep it up.`,
      suggestedActionType: "encourage",
    };
  }
  return null;
}

function encouragement(snapshot: InsightSnapshot): InsightItem | null {
  if (snapshot.totals.taken === 0) {
    return {
      category: "general",
      summary: "Everything starts with the next dose.",
      detail: "Take your first dose, then patterns and encouragement will appear in a few days.",
      suggestedActionType: "encourage",
    };
  }
  const pct = snapshot.totals.adherencePercent;
  const streak = snapshot.streak.current;
  const pctText = pct === null ? "" : `${Math.round(pct)}% `;
  return {
    category: "general",
    summary: `You're at ${pctText}adherence over the last 30 days.`,
    detail: streak > 0
      ? `Your current streak is ${streak} day${streak === 1 ? "" : "s"}. Consistency is your superpower.`
      : "Log a few more days and MedVault will spot deeper patterns for you.",
    suggestedActionType: "encourage",
  };
}

/**
 * Deterministic fallback. Empty data → `[]` (the UI shows the "prerequisites"
 * empty state instead of a fabricated insight).
 */
export function generateFallbackInsights(snapshot: InsightSnapshot): InsightItem[] {
  if (snapshot.totals.scheduled === 0 && snapshot.totals.taken === 0 && snapshot.totals.missed === 0) {
    return [];
  }

  const out: InsightItem[] = [];
  const push = (item: InsightItem | null) => {
    if (item && out.length < FALLBACK_MAX_INSIGHTS) out.push(item);
  };

  push(trendInsight(snapshot));
  push(medDifference(snapshot));
  push(missedBucket(snapshot));
  push(snoozePattern(snapshot));
  push(encouragement(snapshot));

  return out;
}