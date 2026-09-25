import { and, count, desc, eq, inArray, isNull, lt } from "drizzle-orm";
import type { Db, DbTx } from "@/server/db/helpers";
import {
  medications,
  notifications,
  userPreferences,
} from "@/server/db/schema";
import type { NotificationType } from "@/shared/enums";
import { now } from "@/shared/times";
import type { NotifDTO, NotificationPrefs } from "@/shared/types";
import type { ListNotificationsInput } from "@/shared/validations/notifications";
import {
  defaultChannels,
  type NotificationChannel,
  type NotificationPayload,
} from "./channels";
import type { MissedDoseContext } from "@/server/domain/doseEvents/attachments";

/**
 * Phase 22 — Notifications domain service (plan §10.7, §11.13).
 *
 * Implements:
 * - Single writer `createNotification` with preference gating & strict entity deduplication.
 * - Multi-channel delivery (in-app + console).
 * - Filterable queries by tab (all, dose, caregiver, ai, system) and unread state.
 * - Cursor pagination, unread count caching/querying, mark-as-read actions.
 */

export interface CreateNotificationOptions {
  channels?: NotificationChannel[];
  bypassPreferences?: boolean;
}

/**
 * Creates a notification, enforcing:
 * 1. User notification preference gating.
 * 2. Strict entity deduplication per (userId, entityType, entityId, type).
 * 3. Channel delivery.
 */
export async function createNotification(
  db: Db | DbTx,
  payload: NotificationPayload,
  options?: CreateNotificationOptions,
): Promise<NotifDTO | null> {
  // 1. Preference Gating Check
  if (!options?.bypassPreferences) {
    const [prefsRow] = await db
      .select({ notificationPrefs: userPreferences.notificationPrefs })
      .from(userPreferences)
      .where(eq(userPreferences.userId, payload.userId))
      .limit(1);

    const prefs = (prefsRow?.notificationPrefs ?? {}) as Partial<NotificationPrefs>;

    if (
      ["upcoming_dose", "due_dose", "missed_dose"].includes(payload.type) &&
      prefs.doseReminders === false
    ) {
      return null;
    }

    if (payload.type === "caregiver_alert" && prefs.caregiverMissedAlerts === false) {
      return null;
    }

    if (payload.type === "insight" && prefs.insights === false) {
      return null;
    }
  }

  // 2. Strict Entity Deduplication
  if (payload.entityId && payload.entityType) {
    const [existing] = await db
      .select()
      .from(notifications)
      .where(
        and(
          eq(notifications.userId, payload.userId),
          eq(notifications.type, payload.type),
          eq(notifications.entityType, payload.entityType),
          eq(notifications.entityId, payload.entityId),
        ),
      )
      .limit(1);

    if (existing) {
      return {
        id: existing.id,
        type: existing.type,
        title: existing.title,
        body: existing.body,
        entityType: existing.entityType as NotifDTO["entityType"],
        entityId: existing.entityId,
        readAt: existing.readAt,
        createdAt: existing.createdAt,
      };
    }
  }

  // 3. Channel Delivery
  const channels = options?.channels ?? defaultChannels;
  let inAppResult: NotifDTO | null = null;

  for (const channel of channels) {
    const res = await channel.deliver(db, payload);
    if (res && channel.name === "in-app") {
      inAppResult = res;
    }
  }

  return inAppResult;
}

/**
 * Hook handler for missed doses (registered into Phase 13 runMissedDoseHandlers seam).
 * Alerts the patient that they missed a scheduled dose.
 */
export async function createMissedDoseNotification(
  db: Db | DbTx,
  ctx: MissedDoseContext,
): Promise<NotifDTO | null> {
  const [med] = await db
    .select({ name: medications.name, dosageAmount: medications.dosageAmount, dosageUnit: medications.dosageUnit })
    .from(medications)
    .where(eq(medications.id, ctx.medicationId))
    .limit(1);

  const medName = med?.name || "Medication";
  const dosage = med ? ` (${med.dosageAmount} ${med.dosageUnit})` : "";

  return createNotification(db, {
    userId: ctx.userId,
    type: "missed_dose",
    title: `Missed dose: ${medName}`,
    body: `You missed your scheduled dose of ${medName}${dosage}. Take action or log details.`,
    entityType: "doseEvent",
    entityId: ctx.doseEventId,
  });
}

