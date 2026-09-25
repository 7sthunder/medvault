import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { adherenceService } from "@/server/domain/adherence/service";
import { RANGE_PRESETS } from "@/shared/enums";
import type { RangePreset } from "@/shared/enums";
import { REPORT_MAX_SPAN_DAYS } from "@/shared/constants";
import { combineDateAndTime, localDateKey, now, rangeByPreset } from "@/shared/times";
import { dateKeySchema } from "@/shared/validations/common";

import { protectedProcedure, router } from "../trpc";

/**
 * Phase 13 — adherence router (§10.5 server contract). All three procedures share one
 * range input (a preset or a clamped `custom` day-window) and read canonical, reconciled
 * data — the exact shapes the dashboard/adherence/reports/insights surfaces consume.
 */

export const adherenceRangeSchema = z
  .object({
    range: z.enum(RANGE_PRESETS).optional(),
    from: dateKeySchema.optional(),
    to: dateKeySchema.optional(),
  })
  .refine((input) => input.range !== "custom" || Boolean(input.from && input.to), {
    message: "A custom range requires both from and to dates.",
    path: ["range"],
  });

export type AdherenceRangeInput = z.infer<typeof adherenceRangeSchema>;

function resolveWindow(timeZone: string, input: AdherenceRangeInput): { from: Date; to: Date } {
  if (input.range === "custom") {
    return {
      from: combineDateAndTime(input.from!, "00:00", timeZone),
      to: combineDateAndTime(input.to!, "23:59", timeZone),
    };
  }
  const preset: Exclude<RangePreset, "custom"> = input.range ?? "30d";
  return rangeByPreset(preset, { now: now(), timeZone });
}

function assertSpan(timeZone: string, from: Date, to: Date): void {
  const days =
    Math.round(
      (new Date(`${localDateKey(to, timeZone)}T00:00:00Z`).getTime() -
        new Date(`${localDateKey(from, timeZone)}T00:00:00Z`).getTime()) /
        86_400_000,
    ) + 1;
  if (days > REPORT_MAX_SPAN_DAYS) {
    throw new TRPCError({ code: "BAD_REQUEST", message: `Range exceeds ${REPORT_MAX_SPAN_DAYS} days.` });
  }
}

const rangeProcedure = protectedProcedure.input(adherenceRangeSchema);

export const adherenceRouter = router({
  /** One `AdherenceSummaryDTO` for the period (days, streak, trend, buckets). */
  summary: rangeProcedure.query(async ({ ctx, input }) => {
    const timeZone = ctx.user.timezone ?? "UTC";
    const window = resolveWindow(timeZone, input);
    assertSpan(timeZone, window.from, window.to);
    return adherenceService.summary(ctx.db, ctx.user.id, timeZone, window);
  }),

  /** Per-medication performance rows for the period. */
  byMedication: rangeProcedure.query(async ({ ctx, input }) => {
    const timeZone = ctx.user.timezone ?? "UTC";
    const window = resolveWindow(timeZone, input);
    assertSpan(timeZone, window.from, window.to);
    return adherenceService.byMedication(ctx.db, ctx.user.id, timeZone, window);
  }),

  /** Time-of-day pattern table for the period. */
  patterns: rangeProcedure.query(async ({ ctx, input }) => {
    const timeZone = ctx.user.timezone ?? "UTC";
    const window = resolveWindow(timeZone, input);
    assertSpan(timeZone, window.from, window.to);
    return adherenceService.patterns(ctx.db, ctx.user.id, timeZone, window);
  }),
});