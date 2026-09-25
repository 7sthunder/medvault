/**
 * Phase 11 — Medication tRPC router (plan §10.1, §11.6).
 *
 * Exposes full medication lifecycle procedures over tRPC:
 * - `list`: queries active (or all/status-filtered) medications with slots.
 * - `get`: queries single medication with slots, derived frequency, and stats.
 * - `create`: validates with medicationSchema + schedule slots, persists transactionally.
 * - `update`: updates medication attributes and synchronizes schedule slots.
 * - `setStatus`: toggles between "active" and "paused".
 * - `archive`: soft-deletes medication (preserves history, sets paused).
 * - `unarchive`: restores archived medication to active status.
 */

import { z } from "zod";
import * as medicationService from "@/server/domain/medications/service";
import { MEDICATION_STATUSES } from "@/shared/enums";
import { medicationBaseSchema } from "@/shared/validations/medication";
import { scheduleSlotSchema } from "@/shared/validations/schedule";
import { protectedProcedure, router } from "../trpc";

const createMedicationProcedureSchema = medicationBaseSchema
  .extend({
    slots: z.array(scheduleSlotSchema).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.endDate && data.startDate > data.endDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["endDate"],
        message: "End date must be after the start date.",
      });
    }
  });

const updateMedicationProcedureSchema = medicationBaseSchema
  .partial()
  .extend({
    id: z.string(),
    slots: z.array(scheduleSlotSchema).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.startDate && data.endDate && data.startDate > data.endDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["endDate"],
        message: "End date must be after the start date.",
      });
    }
  });

export const medicationRouter = router({
  list: protectedProcedure
    .input(
      z
        .object({
          includeArchived: z.boolean().optional(),
          status: z.enum(MEDICATION_STATUSES).optional(),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      return medicationService.listMedications(ctx.db, ctx.user.id, input);
    }),

  get: protectedProcedure
    .input(
      z.object({
        id: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      return medicationService.getMedication(ctx.db, ctx.user.id, input.id);
    }),

  create: protectedProcedure
    .input(createMedicationProcedureSchema)
    .mutation(async ({ ctx, input }) => {
      const { slots, ...medData } = input;
      return medicationService.createMedication(ctx.db, ctx.user.id, {
        ...medData,
        slots,
      });
    }),

  update: protectedProcedure
    .input(updateMedicationProcedureSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, slots, ...medData } = input;
      return medicationService.updateMedication(ctx.db, ctx.user.id, {
        id,
        ...medData,
        slots,
      });
    }),

  setStatus: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        status: z.enum(MEDICATION_STATUSES),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return medicationService.setMedicationStatus(
        ctx.db,
        ctx.user.id,
        input.id,
        input.status,
      );
    }),

  archive: protectedProcedure
    .input(
      z.object({
        id: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return medicationService.archiveMedication(ctx.db, ctx.user.id, input.id);
    }),

  unarchive: protectedProcedure
    .input(
      z.object({
        id: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return medicationService.unarchiveMedication(ctx.db, ctx.user.id, input.id);
    }),
});
