import { protectedProcedure, router } from "@/server/trpc/trpc";
import * as insightsService from "@/server/domain/insights/service";
import { listInsightsSchema } from "@/shared/validations/insight";

export const insightsRouter = router({
  list: protectedProcedure
    .input(listInsightsSchema)
    .query(async ({ ctx, input }) => {
      return insightsService.listInsights(ctx.db, ctx.user.id, input?.limit);
    }),

  latest: protectedProcedure.query(async ({ ctx }) => {
    return insightsService.getLatestInsight(ctx.db, ctx.user.id);
  }),

  regenerate: protectedProcedure.mutation(async ({ ctx }) => {
    return insightsService.generateInsights(ctx.db, ctx.user.id);
  }),
});
