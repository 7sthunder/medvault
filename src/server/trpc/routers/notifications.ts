import { protectedProcedure, router } from "@/server/trpc/trpc";
import { registerMissedDoseHandlers } from "@/server/domain/doseEvents/attachments";
import * as notificationsService from "@/server/domain/notifications/service";
import {
  listNotificationsSchema,
  markAllReadSchema,
  markReadSchema,
} from "@/shared/validations/notifications";

/**
 * Register missed dose notification handler into Phase 13 seam.
 * When a dose transitions to missed, patient receives an in-app missed_dose notification.
 */
registerMissedDoseHandlers(async (ctx) => {
  const { db } = await import("@/server/db/client");
  await notificationsService.createMissedDoseNotification(db, ctx);
});

export const notificationsRouter = router({
  list: protectedProcedure
    .input(listNotificationsSchema)
    .query(async ({ ctx, input }) => {
      return notificationsService.listNotifications(ctx.db, ctx.user.id, input);
    }),

  unreadCount: protectedProcedure.query(async ({ ctx }) => {
    const count = await notificationsService.getUnreadCount(ctx.db, ctx.user.id);
    return { count };
  }),

  markRead: protectedProcedure
    .input(markReadSchema)
    .mutation(async ({ ctx, input }) => {
      return notificationsService.markRead(ctx.db, ctx.user.id, input.notificationId);
    }),

  markAllRead: protectedProcedure
    .input(markAllReadSchema)
    .mutation(async ({ ctx }) => {
      return notificationsService.markAllRead(ctx.db, ctx.user.id);
    }),
});
