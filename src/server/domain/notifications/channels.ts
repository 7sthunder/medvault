/**
 * Phase 16 — notification channels (§10.7). An in-app channel writes the `notifications`
 * row; a console channel logs in dev. The extension point (`email`, `webPush`) lets a future
 * channel plug in without touching the business logic in `service.ts`.
 */

import type { DbClient } from "@/server/db/helpers";
import { notifications } from "@/server/db/schema";
import { log } from "@/lib/log";
import { isPushConfigured, sendPush } from "@/server/domain/push/server";
import {
  deleteSubscription,
  isDemoUser,
  listSubscriptions,
} from "@/server/domain/push/store";
import type { NotificationType } from "@/shared/enums";
import type { NotifDTO } from "@/shared/types";

/** Deep link a pushed notification opens, mirroring the in-app `notificationHref` mapping. */
function pushTargetHref(
  entityType: NotifDTO["entityType"] | undefined,
  entityId?: string | null,
): string {
  const id = entityId ?? "";
  switch (entityType) {
    case "doseEvent":
      return "/schedule";
    case "medication":
      return `/medications/${id}`;
    case "caregiverAlert":
      return "/caregiver";
    case "insight":
      return "/insights";
    default:
      return "/notifications";
  }
}

export interface NotificationInput {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  entityType?: NotifDTO["entityType"];
  entityId?: string | null;
  createdAt?: Date;
}

/** A channel that persists or forwards a notification after it clears gating/dedupe. */
export interface NotificationChannel {
  name: string;
  deliver: (db: DbClient, input: NotificationInput) => Promise<void> | void;
}

/** Persist the row — the authoritative sink every `notifications.create` writes to. */
export const inAppChannel: NotificationChannel = {
  name: "in-app",
  deliver: async (db, input) => {
    await db.insert(notifications).values({
      id: crypto.randomUUID(),
      userId: input.userId,
      type: input.type,
      title: input.title,
      body: input.body,
      entityType: input.entityType ?? null,
      entityId: input.entityId ?? null,
      readAt: null,
      createdAt: input.createdAt ?? new Date(),
    });
  },
};

/** Dev-only mirror so producers are observable without opening the app. */
export const consoleChannel: NotificationChannel = {
  name: "console",
  deliver: (_db, input) => {
    if (process.env.NODE_ENV !== "production") {
      log.debug("Notification mirrored", { type: input.type });
    }
  },
};

/**
 * Web push channel — the `webPush` extension point the header comment describes. Fans out to
 * every browser/device the user granted the push permission on, so a notification reaches them
 * with the app closed. Delivery is best-effort and MUST NOT break the in-app row, so every
 * failure is swallowed here rather than propagated into `create()`.
 *
 * Ordering note: it is appended after `inAppChannel`, so if a push send ever rejected, the
 * authoritative in-app row is already committed.
 */
export const webPushChannel: NotificationChannel = {
  name: "web-push",
  deliver: async (db, input) => {
    if (!isPushConfigured()) return;

    // Fan out first: the overwhelming majority of users have no subscription, and this keeps the
    // demo check off the hot path entirely.
    const subscriptions = await listSubscriptions(db, input.userId);
    if (subscriptions.length === 0) return;

    // Demo workspaces run on a simulated clock — never fire a real push for simulated time.
    if (await isDemoUser(db, input.userId)) return;

    const results = await Promise.all(
      subscriptions.map(async (subscription) => ({
        subscription,
        result: await sendPush(subscription, {
          title: input.title,
          body: input.body,
          tag: input.entityId ?? undefined,
          url: pushTargetHref(input.entityType, input.entityId),
        }),
      })),
    );

    // A 404/410 means the push service dropped the endpoint for good — reap the row so the
    // fan-out does not keep paying for a dead subscription.
    for (const { subscription, result } of results) {
      if (result.status === "gone") {
        await deleteSubscription(db, subscription.endpoint).catch(() => void 0);
      }
    }

    const sent = results.filter((r) => r.result.status === "sent").length;
    if (sent > 0) {
      log.debug("Push delivered", { type: input.type, devices: sent });
    }
  },
};

/** Default channel set for `notifications.create` (override in tests). */
export const defaultChannels: NotificationChannel[] = [inAppChannel, consoleChannel, webPushChannel];
