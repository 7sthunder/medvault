/**
 * Phase 13 — Dose tRPC router (plan §10.3, §10.4, §11.4).
 *
 * Exposes procedures for dose interaction and schedule queries:
 * - `take`: marks dose as taken.
 * - `snooze`: delays dose and extends missed deadline grace.
 * - `skip`: marks dose as skipped with optional reason.
 * - `get`: retrieves a single dose event with medication snapshot.
 * - `today`: reconciles statuses and returns today's doses for the user.
 * - `reconcile`: runs status reconciliation on-demand.
 */

import { and, asc, desc, eq, gte, inArray, lte } from "drizzle-orm";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { doseEvents, medications, users } from "@/server/db/schema";
import { skipDose, snoozeDose, takeDose } from "@/server/domain/doseEvents/actions";
import { toDoseEventDTO } from "@/server/domain/doseEvents/mapper";
import { reconcileDoseStatuses } from "@/server/domain/doseEvents/reconcile";
import { combineDateAndTime, localDateKey, now, startOfLocalDay } from "@/shared/times";
import { takeDoseInputSchema } from "@/shared/validations/doseAction";
import { protectedProcedure, router } from "../trpc";

export const doseRouter = router({
  take: protectedProcedure
    .input(takeDoseInputSchema)
    .mutation(async ({ ctx, input }) => {
      return takeDose(ctx.db, ctx.user.id, input.doseId);
    }),

  snooze: protectedProcedure
    .input(
      z.object({
        doseId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return snoozeDose(ctx.db, ctx.user.id, input.doseId);
    }),

  skip: protectedProcedure
    .input(
      z.object({
        doseId: z.string(),
        reason: z.string().trim().max(200).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return skipDose(ctx.db, ctx.user.id, input.doseId, input.reason);
    }),

  get: protectedProcedure
    .input(
      z.object({
        id: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const rows = await ctx.db
        .select()
        .from(doseEvents)
        .where(and(eq(doseEvents.id, input.id), eq(doseEvents.userId, ctx.user.id)))
        .limit(1);

      const dose = rows[0];
      if (!dose) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Dose event not found.",
        });
      }

      const [med] = await ctx.db
        .select()
        .from(medications)
        .where(eq(medications.id, dose.medicationId))
        .limit(1);

      if (!med) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Medication for dose not found.",
        });
      }

      return toDoseEventDTO(dose, med);
    }),

  listByMedication: protectedProcedure
    .input(
      z.object({
        medicationId: z.string(),
        limit: z.number().int().min(1).max(50).default(10),
      }),
    )
    .query(async ({ ctx, input }) => {
      const [med] = await ctx.db
        .select()
        .from(medications)
        .where(
          and(
            eq(medications.id, input.medicationId),
            eq(medications.userId, ctx.user.id),
          ),
        )
        .limit(1);

      if (!med) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Medication not found.",
        });
      }

      const rows = await ctx.db
        .select()
        .from(doseEvents)
        .where(
          and(
            eq(doseEvents.userId, ctx.user.id),
            eq(doseEvents.medicationId, input.medicationId),
          ),
        )
        .orderBy(desc(doseEvents.scheduledFor))
        .limit(input.limit);

      return rows.map((r) => toDoseEventDTO(r, med));
    }),

  today: protectedProcedure
    .input(
      z
        .object({
          timeZone: z.string().optional(),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      // 1. Run inline status reconciliation
      await reconcileDoseStatuses(ctx.db, { userId: ctx.user.id });

      // 2. Resolve user timezone
      let timeZone = input?.timeZone;
      if (!timeZone) {
        const [u] = await ctx.db
          .select({ timezone: users.timezone })
          .from(users)
          .where(eq(users.id, ctx.user.id))
          .limit(1);
        timeZone = u?.timezone || "UTC";
      }

      // 3. Compute local today bounds
      const currentNow = now();
      const todayKey = localDateKey(currentNow, timeZone);
      const startOfDay = startOfLocalDay(currentNow, timeZone);
      const endOfDay = combineDateAndTime(todayKey, "23:59", timeZone);

      // 4. Query doses for today
      const doseRows = await ctx.db
        .select()
        .from(doseEvents)
        .where(
          and(
            eq(doseEvents.userId, ctx.user.id),
            gte(doseEvents.scheduledFor, startOfDay),
            lte(doseEvents.scheduledFor, endOfDay),
          ),
        )
        .orderBy(asc(doseEvents.scheduledFor));

      if (doseRows.length === 0) {
        return [];
      }

      // 5. Join medication snapshots
      const medIds = [...new Set(doseRows.map((d) => d.medicationId))];
      const medRows = await ctx.db
        .select()
        .from(medications)
        .where(
          and(
            eq(medications.userId, ctx.user.id),
            inArray(medications.id, medIds),
          ),
        );

      const medsById = new Map(medRows.map((m) => [m.id, m]));

      return doseRows.map((d) => {
        const med = medsById.get(d.medicationId);
        if (!med) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: `Medication not found for dose ${d.id}`,
          });
        }
        return toDoseEventDTO(d, med);
      });
    }),

  reconcile: protectedProcedure.mutation(async ({ ctx }) => {
    return reconcileDoseStatuses(ctx.db, { userId: ctx.user.id });
  }),
});
