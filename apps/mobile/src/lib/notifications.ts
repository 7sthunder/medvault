import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

import { expandSchedule } from "@shared/calc/schedule";
import type { MedicationDTO } from "@shared/types";
import { addLocalDays, localDateKey } from "@shared/times";

/**
 * Medication reminders on a phone.
 *
 * ── Why these are LOCAL notifications ──────────────────────────────────────────
 * Expo Go cannot receive remote push (SDK 53+ removed it), so the device cannot be told
 * about a dose by the server. Instead the app schedules each upcoming dose *on the
 * device* and the OS wakes it up. For a medication app this is arguably the better
 * mechanism anyway:
 *   - it fires with no network and no server uptime, which is when you most need it;
 *   - a dose reminder is per-device by nature — you do not want your phone buzzing for
 *     someone else's regimen, and there is no cross-device push state to get wrong;
 *   - snoozing a reminder stays on the device, so it survives the app being killed.
 *
 * The web app keeps its VAPID web-push path untouched for browser users. Same schedule,
 * two delivery mechanisms, one source of truth (the `schedule` table).
 *
 * ── Why a rolling window ───────────────────────────────────────────────────────
 * iOS caps an app at 64 pending local notifications, and scheduling a year out would blow
 * that instantly. So we schedule a rolling window (default 14 days) and re-sync whenever
 * the app is opened or the schedule changes. Resyncing is cheap and idempotent: every
 * sync clears the previously scheduled set first.
 */

const CHANNEL_ID = "medication-reminders";

/** Days of schedule to keep scheduled on the device. */
export const REMINDER_WINDOW_DAYS = 14;

/** Hard ceiling well under iOS's 64-notification cap, leaving room for snoozes. */
const MAX_PENDING = 48;

let handlerConfigured = false;

/**
 * Foreground presentation. Without this, a reminder that fires while the app is open is
 * silently dropped on Android.
 */
export function configureNotifications(): void {
  if (handlerConfigured) return;
  handlerConfigured = true;

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });

  if (Platform.OS === "android") {
    // Must exist before the first schedule on Android 8+; without a channel the
    // notification is never shown at all.
    void Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: "Medication reminders",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#10b981",
      sound: "default",
    });
  }
}

export type PermissionState = "granted" | "denied" | "undetermined";

export async function getPermission(): Promise<PermissionState> {
  configureNotifications();
  const { status } = await Notifications.getPermissionsAsync();
  if (status === "granted") return "granted";
  if (status === "denied") return "denied";
  return "undetermined";
}

/** Ask for notification permission. Safe to call repeatedly — the OS only prompts once. */
export async function requestPermission(): Promise<PermissionState> {
  configureNotifications();
  const current = await getPermission();
  if (current !== "undetermined") return current;

  const { status } = await Notifications.requestPermissionsAsync();
  if (status === "granted") return "granted";
  return status === "denied" ? "denied" : "undetermined";
}

export interface ReminderPlanEntry {
  /** Stable id so a resync produces the same identifiers. */
  id: string;
  title: string;
  body: string;
  /** When to fire. */
  date: Date;
  doseEventId: string | null;
}

function dosageLabel(med: MedicationDTO): string {
  return `${med.dosageAmount} ${med.dosageUnit}`.trim();
}

/**
 * Turn the medication list into concrete reminder instants.
 *
 * Uses the *shared* `expandSchedule` generator rather than re-deriving weekday maths on
 * the client, so the phone and the server agree on exactly which doses exist — a
 * reminder for a dose the server never creates would be worse than no reminder at all.
 */
export function planReminders(
  medications: readonly MedicationDTO[],
  timeZone: string,
  from = new Date(),
  days = REMINDER_WINDOW_DAYS,
): ReminderPlanEntry[] {
  const fromKey = localDateKey(from, timeZone);
  const toKey = localDateKey(addLocalDays(from, days, timeZone), timeZone);

  const entries: ReminderPlanEntry[] = [];

  for (const med of medications) {
    if (med.status !== "active") continue;

    const doses = expandSchedule(
      {
        id: med.id,
        dosageAmount: med.dosageAmount,
        startDate: med.startDate,
        endDate: med.endDate,
      },
      med.slots,
      fromKey,
      toKey,
      timeZone,
    );

    for (const dose of doses) {
      if (dose.scheduledFor.getTime() <= from.getTime()) continue;
      entries.push({
        id: `dose-${med.id}-${dose.scheduleId}-${dose.scheduledFor.toISOString()}`,
        title: `Time for ${med.name}`,
        body: `${dosageLabel(med)} · ${med.instructions ?? "Take as scheduled"}`.trim(),
        date: dose.scheduledFor,
        doseEventId: null,
      });
    }
  }

  entries.sort((a, b) => a.date.getTime() - b.date.getTime());
  return entries.slice(0, MAX_PENDING);
}

/**
 * Replace every scheduled medication reminder with `entries`.
 *
 * Clear-then-add rather than diffing: the window slides forward on every open, and
 * matching old ids to new ones would mean persisting the previous plan to compare
 * against — a lot of state to save a handful of `scheduleNotificationAsync` calls.
 */
export async function syncReminders(entries: readonly ReminderPlanEntry[]): Promise<number> {
  configureNotifications();

  if ((await getPermission()) !== "granted") return 0;

  await Notifications.cancelAllScheduledNotificationsAsync();

  let scheduled = 0;
  for (const entry of entries) {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: entry.title,
          body: entry.body,
          data: { doseEventId: entry.doseEventId, kind: "dose-reminder" },
          ...(Platform.OS === "android" ? { channelId: CHANNEL_ID } : null),
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: entry.date,
          ...(Platform.OS === "android" ? { channelId: CHANNEL_ID } : null),
        },
      });
      scheduled += 1;
    } catch {
      // One bad entry must not abort the rest of the window — a phone that misses one
      // reminder is better than one that silently loses all of them.
    }
  }
  return scheduled;
}

export async function cancelAllReminders(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

/** Diagnostics for the Settings → Reminders screen. */
export async function pendingCount(): Promise<number> {
  return (await Notifications.getAllScheduledNotificationsAsync()).length;
}
