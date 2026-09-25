/**
 * Phase 16 — Adherence tRPC router (plan §10.5, §11.8).
 *
 * Exposes procedures:
 * - `summary`: canonical AdherenceSummaryDTO for dashboard, adherence, and reports.
 * - `byMedication`: per-medication adherence performance table data.
 * - `patterns`: time-of-day bucket aggregation.
 * - `recompute`: recomputes daily materialized rows.
 */

import { z } from "zod";
import * as adherenceService from "@/server/domain/adherence/service";
import { RANGE_PRESETS } from "@/shared/enums";
import { protectedProcedure, router } from "../trpc";

export const adherenceRouter = router({
  summary: protectedProcedure
    .input(
      z
        .object({
          from: z.date().optional(),
          to: z.date().optional(),
          rangePreset: z.enum(RANGE_PRESETS).optional(),
          medicationId: z.string().optional(),
          timeZone: z.string().optional(),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      return adherenceService.getAdherenceSummary(ctx.db, ctx.user.id, input);
    }),

  byMedication: protectedProcedure
    .input(
      z
        .object({
          from: z.date().optional(),
          to: z.date().optional(),
          timeZone: z.string().optional(),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      return adherenceService.getMedicationPerformance(ctx.db, ctx.user.id, input);
    }),

  patterns: protectedProcedure
    .input(
      z
        .object({
          from: z.date().optional(),
          to: z.date().optional(),
          timeZone: z.string().optional(),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      return adherenceService.getTimeBucketPatterns(ctx.db, ctx.user.id, input);
    }),

  recompute: protectedProcedure
    .input(
      z.object({
        from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date (YYYY-MM-DD)."),
        to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date (YYYY-MM-DD)."),
        timeZone: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await adherenceService.recomputeRange(
        ctx.db,
        ctx.user.id,
        input.from,
        input.to,
        input.timeZone,
      );
      return { success: true };
    }),
});
