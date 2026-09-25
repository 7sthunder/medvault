import { protectedProcedure, router } from "@/server/trpc/trpc";
import { getOrCreatePreferences } from "@/server/domain/settings/get-or-createPreferences";
import * as settingsService from "@/server/domain/settings/service";
import {
  deleteAccountSchema,
  deleteDataSchema,
  updateAppearanceSchema,
  updateCaregiverPrefsSchema,
  updateProfileSchema,
  updateRemindersSchema,
} from "@/shared/validations/settings";

export const settingsRouter = router({
  getProfile: protectedProcedure.query(async ({ ctx }) => {
    return settingsService.getProfile(ctx.db, ctx.user.id);
  }),

  updateProfile: protectedProcedure
    .input(updateProfileSchema)
    .mutation(async ({ ctx, input }) => {
      return settingsService.updateProfile(ctx.db, ctx.user.id, input);
    }),

  getReminders: protectedProcedure.query(async ({ ctx }) => {
    return settingsService.getReminderSettings(ctx.db, ctx.user.id);
  }),

  updateReminders: protectedProcedure
    .input(updateRemindersSchema)
    .mutation(async ({ ctx, input }) => {
      return settingsService.updateReminderSettings(ctx.db, ctx.user.id, input);
    }),

  getPreferences: protectedProcedure.query(async ({ ctx }) => {
    return getOrCreatePreferences(ctx.db, ctx.user.id);
  }),

  updateCaregiverPrefs: protectedProcedure
    .input(updateCaregiverPrefsSchema)
    .mutation(async ({ ctx, input }) => {
      return settingsService.updateCaregiverAlertPrefs(ctx.db, ctx.user.id, input);
    }),

  updateAppearance: protectedProcedure
    .input(updateAppearanceSchema)
    .mutation(async ({ ctx, input }) => {
      return settingsService.updateAppearance(ctx.db, ctx.user.id, input);
    }),

  getDataOverview: protectedProcedure.query(async ({ ctx }) => {
    return settingsService.getDataOverview(ctx.db, ctx.user.id);
  }),

  exportData: protectedProcedure.query(async ({ ctx }) => {
    return settingsService.exportData(ctx.db, ctx.user.id);
  }),

  deleteAllData: protectedProcedure
    .input(deleteDataSchema)
    .mutation(async ({ ctx }) => {
      return settingsService.deleteAllData(ctx.db, ctx.user.id);
    }),

  deleteAccount: protectedProcedure
    .input(deleteAccountSchema)
    .mutation(async ({ ctx }) => {
      return settingsService.deleteAccount(ctx.db, ctx.user.id);
    }),
});
