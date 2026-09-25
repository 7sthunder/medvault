import { dashboardService } from "@/server/domain/dashboard/service";

import { protectedProcedure, router } from "../trpc";

/**
 * Phase 15 — dashboard router (§11.4). `dashboard.get` returns the whole
 * `DashboardDTO` composed by `dashboardService` (schedule day + adherence summary +
 * medication list + latest insight + caregiver counts) from one reconciling read.
 */
export const dashboardRouter = router({
  get: protectedProcedure.query(async ({ ctx }) =>
    dashboardService.get(ctx.db, ctx.user.id, ctx.user.timezone ?? "UTC"),
  ),
});
