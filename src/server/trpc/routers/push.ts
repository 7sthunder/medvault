import { z } from "zod";

import { publicVapidKey } from "@/server/domain/push/server";
import {
  deleteSubscription,
  deleteSubscriptionsForUser,
  saveSubscription,
} from "@/server/domain/push/store";
import { headers } from "next/headers";

import { protectedProcedure, router } from "../trpc";

/**
 * Web push router (§10.7 `webPush` channel). `subscribe` stores the browser's PushSubscription so
 * `webPushChannel` can reach the device later; `unsubscribe` revokes it. `publicKey` exposes the
 * VAPID public key, which is safe to ship to the browser.
 */
export const pushRouter = router({
  /** VAPID public key + whether this origin can use push at all. */
  publicKey: protectedProcedure.query(async () => {
    const publicKey = publicVapidKey();
    return { publicKey, enabled: publicKey !== null };
  }),

  /** Register this browser's push subscription against the signed-in user. */
  subscribe: protectedProcedure
    .input(
      z.object({
        endpoint: z.string().url().max(2048),
        keys: z.object({ p256dh: z.string().min(1).max(512), auth: z.string().min(1).max(512) }),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const headerList = await headers();
      const userAgent = headerList.get("user-agent");
      await saveSubscription(ctx.db, ctx.user.id, { ...input, userAgent });
      return { ok: true };
    }),

  /** Revoke a single device (this browser). */
  unsubscribe: protectedProcedure
    .input(z.object({ endpoint: z.string().url().max(2048) }))
    .mutation(async ({ ctx, input }) => {
      await deleteSubscription(ctx.db, input.endpoint);
      return { ok: true };
    }),

  /** Revoke every device for the signed-in user ("turn push off"). */
  unsubscribeAll: protectedProcedure.mutation(async ({ ctx }) => {
    const removed = await deleteSubscriptionsForUser(ctx.db, ctx.user.id);
    return { ok: true, removed };
  }),
});
