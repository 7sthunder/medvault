/**
 * Phase 20 — Reports tRPC router (plan §10.9, §11.11, §20).
 *
 * Exposes:
 * - `reports.get`: Returns comprehensive ReportDTO with table, trend, KPI summary,
 *   and missed-dose analysis across requested range and granularity.
 */

import { getReportData } from "@/server/domain/reports/service";
import { reportsSchema } from "@/shared/validations/reports";
import { protectedProcedure, router } from "../trpc";

export const reportsRouter = router({
  get: protectedProcedure
    .input(reportsSchema)
    .query(async ({ ctx, input }) => {
      return getReportData(ctx.db, ctx.user.id, input);
    }),
});
