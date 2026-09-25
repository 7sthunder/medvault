/**
 * Phase 16 — notification channels (§10.7). An in-app channel writes the `notifications`
 * row; a console channel logs in dev. The extension point (`email`, `webPush`) lets a future
 * channel plug in without touching the business logic in `service.ts`.
 */

import type { DbClient } from "@/server/db/helpers";
import { notifications } from "@/server/db/schema";
import { log } from "@/lib/log";
import type { NotificationType } from "@/shared/enums";
import type { NotifDTO } from "@/shared/types";

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

/** Default channel set for `notifications.create` (override in tests). */
export const defaultChannels: NotificationChannel[] = [inAppChannel, consoleChannel];
