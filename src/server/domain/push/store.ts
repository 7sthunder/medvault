/**
 * Push subscription persistence. One row per granted browser/device; the endpoint is the natural
 * key so re-subscribing (which happens on every page load, and after any VAPID rotation) is an
 * upsert rather than an ever-growing pile of duplicates.
 */

import { eq } from "drizzle-orm";

import type { DbClient } from "@/server/db/helpers";
import { uuidv7 } from "@/server/db/helpers";
import { demoStates, pushSubscriptions } from "@/server/db/schema";

export interface SubscriptionInput {
  endpoint: string;
  keys: { p256dh: string; auth: string };
  userAgent?: string | null;
}

/** Register (or re-register) a subscription for `userId`. */
export async function saveSubscription(
  db: DbClient,
  userId: string,
  input: SubscriptionInput,
): Promise<{ id: string }> {
  const now = new Date();
  const [row] = await db
    .insert(pushSubscriptions)
    .values({
      id: uuidv7(),
      userId,
      endpoint: input.endpoint,
      p256dh: input.keys.p256dh,
      auth: input.keys.auth,
      userAgent: input.userAgent ?? null,
      createdAt: now,
      lastUsedAt: now,
    })
    .onConflictDoUpdate({
      target: pushSubscriptions.endpoint,
      set: {
        // Re-point the endpoint at whoever owns it now, so signing in as another account on the
        // same browser never leaves a stale owner's row receiving pushes.
        userId,
        p256dh: input.keys.p256dh,
        auth: input.keys.auth,
        userAgent: input.userAgent ?? null,
        lastUsedAt: now,
      },
    })
    .returning({ id: pushSubscriptions.id });
  return { id: row!.id };
}

/** Every active subscription for a user (fan-out target). */
export async function listSubscriptions(db: DbClient, userId: string) {
  return db
    .select({
      id: pushSubscriptions.id,
      endpoint: pushSubscriptions.endpoint,
      p256dh: pushSubscriptions.p256dh,
      auth: pushSubscriptions.auth,
    })
    .from(pushSubscriptions)
    .where(eq(pushSubscriptions.userId, userId));
}

/** Drop a single subscription by endpoint (used on 404/410 and on explicit opt-out). */
export async function deleteSubscription(db: DbClient, endpoint: string): Promise<void> {
  await db.delete(pushSubscriptions).where(eq(pushSubscriptions.endpoint, endpoint));
}

/** Drop every subscription for a user (settings toggle: turn push off everywhere). */
export async function deleteSubscriptionsForUser(db: DbClient, userId: string): Promise<number> {
  const deleted = await db
    .delete(pushSubscriptions)
    .where(eq(pushSubscriptions.userId, userId))
    .returning({ id: pushSubscriptions.id });
  return deleted.length;
}

/**
 * True when the user owns a demo workspace. Demo sessions run on a simulated clock, and the
 * user's instruction is that demo stays in-app: never send a real push for simulated time.
 */
export async function isDemoUser(db: DbClient, userId: string): Promise<boolean> {
  const found = await db
    .select({ userId: demoStates.userId })
    .from(demoStates)
    .where(eq(demoStates.userId, userId))
    .limit(1);
  return found.length > 0;
}

export const pushSubscriptionStore = {
  saveSubscription,
  listSubscriptions,
  deleteSubscription,
  deleteSubscriptionsForUser,
  isDemoUser,
};
