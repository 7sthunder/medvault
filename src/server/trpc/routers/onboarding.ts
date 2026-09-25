import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";

import { users } from "@/server/db/schema";
import { medicationService } from "@/server/domain/medications/service";
import { getOrCreatePreferences } from "@/server/domain/settings/get-or-createPreferences";
import { DEFAULT_SLOT_TIMES } from "@/shared/constants";
import { localDateKey, now } from "@/shared/times";
import { onboardingSchema } from "@/shared/validations/onboarding";
import { DEFAULT_MED_COLOR, type MedicationInput } from "@/shared/validations/medication";

import { protectedProcedure, router } from "../trpc";

const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6];

/**
 * Phase 10 — onboarding (plan §11.4). Saves profile + reminder defaults into
 * `user_preferences` (upsert), marks the user onboarded with their timezone,
 * and optionally seeds a "Metformin 500mg 2×/day" sample medication via the
 * Phase 11/12 medication service + dose-engine seam (§10.1/§10.2).
 */
export const onboardingRouter = router({
  complete: protectedProcedure
    .input(onboardingSchema)
    .mutation(async ({ ctx, input }) => {
      const timezone = input.timezone;

      await ctx.db.transaction(async (tx) => {
        await getOrCreatePreferences(tx, ctx.user.id, {
          missedAfterMinutes: input.missedAfterMinutes,
          snoozeMinutes: input.snoozeMinutes,
          maxSnoozes: input.maxSnoozes,
          reminderBeforeMinutes: input.reminderBeforeMinutes,
        });

        await tx
          .update(users)
          .set({
            timezone,
            onboardingCompleted: true,
            updatedAt: new Date(),
          })
          .where(eq(users.id, ctx.user.id));

        if (input.addSampleMed) {
          const sample: MedicationInput = {
            name: "Metformin",
            dosageAmount: 500,
            dosageUnit: "mg",
            status: "active",
            instructions: "Take with food",
            notes: null,
            startDate: localDateKey(now(), timezone),
            endDate: null,
            color: DEFAULT_MED_COLOR,
            remindersEnabled: true,
            reminderBeforeMinutes: input.reminderBeforeMinutes,
          };

          try {
            await medicationService.create(tx, ctx.user.id, timezone, {
              medication: sample,
              schedule: {
                slots: DEFAULT_SLOT_TIMES.map((timeOfDay) => ({
                  timeOfDay,
                  daysOfWeek: ALL_DAYS,
                  dosageAmount: null,
                  instructionOverride: null,
                  enabled: true,
                })),
              },
            });
          } catch (err) {
            // Idempotent re-runs must not fail because the sample already exists.
            if (!(err instanceof TRPCError) || err.code !== "CONFLICT") throw err;
          }
        }
      });

      return { onboardingCompleted: true, addSampleMed: input.addSampleMed, timezone };
    }),
});