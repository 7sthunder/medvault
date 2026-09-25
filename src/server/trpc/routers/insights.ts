import { z } from "zod";

import { insightsService } from "@/server/domain/insights/service";

import { protectedProcedure, router } from "../trpc";

/**
 * Phase 17 — insights router (§10.10). `list` is the page read; `regenerate` runs one
 * generation pass (provider → validate → fallback → persist) and returns the new batch so
 * the UI can optimistically refresh. Never mutates user data — only `ai_insights`.
 */
export const insightsRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => insightsService.list(ctx.db, ctx.user.id)),

  regenerate: protectedProcedure
    .input(z.object({ timeZone: z.string().optional() }).optional())
    .mutation(async ({ ctx, input }) =>
      insightsService.generate(ctx.db, ctx.user.id, input?.timeZone ?? ctx.user.timezone ?? "UTC"),
    ),
});