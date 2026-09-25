/**
 * Phase 18 — Dashboard tRPC router (plan §11.4).
 *
 * Exposes a single unified procedure `get` returning `DashboardDTO`
 * for the dashboard landing page.
 */

import { z } from "zod";
import { getDashboardData } from "@/server/domain/dashboard/service";
import { protectedProcedure, router } from "../trpc";

export const dashboardRouter = router({
  get: protectedProcedure
    .input(
      z
        .object({
          timeZone: z.string().optional(),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      return getDashboardData(ctx.db, ctx.user.id, {
        timeZone: input?.timeZone,
      });
    }),
});
