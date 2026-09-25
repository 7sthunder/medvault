import { BellRing, CalendarClock, HeartPulse, Lightbulb, Megaphone, Siren, Sparkles } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import type { NotificationType } from "@/shared/enums";

export interface NotificationTypeUi {
  icon: LucideIcon;
  /** Icon tile tint + text tint for the ListRow/NotificationRow accent. */
  tile: string;
}

/** Per-type presentation atoms used by the bell dropdown + `/notifications` page. */
export const NOTIFICATION_TYPE_UI: Record<NotificationType, NotificationTypeUi> = {
  upcoming_dose: { icon: CalendarClock, tile: "bg-cyan-tint text-cyan-600" },
  due_dose: { icon: BellRing, tile: "bg-amber-tint text-amber-600" },
  missed_dose: { icon: Siren, tile: "bg-red-tint text-red" },
  caregiver_alert: { icon: HeartPulse, tile: "bg-violet-tint text-violet-600" },
  system: { icon: Megaphone, tile: "bg-muted text-ink-500" },
  insight: { icon: Lightbulb, tile: "bg-emerald-tint text-emerald-700" },
  demo: { icon: Sparkles, tile: "bg-magenta-tint text-magenta-700" },
};

/**
 * Where a notification's tap should take the user by entity type (§11.13 per-row link).
 * Falls back to `/notifications` when the target route isn't built yet.
 */
export function notificationHref(entityType: NonNullable<import("@/shared/types").NotifDTO["entityType"]> | null, entityId: string | null): string {
  if (entityId) {
    if (entityType === "doseEvent") return `/schedule/${entityId}`;
    if (entityType === "medication") return `/medications/${entityId}`;
    if (entityType === "caregiverAlert") return `/caregiver/alerts/${entityId}`;
    if (entityType === "insight") return "/insights";
  }
  return "/notifications";
}