import { historyService } from "@/server/domain/history/service";
import { historyQuerySchema } from "@/shared/validations/history";

import { protectedProcedure, router } from "../trpc";

/**
 * Phase 16 — history router (§11.10). One cursor-paginated read over the append-only
 * `dose_actions` log with optional range/med/status filters. All reads owner-scoped.
 */
export const historyRouter = router({
  query: protectedProcedure.input(historyQuerySchema).query(async ({ ctx, input }) => {
    const timeZone = ctx.user.timezone ?? "UTC";
    return historyService.query(ctx.db, ctx.user.id, timeZone, input);
  }),
});
