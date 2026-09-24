import { z } from "zod";

import { uuidSchema } from "@/shared/validations/common";
import { medicationSchema } from "@/shared/validations/medication";
import { scheduleSchema } from "@/shared/validations/schedule";
import { MEDICATION_STATUSES } from "@/shared/enums";

import { protectedProcedure, router } from "../trpc";
import { medicationService } from "@/server/domain/medications/service";

/** create/update share the same body shape (medication + optional schedule). */
const medicationBody = z.object({
  medication: medicationSchema,
  schedule: scheduleSchema.optional(),
});

export const medicationRouter = router({
  list: protectedProcedure.query(async ({ ctx }) =>
    medicationService.list(ctx.db, ctx.user.id),
  ),

  get: protectedProcedure
    .input(z.object({ id: uuidSchema }))
    .query(async ({ ctx, input }) => medicationService.get(ctx.db, ctx.user.id, input.id)),

  create: protectedProcedure
    .input(medicationBody)
    .mutation(async ({ ctx, input }) =>
      medicationService.create(ctx.db, ctx.user.id, ctx.user.timezone ?? "UTC", input),
    ),

  update: protectedProcedure
    .input(medicationBody.extend({ id: uuidSchema }))
    .mutation(async ({ ctx, input }) =>
      medicationService.update(ctx.db, ctx.user.id, ctx.user.timezone ?? "UTC", input),
    ),

  setStatus: protectedProcedure
    .input(
      z.object({
        id: uuidSchema,
        status: z.enum(MEDICATION_STATUSES),
      }),
    )
    .mutation(async ({ ctx, input }) =>
      medicationService.setStatus(ctx.db, ctx.user.id, ctx.user.timezone ?? "UTC", input.id, input.status),
    ),

  archive: protectedProcedure
    .input(z.object({ id: uuidSchema }))
    .mutation(async ({ ctx, input }) => medicationService.archive(ctx.db, ctx.user.id, input.id)),
});