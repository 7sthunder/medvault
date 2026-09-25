import { z } from "zod";
import * as appointmentService from "@/server/domain/appointments/service";
import {
  appointmentCreateSchema,
  appointmentQuerySchema,
  appointmentUpdateSchema,
} from "@/shared/validations/appointment";
import { protectedProcedure, router } from "../trpc";

export const appointmentsRouter = router({
  list: protectedProcedure
    .input(appointmentQuerySchema.optional())
    .query(async ({ ctx, input }) => {
      return appointmentService.listAppointments(ctx.db, ctx.user.id, input);
    }),

  create: protectedProcedure
    .input(appointmentCreateSchema)
    .mutation(async ({ ctx, input }) => {
      return appointmentService.createAppointment(ctx.db, ctx.user.id, input);
    }),

  update: protectedProcedure
    .input(appointmentUpdateSchema)
    .mutation(async ({ ctx, input }) => {
      return appointmentService.updateAppointment(ctx.db, ctx.user.id, input);
    }),

  cancel: protectedProcedure
    .input(z.object({ id: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      return appointmentService.cancelAppointment(ctx.db, ctx.user.id, input.id);
    }),
});
