import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { SettingsError, settingsService } from "@/server/domain/settings/service";
import {
  appearanceSchema,
  caregiverAlertPrefsSchema,
  deleteAccountSchema,
  deleteAllDataSchema,
  exportScopeSchema,
  medicationReminderToggleSchema,
  notificationPrefsSchema,
  profileSchema,
} from "@/shared/validations/settings";
import { protectedProcedure, router } from "../trpc";

/**
 * Phase 18 — settings router (§10.11/§11.14).
 *
 * One `protectedProcedure` per settings area, so the session user is the only possible subject:
 * there is no userId input anywhere, which makes cross-account mutation unrepresentable at
 * this layer. Destructive mutations additionally carry the typed-confirmation phrase, and the
 * service re-checks ownership/role before touching anything.
 */
export const settingsRouter = router({
  /* ── Profile ─────────────────────────────────────────────────────────── */

  profile: protectedProcedure.query(async ({ ctx }) => settingsService.getProfile(ctx.db, ctx.user.id)),

  updateProfile: protectedProcedure
    .input(profileSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        return await settingsService.updateProfile(ctx.db, ctx.user.id, input);
      } catch (error) {
        throw mapSettingsError(error);
      }
    }),

  /* ── Reminders ───────────────────────────────────────────────────────── */

  reminders: protectedProcedure.query(async ({ ctx }) => settingsService.getReminderSettings(ctx.db, ctx.user.id)),

  updateReminders: protectedProcedure
    .input(
      z.object({
        missedAfterMinutes: z.coerce.number().int().min(5).max(120),
        snoozeMinutes: z.coerce.number().int().min(1).max(60),
        maxSnoozes: z.coerce.number().int().min(0).max(10),
        reminderBeforeMinutes: z.coerce.number().int().min(0).max(60),
        notificationPrefs: notificationPrefsSchema,
        caregiverAlertPrefs: caregiverAlertPrefsSchema,
      }),
    )
    .mutation(async ({ ctx, input }) => settingsService.updateReminderSettings(ctx.db, ctx.user.id, input)),

  /** Bulk `remindersEnabled` toggle from the per-medication table. */
  setMedicationReminders: protectedProcedure
    .input(medicationReminderToggleSchema)
    .mutation(async ({ ctx, input }) =>
      settingsService.setMedicationReminders(ctx.db, ctx.user.id, input.medicationIds, input.remindersEnabled),
    ),

  /* ── Caregiver alert prefs (relationship UI itself reuses §11.12) ────── */

  caregiverPrefs: protectedProcedure.query(async ({ ctx }) => settingsService.getCaregiverPrefs(ctx.db, ctx.user.id)),

  updateCaregiverPrefs: protectedProcedure
    .input(caregiverAlertPrefsSchema)
    .mutation(async ({ ctx, input }) => settingsService.updateCaregiverPrefs(ctx.db, ctx.user.id, input)),

  /* ── Appearance ──────────────────────────────────────────────────────── */

  appearance: protectedProcedure.query(async ({ ctx }) => settingsService.getAppearance(ctx.db, ctx.user.id)),

  updateAppearance: protectedProcedure
    .input(appearanceSchema)
    .mutation(async ({ ctx, input }) => settingsService.updateAppearance(ctx.db, ctx.user.id, input)),

  /* ── Data governance ─────────────────────────────────────────────────── */

  dataOverview: protectedProcedure.query(async ({ ctx }) => settingsService.getDataOverview(ctx.db, ctx.user.id)),

  /** Builds the CSV server-side; the client triggers the download via a route handler. */
  exportCsv: protectedProcedure
    .input(z.object({ scope: exportScopeSchema }))
    .mutation(async ({ ctx, input }) => {
      const { filename, csv } = await settingsService.exportCsv(ctx.db, ctx.user.id, input.scope);
      return { filename, csv };
    }),

  deleteAllData: protectedProcedure
    .input(deleteAllDataSchema)
    .mutation(async ({ ctx }) => {
      try {
        return await settingsService.deleteAllData(ctx.db, ctx.user.id);
      } catch (error) {
        throw mapSettingsError(error);
      }
    }),

  deleteAccount: protectedProcedure
    .input(deleteAccountSchema)
    .mutation(async ({ ctx }) => {
      try {
        return await settingsService.deleteAccount(ctx.db, ctx.user.id);
      } catch (error) {
        throw mapSettingsError(error);
      }
    }),
});

function mapSettingsError(error: unknown): TRPCError {
  if (error instanceof SettingsError) {
    const code =
      error.kind === "not_found"
        ? "NOT_FOUND"
        : error.kind === "conflict"
          ? "CONFLICT"
          : error.kind === "forbidden"
            ? "FORBIDDEN"
            : "BAD_REQUEST";
    return new TRPCError({ code, message: error.message });
  }
  if (error instanceof TRPCError) return error;
  throw error;
}
