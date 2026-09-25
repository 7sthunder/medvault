import { doseActionsService } from "@/server/domain/doseActions/service";
import { doseActionSchema } from "@/shared/validations/doseAction";

import { protectedProcedure, router } from "../trpc";

/**
 * Phase 14 — dose action router (§10.4 / §13 `doseActionSchema`). Each mutation is a
 * single transaction (conditional status update + audit append + adherence recompute)
 * and idempotent: repeated takes/snoozes/skips return `changed: false`, never error.
 * The UI invalidates schedule/adherence/dashboard queries after each action.
 */
export const doseRouter = router({
  take: protectedProcedure.input(doseActionSchema).mutation(async ({ ctx, input }) =>
    doseActionsService.take(ctx.db, ctx.user.id, input.doseId, {
      timeZone: ctx.user.timezone ?? "UTC",
    }),
  ),

  snooze: protectedProcedure.input(doseActionSchema).mutation(async ({ ctx, input }) =>
    doseActionsService.snooze(ctx.db, ctx.user.id, input.doseId, {
      timeZone: ctx.user.timezone ?? "UTC",
    }),
  ),

  skip: protectedProcedure.input(doseActionSchema).mutation(async ({ ctx, input }) =>
    doseActionsService.skip(ctx.db, ctx.user.id, input.doseId, {
      timeZone: ctx.user.timezone ?? "UTC",
      skipReason: input.action === "skip" ? input.skipReason : undefined,
    }),
  ),
});
