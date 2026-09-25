/**
 * Phase 17 — AI insight contracts (plan §10.10).
 *
 * `insightItemSchema`/`insightResponseSchema` are the zod-validated *output* boundary for
 * the AI provider: unknown keys are stripped, categories are constrained to
 * `INSIGHT_CATEGORIES` (so a diagnostic/prescriptive category is rejected outright),
 * lengths are capped, and `tone` is binary. The fallback generator produces the same shape.
 */

import { z } from "zod";

import { INSIGHT_CATEGORIES, SUGGESTED_ACTIONS } from "../enums";

/** Snapshot caps (§10.10 "snapshot size caps") — buildSnapshot truncates to these. */
export const INSIGHT_SNAPSHOT_CAPS = {
  dailyDays: 30,
  medications: 50,
  buckets: 4,
} as const;

export const insightToneSchema = z.enum(["neutral", "encouraging"]);

/** One behavioral-insight item. strip-unknowns by default (Zod object). */
export const insightItemSchema = z.object({
  category: z.enum(INSIGHT_CATEGORIES),
  summary: z.string().min(1, "Summary is required.").max(280, "Summary must be at most 280 characters."),
  detail: z.string().max(1200, "Detail must be at most 1200 characters.").nullable().optional(),
  suggestedActionType: z.enum(SUGGESTED_ACTIONS).nullable().optional(),
});

/** Full structured-insight response from the AI provider (or the fallback engine). */
export const insightResponseSchema = z.object({
  insights: z.array(insightItemSchema).min(1, "At least one insight is required.").max(5, "At most 5 insights."),
  tone: insightToneSchema,
});

/** Snapshot passed to the provider — every field bounded so it never leaks PII beyond adherence. */
export const insightSnapshotSchema = z.object({
  windowDays: z.number().int().min(1).max(INSIGHT_SNAPSHOT_CAPS.dailyDays),
  generatedAt: z.string(),
  totals: z.object({
    scheduled: z.number().nonnegative(),
    taken: z.number().nonnegative(),
    missed: z.number().nonnegative(),
    skipped: z.number().nonnegative(),
    snoozed: z.number().nonnegative(),
    adherencePercent: z.number().nullable(),
  }),
  daily: z
    .array(
      z.object({
        date: z.string(),
        scheduled: z.number().nonnegative(),
        taken: z.number().nonnegative(),
        missed: z.number().nonnegative(),
        skipped: z.number().nonnegative(),
        snoozed: z.number().nonnegative(),
        adherencePercent: z.number().nullable(),
      }),
    )
    .max(INSIGHT_SNAPSHOT_CAPS.dailyDays),
  medications: z
    .array(
      z.object({
        name: z.string().min(1).max(100),
        adherencePercent: z.number().nullable(),
        taken: z.number().nonnegative(),
        missed: z.number().nonnegative(),
        skipped: z.number().nonnegative(),
      }),
    )
    .max(INSIGHT_SNAPSHOT_CAPS.medications),
  buckets: z
    .array(
      z.object({
        bucket: z.enum(["morning", "afternoon", "evening", "night"]),
        scheduled: z.number().nonnegative(),
        taken: z.number().nonnegative(),
        missed: z.number().nonnegative(),
        rate: z.number().nullable(),
      }),
    )
    .max(INSIGHT_SNAPSHOT_CAPS.buckets),
  streak: z.object({ current: z.number().nonnegative(), longest: z.number().nonnegative() }),
  snoozeActionsLast7d: z.number().nonnegative(),
});

export type InsightResponse = z.infer<typeof insightResponseSchema>;
export type InsightItem = z.infer<typeof insightItemSchema>;
export type InsightSnapshot = z.infer<typeof insightSnapshotSchema>;