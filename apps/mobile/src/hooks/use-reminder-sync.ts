import { useCallback, useEffect, useRef, useState } from "react";
import { AppState, Platform } from "react-native";

import { planReminders, requestPermission, syncReminders } from "@/lib/notifications";
import type { PermissionState } from "@/lib/notifications";
import { api } from "@/lib/trpc";
import { useSession } from "@/providers/session-provider";

/**
 * Keeps the device's scheduled reminders in step with the server schedule.
 *
 * Triggers on: sign-in, schedule/medication changes, and every app foreground. The
 * foreground pass matters most — the window is a rolling 14 days, so a user who opens the
 * app weekly still has current reminders, and one who never opens it eventually stops
 * getting them (which is the correct failure mode for a stale regimen; re-opening is the
 * prompt to re-check).
 *
 * Permission is requested on the first successful sync rather than at launch: asking for
 * notifications before the user has seen a single dose is the fastest way to a permanent
 * denial.
 */
export function useReminderSync(): {
  permission: PermissionState;
  scheduledCount: number | null;
  refresh: () => void;
} {
  const { isAuthenticated, user } = useSession();
  const timezone = user?.timezone ?? "UTC";
  const [permission, setPermission] = useState<PermissionState>("undetermined");
  const [scheduledCount, setScheduledCount] = useState<number | null>(null);
  const lastSyncedDay = useRef<string | null>(null);

  const medications = api.medication.list.useQuery(undefined, { enabled: isAuthenticated });

  const sync = useCallback(async () => {
    if (!isAuthenticated) return;
    const state = await requestPermission();
    setPermission(state);
    if (state !== "granted") {
      setScheduledCount(0);
      return;
    }
    const meds = medications.data?.medications ?? [];
    const count = await syncReminders(planReminders(meds, timezone));
    setScheduledCount(count);
    lastSyncedDay.current = new Date().toISOString().slice(0, 10);
  }, [isAuthenticated, medications.data?.medications, timezone]);

  // Sign-in, and any change to the medication/schedule set, re-syncs.
  useEffect(() => {
    if (!isAuthenticated || !medications.data) return;
    void sync();
    // `lastSyncedDay` is intentionally excluded: this effect is about data changes, the
    // foreground pass below is about time passing.
  }, [isAuthenticated, medications.data, sync]);

  // Foreground pass — the window has to slide even when nothing changed server-side.
  useEffect(() => {
    if (!isAuthenticated) return;
    if (Platform.OS === "web") return;

    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active" && lastSyncedDay.current !== new Date().toISOString().slice(0, 10)) {
        void sync();
      }
    });
    return () => subscription.remove();
  }, [isAuthenticated, sync]);

  return { permission, scheduledCount, refresh: () => void sync() };
}