/**
 * Lists notifications with tab-based category grouping, unread filtering, and cursor pagination.
 */
export async function listNotifications(
  db: Db | DbTx,
  userId: string,
  filter?: ListNotificationsInput,
): Promise<{ notifications: NotifDTO[]; nextCursor: string | null }> {
  const tab = filter?.tab ?? "all";
  const unreadOnly = filter?.unreadOnly ?? false;
  const limit = filter?.limit ?? 20;

  const conditions = [eq(notifications.userId, userId)];

  if (unreadOnly) {
    conditions.push(isNull(notifications.readAt));
  }

  // Tab categorization filter (§11.13)
  if (tab === "dose") {
    conditions.push(
      inArray(notifications.type, ["upcoming_dose", "due_dose", "missed_dose"] as NotificationType[]),
    );
  } else if (tab === "caregiver") {
    conditions.push(eq(notifications.type, "caregiver_alert"));
  } else if (tab === "ai") {
    conditions.push(eq(notifications.type, "insight"));
  } else if (tab === "system") {
    conditions.push(
      inArray(notifications.type, ["system", "demo"] as NotificationType[]),
    );
  }

  if (filter?.cursor) {
    const cursorDate = new Date(filter.cursor);
    if (!Number.isNaN(cursorDate.getTime())) {
      conditions.push(lt(notifications.createdAt, cursorDate));
    }
  }

  const rows = await db
    .select()
    .from(notifications)
    .where(and(...conditions))
    .orderBy(desc(notifications.createdAt))
    .limit(limit + 1);

  const hasMore = rows.length > limit;
  const resultRows = hasMore ? rows.slice(0, limit) : rows;

  const nextCursor = hasMore && resultRows.length > 0
    ? resultRows[resultRows.length - 1]!.createdAt.toISOString()
    : null;

  return {
    notifications: resultRows.map((r) => ({
      id: r.id,
      type: r.type,
      title: r.title,
      body: r.body,
      entityType: r.entityType as NotifDTO["entityType"],
      entityId: r.entityId,
      readAt: r.readAt,
      createdAt: r.createdAt,
    })),
    nextCursor,
  };
}

/**
 * Returns total count of unread notifications for a user.
 */
export async function getUnreadCount(db: Db | DbTx, userId: string): Promise<number> {
  const [res] = await db
    .select({ total: count() })
    .from(notifications)
    .where(and(eq(notifications.userId, userId), isNull(notifications.readAt)));

  return Number(res?.total ?? 0);
}

/**
 * Marks a single notification as read.
 */
export async function markRead(
  db: Db | DbTx,
  userId: string,
  notificationId: string,
): Promise<NotifDTO> {
  const readTimestamp = now();

  const [updated] = await db
    .update(notifications)
    .set({ readAt: readTimestamp })
    .where(and(eq(notifications.id, notificationId), eq(notifications.userId, userId)))
    .returning();

  if (!updated) {
    throw new Error("Notification not found or access denied.");
  }

  return {
    id: updated.id,
    type: updated.type,
    title: updated.title,
    body: updated.body,
    entityType: updated.entityType as NotifDTO["entityType"],
    entityId: updated.entityId,
    readAt: updated.readAt,
    createdAt: updated.createdAt,
  };
}

/**
 * Marks all unread notifications as read for a given user.
 */
export async function markAllRead(
  db: Db | DbTx,
  userId: string,
): Promise<{ count: number }> {
  const readTimestamp = now();

  const result = await db
    .update(notifications)
    .set({ readAt: readTimestamp })
    .where(and(eq(notifications.userId, userId), isNull(notifications.readAt)))
    .returning({ id: notifications.id });

  return { count: result.length };
}

/**
 * Deletes a notification (dismiss action).
 */
export async function deleteNotification(
  db: Db | DbTx,
  userId: string,
  notificationId: string,
): Promise<boolean> {
  const deleted = await db
    .delete(notifications)
    .where(and(eq(notifications.id, notificationId), eq(notifications.userId, userId)))
    .returning({ id: notifications.id });

  return deleted.length > 0;
}
