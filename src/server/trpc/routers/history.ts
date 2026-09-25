/**
 * Phase 19 — History tRPC router (plan §11.10).
 *
 * Exposes:
 * - `query`: cursor-paginated dose action history query with filters.
 */

import { queryDoseHistory } from "@/server/domain/doseActions/history";
import { historyQuerySchema } from "@/shared/validations/history";
import { protectedProcedure, router } from "../trpc";

export const historyRouter = router({
  query: protectedProcedure
    .input(historyQuerySchema)
    .query(async ({ ctx, input }) => {
      return queryDoseHistory(ctx.db, ctx.user.id, input);
    }),
});
