import { z } from "zod";

import { notificationsService } from "@/server/domain/notifications/service";
import { LIST_PAGE_SIZE } from "@/shared/constants";
import { NOTIFICATION_TABS } from "@/shared/enums";

import { protectedProcedure, router } from "../trpc";

/**
 * Phase 16 — notifications router (§10.7/§11.13). All reads owner-scoped; `markRead` and
 * `markAllRead` invalidate the count + list so the bell and the page stay in sync.
 */
export const notificationsRouter = router({
  /** Cursor-paginated list, unread first, grouped tabs (§11.13). */
  list: protectedProcedure
    .input(
      z.object({
        cursor: z.string().datetime().optional(),
        limit: z.number().int().min(1).max(100).optional(),
        tab: z.enum(NOTIFICATION_TABS).default("all"),
      }),
    )
    .query(async ({ ctx, input }) =>
      notificationsService.list(ctx.db, ctx.user.id, {
        cursor: input.cursor,
        limit: input.limit ?? LIST_PAGE_SIZE,
        tab: input.tab,
      }),
    ),

  /** Live badge count for the bell (§11.13). */
  unreadCount: protectedProcedure.query(async ({ ctx }) => notificationsService.unreadCount(ctx.db, ctx.user.id)),

  markRead: protectedProcedure
    .input(z.object({ notificationId: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      await notificationsService.markRead(ctx.db, ctx.user.id, input.notificationId);
      return { ok: true };
    }),

  markAllRead: protectedProcedure.mutation(async ({ ctx }) => {
    await notificationsService.markAllRead(ctx.db, ctx.user.id);
    return { ok: true };
  }),
});