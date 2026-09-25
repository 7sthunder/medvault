import { reportsService } from "@/server/domain/reports/service";
import { localDateKey, now } from "@/shared/times";
import { reportsSchemaFor } from "@/shared/validations/reports";

import { protectedProcedure, router } from "../trpc";

/**
 * Phase 16 — reports router (§10.9/§11.11). Validates with `reportsSchemaFor` using the
 * *server's* clock (so "to ≤ today+1" is enforced server-side) and delegates to the same
 * `adherence.summary` pipeline the dashboard reads.
 */
export const reportsRouter = router({
  generate: protectedProcedure.input(reportsSchemaFor(localDateKey(now(), "UTC"))).query(async ({ ctx, input }) => {
    const timeZone = ctx.user.timezone ?? "UTC";
    return reportsService.generate(ctx.db, ctx.user.id, timeZone, input);
  }),
});