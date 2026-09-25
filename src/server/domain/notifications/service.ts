/**
 * Phase 16 — notifications domain (§10.7). Single writer `create()` that gates on the
 * user's `notificationPrefs`, dedupes per entity (once-per-`entityId`), then fans out to
 * the registered channels. Reads (list/unread/markRead/markAllRead) are owner-scoped.
 */

import { and, count, desc, eq, isNull, lt, or, sql } from "drizzle-orm";

import type { DbClient } from "@/server/db/helpers";
import { notifications, userPreferences } from "@/server/db/schema";
import { LIST_PAGE_SIZE } from "@/shared/constants";
import type { NotificationTab, NotificationType } from "@/shared/enums";
import type { NotifDTO, NotificationPrefs, UnreadCountDTO } from "@/shared/types";

import { defaultChannels, type NotificationChannel, type NotificationInput } from "./channels";

/** Which `notificationPrefs` flag gates each notification type (§10.7 preference gating). */
const PREF_GATE: Partial<Record<NotificationType, keyof NotificationPrefs>> = {
  upcoming_dose: "doseReminders",
  due_dose: "doseReminders",
  missed_dose: "doseReminders",
  caregiver_alert: "caregiverMissedAlerts",
  insight: "insights",
};

/** `NotificationTab` → the `NotificationType` set backing it (§11.13 tabs). */
const TAB_TYPES: Record<NotificationTab, NotificationType[] | null> = {
  all: null,
  dose: ["upcoming_dose", "due_dose", "missed_dose"],
  caregiver: ["caregiver_alert"],
  ai: ["insight"],
  system: ["system", "demo"],
};

export function isNotifTab(value: string): value is NotificationTab {
  return value === "all" || value === "dose" || value === "caregiver" || value === "ai" || value === "system";
}

export interface NotificationsList {
  items: NotifDTO[];
  nextCursor: string | null;
}

/** Owner-scoped read helpers reused by the notifications router (unread count, tab filter). */
function toDTO(row: typeof notifications.$inferSelect): NotifDTO {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    body: row.body,
    entityType: row.entityType as NotifDTO["entityType"],
    entityId: row.entityId,
    readAt: row.readAt,
    createdAt: row.createdAt,
  };
}

function typeFilter(tab: NotificationTab) {
  const types = TAB_TYPES[tab];
  return types ? or(...types.map((t) => eq(notifications.type, t))) : undefined;
}

export const notificationsService = {
  /**
   * §10.7 single writer. Preference-gated + deduped (once per `type`+`entityId`); fans out
   * over `channels`. Returns `false` when a gate/dedupe suppressed the row, `true` when inserted.
   */
  async create(
    db: DbClient,
    input: NotificationInput,
    channels: readonly NotificationChannel[] = defaultChannels,
    prefsOverride?: NotificationPrefs,
  ): Promise<boolean> {
    const prefs = prefsOverride ?? (await loadPrefs(db, input.userId));
    const gate = PREF_GATE[input.type];
    if (gate && prefs[gate] === false) return false;

    if (
      input.entityId &&
      (input.type === "missed_dose" || input.type === "due_dose" || input.type === "caregiver_alert")
    ) {
      const [existing] = await db
        .select({ id: notifications.id })
        .from(notifications)
        .where(
          and(
            eq(notifications.userId, input.userId),
            eq(notifications.type, input.type),
            eq(notifications.entityId, input.entityId),
          ),
        )
        .limit(1);
      if (existing) return false;
    }

    for (const channel of channels) {
      await channel.deliver(db, input);
    }
    return true;
  },

  /** List, unread-first then newest, cursor-paginated (§10.7). */
  async list(
    db: DbClient,
    userId: string,
    opts: { cursor?: string; limit?: number; tab?: NotificationTab } = {},
  ): Promise<NotificationsList> {
    const limit = opts.limit ?? LIST_PAGE_SIZE;
    const conditions = [eq(notifications.userId, userId)];
    const types = opts.tab && opts.tab !== "all" ? typeFilter(opts.tab) : undefined;
    if (types) conditions.push(types);
    if (opts.cursor) conditions.push(lt(notifications.createdAt, new Date(opts.cursor)));

    const rows = await db
      .select()
      .from(notifications)
      .where(and(...conditions))
      .orderBy(sql`${notifications.readAt} is null desc`, desc(notifications.createdAt))
      .limit(limit + 1);

    const items = rows.slice(0, limit).map(toDTO);
    const nextCursor = rows.length > limit ? new Date(items[items.length - 1]!.createdAt).toISOString() : null;
    return { items, nextCursor };
  },

  async unreadCount(db: DbClient, userId: string): Promise<UnreadCountDTO> {
    const [row] = await db
      .select({ count: count() })
      .from(notifications)
      .where(and(eq(notifications.userId, userId), isNull(notifications.readAt)));
    return { count: Number(row?.count ?? 0) };
  },

  /** Owner-scoped mark-read; missing/foreign rows are no-ops (idempotent). */
  async markRead(db: DbClient, userId: string, notificationId: string): Promise<void> {
    await db
      .update(notifications)
      .set({ readAt: new Date() })
      .where(and(eq(notifications.id, notificationId), eq(notifications.userId, userId), isNull(notifications.readAt)));
  },

  async markAllRead(db: DbClient, userId: string): Promise<void> {
    await db
      .update(notifications)
      .set({ readAt: new Date() })
      .where(and(eq(notifications.userId, userId), isNull(notifications.readAt)));
  },
};

async function loadPrefs(db: DbClient, userId: string): Promise<NotificationPrefs> {
  const [row] = await db
    .select({ notificationPrefs: userPreferences.notificationPrefs })
    .from(userPreferences)
    .where(eq(userPreferences.userId, userId))
    .limit(1);
  const prefs = row?.notificationPrefs as Partial<NotificationPrefs> | undefined;
  return {
    doseReminders: prefs?.doseReminders ?? true,
    caregiverMissedAlerts: prefs?.caregiverMissedAlerts ?? true,
    insights: prefs?.insights ?? true,
    sounds: prefs?.sounds ?? true,
  };
}