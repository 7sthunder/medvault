import { z } from "zod";

import { scheduleService } from "@/server/domain/schedule/service";
import { dateKeySchema, uuidSchema } from "@/shared/validations/common";

import { protectedProcedure, router } from "../trpc";

/**
 * Phase 14 — schedule router (§11.7). The Today's Schedule day feed + per-dose
 * detail. Both procedures reconcile to the live status before reading (canonical
 * read path) and return the shared `ScheduleDayDTO` / `DoseDetailDTO` shapes.
 */
export const scheduleRouter = router({
  /** §11.7 `schedule.day(date)` — full dose feed for a local `YYYY-MM-DD`. */
  day: protectedProcedure
    .input(z.object({ date: dateKeySchema }))
    .query(async ({ ctx, input }) =>
      scheduleService.day(ctx.db, ctx.user.id, ctx.user.timezone ?? "UTC", input.date),
    ),

  /** §11.7 `dose.get` — one owned dose + its action timeline (snooze/miss). */
  get: protectedProcedure
    .input(z.object({ id: uuidSchema }))
    .query(async ({ ctx, input }) =>
      scheduleService.get(ctx.db, ctx.user.id, ctx.user.timezone ?? "UTC", input.id),
    ),
});
