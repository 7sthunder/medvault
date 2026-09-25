import { eq, and, isNull } from "drizzle-orm";
import { uuidv7, utcDateKey } from "@/server/db/helpers";
import { medications, medicationSchedules, users } from "@/server/db/schema";
import { onboardingSchema } from "@/shared/validations/onboarding";
import { getOrCreatePreferences, upsertPreferences } from "@/server/domain/settings/get-or-createPreferences";
import { protectedProcedure, router } from "../trpc";

export const onboardingRouter = router({
  getPreferences: protectedProcedure.query(async ({ ctx }) => {
    return getOrCreatePreferences(ctx.db, ctx.user.id);
  }),

  complete: protectedProcedure
    .input(onboardingSchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.db.transaction(async (tx) => {
        // 1. Upsert reminder preferences
        await upsertPreferences(tx, ctx.user.id, {
          missedAfterMinutes: input.missedAfterMinutes,
          snoozeMinutes: input.snoozeMinutes,
          maxSnoozes: input.maxSnoozes,
          reminderBeforeMinutes: input.reminderBeforeMinutes,
        });

        // 2. Mark onboarding completed and update timezone
        await tx
          .update(users)
          .set({
            timezone: input.timezone,
            onboardingCompleted: true,
            updatedAt: new Date(),
          })
          .where(eq(users.id, ctx.user.id));

        // 3. Optional sample medication creation (plan §11.3: Metformin 500mg twice daily)
        if (input.addSampleMed) {
          const existing = await tx
            .select()
            .from(medications)
            .where(
              and(
                eq(medications.userId, ctx.user.id),
                eq(medications.name, "Metformin"),
                isNull(medications.archivedAt),
              ),
            )
            .limit(1);

          if (!existing[0]) {
            const medId = uuidv7();
            await tx.insert(medications).values({
              id: medId,
              userId: ctx.user.id,
              name: "Metformin",
              dosageAmount: "500",
              dosageUnit: "mg",
              instructions: "Take with food",
              notes: "Sample prescription (twice daily: 08:00 AM & 08:00 PM)",
              status: "active",
              startDate: utcDateKey(new Date()),
              color: "#10b981",
              remindersEnabled: true,
              createdAt: new Date(),
              updatedAt: new Date(),
            });

            await tx.insert(medicationSchedules).values([
              {
                id: uuidv7(),
                medicationId: medId,
                timeOfDay: "08:00",
                daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
                dosageAmount: "500",
                instructionOverride: "Morning dose",
                enabled: true,
                createdAt: new Date(),
                updatedAt: new Date(),
              },
              {
                id: uuidv7(),
                medicationId: medId,
                timeOfDay: "20:00",
                daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
                dosageAmount: "500",
                instructionOverride: "Evening dose",
                enabled: true,
                createdAt: new Date(),
                updatedAt: new Date(),
              },
            ]);
          }
        }

        return { success: true, redirect: "/dashboard" };
      });
    }),
});
